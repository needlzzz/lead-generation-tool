const express = require('express');
const { v4: uuidv4 } = require('uuid');
const dataStore = require('../lib/dataStore');
const { validateTransition, getDueToday, checkDuplicate } = require('../lib/pipeline');

const router = express.Router();

// ---------------------------------------------------------------------------
// Lightweight projection — strip heavy fields for list responses
// ---------------------------------------------------------------------------

function projectLead(lead) {
  return {
    id: lead.id,
    businessName: lead.businessName,
    category: lead.category,
    city: lead.city || '',
    address: lead.address || '',
    phone: lead.phone || '',
    email: lead.email || '',
    websiteUrl: lead.websiteUrl || '',
    websiteQuality: lead.websiteQuality || 'None',
    websiteScore: lead.websiteScore != null ? lead.websiteScore : null,
    websiteAnalyzedAt: lead.websiteAnalyzedAt || null,
    contactPerson: lead.contactPerson || '',
    status: lead.status,
    dateDiscovered: lead.dateDiscovered || null,
    dateEmail1Sent: lead.dateEmail1Sent || null,
    dateFollowUp1Sent: lead.dateFollowUp1Sent || null,
    dateFollowUp2Sent: lead.dateFollowUp2Sent || null,
    replyDate: lead.replyDate || null,
    replySentiment: lead.replySentiment || null,
    calendlySent: lead.calendlySent || false,
    meetingDate: lead.meetingDate || null,
    decision: lead.decision || null,
    startDate: lead.startDate || null,
    notes: lead.notes || '',
    previewUrl: lead.previewUrl || null,
    previewExpiresAt: lead.previewExpiresAt || null,
    googleRating: lead.googleRating || null,
    emailBounced: lead.emailBounced || false
  };
  // Deliberately omits: activityLog, websiteIssues, websiteComplexity,
  // websiteTechStack, websiteSecurityGrade, websiteOpportunityScore,
  // websiteLoadTime, previewScreenshotPath, previewGeneratedAt
}

// ---------------------------------------------------------------------------
// GET /api/leads — paginated, filtered, lightweight
// ---------------------------------------------------------------------------

