import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { Calendar, Clock, MapPin, School, BookOpen } from 'lucide-react';

const DAYS = [
  { id: 1, name: 'Monday' },
  { id: 2, name: 'Tuesday' },
  { id: 3, name: 'Wednesday' },
  { id: 4, name: 'Thursday' },
  { id: 5, name: 'Friday' },
  { id: 6, name: 'Saturday' }
];

export function TeacherTimetablePage() {
  const [timetable, setTimetable] = useState([]);
  const [loading, setLoading] = useState(true);

  const { showToast } = useToast();

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const data = await api.getTeacherTimetable();
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
    <div>
      <div style={{ marginBottom: '1.75rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#0F172A', marginBottom: '0.25rem' }}>
          Weekly Teaching Timetable
        </h1>
        <p style={{ color: '#64748B', fontSize: '0.875rem' }}>
          Your master weekly lecture roster, classroom hall allocations, and timings.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
        {DAYS.map(day => {
          const dayEntries = timetable
            .filter(t => t.day_of_week === day.id)
            .sort((a, b) => a.start_time.localeCompare(b.start_time));

          return (
            <div key={day.id} className="card" style={{ padding: '1rem' }}>
              <div style={{ paddingBottom: '0.5rem', borderBottom: '2px solid #E2E8F0', marginBottom: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#0F172A' }}>{day.name}</h3>
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#2563EB', background: '#EFF6FF', padding: '0.15rem 0.5rem', borderRadius: '4px' }}>
                  {dayEntries.length} lectures
                </span>
              </div>

              {dayEntries.length === 0 ? (
                <p style={{ color: '#94A3B8', fontSize: '0.82rem', fontStyle: 'italic', padding: '1rem 0', textAlign: 'center' }}>
                  No classes scheduled
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                  {dayEntries.map(entry => (
                    <div
                      key={entry.id}
                      style={{
                        padding: '0.75rem 0.85rem',
                        background: '#F8FAFC',
                        border: '1px solid #E2E8F0',
                        borderRadius: '6px'
                      }}
                    >
                      <div style={{ fontWeight: 700, color: '#0F172A', fontSize: '0.9rem' }}>
                        {entry.subject_name || 'Subject'}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#2563EB', fontSize: '0.78rem', margin: '0.25rem 0' }}>
                        <Clock size={12} />
                        <span>{entry.start_time.slice(0, 5)} - {entry.end_time.slice(0, 5)}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', color: '#64748B', fontSize: '0.75rem' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <School size={12} />
                          {entry.class_name} {entry.batch_name ? `(${entry.batch_name})` : ''}
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
    </div>
  );
}
export default TeacherTimetablePage;
