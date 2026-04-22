import { cookies } from 'next/headers';
import { getUserByEmail, getUserById } from './db';
import type { SessionUser } from './types';
import bcrypt from 'bcryptjs';

const SESSION_COOKIE = 'decoco_session';
const SESSION_SECRET = process.env.SESSION_SECRET || 'decoco-secret-change-me';

export async function login(email: string, password: string): Promise<SessionUser | null> {
  const user = await getUserByEmail(email);
  if (!user) return null;
  if (user.status === 'inactive') return null;

  // So sánh password (hỗ trợ cả plaintext cũ và bcrypt hash mới)
  let passwordMatch = false;
  if (user.password.startsWith('$2a$') || user.password.startsWith('$2b$')) {
    // Đã hash bằng bcrypt
    passwordMatch = await bcrypt.compare(password, user.password);
  } else {
    // Plaintext (từ seed data cũ) — so sánh trực tiếp
    passwordMatch = user.password === password;
  }

  if (!passwordMatch) return null;

  const session: SessionUser = {
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    role: user.role,
    departmentId: user.departmentId,
    teamId: user.teamId,
    positionId: user.positionId,
  };

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, JSON.stringify(session), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7,
    path: '/',
  });

  return session;
}

// Hàm hash password (dùng khi tạo user mới từ Admin)
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

// logout và getCurrentUser giữ nguyên logic cũ
export async function logout(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

export async function getCurrentUser(): Promise<SessionUser | null> {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(SESSION_COOKIE);
    
    if (!sessionCookie?.value) {
      return null;
    }

    try {
      const session = JSON.parse(sessionCookie.value) as SessionUser;
      
      // Safety check: ensure DB is reachable
      const user = await getUserById(session.id);
      if (!user || user.status === 'inactive') {
        console.warn(`[AUTH] User session invalid or inactive: ${session.id}`);
        return null;
      }
      
      return session;
    } catch (parseError) {
      console.error('[AUTH] Failed to parse session JSON:', parseError);
      return null;
    }
  } catch (error) {
    console.error('[AUTH] Critical error retrieving current user:', error);
    return null;
  }
}


export async function requireAuth(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) throw new Error('UNAUTHORIZED');
  return user;
}

export async function requireAdmin(): Promise<SessionUser> {
  const user = await requireAuth();
  if (user.role !== 'admin' && user.role !== 'manager') throw new Error('FORBIDDEN');
  return user;
}
