# Báo cáo Lỗi — Round 4

## Trạng thái
ĐANG SỬA CHỮA

## Tiêu đề Lỗi
Lỗi hiển thị bảng: Text trắng trên nền trắng (dang-bai) và thiếu đường kẻ dọc phân tách cột (san-xuat-video).

## Mô tả Lỗi
Dù đã áp dụng fix ở Round 3, vẫn còn tồn tại các vấn đề về thẩm mỹ và hiển thị:
1.  **Lỗi Text (dang-bai):** Một số phần text trong bảng vẫn bị ẩn do màu trắng trên nền trắng. Việc ép Bold toàn bộ text không có màu inline (Round 3) bị coi là quá đà. Cần chỉ đổi màu đen + bold cho những phần text "lẽ ra là trắng" để chúng hiện lên, còn text đã đen sẵn thì không được tự ý bold.
2.  **Lỗi Đường kẻ (san-xuat-video):** Các bảng trong tài liệu này thiếu đường kẻ dọc phân tách giữa các cột, khiến việc phân biệt nội dung giữa "Thao tác" và "Chi tiết" khó khăn. Người dùng muốn các đường kẻ này hiện rõ và có màu đen.

## Các bước tái hiện
1.  Mở tài liệu `doc-content-dang-bai-quan-ly`: Quan sát bảng "6 bước đăng LIVE Highlights", thấy text bị ẩn hoặc bị bold quá mức.
2.  Mở tài liệu `doc-content-san-xuat-video`: Quan sát các bảng, thấy thiếu đường kẻ dọc giữa các cột.

## Kết quả Thực tế vs Kết quả Mong đợi
- **Thực tế:** Text bảng bị ẩn hoặc bold vô tội vạ; bảng san-xuat-video trông "trống trải" vì thiếu viền dọc.
- **Mong đợi:** Text "ẩn" (trắng) phải hiện lên màu đen + bold; text "hiện" (đen) giữ nguyên style; bảng san-xuat-video có đường kẻ dọc màu đen rõ ràng.

## Ngữ cảnh & Môi trường
- File: `src/app/globals.css`.
- Tài liệu: `doc-content-dang-bai-quan-ly` và `doc-content-san-xuat-video`.

---

## Phân tích Nguyên nhân Gốc rễ (Root Cause Analysis)

### 1. Vấn đề Text ẩn (dang-bai):
Do `.doc-reader strong` và text mặc định trong `doc-reader` có màu trắng (`var(--gray-900)`), khi bảng có nền trắng (`#ffffff`), chúng trở nên vô hình.
Rule `td:not([style*="color"])` ở Round 3 quá mạnh khi ép `font-weight: 700` cho TOÀN BỘ text trong cell.

### 2. Vấn đề Đường kẻ dọc (san-xuat-video):
Do `border-collapse: separate` và `border-spacing: 0`, các đường kẻ dọc (`border-right`) không được định nghĩa rõ ràng hoặc bị ghi đè bởi inline styles chỉ có `border-bottom`.

---

## Đề xuất Sửa lỗi (Proposed Fixes)

### 1. Cải thiện hiển thị Text (Khuyến nghị):
- Hoàn tác việc ép `font-weight: 700` toàn cục cho `td`.
- Chỉ áp dụng `color: #000000` và `font-weight: bold` cho các thẻ con bên trong `td` mà thường mang màu trắng (như `strong`) khi ở trong môi trường bảng nền trắng.
- Sử dụng selector thông minh hơn để phân biệt text trắng và đen (dựa trên việc không có inline color).

### 2. Bổ sung đường kẻ dọc cho san-xuat-video:
- Thêm quy tắc CSS cho `.doc-reader td:not(:last-child)` để vẽ đường kẻ dọc màu đen (`1px solid #000000`).
- Đảm bảo quy tắc này không phá vỡ bo góc của bảng.

### Chi tiết CSS dự kiến:
```css
/* Trả lại font-weight bình thường, chỉ ép màu đen cho cell không có style color */
.doc-reader td:not([style*="color"]) {
  color: #000000 !important;
  font-weight: 400; /* Trả về bình thường */
}

/* Chỉ Bold những phần "cần nhấn mạnh" hoặc vốn là màu trắng bị ẩn */
.doc-reader td:not([style*="color"]) strong {
  color: #000000 !important;
  font-weight: 700 !important;
}

/* Đường kẻ dọc cho bảng */
.doc-reader table td:not(:last-child), 
.doc-reader table th:not(:last-child) {
  border-right: 1px solid #000000 !important;
}
```

## Kế hoạch Xác minh
1.  Kiểm tra `dang-bai`: Xác nhận text thường màu đen, không bold; text quan trọng (strong) màu đen và bold.
2.  Kiểm tra `san-xuat-video`: Xác nhận có đường kẻ dọc đen giữa các cột.
3.  Kiểm tra các trang tài liệu khác để đảm bảo không bị ảnh hưởng tiêu cực.
