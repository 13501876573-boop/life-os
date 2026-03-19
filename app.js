const STORAGE_KEYS = {
  reviews: "life-os-reviews",
  reflections: "life-os-reflections",
  timeLogs: "life-os-time-logs",
  books: "life-os-books",
  birthdays: "life-os-birthdays",
  collapsedPanels: "life-os-collapsed-panels",
  migrated: "life-os-cloud-migrated"
};

const COLLECTIONS = ["reviews", "reflections", "timeLogs", "books", "birthdays"];
const PIE_COLORS = ["#bb5a3c", "#2f6b68", "#d1a64d", "#768e56", "#4c8c9c", "#c97356", "#566172"];

const state = {
  reviews: [],
  reflections: [],
  timeLogs: [],
  books: [],
  birthdays: [],
  collapsedPanels: loadObject(STORAGE_KEYS.collapsedPanels),
  calendarMonth: startOfMonth(new Date()),
  selectedDate: getLocalDateString(new Date())
};

const els = {
  daysLeft: document.getElementById("daysLeft"),
  hoursLeft: document.getElementById("hoursLeft"),
  minutesLeft: document.getElementById("minutesLeft"),
  yearProgressText: document.getElementById("yearProgressText"),
  yearProgressBar: document.getElementById("yearProgressBar"),
  prevMonthButton: document.getElementById("prevMonthButton"),
  nextMonthButton: document.getElementById("nextMonthButton"),
  calendarMonthLabel: document.getElementById("calendarMonthLabel"),
  calendarGrid: document.getElementById("calendarGrid"),
  selectedDateTitle: document.getElementById("selectedDateTitle"),
  selectedDateSummary: document.getElementById("selectedDateSummary"),
  reviewForm: document.getElementById("reviewForm"),
  reviewDate: document.getElementById("reviewDate"),
  reviewKeep: document.getElementById("reviewKeep"),
  reviewImprove: document.getElementById("reviewImprove"),
  reviewStart: document.getElementById("reviewStart"),
  reviewStop: document.getElementById("reviewStop"),
  reviewList: document.getElementById("reviewList"),
  reflectionForm: document.getElementById("reflectionForm"),
  reflectionDate: document.getElementById("reflectionDate"),
  reflectionTitle: document.getElementById("reflectionTitle"),
  reflectionContent: document.getElementById("reflectionContent"),
  reflectionImage: document.getElementById("reflectionImage"),
  reflectionList: document.getElementById("reflectionList"),
  timeForm: document.getElementById("timeForm"),
  timeDate: document.getElementById("timeDate"),
  timeCategory: document.getElementById("timeCategory"),
  timeTask: document.getElementById("timeTask"),
  timeHours: document.getElementById("timeHours"),
  timeList: document.getElementById("timeList"),
  timeSummary: document.getElementById("timeSummary"),
  timeChart: document.getElementById("timeChart"),
  todayPieChart: document.getElementById("todayPieChart"),
  todayPieLegend: document.getElementById("todayPieLegend"),
  todayTimeSummary: document.getElementById("todayTimeSummary"),
  bookForm: document.getElementById("bookForm"),
  bookTitle: document.getElementById("bookTitle"),
  bookDate: document.getElementById("bookDate"),
  bookNotes: document.getElementById("bookNotes"),
  bookList: document.getElementById("bookList"),
  birthdayForm: document.getElementById("birthdayForm"),
  birthdayName: document.getElementById("birthdayName"),
  birthdayDate: document.getElementById("birthdayDate"),
  birthdayNote: document.getElementById("birthdayNote"),
  birthdayList: document.getElementById("birthdayList"),
  emptyStateTemplate: document.getElementById("emptyStateTemplate"),
  collapsiblePanels: document.querySelectorAll(".collapsible-panel")
};

initialize();

