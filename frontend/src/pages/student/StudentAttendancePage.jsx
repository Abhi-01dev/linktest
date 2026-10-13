import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { StudentNav } from '../../components/student/StudentNav';
import { useToast } from '../../context/ToastContext';
import { ClipboardCheck, CheckCircle2, Clock, XCircle, Calendar } from 'lucide-react';

export function StudentAttendancePage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

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

        {/* Metrics Row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
          <div className="card" style={{ padding: '1.25rem' }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', fontWeight: 600 }}>Overall Turnout</div>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: summary.percentage >= 75 ? '#16A34A' : '#DC2626', marginTop: '0.25rem' }}>
              {summary.percentage}%
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.2rem' }}>
              {summary.percentage >= 75 ? 'Meets 75% Requirement' : 'Below Minimum Requirement'}
            </div>
          </div>

          <div className="card" style={{ padding: '1.25rem' }}>
            <div style={{ fontSize: '0.8rem', color: '#16A34A', fontWeight: 600 }}>Days Present</div>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: '#16A34A', marginTop: '0.25rem' }}>
              {summary.present}
            </div>
          </div>

          <div className="card" style={{ padding: '1.25rem' }}>
            <div style={{ fontSize: '0.8rem', color: '#D97706', fontWeight: 600 }}>Tardy / Late</div>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: '#D97706', marginTop: '0.25rem' }}>
              {summary.late}
            </div>
          </div>

          <div className="card" style={{ padding: '1.25rem' }}>
            <div style={{ fontSize: '0.8rem', color: '#DC2626', fontWeight: 600 }}>Absent</div>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: '#DC2626', marginTop: '0.25rem' }}>
              {summary.absent}
            </div>
          </div>
        </div>

        {/* Attendance Records Table */}
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          {loading ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: '#64748B' }}>Loading attendance records...</div>
          ) : records.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: '#64748B' }}>No attendance sessions marked yet.</div>
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
                {records.map(r => (
                  <tr key={r.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                    <td style={{ padding: '0.85rem 1.25rem', fontWeight: 600, color: 'var(--color-navy)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <Calendar size={13} style={{ color: 'var(--color-orange)' }} />
                        <span>{r.date}</span>
                      </div>
                    </td>
                    <td style={{ padding: '0.85rem 1.25rem', color: 'var(--color-text-secondary)' }}>
                      {r.subject_name || 'General Class'}
                    </td>
                    <td style={{ padding: '0.85rem 1.25rem' }}>
                      <span style={{
                        padding: '0.2rem 0.65rem',
                        borderRadius: '999px',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        background: r.status === 'present' ? '#DCFCE7' : r.status === 'late' ? '#FEF3C7' : '#FEE2E2',
                        color: r.status === 'present' ? '#166534' : r.status === 'late' ? '#92400E' : '#991B1B'
                      }}>
                        {r.status}
                      </span>
                    </td>
                    <td style={{ padding: '0.85rem 1.25rem', color: 'var(--color-text-muted)', fontSize: '0.82rem' }}>
                      {r.remarks || '—'}
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
