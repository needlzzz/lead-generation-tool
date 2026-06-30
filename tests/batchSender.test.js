/**
 * Tests for batchSender module
 *
 * Covers: success flow, quota pause/resume, window pause/resume, stop mechanism,
 * resume from persisted state, hard bounce handling, transient error handling,
 * auto-queue priority ordering, typed queue builder, empty queue.
 *
 * Requirements: 10.1, 10.3, 10.5
 */

// --- Top-level mocks (hoisted by Jest) ---

jest.mock('nodemailer', () => ({
  createTransport: jest.fn()
}));

jest.mock('../server/lib/quotaTracker', () => ({
  canSend: jest.fn(),
  increment: jest.fn(),
  getCount: jest.fn()
}));

jest.mock('../server/lib/dataStore', () => ({
  get: jest.fn(),
  getAll: jest.fn(() => []),
  save: jest.fn()
}));

jest.mock('../server/lib/emailService', () => ({
  renderTemplate: jest.fn(),
  resolveTemplatesForLead: jest.fn(() => ({
    email1: { subject: 'Test Subject', body: 'Test Body' },
    email2: { subject: 'Test Subject', body: 'Test Body' }
  }))
}));

jest.mock('fs', () => {
  const actualFs = jest.requireActual('fs');
  return {
    ...actualFs,
    existsSync: jest.fn().mockReturnValue(true),
    writeFileSync: jest.fn(),
    readFileSync: jest.fn().mockReturnValue('{}'),
    renameSync: jest.fn(),
    mkdirSync: jest.fn()
  };
});

const fs = require('fs');
const nodemailer = require('nodemailer');
const quotaTracker = require('../server/lib/quotaTracker');
const dataStore = require('../server/lib/dataStore');
const { renderTemplate, resolveTemplatesForLead } = require('../server/lib/emailService');
const batchSender = require('../server/lib/batchSender');