async function initialize() {
  setDefaultDates();
  bindEvents();
  initializePanels();
  updateCountdown();
  renderAll();
  setInterval(updateCountdown, 60000);
  await bootstrapRemoteData();
}

function setDefaultDates() {
  const today = getLocalDateString(new Date());
  [els.reviewDate, els.reflectionDate, els.timeDate, els.bookDate].forEach((input) => {
    input.value = today;
  });
}

function bindEvents() {
  els.reviewForm.addEventListener("submit", handleReviewSubmit);
  els.reflectionForm.addEventListener("submit", handleReflectionSubmit);
  els.timeForm.addEventListener("submit", handleTimeSubmit);
  els.bookForm.addEventListener("submit", handleBookSubmit);
  els.birthdayForm.addEventListener("submit", handleBirthdaySubmit);
  els.prevMonthButton.addEventListener("click", () => shiftCalendarMonth(-1));
  els.nextMonthButton.addEventListener("click", () => shiftCalendarMonth(1));
  window.addEventListener("resize", () => {
    drawTimeChart();
    drawTodayPieChart();
  });
}

function initializePanels() {
  els.collapsiblePanels.forEach((panel) => {
    const panelId = panel.dataset.panelId;
    const button = panel.querySelector(".toggle-button");
    const collapsed = Boolean(state.collapsedPanels[panelId]);
    setPanelCollapsed(panel, button, collapsed);
    button.addEventListener("click", () => {
      const nextCollapsed = !panel.classList.contains("is-collapsed");
      state.collapsedPanels[panelId] = nextCollapsed;
      persistLocal(STORAGE_KEYS.collapsedPanels, state.collapsedPanels);
      setPanelCollapsed(panel, button, nextCollapsed);
    });
  });
}

function setPanelCollapsed(panel, button, collapsed) {
  panel.classList.toggle("is-collapsed", collapsed);
  button.setAttribute("aria-expanded", String(!collapsed));
  button.textContent = collapsed ? "展开" : "折叠";
}

async function bootstrapRemoteData() {
  try {
    const remote = await apiGet("/api/state");
    applyRemoteState(remote);
    await maybeImportLegacyLocalData(remote);
    renderAll();
  } catch (error) {
    console.error(error);
    els.selectedDateSummary.innerHTML = "<p>服务器暂时不可用，请稍后刷新。</p>";
  }
}

async function maybeImportLegacyLocalData(remote) {
  const alreadyMigrated = localStorage.getItem(STORAGE_KEYS.migrated) === "true";
  const remoteHasData = COLLECTIONS.some((key) => Array.isArray(remote[key]) && remote[key].length);
  const legacy = getLegacyLocalData();
  const localHasData = COLLECTIONS.some((key) => legacy[key].length);

  if (alreadyMigrated || remoteHasData || !localHasData) {
    return;
  }

  const imported = await apiPost("/api/import", legacy);
  applyRemoteState(imported);
  localStorage.setItem(STORAGE_KEYS.migrated, "true");
}

function getLegacyLocalData() {
  return {
    reviews: loadArray(STORAGE_KEYS.reviews),
    reflections: loadArray(STORAGE_KEYS.reflections),
    timeLogs: loadArray(STORAGE_KEYS.timeLogs),
    books: loadArray(STORAGE_KEYS.books),
    birthdays: loadArray(STORAGE_KEYS.birthdays)
  };
}

function applyRemoteState(remote) {
  state.reviews = Array.isArray(remote.reviews) ? remote.reviews : [];
  state.reflections = Array.isArray(remote.reflections) ? remote.reflections : [];
  state.timeLogs = Array.isArray(remote.timeLogs) ? remote.timeLogs : [];
  state.books = Array.isArray(remote.books) ? remote.books : [];
  state.birthdays = Array.isArray(remote.birthdays) ? remote.birthdays : [];
}

