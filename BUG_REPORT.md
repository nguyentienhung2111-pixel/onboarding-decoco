# Báo cáo Lỗi — Round 3

## Trạng thái
ĐANG SỬA CHỮA

## Tiêu đề Lỗi
Bảng trong tài liệu bị lỗi text ẩn, mất đường kẻ header (dang-bai) và quay lại khoảng trắng đáy (san-xuat-video) sau đợt fix CSS Round 2.

## Mô tả Lỗi
Sau các lần chỉnh sửa CSS liên tiếp cho `.doc-reader table`, hiện tại phát sinh **2 lỗi mới** trên 2 trang tài liệu khác nhau:

### Lỗi 1 — `doc-content-dang-bai-quan-ly` (Ảnh 1)
- **Text trong bảng không hiển thị** (nội dung các ô trống trắng).
- **Đường kẻ của hàng đầu tiên (header row) không hiển thị**.
- Bảng trông như khung trống chỉ có 2 header text nhỏ ("Bước", "Thao tác").

### Lỗi 2 — `doc-content-san-xuat-video` (Ảnh 2)
- **Khoảng trắng thừa ở đáy bảng** quay trở lại (~24px gap).
- Lỗi này đã từng được fix ở Round 2 nhưng nay tái phát.

## Các bước tái hiện
1. Mở `https://onboarding-decoco.vercel.app/documents/doc-content-dang-bai-quan-ly`
2. Cuộn đến bảng "6 bước đăng LIVE Highlights" → text trong cells bị ẩn.
3. Mở `https://onboarding-decoco.vercel.app/documents/doc-content-san-xuat-video`
4. Cuộn đến bất kỳ bảng nào → thấy khoảng trắng dưới đáy bảng.

## Kết quả Thực tế vs Kết quả Mong đợi
| Trang | Thực tế | Mong đợi |
|---|---|---|
| dang-bai | Text ẩn, header row mất border | Text hiển thị rõ, header row có màu nền + border |
| san-xuat-video | Khoảng trắng đáy quay lại | Bảng kín khít, không gap |

## Ngữ cảnh & Môi trường
- Dark mode UI, content render qua `dangerouslySetInnerHTML`.
- CSS: `globals.css` dòng 773–807.
- Hai tài liệu có **cấu trúc HTML hoàn toàn khác nhau** trong database.

---

## Phân tích Nguyên nhân Gốc rễ (Root Cause Analysis)

### Vấn đề cốt lõi: Hai tài liệu dùng cấu trúc HTML khác nhau, nhưng CSS global áp dụng đồng nhất

```
┌─────────────────────────────────────────────────────────┐
│                  globals.css (hiện tại)                  │
│                                                         │
│  .doc-reader table { background: #fff !important }      │
│  .doc-reader th    { background: #be185d; color: #fff } │
│  .doc-reader td    { border-bottom: 1px solid #f1f5f9 } │
└──────────┬──────────────────────────┬───────────────────┘
           │                          │
    ┌──────▼──────┐           ┌───────▼──────┐
    │  dang-bai   │           │ san-xuat     │
    │             │           │              │
    │ KHÔNG có    │           │ CÓ wrapper   │
    │ wrapper div │           │ <div> với    │
    │ KHÔNG có    │           │ bg: #fff,    │
    │ class       │           │ border,      │
    │ premium     │           │ border-radius│
    │             │           │              │
    │ Header: bg  │           │ CÓ class     │
    │ #fbcfe8     │           │ premium-table│
    │ (màu hồng  │           │              │
    │  nhạt)      │           │ CÓ <style>   │
    │             │           │ inline trong │
    │ Text color: │           │ HTML         │
    │ KHÔNG set   │           │              │
    │ trên <td>   │           │ Mỗi <td> có  │
    │             │           │ color inline │
    └──────┬──────┘           └───────┬──────┘
           │                          │
    ┌──────▼──────────────────────────▼──────┐
    │          KẾT QUẢ RENDER                │
    │                                        │
    │ dang-bai:                               │
    │  • th bg: #be185d THẮNG #fbcfe8        │
    │    (cả hai !important nhưng CSS class   │
    │    .doc-reader th specificity cao hơn   │
    │    inline .fbcfe8 → header bị đổi màu) │
    │  • td text: var(--gray-700) = sáng     │
    │    + bg #ffffff → TEXT TRẮNG TRÊN TRẮNG│
    │    (vì td không có inline color,        │
    │    thừa kế từ doc-reader p color)       │
    │                                        │
    │ san-xuat:                               │
    │  • Wrapper div có bg #fff              │
    │  • Table có bg #fff (from globals)     │
    │  • margin-bottom 24px tạo gap          │
    │    TRONG wrapper div                   │
    └────────────────────────────────────────┘
```

### Chi tiết từng lỗi:

#### Lỗi 1: Text ẩn trong `dang-bai`
- HTML dang-bai: `<td style="border: 1px solid #fbcfe8; padding: 12px;">...text...</td>`
- Các `<td>` **KHÔNG có `color` inline** → thừa kế từ `.doc-reader` (= `var(--gray-700)`, sáng trên dark mode).
- **NHƯNG** globals.css bây giờ ép `background-color: #ffffff !important` lên `table` → nền trắng.
- Đồng thời `.doc-reader th { background-color: #be185d }` **ghi đè** header nhạt `#fbcfe8` ban đầu.
- Kết quả: text sáng (`var(--gray-700)` ~ ghi nhạt) trên nền trắng → **gần như không thấy**.

