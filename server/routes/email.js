const express = require('express');
const dataStore = require('../lib/dataStore');
const { renderTemplate, sendEmail, resolveTemplatesForLead } = require('../lib/emailService');
const personalQuota = require('../lib/personalQuotaTracker');

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
  const { leadId, emailType, customBody, customSubject } = req.body;
  if (!leadId || !emailType) {
    return res.status(400).json({ error: 'leadId and emailType are required' });
  }

  const settings = dataStore.readSingleton('settings');
  if (!settings || !settings.smtp || !settings.smtp.host) {
    return res.status(400).json({ error: 'SMTP not configured. Please configure in Settings.' });
  }

  // Check personal daily quota
  const maxPersonal = settings.smtp.maxPersonalEmailsPerDay || 20;
  if (!personalQuota.canSend(maxPersonal)) {
    const { count } = personalQuota.getCount(maxPersonal);
    return res.status(429).json({
      error: `Daily personal email limit reached (${count}/${maxPersonal}). Try again tomorrow or use Batch Send via Brevo.`
    });
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
    await sendEmail(settings.smtp, settings.smtp.fromAddress, lead.email, finalSubject, finalBody);

    // Increment personal quota counter
    personalQuota.increment();

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

module.exports = router;