async function handleReviewSubmit(event) {
  event.preventDefault();
  const record = await apiPost("/api/reviews", {
    date: els.reviewDate.value,
    keep: els.reviewKeep.value.trim(),
    improve: els.reviewImprove.value.trim(),
    start: els.reviewStart.value.trim(),
    stop: els.reviewStop.value.trim()
  });
  state.reviews.unshift(record);
  els.reviewForm.reset();
  setDefaultDates();
  renderCalendar();
  renderReviews();
}

async function handleReflectionSubmit(event) {
  event.preventDefault();
  const file = els.reflectionImage.files[0];
  const image = file ? await readAsDataURL(file) : "";
  const record = await apiPost("/api/reflections", {
    date: els.reflectionDate.value,
    title: els.reflectionTitle.value.trim() || "未命名感悟",
    content: els.reflectionContent.value.trim(),
    image
  });
  state.reflections.unshift(record);
  els.reflectionForm.reset();
  setDefaultDates();
  renderCalendar();
  renderReflections();
}

async function handleTimeSubmit(event) {
  event.preventDefault();
  const record = await apiPost("/api/timeLogs", {
    date: els.timeDate.value,
    category: els.timeCategory.value.trim() || "未分类",
    task: els.timeTask.value.trim() || "未命名任务",
    hours: Number(els.timeHours.value)
  });
  state.timeLogs.unshift(record);
  els.timeForm.reset();
  setDefaultDates();
  renderCalendar();
  renderTimeLogs();
}

async function handleBookSubmit(event) {
  event.preventDefault();
  const record = await apiPost("/api/books", {
    title: els.bookTitle.value.trim(),
    date: els.bookDate.value,
    notes: els.bookNotes.value.trim()
  });
  state.books.unshift(record);
  els.bookForm.reset();
  setDefaultDates();
  renderCalendar();
  renderBooks();
}

async function handleBirthdaySubmit(event) {
  event.preventDefault();
  const record = await apiPost("/api/birthdays", {
    name: els.birthdayName.value.trim(),
    date: els.birthdayDate.value,
    note: els.birthdayNote.value.trim()
  });
  state.birthdays.unshift(record);
  els.birthdayForm.reset();
  renderBirthdays();
}

function renderAll() {
  renderCalendar();
  renderReviews();
  renderReflections();
  renderTimeLogs();
  renderBooks();
  renderBirthdays();
}

function renderCalendar() {
  const monthDate = state.calendarMonth;
  els.calendarMonthLabel.textContent = new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "long"
  }).format(monthDate);

  const firstDay = startOfMonth(monthDate);
  const gridStart = startOfCalendarGrid(firstDay);
  const dayEntries = getCalendarEntriesByDate();
  const today = getLocalDateString(new Date());
  const cells = [];

  for (let index = 0; index < 42; index += 1) {
    const current = addDays(gridStart, index);
    const dateKey = getLocalDateString(current);
    const notes = dayEntries[dateKey] || [];
    const preview = notes.slice(0, 3);
    const isCurrentMonth = current.getMonth() === monthDate.getMonth();
    const isSelected = dateKey === state.selectedDate;
    const classNames = [
      "calendar-day",
      !isCurrentMonth ? "is-outside" : "",
      dateKey === today ? "is-today" : "",
      isSelected ? "is-selected" : ""
    ].filter(Boolean).join(" ");

    cells.push(`
      <button type="button" class="${classNames}" data-date="${dateKey}">
        <div class="calendar-date">
          <strong>${current.getDate()}</strong>
          <span class="calendar-count">${notes.length ? `${notes.length} 条` : ""}</span>
        </div>
        <div class="calendar-notes">
          ${preview.map((item) => `<span class="calendar-note is-${item.type}">${escapeHtml(item.label)}</span>`).join("")}
          ${notes.length > preview.length ? `<span class="calendar-more">还有 ${notes.length - preview.length} 条...</span>` : ""}
        </div>
      </button>
    `);
  }

  els.calendarGrid.innerHTML = cells.join("");
  els.calendarGrid.querySelectorAll(".calendar-day").forEach((button) => {
    button.addEventListener("click", () => {
      state.selectedDate = button.dataset.date;
      renderCalendar();
    });
  });
  renderSelectedDateSummary(dayEntries[state.selectedDate] || []);
}