#### Lỗi 2: Khoảng trắng đáy trong `san-xuat`
- HTML san-xuat bọc bảng trong `<div style="background: #fff; border-radius: 16px; overflow: hidden; ...">`.
- globals.css ép `margin-bottom: 24px !important` lên `<table>`.
- Khoảng margin 24px nằm **bên trong** wrapper div (vì div overflow:hidden) → tạo gap trắng.

### File liên quan:
- `src/app/globals.css` dòng 773–807: các rule `.doc-reader table/th/td`.
- `debug_dang_bai.html`: HTML tài liệu dang-bai (inline styles, KHÔNG có class, KHÔNG có wrapper).
- `debug_san_xuat.html`: HTML tài liệu san-xuat (có class `premium-table`, có wrapper `<div>`, có `<style>` inline).

---

## Đề xuất Sửa lỗi (Proposed Fixes)

### ⭐ Phương án Khuyến nghị: CSS "Nhẹ nhàng" — Không ghi đè màu cell

**Nguyên tắc:** `.doc-reader table` CSS chỉ nên xử lý **layout** (border-collapse, border-radius, spacing, shadow). **KHÔNG** nên ép `background-color` hay `color` cho `th`/`td` vì mỗi tài liệu có palette riêng thông qua inline styles.

```css
/* ===== globals.css — THAY THẾ TOÀN BỘ BLOCK .doc-reader table (dòng 773-807) ===== */

/* --- Table container --- */
.doc-reader table {
  width: 100% !important;
  border-collapse: separate !important;
  border-spacing: 0 !important;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 0 0 1px var(--gray-200), 0 2px 8px rgba(0,0,0,0.10);
  /* KHÔNG set background-color — để inline style hoặc transparent quyết định */
  /* KHÔNG set margin-bottom — sẽ xử lý riêng bên dưới */
}

/* Margin: chỉ khi table KHÔNG nằm trong wrapper div (dang-bai style) */
/* Khi nằm trong wrapper, wrapper đã có margin riêng */
.doc-reader table {
  margin-bottom: 24px;
}

/* --- Cell base --- */
.doc-reader th,
.doc-reader td {
  text-align: left;
  font-size: 14px;
  vertical-align: middle;
  line-height: 1.55;
  /* KHÔNG ép padding — inline style đã có */
  /* KHÔNG ép color — inline style đã có */
  /* KHÔNG ép background — inline style đã có */
}

/* --- Fallback cho cell KHÔNG có inline color (dang-bai case) --- */
.doc-reader td:not([style*="color"]) {
  color: #1e293b !important;  /* Đậm, đọc được trên nền trắng lẫn nền sáng */
}

/* --- Fallback cho cell KHÔNG có inline background (dang-bai case) --- */
.doc-reader td:not([style*="background"]) {
  background-color: #ffffff;  /* Nền trắng mặc định cho cell */
}

/* --- Header fallback --- */
.doc-reader th:not([style*="background"]) {
  background-color: #be185d;  /* Mặc định pink nếu header không có bg */
  color: #ffffff;
}

/* --- Hàng cuối: KHÔNG thêm border-bottom vì inline đã quản lý --- */

/* --- Fix white gap: table trong wrapper div --- */
.doc-reader div[style*="overflow: hidden"] > table,
.doc-reader div[style*="overflow:hidden"] > table {
  margin-bottom: 0 !important;  /* Trong wrapper → không margin */
}
```

### Tại sao phương án này giải quyết cả 2 lỗi:

| Vấn đề | Cách giải quyết |
|---|---|
| Text ẩn (dang-bai) | `td:not([style*="color"])` fallback → ép `#1e293b` (đậm) chỉ khi cell không có inline color |
| Header sai màu (dang-bai) | `th:not([style*="background"])` → chỉ set bg mặc định khi header KHÔNG có inline bg → header dang-bai giữ `#fbcfe8` gốc |
| Khoảng trắng đáy (san-xuat) | `div[style*="overflow: hidden"] > table { margin: 0 }` → table trong wrapper không có margin |
| Không ảnh hưởng product-training | Tài liệu product-training cũng dùng inline styles → `:not()` selector sẽ skip các cell đã có style |

---

## Kế hoạch Xác minh
1. Sau khi áp fix, kiểm tra `doc-content-dang-bai-quan-ly`:
   - Text trong bảng hiển thị rõ ràng (màu đậm trên nền trắng).
   - Header row giữ nguyên màu hồng nhạt (#fbcfe8) gốc, KHÔNG bị đổi sang #be185d.
   - Các bảng có khoảng cách 24px với nội dung bên dưới.
2. Kiểm tra `doc-content-san-xuat-video`:
   - Bảng KHÔNG có khoảng trắng đáy (vì nằm trong wrapper div).
   - Header giữ nguyên màu inline (#ec4899, #334155, #0284c7).
3. Kiểm tra `doc-content-product-training`:
   - Bảng hiển thị đúng palette (cam, tím, teal).
   - Không bị lỗi mới.
4. DevTools: Inspect computed styles trên `<td>` để xác nhận `:not()` selector hoạt động đúng.
