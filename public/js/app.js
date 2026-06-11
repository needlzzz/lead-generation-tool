// ============================================================
// Lead Generation CRM — Frontend Application
// ============================================================

let allLeads = [];
let allCategories = [];
let currentTab = 'discovery';
let currentCategoryFilter = '';
let currentCityFilter = '';
let currentEmailContext = null; // { leadId, emailType }
let qualitySortOrder = null; // null = no sort, 'asc' = best first, 'desc' = worst first
let discoverySortField = null; // null, 'category', 'status', 'discovered'
let discoverySortOrder = null; // null, 'asc', 'desc'

// ============================================================
// TOAST NOTIFICATIONS
// ============================================================

function showToast(type, message) {
  const container = document.getElementById('toast-container');
  if (!container) return;
  const toast = document.createElement('div');
  toast.className = `toast toast--${type}`;
  toast.innerHTML = `
    <span class="toast__message">${esc(message)}</span>
    <button class="toast__close" onclick="this.parentElement.remove()">&times;</button>
  `;
  container.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add('toast--visible'));

  if (type !== 'error') {
    setTimeout(() => {
      toast.classList.remove('toast--visible');
      setTimeout(() => toast.remove(), 200);
    }, 4000);
  }
}

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
      // Toggle aria-selected
      document.querySelectorAll('.tab[role="tab"]').forEach(t => t.setAttribute('aria-selected', 'false'));
      tab.setAttribute('aria-selected', 'true');
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
    case 'scrapelog': renderScrapeLogTab(); break;
  }
}

// ============================================================
// STATUS BADGES
// ============================================================