// Default test settings
const defaultSettings = {
  batch: {
    maxEmailsPerDay: 250,
    sendDelayMin: 1,
    sendDelayMax: 1,
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

// Default categories (templates no longer needed here)
const defaultCategories = [
  { name: 'Coiffeur', searchTerm: 'Coiffeur Friseur' }
];

// Helper: create a mock sendMail function
function createMockTransport(sendMailFn) {
  const transport = { sendMail: sendMailFn || jest.fn().mockResolvedValue({ messageId: 'test-id' }) };
  nodemailer.createTransport.mockReturnValue(transport);
  return transport;
}

// Helper: create a test lead
function makeLead(overrides = {}) {
  return {
    id: 'lead-1',
    businessName: 'Test Salon',
    email: 'test@example.com',
    category: 'Coiffeur',
    status: 'Discovered',
    previewUrl: 'https://preview.kaelint.ch/test-salon/',
    activityLog: [],
    ...overrides
  };
}

beforeEach(() => {
  jest.useFakeTimers();
  jest.clearAllMocks();

  // Reset mocks to sensible defaults
  quotaTracker.canSend.mockReturnValue(true);
  quotaTracker.increment.mockReturnValue({ count: 1, remaining: 249, date: '2026-06-11' });
  quotaTracker.getCount.mockReturnValue({ count: 0, remaining: 250, date: '2026-06-11' });
  renderTemplate.mockReturnValue({ subject: 'Test Subject', body: 'Test Body' });
  resolveTemplatesForLead.mockReturnValue({
    email1: { subject: 'Test Subject', body: 'Test Body' },
    email2: { subject: 'Test Subject', body: 'Test Body' }
  });
  dataStore.getAll.mockReturnValue([]);

  // fs mocks defaults
  fs.existsSync.mockReturnValue(true);
  fs.writeFileSync.mockImplementation(() => {});
  fs.readFileSync.mockReturnValue('{}');
  fs.renameSync.mockImplementation(() => {});
  fs.mkdirSync.mockImplementation(() => {});

  batchSender._resetState();
});

afterEach(() => {
  batchSender._resetState();
  jest.useRealTimers();
});

// --- Success Flow ---

describe('batchSender success flow', () => {
  test('sends all emails in queue and marks completed', async () => {
    const lead1 = makeLead({ id: 'lead-1' });
    const lead2 = makeLead({ id: 'lead-2', businessName: 'Salon Zwei' });

    dataStore.get.mockImplementation((collection, id) => {
      if (id === 'lead-1') return lead1;
      if (id === 'lead-2') return lead2;
      return null;
    });

    const mockTransport = createMockTransport();

    const queue = [
      { leadId: 'lead-1', emailType: 'email1' },
      { leadId: 'lead-2', emailType: 'email1' }
    ];

    batchSender.start(queue, defaultSettings, defaultCategories);

    // Advance past the processing (delays are 1s each)
    await jest.advanceTimersByTimeAsync(10000);

    const state = batchSender._getState();
    expect(state.completed).toContain('lead-1');
    expect(state.completed).toContain('lead-2');
    expect(state.status).toBe('complete');
    expect(mockTransport.sendMail).toHaveBeenCalledTimes(2);
  });

  test('updates lead status correctly for email1', async () => {
    const lead = makeLead({ id: 'lead-1', status: 'Discovered' });
    dataStore.get.mockReturnValue(lead);

    createMockTransport();

    batchSender.start(
      [{ leadId: 'lead-1', emailType: 'email1' }],
      defaultSettings,
      defaultCategories
    );

    await jest.advanceTimersByTimeAsync(5000);

    expect(dataStore.save).toHaveBeenCalledWith('leads', expect.objectContaining({
      id: 'lead-1',
      status: 'Reached Out'
    }));
    const savedLead = dataStore.save.mock.calls[0][1];
    expect(savedLead.dateEmail1Sent).toBeDefined();
  });

  test('updates lead status correctly for email2', async () => {
    const lead = makeLead({
      id: 'lead-1',
      status: 'Reached Out',
      dateEmail1Sent: '2026-06-08'
    });
    dataStore.get.mockReturnValue(lead);
    createMockTransport();

    batchSender.start(
      [{ leadId: 'lead-1', emailType: 'email2' }],
      defaultSettings
    );

    await jest.advanceTimersByTimeAsync(5000);

    expect(dataStore.save).toHaveBeenCalled();
    const savedLead = dataStore.save.mock.calls[0][1];
    expect(savedLead.dateFollowUp1Sent).toBeDefined();
  });

  test('increments quota after successful send', async () => {
    dataStore.get.mockReturnValue(makeLead());
    createMockTransport();

    batchSender.start(
      [{ leadId: 'lead-1', emailType: 'email1' }],
      defaultSettings,
      defaultCategories
    );

    await jest.advanceTimersByTimeAsync(5000);

    expect(quotaTracker.increment).toHaveBeenCalledWith(defaultSettings);
  });

  test('appends activity log entry on success', async () => {
    const lead = makeLead({ activityLog: [] });
    dataStore.get.mockReturnValue(lead);
    createMockTransport();

    batchSender.start(
      [{ leadId: 'lead-1', emailType: 'email1' }],
      defaultSettings,
      defaultCategories
    );

    await jest.advanceTimersByTimeAsync(5000);

    expect(dataStore.save).toHaveBeenCalled();
    const savedLead = dataStore.save.mock.calls[0][1];
    expect(savedLead.activityLog.length).toBeGreaterThan(0);
    expect(savedLead.activityLog[0].action).toBe('Email sent');
  });

  test('throws if already running', () => {
    dataStore.get.mockReturnValue(makeLead());
    createMockTransport();

    batchSender.start(
      [{ leadId: 'lead-1', emailType: 'email1' }],
      defaultSettings,
      defaultCategories
    );

    expect(() => {
      batchSender.start(
        [{ leadId: 'lead-2', emailType: 'email1' }],
        defaultSettings,
        defaultCategories
      );
    }).toThrow('Batch sender is already running');
  });
});

// --- Quota Pause + Resume ---

describe('batchSender quota pause + resume', () => {
  test('pauses when quota is exhausted and resumes when available', async () => {
    const lead1 = makeLead({ id: 'lead-1' });
    const lead2 = makeLead({ id: 'lead-2' });

    dataStore.get.mockImplementation((collection, id) => {
      if (id === 'lead-1') return lead1;
      if (id === 'lead-2') return lead2;
      return null;
    });

    createMockTransport();

    // First: canSend returns true for lead-1, then false for lead-2 (pause), then true (resume)
    quotaTracker.canSend
      .mockReturnValueOnce(true)   // lead-1: ok
      .mockReturnValueOnce(false)  // lead-2: quota hit → pause
      .mockReturnValueOnce(false)  // first poll: still paused
      .mockReturnValueOnce(true);  // second poll: resume

    batchSender.start(
      [
        { leadId: 'lead-1', emailType: 'email1' },
        { leadId: 'lead-2', emailType: 'email1' }
      ],
      defaultSettings,
      defaultCategories
    );

    // Process lead-1 + detect pause for lead-2
    await jest.advanceTimersByTimeAsync(3000);

    const pausedState = batchSender._getState();
    expect(pausedState.status).toBe('paused_quota');
    expect(pausedState.completed).toContain('lead-1');

    // First poll (60s) — still paused
    await jest.advanceTimersByTimeAsync(60000);

    // Second poll (another 60s) — resumes
    await jest.advanceTimersByTimeAsync(60000);

    // Process lead-2
    await jest.advanceTimersByTimeAsync(5000);

    const finalState = batchSender._getState();
    expect(finalState.completed).toContain('lead-2');
    expect(finalState.status).toBe('complete');
  });
});

// --- Window Pause + Resume ---

describe('batchSender window pause + resume', () => {
  test('pauses when outside send window and resumes when window opens', async () => {
    const lead1 = makeLead({ id: 'lead-1' });
    const lead2 = makeLead({ id: 'lead-2' });

    dataStore.get.mockImplementation((collection, id) => {
      if (id === 'lead-1') return lead1;
      if (id === 'lead-2') return lead2;
      return null;
    });

    createMockTransport();

    // Override Intl.DateTimeFormat to control send window check
    const originalDateTimeFormat = Intl.DateTimeFormat;
    let formatCallCount = 0;
    const mockDateTimeFormat = jest.fn().mockImplementation(() => ({
      format: jest.fn().mockImplementation(() => {
        formatCallCount++;
        // Call 1: lead-1 window check → within window
        if (formatCallCount === 1) return '10:00';
        // Call 2: lead-2 window check → outside window (pause)
        if (formatCallCount === 2) return '18:00';
        // Call 3: first poll → still outside
        if (formatCallCount === 3) return '18:30';
        // Call 4+: back in window (resume)
        return '09:00';
      })
    }));
    global.Intl.DateTimeFormat = mockDateTimeFormat;

    batchSender.start(
      [
        { leadId: 'lead-1', emailType: 'email1' },
        { leadId: 'lead-2', emailType: 'email1' }
      ],
      defaultSettings,
      defaultCategories
    );

    // Process lead-1, hit window pause for lead-2
    await jest.advanceTimersByTimeAsync(3000);

    const pausedState = batchSender._getState();
    expect(pausedState.status).toBe('paused_window');

    // First poll (60s) — still outside
    await jest.advanceTimersByTimeAsync(60000);

    // Second poll (60s) — back inside
    await jest.advanceTimersByTimeAsync(60000);

    // Process lead-2
    await jest.advanceTimersByTimeAsync(5000);

    const finalState = batchSender._getState();
    expect(finalState.completed).toContain('lead-1');
    expect(finalState.completed).toContain('lead-2');
    expect(finalState.status).toBe('complete');

    // Restore
    global.Intl.DateTimeFormat = originalDateTimeFormat;
  });
});

// --- Stop Mechanism ---

describe('batchSender stop mechanism', () => {
  test('stop() sets status to stopping and eventually completes', async () => {
    const lead1 = makeLead({ id: 'lead-1' });
    const lead2 = makeLead({ id: 'lead-2' });
    const lead3 = makeLead({ id: 'lead-3' });

    dataStore.get.mockImplementation((collection, id) => {
      if (id === 'lead-1') return lead1;
      if (id === 'lead-2') return lead2;
      if (id === 'lead-3') return lead3;
      return null;
    });

    let sendCount = 0;
    const sendMail = jest.fn().mockImplementation(() => {
      sendCount++;
      // Call stop after the first email is sent
      if (sendCount === 1) {
        batchSender.stop();
      }
      return Promise.resolve({ messageId: 'ok' });
    });
    nodemailer.createTransport.mockReturnValue({ sendMail });

    batchSender.start(
      [
        { leadId: 'lead-1', emailType: 'email1' },
        { leadId: 'lead-2', emailType: 'email1' },
        { leadId: 'lead-3', emailType: 'email1' }
      ],
      defaultSettings,
      defaultCategories
    );

    // Let the loop process
    await jest.advanceTimersByTimeAsync(10000);

    const state = batchSender._getState();
    // Should have stopped after lead-1 (stop was called during its send)
    expect(state.completed).toContain('lead-1');
    expect(state.completed.length).toBeLessThan(3);
    expect(state.status).toBe('complete');
  });

  test('stop() when not running does nothing', () => {
    expect(() => batchSender.stop()).not.toThrow();
  });
});

// --- Resume from Persisted State ---

describe('batchSender resume', () => {
  test('resumes from persisted state, skipping already completed leads', async () => {
    // Simulate a persisted state file
    const persistedState = {
      status: 'paused_quota',
      emailType: 'email1',
      queue: [
        { leadId: 'lead-1', emailType: 'email1' },
        { leadId: 'lead-2', emailType: 'email1' },
        { leadId: 'lead-3', emailType: 'email1' }
      ],
      completed: ['lead-1'],
      failed: [],
      lastUpdatedAt: '2026-06-11T12:00:00.000Z',
      startedAt: '2026-06-11T08:00:00.000Z'
    };

    fs.existsSync.mockReturnValue(true);
    fs.readFileSync.mockReturnValue(JSON.stringify(persistedState));

    const lead2 = makeLead({ id: 'lead-2' });
    const lead3 = makeLead({ id: 'lead-3' });
    dataStore.get.mockImplementation((collection, id) => {
      if (id === 'lead-2') return lead2;
      if (id === 'lead-3') return lead3;
      return null;
    });

    createMockTransport();

    batchSender.resume(defaultSettings, defaultCategories);

    await jest.advanceTimersByTimeAsync(10000);

    const state = batchSender._getState();
    expect(state.completed).toContain('lead-2');
    expect(state.completed).toContain('lead-3');
    expect(state.status).toBe('complete');
    // lead-1 was already completed, so it shouldn't be in the queue
    expect(state.queue.find(q => q.leadId === 'lead-1')).toBeUndefined();
  });

  test('throws if already running', () => {
    dataStore.get.mockReturnValue(makeLead());
    createMockTransport();

    batchSender.start(
      [{ leadId: 'lead-1', emailType: 'email1' }],
      defaultSettings,
      defaultCategories
    );

    expect(() => batchSender.resume(defaultSettings, defaultCategories)).toThrow('Batch sender is already running');
  });

  test('throws if no state file exists', () => {
    fs.existsSync.mockReturnValue(false);

    expect(() => batchSender.resume(defaultSettings, defaultCategories)).toThrow('No resumable queue exists');
  });

  test('throws if state status is idle or complete', () => {
    const idleState = {
      status: 'idle',
      queue: [],
      completed: [],
      failed: []
    };

    fs.existsSync.mockReturnValue(true);
    fs.readFileSync.mockReturnValue(JSON.stringify(idleState));

    expect(() => batchSender.resume(defaultSettings, defaultCategories)).toThrow('No batch to resume');
  });

  test('completes immediately if queue has no remaining items', () => {
    const persistedState = {
      status: 'paused_quota',
      emailType: 'email1',
      queue: [
        { leadId: 'lead-1', emailType: 'email1' }
      ],
      completed: ['lead-1'],
      failed: [],
      lastUpdatedAt: '2026-06-11T12:00:00.000Z',
      startedAt: '2026-06-11T08:00:00.000Z'
    };

    fs.existsSync.mockReturnValue(true);
    fs.readFileSync.mockReturnValue(JSON.stringify(persistedState));

    batchSender.resume(defaultSettings, defaultCategories);

    const state = batchSender._getState();
    expect(state.status).toBe('complete');
    expect(state.queue).toHaveLength(0);
  });
});

// --- Hard Bounce Handling ---

describe('batchSender hard bounce handling (5xx)', () => {
  test('marks lead emailBounced on SMTP 5xx error', async () => {
    const lead = makeLead({ id: 'lead-1' });
    dataStore.get.mockReturnValue(lead);

    const smtpError = new Error('550 Mailbox not found');
    smtpError.responseCode = 550;

    nodemailer.createTransport.mockReturnValue({
      sendMail: jest.fn().mockRejectedValue(smtpError)
    });

    batchSender.start(
      [{ leadId: 'lead-1', emailType: 'email1' }],
      defaultSettings,
      defaultCategories
    );

    await jest.advanceTimersByTimeAsync(5000);

    // Lead should be saved with emailBounced = true
    expect(dataStore.save).toHaveBeenCalledWith('leads', expect.objectContaining({
      id: 'lead-1',
      emailBounced: true
    }));

    const savedLead = dataStore.save.mock.calls[0][1];
    expect(savedLead.emailBounceReason).toContain('550');

    // Should be in failed list
    const state = batchSender._getState();
    expect(state.failed).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          leadId: 'lead-1',
          errorType: 'hard_bounce'
        })
      ])
    );
  });

  test('continues processing after hard bounce', async () => {
    const lead1 = makeLead({ id: 'lead-1' });
    const lead2 = makeLead({ id: 'lead-2' });

    dataStore.get.mockImplementation((collection, id) => {
      if (id === 'lead-1') return lead1;
      if (id === 'lead-2') return lead2;
      return null;
    });

    const smtpError = new Error('550 User unknown');
    smtpError.responseCode = 550;

    const sendMail = jest.fn()
      .mockRejectedValueOnce(smtpError) // lead-1 bounces
      .mockResolvedValueOnce({ messageId: 'ok' }); // lead-2 succeeds

    nodemailer.createTransport.mockReturnValue({ sendMail });

    batchSender.start(
      [
        { leadId: 'lead-1', emailType: 'email1' },
        { leadId: 'lead-2', emailType: 'email1' }
      ],
      defaultSettings,
      defaultCategories
    );

    await jest.advanceTimersByTimeAsync(10000);

    const state = batchSender._getState();
    expect(state.failed.length).toBe(1);
    expect(state.failed[0].leadId).toBe('lead-1');
    expect(state.failed[0].errorType).toBe('hard_bounce');
    expect(state.completed).toContain('lead-2');
    expect(state.status).toBe('complete');
  });
});

