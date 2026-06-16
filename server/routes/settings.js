const express = require('express');
const dataStore = require('../lib/dataStore');
const { testConnection, sendEmail } = require('../lib/emailService');

const router = express.Router();

/**
 * Validate batch settings fields that are explicitly provided in the request.
 * Only validates fields present in the `batch` object (partial updates are allowed).
 * @param {object} batch - The batch settings object from the request body
 * @returns {string[]} Array of error messages (empty if valid)
 */
function validateBatchSettings(batch) {
  const errors = [];

  if (batch.previewConcurrency !== undefined) {
    if (!Number.isInteger(batch.previewConcurrency) || batch.previewConcurrency < 1 || batch.previewConcurrency > 10) {
      errors.push('previewConcurrency must be an integer between 1 and 10');
    }
  }

  if (batch.maxEmailsPerDay !== undefined) {
    if (!Number.isInteger(batch.maxEmailsPerDay) || batch.maxEmailsPerDay < 1 || batch.maxEmailsPerDay > 1000) {
      errors.push('maxEmailsPerDay must be an integer between 1 and 1000');
    }
  }

  if (batch.sendDelayMin !== undefined) {
    if (!Number.isInteger(batch.sendDelayMin) || batch.sendDelayMin < 1 || batch.sendDelayMin > 3600) {
      errors.push('sendDelayMin must be an integer between 1 and 3600');
    }
  }

  if (batch.sendDelayMax !== undefined) {
    if (!Number.isInteger(batch.sendDelayMax) || batch.sendDelayMax < 1 || batch.sendDelayMax > 3600) {
      errors.push('sendDelayMax must be an integer between 1 and 3600');
    }
  }

  // Cross-field validation: sendDelayMin ≤ sendDelayMax
  // Use provided values or fall back to existing/default for comparison
  const delayMin = batch.sendDelayMin !== undefined ? batch.sendDelayMin : null;
  const delayMax = batch.sendDelayMax !== undefined ? batch.sendDelayMax : null;
  if (delayMin !== null && delayMax !== null && Number.isInteger(delayMin) && Number.isInteger(delayMax)) {
    if (delayMin > delayMax) {
      errors.push('sendDelayMin must be ≤ sendDelayMax');
    }
  }

  // Cross-field validation: sendWindowStart < sendWindowEnd
  if (batch.sendWindowStart !== undefined && batch.sendWindowEnd !== undefined) {
    if (batch.sendWindowStart >= batch.sendWindowEnd) {
      errors.push('sendWindowStart must be before sendWindowEnd');
    }
  }

  // Timezone validation via Intl.DateTimeFormat
  if (batch.sendWindowTimezone !== undefined) {
    try {
      Intl.DateTimeFormat('en', { timeZone: batch.sendWindowTimezone });
    } catch (e) {
      errors.push('sendWindowTimezone must be a valid IANA timezone');
    }
  }

  return errors;
}

const DEFAULT_TEMPLATES = {
  email1: {
    subject: 'Eure Website, [Business Name]',
    body: `Sali [Business Name],

mir ist aufgefallen, dass eure Website ein paar Schwachstellen hat — z.B. [Website-Probleme-Kurz]. Das heisst: Leute, die euch googeln, springen evtl. wieder ab, bevor sie anfragen.

Ich hab kurz skizziert, wie das besser aussehen könnte:
👉 [Preview-Link]

Schaut's euch mal an — wenn's interessiert, antwortet einfach auf diese Mail.

Marc Kaelin
kaelint.ch`
  },
  email2: {
    subject: 'Re: Eure Website, [Business Name]',
    body: `Sali [Business Name],

kurzes Follow-up — die Vorschau ist noch online:
👉 [Preview-Link]

Kein Stress, nur falls es passt.

Marc`
  }
};

const DEFAULT_SETTINGS = {
  userName: '',
  calendlyLink: '',
  previewSiteRepoPath: '/Users/tabkamac/private/dev/git/kaelint-website-business',
  templates: DEFAULT_TEMPLATES,
  smtp: {
    host: '',
    port: 587,
    username: '',
    password: '',
    fromAddress: '',
    useProxy: false,
    maxPersonalEmailsPerDay: 20,
    brevo: {
      host: 'smtp-relay.brevo.com',
      port: 587,
      username: '',
      password: '',
      fromAddress: ''
    }
  },
  batch: {
    previewConcurrency: 2,
    maxEmailsPerDay: 250,
    sendDelayMin: 60,
    sendDelayMax: 120,
    sendWindowStart: '08:00',
    sendWindowEnd: '17:00',
    sendWindowTimezone: 'Europe/Zurich'
  }
};

