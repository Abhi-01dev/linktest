import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { Video, Plus, ExternalLink, Calendar, Clock, User } from 'lucide-react';

export function AdminLiveClassesPage() {
  const [liveClasses, setLiveClasses] = useState([]);
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [classId, setClassId] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [teacherId, setTeacherId] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');
  const [meetingUrl, setMeetingUrl] = useState('');

  const { showToast } = useToast();

  const loadData = async () => {
    try {
      setLoading(true);
      const [lcList, cList, sList, tList] = await Promise.all([
        api.getAdminLiveClasses(),
        api.getAdminClasses(),
        api.getAdminSubjects(),
        api.getAdminTeachers()
      ]);
      setLiveClasses(lcList || []);
      setClasses(cList || []);
      setSubjects(sList || []);
      setTeachers(tList || []);
      if (cList?.length > 0) setClassId(cList[0].id);
      if (sList?.length > 0) setSubjectId(sList[0].id);
      if (tList?.length > 0) setTeacherId(tList[0].id);
    } catch (err) {
      showToast(err.message || 'Failed to load live classes', 'error');
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
      await api.createAdminLiveClass({
        title,
        description,
        class_id: classId,
        subject_id: subjectId || null,
        teacher_id: teacherId,
        scheduled_at: new Date(scheduledAt).toISOString(),
        meeting_url: meetingUrl
      });
      showToast('Live session scheduled successfully', 'success');
      setShowAddModal(false);
      setTitle('');
      setDescription('');
      setMeetingUrl('');
      loadData();
    } catch (err) {
      showToast(err.message || 'Failed to schedule live class', 'error');
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.75rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#0F172A', marginBottom: '0.25rem' }}>
            Live Classroom Sessions
          </h1>
          <p style={{ color: '#64748B', fontSize: '0.875rem' }}>
            Schedule and manage interactive virtual classes, webinars, and faculty broadcast streams.
          </p>
        </div>
        <button onClick={() => setShowAddModal(true)} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Plus size={16} />
          <span>Schedule Live Class</span>
        </button>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#64748B' }}>Loading scheduled sessions...</div>
        ) : liveClasses.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#64748B' }}>No live classes currently scheduled.</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#475569', fontWeight: 600 }}>
                <th style={{ padding: '0.85rem 1.25rem' }}>Session Title</th>
                <th style={{ padding: '0.85rem 1.25rem' }}>Class & Subject</th>
                <th style={{ padding: '0.85rem 1.25rem' }}>Faculty Host</th>
                <th style={{ padding: '0.85rem 1.25rem' }}>Scheduled Time</th>
                <th style={{ padding: '0.85rem 1.25rem' }}>Status</th>
                <th style={{ padding: '0.85rem 1.25rem', textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {liveClasses.map(lc => (
                <tr key={lc.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                  <td style={{ padding: '0.85rem 1.25rem', fontWeight: 600, color: '#0F172A' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Video size={16} style={{ color: '#2563EB' }} />
                      <span>{lc.title}</span>
                    </div>
                  </td>
                  <td style={{ padding: '0.85rem 1.25rem', color: '#475569' }}>
                    {lc.class_name || 'Class'} {lc.subject_name ? `• ${lc.subject_name}` : ''}
                  </td>
                  <td style={{ padding: '0.85rem 1.25rem', color: '#475569' }}>
                    {lc.teacher_name || 'Faculty'}
                  </td>
                  <td style={{ padding: '0.85rem 1.25rem', color: '#64748B', fontSize: '0.8rem' }}>
                    {new Date(lc.scheduled_at).toLocaleString()}
                  </td>
                  <td style={{ padding: '0.85rem 1.25rem' }}>
                    <span style={{
                      padding: '0.2rem 0.6rem',
                      borderRadius: '999px',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      background: lc.status === 'scheduled' ? '#EFF6FF' : lc.status === 'ongoing' ? '#DCFCE7' : '#F1F5F9',
                      color: lc.status === 'scheduled' ? '#1D4ED8' : lc.status === 'ongoing' ? '#166534' : '#64748B'
                    }}>
                      {lc.status}
                    </span>
                  </td>
                  <td style={{ padding: '0.85rem 1.25rem', textAlign: 'right' }}>
                    <a
                      href={lc.meeting_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-sm btn-outline"
                      style={{ fontSize: '0.78rem', padding: '0.3rem 0.6rem', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
                    >
                      <span>Join Link</span>
                      <ExternalLink size={12} />
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Schedule Live Class Modal */}
      {showAddModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '1rem' }}>
          <div className="card" style={{ maxWidth: '460px', width: '100%', padding: '2rem' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>Schedule Live Session</h3>
            <p style={{ color: '#64748B', fontSize: '0.85rem', marginBottom: '1.5rem' }}>Provide session details and meeting URL (e.g. Zoom, Google Meet, MS Teams).</p>
            <form onSubmit={handleCreate}>
              <div className="form-group">
                <label className="form-label">Session Title</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Organic Chemistry Live Doubt Clearing"
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
                      classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)
                    )}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Subject</label>
                  <select className="form-select" value={subjectId} onChange={(e) => setSubjectId(e.target.value)} disabled={subjects.length === 0}>
                    {subjects.length === 0 ? (
                      <option value="" disabled>No options</option>
                    ) : (
                      <>
                        <option value="">General</option>
                        {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                      </>
                    )}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Teacher Host</label>
                <select className="form-select" value={teacherId} onChange={(e) => setTeacherId(e.target.value)} required disabled={teachers.length === 0}>
                  {teachers.length === 0 ? (
                    <option value="" disabled>No options</option>
                  ) : (
                    teachers.map(t => <option key={t.id} value={t.id}>{t.full_name}</option>)
                  )}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Scheduled Date & Time</label>
                <input
                  type="datetime-local"
                  className="form-input"
                  value={scheduledAt}
                  onChange={(e) => setScheduledAt(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Meeting URL (Zoom / Google Meet)</label>
                <input
                  type="url"
                  className="form-input"
                  placeholder="https://meet.google.com/xyz-abc"
                  value={meetingUrl}
                  onChange={(e) => setMeetingUrl(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
                <button type="button" onClick={() => setShowAddModal(false)} className="btn btn-outline">Cancel</button>
                <button type="submit" className="btn btn-primary">Publish Live Class</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
export default AdminLiveClassesPage;
