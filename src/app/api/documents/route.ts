import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getDocumentsForUser, getUserProgress } from '@/lib/db';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Chưa đăng nhập' } }, { status: 401 });
    }

    const docs = await getDocumentsForUser(user);
    const progress = await getUserProgress(user.id);

    const docsWithProgress = docs.map(doc => {
      const prog = progress.find(p => p.documentId === doc.id);
      return {
        ...doc,
        progress: prog?.status || 'not_started',
        readPercentage: prog?.readPercentage || 0,
      };
    });

    return NextResponse.json({ success: true, data: docsWithProgress });
  } catch {
    return NextResponse.json({ success: false, error: { code: 'SERVER_ERROR', message: 'Lỗi hệ thống' } }, { status: 500 });
  }
}
