/**
 * Tests for Preview Generator Orchestrator
 *
 * Tests the pipeline flow, SSE events, and error handling.
 * Mocks all dependencies (child_process, screenshotCapturer, etc.)
 * to test orchestration logic in isolation.
 */

const fs = require('fs');
const path = require('path');

// Mock child_process
jest.mock('child_process', () => ({
  execSync: jest.fn()
}));

// Mock screenshotCapturer
jest.mock('../server/lib/screenshotCapturer', () => ({
  captureScreenshot: jest.fn()
}));

// Mock previewRegistry
jest.mock('../server/lib/previewRegistry', () => ({
  getByLeadId: jest.fn(),
  getAllEntries: jest.fn(),
  createPreview: jest.fn(),
  updateStatus: jest.fn(),
  getActiveEntries: jest.fn(),
  markExpired: jest.fn()
}));

// Mock dataStore
jest.mock('../server/lib/dataStore', () => ({
  get: jest.fn(),
  save: jest.fn(),
  getAll: jest.fn()
}));

// Mock slugGenerator — use deterministic slugs for testing
jest.mock('../server/lib/slugGenerator', () => ({
  generateSlug: jest.fn(),
  computeLeadDataHash: jest.fn()
}));

// Mock configGenerator
jest.mock('../server/lib/configGenerator', () => ({
  generateConfig: jest.fn()
}));

// Mock yaml
jest.mock('yaml', () => ({
  stringify: jest.fn(() => 'businessName: Test\n')
}));

const { execSync } = require('child_process');
const { captureScreenshot } = require('../server/lib/screenshotCapturer');
const registry = require('../server/lib/previewRegistry');
const dataStore = require('../server/lib/dataStore');
const { generateSlug, computeLeadDataHash } = require('../server/lib/slugGenerator');
const { generateConfig } = require('../server/lib/configGenerator');
const { generatePreview, resolveNiche, writePreviewsManifest } = require('../server/lib/previewGenerator');

