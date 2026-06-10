/**
 * Tests for configGenerator module
 *
 * Covers: valid output for each preset niche, fallback behavior for unknown
 * categories, correct field mapping from lead data, color derivation,
 * feature filtering (no testimonials/events/faq), placeholder handling.
 *
 * Requirements: 1.1–1.10, 10.1, 12.1
 */

const {
  generateConfig,
  deriveColors,
  PRESET_MAP,
  FALLBACK_PRESET,
  THEME_FONT_MAP,
  ALLOWED_FEATURES,
  FORBIDDEN_FEATURES,
  buildFeatureFlags,
  buildGallery,
  buildOpeningHours,
  resolveTemplate
} = require('../server/lib/configGenerator');

// --- Helper: standard lead for testing ---

function makeLead(overrides = {}) {
  return {
    businessName: 'Test Business',
    category: 'coiffeur',
    city: 'Bern',
    address: 'Marktgasse 12',
    phone: '+41 79 123 45 67',
    email: 'test@example.com',
    contactPerson: 'Max Muster',
    ...overrides
  };
}

// --- Color Derivation Tests ---

describe('deriveColors', () => {
  test('derives correct secondary for coiffeur primary (#8B6914)', () => {
    const result = deriveColors('#8B6914');
    // r=0x8B=139, g=0x69=105, b=0x14=20
    // sr = round(139*0.15 + 255*0.85) = round(20.85 + 216.75) = round(237.6) = 238 = 0xee
    // sg = round(105*0.15 + 255*0.85) = round(15.75 + 216.75) = round(232.5) = 233 = 0xe9 (actually round(232.5) = 232 in some impls)
    // sb = round(20*0.15 + 255*0.85) = round(3 + 216.75) = round(219.75) = 220 = 0xdc
    const r = parseInt(result.secondary.slice(1, 3), 16);
    const g = parseInt(result.secondary.slice(3, 5), 16);
    const b = parseInt(result.secondary.slice(5, 7), 16);

    expect(r).toBe(Math.round(139 * 0.15 + 255 * 0.85));
    expect(g).toBe(Math.round(105 * 0.15 + 255 * 0.85));
    expect(b).toBe(Math.round(20 * 0.15 + 255 * 0.85));
  });

  test('accent equals primary', () => {
    const result = deriveColors('#B91C1C');
    expect(result.accent).toBe('#B91C1C');
  });

  test('secondary for pure black (#000000) is near-white', () => {
    const result = deriveColors('#000000');
    // sr = round(0*0.15 + 255*0.85) = round(216.75) = 217
    expect(result.secondary).toBe('#d9d9d9');
  });

  test('secondary for pure white (#ffffff) is white', () => {
    const result = deriveColors('#ffffff');
    // sr = round(255*0.15 + 255*0.85) = round(255) = 255
    expect(result.secondary).toBe('#ffffff');
  });

  test('returns valid 7-char hex strings', () => {
    const result = deriveColors('#4A7C59');
    expect(result.secondary).toMatch(/^#[0-9a-fA-F]{6}$/);
    // accent equals primary, which may contain uppercase
    expect(result.accent).toMatch(/^#[0-9a-fA-F]{6}$/);
  });

  test('derives correct secondary for restaurant primary (#B91C1C)', () => {
    const result = deriveColors('#B91C1C');
    const r = parseInt(result.secondary.slice(1, 3), 16);
    const g = parseInt(result.secondary.slice(3, 5), 16);
    const b = parseInt(result.secondary.slice(5, 7), 16);

    expect(r).toBe(Math.round(185 * 0.15 + 255 * 0.85));
    expect(g).toBe(Math.round(28 * 0.15 + 255 * 0.85));
    expect(b).toBe(Math.round(28 * 0.15 + 255 * 0.85));
  });
});

// --- Per-Niche Config Generation Tests ---

describe('generateConfig — niche presets', () => {
  const niches = Object.keys(PRESET_MAP);

  test.each(niches)('generates valid config for niche: %s', (niche) => {
    const lead = makeLead({ category: niche, city: 'Zürich' });
    const result = generateConfig(lead, `abcd1234-test-zuerich`);

    expect(result.success).toBe(true);
    expect(result.config).toBeDefined();

    const config = result.config;
    const preset = PRESET_MAP[niche];

    // Theme and colors
    expect(config.theme).toBe(preset.theme);
    expect(config.primaryColor).toBe(preset.primaryColor);
    expect(config.accentColor).toBe(preset.primaryColor);

    // Font family from THEME_FONT_MAP
    expect(config.fontFamily).toBe(THEME_FONT_MAP[preset.theme]);

    // Languages always German
    expect(config.languages).toEqual(['de']);

    // Logo path
    expect(config.logoPath).toBe('logo.svg');

    // CTA target
    expect(config.ctaTarget).toBe('#contactForm');

    // Features are a subset of allowed
    const enabledFeatureNames = Object.keys(config.features).filter(k => config.features[k]);
    for (const feature of enabledFeatureNames) {
      expect(ALLOWED_FEATURES).toContain(feature);
      expect(FORBIDDEN_FEATURES).not.toContain(feature);
    }

    // contactForm always enabled
    expect(config.features.contactForm).toBe(true);

    // Services in LocalizedText format
    expect(config.services.length).toBeGreaterThan(0);
    for (const svc of config.services) {
      expect(svc.name).toHaveProperty('de');
      expect(svc.description).toHaveProperty('de');
      expect(typeof svc.name.de).toBe('string');
      expect(typeof svc.description.de).toBe('string');
    }

    // Tagline and aboutText in LocalizedText format
    expect(config.tagline).toHaveProperty('de');
    expect(config.aboutText).toHaveProperty('de');
    expect(typeof config.tagline.de).toBe('string');
    expect(typeof config.aboutText.de).toBe('string');
  });

  test('coiffeur has correct theme and features', () => {
    const lead = makeLead({ category: 'coiffeur' });
    const { config } = generateConfig(lead, 'slug-123');

    expect(config.theme).toBe('warm-earth');
    expect(config.features.openingHours).toBe(true);
    expect(config.features.gallery).toBe(true);
    expect(config.features.priceList).toBe(true);
    expect(config.features.contactForm).toBe(true);
    expect(config.features.clickToCall).toBe(true);
  });

  test('restaurant has correct theme and features', () => {
    const lead = makeLead({ category: 'restaurant' });
    const { config } = generateConfig(lead, 'slug-123');

    expect(config.theme).toBe('editorial');
    expect(config.features.openingHours).toBe(true);
    expect(config.features.gallery).toBe(true);
    expect(config.features.priceList).toBe(true);
    expect(config.features.contactForm).toBe(true);
    expect(config.features.googleMaps).toBe(true);
  });

  test('therapie has correct theme and features', () => {
    const lead = makeLead({ category: 'therapie' });
    const { config } = generateConfig(lead, 'slug-123');

    expect(config.theme).toBe('sage-wellness');
    expect(config.features.openingHours).toBe(true);
    expect(config.features.scheduling).toBe(true);
    expect(config.features.contactForm).toBe(true);
    expect(config.features.clickToCall).toBe(true);
  });

  test('handwerk has correct theme and features', () => {
    const lead = makeLead({ category: 'handwerk' });
    const { config } = generateConfig(lead, 'slug-123');

    expect(config.theme).toBe('slate-professional');
    expect(config.features.gallery).toBe(true);
    expect(config.features.contactForm).toBe(true);
    expect(config.features.clickToCall).toBe(true);
    expect(config.features.googleMaps).toBe(true);
  });

  test('einzelhandel has correct theme and features', () => {
    const lead = makeLead({ category: 'einzelhandel' });
    const { config } = generateConfig(lead, 'slug-123');

    expect(config.theme).toBe('soft-gradient');
    expect(config.features.openingHours).toBe(true);
    expect(config.features.priceList).toBe(true);
    expect(config.features.contactForm).toBe(true);
    expect(config.features.googleMaps).toBe(true);
  });

  test('fitness has correct theme and features', () => {
    const lead = makeLead({ category: 'fitness' });
    const { config } = generateConfig(lead, 'slug-123');

    expect(config.theme).toBe('ocean-breeze');
    expect(config.features.openingHours).toBe(true);
    expect(config.features.scheduling).toBe(true);
    expect(config.features.priceList).toBe(true);
    expect(config.features.contactForm).toBe(true);
  });

  test('kreativ has correct theme and features', () => {
    const lead = makeLead({ category: 'kreativ' });
    const { config } = generateConfig(lead, 'slug-123');

    expect(config.theme).toBe('neon-noir');
    expect(config.features.gallery).toBe(true);
    expect(config.features.contactForm).toBe(true);
    expect(config.features.clickToCall).toBe(true);
  });

  test('arztpraxis has correct theme and features', () => {
    const lead = makeLead({ category: 'arztpraxis' });
    const { config } = generateConfig(lead, 'slug-123');

    expect(config.theme).toBe('nordic-frost');
    expect(config.features.openingHours).toBe(true);
    expect(config.features.scheduling).toBe(true);
    expect(config.features.contactForm).toBe(true);
    expect(config.features.clickToCall).toBe(true);
  });
});

// --- Fallback Tests ---

describe('generateConfig — fallback for unknown category', () => {
  test('uses fallback for unknown category string', () => {
    const lead = makeLead({ category: 'unknown-xyz' });
    const result = generateConfig(lead, 'slug-fallback');

    expect(result.success).toBe(true);
    expect(result.config.theme).toBe('slate-professional');
    expect(result.config.primaryColor).toBe('#475569');
    expect(result.config.features.contactForm).toBe(true);
    expect(result.config.features.openingHours).toBe(true);
    expect(result.config.features.clickToCall).toBe(true);
  });

  test('uses fallback for numeric category', () => {
    const lead = makeLead({ category: '12345' });
    const result = generateConfig(lead, 'slug-num');

    expect(result.success).toBe(true);
    expect(result.config.theme).toBe('slate-professional');
  });

  test('uses fallback for category with special characters', () => {
    const lead = makeLead({ category: '!@#$%' });
    const result = generateConfig(lead, 'slug-special');

    expect(result.success).toBe(true);
    expect(result.config.theme).toBe('slate-professional');
  });

  test('uses fallback for category with extra whitespace', () => {
    const lead = makeLead({ category: '  something weird  ' });
    const result = generateConfig(lead, 'slug-ws');

    expect(result.success).toBe(true);
    expect(result.config.theme).toBe('slate-professional');
  });

  test('case-insensitive category matching', () => {
    const lead = makeLead({ category: 'Coiffeur' });
    const result = generateConfig(lead, 'slug-case');

    expect(result.success).toBe(true);
    expect(result.config.theme).toBe('warm-earth');
  });

  test('case-insensitive matching with mixed case', () => {
    const lead = makeLead({ category: 'RESTAURANT' });
    const result = generateConfig(lead, 'slug-upper');

    expect(result.success).toBe(true);
    expect(result.config.theme).toBe('editorial');
  });
});

// --- Error Handling Tests (Req 10.1) ---

describe('generateConfig — error handling', () => {
  test('returns error when businessName is missing', () => {
    const lead = makeLead({ businessName: '' });
    const result = generateConfig(lead, 'slug-err');

    expect(result.success).toBe(false);
    expect(result.error).toBe('Firmenname fehlt');
    expect(result.config).toBeUndefined();
  });

  test('returns error when businessName is null', () => {
    const lead = makeLead({ businessName: null });
    const result = generateConfig(lead, 'slug-err');

    expect(result.success).toBe(false);
    expect(result.error).toBe('Firmenname fehlt');
  });

  test('returns error when category is missing', () => {
    const lead = makeLead({ category: '' });
    const result = generateConfig(lead, 'slug-err');

    expect(result.success).toBe(false);
    expect(result.error).toBe('Kategorie fehlt');
  });

  test('returns error when category is null', () => {
    const lead = makeLead({ category: null });
    const result = generateConfig(lead, 'slug-err');

    expect(result.success).toBe(false);
    expect(result.error).toBe('Kategorie fehlt');
  });

  test('returns error when lead is null', () => {
    const result = generateConfig(null, 'slug-err');

    expect(result.success).toBe(false);
    expect(result.error).toBe('Firmenname fehlt');
  });

  test('returns error when lead is undefined', () => {
    const result = generateConfig(undefined, 'slug-err');

    expect(result.success).toBe(false);
    expect(result.error).toBe('Firmenname fehlt');
  });

  test('never throws for any input', () => {
    expect(() => generateConfig(null, 'x')).not.toThrow();
    expect(() => generateConfig(undefined, 'x')).not.toThrow();
    expect(() => generateConfig({}, 'x')).not.toThrow();
    expect(() => generateConfig({ businessName: 'X' }, 'x')).not.toThrow();
    expect(() => generateConfig({ businessName: 'X', category: '' }, 'x')).not.toThrow();
  });
});

// --- Field Mapping Tests (Req 1.4) ---

describe('generateConfig — field mapping', () => {
  test('maps businessName from lead', () => {
    const lead = makeLead({ businessName: 'Coiffeur Müller' });
    const { config } = generateConfig(lead, 'slug-1');

    expect(config.businessName).toBe('Coiffeur Müller');
  });

  test('maps operatorName from contactPerson', () => {
    const lead = makeLead({ contactPerson: 'Hans Müller' });
    const { config } = generateConfig(lead, 'slug-1');

    expect(config.operatorName).toBe('Hans Müller');
  });

  test('maps operatorName from businessName when contactPerson is missing', () => {
    const lead = makeLead({ contactPerson: null });
    const { config } = generateConfig(lead, 'slug-1');

    expect(config.operatorName).toBe(lead.businessName);
  });

  test('maps operatorName from businessName when contactPerson is empty', () => {
    const lead = makeLead({ contactPerson: '' });
    const { config } = generateConfig(lead, 'slug-1');

    expect(config.operatorName).toBe(lead.businessName);
  });

  test('maps email from lead.email', () => {
    const lead = makeLead({ email: 'real@email.com' });
    const { config } = generateConfig(lead, 'slug-1');

    expect(config.contactEmail).toBe('real@email.com');
  });

  test('uses placeholder email when lead.email is missing', () => {
    const lead = makeLead({ email: null });
    const { config } = generateConfig(lead, 'slug-1');

    expect(config.contactEmail).toBe('preview@kaelint.ch');
  });

  test('uses placeholder email when lead.email is empty', () => {
    const lead = makeLead({ email: '' });
    const { config } = generateConfig(lead, 'slug-1');

    expect(config.contactEmail).toBe('preview@kaelint.ch');
  });

  test('maps phone from lead.phone', () => {
    const lead = makeLead({ phone: '+41 79 000 00 00' });
    const { config } = generateConfig(lead, 'slug-1');

    expect(config.phone).toBe('+41 79 000 00 00');
  });

  test('uses placeholder phone when lead.phone is missing', () => {
    const lead = makeLead({ phone: null });
    const { config } = generateConfig(lead, 'slug-1');

    expect(config.phone).toBe('+41 00 000 00 00');
  });

  test('disables clickToCall when phone is missing', () => {
    const lead = makeLead({ phone: null, category: 'coiffeur' });
    const { config } = generateConfig(lead, 'slug-1');

    expect(config.features.clickToCall).toBeUndefined();
  });

  test('keeps clickToCall enabled when phone is present', () => {
    const lead = makeLead({ phone: '+41 79 123 45 67', category: 'coiffeur' });
    const { config } = generateConfig(lead, 'slug-1');

    expect(config.features.clickToCall).toBe(true);
  });

  test('maps address fields', () => {
    const lead = makeLead({ address: 'Bahnhofstrasse 1', city: 'Zürich' });
    const { config } = generateConfig(lead, 'slug-1');

    expect(config.address.street).toBe('Bahnhofstrasse 1');
    expect(config.address.city).toBe('Zürich');
    expect(config.address.postalCode).toBe('0000');
  });

  test('sets siteUrl with slug', () => {
    const lead = makeLead();
    const { config } = generateConfig(lead, 'abcd1234-coiffeur-bern');

    expect(config.siteUrl).toBe('https://preview.kaelint.ch/abcd1234-coiffeur-bern/');
  });
});

// --- Feature Safety Tests (Req 1.9) ---

describe('generateConfig — feature safety', () => {
  test('never enables testimonials', () => {
    const niches = Object.keys(PRESET_MAP);
    for (const niche of niches) {
      const lead = makeLead({ category: niche });
      const { config } = generateConfig(lead, 'slug-safety');
      expect(config.features.testimonials).toBeUndefined();
    }
  });

  test('never enables events', () => {
    const niches = Object.keys(PRESET_MAP);
    for (const niche of niches) {
      const lead = makeLead({ category: niche });
      const { config } = generateConfig(lead, 'slug-safety');
      expect(config.features.events).toBeUndefined();
    }
  });

  test('never enables faq', () => {
    const niches = Object.keys(PRESET_MAP);
    for (const niche of niches) {
      const lead = makeLead({ category: niche });
      const { config } = generateConfig(lead, 'slug-safety');
      expect(config.features.faq).toBeUndefined();
    }
  });

  test('fallback also never enables forbidden features', () => {
    const lead = makeLead({ category: 'random' });
    const { config } = generateConfig(lead, 'slug-safety');

    expect(config.features.testimonials).toBeUndefined();
    expect(config.features.events).toBeUndefined();
    expect(config.features.faq).toBeUndefined();
  });
});

// --- Gallery and Opening Hours Tests (Req 1.10) ---

describe('generateConfig — conditional feature data', () => {
  test('includes openingHours when feature is enabled', () => {
    const lead = makeLead({ category: 'coiffeur' });
    const { config } = generateConfig(lead, 'slug-1');

    expect(config.openingHours).toBeDefined();
    expect(config.openingHours.length).toBe(5); // Mon-Fri
    expect(config.openingHours[0].day).toBe('monday');
    expect(config.openingHours[0].opens).toBe('09:00');
    expect(config.openingHours[0].closes).toBe('18:00');
  });

  test('does not include openingHours when feature is not in preset', () => {
    // handwerk doesn't have openingHours
    const lead = makeLead({ category: 'handwerk' });
    const { config } = generateConfig(lead, 'slug-1');

    expect(config.openingHours).toBeUndefined();
  });

  test('includes gallery when feature is enabled', () => {
    const lead = makeLead({ category: 'coiffeur' });
    const { config } = generateConfig(lead, 'slug-1');

    expect(config.gallery).toBeDefined();
    expect(config.gallery.images).toHaveLength(3);
    for (const img of config.gallery.images) {
      expect(img.path).toContain('gallery/coiffeur-');
      expect(img.alt).toHaveProperty('de');
    }
  });

  test('gallery uses niche-specific paths', () => {
    const lead = makeLead({ category: 'restaurant' });
    const { config } = generateConfig(lead, 'slug-1');

    expect(config.gallery.images[0].path).toContain('restaurant-');
  });

  test('does not include gallery when feature is not in preset', () => {
    // therapie doesn't have gallery
    const lead = makeLead({ category: 'therapie' });
    const { config } = generateConfig(lead, 'slug-1');

    expect(config.gallery).toBeUndefined();
  });

  test('fallback includes openingHours (standard hours)', () => {
    const lead = makeLead({ category: 'unknown' });
    const { config } = generateConfig(lead, 'slug-1');

    expect(config.openingHours).toBeDefined();
    expect(config.openingHours.length).toBe(5);
  });
});

// --- Tagline and About Text ---

describe('generateConfig — tagline and aboutText', () => {
  test('tagline includes city name', () => {
    const lead = makeLead({ category: 'coiffeur', city: 'Bern' });
    const { config } = generateConfig(lead, 'slug-1');

    expect(config.tagline.de).toContain('Bern');
  });

  test('aboutText includes business name and city', () => {
    const lead = makeLead({ category: 'coiffeur', businessName: 'Salon Bella', city: 'Zürich' });
    const { config } = generateConfig(lead, 'slug-1');

    expect(config.aboutText.de).toContain('Salon Bella');
    expect(config.aboutText.de).toContain('Zürich');
  });

  test('tagline and aboutText are niche-specific', () => {
    const lead1 = makeLead({ category: 'coiffeur', city: 'Bern' });
    const lead2 = makeLead({ category: 'restaurant', city: 'Bern' });

    const { config: config1 } = generateConfig(lead1, 'slug-1');
    const { config: config2 } = generateConfig(lead2, 'slug-2');

    expect(config1.tagline.de).not.toBe(config2.tagline.de);
  });
});

// --- Helper Function Tests ---

describe('buildFeatureFlags', () => {
  test('creates object with true for each feature', () => {
    const result = buildFeatureFlags(['contactForm', 'gallery']);
    expect(result).toEqual({ contactForm: true, gallery: true });
  });

  test('returns empty object for empty array', () => {
    const result = buildFeatureFlags([]);
    expect(result).toEqual({});
  });
});

describe('buildGallery', () => {
  test('returns 3 images with niche paths', () => {
    const result = buildGallery('coiffeur', 'Salon Impression');
    expect(result.images).toHaveLength(3);
    expect(result.images[0].path).toBe('gallery/coiffeur-1.jpg');
    expect(result.images[0].alt.de).toBe('Salon Impression');
  });

  test('uses generic prefix when niche is null', () => {
    const result = buildGallery(null, 'Impression');
    expect(result.images[0].path).toBe('gallery/generic-1.jpg');
  });
});

describe('buildOpeningHours', () => {
  test('returns Mon-Fri with 09:00-18:00', () => {
    const result = buildOpeningHours();
    expect(result).toHaveLength(5);
    expect(result[0]).toEqual({ day: 'monday', opens: '09:00', closes: '18:00' });
    expect(result[4]).toEqual({ day: 'friday', opens: '09:00', closes: '18:00' });
  });
});

describe('resolveTemplate', () => {
  test('replaces {businessName} and {city}', () => {
    const result = resolveTemplate('Hello {businessName} in {city}', {
      businessName: 'Test',
      city: 'Bern'
    });
    expect(result).toBe('Hello Test in Bern');
  });

  test('handles missing city gracefully', () => {
    const result = resolveTemplate('In {city}', { businessName: 'X' });
    expect(result).toBe('In ');
  });
});

// --- THEME_FONT_MAP Tests ---

describe('THEME_FONT_MAP', () => {
  test('contains all 8 niche themes', () => {
    const nicheThemes = Object.values(PRESET_MAP).map(p => p.theme);
    for (const theme of nicheThemes) {
      expect(THEME_FONT_MAP[theme]).toBeDefined();
      expect(typeof THEME_FONT_MAP[theme]).toBe('string');
    }
  });

  test('contains slate-professional for fallback', () => {
    expect(THEME_FONT_MAP['slate-professional']).toBeDefined();
  });

  test('warm-earth maps to DM Serif Display', () => {
    expect(THEME_FONT_MAP['warm-earth']).toContain('DM Serif Display');
  });

  test('editorial maps to Playfair Display', () => {
    expect(THEME_FONT_MAP['editorial']).toContain('Playfair Display');
  });

  test('sage-wellness maps to Lora', () => {
    expect(THEME_FONT_MAP['sage-wellness']).toContain('Lora');
  });

  test('slate-professional maps to IBM Plex Sans', () => {
    expect(THEME_FONT_MAP['slate-professional']).toContain('IBM Plex Sans');
  });

  test('soft-gradient maps to Poppins', () => {
    expect(THEME_FONT_MAP['soft-gradient']).toContain('Poppins');
  });

  test('ocean-breeze maps to Montserrat', () => {
    expect(THEME_FONT_MAP['ocean-breeze']).toContain('Montserrat');
  });

  test('neon-noir maps to Space Grotesk', () => {
    expect(THEME_FONT_MAP['neon-noir']).toContain('Space Grotesk');
  });

  test('nordic-frost maps to Inter', () => {
    expect(THEME_FONT_MAP['nordic-frost']).toContain('Inter');
  });
});
