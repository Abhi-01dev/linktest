import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';
import { StudentNav } from '../../components/student/StudentNav';
import { useToast } from '../../context/ToastContext';
import { Calendar, Clock, MapPin, User, Video, BookOpen, Layers } from 'lucide-react';

const DAYS = [
  { id: 1, name: 'Monday', short: 'Mon' },
  { id: 2, name: 'Tuesday', short: 'Tue' },
  { id: 3, name: 'Wednesday', short: 'Wed' },
  { id: 4, name: 'Thursday', short: 'Thu' },
  { id: 5, name: 'Friday', short: 'Fri' },
  { id: 6, name: 'Saturday', short: 'Sat' }
];

export function StudentTimetablePage() {
  const [timetable, setTimetable] = useState([]);
  const [loading, setLoading] = useState(true);

  // Automatically default to active weekday (Mon-Sat), or Monday if Sunday (0)
  const todayDay = new Date().getDay();
  const initialDay = (todayDay >= 1 && todayDay <= 6) ? todayDay : 1;
  const [activeTab, setActiveTab] = useState(initialDay); // number 1-6 or 'all'

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

  const displayedDays = activeTab === 'all'
    ? DAYS
    : DAYS.filter(d => d.id === activeTab);

  const getDayClassesCount = (dayId) => {
    return timetable.filter(t => t.day_of_week === dayId).length;
  };

  return (
    <div style={{ padding: '2.5rem 0 5rem' }}>
      <div className="container">
        <StudentNav />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.75rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--color-navy)', marginBottom: '0.25rem' }}>
              Academic Lecture Timetable
            </h1>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem', margin: 0 }}>
              Your enrolled division schedule, faculty periods, lecture timings, and assigned classroom halls.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#EFF6FF', padding: '0.4rem 0.85rem', borderRadius: '8px', border: '1px solid #BFDBFE' }}>
            <Calendar size={15} style={{ color: '#1D4ED8' }} />
            <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#1D4ED8' }}>
              Today: {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][todayDay]}
            </span>
          </div>
        </div>

        {/* Weekday Selector Tabs */}
        <div style={{
          display: 'flex',
          gap: '0.5rem',
          overflowX: 'auto',
          paddingBottom: '0.5rem',
          marginBottom: '1.75rem',
          borderBottom: '1px solid var(--color-border)'
        }}>
          {DAYS.map(day => {
            const isToday = day.id === todayDay;
            const isSelected = activeTab === day.id;
            const count = getDayClassesCount(day.id);

            return (
              <button
                key={day.id}
                onClick={() => setActiveTab(day.id)}
                className="btn btn-sm"
                style={{
                  padding: '0.5rem 0.95rem',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  borderRadius: '8px',
                  background: isSelected ? 'var(--color-navy)' : 'var(--color-bg-alt)',
                  color: isSelected ? '#FFFFFF' : 'var(--color-navy)',
                  borderColor: isSelected ? 'var(--color-navy)' : 'var(--color-border)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  whiteSpace: 'nowrap'
                }}
              >
                <span>{day.name}</span>
                {isToday && (
                  <span style={{
                    fontSize: '0.65rem',
                    fontWeight: 800,
                    padding: '0.1rem 0.35rem',
                    borderRadius: '4px',
                    background: isSelected ? 'rgba(255,255,255,0.25)' : '#DCFCE7',
                    color: isSelected ? '#FFFFFF' : '#166534'
                  }}>
                    Today
                  </span>
                )}
                <span style={{
                  fontSize: '0.72rem',
                  padding: '0.1rem 0.4rem',
                  borderRadius: '999px',
                  background: isSelected ? 'rgba(255,255,255,0.18)' : '#E2E8F0',
                  color: isSelected ? '#FFFFFF' : '#475569'
                }}>
                  {count}
                </span>
              </button>
            );
          })}

          <button
            onClick={() => setActiveTab('all')}
            className="btn btn-sm"
            style={{
              padding: '0.5rem 0.95rem',
              fontSize: '0.85rem',
              fontWeight: 600,
              borderRadius: '8px',
              background: activeTab === 'all' ? 'var(--color-navy)' : 'var(--color-bg-alt)',
              color: activeTab === 'all' ? '#FFFFFF' : 'var(--color-navy)',
              borderColor: activeTab === 'all' ? 'var(--color-navy)' : 'var(--color-border)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.45rem',
              whiteSpace: 'nowrap'
            }}
          >
            <Layers size={14} />
            <span>Full Week View</span>
          </button>
        </div>

        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#64748B' }}>Loading timetable...</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: activeTab === 'all' ? 'repeat(auto-fit, minmax(320px, 1fr))' : '1fr', gap: '1.25rem' }}>
            {displayedDays.map(day => {
              const dayEntries = timetable
                .filter(t => t.day_of_week === day.id)
                .sort((a, b) => (a.start_time || '').localeCompare(b.start_time || ''));

              return (
                <div key={day.id} className="card" style={{ padding: '1.5rem' }}>
                  <div style={{ paddingBottom: '0.65rem', borderBottom: '2px solid var(--color-border)', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--color-navy)', margin: 0 }}>{day.name}</h2>
                      {day.id === todayDay && (
                        <span style={{ fontSize: '0.7rem', fontWeight: 800, padding: '0.15rem 0.5rem', borderRadius: '4px', background: '#DCFCE7', color: '#166534' }}>
                          Current Day
                        </span>
                      )}
                    </div>
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-orange-dark)', background: 'var(--color-bg-alt)', padding: '0.2rem 0.6rem', borderRadius: '4px' }}>
                      {dayEntries.length} lecture{dayEntries.length === 1 ? '' : 's'}
                    </span>
                  </div>

                  {dayEntries.length === 0 ? (
                    <div style={{ padding: '2rem 1rem', textAlign: 'center', background: 'var(--color-bg-alt)', borderRadius: '8px' }}>
                      <p style={{ color: 'var(--color-text-muted)', fontSize: '0.88rem', margin: 0 }}>
                        No lectures scheduled for {day.name}.
                      </p>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                      {dayEntries.map((entry, idx) => (
                        <div
                          key={entry.id || idx}
                          style={{
                            padding: '1rem',
                            background: 'var(--color-bg-alt)',
                            border: '1px solid var(--color-border)',
                            borderRadius: '10px',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            flexWrap: 'wrap',
                            gap: '0.75rem'
                          }}
                        >
                          <div style={{ flex: 1, minWidth: '220px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.3rem' }}>
                              <span style={{ fontSize: '0.72rem', fontWeight: 800, padding: '0.15rem 0.45rem', borderRadius: '4px', background: '#EFF6FF', color: '#1D4ED8' }}>
                                Period {entry.period_number || idx + 1}
                              </span>
                              {entry.subject_code && (
                                <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748B' }}>
                                  {entry.subject_code}
                                </span>
                              )}
                            </div>
                            <h3 style={{ fontWeight: 700, color: 'var(--color-navy)', fontSize: '1rem', margin: '0 0 0.35rem 0' }}>
                              {entry.subject_name || entry.subject_title || 'Class'}
                            </h3>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', color: 'var(--color-text-secondary)', fontSize: '0.8rem', flexWrap: 'wrap' }}>
                              <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                <User size={13} />
                                {entry.teacher_name || 'Faculty'}
                              </span>
                              {entry.room && (
                                <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                  <MapPin size={13} />
                                  Hall: {entry.room}
                                </span>
                              )}
                            </div>
                          </div>

                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.4rem',
                              padding: '0.35rem 0.75rem',
                              background: '#FFFFFF',
                              border: '1px solid var(--color-border)',
                              borderRadius: '6px',
                              color: 'var(--color-navy)',
                              fontWeight: 700,
                              fontSize: '0.85rem'
                            }}>
                              <Clock size={13} style={{ color: 'var(--color-orange)' }} />
                              <span>{entry.start_time?.slice(0, 5)} - {entry.end_time?.slice(0, 5)}</span>
                            </div>

                            {entry.live_meeting_url && (
                              <a
                                href={entry.live_meeting_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="btn btn-sm btn-primary"
                                style={{ fontSize: '0.75rem', padding: '0.25rem 0.65rem' }}
                              >
                                <Video size={12} />
                                <span>Join Live Class</span>
                              </a>
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
