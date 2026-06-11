/**
 * Tests for quotaTracker module
 *
 * Covers: lazy day reset, increment + atomic write, I/O failure handling,
 * missing/corrupt file scenarios, canSend boundary conditions.
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

// We need to override the data directory for testing
let quotaTracker;
let QUOTA_FILE;
let DATA_DIR;
let tmpDir;

beforeEach(() => {
  // Create a temp directory for each test
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'quota-test-'));

  // Clear the module cache so we can patch the paths
  jest.resetModules();

  // Mock the path constants in the module
  jest.doMock('path', () => {
    const originalPath = jest.requireActual('path');
    return {
      ...originalPath,
      join: (...args) => {
        // Intercept the DATA_DIR construction
        if (args.length === 3 && args[1] === '..' && args[2] === 'data') {
          return tmpDir;
        }
        // Intercept QUOTA_FILE construction
        if (args.length === 2 && args[0] === tmpDir && args[1] === 'send-quota.json') {
          return originalPath.join(tmpDir, 'send-quota.json');
        }
        // Intercept temp file construction
        if (args.length === 2 && args[0] === tmpDir && typeof args[1] === 'string' && args[1].startsWith('.send-quota.tmp.')) {
          return originalPath.join(tmpDir, args[1]);
        }
        return originalPath.join(...args);
      }
    };
  });

  quotaTracker = require('../server/lib/quotaTracker');
  QUOTA_FILE = path.join(tmpDir, 'send-quota.json');
  DATA_DIR = tmpDir;
});

afterEach(() => {
  // Clean up temp directory
  try {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  } catch (_) { /* ignore */ }
});

const defaultSettings = {
  batch: { maxEmailsPerDay: 300 }
};

function writeQuotaFile(data) {
  fs.writeFileSync(QUOTA_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

function getUtcToday() {
  return new Date().toISOString().slice(0, 10);
}

// --- getCount tests ---

describe('quotaTracker.getCount', () => {
  test('returns count=0 when file is missing', () => {
    const result = quotaTracker.getCount(defaultSettings);
    expect(result.count).toBe(0);
    expect(result.remaining).toBe(300);
    expect(result.date).toBe(getUtcToday());
  });

  test('returns stored count when date matches today', () => {
    const today = getUtcToday();
    writeQuotaFile({ date: today, count: 147, lastSentAt: '2026-06-11T14:23:00.000Z' });

    const result = quotaTracker.getCount(defaultSettings);
    expect(result.count).toBe(147);
    expect(result.remaining).toBe(153);
    expect(result.isNewDay).toBe(false);
  });

  test('lazy day reset: returns count=0 when stored date is yesterday', () => {
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    writeQuotaFile({ date: yesterday, count: 250, lastSentAt: '2026-06-10T16:00:00.000Z' });

    const result = quotaTracker.getCount(defaultSettings);
    expect(result.count).toBe(0);
    expect(result.remaining).toBe(300);
    expect(result.isNewDay).toBe(true);
    expect(result.date).toBe(getUtcToday());
  });

  test('handles corrupt JSON file as count=0', () => {
    fs.writeFileSync(QUOTA_FILE, 'not valid json {{{{', 'utf-8');

    const result = quotaTracker.getCount(defaultSettings);
    expect(result.count).toBe(0);
    expect(result.remaining).toBe(300);
  });

  test('handles file with invalid structure as count=0', () => {
    writeQuotaFile({ foo: 'bar' });

    const result = quotaTracker.getCount(defaultSettings);
    expect(result.count).toBe(0);
    expect(result.remaining).toBe(300);
  });

  test('remaining is clamped to 0 when count exceeds max', () => {
    const today = getUtcToday();
    writeQuotaFile({ date: today, count: 350, lastSentAt: null });

    const result = quotaTracker.getCount(defaultSettings);
    expect(result.count).toBe(350);
    expect(result.remaining).toBe(0);
  });
});

// --- increment tests ---

describe('quotaTracker.increment', () => {
  test('increments from 0 when file is missing', () => {
    const result = quotaTracker.increment(defaultSettings);
    expect(result.count).toBe(1);
    expect(result.remaining).toBe(299);
    expect(result.date).toBe(getUtcToday());

    // Verify file was written
    const stored = JSON.parse(fs.readFileSync(QUOTA_FILE, 'utf-8'));
    expect(stored.count).toBe(1);
    expect(stored.date).toBe(getUtcToday());
    expect(stored.lastSentAt).toBeDefined();
  });

  test('increments existing count for same day', () => {
    const today = getUtcToday();
    writeQuotaFile({ date: today, count: 50, lastSentAt: null });

    const result = quotaTracker.increment(defaultSettings);
    expect(result.count).toBe(51);
    expect(result.remaining).toBe(249);
  });

  test('resets count to 1 on a new day (lazy reset on increment)', () => {
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    writeQuotaFile({ date: yesterday, count: 250, lastSentAt: null });

    const result = quotaTracker.increment(defaultSettings);
    expect(result.count).toBe(1);
    expect(result.remaining).toBe(299);
    expect(result.date).toBe(getUtcToday());
  });

  test('atomic write: file is valid JSON after increment', () => {
    quotaTracker.increment(defaultSettings);
    const raw = fs.readFileSync(QUOTA_FILE, 'utf-8');
    expect(() => JSON.parse(raw)).not.toThrow();
  });

  test('throws on I/O write failure', () => {
    // Make the data directory read-only to force a write error
    fs.chmodSync(tmpDir, 0o444);

    expect(() => {
      quotaTracker.increment(defaultSettings);
    }).toThrow();

    // Restore permissions for cleanup
    fs.chmodSync(tmpDir, 0o755);
  });

  test('updates lastSentAt to a recent ISO timestamp', () => {
    const before = Date.now();
    quotaTracker.increment(defaultSettings);
    const after = Date.now();

    const stored = JSON.parse(fs.readFileSync(QUOTA_FILE, 'utf-8'));
    const sentAt = new Date(stored.lastSentAt).getTime();
    expect(sentAt).toBeGreaterThanOrEqual(before);
    expect(sentAt).toBeLessThanOrEqual(after);
  });
});

// --- canSend tests ---

describe('quotaTracker.canSend', () => {
  test('returns true when count is below limit', () => {
    const today = getUtcToday();
    writeQuotaFile({ date: today, count: 100, lastSentAt: null });

    expect(quotaTracker.canSend(defaultSettings)).toBe(true);
  });

  test('returns false when count equals limit', () => {
    const today = getUtcToday();
    writeQuotaFile({ date: today, count: 300, lastSentAt: null });

    expect(quotaTracker.canSend(defaultSettings)).toBe(false);
  });

  test('returns false when count exceeds limit', () => {
    const today = getUtcToday();
    writeQuotaFile({ date: today, count: 301, lastSentAt: null });

    expect(quotaTracker.canSend(defaultSettings)).toBe(false);
  });

  test('returns true when count is exactly one below limit', () => {
    const today = getUtcToday();
    writeQuotaFile({ date: today, count: 299, lastSentAt: null });

    expect(quotaTracker.canSend(defaultSettings)).toBe(true);
  });

  test('returns true on a new day even if yesterday was maxed', () => {
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    writeQuotaFile({ date: yesterday, count: 300, lastSentAt: null });

    expect(quotaTracker.canSend(defaultSettings)).toBe(true);
  });

  test('returns true when file is missing', () => {
    expect(quotaTracker.canSend(defaultSettings)).toBe(true);
  });
});
