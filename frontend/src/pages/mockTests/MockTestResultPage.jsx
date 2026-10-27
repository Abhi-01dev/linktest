// Mock Test Result & Detailed Performance Scorecard
// LinkTest Enterprise Secure Examination System

import React, { useState, useEffect, Component } from 'react';
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
  FileText,
  HelpCircle,
  Code,
  Terminal,
  ArrowLeft,
  RefreshCw,
  AlertCircle,
  Info,
  Lock,
  Check
} from 'lucide-react';

/**
 * Robust Error Boundary to guarantee the results page NEVER crashes into a black screen
 */
export class ResultErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[ResultErrorBoundary] Caught rendering error in MockTestResultPage:', error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onRetry) {
      this.props.onRetry();
    } else {
      window.location.reload();
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '4rem 1rem', background: 'var(--color-bg-main, #F8FAFC)', minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{
            background: '#FFFFFF',
            border: '1px solid #E2E8F0',
            borderRadius: '12px',
            padding: '2.5rem',
            maxWidth: '540px',
            width: '100%',
            textAlign: 'center',
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.05)'
          }}>
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              background: '#FEF2F2',
              color: '#DC2626',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.25rem'
            }}>
              <AlertCircle size={28} />
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-navy, #0F172A)', margin: '0 0 0.5rem' }}>
              Unable to load this result.
            </h3>
            <p style={{ color: '#64748B', fontSize: '0.92rem', lineHeight: 1.5, marginBottom: '1.5rem' }}>
              We encountered an unexpected display issue while preparing this scorecard. Please try reloading the result or returning to your mock tests catalog.
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
              <button
                onClick={this.handleRetry}
                className="btn btn-primary"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontWeight: 700 }}
              >
                <RefreshCw size={15} />
                <span>Retry</span>
              </button>
              <Link to="/mock-tests" className="btn btn-secondary" style={{ fontWeight: 600 }}>
                Back to Mock Tests
              </Link>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

