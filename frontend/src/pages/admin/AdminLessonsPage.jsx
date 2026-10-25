import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { api } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import {
  Plus,
  Edit,
  Trash2,
  BookOpen,
  ArrowLeft,
  X,
  PlayCircle
} from 'lucide-react';

export function AdminLessonsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { showToast } = useToast();

  const [courses, setCourses] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState(searchParams.get('courseId') || '');
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingLesson, setEditingLesson] = useState(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [position, setPosition] = useState(1);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function loadCoursesList() {
      try {
        const list = await api.getCourses({ published: 'all' });
        setCourses(list);
        if (!selectedCourseId && list.length > 0) {
          setSelectedCourseId(list[0].id);
        }
      } catch (err) {
        showToast('Failed to load courses', 'error');
      }
    }
    loadCoursesList();
  }, []);

  const loadLessons = async (cId) => {
    if (!cId) return;
    setLoading(true);
    try {
      const data = await api.getLessons(cId);
      setLessons(data || []);
    } catch (err) {
      showToast('Failed to load lessons', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedCourseId) {
      loadLessons(selectedCourseId);
      searchParams.set('courseId', selectedCourseId);
      setSearchParams(searchParams);
    }
  }, [selectedCourseId]);

  const openCreateModal = () => {
    setEditingLesson(null);
    setTitle('');
    setContent('# Lesson Outline\n\nExplain key concepts here...');
    setVideoUrl('');
    setPosition(lessons.length + 1);
    setModalOpen(true);
  };

  const openEditModal = (l) => {
    setEditingLesson(l);
    setTitle(l.title);
    setContent(l.content);
    setVideoUrl(l.video_url || '');
    setPosition(l.position);
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        title,
        content,
        video_url: videoUrl,
        position: Number(position)
      };

      if (editingLesson) {
        await api.updateLesson(editingLesson.id, payload);
        showToast('Lesson updated successfully!', 'success');
      } else {
        await api.createLesson(selectedCourseId, payload);
        showToast('New lesson added to course!', 'success');
      }

      setModalOpen(false);
      loadLessons(selectedCourseId);
    } catch (err) {
      showToast(err.message || 'Failed to save lesson', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (lId) => {
    if (!window.confirm('Delete this lesson permanently?')) return;
    try {
      await api.deleteLesson(lId);
      showToast('Lesson deleted', 'success');
      setLessons(prev => prev.filter(l => l.id !== lId));
    } catch (err) {
      showToast(err.message || 'Failed to delete lesson', 'error');
    }
  };

  const selectedCourse = courses.find(c => c.id === selectedCourseId);

  return (
    <div style={{ padding: '3rem 0 5rem' }}>
      <div className="container">
        {/* Header */}
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
            <Link
              to="/admin/courses"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                fontSize: '0.85rem',
                color: 'var(--color-text-muted)',
                marginBottom: '0.25rem'
              }}
            >
              <ArrowLeft size={14} />
              <span>Back to Courses</span>
            </Link>
            <h1 style={{ fontSize: '2rem' }}>Lesson & Syllabus Management</h1>
          </div>

          <button
            onClick={openCreateModal}
            className="btn btn-primary"
            disabled={!selectedCourseId}
          >
            <Plus size={16} />
            <span>Add Lesson to Course</span>
          </button>
        </div>

        {/* Course Filter Dropdown Bar */}
        <div className="card" style={{ padding: '1.25rem', marginBottom: '2rem' }}>
          <label className="form-label" style={{ marginBottom: '0.5rem', display: 'block' }}>
            Select Course to View/Edit Lessons:
          </label>
          <select
            className="form-select"
            value={selectedCourseId}
            onChange={(e) => setSelectedCourseId(e.target.value)}
            disabled={courses.length === 0}
            style={{ maxWidth: '480px' }}
          >
            {courses.length === 0 ? (
              <option value="" disabled>No options</option>
            ) : (
              courses.map(c => (
                <option key={c.id} value={c.id}>
                  {c.title} ({c.category})
                </option>
              ))
            )}
          </select>
        </div>

        {/* Lessons Table */}
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--color-border)' }}>
            <h3 style={{ fontSize: '1.15rem' }}>
              Lessons for: <strong>{selectedCourse?.title || 'Selected Course'}</strong>
            </h3>
          </div>

          {lessons.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
              No lessons have been added to this course yet.
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
                <thead>
                  <tr style={{ background: 'var(--color-bg-alt)', borderBottom: '1px solid var(--color-border)' }}>
                    <th style={{ padding: '0.85rem 1.25rem', width: '80px' }}>Order</th>
                    <th style={{ padding: '0.85rem 1.25rem' }}>Lesson Title</th>
                    <th style={{ padding: '0.85rem 1.25rem' }}>Video URL</th>
                    <th style={{ padding: '0.85rem 1.25rem', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {lessons.map(l => (
                    <tr key={l.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                      <td style={{ padding: '0.85rem 1.25rem', fontWeight: 700 }}>#{l.position}</td>
                      <td style={{ padding: '0.85rem 1.25rem' }}>
                        <strong style={{ fontSize: '0.95rem', display: 'block' }}>{l.title}</strong>
                        <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>ID: {l.id}</span>
                      </td>
                      <td style={{ padding: '0.85rem 1.25rem', color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>
                        {l.video_url ? (
                          <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--color-orange-dark)' }}>
                            <PlayCircle size={14} /> Video Attached
                          </span>
                        ) : (
                          'Text Only'
                        )}
                      </td>
                      <td style={{ padding: '0.85rem 1.25rem', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '0.5rem' }}>
                          <button
                            onClick={() => openEditModal(l)}
                            className="btn btn-outline btn-sm"
                            title="Edit Lesson"
                          >
                            <Edit size={14} />
                          </button>
                          <button
                            onClick={() => handleDelete(l.id)}
                            className="btn btn-outline btn-sm"
                            style={{ color: '#DC2626', borderColor: '#FCA5A5' }}
                            title="Delete Lesson"
                          >
                            <Trash2 size={14} />
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

        {/* Modal for Lesson Create / Edit */}
        {modalOpen && (
          <div className="modal-overlay">
            <div className="modal-content" style={{ maxWidth: '640px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h3 style={{ fontSize: '1.25rem' }}>
                  {editingLesson ? 'Edit Lesson' : 'Add New Lesson to Syllabus'}
                </h3>
                <button onClick={() => setModalOpen(false)} style={{ color: 'var(--color-text-muted)' }}>
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label className="form-label">Lesson Title</label>
                  <input
                    type="text"
                    className="form-input"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                    placeholder="e.g. 1. Introduction to State Reconciliation"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Position / Sequence Order</label>
                  <input
                    type="number"
                    min="1"
                    className="form-input"
                    value={position}
                    onChange={(e) => setPosition(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Video Embed URL (YouTube or direct stream)</label>
                  <input
                    type="url"
                    className="form-input"
                    value={videoUrl}
                    onChange={(e) => setVideoUrl(e.target.value)}
                    placeholder="https://www.youtube.com/watch?v=..."
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Lesson Markdown Content</label>
                  <textarea
                    className="form-textarea"
                    rows={8}
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    required
                    placeholder="Enter comprehensive lesson markdown content with headings, code blocks, and diagrams..."
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                  <button type="button" onClick={() => setModalOpen(false)} className="btn btn-outline">
                    Cancel
                  </button>
                  <button type="submit" disabled={saving} className="btn btn-primary">
                    {saving ? 'Saving...' : editingLesson ? 'Save Changes' : 'Add Lesson'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
