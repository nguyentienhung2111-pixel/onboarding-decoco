import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getDocumentsForUser, getUserProgress, getUserQuizAttempts } from '@/lib/db';
import type { DocumentWithProgress, UserDashboardData } from '@/lib/types';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Chưa đăng nhập' } }, { status: 401 });
    }

    const docs = await getDocumentsForUser(user);
    const progress = await getUserProgress(user.id);
    const attempts = await getUserQuizAttempts(user.id);

    const documentsWithProgress: DocumentWithProgress[] = docs.map(doc => {
      const prog = progress.find(p => p.documentId === doc.id);
      const docAttempts = attempts.filter(a => a.documentId === doc.id);
      const bestAttempt = docAttempts.length > 0
        ? docAttempts.reduce((best, curr) => curr.score > best.score ? curr : best)
        : null;

      return {
        document: doc,
        progress: prog?.status || 'not_started',
        readPercentage: prog?.readPercentage || 0,
        quizScore: bestAttempt?.score ?? null,
        quizPassed: bestAttempt?.isPassed ?? false,
      };
    });

    const completedCount = documentsWithProgress.filter(d => d.progress === 'quiz_passed').length;

    const dashboardData: UserDashboardData = {
      user,
      totalDocuments: docs.length,
      completedDocuments: completedCount,
      overallProgress: docs.length > 0 ? Math.round((completedCount / docs.length) * 100) : 0,
      documents: documentsWithProgress,
    };

    return NextResponse.json({ success: true, data: dashboardData });
  } catch {
    return NextResponse.json({ success: false, error: { code: 'SERVER_ERROR', message: 'Lỗi hệ thống' } }, { status: 500 });
  }
}