function renderSelectedDateSummary(entries) {
  els.selectedDateTitle.textContent = `${formatDate(state.selectedDate)} 详情`;
  if (!entries.length) {
    els.selectedDateSummary.innerHTML = "<p>这一天还没有记录。</p>";
    return;
  }

  els.selectedDateSummary.innerHTML = entries.map((item) => `
    <p><strong>${escapeHtml(item.title)}:</strong> ${escapeHtml(item.detail)}</p>
  `).join("");
}

function renderReviews() {
  renderEntries(els.reviewList, [...state.reviews].sort(byDateDesc), (item) => `
    <article class="entry-card">
      <p class="entry-meta">${formatDate(item.date)}</p>
      <p><strong>Keep:</strong> ${escapeHtml(item.keep || "暂无")}</p>
      <p><strong>Improve:</strong> ${escapeHtml(item.improve || "暂无")}</p>
      <p><strong>Start:</strong> ${escapeHtml(item.start || "暂无")}</p>
      <p><strong>Stop:</strong> ${escapeHtml(item.stop || "暂无")}</p>
    </article>
  `);
}

function renderReflections() {
  renderEntries(els.reflectionList, [...state.reflections].sort(byDateDesc), (item) => `
    <article class="entry-card">
      <p class="entry-meta">${formatDate(item.date)}</p>
      <h3>${escapeHtml(item.title)}</h3>
      <p>${escapeHtml(item.content || "暂无内容")}</p>
      ${item.image ? `<img class="entry-photo" src="${item.image}" alt="${escapeHtml(item.title)}">` : ""}
    </article>
  `);
}

function renderTimeLogs() {
  const sorted = [...state.timeLogs].sort(byDateDesc);
  renderEntries(els.timeList, sorted, (item) => `
    <article class="entry-card">
      <div>
        <h4>${escapeHtml(item.task)}</h4>
        <p class="entry-meta">${formatDate(item.date)} · ${escapeHtml(item.category)}</p>
      </div>
      <span class="tag">${item.hours} 小时</span>
    </article>
  `);
  renderTimeSummary();
  drawTimeChart();
  drawTodayPieChart();
}

function renderBooks() {
  renderEntries(els.bookList, [...state.books].sort(byDateDesc), (item) => `
    <article class="entry-card">
      <p class="entry-meta">${formatDate(item.date)}</p>
      <h3>${escapeHtml(item.title)}</h3>
      <p>${escapeHtml(item.notes || "暂无笔记")}</p>
    </article>
  `);
}

function renderBirthdays() {
  const items = [...state.birthdays].sort((a, b) => getDaysUntilBirthday(a.date) - getDaysUntilBirthday(b.date));
  renderEntries(els.birthdayList, items, (item) => `
    <article class="entry-card">
      <h3>${escapeHtml(item.name)}</h3>
      <p class="entry-meta">${formatBirthday(item.date)} · ${getBirthdayHint(item.date)}</p>
      <p>${escapeHtml(item.note || "暂无备注")}</p>
    </article>
  `);
}

function renderEntries(container, items, renderItem) {
  if (!items.length) {
    container.innerHTML = "";
    container.appendChild(els.emptyStateTemplate.content.cloneNode(true));
    return;
  }
  container.innerHTML = items.map(renderItem).join("");
}

