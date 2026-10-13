import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { StudentNav } from '../../components/student/StudentNav';
import { useToast } from '../../context/ToastContext';
import { Calendar, Clock, MapPin, User, BookOpen } from 'lucide-react';

const DAYS = [
  { id: 1, name: 'Monday' },
  { id: 2, name: 'Tuesday' },
  { id: 3, name: 'Wednesday' },
  { id: 4, name: 'Thursday' },
  { id: 5, name: 'Friday' },
  { id: 6, name: 'Saturday' }
];

export function StudentTimetablePage() {
  const [timetable, setTimetable] = useState([]);
  const [loading, setLoading] = useState(true);

  const { showToast } = useToast();

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const data = await api.getStudentTimetable();
        setTimetable(data || []);
      } catch (err) {
        showToast(err.message || 'Failed to load timetable', 'error');
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
            My Weekly Lecture Timetable
          </h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>
            Your enrolled division timetable, period timings, and classroom halls.
          </p>
        </div>

        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#64748B' }}>Loading timetable...</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
            {DAYS.map(day => {
              const dayEntries = timetable
                .filter(t => t.day_of_week === day.id)
                .sort((a, b) => a.start_time.localeCompare(b.start_time));

              return (
                <div key={day.id} className="card" style={{ padding: '1.25rem' }}>
                  <div style={{ paddingBottom: '0.5rem', borderBottom: '2px solid var(--color-border)', marginBottom: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-navy)', margin: 0 }}>{day.name}</h3>
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-orange-dark)', background: 'var(--color-bg-alt)', padding: '0.15rem 0.5rem', borderRadius: '4px' }}>
                      {dayEntries.length} classes
                    </span>
                  </div>

                  {dayEntries.length === 0 ? (
                    <p style={{ color: 'var(--color-text-muted)', fontSize: '0.82rem', fontStyle: 'italic', padding: '1rem 0', textAlign: 'center' }}>
                      No classes scheduled
                    </p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                      {dayEntries.map(entry => (
                        <div
                          key={entry.id}
                          style={{
                            padding: '0.75rem 0.85rem',
                            background: 'var(--color-bg-alt)',
                            border: '1px solid var(--color-border)',
                            borderRadius: '8px'
                          }}
                        >
                          <div style={{ fontWeight: 700, color: 'var(--color-navy)', fontSize: '0.9rem' }}>
                            {entry.subject_name || 'Subject'}
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--color-orange-dark)', fontSize: '0.78rem', margin: '0.25rem 0' }}>
                            <Clock size={12} />
                            <span>{entry.start_time.slice(0, 5)} - {entry.end_time.slice(0, 5)}</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', color: 'var(--color-text-secondary)', fontSize: '0.75rem' }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                              <User size={12} />
                              {entry.teacher_name || 'Faculty'}
                            </span>
                            {entry.room && (
                              <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                <MapPin size={12} />
                                {entry.room}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
export default StudentTimetablePage;
