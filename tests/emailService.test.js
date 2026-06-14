/**
 * Tests for emailService module — preview placeholder integration
 *
 * Covers: [Preview-Link], [Preview-Screenshot], [Preview-Ablauf] placeholders,
 * formatGermanDate helper, regression for existing placeholders, and combined usage.
 *
 * Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 12.5, 13.5
 */

const { renderTemplate, formatGermanDate } = require('../server/lib/emailService');

// --- Helper Factories ---

function makeLead(overrides = {}) {
  return {
    businessName: 'Coiffeur Müller',
    contactPerson: 'Hans Müller',
    websiteIssues: [],
    websiteScore: null,
    previewUrl: null,
    previewExpiresAt: null,
    ...overrides
  };
}

function makeSettings(overrides = {}) {
  return {
    calendlyLink: 'https://calendly.com/kaelint',
    userName: 'Marc',
    ...overrides
  };
}

function makeTemplate(subject, body) {
  return { subject, body };
}

// --- [Preview-Link] Tests ---

describe('[Preview-Link] placeholder', () => {
  test('resolves to previewUrl when present', () => {
    const lead = makeLead({
      previewUrl: 'https://preview.kaelint.ch/a7f3b92e-coiffeur-mueller-bern/'
    });
    const template = makeTemplate('Ihre Vorschau', 'Sehen Sie hier: [Preview-Link]');
    const result = renderTemplate(template, lead, makeSettings());

    expect(result.body).toBe('Sehen Sie hier: https://preview.kaelint.ch/a7f3b92e-coiffeur-mueller-bern/');
  });

  test('resolves to empty string when previewUrl is null', () => {
    const lead = makeLead({ previewUrl: null });
    const template = makeTemplate('[Preview-Link]', 'Link: [Preview-Link]');
    const result = renderTemplate(template, lead, makeSettings());

    expect(result.subject).toBe('');
    expect(result.body).toBe('Link: ');
  });

  test('resolves to empty string when previewUrl is undefined', () => {
    const lead = makeLead();
    delete lead.previewUrl;
    const template = makeTemplate('Test', '[Preview-Link]');
    const result = renderTemplate(template, lead, makeSettings());

    expect(result.body).toBe('');
  });
});

// --- [Preview-Screenshot] Tests ---

describe('[Preview-Screenshot] placeholder', () => {
  test('resolves to screenshot URL derived from previewUrl', () => {
    const lead = makeLead({
      previewUrl: 'https://preview.kaelint.ch/a7f3b92e-coiffeur-mueller-bern/'
    });
    const template = makeTemplate('Test', 'Screenshot: [Preview-Screenshot]');
    const result = renderTemplate(template, lead, makeSettings());

    expect(result.body).toBe('Screenshot: https://preview.kaelint.ch/a7f3b92e-coiffeur-mueller-bern/screenshot.png');
  });

  test('resolves to empty string when previewUrl is missing', () => {
    const lead = makeLead({ previewUrl: null });
    const template = makeTemplate('Test', '[Preview-Screenshot]');
    const result = renderTemplate(template, lead, makeSettings());

    expect(result.body).toBe('');
  });

  test('resolves to empty string when previewUrl is undefined', () => {
    const lead = makeLead();
    delete lead.previewUrl;
    const template = makeTemplate('Test', '[Preview-Screenshot]');
    const result = renderTemplate(template, lead, makeSettings());

    expect(result.body).toBe('');
  });

  test('correctly derives screenshot URL with different language paths', () => {
    const lead = makeLead({
      previewUrl: 'https://preview.kaelint.ch/b8c4d123-restaurant-bella-zuerich/'
    });
    const template = makeTemplate('Test', '[Preview-Screenshot]');
    const result = renderTemplate(template, lead, makeSettings());

    expect(result.body).toBe('https://preview.kaelint.ch/b8c4d123-restaurant-bella-zuerich/screenshot.png');
  });
});

// --- [Preview-Ablauf] Tests ---

