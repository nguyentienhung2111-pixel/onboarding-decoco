import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { requireAdmin, hashPassword } from '@/lib/auth';

// GET /api/admin/users — Lấy danh sách tất cả nhân viên + org data
export async function GET() {
  try {
    // Verify admin role using auth library (handles decoco_session cookie)
    await requireAdmin();
    
    const supabase = createServerClient();

    // Fetch users + org data in parallel
    const [usersRes, deptRes, teamRes, posRes] = await Promise.all([
      supabase.from('users').select('*').order('created_at', { ascending: false }),
      supabase.from('departments').select('*').order('sort_order'),
      supabase.from('teams').select('*').order('sort_order'),
      supabase.from('positions').select('*').order('sort_order'),
    ]);

    if (usersRes.error) throw usersRes.error;
    if (deptRes.error) throw deptRes.error;
    if (teamRes.error) throw teamRes.error;
    if (posRes.error) throw posRes.error;

    const users = (usersRes.data || []).map((row: Record<string, unknown>) => ({
      id: row.id,
      email: row.email,
      fullName: row.full_name,
      role: row.role,
      departmentId: row.department_id,
      teamId: row.team_id,
      positionId: row.position_id,
      employmentType: row.employment_type,
      status: row.status,
      onboardingStartDate: row.onboarding_start_date,
      createdAt: row.created_at,
    }));

    const orgData = {
      departments: (deptRes.data || []).map((d: Record<string, unknown>) => ({
        id: d.id, name: d.name, sortOrder: d.sort_order,
      })),
      teams: (teamRes.data || []).map((t: Record<string, unknown>) => ({
        id: t.id, name: t.name, departmentId: t.department_id, sortOrder: t.sort_order,
      })),
      positions: (posRes.data || []).map((p: Record<string, unknown>) => ({
        id: p.id, name: p.name, departmentId: p.department_id,
        teamId: p.team_id, employmentType: p.employment_type, sortOrder: p.sort_order,
      })),
    };

    return NextResponse.json({ success: true, data: { users, orgData } });
  } catch (err) {
    if (err instanceof Error && (err.message === 'UNAUTHORIZED' || err.message === 'FORBIDDEN')) {
      const status = err.message === 'UNAUTHORIZED' ? 401 : 403;
      return NextResponse.json({ success: false, error: { code: err.message, message: 'Lỗi quyền truy cập' } }, { status });
    }
    console.error('GET /api/admin/users error:', err);
    return NextResponse.json({ success: false, error: { code: 'SERVER_ERROR', message: `Lỗi DB: ${err instanceof Error ? err.message : 'Unknown error'}` } }, { status: 500 });
  }
}

// POST /api/admin/users — Tạo nhân viên mới
export async function POST(req: NextRequest) {
  try {
    // Verify admin
    await requireAdmin();
    
    const supabase = createServerClient();
    const body = await req.json();
    const { email, fullName, password, role, departmentId, teamId, positionId, employmentType } = body;

    // Validate required fields
    if (!email || !fullName || !password) {
      return NextResponse.json({ success: false, error: { code: 'VALIDATION', message: 'Email, họ tên và mật khẩu là bắt buộc' } }, { status: 400 });
    }

    // Check duplicate email
    const { data: existing } = await supabase.from('users').select('id').eq('email', email).single();
    if (existing) {
      return NextResponse.json({ success: false, error: { code: 'DUPLICATE', message: 'Email đã tồn tại trong hệ thống' } }, { status: 409 });
    }

    // Hash password securely
    const hashedPassword = await hashPassword(password);

    // Insert new user
    const userId = crypto.randomUUID();
    const { data, error } = await supabase
      .from('users')
      .insert({
        id: userId,
        email: email.toLowerCase().trim(),
        full_name: fullName.trim(),
        password_hash: hashedPassword,
        role: role || 'user',
        department_id: departmentId || null,
        team_id: teamId || null,
        position_id: positionId || null,
        employment_type: employmentType || 'full_time',
        status: 'onboarding',
        onboarding_start_date: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, data: { id: data.id, message: 'Tạo nhân viên thành công' } }, { status: 201 });
  } catch (err) {
    if (err instanceof Error && (err.message === 'UNAUTHORIZED' || err.message === 'FORBIDDEN')) {
      const status = err.message === 'UNAUTHORIZED' ? 401 : 403;
      return NextResponse.json({ success: false, error: { code: err.message, message: 'Không có quyền' } }, { status });
    }
    console.error('POST /api/admin/users error:', err);
    return NextResponse.json({ success: false, error: { code: 'SERVER_ERROR', message: 'Lỗi server' } }, { status: 500 });
  }
}
