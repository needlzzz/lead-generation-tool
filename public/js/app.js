// ============================================================
// Lead Generation CRM — Frontend Application
// ============================================================

let allLeads = [];
let allCategories = [];
let currentTab = 'discovery';
let currentCategoryFilter = '';
let currentEmailContext = null; // { leadId, emailType }

// ============================================================
// INITIALIZATION
// ============================================================

document.addEventListener('DOMContentLoaded', async () => {
  setupTabs();
  setupEventListeners();
  await loadCategories();
  await loadData();
  await checkFirstLaunch();
});

async function checkFirstLaunch() {
  try {
    const { settings } = await API.get('/api/settings');
    if (!settings.userName || !settings.calendlyLink) {
      openModal('modalSettings');
    }
  } catch (e) {
    openModal('modalSettings');
  }
}

// ============================================================
// DATA LOADING
// ============================================================

async function loadData() {
  try {
    const [leadsRes, dueRes, repliesRes] = await Promise.all([
      API.get(`/api/leads${currentCategoryFilter ? `?category=${encodeURIComponent(currentCategoryFilter)}` : ''}`),
      API.get('/api/leads/due-today'),
      API.get('/api/leads/check-replies')
    ]);
    allLeads = leadsRes.leads;
    renderStatusBadges();
    renderCurrentTab();
    renderDashboardAlerts(dueRes, repliesRes);
  } catch (err) {
    showError(err.message);
  }
}

async function loadCategories() {
  try {
    const { categories } = await API.get('/api/categories');
    allCategories = categories;
    populateCategoryDropdowns();
  } catch (err) {
    showError(err.message);
  }
}

// ============================================================
// TABS
// ============================================================

function setupTabs() {
  document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
      tab.classList.add('active');
      const tabName = tab.dataset.tab;
      document.getElementById(`panel-${tabName}`).classList.add('active');
      currentTab = tabName;
      renderCurrentTab();
    });
  });

  // Settings sub-tabs
  document.querySelectorAll('.settings-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.settings-tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.settings-panel').forEach(p => p.classList.remove('active'));
      tab.classList.add('active');
      document.getElementById(`settings-${tab.dataset.settingsTab}`).classList.add('active');
      if (tab.dataset.settingsTab === 'categories') renderCategoriesList();
    });
  });
}

function renderCurrentTab() {
  switch (currentTab) {
    case 'discovery': renderDiscoveryTab(); break;
    case 'outreach': renderOutreachTab(); break;
    case 'replies': renderRepliesTab(); break;
    case 'clients': renderClientsTab(); break;
  }
}

// ============================================================
// STATUS BADGES
// ============================================================

function renderStatusBadges() {
  const counts = {};
  const statuses = ['Discovered', 'Reached Out', 'Replied', 'No Response', 'Meeting Scheduled', 'Client Won', 'Lost'];
  statuses.forEach(s => counts[s] = 0);
  allLeads.forEach(l => { if (counts[l.status] !== undefined) counts[l.status]++; });

  const container = document.getElementById('statusBadges');
  container.innerHTML = statuses.map(s => {
    const cls = statusClass(s);
    return `<span class="badge ${cls}">${statusLabel(s)} <span class="badge-count">${counts[s]}</span></span>`;
  }).join('');
}

function statusClass(status) {
  const map = {
    'Discovered': 'status-discovered',
    'Reached Out': 'status-reached-out',
    'Replied': 'status-replied',
    'No Response': 'status-no-response',
    'Meeting Scheduled': 'status-meeting-scheduled',
    'Client Won': 'status-client-won',
    'Lost': 'status-lost'
  };
  return map[status] || '';
}

function statusLabel(status) {
  const map = {
    'Discovered': 'Discovered',
    'Reached Out': 'Reached Out',
    'Replied': 'Replied',
    'No Response': 'No Response',
    'Meeting Scheduled': 'Meeting',
    'Client Won': 'Won',
    'Lost': 'Lost'
  };
  return map[status] || status;
}

// ============================================================
// DASHBOARD ALERTS
// ============================================================

