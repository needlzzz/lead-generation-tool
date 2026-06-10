# Lead Generation CRM — Project Context

## What This Project Is

A local-first, self-hosted CRM for discovering local businesses across Switzerland, sending personalized cold outreach emails in German, tracking follow-ups on a timed schedule, and managing the full sales pipeline from discovery through close. Built for a freelance web designer targeting businesses with outdated or missing websites.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Runtime | Node.js |
| Backend | Express (serves API + static files) |
| Frontend | Plain HTML/CSS/JS (no framework, no build step) |
| Persistence | JSON files on disk (`server/data/`) |
| Scraper | Playwright (headless Chrome for Google Maps + local.ch) |
| Email | Nodemailer (configurable SMTP, corporate proxy support) |
| Testing | Jest |
| Package manager | npm |

## Key Commands

```bash
npm start              # Launch Express server on localhost:3000
npm test               # Run Jest test suite
npm run install-browsers  # Install Playwright Chromium (for scraper)
```

## Project Structure

```
server/
  index.js              Express entry point (port 3000)
  lib/
    dataStore.js         JSON file persistence (server/data/)
    pipeline.js          Status transitions, follow-up logic, duplicates
    emailService.js      Nodemailer + template rendering (with proxy support)
    csvService.js        CSV parse/generate
    scraper.js           Playwright Google Maps scraper (city-aware)
    enrichment.js        Email enrichment (pluggable: local.ch + website scraping)
    websiteAnalyzer.js   Automated website quality analysis (SSL, mobile, speed, SEO, tech stack, security headers, opportunity scoring)
    defaultCategories.js Pre-loaded German email template sets
    configGenerator.js     Config generation for preview sites (niche presets)
    previewGenerator.js    Preview site generation orchestrator (build + deploy pipeline)
    previewRegistry.js     JSON persistence for preview lifecycle state
    screenshotCapturer.js  Playwright-based hero screenshot capture
    slugGenerator.js       URL-safe slug generation with uniqueness retry
  routes/
    leads.js             Lead CRUD + pipeline transitions
    categories.js        Category CRUD
    settings.js          Settings + SMTP test + send test email
    scraper.js           Scraper + enrichment + website analysis endpoints (SSE)
    email.js             Email preview + send
    csv.js               CSV import/export
    previews.js            Preview generation SSE endpoint + state API
  data/                  Runtime data (JSON files, gitignored)
    leads.json
    categories.json
    settings.json
    previews.json          Preview registry (generated, gitignored)
    previews/{slug}/       Screenshot storage per preview
public/
  index.html             SPA shell
  css/styles.css         Styles with status colors
  js/
    api.js               Fetch wrapper for all backend calls
    app.js               App initialization, tab routing, discovery, enrichment, analysis
tests/
  websiteAnalyzer.test.js
  pipeline.test.js
  dataStore.test.js
  emailService.test.js
  csvService.test.js
```

## Architecture Principles

1. **Local-first**: All data stays on disk in JSON files. No database, no cloud dependency.
2. **No build step**: Frontend is vanilla HTML/CSS/JS with ES modules. No bundler, no framework.
3. **Single entry point**: `npm start` launches everything on `localhost:3000`.
4. **Pipeline-enforced**: Status transitions are validated — no step can be skipped.
5. **Template-driven outreach**: Email templates are per-category with placeholder substitution.
6. **German content, English UI**: Email templates target Swiss-German market (Sie-Form for formal, casual for others). The application UI is in English.
7. **Non-blocking enrichment**: Email enrichment and website analysis run in background via SSE, save results immediately, UI remains usable.

## Discovery & Enrichment

### Scraper
- Google Maps scraper accepts a **city parameter** (20 Swiss cities available)
- City is appended to the search term (e.g., "Coiffeur Bern") for accurate geolocation
- Browser geolocation is also set as a secondary signal
- Scraper also extracts **Google rating** (1-5 stars) per business for opportunity scoring
- Results are saved to `leads.json` immediately

### Email Enrichment (pluggable)
- Endpoint: `POST /api/scraper/enrich-emails` (SSE stream)
- Provider order per lead:
  1. **Website scrape** (if lead has a website) — checks homepage, /kontakt, /impressum for mailto links and email patterns
  2. **local.ch** — searches business name + city, extracts email from results/detail page
