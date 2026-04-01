'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { LogIn, Eye, EyeOff, Sparkles } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!data.success) {
        setError(data.error.message);
        setLoading(false);
        return;
      }

      // Redirect based on role
      if (data.data.role === 'admin' || data.data.role === 'manager') {
        router.push('/admin');
      } else {
        router.push('/dashboard');
      }
      router.refresh();
    } catch {
      setError('Có lỗi xảy ra. Vui lòng thử lại.');
      setLoading(false);
    }
  }

  return (
    <div className="login-bg" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div className="login-card animate-fade-in-up" style={{ width: '100%', maxWidth: '440px', padding: '48px 40px' }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '36px' }}>
          <div style={{
            width: '64px', height: '64px',
            background: 'linear-gradient(135deg, #7c3aed, #4c1d95)',
            borderRadius: '16px', display: 'inline-flex',
            alignItems: 'center', justifyContent: 'center',
            marginBottom: '16px',
            boxShadow: '0 4px 16px rgba(20, 184, 166, 0.3)'
          }}>
            <Sparkles size={32} color="white" />
          </div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#F9FAFB', marginBottom: '4px', fontFamily: 'var(--font-plus-jakarta)' }}>
            DECOCO
          </h1>
          <p style={{ fontSize: '14px', color: '#9CA0B8' }}>
            Hệ thống Onboarding nội bộ
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div className="input-group" style={{ marginBottom: '16px' }}>
            <label className="input-label" htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              className="input"
              placeholder="you@decoco.vn"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>

          <div className="input-group" style={{ marginBottom: '24px' }}>
            <label className="input-label" htmlFor="password">Mật khẩu</label>
            <div style={{ position: 'relative' }}>
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                className="input"
                placeholder="Nhập mật khẩu..."
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                style={{ paddingRight: '44px' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer', color: '#6B6D8A', padding: '4px'
                }}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {error && (
            <div style={{
              padding: '10px 14px', background: '#fee2e2', color: '#dc2626',
              borderRadius: '8px', fontSize: '13px', marginBottom: '16px',
              border: '1px solid #fecaca'
            }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            className="btn btn-primary btn-lg"
            disabled={loading}
            style={{ width: '100%' }}
          >
            {loading ? (
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{
                  width: '18px', height: '18px', border: '2px solid rgba(255,255,255,0.3)',
                  borderTopColor: 'white', borderRadius: '50%',
                  animation: 'spin 0.6s linear infinite',
                }} />
                Đang đăng nhập...
              </span>
            ) : (
              <>
                <LogIn size={18} />
                Đăng nhập
              </>
            )}
          </button>
        </form>

        {/* Demo accounts */}
        <div style={{
          marginTop: '28px', padding: '16px',
          background: '#f9fafb', borderRadius: '12px',
          border: '1px solid #e5e7eb'
        }}>
          <p style={{ fontSize: '12px', fontWeight: 600, color: '#9CA0B8', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Tài khoản demo
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '13px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#C2C5D6' }}>
              <span>Admin:</span>
              <code style={{ background: '#e5e7eb', padding: '1px 6px', borderRadius: '4px', fontSize: '12px' }}>admin@decoco.vn / admin123</code>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#C2C5D6' }}>
              <span>Nhân viên:</span>
              <code style={{ background: '#e5e7eb', padding: '1px 6px', borderRadius: '4px', fontSize: '12px' }}>linh@decoco.vn / linh123</code>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
