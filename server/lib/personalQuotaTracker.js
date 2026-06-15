/**
 * Personal SMTP daily send quota tracker.
 * Separate from the batch/Brevo quota — tracks emails sent via personal SMTP.
 * Persists to server/data/personal-send-quota.json.
 */

const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');
const QUOTA_FILE = path.join(DATA_DIR, 'personal-send-quota.json');

function getUtcToday() {
  return new Date().toISOString().slice(0, 10);
}

function readState() {
  try {
    if (!fs.existsSync(QUOTA_FILE)) {
      return { date: getUtcToday(), count: 0 };
    }
    const raw = fs.readFileSync(QUOTA_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed.count !== 'number') {
      return { date: getUtcToday(), count: 0 };
    }
    return parsed;
  } catch (err) {
    return { date: getUtcToday(), count: 0 };
  }
}

function writeState(state) {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  const tmpFile = QUOTA_FILE + '.tmp.' + Date.now();
  fs.writeFileSync(tmpFile, JSON.stringify(state, null, 2), 'utf-8');
  fs.renameSync(tmpFile, QUOTA_FILE);
}

/**
 * Get today's count (with lazy day reset).
 * @param {number} maxPerDay - The configured daily limit
 * @returns {{ count: number, remaining: number, maxPerDay: number }}
 */
function getCount(maxPerDay) {
  const today = getUtcToday();
  const state = readState();
  const count = state.date === today ? state.count : 0;
  return { count, remaining: Math.max(0, maxPerDay - count), maxPerDay };
}

/**
 * Increment counter. Returns updated count.
 */
function increment() {
  const today = getUtcToday();
  const state = readState();
  const newCount = state.date === today ? state.count + 1 : 1;
  writeState({ date: today, count: newCount });
  return newCount;
}

/**
 * Check if sending is allowed.
 * @param {number} maxPerDay
 * @returns {boolean}
 */
function canSend(maxPerDay) {
  const { count } = getCount(maxPerDay);
  return count < maxPerDay;
}

module.exports = { getCount, increment, canSend };
