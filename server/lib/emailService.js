const nodemailer = require('nodemailer');

/**
 * Format an ISO date string as a German date (e.g., "15. Juli 2026").
 * Returns empty string for invalid/null dates.
 */
function formatGermanDate(isoDateString) {
  if (!isoDateString) return '';
  const date = new Date(isoDateString);
  if (isNaN(date.getTime())) return '';

  const MONTHS_DE = [
    'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
    'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'
  ];

  const day = date.getUTCDate();
  const month = MONTHS_DE[date.getUTCMonth()];
  const year = date.getUTCFullYear();

  return `${day}. ${month} ${year}`;
}

function renderTemplate(template, lead, settings) {
  const contactName = lead.contactPerson
    ? lead.contactPerson
    : lead.businessName;

  // Personalized greeting — use last name if contact person is known, otherwise plain
  let greeting = 'Guten Tag';
  if (lead.contactPerson && lead.contactPerson.trim()) {
    const parts = lead.contactPerson.trim().split(/\s+/);
    if (parts.length >= 2) {
      const lastName = parts[parts.length - 1];
      greeting = `Guten Tag Herr/Frau ${lastName}`;
    } else {
      greeting = `Guten Tag ${parts[0]}`;
    }
  }

  // Format website issues — top 5 most impactful for email urgency
  const ESSENTIAL_ISSUES = ['no-ssl', 'no-viewport', 'no-responsive', 'slow-load', 'no-cta', 'no-contact-form', 'outdated-copyright', 'outdated-wp', 'outdated-joomla', 'free-plan-cms', 'no-trust-signals', 'no-favicon', 'no-opening-hours'];
  const essentialIssues = (lead.websiteIssues || []).filter(i => ESSENTIAL_ISSUES.includes(i.id));
  const topIssues = essentialIssues.length > 0 ? essentialIssues.slice(0, 5) : (lead.websiteIssues || []).slice(0, 5);

  // Consequence map — connects each finding to a constructive, helpful explanation
  const CONSEQUENCES = {
    'no-ssl': 'Ein SSL-Zertifikat schützt die Daten Ihrer Besucher und zeigt ihnen: hier bin ich sicher',
    'no-viewport': 'Über 60% surfen heute mobil — eine angepasste Darstellung macht Ihre Seite für alle zugänglich',
    'no-responsive': 'Auf Smartphones und Tablets soll Ihre Seite genauso einladend wirken wie am Computer',
    'slow-load': 'Schnellere Seiten halten Besucher länger — und werden von Google besser bewertet',
    'moderate-load': 'Jede Sekunde weniger Ladezeit bedeutet spürbar mehr Besucher, die bleiben',
    'no-cta': 'Ein einfacher Button wie „Jetzt anfragen" gibt Besuchern Orientierung und macht den nächsten Schritt leichter',
    'no-contact-form': 'Viele Menschen füllen lieber ein kurzes Formular aus, als selbst eine E-Mail zu verfassen — das senkt die Hemmschwelle spürbar',
    'no-opening-hours': 'Wer sofort sieht, wann er vorbeikommen kann, fühlt sich willkommen — und kommt tatsächlich vorbei',
    'no-social-media': 'Social-Media-Links zeigen, dass Sie aktiv sind — das schafft Nähe und Vertrauen',
    'no-favicon': 'Ein kleines Icon im Browser-Tab macht Ihre Seite wiedererkennbar und professioneller',
    'no-trust-signals': 'Team-Fotos oder Kundenstimmen zeigen, wer hinter dem Geschäft steht — das schafft sofort Vertrauen',
    'no-title': 'Ein treffender Seitentitel hilft Google, Sie für die richtigen Suchbegriffe anzuzeigen',
    'no-meta-desc': 'Eine gute Beschreibung in den Google-Ergebnissen überzeugt Suchende, auf Ihren Link zu klicken',
    'no-h1': 'Eine klare Hauptüberschrift hilft Besuchern und Google zu verstehen, worum es bei Ihnen geht',
    'missing-alt': 'Bildbeschreibungen helfen Google, Ihre Fotos in der Bildersuche zu zeigen — kostenlose Sichtbarkeit',
    'outdated-copyright': 'Ein aktuelles Copyright-Jahr signalisiert Besuchern: hier passiert etwas, die Seite lebt',
    'outdated-wp': 'Eine aktuelle WordPress-Version schützt vor Sicherheitslücken und bringt neue Funktionen',
    'outdated-joomla': 'Ein Update auf die aktuelle Version schliesst bekannte Sicherheitslücken',
    'mixed-content': 'Wenn alles verschlüsselt geladen wird, verschwindet die Browser-Warnung — und das Vertrauen steigt',
    'uses-flash': 'Ohne Flash funktioniert Ihre Seite auf allen modernen Geräten einwandfrei',
    'table-layout': 'Ein moderner Aufbau macht Ihre Seite schnell, flexibel und mobilfreundlich',
    'missing-security-headers': 'Zusätzliche Sicherheitseinstellungen schützen Ihre Besucher und stärken das Vertrauen',
    'weak-security-headers': 'Mehr Schutz im Hintergrund gibt Ihren Besuchern ein sicheres Gefühl',
    'free-plan-cms': 'Ohne die Werbung des Anbieters wirkt Ihre Seite deutlich professioneller'
  };

  const websiteIssuesList = topIssues.length > 0
    ? topIssues.map(i => {
        const consequence = CONSEQUENCES[i.id] || '';
        return consequence ? `• ${i.label} → ${consequence}` : `• ${i.label}`;
      }).join('\n\n')
    : '';

  // Short summary (first 2-3 issues, one-liner)
  const websiteIssuesSummary = topIssues.length > 0
    ? topIssues.map(i => i.label).join(', ')
    : '';

  // Issue count for template
  const websiteIssuesCount = topIssues.length > 0 ? String(topIssues.length) : '0';

  // Preview screenshot URL: derive from previewUrl
  const previewScreenshotUrl = lead.previewUrl
    ? lead.previewUrl + 'screenshot.png'
    : '';

  // Preview expiry date in German format
  const previewExpiryFormatted = formatGermanDate(lead.previewExpiresAt);

  // Preview disclaimer
  const previewDisclaimer = lead.previewUrl
    ? '(Hinweis: Die Vorschau enthält Platzhalter-Bilder. Mit Ihren echten Fotos sieht das Ergebnis noch besser aus.)'
    : '';

  let subject = template.subject || '';
  let body = template.body || '';

  const replacements = {
    '[Name]': contactName,
    '[Greeting]': greeting,
    '[Name / Team von Business Name]': contactName,
    '[Business Name]': lead.businessName || '',
    '[CALENDLY-LINK]': settings.calendlyLink || '',
    '[Dein Name]': settings.userName || '',
    '[Website-Probleme]': websiteIssuesList,
    '[Website-Probleme-Kurz]': websiteIssuesSummary,
    '[Website-Probleme-Anzahl]': websiteIssuesCount,
    '[Website-Score]': lead.websiteScore != null ? `${lead.websiteScore}/100` : '',
    '[Preview-Link]': lead.previewUrl || '',
    '[Preview-Screenshot]': previewScreenshotUrl,
    '[Preview-Ablauf]': previewExpiryFormatted,
    '[Preview-Disclaimer]': previewDisclaimer
  };

  for (const [placeholder, value] of Object.entries(replacements)) {
    // Escape special regex chars in placeholder
    const escaped = placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(escaped, 'g');
    subject = subject.replace(regex, value);
    body = body.replace(regex, value);
  }

  return { subject, body };
}

const CORPORATE_PROXY = 'http://aproxy.corproot.net:8080';

function createTransport(smtpConfig) {
  const opts = {
    host: smtpConfig.host,
    port: smtpConfig.port,
    secure: smtpConfig.port === 465,
    auth: {
      user: smtpConfig.username,
      pass: smtpConfig.password
    }
  };

  if (smtpConfig.useProxy) {
    opts.proxy = CORPORATE_PROXY;
  }

  return nodemailer.createTransport(opts);
}

async function sendEmail(smtpConfig, fromAddress, to, subject, body) {
  const transport = createTransport(smtpConfig);
  const result = await transport.sendMail({
    from: fromAddress,
    replyTo: fromAddress,
    to: to,
    subject: subject,
    text: body,
    headers: {
      'X-Mailer': undefined // suppress Nodemailer's default X-Mailer header
    }
  });
  return result;
}

async function testConnection(smtpConfig) {
  const transport = createTransport(smtpConfig);
  await transport.verify();
  return true;
}

module.exports = { renderTemplate, sendEmail, testConnection, createTransport, formatGermanDate };
