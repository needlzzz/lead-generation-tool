const express = require('express');
const dataStore = require('../lib/dataStore');
const { renderTemplate, sendEmail, resolveTemplatesForLead } = require('../lib/emailService');
const personalQuota = require('../lib/personalQuotaTracker');
const quotaTracker = require('../lib/quotaTracker');

const router = express.Router();

/**
 * Resolve the email templates for a lead, preferring its category's own
 * templates (per-category campaigns) over the global settings template.
 */
function getTemplatesForLead(settings, lead) {
  const category = lead && lead.category
    ? dataStore.getAll('categories').find((c) => c.name === lead.category)
    : null;
  return resolveTemplatesForLead(settings, category || null);
}

/**
 * Resolve templates for the Test tab. When an explicit campaign category name is
 * given (e.g. "Fahrschule"), its category-specific templates win regardless of
 * the rendered lead's own category; otherwise fall back to the lead's category
 * (or the global template).
 */
function getTemplatesForTest(settings, lead, categoryName) {
  if (categoryName) {
    const category = dataStore.getAll('categories').find((c) => c.name === categoryName);
    return resolveTemplatesForLead(settings, category || null);
  }
  return getTemplatesForLead(settings, lead);
}

/** True when the personal SMTP server is fully configured. */
function isPersonalConfigured(settings) {
  const s = (settings && settings.smtp) || {};
  return !!(s.host && s.username && s.password && s.fromAddress);
}

/** True when the Brevo SMTP relay is fully configured. */
function isBrevoConfigured(settings) {
  const b = (settings && settings.smtp && settings.smtp.brevo) || {};
  return !!(b.host && b.username && b.password && b.fromAddress);
}

/** Ensure batch defaults exist so the Brevo quota tracker never throws. */
function ensureBatchDefaults(settings) {
  settings.batch = settings.batch || {};
  if (settings.batch.maxEmailsPerDay == null) settings.batch.maxEmailsPerDay = 250;
  return settings;
}

// GET /api/email/providers — which SMTP senders are configured, with quota.
// Drives the sender picker in the bulk-send flow (only prompt when >1).
router.get('/providers', (req, res) => {
  const settings = dataStore.readSingleton('settings') || {};
  const providers = [];

  if (isPersonalConfigured(settings)) {
    const maxPersonal = settings.smtp.maxPersonalEmailsPerDay || 20;
    const q = personalQuota.getCount(maxPersonal);
    providers.push({
      id: 'personal',
      label: 'Personal SMTP',
      fromAddress: settings.smtp.fromAddress,
      count: q.count,
      remaining: q.remaining,
      maxPerDay: q.maxPerDay
    });
  }

  if (isBrevoConfigured(settings)) {
    ensureBatchDefaults(settings);
    const q = quotaTracker.getCount(settings);
    providers.push({
      id: 'brevo',
      label: 'Brevo',
      fromAddress: settings.smtp.brevo.fromAddress,
      count: q.count,
      remaining: q.remaining,
      maxPerDay: settings.batch.maxEmailsPerDay
    });
  }

  res.json({ providers });
});

// POST /api/email/preview
router.post('/preview', (req, res) => {
  const { leadId, emailType } = req.body;
  if (!leadId || !emailType) {
    return res.status(400).json({ error: 'leadId and emailType are required' });
  }
  if (!['email1', 'email2'].includes(emailType)) {
    return res.status(400).json({ error: 'emailType must be email1 or email2' });
  }

  const lead = dataStore.get('leads', leadId);
  if (!lead) return res.status(404).json({ error: 'Lead not found' });
  if (!lead.email) return res.status(400).json({ error: 'Lead has no email address' });

  const settings = dataStore.readSingleton('settings') || {};
  const templates = getTemplatesForLead(settings, lead);
  if (!templates[emailType]) {
    return res.status(404).json({ error: `Template ${emailType} not configured in settings` });
  }

  const template = templates[emailType];
  const rendered = renderTemplate(template, lead, settings);

  res.json({
    subject: rendered.subject,
    body: rendered.body,
    to: lead.email
  });
});

