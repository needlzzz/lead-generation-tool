const express = require('express');
const dataStore = require('../lib/dataStore');
const registry = require('../lib/previewRegistry');
const { generatePreview } = require('../lib/previewGenerator');

const router = express.Router();

// GET /api/previews/list — all previews with lead info and status
router.get('/list', (req, res) => {
  try {
    const entries = registry.getAllEntries();
    const now = new Date();

    const previews = entries.map(entry => {
      const lead = dataStore.get('leads', entry.leadId);
      const isExpired = entry.expiresAt && new Date(entry.expiresAt) < now;
      const effectiveStatus = isExpired ? 'expired' : entry.status;

      return {
        slug: entry.slug,
        leadId: entry.leadId,
        businessName: lead ? lead.businessName : '(unknown)',
        category: lead ? lead.category : '',
        city: lead ? (lead.city || '') : '',
        previewUrl: entry.previewUrl || `https://preview.kaelint.ch/${entry.slug}/`,
        status: effectiveStatus,
        createdAt: entry.createdAt || null,
        expiresAt: entry.expiresAt || null,
        niche: entry.niche || ''
      };
    });

    // Sort: deployed first, then built, then expired
    const statusOrder = { deployed: 0, built: 1, expired: 2 };
    previews.sort((a, b) => (statusOrder[a.status] || 3) - (statusOrder[b.status] || 3));

    const counts = { deployed: 0, built: 0, expired: 0 };
    for (const p of previews) {
      counts[p.status] = (counts[p.status] || 0) + 1;
    }

    res.json({ previews, counts, total: previews.length });
  } catch (err) {
    res.status(500).json({ error: 'Failed to list previews' });
  }
});

// POST /api/previews/generate — SSE endpoint
router.post('/generate', async (req, res) => {
  const { leadId } = req.body;

  if (!leadId) {
    return res.status(400).json({ error: 'leadId is required' });
  }

  // Get lead from data store
  const lead = dataStore.get('leads', leadId);

  if (!lead) {
    return res.status(400).json({ error: 'Lead nicht gefunden' });
  }

  // Check websiteAnalyzedAt (Req 7.3)
  if (!lead.websiteAnalyzedAt) {
    return res.status(400).json({ error: 'Website muss zuerst analysiert werden' });
  }

  // Get settings
  const settings = dataStore.readSingleton('settings') || {};

  if (!settings.previewSiteRepoPath) {
    return res.status(400).json({ error: 'previewSiteRepoPath not configured in settings' });
  }

  // Set up SSE
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders();

  const sendEvent = (eventType, data) => {
    res.write(`event: ${eventType}\ndata: ${JSON.stringify(data)}\n\n`);
  };

  try {
    await generatePreview(lead, settings, sendEvent);
  } catch (err) {
    sendEvent('error', { step: 'unexpected_error', message: err.message });
  } finally {
    res.end();
  }
});

// GET /api/previews/:leadId — Returns preview state
router.get('/:leadId', (req, res) => {
  const { leadId } = req.params;
  const preview = registry.getByLeadId(leadId);

  if (!preview) {
    return res.status(404).json({ error: 'No preview found for this lead' });
  }

  res.json(preview);
});

// POST /api/previews/deploy — deploy all built previews to Cloudflare Pages
router.post('/deploy', async (req, res) => {
  const settings = dataStore.readSingleton('settings') || {};
  const previewSiteRepoPath = settings.previewSiteRepoPath;

  if (!previewSiteRepoPath) {
    return res.status(400).json({ error: 'previewSiteRepoPath not configured in settings' });
  }

  try {
    const { execSync } = require('child_process');
    execSync('node scripts/deploy-previews.mjs', {
      cwd: previewSiteRepoPath,
      timeout: 300000,
      stdio: ['pipe', 'pipe', 'pipe'],
      env: { ...process.env, NODE_TLS_REJECT_UNAUTHORIZED: '0' }
    });

    // Update all "built" entries to "deployed"
    const entries = registry.getAllEntries();
    for (const entry of entries) {
      if (entry.status === 'built') {
        registry.updateStatus(entry.slug, 'deployed');
      }
    }

    res.json({ success: true, message: 'Deploy complete' });
  } catch (err) {
    const errorMsg = err.stderr ? err.stderr.toString().slice(0, 500) : err.message;
    res.status(500).json({ error: `Deploy failed: ${errorMsg}` });
  }
});

module.exports = router;
