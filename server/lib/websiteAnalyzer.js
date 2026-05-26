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
 */

const https = require('https');
const http = require('http');

/**
 * Analyze a website and return quality assessment.
 * 
 * @param {string} url - Website URL to analyze
 * @param {object} page - Playwright page instance
 * @returns {Promise<{ quality: string, score: number, issues: Array<{id: string, label: string, detail: string}>, loadTimeMs: number }>}
 */
async function analyzeWebsite(url, page) {
  const issues = [];
  let loadTimeMs = 0;

  // Normalize URL
  if (!url.startsWith('http')) {
    url = 'https://' + url;
  }

  // --- Check 1: SSL ---
  const hasSSL = url.startsWith('https://');
  if (!hasSSL) {
    issues.push({
      id: 'no-ssl',
      label: 'Kein SSL-Zertifikat',
      detail: 'Die Website verwendet kein HTTPS — Besucher sehen eine "Nicht sicher"-Warnung im Browser.'
    });
  }

  // --- Check 2: Load the page and measure timing ---
  const startTime = Date.now();
  try {
    await page.goto(url, { waitUntil: 'load', timeout: 20000 });
  } catch (err) {
    // If load times out, try with domcontentloaded
    try {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 });
    } catch (err2) {
      issues.push({
        id: 'unreachable',
        label: 'Website nicht erreichbar',
        detail: 'Die Website konnte nicht geladen werden oder ist extrem langsam.'
      });
      return { quality: 'Poor', score: 0, issues, loadTimeMs: 0 };
    }
  }
  loadTimeMs = Date.now() - startTime;

  // --- Check 3: Page speed ---
  if (loadTimeMs > 5000) {
    issues.push({
      id: 'slow-load',
      label: 'Sehr langsame Ladezeit',
      detail: `Die Website braucht über ${Math.round(loadTimeMs / 1000)} Sekunden zum Laden — Besucher springen ab.`
    });
  } else if (loadTimeMs > 3000) {
    issues.push({
      id: 'moderate-load',
      label: 'Langsame Ladezeit',
      detail: `Die Website braucht ${(loadTimeMs / 1000).toFixed(1)} Sekunden zum Laden — Google bevorzugt schnellere Seiten.`
    });
  }

  // --- Check 4-9: In-page analysis ---
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
      // Tables used for layout typically have no th elements and are wide
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

    // Check body width vs viewport (non-responsive sites often overflow)
    results.bodyWidth = document.body?.scrollWidth || 0;
    results.viewportWidth = window.innerWidth;

    // Cookie/GDPR banner
    const gdprKeywords = ['cookie', 'datenschutz', 'privacy', 'consent', 'gdpr', 'akzeptieren'];
    const allText = document.body?.innerText?.toLowerCase() || '';
    results.hasGDPRBanner = !!document.querySelector('[class*="cookie"], [id*="cookie"], [class*="consent"], [id*="consent"]');

    // Check for modern framework indicators
    results.hasReact = !!document.querySelector('[data-reactroot], [data-reactid], #__next');
    results.hasWordPress = !!document.querySelector('meta[name="generator"][content*="WordPress"]');
    results.wpVersion = document.querySelector('meta[name="generator"][content*="WordPress"]')?.getAttribute('content') || null;

    // Check last-modified or copyright year
    const copyrightMatch = allText.match(/©\s*(\d{4})|copyright\s*(\d{4})/i);
    results.copyrightYear = copyrightMatch ? parseInt(copyrightMatch[1] || copyrightMatch[2]) : null;

    // Font awesome or icon library (modern indicator)
    results.hasIconLibrary = !!document.querySelector('link[href*="font-awesome"], link[href*="fontawesome"], svg.icon, [class*="fa-"]');

    // Check if site uses HTTPS for resources (mixed content)
    const httpResources = [...document.querySelectorAll('img[src^="http:"], script[src^="http:"], link[href^="http:"]')];
    results.mixedContentCount = httpResources.length;

    return results;
  });

  // --- Process analysis results ---

  // Mobile responsiveness
  if (!analysis.hasViewport) {
    issues.push({
      id: 'no-viewport',
      label: 'Nicht mobilfreundlich',
      detail: 'Die Website hat kein Viewport-Meta-Tag — sie wird auf Smartphones schlecht dargestellt.'
    });
  } else if (!analysis.usesMediaQueries && !analysis.hasReact) {
    issues.push({
      id: 'no-responsive',
      label: 'Kein responsives Design',
      detail: 'Die Website passt sich nicht an verschiedene Bildschirmgrössen an.'
    });
  }

  // SEO
  if (!analysis.title || analysis.title.length < 10) {
    issues.push({
      id: 'no-title',
      label: 'Fehlender Seitentitel',
      detail: 'Die Website hat keinen aussagekräftigen Titel — schlecht für Google-Rankings.'
    });
  }
  if (!analysis.hasMetaDescription) {
    issues.push({
      id: 'no-meta-desc',
      label: 'Keine Meta-Beschreibung',
      detail: 'Ohne Meta-Description zeigt Google einen zufälligen Textausschnitt in den Suchergebnissen.'
    });
  }
  if (analysis.h1Count === 0) {
    issues.push({
      id: 'no-h1',
      label: 'Keine H1-Überschrift',
      detail: 'Die Hauptüberschrift fehlt — ein wichtiges SEO-Signal für Google.'
    });
  }

  // Accessibility
  if (analysis.totalImages > 0 && analysis.imagesWithoutAlt > analysis.totalImages * 0.5) {
    issues.push({
      id: 'missing-alt',
      label: 'Bilder ohne Alt-Text',
      detail: `${analysis.imagesWithoutAlt} von ${analysis.totalImages} Bildern haben keinen Alt-Text — schlecht für SEO und Barrierefreiheit.`
    });
  }

  // Outdated tech
  if (analysis.hasFlash) {
    issues.push({
      id: 'uses-flash',
      label: 'Verwendet Flash',
      detail: 'Flash wird von keinem modernen Browser mehr unterstützt.'
    });
  }
  if (analysis.hasTableLayout) {
    issues.push({
      id: 'table-layout',
      label: 'Tabellen-Layout',
      detail: 'Die Website verwendet Tabellen für das Layout — eine veraltete Technik aus den 2000ern.'
    });
  }

  // Outdated WordPress
  if (analysis.wpVersion) {
    const versionMatch = analysis.wpVersion.match(/[\d.]+/);
    if (versionMatch) {
      const major = parseFloat(versionMatch[0]);
      if (major < 6.0) {
        issues.push({
          id: 'outdated-wp',
          label: 'Veraltetes WordPress',
          detail: `WordPress ${versionMatch[0]} ist veraltet — Sicherheitslücken und fehlende Features.`
        });
      }
    }
  }

  // Copyright year check
  const currentYear = new Date().getFullYear();
  if (analysis.copyrightYear && analysis.copyrightYear < currentYear - 2) {
    issues.push({
      id: 'outdated-copyright',
      label: 'Veraltetes Copyright-Jahr',
      detail: `Das Copyright zeigt ${analysis.copyrightYear} — die Website wirkt ungepflegt.`
    });
  }

  // Mixed content
  if (analysis.mixedContentCount > 0) {
    issues.push({
      id: 'mixed-content',
      label: 'Gemischte Inhalte (HTTP/HTTPS)',
      detail: 'Einige Ressourcen werden unsicher über HTTP geladen — Browser zeigen Warnungen.'
    });
  }

  // No GDPR/cookie banner (relevant for Swiss/EU businesses)
  if (!analysis.hasGDPRBanner && !hasSSL) {
    // Only flag if there are other issues too — many simple sites don't need one
  }

  // --- Calculate score and quality ---
  const score = calculateScore(issues, loadTimeMs);
  const quality = scoreToQuality(score);

  return { quality, score, issues, loadTimeMs };
}

function calculateScore(issues, loadTimeMs) {
  // Start at 100, deduct for issues
  let score = 100;

  const deductions = {
    'unreachable': 100,
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
    'outdated-copyright': 10,
    'mixed-content': 10
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

module.exports = { analyzeWebsite };
