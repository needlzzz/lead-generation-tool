const express = require('express');
const { v4: uuidv4 } = require('uuid');
const dataStore = require('../lib/dataStore');
const { validateTransition, getDueToday, checkDuplicate } = require('../lib/pipeline');

const router = express.Router();

// GET /api/leads — list all leads, optionally filtered
router.get('/', (req, res) => {
  try {
    const filter = {};
    if (req.query.category) filter.category = req.query.category;
    if (req.query.status) filter.status = req.query.status;
    const leads = dataStore.getAll('leads', Object.keys(filter).length ? filter : null);
    res.json({ leads });
  } catch (err) {
    res.status(500).json({ error: 'Failed to read leads' });
  }
});

// GET /api/leads/due-today — leads with follow-ups due
router.get('/due-today', (req, res) => {
  try {
    const leads = dataStore.getAll('leads');
    const today = new Date().toISOString().split('T')[0];
    const due = getDueToday(leads, today);
    res.json(due);
  } catch (err) {
    res.status(500).json({ error: 'Failed to compute due follow-ups' });
  }
});

// GET /api/leads/check-replies — leads in outreach stages for inbox checking
router.get('/check-replies', (req, res) => {
  try {
    const leads = dataStore.getAll('leads');
    const outreachLeads = leads
      .filter(l => l.status === 'Reached Out' && l.email)
      .sort((a, b) => (a.dateEmail1Sent || '').localeCompare(b.dateEmail1Sent || ''))
      .map(l => ({
        id: l.id,
        businessName: l.businessName,
        email: l.email,
        status: l.status,
        dateEmail1Sent: l.dateEmail1Sent,
        lastActivityDate: l.activityLog && l.activityLog.length
          ? l.activityLog[l.activityLog.length - 1].date
          : l.dateDiscovered
      }));
    res.json({ leads: outreachLeads });
  } catch (err) {
    res.status(500).json({ error: 'Failed to get reply check list' });
  }
});

// GET /api/leads/:id — single lead
router.get('/:id', (req, res) => {
  const lead = dataStore.get('leads', req.params.id);
  if (!lead) return res.status(404).json({ error: 'Lead not found' });
  res.json({ lead });
});

// POST /api/leads — create a new lead
router.post('/', (req, res) => {
  const { businessName, category, address, phone, email, websiteUrl, websiteQuality, contactPerson } = req.body;

  if (!businessName) return res.status(400).json({ error: 'businessName is required' });
  if (!category) return res.status(400).json({ error: 'category is required' });

  const now = new Date().toISOString();
  const lead = {
    id: uuidv4(),
    businessName,
    category,
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

  const response = { lead };
  if (duplicateWarnings.length > 0) {
    response.duplicateWarning = duplicateWarnings[0];
  }
  res.status(201).json(response);
});

// PATCH /api/leads/:id — update lead fields
router.patch('/:id', (req, res) => {
  const lead = dataStore.get('leads', req.params.id);
  if (!lead) return res.status(404).json({ error: 'Lead not found' });

  const updatableFields = ['businessName', 'address', 'phone', 'email', 'websiteUrl',
    'websiteQuality', 'contactPerson', 'notes', 'category'];

  for (const [key, value] of Object.entries(req.body)) {
    if (updatableFields.includes(key)) {
      lead[key] = value;
    }
  }

  const now = new Date().toISOString();
  lead.activityLog.push({ date: now, action: 'Lead updated', details: `Fields updated: ${Object.keys(req.body).join(', ')}` });

  dataStore.save('leads', lead);
  res.json({ lead });
});

// POST /api/leads/:id/transition — pipeline status transition
router.post('/:id/transition', (req, res) => {
  const lead = dataStore.get('leads', req.params.id);
  if (!lead) return res.status(404).json({ error: 'Lead not found' });

  const { action, data } = req.body;
  if (!action) return res.status(400).json({ error: 'action is required' });

  const result = validateTransition(lead.status, action);
  if (!result.valid) return res.status(400).json({ error: result.error });

  const now = new Date().toISOString();
  const today = now.split('T')[0];

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
  res.json({ lead });
});

// DELETE /api/leads/:id
router.delete('/:id', (req, res) => {
  const removed = dataStore.remove('leads', req.params.id);
  if (!removed) return res.status(404).json({ error: 'Lead not found' });
  res.json({ success: true });
});

module.exports = router;
