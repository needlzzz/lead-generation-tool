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
    : `Team von ${lead.businessName}`;

  // Format website issues — only top 3 most impactful for email brevity
  const ESSENTIAL_ISSUES = ['no-ssl', 'no-viewport', 'no-responsive', 'slow-load', 'no-cta', 'no-contact-form', 'outdated-copyright', 'outdated-wp', 'outdated-joomla', 'free-plan-cms'];
  const essentialIssues = (lead.websiteIssues || []).filter(i => ESSENTIAL_ISSUES.includes(i.id));
  const topIssues = essentialIssues.length > 0 ? essentialIssues.slice(0, 3) : (lead.websiteIssues || []).slice(0, 3);
  const websiteIssuesList = topIssues.length > 0
    ? topIssues.map(i => `• ${i.label}`).join('\n')
    : '';

  // Short summary (first 2-3 issues, one-liner)
  const websiteIssuesSummary = topIssues.length > 0
    ? topIssues.map(i => i.label).join(', ')
    : '';

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
    '[Name / Team von Business Name]': contactName,
    '[Business Name]': lead.businessName || '',
    '[CALENDLY-LINK]': settings.calendlyLink || '',
    '[Dein Name]': settings.userName || '',
    '[Website-Probleme]': websiteIssuesList,
    '[Website-Probleme-Kurz]': websiteIssuesSummary,
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
    to: to,
    subject: subject,
    text: body
  });
  return result;
}

async function testConnection(smtpConfig) {
  const transport = createTransport(smtpConfig);
  await transport.verify();
  return true;
}

module.exports = { renderTemplate, sendEmail, testConnection, createTransport, formatGermanDate };