function renderDashboardAlerts(dueData, repliesData) {
  const alertsContainer = document.getElementById('dashboardAlerts');
  const fuSection = document.getElementById('followUpsDue');
  const fuList = document.getElementById('followUpsList');
  const replySection = document.getElementById('checkReplies');
  const replyList = document.getElementById('repliesList');

  const hasFU = dueData.followUp1Due.length + dueData.followUp2Due.length + dueData.markColdDue.length > 0;
  const hasReplies = repliesData.leads.length > 0;

  alertsContainer.classList.toggle('hidden', !hasFU && !hasReplies);
  fuSection.classList.toggle('hidden', !hasFU);
  replySection.classList.toggle('hidden', !hasReplies);

  // Follow-ups
  let fuHtml = '';
  dueData.followUp1Due.forEach(l => {
    fuHtml += `<div class="alert-item"><span class="alert-info"><strong>${esc(l.businessName)}</strong> — Follow-Up 1 due</span>
      <button class="btn btn-sm btn-primary" onclick="previewEmail('${l.id}','email2')">📧 Send FU1</button></div>`;
  });
  dueData.followUp2Due.forEach(l => {
    fuHtml += `<div class="alert-item"><span class="alert-info"><strong>${esc(l.businessName)}</strong> — Follow-Up 2 due</span>
      <button class="btn btn-sm btn-primary" onclick="previewEmail('${l.id}','email3')">📧 Send FU2</button></div>`;
  });
  dueData.markColdDue.forEach(l => {
    fuHtml += `<div class="alert-item overdue"><span class="alert-info"><strong>${esc(l.businessName)}</strong> — Mark as cold?</span>
      <button class="btn btn-sm" onclick="doTransition('${l.id}','mark-no-response')">❄️ Cold</button></div>`;
  });
  fuList.innerHTML = fuHtml;

  // Reply reminders
  let replyHtml = '';
  repliesData.leads.forEach(l => {
    replyHtml += `<div class="alert-item"><span class="alert-info"><strong>${esc(l.businessName)}</strong></span>
      <span class="alert-email">${esc(l.email)}</span>
      <button class="btn btn-sm" onclick="openReplyModal('${l.id}')">📝 Log Reply</button></div>`;
  });
  replyList.innerHTML = replyHtml;
}

// ============================================================
// DISCOVERY TAB
// ============================================================

function renderDiscoveryTab() {
  const tbody = document.querySelector('#tableDiscovery tbody');
  const empty = document.getElementById('emptyDiscovery');
  const noWebsiteOnly = document.getElementById('filterNoWebsite').checked;
  let leads = allLeads.filter(l => l.status === 'Discovered' || l.status === 'Lost');
  if (noWebsiteOnly) {
    leads = leads.filter(l => !l.websiteUrl || l.websiteQuality === 'None');
  }

  if (leads.length === 0) {
    tbody.innerHTML = '';
    empty.classList.remove('hidden');
    return;
  }
  empty.classList.add('hidden');

  tbody.innerHTML = leads.map(l => `
    <tr class="clickable" onclick="showActivityLog('${l.id}')">
      <td>${esc(l.businessName)}</td>
      <td>${esc(l.category)}</td>
      <td>${esc(l.address)}</td>
      <td>${esc(l.phone)}</td>
      <td>${esc(l.email)}</td>
      <td>${l.websiteUrl ? `<a href="${esc(l.websiteUrl)}" target="_blank" onclick="event.stopPropagation()">🔗</a>` : '—'}</td>
      <td>${esc(l.websiteQuality)}</td>
      <td><span class="status-pill ${statusClass(l.status)}">${statusLabel(l.status)}</span></td>
      <td>${l.dateDiscovered || ''}</td>
      <td onclick="event.stopPropagation()">
        <div class="actions">
          ${l.status === 'Discovered' && l.email && l.websiteQuality !== 'Not a Fit'
            ? `<button class="btn btn-sm btn-primary" onclick="previewEmail('${l.id}','email1')">📧 Email 1</button>` : ''}
          ${l.status === 'Discovered'
            ? `<button class="btn btn-sm" onclick="doTransition('${l.id}','mark-not-a-fit')">✖ Not a Fit</button>` : ''}
          <button class="btn btn-sm" onclick="editLead('${l.id}')">✏️</button>
          <button class="btn btn-sm btn-danger" onclick="deleteLead('${l.id}')">🗑</button>
        </div>
      </td>
    </tr>
  `).join('');
}

