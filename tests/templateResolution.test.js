/**
 * Tests for per-category email template resolution.
 *
 * Precedence (per email type, per field):
 *   category template → global settings template → built-in DEFAULT_TEMPLATES
 *
 * This lets a single category (e.g. "Fahrlehrer") run a completely different
 * campaign (the CrashCode pitch) without affecting other leads.
 */

const {
  resolveTemplatesForLead,
  guessLanguageFromText,
  guessLeadLanguage,
  normalizeCampaignLanguage,
  DEFAULT_TEMPLATES
} = require('../server/lib/emailService');
const {
  CRASHCODE_FAHRSCHULE_CAMPAIGN,
  CRASHCODE_FAHRSCHULE_TEMPLATES_BY_LANG
} = require('../server/lib/defaultCategories');

describe('resolveTemplatesForLead', () => {
  test('falls back to DEFAULT_TEMPLATES when no settings and no category', () => {
    const result = resolveTemplatesForLead({}, null);
    expect(result.email1).toEqual(DEFAULT_TEMPLATES.email1);
    expect(result.email2).toEqual(DEFAULT_TEMPLATES.email2);
  });

  test('handles undefined settings and category without throwing', () => {
    expect(() => resolveTemplatesForLead(undefined, undefined)).not.toThrow();
    const result = resolveTemplatesForLead(undefined, undefined);
    expect(result.email1).toEqual(DEFAULT_TEMPLATES.email1);
  });

  test('global settings templates override defaults', () => {
    const settings = {
      templates: {
        email1: { subject: 'Global subject', body: 'Global body' }
      }
    };
    const result = resolveTemplatesForLead(settings, null);
    expect(result.email1.subject).toBe('Global subject');
    expect(result.email1.body).toBe('Global body');
    // email2 still falls back to default
    expect(result.email2).toEqual(DEFAULT_TEMPLATES.email2);
  });

  test('category template overrides global settings', () => {
    const settings = {
      templates: {
        email1: { subject: 'Global subject', body: 'Global body' }
      }
    };
    const category = {
      name: 'Fahrlehrer',
      templates: {
        email1: { subject: 'CrashCode pitch', body: 'Adopt the app' }
      }
    };
    const result = resolveTemplatesForLead(settings, category);
    expect(result.email1.subject).toBe('CrashCode pitch');
    expect(result.email1.body).toBe('Adopt the app');
  });

  test('per-field fallback: category body only inherits global subject', () => {
    const settings = {
      templates: {
        email1: { subject: 'Global subject', body: 'Global body' }
      }
    };
    const category = {
      name: 'Fahrlehrer',
      templates: {
        email1: { body: 'Category-specific body' }
      }
    };
    const result = resolveTemplatesForLead(settings, category);
    expect(result.email1.subject).toBe('Global subject'); // inherited
    expect(result.email1.body).toBe('Category-specific body'); // overridden
  });

  test('empty-string category fields do not override the fallback', () => {
    const settings = {
      templates: {
        email1: { subject: 'Global subject', body: 'Global body' }
      }
    };
    const category = {
      name: 'Fahrlehrer',
      templates: {
        email1: { subject: '', body: 'New body' }
      }
    };
    const result = resolveTemplatesForLead(settings, category);
    expect(result.email1.subject).toBe('Global subject'); // empty ignored
    expect(result.email1.body).toBe('New body');
  });

  test('category with no templates behaves like no category', () => {
    const settings = {
      templates: {
        email2: { subject: 'Global followup', body: 'Global followup body' }
      }
    };
    const category = { name: 'Coiffeur' };
    const withCategory = resolveTemplatesForLead(settings, category);
    const withoutCategory = resolveTemplatesForLead(settings, null);
    expect(withCategory).toEqual(withoutCategory);
  });

  test('does not mutate DEFAULT_TEMPLATES', () => {
    const snapshot = JSON.stringify(DEFAULT_TEMPLATES);
    resolveTemplatesForLead(
      { templates: { email1: { subject: 'X', body: 'Y' } } },
      { name: 'Fahrlehrer', templates: { email1: { subject: 'Z', body: 'W' } } }
    );
    expect(JSON.stringify(DEFAULT_TEMPLATES)).toBe(snapshot);
  });

  test('always returns both email1 and email2 with subject and body', () => {
    const result = resolveTemplatesForLead({}, null);
    for (const key of ['email1', 'email2']) {
      expect(result[key]).toHaveProperty('subject');
      expect(result[key]).toHaveProperty('body');
      expect(typeof result[key].subject).toBe('string');
      expect(typeof result[key].body).toBe('string');
    }
  });
});

