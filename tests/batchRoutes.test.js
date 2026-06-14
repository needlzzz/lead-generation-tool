/**
 * Tests for batch route handlers (server/routes/batch.js)
 *
 * Covers: POST /generate-previews validation, POST /send-emails validation,
 * POST /send-stop, GET /preview-status, GET /send-status, resume with invalid state.
 *
 * Requirements: 10.1, 10.3, 10.5
 */

// --- Top-level mocks (hoisted by Jest) ---

jest.mock('../server/lib/batchPreviewGenerator', () => ({
  isRunning: jest.fn(),
  start: jest.fn(),
  resume: jest.fn(),
  getStatus: jest.fn()
}));

jest.mock('../server/lib/batchSender', () => ({
  isRunning: jest.fn(),
  start: jest.fn(),
  stop: jest.fn(),
  resume: jest.fn(),
  getStatus: jest.fn(),
  buildAutoQueue: jest.fn(),
  buildTypedQueue: jest.fn()
}));

jest.mock('../server/lib/quotaTracker', () => ({
  getCount: jest.fn(),
  canSend: jest.fn(),
  increment: jest.fn()
}));

jest.mock('../server/lib/dataStore', () => ({
  readSingleton: jest.fn(),
  get: jest.fn(),
  getAll: jest.fn()
}));

const request = require('supertest');
const express = require('express');
const batchPreviewGenerator = require('../server/lib/batchPreviewGenerator');
const batchSender = require('../server/lib/batchSender');
const dataStore = require('../server/lib/dataStore');

// --- Test app setup ---

function createApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/batch', require('../server/routes/batch'));
  return app;
}

// Default settings with complete Brevo config
const completeSettings = {
  batch: {
    maxEmailsPerDay: 250,
    sendDelayMin: 60,
    sendDelayMax: 120,
    sendWindowStart: '08:00',
    sendWindowEnd: '17:00',
    sendWindowTimezone: 'Europe/Zurich'
  },
  templates: {
    email1: { subject: 'Subject 1', body: 'Body 1' },
    email2: { subject: 'Subject 2', body: 'Body 2' }
  },
  smtp: {
    brevo: {
      host: 'smtp-relay.brevo.com',
      port: 587,
      username: 'test@brevo.com',
      password: 'test-key',
      fromAddress: 'outreach@kaelint.ch'
    }
  }
};

beforeEach(() => {
  jest.clearAllMocks();
  // Default mock: settings with complete Brevo config
  dataStore.readSingleton.mockReturnValue(JSON.parse(JSON.stringify(completeSettings)));
  dataStore.getAll.mockReturnValue([]);
  dataStore.get.mockReturnValue(null);
  batchPreviewGenerator.isRunning.mockReturnValue(false);
  batchPreviewGenerator.getStatus.mockReturnValue(null);
  batchPreviewGenerator.start.mockResolvedValue(undefined);
  batchPreviewGenerator.resume.mockResolvedValue(undefined);
  batchSender.isRunning.mockReturnValue(false);
  batchSender.getStatus.mockReturnValue({ status: 'idle', failed: [] });
  batchSender.buildAutoQueue.mockReturnValue([]);
  batchSender.buildTypedQueue.mockReturnValue([]);
});

