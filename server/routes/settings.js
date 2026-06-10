const express = require('express');
const dataStore = require('../lib/dataStore');
const { testConnection, sendEmail } = require('../lib/emailService');

const router = express.Router();

const DEFAULT_SETTINGS = {
  userName: '',
  calendlyLink: '',
  previewSiteRepoPath: '/Users/tabkamac/private/dev/git/kaelint-website-business',
  smtp: {
    host: '',
    port: 587,
    username: '',
    password: '',
    fromAddress: '',
    useProxy: false
  }
};

// GET /api/settings
router.get('/', (req, res) => {
  let settings = dataStore.readSingleton('settings');
  if (!settings) {
    settings = { ...DEFAULT_SETTINGS };
  } else {
    // Merge with defaults so new fields are always present
    settings = { ...DEFAULT_SETTINGS, ...settings, smtp: { ...DEFAULT_SETTINGS.smtp, ...(settings.smtp || {}) } };
  }

  // Mask password in response
  const masked = JSON.parse(JSON.stringify(settings));
  if (masked.smtp && masked.smtp.password) {
    masked.smtp.password = '********';
  }

  res.json({ settings: masked });
});

// PUT /api/settings
router.put('/', (req, res) => {
  const { userName, calendlyLink, previewSiteRepoPath, smtp } = req.body;

  const existing = dataStore.readSingleton('settings') || { ...DEFAULT_SETTINGS };

  const settings = {
    userName: userName !== undefined ? userName : existing.userName,
    calendlyLink: calendlyLink !== undefined ? calendlyLink : existing.calendlyLink,
    previewSiteRepoPath: previewSiteRepoPath !== undefined ? previewSiteRepoPath : (existing.previewSiteRepoPath || DEFAULT_SETTINGS.previewSiteRepoPath),
    smtp: {
      host: smtp && smtp.host !== undefined ? smtp.host : existing.smtp.host,
      port: smtp && smtp.port !== undefined ? smtp.port : existing.smtp.port,
      username: smtp && smtp.username !== undefined ? smtp.username : existing.smtp.username,
      password: smtp && smtp.password !== undefined && smtp.password !== '********'
        ? smtp.password
        : existing.smtp.password,
      fromAddress: smtp && smtp.fromAddress !== undefined ? smtp.fromAddress : existing.smtp.fromAddress,
      useProxy: smtp && smtp.useProxy !== undefined ? smtp.useProxy : (existing.smtp.useProxy || false)
    }
  };

  dataStore.writeSingleton('settings', settings);

  // Return masked version
  const masked = JSON.parse(JSON.stringify(settings));
  if (masked.smtp.password) {
    masked.smtp.password = '********';
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