// --- Transient Error Handling ---

describe('batchSender transient error handling (4xx)', () => {
  test('skips lead on SMTP 4xx and adds to failed list', async () => {
    const lead = makeLead({ id: 'lead-1' });
    dataStore.get.mockReturnValue(lead);

    const smtpError = new Error('421 Too many connections');
    smtpError.responseCode = 421;

    nodemailer.createTransport.mockReturnValue({
      sendMail: jest.fn().mockRejectedValue(smtpError)
    });

    batchSender.start(
      [{ leadId: 'lead-1', emailType: 'email1' }],
      defaultSettings,
      defaultCategories
    );

    await jest.advanceTimersByTimeAsync(5000);

    const state = batchSender._getState();
    expect(state.failed).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          leadId: 'lead-1',
          errorType: 'transient'
        })
      ])
    );

    // Lead should NOT have emailBounced set
    const savedLead = dataStore.save.mock.calls[0][1];
    expect(savedLead.emailBounced).toBeUndefined();
  });

  test('does not mark lead as bounced on connection timeout', async () => {
    const lead = makeLead({ id: 'lead-1' });
    dataStore.get.mockReturnValue(lead);

    const smtpError = new Error('Connection timed out');
    smtpError.code = 'ETIMEDOUT';

    nodemailer.createTransport.mockReturnValue({
      sendMail: jest.fn().mockRejectedValue(smtpError)
    });

    batchSender.start(
      [{ leadId: 'lead-1', emailType: 'email1' }],
      defaultSettings,
      defaultCategories
    );

    await jest.advanceTimersByTimeAsync(5000);

    const state = batchSender._getState();
    expect(state.failed[0].errorType).toBe('transient');

    // emailBounced should remain falsy
    const savedLead = dataStore.save.mock.calls[0][1];
    expect(savedLead.emailBounced).toBeFalsy();
  });
});

