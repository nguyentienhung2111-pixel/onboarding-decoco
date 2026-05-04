# Báo cáo Lỗi — Round 6

## Trạng thái
ĐÃ SỬA — THÀNH CÔNG

### Kết quả kiểm tra:
- 0 wrapper `<div>` còn lại (đã loại bỏ triệt để)
- 0 `<style>` blocks còn lại
- 0 class `premium-table` còn lại
- 20 `border-right` đã được thêm (đường kẻ dọc phân tách cột)
- 46 `<td>` có color `#0f172a` (text đen)

## Tiêu đề Lỗi
Bảng trong doc-content-san-xuat-video cần chuẩn hóa HTML theo chuẩn doc-phong-marketing.

## Mô tả Lỗi
Bảng trong `doc-content-san-xuat-video` có cấu trúc HTML khác biệt so với chuẩn `doc-phong-marketing`:
- Có wrapper `<div>` bọc ngoài → gây white gap ở đáy.
- Có `<style>` block + class `premium-table` → CSS xung đột.
- Thiếu `border-right` cho `<th>` và `<td>` → không có đường kẻ dọc.

## Phân tích Nguyên nhân Gốc rễ
Cùng lỗi gốc như Round 5: HTML content trong database không đồng nhất giữa các tài liệu.

```
doc-phong-marketing (✅):              san-xuat-video (❌):
<table style="...">                    <div style="bg:#fff; overflow:hidden">
  <tr><th border-right>...</th></tr>     <table class="premium-table">
  <tr><td border-right>...</td></tr>       <tr><th NO border-right>...</th></tr>
</table>                                   <tr><td NO border-right>...</td></tr>
                                         </table>
                                       </div>  ← WRAPPER gây white gap!
```

## Đề xuất Sửa lỗi
1. Xóa wrapper `<div>` bọc ngoài bảng.
2. Xóa `<style>` block + class `premium-table`.
3. Thêm `border-right` cho `<th>` và `<td>` (trừ cột cuối).
4. Thêm `border`, `border-radius`, `overflow: hidden` trực tiếp vào `<table>`.

## Kế hoạch Xác minh
- Fetch HTML sau khi update và đếm số `<td>` có `border-right`.
- So sánh visual trên Vercel.
