import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { StudentNav } from '../../components/student/StudentNav';
import { useToast } from '../../context/ToastContext';
import { LiveClassroomModal } from '../../components/livekit/LiveClassroomModal';
import { Video, Calendar, Clock, User, CheckCircle, Radio, Play } from 'lucide-react';

export function StudentLiveClassesPage() {
  const [liveClasses, setLiveClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeSession, setActiveSession] = useState(null);

  const { showToast } = useToast();

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await api.getStudentLiveClasses();
      setLiveClasses(Array.isArray(data) ? data : []);
    } catch (err) {
      showToast(err.message || 'Failed to load live sessions', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div style={{ padding: '2.5rem 0 5rem' }}>
      <div className="container">
        <StudentNav />

        <div style={{ marginBottom: '1.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                fontSize: '0.72rem',
                fontWeight: 700,
                color: '#16A34A',
                background: '#DCFCE7',
                padding: '0.2rem 0.6rem',
                borderRadius: '999px',
                border: '1px solid #BBF7D0'
              }}
            >
              <Radio size={12} />
              LIVEKIT WEBRTC CLASSROOM
            </span>
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--color-navy)', marginBottom: '0.25rem' }}>
            Live Classroom Sessions & Broadcasts
          </h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>
            Join interactive virtual lectures, doubt clearing workshops, and cohort seminar meetings with crystal-clear audio and video.
          </p>
        </div>

        {loading ? (
          <div style={{ padding: '3.5rem', textAlign: 'center', color: '#64748B' }}>
            Loading scheduled sessions...
          </div>
        ) : liveClasses.length === 0 ? (
          <div className="card" style={{ padding: '3.5rem', textAlign: 'center' }}>
            <Video size={44} style={{ color: 'var(--color-text-muted)', margin: '0 auto 1rem' }} />
            <h3 style={{ fontSize: '1.15rem', color: 'var(--color-navy)', marginBottom: '0.35rem' }}>
              No Live Sessions Currently Scheduled
            </h3>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
              Your faculty instructors will post virtual lecture broadcasts here for your enrolled cohort batches.
            </p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1.25rem' }}>
            {liveClasses.map((lc) => {
              const isLive = lc.status === 'ongoing';
              const isCompleted = lc.status === 'completed';

              return (
                <div
                  key={lc.id}
                  className="card"
                  style={{
                    padding: '1.5rem',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    border: isLive ? '2px solid #16A34A' : undefined,
                    boxShadow: isLive ? '0 4px 12px rgba(22, 163, 74, 0.15)' : undefined
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                      <span
                        style={{
                          padding: '0.2rem 0.6rem',
                          borderRadius: '999px',
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          background: isLive ? '#DCFCE7' : isCompleted ? '#F1F5F9' : '#EFF6FF',
                          color: isLive ? '#166534' : isCompleted ? '#64748B' : '#1D4ED8',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.3rem'
                        }}
                      >
                        {isLive && (
                          <span
                            style={{
                              width: 6,
                              height: 6,
                              borderRadius: '50%',
                              background: '#16A34A',
                              display: 'inline-block'
                            }}
                          />
                        )}
                        {isLive ? 'Live Now' : lc.status}
                      </span>
                      <span style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>
                        {lc.subject_name || 'General Subject'}
                      </span>
                    </div>

                    <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--color-navy)', marginBottom: '0.4rem' }}>
                      {lc.title}
                    </h3>

                    {lc.description && (
                      <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginBottom: '1rem', lineHeight: 1.5 }}>
                        {lc.description}
                      </p>
                    )}

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '1.25rem' }}>
                      {lc.batch_name && (
                        <div style={{ fontWeight: 600, color: '#0F172A' }}>
                          Cohort Batch: {lc.batch_name}
                        </div>
                      )}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <Clock size={13} style={{ color: 'var(--color-orange)' }} />
                        <span>Scheduled: {new Date(lc.scheduled_at).toLocaleString()}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <User size={13} />
                        <span>Instructor: {lc.teacher_name || 'Faculty Member'}</span>
                      </div>
                    </div>
                  </div>

                  <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '0.85rem', display: 'flex', justifyContent: 'flex-end' }}>
                    {!isCompleted ? (
                      <button
                        onClick={() => setActiveSession(lc)}
                        className={`btn btn-sm ${isLive ? 'btn-primary' : 'btn-outline'}`}
                        style={{
                          fontSize: '0.8rem',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.4rem',
                          background: isLive ? '#16A34A' : undefined,
                          borderColor: isLive ? '#16A34A' : undefined,
                          color: isLive ? '#FFFFFF' : undefined
                        }}
                      >
                        <Play size={14} />
                        <span>{isLive ? 'Join Live Room Now' : 'Enter Classroom'}</span>
                      </button>
                    ) : (
                      <span style={{ fontSize: '0.8rem', color: '#94A3B8', fontStyle: 'italic' }}>
                        Lecture Completed
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Interactive In-App Live Classroom Modal */}
      {activeSession && (
        <LiveClassroomModal
          session={activeSession}
          isTeacher={false}
          onClose={() => {
            setActiveSession(null);
            loadData();
          }}
        />
      )}
    </div>
  );
}

export default StudentLiveClassesPage;
