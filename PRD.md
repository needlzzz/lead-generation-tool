# Lead Generation CRM — Product Requirements Document

## Problem Statement

A freelance web designer targeting local businesses in Zürich needs a structured way to discover businesses with outdated or missing websites, reach out to them with personalized cold emails, track follow-ups on a timed schedule, and manage the full sales pipeline from discovery through to winning or losing the client. Currently this process is manual, scattered across browser tabs, spreadsheets, and memory — leading to missed follow-ups, duplicate outreach, and no clear view of pipeline health.

## Solution

A local, self-hosted CRM tool purpose-built for lead generation and outreach to local businesses. The tool covers the full pipeline in five stages: Discover → Analyze → Outreach → Follow-Up → Meeting/Close. It includes an integrated Google Maps scraper for one-click lead discovery, configurable email templates per business category, SMTP-based email sending with preview, timed follow-up tracking, and a four-tab CRM interface with CSV import/export on every view.

The tool ships with four pre-configured business niches (Gyms, Physiotherapeuten, Barbershops, Solo-Unternehmer) but all categories, templates, and tone settings are fully configurable through the UI — making it reusable for any local business niche or region.

Key user flows:
- Pick a category, click "Discover Leads", scraper populates the pipeline
- Alternatively, import leads via CSV from any external source
- Assess each lead's website quality manually, mark targets
- Preview personalized outreach emails, send via configured SMTP, log the send
- Dashboard surfaces due follow-ups on load — no background process needed
- "Check for replies" section lists active leads with email addresses for quick inbox scanning
- Log replies, schedule meetings, track outcomes through enforced pipeline stages
- Every action is timestamped in a per-lead activity log for full traceability

## Implementation Decisions

### Architecture
- Node.js with Express backend serving both the REST API and static frontend files
- Plain HTML/CSS/JS frontend — no framework, no build step
- Single entry point: `npm start` launches the server on `localhost:3000`

### Modules

1. **Server Core** — Express app setup, static file serving, route registration for all API endpoints
2. **Data Store** — JSON file-based persistence (`leads.json`, `categories.json`, `settings.json`). Simple interface: `get`, `getAll`, `save`, `delete` per entity type. Data survives browser cache clears and works across browsers.
3. **Scraper Engine** — Playwright-based Google Maps scraper. Accepts a search term and location, navigates Google Maps, scrolls through results, extracts business name, address, phone, email, website URL. Returns structured data to the API.
4. **Email Service** — Nodemailer wrapper with configurable SMTP settings (host, port, username, password, from address). Handles template rendering by substituting placeholders (`[Name]`, `[Business Name]`, `[CALENDLY-LINK]`, `[Dein Name]`). Supports preview before send.
5. **Pipeline Logic** — Pure functions for: status transition validation (enforced pipeline), follow-up date calculation (calendar days from Email 1), due-today computation, duplicate detection (by business name or website URL). No I/O dependencies.
6. **Category & Template Manager** — CRUD operations for categories. Each category has: name, Google Maps search term, tone setting (formal/casual), and three email templates (subject + body each) with placeholder support. Four niches pre-loaded as defaults.
7. **CSV Import/Export** — Import: parse CSV to lead objects with column mapping and validation. Export: convert lead data to CSV. Available on every CRM tab.
8. **Frontend UI** — Four-tab CRM interface (Discovery, Outreach Pipeline, Replies & Meetings, Client Tracker). Dashboard header with status count badges. Settings panel for personal info and SMTP config. Category & template management UI. Status color coding throughout.

### Data Model

**Lead:**
- id, businessName, category, address, phone, email, websiteUrl, websiteQuality (None/Poor/Outdated/Good/Not a Fit), websiteScore (0-100), websiteIssues[] (array of {id, label, detail}), websiteLoadTime (ms), websiteAnalyzedAt (ISO date), contactPerson (optional), status, dateDiscovered, dateEmail1Sent, dateFollowUp1Sent, dateFollowUp2Sent, replyDate, replySentiment, calendlySent, meetingDate, decision, startDate, notes, activityLog[]

**Category:**
- id, name, searchTerm, tone (formal/casual), templates: { email1: {subject, body}, email2: {subject, body}, email3: {subject, body} }

**Settings:**
- userName, calendlyLink, smtp: { host, port, username, password, fromAddress, useProxy }