- Architecture supports adding more providers in `server/lib/enrichment.js`
- Emails are saved to disk immediately when found (not batched at end)
- Frontend shows non-blocking progress bar at bottom of screen

### Website Quality Analysis
- Endpoint: `POST /api/scraper/analyze-websites` (SSE stream)
- Automated checks per website:
  - **SSL/HTTPS** — missing certificate
  - **Mobile-friendliness** — viewport meta tag, responsive design (media queries)
  - **Page load speed** — timed page load, flags >3s and >5s
  - **SEO basics** — title tag, meta description, H1 heading
  - **Accessibility** — images without alt text
  - **Outdated tech** — Flash, table-based layout, old WordPress/Joomla versions
  - **Copyright year** — flags if >2 years old (site appears unmaintained)
  - **Mixed content** — HTTP resources on HTTPS pages
  - **Security headers** — HSTS, CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy. Graded A+ to F.
  - **CMS/Tech stack detection** — WordPress (version + plugins + theme), Wix, Jimdo, Squarespace, Shopify, Joomla, Webflow, TYPO3, Drupal, Webflow. Also detects React/Next.js/Vue/Angular, analytics (GA, Matomo, Hotjar, Plausible), e-commerce (WooCommerce, Shopify).
  - **Opportunity scoring** — composite 0-100 score factoring in: website quality (inverted), issue count, CMS type (WordPress users more open to redesign), copyright staleness, Google rating (higher-rated = more budget)
- Scoring: 0-100 points, deductions per issue
- Quality labels: Good (80+), Outdated (50-79), Poor (<50)
- Results stored per-lead: `websiteQuality`, `websiteScore`, `websiteIssues[]`, `websiteLoadTime`, `websiteAnalyzedAt`, `websiteTechStack`, `websiteSecurityGrade`, `websiteOpportunityScore`
- Issues have German labels and descriptions (for use in outreach emails)
- UI: "🔬 Analyze Websites" button, color-coded quality badges with tooltip, full findings in lead detail modal
- **Selection & Re-analysis**: Discovery table has a checkbox column for selecting individual leads. "🔬 Analyze Selected (N)" button appears when leads are checked — allows re-analysis of already-analyzed leads. Bulk "🔬 Analyze Websites" still only targets unanalyzed leads. "Select All" checkbox in table header selects all visible leads.

### Available Cities
Zürich, Bern, Basel, Luzern, St. Gallen, Lausanne, Genf, Winterthur, Biel/Bienne, Thun, Aarau, Schaffhausen, Chur, Zug, Solothurn, Baden, Olten, Rapperswil, Frauenfeld, Lugano

## Pipeline Stages

Discovered → Reached Out → Replied → Meeting Scheduled → Client Won / Lost

- Day 0: Email 1 (Cold Outreach)
- Day 3: Follow-Up 1
- Day 6: Follow-Up 2 (with Calendly link)
- Day 7+: Mark as "No Response / Cold"

Calendar days, no weekend logic.

## Data Model (Key Entities)

- **Lead**: id, businessName, category, address, phone, email, websiteUrl, websiteQuality, websiteScore, websiteIssues[], websiteLoadTime, websiteAnalyzedAt, websiteTechStack, websiteSecurityGrade, websiteOpportunityScore, googleRating, contactPerson, status, dates (discovered, email1, followup1, followup2, reply, meeting), replySentiment, decision, startDate, notes, activityLog[], previewUrl, previewScreenshotPath, previewGeneratedAt, previewExpiresAt
- **Category**: id, name, searchTerm, tone (formal/casual), templates (email1/2/3 with subject + body)
- **Settings**: userName, calendlyLink, previewSiteRepoPath, smtp config (host, port, username, password, fromAddress, useProxy)

## Email Template Placeholders

- `[Name]` → contactPerson or "Team von [Business Name]" if empty
- `[Business Name]` → lead's businessName
- `[CALENDLY-LINK]` → from settings
- `[Dein Name]` → from settings
- `[Website-Probleme]` → full bullet list of website issues (German)
- `[Website-Probleme-Kurz]` → short comma-separated issue labels (first 3)
- `[Website-Score]` → website score as "X/100"
- `[Preview-Link]` → previewUrl or empty string if not generated
- `[Preview-Screenshot]` → screenshot URL at preview.kaelint.ch/{slug}/screenshot.png
- `[Preview-Ablauf]` → formatted expiry date in German (e.g., "15. Juli 2026")

