/**
 * Batch Preview Generator
 *
 * Orchestrates parallel preview builds with configurable concurrency,
 * serialized asset access via a semaphore, and SSE progress streaming.
 *
 * Design: Uses a ConcurrencyPool to run N leads in parallel, but only one
 * build occupies the shared src/assets/images/ directory at a time (Semaphore(1)).
 * Config generation, slug creation, and screenshot capture run in parallel.
 *
 * @module batchPreviewGenerator
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const YAML = require('yaml');

const { generateSlug, computeLeadDataHash } = require('./slugGenerator');
const registry = require('./previewRegistry');
const { generateConfig } = require('./configGenerator');
const { captureScreenshot } = require('./screenshotCapturer');
const dataStore = require('./dataStore');
const { resolveNiche, writePreviewsManifest } = require('./previewGenerator');

// --- State file path ---
const DATA_DIR = path.join(__dirname, '..', 'data');
const STATE_FILE = path.join(DATA_DIR, 'batch-preview-state.json');

// --- In-memory state ---
let currentState = null;
let running = false;

// ============================================================================
// Concurrency Helpers (inline)
// ============================================================================

/**
 * Semaphore: limits concurrent access to a shared resource.
 * Used with max=1 to serialize asset-copy → build → cleanup.
 */
class Semaphore {
  constructor(max) {
    this.max = max;
    this.count = 0;
    this.queue = [];
  }

  acquire() {
    return new Promise(resolve => {
      if (this.count < this.max) {
        this.count++;
        resolve();
      } else {
        this.queue.push(resolve);
      }
    });
  }

  release() {
    this.count--;
    if (this.queue.length > 0) {
      this.count++;
      this.queue.shift()();
    }
  }
}

/**
 * ConcurrencyPool: limits how many async tasks run simultaneously.
 * Provides drain() to wait for all in-flight tasks to complete.
 */
class ConcurrencyPool {
  constructor(max) {
    this.max = max;
    this.active = 0;
    this.waiting = [];
    this.drainResolvers = [];
  }

  acquire() {
    return new Promise(resolve => {
      if (this.active < this.max) {
        this.active++;
        resolve();
      } else {
        this.waiting.push(resolve);
      }
    });
  }

  release() {
    this.active--;
    if (this.waiting.length > 0) {
      this.active++;
      this.waiting.shift()();
    }
    if (this.active === 0 && this.drainResolvers.length > 0) {
      this.drainResolvers.forEach(r => r());
      this.drainResolvers = [];
    }
  }

  drain() {
    if (this.active === 0) return Promise.resolve();
    return new Promise(resolve => this.drainResolvers.push(resolve));
  }
}

// ============================================================================
// State Persistence
// ============================================================================

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function persistState(state) {
  ensureDataDir();
  state.lastUpdatedAt = new Date().toISOString();
  try {
    const tmpPath = STATE_FILE + '.tmp.' + Date.now();
    fs.writeFileSync(tmpPath, JSON.stringify(state, null, 2), 'utf-8');
    fs.renameSync(tmpPath, STATE_FILE);
  } catch (err) {
    console.warn('Failed to persist batch preview state:', err.message);
  }
}

