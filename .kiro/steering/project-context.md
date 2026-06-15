# Lead Generation CRM — Project Context

## What This Project Is

A local-first, self-hosted CRM for discovering local businesses across Switzerland, sending personalized cold outreach emails in Swiss German, tracking follow-ups, and managing the full sales pipeline from discovery through close. Built for Marc Kaelin (Kaelint Webdesign), a freelance web designer targeting businesses with outdated or missing websites.

## Owner

- **Name:** Marc Kaelin
- **Business:** Kaelint Webdesign
- **Website:** https://kaelint.ch
- **Location:** Switzerland (German-speaking)

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Runtime | Node.js |
| Backend | Express (serves API + static files) |
| Frontend | Plain HTML/CSS/JS (no framework, no build step) |
| Persistence | JSON files on disk with in-memory cache (`server/data/`) |
| Scraper | Playwright (headless Chrome for Google Maps + local.ch) |
| Email | Nodemailer (personal SMTP + Brevo relay for batch) |
| Testing | Jest |
| Package manager | npm |

## Key Commands

```bash
npm start              # Server on localhost:3000
npm test               # Unit + property tests (excludes e2e)
npm run test:e2e:preview  # E2E preview build test (slow, real Astro build)
npm run install-browsers  # Install Playwright Chromium (for scraper)
```

## Project Structure

```
server/
  index.js              Express entry point (port 3000)
  lib/
    dataStore.js         In-memory cache + debounced JSON file persistence
    personalQuotaTracker.js  Personal SMTP daily send quota (default 20/day)
    pipeline.js          Status transitions, follow-up logic, duplicates
    emailService.js      Nodemailer + template rendering (Reply-To, no X-Mailer)
    csvService.js        CSV parse/generate
    scraper.js           Playwright Google Maps scraper (city-aware)
    enrichment.js        Email enrichment (pluggable: local.ch + website scraping)
    websiteAnalyzer.js   Automated website quality analysis (parallel, 4 workers)
    defaultCategories.js Category definitions (name + searchTerm only, no templates)
    configGenerator.js   Config generation for preview sites (niche presets)
    previewGenerator.js  Preview site generation orchestrator (build + deploy pipeline)
    previewRegistry.js   JSON persistence for preview lifecycle state (PROTECTED from dataStore)
    screenshotCapturer.js  Playwright-based hero screenshot capture
    slugGenerator.js     URL-safe slug generation with uniqueness retry
    batchPreviewGenerator.js  Batch preview orchestrator (parallel builds, single deploy)
    batchSender.js       Batch email send queue processor (Brevo SMTP)
    quotaTracker.js      Brevo daily email send quota persistence + enforcement
  routes/
    leads.js             Lead CRUD + pipeline transitions + pagination + server-side sorting
    categories.js        Category CRUD (name + searchTerm only)
    settings.js          Settings + SMTP test + send test email + batch config + templates
    scraper.js           Scraper + enrichment + website analysis (4 parallel workers, SSE)
    email.js             Email preview + send (personal SMTP, quota-enforced)
    csv.js               CSV import/export
    previews.js          Preview generation + list + deploy endpoints
    batch.js             Batch preview generation + email send endpoints
  data/                  Runtime data (JSON files, gitignored)
    leads.json           ~22k leads (in-memory cached, 2s write-behind)
    categories.json      45 categories (name + searchTerm)
    settings.json        All settings including saved email templates
    previews.json        Preview registry (PROTECTED — managed by previewRegistry only)
    personal-send-quota.json  Personal SMTP daily counter
    send-quota.json      Brevo daily counter
    batch-preview-state.json  Batch preview generation state
    send-queue-state.json     Email send queue state
public/
  index.html             SPA shell
  css/styles.css         Styles with status colors + design tokens
  js/
    api.js               Fetch wrapper for all backend calls
    app.js               App initialization, tab routing, all UI logic
```

## Architecture Principles

