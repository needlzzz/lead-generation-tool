/**
 * Config Generator Module
 *
 * Generates a valid kaelint-website-business config object from lead data.
 * Maps business category (niche) to theme, colors, features, services, etc.
 * Uses preset maps derived from the onboarding form's preset system.
 *
 * Requirements: 1.1–1.10, 10.1, 12.1
 */

// --- Preset Map (8 niches) ---

const PRESET_MAP = {
  coiffeur: {
    theme: 'warm-earth',
    primaryColor: '#8B6914',
    features: ['openingHours', 'gallery', 'priceList', 'contactForm', 'clickToCall'],
    tagline: 'Ihr Coiffeursalon in {city}',
    aboutText: 'Willkommen bei {businessName} — Ihrem Salon für Schnitt, Farbe und Styling in {city}.',
    services: [
      { name: 'Herrenschnitt', description: 'Klassischer oder moderner Schnitt inkl. Waschen und Styling' },
      { name: 'Damenschnitt', description: 'Schnitt, Waschen und Föhnen' },
      { name: 'Färben / Strähnchen', description: 'Professionelle Coloration oder Highlights' }
    ],
    galleryAlt: 'Salon Impression'
  },
  restaurant: {
    theme: 'editorial',
    primaryColor: '#B91C1C',
    features: ['openingHours', 'gallery', 'priceList', 'contactForm', 'googleMaps'],
    tagline: 'Ihr Restaurant in {city}',
    aboutText: 'Willkommen bei {businessName} — Ihrem Restaurant für kulinarische Genüsse in {city}.',
    services: [
      { name: 'Mittagsmenü', description: 'Täglich wechselndes Mittagsangebot' },
      { name: 'À-la-carte', description: 'Saisonale Gerichte aus frischen Zutaten' },
      { name: 'Catering', description: 'Professionelles Catering für Ihren Anlass' }
    ],
    galleryAlt: 'Restaurant Impression'
  },
  therapie: {
    theme: 'sage-wellness',
    primaryColor: '#4A7C59',
    features: ['openingHours', 'scheduling', 'contactForm', 'clickToCall'],
    tagline: 'Ihre Therapiepraxis in {city}',
    aboutText: 'Willkommen bei {businessName} — Ihrer Praxis für ganzheitliche Therapie und Wohlbefinden in {city}.',
    services: [
      { name: 'Erstberatung', description: 'Ausführliches Erstgespräch und Befundaufnahme' },
      { name: 'Therapiesitzung', description: 'Individuelle Behandlung nach Ihren Bedürfnissen' },
      { name: 'Nachsorge', description: 'Begleitende Nachbehandlung und Beratung' }
    ],
    galleryAlt: 'Praxis Impression'
  },
  handwerk: {
    theme: 'slate-professional',
    primaryColor: '#1E3A5F',
    features: ['gallery', 'contactForm', 'clickToCall', 'googleMaps'],
    tagline: 'Ihr Handwerksbetrieb in {city}',
    aboutText: 'Willkommen bei {businessName} — Ihrem zuverlässigen Handwerksbetrieb in {city}.',
    services: [
      { name: 'Beratung & Offerte', description: 'Kostenlose Erstberatung und unverbindliche Offerte' },
      { name: 'Ausführung', description: 'Fachgerechte Umsetzung Ihres Projekts' },
      { name: 'Reparaturservice', description: 'Schneller und zuverlässiger Reparaturservice' }
    ],
    galleryAlt: 'Projekt Impression'
  },
  einzelhandel: {
    theme: 'soft-gradient',
    primaryColor: '#6B21A8',
    features: ['openingHours', 'priceList', 'contactForm', 'googleMaps'],
    tagline: 'Ihr Fachgeschäft in {city}',
    aboutText: 'Willkommen bei {businessName} — Ihrem Fachgeschäft für Qualitätsprodukte in {city}.',
    services: [
      { name: 'Beratung', description: 'Persönliche Fachberatung für Ihre Bedürfnisse' },
      { name: 'Sortiment', description: 'Sorgfältig ausgewählte Produkte in Top-Qualität' },
      { name: 'Bestellung & Lieferung', description: 'Bestellung und Lieferung auf Wunsch' }
    ],
    galleryAlt: 'Geschäft Impression'
  },
  fitness: {
    theme: 'ocean-breeze',
    primaryColor: '#0369A1',
    features: ['openingHours', 'scheduling', 'priceList', 'contactForm'],
    tagline: 'Ihr Fitnessstudio in {city}',
    aboutText: 'Willkommen bei {businessName} — Ihrem Studio für Fitness und Gesundheit in {city}.',
    services: [
      { name: 'Probetraining', description: 'Kostenloses Probetraining mit persönlicher Betreuung' },
      { name: 'Personal Training', description: 'Individuelles Training mit erfahrenen Coaches' },
      { name: 'Gruppentraining', description: 'Motivierende Kurse in kleinen Gruppen' }
    ],
    galleryAlt: 'Studio Impression'
  },
  kreativ: {
    theme: 'neon-noir',
    primaryColor: '#E11D48',
    features: ['gallery', 'contactForm', 'clickToCall'],
    tagline: 'Ihr Kreativstudio in {city}',
    aboutText: 'Willkommen bei {businessName} — Ihrem Studio für kreative Projekte und Design in {city}.',
    services: [
      { name: 'Beratungsgespräch', description: 'Kreative Beratung für Ihr Projekt' },
      { name: 'Design & Umsetzung', description: 'Professionelle Gestaltung und Realisation' }
    ],
    galleryAlt: 'Portfolio Impression'
  },
  arztpraxis: {
    theme: 'nordic-frost',
    primaryColor: '#0F766E',
    features: ['openingHours', 'scheduling', 'contactForm', 'clickToCall'],
    tagline: 'Ihre Arztpraxis in {city}',
    aboutText: 'Willkommen bei {businessName} — Ihrer Praxis für kompetente medizinische Betreuung in {city}.',
    services: [
      { name: 'Sprechstunde', description: 'Allgemeine Sprechstunde und Vorsorgeuntersuchungen' },
      { name: 'Terminvereinbarung', description: 'Einfache Online-Terminbuchung' },
      { name: 'Notfallsprechstunde', description: 'Kurzfristige Termine bei akuten Beschwerden' }
    ],
    galleryAlt: 'Praxis Impression'
  }
};

