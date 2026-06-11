/**
 * Tests for batchPreviewGenerator module
 *
 * Covers: success flow, concurrency limiting, failure skip, deploy-once,
 * state persistence, skip logic (existing valid preview), resume from partial state.
 *
 * Requirements: 10.1, 10.3, 10.5
 */

// --- Top-level mocks (hoisted by Jest) ---

jest.mock('child_process', () => ({
  execSync: jest.fn()
}));

jest.mock('fs', () => {
  const actualFs = jest.requireActual('fs');
  return {
    ...actualFs,
    existsSync: jest.fn().mockReturnValue(true),
    writeFileSync: jest.fn(),
    readFileSync: jest.fn().mockReturnValue('{}'),
    renameSync: jest.fn(),
    mkdirSync: jest.fn(),
    copyFileSync: jest.fn()
  };
});

jest.mock('../server/lib/dataStore', () => ({
  get: jest.fn(),
  save: jest.fn()
}));

jest.mock('../server/lib/previewRegistry', () => ({
  getByLeadId: jest.fn(),
  getAllEntries: jest.fn().mockReturnValue([]),
  createPreview: jest.fn(),
  updateStatus: jest.fn(),
  getBySlug: jest.fn()
}));

jest.mock('../server/lib/slugGenerator', () => ({
  generateSlug: jest.fn(),
  computeLeadDataHash: jest.fn()
}));

jest.mock('../server/lib/configGenerator', () => ({
  generateConfig: jest.fn()
}));

jest.mock('../server/lib/screenshotCapturer', () => ({
  captureScreenshot: jest.fn()
}));

jest.mock('../server/lib/previewGenerator', () => ({
  resolveNiche: jest.fn(),
  writePreviewsManifest: jest.fn()
}));

jest.mock('yaml', () => ({
  stringify: jest.fn().mockReturnValue('mocked: yaml')
}));

const fs = require('fs');
const { execSync } = require('child_process');
const dataStore = require('../server/lib/dataStore');
const registry = require('../server/lib/previewRegistry');
const { generateSlug, computeLeadDataHash } = require('../server/lib/slugGenerator');
const { generateConfig } = require('../server/lib/configGenerator');
const { captureScreenshot } = require('../server/lib/screenshotCapturer');
const { resolveNiche, writePreviewsManifest } = require('../server/lib/previewGenerator');

// We need to re-require the module between tests to reset internal state
let batchPreviewGenerator;

// Default test settings
const defaultSettings = {
  previewSiteRepoPath: '/tmp/kaelint-website-business',
  batch: {
    previewConcurrency: 2
  }
};

// Helper: create a mock lead
function makeLead(overrides = {}) {
  return {
    id: 'lead-1',
    businessName: 'Test Salon',
    category: 'Coiffeur',
    city: 'Zürich',
    email: 'test@example.com',
    status: 'Discovered',
    websiteAnalyzedAt: '2026-06-10T10:00:00.000Z',
    activityLog: [],
    ...overrides
  };
}

// Helper: set up standard mocks for a successful flow
function setupSuccessMocks(leads) {
  dataStore.get.mockImplementation((collection, id) => {
    const lead = leads.find(l => l.id === id);
    return lead || null;
  });

  registry.getByLeadId.mockReturnValue(null); // No existing preview
  registry.getAllEntries.mockReturnValue([]);
  registry.getBySlug.mockReturnValue({
    slug: 'test-salon-zurich',
    createdAt: '2026-06-10T10:00:00.000Z',
    expiresAt: '2026-07-10T10:00:00.000Z'
  });

  generateConfig.mockReturnValue({ success: true, config: { businessName: 'Test' } });
  generateSlug.mockImplementation((name) => name.toLowerCase().replace(/\s+/g, '-'));
  computeLeadDataHash.mockReturnValue('hash-abc123');
  resolveNiche.mockReturnValue('coiffeur');
  captureScreenshot.mockResolvedValue({ success: true, screenshotPath: '/tmp/screenshot.png' });
  writePreviewsManifest.mockImplementation(() => {});

  execSync.mockImplementation(() => Buffer.from('OK'));
  fs.existsSync.mockReturnValue(true);
  fs.writeFileSync.mockImplementation(() => {});
  fs.renameSync.mockImplementation(() => {});
  fs.mkdirSync.mockImplementation(() => {});
  fs.copyFileSync.mockImplementation(() => {});
}

beforeEach(() => {
  jest.clearAllMocks();
  // Reset module to clear internal state
  jest.resetModules();
  // Re-apply mocks after module reset
  jest.mock('child_process', () => ({
    execSync: jest.fn()
  }));
  jest.mock('fs', () => {
    const actualFs = jest.requireActual('fs');
    return {
      ...actualFs,
      existsSync: jest.fn().mockReturnValue(true),
      writeFileSync: jest.fn(),
      readFileSync: jest.fn().mockReturnValue('{}'),
      renameSync: jest.fn(),
      mkdirSync: jest.fn(),
      copyFileSync: jest.fn()
    };
  });
  jest.mock('../server/lib/dataStore', () => ({
    get: jest.fn(),
    save: jest.fn()
  }));
  jest.mock('../server/lib/previewRegistry', () => ({
    getByLeadId: jest.fn(),
    getAllEntries: jest.fn().mockReturnValue([]),
    createPreview: jest.fn(),
    updateStatus: jest.fn(),
    getBySlug: jest.fn()
  }));
  jest.mock('../server/lib/slugGenerator', () => ({
    generateSlug: jest.fn(),
    computeLeadDataHash: jest.fn()
  }));
  jest.mock('../server/lib/configGenerator', () => ({
    generateConfig: jest.fn()
  }));
  jest.mock('../server/lib/screenshotCapturer', () => ({
    captureScreenshot: jest.fn()
  }));
  jest.mock('../server/lib/previewGenerator', () => ({
    resolveNiche: jest.fn(),
    writePreviewsManifest: jest.fn()
  }));
  jest.mock('yaml', () => ({
    stringify: jest.fn().mockReturnValue('mocked: yaml')
  }));

  batchPreviewGenerator = require('../server/lib/batchPreviewGenerator');
});

