import { NextResponse } from 'next/server';
import { requireAuth, hashPassword } from '@/lib/auth';
import { getUserById, updateUserPassword } from '@/lib/db';
import bcrypt from 'bcryptjs';

export async function POST(request: Request) {
  try {
    const session = await requireAuth();
    const { currentPassword, newPassword } = await request.json();

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { success: false, error: { code: 'BAD_REQUEST', message: 'Vui lòng điền đầy đủ thông tin.' } },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_PASSWORD', message: 'Mật khẩu mới phải có ít nhất 6 ký tự.' } },
        { status: 400 }
      );
    }

    // Lấy user data hiện tại (bao gồm password_hash)
    const user = await getUserById(session.id);
    if (!user) {
      return NextResponse.json(
        { success: false, error: { code: 'USER_NOT_FOUND', message: 'Không tìm thấy người dùng.' } },
        { status: 404 }
      );
    }

    // So sánh password hiện tại (hỗ trợ cả plaintext cũ và bcrypt hash)
    let passwordMatch = false;
    if (user.password.startsWith('$2a$') || user.password.startsWith('$2b$')) {
      passwordMatch = await bcrypt.compare(currentPassword, user.password);
    } else {
      passwordMatch = user.password === currentPassword;
    }

    if (!passwordMatch) {
      return NextResponse.json(
        { success: false, error: { code: 'INCORRECT_PASSWORD', message: 'Mật khẩu hiện tại không chính xác.' } },
        { status: 401 }
      );
    }

    // Hash mật khẩu mới và cập nhật database
    const newPasswordHash = await hashPassword(newPassword);
    await updateUserPassword(session.id, newPasswordHash);

    return NextResponse.json({
      success: true,
      message: 'Mật khẩu đã được thay đổi thành công.'
    });

  } catch (error: any) {
    console.error('Change password error:', error);
    if (error.message === 'UNAUTHORIZED') {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Vui lòng đăng nhập lại.' } },
        { status: 401 }
      );
    }
    return NextResponse.json(
      { success: false, error: { code: 'SERVER_ERROR', message: 'Lỗi hệ thống khi đổi mật khẩu.' } },
      { status: 500 }
    );
  }
}
