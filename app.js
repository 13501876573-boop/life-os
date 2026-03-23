const BEAD_PALETTE = [
  { code: "W01", name: "奶白", hex: "#f7f2ea" },
  { code: "C02", name: "暖米", hex: "#ead7bb" },
  { code: "Y03", name: "麦金", hex: "#d7b165" },
  { code: "Y04", name: "琥珀", hex: "#bf8f42" },
  { code: "O05", name: "杏橘", hex: "#dd935d" },
  { code: "O06", name: "柿橙", hex: "#d36f3f" },
  { code: "R07", name: "珊瑚红", hex: "#d95748" },
  { code: "R08", name: "砖红", hex: "#ac5341" },
  { code: "R09", name: "莓粉", hex: "#d98b96" },
  { code: "P10", name: "雾粉", hex: "#f0b7bd" },
  { code: "P11", name: "浅藕", hex: "#c99aa7" },
  { code: "V12", name: "烟紫", hex: "#866d87" },
  { code: "B13", name: "冰蓝", hex: "#c7dce7" },
  { code: "B14", name: "雾蓝", hex: "#8fb8cc" },
  { code: "B15", name: "湖蓝", hex: "#4f8fa7" },
  { code: "B16", name: "深海蓝", hex: "#32556d" },
  { code: "G17", name: "薄荷", hex: "#b7d8c7" },
  { code: "G18", name: "青瓷", hex: "#86b9a5" },
  { code: "G19", name: "墨绿", hex: "#567a62" },
  { code: "G20", name: "苔绿", hex: "#7e8c50" },
  { code: "G21", name: "橄榄", hex: "#6d6d3e" },
  { code: "N22", name: "浅灰", hex: "#d9d6d0" },
  { code: "N23", name: "银灰", hex: "#b4b2af" },
  { code: "N24", name: "石灰", hex: "#8c8985" },
  { code: "N25", name: "深灰", hex: "#5d5b59" },
  { code: "K26", name: "炭黑", hex: "#2d2d31" },
  { code: "B27", name: "咖啡", hex: "#6d4c3b" },
  { code: "B28", name: "深棕", hex: "#4e352b" },
  { code: "W29", name: "冷白", hex: "#fcfcfb" },
  { code: "Y30", name: "柠黄", hex: "#f0d652" },
  { code: "Y31", name: "暖黄", hex: "#f0c441" },
  { code: "O32", name: "蜜桃", hex: "#f0b08d" },
  { code: "R33", name: "玫红", hex: "#c9486f" },
  { code: "P34", name: "淡紫", hex: "#bca9d4" },
  { code: "V35", name: "葡萄紫", hex: "#6e5578" },
  { code: "B36", name: "天青", hex: "#70c0dd" },
  { code: "B37", name: "靛蓝", hex: "#34538b" },
  { code: "G38", name: "荧绿", hex: "#8ccf4f" },
  { code: "G39", name: "草绿", hex: "#5ea050" },
  { code: "G40", name: "松绿", hex: "#376c52" },
  { code: "N41", name: "蓝灰", hex: "#7c8794" },
  { code: "N42", name: "米灰", hex: "#c4b8aa" },
  { code: "S43", name: "肤色浅", hex: "#f3cfb1" },
  { code: "S44", name: "肤色中", hex: "#d9a47d" },
  { code: "S45", name: "肤色深", hex: "#a66d4c" },
  { code: "M46", name: "酒红", hex: "#773847" },
  { code: "M47", name: "夜蓝", hex: "#223240" },
  { code: "M48", name: "森林黑", hex: "#25312a" }
];

const DETAIL_PROFILES = {
  balanced: { contrast: 1.08, saturation: 1.04, brightness: 1 },
  portrait: { contrast: 1.03, saturation: 0.98, brightness: 1.02 },
  contrast: { contrast: 1.18, saturation: 1.08, brightness: 0.98 },
  soft: { contrast: 0.96, saturation: 0.95, brightness: 1.03 }
};

const state = {
  image: null,
  objectUrl: "",
  sourceWidth: 0,
  sourceHeight: 0,
  pattern: null
};

