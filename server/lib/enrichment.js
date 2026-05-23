/**
 * Email enrichment module — pluggable architecture for multiple sources.
 * 
 * Each provider exports:
 *   name: string
 *   findEmail(businessName, city): Promise<{ email: string|null, source: string }>
 * 
 * Providers are tried in order. First one to return an email wins.
 */

// --- Provider: local.ch ---
async function localChFindEmail(businessName, city, page) {
  const searchQuery = `${businessName} ${city}`.trim();
  const searchUrl = `https://www.local.ch/de/q/${encodeURIComponent(searchQuery)}`;

  try {
    await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForTimeout(2000);

    // Accept cookie consent if present
    try {
      const consentBtn = page.locator('button:has-text("Alle akzeptieren"), button:has-text("Accept"), #onetrust-accept-btn-handler').first();
      if (await consentBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await consentBtn.click();
        await page.waitForTimeout(1000);
      }
    } catch (e) { /* no consent dialog */ }

    // Try to find email on the search results page first
    let email = await extractEmailFromPage(page);
    if (email) return { email, source: 'local.ch (search results)' };

    // Click the first result to go to the detail page
    const firstResult = page.locator('a[href*="/de/d/"], a[data-cy="search-result-entry"]').first();
    if (await firstResult.isVisible({ timeout: 3000 }).catch(() => false)) {
      await firstResult.click();
      await page.waitForTimeout(2000);
      email = await extractEmailFromPage(page);
      if (email) return { email, source: 'local.ch (detail page)' };
    }

    return { email: null, source: null };
  } catch (err) {
    return { email: null, source: null };
  }
}

// --- Provider: Website scrape (if lead has a website) ---
async function websiteFindEmail(websiteUrl, page) {
  if (!websiteUrl) return { email: null, source: null };

  try {
    await page.goto(websiteUrl, { waitUntil: 'domcontentloaded', timeout: 10000 });
    await page.waitForTimeout(1500);

    let email = await extractEmailFromPage(page);
    if (email) return { email, source: 'website (homepage)' };

    // Try common contact page paths
    const contactPaths = ['/kontakt', '/contact', '/impressum', '/about', '/ueber-uns'];
    const baseUrl = new URL(websiteUrl).origin;

    for (const contactPath of contactPaths) {
      try {
        await page.goto(`${baseUrl}${contactPath}`, { waitUntil: 'domcontentloaded', timeout: 8000 });
        await page.waitForTimeout(1000);
        email = await extractEmailFromPage(page);
        if (email) return { email, source: `website (${contactPath})` };
      } catch (e) {
        continue;
      }
    }

    return { email: null, source: null };
  } catch (err) {
    return { email: null, source: null };
  }
}

// --- Shared utility: extract email from current page ---
async function extractEmailFromPage(page) {
  return await page.evaluate(() => {
    // 1. Check mailto links
    const mailtoLinks = document.querySelectorAll('a[href^="mailto:"]');
    for (const link of mailtoLinks) {
      const href = link.getAttribute('href');
      const email = href.replace('mailto:', '').split('?')[0].trim().toLowerCase();
      if (email && email.includes('@') && !email.includes('example')) {
        return email;
      }
    }

    // 2. Scan visible text for email patterns
    const bodyText = document.body ? document.body.innerText : '';
    const emailRegex = /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g;
    const matches = bodyText.match(emailRegex) || [];

    // Filter out common junk emails
    const junkPatterns = ['example.com', 'test.com', 'noreply', 'no-reply', 'mailer-daemon', 'postmaster'];
    for (const match of matches) {
      const lower = match.toLowerCase();
      if (!junkPatterns.some(j => lower.includes(j))) {
        return lower;
      }
    }

    return null;
  });
}

/**
 * Main enrichment function — tries providers in order for a single lead.
 * 
 * @param {object} lead - Lead object with businessName, address, websiteUrl
 * @param {string} city - City to search in
 * @param {object} page - Playwright page instance (reused for performance)
 * @returns {Promise<{ email: string|null, source: string|null }>}
 */
async function enrichEmail(lead, city, page) {
  // Provider order: website first (if available), then local.ch
  const providers = [];

  if (lead.websiteUrl) {
    providers.push(() => websiteFindEmail(lead.websiteUrl, page));
  }

  providers.push(() => localChFindEmail(lead.businessName, city, page));

  // Try each provider in order
  for (const provider of providers) {
    const result = await provider();
    if (result.email) return result;
  }

  return { email: null, source: null };
}

/**
 * Enrich emails for multiple leads.
 * 
 * @param {Array} leads - Array of lead objects to enrich
 * @param {string} city - City context for searches
 * @param {function} onProgress - Callback(current, total, leadName) for progress updates
 * @param {function} onResult - Callback({ leadId, businessName, email, source }) called after each lead
 * @returns {Promise<Array<{ leadId, email, source }>>}
 */
async function enrichEmails(leads, city, onProgress, onResult) {
  let chromium;
  try {
    chromium = require('playwright').chromium;
  } catch (e) {
    throw new Error('Playwright is not installed. Run "npx playwright install chromium" first.');
  }

  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const context = await browser.newContext({
    locale: 'de-CH',
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  });

  const page = await context.newPage();
  page.setDefaultTimeout(15000);

  const results = [];

  try {
    for (let i = 0; i < leads.length; i++) {
      const lead = leads[i];
      if (onProgress) onProgress(i + 1, leads.length, lead.businessName);

      const { email, source } = await enrichEmail(lead, city, page);
      const result = { leadId: lead.id, businessName: lead.businessName, email, source };
      results.push(result);

      if (onResult) onResult(result);

      // Small delay between requests to be polite
      if (i < leads.length - 1) {
        await page.waitForTimeout(1000 + Math.random() * 1000);
      }
    }
  } finally {
    await browser.close();
  }

  return results;
}

module.exports = { enrichEmails, enrichEmail };
