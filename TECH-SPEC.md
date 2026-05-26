# Tech Spec: Lead Generation CRM

## Overview

A local, self-hosted CRM tool for discovering local businesses with outdated or missing websites, sending personalized cold outreach emails in German, tracking follow-ups on a timed schedule, and managing the full sales pipeline from discovery through close. Built for a freelance web designer targeting businesses in Zürich across configurable niches. All data stays local, all categories and email templates are editable through the UI.

## Tech Stack

| Layer        | Choice              | Reason                                                        |
|--------------|---------------------|---------------------------------------------------------------|
| Runtime      | Node.js             | Required for Playwright scraper and Nodemailer                |
| Backend      | Express             | Minimal HTTP server, serves API + static files                |
| Frontend     | Plain HTML/CSS/JS   | No build step, no framework overhead, opens in any browser    |
| Persistence  | JSON files on disk   | No database setup, survives browser cache clears, easy backup |
| Scraper      | Playwright           | Headless Chrome for Google Maps, handles dynamic content      |
| Email        | Nodemailer           | Configurable SMTP, works with Gmail/Brevo/any provider       |
| Testing      | Jest                 | Standard Node.js test runner, good mocking support            |

## Project Structure

```
lead-generation-tool/
├── server/
│   ├── index.js                  # Express app entry point
│   ├── routes/
│   │   ├── leads.js              # Lead CRUD + pipeline actions
│   │   ├── categories.js         # Category & template CRUD
│   │   ├── settings.js           # Settings read/write
│   │   ├── scraper.js            # Scraper trigger endpoint
│   │   ├── email.js              # Email preview + send
│   │   └── csv.js                # CSV import/export
│   ├── lib/
│   │   ├── dataStore.js          # JSON file read/write layer
│   │   ├── pipeline.js           # Status transitions, follow-up logic, duplicates
│   │   ├── scraper.js            # Playwright Google Maps scraper
│   │   ├── emailService.js       # Nodemailer wrapper + template rendering
│   │   ├── csvService.js         # CSV parse/generate
│   │   ├── enrichment.js         # Email enrichment (local.ch + website scraping)
│   │   └── websiteAnalyzer.js    # Automated website quality analysis
│   └── data/
│       ├── leads.json            # Lead records (created at runtime)
│       ├── categories.json       # Category + template definitions
│       └── settings.json         # User settings + SMTP config
├── public/
│   ├── index.html                # Single-page app shell
│   ├── css/
│   │   └── styles.css            # All styles, status colors
│   └── js/
│       ├── app.js                # App initialization, tab routing
│       ├── api.js                # Fetch wrapper for all backend calls
│       ├── dashboard.js          # Status badges, due-today, reply reminders
│       ├── discovery.js          # Discovery tab: table, add lead, scraper trigger
│       ├── outreach.js           # Outreach tab: email preview, send, follow-ups
│       ├── replies.js            # Replies & meetings tab
│       ├── clients.js            # Client tracker tab
│       ├── settings.js           # Settings + SMTP modal
│       ├── categories.js         # Category & template management UI
│       └── csv.js                # CSV import/export UI handlers
├── tests/
│   ├── pipeline.test.js          # Pipeline logic tests
│   ├── dataStore.test.js         # Data store tests
│   ├── emailService.test.js      # Email rendering tests
│   └── csvService.test.js        # CSV import/export tests
├── package.json
└── README.md
```

## Data Model

### Lead

