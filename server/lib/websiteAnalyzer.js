/**
 * Website Quality Analyzer
 * 
 * Evaluates a business website on multiple signals and returns
 * a quality rating + specific issues that can be cited in outreach emails.
 * 
 * Checks:
 * - SSL/HTTPS
 * - Mobile responsiveness (viewport meta, responsive layout)
 * - Page load speed (basic timing)
 * - Modern tech indicators (outdated frameworks, Flash, tables for layout)
 * - Basic SEO (title, meta description, h1)
 * - Accessibility basics (alt tags, contrast)
 * - Cookie/GDPR banner presence
 * - Security headers (HSTS, CSP, X-Frame-Options, etc.)
 * - CMS/Tech stack detection (WordPress, Wix, Jimdo, Squarespace, Shopify, etc.)
 * - Opportunity scoring (Google rating, copyright recency, CMS type)
 */

const https = require('https');
const http = require('http');

/**
 * Analyze a website and return quality assessment.
 * 
 * @param {string} url - Website URL to analyze
 * @param {object} page - Playwright page instance
 * @param {object} [options] - Optional analysis context
 * @param {number} [options.googleRating] - Google Maps rating (1-5) for opportunity scoring
 * @returns {Promise<{ quality: string, score: number, issues: Array<{id: string, label: string, detail: string}>, loadTimeMs: number, techStack: object, securityHeaders: object, opportunityScore: number }>}
 */