function renderStatusBadges() {
  const container = document.getElementById('statusBadges');
  if (!container) return;
  const counts = {};
  const statuses = ['Discovered', 'Reached Out', 'Replied', 'No Response', 'Meeting Scheduled', 'Client Won', 'Lost'];
  statuses.forEach(s => counts[s] = 0);
  allLeads.forEach(l => { if (counts[l.status] !== undefined) counts[l.status]++; });

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
      <button class="btn btn-sm btn-primary" onclick="previewEmail('${l.id}','email2')">Send FU1</button></div>`;
  });
  dueData.followUp2Due.forEach(l => {
    fuHtml += `<div class="alert-item"><span class="alert-info"><strong>${esc(l.businessName)}</strong> — Follow-Up 2 due</span>
      <button class="btn btn-sm btn-primary" onclick="previewEmail('${l.id}','email3')">Send FU2</button></div>`;
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

function toggleQualitySort() {
  discoverySortField = null;
  discoverySortOrder = null;
  if (qualitySortOrder === null) qualitySortOrder = 'desc'; // worst first (best prospects)
  else if (qualitySortOrder === 'desc') qualitySortOrder = 'asc';
  else qualitySortOrder = null;
  renderDiscoveryTab();
}

function toggleDiscoverySort(field) {
  if (discoverySortField === field) {
    if (discoverySortOrder === 'asc') discoverySortOrder = 'desc';
    else if (discoverySortOrder === 'desc') { discoverySortField = null; discoverySortOrder = null; }
  } else {
    discoverySortField = field;
    discoverySortOrder = 'asc';
  }
  qualitySortOrder = null;
  renderDiscoveryTab();
}

function renderDiscoveryTab() {
  const tbody = document.querySelector('#tableDiscovery tbody');
  const empty = document.getElementById('emptyDiscovery');
  const noWebsiteOnly = document.getElementById('filterNoWebsite').checked;
  const hasEmailOnly = document.getElementById('filterHasEmail').checked;
  let leads = allLeads.filter(l => l.status === 'Discovered' || l.status === 'Lost');
  if (currentCityFilter) {
    leads = leads.filter(l => {
      // Match explicit city field (new leads)
      if (l.city) return l.city === currentCityFilter;
      // Fallback for older leads: check activity log for scraper city
      if (l.activityLog && l.activityLog.length > 0) {
        const firstEntry = l.activityLog[0];
        if (firstEntry.details && firstEntry.details.includes(' in ')) {
          return firstEntry.details.includes(`in ${currentCityFilter}`);
        }
      }
      // Last resort: check address
      if (l.address) return l.address.toLowerCase().includes(currentCityFilter.toLowerCase());
      return false;
    });
  }
  if (noWebsiteOnly) {
    leads = leads.filter(l => !l.websiteUrl || l.websiteQuality === 'None');
  }
  if (hasEmailOnly) {
    leads = leads.filter(l => l.email);
  }

  // Sort by quality if active
  if (qualitySortOrder) {
    const qualityRank = { 'Poor': 1, 'Outdated': 2, 'Good': 3, 'None': 4 };
    leads.sort((a, b) => {
      const aRank = qualityRank[a.websiteQuality] || 5;
      const bRank = qualityRank[b.websiteQuality] || 5;
      return qualitySortOrder === 'desc' ? aRank - bRank : bRank - aRank;
    });
  }

  // Sort by selected column
  if (discoverySortField && discoverySortOrder) {
    leads.sort((a, b) => {
      let aVal, bVal;
      if (discoverySortField === 'category') {
        aVal = (a.category || '').toLowerCase();
        bVal = (b.category || '').toLowerCase();
      } else if (discoverySortField === 'status') {
        aVal = (a.status || '').toLowerCase();
        bVal = (b.status || '').toLowerCase();
      } else if (discoverySortField === 'discovered') {
        aVal = a.dateDiscovered || '';
        bVal = b.dateDiscovered || '';
      }
      const cmp = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
      return discoverySortOrder === 'asc' ? cmp : -cmp;
    });
  }

  if (leads.length === 0) {
    tbody.innerHTML = '';
    empty.classList.remove('hidden');
    return;
  }
  empty.classList.add('hidden');

  tbody.innerHTML = leads.map(l => `
    <tr class="clickable" onclick="showActivityLog('${l.id}')">
      <td onclick="event.stopPropagation()"><input type="checkbox" class="lead-select" data-id="${l.id}" onchange="updateSelectionUI()"></td>
      <td>${esc(l.businessName)}</td>
      <td>${esc(l.category)}</td>
      <td>${esc(l.address)}</td>
      <td>${esc(l.phone)}</td>
      <td>${esc(l.email)}</td>
      <td>${l.websiteUrl ? `<a href="${esc(l.websiteUrl)}" target="_blank" onclick="event.stopPropagation()">🔗</a>` : '—'}</td>
      <td>${renderQualityBadge(l)}</td>
      <td><span class="status-pill ${statusClass(l.status)}">${statusLabel(l.status)}</span></td>
      <td>${l.dateDiscovered || ''}</td>
      <td onclick="event.stopPropagation()">
        <div class="actions">
          ${l.websiteAnalyzedAt && !l.previewUrl && (l.status === 'Discovered' || l.status === 'Reached Out')
            ? `<button class="btn btn-sm" onclick="startPreviewGeneration('${l.id}')" title="Generate Preview">Preview</button>` : ''}
          ${l.previewUrl
            ? `<button class="btn btn-sm" onclick="window.open('${esc(l.previewUrl)}', '_blank')" title="View Preview">View</button>` : ''}
          ${l.status === 'Discovered' && l.email && l.websiteQuality !== 'Not a Fit'
            ? `<button class="btn btn-sm btn-primary" onclick="previewEmail('${l.id}','email1')">Email 1</button>` : ''}
          ${l.status === 'Discovered'
            ? `<button class="btn btn-sm" onclick="doTransition('${l.id}','mark-not-a-fit')">✖</button>` : ''}
          <button class="btn btn-sm" onclick="editLead('${l.id}')">✏️</button>
          <button class="btn btn-sm btn-danger" onclick="deleteLead('${l.id}')">Del</button>
        </div>
      </td>
    </tr>
  `).join('');

  // Reset select-all checkbox
  const selectAll = document.getElementById('selectAllDiscovery');
  if (selectAll) selectAll.checked = false;
  updateSelectionUI();
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
// SCRAPE LOG TAB
// ============================================================

function renderScrapeLogTab() {
  const container = document.getElementById('scrapeLogMatrix');
  const empty = document.getElementById('emptyScrapeLog');

  // Build map of category+city → { lastDate, count }
  const scrapeMap = {};
  const allCities = new Set();
  const allCats = new Set();

  for (const lead of allLeads) {
    let city = lead.city;
    if (!city && lead.activityLog && lead.activityLog[0]?.details) {
      const match = lead.activityLog[0].details.match(/in (.+)$/);
      if (match) city = match[1];
    }
    if (!city) continue; // Skip leads without a city for the matrix
    const cat = lead.category || '(keine)';
    const key = `${cat}::${city}`;

    allCities.add(city);
    allCats.add(cat);

    if (!scrapeMap[key]) {
      scrapeMap[key] = { lastDate: lead.dateDiscovered, count: 0 };
    }
    scrapeMap[key].count++;
    if (lead.dateDiscovered && (!scrapeMap[key].lastDate || lead.dateDiscovered > scrapeMap[key].lastDate)) {
      scrapeMap[key].lastDate = lead.dateDiscovered;
    }
  }

  if (allCats.size === 0) {
    container.innerHTML = '';
    empty.classList.remove('hidden');
    return;
  }
  empty.classList.add('hidden');

  const cities = [...allCities].sort((a, b) => a.localeCompare(b, 'de'));
  const categories = [...allCats].sort((a, b) => a.localeCompare(b, 'de'));

  // Build matrix table
  let html = '<table class="scrape-matrix"><thead><tr><th>Category</th>';
  for (const city of cities) {
    html += `<th class="matrix-city">${esc(city)}</th>`;
  }
  html += '<th>Total</th></tr></thead><tbody>';

  for (const cat of categories) {
    let rowTotal = 0;
    html += `<tr><td class="matrix-cat">${esc(cat)}</td>`;
    for (const city of cities) {
      const key = `${cat}::${city}`;
      const data = scrapeMap[key];
      if (data) {
        rowTotal += data.count;
        html += `<td class="matrix-cell matrix-cell--has" title="${esc(cat)} in ${esc(city)}: ${data.count} leads (${data.lastDate || '?'})">${data.count}</td>`;
      } else {
        html += `<td class="matrix-cell matrix-cell--empty">—</td>`;
      }
    }
    html += `<td class="matrix-total">${rowTotal}</td></tr>`;
  }

  html += '</tbody></table>';
  container.innerHTML = html;
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

  // Has-email filter
  document.getElementById('filterHasEmail').addEventListener('change', () => {
    renderDiscoveryTab();
  });

  // City filter
  document.getElementById('scraperCityFilter').addEventListener('change', (e) => {
    currentCityFilter = e.target.value === 'all' ? '' : e.target.value;
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
  document.getElementById('btnAnalyzeWebsites').addEventListener('click', () => analyzeWebsites(false));
  document.getElementById('btnAnalyzeSelected').addEventListener('click', () => analyzeWebsites(true));
  document.getElementById('selectAllDiscovery').addEventListener('change', (e) => {
    document.querySelectorAll('.lead-select').forEach(cb => { cb.checked = e.target.checked; });
    updateSelectionUI();
  });

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
  document.getElementById('btnSendTestEmail').addEventListener('click', sendTestEmail);

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
    document.getElementById('emailBodyEdit').value = result.body;
    document.getElementById('emailBodyEdit').classList.add('hidden');
    document.getElementById('emailBody').classList.remove('hidden');
    document.getElementById('btnEditEmail').textContent = 'Edit';
    const typeLabels = { email1: 'Email 1 — Cold Outreach', email2: 'Follow-Up 1', email3: 'Follow-Up 2' };
    document.getElementById('emailPreviewTitle').textContent = typeLabels[emailType] || 'Email';
    currentEmailContext = { leadId, emailType };
    openModal('modalEmail');
  } catch (err) {
    showError(err.message);
  }
}

function toggleEmailEdit() {
  const pre = document.getElementById('emailBody');
  const textarea = document.getElementById('emailBodyEdit');
  const btn = document.getElementById('btnEditEmail');
  if (textarea.classList.contains('hidden')) {
    // Switch to edit mode
    textarea.value = pre.textContent;
    pre.classList.add('hidden');
    textarea.classList.remove('hidden');
    textarea.focus();
    btn.textContent = 'Preview';
  } else {
    // Switch back to preview
    pre.textContent = textarea.value;
    textarea.classList.add('hidden');
    pre.classList.remove('hidden');
    btn.textContent = 'Edit';
  }
}

async function sendCurrentEmail() {
  if (!currentEmailContext) return;
  showLoading('Sending email...');
  try {
    // Use edited body if the textarea was active
    const textarea = document.getElementById('emailBodyEdit');
    const customBody = !textarea.classList.contains('hidden') ? textarea.value : null;
    const pre = document.getElementById('emailBody');
    const body = customBody || pre.textContent;

    await API.post('/api/email/send', {
      ...currentEmailContext,
      customBody: body,
      customSubject: document.getElementById('emailSubject').textContent
    });
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

  // Website findings section
  const findingsEl = document.getElementById('websiteFindings');
  if (lead.websiteIssues && lead.websiteIssues.length > 0) {
    findingsEl.classList.remove('hidden');
    findingsEl.innerHTML = `
      <div class="findings-header">
        <strong>Website Analysis</strong>
        <span class="quality-badge ${({
          'Poor': 'quality-poor', 'Outdated': 'quality-outdated',
          'Good': 'quality-good', 'None': 'quality-none', 'Not a Fit': 'quality-notafit'
        })[lead.websiteQuality] || 'quality-none'}">${esc(lead.websiteQuality)} — ${lead.websiteScore}/100</span>
        ${lead.websiteLoadTime ? `<span class="findings-meta">Load: ${(lead.websiteLoadTime / 1000).toFixed(1)}s</span>` : ''}
        ${lead.websiteAnalyzedAt ? `<span class="findings-meta">Analyzed: ${lead.websiteAnalyzedAt.split('T')[0]}</span>` : ''}
      </div>
      <ul class="findings-list">
        ${lead.websiteIssues.map(i => `
          <li class="finding-item">
            <span class="finding-label">${esc(i.label)}</span>
            <span class="finding-detail">${esc(i.detail)}</span>
          </li>
        `).join('')}
      </ul>
    `;
  } else {
    findingsEl.classList.add('hidden');
    findingsEl.innerHTML = '';
  }

  // Preview section
  renderPreviewSection(lead);

  // Activity log
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
// PREVIEW SITE GENERATION
// ============================================================

let previewGenerationInProgress = false;

function renderPreviewSection(lead) {
  const container = document.getElementById('previewSection');
  const canGenerate = lead.websiteAnalyzedAt && ['Discovered', 'Reached Out'].includes(lead.status);

  // If lead doesn't qualify for preview, hide the section
  if (!canGenerate && !lead.previewUrl) {
    container.classList.add('hidden');
    container.innerHTML = '';
    return;
  }

  container.classList.remove('hidden');

  // Check for existing non-expired preview
  if (lead.previewUrl && lead.previewExpiresAt) {
    const expiresAt = new Date(lead.previewExpiresAt);
    if (expiresAt > new Date()) {
      // Show existing valid preview
      renderPreviewResult(container, lead);
      return;
    }
  }

  // Also try fetching preview state from API (async, non-blocking)
  if (canGenerate) {
    container.innerHTML = `
      <div class="preview-section-inner">
        <button class="btn btn-primary" id="btnGeneratePreview" onclick="startPreviewGeneration('${lead.id}')">Generate Preview</button>
        <div id="previewProgress" class="preview-progress hidden"></div>
        <div id="previewResult" class="preview-result hidden"></div>
        <div id="previewError" class="preview-error hidden"></div>
      </div>
    `;
    // Check if there's an existing preview via API
    fetchExistingPreview(lead.id, container);
  } else {
    container.innerHTML = '';
    container.classList.add('hidden');
  }
}

async function fetchExistingPreview(leadId, container) {
  try {
    const res = await fetch(`/api/previews/${leadId}`);
    if (!res.ok) return; // 404 = no preview
    const preview = await res.json();
    if (preview && preview.status === 'deployed' && preview.expiresAt) {
      const expiresAt = new Date(preview.expiresAt);
      if (expiresAt > new Date()) {
        renderPreviewResult(container, {
          previewUrl: preview.previewUrl,
          previewScreenshotPath: preview.screenshotPath
        });
      }
    }
  } catch (err) {
    // Silently ignore — preview check is non-blocking
  }
}

function renderPreviewResult(container, lead) {
  const slug = lead.previewUrl ? lead.previewUrl.replace('https://preview.kaelint.ch/', '').replace(/\/de\/?$/, '') : '';
  const screenshotUrl = slug ? `https://preview.kaelint.ch/${slug}/screenshot.png` : '';

  container.innerHTML = `
    <div class="preview-section-inner">
      <div class="preview-result">
        <strong>Preview Site</strong>
        <a href="${esc(lead.previewUrl)}" target="_blank" class="preview-link">${esc(lead.previewUrl)}</a>
        ${screenshotUrl ? `<img src="${esc(screenshotUrl)}" alt="Preview Screenshot" class="preview-thumbnail" onerror="this.style.display='none'">` : ''}
      </div>
    </div>
  `;
}