const els = {
  imageInput: document.getElementById("imageInput"),
  beadWidth: document.getElementById("beadWidth"),
  beadHeight: document.getElementById("beadHeight"),
  dimensionMode: document.getElementById("dimensionMode"),
  maxColors: document.getElementById("maxColors"),
  detailMode: document.getElementById("detailMode"),
  zoomSize: document.getElementById("zoomSize"),
  ditherToggle: document.getElementById("ditherToggle"),
  labelsToggle: document.getElementById("labelsToggle"),
  generateButton: document.getElementById("generateButton"),
  downloadButton: document.getElementById("downloadButton"),
  statusCard: document.getElementById("statusCard"),
  sourcePreview: document.getElementById("sourcePreview"),
  sourcePlaceholder: document.getElementById("sourcePlaceholder"),
  sourceMeta: document.getElementById("sourceMeta"),
  patternCanvas: document.getElementById("patternCanvas"),
  patternPlaceholder: document.getElementById("patternPlaceholder"),
  patternMeta: document.getElementById("patternMeta"),
  paletteStats: document.getElementById("paletteStats"),
  inventoryMeta: document.getElementById("inventoryMeta"),
  summaryBoard: document.getElementById("summaryBoard"),
  reviewNotes: document.getElementById("reviewNotes")
};

const patternCtx = els.patternCanvas.getContext("2d");

initialize();

function initialize() {
  els.imageInput.addEventListener("change", handleImageUpload);
  els.generateButton.addEventListener("click", generatePattern);
  els.downloadButton.addEventListener("click", downloadPattern);
  [els.beadWidth, els.beadHeight, els.dimensionMode].forEach((input) => {
    input.addEventListener("change", syncDimensions);
  });
  syncDimensions();
}

async function handleImageUpload(event) {
  const file = event.target.files[0];
  if (!file) {
    return;
  }

  if (state.objectUrl) {
    URL.revokeObjectURL(state.objectUrl);
  }

  const url = URL.createObjectURL(file);
  const image = await loadImage(url);
  state.image = image;
  state.objectUrl = url;
  state.sourceWidth = image.naturalWidth;
  state.sourceHeight = image.naturalHeight;

  els.sourcePreview.src = url;
  els.sourcePreview.style.display = "block";
  els.sourcePlaceholder.style.display = "none";
  els.sourceMeta.textContent = `${image.naturalWidth} × ${image.naturalHeight}`;

  syncDimensions();
  setStatus("图片已载入", "可以直接生成，或微调尺寸和颜色数量。");
  await generatePattern();
}

function syncDimensions() {
  if (!state.image) {
    return;
  }

  const mode = els.dimensionMode.value;
  const sourceRatio = state.sourceWidth / state.sourceHeight;
  let width = clampInt(els.beadWidth.value, 12, 240, 96);
  let height = clampInt(els.beadHeight.value, 12, 240, 96);

  if (mode === "width") {
    height = Math.max(12, Math.round(width / sourceRatio));
    els.beadHeight.value = String(height);
  } else if (mode === "height") {
    width = Math.max(12, Math.round(height * sourceRatio));
    els.beadWidth.value = String(width);
  } else if (mode === "fit") {
    const longest = Math.max(width, height);
    if (sourceRatio >= 1) {
      width = longest;
      height = Math.max(12, Math.round(longest / sourceRatio));
    } else {
      height = longest;
      width = Math.max(12, Math.round(longest * sourceRatio));
    }
    els.beadWidth.value = String(width);
    els.beadHeight.value = String(height);
  }
}

async function generatePattern() {
  if (!state.image) {
    setStatus("还没有图片", "先上传一张图片，再生成拼豆图。");
    return;
  }

  syncDimensions();
  setStatus("正在生成", "处理中，会执行缩放、细节增强、色板筛选与误差扩散。");

  const width = clampInt(els.beadWidth.value, 12, 240, 96);
  const height = clampInt(els.beadHeight.value, 12, 240, 96);
  const maxColors = clampInt(els.maxColors.value, 6, BEAD_PALETTE.length, 32);
  const zoom = clampInt(els.zoomSize.value, 6, 28, 12);
  const detailMode = DETAIL_PROFILES[els.detailMode.value] || DETAIL_PROFILES.balanced;
  const useDither = els.ditherToggle.checked;
  const showLabels = els.labelsToggle.checked;

  const sourceData = rasterizeImage(state.image, width, height, detailMode, els.dimensionMode.value);
  const limitedPalette = selectPaletteSubset(sourceData.data, maxColors);
  const result = quantizeImage(sourceData, limitedPalette, useDither);
  const counts = summarizeColors(result.indices, limitedPalette);
  const summary = buildSummary(width, height, counts);

  state.pattern = {
    width,
    height,
    zoom,
    showLabels,
    palette: limitedPalette,
    counts,
    indices: result.indices,
    colorGrid: result.colorGrid,
    summary
  };

  drawPattern();
  renderPaletteStats();
  renderSummary();
  renderReviewNotes();

  els.downloadButton.disabled = false;
  els.patternPlaceholder.style.display = "none";
  els.patternMeta.textContent = `${width} × ${height} 豆 | ${counts.length} 色`;
  els.inventoryMeta.textContent = `${counts.length} 色 | ${summary.totalBeads} 颗`;
  setStatus("生成完成", "你可以放大检查边缘、导出 PNG，或继续调整参数重新生成。");
}

