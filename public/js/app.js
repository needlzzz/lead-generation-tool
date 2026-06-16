// ============================================================
// Lead Generation CRM — Frontend Application
// ============================================================

let allLeads = [];
let allCategories = [];
let currentTab = 'discovery';
let currentCategoryFilter = '';
let currentCityFilter = '';
let currentEmailContext = null; // { leadId, emailType }
let qualitySortOrder = 'asc'; // default: Poor first (best prospects)
let discoverySortField = null; // null, 'category', 'status', 'discovered'
let discoverySortOrder = null; // null, 'asc', 'desc'
let currentPage = 1;
let totalPages = 1;
let totalLeads = 0;
let scrapeLogSortOrder = null; // null = alphabetical, 'asc' = lowest first, 'desc' = highest first
const PAGE_SIZE = 100;

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
    // Build query params for paginated leads
    const params = new URLSearchParams();
    params.set('page', currentPage);
    params.set('limit', PAGE_SIZE);
    if (currentCategoryFilter) params.set('category', currentCategoryFilter);

    // Server-side filters
    const hasEmailOnly = document.getElementById('filterHasEmail')?.checked;
    if (hasEmailOnly) params.set('hasEmail', '1');
    const hasPreviewOnly = document.getElementById('filterHasPreview')?.checked;
    if (hasPreviewOnly) params.set('hasPreview', '1');
    const previewReady = document.getElementById('filterPreviewReady')?.checked;
    if (previewReady) params.set('previewReady', '1');
    const poorDiscovered = document.getElementById('filterPoorDiscovered')?.checked;
    if (poorDiscovered) params.set('poorDiscovered', '1');
    const searchQuery = document.getElementById('searchLeads')?.value?.trim();
    if (searchQuery) params.set('search', searchQuery);

    // Server-side sorting
    if (qualitySortOrder) {
      params.set('sort', 'quality');
      params.set('order', qualitySortOrder);
    } else if (discoverySortField && discoverySortOrder) {
      params.set('sort', discoverySortField);
      params.set('order', discoverySortOrder);
    }

    const [leadsRes, dueRes, repliesRes] = await Promise.all([
      API.get(`/api/leads?${params.toString()}`),
      API.get('/api/leads/due-today'),
      API.get('/api/leads/check-replies')
    ]);
    allLeads = leadsRes.leads;
    if (leadsRes.pagination) {
      totalPages = leadsRes.pagination.totalPages;
      totalLeads = leadsRes.pagination.total;
    } else {
      // Fallback for old response format
      totalPages = 1;
      totalLeads = allLeads.length;
    }
    renderPagination();
    renderCurrentTab();
    renderDashboardAlerts(dueRes, repliesRes);
    renderStatsBar();
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
      if (tab.dataset.settingsTab === 'templates') loadTemplatesForm();
    });
  });
}

function renderCurrentTab() {
  switch (currentTab) {
    case 'discovery': renderDiscoveryTab(); break;
    case 'outreach': renderOutreachTab(); break;
    case 'replies': renderRepliesTab(); break;
    case 'clients': renderClientsTab(); break;
    case 'batch': renderBatchTab(); break;
    case 'scrapelog': renderScrapeLogTab(); break;
  }
}

// ============================================================
// PAGINATION
// ============================================================

function renderPagination() {
  let container = document.getElementById('paginationControls');
  if (!container) {
    // Create pagination container after the discovery table
    container = document.createElement('div');
    container.id = 'paginationControls';
    container.className = 'pagination-controls';
    const tableWrap = document.querySelector('#panel-discovery .table-wrap');
    if (tableWrap) tableWrap.after(container);
  }

  if (totalPages <= 1) {
    container.innerHTML = `<span class="pagination-info">${totalLeads} leads</span>`;
    return;
  }

  const prevDisabled = currentPage <= 1 ? 'disabled' : '';
  const nextDisabled = currentPage >= totalPages ? 'disabled' : '';

  container.innerHTML = `
    <button class="btn btn-sm" ${prevDisabled} onclick="goToPage(1)" title="First">⏮</button>
    <button class="btn btn-sm" ${prevDisabled} onclick="goToPage(${currentPage - 1})">← Prev</button>
    <span class="pagination-info">Page ${currentPage} / ${totalPages} (${totalLeads} leads)</span>
    <button class="btn btn-sm" ${nextDisabled} onclick="goToPage(${currentPage + 1})">Next →</button>
    <button class="btn btn-sm" ${nextDisabled} onclick="goToPage(${totalPages})" title="Last">⏭</button>
  `;
}

function goToPage(page) {
  currentPage = Math.max(1, Math.min(page, totalPages));
  loadData();
}

// ============================================================
// STATS BAR
// ============================================================

async function renderStatsBar() {
  const bar = document.getElementById('statsBar');
  if (!bar) return;

  try {
    const [countsRes, quotaRes] = await Promise.all([
      API.get('/api/leads/counts'),
      API.get('/api/email/quota').catch(() => ({ count: 0, remaining: 20, maxPerDay: 20 }))
    ]);

    const counts = countsRes.counts || {};
    const total = countsRes.total || 0;
    const previews = allLeads.filter(l => l.previewUrl).length;
    const reachedOut = counts['Reached Out'] || 0;
    const replied = counts['Replied'] || 0;
    const won = counts['Client Won'] || 0;

    bar.innerHTML = `
      <span class="stat">${total.toLocaleString()} leads</span>
      <span class="stat stat--reached">${reachedOut} reached out</span>
      <span class="stat stat--replied">${replied} replied</span>
      <span class="stat stat--won">${won} won</span>
      <span class="stat stat--quota">Quota: ${quotaRes.count}/${quotaRes.maxPerDay} today</span>
    `;
  } catch (err) {
    bar.innerHTML = '';
  }
}

// ============================================================
// PREVIEWS TAB
// ============================================================

