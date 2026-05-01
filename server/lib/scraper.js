async function scrapeGoogleMaps(searchTerm, options = {}) {
  const maxResults = options.maxResults || 50;
  const timeout = options.timeout || 60000;

  let chromium;
  try {
    chromium = require('playwright').chromium;
  } catch (e) {
    throw new Error('Playwright is not installed. Run "npx playwright install chromium" first.');
  }

  let browser;
  try {
    browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const context = await browser.newContext({
      locale: 'de-CH',
      geolocation: { latitude: 47.3769, longitude: 8.5417 }, // Zürich
      permissions: ['geolocation']
    });

    const page = await context.newPage();
    page.setDefaultTimeout(timeout);

    // Navigate to Google Maps
    const searchUrl = `https://www.google.com/maps/search/${encodeURIComponent(searchTerm)}`;
    await page.goto(searchUrl, { waitUntil: 'networkidle' });

    // Accept cookies if dialog appears
    try {
      const acceptBtn = page.locator('button:has-text("Alle akzeptieren"), button:has-text("Accept all")');
      await acceptBtn.click({ timeout: 5000 });
      await page.waitForTimeout(1000);
    } catch (e) {
      // No cookie dialog, continue
    }

    // Wait for results to load
    await page.waitForSelector('[role="feed"]', { timeout: 15000 });

    // Scroll through results to load more
    const feed = page.locator('[role="feed"]');
    let previousCount = 0;
    let scrollAttempts = 0;
    const maxScrollAttempts = 20;

    while (scrollAttempts < maxScrollAttempts) {
      await feed.evaluate(el => el.scrollTop = el.scrollHeight);
      await page.waitForTimeout(1500);

      const currentCount = await page.locator('[role="feed"] > div > div > a').count();
      if (currentCount >= maxResults || currentCount === previousCount) break;
      previousCount = currentCount;
      scrollAttempts++;
    }

    // Extract business data from result cards
    const results = await page.evaluate((max) => {
      const items = [];
      const cards = document.querySelectorAll('[role="feed"] > div > div > a');

      for (let i = 0; i < Math.min(cards.length, max); i++) {
        const card = cards[i];
        const ariaLabel = card.getAttribute('aria-label') || '';
        const href = card.getAttribute('href') || '';

        items.push({
          name: ariaLabel,
          href: href
        });
      }
      return items;
    }, maxResults);

    // Visit each result to get details
    const businesses = [];
    for (const result of results) {
      if (!result.name) continue;

      try {
        await page.goto(result.href, { waitUntil: 'networkidle', timeout: 15000 });
        await page.waitForTimeout(1000);

        const details = await page.evaluate(() => {
          const getText = (selector) => {
            const el = document.querySelector(selector);
            return el ? el.textContent.trim() : '';
          };

          const getByAriaLabel = (label) => {
            const el = document.querySelector(`[aria-label*="${label}"]`);
            return el ? el.textContent.trim() : '';
          };

          const getLink = (pattern) => {
            const links = document.querySelectorAll('a[href]');
            for (const link of links) {
              if (link.href && link.href.match(pattern)) {
                return link.href;
              }
            }
            return '';
          };

          // Try to find address
          const addressBtn = document.querySelector('[data-item-id="address"] .fontBodyMedium');
          const address = addressBtn ? addressBtn.textContent.trim() : '';

          // Try to find phone
          const phoneBtn = document.querySelector('[data-item-id*="phone"] .fontBodyMedium');
          const phone = phoneBtn ? phoneBtn.textContent.trim() : '';

          // Try to find website
          const websiteBtn = document.querySelector('[data-item-id="authority"] a');
          const website = websiteBtn ? websiteBtn.href : '';

          return { address, phone, website };
        });

        businesses.push({
          businessName: result.name,
          address: details.address,
          phone: details.phone,
          websiteUrl: details.website,
          email: '' // Google Maps rarely shows email directly
        });
      } catch (err) {
        // Skip this business if detail extraction fails
        businesses.push({
          businessName: result.name,
          address: '',
          phone: '',
          websiteUrl: '',
          email: ''
        });
      }
    }

    await browser.close();
    return businesses;
  } catch (err) {
    if (browser) await browser.close();
    throw new Error(`Scraper failed: ${err.message}`);
  }
}

module.exports = { scrapeGoogleMaps };
