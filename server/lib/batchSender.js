const fs = require('fs');
const path = require('path');
const nodemailer = require('nodemailer');
const quotaTracker = require('./quotaTracker');
const { renderTemplate } = require('./emailService');
const dataStore = require('./dataStore');

const DATA_DIR = path.join(__dirname, '..', 'data');
const STATE_FILE = path.join(DATA_DIR, 'send-queue-state.json');

// ---------------------------------------------------------------------------
// In-memory state (persisted to disk via send-queue-state.json)
// ---------------------------------------------------------------------------
let state = {
  status: 'idle',       // idle | sending | paused_quota | paused_window | stopping | complete
  emailType: null,
  queue: [],            // [{ leadId, emailType }]
  completed: [],        // [leadId]
  failed: [],           // [{ leadId, businessName, errorType, error }]
  lastUpdatedAt: null,
  startedAt: null
};

let stopRequested = false;
let running = false;
let pollTimer = null;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Check whether the current time is within the configured send window.
 * Uses Intl.DateTimeFormat to resolve the current hour:minute in the target timezone.
 */
function isWithinSendWindow(settings) {
  const { sendWindowStart, sendWindowEnd, sendWindowTimezone } = settings.batch;
  const now = new Date();
  const formatter = new Intl.DateTimeFormat('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: sendWindowTimezone
  });
  const currentTime = formatter.format(now); // e.g. "08:30"
  return currentTime >= sendWindowStart && currentTime < sendWindowEnd;
}

/**
 * Create a Nodemailer transport configured for Brevo SMTP.
 * No proxy — Brevo is public cloud.
 */
function createBrevoTransport(brevoConfig) {
  return nodemailer.createTransport({
    host: brevoConfig.host,
    port: brevoConfig.port,
    secure: false,
    auth: {
      user: brevoConfig.username,
      pass: brevoConfig.password
    }
  });
}

/**
 * Wait for a random delay between min and max seconds (inclusive).
 * Formula: Math.floor(Math.random() * (max - min + 1)) + min
 */
function randomDelay(minSeconds, maxSeconds) {
  const delaySeconds = Math.floor(Math.random() * (maxSeconds - minSeconds + 1)) + minSeconds;
  return new Promise(resolve => setTimeout(resolve, delaySeconds * 1000));
}

/**
 * Persist state to disk atomically (temp file + rename).
 * Logs a warning on I/O failure but does not crash the send loop.
 */
function persistState() {
  state.lastUpdatedAt = new Date().toISOString();
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    const tmpFile = STATE_FILE + '.tmp.' + Date.now();
    fs.writeFileSync(tmpFile, JSON.stringify(state, null, 2), 'utf-8');
    fs.renameSync(tmpFile, STATE_FILE);
  } catch (err) {
    // Log warning but don't crash the send loop
    console.warn('[batchSender] Failed to persist state to disk:', err.message);
  }
}

/**
 * Load state from disk. Returns the parsed state object or null if
 * the file is missing or contains invalid JSON.
 */
