'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body style={{
        background: '#0F111A',
        color: '#F9FAFB',
        margin: 0,
        fontFamily: 'system-ui, sans-serif',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        padding: '20px'
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
          <h1 style={{ fontSize: '28px', fontWeight: 800, marginBottom: '12px' }}>Lỗi Hệ Thống Toàn Cục</h1>
          <p style={{ color: '#9CA0B8', marginBottom: '24px', lineHeight: 1.6 }}>
            Một lỗi nghiêm trọng đã xảy ra ở cấp độ cao nhất của ứng dụng.
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
            <div style={{ fontSize: '12px', color: '#ef4444', marginBottom: '8px', fontWeight: 'bold', textTransform: 'uppercase' }}>Thông báo lỗi:</div>
            <code style={{ fontSize: '14px', color: '#F9FAFB' }}>
              {error.message || 'Lỗi không xác định (Global)'}
            </code>
            {error.digest && (
              <div style={{ marginTop: '12px', fontSize: '11px', color: '#6B6D8A' }}>
                ID: {error.digest}
              </div>
            )}
          </div>

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
            Thử Khởi Động Lại
          </button>
        </div>
      </body>
    </html>
  );
}
