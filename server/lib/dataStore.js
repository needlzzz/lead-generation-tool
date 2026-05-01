const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function getFilePath(collection) {
  return path.join(DATA_DIR, `${collection}.json`);
}

function readCollection(collection) {
  ensureDataDir();
  const filePath = getFilePath(collection);
  if (!fs.existsSync(filePath)) {
    return [];
  }
  try {
    const raw = fs.readFileSync(filePath, 'utf-8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error(`Error reading ${collection}.json:`, err.message);
    return [];
  }
}

function writeCollection(collection, data) {
  ensureDataDir();
  const filePath = getFilePath(collection);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

function getAll(collection, filter) {
  const data = readCollection(collection);
  if (!filter) return data;
  return data.filter(item => {
    return Object.entries(filter).every(([key, value]) => item[key] === value);
  });
}

function get(collection, id) {
  const data = readCollection(collection);
  return data.find(item => item.id === id) || null;
}

function save(collection, record) {
  const data = readCollection(collection);
  const index = data.findIndex(item => item.id === record.id);
  if (index >= 0) {
    data[index] = record;
  } else {
    data.push(record);
  }
  writeCollection(collection, data);
  return record;
}

function remove(collection, id) {
  const data = readCollection(collection);
  const index = data.findIndex(item => item.id === id);
  if (index < 0) return false;
  data.splice(index, 1);
  writeCollection(collection, data);
  return true;
}

// Read a single-object file (like settings.json)
function readSingleton(collection) {
  ensureDataDir();
  const filePath = getFilePath(collection);
  if (!fs.existsSync(filePath)) {
    return null;
  }
  try {
    const raw = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    console.error(`Error reading ${collection}.json:`, err.message);
    return null;
  }
}

function writeSingleton(collection, data) {
  ensureDataDir();
  const filePath = getFilePath(collection);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
  return data;
}

module.exports = { getAll, get, save, remove, readSingleton, writeSingleton, readCollection, writeCollection, DATA_DIR };