// --- Auto-Queue Builder Priority Ordering ---

describe('batchSender buildAutoQueue priority ordering', () => {
  test('orders email2 before email1', () => {
    const today = '2026-06-14';

    const leads = [
      // Eligible for email1 (Discovered + previewUrl + email)
      makeLead({
        id: 'lead-email1',
        status: 'Discovered',
        previewUrl: 'https://preview.kaelint.ch/salon/',
        email: 'a@test.com'
      }),
      // Eligible for email2 (Reached Out + dateEmail1Sent 3+ days ago + no followup1)
      makeLead({
        id: 'lead-email2',
        status: 'Reached Out',
        dateEmail1Sent: '2026-06-10',
        dateFollowUp1Sent: null,
        email: 'b@test.com'
      })
    ];

    const queue = batchSender.buildAutoQueue(leads, today);

    expect(queue.length).toBe(2);
    // email2 first (higher priority)
    expect(queue[0]).toEqual({ leadId: 'lead-email2', emailType: 'email2' });
    // email1 last (lowest priority)
    expect(queue[1]).toEqual({ leadId: 'lead-email1', emailType: 'email1' });
  });

  test('excludes leads without email', () => {
    const leads = [
      makeLead({ id: 'lead-no-email', email: '', status: 'Discovered', previewUrl: 'https://x/' })
    ];

    const queue = batchSender.buildAutoQueue(leads, '2026-06-14');
    expect(queue).toHaveLength(0);
  });

  test('excludes bounced leads', () => {
    const leads = [
      makeLead({
        id: 'lead-bounced',
        emailBounced: true,
        status: 'Discovered',
        previewUrl: 'https://x/',
        email: 'a@test.com'
      })
    ];

    const queue = batchSender.buildAutoQueue(leads, '2026-06-14');
    expect(queue).toHaveLength(0);
  });

  test('email1 requires previewUrl', () => {
    const leads = [
      makeLead({ id: 'lead-1', status: 'Discovered', previewUrl: null, email: 'a@test.com' })
    ];

    const queue = batchSender.buildAutoQueue(leads, '2026-06-14');
    expect(queue).toHaveLength(0);
  });

  test('email2 requires 3+ days since email1', () => {
    const leads = [
      makeLead({
        id: 'lead-1',
        status: 'Reached Out',
        dateEmail1Sent: '2026-06-13', // Only 1 day ago
        dateFollowUp1Sent: null,
        email: 'a@test.com'
      })
    ];

    const queue = batchSender.buildAutoQueue(leads, '2026-06-14');
    expect(queue).toHaveLength(0);
  });
});

