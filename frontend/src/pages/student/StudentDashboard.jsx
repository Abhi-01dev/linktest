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
  RotateCcw
} from 'lucide-react';
import { StudentNav } from '../../components/student/StudentNav';

export function StudentDashboard() {
  const { user } = useAuth();
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [quizAttempts, setQuizAttempts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboardData() {
      try {
        const [courses, attempts] = await Promise.all([
          api.getMyCourses().catch(() => []),
          api.getMyAttempts().catch(() => [])
        ]);
        setEnrolledCourses(courses || []);
        setQuizAttempts(attempts || []);
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
    <div style={{ padding: '2.5rem 0 5rem' }}>
      <div className="container">
        <StudentNav />
        {/* Welcome Banner */}
        <div
          className="card"
          style={{
            background: 'linear-gradient(135deg, var(--color-navy) 0%, var(--color-navy-dark) 100%)',
            color: '#FFFFFF',
            padding: '2.25rem',
            border: 'none',
            borderRadius: 'var(--radius-xl)',
            marginBottom: '2.5rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1.5rem'
          }}
        >
          <div>
            <span
              className="badge"
              style={{
                background: 'rgba(249, 115, 22, 0.2)',
                color: '#FB923C',
                border: '1px solid rgba(249, 115, 22, 0.4)',
                marginBottom: '0.75rem'
              }}
            >
              STUDENT DASHBOARD
            </span>
            <h1 style={{ fontSize: 'clamp(1.75rem, 3vw, 2.3rem)', color: '#FFFFFF', marginBottom: '0.5rem' }}>
              Welcome back, {user?.full_name}! 👋
            </h1>
            <p style={{ color: '#94A3B8', fontSize: '1rem' }}>
              Track your technical coursework, assessment evaluations, and AI study sessions.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <Link to="/courses" className="btn btn-outline" style={{ background: 'rgba(255,255,255,0.1)', color: '#FFFFFF', borderColor: 'rgba(255,255,255,0.2)' }}>
              <BookOpen size={16} />
              <span>Browse Catalog</span>
            </Link>
            <Link to="/ai-tutor" className="btn btn-primary">
              <Sparkles size={16} />
              <span>Ask AI Tutor</span>
            </Link>
          </div>
        </div>

        {/* Top KPI Metrics Cards */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '1.5rem',
            marginBottom: '2.5rem'
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
