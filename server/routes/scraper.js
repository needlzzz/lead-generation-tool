const express = require('express');
const { v4: uuidv4 } = require('uuid');
const dataStore = require('../lib/dataStore');
const { scrapeGoogleMaps } = require('../lib/scraper');
const { checkDuplicate } = require('../lib/pipeline');

const router = express.Router();

// POST /api/scraper/discover
router.post('/discover', async (req, res) => {
  const { categoryId } = req.body;
  if (!categoryId) return res.status(400).json({ error: 'categoryId is required' });

  const category = dataStore.get('categories', categoryId);
  if (!category) return res.status(400).json({ error: 'Category not found' });

  try {
    let businesses;
    try {
      businesses = await scrapeGoogleMaps(category.searchTerm);
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
        activityLog: [{ date: now, action: 'Lead discovered', details: `Scraped from Google Maps: ${category.searchTerm}` }]
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

module.exports = router;
