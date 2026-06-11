# Requirements Document

## Introduction

Batch automation for the Lead Generation CRM enabling large-scale preview generation (600+ leads) and throttled email sending via Brevo SMTP relay. The system builds all preview sites in parallel batches with a single deploy at the end, and sends emails sequentially with configurable delays, daily quota tracking, and warm-up strategy — designed to run overnight and over multiple days without manual intervention.

## Glossary

- **Batch_Preview_Generator**: The server-side module that orchestrates building multiple preview sites concurrently, managing a work queue with configurable parallelism, streaming progress via SSE, and executing a single deploy at completion.
- **Email_Sender**: The server-side module that sends emails sequentially from a queue with configurable inter-send delays, respecting daily quota limits and send window hours.
- **Quota_Tracker**: The file-based persistence layer (`server/data/send-quota.json`) that tracks daily email send counts, resets at UTC midnight, and enforces the Brevo free-tier daily cap.
- **Send_Queue**: An ordered list of leads with their designated email type (email1, email2, email3) to be processed sequentially by the Email_Sender.
- **Send_Window**: The configured time range during which emails are allowed to be sent (default: 08:00–17:00 CET, Swiss business hours).
- **Warm_Up**: A graduated sending strategy where daily volume starts low (50–100/day) and ramps to full capacity (250–300/day) over the first 2–3 days to establish domain reputation with Brevo.
- **Brevo_SMTP**: The SMTP relay service at `smtp-relay.brevo.com:587` used for email delivery with a 300 emails/day free-tier limit that resets at UTC midnight.
- **Preview_Site_Repo**: The local kaelint-website-business repository referenced by `settings.previewSiteRepoPath`, containing build and deploy scripts.

## Requirements

### Requirement 1: Batch Preview Generation Endpoint

**User Story:** As an operator, I want to trigger batch preview generation for multiple leads at once, so that I can build 600+ preview sites overnight without manual intervention.

#### Acceptance Criteria

1. WHEN a POST request is sent to `/api/batch/generate-previews` with a JSON body containing a `leadIds` array (maximum 1000 entries), THE Batch_Preview_Generator SHALL validate that each ID corresponds to an existing lead, create a work queue containing all valid leads, and begin processing them.
2. WHEN a POST request is sent to `/api/batch/generate-previews` without a `leadIds` field, THE Batch_Preview_Generator SHALL queue all leads that have `websiteAnalyzedAt` set and no existing valid (non-expired, matching data hash) preview, up to a maximum of 1000 leads.
3. IF the `leadIds` array contains IDs that do not correspond to existing leads, THEN THE Batch_Preview_Generator SHALL exclude those IDs from the queue and include them in the initial SSE response as `skippedIds` with the reason "not_found".
4. WHILE the batch is processing, THE Batch_Preview_Generator SHALL stream one SSE event per lead per status transition, with event data containing `leadId`, `status` (one of: queued, building, built, screenshot, complete, failed), `message`, and batch-level counters (`completed`, `failed`, `total`).
5. THE Batch_Preview_Generator SHALL process leads with a concurrency level read from `settings.batch.previewConcurrency` (integer, minimum 1, maximum 10, default 2), running that many parallel Astro builds simultaneously.
6. THE Batch_Preview_Generator SHALL ensure parallel builds do not conflict by using per-build temporary directories for niche asset copies (not the shared `src/assets/images/`), or by serializing the asset-copy → build → cleanup sequence so only one build occupies the shared image directory at a time.
7. IF a single lead's build fails, THEN THE Batch_Preview_Generator SHALL emit an SSE event with status "failed" for that lead (including the error message), add the lead to the failed list in persisted batch state, and continue processing the remaining queue.
8. WHEN all leads in the queue have been processed (built + screenshot captured), THE Batch_Preview_Generator SHALL execute a single deploy of all previews via `deploy-previews.mjs` with a timeout of 300 seconds, provided at least one build succeeded.
9. IF the final deploy fails, THEN THE Batch_Preview_Generator SHALL report the deploy failure via SSE (event type "deploy_failed" with error message) and mark all newly-built previews with status "built" (not "deployed") in the registry.
10. THE Batch_Preview_Generator SHALL update the preview registry status to "built" after each successful build, and to "deployed" only after the final single deploy invocation succeeds.

