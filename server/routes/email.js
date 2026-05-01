const express = require('express');
const dataStore = require('../lib/dataStore');
const { renderTemplate, sendEmail } = require('../lib/emailService');

const router = express.Router();

// POST /api/email/preview
router.post('/preview', (req, res) => {
  const { leadId, emailType } = req.body;
  if (!leadId || !emailType) {
    return res.status(400).json({ error: 'leadId and emailType are required' });
  }
  if (!['email1', 'email2', 'email3'].includes(emailType)) {
    return res.status(400).json({ error: 'emailType must be email1, email2, or email3' });
  }

  const lead = dataStore.get('leads', leadId);
  if (!lead) return res.status(404).json({ error: 'Lead not found' });
  if (!lead.email) return res.status(400).json({ error: 'Lead has no email address' });

  // Find category by name
  const categories = dataStore.getAll('categories');
  const category = categories.find(c => c.name === lead.category);
  if (!category) return res.status(404).json({ error: `Category "${lead.category}" not found` });

  const template = category.templates[emailType];
  if (!template) return res.status(404).json({ error: `Template ${emailType} not found for category` });

  const settings = dataStore.readSingleton('settings') || {};
  const rendered = renderTemplate(template, lead, settings);

  res.json({
    subject: rendered.subject,
    body: rendered.body,
    to: lead.email
  });
});

// POST /api/email/send
router.post('/send', async (req, res) => {
  const { leadId, emailType } = req.body;
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

  const categories = dataStore.getAll('categories');
  const category = categories.find(c => c.name === lead.category);
  if (!category) return res.status(404).json({ error: `Category "${lead.category}" not found` });

  const template = category.templates[emailType];
  if (!template) return res.status(404).json({ error: `Template ${emailType} not found` });

  const rendered = renderTemplate(template, lead, settings);

  try {
    await sendEmail(settings.smtp, settings.smtp.fromAddress, lead.email, rendered.subject, rendered.body);

    // Execute the corresponding pipeline transition
    const now = new Date().toISOString();
    const today = now.split('T')[0];

    if (emailType === 'email1') {
      lead.status = 'Reached Out';
      lead.dateEmail1Sent = today;
      lead.activityLog.push({ date: now, action: 'Email 1 sent', details: `To: ${lead.email}` });
    } else if (emailType === 'email2') {
      lead.dateFollowUp1Sent = today;
      lead.activityLog.push({ date: now, action: 'Follow-Up 1 sent', details: `To: ${lead.email}` });
    } else if (emailType === 'email3') {
      lead.dateFollowUp2Sent = today;
      lead.calendlySent = true;
      lead.activityLog.push({ date: now, action: 'Follow-Up 2 sent', details: `To: ${lead.email}, Calendly link included` });
    }

    dataStore.save('leads', lead);
    res.json({ success: true, lead });
  } catch (err) {
    res.status(500).json({ error: `Failed to send email: ${err.message}` });
  }
});

module.exports = router;
