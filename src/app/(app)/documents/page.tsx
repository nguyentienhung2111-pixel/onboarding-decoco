'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Clock, BookOpen, Filter } from 'lucide-react';

interface DocWithProgress {
  id: string;
  title: string;
  docType: string;
  summary: string;
  thumbnail: string;
  estimatedReadMinutes: number;
  progress: string;
  readPercentage: number;
}

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; className: string }> = {
    not_started: { label: 'Chưa đọc', className: 'badge-not-started' },
    reading: { label: 'Đang đọc', className: 'badge-reading' },
    read: { label: 'Đã đọc', className: 'badge-read' },
    quiz_passed: { label: 'Hoàn thành ✓', className: 'badge-quiz-passed' },
  };
  const c = config[status] || config.not_started;
  return <span className={`badge ${c.className}`}>{c.label}</span>;
}

export default function DocumentsPage() {
  const [docs, setDocs] = useState<DocWithProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'general' | 'department'>('all');

  useEffect(() => {
    fetch('/api/documents')
      .then(res => res.json())
      .then(json => { if (json.success) setDocs(json.data); })
      .finally(() => setLoading(false));
  }, []);

  const filtered = filter === 'all' ? docs : docs.filter(d => {
    if (filter === 'general') return d.docType === 'general';
    return d.docType !== 'general';
  });

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '400px' }}>
        <div style={{ width: '40px', height: '40px', border: '3px solid #e5e7eb', borderTopColor: '#7c3aed', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <style jsx>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div className="animate-fade-in-up">
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '28px', color: '#F9FAFB', marginBottom: '4px' }}>
          <BookOpen size={28} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '8px', color: '#7c3aed' }} />
          Tài liệu Onboarding
        </h1>
        <p style={{ fontSize: '15px', color: '#9CA0B8' }}>
          Đọc và hoàn thành quiz cho tất cả tài liệu bên dưới.
        </p>
      </div>

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
        {[
          { key: 'all', label: 'Tất cả' },
          { key: 'general', label: 'Tài liệu chung' },
          { key: 'department', label: 'Phòng ban' },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key as 'all' | 'general' | 'department')}
            className={`btn ${filter === tab.key ? 'btn-primary' : 'btn-secondary'} btn-sm`}
          >
            {tab.key === 'all' && <Filter size={14} />}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Document grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '16px' }}>
        {filtered.map((doc, i) => (
          <Link
            key={doc.id}
            href={`/documents/${doc.id}`}
            className="doc-card card-hover animate-slide-in"
            style={{ animationDelay: `${i * 0.05}s`, flexDirection: 'column' }}
          >
            <div style={{ display: 'flex', gap: '16px', width: '100%' }}>
              <div className="doc-card-icon">{doc.thumbnail}</div>
              <div className="doc-card-content">
                <div className="doc-card-title">{doc.title}</div>
                <div className="doc-card-summary">{doc.summary}</div>
                <div className="doc-card-meta">
                  <StatusBadge status={doc.progress} />
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Clock size={12} /> {doc.estimatedReadMinutes} phút đọc
                  </span>
                </div>
              </div>
            </div>
            {doc.readPercentage > 0 && doc.readPercentage < 100 && (
              <div className="progress-bar-container" style={{ marginTop: '12px' }}>
                <div className="progress-bar-fill" style={{ width: `${doc.readPercentage}%` }} />
              </div>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}