// POST /api/email/send
router.post('/send', async (req, res) => {
  const { leadId, emailType, customBody, customSubject, provider } = req.body;
  if (!leadId || !emailType) {
    return res.status(400).json({ error: 'leadId and emailType are required' });
  }

  const settings = dataStore.readSingleton('settings');
  if (!settings || !settings.smtp) {
    return res.status(400).json({ error: 'SMTP not configured. Please configure in Settings.' });
  }

  // Select the transport provider (default: personal SMTP). Each provider
  // tracks its own daily quota — personal SMTP vs the Brevo batch quota.
  const useBrevo = provider === 'brevo';
  let smtpConfig;
  let fromAddress;

  if (useBrevo) {
    if (!isBrevoConfigured(settings)) {
      return res.status(400).json({ error: 'Brevo SMTP not configured. Please configure in Settings.' });
    }
    ensureBatchDefaults(settings);
    if (!quotaTracker.canSend(settings)) {
      const { count } = quotaTracker.getCount(settings);
      return res.status(429).json({
        error: `Daily Brevo send limit reached (${count}/${settings.batch.maxEmailsPerDay}). Try again tomorrow.`
      });
    }
    smtpConfig = settings.smtp.brevo;
    fromAddress = settings.smtp.brevo.fromAddress;
  } else {
    if (!settings.smtp.host) {
      return res.status(400).json({ error: 'SMTP not configured. Please configure in Settings.' });
    }
    const maxPersonal = settings.smtp.maxPersonalEmailsPerDay || 20;
    if (!personalQuota.canSend(maxPersonal)) {
      const { count } = personalQuota.getCount(maxPersonal);
      return res.status(429).json({
        error: `Daily personal email limit reached (${count}/${maxPersonal}). Try again tomorrow or use Batch Send via Brevo.`
      });
    }
    smtpConfig = settings.smtp;
    fromAddress = settings.smtp.fromAddress;
  }

  const lead = dataStore.get('leads', leadId);
  if (!lead) return res.status(404).json({ error: 'Lead not found' });
  if (!lead.email) return res.status(400).json({ error: 'Lead has no email address' });

  const templates = getTemplatesForLead(settings, lead);
  if (!templates[emailType]) {
    return res.status(404).json({ error: `Template ${emailType} not configured in settings` });
  }

  const template = templates[emailType];
  const rendered = renderTemplate(template, lead, settings);

  // Use custom body/subject if provided (from user edits in the modal)
  const finalSubject = customSubject || rendered.subject;
  const finalBody = customBody || rendered.body;

  try {
    await sendEmail(smtpConfig, fromAddress, lead.email, finalSubject, finalBody);

    // Increment the matching daily quota counter for the chosen provider
    if (useBrevo) {
      try { quotaTracker.increment(settings); } catch (_) { /* quota write failure is non-fatal */ }
    } else {
      personalQuota.increment();
    }

    // Execute the corresponding pipeline transition
    const now = new Date().toISOString();
    const today = now.split('T')[0];

    if (emailType === 'email1') {
      lead.status = 'Reached Out';
      lead.dateEmail1Sent = today;
      lead.activityLog = lead.activityLog || [];
      lead.activityLog.push({ date: now, action: 'Email 1 sent', details: `To: ${lead.email}` });
    } else if (emailType === 'email2') {
      lead.dateFollowUp1Sent = today;
      lead.activityLog = lead.activityLog || [];
      lead.activityLog.push({ date: now, action: 'Follow-Up sent', details: `To: ${lead.email}` });
    }

    dataStore.save('leads', lead);
    res.json({ success: true, lead });
  } catch (err) {
    res.status(500).json({ error: `Failed to send email: ${err.message}` });
  }
});

// GET /api/email/quota — personal SMTP daily quota status
router.get('/quota', (req, res) => {
  const settings = dataStore.readSingleton('settings') || {};
  const maxPersonal = (settings.smtp && settings.smtp.maxPersonalEmailsPerDay) || 20;
  const quota = personalQuota.getCount(maxPersonal);
  res.json(quota);
});

/**
 * Sample lead used to render templates in the Test tab when the user does not
 * pick a real lead. Populated with realistic Swiss data so every placeholder
 * (issues, preview link, score, expiry) renders something meaningful.
 */