// GET /api/settings
router.get('/', (req, res) => {
  let settings = dataStore.readSingleton('settings');
  if (!settings) {
    settings = { ...DEFAULT_SETTINGS };
  } else {
    // Merge with defaults so new fields are always present
    const storedSmtp = settings.smtp || {};
    const storedBrevo = storedSmtp.brevo || {};
    settings = {
      ...DEFAULT_SETTINGS,
      ...settings,
      templates: {
        email1: { ...DEFAULT_TEMPLATES.email1, ...(settings.templates?.email1 || {}) },
        email2: { ...DEFAULT_TEMPLATES.email2, ...(settings.templates?.email2 || {}) }
      },
      smtp: {
        ...DEFAULT_SETTINGS.smtp,
        ...storedSmtp,
        brevo: { ...DEFAULT_SETTINGS.smtp.brevo, ...storedBrevo }
      },
      batch: { ...DEFAULT_SETTINGS.batch, ...(settings.batch || {}) }
    };
  }

  // Mask passwords in response
  const masked = JSON.parse(JSON.stringify(settings));
  if (masked.smtp && masked.smtp.password) {
    masked.smtp.password = '********';
  }
  if (masked.smtp && masked.smtp.brevo && masked.smtp.brevo.password) {
    masked.smtp.brevo.password = '********';
  }

  res.json({ settings: masked });
});

// PUT /api/settings
router.put('/', (req, res) => {
  const { userName, calendlyLink, previewSiteRepoPath, templates, smtp, batch } = req.body;

  // Validate batch settings if provided
  if (batch && typeof batch === 'object') {
    const validationErrors = validateBatchSettings(batch);
    if (validationErrors.length > 0) {
      return res.status(400).json({ error: 'Batch settings invalid', details: validationErrors });
    }
  }

  const existing = dataStore.readSingleton('settings') || { ...DEFAULT_SETTINGS };
  const existingSmtp = existing.smtp || DEFAULT_SETTINGS.smtp;
  const existingBrevo = existingSmtp.brevo || DEFAULT_SETTINGS.smtp.brevo;
  const existingBatch = existing.batch || DEFAULT_SETTINGS.batch;

  const incomingBrevo = smtp && smtp.brevo ? smtp.brevo : {};

  const existingTemplates = existing.templates || DEFAULT_TEMPLATES;

  const settings = {
    userName: userName !== undefined ? userName : existing.userName,
    calendlyLink: calendlyLink !== undefined ? calendlyLink : existing.calendlyLink,
    previewSiteRepoPath: previewSiteRepoPath !== undefined ? previewSiteRepoPath : (existing.previewSiteRepoPath || DEFAULT_SETTINGS.previewSiteRepoPath),
    templates: {
      email1: templates && templates.email1 ? { ...existingTemplates.email1, ...templates.email1 } : existingTemplates.email1,
      email2: templates && templates.email2 ? { ...existingTemplates.email2, ...templates.email2 } : existingTemplates.email2
    },
    smtp: {
      host: smtp && smtp.host !== undefined ? smtp.host : existingSmtp.host,
      port: smtp && smtp.port !== undefined ? smtp.port : existingSmtp.port,
      username: smtp && smtp.username !== undefined ? smtp.username : existingSmtp.username,
      password: smtp && smtp.password !== undefined && smtp.password !== '********'
        ? smtp.password
        : existingSmtp.password,
      fromAddress: smtp && smtp.fromAddress !== undefined ? smtp.fromAddress : existingSmtp.fromAddress,
      useProxy: smtp && smtp.useProxy !== undefined ? smtp.useProxy : (existingSmtp.useProxy || false),
      maxPersonalEmailsPerDay: smtp && smtp.maxPersonalEmailsPerDay !== undefined ? smtp.maxPersonalEmailsPerDay : (existingSmtp.maxPersonalEmailsPerDay || 20),
      brevo: {
        host: incomingBrevo.host !== undefined ? incomingBrevo.host : existingBrevo.host,
        port: incomingBrevo.port !== undefined ? incomingBrevo.port : existingBrevo.port,
        username: incomingBrevo.username !== undefined ? incomingBrevo.username : existingBrevo.username,
        password: incomingBrevo.password !== undefined && incomingBrevo.password !== '********'
          ? incomingBrevo.password
          : existingBrevo.password,
        fromAddress: incomingBrevo.fromAddress !== undefined ? incomingBrevo.fromAddress : existingBrevo.fromAddress
      }
    },
    batch: {
      previewConcurrency: batch && batch.previewConcurrency !== undefined ? batch.previewConcurrency : existingBatch.previewConcurrency,
      maxEmailsPerDay: batch && batch.maxEmailsPerDay !== undefined ? batch.maxEmailsPerDay : existingBatch.maxEmailsPerDay,
      sendDelayMin: batch && batch.sendDelayMin !== undefined ? batch.sendDelayMin : existingBatch.sendDelayMin,
      sendDelayMax: batch && batch.sendDelayMax !== undefined ? batch.sendDelayMax : existingBatch.sendDelayMax,
      sendWindowStart: batch && batch.sendWindowStart !== undefined ? batch.sendWindowStart : existingBatch.sendWindowStart,
      sendWindowEnd: batch && batch.sendWindowEnd !== undefined ? batch.sendWindowEnd : existingBatch.sendWindowEnd,
      sendWindowTimezone: batch && batch.sendWindowTimezone !== undefined ? batch.sendWindowTimezone : existingBatch.sendWindowTimezone
    }
  };

  dataStore.writeSingleton('settings', settings);

  // Return masked version
  const masked = JSON.parse(JSON.stringify(settings));
  if (masked.smtp.password) {
    masked.smtp.password = '********';
  }
  if (masked.smtp.brevo && masked.smtp.brevo.password) {
    masked.smtp.brevo.password = '********';
  }

  res.json({ settings: masked });
});