// ============================================================
// OUTREACH TAB
// ============================================================

function renderOutreachTab() {
  const tbody = document.querySelector('#tableOutreach tbody');
  const empty = document.getElementById('emptyOutreach');
  const leads = allLeads.filter(l => ['Reached Out', 'No Response'].includes(l.status));

  if (leads.length === 0) {
    tbody.innerHTML = '';
    empty.classList.remove('hidden');
    return;
  }
  empty.classList.add('hidden');

  tbody.innerHTML = leads.map(l => {
    const lastAct = l.activityLog && l.activityLog.length
      ? l.activityLog[l.activityLog.length - 1].date.split('T')[0]
      : '';
    return `
    <tr class="clickable" onclick="showActivityLog('${l.id}')">
      <td>${esc(l.businessName)}</td>
      <td>${esc(l.category)}</td>
      <td>${esc(l.email)}</td>
      <td><span class="status-pill ${statusClass(l.status)}">${statusLabel(l.status)}</span></td>
      <td>${l.dateEmail1Sent || '—'}</td>
      <td>${l.dateFollowUp1Sent || '—'}</td>
      <td>${l.dateFollowUp2Sent || '—'}</td>
      <td>${lastAct}</td>
      <td onclick="event.stopPropagation()">
        <div class="actions">
          ${l.status === 'Reached Out'
            ? `<button class="btn btn-sm" onclick="openReplyModal('${l.id}')">📝 Reply</button>` : ''}
        </div>
      </td>
    </tr>`;
  }).join('');
}

// ============================================================
// REPLIES & MEETINGS TAB
// ============================================================

function renderRepliesTab() {
  const tbody = document.querySelector('#tableReplies tbody');
  const empty = document.getElementById('emptyReplies');
  const leads = allLeads.filter(l => ['Replied', 'Meeting Scheduled'].includes(l.status));

  if (leads.length === 0) {
    tbody.innerHTML = '';
    empty.classList.remove('hidden');
    return;
  }
  empty.classList.add('hidden');

  tbody.innerHTML = leads.map(l => `
    <tr class="clickable" onclick="showActivityLog('${l.id}')">
      <td>${esc(l.businessName)}</td>
      <td>${l.replyDate || '—'}</td>
      <td>${l.replySentiment || '—'}</td>
      <td>${l.calendlySent ? 'Yes' : 'No'}</td>
      <td>${l.meetingDate || '—'}</td>
      <td>${esc(l.notes || '')}</td>
      <td onclick="event.stopPropagation()">
        <div class="actions">
          ${l.status === 'Replied'
            ? `<button class="btn btn-sm btn-primary" onclick="openMeetingModal('${l.id}')">📅 Meeting</button>` : ''}
        </div>
      </td>
    </tr>
  `).join('');
}

// ============================================================
// CLIENT TRACKER TAB
// ============================================================

function renderClientsTab() {
  const tbody = document.querySelector('#tableClients tbody');
  const empty = document.getElementById('emptyClients');
  const leads = allLeads.filter(l =>
    ['Meeting Scheduled', 'Client Won', 'Lost'].includes(l.status) && l.meetingDate
  );

  if (leads.length === 0) {
    tbody.innerHTML = '';
    empty.classList.remove('hidden');
    return;
  }
  empty.classList.add('hidden');

  tbody.innerHTML = leads.map(l => `
    <tr class="clickable" onclick="showActivityLog('${l.id}')">
      <td>${esc(l.businessName)}</td>
      <td>${l.meetingDate || '—'}</td>
      <td><span class="status-pill ${statusClass(l.status)}">${l.decision || statusLabel(l.status)}</span></td>
      <td>${l.startDate || '—'}</td>
      <td>${esc(l.notes || '')}</td>
      <td onclick="event.stopPropagation()">
        <div class="actions">
          ${l.status === 'Meeting Scheduled' ? `
            <button class="btn btn-sm btn-primary" onclick="openDecisionModal('${l.id}','mark-won')">✅ Won</button>
            <button class="btn btn-sm btn-danger" onclick="openDecisionModal('${l.id}','mark-lost')">❌ Lost</button>
          ` : ''}
        </div>
      </td>
    </tr>
  `).join('');
}