function MockTestResultView() {
  const { attemptId } = useParams();
  const { user } = useAuth();

  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorInfo, setErrorInfo] = useState(null);
  const [filterType, setFilterType] = useState('all'); // 'all', 'correct', 'incorrect', 'unanswered'

  const loadResult = async () => {
    if (!attemptId || attemptId === 'undefined' || attemptId === 'null' || !String(attemptId).trim()) {
      setErrorInfo({ status: 400, message: 'Invalid examination attempt ID specified.' });
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setErrorInfo(null);
      const data = await api.getMockTestAttemptResult(attemptId);
      setResult(data);
    } catch (err) {
      console.error('Failed to load result:', err);
      const status = err.status || err.response?.status || 500;
      const code = err.code || err.response?.data?.error?.code || 'UNKNOWN_ERROR';
      let message = err.message || 'Something went wrong while loading the result.';

      if (code === 'RESULT_NOT_RELEASED' || (status === 403 && err.message?.toLowerCase().includes('not been released'))) {
        setErrorInfo({ status: 403, code: 'RESULT_NOT_RELEASED', message: 'Result has not been released yet.' });
      } else if (status === 401) {
        message = 'Please log in again.';
        setErrorInfo({ status, code, message });
      } else if (status === 403) {
        message = 'You are not authorized to view this result.';
        setErrorInfo({ status, code, message });
      } else if (status === 404) {
        message = 'Result not found.';
        setErrorInfo({ status, code, message });
      } else {
        setErrorInfo({ status, code, message });
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadResult();
  }, [attemptId]);

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '6rem 1rem', background: 'var(--color-bg-main, #F8FAFC)', minHeight: '80vh' }}>
        <div className="spinner" style={{ margin: '0 auto 1rem' }}></div>
        <p style={{ color: 'var(--color-navy, #0F172A)', fontWeight: 700, fontSize: '1rem' }}>
          Calculating Assessment Scorecard...
        </p>
        <p style={{ color: '#64748B', fontSize: '0.85rem' }}>Verifying question evaluations and proctoring metrics</p>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // STATE B: Result Not Released Yet (Prompt Requirement 20 & 21)
  // Dedicated clean screen communicating ONLY that the result is pending release.
  // Zero empty cards, 0%, or placeholder zeroes rendered.
  // ---------------------------------------------------------------------------
  if (errorInfo?.code === 'RESULT_NOT_RELEASED') {
    return (
      <div style={{ padding: '4rem 1rem', background: 'var(--color-bg-main, #F8FAFC)', minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{
          background: '#FFFFFF',
          border: '1px solid #E2E8F0',
          borderRadius: '16px',
          padding: '3rem 2rem',
          maxWidth: '520px',
          width: '100%',
          textAlign: 'center',
          boxShadow: '0 4px 20px rgba(0,0,0,0.06)'
        }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            background: '#EFF6FF',
            color: '#2563EB',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1.5rem'
          }}>
            <Clock size={32} />
          </div>
          <h2 style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--color-navy, #0F172A)', margin: '0 0 0.75rem' }}>
            Your test has been submitted successfully.
          </h2>
          <p style={{ color: '#334155', fontSize: '1.05rem', fontWeight: 600, margin: '0 0 0.4rem' }}>
            Your result has not been released yet.
          </p>
          <p style={{ color: '#64748B', fontSize: '0.92rem', margin: '0 0 1.75rem' }}>
            Your teacher will release the result soon.
          </p>
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
            <button
              onClick={loadResult}
              className="btn btn-primary"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontWeight: 700 }}
            >
              <RefreshCw size={15} />
              <span>Refresh Status</span>
            </button>
            <Link to="/mock-tests" className="btn btn-secondary" style={{ fontWeight: 600 }}>
              Back to Mock Tests
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // STATE D: Invalid / Unauthorized Attempt or Error State
  // ---------------------------------------------------------------------------
  if (errorInfo || !result) {
    const isAuthErr = errorInfo?.status === 401;
    const isForbidden = errorInfo?.status === 403;

    return (
      <div style={{ padding: '4rem 1rem', background: 'var(--color-bg-main, #F8FAFC)', minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{
          background: '#FFFFFF',
          border: '1px solid #E2E8F0',
          borderRadius: '12px',
          padding: '2.5rem',
          maxWidth: '520px',
          width: '100%',
          textAlign: 'center',
          boxShadow: '0 8px 20px rgba(0,0,0,0.06)'
        }}>
          <div style={{
            width: '52px',
            height: '52px',
            borderRadius: '50%',
            background: isForbidden ? '#FEF3C7' : '#FEF2F2',
            color: isForbidden ? '#D97706' : '#DC2626',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1.25rem'
          }}>
            {isForbidden ? <Lock size={26} /> : <AlertCircle size={26} />}
          </div>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--color-navy, #0F172A)', margin: '0 0 0.5rem' }}>
            {isForbidden ? 'Access Restricted' : 'Scorecard Unavailable'}
          </h3>
          <p style={{ color: '#64748B', fontSize: '0.92rem', lineHeight: 1.5, marginBottom: '1.5rem' }}>
            {errorInfo?.message || 'Result details could not be found.'}
          </p>
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
            {isAuthErr ? (
              <Link to="/login" className="btn btn-primary" style={{ fontWeight: 700 }}>
                Log In
              </Link>
            ) : (
              <button onClick={loadResult} className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontWeight: 700 }}>
                <RefreshCw size={14} />
                <span>Retry</span>
              </button>
            )}
            <Link to="/mock-tests" className="btn btn-secondary" style={{ fontWeight: 600 }}>
              Back to Mock Tests
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // STATE C: Attempt Still Being Evaluated (Prompt Requirement 21)
  // Appropriate processing state without exposing score data.
  // ---------------------------------------------------------------------------
  const isEvaluating = result?.status === 'evaluating' || result?.result_status === 'EVALUATING';
  if (isEvaluating && user?.role === 'STUDENT') {
    return (
      <div style={{ padding: '4rem 1rem', background: 'var(--color-bg-main, #F8FAFC)', minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{
          background: '#FFFFFF',
          border: '1px solid #E2E8F0',
          borderRadius: '16px',
          padding: '3rem 2rem',
          maxWidth: '520px',
          width: '100%',
          textAlign: 'center',
          boxShadow: '0 4px 20px rgba(0,0,0,0.06)'
        }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            background: '#FEF3C7',
            color: '#D97706',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1.5rem'
          }}>
            <RefreshCw size={32} className="spin" />
          </div>
          <h2 style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--color-navy, #0F172A)', margin: '0 0 0.75rem' }}>
            Attempt Being Evaluated
          </h2>
          <p style={{ color: '#334155', fontSize: '1.05rem', fontWeight: 600, margin: '0 0 0.4rem' }}>
            Your submission is currently being evaluated.
          </p>
          <p style={{ color: '#64748B', fontSize: '0.92rem', margin: '0 0 1.75rem' }}>
            Automated and subjective checks are in progress. Please check back shortly.
          </p>
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
            <button
              onClick={loadResult}
              className="btn btn-primary"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontWeight: 700 }}
            >
              <RefreshCw size={15} />
              <span>Refresh Status</span>
            </button>
            <Link to="/mock-tests" className="btn btn-secondary" style={{ fontWeight: 600 }}>
              Back to Mock Tests
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // STATE B: Result unreleased fallback guard (e.g. if loaded attempt object is unreleased)
  // ---------------------------------------------------------------------------
  const isReleasedCheck = Boolean(result.results_released || result.result_status === 'RELEASED');
  if (!isReleasedCheck && user?.role === 'STUDENT') {
    return (
      <div style={{ padding: '4rem 1rem', background: 'var(--color-bg-main, #F8FAFC)', minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{
          background: '#FFFFFF',
          border: '1px solid #E2E8F0',
          borderRadius: '16px',
          padding: '3rem 2rem',
          maxWidth: '520px',
          width: '100%',
          textAlign: 'center',
          boxShadow: '0 4px 20px rgba(0,0,0,0.06)'
        }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            background: '#EFF6FF',
            color: '#2563EB',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1.5rem'
          }}>
            <Clock size={32} />
          </div>
          <h2 style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--color-navy, #0F172A)', margin: '0 0 0.75rem' }}>
            Your test has been submitted successfully.
          </h2>
          <p style={{ color: '#334155', fontSize: '1.05rem', fontWeight: 600, margin: '0 0 0.4rem' }}>
            Your result has not been released yet.
          </p>
          <p style={{ color: '#64748B', fontSize: '0.92rem', margin: '0 0 1.75rem' }}>
            Your teacher will release the result soon.
          </p>
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
            <button
              onClick={loadResult}
              className="btn btn-primary"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontWeight: 700 }}
            >
              <RefreshCw size={15} />
              <span>Refresh Status</span>
            </button>
            <Link to="/mock-tests" className="btn btn-secondary" style={{ fontWeight: 600 }}>
              Back to Mock Tests
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Safe Metric Extraction
  const correctCount = Number(result.correct_count ?? result.attempt?.correct_count ?? 0);
  const incorrectCount = Number(result.incorrect_count ?? result.attempt?.incorrect_count ?? 0);
  const unansweredCount = Number(result.unanswered_count ?? result.attempt?.unanswered_count ?? 0);
  const totalScore = parseFloat(result.total_score ?? result.attempt?.total_score ?? 0);
  const maxScore = parseFloat(result.max_score ?? result.attempt?.max_score ?? result.test?.total_marks ?? 100);
  const percentage = parseFloat(result.percentage ?? result.attempt?.percentage ?? 0);
  const passed = Boolean(result.passed ?? result.attempt?.passed ?? false);
  const passPercentage = parseFloat(result.pass_percentage ?? result.attempt?.pass_percentage ?? 40);
  const testTitle = result.test_title || result.title || result.test?.title || 'Mock Examination';
  const subject = result.subject || result.test?.subject || 'Examination';
  const timeSpentSeconds = Number(result.time_spent_seconds ?? result.attempt?.time_spent_seconds ?? 0);
  const resultStatus = result.result_status || result.attempt?.result_status || (result.results_released ? 'RELEASED' : 'PENDING_EVALUATION');
  const isReleased = Boolean(result.results_released || resultStatus === 'RELEASED');
  const isPendingEvaluation = resultStatus === 'PENDING_EVALUATION';
  const isReady = resultStatus === 'READY';

  // Question Type Categorization
  const allQuestions = Array.isArray(result.questions) ? result.questions : [];
  const mcqQuestions = allQuestions.filter(q => ['mcq_single', 'mcq_multiple'].includes(q.question_type));
  const tfQuestions = allQuestions.filter(q => q.question_type === 'true_false');
  const laQuestions = allQuestions.filter(q => ['long_answer', 'subjective'].includes(q.question_type));
  const codingQuestions = allQuestions.filter(q => q.question_type === 'coding');

  const mcqScore = mcqQuestions.reduce((sum, q) => sum + (parseFloat(q.score_awarded) || 0), 0);
  const mcqMax = mcqQuestions.reduce((sum, q) => sum + (parseFloat(q.marks) || 0), 0);

  const tfScore = tfQuestions.reduce((sum, q) => sum + (parseFloat(q.score_awarded) || 0), 0);
  const tfMax = tfQuestions.reduce((sum, q) => sum + (parseFloat(q.marks) || 0), 0);

  const hasPendingLa = laQuestions.some(q => q.is_pending_review);
  const laScore = laQuestions.reduce((sum, q) => sum + (parseFloat(q.score_awarded) || 0), 0);
  const laMax = laQuestions.reduce((sum, q) => sum + (parseFloat(q.marks) || 0), 0);

  const codingScore = codingQuestions.reduce((sum, q) => sum + (parseFloat(q.score_awarded) || 0), 0);
  const codingMax = codingQuestions.reduce((sum, q) => sum + (parseFloat(q.marks) || 0), 0);
  const codingPassedCount = codingQuestions.reduce((sum, q) => {
    const passedTc = q.execution_results?.test_cases_passed ?? (q.is_correct ? 1 : 0);
    return sum + (typeof passedTc === 'number' ? passedTc : 0);
  }, 0);
  const codingTotalCount = codingQuestions.reduce((sum, q) => {
    const totalTc = q.execution_results?.total_test_cases ?? (Array.isArray(q.test_cases) ? q.test_cases.length : 1);
    return sum + (typeof totalTc === 'number' && totalTc > 0 ? totalTc : 1);
  }, 0);

  const filteredQuestions = allQuestions.filter(q => {
    if (filterType === 'correct') return q.is_correct === true;
    if (filterType === 'incorrect') return q.is_correct === false;
    if (filterType === 'unanswered') return q.candidate_response === null || q.candidate_response === undefined;
    return true;
  });

  const accuracy = (correctCount + incorrectCount) > 0
    ? Math.round((correctCount / (correctCount + incorrectCount)) * 100)
    : 0;

  return (
    <div style={{ padding: '2.5rem 0 5rem', background: 'var(--color-bg-main, #F8FAFC)', minHeight: '90vh' }}>
      <div className="container" style={{ maxWidth: '920px', margin: '0 auto', padding: '0 1rem' }}>
        {/* Navigation & Actions */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.75rem' }}>
          <Link to="/mock-tests" style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            color: 'var(--color-text-secondary, #64748B)',
            fontSize: '0.88rem',
            fontWeight: 600,
            textDecoration: 'none'
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

        {/* Security Auto-Submission Notice Banner */}
        {(result.status === 'AUTO_SUBMITTED' || result.submission_status === 'AUTO_SUBMITTED' || result.attempt?.status === 'AUTO_SUBMITTED') && (
          <div style={{
            background: '#FEF2F2',
            border: '1px solid #F87171',
            borderRadius: '12px',
            padding: '1.25rem 1.5rem',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '1rem',
            boxShadow: '0 4px 12px rgba(239, 68, 68, 0.08)'
          }}>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '50%',
              background: '#FEE2E2',
              color: '#DC2626',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <AlertTriangle size={22} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#991B1B', margin: 0 }}>
                  Test Automatically Submitted
                </h3>
                <span style={{
                  background: '#DC2626',
                  color: '#FFFFFF',
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  padding: '0.15rem 0.5rem',
                  borderRadius: '999px'
                }}>
                  SECURITY ENFORCED
                </span>
              </div>
              <p style={{ color: '#7F1D1D', fontSize: '0.92rem', margin: '0.35rem 0 0.5rem', lineHeight: 1.5 }}>
                {(result.submission_reason === 'SECOND_FULLSCREEN_EXIT' || result.attempt?.submission_reason === 'SECOND_FULLSCREEN_EXIT')
                  ? 'Your test was automatically submitted because full-screen mode was exited twice.'
                  : (result.submission_reason === 'MAX_TAB_SWITCHES' || result.attempt?.submission_reason === 'MAX_TAB_SWITCHES')
                  ? 'Your test was automatically submitted because maximum tab switches were reached.'
                  : 'Your test was automatically submitted because the maximum number of security warnings was reached.'}
              </p>
              <div style={{ display: 'flex', gap: '1.25rem', fontSize: '0.8rem', color: '#991B1B', fontWeight: 600 }}>
                <span>Security Warnings: {result.security_warning_count ?? result.attempt?.security_warning_count ?? result.warning_count ?? 0}</span>
                <span>Fullscreen Exits: {result.fullscreen_exit_count ?? result.attempt?.fullscreen_exit_count ?? 0} / 2</span>
                <span>Reason: {result.submission_reason || result.attempt?.submission_reason || 'MAX_SECURITY_WARNINGS'}</span>
              </div>
            </div>
          </div>
        )}

        {/* Result Evaluation Status Banner (for Subjective/Pending Tests) */}
        {isPendingEvaluation && (
          <div style={{
            background: '#FFFBEB',
            border: '1px solid #FCD34D',
            borderRadius: '12px',
            padding: '1.25rem 1.5rem',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '1rem',
            boxShadow: '0 4px 12px rgba(245, 158, 11, 0.08)'
          }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              background: '#FEF3C7',
              color: '#D97706',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <Clock size={22} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#92400E', margin: 0 }}>
                  Result Pending Teacher Evaluation
                </h3>
                <span style={{
                  background: '#F59E0B',
                  color: '#FFFFFF',
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  padding: '0.15rem 0.5rem',
                  borderRadius: '999px'
                }}>
                  PENDING REVIEW
                </span>
              </div>
              <p style={{ color: '#78350F', fontSize: '0.9rem', margin: '0.35rem 0 0', lineHeight: 1.5 }}>
                Your objective questions have been evaluated. Long Answer and subjective questions are currently awaiting teacher evaluation. Once your instructor reviews and releases the final scorecard, comprehensive marks and feedback will be published here.
              </p>
            </div>
          </div>
        )}

        {isReady && !isReleased && (
          <div style={{
            background: '#EFF6FF',
            border: '1px solid #BFDBFE',
            borderRadius: '12px',
            padding: '1.25rem 1.5rem',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem'
          }}>
            <Info size={22} color="#2563EB" />
            <p style={{ color: '#1E40AF', fontSize: '0.92rem', margin: 0, fontWeight: 600 }}>
              Your examination has been evaluated by your teacher and will appear in your scorecard once released.
            </p>
          </div>
        )}

        {/* Hero Scorecard Card */}
        <div style={{
          background: '#FFFFFF',
          borderRadius: '12px',
          border: '1px solid var(--color-border, #E2E8F0)',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)',
          padding: '2.25rem',
          marginBottom: '2rem'
        }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1.5rem' }}>
            <div>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#2563EB', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {subject} • Assessment Scorecard
              </div>
              <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--color-navy, #0F172A)', margin: '0.3rem 0 0.5rem' }}>
                {testTitle}
              </h1>
              <div style={{ fontSize: '0.84rem', color: '#64748B' }}>
                Candidate: <strong>{user?.full_name || 'Student Candidate'}</strong> • Completed on {new Date(result.submitted_at || result.submittedAt || Date.now()).toLocaleString()}
              </div>
            </div>

            {/* Pass / Fail / Pending Big Badge */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              padding: '0.75rem 1.5rem',
              borderRadius: '8px',
              background: isPendingEvaluation ? '#FFFBEB' : (passed ? '#ECFDF5' : '#FEF2F2'),
              border: `2px solid ${isPendingEvaluation ? '#FCD34D' : (passed ? '#10B981' : '#EF4444')}`
            }}>
              <span style={{
                fontSize: '1.15rem',
                fontWeight: 900,
                color: isPendingEvaluation ? '#B45309' : (passed ? '#059669' : '#DC2626'),
                letterSpacing: '0.05em'
              }}>
                {isPendingEvaluation ? 'EVALUATION PENDING' : (passed ? 'PASSED' : 'NEEDS PRACTICE')}
              </span>
              <span style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '0.15rem' }}>
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
            <div style={{ background: '#F8FAFC', padding: '1.25rem', borderRadius: '8px', textAlign: 'center', border: '1px solid #F1F5F9' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>SCORE OBTAINED</div>
              <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#2563EB', marginTop: '0.2rem' }}>
                {totalScore} <span style={{ fontSize: '1rem', color: '#64748B' }}>/ {maxScore}</span>
              </div>
              <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '0.2rem' }}>{percentage}% Marks</div>
            </div>

            <div style={{ background: '#F8FAFC', padding: '1.25rem', borderRadius: '8px', textAlign: 'center', border: '1px solid #F1F5F9' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>ACCURACY</div>
              <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#059669', marginTop: '0.2rem' }}>
                {accuracy}%
              </div>
              <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '0.2rem' }}>Of attempted questions</div>
            </div>

            <div style={{ background: '#F8FAFC', padding: '1.25rem', borderRadius: '8px', textAlign: 'center', border: '1px solid #F1F5F9' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>TIME SPENT</div>
              <div style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--color-navy, #0F172A)', marginTop: '0.2rem' }}>
                {Math.floor(timeSpentSeconds / 60)}m {timeSpentSeconds % 60}s
              </div>
              <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '0.2rem' }}>Total examination time</div>
            </div>

            <div style={{ background: '#F8FAFC', padding: '1.25rem', borderRadius: '8px', textAlign: 'center', border: '1px solid #F1F5F9' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>BREAKDOWN</div>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                <span style={{ color: '#059669' }}>✓ {correctCount} Correct</span>
                <span style={{ color: '#DC2626' }}>✗ {incorrectCount} Incorrect</span>
                <span style={{ color: '#64748B' }}>○ {unansweredCount} Unanswered</span>
              </div>
            </div>
          </div>

          {/* Performance Breakdown By Question Type */}
          <div style={{
            marginTop: '1.5rem',
            paddingTop: '1.5rem',
            borderTop: '1px solid var(--color-border, #E2E8F0)',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '0.85rem'
          }}>
            {/* MCQ Card */}
            {mcqQuestions.length > 0 && (
              <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '1rem' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>
                  Multiple Choice
                </div>
                <div style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--color-navy, #0F172A)', marginTop: '0.2rem' }}>
                  {mcqScore} / {mcqMax}
                </div>
                <div style={{ fontSize: '0.74rem', color: '#64748B' }}>
                  {mcqQuestions.filter(q => q.is_correct).length} of {mcqQuestions.length} correct
                </div>
              </div>
            )}

            {/* True / False Card */}
            {tfQuestions.length > 0 && (
              <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '1rem' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#B45309', textTransform: 'uppercase' }}>
                  True / False
                </div>
                <div style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--color-navy, #0F172A)', marginTop: '0.2rem' }}>
                  {tfScore} / {tfMax}
                </div>
                <div style={{ fontSize: '0.74rem', color: '#64748B' }}>
                  {tfQuestions.filter(q => q.is_correct).length} of {tfQuestions.length} correct
                </div>
              </div>
            )}

            {/* Long Answer Card */}
            {laQuestions.length > 0 && (
              <div style={{
                background: hasPendingLa ? '#FFFBEB' : '#EFF6FF',
                border: `1px solid ${hasPendingLa ? '#FDE68A' : '#BFDBFE'}`,
                borderRadius: '8px',
                padding: '1rem'
              }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: hasPendingLa ? '#B45309' : '#1D4ED8', textTransform: 'uppercase' }}>
                  Long Answer
                </div>
                <div style={{
                  fontSize: hasPendingLa ? '1.05rem' : '1.25rem',
                  fontWeight: 900,
                  color: hasPendingLa ? '#B45309' : '#1D4ED8',
                  marginTop: '0.2rem'
                }}>
                  {hasPendingLa ? 'Pending Evaluation' : `${laScore} / ${laMax}`}
                </div>
                <div style={{ fontSize: '0.74rem', color: hasPendingLa ? '#92400E' : '#2563EB' }}>
                  {hasPendingLa ? 'Awaiting teacher evaluation' : 'Teacher evaluated'}
                </div>
              </div>
            )}

            {/* Coding Question Card */}
            {codingQuestions.length > 0 && (
              <div style={{ background: '#FAF5FF', border: '1px solid #E9D5FF', borderRadius: '8px', padding: '1rem' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#7E22CE', textTransform: 'uppercase' }}>
                  Coding Question
                </div>
                <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#6B21A8', marginTop: '0.2rem' }}>
                  {codingScore} / {codingMax}
                </div>
                <div style={{ fontSize: '0.74rem', color: '#7E22CE' }}>
                  {codingPassedCount} / {codingTotalCount} test cases passed
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Question Review Section */}
        {isReleased ? (
          <div>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '1rem',
              flexWrap: 'wrap',
              gap: '0.5rem'
            }}>
              <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--color-navy, #0F172A)', margin: 0 }}>
                Detailed Question & Solution Review
              </h2>

              {/* Filters */}
              <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                {[
                  { id: 'all', label: 'All Questions' },
                  { id: 'correct', label: `Correct (${correctCount})` },
                  { id: 'incorrect', label: `Incorrect (${incorrectCount})` },
                  { id: 'unanswered', label: `Unanswered (${unansweredCount})` }
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setFilterType(tab.id)}
                    style={{
                      padding: '0.35rem 0.75rem',
                      borderRadius: '6px',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      border: 'none',
                      background: filterType === tab.id ? 'var(--color-navy, #0F172A)' : '#F1F5F9',
                      color: filterType === tab.id ? '#FFFFFF' : '#64748B',
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
              {filteredQuestions.length === 0 ? (
                <div style={{ background: '#FFFFFF', padding: '2rem', borderRadius: '8px', textAlign: 'center', color: '#64748B', border: '1px solid #E2E8F0' }}>
                  No questions match the selected filter.
                </div>
              ) : (
                filteredQuestions.map((q, idx) => {
                  const isLongAnswer = ['long_answer', 'subjective'].includes(q.question_type);
                  const isCoding = q.question_type === 'coding';
                  const isPendingReview = isLongAnswer && Boolean(q.is_pending_review);
                  const isCorrect = q.is_correct === true;
                  const isIncorrect = !isPendingReview && q.is_correct === false;

                  return (
                    <div
                      key={q.id || `q-${idx}`}
                      style={{
                        background: '#FFFFFF',
                        borderRadius: '8px',
                        border: `1px solid ${isPendingReview ? '#FDE68A' : isCorrect ? '#A7F3D0' : isIncorrect ? '#FECACA' : '#E2E8F0'}`,
                        padding: '1.5rem',
                        boxShadow: '0 2px 6px rgba(0,0,0,0.03)'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--color-navy, #0F172A)' }}>
                            Question #{idx + 1}
                          </span>
                          <span style={{
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            padding: '0.15rem 0.5rem',
                            borderRadius: '999px',
                            background: isPendingReview ? '#FEF3C7' : isCorrect ? '#ECFDF5' : isIncorrect ? '#FEF2F2' : '#F1F5F9',
                            color: isPendingReview ? '#B45309' : isCorrect ? '#059669' : isIncorrect ? '#DC2626' : '#64748B'
                          }}>
                            {isPendingReview
                              ? 'Pending Evaluation'
                              : isCoding
                              ? `Coding (${q.execution_results?.test_cases_passed || 0}/${q.execution_results?.total_test_cases || 0} Passed)`
                              : isCorrect ? 'Correct' : isIncorrect ? 'Incorrect' : 'Unanswered'}
                          </span>
                        </div>

                        <div style={{ fontSize: '0.84rem', fontWeight: 700 }}>
                          Marks: <span style={{ color: isPendingReview ? '#B45309' : q.score_awarded > 0 ? '#059669' : q.score_awarded < 0 ? '#DC2626' : '#64748B' }}>
                            {isPendingReview ? 'Pending Evaluation' : `${q.score_awarded > 0 ? `+${q.score_awarded}` : q.score_awarded} / ${q.marks || 0}`}
                          </span>
                        </div>
                      </div>

                      <div style={{ fontSize: '0.96rem', fontWeight: 600, color: 'var(--color-navy, #0F172A)', lineHeight: 1.5, marginBottom: '1rem' }}>
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
                        {/* For Coding Questions */}
                        {isCoding ? (
                          <div>
                            <div style={{ color: '#64748B', marginBottom: '0.3rem', fontWeight: 600 }}>Your Submitted Code:</div>
                            <pre style={{
                              background: '#0F172A',
                              color: '#F8FAFC',
                              padding: '0.75rem',
                              borderRadius: '6px',
                              fontFamily: 'monospace',
                              fontSize: '0.82rem',
                              overflowX: 'auto',
                              margin: 0
                            }}>
                              {q.candidate_response?.code || q.candidate_response?.text || 'No code submitted'}
                            </pre>
                            {q.execution_results && (
                              <div style={{ marginTop: '0.5rem', fontSize: '0.78rem', color: '#64748B' }}>
                                Execution: {q.execution_results.execution_time_ms || 0} ms • Memory: {q.execution_results.memory_usage_mb || 0} MB
                              </div>
                            )}
                          </div>
                        ) : isLongAnswer ? (
                          /* For Long Answer Questions */
                          <div>
                            <div style={{ color: '#64748B', marginBottom: '0.3rem', fontWeight: 600 }}>Your Submitted Answer:</div>
                            <div style={{
                              background: '#FFFFFF',
                              border: '1px solid #E2E8F0',
                              padding: '0.75rem',
                              borderRadius: '6px',
                              whiteSpace: 'pre-wrap',
                              lineHeight: 1.5
                            }}>
                              {q.candidate_response?.text || q.candidate_response?.response_text || 'No answer submitted'}
                            </div>
                            {isPendingReview ? (
                              <div style={{ marginTop: '0.5rem', background: '#FEF3C7', border: '1px solid #FCD34D', padding: '0.5rem 0.75rem', borderRadius: '4px', color: '#92400E', fontSize: '0.82rem', fontWeight: 600 }}>
                                This question is awaiting teacher evaluation.
                              </div>
                            ) : q.evaluation_comment ? (
                              <div style={{ marginTop: '0.5rem', background: '#EFF6FF', border: '1px solid #BFDBFE', padding: '0.5rem 0.75rem', borderRadius: '4px', color: '#1D4ED8' }}>
                                <strong>Teacher Feedback:</strong> {q.evaluation_comment}
                              </div>
                            ) : null}
                          </div>
                        ) : (
                          /* For MCQ & True/False */
                          <>
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
                          </>
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
                })
              )}
            </div>
          </div>
        ) : (
          <div style={{
            background: '#FFFFFF',
            borderRadius: '12px',
            border: '1px solid var(--color-border, #E2E8F0)',
            padding: '3rem 2rem',
            textAlign: 'center'
          }}>
            <FileText size={42} style={{ color: '#94A3B8', margin: '0 auto 1rem' }} />
            <h3 style={{ fontSize: '1.2rem', color: 'var(--color-navy, #0F172A)', marginBottom: '0.5rem', fontWeight: 800 }}>
              Your Result is Being Evaluated by Your Teacher
            </h3>
            <p style={{ color: '#64748B', maxWidth: '460px', margin: '0 auto', fontSize: '0.92rem', lineHeight: 1.6 }}>
              Detailed question solutions, individual answer keys, and faculty remarks will be published once your teacher completes evaluation and releases the results.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export function MockTestResultPage() {
  return (
    <ResultErrorBoundary>
      <MockTestResultView />
    </ResultErrorBoundary>
  );
}

export default MockTestResultPage;
