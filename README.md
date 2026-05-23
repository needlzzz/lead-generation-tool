# Lead Generation CRM

A local-first CRM for discovering businesses, sending cold outreach emails, and tracking leads through a sales pipeline. Built for freelancers and agencies targeting local businesses across Switzerland.

## What It Does

**Pipeline:** Discovered → Reached Out → Replied → Meeting Scheduled → Won / Lost

- **Discover leads** via Google Maps scraping (Playwright) or CSV import — with city selector for 20 Swiss cities
- **Enrich emails** automatically via local.ch and website scraping (non-blocking, runs in background)
- **Filter leads** — "No website only" checkbox to focus on hot prospects
- **Send templated emails** (cold outreach + 2 follow-ups) through your own SMTP
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
- Host (e.g. `smtp.gmail.com`)
- Port (587)
- Username (your email)
- Password (app password for Gmail)
- From address

Use the **Test Connection** button to verify.

### Google Maps Scraper (optional)

Only needed if you want auto-discovery and email enrichment. Most users can just use CSV import.

```
npx playwright install chromium
```

Then select a category and city from the dropdowns and click **Auto-Discover (Scraper)**.

## Discovery Workflow

1. **Select a category** (e.g. "Coiffeur") and a **city** (e.g. "Bern") from the toolbar dropdowns
2. Click **🔍 Auto-Discover** — scrapes Google Maps for businesses matching that search in that city
3. Use **"No website only"** filter to focus on leads without a website (your ideal prospects)
4. Click **📧 Enrich Emails** — searches local.ch and business websites for email addresses (runs in background, you can keep working)
5. Leads with emails are ready for outreach

## Project Structure

```
server/
  index.js              Express entry point (port 3000)
  lib/
    dataStore.js         JSON file persistence (server/data/)
    pipeline.js          Status transitions, follow-up logic, duplicates
    emailService.js      Nodemailer + template rendering
    csvService.js        CSV parse/generate
    scraper.js           Playwright Google Maps scraper (city-aware)
    enrichment.js        Email enrichment (local.ch + website scraping)
    defaultCategories.js Pre-loaded German email template sets
  routes/
    leads.js             Lead CRUD + pipeline transitions
    categories.js        Category CRUD
    settings.js          Settings + SMTP test
    scraper.js           Scraper + enrichment endpoints
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

Node.js, Express, plain HTML/CSS/JS (no framework), JSON files on disk, Nodemailer, Playwright.