// ============================================================
// EVENT LISTENERS
// ============================================================

function setupEventListeners() {
  // Category filter
  document.getElementById('categoryFilter').addEventListener('change', (e) => {
    currentCategoryFilter = e.target.value;
    loadData();
  });

  // No-website filter
  document.getElementById('filterNoWebsite').addEventListener('change', () => {
    renderDiscoveryTab();
  });

  // Settings button
  document.getElementById('btnSettings').addEventListener('click', () => {
    loadSettingsForm();
    openModal('modalSettings');
  });

  // Add Lead
  document.getElementById('btnAddLead').addEventListener('click', () => {
    document.getElementById('formLead').reset();
    document.getElementById('leadEditId').value = '';
    document.getElementById('modalLeadTitle').textContent = 'New Lead';
    openModal('modalLead');
  });

  // Lead form submit
  document.getElementById('formLead').addEventListener('submit', async (e) => {
    e.preventDefault();
    await saveLead();
  });

  // Discover Leads
  document.getElementById('btnDiscoverLeads').addEventListener('click', discoverLeads);

  // Enrich Emails
  document.getElementById('btnEnrichEmails').addEventListener('click', enrichEmails);

  // CSV Import
  document.getElementById('btnImportCSV').addEventListener('click', () => {
    document.getElementById('csvFileInput').click();
  });
  document.getElementById('csvFileInput').addEventListener('change', importCSV);

  // CSV Exports
  document.getElementById('btnExportDiscovery').addEventListener('click', () => exportCSV('discovery'));
  document.getElementById('btnExportOutreach').addEventListener('click', () => exportCSV('outreach'));
  document.getElementById('btnExportReplies').addEventListener('click', () => exportCSV('replies'));
  document.getElementById('btnExportClients').addEventListener('click', () => exportCSV('clients'));

  // Email send button
  document.getElementById('btnSendEmail').addEventListener('click', sendCurrentEmail);

  // Reply form
  document.getElementById('formReply').addEventListener('submit', async (e) => {
    e.preventDefault();
    await saveReply();
  });

  // Meeting form
  document.getElementById('formMeeting').addEventListener('submit', async (e) => {
    e.preventDefault();
    await saveMeeting();
  });

  // Decision form
  document.getElementById('formDecision').addEventListener('submit', async (e) => {
    e.preventDefault();
    await saveDecision();
  });

  // Settings forms
  document.getElementById('formSettingsPersonal').addEventListener('submit', async (e) => {
    e.preventDefault();
    await saveSettingsPersonal();
  });
  document.getElementById('formSettingsSMTP').addEventListener('submit', async (e) => {
    e.preventDefault();
    await saveSettingsSMTP();
  });
  document.getElementById('btnTestSMTP').addEventListener('click', testSMTP);

  // Category management
  document.getElementById('btnAddCategory').addEventListener('click', () => {
    document.getElementById('formCategory').reset();
    document.getElementById('catEditId').value = '';
    document.getElementById('modalCategoryTitle').textContent = 'New Category';
    openModal('modalCategory');
  });
  document.getElementById('formCategory').addEventListener('submit', async (e) => {
    e.preventDefault();
    await saveCategory();
  });
}

// ============================================================
// LEAD CRUD
// ============================================================

