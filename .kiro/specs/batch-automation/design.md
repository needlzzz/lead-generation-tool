# Technical Design Document

## Overview

This design implements batch preview generation and throttled email sending for the Lead Generation CRM, enabling processing of 600+ leads overnight with a single Cloudflare Pages deploy and multi-day email campaigns via Brevo SMTP relay.

The system introduces three new backend modules, one new route file, and extends the existing settings structure. No frontend changes are required in this phase — all batch operations are triggered via API (curl/Postman) and monitored via polling endpoints.

## Architecture

### System Context

```
┌──────────────────────────────────────────────────────────────────┐
│  Lead Generation CRM (Express, localhost:3000)                    │
│                                                                   │
│  ┌─────────────────┐  ┌──────────────────┐  ┌────────────────┐  │
│  │ routes/batch.js  │  │ lib/batchPreview │  │ lib/batchSender│  │
│  │ (API endpoints)  │──│ Generator.js     │  │ .js            │  │
│  └────────┬─────────┘  └───────┬──────────┘  └───────┬────────┘  │
│           │                     │                      │          │
│           │              ┌──────┴──────┐        ┌──────┴──────┐   │
│           │              │ execSync    │        │ Nodemailer  │   │
│           │              │ build-      │        │ → Brevo     │   │
│           │              │ preview.mjs │        │   SMTP      │   │
│           │              └──────┬──────┘        └──────┬──────┘   │
│           │                     │                      │          │
│  ┌────────┴──────────────────────┴──────────────────────┴──────┐  │
│  │              server/data/ (JSON persistence)                 │  │
│  │  batch-preview-state.json │ send-queue-state.json            │  │
│  │  send-quota.json          │ settings.json (extended)         │  │
│  └─────────────────────────────────────────────────────────────┘  │
└───────────────────────────────────────────────────────────────────┘
         │                                          │
         ▼                                          ▼
┌─────────────────────┐                  ┌─────────────────────┐
│ kaelint-website-    │                  │ smtp-relay.brevo.com │
│ business repo       │                  │ (port 587, STARTTLS) │
│ (Astro build +     │                  │ 300/day free tier     │
│  CF Pages deploy)   │                  └─────────────────────┘
└─────────────────────┘
```

### Module Dependency Graph

```
routes/batch.js
  ├── lib/batchPreviewGenerator.js
  │     ├── lib/configGenerator.js (existing)
  │     ├── lib/slugGenerator.js (existing)
  │     ├── lib/previewRegistry.js (existing)
  │     ├── lib/screenshotCapturer.js (existing)
  │     └── lib/dataStore.js (existing)
  ├── lib/batchSender.js
  │     ├── lib/quotaTracker.js (NEW)
  │     ├── lib/emailService.js (existing, unchanged)
  │     └── lib/dataStore.js (existing)
  └── lib/quotaTracker.js (NEW)
```

## Components and Interfaces

### 1. `server/lib/quotaTracker.js` (NEW)

Manages daily email send quota with atomic file persistence.

```javascript
// Public API
module.exports = {
  getCount(settings)          // → { date, count, remaining, isNewDay }
  increment(settings)         // → { date, count, remaining } | throws on I/O error
  canSend(settings)           // → boolean
};
```

**State file:** `server/data/send-quota.json`
```json
{
  "date": "2026-06-11",
  "count": 147,
  "lastSentAt": "2026-06-11T14:23:00.000Z"
}
```

**Key behaviors:**
- Lazy day reset: on read, compares `date` to UTC today. If different, returns count=0.
- Atomic write: writes to `.tmp.{timestamp}` then `fs.renameSync`.
- `canSend()` checks `count < settings.batch.maxEmailsPerDay`.
- Missing/corrupt file treated as count=0.
- I/O failure on write throws (caller pauses sending).

### 2. `server/lib/batchSender.js` (NEW)

Manages the email send queue as a background in-process loop.

```javascript
// Public API
module.exports = {
  start(queue, settings, categories)  // Start sequential processing (non-blocking)
  stop()                              // Graceful stop (finishes current send)
  resume(settings, categories)        // Resume from persisted state
  getStatus(settings)                 // → current state object
  isRunning()                         // → boolean
};
```

**State file:** `server/data/send-queue-state.json`
```json
{
  "status": "sending",
  "emailType": "email1",
  "queue": [
    { "leadId": "abc123", "emailType": "email1" },
    { "leadId": "def456", "emailType": "email2" }
  ],
  "completed": ["abc123"],
  "failed": [
    { "leadId": "xyz789", "businessName": "Salon Müller", "errorType": "transient", "error": "ECONNRESET" }
  ],
  "lastUpdatedAt": "2026-06-11T14:23:00.000Z",
  "startedAt": "2026-06-11T08:00:00.000Z"
}
```

