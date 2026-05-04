# Báo cáo Lỗi — Round 5

## Trạng thái
ĐÃ SỬA — THÀNH CÔNG

### Kết quả kiểm tra:
- 62 `<td>` đã được bổ sung `color: #0f172a !important; background-color: #ffffff !important;`
- 7 `<th>` header đã chuyển sang nền đậm (`#be185d`) với text trắng
- CSS globals.css đã revert về layout-only (bỏ hết color/background hacks)
- Build Next.js: ✅ Thành công

## Tiêu đề Lỗi
Bảng trong doc-content-dang-bai-quan-ly bị ẩn text do HTML trong database thiếu inline styles cho `<td>`.

## Mô tả Lỗi
Bảng trong tài liệu `doc-content-dang-bai-quan-ly` hiển thị khác hoàn toàn so với `doc-phong-marketing` dù cùng render qua component `doc-reader`. Nguyên nhân gốc rễ **KHÔNG phải CSS globals** mà là **content_html trong database**.

## Các bước tái hiện
1. Mở `doc-content-dang-bai-quan-ly`: Text ẩn, header nhạt.
2. Mở `doc-phong-marketing`: Bảng đẹp, text rõ, header đậm.

## Kết quả Thực tế vs Kết quả Mong đợi
- **Thực tế:** Bảng dang-bai có `<td>` không có inline color/background → thừa kế dark mode (text trắng).
- **Mong đợi:** Tất cả `<td>` phải có `color: #0f172a !important; background-color: #ffffff !important;` giống doc-phong-marketing.

---

## Phân tích Nguyên nhân Gốc rễ (Root Cause Analysis)

### So sánh cấu trúc HTML:

```
doc-phong-marketing (✅ TỐT):
<td style="border-bottom: 1px solid #fbcfe8;
           border-right: 1px solid #fbcfe8;
           padding: 12px;
           color: #0f172a !important;           ← CÓ
           background-color: #ffffff !important; ← CÓ
          ">

doc-content-dang-bai-quan-ly (❌ LỖI):
<td style="border: 1px solid #fbcfe8;
           padding: 12px;
          ">                                     ← THIẾU color, THIẾU background
```

### Luồng lỗi:
```
HTML không có color → thừa kế .doc-reader → var(--gray-900) = #FFFFFF
HTML không có bg    → CSS fallback → #ffffff
→ Kết quả: Text #FFFFFF (trắng) trên nền #ffffff (trắng) → ẨN!
```

## Đề xuất Sửa lỗi (Proposed Fixes)

### ⭐ Phương án Khuyến nghị: Cập nhật content_html trong database
Viết script chuyển đổi HTML của `doc-content-dang-bai-quan-ly` để:
1. Mỗi `<td>` PHẢI có `color: #0f172a !important; background-color: #ffffff !important;`.
2. Mỗi `<th>` giữ nguyên bg header nhạt nhưng đổi sang header đậm giống doc-phong-marketing.
3. Đồng thời revert CSS Round 3/4 (bỏ `td:not([style*="color"])` hack) vì đã xử lý triệt để ở mức dữ liệu.

### CSS sẽ giữ lại:
- Chỉ giữ layout rules (width, border-collapse, border-radius, overflow, box-shadow, margin).
- Bỏ tất cả color/background/font-weight hacks.

## Kế hoạch Xác minh
1. So sánh visual giữa `dang-bai` và `phong-marketing` — phải giống nhau.
2. Kiểm tra `san-xuat-video` và `product-training` không bị ảnh hưởng.