async function saveLead() {
  const id = document.getElementById('leadEditId').value;
  const data = {
    businessName: document.getElementById('leadName').value,
    category: document.getElementById('leadCategory').value,
    address: document.getElementById('leadAddress').value,
    phone: document.getElementById('leadPhone').value,
    email: document.getElementById('leadEmail').value,
    websiteUrl: document.getElementById('leadWebsite').value,
    contactPerson: document.getElementById('leadContact').value,
    websiteQuality: document.getElementById('leadQuality').value
  };

  try {
    if (id) {
      await API.patch(`/api/leads/${id}`, data);
    } else {
      const result = await API.post('/api/leads', data);
      if (result.duplicateWarning) {
        alert(`⚠️ Possible duplicate: "${result.duplicateWarning.existingLead.businessName}" (${result.duplicateWarning.field})`);
      }
    }
    closeModal('modalLead');
    await loadData();
  } catch (err) {
    showError(err.message);
  }
}

function editLead(id) {
  const lead = allLeads.find(l => l.id === id);
  if (!lead) return;
  document.getElementById('leadEditId').value = lead.id;
  document.getElementById('leadName').value = lead.businessName;
  document.getElementById('leadCategory').value = lead.category;
  document.getElementById('leadAddress').value = lead.address || '';
  document.getElementById('leadPhone').value = lead.phone || '';
  document.getElementById('leadEmail').value = lead.email || '';
  document.getElementById('leadWebsite').value = lead.websiteUrl || '';
  document.getElementById('leadContact').value = lead.contactPerson || '';
  document.getElementById('leadQuality').value = lead.websiteQuality || 'None';
  document.getElementById('modalLeadTitle').textContent = 'Edit Lead';
  openModal('modalLead');
}

async function deleteLead(id) {
  if (!confirm('Delete this lead?')) return;
  try {
    await API.del(`/api/leads/${id}`);
    await loadData();
  } catch (err) {
    showError(err.message);
  }
}

// ============================================================
// PIPELINE TRANSITIONS
// ============================================================

async function doTransition(leadId, action, data) {
  try {
    await API.post(`/api/leads/${leadId}/transition`, { action, data });
    await loadData();
  } catch (err) {
    showError(err.message);
  }
}

// ============================================================
// EMAIL PREVIEW & SEND
// ============================================================

async function previewEmail(leadId, emailType) {
  try {
    const result = await API.post('/api/email/preview', { leadId, emailType });
    document.getElementById('emailTo').textContent = result.to;
    document.getElementById('emailSubject').textContent = result.subject;
    document.getElementById('emailBody').textContent = result.body;
    const typeLabels = { email1: 'Email 1 — Cold Outreach', email2: 'Follow-Up 1', email3: 'Follow-Up 2' };
    document.getElementById('emailPreviewTitle').textContent = typeLabels[emailType] || 'Email';
    currentEmailContext = { leadId, emailType };
    openModal('modalEmail');
  } catch (err) {
    showError(err.message);
  }
}

async function sendCurrentEmail() {
  if (!currentEmailContext) return;
  showLoading('Sending email...');
  try {
    await API.post('/api/email/send', currentEmailContext);
    closeModal('modalEmail');
    currentEmailContext = null;
    await loadData();
  } catch (err) {
    showError(err.message);
  } finally {
    hideLoading();
  }
}

// ============================================================
// REPLY, MEETING, DECISION MODALS
// ============================================================

function openReplyModal(leadId) {
  document.getElementById('formReply').reset();
  document.getElementById('replyLeadId').value = leadId;
  document.getElementById('replyDate').value = new Date().toISOString().split('T')[0];
  openModal('modalReply');
}

async function saveReply() {
  const leadId = document.getElementById('replyLeadId').value;
  const data = {
    replyDate: document.getElementById('replyDate').value,
    replySentiment: document.getElementById('replySentiment').value,
    notes: document.getElementById('replyNotes').value
  };
  try {
    await doTransition(leadId, 'log-reply', data);
    closeModal('modalReply');
  } catch (err) {
    showError(err.message);
  }
}

function openMeetingModal(leadId) {
  document.getElementById('formMeeting').reset();
  document.getElementById('meetingLeadId').value = leadId;
  openModal('modalMeeting');
}