// ===========================================================================
// POST /api/batch/generate-previews
// ===========================================================================
describe('POST /api/batch/generate-previews', () => {
  const app = createApp();

  test('returns 400 when leadIds exceeds 1000', async () => {
    const leadIds = Array.from({ length: 1001 }, (_, i) => `id-${i}`);

    const res = await request(app)
      .post('/api/batch/generate-previews')
      .send({ leadIds })
      .expect(400);

    expect(res.body.error).toMatch(/1000/);
  });

  test('returns 409 when batch is already running', async () => {
    batchPreviewGenerator.isRunning.mockReturnValue(true);

    const res = await request(app)
      .post('/api/batch/generate-previews')
      .send({ leadIds: ['lead-1'] })
      .expect(409);

    expect(res.body.error).toMatch(/already in progress/i);
  });

  test('returns 200 with count: 0 when no valid leads', async () => {
    // All lead IDs are invalid (not found)
    dataStore.get.mockReturnValue(null);

    const res = await request(app)
      .post('/api/batch/generate-previews')
      .send({ leadIds: ['nonexistent-1', 'nonexistent-2'] })
      .expect(200);

    expect(res.body.status).toBe('complete');
    expect(res.body.count).toBe(0);
    expect(res.body.skippedIds).toEqual([
      { id: 'nonexistent-1', reason: 'not_found' },
      { id: 'nonexistent-2', reason: 'not_found' }
    ]);
  });

  test('handles invalid/non-existent lead IDs by putting them in skippedIds', async () => {
    // Only second lead exists
    dataStore.get
      .mockReturnValueOnce(null)                // first ID not found
      .mockReturnValueOnce({ id: 'lead-2' });   // second ID found

    const res = await request(app)
      .post('/api/batch/generate-previews')
      .send({ leadIds: ['bad-id', 'lead-2'] });

    // When at least one valid lead, it will start SSE stream (content-type text/event-stream)
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/text\/event-stream/);
  });
});

// ===========================================================================
// POST /api/batch/send-emails
// ===========================================================================
describe('POST /api/batch/send-emails', () => {
  const app = createApp();

  test('returns 400 when Brevo SMTP config is missing host', async () => {
    const incompleteSettings = JSON.parse(JSON.stringify(completeSettings));
    incompleteSettings.smtp.brevo.host = '';
    dataStore.readSingleton.mockReturnValue(incompleteSettings);

    const res = await request(app)
      .post('/api/batch/send-emails')
      .send({ emailType: 'auto' })
      .expect(400);

    expect(res.body.error).toMatch(/Brevo SMTP/i);
    expect(res.body.missingFields).toContain('smtp.brevo.host');
  });

  test('returns 400 when Brevo SMTP config is missing username', async () => {
    const incompleteSettings = JSON.parse(JSON.stringify(completeSettings));
    incompleteSettings.smtp.brevo.username = '';
    dataStore.readSingleton.mockReturnValue(incompleteSettings);

    const res = await request(app)
      .post('/api/batch/send-emails')
      .send({ emailType: 'auto' })
      .expect(400);

    expect(res.body.missingFields).toContain('smtp.brevo.username');
  });

  test('returns 400 when Brevo SMTP config is missing password', async () => {
    const incompleteSettings = JSON.parse(JSON.stringify(completeSettings));
    incompleteSettings.smtp.brevo.password = '';
    dataStore.readSingleton.mockReturnValue(incompleteSettings);

    const res = await request(app)
      .post('/api/batch/send-emails')
      .send({ emailType: 'auto' })
      .expect(400);

    expect(res.body.missingFields).toContain('smtp.brevo.password');
  });

  test('returns 400 when Brevo SMTP config is missing fromAddress', async () => {
    const incompleteSettings = JSON.parse(JSON.stringify(completeSettings));
    incompleteSettings.smtp.brevo.fromAddress = '';
    dataStore.readSingleton.mockReturnValue(incompleteSettings);

    const res = await request(app)
      .post('/api/batch/send-emails')
      .send({ emailType: 'auto' })
      .expect(400);

    expect(res.body.missingFields).toContain('smtp.brevo.fromAddress');
  });

  test('returns 200 with status "complete" and count 0 when queue is empty', async () => {
    // Auto mode with no eligible leads
    batchSender.buildAutoQueue.mockReturnValue([]);

    const res = await request(app)
      .post('/api/batch/send-emails')
      .send({ emailType: 'auto' })
      .expect(200);

    expect(res.body.status).toBe('complete');
    expect(res.body.count).toBe(0);
  });

  test('returns 202 when queue has items and starts background processing', async () => {
    batchSender.buildAutoQueue.mockReturnValue([
      { leadId: 'lead-1', emailType: 'email1' },
      { leadId: 'lead-2', emailType: 'email2' }
    ]);

    const res = await request(app)
      .post('/api/batch/send-emails')
      .send({ emailType: 'auto' })
      .expect(202);

    expect(res.body.status).toBe('sending');
    expect(res.body.totalQueued).toBe(2);
    expect(batchSender.start).toHaveBeenCalledTimes(1);
  });

  test('returns 409 when send is already in progress', async () => {
    batchSender.isRunning.mockReturnValue(true);

    const res = await request(app)
      .post('/api/batch/send-emails')
      .send({ emailType: 'auto' })
      .expect(409);

    expect(res.body.error).toMatch(/already in progress/i);
  });

  test('returns 400 on resume with no valid persisted state', async () => {
    batchSender.resume.mockImplementation(() => {
      throw new Error('No resumable queue exists');
    });

    const res = await request(app)
      .post('/api/batch/send-emails')
      .send({ resume: true })
      .expect(400);

    expect(res.body.error).toMatch(/no resumable queue/i);
  });

  test('returns 202 on successful resume', async () => {
    batchSender.resume.mockImplementation(() => {});

    const res = await request(app)
      .post('/api/batch/send-emails')
      .send({ resume: true })
      .expect(202);

    expect(res.body.status).toBe('sending');
    expect(res.body.resumed).toBe(true);
  });
});