async function startPreviewGeneration(leadId) {
  if (previewGenerationInProgress) return;
  previewGenerationInProgress = true;

  const btn = document.getElementById('btnGeneratePreview');
  const progressEl = document.getElementById('previewProgress');
  const resultEl = document.getElementById('previewResult');
  const errorEl = document.getElementById('previewError');

  // Disable button
  if (btn) {
    btn.disabled = true;
    btn.textContent = '⏳ Generating...';
  }

  // Show progress, hide others
  progressEl.classList.remove('hidden');
  progressEl.innerHTML = '<div class="preview-progress-step">Starting...</div>';
  resultEl.classList.add('hidden');
  errorEl.classList.add('hidden');

  try {
    const response = await fetch('/api/previews/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ leadId })
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({ error: response.statusText }));
      throw new Error(err.error || 'Generation failed');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop(); // Keep incomplete line in buffer

      let currentEventType = 'progress';
      for (const line of lines) {
        if (line.startsWith('event: ')) {
          currentEventType = line.slice(7).trim();
        } else if (line.startsWith('data: ')) {
          try {
            const data = JSON.parse(line.slice(6));
            handlePreviewSSEEvent(currentEventType, data, progressEl, resultEl, errorEl, btn, leadId);
          } catch (e) {
            // Skip malformed JSON
          }
        }
      }
    }
  } catch (err) {
    errorEl.classList.remove('hidden');
    errorEl.innerHTML = `
      <div class="preview-error-message">❌ ${esc(err.message)}</div>
      <button class="btn btn-sm" onclick="retryPreviewGeneration('${leadId}')">🔄 Retry</button>
    `;
    progressEl.classList.add('hidden');
  } finally {
    previewGenerationInProgress = false;
    if (btn && !btn.classList.contains('hidden')) {
      btn.disabled = false;
      btn.textContent = 'Generate Preview';
    }
  }
}