**Processing loop (async, runs in background):**

```
start(queue, settings, categories):
  1. Persist initial state (status: "sending")
  2. Loop through queue items:
     a. Check stopRequested flag → break if true
     b. Check quotaTracker.canSend() → pause if false (status: "paused_quota")
     c. Check isWithinSendWindow() → pause if false (status: "paused_window")
     d. Render email template (reuse existing renderTemplate)
     e. Create Brevo transport + send email
     f. On success:
        - quotaTracker.increment()
        - Update lead pipeline state (reuse existing logic from routes/email.js)
        - Add leadId to completed list
        - Persist state
     g. On SMTP 5xx:
        - Mark lead emailBounced: true + bounceReason
        - Add to failed list (errorType: "hard_bounce")
        - Persist state
     h. On SMTP 4xx / timeout:
        - Add to failed list (errorType: "transient")
        - Persist state
     i. Wait random delay (sendDelayMin..sendDelayMax seconds)
  3. When queue exhausted: set status "complete", persist
```

**Send window check:**

```javascript
function isWithinSendWindow(settings) {
  const { sendWindowStart, sendWindowEnd, sendWindowTimezone } = settings.batch;
  const now = new Date();
  // Use Intl.DateTimeFormat to get current hour:minute in target timezone
  const formatter = new Intl.DateTimeFormat('en-GB', {
    hour: '2-digit', minute: '2-digit', hour12: false,
    timeZone: sendWindowTimezone
  });
  const currentTime = formatter.format(now); // "08:30"
  return currentTime >= sendWindowStart && currentTime < sendWindowEnd;
}
```

**Pause/resume mechanism:**

When paused (quota or window), the loop enters a `setTimeout` poll:
- Every 60 seconds, re-check the pause condition.
- When condition clears (new day for quota, window opens for time), resume loop.
- `stop()` sets a flag that breaks out of both the send loop and the poll loop.

**Brevo transport creation:**

```javascript
function createBrevoTransport(brevoConfig) {
  return nodemailer.createTransport({
    host: brevoConfig.host,      // "smtp-relay.brevo.com"
    port: brevoConfig.port,      // 587
    secure: false,               // STARTTLS
    auth: {
      user: brevoConfig.username,
      pass: brevoConfig.password
    }
    // No proxy — Brevo is public cloud
  });
}
```

### 3. `server/lib/batchPreviewGenerator.js` (NEW)

Orchestrates parallel preview builds with state persistence.

```javascript
// Public API
module.exports = {
  start(leadIds, settings, sendEvent)  // Start batch (SSE callback)
  resume(settings, sendEvent)          // Resume from persisted state
  getStatus()                          // → current batch state
  isRunning()                          // → boolean
};
```

**State file:** `server/data/batch-preview-state.json`
```json
{
  "status": "running",
  "queue": ["lead-id-1", "lead-id-2", "..."],
  "completed": ["lead-id-1"],
  "failed": [
    { "leadId": "lead-id-3", "error": "Build timeout" }
  ],
  "startedAt": "2026-06-11T22:00:00.000Z",
  "lastUpdatedAt": "2026-06-11T22:15:00.000Z"
}
```

**Concurrency model:**

The build-preview.mjs script uses a shared `src/assets/images/` directory for niche assets. With parallel builds, this is a race condition. The design uses **serialized asset access with a semaphore**:

```javascript
// Concurrency pool with serialized asset-copy step
async function processQueue(queue, concurrency, settings, sendEvent) {
  const semaphore = new Semaphore(1); // Only 1 build uses src/assets/ at a time
  const pool = new ConcurrencyPool(concurrency);

  for (const leadId of queue) {
    await pool.acquire();
    processLead(leadId, settings, sendEvent, semaphore, pool);
  }

  await pool.drain(); // Wait for all in-flight builds to complete
}

async function processLead(leadId, settings, sendEvent, semaphore, pool) {
  try {
    // Steps 1-5: config gen, slug, registry (fast, no shared resource)
    const { slug, niche, configPath } = await preparePreview(leadId, settings);

    // Step 6: Build (serialized via semaphore for asset safety)
    await semaphore.acquire();
    try {
      execSync(buildCmd, { cwd: repoPath, timeout: 90000 });
    } finally {
      semaphore.release();
    }

    // Step 7: Screenshot (parallel OK — no shared resource)
    await captureScreenshot(slug, repoPath);

    // Update registry + state
    markCompleted(leadId, slug);
    sendEvent('progress', { leadId, status: 'complete', ... });
  } catch (err) {
    markFailed(leadId, err.message);
    sendEvent('progress', { leadId, status: 'failed', ... });
  } finally {
    pool.release();
  }
}
```

