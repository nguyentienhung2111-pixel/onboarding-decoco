// Helper gửi email. Dùng Resend REST API (không cần thêm dependency).
// Nếu chưa cấu hình RESEND_API_KEY, sẽ fallback log ra console (dev/mock mailer).

interface SendMailParams {
  to: string;
  subject: string;
  html: string;
  text: string;
}

// Trả về { delivered } — delivered=true nếu gửi qua provider thật thành công.
// Ném lỗi nếu provider ĐÃ cấu hình nhưng gửi thất bại (để caller có thể hủy thao tác).
export async function sendMail({ to, subject, html, text }: SendMailParams): Promise<{ delivered: boolean }> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM || 'DECOCO Onboarding <onboarding@resend.dev>';

  if (!apiKey) {
    // Chưa cấu hình provider — fallback log để dev có thể kiểm thử.
    console.warn('[EMAIL] RESEND_API_KEY chưa được cấu hình. Email KHÔNG được gửi thật, log nội dung thay thế:');
    console.warn(`[EMAIL] To: ${to}\n[EMAIL] Subject: ${subject}\n[EMAIL] Body:\n${text}`);
    return { delivered: false };
  }

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ from, to, subject, html, text }),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new Error(`Gửi email thất bại (HTTP ${res.status}): ${detail}`);
  }

  return { delivered: true };
}

// Tạo nội dung & gửi email cấp lại mật khẩu.
export async function sendPasswordResetEmail(
  to: string,
  fullName: string,
  newPassword: string
): Promise<{ delivered: boolean }> {
  const subject = 'DECOCO Onboarding — Mật khẩu mới của bạn';
  const text =
    `Xin chào ${fullName},\n\n` +
    `Bạn (hoặc quản trị viên) đã yêu cầu cấp lại mật khẩu cho tài khoản ${to}.\n` +
    `Mật khẩu mới của bạn là: ${newPassword}\n\n` +
    `Vui lòng đăng nhập và đổi lại mật khẩu ngay để đảm bảo an toàn.\n\n` +
    `— Hệ thống Onboarding DECOCO`;
  const html =
    `<p>Xin chào <strong>${fullName}</strong>,</p>` +
    `<p>Bạn (hoặc quản trị viên) đã yêu cầu cấp lại mật khẩu cho tài khoản <strong>${to}</strong>.</p>` +
    `<p>Mật khẩu mới của bạn là: <strong style="font-size:16px">${newPassword}</strong></p>` +
    `<p>Vui lòng đăng nhập và đổi lại mật khẩu ngay để đảm bảo an toàn.</p>` +
    `<p>— Hệ thống Onboarding DECOCO</p>`;

  return sendMail({ to, subject, html, text });
}
