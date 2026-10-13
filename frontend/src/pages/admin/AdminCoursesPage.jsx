import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import {
  Plus,
  Edit,
  Trash2,
  BookOpen,
  CheckCircle,
  EyeOff,
  Eye,
  ArrowLeft,
  X,
  ExternalLink
} from 'lucide-react';

export function AdminCoursesPage() {
  const { showToast } = useToast();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Web Development');
  const [instructorName, setInstructorName] = useState('');
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [published, setPublished] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadCourses = async () => {
    setLoading(true);
    try {
      const list = await api.getCourses({ published: 'all' });
      setCourses(list);
    } catch (err) {
      showToast(err.message || 'Failed to load courses', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCourses();
  }, []);

  const openCreateModal = () => {
    setEditingCourse(null);
    setTitle('');
    setDescription('');
    setCategory('Web Development');
    setInstructorName('');
    setThumbnailUrl('');
    setPublished(true);
    setModalOpen(true);
  };

  const openEditModal = (c) => {
    setEditingCourse(c);
    setTitle(c.title);
    setDescription(c.description);
    setCategory(c.category);
    setInstructorName(c.instructor_name);
    setThumbnailUrl(c.thumbnail_url || '');
    setPublished(c.published);
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        title,
        description,
        category,
        instructor_name: instructorName,
        thumbnail_url: thumbnailUrl,
        published
      };

      if (editingCourse) {
        await api.updateCourse(editingCourse.id, payload);
        showToast('Course updated successfully!', 'success');
      } else {
        await api.createCourse(payload);
        showToast('New course created successfully!', 'success');
      }

      setModalOpen(false);
      loadCourses();
    } catch (err) {
      showToast(err.message || 'Failed to save course', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this course? All associated lessons will be removed.')) return;
    try {
      await api.deleteCourse(id);
      showToast('Course deleted successfully', 'success');
      setCourses(prev => prev.filter(c => c.id !== id));
    } catch (err) {
      showToast(err.message || 'Failed to delete course', 'error');
    }
  };

  const togglePublish = async (c) => {
    try {
      await api.updateCourse(c.id, { published: !c.published });
      showToast(`Course ${!c.published ? 'published' : 'unpublished'}`, 'success');
      setCourses(prev =>
        prev.map(item => (item.id === c.id ? { ...item, published: !c.published } : item))
      );
    } catch (err) {
      showToast(err.message || 'Failed to update course status', 'error');
    }
  };

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
              to="/admin"
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
              <span>Back to Admin Overview</span>
            </Link>
            <h1 style={{ fontSize: '2rem' }}>Course Management</h1>
          </div>

          <button onClick={openCreateModal} className="btn btn-primary">
            <Plus size={16} />
            <span>Create New Course</span>
          </button>
        </div>

        {/* Courses Table */}
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ background: 'var(--color-bg-alt)', borderBottom: '1px solid var(--color-border)' }}>
                  <th style={{ padding: '1rem 1.25rem' }}>Course</th>
                  <th style={{ padding: '1rem 1.25rem' }}>Category</th>
                  <th style={{ padding: '1rem 1.25rem' }}>Instructor</th>
                  <th style={{ padding: '1rem 1.25rem' }}>Lessons</th>
                  <th style={{ padding: '1rem 1.25rem' }}>Status</th>
                  <th style={{ padding: '1rem 1.25rem', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {courses.map(course => (
                  <tr key={course.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                    <td style={{ padding: '1rem 1.25rem' }}>
                      <strong style={{ fontSize: '0.95rem', display: 'block' }}>{course.title}</strong>
                      <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>ID: {course.id}</span>
                    </td>
                    <td style={{ padding: '1rem 1.25rem' }}>
                      <span className="badge badge-navy">{course.category}</span>
                    </td>
                    <td style={{ padding: '1rem 1.25rem' }}>{course.instructor_name}</td>
                    <td style={{ padding: '1rem 1.25rem' }}>
                      <Link
                        to={`/admin/lessons?courseId=${course.id}`}
                        style={{ color: 'var(--color-orange-dark)', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}
                      >
                        <span>{course.lessons_count || 3} Lessons</span>
                        <ExternalLink size={12} />
                      </Link>
                    </td>
                    <td style={{ padding: '1rem 1.25rem' }}>
                      <button
                        onClick={() => togglePublish(course)}
                        className={`badge ${course.published ? 'badge-success' : 'badge-warning'}`}
                        style={{ cursor: 'pointer', border: 'none' }}
                        title="Click to toggle status"
                      >
                        {course.published ? 'Published ✓' : 'Draft (Unpublished)'}
                      </button>
                    </td>
                    <td style={{ padding: '1rem 1.25rem', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '0.5rem' }}>
                        <button
                          onClick={() => openEditModal(course)}
                          className="btn btn-outline btn-sm"
                          title="Edit Course"
                        >
                          <Edit size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(course.id)}
                          className="btn btn-outline btn-sm"
                          style={{ color: '#DC2626', borderColor: '#FCA5A5' }}
                          title="Delete Course"
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
        </div>

        {/* Create / Edit Modal */}
        {modalOpen && (
          <div className="modal-overlay">
            <div className="modal-content">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h3 style={{ fontSize: '1.25rem' }}>
                  {editingCourse ? 'Edit Course Details' : 'Create New Technical Course'}
                </h3>
                <button onClick={() => setModalOpen(false)} style={{ color: 'var(--color-text-muted)' }}>
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label className="form-label">Course Title</label>
                  <input
                    type="text"
                    className="form-input"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                    placeholder="e.g. Distributed Caching with Redis"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Category</label>
                  <select
                    className="form-select"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                  >
                    <option value="Web Development">Web Development</option>
                    <option value="Computer Science">Computer Science</option>
                    <option value="AI & Data Science">AI & Data Science</option>
                    <option value="Cloud & DevOps">Cloud & DevOps</option>
                    <option value="System Architecture">System Architecture</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Instructor Name</label>
                  <input
                    type="text"
                    className="form-input"
                    value={instructorName}
                    onChange={(e) => setInstructorName(e.target.value)}
                    required
                    placeholder="e.g. Dr. Priya Patel"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Thumbnail URL</label>
                  <input
                    type="url"
                    className="form-input"
                    value={thumbnailUrl}
                    onChange={(e) => setThumbnailUrl(e.target.value)}
                    placeholder="https://images.unsplash.com/..."
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Course Description</label>
                  <textarea
                    className="form-textarea"
                    rows={4}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    required
                    placeholder="Provide a comprehensive summary of syllabus topics and learning outcomes..."
                  />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.75rem' }}>
                  <input
                    type="checkbox"
                    id="published-check"
                    checked={published}
                    onChange={(e) => setPublished(e.target.checked)}
                    style={{ width: 18, height: 18, accentColor: 'var(--color-orange)' }}
                  />
                  <label htmlFor="published-check" style={{ fontSize: '0.9rem', fontWeight: 600, cursor: 'pointer' }}>
                    Publish immediately (visible to all students)
                  </label>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                  <button type="button" onClick={() => setModalOpen(false)} className="btn btn-outline">
                    Cancel
                  </button>
                  <button type="submit" disabled={saving} className="btn btn-primary">
                    {saving ? 'Saving...' : editingCourse ? 'Save Changes' : 'Create Course'}
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
