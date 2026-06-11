/**
 * Tests for settings batch validation and Brevo SMTP handling
 *
 * Covers:
 * 1. validateBatchSettings direct function tests (all validation rules)
 * 2. Integration tests via supertest (HTTP-level):
 *    - PUT with invalid batch settings → 400
 *    - PUT with valid batch settings → 200
 *    - GET returns masked Brevo password
 *    - PUT with "********" preserves existing Brevo password
 *    - GET merges defaults when batch fields are missing
 *
 * Requirements: 10.1, 10.3
 */

const { validateBatchSettings } = require('../server/routes/settings');

// --- Direct validation tests ---

describe('validateBatchSettings — direct validation', () => {
  const validBatch = {
    previewConcurrency: 2,
    maxEmailsPerDay: 250,
    sendDelayMin: 60,
    sendDelayMax: 120,
    sendWindowStart: '08:00',
    sendWindowEnd: '17:00',
    sendWindowTimezone: 'Europe/Zurich'
  };

  test('accepts valid batch settings with no errors', () => {
    const errors = validateBatchSettings(validBatch);
    expect(errors).toEqual([]);
  });

  test('accepts partial batch settings (only some fields provided)', () => {
    const errors = validateBatchSettings({ previewConcurrency: 5 });
    expect(errors).toEqual([]);
  });

  test('accepts empty object (no fields to validate)', () => {
    const errors = validateBatchSettings({});
    expect(errors).toEqual([]);
  });

  // --- previewConcurrency ---

  describe('previewConcurrency validation', () => {
    test('rejects 0 (below minimum)', () => {
      const errors = validateBatchSettings({ previewConcurrency: 0 });
      expect(errors.length).toBe(1);
      expect(errors[0]).toContain('previewConcurrency');
    });

    test('rejects 11 (above maximum)', () => {
      const errors = validateBatchSettings({ previewConcurrency: 11 });
      expect(errors.length).toBe(1);
      expect(errors[0]).toContain('previewConcurrency');
    });

    test('rejects non-integer (3.5)', () => {
      const errors = validateBatchSettings({ previewConcurrency: 3.5 });
      expect(errors.length).toBe(1);
      expect(errors[0]).toContain('previewConcurrency');
    });

    test('accepts minimum value 1', () => {
      const errors = validateBatchSettings({ previewConcurrency: 1 });
      expect(errors).toEqual([]);
    });

    test('accepts maximum value 10', () => {
      const errors = validateBatchSettings({ previewConcurrency: 10 });
      expect(errors).toEqual([]);
    });
  });

  // --- maxEmailsPerDay ---

  describe('maxEmailsPerDay validation', () => {
    test('rejects 0 (below minimum)', () => {
      const errors = validateBatchSettings({ maxEmailsPerDay: 0 });
      expect(errors.length).toBe(1);
      expect(errors[0]).toContain('maxEmailsPerDay');
    });

    test('rejects 1001 (above maximum)', () => {
      const errors = validateBatchSettings({ maxEmailsPerDay: 1001 });
      expect(errors.length).toBe(1);
      expect(errors[0]).toContain('maxEmailsPerDay');
    });

    test('rejects non-integer (100.5)', () => {
      const errors = validateBatchSettings({ maxEmailsPerDay: 100.5 });
      expect(errors.length).toBe(1);
      expect(errors[0]).toContain('maxEmailsPerDay');
    });

    test('accepts minimum value 1', () => {
      const errors = validateBatchSettings({ maxEmailsPerDay: 1 });
      expect(errors).toEqual([]);
    });

    test('accepts maximum value 1000', () => {
      const errors = validateBatchSettings({ maxEmailsPerDay: 1000 });
      expect(errors).toEqual([]);
    });
  });

  // --- sendDelayMin ---

  describe('sendDelayMin validation', () => {
    test('rejects 0 (below minimum)', () => {
      const errors = validateBatchSettings({ sendDelayMin: 0 });
      expect(errors.length).toBe(1);
      expect(errors[0]).toContain('sendDelayMin');
    });

    test('rejects 3601 (above maximum)', () => {
      const errors = validateBatchSettings({ sendDelayMin: 3601 });
      expect(errors.length).toBe(1);
      expect(errors[0]).toContain('sendDelayMin');
    });

    test('accepts boundary value 1', () => {
      const errors = validateBatchSettings({ sendDelayMin: 1 });
      expect(errors).toEqual([]);
    });

    test('accepts boundary value 3600', () => {
      const errors = validateBatchSettings({ sendDelayMin: 3600 });
      expect(errors).toEqual([]);
    });
  });

  // --- sendDelayMax ---

  describe('sendDelayMax validation', () => {
    test('rejects 0 (below minimum)', () => {
      const errors = validateBatchSettings({ sendDelayMax: 0 });
      expect(errors.length).toBe(1);
      expect(errors[0]).toContain('sendDelayMax');
    });

    test('rejects 3601 (above maximum)', () => {
      const errors = validateBatchSettings({ sendDelayMax: 3601 });
      expect(errors.length).toBe(1);
      expect(errors[0]).toContain('sendDelayMax');
    });

    test('accepts boundary value 1', () => {
      const errors = validateBatchSettings({ sendDelayMax: 1 });
      expect(errors).toEqual([]);
    });

    test('accepts boundary value 3600', () => {
      const errors = validateBatchSettings({ sendDelayMax: 3600 });
      expect(errors).toEqual([]);
    });
  });

  // --- Cross-field: sendDelayMin > sendDelayMax ---

  describe('sendDelayMin > sendDelayMax cross-field validation', () => {
    test('rejects when sendDelayMin > sendDelayMax', () => {
      const errors = validateBatchSettings({ sendDelayMin: 200, sendDelayMax: 100 });
      expect(errors.length).toBe(1);
      expect(errors[0]).toContain('sendDelayMin');
      expect(errors[0]).toContain('sendDelayMax');
    });

    test('accepts when sendDelayMin equals sendDelayMax', () => {
      const errors = validateBatchSettings({ sendDelayMin: 100, sendDelayMax: 100 });
      expect(errors).toEqual([]);
    });

    test('accepts when sendDelayMin < sendDelayMax', () => {
      const errors = validateBatchSettings({ sendDelayMin: 60, sendDelayMax: 120 });
      expect(errors).toEqual([]);
    });
  });

  // --- Cross-field: sendWindowStart >= sendWindowEnd ---

  describe('sendWindowStart >= sendWindowEnd cross-field validation', () => {
    test('rejects when sendWindowStart equals sendWindowEnd', () => {
      const errors = validateBatchSettings({
        sendWindowStart: '09:00',
        sendWindowEnd: '09:00'
      });
      expect(errors.length).toBe(1);
      expect(errors[0]).toContain('sendWindowStart');
      expect(errors[0]).toContain('sendWindowEnd');
    });

    test('rejects when sendWindowStart is after sendWindowEnd', () => {
      const errors = validateBatchSettings({
        sendWindowStart: '18:00',
        sendWindowEnd: '08:00'
      });
      expect(errors.length).toBe(1);
      expect(errors[0]).toContain('sendWindowStart');
    });

    test('accepts valid window (start before end)', () => {
      const errors = validateBatchSettings({
        sendWindowStart: '08:00',
        sendWindowEnd: '17:00'
      });
      expect(errors).toEqual([]);
    });
  });

  // --- Timezone validation ---

  describe('sendWindowTimezone validation', () => {
    test('rejects invalid timezone string', () => {
      const errors = validateBatchSettings({
        sendWindowTimezone: 'Invalid/Timezone'
      });
      expect(errors.length).toBe(1);
      expect(errors[0]).toContain('timezone');
    });

    test('rejects random string as timezone', () => {
      const errors = validateBatchSettings({
        sendWindowTimezone: 'foobar'
      });
      expect(errors.length).toBe(1);
      expect(errors[0]).toContain('timezone');
    });

    test('accepts valid IANA timezone "America/New_York"', () => {
      const errors = validateBatchSettings({
        sendWindowTimezone: 'America/New_York'
      });
      expect(errors).toEqual([]);
    });

    test('accepts valid IANA timezone "Europe/Zurich"', () => {
      const errors = validateBatchSettings({
        sendWindowTimezone: 'Europe/Zurich'
      });
      expect(errors).toEqual([]);
    });

    test('accepts valid IANA timezone "Asia/Tokyo"', () => {
      const errors = validateBatchSettings({
        sendWindowTimezone: 'Asia/Tokyo'
      });
      expect(errors).toEqual([]);
    });
  });

  // --- Multiple errors ---

  test('reports multiple errors when multiple fields invalid', () => {
    const errors = validateBatchSettings({
      previewConcurrency: 0,
      maxEmailsPerDay: 0,
      sendDelayMin: 200,
      sendDelayMax: 100,
      sendWindowTimezone: 'not-a-timezone'
    });
    expect(errors.length).toBeGreaterThanOrEqual(4);
  });
});