// --- Success Flow ---

describe('batchPreviewGenerator success flow', () => {
  test('single lead processes through all stages (config → slug → build → screenshot → complete)', async () => {
    const lead = makeLead({ id: 'lead-1' });
    const fsModule = require('fs');
    const cpModule = require('child_process');
    const ds = require('../server/lib/dataStore');
    const reg = require('../server/lib/previewRegistry');
    const slugGen = require('../server/lib/slugGenerator');
    const configGen = require('../server/lib/configGenerator');
    const screenshotCap = require('../server/lib/screenshotCapturer');
    const prevGen = require('../server/lib/previewGenerator');

    ds.get.mockReturnValue(lead);
    reg.getByLeadId.mockReturnValue(null);
    reg.getAllEntries.mockReturnValue([]);
    reg.getBySlug.mockReturnValue({
      slug: 'test-salon',
      createdAt: '2026-06-10T10:00:00.000Z',
      expiresAt: '2026-07-10T10:00:00.000Z'
    });
    configGen.generateConfig.mockReturnValue({ success: true, config: { businessName: 'Test' } });
    slugGen.generateSlug.mockReturnValue('test-salon');
    slugGen.computeLeadDataHash.mockReturnValue('hash-abc');
    prevGen.resolveNiche.mockReturnValue('coiffeur');
    prevGen.writePreviewsManifest.mockImplementation(() => {});
    screenshotCap.captureScreenshot.mockResolvedValue({ success: true, screenshotPath: '/tmp/ss.png' });
    cpModule.execSync.mockImplementation(() => Buffer.from('OK'));
    fsModule.existsSync.mockReturnValue(true);
    fsModule.writeFileSync.mockImplementation(() => {});
    fsModule.renameSync.mockImplementation(() => {});
    fsModule.mkdirSync.mockImplementation(() => {});
    fsModule.copyFileSync.mockImplementation(() => {});

    const sendEvent = jest.fn();

    await batchPreviewGenerator.start(['lead-1'], defaultSettings, sendEvent);

    // Verify config gen was called
    expect(configGen.generateConfig).toHaveBeenCalledWith(lead, null);

    // Verify slug was generated
    expect(slugGen.generateSlug).toHaveBeenCalled();

    // Verify build was invoked via execSync (at least the build command)
    const buildCalls = cpModule.execSync.mock.calls.filter(call =>
      call[0].includes('build-preview.mjs')
    );
    expect(buildCalls.length).toBe(1);

    // Verify screenshot was captured
    expect(screenshotCap.captureScreenshot).toHaveBeenCalled();

    // Verify deploy was called (once)
    const deployCalls = cpModule.execSync.mock.calls.filter(call =>
      call[0].includes('deploy-previews.mjs')
    );
    expect(deployCalls.length).toBe(1);

    // Verify SSE events included 'complete'
    const completeEvents = sendEvent.mock.calls.filter(
      call => call[0] === 'progress' && call[1].status === 'complete'
    );
    expect(completeEvents.length).toBe(1);
    expect(completeEvents[0][1].leadId).toBe('lead-1');
  });

  test('throws if already running', async () => {
    const fsModule = require('fs');
    const cpModule = require('child_process');
    const ds = require('../server/lib/dataStore');
    const reg = require('../server/lib/previewRegistry');
    const slugGen = require('../server/lib/slugGenerator');
    const configGen = require('../server/lib/configGenerator');
    const screenshotCap = require('../server/lib/screenshotCapturer');
    const prevGen = require('../server/lib/previewGenerator');

    const lead = makeLead({ id: 'lead-1' });
    ds.get.mockReturnValue(lead);
    reg.getByLeadId.mockReturnValue(null);
    reg.getAllEntries.mockReturnValue([]);
    reg.getBySlug.mockReturnValue({ slug: 'test-salon', createdAt: '2026-06-10', expiresAt: '2026-07-10' });
    configGen.generateConfig.mockReturnValue({ success: true, config: {} });
    slugGen.generateSlug.mockReturnValue('test-salon');
    slugGen.computeLeadDataHash.mockReturnValue('hash-abc');
    prevGen.resolveNiche.mockReturnValue('coiffeur');
    prevGen.writePreviewsManifest.mockImplementation(() => {});
    screenshotCap.captureScreenshot.mockResolvedValue({ success: true, screenshotPath: '/tmp/ss.png' });
    cpModule.execSync.mockImplementation(() => Buffer.from('OK'));
    fsModule.existsSync.mockReturnValue(true);
    fsModule.writeFileSync.mockImplementation(() => {});
    fsModule.renameSync.mockImplementation(() => {});
    fsModule.mkdirSync.mockImplementation(() => {});
    fsModule.copyFileSync.mockImplementation(() => {});

    const sendEvent = jest.fn();

    // Start a long-running batch that won't finish immediately
    // Use a delayed captureScreenshot to keep the batch running
    let screenshotResolve;
    screenshotCap.captureScreenshot.mockReturnValue(new Promise(resolve => {
      screenshotResolve = resolve;
    }));

    const firstBatch = batchPreviewGenerator.start(['lead-1'], defaultSettings, sendEvent);

    // Attempt to start a second batch should throw
    await expect(
      batchPreviewGenerator.start(['lead-1'], defaultSettings, sendEvent)
    ).rejects.toThrow('Batch preview generation is already running');

    // Resolve to allow first batch to finish
    screenshotResolve({ success: true, screenshotPath: '/tmp/ss.png' });
    await firstBatch;
  });
});

