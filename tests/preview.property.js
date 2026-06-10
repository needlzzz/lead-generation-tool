/**
 * Property-Based Tests for Preview Site Generation
 *
 * Uses fast-check to validate correctness properties that must hold
 * across ALL valid inputs — not just specific examples.
 *
 * 8 Properties covering:
 * - Config generation validity (Req 12.1)
 * - Color derivation math (Req 12.1)
 * - Slug format/no-consecutive-hyphens (Req 12.2)
 * - Fallback validity (Req 12.1)
 * - Expiry correctness (Req 12.5)
 * - Email placeholder degradation (Req 12.5)
 * - Feature safety (Req 12.1)
 */

const fc = require('fast-check');
const { generateConfig, deriveColors, PRESET_MAP, FORBIDDEN_FEATURES } = require('../server/lib/configGenerator');
const { generateSlug } = require('../server/lib/slugGenerator');
const { renderTemplate } = require('../server/lib/emailService');
const { createPreview, EXPIRY_DURATION_MS } = require('../server/lib/previewRegistry');
const fs = require('fs');
const path = require('path');

// --- Test Helpers ---

// Clean up preview registry before/after expiry tests
const PREVIEWS_FILE = path.join(__dirname, '..', 'server', 'data', 'previews.json');

function cleanupRegistry() {
  if (fs.existsSync(PREVIEWS_FILE)) {
    fs.unlinkSync(PREVIEWS_FILE);
  }
}

// --- Property 1: Config Generation produces valid output ---
// **Validates: Requirements 1.1, 1.3**

test('Property 1: generateConfig always produces valid output for valid leads', () => {
  const categories = [...Object.keys(PRESET_MAP), 'unknown', 'random', '123'];

  fc.assert(
    fc.property(
      fc.string({ minLength: 1, maxLength: 50 }),  // businessName
      fc.constantFrom(...categories),               // category
      fc.string({ minLength: 1, maxLength: 30 }),  // city
      (businessName, category, city) => {
        const lead = { businessName, category, city, address: 'Street 1' };
        const result = generateConfig(lead, 'test-slug');

        // Must always succeed with valid lead data
        expect(result.success).toBe(true);
        expect(result.config.businessName).toBe(businessName);
        expect(result.config.languages).toEqual(['de']);
        expect(result.config.ctaTarget).toBe('#contactForm');
        expect(result.config.features.contactForm).toBe(true);
      }
    )
  );
});

// --- Property 2: Color derivation round-trip consistency ---
// **Validates: Requirements 1.5**