### Requirement 2: Batch Preview Progress and State

**User Story:** As an operator, I want to monitor the batch preview generation progress and resume after interruptions, so that I can track overnight builds and recover from failures.

#### Acceptance Criteria

1. THE Batch_Preview_Generator SHALL persist batch state to disk (`server/data/batch-preview-state.json`) including: queue of remaining lead IDs (maximum 1000 entries), completed IDs, failed IDs with error reason per entry, and current status (idle, running, deploying, complete, failed).
2. WHILE a batch is in status "running" or "deploying", WHEN a new batch request arrives, THE Batch_Preview_Generator SHALL reject the request with HTTP 409 and a message indicating a batch is in progress.
3. WHEN the server restarts and the persisted batch state has status "running" or "deploying", THE Batch_Preview_Generator SHALL mark the state as resumable and allow resuming via a POST to `/api/batch/generate-previews` with `resume: true`, which continues processing from the first lead ID not yet in the completed or failed list.
4. WHEN a batch completes (all leads in the queue have been processed and the final deploy succeeds), THE Batch_Preview_Generator SHALL update batch state to "complete" with a summary containing: total count, succeeded count, failed count, and duration in whole seconds.
5. THE Batch_Preview_Generator SHALL skip leads that already have a deployed, non-expired preview entry in the registry whose `leadDataHash` matches the hash computed from the lead's current businessName, category, and city (same logic as single-preview no-op check in `previewGenerator.js` Step 2).
6. IF a single lead fails during batch processing, THEN THE Batch_Preview_Generator SHALL record that lead's ID and error reason in the failed list, persist the updated batch state to disk, and continue processing the next lead in the queue without aborting the batch.
7. WHEN a GET request is received at `/api/batch/preview-status`, THE Batch_Preview_Generator SHALL return the current batch state including status, total queue size, completed count, failed count, and the ID of the lead currently being processed.

### Requirement 3: Batch Settings Configuration

**User Story:** As an operator, I want to configure batch automation parameters in the settings UI, so that I can control concurrency, delays, quotas, and send windows without editing code.

#### Acceptance Criteria

1. THE Settings SHALL accept a `batch` object with the following configurable fields: `previewConcurrency` (integer, min 1 max 10, default 2), `maxEmailsPerDay` (integer, min 1 max 1000, default 250), `sendDelayMin` (integer seconds, min 1 max 3600, default 60), `sendDelayMax` (integer seconds, min 1 max 3600, default 120), `sendWindowStart` (string HH:MM 24h format, default "08:00"), `sendWindowEnd` (string HH:MM 24h format, default "17:00"), `sendWindowTimezone` (valid IANA timezone string, default "Europe/Zurich").
2. WHEN the settings are saved with batch configuration, THE Settings route SHALL persist the batch fields alongside existing settings in `settings.json`.
3. IF batch settings fields are missing from saved settings, THEN THE Settings route SHALL merge with defaults so all fields are present at read time.
4. IF a batch settings save request contains invalid values (non-integer where integer required, value outside allowed min/max bounds, `sendDelayMin` greater than `sendDelayMax`, `sendWindowStart` equal to or later than `sendWindowEnd`, or unrecognized timezone string), THEN THE Settings route SHALL reject the request with a 400 status and an error message indicating which field failed validation.

### Requirement 4: Throttled Email Sending via Brevo SMTP

**User Story:** As an operator, I want to send emails to 600+ leads using Brevo SMTP relay with rate limiting and human-like delays, so that emails are delivered reliably without triggering spam filters or exceeding Brevo's daily quota.

#### Acceptance Criteria

