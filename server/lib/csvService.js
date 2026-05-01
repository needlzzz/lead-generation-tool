// Simple CSV parser/generator — no external dependencies

function parseCSV(csvString) {
  const lines = csvString.split(/\r?\n/).filter(line => line.trim());
  if (lines.length < 2) return { headers: [], rows: [] };

  const headers = parseLine(lines[0]);
  const rows = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseLine(lines[i]);
    const row = {};
    headers.forEach((header, idx) => {
      row[header.trim()] = (values[idx] || '').trim();
    });
    rows.push(row);
  }

  return { headers: headers.map(h => h.trim()), rows };
}

function parseLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}

function generateCSV(headers, rows) {
  const BOM = '\uFEFF'; // UTF-8 BOM for Excel compatibility
  const headerLine = headers.map(h => escapeField(h)).join(',');
  const dataLines = rows.map(row => {
    return headers.map(h => escapeField(row[h] || '')).join(',');
  });
  return BOM + [headerLine, ...dataLines].join('\r\n');
}

function escapeField(value) {
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return '"' + str.replace(/"/g, '""') + '"';
  }
  return str;
}

// Map CSV columns to lead fields
const COLUMN_MAP = {
  'Business Name': 'businessName',
  'Category': 'category',
  'Address': 'address',
  'Phone': 'phone',
  'Email': 'email',
  'Website URL': 'websiteUrl',
  'Website Quality': 'websiteQuality',
  'Contact Person': 'contactPerson'
};

function mapRowToLead(row) {
  const lead = {};
  for (const [csvCol, leadField] of Object.entries(COLUMN_MAP)) {
    if (row[csvCol] !== undefined) {
      lead[leadField] = row[csvCol];
    }
  }
  return lead;
}

// Export columns per tab
const EXPORT_COLUMNS = {
  discovery: {
    headers: ['Business Name', 'Category', 'Address', 'Phone', 'Email', 'Website URL', 'Website Quality', 'Date Discovered'],
    mapLead: (lead) => ({
      'Business Name': lead.businessName,
      'Category': lead.category,
      'Address': lead.address || '',
      'Phone': lead.phone || '',
      'Email': lead.email || '',
      'Website URL': lead.websiteUrl || '',
      'Website Quality': lead.websiteQuality || '',
      'Date Discovered': lead.dateDiscovered || ''
    })
  },
  outreach: {
    headers: ['Business Name', 'Category', 'Email', 'Status', 'Date Email 1', 'Date Follow-Up 1', 'Date Follow-Up 2', 'Last Activity'],
    mapLead: (lead) => ({
      'Business Name': lead.businessName,
      'Category': lead.category,
      'Email': lead.email || '',
      'Status': lead.status,
      'Date Email 1': lead.dateEmail1Sent || '',
      'Date Follow-Up 1': lead.dateFollowUp1Sent || '',
      'Date Follow-Up 2': lead.dateFollowUp2Sent || '',
      'Last Activity': getLastActivity(lead)
    })
  },
  replies: {
    headers: ['Business Name', 'Reply Date', 'Sentiment', 'Calendly Sent', 'Meeting Date', 'Notes'],
    mapLead: (lead) => ({
      'Business Name': lead.businessName,
      'Reply Date': lead.replyDate || '',
      'Sentiment': lead.replySentiment || '',
      'Calendly Sent': lead.calendlySent ? 'Y' : 'N',
      'Meeting Date': lead.meetingDate || '',
      'Notes': lead.notes || ''
    })
  },
  clients: {
    headers: ['Business Name', 'Meeting Date', 'Decision', 'Start Date', 'Notes'],
    mapLead: (lead) => ({
      'Business Name': lead.businessName,
      'Meeting Date': lead.meetingDate || '',
      'Decision': lead.decision || '',
      'Start Date': lead.startDate || '',
      'Notes': lead.notes || ''
    })
  }
};

function getLastActivity(lead) {
  if (!lead.activityLog || lead.activityLog.length === 0) return '';
  return lead.activityLog[lead.activityLog.length - 1].date || '';
}

module.exports = { parseCSV, generateCSV, mapRowToLead, EXPORT_COLUMNS, COLUMN_MAP, parseLine, escapeField };
