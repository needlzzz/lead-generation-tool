const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');
const QUOTA_FILE = path.join(DATA_DIR, 'send-quota.json');

/**
 * Get today's date in UTC as YYYY-MM-DD string.
 */
function getUtcToday() {
  const now = new Date();
  return now.toISOString().slice(0, 10);
}

/**
 * Read the quota state file. Returns { date, count, lastSentAt } or
 * a fresh zeroed state if the file is missing or corrupt.
 */
function readState() {
  try {
    if (!fs.existsSync(QUOTA_FILE)) {
      return { date: getUtcToday(), count: 0, lastSentAt: null };
    }
    const raw = fs.readFileSync(QUOTA_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed.date !== 'string' || typeof parsed.count !== 'number') {
      return { date: getUtcToday(), count: 0, lastSentAt: null };
    }
    return parsed;
  } catch (err) {
    // Corrupt file — treat as count=0
    return { date: getUtcToday(), count: 0, lastSentAt: null };
  }
}

/**
 * Write state atomically: write to a temp file, then rename over the real file.
 * Throws on I/O failure so the caller can pause sending.
 */
function writeStateAtomic(state) {
  // Ensure data directory exists
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  const tmpFile = path.join(DATA_DIR, `.send-quota.tmp.${Date.now()}`);
  try {
    fs.writeFileSync(tmpFile, JSON.stringify(state, null, 2), 'utf-8');
    fs.renameSync(tmpFile, QUOTA_FILE);
  } catch (err) {
    // Clean up temp file if rename failed
    try { fs.unlinkSync(tmpFile); } catch (_) { /* ignore */ }
    throw err;
  }
}

/**
 * Get the current quota count with lazy day reset.
 * If the stored date doesn't match UTC today, treats count as 0 (new day).
 *
 * @param {object} settings - App settings (needs settings.batch.maxEmailsPerDay)
 * @returns {{ date: string, count: number, remaining: number, isNewDay: boolean }}
 */
function getCount(settings) {
  const maxPerDay = settings.batch.maxEmailsPerDay;
  const today = getUtcToday();
  const state = readState();

  if (state.date !== today) {
    // Lazy day reset — don't write to disk, just report zeroed state
    return {
      date: today,
      count: 0,
      remaining: maxPerDay,
      isNewDay: true
    };
  }

  return {
    date: state.date,
    count: state.count,
    remaining: Math.max(0, maxPerDay - state.count),
    isNewDay: false
  };
}

/**
 * Increment the daily send count and persist atomically.
 * Performs lazy day reset if needed (resets count to 1 for the new day).
 * Throws on I/O write failure — caller should pause sending.
 *
 * @param {object} settings - App settings (needs settings.batch.maxEmailsPerDay)
 * @returns {{ date: string, count: number, remaining: number }}
 * @throws {Error} On I/O write failure
 */
function increment(settings) {
  const maxPerDay = settings.batch.maxEmailsPerDay;
  const today = getUtcToday();
  const state = readState();

  let newCount;
  if (state.date !== today) {
    // New day — reset and start at 1
    newCount = 1;
  } else {
    newCount = state.count + 1;
  }

  const newState = {
    date: today,
    count: newCount,
    lastSentAt: new Date().toISOString()
  };

  // This throws on I/O failure — intentional
  writeStateAtomic(newState);

  return {
    date: today,
    count: newCount,
    remaining: Math.max(0, maxPerDay - newCount)
  };
}

/**
 * Check whether a send is allowed under the daily quota.
 *
 * @param {object} settings - App settings (needs settings.batch.maxEmailsPerDay)
 * @returns {boolean} true if count < maxEmailsPerDay
 */
function canSend(settings) {
  const { count } = getCount(settings);
  const maxPerDay = settings.batch.maxEmailsPerDay;
  return count < maxPerDay;
}

module.exports = { getCount, increment, canSend };
