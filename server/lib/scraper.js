// Swiss city coordinates for geolocation bias
const SWISS_CITIES = {
  'Zürich': { latitude: 47.3769, longitude: 8.5417 },
  'Bern': { latitude: 46.9480, longitude: 7.4474 },
  'Basel': { latitude: 47.5596, longitude: 7.5886 },
  'Luzern': { latitude: 47.0502, longitude: 8.3093 },
  'St. Gallen': { latitude: 47.4245, longitude: 9.3767 },
  'Lausanne': { latitude: 46.5197, longitude: 6.6323 },
  'Genf': { latitude: 46.2044, longitude: 6.1432 },
  'Winterthur': { latitude: 47.5001, longitude: 8.7240 },
  'Biel/Bienne': { latitude: 47.1368, longitude: 7.2467 },
  'Thun': { latitude: 46.7580, longitude: 7.6280 },
  'Aarau': { latitude: 47.3925, longitude: 8.0444 },
  'Schaffhausen': { latitude: 47.6960, longitude: 8.6340 },
  'Chur': { latitude: 46.8499, longitude: 9.5329 },
  'Zug': { latitude: 47.1662, longitude: 8.5155 },
  'Solothurn': { latitude: 47.2088, longitude: 7.5323 },
  'Baden': { latitude: 47.4734, longitude: 8.3064 },
  'Olten': { latitude: 47.3520, longitude: 7.9070 },
  'Rapperswil': { latitude: 47.2267, longitude: 8.8183 },
  'Frauenfeld': { latitude: 47.5535, longitude: 8.8988 },
  'Lugano': { latitude: 46.0037, longitude: 8.9511 },
};

function getCityCoordinates(cityName) {
  if (!cityName) return SWISS_CITIES['Zürich'];
  return SWISS_CITIES[cityName] || SWISS_CITIES['Zürich'];
}

async function scrapeGoogleMaps(searchTerm, options = {}) {
  const maxResults = options.maxResults || 30;
  const city = options.city || 'Zürich';
  const geolocation = getCityCoordinates(city);

  // Append city to search term so Google Maps actually searches in that location
  const fullSearchTerm = `${searchTerm} ${city}`;

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
      geolocation,
      permissions: ['geolocation'],
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    });

    const page = await context.newPage();
    page.setDefaultTimeout(30000);

    // Navigate to Google Maps with city included in search
    const searchUrl = `https://www.google.com/maps/search/${encodeURIComponent(fullSearchTerm)}`;
    await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });

    // Accept cookies — try multiple selectors for different Google consent screens
    try {
      await page.waitForTimeout(2000);
      const consentSelectors = [
        'button:has-text("Alle akzeptieren")',
        'button:has-text("Accept all")',
        'button:has-text("Tout accepter")',
        '[aria-label="Alle akzeptieren"]',
        '[aria-label="Accept all"]',
        'form[action*="consent"] button:first-of-type'
      ];
      for (const selector of consentSelectors) {
        const btn = page.locator(selector).first();
        if (await btn.isVisible({ timeout: 1000 }).catch(() => false)) {
          await btn.click();
          await page.waitForTimeout(2000);
          break;
        }
      }
    } catch (e) {
      // No cookie dialog, continue
    }

    // Wait for results feed — try multiple selectors
    let feedFound = false;
    const feedSelectors = ['[role="feed"]', '.m6QErb[aria-label]', 'div[role="main"] div[aria-label]'];
    for (const sel of feedSelectors) {
      try {
        await page.waitForSelector(sel, { timeout: 15000 });
        feedFound = true;
        break;
      } catch (e) {
        continue;
      }
    }

    if (!feedFound) {
      // Maybe we're on a single result page or no results
      await browser.close();
      throw new Error('Could not find results feed. Google Maps may have changed its layout or blocked the request.');
    }

    // Scroll through results to load more
    const feed = page.locator('[role="feed"]').first();
    let previousCount = 0;
    let scrollAttempts = 0;
    const maxScrollAttempts = 10;

    while (scrollAttempts < maxScrollAttempts) {
      await feed.evaluate(el => el.scrollTop = el.scrollHeight);
      await page.waitForTimeout(2000);

      const currentCount = await page.locator('[role="feed"] a[href*="/maps/place/"]').count();
      if (currentCount >= maxResults || currentCount === previousCount) break;
      previousCount = currentCount;
      scrollAttempts++;
    }

    // Extract business data from result cards — get as much as possible from the list view
    const results = await page.evaluate((max) => {
      const items = [];
      // Try multiple card selectors
      let cards = document.querySelectorAll('[role="feed"] a[href*="/maps/place/"]');
      if (cards.length === 0) {
        cards = document.querySelectorAll('[role="feed"] > div > div > a');
      }

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

    // Visit each result to get details — with shorter timeouts
    const businesses = [];
    for (const result of results) {
      if (!result.name) continue;

      try {
        await page.goto(result.href, { waitUntil: 'domcontentloaded', timeout: 10000 });
        // Wait briefly for content to render
        await page.waitForTimeout(1500);

        const details = await page.evaluate(() => {
          // Try to find address
          const addressEl = document.querySelector('[data-item-id="address"] .fontBodyMedium') ||
                           document.querySelector('button[data-item-id="address"]');
          const address = addressEl ? addressEl.textContent.trim() : '';

          // Try to find phone
          const phoneEl = document.querySelector('[data-item-id*="phone"] .fontBodyMedium') ||
                         document.querySelector('button[data-item-id*="phone"]');
          const phone = phoneEl ? phoneEl.textContent.trim() : '';

          // Try to find website
          const websiteEl = document.querySelector('[data-item-id="authority"] a') ||
                           document.querySelector('a[data-item-id="authority"]');
          const website = websiteEl ? websiteEl.href : '';

          return { address, phone, website };
        });

        businesses.push({
          businessName: result.name,
          address: details.address,
          phone: details.phone,
          websiteUrl: details.website,
          email: ''
        });
      } catch (err) {
        // Still add the business with just the name
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

module.exports = { scrapeGoogleMaps, SWISS_CITIES };
