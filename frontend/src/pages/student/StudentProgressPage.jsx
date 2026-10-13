import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import {
  Award,
  BookOpen,
  CheckCircle2,
  TrendingUp,
  Clock,
  ArrowRight,
  ExternalLink
} from 'lucide-react';
import { StudentNav } from '../../components/student/StudentNav';

export function StudentProgressPage() {
  const { user } = useAuth();
  const [courses, setCourses] = useState([]);
  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadProgress() {
      try {
        const [enrolled, quizHistory] = await Promise.all([
          api.getMyCourses().catch(() => []),
          api.getMyAttempts().catch(() => [])
        ]);
        setCourses(enrolled || []);
        setAttempts(quizHistory || []);
      } catch (err) {
        console.error('Error loading progress:', err);
      } finally {
        setLoading(false);
      }
    }
    loadProgress();
  }, []);

  const totalLessons = courses.reduce((acc, c) => acc + (c.total_lessons || 3), 0);
  const completedLessons = courses.reduce((acc, c) => acc + (c.completed_lessons || 0), 0);
  const overallLessonPct = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

  return (
    <div style={{ padding: '3rem 0 5rem' }}>
      <div className="container">
        <StudentNav />
        <div style={{ marginBottom: '2.5rem' }}>
          <span className="badge badge-orange" style={{ marginBottom: '0.5rem' }}>
            LEARNING ANALYTICS
          </span>
          <h1 style={{ fontSize: '2.4rem', marginBottom: '0.5rem' }}>
            My Learning Progress & Assessments
          </h1>
          <p style={{ fontSize: '1rem', color: 'var(--color-text-secondary)' }}>
            Real-time tracking of syllabus completion and server-graded quiz metrics for {user?.full_name}.
          </p>
        </div>

        {/* Global Progress Cards */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '1.5rem',
            marginBottom: '3rem'
          }}
        >
          <div className="card" style={{ padding: '1.75rem' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>
              Curriculum Completion
            </span>
            <div style={{ fontSize: '2.2rem', fontWeight: 800, color: 'var(--color-navy)', marginTop: '0.35rem' }}>
              {overallLessonPct}%
            </div>
            <p style={{ fontSize: '0.8rem', marginTop: '0.5rem' }}>
              {completedLessons} of {totalLessons} total lessons finished
            </p>
          </div>

          <div className="card" style={{ padding: '1.75rem' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>
              Active Tracks
            </span>
            <div style={{ fontSize: '2.2rem', fontWeight: 800, color: 'var(--color-orange)', marginTop: '0.35rem' }}>
              {courses.length}
            </div>
            <p style={{ fontSize: '0.8rem', marginTop: '0.5rem' }}>
              Enrolled courses
            </p>
          </div>

          <div className="card" style={{ padding: '1.75rem' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>
              Assessments Evaluated
            </span>
            <div style={{ fontSize: '2.2rem', fontWeight: 800, color: '#10B981', marginTop: '0.35rem' }}>
              {attempts.length}
            </div>
            <p style={{ fontSize: '0.8rem', marginTop: '0.5rem' }}>
              Verified quiz submissions
            </p>
          </div>
        </div>

        {/* Course Progress Breakdown */}
        <div style={{ marginBottom: '3.5rem' }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <BookOpen size={22} style={{ color: 'var(--color-orange)' }} />
            <span>Course Progress Breakdown</span>
          </h2>

          {courses.length === 0 ? (
            <div className="card" style={{ padding: '2rem', textAlign: 'center' }}>
              <p>You have not enrolled in any courses yet.</p>
              <Link to="/courses" className="btn btn-primary btn-sm" style={{ marginTop: '1rem' }}>
                Browse Catalogue
              </Link>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
              {courses.map(c => (
                <div key={c.id} className="card" style={{ padding: '1.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                    <h3 style={{ fontSize: '1.1rem' }}>{c.title}</h3>
                    <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--color-orange-dark)' }}>
                      {c.progress_percentage || 0}%
                    </span>
                  </div>

                  <div
                    style={{
                      width: '100%',
                      height: 8,
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

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem' }}>
                    <span style={{ color: 'var(--color-text-muted)' }}>
                      {c.completed_lessons || 0} / {c.total_lessons || 3} Lessons completed
                    </span>
                    <Link to={`/courses/${c.id}`} className="btn btn-outline btn-sm">
                      Open Course
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Assessment Attempt History Table */}
        <div>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Award size={22} style={{ color: 'var(--color-orange)' }} />
            <span>Assessment Attempt History</span>
          </h2>

          {attempts.length === 0 ? (
            <div className="card" style={{ padding: '2rem', textAlign: 'center' }}>
              <p>No assessment attempts recorded yet.</p>
            </div>
          ) : (
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                  <thead>
                    <tr style={{ background: 'var(--color-bg-alt)', borderBottom: '1px solid var(--color-border)' }}>
                      <th style={{ padding: '1rem 1.25rem', fontWeight: 700 }}>Assessment</th>
                      <th style={{ padding: '1rem 1.25rem', fontWeight: 700 }}>Score</th>
                      <th style={{ padding: '1rem 1.25rem', fontWeight: 700 }}>Percentage</th>
                      <th style={{ padding: '1rem 1.25rem', fontWeight: 700 }}>Status</th>
                      <th style={{ padding: '1rem 1.25rem', fontWeight: 700 }}>Date</th>
                      <th style={{ padding: '1rem 1.25rem', fontWeight: 700, textAlign: 'right' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attempts.map(att => {
                      const pct = Math.round((att.score / att.total_questions) * 100);
                      const isPassed = pct >= 60;
                      return (
                        <tr key={att.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                          <td style={{ padding: '1rem 1.25rem', fontWeight: 600 }}>{att.quiz_title}</td>
                          <td style={{ padding: '1rem 1.25rem' }}>{att.score} / {att.total_questions}</td>
                          <td style={{ padding: '1rem 1.25rem', fontWeight: 700 }}>{pct}%</td>
                          <td style={{ padding: '1rem 1.25rem' }}>
                            <span className={`badge ${isPassed ? 'badge-success' : 'badge-warning'}`}>
                              {isPassed ? 'Passed' : 'Review Needed'}
                            </span>
                          </td>
                          <td style={{ padding: '1rem 1.25rem', color: 'var(--color-text-muted)' }}>
                            {new Date(att.submitted_at).toLocaleDateString()}
                          </td>
                          <td style={{ padding: '1rem 1.25rem', textAlign: 'right' }}>
                            <Link to={`/quiz/results/${att.id}`} className="btn btn-outline btn-sm">
                              <span>Review</span>
                              <ExternalLink size={12} />
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
