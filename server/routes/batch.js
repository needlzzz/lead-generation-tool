const express = require('express');
const router = express.Router();
const batchPreviewGenerator = require('../lib/batchPreviewGenerator');
const batchSender = require('../lib/batchSender');
const quotaTracker = require('../lib/quotaTracker');
const dataStore = require('../lib/dataStore');

// ---------------------------------------------------------------------------
// Helper: load settings with batch defaults
// ---------------------------------------------------------------------------
function getSettings() {
  const settings = dataStore.readSingleton('settings') || {};
  // Ensure batch and smtp.brevo are always present
  settings.batch = settings.batch || {};
  settings.smtp = settings.smtp || {};
  settings.smtp.brevo = settings.smtp.brevo || {};
  return settings;
}

// ---------------------------------------------------------------------------
// POST /generate-previews (SSE stream)
// ---------------------------------------------------------------------------
router.post('/generate-previews', async (req, res) => {
  const { leadIds, resume, category, limit } = req.body || {};
  const settings = getSettings();

  // SSE event sender
  function sendEvent(eventType, data) {
    try {
      res.write(`event: ${eventType}\ndata: ${JSON.stringify(data)}\n\n`);
    } catch (e) {
      // Client disconnected — ignore
    }
  }

  // Resume mode
  if (resume === true) {
    // Set SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    try {
      await batchPreviewGenerator.resume(settings, sendEvent);
    } catch (err) {
      sendEvent('error', { message: err.message });
    }
    res.end();
    return;
  }

  // Reject if already running
  if (batchPreviewGenerator.isRunning()) {
    return res.status(409).json({ error: 'A batch preview generation is already in progress' });
  }

  let validIds = [];
  let skippedIds = [];

  if (leadIds && Array.isArray(leadIds)) {
    // Validate leadIds array (max 1000)
    if (leadIds.length > 1000) {
      return res.status(400).json({ error: 'Maximum 1000 lead IDs allowed' });
    }

    // Check each ID exists
    for (const id of leadIds) {
      const lead = dataStore.get('leads', id);
      if (!lead) {
        skippedIds.push({ id, reason: 'not_found' });
      } else {
        validIds.push(id);
      }
    }
  } else {
    // Auto-select eligible leads: have websiteAnalyzedAt set, no valid existing preview
    const maxLeads = Math.min(limit || 1000, 1000);
    const allLeads = dataStore.getAll('leads');
    for (const lead of allLeads) {
      if (validIds.length >= maxLeads) break;
      if (lead.websiteAnalyzedAt && !lead.previewUrl) {
        if (category && lead.category !== category) continue;
        // Include leads that don't already have a valid preview
        // The batchPreviewGenerator will handle skip logic for existing valid previews
        validIds.push(lead.id);
      }
    }
  }

  if (validIds.length === 0) {
    return res.status(200).json({ status: 'complete', count: 0, skippedIds });
  }

  // Set SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  // Send initial skipped IDs if any
  if (skippedIds.length > 0) {
    sendEvent('skipped', { skippedIds });
  }

  try {
    await batchPreviewGenerator.start(validIds, settings, sendEvent);
  } catch (err) {
    sendEvent('error', { message: err.message });
  }

  res.end();
});

// ---------------------------------------------------------------------------
// GET /preview-stats — pre-flight counts for batch preview generation
// ---------------------------------------------------------------------------
router.get('/preview-stats', (req, res) => {
  const category = req.query.category || '';
  const allLeads = dataStore.getAll('leads');

  let eligible = allLeads.filter(l => l.websiteAnalyzedAt);
  if (category) {
    eligible = eligible.filter(l => l.category === category);
  }

  const withPreview = eligible.filter(l => l.previewUrl);
  const withoutPreview = eligible.filter(l => !l.previewUrl);

  res.json({
    total: eligible.length,
    withPreview: withPreview.length,
    withoutPreview: withoutPreview.length,
    category: category || 'all'
  });
});

// ---------------------------------------------------------------------------
// GET /preview-status
// ---------------------------------------------------------------------------
router.get('/preview-status', (req, res) => {
  const status = batchPreviewGenerator.getStatus();
  if (!status) {
    return res.json({ status: 'idle', queue: [], completed: [], failed: [] });
  }
  res.json(status);
});

