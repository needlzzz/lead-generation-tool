/**
 * Preview Generator Orchestrator
 *
 * Full pipeline: validate lead → check existing preview (hash comparison) →
 * generate slug → create registry entry → write config.yaml → spawn build →
 * capture screenshot → copy screenshot to dist → write previews-manifest.json →
 * spawn deploy → update registry/lead record.
 *
 * Streams SSE events at each step. Handles failures per step:
 * - Build failure → STOPS pipeline, status = "failed"
 * - Screenshot failure → CONTINUES, screenshotError set
 * - Deploy failure → status = "built" (preserve artifacts)
 *
 * @module previewGenerator
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

/**
 * Generate a preview site for a lead.
 *
 * @param {object} lead - The lead object from leads.json
 * @param {object} settings - The settings object (includes previewSiteRepoPath)
 * @param {Function} sendEvent - SSE event sender: sendEvent(eventType, data)
 *   eventType: 'progress' | 'complete' | 'error'
 *   data: { step: string, message: string, ...extras }
 * @returns {Promise<{success: boolean, previewUrl?: string, error?: string}>}
 */
async function generatePreview(lead, settings, sendEvent) {
  const previewSiteRepoPath = settings.previewSiteRepoPath;

  // --- Step 1: Validate lead ---
  if (!lead || !lead.businessName) {
    sendEvent('error', { step: 'validation_failed', message: 'Firmenname fehlt' });
    return { success: false, error: 'Firmenname fehlt' };
  }
  if (!lead.category) {
    sendEvent('error', { step: 'validation_failed', message: 'Kategorie fehlt' });
    return { success: false, error: 'Kategorie fehlt' };
  }

  // --- Step 2: Check existing preview (hash comparison) ---
  const existingPreview = registry.getByLeadId(lead.id);
  if (existingPreview && existingPreview.status === 'deployed') {
    const isExpired = new Date(existingPreview.expiresAt) <= new Date();
    if (!isExpired) {
      const currentHash = computeLeadDataHash(lead);
      if (currentHash === existingPreview.leadDataHash) {
        // No changes — return existing preview (no-op)
        sendEvent('complete', {
          step: 'deploy_complete',
          message: 'Preview bereits vorhanden (keine Änderungen)',
          previewUrl: existingPreview.previewUrl,
          screenshotPath: existingPreview.screenshotPath,
          expiresAt: existingPreview.expiresAt
        });
        return {
          success: true,
          previewUrl: existingPreview.previewUrl,
          existing: true
        };
      }
      // Hash differs — continue to regenerate
    }
  }

  // --- Step 3: Generate slug ---
  const existingSlugs = registry.getAllEntries().map(e => e.slug);
  let slug;
  try {
    slug = generateSlug(lead.businessName, lead.city || '', existingSlugs);
  } catch (err) {
    sendEvent('error', { step: 'slug_failed', message: err.message });
    return { success: false, error: err.message };
  }

  // Determine niche (for build script and assets)
  const niche = resolveNiche(lead.category);
  const previewUrl = `https://preview.kaelint.ch/${slug}/de/`;

  // --- Step 4: Create registry entry ---
  const leadDataHash = computeLeadDataHash(lead);
  const entry = registry.createPreview({
    slug,
    leadId: lead.id,
    niche,
    previewUrl,
    leadDataHash
  });

  sendEvent('progress', { step: 'config_generated', message: 'Config generiert' });

  // --- Step 5: Generate config ---
  const configResult = generateConfig(lead, slug);
  if (!configResult.success) {
    registry.updateStatus(slug, 'failed', { screenshotError: configResult.error });
    sendEvent('error', { step: 'config_failed', message: configResult.error });
    return { success: false, error: configResult.error };
  }

  // --- Step 6: Write config.yaml ---
  const configDir = path.join(previewSiteRepoPath, 'previews', 'configs', slug);
  const configPath = path.join(configDir, 'config.yaml');
  try {
    fs.mkdirSync(configDir, { recursive: true });
    const configYaml = YAML.stringify(configResult.config);
    const tmpPath = configPath + '.tmp.' + Date.now();
    fs.writeFileSync(tmpPath, configYaml, 'utf-8');
    fs.renameSync(tmpPath, configPath);
  } catch (err) {
    registry.updateStatus(slug, 'failed', { screenshotError: `Config write failed: ${err.message}` });
    sendEvent('error', { step: 'config_write_failed', message: `Config konnte nicht geschrieben werden: ${err.message}` });
    return { success: false, error: `Config write failed: ${err.message}` };
  }

  // --- Step 7: Spawn build ---
  sendEvent('progress', { step: 'build_started', message: 'Build gestartet...' });
  try {
    const buildCmd = `node scripts/build-preview.mjs --config "${configPath}" --slug "${slug}" --niche "${niche}"`;
    execSync(buildCmd, {
      cwd: previewSiteRepoPath,
      timeout: 90000, // 90s (60s build + buffer)
      stdio: ['pipe', 'pipe', 'pipe'],
      env: { ...process.env, NODE_ENV: 'production' }
    });
  } catch (err) {
    const errorMsg = err.stderr ? err.stderr.toString().slice(0, 200) : err.message;
    registry.updateStatus(slug, 'failed');
    sendEvent('error', { step: 'build_failed', message: `Build fehlgeschlagen: ${errorMsg}` });
    return { success: false, error: `Build failed: ${errorMsg}` };
  }

  // Update registry to "built"
  registry.updateStatus(slug, 'built');
  sendEvent('progress', { step: 'build_complete', message: 'Build abgeschlossen' });

  // --- Step 8: Capture screenshot (non-blocking on failure) ---
  let screenshotPath = null;
  let screenshotError = null;
  try {
    const screenshotResult = await captureScreenshot(slug, previewSiteRepoPath);
    if (screenshotResult.success) {
      screenshotPath = screenshotResult.screenshotPath;
      sendEvent('progress', { step: 'screenshot_captured', message: 'Screenshot erstellt' });
    } else {
      screenshotError = screenshotResult.error;
      console.warn(`Screenshot failed for ${slug}: ${screenshotError}`);
      // Continue — screenshot failure is non-blocking
    }
  } catch (err) {
    screenshotError = err.message;
    console.warn(`Screenshot exception for ${slug}: ${err.message}`);
    // Continue — screenshot failure is non-blocking
  }

  // --- Step 9: Copy screenshot to dist (if captured) ---
  if (screenshotPath) {
    try {
      const distScreenshotDir = path.join(previewSiteRepoPath, 'dist', 'previews', slug);
      fs.mkdirSync(distScreenshotDir, { recursive: true });
      const distScreenshotPath = path.join(distScreenshotDir, 'screenshot.png');
      fs.copyFileSync(screenshotPath, distScreenshotPath);
    } catch (err) {
      console.warn(`Failed to copy screenshot to dist: ${err.message}`);
      // Non-blocking — continue with deploy
    }
  }

  // --- Step 10: Write previews-manifest.json ---
  try {
    writePreviewsManifest(previewSiteRepoPath, slug, niche, entry.createdAt, entry.expiresAt);
  } catch (err) {
    console.warn(`Failed to write previews-manifest.json: ${err.message}`);
    // Non-blocking but log the error
  }

  // --- Step 11: Spawn deploy ---
  sendEvent('progress', { step: 'deploy_started', message: 'Deploy gestartet...' });
  try {
    const deployCmd = 'node scripts/deploy-previews.mjs';
    execSync(deployCmd, {
      cwd: previewSiteRepoPath,
      timeout: 120000, // 2 minutes for deploy
      stdio: ['pipe', 'pipe', 'pipe'],
      env: { ...process.env, NODE_TLS_REJECT_UNAUTHORIZED: '0' }
    });
  } catch (err) {
    const errorMsg = err.stderr ? err.stderr.toString().slice(0, 200) : err.message;
    // Deploy failure → status stays "built" (preserve artifacts)
    registry.updateStatus(slug, 'built', { screenshotError });
    sendEvent('error', { step: 'deploy_failed', message: `Deploy fehlgeschlagen: ${errorMsg}` });
    return { success: false, error: `Deploy failed: ${errorMsg}` };
  }

  // --- Step 12: Update registry + lead record ---
  registry.updateStatus(slug, 'deployed', {
    screenshotPath,
    screenshotError,
    previewUrl
  });

  // Update lead record in leads.json
  try {
    const leadRecord = dataStore.get('leads', lead.id);
    if (leadRecord) {
      leadRecord.previewUrl = previewUrl;
      leadRecord.previewScreenshotPath = screenshotPath;
      leadRecord.previewGeneratedAt = new Date().toISOString();
      dataStore.save('leads', leadRecord);
    }
  } catch (err) {
    console.warn(`Failed to update lead record: ${err.message}`);
    // Non-blocking — preview is deployed successfully regardless
  }

  // --- Step 13: Send SSE complete ---
  sendEvent('complete', {
    step: 'deploy_complete',
    message: 'Preview erfolgreich deployed',
    previewUrl,
    screenshotPath,
    expiresAt: entry.expiresAt
  });

  return { success: true, previewUrl };
}