function loadState() {
  try {
    if (!fs.existsSync(STATE_FILE)) return null;
    const raw = fs.readFileSync(STATE_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    return null;
  }
}

/**
 * Determine if an SMTP error is a hard bounce (5xx).
 */
function isHardBounce(err) {
  const code = err.responseCode || err.code;
  if (typeof code === 'number') return code >= 500 && code < 600;
  if (typeof code === 'string') return code.startsWith('5');
  return false;
}

/**
 * Determine if an SMTP error is a transient failure (4xx or timeout).
 */
function isTransientError(err) {
  const code = err.responseCode || err.code;
  if (typeof code === 'number') return code >= 400 && code < 500;
  if (typeof code === 'string') return code.startsWith('4');
  // Treat timeouts and connection errors as transient
  if (err.code === 'ETIMEDOUT' || err.code === 'ECONNRESET' || err.code === 'ESOCKET') return true;
  return false;
}

// ---------------------------------------------------------------------------
// Core processing loop
// ---------------------------------------------------------------------------

async function processQueue(settings, categories) {
  const brevoConfig = settings.smtp && settings.smtp.brevo;
  const { sendDelayMin, sendDelayMax } = settings.batch;

  for (let i = 0; i < state.queue.length; i++) {
    // (a) Check stop flag
    if (stopRequested) {
      state.status = 'complete';
      persistState();
      break;
    }

    // (b) Check quota
    if (!quotaTracker.canSend(settings)) {
      state.status = 'paused_quota';
      persistState();
      await waitForCondition(() => quotaTracker.canSend(settings));
      if (stopRequested) break;
      state.status = 'sending';
      persistState();
    }

    // (c) Check send window
    if (!isWithinSendWindow(settings)) {
      state.status = 'paused_window';
      persistState();
      await waitForCondition(() => isWithinSendWindow(settings));
      if (stopRequested) break;
      state.status = 'sending';
      persistState();
    }

    const item = state.queue[i];
    const lead = dataStore.get('leads', item.leadId);
    if (!lead) {
      state.failed.push({
        leadId: item.leadId,
        businessName: '',
        errorType: 'not_found',
        error: 'Lead not found'
      });
      persistState();
      continue;
    }

    // (d) Render email template
    const category = categories.find(c => c.name === lead.category);
    if (!category || !category.templates || !category.templates[item.emailType]) {
      state.failed.push({
        leadId: item.leadId,
        businessName: lead.businessName || '',
        errorType: 'template_missing',
        error: `Template ${item.emailType} not found for category "${lead.category}"`
      });
      persistState();
      continue;
    }

    const template = category.templates[item.emailType];
    const rendered = renderTemplate(template, lead, settings);

    // (e) Send email via Brevo (with 30s timeouts)
    try {
      const transport = createBrevoTransport(brevoConfig);
      await transport.sendMail({
        from: brevoConfig.fromAddress,
        to: lead.email,
        subject: rendered.subject,
        text: rendered.body,
        connectionTimeout: 30000,
        greetingTimeout: 30000,
        socketTimeout: 30000
      });

      // (f) Success path — update lead pipeline state per email type
      quotaTracker.increment(settings);

      const now = new Date().toISOString();
      const today = now.slice(0, 10); // YYYY-MM-DD

      switch (item.emailType) {
        case 'email1':
          lead.status = 'Reached Out';
          lead.dateEmail1Sent = today;
          break;
        case 'email2':
          lead.dateFollowUp1Sent = today;
          break;
        case 'email3':
          lead.dateFollowUp2Sent = today;
          lead.calendlySent = true;
          break;
      }

      lead.activityLog = lead.activityLog || [];
      lead.activityLog.push({
        date: now,
        action: `Batch ${item.emailType} sent`,
        details: `Email sent to ${lead.email}`
      });
      dataStore.save('leads', lead);

      state.completed.push(item.leadId);
      persistState();
    } catch (err) {
      if (isHardBounce(err)) {
        // (g) SMTP 5xx — hard bounce
        lead.emailBounced = true;
        lead.emailBounceReason = (err.message || '').slice(0, 500);

        lead.activityLog = lead.activityLog || [];
        lead.activityLog.push({
          date: new Date().toISOString(),
          action: `Batch ${item.emailType} bounced`,
          details: `Hard bounce: ${(err.message || '').slice(0, 200)}`
        });
        dataStore.save('leads', lead);

        state.failed.push({
          leadId: item.leadId,
          businessName: lead.businessName || '',
          errorType: 'hard_bounce',
          error: (err.message || '').slice(0, 500)
        });
        persistState();
      } else {
        // (h) SMTP 4xx / timeout — transient (skip to next, no lead field changes)
        lead.activityLog = lead.activityLog || [];
        lead.activityLog.push({
          date: new Date().toISOString(),
          action: `Batch ${item.emailType} transient error`,
          details: `Transient error: ${(err.message || '').slice(0, 200)}`
        });
        dataStore.save('leads', lead);

        state.failed.push({
          leadId: item.leadId,
          businessName: lead.businessName || '',
          errorType: 'transient',
          error: (err.message || '').slice(0, 500)
        });
        persistState();
      }
    }

    // (i) Wait random delay before next send (unless last item or stopping)
    if (i < state.queue.length - 1 && !stopRequested) {
      await randomDelay(sendDelayMin, sendDelayMax);
    }
  }

  // Queue exhausted
  if (!stopRequested) {
    state.status = 'complete';
    persistState();
  }

  running = false;
  stopRequested = false;
}

/**
 * Poll every 60 seconds until condition() returns true or stop is requested.
 */
function waitForCondition(condition) {
  return new Promise(resolve => {
    const check = () => {
      if (stopRequested || condition()) {
        pollTimer = null;
        resolve();
        return;
      }
      pollTimer = setTimeout(check, 60 * 1000);
    };
    // First check after 60s
    pollTimer = setTimeout(check, 60 * 1000);
  });
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Start sequential email processing (non-blocking).
 * Kicks off an async loop in the background and returns immediately.
 *
 * @param {Array} queue - Array of { leadId, emailType } objects
 * @param {object} settings - App settings (with batch + smtp.brevo)
 * @param {Array} categories - Category objects with templates
 */
function start(queue, settings, categories) {
  if (running) {
    throw new Error('Batch sender is already running');
  }

  stopRequested = false;
  running = true;

  state = {
    status: 'sending',
    emailType: queue.length > 0 ? queue[0].emailType : null,
    queue: queue,
    completed: [],
    failed: [],
    lastUpdatedAt: new Date().toISOString(),
    startedAt: new Date().toISOString()
  };
  persistState();

  // Non-blocking — fire and forget
  processQueue(settings, categories).catch(err => {
    state.status = 'complete';
    state.lastUpdatedAt = new Date().toISOString();
    running = false;
    stopRequested = false;
  });
}

/**
 * Graceful stop — finishes the current send, then stops.
 */
function stop() {
  if (!running) return;
  stopRequested = true;
  state.status = 'stopping';
  persistState();

  // Clear any active poll timer
  if (pollTimer) {
    clearTimeout(pollTimer);
    pollTimer = null;
  }
}

/**
 * Resume processing from persisted state on disk.
 * Filters queue against completed+failed and continues.
 *
 * @param {object} settings - App settings
 * @param {Array} categories - Category objects with templates
 */
function resume(settings, categories) {
  if (running) {
    throw new Error('Batch sender is already running');
  }

  // Load state from disk
  const loaded = loadState();
  if (!loaded) {
    throw new Error('No resumable queue exists');
  }

  // Validate the loaded state has a resumable status
  if (loaded.status === 'idle' || loaded.status === 'complete') {
    throw new Error('No batch to resume');
  }

  // Restore in-memory state from disk
  state = loaded;

  // Filter out already-processed items
  const processedIds = new Set([
    ...state.completed,
    ...state.failed.map(f => f.leadId)
  ]);
  state.queue = state.queue.filter(item => !processedIds.has(item.leadId));

  if (state.queue.length === 0) {
    state.status = 'complete';
    persistState();
    return;
  }

  stopRequested = false;
  running = true;
  state.status = 'sending';
  persistState();

  processQueue(settings, categories).catch(err => {
    state.status = 'complete';
    state.lastUpdatedAt = new Date().toISOString();
    running = false;
    stopRequested = false;
    persistState();
  });
}

/**
 * Get current send status with quota info.
 * When not running, loads persisted state from disk so status survives server restarts.
 *
 * @param {object} settings - App settings (for quota calculation)
 * @returns {object} Current state + quota info
 */
function getStatus(settings) {
  const quota = quotaTracker.getCount(settings);

  // When not running, load from disk to survive server restarts
  let currentState = state;
  if (!running && state.status === 'idle') {
    const diskState = loadState();
    if (diskState) {
      currentState = diskState;
    }
  }

  return {
    status: currentState.status,
    emailType: currentState.emailType,
    queueSize: currentState.queue.length,
    completedCount: currentState.completed.length,
    failedCount: currentState.failed.length,
    failed: currentState.failed.slice(-100), // Most recent 100
    startedAt: currentState.startedAt,
    lastUpdatedAt: currentState.lastUpdatedAt,
    quota: {
      count: quota.count,
      remaining: quota.remaining,
      maxPerDay: settings.batch.maxEmailsPerDay
    }
  };
}

/**
 * Check if the batch sender is currently running.
 * @returns {boolean}
 */
function isRunning() {
  return running;
}

// ---------------------------------------------------------------------------
// Auto-eligibility queue builder
// ---------------------------------------------------------------------------

/**
 * Calculate the number of calendar days between a date string and today.
 * @param {string} dateStr - Date in YYYY-MM-DD or ISO format
 * @param {string} today - Current date as YYYY-MM-DD
 * @returns {number} Whole days elapsed
 */
function daysSince(dateStr, today) {
  const d1 = new Date(dateStr);
  const d2 = new Date(today);
  return Math.floor((d2 - d1) / (1000 * 60 * 60 * 24));
}

/**
 * Build auto-eligibility queue from all leads.
 * Priority: email3 → email2 → email1
 * Excludes: leads without email, leads with emailBounced=true
 *
 * @param {Array} leads - All leads from dataStore
 * @param {string} [today] - Current date as YYYY-MM-DD (optional, defaults to today)
 * @returns {Array} Array of { leadId, emailType } in priority order
 */
function buildAutoQueue(leads, today) {
  if (!today) today = new Date().toISOString().slice(0, 10);
  const queue = [];

  // Priority 1: Follow-up 2 due (most time-sensitive)
  for (const lead of leads) {
    if (lead.status === 'Reached Out' && lead.dateFollowUp1Sent &&
        !lead.dateFollowUp2Sent && !lead.emailBounced && lead.email &&
        daysSince(lead.dateFollowUp1Sent, today) >= 3) {
      queue.push({ leadId: lead.id, emailType: 'email3' });
    }
  }

  // Priority 2: Follow-up 1 due
  for (const lead of leads) {
    if (lead.status === 'Reached Out' && lead.dateEmail1Sent &&
        !lead.dateFollowUp1Sent && !lead.emailBounced && lead.email &&
        daysSince(lead.dateEmail1Sent, today) >= 3) {
      queue.push({ leadId: lead.id, emailType: 'email2' });
    }
  }

  // Priority 3: New cold outreach (lowest priority)
  for (const lead of leads) {
    if (lead.status === 'Discovered' && lead.previewUrl &&
        !lead.emailBounced && lead.email) {
      queue.push({ leadId: lead.id, emailType: 'email1' });
    }
  }

  return queue;
}

/**
 * Build a queue for a specific email type only.
 * Applies the same eligibility rules as buildAutoQueue but filtered to one type.
 *
 * @param {Array} leads - All leads from dataStore
 * @param {string} emailType - One of: 'email1', 'email2', 'email3'
 * @param {string} [today] - Current date as YYYY-MM-DD (optional, defaults to today)
 * @returns {Array} Array of { leadId, emailType } for eligible leads
 */
function buildQueueForType(leads, emailType, today) {
  if (!today) today = new Date().toISOString().slice(0, 10);
  const queue = [];

  for (const lead of leads) {
    if (!lead.email || lead.emailBounced) continue;

    switch (emailType) {
      case 'email1':
        if (lead.status === 'Discovered' && lead.previewUrl) {
          queue.push({ leadId: lead.id, emailType: 'email1' });
        }
        break;
      case 'email2':
        if (lead.status === 'Reached Out' && lead.dateEmail1Sent &&
            !lead.dateFollowUp1Sent && daysSince(lead.dateEmail1Sent, today) >= 3) {
          queue.push({ leadId: lead.id, emailType: 'email2' });
        }
        break;
      case 'email3':
        if (lead.status === 'Reached Out' && lead.dateFollowUp1Sent &&
            !lead.dateFollowUp2Sent && daysSince(lead.dateFollowUp1Sent, today) >= 3) {
          queue.push({ leadId: lead.id, emailType: 'email3' });
        }
        break;
    }
  }

  return queue;
}

module.exports = {
  start,
  stop,
  resume,
  getStatus,
  isRunning,
  buildAutoQueue,
  buildQueueForType,
  // Exported for testing
  _isWithinSendWindow: isWithinSendWindow,
  _createBrevoTransport: createBrevoTransport,
  _randomDelay: randomDelay,
  _daysSince: daysSince,
  _loadState: loadState,
  _getState: () => state,
  _resetState: () => {
    state = {
      status: 'idle',
      emailType: null,
      queue: [],
      completed: [],
      failed: [],
      lastUpdatedAt: null,
      startedAt: null
    };
    stopRequested = false;
    running = false;
    if (pollTimer) {
      clearTimeout(pollTimer);
      pollTimer = null;
    }
  }
};
