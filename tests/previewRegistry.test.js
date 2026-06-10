/**
 * Tests for previewRegistry module
 *
 * Covers:
 * - Creation with correct timestamps and expiry calculation
 * - Status transitions (valid and invalid)
 * - CRUD operations (getByLeadId, getBySlug, getActiveEntries, getAllEntries)
 * - markExpired functionality
 * - Atomic file writes
 * - Auto-creation of previews.json
 */

const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'server', 'data');
const PREVIEWS_FILE = path.join(DATA_DIR, 'previews.json');

// Store original file content for cleanup
let originalExists = false;
let originalContent = null;

beforeEach(() => {
  // Backup existing file if present
  if (fs.existsSync(PREVIEWS_FILE)) {
    originalExists = true;
    originalContent = fs.readFileSync(PREVIEWS_FILE, 'utf-8');
  } else {
    originalExists = false;
    originalContent = null;
  }
  // Start each test with a clean state
  if (fs.existsSync(PREVIEWS_FILE)) {
    fs.unlinkSync(PREVIEWS_FILE);
  }
  // Clean up any temp files
  const files = fs.readdirSync(DATA_DIR);
  files.filter(f => f.startsWith('previews.json.tmp.')).forEach(f => {
    fs.unlinkSync(path.join(DATA_DIR, f));
  });
});

afterEach(() => {
  // Restore original file
  if (originalExists && originalContent !== null) {
    fs.writeFileSync(PREVIEWS_FILE, originalContent, 'utf-8');
  } else if (fs.existsSync(PREVIEWS_FILE)) {
    fs.unlinkSync(PREVIEWS_FILE);
  }
  // Clean up any temp files
  const files = fs.readdirSync(DATA_DIR);
  files.filter(f => f.startsWith('previews.json.tmp.')).forEach(f => {
    fs.unlinkSync(path.join(DATA_DIR, f));
  });
});

// Fresh require each test to avoid module caching issues
function getRegistry() {
  // Clear module cache to ensure fresh reads
  delete require.cache[require.resolve('../server/lib/previewRegistry')];
  return require('../server/lib/previewRegistry');
}