async function saveMeeting() {
  const leadId = document.getElementById('meetingLeadId').value;
  const data = {
    meetingDate: document.getElementById('meetingDate').value,
    notes: document.getElementById('meetingNotes').value
  };
  try {
    await doTransition(leadId, 'schedule-meeting', data);
    closeModal('modalMeeting');
  } catch (err) {
    showError(err.message);
  }
}

function openDecisionModal(leadId, action) {
  document.getElementById('formDecision').reset();
  document.getElementById('decisionLeadId').value = leadId;
  document.getElementById('decisionAction').value = action;
  openModal('modalDecision');
}

async function saveDecision() {
  const leadId = document.getElementById('decisionLeadId').value;
  const action = document.getElementById('decisionAction').value;
  const data = {
    startDate: document.getElementById('decisionStartDate').value,
    notes: document.getElementById('decisionNotes').value
  };
  try {
    await doTransition(leadId, action, data);
    closeModal('modalDecision');
  } catch (err) {
    showError(err.message);
  }
}

// ============================================================
// ACTIVITY LOG
// ============================================================

function showActivityLog(leadId) {
  const lead = allLeads.find(l => l.id === leadId);
  if (!lead) return;
  document.getElementById('activityTitle').textContent = `${lead.businessName} — Activity Log`;
  const log = (lead.activityLog || []).slice().reverse();
  document.getElementById('activityLogContent').innerHTML = log.length
    ? log.map(e => `
      <div class="activity-entry">
        <div class="activity-date">${formatDateTime(e.date)}</div>
        <div class="activity-action">${esc(e.action)}</div>
        <div class="activity-details">${esc(e.details || '')}</div>
      </div>
    `).join('')
    : '<p style="color:#999">No entries.</p>';
  openModal('modalActivity');
}

// ============================================================
// SCRAPER
// ============================================================

async function discoverLeads() {
  const catFilter = document.getElementById('categoryFilter').value;
  if (!catFilter) {
    showError('Please select a category first.');
    return;
  }
  const category = allCategories.find(c => c.name === catFilter);
  if (!category) {
    showError('Category not found.');
    return;
  }

  const city = document.getElementById('scraperCityFilter').value;
  showLoading(`Searching Google Maps in ${city}...`);
  try {
    const result = await API.post('/api/scraper/discover', { categoryId: category.id, city });
    if (result.duplicates && result.duplicates.length > 0) {
      alert(`${result.leads.length} leads discovered. ${result.duplicates.length} possible duplicates found.`);
    }
    await loadData();
  } catch (err) {
    showError(`Scraper error: ${err.message}`);
  } finally {
    hideLoading();
  }
}

async function enrichEmails() {
  const city = document.getElementById('scraperCityFilter').value;
  const leadsWithoutEmail = allLeads.filter(l => 
    !l.email && (l.status === 'Discovered' || l.status === 'Lost')
  );

  if (leadsWithoutEmail.length === 0) {
    showError('No leads without email to enrich.');
    return;
  }

  if (!confirm(`Enrich emails for ${leadsWithoutEmail.length} leads without email (searching local.ch in ${city})? This runs in the background.`)) {
    return;
  }

  // Show non-blocking progress bar
  const bar = document.getElementById('enrichmentBar');
  const text = document.getElementById('enrichmentText');
  const fill = document.getElementById('enrichmentFill');
  const count = document.getElementById('enrichmentCount');
  bar.classList.remove('hidden');
  text.textContent = 'Starting enrichment...';
  fill.style.width = '0%';
  count.textContent = `0/${leadsWithoutEmail.length}`;

  // Disable the button while running
  const btn = document.getElementById('btnEnrichEmails');
  btn.disabled = true;
  btn.textContent = '⏳ Enriching...';

  try {
    const response = await fetch('/api/scraper/enrich-emails', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ city })
    });

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let finalResult = null;
    let foundEmails = 0;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop();

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const event = JSON.parse(line.slice(6));
            if (event.type === 'progress') {
              const pct = Math.round((event.current / event.total) * 100);
              fill.style.width = `${pct}%`;
              text.textContent = `${event.businessName}`;
              count.textContent = `${event.current}/${event.total} (${foundEmails} found)`;
            } else if (event.type === 'done') {
              finalResult = event;
              foundEmails = event.enriched;
            } else if (event.type === 'error') {
              throw new Error(event.error);
            } else if (event.type === 'found') {
              // Increment found counter on each find (sent from backend)
              foundEmails++;
              count.textContent = count.textContent.replace(/\(\d+ found\)/, `(${foundEmails} found)`);
            }
          } catch (parseErr) {
            if (parseErr.message && parseErr.message !== 'Unexpected end of JSON input') {
              throw parseErr;
            }
          }
        }
      }
    }

    // Done — hide bar, refresh data
    bar.classList.add('hidden');
    if (finalResult) {
      const found = finalResult.results.filter(r => r.email);
      alert(`Done! Found ${finalResult.enriched} emails out of ${finalResult.total} leads.${found.length > 0 ? '\n\n' + found.map(r => `${r.businessName}: ${r.email}`).join('\n') : ''}`);
    }
    await loadData();
  } catch (err) {
    bar.classList.add('hidden');
    showError(`Enrichment error: ${err.message}`);
  } finally {
    btn.disabled = false;
    btn.textContent = '📧 Enrich Emails';
  }
}

