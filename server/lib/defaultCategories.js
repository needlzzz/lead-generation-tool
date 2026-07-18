const { v4: uuidv4 } = require('uuid');

/**
 * Stable identifier for the CrashCode driving-school campaign. Categories that
 * run this campaign carry `campaign: CRASHCODE_FAHRSCHULE_CAMPAIGN`, which lets
 * the template resolver pick the language variant (de/fr/it) for a lead based on
 * the language the recipient speaks (see `CAMPAIGN_TEMPLATES`).
 */
const CRASHCODE_FAHRSCHULE_CAMPAIGN = 'crashcode-fahrschule';

/**
 * CrashCode co-branding campaign for driving schools — German (de).
 *
 * Unlike the website-sales campaign, this pitch has nothing to do with the
 * lead's website — it offers the school a free, co-brandable accident-help app
 * (CrashCode) for their students. It therefore uses only the identity/CTA
 * placeholders ([Business Name], [Dein Name], [CALENDLY-LINK]) and no website
 * or preview placeholders.
 *
 * Attached to the "Fahrschule" and "Fahrlehrer" categories so those leads run
 * this campaign automatically while every other category keeps the default
 * website pitch. French (fr) and Italian (it) variants live below and are picked
 * per lead by `resolveTemplatesForLead(settings, category, lang)`.
 */
const CRASHCODE_FAHRSCHULE_TEMPLATES_DE = {
  email1: {
    subject: 'Partnerschaft-Idee für [Business Name]: Lehrmittel + Unfall-App für eure Schüler:innen',
    body: `Sali zäme!

Ich hätte eine Partnerschaft-Idee, die perfekt zu einer Fahrschule passt – und für euch komplett kostenlos ist.

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

📱 Die App gibt es bereits fürs iPhone: https://apps.apple.com/ch/app/crashcode/id6783841118 – die Android-Version befindet sich aktuell in der Test-Phase. Du kannst mir aber deine E-Mailadresse (verknüpft mit deinem Google Konto) angeben und ich lade dich gerne als Tester ein.

Marc Kälin | Entwickler von CrashCode
📞 +41 76 526 43 67
✉️ business@kaelint.ch
🌐 https://crashcode.kaelint.ch
💼 LinkedIn: https://ch.linkedin.com/in/marc-kaelin-76b474127`
  },
  email2: {
    subject: 'Re: Partnerschaft-Idee für [Business Name]',
    body: `Sali zäme!

Kurzes Follow-up zu meiner Idee mit CrashCode – der Unfall-App, die eure Schüler:innen als Lehrmittel nutzen und die ihr gratis mit eurem Namen weitergeben könnt.

Ich weiss, der Alltag als Fahrlehrer:in ist voll. Darum ganz unkompliziert: Wenn es euch interessiert, antwortet einfach kurz auf diese Mail – oder meldet euch bei mir, dann zeige ich euch die App in 10 Minuten.

Kein Stress, nur falls es passt.

📱 Die App gibt es bereits fürs iPhone: https://apps.apple.com/ch/app/crashcode/id6783841118 – die Android-Version befindet sich aktuell in der Test-Phase. Du kannst mir aber deine E-Mailadresse (verknüpft mit deinem Google Konto) angeben und ich lade dich gerne als Tester ein.

Marc Kälin | Entwickler von CrashCode
📞 +41 76 526 43 67
✉️ business@kaelint.ch
🌐 https://crashcode.kaelint.ch
💼 LinkedIn: https://ch.linkedin.com/in/marc-kaelin-76b474127`
  }
};

/**
 * CrashCode driving-school campaign — French (fr). Same pitch as the German
 * variant, for leads in the French-speaking part of Switzerland. Keeps the
 * [Business Name] / [Dein Name] / [CALENDLY-LINK] placeholders.
 */
