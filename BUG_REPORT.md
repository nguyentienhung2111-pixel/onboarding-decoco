# Báo cáo Lỗi

## Trạng thái
ĐÃ SỬA ✅

## Tiêu đề Lỗi
Thiếu bộ lọc Phòng ban, Team, Vị trí trên Admin Dashboard

## Mô tả Lỗi
Trang Admin Dashboard (`/admin`) hiển thị danh sách tất cả các nhân viên mới đang tham gia quá trình onboarding, tuy nhiên giao diện chưa cung cấp các công cụ lọc theo Phòng ban, Team, và Vị trí. Điều này gây khó khăn cho Admin/Manager khi cần quản lý và theo dõi tiến độ của các nhóm nhân sự cụ thể khi quy mô nhân sự lớn.

## Các bước tái hiện
1. Đăng nhập vào hệ thống dưới quyền Admin hoặc Manager.
2. Truy cập vào trang quản trị Admin Dashboard tại đường dẫn `/admin`.
3. Kiểm tra phần bảng danh sách "Nhân viên mới": bảng chỉ hiển thị danh sách tĩnh, không có thanh công cụ lọc.

## Kết quả Thực tế vs Kết quả Mong đợi
- **Kết quả Thực tế:** Không có bộ lọc nào được cung cấp. Quản trị viên phải cuộn qua toàn bộ danh sách để tìm kiếm nhân sự mong muốn.
- **Kết quả Mong đợi:** Cung cấp bộ lọc Phòng ban, Team, Vị trí ở phía trên bảng danh sách nhân viên để lọc danh sách động trên client-side, đồng thời có thể xoá bộ lọc (reset) nhanh chóng.

## Ngữ cảnh & Môi trường
- **File liên quan:** 
  - `src/app/(admin)/admin/page.tsx` (Thành phần Client UI chính)
- **Môi trường chạy:** Local Development & Production (Next.js App router)

---

## Phân tích Nguyên nhân Gốc rễ (Root Cause Analysis)
Trang Admin Dashboard hiện tại (`src/app/(admin)/admin/page.tsx`) trực tiếp hiển thị danh sách lấy về từ API:
```typescript
const [data, setData] = useState<AdminStatsData | null>(null);
// ...
{data.users.map((user: AdminUserRow, i: number) => ( ... ))}
```
Chưa có cơ chế lưu trữ state cho các tiêu chí lọc, chưa xây dựng các thẻ `<select>` cho bộ lọc, và chưa có logic lọc danh sách `data.users` trước khi đưa vào hàm `map` để render.

### Sơ đồ Luồng dữ liệu (Data Flow Diagram)

```text
[API: /api/admin/stats] 
       │
       ▼ (data.users)
┌────────────────────────────────────────────────────────┐
│ State: data                                            │
│   ├── selectedDept: "" (Tất cả)                        │
│   ├── selectedTeam: "" (Tất cả)                        │
│   └── selectedPosition: "" (Tất cả)                    │
└──────────────────────────┬─────────────────────────────┘
                           │
                           ▼ Lọc danh sách (client-side)
┌────────────────────────────────────────────────────────┐
│ filteredUsers                                          │
│   ├── Lọc theo selectedDept                            │
│   ├── Lọc theo selectedTeam                            │
│   └── Lọc theo selectedPosition                        │
└──────────────────────────┬─────────────────────────────┘
                           │
                           ▼ Render
┌────────────────────────────────────────────────────────┐
│ Bảng nhân viên (Chỉ hiển thị filteredUsers)            │
└────────────────────────────────────────────────────────┘
```

---

## Đề xuất Sửa lỗi (Proposed Fixes)

### Phương án 1 (Khuyến nghị): Lọc client-side phân cấp động (Dynamic Hierarchical Filtering)
Thiết lập bộ lọc trực tiếp bằng cách sử dụng các giá trị thực tế có sẵn từ mảng `data.users`.
- **Ưu điểm:** Tốc độ phản hồi tức thì (tải cực nhanh do không cần gọi API nhiều lần), không cần sửa đổi API hiện có, và các option trong dropdown sẽ tự động cập nhật phân cấp (ví dụ: chỉ hiện các Team thuộc Phòng ban đã chọn).

**Chi tiết các thay đổi:**
1. Khai báo các state bộ lọc trong `AdminDashboardPage`:
   ```typescript
   const [selectedDept, setSelectedDept] = useState('');
   const [selectedTeam, setSelectedTeam] = useState('');
   const [selectedPosition, setSelectedPosition] = useState('');
   ```

