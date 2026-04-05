import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { cookies } from 'next/headers';

// PUT /api/admin/users/[userId] — Cập nhật thông tin nhân viên
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const supabase = createServerClient();
    const { userId } = await params;

    // Verify admin
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('session');
    if (!sessionCookie) {
      return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Chưa đăng nhập' } }, { status: 401 });
    }
    const session = JSON.parse(sessionCookie.value);
    if (session.role !== 'admin') {
      return NextResponse.json({ success: false, error: { code: 'FORBIDDEN', message: 'Không có quyền' } }, { status: 403 });
    }

    const body = await req.json();
    const updates: Record<string, unknown> = {};

    // Map allowed fields
    if (body.fullName !== undefined) updates.full_name = body.fullName.trim();
    if (body.email !== undefined) updates.email = body.email.toLowerCase().trim();
    if (body.role !== undefined) updates.role = body.role;
    if (body.departmentId !== undefined) updates.department_id = body.departmentId || null;
    if (body.teamId !== undefined) updates.team_id = body.teamId || null;
    if (body.positionId !== undefined) updates.position_id = body.positionId || null;
    if (body.employmentType !== undefined) updates.employment_type = body.employmentType;
    if (body.status !== undefined) updates.status = body.status;
    if (body.password !== undefined && body.password.length > 0) {
      updates.password_hash = body.password; // In production, hash this!
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ success: false, error: { code: 'VALIDATION', message: 'Không có thông tin cần cập nhật' } }, { status: 400 });
    }

    // Check email duplicate if email is being changed
    if (updates.email) {
      const { data: existing } = await supabase
        .from('users')
        .select('id')
        .eq('email', updates.email)
        .neq('id', userId)
        .single();
      if (existing) {
        return NextResponse.json({ success: false, error: { code: 'DUPLICATE', message: 'Email đã tồn tại' } }, { status: 409 });
      }
    }

    const { error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', userId);

    if (error) throw error;

    return NextResponse.json({ success: true, data: { message: 'Cập nhật thành công' } });
  } catch (err) {
    console.error('PUT /api/admin/users/[userId] error:', err);
    return NextResponse.json({ success: false, error: { code: 'SERVER_ERROR', message: 'Lỗi server' } }, { status: 500 });
  }
}

// DELETE /api/admin/users/[userId] — Xoá nhân viên
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const supabase = createServerClient();
    const { userId } = await params;

    // Verify admin
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('session');
    if (!sessionCookie) {
      return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Chưa đăng nhập' } }, { status: 401 });
    }
    const session = JSON.parse(sessionCookie.value);
    if (session.role !== 'admin') {
      return NextResponse.json({ success: false, error: { code: 'FORBIDDEN', message: 'Không có quyền' } }, { status: 403 });
    }

    // Prevent self-deletion
    if (userId === session.id) {
      return NextResponse.json({ success: false, error: { code: 'VALIDATION', message: 'Không thể xoá chính mình' } }, { status: 400 });
    }

    // Delete related data first (progress, quiz attempts)
    await supabase.from('quiz_attempt_answers')
      .delete()
      .in('attempt_id', 
        (await supabase.from('quiz_attempts').select('id').eq('user_id', userId)).data?.map((a: { id: string }) => a.id) || []
      );
    await supabase.from('quiz_attempts').delete().eq('user_id', userId);
    await supabase.from('user_progress').delete().eq('user_id', userId);

    // Delete user
    const { error } = await supabase.from('users').delete().eq('id', userId);
    if (error) throw error;

    return NextResponse.json({ success: true, data: { message: 'Xoá nhân viên thành công' } });
  } catch (err) {
    console.error('DELETE /api/admin/users/[userId] error:', err);
    return NextResponse.json({ success: false, error: { code: 'SERVER_ERROR', message: 'Lỗi server' } }, { status: 500 });
  }
}