| Field             | Type     | Required | Notes                                                    |
|-------------------|----------|----------|----------------------------------------------------------|
| id                | string   | yes      | UUID v4, generated on create                             |
| businessName      | string   | yes      | Business name as discovered                              |
| category          | string   | yes      | References a Category id                                 |
| address           | string   | no       | Street address                                           |
| phone             | string   | no       | Phone number                                             |
| email             | string   | no       | Business email for outreach                              |
| websiteUrl        | string   | no       | Website URL, may be empty if none exists                 |
| websiteQuality    | enum     | yes      | One of: "None", "Poor", "Outdated", "Good", "Not a Fit"  |
| contactPerson     | string   | no       | Name of contact. If empty, templates use "Team von [businessName]" |
| status            | enum     | yes      | One of: "Discovered", "Reached Out", "Replied", "No Response", "Meeting Scheduled", "Client Won", "Lost" |
| dateDiscovered    | ISO date | yes      | Set on creation                                          |
| dateEmail1Sent    | ISO date | no       | Set when Email 1 is sent                                 |
| dateFollowUp1Sent | ISO date | no       | Set when Follow-Up 1 is sent                             |
| dateFollowUp2Sent | ISO date | no       | Set when Follow-Up 2 is sent                             |
| replyDate         | ISO date | no       | Set when user logs a reply                               |
| replySentiment    | enum     | no       | One of: "Positive", "Neutral", "Negative"                |
| calendlySent      | boolean  | no       | Whether Calendly link has been sent                      |
| meetingDate       | ISO date | no       | Set when meeting is scheduled                            |
| decision          | enum     | no       | One of: "Won", "Lost", "Pending"                         |
| startDate         | ISO date | no       | Set when client is won and work begins                   |
| notes             | string   | no       | Free-text notes                                          |
| activityLog       | array    | yes      | Array of `{ date: ISO, action: string, details: string }` |
| websiteScore      | number   | no       | Quality score 0-100 from automated analysis              |
| websiteIssues     | array    | no       | Array of `{ id: string, label: string, detail: string }` (German) |
| websiteLoadTime   | number   | no       | Page load time in milliseconds                           |
| websiteAnalyzedAt | ISO date | no       | When the website was last analyzed                       |

### Category

| Field      | Type   | Required | Notes                                              |
|------------|--------|----------|----------------------------------------------------|
| id         | string | yes      | UUID v4                                            |
| name       | string | yes      | Display name (e.g. "Gyms")                         |
| searchTerm | string | yes      | Google Maps search query (e.g. "Fitnessstudio Zürich") |
| tone       | enum   | yes      | "formal" or "casual"                               |
| templates  | object | yes      | `{ email1: {subject, body}, email2: {subject, body}, email3: {subject, body} }` |

### Settings

| Field         | Type   | Required | Notes                                    |
|---------------|--------|----------|------------------------------------------|
| userName      | string | yes      | Replaces `[Dein Name]` in templates      |
| calendlyLink  | string | yes      | Replaces `[CALENDLY-LINK]` in templates  |
| smtp.host     | string | yes      | SMTP server hostname                     |
| smtp.port     | number | yes      | SMTP port (587 for TLS)                  |
| smtp.username | string | yes      | SMTP login                               |
| smtp.password | string | yes      | SMTP password / app password             |
| smtp.fromAddress | string | yes   | "From" address on outgoing emails        |
| smtp.useProxy   | boolean | no   | Route SMTP through corporate HTTP proxy   |

## API / Routes

### `GET /api/leads`

- **Purpose:** Get all leads, optionally filtered
- **Query params:** `?category=Gyms&status=Discovered`
- **Response:** `{ leads: Lead[] }`
- **Errors:** 500 if data file unreadable

### `GET /api/leads/:id`

- **Purpose:** Get a single lead with full activity log
- **Response:** `{ lead: Lead }`
- **Errors:** 404 if not found

### `POST /api/leads`

- **Purpose:** Create a new lead
- **Request body:** `{ businessName, category, address?, phone?, email?, websiteUrl?, websiteQuality, contactPerson? }`
- **Response:** `{ lead: Lead, duplicateWarning?: { field: string, existingLead: { id, businessName } } }`
- **Behavior:** Sets status to "Discovered", dateDiscovered to now, creates initial activity log entry. If duplicate detected, includes warning but still creates the lead.
- **Errors:** 400 if businessName or category missing

### `PATCH /api/leads/:id`

