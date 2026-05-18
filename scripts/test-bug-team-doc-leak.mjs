// Test script reproducing the team-document permission leak bug.
// Replicates the filter logic in src/lib/db.ts -> getDocumentsForUser
// against an in-memory dataset mirroring sync-all-docs.mjs (all docs share
// assigned_department_id='dept1'). Runs both the OLD (buggy) and NEW (fixed)
// filters and asserts the fix only is correct.

// --- In-memory fixtures (mirror real seed: all docs have dept1) ---
const docs = [
  { id: 'doc-gioi-thieu', doc_type: 'general', is_general: true,
    assigned_department_id: 'dept1', assigned_team_id: null, assigned_position_id: null },
  { id: 'doc-phong-marketing', doc_type: 'department', is_general: false,
    assigned_department_id: 'dept1', assigned_team_id: null, assigned_position_id: null },
  { id: 'doc-team-cskh', doc_type: 'team', is_general: false,
    assigned_department_id: 'dept1', assigned_team_id: 'team3', assigned_position_id: null },
  { id: 'doc-team-livestream', doc_type: 'team', is_general: false,
    assigned_department_id: 'dept1', assigned_team_id: 'team2', assigned_position_id: null },
  { id: 'doc-team-content', doc_type: 'team', is_general: false,
    assigned_department_id: 'dept1', assigned_team_id: 'team1', assigned_position_id: null },
  { id: 'doc-team-booking', doc_type: 'team', is_general: false,
    assigned_department_id: 'dept1', assigned_team_id: 'team4', assigned_position_id: null },
];

const cskhUser = { departmentId: 'dept1', teamId: 'team3', positionId: null };

// --- OLD (buggy) filter ---
function oldFilter(doc, user) {
  if (doc.is_general) return true;
  if (doc.assigned_department_id && doc.assigned_department_id === user.departmentId) return true;
  if (doc.assigned_team_id && doc.assigned_team_id === user.teamId) return true;
  if (doc.assigned_position_id && doc.assigned_position_id === user.positionId) return true;
  return false;
}

// --- NEW (fixed) filter, copied from src/lib/db.ts ---
function newFilter(doc, user) {
  if (doc.is_general) return true;
  if (doc.doc_type === 'team') return doc.assigned_team_id === user.teamId;
  if (doc.doc_type === 'department') return doc.assigned_department_id === user.departmentId;
  if (doc.doc_type === 'position') return doc.assigned_position_id === user.positionId;
  return false;
}

function run(label, filterFn) {
  const visible = docs.filter(d => filterFn(d, cskhUser)).map(d => d.id);
  console.log(`\n[${label}] CSKH user sees:`, visible);
  return visible;
}

const expected = ['doc-gioi-thieu', 'doc-phong-marketing', 'doc-team-cskh'].sort();

const oldVisible = run('OLD (buggy)', oldFilter).sort();
const newVisible = run('NEW (fixed)', newFilter).sort();

const oldLeaks = oldVisible.filter(id => !expected.includes(id));
const newLeaks = newVisible.filter(id => !expected.includes(id));
const newMissing = expected.filter(id => !newVisible.includes(id));

console.log('\n--- Result ---');
console.log('Expected:', expected);
console.log('OLD leaks (should NOT be seen):', oldLeaks);
console.log('NEW leaks (should be empty):', newLeaks);
console.log('NEW missing (should be empty):', newMissing);

if (oldLeaks.length === 0) {
  console.error('\n❌ Test setup invalid: old filter did not reproduce the bug.');
  process.exit(1);
}
if (newLeaks.length !== 0 || newMissing.length !== 0) {
  console.error('\n❌ FAIL: fixed filter is incorrect.');
  process.exit(1);
}
console.log('\n✅ PASS: bug reproduced with old filter and fixed by new filter.');
