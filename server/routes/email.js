const express = require('express');
const dataStore = require('../lib/dataStore');
const { renderTemplate, sendEmail } = require('../lib/emailService');
const personalQuota = require('../lib/personalQuotaTracker');

const router = express.Router();

// Default templates (same as in settings route)
const DEFAULT_TEMPLATES = {
  email1: {
    subject: 'Idee für [Business Name]',
    body: `Sali [Business Name],

ich bin Marc Kaelin von Kaelint Webdesign und ich habe mir eure Webseite näher angeschaut. Dabei sind mir folgende Punkte aufgefallen:

[Website-Probleme]

Das sind Punkte, die bei eurer Kundschaft evtl. Verunsicherung auslösen könnten.

Ich hab mal einen Entwurf erstellt, wie eure Webseite moderner aussehen könnte:
👉 [Preview-Link]

[Preview-Disclaimer]

Falls Ihr euch für ein Re-Design interessiert, meldet euch gerne bei mir.

Marc Kaelin
Kaelint Webdesign
https://kaelint.ch`
  },
  email2: {
    subject: 'Re: Idee für [Business Name]',
    body: `Sali [Business Name],

wollte nur sichergehen, dass meine Nachricht nicht untergegangen ist. Die Vorschau ist noch online:
👉 [Preview-Link]

Kein Druck — nur falls es doch passt.

Marc Kaelin
Kaelint Webdesign
https://kaelint.ch`
  }
};

function getTemplates(settings) {
  if (settings.templates && settings.templates.email1 && settings.templates.email2) {
    return settings.templates;
  }
  return {
    email1: { ...DEFAULT_TEMPLATES.email1, ...(settings.templates?.email1 || {}) },
    email2: { ...DEFAULT_TEMPLATES.email2, ...(settings.templates?.email2 || {}) }
  };
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
  const templates = getTemplates(settings);
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

  const templates = getTemplates(settings);
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