function handlePreviewSSEEvent(eventType, data, progressEl, resultEl, errorEl, btn, leadId) {
  if (eventType === 'complete' || data.step === 'deploy_complete') {
    // Success state
    progressEl.classList.add('hidden');
    resultEl.classList.remove('hidden');
    if (btn) btn.classList.add('hidden');

    const previewUrl = data.previewUrl || '';
    const slug = previewUrl.replace('https://preview.kaelint.ch/', '').replace(/\/de\/?$/, '');
    const screenshotUrl = slug ? `https://preview.kaelint.ch/${slug}/screenshot.png` : '';

    resultEl.innerHTML = `
      <strong>✅ Preview erfolgreich deployed</strong>
      <a href="${esc(previewUrl)}" target="_blank" class="preview-link">${esc(previewUrl)}</a>
      ${screenshotUrl ? `<img src="${esc(screenshotUrl)}" alt="Preview Screenshot" class="preview-thumbnail" onerror="this.style.display='none'">` : ''}
    `;

    // Reload lead data so the preview info is reflected
    loadData();
  } else if (eventType === 'error' || (data.step && data.step.includes('fail'))) {
    // Error from SSE
    progressEl.classList.add('hidden');
    errorEl.classList.remove('hidden');
    errorEl.innerHTML = `
      <div class="preview-error-message">❌ ${esc(data.message)}</div>
      <button class="btn btn-sm" onclick="retryPreviewGeneration('${leadId}')">🔄 Retry</button>
    `;
  } else if (data.message) {
    // Progress update
    progressEl.innerHTML = `<div class="preview-progress-step">⏳ ${esc(data.message)}</div>`;
  }
}