// ============================================================
// CSV IMPORT / EXPORT
// ============================================================

async function importCSV(e) {
  const file = e.target.files[0];
  if (!file) return;
  e.target.value = ''; // Reset for re-upload

  showLoading('Importing CSV...');
  try {
    const result = await API.uploadFile('/api/csv/import', file);
    alert(`Import complete: ${result.imported} imported, ${result.skipped} skipped, ${result.duplicates.length} duplicates.`);
    await loadData();
  } catch (err) {
    showError(err.message);
  } finally {
    hideLoading();
  }
}

function exportCSV(tab) {
  const params = new URLSearchParams({ tab });
  if (currentCategoryFilter) params.set('category', currentCategoryFilter);
  window.location.href = `/api/csv/export?${params.toString()}`;
}

// ============================================================
// SETTINGS
// ============================================================

async function loadSettingsForm() {
  try {
    const { settings } = await API.get('/api/settings');
    document.getElementById('settingsName').value = settings.userName || '';
    document.getElementById('settingsCalendly').value = settings.calendlyLink || '';
    document.getElementById('smtpHost').value = settings.smtp?.host || '';
    document.getElementById('smtpPort').value = settings.smtp?.port || 587;
    document.getElementById('smtpUsername').value = settings.smtp?.username || '';
    document.getElementById('smtpPassword').value = settings.smtp?.password || '';
    document.getElementById('smtpFrom').value = settings.smtp?.fromAddress || '';
  } catch (err) {
    showError(err.message);
  }
}

async function saveSettingsPersonal() {
  try {
    await API.put('/api/settings', {
      userName: document.getElementById('settingsName').value,
      calendlyLink: document.getElementById('settingsCalendly').value
    });
    alert('Settings saved.');
  } catch (err) {
    showError(err.message);
  }
}

async function saveSettingsSMTP() {
  try {
    await API.put('/api/settings', {
      smtp: {
        host: document.getElementById('smtpHost').value,
        port: parseInt(document.getElementById('smtpPort').value) || 587,
        username: document.getElementById('smtpUsername').value,
        password: document.getElementById('smtpPassword').value,
        fromAddress: document.getElementById('smtpFrom').value
      }
    });
    alert('SMTP settings saved.');
  } catch (err) {
    showError(err.message);
  }
}

async function testSMTP() {
  showLoading('Testing SMTP connection...');
  try {
    const result = await API.post('/api/settings/test-smtp', {});
    alert(result.success ? '✅ SMTP connection successful!' : '❌ Connection failed.');
  } catch (err) {
    showError(`SMTP test failed: ${err.message}`);
  } finally {
    hideLoading();
  }
}

// ============================================================
// CATEGORY MANAGEMENT
// ============================================================