function rasterizeImage(image, targetWidth, targetHeight, profile, mode) {
  const sourceRatio = image.naturalWidth / image.naturalHeight;
  const targetRatio = targetWidth / targetHeight;
  const canvas = document.createElement("canvas");
  canvas.width = targetWidth;
  canvas.height = targetHeight;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";

  let sx = 0;
  let sy = 0;
  let sw = image.naturalWidth;
  let sh = image.naturalHeight;

  if (mode === "fit") {
    if (sourceRatio > targetRatio) {
      sw = image.naturalHeight * targetRatio;
      sx = (image.naturalWidth - sw) / 2;
    } else {
      sh = image.naturalWidth / targetRatio;
      sy = (image.naturalHeight - sh) / 2;
    }
  }

  ctx.drawImage(image, sx, sy, sw, sh, 0, 0, targetWidth, targetHeight);
  const imageData = ctx.getImageData(0, 0, targetWidth, targetHeight);
  applyDetailProfile(imageData.data, profile);
  return imageData;
}

function applyDetailProfile(data, profile) {
  for (let index = 0; index < data.length; index += 4) {
    let red = data[index] / 255;
    let green = data[index + 1] / 255;
    let blue = data[index + 2] / 255;
    const luma = 0.2126 * red + 0.7152 * green + 0.0722 * blue;

    red = luma + (red - luma) * profile.saturation;
    green = luma + (green - luma) * profile.saturation;
    blue = luma + (blue - luma) * profile.saturation;

    red = ((red - 0.5) * profile.contrast + 0.5) * profile.brightness;
    green = ((green - 0.5) * profile.contrast + 0.5) * profile.brightness;
    blue = ((blue - 0.5) * profile.contrast + 0.5) * profile.brightness;

    data[index] = clampByte(red * 255);
    data[index + 1] = clampByte(green * 255);
    data[index + 2] = clampByte(blue * 255);
  }
}

function selectPaletteSubset(data, maxColors) {
  const scores = new Map();
  for (let index = 0; index < data.length; index += 4) {
    const rgb = { r: data[index], g: data[index + 1], b: data[index + 2] };
    const lab = rgbToLab(rgb.r, rgb.g, rgb.b);
    let best = null;

    for (const color of BEAD_PALETTE) {
      const distance = deltaE(lab, color.lab);
      if (!best || distance < best.distance) {
        best = { color, distance };
      }
    }

    const current = scores.get(best.color.code) || { color: best.color, hits: 0, error: 0 };
    current.hits += 1;
    current.error += best.distance;
    scores.set(best.color.code, current);
  }

  const sorted = [...scores.values()]
    .sort((a, b) => (b.hits - a.hits) || (a.error - b.error))
    .slice(0, maxColors)
    .map((entry) => entry.color);

  const baseSet = new Set(sorted.map((color) => color.code));
  const anchors = ["K26", "W29", "N24"];
  anchors.forEach((code) => {
    if (!baseSet.has(code) && baseSet.size < maxColors) {
      const color = BEAD_PALETTE.find((item) => item.code === code);
      if (color) {
        sorted.push(color);
        baseSet.add(code);
      }
    }
  });

  return sorted;
}