// ---------------------------------------------------------------------------
// POST /send-emails
// ---------------------------------------------------------------------------
router.post('/send-emails', (req, res) => {
  const { leadIds, emailType, resume: resumeFlag } = req.body || {};
  const settings = getSettings();
  const brevo = settings.smtp.brevo;

  // Validate Brevo SMTP configuration
  if (!brevo.host || !brevo.username || !brevo.password || !brevo.fromAddress) {
    const missing = [];
    if (!brevo.host) missing.push('smtp.brevo.host');
    if (!brevo.username) missing.push('smtp.brevo.username');
    if (!brevo.password) missing.push('smtp.brevo.password');
    if (!brevo.fromAddress) missing.push('smtp.brevo.fromAddress');
    return res.status(400).json({
      error: 'Brevo SMTP configuration incomplete',
      missingFields: missing
    });
  }

  // Validate templates exist
  const templates = settings.templates;
  if (!templates || !templates.email1 || !templates.email2) {
    return res.status(400).json({ error: 'Email templates not configured in settings' });
  }

  // Resume mode
  if (resumeFlag === true) {
    try {
      batchSender.resume(settings);
      return res.status(202).json({ status: 'sending', resumed: true });
    } catch (err) {
      return res.status(400).json({ error: err.message });
    }
  }

  // Reject if already running
  if (batchSender.isRunning()) {
    return res.status(409).json({ error: 'A batch send is already in progress' });
  }

  // Build queue
  let queue = [];
  const allLeads = dataStore.getAll('leads');

  if (leadIds && Array.isArray(leadIds) && emailType) {
    // Build queue from explicit lead IDs with specified email type
    for (const id of leadIds) {
      const lead = dataStore.get('leads', id);
      if (lead && lead.email && !lead.emailBounced) {
        queue.push({ leadId: id, emailType });
      }
    }
  } else if (emailType === 'auto' || (!leadIds && !emailType)) {
    // Auto mode: build queue using priority order
    queue = batchSender.buildAutoQueue(allLeads);
  } else if (emailType && !leadIds) {
    // Specific email type, no lead IDs: use typed queue builder
    queue = batchSender.buildTypedQueue(allLeads, emailType);
  }

  // Empty queue
  if (queue.length === 0) {
    return res.status(200).json({ status: 'complete', count: 0 });
  }

  // Start background processing
  batchSender.start(queue, settings);
  return res.status(202).json({ status: 'sending', totalQueued: queue.length });
});

// ---------------------------------------------------------------------------
// GET /send-status
// ---------------------------------------------------------------------------
router.get('/send-status', (req, res) => {
  const settings = getSettings();
  const status = batchSender.getStatus(settings);

  // Determine send window status
  let sendWindowStatus = 'closed';
  try {
    const { sendWindowStart, sendWindowEnd, sendWindowTimezone } = settings.batch;
    if (sendWindowStart && sendWindowEnd && sendWindowTimezone) {
      const formatter = new Intl.DateTimeFormat('en-GB', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
        timeZone: sendWindowTimezone
      });
      const currentTime = formatter.format(new Date());
      if (currentTime >= sendWindowStart && currentTime < sendWindowEnd) {
        sendWindowStatus = 'open';
      }
    }
  } catch (e) {
    // If timezone is invalid, default to closed
  }

  // Build pause reason + estimated resume time
  let pauseReason = undefined;
  let estimatedResumeTime = undefined;

  if (status.status === 'paused_quota') {
    pauseReason = 'quota_reached';
    // Next UTC midnight
    const tomorrow = new Date();
    tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
    tomorrow.setUTCHours(0, 0, 0, 0);
    estimatedResumeTime = tomorrow.toISOString();
  } else if (status.status === 'paused_window') {
    pauseReason = 'outside_window';
    // Estimate next window start in configured timezone
    try {
      const { sendWindowStart, sendWindowTimezone } = settings.batch;
      // Simple estimation: next occurrence of sendWindowStart
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      // Format as approximate ISO (not exact, but useful)
      const [hours, minutes] = sendWindowStart.split(':').map(Number);
      tomorrow.setHours(hours, minutes, 0, 0);
      estimatedResumeTime = tomorrow.toISOString();
    } catch (e) {
      // Skip if timezone handling fails
    }
  }

  // Build failed leads (max 100 most recent, most recent first)
  const failedLeads = (status.failed || [])
    .slice(-100)
    .reverse()
    .map(f => ({
      leadId: f.leadId,
      businessName: f.businessName || '',
      error: f.error || ''
    }));

  res.json({
    status: status.status,
    emailType: status.emailType,
    totalQueued: status.queueSize || 0,
    completed: status.completedCount || 0,
    failed: status.failedCount || 0,
    dailyQuotaUsed: status.quota ? status.quota.count : 0,
    dailyQuotaLimit: status.quota ? status.quota.maxPerDay : (settings.batch.maxEmailsPerDay || 250),
    sendWindowStatus,
    pauseReason,
    estimatedResumeTime,
    failedLeads,
    startedAt: status.startedAt || null,
    lastUpdatedAt: status.lastUpdatedAt || null
  });
});

// ---------------------------------------------------------------------------
// POST /send-stop
// ---------------------------------------------------------------------------
router.post('/send-stop', (req, res) => {
  batchSender.stop();

  const settings = getSettings();
  const status = batchSender.getStatus(settings);

  res.json({
    status: status.status,
    totalQueued: status.queueSize || 0,
    completed: status.completedCount || 0,
    failed: status.failedCount || 0,
    lastUpdatedAt: status.lastUpdatedAt || null
  });
});

module.exports = router;
