import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { CalendarOff, Plus, Calendar, Clock, CheckCircle, XCircle } from 'lucide-react';

export function TeacherLeavePage() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [reason, setReason] = useState('');

  const { showToast } = useToast();

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await api.getTeacherLeaveRequests();
      setRequests(data || []);
    } catch (err) {
      showToast(err.message || 'Failed to load leave history', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleApply = async (e) => {
    e.preventDefault();
    try {
      await api.applyTeacherLeave({
        from_date: fromDate,
        to_date: toDate,
        reason
      });
      showToast('Leave request submitted to administration', 'success');
      setShowApplyModal(false);
      setFromDate('');
      setToDate('');
      setReason('');
      loadData();
    } catch (err) {
      showToast(err.message || 'Failed to submit leave application', 'error');
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.75rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#0F172A', marginBottom: '0.25rem' }}>
            Faculty Time-Off & Leave Portal
          </h1>
          <p style={{ color: '#64748B', fontSize: '0.875rem' }}>
            Apply for academic leave, view approval history, and track status decisions.
          </p>
        </div>
        <button onClick={() => setShowApplyModal(true)} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Plus size={16} />
          <span>Apply for Leave</span>
        </button>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#64748B' }}>Loading leave records...</div>
        ) : requests.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#64748B' }}>No leave applications on file.</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#475569', fontWeight: 600 }}>
                <th style={{ padding: '0.85rem 1.25rem' }}>Duration / Dates</th>
                <th style={{ padding: '0.85rem 1.25rem' }}>Reason</th>
                <th style={{ padding: '0.85rem 1.25rem' }}>Applied On</th>
                <th style={{ padding: '0.85rem 1.25rem' }}>Approval Status</th>
                <th style={{ padding: '0.85rem 1.25rem' }}>Admin Notes</th>
              </tr>
            </thead>
            <tbody>
              {requests.map(req => (
                <tr key={req.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                  <td style={{ padding: '0.85rem 1.25rem', fontWeight: 600, color: '#0F172A' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem' }}>
                      <Calendar size={14} style={{ color: '#2563EB' }} />
                      <span>{req.from_date} to {req.to_date}</span>
                    </div>
                  </td>
                  <td style={{ padding: '0.85rem 1.25rem', color: '#334155' }}>{req.reason}</td>
                  <td style={{ padding: '0.85rem 1.25rem', color: '#64748B', fontSize: '0.8rem' }}>
                    {new Date(req.created_at).toLocaleDateString()}
                  </td>
                  <td style={{ padding: '0.85rem 1.25rem' }}>
                    <span style={{
                      padding: '0.2rem 0.65rem',
                      borderRadius: '999px',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      background: req.status === 'approved' ? '#DCFCE7' : req.status === 'rejected' ? '#FEE2E2' : '#FEF3C7',
                      color: req.status === 'approved' ? '#166534' : req.status === 'rejected' ? '#991B1B' : '#92400E'
                    }}>
                      {req.status}
                    </span>
                  </td>
                  <td style={{ padding: '0.85rem 1.25rem', color: '#64748B', fontSize: '0.8rem' }}>
                    {req.review_note || '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Apply Modal */}
      {showApplyModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '1rem' }}>
          <div className="card" style={{ maxWidth: '440px', width: '100%', padding: '2rem' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>Submit Leave Application</h3>
            <p style={{ color: '#64748B', fontSize: '0.85rem', marginBottom: '1.5rem' }}>Specify dates and reason for administrative review.</p>
            <form onSubmit={handleApply}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div className="form-group">
                  <label className="form-label">From Date</label>
                  <input type="date" className="form-input" value={fromDate} onChange={(e) => setFromDate(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label className="form-label">To Date</label>
                  <input type="date" className="form-input" value={toDate} onChange={(e) => setToDate(e.target.value)} required />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Reason for Absence</label>
                <textarea
                  className="form-input"
                  rows={3}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="e.g. Attending Annual Physics Faculty Symposium..."
                  required
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
                <button type="button" onClick={() => setShowApplyModal(false)} className="btn btn-outline">Cancel</button>
                <button type="submit" className="btn btn-primary">Submit Application</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
export default TeacherLeavePage;
