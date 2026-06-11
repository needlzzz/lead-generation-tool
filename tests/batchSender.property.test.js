/**
 * Property-based tests for batchSender module
 *
 * **Validates: Requirements 4.6, 8.1, 8.2**
 */

const fc = require('fast-check');
const { buildAutoQueue, buildTypedQueue } = require('../server/lib/batchSender');

describe('batchSender property tests', () => {
  test('Property 6: Bounce Permanence — bounced leads never in send queue', () => {
    /**
     * **Validates: Requirements 8.1, 8.2**
     *
     * A lead marked `emailBounced: true` SHALL never appear in any generated send queue,
     * regardless of its other fields (status, dates, email presence, previewUrl, etc.).
     */
    const leadArb = fc.record({
      id: fc.uuid(),
      email: fc.oneof(fc.emailAddress(), fc.constant('')),
      status: fc.constantFrom('Discovered', 'Reached Out'),
      emailBounced: fc.boolean(),
      previewUrl: fc.oneof(fc.constant('https://preview.kaelint.ch/test/'), fc.constant(null)),
      dateEmail1Sent: fc.oneof(fc.constant('2026-06-01'), fc.constant(null)),
      dateFollowUp1Sent: fc.oneof(fc.constant('2026-06-04'), fc.constant(null)),
      dateFollowUp2Sent: fc.oneof(fc.constant(null)),
    });

    fc.assert(
      fc.property(
        fc.array(leadArb, { minLength: 0, maxLength: 50 }),
        (leads) => {
          const today = '2026-06-15'; // Ensures all dates are 3+ days ago

          // Collect all bounced lead IDs
          const bouncedIds = new Set(
            leads.filter(l => l.emailBounced).map(l => l.id)
          );

          // Test buildAutoQueue — no bounced lead should appear
          const autoQueue = buildAutoQueue(leads, today);
          for (const item of autoQueue) {
            if (bouncedIds.has(item.leadId)) return false;
          }

          // Test buildTypedQueue for each email type — no bounced lead should appear
          for (const type of ['email1', 'email2', 'email3']) {
            const typedQueue = buildTypedQueue(leads, type, today);
            for (const item of typedQueue) {
              if (bouncedIds.has(item.leadId)) return false;
            }
          }

          return true;
        }
      ),
      { numRuns: 500 }
    );
  });
});
