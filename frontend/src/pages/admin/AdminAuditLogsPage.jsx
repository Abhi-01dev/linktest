import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import {
  History,
  ShieldAlert,
  ShieldCheck,
  User,
  Clock,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  Eye,
  AlertTriangle,
  Info,
  Lock,
  RefreshCw,
  X
} from 'lucide-react';

export function AdminAuditLogsPage() {
  const [activeTab, setActiveTab] = useState('audit'); // 'audit' | 'security'

  // Audit Logs State
  const [auditLogs, setAuditLogs] = useState([]);
  const [auditLoading, setAuditLoading] = useState(true);
  const [auditSearch, setAuditSearch] = useState('');
  const [auditActionFilter, setAuditActionFilter] = useState('ALL');
  const [auditResourceFilter, setAuditResourceFilter] = useState('ALL');
  const [auditPage, setAuditPage] = useState(1);
  const [auditTotalPages, setAuditTotalPages] = useState(1);
  const [auditTotalCount, setAuditTotalCount] = useState(0);

  // Security Logs State
  const [securityLogs, setSecurityLogs] = useState([]);
  const [securityLoading, setSecurityLoading] = useState(true);
  const [securitySearch, setSecuritySearch] = useState('');
  const [securityEventFilter, setSecurityEventFilter] = useState('ALL');
  const [securitySeverityFilter, setSecuritySeverityFilter] = useState('ALL');
  const [securityPage, setSecurityPage] = useState(1);
  const [securityTotalPages, setSecurityTotalPages] = useState(1);
  const [securityTotalCount, setSecurityTotalCount] = useState(0);

  // Modal State for Viewing Log Details
  const [selectedLog, setSelectedLog] = useState(null);

  const { showToast } = useToast();

  // Load Audit Logs
  const loadAuditLogs = async (page = 1) => {
    try {
      setAuditLoading(true);
      const res = await api.getAdminAuditLogs({
        search: auditSearch,
        action: auditActionFilter !== 'ALL' ? auditActionFilter : undefined,
        resource_type: auditResourceFilter !== 'ALL' ? auditResourceFilter : undefined,
        page,
        limit: 15
      });
      const logs = res?.logs || (Array.isArray(res) ? res : []);
      setAuditLogs(logs);
      setAuditPage(res?.page || page);
      setAuditTotalPages(res?.totalPages || 1);
      setAuditTotalCount(res?.total !== undefined ? res.total : logs.length);
    } catch (err) {
      showToast(err.message || 'Failed to load audit logs', 'error');
    } finally {
      setAuditLoading(false);
    }
  };

  // Load Security Logs
  const loadSecurityLogs = async (page = 1) => {
    try {
      setSecurityLoading(true);
      const res = await api.getAdminSecurityLogs({
        search: securitySearch,
        event_type: securityEventFilter !== 'ALL' ? securityEventFilter : undefined,
        severity: securitySeverityFilter !== 'ALL' ? securitySeverityFilter : undefined,
        page,
        limit: 15
      });
      const logs = res?.logs || (Array.isArray(res) ? res : []);
      setSecurityLogs(logs);
      setSecurityPage(res?.page || page);
      setSecurityTotalPages(res?.totalPages || 1);
      setSecurityTotalCount(res?.total !== undefined ? res.total : logs.length);
    } catch (err) {
      showToast(err.message || 'Failed to load security logs', 'error');
    } finally {
      setSecurityLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'audit') {
      loadAuditLogs(1);
    } else {
      loadSecurityLogs(1);
    }
  }, [activeTab, auditActionFilter, auditResourceFilter, securityEventFilter, securitySeverityFilter]);

  const handleAuditSearchSubmit = (e) => {
    e.preventDefault();
    loadAuditLogs(1);
  };

  const handleSecuritySearchSubmit = (e) => {
    e.preventDefault();
    loadSecurityLogs(1);
  };

  const getSeverityBadge = (severity) => {
    switch (severity?.toUpperCase()) {
      case 'CRITICAL':
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', padding: '0.2rem 0.55rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 700, background: '#FEE2E2', color: '#991B1B' }}>
            <AlertTriangle size={12} /> CRITICAL
          </span>
        );
      case 'HIGH':
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', padding: '0.2rem 0.55rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 700, background: '#FFEDD5', color: '#9A3412' }}>
            <AlertTriangle size={12} /> HIGH
          </span>
        );
      case 'WARNING':
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', padding: '0.2rem 0.55rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 700, background: '#FEF3C7', color: '#92400E' }}>
            <AlertTriangle size={12} /> WARNING
          </span>
        );
      case 'INFO':
      default:
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', padding: '0.2rem 0.55rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 600, background: '#DBEAFE', color: '#1E40AF' }}>
            <Info size={12} /> INFO
          </span>
        );
    }
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <span className="badge" style={{ background: '#EEF2FF', color: '#4338CA', border: '1px solid #C7D2FE', fontWeight: 700 }}>
              COMPLIANCE & GOVERNANCE
            </span>
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#0F172A', marginBottom: '0.25rem' }}>
            System Audit & Security Logs
          </h1>
          <p style={{ color: '#64748B', fontSize: '0.875rem' }}>
            Immutable chronological logging of administrative actions, authentication attempts, and authorization events.
          </p>
        </div>

        <button
          onClick={() => {
            if (activeTab === 'audit') loadAuditLogs(auditPage);
            else loadSecurityLogs(securityPage);
          }}
          className="btn btn-outline"
          style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem' }}
        >
          <RefreshCw size={15} /> Refresh Logs
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', borderBottom: '1px solid #E2E8F0', paddingBottom: '0.5rem' }}>
        <button
          onClick={() => setActiveTab('audit')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.65rem 1.25rem',
            borderRadius: '8px',
            border: 'none',
            fontSize: '0.9rem',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.15s ease',
            background: activeTab === 'audit' ? '#2563EB' : 'transparent',
            color: activeTab === 'audit' ? '#FFFFFF' : '#64748B'
          }}
        >
          <History size={16} /> Audit Trail ({auditTotalCount})
        </button>

        <button
          onClick={() => setActiveTab('security')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.65rem 1.25rem',
            borderRadius: '8px',
            border: 'none',
            fontSize: '0.9rem',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.15s ease',
            background: activeTab === 'security' ? '#2563EB' : 'transparent',
            color: activeTab === 'security' ? '#FFFFFF' : '#64748B'
          }}
        >
          <ShieldAlert size={16} /> Security & Auth Events ({securityTotalCount})
        </button>
      </div>

      {/* ── TAB 1: AUDIT TRAIL ── */}
      {activeTab === 'audit' && (
        <>
          {/* Controls & Filters */}
          <div className="card" style={{ padding: '1rem 1.25rem', marginBottom: '1.25rem', display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center' }}>
            <form onSubmit={handleAuditSearchSubmit} style={{ flex: '1 1 280px', display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#F8FAFC', padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
              <Search size={16} style={{ color: '#94A3B8' }} />
              <input
                type="text"
                placeholder="Search action, actor, or summary..."
                value={auditSearch}
                onChange={(e) => setAuditSearch(e.target.value)}
                style={{ width: '100%', border: 'none', outline: 'none', fontSize: '0.875rem', background: 'transparent' }}
              />
            </form>

            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <select
                value={auditActionFilter}
                onChange={(e) => setAuditActionFilter(e.target.value)}
                style={{ padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid #E2E8F0', fontSize: '0.85rem', color: '#334155', background: '#FFFFFF', outline: 'none' }}
              >
                <option value="ALL">All Actions</option>
                <option value="USER_ROLE_OR_STATUS_UPDATED">USER_ROLE_OR_STATUS_UPDATED</option>
                <option value="USER_STATUS_CHANGED">USER_STATUS_CHANGED</option>
                <option value="STUDENT_ENROLLED">STUDENT_ENROLLED</option>
                <option value="TEACHER_ASSIGNED">TEACHER_ASSIGNED</option>
                <option value="CLASS_CREATED">CLASS_CREATED</option>
                <option value="BATCH_CREATED">BATCH_CREATED</option>
                <option value="SUBJECT_CREATED">SUBJECT_CREATED</option>
                <option value="LEAVE_REQUEST_REVIEWED">LEAVE_REQUEST_REVIEWED</option>
              </select>

              <select
                value={auditResourceFilter}
                onChange={(e) => setAuditResourceFilter(e.target.value)}
                style={{ padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid #E2E8F0', fontSize: '0.85rem', color: '#334155', background: '#FFFFFF', outline: 'none' }}
              >
                <option value="ALL">All Resource Types</option>
                <option value="user">User</option>
                <option value="student">Student</option>
                <option value="teacher_assignment">Teacher Assignment</option>
                <option value="class">Class</option>
                <option value="batch">Batch</option>
                <option value="subject">Subject</option>
                <option value="leave_request">Leave Request</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            {auditLoading ? (
              <div style={{ padding: '3.5rem', textAlign: 'center', color: '#64748B' }}>
                <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 0.75rem', color: '#2563EB' }} />
                <p>Loading audit trail records...</p>
              </div>
            ) : auditLogs.length === 0 ? (
              <div style={{ padding: '3.5rem', textAlign: 'center', color: '#64748B' }}>
                <History size={36} style={{ margin: '0 auto 0.75rem', opacity: 0.4 }} />
                <p style={{ fontWeight: 600, color: '#334155' }}>No audit records found</p>
                <p style={{ fontSize: '0.8rem' }}>Try clearing filters or performing administrative operations.</p>
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
                <thead>
                  <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#475569', fontWeight: 600 }}>
                    <th style={{ padding: '0.85rem 1.25rem' }}>Timestamp</th>
                    <th style={{ padding: '0.85rem 1.25rem' }}>Action Code</th>
                    <th style={{ padding: '0.85rem 1.25rem' }}>Actor</th>
                    <th style={{ padding: '0.85rem 1.25rem' }}>Entity</th>
                    <th style={{ padding: '0.85rem 1.25rem' }}>Summary Details</th>
                  </tr>
                </thead>
                <tbody>
                  {auditLogs.map((l) => (
                    <tr key={l.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                      <td style={{ padding: '0.85rem 1.25rem', color: '#64748B', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
                        {new Date(l.created_at).toLocaleString()}
                      </td>
                      <td style={{ padding: '0.85rem 1.25rem' }}>
                        <span style={{ padding: '0.2rem 0.5rem', background: '#F1F5F9', color: '#334155', borderRadius: '4px', fontFamily: 'monospace', fontSize: '0.78rem', fontWeight: 700 }}>
                          {l.action}
                        </span>
                      </td>
                      <td style={{ padding: '0.85rem 1.25rem', color: '#0F172A', fontWeight: 500 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <User size={13} style={{ color: '#2563EB' }} />
                          <span>{l.actor_email || 'System'}</span>
                        </div>
                      </td>
                      <td style={{ padding: '0.85rem 1.25rem', color: '#64748B', fontSize: '0.8rem' }}>
                        {l.resource_type || '—'}
                      </td>
                      <td style={{ padding: '0.85rem 1.25rem', color: '#334155', maxWidth: '380px' }}>
                        {l.summary}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {/* Pagination */}
            {!auditLoading && auditTotalPages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.85rem 1.25rem', borderTop: '1px solid #E2E8F0', background: '#F8FAFC' }}>
                <span style={{ fontSize: '0.8rem', color: '#64748B' }}>
                  Showing page {auditPage} of {auditTotalPages} ({auditTotalCount} total actions)
                </span>
                <div style={{ display: 'flex', gap: '0.4rem' }}>
                  <button
                    onClick={() => loadAuditLogs(auditPage - 1)}
                    disabled={auditPage <= 1}
                    className="btn btn-outline"
                    style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem', opacity: auditPage <= 1 ? 0.5 : 1 }}
                  >
                    <ChevronLeft size={14} /> Previous
                  </button>
                  <button
                    onClick={() => loadAuditLogs(auditPage + 1)}
                    disabled={auditPage >= auditTotalPages}
                    className="btn btn-outline"
                    style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem', opacity: auditPage >= auditTotalPages ? 0.5 : 1 }}
                  >
                    Next <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* ── TAB 2: SECURITY LOGS ── */}
      {activeTab === 'security' && (
        <>
          {/* Controls & Filters */}
          <div className="card" style={{ padding: '1rem 1.25rem', marginBottom: '1.25rem', display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center' }}>
            <form onSubmit={handleSecuritySearchSubmit} style={{ flex: '1 1 280px', display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#F8FAFC', padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
              <Search size={16} style={{ color: '#94A3B8' }} />
              <input
                type="text"
                placeholder="Search event type, email, IP, or details..."
                value={securitySearch}
                onChange={(e) => setSecuritySearch(e.target.value)}
                style={{ width: '100%', border: 'none', outline: 'none', fontSize: '0.875rem', background: 'transparent' }}
              />
            </form>

            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <select
                value={securitySeverityFilter}
                onChange={(e) => setSecuritySeverityFilter(e.target.value)}
                style={{ padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid #E2E8F0', fontSize: '0.85rem', color: '#334155', background: '#FFFFFF', outline: 'none' }}
              >
                <option value="ALL">All Severities</option>
                <option value="INFO">INFO</option>
                <option value="WARNING">WARNING</option>
                <option value="HIGH">HIGH</option>
                <option value="CRITICAL">CRITICAL</option>
              </select>

              <select
                value={securityEventFilter}
                onChange={(e) => setSecurityEventFilter(e.target.value)}
                style={{ padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid #E2E8F0', fontSize: '0.85rem', color: '#334155', background: '#FFFFFF', outline: 'none' }}
              >
                <option value="ALL">All Event Types</option>
                <option value="LOGIN_SUCCESS">LOGIN_SUCCESS</option>
                <option value="LOGIN_FAILED">LOGIN_FAILED</option>
                <option value="UNAUTHORIZED_ACCESS_ATTEMPT">UNAUTHORIZED_ACCESS_ATTEMPT</option>
                <option value="RATE_LIMIT_EXCEEDED">RATE_LIMIT_EXCEEDED</option>
                <option value="OAUTH_LOGIN_SUCCESS">OAUTH_LOGIN_SUCCESS</option>
                <option value="OAUTH_LOGIN_FAILED">OAUTH_LOGIN_FAILED</option>
                <option value="REGISTER_SUCCESS">REGISTER_SUCCESS</option>
                <option value="PASSWORD_RESET_SUCCESS">PASSWORD_RESET_SUCCESS</option>
                <option value="PASSWORD_CHANGED">PASSWORD_CHANGED</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            {securityLoading ? (
              <div style={{ padding: '3.5rem', textAlign: 'center', color: '#64748B' }}>
                <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 0.75rem', color: '#2563EB' }} />
                <p>Loading security event stream...</p>
              </div>
            ) : securityLogs.length === 0 ? (
              <div style={{ padding: '3.5rem', textAlign: 'center', color: '#64748B' }}>
                <ShieldCheck size={36} style={{ margin: '0 auto 0.75rem', color: '#10B981', opacity: 0.7 }} />
                <p style={{ fontWeight: 600, color: '#334155' }}>No security events found</p>
                <p style={{ fontSize: '0.8rem' }}>The system is operating securely within normal baseline parameters.</p>
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
                <thead>
                  <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#475569', fontWeight: 600 }}>
                    <th style={{ padding: '0.85rem 1.25rem' }}>Timestamp</th>
                    <th style={{ padding: '0.85rem 1.25rem' }}>Severity</th>
                    <th style={{ padding: '0.85rem 1.25rem' }}>Event Type</th>
                    <th style={{ padding: '0.85rem 1.25rem' }}>Account / Identity</th>
                    <th style={{ padding: '0.85rem 1.25rem' }}>IP & Details</th>
                    <th style={{ padding: '0.85rem 1.25rem', textAlign: 'right' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {securityLogs.map((s) => (
                    <tr key={s.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                      <td style={{ padding: '0.85rem 1.25rem', color: '#64748B', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
                        {new Date(s.created_at).toLocaleString()}
                      </td>
                      <td style={{ padding: '0.85rem 1.25rem' }}>
                        {getSeverityBadge(s.severity)}
                      </td>
                      <td style={{ padding: '0.85rem 1.25rem' }}>
                        <span style={{ padding: '0.2rem 0.5rem', background: '#F1F5F9', color: '#1E293B', borderRadius: '4px', fontFamily: 'monospace', fontSize: '0.78rem', fontWeight: 700 }}>
                          {s.event_type}
                        </span>
                      </td>
                      <td style={{ padding: '0.85rem 1.25rem', color: '#0F172A', fontWeight: 500 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <User size={13} style={{ color: '#64748B' }} />
                          <span style={{ fontSize: '0.85rem' }}>{s.user_email || 'Unauthenticated'}</span>
                        </div>
                      </td>
                      <td style={{ padding: '0.85rem 1.25rem', color: '#334155', maxWidth: '320px' }}>
                        <div style={{ fontSize: '0.8rem', color: '#64748B', marginBottom: '0.15rem' }}>
                          IP: {s.ip_address || 'Internal/Loopback'}
                        </div>
                        <div style={{ fontSize: '0.825rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {s.details}
                        </div>
                      </td>
                      <td style={{ padding: '0.85rem 1.25rem', textAlign: 'right' }}>
                        <button
                          onClick={() => setSelectedLog(s)}
                          className="btn btn-outline"
                          style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}
                        >
                          <Eye size={13} /> View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {/* Pagination */}
            {!securityLoading && securityTotalPages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.85rem 1.25rem', borderTop: '1px solid #E2E8F0', background: '#F8FAFC' }}>
                <span style={{ fontSize: '0.8rem', color: '#64748B' }}>
                  Showing page {securityPage} of {securityTotalPages} ({securityTotalCount} total events)
                </span>
                <div style={{ display: 'flex', gap: '0.4rem' }}>
                  <button
                    onClick={() => loadSecurityLogs(securityPage - 1)}
                    disabled={securityPage <= 1}
                    className="btn btn-outline"
                    style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem', opacity: securityPage <= 1 ? 0.5 : 1 }}
                  >
                    <ChevronLeft size={14} /> Previous
                  </button>
                  <button
                    onClick={() => loadSecurityLogs(securityPage + 1)}
                    disabled={securityPage >= securityTotalPages}
                    className="btn btn-outline"
                    style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem', opacity: securityPage >= securityTotalPages ? 0.5 : 1 }}
                  >
                    Next <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* ── SECURITY EVENT DETAILS MODAL ── */}
      {selectedLog && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div className="card" style={{ maxWidth: '640px', width: '100%', maxHeight: '90vh', overflowY: 'auto', padding: '1.75rem', position: 'relative' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid #E2E8F0', paddingBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <ShieldAlert size={20} style={{ color: '#2563EB' }} />
                <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#0F172A', margin: 0 }}>
                  Security Event Inspection
                </h3>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748B', display: 'flex', alignItems: 'center' }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem', fontSize: '0.85rem' }}>
              <div>
                <span style={{ color: '#64748B', display: 'block', fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 600 }}>Event ID</span>
                <span style={{ fontFamily: 'monospace', color: '#0F172A', fontWeight: 600 }}>{selectedLog.id}</span>
              </div>
              <div>
                <span style={{ color: '#64748B', display: 'block', fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 600 }}>Severity</span>
                <div style={{ marginTop: '0.2rem' }}>{getSeverityBadge(selectedLog.severity)}</div>
              </div>
              <div>
                <span style={{ color: '#64748B', display: 'block', fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 600 }}>Event Type</span>
                <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#1E293B' }}>{selectedLog.event_type}</span>
              </div>
              <div>
                <span style={{ color: '#64748B', display: 'block', fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 600 }}>Timestamp</span>
                <span>{new Date(selectedLog.created_at).toLocaleString()}</span>
              </div>
              <div>
                <span style={{ color: '#64748B', display: 'block', fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 600 }}>User Email</span>
                <span>{selectedLog.user_email || 'Unauthenticated / Anonymous'}</span>
              </div>
              <div>
                <span style={{ color: '#64748B', display: 'block', fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 600 }}>User ID</span>
                <span style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{selectedLog.user_id || 'None'}</span>
              </div>
              <div>
                <span style={{ color: '#64748B', display: 'block', fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 600 }}>IP Address</span>
                <span style={{ fontFamily: 'monospace' }}>{selectedLog.ip_address || 'Unknown'}</span>
              </div>
              <div>
                <span style={{ color: '#64748B', display: 'block', fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 600 }}>User Agent</span>
                <span style={{ fontSize: '0.75rem', color: '#475569', wordBreak: 'break-all' }}>{selectedLog.user_agent || 'Unknown'}</span>
              </div>
            </div>

            <div style={{ marginBottom: '1.25rem' }}>
              <span style={{ color: '#64748B', display: 'block', fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 600, marginBottom: '0.35rem' }}>Event Details</span>
              <div style={{ padding: '0.75rem', background: '#F8FAFC', borderRadius: '6px', border: '1px solid #E2E8F0', fontSize: '0.85rem', color: '#1E293B' }}>
                {selectedLog.details || 'No additional summary provided.'}
              </div>
            </div>

            <div>
              <span style={{ color: '#64748B', display: 'block', fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 600, marginBottom: '0.35rem' }}>
                Sanitized Context Metadata (Secrets Redacted)
              </span>
              <pre style={{ margin: 0, padding: '0.75rem', background: '#0F172A', color: '#38BDF8', borderRadius: '6px', fontSize: '0.78rem', overflowX: 'auto', maxHeight: '180px' }}>
                {selectedLog.metadata
                  ? JSON.stringify(typeof selectedLog.metadata === 'string' ? JSON.parse(selectedLog.metadata) : selectedLog.metadata, null, 2)
                  : '// No extended metadata payload recorded'}
              </pre>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
              <button onClick={() => setSelectedLog(null)} className="btn btn-outline" style={{ fontSize: '0.85rem' }}>
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminAuditLogsPage;