function getCalendarEntriesByDate() {
  const grouped = {};
  const pushEntry = (date, entry) => {
    if (!date) return;
    if (!grouped[date]) {
      grouped[date] = [];
    }
    grouped[date].push(entry);
  };

  state.reviews.forEach((item) => {
    pushEntry(item.date, {
      type: "review",
      label: `复盘: ${item.keep || item.improve || item.start || item.stop || "已记录"}`,
      title: "复盘",
      detail: `Keep ${item.keep || "暂无"} / Improve ${item.improve || "暂无"} / Start ${item.start || "暂无"} / Stop ${item.stop || "暂无"}`
    });
  });

  state.reflections.forEach((item) => {
    pushEntry(item.date, {
      type: "reflection",
      label: `感悟: ${item.title}`,
      title: `感悟 · ${item.title}`,
      detail: item.content || "已记录感悟"
    });
  });

  state.timeLogs.forEach((item) => {
    pushEntry(item.date, {
      type: "time",
      label: `${item.task} ${item.hours}h`,
      title: `时间 · ${item.task}`,
      detail: `${item.category} · ${item.hours} 小时`
    });
  });

  state.books.forEach((item) => {
    pushEntry(item.date, {
      type: "book",
      label: `读书: ${item.title}`,
      title: `读书 · ${item.title}`,
      detail: item.notes || "已记录读书笔记"
    });
  });

  Object.values(grouped).forEach((items) => {
    items.sort((a, b) => a.title.localeCompare(b.title, "zh-CN"));
  });

  return grouped;
}

function renderTimeSummary() {
  if (!state.timeLogs.length) {
    els.timeSummary.innerHTML = "<p>添加时间记录后，这里会生成投入总结。</p>";
    return;
  }

  const totals = aggregateByCategory(state.timeLogs);
  const sorted = Object.entries(totals).sort((a, b) => b[1] - a[1]);
  const totalHours = sorted.reduce((sum, [, hours]) => sum + hours, 0);
  const top = sorted[0];
  const average = totalHours / state.timeLogs.length;
  const recentLogs = [...state.timeLogs].sort(byDateDesc).slice(0, 5);
  const recentTotal = recentLogs.reduce((sum, item) => sum + item.hours, 0);

  els.timeSummary.innerHTML = `
    <p>累计记录 <strong>${totalHours.toFixed(1)}</strong> 小时，当前最主要的投入方向是 <strong>${escapeHtml(top[0])}</strong>，占比 <strong>${((top[1] / totalHours) * 100).toFixed(0)}%</strong>。</p>
    <p>平均每条记录 <strong>${average.toFixed(1)}</strong> 小时，最近 5 条任务总投入 <strong>${recentTotal.toFixed(1)}</strong> 小时。</p>
    <p>建议继续观察高投入分类是否带来明确产出，避免长期时间堆积在低价值任务上。</p>
  `;
}

function drawTimeChart() {
  const canvas = els.timeChart;
  const ctx = canvas.getContext("2d");
  const dpr = window.devicePixelRatio || 1;
  const cssWidth = canvas.clientWidth || 640;
  const cssHeight = 280;

  canvas.width = cssWidth * dpr;
  canvas.height = cssHeight * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, cssWidth, cssHeight);

  ctx.fillStyle = "#7f6d61";
  ctx.font = "14px Segoe UI";

  const entries = Object.entries(aggregateByCategory(state.timeLogs)).sort((a, b) => b[1] - a[1]).slice(0, 6);
  if (!entries.length) {
    ctx.fillText("暂无时间数据", 20, 32);
    return;
  }

  const chart = { left: 64, top: 24, width: cssWidth - 90, height: 210 };
  const maxValue = Math.max(...entries.map(([, hours]) => hours), 1);

  ctx.strokeStyle = "rgba(118, 98, 85, 0.16)";
  ctx.lineWidth = 1;
  for (let i = 0; i <= 4; i += 1) {
    const y = chart.top + (chart.height / 4) * i;
    ctx.beginPath();
    ctx.moveTo(chart.left, y);
    ctx.lineTo(chart.left + chart.width, y);
    ctx.stroke();
  }

  const barWidth = chart.width / entries.length * 0.58;
  entries.forEach(([label, value], index) => {
    const slotWidth = chart.width / entries.length;
    const x = chart.left + slotWidth * index + (slotWidth - barWidth) / 2;
    const barHeight = (value / maxValue) * (chart.height - 10);
    const y = chart.top + chart.height - barHeight;

    const gradient = ctx.createLinearGradient(0, y, 0, chart.top + chart.height);
    gradient.addColorStop(0, "#bb5a3c");
    gradient.addColorStop(1, "#e4b579");
    ctx.fillStyle = gradient;
    roundRect(ctx, x, y, barWidth, barHeight, 14);
    ctx.fill();

    ctx.fillStyle = "#2e241d";
    ctx.textAlign = "center";
    ctx.fillText(`${value.toFixed(1)}h`, x + barWidth / 2, y - 8);
    ctx.fillStyle = "#7f6d61";
    ctx.fillText(truncate(label, 6), x + barWidth / 2, chart.top + chart.height + 22);
  });

  ctx.textAlign = "left";
}