- **Purpose:** Update lead fields (notes, contactPerson, websiteQuality, etc.)
- **Request body:** `{ [field]: value }` — only updatable fields
- **Response:** `{ lead: Lead }`
- **Errors:** 404 if not found, 400 if invalid field

### `POST /api/leads/:id/transition`

- **Purpose:** Execute a pipeline status transition
- **Request body:** `{ action: string, data?: object }`
- **Valid actions and their effects:**
  - `"send-email-1"` — Sets status to "Reached Out", sets dateEmail1Sent, logs activity. Requires lead to have email address and status "Discovered".
  - `"send-followup-1"` — Sets dateFollowUp1Sent, logs activity. Requires status "Reached Out" and dateEmail1Sent set.
  - `"send-followup-2"` — Sets dateFollowUp2Sent, sets calendlySent to true, logs activity. Requires dateFollowUp1Sent set.
  - `"mark-no-response"` — Sets status to "No Response". Requires status "Reached Out".
  - `"log-reply"` — Sets status to "Replied", sets replyDate and replySentiment from `data`. Requires `data.replyDate` and `data.replySentiment`.
  - `"schedule-meeting"` — Sets status to "Meeting Scheduled", sets meetingDate from `data`. Requires `data.meetingDate`.
  - `"mark-won"` — Sets status to "Client Won", decision to "Won", startDate from `data`.
  - `"mark-lost"` — Sets status to "Lost", decision to "Lost".
  - `"mark-not-a-fit"` — Sets status to "Lost" from "Discovered". For leads with modern websites.
- **Response:** `{ lead: Lead }`
- **Errors:** 400 if transition is invalid for current status, 404 if not found

### `DELETE /api/leads/:id`

- **Purpose:** Delete a lead
- **Response:** `{ success: true }`
- **Errors:** 404 if not found

### `GET /api/leads/due-today`

- **Purpose:** Get leads with follow-ups due today or overdue
- **Response:** `{ followUp1Due: Lead[], followUp2Due: Lead[], markColdDue: Lead[] }`
- **Logic:** For each lead with status "Reached Out": if dateEmail1Sent + 3 days <= today and no dateFollowUp1Sent → followUp1Due. If dateEmail1Sent + 6 days <= today and dateFollowUp1Sent set but no dateFollowUp2Sent → followUp2Due. If dateEmail1Sent + 7 days <= today and dateFollowUp2Sent set → markColdDue.

### `GET /api/leads/check-replies`

- **Purpose:** Get leads in outreach stages for inbox checking
- **Response:** `{ leads: Array<{ id, businessName, email, status, dateEmail1Sent, lastActivityDate }> }`
- **Logic:** Returns all leads with status "Reached Out" that have an email address, sorted by dateEmail1Sent ascending.

### `GET /api/categories`

- **Purpose:** Get all categories with templates
- **Response:** `{ categories: Category[] }`

### `POST /api/categories`

- **Purpose:** Create a new category
- **Request body:** `{ name, searchTerm, tone, templates }`
- **Response:** `{ category: Category }`
- **Errors:** 400 if name or searchTerm missing

### `PUT /api/categories/:id`

- **Purpose:** Update a category and its templates
- **Request body:** `{ name?, searchTerm?, tone?, templates? }`
- **Response:** `{ category: Category }`
- **Errors:** 404 if not found

### `DELETE /api/categories/:id`

- **Purpose:** Delete a category
- **Response:** `{ success: true }`
- **Errors:** 400 if leads exist using this category, 404 if not found

### `GET /api/settings`

- **Purpose:** Get current settings (SMTP password masked in response)
- **Response:** `{ settings: Settings }` with smtp.password replaced by `"********"` if set
- **Errors:** Returns empty defaults if settings.json doesn't exist

### `PUT /api/settings`

