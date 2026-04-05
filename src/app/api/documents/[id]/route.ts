import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getDocumentById, getDocProgress, updateProgress } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Chưa đăng nhập' } }, { status: 401 });
    }

    const { id } = await params;
    const doc = await getDocumentById(id);
    if (!doc) {
      return NextResponse.json({ success: false, error: { code: 'NOT_FOUND', message: 'Không tìm thấy tài liệu' } }, { status: 404 });
    }

    const progress = await getDocProgress(user.id, id);

    // Auto-mark as started if not yet
    if (!progress) {
      await updateProgress(user.id, id, { status: 'reading', readPercentage: 0 });
    }

    return NextResponse.json({ success: true, data: { ...doc, progress: progress?.status || 'reading', readPercentage: progress?.readPercentage || 0 } });
  } catch {
    return NextResponse.json({ success: false, error: { code: 'SERVER_ERROR', message: 'Lỗi hệ thống' } }, { status: 500 });
  }
}
