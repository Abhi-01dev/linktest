import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import {
  BookOpen,
  User,
  CheckCircle2,
  PlayCircle,
  Award,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  Lock
} from 'lucide-react';

export function CourseDetailPage() {
  const { id } = useParams();
  const { user, isAuthenticated } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [course, setCourse] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const data = await api.getCourseById(id);
        setCourse(data.course);
        setLessons(data.lessons || []);
        setIsEnrolled(data.is_enrolled || false);

        if (isAuthenticated) {
          try {
            const qList = await api.getQuizzesByCourse(id);
            setQuizzes(qList || []);
          } catch (err) {
            console.warn('Quizzes not loaded:', err.message);
          }
        }
      } catch (err) {
        console.error('Failed to load course details:', err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [id, isAuthenticated]);

  const handleEnroll = async () => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: { pathname: `/courses/${id}` } } });
      return;
    }

    setEnrolling(true);
    try {
      await api.enrollCourse(id);
      setIsEnrolled(true);
      showToast('Enrolled successfully! Ready to start learning.', 'success');
    } catch (err) {
      showToast(err.message || 'Enrollment failed', 'error');
    } finally {
      setEnrolling(false);
    }
  };

  if (loading) {
    return (
      <div className="container" style={{ padding: '4rem 1.5rem' }}>
        <div className="skeleton" style={{ height: '280px', borderRadius: 'var(--radius-lg)', marginBottom: '2rem' }} />
        <div className="skeleton" style={{ height: '30px', width: '40%', marginBottom: '1rem' }} />
        <div className="skeleton" style={{ height: '80px', marginBottom: '2rem' }} />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="container" style={{ padding: '5rem 1.5rem', textAlign: 'center' }}>
        <h2>Course Not Found</h2>
        <p style={{ marginTop: '0.5rem', marginBottom: '1.5rem' }}>The requested course could not be located.</p>
        <Link to="/courses" className="btn btn-primary">
          Back to Courses
        </Link>
      </div>
    );
  }

  return (
    <div style={{ padding: '3rem 0 5rem' }}>
      <div className="container">
        {/* Course Banner */}
        <div
          className="card"
          style={{
            padding: '2.5rem',
            background: 'linear-gradient(135deg, var(--color-navy) 0%, var(--color-navy-dark) 100%)',
            color: '#FFFFFF',
            border: 'none',
            marginBottom: '3rem',
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          <div style={{ maxWidth: '780px' }}>
            <span
              className="badge"
              style={{
                background: 'rgba(249, 115, 22, 0.2)',
                color: '#FB923C',
                border: '1px solid rgba(249, 115, 22, 0.3)',
                marginBottom: '1rem'
              }}
            >
              {course.category}
            </span>
            <h1
              style={{
                fontSize: 'clamp(1.8rem, 3.5vw, 2.6rem)',
                color: '#FFFFFF',
                lineHeight: 1.25,
                marginBottom: '1rem'
              }}
            >
              {course.title}
            </h1>
            <p style={{ color: '#CBD5E1', fontSize: '1.05rem', lineHeight: 1.6, marginBottom: '2rem' }}>
              {course.description}
            </p>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '2rem',
                flexWrap: 'wrap',
                marginBottom: '2rem',
                fontSize: '0.9rem',
                color: '#94A3B8'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <User size={16} style={{ color: '#F97316' }} />
                <span>Instructor: <strong style={{ color: '#FFFFFF' }}>{course.instructor_name}</strong></span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <BookOpen size={16} style={{ color: '#F97316' }} />
                <span>Lessons: <strong style={{ color: '#FFFFFF' }}>{lessons.length} Modules</strong></span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Award size={16} style={{ color: '#F97316' }} />
                <span>Assessment: <strong style={{ color: '#FFFFFF' }}>Verified Quiz Included</strong></span>
              </div>
            </div>

            {/* Action Bar */}
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              {isEnrolled ? (
                <Link
                  to={lessons.length > 0 ? `/courses/${id}/lessons/${lessons[0].id}` : '#'}
                  className="btn btn-primary btn-lg"
                >
                  <CheckCircle2 size={18} />
                  <span>Enrolled • Continue Learning</span>
                </Link>
              ) : (
                <button
                  onClick={handleEnroll}
                  disabled={enrolling}
                  className="btn btn-primary btn-lg"
                >
                  <BookOpen size={18} />
                  <span>{enrolling ? 'Enrolling...' : 'Enroll in Course (Free)'}</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Content Layout: Lessons Syllabus & Assessments */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2.5rem' }}>
          {/* Syllabus Column */}
          <div>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <BookOpen size={22} style={{ color: 'var(--color-orange)' }} />
              <span>Course Syllabus & Lessons</span>
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {lessons.map((lesson, idx) => {
                const canAccess = isEnrolled || isAuthenticated;
                return (
                  <div
                    key={lesson.id}
                    className="card card-interactive"
                    style={{
                      padding: '1.25rem 1.5rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '1rem'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <div
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: 'var(--radius-md)',
                          background: lesson.completed ? 'var(--color-success-bg)' : 'var(--color-bg-alt)',
                          color: lesson.completed ? 'var(--color-success)' : 'var(--color-navy)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 700,
                          fontSize: '0.875rem'
                        }}
                      >
                        {lesson.completed ? <CheckCircle2 size={20} /> : idx + 1}
                      </div>
                      <div>
                        <h4 style={{ fontSize: '1rem', marginBottom: '0.2rem' }}>{lesson.title}</h4>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                            <PlayCircle size={13} /> Interactive Content
                          </span>
                          {lesson.completed && (
                            <span style={{ color: 'var(--color-success)', fontWeight: 600 }}>
                              Completed ✓
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {canAccess ? (
                      <Link
                        to={`/courses/${id}/lessons/${lesson.id}`}
                        className="btn btn-outline btn-sm"
                      >
                        <span>Open Lesson</span>
                        <ArrowRight size={14} />
                      </Link>
                    ) : (
                      <button
                        onClick={handleEnroll}
                        className="btn btn-ghost btn-sm"
                        style={{ color: 'var(--color-text-muted)' }}
                      >
                        <Lock size={14} />
                        <span>Enroll to view</span>
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Assessment & AI Helper Column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Assessment Card */}
            <div className="card" style={{ padding: '1.75rem', borderLeft: '4px solid var(--color-orange)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                <Award size={22} style={{ color: 'var(--color-orange)' }} />
                <h3 style={{ fontSize: '1.25rem' }}>Course Assessment</h3>
              </div>
              <p style={{ fontSize: '0.9rem', marginBottom: '1.25rem' }}>
                Test your understanding with 5 server-scored multiple-choice questions. Immediate explanations provided upon submission.
              </p>

              {quizzes.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {quizzes.map(quiz => (
                    <div
                      key={quiz.id}
                      style={{
                        padding: '1rem',
                        background: 'var(--color-bg-alt)',
                        borderRadius: 'var(--radius-md)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.75rem'
                      }}
                    >
                      <div>
                        <strong style={{ fontSize: '0.95rem' }}>{quiz.title}</strong>
                        <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '0.2rem' }}>
                          {quiz.description || 'Comprehensive evaluation'}
                        </p>
                      </div>
                      <Link to={`/quiz/${quiz.id}`} className="btn btn-primary btn-sm">
                        <span>Take Assessment</span>
                        <ArrowRight size={14} />
                      </Link>
                    </div>
                  ))}
                </div>
              ) : (
                <div>
                  <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '1rem' }}>
                    {isAuthenticated ? 'Loading quiz evaluations...' : 'Log in to take the course assessment.'}
                  </p>
                  <Link
                    to={isAuthenticated ? `/quiz/quiz-web-dev-01` : `/login`}
                    className="btn btn-outline btn-sm"
                  >
                    <span>{isAuthenticated ? 'Take Assessment' : 'Sign in to Take Quiz'}</span>
                  </Link>
                </div>
              )}
            </div>

            {/* AI Tutor Callout Card */}
            <div
              className="card"
              style={{
                padding: '1.75rem',
                background: 'var(--color-bg-alt)',
                border: '1px dashed var(--color-border)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.65rem' }}>
                <Sparkles size={20} style={{ color: 'var(--color-orange)' }} />
                <h3 style={{ fontSize: '1.15rem' }}>Have questions about this course?</h3>
              </div>
              <p style={{ fontSize: '0.875rem', marginBottom: '1.25rem' }}>
                Ask LinkTest AI Tutor to clarify any syllabus topics, explain complex algorithms, or walk through code.
              </p>
              <Link to="/ai-tutor" className="btn btn-secondary btn-sm">
                <Sparkles size={14} />
                <span>Chat with AI Tutor</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
