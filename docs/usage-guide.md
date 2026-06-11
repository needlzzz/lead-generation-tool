# Lead Generation Tool — Usage Guide

## Overview

This tool helps you discover local Swiss businesses, analyze their websites, generate personalized preview sites, and send cold outreach emails — all from a single interface.

## The Full Flow

### 1. Setup (one-time)

1. Start the server: `npm start`
2. Open `http://localhost:3000`
3. On first launch, the Settings modal opens — fill in:
   - **Your Name** (used in email signatures as `[Dein Name]`)
   - **Calendly Link** (used in follow-up emails as `[CALENDLY-LINK]`)
   - **SMTP settings** (host, port, username, password, from address)
   - **Preview Site Repo Path** (should be `/Users/tabkamac/private/dev/git/kaelint-website-business`)
4. Click "Test Connection" to verify SMTP works

### 2. Discover Leads

1. Select a **category** from the dropdown (e.g., "Handwerker") — 45 categories available, sorted alphabetically, covering Handwerk, Beauty, Sport, Gastro, Gewerbe, Kreativ, Medizin, Recht, Institutionell
2. Select a **city** (or "All Cities" to scrape all 20) — sorted alphabetically
3. Click **🔍 Discover**
4. Confirm the scrape — Playwright opens Google Maps and extracts businesses
5. Leads appear in the Discovery table
6. Re-scraping is allowed — you can scrape the same category+city combination again to find new businesses

**Alternatives:**
- **📥 CSV Import** — import leads from a CSV file
- **➕ New Lead** — manually add a single lead

**Discovery table features:**
- Columns are sortable (Category, Status, Discovered, Quality)
- **Scrape Log tab** shows a matrix/grid view (categories × cities) with coverage at a glance

### 3. Analyze Websites

1. In the Discovery table, **select leads** using the checkboxes (or use Select All)
2. Click **Analyze Selected** to analyze specific leads (allows re-analysis)
   - Or click **Analyze Websites** to analyze all unanalyzed leads in bulk
3. The analyzer checks each website for:
   - SSL/HTTPS status (tries HTTPS first, checks final URL after redirects)
   - Mobile-friendliness
   - Page speed (thresholds: 5s warning, 8s critical — accounts for Playwright cold load)
   - SEO basics (title, meta description, headings)
   - Accessibility (images without alt text — shows specific filenames)
   - Outdated technology
   - Copyright year (staleness)
   - Bot/WAF protection detection (returns quality "None" with clear message)
   - Email extraction (decodes percent-encoded/obfuscated mailto links)
   - Page count, nav depth, word count
   - CTA detection, contact form detection, opening hours detection
   - Social media count, favicon, team section, testimonials
   - Google reviews link, free CMS plan detection
4. Results appear as color-coded **quality badges** in the table:
   - 🟢 Good (80+) — well-maintained site
   - 🟡 Outdated (50-79) — has issues, good prospect
   - 🔴 Poor (<50) — many issues, strong pitch opportunity
   - ⚪ None — site blocked by bot/WAF protection
5. Email addresses found on the website are automatically saved to the lead
6. Site complexity data is stored per lead (`websiteComplexity` field) — used by the preview config generator to mirror the client's existing features

**Issues detected include:** no-cta, no-contact-form, no-opening-hours, no-social-media, no-favicon, no-trust-signals, free-plan-cms (in addition to the classic issues like missing SSL, slow speed, etc.)

All issue descriptions are constructive and client-facing (not fear-based).

### 4. Generate Preview Sites

1. After a lead is analyzed, a **Preview** button appears in the table row
2. Click **Preview** to generate a personalized demo website for that lead
3. Progress streams in real-time (config → build → screenshot → deploy)
4. Once deployed, a **View** button appears — click to view the preview at `preview.kaelint.ch/{slug}/`

**What the preview contains:**
- Business name and city in the hero
- Niche-appropriate theme, colors, and services
- Features mirroring what the client already has (based on `websiteComplexity` analysis)
- Placeholder images matching the business category
- German content throughout
- Default price list data when price list feature is enabled

**Technical details:**
- Preview URL: `preview.kaelint.ch/{slug}/` (no /de/ prefix)
- `postalCode` defaults to "0000" (Zod schema requires non-empty)
- Gallery image paths use filename only (no directory prefix)
- Preview generator validates `previewSiteRepoPath` before starting
- `slugify()` handles null/undefined input safely

