const { v4: uuidv4 } = require('uuid');

const DEFAULT_CATEGORIES = [
  // HANDWERK / BAU
  { id: uuidv4(), name: 'Maler / Gipser', searchTerm: 'Maler' },
  { id: uuidv4(), name: 'Elektriker', searchTerm: 'Elektriker' },
  { id: uuidv4(), name: 'Sanitär / Heizung', searchTerm: 'Sanitär Heizung' },
  { id: uuidv4(), name: 'Schreiner', searchTerm: 'Schreinerei' },
  { id: uuidv4(), name: 'Reinigungsfirma', searchTerm: 'Reinigungsfirma' },
  { id: uuidv4(), name: 'Umzugsfirma', searchTerm: 'Umzugsfirma' },
  { id: uuidv4(), name: 'Gartenbau', searchTerm: 'Gartenbau Landschaftspflege' },

  // DIENSTLEISTUNGEN
  { id: uuidv4(), name: 'Fahrschule', searchTerm: 'Fahrschule' },

  // BEAUTY / WELLNESS
  { id: uuidv4(), name: 'Kosmetikstudio', searchTerm: 'Kosmetikstudio' },
  { id: uuidv4(), name: 'Nagelstudio', searchTerm: 'Nagelstudio' },
  { id: uuidv4(), name: 'Coiffeur', searchTerm: 'Coiffeur Friseur' },
  { id: uuidv4(), name: 'Barbershop', searchTerm: 'Barbershop' },
  { id: uuidv4(), name: 'Tattoo Studio', searchTerm: 'Tattoo Studio' },

  // SPORT / FREIZEIT
  { id: uuidv4(), name: 'Yoga Studio', searchTerm: 'Yoga Studio' },
  { id: uuidv4(), name: 'Tanzschule', searchTerm: 'Tanzschule' },
  { id: uuidv4(), name: 'Musikschule', searchTerm: 'Musikschule' },
  { id: uuidv4(), name: 'Hundeschule', searchTerm: 'Hundeschule' },
  { id: uuidv4(), name: 'Fitnessstudio', searchTerm: 'Fitnessstudio' },
  { id: uuidv4(), name: 'Kampfsportschule', searchTerm: 'Kampfsport' },
  { id: uuidv4(), name: 'Reitschule', searchTerm: 'Reitschule' },

  // GASTRO
  { id: uuidv4(), name: 'Restaurant', searchTerm: 'Restaurant' },
  { id: uuidv4(), name: 'Café / Bar', searchTerm: 'Café Bar' },
  { id: uuidv4(), name: 'Bäckerei / Konditorei', searchTerm: 'Bäckerei Konditorei' },
  { id: uuidv4(), name: 'Catering', searchTerm: 'Catering' },
  { id: uuidv4(), name: 'Food Truck', searchTerm: 'Food Truck' },

  // GEWERBE
  { id: uuidv4(), name: 'Blumenladen', searchTerm: 'Blumenladen Florist' },
  { id: uuidv4(), name: 'Boutique / Mode', searchTerm: 'Boutique Mode' },
  { id: uuidv4(), name: 'Optiker', searchTerm: 'Optiker' },
  { id: uuidv4(), name: 'Buchhandlung', searchTerm: 'Buchhandlung' },
  { id: uuidv4(), name: 'Schmuck / Uhren', searchTerm: 'Schmuck Uhren' },

  // KREATIV
  { id: uuidv4(), name: 'Fotostudio', searchTerm: 'Fotostudio Fotograf' },
  { id: uuidv4(), name: 'Grafikdesign', searchTerm: 'Grafikdesign Agentur' },
  { id: uuidv4(), name: 'Videoproduktion', searchTerm: 'Videoproduktion' },

  // MEDIZIN / GESUNDHEIT
  { id: uuidv4(), name: 'Physiotherapie', searchTerm: 'Physiotherapie' },
  { id: uuidv4(), name: 'Zahnarzt', searchTerm: 'Zahnarzt' },
  { id: uuidv4(), name: 'Tierarzt', searchTerm: 'Tierarzt' },
  { id: uuidv4(), name: 'Heilpraktiker', searchTerm: 'Heilpraktiker Naturheilkunde' },
  { id: uuidv4(), name: 'Psychotherapie', searchTerm: 'Psychotherapie' },

  // RECHT / FINANZEN
  { id: uuidv4(), name: 'Anwaltskanzlei', searchTerm: 'Anwaltskanzlei' },
  { id: uuidv4(), name: 'Treuhand', searchTerm: 'Treuhand Buchhaltung' },
  { id: uuidv4(), name: 'Versicherungsberatung', searchTerm: 'Versicherungsberatung' },
  { id: uuidv4(), name: 'Immobilien', searchTerm: 'Immobilien Makler' },

  // INSTITUTIONELL
  { id: uuidv4(), name: 'Verein / Verband', searchTerm: 'Verein Verband' },
  { id: uuidv4(), name: 'Kindertagesstätte', searchTerm: 'Kita Kindertagesstätte' },
  { id: uuidv4(), name: 'Fahrradladen', searchTerm: 'Fahrradladen Velo' }
];

module.exports = { DEFAULT_CATEGORIES };
