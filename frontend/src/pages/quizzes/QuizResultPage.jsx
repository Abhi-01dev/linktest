import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../../services/api';
import {
  Award,
  CheckCircle2,
  XCircle,
  RotateCcw,
  LayoutDashboard,
  Check,
  X,
  HelpCircle,
  Sparkles
} from 'lucide-react';

export function QuizResultPage() {
  const { attemptId } = useParams();
  const [attempt, setAttempt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadResults() {
      setLoading(true);
      try {
        const data = await api.getAttemptDetails(attemptId);
        setAttempt(data);
      } catch (err) {
        setError(err.message || 'Failed to load results');
      } finally {
        setLoading(false);
      }
    }

    loadResults();
  }, [attemptId]);

  if (loading) {
    return (
      <div className="container" style={{ padding: '5rem 1.5rem', maxWidth: '820px' }}>
        <div className="skeleton" style={{ height: '220px', borderRadius: 'var(--radius-lg)', marginBottom: '2rem' }} />
        <div className="skeleton" style={{ height: '300px', borderRadius: 'var(--radius-lg)' }} />
      </div>
    );
  }

  if (error || !attempt) {
    return (
      <div className="container" style={{ padding: '5rem 1.5rem', textAlign: 'center' }}>
        <h2>Results Unavailable</h2>
        <p style={{ marginTop: '0.5rem', marginBottom: '1.5rem' }}>{error || 'Could not find attempt results.'}</p>
        <Link to="/dashboard" className="btn btn-primary">
          Return to Dashboard
        </Link>
      </div>
    );
  }

  const scorePct = Math.round((attempt.score / attempt.total_questions) * 100);
  const isPassed = scorePct >= 60;
  const results = attempt.results || [];

  return (
    <div style={{ padding: '3rem 0 5rem' }}>
      <div className="container" style={{ maxWidth: '860px' }}>
        {/* Score Summary Banner */}
        <div
          className="card"
          style={{
            padding: '2.5rem',
            textAlign: 'center',
            background: isPassed
              ? 'linear-gradient(135deg, #064E3B 0%, var(--color-navy) 100%)'
              : 'linear-gradient(135deg, #78350F 0%, var(--color-navy) 100%)',
            color: '#FFFFFF',
            border: 'none',
            borderRadius: 'var(--radius-xl)',
            marginBottom: '3rem',
            boxShadow: 'var(--shadow-xl)'
          }}
        >
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: '50%',
              background: isPassed ? '#10B981' : 'var(--color-orange)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.25rem',
              color: '#FFFFFF',
              boxShadow: 'var(--shadow-glow)'
            }}
          >
            <Award size={38} />
          </div>

          <span
            className="badge"
            style={{
              background: isPassed ? 'rgba(16, 185, 129, 0.2)' : 'rgba(249, 115, 22, 0.2)',
              color: isPassed ? '#6EE7B7' : '#FED7AA',
              border: `1px solid ${isPassed ? '#059669' : '#C2410C'}`,
              marginBottom: '0.75rem'
            }}
          >
            {isPassed ? 'ASSESSMENT PASSED' : 'NEEDS PRACTICE'}
          </span>

          <h1 style={{ fontSize: '2.4rem', color: '#FFFFFF', marginBottom: '0.5rem' }}>
            Score: {attempt.score} / {attempt.total_questions} ({scorePct}%)
          </h1>

          <p style={{ color: '#E2E8F0', fontSize: '1rem', maxWidth: '580px', margin: '0 auto 2rem' }}>
            {isPassed
              ? 'Excellent performance! You demonstrated solid mastery of the concepts assessed.'
              : 'Keep practicing! Review the server explanations below and consult the AI Tutor for tricky topics.'}
          </p>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <Link to={`/quiz/${attempt.quiz_id}`} className="btn btn-outline" style={{ background: '#FFFFFF', color: 'var(--color-navy)' }}>
              <RotateCcw size={16} />
              <span>Retake Assessment</span>
            </Link>
            <Link to="/dashboard" className="btn btn-primary">
              <LayoutDashboard size={16} />
              <span>Student Dashboard</span>
            </Link>
            <Link to="/ai-tutor" className="btn btn-secondary">
              <Sparkles size={16} />
              <span>Review with AI Tutor</span>
            </Link>
          </div>
        </div>

        {/* Detailed Question Review List */}
        <div style={{ marginBottom: '2.5rem' }}>
          <h2 style={{ fontSize: '1.6rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <CheckCircle2 size={24} style={{ color: 'var(--color-orange)' }} />
            <span>Question Breakdown & Server Explanations</span>
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
            {results.map((r, idx) => {
              const isLongAnswer = r.question_type === 'long_answer' || r.question_type === 'subjective';
              const isCoding = r.question_type === 'coding';
              const isPendingReview = isLongAnswer && Boolean(r.is_pending_review);
              const options = typeof r.options === 'string' ? JSON.parse(r.options) : r.options || [];
              const isCorrect = r.is_correct;

              return (
                <div
                  key={r.question_id || idx}
                  className="card"
                  style={{
                    padding: '2rem',
                    borderLeft: `5px solid ${isPendingReview ? '#F59E0B' : isCorrect ? 'var(--color-success)' : 'var(--color-danger)'}`
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
                      Question {idx + 1} {isCoding ? '• Coding' : isLongAnswer ? '• Long Answer' : ''}
                    </span>
                    <span
                      className={`badge ${isPendingReview ? 'badge-warning' : isCorrect ? 'badge-success' : 'badge-warning'}`}
                      style={{
                        fontSize: '0.75rem',
                        background: isPendingReview ? '#FEF3C7' : undefined,
                        color: isPendingReview ? '#B45309' : undefined
                      }}
                    >
                      {isPendingReview ? 'Pending Evaluation' : isCoding ? (isCorrect ? 'All Tests Passed ✓' : 'Tests Failed ✗') : isCorrect ? 'Correct ✓' : 'Incorrect ✗'}
                    </span>
                  </div>

                  <h3 style={{ fontSize: '1.15rem', lineHeight: 1.4, marginBottom: '1.25rem' }}>
                    {r.question_text}
                  </h3>

                  {/* Long Answer Display */}
                  {isLongAnswer ? (
                    <div style={{ background: '#F8FAFC', padding: '1rem', borderRadius: '8px', marginBottom: '1.25rem', border: '1px solid #E2E8F0' }}>
                      <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#64748B', marginBottom: '0.35rem' }}>Your Answer:</div>
                      <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.5, fontSize: '0.9rem' }}>
                        {r.response_text || r.text || '(No answer provided)'}
                      </div>
                      {r.evaluation_comment && (
                        <div style={{ marginTop: '0.5rem', background: '#EFF6FF', padding: '0.5rem 0.75rem', borderRadius: '4px', color: '#1D4ED8', fontSize: '0.82rem' }}>
                          <strong>Teacher Feedback:</strong> {r.evaluation_comment}
                        </div>
                      )}
                    </div>
                  ) : isCoding ? (
                    /* Coding Question Display */
                    <div style={{ background: '#0F172A', color: '#F8FAFC', padding: '1rem', borderRadius: '8px', marginBottom: '1.25rem' }}>
                      <div style={{ fontSize: '0.8rem', color: '#94A3B8', marginBottom: '0.35rem' }}>Your Submitted Code:</div>
                      <pre style={{ margin: 0, fontFamily: 'monospace', fontSize: '0.82rem', overflowX: 'auto' }}>
                        {r.response_text || r.code || '(No code submitted)'}
                      </pre>
                      {r.execution_results && (
                        <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: '#38BDF8' }}>
                          Tests Passed: {r.execution_results.test_cases_passed || 0} / {r.execution_results.total_test_cases || 0}
                        </div>
                      )}
                    </div>
                  ) : (
                    /* Options List with Highlight (MCQ / True False) */
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginBottom: '1.25rem' }}>
                      {options.map((opt, optIdx) => {
                        const isUserSelection = r.selected_option_index === optIdx;
                        const isTheCorrectOption = r.correct_option_index === optIdx;

                        let borderColor = 'var(--color-border)';
                        let bgColor = '#FFFFFF';
                        let labelColor = 'var(--color-text-primary)';

                        if (isTheCorrectOption) {
                          borderColor = '#10B981';
                          bgColor = '#ECFDF5';
                          labelColor = '#065F46';
                        } else if (isUserSelection && !isCorrect) {
                          borderColor = '#EF4444';
                          bgColor = '#FEF2F2';
                          labelColor = '#991B1B';
                        }

                        return (
                          <div
                            key={optIdx}
                            style={{
                              padding: '0.75rem 1rem',
                              borderRadius: 'var(--radius-md)',
                              border: `1.5px solid ${borderColor}`,
                              background: bgColor,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              fontSize: '0.9rem'
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                              <span style={{ fontWeight: 700, color: labelColor }}>
                                {String.fromCharCode(65 + optIdx)}.
                              </span>
                              <span style={{ color: labelColor, fontWeight: isTheCorrectOption ? 600 : 400 }}>
                                {opt}
                              </span>
                            </div>

                            <div style={{ fontSize: '0.75rem', fontWeight: 700 }}>
                              {isTheCorrectOption && (
                                <span style={{ color: '#059669', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                  <Check size={14} /> Correct Answer
                                </span>
                              )}
                              {isUserSelection && !isCorrect && (
                                <span style={{ color: '#DC2626', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                  <X size={14} /> Your Choice
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Educational Server Explanation */}
                  {r.explanation && (
                    <div
                      style={{
                        padding: '1rem 1.25rem',
                        background: 'var(--color-bg-alt)',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--color-border)',
                        fontSize: '0.875rem',
                        lineHeight: 1.6
                      }}
                    >
                      <strong style={{ color: 'var(--color-navy)', display: 'block', marginBottom: '0.25rem' }}>
                        💡 Educational Explanation:
                      </strong>
                      <p style={{ margin: 0, color: 'var(--color-text-secondary)' }}>
                        {r.explanation}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