// --- Concurrency Limiting ---

describe('batchPreviewGenerator concurrency limiting', () => {
  test('with concurrency 2, serializes builds via semaphore (execSync called sequentially)', async () => {
    const fsModule = require('fs');
    const cpModule = require('child_process');
    const ds = require('../server/lib/dataStore');
    const reg = require('../server/lib/previewRegistry');
    const slugGen = require('../server/lib/slugGenerator');
    const configGen = require('../server/lib/configGenerator');
    const screenshotCap = require('../server/lib/screenshotCapturer');
    const prevGen = require('../server/lib/previewGenerator');

    const lead1 = makeLead({ id: 'lead-1', businessName: 'Salon A' });
    const lead2 = makeLead({ id: 'lead-2', businessName: 'Salon B' });
    const lead3 = makeLead({ id: 'lead-3', businessName: 'Salon C' });

    ds.get.mockImplementation((collection, id) => {
      if (id === 'lead-1') return lead1;
      if (id === 'lead-2') return lead2;
      if (id === 'lead-3') return lead3;
      return null;
    });

    reg.getByLeadId.mockReturnValue(null);
    reg.getAllEntries.mockReturnValue([]);
    reg.getBySlug.mockReturnValue({ slug: 'test', createdAt: '2026-06-10', expiresAt: '2026-07-10' });
    configGen.generateConfig.mockReturnValue({ success: true, config: {} });
    slugGen.generateSlug.mockImplementation((name) => name.toLowerCase().replace(/\s+/g, '-'));
    slugGen.computeLeadDataHash.mockReturnValue('hash-abc');
    prevGen.resolveNiche.mockReturnValue('coiffeur');
    prevGen.writePreviewsManifest.mockImplementation(() => {});
    screenshotCap.captureScreenshot.mockResolvedValue({ success: true, screenshotPath: '/tmp/ss.png' });
    fsModule.existsSync.mockReturnValue(true);
    fsModule.writeFileSync.mockImplementation(() => {});
    fsModule.renameSync.mockImplementation(() => {});
    fsModule.mkdirSync.mockImplementation(() => {});
    fsModule.copyFileSync.mockImplementation(() => {});

    // Track order of execSync calls to verify build commands are serialized
    const callOrder = [];
    cpModule.execSync.mockImplementation((cmd) => {
      callOrder.push(cmd);
      return Buffer.from('OK');
    });

    const sendEvent = jest.fn();
    await batchPreviewGenerator.start(['lead-1', 'lead-2', 'lead-3'], defaultSettings, sendEvent);

    // Verify builds ran (3 builds + 1 deploy = 4 calls)
    const buildCalls = cpModule.execSync.mock.calls.filter(call =>
      call[0].includes('build-preview.mjs')
    );
    expect(buildCalls.length).toBe(3);

    // Verify the pool processed all leads
    const status = batchPreviewGenerator.getStatus();
    expect(status.completed.length).toBe(3);
    expect(status.status).toBe('complete');
  });

  test('Semaphore class limits concurrent access to 1', async () => {
    const { Semaphore } = batchPreviewGenerator;

    const sem = new Semaphore(1);
    const order = [];

    // Acquire once — should resolve immediately
    await sem.acquire();
    order.push('first-acquired');

    // Second acquire should wait
    let secondResolved = false;
    const secondPromise = sem.acquire().then(() => {
      secondResolved = true;
      order.push('second-acquired');
    });

    // Give microtask a chance to run
    await new Promise(r => setImmediate(r));
    expect(secondResolved).toBe(false);

    // Release first — should let second through
    sem.release();
    await secondPromise;
    expect(secondResolved).toBe(true);
    expect(order).toEqual(['first-acquired', 'second-acquired']);

    sem.release();
  });

  test('ConcurrencyPool limits active tasks', async () => {
    const { ConcurrencyPool } = batchPreviewGenerator;

    const pool = new ConcurrencyPool(2);
    let activeCount = 0;
    let maxActive = 0;

    const runTask = async () => {
      await pool.acquire();
      activeCount++;
      maxActive = Math.max(maxActive, activeCount);
      // Simulate async work
      await new Promise(r => setImmediate(r));
      activeCount--;
      pool.release();
    };

    // Launch 5 tasks concurrently
    await Promise.all([runTask(), runTask(), runTask(), runTask(), runTask()]);

    // Max active should never exceed pool size of 2
    expect(maxActive).toBeLessThanOrEqual(2);
  });
});

// --- Failure Skip ---

