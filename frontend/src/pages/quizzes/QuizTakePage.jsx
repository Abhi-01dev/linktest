import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import {
  Award,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Clock,
  ArrowRight,
  Code,
  Play,
  Terminal,
  Lock
} from 'lucide-react';

export function QuizTakePage() {
  const { quizId } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [quiz, setQuiz] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({}); // { [question_id]: selected_option_index | text | code }
  const [codeExecution, setCodeExecution] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  useEffect(() => {
    async function loadQuiz() {
      setLoading(true);
      try {
        const data = await api.getQuizById(quizId);
        setQuiz(data);
        setQuestions(data.questions || []);
      } catch (err) {
        showToast(err.message || 'Failed to load quiz', 'error');
      } finally {
        setLoading(false);
      }
    }

    loadQuiz();
  }, [quizId]);

  const currentQuestion = questions[currentIndex] || null;

  const handleSelectOption = (qId, optionIdx) => {
    setSelectedAnswers(prev => ({
      ...prev,
      [qId]: optionIdx
    }));
  };

  const answeredCount = Object.keys(selectedAnswers).length;
  const isAllAnswered = answeredCount === questions.length;

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      // Build answers array matching the API contract
      const answersPayload = questions.map(q => {
        const val = selectedAnswers[q.id];
        const isCoding = q.question_type === 'coding';
        const isLongAnswer = q.question_type === 'long_answer' || q.question_type === 'subjective';

        return {
          question_id: q.id,
          selected_option_index: typeof val === 'number' ? val : -1,
          response_text: typeof val === 'string' ? val : undefined,
          code: isCoding && typeof val === 'string' ? val : undefined,
          text: isLongAnswer && typeof val === 'string' ? val : undefined
        };
      });

      const result = await api.submitQuizAttempt(quizId, answersPayload);
      showToast('Assessment submitted & graded successfully!', 'success');
      navigate(`/quiz/results/${result.attempt_id}`);
    } catch (err) {
      showToast(err.message || 'Submission failed', 'error');
      setSubmitting(false);
      setShowConfirmModal(false);
    }
  };

  if (loading) {
    return (
      <div className="container" style={{ padding: '5rem 1.5rem', maxWidth: '800px' }}>
        <div className="skeleton" style={{ height: '36px', width: '50%', marginBottom: '1.5rem' }} />
        <div className="card" style={{ height: '320px', padding: '2rem' }}>
          <div className="skeleton" style={{ height: '24px', width: '80%', marginBottom: '1.5rem' }} />
          <div className="skeleton" style={{ height: '48px', marginBottom: '0.75rem' }} />
          <div className="skeleton" style={{ height: '48px', marginBottom: '0.75rem' }} />
          <div className="skeleton" style={{ height: '48px' }} />
        </div>
      </div>
    );
  }

  if (!quiz || questions.length === 0) {
    return (
      <div className="container" style={{ padding: '5rem 1.5rem', textAlign: 'center' }}>
        <h2>Quiz Not Found</h2>
        <p style={{ marginTop: '0.5rem', marginBottom: '1.5rem' }}>
          This assessment is not available or contains no questions.
        </p>
        <Link to="/courses" className="btn btn-primary">
          Browse Courses
        </Link>
      </div>
    );
  }

  const optionsList = typeof currentQuestion.options === 'string'
    ? JSON.parse(currentQuestion.options)
    : currentQuestion.options || [];

  return (
    <div style={{ padding: '2.5rem 0 5rem' }}>
      <div className="container" style={{ maxWidth: '860px' }}>
        {/* Header Bar */}
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
            <span className="badge badge-orange" style={{ marginBottom: '0.35rem' }}>
              ASSESSMENT
            </span>
            <h1 style={{ fontSize: '1.6rem' }}>{quiz.title}</h1>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
              Answered: <strong>{answeredCount} / {questions.length}</strong>
            </div>
            <button
              onClick={() => setShowConfirmModal(true)}
              className="btn btn-primary btn-sm"
              disabled={answeredCount === 0 || submitting}
            >
              <span>Submit Assessment</span>
            </button>
          </div>
        </div>

        {/* Question Navigation Navigator Pills */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            marginBottom: '2rem',
            overflowX: 'auto',
            paddingBottom: '0.5rem'
          }}
        >
          {questions.map((q, idx) => {
            const isAnswered = selectedAnswers[q.id] !== undefined;
            const isCurrent = idx === currentIndex;
            return (
              <button
                key={q.id}
                onClick={() => setCurrentIndex(idx)}
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 'var(--radius-md)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  background: isCurrent
                    ? 'var(--color-orange)'
                    : isAnswered
                    ? 'var(--color-navy)'
                    : 'var(--color-bg-alt)',
                  color: isCurrent || isAnswered ? '#FFFFFF' : 'var(--color-text-muted)',
                  border: `2px solid ${isCurrent ? 'var(--color-orange-dark)' : 'var(--color-border)'}`
                }}
              >
                {idx + 1}
              </button>
            );
          })}
        </div>

        {/* Question Viewport Card */}
        <div className="card" style={{ padding: '2.25rem', marginBottom: '2rem', boxShadow: 'var(--shadow-md)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-orange-dark)', textTransform: 'uppercase' }}>
              Question {currentIndex + 1} of {questions.length}
            </span>
            <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
              Single Choice
            </span>
          </div>

          <h3
            style={{
              fontSize: '1.25rem',
              lineHeight: 1.5,
              marginBottom: '1.75rem',
              color: 'var(--color-navy)'
            }}
          >
            {currentQuestion.question_text}
          </h3>

          {/* Render by Question Type */}
          {currentQuestion.question_type === 'long_answer' || currentQuestion.question_type === 'subjective' ? (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.82rem', color: '#64748B' }}>
                <span>Write your detailed explanation below</span>
                <span>Characters: {(selectedAnswers[currentQuestion.id] || '').length} / 2000</span>
              </div>
              <textarea
                rows={8}
                maxLength={2000}
                placeholder="Type your answer here..."
                value={selectedAnswers[currentQuestion.id] || ''}
                onChange={(e) => setSelectedAnswers(prev => ({ ...prev, [currentQuestion.id]: e.target.value.slice(0, 2000) }))}
                style={{
                  width: '100%',
                  padding: '1rem',
                  fontSize: '0.95rem',
                  lineHeight: 1.6,
                  border: '2px solid var(--color-border)',
                  borderRadius: 'var(--radius-md)',
                  outline: 'none',
                  color: 'var(--color-navy)',
                  fontFamily: 'inherit',
                  resize: 'vertical'
                }}
              />
              <div style={{ marginTop: '0.5rem', fontSize: '0.78rem', color: '#64748B' }}>
                Evaluated manually by faculty.
              </div>
            </div>
          ) : currentQuestion.question_type === 'coding' ? (
            <div>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: '#0F172A',
                color: '#F8FAFC',
                padding: '0.5rem 0.85rem',
                borderRadius: '8px 8px 0 0',
                fontSize: '0.8rem'
              }}>
                <span style={{ fontWeight: 700, color: '#38BDF8', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <Code size={14} /> {(currentQuestion.programming_language || 'javascript').toUpperCase()}
                </span>
                <span style={{ color: '#94A3B8' }}>Time: {currentQuestion.time_limit || 2.0}s • Memory: {currentQuestion.memory_limit || 128}MB</span>
              </div>
              <textarea
                rows={10}
                value={selectedAnswers[currentQuestion.id] !== undefined ? selectedAnswers[currentQuestion.id] : (currentQuestion.starter_code || 'function solution() {\n  // your code\n}')}
                onChange={(e) => setSelectedAnswers(prev => ({ ...prev, [currentQuestion.id]: e.target.value }))}
                style={{
                  width: '100%',
                  padding: '0.85rem',
                  fontFamily: 'monospace',
                  fontSize: '0.88rem',
                  background: '#020617',
                  color: '#F8FAFC',
                  border: '1px solid #1E293B',
                  borderRadius: '0 0 8px 8px',
                  outline: 'none'
                }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  disabled={codeExecution[currentQuestion.id]?.running}
                  onClick={async () => {
                    const qId = currentQuestion.id;
                    const code = selectedAnswers[qId] !== undefined ? selectedAnswers[qId] : (currentQuestion.starter_code || '');
                    setCodeExecution(prev => ({ ...prev, [qId]: { running: true, result: null, error: null } }));
                    try {
                      const res = await api.runCode({
                        questionId: qId,
                        code,
                        language: currentQuestion.programming_language || 'javascript'
                      });
                      setCodeExecution(prev => ({ ...prev, [qId]: { running: false, result: res, error: null } }));
                    } catch (err) {
                      setCodeExecution(prev => ({ ...prev, [qId]: { running: false, result: null, error: err.message } }));
                    }
                  }}
                  className="btn btn-primary btn-sm"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', background: '#059669', borderColor: '#059669' }}
                >
                  <Play size={13} />
                  <span>{codeExecution[currentQuestion.id]?.running ? 'Executing...' : 'Run Code'}</span>
                </button>
                <span style={{ fontSize: '0.78rem', color: '#64748B' }}>Hidden tests evaluated on submission</span>
              </div>

              {codeExecution[currentQuestion.id]?.result && (
                <div style={{ marginTop: '0.75rem', background: '#F8FAFC', padding: '0.75rem', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.82rem' }}>
                  <div style={{ fontWeight: 700, marginBottom: '0.4rem', color: codeExecution[currentQuestion.id].result.passed ? '#059669' : '#DC2626' }}>
                    {codeExecution[currentQuestion.id].result.passed ? 'Public Tests Passed ✓' : 'Public Tests Failed ✗'}
                  </div>
                  {codeExecution[currentQuestion.id].result.results?.map((r, rIdx) => (
                    <div key={rIdx} style={{ fontSize: '0.78rem', fontFamily: 'monospace', marginTop: '0.2rem' }}>
                      Test #{rIdx + 1}: {r.passed ? 'PASS' : 'FAIL'} • Expected: {r.expected_output} • Got: {String(r.actual_output ?? '')}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            /* Options Radio List (MCQ & True/False) */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {optionsList.map((opt, optIdx) => {
                const isSelected = selectedAnswers[currentQuestion.id] === optIdx;
                const optionLetters = ['A', 'B', 'C', 'D', 'E'];
                return (
                  <div
                    key={optIdx}
                    onClick={() => handleSelectOption(currentQuestion.id, optIdx)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '1rem',
                      padding: '1rem 1.25rem',
                      borderRadius: 'var(--radius-md)',
                      border: `2px solid ${isSelected ? 'var(--color-orange)' : 'var(--color-border)'}`,
                      background: isSelected ? 'var(--color-orange-light)' : '#FFFFFF',
                      cursor: 'pointer',
                      transition: 'all var(--transition-fast)'
                    }}
                  >
                    <div
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: '50%',
                        background: isSelected ? 'var(--color-orange)' : 'var(--color-bg-alt)',
                        color: isSelected ? '#FFFFFF' : 'var(--color-navy)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 700,
                        fontSize: '0.8rem',
                        flexShrink: 0
                      }}
                    >
                      {optionLetters[optIdx] || optIdx + 1}
                    </div>

                    <span
                      style={{
                        fontSize: '0.95rem',
                        fontWeight: isSelected ? 600 : 400,
                        color: isSelected ? '#9A3412' : 'var(--color-text-primary)',
                        flex: 1
                      }}
                    >
                      {opt}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Bottom Pagination Controls */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button
            onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
            disabled={currentIndex === 0}
            className="btn btn-outline"
          >
            <ChevronLeft size={16} />
            <span>Previous Question</span>
          </button>

          {currentIndex < questions.length - 1 ? (
            <button
              onClick={() => setCurrentIndex(prev => Math.min(questions.length - 1, prev + 1))}
              className="btn btn-primary"
            >
              <span>Next Question</span>
              <ChevronRight size={16} />
            </button>
          ) : (
            <button
              onClick={() => setShowConfirmModal(true)}
              className="btn btn-primary"
            >
              <span>Review & Submit</span>
              <ArrowRight size={16} />
            </button>
          )}
        </div>

        {/* Submit Confirmation Modal */}
        {showConfirmModal && (
          <div className="modal-overlay">
            <div className="modal-content" style={{ maxWidth: '440px', textAlign: 'center' }}>
              <div
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: '50%',
                  background: '#FFEDD5',
                  color: 'var(--color-orange)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 1.25rem'
                }}
              >
                <Award size={28} />
              </div>

              <h3 style={{ fontSize: '1.35rem', marginBottom: '0.5rem' }}>
                Submit Assessment?
              </h3>

              <p style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)', marginBottom: '1.5rem' }}>
                You have answered <strong>{answeredCount}</strong> of <strong>{questions.length}</strong> questions.
                {!isAllAnswered && (
                  <span style={{ display: 'block', color: '#D97706', marginTop: '0.4rem', fontWeight: 600 }}>
                    ⚠️ {questions.length - answeredCount} unanswered questions will be marked incorrect.
                  </span>
                )}
              </p>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
                <button
                  onClick={() => setShowConfirmModal(false)}
                  className="btn btn-outline"
                  disabled={submitting}
                >
                  Return to Quiz
                </button>
                <button
                  onClick={handleSubmit}
                  className="btn btn-primary"
                  disabled={submitting}
                >
                  {submitting ? 'Scoring on Server...' : 'Confirm Submission'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