**The preview expires after 30 days.**

### 5. Send Outreach Emails

1. Once a lead has an email + analysis + preview, click **📧 Email 1** in the table
2. The email preview modal shows the rendered template with:
   - `[Greeting]` → "Guten Tag Herr/Frau Nachname" or plain "Guten Tag"
   - `[Website-Probleme]` → top 5 essential issues with bullet points + constructive consequence
   - `[Preview-Link]` → link to the generated preview site
   - Business name, contact person, etc. filled in
3. Click the **Edit** button to customize the email body/subject before sending
4. Review the email and click **📧 Send**
5. The lead moves to "Reached Out" status

**Email tone:** Warm and constructive (not fear-based/urgent). Same unified template for all 45 categories.

### 6. Follow-Up Pipeline

The **Outreach Pipeline** tab shows all leads in the follow-up sequence:

| Day | Action | Template |
|-----|--------|----------|
| 0 | Email 1 (Cold Outreach) | Findings + preview link |
| 3 | Follow-Up 1 | Gentle reminder |
| 6 | Follow-Up 2 | Last chance + Calendly link |
| 7+ | Mark as Cold | No response |

- Follow-ups due appear in the **Dashboard Alerts** section at the top
- Click the follow-up button when it's time

### 7. Track Replies & Close

- When a lead replies, click **📝 Log Reply** (set date, sentiment, notes)
- Lead moves to the **Replies & Meetings** tab
- Schedule a meeting → lead moves to "Meeting Scheduled"
- After the meeting: **Won** (becomes a client) or **Lost** (archived)

## Key Features

### Filters
- **Category dropdown** — filter leads by business type
- **City dropdown** — filter by Swiss city
- **No website only** — show leads without a website (not a fit for this tool)
- **Has email only** — show leads with email (ready for outreach)

### Email Placeholders
Templates support these placeholders (auto-filled per lead):

| Placeholder | Resolves to |
|-------------|-------------|
| `[Greeting]` | "Guten Tag Herr/Frau Nachname" or "Guten Tag" |
| `[Name]` | Contact person or "Team von [Business Name]" |
| `[Business Name]` | Lead's business name |
| `[Website-Probleme]` | Top 5 findings with bullet + constructive consequence |
| `[Website-Probleme-Anzahl]` | Count of issues shown |
| `[Website-Probleme-Kurz]` | Comma-separated labels |
| `[Website-Score]` | Website quality score (e.g., "35/100") |
| `[Preview-Link]` | Preview site URL |
| `[Preview-Screenshot]` | Screenshot image URL |
| `[Preview-Ablauf]` | Preview expiry date in German |
| `[Preview-Disclaimer]` | Placeholder image note |
| `[CALENDLY-LINK]` | Your Calendly booking link (from settings) |
| `[Dein Name]` | Your name (from settings) |

### Keyboard Shortcuts
- Click any lead row to open the **detail modal** (activity log, findings, preview)
- Use checkboxes + "Analyze Selected" for selective re-analysis

## Key Commands

```bash
npm start              # Server on localhost:3000
npm test               # Unit + property tests (excludes e2e)
npm run test:e2e:preview  # E2E preview build test (slow, real Astro build)
```

## Tips

1. **Best workflow:** Discover → Analyze → Generate Preview → Send Email 1
2. **Re-analyze** a lead by selecting it and clicking "Analyze Selected" (useful after website changes)
3. **Re-scrape** the same category+city combination freely — no longer blocked
4. **Preview not building?** Check that Playwright is installed: `npx playwright install chromium`
5. **Preview generator validates** `previewSiteRepoPath` before starting — check Settings if you get errors
6. **SMTP issues on corporate network?** Enable the proxy checkbox in Settings
7. **45 categories available** — covering Handwerk, Beauty, Sport, Gastro, Gewerbe, Kreativ, Medizin, Recht, Institutionell
8. **Export to CSV** any time for backup or external use
9. **Edit emails before sending** — click the Edit button in the email preview modal
10. **Scrape Log tab** shows coverage at a glance (categories × cities grid)

## Testing

- **272 unit tests + 8 property-based tests** — run with `npm test`
- **E2E preview build test** — run with `npm run test:e2e:preview` (slow, performs a real Astro build)
- `npm test` automatically excludes e2e tests
