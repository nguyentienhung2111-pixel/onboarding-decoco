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

  // Chế độ giao diện: đăng nhập hoặc quên mật khẩu
  const [mode, setMode] = useState<'login' | 'forgot'>('login');
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotError, setForgotError] = useState('');
  const [forgotMessage, setForgotMessage] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);

  async function handleForgotSubmit(e: React.FormEvent) {
    e.preventDefault();
    setForgotError('');
    setForgotMessage('');
    setForgotLoading(true);

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail }),
      });

      const data = await res.json();

      if (!data.success) {
        setForgotError(data.error.message);
        setForgotLoading(false);
        return;
      }

      setForgotMessage(data.message || 'Mật khẩu mới đã được gửi tới email của bạn.');
      setForgotLoading(false);
    } catch {
      setForgotError('Có lỗi xảy ra. Vui lòng thử lại.');
      setForgotLoading(false);
    }
  }

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

        {/* Form đăng nhập */}
        {mode === 'login' && (
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label className="input-label" htmlFor="password">Mật khẩu</label>
              <button
                type="button"
                onClick={() => { setMode('forgot'); setError(''); setForgotEmail(email); setForgotError(''); setForgotMessage(''); }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#a78bfa', fontSize: '13px', padding: 0 }}
              >
                Quên mật khẩu?
              </button>
            </div>
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
        )}

        {/* Form quên mật khẩu */}
        {mode === 'forgot' && (
        <form onSubmit={handleForgotSubmit}>
          <p style={{ fontSize: '14px', color: '#9CA0B8', marginBottom: '20px' }}>
            Nhập email đã đăng ký. Hệ thống sẽ tạo mật khẩu mới và gửi về email của bạn.
          </p>

          <div className="input-group" style={{ marginBottom: '20px' }}>
            <label className="input-label" htmlFor="forgot-email">Email</label>
            <input
              id="forgot-email"
              type="email"
              className="input"
              placeholder="you@decoco.vn"
              value={forgotEmail}
              onChange={e => setForgotEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>

          {forgotError && (
            <div style={{
              padding: '10px 14px', background: '#fee2e2', color: '#dc2626',
              borderRadius: '8px', fontSize: '13px', marginBottom: '16px',
              border: '1px solid #fecaca'
            }}>
              {forgotError}
            </div>
          )}

          {forgotMessage && (
            <div style={{
              padding: '10px 14px', background: '#dcfce7', color: '#16a34a',
              borderRadius: '8px', fontSize: '13px', marginBottom: '16px',
              border: '1px solid #bbf7d0'
            }}>
              {forgotMessage}
            </div>
          )}

          <button
            type="submit"
            className="btn btn-primary btn-lg"
            disabled={forgotLoading}
            style={{ width: '100%', marginBottom: '12px' }}
          >
            {forgotLoading ? (
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{
                  width: '18px', height: '18px', border: '2px solid rgba(255,255,255,0.3)',
                  borderTopColor: 'white', borderRadius: '50%',
                  animation: 'spin 0.6s linear infinite',
                }} />
                Đang gửi...
              </span>
            ) : (
              'Gửi mật khẩu mới'
            )}
          </button>

          <button
            type="button"
            onClick={() => { setMode('login'); setForgotError(''); setForgotMessage(''); }}
            style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', color: '#9CA0B8', fontSize: '14px', padding: '6px' }}
          >
            ← Quay lại đăng nhập
          </button>
        </form>
        )}
      </div>

      <style jsx>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
