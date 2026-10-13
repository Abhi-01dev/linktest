import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import {
  Users,
  ArrowLeft,
  Shield,
  BookOpen,
  Award,
  Mail,
  Search,
  Filter,
  Edit,
  ShieldAlert,
  CheckCircle,
  AlertCircle,
  X,
  UserCheck
} from 'lucide-react';

export function AdminUsersPage() {
  const { showToast } = useToast();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters & Search
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Edit Role/Status Modal
  const [editingUser, setEditingUser] = useState(null);
  const [targetRole, setTargetRole] = useState('STUDENT');
  const [targetStatus, setTargetStatus] = useState('active');
  const [auditReason, setAuditReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [modalError, setModalError] = useState('');

  const loadUsers = async () => {
    try {
      setLoading(true);
      const list = await api.getAdminUsers();
      setUsers(Array.isArray(list) ? list : []);
    } catch (err) {
      showToast(err.message || 'Failed to load user roster', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const q = search.toLowerCase().trim();
      const matchSearch =
        !q ||
        u.full_name?.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q) ||
        u.id?.toLowerCase().includes(q);

      const matchRole = roleFilter === 'ALL' || u.role?.toUpperCase() === roleFilter.toUpperCase();
      const matchStatus = statusFilter === 'ALL' || (u.status || 'active').toLowerCase() === statusFilter.toLowerCase();

      return matchSearch && matchRole && matchStatus;
    });
  }, [users, search, roleFilter, statusFilter]);

  const handleOpenEdit = (user) => {
    setEditingUser(user);
    setTargetRole(user.role || 'STUDENT');
    setTargetStatus(user.status || 'active');
    setAuditReason('');
    setModalError('');
  };

  const handleSaveUser = async (e) => {
    e.preventDefault();
    if (!editingUser) return;
    setModalError('');

    if (!auditReason.trim()) {
      setModalError('Please provide an administrative reason for this role/status change for audit logging.');
      return;
    }

    try {
      setSubmitting(true);
      await api.updateAdminUser(editingUser.id, {
        role: targetRole,
        status: targetStatus,
        reason: auditReason.trim()
      });
      showToast(`User account updated and audit log recorded`, 'success');
      setEditingUser(null);
      loadUsers();
    } catch (err) {
      setModalError(err.message || 'Failed to update user account');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <Link
          to="/admin"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            fontSize: '0.85rem',
            color: '#64748B',
            textDecoration: 'none',
            marginBottom: '0.5rem'
          }}
        >
          <ArrowLeft size={15} />
          <span>Back to Admin Overview</span>
        </Link>
        <h1 style={{ fontSize: '1.85rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>
          User Accounts, Roles & Access
        </h1>
        <p style={{ fontSize: '0.88rem', color: '#64748B', marginTop: '0.25rem' }}>
          Secure, audited directory of registered learners, teachers, and administrators.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div
        className="card"
        style={{
          padding: '1.25rem',
          marginBottom: '1.75rem',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '1rem',
          alignItems: 'center',
          background: '#FFFFFF',
          border: '1px solid #E2E8F0',
          borderRadius: '12px'
        }}
      >
        <div
          style={{
            flex: '1 1 280px',
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem',
            background: '#F8FAFC',
            padding: '0.55rem 0.9rem',
            borderRadius: '8px',
            border: '1px solid #E2E8F0'
          }}
        >
          <Search size={18} style={{ color: '#94A3B8' }} />
          <input
            type="text"
            placeholder="Search users by name, email, or account ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: '100%', border: 'none', outline: 'none', background: 'transparent', fontSize: '0.88rem' }}
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8', padding: 0 }}
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Role Filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#64748B' }}>Role:</span>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            style={{
              padding: '0.5rem 0.85rem',
              borderRadius: '8px',
              border: '1px solid #E2E8F0',
              background: '#F8FAFC',
              fontSize: '0.85rem',
              color: '#334155',
              cursor: 'pointer'
            }}
          >
            <option value="ALL">All Roles</option>
            <option value="STUDENT">Student</option>
            <option value="TEACHER">Teacher</option>
            <option value="ADMIN">Admin</option>
          </select>
        </div>

        {/* Status Filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#64748B' }}>Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{
              padding: '0.5rem 0.85rem',
              borderRadius: '8px',
              border: '1px solid #E2E8F0',
              background: '#F8FAFC',
              fontSize: '0.85rem',
              color: '#334155',
              cursor: 'pointer'
            }}
          >
            <option value="ALL">All Statuses</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
            <option value="deactivated">Deactivated</option>
          </select>
        </div>

        <div style={{ marginLeft: 'auto', fontSize: '0.82rem', color: '#64748B', fontWeight: 600 }}>
          Showing {filteredUsers.length} of {users.length} accounts
        </div>
      </div>

      {/* Users Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden', background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '12px' }}>
        <div style={{ overflowX: 'auto' }}>
          {loading ? (
            <div style={{ padding: '3.5rem', textAlign: 'center', color: '#64748B' }}>
              Loading platform user directory...
            </div>
          ) : filteredUsers.length === 0 ? (
            <div style={{ padding: '3.5rem', textAlign: 'center', color: '#64748B' }}>
              No user accounts match the current filter criteria.
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#475569', fontWeight: 600 }}>
                  <th style={{ padding: '0.9rem 1.25rem' }}>User Details</th>
                  <th style={{ padding: '0.9rem 1.25rem' }}>Role Authorization</th>
                  <th style={{ padding: '0.9rem 1.25rem' }}>Account Status</th>
                  <th style={{ padding: '0.9rem 1.25rem' }}>Course Enrollments</th>
                  <th style={{ padding: '0.9rem 1.25rem' }}>Quiz Attempts</th>
                  <th style={{ padding: '0.9rem 1.25rem' }}>Registered On</th>
                  <th style={{ padding: '0.9rem 1.25rem', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((u) => {
                  const roleBadges = {
                    ADMIN: { bg: '#FEF2F2', text: '#991B1B', border: '#FCA5A5' },
                    TEACHER: { bg: '#EFF6FF', text: '#1E40AF', border: '#BFDBFE' },
                    STUDENT: { bg: '#F1F5F9', text: '#334155', border: '#CBD5E1' }
                  };
                  const rb = roleBadges[u.role] || roleBadges.STUDENT;

                  const statusColors = {
                    active: { bg: '#DCFCE7', text: '#166534' },
                    suspended: { bg: '#FEF3C7', text: '#92400E' },
                    deactivated: { bg: '#FEE2E2', text: '#991B1B' }
                  };
                  const sc = statusColors[(u.status || 'active').toLowerCase()] || statusColors.active;

                  return (
                    <tr key={u.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                      <td style={{ padding: '0.9rem 1.25rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                          <div
                            style={{
                              width: 34,
                              height: 34,
                              borderRadius: '50%',
                              background: u.role === 'ADMIN' ? 'rgba(239, 68, 68, 0.1)' : u.role === 'TEACHER' ? 'rgba(37, 99, 235, 0.1)' : '#F1F5F9',
                              color: u.role === 'ADMIN' ? '#EF4444' : u.role === 'TEACHER' ? '#2563EB' : '#475569',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 700,
                              fontSize: '0.82rem'
                            }}
                          >
                            {u.full_name?.charAt(0) || 'U'}
                          </div>
                          <div>
                            <strong style={{ fontSize: '0.92rem', color: '#0F172A', display: 'block' }}>
                              {u.full_name}
                            </strong>
                            <span style={{ fontSize: '0.78rem', color: '#64748B' }}>{u.email}</span>
                          </div>
                        </div>
                      </td>

                      <td style={{ padding: '0.9rem 1.25rem' }}>
                        <span
                          style={{
                            fontSize: '0.74rem',
                            fontWeight: 700,
                            padding: '0.2rem 0.6rem',
                            borderRadius: '999px',
                            background: rb.bg,
                            color: rb.text,
                            border: `1px solid ${rb.border}`
                          }}
                        >
                          {u.role}
                        </span>
                      </td>

                      <td style={{ padding: '0.9rem 1.25rem' }}>
                        <span
                          style={{
                            fontSize: '0.74rem',
                            fontWeight: 700,
                            padding: '0.2rem 0.6rem',
                            borderRadius: '999px',
                            background: sc.bg,
                            color: sc.text,
                            textTransform: 'uppercase'
                          }}
                        >
                          {u.status || 'active'}
                        </span>
                      </td>

                      <td style={{ padding: '0.9rem 1.25rem' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#334155' }}>
                          <BookOpen size={14} style={{ color: '#F97316' }} />
                          <span>{u.enrolled_courses_count || 0}</span>
                        </span>
                      </td>

                      <td style={{ padding: '0.9rem 1.25rem' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#334155' }}>
                          <Award size={14} style={{ color: '#2563EB' }} />
                          <span>{u.quiz_attempts_count || 0}</span>
                        </span>
                      </td>

                      <td style={{ padding: '0.9rem 1.25rem', color: '#64748B', fontSize: '0.82rem' }}>
                        {u.created_at ? new Date(u.created_at).toLocaleDateString() : 'N/A'}
                      </td>

                      <td style={{ padding: '0.9rem 1.25rem', textAlign: 'right' }}>
                        <button
                          onClick={() => handleOpenEdit(u)}
                          className="btn btn-outline btn-sm"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.35rem',
                            fontSize: '0.78rem',
                            padding: '0.35rem 0.65rem'
                          }}
                        >
                          <Edit size={14} />
                          <span>Edit Role</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* EDIT ROLE / STATUS MODAL */}
      {editingUser && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 999,
            padding: '1rem'
          }}
        >
          <div
            className="card"
            style={{
              maxWidth: '480px',
              width: '100%',
              padding: '2rem',
              borderRadius: '16px',
              background: '#FFFFFF'
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '1.25rem'
              }}
            >
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>
                  Modify Role & Access
                </h3>
                <p style={{ fontSize: '0.82rem', color: '#64748B', marginTop: '0.2rem' }}>
                  {editingUser.full_name} ({editingUser.email})
                </p>
              </div>
              <button
                onClick={() => setEditingUser(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8' }}
              >
                <X size={20} />
              </button>
            </div>

            {modalError && (
              <div
                style={{
                  padding: '0.75rem 1rem',
                  borderRadius: '8px',
                  background: '#FEF2F2',
                  border: '1px solid #FCA5A5',
                  color: '#991B1B',
                  fontSize: '0.84rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  marginBottom: '1.25rem'
                }}
              >
                <AlertCircle size={16} style={{ flexShrink: 0 }} />
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleSaveUser}>
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label className="form-label" style={{ fontSize: '0.84rem' }}>
                  System Role Authorization
                </label>
                <select
                  className="form-input"
                  value={targetRole}
                  onChange={(e) => setTargetRole(e.target.value)}
                >
                  <option value="STUDENT">STUDENT (Standard Learner)</option>
                  <option value="TEACHER">TEACHER (Faculty & Assessment Creator)</option>
                  <option value="ADMIN">ADMIN (Full Platform Authority)</option>
                </select>
              </div>

              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label className="form-label" style={{ fontSize: '0.84rem' }}>
                  Account Status
                </label>
                <select
                  className="form-input"
                  value={targetStatus}
                  onChange={(e) => setTargetStatus(e.target.value)}
                >
                  <option value="active">Active (Full Access)</option>
                  <option value="suspended">Suspended (Access Temporarily Blocked)</option>
                  <option value="deactivated">Deactivated (Account Closed)</option>
                </select>
              </div>

              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label className="form-label" style={{ fontSize: '0.84rem' }}>
                  Administrative Audit Reason *
                </label>
                <textarea
                  className="form-input"
                  value={auditReason}
                  onChange={(e) => setAuditReason(e.target.value)}
                  placeholder="e.g. Promoted faculty member after verification; correct misassigned role..."
                  rows={3}
                  required
                />
                <span style={{ fontSize: '0.74rem', color: '#94A3B8', marginTop: '0.25rem', display: 'block' }}>
                  This action is recorded in immutable audit logs with your Administrator identity.
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="btn btn-outline"
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Applying Changes...' : 'Save & Audit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminUsersPage;