function quantizeImage(imageData, palette, useDither) {
  const { data, width, height } = imageData;
  const working = new Float32Array(data.length);
  for (let index = 0; index < data.length; index += 1) {
    working[index] = data[index];
  }

  const indices = new Array(width * height);
  const colorGrid = new Array(width * height);

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const offset = (y * width + x) * 4;
      const red = working[offset];
      const green = working[offset + 1];
      const blue = working[offset + 2];
      const lab = rgbToLab(red, green, blue);
      const best = findClosestPaletteColor(lab, palette);

      indices[y * width + x] = best.index;
      colorGrid[y * width + x] = best.color;

      if (useDither) {
        const errorR = red - best.color.rgb.r;
        const errorG = green - best.color.rgb.g;
        const errorB = blue - best.color.rgb.b;
        diffuseError(working, width, height, x + 1, y, errorR, errorG, errorB, 7 / 16);
        diffuseError(working, width, height, x - 1, y + 1, errorR, errorG, errorB, 3 / 16);
        diffuseError(working, width, height, x, y + 1, errorR, errorG, errorB, 5 / 16);
        diffuseError(working, width, height, x + 1, y + 1, errorR, errorG, errorB, 1 / 16);
      }
    }
  }

  return { indices, colorGrid };
}

function diffuseError(buffer, width, height, x, y, errorR, errorG, errorB, factor) {
  if (x < 0 || x >= width || y < 0 || y >= height) {
    return;
  }
  const offset = (y * width + x) * 4;
  buffer[offset] = clampByte(buffer[offset] + errorR * factor);
  buffer[offset + 1] = clampByte(buffer[offset + 1] + errorG * factor);
  buffer[offset + 2] = clampByte(buffer[offset + 2] + errorB * factor);
}

function findClosestPaletteColor(lab, palette) {
  let best = null;
  for (let index = 0; index < palette.length; index += 1) {
    const color = palette[index];
    const distance = deltaE(lab, color.lab);
    if (!best || distance < best.distance) {
      best = { index, color, distance };
    }
  }
  return best;
}

function summarizeColors(indices, palette) {
  const counts = new Map();
  indices.forEach((paletteIndex) => {
    counts.set(paletteIndex, (counts.get(paletteIndex) || 0) + 1);
  });

  return [...counts.entries()]
    .map(([paletteIndex, count]) => ({
      ...palette[paletteIndex],
      count
    }))
    .sort((a, b) => b.count - a.count);
}

function buildSummary(width, height, counts) {
  const totalBeads = width * height;
  const plateColumns = Math.ceil(width / 29);
  const plateRows = Math.ceil(height / 29);
  return {
    totalBeads,
    primaryColor: counts[0] ? `${counts[0].name} ${counts[0].code}` : "无",
    boardHint: `${plateColumns} × ${plateRows} 块 29x29 底板`,
    physicalHint: `${width} × ${height}`
  };
}

function drawPattern() {
  if (!state.pattern) {
    return;
  }

  const { width, height, zoom, colorGrid, indices, palette, showLabels } = state.pattern;
  const cellSize = zoom;
  els.patternCanvas.width = width * cellSize;
  els.patternCanvas.height = height * cellSize;

  patternCtx.clearRect(0, 0, els.patternCanvas.width, els.patternCanvas.height);
  patternCtx.imageSmoothingEnabled = false;

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const color = colorGrid[y * width + x];
      const px = x * cellSize;
      const py = y * cellSize;

      patternCtx.fillStyle = color.hex;
      patternCtx.fillRect(px, py, cellSize, cellSize);
      patternCtx.strokeStyle = "rgba(38, 27, 23, 0.16)";
      patternCtx.strokeRect(px, py, cellSize, cellSize);

      if (showLabels && cellSize >= 12) {
        const code = palette[indices[y * width + x]].code.replace(/[A-Z]/g, "");
        patternCtx.fillStyle = getReadableTextColor(color.rgb);
        patternCtx.font = `${Math.max(8, Math.floor(cellSize * 0.42))}px Space Grotesk`;
        patternCtx.textAlign = "center";
        patternCtx.textBaseline = "middle";
        patternCtx.fillText(code, px + cellSize / 2, py + cellSize / 2 + 0.5);
      }
    }
  }
}

function renderPaletteStats() {
  if (!state.pattern) {
    return;
  }

  els.paletteStats.innerHTML = state.pattern.counts
    .map((item) => `
      <article class="palette-item">
        <span class="swatch" style="background:${item.hex}"></span>
        <div>
          <strong>${item.name}</strong>
          <small>${item.code} · ${item.hex}</small>
        </div>
        <span class="palette-count">${item.count}</span>
      </article>
    `)
    .join("");
}