1. **Local-first**: All data stays on disk in JSON files. No database, no cloud dependency.
2. **In-memory cache**: dataStore loads JSON once on first access, serves all reads from Map, flushes to disk every 2s (debounced). Process exit flushes synchronously.
3. **Protected collections**: `previews.json` is managed by `previewRegistry.js` independently — dataStore refuses to load/flush it (prevents accidental wipes).
4. **No build step**: Frontend is vanilla HTML/CSS/JS. No bundler, no framework.
5. **Single entry point**: `npm start` launches everything on `localhost:3000`.
6. **Pipeline-enforced**: Status transitions are validated — no step can be skipped.
7. **Two SMTP systems**: Personal SMTP for manual sends (max 20/day), Brevo for batch (max 250/day).
8. **Server-side pagination + sorting**: GET /api/leads returns lightweight projections (no activityLog/websiteIssues), paginated, sorted server-side.
9. **Parallel website analysis**: 4 concurrent Playwright workers with 500ms delay between requests.
10. **Swiss German outreach**: All email templates use "Sali" greeting and casual Swiss-German tone.

## Email Templates

Templates are stored in `settings.json` under `settings.templates.email1` and `settings.templates.email2`. Once saved via the UI, they override the hardcoded defaults in `settings.js`/`email.js`.

**Important:** If you change the default templates in code, users who have already saved templates via the UI won't see the change — their saved version takes precedence. To update for existing users, you must patch `settings.json` directly.

### Current Template (Email 1 — Cold Outreach)
```
Subject: Idee für [Business Name]

Sali [Business Name],

ich bin Marc Kaelin von Kaelint Webdesign und ich habe mir eure Webseite näher angeschaut. Dabei sind mir folgende Punkte aufgefallen:

[Website-Probleme]

Das sind Punkte, die bei eurer Kundschaft evtl. Verunsicherung auslösen könnten.

Ich hab mal einen Entwurf erstellt, wie eure Webseite moderner aussehen könnte:
👉 [Preview-Link]

[Preview-Disclaimer]

Falls Ihr euch für ein Re-Design interessiert, meldet euch gerne bei mir.

Für mehr Informationen zum Angebot, besuche meine Webseite:
👉 https://kaelint.ch

Marc Kaelin
Kaelint Webdesign
```

### Current Template (Email 2 — Follow-Up)
```
Subject: Re: Idee für [Business Name]

Sali [Business Name],

wollte nur sichergehen, dass meine Nachricht nicht untergegangen ist. Die Vorschau ist noch online:
👉 [Preview-Link]

Kein Druck — nur falls es doch passt.

Für mehr Informationen zum Angebot, besuche meine Webseite:
👉 https://kaelint.ch

Marc Kaelin
Kaelint Webdesign
```

### Placeholders

| Placeholder | Resolves to |
|-------------|-------------|
| `[Business Name]` | lead.businessName |
| `[Name]` | lead.contactPerson or lead.businessName (no more "Team von") |
| `[Greeting]` | "Guten Tag Herr/Frau Lastname" or "Guten Tag" |
| `[Dein Name]` | settings.userName (should be "Marc") |
| `[Website-Probleme]` | Top 5 issues as bullet points with constructive consequence |
| `[Website-Probleme-Kurz]` | Comma-separated issue labels (short) |
| `[Website-Probleme-Anzahl]` | Count of issues shown |
| `[Website-Score]` | "X/100" |
| `[Preview-Link]` | Preview URL or empty |
| `[Preview-Disclaimer]` | Placeholder image note (only if preview exists) |
| `[Preview-Ablauf]` | Expiry date in German |
| `[CALENDLY-LINK]` | settings.calendlyLink |

## SMTP Configuration (Dual Setup)

### Personal SMTP (for manual sends)
- Used by: "Email 1" button, "Email Selected" button, single sends
- Quota: 20 emails/day (configurable via `smtp.maxPersonalEmailsPerDay`)
- Tracked in: `server/data/personal-send-quota.json`
- Headers: Reply-To set, X-Mailer suppressed (looks like personal email)
- **Important:** Trim credentials on save (trailing spaces cause auth failure)

