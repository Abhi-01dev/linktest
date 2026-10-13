import React, { useState, useEffect, useMemo, useRef } from 'react';
import { api } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import {
  Users,
  School,
  BookMarked,
  Search,
  GraduationCap,
  Layers,
  UserPlus,
  BookOpen,
  Calendar,
  X,
  AlertCircle,
  CheckCircle,
  Plus,
  Trash2
} from 'lucide-react';

export function TeacherClassesPage() {
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState('batches'); // 'batches' | 'classes'

  // Teacher's Assigned Batches State
  const [assignedBatches, setAssignedBatches] = useState([]);
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [batchStudents, setBatchStudents] = useState([]);
  const [loadingBatches, setLoadingBatches] = useState(true);
  const [loadingBatchStudents, setLoadingBatchStudents] = useState(false);
  const [batchStudentSearch, setBatchStudentSearch] = useState('');

  // Add Students DB Search Modal State
  const [showAddStudentsModal, setShowAddStudentsModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [selectedStudentIds, setSelectedStudentIds] = useState(new Set());
  const [submittingEnroll, setSubmittingEnroll] = useState(false);
  const searchDebounceRef = useRef(null);

  // Legacy Academic Classes State
  const [assignments, setAssignments] = useState([]);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [classStudents, setClassStudents] = useState([]);
  const [loadingClasses, setLoadingClasses] = useState(false);
  const [classSearch, setClassSearch] = useState('');

  // 1. Load Teacher's Assigned Batches
  const loadAssignedBatches = async () => {
    try {
      setLoadingBatches(true);
      const bList = await api.getBatches();
      const list = Array.isArray(bList) ? bList : [];
      setAssignedBatches(list);
      if (list.length > 0 && !selectedBatch) {
        setSelectedBatch(list[0]);
      } else if (selectedBatch) {
        const refreshed = list.find((b) => b.id === selectedBatch.id);
        if (refreshed) setSelectedBatch(refreshed);
      }
    } catch (err) {
      showToast(err.message || 'Failed to load assigned batches', 'error');
    } finally {
      setLoadingBatches(false);
    }
  };

  // 2. Load Legacy Academic Classes
  const loadTeacherClasses = async () => {
    try {
      setLoadingClasses(true);
      const list = await api.getTeacherClasses();
      setAssignments(Array.isArray(list) ? list : []);
      if (list?.length > 0 && !selectedAssignment) {
        setSelectedAssignment(list[0]);
      }
    } catch (err) {
      showToast(err.message || 'Failed to load academic class divisions', 'error');
    } finally {
      setLoadingClasses(false);
    }
  };

  useEffect(() => {
    loadAssignedBatches();
    loadTeacherClasses();
  }, []);

  // Load students when selectedBatch changes
  useEffect(() => {
    if (!selectedBatch) return;
    async function loadStudents() {
      try {
        setLoadingBatchStudents(true);
        const sList = await api.getBatchStudents(selectedBatch.id);
        setBatchStudents(Array.isArray(sList) ? sList : []);
      } catch (err) {
        showToast(err.message || 'Failed to load batch students', 'error');
      } finally {
        setLoadingBatchStudents(false);
      }
    }
    loadStudents();
  }, [selectedBatch?.id]);

  // Load legacy class students
  useEffect(() => {
    if (!selectedAssignment?.class_id) return;
    async function loadStudents() {
      try {
        const sList = await api.getTeacherStudents({
          classId: selectedAssignment.class_id,
          batchId: selectedAssignment.batch_id || undefined
        });
        setClassStudents(Array.isArray(sList) ? sList : []);
      } catch (err) {
        showToast(err.message || 'Failed to load class roster', 'error');
      }
    }
    loadStudents();
  }, [selectedAssignment]);

  // Live Debounced Database Search for Students
  useEffect(() => {
    if (!showAddStudentsModal) return;
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);

    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    searchDebounceRef.current = setTimeout(async () => {
      try {
        setSearching(true);
        const res = await api.searchStudents({ query: searchQuery.trim(), limit: 15 });
        setSearchResults(res?.students || []);
      } catch (err) {
        showToast(err.message || 'Error searching student database', 'error');
      } finally {
        setSearching(false);
      }
    }, 300);

    return () => {
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    };
  }, [searchQuery, showAddStudentsModal]);

  const toggleStudentSelection = (studentId) => {
    setSelectedStudentIds((prev) => {
      const next = new Set(prev);
      if (next.has(studentId)) {
        next.delete(studentId);
      } else {
        next.add(studentId);
      }
      return next;
    });
  };

  const handleOpenAddStudents = () => {
    setSearchQuery('');
    setSearchResults([]);
    setSelectedStudentIds(new Set());
    setShowAddStudentsModal(true);
  };

  const handleEnrollSelected = async () => {
    if (selectedStudentIds.size === 0 || !selectedBatch) return;

    try {
      setSubmittingEnroll(true);
      const res = await api.enrollStudentsInBatch(selectedBatch.id, Array.from(selectedStudentIds));
      showToast(`Enrolled ${res.enrolled_count || selectedStudentIds.size} student(s) into ${selectedBatch.name}`, 'success');
      setShowAddStudentsModal(false);
      setSelectedStudentIds(new Set());
      setSearchQuery('');
      setSearchResults([]);
      // Reload batch roster
      const updated = await api.getBatchStudents(selectedBatch.id);
      setBatchStudents(Array.isArray(updated) ? updated : []);
      loadAssignedBatches();
    } catch (err) {
      showToast(err.message || 'Failed to enroll students', 'error');
    } finally {
      setSubmittingEnroll(false);
    }
  };

  const handleRemoveStudentFromBatch = async (studentId) => {
    if (!selectedBatch) return;
    try {
      await api.removeStudentFromBatch(selectedBatch.id, studentId);
      showToast('Student removed from batch', 'success');
      const updated = await api.getBatchStudents(selectedBatch.id);
      setBatchStudents(Array.isArray(updated) ? updated : []);
      loadAssignedBatches();
    } catch (err) {
      showToast(err.message || 'Failed to remove student', 'error');
    }
  };

  const filteredBatchStudents = batchStudents.filter(
    (s) =>
      !batchStudentSearch ||
      s.full_name?.toLowerCase().includes(batchStudentSearch.toLowerCase()) ||
      s.email?.toLowerCase().includes(batchStudentSearch.toLowerCase())
  );

  const filteredClassStudents = classStudents.filter(
    (s) =>
      !classSearch ||
      s.full_name?.toLowerCase().includes(classSearch.toLowerCase()) ||
      s.email?.toLowerCase().includes(classSearch.toLowerCase())
  );

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
      {/* Page Header */}
      <div style={{ marginBottom: '1.75rem' }}>
        <h1 style={{ fontSize: '1.85rem', fontWeight: 800, color: '#0F172A', marginBottom: '0.25rem' }}>
          My Assigned Cohorts & Student Rosters
        </h1>
        <p style={{ color: '#64748B', fontSize: '0.88rem' }}>
          Manage your assigned batches, search real database student accounts, and enroll learners.
        </p>
      </div>

      {/* Tabs Header */}
      <div
        style={{
          display: 'flex',
          gap: '0.5rem',
          borderBottom: '1px solid #E2E8F0',
          marginBottom: '1.75rem'
        }}
      >
        <button
          onClick={() => setActiveTab('batches')}
          style={{
            padding: '0.75rem 1.25rem',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'batches' ? '2px solid #2563EB' : '2px solid transparent',
            color: activeTab === 'batches' ? '#2563EB' : '#64748B',
            fontWeight: activeTab === 'batches' ? 700 : 500,
            fontSize: '0.92rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          <Layers size={18} />
          <span>Assigned Batches ({assignedBatches.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('classes')}
          style={{
            padding: '0.75rem 1.25rem',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'classes' ? '2px solid #2563EB' : '2px solid transparent',
            color: activeTab === 'classes' ? '#2563EB' : '#64748B',
            fontWeight: activeTab === 'classes' ? 700 : 500,
            fontSize: '0.92rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          <School size={18} />
          <span>Academic Divisions ({assignments.length})</span>
        </button>
      </div>

      {/* TAB 1: ASSIGNED BATCHES */}
      {activeTab === 'batches' && (
        <div>
          {loadingBatches ? (
            <div style={{ padding: '4rem 2rem', textAlign: 'center', color: '#64748B' }}>
              Loading assigned batches...
            </div>
          ) : assignedBatches.length === 0 ? (
            <div
              className="card"
              style={{
                padding: '4rem 2rem',
                textAlign: 'center',
                background: '#FFFFFF',
                border: '2px dashed #E2E8F0',
                borderRadius: '16px'
              }}
            >
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: '50%',
                  background: '#F1F5F9',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 1rem',
                  color: '#94A3B8'
                }}
              >
                <Layers size={28} />
              </div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#0F172A', marginBottom: '0.5rem' }}>
                No Batches Assigned Yet
              </h3>
              <p style={{ color: '#64748B', fontSize: '0.88rem', maxWidth: '420px', margin: '0 auto' }}>
                You have not been allocated to any cohort batches by an Administrator. Once assigned, your batches and student rosters will appear here.
              </p>
            </div>
          ) : (
            <div>
              {/* Batch Selector Pills */}
              <div
                style={{
                  display: 'flex',
                  gap: '0.75rem',
                  overflowX: 'auto',
                  paddingBottom: '0.75rem',
                  marginBottom: '1.5rem'
                }}
              >
                {assignedBatches.map((b) => (
                  <button
                    key={b.id}
                    onClick={() => setSelectedBatch(b)}
                    className={`btn ${selectedBatch?.id === b.id ? 'btn-primary' : 'btn-outline'}`}
                    style={{
                      padding: '0.65rem 1.15rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.6rem',
                      fontSize: '0.86rem',
                      whiteSpace: 'nowrap',
                      borderRadius: '10px'
                    }}
                  >
                    <Layers size={16} />
                    <span>{b.name}</span>
                    <span
                      style={{
                        padding: '0.1rem 0.45rem',
                        background: selectedBatch?.id === b.id ? 'rgba(255,255,255,0.25)' : '#F1F5F9',
                        borderRadius: '999px',
                        fontSize: '0.75rem',
                        fontWeight: 700
                      }}
                    >
                      {b.enrolled_count || 0}/{b.capacity || 40}
                    </span>
                  </button>
                ))}
              </div>

              {selectedBatch && (
                <div>
                  {/* Selected Batch Summary Banner */}
                  <div
                    className="card"
                    style={{
                      padding: '1.5rem',
                      marginBottom: '1.5rem',
                      background: '#FFFFFF',
                      border: '1px solid #E2E8F0',
                      borderRadius: '14px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: '1rem'
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                        <span
                          style={{
                            fontFamily: 'monospace',
                            fontSize: '0.76rem',
                            fontWeight: 700,
                            padding: '0.15rem 0.5rem',
                            background: '#F1F5F9',
                            borderRadius: '4px',
                            color: '#334155'
                          }}
                        >
                          {selectedBatch.code}
                        </span>
                        <span
                          style={{
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            padding: '0.15rem 0.55rem',
                            borderRadius: '999px',
                            background: selectedBatch.status === 'Active' ? '#DCFCE7' : '#F1F5F9',
                            color: selectedBatch.status === 'Active' ? '#166534' : '#475569'
                          }}
                        >
                          {selectedBatch.status}
                        </span>
                      </div>
                      <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>
                        {selectedBatch.name}
                      </h2>
                      <div
                        style={{
                          fontSize: '0.82rem',
                          color: '#64748B',
                          marginTop: '0.35rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '1rem',
                          flexWrap: 'wrap'
                        }}
                      >
                        {selectedBatch.course_title && (
                          <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#2563EB', fontWeight: 600 }}>
                            <BookOpen size={14} />
                            <span>{selectedBatch.course_title}</span>
                          </span>
                        )}
                        <span>
                          Enrolled: <strong>{batchStudents.length}</strong> / {selectedBatch.capacity || 40} Learners
                        </span>
                        <span>
                          Spots Remaining:{' '}
                          <strong style={{ color: Number(selectedBatch.capacity) <= batchStudents.length ? '#DC2626' : '#166534' }}>
                            {Math.max(0, Number(selectedBatch.capacity || 40) - batchStudents.length)}
                          </strong>
                        </span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                      {/* Search in enrolled */}
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          background: '#F8FAFC',
                          padding: '0.45rem 0.8rem',
                          borderRadius: '8px',
                          border: '1px solid #E2E8F0',
                          minWidth: '220px'
                        }}
                      >
                        <Search size={16} style={{ color: '#94A3B8' }} />
                        <input
                          type="text"
                          placeholder="Filter batch learners..."
                          value={batchStudentSearch}
                          onChange={(e) => setBatchStudentSearch(e.target.value)}
                          style={{ width: '100%', border: 'none', outline: 'none', background: 'transparent', fontSize: '0.82rem' }}
                        />
                      </div>

                      <button
                        onClick={handleOpenAddStudents}
                        className="btn btn-primary"
                        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.55rem 1rem' }}
                      >
                        <UserPlus size={16} />
                        <span>Add Students</span>
                      </button>
                    </div>
                  </div>

                  {/* Enrolled Students Table */}
                  <div
                    className="card"
                    style={{
                      padding: 0,
                      overflow: 'hidden',
                      background: '#FFFFFF',
                      border: '1px solid #E2E8F0',
                      borderRadius: '12px'
                    }}
                  >
                    {loadingBatchStudents ? (
                      <div style={{ padding: '3.5rem', textAlign: 'center', color: '#64748B' }}>
                        Loading enrolled student roster...
                      </div>
                    ) : filteredBatchStudents.length === 0 ? (
                      <div style={{ padding: '3.5rem', textAlign: 'center', color: '#64748B' }}>
                        {batchStudentSearch
                          ? `No enrolled students match "${batchStudentSearch}".`
                          : 'No students currently enrolled in this batch. Click "+ Add Students" above to search database and enroll students.'}
                      </div>
                    ) : (
                      <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
                          <thead>
                            <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#475569', fontWeight: 600 }}>
                              <th style={{ padding: '0.85rem 1.25rem' }}>Student Name</th>
                              <th style={{ padding: '0.85rem 1.25rem' }}>Email Address</th>
                              <th style={{ padding: '0.85rem 1.25rem' }}>Enrollment Date</th>
                              <th style={{ padding: '0.85rem 1.25rem' }}>Account Status</th>
                              <th style={{ padding: '0.85rem 1.25rem', textAlign: 'right' }}>Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {filteredBatchStudents.map((st) => (
                              <tr key={st.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                                <td style={{ padding: '0.85rem 1.25rem', fontWeight: 600, color: '#0F172A' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                                    <div
                                      style={{
                                        width: 32,
                                        height: 32,
                                        borderRadius: '50%',
                                        background: 'rgba(37, 99, 235, 0.1)',
                                        color: '#2563EB',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontWeight: 700,
                                        fontSize: '0.8rem'
                                      }}
                                    >
                                      {st.full_name?.charAt(0) || 'S'}
                                    </div>
                                    <span>{st.full_name}</span>
                                  </div>
                                </td>
                                <td style={{ padding: '0.85rem 1.25rem', color: '#64748B' }}>{st.email}</td>
                                <td style={{ padding: '0.85rem 1.25rem', color: '#94A3B8', fontSize: '0.82rem' }}>
                                  {st.enrolled_at ? new Date(st.enrolled_at).toLocaleDateString() : 'N/A'}
                                </td>
                                <td style={{ padding: '0.85rem 1.25rem' }}>
                                  <span
                                    style={{
                                      padding: '0.2rem 0.55rem',
                                      borderRadius: '999px',
                                      fontSize: '0.74rem',
                                      fontWeight: 700,
                                      textTransform: 'uppercase',
                                      background: st.status === 'active' ? '#DCFCE7' : '#FEE2E2',
                                      color: st.status === 'active' ? '#166534' : '#991B1B'
                                    }}
                                  >
                                    {st.status || 'active'}
                                  </span>
                                </td>
                                <td style={{ padding: '0.85rem 1.25rem', textAlign: 'right' }}>
                                  <button
                                    onClick={() => handleRemoveStudentFromBatch(st.id)}
                                    className="btn btn-ghost btn-sm"
                                    style={{ color: '#EF4444', fontSize: '0.78rem', padding: '0.3rem 0.6rem' }}
                                  >
                                    Remove
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: ACADEMIC DIVISIONS (LEGACY) */}
      {activeTab === 'classes' && (
        <div>
          {/* Class tabs / selector */}
          <div
            style={{
              display: 'flex',
              gap: '0.75rem',
              overflowX: 'auto',
              paddingBottom: '0.5rem',
              marginBottom: '1.5rem'
            }}
          >
            {assignments.map((asgn) => (
              <button
                key={asgn.id}
                onClick={() => setSelectedAssignment(asgn)}
                className={`btn ${selectedAssignment?.id === asgn.id ? 'btn-primary' : 'btn-outline'}`}
                style={{
                  padding: '0.65rem 1rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontSize: '0.85rem',
                  whiteSpace: 'nowrap'
                }}
              >
                <School size={16} />
                <span>
                  {asgn.class_name} • {asgn.subject_name}
                </span>
              </button>
            ))}
          </div>

          {selectedAssignment && (
            <div
              className="card"
              style={{
                padding: '1.5rem',
                marginBottom: '1.5rem',
                background: '#F8FAFC',
                border: '1px solid #E2E8F0'
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '0.75rem'
                }}
              >
                <div>
                  <h2 style={{ fontSize: '1.3rem', fontWeight: 700, color: '#0F172A', margin: 0 }}>
                    {selectedAssignment.class_name} — {selectedAssignment.subject_name}
                  </h2>
                  <span style={{ fontSize: '0.82rem', color: '#64748B' }}>
                    Batch: {selectedAssignment.batch_name || 'All Batches'} • Enrolled Learners: {classStudents.length}
                  </span>
                </div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    background: '#FFFFFF',
                    padding: '0.4rem 0.8rem',
                    borderRadius: '6px',
                    border: '1px solid #E2E8F0',
                    minWidth: '240px'
                  }}
                >
                  <Search size={16} style={{ color: '#94A3B8' }} />
                  <input
                    type="text"
                    placeholder="Search students..."
                    value={classSearch}
                    onChange={(e) => setClassSearch(e.target.value)}
                    style={{ width: '100%', border: 'none', outline: 'none', fontSize: '0.82rem' }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Legacy Students Table */}
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            {loadingClasses ? (
              <div style={{ padding: '3rem', textAlign: 'center', color: '#64748B' }}>Loading student rosters...</div>
            ) : filteredClassStudents.length === 0 ? (
              <div style={{ padding: '3rem', textAlign: 'center', color: '#64748B' }}>No students enrolled in this division.</div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
                <thead>
                  <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#475569', fontWeight: 600 }}>
                    <th style={{ padding: '0.85rem 1.25rem' }}>Student Name</th>
                    <th style={{ padding: '0.85rem 1.25rem' }}>Email Address</th>
                    <th style={{ padding: '0.85rem 1.25rem' }}>Batch / Section</th>
                    <th style={{ padding: '0.85rem 1.25rem' }}>Account Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredClassStudents.map((s) => (
                    <tr key={s.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                      <td style={{ padding: '0.85rem 1.25rem', fontWeight: 600, color: '#0F172A' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                          <div
                            style={{
                              width: 32,
                              height: 32,
                              borderRadius: '50%',
                              background: 'rgba(37, 99, 235, 0.1)',
                              color: '#2563EB',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 700,
                              fontSize: '0.8rem'
                            }}
                          >
                            {s.full_name?.charAt(0)}
                          </div>
                          <span>{s.full_name}</span>
                        </div>
                      </td>
                      <td style={{ padding: '0.85rem 1.25rem', color: '#475569' }}>{s.email}</td>
                      <td style={{ padding: '0.85rem 1.25rem', color: '#64748B' }}>{s.batch_name || 'General'}</td>
                      <td style={{ padding: '0.85rem 1.25rem' }}>
                        <span
                          style={{
                            padding: '0.2rem 0.6rem',
                            borderRadius: '999px',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            textTransform: 'uppercase',
                            background: s.status === 'active' ? '#DCFCE7' : '#FEE2E2',
                            color: s.status === 'active' ? '#166534' : '#991B1B'
                          }}
                        >
                          {s.status || 'active'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* STUDENT SELECTION & ENROLLMENT MODAL (DATABASE-BACKED) */}
      {showAddStudentsModal && selectedBatch && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 999,
            padding: '1rem',
            overflowY: 'auto'
          }}
        >
          <div
            className="card"
            style={{
              maxWidth: '680px',
              width: '100%',
              padding: '2rem',
              borderRadius: '16px',
              background: '#FFFFFF',
              maxHeight: '90vh',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '1rem'
              }}
            >
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>
                  Add Students to Batch: {selectedBatch.name}
                </h3>
                <span style={{ fontSize: '0.8rem', color: '#64748B' }}>
                  Available spots: {Math.max(0, Number(selectedBatch.capacity || 40) - batchStudents.length)}
                </span>
              </div>
              <button
                onClick={() => setShowAddStudentsModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* DB Search Input */}
            <div
              style={{
                padding: '1rem',
                background: '#F8FAFC',
                borderRadius: '10px',
                border: '1px solid #E2E8F0',
                marginBottom: '1rem'
              }}
            >
              <label
                style={{
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  color: '#334155',
                  marginBottom: '0.4rem',
                  display: 'block'
                }}
              >
                Search Database by Student Name, Email, or ID
              </label>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.6rem',
                  background: '#FFFFFF',
                  padding: '0.55rem 0.85rem',
                  borderRadius: '8px',
                  border: '1px solid #CBD5E1'
                }}
              >
                <Search size={18} style={{ color: '#94A3B8' }} />
                <input
                  type="text"
                  placeholder="e.g. Aarav, student@example.com..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{ width: '100%', border: 'none', outline: 'none', fontSize: '0.86rem' }}
                  autoFocus
                />
                {searching && (
                  <span style={{ fontSize: '0.75rem', color: '#2563EB', fontWeight: 600 }}>Searching DB...</span>
                )}
              </div>
            </div>

            {/* Search Results list */}
            <div style={{ flex: 1, minHeight: '180px', maxHeight: '280px', overflowY: 'auto', marginBottom: '1.25rem' }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  color: '#64748B',
                  marginBottom: '0.5rem'
                }}
              >
                <span>Database Query Results ({searchResults.length})</span>
                {selectedStudentIds.size > 0 && (
                  <span style={{ color: '#2563EB' }}>{selectedStudentIds.size} student(s) selected</span>
                )}
              </div>

              {!searchQuery.trim() ? (
                <div style={{ padding: '2rem', textAlign: 'center', color: '#94A3B8', fontSize: '0.85rem' }}>
                  Type a name or email address above to query active database students.
                </div>
              ) : searchResults.length === 0 && !searching ? (
                <div style={{ padding: '2rem', textAlign: 'center', color: '#94A3B8', fontSize: '0.85rem' }}>
                  No matching student accounts found in the database.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  {searchResults.map((s) => {
                    const isEnrolled = batchStudents.some((bs) => bs.id === s.id);
                    const isChecked = selectedStudentIds.has(s.id);

                    return (
                      <div
                        key={s.id}
                        onClick={() => !isEnrolled && toggleStudentSelection(s.id)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '0.6rem 0.85rem',
                          background: isChecked ? '#EFF6FF' : '#FFFFFF',
                          border: isChecked ? '1px solid #93C5FD' : '1px solid #E2E8F0',
                          borderRadius: '8px',
                          cursor: isEnrolled ? 'not-allowed' : 'pointer'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                          <input
                            type="checkbox"
                            checked={isChecked}
                            disabled={isEnrolled}
                            onChange={() => {}}
                            style={{ cursor: 'pointer' }}
                          />
                          <div>
                            <strong style={{ fontSize: '0.88rem', color: '#0F172A', display: 'block' }}>
                              {s.full_name}
                            </strong>
                            <span style={{ fontSize: '0.76rem', color: '#64748B' }}>{s.email}</span>
                          </div>
                        </div>

                        {isEnrolled && (
                          <span style={{ fontSize: '0.74rem', color: '#166534', fontWeight: 700 }}>
                            Already Enrolled
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderTop: '1px solid #F1F5F9',
                paddingTop: '1rem'
              }}
            >
              <button
                type="button"
                onClick={() => setShowAddStudentsModal(false)}
                className="btn btn-outline"
                disabled={submittingEnroll}
              >
                Cancel
              </button>

              <button
                onClick={handleEnrollSelected}
                disabled={selectedStudentIds.size === 0 || submittingEnroll}
                className="btn btn-primary"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
              >
                <UserPlus size={16} />
                <span>
                  {submittingEnroll
                    ? 'Enrolling...'
                    : `Enroll ${selectedStudentIds.size} Selected Student(s)`}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default TeacherClassesPage;
