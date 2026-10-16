// Secure Mock Test & Examination Runner Interface
// LinkTest Enterprise LMS

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useWebcamProctor } from '../../hooks/useWebcamProctor';
import {
  Clock,
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Bookmark,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2,
  Wifi,
  WifiOff,
  Check,
  RotateCcw,
  Flag,
  Send,
  Camera,
  X,
  AlertCircle,
  Code,
  Play,
  Terminal,
  Lock,
  FileText
} from 'lucide-react';

export function MockTestRunnerPage() {
  const { id, attemptId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  // Test and Attempt State
  const [examData, setExamData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [initError, setInitError] = useState(null);

  // Active Question Navigation
  const [currentIndex, setCurrentIndex] = useState(0);
  const [responses, setResponses] = useState({}); // { [question_id]: { response_data, is_marked_for_review, is_visited } }

  // Auto-Save and Network State
  const [saveStatus, setSaveStatus] = useState('saved'); // 'saved', 'saving', 'error'
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Server-Authoritative Timer State
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const [timerWarning, setTimerWarning] = useState(null); // 'warning_5m', 'critical_1m', null

  // Security, Fullscreen & Proctoring State (Requirements 1, 2, 3, 4, 5, 14)
  const [isFullscreenActive, setIsFullscreenActive] = useState(Boolean(document.fullscreenElement || document.webkitFullscreenElement));
  const [securityWarningCount, setSecurityWarningCount] = useState(0);
  const [fullscreenExitCount, setFullscreenExitCount] = useState(0);
  const [autoSubmittedState, setAutoSubmittedState] = useState(null); // { submitted: true, reason: string, message: string }
  const [warningCount, setWarningCount] = useState(0);
  const [activeWarningModal, setActiveWarningModal] = useState(null);
  const [submitConfirmOpen, setSubmitConfirmOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [cameraDocked, setCameraDocked] = useState(true);
  const [codeExecution, setCodeExecution] = useState({}); // { [qId]: { running: bool, result: Object, error: string } }
  const [manualSaveSuccess, setManualSaveSuccess] = useState(false);

  // References
  const timerIntervalRef = useRef(null);
  const lastSyncTimeRef = useRef(Date.now());
  const pendingSyncRef = useRef({});
  const lastFullscreenExitRef = useRef(0);
  const responsesRef = useRef({});

  // Sync ref with state
  useEffect(() => {
    responsesRef.current = responses;
  }, [responses]);

  // Request browser Fullscreen via user gesture
  const requestBrowserFullscreen = async () => {
    try {
      const docEl = document.documentElement;
      if (docEl.requestFullscreen) {
        await docEl.requestFullscreen();
      } else if (docEl.webkitRequestFullscreen) {
        await docEl.webkitRequestFullscreen();
      } else if (docEl.msRequestFullscreen) {
        await docEl.msRequestFullscreen();
      }
      setIsFullscreenActive(true);
    } catch (err) {
      console.warn('[Runner] Fullscreen request error:', err.message);
    }
  };

  // ---------------------------------------------------------------------------
  // 1. WEBCAM PROCTORING INTEGRATION & SECURITY EVENTS
  // ---------------------------------------------------------------------------

  const handleProctorEvent = useCallback(async (eventPayload) => {
    try {
      const payloadType = (eventPayload.event_type || eventPayload.eventType || '').toUpperCase();

      // Fullscreen exit is strictly handled by dedicated handleFullscreenChange
      if (payloadType === 'FULLSCREEN_EXIT') return;

      const res = await api.logMockTestSecurityEvent(attemptId, {
        ...eventPayload,
        eventType: payloadType,
        event_type: payloadType,
        answers: responsesRef.current
      });

      if (res) {
        if (res.security_warning_count !== undefined) {
          setSecurityWarningCount(res.security_warning_count);
        }
        if (res.warning_count !== undefined) {
          setWarningCount(res.warning_count);
        }
        if (res.fullscreen_exit_count !== undefined) {
          setFullscreenExitCount(res.fullscreen_exit_count);
        }

        if (res.auto_submitted) {
          const reasonCode = res.submission_reason || 'MAX_SECURITY_WARNINGS';
          const msg = reasonCode === 'SECOND_FULLSCREEN_EXIT'
            ? 'Your test has been automatically submitted because you exited full-screen mode twice.'
            : 'Your test has been automatically submitted because the maximum number of security warnings was reached.';
          setAutoSubmittedState({
            submitted: true,
            reason: reasonCode,
            message: msg
          });
          return;
        }

        if (!res.debounced) {
          const currentCount = res.security_warning_count ?? (securityWarningCount + 1);
          let warningMsg = 'Please follow the test rules and remain on the exam screen.';
          if (payloadType === 'TAB_HIDDEN' || payloadType === 'WINDOW_BLURRED') {
            warningMsg = 'You navigated away from the examination window. Please stay on this tab to maintain exam session integrity.';
          } else if (payloadType === 'MULTIPLE_FACES') {
            warningMsg = 'Multiple faces were observed in your webcam preview. Ensure you are taking this examination alone.';
          }

          setActiveWarningModal({
            title: `Security Warning ${currentCount}/5`,
            message: warningMsg,
            count: currentCount,
            type: 'warning'
          });
        }
      }
    } catch (err) {
      console.warn('[Runner] Failed to log proctoring event:', err);
    }
  }, [attemptId, securityWarningCount]);

  const {
    videoRef,
    startCamera,
    stopCamera,
    hasPermission,
    isStreaming,
    detectionState,
    faceCount,
    warningMessage: cameraWarning
  } = useWebcamProctor({
    enabled: Boolean(examData?.proctoring_config?.webcam_required),
    faceDetectionEnabled: Boolean(examData?.proctoring_config?.face_detection),
    onEvent: handleProctorEvent
  });

  // ---------------------------------------------------------------------------
  // 2. LOAD EXAM DATA & ATTEMPT
  // ---------------------------------------------------------------------------

  useEffect(() => {
    async function loadAttempt() {
      if (!attemptId || attemptId === 'undefined' || attemptId === 'null' || !String(attemptId).trim()) {
        setInitError('Invalid examination attempt ID specified. Please return to the mock test catalog.');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const data = await api.getMockTestAttempt(attemptId);
        setExamData(data);

        const attemptStatus = data?.status || data?.attempt?.status;
        const subReason = data?.submission_reason || data?.attempt?.submission_reason;

        // Auto-submitted restore check (Requirement 16)
        if (attemptStatus === 'AUTO_SUBMITTED' || attemptStatus === 'auto_submitted') {
          setAutoSubmittedState({
            submitted: true,
            reason: subReason || 'AUTO_SUBMITTED',
            message: subReason === 'SECOND_FULLSCREEN_EXIT'
              ? 'Your test has been automatically submitted because you exited full-screen mode twice.'
              : 'Your test has been automatically submitted because the maximum number of security warnings was reached.'
          });
          setRemainingSeconds(0);
          setLoading(false);
          return;
        }

        if (attemptStatus === 'submitted' || attemptStatus === 'evaluated' || attemptStatus === 'completed') {
          setRemainingSeconds(0);
          setLoading(false);
          return;
        }

        // Calculate remaining seconds reliably
        let remaining = data.remaining_seconds ?? data.remainingSeconds;
        if (remaining === undefined || remaining === null) {
          const expiresAt = data.attempt?.expires_at || data.attempt?.expiresAt || data.expires_at || data.expiresAt;
          if (expiresAt) {
            remaining = Math.max(0, Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000));
          } else {
            const dur = data.test?.duration_minutes ?? data.duration_minutes ?? 60;
            remaining = dur * 60;
          }
        }
        setRemainingSeconds(remaining);

        // Restore authoritative counters from backend
        setWarningCount(data.warning_count ?? data.warningCount ?? data.attempt?.warning_count ?? 0);
        setSecurityWarningCount(data.security_warning_count ?? data.attempt?.security_warning_count ?? 0);
        setFullscreenExitCount(data.fullscreen_exit_count ?? data.attempt?.fullscreen_exit_count ?? 0);

        // Preload saved answers
        if (data.responses) {
          setResponses(data.responses);
        }

        const proctorConfig = data.proctoring_config || data.proctoringConfig || data.test?.proctoring_config;
        // Start webcam if test requires proctoring
        if (proctorConfig?.webcam_required) {
          startCamera();
        }

        // Check initial fullscreen state
        const isCurrentlyFullscreen = Boolean(document.fullscreenElement || document.webkitFullscreenElement);
        setIsFullscreenActive(isCurrentlyFullscreen);
      } catch (err) {
        console.error('Failed to load examination:', err);
        setInitError(err.message || 'Unable to load examination attempt.');
      } finally {
        setLoading(false);
      }
    }
    loadAttempt();

    return () => {
      stopCamera();
    };
  }, [attemptId, startCamera, stopCamera]);

  // ---------------------------------------------------------------------------
  // 3. SERVER-AUTHORITATIVE COUNTDOWN TIMER
  // ---------------------------------------------------------------------------

  useEffect(() => {
    if (loading || !examData) return;
    const attemptStatus = examData?.status || examData?.attempt?.status;
    if (attemptStatus === 'submitted' || attemptStatus === 'evaluated' || attemptStatus === 'completed' || attemptStatus === 'AUTO_SUBMITTED' || attemptStatus === 'auto_submitted') return;

    timerIntervalRef.current = setInterval(() => {
      setRemainingSeconds(prev => {
        if (prev <= 1) {
          clearInterval(timerIntervalRef.current);
          handleAutoSubmit('EXAM_TIME_EXPIRED');
          return 0;
        }

        // Warnings check
        if (prev === 300) setTimerWarning('warning_5m');
        if (prev === 60) setTimerWarning('critical_1m');

        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [loading, examData]);

  // ---------------------------------------------------------------------------
  // 4. BROWSER VISIBILITY & FULLSCREEN LISTENERS (Requirements 2, 3, 4, 9, 11)
  // ---------------------------------------------------------------------------

  useEffect(() => {
    if (!examData) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        handleProctorEvent({
          event_type: 'TAB_HIDDEN',
          severity: 'warning',
          client_timestamp: new Date().toISOString()
        });
      }
    };

    const handleWindowBlur = () => {
      handleProctorEvent({
        event_type: 'WINDOW_BLURRED',
        severity: 'warning',
        client_timestamp: new Date().toISOString()
      });
    };

    const handleFullscreenChange = async () => {
      const isNowFullscreen = Boolean(document.fullscreenElement || document.webkitFullscreenElement);
      setIsFullscreenActive(isNowFullscreen);

      if (!isNowFullscreen) {
        // Debounce rapid duplicate events (e.g. 2.5s) to prevent 1 exit counting as multiple (Requirement 9)
        const now = Date.now();
        if (now - lastFullscreenExitRef.current < 2500) {
          return;
        }
        lastFullscreenExitRef.current = now;

        try {
          const res = await api.logMockTestSecurityEvent(attemptId, {
            eventType: 'FULLSCREEN_EXIT',
            event_type: 'FULLSCREEN_EXIT',
            client_timestamp: new Date().toISOString(),
            answers: responsesRef.current
          });

          if (res) {
            if (res.fullscreen_exit_count !== undefined) {
              setFullscreenExitCount(res.fullscreen_exit_count);
            }
            if (res.security_warning_count !== undefined) {
              setSecurityWarningCount(res.security_warning_count);
            }
            if (res.warning_count !== undefined) {
              setWarningCount(res.warning_count);
            }

            if (res.auto_submitted || (res.fullscreen_exit_count && res.fullscreen_exit_count >= 2)) {
              setAutoSubmittedState({
                submitted: true,
                reason: 'SECOND_FULLSCREEN_EXIT',
                message: 'Your test has been automatically submitted because you exited full-screen mode twice.'
              });
              stopCamera();
              return;
            }
          }
        } catch (err) {
          console.warn('[Runner] Fullscreen exit notification failed:', err.message);
        }
      }
    };

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [examData, attemptId, handleProctorEvent, stopCamera]);

  // ---------------------------------------------------------------------------
  // 5. ANSWER STATE PERSISTENCE
  // ---------------------------------------------------------------------------

  const saveAnswerToServer = useCallback(async (questionId, responseData, isMarkedForReview, isVisited = true) => {
    setSaveStatus('saving');
    try {
      await api.saveMockTestAnswer(attemptId, {
        question_id: questionId,
        response_data: responseData,
        is_marked_for_review: isMarkedForReview,
        is_visited: isVisited
      });
      setSaveStatus('saved');
    } catch (err) {
      console.warn('[Runner] Answer save failed:', err.message);
      setSaveStatus('error');
    }
  }, [attemptId]);

  const handleUpdateAnswer = (responseData) => {
    if (!isFullscreenActive || autoSubmittedState?.submitted) return;
    const activeQuestion = examData?.questions[currentIndex];
    if (!activeQuestion) return;

    const currentResp = responses[activeQuestion.id] || {};
    const updated = {
      ...currentResp,
      question_id: activeQuestion.id,
      response_data: responseData,
      is_visited: true
    };

    setResponses(prev => ({
      ...prev,
      [activeQuestion.id]: updated
    }));

    // Trigger save to backend
    saveAnswerToServer(activeQuestion.id, responseData, Boolean(updated.is_marked_for_review), true);
  };

  const handleRunCode = async (question) => {
    if (!isFullscreenActive || autoSubmittedState?.submitted) return;
    const qId = question.id;
    const currentCode = responses[qId]?.response_data?.code !== undefined
      ? responses[qId].response_data.code
      : (question.starter_code || '');

    setCodeExecution(prev => ({
      ...prev,
      [qId]: { running: true, result: null, error: null }
    }));

    try {
      const publicCases = (question.test_cases || []).filter(tc => !tc.is_hidden);
      const res = await api.runCode({
        questionId: qId,
        code: currentCode,
        language: question.programming_language || 'javascript',
        customTestCases: publicCases
      });
      setCodeExecution(prev => ({
        ...prev,
        [qId]: { running: false, result: res, error: null }
      }));
    } catch (err) {
      setCodeExecution(prev => ({
        ...prev,
        [qId]: { running: false, result: null, error: err.message || 'Execution failed' }
      }));
    }
  };

  const handleToggleMarkForReview = () => {
    if (!isFullscreenActive || autoSubmittedState?.submitted) return;
    const activeQuestion = examData?.questions[currentIndex];
    if (!activeQuestion) return;

    const currentResp = responses[activeQuestion.id] || {};
    const newMarked = !currentResp.is_marked_for_review;

    const updated = {
      ...currentResp,
      question_id: activeQuestion.id,
      is_marked_for_review: newMarked,
      is_visited: true
    };

    setResponses(prev => ({
      ...prev,
      [activeQuestion.id]: updated
    }));

    saveAnswerToServer(activeQuestion.id, currentResp.response_data || null, newMarked, true);
  };

  const handleClearAnswer = () => {
    if (!isFullscreenActive || autoSubmittedState?.submitted) return;
    const activeQuestion = examData?.questions[currentIndex];
    if (!activeQuestion) return;

    const currentResp = responses[activeQuestion.id] || {};
    const updated = {
      ...currentResp,
      question_id: activeQuestion.id,
      response_data: null,
      is_visited: true
    };

    setResponses(prev => ({
      ...prev,
      [activeQuestion.id]: updated
    }));

    saveAnswerToServer(activeQuestion.id, null, Boolean(currentResp.is_marked_for_review), true);
  };

  // ---------------------------------------------------------------------------
  // 6. NAVIGATION & PALETTE
  // ---------------------------------------------------------------------------

  const handleNavigate = (index) => {
    if (!isFullscreenActive || autoSubmittedState?.submitted) return;
    if (index >= 0 && index < (examData?.questions?.length || 0)) {
      const targetQuestion = examData.questions[index];
      // Mark target as visited if not already
      if (!responses[targetQuestion.id]?.is_visited) {
        setResponses(prev => ({
          ...prev,
          [targetQuestion.id]: {
            ...prev[targetQuestion.id],
            question_id: targetQuestion.id,
            is_visited: true
          }
        }));
      }
      setCurrentIndex(index);
    }
  };

  // ---------------------------------------------------------------------------
  // 7. EXAM SUBMISSION
  // ---------------------------------------------------------------------------

  const handleAutoSubmit = async (reason) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      stopCamera();
      await api.submitMockTestAttempt(attemptId, {
        auto_submitted: true,
        reason: reason || 'Time expired'
      });
      navigate(`/mock-tests/attempts/${attemptId}/result`);
    } catch (err) {
      console.error('Auto-submission error:', err);
      navigate(`/mock-tests/attempts/${attemptId}/result`);
    }
  };

  const handleManualSubmit = async () => {
    setIsSubmitting(true);
    try {
      stopCamera();
      await api.submitMockTestAttempt(attemptId, {
        auto_submitted: false
      });
      navigate(`/mock-tests/attempts/${attemptId}/result`);
    } catch (err) {
      alert(err.message || 'Submission failed. Please verify connection.');
      setIsSubmitting(false);
    }
  };

  // Format timer
  const formatTime = (secs) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    if (h > 0) {
      return `${h}:${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
    }
    return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // ---------------------------------------------------------------------------
  // 8. PALETTE QUESTION STATUS CLASSIFICATION
  // ---------------------------------------------------------------------------

  const getQuestionPaletteStatus = (qId) => {
    const r = responses[qId];
    const hasAnswer = r?.response_data !== null && r?.response_data !== undefined;
    const isMarked = Boolean(r?.is_marked_for_review);
    const isVisited = Boolean(r?.is_visited);

    if (hasAnswer && isMarked) return 'answered_marked'; // Purple with indicator
    if (isMarked) return 'marked'; // Purple
    if (hasAnswer) return 'answered'; // Green
    if (isVisited) return 'unanswered'; // Orange/Red
    return 'not_visited'; // Gray
  };

  // Summary counts
  const totalQuestions = examData?.questions?.length || 0;
  let answeredCount = 0;
  let markedCount = 0;
  let unansweredCount = 0;
  let notVisitedCount = 0;

  (examData?.questions || []).forEach(q => {
    const status = getQuestionPaletteStatus(q.id);
    if (status === 'answered' || status === 'answered_marked') answeredCount++;
    if (status === 'marked' || status === 'answered_marked') markedCount++;
    if (status === 'unanswered') unansweredCount++;
    if (status === 'not_visited') notVisitedCount++;
  });

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '6rem 1rem' }}>
        <div className="spinner" style={{ margin: '0 auto 1rem' }}></div>
        <p style={{ color: 'var(--color-navy)', fontWeight: 600 }}>Connecting to Secure Examination Session...</p>
      </div>
    );
  }

  if (initError || !examData) {
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
          <h3>Examination Error</h3>
          <p>{initError || 'Unable to open session.'}</p>
          <button onClick={() => navigate('/mock-tests')} className="btn btn-secondary" style={{ marginTop: '1rem' }}>
            Return to Mock Tests
          </button>
        </div>
      </div>
    );
  }

  const attemptStatus = examData?.status || examData?.attempt?.status;
  const isAutoSubmitted = attemptStatus === 'AUTO_SUBMITTED' || attemptStatus === 'auto_submitted' || Boolean(autoSubmittedState?.submitted);
  const isCompleted = isAutoSubmitted || attemptStatus === 'submitted' || attemptStatus === 'evaluated' || attemptStatus === 'completed';

  if (isCompleted) {
    const subReason = autoSubmittedState?.reason || examData?.submission_reason || examData?.attempt?.submission_reason;
    const isFullscreenExitAuto = subReason === 'SECOND_FULLSCREEN_EXIT' || autoSubmittedState?.reason === 'SECOND_FULLSCREEN_EXIT';
    const isMaxWarningsAuto = subReason === 'MAX_SECURITY_WARNINGS' || autoSubmittedState?.reason === 'MAX_SECURITY_WARNINGS';

    let autoSubmitReasonTitle = 'Examination Automatically Submitted';
    let autoSubmitReasonDesc = 'Your test has been automatically submitted due to security policy violations.';
    if (isFullscreenExitAuto) {
      autoSubmitReasonTitle = 'Test Automatically Submitted';
      autoSubmitReasonDesc = 'Your test has been automatically submitted because you exited full-screen mode twice.';
    } else if (isMaxWarningsAuto) {
      autoSubmitReasonTitle = 'Test Automatically Submitted';
      autoSubmitReasonDesc = 'Your test has been automatically submitted because the maximum number of security warnings was reached.';
    }

    return (
      <div className="container" style={{ padding: '4rem 1rem', maxWidth: '640px' }}>
        <div style={{
          background: '#FFFFFF',
          border: `1px solid ${isAutoSubmitted ? '#EF4444' : 'var(--color-border, #E2E8F0)'}`,
          padding: '2.5rem',
          borderRadius: '16px',
          textAlign: 'center',
          boxShadow: isAutoSubmitted ? '0 10px 30px -5px rgba(239, 68, 68, 0.15)' : '0 4px 12px rgba(0,0,0,0.06)'
        }}>
          {isAutoSubmitted ? (
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: '#FEF2F2',
              color: '#DC2626',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.25rem'
            }}>
              <ShieldAlert size={36} />
            </div>
          ) : (
            <CheckCircle2 size={48} style={{ color: '#16A34A', margin: '0 auto 1rem' }} />
          )}

          <h2 style={{
            fontSize: '1.45rem',
            fontWeight: 800,
            marginBottom: '0.5rem',
            color: isAutoSubmitted ? '#DC2626' : 'var(--color-navy, #0F172A)'
          }}>
            {isAutoSubmitted ? autoSubmitReasonTitle : 'Examination Completed'}
          </h2>

          <p style={{ color: '#64748B', marginBottom: '1.5rem', lineHeight: 1.6, fontSize: '0.98rem' }}>
            {isAutoSubmitted ? autoSubmitReasonDesc : 'This examination attempt has already been submitted and finalized. Further responses cannot be recorded.'}
          </p>

          {isAutoSubmitted && (
            <div style={{
              background: '#FEF2F2',
              border: '1px solid #FCA5A5',
              borderRadius: '10px',
              padding: '0.85rem 1.25rem',
              marginBottom: '1.75rem',
              textAlign: 'left'
            }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#991B1B', textTransform: 'uppercase' }}>
                SECURITY ENFORCEMENT SUMMARY
              </div>
              <div style={{ fontSize: '0.9rem', color: '#1E293B', fontWeight: 600, marginTop: '0.3rem' }}>
                Status: <span style={{ color: '#DC2626', fontWeight: 800 }}>AUTO_SUBMITTED</span>
              </div>
              <div style={{ fontSize: '0.9rem', color: '#1E293B', fontWeight: 600, marginTop: '0.2rem' }}>
                Reason: <strong>{subReason || 'SECURITY_POLICY_VIOLATION'}</strong>
              </div>
              <div style={{ fontSize: '0.82rem', color: '#64748B', marginTop: '0.25rem' }}>
                Security Warnings: {securityWarningCount}/5 • Fullscreen Exits: {fullscreenExitCount}/2
              </div>
            </div>
          )}

          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={() => navigate(`/mock-tests/attempts/${attemptId}/result`)}
              className="btn btn-primary"
              style={{ fontWeight: 700, padding: '0.65rem 1.5rem' }}
            >
              View Scorecard & Results
            </button>
            <button
              onClick={() => navigate('/mock-tests')}
              className="btn btn-secondary"
              style={{ fontWeight: 600, padding: '0.65rem 1.25rem' }}
            >
              Back to Catalog
            </button>
          </div>
        </div>
      </div>
    );
  }

  const activeQuestion = (examData.questions || [])[currentIndex] || null;
  const activeResponse = activeQuestion ? (responses[activeQuestion.id]?.response_data || null) : null;
  const isMarked = activeQuestion ? Boolean(responses[activeQuestion.id]?.is_marked_for_review) : false;

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      background: '#F1F5F9',
      fontFamily: 'var(--font-body)',
      position: 'relative'
    }}>
      {/* ---------------------------------------------------------------------
          BLOCKING FULL-SCREEN OVERLAY (REQUIREMENTS 2, 3, 10, 11)
      --------------------------------------------------------------------- */}
      {!isFullscreenActive && !isCompleted && (
        <div
          id="fullscreen-blocking-overlay"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 999,
            background: 'rgba(15, 23, 42, 0.88)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1.5rem',
            color: '#FFFFFF'
          }}
        >
          <div style={{
            maxWidth: '520px',
            width: '100%',
            background: '#1E293B',
            border: `1px solid ${fullscreenExitCount > 0 ? '#EF4444' : '#3B82F6'}`,
            borderRadius: '20px',
            padding: '2.5rem 2rem',
            textAlign: 'center',
            boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.8)'
          }}>
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: fullscreenExitCount > 0 ? 'rgba(239, 68, 68, 0.2)' : 'rgba(59, 130, 246, 0.2)',
              color: fullscreenExitCount > 0 ? '#EF4444' : '#3B82F6',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.5rem'
            }}>
              {fullscreenExitCount > 0 ? <AlertTriangle size={32} /> : <Maximize2 size={32} />}
            </div>

            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#FFFFFF', marginBottom: '0.75rem' }}>
              {fullscreenExitCount > 0
                ? 'Full-screen mode is required to continue this test.'
                : 'FULL SCREEN REQUIRED'}
            </h2>

            <p style={{ color: '#94A3B8', fontSize: '0.96rem', lineHeight: 1.6, marginBottom: '1.5rem' }}>
              {fullscreenExitCount > 0
                ? 'Please return to full-screen mode to continue. All test inputs and navigation remain locked while outside full-screen.'
                : 'You must enter full-screen mode before answering questions to guarantee assessment session integrity.'}
            </p>

            {fullscreenExitCount > 0 && (
              <div style={{
                background: 'rgba(239, 68, 68, 0.12)',
                border: '1px solid rgba(239, 68, 68, 0.35)',
                color: '#FCA5A5',
                padding: '0.75rem 1rem',
                borderRadius: '10px',
                fontWeight: 700,
                fontSize: '0.88rem',
                marginBottom: '1.75rem'
              }}>
                Fullscreen exited: {fullscreenExitCount} / 2
                <div style={{ fontSize: '0.78rem', fontWeight: 500, marginTop: '0.25rem', color: '#FECACA' }}>
                  A second exit will automatically submit the test.
                </div>
              </div>
            )}

            <button
              id="enter-fullscreen-action-btn"
              onClick={requestBrowserFullscreen}
              style={{
                background: '#2563EB',
                color: '#FFFFFF',
                border: 'none',
                padding: '0.85rem 2.25rem',
                borderRadius: '12px',
                fontSize: '1.05rem',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                boxShadow: '0 10px 25px -5px rgba(37, 99, 235, 0.5)',
                transition: 'all 0.2s ease'
              }}
              onMouseOver={e => e.currentTarget.style.background = '#1D4ED8'}
              onMouseOut={e => e.currentTarget.style.background = '#2563EB'}
            >
              <Maximize2 size={18} />
              <span>{fullscreenExitCount > 0 ? 'Return to Full Screen' : 'Enter Full Screen'}</span>
            </button>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------------------------
          EXAM HEADER BAR
      --------------------------------------------------------------------- */}
      <header style={{
        background: '#0F172A',
        color: '#FFFFFF',
        padding: '0.75rem 1.5rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '1px solid #1E293B',
        position: 'sticky',
        top: 0,
        zIndex: 40
      }}>
        {/* Left: Test Info */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div>
            <div style={{ fontSize: '0.72rem', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {(examData.subject || examData.test?.subject || 'Examination')} • Candidate: {user?.full_name}
            </div>
            <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#FFFFFF', letterSpacing: '-0.01em' }}>
              {examData.test_title || examData.title || examData.test?.title || 'Mock Examination'}
            </div>
          </div>
        </div>

        {/* Center: Server-Authoritative Timer & Security Indicators */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          {/* Authoritative Timer */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.45rem',
            background: remainingSeconds < 60
              ? 'rgba(239, 68, 68, 0.25)'
              : remainingSeconds < 300
              ? 'rgba(245, 158, 11, 0.2)'
              : '#1E293B',
            color: remainingSeconds < 60
              ? '#EF4444'
              : remainingSeconds < 300
              ? '#F59E0B'
              : '#FFFFFF',
            border: remainingSeconds < 60
              ? '1px solid #EF4444'
              : remainingSeconds < 300
              ? '1px solid #F59E0B'
              : '1px solid #334155',
            padding: '0.4rem 0.9rem',
            borderRadius: '999px',
            fontSize: '1rem',
            fontWeight: 800,
            letterSpacing: '0.04em'
          }}>
            <Clock size={16} />
            <span>{formatTime(remainingSeconds)}</span>
          </div>

          {/* Security & Fullscreen Counters Pill (Prompt Requirement 14) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {/* Security Warnings */}
            <div
              id="security-warnings-indicator"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                background: securityWarningCount > 0 ? 'rgba(239, 68, 68, 0.2)' : 'rgba(30, 41, 59, 0.8)',
                color: securityWarningCount > 0 ? '#F87171' : '#94A3B8',
                border: `1px solid ${securityWarningCount > 0 ? '#EF4444' : '#334155'}`,
                padding: '0.35rem 0.75rem',
                borderRadius: '999px',
                fontSize: '0.78rem',
                fontWeight: 700,
                letterSpacing: '0.02em'
              }}
            >
              <ShieldAlert size={14} />
              <span>Security Warnings: {securityWarningCount} / 5</span>
            </div>

            {/* Fullscreen Exits */}
            <div
              id="fullscreen-exits-indicator"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                background: fullscreenExitCount > 0 ? 'rgba(245, 158, 11, 0.2)' : 'rgba(30, 41, 59, 0.8)',
                color: fullscreenExitCount > 0 ? '#FBBF24' : '#94A3B8',
                border: `1px solid ${fullscreenExitCount > 0 ? '#F59E0B' : '#334155'}`,
                padding: '0.35rem 0.75rem',
                borderRadius: '999px',
                fontSize: '0.78rem',
                fontWeight: 700,
                letterSpacing: '0.02em'
              }}
            >
              <Maximize2 size={14} />
              <span>Fullscreen Exits: {fullscreenExitCount} / 2</span>
            </div>
          </div>
        </div>

        {/* Right: Sync, Network & Submit Action */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {/* Sync indicator */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem' }}>
            {saveStatus === 'saved' ? (
              <span style={{ color: '#10B981', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                <Check size={14} /> Saved
              </span>
            ) : saveStatus === 'saving' ? (
              <span style={{ color: '#F59E0B' }}>Syncing...</span>
            ) : (
              <span style={{ color: '#EF4444' }}>Sync Error</span>
            )}
          </div>

          {/* Network indicator */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem', color: isOnline ? '#10B981' : '#EF4444' }}>
            {isOnline ? <Wifi size={14} /> : <WifiOff size={14} />}
          </div>

          {/* Submit Action */}
          <button
            onClick={() => setSubmitConfirmOpen(true)}
            disabled={!isFullscreenActive || isCompleted}
            className="btn btn-primary"
            style={{
              padding: '0.4rem 1rem',
              fontSize: '0.84rem',
              fontWeight: 800,
              background: '#10B981',
              borderColor: '#10B981',
              opacity: !isFullscreenActive || isCompleted ? 0.6 : 1,
              cursor: !isFullscreenActive || isCompleted ? 'not-allowed' : 'pointer'
            }}
          >
            Submit Test
          </button>
        </div>
      </header>

      {/* ---------------------------------------------------------------------
          MAIN EXAMINATION WORKSPACE
      --------------------------------------------------------------------- */}
      <div style={{
        display: 'flex',
        flex: 1,
        position: 'relative',
        overflow: 'hidden',
        pointerEvents: (!isFullscreenActive || isCompleted) ? 'none' : 'auto',
        filter: (!isFullscreenActive && !isCompleted) ? 'blur(1px)' : 'none',
        userSelect: (!isFullscreenActive || isCompleted) ? 'none' : 'auto'
      }}>
        {/* Left / Center: Question Paper Pane */}
        <main style={{
          flex: 1,
          padding: '1.75rem 2rem 4rem',
          overflowY: 'auto',
          maxWidth: 'calc(100vw - 320px)'
        }}>
          {activeQuestion ? (
            <div style={{
              background: '#FFFFFF',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--color-border)',
              boxShadow: 'var(--shadow-sm)',
              padding: '2rem 2.25rem',
              marginBottom: '1.5rem'
            }}>
              {/* Question Header Meta */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderBottom: '1px solid #F1F5F9',
                paddingBottom: '1rem',
                marginBottom: '1.5rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <span style={{
                    fontSize: '1.1rem',
                    fontWeight: 800,
                    color: 'var(--color-navy)'
                  }}>
                    Question {currentIndex + 1} of {totalQuestions}
                  </span>
                  <span style={{
                    background: '#EFF6FF',
                    color: '#2563EB',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    padding: '0.15rem 0.5rem',
                    borderRadius: '4px',
                    textTransform: 'uppercase'
                  }}>
                    {activeQuestion.question_type.replace('_', ' ')}
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.82rem' }}>
                  <span style={{ color: '#059669', fontWeight: 700 }}>
                    +{activeQuestion.marks} Marks
                  </span>
                  {activeQuestion.negative_marks > 0 && (
                    <span style={{ color: '#DC2626', fontWeight: 700 }}>
                      -{activeQuestion.negative_marks} Neg.
                    </span>
                  )}
                </div>
              </div>

              {/* Case Study Passage if present */}
              {activeQuestion.case_passage && (
                <div style={{
                  background: '#F8FAFC',
                  border: '1px solid #E2E8F0',
                  borderRadius: 'var(--radius-md)',
                  padding: '1.25rem',
                  fontSize: '0.9rem',
                  lineHeight: 1.6,
                  color: 'var(--color-text-primary)',
                  marginBottom: '1.5rem',
                  borderLeft: '4px solid var(--color-orange)'
                }}>
                  <div style={{ fontWeight: 800, fontSize: '0.8rem', color: 'var(--color-orange-dark)', marginBottom: '0.4rem', textTransform: 'uppercase' }}>
                    Reference Context / Passage:
                  </div>
                  {activeQuestion.case_passage}
                </div>
              )}

              {/* Question Prompt */}
              <div style={{
                fontSize: '1.05rem',
                fontWeight: 600,
                color: 'var(--color-navy)',
                lineHeight: 1.6,
                marginBottom: '1.75rem'
              }}>
                {activeQuestion.question_text}
              </div>

              {/* Diagram / Image if provided */}
              {activeQuestion.image_url && (
                <div style={{ marginBottom: '1.5rem', textAlign: 'center' }}>
                  <img
                    src={activeQuestion.image_url}
                    alt="Question Diagram"
                    style={{ maxWidth: '100%', maxHeight: '300px', borderRadius: '8px', border: '1px solid #E2E8F0' }}
                  />
                </div>
              )}

              {/* Interactive Inputs by Question Type */}
              <div style={{ marginBottom: '2rem' }}>
                {/* 1. Single Choice MCQ / Case Study */}
                {['mcq_single', 'case_study'].includes(activeQuestion.question_type) && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {(activeQuestion.options || []).map((opt, optIdx) => {
                      const isSelected = activeResponse?.selected_index === optIdx;
                      return (
                        <div
                          key={optIdx}
                          onClick={() => handleUpdateAnswer({ selected_index: optIdx })}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.75rem',
                            padding: '0.85rem 1.15rem',
                            borderRadius: 'var(--radius-md)',
                            border: `2px solid ${isSelected ? 'var(--color-orange)' : '#E2E8F0'}`,
                            background: isSelected ? 'var(--color-orange-light)' : '#FFFFFF',
                            cursor: 'pointer',
                            transition: 'all var(--transition-fast)'
                          }}
                        >
                          <div style={{
                            width: '20px',
                            height: '20px',
                            borderRadius: '50%',
                            border: `2px solid ${isSelected ? 'var(--color-orange)' : '#94A3B8'}`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: '#FFFFFF'
                          }}>
                            {isSelected && (
                              <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--color-orange)' }} />
                            )}
                          </div>
                          <span style={{ fontSize: '0.92rem', color: 'var(--color-text-primary)', fontWeight: isSelected ? 600 : 400 }}>
                            {opt}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* 2. Multiple-Select MCQ */}
                {activeQuestion.question_type === 'mcq_multiple' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {(activeQuestion.options || []).map((opt, optIdx) => {
                      const selectedList = activeResponse?.selected_indices || [];
                      const isSelected = selectedList.includes(optIdx);

                      const toggleOption = () => {
                        const nextList = isSelected
                          ? selectedList.filter(i => i !== optIdx)
                          : [...selectedList, optIdx];
                        handleUpdateAnswer({ selected_indices: nextList });
                      };

                      return (
                        <div
                          key={optIdx}
                          onClick={toggleOption}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.75rem',
                            padding: '0.85rem 1.15rem',
                            borderRadius: 'var(--radius-md)',
                            border: `2px solid ${isSelected ? '#2563EB' : '#E2E8F0'}`,
                            background: isSelected ? '#EFF6FF' : '#FFFFFF',
                            cursor: 'pointer',
                            transition: 'all var(--transition-fast)'
                          }}
                        >
                          <div style={{
                            width: '20px',
                            height: '20px',
                            borderRadius: '4px',
                            border: `2px solid ${isSelected ? '#2563EB' : '#94A3B8'}`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: isSelected ? '#2563EB' : '#FFFFFF',
                            color: '#FFFFFF'
                          }}>
                            {isSelected && <Check size={14} />}
                          </div>
                          <span style={{ fontSize: '0.92rem', color: 'var(--color-text-primary)', fontWeight: isSelected ? 600 : 400 }}>
                            {opt}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* 3. True / False */}
                {activeQuestion.question_type === 'true_false' && (
                  <div style={{ display: 'flex', gap: '1rem' }}>
                    {[true, false].map((val) => {
                      const isSelected = activeResponse?.selected_value === val;
                      return (
                        <button
                          key={String(val)}
                          onClick={() => handleUpdateAnswer({ selected_value: val })}
                          style={{
                            flex: 1,
                            padding: '1rem',
                            borderRadius: 'var(--radius-md)',
                            border: `2px solid ${isSelected ? 'var(--color-orange)' : '#E2E8F0'}`,
                            background: isSelected ? 'var(--color-orange-light)' : '#FFFFFF',
                            fontSize: '1rem',
                            fontWeight: 700,
                            color: isSelected ? 'var(--color-orange-dark)' : 'var(--color-navy)',
                            cursor: 'pointer'
                          }}
                        >
                          {val ? 'TRUE' : 'FALSE'}
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* 4. Fill in the Blanks / Short Answer */}
                {['fill_blank', 'short_answer'].includes(activeQuestion.question_type) && (
                  <div>
                    <input
                      type="text"
                      placeholder="Type your answer here..."
                      value={activeResponse?.text || ''}
                      onChange={(e) => handleUpdateAnswer({ text: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '0.85rem 1rem',
                        fontSize: '1rem',
                        border: '2px solid #CBD5E1',
                        borderRadius: 'var(--radius-md)',
                        outline: 'none',
                        color: 'var(--color-navy)'
                      }}
                    />
                  </div>
                )}

                {/* 5. Numerical Questions */}
                {activeQuestion.question_type === 'numerical' && (
                  <div>
                    <input
                      type="number"
                      step="any"
                      placeholder="Enter numerical answer..."
                      value={activeResponse?.number ?? ''}
                      onChange={(e) => handleUpdateAnswer({ number: e.target.value === '' ? null : parseFloat(e.target.value) })}
                      style={{
                        maxWidth: '300px',
                        padding: '0.85rem 1rem',
                        fontSize: '1.1rem',
                        border: '2px solid #CBD5E1',
                        borderRadius: 'var(--radius-md)',
                        outline: 'none',
                        color: 'var(--color-navy)',
                        fontWeight: 700
                      }}
                    />
                  </div>
                )}

                {/* 6. Matching Questions */}
                {activeQuestion.question_type === 'matching' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div style={{ fontSize: '0.82rem', color: '#64748B' }}>
                      Select the matching value for each item below:
                    </div>
                    {((activeQuestion.options?.left_items || activeQuestion.options) || []).map((leftItem) => {
                      const currentMatch = activeResponse?.pairs?.[leftItem.id] || '';
                      const targets = activeQuestion.options?.available_targets || [];

                      const setMatch = (targetVal) => {
                        const pairs = { ...(activeResponse?.pairs || {}) };
                        pairs[leftItem.id] = targetVal;
                        handleUpdateAnswer({ pairs });
                      };

                      return (
                        <div
                          key={leftItem.id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            background: '#F8FAFC',
                            padding: '0.75rem 1rem',
                            borderRadius: '8px',
                            border: '1px solid #E2E8F0',
                            gap: '1rem'
                          }}
                        >
                          <div style={{ fontSize: '0.92rem', fontWeight: 600, color: 'var(--color-navy)' }}>
                            {leftItem.text}
                          </div>
                          <select
                            value={currentMatch}
                            onChange={(e) => setMatch(e.target.value)}
                            style={{
                              padding: '0.5rem 0.8rem',
                              borderRadius: '6px',
                              border: '1px solid #CBD5E1',
                              fontSize: '0.88rem',
                              background: '#FFFFFF',
                              minWidth: '220px'
                            }}
                          >
                            <option value="">-- Select Match --</option>
                            {targets.map((t, tIdx) => (
                              <option key={tIdx} value={t}>{t}</option>
                            ))}
                          </select>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* 7. Long Answer / Subjective */}
                {['long_answer', 'subjective'].includes(activeQuestion.question_type) && (
                  <div>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '0.5rem',
                      fontSize: '0.82rem',
                      color: '#64748B'
                    }}>
                      <span style={{ fontWeight: 600, color: 'var(--color-navy)' }}>
                        Detailed Answer Submission (Max 2000 characters)
                      </span>
                      <span style={{
                        fontWeight: 700,
                        color: (activeResponse?.text || '').length > 1900 ? '#DC2626' : '#64748B'
                      }}>
                        Characters: {(activeResponse?.text || '').length} / 2000
                      </span>
                    </div>

                    <textarea
                      rows={8}
                      maxLength={2000}
                      placeholder="Type your explanation or answer here..."
                      value={activeResponse?.text || ''}
                      onChange={(e) => {
                        const val = e.target.value.slice(0, 2000);
                        handleUpdateAnswer({ text: val });
                      }}
                      style={{
                        width: '100%',
                        padding: '1rem',
                        fontSize: '0.95rem',
                        lineHeight: 1.6,
                        border: '2px solid #CBD5E1',
                        borderRadius: 'var(--radius-md)',
                        outline: 'none',
                        color: 'var(--color-navy)',
                        fontFamily: 'inherit',
                        resize: 'vertical',
                        background: '#FFFFFF'
                      }}
                    />

                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginTop: '0.75rem',
                      flexWrap: 'wrap',
                      gap: '0.5rem'
                    }}>
                      <div style={{ fontSize: '0.78rem', color: '#64748B' }}>
                        Evaluated manually by faculty. Expected answers are withheld prior to submission.
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          handleUpdateAnswer({ text: activeResponse?.text || '' });
                          setManualSaveSuccess(true);
                          setTimeout(() => setManualSaveSuccess(false), 2500);
                        }}
                        className="btn btn-secondary btn-sm"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontWeight: 700 }}
                      >
                        <Check size={14} color={manualSaveSuccess ? '#10B981' : '#64748B'} />
                        <span>{manualSaveSuccess ? 'Answer Saved!' : 'Save Answer'}</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* 8. Coding Question */}
                {activeQuestion.question_type === 'coding' && (
                  <div>
                    {/* Language & Sandbox Info Header */}
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      background: '#0F172A',
                      color: '#F8FAFC',
                      padding: '0.6rem 1rem',
                      borderRadius: '8px 8px 0 0',
                      borderBottom: '1px solid #1E293B',
                      fontSize: '0.8rem'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Code size={15} color="#38BDF8" />
                        <span style={{ fontWeight: 700, color: '#38BDF8' }}>
                          {(activeQuestion.programming_language || 'javascript').toUpperCase()}
                        </span>
                        <span style={{ color: '#64748B' }}>• Isolated Sandbox</span>
                      </div>
                      <div style={{ display: 'flex', gap: '1rem', color: '#94A3B8' }}>
                        <span>Limit: {activeQuestion.time_limit || 2.0}s</span>
                        <span>Memory: {activeQuestion.memory_limit || 128}MB</span>
                      </div>
                    </div>

                    {/* Code Editor Textarea */}
                    <textarea
                      rows={12}
                      value={activeResponse?.code !== undefined ? activeResponse.code : (activeQuestion.starter_code || 'function solution() {\n  // write code\n}')}
                      onChange={(e) => handleUpdateAnswer({ code: e.target.value })}
                      placeholder="Write your code solution here..."
                      spellCheck={false}
                      style={{
                        width: '100%',
                        padding: '1rem',
                        fontSize: '0.9rem',
                        lineHeight: 1.5,
                        fontFamily: 'monospace',
                        background: '#020617',
                        color: '#F1F5F9',
                        border: '1px solid #1E293B',
                        borderRadius: '0 0 8px 8px',
                        outline: 'none',
                        resize: 'vertical',
                        tabSize: 2
                      }}
                    />

                    {/* Run & Console Control Bar */}
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginTop: '0.75rem',
                      flexWrap: 'wrap',
                      gap: '0.5rem'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <button
                          type="button"
                          disabled={codeExecution[activeQuestion.id]?.running}
                          onClick={() => handleRunCode(activeQuestion)}
                          className="btn btn-primary btn-sm"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.4rem',
                            fontWeight: 800,
                            background: '#059669',
                            borderColor: '#059669'
                          }}
                        >
                          <Play size={14} />
                          <span>{codeExecution[activeQuestion.id]?.running ? 'Executing in Sandbox...' : 'Run Code'}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            const cur = activeResponse?.code !== undefined ? activeResponse.code : (activeQuestion.starter_code || '');
                            handleUpdateAnswer({ code: cur });
                            setManualSaveSuccess(true);
                            setTimeout(() => setManualSaveSuccess(false), 2500);
                          }}
                          className="btn btn-secondary btn-sm"
                          style={{ fontSize: '0.8rem', fontWeight: 600 }}
                        >
                          <Check size={14} color={manualSaveSuccess ? '#10B981' : '#64748B'} />
                          <span>{manualSaveSuccess ? 'Code Saved!' : 'Save Code'}</span>
                        </button>
                      </div>

                      <div style={{ fontSize: '0.78rem', color: '#64748B', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <Lock size={12} />
                        <span>Hidden test cases evaluated upon final test submission</span>
                      </div>
                    </div>

                    {/* Execution Output Console */}
                    {codeExecution[activeQuestion.id] && (
                      <div style={{
                        marginTop: '1rem',
                        background: '#F8FAFC',
                        border: '1px solid #E2E8F0',
                        borderRadius: '8px',
                        padding: '1rem'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                          <span style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--color-navy)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <Terminal size={15} /> Sandbox Execution Output
                          </span>
                          {codeExecution[activeQuestion.id].result && (
                            <span style={{
                              fontSize: '0.75rem',
                              fontWeight: 800,
                              padding: '0.15rem 0.5rem',
                              borderRadius: '4px',
                              background: codeExecution[activeQuestion.id].result.passed ? '#ECFDF5' : '#FEF2F2',
                              color: codeExecution[activeQuestion.id].result.passed ? '#059669' : '#DC2626'
                            }}>
                              {codeExecution[activeQuestion.id].result.passed ? 'ALL PUBLIC TESTS PASSED' : 'TESTS FAILED'} • {codeExecution[activeQuestion.id].result.execution_time_ms}ms
                            </span>
                          )}
                        </div>

                        {codeExecution[activeQuestion.id].error && (
                          <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', color: '#DC2626', padding: '0.75rem', borderRadius: '6px', fontSize: '0.82rem', fontFamily: 'monospace' }}>
                            {codeExecution[activeQuestion.id].error}
                          </div>
                        )}

                        {codeExecution[activeQuestion.id].result?.results && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            {codeExecution[activeQuestion.id].result.results.map((r, rIdx) => (
                              <div
                                key={rIdx}
                                style={{
                                  background: r.passed ? '#F0FDF4' : '#FFF1F2',
                                  border: `1px solid ${r.passed ? '#BBF7D0' : '#FECDD3'}`,
                                  borderRadius: '6px',
                                  padding: '0.6rem 0.8rem',
                                  fontSize: '0.82rem'
                                }}
                              >
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
                                  <span style={{ fontWeight: 700, color: r.passed ? '#15803D' : '#BE123C' }}>
                                    Test Case #{rIdx + 1}: {r.passed ? 'Passed ✓' : 'Failed ✗'}
                                  </span>
                                  <span style={{ fontSize: '0.75rem', color: '#64748B' }}>{r.execution_time_ms} ms</span>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.5rem', fontFamily: 'monospace', fontSize: '0.78rem' }}>
                                  <div>
                                    <span style={{ color: '#64748B' }}>Input: </span>
                                    <span>{r.input || '(none)'}</span>
                                  </div>
                                  <div>
                                    <span style={{ color: '#64748B' }}>Expected: </span>
                                    <span>{r.expected_output}</span>
                                  </div>
                                  <div>
                                    <span style={{ color: '#64748B' }}>Your Output: </span>
                                    <span style={{ color: r.passed ? '#15803D' : '#DC2626', fontWeight: 700 }}>
                                      {r.actual_output !== undefined ? String(r.actual_output) : '(none)'}
                                    </span>
                                  </div>
                                </div>
                                {r.error && (
                                  <div style={{ color: '#DC2626', marginTop: '0.3rem', fontSize: '0.76rem', fontFamily: 'monospace' }}>
                                    Error: {r.error}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Bottom Question Controls */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderTop: '1px solid #F1F5F9',
                paddingTop: '1.25rem'
              }}>
                {/* Secondary actions: Clear & Mark for review */}
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <button
                    onClick={handleToggleMarkForReview}
                    className="btn btn-secondary"
                    style={{
                      fontSize: '0.84rem',
                      fontWeight: 600,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      color: isMarked ? '#7C3AED' : 'var(--color-text-secondary)',
                      borderColor: isMarked ? '#7C3AED' : 'var(--color-border)'
                    }}
                  >
                    <Bookmark size={15} />
                    <span>{isMarked ? 'Unmark Review' : 'Mark for Review'}</span>
                  </button>

                  <button
                    onClick={handleClearAnswer}
                    className="btn btn-secondary"
                    style={{ fontSize: '0.84rem', color: '#64748B' }}
                  >
                    Clear Response
                  </button>
                </div>

                {/* Navigation: Prev / Next */}
                <div style={{ display: 'flex', gap: '0.6rem' }}>
                  <button
                    onClick={() => handleNavigate(currentIndex - 1)}
                    disabled={currentIndex === 0}
                    className="btn btn-secondary"
                    style={{
                      fontSize: '0.85rem',
                      padding: '0.45rem 0.9rem',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.3rem',
                      opacity: currentIndex === 0 ? 0.5 : 1
                    }}
                  >
                    <ChevronLeft size={16} />
                    <span>Previous</span>
                  </button>

                  <button
                    onClick={() => handleNavigate(currentIndex + 1)}
                    disabled={currentIndex === totalQuestions - 1}
                    className="btn btn-primary"
                    style={{
                      fontSize: '0.85rem',
                      padding: '0.45rem 1.1rem',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.3rem',
                      opacity: currentIndex === totalQuestions - 1 ? 0.5 : 1
                    }}
                  >
                    <span>Next</span>
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div>No questions available.</div>
          )}
        </main>

        {/* -------------------------------------------------------------------
            RIGHT PALETTE SIDEBAR
        ------------------------------------------------------------------- */}
        <aside style={{
          width: '320px',
          background: '#FFFFFF',
          borderLeft: '1px solid var(--color-border)',
          display: 'flex',
          flexDirection: 'column',
          position: 'sticky',
          top: '60px',
          height: 'calc(100vh - 60px)',
          overflowY: 'auto'
        }}>
          {/* Webcam Mini Preview Widget */}
          {examData.proctoring_config?.webcam_required && (
            <div style={{
              padding: '1rem',
              borderBottom: '1px solid var(--color-border)',
              background: '#0F172A',
              color: '#FFFFFF'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <div style={{ fontSize: '0.78rem', fontWeight: 700, letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <Camera size={14} style={{ color: 'var(--color-orange)' }} />
                  <span>PROCTOR MONITOR</span>
                </div>
                <div style={{
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  color: detectionState === 'ONE_FACE' ? '#10B981' : '#F59E0B'
                }}>
                  {detectionState === 'ONE_FACE' ? 'Normal' : detectionState}
                </div>
              </div>

              {/* Video Tag */}
              <div style={{
                width: '100%',
                height: '110px',
                borderRadius: '6px',
                overflow: 'hidden',
                background: '#000000',
                position: 'relative'
              }}>
                <video
                  ref={videoRef}
                  playsInline
                  muted
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </div>

              {cameraWarning && (
                <div style={{
                  marginTop: '0.4rem',
                  fontSize: '0.7rem',
                  color: '#FCA5A5',
                  lineHeight: 1.3
                }}>
                  {cameraWarning}
                </div>
              )}
            </div>
          )}

          {/* Palette Status Legend */}
          <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--color-border)' }}>
            <div style={{ fontSize: '0.84rem', fontWeight: 800, color: 'var(--color-navy)', marginBottom: '0.75rem' }}>
              Question Palette
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <span style={{ width: '12px', height: '12px', borderRadius: '3px', background: '#10B981' }} />
                <span>Answered ({answeredCount})</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <span style={{ width: '12px', height: '12px', borderRadius: '3px', background: '#EA580C' }} />
                <span>Unanswered ({unansweredCount})</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <span style={{ width: '12px', height: '12px', borderRadius: '3px', background: '#7C3AED' }} />
                <span>Marked ({markedCount})</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <span style={{ width: '12px', height: '12px', borderRadius: '3px', background: '#CBD5E1' }} />
                <span>Not Visited ({notVisitedCount})</span>
              </div>
            </div>
          </div>

          {/* Palette Number Grid */}
          <div style={{ padding: '1.25rem', flex: 1, overflowY: 'auto' }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(5, 1fr)',
              gap: '0.6rem'
            }}>
              {(examData.questions || []).map((q, idx) => {
                const status = getQuestionPaletteStatus(q.id);
                const isCurrent = currentIndex === idx;

                let bg = '#FFFFFF';
                let color = 'var(--color-navy)';
                let border = '1px solid #CBD5E1';

                if (status === 'answered') {
                  bg = '#10B981';
                  color = '#FFFFFF';
                  border = '1px solid #059669';
                } else if (status === 'answered_marked') {
                  bg = '#7C3AED';
                  color = '#FFFFFF';
                  border = '2px solid #10B981';
                } else if (status === 'marked') {
                  bg = '#7C3AED';
                  color = '#FFFFFF';
                  border = '1px solid #6D28D9';
                } else if (status === 'unanswered') {
                  bg = '#EA580C';
                  color = '#FFFFFF';
                  border = '1px solid #C2410C';
                } else {
                  bg = '#F8FAFC';
                  color = '#64748B';
                  border = '1px solid #E2E8F0';
                }

                return (
                  <button
                    key={q.id}
                    onClick={() => handleNavigate(idx)}
                    style={{
                      aspectRatio: '1',
                      borderRadius: '8px',
                      background: bg,
                      color: color,
                      border: isCurrent ? '2px solid #0F172A' : border,
                      fontWeight: 800,
                      fontSize: '0.85rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      transform: isCurrent ? 'scale(1.1)' : 'scale(1)',
                      boxShadow: isCurrent ? 'var(--shadow-md)' : 'none',
                      transition: 'all var(--transition-fast)'
                    }}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Sidebar Submit Footer */}
          <div style={{ padding: '1rem', borderTop: '1px solid var(--color-border)', background: '#FAFAFA' }}>
            <button
              onClick={() => setSubmitConfirmOpen(true)}
              className="btn btn-primary"
              style={{
                width: '100%',
                padding: '0.75rem',
                fontSize: '0.9rem',
                fontWeight: 800,
                background: '#10B981',
                borderColor: '#10B981',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.4rem'
              }}
            >
              <Send size={15} />
              <span>Submit Entire Exam</span>
            </button>
          </div>
        </aside>
      </div>

      {/* ---------------------------------------------------------------------
          SUBMISSION CONFIRMATION MODAL
      --------------------------------------------------------------------- */}
      {submitConfirmOpen && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(15, 23, 42, 0.75)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          padding: '1rem'
        }}>
          <div style={{
            background: '#FFFFFF',
            borderRadius: 'var(--radius-lg)',
            maxWidth: '480px',
            width: '100%',
            padding: '2rem',
            boxShadow: 'var(--shadow-xl)',
            textAlign: 'center'
          }}>
            <div style={{
              width: '50px',
              height: '50px',
              borderRadius: '50%',
              background: '#ECFDF5',
              color: '#10B981',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1rem'
            }}>
              <CheckCircle2 size={28} />
            </div>

            <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--color-navy)', marginBottom: '0.5rem' }}>
              Finalize Examination?
            </h3>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.88rem', marginBottom: '1.25rem' }}>
              Please review your question completion summary before submitting:
            </p>

            {/* Completion Summary Table */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '0.6rem',
              background: 'var(--color-bg-alt)',
              padding: '1rem',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.84rem',
              marginBottom: '1.5rem',
              textAlign: 'left'
            }}>
              <div>Total Questions: <strong>{totalQuestions}</strong></div>
              <div>Answered: <strong style={{ color: '#059669' }}>{answeredCount}</strong></div>
              <div>Marked for Review: <strong style={{ color: '#7C3AED' }}>{markedCount}</strong></div>
              <div>Unanswered: <strong style={{ color: '#DC2626' }}>{totalQuestions - answeredCount}</strong></div>
              <div style={{ gridColumn: 'span 2' }}>
                Remaining Time: <strong>{formatTime(remainingSeconds)}</strong>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
              <button
                onClick={() => setSubmitConfirmOpen(false)}
                disabled={isSubmitting}
                className="btn btn-secondary"
                style={{ padding: '0.6rem 1.25rem', fontSize: '0.88rem' }}
              >
                Return to Exam
              </button>
              <button
                onClick={handleManualSubmit}
                disabled={isSubmitting}
                className="btn btn-primary"
                style={{
                  padding: '0.6rem 1.5rem',
                  fontSize: '0.88rem',
                  fontWeight: 800,
                  background: '#10B981',
                  borderColor: '#10B981'
                }}
              >
                {isSubmitting ? 'Evaluating...' : 'Confirm Submission'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------------------------
          PROCTORING NON-ACCUSATORY WARNING DIALOG
      --------------------------------------------------------------------- */}
      {activeWarningModal && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(15, 23, 42, 0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 110,
          padding: '1rem'
        }}>
          <div style={{
            background: '#FFFFFF',
            borderRadius: 'var(--radius-lg)',
            maxWidth: '440px',
            width: '100%',
            padding: '1.75rem',
            textAlign: 'center',
            boxShadow: 'var(--shadow-xl)'
          }}>
            <div style={{
              width: '46px',
              height: '46px',
              borderRadius: '50%',
              background: '#FFFBEB',
              color: '#D97706',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1rem'
            }}>
              <AlertTriangle size={24} />
            </div>

            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--color-navy)', marginBottom: '0.5rem' }}>
              {activeWarningModal.title}
            </h3>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.86rem', lineHeight: 1.5, marginBottom: '1.25rem' }}>
              {activeWarningModal.message}
            </p>

            <button
              onClick={() => setActiveWarningModal(null)}
              className="btn btn-primary"
              style={{ padding: '0.55rem 1.5rem', fontSize: '0.88rem', fontWeight: 700 }}
            >
              I Understand & Resume Exam
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
export default MockTestRunnerPage;