### Brevo SMTP (for batch sends)
- Used by: Batch Operations → Start Batch Send
- Quota: 250 emails/day (configurable via `batch.maxEmailsPerDay`)
- Tracked in: `server/data/send-quota.json`
- Note: Brevo adds `List-Unsubscribe` and `Precedence: bulk` headers server-side (unavoidable, triggers "mailing list" notice in Gmail)

### Safe Daily Sending Limits (Personal Account)
- Week 1-2: 10-15/day (warm up reputation)
- Week 3-4: 20-30/day
- Ongoing: 30-50/day max for cold outreach
- What triggers flags: sudden spikes, >5% bounce rate, spam complaints, identical content

## Pipeline Stages

```
Discovered → Reached Out → Replied → Meeting Scheduled → Client Won / Lost
```

- Email 1 sent → status becomes "Reached Out"
- Day 3+: Follow-Up eligible
- Day 7+: Mark as "No Response / Cold"
- Calendar days, no weekend logic.

## Data Model

### Categories (simplified)
- Only: `id`, `name`, `searchTerm`
- No more `tone` or `templates` per category (templates are global in settings)
- 45 categories covering: Handwerk, Beauty, Sport, Gastro, Gewerbe, Kreativ, Medizin, Recht, Institutionell

### Leads
- Lightweight projection returned by GET /api/leads (strips activityLog, websiteIssues, websiteComplexity)
- Full data returned by GET /api/leads/:id (for detail modal)

## UI Tabs

| Tab | Shows |
|-----|-------|
| **Discovery** | All leads regardless of status, paginated (100/page), server-side sorted |
| **Previews** | All generated previews with status (deployed/built/expired), deploy button |
| **Outreach Pipeline** | Leads with status Reached Out / No Response + follow-up alerts |
| **Replies & Meetings** | Leads with status Replied / Meeting Scheduled |
| **Client Tracker** | Leads with meetings (Won/Lost decisions) |
| **Batch Operations** | Generate All Previews + Batch Email Send + live progress log |
| **Scrape Log** | Category × City matrix (sortable Total column) |

### Discovery Tab Features
- **Two toolbar rows**: filters (top) + actions (bottom)
- **Filters**: Search, Category, City, ☑ Has email (default ON), ☑ Has preview, ☑ No website
- **Server-side sorting**: Quality (default: Poor first), Category, Status, Discovered
- **Pagination**: 100 leads/page, prev/next/first/last buttons
- **Actions**: Discover, Enrich, Analyze, Analyze Selected, Preview Selected, Email Selected
- **All buttons always visible** (disabled when not applicable, grayed out)
- **Shows all statuses**: Discovered, Reached Out, Replied, etc. visible with color pills

### Default Filter State on Load
- "Has email" checkbox: checked (hides leads without email)
- Quality sort: ascending (Poor first = best prospects at top)

## Performance Architecture

- **In-memory dataStore**: ~22k leads loaded once, all reads <1ms, writes batched every 2s
- **Server-side pagination**: API returns 100 leads per page (max 500), lightweight projection (~68KB vs 50MB)
- **Server-side sorting**: Sort applies across all pages (not just current page)
- **Parallel analysis**: 4 Playwright workers with 500ms delay (~1.5s effective per lead)
- **Tabs fetch independently**: Outreach/Replies/Clients tabs query their own status data (not dependent on Discovery page)

## Error Handling

- **Network failures during email send**: Detects ECONNREFUSED, ETIMEDOUT, ENOTFOUND, auth failures → stops send loop immediately → shows error with VPN/credential hint
- **Quota exceeded**: Returns 429 with clear message + remaining count
- **SMTP auth failure**: Usually caused by trailing spaces in password (trimmed on save now)

## Preview Site Assets

