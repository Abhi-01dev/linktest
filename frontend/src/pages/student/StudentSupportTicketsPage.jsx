import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { StudentNav } from '../../components/student/StudentNav';
import { useToast } from '../../context/ToastContext';
import { HelpCircle, Plus, MessageSquare, Clock, CheckCircle } from 'lucide-react';

export function StudentSupportTicketsPage() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [category, setCategory] = useState('academic');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { showToast } = useToast();

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await api.getStudentTickets();
      setTickets(data || []);
    } catch (err) {
      showToast(err.message || 'Failed to load tickets', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.createStudentTicket({
        category,
        subject,
        description
      });
      showToast('Support ticket created successfully', 'success');
      setShowAddModal(false);
      setSubject('');
      setDescription('');
      loadData();
    } catch (err) {
      showToast(err.message || 'Failed to submit support ticket', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ padding: '2.5rem 0 5rem' }}>
      <div className="container">
        <StudentNav />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.75rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--color-navy)', marginBottom: '0.25rem' }}>
              Academic Helpdesk & Feedback Tickets
            </h1>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>
              Submit questions regarding syllabus, grading queries, platform technical issues, or institutional feedback.
            </p>
          </div>
          <button onClick={() => setShowAddModal(true)} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Plus size={16} />
            <span>Open New Ticket</span>
          </button>
        </div>

        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#64748B' }}>Loading support tickets...</div>
        ) : tickets.length === 0 ? (
          <div className="card" style={{ padding: '3rem', textAlign: 'center' }}>
            <HelpCircle size={44} style={{ color: 'var(--color-text-muted)', margin: '0 auto 1rem' }} />
            <h3 style={{ fontSize: '1.15rem', color: 'var(--color-navy)', marginBottom: '0.35rem' }}>No Active Tickets</h3>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
              If you have any academic queries or technical difficulties, create a support ticket.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {tickets.map(t => (
              <div key={t.id} className="card" style={{ padding: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <div style={{ padding: '0.4rem', background: '#EFF6FF', color: '#2563EB', borderRadius: '8px' }}>
                      <MessageSquare size={18} />
                    </div>
                    <div>
                      <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-navy)' }}>{t.subject}</h3>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', fontSize: '0.78rem', color: 'var(--color-text-muted)', marginTop: '0.2rem' }}>
                        <span style={{ textTransform: 'capitalize' }}>Category: {t.category}</span>
                        <span>•</span>
                        <span>Filed: {new Date(t.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>

                  <span style={{
                    padding: '0.2rem 0.65rem',
                    borderRadius: '999px',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    background: t.status === 'resolved' ? '#DCFCE7' : t.status === 'in_progress' ? '#FEF3C7' : '#F1F5F9',
                    color: t.status === 'resolved' ? '#166534' : t.status === 'in_progress' ? '#92400E' : '#64748B'
                  }}>
                    {t.status || 'open'}
                  </span>
                </div>

                <p style={{ fontSize: '0.88rem', color: 'var(--color-text-secondary)', lineHeight: 1.5, marginTop: '0.5rem' }}>
                  {t.description}
                </p>

                {t.resolution_notes && (
                  <div style={{ marginTop: '0.85rem', padding: '0.75rem 1rem', background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: '6px', fontSize: '0.82rem', color: '#166534' }}>
                    <strong>Admin Resolution:</strong> {t.resolution_notes}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Create Modal */}
        {showAddModal && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '1rem' }}>
            <div className="card" style={{ maxWidth: '480px', width: '100%', padding: '2rem' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.35rem' }}>Create Helpdesk Ticket</h3>
              <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>Your request will be routed to faculty and administration.</p>
              <form onSubmit={handleCreate}>
                <div className="form-group">
                  <label className="form-label">Query Category</label>
                  <select className="form-select" value={category} onChange={(e) => setCategory(e.target.value)}>
                    <option value="academic">Academic / Subject Query</option>
                    <option value="technical">Technical / Platform Issue</option>
                    <option value="administrative">Administrative / Attendance</option>
                    <option value="other">General Feedback</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Subject</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Question regarding calculus homework question 4"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Detailed Description</label>
                  <textarea
                    className="form-input"
                    rows={4}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Provide relevant details, error descriptions, or questions..."
                    required
                  />
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
                  <button type="button" onClick={() => setShowAddModal(false)} className="btn btn-outline" disabled={submitting}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={submitting}>
                    {submitting ? 'Submitting...' : 'Send Ticket'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
export default StudentSupportTicketsPage;