async function renderPreviewsTab() {
  const tbody = document.querySelector('#tablePreviews tbody');
  const empty = document.getElementById('emptyPreviews');
  const countsEl = document.getElementById('previewCounts');

  try {
    const { previews, counts, total } = await API.get('/api/previews/list');

    // Show counts summary
    countsEl.innerHTML = `
      <span class="badge status-client-won">${counts.deployed || 0} deployed</span>
      <span class="badge status-reached-out">${counts.built || 0} built</span>
      <span class="badge status-no-response">${counts.expired || 0} expired</span>
      <span style="color:var(--color-text-secondary);margin-left:8px">${total} total</span>
    `;

    if (previews.length === 0) {
      tbody.innerHTML = '';
      empty.classList.remove('hidden');
      return;
    }
    empty.classList.add('hidden');

    tbody.innerHTML = previews.map(p => {
      const statusClass = p.status === 'deployed' ? 'status-client-won' : p.status === 'built' ? 'status-reached-out' : 'status-no-response';
      const expiresStr = p.expiresAt ? new Date(p.expiresAt).toLocaleDateString('de-CH') : '—';
      const createdStr = p.createdAt ? new Date(p.createdAt).toLocaleDateString('de-CH') : '—';
      const daysLeft = p.expiresAt ? Math.max(0, Math.ceil((new Date(p.expiresAt) - new Date()) / 86400000)) : null;
      const expiryBadge = daysLeft !== null && daysLeft <= 7 && p.status !== 'expired'
        ? `<span style="color:var(--color-danger);font-size:0.75rem"> (${daysLeft}d left)</span>` : '';

      return `
        <tr>
          <td>${esc(p.businessName)}</td>
          <td>${esc(p.category)}</td>
          <td>${esc(p.city)}</td>
          <td><span class="status-pill ${statusClass}">${p.status}</span></td>
          <td>${p.status === 'deployed' ? `<a href="${esc(p.previewUrl)}" target="_blank">Open ↗</a>` : '—'}</td>
          <td>${createdStr}</td>
          <td>${expiresStr}${expiryBadge}</td>
        </tr>
      `;
    }).join('');
  } catch (err) {
    countsEl.innerHTML = '';
    tbody.innerHTML = '';
    empty.classList.remove('hidden');
  }
}

