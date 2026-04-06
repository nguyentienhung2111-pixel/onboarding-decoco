'use client';

import { useState } from 'react';
import { Shield, Lock, Eye, EyeOff, CheckCircle2, AlertCircle, ArrowRight, Sparkles } from 'lucide-react';

export default function SettingsPage() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus(null);

    if (newPassword !== confirmPassword) {
      setStatus({ type: 'error', message: 'Mật khẩu mới không khớp.' });
      return;
    }

    if (newPassword.length < 6) {
      setStatus({ type: 'error', message: 'Mật khẩu mới phải có ít nhất 6 ký tự.' });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = await res.json();
      if (data.success) {
        setStatus({ type: 'success', message: data.message });
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setStatus({ type: 'error', message: data.error?.message || 'Có lỗi xảy ra.' });
      }
    } catch (err) {
      setStatus({ type: 'error', message: 'Lỗi kết nối. Vui lòng thử lại sau.' });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '28px', color: '#F9FAFB', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Shield size={32} className="text-primary-400" />
          Cài đặt tài khoản
        </h1>
        <p style={{ color: '#6B6D8A', fontSize: '15px' }}>
          Quản lý bảo mật và thông tin cá nhân của bạn để bảo vệ tài khoản tốt hơn.
        </p>
      </div>

      <div className="card" style={{ padding: '32px', position: 'relative', overflow: 'hidden' }}>
        {/* Glow effect */}
        <div style={{ 
          position: 'absolute', 
          top: '-100px', 
          right: '-100px', 
          width: '200px', 
          height: '200px', 
          background: 'radial-gradient(circle, rgba(124, 58, 237, 0.1) 0%, transparent 70%)',
          pointerEvents: 'none'
        }} />

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
          <div style={{ 
            width: '40px', 
            height: '40px', 
            background: 'var(--primary-50)', 
            borderRadius: '10px', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            color: 'var(--primary-500)'
          }}>
            <Lock size={20} />
          </div>
          <div>
            <h2 style={{ fontSize: '18px', color: '#F9FAFB', margin: 0 }}>Thay đổi mật khẩu</h2>
            <p style={{ fontSize: '13px', color: '#6B6D8A', margin: 0 }}>Mật khẩu nên có ít nhất 6 ký tự để đảm bảo an toàn.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {status && (
            <div style={{ 
              padding: '12px 16px', 
              borderRadius: '10px', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '10px',
              fontSize: '14px',
              background: status.type === 'success' ? 'var(--success-light)' : 'var(--error-light)',
              color: status.type === 'success' ? 'var(--success)' : 'var(--error)',
              border: `1px solid ${status.type === 'success' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`,
              animation: 'fadeInDown 0.3s ease'
            }}>
              {status.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
              {status.message}
            </div>
          )}

          <div className="input-group">
            <label className="input-label" htmlFor="currentPassword">Mật khẩu hiện tại</label>
            <div style={{ position: 'relative' }}>
              <input
                id="currentPassword"
                type={showCurrent ? 'text' : 'password'}
                className="input"
                placeholder="••••••••"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                style={{ paddingRight: '44px' }}
              />
              <button
                type="button"
                onClick={() => setShowCurrent(!showCurrent)}
                style={{ 
                  position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', color: '#6B6D8A', cursor: 'pointer', padding: '4px'
                }}
              >
                {showCurrent ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div className="input-group">
              <label className="input-label" htmlFor="newPassword">Mật khẩu mới</label>
              <div style={{ position: 'relative' }}>
                <input
                  id="newPassword"
                  type={showNew ? 'text' : 'password'}
                  className="input"
                  placeholder="••••••••"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  style={{ paddingRight: '44px' }}
                />
                <button
                  type="button"
                  onClick={() => setShowNew(!showNew)}
                  style={{ 
                    position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', color: '#6B6D8A', cursor: 'pointer', padding: '4px'
                  }}
                >
                  {showNew ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="input-group">
              <label className="input-label" htmlFor="confirmPassword">Xác nhận mật khẩu mới</label>
              <div style={{ position: 'relative' }}>
                <input
                  id="confirmPassword"
                  type={showConfirm ? 'text' : 'password'}
                  className="input"
                  placeholder="••••••••"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  style={{ paddingRight: '44px' }}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  style={{ 
                    position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', color: '#6B6D8A', cursor: 'pointer', padding: '4px'
                  }}
                >
                  {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
          </div>

          <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'flex-end' }}>
            <button 
              type="submit" 
              className="btn btn-primary" 
              disabled={loading}
              style={{ padding: '12px 24px', minWidth: '160px' }}
            >
              {loading ? (
                <div className="animate-spin" style={{ width: '18px', height: '18px', border: '2px solid white', borderTopColor: 'transparent', borderRadius: '50%' }} />
              ) : (
                <>
                  Lưu thay đổi
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      <div style={{ marginTop: '32px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        <div className="card" style={{ padding: '24px', display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
          <div style={{ padding: '10px', background: 'rgba(245, 158, 11, 0.1)', color: '#F59E0B', borderRadius: '10px' }}>
            <Sparkles size={20} />
          </div>
          <div>
            <h3 style={{ fontSize: '15px', color: '#F9FAFB', marginBottom: '4px' }}>Lời khuyên bảo mật</h3>
            <p style={{ fontSize: '13px', color: '#6B6D8A', lineHeight: 1.5 }}>
              Sử dụng mật khẩu mạnh kết hợp chữ hoa, chữ thường, số và ký tự đặc biệt. Tránh sử dụng thông tin cá nhân dễ đoán.
            </p>
          </div>
        </div>
        <div className="card" style={{ padding: '24px', display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
          <div style={{ padding: '10px', background: 'rgba(59, 130, 246, 0.1)', color: '#3B82F6', borderRadius: '10px' }}>
            <Shield size={20} />
          </div>
          <div>
            <h3 style={{ fontSize: '15px', color: '#F9FAFB', marginBottom: '4px' }}>Quyền riêng tư</h3>
            <p style={{ fontSize: '13px', color: '#6B6D8A', lineHeight: 1.5 }}>
              Dữ liệu mật khẩu của bạn được mã hóa bằng thuật toán bcrypt an toàn nhất hiện nay trước khi lưu trữ trong hệ thống.
            </p>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeInDown {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-spin {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