describe('[Preview-Ablauf] placeholder', () => {
  test('resolves to German formatted date when previewExpiresAt is set', () => {
    const lead = makeLead({
      previewExpiresAt: '2026-07-15T10:30:00.000Z'
    });
    const template = makeTemplate('Test', 'Gültig bis: [Preview-Ablauf]');
    const result = renderTemplate(template, lead, makeSettings());

    expect(result.body).toBe('Gültig bis: 15. Juli 2026');
  });

  test('resolves to empty string when previewExpiresAt is null', () => {
    const lead = makeLead({ previewExpiresAt: null });
    const template = makeTemplate('Test', '[Preview-Ablauf]');
    const result = renderTemplate(template, lead, makeSettings());

    expect(result.body).toBe('');
  });

  test('resolves to empty string when previewExpiresAt is undefined', () => {
    const lead = makeLead();
    delete lead.previewExpiresAt;
    const template = makeTemplate('Test', '[Preview-Ablauf]');
    const result = renderTemplate(template, lead, makeSettings());

    expect(result.body).toBe('');
  });
});

// --- formatGermanDate Helper Tests ---

describe('formatGermanDate', () => {
  test('formats January date correctly', () => {
    expect(formatGermanDate('2025-01-01T00:00:00.000Z')).toBe('1. Januar 2025');
  });

  test('formats March date correctly (with umlaut)', () => {
    expect(formatGermanDate('2025-03-22T12:00:00.000Z')).toBe('22. März 2025');
  });

  test('formats December date correctly', () => {
    expect(formatGermanDate('2024-12-31T23:59:59.000Z')).toBe('31. Dezember 2024');
  });

  test('formats July date correctly', () => {
    expect(formatGermanDate('2026-07-15T10:30:00.000Z')).toBe('15. Juli 2026');
  });

  test('formats single-digit day without leading zero', () => {
    expect(formatGermanDate('2025-06-05T00:00:00.000Z')).toBe('5. Juni 2025');
  });

  test('returns empty string for null', () => {
    expect(formatGermanDate(null)).toBe('');
  });

  test('returns empty string for undefined', () => {
    expect(formatGermanDate(undefined)).toBe('');
  });

  test('returns empty string for empty string', () => {
    expect(formatGermanDate('')).toBe('');
  });

  test('returns empty string for invalid date string', () => {
    expect(formatGermanDate('not-a-date')).toBe('');
  });

  test('returns empty string for "Invalid Date" value', () => {
    expect(formatGermanDate('abc123xyz')).toBe('');
  });
});

// --- Regression: Existing Placeholders Still Work ---

describe('Existing placeholders regression', () => {
  test('[Name] resolves to contactPerson', () => {
    const lead = makeLead({ contactPerson: 'Anna Schmidt' });
    const template = makeTemplate('Hallo [Name]', 'Liebe [Name]');
    const result = renderTemplate(template, lead, makeSettings());

    expect(result.subject).toBe('Hallo Anna Schmidt');
    expect(result.body).toBe('Liebe Anna Schmidt');
  });

  test('[Name] falls back to businessName when contactPerson is missing', () => {
    const lead = makeLead({ contactPerson: null, businessName: 'Salon Bella' });
    const template = makeTemplate('[Name]', '[Name]');
    const result = renderTemplate(template, lead, makeSettings());

    expect(result.subject).toBe('Salon Bella');
  });

  test('[Business Name] resolves correctly', () => {
    const lead = makeLead({ businessName: 'Bäckerei Huber' });
    const template = makeTemplate('Test', 'Firma: [Business Name]');
    const result = renderTemplate(template, lead, makeSettings());

    expect(result.body).toBe('Firma: Bäckerei Huber');
  });

  test('[CALENDLY-LINK] resolves from settings', () => {
    const settings = makeSettings({ calendlyLink: 'https://cal.com/test' });
    const template = makeTemplate('Test', 'Buchen: [CALENDLY-LINK]');
    const result = renderTemplate(template, makeLead(), settings);

    expect(result.body).toBe('Buchen: https://cal.com/test');
  });

  test('[Dein Name] resolves from settings', () => {
    const settings = makeSettings({ userName: 'Marc' });
    const template = makeTemplate('Test', 'Grüsse, [Dein Name]');
    const result = renderTemplate(template, makeLead(), settings);

    expect(result.body).toBe('Grüsse, Marc');
  });

  test('[Website-Score] resolves when score is set', () => {
    const lead = makeLead({ websiteScore: 42 });
    const template = makeTemplate('Test', 'Score: [Website-Score]');
    const result = renderTemplate(template, lead, makeSettings());

    expect(result.body).toBe('Score: 42/100');
  });

  test('[Website-Score] resolves to empty string when null', () => {
    const lead = makeLead({ websiteScore: null });
    const template = makeTemplate('Test', '[Website-Score]');
    const result = renderTemplate(template, lead, makeSettings());

    expect(result.body).toBe('');
  });
});