async function deployPreviews() {
  const btn = document.getElementById('btnDeployPreviews');
  btn.disabled = true;
  btn.textContent = '⏳ Deploying...';

  try {
    const result = await API.post('/api/previews/deploy', {});
    showToast('success', result.message || 'Deploy complete');
    await renderPreviewsTab();
  } catch (err) {
    showError(`Deploy failed: ${err.message}`);
  } finally {
    btn.disabled = false;
    btn.textContent = 'Deploy Previews';
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
  const alertsContainer = document.getElementById('outreachAlerts');
  const fuSection = document.getElementById('followUpsDue');
  const fuList = document.getElementById('followUpsList');
  const replySection = document.getElementById('checkReplies');
  const replyList = document.getElementById('repliesList');

  if (!alertsContainer) return;

  const hasFU = dueData.followUp1Due.length + dueData.followUp2Due.length + dueData.markColdDue.length > 0;
  const hasReplies = repliesData.leads.length > 0;

  alertsContainer.classList.toggle('hidden', !hasFU && !hasReplies);
  fuSection.classList.toggle('hidden', !hasFU);
  replySection.classList.toggle('hidden', !hasReplies);

  // Follow-ups
  let fuHtml = '';
  dueData.followUp1Due.forEach(l => {
    fuHtml += `<div class="alert-item"><span class="alert-info"><strong>${esc(l.businessName)}</strong> — Follow-Up due</span>
      <button class="btn btn-sm btn-primary" onclick="previewEmail('${l.id}','email2')">Send FU</button></div>`;
  });
  dueData.followUp2Due.forEach(l => {
    fuHtml += `<div class="alert-item"><span class="alert-info"><strong>${esc(l.businessName)}</strong> — 2nd Follow-Up due</span>
      <button class="btn btn-sm btn-primary" onclick="previewEmail('${l.id}','email2')">Send FU</button></div>`;
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
  const th = document.getElementById('thQuality');
  if (th) th.textContent = 'Quality ' + (qualitySortOrder === 'asc' ? '▲' : qualitySortOrder === 'desc' ? '▼' : '⇅');
  currentPage = 1;
  loadData();
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
  currentPage = 1;
  loadData();
}

function renderDiscoveryTab() {
  const tbody = document.querySelector('#tableDiscovery tbody');
  const empty = document.getElementById('emptyDiscovery');
  const noWebsiteOnly = document.getElementById('filterNoWebsite').checked;
  const hasEmailOnly = document.getElementById('filterHasEmail').checked;
  let leads = allLeads;
  if (currentCityFilter) {
    leads = leads.filter(l => {
      if (l.city) return l.city === currentCityFilter;
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

  // Sorting is now server-side — no client-side sort needed

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
      <td>${esc(l.email)}</td>
      <td>${l.websiteUrl ? `<a href="${esc(l.websiteUrl)}" target="_blank" onclick="event.stopPropagation()">🔗</a>` : '—'}</td>
      <td>${renderQualityBadge(l)}</td>
      <td><span class="status-pill ${statusClass(l.status)}">${statusLabel(l.status)}</span></td>
      <td onclick="event.stopPropagation()">
        <div class="actions">
          <button class="btn btn-sm" onclick="startPreviewGeneration('${l.id}')" title="Generate Preview" ${l.websiteAnalyzedAt && !l.previewUrl && (l.status === 'Discovered' || l.status === 'Reached Out') ? '' : 'disabled'}>Preview</button>
          <button class="btn btn-sm" onclick="window.open('${esc(l.previewUrl || '')}', '_blank')" title="View Preview" ${l.previewUrl ? '' : 'disabled'}>View</button>
          <button class="btn btn-sm btn-primary" onclick="previewEmail('${l.id}','email1')" ${l.status === 'Discovered' && l.email && l.websiteQuality !== 'Not a Fit' ? '' : 'disabled'}>Email 1</button>
          <button class="btn btn-sm" onclick="doTransition('${l.id}','mark-not-a-fit')" ${l.status === 'Discovered' ? '' : 'disabled'}>✖</button>
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

async function renderOutreachTab() {
  const tbody = document.querySelector('#tableOutreach tbody');
  const empty = document.getElementById('emptyOutreach');

  try {
    const { leads } = await API.get('/api/leads?status=Reached+Out&limit=200&page=1');
    const { leads: noResponseLeads } = await API.get('/api/leads?status=No+Response&limit=200&page=1');
    const allOutreach = [...leads, ...noResponseLeads];

    if (allOutreach.length === 0) {
      tbody.innerHTML = '';
      empty.classList.remove('hidden');
      return;
    }
    empty.classList.add('hidden');

    tbody.innerHTML = allOutreach.map(l => `
      <tr class="clickable" onclick="showActivityLog('${l.id}')">
        <td>${esc(l.businessName)}</td>
        <td>${esc(l.category)}</td>
        <td>${esc(l.email)}</td>
        <td><span class="status-pill ${statusClass(l.status)}">${statusLabel(l.status)}</span></td>
        <td>${l.dateEmail1Sent || '—'}</td>
        <td>${l.dateFollowUp1Sent || '—'}</td>
        <td onclick="event.stopPropagation()">
          <div class="actions">
            <button class="btn btn-sm" onclick="openReplyModal('${l.id}')" ${l.status === 'Reached Out' ? '' : 'disabled'}>📝 Reply</button>
          </div>
        </td>
      </tr>
    `).join('');
  } catch (err) {
    tbody.innerHTML = '';
    empty.classList.remove('hidden');
  }
}

// ============================================================
// REPLIES & MEETINGS TAB
// ============================================================

async function renderRepliesTab() {
  const tbody = document.querySelector('#tableReplies tbody');
  const empty = document.getElementById('emptyReplies');

  try {
    const { leads: replied } = await API.get('/api/leads?status=Replied&limit=200&page=1');
    const { leads: meeting } = await API.get('/api/leads?status=Meeting+Scheduled&limit=200&page=1');
    const leads = [...replied, ...meeting];

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
            <button class="btn btn-sm btn-primary" onclick="openMeetingModal('${l.id}')" ${l.status === 'Replied' ? '' : 'disabled'}>📅 Meeting</button>
          </div>
        </td>
      </tr>
    `).join('');
  } catch (err) {
    tbody.innerHTML = '';
    empty.classList.remove('hidden');
  }
}

// ============================================================
// CLIENT TRACKER TAB
// ============================================================

async function renderClientsTab() {
  const tbody = document.querySelector('#tableClients tbody');
  const empty = document.getElementById('emptyClients');

  try {
    const { leads: meetingLeads } = await API.get('/api/leads?status=Meeting+Scheduled&limit=200&page=1');
    const { leads: wonLeads } = await API.get('/api/leads?status=Client+Won&limit=200&page=1');
    const { leads: lostLeads } = await API.get('/api/leads?status=Lost&limit=200&page=1');
    const leads = [...meetingLeads, ...wonLeads, ...lostLeads].filter(l => l.meetingDate);

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
            <button class="btn btn-sm btn-primary" onclick="openDecisionModal('${l.id}','mark-won')" ${l.status === 'Meeting Scheduled' ? '' : 'disabled'}>✅ Won</button>
            <button class="btn btn-sm btn-danger" onclick="openDecisionModal('${l.id}','mark-lost')" ${l.status === 'Meeting Scheduled' ? '' : 'disabled'}>❌ Lost</button>
          </div>
        </td>
      </tr>
    `).join('');
  } catch (err) {
    tbody.innerHTML = '';
    empty.classList.remove('hidden');
  }
}


// ============================================================
// BATCH OPERATIONS TAB
// ============================================================

let batchPreviewPolling = null;
let batchEmailPolling = null;

async function renderBatchTab() {
  await refreshBatchAnalyzeStatus();
  await refreshBatchPreviewStatus();
  await refreshBatchEmailStatus();
}

async function refreshBatchAnalyzeStatus() {
  const container = document.getElementById('batchAnalyzeStatus');
  try {
    const stats = await API.get('/api/scraper/analyze-stats');
    container.innerHTML = `
      <div class="batch-status-row"><span class="batch-status-label">To analyze:</span> <span class="batch-status-value">${stats.toAnalyze.toLocaleString()}</span></div>
      <div class="batch-status-row"><span class="batch-status-label">Already analyzed:</span> <span class="batch-status-value">${stats.alreadyAnalyzed.toLocaleString()}</span></div>
      <div class="batch-status-row"><span class="batch-status-label">No website:</span> <span class="batch-status-value">${stats.noWebsite.toLocaleString()}</span></div>
      ${stats.toAnalyze > 0 ? `<div class="batch-status-row"><span class="batch-status-label">Estimate:</span> <span class="batch-status-value">${stats.estimate.formatted}</span></div>` : ''}
    `;
  } catch (err) {
    container.innerHTML = `<span style="color:var(--color-text-muted)">Could not load analysis stats.</span>`;
  }
}

async function refreshBatchPreviewStatus() {
  const container = document.getElementById('batchPreviewStatus');
  const btnResume = document.getElementById('btnBatchPreviewsResume');
  const categorySelect = document.getElementById('batchPreviewCategory');

  // Populate category dropdown (once)
  if (categorySelect && categorySelect.options.length <= 1) {
    try {
      const res = await API.get('/api/categories');
      const cats = res.categories || res || [];
      for (const cat of cats) {
        const opt = document.createElement('option');
        opt.value = cat.name;
        opt.textContent = cat.name;
        categorySelect.appendChild(opt);
      }
    } catch (e) {}
  }

  // Get preview stats for selected category
  const selectedCategory = categorySelect ? categorySelect.value : '';
  try {
    const stats = await API.get(`/api/batch/preview-stats?category=${encodeURIComponent(selectedCategory)}`);
    const data = await API.get('/api/batch/preview-status');
    const completed = data.completed ? data.completed.length : 0;
    const failed = data.failed ? data.failed.length : 0;
    const statusClass = data.status === 'complete' ? 'complete' : data.status === 'running' ? 'running' : data.status === 'failed' ? 'failed' : '';

    // Duration estimate: ~30s per preview build (serialized via semaphore)
    const limitVal = parseInt(document.getElementById('batchPreviewLimit')?.value) || 50;
    const toBuild = Math.min(stats.withoutPreview, limitVal);
    const estSeconds = toBuild * 30;
    const estFormatted = estSeconds < 3600
      ? `~${Math.ceil(estSeconds / 60)} min`
      : `~${(estSeconds / 3600).toFixed(1)} h`;

    container.innerHTML = `
      <div class="batch-status-row"><span class="batch-status-label">Eligible (analyzed):</span> <span class="batch-status-value">${stats.total.toLocaleString()}</span></div>
      <div class="batch-status-row"><span class="batch-status-label">Already have preview:</span> <span class="batch-status-value">${stats.withPreview.toLocaleString()}</span></div>
      <div class="batch-status-row"><span class="batch-status-label">Need preview:</span> <span class="batch-status-value" style="font-weight:600; color:var(--color-primary)">${stats.withoutPreview.toLocaleString()}</span></div>
      ${toBuild > 0 ? `<div class="batch-status-row"><span class="batch-status-label">Will build:</span> <span class="batch-status-value">${toBuild} (${estFormatted} estimated)</span></div>` : ''}
      ${data.status !== 'idle' ? `<div class="batch-status-row" style="margin-top:4px; padding-top:4px; border-top:1px solid var(--color-border);"><span class="batch-status-label">Last run:</span> <span class="batch-status-value ${statusClass}">${data.status} (${completed} done, ${failed} failed)</span></div>` : ''}
    `;

    btnResume.disabled = !(data.status === 'running' || data.status === 'deploying');
  } catch (err) {
    container.innerHTML = `<span style="color:var(--color-text-muted)">No batch preview data yet.</span>`;
    btnResume.disabled = true;
  }
}

async function refreshBatchEmailStatus() {
  const container = document.getElementById('batchEmailStatus');
  const btnResume = document.getElementById('btnBatchEmailsResume');
  const btnStop = document.getElementById('btnBatchEmailsStop');
  try {
    const data = await API.get('/api/batch/send-status');
    const statusClass = data.status === 'complete' ? 'complete' : data.status === 'sending' ? 'running' : data.status.startsWith('paused') ? 'paused' : data.status === 'stopping' ? 'paused' : '';
    const isActive = ['sending', 'paused_quota', 'paused_window'].includes(data.status);

    container.innerHTML = `
      <div class="batch-status-row"><span class="batch-status-label">Status:</span> <span class="batch-status-value ${statusClass}">${data.status || 'idle'}</span></div>
      <div class="batch-status-row"><span class="batch-status-label">Queued:</span> <span class="batch-status-value">${data.totalQueued || 0}</span></div>
      <div class="batch-status-row"><span class="batch-status-label">Completed:</span> <span class="batch-status-value">${data.completed || 0}</span></div>
      <div class="batch-status-row"><span class="batch-status-label">Failed:</span> <span class="batch-status-value">${data.failed || 0}</span></div>
      <div class="batch-status-row"><span class="batch-status-label">Quota today:</span> <span class="batch-status-value">${data.dailyQuotaUsed || 0} / ${data.dailyQuotaLimit || 250}</span></div>
      <div class="batch-status-row"><span class="batch-status-label">Send window:</span> <span class="batch-status-value">${data.sendWindowStatus || '—'}</span></div>
      ${data.pauseReason ? `<div class="batch-status-row"><span class="batch-status-label">Paused:</span> <span class="batch-status-value paused">${data.pauseReason === 'quota_reached' ? 'Daily quota reached' : 'Outside send window'}</span></div>` : ''}
    `;

    btnResume.disabled = !(['paused_quota', 'paused_window', 'complete'].includes(data.status));
    btnStop.disabled = !isActive;
  } catch (err) {
    container.innerHTML = `<span style="color:var(--color-text-muted)">No batch email data yet.</span>`;
    btnResume.disabled = true;
    btnStop.disabled = true;
  }
}

function appendBatchLog(msg, type = 'info') {
  const container = document.getElementById('batchProgress');
  // Remove idle message if present
  const idle = container.querySelector('.batch-progress-idle');
  if (idle) idle.remove();

  const line = document.createElement('div');
  line.className = `batch-progress-line ${type}`;
  line.textContent = msg;
  container.appendChild(line);
  container.scrollTop = container.scrollHeight;
}

async function startBatchAnalysis() {
  const btn = document.getElementById('btnBatchAnalyze');
  const statusEl = document.getElementById('batchAnalyzeStatus');
  btn.disabled = true;
  btn.textContent = '⏳ Loading stats...';

  try {
    // Pre-flight: get stats
    const stats = await API.get('/api/scraper/analyze-stats');
    if (stats.toAnalyze === 0) {
      appendBatchLog('No unanalyzed leads with websites found.', 'info');
      statusEl.innerHTML = `<div class="batch-status-row"><span class="batch-status-label">Status:</span> <span class="batch-status-value">Nothing to analyze</span></div>`;
      return;
    }

    const msg = `Analyze ${stats.toAnalyze.toLocaleString()} websites?\n\nAlready analyzed: ${stats.alreadyAnalyzed.toLocaleString()} (skipped)\nWithout website: ${stats.noWebsite.toLocaleString()} (skipped)\n\nEstimated duration: ${stats.estimate.formatted}\n(4 parallel workers, ~1.5s per lead)`;
    if (!confirm(msg)) return;

    btn.textContent = '⏳ Analyzing...';
    appendBatchLog(`Starting batch website analysis: ${stats.toAnalyze} leads...`, 'info');
    statusEl.innerHTML = `<div class="batch-status-row"><span class="batch-status-label">Status:</span> <span class="batch-status-value running">Running</span></div>
      <div class="batch-status-row"><span class="batch-status-label">To analyze:</span> <span class="batch-status-value">${stats.toAnalyze}</span></div>`;

    const response = await fetch('/api/scraper/analyze-websites', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    });

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let analyzed = 0;
    let total = stats.toAnalyze;

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
            if (event.type === 'start') {
              total = event.total;
            } else if (event.type === 'progress') {
              const pct = Math.round((event.current / total) * 100);
              statusEl.innerHTML = `<div class="batch-status-row"><span class="batch-status-label">Status:</span> <span class="batch-status-value running">Running (${pct}%)</span></div>
                <div class="batch-status-row"><span class="batch-status-label">Progress:</span> <span class="batch-status-value">${event.current}/${total}</span></div>
                <div class="batch-status-row"><span class="batch-status-label">Current:</span> <span class="batch-status-value">${event.businessName || ''}</span></div>`;
            } else if (event.type === 'result') {
              analyzed++;
              if (analyzed % 10 === 0 || analyzed === total) {
                appendBatchLog(`Analyzed ${analyzed}/${total} — ${event.businessName}: ${event.quality} (${event.score}/100)`, 'info');
              }
            } else if (event.type === 'done') {
              appendBatchLog(`✅ Batch analysis complete: ${event.analyzed} websites analyzed`, 'success');
              statusEl.innerHTML = `<div class="batch-status-row"><span class="batch-status-label">Status:</span> <span class="batch-status-value complete">Complete</span></div>
                <div class="batch-status-row"><span class="batch-status-label">Analyzed:</span> <span class="batch-status-value">${event.analyzed}</span></div>`;
            } else if (event.type === 'error') {
              appendBatchLog(`❌ Analysis error: ${event.error}`, 'error');
            }
          } catch (e) {}
        }
      }
    }

    await loadData();
  } catch (err) {
    appendBatchLog(`❌ Batch analysis error: ${err.message}`, 'error');
    statusEl.innerHTML = `<div class="batch-status-row"><span class="batch-status-label">Status:</span> <span class="batch-status-value failed">Error</span></div>`;
  } finally {
    btn.disabled = false;
    btn.textContent = 'Analyze All Websites';
  }
}

async function startBatchReanalysis() {
  const btn = document.getElementById('btnBatchReanalyze');
  const statusEl = document.getElementById('batchAnalyzeStatus');
  const CUTOFF = '2026-06-11T00:00:00.000Z';

  btn.disabled = true;
  btn.textContent = '⏳ Counting...';

  try {
    // Count leads analyzed before the cutoff via a quick client-side check
    // We use the server endpoint with the reanalyzeBefore param
    const msg = `Re-analyze all leads that were analyzed before June 11 (old method)?\n\nThis will re-run the website analysis with the new method.\nLeads analyzed after June 11 will not be touched.`;
    if (!confirm(msg)) return;

    btn.textContent = '⏳ Re-analyzing...';
    appendBatchLog('Starting re-analysis of leads analyzed before June 11...', 'info');
    statusEl.innerHTML = `<div class="batch-status-row"><span class="batch-status-label">Status:</span> <span class="batch-status-value running">Running (re-analysis)</span></div>`;

    const response = await fetch('/api/scraper/analyze-websites', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reanalyzeBefore: CUTOFF })
    });

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let analyzed = 0;
    let total = 0;

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
            if (event.type === 'start') {
              total = event.total;
              appendBatchLog(`Found ${total} leads to re-analyze.`, 'info');
            } else if (event.type === 'progress') {
              const pct = Math.round((event.current / total) * 100);
              statusEl.innerHTML = `<div class="batch-status-row"><span class="batch-status-label">Status:</span> <span class="batch-status-value running">Re-analyzing (${pct}%)</span></div>
                <div class="batch-status-row"><span class="batch-status-label">Progress:</span> <span class="batch-status-value">${event.current}/${total}</span></div>
                <div class="batch-status-row"><span class="batch-status-label">Current:</span> <span class="batch-status-value">${event.businessName || ''}</span></div>`;
            } else if (event.type === 'result') {
              analyzed++;
              if (analyzed % 10 === 0 || analyzed === total) {
                appendBatchLog(`Re-analyzed ${analyzed}/${total} — ${event.businessName}: ${event.quality} (${event.score}/100)`, 'info');
              }
            } else if (event.type === 'done') {
              appendBatchLog(`✅ Re-analysis complete: ${event.analyzed} websites re-analyzed`, 'success');
              statusEl.innerHTML = `<div class="batch-status-row"><span class="batch-status-label">Status:</span> <span class="batch-status-value complete">Re-analysis complete</span></div>
                <div class="batch-status-row"><span class="batch-status-label">Re-analyzed:</span> <span class="batch-status-value">${event.analyzed}</span></div>`;
            } else if (event.type === 'error') {
              appendBatchLog(`❌ Re-analysis error: ${event.error}`, 'error');
            }
          } catch (e) {}
        }
      }
    }

    await loadData();
  } catch (err) {
    appendBatchLog(`❌ Re-analysis error: ${err.message}`, 'error');
    statusEl.innerHTML = `<div class="batch-status-row"><span class="batch-status-label">Status:</span> <span class="batch-status-value failed">Error</span></div>`;
  } finally {
    btn.disabled = false;
    btn.textContent = 'Re-analyze (old method)';
  }
}

