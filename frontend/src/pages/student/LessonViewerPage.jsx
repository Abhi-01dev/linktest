import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import {
  BookOpen,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  PlayCircle,
  FileText,
  Sparkles,
  ArrowLeft,
  Check,
  Award
} from 'lucide-react';

export function LessonViewerPage() {
  const { courseId, lessonId } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [course, setCourse] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [currentLesson, setCurrentLesson] = useState(null);
  const [isCompleted, setIsCompleted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [courseData, lessonsList] = await Promise.all([
          api.getCourseById(courseId),
          api.getLessons(courseId)
        ]);

        setCourse(courseData.course);
        setLessons(lessonsList || []);

        const targetLesson = (lessonsList || []).find(l => l.id === lessonId) || lessonsList[0];
        if (targetLesson) {
          setCurrentLesson(targetLesson);
          setIsCompleted(targetLesson.completed || false);
        }
      } catch (err) {
        console.error('Failed to load lesson:', err);
        showToast('Error loading lesson content', 'error');
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [courseId, lessonId]);

  const handleToggleComplete = async () => {
    if (!currentLesson) return;
    setToggling(true);
    const newStatus = !isCompleted;

    try {
      const res = await api.setProgress(currentLesson.id, newStatus);
      setIsCompleted(newStatus);
      // update state in lessons list
      setLessons(prev =>
        prev.map(l => (l.id === currentLesson.id ? { ...l, completed: newStatus } : l))
      );
      showToast(
        newStatus ? 'Lesson marked as completed! 🎉' : 'Lesson marked as incomplete.',
        'success'
      );
    } catch (err) {
      showToast(err.message || 'Failed to update progress', 'error');
    } finally {
      setToggling(false);
    }
  };

  const currentIndex = lessons.findIndex(l => l.id === currentLesson?.id);
  const prevLesson = currentIndex > 0 ? lessons[currentIndex - 1] : null;
  const nextLesson = currentIndex < lessons.length - 1 ? lessons[currentIndex + 1] : null;

  const completedCount = lessons.filter(l => l.completed).length;
  const progressPct = lessons.length > 0 ? Math.round((completedCount / lessons.length) * 100) : 0;

  // Convert YouTube regular URL to embed URL if applicable
  const getEmbedUrl = (url) => {
    if (!url) return null;
    if (url.includes('youtube.com/watch?v=')) {
      const vidId = url.split('v=')[1]?.split('&')[0];
      return `https://www.youtube.com/embed/${vidId}`;
    }
    if (url.includes('youtu.be/')) {
      const vidId = url.split('youtu.be/')[1]?.split('?')[0];
      return `https://www.youtube.com/embed/${vidId}`;
    }
    return url;
  };

  if (loading) {
    return (
      <div className="container" style={{ padding: '4rem 1.5rem' }}>
        <div className="skeleton" style={{ height: '40px', width: '50%', marginBottom: '2rem' }} />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 3fr', gap: '2rem' }}>
          <div className="skeleton" style={{ height: '400px' }} />
          <div className="skeleton" style={{ height: '400px' }} />
        </div>
      </div>
    );
  }

  if (!currentLesson) {
    return (
      <div className="container" style={{ padding: '5rem 1.5rem', textAlign: 'center' }}>
        <h2>Lesson Not Found</h2>
        <Link to={`/courses/${courseId}`} className="btn btn-primary" style={{ marginTop: '1rem' }}>
          Back to Course Syllabus
        </Link>
      </div>
    );
  }

  return (
    <div style={{ padding: '2rem 0 5rem' }}>
      <div className="container">
        {/* Top Breadcrumb & Progress Bar */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1rem',
            marginBottom: '1.75rem',
            paddingBottom: '1rem',
            borderBottom: '1px solid var(--color-border)'
          }}
        >
          <div>
            <Link
              to={`/courses/${courseId}`}
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
              <span>{course?.title || 'Course Syllabus'}</span>
            </Link>
            <h1 style={{ fontSize: '1.6rem' }}>{currentLesson.title}</h1>
          </div>

          {/* Progress Badge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>
                Course Progress: {progressPct}%
              </div>
              <div
                style={{
                  width: '120px',
                  height: 6,
                  background: 'var(--color-border)',
                  borderRadius: 'var(--radius-full)',
                  overflow: 'hidden',
                  marginTop: '0.25rem'
                }}
              >
                <div
                  style={{
                    width: `${progressPct}%`,
                    height: '100%',
                    background: 'var(--color-orange)',
                    transition: 'width 0.3s'
                  }}
                />
              </div>
            </div>

            <button
              onClick={handleToggleComplete}
              disabled={toggling}
              className={`btn btn-sm ${isCompleted ? 'btn-outline' : 'btn-primary'}`}
              style={{
                borderColor: isCompleted ? 'var(--color-success)' : undefined,
                color: isCompleted ? 'var(--color-success)' : undefined
              }}
            >
              {isCompleted ? (
                <>
                  <Check size={16} />
                  <span>Completed ✓</span>
                </>
              ) : (
                <>
                  <CheckCircle2 size={16} />
                  <span>Mark as Done</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Two-Column Responsive Layout */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(260px, 300px) 1fr',
            gap: '2.5rem',
            alignItems: 'start'
          }}
          className="lesson-viewer-layout"
        >
          {/* Left Column: Syllabus Navigation */}
          <div className="card" style={{ padding: '1.25rem', position: 'sticky', top: '90px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
              <BookOpen size={18} style={{ color: 'var(--color-orange)' }} />
              <h3 style={{ fontSize: '1.05rem' }}>Course Modules</h3>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              {lessons.map((lesson, idx) => {
                const isActive = lesson.id === currentLesson.id;
                return (
                  <button
                    key={lesson.id}
                    onClick={() => navigate(`/courses/${courseId}/lessons/${lesson.id}`)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      padding: '0.7rem 0.85rem',
                      borderRadius: 'var(--radius-md)',
                      textAlign: 'left',
                      background: isActive ? 'var(--color-orange-light)' : 'transparent',
                      border: `1px solid ${isActive ? 'var(--color-orange)' : 'transparent'}`,
                      color: isActive ? 'var(--color-orange-dark)' : 'var(--color-text-primary)',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <div
                      style={{
                        width: 24,
                        height: 24,
                        borderRadius: '50%',
                        background: lesson.completed
                          ? 'var(--color-success)'
                          : isActive
                          ? 'var(--color-orange)'
                          : 'var(--color-border)',
                        color: '#FFFFFF',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        flexShrink: 0
                      }}
                    >
                      {lesson.completed ? <Check size={14} /> : idx + 1}
                    </div>
                    <span
                      style={{
                        fontSize: '0.85rem',
                        fontWeight: isActive ? 700 : 500,
                        lineHeight: 1.3,
                        flex: 1
                      }}
                    >
                      {lesson.title}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Quick Link to Assessment */}
            <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid var(--color-border)' }}>
              <Link
                to={`/courses/${courseId}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  color: 'var(--color-navy)'
                }}
              >
                <Award size={16} style={{ color: 'var(--color-orange)' }} />
                <span>Go to Course Assessment</span>
              </Link>
            </div>
          </div>

          {/* Right Column: Lesson Content Viewport */}
          <div>
            {/* Embedded Video (if provided) */}
            {currentLesson.video_url && (
              <div
                style={{
                  width: '100%',
                  aspectRatio: '16/9',
                  borderRadius: 'var(--radius-lg)',
                  overflow: 'hidden',
                  background: '#000000',
                  marginBottom: '2rem',
                  boxShadow: 'var(--shadow-md)'
                }}
              >
                <iframe
                  src={getEmbedUrl(currentLesson.video_url)}
                  title={currentLesson.title}
                  style={{ width: '100%', height: '100%', border: 'none' }}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            )}

            {/* Structured Lesson Content Card */}
            <div className="card" style={{ padding: '2.5rem', marginBottom: '2rem' }}>
              <div
                style={{
                  fontSize: '1rem',
                  lineHeight: 1.7,
                  color: 'var(--color-text-primary)'
                }}
              >
                {/* Clean formatted lesson content render */}
                <div style={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit' }}>
                  {currentLesson.content}
                </div>
              </div>
            </div>

            {/* Quick Student Scratch Notes */}
            <div className="card" style={{ padding: '1.75rem', marginBottom: '2rem', background: 'var(--color-bg-alt)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                <FileText size={18} style={{ color: 'var(--color-navy)' }} />
                <h4 style={{ fontSize: '1rem' }}>My Study Notes</h4>
              </div>
              <textarea
                className="form-textarea"
                rows={3}
                placeholder="Jot down personal key takeaways or questions for the AI tutor..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                style={{ background: '#FFFFFF' }}
              />
            </div>

            {/* Bottom Lesson Navigation */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '1rem',
                paddingTop: '1.5rem',
                borderTop: '1px solid var(--color-border)'
              }}
            >
              {prevLesson ? (
                <button
                  onClick={() => navigate(`/courses/${courseId}/lessons/${prevLesson.id}`)}
                  className="btn btn-outline"
                >
                  <ChevronLeft size={16} />
                  <span>Previous: {prevLesson.title.substring(0, 24)}...</span>
                </button>
              ) : (
                <div />
              )}

              {nextLesson ? (
                <button
                  onClick={() => navigate(`/courses/${courseId}/lessons/${nextLesson.id}`)}
                  className="btn btn-primary"
                >
                  <span>Next: {nextLesson.title.substring(0, 24)}...</span>
                  <ChevronRight size={16} />
                </button>
              ) : (
                <Link to={`/courses/${courseId}`} className="btn btn-secondary">
                  <span>Back to Syllabus / Assessment</span>
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 860px) {
          .lesson-viewer-layout {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
