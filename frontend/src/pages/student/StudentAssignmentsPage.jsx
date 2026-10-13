import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { StudentNav } from '../../components/student/StudentNav';
import { useToast } from '../../context/ToastContext';
import { FileText, Calendar, CheckCircle2, Clock, Send, Award, AlertCircle } from 'lucide-react';

export function StudentAssignmentsPage() {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);

  // Submit Modal
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [submissionContent, setSubmissionContent] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { showToast } = useToast();

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await api.getStudentAssignments();
      setAssignments(data || []);
    } catch (err) {
      showToast(err.message || 'Failed to load assignments', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.submitStudentAssignment(selectedAssignment.id, {
        content: submissionContent
      });
      showToast('Assignment submitted successfully!', 'success');
      setSelectedAssignment(null);
      setSubmissionContent('');
      loadData();
    } catch (err) {
      showToast(err.message || 'Failed to submit assignment', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ padding: '2.5rem 0 5rem' }}>
      <div className="container">
        <StudentNav />

        <div style={{ marginBottom: '1.75rem' }}>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--color-navy)', marginBottom: '0.25rem' }}>
            Coursework & Homework Assignments
          </h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>
            Review assigned problem sets, submit your answers, and check faculty grading feedback.
          </p>
        </div>

        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#64748B' }}>Loading assignments...</div>
        ) : assignments.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#64748B' }}>No coursework assignments assigned.</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1.25rem' }}>
            {assignments.map(a => {
              const status = a.submission_status || 'pending';
              const isGraded = status === 'graded';
              const isSubmitted = status === 'submitted';

              return (
                <div key={a.id} className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                      <span style={{ padding: '0.2rem 0.55rem', background: '#EFF6FF', color: '#1D4ED8', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600 }}>
                        {a.subject_name || 'Subject'}
                      </span>
                      <span style={{
                        padding: '0.2rem 0.6rem',
                        borderRadius: '999px',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        background: isGraded ? '#DCFCE7' : isSubmitted ? '#EFF6FF' : '#FEF3C7',
                        color: isGraded ? '#166534' : isSubmitted ? '#1D4ED8' : '#92400E'
                      }}>
                        {status}
                      </span>
                    </div>

                    <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--color-navy)', marginBottom: '0.4rem' }}>
                      {a.title}
                    </h3>
                    <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginBottom: '1rem', lineHeight: 1.5 }}>
                      {a.instructions || 'Review assigned questions and submit your response.'}
                    </p>

                    <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', marginBottom: '1rem', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                        <Calendar size={13} />
                        Due: {a.due_date}
                      </span>
                      <span>•</span>
                      <span>Max Marks: {a.max_marks}</span>
                    </div>

                    {isGraded && (
                      <div style={{ padding: '0.85rem', background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: '8px', marginBottom: '1rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.3rem' }}>
                          <span style={{ fontWeight: 700, color: '#166534', fontSize: '0.88rem' }}>Score Awarded</span>
                          <span style={{ fontSize: '1.1rem', fontWeight: 800, color: '#166534' }}>
                            {a.marks_obtained} / {a.max_marks}
                          </span>
                        </div>
                        {a.submission_feedback && (
                          <div style={{ fontSize: '0.8rem', color: '#4B5563', lineHeight: 1.4 }}>
                            <strong>Feedback:</strong> {a.submission_feedback}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '0.85rem', display: 'flex', justifyContent: 'flex-end' }}>
                    {isGraded ? (
                      <span style={{ color: '#16A34A', fontSize: '0.82rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                        <CheckCircle2 size={15} />
                        Completed & Graded
                      </span>
                    ) : isSubmitted ? (
                      <button
                        onClick={() => { setSelectedAssignment(a); setSubmissionContent(a.submission_content || ''); }}
                        className="btn btn-sm btn-outline"
                        style={{ fontSize: '0.78rem' }}
                      >
                        Update Submission
                      </button>
                    ) : (
                      <button
                        onClick={() => { setSelectedAssignment(a); setSubmissionContent(''); }}
                        className="btn btn-sm btn-primary"
                        style={{ fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                      >
                        <Send size={13} />
                        <span>Submit Work</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Submit Modal */}
        {selectedAssignment && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '1rem' }}>
            <div className="card" style={{ maxWidth: '480px', width: '100%', padding: '2rem' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.35rem' }}>
                Submit Assignment: {selectedAssignment.title}
              </h3>
              <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
                Due on {selectedAssignment.due_date} • Max {selectedAssignment.max_marks} marks
              </p>

              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label className="form-label">Solution / Answers / Cloud Document Link</label>
                  <textarea
                    className="form-input"
                    rows={6}
                    value={submissionContent}
                    onChange={(e) => setSubmissionContent(e.target.value)}
                    placeholder="Enter your step-by-step solutions or paste your Google Docs / GitHub submission link..."
                    required
                  />
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
                  <button type="button" onClick={() => setSelectedAssignment(null)} className="btn btn-outline" disabled={submitting}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={submitting}>
                    {submitting ? 'Submitting...' : 'Turn In Assignment'}
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
export default StudentAssignmentsPage;