async function startBatchPreviews(skipDeploy = false) {
  const btn = skipDeploy ? document.getElementById('btnBatchPreviews') : document.getElementById('btnBatchPreviewsBuildDeploy');
  const category = document.getElementById('batchPreviewCategory')?.value || '';
  const limit = parseInt(document.getElementById('batchPreviewLimit')?.value) || 50;

  btn.disabled = true;
  btn.textContent = '⏳ Running...';

  const mode = skipDeploy ? 'build only' : 'build + deploy';
  appendBatchLog(`Starting batch preview generation (${category || 'all categories'}, limit: ${limit}, ${mode})...`, 'info');

  try {
    const response = await fetch('/api/batch/generate-previews', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ category: category || undefined, limit, skipDeploy })
    });

    if (!response.ok && !response.headers.get('content-type')?.includes('text/event-stream')) {
      const err = await response.json().catch(() => ({ error: response.statusText }));
      throw new Error(err.error || 'Failed to start');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop();

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const data = JSON.parse(line.slice(6));
            if (data.status === 'deploy_complete') {
              appendBatchLog(`✅ Deploy complete: ${data.completed} previews deployed`, 'success');
            } else if (data.status === 'deploy_failed') {
              appendBatchLog(`❌ Deploy failed: ${data.message}`, 'error');
            } else if (data.status === 'complete' || data.status === 'built') {
              appendBatchLog(`✓ ${data.message || 'Built'} (${data.completed}/${data.total})`, 'success');
            } else if (data.status === 'failed') {
              appendBatchLog(`✗ ${data.message || 'Failed'}`, 'error');
            } else if (data.status === 'skipped') {
              appendBatchLog(`⏭ Skipped (${data.completed}/${data.total})`, 'info');
            } else if (data.message) {
              appendBatchLog(data.message, 'info');
            }
          } catch (e) {}
        }
      }
    }

    await refreshBatchPreviewStatus();
  } catch (err) {
    appendBatchLog(`❌ Error: ${err.message}`, 'error');
  } finally {
    btn.disabled = false;
    btn.textContent = skipDeploy ? 'Build Only' : 'Build + Deploy';
    await refreshBatchPreviewStatus();
  }
}