- Placeholder images stored at: `kaelint-website-business/previews/assets/{niche}/`
- Niches with real Unsplash photos: arztpraxis, coiffeur, einzelhandel, fitness, generic, handwerk, kreativ
- Missing niches (fall back to generic): restaurant, therapie
- Image processing script: `node scripts/generate-preview-assets.mjs` (resizes in-place)
- Gallery: 800×600 JPEG | Team: 400×400 JPEG | Logo: logo.jpg (max 200px)
- Config generator references `logo.jpg` (not .svg)

## Known Gotchas

1. **Saved templates override defaults**: Once templates are saved via UI to settings.json, code changes to DEFAULT_TEMPLATES have no effect. Must patch settings.json directly.
2. **Server restart required**: After code changes, the running Express process still serves old routes. Must restart.
3. **previews.json is PROTECTED**: The dataStore module refuses to load/flush it. Only previewRegistry.js manages it directly.
4. **VPN blocks SMTP**: When connected to corporate VPN, personal SMTP sends fail silently. The UI now shows a clear error.
5. **In-memory cache data loss**: If server crashes within 2s of a write, that data is lost. Acceptable for local single-user tool.
6. **Browser caching**: After code deployments, do Cmd+Shift+R to bypass cached JS files.

## Testing

- 414 unit + property tests (all passing)
- Jest with fake timers for async queue tests (can be flaky — re-run if batchSender tests fail in isolation)
- No frontend tests — manual testing only

## Available Cities (20)

Zürich, Bern, Basel, Luzern, St. Gallen, Lausanne, Genf, Winterthur, Biel/Bienne, Thun, Aarau, Schaffhausen, Chur, Zug, Solothurn, Baden, Olten, Rapperswil, Frauenfeld, Lugano

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | /api/leads?page=1&limit=100&sort=quality&order=asc&hasEmail=1&hasPreview=1&search=x | Paginated leads (lightweight) |
| GET | /api/leads/counts | Status counts (fast, no lead data) |
| GET | /api/leads/scrape-matrix | Aggregated category×city counts for scrape log |
| GET | /api/leads/due-today | Follow-ups due (limited response) |
| GET | /api/leads/check-replies | Reply check list (max 50) |
| GET | /api/leads/:id | Full lead with activityLog + websiteIssues |
| POST | /api/leads | Create lead |
| PATCH | /api/leads/:id | Update lead fields |
| POST | /api/leads/:id/transition | Pipeline status transition |
| DELETE | /api/leads/:id | Delete lead |
| GET | /api/scraper/cities | Available cities |
| GET | /api/scraper/analyze-stats | Pre-flight analysis stats + time estimate |
| POST | /api/scraper/discover | Scrape Google Maps |
| POST | /api/scraper/enrich-emails | Enrich emails (SSE) |
| POST | /api/scraper/analyze-websites | Analyze websites (SSE, 4 parallel workers) |
| GET/PUT | /api/settings | Read/update settings |
| POST | /api/settings/test-smtp | Test SMTP connection |
| POST | /api/settings/send-test-email | Send test email |
| GET/POST | /api/categories | List/create categories |
| PUT/DELETE | /api/categories/:id | Update/delete category |
| POST | /api/email/preview | Preview rendered email |
| POST | /api/email/send | Send email (personal SMTP, quota-checked) |
| GET | /api/email/quota | Personal SMTP quota status |
| GET | /api/previews/list | All previews with status + lead info |
| POST | /api/previews/generate | Generate single preview (SSE) |
| POST | /api/previews/deploy | Deploy all built previews to CF Pages |
| GET | /api/previews/:leadId | Preview state for a lead |
| POST | /api/batch/generate-previews | Batch preview generation (SSE) |
| GET | /api/batch/preview-status | Batch preview state |
| POST | /api/batch/send-emails | Start/resume batch email send |
| GET | /api/batch/send-status | Email send state + quota |
| POST | /api/batch/send-stop | Graceful stop |
| POST | /api/csv/import | Import CSV |
| GET | /api/csv/export | Export CSV |
