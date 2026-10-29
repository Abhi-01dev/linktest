import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import {
  FileText,
  Plus,
  Calendar,
  Users,
  CheckCircle,
  Clock,
  Award,
  ChevronRight,
  ExternalLink,
  Eye,
  Download,
  X
} from 'lucide-react';

function resolveSubmissionFileUrl(filePath, download = false) {
  if (!filePath) return null;
  if (filePath.startsWith('http://') || filePath.startsWith('https://')) return filePath;
  const token = localStorage.getItem('token') || '';
  const tokenQuery = token ? `token=${encodeURIComponent(token)}` : '';
  const dlQuery = download ? 'download=true' : '';
  const queryParts = [tokenQuery, dlQuery].filter(Boolean).join('&');

  if (filePath.startsWith('/api/upload/files/')) {
    const separator = filePath.includes('?') ? '&' : '?';
    return queryParts ? `${filePath}${separator}${queryParts}` : filePath;
  }
  const clean = filePath.replace(/^[\\/]?(uploads[\\/])?/, '').replace(/^[\\/]?(submissions)[\\/]/, '');
  const fname = clean.split(/[\\/]/).pop();
  return `/api/upload/files/submissions/${encodeURIComponent(fname)}${queryParts ? `?${queryParts}` : ''}`;
}