const CRASHCODE_FAHRSCHULE_TEMPLATES_FR = {
  email1: {
    subject: 'Idée de partenariat pour [Business Name] : outil pédagogique + appli accident pour vos élèves',
    body: `Bonjour à toutes et à tous,

J'ai une idée de partenariat qui correspond parfaitement à une auto-école – et qui est entièrement gratuite pour vous.

J'ai développé CrashCode : une application qui montre, étape par étape, quoi faire en cas d'accident de voiture. Les personnes impliquées échangent leurs données de véhicule et d'assurance en quelques secondes par code QR et sont guidées à travers un constat d'accident complet (selon le constat européen d'accident). Tout reste sur le téléphone – aucun serveur, aucune collecte de données.

Pour vous, je vois deux avantages concrets :

1) Comme outil pédagogique en cours
« Que faire en cas d'accident ? » fait partie de l'examen – mais c'est difficile à expliquer de façon théorique. Avec CrashCode, vos élèves s'exercent au déroulement de manière pratique sur leur propre téléphone : sécuriser les lieux, échanger les données, remplir le constat, prendre des photos et faire un croquis. Les conducteurs débutants sont statistiquement plus souvent impliqués dans des accidents et se retrouvent démunis le moment venu – vous leur enlevez cette incertitude.

2) Comme partenariat à votre image
Vous pouvez « co-marquer » l'application avec votre nom. Vos élèves scannent une seule fois votre code QR et voient ensuite, à chaque ouverture, « Fourni par [Business Name] ». Vous restez ainsi présents sur leur téléphone – bien après la dernière leçon de conduite, recommandations à leurs amis et à leur famille incluses.

Ce que cela signifie pour vous :
• Un outil pédagogique concret qui vous facilite le travail en cours
• Un véritable cadeau de sécurité pour chaque élève
• De la visibilité et des recommandations bien au-delà de la formation
• Gratuit et sans effort – vous créez votre code QR vous-même en 2 minutes, sans aucune configuration technique

Est-ce que cela a du potentiel pour vous ? Je vous montre volontiers en 10 minutes comment l'application fonctionne.

📱 L'application est déjà disponible pour iPhone : https://apps.apple.com/ch/app/crashcode/id6783841118 – la version Android est actuellement en phase de test. Vous pouvez toutefois me communiquer votre adresse e-mail (liée à votre compte Google) et je vous inviterai volontiers comme testeur.

Marc Kälin | Développeur de CrashCode
📞 +41 76 526 43 67
✉️ business@kaelint.ch
🌐 https://crashcode.kaelint.ch
💼 LinkedIn: https://ch.linkedin.com/in/marc-kaelin-76b474127`
  },
  email2: {
    subject: 'Re : Idée de partenariat pour [Business Name]',
    body: `Bonjour à toutes et à tous,

Petit suivi concernant mon idée avec CrashCode – l'appli accident que vos élèves peuvent utiliser comme outil pédagogique et que vous pouvez transmettre gratuitement à votre nom.

Je sais que le quotidien d'un moniteur de conduite est bien rempli. Alors en toute simplicité : si cela vous intéresse, répondez simplement à ce message – ou contactez-moi, et je vous montre l'application en 10 minutes.

Sans pression, seulement si cela vous convient.

📱 L'application est déjà disponible pour iPhone : https://apps.apple.com/ch/app/crashcode/id6783841118 – la version Android est actuellement en phase de test. Vous pouvez toutefois me communiquer votre adresse e-mail (liée à votre compte Google) et je vous inviterai volontiers comme testeur.

Marc Kälin | Développeur de CrashCode
📞 +41 76 526 43 67
✉️ business@kaelint.ch
🌐 https://crashcode.kaelint.ch
💼 LinkedIn: https://ch.linkedin.com/in/marc-kaelin-76b474127`
  }
};

/**
 * CrashCode driving-school campaign — Italian (it). Same pitch for leads in the
 * Italian-speaking part of Switzerland (Ticino). Keeps the same placeholders.
 */
