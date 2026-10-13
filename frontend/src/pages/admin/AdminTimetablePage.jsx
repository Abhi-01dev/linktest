import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { Calendar, Plus, Trash2, Clock, MapPin, User } from 'lucide-react';

const DAYS = [
  { id: 1, name: 'Monday' },
  { id: 2, name: 'Tuesday' },
  { id: 3, name: 'Wednesday' },
  { id: 4, name: 'Thursday' },
  { id: 5, name: 'Friday' },
  { id: 6, name: 'Saturday' }
];

export function AdminTimetablePage() {
  const [classes, setClasses] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState('');
  const [batches, setBatches] = useState([]);
  const [selectedBatchId, setSelectedBatchId] = useState('');
  const [timetable, setTimetable] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [dayOfWeek, setDayOfWeek] = useState(1);
  const [subjectId, setSubjectId] = useState('');
  const [teacherId, setTeacherId] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');
  const [room, setRoom] = useState('Room 101');

  const { showToast } = useToast();

  useEffect(() => {
    async function loadMeta() {
      try {
        setLoading(true);
        const [cList, sList, tList] = await Promise.all([
          api.getAdminClasses(),
          api.getAdminSubjects(),
          api.getAdminTeachers()
        ]);
        setClasses(cList || []);
        setSubjects(sList || []);
        setTeachers(tList || []);
        if (cList?.length > 0) {
          setSelectedClassId(cList[0].id);
          const bList = await api.getAdminBatches(cList[0].id);
          setBatches(bList || []);
        }
      } catch (err) {
        showToast(err.message || 'Failed to load metadata', 'error');
      } finally {
        setLoading(false);
      }
    }
    loadMeta();
  }, []);

  const loadTimetable = async () => {
    if (!selectedClassId) return;
    try {
      const entries = await api.getAdminTimetable({
        classId: selectedClassId,
        batchId: selectedBatchId || undefined
      });
      setTimetable(entries || []);
    } catch (err) {
      showToast(err.message || 'Failed to load timetable', 'error');
    }
  };

  useEffect(() => {
    loadTimetable();
  }, [selectedClassId, selectedBatchId]);

  const handleClassChange = async (cid) => {
    setSelectedClassId(cid);
    const bList = await api.getAdminBatches(cid);
    setBatches(bList || []);
    setSelectedBatchId('');
  };

  const handleCreateEntry = async (e) => {
    e.preventDefault();
    try {
      await api.createAdminTimetableEntry({
        class_id: selectedClassId,
        batch_id: selectedBatchId || null,
        subject_id: subjectId || subjects[0]?.id,
        teacher_id: teacherId || teachers[0]?.id,
        day_of_week: Number(dayOfWeek),
        start_time: startTime,
        end_time: endTime,
        room
      });
      showToast('Timetable entry scheduled successfully', 'success');
      setShowAddModal(false);
      loadTimetable();
    } catch (err) {
      showToast(err.message || 'Failed to add timetable entry', 'error');
    }
  };

  const handleDeleteEntry = async (id) => {
    if (!window.confirm('Delete this period from schedule?')) return;
    try {
      await api.deleteAdminTimetableEntry(id);
      showToast('Period removed', 'success');
      loadTimetable();
    } catch (err) {
      showToast(err.message || 'Failed to remove period', 'error');
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.75rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#0F172A', marginBottom: '0.25rem' }}>
            Master Timetable & Period Scheduler
          </h1>
          <p style={{ color: '#64748B', fontSize: '0.875rem' }}>
            Weekly class schedule, subject periods, classroom room assignments, and teacher allocations.
          </p>
        </div>
        <button
          onClick={() => {
            setSubjectId(subjects[0]?.id || '');
            setTeacherId(teachers[0]?.id || '');
            setShowAddModal(true);
          }}
          disabled={!selectedClassId}
          className="btn btn-primary"
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
        >
          <Plus size={16} />
          <span>Add Period / Slot</span>
        </button>
      </div>

      {/* Class & Batch Selectors */}
      <div className="card" style={{ padding: '1rem', marginBottom: '1.5rem', display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#475569' }}>Class:</label>
          <select
            value={selectedClassId}
            onChange={(e) => handleClassChange(e.target.value)}
            className="form-select"
            style={{ fontSize: '0.85rem', padding: '0.4rem 0.8rem' }}
          >
            {classes.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        {batches.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#475569' }}>Batch:</label>
            <select
              value={selectedBatchId}
              onChange={(e) => setSelectedBatchId(e.target.value)}
              className="form-select"
              style={{ fontSize: '0.85rem', padding: '0.4rem 0.8rem' }}
            >
              <option value="">All Batches</option>
              {batches.map(b => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Weekly Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
        {DAYS.map(day => {
          const dayEntries = timetable
            .filter(t => t.day_of_week === day.id)
            .sort((a, b) => a.start_time.localeCompare(b.start_time));

          return (
            <div key={day.id} className="card" style={{ padding: '1rem' }}>
              <div style={{ paddingBottom: '0.5rem', borderBottom: '2px solid #E2E8F0', marginBottom: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#0F172A' }}>{day.name}</h3>
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748B', background: '#F1F5F9', padding: '0.15rem 0.5rem', borderRadius: '4px' }}>
                  {dayEntries.length} periods
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
                        padding: '0.65rem 0.8rem',
                        background: '#F8FAFC',
                        border: '1px solid #E2E8F0',
                        borderRadius: '6px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start'
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 700, color: '#0F172A', fontSize: '0.88rem' }}>
                          {entry.subject_name || 'Subject'}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#2563EB', fontSize: '0.78rem', margin: '0.2rem 0' }}>
                          <Clock size={12} />
                          <span>{entry.start_time.slice(0, 5)} - {entry.end_time.slice(0, 5)}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', color: '#64748B', fontSize: '0.75rem' }}>
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
                      <button
                        onClick={() => handleDeleteEntry(entry.id)}
                        className="btn btn-ghost"
                        style={{ padding: '0.25rem', color: '#EF4444', border: 'none', minWidth: 'auto' }}
                        title="Delete period"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Add Period Modal */}
      {showAddModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '1rem' }}>
          <div className="card" style={{ maxWidth: '460px', width: '100%', padding: '2rem' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>Schedule Period</h3>
            <p style={{ color: '#64748B', fontSize: '0.85rem', marginBottom: '1.5rem' }}>Assign subject, teacher, and timing for this period.</p>
            <form onSubmit={handleCreateEntry}>
              <div className="form-group">
                <label className="form-label">Day of Week</label>
                <select className="form-select" value={dayOfWeek} onChange={(e) => setDayOfWeek(e.target.value)}>
                  {DAYS.map(d => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Subject</label>
                <select className="form-select" value={subjectId} onChange={(e) => setSubjectId(e.target.value)} required>
                  {subjects.map(s => (
                    <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Teacher / Faculty</label>
                <select className="form-select" value={teacherId} onChange={(e) => setTeacherId(e.target.value)} required>
                  {teachers.map(t => (
                    <option key={t.id} value={t.id}>{t.full_name}</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div className="form-group">
                  <label className="form-label">Start Time</label>
                  <input type="time" className="form-input" value={startTime} onChange={(e) => setStartTime(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label className="form-label">End Time</label>
                  <input type="time" className="form-input" value={endTime} onChange={(e) => setEndTime(e.target.value)} required />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Room / Hall</label>
                <input type="text" className="form-input" value={room} onChange={(e) => setRoom(e.target.value)} placeholder="e.g. Lab 2, Hall B" />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
                <button type="button" onClick={() => setShowAddModal(false)} className="btn btn-outline">Cancel</button>
                <button type="submit" className="btn btn-primary">Schedule Period</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
export default AdminTimetablePage;
