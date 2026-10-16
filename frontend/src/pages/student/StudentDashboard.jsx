import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import {
  BookOpen,
  Award,
  CheckCircle2,
  TrendingUp,
  Sparkles,
  ArrowRight,
  Clock,
  Play,
  RotateCcw,
  Video,
  Radio,
  FileCheck2,
  ShieldCheck,
  Camera,
  AlertTriangle
} from 'lucide-react';
import { StudentNav } from '../../components/student/StudentNav';

export function StudentDashboard() {
  const { user } = useAuth();
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [quizAttempts, setQuizAttempts] = useState([]);
  const [mockTests, setMockTests] = useState([]);
  const [mockResults, setMockTestResults] = useState([]);
  const [liveClasses, setLiveClasses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboardData() {
      try {
        const [courses, attempts, tests, lives, results] = await Promise.all([
          api.getMyCourses().catch(() => []),
          api.getMyAttempts().catch(() => []),
          api.getMockTests({ status: 'published' }).catch(() => []),
          api.getStudentLiveClasses().catch(() => []),
          api.getMyMockTestResults().catch(() => [])
        ]);
        setEnrolledCourses(courses || []);
        setQuizAttempts(attempts || []);
        setMockTests(Array.isArray(tests) ? tests : []);
        setLiveClasses(Array.isArray(lives) ? lives : []);
        setMockTestResults(Array.isArray(results) ? results : []);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadDashboardData();
  }, []);

  const totalLessonsCompleted = enrolledCourses.reduce(
    (acc, c) => acc + (c.completed_lessons || 0),
    0
  );

  const avgQuizScore = quizAttempts.length > 0
    ? Math.round(
        quizAttempts.reduce((acc, q) => acc + (q.score / q.total_questions) * 100, 0) /
          quizAttempts.length
      )
    : 0;

  const currentCourse = enrolledCourses[0] || null;

  return (
    <div style={{ padding: '1.5rem 0 3.5rem' }}>
      <div className="container">
        <StudentNav />
        {/* Welcome Banner */}
        <div
          className="card"
          style={{
            background: 'linear-gradient(135deg, var(--color-navy) 0%, var(--color-navy-dark) 100%)',
            color: '#FFFFFF',
            padding: '1.75rem 2rem',
            border: 'none',
            borderRadius: 'var(--radius-lg)',
            marginBottom: '1.75rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1.25rem'
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
              <span
                style={{
                  fontSize: '0.68rem',
                  fontWeight: 700,
                  letterSpacing: '0.05em',
                  padding: '0.15rem 0.5rem',
                  borderRadius: '4px',
                  background: 'rgba(240, 253, 244, 0.15)',
                  color: '#86EFAC',
                  border: '1px solid rgba(134, 239, 172, 0.3)'
                }}
              >
                STUDENT PORTAL
              </span>
            </div>
            <h1 style={{ fontSize: '1.75rem', color: '#FFFFFF', marginBottom: '0.35rem', fontWeight: 800 }}>
              Welcome back, {user?.full_name?.split(' ')[0] || user?.full_name || 'Learner'}! 👋
            </h1>
            <p style={{ color: '#94A3B8', fontSize: '0.9rem', margin: 0 }}>
              Track your technical coursework, assessment evaluations, and AI study sessions.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap' }}>
            <Link to="/courses" className="btn btn-outline" style={{ background: 'rgba(255,255,255,0.08)', color: '#FFFFFF', borderColor: 'rgba(255,255,255,0.2)', padding: '0.5rem 0.95rem', fontSize: '0.85rem' }}>
              <BookOpen size={15} />
              <span>Browse Catalog</span>
            </Link>
            <Link to="/ai-tutor" className="btn btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}>
              <Sparkles size={15} />
              <span>Ask AI Tutor</span>
            </Link>
          </div>
        </div>

        {/* Top KPI Metrics Cards */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
            gap: '1.25rem',
            marginBottom: '2rem'
          }}
        >
          <div className="card" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>Enrolled Courses</span>
              <BookOpen size={20} style={{ color: 'var(--color-orange)' }} />
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--color-navy)' }}>
              {enrolledCourses.length}
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Active curriculum tracks</span>
          </div>

          <div className="card" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>Completed Lessons</span>
              <CheckCircle2 size={20} style={{ color: 'var(--color-success)' }} />
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--color-navy)' }}>
              {totalLessonsCompleted}
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Modules finished</span>
          </div>

          <div className="card" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>Quizzes Taken</span>
              <Award size={20} style={{ color: '#2563EB' }} />
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--color-navy)' }}>
              {quizAttempts.length}
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Evaluations recorded</span>
          </div>

          <div className="card" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>Average Score</span>
              <TrendingUp size={20} style={{ color: '#10B981' }} />
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: avgQuizScore >= 60 ? 'var(--color-success)' : 'var(--color-orange)' }}>
              {avgQuizScore}%
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Server-graded assessments</span>
          </div>
        </div>

        {/* Continue Learning Callout (if enrolled in any course) */}
        {currentCourse && (
          <div
            className="card"
            style={{
              padding: '1.75rem',
              marginBottom: '2.5rem',
              borderLeft: '5px solid var(--color-orange)',
              background: '#FFFFFF'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <span className="badge badge-orange" style={{ marginBottom: '0.5rem' }}>
                  Continue Learning
                </span>
                <h3 style={{ fontSize: '1.35rem', marginBottom: '0.35rem' }}>
                  {currentCourse.title}
                </h3>
                <p style={{ fontSize: '0.875rem' }}>
                  Progress: {currentCourse.completed_lessons || 0} of {currentCourse.total_lessons || 3} lessons completed ({currentCourse.progress_percentage || 0}%)
                </p>
              </div>

              <Link
                to={`/courses/${currentCourse.id}`}
                className="btn btn-primary"
              >
                <Play size={16} />
                <span>Resume Course</span>
              </Link>
            </div>

            {/* Progress Bar */}
            <div
              style={{
                width: '100%',
                height: 8,
                background: 'var(--color-border)',
                borderRadius: 'var(--radius-full)',
                marginTop: '1.25rem',
                overflow: 'hidden'
              }}
            >
              <div
                style={{
                  width: `${currentCourse.progress_percentage || 0}%`,
                  height: '100%',
                  background: 'var(--color-orange-gradient)',
                  borderRadius: 'var(--radius-full)',
                  transition: 'width 0.5s ease'
                }}
              />
            </div>
          </div>
        )}

        {/* Live Classes Alert Banner if any sessions are ongoing or scheduled */}
        {liveClasses.length > 0 && (
          <div
            className="card"
            style={{
              padding: '1.25rem 1.5rem',
              marginBottom: '2rem',
              border: liveClasses.some(l => l.status === 'ongoing') ? '2px solid #16A34A' : '1px solid var(--color-border)',
              background: liveClasses.some(l => l.status === 'ongoing') ? '#F0FDF4' : '#F8FAFC',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '1rem'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
              <div
                style={{
                  padding: '0.6rem',
                  borderRadius: '10px',
                  background: liveClasses.some(l => l.status === 'ongoing') ? '#DCFCE7' : '#EFF6FF',
                  color: liveClasses.some(l => l.status === 'ongoing') ? '#16A34A' : '#2563EB'
                }}
              >
                <Video size={22} />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
                  <span
                    style={{
                      fontSize: '0.72rem',
                      fontWeight: 800,
                      textTransform: 'uppercase',
                      padding: '0.15rem 0.5rem',
                      borderRadius: '999px',
                      background: liveClasses.some(l => l.status === 'ongoing') ? '#DCFCE7' : '#E0E7FF',
                      color: liveClasses.some(l => l.status === 'ongoing') ? '#166534' : '#3730A3',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.3rem'
                    }}
                  >
                    <Radio size={11} />
                    {liveClasses.some(l => l.status === 'ongoing') ? 'Broadcast Live Now' : 'Scheduled Lectures'}
                  </span>
                  <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#0F172A' }}>
                    {liveClasses.length} Virtual Classroom Session{liveClasses.length > 1 ? 's' : ''}
                  </span>
                </div>
                <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748B' }}>
                  Join interactive faculty lectures, doubt clearing workshops, and cohort seminar meetings.
                </p>
              </div>
            </div>
            <Link
              to="/live-classes"
              className="btn btn-sm btn-primary"
              style={{
                background: liveClasses.some(l => l.status === 'ongoing') ? '#16A34A' : undefined,
                borderColor: liveClasses.some(l => l.status === 'ongoing') ? '#16A34A' : undefined,
                fontWeight: 700
              }}
            >
              <span>{liveClasses.some(l => l.status === 'ongoing') ? 'Join Live Room Now' : 'View Schedule'}</span>
              <ArrowRight size={14} />
            </Link>
          </div>
        )}

        {/* My Examination Results Section */}
        {mockResults.length > 0 && (
          <div style={{ marginBottom: '2.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
                  <span style={{
                    fontSize: '0.72rem',
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    color: '#2563EB',
                    background: 'rgba(37, 99, 235, 0.1)',
                    padding: '0.15rem 0.5rem',
                    borderRadius: '4px',
                    border: '1px solid rgba(37, 99, 235, 0.25)'
                  }}>
                    SCORECARDS & OUTCOMES
                  </span>
                </div>
                <h2 style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--color-navy)', margin: 0 }}>
                  My Results
                </h2>
              </div>
              <span style={{ fontSize: '0.85rem', color: '#64748B', fontWeight: 600 }}>
                {mockResults.filter(r => r.is_released).length} Released • {mockResults.filter(r => !r.is_released).length} In Evaluation
              </span>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
              gap: '1.25rem'
            }}>
              {mockResults.slice(0, 4).map(res => {
                const isReleased = res.is_released || res.result_status === 'RELEASED';
                const isPending = res.result_status === 'PENDING_EVALUATION';

                return (
                  <div
                    key={res.id || res.attempt_id}
                    className="card"
                    style={{
                      padding: '1.5rem',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      border: isReleased ? '1px solid #BFDBFE' : '1px solid var(--color-border)',
                      background: '#FFFFFF',
                      boxShadow: isReleased ? '0 4px 14px rgba(37, 99, 235, 0.06)' : 'none',
                      borderRadius: '12px'
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem', gap: '0.5rem' }}>
                        <span style={{
                          fontSize: '0.72rem',
                          fontWeight: 800,
                          textTransform: 'uppercase',
                          padding: '0.2rem 0.5rem',
                          borderRadius: '999px',
                          background: isReleased ? '#ECFDF5' : isPending ? '#FFFBEB' : '#EFF6FF',
                          color: isReleased ? '#059669' : isPending ? '#B45309' : '#2563EB',
                          border: `1px solid ${isReleased ? '#A7F3D0' : isPending ? '#FDE68A' : '#BFDBFE'}`
                        }}>
                          {isReleased ? 'RELEASED' : isPending ? 'PENDING EVALUATION' : 'UNDER REVIEW'}
                        </span>

                        {isReleased && (
                          <span style={{
                            fontSize: '0.7rem',
                            fontWeight: 800,
                            color: '#2563EB',
                            background: '#EFF6FF',
                            padding: '0.15rem 0.45rem',
                            borderRadius: '4px'
                          }}>
                            NEW RESULT AVAILABLE
                          </span>
                        )}
                      </div>

                      <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--color-navy)', margin: '0 0 0.35rem' }}>
                        {res.test_title}
                      </h3>
                      <div style={{ fontSize: '0.8rem', color: '#64748B', marginBottom: '1rem' }}>
                        {res.subject} • Completed on {new Date(res.submitted_at || Date.now()).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </div>

                      <div style={{
                        background: '#F8FAFC',
                        borderRadius: '8px',
                        padding: '0.75rem 1rem',
                        marginBottom: '1rem',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}>
                        <div>
                          <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>SCORE</div>
                          <div style={{ fontSize: '1.25rem', fontWeight: 900, color: isReleased ? (res.passed ? '#059669' : '#DC2626') : '#2563EB' }}>
                            {isReleased ? `${res.total_score} / ${res.max_score}` : (isPending ? 'Pending Evaluation' : `${res.total_score} / ${res.max_score}`)}
                          </div>
                        </div>
                        {isReleased && (
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>PERCENTAGE</div>
                            <div style={{ fontSize: '1.1rem', fontWeight: 800, color: res.passed ? '#059669' : '#DC2626' }}>
                              {res.percentage}%
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    <Link
                      to={`/mock-tests/attempts/${res.attempt_id || res.id}/result`}
                      className={`btn btn-sm ${isReleased ? 'btn-primary' : 'btn-secondary'}`}
                      style={{
                        width: '100%',
                        display: 'inline-flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        gap: '0.4rem',
                        fontWeight: 700
                      }}
                    >
                      <Award size={15} />
                      <span>View Result</span>
                    </Link>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Proctored Mock Tests & Examinations Section */}
        <div style={{ marginBottom: '2.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
                <span
                  style={{
                    fontSize: '0.72rem',
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    color: 'var(--color-orange-dark)',
                    background: 'rgba(249, 115, 22, 0.1)',
                    padding: '0.15rem 0.5rem',
                    borderRadius: '4px',
                    border: '1px solid rgba(249, 115, 22, 0.25)'
                  }}
                >
                  ASSESSMENTS & SCREENINGS
                </span>
              </div>
              <h2 style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--color-navy)', margin: 0 }}>
                Available Mock Tests & Examinations
              </h2>
            </div>
            <Link
              to="/mock-tests"
              style={{
                fontSize: '0.875rem',
                color: 'var(--color-orange-dark)',
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem'
              }}
            >
              <span>View All Mock Tests ({mockTests.length})</span>
              <ArrowRight size={14} />
            </Link>
          </div>

          {mockTests.length === 0 ? (
            <div className="card" style={{ padding: '2.5rem', textAlign: 'center' }}>
              <FileCheck2 size={38} style={{ color: 'var(--color-text-muted)', margin: '0 auto 1rem' }} />
              <h4 style={{ marginBottom: '0.4rem', color: 'var(--color-navy)' }}>No Mock Tests Currently Available</h4>
              <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginBottom: '1.25rem' }}>
                Your instructors have not published any examination assessments yet. They will appear here once released.
              </p>
              <Link to="/mock-tests" className="btn btn-outline btn-sm">
                Explore Examination Portal
              </Link>
            </div>
          ) : (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                gap: '1.25rem'
              }}
            >
              {mockTests.slice(0, 3).map((test) => {
                const durationMinutes = test.duration_minutes ?? test.durationMinutes ?? 60;
                const totalMarks = test.total_marks ?? test.totalMarks ?? 100;
                const maxAttempts = test.max_attempts ?? test.maxAttempts ?? 3;
                const attemptsUsed = test.attempts_used ?? test.attemptsUsed ?? 0;
                const rawAttemptId = test.active_attempt_id || test.activeAttemptId;
                const hasActiveAttempt = Boolean(rawAttemptId && rawAttemptId !== 'undefined' && rawAttemptId !== 'null' && String(rawAttemptId).trim());
                const activeAttemptId = hasActiveAttempt ? rawAttemptId : null;
                const canAttempt = test.can_attempt !== undefined
                  ? Boolean(test.can_attempt)
                  : (test.status === 'published' && (!maxAttempts || attemptsUsed < maxAttempts));
                const isProctored = Boolean(test.proctoring_config?.webcam_required ?? test.proctoringConfig?.webcam_required);

                return (
                  <div
                    key={test.id}
                    className="card card-interactive"
                    style={{
                      padding: '1.35rem',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      border: '1px solid var(--color-border)'
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                        <span
                          style={{
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            color: 'var(--color-orange-dark)',
                            textTransform: 'uppercase',
                            letterSpacing: '0.04em'
                          }}
                        >
                          {test.subject || 'General'}
                        </span>
                        {isProctored ? (
                          <span
                            style={{
                              fontSize: '0.68rem',
                              fontWeight: 700,
                              background: '#FEE2E2',
                              color: '#DC2626',
                              padding: '0.15rem 0.45rem',
                              borderRadius: '4px',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.25rem'
                            }}
                          >
                            <Camera size={11} />
                            Proctored
                          </span>
                        ) : (
                          <span
                            style={{
                              fontSize: '0.68rem',
                              fontWeight: 600,
                              background: '#F1F5F9',
                              color: '#64748B',
                              padding: '0.15rem 0.45rem',
                              borderRadius: '4px'
                            }}
                          >
                            Standard
                          </span>
                        )}
                      </div>

                      <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--color-navy)', marginBottom: '0.4rem', lineHeight: 1.35 }}>
                        {test.title}
                      </h4>

                      {test.description && (
                        <p
                          style={{
                            fontSize: '0.82rem',
                            color: 'var(--color-text-secondary)',
                            marginBottom: '1rem',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden'
                          }}
                        >
                          {test.description}
                        </p>
                      )}

                      <div
                        style={{
                          display: 'grid',
                          gridTemplateColumns: '1fr 1fr',
                          gap: '0.4rem',
                          background: '#F8FAFC',
                          padding: '0.65rem 0.75rem',
                          borderRadius: '6px',
                          fontSize: '0.78rem',
                          color: '#475569',
                          marginBottom: '1.15rem'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                          <Clock size={13} style={{ color: 'var(--color-orange)' }} />
                          <span><strong>{durationMinutes}</strong> mins</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                          <Award size={13} style={{ color: '#2563EB' }} />
                          <span><strong>{totalMarks}</strong> Marks</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                          <RotateCcw size={13} style={{ color: '#7C3AED' }} />
                          <span>Attempts: <strong>{attemptsUsed}/{maxAttempts}</strong></span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                          <CheckCircle2 size={13} style={{ color: '#16A34A' }} />
                          <span>Pass: <strong>{test.pass_percentage ?? test.passPercentage ?? 40}%</strong></span>
                        </div>
                      </div>
                    </div>

                    <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '0.85rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.75rem', color: '#64748B' }}>
                        {attemptsUsed > 0 ? `Completed (${attemptsUsed})` : 'Not attempted'}
                      </span>

                      {hasActiveAttempt ? (
                        <Link
                          to={`/mock-tests/${test.id}/runner/${activeAttemptId}`}
                          className="btn btn-sm btn-warning"
                          style={{ fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
                        >
                          <Play size={13} />
                          <span>Resume Exam</span>
                        </Link>
                      ) : canAttempt ? (
                        test.join_request_status === 'APPROVED' ? (
                          <Link
                            to={`/mock-tests/${test.id}/check`}
                            className="btn btn-sm btn-primary"
                            style={{ fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '0.3rem', background: '#16A34A', borderColor: '#16A34A' }}
                          >
                            <Play size={13} />
                            <span>Start Mock Test</span>
                          </Link>
                        ) : test.join_request_status === 'PENDING' ? (
                          <span
                            className="badge"
                            style={{ background: '#FEF3C7', color: '#B45309', border: '1px solid #FCD34D', padding: '0.35rem 0.6rem', fontSize: '0.75rem', fontWeight: 700 }}
                          >
                            Pending Approval
                          </span>
                        ) : test.join_request_status === 'REJECTED' ? (
                          <Link
                            to="/mock-tests"
                            className="btn btn-sm btn-outline"
                            style={{ fontWeight: 600, color: '#DC2626', borderColor: '#DC2626', padding: '0.25rem 0.6rem', fontSize: '0.75rem' }}
                          >
                            Request Again
                          </Link>
                        ) : (
                          <Link
                            to="/mock-tests"
                            className="btn btn-sm btn-primary"
                            style={{ fontWeight: 700, padding: '0.25rem 0.65rem', fontSize: '0.75rem' }}
                          >
                            Request to Join
                          </Link>
                        )
                      ) : attemptsUsed > 0 ? (
                        <Link
                          to={`/mock-tests/history?test_id=${test.id}`}
                          className="btn btn-sm btn-secondary"
                          style={{ fontWeight: 600 }}
                        >
                          View Results
                        </Link>
                      ) : (
                        <button disabled className="btn btn-sm btn-secondary" style={{ opacity: 0.6, cursor: 'not-allowed' }}>
                          Unavailable
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Two-Column Grid: Enrolled Courses & Recent Quiz Scores */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '2.5rem' }}>
          {/* Enrolled Courses */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h2 style={{ fontSize: '1.4rem' }}>My Enrolled Courses</h2>
              <Link to="/courses" style={{ fontSize: '0.875rem', color: 'var(--color-orange-dark)', fontWeight: 600 }}>
                Explore more
              </Link>
            </div>

            {enrolledCourses.length === 0 ? (
              <div className="card" style={{ padding: '2.5rem', textAlign: 'center' }}>
                <BookOpen size={36} style={{ color: 'var(--color-text-muted)', margin: '0 auto 1rem' }} />
                <h4 style={{ marginBottom: '0.5rem' }}>No Enrolled Courses Yet</h4>
                <p style={{ fontSize: '0.875rem', marginBottom: '1.5rem' }}>
                  Select a course from the catalogue to start watching lessons and taking quizzes.
                </p>
                <Link to="/courses" className="btn btn-primary btn-sm">
                  Browse Courses
                </Link>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {enrolledCourses.map(c => (
                  <div key={c.id} className="card card-interactive" style={{ padding: '1.25rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                      <div>
                        <span className="badge badge-orange" style={{ fontSize: '0.7rem', marginBottom: '0.35rem' }}>
                          {c.category}
                        </span>
                        <h4 style={{ fontSize: '1.05rem' }}>{c.title}</h4>
                      </div>
                      <span style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--color-orange-dark)' }}>
                        {c.progress_percentage || 0}%
                      </span>
                    </div>

                    <div
                      style={{
                        width: '100%',
                        height: 6,
                        background: 'var(--color-border)',
                        borderRadius: 'var(--radius-full)',
                        marginBottom: '1rem',
                        overflow: 'hidden'
                      }}
                    >
                      <div
                        style={{
                          width: `${c.progress_percentage || 0}%`,
                          height: '100%',
                          background: 'var(--color-orange)'
                        }}
                      />
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                        {c.completed_lessons || 0} / {c.total_lessons || 3} Lessons done
                      </span>
                      <Link to={`/courses/${c.id}`} className="btn btn-outline btn-sm">
                        <span>Continue</span>
                        <ArrowRight size={14} />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Quiz Scores */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h2 style={{ fontSize: '1.4rem' }}>Recent Assessments</h2>
              <Link to="/progress" style={{ fontSize: '0.875rem', color: 'var(--color-orange-dark)', fontWeight: 600 }}>
                View history
              </Link>
            </div>

            {quizAttempts.length === 0 ? (
              <div className="card" style={{ padding: '2.5rem', textAlign: 'center' }}>
                <Award size={36} style={{ color: 'var(--color-text-muted)', margin: '0 auto 1rem' }} />
                <h4 style={{ marginBottom: '0.5rem' }}>No Quiz Attempts Yet</h4>
                <p style={{ fontSize: '0.875rem', marginBottom: '1.5rem' }}>
                  Take a course assessment to test your understanding and receive server-validated scores.
                </p>
                <Link to="/quiz/quiz-web-dev-01" className="btn btn-outline btn-sm">
                  Try Web Dev Quiz
                </Link>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {quizAttempts.slice(0, 4).map(attempt => {
                  const pct = Math.round((attempt.score / attempt.total_questions) * 100);
                  const isPassed = pct >= 60;
                  return (
                    <div key={attempt.id} className="card" style={{ padding: '1.25rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                        <h4 style={{ fontSize: '1rem' }}>{attempt.quiz_title}</h4>
                        <span className={`badge ${isPassed ? 'badge-success' : 'badge-warning'}`}>
                          {pct}% ({attempt.score}/{attempt.total_questions})
                        </span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                          <Clock size={13} />
                          <span>{new Date(attempt.submitted_at).toLocaleDateString()}</span>
                        </div>
                        <Link
                          to={`/quiz/results/${attempt.id}`}
                          style={{ color: 'var(--color-orange-dark)', fontWeight: 600 }}
                        >
                          Review Explanations →
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