const CRASHCODE_FAHRSCHULE_TEMPLATES_IT = {
  email1: {
    subject: 'Idea di collaborazione per [Business Name]: strumento didattico + app per incidenti per i vostri allievi',
    body: `Ciao a tutti!

Ho un'idea di collaborazione perfetta per una scuola guida – ed è completamente gratuita per voi.

Ho sviluppato CrashCode: un'app che mostra, passo dopo passo, cosa fare in caso di incidente stradale. Le persone coinvolte si scambiano i dati del veicolo e dell'assicurazione in pochi secondi tramite codice QR e vengono guidate attraverso una constatazione amichevole d'incidente completa (secondo la constatazione amichevole europea di incidente). Tutto rimane sul telefono – nessun server, nessuna raccolta di dati.

Per voi vedo due vantaggi concreti:

1) Come strumento didattico durante le lezioni
«Cosa faccio in caso di incidente?» fa parte dell'esame – ma è arido da spiegare in teoria. Con CrashCode i vostri allievi esercitano la procedura in modo pratico sul proprio telefono: mettere in sicurezza il luogo dell'incidente, scambiare i dati, compilare la constatazione, scattare foto e fare uno schizzo. I neopatentati sono statisticamente più spesso coinvolti in incidenti e, al momento critico, si trovano in difficoltà – così togliete loro questa insicurezza.

2) Come collaborazione con il vostro marchio
Potete personalizzare l'app con il vostro nome. I vostri allievi scansionano una sola volta il vostro codice QR e vedono poi, a ogni apertura, «Fornito da [Business Name]». Rimanete così presenti sul loro telefono – ben oltre l'ultima lezione di guida, raccomandazioni ad amici e familiari incluse.

Cosa significa per voi:
• Uno strumento didattico concreto che vi alleggerisce il lavoro durante le lezioni
• Un vero regalo di sicurezza per ogni allievo
• Visibilità e raccomandazioni ben oltre la formazione
• Gratuito e senza sforzo – create il vostro codice QR da soli in 2 minuti, senza alcuna configurazione tecnica

Ha del potenziale per voi? Vi mostro volentieri in 10 minuti come funziona l'app.

📱 L'app è già disponibile per iPhone: https://apps.apple.com/ch/app/crashcode/id6783841118 – la versione Android è attualmente in fase di test. Potete però comunicarmi il vostro indirizzo e-mail (collegato al vostro account Google) e vi inviterò volentieri come tester.

Marc Kälin | Sviluppatore di CrashCode
📞 +41 76 526 43 67
✉️ business@kaelint.ch
🌐 https://crashcode.kaelint.ch
💼 LinkedIn: https://ch.linkedin.com/in/marc-kaelin-76b474127`
  },
  email2: {
    subject: 'Re: Idea di collaborazione per [Business Name]',
    body: `Ciao a tutti!

Un breve promemoria riguardo alla mia idea con CrashCode – l'app per gli incidenti che i vostri allievi possono usare come strumento didattico e che potete trasmettere gratuitamente con il vostro nome.

So che la quotidianità di un istruttore di guida è piena di impegni. Quindi in tutta semplicità: se vi interessa, rispondete semplicemente a questa e-mail – oppure contattatemi e vi mostro l'app in 10 minuti.

Nessuna fretta, solo se vi sembra adatto.

📱 L'app è già disponibile per iPhone: https://apps.apple.com/ch/app/crashcode/id6783841118 – la versione Android è attualmente in fase di test. Potete però comunicarmi il vostro indirizzo e-mail (collegato al vostro account Google) e vi inviterò volentieri come tester.

Marc Kälin | Sviluppatore di CrashCode
📞 +41 76 526 43 67
✉️ business@kaelint.ch
🌐 https://crashcode.kaelint.ch
💼 LinkedIn: https://ch.linkedin.com/in/marc-kaelin-76b474127`
  }
};

/**
 * Language variants of the CrashCode driving-school campaign, keyed by language
 * code. German is the default/base; French and Italian are picked per lead.
 */
const CRASHCODE_FAHRSCHULE_TEMPLATES_BY_LANG = {
  de: CRASHCODE_FAHRSCHULE_TEMPLATES_DE,
  fr: CRASHCODE_FAHRSCHULE_TEMPLATES_FR,
  it: CRASHCODE_FAHRSCHULE_TEMPLATES_IT
};

// Backward-compatible alias: the category `templates` field and every existing
// importer keep the German variant as the default campaign template.
const CRASHCODE_FAHRSCHULE_TEMPLATES = CRASHCODE_FAHRSCHULE_TEMPLATES_DE;

/**
 * Registry mapping a campaign id → its language variants. The email-service
 * resolver uses this to override a lead's template with the variant matching the
 * language the recipient speaks.
 */
const CAMPAIGN_TEMPLATES = {
  [CRASHCODE_FAHRSCHULE_CAMPAIGN]: CRASHCODE_FAHRSCHULE_TEMPLATES_BY_LANG
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
    campaign: CRASHCODE_FAHRSCHULE_CAMPAIGN,
    templates: CRASHCODE_FAHRSCHULE_TEMPLATES
  },
  {
    id: uuidv4(),
    name: 'Fahrlehrer',
    searchTerm: 'Fahrlehrer',
    tone: 'casual',
    campaign: CRASHCODE_FAHRSCHULE_CAMPAIGN,
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

module.exports = {
  DEFAULT_CATEGORIES,
  CRASHCODE_FAHRSCHULE_TEMPLATES,
  CRASHCODE_FAHRSCHULE_TEMPLATES_BY_LANG,
  CRASHCODE_FAHRSCHULE_CAMPAIGN,
  CAMPAIGN_TEMPLATES
};
