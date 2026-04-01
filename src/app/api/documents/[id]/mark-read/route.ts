import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { updateProgress } from '@/lib/db';

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Chưa đăng nhập' } }, { status: 401 });
    }

    const { id } = await params;
    const progress = await updateProgress(user.id, id, {
      status: 'read',
      readPercentage: 100,
      markedAsRead: true,
      readAt: new Date().toISOString(),
    });

    return NextResponse.json({ success: true, data: progress });
  } catch {
    return NextResponse.json({ success: false, error: { code: 'SERVER_ERROR', message: 'Lỗi hệ thống' } }, { status: 500 });
  }
}