/**
 * Resolve the niche key from a category string.
 * Falls back to 'generic' if unrecognized.
 */
function resolveNiche(category) {
  const recognized = [
    'coiffeur', 'restaurant', 'therapie', 'handwerk',
    'einzelhandel', 'fitness', 'kreativ', 'arztpraxis'
  ];
  const normalized = (category || '').toLowerCase().trim();
  return recognized.includes(normalized) ? normalized : 'generic';
}

/**
 * Write or update the previews-manifest.json file.
 * Adds/updates the current preview entry and preserves existing active entries.
 * Uses atomic write pattern.
 */
function writePreviewsManifest(previewSiteRepoPath, slug, niche, createdAt, expiresAt) {
  const manifestPath = path.join(previewSiteRepoPath, 'previews', 'previews-manifest.json');
  const manifestDir = path.dirname(manifestPath);

  // Ensure directory exists
  fs.mkdirSync(manifestDir, { recursive: true });

  // Read existing manifest or create new
  let manifest = { previews: [], lastUpdated: null };
  if (fs.existsSync(manifestPath)) {
    try {
      const raw = fs.readFileSync(manifestPath, 'utf-8');
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.previews)) {
        manifest = parsed;
      }
    } catch (err) {
      // If corrupt, start fresh
      console.warn('previews-manifest.json corrupt, recreating:', err.message);
    }
  }

  // Remove expired entries from manifest
  const now = new Date();
  manifest.previews = manifest.previews.filter(p => new Date(p.expiresAt) > now);

  // Add/update current preview entry
  const existingIdx = manifest.previews.findIndex(p => p.slug === slug);
  const entry = {
    slug,
    niche,
    createdAt,
    expiresAt,
    status: 'deployed'
  };

  if (existingIdx >= 0) {
    manifest.previews[existingIdx] = entry;
  } else {
    manifest.previews.push(entry);
  }

  manifest.lastUpdated = now.toISOString();

  // Atomic write
  const tmpPath = manifestPath + '.tmp.' + Date.now();
  fs.writeFileSync(tmpPath, JSON.stringify(manifest, null, 2), 'utf-8');
  fs.renameSync(tmpPath, manifestPath);
}

module.exports = {
  generatePreview,
  resolveNiche,
  writePreviewsManifest
};