**Why semaphore instead of temp directories:**
- The Astro build references `src/assets/images/` via `import.meta.glob()` — this path is hardcoded in the Astro components.
- Creating per-build temp directories would require modifying build-preview.mjs to accept a custom asset path, which changes the kaelint-website-business repo.
- A semaphore serializes only the asset-copy → build → cleanup phase (~30-60s) while allowing screenshots and config generation to run in parallel.

**Effective parallelism with concurrency=2:**
- While Build A runs (holds semaphore), Lead B does config gen + slug + registry
- When Build A finishes and releases semaphore, Build B starts immediately
- Meanwhile, Screenshot A runs in parallel with Build B
- Net throughput: nearly sequential builds but with overlapping prep and screenshot work

**Deploy at end:**

After all builds complete, if `completed.length > 0`:
```javascript
execSync('node scripts/deploy-previews.mjs', {
  cwd: previewSiteRepoPath,
  timeout: 300000,
  env: { ...process.env, NODE_TLS_REJECT_UNAUTHORIZED: '0' }
});
// Then bulk-update all completed entries to "deployed" in registry
```

### 4. `server/routes/batch.js` (NEW)

Express router with all batch API endpoints.

```javascript
const router = express.Router();

// --- Preview Batch ---
router.post('/generate-previews', async (req, res) => { ... }); // SSE
router.get('/preview-status', (req, res) => { ... });

// --- Email Batch ---
router.post('/send-emails', (req, res) => { ... });   // HTTP 202
router.get('/send-status', (req, res) => { ... });
router.post('/send-stop', (req, res) => { ... });
```

**Endpoint details:**

| Method | Path | Response | Description |
|--------|------|----------|-------------|
| POST | /api/batch/generate-previews | SSE stream | Start or resume batch preview builds |
| GET | /api/batch/preview-status | JSON | Current batch state |
| POST | /api/batch/send-emails | 202 JSON | Start or resume email queue |
| GET | /api/batch/send-status | JSON | Current send state + quota |
| POST | /api/batch/send-stop | 200 JSON | Graceful stop |

### 5. Settings Extension

**Added to `server/routes/settings.js`:**

```javascript
const DEFAULT_SETTINGS = {
  // ... existing fields ...
  smtp: {
    // ... existing fields ...
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
```

**Validation logic (in PUT handler):**

```javascript
function validateBatchSettings(batch) {
  const errors = [];
  if (batch.previewConcurrency < 1 || batch.previewConcurrency > 10) errors.push('previewConcurrency: 1-10');
  if (batch.maxEmailsPerDay < 1 || batch.maxEmailsPerDay > 1000) errors.push('maxEmailsPerDay: 1-1000');
  if (batch.sendDelayMin < 1 || batch.sendDelayMin > 3600) errors.push('sendDelayMin: 1-3600');
  if (batch.sendDelayMax < 1 || batch.sendDelayMax > 3600) errors.push('sendDelayMax: 1-3600');
  if (batch.sendDelayMin > batch.sendDelayMax) errors.push('sendDelayMin must be ≤ sendDelayMax');
  if (batch.sendWindowStart >= batch.sendWindowEnd) errors.push('sendWindowStart must be before sendWindowEnd');
  // Timezone validation via Intl
  try { Intl.DateTimeFormat('en', { timeZone: batch.sendWindowTimezone }); }
  catch { errors.push('sendWindowTimezone: invalid IANA timezone'); }
  return errors;
}
```

## Data Models

### Queue Item (Send Queue)

```typescript
interface SendQueueItem {
  leadId: string;
  emailType: 'email1' | 'email2' | 'email3';
}
```

### Failed Entry

```typescript
interface FailedEntry {
  leadId: string;
  businessName: string;
  errorType: 'hard_bounce' | 'transient';
  error: string;  // max 500 chars
}
```

### Batch Preview State

```typescript
interface BatchPreviewState {
  status: 'idle' | 'running' | 'deploying' | 'complete' | 'failed';
  queue: string[];           // lead IDs remaining
  completed: string[];       // lead IDs successfully built
  failed: Array<{ leadId: string; error: string }>;
  startedAt: string | null;  // ISO timestamp
  lastUpdatedAt: string;     // ISO timestamp
  summary?: {
    total: number;
    succeeded: number;
    failed: number;
    durationSeconds: number;
  };
}
```

