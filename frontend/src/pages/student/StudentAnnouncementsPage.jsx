import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { StudentNav } from '../../components/student/StudentNav';
import { useToast } from '../../context/ToastContext';
import { Megaphone, Calendar, User, Bell } from 'lucide-react';

export function StudentAnnouncementsPage() {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);

  const { showToast } = useToast();

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const data = await api.getStudentAnnouncements();
        setAnnouncements(data || []);
      } catch (err) {
        showToast(err.message || 'Failed to load announcements', 'error');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div style={{ padding: '2.5rem 0 5rem' }}>
      <div className="container">
        <StudentNav />

        <div style={{ marginBottom: '1.75rem' }}>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--color-navy)', marginBottom: '0.25rem' }}>
            Campus Bulletins & Notices
          </h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>
            Official announcements, examination timetables, holiday notices, and division updates.
          </p>
        </div>

        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#64748B' }}>Loading bulletins...</div>
        ) : announcements.length === 0 ? (
          <div className="card" style={{ padding: '3rem', textAlign: 'center' }}>
            <Megaphone size={44} style={{ color: 'var(--color-text-muted)', margin: '0 auto 1rem' }} />
            <h3 style={{ fontSize: '1.15rem', color: 'var(--color-navy)', marginBottom: '0.35rem' }}>No Notices Posted</h3>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
              All new academic updates and notifications will appear here.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {announcements.map(a => (
              <div key={a.id} className="card" style={{ padding: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <div style={{ padding: '0.4rem', background: '#FEF3C7', color: '#D97706', borderRadius: '8px' }}>
                      <Megaphone size={18} />
                    </div>
                    <div>
                      <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--color-navy)' }}>{a.title}</h3>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', fontSize: '0.78rem', color: 'var(--color-text-muted)', marginTop: '0.2rem' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                          <User size={12} />
                          {a.author_name || 'Academic Administration'}
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                          <Calendar size={12} />
                          {new Date(a.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  <span style={{
                    padding: '0.2rem 0.65rem',
                    borderRadius: '999px',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    background: a.target_type === 'global' ? '#EFF6FF' : '#F0FDF4',
                    color: a.target_type === 'global' ? '#1D4ED8' : '#166534'
                  }}>
                    {a.target_type === 'global' ? 'Campus-Wide' : 'Class Notice'}
                  </span>
                </div>

                <p style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)', lineHeight: 1.6, whiteSpace: 'pre-wrap', marginTop: '0.5rem' }}>
                  {a.content}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
export default StudentAnnouncementsPage;
