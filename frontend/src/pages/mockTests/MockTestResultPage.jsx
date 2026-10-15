// Mock Test Result & Detailed Performance Scorecard
// LinkTest Secure Examination System

import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import {
  Award,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  Printer,
  RotateCcw,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  ArrowLeft,
  FileText,
  HelpCircle
} from 'lucide-react';

export function MockTestResultPage() {
  const { attemptId } = useParams();
  const { user } = useAuth();

  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterType, setFilterType] = useState('all'); // 'all', 'correct', 'incorrect', 'unanswered'

  useEffect(() => {
    async function loadResult() {
      if (!attemptId || attemptId === 'undefined' || attemptId === 'null' || !String(attemptId).trim()) {
        setError('Invalid examination attempt ID specified.');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const data = await api.getMockTestAttemptResult(attemptId);
        setResult(data);
      } catch (err) {
        console.error('Failed to load result:', err);
        setError(err.message || 'Unable to retrieve test result.');
      } finally {
        setLoading(false);
      }
    }
    loadResult();
  }, [attemptId]);

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '6rem 1rem' }}>
        <div className="spinner" style={{ margin: '0 auto 1rem' }}></div>
        <p style={{ color: 'var(--color-navy)', fontWeight: 600 }}>Calculating Assessment Scorecard...</p>
      </div>
    );
  }

  if (error || !result) {
    return (
      <div className="container" style={{ padding: '4rem 1rem', maxWidth: '600px' }}>
        <div style={{
          background: 'var(--color-danger-bg)',
          border: '1px solid var(--color-danger)',
          color: 'var(--color-danger)',
          padding: '1.75rem',
          borderRadius: 'var(--radius-md)',
          textAlign: 'center'
        }}>
          <h3>Scorecard Unavailable</h3>
          <p>{error || 'Result details could not be found.'}</p>
          <Link to="/mock-tests" className="btn btn-secondary" style={{ marginTop: '1rem' }}>
            Back to Mock Tests
          </Link>
        </div>
      </div>
    );
  }

  const correctCount = result.correct_count ?? result.correctCount ?? result.attempt?.correct_count ?? result.attempt?.correctCount ?? 0;
  const incorrectCount = result.incorrect_count ?? result.incorrectCount ?? result.attempt?.incorrect_count ?? result.attempt?.incorrectCount ?? 0;
  const unansweredCount = result.unanswered_count ?? result.unansweredCount ?? result.attempt?.unanswered_count ?? result.attempt?.unansweredCount ?? 0;
  const totalScore = result.total_score ?? result.totalScore ?? result.attempt?.total_score ?? result.attempt?.totalScore ?? 0;
  const maxScore = result.max_score ?? result.maxScore ?? result.attempt?.max_score ?? result.attempt?.maxScore ?? (result.test?.total_marks ?? 100);
  const percentage = result.percentage ?? result.attempt?.percentage ?? 0;
  const passed = result.passed ?? result.attempt?.passed ?? false;
  const passPercentage = result.pass_percentage ?? result.passPercentage ?? result.test?.pass_percentage ?? 40;
  const testTitle = result.test_title || result.title || result.test?.title || 'Mock Examination';
  const subject = result.subject || result.test?.subject || 'Examination';
  const timeSpentSeconds = result.time_spent_seconds ?? result.timeSpentSeconds ?? result.attempt?.time_spent_seconds ?? 0;

  const filteredQuestions = (result.questions || []).filter(q => {
    if (filterType === 'correct') return q.is_correct === true;
    if (filterType === 'incorrect') return q.is_correct === false;
    if (filterType === 'unanswered') return q.candidate_response === null || q.candidate_response === undefined;
    return true;
  });

  const accuracy = (correctCount + incorrectCount) > 0
    ? Math.round((correctCount / (correctCount + incorrectCount)) * 100)
    : 0;

  return (
    <div style={{ padding: '2.5rem 0 5rem', background: 'var(--color-bg-main)', minHeight: '90vh' }}>
      <div className="container" style={{ maxWidth: '900px' }}>
        {/* Navigation & Actions */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <Link to="/mock-tests" style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            color: 'var(--color-text-secondary)',
            fontSize: '0.88rem',
            fontWeight: 600
          }}>
            <ArrowLeft size={16} />
            <span>Back to All Mock Tests</span>
          </Link>

          <button
            onClick={() => window.print()}
            className="btn btn-secondary"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              fontSize: '0.84rem'
            }}
          >
            <Printer size={15} />
            <span>Print Scorecard</span>
          </button>
        </div>

        {/* Hero Scorecard Card */}
        <div style={{
          background: '#FFFFFF',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--color-border)',
          boxShadow: 'var(--shadow-md)',
          padding: '2.25rem',
          marginBottom: '2rem'
        }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1.5rem' }}>
            <div>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-orange-dark)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {subject} • Assessment Scorecard
              </div>
              <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--color-navy)', margin: '0.3rem 0 0.5rem' }}>
                {testTitle}
              </h1>
              <div style={{ fontSize: '0.84rem', color: 'var(--color-text-secondary)' }}>
                Candidate: <strong>{user?.full_name}</strong> • Completed on {new Date(result.submitted_at || result.submittedAt || Date.now()).toLocaleString()}
              </div>
            </div>

            {/* Pass / Fail Big Badge */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              padding: '0.75rem 1.5rem',
              borderRadius: 'var(--radius-md)',
              background: passed ? '#ECFDF5' : '#FEF2F2',
              border: `2px solid ${passed ? '#10B981' : '#EF4444'}`
            }}>
              <span style={{
                fontSize: '1.25rem',
                fontWeight: 900,
                color: passed ? '#059669' : '#DC2626',
                letterSpacing: '0.05em'
              }}>
                {passed ? 'PASSED' : 'NEEDS PRACTICE'}
              </span>
              <span style={{ fontSize: '0.75rem', color: '#64748B' }}>
                Pass Cutoff: {passPercentage}%
              </span>
            </div>
          </div>

          {/* Metrics Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
            gap: '1rem',
            marginTop: '2rem'
          }}>
            <div style={{ background: 'var(--color-bg-alt)', padding: '1.25rem', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>SCORE OBTAINED</div>
              <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#2563EB', marginTop: '0.2rem' }}>
                {totalScore} <span style={{ fontSize: '1rem', color: '#64748B' }}>/ {maxScore}</span>
              </div>
              <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '0.2rem' }}>{percentage}% Marks</div>
            </div>

            <div style={{ background: 'var(--color-bg-alt)', padding: '1.25rem', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>ACCURACY</div>
              <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#059669', marginTop: '0.2rem' }}>
                {accuracy}%
              </div>
              <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '0.2rem' }}>Of attempted questions</div>
            </div>

            <div style={{ background: 'var(--color-bg-alt)', padding: '1.25rem', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>TIME SPENT</div>
              <div style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--color-navy)', marginTop: '0.2rem' }}>
                {Math.floor(timeSpentSeconds / 60)}m {timeSpentSeconds % 60}s
              </div>
              <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '0.2rem' }}>Total examination time</div>
            </div>

            <div style={{ background: 'var(--color-bg-alt)', padding: '1.25rem', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>BREAKDOWN</div>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                <span style={{ color: '#059669' }}>✓ {correctCount} Correct</span>
                <span style={{ color: '#DC2626' }}>✗ {incorrectCount} Incorrect</span>
                <span style={{ color: '#64748B' }}>○ {unansweredCount} Unanswered</span>
              </div>
            </div>
          </div>
        </div>

        {/* Proctoring Verification Summary Card */}
        <div style={{
          background: '#FFFFFF',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--color-border)',
          padding: '1.5rem',
          marginBottom: '2rem',
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <div style={{
            width: '44px', height: '44px', borderRadius: '50%',
            background: result.proctoring_summary?.flagged ? '#FEF2F2' : '#ECFDF5',
            color: result.proctoring_summary?.flagged ? '#EF4444' : '#10B981',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0
          }}>
            {result.proctoring_summary?.flagged ? <AlertTriangle size={22} /> : <ShieldCheck size={22} />}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--color-navy)' }}>
              Proctoring Session Diagnostics: {result.proctoring_summary?.flagged ? 'Flagged for Faculty Verification' : 'Clean Session Verified'}
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginTop: '0.2rem' }}>
              Warnings triggered: <strong>{result.warning_count || 0}</strong> •
              Tab focus events: <strong>{result.proctoring_summary?.tab_switch_events || 0}</strong> •
              Face detection anomalies: <strong>{result.proctoring_summary?.face_absence_events || 0}</strong>
            </div>
          </div>
        </div>

        {/* Question Review Section */}
        {result.results_released ? (
          <div>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '1rem'
            }}>
              <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--color-navy)', margin: 0 }}>
                Detailed Question & Solution Review
              </h2>

              {/* Filters */}
              <div style={{ display: 'flex', gap: '0.4rem' }}>
                {[
                  { id: 'all', label: 'All Questions' },
                  { id: 'correct', label: `Correct (${result.correct_count})` },
                  { id: 'incorrect', label: `Incorrect (${result.incorrect_count})` },
                  { id: 'unanswered', label: `Unanswered (${result.unanswered_count})` }
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setFilterType(tab.id)}
                    style={{
                      padding: '0.35rem 0.75rem',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      border: 'none',
                      background: filterType === tab.id ? 'var(--color-navy)' : 'var(--color-bg-alt)',
                      color: filterType === tab.id ? '#FFFFFF' : 'var(--color-text-secondary)',
                      cursor: 'pointer'
                    }}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Questions List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {filteredQuestions.map((q, idx) => {
                const isCorrect = q.is_correct === true;
                const isIncorrect = q.is_correct === false;
                const isUnanswered = q.candidate_response === null || q.candidate_response === undefined;

                return (
                  <div
                    key={q.id}
                    style={{
                      background: '#FFFFFF',
                      borderRadius: 'var(--radius-md)',
                      border: `1px solid ${isCorrect ? '#A7F3D0' : isIncorrect ? '#FECACA' : '#E2E8F0'}`,
                      padding: '1.5rem',
                      boxShadow: 'var(--shadow-sm)'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--color-navy)' }}>
                          Question #{idx + 1}
                        </span>
                        <span style={{
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          padding: '0.15rem 0.5rem',
                          borderRadius: '999px',
                          background: isCorrect ? '#ECFDF5' : isIncorrect ? '#FEF2F2' : '#F1F5F9',
                          color: isCorrect ? '#059669' : isIncorrect ? '#DC2626' : '#64748B'
                        }}>
                          {isCorrect ? 'Correct' : isIncorrect ? 'Incorrect' : 'Unanswered'}
                        </span>
                      </div>

                      <div style={{ fontSize: '0.84rem', fontWeight: 700 }}>
                        Marks: <span style={{ color: q.score_awarded > 0 ? '#059669' : q.score_awarded < 0 ? '#DC2626' : '#64748B' }}>
                          {q.score_awarded > 0 ? `+${q.score_awarded}` : q.score_awarded} / {q.marks}
                        </span>
                      </div>
                    </div>

                    <div style={{ fontSize: '0.96rem', fontWeight: 600, color: 'var(--color-navy)', lineHeight: 1.5, marginBottom: '1rem' }}>
                      {q.question_text}
                    </div>

                    {/* Candidate Answer vs Solution */}
                    <div style={{
                      background: '#F8FAFC',
                      padding: '0.85rem 1rem',
                      borderRadius: '8px',
                      fontSize: '0.85rem',
                      marginBottom: '1rem'
                    }}>
                      <div style={{ marginBottom: '0.35rem' }}>
                        <span style={{ color: '#64748B' }}>Your Answer: </span>
                        <strong>
                          {q.candidate_response?.selected_index !== undefined
                            ? q.options?.[q.candidate_response.selected_index] || `Option #${q.candidate_response.selected_index + 1}`
                            : q.candidate_response?.selected_value !== undefined
                            ? String(q.candidate_response.selected_value).toUpperCase()
                            : q.candidate_response?.text || q.candidate_response?.number || 'None (Unanswered)'}
                        </strong>
                      </div>

                      {q.answer_key && (
                        <div>
                          <span style={{ color: '#059669', fontWeight: 600 }}>Correct Answer: </span>
                          <strong style={{ color: '#059669' }}>
                            {q.answer_key.correct_index !== undefined
                              ? q.options?.[q.answer_key.correct_index] || `Option #${q.answer_key.correct_index + 1}`
                              : q.answer_key.correct_value !== undefined
                              ? String(q.answer_key.correct_value).toUpperCase()
                              : q.answer_key.target_value !== undefined
                              ? q.answer_key.target_value
                              : (q.answer_key.accepted_answers || []).join(' / ') || 'Refer to solution key'}
                          </strong>
                        </div>
                      )}
                    </div>

                    {/* Explanation */}
                    {q.explanation && (
                      <div style={{
                        background: '#EFF6FF',
                        borderLeft: '3px solid #2563EB',
                        padding: '0.75rem 1rem',
                        borderRadius: '4px',
                        fontSize: '0.84rem',
                        lineHeight: 1.5,
                        color: '#1E3A8A'
                      }}>
                        <strong>Explanation: </strong> {q.explanation}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div style={{
            background: '#FFFFFF',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--color-border)',
            padding: '3rem 2rem',
            textAlign: 'center'
          }}>
            <FileText size={40} style={{ color: '#94A3B8', margin: '0 auto 1rem' }} />
            <h3 style={{ fontSize: '1.15rem', color: 'var(--color-navy)', marginBottom: '0.4rem' }}>
              Submission Recorded Successfully
            </h3>
            <p style={{ color: 'var(--color-text-secondary)', maxWidth: '420px', margin: '0 auto' }}>
              Detailed question solutions and individual answer keys have not been published by the faculty yet. You will be able to review full explanations once released.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
export default MockTestResultPage;
