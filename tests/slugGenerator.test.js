/**
 * Tests for slugGenerator module
 *
 * Covers: format regex, umlaut replacement, special characters,
 * truncation to 80 chars, consecutive hyphens, uniqueness retry,
 * and computeLeadDataHash.
 */

const { generateSlug, computeLeadDataHash, slugify, replaceUmlauts } = require('../server/lib/slugGenerator');

// --- Slug Format Tests ---

describe('generateSlug - format compliance', () => {
  test('produces slug matching format: {8-hex}-{name}-{city}', () => {
    const slug = generateSlug('Coiffeur Müller', 'Bern');
    // 8-char hex prefix, then hyphen, then slugified name, then hyphen, then city
    expect(slug).toMatch(/^[a-f0-9]{8}-[a-z0-9-]+-[a-z0-9-]+$/);
  });

  test('slug starts with 8-character hex UUID prefix', () => {
    const slug = generateSlug('Test Business', 'Zürich');
    const prefix = slug.split('-')[0];
    expect(prefix).toMatch(/^[a-f0-9]{8}$/);
  });

  test('slug contains business name portion', () => {
    const slug = generateSlug('Bäckerei Schmidt', 'Basel');
    expect(slug).toContain('baeckerei-schmidt');
  });

  test('slug ends with city portion', () => {
    const slug = generateSlug('Salon Bella', 'Luzern');
    expect(slug).toMatch(/luzern$/);
  });

  test('slug is entirely lowercase', () => {
    const slug = generateSlug('GROSS Geschäft', 'ZÜRICH');
    expect(slug).toBe(slug.toLowerCase());
  });
});

// --- Umlaut Replacement Tests ---

describe('generateSlug - umlaut replacement', () => {
  test('replaces ä with ae', () => {
    const slug = generateSlug('Bäckerei', 'Aarau');
    expect(slug).toContain('baeckerei');
    expect(slug).not.toContain('ä');
  });

  test('replaces ö with oe', () => {
    const slug = generateSlug('Schönheit', 'Bern');
    expect(slug).toContain('schoenheit');
    expect(slug).not.toContain('ö');
  });

  test('replaces ü with ue', () => {
    const slug = generateSlug('Blüte', 'Zürich');
    expect(slug).toContain('bluete');
    expect(slug).toContain('zuerich');
    expect(slug).not.toContain('ü');
  });

  test('replaces ß with ss', () => {
    const slug = generateSlug('Straße', 'Bern');
    expect(slug).toContain('strasse');
    expect(slug).not.toContain('ß');
  });

  test('replaces uppercase umlauts', () => {
    const slug = generateSlug('Über Öl Ä', 'Bern');
    expect(slug).toContain('ueber-oel-ae');
  });

  test('handles multiple umlauts in one word', () => {
    const slug = generateSlug('Müller Büro Öffnung', 'Zürich');
    expect(slug).toContain('mueller-buero-oeffnung');
    expect(slug).toContain('zuerich');
  });
});

// --- Special Character Tests ---