function retryPreviewGeneration(leadId) {
  const errorEl = document.getElementById('previewError');
  if (errorEl) errorEl.classList.add('hidden');
  const btn = document.getElementById('btnGeneratePreview');
  if (btn) {
    btn.classList.remove('hidden');
    btn.disabled = false;
    btn.textContent = 'Generate Preview';
  }
  startPreviewGeneration(leadId);
}

// ============================================================
// SCRAPER
// ============================================================

async function discoverLeads() {
  const catFilter = document.getElementById('categoryFilter').value;
  const citySelect = document.getElementById('scraperCityFilter').value;

  // Determine which categories to scrape
  let categoriesToScrape;
  if (catFilter) {
    const category = allCategories.find(c => c.name === catFilter);
    if (!category) { showError('Category not found.'); return; }
    categoriesToScrape = [category];
  } else {
    categoriesToScrape = [...allCategories];
  }

  // Determine which cities to scrape
  let citiesToScrape;
  if (citySelect === 'all') {
    const cityOptions = document.getElementById('scraperCityFilter').options;
    citiesToScrape = [...cityOptions].filter(o => o.value !== 'all').map(o => o.value);
  } else {
    citiesToScrape = [citySelect];
  }

  // Build list of all category+city combos (allow re-scraping)
  const existingLeads = allLeads.filter(l => l.status === 'Discovered' || l.status === 'Lost');
  const alreadyScraped = new Set();
  for (const lead of existingLeads) {
    let leadCity = lead.city;
    if (!leadCity && lead.activityLog && lead.activityLog[0]?.details) {
      const match = lead.activityLog[0].details.match(/in (.+)$/);
      if (match) leadCity = match[1];
    }
    if (leadCity && lead.category) {
      alreadyScraped.add(`${lead.category}::${leadCity}`);
    }
  }

  const jobs = [];
  let rescrapeCount = 0;
  for (const city of citiesToScrape) {
    for (const cat of categoriesToScrape) {
      jobs.push({ category: cat, city });
      if (alreadyScraped.has(`${cat.name}::${city}`)) {
        rescrapeCount++;
      }
    }
  }

  if (jobs.length === 0) {
    showError('No category+city combinations to scrape.');
    return;
  }

  const msg = jobs.length === 1
    ? `Scrape "${jobs[0].category.name}" in ${jobs[0].city}?${rescrapeCount > 0 ? ' (already scraped before — duplicates will be skipped)' : ''}`
    : `Scrape ${jobs.length} category+city combinations?${rescrapeCount > 0 ? ` (${rescrapeCount} previously scraped — duplicates will be skipped)` : ''}`;

  if (!confirm(msg)) return;

  // Show progress bar
  const bar = document.getElementById('enrichmentBar');
  const text = document.getElementById('enrichmentText');
  const fill = document.getElementById('enrichmentFill');
  const count = document.getElementById('enrichmentCount');
  bar.classList.remove('hidden');
  fill.style.width = '0%';

  const btn = document.getElementById('btnDiscoverLeads');
  btn.disabled = true;
  btn.textContent = '⏳ Scraping...';

  let totalCreated = 0;
  let totalDuplicates = 0;
  let errors = 0;

  try {
    for (let i = 0; i < jobs.length; i++) {
      const { category: cat, city } = jobs[i];
      const pct = Math.round((i / jobs.length) * 100);
      fill.style.width = `${pct}%`;
      text.textContent = `Scraping: ${cat.name} in ${city}`;
      count.textContent = `${i + 1}/${jobs.length}`;

      try {
        const result = await API.post('/api/scraper/discover', { categoryId: cat.id, city });
        totalCreated += result.leads.length;
        totalDuplicates += (result.duplicates || []).length;
      } catch (err) {
        errors++;
        console.error(`Scraper error for ${cat.name} in ${city}:`, err.message);
      }

      // Polite delay between requests
      if (i < jobs.length - 1) {
        await new Promise(r => setTimeout(r, 2000));
      }
    }

    fill.style.width = '100%';
    bar.classList.add('hidden');
    alert(`Done! ${totalCreated} leads discovered across ${jobs.length} searches.${totalDuplicates > 0 ? ` ${totalDuplicates} duplicates.` : ''}${errors > 0 ? ` ${errors} errors.` : ''}`);
    await loadData();
  } catch (err) {
    bar.classList.add('hidden');
    showError(`Scraper error: ${err.message}`);
  } finally {
    btn.disabled = false;
    btn.textContent = '🔍 Discover';
  }
}

