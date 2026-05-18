// Test script reproducing the admin-stats denominator bug.
// Replicates the userDocs filter in src/app/api/admin/stats/route.ts
// against an in-memory dataset where all docs share departmentId='dept1'
// (mirrors the seed). Verifies the OLD filter inflates the denominator
// to the full corpus, while the NEW filter returns the per-user count.

// --- Fixtures: 17 published docs mirroring the real seed ---
// 4 general + 2 department(Marketing) + per-team team docs:
//   Content=3, Livestream=3, CSKH=2, Booking=3  (total 17)
const make = (id, docType, assigned) => ({
  id, docType,
  assignedTo: {
    isGeneral: docType === 'general',
    departmentId: assigned.departmentId,
    teamId: assigned.teamId,
    positionId: assigned.positionId,
  },
});

const publishedDocs = [
  // General (4)
  make('gen-1', 'general', { departmentId: 'dept1' }),
  make('gen-2', 'general', { departmentId: 'dept1' }),
  make('gen-3', 'general', { departmentId: 'dept1' }),
  make('gen-4', 'general', { departmentId: 'dept1' }),
  // Department (2)
  make('dept-mkt-1', 'department', { departmentId: 'dept1' }),
  make('dept-mkt-2', 'department', { departmentId: 'dept1' }),
  // Team Content (3) — team1
  make('content-1', 'team', { departmentId: 'dept1', teamId: 'team1' }),
  make('content-2', 'team', { departmentId: 'dept1', teamId: 'team1' }),
  make('content-3', 'team', { departmentId: 'dept1', teamId: 'team1' }),
  // Team Livestream (3) — team2
  make('live-1', 'team', { departmentId: 'dept1', teamId: 'team2' }),
  make('live-2', 'team', { departmentId: 'dept1', teamId: 'team2' }),
  make('live-3', 'team', { departmentId: 'dept1', teamId: 'team2' }),
  // Team CSKH (2) — team3
  make('cskh-1', 'team', { departmentId: 'dept1', teamId: 'team3' }),
  make('cskh-2', 'team', { departmentId: 'dept1', teamId: 'team3' }),
  // Team Booking (3) — team4
  make('book-1', 'team', { departmentId: 'dept1', teamId: 'team4' }),
  make('book-2', 'team', { departmentId: 'dept1', teamId: 'team4' }),
  make('book-3', 'team', { departmentId: 'dept1', teamId: 'team4' }),
];

const users = [
  { id: 'u-content', departmentId: 'dept1', teamId: 'team1', positionId: null, expected: 9 },   // 4+2+3
  { id: 'u-livestream', departmentId: 'dept1', teamId: 'team2', positionId: null, expected: 9 }, // 4+2+3
  { id: 'u-cskh', departmentId: 'dept1', teamId: 'team3', positionId: null, expected: 8 },       // 4+2+2
  { id: 'u-booking', departmentId: 'dept1', teamId: 'team4', positionId: null, expected: 9 },    // 4+2+3
];

// --- OLD (buggy) filter from route.ts ---
function oldFilter(doc, user) {
  const a = doc.assignedTo;
  if (a.isGeneral) return true;
  if (a.departmentId && a.departmentId === user.departmentId) return true;
  if (a.teamId && a.teamId === user.teamId) return true;
  return false;
}

// --- NEW (fixed) filter from route.ts ---
function newFilter(doc, user) {
  const a = doc.assignedTo;
  if (a.isGeneral) return true;
  if (doc.docType === 'team') return a.teamId === user.teamId;
  if (doc.docType === 'department') return a.departmentId === user.departmentId;
  if (doc.docType === 'position') return a.positionId === user.positionId;
  return false;
}

console.log(`Total published docs: ${publishedDocs.length}\n`);

let failed = false;
for (const user of users) {
  const oldCount = publishedDocs.filter(d => oldFilter(d, user)).length;
  const newCount = publishedDocs.filter(d => newFilter(d, user)).length;
  const oldOk = oldCount === publishedDocs.length; // bug = inflates to full corpus
  const newOk = newCount === user.expected;
  console.log(`User ${user.id} (team=${user.teamId})`);
  console.log(`  OLD count: ${oldCount}  (expected to inflate to ${publishedDocs.length} — ${oldOk ? 'reproduced ✗ buggy' : 'mismatch'})`);
  console.log(`  NEW count: ${newCount}  (expected ${user.expected} — ${newOk ? '✅' : '❌'})`);
  if (!oldOk || !newOk) failed = true;
}

console.log();
if (failed) {
  console.error('❌ FAIL: either OLD did not reproduce, or NEW is incorrect.');
  process.exit(1);
}
console.log('✅ PASS: OLD inflates every user to /17; NEW returns per-user counts.');
