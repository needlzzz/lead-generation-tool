const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');
const PREVIEWS_FILE = path.join(DATA_DIR, 'previews.json');

// 30 days in milliseconds
const EXPIRY_DURATION_MS = 30 * 24 * 60 * 60 * 1000;

// Valid status transitions
const VALID_TRANSITIONS = {
  pending: ['built', 'failed'],
  built: ['deployed', 'failed'],
  deployed: ['expired', 'failed'],
  expired: [],
  failed: []
};

/**
 * Ensure data directory exists
 */
function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

/**
 * Read all entries from the previews.json file.
 * Auto-creates the file with [] if it doesn't exist.
 */
function readEntries() {
  ensureDataDir();
  if (!fs.existsSync(PREVIEWS_FILE)) {
    writeEntriesAtomic([]);
    return [];
  }
  try {
    const raw = fs.readFileSync(PREVIEWS_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error('Error reading previews.json:', err.message);
    return [];
  }
}

/**
 * Atomic write: write to temp file then rename.
 * Prevents corruption on crash/interrupt.
 */
function writeEntriesAtomic(data) {
  ensureDataDir();
  const tmpPath = PREVIEWS_FILE + '.tmp.' + Date.now();
  fs.writeFileSync(tmpPath, JSON.stringify(data, null, 2), 'utf-8');
  fs.renameSync(tmpPath, PREVIEWS_FILE);
}

/**
 * Create a new preview entry with status "pending" and computed expiresAt.
 * @param {Object} data - { slug, leadId, niche, previewUrl, leadDataHash }
 * @returns {Object} The created preview entry
 */
function createPreview(data) {
  const entries = readEntries();

  const now = new Date();
  const expiresAt = new Date(now.getTime() + EXPIRY_DURATION_MS);

  const entry = {
    slug: data.slug,
    leadId: data.leadId,
    niche: data.niche || null,
    createdAt: now.toISOString(),
    expiresAt: expiresAt.toISOString(),
    status: 'pending',
    screenshotPath: data.screenshotPath || null,
    screenshotError: data.screenshotError || null,
    previewUrl: data.previewUrl || null,
    leadDataHash: data.leadDataHash || null
  };

  entries.push(entry);
  writeEntriesAtomic(entries);

  return entry;
}

/**
 * Update the status of a preview entry (by slug).
 * Validates that the transition is allowed.
 * @param {string} slug - The preview slug
 * @param {string} newStatus - The target status
 * @param {Object} [extras] - Additional fields to update (e.g., screenshotPath, screenshotError, previewUrl)
 * @returns {Object|null} The updated entry, or null if not found or invalid transition
 */
function updateStatus(slug, newStatus, extras = {}) {
  const entries = readEntries();
  const index = entries.findIndex(e => e.slug === slug);

  if (index === -1) {
    return null;
  }

  const entry = entries[index];
  const currentStatus = entry.status;

  // Validate transition
  const allowed = VALID_TRANSITIONS[currentStatus];
  if (!allowed || !allowed.includes(newStatus)) {
    // Special case: any status can transition to "failed"
    if (newStatus !== 'failed') {
      return null;
    }
  }

  // Update status and any extra fields
  entries[index] = {
    ...entry,
    status: newStatus,
    ...extras
  };

  writeEntriesAtomic(entries);
  return entries[index];
}

/**
 * Get a preview entry by leadId.
 * @param {string} leadId
 * @returns {Object|null} The preview entry or null
 */
function getByLeadId(leadId) {
  const entries = readEntries();
  return entries.find(e => e.leadId === leadId) || null;
}

/**
 * Get a preview entry by slug.
 * @param {string} slug
 * @returns {Object|null} The preview entry or null
 */
function getBySlug(slug) {
  const entries = readEntries();
  return entries.find(e => e.slug === slug) || null;
}

/**
 * Get all non-expired entries (status !== 'expired' and expiresAt is in the future).
 * @returns {Object[]} Active preview entries
 */
function getActiveEntries() {
  const entries = readEntries();
  const now = new Date();
  return entries.filter(e => {
    return e.status !== 'expired' && new Date(e.expiresAt) > now;
  });
}

/**
 * Mark a preview as expired.
 * @param {string} slug
 * @returns {Object|null} The updated entry or null if not found
 */
function markExpired(slug) {
  const entries = readEntries();
  const index = entries.findIndex(e => e.slug === slug);

  if (index === -1) {
    return null;
  }

  entries[index] = {
    ...entries[index],
    status: 'expired'
  };

  writeEntriesAtomic(entries);
  return entries[index];
}

/**
 * Get all entries (regardless of status or expiry).
 * @returns {Object[]} All preview entries
 */
function getAllEntries() {
  return readEntries();
}

module.exports = {
  createPreview,
  updateStatus,
  getByLeadId,
  getBySlug,
  getActiveEntries,
  markExpired,
  getAllEntries,
  EXPIRY_DURATION_MS,
  VALID_TRANSITIONS
};