async function enrichEmails() {
  const citySelect = document.getElementById('scraperCityFilter').value;
  const catFilter = document.getElementById('categoryFilter').value;

  // Filter leads that need enrichment based on current category/city selection
  let leadsToEnrich = allLeads.filter(l =>
    !l.email && (l.status === 'Discovered' || l.status === 'Lost')
  );

  // Apply category filter if set
  if (catFilter) {
    leadsToEnrich = leadsToEnrich.filter(l => l.category === catFilter);
  }

  // Apply city filter if set
  if (citySelect !== 'all') {
    leadsToEnrich = leadsToEnrich.filter(l => {
      if (l.city) return l.city === citySelect;
      if (l.activityLog && l.activityLog[0]?.details) {
        return l.activityLog[0].details.includes(`in ${citySelect}`);
      }
      return false;
    });
  }

  if (leadsToEnrich.length === 0) {
    showError('No leads without email to enrich (for current filter).');
    return;
  }

  const scope = [
    catFilter || 'all categories',
    citySelect === 'all' ? 'all cities' : citySelect
  ].join(', ');

  if (!confirm(`Enrich emails for ${leadsToEnrich.length} leads (${scope})? This runs in the background.`)) {
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
  count.textContent = `0/${leadsToEnrich.length}`;

  // Disable the button while running
  const btn = document.getElementById('btnEnrichEmails');
  btn.disabled = true;
  btn.textContent = '⏳ Enriching...';

  try {
    const response = await fetch('/api/scraper/enrich-emails', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        leadIds: leadsToEnrich.map(l => l.id),
        city: citySelect === 'all' ? 'Zürich' : citySelect
      })
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
    btn.textContent = 'Enrich Emails';
  }
}