// Fallback preset for unknown categories
const FALLBACK_PRESET = {
  theme: 'slate-professional',
  primaryColor: '#475569',
  features: ['contactForm', 'openingHours', 'clickToCall'],
  tagline: 'Willkommen bei {businessName} in {city}',
  aboutText: 'Willkommen bei {businessName} — Ihrem Partner in {city}. Kontaktieren Sie uns für weitere Informationen.',
  services: [
    { name: 'Beratung', description: 'Persönliche Beratung für Ihre Anliegen' },
    { name: 'Service', description: 'Zuverlässiger Service mit persönlicher Betreuung' }
  ],
  galleryAlt: 'Impression'
};

// --- Theme to Font mapping ---

const THEME_FONT_MAP = {
  'warm-earth': "'DM Serif Display', 'Georgia', serif",
  'editorial': "'Playfair Display', 'Georgia', serif",
  'sage-wellness': "'Lora', 'Georgia', serif",
  'slate-professional': "'IBM Plex Sans', 'Helvetica Neue', sans-serif",
  'soft-gradient': "'Poppins', 'Helvetica Neue', sans-serif",
  'ocean-breeze': "'Montserrat', 'Helvetica Neue', sans-serif",
  'neon-noir': "'Space Grotesk', 'Helvetica Neue', sans-serif",
  'nordic-frost': "'Inter', 'Helvetica Neue', sans-serif"
};

// --- Features that are NEVER enabled (require user-specific data) ---

const FORBIDDEN_FEATURES = ['testimonials', 'events', 'faq'];

// --- Features that are safe to enable (can be auto-generated or need no config) ---

const ALLOWED_FEATURES = [
  'contactForm', 'clickToCall', 'googleMaps', 'scheduling',
  'openingHours', 'gallery', 'priceList', 'services'
];

// --- Color Derivation (mirrors onboarding/js/color-derivation.js) ---

/**
 * Derive secondary and accent colors from a primary hex color.
 * Secondary = 15% primary + 85% white.
 * Accent = primary (same color).
 *
 * @param {string} primaryHex - 7-character hex color string (e.g., "#8B6914")
 * @returns {{ secondary: string, accent: string }}
 */
function deriveColors(primaryHex) {
  const r = parseInt(primaryHex.slice(1, 3), 16);
  const g = parseInt(primaryHex.slice(3, 5), 16);
  const b = parseInt(primaryHex.slice(5, 7), 16);

  // Secondary = 15% primary + 85% white
  const sr = Math.round(r * 0.15 + 255 * 0.85);
  const sg = Math.round(g * 0.15 + 255 * 0.85);
  const sb = Math.round(b * 0.15 + 255 * 0.85);

  const secondary = `#${sr.toString(16).padStart(2, '0')}${sg.toString(16).padStart(2, '0')}${sb.toString(16).padStart(2, '0')}`;
  const accent = primaryHex;

  return { secondary, accent };
}

// --- Helper functions ---

/**
 * Resolve a template string with {businessName} and {city} placeholders.
 */