async function resumeBatchPreviews() {
  const btn = document.getElementById('btnBatchPreviewsResume');
  btn.disabled = true;
  appendBatchLog('Resuming batch preview generation...', 'info');

  try {
    const response = await fetch('/api/batch/generate-previews', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ resume: true })
    });

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop();
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const data = JSON.parse(line.slice(6));
            if (data.message) appendBatchLog(data.message, data.status === 'failed' ? 'error' : 'info');
          } catch (e) {}
        }
      }
    }

    await refreshBatchPreviewStatus();
  } catch (err) {
    appendBatchLog(`❌ Resume error: ${err.message}`, 'error');
  } finally {
    btn.disabled = false;
  }
}

async function startBatchEmails() {
  const btn = document.getElementById('btnBatchEmails');
  const btnStop = document.getElementById('btnBatchEmailsStop');
  btn.disabled = true;
  btn.textContent = '⏳ Running...';
  btnStop.disabled = false;

  appendBatchLog('Starting batch email send...', 'info');

  try {
    const result = await API.post('/api/batch/send-emails', { emailType: 'auto' });
    if (result.status === 'complete' && result.count === 0) {
      appendBatchLog('No eligible leads to email.', 'info');
    } else {
      appendBatchLog(`Queued ${result.totalQueued} emails. Sending in background...`, 'success');
      // Start polling for status
      startEmailPolling();
    }
  } catch (err) {
    appendBatchLog(`❌ Error: ${err.message}`, 'error');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Start Batch Send';
  }
}

async function resumeBatchEmails() {
  const btn = document.getElementById('btnBatchEmailsResume');
  const btnStop = document.getElementById('btnBatchEmailsStop');
  btn.disabled = true;
  btnStop.disabled = false;

  appendBatchLog('Resuming batch email send...', 'info');

  try {
    const result = await API.post('/api/batch/send-emails', { resume: true });
    appendBatchLog(`Resumed. Status: ${result.status}`, 'success');
    startEmailPolling();
  } catch (err) {
    appendBatchLog(`❌ Resume error: ${err.message}`, 'error');
  } finally {
    btn.disabled = false;
  }
}

async function stopBatchEmails() {
  const btnStop = document.getElementById('btnBatchEmailsStop');
  btnStop.disabled = true;
  appendBatchLog('Stopping batch send (finishing current email)...', 'info');

  try {
    const result = await API.post('/api/batch/send-stop', {});
    appendBatchLog(`Stopped. Completed: ${result.completed}, Failed: ${result.failed}`, 'info');
    stopEmailPolling();
    await refreshBatchEmailStatus();
  } catch (err) {
    appendBatchLog(`❌ Stop error: ${err.message}`, 'error');
  }
}