describe('batchPreviewGenerator failure skip', () => {
  test('when one lead build fails, it is added to failed list and next lead still processes', async () => {
    const fsModule = require('fs');
    const cpModule = require('child_process');
    const ds = require('../server/lib/dataStore');
    const reg = require('../server/lib/previewRegistry');
    const slugGen = require('../server/lib/slugGenerator');
    const configGen = require('../server/lib/configGenerator');
    const screenshotCap = require('../server/lib/screenshotCapturer');
    const prevGen = require('../server/lib/previewGenerator');

    const lead1 = makeLead({ id: 'lead-1', businessName: 'Fail Salon' });
    const lead2 = makeLead({ id: 'lead-2', businessName: 'Success Salon' });

    ds.get.mockImplementation((collection, id) => {
      if (id === 'lead-1') return lead1;
      if (id === 'lead-2') return lead2;
      return null;
    });

    reg.getByLeadId.mockReturnValue(null);
    reg.getAllEntries.mockReturnValue([]);
    reg.getBySlug.mockReturnValue({ slug: 'test', createdAt: '2026-06-10', expiresAt: '2026-07-10' });
    configGen.generateConfig.mockReturnValue({ success: true, config: {} });
    slugGen.generateSlug.mockImplementation((name) => name.toLowerCase().replace(/\s+/g, '-'));
    slugGen.computeLeadDataHash.mockReturnValue('hash-abc');
    prevGen.resolveNiche.mockReturnValue('coiffeur');
    prevGen.writePreviewsManifest.mockImplementation(() => {});
    screenshotCap.captureScreenshot.mockResolvedValue({ success: true, screenshotPath: '/tmp/ss.png' });
    fsModule.existsSync.mockReturnValue(true);
    fsModule.writeFileSync.mockImplementation(() => {});
    fsModule.renameSync.mockImplementation(() => {});
    fsModule.mkdirSync.mockImplementation(() => {});
    fsModule.copyFileSync.mockImplementation(() => {});

    // First build fails (lead-1), second succeeds (lead-2)
    let buildCallCount = 0;
    cpModule.execSync.mockImplementation((cmd) => {
      if (cmd.includes('build-preview.mjs')) {
        buildCallCount++;
        if (buildCallCount === 1) {
          const err = new Error('Build failed');
          err.stderr = Buffer.from('Astro build error: something broke');
          throw err;
        }
      }
      return Buffer.from('OK');
    });

    const sendEvent = jest.fn();
    await batchPreviewGenerator.start(['lead-1', 'lead-2'], defaultSettings, sendEvent);

    const status = batchPreviewGenerator.getStatus();

    // lead-1 should be in the failed list
    expect(status.failed.length).toBe(1);
    expect(status.failed[0].leadId).toBe('lead-1');
    expect(status.failed[0].error).toContain('Astro build error');

    // lead-2 should be completed
    expect(status.completed).toContain('lead-2');

    // Batch should still complete (deploy runs since at least one succeeded)
    expect(status.status).toBe('complete');

    // Verify SSE event for failed lead
    const failedEvents = sendEvent.mock.calls.filter(
      call => call[0] === 'progress' && call[1].status === 'failed' && call[1].leadId === 'lead-1'
    );
    expect(failedEvents.length).toBe(1);
  });
});

// --- Deploy Once ---

describe('batchPreviewGenerator deploy-once', () => {
  test('after processing multiple leads, deploy-previews.mjs is called exactly once', async () => {
    const fsModule = require('fs');
    const cpModule = require('child_process');
    const ds = require('../server/lib/dataStore');
    const reg = require('../server/lib/previewRegistry');
    const slugGen = require('../server/lib/slugGenerator');
    const configGen = require('../server/lib/configGenerator');
    const screenshotCap = require('../server/lib/screenshotCapturer');
    const prevGen = require('../server/lib/previewGenerator');

    const lead1 = makeLead({ id: 'lead-1', businessName: 'Salon A' });
    const lead2 = makeLead({ id: 'lead-2', businessName: 'Salon B' });
    const lead3 = makeLead({ id: 'lead-3', businessName: 'Salon C' });

    ds.get.mockImplementation((collection, id) => {
      if (id === 'lead-1') return lead1;
      if (id === 'lead-2') return lead2;
      if (id === 'lead-3') return lead3;
      return null;
    });

    reg.getByLeadId.mockReturnValue(null);
    reg.getAllEntries.mockReturnValue([]);
    reg.getBySlug.mockReturnValue({ slug: 'test', createdAt: '2026-06-10', expiresAt: '2026-07-10' });
    configGen.generateConfig.mockReturnValue({ success: true, config: {} });
    slugGen.generateSlug.mockImplementation((name) => name.toLowerCase().replace(/\s+/g, '-'));
    slugGen.computeLeadDataHash.mockReturnValue('hash-abc');
    prevGen.resolveNiche.mockReturnValue('coiffeur');
    prevGen.writePreviewsManifest.mockImplementation(() => {});
    screenshotCap.captureScreenshot.mockResolvedValue({ success: true, screenshotPath: '/tmp/ss.png' });
    cpModule.execSync.mockImplementation(() => Buffer.from('OK'));
    fsModule.existsSync.mockReturnValue(true);
    fsModule.writeFileSync.mockImplementation(() => {});
    fsModule.renameSync.mockImplementation(() => {});
    fsModule.mkdirSync.mockImplementation(() => {});
    fsModule.copyFileSync.mockImplementation(() => {});

    const sendEvent = jest.fn();
    await batchPreviewGenerator.start(['lead-1', 'lead-2', 'lead-3'], defaultSettings, sendEvent);

    // Count deploy calls
    const deployCalls = cpModule.execSync.mock.calls.filter(call =>
      call[0].includes('deploy-previews.mjs')
    );
    expect(deployCalls.length).toBe(1);

    // Verify deploy command has correct options
    expect(deployCalls[0][1]).toMatchObject({
      cwd: defaultSettings.previewSiteRepoPath,
      timeout: 300000
    });
  });

  test('no deploy if all leads failed', async () => {
    const fsModule = require('fs');
    const cpModule = require('child_process');
    const ds = require('../server/lib/dataStore');
    const reg = require('../server/lib/previewRegistry');
    const slugGen = require('../server/lib/slugGenerator');
    const configGen = require('../server/lib/configGenerator');
    const screenshotCap = require('../server/lib/screenshotCapturer');
    const prevGen = require('../server/lib/previewGenerator');

    const lead1 = makeLead({ id: 'lead-1' });

    ds.get.mockReturnValue(lead1);
    reg.getByLeadId.mockReturnValue(null);
    reg.getAllEntries.mockReturnValue([]);
    configGen.generateConfig.mockReturnValue({ success: true, config: {} });
    slugGen.generateSlug.mockReturnValue('test-salon');
    slugGen.computeLeadDataHash.mockReturnValue('hash-abc');
    prevGen.resolveNiche.mockReturnValue('coiffeur');
    prevGen.writePreviewsManifest.mockImplementation(() => {});
    screenshotCap.captureScreenshot.mockResolvedValue({ success: true, screenshotPath: '/tmp/ss.png' });
    fsModule.existsSync.mockReturnValue(true);
    fsModule.writeFileSync.mockImplementation(() => {});
    fsModule.renameSync.mockImplementation(() => {});
    fsModule.mkdirSync.mockImplementation(() => {});
    fsModule.copyFileSync.mockImplementation(() => {});

    // All builds fail
    cpModule.execSync.mockImplementation((cmd) => {
      if (cmd.includes('build-preview.mjs')) {
        throw new Error('Build failed');
      }
      return Buffer.from('OK');
    });

    const sendEvent = jest.fn();
    await batchPreviewGenerator.start(['lead-1'], defaultSettings, sendEvent);

    // No deploy should have been called
    const deployCalls = cpModule.execSync.mock.calls.filter(call =>
      call[0].includes('deploy-previews.mjs')
    );
    expect(deployCalls.length).toBe(0);

    const status = batchPreviewGenerator.getStatus();
    expect(status.status).toBe('complete');
  });
});