function resolveTemplate(template, lead) {
  return template
    .replace(/\{businessName\}/g, lead.businessName || '')
    .replace(/\{city\}/g, lead.city || '');
}

/**
 * Build the features flag object from the enabled features list.
 * All features default to false, enabled ones set to true.
 */
function buildFeatureFlags(enabledFeatures) {
  const flags = {};
  for (const feature of enabledFeatures) {
    flags[feature] = true;
  }
  return flags;
}

/**
 * Build gallery config from niche.
 * Uses 3 images from the niche's assets directory.
 */
function buildGallery(niche, galleryAlt) {
  const nicheDir = niche || 'generic';
  return {
    images: [
      { path: `gallery/${nicheDir}-1.jpg`, alt: { de: galleryAlt } },
      { path: `gallery/${nicheDir}-2.jpg`, alt: { de: galleryAlt } },
      { path: `gallery/${nicheDir}-3.jpg`, alt: { de: galleryAlt } }
    ]
  };
}

/**
 * Build standard opening hours (Mon-Fri 09:00-18:00).
 */
function buildOpeningHours() {
  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
  return days.map(day => ({
    day,
    opens: '09:00',
    closes: '18:00'
  }));
}

// --- Main Config Generator ---

/**
 * Generate a full config object from lead data and a slug.
 *
 * Returns { success: true, config: {...} } on success.
 * Returns { success: false, error: '...' } on validation failure.
 *
 * NEVER throws — always returns a result object.
 *
 * @param {object} lead - Lead object with businessName, category, city, address, phone, email, contactPerson
 * @param {string} slug - The generated URL slug for the preview
 * @returns {{ success: boolean, config?: object, error?: string }}
 */
function generateConfig(lead, slug) {
  // --- Error handling for missing required fields (Req 10.1) ---
  if (!lead || !lead.businessName) {
    return { success: false, error: 'Firmenname fehlt' };
  }
  if (!lead.category) {
    return { success: false, error: 'Kategorie fehlt' };
  }

  // --- Resolve preset (Req 1.2, 1.3) ---
  const category = (lead.category || '').toLowerCase().trim();
  const preset = PRESET_MAP[category] || FALLBACK_PRESET;
  const nicheKey = PRESET_MAP[category] ? category : null;

  // --- Derive colors (Req 1.5) ---
  const { secondary, accent } = deriveColors(preset.primaryColor);

  // --- Resolve font family from theme (Req 1.5) ---
  const fontFamily = THEME_FONT_MAP[preset.theme] || THEME_FONT_MAP['slate-professional'];

  // --- Determine enabled features (Req 1.8, 1.9) ---
  let enabledFeatures = preset.features.filter(f =>
    ALLOWED_FEATURES.includes(f) && !FORBIDDEN_FEATURES.includes(f)
  );

  // Disable clickToCall if no phone (Req 1.4)
  if (!lead.phone) {
    enabledFeatures = enabledFeatures.filter(f => f !== 'clickToCall');
  }

  // --- Build config object (Req 1.1, 1.4, 1.6, 1.7, 1.10) ---
  const config = {
    businessName: lead.businessName,
    operatorName: lead.contactPerson || lead.businessName,
    contactEmail: lead.email || 'preview@kaelint.ch',
    phone: lead.phone || '+41 00 000 00 00',
    address: {
      street: lead.address || '',
      city: lead.city || '',
      postalCode: ''
    },
    siteUrl: `https://preview.kaelint.ch/${slug}/`,
    languages: ['de'],
    theme: preset.theme,
    primaryColor: preset.primaryColor,
    secondaryColor: secondary,
    accentColor: accent,
    fontFamily,
    logoPath: 'logo.svg',
    ctaTarget: '#contactForm',
    tagline: { de: resolveTemplate(preset.tagline, lead) },
    aboutText: { de: resolveTemplate(preset.aboutText, lead) },
    features: buildFeatureFlags(enabledFeatures),
    services: preset.services.map(s => ({
      name: { de: s.name },
      description: { de: s.description }
    }))
  };

  // --- Conditional feature data (Req 1.10) ---
  if (enabledFeatures.includes('openingHours')) {
    config.openingHours = buildOpeningHours();
  }

  if (enabledFeatures.includes('gallery')) {
    config.gallery = buildGallery(nicheKey, preset.galleryAlt || 'Impression');
  }

  return { success: true, config };
}

module.exports = {
  generateConfig,
  deriveColors,
  PRESET_MAP,
  FALLBACK_PRESET,
  THEME_FONT_MAP,
  ALLOWED_FEATURES,
  FORBIDDEN_FEATURES,
  buildFeatureFlags,
  buildGallery,
  buildOpeningHours,
  resolveTemplate
};
