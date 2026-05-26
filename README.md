# Lead Generation CRM

A local-first CRM for discovering businesses, sending cold outreach emails, and tracking leads through a sales pipeline. Built for freelancers and agencies targeting local businesses across Switzerland.

## What It Does

**Pipeline:** Discovered → Reached Out → Replied → Meeting Scheduled → Won / Lost

- **Discover leads** via Google Maps scraping (Playwright) or CSV import — with city selector for 20 Swiss cities
- **Enrich emails** automatically via local.ch and website scraping (non-blocking, runs in background)
- **Analyze websites** automatically — checks SSL, mobile-friendliness, speed, SEO, outdated tech, and more. Produces a score (0-100) and specific issues in German for use in outreach emails
- **Filter leads** — "No website only" checkbox to focus on hot prospects
- **Send templated emails** (cold outreach + 2 follow-ups) through your own SMTP, with corporate proxy support
- **Reference website issues in emails** — use `[Website-Probleme]` or `[Website-Probleme-Kurz]` placeholders to personalize outreach with specific findings
- **Track replies** manually with sentiment logging and follow-up reminders
- **Schedule meetings** and record outcomes (won/lost with start date)
- **Manage categories** — each business niche has its own search term, tone, and email templates, all configurable from the UI
- **CSV import/export** for every pipeline stage

Email templates are in German by default (targeting Swiss-German market). The UI is in English.

## Setup

```
git clone https://github.com/needlzzz/lead-generation-tool.git
cd lead-generation-tool
npm install
npm start
```

Open `http://localhost:3000`. On first launch you'll be prompted to enter your name and Calendly link.

### SMTP (required for sending emails)

Go to **Settings → SMTP** and configure:
- Host (e.g. `smtp.gmail.com` or `mignon.metanet.ch`)
- Port (587 for STARTTLS, 465 for SSL)
- Username (your email)
- Password (app password for Gmail)
- From address
- Corporate proxy checkbox (routes through `http://aproxy.corproot.net:8080` when on corporate network)

Use the **Test Connection** button to verify. Errors show verbose details (host, port, error code).

Use **Send Test Email** to verify actual delivery to a real inbox.

### Google Maps Scraper (optional)

Only needed if you want auto-discovery, email enrichment, and website analysis. Most users can just use CSV import.

```
npx playwright install chromium
```

Then select a category and city from the dropdowns and click **Auto-Discover (Scraper)**.

## Discovery Workflow

1. **Select a category** (e.g. "Coiffeur") and a **city** (e.g. "Bern") from the toolbar dropdowns
2. Click **🔍 Auto-Discover** — scrapes Google Maps for businesses matching that search in that city
3. Click **🔬 Analyze Websites** — evaluates each lead's website for quality issues (SSL, mobile, speed, SEO, tech)
4. Use **"No website only"** filter to focus on leads without a website (your ideal prospects)
5. Click **📧 Enrich Emails** — searches local.ch and business websites for email addresses (runs in background)
6. Leads with emails are ready for outreach — website issues are available as email template placeholders

## Website Quality Analysis

The analyzer checks each lead's website for:

| Check | What it detects |
|-------|----------------|
| SSL | Missing HTTPS certificate |
| Mobile | No viewport meta tag, no responsive design |
| Speed | Load time >3s (warning) or >5s (critical) |
| SEO | Missing title, meta description, H1 heading |
| Accessibility | Images without alt text |
| Tech | Flash, table-based layout, outdated WordPress |
| Freshness | Copyright year >2 years old |
| Security | Mixed HTTP/HTTPS content |

Results are stored per-lead and visible by clicking the lead row (detail modal shows full findings).

### Email Template Placeholders for Website Issues

Use these in your category email templates to personalize outreach:

- `[Website-Probleme]` — full bullet list of issues with German descriptions
- `[Website-Probleme-Kurz]` — short comma-separated labels (first 3 issues)
- `[Website-Score]` — score as "X/100"

Example template usage:
```
Mir ist aufgefallen, dass Ihre Website einige Schwachstellen hat:

[Website-Probleme]

Mit einem Score von [Website-Score] verlieren Sie potenzielle Kunden...
```

## Project Structure

```
server/
  index.js              Express entry point (port 3000)
  lib/
    dataStore.js         JSON file persistence (server/data/)
    pipeline.js          Status transitions, follow-up logic, duplicates
    emailService.js      Nodemailer + template rendering (proxy support)
    csvService.js        CSV parse/generate
    scraper.js           Playwright Google Maps scraper (city-aware)
    enrichment.js        Email enrichment (local.ch + website scraping)
    websiteAnalyzer.js   Automated website quality analysis
    defaultCategories.js Pre-loaded German email template sets
  routes/
    leads.js             Lead CRUD + pipeline transitions
    categories.js        Category CRUD
    settings.js          Settings + SMTP test + send test email
    scraper.js           Scraper + enrichment + analysis endpoints (SSE)
    email.js             Email preview + send
    csv.js               CSV import/export
public/
  index.html             SPA shell
  css/styles.css         Styles with status colors
  js/api.js              Fetch wrapper
  js/app.js              UI logic
```

## Test Data

Import `test-leads.csv` (16 sample leads across 4 categories) to try out the pipeline without setting up the scraper.

## Tech Stack

Node.js, Express, plain HTML/CSS/JS (no framework), JSON files on disk, Nodemailer (with HTTP proxy support), Playwright.