// ============================================================
// WEBSITE ANALYSIS
// ============================================================

function renderQualityBadge(lead) {
  const q = lead.websiteQuality || 'None';
  const score = lead.websiteScore != null ? ` (${lead.websiteScore}/100)` : '';
  const issues = lead.websiteIssues || [];
  const tooltip = issues.length > 0
    ? issues.map(i => `• ${i.label}`).join('&#10;')
    : '';
  const badgeClass = {
    'None': 'quality-none',
    'Poor': 'quality-poor',
    'Outdated': 'quality-outdated',
    'Good': 'quality-good',
    'Not a Fit': 'quality-notafit'
  }[q] || 'quality-none';

  return `<span class="quality-badge ${badgeClass}" ${tooltip ? `title="${tooltip}"` : ''}>${esc(q)}${score}</span>`;
}

// ============================================================
// LEAD SELECTION (checkboxes in Discovery table)
// ============================================================

function getSelectedLeadIds() {
  return [...document.querySelectorAll('.lead-select:checked')].map(cb => cb.dataset.id);
}

function updateSelectionUI() {
  const selectedIds = getSelectedLeadIds();
  const btnAnalyzeSelected = document.getElementById('btnAnalyzeSelected');
  if (btnAnalyzeSelected) {
    if (selectedIds.length > 0) {
      btnAnalyzeSelected.classList.remove('hidden');
      btnAnalyzeSelected.textContent = `Analyze Selected (${selectedIds.length})`;
    } else {
      btnAnalyzeSelected.classList.add('hidden');
    }
  }
}

async function analyzeWebsites(selectedOnly = false) {
  const citySelect = document.getElementById('scraperCityFilter').value;
  const catFilter = document.getElementById('categoryFilter').value;

  let leadsToAnalyze;

  if (selectedOnly) {
    // Analyze only selected leads (allows re-analysis)
    const selectedIds = getSelectedLeadIds();
    leadsToAnalyze = allLeads.filter(l => selectedIds.includes(l.id) && l.websiteUrl);
  } else {
    // Bulk analyze: leads with a website that haven't been analyzed yet
    leadsToAnalyze = allLeads.filter(l =>
      l.websiteUrl && !l.websiteAnalyzedAt && (l.status === 'Discovered' || l.status === 'Reached Out')
    );

    // Apply category filter if set
    if (catFilter) {
      leadsToAnalyze = leadsToAnalyze.filter(l => l.category === catFilter);
    }

    // Apply city filter if set
    if (citySelect !== 'all') {
      leadsToAnalyze = leadsToAnalyze.filter(l => {
        if (l.city) return l.city === citySelect;
        if (l.activityLog && l.activityLog[0]?.details) {
          return l.activityLog[0].details.includes(`in ${citySelect}`);
        }
        return false;
      });
    }
  }

  if (leadsToAnalyze.length === 0) {
    showError(selectedOnly
      ? 'No selected leads with websites to analyze.'
      : 'No unanalyzed leads with websites (for current filter).');
    return;
  }

  const reAnalyzeCount = leadsToAnalyze.filter(l => l.websiteAnalyzedAt).length;
  const freshCount = leadsToAnalyze.length - reAnalyzeCount;
  const desc = reAnalyzeCount > 0
    ? `${leadsToAnalyze.length} websites (${freshCount} new, ${reAnalyzeCount} re-analysis)`
    : `${leadsToAnalyze.length} websites`;

  if (!confirm(`Analyze ${desc}? This runs in the background.`)) {
    return;
  }

  // Reuse the enrichment progress bar
  const bar = document.getElementById('enrichmentBar');
  const text = document.getElementById('enrichmentText');
  const fill = document.getElementById('enrichmentFill');
  const count = document.getElementById('enrichmentCount');
  bar.classList.remove('hidden');
  text.textContent = 'Starting website analysis...';
  fill.style.width = '0%';
  count.textContent = `0/${leadsToAnalyze.length}`;

  const btn = document.getElementById('btnAnalyzeWebsites');
  btn.disabled = true;
  btn.textContent = '⏳ Analyzing...';

  try {
    const response = await fetch('/api/scraper/analyze-websites', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ leadIds: leadsToAnalyze.map(l => l.id) })
    });

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let analyzedCount = 0;

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
              text.textContent = `Analyzing: ${event.businessName}`;
              count.textContent = `${event.current}/${event.total}`;
            } else if (event.type === 'result') {
              analyzedCount++;
              count.textContent = `${event.current || analyzedCount}/${leadsToAnalyze.length} (${event.quality}: ${event.score}/100)`;
            } else if (event.type === 'done') {
              bar.classList.add('hidden');
              alert(`Done! Analyzed ${event.analyzed} websites.`);
              await loadData();
            } else if (event.type === 'error') {
              throw new Error(event.error);
            }
          } catch (parseErr) {
            if (parseErr.message && !parseErr.message.includes('Unexpected end of JSON input')) {
              throw parseErr;
            }
          }
        }
      }
    }

    bar.classList.add('hidden');
    await loadData();
  } catch (err) {
    bar.classList.add('hidden');
    showError(`Analysis error: ${err.message}`);
  } finally {
    btn.disabled = false;
    btn.textContent = 'Analyze';
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
    document.getElementById('smtpUseProxy').checked = !!settings.smtp?.useProxy;
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
        fromAddress: document.getElementById('smtpFrom').value,
        useProxy: document.getElementById('smtpUseProxy').checked
      }
    });
    alert('SMTP settings saved.');
  } catch (err) {
    showError(err.message);
  }
}