1. WHEN a POST request is sent to `/api/batch/send-emails` with a list of lead IDs and an email type (email1, email2, or email3), THE Email_Sender SHALL create a Send_Queue containing only leads that have a non-empty email address, exclude leads where `emailBounced` is true, and begin sequential processing, returning an immediate HTTP 202 response with the queue size and job status.
2. WHEN a POST request is sent to `/api/batch/send-emails` without lead IDs and with `emailType: "auto"`, THE Email_Sender SHALL automatically queue all eligible leads across all email types in priority order: email3 first (follow-up 2 due), then email2 (follow-up 1 due), then email1 (new cold outreach) — using the same pipeline eligibility rules (email1: status "Discovered" with `previewUrl` set; email2: "Reached Out" with `dateEmail1Sent` 3+ days ago and `dateFollowUp1Sent` null; email3: "Reached Out" with `dateFollowUp1Sent` 3+ days ago and `dateFollowUp2Sent` null), excluding leads without an email address and leads where `emailBounced` is true.
3. WHEN a POST request is sent to `/api/batch/send-emails` without lead IDs and with a specific `emailType` (email1, email2, or email3), THE Email_Sender SHALL queue only leads eligible for that specific email type using the same pipeline state rules.
4. IF the resulting Send_Queue is empty (no eligible leads match the criteria), THEN THE Email_Sender SHALL return HTTP 200 with status "complete" and a count of zero without starting background processing.
5. THE Email_Sender SHALL use the existing Nodemailer transport configured with Brevo SMTP settings (`smtp-relay.brevo.com`, port 587, Brevo login as username, SMTP Key as password, `smtp.brevo.fromAddress` as sender) and SHALL NOT use the corporate proxy.
6. WHEN an email is sent successfully and the next lead is pending in the queue, THE Email_Sender SHALL wait a uniformly random delay between `sendDelayMin` and `sendDelayMax` seconds (integers, from batch settings, default 60–120 seconds) before attempting the next send.
7. WHILE the current time is outside the configured Send_Window (default 08:00–17:00 in the configured `sendWindowTimezone`, default "Europe/Zurich"), THE Email_Sender SHALL pause processing and resume at the next `sendWindowStart` time in the configured timezone.
8. WHEN the daily send count reaches `maxEmailsPerDay` (default 250), THE Email_Sender SHALL pause processing and resume at the next `sendWindowStart` time following UTC midnight (the first moment the new day's quota is available AND the send window is open).
9. WHEN an email is sent successfully, THE Email_Sender SHALL update the lead's pipeline state identically to the existing single-send endpoint: email1 sets status to "Reached Out" and `dateEmail1Sent` to today; email2 sets `dateFollowUp1Sent` to today; email3 sets `dateFollowUp2Sent` to today and `calendlySent` to true — and append a corresponding entry to the lead's `activityLog`.

### Requirement 5: Daily Quota Tracking

**User Story:** As an operator, I want the system to track how many emails have been sent today and automatically stop at the daily limit, so that I never exceed Brevo's 300/day free-tier cap.

#### Acceptance Criteria

1. THE Quota_Tracker SHALL persist send counts to `server/data/send-quota.json` with the structure: `{ date: "YYYY-MM-DD", count: number, lastSentAt: ISO timestamp }`.
2. WHEN the Quota_Tracker reads `send-quota.json` and the stored `date` does not match today's date (UTC), THE Quota_Tracker SHALL treat the count as zero (lazy reset on read, without requiring a background process).
3. WHEN the Quota_Tracker count equals or exceeds `maxEmailsPerDay` from batch settings, THE Email_Sender SHALL stop sending and set its persisted queue status to "paused_quota".
4. THE Quota_Tracker SHALL increment the count and write to disk atomically (write to temp file then rename) after each successful email send, before processing the next lead.
5. THE Quota_Tracker SHALL be consulted by the Email_Sender before each send attempt to prevent exceeding the daily limit.
6. IF writing to `send-quota.json` fails (disk I/O error), THEN THE Email_Sender SHALL pause sending and set status to "paused_quota" to avoid exceeding the limit without tracking.
7. IF `send-quota.json` is missing or contains invalid JSON on read, THEN THE Quota_Tracker SHALL treat the current count as zero and create a fresh file on the next successful write.

### Requirement 6: Send Queue Persistence and Resume

**User Story:** As an operator, I want to stop and restart the email sending process without losing progress, so that I can run sends across multiple days and recover from interruptions.

#### Acceptance Criteria

1. THE Email_Sender SHALL persist queue state to `server/data/send-queue-state.json` after each send completes (success or failure) and on every status transition, including: full queue (lead IDs + email types), completed IDs, failed IDs (with error reason string, max 500 characters per entry), current status (idle, sending, paused_quota, paused_window, stopped, complete), and a `lastUpdatedAt` ISO timestamp.
2. WHEN a POST request is sent to `/api/batch/send-stop`, THE Email_Sender SHALL stop processing after the current send completes (within 120 seconds), set status to "stopped", persist state to disk, and return HTTP 200 with the current queue state summary.
3. WHEN a POST request is sent to `/api/batch/send-emails` with `resume: true`, THE Email_Sender SHALL load the persisted queue state and resume processing from the next lead not present in the completed or failed lists, preserving the original queue order.
4. WHEN a new send request (with `resume: false` or without `resume`) arrives while the queue status is "sending", "paused_quota", or "paused_window", THE Email_Sender SHALL reject with HTTP 409 and an error message indicating that a send is already in progress.
5. IF an email send fails (SMTP error, bounce), THEN THE Email_Sender SHALL add the lead ID and error reason to the failed list in the persisted state, skip to the next lead, and continue processing.
6. IF the persisted state file is missing or contains invalid JSON when `resume: true` is requested, THEN THE Email_Sender SHALL reject with HTTP 400 and an error message indicating no resumable queue exists.
7. WHEN a POST request is sent to `/api/batch/send-emails` with `resume: false` or without `resume` while the queue status is "stopped" or "complete", THE Email_Sender SHALL reset the state file and start a new queue from the provided leads.

### Requirement 7: Send Status and Monitoring

**User Story:** As an operator, I want to check the current status of email sending (progress, quota, next send time), so that I can monitor the multi-day send campaign.

#### Acceptance Criteria

1. WHEN a GET request is sent to `/api/batch/send-status`, THE Email_Sender SHALL return a JSON response including: status (one of: idle, sending, paused_quota, paused_window, stopped, complete), total queued count, completed count, failed count, daily quota used, daily quota limit (from batch settings `maxEmailsPerDay`), estimated next send time as an ISO 8601 timestamp, and send window status (one of: "open", "closed").
2. IF no batch send has ever been initiated, THEN THE Email_Sender SHALL return status "idle" with all numeric counts at zero, daily quota used from the Quota_Tracker, and send window status reflecting the current time relative to the configured Send_Window.
3. THE send status response SHALL include a `failedLeads` array where each entry contains the lead ID, business name, and the SMTP error message string, limited to the 100 most recent failures (most recent first).
4. WHILE the Email_Sender status is "paused_quota", THE send status SHALL include `pauseReason` set to "quota_reached" and `estimatedResumeTime` set to the next UTC midnight (00:00:00Z of the following day).
5. WHILE the Email_Sender status is "paused_window", THE send status SHALL include `pauseReason` set to "outside_window" and `estimatedResumeTime` set to the next occurrence of `sendWindowStart` in the configured `sendWindowTimezone`.

### Requirement 8: Bounce and Error Handling

**User Story:** As an operator, I want hard-bounced email addresses to be automatically skipped in future sends, so that I maintain good sender reputation and avoid wasting quota on undeliverable addresses.

#### Acceptance Criteria

1. IF an email send returns a hard bounce error (5xx SMTP response code), THEN THE Email_Sender SHALL mark the lead with `emailBounced: true` and store the SMTP response message as `emailBounceReason` in the lead record.
2. WHEN building the Send_Queue (either from explicit lead IDs or automatic eligibility), THE Email_Sender SHALL exclude leads where `emailBounced` is true.
3. IF an email send returns a transient error (4xx SMTP response or network timeout exceeding 30 seconds), THEN THE Email_Sender SHALL log the error, add the lead to the failed list with error type "transient" and the error message, skip to the next lead, and continue processing.
4. THE failed list entries SHALL include: lead ID, lead businessName, error type ("hard_bounce" or "transient"), and the SMTP error message string (max 500 characters).

### Requirement 9: Brevo SMTP Transport Configuration

**User Story:** As an operator, I want to configure Brevo SMTP settings separately from the corporate SMTP, so that batch sending uses Brevo's relay without needing the corporate proxy.

#### Acceptance Criteria

1. THE Settings SHALL accept Brevo-specific SMTP fields under `smtp.brevo`: `host` (string, max 253 characters, default "smtp-relay.brevo.com"), `port` (integer 1–65535, default 587), `username` (string, max 254 characters, Brevo login email), `password` (string, max 128 characters, Brevo SMTP Key), `fromAddress` (string, valid email format, required — must match a verified sender domain in Brevo, e.g., `outreach@kaelint.ch`).
2. WHEN the Email_Sender creates a Nodemailer transport for batch sending, THE Email_Sender SHALL use the Brevo SMTP settings (host, port, username, password) and `smtp.brevo.fromAddress` as the envelope sender, and SHALL NOT use the corporate proxy (`useProxy: false`).
3. IF a batch send request is received and `smtp.brevo.host` or `smtp.brevo.username` or `smtp.brevo.password` or `smtp.brevo.fromAddress` is empty or missing, THEN THE Email_Sender SHALL reject the request with HTTP 400 and an error message indicating which Brevo SMTP field must be configured.
4. THE Settings route SHALL mask the Brevo SMTP password in GET responses by replacing a non-empty password value with the literal string `********`.
5. WHEN the Settings route receives a PUT request where `smtp.brevo.password` equals `********`, THE Settings route SHALL preserve the previously stored Brevo SMTP password instead of overwriting it with the mask value.

### Requirement 10: Unit and Property-Based Tests

**User Story:** As a developer, I want comprehensive automated tests for all new batch modules, so that regressions are caught immediately and the existing 272 tests continue to pass.

#### Acceptance Criteria

1. THE feature SHALL include Jest unit tests for all new modules: `batchPreviewGenerator.js`, `batchSender.js`, `quotaTracker.js`, and the batch route handlers.
2. ALL 272 existing unit tests and 8 property-based tests SHALL continue to pass without modification after the feature is implemented (`npm test` exits with code 0).
3. THE unit tests SHALL cover: success paths, error paths (build failure, SMTP error, disk I/O failure), quota exhaustion, send window enforcement, resume logic, and concurrent build limiting.
4. THE feature SHALL include fast-check property-based tests for: quota never exceeds `maxEmailsPerDay` across any sequence of sends, random delay is always within [sendDelayMin, sendDelayMax], and batch state transitions are valid (no illegal status jumps).
5. THE unit tests SHALL mock external dependencies (child_process.execSync for Astro builds, Nodemailer transport for email sends, filesystem for state persistence) to ensure tests run fast and deterministically.

### Requirement 11: Documentation and Steering File Updates

**User Story:** As a developer, I want all project documentation updated to reflect the batch automation feature, so that future contributors understand the full system capabilities.

#### Acceptance Criteria

1. THE `.kiro/steering/project-context.md` file SHALL be updated to document: the new batch API endpoints, batch settings configuration fields, Brevo SMTP setup, quota tracking mechanism, and the batch preview generation architecture.
2. THE "API Endpoints" table in the steering file SHALL include all new endpoints: `POST /api/batch/generate-previews`, `GET /api/batch/preview-status`, `POST /api/batch/send-emails`, `GET /api/batch/send-status`, `POST /api/batch/send-stop`.
3. THE "Testing Approach" section in the steering file SHALL be updated with the new test count and coverage areas (batch modules, quota tracker, send queue).
4. THE "Key Commands" section SHALL include any new npm scripts added for batch operations (if applicable).
5. THE "Preview Site Generation" section SHALL document the batch generation capability and single-deploy-at-end architecture.

