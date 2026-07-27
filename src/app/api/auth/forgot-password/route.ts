import { NextResponse } from 'next/server';
import { hashPassword } from '@/lib/auth';
import { getUserByEmail, updateUserPassword } from '@/lib/db';
import { sendPasswordResetEmail } from '@/lib/email';

// Tạo mật khẩu ngẫu nhiên an toàn (8 ký tự alphanumeric, tránh ký tự dễ nhầm).
function generatePassword(length = 8): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
  let out = '';
  for (let i = 0; i < length; i++) {
    out += chars[Math.floor(Math.random() * chars.length)];
  }
  return out;
}

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION', message: 'Vui lòng nhập email.' } },
        { status: 400 }
      );
    }

    const user = await getUserByEmail(email.trim());
    if (!user) {
      return NextResponse.json(
        { success: false, error: { code: 'EMAIL_NOT_FOUND', message: 'Email không tồn tại trong hệ thống.' } },
        { status: 404 }
      );
    }

    // Sinh mật khẩu mới + hash
    const newPassword = generatePassword();
    const newPasswordHash = await hashPassword(newPassword);

    // Gửi email TRƯỚC. Nếu provider đã cấu hình nhưng gửi lỗi -> ném lỗi -> KHÔNG đổi mật khẩu (tránh khóa tài khoản).
    const { delivered } = await sendPasswordResetEmail(user.email, user.fullName, newPassword);

    // Ở Production, nếu email KHÔNG thực sự được gửi (chưa cấu hình RESEND_API_KEY) thì
    // KHÔNG đổi mật khẩu — tránh trường hợp user bị khóa vì không nhận được mật khẩu mới.
    if (!delivered && process.env.NODE_ENV === 'production') {
      return NextResponse.json(
        { success: false, error: { code: 'EMAIL_NOT_CONFIGURED', message: 'Hệ thống gửi email chưa được cấu hình. Vui lòng liên hệ quản trị viên.' } },
        { status: 503 }
      );
    }

    // Chỉ cập nhật DB sau khi email đã gửi (hoặc ở môi trường dev — đã log mật khẩu ra console).
    await updateUserPassword(user.id, newPasswordHash);

    return NextResponse.json({
      success: true,
      message: 'Mật khẩu mới đã được gửi tới email đã đăng ký của bạn.',
    });
  } catch (error) {
    console.error('[FORGOT-PASSWORD] Error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'SERVER_ERROR', message: 'Lỗi hệ thống khi cấp lại mật khẩu. Vui lòng thử lại sau.' } },
      { status: 500 }
    );
  }
}
