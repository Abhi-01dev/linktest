import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { StudentNav } from '../../components/student/StudentNav';
import { useToast } from '../../context/ToastContext';
import { ClipboardCheck, CheckCircle2, Clock, XCircle, Calendar, ShieldCheck, AlertTriangle, AlertCircle, Filter } from 'lucide-react';

export function StudentAttendancePage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all'); // all, present, late, absent
  const [subjectFilter, setSubjectFilter] = useState('all');

  const { showToast } = useToast();

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const res = await api.getStudentAttendance();
        setData(res);
      } catch (err) {
        showToast(err.message || 'Failed to load attendance records', 'error');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const summary = data?.summary || { total: 0, present: 0, late: 0, absent: 0, percentage: 100 };
  const records = data?.records || [];

  const percentage = summary.percentage ?? 100;
  const statusColor = percentage >= 75 ? '#16A34A' : percentage >= 65 ? '#D97706' : '#DC2626';
  const statusBg = percentage >= 75 ? '#DCFCE7' : percentage >= 65 ? '#FEF3C7' : '#FEE2E2';
  const statusTier = percentage >= 75 ? 'Safe Band (≥75%)' : percentage >= 65 ? 'Warning Band (65-74%)' : 'Critical Shortage (<65%)';
  const statusGuidance = percentage >= 75
    ? 'You meet the mandatory minimum 75% attendance policy and qualify for upcoming semester examinations.'
    : percentage >= 65
    ? 'You are approaching the minimum threshold. Additional absences may jeopardize your exam eligibility.'
    : 'Your attendance is strictly below the mandatory institutional limit. Immediate rectification required.';

  // Subject options
  const subjects = Array.from(new Set(records.map(r => r.subject_name).filter(Boolean)));

  const filteredRecords = records.filter(r => {
    if (statusFilter !== 'all' && r.status !== statusFilter) return false;
    if (subjectFilter !== 'all' && r.subject_name !== subjectFilter) return false;
    return true;
  });

  return (
    <div style={{ padding: '2.5rem 0 5rem' }}>
      <div className="container">
        <StudentNav />

        <div style={{ marginBottom: '1.75rem' }}>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--color-navy)', marginBottom: '0.25rem' }}>
            My Attendance Record & Turnout
          </h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>
            Track your semester attendance percentage, presence history, and verified classroom sessions.
          </p>
        </div>

        {/* Attendance Safety Threshold Gauge Card */}
        <div className="card" style={{ padding: '1.75rem', marginBottom: '1.75rem', borderLeft: `6px solid ${statusColor}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                <span style={{ fontSize: '0.72rem', fontWeight: 800, padding: '0.2rem 0.55rem', borderRadius: '4px', background: statusBg, color: statusColor, textTransform: 'uppercase' }}>
                  {statusTier}
                </span>
                <span style={{ fontSize: '0.75rem', color: '#64748B' }}>
                  Institutional Threshold: 75%
                </span>
              </div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-navy)', margin: '0 0 0.35rem 0' }}>
                Overall Turnout: <span style={{ color: statusColor }}>{percentage}%</span>
              </h2>
              <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', margin: 0, maxWidth: '650px', lineHeight: 1.5 }}>
                {statusGuidance}
              </p>
            </div>

            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Verified Attendance Ratio</div>
              <div style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--color-navy)', marginTop: '0.15rem' }}>
                {summary.present + summary.late} / {summary.total} sessions
              </div>
            </div>
          </div>

          {/* Color Safety Range Bar */}
          <div style={{ position: 'relative', height: '14px', background: '#E2E8F0', borderRadius: '999px', overflow: 'hidden', marginBottom: '0.75rem' }}>
            <div style={{ width: `${Math.min(100, percentage)}%`, height: '100%', background: statusColor, borderRadius: '999px', transition: 'width 0.6s ease' }} />
          </div>

          {/* Threshold markers */}
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>
            <span style={{ color: '#DC2626' }}>0% - 64% (Critical / Disqualified)</span>
            <span style={{ color: '#D97706' }}>65% - 74% (Safety Warning)</span>
            <span style={{ color: '#16A34A' }}>75% - 100% (Qualified & Safe)</span>
          </div>
        </div>

        {/* Metrics Row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
          <div className="card" style={{ padding: '1.25rem' }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', fontWeight: 600 }}>Total Lectures</div>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--color-navy)', marginTop: '0.25rem' }}>
              {summary.total}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.2rem' }}>Recorded by faculty</div>
          </div>

          <div className="card" style={{ padding: '1.25rem' }}>
            <div style={{ fontSize: '0.8rem', color: '#16A34A', fontWeight: 600 }}>Days Present</div>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: '#16A34A', marginTop: '0.25rem' }}>
              {summary.present}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.2rem' }}>On-time attendance</div>
          </div>

          <div className="card" style={{ padding: '1.25rem' }}>
            <div style={{ fontSize: '0.8rem', color: '#D97706', fontWeight: 600 }}>Tardy / Late</div>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: '#D97706', marginTop: '0.25rem' }}>
              {summary.late}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.2rem' }}>Credited with warning</div>
          </div>

          <div className="card" style={{ padding: '1.25rem' }}>
            <div style={{ fontSize: '0.8rem', color: '#DC2626', fontWeight: 600 }}>Absent</div>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: '#DC2626', marginTop: '0.25rem' }}>
              {summary.absent}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.2rem' }}>Missed lectures</div>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
            {['all', 'present', 'late', 'absent'].map(st => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className="btn btn-sm"
                style={{
                  fontSize: '0.78rem',
                  padding: '0.35rem 0.75rem',
                  borderRadius: '6px',
                  background: statusFilter === st ? 'var(--color-navy)' : 'var(--color-bg-alt)',
                  color: statusFilter === st ? '#FFFFFF' : 'var(--color-navy)',
                  borderColor: statusFilter === st ? 'var(--color-navy)' : 'var(--color-border)',
                  textTransform: 'capitalize'
                }}
              >
                {st === 'all' ? 'All Sessions' : st}
              </button>
            ))}
          </div>

          {subjects.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Filter size={14} style={{ color: 'var(--color-text-muted)' }} />
              <select
                value={subjectFilter}
                onChange={(e) => setSubjectFilter(e.target.value)}
                style={{
                  fontSize: '0.8rem',
                  padding: '0.35rem 0.65rem',
                  borderRadius: '6px',
                  border: '1px solid var(--color-border)',
                  background: 'var(--color-bg-alt)'
                }}
              >
                <option value="all">All Subjects</option>
                {subjects.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Attendance Records Table */}
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          {loading ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: '#64748B' }}>Loading attendance records...</div>
          ) : filteredRecords.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: '#64748B' }}>
              No attendance records found matching the active filters.
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ background: 'var(--color-bg-alt)', borderBottom: '1px solid var(--color-border)', color: 'var(--color-navy)', fontWeight: 600 }}>
                  <th style={{ padding: '0.85rem 1.25rem' }}>Date</th>
                  <th style={{ padding: '0.85rem 1.25rem' }}>Subject</th>
                  <th style={{ padding: '0.85rem 1.25rem' }}>Status</th>
                  <th style={{ padding: '0.85rem 1.25rem' }}>Faculty Remarks</th>
                </tr>
              </thead>
              <tbody>
                {filteredRecords.map(r => (
                  <tr key={r.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                    <td style={{ padding: '0.85rem 1.25rem', fontWeight: 600, color: 'var(--color-navy)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <Calendar size={13} style={{ color: 'var(--color-orange)' }} />
                        <span>{r.date ? new Date(r.date).toLocaleDateString() : 'N/A'}</span>
                      </div>
                    </td>
                    <td style={{ padding: '0.85rem 1.25rem', color: 'var(--color-navy)', fontWeight: 500 }}>
                      {r.subject_name || 'Course Lecture'}
                    </td>
                    <td style={{ padding: '0.85rem 1.25rem' }}>
                      <span
                        style={{
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          padding: '0.2rem 0.55rem',
                          borderRadius: '4px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.3rem',
                          background: r.status === 'present' ? '#DCFCE7' : r.status === 'late' ? '#FEF3C7' : '#FEE2E2',
                          color: r.status === 'present' ? '#166534' : r.status === 'late' ? '#92400E' : '#991B1B'
                        }}
                      >
                        {r.status === 'present' && <CheckCircle2 size={11} />}
                        {r.status === 'late' && <Clock size={11} />}
                        {r.status === 'absent' && <XCircle size={11} />}
                        <span>{r.status}</span>
                      </span>
                    </td>
                    <td style={{ padding: '0.85rem 1.25rem', color: 'var(--color-text-secondary)', fontSize: '0.82rem' }}>
                      {r.remarks || 'Standard verified attendance'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

export default StudentAttendancePage;