// POST /api/settings/test-smtp
router.post('/test-smtp', async (req, res) => {
  const settings = dataStore.readSingleton('settings');
  if (!settings || !settings.smtp || !settings.smtp.host) {
    return res.status(400).json({ error: 'SMTP not configured' });
  }

  const { host, port, username, useProxy } = settings.smtp;

  try {
    await testConnection(settings.smtp);
    res.json({ success: true, message: `SMTP connection to ${host}:${port} successful (user: ${username})${useProxy ? ' via corporate proxy' : ''}` });
  } catch (err) {
    const detail = [
      `Host: ${host}`,
      `Port: ${port}`,
      `User: ${username || '(none)'}`,
      `Secure: ${port === 465 ? 'yes' : 'no (STARTTLS)'}`,
      useProxy ? `Proxy: http://aproxy.corproot.net:8080` : null,
      `Error: ${err.message}`
    ].filter(Boolean).join(' | ');

    if (err.code) {
      res.status(500).json({ success: false, error: `SMTP test failed [${err.code}]: ${detail}` });
    } else {
      res.status(500).json({ success: false, error: `SMTP test failed: ${detail}` });
    }
  }
});

// POST /api/settings/send-test-email
router.post('/send-test-email', async (req, res) => {
  const { to } = req.body;
  if (!to) {
    return res.status(400).json({ error: 'Recipient address is required' });
  }

  const settings = dataStore.readSingleton('settings');
  if (!settings || !settings.smtp || !settings.smtp.host) {
    return res.status(400).json({ error: 'SMTP not configured. Save your settings first.' });
  }

  const fromAddress = settings.smtp.fromAddress || settings.smtp.username;
  const subject = `Test Email from Lead Generation CRM`;
  const body = [
    `This is a test email sent from your Lead Generation CRM.`,
    ``,
    `SMTP Host: ${settings.smtp.host}:${settings.smtp.port}`,
    `From: ${fromAddress}`,
    `Proxy: ${settings.smtp.useProxy ? 'yes (corporate)' : 'no (direct)'}`,
    `Sent at: ${new Date().toLocaleString('de-CH')}`,
    ``,
    `If you received this, your email setup is working correctly.`
  ].join('\n');

  try {
    await sendEmail(settings.smtp, fromAddress, to, subject, body);
    res.json({ success: true, message: `Test email sent to ${to}` });
  } catch (err) {
    res.status(500).json({ success: false, error: `Send failed: ${err.message}` });
  }
});

module.exports = router;
module.exports.validateBatchSettings = validateBatchSettings;