function renderCategoriesList() {
  const container = document.getElementById('categoriesList');
  container.innerHTML = allCategories.map(c => `
    <div class="category-card">
      <div class="category-card-header">
        <h4>${esc(c.name)}</h4>
        <div class="actions">
          <button class="btn btn-sm" onclick="editCategory('${c.id}')">✏️ Edit</button>
          <button class="btn btn-sm btn-danger" onclick="deleteCategory('${c.id}')">🗑</button>
        </div>
      </div>
      <div class="category-card-meta">Search term: ${esc(c.searchTerm)} · Tone: ${c.tone === 'formal' ? 'Formal (Sie)' : 'Casual (Du)'}</div>
    </div>
  `).join('') || '<p style="padding:20px;color:#999">No categories found.</p>';
}

function editCategory(id) {
  const cat = allCategories.find(c => c.id === id);
  if (!cat) return;
  document.getElementById('catEditId').value = cat.id;
  document.getElementById('catName').value = cat.name;
  document.getElementById('catSearchTerm').value = cat.searchTerm;
  document.getElementById('catTone').value = cat.tone;
  document.getElementById('catE1Subject').value = cat.templates?.email1?.subject || '';
  document.getElementById('catE1Body').value = cat.templates?.email1?.body || '';
  document.getElementById('catE2Subject').value = cat.templates?.email2?.subject || '';
  document.getElementById('catE2Body').value = cat.templates?.email2?.body || '';
  document.getElementById('catE3Subject').value = cat.templates?.email3?.subject || '';
  document.getElementById('catE3Body').value = cat.templates?.email3?.body || '';
  document.getElementById('modalCategoryTitle').textContent = 'Edit Category';
  openModal('modalCategory');
}

async function saveCategory() {
  const id = document.getElementById('catEditId').value;
  const data = {
    name: document.getElementById('catName').value,
    searchTerm: document.getElementById('catSearchTerm').value,
    tone: document.getElementById('catTone').value,
    templates: {
      email1: { subject: document.getElementById('catE1Subject').value, body: document.getElementById('catE1Body').value },
      email2: { subject: document.getElementById('catE2Subject').value, body: document.getElementById('catE2Body').value },
      email3: { subject: document.getElementById('catE3Subject').value, body: document.getElementById('catE3Body').value }
    }
  };

  try {
    if (id) {
      await API.put(`/api/categories/${id}`, data);
    } else {
      await API.post('/api/categories', data);
    }
    closeModal('modalCategory');
    await loadCategories();
    renderCategoriesList();
  } catch (err) {
    showError(err.message);
  }
}

async function deleteCategory(id) {
  if (!confirm('Delete this category?')) return;
  try {
    await API.del(`/api/categories/${id}`);
    await loadCategories();
    renderCategoriesList();
  } catch (err) {
    showError(err.message);
  }
}

// ============================================================
// HELPERS
// ============================================================

function populateCategoryDropdowns() {
  const filterSelect = document.getElementById('categoryFilter');
  const leadSelect = document.getElementById('leadCategory');

  // Preserve current filter value
  const currentFilter = filterSelect.value;
  filterSelect.innerHTML = '<option value="">All Categories</option>' +
    allCategories.map(c => `<option value="${esc(c.name)}">${esc(c.name)}</option>`).join('');
  filterSelect.value = currentFilter;

  leadSelect.innerHTML = allCategories.map(c =>
    `<option value="${esc(c.name)}">${esc(c.name)}</option>`
  ).join('');
}

function openModal(id) {
  document.getElementById(id).classList.remove('hidden');
}

function closeModal(id) {
  document.getElementById(id).classList.add('hidden');
}

function showError(msg) {
  const banner = document.getElementById('errorBanner');
  banner.textContent = msg;
  banner.classList.remove('hidden');
  setTimeout(() => banner.classList.add('hidden'), 5000);
}

function showLoading(text) {
  document.getElementById('loadingText').textContent = text || 'Loading...';
  document.getElementById('loadingOverlay').classList.remove('hidden');
}

function hideLoading() {
  document.getElementById('loadingOverlay').classList.add('hidden');
}

function esc(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function formatDateTime(isoStr) {
  if (!isoStr) return '';
  const d = new Date(isoStr);
  return d.toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' });
}