## SMTP Configuration

- Configurable host, port, username, password, from address
- **Corporate proxy support**: checkbox to route SMTP through `http://aproxy.corproot.net:8080` (HTTP CONNECT tunnel via Nodemailer built-in)
- **Test Connection**: saves settings first, then verifies SMTP connectivity; shows verbose error with host/port/user/error code
- **Send Test Email**: input recipient address, sends a real test email to verify delivery
- Results displayed persistently inline (not disappearing alerts)

## Status Colors

| Status | Color |
|--------|-------|
| Discovered | Grey (#e0e0e0) |
| Reached Out | Blue (#bbdefb) |
| Replied | Purple (#e1bee7) |
| No Response | Yellow (#fff9c4) |
| Meeting Scheduled | Green (#c8e6c9) |
| Client Won | Dark Green (#1b5e20) |
| Lost / Not a Fit | Red (#ffcdd2) |

## Website Quality Colors

| Quality | Color |
|---------|-------|
| None | Grey (#e0e0e0) |
| Poor | Red (#ffcdd2) |
| Outdated | Yellow (#fff9c4) |
| Good | Green (#c8e6c9) |
| Not a Fit | Purple (#e1bee7) |

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | /api/scraper/cities | List available Swiss cities |
| POST | /api/scraper/discover | Scrape Google Maps (requires categoryId, optional city) |
| POST | /api/scraper/enrich-emails | Enrich emails via SSE (optional leadIds, city) |
| POST | /api/scraper/analyze-websites | Analyze website quality via SSE (optional leadIds) |
| GET/PUT | /api/settings | Read/update settings |
| POST | /api/settings/test-smtp | Test SMTP connection (verbose errors) |
| POST | /api/settings/send-test-email | Send test email to specified recipient |
| GET/POST | /api/leads | List/create leads |
| PUT/DELETE | /api/leads/:id | Update/delete lead |
| POST | /api/email/preview | Preview email for a lead |
| POST | /api/email/send | Send email to a lead |
| GET/POST | /api/categories | List/create categories |
| POST | /api/csv/import | Import CSV |
| GET | /api/csv/export/:type | Export CSV |
| POST | /api/previews/generate | Generate preview site (SSE stream) |
| GET | /api/previews/:leadId | Get preview state for a lead |

## Important Conventions

- All persistence goes through `server/lib/dataStore.js` — never read/write JSON files directly from routes
- Pipeline transitions go through `server/lib/pipeline.js` for validation
- Duplicate detection checks businessName (case-insensitive) and websiteUrl
- Activity log entries are append-only: `{ date: ISO, action: string, details: string }`
- CSV export uses UTF-8 with BOM for Excel compatibility with German characters
- SMTP credentials stored in plaintext in `settings.json` — acceptable for local-only tool
- No authentication or multi-user support
- Desktop-first, no mobile responsiveness required
- The Playwright scraper targets small result sets (20-50 businesses per niche)
- Enrichment and analysis use polite delays (1-2s) between requests to avoid rate limiting
- Website analysis issues are stored in German for direct use in outreach email templates

## Testing Approach

- Jest for unit tests on backend modules (pipeline, dataStore, emailService, csvService, slugGenerator, previewRegistry, configGenerator, previewGenerator, screenshotCapturer)
- Property-based tests with fast-check (slug format, config validity, color derivation, email placeholders)
- No frontend tests — manual testing only
- No integration/E2E tests for the scraper (depends on live Google Maps / local.ch DOM)
- Run `npm test` to validate logic modules

## Preview Site Generation

- Generates personalized demo websites for cold outreach leads
- Uses kaelint-website-business as the build system (invoked via child_process)
- Deployed atomically to Cloudflare Pages at `preview.kaelint.ch/{slug}/de/`
- Previews expire after 30 days (removed on next deploy)
- Settings: `previewSiteRepoPath` points to local kaelint-website-business checkout
- Screenshot captured via Playwright (non-blocking on failure)
- SSE streaming for real-time progress in the UI