export function TeacherAssignmentsPage() {
  const [assignments, setAssignments] = useState([]);
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);

  // Create Assignment Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [title, setTitle] = useState('');
  const [instructions, setInstructions] = useState('');
  const [classId, setClassId] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [maxMarks, setMaxMarks] = useState(100);

  // Submissions Modal
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [showSubmissionsModal, setShowSubmissionsModal] = useState(false);
  const [loadingSubmissions, setLoadingSubmissions] = useState(false);

  // Grade Modal
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [gradeMarks, setGradeMarks] = useState(0);
  const [gradeFeedback, setGradeFeedback] = useState('');

  const { showToast } = useToast();

  const loadData = async () => {
    try {
      setLoading(true);
      const [aList, cList, sList] = await Promise.all([
        api.getTeacherAssignments(),
        api.getTeacherClasses(),
        api.getAdminSubjects()
      ]);
      setAssignments(aList || []);
      setClasses(cList || []);
      setSubjects(sList || []);
      if (cList?.length > 0) setClassId(cList[0].class_id);
      if (sList?.length > 0) setSubjectId(sList[0].id);
    } catch (err) {
      showToast(err.message || 'Failed to load assignments', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await api.createTeacherAssignment({
        title,
        instructions,
        class_id: classId,
        subject_id: subjectId,
        due_date: dueDate,
        max_marks: Number(maxMarks),
        status: 'published'
      });
      showToast('Assignment published successfully', 'success');
      setShowCreateModal(false);
      setTitle('');
      setInstructions('');
      loadData();
    } catch (err) {
      showToast(err.message || 'Failed to create assignment', 'error');
    }
  };

  const handleViewSubmissions = async (assignment) => {
    setSelectedAssignment(assignment);
    setShowSubmissionsModal(true);
    setLoadingSubmissions(true);
    try {
      const subs = await api.getTeacherSubmissions(assignment.id);
      setSubmissions(subs || []);
    } catch (err) {
      showToast(err.message || 'Failed to load submissions', 'error');
    } finally {
      setLoadingSubmissions(false);
    }
  };

  const handleOpenGrade = (sub) => {
    setSelectedSubmission(sub);
    setGradeMarks(sub.marks_obtained !== null ? sub.marks_obtained : selectedAssignment.max_marks || 100);
    setGradeFeedback(sub.feedback || '');
  };

  const handleSaveGrade = async (e) => {
    e.preventDefault();
    try {
      await api.gradeTeacherSubmission(selectedSubmission.id, {
        marks_obtained: Number(gradeMarks),
        feedback: gradeFeedback
      });
      showToast('Grade and feedback saved successfully', 'success');
      setSelectedSubmission(null);
      // Reload submissions
      const subs = await api.getTeacherSubmissions(selectedAssignment.id);
      setSubmissions(subs || []);
      loadData();
    } catch (err) {
      showToast(err.message || 'Failed to grade submission', 'error');
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.75rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#0F172A', marginBottom: '0.25rem' }}>
            Coursework Assignments & Grading
          </h1>
          <p style={{ color: '#64748B', fontSize: '0.875rem' }}>
            Issue homework assignments, evaluate student submissions, and assign scores with feedback.
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="btn btn-primary"
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
        >
          <Plus size={16} />
          <span>Create Assignment</span>
        </button>
      </div>

      {loading ? (
        <div style={{ padding: '3rem', textAlign: 'center', color: '#64748B' }}>Loading assignments...</div>
      ) : assignments.length === 0 ? (
        <div style={{ padding: '3rem', textAlign: 'center', color: '#64748B' }}>
          No assignments issued yet. Click "Create Assignment" to post coursework.
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '1.25rem' }}>
          {assignments.map(a => (
            <div key={a.id} className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                  <span style={{ padding: '0.2rem 0.55rem', background: '#EFF6FF', color: '#1D4ED8', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600 }}>
                    {a.subject_name || 'Subject'}
                  </span>
                  <span style={{ fontSize: '0.78rem', color: '#64748B', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <Calendar size={13} />
                    Due: {a.due_date}
                  </span>
                </div>

                <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#0F172A', marginBottom: '0.4rem' }}>
                  {a.title}
                </h3>
                <p style={{ fontSize: '0.85rem', color: '#64748B', marginBottom: '1rem', lineHeight: 1.5 }}>
                  {a.instructions || 'No instructions provided.'}
                </p>

                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
                  <span style={{ padding: '0.2rem 0.5rem', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '4px', fontSize: '0.78rem', color: '#334155' }}>
                    Class: {a.class_name}
                  </span>
                  <span style={{ padding: '0.2rem 0.5rem', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '4px', fontSize: '0.78rem', color: '#334155' }}>
                    Max: {a.max_marks} marks
                  </span>
                </div>
              </div>

              <div style={{ borderTop: '1px solid #F1F5F9', paddingTop: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: '0.8rem', color: '#64748B' }}>
                  <strong>{a.total_submissions || 0}</strong> submitted • <strong>{a.pending_submissions || 0}</strong> unreviewed
                </div>
                <button
                  onClick={() => handleViewSubmissions(a)}
                  className="btn btn-sm btn-outline"
                  style={{ fontSize: '0.78rem', padding: '0.3rem 0.65rem' }}
                >
                  Submissions
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '1rem' }}>
          <div className="card" style={{ maxWidth: '480px', width: '100%', padding: '2rem' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>Create Assignment</h3>
            <p style={{ color: '#64748B', fontSize: '0.85rem', marginBottom: '1.5rem' }}>Publish new homework coursework to your students.</p>
            <form onSubmit={handleCreate}>
              <div className="form-group">
                <label className="form-label">Assignment Title</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Unit 3 Calculus Practice Problem Set"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div className="form-group">
                  <label className="form-label">Class</label>
                  <select className="form-select" value={classId} onChange={(e) => setClassId(e.target.value)} required disabled={classes.length === 0}>
                    {classes.length === 0 ? (
                      <option value="" disabled>No options</option>
                    ) : (
                      classes.map(c => <option key={c.class_id} value={c.class_id}>{c.class_name}</option>)
                    )}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Subject</label>
                  <select className="form-select" value={subjectId} onChange={(e) => setSubjectId(e.target.value)} required disabled={subjects.length === 0}>
                    {subjects.length === 0 ? (
                      <option value="" disabled>No options</option>
                    ) : (
                      subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)
                    )}
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div className="form-group">
                  <label className="form-label">Due Date</label>
                  <input type="date" className="form-input" value={dueDate} onChange={(e) => setDueDate(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Max Marks</label>
                  <input type="number" className="form-input" value={maxMarks} onChange={(e) => setMaxMarks(e.target.value)} min="1" max="1000" />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Instructions & Rubric</label>
                <textarea
                  className="form-input"
                  rows={4}
                  placeholder="Outline questions, submission guidelines, or problem prompts..."
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
                <button type="button" onClick={() => setShowCreateModal(false)} className="btn btn-outline">Cancel</button>
                <button type="submit" className="btn btn-primary">Publish Assignment</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Submissions Modal */}
      {showSubmissionsModal && selectedAssignment && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '1rem' }}>
          <div className="card" style={{ maxWidth: '820px', width: '100%', maxHeight: '85vh', display: 'flex', flexDirection: 'column', padding: 0 }}>
            <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0 }}>
                  Submissions: {selectedAssignment.title}
                </h3>
                <span style={{ fontSize: '0.8rem', color: '#64748B' }}>
                  Max Marks: {selectedAssignment.max_marks} • Due: {selectedAssignment.due_date}
                </span>
              </div>
              <button onClick={() => setShowSubmissionsModal(false)} className="btn btn-ghost btn-sm" style={{ minWidth: 'auto' }}>
                <X size={18} />
              </button>
            </div>

            <div style={{ padding: '1.25rem 1.5rem', overflowY: 'auto', flex: 1 }}>
              {loadingSubmissions ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: '#64748B' }}>Loading submissions...</div>
              ) : submissions.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: '#64748B' }}>No submissions received yet.</div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                  <thead>
                    <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#475569' }}>
                      <th style={{ padding: '0.65rem 0.85rem' }}>Student</th>
                      <th style={{ padding: '0.65rem 0.85rem' }}>Submitted At</th>
                      <th style={{ padding: '0.65rem 0.85rem' }}>Submission Solution / File</th>
                      <th style={{ padding: '0.65rem 0.85rem' }}>Score</th>
                      <th style={{ padding: '0.65rem 0.85rem', textAlign: 'right' }}>Grade</th>
                    </tr>
                  </thead>
                  <tbody>
                    {submissions.map(sub => {
                      const hasFile = Boolean(sub.file_path || sub.file_name);
                      const fileViewUrl = resolveSubmissionFileUrl(sub.file_path, false);
                      const fileDownloadUrl = resolveSubmissionFileUrl(sub.file_path, true);

                      return (
                        <tr key={sub.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                          <td style={{ padding: '0.65rem 0.85rem', fontWeight: 600 }}>
                            <div>{sub.student_name || 'Student'}</div>
                            {sub.student_email && (
                              <div style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 400 }}>{sub.student_email}</div>
                            )}
                          </td>
                          <td style={{ padding: '0.65rem 0.85rem', color: '#64748B', fontSize: '0.78rem' }}>
                            {new Date(sub.submitted_at).toLocaleDateString()}
                          </td>
                          <td style={{ padding: '0.65rem 0.85rem', maxWidth: '300px', color: '#334155' }}>
                            {sub.content && (
                              <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: hasFile ? '0.4rem' : 0 }}>
                                {sub.content}
                              </div>
                            )}
                            {hasFile ? (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                                <span style={{ fontSize: '0.78rem', color: '#1D4ED8', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                                  <FileText size={13} />
                                  <span style={{ maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {sub.file_name || 'submission.pdf'}
                                  </span>
                                </span>
                                <a
                                  href={fileViewUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="btn btn-sm btn-outline"
                                  style={{ fontSize: '0.7rem', padding: '0.15rem 0.45rem', display: 'inline-flex', alignItems: 'center', gap: '0.25rem', borderColor: '#3B82F6', color: '#2563EB' }}
                                  title="Open PDF / document in new browser tab"
                                >
                                  <Eye size={11} />
                                  <span>View PDF</span>
                                </a>
                                <a
                                  href={fileDownloadUrl}
                                  download={sub.file_name || 'submission.pdf'}
                                  className="btn btn-sm btn-ghost"
                                  style={{ fontSize: '0.7rem', padding: '0.15rem 0.45rem', display: 'inline-flex', alignItems: 'center', gap: '0.25rem', color: '#475569' }}
                                  title="Download submission file"
                                >
                                  <Download size={11} />
                                  <span>Download</span>
                                </a>
                              </div>
                            ) : (
                              !sub.content && <span style={{ color: '#94A3B8', fontStyle: 'italic' }}>No solution submitted</span>
                            )}
                          </td>
                          <td style={{ padding: '0.65rem 0.85rem' }}>
                            {sub.status === 'graded' ? (
                              <span style={{ fontWeight: 700, color: '#16A34A' }}>
                                {sub.marks_obtained} / {selectedAssignment.max_marks}
                              </span>
                            ) : (
                              <span style={{ color: '#D97706', fontSize: '0.78rem', fontWeight: 600 }}>Unreviewed</span>
                            )}
                          </td>
                          <td style={{ padding: '0.65rem 0.85rem', textAlign: 'right' }}>
                            <button
                              onClick={() => handleOpenGrade(sub)}
                              className="btn btn-sm btn-primary"
                              style={{ fontSize: '0.75rem', padding: '0.25rem 0.55rem' }}
                            >
                              {sub.status === 'graded' ? 'Edit Mark' : 'Grade'}
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
        </div>
      )}

      {/* Grade Individual Submission Modal */}
      {selectedSubmission && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 110, padding: '1rem' }}>
          <div className="card" style={{ maxWidth: '480px', width: '100%', padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>
                  Grade Submission
                </h3>
                <span style={{ fontSize: '0.85rem', color: '#64748B' }}>
                  Student: <strong>{selectedSubmission.student_name}</strong>
                </span>
              </div>
              <button onClick={() => setSelectedSubmission(null)} className="btn btn-ghost btn-sm" style={{ minWidth: 'auto' }}>
                <X size={18} />
              </button>
            </div>

            {/* Submitted Solution & PDF Action Card */}
            <div style={{ background: '#F8FAFC', padding: '0.85rem', borderRadius: '8px', border: '1px solid #E2E8F0', margin: '1rem 0 1.25rem' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: '0.35rem' }}>
                Submitted Solution:
              </div>
              {selectedSubmission.content && (
                <div style={{ fontSize: '0.85rem', color: '#0F172A', whiteSpace: 'pre-wrap', marginBottom: (selectedSubmission.file_path || selectedSubmission.file_name) ? '0.75rem' : 0 }}>
                  {selectedSubmission.content}
                </div>
              )}
              {(selectedSubmission.file_path || selectedSubmission.file_name) && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem 0.75rem', background: '#FFFFFF', borderRadius: '6px', border: '1px solid #CBD5E1', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', fontWeight: 600, color: '#1D4ED8' }}>
                    <FileText size={15} />
                    <span style={{ maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {selectedSubmission.file_name || 'Submitted Document.pdf'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: '0.4rem' }}>
                    <a
                      href={resolveSubmissionFileUrl(selectedSubmission.file_path, false)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-sm btn-primary"
                      style={{ fontSize: '0.75rem', padding: '0.25rem 0.6rem', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}
                    >
                      <Eye size={12} />
                      <span>View PDF</span>
                    </a>
                    <a
                      href={resolveSubmissionFileUrl(selectedSubmission.file_path, true)}
                      download={selectedSubmission.file_name || 'submission.pdf'}
                      className="btn btn-sm btn-outline"
                      style={{ fontSize: '0.75rem', padding: '0.25rem 0.6rem', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}
                    >
                      <Download size={12} />
                      <span>Download</span>
                    </a>
                  </div>
                </div>
              )}
              {!selectedSubmission.content && !selectedSubmission.file_path && !selectedSubmission.file_name && (
                <span style={{ color: '#94A3B8', fontSize: '0.82rem', fontStyle: 'italic' }}>No written solution or attachment provided.</span>
              )}
            </div>

            <form onSubmit={handleSaveGrade}>
              <div className="form-group">
                <label className="form-label">Marks (out of {selectedAssignment?.max_marks || 100})</label>
                <input
                  type="number"
                  className="form-input"
                  value={gradeMarks}
                  onChange={(e) => setGradeMarks(e.target.value)}
                  min="0"
                  max={selectedAssignment?.max_marks || 100}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Feedback Notes for Student</label>
                <textarea
                  className="form-input"
                  rows={3}
                  value={gradeFeedback}
                  onChange={(e) => setGradeFeedback(e.target.value)}
                  placeholder="e.g. Excellent proof structure. Review step 4 for minor arithmetic error."
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
                <button type="button" onClick={() => setSelectedSubmission(null)} className="btn btn-outline">Cancel</button>
                <button type="submit" className="btn btn-primary">Save Score</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default TeacherAssignmentsPage;
