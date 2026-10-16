import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import {
  GraduationCap,
  UserPlus,
  Mail,
  BookOpen,
  School,
  CheckCircle,
  AlertCircle,
  Search,
  Plus
} from 'lucide-react';

export function AdminTeachersPage() {
  const [teachers, setTeachers] = useState([]);
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Invite Modal State
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteFullName, setInviteFullName] = useState('');
  const [inviting, setInviting] = useState(false);

  // Assign Modal State
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [assignClassId, setAssignClassId] = useState('');
  const [assignBatchId, setAssignBatchId] = useState('');
  const [assignSubjectId, setAssignSubjectId] = useState('');
  const [batches, setBatches] = useState([]);

  const { showToast } = useToast();

  const loadData = async () => {
    try {
      setLoading(true);
      const [teachersData, classesData, subjectsData] = await Promise.all([
        api.getAdminTeachers(),
        api.getAdminClasses(),
        api.getAdminSubjects()
      ]);
      setTeachers(teachersData || []);
      setClasses(classesData || []);
      setSubjects(subjectsData || []);
    } catch (err) {
      showToast(err.message || 'Failed to load faculty directory', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleInviteSubmit = async (e) => {
    e.preventDefault();
    setInviting(true);
    try {
      const res = await api.inviteTeacher(inviteEmail, inviteFullName);
      showToast(`Invitation sent to ${inviteEmail}`, 'success');
      setShowInviteModal(false);
      setInviteEmail('');
      setInviteFullName('');
      loadData();
    } catch (err) {
      showToast(err.message || 'Failed to send teacher invitation', 'error');
    } finally {
      setInviting(false);
    }
  };

  const handleOpenAssignModal = async (teacher) => {
    setSelectedTeacher(teacher);
    const initialClassId = classes[0]?.id || '';
    setAssignClassId(initialClassId);
    setAssignSubjectId(subjects[0]?.id || '');
    if (initialClassId) {
      const bList = await api.getAdminBatches(initialClassId);
      setBatches(bList || []);
      setAssignBatchId(bList[0]?.id || '');
    }
    setShowAssignModal(true);
  };

  const handleClassChangeInAssign = async (cid) => {
    setAssignClassId(cid);
    const bList = await api.getAdminBatches(cid);
    setBatches(bList || []);
    setAssignBatchId(bList[0]?.id || '');
  };

  const handleAssignSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.assignTeacher({
        teacher_id: selectedTeacher.id,
        class_id: assignClassId,
        batch_id: assignBatchId || null,
        subject_id: assignSubjectId
      });
      showToast(`Assigned subject to ${selectedTeacher.full_name}`, 'success');
      setShowAssignModal(false);
      loadData();
    } catch (err) {
      showToast(err.message || 'Failed to assign teacher', 'error');
    }
  };

  const handleRemoveAssignment = async (assignmentId) => {
    try {
      await api.removeTeacherAssignment(assignmentId);
      showToast('Assignment removed successfully', 'success');
      loadData();
    } catch (err) {
      showToast(err.message || 'Failed to remove assignment', 'error');
    }
  };

  const filteredTeachers = teachers.filter(t =>
    t.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    t.email?.toLowerCase().includes(search.toLowerCase()) ||
    t.department?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.75rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#0F172A', marginBottom: '0.25rem' }}>
            Faculty & Teacher Management
          </h1>
          <p style={{ color: '#64748B', fontSize: '0.875rem' }}>
            Invite teachers via verified email, assign teaching subjects and classes, and oversee faculty load.
          </p>
        </div>
        <button
          onClick={() => setShowInviteModal(true)}
          className="btn btn-primary"
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
        >
          <Mail size={16} />
          <span>Invite Teacher</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="card" style={{ padding: '0.85rem 1.25rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <Search size={18} style={{ color: '#94A3B8' }} />
        <input
          type="text"
          placeholder="Search faculty by name, email, department..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ width: '100%', border: 'none', outline: 'none', fontSize: '0.875rem', background: 'transparent' }}
        />
      </div>

      {/* Teachers Directory */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#64748B' }}>Loading faculty members...</div>
        ) : filteredTeachers.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#64748B' }}>No teachers found. Click "Invite Teacher" to onboard faculty.</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#475569', fontWeight: 600 }}>
                  <th style={{ padding: '0.85rem 1.25rem' }}>Faculty Name</th>
                  <th style={{ padding: '0.85rem 1.25rem' }}>Email Address</th>
                  <th style={{ padding: '0.85rem 1.25rem' }}>Department / Qualification</th>
                  <th style={{ padding: '0.85rem 1.25rem' }}>Assigned Classes & Subjects</th>
                  <th style={{ padding: '0.85rem 1.25rem' }}>Status</th>
                  <th style={{ padding: '0.85rem 1.25rem', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredTeachers.map((teacher) => (
                  <tr key={teacher.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                    <td style={{ padding: '0.85rem 1.25rem', fontWeight: 600, color: '#0F172A' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                        <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'rgba(37, 99, 235, 0.1)', color: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.85rem' }}>
                          {teacher.full_name?.charAt(0)}
                        </div>
                        <div>
                          <div>{teacher.full_name}</div>
                          <div style={{ fontSize: '0.72rem', color: '#64748B' }}>ID: {teacher.id.slice(0, 8)}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '0.85rem 1.25rem', color: '#475569' }}>{teacher.email}</td>
                    <td style={{ padding: '0.85rem 1.25rem', color: '#64748B' }}>
                      <div>{teacher.department || 'General Faculty'}</div>
                      {teacher.qualification && <div style={{ fontSize: '0.75rem', color: '#94A3B8' }}>{teacher.qualification}</div>}
                    </td>
                    <td style={{ padding: '0.85rem 1.25rem' }}>
                      {teacher.assignments && teacher.assignments.length > 0 ? (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                          {teacher.assignments.map((asgn, i) => (
                            <span
                              key={asgn.id || i}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.35rem',
                                padding: '0.2rem 0.55rem',
                                background: '#F0FDF4',
                                color: '#166534',
                                border: '1px solid #BBF7D0',
                                borderRadius: '4px',
                                fontSize: '0.75rem',
                                fontWeight: 600
                              }}
                            >
                              <span>{asgn.subject_name || 'Subject'} ({asgn.batch_name || asgn.class_name || 'Cohort'})</span>
                              <button
                                type="button"
                                onClick={() => handleRemoveAssignment(asgn.id)}
                                title="Remove assignment"
                                style={{
                                  background: 'none',
                                  border: 'none',
                                  cursor: 'pointer',
                                  color: '#DC2626',
                                  fontSize: '0.85rem',
                                  lineHeight: 1,
                                  padding: 0,
                                  fontWeight: 700
                                }}
                              >
                                ×
                              </button>
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span style={{ color: '#94A3B8', fontSize: '0.8rem', fontStyle: 'italic' }}>No assignments yet</span>
                      )}
                    </td>
                    <td style={{ padding: '0.85rem 1.25rem' }}>
                      <span style={{
                        padding: '0.25rem 0.65rem',
                        borderRadius: '999px',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        background: teacher.status === 'active' ? '#DCFCE7' : '#FEE2E2',
                        color: teacher.status === 'active' ? '#166534' : '#991B1B'
                      }}>
                        {teacher.status || 'active'}
                      </span>
                    </td>
                    <td style={{ padding: '0.85rem 1.25rem', textAlign: 'right' }}>
                      <button
                        onClick={() => handleOpenAssignModal(teacher)}
                        className="btn btn-sm btn-outline"
                        style={{ fontSize: '0.78rem', padding: '0.35rem 0.65rem' }}
                      >
                        + Assign Subject
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Invite Teacher Modal */}
      {showInviteModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '1rem' }}>
          <div className="card" style={{ maxWidth: '460px', width: '100%', padding: '2rem' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>
              Invite New Faculty Member
            </h3>
            <p style={{ color: '#64748B', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
              An invitation email containing a secure 7-day token link will be sent to the teacher.
            </p>

            <form onSubmit={handleInviteSubmit}>
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Prof. Rajesh Kulkarni"
                  value={inviteFullName}
                  onChange={(e) => setInviteFullName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Email Address</label>
                <input
                  type="email"
                  className="form-input"
                  placeholder="e.g. rajesh@linktest.io"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1.75rem' }}>
                <button type="button" onClick={() => setShowInviteModal(false)} className="btn btn-outline" disabled={inviting}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={inviting}>
                  {inviting ? 'Sending Invite...' : 'Send Invitation Email'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assign Teacher Modal */}
      {showAssignModal && selectedTeacher && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '1rem' }}>
          <div className="card" style={{ maxWidth: '440px', width: '100%', padding: '2rem' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>
              Assign Class & Subject
            </h3>
            <p style={{ color: '#64748B', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
              Assigning for <strong>{selectedTeacher.full_name}</strong>.
            </p>

            <form onSubmit={handleAssignSubmit}>
              <div className="form-group">
                <label className="form-label">Subject</label>
                <select
                  className="form-select"
                  value={assignSubjectId}
                  onChange={(e) => setAssignSubjectId(e.target.value)}
                  required
                >
                  {subjects.map(s => (
                    <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Class</label>
                <select
                  className="form-select"
                  value={assignClassId}
                  onChange={(e) => handleClassChangeInAssign(e.target.value)}
                  required
                >
                  {classes.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              {batches.length > 0 && (
                <div className="form-group">
                  <label className="form-label">Batch (Optional)</label>
                  <select
                    className="form-select"
                    value={assignBatchId}
                    onChange={(e) => setAssignBatchId(e.target.value)}
                  >
                    <option value="">All Batches</option>
                    {batches.map(b => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>
              )}

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1.75rem' }}>
                <button type="button" onClick={() => setShowAssignModal(false)} className="btn btn-outline">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save Assignment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
export default AdminTeachersPage;