function buildSampleLead() {
  return {
    id: 'sample',
    businessName: 'Muster Garage GmbH',
    contactPerson: 'Hans Muster',
    email: 'kontakt@muster-garage.ch',
    category: '',
    websiteUrl: 'http://muster-garage.ch',
    websiteScore: 42,
    websiteIssues: [
      { id: 'no-ssl', label: 'Keine SSL-Verschlüsselung' },
      { id: 'no-viewport', label: 'Nicht für Handy optimiert' },
      { id: 'slow-load', label: 'Langsame Ladezeit' },
      { id: 'no-cta', label: 'Kein klarer Handlungsaufruf' },
      { id: 'outdated-copyright', label: 'Veraltetes Copyright-Jahr' }
    ],
    previewUrl: 'https://preview.kaelint.ch/muster-garage/',
    previewExpiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
  };
}

// POST /api/email/test-preview — render a template with a real or sample lead.
router.post('/test-preview', (req, res) => {
  const { emailType, leadId, categoryName } = req.body;
  if (!['email1', 'email2'].includes(emailType)) {
    return res.status(400).json({ error: 'emailType must be email1 or email2' });
  }

  const settings = dataStore.readSingleton('settings') || {};
  let lead = buildSampleLead();
  if (leadId) {
    const found = dataStore.get('leads', leadId);
    if (found) lead = found;
  }

  const templates = getTemplatesForTest(settings, lead, categoryName);
  const template = templates[emailType];
  if (!template) {
    return res.status(404).json({ error: `Template ${emailType} not configured` });
  }

  const rendered = renderTemplate(template, lead, settings);
  res.json({ subject: rendered.subject, body: rendered.body });
});

// POST /api/email/test-send — send a test email to a chosen recipient.
// Does NOT touch the pipeline or consume any daily quota (it is a test).
router.post('/test-send', async (req, res) => {
  const { to, emailType, provider, customSubject, customBody, leadId, categoryName } = req.body;
  if (!to) {
    return res.status(400).json({ error: 'Recipient address is required' });
  }
  if (!['email1', 'email2'].includes(emailType)) {
    return res.status(400).json({ error: 'emailType must be email1 or email2' });
  }

  const settings = dataStore.readSingleton('settings');
  if (!settings || !settings.smtp) {
    return res.status(400).json({ error: 'SMTP not configured. Please configure in Settings.' });
  }

  // Select the transport provider (default: personal SMTP)
  const useBrevo = provider === 'brevo';
  let smtpConfig;
  let fromAddress;
  if (useBrevo) {
    if (!isBrevoConfigured(settings)) {
      return res.status(400).json({ error: 'Brevo SMTP not configured. Please configure in Settings.' });
    }
    smtpConfig = settings.smtp.brevo;
    fromAddress = settings.smtp.brevo.fromAddress;
  } else {
    if (!settings.smtp.host) {
      return res.status(400).json({ error: 'Personal SMTP not configured. Please configure in Settings.' });
    }
    smtpConfig = settings.smtp;
    fromAddress = settings.smtp.fromAddress;
  }

  // Resolve subject/body: prefer the user's edited preview, else render fresh.
  let subject = customSubject;
  let body = customBody;
  if (!subject || !body) {
    let lead = buildSampleLead();
    if (leadId) {
      const found = dataStore.get('leads', leadId);
      if (found) lead = found;
    }
    const templates = getTemplatesForTest(settings, lead, categoryName);
    const template = templates[emailType];
    if (!template) {
      return res.status(404).json({ error: `Template ${emailType} not configured` });
    }
    const rendered = renderTemplate(template, lead, settings);
    subject = subject || rendered.subject;
    body = body || rendered.body;
  }

  const finalSubject = `[TEST] ${subject}`;

  try {
    await sendEmail(smtpConfig, fromAddress, to, finalSubject, body);
    res.json({ success: true, message: `Test email sent to ${to} via ${useBrevo ? 'Brevo' : 'Personal SMTP'}` });
  } catch (err) {
    res.status(500).json({ success: false, error: `Send failed: ${err.message}` });
  }
});

module.exports = router;