describe('generateSlug - special character handling', () => {
  test('removes special characters (dots, commas, apostrophes)', () => {
    const slug = generateSlug("Dr. Müller's Praxis", 'St. Gallen');
    expect(slug).not.toMatch(/[.']/);
    // Apostrophe becomes a hyphen separator: mueller-s-praxis
    expect(slug).toContain('dr-mueller-s-praxis');
    expect(slug).toContain('st-gallen');
  });

  test('removes parentheses and brackets', () => {
    const slug = generateSlug('Salon (Premium)', 'Bern');
    expect(slug).not.toMatch(/[()[\]]/);
  });

  test('converts spaces to hyphens', () => {
    const slug = generateSlug('My Cool Business', 'Big City');
    expect(slug).toContain('my-cool-business');
    expect(slug).toContain('big-city');
  });

  test('handles ampersand and plus', () => {
    const slug = generateSlug('Hair & Beauty + Style', 'Bern');
    expect(slug).not.toMatch(/[&+]/);
    expect(slug).toContain('hair-beauty-style');
  });

  test('handles numbers correctly', () => {
    const slug = generateSlug('Studio 21', 'Bern');
    expect(slug).toContain('studio-21');
  });

  test('handles slash and backslash', () => {
    const slug = generateSlug('Salon/Spa', 'Bern');
    expect(slug).not.toMatch(/[/\\]/);
  });
});

// --- Consecutive Hyphens Tests ---

describe('generateSlug - no consecutive hyphens', () => {
  test('collapses multiple spaces into single hyphen', () => {
    const slug = generateSlug('Hello   World', 'Bern');
    expect(slug).not.toContain('--');
  });

  test('collapses mixed special chars into single hyphen', () => {
    const slug = generateSlug('A - B -- C', 'Bern');
    expect(slug).not.toContain('--');
  });

  test('no consecutive hyphens with complex input', () => {
    const slug = generateSlug('Café & Bar "Zum Löwen"', 'St. Gallen');
    expect(slug).not.toContain('--');
  });

  test('no leading or trailing hyphens in name/city portions', () => {
    const slug = generateSlug(' -Leading-Trailing- ', ' -City- ');
    // After the 8-char prefix and separator hyphen, shouldn't have double hyphens
    expect(slug).not.toContain('--');
    expect(slug).not.toMatch(/-$/);
  });
});

// --- Truncation Tests ---

describe('generateSlug - 80-char truncation', () => {
  test('truncates slug to max 80 characters', () => {
    const longName = 'A'.repeat(50) + ' Very Long Business Name That Exceeds Limits';
    const slug = generateSlug(longName, 'Schaffhausen');
    expect(slug.length).toBeLessThanOrEqual(80);
  });

  test('short slugs are not truncated', () => {
    const slug = generateSlug('Salon', 'Bern');
    // 8 (prefix) + 1 (-) + 5 (salon) + 1 (-) + 4 (bern) = 19
    expect(slug.length).toBeLessThan(80);
  });

  test('removes trailing hyphen after truncation', () => {
    // Create input that will truncate right at a hyphen boundary
    const longName = 'a-'.repeat(40); // 80 chars of alternating a-
    const slug = generateSlug(longName, 'city');
    expect(slug).not.toMatch(/-$/);
    expect(slug.length).toBeLessThanOrEqual(80);
  });

  test('truncated slug is still valid format', () => {
    const longName = 'Superlange Geschäftsbezeichnung die definitiv über achtzig Zeichen hinausgeht und gekürzt werden muss';
    const slug = generateSlug(longName, 'Schaffhausen');
    expect(slug.length).toBeLessThanOrEqual(80);
    // Should still start with hex prefix
    expect(slug).toMatch(/^[a-f0-9]{8}-/);
  });
});

// --- Uniqueness Retry Tests ---

describe('generateSlug - uniqueness retry', () => {
  test('returns unique slug on first attempt when no collisions', () => {
    const slug = generateSlug('Test', 'Bern', []);
    expect(slug).toBeDefined();
    expect(slug.length).toBeGreaterThan(0);
  });

  test('retries with new UUID prefix on collision (array)', () => {
    // Generate a slug first, then force collision
    const firstSlug = generateSlug('Test', 'Bern');
    // Providing it as existing should force a different prefix
    const secondSlug = generateSlug('Test', 'Bern', [firstSlug]);
    expect(secondSlug).not.toBe(firstSlug);
    // Both should have same suffix (name-city) but different prefix
    const firstSuffix = firstSlug.slice(9); // after "xxxxxxxx-"
    const secondSuffix = secondSlug.slice(9);
    expect(firstSuffix).toBe(secondSuffix);
  });

  test('retries with new UUID prefix on collision (function)', () => {
    const existingSlugs = [];
    const existingSlugsFn = () => existingSlugs;

    const slug1 = generateSlug('Salon', 'Bern', existingSlugsFn);
    existingSlugs.push(slug1);

    const slug2 = generateSlug('Salon', 'Bern', existingSlugsFn);
    expect(slug2).not.toBe(slug1);
  });

  test('throws error after 3 failed attempts', () => {
    // Create a function that always returns a matching slug
    // Since we can't predict the UUID, we make the function return ALL possible results
    const allSlugs = () => {
      // Return a massive list — but actually we need to trick it
      // Instead, use a function that dynamically builds a slug matching the pattern
      return Array.from({ length: 1000 }, (_, i) => {
        // We can't know the exact slugs, so let's use a different approach
        return 'placeholder';
      });
    };

    // Better approach: mock crypto.randomUUID to return predictable values
    const crypto = require('crypto');
    const originalRandomUUID = crypto.randomUUID;

    // Make randomUUID return the same value each time
    crypto.randomUUID = () => 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';

    try {
      expect(() => {
        generateSlug('Test', 'Bern', ['aaaaaaaa-test-bern']);
      }).toThrow('Slug-Kollision nach 3 Versuchen');
    } finally {
      crypto.randomUUID = originalRandomUUID;
    }
  });

  test('succeeds on second attempt when first collides', () => {
    const crypto = require('crypto');
    const originalRandomUUID = crypto.randomUUID;

    let callCount = 0;
    crypto.randomUUID = () => {
      callCount++;
      if (callCount === 1) return 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';
      return 'bbbbbbbb-cccc-dddd-eeee-ffffffffffff';
    };

    try {
      const slug = generateSlug('Test', 'Bern', ['aaaaaaaa-test-bern']);
      expect(slug).toBe('bbbbbbbb-test-bern');
    } finally {
      crypto.randomUUID = originalRandomUUID;
    }
  });

  test('works with null/undefined existingSlugs', () => {
    const slug1 = generateSlug('Test', 'Bern', null);
    const slug2 = generateSlug('Test', 'Bern', undefined);
    expect(slug1).toBeDefined();
    expect(slug2).toBeDefined();
  });
});

// --- computeLeadDataHash Tests ---

describe('computeLeadDataHash', () => {
  test('returns a 16-character hex string', () => {
    const hash = computeLeadDataHash({
      businessName: 'Test',
      category: 'coiffeur',
      city: 'Bern'
    });
    expect(hash).toMatch(/^[a-f0-9]{16}$/);
    expect(hash.length).toBe(16);
  });

  test('same input produces same hash', () => {
    const lead = { businessName: 'Salon Bella', category: 'coiffeur', city: 'Zürich' };
    const hash1 = computeLeadDataHash(lead);
    const hash2 = computeLeadDataHash(lead);
    expect(hash1).toBe(hash2);
  });

  test('different businessName produces different hash', () => {
    const hash1 = computeLeadDataHash({ businessName: 'Salon A', category: 'coiffeur', city: 'Bern' });
    const hash2 = computeLeadDataHash({ businessName: 'Salon B', category: 'coiffeur', city: 'Bern' });
    expect(hash1).not.toBe(hash2);
  });

  test('different category produces different hash', () => {
    const hash1 = computeLeadDataHash({ businessName: 'Test', category: 'coiffeur', city: 'Bern' });
    const hash2 = computeLeadDataHash({ businessName: 'Test', category: 'restaurant', city: 'Bern' });
    expect(hash1).not.toBe(hash2);
  });

  test('different city produces different hash', () => {
    const hash1 = computeLeadDataHash({ businessName: 'Test', category: 'coiffeur', city: 'Bern' });
    const hash2 = computeLeadDataHash({ businessName: 'Test', category: 'coiffeur', city: 'Basel' });
    expect(hash1).not.toBe(hash2);
  });

  test('handles missing city (null/undefined) gracefully', () => {
    const hash1 = computeLeadDataHash({ businessName: 'Test', category: 'coiffeur', city: null });
    const hash2 = computeLeadDataHash({ businessName: 'Test', category: 'coiffeur', city: undefined });
    const hash3 = computeLeadDataHash({ businessName: 'Test', category: 'coiffeur' });
    // All should produce valid hashes
    expect(hash1).toMatch(/^[a-f0-9]{16}$/);
    expect(hash2).toMatch(/^[a-f0-9]{16}$/);
    expect(hash3).toMatch(/^[a-f0-9]{16}$/);
    // null and undefined both resolve to '' via || ''
    expect(hash1).toBe(hash2);
    expect(hash2).toBe(hash3);
  });

  test('uses SHA-256 truncated to 16 chars', () => {
    const crypto = require('crypto');
    const lead = { businessName: 'Salon Bella', category: 'coiffeur', city: 'Bern' };
    const data = `${lead.businessName}|${lead.category}|${lead.city || ''}`;
    const expected = crypto.createHash('sha256').update(data).digest('hex').slice(0, 16);
    expect(computeLeadDataHash(lead)).toBe(expected);
  });
});

// --- Slugify Helper Tests ---

describe('slugify helper', () => {
  test('lowercases input', () => {
    expect(slugify('HELLO')).toBe('hello');
  });

  test('replaces spaces with hyphens', () => {
    expect(slugify('hello world')).toBe('hello-world');
  });

  test('removes leading/trailing hyphens', () => {
    expect(slugify('-hello-')).toBe('hello');
  });

  test('collapses multiple hyphens', () => {
    expect(slugify('a---b')).toBe('a-b');
  });

  test('handles empty string', () => {
    expect(slugify('')).toBe('');
  });
});

// --- replaceUmlauts Helper Tests ---

describe('replaceUmlauts helper', () => {
  test('replaces all lowercase umlauts', () => {
    expect(replaceUmlauts('äöüß')).toBe('aeoeuess');
  });

  test('replaces all uppercase umlauts', () => {
    expect(replaceUmlauts('ÄÖÜ')).toBe('aeoeue');
  });

  test('leaves non-umlaut characters unchanged', () => {
    expect(replaceUmlauts('hello')).toBe('hello');
  });

  test('handles mixed content', () => {
    expect(replaceUmlauts('Müller Büro')).toBe('Mueller Buero');
  });
});
