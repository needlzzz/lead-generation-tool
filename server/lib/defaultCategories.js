const { v4: uuidv4 } = require('uuid');

/**
 * CrashCode co-branding campaign for driving schools.
 *
 * Unlike the website-sales campaign, this pitch has nothing to do with the
 * lead's website — it offers the school a free, co-brandable accident-help app
 * (CrashCode) for their students. It therefore uses only the identity/CTA
 * placeholders ([Business Name], [Dein Name], [CALENDLY-LINK]) and no website
 * or preview placeholders.
 *
 * Attached to the "Fahrschule" and "Fahrlehrer" categories so those leads run
 * this campaign automatically while every other category keeps the default
 * website pitch.
 */
const CRASHCODE_FAHRSCHULE_TEMPLATES = {
  email1: {
    subject: 'Eine Unfall-App für eure Fahrschüler:innen – mit [Business Name] drauf',
    body: `Sali [Business Name],

kurze Idee, die perfekt zu einer Fahrschule passt.

Ich habe CrashCode entwickelt – eine kostenlose App, die bei einem Autounfall hilft. Statt im Stress Papierformulare auszufüllen, tauschen beide Beteiligten ihre Fahrzeug- und Versicherungsdaten in Sekunden per QR-Code aus. Alles bleibt auf dem Handy: kein Server, kein Datensammeln.

Genau euer Publikum: Fahranfänger:innen sind statistisch häufiger in Unfälle verwickelt – und meist überfordert, wenn es passiert. CrashCode nimmt ihnen genau diese Unsicherheit.

Das Beste für euch: Ihr könnt die App mit eurem Namen «co-branden». Eure Schüler:innen scannen einmalig euren QR-Code und sehen danach bei jedem Öffnen «Bereitgestellt von [Business Name]». So bleibt ihr präsent – lange nach der letzten Fahrstunde.

Für euch heisst das:
• Ein echtes Sicherheits-Geschenk für jede:n Schüler:in
• Ihr positioniert euch als moderne, verantwortungsvolle Fahrschule
• Kostenlos und ohne Aufwand – euren QR-Code erstellt ihr in 2 Minuten selbst, kein technisches Setup

Hat das Potenzial für euch? Ich zeige es euch gern in 10 Minuten:
👉 [CALENDLY-LINK]

Freundliche Grüsse
[Dein Name]
kaelint.ch`
  },
  email2: {
    subject: 'Re: Eine Unfall-App für eure Fahrschüler:innen',
    body: `Sali [Business Name],

kurzes Follow-up zu meiner Idee mit CrashCode – der Unfall-App, die ihr gratis und mit eurem Namen an eure Fahrschüler:innen weitergeben könnt.

Ich weiss, der Alltag als Fahrlehrer:in ist voll. Darum ganz unkompliziert: Wenn es euch interessiert, antwortet einfach kurz auf diese Mail – oder schnappt euch direkt einen Termin:
👉 [CALENDLY-LINK]

Kein Stress, nur falls es passt.

[Dein Name]`
  }
};

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
  // CrashCode co-branding campaign (not the website pitch) — see templates above.
  {
    id: uuidv4(),
    name: 'Fahrschule',
    searchTerm: 'Fahrschule',
    tone: 'casual',
    templates: CRASHCODE_FAHRSCHULE_TEMPLATES
  },
  {
    id: uuidv4(),
    name: 'Fahrlehrer',
    searchTerm: 'Fahrlehrer',
    tone: 'casual',
    templates: CRASHCODE_FAHRSCHULE_TEMPLATES
  },

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

module.exports = { DEFAULT_CATEGORIES, CRASHCODE_FAHRSCHULE_TEMPLATES };