### Send Queue State

```typescript
interface SendQueueState {
  status: 'idle' | 'sending' | 'paused_quota' | 'paused_window' | 'stopped' | 'complete';
  emailType: string;
  queue: SendQueueItem[];
  completed: string[];       // lead IDs
  failed: FailedEntry[];
  startedAt: string | null;
  lastUpdatedAt: string;
}
```

### Send Status Response

```typescript
interface SendStatusResponse {
  status: string;
  totalQueued: number;
  completed: number;
  failed: number;
  dailyQuotaUsed: number;
  dailyQuotaLimit: number;
  estimatedNextSend: string | null;  // ISO timestamp
  sendWindowStatus: 'open' | 'closed';
  pauseReason?: 'quota_reached' | 'outside_window';
  estimatedResumeTime?: string;      // ISO timestamp
  failedLeads: Array<{ leadId: string; businessName: string; error: string }>;
}
```

## Concurrency Utilities

### Semaphore (inline helper)

```javascript
class Semaphore {
  constructor(max) {
    this.max = max;
    this.count = 0;
    this.queue = [];
  }
  acquire() {
    return new Promise(resolve => {
      if (this.count < this.max) { this.count++; resolve(); }
      else { this.queue.push(resolve); }
    });
  }
  release() {
    this.count--;
    if (this.queue.length > 0) { this.count++; this.queue.shift()(); }
  }
}
```

### ConcurrencyPool (inline helper)

```javascript
class ConcurrencyPool {
  constructor(max) {
    this.max = max;
    this.active = 0;
    this.waiting = [];
    this.drainResolvers = [];
  }
  acquire() {
    return new Promise(resolve => {
      if (this.active < this.max) { this.active++; resolve(); }
      else { this.waiting.push(resolve); }
    });
  }
  release() {
    this.active--;
    if (this.waiting.length > 0) { this.active++; this.waiting.shift()(); }
    if (this.active === 0 && this.drainResolvers.length > 0) {
      this.drainResolvers.forEach(r => r());
      this.drainResolvers = [];
    }
  }
  drain() {
    if (this.active === 0) return Promise.resolve();
    return new Promise(resolve => this.drainResolvers.push(resolve));
  }
}
```

## Auto-Eligibility Logic

### Email Type Auto-Detection (emailType: "auto")

```javascript
function buildAutoQueue(leads, today) {
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

  // Priority 3: New cold outreach (lowest priority — most quota-consuming)
  for (const lead of leads) {
    if (lead.status === 'Discovered' && lead.previewUrl &&
        !lead.emailBounced && lead.email) {
      queue.push({ leadId: lead.id, emailType: 'email1' });
    }
  }

  return queue;
}
```

## File Structure (New/Modified)

```
server/
├── lib/
│   ├── batchPreviewGenerator.js   (NEW — batch orchestrator)
│   ├── batchSender.js             (NEW — email queue processor)
│   ├── quotaTracker.js            (NEW — daily quota persistence)
│   ├── emailService.js            (UNCHANGED)
│   ├── previewGenerator.js        (UNCHANGED — single-preview still works)
│   └── ...
├── routes/
│   ├── batch.js                   (NEW — all batch endpoints)
│   ├── settings.js                (MODIFIED — batch + brevo fields)
│   └── ...
├── data/
│   ├── batch-preview-state.json   (NEW — runtime, gitignored)
│   ├── send-queue-state.json      (NEW — runtime, gitignored)
│   ├── send-quota.json            (NEW — runtime, gitignored)
│   └── settings.json              (EXTENDED — batch + brevo fields)
└── index.js                       (MODIFIED — mount /api/batch router)

tests/
├── batchPreviewGenerator.test.js  (NEW)
├── batchSender.test.js            (NEW)
├── quotaTracker.test.js           (NEW)
├── batchRoutes.test.js            (NEW)
└── ...existing tests...
```

## Error Handling