describe('Preview Generator Orchestrator', () => {
  let sendEvent;
  let events;
  const testSlug = 'a1b2c3d4-test-business-bern';

  const validLead = {
    id: 'lead-123',
    businessName: 'Test Business',
    category: 'coiffeur',
    city: 'Bern',
    address: 'Marktgasse 1',
    phone: '+41 79 123 45 67',
    email: 'test@example.com',
    contactPerson: 'Max Müller'
  };

  const settings = {
    previewSiteRepoPath: '/tmp/test-kwb-repo'
  };

  beforeEach(() => {
    events = [];
    sendEvent = jest.fn((type, data) => events.push({ type, data }));

    // Default mocks
    generateSlug.mockReturnValue(testSlug);
    computeLeadDataHash.mockReturnValue('hash123');
    registry.getByLeadId.mockReturnValue(null);
    registry.getAllEntries.mockReturnValue([]);
    registry.createPreview.mockReturnValue({
      slug: testSlug,
      leadId: 'lead-123',
      niche: 'coiffeur',
      createdAt: '2025-06-15T10:00:00.000Z',
      expiresAt: '2025-07-15T10:00:00.000Z',
      status: 'pending'
    });
    registry.updateStatus.mockReturnValue({});
    generateConfig.mockReturnValue({
      success: true,
      config: { businessName: 'Test Business', theme: 'warm-earth' }
    });
    captureScreenshot.mockResolvedValue({
      success: true,
      screenshotPath: '/tmp/screenshots/test.png'
    });
    execSync.mockReturnValue(Buffer.from(''));
    dataStore.get.mockReturnValue({ ...validLead });
    dataStore.save.mockReturnValue({});

    // Mock fs operations needed for config write
    jest.spyOn(fs, 'mkdirSync').mockImplementation(() => {});
    jest.spyOn(fs, 'writeFileSync').mockImplementation(() => {});
    jest.spyOn(fs, 'renameSync').mockImplementation(() => {});
    jest.spyOn(fs, 'existsSync').mockReturnValue(false);
    jest.spyOn(fs, 'readFileSync').mockReturnValue('{}');
    jest.spyOn(fs, 'copyFileSync').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // --- Validation tests ---

  describe('Step 1: Lead validation', () => {
    test('returns error when businessName is missing', async () => {
      const lead = { ...validLead, businessName: '' };
      const result = await generatePreview(lead, settings, sendEvent);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Firmenname fehlt');
      expect(sendEvent).toHaveBeenCalledWith('error', {
        step: 'validation_failed',
        message: 'Firmenname fehlt'
      });
    });

    test('returns error when category is missing', async () => {
      const lead = { ...validLead, category: '' };
      const result = await generatePreview(lead, settings, sendEvent);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Kategorie fehlt');
      expect(sendEvent).toHaveBeenCalledWith('error', {
        step: 'validation_failed',
        message: 'Kategorie fehlt'
      });
    });

    test('returns error when lead is null', async () => {
      const result = await generatePreview(null, settings, sendEvent);
      expect(result.success).toBe(false);
      expect(result.error).toBe('Firmenname fehlt');
    });
  });

  // --- Existing preview check tests ---

  describe('Step 2: Existing preview check', () => {
    test('returns existing preview when hash matches and not expired', async () => {
      const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
      registry.getByLeadId.mockReturnValue({
        slug: 'existing-slug',
        status: 'deployed',
        expiresAt: futureDate,
        leadDataHash: 'hash123',
        previewUrl: 'https://preview.kaelint.ch/existing-slug/',
        screenshotPath: '/path/to/screenshot.png'
      });
      computeLeadDataHash.mockReturnValue('hash123');

      const result = await generatePreview(validLead, settings, sendEvent);

      expect(result.success).toBe(true);
      expect(result.existing).toBe(true);
      expect(result.previewUrl).toBe('https://preview.kaelint.ch/existing-slug/');
      expect(sendEvent).toHaveBeenCalledWith('complete', expect.objectContaining({
        step: 'deploy_complete',
        message: 'Preview bereits vorhanden (keine Änderungen)'
      }));
    });

    test('regenerates when hash differs', async () => {
      const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
      registry.getByLeadId.mockReturnValue({
        slug: 'existing-slug',
        status: 'deployed',
        expiresAt: futureDate,
        leadDataHash: 'old-hash',
        previewUrl: 'https://preview.kaelint.ch/existing-slug/'
      });
      computeLeadDataHash.mockReturnValue('new-hash');

      const result = await generatePreview(validLead, settings, sendEvent);

      // Should proceed with generation (not return existing)
      expect(result.existing).toBeUndefined();
      expect(generateSlug).toHaveBeenCalled();
    });

    test('regenerates when existing preview is expired', async () => {
      const pastDate = new Date(Date.now() - 1000).toISOString();
      registry.getByLeadId.mockReturnValue({
        slug: 'expired-slug',
        status: 'deployed',
        expiresAt: pastDate,
        leadDataHash: 'hash123'
      });
      computeLeadDataHash.mockReturnValue('hash123');

      const result = await generatePreview(validLead, settings, sendEvent);

      expect(result.existing).toBeUndefined();
      expect(generateSlug).toHaveBeenCalled();
    });

    test('regenerates when existing preview has non-deployed status', async () => {
      const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
      registry.getByLeadId.mockReturnValue({
        slug: 'failed-slug',
        status: 'failed',
        expiresAt: futureDate,
        leadDataHash: 'hash123'
      });

      const result = await generatePreview(validLead, settings, sendEvent);

      expect(result.existing).toBeUndefined();
      expect(generateSlug).toHaveBeenCalled();
    });
  });

  // --- Full pipeline success tests ---

  describe('Full pipeline (success path)', () => {
    test('completes full pipeline and sends correct SSE events', async () => {
      const result = await generatePreview(validLead, settings, sendEvent);

      expect(result.success).toBe(true);
      expect(result.previewUrl).toBe(`https://preview.kaelint.ch/${testSlug}/`);

      // Verify SSE event sequence
      const eventSteps = events.map(e => `${e.type}:${e.data.step}`);
      expect(eventSteps).toEqual([
        'progress:config_generated',
        'progress:build_started',
        'progress:build_complete',
        'progress:screenshot_captured',
        'progress:deploy_started',
        'complete:deploy_complete'
      ]);
    });

    test('creates registry entry with correct data', async () => {
      await generatePreview(validLead, settings, sendEvent);

      expect(registry.createPreview).toHaveBeenCalledWith({
        slug: testSlug,
        leadId: 'lead-123',
        niche: 'coiffeur',
        previewUrl: `https://preview.kaelint.ch/${testSlug}/`,
        leadDataHash: 'hash123'
      });
    });

    test('generates config and writes YAML', async () => {
      await generatePreview(validLead, settings, sendEvent);

      expect(generateConfig).toHaveBeenCalledWith(validLead, testSlug);
      expect(fs.mkdirSync).toHaveBeenCalledWith(
        path.join(settings.previewSiteRepoPath, 'previews', 'configs', testSlug),
        { recursive: true }
      );
    });

    test('spawns build with correct arguments', async () => {
      await generatePreview(validLead, settings, sendEvent);

      const configPath = path.join(settings.previewSiteRepoPath, 'previews', 'configs', testSlug, 'config.yaml');
      expect(execSync).toHaveBeenCalledWith(
        `node scripts/build-preview.mjs --config "${configPath}" --slug "${testSlug}" --niche "coiffeur"`,
        expect.objectContaining({
          cwd: settings.previewSiteRepoPath,
          timeout: 90000
        })
      );
    });

    test('captures screenshot and copies to dist', async () => {
      await generatePreview(validLead, settings, sendEvent);

      expect(captureScreenshot).toHaveBeenCalledWith(testSlug, settings.previewSiteRepoPath);
      expect(fs.copyFileSync).toHaveBeenCalled();
    });

    test('spawns deploy script', async () => {
      await generatePreview(validLead, settings, sendEvent);

      // Second execSync call is the deploy
      expect(execSync).toHaveBeenCalledWith(
        'node scripts/deploy-previews.mjs',
        expect.objectContaining({
          cwd: settings.previewSiteRepoPath,
          timeout: 120000
        })
      );
    });

    test('updates registry to deployed status', async () => {
      await generatePreview(validLead, settings, sendEvent);

      // Should be called with 'built' first, then 'deployed'
      expect(registry.updateStatus).toHaveBeenCalledWith(testSlug, 'built');
      expect(registry.updateStatus).toHaveBeenCalledWith(testSlug, 'deployed', expect.objectContaining({
        previewUrl: `https://preview.kaelint.ch/${testSlug}/`
      }));
    });

    test('updates lead record with preview data', async () => {
      await generatePreview(validLead, settings, sendEvent);

      expect(dataStore.get).toHaveBeenCalledWith('leads', 'lead-123');
      expect(dataStore.save).toHaveBeenCalledWith('leads', expect.objectContaining({
        previewUrl: `https://preview.kaelint.ch/${testSlug}/`,
        previewScreenshotPath: '/tmp/screenshots/test.png',
        previewGeneratedAt: expect.any(String)
      }));
    });
  });

  // --- Error handling tests ---

  describe('Error handling', () => {
    test('build failure stops pipeline and sets status to failed', async () => {
      const buildError = new Error('Build failed');
      buildError.stderr = Buffer.from('Astro build error: missing component');
      execSync.mockImplementationOnce(() => { throw buildError; });

      captureScreenshot.mockClear();
      const result = await generatePreview(validLead, settings, sendEvent);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Build failed');
      expect(registry.updateStatus).toHaveBeenCalledWith(testSlug, 'failed');
      expect(sendEvent).toHaveBeenCalledWith('error', expect.objectContaining({
        step: 'build_failed'
      }));
      // Verify screenshot was NOT called after build failure
      expect(captureScreenshot).not.toHaveBeenCalled();
    });

    test('screenshot failure continues pipeline', async () => {
      captureScreenshot.mockResolvedValue({
        success: false,
        error: 'Playwright timeout'
      });

      execSync.mockClear();
      const result = await generatePreview(validLead, settings, sendEvent);

      expect(result.success).toBe(true);
      // Deploy should still be called (build + deploy = 2 execSync calls)
      expect(execSync).toHaveBeenCalledTimes(2);
    });

    test('screenshot exception continues pipeline', async () => {
      captureScreenshot.mockRejectedValue(new Error('crash'));

      execSync.mockClear();
      const result = await generatePreview(validLead, settings, sendEvent);

      expect(result.success).toBe(true);
      expect(execSync).toHaveBeenCalledTimes(2);
    });

    test('deploy failure sets status to built and reports error', async () => {
      // First call succeeds (build), second call fails (deploy)
      execSync
        .mockReturnValueOnce(Buffer.from(''))
        .mockImplementationOnce(() => {
          const err = new Error('Deploy failed');
          err.stderr = Buffer.from('wrangler error');
          throw err;
        });

      const result = await generatePreview(validLead, settings, sendEvent);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Deploy failed');
      expect(sendEvent).toHaveBeenCalledWith('error', expect.objectContaining({
        step: 'deploy_failed'
      }));
    });

    test('config generation failure stops pipeline', async () => {
      generateConfig.mockReturnValue({
        success: false,
        error: 'Invalid lead data'
      });

      const result = await generatePreview(validLead, settings, sendEvent);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid lead data');
      expect(registry.updateStatus).toHaveBeenCalledWith(testSlug, 'failed', expect.anything());
      expect(sendEvent).toHaveBeenCalledWith('error', expect.objectContaining({
        step: 'config_failed'
      }));
    });

    test('slug collision error is reported', async () => {
      generateSlug.mockImplementation(() => {
        throw new Error('Slug-Kollision nach 3 Versuchen');
      });

      const result = await generatePreview(validLead, settings, sendEvent);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Slug-Kollision nach 3 Versuchen');
      expect(sendEvent).toHaveBeenCalledWith('error', expect.objectContaining({
        step: 'slug_failed'
      }));
    });
  });

  // --- resolveNiche tests ---

  describe('resolveNiche', () => {
    test('returns known niche for recognized category', () => {
      expect(resolveNiche('coiffeur')).toBe('coiffeur');
      expect(resolveNiche('Restaurant')).toBe('restaurant');
      expect(resolveNiche(' Therapie ')).toBe('therapie');
    });

    test('returns generic for unrecognized category', () => {
      expect(resolveNiche('unknown')).toBe('generic');
      expect(resolveNiche('')).toBe('generic');
      expect(resolveNiche(null)).toBe('generic');
    });
  });

  // --- writePreviewsManifest tests ---

  describe('writePreviewsManifest', () => {
    const repoPath = '/tmp/test-repo';
    const manifestPath = path.join(repoPath, 'previews', 'previews-manifest.json');

    beforeEach(() => {
      fs.existsSync.mockReturnValue(false);
    });

    test('creates new manifest when file does not exist', () => {
      writePreviewsManifest(repoPath, 'test-slug', 'coiffeur', '2025-06-15T10:00:00.000Z', '2025-07-15T10:00:00.000Z');

      expect(fs.mkdirSync).toHaveBeenCalledWith(path.dirname(manifestPath), { recursive: true });
      expect(fs.writeFileSync).toHaveBeenCalled();
      expect(fs.renameSync).toHaveBeenCalled();
    });

    test('adds entry to existing manifest', () => {
      const futureDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
      fs.existsSync.mockReturnValue(true);
      fs.readFileSync.mockReturnValue(JSON.stringify({
        previews: [
          { slug: 'existing-slug', niche: 'restaurant', createdAt: '2025-06-10T00:00:00.000Z', expiresAt: futureDate, status: 'deployed' }
        ],
        lastUpdated: '2025-06-10T00:00:00.000Z'
      }));

      writePreviewsManifest(repoPath, 'new-slug', 'coiffeur', '2025-06-15T10:00:00.000Z', '2025-07-15T10:00:00.000Z');

      // Verify the write call includes both entries
      const writeCall = fs.writeFileSync.mock.calls[0];
      const written = JSON.parse(writeCall[1]);
      expect(written.previews).toHaveLength(2);
      expect(written.previews[1].slug).toBe('new-slug');
    });

    test('removes expired entries from manifest', () => {
      const pastDate = new Date(Date.now() - 1000).toISOString();
      const futureDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
      fs.existsSync.mockReturnValue(true);
      fs.readFileSync.mockReturnValue(JSON.stringify({
        previews: [
          { slug: 'expired-slug', niche: 'restaurant', createdAt: '2025-05-01T00:00:00.000Z', expiresAt: pastDate, status: 'deployed' },
          { slug: 'active-slug', niche: 'fitness', createdAt: '2025-06-10T00:00:00.000Z', expiresAt: futureDate, status: 'deployed' }
        ],
        lastUpdated: '2025-06-10T00:00:00.000Z'
      }));

      writePreviewsManifest(repoPath, 'new-slug', 'coiffeur', '2025-06-15T10:00:00.000Z', '2025-07-15T10:00:00.000Z');

      const writeCall = fs.writeFileSync.mock.calls[0];
      const written = JSON.parse(writeCall[1]);
      // Expired entry should be removed, active + new remain
      expect(written.previews).toHaveLength(2);
      expect(written.previews.map(p => p.slug)).toEqual(['active-slug', 'new-slug']);
    });

    test('updates existing entry by slug', () => {
      const futureDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
      fs.existsSync.mockReturnValue(true);
      fs.readFileSync.mockReturnValue(JSON.stringify({
        previews: [
          { slug: 'same-slug', niche: 'restaurant', createdAt: '2025-06-10T00:00:00.000Z', expiresAt: futureDate, status: 'built' }
        ],
        lastUpdated: '2025-06-10T00:00:00.000Z'
      }));

      writePreviewsManifest(repoPath, 'same-slug', 'coiffeur', '2025-06-15T10:00:00.000Z', '2025-07-15T10:00:00.000Z');

      const writeCall = fs.writeFileSync.mock.calls[0];
      const written = JSON.parse(writeCall[1]);
      expect(written.previews).toHaveLength(1);
      expect(written.previews[0].niche).toBe('coiffeur'); // Updated
      expect(written.previews[0].status).toBe('deployed');
    });
  });
});