- **Purpose:** Save settings
- **Request body:** `{ userName, calendlyLink, smtp: { host, port, username, password, fromAddress, useProxy } }`
- **Behavior:** If smtp.password is `"********"`, keep the existing password (don't overwrite with mask). If useProxy is true, SMTP connections route through `http://aproxy.corproot.net:8080`.
- **Response:** `{ settings: Settings }` (masked)
- **Errors:** 400 if userName or calendlyLink missing

### `POST /api/settings/test-smtp`

- **Purpose:** Test SMTP connection with verbose error reporting
- **Request body:** `{}` (uses saved settings)
- **Response:** `{ success: true, message: "SMTP connection to host:port successful (user: x)" }` or `{ success: false, error: "SMTP test failed [ECONNREFUSED]: Host: ... | Port: ... | Error: ..." }`
- **Behavior:** Saves current form values first, then calls `transport.verify()`. Reports error code, host, port, user, secure mode, and proxy status.

### `POST /api/settings/send-test-email`

- **Purpose:** Send a real test email to verify delivery
- **Request body:** `{ to: "recipient@example.com" }`
- **Response:** `{ success: true, message: "Test email sent to ..." }`
- **Behavior:** Sends a test email with SMTP config details in the body. Uses saved settings.

### `POST /api/scraper/discover`

- **Purpose:** Run Google Maps scraper for a category
- **Request body:** `{ categoryId: string }`
- **Behavior:** Looks up category's searchTerm, launches Playwright, scrapes results, creates leads with status "Discovered". Returns created leads with duplicate warnings.
- **Response:** `{ leads: Lead[], duplicates: Array<{ businessName, existingLeadId }> }`
- **Errors:** 400 if category not found, 500 if scraper fails (timeout, blocked, etc.)

### `POST /api/scraper/analyze-websites`

- **Purpose:** Analyze website quality for leads (SSE stream)
- **Request body:** `{ leadIds?: string[] }` — if empty, analyzes all discovered/reached-out leads with websites
- **Behavior:** Launches Playwright, visits each lead's website, checks SSL, mobile-friendliness, speed, SEO, accessibility, outdated tech, copyright year, mixed content. Scores 0-100, assigns quality label (Poor/Outdated/Good). Saves results immediately per-lead.
- **SSE events:** `start`, `progress`, `result` (per lead with quality/score/issues), `error-single`, `done`
- **Stored fields:** `websiteQuality`, `websiteScore`, `websiteIssues[]`, `websiteLoadTime`, `websiteAnalyzedAt`
- **Issue format:** `{ id: "no-ssl", label: "Kein SSL-Zertifikat", detail: "Die Website verwendet kein HTTPS..." }`

### `POST /api/email/preview`

- **Purpose:** Generate email preview with placeholders filled
- **Request body:** `{ leadId: string, emailType: "email1" | "email2" | "email3" }`
- **Response:** `{ subject: string, body: string, to: string }`
- **Behavior:** Looks up lead data and category templates, substitutes all placeholders. Uses contactPerson if set, otherwise "Team von [businessName]".
- **Errors:** 400 if lead has no email, 404 if lead or category not found

### `POST /api/email/send`

- **Purpose:** Send an email and log the action
- **Request body:** `{ leadId: string, emailType: "email1" | "email2" | "email3" }`
- **Behavior:** Renders template, sends via SMTP, executes the corresponding pipeline transition (send-email-1, send-followup-1, or send-followup-2).
- **Response:** `{ success: true, lead: Lead }`
- **Errors:** 400 if SMTP not configured, 500 if send fails

### `POST /api/csv/import`

- **Purpose:** Import leads from CSV
- **Request body:** multipart form with CSV file
- **Expected CSV columns:** `Business Name, Category, Address, Phone, Email, Website URL, Website Quality, Contact Person`
- **Behavior:** Parses CSV, validates rows, creates leads. Returns created leads and any duplicate warnings. Skips rows with missing Business Name. Category must match an existing category name.
- **Response:** `{ imported: number, skipped: number, leads: Lead[], duplicates: Array<{row, businessName, reason}> }`
- **Errors:** 400 if CSV is unparseable

### `GET /api/csv/export`

- **Purpose:** Export leads as CSV
- **Query params:** `?tab=discovery|outreach|replies|clients` — determines which columns to include
- **Response:** CSV file download with appropriate columns per tab

## Features & Acceptance Criteria

### Feature 1: Lead Discovery via Scraper

**Description:** User selects a category, clicks "Discover Leads", the tool scrapes Google Maps and populates the Discovery tab with results.

**Acceptance criteria:**
- [ ] Clicking "Discover Leads" with a selected category triggers the scraper
- [ ] Scraper extracts: business name, address, phone, website URL from Google Maps results
- [ ] Each scraped business is created as a lead with status "Discovered" and today's date
- [ ] Duplicate businesses (same name or URL as existing leads) are flagged with a warning badge in the results
- [ ] If scraper fails (timeout, CAPTCHA), an error message is shown and no partial data is saved
- [ ] A loading indicator is shown during scraping

### Feature 2: CSV Import

**Description:** User uploads a CSV file to bulk-import leads.

**Acceptance criteria:**
- [ ] "Import CSV" button opens a file picker accepting .csv files
- [ ] CSV is parsed and leads are created with status "Discovered"
- [ ] Rows missing "Business Name" are skipped and counted in the result summary
- [ ] Rows with a "Category" that doesn't match any existing category are skipped
- [ ] Duplicate warnings are shown for leads matching existing business names or URLs
- [ ] After import, a summary shows: X imported, Y skipped, Z duplicates

### Feature 3: CSV Export

**Description:** Each tab has a CSV export button that downloads the visible data.

**Acceptance criteria:**
- [ ] Discovery tab exports: Business Name, Category, Address, Phone, Email, Website URL, Website Quality, Date Discovered
- [ ] Outreach tab exports: Business Name, Category, Email, Status, Date Email 1, Date Follow-Up 1, Date Follow-Up 2, Last Activity
- [ ] Replies tab exports: Business Name, Reply Date, Sentiment, Calendly Sent, Meeting Date, Notes
- [ ] Clients tab exports: Business Name, Meeting Date, Decision, Start Date, Notes
- [ ] Exported CSV uses UTF-8 encoding with BOM for Excel compatibility with German characters
- [ ] File is named `{tab-name}-export-{YYYY-MM-DD}.csv`

### Feature 4: Email Preview & Send

**Description:** User previews a personalized email for a lead, then sends it via SMTP.

**Acceptance criteria:**
- [ ] Clicking "Send Email" on a lead opens a preview modal showing the rendered subject and body
- [ ] All placeholders are replaced: `[Name]` with contactPerson or "Team von [businessName]", `[Business Name]` with businessName, `[CALENDLY-LINK]` with settings.calendlyLink, `[Dein Name]` with settings.userName, `[Website-Probleme]` with issue list, `[Website-Probleme-Kurz]` with short labels, `[Website-Score]` with score
- [ ] No raw placeholder text (brackets) remains in the preview
- [ ] "Send" button sends the email via configured SMTP and updates lead status
- [ ] If SMTP is not configured, a message directs the user to Settings
- [ ] If send fails, error is shown and status is NOT updated
- [ ] Activity log records: date, email type sent, recipient address

### Feature 5: Follow-Up Dashboard

**Description:** On load, the dashboard surfaces leads with due or overdue follow-ups.

**Acceptance criteria:**
- [ ] "Follow-Ups Due" section shows leads where Follow-Up 1 is due (3+ calendar days since Email 1, Follow-Up 1 not yet sent)
- [ ] "Follow-Ups Due" section shows leads where Follow-Up 2 is due (6+ calendar days since Email 1, Follow-Up 1 sent, Follow-Up 2 not yet sent)
- [ ] "Mark as Cold" section shows leads where 7+ calendar days since Email 1, Follow-Up 2 sent, no reply
- [ ] Each due item has a one-click action button to send the follow-up or mark as cold
- [ ] Overdue items (past due date) are visually highlighted
- [ ] Counts update immediately after an action is taken

### Feature 6: Check for Replies Reminder

**Description:** Dashboard section listing leads in outreach stages with their email addresses for quick inbox scanning.

**Acceptance criteria:**
- [ ] "Check for Replies" section lists all leads with status "Reached Out"
- [ ] Each entry shows: business name, email address, date of last email sent
- [ ] Sorted by oldest email first (most likely to have a reply)
- [ ] Each entry has a "Log Reply" button that opens the reply logging form
- [ ] Reply form requires: reply date, sentiment (Positive/Neutral/Negative), optional notes
- [ ] Logging a reply changes status to "Replied" and pauses follow-up tracking

### Feature 7: Pipeline Status Management

**Description:** Enforced status transitions ensure no step is skipped.

**Acceptance criteria:**
- [ ] A lead in "Discovered" status shows only: "Send Email 1" and "Mark as Not a Fit" actions
- [ ] A lead in "Reached Out" status shows only: "Log Reply" action (follow-ups are handled via dashboard)
- [ ] A lead in "Replied" status shows only: "Schedule Meeting" action
- [ ] A lead in "Meeting Scheduled" status shows only: "Mark as Won" and "Mark as Lost" actions
- [ ] A lead in "No Response" or "Lost" status shows no action buttons
- [ ] A lead in "Client Won" status shows no action buttons
- [ ] Attempting an invalid transition via API returns 400 with a descriptive error message
- [ ] Every transition creates an activity log entry with timestamp and details

### Feature 8: Category & Template Management

**Description:** Users can add, edit, and delete business categories and their associated email templates.

**Acceptance criteria:**
- [ ] Settings area has a "Categories & Templates" section
- [ ] Each category shows: name, search term, tone, and 3 email templates (subject + body each)
- [ ] User can add a new category with all fields
- [ ] User can edit any field of an existing category
- [ ] User can delete a category only if no leads reference it; otherwise show error
- [ ] Template editor shows available placeholders: `[Name]`, `[Business Name]`, `[CALENDLY-LINK]`, `[Dein Name]`, `[Website-Probleme]`, `[Website-Probleme-Kurz]`, `[Website-Score]`
- [ ] Four default categories are pre-loaded on first run: Gyms, Physiotherapeuten, Barbershops, Solo-Unternehmer with the German email templates from the project plan

### Feature 9: Settings Panel

**Description:** User configures personal info and SMTP credentials.

**Acceptance criteria:**
- [ ] Gear icon in header opens settings modal
- [ ] Settings form has fields: Name, Calendly Link, SMTP Host, SMTP Port, SMTP Username, SMTP Password, From Address
- [ ] On first launch, if userName or calendlyLink is empty, settings modal opens automatically
- [ ] SMTP password is masked in the form (shows dots, not cleartext)
- [ ] "Test Connection" button sends a test email to the fromAddress and reports success/failure
- [ ] Settings persist across browser sessions (stored server-side in settings.json)

### Feature 10: Duplicate Detection

**Description:** Warn when adding a lead that may already exist.

**Acceptance criteria:**
- [ ] On manual add: if businessName matches an existing lead (case-insensitive), show warning with existing lead details
- [ ] On manual add: if websiteUrl matches an existing lead, show warning
- [ ] On CSV import: duplicates are flagged in the import summary
- [ ] Warnings do not block the add — user can proceed or cancel
- [ ] Scraper results include duplicate flags for businesses already in the system

### Feature 11: Activity Log

**Description:** Every lead has a timestamped history of all actions.

**Acceptance criteria:**
- [ ] Clicking a lead row opens a detail panel showing the full activity log
- [ ] Each entry shows: date/time, action description, details
- [ ] Log entries are created for: lead creation, every email sent (with type), reply logged, meeting scheduled, status changes, notes updated
- [ ] Log is ordered newest-first
- [ ] Log is read-only (no editing or deleting entries)

### Feature 12: CRM Dashboard Header

**Description:** Status count badges visible on all tabs.

**Acceptance criteria:**
- [ ] Header shows 7 badges: Discovered, Reached Out, Replied, No Response, Meeting Scheduled, Client Won, Lost
- [ ] Each badge shows the count of leads in that status
- [ ] Badges use the defined status colors (Grey, Blue, Purple, Yellow, Green, Dark Green, Red)
- [ ] Counts update in real-time after any action
- [ ] Category filter affects badge counts (when filtered, show counts for that category only)

## UI / UX Specifications

### Layout

- Fixed header with app title, status badges, category filter dropdown, and settings gear icon
- Tab bar below header: Discovery | Outreach Pipeline | Replies & Meetings | Client Tracker
- Active tab content fills remaining viewport height
- Each tab contains: toolbar (action buttons + export), scrollable data table

### Discovery Tab

- Table columns: Business Name, Category, Address, Phone, Email, Website URL, Website Quality, Date Discovered, Actions
- Actions column: "Send Email 1" button (if status is Discovered and quality is not "Not a Fit" and email exists), "Mark Not a Fit" button
- Toolbar: "Discover Leads" button (triggers scraper for selected category), "Add Lead" button, "Import CSV" button, "Export CSV" button
- "Add Lead" opens a modal form with all lead fields
- Rows color-coded by status

### Outreach Pipeline Tab

- Table columns: Business Name, Category, Email, Status, Email 1 Sent, Follow-Up 1 Sent, Follow-Up 2 Sent, Last Activity, Actions
- Actions column: "Log Reply" button
- Only shows leads with status "Reached Out" or "No Response"
- Toolbar: "Export CSV" button
- Due follow-ups highlighted with an orange left border

### Replies & Meetings Tab

- Table columns: Business Name, Reply Date, Sentiment, Calendly Sent, Meeting Date, Notes, Actions
- Actions column: "Schedule Meeting" button (if status is Replied), "Send Calendly" button (if not yet sent)
- Only shows leads with status "Replied" or "Meeting Scheduled"
- Toolbar: "Export CSV" button

### Client Tracker Tab

- Table columns: Business Name, Meeting Date, Decision, Start Date, Notes, Actions
- Actions column: "Mark Won" button, "Mark Lost" button (if status is Meeting Scheduled)
- Only shows leads with status "Meeting Scheduled", "Client Won", or "Lost" (that had a meeting)
- Toolbar: "Export CSV" button

### Modals

- **Add/Edit Lead:** Form with all lead fields, save/cancel buttons
- **Email Preview:** Shows rendered subject and body, "Send" and "Cancel" buttons
- **Log Reply:** Date picker, sentiment dropdown, notes textarea
- **Schedule Meeting:** Date picker, notes textarea
- **Settings:** Personal info fields, SMTP fields, test connection button
- **Category Editor:** Name, search term, tone dropdown, 3 template editors (subject + body textareas)

### States

- **Empty state:** Each tab shows a message when no leads match (e.g., "No leads discovered yet. Use 'Discover Leads' or 'Import CSV' to get started.")
- **Loading state:** Spinner overlay during scraper execution and email sending
- **Error state:** Red banner at top of page with error message, auto-dismisses after 5 seconds

### Status Colors (CSS classes)

| Status            | Background   | Text    |
|-------------------|-------------|---------|
| Discovered        | `#e0e0e0`   | `#333`  |
| Reached Out       | `#bbdefb`   | `#1565c0` |
| Replied           | `#e1bee7`   | `#6a1b9a` |
| No Response       | `#fff9c4`   | `#f57f17` |
| Meeting Scheduled | `#c8e6c9`   | `#2e7d32` |
| Client Won        | `#1b5e20`   | `#fff`  |
| Lost / Not a Fit  | `#ffcdd2`   | `#b71c1c` |

## Environment & Configuration

| Variable / File       | Purpose                          | Example Value                    |
|-----------------------|----------------------------------|----------------------------------|
| `server/data/settings.json` | User settings + SMTP creds | `{ userName: "Max", ... }`      |
| `server/data/leads.json`    | All lead records            | `[{ id: "...", ... }]`          |
| `server/data/categories.json` | Category definitions      | `[{ id: "...", name: "Gyms" }]` |
| `PORT` (env var, optional)   | Server port, default 3000  | `3000`                           |

No `.env` file required. All configuration is done through the Settings UI. SMTP credentials are stored in `settings.json` in plaintext — acceptable for a local-only tool.

## Implementation Order

1. **Project setup** — Initialize `package.json`, install Express, Playwright, Nodemailer, uuid. Create folder structure. Verify `npm start` launches Express and serves a "Hello" page on port 3000.

2. **Data Store module** — Implement `dataStore.js` with `get(collection, id)`, `getAll(collection, filter?)`, `save(collection, record)`, `delete(collection, id)`. Write tests. Verify by running test suite.

3. **Pipeline Logic module** — Implement `pipeline.js` with `validateTransition(currentStatus, action)`, `getFollowUpDates(dateEmail1Sent)`, `getDueToday(leads, today)`, `checkDuplicate(newLead, existingLeads)`. Write tests. Verify by running test suite.

4. **Default categories seed** — Create `categories.json` with the 4 default niches and all German email templates from the project plan. Implement category CRUD routes. Verify by hitting API endpoints with curl.

5. **Settings routes** — Implement settings read/write routes. Verify settings persist across server restarts.

6. **Lead CRUD routes** — Implement lead create, read, update, delete routes with duplicate detection. Verify by creating leads via curl and checking `leads.json`.

7. **Pipeline transition routes** — Implement `/api/leads/:id/transition` with all actions. Wire up pipeline validation. Verify by walking a lead through the full pipeline via curl.

8. **Email Service module** — Implement template rendering (placeholder substitution) and Nodemailer send. Write tests for rendering. Verify by sending a test email to yourself.

9. **CSV Service module** — Implement CSV parse and generate. Write tests. Verify round-trip: export leads to CSV, import the CSV, compare.

10. **Frontend shell** — Build `index.html` with header, status badges, tab navigation, category filter. Wire up `api.js` fetch wrapper. Verify tabs switch and badges render.

11. **Discovery tab UI** — Build table, add lead modal, scraper trigger button, CSV import button. Wire to API. Verify full flow: add a lead manually, see it in the table.

12. **Scraper Engine** — Implement Playwright Google Maps scraper. Wire to `/api/scraper/discover`. Verify by running a discovery for one category and checking results.

13. **Outreach tab UI + email preview** — Build outreach table, email preview modal, send button. Wire to email API. Verify: preview an email, send it, see status update.

14. **Dashboard: follow-ups due + reply reminders** — Build due-today section and check-for-replies section. Wire to API. Verify by creating leads with past email dates and confirming they appear as due.

15. **Replies & Meetings tab UI** — Build table, log reply modal, schedule meeting modal. Verify full flow: log a reply, schedule a meeting.

16. **Client Tracker tab UI** — Build table, won/lost buttons. Verify: mark a lead as won, see it in the tracker.

17. **Category & Template management UI** — Build category list, add/edit/delete forms, template editors. Verify: add a new category, edit templates, delete unused category.

18. **Settings UI** — Build settings modal with SMTP fields and test connection. Verify: save settings, test SMTP connection.

19. **CSV export on all tabs** — Wire export buttons to `/api/csv/export` with correct tab parameter. Verify: export from each tab, open in Excel, confirm German characters render correctly.

20. **Polish** — Empty states, loading spinners, error banners, status color coding on all rows, activity log detail panel. Final manual walkthrough of complete pipeline.

## Open Questions

None — all decisions resolved.
