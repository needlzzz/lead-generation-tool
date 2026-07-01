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
    subject: 'Partnerschaft-Idee für [Business Name]: Lehrmittel + Unfall-App für eure Schüler:innen',
    body: `Sali [Business Name],

ich hätte eine Partnerschaft-Idee, die perfekt zu einer Fahrschule passt – und für euch komplett kostenlos ist.

Ich habe CrashCode entwickelt: eine App, die zeigt, was bei einem Autounfall Schritt für Schritt zu tun ist. Die Beteiligten tauschen ihre Fahrzeug- und Versicherungsdaten in Sekunden per QR-Code aus und werden durch ein vollständiges Unfallprotokoll geführt (nach dem Europäischen Unfallbericht). Alles bleibt auf dem Handy – kein Server, kein Datensammeln.

Für euch sehe ich zwei konkrete Vorteile:

1) Als Lehrmittel im Unterricht
«Was tue ich bei einem Unfall?» ist Prüfungsstoff – aber trocken zu erklären. Mit CrashCode üben eure Schüler:innen den Ablauf praktisch am eigenen Handy: Unfallstelle sichern, Daten austauschen, Protokoll ausfüllen, Fotos und Skizze erstellen. Gerade Fahranfänger:innen sind statistisch häufiger in Unfälle verwickelt und im Ernstfall überfordert – hier nehmt ihr ihnen die Unsicherheit.

2) Als Partnerschaft mit eurem Branding
Ihr könnt die App mit eurem Namen «co-branden». Eure Schüler:innen scannen einmalig euren QR-Code und sehen danach bei jedem Öffnen «Bereitgestellt von [Business Name]». So bleibt ihr auf dem Handy präsent – lange nach der letzten Fahrstunde, inklusive Weiterempfehlungen an Kolleg:innen und Familie.

Was das für euch heisst:
• Ein praktisches Lehrmittel, das euch im Unterricht Arbeit abnimmt
• Ein echtes Sicherheits-Geschenk für jede:n Schüler:in
• Sichtbarkeit und Empfehlungen über die ganze Ausbildung hinaus
• Kostenlos und ohne Aufwand – euren QR-Code erstellt ihr in 2 Minuten selbst, kein technisches Setup

Hat das Potenzial für euch? Ich zeige euch gerne in 10 Minuten wie die App funktioniert.

📱 Die App gibt es bereits fürs iPhone: https://apps.apple.com/ch/app/crashcode/id6783841118 – die Android-Version folgt in Kürze.

Marc Kälin | Entwickler von CrashCode
📞 +41 76 526 43 67
✉️ business@kaelint.ch
🌐 https://crashcode.kaelint.ch
💼 LinkedIn: https://ch.linkedin.com/in/marc-kaelin-76b474127`
  },
  email2: {
    subject: 'Re: Partnerschaft-Idee für [Business Name]',
    body: `Sali [Business Name],

kurzes Follow-up zu meiner Idee mit CrashCode – der Unfall-App, die eure Schüler:innen als Lehrmittel nutzen und die ihr gratis mit eurem Namen weitergeben könnt.

Ich weiss, der Alltag als Fahrlehrer:in ist voll. Darum ganz unkompliziert: Wenn es euch interessiert, antwortet einfach kurz auf diese Mail – oder meldet euch bei mir, dann zeige ich euch die App in 10 Minuten.

Kein Stress, nur falls es passt.

📱 Die App gibt es bereits fürs iPhone: https://apps.apple.com/ch/app/crashcode/id6783841118 – die Android-Version folgt in Kürze.

Marc Kälin | Entwickler von CrashCode
📞 +41 76 526 43 67
✉️ business@kaelint.ch
🌐 https://crashcode.kaelint.ch
💼 LinkedIn: https://ch.linkedin.com/in/marc-kaelin-76b474127`
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
