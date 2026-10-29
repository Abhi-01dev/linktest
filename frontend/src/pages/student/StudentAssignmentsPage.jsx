import React, { useState, useEffect } from 'react';
import { api, resolveFileUrl } from '../../services/api';
import { StudentNav } from '../../components/student/StudentNav';
import { useToast } from '../../context/ToastContext';
import {
  FileText,
  Calendar,
  CheckCircle2,
  Clock,
  Send,
  Award,
  AlertCircle,
  Upload,
  FileCheck,
  X,
  MessageSquare,
  AlertTriangle,
  Eye,
  Download
} from 'lucide-react';

function resolveSubmissionFileUrl(filePath, download = false) {
  return resolveFileUrl(filePath, download);
}

export function StudentAssignmentsPage() {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all'); // all, pending, completed

  // Submit Modal
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [submissionContent, setSubmissionContent] = useState('');
  const [attachmentFile, setAttachmentFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Review Modal (for Graded/Submitted)
  const [viewingAssignment, setViewingAssignment] = useState(null);
  const [downloading, setDownloading] = useState(false);

  const { showToast } = useToast();

  const handleDownloadSubmission = async (filePath, fileName) => {
    if (!filePath) {
      showToast('No submitted file attachment found.', 'warning');
      return;
    }
    setDownloading(true);
    try {
      showToast('Downloading assignment...', 'info');
      await api.downloadFile(filePath, fileName || 'submission.pdf');
      showToast('Assignment downloaded successfully!', 'success');
    } catch (err) {
      console.error('Download error:', err);
      showToast(err.message || 'Failed to download file', 'error');
    } finally {
      setDownloading(false);
    }
  };

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
    if (!submissionContent && !attachmentFile) {
      showToast('Please provide a written solution or attach a solution file.', 'warning');
      return;
    }

    setSubmitting(true);
    try {
      let filePath = null;
      let fileName = null;

      if (attachmentFile) {
        const uploadResult = await api.uploadFile(attachmentFile, 'submissions');
        filePath = uploadResult.file_path || uploadResult.url || uploadResult.file_url || (uploadResult.filename ? `/api/upload/files/submissions/${uploadResult.filename}` : null);
        fileName = uploadResult.original_name || attachmentFile.name;
      }

      await api.submitStudentAssignment(selectedAssignment.id, {
        content: submissionContent,
        file_path: filePath,
        file_name: fileName
      });

      showToast('Assignment successfully submitted!', 'success');
      setSelectedAssignment(null);
      setSubmissionContent('');
      setAttachmentFile(null);
      loadData();
    } catch (err) {
      showToast(err.message || 'Failed to submit assignment', 'error');
      if (err.code === 'ALREADY_SUBMITTED' || err.status === 409) {
        setSelectedAssignment(null);
        loadData();
      }
    } finally {
      setSubmitting(false);
    }
  };

  const isOverdue = (dueDate, status) => {
    if (status === 'submitted' || status === 'graded') return false;
    if (!dueDate) return false;
    return new Date(dueDate).getTime() < Date.now();
  };

  const pendingList = assignments.filter(a => !a.submission_status || a.submission_status === 'pending');
  const completedList = assignments.filter(a => a.submission_status === 'submitted' || a.submission_status === 'graded');

  const displayedAssignments = activeTab === 'pending'
    ? pendingList
    : activeTab === 'completed'
    ? completedList
    : assignments;

  return (
    <div style={{ padding: '2.5rem 0 5rem' }}>
      <div className="container">
        <StudentNav />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.75rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--color-navy)', marginBottom: '0.25rem' }}>
              Coursework & Homework Assignments
            </h1>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem', margin: 0 }}>
              Review assigned problem sets, submit your written answers or attachments, and check grading feedback.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', background: 'var(--color-bg-alt)', padding: '0.3rem', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
            <button
              onClick={() => setActiveTab('all')}
              className="btn btn-sm"
              style={{
                fontSize: '0.78rem',
                padding: '0.35rem 0.75rem',
                borderRadius: '6px',
                background: activeTab === 'all' ? 'var(--color-navy)' : 'transparent',
                color: activeTab === 'all' ? '#FFFFFF' : 'var(--color-navy)',
                borderColor: 'transparent'
              }}
            >
              All ({assignments.length})
            </button>
            <button
              onClick={() => setActiveTab('pending')}
              className="btn btn-sm"
              style={{
                fontSize: '0.78rem',
                padding: '0.35rem 0.75rem',
                borderRadius: '6px',
                background: activeTab === 'pending' ? 'var(--color-navy)' : 'transparent',
                color: activeTab === 'pending' ? '#FFFFFF' : 'var(--color-navy)',
                borderColor: 'transparent'
              }}
            >
              Pending ({pendingList.length})
            </button>
            <button
              onClick={() => setActiveTab('completed')}
              className="btn btn-sm"
              style={{
                fontSize: '0.78rem',
                padding: '0.35rem 0.75rem',
                borderRadius: '6px',
                background: activeTab === 'completed' ? 'var(--color-navy)' : 'transparent',
                color: activeTab === 'completed' ? '#FFFFFF' : 'var(--color-navy)',
                borderColor: 'transparent'
              }}
            >
              Completed ({completedList.length})
            </button>
          </div>
        </div>

        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#64748B' }}>Loading coursework assignments...</div>
        ) : displayedAssignments.length === 0 ? (
          <div style={{ padding: '3.5rem 1rem', textAlign: 'center', background: 'var(--color-bg-alt)', borderRadius: '12px', border: '1px solid var(--color-border)' }}>
            <CheckCircle2 size={36} style={{ color: '#16A34A', margin: '0 auto 0.75rem' }} />
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--color-navy)', margin: '0 0 0.35rem' }}>
              No assignments found
            </h3>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', margin: 0 }}>
              {activeTab === 'pending' ? 'All assignments are turned in!' : 'No tasks assigned in this category.'}
            </p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1.25rem' }}>
            {displayedAssignments.map(a => {
              const status = a.submission_status || 'pending';
              const isGraded = status === 'graded';
              const isSubmitted = status === 'submitted';
              const overdue = isOverdue(a.due_date, status);

              return (
                <div
                  key={a.id}
                  className="card"
                  style={{
                    padding: '1.5rem',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    border: overdue ? '1px solid #FCA5A5' : '1px solid var(--color-border)',
                    boxShadow: overdue ? '0 2px 8px rgba(239, 68, 68, 0.08)' : 'none'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.65rem', gap: '0.5rem' }}>
                      <span style={{ padding: '0.2rem 0.55rem', background: '#EFF6FF', color: '#1D4ED8', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600 }}>
                        {a.subject_name || 'Subject'}
                      </span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        {overdue && (
                          <span style={{
                            padding: '0.15rem 0.45rem',
                            borderRadius: '4px',
                            fontSize: '0.7rem',
                            fontWeight: 800,
                            background: '#FEE2E2',
                            color: '#DC2626',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.25rem'
                          }}>
                            <AlertTriangle size={11} />
                            Overdue
                          </span>
                        )}
                        <span style={{
                          padding: '0.2rem 0.6rem',
                          borderRadius: '999px',
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          background: isGraded ? '#DCFCE7' : isSubmitted ? '#EFF6FF' : overdue ? '#FEE2E2' : '#FEF3C7',
                          color: isGraded ? '#166534' : isSubmitted ? '#1D4ED8' : overdue ? '#991B1B' : '#92400E'
                        }}>
                          {status}
                        </span>
                      </div>
                    </div>

                    <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--color-navy)', marginBottom: '0.4rem' }}>
                      {a.title}
                    </h3>
                    <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginBottom: '1rem', lineHeight: 1.5 }}>
                      {a.instructions || a.description || 'Complete the assigned problem set according to faculty instructions.'}
                    </p>

                    {/* Graded Feedback Box if available */}
                    {isGraded && (
                      <div style={{ padding: '0.75rem 0.85rem', background: '#F0FDF4', borderRadius: '8px', border: '1px solid #BBF7D0', marginBottom: '1rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#166534', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                            <Award size={13} />
                            Faculty Evaluation
                          </span>
                          <span style={{ fontSize: '0.88rem', fontWeight: 800, color: '#166534' }}>
                            {a.grade ?? a.score ?? a.marks_obtained ?? '—'} / {a.max_marks || 100}
                          </span>
                        </div>
                        {a.feedback && (
                          <p style={{ margin: 0, fontSize: '0.78rem', color: '#15803D', fontStyle: 'italic' }}>
                            "{a.feedback}"
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '0.85rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: overdue ? '#DC2626' : undefined, fontWeight: overdue ? 700 : 500 }}>
                        <Calendar size={13} />
                        Due: {a.due_date ? new Date(a.due_date).toLocaleDateString() : 'No date set'}
                      </span>
                      <span>Max: {a.max_marks || 100} marks</span>
                    </div>

                    {status === 'pending' ? (
                      <button
                        onClick={() => {
                          setSelectedAssignment(a);
                          setSubmissionContent('');
                          setAttachmentFile(null);
                        }}
                        className="btn btn-sm btn-primary"
                        style={{ width: '100%', justifyContent: 'center' }}
                      >
                        <Send size={13} />
                        <span>Submit Work</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => setViewingAssignment(a)}
                        className="btn btn-sm btn-outline"
                        style={{ width: '100%', justifyContent: 'center' }}
                      >
                        <FileCheck size={13} />
                        <span>View Submission</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── Submit Assignment Modal ── */}
        {selectedAssignment && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '1rem' }}>
            <div className="card" style={{ maxWidth: '520px', width: '100%', padding: '2rem', maxHeight: '90vh', overflowY: 'auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>
                  Turn In: {selectedAssignment.title}
                </h3>
                <button
                  type="button"
                  onClick={() => setSelectedAssignment(null)}
                  style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}
                >
                  <X size={18} />
                </button>
              </div>

              <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
                {selectedAssignment.subject_name} • Due on {selectedAssignment.due_date ? new Date(selectedAssignment.due_date).toLocaleDateString() : 'N/A'} • Max {selectedAssignment.max_marks || 100} marks
              </p>

              {(selectedAssignment.instructions || selectedAssignment.description) && (
                <div style={{ padding: '0.75rem 1rem', background: 'var(--color-bg-alt)', borderRadius: '8px', fontSize: '0.82rem', color: 'var(--color-navy)', marginBottom: '1.25rem', border: '1px solid var(--color-border)' }}>
                  <strong>Instructions:</strong> {selectedAssignment.instructions || selectedAssignment.description}
                </div>
              )}

              <form onSubmit={handleSubmit}>
                <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                  <label className="form-label" style={{ fontWeight: 600 }}>Written Solution / Document Link</label>
                  <textarea
                    className="form-input"
                    rows={5}
                    value={submissionContent}
                    onChange={(e) => setSubmissionContent(e.target.value)}
                    placeholder="Provide your solution text, algorithm explanation, or link to code repo / Google Doc..."
                  />
                </div>

                <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                  <label className="form-label" style={{ fontWeight: 600 }}>File Attachment (PDF, Document, Code Archive)</label>
                  <div style={{
                    border: '2px dashed var(--color-border)',
                    borderRadius: '8px',
                    padding: '1rem',
                    textAlign: 'center',
                    background: 'var(--color-bg-alt)',
                    cursor: 'pointer'
                  }}>
                    <input
                      type="file"
                      id="assignment-file"
                      accept=".pdf,.doc,.docx,.ppt,.pptx,.txt,.md,.zip,.jpg,.jpeg,.png"
                      style={{ display: 'none' }}
                      onChange={(e) => setAttachmentFile(e.target.files[0] || null)}
                    />
                    <label htmlFor="assignment-file" style={{ cursor: 'pointer', display: 'block' }}>
                      <Upload size={22} style={{ color: 'var(--color-orange)', margin: '0 auto 0.4rem' }} />
                      <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-navy)' }}>
                        {attachmentFile ? attachmentFile.name : 'Choose file to attach (PDF, Doc, Zip)'}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                        Supports PDF, DOC, DOCX, ZIP, PNG (up to 15MB)
                      </div>
                    </label>
                  </div>
                  {attachmentFile && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem', fontSize: '0.78rem', color: '#16A34A', background: '#DCFCE7', padding: '0.35rem 0.65rem', borderRadius: '4px' }}>
                      <span>Selected: {attachmentFile.name} ({(attachmentFile.size / 1024).toFixed(1)} KB)</span>
                      <button
                        type="button"
                        onClick={() => setAttachmentFile(null)}
                        style={{ background: 'transparent', border: 'none', color: '#DC2626', cursor: 'pointer', fontWeight: 700 }}
                      >
                        Remove
                      </button>
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
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

        {/* ── View Submission Modal ── */}
        {viewingAssignment && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '1rem' }}>
            <div className="card" style={{ maxWidth: '520px', width: '100%', padding: '2rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>
                  Submission: {viewingAssignment.title}
                </h3>
                <button
                  type="button"
                  onClick={() => setViewingAssignment(null)}
                  style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}
                >
                  <X size={18} />
                </button>
              </div>

              <div style={{ marginBottom: '1.25rem' }}>
                <span style={{
                  padding: '0.2rem 0.6rem',
                  borderRadius: '999px',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  background: viewingAssignment.submission_status === 'graded' ? '#DCFCE7' : '#EFF6FF',
                  color: viewingAssignment.submission_status === 'graded' ? '#166534' : '#1D4ED8'
                }}>
                  Status: {viewingAssignment.submission_status || 'Submitted'}
                </span>
              </div>

              {viewingAssignment.submission_status === 'graded' && (
                <div style={{ padding: '1rem', background: '#F0FDF4', borderRadius: '8px', border: '1px solid #BBF7D0', marginBottom: '1.25rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                    <span style={{ fontWeight: 700, color: '#166534', fontSize: '0.9rem' }}>Grade Awarded:</span>
                    <span style={{ fontSize: '1.25rem', fontWeight: 800, color: '#166534' }}>
                      {viewingAssignment.grade ?? viewingAssignment.score ?? viewingAssignment.marks_obtained ?? '—'} / {viewingAssignment.max_marks || 100}
                    </span>
                  </div>
                  {viewingAssignment.feedback && (
                    <div style={{ fontSize: '0.82rem', color: '#15803D', marginTop: '0.35rem' }}>
                      <strong>Instructor Feedback:</strong> {viewingAssignment.feedback}
                    </div>
                  )}
                </div>
              )}

              <div style={{ padding: '1rem', background: 'var(--color-bg-alt)', borderRadius: '8px', marginBottom: '1.5rem', fontSize: '0.85rem' }}>
                <div style={{ fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: '0.35rem' }}>Your Submission:</div>
                <div style={{ color: 'var(--color-navy)', whiteSpace: 'pre-wrap' }}>
                  {viewingAssignment.submission_content || viewingAssignment.content || 'Submission recorded on file.'}
                </div>

                {(viewingAssignment.file_name || viewingAssignment.file_path) && (
                  <div style={{ marginTop: '0.85rem', padding: '0.6rem 0.85rem', background: '#FFFFFF', borderRadius: '6px', border: '1px solid #CBD5E1', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#1D4ED8', fontWeight: 600, fontSize: '0.82rem' }}>
                      <FileText size={15} />
                      <span style={{ maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {viewingAssignment.file_name || 'Submitted Document.pdf'}
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: '0.4rem' }}>
                      <a
                        href={resolveSubmissionFileUrl(viewingAssignment.file_path, false)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-sm btn-primary"
                        style={{ fontSize: '0.75rem', padding: '0.2rem 0.55rem', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}
                      >
                        <Eye size={12} />
                        <span>View PDF</span>
                      </a>
                      <button
                        type="button"
                        onClick={() => handleDownloadSubmission(viewingAssignment.file_path, viewingAssignment.file_name)}
                        disabled={downloading}
                        className="btn btn-sm btn-outline"
                        style={{ fontSize: '0.75rem', padding: '0.2rem 0.55rem', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}
                      >
                        <Download size={12} />
                        <span>{downloading ? 'Downloading...' : 'Download'}</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setViewingAssignment(null)} className="btn btn-primary">
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default StudentAssignmentsPage;
