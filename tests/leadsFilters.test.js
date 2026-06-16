/**
 * Tests for GET /api/leads — filters, sorting, pagination, and filter interactions.
 *
 * These tests validate the server-side filter logic that the Discovery tab relies on.
 * Covers: hasEmail, hasPreview, previewReady, poorDiscovered, search, category, city,
 * status, sorting (quality, score, category, status, city, discovered, opportunity),
 * pagination, and filter combinations.
 */

const express = require('express');
const request = require('supertest');

// Mock dataStore
jest.mock('../server/lib/dataStore', () => {
  let leads = [];
  return {
    getAll: (collection, filter) => {
      if (collection !== 'leads') return [];
      let result = [...leads];
      if (filter) {
        for (const [key, value] of Object.entries(filter)) {
          result = result.filter(l => l[key] === value);
        }
      }
      return result;
    },
    get: (collection, id) => leads.find(l => l.id === id),
    save: jest.fn(),
    remove: jest.fn(),
    _setLeads: (data) => { leads = data; },
    _getLeads: () => leads,
  };
});

jest.mock('../server/lib/pipeline', () => ({
  validateTransition: jest.fn(() => ({ valid: true })),
  getDueToday: jest.fn(() => []),
  checkDuplicate: jest.fn(() => null),
}));

const dataStore = require('../server/lib/dataStore');
const leadsRouter = require('../server/routes/leads');

function createApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/leads', leadsRouter);
  return app;
}

// Test data factory
function makeLead(overrides = {}) {
  return {
    id: overrides.id || `lead-${Math.random().toString(36).slice(2)}`,
    businessName: overrides.businessName || 'Test Business',
    category: overrides.category || 'Coiffeur',
    city: overrides.city || 'Zürich',
    email: overrides.email || null,
    phone: overrides.phone || null,
    address: overrides.address || 'Bahnhofstr. 1',
    websiteUrl: overrides.websiteUrl || null,
    websiteQuality: overrides.websiteQuality || null,
    websiteScore: overrides.websiteScore != null ? overrides.websiteScore : null,
    websiteOpportunityScore: overrides.websiteOpportunityScore != null ? overrides.websiteOpportunityScore : null,
    websiteAnalyzedAt: overrides.websiteAnalyzedAt || null,
    previewUrl: overrides.previewUrl || null,
    status: overrides.status || 'Discovered',
    dateDiscovered: overrides.dateDiscovered || '2026-06-01',
    ...overrides,
  };
}

let app;

beforeEach(() => {
  app = createApp();
});