// --- Integration tests via supertest ---

describe('Settings batch — HTTP integration', () => {
  const request = require('supertest');
  const express = require('express');

  let app;
  let mockStore;

  beforeEach(() => {
    jest.resetModules();

    // In-memory store for dataStore mock
    mockStore = {};

    // Mock dataStore to avoid writing to the real filesystem
    jest.doMock('../server/lib/dataStore', () => ({
      readSingleton: (name) => mockStore[name] || null,
      writeSingleton: (name, data) => { mockStore[name] = data; return data; },
      getAll: () => [],
      get: () => null,
      save: () => {},
      remove: () => false,
      readCollection: () => [],
      writeCollection: () => {},
      DATA_DIR: '/tmp/test-data'
    }));

    // Also mock emailService to avoid loading real transport
    jest.doMock('../server/lib/emailService', () => ({
      testConnection: jest.fn().mockResolvedValue(true),
      sendEmail: jest.fn().mockResolvedValue(true)
    }));

    // Create a minimal Express app with just the settings router
    const settingsRouter = require('../server/routes/settings');
    app = express();
    app.use(express.json());
    app.use('/api/settings', settingsRouter);
  });

  afterEach(() => {
    jest.resetModules();
  });

  test('PUT /api/settings with invalid batch settings returns 400 with error details', async () => {
    const res = await request(app)
      .put('/api/settings')
      .send({
        batch: {
          previewConcurrency: 0,
          maxEmailsPerDay: -5
        }
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
    expect(res.body.details).toBeInstanceOf(Array);
    expect(res.body.details.length).toBeGreaterThanOrEqual(2);
  });

  test('PUT /api/settings with valid batch settings returns 200 and persists', async () => {
    const res = await request(app)
      .put('/api/settings')
      .send({
        batch: {
          previewConcurrency: 5,
          maxEmailsPerDay: 300,
          sendDelayMin: 30,
          sendDelayMax: 90,
          sendWindowStart: '09:00',
          sendWindowEnd: '18:00',
          sendWindowTimezone: 'Europe/Zurich'
        }
      });

    expect(res.status).toBe(200);
    expect(res.body.settings.batch.previewConcurrency).toBe(5);
    expect(res.body.settings.batch.maxEmailsPerDay).toBe(300);
    expect(res.body.settings.batch.sendDelayMin).toBe(30);
    expect(res.body.settings.batch.sendDelayMax).toBe(90);
    expect(res.body.settings.batch.sendWindowStart).toBe('09:00');
    expect(res.body.settings.batch.sendWindowEnd).toBe('18:00');
    expect(res.body.settings.batch.sendWindowTimezone).toBe('Europe/Zurich');
  });

  test('GET /api/settings returns masked Brevo password', async () => {
    // Seed settings with a Brevo password
    mockStore.settings = {
      userName: 'Test',
      smtp: {
        host: 'smtp.test.com',
        port: 587,
        username: 'user',
        password: 'secret-smtp-pass',
        fromAddress: 'test@test.com',
        brevo: {
          host: 'smtp-relay.brevo.com',
          port: 587,
          username: 'brevo@test.com',
          password: 'xkeysib-super-secret-key',
          fromAddress: 'outreach@kaelint.ch'
        }
      },
      batch: {
        previewConcurrency: 2,
        maxEmailsPerDay: 250,
        sendDelayMin: 60,
        sendDelayMax: 120,
        sendWindowStart: '08:00',
        sendWindowEnd: '17:00',
        sendWindowTimezone: 'Europe/Zurich'
      }
    };

    const res = await request(app).get('/api/settings');

    expect(res.status).toBe(200);
    expect(res.body.settings.smtp.brevo.password).toBe('********');
    // SMTP password also masked
    expect(res.body.settings.smtp.password).toBe('********');
    // Other Brevo fields are not masked
    expect(res.body.settings.smtp.brevo.username).toBe('brevo@test.com');
    expect(res.body.settings.smtp.brevo.fromAddress).toBe('outreach@kaelint.ch');
  });

  test('PUT /api/settings with "********" as Brevo password preserves existing password', async () => {
    // First save with a real password
    mockStore.settings = {
      userName: 'Test',
      smtp: {
        host: 'smtp.test.com',
        port: 587,
        username: 'user',
        password: 'my-smtp-pass',
        fromAddress: 'test@test.com',
        brevo: {
          host: 'smtp-relay.brevo.com',
          port: 587,
          username: 'brevo@test.com',
          password: 'xkeysib-real-secret',
          fromAddress: 'outreach@kaelint.ch'
        }
      },
      batch: {
        previewConcurrency: 2,
        maxEmailsPerDay: 250,
        sendDelayMin: 60,
        sendDelayMax: 120,
        sendWindowStart: '08:00',
        sendWindowEnd: '17:00',
        sendWindowTimezone: 'Europe/Zurich'
      }
    };

    // Now PUT with masked password (simulating UI round-trip)
    const res = await request(app)
      .put('/api/settings')
      .send({
        smtp: {
          host: 'smtp.test.com',
          port: 587,
          username: 'user',
          password: '********',
          fromAddress: 'test@test.com',
          brevo: {
            host: 'smtp-relay.brevo.com',
            port: 587,
            username: 'brevo@test.com',
            password: '********',
            fromAddress: 'outreach@kaelint.ch'
          }
        }
      });

    expect(res.status).toBe(200);

    // Verify the stored password was preserved (not overwritten with "********")
    expect(mockStore.settings.smtp.brevo.password).toBe('xkeysib-real-secret');
    expect(mockStore.settings.smtp.password).toBe('my-smtp-pass');
  });

  test('GET /api/settings merges defaults when batch fields are missing from stored settings', async () => {
    // Seed settings WITHOUT batch fields
    mockStore.settings = {
      userName: 'Test User',
      calendlyLink: 'https://calendly.com/test',
      smtp: {
        host: 'smtp.example.com',
        port: 587,
        username: 'user',
        password: '',
        fromAddress: 'test@example.com'
      }
      // No batch field, no brevo field
    };

    const res = await request(app).get('/api/settings');

    expect(res.status).toBe(200);
    // Batch defaults should be merged in
    expect(res.body.settings.batch).toBeDefined();
    expect(res.body.settings.batch.previewConcurrency).toBe(2);
    expect(res.body.settings.batch.maxEmailsPerDay).toBe(250);
    expect(res.body.settings.batch.sendDelayMin).toBe(60);
    expect(res.body.settings.batch.sendDelayMax).toBe(120);
    expect(res.body.settings.batch.sendWindowStart).toBe('08:00');
    expect(res.body.settings.batch.sendWindowEnd).toBe('17:00');
    expect(res.body.settings.batch.sendWindowTimezone).toBe('Europe/Zurich');
    // Brevo defaults should be merged in
    expect(res.body.settings.smtp.brevo).toBeDefined();
    expect(res.body.settings.smtp.brevo.host).toBe('smtp-relay.brevo.com');
    expect(res.body.settings.smtp.brevo.port).toBe(587);
  });
});
