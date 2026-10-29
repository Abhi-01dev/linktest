import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import {
  ClipboardCheck,
  Calendar,
  Check,
  Clock,
  X,
  Save,
  Users,
  AlertCircle,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  HelpCircle
} from 'lucide-react';

export function TeacherAttendancePage() {
  const [assignments, setAssignments] = useState([]);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [students, setStudents] = useState([]);
  const [attendanceMap, setAttendanceMap] = useState({}); // { [studentId]: { status: 'present'|'absent'|'late'|null, remarks: '' } }
  const [isDateRecorded, setIsDateRecorded] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  const { showToast } = useToast();

  useEffect(() => {
    async function loadMeta() {
      try {
        setLoading(true);
        setError(null);
        const list = await api.getTeacherClasses();
        setAssignments(list || []);
        if (list?.length > 0) {
          setSelectedAssignment(list[0]);
        }
      } catch (err) {
        setError(err.message || 'Failed to load teacher classes');
        showToast(err.message || 'Failed to load teacher classes', 'error');
      } finally {
        setLoading(false);
      }
    }
    loadMeta();
  }, []);

  const loadStudentsAndRecords = async () => {
    if (!selectedAssignment) return;
    const targetClassId = selectedAssignment.class_id;
    const targetBatchId = selectedAssignment.batch_id;
    if (!targetClassId && !targetBatchId) return;

    try {
      setLoading(true);
      setError(null);

      let sList = [];
      let existingRecords = [];

      try {
        const results = await Promise.all([
          api.getTeacherStudents({
            classId: targetClassId || undefined,
            batchId: targetBatchId || undefined
          }),
          api.getTeacherAttendance({
            classId: targetClassId || undefined,
            batchId: targetBatchId || undefined,
            subjectId: selectedAssignment.subject_id || undefined,
            date
          })
        ]);
        sList = results[0] || [];
        existingRecords = results[1] || [];
      } catch (fetchErr) {
        // Fallback: If api.getTeacherStudents had an issue, check if assignment already has embedded student list
        if (selectedAssignment.students?.length > 0) {
          sList = selectedAssignment.students;
        } else {
          throw fetchErr;
        }
      }

      // If sList is empty but selectedAssignment has embedded students, use fallback
      let resolvedStudents = (sList && sList.length > 0) ? sList : (selectedAssignment.students || []);
      resolvedStudents = resolvedStudents.map(s => ({
        ...s,
        id: s.id || s.student_id,
        enrollment_number: s.enrollment_number || s.enrollmentNumber || null
      }));

      setStudents(resolvedStudents);

      const hasRecorded = Array.isArray(existingRecords) && existingRecords.length > 0;
      setIsDateRecorded(hasRecorded);

      // Build map - do NOT force unmarked dates to "present"
      const initialMap = {};
      resolvedStudents.forEach(s => {
        const studentId = s.id;
        const existing = (existingRecords || []).find(r => r.student_id === studentId);
        initialMap[studentId] = {
          status: existing ? existing.status : (hasRecorded ? 'absent' : null),
          remarks: existing ? existing.remarks || '' : ''
        };
      });
      setAttendanceMap(initialMap);
    } catch (err) {
      console.error('Failed to load roll call roster:', err);
      setError(err.message || 'Failed to load roll call roster');
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

  // Status stats
  const presentCount = students.filter(s => attendanceMap[s.id]?.status === 'present').length;
  const lateCount = students.filter(s => attendanceMap[s.id]?.status === 'late').length;
  const absentCount = students.filter(s => attendanceMap[s.id]?.status === 'absent').length;
  const unmarkedCount = students.filter(s => !attendanceMap[s.id]?.status).length;

  const handleSave = async () => {
    if (!selectedAssignment?.batch_id && !selectedAssignment?.class_id) {
      showToast('Select an assigned class or batch before saving attendance', 'error');
      return;
    }

    if (students.length === 0) {
      showToast('No students to record attendance for', 'warning');
      return;
    }

    if (unmarkedCount > 0) {
      showToast(`Please mark status for all students (${unmarkedCount} unmarked) or click "Mark All Present"`, 'warning');
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
        batch_id: selectedAssignment.batch_id || selectedAssignment.class_id,
        date,
        subject_id: selectedAssignment.subject_id || undefined,
        records
      });
      showToast('Attendance saved successfully!', 'success');
      await loadStudentsAndRecords();
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
            Record live classroom attendance, track tardiness, and submit verified roll call for each batch.
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
      <div className="card" style={{ padding: '1.25rem', marginBottom: '1.5rem', display: 'flex', gap: '1.25rem', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#475569' }}>Batch & Subject:</label>
            <select
              value={selectedAssignment?.id || ''}
              onChange={(e) => {
                const found = assignments.find(a => a.id === e.target.value);
                if (found) setSelectedAssignment(found);
              }}
              disabled={assignments.length === 0}
              className="form-select"
              style={{ fontSize: '0.85rem', padding: '0.45rem 0.85rem' }}
            >
              {assignments.length === 0 ? (
                <option value="" disabled>No options</option>
              ) : (
                assignments.map(a => (
                  <option key={a.id} value={a.id}>
                    {a.batch_name ? `${a.batch_name} (${a.class_name}) • ${a.subject_name || 'Class Attendance'}` : `${a.class_name} • ${a.subject_name || 'Class Attendance'}`}
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
              style={{ fontSize: '0.85rem', padding: '0.45rem 0.85rem', width: 'auto' }}
            />
          </div>

          {/* Record Status Badge */}
          <div>
            {isDateRecorded ? (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', padding: '0.25rem 0.65rem', borderRadius: '9999px', background: '#DCFCE7', color: '#166534', fontSize: '0.78rem', fontWeight: 600 }}>
                <CheckCircle2 size={13} />
                <span>Attendance Recorded</span>
              </span>
            ) : (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', padding: '0.25rem 0.65rem', borderRadius: '9999px', background: '#FEF3C7', color: '#92400E', fontSize: '0.78rem', fontWeight: 600 }}>
                <AlertTriangle size={13} />
                <span>Not Marked Yet</span>
              </span>
            )}
          </div>
        </div>

        {/* Quick actions */}
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <button
            onClick={() => markAll('present')}
            type="button"
            className="btn btn-outline btn-sm"
            style={{ fontSize: '0.78rem', color: '#16A34A', borderColor: '#BBF7D0', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}
          >
            <Check size={13} />
            <span>Mark All Present</span>
          </button>
          <button
            onClick={() => markAll('absent')}
            type="button"
            className="btn btn-outline btn-sm"
            style={{ fontSize: '0.78rem', color: '#DC2626', borderColor: '#FCA5A5', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}
          >
            <X size={13} />
            <span>Mark All Absent</span>
          </button>
        </div>
      </div>

      {/* Summary Pills */}
      {students.length > 0 && !loading && (
        <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
          <div style={{ padding: '0.45rem 0.85rem', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '8px', fontSize: '0.8rem', color: '#475569' }}>
            Total: <strong>{students.length}</strong>
          </div>
          <div style={{ padding: '0.45rem 0.85rem', background: '#DCFCE7', border: '1px solid #BBF7D0', borderRadius: '8px', fontSize: '0.8rem', color: '#166534' }}>
            Present: <strong>{presentCount}</strong>
          </div>
          <div style={{ padding: '0.45rem 0.85rem', background: '#FEF3C7', border: '1px solid #FDE68A', borderRadius: '8px', fontSize: '0.8rem', color: '#92400E' }}>
            Late: <strong>{lateCount}</strong>
          </div>
          <div style={{ padding: '0.45rem 0.85rem', background: '#FEE2E2', border: '1px solid #FECACA', borderRadius: '8px', fontSize: '0.8rem', color: '#991B1B' }}>
            Absent: <strong>{absentCount}</strong>
          </div>
          {unmarkedCount > 0 && (
            <div style={{ padding: '0.45rem 0.85rem', background: '#F1F5F9', border: '1px dashed #94A3B8', borderRadius: '8px', fontSize: '0.8rem', color: '#475569', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
              <HelpCircle size={13} />
              <span>Unmarked: <strong>{unmarkedCount}</strong></span>
            </div>
          )}
        </div>
      )}

      {/* Roster table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '3.5rem 1rem', textAlign: 'center', color: '#64748B' }}>
            <div style={{ width: 28, height: 28, border: '3px solid #E2E8F0', borderTopColor: '#2563EB', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 0.75rem' }} />
            <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>Loading student roll call roster...</span>
          </div>
        ) : error ? (
          <div style={{ padding: '3rem 1.5rem', textAlign: 'center' }}>
            <AlertCircle size={36} style={{ color: '#EF4444', margin: '0 auto 0.75rem' }} />
            <p style={{ color: '#DC2626', fontWeight: 600, fontSize: '0.95rem', marginBottom: '0.25rem' }}>{error}</p>
            <p style={{ color: '#64748B', fontSize: '0.85rem', marginBottom: '1rem' }}>We were unable to load the roll call roster for this selection.</p>
            <button
              onClick={loadStudentsAndRecords}
              className="btn btn-outline btn-sm"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', margin: '0 auto' }}
            >
              <RotateCcw size={14} />
              <span>Retry Loading Roster</span>
            </button>
          </div>
        ) : students.length === 0 ? (
          <div style={{ padding: '3.5rem 1.5rem', textAlign: 'center', color: '#64748B' }}>
            <Users size={36} style={{ margin: '0 auto 0.75rem', opacity: 0.35, color: '#475569' }} />
            <p style={{ margin: 0, fontWeight: 600, color: '#334155', fontSize: '0.95rem' }}>No students enrolled in this class or batch.</p>
            <p style={{ fontSize: '0.825rem', color: '#94A3B8', marginTop: '0.35rem', maxWidth: '360px', marginInline: 'auto' }}>
              Enrolled students in this batch will automatically appear in roll call.
            </p>
          </div>
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
                const currentStatus = attendanceMap[student.id]?.status;
                return (
                  <tr key={student.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                    <td style={{ padding: '0.85rem 1.25rem', color: '#94A3B8', fontSize: '0.8rem' }}>
                      {idx + 1}
                    </td>
                    <td style={{ padding: '0.85rem 1.25rem', fontWeight: 600, color: '#0F172A' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <span>{student.full_name}</span>
                        {student.enrollment_number && (
                          <span style={{ fontSize: '0.72rem', background: '#F1F5F9', color: '#475569', padding: '0.1rem 0.45rem', borderRadius: '4px', fontWeight: 500 }}>
                            {student.enrollment_number}
                          </span>
                        )}
                      </div>
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
                      {!currentStatus && (
                        <span style={{ marginLeft: '0.5rem', fontSize: '0.75rem', color: '#94A3B8', fontStyle: 'italic' }}>
                          (Unmarked)
                        </span>
                      )}
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