| Error Type | Action | Status Transition |
|-----------|--------|-------------------|
| Build timeout (90s) | Skip lead, log error | Lead → failed list |
| Build crash (non-zero exit) | Skip lead, log stderr | Lead → failed list |
| Screenshot failure | Continue (non-blocking) | Lead → completed (screenshot=null) |
| Deploy failure (300s timeout) | Stop batch, all stay "built" | Batch → failed |
| SMTP 5xx (hard bounce) | Mark lead bounced, skip | Lead → failed (hard_bounce) |
| SMTP 4xx (transient) | Skip lead, log error | Lead → failed (transient) |
| Network timeout (30s) | Skip lead, log error | Lead → failed (transient) |
| Quota file I/O failure | Pause sending | Queue → paused_quota |
| State file I/O failure | Log warning, continue | Best-effort persist |

## Correctness Properties

### Property 1: Quota Invariant
The daily send count SHALL never exceed `maxEmailsPerDay` regardless of concurrent requests, server restarts, or timing races. Enforced by: check-before-send + increment-after-send + atomic file write.

**Validates: Requirements 5.3, 5.4, 5.5**

### Property 2: Delay Bounds
The random delay between sends SHALL always be within `[sendDelayMin, sendDelayMax]` (inclusive). Enforced by: `Math.floor(Math.random() * (max - min + 1)) + min`.

**Validates: Requirements 4.6**

### Property 3: State Machine Validity
Batch preview state transitions SHALL only follow: `idle → running → deploying → complete` or `idle → running → failed`. No backward transitions. Enforced by: guard checks in status update functions.

**Validates: Requirements 2.1, 2.4**

### Property 4: Send Queue Monotonicity
A lead that appears in `completed` or `failed` SHALL never be re-processed in the same batch run. Enforced by: filtering queue against completed+failed sets before each iteration.

**Validates: Requirements 6.3, 6.5**

### Property 5: Single Deploy
During a batch preview run, `deploy-previews.mjs` SHALL be invoked at most once. Enforced by: deploy call only in the drain/finalize path after all builds complete.

**Validates: Requirements 1.8**

### Property 6: Bounce Permanence
A lead marked with `emailBounced: true` SHALL never be added to any future send queue. Enforced by: exclusion filter in queue builder.

**Validates: Requirements 8.1, 8.2**

## Sequence: Batch Email Send

```
Operator → POST /api/batch/send-emails { emailType: "auto" }
  │
  ├─ Validate Brevo SMTP configured
  ├─ Build auto-queue (email3 → email2 → email1 priority)
  ├─ Persist initial state (status: "sending")
  ├─ Return HTTP 202 { status: "sending", totalQueued: 147 }
  │
  └─ Background loop starts:
       ┌─────────────────────────────────────────┐
       │ For each queue item:                     │
       │  1. Check stopRequested → break          │
       │  2. Check quotaTracker.canSend()         │
       │     → false: pause, poll every 60s       │
       │  3. Check isWithinSendWindow()           │
       │     → false: pause, poll every 60s       │
       │  4. Render template (via renderTemplate) │
       │  5. Send via Brevo transport             │
       │  6. On success:                          │
       │     - increment quota                    │
       │     - update lead status                 │
       │     - persist state                      │
       │  7. On failure:                          │
       │     - categorize (5xx vs 4xx)            │
       │     - add to failed list                 │
       │     - persist state                      │
       │  8. Wait random(60s, 120s)               │
       └─────────────────────────────────────────┘

Operator → GET /api/batch/send-status (polling)
  └─ Returns current state from send-queue-state.json + quota info
```

## Dependencies

No new npm packages required:
- **Nodemailer** — already installed, works with Brevo SMTP as-is
- **child_process** — Node.js built-in (execSync for builds)
- **crypto** — Node.js built-in (randomUUID for slugs)
- **fs** — Node.js built-in (state persistence)
- **Intl.DateTimeFormat** — Built into Node.js ≥14 (timezone handling)

## Testing Strategy

| Module | Test Approach | Key Scenarios |
|--------|--------------|---------------|
| quotaTracker | Unit (Jest) | Day reset, increment, I/O failure, missing file |
| batchSender | Unit (Jest, mocked transport) | Success flow, quota pause, window pause, resume, stop, bounces |
| batchPreviewGenerator | Unit (Jest, mocked execSync) | Concurrency, failure skip, deploy-once, resume |
| batch routes | Integration (supertest) | Request validation, 409 conflict, 202 acceptance |
| Property tests | fast-check | Quota invariant, delay bounds, state machine |

**Mocking strategy:**
- `child_process.execSync` → jest.mock (simulate build success/failure/timeout)
- `nodemailer.createTransport` → jest.mock (simulate send success/bounce/timeout)
- `fs.writeFileSync/readFileSync` → real filesystem in temp dir (test atomic writes)
- `Date.now()` → jest.useFakeTimers (test window/quota boundary conditions)
