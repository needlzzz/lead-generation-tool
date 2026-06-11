# Implementation Plan: Batch Automation

## Overview

Implements batch preview generation and throttled email sending for the Lead Generation CRM. The implementation introduces three new modules (`quotaTracker.js`, `batchSender.js`, `batchPreviewGenerator.js`), one new route file (`routes/batch.js`), extends the settings route with batch and Brevo SMTP config, and includes comprehensive Jest unit tests and fast-check property-based tests.

## Tasks

- [x] 1. Implement quota tracker module
  - [x] 1.1 Create `server/lib/quotaTracker.js` with `getCount`, `increment`, and `canSend` functions
    - Read `server/data/send-quota.json` with lazy day reset (compare stored date to UTC today)
    - Atomic write via temp file + `fs.renameSync`
    - Handle missing/corrupt file as count=0
    - Throw on I/O write failure (caller pauses sending)
    - `canSend()` checks `count < settings.batch.maxEmailsPerDay`
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7_

  - [x] 1.2 Write unit tests for quotaTracker
    - Test day reset logic (stale date → count=0)
    - Test increment + atomic write
    - Test I/O failure handling (mock fs.writeFileSync to throw)
    - Test missing/corrupt file scenarios
    - Test canSend boundary (count equals maxEmailsPerDay)
    - _Requirements: 10.1, 10.3, 10.5_

  - [x] 1.3 Write property test for quota invariant
    - **Property 1: Quota Invariant**
    - For any sequence of increment calls within a day, count SHALL never exceed `maxEmailsPerDay`
    - **Validates: Requirements 5.3, 5.4, 5.5**

- [x] 2. Implement batch sender module
  - [x] 2.1 Create `server/lib/batchSender.js` with `start`, `stop`, `resume`, `getStatus`, and `isRunning` functions
    - Sequential email processing loop (background async)
    - Brevo transport creation (host, port, username, password, no proxy)
    - Send window check using `Intl.DateTimeFormat` with configured timezone
    - Quota check before each send via `quotaTracker.canSend()`
    - Random delay between sends: `Math.floor(Math.random() * (max - min + 1)) + min`
    - Pause/poll mechanism (60s interval for quota and window pauses)
    - Graceful stop via flag (finishes current send)
    - _Requirements: 4.5, 4.6, 4.7, 4.8, 6.1, 6.2, 6.3, 6.4, 6.5_

  - [x] 2.2 Implement send queue state persistence in batchSender
    - Persist to `server/data/send-queue-state.json` after each send and on status transitions
    - Include: queue, completed IDs, failed entries (leadId, businessName, errorType, error max 500 chars), status, lastUpdatedAt
    - Resume logic: load state, filter queue against completed+failed, continue in order
    - _Requirements: 6.1, 6.3, 6.6, 6.7_

  - [x] 2.3 Implement lead pipeline state updates and bounce handling in batchSender
    - On success: update lead status per email type (email1→"Reached Out"+dateEmail1Sent, email2→dateFollowUp1Sent, email3→dateFollowUp2Sent+calendlySent)
    - Append activity log entry
    - On SMTP 5xx: mark `emailBounced: true`, store `emailBounceReason`, add to failed as "hard_bounce"
    - On SMTP 4xx / timeout (30s): add to failed as "transient", skip to next
    - _Requirements: 4.9, 8.1, 8.2, 8.3, 8.4_

  - [x] 2.4 Implement auto-eligibility queue builder in batchSender
    - Priority order: email3 (follow-up 2 due) → email2 (follow-up 1 due) → email1 (new cold outreach)
    - Eligibility rules per email type matching existing pipeline logic
    - Exclude leads without email address and leads where `emailBounced` is true
    - _Requirements: 4.1, 4.2, 4.3, 4.4_

  - [x] 2.5 Write unit tests for batchSender
    - Test success flow (mock Nodemailer transport)
    - Test quota pause + resume
    - Test window pause + resume (mock Intl.DateTimeFormat)
    - Test stop mechanism (finishes current send)
    - Test resume from persisted state
    - Test hard bounce handling (5xx → emailBounced)
    - Test transient error handling (4xx → skip)
    - Test auto-queue builder priority ordering
    - Test empty queue (no eligible leads)
    - _Requirements: 10.1, 10.3, 10.5_

  - [x] 2.6 Write property test for delay bounds
    - **Property 2: Delay Bounds**
    - The random delay SHALL always be within `[sendDelayMin, sendDelayMax]` (inclusive) for any valid min/max combination
    - **Validates: Requirements 4.6**

  - [x] 2.7 Write property test for bounce permanence
    - **Property 6: Bounce Permanence**
    - A lead marked `emailBounced: true` SHALL never appear in any generated send queue
    - **Validates: Requirements 8.1, 8.2**