function startEmailPolling() {
  stopEmailPolling();
  batchEmailPolling = setInterval(async () => {
    try {
      const data = await API.get('/api/batch/send-status');
      await refreshBatchEmailStatus();

      if (data.status === 'complete' || data.status === 'idle') {
        appendBatchLog(`✅ Batch send complete. Sent: ${data.completed}, Failed: ${data.failed}`, 'success');
        stopEmailPolling();
      }
    } catch (e) {}
  }, 5000);
}

function stopEmailPolling() {
  if (batchEmailPolling) {
    clearInterval(batchEmailPolling);
    batchEmailPolling = null;
  }
}

// ============================================================
// SCRAPE LOG TAB
// ============================================================

async function renderScrapeLogTab() {
  const container = document.getElementById('scrapeLogMatrix');
  const empty = document.getElementById('emptyScrapeLog');

  try {
    const data = await API.get('/api/leads/scrape-matrix');
    const { matrix, cities, categories } = data;

    if (categories.length === 0) {
      container.innerHTML = '';
      empty.classList.remove('hidden');
      return;
    }
    empty.classList.add('hidden');

    // Compute row totals for sorting
    const rowTotals = {};
    for (const cat of categories) {
      let total = 0;
      for (const city of cities) {
        const cell = matrix[`${cat}::${city}`];
        if (cell) total += cell.count;
      }
      rowTotals[cat] = total;
    }

    // Sort categories
    let sortedCategories = [...categories];
    if (scrapeLogSortOrder === 'asc') {
      sortedCategories.sort((a, b) => rowTotals[a] - rowTotals[b]);
    } else if (scrapeLogSortOrder === 'desc') {
      sortedCategories.sort((a, b) => rowTotals[b] - rowTotals[a]);
    }
    // else: keep alphabetical (default from server)

    const sortIndicator = scrapeLogSortOrder === 'asc' ? ' ▲' : scrapeLogSortOrder === 'desc' ? ' ▼' : ' ⇅';

    // Build matrix table
    let html = '<table class="scrape-matrix"><thead><tr><th>Category</th>';
    for (const city of cities) {
      html += `<th class="matrix-city">${esc(city)}</th>`;
    }
    html += `<th style="cursor:pointer" onclick="toggleScrapeLogSort()" title="Click to sort">Total${sortIndicator}</th></tr></thead><tbody>`;

    for (const cat of sortedCategories) {
      const total = rowTotals[cat];
      html += `<tr><td class="matrix-cat">${esc(cat)}</td>`;
      for (const city of cities) {
        const key = `${cat}::${city}`;
        const cell = matrix[key];
        if (cell) {
          html += `<td class="matrix-cell matrix-cell--has" title="${esc(cat)} in ${esc(city)}: ${cell.count} leads (${cell.lastDate || '?'})">${cell.count}</td>`;
        } else {
          html += `<td class="matrix-cell matrix-cell--empty">—</td>`;
        }
      }
      html += `<td class="matrix-total">${total}</td></tr>`;
    }

    html += '</tbody></table>';
    container.innerHTML = html;
  } catch (err) {
    container.innerHTML = '';
    empty.classList.remove('hidden');
  }
}

function toggleScrapeLogSort() {
  if (scrapeLogSortOrder === null) scrapeLogSortOrder = 'desc';
  else if (scrapeLogSortOrder === 'desc') scrapeLogSortOrder = 'asc';
  else scrapeLogSortOrder = null;
  renderScrapeLogTab();
}

// ============================================================
// EVENT LISTENERS
// ============================================================

function setupEventListeners() {
  // Category filter
  document.getElementById('categoryFilter').addEventListener('change', (e) => {
    currentCategoryFilter = e.target.value;
    currentPage = 1;
    loadData();
  });

  // No-website filter
  document.getElementById('filterNoWebsite').addEventListener('change', () => {
    currentPage = 1;
    loadData();
  });

  // Has-email filter
  document.getElementById('filterHasEmail').addEventListener('change', () => {
    currentPage = 1;
    loadData();
  });

  // Has-preview filter
  document.getElementById('filterHasPreview').addEventListener('change', () => {
    currentPage = 1;
    loadData();
  });

  // Preview-ready filter (has preview, not yet reached out)
  document.getElementById('filterPreviewReady').addEventListener('change', () => {
    currentPage = 1;
    loadData();
  });

  // Poor & Discovered filter
  document.getElementById('filterPoorDiscovered').addEventListener('change', () => {
    currentPage = 1;
    loadData();
  });

  // Search field (debounced)
  let searchTimer = null;
  document.getElementById('searchLeads').addEventListener('input', () => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
      currentPage = 1;
      loadData();
    }, 300);
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
  document.getElementById('btnPreviewSelected').addEventListener('click', generatePreviewsForSelected);
  document.getElementById('btnEmailSelected').addEventListener('click', emailSelectedLeads);
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
  document.getElementById('btnSaveBrevo').addEventListener('click', saveBrevoSettings);

  // Templates form
  document.getElementById('formSettingsTemplates').addEventListener('submit', async (e) => {
    e.preventDefault();
    await saveTemplates();
  });

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

  // Batch operations
  document.getElementById('btnBatchAnalyze').addEventListener('click', startBatchAnalysis);
  document.getElementById('btnBatchReanalyze').addEventListener('click', startBatchReanalysis);
  document.getElementById('btnBatchPreviews').addEventListener('click', () => startBatchPreviews(true));
  document.getElementById('btnBatchPreviewsBuildDeploy').addEventListener('click', () => startBatchPreviews(false));
  document.getElementById('btnBatchPreviewsResume').addEventListener('click', resumeBatchPreviews);
  document.getElementById('batchPreviewCategory').addEventListener('change', refreshBatchPreviewStatus);
  document.getElementById('batchPreviewLimit').addEventListener('input', refreshBatchPreviewStatus);
  document.getElementById('btnBatchEmails').addEventListener('click', startBatchEmails);
  document.getElementById('btnBatchEmailsResume').addEventListener('click', resumeBatchEmails);
  document.getElementById('btnBatchEmailsStop').addEventListener('click', stopBatchEmails);

  // Deploy previews
  document.getElementById('btnDeployPreviews').addEventListener('click', deployPreviews);
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
    const typeLabels = { email1: 'Email 1 — Cold Outreach', email2: 'Email 2 — Follow-Up' };
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
  // Fetch full lead details (includes activityLog, websiteIssues, etc.)
  API.get(`/api/leads/${leadId}`).then(({ lead }) => {
    renderActivityModal(lead);
  }).catch(err => {
    showError(err.message);
  });
}

