'use client';

import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('GLOBAL APPLICATION ERROR:', error);
  }, [error]);

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#0F111A',
      color: '#F9FAFB',
      padding: '20px',
      fontFamily: 'system-ui, sans-serif'
    }}>
      <div style={{
        maxWidth: '600px',
        width: '100%',
        background: '#1E2132',
        padding: '40px',
        borderRadius: '24px',
        border: '1px solid #ef4444',
        textAlign: 'center',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
      }}>
        <div style={{ fontSize: '72px', marginBottom: '20px' }}>⚠️</div>
        <h1 style={{ fontSize: '28px', fontWeight: 800, marginBottom: '12px' }}>Lỗi hệ thống nghiêm trọng</h1>
        <p style={{ color: '#9CA0B8', marginBottom: '24px', lineHeight: 1.6 }}>
          Chúng tôi rất tiếc, đã có một sự cố xảy ra khiến ứng dụng không thể khởi động bình thường.
        </p>
        
        <div style={{
          background: 'rgba(0,0,0,0.3)',
          padding: '20px',
          borderRadius: '12px',
          textAlign: 'left',
          marginBottom: '32px',
          borderLeft: '4px solid #ef4444',
          overflowX: 'auto'
        }}>
          <div style={{ fontSize: '12px', color: '#ef4444', marginBottom: '8px', fontWeight: 'bold', textTransform: 'uppercase' }}>Chi tiết lỗi:</div>
          <code style={{ fontSize: '14px', color: '#F9FAFB' }}>
            {error.message || 'Lỗi không xác định tại Root'}
          </code>
        </div>

        <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
          <button
            onClick={() => reset()}
            style={{
              padding: '12px 32px',
              background: '#7c3aed',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              cursor: 'pointer',
              fontWeight: 700,
              fontSize: '16px'
            }}
          >
            Thử tải lại ứng dụng
          </button>
          <button
            onClick={() => window.location.href = '/'}
            style={{
              padding: '12px 32px',
              background: 'transparent',
              color: '#F9FAFB',
              border: '1px solid #2D314D',
              borderRadius: '12px',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '16px'
            }}
          >
            Về trang chủ
          </button>
        </div>
      </div>
    </div>
  );
}