async function testSMTP() {
  const resultEl = document.getElementById('smtpTestResult');
  resultEl.classList.remove('hidden', 'smtp-success', 'smtp-error');
  resultEl.textContent = '⏳ Saving & testing SMTP connection...';
  resultEl.classList.add('smtp-pending');

  try {
    // Save current form values first so the test uses them
    await API.put('/api/settings', {
      smtp: {
        host: document.getElementById('smtpHost').value,
        port: parseInt(document.getElementById('smtpPort').value) || 587,
        username: document.getElementById('smtpUsername').value,
        password: document.getElementById('smtpPassword').value,
        fromAddress: document.getElementById('smtpFrom').value,
        useProxy: document.getElementById('smtpUseProxy').checked
      }
    });
    const result = await API.post('/api/settings/test-smtp', {});
    resultEl.classList.remove('smtp-pending');
    resultEl.classList.add('smtp-success');
    resultEl.textContent = `✅ ${result.message}`;
  } catch (err) {
    resultEl.classList.remove('smtp-pending');
    resultEl.classList.add('smtp-error');
    resultEl.textContent = `❌ ${err.message}`;
  }
}

async function sendTestEmail() {
  const recipient = document.getElementById('smtpTestRecipient').value.trim();
  if (!recipient) {
    showError('Enter a recipient email address.');
    return;
  }

  const resultEl = document.getElementById('smtpSendTestResult');
  resultEl.classList.remove('hidden', 'smtp-success', 'smtp-error');
  resultEl.textContent = '⏳ Sending test email...';
  resultEl.classList.add('smtp-pending');

  try {
    // Save settings first to ensure current form values are used
    await API.put('/api/settings', {
      smtp: {
        host: document.getElementById('smtpHost').value,
        port: parseInt(document.getElementById('smtpPort').value) || 587,
        username: document.getElementById('smtpUsername').value,
        password: document.getElementById('smtpPassword').value,
        fromAddress: document.getElementById('smtpFrom').value,
        useProxy: document.getElementById('smtpUseProxy').checked
      }
    });
    const result = await API.post('/api/settings/send-test-email', { to: recipient });
    resultEl.classList.remove('smtp-pending');
    resultEl.classList.add('smtp-success');
    resultEl.textContent = `✅ ${result.message}`;
  } catch (err) {
    resultEl.classList.remove('smtp-pending');
    resultEl.classList.add('smtp-error');
    resultEl.textContent = `❌ ${err.message}`;
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
          <button class="btn btn-sm" onclick="editCategory('${c.id}')">✏️</button>
          <button class="btn btn-sm btn-danger" onclick="deleteCategory('${c.id}')">Del</button>
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

  // Sort categories alphabetically
  const sorted = [...allCategories].sort((a, b) => a.name.localeCompare(b.name, 'de'));

  // Preserve current filter value
  const currentFilter = filterSelect.value;
  filterSelect.innerHTML = '<option value="">All Categories</option>' +
    sorted.map(c => `<option value="${esc(c.name)}">${esc(c.name)}</option>`).join('');
  filterSelect.value = currentFilter;

  leadSelect.innerHTML = sorted.map(c =>
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
