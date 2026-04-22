'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service if needed
    console.error('Quiz Route Error Boundary:', error);
  }, [error]);

  return (
    <div style={{
      maxWidth: '600px',
      margin: '60px auto',
      padding: '40px',
      textAlign: 'center',
      background: '#1E2132',
      borderRadius: '16px',
      border: '1px solid #ef4444',
      color: '#F9FAFB'
    }}>
      <div style={{ fontSize: '48px', marginBottom: '20px' }}>🛑</div>
      <h2 style={{ fontSize: '22px', marginBottom: '12px' }}>Đã xảy ra lỗi hệ thống</h2>
      <p style={{ color: '#9CA0B8', marginBottom: '24px', lineHeight: 1.5 }}>
        Ứng dụng gặp sự cố khi tải trang quiz: <br />
        <code style={{ fontSize: '13px', background: 'rgba(0,0,0,0.3)', padding: '4px 8px', borderRadius: '4px', color: '#ef4444' }}>
          {error.message || 'Lỗi không xác định'}
        </code>
      </p>
      
      <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
        <button
          onClick={() => reset()}
          style={{
            padding: '10px 24px',
            background: '#7c3aed',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: 600
          }}
        >
          Thử lại
        </button>
        <button
          onClick={() => window.location.href = '/dashboard'}
          style={{
            padding: '10px 24px',
            background: 'transparent',
            color: '#F9FAFB',
            border: '1px solid #2D314D',
            borderRadius: '8px',
            cursor: 'pointer'
          }}
        >
          Về Dashboard
        </button>
      </div>
      
      {error.digest && (
        <p style={{ marginTop: '24px', fontSize: '11px', color: '#6B6D8A' }}>
          ID lỗi: {error.digest}
        </p>
      )}
    </div>
  );
}
