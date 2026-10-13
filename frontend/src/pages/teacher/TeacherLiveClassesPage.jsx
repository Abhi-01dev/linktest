import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { LiveClassroomModal } from '../../components/livekit/LiveClassroomModal';
import {
  Video,
  Plus,
  Calendar,
  Clock,
  Play,
  CheckCircle,
  Radio,
  Layers,
  Sparkles,
  PhoneOff,
  AlertCircle
} from 'lucide-react';

export function TeacherLiveClassesPage() {
  const [liveClasses, setLiveClasses] = useState([]);
  const [batches, setBatches] = useState([]);
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);

  // Active in-app LiveKit classroom
  const [activeSession, setActiveSession] = useState(null);

  // Schedule Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [batchId, setBatchId] = useState('');
  const [classId, setClassId] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { showToast } = useToast();

  const loadData = async () => {
    try {
      setLoading(true);
      const [lcList, bList, cList, sList] = await Promise.all([
        api.getTeacherLiveClasses().catch(() => []),
        api.getBatches().catch(() => []),
        api.getTeacherClasses().catch(() => []),
        api.getAdminSubjects().catch(() => [])
      ]);
      setLiveClasses(Array.isArray(lcList) ? lcList : []);
      setBatches(Array.isArray(bList) ? bList : []);
      setClasses(Array.isArray(cList) ? cList : []);
      setSubjects(Array.isArray(sList) ? sList : []);

      if (bList?.length > 0 && !batchId) setBatchId(bList[0].id);
      if (cList?.length > 0 && !classId) setClassId(cList[0].class_id || cList[0].id);
      if (sList?.length > 0 && !subjectId) setSubjectId(sList[0].id);
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
    if (!title.trim()) {
      showToast('Please provide a lecture title', 'error');
      return;
    }
    if (!scheduledAt) {
      showToast('Please specify scheduled date and time', 'error');
      return;
    }

    try {
      setSubmitting(true);
      await api.createTeacherLiveClass({
        title: title.trim(),
        description: description.trim(),
        batch_id: batchId || null,
        class_id: classId || null,
        subject_id: subjectId || null,
        scheduled_at: new Date(scheduledAt).toISOString()
      });
      showToast('Live lecture broadcast scheduled successfully with LiveKit room', 'success');
      setShowAddModal(false);
      setTitle('');
      setDescription('');
      loadData();
    } catch (err) {
      showToast(err.message || 'Failed to schedule live lecture', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEndSession = async (sessionId) => {
    if (!window.confirm('Are you sure you want to conclude this live lecture?')) return;
    try {
      await api.endTeacherLiveClass(sessionId);
      showToast('Live lecture concluded successfully', 'success');
      loadData();
    } catch (err) {
      showToast(err.message || 'Failed to conclude session', 'error');
    }
  };

  return (
    <div>
      {/* Page Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1.75rem',
          flexWrap: 'wrap',
          gap: '1rem'
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                fontSize: '0.72rem',
                fontWeight: 700,
                color: '#2563EB',
                background: '#EFF6FF',
                padding: '0.2rem 0.6rem',
                borderRadius: '999px',
                border: '1px solid #BFDBFE'
              }}
            >
              <Radio size={12} />
              LIVEKIT WEBRTC BROADCASTING
            </span>
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#0F172A', marginBottom: '0.25rem' }}>
            Live Lecture Broadcasts & Sessions
          </h1>
          <p style={{ color: '#64748B', fontSize: '0.875rem' }}>
            Host seamless real-time WebRTC audio & video lectures for your assigned cohorts. Zero external Zoom URLs required.
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="btn btn-primary"
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
        >
          <Plus size={16} />
          <span>Schedule Live Lecture</span>
        </button>
      </div>

      {/* Sessions Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '3.5rem', textAlign: 'center', color: '#64748B' }}>
            Loading scheduled lecture broadcasts...
          </div>
        ) : liveClasses.length === 0 ? (
          <div style={{ padding: '3.5rem', textAlign: 'center' }}>
            <Video size={42} style={{ color: '#94A3B8', margin: '0 auto 1rem' }} />
            <h3 style={{ fontSize: '1.15rem', color: '#0F172A', marginBottom: '0.35rem' }}>
              No Live Lectures Scheduled
            </h3>
            <p style={{ color: '#64748B', fontSize: '0.875rem', maxWidth: '420px', margin: '0 auto 1.5rem' }}>
              Schedule an interactive LiveKit video broadcast for your assigned batch or class cohort.
            </p>
            <button onClick={() => setShowAddModal(true)} className="btn btn-primary">
              <Plus size={16} style={{ marginRight: '0.4rem' }} />
              Schedule First Lecture
            </button>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#475569', fontWeight: 600 }}>
                  <th style={{ padding: '0.9rem 1.25rem' }}>Lecture Session</th>
                  <th style={{ padding: '0.9rem 1.25rem' }}>Batch / Class & Subject</th>
                  <th style={{ padding: '0.9rem 1.25rem' }}>Scheduled Time</th>
                  <th style={{ padding: '0.9rem 1.25rem' }}>Status</th>
                  <th style={{ padding: '0.9rem 1.25rem', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {liveClasses.map((lc) => {
                  const isLive = lc.status === 'ongoing';
                  const isCompleted = lc.status === 'completed';

                  return (
                    <tr key={lc.id} style={{ borderBottom: '1px solid #F1F5F9', background: isLive ? '#F0FDF4' : undefined }}>
                      <td style={{ padding: '1rem 1.25rem', fontWeight: 600, color: '#0F172A' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                          <div
                            style={{
                              padding: '0.4rem',
                              borderRadius: '8px',
                              background: isLive ? '#DCFCE7' : '#EFF6FF',
                              color: isLive ? '#16A34A' : '#2563EB'
                            }}
                          >
                            <Video size={16} />
                          </div>
                          <div>
                            <div style={{ fontSize: '0.92rem' }}>{lc.title}</div>
                            {lc.description && (
                              <div style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 400, marginTop: '0.15rem' }}>
                                {lc.description}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '1rem 1.25rem', color: '#475569' }}>
                        <div style={{ fontWeight: 500 }}>
                          {lc.batch_name ? `Batch: ${lc.batch_name}` : lc.class_name || 'Assigned Class'}
                        </div>
                        {lc.subject_name && (
                          <div style={{ fontSize: '0.78rem', color: '#64748B' }}>
                            Subject: {lc.subject_name}
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '1rem 1.25rem', color: '#64748B', fontSize: '0.82rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                          <Clock size={13} style={{ color: '#F97316' }} />
                          <span>{new Date(lc.scheduled_at).toLocaleString()}</span>
                        </div>
                      </td>
                      <td style={{ padding: '1rem 1.25rem' }}>
                        <span
                          style={{
                            padding: '0.25rem 0.65rem',
                            borderRadius: '999px',
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            textTransform: 'uppercase',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.35rem',
                            background: isLive ? '#DCFCE7' : isCompleted ? '#F1F5F9' : '#EFF6FF',
                            color: isLive ? '#166534' : isCompleted ? '#64748B' : '#1D4ED8'
                          }}
                        >
                          {isLive && (
                            <span
                              style={{
                                width: 7,
                                height: 7,
                                borderRadius: '50%',
                                background: '#16A34A',
                                display: 'inline-block'
                              }}
                            />
                          )}
                          {isLive ? 'LIVE NOW' : lc.status}
                        </span>
                      </td>
                      <td style={{ padding: '1rem 1.25rem', textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', alignItems: 'center' }}>
                          {!isCompleted && (
                            <button
                              onClick={() => setActiveSession(lc)}
                              className={`btn btn-sm ${isLive ? 'btn-primary' : 'btn-outline'}`}
                              style={{
                                fontSize: '0.78rem',
                                padding: '0.35rem 0.75rem',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.4rem',
                                background: isLive ? '#16A34A' : undefined,
                                borderColor: isLive ? '#16A34A' : '#2563EB',
                                color: isLive ? '#FFFFFF' : '#2563EB'
                              }}
                            >
                              <Play size={12} />
                              <span>{isLive ? 'Enter Classroom' : 'Launch Lecture'}</span>
                            </button>
                          )}

                          {isLive && (
                            <button
                              onClick={() => handleEndSession(lc.id)}
                              className="btn btn-sm btn-ghost"
                              style={{ fontSize: '0.75rem', color: '#DC2626' }}
                              title="Conclude lecture for all participants"
                            >
                              <PhoneOff size={13} style={{ marginRight: '0.25rem' }} />
                              <span>End</span>
                            </button>
                          )}

                          {isCompleted && (
                            <span style={{ fontSize: '0.78rem', color: '#94A3B8', fontStyle: 'italic' }}>
                              Concluded
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Schedule Live Lecture Modal */}
      {showAddModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.65)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            padding: '1rem',
            backdropFilter: 'blur(4px)'
          }}
        >
          <div className="card" style={{ maxWidth: '520px', width: '100%', padding: '2rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
              <div style={{ padding: '0.35rem', background: '#EFF6FF', color: '#2563EB', borderRadius: '6px' }}>
                <Radio size={16} />
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>
                Schedule Live Lecture
              </h3>
            </div>
            <p style={{ color: '#64748B', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
              Broadcast directly from LinkTest via LiveKit Cloud WebRTC. No Zoom or external links needed.
            </p>

            <form onSubmit={handleCreate}>
              <div className="form-group">
                <label className="form-label">Lecture Topic / Title *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Kinematics Problem Solving & Live Doubt Session"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div className="form-group">
                  <label className="form-label">Target Batch / Cohort</label>
                  <select
                    className="form-select"
                    value={batchId}
                    onChange={(e) => setBatchId(e.target.value)}
                  >
                    <option value="">Select Batch (Optional)</option>
                    {batches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name} ({b.code || 'Active'})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Class Division</label>
                  <select
                    className="form-select"
                    value={classId}
                    onChange={(e) => setClassId(e.target.value)}
                  >
                    <option value="">Select Class (Optional)</option>
                    {classes.map((c) => (
                      <option key={c.class_id || c.id} value={c.class_id || c.id}>
                        {c.class_name || c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div className="form-group">
                  <label className="form-label">Subject</label>
                  <select
                    className="form-select"
                    value={subjectId}
                    onChange={(e) => setSubjectId(e.target.value)}
                  >
                    <option value="">General Subject</option>
                    {subjects.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Date & Time *</label>
                  <input
                    type="datetime-local"
                    className="form-input"
                    value={scheduledAt}
                    onChange={(e) => setScheduledAt(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Lecture Agenda & Notes (Optional)</label>
                <textarea
                  className="form-input"
                  rows={2}
                  placeholder="Topics to be covered, recommended prerequisites..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <div
                style={{
                  background: '#F8FAFC',
                  border: '1px solid #E2E8F0',
                  borderRadius: '8px',
                  padding: '0.75rem 1rem',
                  fontSize: '0.8rem',
                  color: '#475569',
                  marginBottom: '1.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
              >
                <Sparkles size={16} style={{ color: '#2563EB', flexShrink: 0 }} />
                <span>
                  A unique, secure LiveKit video classroom will be allocated automatically when you launch the lecture.
                </span>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="btn btn-outline"
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={submitting}
                >
                  {submitting ? 'Scheduling...' : 'Schedule Live Lecture'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Interactive In-App Live Classroom Modal */}
      {activeSession && (
        <LiveClassroomModal
          session={activeSession}
          isTeacher={true}
          onClose={() => {
            setActiveSession(null);
            loadData();
          }}
          onSessionEnded={() => {
            loadData();
          }}
        />
      )}
    </div>
  );
}

export default TeacherLiveClassesPage;
