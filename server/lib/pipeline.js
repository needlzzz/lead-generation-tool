// Valid status transitions: { currentStatus: { action: nextStatus } }
const TRANSITIONS = {
  'Discovered': {
    'send-email-1': 'Reached Out',
    'mark-not-a-fit': 'Lost'
  },
  'Reached Out': {
    'send-followup-1': 'Reached Out',
    'send-followup-2': 'Reached Out',
    'mark-no-response': 'No Response',
    'log-reply': 'Replied',
    'reset-to-discovered': 'Discovered'
  },
  'Replied': {
    'schedule-meeting': 'Meeting Scheduled'
  },
  'Meeting Scheduled': {
    'mark-won': 'Client Won',
    'mark-lost': 'Lost'
  },
  // Terminal statuses — allow revert
  'No Response': {
    'revert-to-reached-out': 'Reached Out',
    'reset-to-discovered': 'Discovered'
  },
  'Client Won': {},
  'Lost': {
    'revert-to-discovered': 'Discovered'
  }
};

function validateTransition(currentStatus, action) {
  const allowed = TRANSITIONS[currentStatus];
  if (!allowed) {
    return { valid: false, error: `Unknown status: ${currentStatus}` };
  }
  const nextStatus = allowed[action];
  if (!nextStatus) {
    return {
      valid: false,
      error: `Action "${action}" is not valid for status "${currentStatus}". Allowed actions: ${Object.keys(allowed).join(', ') || 'none'}`
    };
  }
  return { valid: true, nextStatus };
}

function getFollowUpDates(dateEmail1Sent) {
  if (!dateEmail1Sent) return null;
  const d = new Date(dateEmail1Sent);
  const followUp1 = new Date(d);
  followUp1.setDate(followUp1.getDate() + 3);
  const followUp2 = new Date(d);
  followUp2.setDate(followUp2.getDate() + 6);
  const markCold = new Date(d);
  markCold.setDate(markCold.getDate() + 7);
  return {
    followUp1Due: followUp1.toISOString().split('T')[0],
    followUp2Due: followUp2.toISOString().split('T')[0],
    markColdDate: markCold.toISOString().split('T')[0]
  };
}

function getDueToday(leads, today) {
  const todayStr = typeof today === 'string' ? today : today.toISOString().split('T')[0];
  const followUp1Due = [];
  const followUp2Due = [];
  const markColdDue = [];

  for (const lead of leads) {
    if (lead.status !== 'Reached Out') continue;
    if (!lead.dateEmail1Sent) continue;

    const dates = getFollowUpDates(lead.dateEmail1Sent);
    if (!dates) continue;

    // Follow-Up 1 due: 3+ days since Email 1, FU1 not yet sent
    if (!lead.dateFollowUp1Sent && dates.followUp1Due <= todayStr) {
      followUp1Due.push(lead);
    }
    // Follow-Up 2 due: 6+ days since Email 1, FU1 sent, FU2 not yet sent
    else if (lead.dateFollowUp1Sent && !lead.dateFollowUp2Sent && dates.followUp2Due <= todayStr) {
      followUp2Due.push(lead);
    }
    // Mark cold: 7+ days since Email 1, FU2 sent, no reply
    else if (lead.dateFollowUp2Sent && dates.markColdDate <= todayStr) {
      markColdDue.push(lead);
    }
  }

  return { followUp1Due, followUp2Due, markColdDue };
}

function checkDuplicate(newLead, existingLeads) {
  const warnings = [];
  const nameLower = (newLead.businessName || '').toLowerCase().trim();
  const urlLower = (newLead.websiteUrl || '').toLowerCase().trim();

  for (const existing of existingLeads) {
    if (nameLower && existing.businessName.toLowerCase().trim() === nameLower) {
      warnings.push({
        field: 'businessName',
        existingLead: { id: existing.id, businessName: existing.businessName }
      });
    }
    if (urlLower && existing.websiteUrl && existing.websiteUrl.toLowerCase().trim() === urlLower) {
      warnings.push({
        field: 'websiteUrl',
        existingLead: { id: existing.id, businessName: existing.businessName }
      });
    }
  }

  return warnings;
}

module.exports = { validateTransition, getFollowUpDates, getDueToday, checkDuplicate, TRANSITIONS };
