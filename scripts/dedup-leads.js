#!/usr/bin/env node

/**
 * Lead Deduplication Script
 * 
 * 1. Removes leads with fake/placeholder emails (info@barber.com, info@website.com, etc.)
 * 2. For chain businesses (same email, different cities), keeps the one with:
 *    - Best status (furthest in pipeline) > has preview > has website analysis > earliest discovered
 *    - Removes the rest
 * 
 * Usage:
 *   node scripts/dedup-leads.js          # Dry run (shows what would be removed)
 *   node scripts/dedup-leads.js --apply  # Actually remove duplicates
 */

const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, '..', 'server', 'data', 'leads.json');
const APPLY = process.argv.includes('--apply');

// Emails that are clearly fake/placeholder — not real contacts
const FAKE_EMAILS = new Set([
  'info@barber.com',
  'info@hair.com',
  'info@website.com',
  'info@maps.ch',
  'info@example.com',
  'info@test.com',
  'noreply@google.com',
]);

// Status priority (higher = further in pipeline = keep)
const STATUS_PRIORITY = {
  'Client Won': 7,
  'Meeting Scheduled': 6,
  'Replied': 5,
  'Reached Out': 4,
  'No Response': 3,
  'Discovered': 1,
};

function getStatusScore(status) {
  return STATUS_PRIORITY[status] || 0;
}

function pickBestLead(leads) {
  return leads.sort((a, b) => {
    // 1. Highest status wins
    const statusDiff = getStatusScore(b.status) - getStatusScore(a.status);
    if (statusDiff !== 0) return statusDiff;

    // 2. Has preview wins
    const previewDiff = (b.previewUrl ? 1 : 0) - (a.previewUrl ? 1 : 0);
    if (previewDiff !== 0) return previewDiff;

    // 3. Has website analysis wins
    const analysisDiff = (b.websiteQuality ? 1 : 0) - (a.websiteQuality ? 1 : 0);
    if (analysisDiff !== 0) return analysisDiff;

    // 4. Earlier discovered wins (keep the original)
    const aDate = a.discoveredAt || a.createdAt || '';
    const bDate = b.discoveredAt || b.createdAt || '';
    return aDate.localeCompare(bDate);
  })[0];
}

// Load leads
const leads = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
console.log(`Total leads loaded: ${leads.length}`);

// Phase 1: Remove fake emails
const fakeRemoved = [];
const afterFakeRemoval = leads.filter(lead => {
  if (!lead.email) return true;
  const email = lead.email.toLowerCase().trim();
  if (FAKE_EMAILS.has(email)) {
    fakeRemoved.push(lead);
    return false;
  }
  return true;
});

console.log(`\nPhase 1 — Fake email removal:`);
console.log(`  Removed: ${fakeRemoved.length} leads with placeholder emails`);
for (const email of FAKE_EMAILS) {
  const count = fakeRemoved.filter(l => l.email.toLowerCase().trim() === email).length;
  if (count > 0) console.log(`    ${count}x  ${email}`);
}

// Phase 2: Deduplicate chain businesses (same email)
const emailMap = new Map();
for (const lead of afterFakeRemoval) {
  if (!lead.email) continue;
  const key = lead.email.toLowerCase().trim();
  if (!emailMap.has(key)) emailMap.set(key, []);
  emailMap.get(key).push(lead);
}

const chainRemoved = [];
const keptIds = new Set();
const noEmailLeads = afterFakeRemoval.filter(l => !l.email);

// For leads with email: keep the best one per email
for (const [email, group] of emailMap) {
  if (group.length === 1) {
    keptIds.add(group[0].id);
  } else {
    const best = pickBestLead(group);
    keptIds.add(best.id);
    for (const lead of group) {
      if (lead.id !== best.id) {
        chainRemoved.push(lead);
      }
    }
  }
}

console.log(`\nPhase 2 — Chain deduplication:`);
console.log(`  Duplicate email groups: ${[...emailMap.values()].filter(a => a.length > 1).length}`);
console.log(`  Leads removed (keeping best per email): ${chainRemoved.length}`);

// Top 10 chains consolidated
const topChains = [...emailMap.entries()]
  .filter(([_, a]) => a.length > 1)
  .sort((a, b) => b[1].length - a[1].length)
  .slice(0, 10);

console.log(`  Top 10 consolidated chains:`);
for (const [email, arr] of topChains) {
  const best = pickBestLead([...arr]);
  console.log(`    ${arr.length}x → kept: "${best.businessName}" (${best.city || 'no city'}, ${best.status})`);
}

// Final result
const finalLeads = [
  ...noEmailLeads,
  ...afterFakeRemoval.filter(l => l.email && keptIds.has(l.id))
];

const totalRemoved = leads.length - finalLeads.length;
console.log(`\n========================================`);
console.log(`Summary:`);
console.log(`  Before: ${leads.length} leads`);
console.log(`  Fake emails removed: ${fakeRemoved.length}`);
console.log(`  Chain dupes removed: ${chainRemoved.length}`);
console.log(`  After: ${finalLeads.length} leads`);
console.log(`  Total removed: ${totalRemoved}`);
console.log(`========================================`);

if (APPLY) {
  // Create backup
  const backupPath = DATA_FILE.replace('.json', `-backup-${Date.now()}.json`);
  fs.copyFileSync(DATA_FILE, backupPath);
  console.log(`\nBackup saved: ${backupPath}`);

  // Write deduped leads
  fs.writeFileSync(DATA_FILE, JSON.stringify(finalLeads, null, 2));
  console.log(`Deduplication applied. ${finalLeads.length} leads written.`);
  console.log(`\nRestart the server to pick up changes.`);
} else {
  console.log(`\nDry run — no changes made. Run with --apply to execute.`);
}
