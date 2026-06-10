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

1. Select a **category** from the dropdown (e.g., "Handwerker")
2. Select a **city** (or "All Cities" to scrape all 20)
3. Click **🔍 Auto-Discover (Scraper)**
4. Confirm the scrape — Playwright opens Google Maps and extracts businesses
5. Leads appear in the Discovery table

**Alternatives:**
- **📥 CSV Import** — import leads from a CSV file
- **➕ New Lead** — manually add a single lead

### 3. Analyze Websites

1. In the Discovery table, **select leads** using the checkboxes (or use Select All)
2. Click **🔬 Analyze Selected** to analyze specific leads (allows re-analysis)
   - Or click **🔬 Analyze Websites** to analyze all unanalyzed leads in bulk
3. The analyzer checks each website for:
   - SSL/HTTPS status
   - Mobile-friendliness
   - Page speed
   - SEO basics (title, meta description, headings)
   - Security headers
   - Outdated technology
   - Copyright year (staleness)
4. Results appear as color-coded **quality badges** in the table:
   - 🟢 Good (80+) — well-maintained site
   - 🟡 Outdated (50-79) — has issues, good prospect
   - 🔴 Poor (<50) — many issues, strong pitch opportunity
5. Email addresses found on the website are automatically saved to the lead

### 4. Generate Preview Sites

1. After a lead is analyzed, a **🎨** button appears in the table row
2. Click **🎨** to generate a personalized demo website for that lead
3. Progress streams in real-time (config → build → screenshot → deploy)
4. Once deployed, a **👁** button appears — click to view the preview at `preview.kaelint.ch/{slug}/`

**What the preview contains:**
- Business name and city in the hero
- Niche-appropriate theme, colors, and services
- Placeholder images matching the business category
- German content throughout

**The preview expires after 30 days.**

### 5. Send Outreach Emails

1. Once a lead has an email + analysis + preview, click **📧 Email 1** in the table
2. The email preview modal shows the rendered template with:
   - `[Website-Probleme]` → bullet list of specific findings
   - `[Preview-Link]` → link to the generated preview site
   - Business name, contact person, etc. filled in
3. Review the email and click **📧 Send**
4. The lead moves to "Reached Out" status

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
| `[Name]` | Contact person or "Team von [Business Name]" |
| `[Business Name]` | Lead's business name |
| `[Website-Probleme]` | Bullet list of analysis findings |
| `[Website-Score]` | Website quality score (e.g., "35/100") |
| `[Preview-Link]` | Preview site URL |
| `[Preview-Screenshot]` | Screenshot image URL |
| `[Preview-Ablauf]` | Preview expiry date in German |
| `[CALENDLY-LINK]` | Your Calendly booking link |
| `[Dein Name]` | Your name |

### Keyboard Shortcuts
- Click any lead row to open the **detail modal** (activity log, findings, preview)
- Use checkboxes + "Analyze Selected" for selective re-analysis

## Tips

1. **Best workflow:** Discover → Analyze → Generate Preview → Send Email 1
2. **Re-analyze** a lead by selecting it and clicking "Analyze Selected" (useful after website changes)
3. **Preview not building?** Check that Playwright is installed: `npx playwright install chromium`
4. **SMTP issues on corporate network?** Enable the proxy checkbox in Settings
5. **Categories are customizable** — edit templates in Settings → Categories & Templates
6. **Export to CSV** any time for backup or external use
