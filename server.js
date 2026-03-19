const express = require("express");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_DIR = path.join(__dirname, "data");
const DATA_FILE = path.join(DATA_DIR, "store.json");
const COLLECTIONS = ["reviews", "reflections", "timeLogs", "books", "birthdays"];

const EMPTY_STORE = {
  reviews: [],
  reflections: [],
  timeLogs: [],
  books: [],
  birthdays: []
};

ensureStore();

app.use(express.json({ limit: "20mb" }));
app.use(express.static(__dirname));

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

app.get("/api/state", (_req, res) => {
  res.json(readStore());
});

app.post("/api/import", (req, res) => {
  const incoming = req.body || {};
  const store = readStore();

  COLLECTIONS.forEach((collection) => {
    const items = Array.isArray(incoming[collection]) ? incoming[collection] : [];
    const merged = mergeUnique(store[collection], items.map((item) => normalizeRecord(collection, item)));
    store[collection] = merged;
  });

  writeStore(store);
  res.status(201).json(store);
});

app.post("/api/:collection", (req, res) => {
  const { collection } = req.params;
  if (!COLLECTIONS.includes(collection)) {
    res.status(404).json({ error: "Unknown collection" });
    return;
  }

  const record = normalizeRecord(collection, req.body);
  const store = readStore();
  store[collection].unshift(record);
  writeStore(store);
  res.status(201).json(record);
});

app.listen(PORT, () => {
  console.log(`Life OS server listening on http://localhost:${PORT}`);
});

function ensureStore() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(EMPTY_STORE, null, 2));
  }
}

function readStore() {
  ensureStore();
  try {
    const raw = fs.readFileSync(DATA_FILE, "utf8");
    const parsed = JSON.parse(raw);
    return {
      reviews: Array.isArray(parsed.reviews) ? parsed.reviews : [],
      reflections: Array.isArray(parsed.reflections) ? parsed.reflections : [],
      timeLogs: Array.isArray(parsed.timeLogs) ? parsed.timeLogs : [],
      books: Array.isArray(parsed.books) ? parsed.books : [],
      birthdays: Array.isArray(parsed.birthdays) ? parsed.birthdays : []
    };
  } catch {
    return { ...EMPTY_STORE };
  }
}

function writeStore(store) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(store, null, 2));
}

function mergeUnique(existing, incoming) {
  const byId = new Map();
  [...incoming, ...existing].forEach((item) => {
    byId.set(item.id, item);
  });
  return [...byId.values()].sort((a, b) => sortByDateDesc(a, b));
}

function normalizeRecord(collection, payload = {}) {
  const base = {
    id: payload.id || crypto.randomUUID(),
    createdAt: payload.createdAt || new Date().toISOString()
  };

  if (collection === "reviews") {
    return {
      ...base,
      date: safeString(payload.date),
      keep: safeString(payload.keep),
      improve: safeString(payload.improve),
      start: safeString(payload.start),
      stop: safeString(payload.stop)
    };
  }

  if (collection === "reflections") {
    return {
      ...base,
      date: safeString(payload.date),
      title: safeString(payload.title) || "未命名感悟",
      content: safeString(payload.content),
      image: safeString(payload.image)
    };
  }

  if (collection === "timeLogs") {
    return {
      ...base,
      date: safeString(payload.date),
      category: safeString(payload.category) || "未分类",
      task: safeString(payload.task) || "未命名任务",
      hours: Number(payload.hours) || 0
    };
  }

  if (collection === "books") {
    return {
      ...base,
      date: safeString(payload.date),
      title: safeString(payload.title),
      notes: safeString(payload.notes)
    };
  }

  return {
    ...base,
    date: safeString(payload.date),
    name: safeString(payload.name),
    note: safeString(payload.note)
  };
}

function safeString(value) {
  return typeof value === "string" ? value.trim() : "";
}

function sortByDateDesc(a, b) {
  const aValue = a.date || a.createdAt || "";
  const bValue = b.date || b.createdAt || "";
  return new Date(bValue) - new Date(aValue);
}
