// Teacher Proctoring Event Review & Evaluation Studio
// LinkTest Enterprise Examination System

import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../../services/api';
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Clock,
  User,
  Check,
  EyeOff,
  Maximize2,
  Camera,
  MessageSquare,
  Code,
  FileText,
  Layers,
  Send,
  Terminal,
  Save
} from 'lucide-react';

export function TeacherProctoringReviewPage() {
  const { id, attemptId } = useParams();

  const [attempt, setAttempt] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [activeReviewTab, setActiveReviewTab] = useState('grading'); // 'grading', 'proctoring'
  const [questionTypeFilter, setQuestionTypeFilter] = useState('all');

  const [selectedEvent, setSelectedEvent] = useState(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [reviewing, setReviewing] = useState(false);

  // Manual evaluation form states per question: { [qId]: { score, comment, saving, success } }
  const [evaluations, setEvaluations] = useState({});
  const [releasingResult, setReleasingResult] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [attemptRes, eventsRes] = await Promise.all([
        api.getMockTestAttemptResult(attemptId),
        api.getMockTestProctoringEvents(attemptId)
      ]);
      setAttempt(attemptRes);
      setEvents(eventsRes || []);

      // Initialize evaluation form values with existing scores
      const initialEvals = {};
      (attemptRes.questions || []).forEach(q => {
        initialEvals[q.id] = {
          score: q.score_awarded !== undefined && q.score_awarded !== null ? q.score_awarded : (q.is_pending_review ? '' : 0),
          comment: q.evaluation_comment || '',
          saving: false,
          success: false
        };
      });
      setEvaluations(initialEvals);
    } catch (err) {
      console.error('Failed to load review data:', err);
      setError(err.message || 'Unable to retrieve attempt details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [attemptId]);

  const handleUpdateReview = async (eventId, reviewStatus) => {
    setReviewing(true);
    try {
      await api.reviewMockTestProctoringEvent(eventId, {
        review_status: reviewStatus,
        review_notes: reviewNotes || (reviewStatus === 'dismissed' ? 'Dismissed as technical false-positive' : 'Confirmed irregularity')
      });
      setReviewNotes('');
      setSelectedEvent(null);
      await loadData();
    } catch (err) {
      alert(err.message || 'Review update failed.');
    } finally {
      setReviewing(false);
    }
  };

  const handleSaveEvaluation = async (questionId, maxMarks) => {
    const evalData = evaluations[questionId] || {};
    const scoreVal = evalData.score !== undefined && evalData.score !== '' ? parseFloat(evalData.score) : 0;

    if (isNaN(scoreVal) || scoreVal < 0 || scoreVal > maxMarks) {
      alert(`Please enter a valid score between 0 and ${maxMarks}.`);
      return;
    }

    setEvaluations(prev => ({
      ...prev,
      [questionId]: { ...prev[questionId], saving: true, success: false }
    }));

    try {
      await api.evaluateMockTestResponse(attemptId, questionId, {
        score: scoreVal,
        comment: evalData.comment || ''
      });

      setEvaluations(prev => ({
        ...prev,
        [questionId]: { ...prev[questionId], saving: false, success: true }
      }));

      setTimeout(() => {
        setEvaluations(prev => ({
          ...prev,
          [questionId]: { ...prev[questionId], success: false }
        }));
      }, 3000);

      // Refresh attempt data to reflect updated total score
      const updatedAttempt = await api.getMockTestAttemptResult(attemptId);
      setAttempt(updatedAttempt);
    } catch (err) {
      alert(err.message || 'Evaluation update failed.');
      setEvaluations(prev => ({
        ...prev,
        [questionId]: { ...prev[questionId], saving: false }
      }));
    }
  };

  const handleReleaseResult = async () => {
    const confirmed = window.confirm("Release this result to the student?");
    if (!confirmed) return;

    setReleasingResult(true);
    try {
      await api.releaseMockTestAttemptResult(attemptId);
      setAttempt(prev => ({
        ...prev,
        result_status: 'RELEASED',
        results_released: true,
        released_at: new Date().toISOString()
      }));
      alert('Examination result successfully released to the student!');
    } catch (err) {
      alert(err.message || 'Failed to release result.');
    } finally {
      setReleasingResult(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '6rem' }}>
        <div className="spinner" style={{ margin: '0 auto 1rem' }}></div>
        <p>Loading candidate evaluation details...</p>
      </div>
    );
  }

  if (error || !attempt) {
    return (
      <div style={{ padding: '2rem', maxWidth: '600px', margin: '0 auto' }}>
        <div style={{ background: '#FEF2F2', border: '1px solid #EF4444', color: '#DC2626', padding: '1.5rem', borderRadius: '8px' }}>
          <h3>Review Error</h3>
          <p>{error || 'Attempt records not found.'}</p>
          <Link to={`/teacher/mock-tests/${id}/analytics`} className="btn btn-secondary" style={{ marginTop: '1rem' }}>
            Back to Analytics
          </Link>
        </div>
      </div>
    );
  }

  const isFlagged = attempt.proctoring_summary?.flagged || (attempt.warning_count || 0) >= 5;
  const questionsList = attempt.questions || [];

  const filteredQuestions = questionsList.filter(q => {
    if (questionTypeFilter === 'all') return true;
    if (questionTypeFilter === 'long_answer') return q.question_type === 'long_answer' || q.question_type === 'subjective';
    if (questionTypeFilter === 'coding') return q.question_type === 'coding';
    if (questionTypeFilter === 'mcq') return ['mcq_single', 'mcq_multiple'].includes(q.question_type);
    if (questionTypeFilter === 'true_false') return q.question_type === 'true_false';
    return true;
  });

  return (
    <div style={{ padding: '2rem', maxWidth: '1080px', margin: '0 auto' }}>
      {/* Top Header */}
      <div style={{ marginBottom: '1.5rem' }}>
        <Link
          to={`/teacher/mock-tests/${id}/analytics`}
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
          <span>Back to Test Analytics</span>
        </Link>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#2563EB', textTransform: 'uppercase' }}>
              EXAMINATION SUBMISSION & EVALUATION STUDIO
            </div>
            <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--color-navy)', margin: '0.2rem 0' }}>
              Candidate: {attempt.student_name || 'Student'} • Attempt #{attempt.attempt_id?.slice(-8)}
            </h1>
            <div style={{ fontSize: '0.88rem', color: 'var(--color-text-secondary)' }}>
              Examination: <strong>{attempt.test_title}</strong>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            {attempt.result_status === 'RELEASED' ? (
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.5rem 1rem',
                borderRadius: '8px',
                background: '#ECFDF5',
                color: '#059669',
                border: '1px solid #A7F3D0',
                fontWeight: 700,
                fontSize: '0.85rem'
              }}>
                <CheckCircle2 size={16} />
                <span>Result Released to Student</span>
              </div>
            ) : (
              <button
                onClick={handleReleaseResult}
                disabled={releasingResult}
                className="btn btn-primary"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontWeight: 800,
                  background: '#059669',
                  borderColor: '#059669',
                  boxShadow: '0 4px 12px rgba(5, 150, 105, 0.2)'
                }}
              >
                <Send size={15} />
                <span>{releasingResult ? 'Releasing Result...' : 'Release Result'}</span>
              </button>
            )}

            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.5rem 1rem',
              borderRadius: '999px',
              background: isFlagged ? '#FEF2F2' : '#ECFDF5',
              color: isFlagged ? '#DC2626' : '#059669',
              border: `1px solid ${isFlagged ? '#FECACA' : '#A7F3D0'}`,
              fontWeight: 700,
              fontSize: '0.85rem'
            }}>
              {isFlagged ? <AlertTriangle size={16} /> : <ShieldCheck size={16} />}
              <span>{isFlagged ? 'Flagged for Proctoring Verification' : 'Standard Verification Session'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Auto-Submitted Security Notice if applicable (Requirement 18) */}
      {(attempt.status === 'AUTO_SUBMITTED' || attempt.submission_status === 'AUTO_SUBMITTED') && (
        <div style={{
          background: '#FEF2F2',
          border: '1px solid #F87171',
          borderRadius: 'var(--radius-lg, 12px)',
          padding: '1.25rem 1.5rem',
          marginBottom: '1.5rem',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '1rem'
        }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            background: '#FEE2E2',
            color: '#DC2626',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <ShieldAlert size={22} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '1.05rem', fontWeight: 800, color: '#991B1B' }}>
                AUTOMATICALLY SUBMITTED ATTEMPT
              </span>
              <span style={{
                background: '#DC2626',
                color: '#FFFFFF',
                fontSize: '0.75rem',
                fontWeight: 800,
                padding: '0.2rem 0.6rem',
                borderRadius: '999px',
                textTransform: 'uppercase'
              }}>
                {attempt.status}
              </span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem', marginTop: '0.75rem', fontSize: '0.88rem', color: '#7F1D1D' }}>
              <div><strong>Student:</strong> {attempt.student_name || 'Candidate'}</div>
              <div><strong>Reason:</strong> <code style={{ background: '#FEE2E2', padding: '0.15rem 0.4rem', borderRadius: '4px', fontWeight: 700 }}>{attempt.submission_reason || 'MAX_SECURITY_WARNINGS'}</code></div>
              <div><strong>Security Warnings:</strong> {attempt.security_warning_count ?? attempt.warning_count ?? 0}</div>
              <div><strong>Fullscreen Exits:</strong> {attempt.fullscreen_exit_count || 0} / 2</div>
              <div><strong>Finalized At:</strong> {attempt.submitted_at ? new Date(attempt.submitted_at).toLocaleString() : 'N/A'}</div>
            </div>
          </div>
        </div>
      )}

      {/* Overview Metric Banner */}
      <div style={{
        background: '#FFFFFF',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--color-border)',
        boxShadow: 'var(--shadow-sm)',
        padding: '1.5rem',
        marginBottom: '1.75rem',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
        gap: '1rem',
        textAlign: 'center'
      }}>
        <div style={{ background: 'var(--color-bg-alt)', padding: '1rem', borderRadius: '8px' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B' }}>TOTAL SCORE</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#2563EB', marginTop: '0.2rem' }}>
            {attempt.total_score} / {attempt.max_score}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748B' }}>{attempt.percentage}% ({attempt.passed ? 'Passed' : 'Failed'})</div>
        </div>

        <div style={{ background: 'var(--color-bg-alt)', padding: '1rem', borderRadius: '8px' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B' }}>STATUS</div>
          <div style={{
            fontSize: '1.15rem',
            fontWeight: 900,
            color: (attempt.status === 'AUTO_SUBMITTED' || attempt.submission_status === 'AUTO_SUBMITTED') ? '#DC2626' : 'var(--color-navy)',
            marginTop: '0.4rem'
          }}>
            {attempt.status}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748B' }}>{attempt.submission_reason || 'Candidate attempt'}</div>
        </div>

        <div style={{ background: 'var(--color-bg-alt)', padding: '1rem', borderRadius: '8px' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B' }}>SECURITY WARNINGS</div>
          <div style={{
            fontSize: '1.5rem',
            fontWeight: 900,
            color: (attempt.security_warning_count || 0) >= 5 ? '#DC2626' : (attempt.security_warning_count || 0) > 0 ? '#D97706' : '#059669',
            marginTop: '0.2rem'
          }}>
            {attempt.security_warning_count ?? attempt.warning_count ?? 0} / 5
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748B' }}>Violation incidents</div>
        </div>

        <div style={{ background: 'var(--color-bg-alt)', padding: '1rem', borderRadius: '8px' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B' }}>FULLSCREEN EXITS</div>
          <div style={{
            fontSize: '1.5rem',
            fontWeight: 900,
            color: (attempt.fullscreen_exit_count || 0) >= 2 ? '#DC2626' : (attempt.fullscreen_exit_count || 0) > 0 ? '#D97706' : '#059669',
            marginTop: '0.2rem'
          }}>
            {attempt.fullscreen_exit_count || 0} / 2
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748B' }}>Fullscreen departures</div>
        </div>

        <div style={{ background: 'var(--color-bg-alt)', padding: '1rem', borderRadius: '8px' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B' }}>RESULT STATUS</div>
          <div style={{
            fontSize: '1.25rem',
            fontWeight: 900,
            color: attempt.result_status === 'RELEASED' ? '#059669' : attempt.result_status === 'READY' ? '#2563EB' : '#D97706',
            marginTop: '0.2rem'
          }}>
            {attempt.result_status === 'RELEASED' ? 'RELEASED' : attempt.result_status === 'READY' ? 'READY' : 'PENDING'}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748B' }}>
            {attempt.result_status === 'RELEASED' ? 'Visible to candidate' : 'Hidden from candidate'}
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', borderBottom: '2px solid #E2E8F0', paddingBottom: '0.5rem' }}>
        <button
          onClick={() => setActiveReviewTab('grading')}
          style={{
            background: 'none',
            border: 'none',
            padding: '0.6rem 1.25rem',
            fontSize: '0.95rem',
            fontWeight: 800,
            cursor: 'pointer',
            color: activeReviewTab === 'grading' ? '#2563EB' : '#64748B',
            borderBottom: activeReviewTab === 'grading' ? '3px solid #2563EB' : '3px solid transparent',
            marginBottom: '-0.6rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          <FileText size={18} />
          <span>Student Answers & Manual Grading ({questionsList.length})</span>
        </button>

        <button
          onClick={() => setActiveReviewTab('proctoring')}
          style={{
            background: 'none',
            border: 'none',
            padding: '0.6rem 1.25rem',
            fontSize: '0.95rem',
            fontWeight: 800,
            cursor: 'pointer',
            color: activeReviewTab === 'proctoring' ? '#2563EB' : '#64748B',
            borderBottom: activeReviewTab === 'proctoring' ? '3px solid #2563EB' : '3px solid transparent',
            marginBottom: '-0.6rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          <ShieldAlert size={18} />
          <span>Proctoring Security Audit ({events.length} Events)</span>
        </button>
      </div>

      {/* ---------------------------------------------------------------------
          TAB 1: STUDENT ANSWERS & MANUAL EVALUATION
      --------------------------------------------------------------------- */}
      {activeReviewTab === 'grading' && (
        <div>
          {/* Question Type Filter Pills */}
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#64748B', marginRight: '0.25rem' }}>
              Filter Type:
            </span>
            {[
              { id: 'all', label: `All Questions (${questionsList.length})` },
              { id: 'long_answer', label: `Long Answer (${questionsList.filter(q => q.question_type === 'long_answer' || q.question_type === 'subjective').length})` },
              { id: 'coding', label: `Coding (${questionsList.filter(q => q.question_type === 'coding').length})` },
              { id: 'mcq', label: `MCQ (${questionsList.filter(q => ['mcq_single', 'mcq_multiple'].includes(q.question_type)).length})` },
              { id: 'true_false', label: `True/False (${questionsList.filter(q => q.question_type === 'true_false').length})` }
            ].map(pill => (
              <button
                key={pill.id}
                onClick={() => setQuestionTypeFilter(pill.id)}
                style={{
                  padding: '0.35rem 0.75rem',
                  borderRadius: '999px',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  border: '1px solid',
                  cursor: 'pointer',
                  borderColor: questionTypeFilter === pill.id ? '#2563EB' : '#CBD5E1',
                  background: questionTypeFilter === pill.id ? '#EFF6FF' : '#FFFFFF',
                  color: questionTypeFilter === pill.id ? '#1D4ED8' : '#475569'
                }}
              >
                {pill.label}
              </button>
            ))}
          </div>

          {/* Questions Grading List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {filteredQuestions.map((q, idx) => {
              const isLongAnswer = q.question_type === 'long_answer' || q.question_type === 'subjective';
              const isCoding = q.question_type === 'coding';
              const currentEval = evaluations[q.id] || { score: q.score_awarded || 0, comment: '' };

              return (
                <div
                  key={q.id || idx}
                  style={{
                    background: '#FFFFFF',
                    borderRadius: '12px',
                    border: `1.5px solid ${q.is_pending_review ? '#FDE68A' : '#E2E8F0'}`,
                    padding: '1.75rem',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                  }}
                >
                  {/* Question Header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--color-navy)' }}>
                        Question #{idx + 1}
                      </span>

                      <span style={{
                        fontSize: '0.74rem',
                        fontWeight: 800,
                        padding: '0.15rem 0.55rem',
                        borderRadius: '4px',
                        textTransform: 'uppercase',
                        background: isCoding ? '#F3E8FF' : isLongAnswer ? '#EFF6FF' : '#F1F5F9',
                        color: isCoding ? '#7E22CE' : isLongAnswer ? '#1D4ED8' : '#334155',
                        border: `1px solid ${isCoding ? '#E9D5FF' : isLongAnswer ? '#BFDBFE' : '#CBD5E1'}`
                      }}>
                        {isCoding ? 'Coding Question' : isLongAnswer ? 'Long Answer' : q.question_type.replace('_', ' ')}
                      </span>

                      {q.is_pending_review && (
                        <span style={{
                          fontSize: '0.72rem',
                          fontWeight: 800,
                          padding: '0.15rem 0.5rem',
                          borderRadius: '4px',
                          background: '#FEF3C7',
                          color: '#B45309',
                          border: '1px solid #FDE68A'
                        }}>
                          PENDING TEACHER EVALUATION
                        </span>
                      )}
                    </div>

                    <div style={{ fontSize: '0.86rem', fontWeight: 700 }}>
                      Maximum Marks: <strong style={{ color: '#2563EB' }}>{q.marks}</strong>
                    </div>
                  </div>

                  {/* Question Statement */}
                  <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-navy)', marginBottom: '1rem', lineHeight: 1.5 }}>
                    {q.question_text}
                  </div>

                  {/* -----------------------------------------------------------
                      1. LONG ANSWER GRADING INTERFACE
                  ----------------------------------------------------------- */}
                  {isLongAnswer && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      {/* Student Info & Written Answer */}
                      <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '1.25rem' }}>
                        <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748B', marginBottom: '0.4rem' }}>
                          STUDENT: <strong style={{ color: 'var(--color-navy)' }}>{attempt.student_name || 'Candidate'}</strong>
                        </div>
                        <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748B', marginBottom: '0.5rem' }}>
                          STUDENT ANSWER:
                        </div>
                        <div style={{
                          background: '#FFFFFF',
                          border: '1px solid #CBD5E1',
                          borderRadius: '6px',
                          padding: '1rem',
                          fontSize: '0.92rem',
                          lineHeight: 1.6,
                          whiteSpace: 'pre-wrap',
                          color: 'var(--color-navy)'
                        }}>
                          {q.candidate_response?.text || '(Student did not submit an answer for this question)'}
                        </div>
                      </div>

                      {/* Expected Answer & Criteria Guidelines for Teacher */}
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '0.85rem' }}>
                        {q.expected_answer && (
                          <div style={{ background: '#ECFDF5', border: '1px solid #A7F3D0', borderRadius: '6px', padding: '0.85rem' }}>
                            <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#065F46', marginBottom: '0.3rem' }}>
                              EXPECTED ANSWER (MODEL SOLUTION):
                            </div>
                            <div style={{ fontSize: '0.84rem', color: '#065F46', lineHeight: 1.5 }}>
                              {q.expected_answer}
                            </div>
                          </div>
                        )}

                        {q.evaluation_criteria && (
                          <div style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: '6px', padding: '0.85rem' }}>
                            <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#1E40AF', marginBottom: '0.3rem' }}>
                              EVALUATION CRITERIA:
                            </div>
                            <div style={{ fontSize: '0.84rem', color: '#1E40AF', lineHeight: 1.5, whiteSpace: 'pre-line' }}>
                              {q.evaluation_criteria}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Teacher Evaluation Input Form */}
                      <div style={{
                        background: '#FFFBEB',
                        border: '1.5px solid #FDE68A',
                        borderRadius: '8px',
                        padding: '1.25rem'
                      }}>
                        <div style={{ fontSize: '0.86rem', fontWeight: 800, color: '#92400E', marginBottom: '0.85rem' }}>
                          TEACHER EVALUATION & SCORING
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '160px 1fr auto', gap: '1rem', alignItems: 'flex-start' }}>
                          <div>
                            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#78350F', marginBottom: '0.25rem' }}>
                              Score [ / {q.marks} ]
                            </label>
                            <input
                              type="number"
                              step="0.5"
                              min="0"
                              max={q.marks}
                              value={currentEval.score}
                              onChange={(e) => {
                                const val = e.target.value;
                                setEvaluations(prev => ({
                                  ...prev,
                                  [q.id]: { ...prev[q.id], score: val }
                                }));
                              }}
                              placeholder={`0 - ${q.marks}`}
                              style={{
                                width: '100%',
                                padding: '0.55rem',
                                border: '1.5px solid #F59E0B',
                                borderRadius: '6px',
                                fontSize: '1.1rem',
                                fontWeight: 800,
                                background: '#FFFFFF'
                              }}
                            />
                          </div>

                          <div>
                            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#78350F', marginBottom: '0.25rem' }}>
                              Teacher Feedback & Observations
                            </label>
                            <input
                              type="text"
                              value={currentEval.comment}
                              onChange={(e) => {
                                const val = e.target.value;
                                setEvaluations(prev => ({
                                  ...prev,
                                  [q.id]: { ...prev[q.id], comment: val }
                                }));
                              }}
                              placeholder="Constructive feedback for the student..."
                              style={{
                                width: '100%',
                                padding: '0.55rem',
                                border: '1px solid #CBD5E1',
                                borderRadius: '6px',
                                fontSize: '0.88rem',
                                background: '#FFFFFF'
                              }}
                            />
                          </div>

                          <div style={{ paddingTop: '1.5rem' }}>
                            <button
                              type="button"
                              disabled={currentEval.saving}
                              onClick={() => handleSaveEvaluation(q.id, q.marks)}
                              className="btn btn-primary"
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.4rem',
                                fontWeight: 800,
                                background: currentEval.success ? '#059669' : '#2563EB',
                                borderColor: currentEval.success ? '#059669' : '#2563EB',
                                whiteSpace: 'nowrap'
                              }}
                            >
                              {currentEval.success ? <Check size={16} /> : <Save size={16} />}
                              <span>{currentEval.saving ? 'Saving...' : currentEval.success ? 'Saved!' : 'Save Evaluation'}</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* -----------------------------------------------------------
                      2. CODING QUESTION GRADING & SUBMISSION REVIEW
                  ----------------------------------------------------------- */}
                  {isCoding && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      <div style={{ background: '#0F172A', color: '#F8FAFC', borderRadius: '8px', padding: '1.25rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem', fontSize: '0.8rem' }}>
                          <span style={{ color: '#38BDF8', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                            <Code size={14} /> Student Submitted Code ({(q.programming_language || 'javascript').toUpperCase()})
                          </span>
                          <span style={{ color: '#94A3B8' }}>
                            Execution: {q.execution_results?.execution_time_ms || 0} ms • Memory: {q.execution_results?.memory_usage_mb || 0} MB
                          </span>
                        </div>

                        <pre style={{
                          background: '#020617',
                          color: '#F8FAFC',
                          padding: '1rem',
                          borderRadius: '6px',
                          fontSize: '0.85rem',
                          fontFamily: 'monospace',
                          overflowX: 'auto',
                          margin: 0
                        }}>
                          {q.candidate_response?.code || q.candidate_response?.text || '// No code submitted'}
                        </pre>

                        {/* Test Cases Results Summary */}
                        <div style={{ marginTop: '0.85rem', padding: '0.75rem', background: '#1E293B', borderRadius: '6px', fontSize: '0.82rem' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontWeight: 700, color: '#FFFFFF' }}>
                              Automated Sandbox Results: {q.execution_results?.test_cases_passed || 0} / {q.execution_results?.total_test_cases || 0} Test Cases Passed
                            </span>
                            <span style={{
                              fontWeight: 800,
                              padding: '0.15rem 0.5rem',
                              borderRadius: '4px',
                              background: q.is_correct ? '#ECFDF5' : '#FEF2F2',
                              color: q.is_correct ? '#059669' : '#DC2626'
                            }}>
                              Score: {q.score_awarded || 0} / {q.marks}
                            </span>
                          </div>

                          {q.execution_results?.error && (
                            <div style={{ color: '#EF4444', marginTop: '0.4rem', fontFamily: 'monospace', fontSize: '0.78rem' }}>
                              Error: {q.execution_results.error}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Optional Score Override by Teacher */}
                      <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '1rem' }}>
                        <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#475569', marginBottom: '0.5rem' }}>
                          Review / Override Coding Score:
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '160px 1fr auto', gap: '1rem', alignItems: 'flex-start' }}>
                          <div>
                            <input
                              type="number"
                              step="0.5"
                              min="0"
                              max={q.marks}
                              value={currentEval.score}
                              onChange={(e) => setEvaluations(prev => ({
                                ...prev,
                                [q.id]: { ...prev[q.id], score: e.target.value }
                              }))}
                              style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #CBD5E1', fontWeight: 800 }}
                            />
                          </div>
                          <div>
                            <input
                              type="text"
                              value={currentEval.comment}
                              onChange={(e) => setEvaluations(prev => ({
                                ...prev,
                                [q.id]: { ...prev[q.id], comment: e.target.value }
                              }))}
                              placeholder="Instructor feedback on code quality, algorithm, or efficiency..."
                              style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #CBD5E1' }}
                            />
                          </div>
                          <div>
                            <button
                              type="button"
                              disabled={currentEval.saving}
                              onClick={() => handleSaveEvaluation(q.id, q.marks)}
                              className="btn btn-secondary"
                              style={{ fontWeight: 700 }}
                            >
                              {currentEval.success ? 'Score Saved ✓' : 'Save Score Override'}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* -----------------------------------------------------------
                      3. MCQ & TRUE/FALSE REVIEW
                  ----------------------------------------------------------- */}
                  {!isLongAnswer && !isCoding && (
                    <div style={{ background: '#F8FAFC', padding: '1rem', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                      <div style={{ marginBottom: '0.5rem', fontSize: '0.86rem' }}>
                        <span style={{ color: '#64748B' }}>Student Answer: </span>
                        <strong>
                          {q.candidate_response?.selected_index !== undefined
                            ? q.options?.[q.candidate_response.selected_index] || `Option #${q.candidate_response.selected_index + 1}`
                            : q.candidate_response?.selected_value !== undefined
                            ? String(q.candidate_response.selected_value).toUpperCase()
                            : 'Unanswered'}
                        </strong>
                        <span style={{
                          marginLeft: '0.75rem',
                          fontWeight: 700,
                          fontSize: '0.78rem',
                          color: q.is_correct ? '#059669' : '#DC2626'
                        }}>
                          {q.is_correct ? '✓ Awarded' : '✗ Incorrect'} ({q.score_awarded} / {q.marks})
                        </span>
                      </div>

                      {q.explanation && (
                        <div style={{ fontSize: '0.8rem', color: '#64748B' }}>
                          <strong>Explanation:</strong> {q.explanation}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ---------------------------------------------------------------------
          TAB 2: PROCTORING INTEGRITY AUDIT TRAIL
      --------------------------------------------------------------------- */}
      {activeReviewTab === 'proctoring' && (
        <div>
          {/* Policy banner */}
          <div style={{
            background: '#EFF6FF',
            borderLeft: '4px solid #2563EB',
            padding: '1rem 1.25rem',
            borderRadius: '6px',
            fontSize: '0.86rem',
            color: '#1E3A8A',
            lineHeight: 1.5,
            marginBottom: '1.5rem'
          }}>
            <strong>Evaluation Policy:</strong> Webcam and focus events are technical indicators intended to assist faculty review. Dismiss technical false positives and record review notes.
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem',
            flexWrap: 'wrap',
            background: attempt.disqualified ? '#FEF2F2' : '#F8FAFC',
            border: `1px solid ${attempt.disqualified ? '#FECACA' : '#E2E8F0'}`,
            borderRadius: '8px',
            padding: '1rem 1.25rem',
            marginBottom: '1.5rem'
          }}>
            <div>
              <div style={{ fontSize: '0.76rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>
                Integrity Trust Index
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: attempt.disqualified ? '#B91C1C' : 'var(--color-navy)' }}>
                {attempt.integrity_trust_index ?? 100}<span style={{ fontSize: '0.9rem', color: '#64748B' }}> / 100</span>
              </div>
            </div>
            {attempt.disqualified && (
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: '#B91C1C', fontWeight: 800 }}>
                <ShieldAlert size={18} />
                Disqualified after repeated tab switches
              </div>
            )}
          </div>

          {/* Events Log List */}
          <div style={{
            background: '#FFFFFF',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--color-border)',
            boxShadow: 'var(--shadow-sm)',
            padding: '1.75rem'
          }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--color-navy)', marginBottom: '1.25rem' }}>
              Proctoring Events Log ({events.length} Events)
            </h3>

            {events.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#64748B' }}>
                <CheckCircle2 size={36} style={{ color: '#10B981', margin: '0 auto 0.5rem' }} />
                <div style={{ fontWeight: 600 }}>Zero Proctoring Incidents</div>
                <div style={{ fontSize: '0.84rem' }}>Candidate completed the examination with zero detected interruptions.</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {events.map((evt) => {
                  const isDismissed = evt.review_status === 'dismissed';
                  const isConfirmed = evt.review_status === 'confirmed_violation';

                  return (
                    <div
                      key={evt.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '1rem',
                        borderRadius: '8px',
                        border: `1px solid ${isDismissed ? '#E2E8F0' : isConfirmed ? '#FECACA' : '#FED7AA'}`,
                        background: isDismissed ? '#F8FAFC' : isConfirmed ? '#FEF2F2' : '#FFFBEB',
                        gap: '1rem',
                        flexWrap: 'wrap'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{
                          width: '32px', height: '32px', borderRadius: '50%',
                          background: isDismissed ? '#E2E8F0' : isConfirmed ? '#FEE2E2' : '#FEF3C7',
                          color: isDismissed ? '#64748B' : isConfirmed ? '#DC2626' : '#D97706',
                          display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}>
                          <AlertTriangle size={16} />
                        </div>

                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span style={{ fontWeight: 800, fontSize: '0.88rem', color: 'var(--color-navy)' }}>
                              {evt.event_type.replace(/_/g, ' ')}
                            </span>
                            <span style={{
                              fontSize: '0.72rem',
                              fontWeight: 700,
                              padding: '0.1rem 0.45rem',
                              borderRadius: '4px',
                              background: isDismissed ? '#E2E8F0' : isConfirmed ? '#FEE2E2' : '#FEF3C7',
                              color: isDismissed ? '#64748B' : isConfirmed ? '#DC2626' : '#B45309'
                            }}>
                              {evt.review_status.toUpperCase()}
                            </span>
                          </div>

                          <div style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)', marginTop: '0.2rem' }}>
                            Timestamp: {new Date(evt.server_timestamp).toLocaleTimeString()} •
                            Duration: {evt.duration_seconds || 0}s •
                            Severity: {evt.severity}
                          </div>

                          {evt.review_notes && (
                            <div style={{ fontSize: '0.75rem', color: '#475569', marginTop: '0.2rem', fontStyle: 'italic' }}>
                              Review Note: "{evt.review_notes}"
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        {!isDismissed && (
                          <button
                            onClick={() => handleUpdateReview(evt.id, 'dismissed')}
                            disabled={reviewing}
                            className="btn btn-secondary"
                            style={{ fontSize: '0.76rem', padding: '0.35rem 0.75rem' }}
                          >
                            Dismiss as False Positive
                          </button>
                        )}

                        {!isConfirmed && (
                          <button
                            onClick={() => handleUpdateReview(evt.id, 'confirmed_violation')}
                            disabled={reviewing}
                            className="btn btn-secondary"
                            style={{ fontSize: '0.76rem', padding: '0.35rem 0.75rem', color: '#DC2626', borderColor: '#FECACA' }}
                          >
                            Confirm Violation
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default TeacherProctoringReviewPage;
