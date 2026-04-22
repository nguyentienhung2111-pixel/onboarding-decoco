'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Document/Quiz Route Error:', error);
  }, [error]);

  return (
    <div style={{
      maxWidth: '800px',
      margin: '60px auto',
      padding: '40px',
      textAlign: 'center',
      background: '#1E2132',
      borderRadius: '24px',
      border: '1px solid #ef4444',
      boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
      color: '#F9FAFB'
    }}>
      <div style={{ fontSize: '64px', marginBottom: '24px' }}>🛡️</div>
      <h2 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '16px' }}>Hệ thống phát hiện lỗi bất thường</h2>
      <p style={{ color: '#9CA0B8', marginBottom: '32px', fontSize: '16px', lineHeight: 1.6 }}>
        Đã có sự cố xảy ra khi xử lý tài liệu hoặc bài quiz này. <br />
        Vui lòng cung cấp mã lỗi bên dưới cho quản trị viên:
      </p>

      <div style={{ 
        background: 'rgba(0,0,0,0.4)', 
        padding: '24px', 
        borderRadius: '12px', 
        textAlign: 'left', 
        marginBottom: '40px',
        borderLeft: '4px solid #ef4444',
        fontFamily: 'monospace',
        fontSize: '14px',
        overflowX: 'auto'
      }}>
        <div style={{ color: '#ef4444', fontWeight: 'bold', marginBottom: '8px' }}>[Error Message]</div>
        <div style={{ color: '#F9FAFB' }}>{error.message || 'Không có mô tả chi tiết'}</div>
        
        {error.digest && (
          <>
            <div style={{ color: '#ef4444', fontWeight: 'bold', marginTop: '16px', marginBottom: '8px' }}>[Error Digest]</div>
            <div style={{ color: '#F9FAFB' }}>{error.digest}</div>
          </>
        )}
      </div>
      
      <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
        <button
          onClick={() => reset()}
          style={{
            padding: '12px 32px',
            background: '#7c3aed',
            color: 'white',
            border: 'none',
            borderRadius: '10px',
            cursor: 'pointer',
            fontWeight: 700,
            fontSize: '16px',
            boxShadow: '0 4px 14px rgba(124, 58, 237, 0.4)'
          }}
        >
          Tải lại trang (Retry)
        </button>
        <Link
          href="/dashboard"
          style={{
            padding: '12px 32px',
            background: 'transparent',
            color: '#F9FAFB',
            border: '1px solid #2D314D',
            borderRadius: '10px',
            cursor: 'pointer',
            textDecoration: 'none',
            fontWeight: 600,
            fontSize: '16px'
          }}
        >
          Về Dashboard
        </Link>
      </div>
    </div>
  );
}
