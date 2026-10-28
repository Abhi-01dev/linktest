// Teacher & Admin Mock Test Analytics & Candidate Performance Dashboard
// LinkTest Enterprise Examination Studio

import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid
} from 'recharts';
import {
  ArrowLeft,
  Users,
  Award,
  TrendingUp,
  AlertTriangle,
  ShieldCheck,
  CheckCircle,
  Eye,
  Send,
  Download,
  Target,
  Clock,
  HelpCircle,
  BarChart2
} from 'lucide-react';

export function TeacherTestAnalyticsPage() {
  const { id } = useParams();
  const { user } = useAuth();

  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [releasing, setReleasing] = useState(false);
  const [generatingPdf, setGeneratingPdf] = useState(false);

  const isAdmin = user?.role === 'ADMIN';
  const backRoute = isAdmin ? '/admin/mock-tests' : '/teacher/mock-tests';
  const backLabel = isAdmin ? 'Back to Mock Tests' : 'Back to Mock Tests Studio';

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const data = await api.getMockTestAnalytics(id);
      setAnalytics(data);
    } catch (err) {
      console.error('Failed to load analytics:', err);
      setError(err.message || 'Unable to retrieve test analytics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnalytics();
  }, [id]);

  const handleToggleRelease = async () => {
    setReleasing(true);
    try {
      await api.releaseMockTestResults(id, true);
      alert('Examination results successfully released to candidates!');
      await loadAnalytics();
    } catch (err) {
      alert(err.message || 'Failed to release results.');
    } finally {
      setReleasing(false);
    }
  };

  const handleDownloadPdf = async () => {
    setGeneratingPdf(true);
    try {
      await api.downloadTestResultsPdf(id);
    } catch (err) {
      alert(err.message || 'Failed to generate PDF report.');
    } finally {
      setGeneratingPdf(false);
    }
  };

  const handleReleaseIndividualResult = async (attemptId, studentName) => {
    try {
      await api.releaseMockTestAttemptResult(attemptId);
      alert(`Result successfully released for ${studentName || 'candidate'}!`);
      await loadAnalytics();
    } catch (err) {
      alert(err.message || 'Failed to release individual result.');
    }
  };

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

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '6rem' }}>
        <div className="spinner" style={{ margin: '0 auto 1rem' }}></div>
        <p>Loading assessment analytics and candidate roster...</p>
      </div>
    );
  }

  if (error || !analytics) {
    return (
      <div style={{ padding: '2rem', maxWidth: '600px', margin: '0 auto' }}>
        <div style={{ background: '#FEF2F2', border: '1px solid #EF4444', color: '#DC2626', padding: '1.5rem', borderRadius: '8px' }}>
          <h3>Analytics Error</h3>
          <p>{error || 'Analytics not available.'}</p>
          <Link to={backRoute} className="btn btn-secondary" style={{ marginTop: '1rem' }}>
            {backLabel}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Top Header */}
      <div style={{ marginBottom: '1.75rem' }}>
        <Link
          to={backRoute}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            color: 'var(--color-text-secondary)',
            fontSize: '0.88rem',
            fontWeight: 600,
            marginBottom: '0.5rem'
          }}
        >
          <ArrowLeft size={16} />
          <span>{backLabel}</span>
        </Link>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#2563EB', textTransform: 'uppercase' }}>
              ASSESSMENT PERFORMANCE & PROCTORING AUDIT
            </div>
            <h1 style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--color-navy)', margin: '0.2rem 0' }}>
              {analytics.title}
            </h1>
            <div style={{ fontSize: '0.88rem', color: 'var(--color-text-secondary)' }}>
              Subject: <strong>{analytics.subject}</strong> • Max Score: <strong>{analytics.total_marks} Marks</strong>
              {analytics.duration_minutes ? ` • Duration: ${analytics.duration_minutes} Mins` : ''}
              {analytics.total_questions ? ` • Total Questions: ${analytics.total_questions}` : ''}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <button
              onClick={handleDownloadPdf}
              disabled={generatingPdf}
              className="btn btn-secondary"
              style={{ fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
            >
              <Download size={15} />
              <span>{generatingPdf ? 'Generating PDF...' : 'Generate Results PDF'}</span>
            </button>

            <button
              onClick={handleToggleRelease}
              disabled={releasing}
              className="btn btn-primary"
              style={{ fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '0.4rem', background: '#059669', borderColor: '#059669' }}
            >
              <Send size={15} />
              <span>{releasing ? 'Releasing...' : 'Release Results to Students'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: '1rem',
        marginBottom: '2rem'
      }}>
        <div style={{ background: '#FFFFFF', padding: '1.25rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#64748B', fontSize: '0.8rem', fontWeight: 700 }}>
            <Users size={16} style={{ color: '#2563EB' }} />
            <span>CANDIDATES</span>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--color-navy)', marginTop: '0.3rem' }}>
            {analytics.total_candidates}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748B' }}>
            {analytics.completed_attempts || 0} completed ({analytics.completion_rate_percentage || 0}%)
          </div>
        </div>

        <div style={{ background: '#FFFFFF', padding: '1.25rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#64748B', fontSize: '0.8rem', fontWeight: 700 }}>
            <Award size={16} style={{ color: 'var(--color-orange)' }} />
            <span>AVERAGE SCORE</span>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#2563EB', marginTop: '0.3rem' }}>
            {analytics.average_score} <span style={{ fontSize: '0.9rem', color: '#64748B' }}>/ {analytics.total_marks}</span>
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748B' }}>High: {analytics.highest_score} • Low: {analytics.lowest_score}</div>
        </div>

        <div style={{ background: '#FFFFFF', padding: '1.25rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#64748B', fontSize: '0.8rem', fontWeight: 700 }}>
            <TrendingUp size={16} style={{ color: '#10B981' }} />
            <span>PASS RATE</span>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#059669', marginTop: '0.3rem' }}>
            {analytics.pass_rate_percentage}%
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748B' }}>{analytics.pass_count} passed cutoff</div>
        </div>

        <div style={{ background: '#FFFFFF', padding: '1.25rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#64748B', fontSize: '0.8rem', fontWeight: 700 }}>
            <Target size={16} style={{ color: '#8B5CF6' }} />
            <span>AVG ACCURACY</span>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#7C3AED', marginTop: '0.3rem' }}>
            {analytics.average_accuracy || 0}%
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748B' }}>Candidate question precision</div>
        </div>

        <div style={{ background: '#FFFFFF', padding: '1.25rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#64748B', fontSize: '0.8rem', fontWeight: 700 }}>
            <AlertTriangle size={16} style={{ color: '#EF4444' }} />
            <span>PROCTORING FLAGS</span>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 900, color: analytics.flagged_proctoring_count > 0 ? '#DC2626' : '#059669', marginTop: '0.3rem' }}>
            {analytics.flagged_proctoring_count}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748B' }}>Attempts requiring review</div>
        </div>
      </div>

      {/* Score Distribution Chart */}
      <div style={{
        background: '#FFFFFF',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--color-border)',
        boxShadow: 'var(--shadow-sm)',
        padding: '1.5rem',
        marginBottom: '2rem'
      }}>
        <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--color-navy)', marginBottom: '1.25rem' }}>
          Candidate Score Distribution
        </h3>

        <div style={{ height: '220px', width: '100%' }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={analytics.score_distribution}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
              <XAxis dataKey="range" tick={{ fontSize: 12, fill: '#64748B' }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#64748B' }} />
              <Tooltip
                contentStyle={{ background: '#0F172A', color: '#FFFFFF', borderRadius: '8px', border: 'none' }}
                cursor={{ fill: 'rgba(241, 245, 249, 0.6)' }}
              />
              <Bar dataKey="count" fill="var(--color-orange)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Candidate Performance Table */}
      <div style={{
        background: '#FFFFFF',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--color-border)',
        boxShadow: 'var(--shadow-sm)',
        padding: '1.5rem',
        marginBottom: '2rem'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--color-navy)', margin: 0 }}>
              Candidate Performance & Evaluation Roster ({analytics.candidates?.length || 0})
            </h3>
            <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.8rem', color: '#64748B' }}>
              Full evaluation breakdown including objective and subjective scores, question accuracy, and proctoring audit.
            </p>
          </div>
          <button
            onClick={handleDownloadPdf}
            disabled={generatingPdf}
            className="btn btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.82rem' }}
          >
            <Download size={14} />
            <span>{generatingPdf ? 'Generating PDF...' : 'Download Full PDF Report'}</span>
          </button>
        </div>

        {(!analytics.candidates || analytics.candidates.length === 0) ? (
          <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#64748B' }}>
            No candidate submissions recorded yet for this examination.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #E2E8F0', color: '#64748B', fontSize: '0.74rem', textTransform: 'uppercase', background: '#F8FAFC' }}>
                  <th style={{ padding: '0.75rem 0.85rem' }}>Student</th>
                  <th style={{ padding: '0.75rem 0.85rem' }}>Score</th>
                  <th style={{ padding: '0.75rem 0.85rem' }}>Percentage</th>
                  <th style={{ padding: '0.75rem 0.85rem' }}>Correct</th>
                  <th style={{ padding: '0.75rem 0.85rem' }}>Wrong</th>
                  <th style={{ padding: '0.75rem 0.85rem' }}>Unanswered</th>
                  <th style={{ padding: '0.75rem 0.85rem' }}>Accuracy</th>
                  <th style={{ padding: '0.75rem 0.85rem' }}>Time Taken</th>
                  <th style={{ padding: '0.75rem 0.85rem' }}>Status</th>
                  <th style={{ padding: '0.75rem 0.85rem', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {analytics.candidates.map((c) => {
                  const isReleased = c.result_status === 'RELEASED';
                  const isManualPending = c.manual_status === 'Pending';
                  return (
                    <tr key={c.attempt_id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                      <td style={{ padding: '0.75rem 0.85rem' }}>
                        <div style={{ fontWeight: 700, color: 'var(--color-navy)' }}>{c.student_name}</div>
                        <div style={{ fontSize: '0.74rem', color: '#64748B' }}>{c.student_email}</div>
                      </td>

                      <td style={{ padding: '0.75rem 0.85rem', fontWeight: 700, color: '#2563EB', whiteSpace: 'nowrap' }}>
                        {isManualPending ? '—' : `${c.score} / ${analytics.total_marks}`}
                      </td>

                      <td style={{ padding: '0.75rem 0.85rem', fontWeight: 700 }}>
                        {isManualPending ? '—' : `${c.percentage}%`}
                      </td>

                      <td style={{ padding: '0.75rem 0.85rem', fontWeight: 700, color: '#059669' }}>
                        {c.correct_count ?? '—'}
                      </td>

                      <td style={{ padding: '0.75rem 0.85rem', fontWeight: 700, color: '#DC2626' }}>
                        {c.wrong_count ?? c.incorrect_count ?? '—'}
                      </td>

                      <td style={{ padding: '0.75rem 0.85rem', color: '#94A3B8' }}>
                        {c.unanswered_count ?? '—'}
                      </td>

                      <td style={{ padding: '0.75rem 0.85rem', fontWeight: 700, color: '#7C3AED' }}>
                        {c.accuracy !== undefined ? `${c.accuracy}%` : '—'}
                      </td>

                      <td style={{ padding: '0.75rem 0.85rem', color: '#64748B', whiteSpace: 'nowrap' }}>
                        {formatSeconds(c.time_spent_seconds)}
                      </td>

                      <td style={{ padding: '0.75rem 0.85rem' }}>
                        {isReleased ? (
                          <span style={{ fontSize: '0.72rem', fontWeight: 700, padding: '0.2rem 0.6rem', borderRadius: '999px', background: '#ECFDF5', color: '#059669' }}>
                            Released
                          </span>
                        ) : isManualPending ? (
                          <span style={{ fontSize: '0.72rem', fontWeight: 700, padding: '0.2rem 0.6rem', borderRadius: '999px', background: '#FFFBEB', color: '#D97706', border: '1px solid #FDE68A' }}>
                            Pending
                          </span>
                        ) : (
                          <span style={{ fontSize: '0.72rem', fontWeight: 700, padding: '0.2rem 0.6rem', borderRadius: '999px', background: '#F0F9FF', color: '#0284C7', border: '1px solid #BAE6FD' }}>
                            Evaluated
                          </span>
                        )}
                      </td>

                      <td style={{ padding: '0.75rem 0.85rem', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '0.4rem', alignItems: 'center' }}>
                          <Link
                            to={`/teacher/mock-tests/${id}/attempts/${c.attempt_id}/review?tab=grading`}
                            className="btn btn-secondary"
                            style={{ fontSize: '0.75rem', padding: '0.3rem 0.65rem', fontWeight: 600 }}
                          >
                            {isManualPending ? 'Evaluate' : 'View Attempt'}
                          </Link>

                          {!isReleased && (
                            <button
                              onClick={() => handleReleaseIndividualResult(c.attempt_id, c.student_name)}
                              disabled={isManualPending}
                              title={isManualPending ? 'Complete manual evaluation first before releasing' : 'Release result to candidate'}
                              style={{
                                fontSize: '0.75rem',
                                padding: '0.3rem 0.65rem',
                                fontWeight: 700,
                                borderRadius: '6px',
                                border: 'none',
                                cursor: isManualPending ? 'not-allowed' : 'pointer',
                                background: isManualPending ? '#E2E8F0' : '#10B981',
                                color: isManualPending ? '#94A3B8' : '#FFFFFF'
                              }}
                            >
                              Release
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Question Analysis Section */}
      <div style={{
        background: '#FFFFFF',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--color-border)',
        boxShadow: 'var(--shadow-sm)',
        padding: '1.5rem'
      }}>
        <div style={{ marginBottom: '1.25rem' }}>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--color-navy)', margin: 0 }}>
            Question-by-Question Analysis ({analytics.question_analysis?.length || 0})
          </h3>
          <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.8rem', color: '#64748B' }}>
            Detailed breakdown of candidate attempts, success rates, and calculated difficulty index per question.
          </p>
        </div>

        {(!analytics.question_analysis || analytics.question_analysis.length === 0) ? (
          <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#64748B' }}>
            No question analysis data available for this examination.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #E2E8F0', color: '#64748B', fontSize: '0.74rem', textTransform: 'uppercase', background: '#F8FAFC' }}>
                  <th style={{ padding: '0.75rem 0.85rem', width: '50px' }}>#</th>
                  <th style={{ padding: '0.75rem 0.85rem' }}>Question</th>
                  <th style={{ padding: '0.75rem 0.85rem' }}>Type & Marks</th>
                  <th style={{ padding: '0.75rem 0.85rem' }}>Attempts</th>
                  <th style={{ padding: '0.75rem 0.85rem' }}>Correct</th>
                  <th style={{ padding: '0.75rem 0.85rem' }}>Wrong</th>
                  <th style={{ padding: '0.75rem 0.85rem' }}>Skipped</th>
                  <th style={{ padding: '0.75rem 0.85rem' }}>Correct %</th>
                  <th style={{ padding: '0.75rem 0.85rem', textAlign: 'right' }}>Difficulty</th>
                </tr>
              </thead>
              <tbody>
                {analytics.question_analysis.map((q, idx) => {
                  const diffColor = q.difficulty === 'Easy' ? '#059669' : q.difficulty === 'Medium' ? '#D97706' : '#DC2626';
                  const diffBg = q.difficulty === 'Easy' ? '#ECFDF5' : q.difficulty === 'Medium' ? '#FFFBEB' : '#FEF2F2';
                  return (
                    <tr key={q.question_id || idx} style={{ borderBottom: '1px solid #F1F5F9' }}>
                      <td style={{ padding: '0.75rem 0.85rem', fontWeight: 700, color: '#64748B' }}>
                        {idx + 1}
                      </td>
                      <td style={{ padding: '0.75rem 0.85rem', maxWidth: '350px' }}>
                        <div style={{ fontWeight: 600, color: 'var(--color-navy)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {q.question_text}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: '#64748B' }}>{q.subject}</div>
                      </td>
                      <td style={{ padding: '0.75rem 0.85rem', color: '#475569' }}>
                        <span style={{ background: '#F1F5F9', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.74rem', fontWeight: 600 }}>
                          {q.question_type} ({q.marks}M)
                        </span>
                      </td>
                      <td style={{ padding: '0.75rem 0.85rem', fontWeight: 600, color: '#334155' }}>
                        {q.total_attempts}
                      </td>
                      <td style={{ padding: '0.75rem 0.85rem', fontWeight: 700, color: '#059669' }}>
                        {q.correct_answers}
                      </td>
                      <td style={{ padding: '0.75rem 0.85rem', fontWeight: 700, color: '#DC2626' }}>
                        {q.wrong_answers}
                      </td>
                      <td style={{ padding: '0.75rem 0.85rem', color: '#94A3B8' }}>
                        {q.skipped}
                      </td>
                      <td style={{ padding: '0.75rem 0.85rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span style={{ fontWeight: 700, minWidth: '35px' }}>{q.correct_percentage}%</span>
                          <div style={{ width: '70px', height: '6px', background: '#E2E8F0', borderRadius: '4px', overflow: 'hidden' }}>
                            <div
                              style={{
                                width: `${q.correct_percentage}%`,
                                height: '100%',
                                background: q.correct_percentage >= 70 ? '#10B981' : q.correct_percentage >= 40 ? 'var(--color-orange)' : '#EF4444'
                              }}
                            />
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '0.75rem 0.85rem', textAlign: 'right' }}>
                        <span style={{
                          padding: '0.2rem 0.55rem',
                          borderRadius: '999px',
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          background: diffBg,
                          color: diffColor
                        }}>
                          {q.difficulty}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default TeacherTestAnalyticsPage;
