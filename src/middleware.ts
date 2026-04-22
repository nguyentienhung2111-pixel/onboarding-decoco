import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionCookie = request.cookies.get('decoco_session');

  // Public routes
  if (pathname === '/login' || pathname.startsWith('/api/auth/login')) {
    if (sessionCookie && pathname === '/login') {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    return NextResponse.next();
  }

  // Check auth for all other routes
  if (!sessionCookie?.value) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Chưa đăng nhập' } }, { status: 401 });
    }
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Double check session JSON validity
  try {
    const session = JSON.parse(sessionCookie.value);
    
    // Check admin routes
    if (pathname.startsWith('/admin') || pathname.startsWith('/api/admin/')) {
      if (session.role !== 'admin' && session.role !== 'manager') {
        if (pathname.startsWith('/api/')) {
          return NextResponse.json({ success: false, error: { code: 'FORBIDDEN', message: 'Không có quyền truy cập' } }, { status: 403 });
        }
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }
    }
  } catch (error) {
    console.error('Middleware session parse error:', error);
    // If cookie is corrupted, treats as unauthorized
    const response = NextResponse.redirect(new URL('/login', request.url));
    response.cookies.delete('decoco_session');
    return response;
  }

  return NextResponse.next();
}


export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
