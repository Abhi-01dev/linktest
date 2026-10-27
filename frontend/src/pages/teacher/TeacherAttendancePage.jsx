import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { ClipboardCheck, Calendar, Check, Clock, X, Save, Users } from 'lucide-react';

export function TeacherAttendancePage() {
  const [assignments, setAssignments] = useState([]);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [students, setStudents] = useState([]);
  const [attendanceMap, setAttendanceMap] = useState({}); // { [studentId]: { status: 'present', remarks: '' } }
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

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
        showToast(err.message || 'Failed to load teacher classes', 'error');
      } finally {
        setLoading(false);
      }
    }
    loadMeta();
  }, []);

  const loadStudentsAndRecords = async () => {
    if (!selectedAssignment?.class_id) return;
    try {
      setLoading(true);
      const [sList, existingRecords] = await Promise.all([
        api.getTeacherStudents({
          classId: selectedAssignment.class_id,
          batchId: selectedAssignment.batch_id || undefined
        }),
        api.getTeacherAttendance({
          classId: selectedAssignment.class_id,
          batchId: selectedAssignment.batch_id || undefined,
          subjectId: selectedAssignment.subject_id,
          date
        })
      ]);

      setStudents(sList || []);

      // Build map
      const initialMap = {};
      (sList || []).forEach(s => {
        const existing = (existingRecords || []).find(r => r.student_id === s.id);
        initialMap[s.id] = {
          status: existing ? existing.status : 'present',
          remarks: existing ? existing.remarks || '' : ''
        };
      });
      setAttendanceMap(initialMap);
    } catch (err) {
      showToast(err.message || 'Failed to load roll call roster', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStudentsAndRecords();
  }, [selectedAssignment, date]);

  const setStudentStatus = (studentId, status) => {
    setAttendanceMap(prev => ({
      ...prev,
      [studentId]: { ...prev[studentId], status }
    }));
  };

  const setStudentRemarks = (studentId, remarks) => {
    setAttendanceMap(prev => ({
      ...prev,
      [studentId]: { ...prev[studentId], remarks }
    }));
  };

  const markAll = (status) => {
    const updated = {};
    students.forEach(s => {
      updated[s.id] = {
        ...attendanceMap[s.id],
        status
      };
    });
    setAttendanceMap(updated);
    showToast(`Marked all students as ${status}`, 'info');
  };

  const handleSave = async () => {
    if (!selectedAssignment?.batch_id || !selectedAssignment.subject_id) {
      showToast('Select an assigned batch and subject before saving attendance', 'error');
      return;
    }

    setSaving(true);
    try {
      const records = students.map(s => ({
        student_id: s.id,
        status: attendanceMap[s.id]?.status || 'present',
        remarks: attendanceMap[s.id]?.remarks || ''
      }));

      await api.markTeacherAttendance({
        batch_id: selectedAssignment.batch_id,
        date,
        subject_id: selectedAssignment.subject_id,
        records
      });
      showToast('Attendance saved successfully!', 'success');
    } catch (err) {
      showToast(err.message || 'Failed to save attendance', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.75rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#0F172A', marginBottom: '0.25rem' }}>
            Daily Roll-Call Attendance
          </h1>
          <p style={{ color: '#64748B', fontSize: '0.875rem' }}>
            Record live classroom attendance, track tardiness, and submit verified roll call.
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving || students.length === 0}
          className="btn btn-primary"
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
        >
          <Save size={16} />
          <span>{saving ? 'Saving...' : 'Save Attendance'}</span>
        </button>
      </div>

      {/* Control bar */}
      <div className="card" style={{ padding: '1rem', marginBottom: '1.5rem', display: 'flex', gap: '1.25rem', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#475569' }}>Class & Subject:</label>
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
                  <option key={a.id} value={a.id}>
                    {a.batch_name ? `${a.batch_name} (${a.class_name}) • ${a.subject_name}` : `${a.class_name} • ${a.subject_name}`}
                  </option>
                ))
              )}
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#475569' }}>Date:</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="form-input"
              style={{ fontSize: '0.85rem', padding: '0.4rem 0.8rem', width: 'auto' }}
            />
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            onClick={() => markAll('present')}
            type="button"
            className="btn btn-outline btn-sm"
            style={{ fontSize: '0.78rem', color: '#16A34A', borderColor: '#BBF7D0' }}
          >
            Mark All Present
          </button>
          <button
            onClick={() => markAll('absent')}
            type="button"
            className="btn btn-outline btn-sm"
            style={{ fontSize: '0.78rem', color: '#DC2626', borderColor: '#FCA5A5' }}
          >
            Mark All Absent
          </button>
        </div>
      </div>

      {/* Roster table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#64748B' }}>Loading student roll call...</div>
        ) : students.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#64748B' }}>No students enrolled in this class.</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#475569', fontWeight: 600 }}>
                <th style={{ padding: '0.85rem 1.25rem' }}>#</th>
                <th style={{ padding: '0.85rem 1.25rem' }}>Student Name</th>
                <th style={{ padding: '0.85rem 1.25rem' }}>Roll Call Status</th>
                <th style={{ padding: '0.85rem 1.25rem' }}>Remarks (Optional)</th>
              </tr>
            </thead>
            <tbody>
              {students.map((student, idx) => {
                const currentStatus = attendanceMap[student.id]?.status || 'present';
                return (
                  <tr key={student.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                    <td style={{ padding: '0.85rem 1.25rem', color: '#94A3B8', fontSize: '0.8rem' }}>
                      {idx + 1}
                    </td>
                    <td style={{ padding: '0.85rem 1.25rem', fontWeight: 600, color: '#0F172A' }}>
                      <div>{student.full_name}</div>
                      <div style={{ fontSize: '0.75rem', color: '#64748B' }}>{student.email}</div>
                    </td>
                    <td style={{ padding: '0.85rem 1.25rem' }}>
                      <div style={{ display: 'inline-flex', borderRadius: '6px', overflow: 'hidden', border: '1px solid #E2E8F0' }}>
                        <button
                          type="button"
                          onClick={() => setStudentStatus(student.id, 'present')}
                          style={{
                            padding: '0.35rem 0.75rem',
                            border: 'none',
                            fontSize: '0.78rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.25rem',
                            background: currentStatus === 'present' ? '#16A34A' : '#FFFFFF',
                            color: currentStatus === 'present' ? '#FFFFFF' : '#64748B'
                          }}
                        >
                          <Check size={12} />
                          <span>Present</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setStudentStatus(student.id, 'late')}
                          style={{
                            padding: '0.35rem 0.75rem',
                            border: 'none',
                            borderLeft: '1px solid #E2E8F0',
                            borderRight: '1px solid #E2E8F0',
                            fontSize: '0.78rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.25rem',
                            background: currentStatus === 'late' ? '#D97706' : '#FFFFFF',
                            color: currentStatus === 'late' ? '#FFFFFF' : '#64748B'
                          }}
                        >
                          <Clock size={12} />
                          <span>Late</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setStudentStatus(student.id, 'absent')}
                          style={{
                            padding: '0.35rem 0.75rem',
                            border: 'none',
                            fontSize: '0.78rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.25rem',
                            background: currentStatus === 'absent' ? '#DC2626' : '#FFFFFF',
                            color: currentStatus === 'absent' ? '#FFFFFF' : '#64748B'
                          }}
                        >
                          <X size={12} />
                          <span>Absent</span>
                        </button>
                      </div>
                    </td>
                    <td style={{ padding: '0.85rem 1.25rem' }}>
                      <input
                        type="text"
                        placeholder="e.g. Excused, medical leave..."
                        value={attendanceMap[student.id]?.remarks || ''}
                        onChange={(e) => setStudentRemarks(student.id, e.target.value)}
                        className="form-input"
                        style={{ fontSize: '0.8rem', padding: '0.3rem 0.6rem', maxWidth: '260px' }}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
export default TeacherAttendancePage;