// --- Combined: All Placeholders Together ---

describe('All placeholders combined', () => {
  test('template with all old and new placeholders works correctly', () => {
    const lead = makeLead({
      businessName: 'Coiffeur Müller',
      contactPerson: 'Hans Müller',
      websiteScore: 35,
      websiteIssues: [
        { label: 'Kein SSL', detail: 'Website nicht verschlüsselt' },
        { label: 'Nicht mobil', detail: 'Keine responsive Darstellung' }
      ],
      previewUrl: 'https://preview.kaelint.ch/a7f3b92e-coiffeur-mueller-bern/',
      previewExpiresAt: '2025-08-15T00:00:00.000Z'
    });
    const settings = makeSettings({
      calendlyLink: 'https://calendly.com/kaelint',
      userName: 'Marc'
    });
    const template = makeTemplate(
      'Vorschau für [Business Name]',
      'Hallo [Name],\n\nIhre Website hat einen Score von [Website-Score].\n\nProbleme:\n[Website-Probleme]\n\nKurzfassung: [Website-Probleme-Kurz]\n\nSehen Sie hier Ihre neue Website: [Preview-Link]\nScreenshot: [Preview-Screenshot]\nGültig bis: [Preview-Ablauf]\n\nTermin buchen: [CALENDLY-LINK]\n\nGrüsse,\n[Dein Name]'
    );

    const result = renderTemplate(template, lead, settings);

    expect(result.subject).toBe('Vorschau für Coiffeur Müller');
    expect(result.body).toContain('Hallo Hans Müller,');
    expect(result.body).toContain('Score von 35/100');
    expect(result.body).toContain('Kein SSL');
    expect(result.body).toContain('Nicht mobil');
    expect(result.body).toContain('Kurzfassung: Kein SSL, Nicht mobil');
    expect(result.body).toContain('Ihre neue Website: https://preview.kaelint.ch/a7f3b92e-coiffeur-mueller-bern/');
    expect(result.body).toContain('Screenshot: https://preview.kaelint.ch/a7f3b92e-coiffeur-mueller-bern/screenshot.png');
    expect(result.body).toContain('Gültig bis: 15. August 2025');
    expect(result.body).toContain('Termin buchen: https://calendly.com/kaelint');
    expect(result.body).toContain('Grüsse,\nMarc');
  });

  test('lead without preview data — new placeholders resolve to empty strings gracefully (Req 13.5)', () => {
    const lead = makeLead({
      businessName: 'Salon Bella',
      contactPerson: 'Maria',
      websiteScore: 60,
      previewUrl: null,
      previewExpiresAt: null
    });
    const template = makeTemplate(
      '[Business Name] Vorschau',
      'Hallo [Name], Link: [Preview-Link] Bild: [Preview-Screenshot] Ablauf: [Preview-Ablauf]'
    );

    const result = renderTemplate(template, lead, makeSettings());

    expect(result.subject).toBe('Salon Bella Vorschau');
    expect(result.body).toBe('Hallo Maria, Link:  Bild:  Ablauf: ');
  });

  test('no errors thrown when lead has no preview fields at all', () => {
    const lead = {
      businessName: 'Test GmbH',
      contactPerson: null
    };
    const template = makeTemplate(
      '[Preview-Link]',
      '[Preview-Screenshot] [Preview-Ablauf]'
    );

    expect(() => {
      const result = renderTemplate(template, lead, makeSettings());
      expect(result.subject).toBe('');
      expect(result.body).toBe(' ');
    }).not.toThrow();
  });
});