### Status Pipeline (enforced transitions)
- **Discovered** → Reached Out (send Email 1) | Not a Fit (→ Lost)
- **Reached Out** → Follow-Up 1 sent (Day 3) → Follow-Up 2 sent (Day 6) → No Response (Day 7+) | Replied
- **Replied** → Meeting Scheduled
- **Meeting Scheduled** → Client Won | Lost

### Follow-Up Schedule
- Day 0: Email 1 (Cold Outreach)
- Day 3: Follow-Up 1 (if no reply)
- Day 6: Follow-Up 2 with Calendly link (if no reply)
- Day 7+: Mark as "No Response / Cold"
- Calendar days, no weekend logic

### Reply Detection
- Manual logging with smart reminders
- Dashboard "Check for replies" section lists all leads in outreach stages with their email addresses
- User searches their inbox, then logs the reply in the CRM with date and sentiment

### Email Templates
- German language, tone varies by category (formal Sie-Form for Physiotherapeuten, casual for others)
- All templates are editable per category through the UI
- Placeholders: `[Name]`, `[Business Name]`, `[CALENDLY-LINK]`, `[Dein Name]`, `[Website-Probleme]`, `[Website-Probleme-Kurz]`, `[Website-Score]`
- Contact person field used for `[Name]`; falls back to "Team von [Business Name]" if empty
- Website issue placeholders populated from automated analysis results (German descriptions)

### Visual Design
- Clean light theme, no dark mode
- Status color coding:
  - Grey → Discovered
  - Blue → Reached Out
  - Purple → Replied
  - Yellow → No Response / Cold
  - Green → Meeting Scheduled
  - Dark Green → Client Won
  - Red → Lost / Not a Fit

### Duplicate Detection
- On add or CSV import, warn if business name or website URL matches an existing lead
- Warning only, does not block the add

## Testing Decisions

Good tests for this project test external behavior through module interfaces, not implementation details. They use realistic inputs (actual CSV strings, real status sequences, template strings with placeholders) and assert on outputs without coupling to internal data structures.

### Modules to test:

1. **Pipeline Logic** — Test status transition validation (valid transitions succeed, invalid ones are rejected), follow-up date calculations (given an Email 1 date, correct due dates are returned), due-today filtering (given a set of leads and today's date, correct leads are surfaced), duplicate detection (matching by name, by URL, no false positives).

2. **CSV Import/Export** — Test parsing valid CSV into correct lead objects, handling missing columns gracefully, handling malformed rows, round-trip (export then import produces equivalent data).

3. **Email Service** — Test template rendering (all placeholders substituted correctly, fallback to "Team von [Business Name]" when contact person is empty, no raw placeholders left in output). Mock SMTP transport for send tests.

4. **Data Store** — Test save and retrieve (write a lead, read it back, values match), update existing records, delete records, handling of missing or corrupted JSON files gracefully.

### Modules NOT tested (and why):
- **Server Core** — Route wiring only; logic is tested through the modules above
- **Scraper Engine** — Depends on live Google Maps DOM; tests would be brittle
- **Category & Template Manager** — Thin CRUD over Data Store; covered transitively
- **Frontend UI** — Visual/interaction testing done manually

## Out of Scope

- Automated inbox monitoring (Gmail API integration for reply detection)
- Dark mode
- Multi-user support or authentication
- Cloud deployment or hosted version
- Business-day calculations for follow-up scheduling
- Email open/click tracking
- Integration with external CRMs (HubSpot, Salesforce, etc.)
- Multi-language support (tool is German-focused for Zürich market)
- Mobile-responsive frontend (desktop-first personal tool)

## Further Notes

- The tool is designed as a personal pipeline management tool, not a SaaS product. All data stays local.
- The Playwright scraper targets small result sets (20-50 businesses per niche in Zürich). It is not designed for large-scale scraping and may be blocked by Google for high-volume use.
- SMTP credentials are stored in a local JSON file. Users should be aware this is not encrypted — acceptable for a local tool, not suitable for shared environments.
- The four pre-loaded German email templates follow the tone conventions from the project plan (Sie-Form for Physiotherapeuten, casual for all others). All are editable.
- Swiss data protection (DSG) considerations: the tool stores publicly available business contact data for legitimate outreach purposes. Users are responsible for compliance with applicable regulations.