async function analyzeWebsite(url, page, options = {}) {
  const issues = [];
  let loadTimeMs = 0;
  let responseHeaders = {};

  // Normalize URL
  if (!url.startsWith('http')) {
    url = 'https://' + url;
  }

  // Always try HTTPS first, even if URL was stored with http://
  // (Many sites redirect http → https, and we should detect that)
  const httpsUrl = url.replace(/^http:\/\//, 'https://');
  let navigatedUrl = httpsUrl;
  let hasSSL = true;

  // --- Check 1 & 2: Load the page, measure timing, capture response headers, determine SSL ---
  const startTime = Date.now();
  try {
    const response = await page.goto(httpsUrl, { waitUntil: 'domcontentloaded', timeout: 15000 });
    if (response) {
      responseHeaders = response.headers() || {};
      // Check the actual URL we landed on (after redirects)
      navigatedUrl = page.url();
      hasSSL = navigatedUrl.startsWith('https://');
    }
  } catch (err) {
    // HTTPS failed — try HTTP fallback
    try {
      const httpUrl = url.replace(/^https:\/\//, 'http://');
      const response = await page.goto(httpUrl, { waitUntil: 'domcontentloaded', timeout: 15000 });
      if (response) {
        responseHeaders = response.headers() || {};
        navigatedUrl = page.url();
        hasSSL = navigatedUrl.startsWith('https://'); // Maybe it redirected to HTTPS
      }
    } catch (err2) {
      issues.push({
        id: 'unreachable',
        label: 'Website nicht erreichbar',
        detail: 'Ihre Website konnte nicht geladen werden — potenzielle Kunden sehen eine Fehlermeldung statt Ihrem Angebot.'
      });
      return {
        quality: 'Poor', score: 0, issues, loadTimeMs: 0,
        techStack: null, securityHeaders: null, opportunityScore: 100
      };
    }
  }
  loadTimeMs = Date.now() - startTime;

  // Wait for full load after domcontentloaded (non-blocking timing)
  try {
    await page.waitForLoadState('load', { timeout: 10000 });
  } catch (e) {
    // Ignore — some sites never fully fire 'load' due to third-party scripts
  }

  // --- Detect bot protection / WAF blocking ---
  const pageTitle = await page.title();
  const currentUrl = page.url();
  const isBotBlocked = (
    pageTitle.toLowerCase().includes('access interrupted') ||
    pageTitle.toLowerCase().includes('access denied') ||
    pageTitle.toLowerCase().includes('attention required') ||
    pageTitle.toLowerCase().includes('just a moment') ||
    pageTitle.toLowerCase().includes('checking your browser') ||
    currentUrl.includes('/notify-Notify') ||
    currentUrl.includes('challenge') ||
    currentUrl.includes('captcha')
  );

  if (isBotBlocked) {
    issues.push({
      id: 'bot-blocked',
      label: 'Analyse nicht möglich',
      detail: 'Ihre Website blockiert automatisierte Zugriffe — die Qualitätsanalyse konnte nicht durchgeführt werden.'
    });
    return {
      quality: 'None', score: -1, issues, loadTimeMs,
      techStack: null, securityHeaders: null, opportunityScore: 50
    };
  }

  // SSL issue: only flag if HTTPS is truly unavailable
  if (!hasSSL) {
    issues.push({
      id: 'no-ssl',
      label: 'Keine sichere Verbindung',
      detail: 'Ihre Website hat kein SSL-Zertifikat — Besucher sehen die Warnung "Nicht sicher" und verlassen die Seite, bevor sie Ihr Angebot sehen.'
    });
  }

  // --- Check 3: Page speed (adjusted thresholds for Playwright cold load) ---
  if (loadTimeMs > 8000) {
    issues.push({
      id: 'slow-load',
      label: 'Sehr lange Ladezeit',
      detail: `Ihre Website lädt über ${Math.round(loadTimeMs / 1000)} Sekunden — Studien zeigen, dass über 50% der Besucher nach 3 Sekunden abspringen.`
    });
  } else if (loadTimeMs > 5000) {
    issues.push({
      id: 'moderate-load',
      label: 'Lange Ladezeit',
      detail: `Ihre Website lädt ${(loadTimeMs / 1000).toFixed(1)} Sekunden — das kostet Sie Kunden und verschlechtert Ihr Google-Ranking.`
    });
  }

  // --- Check 4: Security Headers ---
  const securityHeaders = analyzeSecurityHeaders(responseHeaders, hasSSL, issues);

  // --- Check 5-10: In-page analysis + Tech Stack Detection ---
  const analysis = await page.evaluate(() => {
    const results = {};

    // Mobile viewport
    const viewportMeta = document.querySelector('meta[name="viewport"]');
    results.hasViewport = !!viewportMeta;
    results.viewportContent = viewportMeta ? viewportMeta.getAttribute('content') : null;

    // SEO basics
    results.title = document.title || '';
    results.hasMetaDescription = !!document.querySelector('meta[name="description"]');
    results.h1Count = document.querySelectorAll('h1').length;
    results.h1Text = document.querySelector('h1')?.textContent?.trim() || '';

    // Images without alt
    const images = document.querySelectorAll('img');
    results.totalImages = images.length;
    results.imagesWithoutAlt = [...images].filter(img => !img.getAttribute('alt') || img.getAttribute('alt').trim() === '').length;

    // Outdated tech signals
    results.hasFlash = !!document.querySelector('embed[type*="flash"], object[type*="flash"], .swf');
    results.hasTableLayout = (() => {
      const tables = document.querySelectorAll('table');
      let layoutTables = 0;
      tables.forEach(t => {
        if (!t.querySelector('th') && t.offsetWidth > 600) layoutTables++;
      });
      return layoutTables > 0;
    })();

    // Check for outdated jQuery or frameworks
    results.hasJQuery = !!window.jQuery;
    results.jQueryVersion = window.jQuery ? window.jQuery.fn?.jquery : null;

    // Check for responsive design signals
    results.usesMediaQueries = (() => {
      try {
        for (const sheet of document.styleSheets) {
          try {
            for (const rule of sheet.cssRules || []) {
              if (rule.type === CSSRule.MEDIA_RULE) return true;
            }
          } catch (e) { /* cross-origin stylesheet */ }
        }
      } catch (e) {}
      return false;
    })();

    // Check body width vs viewport
    results.bodyWidth = document.body?.scrollWidth || 0;
    results.viewportWidth = window.innerWidth;

    // Cookie/GDPR banner
    results.hasGDPRBanner = !!document.querySelector('[class*="cookie"], [id*="cookie"], [class*="consent"], [id*="consent"]');

    // --- CMS / Tech Stack Detection ---
    const techStack = {
      cms: null,
      cmsVersion: null,
      framework: null,
      ecommerce: null,
      hosting: null,
      plugins: [],
      analytics: [],
      other: []
    };

    // WordPress detection
    const wpGenerator = document.querySelector('meta[name="generator"][content*="WordPress"]');
    if (wpGenerator) {
      techStack.cms = 'WordPress';
      const wpContent = wpGenerator.getAttribute('content') || '';
      const vMatch = wpContent.match(/WordPress\s+([\d.]+)/i);
      techStack.cmsVersion = vMatch ? vMatch[1] : null;
    } else if (
      document.querySelector('link[href*="wp-content"], link[href*="wp-includes"], script[src*="wp-content"], script[src*="wp-includes"]') ||
      document.querySelector('meta[name="generator"][content*="WordPress"]')
    ) {
      techStack.cms = 'WordPress';
      // Try to detect version from readme or other signals
      const wpLinks = document.querySelectorAll('link[href*="wp-includes"]');
      if (wpLinks.length > 0) {
        const vMatch = wpLinks[0].getAttribute('href')?.match(/ver=([\d.]+)/);
        if (vMatch) techStack.cmsVersion = vMatch[1];
      }
    }

    // Detect WP plugins/theme from CSS and JS references
    if (techStack.cms === 'WordPress') {
      const wpResources = [...document.querySelectorAll('link[href*="wp-content/plugins"], script[src*="wp-content/plugins"]')];
      const detectedPlugins = new Set();
      wpResources.forEach(el => {
        const href = el.getAttribute('href') || el.getAttribute('src') || '';
        const pluginMatch = href.match(/wp-content\/plugins\/([^/]+)/);
        if (pluginMatch) detectedPlugins.add(pluginMatch[1]);
      });
      techStack.plugins = [...detectedPlugins].slice(0, 10);

      // Detect theme
      const themeLinks = document.querySelectorAll('link[href*="wp-content/themes"]');
      if (themeLinks.length > 0) {
        const themeMatch = themeLinks[0].getAttribute('href')?.match(/wp-content\/themes\/([^/]+)/);
        if (themeMatch) techStack.other.push(`Theme: ${themeMatch[1]}`);
      }
    }

    // Wix detection
    if (
      document.querySelector('meta[name="generator"][content*="Wix"]') ||
      document.querySelector('script[src*="static.wixstatic.com"]') ||
      document.querySelector('link[href*="static.wixstatic.com"]') ||
      document.querySelector('[id*="SITE_CONTAINER"]') ||
      (window._wixBiSession !== undefined)
    ) {
      techStack.cms = 'Wix';
    }

    // Squarespace detection
    if (
      document.querySelector('meta[name="generator"][content*="Squarespace"]') ||
      document.querySelector('script[src*="squarespace.com"]') ||
      document.querySelector('link[href*="squarespace-cdn.com"]') ||
      document.querySelector('[class*="sqsp"], [id*="squarespace"]')
    ) {
      techStack.cms = 'Squarespace';
    }

    // Jimdo detection
    if (
      document.querySelector('meta[name="generator"][content*="Jimdo"]') ||
      document.querySelector('script[src*="jimdo"]') ||
      document.querySelector('[class*="jimdo"], [data-jimdo]') ||
      document.querySelector('link[href*="jimdo"]')
    ) {
      techStack.cms = 'Jimdo';
    }

    // Joomla detection
    if (
      document.querySelector('meta[name="generator"][content*="Joomla"]') ||
      document.querySelector('script[src*="/media/jui/"], script[src*="/media/system/"]') ||
      document.querySelector('link[href*="/media/jui/"]')
    ) {
      techStack.cms = 'Joomla';
      const joomlaGen = document.querySelector('meta[name="generator"][content*="Joomla"]');
      if (joomlaGen) {
        const vMatch = joomlaGen.getAttribute('content')?.match(/Joomla!\s*([\d.]+)/i);
        if (vMatch) techStack.cmsVersion = vMatch[1];
      }
    }

    // Webflow detection
    if (
      document.querySelector('meta[name="generator"][content*="Webflow"]') ||
      document.querySelector('html[data-wf-site], html[data-wf-page]') ||
      document.querySelector('script[src*="webflow.js"]') ||
      document.querySelector('link[href*="webflow"]')
    ) {
      techStack.cms = 'Webflow';
    }

    // Shopify detection
    if (
      document.querySelector('meta[name="shopify-digital-wallet"]') ||
      document.querySelector('link[href*="cdn.shopify.com"]') ||
      document.querySelector('script[src*="cdn.shopify.com"]') ||
      (window.Shopify !== undefined)
    ) {
      techStack.cms = 'Shopify';
      techStack.ecommerce = 'Shopify';
    }

    // WooCommerce detection (on top of WordPress)
    if (
      document.querySelector('script[src*="woocommerce"], link[href*="woocommerce"]') ||
      document.querySelector('.woocommerce, .wc-block')
    ) {
      techStack.ecommerce = 'WooCommerce';
    }

    // Typo3 detection
    if (
      document.querySelector('meta[name="generator"][content*="TYPO3"]') ||
      document.querySelector('script[src*="typo3"], link[href*="typo3"]')
    ) {
      techStack.cms = 'TYPO3';
      const typo3Gen = document.querySelector('meta[name="generator"][content*="TYPO3"]');
      if (typo3Gen) {
        const vMatch = typo3Gen.getAttribute('content')?.match(/TYPO3\s+CMS\s+([\d.]+)/i);
        if (vMatch) techStack.cmsVersion = vMatch[1];
      }
    }

    // Drupal detection
    if (
      document.querySelector('meta[name="generator"][content*="Drupal"]') ||
      document.querySelector('script[src*="/core/misc/drupal.js"]') ||
      document.querySelector('[class*="drupal"]')
    ) {
      techStack.cms = 'Drupal';
    }

    // Framework detection (modern indicators)
    results.hasReact = !!document.querySelector('[data-reactroot], [data-reactid], #__next, #__nuxt');
    if (results.hasReact) {
      if (document.querySelector('#__next')) techStack.framework = 'Next.js';
      else techStack.framework = 'React';
    }
    if (document.querySelector('#__nuxt, [data-server-rendered]')) techStack.framework = 'Nuxt/Vue';
    if (document.querySelector('[ng-app], [data-ng-app], [ng-version]')) techStack.framework = 'Angular';

    // Hosting / CDN detection (from page-level DOM)
    if (document.querySelector('script[src*="netlify"], link[href*="netlify"]')) techStack.hosting = 'Netlify';
    if (document.querySelector('script[src*="vercel"], link[href*="vercel"]')) techStack.hosting = 'Vercel';

    // Analytics detection
    if (document.querySelector('script[src*="google-analytics.com"], script[src*="googletagmanager.com"], script[src*="gtag"]')) {
      techStack.analytics.push('Google Analytics');
    }
    if (document.querySelector('script[src*="matomo"], script[src*="piwik"]')) {
      techStack.analytics.push('Matomo');
    }
    if (document.querySelector('script[src*="hotjar"]')) techStack.analytics.push('Hotjar');
    if (document.querySelector('script[src*="plausible"]')) techStack.analytics.push('Plausible');

    results.techStack = techStack;

    // WordPress version (legacy field, kept for backward compat)
    results.hasWordPress = techStack.cms === 'WordPress';
    results.wpVersion = techStack.cms === 'WordPress'
      ? (techStack.cmsVersion ? `WordPress ${techStack.cmsVersion}` : 'WordPress')
      : null;

    // Check last-modified or copyright year
    const allText = document.body?.innerText?.toLowerCase() || '';
    const copyrightMatch = allText.match(/©\s*(\d{4})|copyright\s*(\d{4})/i);
    results.copyrightYear = copyrightMatch ? parseInt(copyrightMatch[1] || copyrightMatch[2]) : null;

    // Font awesome or icon library
    results.hasIconLibrary = !!document.querySelector('link[href*="font-awesome"], link[href*="fontawesome"], svg.icon, [class*="fa-"]');

    // Mixed content
    const httpResources = [...document.querySelectorAll('img[src^="http:"], script[src^="http:"], link[href^="http:"]')];
    results.mixedContentCount = httpResources.length;

    // --- Email extraction ---
    const foundEmails = new Set();

    // 1. Extract from mailto: links
    document.querySelectorAll('a[href^="mailto:"]').forEach(link => {
      const email = link.getAttribute('href').replace('mailto:', '').split('?')[0].trim().toLowerCase();
      if (email && email.includes('@') && email.includes('.')) {
        foundEmails.add(email);
      }
    });

    // 2. Extract from visible text using regex
    const bodyText = document.body?.innerText || '';
    const emailRegex = /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g;
    const textMatches = bodyText.match(emailRegex) || [];
    textMatches.forEach(email => {
      const cleaned = email.toLowerCase().trim();
      // Filter out common false positives
      if (!cleaned.endsWith('.png') && !cleaned.endsWith('.jpg') && !cleaned.endsWith('.svg') &&
          !cleaned.includes('example.com') && !cleaned.includes('domain.com') &&
          !cleaned.includes('wixpress.com') && !cleaned.includes('sentry.io')) {
        foundEmails.add(cleaned);
      }
    });

    // 3. Extract from href attributes that might contain obfuscated emails
    document.querySelectorAll('a[href*="@"]').forEach(link => {
      const href = link.getAttribute('href') || '';
      const match = href.match(/([a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,})/);
      if (match) foundEmails.add(match[1].toLowerCase());
    });

    results.emails = [...foundEmails];

    return results;
  });

  // --- Process analysis results ---

  // Mobile responsiveness
  if (!analysis.hasViewport) {
    issues.push({
      id: 'no-viewport',
      label: 'Nicht für Smartphones optimiert',
      detail: 'Ihre Website wird auf dem Handy nicht korrekt angezeigt — über 60% aller Suchanfragen kommen heute von Mobilgeräten.'
    });
  } else if (!analysis.usesMediaQueries && !analysis.hasReact) {
    issues.push({
      id: 'no-responsive',
      label: 'Kein responsives Design',
      detail: 'Ihre Website passt sich nicht an verschiedene Bildschirmgrössen an — Kunden auf Tablets und Smartphones sehen eine abgeschnittene Seite.'
    });
  }

  // SEO
  if (!analysis.title || analysis.title.length < 10) {
    issues.push({
      id: 'no-title',
      label: 'Schlechte Google-Sichtbarkeit',
      detail: 'Ihrer Website fehlt ein aussagekräftiger Seitentitel — dadurch erscheint sie bei Google-Suchen deutlich weiter unten.'
    });
  }
  if (!analysis.hasMetaDescription) {
    issues.push({
      id: 'no-meta-desc',
      label: 'Kein Beschreibungstext für Google',
      detail: 'Ohne Meta-Beschreibung zeigt Google einen zufälligen Textausschnitt — Suchende wissen nicht, was sie bei Ihnen erwartet, und klicken seltener.'
    });
  }
  if (analysis.h1Count === 0) {
    issues.push({
      id: 'no-h1',
      label: 'Fehlende Hauptüberschrift',
      detail: 'Google erkennt nicht, worum es auf Ihrer Seite geht — das verschlechtert Ihr Ranking für relevante Suchbegriffe.'
    });
  }

  // Accessibility
  if (analysis.totalImages > 0 && analysis.imagesWithoutAlt > analysis.totalImages * 0.5) {
    issues.push({
      id: 'missing-alt',
      label: 'Bilder ohne Beschreibung',
      detail: `${analysis.imagesWithoutAlt} von ${analysis.totalImages} Bildern haben keine Beschreibung — Google kann diese Bilder nicht indexieren, und Sie verpassen Bild-Suchergebnisse.`
    });
  }

  // Outdated tech
  if (analysis.hasFlash) {
    issues.push({
      id: 'uses-flash',
      label: 'Veraltete Technologie (Flash)',
      detail: 'Ihre Website verwendet Flash — das funktioniert auf keinem modernen Browser oder Smartphone mehr. Besucher sehen leere Bereiche.'
    });
  }
  if (analysis.hasTableLayout) {
    issues.push({
      id: 'table-layout',
      label: 'Veralteter Seitenaufbau',
      detail: 'Ihre Website verwendet eine Technik aus den 2000er-Jahren — sie lässt sich nicht für Mobilgeräte anpassen und wirkt auf Besucher veraltet.'
    });
  }

  // Outdated WordPress (using tech stack info)
  const techStack = analysis.techStack;
  if (techStack.cms === 'WordPress' && techStack.cmsVersion) {
    const major = parseFloat(techStack.cmsVersion);
    if (major < 6.0) {
      issues.push({
        id: 'outdated-wp',
        label: 'Veraltetes WordPress',
        detail: `Ihre Website läuft auf WordPress ${techStack.cmsVersion} — diese Version hat bekannte Sicherheitslücken und wird nicht mehr aktualisiert.`
      });
    }
  }

  // Outdated Joomla
  if (techStack.cms === 'Joomla' && techStack.cmsVersion) {
    const major = parseFloat(techStack.cmsVersion);
    if (major < 4.0) {
      issues.push({
        id: 'outdated-joomla',
        label: 'Veraltetes Joomla',
        detail: `Joomla ${techStack.cmsVersion} wird nicht mehr unterstützt — Ihre Website ist anfällig für Hackerangriffe.`
      });
    }
  }

  // Copyright year check
  const currentYear = new Date().getFullYear();
  if (analysis.copyrightYear && analysis.copyrightYear < currentYear - 2) {
    issues.push({
      id: 'outdated-copyright',
      label: 'Website wirkt veraltet',
      detail: `Das Copyright-Jahr auf Ihrer Website zeigt noch ${analysis.copyrightYear} — das signalisiert Besuchern, dass die Seite nicht mehr gepflegt wird.`
    });
  }

  // Mixed content
  if (analysis.mixedContentCount > 0) {
    issues.push({
      id: 'mixed-content',
      label: 'Sicherheitswarnung im Browser',
      detail: 'Teile Ihrer Website werden unverschlüsselt geladen — Besucher sehen eine Warnung im Browser, was das Vertrauen in Ihr Geschäft untergräbt.'
    });
  }

  // --- Calculate score and quality ---
  const score = calculateScore(issues, loadTimeMs);
  const quality = scoreToQuality(score);

  // --- Calculate opportunity score ---
  const opportunityScore = calculateOpportunityScore(score, issues, analysis, techStack, options);

  return {
    quality,
    score,
    issues,
    loadTimeMs,
    techStack,
    securityHeaders,
    opportunityScore,
    emails: analysis.emails || []
  };
}

/**
 * Analyze HTTP security headers from the page response.
 * Pushes issues for missing/misconfigured headers.
 * 
 * @param {object} headers - Response headers (all lowercase keys from Playwright)
 * @param {boolean} hasSSL - Whether the site uses HTTPS
 * @param {Array} issues - Issues array to push to
 * @returns {object} Security headers analysis summary
 */
function analyzeSecurityHeaders(headers, hasSSL, issues) {
  const result = {
    grade: 'F',
    headers: {},
    missing: [],
    present: []
  };

  // Security headers to check (key = header name lowercase, value = description)
  const securityChecks = [
    {
      header: 'strict-transport-security',
      name: 'HSTS',
      critical: true,
      requiresSSL: true
    },
    {
      header: 'content-security-policy',
      name: 'CSP',
      critical: true,
      requiresSSL: false
    },
    {
      header: 'x-frame-options',
      name: 'X-Frame-Options',
      critical: false,
      requiresSSL: false
    },
    {
      header: 'x-content-type-options',
      name: 'X-Content-Type-Options',
      critical: false,
      requiresSSL: false
    },
    {
      header: 'referrer-policy',
      name: 'Referrer-Policy',
      critical: false,
      requiresSSL: false
    },
    {
      header: 'permissions-policy',
      name: 'Permissions-Policy',
      critical: false,
      requiresSSL: false
    }
  ];

  let presentCount = 0;
  let criticalMissing = 0;

  for (const check of securityChecks) {
    const value = headers[check.header] || null;
    result.headers[check.header] = value;

    if (value) {
      presentCount++;
      result.present.push(check.name);
    } else {
      // Only count as missing if SSL requirement is met
      if (!check.requiresSSL || hasSSL) {
        result.missing.push(check.name);
        if (check.critical) criticalMissing++;
      }
    }
  }

  // Calculate grade (A+ to F)
  const total = securityChecks.length;
  const ratio = presentCount / total;
  if (ratio >= 0.9) result.grade = 'A+';
  else if (ratio >= 0.8) result.grade = 'A';
  else if (ratio >= 0.65) result.grade = 'B';
  else if (ratio >= 0.5) result.grade = 'C';
  else if (ratio >= 0.3) result.grade = 'D';
  else result.grade = 'F';

  // Push issues for missing critical headers (only if site uses HTTPS)
  if (hasSSL && criticalMissing > 0) {
    const missingCritical = [];
    if (!headers['strict-transport-security']) missingCritical.push('HSTS');
    if (!headers['content-security-policy']) missingCritical.push('CSP');

    if (missingCritical.length > 0) {
      issues.push({
        id: 'missing-security-headers',
        label: 'Fehlender Schutz vor Angriffen',
        detail: 'Ihrer Website fehlen wichtige Sicherheitseinstellungen — das macht sie anfälliger für Hackerangriffe und kann das Vertrauen Ihrer Kunden gefährden.'
      });
    }
  }

  // Push issue if grade is D or F (many headers missing)
  if (result.grade === 'D' || result.grade === 'F') {
    if (!issues.find(i => i.id === 'missing-security-headers')) {
      issues.push({
        id: 'weak-security-headers',
        label: 'Schwache Sicherheitskonfiguration',
        detail: 'Ihre Website hat nur minimale Schutzmassnahmen konfiguriert — moderne Websites brauchen bessere Absicherung gegen Missbrauch.'
      });
    }
  }

  return result;
}

/**
 * Calculate an "opportunity score" (0-100) representing how likely
 * this lead is to convert to a client. Higher = better prospect.
 * 
 * Factors:
 * - Website quality score (worse site = higher opportunity)
 * - Number of issues (more issues = more things to pitch)
 * - CMS type (WordPress/Joomla users more open to redesign than Wix/Squarespace)
 * - Copyright recency (stale = business may not prioritize web, but site needs update)
 * - Google rating (higher-rated businesses have more budget & care about image)
 * 
 * @param {number} qualityScore - Website quality score (0-100)
 * @param {Array} issues - Array of detected issues
 * @param {object} analysis - Full page analysis results
 * @param {object} techStack - Detected tech stack
 * @param {object} options - External context (googleRating, etc.)
 * @returns {number} Opportunity score 0-100
 */
function calculateOpportunityScore(qualityScore, issues, analysis, techStack, options) {
  let opportunity = 0;

  // --- Factor 1: Website quality (inverted — worse site = higher opportunity) ---
  // A site scoring 20/100 gets 40 opportunity points; a site scoring 80/100 gets 10
  const qualityFactor = Math.round(Math.max(0, (100 - qualityScore) * 0.5));
  opportunity += Math.min(qualityFactor, 45); // Cap at 45 points

  // --- Factor 2: Issue count (more issues = more pitch angles) ---
  const issueCount = issues.length;
  if (issueCount >= 5) opportunity += 15;
  else if (issueCount >= 3) opportunity += 10;
  else if (issueCount >= 1) opportunity += 5;

  // --- Factor 3: CMS type (affects willingness to change) ---
  // WordPress/Joomla/Drupal users are used to paying for web work → more open
  // Wix/Jimdo/Squarespace users chose DIY → less likely to pay for redesign
  // No CMS / custom → could go either way
  if (techStack) {
    const openCMS = ['WordPress', 'Joomla', 'Drupal', 'TYPO3'];
    const diyCMS = ['Wix', 'Jimdo', 'Squarespace'];

    if (openCMS.includes(techStack.cms)) {
      opportunity += 15; // Used to paying developers
    } else if (diyCMS.includes(techStack.cms)) {
      opportunity += 5; // DIY mindset, less likely
    } else if (techStack.cms === 'Shopify' || techStack.cms === 'Webflow') {
      opportunity += 10; // Invest in web but may want upgrade
    } else if (!techStack.cms && !techStack.framework) {
      opportunity += 12; // Custom/old site — likely needs professional help
    }
  }

  // --- Factor 4: Copyright staleness (stale = site clearly neglected) ---
  const currentYear = new Date().getFullYear();
  if (analysis.copyrightYear) {
    const yearsOld = currentYear - analysis.copyrightYear;
    if (yearsOld >= 4) opportunity += 10; // Very stale
    else if (yearsOld >= 2) opportunity += 5; // Somewhat stale
  }

  // --- Factor 5: Google rating (higher rating = more budget & brand-conscious) ---
  const googleRating = options.googleRating;
  if (googleRating != null && googleRating > 0) {
    if (googleRating >= 4.5) opportunity += 15; // Excellent business, cares about reputation
    else if (googleRating >= 4.0) opportunity += 12;
    else if (googleRating >= 3.5) opportunity += 8;
    else opportunity += 3; // Low rating — may not invest
  }

  return Math.min(100, Math.max(0, opportunity));
}

function calculateScore(issues, loadTimeMs) {
  // Start at 100, deduct for issues
  let score = 100;

  const deductions = {
    'unreachable': 100,
    'bot-blocked': 0,
    'no-ssl': 20,
    'slow-load': 15,
    'moderate-load': 8,
    'no-viewport': 25,
    'no-responsive': 15,
    'no-title': 10,
    'no-meta-desc': 8,
    'no-h1': 5,
    'missing-alt': 8,
    'uses-flash': 20,
    'table-layout': 15,
    'outdated-wp': 12,
    'outdated-joomla': 12,
    'outdated-copyright': 10,
    'mixed-content': 10,
    'missing-security-headers': 12,
    'weak-security-headers': 8
  };

  for (const issue of issues) {
    score -= deductions[issue.id] || 5;
  }

  return Math.max(0, Math.min(100, score));
}

function scoreToQuality(score) {
  if (score >= 80) return 'Good';
  if (score >= 50) return 'Outdated';
  return 'Poor';
}

module.exports = { analyzeWebsite, analyzeSecurityHeaders, calculateOpportunityScore, calculateScore, scoreToQuality };
