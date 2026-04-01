'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { BookOpen, CheckCircle2, Clock, Trophy, ArrowRight } from 'lucide-react';
import type { UserDashboardData, DocumentWithProgress } from '@/lib/types';

function ProgressRing({ progress, size = 120, strokeWidth = 10 }: { progress: number; size?: number; strokeWidth?: number }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <div className="progress-ring-container" style={{ width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#f3f4f6" strokeWidth={strokeWidth} />
        <circle
          cx={size / 2} cy={size / 2} r={radius} fill="none"
          stroke="url(#progressGradient)" strokeWidth={strokeWidth}
          strokeDasharray={circumference} strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 1s cubic-bezier(0.4, 0, 0.2, 1)' }}
        />
        <defs>
          <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#7c3aed" />
            <stop offset="100%" stopColor="#6d28d9" />
          </linearGradient>
        </defs>
      </svg>
      <div className="progress-ring-text" style={{ fontSize: size * 0.25 }}>
        {progress}%
      </div>
    </div>
  );
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

export default function DashboardPage() {
  const [data, setData] = useState<UserDashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/dashboard')
      .then(res => res.json())
      .then(json => { if (json.success) setData(json.data); })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '400px' }}>
        <div style={{ width: '40px', height: '40px', border: '3px solid #e5e7eb', borderTopColor: '#7c3aed', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <style jsx>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!data) return <div>Không thể tải dữ liệu.</div>;

  return (
    <div className="animate-fade-in-up">
      {/* Welcome header */}
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '28px', color: '#F9FAFB', marginBottom: '4px' }}>
          Xin chào, {data.user.fullName} 👋
        </h1>
        <p style={{ fontSize: '15px', color: '#9CA0B8' }}>
          Theo dõi tiến độ onboarding của bạn tại đây.
        </p>
      </div>

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '32px' }}>
        <div className="stats-card">
          <div className="stats-icon teal"><BookOpen size={22} /></div>
          <div>
            <div style={{ fontSize: '13px', color: '#9CA0B8', marginBottom: '4px' }}>Tài liệu</div>
            <div style={{ fontSize: '24px', fontWeight: 700, color: '#F9FAFB' }}>{data.totalDocuments}</div>
            <div style={{ fontSize: '12px', color: '#6B6D8A' }}>cần hoàn thành</div>
          </div>
        </div>
        <div className="stats-card">
          <div className="stats-icon green"><CheckCircle2 size={22} /></div>
          <div>
            <div style={{ fontSize: '13px', color: '#9CA0B8', marginBottom: '4px' }}>Đã hoàn thành</div>
            <div style={{ fontSize: '24px', fontWeight: 700, color: '#F9FAFB' }}>{data.completedDocuments}</div>
            <div style={{ fontSize: '12px', color: '#6B6D8A' }}>tài liệu</div>
          </div>
        </div>
        <div className="stats-card">
          <div className="stats-icon orange"><Trophy size={22} /></div>
          <div>
            <div style={{ fontSize: '13px', color: '#9CA0B8', marginBottom: '4px' }}>Tiến độ</div>
            <div style={{ fontSize: '24px', fontWeight: 700, color: '#F9FAFB' }}>{data.overallProgress}%</div>
            <div style={{ fontSize: '12px', color: '#6B6D8A' }}>tổng thể</div>
          </div>
        </div>
      </div>

      {/* Main content grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '24px', alignItems: 'start' }}>
        {/* Document list */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2 style={{ fontSize: '18px', color: '#F9FAFB' }}>Danh sách tài liệu</h2>
            <Link href="/documents" className="btn btn-ghost btn-sm" style={{ textDecoration: 'none' }}>
              Xem tất cả <ArrowRight size={14} />
            </Link>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {data.documents.map((item: DocumentWithProgress, i: number) => (
              <Link
                key={item.document.id}
                href={item.progress === 'quiz_passed' ? `/documents/${item.document.id}` : item.progress === 'read' ? `/documents/${item.document.id}/quiz` : `/documents/${item.document.id}`}
                className="doc-card animate-slide-in"
                style={{ animationDelay: `${i * 0.05}s` }}
              >
                <div className="doc-card-icon">{item.document.thumbnail}</div>
                <div className="doc-card-content">
                  <div className="doc-card-title">{item.document.title}</div>
                  <div className="doc-card-summary">{item.document.summary}</div>
                  <div className="doc-card-meta">
                    <StatusBadge status={item.progress} />
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Clock size={12} /> {item.document.estimatedReadMinutes} phút
                    </span>
                    {item.quizScore !== null && (
                      <span style={{ color: item.quizPassed ? '#16a34a' : '#dc2626' }}>
                        Quiz: {item.quizScore}/10
                      </span>
                    )}
                  </div>
                  {item.readPercentage > 0 && item.readPercentage < 100 && (
                    <div className="progress-bar-container" style={{ marginTop: '8px' }}>
                      <div className="progress-bar-fill" style={{ width: `${item.readPercentage}%` }} />
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Progress ring sidebar */}
        <div className="card" style={{ padding: '32px', textAlign: 'center', position: 'sticky', top: '96px' }}>
          <h3 style={{ fontSize: '14px', color: '#9CA0B8', marginBottom: '20px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Tiến độ onboarding
          </h3>
          <ProgressRing progress={data.overallProgress} />
          <div style={{ marginTop: '20px', fontSize: '14px', color: '#9CA0B8' }}>
            <strong style={{ color: '#F9FAFB' }}>{data.completedDocuments}</strong> / {data.totalDocuments} tài liệu
          </div>
          {data.overallProgress === 100 && (
            <div style={{
              marginTop: '16px', padding: '12px',
              background: '#dcfce7', borderRadius: '12px',
              color: '#16a34a', fontSize: '14px', fontWeight: 600,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
            }}>
              <Trophy size={18} /> Hoàn thành xuất sắc!
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
