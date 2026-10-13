import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import {
  Users,
  Search,
  UserPlus,
  Filter,
  Download,
  CheckCircle,
  XCircle,
  MoreVertical,
  ShieldAlert,
  GraduationCap
} from 'lucide-react';

export function AdminStudentsPage() {
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [classFilter, setClassFilter] = useState('ALL');
  const [showEnrollModal, setShowEnrollModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [enrollClassId, setEnrollClassId] = useState('');
  const [enrollBatchId, setEnrollBatchId] = useState('');
  const [batches, setBatches] = useState([]);

  const { showToast } = useToast();

  const loadData = async () => {
    try {
      setLoading(true);
      const [studentsData, classesData] = await Promise.all([
        api.getAdminStudents(),
        api.getAdminClasses()
      ]);
      setStudents(studentsData || []);
      setClasses(classesData || []);
    } catch (err) {
      showToast(err.message || 'Failed to load students data', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleStatusToggle = async (student) => {
    const newStatus = student.status === 'active' ? 'suspended' : 'active';
    try {
      await api.updateUserStatus(student.id, newStatus);
      showToast(`Student account marked as ${newStatus}`, 'success');
      setStudents(students.map(s => s.id === student.id ? { ...s, status: newStatus } : s));
    } catch (err) {
      showToast(err.message || 'Failed to update student status', 'error');
    }
  };

  const handleOpenEnrollModal = async (student) => {
    setSelectedStudent(student);
    setEnrollClassId(classes[0]?.id || '');
    if (classes[0]?.id) {
      const bList = await api.getAdminBatches(classes[0].id);
      setBatches(bList || []);
      setEnrollBatchId(bList[0]?.id || '');
    }
    setShowEnrollModal(true);
  };

  const handleClassChangeInModal = async (cid) => {
    setEnrollClassId(cid);
    const bList = await api.getAdminBatches(cid);
    setBatches(bList || []);
    setEnrollBatchId(bList[0]?.id || '');
  };

  const handleEnrollSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.enrollStudent({
        student_id: selectedStudent.id,
        class_id: enrollClassId,
        batch_id: enrollBatchId || null
      });
      showToast(`Enrolled ${selectedStudent.full_name} successfully`, 'success');
      setShowEnrollModal(false);
      loadData();
    } catch (err) {
      showToast(err.message || 'Failed to enroll student', 'error');
    }
  };

  const exportCSV = () => {
    const headers = ['ID', 'Full Name', 'Email', 'Role', 'Status', 'Class', 'Created At'];
    const rows = filteredStudents.map(s => [
      s.id,
      `"${s.full_name}"`,
      s.email,
      s.role,
      s.status,
      `"${s.class_name || 'Unassigned'}"`,
      s.created_at
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `linktest_students_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredStudents = students.filter(s => {
    const matchesSearch = s.full_name?.toLowerCase().includes(search.toLowerCase()) ||
                          s.email?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || s.status === statusFilter;
    const matchesClass = classFilter === 'ALL' || s.class_id === classFilter;
    return matchesSearch && matchesStatus && matchesClass;
  });

  return (
    <div>
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.75rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#0F172A', marginBottom: '0.25rem' }}>
            Student Admissions & Directory
          </h1>
          <p style={{ color: '#64748B', fontSize: '0.875rem' }}>
            Manage registered student learners, class enrollments, and access status.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button onClick={exportCSV} className="btn btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Download size={16} />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="card" style={{ padding: '1rem', marginBottom: '1.5rem', display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1, minWidth: '260px' }}>
          <Search size={18} style={{ color: '#94A3B8' }} />
          <input
            type="text"
            placeholder="Search by student name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: '100%', border: 'none', outline: 'none', fontSize: '0.875rem', background: 'transparent' }}
          />
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="form-select"
            style={{ fontSize: '0.85rem', padding: '0.4rem 0.8rem' }}
          >
            <option value="ALL">All Statuses</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
          </select>

          <select
            value={classFilter}
            onChange={(e) => setClassFilter(e.target.value)}
            className="form-select"
            style={{ fontSize: '0.85rem', padding: '0.4rem 0.8rem' }}
          >
            <option value="ALL">All Classes</option>
            {classes.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Students Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#64748B' }}>Loading student records...</div>
        ) : filteredStudents.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#64748B' }}>No students found matching your filters.</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#475569', fontWeight: 600 }}>
                  <th style={{ padding: '0.85rem 1.25rem' }}>Student Name</th>
                  <th style={{ padding: '0.85rem 1.25rem' }}>Email Address</th>
                  <th style={{ padding: '0.85rem 1.25rem' }}>Enrolled Class</th>
                  <th style={{ padding: '0.85rem 1.25rem' }}>Status</th>
                  <th style={{ padding: '0.85rem 1.25rem' }}>Joined Date</th>
                  <th style={{ padding: '0.85rem 1.25rem', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.map((student) => (
                  <tr key={student.id} style={{ borderBottom: '1px solid #F1F5F9', transition: 'background 0.15s ease' }}>
                    <td style={{ padding: '0.85rem 1.25rem', fontWeight: 600, color: '#0F172A' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                        <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(37, 99, 235, 0.1)', color: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.8rem' }}>
                          {student.full_name?.charAt(0)}
                        </div>
                        <div>
                          <div>{student.full_name}</div>
                          <div style={{ fontSize: '0.75rem', color: '#64748B' }}>ID: {student.id.slice(0, 8)}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '0.85rem 1.25rem', color: '#475569' }}>{student.email}</td>
                    <td style={{ padding: '0.85rem 1.25rem' }}>
                      {student.class_name ? (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', padding: '0.2rem 0.6rem', background: '#EFF6FF', color: '#1D4ED8', borderRadius: '4px', fontSize: '0.78rem', fontWeight: 600 }}>
                          <GraduationCap size={13} />
                          {student.class_name} {student.batch_name ? `(${student.batch_name})` : ''}
                        </span>
                      ) : (
                        <span style={{ color: '#94A3B8', fontSize: '0.8rem', fontStyle: 'italic' }}>Unassigned</span>
                      )}
                    </td>
                    <td style={{ padding: '0.85rem 1.25rem' }}>
                      <span style={{
                        padding: '0.25rem 0.65rem',
                        borderRadius: '999px',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        background: student.status === 'active' ? '#DCFCE7' : '#FEE2E2',
                        color: student.status === 'active' ? '#166534' : '#991B1B'
                      }}>
                        {student.status || 'active'}
                      </span>
                    </td>
                    <td style={{ padding: '0.85rem 1.25rem', color: '#64748B', fontSize: '0.8rem' }}>
                      {new Date(student.created_at).toLocaleDateString()}
                    </td>
                    <td style={{ padding: '0.85rem 1.25rem', textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                        <button
                          onClick={() => handleOpenEnrollModal(student)}
                          className="btn btn-sm btn-outline"
                          style={{ fontSize: '0.78rem', padding: '0.3rem 0.6rem' }}
                        >
                          Enroll
                        </button>
                        <button
                          onClick={() => handleStatusToggle(student)}
                          className={`btn btn-sm ${student.status === 'active' ? 'btn-ghost' : 'btn-primary'}`}
                          style={{ fontSize: '0.78rem', padding: '0.3rem 0.6rem', color: student.status === 'active' ? '#DC2626' : undefined }}
                        >
                          {student.status === 'active' ? 'Suspend' : 'Activate'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Class Enrollment Modal */}
      {showEnrollModal && selectedStudent && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '1rem' }}>
          <div className="card" style={{ maxWidth: '440px', width: '100%', padding: '2rem' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>
              Assign Class Enrollment
            </h3>
            <p style={{ color: '#64748B', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
              Select a class and batch for <strong>{selectedStudent.full_name}</strong>.
            </p>

            <form onSubmit={handleEnrollSubmit}>
              <div className="form-group">
                <label className="form-label">Class</label>
                <select
                  className="form-select"
                  value={enrollClassId}
                  onChange={(e) => handleClassChangeInModal(e.target.value)}
                  required
                >
                  {classes.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              {batches.length > 0 && (
                <div className="form-group">
                  <label className="form-label">Batch / Section</label>
                  <select
                    className="form-select"
                    value={enrollBatchId}
                    onChange={(e) => setEnrollBatchId(e.target.value)}
                  >
                    <option value="">No specific batch</option>
                    {batches.map(b => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>
              )}

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1.75rem' }}>
                <button type="button" onClick={() => setShowEnrollModal(false)} className="btn btn-outline">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save Enrollment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
export default AdminStudentsPage;
