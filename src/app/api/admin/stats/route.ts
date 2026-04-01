import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getUsers, getDocuments, getProgress, getQuizAttempts, getOrgData } from '@/lib/db';
import type { AdminStatsData, AdminUserRow } from '@/lib/types';

export async function GET() {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'manager')) {
      return NextResponse.json({ success: false, error: { code: 'FORBIDDEN', message: 'Không có quyền' } }, { status: 403 });
    }

    const [users, docs, allProgress, allAttempts, orgData] = await Promise.all([
      getUsers(),
      getDocuments(),
      getProgress(),
      getQuizAttempts(),
      getOrgData(),
    ]);

    const publishedDocs = docs.filter(d => d.status === 'published');
    const onboardingUsers = users.filter(u => u.role === 'user');

    const userRows: AdminUserRow[] = onboardingUsers.map(user => {
      // Get docs assigned to this user
      const userDocs = publishedDocs.filter(doc => {
        const a = doc.assignedTo;
        if (a.isGeneral) return true;
        if (a.departmentId && a.departmentId === user.departmentId) return true;
        if (a.teamId && a.teamId === user.teamId) return true;
        return false;
      });

      const userProgress = allProgress.filter(p => p.userId === user.id);
      const completedDocs = userProgress.filter(p => p.status === 'quiz_passed').length;
      const progressPct = userDocs.length > 0 ? Math.round((completedDocs / userDocs.length) * 100) : 0;

      const dept = orgData.departments.find(d => d.id === user.departmentId);
      const team = orgData.teams.find(t => t.id === user.teamId);
      const pos = orgData.positions.find(p => p.id === user.positionId);

      return {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        department: dept?.name || '—',
        team: team?.name || '—',
        position: pos?.name || '—',
        status: user.status,
        progress: progressPct,
        documentsCompleted: completedDocs,
        totalDocuments: userDocs.length,
        onboardingStartDate: user.onboardingStartDate,
      };
    });

    // Calculate averages
    const avgQuizScore = allAttempts.length > 0
      ? Math.round((allAttempts.reduce((sum, a) => sum + a.score, 0) / allAttempts.length) * 10) / 10
      : 0;

    const avgCompletion = userRows.length > 0
      ? Math.round(userRows.reduce((sum, u) => sum + u.progress, 0) / userRows.length)
      : 0;

    const stats: AdminStatsData = {
      totalUsers: onboardingUsers.length,
      onboardingUsers: onboardingUsers.filter(u => u.status === 'onboarding').length,
      completedUsers: onboardingUsers.filter(u => u.status === 'completed').length,
      totalDocuments: publishedDocs.length,
      averageQuizScore: avgQuizScore,
      averageCompletion: avgCompletion,
      users: userRows,
    };

    return NextResponse.json({ success: true, data: stats });
  } catch {
    return NextResponse.json({ success: false, error: { code: 'SERVER_ERROR', message: 'Lỗi hệ thống' } }, { status: 500 });
  }
}
