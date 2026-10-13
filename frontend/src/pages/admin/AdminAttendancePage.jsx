import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { ClipboardCheck, Calendar, Filter, Users, CheckCircle, XCircle, Clock } from 'lucide-react';

export function AdminAttendancePage() {
  const [classes, setClasses] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  const { showToast } = useToast();

  useEffect(() => {
    async function init() {
      try {
        const cList = await api.getAdminClasses();
        setClasses(cList || []);
        if (cList?.length > 0) {
          setSelectedClassId(cList[0].id);
        }
      } catch (err) {
        showToast(err.message || 'Failed to load classes', 'error');
      }
    }
    init();
  }, []);

  const loadAttendance = async () => {
    if (!selectedClassId) return;
    try {
      setLoading(true);
      const data = await api.getAdminAttendance({
        classId: selectedClassId,
        date
      });
      setRecords(data || []);
    } catch (err) {
      showToast(err.message || 'Failed to load attendance', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAttendance();
  }, [selectedClassId, date]);

  const total = records.length;
  const present = records.filter(r => r.status === 'present').length;
  const late = records.filter(r => r.status === 'late').length;
  const absent = records.filter(r => r.status === 'absent').length;
  const percentage = total > 0 ? Math.round(((present + late) / total) * 100) : 0;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.75rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#0F172A', marginBottom: '0.25rem' }}>
            Attendance Oversight & Records
          </h1>
          <p style={{ color: '#64748B', fontSize: '0.875rem' }}>
            Daily student roll-call summaries, percentage analytics, and verified records.
          </p>
        </div>
      </div>

      {/* Filter bar */}
      <div className="card" style={{ padding: '1rem', marginBottom: '1.5rem', display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#475569' }}>Class:</label>
          <select
            value={selectedClassId}
            onChange={(e) => setSelectedClassId(e.target.value)}
            className="form-select"
            style={{ fontSize: '0.85rem', padding: '0.4rem 0.8rem' }}
          >
            {classes.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#475569' }}>Date:</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="form-input"
            style={{ fontSize: '0.85rem', padding: '0.4rem 0.8rem', width: 'auto' }}
          />
        </div>
      </div>

      {/* Metrics Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ fontSize: '0.8rem', color: '#64748B', fontWeight: 600 }}>Total Records</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#0F172A', marginTop: '0.25rem' }}>{total}</div>
        </div>
        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ fontSize: '0.8rem', color: '#16A34A', fontWeight: 600 }}>Present</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#16A34A', marginTop: '0.25rem' }}>{present}</div>
        </div>
        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ fontSize: '0.8rem', color: '#D97706', fontWeight: 600 }}>Late</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#D97706', marginTop: '0.25rem' }}>{late}</div>
        </div>
        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ fontSize: '0.8rem', color: '#DC2626', fontWeight: 600 }}>Absent</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#DC2626', marginTop: '0.25rem' }}>{absent}</div>
        </div>
        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ fontSize: '0.8rem', color: '#2563EB', fontWeight: 600 }}>Overall Turnout</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#2563EB', marginTop: '0.25rem' }}>{percentage}%</div>
        </div>
      </div>

      {/* Attendance Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#64748B' }}>Loading attendance records...</div>
        ) : records.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#64748B' }}>
            No attendance marked for this class on {date}.
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#475569', fontWeight: 600 }}>
                <th style={{ padding: '0.85rem 1.25rem' }}>Student Name</th>
                <th style={{ padding: '0.85rem 1.25rem' }}>Subject</th>
                <th style={{ padding: '0.85rem 1.25rem' }}>Status</th>
                <th style={{ padding: '0.85rem 1.25rem' }}>Remarks</th>
                <th style={{ padding: '0.85rem 1.25rem' }}>Marked By</th>
              </tr>
            </thead>
            <tbody>
              {records.map(r => (
                <tr key={r.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                  <td style={{ padding: '0.85rem 1.25rem', fontWeight: 600, color: '#0F172A' }}>
                    {r.student_name || 'Student'}
                  </td>
                  <td style={{ padding: '0.85rem 1.25rem', color: '#475569' }}>
                    {r.subject_name || 'General'}
                  </td>
                  <td style={{ padding: '0.85rem 1.25rem' }}>
                    <span style={{
                      padding: '0.2rem 0.6rem',
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
                  <td style={{ padding: '0.85rem 1.25rem', color: '#64748B' }}>{r.remarks || '—'}</td>
                  <td style={{ padding: '0.85rem 1.25rem', color: '#94A3B8', fontSize: '0.8rem' }}>
                    {r.marked_by_name || 'Faculty'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
export default AdminAttendancePage;
