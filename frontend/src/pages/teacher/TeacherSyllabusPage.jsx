import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { CheckSquare, Square, BookOpen, Layers, CheckCircle } from 'lucide-react';

export function TeacherSyllabusPage() {
  const [assignments, setAssignments] = useState([]);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [syllabus, setSyllabus] = useState([]);
  const [loading, setLoading] = useState(true);

  const { showToast } = useToast();

  useEffect(() => {
    async function loadMeta() {
      try {
        setLoading(true);
        const list = await api.getTeacherClasses();
        setAssignments(list || []);
        if (list?.length > 0) {
          setSelectedAssignment(list[0]);
        }
      } catch (err) {
        showToast(err.message || 'Failed to load classes', 'error');
      } finally {
        setLoading(false);
      }
    }
    loadMeta();
  }, []);

  const loadSyllabus = async () => {
    if (!selectedAssignment?.subject_id) return;
    try {
      setLoading(true);
      const data = await api.getTeacherSyllabus({
        subjectId: selectedAssignment.subject_id,
        classId: selectedAssignment.class_id
      });
      setSyllabus(data || []);
    } catch (err) {
      showToast(err.message || 'Failed to load syllabus', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSyllabus();
  }, [selectedAssignment]);

  const toggleStatus = async (item) => {
    const nextStatus = item.status === 'completed' ? 'pending' : 'completed';
    try {
      await api.updateTeacherSyllabusTopic(item.id, {
        status: nextStatus,
        completed_at: nextStatus === 'completed' ? new Date().toISOString() : null
      });
      showToast(`Topic marked as ${nextStatus}`, 'success');
      loadSyllabus();
    } catch (err) {
      showToast(err.message || 'Failed to update topic status', 'error');
    }
  };

  const total = syllabus.length;
  const completed = syllabus.filter(s => s.status === 'completed').length;
  const progressPct = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.75rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#0F172A', marginBottom: '0.25rem' }}>
            Curriculum Syllabus Tracking
          </h1>
          <p style={{ color: '#64748B', fontSize: '0.875rem' }}>
            Monitor syllabus progression, chapter completion milestones, and topic schedules.
          </p>
        </div>
      </div>

      {/* Class selector */}
      <div className="card" style={{ padding: '1rem', marginBottom: '1.5rem', display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#475569' }}>Course / Division:</label>
          <select
            value={selectedAssignment?.id || ''}
            onChange={(e) => {
              const found = assignments.find(a => a.id === e.target.value);
              if (found) setSelectedAssignment(found);
            }}
            disabled={assignments.length === 0}
            className="form-select"
            style={{ fontSize: '0.85rem', padding: '0.4rem 0.8rem' }}
          >
            {assignments.length === 0 ? (
              <option value="" disabled>No options</option>
            ) : (
              assignments.map(a => (
                <option key={a.id} value={a.id}>{a.class_name} • {a.subject_name}</option>
              ))
            )}
          </select>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ fontSize: '0.85rem', color: '#64748B' }}>
            Overall Coverage: <strong>{progressPct}%</strong> ({completed}/{total} Topics)
          </div>
          <div style={{ width: 120, height: 8, background: '#E2E8F0', borderRadius: '4px', overflow: 'hidden' }}>
            <div style={{ width: `${progressPct}%`, height: '100%', background: '#2563EB', transition: 'width 0.3s ease' }} />
          </div>
        </div>
      </div>

      {/* Topics list */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#64748B' }}>Loading syllabus plan...</div>
        ) : syllabus.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#64748B' }}>
            No syllabus plan configured for this course yet.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {syllabus.map((item, idx) => {
              const isDone = item.status === 'completed';
              return (
                <div
                  key={item.id}
                  onClick={() => toggleStatus(item)}
                  style={{
                    padding: '1rem 1.25rem',
                    borderBottom: '1px solid #F1F5F9',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    background: isDone ? '#F8FAFC' : '#FFFFFF',
                    transition: 'background 0.15s ease'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                    <div style={{ color: isDone ? '#16A34A' : '#94A3B8' }}>
                      {isDone ? <CheckCircle size={22} style={{ color: '#16A34A' }} /> : <Square size={22} />}
                    </div>
                    <div>
                      <div style={{ fontSize: '0.78rem', color: '#64748B', fontWeight: 600 }}>
                        {item.chapter || `Chapter ${idx + 1}`}
                      </div>
                      <div style={{ fontSize: '0.95rem', fontWeight: 600, color: isDone ? '#475569' : '#0F172A', textDecoration: isDone ? 'line-through' : 'none' }}>
                        {item.topic}
                      </div>
                    </div>
                  </div>

                  <span style={{
                    padding: '0.2rem 0.6rem',
                    borderRadius: '999px',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    background: isDone ? '#DCFCE7' : '#FEF3C7',
                    color: isDone ? '#166534' : '#92400E'
                  }}>
                    {item.status || 'pending'}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
export default TeacherSyllabusPage;
