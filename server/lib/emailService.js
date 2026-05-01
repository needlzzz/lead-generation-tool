const nodemailer = require('nodemailer');

function renderTemplate(template, lead, settings) {
  const contactName = lead.contactPerson
    ? lead.contactPerson
    : `Team von ${lead.businessName}`;

  let subject = template.subject || '';
  let body = template.body || '';

  const replacements = {
    '[Name]': contactName,
    '[Name / Team von Business Name]': contactName,
    '[Business Name]': lead.businessName || '',
    '[CALENDLY-LINK]': settings.calendlyLink || '',
    '[Dein Name]': settings.userName || ''
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

function createTransport(smtpConfig) {
  return nodemailer.createTransport({
    host: smtpConfig.host,
    port: smtpConfig.port,
    secure: smtpConfig.port === 465,
    auth: {
      user: smtpConfig.username,
      pass: smtpConfig.password
    }
  });
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

module.exports = { renderTemplate, sendEmail, testConnection, createTransport };
