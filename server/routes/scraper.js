const express = require('express');
const { v4: uuidv4 } = require('uuid');
const dataStore = require('../lib/dataStore');
const { scrapeGoogleMaps, SWISS_CITIES } = require('../lib/scraper');
const { enrichEmails } = require('../lib/enrichment');
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
        address: biz.address || '',
        phone: biz.phone || '',
        email: biz.email || '',
        websiteUrl: biz.websiteUrl || '',
        websiteQuality: biz.websiteUrl ? 'Poor' : 'None',
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

// POST /api/scraper/enrich-emails
router.post('/enrich-emails', async (req, res) => {
  const { leadIds, city } = req.body;

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
    return res.json({ enriched: 0, results: [], message: 'No leads to enrich' });
  }

  const enrichCity = city || 'Zürich';

  try {
    let results;
    try {
      results = await enrichEmails(leads, enrichCity);
    } catch (enrichErr) {
      if (enrichErr.message.includes('Playwright') || 
          enrichErr.message.includes('chromium') ||
          enrichErr.message.includes('Cannot find module')) {
        return res.status(503).json({ 
          error: 'Playwright/Chromium is not installed. Run "npx playwright install chromium" first.',
          code: 'SCRAPER_NOT_INSTALLED'
        });
      }
      throw enrichErr;
    }

    // Update leads with found emails
    const now = new Date().toISOString();
    let enrichedCount = 0;

    for (const result of results) {
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
        }
      }
    }

    res.json({ 
      enriched: enrichedCount, 
      total: leads.length,
      results: results.map(r => ({ 
        businessName: r.businessName, 
        email: r.email, 
        source: r.source 
      }))
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
