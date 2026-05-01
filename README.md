# Lead Generation CRM

A local-first CRM for discovering businesses, sending cold outreach emails, and tracking leads through a sales pipeline. Built for freelancers and agencies targeting local businesses (default: Zürich area).

## What It Does

**Pipeline:** Discovered → Reached Out → Replied → Meeting Scheduled → Won / Lost

- **Discover leads** via Google Maps scraping (Playwright) or CSV import
- **Send templated emails** (cold outreach + 2 follow-ups) through your own SMTP
- **Track replies** manually with sentiment logging and follow-up reminders
- **Schedule meetings** and record outcomes (won/lost with start date)
- **Manage categories** — each business niche (Gyms, Barbershops, etc.) has its own search term, tone, and email templates, all configurable from the UI
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

Only needed if you want auto-discovery. Most users can just use CSV import.

```
npx playwright install chromium
```

Then select a category from the dropdown and click **Auto-Discover (Scraper)**.

## Project Structure

```
server/
  index.js              Express entry point (port 3000)
  lib/
    dataStore.js         JSON file persistence (server/data/)
    pipeline.js          Status transitions, follow-up logic, duplicates
    emailService.js      Nodemailer + template rendering
    csvService.js        CSV parse/generate
    scraper.js           Playwright Google Maps scraper
    defaultCategories.js 4 pre-loaded German email template sets
  routes/
    leads.js             Lead CRUD + pipeline transitions
    categories.js        Category CRUD
    settings.js          Settings + SMTP test
    scraper.js           Scraper endpoint
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