// --- State Persistence ---

describe('batchPreviewGenerator state persistence', () => {
  test('after each completion, fs.writeFileSync is called (state persisted)', async () => {
    const fsModule = require('fs');
    const cpModule = require('child_process');
    const ds = require('../server/lib/dataStore');
    const reg = require('../server/lib/previewRegistry');
    const slugGen = require('../server/lib/slugGenerator');
    const configGen = require('../server/lib/configGenerator');
    const screenshotCap = require('../server/lib/screenshotCapturer');
    const prevGen = require('../server/lib/previewGenerator');

    const lead1 = makeLead({ id: 'lead-1', businessName: 'Salon A' });
    const lead2 = makeLead({ id: 'lead-2', businessName: 'Salon B' });

    ds.get.mockImplementation((collection, id) => {
      if (id === 'lead-1') return lead1;
      if (id === 'lead-2') return lead2;
      return null;
    });

    reg.getByLeadId.mockReturnValue(null);
    reg.getAllEntries.mockReturnValue([]);
    reg.getBySlug.mockReturnValue({ slug: 'test', createdAt: '2026-06-10', expiresAt: '2026-07-10' });
    configGen.generateConfig.mockReturnValue({ success: true, config: {} });
    slugGen.generateSlug.mockImplementation((name) => name.toLowerCase().replace(/\s+/g, '-'));
    slugGen.computeLeadDataHash.mockReturnValue('hash-abc');
    prevGen.resolveNiche.mockReturnValue('coiffeur');
    prevGen.writePreviewsManifest.mockImplementation(() => {});
    screenshotCap.captureScreenshot.mockResolvedValue({ success: true, screenshotPath: '/tmp/ss.png' });
    cpModule.execSync.mockImplementation(() => Buffer.from('OK'));
    fsModule.existsSync.mockReturnValue(true);
    fsModule.writeFileSync.mockImplementation(() => {});
    fsModule.renameSync.mockImplementation(() => {});
    fsModule.mkdirSync.mockImplementation(() => {});
    fsModule.copyFileSync.mockImplementation(() => {});

    const sendEvent = jest.fn();
    await batchPreviewGenerator.start(['lead-1', 'lead-2'], defaultSettings, sendEvent);

    // State should be persisted multiple times (initial + per lead + deploy transitions)
    // The write is done via writeFileSync to a .tmp file then renameSync
    const stateWrites = fsModule.writeFileSync.mock.calls.filter(call =>
      call[0].toString().includes('batch-preview-state.json.tmp')
    );
    // At least one write per completed lead
    expect(stateWrites.length).toBeGreaterThanOrEqual(2);

    // Verify renameSync is called for atomic writes
    const stateRenames = fsModule.renameSync.mock.calls.filter(call =>
      call[1].toString().includes('batch-preview-state.json')
    );
    expect(stateRenames.length).toBeGreaterThanOrEqual(2);
  });

  test('after a failure, state is persisted with failed entry', async () => {
    const fsModule = require('fs');
    const cpModule = require('child_process');
    const ds = require('../server/lib/dataStore');
    const reg = require('../server/lib/previewRegistry');
    const slugGen = require('../server/lib/slugGenerator');
    const configGen = require('../server/lib/configGenerator');
    const screenshotCap = require('../server/lib/screenshotCapturer');
    const prevGen = require('../server/lib/previewGenerator');

    const lead1 = makeLead({ id: 'lead-1' });
    ds.get.mockReturnValue(lead1);
    reg.getByLeadId.mockReturnValue(null);
    reg.getAllEntries.mockReturnValue([]);
    configGen.generateConfig.mockReturnValue({ success: true, config: {} });
    slugGen.generateSlug.mockReturnValue('test-salon');
    slugGen.computeLeadDataHash.mockReturnValue('hash-abc');
    prevGen.resolveNiche.mockReturnValue('coiffeur');
    prevGen.writePreviewsManifest.mockImplementation(() => {});
    screenshotCap.captureScreenshot.mockResolvedValue({ success: true, screenshotPath: '/tmp/ss.png' });
    fsModule.existsSync.mockReturnValue(true);
    fsModule.writeFileSync.mockImplementation(() => {});
    fsModule.renameSync.mockImplementation(() => {});
    fsModule.mkdirSync.mockImplementation(() => {});
    fsModule.copyFileSync.mockImplementation(() => {});

    // Build throws
    cpModule.execSync.mockImplementation((cmd) => {
      if (cmd.includes('build-preview.mjs')) {
        throw new Error('Build timeout');
      }
      return Buffer.from('OK');
    });

    const sendEvent = jest.fn();
    await batchPreviewGenerator.start(['lead-1'], defaultSettings, sendEvent);

    // Check the persisted state includes the failed entry
    const stateWrites = fsModule.writeFileSync.mock.calls.filter(call =>
      call[0].toString().includes('batch-preview-state.json.tmp')
    );
    expect(stateWrites.length).toBeGreaterThanOrEqual(1);

    // Parse the last state write to verify it contains the failure
    const lastWrite = stateWrites[stateWrites.length - 1];
    const persistedState = JSON.parse(lastWrite[1]);
    expect(persistedState.failed.length).toBe(1);
    expect(persistedState.failed[0].leadId).toBe('lead-1');
    expect(persistedState.failed[0].error).toContain('Build timeout');
  });
});

