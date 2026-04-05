import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const env = readFileSync('.env.local', 'utf8');
const url = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.+)/).at(1).trim();
const key = env.match(/SUPABASE_SERVICE_ROLE_KEY=(.+)/).at(1).trim();
const supabase = createClient(url, key);

async function update() {
  const FINAL_HTML = `
<!-- CSS RESET FOR VERCEL -> FIXING GLOBALS.CSS LEAKS -->
<style>
  .premium-table {
    width: 100%;
    border-collapse: separate !important;
    border-spacing: 0 !important;
    margin: 24px 0;
    border: 1px solid #e2e8f0 !important;
    border-radius: 12px !important;
    overflow: hidden !important;
    background-color: #ffffff !important;
    box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05) !important;
  }
  .premium-table th, .premium-table td {
    border: none !important; /* OVERRIDE GLOBALS.CSS */
    padding: 14px !important;
  }
  .premium-table th {
    background-color: #be185d !important;
    color: #ffffff !important;
    text-align: left !important;
    border-bottom: 2px solid #9d174d !important;
  }
  .premium-table.slate th {
    background-color: #334155 !important;
    border-bottom: 2px solid #1e293b !important;
  }
  .premium-table.blue th {
    background-color: #0284c7 !important;
    border-bottom: 2px solid #0369a1 !important;
  }
  .premium-table td {
    color: #0f172a !important;
    background-color: #ffffff !important;
    border-bottom: 1px solid #f1f5f9 !important;
  }
  .premium-table tr:last-child td {
    border-bottom: none !important;
  }
</style>

<h2 style="color: #f8fafc; margin-bottom: 24px;">Sản xuất video TikTok DECOCO 🎬</h2>

<p style="color: #cbd5e1; line-height: 1.6; margin-bottom: 20px;">
  Tài liệu dành riêng cho <strong>Team Content</strong>, quy chuẩn sản xuất video TikTok từ A đến Z — từ chọn địa điểm, ánh sáng đến edit và hiệu ứng.
</p>

<!-- CALLOUT LƯU Ý -->
<div style="background-color: #ffffff !important; color: #0f172a !important; padding: 24px; border-radius: 16px; border-left: 6px solid #be185d !important; margin: 32px 0; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); border: 1px solid #fbcfe8;">
  <p style="margin: 0; font-size: 1.05em; color: #0f172a !important; line-height: 1.5;">
    🎯 <strong style="color: #be185d !important;">Lưu ý quan trọng:</strong> Các mẫu sản phẩm của DECOCO thường được mạ vàng trắng/vàng hồng và đính đá <strong style="color: #be185d !important;">Zircon 5A lấp lánh</strong> => Video cần tôn lên sự tinh tế và sang trọng.
  </p>
</div>

<h3>📍 1. Góc quay & Ánh sáng — Chọn địa điểm</h3>

<table class="premium-table">
  <tr>
    <th style="width: 30%;">Tiêu chí</th>
    <th>Chi tiết kỹ thuật</th>
  </tr>
  <tr>
    <td>🟫 <strong style="color: #be185d !important;">Nền tối màu</strong></td>
    <td>Nền gỗ là đẹp nhất. Tránh nền trắng — làm mất hiệu ứng lấp lánh.</td>
  </tr>
  <tr>
    <td>💡 <strong style="color: #be185d !important;">Đèn rọi</strong></td>
    <td>Cần đèn rọi từ trên xuống. Tránh gần cửa sổ (ánh sáng mặt trời phá hiệu ứng).</td>
  </tr>
  <tr>
    <td>🌟 <strong style="color: #be185d !important;">Ánh sáng vàng</strong></td>
    <td>Chọn độ ấm cao, bàn ghế gỗ màu đậm — tạo tone sang trọng.</td>
  </tr>
</table>

<h4 style="color: #f8fafc;">📋 Danh sách quán cafe đã kiểm duyệt:</h4>

<table class="premium-table slate">
  <tr>
    <th style="width: 60px; text-align: center !important;">STT</th>
    <th>Quán cafe</th>
    <th>Vị trí ngồi</th>
  </tr>
  <tr>
    <td style="text-align: center !important;">1</td>
    <td>Phê Đây — 70 P. Nguyễn Thị Định</td>
    <td>Tầng 2 — gần cầu thang</td>
  </tr>
  <tr>
    <td style="text-align: center !important;">2</td>
    <td>Cheese Coffee — Xuân Thủy</td>
    <td>Tầng 2 — bàn gỗ</td>
  </tr>
  <tr>
    <td style="text-align: center !important;">3</td>
    <td>Hầm Trú Ẩn — Trung Tiền</td>
    <td>Tầng 2 — dãy sofa xanh</td>
  </tr>
  <tr>
    <td style="text-align: center !important;">4</td>
    <td>8Hours — Nguyễn Phong Sắc</td>
    <td>Tầng 1 — sát kệ sách</td>
  </tr>
</table>

<h3>🎥 2. Edit & Hiệu ứng</h3>

<table class="premium-table blue">
  <tr>
    <th style="width: 30%;">Thao tác</th>
    <th>Ghi chú</th>
  </tr>
  <tr>
    <td>Cắt cảnh</td>
    <td>Mỗi cảnh 2–3s.</td>
  </tr>
  <tr>
    <td>Chỉnh màu</td>
    <td>Tone vàng hồng, tăng nét.</td>
  </tr>
  <tr>
    <td>Chỉnh da</td>
    <td>Làm mịn và sáng da tay mẫu.</td>
  </tr>
</table>
`;

  const { error } = await supabase.from('documents').update({ content_html: FINAL_HTML }).eq('id', 'doc-content-san-xuat-video');
  if (error) console.log('❌ Error: ' + error.message);
  else console.log('✅ Final Push Successful');
}

update();