- [x] 3. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. Implement batch preview generator module
  - [x] 4.1 Create `server/lib/batchPreviewGenerator.js` with `start`, `resume`, `getStatus`, and `isRunning` functions
    - Implement Semaphore and ConcurrencyPool inline helper classes
    - Process queue with configurable concurrency from `settings.batch.previewConcurrency`
    - Serialize asset-copy → build → cleanup via semaphore (1 permit)
    - Allow parallel config gen, slug creation, and screenshot capture
    - SSE event per lead per status transition (queued, building, built, screenshot, complete, failed)
    - _Requirements: 1.5, 1.6, 1.7, 2.1_

  - [x] 4.2 Implement batch state persistence and skip logic in batchPreviewGenerator
    - Persist to `server/data/batch-preview-state.json`: queue, completed, failed (with error), status, startedAt, lastUpdatedAt
    - Skip leads with existing deployed, non-expired preview matching current data hash
    - On failure: record lead ID + error, continue processing
    - On batch complete: update status with summary (total, succeeded, failed, durationSeconds)
    - _Requirements: 2.1, 2.4, 2.5, 2.6_

  - [x] 4.3 Implement single deploy at end of batch in batchPreviewGenerator
    - After all builds complete, execute `deploy-previews.mjs` once (timeout 300s)
    - On deploy success: bulk-update all completed registry entries to "deployed"
    - On deploy failure: all entries stay "built", emit SSE "deploy_failed"
    - Only deploy if at least one build succeeded
    - _Requirements: 1.8, 1.9, 1.10_

  - [x] 4.4 Implement resume logic for batchPreviewGenerator
    - On server restart with state "running"/"deploying": mark as resumable
    - Resume via POST with `resume: true`: continue from first lead not in completed/failed
    - _Requirements: 2.3_

  - [x] 4.5 Write unit tests for batchPreviewGenerator
    - Test concurrency limiting (mock execSync, verify semaphore behavior)
    - Test failure skip (single lead fails, rest continue)
    - Test deploy-once (verify execSync called once for deploy)
    - Test state persistence on each completion/failure
    - Test skip logic (existing valid preview → no-op)
    - Test resume from partial state
    - _Requirements: 10.1, 10.3, 10.5_

  - [x] 4.6 Write property test for state machine validity
    - **Property 3: State Machine Validity**
    - Batch state transitions SHALL only follow: `idle → running → deploying → complete` or `idle → running → failed`. No backward transitions.
    - **Validates: Requirements 2.1, 2.4**

  - [x] 4.7 Write property test for send queue monotonicity
    - **Property 4: Send Queue Monotonicity**
    - A lead in `completed` or `failed` SHALL never be re-processed in the same batch run
    - **Validates: Requirements 6.3, 6.5**

  - [x] 4.8 Write property test for single deploy
    - **Property 5: Single Deploy**
    - During a batch preview run, `deploy-previews.mjs` SHALL be invoked at most once
    - **Validates: Requirements 1.8**

