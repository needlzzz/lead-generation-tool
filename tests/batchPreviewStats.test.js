/**
 * Tests for GET /api/batch/preview-stats — pre-flight counts for batch preview generation.
 * Validates category filtering and the eligible/withPreview/withoutPreview breakdown.
 */

const express = require('express');
const request = require('supertest');

jest.mock('../server/lib/dataStore', () => {
  let leads = [];
  return {
    getAll: (collection) => {
      if (collection === 'leads') return [...leads];
      return [];
    },
    get: jest.fn(),
    save: jest.fn(),
    readSingleton: jest.fn(() => ({})),
    _setLeads: (data) => { leads = data; },
  };
});

jest.mock('../server/lib/batchPreviewGenerator', () => ({
  isRunning: () => false,
  getStatus: () => null,
  start: jest.fn(),
  resume: jest.fn(),
}));

jest.mock('../server/lib/batchSender', () => ({
  start: jest.fn(),
  stop: jest.fn(),
  getStatus: jest.fn(() => ({ status: 'idle' })),
}));

jest.mock('../server/lib/previewRegistry', () => ({
  getAllEntries: () => [],
  updateStatus: jest.fn(),
}));

const dataStore = require('../server/lib/dataStore');
const batchRouter = require('../server/routes/batch');

function createApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/batch', batchRouter);
  return app;
}

function makeLead(overrides = {}) {
  return {
    id: overrides.id || `lead-${Math.random().toString(36).slice(2)}`,
    businessName: overrides.businessName || 'Test',
    category: overrides.category || 'Coiffeur',
    websiteAnalyzedAt: overrides.websiteAnalyzedAt || '2026-06-14T10:00:00.000Z',
    previewUrl: overrides.previewUrl || null,
    status: overrides.status || 'Discovered',
    ...overrides,
  };
}

let app;

beforeEach(() => {
  app = createApp();
});

describe('GET /api/batch/preview-stats', () => {
  it('returns correct counts for all categories', async () => {
    dataStore._setLeads([
      makeLead({ id: '1', previewUrl: null }),
      makeLead({ id: '2', previewUrl: 'https://preview.kaelint.ch/x/' }),
      makeLead({ id: '3', previewUrl: null }),
      makeLead({ id: '4', websiteAnalyzedAt: null }), // not eligible (not analyzed)
    ]);

    const res = await request(app).get('/api/batch/preview-stats');
    expect(res.status).toBe(200);
    expect(res.body.total).toBe(3); // only analyzed leads
    expect(res.body.withPreview).toBe(1);
    expect(res.body.withoutPreview).toBe(2);
    expect(res.body.category).toBe('all');
  });

  it('filters by category', async () => {
    dataStore._setLeads([
      makeLead({ id: '1', category: 'Coiffeur', previewUrl: null }),
      makeLead({ id: '2', category: 'Fitness', previewUrl: null }),
      makeLead({ id: '3', category: 'Coiffeur', previewUrl: 'https://x/' }),
    ]);

    const res = await request(app).get('/api/batch/preview-stats?category=Coiffeur');
    expect(res.body.total).toBe(2);
    expect(res.body.withPreview).toBe(1);
    expect(res.body.withoutPreview).toBe(1);
    expect(res.body.category).toBe('Coiffeur');
  });

  it('returns zeros when no leads match', async () => {
    dataStore._setLeads([
      makeLead({ id: '1', category: 'Fitness' }),
    ]);

    const res = await request(app).get('/api/batch/preview-stats?category=Handwerk');
    expect(res.body.total).toBe(0);
    expect(res.body.withPreview).toBe(0);
    expect(res.body.withoutPreview).toBe(0);
  });

  it('excludes unanalyzed leads from eligibility', async () => {
    dataStore._setLeads([
      makeLead({ id: '1', websiteAnalyzedAt: '2026-06-14T10:00:00.000Z' }),
      makeLead({ id: '2', websiteAnalyzedAt: null }),
      makeLead({ id: '3', websiteAnalyzedAt: '' }), // falsy
    ]);

    const res = await request(app).get('/api/batch/preview-stats');
    expect(res.body.total).toBe(1);
  });
});