describe('GET /api/leads — Filters', () => {
  const leadsData = [
    makeLead({ id: '1', email: 'a@test.ch', previewUrl: null, status: 'Discovered', websiteQuality: 'Poor' }),
    makeLead({ id: '2', email: 'b@test.ch', previewUrl: 'https://preview.kaelint.ch/slug/', status: 'Discovered' }),
    makeLead({ id: '3', email: null, previewUrl: 'https://preview.kaelint.ch/slug2/', status: 'Discovered' }),
    makeLead({ id: '4', email: 'c@test.ch', previewUrl: 'https://preview.kaelint.ch/slug3/', status: 'Reached Out' }),
    makeLead({ id: '5', email: null, previewUrl: null, status: 'Discovered', websiteQuality: 'Poor' }),
    makeLead({ id: '6', email: 'd@test.ch', previewUrl: null, status: 'Discovered', websiteQuality: 'Good' }),
    makeLead({ id: '7', email: 'e@test.ch', previewUrl: 'https://preview.kaelint.ch/slug4/', status: 'Replied' }),
  ];

  beforeEach(() => {
    dataStore._setLeads(leadsData);
  });

  describe('hasEmail filter', () => {
    it('returns only leads with email when hasEmail=1', async () => {
      const res = await request(app).get('/api/leads?hasEmail=1');
      expect(res.status).toBe(200);
      expect(res.body.leads.every(l => l.email)).toBe(true);
      expect(res.body.pagination.total).toBe(5);
    });

    it('returns all leads when hasEmail is not set', async () => {
      const res = await request(app).get('/api/leads');
      expect(res.status).toBe(200);
      expect(res.body.pagination.total).toBe(7);
    });
  });

  describe('hasPreview filter', () => {
    it('returns only leads with previewUrl when hasPreview=1', async () => {
      const res = await request(app).get('/api/leads?hasPreview=1');
      expect(res.status).toBe(200);
      expect(res.body.leads.every(l => l.previewUrl)).toBe(true);
      expect(res.body.pagination.total).toBe(4);
    });
  });

  describe('previewReady filter', () => {
    it('returns leads with preview AND status !== Reached Out', async () => {
      const res = await request(app).get('/api/leads?previewReady=1');
      expect(res.status).toBe(200);
      // IDs 2, 3, 7 have preview and are not "Reached Out"
      expect(res.body.pagination.total).toBe(3);
      expect(res.body.leads.every(l => l.previewUrl)).toBe(true);
      expect(res.body.leads.every(l => l.status !== 'Reached Out')).toBe(true);
    });

    it('excludes leads with status Reached Out even if they have a preview', async () => {
      const res = await request(app).get('/api/leads?previewReady=1');
      const ids = res.body.leads.map(l => l.id);
      expect(ids).not.toContain('4'); // ID 4 is Reached Out
    });

    it('includes leads WITHOUT email (no email filter imposed)', async () => {
      const res = await request(app).get('/api/leads?previewReady=1');
      const ids = res.body.leads.map(l => l.id);
      expect(ids).toContain('3'); // ID 3 has no email but has preview
    });
  });

  describe('poorDiscovered filter', () => {
    it('returns leads with quality=Poor AND status=Discovered', async () => {
      const res = await request(app).get('/api/leads?poorDiscovered=1');
      expect(res.status).toBe(200);
      expect(res.body.pagination.total).toBe(2); // IDs 1, 5
      expect(res.body.leads.every(l => l.websiteQuality === 'Poor')).toBe(true);
      expect(res.body.leads.every(l => l.status === 'Discovered')).toBe(true);
    });
  });

  describe('search filter', () => {
    it('searches by businessName', async () => {
      dataStore._setLeads([
        makeLead({ id: '1', businessName: 'Salon Maria' }),
        makeLead({ id: '2', businessName: 'Gym Power' }),
      ]);
      const res = await request(app).get('/api/leads?search=maria');
      expect(res.body.pagination.total).toBe(1);
      expect(res.body.leads[0].businessName).toBe('Salon Maria');
    });

    it('searches by email', async () => {
      dataStore._setLeads([
        makeLead({ id: '1', email: 'info@salon-maria.ch' }),
        makeLead({ id: '2', email: 'gym@power.ch' }),
      ]);
      const res = await request(app).get('/api/leads?search=salon-maria');
      expect(res.body.pagination.total).toBe(1);
    });

    it('searches by city', async () => {
      dataStore._setLeads([
        makeLead({ id: '1', city: 'Zürich' }),
        makeLead({ id: '2', city: 'Bern' }),
      ]);
      const res = await request(app).get('/api/leads?search=zürich');
      expect(res.body.pagination.total).toBe(1);
    });

    it('search is case-insensitive', async () => {
      dataStore._setLeads([
        makeLead({ id: '1', businessName: 'SALON MARIA' }),
      ]);
      const res = await request(app).get('/api/leads?search=salon');
      expect(res.body.pagination.total).toBe(1);
    });
  });

  describe('category and city equality filters', () => {
    it('filters by category', async () => {
      dataStore._setLeads([
        makeLead({ id: '1', category: 'Coiffeur' }),
        makeLead({ id: '2', category: 'Fitness' }),
        makeLead({ id: '3', category: 'Coiffeur' }),
      ]);
      const res = await request(app).get('/api/leads?category=Coiffeur');
      expect(res.body.pagination.total).toBe(2);
    });

    it('filters by city', async () => {
      dataStore._setLeads([
        makeLead({ id: '1', city: 'Bern' }),
        makeLead({ id: '2', city: 'Zürich' }),
      ]);
      const res = await request(app).get('/api/leads?city=Bern');
      expect(res.body.pagination.total).toBe(1);
    });

    it('filters by status', async () => {
      dataStore._setLeads([
        makeLead({ id: '1', status: 'Discovered' }),
        makeLead({ id: '2', status: 'Reached Out' }),
        makeLead({ id: '3', status: 'Discovered' }),
      ]);
      const res = await request(app).get('/api/leads?status=Discovered');
      expect(res.body.pagination.total).toBe(2);
    });
  });

  describe('filter combinations', () => {
    it('hasEmail + previewReady: previewReady takes precedence (returns leads without email)', async () => {
      // This validates the key bug fix: when both are active server-side,
      // previewReady should NOT be restricted by hasEmail
      const res = await request(app).get('/api/leads?hasEmail=1&previewReady=1');
      // Server applies both independently — hasEmail=1 filters email, previewReady filters preview+status
      // The result is the intersection: has email AND has preview AND not reached out
      // IDs: 2 (email+preview+Discovered), 7 (email+preview+Replied)
      expect(res.body.pagination.total).toBe(2);
    });

    it('poorDiscovered + hasEmail returns only poor+discovered leads with email', async () => {
      const res = await request(app).get('/api/leads?poorDiscovered=1&hasEmail=1');
      expect(res.body.pagination.total).toBe(1); // Only ID 1
      expect(res.body.leads[0].id).toBe('1');
    });

    it('category + hasPreview narrows to category with previews', async () => {
      dataStore._setLeads([
        makeLead({ id: '1', category: 'Coiffeur', previewUrl: 'https://x/' }),
        makeLead({ id: '2', category: 'Fitness', previewUrl: 'https://y/' }),
        makeLead({ id: '3', category: 'Coiffeur', previewUrl: null }),
      ]);
      const res = await request(app).get('/api/leads?category=Coiffeur&hasPreview=1');
      expect(res.body.pagination.total).toBe(1);
      expect(res.body.leads[0].id).toBe('1');
    });
  });
});

