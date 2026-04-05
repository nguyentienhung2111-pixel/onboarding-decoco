'use client';

import { useEffect, useState } from 'react';
import { UserPlus, Pencil, Trash2, X, Search, ChevronDown } from 'lucide-react';

interface UserItem {
  id: string;
  email: string;
  fullName: string;
  role: string;
  departmentId: string | null;
  teamId: string | null;
  positionId: string | null;
  employmentType: string;
  status: string;
  onboardingStartDate: string;
  createdAt: string;
}

interface OrgItem {
  id: string;
  name: string;
  departmentId?: string;
  teamId?: string | null;
  sortOrder: number;
}

interface OrgData {
  departments: OrgItem[];
  teams: (OrgItem & { departmentId: string })[];
  positions: (OrgItem & { departmentId: string; teamId: string | null })[];
}

const emptyForm = {
  fullName: '',
  email: '',
  password: '',
  role: 'user',
  departmentId: '',
  teamId: '',
  positionId: '',
  employmentType: 'full_time',
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [orgData, setOrgData] = useState<OrgData>({ departments: [], teams: [], positions: [] });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<UserItem | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // Fetch data
  const fetchData = async () => {
    try {
      const res = await fetch('/api/admin/users');
      const json = await res.json();
      if (json.success) {
        setUsers(json.data.users);
        setOrgData(json.data.orgData);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  // Filtered teams/positions based on selected department/team
  const filteredTeams = orgData.teams.filter(t => !form.departmentId || t.departmentId === form.departmentId);
  const filteredPositions = orgData.positions.filter(p => {
    if (form.teamId) return p.teamId === form.teamId;
    if (form.departmentId) return p.departmentId === form.departmentId;
    return true;
  });

  // Search filter
  const filteredUsers = users.filter(u =>
    u.fullName.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  // Helpers
  const getDeptName = (id: string | null) => orgData.departments.find(d => d.id === id)?.name || '—';
  const getTeamName = (id: string | null) => orgData.teams.find(t => t.id === id)?.name || '—';
  const getPositionName = (id: string | null) => orgData.positions.find(p => p.id === id)?.name || '—';

  // Open modal for create
  const openCreate = () => {
    setEditingUser(null);
    setForm(emptyForm);
    setError('');
    setShowModal(true);
  };

  // Open modal for edit
  const openEdit = (user: UserItem) => {
    setEditingUser(user);
    setForm({
      fullName: user.fullName,
      email: user.email,
      password: '',
      role: user.role,
      departmentId: user.departmentId || '',
      teamId: user.teamId || '',
      positionId: user.positionId || '',
      employmentType: user.employmentType,
    });
    setError('');
    setShowModal(true);
  };

  // Save (create or update)
  const handleSave = async () => {
    setError('');
    if (!form.fullName.trim() || !form.email.trim()) {
      setError('Họ tên và email là bắt buộc');
      return;
    }
    if (!editingUser && !form.password) {
      setError('Mật khẩu là bắt buộc khi tạo mới');
      return;
    }

    setSaving(true);
    try {
      const url = editingUser ? `/api/admin/users/${editingUser.id}` : '/api/admin/users';
      const method = editingUser ? 'PUT' : 'POST';

      const payload: Record<string, unknown> = {
        fullName: form.fullName,
        email: form.email,
        role: form.role,
        departmentId: form.departmentId || null,
        teamId: form.teamId || null,
        positionId: form.positionId || null,
        employmentType: form.employmentType,
      };
      if (form.password) payload.password = form.password;

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json();

      if (!json.success) {
        setError(json.error?.message || 'Có lỗi xảy ra');
        return;
      }

      setShowModal(false);
      fetchData();
    } catch {
      setError('Lỗi kết nối server');
    } finally {
      setSaving(false);
    }
  };

  // Delete user
  const handleDelete = async (userId: string) => {
    try {
      const res = await fetch(`/api/admin/users/${userId}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        setDeleteConfirm(null);
        fetchData();
      }
    } catch {
      // silent
    }
  };

  // Status badge
  const StatusBadge = ({ status }: { status: string }) => {
    const config: Record<string, { label: string; cls: string }> = {
      onboarding: { label: 'Đang onboarding', cls: 'badge-reading' },
      completed: { label: 'Hoàn thành', cls: 'badge-quiz-passed' },
      active: { label: 'Active', cls: 'badge-not-started' },
      inactive: { label: 'Vô hiệu', cls: '' },
    };
    const c = config[status] || config.active;
    return <span className={`badge ${c.cls}`}>{c.label}</span>;
  };

  const RoleBadge = ({ role }: { role: string }) => {
    const config: Record<string, { label: string; bg: string; color: string }> = {
      admin: { label: 'Admin', bg: '#7c3aed22', color: '#a78bfa' },
      manager: { label: 'Manager', bg: '#2563eb22', color: '#60a5fa' },
      user: { label: 'Nhân viên', bg: '#6b728022', color: '#9CA0B8' },
    };
    const c = config[role] || config.user;
    return (
      <span style={{ padding: '2px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 600, background: c.bg, color: c.color }}>
        {c.label}
      </span>
    );
  };

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
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '28px', color: '#F9FAFB', marginBottom: '4px' }}>👥 Quản lý nhân viên</h1>
          <p style={{ fontSize: '15px', color: '#9CA0B8' }}>Thêm, chỉnh sửa và quản lý tài khoản nhân viên</p>
        </div>
        <button
          onClick={openCreate}
          style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            padding: '10px 20px', borderRadius: '8px', border: 'none',
            background: '#7c3aed', color: '#fff', fontSize: '14px',
            fontWeight: 600, cursor: 'pointer',
          }}
        >
          <UserPlus size={18} /> Thêm nhân viên
        </button>
      </div>

      {/* Search */}
      <div style={{ marginBottom: '20px', position: 'relative' }}>
        <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#6B6D8A' }} />
        <input
          type="text"
          placeholder="Tìm kiếm theo tên hoặc email..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{
            width: '100%', maxWidth: '400px', padding: '10px 10px 10px 40px',
            borderRadius: '8px', border: '1px solid #2D2F45',
            background: '#1A1C2E', color: '#F9FAFB', fontSize: '14px',
            outline: 'none',
          }}
        />
      </div>

      {/* Users table */}
      <div className="card" style={{ overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Họ tên</th>
                <th>Vai trò</th>
                <th>Phòng ban</th>
                <th>Team</th>
                <th>Vị trí</th>
                <th>Trạng thái</th>
                <th>Ngày tạo</th>
                <th style={{ textAlign: 'center' }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user, i) => (
                <tr key={user.id} className="animate-slide-in" style={{ animationDelay: `${i * 0.03}s` }}>
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
                  <td><RoleBadge role={user.role} /></td>
                  <td>{getDeptName(user.departmentId)}</td>
                  <td>{getTeamName(user.teamId)}</td>
                  <td>{getPositionName(user.positionId)}</td>
                  <td><StatusBadge status={user.status} /></td>
                  <td style={{ fontSize: '13px', color: '#9CA0B8' }}>
                    {new Date(user.createdAt).toLocaleDateString('vi-VN')}
                  </td>
                  <td>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
                      <button
                        onClick={() => openEdit(user)}
                        title="Chỉnh sửa"
                        style={{
                          padding: '6px', borderRadius: '6px', border: '1px solid #2D2F45',
                          background: 'transparent', color: '#60a5fa', cursor: 'pointer',
                        }}
                      >
                        <Pencil size={15} />
                      </button>
                      {deleteConfirm === user.id ? (
                        <div style={{ display: 'flex', gap: '4px' }}>
                          <button
                            onClick={() => handleDelete(user.id)}
                            style={{
                              padding: '4px 10px', borderRadius: '6px', border: 'none',
                              background: '#ef4444', color: '#fff', fontSize: '12px',
                              fontWeight: 600, cursor: 'pointer',
                            }}
                          >
                            Xác nhận
                          </button>
                          <button
                            onClick={() => setDeleteConfirm(null)}
                            style={{
                              padding: '4px 8px', borderRadius: '6px', border: '1px solid #2D2F45',
                              background: 'transparent', color: '#9CA0B8', fontSize: '12px',
                              cursor: 'pointer',
                            }}
                          >
                            Huỷ
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setDeleteConfirm(user.id)}
                          title="Xoá"
                          style={{
                            padding: '6px', borderRadius: '6px', border: '1px solid #2D2F45',
                            background: 'transparent', color: '#f87171', cursor: 'pointer',
                          }}
                        >
                          <Trash2 size={15} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '40px', color: '#6B6D8A' }}>
                    {search ? 'Không tìm thấy nhân viên phù hợp' : 'Chưa có nhân viên nào'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Create / Edit */}
      {showModal && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 999,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
          }}
          onClick={() => setShowModal(false)}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: '#1E2035', borderRadius: '16px', padding: '28px',
              width: '100%', maxWidth: '520px', maxHeight: '90vh', overflowY: 'auto',
              border: '1px solid #2D2F45',
            }}
          >
            {/* Modal header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '20px', color: '#F9FAFB' }}>
                {editingUser ? '✏️ Chỉnh sửa nhân viên' : '➕ Thêm nhân viên mới'}
              </h2>
              <button onClick={() => setShowModal(false)} style={{ background: 'transparent', border: 'none', color: '#6B6D8A', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            {/* Error */}
            {error && (
              <div style={{ padding: '10px 14px', borderRadius: '8px', background: '#ef444422', color: '#f87171', fontSize: '13px', marginBottom: '16px', border: '1px solid #ef444444' }}>
                {error}
              </div>
            )}

            {/* Form */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Họ tên */}
              <div>
                <label style={labelStyle}>Họ tên *</label>
                <input
                  type="text"
                  value={form.fullName}
                  onChange={e => setForm({ ...form, fullName: e.target.value })}
                  placeholder="VD: Nguyễn Văn A"
                  style={inputStyle}
                />
              </div>

              {/* Email */}
              <div>
                <label style={labelStyle}>Email *</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  placeholder="VD: a@decoco.vn"
                  style={inputStyle}
                />
              </div>

              {/* Password */}
              <div>
                <label style={labelStyle}>
                  Mật khẩu {editingUser ? '(để trống nếu không đổi)' : '*'}
                </label>
                <input
                  type="password"
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  placeholder={editingUser ? '••••••••' : 'Nhập mật khẩu'}
                  style={inputStyle}
                />
              </div>

              {/* Row: Role + Employment type */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={labelStyle}>Vai trò</label>
                  <div style={{ position: 'relative' }}>
                    <select
                      value={form.role}
                      onChange={e => setForm({ ...form, role: e.target.value })}
                      style={selectStyle}
                    >
                      <option value="user">Nhân viên</option>
                      <option value="manager">Manager</option>
                      <option value="admin">Admin</option>
                    </select>
                    <ChevronDown size={16} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: '#6B6D8A', pointerEvents: 'none' }} />
                  </div>
                </div>
                <div>
                  <label style={labelStyle}>Loại hình</label>
                  <div style={{ position: 'relative' }}>
                    <select
                      value={form.employmentType}
                      onChange={e => setForm({ ...form, employmentType: e.target.value })}
                      style={selectStyle}
                    >
                      <option value="full_time">Full-time</option>
                      <option value="part_time">Part-time</option>
                    </select>
                    <ChevronDown size={16} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: '#6B6D8A', pointerEvents: 'none' }} />
                  </div>
                </div>
              </div>

              {/* Phòng ban */}
              <div>
                <label style={labelStyle}>Phòng ban</label>
                <div style={{ position: 'relative' }}>
                  <select
                    value={form.departmentId}
                    onChange={e => setForm({ ...form, departmentId: e.target.value, teamId: '', positionId: '' })}
                    style={selectStyle}
                  >
                    <option value="">— Chọn phòng ban —</option>
                    {orgData.departments.map(d => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                  <ChevronDown size={16} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: '#6B6D8A', pointerEvents: 'none' }} />
                </div>
              </div>

              {/* Team */}
              <div>
                <label style={labelStyle}>Team</label>
                <div style={{ position: 'relative' }}>
                  <select
                    value={form.teamId}
                    onChange={e => setForm({ ...form, teamId: e.target.value, positionId: '' })}
                    style={selectStyle}
                    disabled={!form.departmentId}
                  >
                    <option value="">— Chọn team —</option>
                    {filteredTeams.map(t => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                  <ChevronDown size={16} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: '#6B6D8A', pointerEvents: 'none' }} />
                </div>
              </div>

              {/* Vị trí */}
              <div>
                <label style={labelStyle}>Vị trí</label>
                <div style={{ position: 'relative' }}>
                  <select
                    value={form.positionId}
                    onChange={e => setForm({ ...form, positionId: e.target.value })}
                    style={selectStyle}
                    disabled={!form.departmentId}
                  >
                    <option value="">— Chọn vị trí —</option>
                    {filteredPositions.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                  <ChevronDown size={16} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: '#6B6D8A', pointerEvents: 'none' }} />
                </div>
              </div>

              {/* Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px' }}>
                <button
                  onClick={() => setShowModal(false)}
                  style={{
                    padding: '10px 20px', borderRadius: '8px',
                    border: '1px solid #2D2F45', background: 'transparent',
                    color: '#9CA0B8', fontSize: '14px', cursor: 'pointer',
                  }}
                >
                  Huỷ
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  style={{
                    padding: '10px 24px', borderRadius: '8px', border: 'none',
                    background: saving ? '#5b21b6' : '#7c3aed', color: '#fff',
                    fontSize: '14px', fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer',
                    opacity: saving ? 0.7 : 1,
                  }}
                >
                  {saving ? 'Đang lưu...' : (editingUser ? 'Cập nhật' : 'Tạo nhân viên')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Shared styles
const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: '13px', fontWeight: 600,
  color: '#9CA0B8', marginBottom: '6px',
};

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 14px', borderRadius: '8px',
  border: '1px solid #2D2F45', background: '#141627',
  color: '#F9FAFB', fontSize: '14px', outline: 'none',
  boxSizing: 'border-box',
};

const selectStyle: React.CSSProperties = {
  width: '100%', padding: '10px 14px', borderRadius: '8px',
  border: '1px solid #2D2F45', background: '#141627',
  color: '#F9FAFB', fontSize: '14px', outline: 'none',
  appearance: 'none', boxSizing: 'border-box', cursor: 'pointer',
};
