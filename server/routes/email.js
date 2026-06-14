const express = require('express');
const dataStore = require('../lib/dataStore');
const { renderTemplate, sendEmail } = require('../lib/emailService');

const router = express.Router();

// Default templates (same as in settings route)
const DEFAULT_TEMPLATES = {
  email1: {
    subject: 'Idee für [Business Name]',
    body: `Sali [Business Name],

kurzer Hinweis: Bei eurer Website sind mir ein paar Sachen aufgefallen — unter anderem [Website-Probleme-Kurz]. Das sind Punkte, die euch wahrscheinlich Anfragen kosten.

Ich hab mal skizziert, wie das moderner aussehen könnte:
👉 [Preview-Link]

Falls euch das interessiert, meldet euch gern — ich erklär euch in 10 Minuten, was dahintersteckt.

[Dein Name]
Kaelint Webdesign`
  },
  email2: {
    subject: 'Re: Idee für [Business Name]',
    body: `Sali [Business Name],

wollte nur sichergehen, dass meine Nachricht nicht untergegangen ist. Die Vorschau ist noch online:
👉 [Preview-Link]

Kein Druck — nur falls es doch passt.

[Dein Name]
Kaelint Webdesign`
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

module.exports = router;
