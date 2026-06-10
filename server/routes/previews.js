const express = require('express');
const dataStore = require('../lib/dataStore');
const registry = require('../lib/previewRegistry');
const { generatePreview } = require('../lib/previewGenerator');

const router = express.Router();

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

module.exports = router;
