/**
 * Screenshot Capturer Module
 *
 * Captures a PNG screenshot of a built preview site's above-the-fold content
 * using Playwright. Handles Playwright unavailability gracefully and never throws.
 *
 * @module screenshotCapturer
 */

const path = require('path');
const fs = require('fs');

/**
 * Capture a screenshot of a built preview site.
 *
 * @param {string} slug - The preview slug
 * @param {string} previewSiteRepoPath - Path to kaelint-website-business repo (where dist/previews/ lives)
 * @returns {Promise<{success: boolean, screenshotPath?: string, error?: string}>}
 */
async function captureScreenshot(slug, previewSiteRepoPath) {
  // 1. Check Playwright is available
  let chromium;
  try {
    chromium = require('playwright').chromium;
  } catch (err) {
    return {
      success: false,
      error: 'Playwright/Chromium nicht installiert. Führe "npx playwright install chromium" aus.'
    };
  }

  // 2. Construct file path to built HTML and verify it exists
  const htmlPath = path.join(previewSiteRepoPath, 'dist', 'previews', slug, 'de', 'index.html');
  if (!fs.existsSync(htmlPath)) {
    return {
      success: false,
      error: `Built HTML not found: ${htmlPath}`
    };
  }
  const fileUrl = `file://${htmlPath}`;

  // 3. Launch Playwright, navigate, capture screenshot
  let browser;
  try {
    browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto(fileUrl, { waitUntil: 'networkidle', timeout: 10000 });

    // Capture screenshot of full viewport
    const screenshotBuffer = await page.screenshot({ type: 'png' });
    await browser.close();
    browser = null;

    // 4. Save using atomic write (temp+rename)
    const outputDir = path.join(__dirname, '..', 'data', 'previews', slug);
    fs.mkdirSync(outputDir, { recursive: true });
    const finalPath = path.join(outputDir, 'screenshot.png');
    const tmpPath = finalPath + '.tmp.' + Date.now();
    fs.writeFileSync(tmpPath, screenshotBuffer);
    fs.renameSync(tmpPath, finalPath);

    // 5. Return success
    return { success: true, screenshotPath: finalPath };
  } catch (err) {
    // Categorize errors
    if (err.message && err.message.includes('Timeout')) {
      return {
        success: false,
        error: 'Screenshot-Timeout: Seite konnte nicht geladen werden'
      };
    }
    if (err.message && (err.message.includes('launch') || err.message.includes('executable') || err.message.includes('browser'))) {
      return {
        success: false,
        error: `Browser konnte nicht gestartet werden: ${err.message}`
      };
    }
    return {
      success: false,
      error: err.message || 'Unbekannter Fehler beim Screenshot'
    };
  } finally {
    // Always close browser if still open
    if (browser) {
      try {
        await browser.close();
      } catch (closeErr) {
        // Ignore close errors
      }
    }
  }
}

module.exports = { captureScreenshot };
