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
  DEFAULT_TEMPLATES
} = require('../server/lib/emailService');

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