// ===========================================================================
// POST /api/batch/send-stop
// ===========================================================================
describe('POST /api/batch/send-stop', () => {
  const app = createApp();

  test('returns current state after calling stop', async () => {
    batchSender.getStatus.mockReturnValue({
      status: 'stopped',
      queueSize: 10,
      completedCount: 5,
      failedCount: 2,
      lastUpdatedAt: '2026-06-11T14:00:00.000Z',
      failed: []
    });

    const res = await request(app)
      .post('/api/batch/send-stop')
      .expect(200);

    expect(batchSender.stop).toHaveBeenCalledTimes(1);
    expect(res.body.status).toBe('stopped');
    expect(res.body.totalQueued).toBe(10);
    expect(res.body.completed).toBe(5);
    expect(res.body.failed).toBe(2);
    expect(res.body.lastUpdatedAt).toBe('2026-06-11T14:00:00.000Z');
  });
});

// ===========================================================================
// GET /api/batch/preview-status
// ===========================================================================
describe('GET /api/batch/preview-status', () => {
  const app = createApp();

  test('returns idle state when no batch has been run', async () => {
    batchPreviewGenerator.getStatus.mockReturnValue(null);

    const res = await request(app)
      .get('/api/batch/preview-status')
      .expect(200);

    expect(res.body.status).toBe('idle');
    expect(res.body.queue).toEqual([]);
    expect(res.body.completed).toEqual([]);
    expect(res.body.failed).toEqual([]);
  });

  test('returns correct shape with status, queue, completed, failed fields', async () => {
    batchPreviewGenerator.getStatus.mockReturnValue({
      status: 'running',
      queue: ['lead-3', 'lead-4'],
      completed: ['lead-1'],
      failed: [{ leadId: 'lead-2', error: 'Build timeout' }],
      startedAt: '2026-06-11T22:00:00.000Z',
      lastUpdatedAt: '2026-06-11T22:15:00.000Z'
    });

    const res = await request(app)
      .get('/api/batch/preview-status')
      .expect(200);

    expect(res.body).toHaveProperty('status', 'running');
    expect(res.body).toHaveProperty('queue');
    expect(res.body).toHaveProperty('completed');
    expect(res.body).toHaveProperty('failed');
    expect(res.body.queue).toHaveLength(2);
    expect(res.body.completed).toHaveLength(1);
    expect(res.body.failed).toHaveLength(1);
    expect(res.body.failed[0]).toHaveProperty('leadId', 'lead-2');
    expect(res.body.failed[0]).toHaveProperty('error', 'Build timeout');
  });
});

