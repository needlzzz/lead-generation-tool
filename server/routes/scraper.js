const express = require('express');
const { v4: uuidv4 } = require('uuid');
const dataStore = require('../lib/dataStore');
const { scrapeGoogleMaps, SWISS_CITIES } = require('../lib/scraper');
const { enrichEmails } = require('../lib/enrichment');
const { analyzeWebsite } = require('../lib/websiteAnalyzer');
const { checkDuplicate } = require('../lib/pipeline');

const router = express.Router();

// GET /api/scraper/cities — list available cities
router.get('/cities', (req, res) => {
  res.json({ cities: Object.keys(SWISS_CITIES) });
});

// POST /api/scraper/discover
router.post('/discover', async (req, res) => {
  const { categoryId, city } = req.body;
  if (!categoryId) return res.status(400).json({ error: 'categoryId is required' });

  const category = dataStore.get('categories', categoryId);
  if (!category) return res.status(400).json({ error: 'Category not found' });

  // Use city from request body (defaults to Zürich in scraper if not provided)
  const scraperCity = city || 'Zürich';

  try {
    let businesses;
    try {
      businesses = await scrapeGoogleMaps(category.searchTerm, { city: scraperCity });
    } catch (scraperErr) {
      if (scraperErr.message.includes('browserType.launch') || 
          scraperErr.message.includes('Executable doesn') ||
          scraperErr.message.includes('chromium') ||
          scraperErr.message.includes('Cannot find module')) {
        return res.status(503).json({ 
          error: 'Playwright/Chromium is not installed. Run "npx playwright install chromium" or use CSV Import instead.',
          code: 'SCRAPER_NOT_INSTALLED'
        });
      }
      throw scraperErr;
    }
    const existingLeads = dataStore.getAll('leads');
    const createdLeads = [];
    const duplicates = [];
    const now = new Date().toISOString();

    for (const biz of businesses) {
      const lead = {
        id: uuidv4(),
        businessName: biz.businessName,
        category: category.name,
        city: scraperCity,
        address: biz.address || '',
        phone: biz.phone || '',
        email: biz.email || '',
        websiteUrl: biz.websiteUrl || '',
        websiteQuality: biz.websiteUrl ? 'Poor' : 'None',
        googleRating: biz.googleRating || null,
        contactPerson: '',
        status: 'Discovered',
        dateDiscovered: now.split('T')[0],
        dateEmail1Sent: null,
        dateFollowUp1Sent: null,
        dateFollowUp2Sent: null,
        replyDate: null,
        replySentiment: null,
        calendlySent: false,
        meetingDate: null,
        decision: null,
        startDate: null,
        notes: '',
        activityLog: [{ date: now, action: 'Lead discovered', details: `Scraped from Google Maps: ${category.searchTerm} in ${scraperCity}` }]
      };

      const dupeWarnings = checkDuplicate(lead, existingLeads);
      if (dupeWarnings.length > 0) {
        duplicates.push({
          businessName: biz.businessName,
          existingLeadId: dupeWarnings[0].existingLead.id
        });
      }

      dataStore.save('leads', lead);
      existingLeads.push(lead); // Add to existing for subsequent dupe checks
      createdLeads.push(lead);
    }

    res.json({ leads: createdLeads, duplicates });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/scraper/enrich-emails (SSE — streams progress)
router.post('/enrich-emails', async (req, res) => {
  const { leadIds, city } = req.body;

  // Set up SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  function sendEvent(data) {
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  }

  // Get leads to enrich — either specific IDs or all discovered leads without email
  let leads;
  if (leadIds && leadIds.length > 0) {
    leads = leadIds.map(id => dataStore.get('leads', id)).filter(Boolean);
  } else {
    leads = dataStore.getAll('leads').filter(l => 
      !l.email && (l.status === 'Discovered' || l.status === 'Lost')
    );
  }

  if (leads.length === 0) {
    sendEvent({ type: 'done', enriched: 0, total: 0, results: [], message: 'No leads to enrich' });
    res.end();
    return;
  }

  const enrichCity = city || 'Zürich';

  sendEvent({ type: 'start', total: leads.length, city: enrichCity });

  try {
    const now = new Date().toISOString();
    let enrichedCount = 0;
    const allResults = [];

    try {
      await enrichEmails(leads, enrichCity, 
        // onProgress
        (current, total, name) => {
          sendEvent({ type: 'progress', current, total, businessName: name });
        },
        // onResult — save immediately so data is available even if enrichment is interrupted
        (result) => {
          allResults.push(result);
          if (result.email) {
            const lead = dataStore.get('leads', result.leadId);
            if (lead) {
              lead.email = result.email;
              lead.activityLog = lead.activityLog || [];
              lead.activityLog.push({
                date: now,
                action: 'Email enriched',
                details: `Found ${result.email} via ${result.source}`
              });
              dataStore.save('leads', lead);
              enrichedCount++;
              sendEvent({ type: 'found', businessName: result.businessName, email: result.email });
            }
          }
        }
      );
    } catch (enrichErr) {
      if (enrichErr.message.includes('Playwright') || 
          enrichErr.message.includes('chromium') ||
          enrichErr.message.includes('Cannot find module')) {
        sendEvent({ type: 'error', error: 'Playwright/Chromium is not installed. Run "npx playwright install chromium" first.' });
        res.end();
        return;
      }
      throw enrichErr;
    }

    sendEvent({ 
      type: 'done', 
      enriched: enrichedCount, 
      total: leads.length,
      results: allResults.map(r => ({ 
        businessName: r.businessName, 
        email: r.email, 
        source: r.source 
      }))
    });
  } catch (err) {
    sendEvent({ type: 'error', error: err.message });
  }

  res.end();
});

// POST /api/scraper/analyze-websites (SSE — streams progress)
router.post('/analyze-websites', async (req, res) => {
  const { leadIds } = req.body;

  // Set up SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  function sendEvent(data) {
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  }

  // Get leads to analyze — either specific IDs or all discovered leads with a website
  let leads;
  if (leadIds && leadIds.length > 0) {
    leads = leadIds.map(id => dataStore.get('leads', id)).filter(l => l && l.websiteUrl);
  } else {
    leads = dataStore.getAll('leads').filter(l =>
      l.websiteUrl && (l.status === 'Discovered' || l.status === 'Reached Out')
    );
  }

  if (leads.length === 0) {
    sendEvent({ type: 'done', analyzed: 0, total: 0, message: 'No leads with websites to analyze' });
    res.end();
    return;
  }

  sendEvent({ type: 'start', total: leads.length });

  let chromium;
  try {
    chromium = require('playwright').chromium;
  } catch (e) {
    sendEvent({ type: 'error', error: 'Playwright/Chromium is not installed. Run "npx playwright install chromium" first.' });
    res.end();
    return;
  }

  let browser;
  try {
    browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const context = await browser.newContext({
      locale: 'de-CH',
      viewport: { width: 1280, height: 800 },
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    });

    const page = await context.newPage();
    page.setDefaultTimeout(20000);

    const now = new Date().toISOString();
    let analyzedCount = 0;

    for (let i = 0; i < leads.length; i++) {
      const lead = leads[i];
      sendEvent({ type: 'progress', current: i + 1, total: leads.length, businessName: lead.businessName });

      try {
        const analysisOptions = {};
        // Pass Google rating if available on the lead (from scraper)
        if (lead.googleRating) analysisOptions.googleRating = lead.googleRating;

        const result = await analyzeWebsite(lead.websiteUrl, page, analysisOptions);

        // Update lead with analysis results
        lead.websiteQuality = result.quality;
        lead.websiteScore = result.score;
        lead.websiteIssues = result.issues;
        lead.websiteLoadTime = result.loadTimeMs;
        lead.websiteAnalyzedAt = now;
        lead.websiteTechStack = result.techStack;
        lead.websiteSecurityGrade = result.securityHeaders ? result.securityHeaders.grade : null;
        lead.websiteOpportunityScore = result.opportunityScore;
        lead.activityLog = lead.activityLog || [];

        // Build detailed activity log entry
        const techInfo = result.techStack && result.techStack.cms
          ? `, CMS: ${result.techStack.cms}${result.techStack.cmsVersion ? ' ' + result.techStack.cmsVersion : ''}`
          : '';
        const secInfo = result.securityHeaders
          ? `, Sicherheit: ${result.securityHeaders.grade}`
          : '';
        lead.activityLog.push({
          date: now,
          action: 'Website analyzed',
          details: `Score: ${result.score}/100 (${result.quality}), ${result.issues.length} issues${techInfo}${secInfo}, Opportunity: ${result.opportunityScore}/100`
        });

        dataStore.save('leads', lead);
        analyzedCount++;

        sendEvent({
          type: 'result',
          leadId: lead.id,
          businessName: lead.businessName,
          quality: result.quality,
          score: result.score,
          issues: result.issues,
          loadTimeMs: result.loadTimeMs,
          techStack: result.techStack,
          securityGrade: result.securityHeaders ? result.securityHeaders.grade : null,
          opportunityScore: result.opportunityScore
        });
      } catch (err) {
        sendEvent({ type: 'error-single', leadId: lead.id, businessName: lead.businessName, error: err.message });
      }

      // Polite delay between requests
      if (i < leads.length - 1) {
        await page.waitForTimeout(1500 + Math.random() * 1000);
      }
    }

    sendEvent({ type: 'done', analyzed: analyzedCount, total: leads.length });
  } catch (err) {
    sendEvent({ type: 'error', error: err.message });
  } finally {
    if (browser) await browser.close();
  }

  res.end();
});

module.exports = router;