// --- buildTypedQueue ---

describe('batchSender buildTypedQueue', () => {
  test('builds email1 queue (Discovered + previewUrl)', () => {
    const leads = [
      makeLead({ id: 'l1', status: 'Discovered', previewUrl: 'https://x/', email: 'a@test.com' }),
      makeLead({ id: 'l2', status: 'Reached Out', email: 'b@test.com' }) // not eligible
    ];

    const queue = batchSender.buildTypedQueue(leads, 'email1', '2026-06-14');
    expect(queue).toHaveLength(1);
    expect(queue[0]).toEqual({ leadId: 'l1', emailType: 'email1' });
  });

  test('builds email2 queue (Reached Out + dateEmail1Sent 3+ days)', () => {
    const leads = [
      makeLead({
        id: 'l1',
        status: 'Reached Out',
        dateEmail1Sent: '2026-06-10',
        dateFollowUp1Sent: null,
        email: 'a@test.com'
      })
    ];

    const queue = batchSender.buildTypedQueue(leads, 'email2', '2026-06-14');
    expect(queue).toHaveLength(1);
    expect(queue[0]).toEqual({ leadId: 'l1', emailType: 'email2' });
  });

  test('excludes bounced leads from typed queue', () => {
    const leads = [
      makeLead({
        id: 'l1',
        status: 'Discovered',
        previewUrl: 'https://x/',
        email: 'a@test.com',
        emailBounced: true
      })
    ];

    const queue = batchSender.buildTypedQueue(leads, 'email1', '2026-06-14');
    expect(queue).toHaveLength(0);
  });
});