function renderActivityModal(lead) {
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
// BATCH PREVIEW GENERATION (selected leads)
// ============================================================

async function generatePreviewsForSelected() {
  const selectedIds = getSelectedLeadIds();
  if (selectedIds.length === 0) {
    showError('No leads selected.');
    return;
  }

  if (!confirm(`Generate previews for ${selectedIds.length} selected lead(s)? This may take a while.`)) {
    return;
  }

  const bar = document.getElementById('enrichmentBar');
  const text = document.getElementById('enrichmentText');
  const fill = document.getElementById('enrichmentFill');
  const count = document.getElementById('enrichmentCount');
  bar.classList.remove('hidden');
  text.textContent = 'Starting batch preview generation...';
  fill.style.width = '0%';
  count.textContent = '';

  const btn = document.getElementById('btnPreviewSelected');
  btn.disabled = true;
  btn.textContent = '⏳ Generating...';

  try {
    const response = await fetch('/api/batch/generate-previews', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ leadIds: selectedIds })
    });

    if (!response.ok && !response.headers.get('content-type')?.includes('text/event-stream')) {
      const err = await response.json().catch(() => ({ error: response.statusText }));
      throw new Error(err.error || 'Generation failed');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let completed = 0;
    let failed = 0;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop();

      let currentEventType = 'progress';
      for (const line of lines) {
        if (line.startsWith('event: ')) {
          currentEventType = line.slice(7).trim();
        } else if (line.startsWith('data: ')) {
          try {
            const data = JSON.parse(line.slice(6));

            if (data.status === 'deploy_complete') {
              bar.classList.add('hidden');
              showToast('success', `Previews deployed: ${completed} built, ${failed} failed.`);
              await loadData();
            } else if (data.status === 'deploy_failed') {
              bar.classList.add('hidden');
              showError(`Deploy fehlgeschlagen: ${data.message}`);
            } else if (data.status === 'complete' || data.status === 'built') {
              completed++;
              const pct = Math.round((completed / selectedIds.length) * 100);
              fill.style.width = `${pct}%`;
              count.textContent = `${completed}/${selectedIds.length} built`;
              text.textContent = data.message || 'Built';
            } else if (data.status === 'failed') {
              failed++;
              count.textContent = `${completed}/${selectedIds.length} built, ${failed} failed`;
              text.textContent = data.message || 'Failed';
            } else if (data.status === 'skipped') {
              completed++;
              const pct = Math.round((completed / selectedIds.length) * 100);
              fill.style.width = `${pct}%`;
              count.textContent = `${completed}/${selectedIds.length} (incl. skipped)`;
            } else if (currentEventType === 'error') {
              throw new Error(data.message || 'Generation failed');
            } else {
              // General progress
              text.textContent = data.message || 'Processing...';
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
    if (completed > 0 || failed > 0) {
      showToast('success', `Done: ${completed} previews built, ${failed} failed.`);
    }
    await loadData();
  } catch (err) {
    bar.classList.add('hidden');
    showError(`Preview generation error: ${err.message}`);
  } finally {
    btn.disabled = false;
    btn.textContent = 'Preview Selected';
    btn.classList.add('hidden');
  }
}

// ============================================================
// EMAIL SELECTED LEADS
// ============================================================

async function emailSelectedLeads() {
  const selectedIds = getSelectedLeadIds();
  if (selectedIds.length === 0) {
    showError('No leads selected.');
    return;
  }

  // Filter to only leads with email
  const eligible = allLeads.filter(l => selectedIds.includes(l.id) && l.email && l.status === 'Discovered');
  const noEmail = selectedIds.length - eligible.length;

  if (eligible.length === 0) {
    showError('None of the selected leads have an email address or are in "Discovered" status.');
    return;
  }

  // Check personal quota
  let quota;
  try {
    quota = await API.get('/api/email/quota');
  } catch (e) {
    quota = { count: 0, remaining: 20, maxPerDay: 20 };
  }

  if (quota.remaining === 0) {
    showError(`Daily personal email limit reached (${quota.count}/${quota.maxPerDay}). Try again tomorrow or use Batch Send.`);
    return;
  }

  const willSend = Math.min(eligible.length, quota.remaining);
  const willSkipQuota = eligible.length - willSend;

  let msg = `Send Email 1 to ${willSend} lead(s)?`;
  if (noEmail > 0) msg += `\n${noEmail} skipped (no email or wrong status)`;
  if (willSkipQuota > 0) msg += `\n${willSkipQuota} won't be sent (daily limit: ${quota.maxPerDay})`;
  msg += `\n\nPersonal quota: ${quota.count}/${quota.maxPerDay} used today`;

  if (!confirm(msg)) return;

  const btn = document.getElementById('btnEmailSelected');
  btn.disabled = true;
  btn.textContent = '⏳ Sending...';

  let sent = 0;
  let failed = 0;
  let lastError = '';

  for (let i = 0; i < willSend; i++) {
    const lead = eligible[i];
    try {
      await API.post('/api/email/send', { leadId: lead.id, emailType: 'email1' });
      sent++;
    } catch (err) {
      failed++;
      lastError = err.message || 'Unknown error';
      if (err.message && err.message.includes('limit reached')) break;
      // On network/connection errors, stop immediately and warn
      if (err.message && (err.message.includes('ECONNREFUSED') || err.message.includes('ETIMEDOUT') || err.message.includes('ENOTFOUND') || err.message.includes('getaddrinfo') || err.message.includes('network') || err.message.includes('authentication failed'))) {
        showError(`❌ Sending stopped after ${sent} sent, ${failed} failed.\n\nError: ${lastError}\n\nTip: Check your network/VPN connection and SMTP credentials.`);
        break;
      }
    }
  }

  btn.disabled = false;
  btn.textContent = 'Email Selected';
  btn.classList.add('hidden');

  if (failed > 0 && sent === 0) {
    showError(`❌ All emails failed. Error: ${lastError}\n\nCheck: VPN disconnected? SMTP credentials correct?`);
  } else if (failed > 0) {
    showToast('warning', `Sent: ${sent}, Failed: ${failed}. Last error: ${lastError}`);
  } else {
    showToast('success', `Sent: ${sent} emails successfully.`);
  }
  await loadData();
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
  const btnPreviewSelected = document.getElementById('btnPreviewSelected');
  const btnEmailSelected = document.getElementById('btnEmailSelected');
  if (btnAnalyzeSelected) {
    if (selectedIds.length > 0) {
      btnAnalyzeSelected.classList.remove('hidden');
      btnAnalyzeSelected.textContent = `Analyze Selected (${selectedIds.length})`;
    } else {
      btnAnalyzeSelected.classList.add('hidden');
    }
  }
  if (btnPreviewSelected) {
    if (selectedIds.length > 0) {
      btnPreviewSelected.classList.remove('hidden');
      btnPreviewSelected.textContent = `Preview Selected (${selectedIds.length})`;
    } else {
      btnPreviewSelected.classList.add('hidden');
    }
  }
  if (btnEmailSelected) {
    if (selectedIds.length > 0) {
      btnEmailSelected.classList.remove('hidden');
      btnEmailSelected.textContent = `Email Selected (${selectedIds.length})`;
    } else {
      btnEmailSelected.classList.add('hidden');
    }
  }
}

async function analyzeWebsites(selectedOnly = false) {
  const citySelect = document.getElementById('scraperCityFilter').value;
  const catFilter = document.getElementById('categoryFilter').value;

  let leadsToAnalyze;
  let sendAllToServer = false;

  if (selectedOnly) {
    // Analyze only selected leads (allows re-analysis)
    const selectedIds = getSelectedLeadIds();
    leadsToAnalyze = allLeads.filter(l => selectedIds.includes(l.id) && l.websiteUrl);
    if (leadsToAnalyze.length === 0) {
      showError('No selected leads with websites to analyze.');
      return;
    }
  } else {
    // Bulk analyze: let the server find all unanalyzed leads (not limited to current page)
    sendAllToServer = true;
  }

  if (sendAllToServer) {
    // Fetch pre-flight stats from server
    try {
      const stats = await API.get('/api/scraper/analyze-stats');
      if (stats.toAnalyze === 0) {
        showError('No unanalyzed leads with websites found.');
        return;
      }
      const msg = [
        `Website-Analyse starten?`,
        ``,
        `• Zu analysieren: ${stats.toAnalyze.toLocaleString()} Leads`,
        `• Bereits analysiert: ${stats.alreadyAnalyzed.toLocaleString()} (werden übersprungen)`,
        `• Ohne Website: ${stats.noWebsite.toLocaleString()} (werden übersprungen)`,
        ``,
        `Geschätzte Dauer: ${stats.estimate.formatted}`,
        `(4 parallele Workers, ~1.5s pro Lead)`,
        ``,
        `Fortfahren?`
      ].join('\n');
      if (!confirm(msg)) return;
    } catch (err) {
      showError(err.message);
      return;
    }
  } else {
    const reAnalyzeCount = leadsToAnalyze.filter(l => l.websiteAnalyzedAt).length;
    const freshCount = leadsToAnalyze.length - reAnalyzeCount;
    const desc = reAnalyzeCount > 0
      ? `${leadsToAnalyze.length} websites (${freshCount} new, ${reAnalyzeCount} re-analysis)`
      : `${leadsToAnalyze.length} websites`;
    if (!confirm(`Analyze ${desc}? This runs in the background.`)) {
      return;
    }
  }

  // Reuse the enrichment progress bar
  const bar = document.getElementById('enrichmentBar');
  const text = document.getElementById('enrichmentText');
  const fill = document.getElementById('enrichmentFill');
  const count = document.getElementById('enrichmentCount');
  bar.classList.remove('hidden');
  text.textContent = 'Starting website analysis...';
  fill.style.width = '0%';
  count.textContent = '';

  const btn = document.getElementById('btnAnalyzeWebsites');
  btn.disabled = true;
  btn.textContent = '⏳ Analyzing...';

  try {
    const requestBody = sendAllToServer
      ? {}
      : { leadIds: leadsToAnalyze.map(l => l.id) };

    const response = await fetch('/api/scraper/analyze-websites', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody)
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
              count.textContent = `${event.current || analyzedCount}/${event.total || '?'} (${event.quality}: ${event.score}/100)`;
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
    document.getElementById('smtpMaxPerDay').value = settings.smtp?.maxPersonalEmailsPerDay || 20;
    // Brevo fields
    document.getElementById('brevoHost').value = settings.smtp?.brevo?.host || 'smtp-relay.brevo.com';
    document.getElementById('brevoPort').value = settings.smtp?.brevo?.port || 587;
    document.getElementById('brevoUsername').value = settings.smtp?.brevo?.username || '';
    document.getElementById('brevoPassword').value = settings.smtp?.brevo?.password || '';
    document.getElementById('brevoFrom').value = settings.smtp?.brevo?.fromAddress || '';
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
        host: document.getElementById('smtpHost').value.trim(),
        port: parseInt(document.getElementById('smtpPort').value) || 587,
        username: document.getElementById('smtpUsername').value.trim(),
        password: document.getElementById('smtpPassword').value.trim(),
        fromAddress: document.getElementById('smtpFrom').value.trim(),
        useProxy: document.getElementById('smtpUseProxy').checked,
        maxPersonalEmailsPerDay: parseInt(document.getElementById('smtpMaxPerDay').value) || 20
      }
    });
    alert('SMTP settings saved.');
  } catch (err) {
    showError(err.message);
  }
}

