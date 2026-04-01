'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Clock, CheckCircle, FileQuestion, BookOpen } from 'lucide-react';
import OrganizationalChart from '@/components/ui/org-chart';

interface DocData {
  id: string;
  title: string;
  thumbnail: string;
  summary: string;
  contentHtml: string;
  estimatedReadMinutes: number;
  docType: string;
  progress: string;
  readPercentage: number;
}

export default function DocumentReaderPage() {
  const params = useParams();
  const router = useRouter();
  const [doc, setDoc] = useState<DocData | null>(null);
  const [loading, setLoading] = useState(true);
  const [marking, setMarking] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);

  const docId = params.id as string;

  useEffect(() => {
    fetch(`/api/documents/${docId}`)
      .then(res => res.json())
      .then(json => { if (json.success) setDoc(json.data); })
      .finally(() => setLoading(false));
  }, [docId]);

  useEffect(() => {
    function handleScroll() {
      const readerEl = document.getElementById('doc-reader-content');
      if (!readerEl) return;
      const rect = readerEl.getBoundingClientRect();
      const scrolled = Math.max(0, -rect.top);
      const total = readerEl.scrollHeight - window.innerHeight;
      const pct = total > 0 ? Math.min(100, Math.round((scrolled / total) * 100)) : 100;
      setScrollProgress(pct);
    }
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  async function handleMarkAsRead() {
    setMarking(true);
    const res = await fetch(`/api/documents/${docId}/mark-read`, { method: 'POST' });
    const json = await res.json();
    if (json.success) {
      setDoc(prev => prev ? { ...prev, progress: 'read', readPercentage: 100 } : null);
    }
    setMarking(false);
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '400px' }}>
        <div style={{ width: '40px', height: '40px', border: '3px solid #e5e7eb', borderTopColor: '#7c3aed', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <style jsx>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!doc) return <div>Không tìm thấy tài liệu.</div>;

  const isRead = doc.progress === 'read' || doc.progress === 'quiz_passed';

  return (
    <div className="animate-fade-in-up">
      {/* Reading progress bar */}
      <div style={{ position: 'fixed', top: 'var(--header-height)', left: 'var(--sidebar-width)', right: 0, zIndex: 20, height: '3px', background: '#f3f4f6' }}>
        <div style={{
          height: '100%',
          background: 'linear-gradient(90deg, #7c3aed, #6d28d9)',
          width: `${scrollProgress}%`,
          transition: 'width 0.2s ease',
        }} />
      </div>

      {/* Back button */}
      <div style={{ marginBottom: '20px' }}>
        <Link href="/documents" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#9CA0B8', textDecoration: 'none', fontSize: '14px', fontWeight: 500 }}>
          <ArrowLeft size={16} /> Quay lại danh sách
        </Link>
      </div>

      {/* Document header */}
      <div style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div className="doc-card-icon" style={{ fontSize: '36px', width: '64px', height: '64px' }}>{doc.thumbnail}</div>
        <div>
          <h1 style={{ fontSize: '24px', color: '#F9FAFB', marginBottom: '4px' }}>{doc.title}</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '13px', color: '#6B6D8A' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Clock size={14} /> {doc.estimatedReadMinutes} phút đọc</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><BookOpen size={14} /> {doc.docType === 'general' ? 'Tài liệu chung' : 'Phòng ban'}</span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div id="doc-reader-content" className="doc-reader">
        {doc.id === 'doc4' && doc.contentHtml.includes('<!-- ORG_CHART_HERE -->') ? (
          <>
            <div dangerouslySetInnerHTML={{ __html: doc.contentHtml.split('<!-- ORG_CHART_HERE -->')[0] }} />
            <div style={{ margin: '32px 0', height: '600px' }}>
              <OrganizationalChart />
            </div>
            <div dangerouslySetInnerHTML={{ __html: doc.contentHtml.split('<!-- ORG_CHART_HERE -->')[1] }} />
          </>
        ) : (
          <div dangerouslySetInnerHTML={{ __html: doc.contentHtml }} />
        )}
      </div>

      {/* Action bar */}
      <div style={{
        marginTop: '32px', padding: '24px',
        background: 'white', borderRadius: '16px',
        border: '1px solid #e5e7eb',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexWrap: 'wrap', gap: '16px',
      }}>
        {isRead ? (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#16a34a', fontWeight: 600 }}>
              <CheckCircle size={20} /> Đã đọc xong
            </div>
            <button
              onClick={() => router.push(`/documents/${docId}/quiz`)}
              className="btn btn-primary"
            >
              <FileQuestion size={18} />
              {doc.progress === 'quiz_passed' ? 'Làm Quiz lại' : 'Làm Quiz'}
            </button>
          </>
        ) : (
          <>
            <div style={{ fontSize: '14px', color: '#9CA0B8' }}>
              Đã cuộn: <strong>{scrollProgress}%</strong> — Đọc xong rồi? Bấm nút bên phải để hoàn thành!
            </div>
            <button
              onClick={handleMarkAsRead}
              disabled={marking}
              className="btn btn-primary"
            >
              {marking ? 'Đang lưu...' : (
                <>
                  <CheckCircle size={18} />
                  Đánh dấu đã đọc xong
                </>
              )}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