// --- Empty Queue ---

describe('batchSender empty queue', () => {
  test('buildAutoQueue returns empty array when no leads are eligible', () => {
    const leads = [
      // Lead with no email
      makeLead({ id: 'l1', email: '', status: 'Discovered', previewUrl: 'https://x/' }),
      // Bounced lead
      makeLead({ id: 'l2', emailBounced: true, status: 'Discovered', previewUrl: 'https://x/', email: 'a@test.com' }),
      // Lead already fully emailed
      makeLead({
        id: 'l3',
        status: 'Reached Out',
        dateEmail1Sent: '2026-06-01',
        dateFollowUp1Sent: '2026-06-04',
        dateFollowUp2Sent: '2026-06-07',
        email: 'c@test.com'
      })
    ];

    const queue = batchSender.buildAutoQueue(leads, '2026-06-14');
    expect(queue).toHaveLength(0);
  });

  test('buildAutoQueue returns empty array for empty leads list', () => {
    const queue = batchSender.buildAutoQueue([], '2026-06-14');
    expect(queue).toHaveLength(0);
  });
});

// --- getStatus ---

describe('batchSender getStatus', () => {
  test('returns idle status with zero counts initially', () => {
    // When idle, getStatus tries to load from disk — simulate no file on disk
    fs.existsSync.mockReturnValue(false);

    const status = batchSender.getStatus(defaultSettings);
    expect(status.status).toBe('idle');
    expect(status.queueSize).toBe(0);
    expect(status.completedCount).toBe(0);
    expect(status.failedCount).toBe(0);
  });

  test('returns quota info from quotaTracker', () => {
    // Simulate no disk state so it uses in-memory idle state
    fs.existsSync.mockReturnValue(false);
    quotaTracker.getCount.mockReturnValue({ count: 50, remaining: 200, date: '2026-06-11' });

    const status = batchSender.getStatus(defaultSettings);
    expect(status.quota.count).toBe(50);
    expect(status.quota.remaining).toBe(200);
    expect(status.quota.maxPerDay).toBe(250);
  });
});

// --- isRunning ---

describe('batchSender isRunning', () => {
  test('returns false initially', () => {
    expect(batchSender.isRunning()).toBe(false);
  });

  test('returns true while processing', () => {
    dataStore.get.mockReturnValue(makeLead());
    createMockTransport();

    batchSender.start(
      [{ leadId: 'lead-1', emailType: 'email1' }],
      defaultSettings,
      defaultCategories
    );

    expect(batchSender.isRunning()).toBe(true);
  });
});

// --- daysSince helper ---

describe('batchSender _daysSince', () => {
  test('calculates correct day difference', () => {
    expect(batchSender._daysSince('2026-06-10', '2026-06-14')).toBe(4);
    expect(batchSender._daysSince('2026-06-14', '2026-06-14')).toBe(0);
    expect(batchSender._daysSince('2026-06-01', '2026-06-14')).toBe(13);
  });
});
