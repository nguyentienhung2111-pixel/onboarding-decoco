'use client';

import { useEffect, useState } from 'react';
import { Users, BookOpen, Trophy, TrendingUp, BarChart3, Clock, RotateCcw } from 'lucide-react';
import type { AdminStatsData, AdminUserRow } from '@/lib/types';

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; className: string }> = {
    onboarding: { label: 'Đang onboarding', className: 'badge-reading' },
    completed: { label: 'Hoàn thành', className: 'badge-quiz-passed' },
    active: { label: 'Active', className: 'badge-not-started' },
  };
  const c = config[status] || config.active;
  return <span className={`badge ${c.className}`}>{c.label}</span>;
}

export default function AdminDashboardPage() {
  const [data, setData] = useState<AdminStatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDept, setSelectedDept] = useState('');
  const [selectedTeam, setSelectedTeam] = useState('');
  const [selectedPosition, setSelectedPosition] = useState('');

  useEffect(() => {
    fetch('/api/admin/stats')
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

  // Danh sách option động (phân cấp): Phòng ban → Team → Vị trí
  const departments = Array.from(new Set(data.users.map(u => u.department).filter(Boolean)));
  const teams = Array.from(new Set(
    data.users
      .filter(u => !selectedDept || u.department === selectedDept)
      .map(u => u.team)
      .filter(Boolean)
  ));
  const positions = Array.from(new Set(
    data.users
      .filter(u => (!selectedDept || u.department === selectedDept) && (!selectedTeam || u.team === selectedTeam))
      .map(u => u.position)
      .filter(Boolean)
  ));

  const filteredUsers = data.users.filter(user => {
    const matchDept = !selectedDept || user.department === selectedDept;
    const matchTeam = !selectedTeam || user.team === selectedTeam;
    const matchPos = !selectedPosition || user.position === selectedPosition;
    return matchDept && matchTeam && matchPos;
  });

  const hasFilter = Boolean(selectedDept || selectedTeam || selectedPosition);
  const clearFilters = () => { setSelectedDept(''); setSelectedTeam(''); setSelectedPosition(''); };

  return (
    <div className="animate-fade-in-up">
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '28px', color: '#F9FAFB', marginBottom: '4px' }}>
          📊 Admin Dashboard
        </h1>
        <p style={{ fontSize: '15px', color: '#9CA0B8' }}>
          Tổng quan tiến độ onboarding của nhân viên
        </p>
      </div>

      {/* Stats cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '32px' }}>
        <div className="stats-card">
          <div className="stats-icon teal"><Users size={22} /></div>
          <div>
            <div style={{ fontSize: '13px', color: '#9CA0B8' }}>Nhân viên mới</div>
            <div style={{ fontSize: '24px', fontWeight: 700, color: '#F9FAFB' }}>{data.totalUsers}</div>
          </div>
        </div>
        <div className="stats-card">
          <div className="stats-icon orange"><Clock size={22} /></div>
          <div>
            <div style={{ fontSize: '13px', color: '#9CA0B8' }}>Đang onboarding</div>
            <div style={{ fontSize: '24px', fontWeight: 700, color: '#F9FAFB' }}>{data.onboardingUsers}</div>
          </div>
        </div>
        <div className="stats-card">
          <div className="stats-icon green"><Trophy size={22} /></div>
          <div>
            <div style={{ fontSize: '13px', color: '#9CA0B8' }}>Đã hoàn thành</div>
            <div style={{ fontSize: '24px', fontWeight: 700, color: '#F9FAFB' }}>{data.completedUsers}</div>
          </div>
        </div>
        <div className="stats-card">
          <div className="stats-icon blue"><BarChart3 size={22} /></div>
          <div>
            <div style={{ fontSize: '13px', color: '#9CA0B8' }}>Điểm quiz TB</div>
            <div style={{ fontSize: '24px', fontWeight: 700, color: '#F9FAFB' }}>{data.averageQuizScore}/10</div>
          </div>
        </div>
        <div className="stats-card">
          <div className="stats-icon teal"><TrendingUp size={22} /></div>
          <div>
            <div style={{ fontSize: '13px', color: '#9CA0B8' }}>Hoàn thành TB</div>
            <div style={{ fontSize: '24px', fontWeight: 700, color: '#F9FAFB' }}>{data.averageCompletion}%</div>
          </div>
        </div>
        <div className="stats-card">
          <div className="stats-icon blue"><BookOpen size={22} /></div>
          <div>
            <div style={{ fontSize: '13px', color: '#9CA0B8' }}>Tài liệu</div>
            <div style={{ fontSize: '24px', fontWeight: 700, color: '#F9FAFB' }}>{data.totalDocuments}</div>
          </div>
        </div>
      </div>

      {/* Users table */}
      <div className="card" style={{ overflow: 'hidden' }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontSize: '18px', color: '#F9FAFB' }}>Nhân viên mới</h2>
          <span style={{ fontSize: '13px', color: '#6B6D8A' }}>{filteredUsers.length}/{data.users.length} người</span>
        </div>

        {/* Bộ lọc: Phòng ban → Team → Vị trí (client-side, phân cấp) */}
        <div style={{ padding: '16px 24px', borderBottom: '1px solid #e5e7eb', display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center' }}>
          <select
            value={selectedDept}
            onChange={e => { setSelectedDept(e.target.value); setSelectedTeam(''); setSelectedPosition(''); }}
            style={{ ...selectStyle, width: 'auto', minWidth: '180px' }}
          >
            <option value="" style={optionStyle}>Tất cả phòng ban</option>
            {departments.map(d => <option key={d} value={d} style={optionStyle}>{d}</option>)}
          </select>
          <select
            value={selectedTeam}
            onChange={e => { setSelectedTeam(e.target.value); setSelectedPosition(''); }}
            style={{ ...selectStyle, width: 'auto', minWidth: '180px' }}
          >
            <option value="" style={optionStyle}>Tất cả team</option>
            {teams.map(t => <option key={t} value={t} style={optionStyle}>{t}</option>)}
          </select>
          <select
            value={selectedPosition}
            onChange={e => setSelectedPosition(e.target.value)}
            style={{ ...selectStyle, width: 'auto', minWidth: '180px' }}
          >
            <option value="" style={optionStyle}>Tất cả vị trí</option>
            {positions.map(p => <option key={p} value={p} style={optionStyle}>{p}</option>)}
          </select>
          {hasFilter && (
            <button
              onClick={clearFilters}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '6px',
                padding: '10px 14px', borderRadius: '8px',
                border: '1px solid #2D2F45', background: '#141627',
                color: '#F9FAFB', fontSize: '14px', cursor: 'pointer',
              }}
            >
              <RotateCcw size={15} /> Xoá bộ lọc
            </button>
          )}
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Họ tên</th>
                <th>Phòng ban</th>
                <th>Team</th>
                <th>Vị trí</th>
                <th>Tiến độ</th>
                <th>Trạng thái</th>
                <th>Bắt đầu</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user: AdminUserRow, i: number) => (
                <tr key={user.id} className="animate-slide-in" style={{ animationDelay: `${i * 0.05}s` }}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div className="sidebar-avatar" style={{ width: '32px', height: '32px', fontSize: '11px' }}>
                        {user.fullName.split(' ').map(n => n[0]).join('').slice(0, 2)}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, color: '#F9FAFB' }}>{user.fullName}</div>
                        <div style={{ fontSize: '12px', color: '#6B6D8A' }}>{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td>{user.department}</td>
                  <td>{user.team}</td>
                  <td>{user.position}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div className="progress-bar-container" style={{ width: '80px' }}>
                        <div className={`progress-bar-fill ${user.progress === 100 ? 'success' : ''}`} style={{ width: `${user.progress}%` }} />
                      </div>
                      <span style={{ fontSize: '13px', fontWeight: 600, color: user.progress === 100 ? '#16a34a' : '#F9FAFB' }}>
                        {user.progress}%
                      </span>
                      <span style={{ fontSize: '12px', color: '#6B6D8A' }}>
                        ({user.documentsCompleted}/{user.totalDocuments})
                      </span>
                    </div>
                  </td>
                  <td><StatusBadge status={user.status} /></td>
                  <td style={{ fontSize: '13px', color: '#9CA0B8' }}>
                    {new Date(user.onboardingStartDate).toLocaleDateString('vi-VN')}
                  </td>
                </tr>
              ))}
              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '40px', color: '#6B6D8A' }}>
                    {hasFilter ? 'Không có nhân viên nào khớp bộ lọc' : 'Chưa có nhân viên mới'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

const selectStyle: React.CSSProperties = {
  width: '100%', padding: '10px 14px', borderRadius: '8px',
  border: '1px solid #2D2F45', background: '#141627',
  backgroundColor: '#141627',
  color: '#F9FAFB', fontSize: '14px', outline: 'none',
  appearance: 'none', boxSizing: 'border-box', cursor: 'pointer',
};

const optionStyle: React.CSSProperties = {
  background: '#1E2035',
  color: '#F9FAFB',
};