async function saveBrevoSettings() {
  try {
    await API.put('/api/settings', {
      smtp: {
        brevo: {
          host: document.getElementById('brevoHost').value,
          port: parseInt(document.getElementById('brevoPort').value) || 587,
          username: document.getElementById('brevoUsername').value,
          password: document.getElementById('brevoPassword').value,
          fromAddress: document.getElementById('brevoFrom').value
        }
      }
    });
    alert('Brevo SMTP settings saved.');
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
// EMAIL TEMPLATES
// ============================================================

async function loadTemplatesForm() {
  try {
    const { settings } = await API.get('/api/settings');
    const tpl = settings.templates || {};
    document.getElementById('tplE1Subject').value = tpl.email1?.subject || '';
    document.getElementById('tplE1Body').value = tpl.email1?.body || '';
    document.getElementById('tplE2Subject').value = tpl.email2?.subject || '';
    document.getElementById('tplE2Body').value = tpl.email2?.body || '';
  } catch (err) {
    showError(err.message);
  }
}

async function saveTemplates() {
  try {
    await API.put('/api/settings', {
      templates: {
        email1: {
          subject: document.getElementById('tplE1Subject').value,
          body: document.getElementById('tplE1Body').value
        },
        email2: {
          subject: document.getElementById('tplE2Subject').value,
          body: document.getElementById('tplE2Body').value
        }
      }
    });
    showToast('success', 'Email templates saved.');
  } catch (err) {
    showError(err.message);
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
      <div class="category-card-meta">Search term: ${esc(c.searchTerm)}</div>
    </div>
  `).join('') || '<p style="padding:20px;color:#999">No categories found.</p>';
}

function editCategory(id) {
  const cat = allCategories.find(c => c.id === id);
  if (!cat) return;
  document.getElementById('catEditId').value = cat.id;
  document.getElementById('catName').value = cat.name;
  document.getElementById('catSearchTerm').value = cat.searchTerm;
  document.getElementById('modalCategoryTitle').textContent = 'Edit Category';
  openModal('modalCategory');
}

async function saveCategory() {
  const id = document.getElementById('catEditId').value;
  const data = {
    name: document.getElementById('catName').value,
    searchTerm: document.getElementById('catSearchTerm').value
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