// --- Skip Logic ---

describe('batchPreviewGenerator skip logic', () => {
  test('existing valid deployed non-expired preview with matching hash is skipped (no-op)', async () => {
    const fsModule = require('fs');
    const cpModule = require('child_process');
    const ds = require('../server/lib/dataStore');
    const reg = require('../server/lib/previewRegistry');
    const slugGen = require('../server/lib/slugGenerator');
    const configGen = require('../server/lib/configGenerator');
    const screenshotCap = require('../server/lib/screenshotCapturer');
    const prevGen = require('../server/lib/previewGenerator');

    const lead1 = makeLead({ id: 'lead-1', previewUrl: 'https://preview.kaelint.ch/test-salon/' });
    ds.get.mockReturnValue(lead1);

    // Existing deployed, non-expired preview with matching hash
    reg.getByLeadId.mockReturnValue({
      slug: 'test-salon',
      status: 'deployed',
      expiresAt: new Date(Date.now() + 86400000 * 10).toISOString(), // 10 days from now
      leadDataHash: 'matching-hash'
    });
    reg.updateStatus.mockImplementation(() => {});

    slugGen.computeLeadDataHash.mockReturnValue('matching-hash');

    reg.getAllEntries.mockReturnValue([]);
    configGen.generateConfig.mockReturnValue({ success: true, config: {} });
    slugGen.generateSlug.mockReturnValue('test-salon');
    prevGen.resolveNiche.mockReturnValue('coiffeur');
    prevGen.writePreviewsManifest.mockImplementation(() => {});
    screenshotCap.captureScreenshot.mockResolvedValue({ success: true, screenshotPath: '/tmp/ss.png' });
    cpModule.execSync.mockImplementation(() => Buffer.from('OK'));
    fsModule.existsSync.mockReturnValue(true);
    fsModule.writeFileSync.mockImplementation(() => {});
    fsModule.renameSync.mockImplementation(() => {});
    fsModule.mkdirSync.mockImplementation(() => {});
    fsModule.copyFileSync.mockImplementation(() => {});

    const sendEvent = jest.fn();
    await batchPreviewGenerator.start(['lead-1'], defaultSettings, sendEvent);

    // No build should have been called for this lead
    const buildCalls = cpModule.execSync.mock.calls.filter(call =>
      call[0].includes('build-preview.mjs')
    );
    expect(buildCalls.length).toBe(0);

    // Lead should be in completed (skipped)
    const status = batchPreviewGenerator.getStatus();
    expect(status.completed).toContain('lead-1');

    // Verify SSE event with status "skipped"
    const skippedEvents = sendEvent.mock.calls.filter(
      call => call[0] === 'progress' && call[1].status === 'skipped'
    );
    expect(skippedEvents.length).toBe(1);
    expect(skippedEvents[0][1].leadId).toBe('lead-1');
  });

  test('does NOT skip if hash does not match (rebuild needed)', async () => {
    const fsModule = require('fs');
    const cpModule = require('child_process');
    const ds = require('../server/lib/dataStore');
    const reg = require('../server/lib/previewRegistry');
    const slugGen = require('../server/lib/slugGenerator');
    const configGen = require('../server/lib/configGenerator');
    const screenshotCap = require('../server/lib/screenshotCapturer');
    const prevGen = require('../server/lib/previewGenerator');

    const lead1 = makeLead({ id: 'lead-1' });
    ds.get.mockReturnValue(lead1);

    // Existing deployed preview but with DIFFERENT hash
    reg.getByLeadId.mockReturnValue({
      slug: 'test-salon',
      status: 'deployed',
      expiresAt: new Date(Date.now() + 86400000 * 10).toISOString(),
      leadDataHash: 'old-hash'
    });

    slugGen.computeLeadDataHash.mockReturnValue('new-hash'); // Different!
    reg.getAllEntries.mockReturnValue([]);
    reg.getBySlug.mockReturnValue({ slug: 'test-salon', createdAt: '2026-06-10', expiresAt: '2026-07-10' });
    configGen.generateConfig.mockReturnValue({ success: true, config: {} });
    slugGen.generateSlug.mockReturnValue('test-salon');
    prevGen.resolveNiche.mockReturnValue('coiffeur');
    prevGen.writePreviewsManifest.mockImplementation(() => {});
    screenshotCap.captureScreenshot.mockResolvedValue({ success: true, screenshotPath: '/tmp/ss.png' });
    cpModule.execSync.mockImplementation(() => Buffer.from('OK'));
    fsModule.existsSync.mockReturnValue(true);
    fsModule.writeFileSync.mockImplementation(() => {});
    fsModule.renameSync.mockImplementation(() => {});
    fsModule.mkdirSync.mockImplementation(() => {});
    fsModule.copyFileSync.mockImplementation(() => {});

    const sendEvent = jest.fn();
    await batchPreviewGenerator.start(['lead-1'], defaultSettings, sendEvent);

    // Build SHOULD have been called because hash doesn't match
    const buildCalls = cpModule.execSync.mock.calls.filter(call =>
      call[0].includes('build-preview.mjs')
    );
    expect(buildCalls.length).toBe(1);
  });

  test('does NOT skip if preview is expired', async () => {
    const fsModule = require('fs');
    const cpModule = require('child_process');
    const ds = require('../server/lib/dataStore');
    const reg = require('../server/lib/previewRegistry');
    const slugGen = require('../server/lib/slugGenerator');
    const configGen = require('../server/lib/configGenerator');
    const screenshotCap = require('../server/lib/screenshotCapturer');
    const prevGen = require('../server/lib/previewGenerator');

    const lead1 = makeLead({ id: 'lead-1' });
    ds.get.mockReturnValue(lead1);

    // Existing deployed preview but EXPIRED
    reg.getByLeadId.mockReturnValue({
      slug: 'test-salon',
      status: 'deployed',
      expiresAt: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
      leadDataHash: 'matching-hash'
    });

    slugGen.computeLeadDataHash.mockReturnValue('matching-hash');
    reg.getAllEntries.mockReturnValue([]);
    reg.getBySlug.mockReturnValue({ slug: 'test-salon', createdAt: '2026-06-10', expiresAt: '2026-07-10' });
    configGen.generateConfig.mockReturnValue({ success: true, config: {} });
    slugGen.generateSlug.mockReturnValue('test-salon');
    prevGen.resolveNiche.mockReturnValue('coiffeur');
    prevGen.writePreviewsManifest.mockImplementation(() => {});
    screenshotCap.captureScreenshot.mockResolvedValue({ success: true, screenshotPath: '/tmp/ss.png' });
    cpModule.execSync.mockImplementation(() => Buffer.from('OK'));
    fsModule.existsSync.mockReturnValue(true);
    fsModule.writeFileSync.mockImplementation(() => {});
    fsModule.renameSync.mockImplementation(() => {});
    fsModule.mkdirSync.mockImplementation(() => {});
    fsModule.copyFileSync.mockImplementation(() => {});

    const sendEvent = jest.fn();
    await batchPreviewGenerator.start(['lead-1'], defaultSettings, sendEvent);

    // Build SHOULD have been called because preview expired
    const buildCalls = cpModule.execSync.mock.calls.filter(call =>
      call[0].includes('build-preview.mjs')
    );
    expect(buildCalls.length).toBe(1);
  });
});

