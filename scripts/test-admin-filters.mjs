// Test tái hiện logic lọc client-side của Admin Dashboard (BUG_REPORT.md)
// Chạy: node scripts/test-admin-filters.mjs
import assert from 'node:assert';

const users = [
  { id: '1', department: 'Phòng Marketing', team: 'Team Content', position: 'Nhân viên' },
  { id: '2', department: 'Phòng Marketing', team: 'Team Content', position: 'Trưởng nhóm' },
  { id: '3', department: 'Phòng Marketing', team: 'Team Booking', position: 'Nhân viên' },
  { id: '4', department: 'Phòng Sản xuất', team: 'Team A', position: 'Nhân viên' },
  { id: '5', department: '', team: '', position: '' }, // dữ liệu rỗng
];

// --- Sao chép nguyên logic từ src/app/(admin)/admin/page.tsx ---
function computeOptions(selectedDept, selectedTeam) {
  const departments = Array.from(new Set(users.map(u => u.department).filter(Boolean)));
  const teams = Array.from(new Set(
    users.filter(u => !selectedDept || u.department === selectedDept).map(u => u.team).filter(Boolean)
  ));
  const positions = Array.from(new Set(
    users.filter(u => (!selectedDept || u.department === selectedDept) && (!selectedTeam || u.team === selectedTeam))
      .map(u => u.position).filter(Boolean)
  ));
  return { departments, teams, positions };
}
function filterUsers(selectedDept, selectedTeam, selectedPosition) {
  return users.filter(u =>
    (!selectedDept || u.department === selectedDept) &&
    (!selectedTeam || u.team === selectedTeam) &&
    (!selectedPosition || u.position === selectedPosition)
  );
}

let pass = 0;
function check(name, fn) { fn(); pass++; console.log(`  ✓ ${name}`); }

// 1. Không lọc -> hiển thị toàn bộ
check('Không lọc: hiển thị tất cả', () => {
  assert.strictEqual(filterUsers('', '', '').length, 5);
});

// 2. Departments duy nhất, bỏ giá trị rỗng
check('Departments duy nhất, bỏ rỗng', () => {
  const { departments } = computeOptions('', '');
  assert.deepStrictEqual(departments, ['Phòng Marketing', 'Phòng Sản xuất']);
});

// 3. Lọc theo phòng ban Marketing
check('Lọc Marketing -> 3 người', () => {
  assert.strictEqual(filterUsers('Phòng Marketing', '', '').length, 3);
});

// 4. Team option phân cấp theo phòng ban đã chọn
check('Team chỉ hiện của Marketing', () => {
  const { teams } = computeOptions('Phòng Marketing', '');
  assert.deepStrictEqual(teams, ['Team Content', 'Team Booking']);
});

// 5. Position phân cấp theo phòng ban + team
check('Vị trí theo Marketing/Team Content', () => {
  const { positions } = computeOptions('Phòng Marketing', 'Team Content');
  assert.deepStrictEqual(positions, ['Nhân viên', 'Trưởng nhóm']);
});

// 6. Lọc chồng: Marketing + Team Content -> 2 người
check('Marketing + Team Content -> 2 người', () => {
  assert.strictEqual(filterUsers('Phòng Marketing', 'Team Content', '').length, 2);
});

// 7. Lọc 3 tầng chính xác
check('Marketing + Team Content + Trưởng nhóm -> 1 người', () => {
  const r = filterUsers('Phòng Marketing', 'Team Content', 'Trưởng nhóm');
  assert.strictEqual(r.length, 1);
  assert.strictEqual(r[0].id, '2');
});

console.log(`\n${pass}/7 test PASS ✅`);
