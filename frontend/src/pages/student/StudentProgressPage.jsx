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
  ExternalLink,
  Target,
  BarChart2,
  Flame,
  AlertCircle,
  HelpCircle,
  XCircle
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  LineChart,
  Line
} from 'recharts';
import { StudentNav } from '../../components/student/StudentNav';

export function StudentProgressPage() {
  const { user } = useAuth();
  const [courses, setCourses] = useState([]);
  const [attempts, setAttempts] = useState([]);
  const [progressData, setProgressData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadProgress() {
      try {
        const [enrolled, quizHistory, mockProgress] = await Promise.all([
          api.getMyCourses().catch(() => []),
          api.getMyAttempts().catch(() => []),
          api.getStudentProgress().catch(() => null)
        ]);
        setCourses(enrolled || []);
        setAttempts(quizHistory || []);
        setProgressData(mockProgress);
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

  const overall = progressData?.overall || {
    total_mock_tests_attempted: 0,
    average_score: 0,
    highest_score: 0,
    lowest_score: 0,
    average_percentage: 0,
    average_accuracy: 0,
    total_questions_attempted: 0,
    total_correct: 0,
    total_wrong: 0,
    total_unanswered: 0,
    total_time_spent_seconds: 0
  };

  const trend = progressData?.trend || [];
  const accuracy = progressData?.accuracy_breakdown || {
    correct_count: 0,
    wrong_count: 0,
    unanswered_count: 0,
    correct_percentage: 0,
    wrong_percentage: 0,
    unanswered_percentage: 0
  };
  const subjects = progressData?.subjects || [];
  const bestSubject = progressData?.best_subject;
  const weakestSubject = progressData?.weakest_subject;
  const mockAttempts = progressData?.attempts || [];

  const formatSeconds = (sec) => {
    if (!sec || sec <= 0) return '0m';
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    if (m >= 60) {
      const h = Math.floor(m / 60);
      const remM = m % 60;
      return `${h}h ${remM}m`;
    }
    return `${m}m ${s > 0 ? `${s}s` : ''}`.trim();
  };

  return (
    <div style={{ padding: '3rem 0 5rem' }}>
      <div className="container">
        <StudentNav />

        {/* Page Title */}
        <div style={{ marginBottom: '2.5rem' }}>
          <span className="badge badge-orange" style={{ marginBottom: '0.5rem' }}>
            ACADEMIC PERFORMANCE DASHBOARD
          </span>
          <h1 style={{ fontSize: '2.4rem', fontWeight: 800, color: 'var(--color-navy)', marginBottom: '0.5rem' }}>
            My Learning Progress & Performance Analytics
          </h1>
          <p style={{ fontSize: '1rem', color: 'var(--color-text-secondary)', margin: 0 }}>
            Comprehensive analytics of your mock examination attempts, accuracy metrics, syllabus mastery, and subject breakdown for {user?.full_name}.
          </p>
        </div>

        {/* Key Analytical Factors Cards */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1.25rem',
            marginBottom: '2.5rem'
          }}
        >
          <div className="card" style={{ padding: '1.5rem', borderLeft: '4px solid #2563EB' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#64748B', fontSize: '0.82rem', fontWeight: 700 }}>
              <Award size={18} style={{ color: '#2563EB' }} />
              <span>TESTS ATTEMPTED</span>
            </div>
            <div style={{ fontSize: '2.2rem', fontWeight: 900, color: 'var(--color-navy)', marginTop: '0.4rem' }}>
              {overall.total_mock_tests_attempted}
            </div>
            <p style={{ fontSize: '0.78rem', color: '#64748B', margin: '0.4rem 0 0' }}>
              Completed Mock Exams
            </p>
          </div>

          <div className="card" style={{ padding: '1.5rem', borderLeft: '4px solid var(--color-orange)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#64748B', fontSize: '0.82rem', fontWeight: 700 }}>
              <Target size={18} style={{ color: 'var(--color-orange)' }} />
              <span>AVERAGE SCORE</span>
            </div>
            <div style={{ fontSize: '2.2rem', fontWeight: 900, color: 'var(--color-orange)', marginTop: '0.4rem' }}>
              {overall.average_score}
            </div>
            <p style={{ fontSize: '0.78rem', color: '#64748B', margin: '0.4rem 0 0' }}>
              High: {overall.highest_score} • Low: {overall.lowest_score}
            </p>
          </div>

          <div className="card" style={{ padding: '1.5rem', borderLeft: '4px solid #10B981' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#64748B', fontSize: '0.82rem', fontWeight: 700 }}>
              <TrendingUp size={18} style={{ color: '#10B981' }} />
              <span>AVG PERCENTAGE</span>
            </div>
            <div style={{ fontSize: '2.2rem', fontWeight: 900, color: '#059669', marginTop: '0.4rem' }}>
              {overall.average_percentage}%
            </div>
            <p style={{ fontSize: '0.78rem', color: '#64748B', margin: '0.4rem 0 0' }}>
              Across all evaluated tests
            </p>
          </div>

          <div className="card" style={{ padding: '1.5rem', borderLeft: '4px solid #8B5CF6' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#64748B', fontSize: '0.82rem', fontWeight: 700 }}>
              <BarChart2 size={18} style={{ color: '#8B5CF6' }} />
              <span>OVERALL ACCURACY</span>
            </div>
            <div style={{ fontSize: '2.2rem', fontWeight: 900, color: '#7C3AED', marginTop: '0.4rem' }}>
              {overall.average_accuracy}%
            </div>
            <p style={{ fontSize: '0.78rem', color: '#64748B', margin: '0.4rem 0 0' }}>
              {overall.total_correct} correct / {overall.total_questions_attempted} attempted
            </p>
          </div>

          <div className="card" style={{ padding: '1.5rem', borderLeft: '4px solid #F59E0B' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#64748B', fontSize: '0.82rem', fontWeight: 700 }}>
              <Clock size={18} style={{ color: '#F59E0B' }} />
              <span>TIME SPENT</span>
            </div>
            <div style={{ fontSize: '2.2rem', fontWeight: 900, color: '#D97706', marginTop: '0.4rem' }}>
              {formatSeconds(overall.total_time_spent_seconds)}
            </div>
            <p style={{ fontSize: '0.78rem', color: '#64748B', margin: '0.4rem 0 0' }}>
              Active examination time
            </p>
          </div>
        </div>

        {/* Performance Trend Graph & Accuracy Breakdown Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
          {/* Trend Chart */}
          <div className="card" style={{ padding: '1.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--color-navy)', margin: 0 }}>
                  Performance Trend Across Attempts
                </h3>
                <p style={{ fontSize: '0.8rem', color: '#64748B', margin: '0.2rem 0 0' }}>
                  Score & percentage progress chronologically across mock tests
                </p>
              </div>
            </div>

            {trend.length === 0 ? (
              <div style={{ padding: '3.5rem 1rem', textAlign: 'center', color: '#64748B' }}>
                Complete your first mock test to unlock your performance trend chart.
              </div>
            ) : (
              <div style={{ height: '240px', width: '100%' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trend} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                    <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748B' }} />
                    <YAxis tick={{ fontSize: 11, fill: '#64748B' }} domain={[0, 100]} />
                    <Tooltip
                      contentStyle={{ background: '#0F172A', color: '#FFFFFF', borderRadius: '8px', border: 'none', fontSize: '0.8rem' }}
                    />
                    <Line
                      type="monotone"
                      dataKey="percentage"
                      name="Percentage %"
                      stroke="#2563EB"
                      strokeWidth={3}
                      dot={{ r: 5, fill: '#2563EB' }}
                      activeDot={{ r: 7 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="accuracy"
                      name="Accuracy %"
                      stroke="#10B981"
                      strokeWidth={2}
                      strokeDasharray="4 4"
                      dot={{ r: 4, fill: '#10B981' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Accuracy Breakdown Analysis */}
          <div className="card" style={{ padding: '1.75rem' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--color-navy)', margin: '0 0 0.2rem 0' }}>
              Accuracy Analysis
            </h3>
            <p style={{ fontSize: '0.8rem', color: '#64748B', margin: '0 0 1.25rem 0' }}>
              Question outcome distribution across all completed attempts
            </p>

            {/* Visual Multi-segment Bar */}
            <div
              style={{
                display: 'flex',
                height: '14px',
                borderRadius: '999px',
                overflow: 'hidden',
                background: '#F1F5F9',
                marginBottom: '1.5rem'
              }}
            >
              <div
                style={{ width: `${accuracy.correct_percentage}%`, background: '#10B981' }}
                title={`Correct: ${accuracy.correct_percentage}%`}
              />
              <div
                style={{ width: `${accuracy.wrong_percentage}%`, background: '#EF4444' }}
                title={`Wrong: ${accuracy.wrong_percentage}%`}
              />
              <div
                style={{ width: `${accuracy.unanswered_percentage}%`, background: '#94A3B8' }}
                title={`Unanswered: ${accuracy.unanswered_percentage}%`}
              />
            </div>

            {/* 3 Metric Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
              <div style={{ background: '#ECFDF5', padding: '1rem', borderRadius: '8px', border: '1px solid #A7F3D0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#047857', fontSize: '0.75rem', fontWeight: 700 }}>
                  <CheckCircle2 size={14} />
                  <span>CORRECT</span>
                </div>
                <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#065F46', marginTop: '0.25rem' }}>
                  {accuracy.correct_percentage}%
                </div>
                <div style={{ fontSize: '0.72rem', color: '#047857' }}>{accuracy.correct_count} Questions</div>
              </div>

              <div style={{ background: '#FEF2F2', padding: '1rem', borderRadius: '8px', border: '1px solid #FECACA' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#B91C1C', fontSize: '0.75rem', fontWeight: 700 }}>
                  <XCircle size={14} />
                  <span>WRONG</span>
                </div>
                <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#991B1B', marginTop: '0.25rem' }}>
                  {accuracy.wrong_percentage}%
                </div>
                <div style={{ fontSize: '0.72rem', color: '#B91C1C' }}>{accuracy.wrong_count} Questions</div>
              </div>

              <div style={{ background: '#F8FAFC', padding: '1rem', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#475569', fontSize: '0.75rem', fontWeight: 700 }}>
                  <HelpCircle size={14} />
                  <span>SKIPPED</span>
                </div>
                <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#334155', marginTop: '0.25rem' }}>
                  {accuracy.unanswered_percentage}%
                </div>
                <div style={{ fontSize: '0.72rem', color: '#475569' }}>{accuracy.unanswered_count} Questions</div>
              </div>
            </div>
          </div>
        </div>

        {/* Subject / Category Analysis */}
        <div className="card" style={{ padding: '1.75rem', marginBottom: '2.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
            <div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--color-navy)', margin: 0 }}>
                Subject & Category Analysis
              </h3>
              <p style={{ fontSize: '0.8rem', color: '#64748B', margin: '0.2rem 0 0' }}>
                Performance breakdown by academic subject and focus areas
              </p>
            </div>

            {/* Highlights: Best vs Weakest Subject */}
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              {bestSubject && (
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: '#ECFDF5', border: '1px solid #A7F3D0', padding: '0.4rem 0.8rem', borderRadius: '8px' }}>
                  <Award size={16} style={{ color: '#059669' }} />
                  <span style={{ fontSize: '0.78rem', color: '#065F46', fontWeight: 600 }}>
                    Best Subject: <strong>{bestSubject.subject}</strong> ({bestSubject.average_percentage}%)
                  </span>
                </div>
              )}
              {weakestSubject && weakestSubject.subject !== bestSubject?.subject && (
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: '#FFFBEB', border: '1px solid #FDE68A', padding: '0.4rem 0.8rem', borderRadius: '8px' }}>
                  <AlertCircle size={16} style={{ color: '#D97706' }} />
                  <span style={{ fontSize: '0.78rem', color: '#92400E', fontWeight: 600 }}>
                    Needs Focus: <strong>{weakestSubject.subject}</strong> ({weakestSubject.average_percentage}%)
                  </span>
                </div>
              )}
            </div>
          </div>

          {subjects.length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: '#64748B' }}>
              No subject-specific attempts recorded yet.
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
                <thead>
                  <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#475569', fontWeight: 700 }}>
                    <th style={{ padding: '0.75rem 1rem' }}>Subject</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Tests Attempted</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Avg Score</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Avg Percentage</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Accuracy</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Questions (Correct / Attempted)</th>
                  </tr>
                </thead>
                <tbody>
                  {subjects.map((s) => (
                    <tr key={s.subject} style={{ borderBottom: '1px solid #F1F5F9' }}>
                      <td style={{ padding: '0.75rem 1rem', fontWeight: 700, color: 'var(--color-navy)' }}>
                        {s.subject}
                      </td>
                      <td style={{ padding: '0.75rem 1rem', color: '#475569' }}>
                        {s.attempts_count}
                      </td>
                      <td style={{ padding: '0.75rem 1rem', fontWeight: 600, color: '#2563EB' }}>
                        {s.average_score}
                      </td>
                      <td style={{ padding: '0.75rem 1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span style={{ fontWeight: 700, minWidth: '40px' }}>{s.average_percentage}%</span>
                          <div style={{ width: '100px', height: '6px', background: '#E2E8F0', borderRadius: '4px', overflow: 'hidden' }}>
                            <div
                              style={{
                                width: `${s.average_percentage}%`,
                                height: '100%',
                                background: s.average_percentage >= 70 ? '#10B981' : s.average_percentage >= 50 ? 'var(--color-orange)' : '#EF4444'
                              }}
                            />
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '0.75rem 1rem', fontWeight: 700, color: '#059669' }}>
                        {s.accuracy}%
                      </td>
                      <td style={{ padding: '0.75rem 1rem', color: '#64748B' }}>
                        {s.correct_count} / {s.questions_attempted}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Mock Test Performance Table (Complete Student Attempts) */}
        <div className="card" style={{ padding: '1.75rem', marginBottom: '3rem' }}>
          <div style={{ marginBottom: '1.25rem' }}>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--color-navy)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Award size={22} style={{ color: 'var(--color-orange)' }} />
              <span>Mock Test Performance</span>
            </h2>
            <p style={{ fontSize: '0.82rem', color: '#64748B', margin: '0.25rem 0 0' }}>
              All mock test examinations taken with detailed question and accuracy breakdowns
            </p>
          </div>

          {mockAttempts.length === 0 ? (
            <div style={{ padding: '2.5rem', textAlign: 'center', color: '#64748B' }}>
              <p>You have not attempted any mock tests yet.</p>
              <Link to="/mock-tests" className="btn btn-primary btn-sm" style={{ marginTop: '0.75rem' }}>
                Browse Mock Tests
              </Link>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.86rem' }}>
                <thead>
                  <tr style={{ background: '#F8FAFC', borderBottom: '2px solid #E2E8F0', color: '#475569', fontWeight: 700, fontSize: '0.76rem', textTransform: 'uppercase' }}>
                    <th style={{ padding: '0.75rem 0.85rem' }}>Mock Test</th>
                    <th style={{ padding: '0.75rem 0.85rem' }}>Date</th>
                    <th style={{ padding: '0.75rem 0.85rem' }}>Total Qs</th>
                    <th style={{ padding: '0.75rem 0.85rem' }}>Attempted</th>
                    <th style={{ padding: '0.75rem 0.85rem' }}>Correct</th>
                    <th style={{ padding: '0.75rem 0.85rem' }}>Wrong</th>
                    <th style={{ padding: '0.75rem 0.85rem' }}>Unanswered</th>
                    <th style={{ padding: '0.75rem 0.85rem' }}>Marks</th>
                    <th style={{ padding: '0.75rem 0.85rem' }}>Percentage</th>
                    <th style={{ padding: '0.75rem 0.85rem' }}>Accuracy</th>
                    <th style={{ padding: '0.75rem 0.85rem' }}>Time Taken</th>
                    <th style={{ padding: '0.75rem 0.85rem' }}>Rank</th>
                    <th style={{ padding: '0.75rem 0.85rem' }}>Pass/Fail</th>
                    <th style={{ padding: '0.75rem 0.85rem', textAlign: 'right' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {mockAttempts.map((m) => (
                    <tr key={m.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                      <td style={{ padding: '0.75rem 0.85rem', fontWeight: 700, color: 'var(--color-navy)' }}>
                        <div>{m.test_name}</div>
                        <div style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 500 }}>{m.subject}</div>
                      </td>
                      <td style={{ padding: '0.75rem 0.85rem', color: '#64748B', whiteSpace: 'nowrap' }}>
                        {m.date ? new Date(m.date).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                      </td>
                      <td style={{ padding: '0.75rem 0.85rem', color: '#334155' }}>
                        {m.total_questions}
                      </td>
                      <td style={{ padding: '0.75rem 0.85rem', fontWeight: 600, color: '#334155' }}>
                        {m.questions_attempted}
                      </td>
                      <td style={{ padding: '0.75rem 0.85rem', fontWeight: 700, color: '#059669' }}>
                        {m.correct_answers}
                      </td>
                      <td style={{ padding: '0.75rem 0.85rem', fontWeight: 700, color: '#DC2626' }}>
                        {m.wrong_answers}
                      </td>
                      <td style={{ padding: '0.75rem 0.85rem', color: '#94A3B8' }}>
                        {m.unanswered_questions}
                      </td>
                      <td style={{ padding: '0.75rem 0.85rem', fontWeight: 700, color: '#2563EB', whiteSpace: 'nowrap' }}>
                        {m.marks_obtained} / {m.total_marks}
                      </td>
                      <td style={{ padding: '0.75rem 0.85rem', fontWeight: 700 }}>
                        {m.percentage}%
                      </td>
                      <td style={{ padding: '0.75rem 0.85rem', fontWeight: 700, color: '#059669' }}>
                        {m.accuracy}%
                      </td>
                      <td style={{ padding: '0.75rem 0.85rem', color: '#64748B', whiteSpace: 'nowrap' }}>
                        {formatSeconds(m.time_taken_seconds)}
                      </td>
                      <td style={{ padding: '0.75rem 0.85rem', fontWeight: 700, color: '#475569' }}>
                        {m.rank}
                      </td>
                      <td style={{ padding: '0.75rem 0.85rem' }}>
                        <span style={{
                          padding: '0.2rem 0.55rem',
                          borderRadius: '999px',
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          background: m.passed ? '#ECFDF5' : '#FEF2F2',
                          color: m.passed ? '#059669' : '#DC2626'
                        }}>
                          {m.passed ? 'Pass' : 'Fail'}
                        </span>
                      </td>
                      <td style={{ padding: '0.75rem 0.85rem', textAlign: 'right' }}>
                        <Link
                          to={`/mock-tests/${m.test_id}/result/${m.id}`}
                          className="btn btn-outline btn-sm"
                          style={{ fontSize: '0.74rem', padding: '0.25rem 0.5rem', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}
                        >
                          <span>Review</span>
                          <ExternalLink size={11} />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Course Progress Breakdown (Complementary Learning Syllabus) */}
        <div style={{ marginBottom: '3rem' }}>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--color-navy)', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
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
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>{c.title}</h3>
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

        {/* Assessment Attempt History Table (Lesson Quizzes) */}
        <div>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--color-navy)', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Award size={22} style={{ color: 'var(--color-orange)' }} />
            <span>Course Quiz History</span>
          </h2>

          {attempts.length === 0 ? (
            <div className="card" style={{ padding: '2rem', textAlign: 'center' }}>
              <p>No lesson quiz attempts recorded yet.</p>
            </div>
          ) : (
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                  <thead>
                    <tr style={{ background: 'var(--color-bg-alt)', borderBottom: '1px solid var(--color-border)' }}>
                      <th style={{ padding: '1rem 1.25rem', fontWeight: 700 }}>Quiz</th>
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

export default StudentProgressPage;