function loadState() {
  ensureDataDir();
  if (!fs.existsSync(STATE_FILE)) {
    return null;
  }
  try {
    const raw = fs.readFileSync(STATE_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    console.warn('Failed to read batch preview state:', err.message);
    return null;
  }
}

function createInitialState(leadIds) {
  return {
    status: 'running',
    queue: [...leadIds],
    completed: [],
    failed: [],
    startedAt: new Date().toISOString(),
    lastUpdatedAt: new Date().toISOString()
  };
}

// ============================================================================
// Core Processing
// ============================================================================

/**
 * Process the entire queue with bounded concurrency.
 * Serializes builds via semaphore, allows parallel config/slug/screenshot.
 */
async function processQueue(queue, concurrency, settings, sendEvent) {
  const semaphore = new Semaphore(1);
  const pool = new ConcurrencyPool(concurrency);
  const total = currentState.queue.length + currentState.completed.length + currentState.failed.length;

  for (const leadId of queue) {
    await pool.acquire();
    // Fire-and-forget — pool.release() happens inside processLead
    processLead(leadId, settings, sendEvent, semaphore, pool, total);
  }

  await pool.drain();
}

/**
 * Process a single lead through the full preview pipeline:
 * 1. Emit "queued" → "building" status transition
 * 2. Generate config (parallel-safe)
 * 3. Create slug (parallel-safe)
 * 4. Acquire semaphore → build (serialized) → release semaphore
 * 5. Capture screenshot (parallel-safe)
 * 6. Emit "complete" or "failed"
 */
async function processLead(leadId, settings, sendEvent, semaphore, pool, total) {
  const previewSiteRepoPath = settings.previewSiteRepoPath;

  try {
    // --- Skip check: existing deployed, non-expired preview with matching data hash ---
    const leadForHash = dataStore.get('leads', leadId);
    if (leadForHash) {
      const existingEntry = registry.getByLeadId(leadId);
      if (existingEntry &&
          existingEntry.status === 'deployed' &&
          existingEntry.expiresAt &&
          new Date(existingEntry.expiresAt) > new Date() &&
          existingEntry.leadDataHash === computeLeadDataHash(leadForHash)) {
        // Skip this lead — existing valid preview matches current data
        currentState.completed.push(leadId);
        currentState.queue = currentState.queue.filter(id => id !== leadId);
        persistState(currentState);

        sendEvent('progress', {
          leadId,
          status: 'skipped',
          message: 'Übersprungen – gültige Preview bereits vorhanden',
          completed: currentState.completed.length,
          failed: currentState.failed.length,
          total
        });

        return;
      }
    }

    // Emit queued → building transition
    sendEvent('progress', {
      leadId,
      status: 'building',
      message: 'Build wird vorbereitet...',
      completed: currentState.completed.length,
      failed: currentState.failed.length,
      total
    });

    // --- Step 1: Load lead data ---
    const lead = dataStore.get('leads', leadId);
    if (!lead) {
      throw new Error(`Lead nicht gefunden: ${leadId}`);
    }

    // --- Step 2: Generate config ---
    const configResult = generateConfig(lead, null); // slug set after generation
    if (!configResult.success) {
      throw new Error(`Config-Fehler: ${configResult.error}`);
    }

    // --- Step 3: Generate slug ---
    const existingSlugs = registry.getAllEntries().map(e => e.slug);
    const slug = generateSlug(lead.businessName, lead.city || '', existingSlugs);
    const niche = resolveNiche(lead.category);
    const previewUrl = `https://preview.kaelint.ch/${slug}/`;

    // --- Step 4: Create registry entry ---
    const leadDataHash = computeLeadDataHash(lead);
    registry.createPreview({
      slug,
      leadId: lead.id,
      niche,
      previewUrl,
      leadDataHash
    });

    // --- Step 5: Write config.yaml ---
    const configDir = path.join(previewSiteRepoPath, 'previews', 'configs', slug);
    const configPath = path.join(configDir, 'config.yaml');
    fs.mkdirSync(configDir, { recursive: true });
    const configYaml = YAML.stringify(configResult.config);
    const tmpConfigPath = configPath + '.tmp.' + Date.now();
    fs.writeFileSync(tmpConfigPath, configYaml, 'utf-8');
    fs.renameSync(tmpConfigPath, configPath);

    // --- Step 6: Build (serialized via semaphore) ---
    await semaphore.acquire();
    try {
      const buildCmd = `node scripts/build-preview.mjs --config "${configPath}" --slug "${slug}" --niche "${niche}"`;
      execSync(buildCmd, {
        cwd: previewSiteRepoPath,
        timeout: 90000,
        stdio: ['pipe', 'pipe', 'pipe'],
        env: { ...process.env, NODE_ENV: 'production' }
      });
    } finally {
      semaphore.release();
    }

    // Update registry to "built"
    registry.updateStatus(slug, 'built');

    // Emit built status
    sendEvent('progress', {
      leadId,
      status: 'built',
      message: 'Build abgeschlossen',
      completed: currentState.completed.length,
      failed: currentState.failed.length,
      total
    });

    // --- Step 7: Capture screenshot (parallel-safe, non-blocking on failure) ---
    let screenshotPath = null;
    let screenshotError = null;
    try {
      const screenshotResult = await captureScreenshot(slug, previewSiteRepoPath);
      if (screenshotResult.success) {
        screenshotPath = screenshotResult.screenshotPath;
        // Copy screenshot to dist
        const distScreenshotDir = path.join(previewSiteRepoPath, 'dist', 'previews', slug);
        fs.mkdirSync(distScreenshotDir, { recursive: true });
        fs.copyFileSync(screenshotPath, path.join(distScreenshotDir, 'screenshot.png'));
      } else {
        screenshotError = screenshotResult.error;
      }
    } catch (err) {
      screenshotError = err.message;
    }

    if (screenshotPath) {
      sendEvent('progress', {
        leadId,
        status: 'screenshot',
        message: 'Screenshot erstellt',
        completed: currentState.completed.length,
        failed: currentState.failed.length,
        total
      });
    }

    // --- Step 8: Write previews-manifest.json entry ---
    try {
      const entry = registry.getBySlug(slug);
      writePreviewsManifest(previewSiteRepoPath, slug, niche, entry.createdAt, entry.expiresAt);
    } catch (err) {
      console.warn(`Failed to write previews-manifest for ${slug}:`, err.message);
    }

    // --- Step 9: Update lead record ---
    try {
      const leadRecord = dataStore.get('leads', lead.id);
      if (leadRecord) {
        leadRecord.previewUrl = previewUrl;
        leadRecord.previewScreenshotPath = screenshotPath;
        leadRecord.previewGeneratedAt = new Date().toISOString();
        dataStore.save('leads', leadRecord);
      }
    } catch (err) {
      console.warn(`Failed to update lead record for ${leadId}:`, err.message);
    }

    // --- Mark completed ---
    currentState.completed.push(leadId);
    // Remove from queue
    currentState.queue = currentState.queue.filter(id => id !== leadId);
    persistState(currentState);

    sendEvent('progress', {
      leadId,
      status: 'complete',
      message: 'Preview erfolgreich erstellt',
      completed: currentState.completed.length,
      failed: currentState.failed.length,
      total
    });
  } catch (err) {
    // --- Mark failed ---
    const errorMsg = err.stderr ? err.stderr.toString().slice(0, 200) : (err.message || 'Unbekannter Fehler');
    currentState.failed.push({ leadId, error: errorMsg });
    currentState.queue = currentState.queue.filter(id => id !== leadId);
    persistState(currentState);

    sendEvent('progress', {
      leadId,
      status: 'failed',
      message: errorMsg,
      completed: currentState.completed.length,
      failed: currentState.failed.length,
      total
    });
  } finally {
    pool.release();
  }
}

// ============================================================================
// Deploy (single deploy after all builds complete)
// ============================================================================

async function deployAll(settings, sendEvent) {
  const previewSiteRepoPath = settings.previewSiteRepoPath;
  const total = currentState.completed.length + currentState.failed.length;

  if (currentState.completed.length === 0) {
    currentState.status = 'complete';
    persistState(currentState);
    return;
  }

  currentState.status = 'deploying';
  persistState(currentState);

  try {
    execSync('node scripts/deploy-previews.mjs', {
      cwd: previewSiteRepoPath,
      timeout: 300000, // 5 minutes for deploy
      stdio: ['pipe', 'pipe', 'pipe'],
      env: { ...process.env, NODE_TLS_REJECT_UNAUTHORIZED: '0' }
    });

    // Bulk-update all completed entries to "deployed" in registry
    for (const leadId of currentState.completed) {
      const lead = dataStore.get('leads', leadId);
      if (lead && lead.previewUrl) {
        const slug = lead.previewUrl.replace('https://preview.kaelint.ch/', '').replace(/\/$/, '');
        registry.updateStatus(slug, 'deployed');
      }
    }

    currentState.status = 'complete';
    currentState.summary = {
      total,
      succeeded: currentState.completed.length,
      failed: currentState.failed.length,
      durationSeconds: Math.round((Date.now() - new Date(currentState.startedAt).getTime()) / 1000)
    };
    persistState(currentState);

    sendEvent('progress', {
      leadId: null,
      status: 'deploy_complete',
      message: `Deploy abgeschlossen: ${currentState.completed.length} Previews deployed`,
      completed: currentState.completed.length,
      failed: currentState.failed.length,
      total
    });
  } catch (err) {
    const errorMsg = err.stderr ? err.stderr.toString().slice(0, 200) : err.message;
    currentState.status = 'failed';
    persistState(currentState);

    sendEvent('progress', {
      leadId: null,
      status: 'deploy_failed',
      message: `Deploy fehlgeschlagen: ${errorMsg}`,
      completed: currentState.completed.length,
      failed: currentState.failed.length,
      total
    });
  }
}

// ============================================================================
// Public API
// ============================================================================

/**
 * Start batch preview generation for the given lead IDs.
 *
 * @param {string[]} leadIds - Array of lead IDs to process
 * @param {object} settings - Settings object (must include previewSiteRepoPath, batch.previewConcurrency)
 * @param {Function} sendEvent - SSE callback: sendEvent(eventType, data)
 */
async function start(leadIds, settings, sendEvent) {
  if (running) {
    throw new Error('Batch preview generation is already running');
  }

  running = true;
  const concurrency = (settings.batch && settings.batch.previewConcurrency) || 2;

  // Initialize state
  currentState = createInitialState(leadIds);
  persistState(currentState);

  // Emit initial queued events
  const total = leadIds.length;
  for (const leadId of leadIds) {
    sendEvent('progress', {
      leadId,
      status: 'queued',
      message: 'In Warteschlange',
      completed: 0,
      failed: 0,
      total
    });
  }

  try {
    // Process queue with concurrency
    await processQueue([...leadIds], concurrency, settings, sendEvent);

    // Single deploy at end (Requirement 1.8)
    await deployAll(settings, sendEvent);
  } catch (err) {
    currentState.status = 'failed';
    persistState(currentState);
    sendEvent('progress', {
      leadId: null,
      status: 'failed',
      message: `Batch-Fehler: ${err.message}`,
      completed: currentState.completed.length,
      failed: currentState.failed.length,
      total
    });
  } finally {
    running = false;
  }
}

/**
 * Resume batch processing from persisted state.
 *
 * @param {object} settings - Settings object
 * @param {Function} sendEvent - SSE callback
 */
async function resume(settings, sendEvent) {
  const savedState = loadState();
  if (!savedState || (savedState.status !== 'running' && savedState.status !== 'deploying')) {
    throw new Error('No resumable batch state found');
  }

  if (running) {
    throw new Error('Batch preview generation is already running');
  }

  running = true;
  currentState = savedState;
  const concurrency = (settings.batch && settings.batch.previewConcurrency) || 2;

  try {
    if (savedState.status === 'deploying') {
      // Builds were completed but deploy was interrupted — just re-run deploy
      await deployAll(settings, sendEvent);
    } else {
      // Status is "running" — continue processing remaining queue items
      const remainingQueue = currentState.queue.filter(
        id => !currentState.completed.includes(id) &&
              !currentState.failed.some(f => f.leadId === id)
      );
      await processQueue(remainingQueue, concurrency, settings, sendEvent);
      await deployAll(settings, sendEvent);
    }
  } catch (err) {
    currentState.status = 'failed';
    persistState(currentState);
  } finally {
    running = false;
  }
}

/**
 * Get the current batch state.
 *
 * @returns {object|null} Current state or null if no batch has run
 */
function getStatus() {
  if (currentState) {
    return { ...currentState };
  }
  // Fall back to persisted state
  return loadState();
}

/**
 * Check whether a batch is currently running.
 *
 * @returns {boolean}
 */
function isRunning() {
  return running;
}

module.exports = {
  start,
  resume,
  getStatus,
  isRunning,
  // Exported for testing
  Semaphore,
  ConcurrencyPool
};