2. Tính toán danh sách các Option động dựa trên dữ liệu người dùng hiện có:
   ```typescript
   // Lấy danh sách phòng ban duy nhất
   const departments = Array.from(new Set(data.users.map(u => u.department).filter(Boolean)));
   
   // Lọc danh sách team dựa trên phòng ban đang được chọn
   const teams = Array.from(new Set(
     data.users
       .filter(u => !selectedDept || u.department === selectedDept)
       .map(u => u.team)
       .filter(Boolean)
   ));
   
   // Lọc danh sách vị trí dựa trên phòng ban và team đang được chọn
   const positions = Array.from(new Set(
     data.users
       .filter(u => (!selectedDept || u.department === selectedDept) && (!selectedTeam || u.team === selectedTeam))
       .map(u => u.position)
       .filter(Boolean)
   ));
   ```

3. Lọc danh sách hiển thị:
   ```typescript
   const filteredUsers = data.users.filter(user => {
     const matchDept = !selectedDept || user.department === selectedDept;
     const matchTeam = !selectedTeam || user.team === selectedTeam;
     const matchPos = !selectedPosition || user.position === selectedPosition;
     return matchDept && matchTeam && matchPos;
   });
   ```

4. Giao diện bộ lọc:
   Thiết kế một thanh bộ lọc nằm ngang (Flex row) phía trên bảng "Nhân viên mới" với 3 dropdown sử dụng style thống nhất với trang quản lý user và một nút "Xoá bộ lọc" (kèm icon `RotateCcw` hoặc `X`) chỉ xuất hiện khi có bất kỳ bộ lọc nào được chọn.

5. Reset thông minh:
   Khi thay đổi Phòng ban, tự động clear các bộ lọc Team và Vị trí. Khi thay đổi Team, tự động clear Vị trí.

---

## Kế hoạch Xác minh
1. **Kiểm tra giao diện:** Thanh bộ lọc hiển thị đẹp mắt, đồng bộ phong cách với trang `/admin/users`.
2. **Kiểm tra chức năng lọc:**
   - Chọn Phòng ban "Phòng Marketing" -> Bảng chỉ hiển thị các nhân viên thuộc Marketing.
   - Dropdown Team chỉ hiển thị các team thuộc Marketing (ví dụ: Team Content, Team Booking).
   - Chọn tiếp Team "Team Content" -> Bảng chỉ hiển thị nhân sự thuộc Team Content.
3. **Kiểm tra nút xoá bộ lọc:** Khi bấm nút "Xoá bộ lọc", các dropdown quay lại giá trị mặc định và bảng hiển thị toàn bộ nhân viên.

---

## Kết quả Sửa lỗi

### Thay đổi đã thực hiện (Minimal changes)
**File:** `src/app/(admin)/admin/page.tsx`
- Thêm import icon `RotateCcw`.
- Thêm 3 state lọc: `selectedDept`, `selectedTeam`, `selectedPosition`.
- Tính option động phân cấp: `departments` → `teams` (theo phòng ban) → `positions` (theo phòng ban + team).
- Tính `filteredUsers` từ `data.users` và render danh sách đã lọc thay cho `data.users`.
- Thêm thanh bộ lọc 3 dropdown + nút "Xoá bộ lọc" (chỉ hiện khi có bộ lọc), dùng `selectStyle`/`optionStyle` đồng bộ với `/admin/users`.
- Reset thông minh: đổi Phòng ban tự xoá Team + Vị trí; đổi Team tự xoá Vị trí.
- Cập nhật đếm `{filteredUsers.length}/{data.users.length} người` và thông báo rỗng khi không khớp bộ lọc.

Không sửa API, không refactor phần khác.

### Xác minh — Kết quả: **Thành công ✅**

1. **Type-check** (`npx tsc --noEmit`): PASS (exit 0), không lỗi.
2. **Lint** (`npx eslint src/app/(admin)/admin/page.tsx`): PASS (exit 0), không cảnh báo.
3. **Test logic lọc** (`node scripts/test-admin-filters.mjs`): 7/7 PASS.

```
  ✓ Không lọc: hiển thị tất cả
  ✓ Departments duy nhất, bỏ rỗng
  ✓ Lọc Marketing -> 3 người
  ✓ Team chỉ hiện của Marketing
  ✓ Vị trí theo Marketing/Team Content
  ✓ Marketing + Team Content -> 2 người
  ✓ Marketing + Team Content + Trưởng nhóm -> 1 người

7/7 test PASS ✅
```

Test này chứng minh: lọc phân cấp đúng, option tự cập nhật theo lựa chọn cha, và giá trị rỗng bị loại khỏi dropdown.
