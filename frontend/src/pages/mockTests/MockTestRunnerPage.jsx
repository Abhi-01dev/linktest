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
  AlertCircle
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

  // Proctoring & Modals
  const [warningCount, setWarningCount] = useState(0);
  const [activeWarningModal, setActiveWarningModal] = useState(null);
  const [submitConfirmOpen, setSubmitConfirmOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [cameraDocked, setCameraDocked] = useState(true);

  // References
  const timerIntervalRef = useRef(null);
  const lastSyncTimeRef = useRef(Date.now());
  const pendingSyncRef = useRef({});

  // ---------------------------------------------------------------------------
  // 1. WEBCAM PROCTORING INTEGRATION
  // ---------------------------------------------------------------------------

  const handleProctorEvent = useCallback(async (eventPayload) => {
    try {
      const res = await api.logMockTestProctoringEvent(attemptId, eventPayload);
      if (res && res.warning_count !== undefined) {
        setWarningCount(res.warning_count);
      }

      // Show non-accusatory warning modal
      if (eventPayload.event_type === 'TAB_HIDDEN' || eventPayload.event_type === 'WINDOW_BLURRED') {
        setActiveWarningModal({
          title: 'Exam Window Focus Notice',
          message: 'You navigated away from the examination window. Please stay on this tab to maintain exam session integrity.',
          type: 'warning'
        });
      } else if (eventPayload.event_type === 'FULLSCREEN_EXIT') {
        setActiveWarningModal({
          title: 'Fullscreen Mode Exited',
          message: 'Fullscreen was exited. Please re-enter fullscreen mode to continue.',
          type: 'warning'
        });
      } else if (eventPayload.event_type === 'MULTIPLE_FACES') {
        setActiveWarningModal({
          title: 'Multiple Faces Detected',
          message: 'Multiple faces were observed in your webcam preview. Ensure you are taking this examination alone.',
          type: 'warning'
        });
      }
    } catch (err) {
      console.warn('[Runner] Failed to log proctoring event:', err);
    }
  }, [attemptId]);

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
      try {
        setLoading(true);
        const data = await api.getMockTestAttempt(attemptId);
        setExamData(data);
        setRemainingSeconds(data.remaining_seconds || 0);
        setWarningCount(data.warning_count || 0);

        // Preload saved answers
        if (data.responses) {
          setResponses(data.responses);
        }

        // Start webcam if test requires proctoring
        if (data.proctoring_config?.webcam_required) {
          startCamera();
        }

        // Request fullscreen if required
        if (data.proctoring_config?.fullscreen_required) {
          try {
            if (!document.fullscreenElement) {
              await document.documentElement.requestFullscreen();
            }
          } catch (e) {
            console.warn('Fullscreen request bypassed:', e.message);
          }
        }
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
  // 4. BROWSER VISIBILITY & FULLSCREEN LISTENERS
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

    const handleFullscreenChange = () => {
      if (!document.fullscreenElement && examData.proctoring_config?.fullscreen_required) {
        handleProctorEvent({
          event_type: 'FULLSCREEN_EXIT',
          severity: 'warning',
          client_timestamp: new Date().toISOString()
        });
      }
    };

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [examData, handleProctorEvent]);

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

  const handleToggleMarkForReview = () => {
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

  const activeQuestion = examData.questions[currentIndex];
  const activeResponse = responses[activeQuestion?.id]?.response_data || null;
  const isMarked = Boolean(responses[activeQuestion?.id]?.is_marked_for_review);

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      background: '#F1F5F9',
      fontFamily: 'var(--font-body)'
    }}>
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
              {examData.subject} • Candidate: {user?.full_name}
            </div>
            <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#FFFFFF', letterSpacing: '-0.01em' }}>
              {examData.test_title}
            </div>
          </div>
        </div>

        {/* Center: Server-Authoritative Timer */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
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
        </div>

        {/* Right: Sync & Connection Status */}
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

          {/* Warnings Pill */}
          {examData.proctoring_config?.webcam_required && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.3rem',
              background: warningCount > 0 ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)',
              color: warningCount > 0 ? '#EF4444' : '#10B981',
              padding: '0.25rem 0.6rem',
              borderRadius: '999px',
              fontSize: '0.72rem',
              fontWeight: 700
            }}>
              <ShieldAlert size={13} />
              <span>Warnings: {warningCount}</span>
            </div>
          )}

          {/* Submit Action */}
          <button
            onClick={() => setSubmitConfirmOpen(true)}
            className="btn btn-primary"
            style={{
              padding: '0.4rem 1rem',
              fontSize: '0.84rem',
              fontWeight: 800,
              background: '#10B981',
              borderColor: '#10B981'
            }}
          >
            Submit Test
          </button>
        </div>
      </header>

      {/* ---------------------------------------------------------------------
          MAIN EXAMINATION WORKSPACE
      --------------------------------------------------------------------- */}
      <div style={{ display: 'flex', flex: 1, position: 'relative', overflow: 'hidden' }}>
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

                {/* 7. Subjective / Descriptive */}
                {activeQuestion.question_type === 'subjective' && (
                  <div>
                    <textarea
                      rows={6}
                      placeholder="Write your explanation or code solution here..."
                      value={activeResponse?.text || ''}
                      onChange={(e) => handleUpdateAnswer({ text: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '1rem',
                        fontSize: '0.95rem',
                        lineHeight: 1.6,
                        border: '2px solid #CBD5E1',
                        borderRadius: 'var(--radius-md)',
                        outline: 'none',
                        color: 'var(--color-navy)',
                        fontFamily: 'inherit'
                      }}
                    />
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.4rem', fontSize: '0.75rem', color: '#64748B' }}>
                      <span>Word count: {(activeResponse?.text || '').trim().split(/\s+/).filter(Boolean).length}</span>
                      <span>Evaluated manually by faculty</span>
                    </div>
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
