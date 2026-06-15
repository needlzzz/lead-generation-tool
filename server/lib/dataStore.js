const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');

// ---------------------------------------------------------------------------
// In-memory cache — loaded once on first access, written back debounced
// ---------------------------------------------------------------------------

const cache = new Map();        // collection → Map<id, record>
const singletonCache = new Map(); // collection → object
const dirtyCollections = new Set();
const dirtySingletons = new Set();

let writeTimer = null;
const WRITE_DELAY_MS = 2000; // Flush to disk every 2s (if dirty)

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function getFilePath(collection) {
  return path.join(DATA_DIR, `${collection}.json`);
}

// ---------------------------------------------------------------------------
// Disk I/O (only on startup + periodic flush)
// ---------------------------------------------------------------------------

function loadCollectionFromDisk(collection) {
  ensureDataDir();
  const filePath = getFilePath(collection);
  if (!fs.existsSync(filePath)) {
    return new Map();
  }
  try {
    const raw = fs.readFileSync(filePath, 'utf-8');
    const parsed = JSON.parse(raw);
    const arr = Array.isArray(parsed) ? parsed : [];
    const map = new Map();
    for (const item of arr) {
      if (item && item.id) {
        map.set(item.id, item);
      }
    }
    return map;
  } catch (err) {
    console.error(`[dataStore] Error reading ${collection}.json:`, err.message);
    return new Map();
  }
}

function loadSingletonFromDisk(collection) {
  ensureDataDir();
  const filePath = getFilePath(collection);
  if (!fs.existsSync(filePath)) {
    return null;
  }
  try {
    const raw = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    console.error(`[dataStore] Error reading ${collection}.json:`, err.message);
    return null;
  }
}

function writeCollectionToDisk(collection) {
  ensureDataDir();
  const filePath = getFilePath(collection);
  const map = cache.get(collection);
  if (!map) return;
  const arr = Array.from(map.values());
  const tmpFile = filePath + '.tmp.' + Date.now();
  fs.writeFileSync(tmpFile, JSON.stringify(arr, null, 2), 'utf-8');
  fs.renameSync(tmpFile, filePath);
}

function writeSingletonToDisk(collection) {
  ensureDataDir();
  const filePath = getFilePath(collection);
  const data = singletonCache.get(collection);
  if (data === undefined) return;
  const tmpFile = filePath + '.tmp.' + Date.now();
  fs.writeFileSync(tmpFile, JSON.stringify(data, null, 2), 'utf-8');
  fs.renameSync(tmpFile, filePath);
}

// ---------------------------------------------------------------------------
// Debounced flush — batches all dirty writes into one flush cycle
// ---------------------------------------------------------------------------

function scheduleDiskFlush() {
  if (writeTimer) return; // Already scheduled
  writeTimer = setTimeout(() => {
    writeTimer = null;
    flushToDisk();
  }, WRITE_DELAY_MS);
  // Don't keep Node alive just for the flush timer
  if (writeTimer.unref) writeTimer.unref();
}

function flushToDisk() {
  for (const collection of dirtyCollections) {
    try {
      writeCollectionToDisk(collection);
    } catch (err) {
      console.error(`[dataStore] Failed to flush ${collection}:`, err.message);
    }
  }
  dirtyCollections.clear();

  for (const collection of dirtySingletons) {
    try {
      writeSingletonToDisk(collection);
    } catch (err) {
      console.error(`[dataStore] Failed to flush singleton ${collection}:`, err.message);
    }
  }
  dirtySingletons.clear();
}

// Flush synchronously on process exit
process.on('exit', () => {
  if (dirtyCollections.size > 0 || dirtySingletons.size > 0) {
    flushToDisk();
  }
});

// Also flush on SIGINT/SIGTERM for graceful shutdown
function gracefulShutdown() {
  if (dirtyCollections.size > 0 || dirtySingletons.size > 0) {
    flushToDisk();
  }
  process.exit(0);
}
process.on('SIGINT', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);

// ---------------------------------------------------------------------------
// Cache accessors (lazy-load on first access)
// ---------------------------------------------------------------------------

// Collections managed by other modules (previewRegistry) — dataStore must not touch these
const PROTECTED_COLLECTIONS = new Set(['previews']);

function getCache(collection) {
  if (PROTECTED_COLLECTIONS.has(collection)) {
    console.warn(`[dataStore] WARNING: attempted access to protected collection "${collection}" — use its own module instead`);
    return new Map();
  }
  if (!cache.has(collection)) {
    cache.set(collection, loadCollectionFromDisk(collection));
  }
  return cache.get(collection);
}

// ---------------------------------------------------------------------------
// Public API (same interface as before)
// ---------------------------------------------------------------------------

function getAll(collection, filter) {
  const map = getCache(collection);
  const data = Array.from(map.values());
  if (!filter) return data;
  return data.filter(item => {
    return Object.entries(filter).every(([key, value]) => item[key] === value);
  });
}

function get(collection, id) {
  const map = getCache(collection);
  return map.get(id) || null;
}

function save(collection, record) {
  const map = getCache(collection);
  map.set(record.id, record);
  dirtyCollections.add(collection);
  scheduleDiskFlush();
  return record;
}

function remove(collection, id) {
  const map = getCache(collection);
  if (!map.has(id)) return false;
  map.delete(id);
  dirtyCollections.add(collection);
  scheduleDiskFlush();
  return true;
}

function readSingleton(collection) {
  if (!singletonCache.has(collection)) {
    singletonCache.set(collection, loadSingletonFromDisk(collection));
  }
  return singletonCache.get(collection);
}

function writeSingleton(collection, data) {
  singletonCache.set(collection, data);
  dirtySingletons.add(collection);
  scheduleDiskFlush();
  return data;
}

// Legacy compatibility — used by some tests
function readCollection(collection) {
  return getAll(collection);
}

function writeCollection(collection, data) {
  const map = new Map();
  for (const item of data) {
    if (item && item.id) {
      map.set(item.id, item);
    }
  }
  cache.set(collection, map);
  dirtyCollections.add(collection);
  scheduleDiskFlush();
}

// Force immediate flush (useful for tests or explicit save points)
function flush() {
  if (writeTimer) {
    clearTimeout(writeTimer);
    writeTimer = null;
  }
  flushToDisk();
}

module.exports = { getAll, get, save, remove, readSingleton, writeSingleton, readCollection, writeCollection, flush, DATA_DIR };
