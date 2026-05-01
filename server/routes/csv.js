const express = require('express');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const dataStore = require('../lib/dataStore');
const { parseCSV, generateCSV, mapRowToLead, EXPORT_COLUMNS } = require('../lib/csvService');
const { checkDuplicate } = require('../lib/pipeline');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// POST /api/csv/import
router.post('/import', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

  try {
    const csvString = req.file.buffer.toString('utf-8');
    const { headers, rows } = parseCSV(csvString);

    if (rows.length === 0) {
      return res.status(400).json({ error: 'CSV file is empty or has no data rows' });
    }

    const existingLeads = dataStore.getAll('leads');
    const categories = dataStore.getAll('categories');
    const categoryNames = categories.map(c => c.name);

    const createdLeads = [];
    const duplicates = [];
    let skipped = 0;

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const mapped = mapRowToLead(row);

      // Skip rows without business name
      if (!mapped.businessName) {
        skipped++;
        continue;
      }

      // Skip rows with unknown category
      if (mapped.category && !categoryNames.includes(mapped.category)) {
        skipped++;
        duplicates.push({ row: i + 2, businessName: mapped.businessName, reason: `Unknown category: ${mapped.category}` });
        continue;
      }

      const now = new Date().toISOString();
      const lead = {
        id: uuidv4(),
        businessName: mapped.businessName,
        category: mapped.category || '',
        address: mapped.address || '',
        phone: mapped.phone || '',
        email: mapped.email || '',
        websiteUrl: mapped.websiteUrl || '',
        websiteQuality: mapped.websiteQuality || 'None',
        contactPerson: mapped.contactPerson || '',
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
        activityLog: [{ date: now, action: 'Lead imported', details: 'Imported from CSV' }]
      };

      // Check duplicates
      const dupeWarnings = checkDuplicate(lead, existingLeads);
      if (dupeWarnings.length > 0) {
        duplicates.push({
          row: i + 2,
          businessName: mapped.businessName,
          reason: `Duplicate: ${dupeWarnings[0].field} matches "${dupeWarnings[0].existingLead.businessName}"`
        });
      }

      dataStore.save('leads', lead);
      existingLeads.push(lead);
      createdLeads.push(lead);
    }

    res.json({
      imported: createdLeads.length,
      skipped,
      leads: createdLeads,
      duplicates
    });
  } catch (err) {
    res.status(400).json({ error: `Failed to parse CSV: ${err.message}` });
  }
});

// GET /api/csv/export
router.get('/export', (req, res) => {
  const tab = req.query.tab || 'discovery';
  const exportConfig = EXPORT_COLUMNS[tab];

  if (!exportConfig) {
    return res.status(400).json({ error: `Unknown tab: ${tab}. Use: discovery, outreach, replies, clients` });
  }

  let leads = dataStore.getAll('leads');

  // Filter leads based on tab
  switch (tab) {
    case 'outreach':
      leads = leads.filter(l => ['Reached Out', 'No Response'].includes(l.status));
      break;
    case 'replies':
      leads = leads.filter(l => ['Replied', 'Meeting Scheduled'].includes(l.status));
      break;
    case 'clients':
      leads = leads.filter(l => ['Meeting Scheduled', 'Client Won', 'Lost'].includes(l.status) && l.meetingDate);
      break;
    // discovery: show all
  }

  // Apply category filter if provided
  if (req.query.category) {
    leads = leads.filter(l => l.category === req.query.category);
  }

  const rows = leads.map(exportConfig.mapLead);
  const csv = generateCSV(exportConfig.headers, rows);

  const today = new Date().toISOString().split('T')[0];
  const filename = `${tab}-export-${today}.csv`;

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.send(csv);
});

module.exports = router;
