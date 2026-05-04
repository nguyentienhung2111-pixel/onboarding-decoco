# Báo cáo Lỗi
## Trạng thái
ĐANG SỬA CHỮA

## Tiêu đề Lỗi
Bảng bị mất đường kẻ đáy, hở góc dưới và dính vào nội dung phía sau sau đợt cập nhật CSS Round 2.

## Mô tả Lỗi
Sau khi áp dụng bản vá "Round 2" để sửa khoảng trắng thừa dưới bảng, một số tác dụng phụ nghiêm trọng đã xuất hiện trên các trang tài liệu khác (`doc-content-dang-bai-quan-ly`, `doc-content-product-training`):
1.  **Mất đường kẻ đáy:** Các bảng không hiển thị rõ đường viền phía dưới cùng.
2.  **Hở góc dưới:** Do sử dụng `border-collapse: separate` và `background: transparent`, phần góc bo tròn của bảng bị lộ nền tối của ứng dụng (tạo cảm giác bị hở) thay vì liền mạch với màu của các ô.
3.  **Dính nội dung:** Thuộc tính `margin-bottom: 0 !important` áp dụng toàn cục cho bảng trong `.doc-reader` khiến các bảng không có khoảng cách với tiêu đề hoặc đoạn văn bên dưới.

## Các bước tái hiện
1.  Mở tài liệu `doc-content-dang-bai-quan-ly` hoặc `doc-content-product-training`.
2.  Cuộn đến các bảng nội dung.
3.  Quan sát viền dưới, góc dưới và khoảng cách với khối nội dung tiếp theo.

## Kết quả Thực tế vs Kết quả Mong đợi
- **Thực tế:** Bảng dính sát vào text bên dưới, góc bo tròn bị đen (lộ nền), viền đáy mờ nhạt hoặc mất hẳn.
- **Mong đợi:** Bảng có khoảng cách 24px với nội dung dưới, viền đáy rõ nét, các góc bo tròn kín khít và đồng màu với nội dung bảng.

## Ngữ cảnh & Môi trường
- Giao diện: Dark mode (hệ thống) với nội dung tài liệu có nền sáng/trắng.
- Trình duyệt: Chromium-based (Vercel Production).
- File liên quan: `src/app/globals.css` (dòng 773-782).

---

## Phân tích Nguyên nhân Gốc rễ (Root Cause Analysis)
Lỗi do quy tắc CSS quá tiêu cực (aggressive) được thêm vào để sửa lỗi "white gap" trước đó:

```css
/* globals.css */
.doc-reader table {
  border-collapse: separate !important;   /* Gây hở góc nếu cell không có bg */
  background-color: transparent !important; /* Lộ nền tối ở góc bo tròn */
  margin-bottom: 0 !important;           /* Làm dính nội dung */
}
```

### Luồng lỗi:
`Table (Transparent)` -> `Cell (White)` -> `Rounded Corner (Transparent Table + White Cell)`
=> Tại góc bo tròn, Cell không phủ hết được phần bo của Table, dẫn đến lộ nền tối của `doc-reader`.

### Minh họa (ASCII):
```
Table Boundary (Rounded)
/-------------------\
| Cell White Background |
|                       |
\_______________________/  <-- Góc này bị "hở" vì Cell không bo tròn 
                               cùng lúc với Table.
```

---

## Đề xuất Sửa lỗi (Proposed Fixes)

### Phương án: Chuyển Style Premium vào globals.css (Khuyến nghị)
Thay vì inject thẻ `<style>` vào từng tài liệu (dễ gây xung đột và khó quản lý), chúng ta sẽ đưa các quy tắc của `.premium-table` vào `globals.css` và áp dụng chúng một cách có hệ thống.

1.  **Chỉnh sửa `globals.css`**:
    - Trả lại `margin-bottom: 24px` cho bảng để có khoảng cách với nội dung dưới.
    - Thiết lập `background-color: #ffffff` cho bảng để xử lý lỗi hở góc.
    - Đảm bảo hàng cuối cùng vẫn có đường kẻ đáy nếu không nằm trong wrapper.
    - Thêm các utility class `.table-slate`, `.table-blue`, `.table-pink` để đổi màu header dễ dàng.

2.  **Cập nhật Content**:
    - Chạy script chuẩn hóa HTML của tất cả tài liệu để sử dụng class `.premium-table` thay vì dùng inline style lộn xộn.

### Chi tiết CSS dự kiến trong `globals.css`:
```css
.doc-reader table {
  width: 100% !important;
  border-collapse: separate !important;
  border-spacing: 0 !important;
  margin-bottom: 24px !important; /* Phục hồi khoảng cách */
  background-color: #ffffff !important; /* Sửa lỗi hở góc */
  border-radius: 12px !important;
  overflow: hidden !important;
  box-shadow: 0 0 0 1px var(--gray-200), 0 2px 8px rgba(0,0,0,0.1);
}

.doc-reader th {
  background-color: #be185d; /* Mặc định màu pink */
  color: #ffffff !important;
  padding: 14px !important;
}

.doc-reader td {
  padding: 14px !important;
  border-bottom: 1px solid #f1f5f9 !important; /* Đảm bảo có line đáy */
}

.doc-reader tr:last-child td {
  border-bottom: none !important; /* Hàng cuối không cần line vì đã có border của table */
}
```

## Kế hoạch Xác minh
1.  **Verify Visuals**: Kiểm tra tất cả 3 trang tài liệu (`san-xuat-video`, `dang-bai`, `product-training`) xem bảng đã đồng nhất chưa.
2.  **Verify Spacing**: Đảm bảo sau bảng có khoảng trống hợp lý với block tiếp theo.
3.  **Verify Integrity**: Kiểm tra kỹ các góc bo tròn và đường kẻ đáy của hàng cuối cùng.