// ===========================================================================
// GET /api/batch/send-status
// ===========================================================================
describe('GET /api/batch/send-status', () => {
  const app = createApp();

  test('returns correct response shape', async () => {
    batchSender.getStatus.mockReturnValue({
      status: 'sending',
      emailType: 'email1',
      queueSize: 50,
      completedCount: 20,
      failedCount: 3,
      quota: { count: 20, maxPerDay: 250 },
      startedAt: '2026-06-11T08:00:00.000Z',
      lastUpdatedAt: '2026-06-11T10:00:00.000Z',
      failed: [
        { leadId: 'l1', businessName: 'Biz A', error: 'SMTP timeout' },
        { leadId: 'l2', businessName: 'Biz B', error: 'Connection refused' }
      ]
    });

    const res = await request(app)
      .get('/api/batch/send-status')
      .expect(200);

    expect(res.body).toHaveProperty('status', 'sending');
    expect(res.body).toHaveProperty('totalQueued', 50);
    expect(res.body).toHaveProperty('completed', 20);
    expect(res.body).toHaveProperty('failed', 3);
    expect(res.body).toHaveProperty('dailyQuotaUsed', 20);
    expect(res.body).toHaveProperty('dailyQuotaLimit', 250);
    expect(res.body).toHaveProperty('sendWindowStatus');
    expect(res.body).toHaveProperty('failedLeads');
    expect(res.body).toHaveProperty('startedAt');
    expect(res.body).toHaveProperty('lastUpdatedAt');
    expect(res.body.failedLeads).toHaveLength(2);
    expect(res.body.failedLeads[0]).toHaveProperty('leadId');
    expect(res.body.failedLeads[0]).toHaveProperty('businessName');
    expect(res.body.failedLeads[0]).toHaveProperty('error');
  });

  test('returns idle with zeros when no send has been initiated', async () => {
    batchSender.getStatus.mockReturnValue({
      status: 'idle',
      queueSize: 0,
      completedCount: 0,
      failedCount: 0,
      quota: { count: 0, maxPerDay: 250 },
      failed: []
    });

    const res = await request(app)
      .get('/api/batch/send-status')
      .expect(200);

    expect(res.body.status).toBe('idle');
    expect(res.body.totalQueued).toBe(0);
    expect(res.body.completed).toBe(0);
    expect(res.body.failed).toBe(0);
    expect(res.body.dailyQuotaUsed).toBe(0);
    expect(res.body.failedLeads).toEqual([]);
  });

  test('includes failedLeads array (max 100, most recent first)', async () => {
    // Create 120 failed entries
    const failed = Array.from({ length: 120 }, (_, i) => ({
      leadId: `lead-${i}`,
      businessName: `Biz ${i}`,
      error: `Error ${i}`
    }));

    batchSender.getStatus.mockReturnValue({
      status: 'sending',
      queueSize: 0,
      completedCount: 0,
      failedCount: 120,
      quota: { count: 0, maxPerDay: 250 },
      failed
    });

    const res = await request(app)
      .get('/api/batch/send-status')
      .expect(200);

    // Should be capped at 100 and most recent first
    expect(res.body.failedLeads).toHaveLength(100);
    // Most recent = last items in the original array, reversed
    expect(res.body.failedLeads[0].leadId).toBe('lead-119');
    expect(res.body.failedLeads[99].leadId).toBe('lead-20');
  });

  test('includes pauseReason and estimatedResumeTime when paused_quota', async () => {
    batchSender.getStatus.mockReturnValue({
      status: 'paused_quota',
      queueSize: 30,
      completedCount: 100,
      failedCount: 0,
      quota: { count: 250, maxPerDay: 250 },
      failed: []
    });

    const res = await request(app)
      .get('/api/batch/send-status')
      .expect(200);

    expect(res.body.status).toBe('paused_quota');
    expect(res.body.pauseReason).toBe('quota_reached');
    expect(res.body.estimatedResumeTime).toBeDefined();
    // Should be a valid ISO date string (next UTC midnight)
    expect(new Date(res.body.estimatedResumeTime).toISOString()).toBe(res.body.estimatedResumeTime);
  });

  test('includes pauseReason and estimatedResumeTime when paused_window', async () => {
    batchSender.getStatus.mockReturnValue({
      status: 'paused_window',
      queueSize: 30,
      completedCount: 50,
      failedCount: 0,
      quota: { count: 50, maxPerDay: 250 },
      failed: []
    });

    const res = await request(app)
      .get('/api/batch/send-status')
      .expect(200);

    expect(res.body.status).toBe('paused_window');
    expect(res.body.pauseReason).toBe('outside_window');
    expect(res.body.estimatedResumeTime).toBeDefined();
  });
});