describe('multi-language campaign resolution', () => {
  const fahrschule = {
    name: 'Fahrschule',
    campaign: CRASHCODE_FAHRSCHULE_CAMPAIGN,
    templates: CRASHCODE_FAHRSCHULE_TEMPLATES_BY_LANG.de
  };

  test('German (default) is used when no language is requested', () => {
    const result = resolveTemplatesForLead({}, fahrschule);
    expect(result.email1.body).toBe(CRASHCODE_FAHRSCHULE_TEMPLATES_BY_LANG.de.email1.body);
    expect(result.email1.body).toContain('Sali zäme');
  });

  test('French variant is applied when lang="fr"', () => {
    const result = resolveTemplatesForLead({}, fahrschule, 'fr');
    expect(result.email1.subject).toBe(CRASHCODE_FAHRSCHULE_TEMPLATES_BY_LANG.fr.email1.subject);
    expect(result.email1.body).toContain('auto-école');
    expect(result.email2.body).toContain('CrashCode');
  });

  test('Italian variant is applied when lang="it"', () => {
    const result = resolveTemplatesForLead({}, fahrschule, 'it');
    expect(result.email1.subject).toBe(CRASHCODE_FAHRSCHULE_TEMPLATES_BY_LANG.it.email1.subject);
    expect(result.email1.body).toContain('scuola guida');
  });

  test('all three variants keep the [Business Name] placeholder', () => {
    for (const lang of ['de', 'fr', 'it']) {
      const result = resolveTemplatesForLead({}, fahrschule, lang);
      expect(result.email1.body).toContain('[Business Name]');
    }
  });

  test('language is ignored for a non-campaign category', () => {
    const plain = { name: 'Coiffeur' };
    const withLang = resolveTemplatesForLead({}, plain, 'fr');
    const withoutLang = resolveTemplatesForLead({}, plain);
    expect(withLang).toEqual(withoutLang);
    expect(withLang.email1).toEqual(DEFAULT_TEMPLATES.email1);
  });

  test('unsupported language falls back to the base (German) template', () => {
    const result = resolveTemplatesForLead({}, fahrschule, 'es');
    expect(result.email1.body).toBe(CRASHCODE_FAHRSCHULE_TEMPLATES_BY_LANG.de.email1.body);
  });
});

describe('recipient language detection', () => {
  test('normalizeCampaignLanguage accepts only de/fr/it', () => {
    expect(normalizeCampaignLanguage('de')).toBe('de');
    expect(normalizeCampaignLanguage('fr')).toBe('fr');
    expect(normalizeCampaignLanguage('it')).toBe('it');
    expect(normalizeCampaignLanguage('es')).toBeNull();
    expect(normalizeCampaignLanguage(undefined)).toBeNull();
  });

  test('French cities detect fr', () => {
    expect(guessLanguageFromText('Lausanne')).toBe('fr');
    expect(guessLanguageFromText('Rue du Rhône 12, Genève')).toBe('fr');
  });

  test('Italian cities detect it', () => {
    expect(guessLanguageFromText('Via Nassa, Lugano')).toBe('it');
    expect(guessLanguageFromText('Bellinzona')).toBe('it');
  });

  test('German-speaking / unknown locations default to de', () => {
    expect(guessLanguageFromText('Zürich')).toBe('de');
    expect(guessLanguageFromText('')).toBe('de');
    expect(guessLanguageFromText(undefined)).toBe('de');
  });

  test('guessLeadLanguage reads city and address', () => {
    expect(guessLeadLanguage({ city: 'Genf' })).toBe('fr');
    expect(guessLeadLanguage({ address: 'Via Cantonale, Lugano' })).toBe('it');
    expect(guessLeadLanguage({ city: 'Bern' })).toBe('de');
    expect(guessLeadLanguage(null)).toBe('de');
  });
});
