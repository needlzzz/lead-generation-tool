/**
 * Property-based test for quotaTracker — Quota Invariant
 *
 * **Validates: Requirements 5.3, 5.4, 5.5**
 *
 * Property 1: Quota Invariant
 * For any sequence of increment calls within a day, count SHALL never
 * exceed `maxEmailsPerDay`. The pattern is: call canSend() before each
 * increment — only increment if canSend returns true. After any number
 * of attempts, getCount().count ≤ maxEmailsPerDay.
 */

const fc = require('fast-check');
const fs = require('fs');
const path = require('path');
const os = require('os');

let quotaTracker;
let tmpDir;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'quota-prop-'));

  jest.resetModules();

  jest.doMock('path', () => {
    const originalPath = jest.requireActual('path');
    return {
      ...originalPath,
      join: (...args) => {
        if (args.length === 3 && args[1] === '..' && args[2] === 'data') {
          return tmpDir;
        }
        if (args.length === 2 && args[0] === tmpDir && args[1] === 'send-quota.json') {
          return originalPath.join(tmpDir, 'send-quota.json');
        }
        if (args.length === 2 && args[0] === tmpDir && typeof args[1] === 'string' && args[1].startsWith('.send-quota.tmp.')) {
          return originalPath.join(tmpDir, args[1]);
        }
        return originalPath.join(...args);
      }
    };
  });

  quotaTracker = require('../server/lib/quotaTracker');
});

afterEach(() => {
  try {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  } catch (_) { /* ignore */ }
});

describe('quotaTracker property tests', () => {
  test('Property 1: Quota Invariant — count never exceeds maxEmailsPerDay', () => {
    const quotaFile = path.join(tmpDir, 'send-quota.json');

    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 1000 }),  // maxEmailsPerDay
        fc.integer({ min: 1, max: 50 }),     // number of send attempts
        (maxPerDay, numAttempts) => {
          // Clear state before each property iteration
          try { fs.unlinkSync(quotaFile); } catch (_) { /* ignore if missing */ }

          // Setup: create settings with the generated maxPerDay
          const settings = { batch: { maxEmailsPerDay: maxPerDay } };

          // Loop: attempt to send numAttempts times using canSend gate
          for (let i = 0; i < numAttempts; i++) {
            if (quotaTracker.canSend(settings)) {
              quotaTracker.increment(settings);
            }

            // Invariant: after every iteration, count must not exceed maxPerDay
            const { count } = quotaTracker.getCount(settings);
            if (count > maxPerDay) {
              return false; // Property violated
            }
          }

          // Final assertion: count ≤ maxPerDay
          const { count } = quotaTracker.getCount(settings);
          return count <= maxPerDay;
        }
      ),
      { numRuns: 200 }
    );
  });
});
