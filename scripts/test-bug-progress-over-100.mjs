// Test script reproducing the >100% admin-dashboard progress bug.
// Scenario: a CSKH user passed quizzes on 17 docs (back when the
// permission leak was live). After the permission fix, only 12 docs
// are assigned to that user. The old completedDocs counter ignored
// the assigned set and returned 17/12 = 142%. The fixed version
// intersects passed-progress with currently-assigned doc IDs.

// --- Fixtures ---
const userDocs = Array.from({ length: 12 }, (_, i) => ({ id: `assigned-${i + 1}` }));

// Historical progress: 12 assigned + 5 leaked (no longer assigned), all 'quiz_passed'
const userProgress = [
  ...userDocs.map(d => ({ userId: 'u1', documentId: d.id, status: 'quiz_passed' })),
  { userId: 'u1', documentId: 'leaked-1', status: 'quiz_passed' },
  { userId: 'u1', documentId: 'leaked-2', status: 'quiz_passed' },
  { userId: 'u1', documentId: 'leaked-3', status: 'quiz_passed' },
  { userId: 'u1', documentId: 'leaked-4', status: 'quiz_passed' },
  { userId: 'u1', documentId: 'leaked-5', status: 'quiz_passed' },
];

// --- OLD (buggy) counter ---
function oldCount(progress) {
  return progress.filter(p => p.status === 'quiz_passed').length;
}

// --- NEW (fixed) counter ---
function newCount(progress, assignedDocs) {
  const assignedIds = new Set(assignedDocs.map(d => d.id));
  return progress.filter(p => p.status === 'quiz_passed' && assignedIds.has(p.documentId)).length;
}

const oldCompleted = oldCount(userProgress);
const newCompleted = newCount(userProgress, userDocs);
const oldPct = Math.round((oldCompleted / userDocs.length) * 100);
const newPct = Math.round((newCompleted / userDocs.length) * 100);

console.log(`userDocs.length     = ${userDocs.length}`);
console.log(`historical passed   = ${userProgress.length} (12 assigned + 5 leaked)`);
console.log();
console.log(`OLD: completedDocs=${oldCompleted}, progressPct=${oldPct}%  (display: ${oldCompleted}/${userDocs.length})`);
console.log(`NEW: completedDocs=${newCompleted}, progressPct=${newPct}%  (display: ${newCompleted}/${userDocs.length})`);
console.log();

const oldOk = oldPct === 142 && oldCompleted === 17;       // bug reproduced
const newOk = newPct === 100 && newCompleted === 12;       // fix correct

if (!oldOk) {
  console.error('❌ Test setup invalid: old counter did not produce 142% (17/12).');
  process.exit(1);
}
if (!newOk) {
  console.error('❌ FAIL: fixed counter did not clamp to 100% (12/12).');
  process.exit(1);
}
console.log('✅ PASS: OLD produced 142% (17/12); NEW produces 100% (12/12).');
