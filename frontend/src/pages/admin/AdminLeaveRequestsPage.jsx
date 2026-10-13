import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { CalendarOff, CheckCircle, XCircle, Clock, User, Calendar } from 'lucide-react';

export function AdminLeaveRequestsPage() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reviewingId, setReviewingId] = useState(null);
  const [reviewNote, setReviewNote] = useState('');

  const { showToast } = useToast();

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await api.getAdminLeaveRequests();
      setRequests(data || []);
    } catch (err) {
      showToast(err.message || 'Failed to load leave requests', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleReview = async (id, status) => {
    try {
      await api.reviewAdminLeaveRequest(id, {
        status,
        review_note: reviewNote
      });
      showToast(`Leave request ${status}`, 'success');
      setReviewingId(null);
      setReviewNote('');
      loadData();
    } catch (err) {
      showToast(err.message || 'Failed to update leave request', 'error');
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.75rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#0F172A', marginBottom: '0.25rem' }}>
            Faculty Leave Applications
          </h1>
          <p style={{ color: '#64748B', fontSize: '0.875rem' }}>
            Review, approve, or decline time-off and leave requests submitted by faculty teachers.
          </p>
        </div>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#64748B' }}>Loading leave requests...</div>
        ) : requests.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#64748B' }}>No leave applications found.</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#475569', fontWeight: 600 }}>
                <th style={{ padding: '0.85rem 1.25rem' }}>Faculty Teacher</th>
                <th style={{ padding: '0.85rem 1.25rem' }}>Leave Period</th>
                <th style={{ padding: '0.85rem 1.25rem' }}>Reason</th>
                <th style={{ padding: '0.85rem 1.25rem' }}>Status</th>
                <th style={{ padding: '0.85rem 1.25rem', textAlign: 'right' }}>Decision</th>
              </tr>
            </thead>
            <tbody>
              {requests.map(req => (
                <tr key={req.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                  <td style={{ padding: '0.85rem 1.25rem', fontWeight: 600, color: '#0F172A' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <User size={16} style={{ color: '#2563EB' }} />
                      <span>{req.teacher_name || 'Faculty Member'}</span>
                    </div>
                  </td>
                  <td style={{ padding: '0.85rem 1.25rem', color: '#475569' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.82rem' }}>
                      <Calendar size={13} style={{ color: '#64748B' }} />
                      <span>{req.from_date} to {req.to_date}</span>
                    </div>
                  </td>
                  <td style={{ padding: '0.85rem 1.25rem', color: '#334155', maxWidth: '300px' }}>
                    {req.reason}
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
                  <td style={{ padding: '0.85rem 1.25rem', textAlign: 'right' }}>
                    {req.status === 'pending' ? (
                      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                        <button
                          onClick={() => handleReview(req.id, 'approved')}
                          className="btn btn-sm btn-primary"
                          style={{ fontSize: '0.78rem', padding: '0.3rem 0.6rem', background: '#16A34A', borderColor: '#16A34A' }}
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleReview(req.id, 'rejected')}
                          className="btn btn-sm btn-outline"
                          style={{ fontSize: '0.78rem', padding: '0.3rem 0.6rem', color: '#DC2626', borderColor: '#FCA5A5' }}
                        >
                          Reject
                        </button>
                      </div>
                    ) : (
                      <span style={{ fontSize: '0.8rem', color: '#94A3B8' }}>Reviewed</span>
                    )}
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
export default AdminLeaveRequestsPage;