function drawTodayPieChart() {
  const canvas = els.todayPieChart;
  const ctx = canvas.getContext("2d");
  const dpr = window.devicePixelRatio || 1;
  const cssSize = Math.min(canvas.clientWidth || 320, 320);
  const today = getLocalDateString(new Date());
  const todayLogs = state.timeLogs.filter((item) => item.date === today);
  const totals = aggregate(todayLogs, "task");
  const entries = Object.entries(totals).sort((a, b) => b[1] - a[1]);

  canvas.width = cssSize * dpr;
  canvas.height = cssSize * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, cssSize, cssSize);

  if (!entries.length) {
    els.todayPieLegend.innerHTML = "";
    els.todayTimeSummary.innerHTML = "<p>今天还没有时间记录，添加任务后这里会显示饼图和总结。</p>";
    ctx.fillStyle = "#7f6d61";
    ctx.font = "14px Segoe UI";
    ctx.textAlign = "center";
    ctx.fillText("今天暂无数据", cssSize / 2, cssSize / 2);
    return;
  }

  const totalHours = entries.reduce((sum, [, value]) => sum + value, 0);
  const center = cssSize / 2;
  const radius = cssSize * 0.34;
  let startAngle = -Math.PI / 2;

  entries.forEach(([label, value], index) => {
    const slice = (value / totalHours) * Math.PI * 2;
    const color = PIE_COLORS[index % PIE_COLORS.length];
    ctx.beginPath();
    ctx.moveTo(center, center);
    ctx.arc(center, center, radius, startAngle, startAngle + slice);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
    startAngle += slice;
  });

  ctx.beginPath();
  ctx.arc(center, center, radius * 0.52, 0, Math.PI * 2);
  ctx.fillStyle = "#fff8ef";
  ctx.fill();

  ctx.fillStyle = "#2e241d";
  ctx.textAlign = "center";
  ctx.font = "600 14px Segoe UI";
  ctx.fillText("今日投入", center, center - 6);
  ctx.font = "700 22px Segoe UI";
  ctx.fillText(`${totalHours.toFixed(1)}h`, center, center + 22);

  els.todayPieLegend.innerHTML = entries.map(([label, value], index) => {
    const color = PIE_COLORS[index % PIE_COLORS.length];
    const percent = ((value / totalHours) * 100).toFixed(0);
    return `
      <div class="legend-item">
        <div class="legend-label">
          <span class="legend-swatch" style="background:${color}"></span>
          <span class="legend-text">${escapeHtml(label)}</span>
        </div>
        <span class="legend-value">${value.toFixed(1)}h · ${percent}%</span>
      </div>
    `;
  }).join("");

  const topTask = entries[0];
  els.todayTimeSummary.innerHTML = `
    <p>今天累计投入 <strong>${totalHours.toFixed(1)}</strong> 小时，当前占比最高的是 <strong>${escapeHtml(topTask[0])}</strong>。</p>
    <p>这项任务占今天总时长的 <strong>${((topTask[1] / totalHours) * 100).toFixed(0)}%</strong>，如果它是核心目标，说明时间分配比较集中；如果不是，建议重新校准。</p>
  `;
}