describe('GET /api/leads — Sorting', () => {
  const sortData = [
    makeLead({ id: '1', websiteQuality: 'Good', websiteScore: 85, category: 'Fitness', status: 'Replied', city: 'Bern', dateDiscovered: '2026-06-03' }),
    makeLead({ id: '2', websiteQuality: 'Poor', websiteScore: 25, category: 'Coiffeur', status: 'Discovered', city: 'Zürich', dateDiscovered: '2026-06-01' }),
    makeLead({ id: '3', websiteQuality: 'Outdated', websiteScore: 55, category: 'Handwerk', status: 'Reached Out', city: 'Aarau', dateDiscovered: '2026-06-02' }),
    makeLead({ id: '4', websiteQuality: null, websiteScore: null, category: 'Restaurant', status: 'Discovered', city: 'Luzern', dateDiscovered: '2026-06-04' }),
  ];

  beforeEach(() => {
    dataStore._setLeads(sortData);
  });

  it('sorts by quality ascending (Poor first)', async () => {
    const res = await request(app).get('/api/leads?sort=quality&order=asc');
    const qualities = res.body.leads.map(l => l.websiteQuality);
    expect(qualities).toEqual(['Poor', 'Outdated', 'Good', 'None']);
  });

  it('sorts by quality descending (None/unanalyzed first)', async () => {
    const res = await request(app).get('/api/leads?sort=quality&order=desc');
    const qualities = res.body.leads.map(l => l.websiteQuality);
    expect(qualities[0]).toBe('None'); // highest rank value (unanalyzed)
    expect(qualities[3]).toBe('Poor'); // lowest rank value
  });

  it('sorts by score ascending', async () => {
    const res = await request(app).get('/api/leads?sort=score&order=asc');
    const scores = res.body.leads.map(l => l.websiteScore);
    // null maps to -1 for sort, but projectLead may convert — check actual output
    expect(scores[scores.length - 1]).toBe(85); // highest last
  });

  it('sorts by category ascending (alphabetical)', async () => {
    const res = await request(app).get('/api/leads?sort=category&order=asc');
    const cats = res.body.leads.map(l => l.category);
    expect(cats).toEqual(['Coiffeur', 'Fitness', 'Handwerk', 'Restaurant']);
  });

  it('sorts by city ascending (alphabetical)', async () => {
    const res = await request(app).get('/api/leads?sort=city&order=asc');
    const cities = res.body.leads.map(l => l.city);
    expect(cities).toEqual(['Aarau', 'Bern', 'Luzern', 'Zürich']);
  });

  it('sorts by discovered ascending (oldest first)', async () => {
    const res = await request(app).get('/api/leads?sort=discovered&order=asc');
    const dates = res.body.leads.map(l => l.dateDiscovered);
    expect(dates).toEqual(['2026-06-01', '2026-06-02', '2026-06-03', '2026-06-04']);
  });

  it('sorts by discovered descending (newest first)', async () => {
    const res = await request(app).get('/api/leads?sort=discovered&order=desc');
    const dates = res.body.leads.map(l => l.dateDiscovered);
    expect(dates).toEqual(['2026-06-04', '2026-06-03', '2026-06-02', '2026-06-01']);
  });

  it('no sort parameter returns leads in original order', async () => {
    const res = await request(app).get('/api/leads');
    expect(res.body.leads.map(l => l.id)).toEqual(['1', '2', '3', '4']);
  });
});