router.get('/', (req, res) => {
  try {
    const filter = {};
    if (req.query.category) filter.category = req.query.category;
    if (req.query.status) filter.status = req.query.status;
    if (req.query.city) filter.city = req.query.city;

    let leads = dataStore.getAll('leads', Object.keys(filter).length ? filter : null);

    // Total count before pagination
    const total = leads.length;

    // Pagination (default: page 1, limit 100)
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(500, Math.max(1, parseInt(req.query.limit) || 100));
    const offset = (page - 1) * limit;

    leads = leads.slice(offset, offset + limit);

    // Return lightweight projections
    res.json({
      leads: leads.map(projectLead),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to read leads' });
  }
});

// ---------------------------------------------------------------------------
// GET /api/leads/counts — fast status counts without sending lead data
// ---------------------------------------------------------------------------

router.get('/counts', (req, res) => {
  try {
    const leads = dataStore.getAll('leads');
    const counts = {};
    for (const lead of leads) {
      counts[lead.status] = (counts[lead.status] || 0) + 1;
    }
    res.json({ counts, total: leads.length });
  } catch (err) {
    res.status(500).json({ error: 'Failed to compute counts' });
  }
});

// ---------------------------------------------------------------------------
// GET /api/leads/scrape-matrix — aggregated category × city counts (for scrape log)
// ---------------------------------------------------------------------------

router.get('/scrape-matrix', (req, res) => {
  try {
    const leads = dataStore.getAll('leads');
    const scrapeMap = {};  // "category::city" → { count, lastDate }
    const allCities = new Set();
    const allCats = new Set();

    for (const lead of leads) {
      const city = lead.city;
      if (!city) continue;
      const cat = lead.category || '(keine)';
      const key = `${cat}::${city}`;

      allCities.add(city);
      allCats.add(cat);

      if (!scrapeMap[key]) {
        scrapeMap[key] = { count: 0, lastDate: lead.dateDiscovered || null };
      }
      scrapeMap[key].count++;
      if (lead.dateDiscovered && (!scrapeMap[key].lastDate || lead.dateDiscovered > scrapeMap[key].lastDate)) {
        scrapeMap[key].lastDate = lead.dateDiscovered;
      }
    }

    res.json({
      matrix: scrapeMap,
      cities: [...allCities].sort((a, b) => a.localeCompare(b, 'de')),
      categories: [...allCats].sort((a, b) => a.localeCompare(b, 'de'))
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to compute scrape matrix' });
  }
});

// ---------------------------------------------------------------------------
// GET /api/leads/due-today — leads with follow-ups due (limited response)
// ---------------------------------------------------------------------------

router.get('/due-today', (req, res) => {
  try {
    const leads = dataStore.getAll('leads');
    const today = new Date().toISOString().split('T')[0];
    const due = getDueToday(leads, today);

    // Project each array in the result to lightweight fields
    const projectDue = (arr) => arr.map(l => ({
      id: l.id,
      businessName: l.businessName,
      email: l.email,
      status: l.status
    }));

    res.json({
      followUp1Due: projectDue(due.followUp1Due || []),
      followUp2Due: projectDue(due.followUp2Due || []),
      markColdDue: projectDue(due.markColdDue || [])
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to compute due follow-ups' });
  }
});

// ---------------------------------------------------------------------------
// GET /api/leads/check-replies — limited
// ---------------------------------------------------------------------------

router.get('/check-replies', (req, res) => {
  try {
    const leads = dataStore.getAll('leads');
    const outreachLeads = leads
      .filter(l => l.status === 'Reached Out' && l.email)
      .sort((a, b) => (a.dateEmail1Sent || '').localeCompare(b.dateEmail1Sent || ''))
      .slice(0, 50) // Only first 50 — no need to show all
      .map(l => ({
        id: l.id,
        businessName: l.businessName,
        email: l.email,
        status: l.status,
        dateEmail1Sent: l.dateEmail1Sent
      }));
    res.json({ leads: outreachLeads });
  } catch (err) {
    res.status(500).json({ error: 'Failed to get reply check list' });
  }
});

// ---------------------------------------------------------------------------
// GET /api/leads/:id — full lead with all fields
// ---------------------------------------------------------------------------

router.get('/:id', (req, res) => {
  const lead = dataStore.get('leads', req.params.id);
  if (!lead) return res.status(404).json({ error: 'Lead not found' });
  res.json({ lead });
});

// ---------------------------------------------------------------------------
// POST /api/leads — create
// ---------------------------------------------------------------------------

router.post('/', (req, res) => {
  const { businessName, category, city, address, phone, email, websiteUrl, websiteQuality, contactPerson } = req.body;

  if (!businessName) return res.status(400).json({ error: 'businessName is required' });
  if (!category) return res.status(400).json({ error: 'category is required' });

  const now = new Date().toISOString();
  const lead = {
    id: uuidv4(),
    businessName,
    category,
    city: city || '',
    address: address || '',
    phone: phone || '',
    email: email || '',
    websiteUrl: websiteUrl || '',
    websiteQuality: websiteQuality || 'None',
    contactPerson: contactPerson || '',
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
    activityLog: [{ date: now, action: 'Lead created', details: `Discovered: ${businessName}` }]
  };

  // Check for duplicates
  const existingLeads = dataStore.getAll('leads');
  const duplicateWarnings = checkDuplicate(lead, existingLeads);

  dataStore.save('leads', lead);

  const response = { lead: projectLead(lead) };
  if (duplicateWarnings.length > 0) {
    response.duplicateWarning = duplicateWarnings[0];
  }
  res.status(201).json(response);
});

// ---------------------------------------------------------------------------
// PATCH /api/leads/:id — update
// ---------------------------------------------------------------------------

router.patch('/:id', (req, res) => {
  const lead = dataStore.get('leads', req.params.id);
  if (!lead) return res.status(404).json({ error: 'Lead not found' });

  const updatableFields = ['businessName', 'address', 'phone', 'email', 'websiteUrl',
    'websiteQuality', 'websiteScore', 'websiteIssues', 'websiteLoadTime', 'websiteAnalyzedAt',
    'contactPerson', 'notes', 'category', 'city'];

  for (const [key, value] of Object.entries(req.body)) {
    if (updatableFields.includes(key)) {
      lead[key] = value;
    }
  }

  const now = new Date().toISOString();
  lead.activityLog = lead.activityLog || [];
  lead.activityLog.push({ date: now, action: 'Lead updated', details: `Fields updated: ${Object.keys(req.body).join(', ')}` });

  dataStore.save('leads', lead);
  res.json({ lead: projectLead(lead) });
});

// ---------------------------------------------------------------------------
// POST /api/leads/:id/transition — pipeline status transition
// ---------------------------------------------------------------------------

router.post('/:id/transition', (req, res) => {
  const lead = dataStore.get('leads', req.params.id);
  if (!lead) return res.status(404).json({ error: 'Lead not found' });

  const { action, data } = req.body;
  if (!action) return res.status(400).json({ error: 'action is required' });

  const result = validateTransition(lead.status, action);
  if (!result.valid) return res.status(400).json({ error: result.error });

  const now = new Date().toISOString();
  const today = now.split('T')[0];

  lead.activityLog = lead.activityLog || [];

  switch (action) {
    case 'send-email-1':
      if (!lead.email) return res.status(400).json({ error: 'Lead has no email address' });
      lead.status = result.nextStatus;
      lead.dateEmail1Sent = today;
      lead.activityLog.push({ date: now, action: 'Email 1 sent', details: `To: ${lead.email}` });
      break;

    case 'send-followup-1':
      if (!lead.dateEmail1Sent) return res.status(400).json({ error: 'Email 1 must be sent first' });
      lead.dateFollowUp1Sent = today;
      lead.activityLog.push({ date: now, action: 'Follow-Up 1 sent', details: `To: ${lead.email}` });
      break;

    case 'send-followup-2':
      if (!lead.dateFollowUp1Sent) return res.status(400).json({ error: 'Follow-Up 1 must be sent first' });
      lead.dateFollowUp2Sent = today;
      lead.calendlySent = true;
      lead.activityLog.push({ date: now, action: 'Follow-Up 2 sent', details: `To: ${lead.email}, Calendly link included` });
      break;

    case 'mark-no-response':
      lead.status = result.nextStatus;
      lead.activityLog.push({ date: now, action: 'Marked as No Response', details: 'No reply after follow-up sequence' });
      break;

    case 'log-reply':
      if (!data || !data.replyDate || !data.replySentiment) {
        return res.status(400).json({ error: 'replyDate and replySentiment are required' });
      }
      lead.status = result.nextStatus;
      lead.replyDate = data.replyDate;
      lead.replySentiment = data.replySentiment;
      if (data.notes) lead.notes = data.notes;
      lead.activityLog.push({ date: now, action: 'Reply logged', details: `Sentiment: ${data.replySentiment}, Date: ${data.replyDate}` });
      break;

    case 'schedule-meeting':
      if (!data || !data.meetingDate) {
        return res.status(400).json({ error: 'meetingDate is required' });
      }
      lead.status = result.nextStatus;
      lead.meetingDate = data.meetingDate;
      if (data.notes) lead.notes = data.notes;
      lead.activityLog.push({ date: now, action: 'Meeting scheduled', details: `Date: ${data.meetingDate}` });
      break;

    case 'mark-won':
      lead.status = result.nextStatus;
      lead.decision = 'Won';
      if (data && data.startDate) lead.startDate = data.startDate;
      if (data && data.notes) lead.notes = data.notes;
      lead.activityLog.push({ date: now, action: 'Client Won', details: data && data.startDate ? `Start date: ${data.startDate}` : '' });
      break;

    case 'mark-lost':
      lead.status = result.nextStatus;
      lead.decision = 'Lost';
      if (data && data.notes) lead.notes = data.notes;
      lead.activityLog.push({ date: now, action: 'Lost', details: data && data.notes ? data.notes : '' });
      break;

    case 'mark-not-a-fit':
      lead.status = result.nextStatus;
      lead.websiteQuality = 'Not a Fit';
      lead.activityLog.push({ date: now, action: 'Marked as Not a Fit', details: 'Website is modern/functional' });
      break;

    default:
      return res.status(400).json({ error: `Unknown action: ${action}` });
  }

  dataStore.save('leads', lead);
  res.json({ lead: projectLead(lead) });
});

// ---------------------------------------------------------------------------
// DELETE /api/leads/:id
// ---------------------------------------------------------------------------

router.delete('/:id', (req, res) => {
  const removed = dataStore.remove('leads', req.params.id);
  if (!removed) return res.status(404).json({ error: 'Lead not found' });
  res.json({ success: true });
});

module.exports = router;