- [x] 5. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 6. Extend settings route with batch and Brevo SMTP configuration
  - [x] 6.1 Add batch settings and Brevo SMTP fields to `server/routes/settings.js`
    - Add `batch` object to DEFAULT_SETTINGS with all 7 fields (previewConcurrency, maxEmailsPerDay, sendDelayMin, sendDelayMax, sendWindowStart, sendWindowEnd, sendWindowTimezone)
    - Add `smtp.brevo` nested object (host, port, username, password, fromAddress)
    - Merge with defaults on GET (ensure new fields always present)
    - Mask Brevo password in GET response (replace with "********")
    - Preserve stored Brevo password on PUT when value is "********"
    - _Requirements: 3.1, 3.2, 3.3, 9.1, 9.4, 9.5_

  - [x] 6.2 Add batch settings validation to settings PUT handler
    - Validate: previewConcurrency 1-10, maxEmailsPerDay 1-1000, sendDelayMin/Max 1-3600
    - Validate: sendDelayMin ≤ sendDelayMax, sendWindowStart < sendWindowEnd
    - Validate: sendWindowTimezone is valid IANA timezone (via Intl.DateTimeFormat)
    - Return HTTP 400 with specific field error message on invalid input
    - _Requirements: 3.4, 9.3_

  - [x] 6.3 Write unit tests for settings batch validation
    - Test valid batch settings accepted
    - Test each validation rule rejection (out of bounds, min > max, invalid timezone)
    - Test Brevo password masking and preservation
    - Test merge with defaults when batch fields missing
    - _Requirements: 10.1, 10.3_

- [x] 7. Create batch routes and wire into Express app
  - [x] 7.1 Create `server/routes/batch.js` with all 5 batch endpoints
    - `POST /generate-previews`: validate leadIds (max 1000) or auto-select eligible leads, reject 409 if running, support resume, stream SSE
    - `GET /preview-status`: return current batch state
    - `POST /send-emails`: validate Brevo config, build queue (auto or explicit), return HTTP 202, start background processing
    - `GET /send-status`: return send state + quota + failed leads (max 100 most recent)
    - `POST /send-stop`: graceful stop, return current state
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 2.2, 2.7, 4.1, 4.2, 4.3, 4.4, 6.2, 6.4, 7.1, 7.2, 7.3, 7.4, 7.5, 9.3_

  - [x] 7.2 Mount batch router in `server/index.js`
    - Add `app.use('/api/batch', require('./routes/batch'));`
    - _Requirements: 1.1_

  - [x] 7.3 Write unit tests for batch route handlers
    - Test POST /generate-previews request validation (invalid IDs, max 1000, 409 conflict)
    - Test POST /send-emails request validation (missing Brevo config → 400, empty queue → 200)
    - Test POST /send-stop returns current state
    - Test GET endpoints return correct shapes
    - Test resume with missing/invalid state file → 400
    - _Requirements: 10.1, 10.3, 10.5_

- [x] 8. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 9. Update documentation
  - [x] 9.1 Update `.kiro/steering/project-context.md` with batch automation documentation
    - Document new batch API endpoints in the "API Endpoints" table
    - Document batch settings fields and Brevo SMTP configuration
    - Document quota tracking mechanism and send-quota.json
    - Document batch preview generation architecture (semaphore, single deploy)
    - Update "Testing Approach" section with new test count and coverage areas
    - Update "Key Commands" section if new npm scripts are added
    - Update "Preview Site Generation" section with batch capability
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5_

- [x] 10. Final verification
  - [x] 10.1 Run full test suite and verify all tests pass
    - Run `npm test` — all existing 272 unit tests + 8 property tests must pass
    - All new unit tests and property tests must pass
    - No modifications to existing tests
    - _Requirements: 10.2_

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties from the design document
- Unit tests validate specific examples and edge cases
- All external dependencies are mocked: `child_process.execSync` for builds, Nodemailer transport for emails, `fs` for state persistence
- No new npm packages needed — uses existing Nodemailer, Node.js built-ins (crypto, fs, child_process, Intl)
- The implementation language is JavaScript (Node.js), matching the existing project

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "6.1"] },
    { "id": 1, "tasks": ["1.2", "1.3", "6.2"] },
    { "id": 2, "tasks": ["2.1", "6.3"] },
    { "id": 3, "tasks": ["2.2", "2.3", "2.4"] },
    { "id": 4, "tasks": ["2.5", "2.6", "2.7", "4.1"] },
    { "id": 5, "tasks": ["4.2", "4.3", "4.4"] },
    { "id": 6, "tasks": ["4.5", "4.6", "4.7", "4.8"] },
    { "id": 7, "tasks": ["7.1"] },
    { "id": 8, "tasks": ["7.2", "7.3"] },
    { "id": 9, "tasks": ["9.1"] },
    { "id": 10, "tasks": ["10.1"] }
  ]
}
```
