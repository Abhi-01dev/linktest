import React, { useState, useEffect, useMemo, useRef } from 'react';
import { api } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import {
  Layers,
  Plus,
  Search,
  Filter,
  Users,
  GraduationCap,
  Calendar,
  Archive,
  Trash2,
  Edit,
  CheckCircle,
  AlertCircle,
  X,
  UserPlus,
  BookOpen,
  ArrowRight,
  ShieldAlert,
  ChevronDown,
  UserCheck,
  Check
} from 'lucide-react';

export function AdminBatchesPage() {
  const { showToast } = useToast();

  const [batches, setBatches] = useState([]);
  const [courses, setCourses] = useState([]);
  const [allTeachers, setAllTeachers] = useState([]);
  const [allSubjects, setAllSubjects] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [courseFilter, setCourseFilter] = useState('ALL');

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingBatch, setEditingBatch] = useState(null);

  const [allocationBatch, setAllocationBatch] = useState(null);
  const [batchTeachers, setBatchTeachers] = useState([]);
  const [batchAssignments, setBatchAssignments] = useState([]);
  const [selectedAssignSubjectId, setSelectedAssignSubjectId] = useState('');
  const [selectedAssignTeacherId, setSelectedAssignTeacherId] = useState('');
  const [changeTeacherModal, setChangeTeacherModal] = useState(null);
  const [newTeacherId, setNewTeacherId] = useState('');
  const [loadingTeachers, setLoadingTeachers] = useState(false);
  const [teacherSearch, setTeacherSearch] = useState('');

  const [enrollmentBatch, setEnrollmentBatch] = useState(null);
  const [batchStudents, setBatchStudents] = useState([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [studentSearchQuery, setStudentSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchingStudents, setSearchingStudents] = useState(false);
  const [selectedStudentIds, setSelectedStudentIds] = useState(new Set());

  // Confirm delete/archive modal
  const [confirmAction, setConfirmAction] = useState(null); // { type: 'delete' | 'archive', batch: ... }

  // Form State for Create/Edit
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    course_id: '',
    description: '',
    start_date: '',
    end_date: '',
    capacity: 40,
    status: 'Active'
  });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const searchDebounceRef = useRef(null);

  // Load Batches & Reference Data
  const loadBatches = async () => {
    try {
      setLoading(true);
      const [batchList, courseList, teacherList, subjectList] = await Promise.all([
        api.getBatches(),
        api.getCourses({ published: 'all' }).catch(() => []),
        api.getAdminTeachers().catch(() => []),
        api.getAdminSubjects().catch(() => [])
      ]);
      setBatches(Array.isArray(batchList) ? batchList : []);
      setCourses(Array.isArray(courseList) ? courseList : []);
      setAllTeachers(Array.isArray(teacherList) ? teacherList : []);
      setAllSubjects(Array.isArray(subjectList) ? subjectList : []);
    } catch (err) {
      showToast(err.message || 'Failed to load batches roster', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBatches();
  }, []);

  // Filtered Batches
  const filteredBatches = useMemo(() => {
    return batches.filter((b) => {
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        b.name?.toLowerCase().includes(q) ||
        b.code?.toLowerCase().includes(q) ||
        b.course_title?.toLowerCase().includes(q);

      const matchStatus = statusFilter === 'ALL' || b.status?.toUpperCase() === statusFilter.toUpperCase();
      const matchCourse = courseFilter === 'ALL' || b.course_id === courseFilter;

      return matchSearch && matchStatus && matchCourse;
    });
  }, [batches, searchQuery, statusFilter, courseFilter]);

  // Open Create Modal
  const handleOpenCreate = () => {
    setEditingBatch(null);
    setFormError('');
    setFormData({
      name: '',
      code: '',
      course_id: courses[0]?.id || '',
      description: '',
      start_date: new Date().toISOString().split('T')[0],
      end_date: new Date(Date.now() + 90 * 86400000).toISOString().split('T')[0],
      capacity: 40,
      status: 'Active'
    });
    setShowCreateModal(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (batch) => {
    setEditingBatch(batch);
    setFormError('');
    setFormData({
      name: batch.name || '',
      code: batch.code || '',
      course_id: batch.course_id || '',
      description: batch.description || '',
      start_date: batch.start_date ? batch.start_date.split('T')[0] : '',
      end_date: batch.end_date ? batch.end_date.split('T')[0] : '',
      capacity: batch.capacity || 40,
      status: batch.status || 'Active'
    });
    setShowCreateModal(true);
  };

  // Submit Create or Edit
  const handleSubmitBatch = async (e) => {
    e.preventDefault();
    setFormError('');

    if (formData.start_date && formData.end_date && new Date(formData.start_date) > new Date(formData.end_date)) {
      setFormError('Start date cannot be after end date.');
      return;
    }

    if (Number(formData.capacity) < 1) {
      setFormError('Capacity must be at least 1.');
      return;
    }

    setSubmitting(true);
    const payload = {
      ...formData,
      course_id: formData.course_id && formData.course_id.trim() !== '' ? formData.course_id.trim() : null
    };
    try {
      if (editingBatch) {
        await api.updateBatch(editingBatch.id, payload);
        showToast('Batch updated successfully', 'success');
      } else {
        await api.createBatch(payload);
        showToast('Batch created successfully', 'success');
      }
      setShowCreateModal(false);
      loadBatches();
    } catch (err) {
      setFormError(err.message || 'Operation failed');
    } finally {
      setSubmitting(false);
    }
  };

  // Open Teacher Allocation Modal
  const handleOpenTeachers = async (batch) => {
    setAllocationBatch(batch);
    setTeacherSearch('');
    setChangeTeacherModal(null);
    try {
      setLoadingTeachers(true);
      const [assigned, assignmentsList] = await Promise.all([
        api.getBatchTeachers(batch.id).catch(() => []),
        api.getBatchAssignments(batch.id).catch(() => [])
      ]);
      setBatchTeachers(Array.isArray(assigned) ? assigned : []);
      setBatchAssignments(Array.isArray(assignmentsList) ? assignmentsList : []);
      if (allSubjects.length > 0 && !selectedAssignSubjectId) {
        setSelectedAssignSubjectId(allSubjects[0].id);
      }
      if (allTeachers.length > 0 && !selectedAssignTeacherId) {
        setSelectedAssignTeacherId(allTeachers[0].id);
      }
    } catch (err) {
      showToast(err.message || 'Failed to load assigned faculty', 'error');
    } finally {
      setLoadingTeachers(false);
    }
  };

  const handleAssignSubjectToTeacher = async (e) => {
    if (e) e.preventDefault();
    if (!selectedAssignSubjectId || !selectedAssignTeacherId) {
      showToast('Please select both a subject and a faculty teacher', 'error');
      return;
    }
    try {
      await api.assignTeacher({
        batch_id: allocationBatch.id,
        class_id: allocationBatch.class_id || null,
        subject_id: selectedAssignSubjectId,
        teacher_id: selectedAssignTeacherId
      });
      showToast('✓ Subject assigned to Teacher successfully', 'success');
      const [updatedAssigned, updatedAssignments] = await Promise.all([
        api.getBatchTeachers(allocationBatch.id).catch(() => []),
        api.getBatchAssignments(allocationBatch.id).catch(() => [])
      ]);
      setBatchTeachers(Array.isArray(updatedAssigned) ? updatedAssigned : []);
      setBatchAssignments(Array.isArray(updatedAssignments) ? updatedAssignments : []);
      loadBatches();
    } catch (err) {
      showToast(err.message || 'Failed to assign subject to teacher', 'error');
    }
  };

  const handleRemoveSubjectAssignment = async (assignmentId) => {
    try {
      await api.removeTeacherAssignment(assignmentId);
      showToast('Subject assignment removed', 'success');
      const [updatedAssigned, updatedAssignments] = await Promise.all([
        api.getBatchTeachers(allocationBatch.id).catch(() => []),
        api.getBatchAssignments(allocationBatch.id).catch(() => [])
      ]);
      setBatchTeachers(Array.isArray(updatedAssigned) ? updatedAssigned : []);
      setBatchAssignments(Array.isArray(updatedAssignments) ? updatedAssignments : []);
      loadBatches();
    } catch (err) {
      showToast(err.message || 'Failed to remove assignment', 'error');
    }
  };

  const handleChangeTeacherSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!changeTeacherModal || !newTeacherId) return;
    try {
      await api.updateTeacherAssignment(changeTeacherModal.assignmentId, newTeacherId);
      showToast('Assigned teacher updated successfully', 'success');
      setChangeTeacherModal(null);
      setNewTeacherId('');
      const [updatedAssigned, updatedAssignments] = await Promise.all([
        api.getBatchTeachers(allocationBatch.id).catch(() => []),
        api.getBatchAssignments(allocationBatch.id).catch(() => [])
      ]);
      setBatchTeachers(Array.isArray(updatedAssigned) ? updatedAssigned : []);
      setBatchAssignments(Array.isArray(updatedAssignments) ? updatedAssignments : []);
      loadBatches();
    } catch (err) {
      showToast(err.message || 'Failed to change teacher', 'error');
    }
  };

  const handleAssignTeacher = async (teacherId) => {
    try {
      await api.assignTeacherToBatch(allocationBatch.id, teacherId);
      showToast('Faculty member assigned to batch', 'success');
      const updated = await api.getBatchTeachers(allocationBatch.id);
      setBatchTeachers(Array.isArray(updated) ? updated : []);
      loadBatches();
    } catch (err) {
      showToast(err.message || 'Failed to assign faculty member', 'error');
    }
  };

  const handleRemoveTeacher = async (teacherId) => {
    try {
      await api.removeTeacherFromBatch(allocationBatch.id, teacherId);
      showToast('Faculty assignment removed', 'success');
      const updated = await api.getBatchTeachers(allocationBatch.id);
      setBatchTeachers(Array.isArray(updated) ? updated : []);
      loadBatches();
    } catch (err) {
      showToast(err.message || 'Failed to remove faculty', 'error');
    }
  };

  // Open Student Enrollment Modal
  const handleOpenStudents = async (batch) => {
    setEnrollmentBatch(batch);
    setStudentSearchQuery('');
    setSearchResults([]);
    setSelectedStudentIds(new Set());
    try {
      setLoadingStudents(true);
      const enrolled = await api.getBatchStudents(batch.id);
      setBatchStudents(Array.isArray(enrolled) ? enrolled : []);
    } catch (err) {
      showToast(err.message || 'Failed to load enrolled students', 'error');
    } finally {
      setLoadingStudents(false);
    }
  };

  // Debounced Student Search across PostgreSQL Database
  useEffect(() => {
    if (!enrollmentBatch) return;
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);

    if (!studentSearchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    searchDebounceRef.current = setTimeout(async () => {
      try {
        setSearchingStudents(true);
        const res = await api.searchStudents({ query: studentSearchQuery.trim(), limit: 15 });
        setSearchResults(res?.students || []);
      } catch (err) {
        showToast(err.message || 'Failed searching student database', 'error');
      } finally {
        setSearchingStudents(false);
      }
    }, 300);

    return () => {
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    };
  }, [studentSearchQuery, enrollmentBatch]);

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

  const handleEnrollSelected = async () => {
    if (selectedStudentIds.size === 0) return;
    try {
      setSubmitting(true);
      const res = await api.enrollStudentsInBatch(enrollmentBatch.id, Array.from(selectedStudentIds));
      showToast(
        `Enrolled ${res.enrolled_count || selectedStudentIds.size} student(s) successfully`,
        'success'
      );
      setSelectedStudentIds(new Set());
      setStudentSearchQuery('');
      setSearchResults([]);
      const updated = await api.getBatchStudents(enrollmentBatch.id);
      setBatchStudents(Array.isArray(updated) ? updated : []);
      loadBatches();
    } catch (err) {
      showToast(err.message || 'Failed to enroll students', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemoveStudent = async (studentId) => {
    try {
      await api.removeStudentFromBatch(enrollmentBatch.id, studentId);
      showToast('Student removed from batch', 'success');
      const updated = await api.getBatchStudents(enrollmentBatch.id);
      setBatchStudents(Array.isArray(updated) ? updated : []);
      loadBatches();
    } catch (err) {
      showToast(err.message || 'Failed to remove student', 'error');
    }
  };

  // Archive / Delete handling
  const handleExecuteConfirm = async () => {
    if (!confirmAction) return;
    const { type, batch } = confirmAction;

    try {
      if (type === 'archive') {
        await api.archiveBatch(batch.id);
        showToast(`Batch "${batch.name}" archived successfully`, 'success');
      } else if (type === 'delete') {
        await api.deleteBatch(batch.id);
        showToast(`Batch "${batch.name}" deleted successfully`, 'success');
      }
      setConfirmAction(null);
      loadBatches();
    } catch (err) {
      showToast(err.message || 'Action failed', 'error');
      setConfirmAction(null);
    }
  };

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
      {/* Top Banner / Breadcrumb */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          marginBottom: '2rem'
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <span
              style={{
                fontSize: '0.75rem',
                fontWeight: 800,
                letterSpacing: '0.05em',
                padding: '0.2rem 0.5rem',
                borderRadius: '4px',
                background: 'rgba(37, 99, 235, 0.1)',
                color: '#2563EB'
              }}
            >
              ADMINISTRATION
            </span>
          </div>
          <h1 style={{ fontSize: '1.85rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>
            Batch Management & Allocations
          </h1>
          <p style={{ color: '#64748B', fontSize: '0.88rem', marginTop: '0.25rem' }}>
            Configure cohort sections, allocate faculty mentors, and manage database student enrollments.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="btn btn-primary"
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.7rem 1.25rem' }}
        >
          <Plus size={18} />
          <span>Create New Batch</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div
        className="card"
        style={{
          padding: '1.25rem',
          marginBottom: '2rem',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '1rem',
          alignItems: 'center',
          background: '#FFFFFF',
          border: '1px solid #E2E8F0',
          borderRadius: '12px'
        }}
      >
        {/* Search Input */}
        <div
          style={{
            flex: '1 1 280px',
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem',
            background: '#F8FAFC',
            padding: '0.55rem 0.9rem',
            borderRadius: '8px',
            border: '1px solid #E2E8F0'
          }}
        >
          <Search size={18} style={{ color: '#94A3B8' }} />
          <input
            type="text"
            placeholder="Search by batch name, unique code, or track..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ width: '100%', border: 'none', outline: 'none', background: 'transparent', fontSize: '0.88rem' }}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8', padding: 0 }}
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Status Filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#64748B' }}>Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{
              padding: '0.5rem 0.85rem',
              borderRadius: '8px',
              border: '1px solid #E2E8F0',
              background: '#F8FAFC',
              fontSize: '0.85rem',
              color: '#334155',
              cursor: 'pointer'
            }}
          >
            <option value="ALL">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Upcoming">Upcoming</option>
            <option value="Completed">Completed</option>
            <option value="Archived">Archived</option>
          </select>
        </div>

        {/* Course Filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#64748B' }}>Program:</span>
          <select
            value={courseFilter}
            onChange={(e) => setCourseFilter(e.target.value)}
            style={{
              padding: '0.5rem 0.85rem',
              borderRadius: '8px',
              border: '1px solid #E2E8F0',
              background: '#F8FAFC',
              fontSize: '0.85rem',
              color: '#334155',
              maxWidth: '220px',
              cursor: 'pointer'
            }}
          >
            <option value="ALL">All Curricula</option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title}
              </option>
            ))}
          </select>
        </div>

        <div style={{ marginLeft: 'auto', fontSize: '0.82rem', color: '#64748B', fontWeight: 600 }}>
          Showing {filteredBatches.length} of {batches.length} batches
        </div>
      </div>

      {/* Batches Grid / List */}
      {loading ? (
        <div style={{ padding: '4rem 2rem', textAlign: 'center', color: '#64748B' }}>
          <div style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.5rem' }}>Loading batch rosters...</div>
          <p style={{ fontSize: '0.85rem' }}>Querying active database records</p>
        </div>
      ) : filteredBatches.length === 0 ? (
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
            No Batches Found
          </h3>
          <p style={{ color: '#64748B', fontSize: '0.88rem', maxWidth: '420px', margin: '0 auto 1.5rem' }}>
            {searchQuery || statusFilter !== 'ALL' || courseFilter !== 'ALL'
              ? 'No batches match your filter criteria. Try adjusting or clearing search filters.'
              : 'Start by creating your first academic cohort batch to allocate faculty and enroll students.'}
          </p>
          <button onClick={handleOpenCreate} className="btn btn-primary">
            <Plus size={16} />
            <span>Create Batch</span>
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: '1.5rem' }}>
          {filteredBatches.map((batch) => {
            const enrolled = Number(batch.enrolled_count || 0);
            const capacity = Number(batch.capacity || 40);
            const pct = Math.min(100, Math.round((enrolled / capacity) * 100));
            const isFull = enrolled >= capacity;
            const isArchived = batch.status === 'Archived';

            const statusColors = {
              Active: { bg: '#DCFCE7', text: '#166534', border: '#86EFAC' },
              Upcoming: { bg: '#F3E8FF', text: '#6B21A8', border: '#D8B4FE' },
              Completed: { bg: '#F1F5F9', text: '#475569', border: '#CBD5E1' },
              Archived: { bg: '#FEF2F2', text: '#991B1B', border: '#FCA5A5' }
            };
            const sc = statusColors[batch.status] || statusColors.Active;

            return (
              <div
                key={batch.id}
                className="card"
                style={{
                  background: '#FFFFFF',
                  borderRadius: '14px',
                  border: isArchived ? '1px dashed #CBD5E1' : '1px solid #E2E8F0',
                  padding: '1.5rem',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                  opacity: isArchived ? 0.75 : 1
                }}
              >
                <div>
                  {/* Card Header */}
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      gap: '0.75rem',
                      marginBottom: '0.85rem'
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <span
                          style={{
                            fontFamily: 'monospace',
                            fontSize: '0.78rem',
                            fontWeight: 700,
                            padding: '0.15rem 0.5rem',
                            background: '#F1F5F9',
                            borderRadius: '4px',
                            color: '#334155'
                          }}
                        >
                          {batch.code}
                        </span>
                        <span
                          style={{
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            padding: '0.15rem 0.55rem',
                            borderRadius: '999px',
                            background: sc.bg,
                            color: sc.text,
                            border: `1px solid ${sc.border}`
                          }}
                        >
                          {batch.status}
                        </span>
                      </div>
                      <h3
                        style={{
                          fontSize: '1.18rem',
                          fontWeight: 700,
                          color: '#0F172A',
                          marginTop: '0.35rem',
                          marginBottom: '0.2rem'
                        }}
                      >
                        {batch.name}
                      </h3>
                      {batch.course_title && (
                        <div
                          style={{
                            fontSize: '0.82rem',
                            color: '#2563EB',
                            fontWeight: 600,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.35rem'
                          }}
                        >
                          <BookOpen size={14} />
                          <span>{batch.course_title}</span>
                        </div>
                      )}
                    </div>

                    <div style={{ display: 'flex', gap: '0.35rem' }}>
                      <button
                        onClick={() => handleOpenEdit(batch)}
                        className="btn btn-ghost btn-sm"
                        style={{ padding: '0.35rem', color: '#64748B' }}
                        title="Edit Batch"
                      >
                        <Edit size={16} />
                      </button>
                      {!isArchived ? (
                        <button
                          onClick={() => setConfirmAction({ type: 'archive', batch })}
                          className="btn btn-ghost btn-sm"
                          style={{ padding: '0.35rem', color: '#D97706' }}
                          title="Archive Batch"
                        >
                          <Archive size={16} />
                        </button>
                      ) : (
                        <button
                          onClick={() => setConfirmAction({ type: 'delete', batch })}
                          className="btn btn-ghost btn-sm"
                          style={{ padding: '0.35rem', color: '#EF4444' }}
                          title="Delete Batch"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </div>

                  {batch.description && (
                    <p
                      style={{
                        fontSize: '0.84rem',
                        color: '#64748B',
                        marginBottom: '1rem',
                        lineHeight: 1.45,
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden'
                      }}
                    >
                      {batch.description}
                    </p>
                  )}

                  {/* Dates & Capacity Metas */}
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: '0.75rem',
                      padding: '0.85rem',
                      background: '#F8FAFC',
                      borderRadius: '10px',
                      border: '1px solid #F1F5F9',
                      marginBottom: '1rem'
                    }}
                  >
                    <div>
                      <span style={{ fontSize: '0.72rem', color: '#94A3B8', fontWeight: 600, display: 'block' }}>
                        TIMELINE
                      </span>
                      <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#334155' }}>
                        {batch.start_date ? new Date(batch.start_date).toLocaleDateString() : 'N/A'}
                      </span>
                      <span style={{ fontSize: '0.72rem', color: '#64748B', display: 'block' }}>
                        to {batch.end_date ? new Date(batch.end_date).toLocaleDateString() : 'Open'}
                      </span>
                    </div>

                    <div>
                      <span style={{ fontSize: '0.72rem', color: '#94A3B8', fontWeight: 600, display: 'block' }}>
                        FACULTY ALLOCATED
                      </span>
                      <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#334155' }}>
                        {batch.teacher_count || 0} Faculty Mentor(s)
                      </span>
                    </div>
                  </div>

                  {/* Capacity Bar */}
                  <div style={{ marginBottom: '1.25rem' }}>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        fontSize: '0.8rem',
                        marginBottom: '0.35rem'
                      }}
                    >
                      <span style={{ fontWeight: 600, color: '#475569' }}>
                        Enrolled: {enrolled} / {capacity}
                      </span>
                      <span style={{ fontWeight: 700, color: isFull ? '#DC2626' : '#2563EB' }}>
                        {isFull ? 'At Capacity' : `${capacity - enrolled} spots remaining`}
                      </span>
                    </div>
                    <div
                      style={{
                        width: '100%',
                        height: '7px',
                        background: '#E2E8F0',
                        borderRadius: '999px',
                        overflow: 'hidden'
                      }}
                    >
                      <div
                        style={{
                          width: `${pct}%`,
                          height: '100%',
                          background: isFull ? '#EF4444' : pct > 80 ? '#F59E0B' : '#2563EB',
                          transition: 'width 0.3s ease'
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Card Action Buttons */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '0.6rem',
                    borderTop: '1px solid #F1F5F9',
                    paddingTop: '1rem'
                  }}
                >
                  <button
                    onClick={() => handleOpenTeachers(batch)}
                    className="btn btn-outline btn-sm"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.4rem',
                      fontSize: '0.82rem',
                      fontWeight: 600
                    }}
                  >
                    <GraduationCap size={15} />
                    <span>Faculty ({batch.teacher_count || 0})</span>
                  </button>

                  <button
                    onClick={() => handleOpenStudents(batch)}
                    className="btn btn-primary btn-sm"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.4rem',
                      fontSize: '0.82rem',
                      fontWeight: 600
                    }}
                  >
                    <Users size={15} />
                    <span>Students ({enrolled})</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL 1: Create / Edit Batch */}
      {showCreateModal && (
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
              maxWidth: '560px',
              width: '100%',
              padding: '2rem',
              borderRadius: '16px',
              background: '#FFFFFF',
              maxHeight: '90vh',
              overflowY: 'auto'
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '1.25rem'
              }}
            >
              <div>
                <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>
                  {editingBatch ? 'Edit Batch Details' : 'Create New Batch'}
                </h3>
                <p style={{ fontSize: '0.82rem', color: '#64748B', marginTop: '0.2rem' }}>
                  Define cohort naming, unique identification code, and student enrollment capacity.
                </p>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8' }}
              >
                <X size={20} />
              </button>
            </div>

            {formError && (
              <div
                style={{
                  padding: '0.75rem 1rem',
                  borderRadius: '8px',
                  background: '#FEF2F2',
                  border: '1px solid #FCA5A5',
                  color: '#991B1B',
                  fontSize: '0.85rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  marginBottom: '1.25rem'
                }}
              >
                <AlertCircle size={16} style={{ flexShrink: 0 }} />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSubmitBatch}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ fontSize: '0.84rem' }}>
                    Batch Name *
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. AI & ML Spring 2026"
                    required
                  />
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ fontSize: '0.84rem' }}>
                    Unique Batch Code *
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase().replace(/\s+/g, '_') })}
                    placeholder="e.g. AIML-2026-A"
                    required
                    style={{ fontFamily: 'monospace' }}
                  />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label className="form-label" style={{ fontSize: '0.84rem' }}>
                  Curriculum / Program Track
                </label>
                <select
                  className="form-input"
                  value={formData.course_id}
                  onChange={(e) => setFormData({ ...formData, course_id: e.target.value })}
                >
                  <option value="">No specific curriculum tied</option>
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.title}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label className="form-label" style={{ fontSize: '0.84rem' }}>
                  Description
                </label>
                <textarea
                  className="form-input"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Target objectives, schedule commitments, or syllabus milestones..."
                  rows={2}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ fontSize: '0.84rem' }}>
                    Start Date
                  </label>
                  <input
                    type="date"
                    className="form-input"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                  />
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ fontSize: '0.84rem' }}>
                    End Date
                  </label>
                  <input
                    type="date"
                    className="form-input"
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ fontSize: '0.84rem' }}>
                    Student Capacity *
                  </label>
                  <input
                    type="number"
                    className="form-input"
                    min="1"
                    max="500"
                    value={formData.capacity}
                    onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ fontSize: '0.84rem' }}>
                    Cohort Status
                  </label>
                  <select
                    className="form-input"
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  >
                    <option value="Active">Active</option>
                    <option value="Upcoming">Upcoming</option>
                    <option value="Completed">Completed</option>
                    <option value="Archived">Archived</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="btn btn-outline"
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Saving...' : editingBatch ? 'Save Changes' : 'Create Batch'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Teacher Allocation Modal */}
      {allocationBatch && (
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
              maxWidth: '650px',
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
                  Subject & Faculty Allocation — {allocationBatch.name}
                </h3>
                <span style={{ fontSize: '0.8rem', color: '#64748B', fontFamily: 'monospace' }}>
                  Batch Code: {allocationBatch.code} {allocationBatch.course_title ? `• Curriculum: ${allocationBatch.course_title}` : ''}
                </span>
              </div>
              <button
                onClick={() => setAllocationBatch(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* 1. Form: Assign Subject to Teacher for this Batch */}
            <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '1.25rem', marginBottom: '1.5rem' }}>
              <h4 style={{ fontSize: '0.92rem', fontWeight: 700, color: '#0F172A', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <BookOpen size={16} style={{ color: '#2563EB' }} />
                <span>Assign Subject to Faculty</span>
              </h4>
              <form onSubmit={handleAssignSubjectToTeacher} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '0.75rem', alignItems: 'flex-end' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#475569', marginBottom: '0.25rem' }}>Subject</label>
                  <select
                    className="form-input"
                    value={selectedAssignSubjectId}
                    onChange={(e) => setSelectedAssignSubjectId(e.target.value)}
                    style={{ fontSize: '0.85rem' }}
                    required
                  >
                    <option value="">Select Subject</option>
                    {allSubjects.map(s => (
                      <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#475569', marginBottom: '0.25rem' }}>Teacher</label>
                  <select
                    className="form-input"
                    value={selectedAssignTeacherId}
                    onChange={(e) => setSelectedAssignTeacherId(e.target.value)}
                    style={{ fontSize: '0.85rem' }}
                    required
                  >
                    <option value="">Select Teacher</option>
                    {allTeachers.map(t => (
                      <option key={t.id} value={t.id}>{t.full_name} ({t.email})</option>
                    ))}
                  </select>
                </div>
                <button type="submit" className="btn btn-primary" style={{ height: '38px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <Plus size={15} />
                  <span>Assign</span>
                </button>
              </form>
            </div>

            {/* 2. Currently Assigned Subjects & Faculty */}
            <div style={{ marginBottom: '1.5rem' }}>
              <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#334155', marginBottom: '0.6rem' }}>
                Assigned Subjects & Faculty ({batchAssignments.length})
              </h4>
              {loadingTeachers ? (
                <div style={{ padding: '1rem', textAlign: 'center', color: '#94A3B8', fontSize: '0.85rem' }}>
                  Loading assignments...
                </div>
              ) : batchAssignments.length === 0 ? (
                <div
                  style={{
                    padding: '1.25rem',
                    background: '#F8FAFC',
                    border: '1px dashed #CBD5E1',
                    borderRadius: '8px',
                    fontSize: '0.84rem',
                    color: '#64748B',
                    textAlign: 'center'
                  }}
                >
                  No subjects assigned to teachers for this batch yet. Use the form above to assign a subject to a faculty member.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', maxHeight: '220px', overflowY: 'auto' }}>
                  {batchAssignments.map((asgn) => (
                    <div
                      key={asgn.id}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '0.75rem 1rem',
                        background: '#F0FDF4',
                        border: '1px solid #BBF7D0',
                        borderRadius: '8px'
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <strong style={{ fontSize: '0.92rem', color: '#166534' }}>{asgn.subject_name}</strong>
                          <span style={{ fontSize: '0.75rem', background: '#DCFCE7', color: '#166534', padding: '0.1rem 0.4rem', borderRadius: '4px', fontWeight: 600 }}>
                            {asgn.subject_code}
                          </span>
                          <span style={{ fontSize: '0.72rem', background: '#16A34A', color: '#FFFFFF', padding: '0.15rem 0.45rem', borderRadius: '999px', fontWeight: 700, textTransform: 'uppercase' }}>
                            Assigned
                          </span>
                        </div>
                        <div style={{ fontSize: '0.82rem', color: '#374151', marginTop: '0.2rem' }}>
                          Teacher: <strong>{asgn.teacher_name}</strong> ({asgn.teacher_email})
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#6B7280', marginTop: '0.1rem' }}>
                          Batch: {allocationBatch.name}
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                        <button
                          type="button"
                          onClick={() => {
                            setChangeTeacherModal({
                              assignmentId: asgn.id,
                              currentTeacherId: asgn.teacher_id,
                              subjectName: asgn.subject_name
                            });
                            setNewTeacherId(allTeachers.find(t => t.id !== asgn.teacher_id)?.id || allTeachers[0]?.id || '');
                          }}
                          className="btn btn-outline btn-sm"
                          style={{ fontSize: '0.75rem', padding: '0.3rem 0.6rem', background: '#FFFFFF' }}
                        >
                          Change Teacher
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveSubjectAssignment(asgn.id)}
                          className="btn btn-ghost btn-sm"
                          style={{ fontSize: '0.75rem', padding: '0.3rem 0.6rem', color: '#EF4444' }}
                        >
                          Remove Assignment
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 3. General Batch Teachers / Cohort Faculty Allocation */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <h4 style={{ fontSize: '0.88rem', fontWeight: 700, color: '#334155', marginBottom: '0.5rem' }}>
                Batch Faculty Roster ({batchTeachers.length})
              </h4>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.5rem 0.75rem',
                  background: '#F8FAFC',
                  borderRadius: '8px',
                  border: '1px solid #E2E8F0',
                  marginBottom: '0.75rem'
                }}
              >
                <Search size={16} style={{ color: '#94A3B8' }} />
                <input
                  type="text"
                  placeholder="Filter faculty members by name or email..."
                  value={teacherSearch}
                  onChange={(e) => setTeacherSearch(e.target.value)}
                  style={{ width: '100%', border: 'none', outline: 'none', background: 'transparent', fontSize: '0.84rem' }}
                />
              </div>

              <div
                style={{
                  flex: 1,
                  maxHeight: '180px',
                  overflowY: 'auto',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.4rem',
                  paddingRight: '0.25rem'
                }}
              >
                {allTeachers
                  .filter((t) => {
                    const q = teacherSearch.toLowerCase();
                    return !q || t.full_name?.toLowerCase().includes(q) || t.email?.toLowerCase().includes(q);
                  })
                  .map((teacher) => {
                    const isAssigned = batchTeachers.some((bt) => bt.id === teacher.id || bt.teacher_id === teacher.id) ||
                      batchAssignments.some(ba => ba.teacher_id === teacher.id);
                    return (
                      <div
                        key={teacher.id}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '0.55rem 0.85rem',
                          background: isAssigned ? '#F1F5F9' : '#FFFFFF',
                          borderRadius: '8px',
                          border: '1px solid #E2E8F0'
                        }}
                      >
                        <div>
                          <strong style={{ fontSize: '0.86rem', color: '#0F172A', display: 'block' }}>
                            {teacher.full_name}
                          </strong>
                          <span style={{ fontSize: '0.76rem', color: '#64748B' }}>{teacher.email}</span>
                        </div>

                        {isAssigned ? (
                          <span style={{ fontSize: '0.75rem', color: '#166534', fontWeight: 700 }}>
                            Assigned
                          </span>
                        ) : (
                          <button
                            onClick={() => handleAssignTeacher(teacher.id)}
                            className="btn btn-outline btn-sm"
                            style={{ fontSize: '0.78rem', padding: '0.3rem 0.65rem' }}
                          >
                            + Allocate
                          </button>
                        )}
                      </div>
                    );
                  })}
              </div>
            </div>

            <div style={{ marginTop: '1.5rem', textAlign: 'right' }}>
              <button onClick={() => setAllocationBatch(null)} className="btn btn-primary">
                Done
              </button>
            </div>

            {/* Change Teacher Modal */}
            {changeTeacherModal && (
              <div
                style={{
                  position: 'fixed',
                  inset: 0,
                  background: 'rgba(15, 23, 42, 0.7)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 1050,
                  padding: '1rem'
                }}
              >
                <div className="card" style={{ maxWidth: '420px', width: '100%', padding: '1.75rem' }}>
                  <h4 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.5rem', color: '#0F172A' }}>
                    Change Teacher
                  </h4>
                  <p style={{ fontSize: '0.84rem', color: '#64748B', marginBottom: '1.25rem' }}>
                    Select replacement teacher for <strong>{changeTeacherModal.subjectName}</strong> in batch <strong>{allocationBatch.name}</strong>.
                  </p>
                  <form onSubmit={handleChangeTeacherSubmit}>
                    <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                      <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '0.35rem' }}>
                        Replacement Faculty Teacher
                      </label>
                      <select
                        className="form-input"
                        value={newTeacherId}
                        onChange={(e) => setNewTeacherId(e.target.value)}
                        required
                        style={{ width: '100%', fontSize: '0.85rem' }}
                      >
                        {allTeachers.map(t => (
                          <option key={t.id} value={t.id}>{t.full_name} ({t.email})</option>
                        ))}
                      </select>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                      <button
                        type="button"
                        onClick={() => setChangeTeacherModal(null)}
                        className="btn btn-outline btn-sm"
                      >
                        Cancel
                      </button>
                      <button type="submit" className="btn btn-primary btn-sm">
                        Confirm Teacher Change
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL 3: Student Search & Enrollment Modal */}
      {enrollmentBatch && (
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
              maxWidth: '750px',
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
                  Student Enrollment — {enrollmentBatch.name}
                </h3>
                <span style={{ fontSize: '0.8rem', color: '#64748B' }}>
                  Enrolled: {batchStudents.length} / {enrollmentBatch.capacity} • Capacity Remaining:{' '}
                  {Math.max(0, Number(enrollmentBatch.capacity) - batchStudents.length)} spots
                </span>
              </div>
              <button
                onClick={() => setEnrollmentBatch(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Live DB Search Form */}
            <div
              style={{
                padding: '1rem',
                background: '#F8FAFC',
                borderRadius: '10px',
                border: '1px solid #E2E8F0',
                marginBottom: '1.25rem'
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
                Search Database for Existing Students
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
                  placeholder="Type student name, email, or user ID..."
                  value={studentSearchQuery}
                  onChange={(e) => setStudentSearchQuery(e.target.value)}
                  style={{ width: '100%', border: 'none', outline: 'none', fontSize: '0.86rem' }}
                />
                {searchingStudents && (
                  <span style={{ fontSize: '0.75rem', color: '#2563EB', fontWeight: 600 }}>Searching...</span>
                )}
              </div>

              {/* Search Results Dropdown */}
              {studentSearchQuery.trim() && (
                <div style={{ marginTop: '0.75rem' }}>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      color: '#64748B',
                      marginBottom: '0.35rem'
                    }}
                  >
                    <span>Matching Students from Database ({searchResults.length})</span>
                    {selectedStudentIds.size > 0 && (
                      <span style={{ color: '#2563EB' }}>{selectedStudentIds.size} student(s) selected</span>
                    )}
                  </div>

                  {searchResults.length === 0 && !searchingStudents ? (
                    <div style={{ padding: '0.75rem', textAlign: 'center', color: '#94A3B8', fontSize: '0.82rem' }}>
                      No eligible student accounts match "{studentSearchQuery}".
                    </div>
                  ) : (
                    <div
                      style={{
                        maxHeight: '160px',
                        overflowY: 'auto',
                        background: '#FFFFFF',
                        border: '1px solid #E2E8F0',
                        borderRadius: '8px',
                        display: 'flex',
                        flexDirection: 'column'
                      }}
                    >
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
                              padding: '0.5rem 0.85rem',
                              borderBottom: '1px solid #F1F5F9',
                              cursor: isEnrolled ? 'not-allowed' : 'pointer',
                              background: isChecked ? '#EFF6FF' : '#FFFFFF'
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
                                <strong style={{ fontSize: '0.86rem', color: '#0F172A', display: 'block' }}>
                                  {s.full_name}
                                </strong>
                                <span style={{ fontSize: '0.75rem', color: '#64748B' }}>{s.email}</span>
                              </div>
                            </div>

                            {isEnrolled && (
                              <span style={{ fontSize: '0.72rem', color: '#166534', fontWeight: 700 }}>
                                Already in Batch
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {selectedStudentIds.size > 0 && (
                    <div style={{ marginTop: '0.75rem', textAlign: 'right' }}>
                      <button
                        onClick={handleEnrollSelected}
                        disabled={submitting}
                        className="btn btn-primary btn-sm"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
                      >
                        <UserPlus size={15} />
                        <span>Enroll {selectedStudentIds.size} Selected Student(s)</span>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Currently Enrolled Students Table */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <h4 style={{ fontSize: '0.88rem', fontWeight: 700, color: '#334155', marginBottom: '0.5rem' }}>
                Enrolled Students in Cohort ({batchStudents.length})
              </h4>

              {loadingStudents ? (
                <div style={{ padding: '2rem', textAlign: 'center', color: '#94A3B8' }}>
                  Loading enrolled students...
                </div>
              ) : batchStudents.length === 0 ? (
                <div
                  style={{
                    padding: '2rem',
                    textAlign: 'center',
                    background: '#F8FAFC',
                    border: '1px dashed #CBD5E1',
                    borderRadius: '8px',
                    color: '#64748B',
                    fontSize: '0.85rem'
                  }}
                >
                  No students currently enrolled in this batch. Use the search bar above to query students.
                </div>
              ) : (
                <div
                  style={{
                    maxHeight: '260px',
                    overflowY: 'auto',
                    border: '1px solid #E2E8F0',
                    borderRadius: '8px'
                  }}
                >
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.84rem' }}>
                    <thead>
                      <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#475569' }}>
                        <th style={{ padding: '0.65rem 0.85rem' }}>Student</th>
                        <th style={{ padding: '0.65rem 0.85rem' }}>Email</th>
                        <th style={{ padding: '0.65rem 0.85rem' }}>Enrolled On</th>
                        <th style={{ padding: '0.65rem 0.85rem', textAlign: 'right' }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {batchStudents.map((st) => (
                        <tr key={st.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                          <td style={{ padding: '0.6rem 0.85rem', fontWeight: 600, color: '#0F172A' }}>
                            {st.full_name}
                          </td>
                          <td style={{ padding: '0.6rem 0.85rem', color: '#64748B' }}>{st.email}</td>
                          <td style={{ padding: '0.6rem 0.85rem', color: '#94A3B8', fontSize: '0.78rem' }}>
                            {st.enrolled_at ? new Date(st.enrolled_at).toLocaleDateString() : 'N/A'}
                          </td>
                          <td style={{ padding: '0.6rem 0.85rem', textAlign: 'right' }}>
                            <button
                              onClick={() => handleRemoveStudent(st.id)}
                              className="btn btn-ghost btn-sm"
                              style={{ color: '#EF4444', fontSize: '0.76rem', padding: '0.2rem 0.5rem' }}
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

            <div style={{ marginTop: '1.25rem', textAlign: 'right' }}>
              <button onClick={() => setEnrollmentBatch(null)} className="btn btn-primary">
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: Confirmation Dialog */}
      {confirmAction && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '1rem'
          }}
        >
          <div
            className="card"
            style={{
              maxWidth: '440px',
              width: '100%',
              padding: '2rem',
              borderRadius: '16px',
              background: '#FFFFFF'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
              <div
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: '50%',
                  background: confirmAction.type === 'delete' ? '#FEF2F2' : '#FEF3C7',
                  color: confirmAction.type === 'delete' ? '#EF4444' : '#D97706',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <AlertCircle size={22} />
              </div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>
                {confirmAction.type === 'delete' ? 'Delete Cohort Batch?' : 'Archive Cohort Batch?'}
              </h3>
            </div>

            <p style={{ fontSize: '0.88rem', color: '#64748B', lineHeight: 1.5, marginBottom: '1.5rem' }}>
              {confirmAction.type === 'delete'
                ? `Are you sure you want to delete batch "${confirmAction.batch.name}"? Note: If students or teachers are allocated, the database will preserve records and prevent accidental loss.`
                : `Are you sure you want to archive batch "${confirmAction.batch.name}"? Active students and allocations will be preserved for audits, but new enrollments will be halted.`}
            </p>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button onClick={() => setConfirmAction(null)} className="btn btn-outline">
                Cancel
              </button>
              <button
                onClick={handleExecuteConfirm}
                className={`btn ${confirmAction.type === 'delete' ? 'btn-danger' : 'btn-primary'}`}
              >
                Confirm {confirmAction.type === 'delete' ? 'Delete' : 'Archive'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminBatchesPage;