describe('previewRegistry', () => {
  describe('auto-creation', () => {
    test('creates previews.json with empty array if file does not exist', () => {
      const registry = getRegistry();
      const entries = registry.getAllEntries();

      expect(entries).toEqual([]);
      expect(fs.existsSync(PREVIEWS_FILE)).toBe(true);
      const content = JSON.parse(fs.readFileSync(PREVIEWS_FILE, 'utf-8'));
      expect(content).toEqual([]);
    });
  });

  describe('createPreview', () => {
    test('creates entry with status "pending"', () => {
      const registry = getRegistry();
      const entry = registry.createPreview({
        slug: 'a7f3b92e-coiffeur-mueller-bern',
        leadId: 'lead-123',
        niche: 'coiffeur',
        previewUrl: 'https://preview.kaelint.ch/a7f3b92e-coiffeur-mueller-bern/de/',
        leadDataHash: 'abc123'
      });

      expect(entry.status).toBe('pending');
      expect(entry.slug).toBe('a7f3b92e-coiffeur-mueller-bern');
      expect(entry.leadId).toBe('lead-123');
      expect(entry.niche).toBe('coiffeur');
      expect(entry.previewUrl).toBe('https://preview.kaelint.ch/a7f3b92e-coiffeur-mueller-bern/de/');
      expect(entry.leadDataHash).toBe('abc123');
    });

    test('calculates expiresAt as createdAt + 30 days', () => {
      const registry = getRegistry();
      const before = Date.now();
      const entry = registry.createPreview({
        slug: 'test-slug',
        leadId: 'lead-456'
      });
      const after = Date.now();

      const createdAt = new Date(entry.createdAt).getTime();
      const expiresAt = new Date(entry.expiresAt).getTime();

      // createdAt should be between before and after
      expect(createdAt).toBeGreaterThanOrEqual(before);
      expect(createdAt).toBeLessThanOrEqual(after);

      // expiresAt should be exactly 30 days after createdAt
      const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
      expect(expiresAt - createdAt).toBe(thirtyDaysMs);
    });

    test('createdAt and expiresAt are valid ISO 8601 timestamps', () => {
      const registry = getRegistry();
      const entry = registry.createPreview({
        slug: 'test-iso',
        leadId: 'lead-789'
      });

      // Valid ISO strings can be parsed back
      expect(new Date(entry.createdAt).toISOString()).toBe(entry.createdAt);
      expect(new Date(entry.expiresAt).toISOString()).toBe(entry.expiresAt);
    });

    test('sets null for optional fields when not provided', () => {
      const registry = getRegistry();
      const entry = registry.createPreview({
        slug: 'minimal-slug',
        leadId: 'lead-min'
      });

      expect(entry.niche).toBeNull();
      expect(entry.screenshotPath).toBeNull();
      expect(entry.screenshotError).toBeNull();
      expect(entry.previewUrl).toBeNull();
      expect(entry.leadDataHash).toBeNull();
    });

    test('persists entry to disk', () => {
      const registry = getRegistry();
      registry.createPreview({
        slug: 'persist-test',
        leadId: 'lead-persist'
      });

      // Read directly from file
      const raw = fs.readFileSync(PREVIEWS_FILE, 'utf-8');
      const data = JSON.parse(raw);
      expect(data).toHaveLength(1);
      expect(data[0].slug).toBe('persist-test');
    });

    test('creates multiple entries without overwriting', () => {
      const registry = getRegistry();
      registry.createPreview({ slug: 'slug-1', leadId: 'lead-1' });
      registry.createPreview({ slug: 'slug-2', leadId: 'lead-2' });
      registry.createPreview({ slug: 'slug-3', leadId: 'lead-3' });

      const entries = registry.getAllEntries();
      expect(entries).toHaveLength(3);
    });
  });

  describe('updateStatus', () => {
    test('transitions from pending to built', () => {
      const registry = getRegistry();
      registry.createPreview({ slug: 'trans-1', leadId: 'lead-t1' });

      const updated = registry.updateStatus('trans-1', 'built');
      expect(updated).not.toBeNull();
      expect(updated.status).toBe('built');
    });

    test('transitions from built to deployed', () => {
      const registry = getRegistry();
      registry.createPreview({ slug: 'trans-2', leadId: 'lead-t2' });
      registry.updateStatus('trans-2', 'built');

      const updated = registry.updateStatus('trans-2', 'deployed');
      expect(updated).not.toBeNull();
      expect(updated.status).toBe('deployed');
    });

    test('transitions from deployed to expired', () => {
      const registry = getRegistry();
      registry.createPreview({ slug: 'trans-3', leadId: 'lead-t3' });
      registry.updateStatus('trans-3', 'built');
      registry.updateStatus('trans-3', 'deployed');

      const updated = registry.updateStatus('trans-3', 'expired');
      expect(updated).not.toBeNull();
      expect(updated.status).toBe('expired');
    });

    test('allows any status to transition to failed', () => {
      const registry = getRegistry();

      // pending → failed
      registry.createPreview({ slug: 'fail-1', leadId: 'lead-f1' });
      expect(registry.updateStatus('fail-1', 'failed').status).toBe('failed');

      // built → failed
      registry.createPreview({ slug: 'fail-2', leadId: 'lead-f2' });
      registry.updateStatus('fail-2', 'built');
      expect(registry.updateStatus('fail-2', 'failed').status).toBe('failed');

      // deployed → failed
      registry.createPreview({ slug: 'fail-3', leadId: 'lead-f3' });
      registry.updateStatus('fail-3', 'built');
      registry.updateStatus('fail-3', 'deployed');
      expect(registry.updateStatus('fail-3', 'failed').status).toBe('failed');
    });

    test('rejects invalid transitions', () => {
      const registry = getRegistry();
      registry.createPreview({ slug: 'invalid-1', leadId: 'lead-i1' });

      // pending → deployed (must go through built)
      expect(registry.updateStatus('invalid-1', 'deployed')).toBeNull();

      // pending → expired (must go through built, deployed)
      expect(registry.updateStatus('invalid-1', 'expired')).toBeNull();
    });

    test('rejects transition from expired', () => {
      const registry = getRegistry();
      registry.createPreview({ slug: 'exp-1', leadId: 'lead-e1' });
      registry.updateStatus('exp-1', 'built');
      registry.updateStatus('exp-1', 'deployed');
      registry.updateStatus('exp-1', 'expired');

      // expired → anything (except nothing is allowed from expired)
      expect(registry.updateStatus('exp-1', 'built')).toBeNull();
      expect(registry.updateStatus('exp-1', 'deployed')).toBeNull();
      expect(registry.updateStatus('exp-1', 'pending')).toBeNull();
    });

    test('rejects transition from failed', () => {
      const registry = getRegistry();
      registry.createPreview({ slug: 'failed-1', leadId: 'lead-fl1' });
      registry.updateStatus('failed-1', 'failed');

      // failed → anything (nothing allowed from failed)
      expect(registry.updateStatus('failed-1', 'built')).toBeNull();
      expect(registry.updateStatus('failed-1', 'pending')).toBeNull();
      expect(registry.updateStatus('failed-1', 'deployed')).toBeNull();
    });

    test('returns null for non-existent slug', () => {
      const registry = getRegistry();
      expect(registry.updateStatus('nonexistent', 'built')).toBeNull();
    });

    test('merges extra fields on status update', () => {
      const registry = getRegistry();
      registry.createPreview({ slug: 'extras-1', leadId: 'lead-ex1' });

      const updated = registry.updateStatus('extras-1', 'failed', {
        screenshotError: 'Playwright timeout'
      });

      expect(updated.status).toBe('failed');
      expect(updated.screenshotError).toBe('Playwright timeout');
    });

    test('updates previewUrl on deploy', () => {
      const registry = getRegistry();
      registry.createPreview({ slug: 'url-1', leadId: 'lead-u1' });
      registry.updateStatus('url-1', 'built');

      const updated = registry.updateStatus('url-1', 'deployed', {
        previewUrl: 'https://preview.kaelint.ch/url-1/de/'
      });

      expect(updated.previewUrl).toBe('https://preview.kaelint.ch/url-1/de/');
    });

    test('persists status change to disk', () => {
      const registry = getRegistry();
      registry.createPreview({ slug: 'disk-1', leadId: 'lead-d1' });
      registry.updateStatus('disk-1', 'built');

      // Read directly from file
      const raw = fs.readFileSync(PREVIEWS_FILE, 'utf-8');
      const data = JSON.parse(raw);
      expect(data[0].status).toBe('built');
    });
  });

  describe('getByLeadId', () => {
    test('returns entry matching leadId', () => {
      const registry = getRegistry();
      registry.createPreview({ slug: 'find-1', leadId: 'lead-find-1', niche: 'coiffeur' });
      registry.createPreview({ slug: 'find-2', leadId: 'lead-find-2', niche: 'restaurant' });

      const result = registry.getByLeadId('lead-find-1');
      expect(result).not.toBeNull();
      expect(result.slug).toBe('find-1');
      expect(result.niche).toBe('coiffeur');
    });

    test('returns null when leadId not found', () => {
      const registry = getRegistry();
      registry.createPreview({ slug: 'find-3', leadId: 'lead-find-3' });

      expect(registry.getByLeadId('nonexistent-lead')).toBeNull();
    });

    test('returns null on empty registry', () => {
      const registry = getRegistry();
      expect(registry.getByLeadId('any-lead')).toBeNull();
    });
  });

  describe('getBySlug', () => {
    test('returns entry matching slug', () => {
      const registry = getRegistry();
      registry.createPreview({ slug: 'slug-find-1', leadId: 'lead-sf-1' });

      const result = registry.getBySlug('slug-find-1');
      expect(result).not.toBeNull();
      expect(result.leadId).toBe('lead-sf-1');
    });

    test('returns null when slug not found', () => {
      const registry = getRegistry();
      registry.createPreview({ slug: 'slug-find-2', leadId: 'lead-sf-2' });

      expect(registry.getBySlug('nonexistent-slug')).toBeNull();
    });
  });

  describe('getActiveEntries', () => {
    test('returns entries that are not expired by status', () => {
      const registry = getRegistry();
      registry.createPreview({ slug: 'active-1', leadId: 'lead-a1' });
      registry.createPreview({ slug: 'active-2', leadId: 'lead-a2' });
      registry.updateStatus('active-2', 'built');

      const active = registry.getActiveEntries();
      expect(active).toHaveLength(2);
    });

    test('excludes entries with status "expired"', () => {
      const registry = getRegistry();
      registry.createPreview({ slug: 'active-3', leadId: 'lead-a3' });
      registry.createPreview({ slug: 'expired-1', leadId: 'lead-exp1' });
      registry.updateStatus('expired-1', 'built');
      registry.updateStatus('expired-1', 'deployed');
      registry.updateStatus('expired-1', 'expired');

      const active = registry.getActiveEntries();
      expect(active).toHaveLength(1);
      expect(active[0].slug).toBe('active-3');
    });

    test('excludes entries whose expiresAt is in the past', () => {
      const registry = getRegistry();
      registry.createPreview({ slug: 'future-1', leadId: 'lead-fut1' });

      // Manually inject a past-expiry entry
      const entries = JSON.parse(fs.readFileSync(PREVIEWS_FILE, 'utf-8'));
      entries.push({
        slug: 'past-expiry',
        leadId: 'lead-past',
        niche: null,
        createdAt: '2020-01-01T00:00:00.000Z',
        expiresAt: '2020-01-31T00:00:00.000Z',
        status: 'deployed',
        screenshotPath: null,
        screenshotError: null,
        previewUrl: null,
        leadDataHash: null
      });
      fs.writeFileSync(PREVIEWS_FILE, JSON.stringify(entries, null, 2), 'utf-8');

      const active = registry.getActiveEntries();
      expect(active).toHaveLength(1);
      expect(active[0].slug).toBe('future-1');
    });

    test('returns empty array when all entries are expired', () => {
      const registry = getRegistry();

      // Write entries with past expiry dates
      const entries = [{
        slug: 'old-1',
        leadId: 'lead-old1',
        niche: null,
        createdAt: '2020-01-01T00:00:00.000Z',
        expiresAt: '2020-01-31T00:00:00.000Z',
        status: 'deployed',
        screenshotPath: null,
        screenshotError: null,
        previewUrl: null,
        leadDataHash: null
      }];
      fs.writeFileSync(PREVIEWS_FILE, JSON.stringify(entries, null, 2), 'utf-8');

      const active = registry.getActiveEntries();
      expect(active).toHaveLength(0);
    });
  });

  describe('markExpired', () => {
    test('sets status to "expired"', () => {
      const registry = getRegistry();
      registry.createPreview({ slug: 'mark-1', leadId: 'lead-m1' });

      const result = registry.markExpired('mark-1');
      expect(result).not.toBeNull();
      expect(result.status).toBe('expired');
    });

    test('returns null for non-existent slug', () => {
      const registry = getRegistry();
      expect(registry.markExpired('nonexistent')).toBeNull();
    });

    test('persists the expired status to disk', () => {
      const registry = getRegistry();
      registry.createPreview({ slug: 'mark-2', leadId: 'lead-m2' });
      registry.markExpired('mark-2');

      const raw = fs.readFileSync(PREVIEWS_FILE, 'utf-8');
      const data = JSON.parse(raw);
      expect(data[0].status).toBe('expired');
    });

    test('can mark any status as expired (bypass transition for direct expiry)', () => {
      const registry = getRegistry();
      registry.createPreview({ slug: 'mark-3', leadId: 'lead-m3' });
      // pending → directly mark expired (used by deploy script)
      const result = registry.markExpired('mark-3');
      expect(result.status).toBe('expired');
    });
  });

  describe('getAllEntries', () => {
    test('returns all entries regardless of status', () => {
      const registry = getRegistry();
      registry.createPreview({ slug: 'all-1', leadId: 'lead-all1' });
      registry.createPreview({ slug: 'all-2', leadId: 'lead-all2' });
      registry.updateStatus('all-2', 'failed');

      const all = registry.getAllEntries();
      expect(all).toHaveLength(2);
    });

    test('returns empty array for empty registry', () => {
      const registry = getRegistry();
      expect(registry.getAllEntries()).toEqual([]);
    });
  });

  describe('atomic writes', () => {
    test('no temp files left after successful write', () => {
      const registry = getRegistry();
      registry.createPreview({ slug: 'atomic-1', leadId: 'lead-at1' });

      const files = fs.readdirSync(DATA_DIR);
      const tempFiles = files.filter(f => f.startsWith('previews.json.tmp.'));
      expect(tempFiles).toHaveLength(0);
    });

    test('file content is valid JSON after write', () => {
      const registry = getRegistry();
      registry.createPreview({ slug: 'atomic-2', leadId: 'lead-at2' });
      registry.updateStatus('atomic-2', 'built');
      registry.createPreview({ slug: 'atomic-3', leadId: 'lead-at3' });

      const raw = fs.readFileSync(PREVIEWS_FILE, 'utf-8');
      expect(() => JSON.parse(raw)).not.toThrow();
      const data = JSON.parse(raw);
      expect(data).toHaveLength(2);
    });
  });

  describe('expiry calculation', () => {
    test('EXPIRY_DURATION_MS equals 30 days in milliseconds', () => {
      const registry = getRegistry();
      expect(registry.EXPIRY_DURATION_MS).toBe(30 * 24 * 60 * 60 * 1000);
    });
  });

  describe('VALID_TRANSITIONS', () => {
    test('defines correct transition map', () => {
      const registry = getRegistry();
      const transitions = registry.VALID_TRANSITIONS;

      expect(transitions.pending).toContain('built');
      expect(transitions.pending).toContain('failed');
      expect(transitions.built).toContain('deployed');
      expect(transitions.built).toContain('failed');
      expect(transitions.deployed).toContain('expired');
      expect(transitions.deployed).toContain('failed');
      expect(transitions.expired).toEqual([]);
      expect(transitions.failed).toEqual([]);
    });
  });
});
