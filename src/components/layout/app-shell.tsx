'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard, FileText, MessageSquareText, Settings,
  LogOut, Menu, X, Sparkles, ChevronRight, Shield, Users
} from 'lucide-react';
import type { SessionUser } from '@/lib/types';

const userNavItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/documents', label: 'Tài liệu', icon: FileText },
  { href: '/ai-chat', label: 'AI DECOCO', icon: MessageSquareText },
];

const adminNavItems = [
  { href: '/admin', label: 'Admin Dashboard', icon: Shield },
  { href: '/admin/users', label: 'Quản lý nhân viên', icon: Users },
];

export default function AppShell({ user, children }: { user: SessionUser; children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  }

  const initials = user.fullName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

  return (
    <div>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 35 }}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">
            <Sparkles size={20} />
          </div>
          <div>
            <div style={{ fontSize: '16px', fontWeight: 800, color: '#F9FAFB', fontFamily: 'var(--font-plus-jakarta)' }}>DECOCO</div>
            <div style={{ fontSize: '11px', color: '#6B6D8A', fontWeight: 500 }}>Onboarding</div>
          </div>
        </div>

        <nav className="sidebar-nav">
          <div className="sidebar-section-title">Menu chính</div>
          {userNavItems.map(item => (
            <Link
              key={item.href}
              href={item.href}
              className={`sidebar-link ${pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href)) ? 'active' : ''}`}
              onClick={() => setSidebarOpen(false)}
            >
              <item.icon size={18} />
              {item.label}
              {pathname.startsWith(item.href) && <ChevronRight size={14} style={{ marginLeft: 'auto', opacity: 0.5 }} />}
            </Link>
          ))}

          {(user.role === 'admin' || user.role === 'manager') && (
            <>
              <div className="sidebar-section-title" style={{ marginTop: '16px' }}>Quản trị</div>
              {adminNavItems.map(item => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`sidebar-link ${pathname.startsWith(item.href) ? 'active' : ''}`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <item.icon size={18} />
                  {item.label}
                </Link>
              ))}
            </>
          )}
        </nav>

        <div className="sidebar-user">
          <div className="sidebar-avatar">{initials}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '14px', fontWeight: 600, color: '#F9FAFB', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {user.fullName}
            </div>
            <div style={{ fontSize: '12px', color: '#6B6D8A' }}>{user.role === 'admin' ? 'Admin' : user.role === 'manager' ? 'Manager' : 'Nhân viên'}</div>
          </div>
          <button onClick={handleLogout} className="btn-ghost" style={{ padding: '6px', borderRadius: '8px', border: 'none', cursor: 'pointer', background: 'transparent' }}>
            <LogOut size={16} color="#6B6D8A" />
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="main-content">
        {/* Header */}
        <header className="app-header">
          <button
            onClick={() => setSidebarOpen(true)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'none', padding: '8px' }}
            className="mobile-menu-btn"
          >
            <Menu size={24} color="#E2E4EB" />
          </button>
          <div />
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div className="sidebar-avatar" style={{ width: '32px', height: '32px', fontSize: '12px' }}>{initials}</div>
              <span style={{ fontSize: '14px', fontWeight: 500, color: '#E2E4EB' }}>{user.fullName}</span>
            </div>
          </div>
        </header>

        <div className="page-content animate-fade-in">
          {children}
        </div>
      </div>

      <style jsx>{`
        @media (max-width: 768px) {
          .mobile-menu-btn { display: block !important; }
        }
      `}</style>
    </div>
  );
}