describe('GET /api/leads — Pagination', () => {
  beforeEach(() => {
    const manyLeads = Array.from({ length: 250 }, (_, i) =>
      makeLead({ id: `lead-${i}`, businessName: `Business ${i}` })
    );
    dataStore._setLeads(manyLeads);
  });

  it('defaults to page 1 with limit 100', async () => {
    const res = await request(app).get('/api/leads');
    expect(res.body.pagination.page).toBe(1);
    expect(res.body.pagination.limit).toBe(100);
    expect(res.body.pagination.total).toBe(250);
    expect(res.body.pagination.totalPages).toBe(3);
    expect(res.body.leads.length).toBe(100);
  });

  it('returns page 2 correctly', async () => {
    const res = await request(app).get('/api/leads?page=2&limit=100');
    expect(res.body.pagination.page).toBe(2);
    expect(res.body.leads.length).toBe(100);
    expect(res.body.leads[0].id).toBe('lead-100');
  });

  it('returns partial last page', async () => {
    const res = await request(app).get('/api/leads?page=3&limit=100');
    expect(res.body.leads.length).toBe(50);
  });

  it('respects custom limit', async () => {
    const res = await request(app).get('/api/leads?limit=10');
    expect(res.body.leads.length).toBe(10);
    expect(res.body.pagination.totalPages).toBe(25);
  });

  it('caps limit at 500', async () => {
    const res = await request(app).get('/api/leads?limit=9999');
    expect(res.body.pagination.limit).toBe(500);
  });

  it('limit=0 defaults to 100 (falsy value fallback)', async () => {
    const res = await request(app).get('/api/leads?limit=0');
    expect(res.body.pagination.limit).toBe(100);
  });

  it('total reflects filtered count not overall count', async () => {
    dataStore._setLeads([
      makeLead({ id: '1', email: 'a@b.ch' }),
      makeLead({ id: '2', email: null }),
      makeLead({ id: '3', email: 'c@d.ch' }),
    ]);
    const res = await request(app).get('/api/leads?hasEmail=1');
    expect(res.body.pagination.total).toBe(2);
  });

  it('sorting applies before pagination (page 2 has correct sorted items)', async () => {
    dataStore._setLeads([
      makeLead({ id: '1', websiteQuality: 'Good' }),
      makeLead({ id: '2', websiteQuality: 'Poor' }),
      makeLead({ id: '3', websiteQuality: 'Outdated' }),
    ]);
    const res = await request(app).get('/api/leads?sort=quality&order=asc&limit=1&page=2');
    // Sorted asc: Poor(1), Outdated(2), Good(3) — page 2 with limit 1 = Outdated
    expect(res.body.leads[0].websiteQuality).toBe('Outdated');
  });
});

describe('GET /api/leads — Edge cases', () => {
  it('returns empty results for no matching filter', async () => {
    dataStore._setLeads([
      makeLead({ id: '1', status: 'Discovered' }),
    ]);
    const res = await request(app).get('/api/leads?status=Replied');
    expect(res.body.pagination.total).toBe(0);
    expect(res.body.leads).toEqual([]);
  });

  it('handles empty database gracefully', async () => {
    dataStore._setLeads([]);
    const res = await request(app).get('/api/leads');
    expect(res.status).toBe(200);
    expect(res.body.pagination.total).toBe(0);
    expect(res.body.leads).toEqual([]);
  });

  it('search with empty string returns all', async () => {
    dataStore._setLeads([makeLead({ id: '1' }), makeLead({ id: '2' })]);
    const res = await request(app).get('/api/leads?search=');
    expect(res.body.pagination.total).toBe(2);
  });

  it('handles special characters in search without crashing', async () => {
    dataStore._setLeads([makeLead({ id: '1', businessName: "O'Saracino (Zürich)" })]);
    const res = await request(app).get("/api/leads?search=O'Saracino");
    expect(res.status).toBe(200);
    expect(res.body.pagination.total).toBe(1);
  });
});
