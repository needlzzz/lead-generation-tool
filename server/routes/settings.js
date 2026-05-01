const express = require('express');
const dataStore = require('../lib/dataStore');
const { testConnection } = require('../lib/emailService');

const router = express.Router();

const DEFAULT_SETTINGS = {
  userName: '',
  calendlyLink: '',
  smtp: {
    host: '',
    port: 587,
    username: '',
    password: '',
    fromAddress: ''
  }
};

// GET /api/settings
router.get('/', (req, res) => {
  let settings = dataStore.readSingleton('settings');
  if (!settings) {
    settings = { ...DEFAULT_SETTINGS };
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
  const { userName, calendlyLink, smtp } = req.body;

  if (!userName && userName !== '') {
    return res.status(400).json({ error: 'userName is required' });
  }

  const existing = dataStore.readSingleton('settings') || DEFAULT_SETTINGS;

  const settings = {
    userName: userName !== undefined ? userName : existing.userName,
    calendlyLink: calendlyLink !== undefined ? calendlyLink : existing.calendlyLink,
    smtp: {
      host: smtp && smtp.host !== undefined ? smtp.host : existing.smtp.host,
      port: smtp && smtp.port !== undefined ? smtp.port : existing.smtp.port,
      username: smtp && smtp.username !== undefined ? smtp.username : existing.smtp.username,
      password: smtp && smtp.password !== undefined && smtp.password !== '********'
        ? smtp.password
        : existing.smtp.password,
      fromAddress: smtp && smtp.fromAddress !== undefined ? smtp.fromAddress : existing.smtp.fromAddress
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

  try {
    await testConnection(settings.smtp);
    res.json({ success: true, message: 'SMTP connection successful' });
  } catch (err) {
    res.status(500).json({ success: false, error: `SMTP test failed: ${err.message}` });
  }
});

module.exports = router;