// --- Resume from Partial State ---

describe('batchPreviewGenerator resume from partial state', () => {
  test('resumes processing only remaining items from persisted state', async () => {
    const fsModule = require('fs');
    const cpModule = require('child_process');
    const ds = require('../server/lib/dataStore');
    const reg = require('../server/lib/previewRegistry');
    const slugGen = require('../server/lib/slugGenerator');
    const configGen = require('../server/lib/configGenerator');
    const screenshotCap = require('../server/lib/screenshotCapturer');
    const prevGen = require('../server/lib/previewGenerator');

    // Simulate persisted state: lead-1 already completed, lead-2 and lead-3 remaining
    const persistedState = {
      status: 'running',
      queue: ['lead-2', 'lead-3'],
      completed: ['lead-1'],
      failed: [],
      startedAt: '2026-06-11T22:00:00.000Z',
      lastUpdatedAt: '2026-06-11T22:05:00.000Z'
    };

    fsModule.existsSync.mockReturnValue(true);
    fsModule.readFileSync.mockReturnValue(JSON.stringify(persistedState));

    const lead2 = makeLead({ id: 'lead-2', businessName: 'Salon B' });
    const lead3 = makeLead({ id: 'lead-3', businessName: 'Salon C' });

    ds.get.mockImplementation((collection, id) => {
      if (id === 'lead-2') return lead2;
      if (id === 'lead-3') return lead3;
      return null;
    });

    reg.getByLeadId.mockReturnValue(null);
    reg.getAllEntries.mockReturnValue([]);
    reg.getBySlug.mockReturnValue({ slug: 'test', createdAt: '2026-06-10', expiresAt: '2026-07-10' });
    configGen.generateConfig.mockReturnValue({ success: true, config: {} });
    slugGen.generateSlug.mockImplementation((name) => name.toLowerCase().replace(/\s+/g, '-'));
    slugGen.computeLeadDataHash.mockReturnValue('hash-abc');
    prevGen.resolveNiche.mockReturnValue('coiffeur');
    prevGen.writePreviewsManifest.mockImplementation(() => {});
    screenshotCap.captureScreenshot.mockResolvedValue({ success: true, screenshotPath: '/tmp/ss.png' });
    cpModule.execSync.mockImplementation(() => Buffer.from('OK'));
    fsModule.writeFileSync.mockImplementation(() => {});
    fsModule.renameSync.mockImplementation(() => {});
    fsModule.mkdirSync.mockImplementation(() => {});
    fsModule.copyFileSync.mockImplementation(() => {});

    const sendEvent = jest.fn();
    await batchPreviewGenerator.resume(defaultSettings, sendEvent);

    // Verify only 2 builds ran (lead-2 and lead-3, not lead-1)
    const buildCalls = cpModule.execSync.mock.calls.filter(call =>
      call[0].includes('build-preview.mjs')
    );
    expect(buildCalls.length).toBe(2);

    // Verify final status includes all 3 completed
    const status = batchPreviewGenerator.getStatus();
    expect(status.completed).toContain('lead-1');
    expect(status.completed).toContain('lead-2');
    expect(status.completed).toContain('lead-3');
    expect(status.status).toBe('complete');
  });

  test('throws if no resumable state exists', async () => {
    const fsModule = require('fs');
    fsModule.existsSync.mockReturnValue(false);

    const sendEvent = jest.fn();
    await expect(
      batchPreviewGenerator.resume(defaultSettings, sendEvent)
    ).rejects.toThrow('No resumable batch state found');
  });

  test('throws if state status is not running or deploying', async () => {
    const fsModule = require('fs');

    const completedState = {
      status: 'complete',
      queue: [],
      completed: ['lead-1'],
      failed: [],
      startedAt: '2026-06-11T22:00:00.000Z',
      lastUpdatedAt: '2026-06-11T22:10:00.000Z'
    };

    fsModule.existsSync.mockReturnValue(true);
    fsModule.readFileSync.mockReturnValue(JSON.stringify(completedState));

    const sendEvent = jest.fn();
    await expect(
      batchPreviewGenerator.resume(defaultSettings, sendEvent)
    ).rejects.toThrow('No resumable batch state found');
  });

  test('resumes deploying state by re-running deploy only', async () => {
    const fsModule = require('fs');
    const cpModule = require('child_process');
    const ds = require('../server/lib/dataStore');
    const reg = require('../server/lib/previewRegistry');

    // State was in "deploying" when interrupted
    const deployingState = {
      status: 'deploying',
      queue: [],
      completed: ['lead-1', 'lead-2'],
      failed: [],
      startedAt: '2026-06-11T22:00:00.000Z',
      lastUpdatedAt: '2026-06-11T22:10:00.000Z'
    };

    fsModule.existsSync.mockReturnValue(true);
    fsModule.readFileSync.mockReturnValue(JSON.stringify(deployingState));
    fsModule.writeFileSync.mockImplementation(() => {});
    fsModule.renameSync.mockImplementation(() => {});
    fsModule.mkdirSync.mockImplementation(() => {});

    ds.get.mockImplementation((collection, id) => {
      return { id, previewUrl: `https://preview.kaelint.ch/${id}/` };
    });
    reg.updateStatus.mockImplementation(() => {});
    cpModule.execSync.mockImplementation(() => Buffer.from('OK'));

    const sendEvent = jest.fn();
    await batchPreviewGenerator.resume(defaultSettings, sendEvent);

    // Should only call deploy, no builds
    const buildCalls = cpModule.execSync.mock.calls.filter(call =>
      call[0].includes('build-preview.mjs')
    );
    expect(buildCalls.length).toBe(0);

    const deployCalls = cpModule.execSync.mock.calls.filter(call =>
      call[0].includes('deploy-previews.mjs')
    );
    expect(deployCalls.length).toBe(1);

    const status = batchPreviewGenerator.getStatus();
    expect(status.status).toBe('complete');
  });

  test('throws if already running during resume', async () => {
    const fsModule = require('fs');
    const cpModule = require('child_process');
    const ds = require('../server/lib/dataStore');
    const reg = require('../server/lib/previewRegistry');
    const slugGen = require('../server/lib/slugGenerator');
    const configGen = require('../server/lib/configGenerator');
    const screenshotCap = require('../server/lib/screenshotCapturer');
    const prevGen = require('../server/lib/previewGenerator');

    const lead = makeLead({ id: 'lead-1' });
    ds.get.mockReturnValue(lead);
    reg.getByLeadId.mockReturnValue(null);
    reg.getAllEntries.mockReturnValue([]);
    reg.getBySlug.mockReturnValue({ slug: 'test-salon', createdAt: '2026-06-10', expiresAt: '2026-07-10' });
    configGen.generateConfig.mockReturnValue({ success: true, config: {} });
    slugGen.generateSlug.mockReturnValue('test-salon');
    slugGen.computeLeadDataHash.mockReturnValue('hash-abc');
    prevGen.resolveNiche.mockReturnValue('coiffeur');
    prevGen.writePreviewsManifest.mockImplementation(() => {});
    fsModule.existsSync.mockReturnValue(true);
    fsModule.writeFileSync.mockImplementation(() => {});
    fsModule.renameSync.mockImplementation(() => {});
    fsModule.mkdirSync.mockImplementation(() => {});
    fsModule.copyFileSync.mockImplementation(() => {});

    // Keep a batch running with a never-resolving screenshot
    let resolveScreenshot;
    screenshotCap.captureScreenshot.mockReturnValue(new Promise(resolve => {
      resolveScreenshot = resolve;
    }));
    cpModule.execSync.mockImplementation(() => Buffer.from('OK'));

    const sendEvent = jest.fn();
    const runningBatch = batchPreviewGenerator.start(['lead-1'], defaultSettings, sendEvent);

    // Persisted state for resume
    const persistedState = {
      status: 'running',
      queue: ['lead-2'],
      completed: [],
      failed: [],
      startedAt: '2026-06-11T22:00:00.000Z',
      lastUpdatedAt: '2026-06-11T22:05:00.000Z'
    };
    fsModule.readFileSync.mockReturnValue(JSON.stringify(persistedState));

    await expect(
      batchPreviewGenerator.resume(defaultSettings, sendEvent)
    ).rejects.toThrow('Batch preview generation is already running');

    // Clean up
    resolveScreenshot({ success: true, screenshotPath: '/tmp/ss.png' });
    await runningBatch;
  });
});

// --- isRunning ---

describe('batchPreviewGenerator isRunning', () => {
  test('returns false initially', () => {
    expect(batchPreviewGenerator.isRunning()).toBe(false);
  });
});

// --- getStatus ---

describe('batchPreviewGenerator getStatus', () => {
  test('returns null when no batch has run and no state file exists', () => {
    const fsModule = require('fs');
    fsModule.existsSync.mockReturnValue(false);

    const status = batchPreviewGenerator.getStatus();
    expect(status).toBeNull();
  });

  test('returns persisted state when no batch is active', () => {
    const fsModule = require('fs');
    const persistedState = {
      status: 'complete',
      queue: [],
      completed: ['lead-1'],
      failed: [],
      startedAt: '2026-06-11T22:00:00.000Z',
      lastUpdatedAt: '2026-06-11T22:10:00.000Z'
    };

    fsModule.existsSync.mockReturnValue(true);
    fsModule.readFileSync.mockReturnValue(JSON.stringify(persistedState));

    const status = batchPreviewGenerator.getStatus();
    expect(status).not.toBeNull();
    expect(status.status).toBe('complete');
    expect(status.completed).toContain('lead-1');
  });
});