test('Property 2: deriveColors produces valid hex and accent = primary', () => {
  fc.assert(
    fc.property(
      fc.integer({ min: 0, max: 255 }),
      fc.integer({ min: 0, max: 255 }),
      fc.integer({ min: 0, max: 255 }),
      (r, g, b) => {
        const hex = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
        const result = deriveColors(hex);

        // Valid hex format
        expect(result.secondary).toMatch(/^#[0-9a-f]{6}$/);

        // Accent equals primary
        expect(result.accent).toBe(hex);

        // Secondary channel calculation (red channel as representative)
        const sr = parseInt(result.secondary.slice(1, 3), 16);
        const expectedSr = Math.round(r * 0.15 + 255 * 0.85);
        expect(sr).toBe(expectedSr);

        // Green channel
        const sg = parseInt(result.secondary.slice(3, 5), 16);
        const expectedSg = Math.round(g * 0.15 + 255 * 0.85);
        expect(sg).toBe(expectedSg);

        // Blue channel
        const sb = parseInt(result.secondary.slice(5, 7), 16);
        const expectedSb = Math.round(b * 0.15 + 255 * 0.85);
        expect(sb).toBe(expectedSb);
      }
    )
  );
});

// --- Property 3: Slug format compliance ---
// **Validates: Requirements 5.1, 5.2, 5.3, 5.4**

test('Property 3: slug format matches expected pattern and length ≤ 80', () => {
  fc.assert(
    fc.property(
      fc.string({ minLength: 1, maxLength: 60 }),  // businessName
      fc.string({ minLength: 1, maxLength: 30 }),  // city
      (businessName, city) => {
        const slug = generateSlug(businessName, city, []);

        // Must start with 8-char hex prefix
        expect(slug.slice(0, 8)).toMatch(/^[a-f0-9]{8}$/);

        // Entire slug must be lowercase alphanumeric + hyphens only
        expect(slug).toMatch(/^[a-f0-9][a-z0-9-]*$/);

        // Length constraint
        expect(slug.length).toBeLessThanOrEqual(80);

        // If name/city produce content, slug should have a hyphen after prefix
        const hasAlphanumeric = /[a-z0-9]/.test(businessName.toLowerCase().replace(/[^a-z0-9]/g, ''));
        const cityHasAlphanumeric = /[a-z0-9]/.test(city.toLowerCase().replace(/[^a-z0-9]/g, ''));
        if (hasAlphanumeric || cityHasAlphanumeric) {
          expect(slug.length).toBeGreaterThan(8);
          expect(slug[8]).toBe('-');
        }
      }
    )
  );
});

// --- Property 4: Slug contains no consecutive hyphens ---
// **Validates: Requirements 5.2**

test('Property 4: slug never contains consecutive hyphens', () => {
  fc.assert(
    fc.property(
      fc.string({ minLength: 1, maxLength: 60 }),  // businessName (arbitrary unicode)
      fc.string({ minLength: 1, maxLength: 30 }),  // city (arbitrary unicode)
      (businessName, city) => {
        const slug = generateSlug(businessName, city, []);

        // No consecutive hyphens anywhere
        expect(slug).not.toContain('--');
      }
    )
  );
});

// --- Property 5: Config Generator fallback always produces valid output ---
// **Validates: Requirements 1.3**

test('Property 5: generateConfig with arbitrary category never throws and produces valid result', () => {
  fc.assert(
    fc.property(
      fc.string({ minLength: 0, maxLength: 100 }),  // arbitrary category
      (category) => {
        const lead = { businessName: 'Test Business', category: category || 'x', city: 'Bern', address: 'Street 1' };
        const result = generateConfig(lead, 'test-slug');

        // Must never throw — always return a result object
        expect(result).toBeDefined();
        expect(typeof result.success).toBe('boolean');

        if (result.success) {
          // If success, config must have all required fields
          expect(result.config.businessName).toBe('Test Business');
          expect(result.config.theme).toBeDefined();
          expect(result.config.primaryColor).toMatch(/^#[0-9a-fA-F]{6}$/);
          expect(result.config.features).toBeDefined();
          expect(result.config.services).toBeDefined();
          expect(Array.isArray(result.config.services)).toBe(true);
        } else {
          // If failure, must have an error message
          expect(result.error).toBeDefined();
          expect(typeof result.error).toBe('string');
        }
      }
    )
  );
});

// --- Property 6: Expiry calculation correctness ---
// **Validates: Requirements 6.1**

describe('Property 6: Expiry is exactly 30 days after creation', () => {
  beforeEach(cleanupRegistry);
  afterEach(cleanupRegistry);

  test('expiresAt - createdAt === 30 * 24 * 60 * 60 * 1000 ms', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 1000 }),  // just a counter to run multiple iterations
        (_i) => {
          const entry = createPreview({
            slug: `test-${Date.now()}-${Math.random().toString(36).slice(2)}`,
            leadId: `lead-${Date.now()}-${Math.random().toString(36).slice(2)}`
          });

          const created = new Date(entry.createdAt).getTime();
          const expires = new Date(entry.expiresAt).getTime();

          // Expiry must be exactly 30 days after creation
          expect(expires - created).toBe(EXPIRY_DURATION_MS);

          // Both must be valid ISO timestamps
          expect(new Date(entry.createdAt).toISOString()).toBe(entry.createdAt);
          expect(new Date(entry.expiresAt).toISOString()).toBe(entry.expiresAt);
        }
      ),
      { numRuns: 20 }  // Limited runs since each creates a real file entry
    );
  });
});

// --- Property 7: Email placeholder graceful degradation ---
// **Validates: Requirements 8.1, 8.2, 8.3, 8.4, 8.5**

test('Property 7: Preview placeholders never appear literally in output', () => {
  fc.assert(
    fc.property(
      fc.option(fc.webUrl()),        // previewUrl (might be null)
      fc.option(fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') })),           // previewExpiresAt (might be null)
      (previewUrl, previewExpiresAt) => {
        const lead = {
          businessName: 'Test GmbH',
          contactPerson: 'Max Muster',
          previewUrl: previewUrl || null,
          previewExpiresAt: previewExpiresAt && !isNaN(previewExpiresAt.getTime()) ? previewExpiresAt.toISOString() : null
        };
        const template = {
          subject: 'Demo: [Preview-Link] [Preview-Screenshot] [Preview-Ablauf]',
          body: 'Hier ist Ihr Preview: [Preview-Link] Screenshot: [Preview-Screenshot] Gültig bis: [Preview-Ablauf]'
        };
        const result = renderTemplate(template, lead, { calendlyLink: '', userName: '' });

        // No literal placeholders should remain
        expect(result.subject).not.toContain('[Preview-Link]');
        expect(result.subject).not.toContain('[Preview-Screenshot]');
        expect(result.subject).not.toContain('[Preview-Ablauf]');
        expect(result.body).not.toContain('[Preview-Link]');
        expect(result.body).not.toContain('[Preview-Screenshot]');
        expect(result.body).not.toContain('[Preview-Ablauf]');
      }
    )
  );
});

// --- Property 8: Features never include forbidden features ---
// **Validates: Requirements 1.9**

test('Property 8: Generated config never enables testimonials, events, or faq', () => {
  const allCategories = [...Object.keys(PRESET_MAP), 'unknown', 'abc', '', 'test-niche', '!!!'];

  fc.assert(
    fc.property(
      fc.string({ minLength: 1, maxLength: 40 }),  // businessName
      fc.constantFrom(...allCategories),             // category (known + arbitrary)
      fc.string({ minLength: 1, maxLength: 20 }),  // city
      (businessName, category, city) => {
        const lead = { businessName, category: category || 'x', city, address: 'Addr' };
        const result = generateConfig(lead, 'test-slug');

        if (result.success) {
          // No forbidden features should ever be enabled
          for (const forbidden of FORBIDDEN_FEATURES) {
            expect(result.config.features[forbidden]).not.toBe(true);
          }
        }
      }
    )
  );
});