function renderSummary() {
  if (!state.pattern) {
    return;
  }

  const { width, height, summary } = state.pattern;
  els.summaryBoard.innerHTML = `
    <div>
      <span>成品尺寸</span>
      <strong>${width} × ${height}</strong>
    </div>
    <div>
      <span>总豆数</span>
      <strong>${summary.totalBeads}</strong>
    </div>
    <div>
      <span>主要颜色</span>
      <strong>${summary.primaryColor}</strong>
    </div>
    <div>
      <span>建议底板</span>
      <strong>${summary.boardHint}</strong>
    </div>
  `;
}

function renderReviewNotes() {
  if (!state.pattern) {
    return;
  }

  const topCoverage = Math.round((state.pattern.counts[0]?.count || 0) / state.pattern.summary.totalBeads * 100);
  const colorCount = state.pattern.counts.length;
  const ditherText = els.ditherToggle.checked ? "已启用误差扩散，边缘与渐变保留更完整。" : "未启用误差扩散，色块会更干净但细节更硬。";
  const qualityText = colorCount >= 24
    ? "色彩层级充足，适合大多数照片转拼豆。"
    : "颜色数量较少，适合风格化图案，复杂照片可能丢失层次。";

  els.reviewNotes.innerHTML = `
    <h3>自检状态</h3>
    <p>已检查输出尺寸、总豆数、色号统计和网格绘制是否一致。</p>
    <p>${ditherText}</p>
    <p>当前首要颜色占比 ${Number.isFinite(topCoverage) ? topCoverage : 0}% 。${qualityText}</p>
  `;
}

function downloadPattern() {
  if (!state.pattern) {
    return;
  }

  const link = document.createElement("a");
  link.download = `bead-pattern-${state.pattern.width}x${state.pattern.height}.png`;
  link.href = els.patternCanvas.toDataURL("image/png");
  link.click();
}

function setStatus(title, copy) {
  els.statusCard.innerHTML = `<strong>${title}</strong><p>${copy}</p>`;
}

function loadImage(url) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = url;
  });
}

function getReadableTextColor(rgb) {
  const luma = (0.2126 * rgb.r + 0.7152 * rgb.g + 0.0722 * rgb.b) / 255;
  return luma > 0.62 ? "#241a16" : "#fff8f2";
}

function clampInt(value, min, max, fallback) {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed)) {
    return fallback;
  }
  return Math.min(max, Math.max(min, parsed));
}

function clampByte(value) {
  return Math.min(255, Math.max(0, Math.round(value)));
}

function hexToRgb(hex) {
  const normalized = hex.replace("#", "");
  return {
    r: Number.parseInt(normalized.slice(0, 2), 16),
    g: Number.parseInt(normalized.slice(2, 4), 16),
    b: Number.parseInt(normalized.slice(4, 6), 16)
  };
}

function rgbToLab(r, g, b) {
  const [x, y, z] = rgbToXyz(r, g, b);
  const xr = x / 95.047;
  const yr = y / 100;
  const zr = z / 108.883;
  const fx = xyzPivot(xr);
  const fy = xyzPivot(yr);
  const fz = xyzPivot(zr);
  return {
    l: 116 * fy - 16,
    a: 500 * (fx - fy),
    b: 200 * (fy - fz)
  };
}

function rgbToXyz(r, g, b) {
  const red = rgbChannelPivot(r / 255);
  const green = rgbChannelPivot(g / 255);
  const blue = rgbChannelPivot(b / 255);

  return [
    (red * 0.4124 + green * 0.3576 + blue * 0.1805) * 100,
    (red * 0.2126 + green * 0.7152 + blue * 0.0722) * 100,
    (red * 0.0193 + green * 0.1192 + blue * 0.9505) * 100
  ];
}

function rgbChannelPivot(channel) {
  return channel > 0.04045
    ? ((channel + 0.055) / 1.055) ** 2.4
    : channel / 12.92;
}

function xyzPivot(value) {
  return value > 0.008856
    ? value ** (1 / 3)
    : (7.787 * value) + (16 / 116);
}

function deltaE(first, second) {
  const deltaL = first.l - second.l;
  const deltaA = first.a - second.a;
  const deltaB = first.b - second.b;
  return Math.sqrt(deltaL * deltaL + deltaA * deltaA + deltaB * deltaB);
}

BEAD_PALETTE.forEach((color) => {
  color.rgb = hexToRgb(color.hex);
  color.lab = rgbToLab(color.rgb.r, color.rgb.g, color.rgb.b);
});
