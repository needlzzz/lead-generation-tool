const crypto = require('crypto');

/**
 * Replace German umlauts and ß with their ASCII equivalents.
 */
function replaceUmlauts(str) {
  return str
    .replace(/ä/g, 'ae')
    .replace(/ö/g, 'oe')
    .replace(/ü/g, 'ue')
    .replace(/ß/g, 'ss')
    .replace(/Ä/g, 'ae')
    .replace(/Ö/g, 'oe')
    .replace(/Ü/g, 'ue');
}

/**
 * Slugify a string: lowercase, replace umlauts, remove non-alphanumeric
 * (except hyphens), collapse consecutive hyphens, trim leading/trailing hyphens.
 */
function slugify(str) {
  let slug = str.toLowerCase();
  slug = replaceUmlauts(slug);
  // Remove non-alphanumeric except hyphens
  slug = slug.replace(/[^a-z0-9-]/g, '-');
  // Collapse consecutive hyphens
  slug = slug.replace(/-+/g, '-');
  // Trim leading/trailing hyphens
  slug = slug.replace(/^-|-$/g, '');
  return slug;
}

/**
 * Generate a URL-safe slug in format: {8-char-uuid-prefix}-{business-name-slugified}-{city-slugified}
 * Truncated to max 80 characters. Supports uniqueness retry up to 3 attempts.
 *
 * @param {string} businessName - The business name to include in the slug
 * @param {string} city - The city to append for disambiguation
 * @param {Function|Array|null} existingSlugs - A function returning existing slugs (or an array of slugs) for collision detection
 * @returns {string} The generated slug
 * @throws {Error} If slug collision persists after 3 attempts
 */
function generateSlug(businessName, city, existingSlugs) {
  const maxAttempts = 3;

  // Normalize existingSlugs to a lookup function
  let checkExists;
  if (typeof existingSlugs === 'function') {
    checkExists = existingSlugs;
  } else if (Array.isArray(existingSlugs)) {
    checkExists = () => existingSlugs;
  } else {
    checkExists = () => [];
  }

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    // 1. Generate 8-char UUID prefix
    const prefix = crypto.randomUUID().slice(0, 8);

    // 2. Slugify business name
    const nameSlug = slugify(businessName);

    // 3. Slugify city
    const citySlug = slugify(city);

    // 4. Combine: {prefix}-{name}-{city} (skip empty parts)
    const parts = [prefix, nameSlug, citySlug].filter(p => p.length > 0);
    let result = parts.join('-');

    // 5. Truncate to 80 characters
    if (result.length > 80) {
      result = result.slice(0, 80);
      // Remove trailing hyphen if truncated
      result = result.replace(/-$/, '');
    }

    // 6. Check uniqueness
    const existing = checkExists();
    if (!existing.includes(result)) {
      return result;
    }
  }

  throw new Error('Slug-Kollision nach 3 Versuchen');
}

/**
 * Compute a short hash of lead data for change detection.
 * Uses businessName, category, and city to detect when a lead's
 * core data has changed (triggering preview regeneration).
 *
 * @param {object} lead - Lead object with businessName, category, city
 * @returns {string} 16-char hex hash
 */
function computeLeadDataHash(lead) {
  const data = `${lead.businessName}|${lead.category}|${lead.city || ''}`;
  return crypto.createHash('sha256').update(data).digest('hex').slice(0, 16);
}

module.exports = {
  generateSlug,
  computeLeadDataHash,
  slugify,
  replaceUmlauts
};