function roundRect(ctx, x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + width, y, x + width, y + height, radius);
  ctx.arcTo(x + width, y + height, x, y + height, radius);
  ctx.arcTo(x, y + height, x, y, radius);
  ctx.arcTo(x, y, x + width, y, radius);
  ctx.closePath();
}

function updateCountdown() {
  const now = new Date();
  const nextYear = new Date(now.getFullYear() + 1, 0, 1);
  const startOfYear = new Date(now.getFullYear(), 0, 1);
  const diff = nextYear - now;
  const total = nextYear - startOfYear;
  const passed = now - startOfYear;
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((diff / (1000 * 60)) % 60);
  const progress = Math.min((passed / total) * 100, 100);

  els.daysLeft.textContent = String(days);
  els.hoursLeft.textContent = String(hours);
  els.minutesLeft.textContent = String(minutes);
  els.yearProgressText.textContent = `今年已经走过 ${progress.toFixed(1)}%`;
  els.yearProgressBar.style.width = `${progress}%`;
}

function aggregateByCategory(logs) {
  return aggregate(logs, "category");
}

function aggregate(logs, field) {
  return logs.reduce((acc, item) => {
    acc[item[field]] = (acc[item[field]] || 0) + Number(item.hours || 0);
    return acc;
  }, {});
}

function getDaysUntilBirthday(dateString) {
  const today = new Date();
  const birth = new Date(dateString);
  const next = new Date(today.getFullYear(), birth.getMonth(), birth.getDate());
  if (next < stripTime(today)) {
    next.setFullYear(today.getFullYear() + 1);
  }
  return Math.round((next - stripTime(today)) / (1000 * 60 * 60 * 24));
}

function getBirthdayHint(dateString) {
  const days = getDaysUntilBirthday(dateString);
  if (days === 0) return "今天生日";
  if (days === 1) return "明天生日";
  return `${days} 天后生日`;
}

function formatBirthday(dateString) {
  const date = new Date(dateString);
  return `${date.getMonth() + 1} 月 ${date.getDate()} 日`;
}

function stripTime(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function byDateDesc(a, b) {
  return new Date(b.date || b.createdAt || 0) - new Date(a.date || a.createdAt || 0);
}

function formatDate(dateString) {
  if (!dateString) return "未设置日期";
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "short",
    day: "numeric"
  }).format(new Date(dateString));
}

function truncate(text, maxLength) {
  return text.length > maxLength ? `${text.slice(0, maxLength)}...` : text;
}

function persistLocal(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function loadArray(key) {
  try {
    return JSON.parse(localStorage.getItem(key)) || [];
  } catch {
    return [];
  }
}

function loadObject(key) {
  try {
    return JSON.parse(localStorage.getItem(key)) || {};
  } catch {
    return {};
  }
}

function getLocalDateString(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function startOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function startOfCalendarGrid(date) {
  const day = date.getDay();
  const offset = day === 0 ? 6 : day - 1;
  return addDays(date, -offset);
}

function addDays(date, amount) {
  const next = new Date(date);
  next.setDate(next.getDate() + amount);
  return next;
}

function shiftCalendarMonth(amount) {
  state.calendarMonth = new Date(
    state.calendarMonth.getFullYear(),
    state.calendarMonth.getMonth() + amount,
    1
  );
  renderCalendar();
}

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

function readAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function apiGet(path) {
  const response = await fetch(path);
  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }
  return response.json();
}

async function apiPost(path, payload) {
  const response = await fetch(path, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }

  return response.json();
}
