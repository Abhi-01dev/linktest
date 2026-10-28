// Secure Mock Test & Examination Runner Interface
// LinkTest Enterprise LMS

import React, { useState, useEffect, useRef, useCallback, Component } from 'react';
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

function getNormalizedOptions(options) {
  if (!options) return [];
  let parsed = options;
  if (typeof parsed === 'string') {
    try {
      parsed = JSON.parse(parsed);
    } catch {
      return [];
    }
  }
  if (Array.isArray(parsed)) {
    return parsed.map((opt, idx) => {
      if (opt === null || opt === undefined) {
        return { id: idx, key: String.fromCharCode(65 + idx), text: '' };
      }
      if (typeof opt === 'object') {
        const text = opt.text ?? opt.label ?? opt.value ?? opt.title ?? (typeof opt.toString === 'function' ? opt.toString() : '');
        const key = opt.key ?? opt.id ?? String.fromCharCode(65 + idx);
        return { id: opt.id ?? idx, key: String(key), text: String(text) };
      }
      return { id: idx, key: String.fromCharCode(65 + idx), text: String(opt) };
    });
  }
  if (typeof parsed === 'object') {
    return Object.entries(parsed).map(([k, val], idx) => {
      const text = typeof val === 'object' && val !== null ? (val.text ?? val.label ?? JSON.stringify(val)) : String(val);
      return { id: idx, key: k, text: String(text) };
    });
  }
  return [];
}

function getMatchingData(options) {
  if (!options) return { leftItems: [], targets: [] };
  let parsed = options;
  if (typeof parsed === 'string') {
    try { parsed = JSON.parse(parsed); } catch { return { leftItems: [], targets: [] }; }
  }
  let leftItems = [];
  let targets = [];
  if (parsed && typeof parsed === 'object') {
    if (Array.isArray(parsed.left_items)) {
      leftItems = parsed.left_items;
    } else if (Array.isArray(parsed)) {
      leftItems = parsed;
    }
    if (Array.isArray(parsed.available_targets)) {
      targets = parsed.available_targets;
    }
  }
  const normalizedLeft = leftItems.map((item, idx) => {
    if (item && typeof item === 'object') {
      return { id: item.id ?? String(idx), text: String(item.text ?? item.label ?? idx) };
    }
    return { id: String(idx), text: String(item) };
  });
  return { leftItems: normalizedLeft, targets };
}

// ---------------------------------------------------------------------------
// MODULE-LEVEL SECURITY VIOLATION HANDLER
// Extracted from the component to give the esbuild minifier its own isolated
// scope. When this lived inside a useCallback inside the 2500-line component,
// esbuild reused the component function's minified identifier for a local var
// inside the callback — causing "Cannot access 'R' before initialization" TDZ.
// ---------------------------------------------------------------------------
async function handleSecurityViolationImpl(eventTypeOrPayload, metadata, refs, setters, api, attemptId, DEBUG_PROCTOR) {
  const {
    isFinalizedRef,
    autoSubmittedStateRef,
    examDataRef,
    lastFullscreenExitRef,
    lastTabOrBlurTimeRef,
    lastFaceMissingTimeRef,
    lastMultiFaceTimeRef,
    lastCameraFailureTimeRef,
    securityWarningCountRef,
    fullscreenExitCountRef,
    responsesRef,
    stopCameraRef,
  } = refs;

  const {
    setSecurityWarningCount,
    setFullscreenExitCount,
    setWarningCount,
    setAutoSubmittedState,
    setActiveWarningModal,
  } = setters;

  let eventType = '';
  let meta = {};
  if (typeof eventTypeOrPayload === 'string') {
    eventType = eventTypeOrPayload.toUpperCase();
    meta = metadata || {};
  } else if (eventTypeOrPayload && typeof eventTypeOrPayload === 'object') {
    eventType = (eventTypeOrPayload.eventType || eventTypeOrPayload.event_type || '').toUpperCase();
    meta = { ...eventTypeOrPayload, ...metadata };
  }
  if (!eventType) return;

  // 1. Ignore violations after the attempt is finalized
  const attemptStatus = examDataRef.current?.status || examDataRef.current?.attempt?.status;
  if (
    isFinalizedRef.current ||
    autoSubmittedStateRef.current?.submitted ||
    ['submitted', 'evaluated', 'completed', 'AUTO_SUBMITTED', 'auto_submitted'].includes(attemptStatus)
  ) {
    if (DEBUG_PROCTOR) console.log(`[PROCTOR] Violation ${eventType} ignored because attempt is finalized.`);
    return;
  }

  const now = Date.now();

  // 2. Debounce duplicate events
  if (eventType === 'FULLSCREEN_EXIT') {
    if (now - lastFullscreenExitRef.current < 2000) {
      if (DEBUG_PROCTOR) console.log('[PROCTOR] Duplicate FULLSCREEN_EXIT debounced');
      return;
    }
    lastFullscreenExitRef.current = now;
  } else if (eventType === 'TAB_HIDDEN' || eventType === 'WINDOW_BLURRED') {
    if (now - lastTabOrBlurTimeRef.current < 2500) {
      if (DEBUG_PROCTOR) console.log(`[PROCTOR] Duplicate ${eventType} debounced`);
      return;
    }
    lastTabOrBlurTimeRef.current = now;
  } else if (eventType === 'FACE_NOT_DETECTED') {
    if (now - lastFaceMissingTimeRef.current < 4000) {
      if (DEBUG_PROCTOR) console.log('[PROCTOR] Duplicate FACE_NOT_DETECTED debounced');
      return;
    }
    lastFaceMissingTimeRef.current = now;
  } else if (eventType === 'MULTIPLE_FACES') {
    if (now - lastMultiFaceTimeRef.current < 4000) {
      if (DEBUG_PROCTOR) console.log('[PROCTOR] Duplicate MULTIPLE_FACES debounced');
      return;
    }
    lastMultiFaceTimeRef.current = now;
  } else if (eventType === 'CAMERA_DISCONNECTED' || eventType === 'CAMERA_PERMISSION_REVOKED') {
    if (now - lastCameraFailureTimeRef.current < 4000) {
      if (DEBUG_PROCTOR) console.log(`[PROCTOR] Duplicate ${eventType} debounced`);
      return;
    }
    lastCameraFailureTimeRef.current = now;
  }

  // 3. Increment the correct local counter & 4. Update visible UI
  if (eventType === 'FULLSCREEN_EXIT') {
    const isFsReq = Boolean(
      examDataRef.current?.proctoring_config?.fullscreen_required ??
      examDataRef.current?.test?.proctoring_config?.fullscreen_required
    );
    if (!isFsReq) {
      if (DEBUG_PROCTOR) console.log('[PROCTOR] FULLSCREEN_EXIT ignored because exam does not require fullscreen.');
      return;
    }

    const maxFullscreenExits =
      examDataRef.current?.max_fullscreen_exits ||
      examDataRef.current?.test?.proctoring_config?.max_fullscreen_exits ||
      examDataRef.current?.proctoring_config?.max_fullscreen_exits || 2;

    const nextExitCount = fullscreenExitCountRef.current + 1;
    fullscreenExitCountRef.current = nextExitCount;
    setFullscreenExitCount(nextExitCount);

    if (nextExitCount >= maxFullscreenExits) {
      isFinalizedRef.current = true;
      setAutoSubmittedState({
        submitted: true,
        reason: 'SECOND_FULLSCREEN_EXIT',
        message: 'Your test was automatically submitted because fullscreen mode was exited twice.',
      });
      stopCameraRef.current?.();
      setActiveWarningModal(null);
    } else {
      setActiveWarningModal({
        title: `Fullscreen exits: ${nextExitCount} / ${maxFullscreenExits}`,
        message:
          'You have exited full-screen mode. Please return to full screen immediately. A second exit will automatically submit your exam.',
        count: nextExitCount,
        type: 'warning',
      });
    }
  } else {
    const maxSecurityWarnings =
      examDataRef.current?.max_security_warnings ||
      examDataRef.current?.test?.proctoring_config?.max_security_warnings ||
      examDataRef.current?.proctoring_config?.max_security_warnings ||
      examDataRef.current?.test?.proctoring_config?.tab_switch_limit ||
      examDataRef.current?.proctoring_config?.tab_switch_limit || 3;

    const nextStrikeCount = securityWarningCountRef.current + 1;
    securityWarningCountRef.current = nextStrikeCount;
    setSecurityWarningCount(nextStrikeCount);
    setWarningCount(prev => prev + 1);

    if (nextStrikeCount >= maxSecurityWarnings) {
      isFinalizedRef.current = true;
      const finalReason =
        eventType === 'TAB_HIDDEN' || eventType === 'WINDOW_BLURRED'
          ? 'MAX_TAB_SWITCHES'
          : 'MAX_SECURITY_WARNINGS';
      setAutoSubmittedState({
        submitted: true,
        reason: finalReason,
        message:
          finalReason === 'MAX_TAB_SWITCHES'
            ? 'Your test was automatically submitted because maximum tab switches were detected.'
            : 'Your test was automatically submitted because the maximum number of security warnings was reached.',
      });
      stopCameraRef.current?.();
      setActiveWarningModal(null);
    } else {
      let warningMsg = 'Please follow the test rules and remain on the exam screen.';
      if (eventType === 'TAB_HIDDEN') {
        warningMsg = 'You navigated away from the examination tab. Please stay on this tab to maintain exam session integrity.';
      } else if (eventType === 'WINDOW_BLURRED') {
        warningMsg = 'Focus shifted away from the examination window. Please keep the test active and focused.';
      } else if (eventType === 'MULTIPLE_FACES') {
        warningMsg = 'Multiple faces were observed in your webcam preview. Ensure you are taking this examination alone.';
      } else if (eventType === 'FACE_NOT_DETECTED') {
        warningMsg = 'Your face was not detected in the camera view for over 5 seconds. Please adjust your camera or lighting.';
      } else if (eventType === 'CAMERA_DISCONNECTED') {
        warningMsg = 'Webcam disconnected. A functioning camera is required for this examination.';
      } else if (eventType === 'CAMERA_PERMISSION_REVOKED') {
        warningMsg = 'Camera permission was revoked. Please enable camera access in browser settings.';
      } else if (eventType === 'SUSPICIOUS_KEY_COMBINATION') {
        warningMsg = 'Prohibited keyboard shortcut or key combination was pressed.';
      }

      setActiveWarningModal({
        title: `Security warnings: ${nextStrikeCount} / ${maxSecurityWarnings}`,
        message: warningMsg,
        count: nextStrikeCount,
        type: 'warning',
      });
    }
  }

  // 5. Persist the event to backend
  try {
    if (DEBUG_PROCTOR) console.log('[PROCTOR] Persisting violation to server:', eventType, meta);
    const res = await api.logMockTestSecurityEvent(attemptId, {
      ...meta,
      eventType,
      event_type: eventType,
      client_timestamp: new Date().toISOString(),
      answers: responsesRef.current,
    });

    if (DEBUG_PROCTOR) console.log('[PROCTOR] Server authoritative response:', res);

    if (res) {
      if (res.security_warning_count !== undefined) {
        const sVal = Math.max(res.security_warning_count, securityWarningCountRef.current);
        setSecurityWarningCount(sVal);
        securityWarningCountRef.current = sVal;
      }
      if (res.fullscreen_exit_count !== undefined) {
        const fVal = Math.max(res.fullscreen_exit_count, fullscreenExitCountRef.current);
        setFullscreenExitCount(fVal);
        fullscreenExitCountRef.current = fVal;
      }
      if (res.warning_count !== undefined) {
        setWarningCount(prev => Math.max(prev, res.warning_count));
      }

      const maxFullscreenExits =
        examDataRef.current?.max_fullscreen_exits ||
        examDataRef.current?.test?.proctoring_config?.max_fullscreen_exits ||
        examDataRef.current?.proctoring_config?.max_fullscreen_exits || 2;

      const maxSecurityWarnings =
        examDataRef.current?.max_security_warnings ||
        examDataRef.current?.test?.proctoring_config?.max_security_warnings ||
        examDataRef.current?.proctoring_config?.max_security_warnings ||
        examDataRef.current?.test?.proctoring_config?.tab_switch_limit ||
        examDataRef.current?.proctoring_config?.tab_switch_limit || 3;

      const isServerAutoSubmitted = Boolean(
        res.auto_submitted ||
        res.autoSubmitted ||
        res.status === 'AUTO_SUBMITTED' ||
        (res.fullscreen_exit_count && res.fullscreen_exit_count >= maxFullscreenExits) ||
        (res.security_warning_count && res.security_warning_count >= maxSecurityWarnings)
      );

      if (isServerAutoSubmitted) {
        isFinalizedRef.current = true;
        const reasonCode =
          res.submission_reason ||
          res.submissionReason ||
          (eventType === 'FULLSCREEN_EXIT' ? 'SECOND_FULLSCREEN_EXIT' : 'MAX_SECURITY_WARNINGS');
        let msg =
          'Your test was automatically submitted because the maximum number of security violations was reached.';
        if (reasonCode === 'SECOND_FULLSCREEN_EXIT') {
          msg = 'Your test was automatically submitted because fullscreen mode was exited twice.';
        } else if (reasonCode === 'MAX_TAB_SWITCHES') {
          msg = 'Your test was automatically submitted because maximum tab switches were detected.';
        }
        setAutoSubmittedState({ submitted: true, reason: reasonCode, message: msg });
        stopCameraRef.current?.();
        setActiveWarningModal(null);
      }
    }
  } catch (err) {
    console.warn('[Runner] Failed to persist security violation to server:', err);
  }
}

/**
 * Robust Examination Error Boundary to guarantee the runner NEVER crashes into a white screen
 */
export class RunnerErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[RunnerErrorBoundary] Caught rendering error in MockTestRunnerPage:', error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          padding: '4rem 1rem',
          background: 'var(--color-bg-main, #F8FAFC)',
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <div style={{
            background: '#FFFFFF',
            border: '1px solid #EF4444',
            borderRadius: '16px',
            padding: '2.5rem',
            maxWidth: '560px',
            width: '100%',
            textAlign: 'center',
            boxShadow: '0 10px 30px -5px rgba(0, 0, 0, 0.1)'
          }}>
            <div style={{
              width: '60px',
              height: '60px',
              borderRadius: '50%',
              background: '#FEF2F2',
              color: '#DC2626',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.25rem'
            }}>
              <AlertCircle size={32} />
            </div>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--color-navy, #0F172A)', marginBottom: '0.5rem' }}>
              Unable to load the mock test.
            </h2>
            <p style={{ color: '#64748B', fontSize: '0.94rem', lineHeight: 1.5, marginBottom: '1.25rem' }}>
              We encountered an unexpected display issue while loading the examination. Please try again. Your answers and progress remain preserved.
            </p>
            {this.state.error?.message && (
              <div style={{
                background: '#F1F5F9',
                padding: '0.65rem 0.9rem',
                borderRadius: '8px',
                fontSize: '0.8rem',
                color: '#475569',
                fontFamily: 'monospace',
                marginBottom: '1.5rem',
                wordBreak: 'break-word'
              }}>
                {this.state.error.message}
              </div>
            )}
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button
                onClick={this.handleRetry}
                className="btn btn-primary"
                style={{ padding: '0.65rem 1.75rem', fontWeight: 700 }}
              >
                Retry
              </button>
              <a
                href="/mock-tests"
                className="btn btn-secondary"
                style={{ padding: '0.65rem 1.5rem', fontWeight: 600, textDecoration: 'none' }}
              >
                Return to Mock Tests
              </a>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

function MockTestRunnerView() {
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
  const wasFullscreenRef = useRef(Boolean(
    typeof document !== 'undefined' && (
      document.fullscreenElement ||
      document.webkitFullscreenElement ||
      document.mozFullScreenElement ||
      document.msFullscreenElement
    )
  ));
  const lastTabHiddenTimeRef = useRef(0);
  const lastBlurTimeRef = useRef(0);
  const blurTimeoutRef = useRef(null);
  const responsesRef = useRef({});
  const preventClipboardAction = (event) => event.preventDefault();

  // Proctoring Authoritative References to avoid closure drift
  const securityWarningCountRef = useRef(0);
  const fullscreenExitCountRef = useRef(0);
  const isFinalizedRef = useRef(false);
  const examDataRef = useRef(null);
  const lastTabOrBlurTimeRef = useRef(0);
  const lastFaceMissingTimeRef = useRef(0);
  const lastMultiFaceTimeRef = useRef(0);
  const lastCameraFailureTimeRef = useRef(0);

  // Camera & Submission Refs to eliminate closure and TDZ cycles
  const stopCameraRef = useRef(() => {});
  const startCameraRef = useRef(async () => {});
  const autoSubmittedStateRef = useRef(null);

  const DEBUG_PROCTOR = typeof window !== 'undefined' && (
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1' ||
    Boolean(window.DEBUG_PROCTOR)
  );

  // Request browser Fullscreen via user gesture
  const requestBrowserFullscreen = useCallback(async () => {
    try {
      const docEl = document.documentElement;
      if (docEl.requestFullscreen) {
        await docEl.requestFullscreen();
      } else if (docEl.webkitRequestFullscreen) {
        await docEl.webkitRequestFullscreen();
      } else if (docEl.mozRequestFullScreen) {
        await docEl.mozRequestFullScreen();
      } else if (docEl.msRequestFullscreen) {
        await docEl.msRequestFullscreen();
      }
      setIsFullscreenActive(true);
      wasFullscreenRef.current = true;
      if (DEBUG_PROCTOR) console.log('[PROCTOR] Fullscreen mode successfully entered');
    } catch (err) {
      console.warn('[Runner] Fullscreen request error:', err.message);
    }
  }, [DEBUG_PROCTOR]);

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

  const handleAutoSubmit = useCallback(async (reason) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      stopCameraRef.current?.();
      await api.submitMockTestAttempt(attemptId, {
        auto_submitted: true,
        reason: reason || 'Time expired'
      });
      navigate(`/mock-tests/attempts/${attemptId}/result`);
    } catch (err) {
      console.error('Auto-submission error:', err);
      navigate(`/mock-tests/attempts/${attemptId}/result`);
    }
  }, [attemptId, isSubmitting, navigate]);

  const handleManualSubmit = useCallback(async () => {
    setIsSubmitting(true);
    try {
      stopCameraRef.current?.();
      await api.submitMockTestAttempt(attemptId, {
        auto_submitted: false
      });
      navigate(`/mock-tests/attempts/${attemptId}/result`);
    } catch (err) {
      alert(err.message || 'Submission failed. Please verify connection.');
      setIsSubmitting(false);
    }
  }, [attemptId, navigate]);

  // ---------------------------------------------------------------------------
  // 1. CENTRALIZED SECURITY VIOLATION PIPELINE (Requirement 2)
  // All proctoring violations flow through this single authoritative handler:
  // - FULLSCREEN_EXIT
  // - TAB_HIDDEN
  // - WINDOW_BLURRED
  // - FACE_NOT_DETECTED
  // - MULTIPLE_FACES
  // - CAMERA_DISCONNECTED
  // - CAMERA_PERMISSION_REVOKED
  // - SUSPICIOUS_KEY_COMBINATION
  // ---------------------------------------------------------------------------

  // Thin wrapper — all logic lives in module-level handleSecurityViolationImpl
  // to give esbuild a separate minification scope and prevent the TDZ name
  // collision that produced "Cannot access 'R' before initialization".
  const handleSecurityViolation = useCallback(async (eventTypeOrPayload, metadata = {}) => {
    return handleSecurityViolationImpl(
      eventTypeOrPayload,
      metadata,
      {
        isFinalizedRef,
        autoSubmittedStateRef,
        examDataRef,
        lastFullscreenExitRef,
        lastTabOrBlurTimeRef,
        lastFaceMissingTimeRef,
        lastMultiFaceTimeRef,
        lastCameraFailureTimeRef,
        securityWarningCountRef,
        fullscreenExitCountRef,
        responsesRef,
        stopCameraRef,
      },
      {
        setSecurityWarningCount,
        setFullscreenExitCount,
        setWarningCount,
        setAutoSubmittedState,
        setActiveWarningModal,
      },
      api,
      attemptId,
      DEBUG_PROCTOR
    );
  }, [attemptId, DEBUG_PROCTOR]);

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
    onViolation: handleSecurityViolation,
    onEvent: handleSecurityViolation
  });

  // Synchronize state and camera controls to stable ref container
  useEffect(() => {
    responsesRef.current = responses;
  }, [responses]);

  useEffect(() => {
    examDataRef.current = examData;
  }, [examData]);

  useEffect(() => {
    autoSubmittedStateRef.current = autoSubmittedState;
    if (autoSubmittedState?.submitted) {
      isFinalizedRef.current = true;
    }
  }, [autoSubmittedState]);

  useEffect(() => {
    stopCameraRef.current = stopCamera;
    startCameraRef.current = startCamera;
  }, [stopCamera, startCamera]);

  // ---------------------------------------------------------------------------
  // 2. LOAD EXAM DATA & ATTEMPT
  // ---------------------------------------------------------------------------

  const loadAttempt = useCallback(async () => {
    if (!attemptId || attemptId === 'undefined' || attemptId === 'null' || !String(attemptId).trim()) {
      setInitError('Invalid examination attempt ID specified. Please return to the mock test catalog.');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setInitError(null);
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

      if (attemptStatus === 'submitted' || attemptStatus === 'evaluated' || attemptStatus === 'completed' || attemptStatus === 'expired') {
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
      const initialWarn = data.warning_count ?? data.warningCount ?? data.attempt?.warning_count ?? 0;
      const initialSec = data.security_warning_count ?? data.attempt?.security_warning_count ?? 0;
      const initialFs = data.fullscreen_exit_count ?? data.attempt?.fullscreen_exit_count ?? 0;
      setWarningCount(initialWarn);
      setSecurityWarningCount(initialSec);
      securityWarningCountRef.current = initialSec;
      setFullscreenExitCount(initialFs);
      fullscreenExitCountRef.current = initialFs;

      // Preload saved answers
      if (data.responses) {
        setResponses(data.responses);
      }

      const proctorConfig = data.proctoring_config || data.proctoringConfig || data.test?.proctoring_config;
      // Start webcam if test requires proctoring
      if (proctorConfig?.webcam_required) {
        startCameraRef.current?.();
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
  }, [attemptId]);

  useEffect(() => {
    loadAttempt();
    return () => {
      stopCameraRef.current?.();
    };
  }, [loadAttempt]);

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
      const isHidden = Boolean(document.hidden || document.visibilityState === 'hidden');
      if (isHidden) {
        if (DEBUG_PROCTOR) console.log('[PROCTOR] visibility: hidden -> triggering TAB_HIDDEN violation');
        if (blurTimeoutRef.current) {
          clearTimeout(blurTimeoutRef.current);
          blurTimeoutRef.current = null;
        }
        handleSecurityViolation('TAB_HIDDEN');
      } else {
        if (DEBUG_PROCTOR) console.log('[PROCTOR] visibility: visible (no strike recorded)');
      }
    };

    const handleWindowBlur = () => {
      if (DEBUG_PROCTOR) console.log('[PROCTOR] window blur event triggered');

      // If a tab switch was already recorded recently, suppress blur to prevent double counting
      if (Date.now() - lastTabOrBlurTimeRef.current < 2500) {
        if (DEBUG_PROCTOR) console.log('[PROCTOR] blur suppressed (correlated with recent TAB_HIDDEN)');
        return;
      }

      if (blurTimeoutRef.current) {
        clearTimeout(blurTimeoutRef.current);
      }
      blurTimeoutRef.current = setTimeout(() => {
        blurTimeoutRef.current = null;
        if (document.hidden || document.visibilityState === 'hidden') {
          if (DEBUG_PROCTOR) console.log('[PROCTOR] blur ignored because tab is hidden');
          return;
        }
        handleSecurityViolation('WINDOW_BLURRED');
      }, 120);
    };

    const handleWindowFocus = () => {
      if (DEBUG_PROCTOR) console.log('[PROCTOR] window focus (no strike recorded)');
    };

    const handleFullscreenChange = () => {
      const isNowFullscreen = Boolean(
        document.fullscreenElement ||
        document.webkitFullscreenElement ||
        document.mozFullScreenElement ||
        document.msFullscreenElement
      );
      setIsFullscreenActive(isNowFullscreen);

      if (DEBUG_PROCTOR) {
        console.log(`[PROCTOR] fullscreenchange | active: ${isNowFullscreen}`);
      }

      if (isNowFullscreen) {
        wasFullscreenRef.current = true;
        return;
      }

      if (wasFullscreenRef.current && !isNowFullscreen) {
        wasFullscreenRef.current = false;
        handleSecurityViolation('FULLSCREEN_EXIT');
      }
    };

    const handleKeyDown = (e) => {
      if (
        e.key === 'F12' ||
        (e.ctrlKey && e.shiftKey && ['I', 'J', 'C'].includes((e.key || '').toUpperCase())) ||
        (e.ctrlKey && (e.key || '').toUpperCase() === 'U')
      ) {
        e.preventDefault();
        handleSecurityViolation('SUSPICIOUS_KEY_COMBINATION', { key: e.key });
      }
    };

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);
    window.addEventListener('focus', handleWindowFocus);
    window.addEventListener('keydown', handleKeyDown);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      if (blurTimeoutRef.current) {
        clearTimeout(blurTimeoutRef.current);
        blurTimeoutRef.current = null;
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
      window.removeEventListener('focus', handleWindowFocus);
      window.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [examData, handleSecurityViolation, DEBUG_PROCTOR]);

  // ---------------------------------------------------------------------------
  // 5. QUESTION RESPONSE & INTERACTION HANDLERS
  // ---------------------------------------------------------------------------

  const questions = Array.isArray(examData?.questions)
    ? examData.questions
    : (Array.isArray(examData?.test?.questions) ? examData.test.questions : []);

  const isExamFullscreenRequired = Boolean(
    examData?.proctoring_config?.fullscreen_required ??
    examData?.test?.proctoring_config?.fullscreen_required
  );

  const handleUpdateAnswer = (responseData) => {
    if ((isExamFullscreenRequired && !isFullscreenActive) || autoSubmittedState?.submitted) return;
    const activeQuestion = questions[currentIndex];
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
    if ((isExamFullscreenRequired && !isFullscreenActive) || autoSubmittedState?.submitted) return;
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
    if ((isExamFullscreenRequired && !isFullscreenActive) || autoSubmittedState?.submitted) return;
    const activeQuestion = questions[currentIndex];
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
    if ((isExamFullscreenRequired && !isFullscreenActive) || autoSubmittedState?.submitted) return;
    const activeQuestion = questions[currentIndex];
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
    if ((isExamFullscreenRequired && !isFullscreenActive) || autoSubmittedState?.submitted) return;
    if (index >= 0 && index < questions.length) {
      const targetQuestion = questions[index];
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
  // 6. DERIVED STATE & METRIC HELPERS
  // ---------------------------------------------------------------------------

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
  const totalQuestions = questions.length;
  let answeredCount = 0;
  let markedCount = 0;
  let unansweredCount = 0;
  let notVisitedCount = 0;

  questions.forEach(q => {
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
        <p style={{ color: 'var(--color-navy)', fontWeight: 600 }}>Loading mock test...</p>
      </div>
    );
  }

  if (initError || !examData) {
    return (
      <div className="container" style={{ padding: '4rem 1rem', maxWidth: '600px' }}>
        <div style={{
          background: '#FFFFFF',
          border: '1px solid #EF4444',
          borderRadius: '16px',
          padding: '2.5rem',
          textAlign: 'center',
          boxShadow: '0 4px 12px rgba(0,0,0,0.06)'
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
          <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-navy, #0F172A)', marginBottom: '0.5rem' }}>
            Unable to load the mock test.
          </h3>
          <p style={{ color: '#64748B', fontSize: '0.92rem', lineHeight: 1.5, marginBottom: '1.5rem' }}>
            {initError || 'Please try again.'}
          </p>
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={loadAttempt}
              className="btn btn-primary"
              style={{ padding: '0.6rem 1.5rem', fontWeight: 700 }}
            >
              Retry
            </button>
            <button
              onClick={() => navigate('/mock-tests')}
              className="btn btn-secondary"
              style={{ padding: '0.6rem 1.25rem', fontWeight: 600 }}
            >
              Return to Mock Tests
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (examData && !Array.isArray(examData.questions) && !Array.isArray(examData.test?.questions)) {
    return (
      <div style={{ textAlign: 'center', padding: '6rem 1rem' }}>
        <div className="spinner" style={{ margin: '0 auto 1rem' }}></div>
        <p style={{ color: 'var(--color-navy)', fontWeight: 600 }}>Loading questions...</p>
      </div>
    );
  }

  const maxFullscreenExits = examData?.max_fullscreen_exits ||
    examData?.test?.proctoring_config?.max_fullscreen_exits ||
    examData?.proctoring_config?.max_fullscreen_exits || 2;

  const maxSecurityWarnings = examData?.max_security_warnings ||
    examData?.test?.proctoring_config?.max_security_warnings ||
    examData?.proctoring_config?.max_security_warnings ||
    examData?.test?.proctoring_config?.tab_switch_limit ||
    examData?.proctoring_config?.tab_switch_limit || 3;

  const attemptStatus = examData?.status || examData?.attempt?.status;
  const isAutoSubmitted = attemptStatus === 'AUTO_SUBMITTED' || attemptStatus === 'auto_submitted' || Boolean(autoSubmittedState?.submitted);
  const isCompleted = isAutoSubmitted || attemptStatus === 'submitted' || attemptStatus === 'evaluated' || attemptStatus === 'completed';
  const isExpired = attemptStatus === 'expired';

  if (isExpired) {
    return (
      <div className="container" style={{ padding: '4rem 1rem', maxWidth: '640px' }}>
        <div style={{
          background: '#FFFFFF',
          border: '1px solid #F59E0B',
          padding: '2.5rem',
          borderRadius: '16px',
          textAlign: 'center',
          boxShadow: '0 4px 12px rgba(0,0,0,0.06)'
        }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            background: '#FFFBEB',
            color: '#D97706',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1.25rem'
          }}>
            <Clock size={36} />
          </div>
          <h2 style={{ fontSize: '1.45rem', fontWeight: 800, marginBottom: '0.5rem', color: 'var(--color-navy, #0F172A)' }}>
            Examination Time Expired
          </h2>
          <p style={{ color: '#64748B', marginBottom: '1.5rem', lineHeight: 1.6, fontSize: '0.98rem' }}>
            The allocated duration for this examination has ended. Further responses cannot be recorded.
          </p>
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

  if (isCompleted) {
    const subReason = autoSubmittedState?.reason || examData?.submission_reason || examData?.attempt?.submission_reason;
    const isFullscreenExitAuto = subReason === 'SECOND_FULLSCREEN_EXIT' || autoSubmittedState?.reason === 'SECOND_FULLSCREEN_EXIT';
    const isMaxWarningsAuto = subReason === 'MAX_SECURITY_WARNINGS' || autoSubmittedState?.reason === 'MAX_SECURITY_WARNINGS' || subReason === 'MAX_TAB_SWITCHES' || autoSubmittedState?.reason === 'MAX_TAB_SWITCHES';

    let autoSubmitReasonTitle = 'Examination Automatically Submitted';
    let autoSubmitReasonDesc = 'Your test has been automatically submitted due to security policy violations.';
    if (isFullscreenExitAuto) {
      autoSubmitReasonTitle = 'Test Automatically Submitted';
      autoSubmitReasonDesc = `Your test has been automatically submitted because you exited full-screen mode ${maxFullscreenExits} times.`;
    } else if (isMaxWarningsAuto) {
      autoSubmitReasonTitle = 'Examination Disqualified';
      autoSubmitReasonDesc = subReason === 'MAX_TAB_SWITCHES' || autoSubmittedState?.reason === 'MAX_TAB_SWITCHES'
        ? 'Your examination was automatically submitted after maximum tab switches were detected.'
        : 'Your examination was automatically submitted after security warning limits were exceeded.';
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
                Security Strikes: {securityWarningCount}/{maxSecurityWarnings} • Fullscreen Exits: {fullscreenExitCount}/{maxFullscreenExits}
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

  const safeCurrentIndex = (questions.length > 0 && (currentIndex < 0 || currentIndex >= questions.length)) ? 0 : currentIndex;
  const activeQuestion = questions[safeCurrentIndex] || null;
  const activeResponse = activeQuestion ? (responses[activeQuestion.id]?.response_data || null) : null;
  const isMarked = activeQuestion ? Boolean(responses[activeQuestion.id]?.is_marked_for_review) : false;

  return (
    <div style={{
      height: '100vh',
      maxHeight: '100vh',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      background: '#F1F5F9',
      fontFamily: 'var(--font-body)',
      position: 'relative'
    }}>
      <style>{`
        .mock-runner-workspace {
          display: flex;
          flex-direction: row;
          flex: 1;
          position: relative;
          overflow: hidden;
        }
        .mock-runner-main {
          flex: 1;
          padding: 1.75rem 2rem 4rem;
          overflow-y: auto;
          min-width: 0;
          width: 100%;
          -webkit-overflow-scrolling: touch;
        }
        .mock-runner-aside {
          width: 320px;
          flex-shrink: 0;
          background: #FFFFFF;
          border-left: 1px solid var(--color-border);
          display: flex;
          flex-direction: column;
          height: 100%;
          overflow-y: auto;
          -webkit-overflow-scrolling: touch;
        }
        @media (max-width: 900px) {
          .mock-runner-workspace {
            flex-direction: column !important;
            overflow-y: auto !important;
          }
          .mock-runner-main {
            padding: 1rem 1rem 2rem !important;
            overflow-y: visible !important;
            flex: none !important;
          }
          .mock-runner-aside {
            width: 100% !important;
            height: auto !important;
            border-left: none !important;
            border-top: 2px solid var(--color-border) !important;
            overflow-y: visible !important;
            flex: none !important;
          }
        }
      `}</style>
      {/* ---------------------------------------------------------------------
          BLOCKING FULL-SCREEN OVERLAY (REQUIREMENTS 2, 3, 10, 11)
      --------------------------------------------------------------------- */}
      {isExamFullscreenRequired && !isFullscreenActive && !isCompleted && (
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
                Fullscreen exited: {fullscreenExitCount} / {maxFullscreenExits}
                <div style={{ fontSize: '0.78rem', fontWeight: 500, marginTop: '0.25rem', color: '#FECACA' }}>
                  A subsequent exit reaching {maxFullscreenExits} will automatically submit the test.
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
        flexShrink: 0,
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
              <span>Security warnings: {securityWarningCount} / {maxSecurityWarnings}</span>
            </div>

            {/* Fullscreen Exits (only if required by test) */}
            {isExamFullscreenRequired && (
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
                <span>Fullscreen exits: {fullscreenExitCount} / {maxFullscreenExits}</span>
              </div>
            )}
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
            disabled={(isExamFullscreenRequired && !isFullscreenActive) || isCompleted}
            className="btn btn-primary"
            style={{
              padding: '0.4rem 1rem',
              fontSize: '0.84rem',
              fontWeight: 800,
              background: '#10B981',
              borderColor: '#10B981',
              opacity: (isExamFullscreenRequired && !isFullscreenActive) || isCompleted ? 0.6 : 1,
              cursor: (isExamFullscreenRequired && !isFullscreenActive) || isCompleted ? 'not-allowed' : 'pointer'
            }}
          >
            Submit Test
          </button>
        </div>
      </header>

      {/* ---------------------------------------------------------------------
          MAIN EXAMINATION WORKSPACE
      --------------------------------------------------------------------- */}
      <div className="mock-runner-workspace" style={{
        display: 'flex',
        flex: 1,
        position: 'relative',
        overflow: 'hidden',
        pointerEvents: ((isExamFullscreenRequired && !isFullscreenActive) || isCompleted) ? 'none' : 'auto',
        filter: (isExamFullscreenRequired && !isFullscreenActive && !isCompleted) ? 'blur(1px)' : 'none',
        userSelect: ((isExamFullscreenRequired && !isFullscreenActive) || isCompleted) ? 'none' : 'auto'
      }}>
        {/* Left / Center: Question Paper Pane */}
        <main className="mock-runner-main" style={{
          flex: 1,
          padding: '1.75rem 2rem 4rem',
          overflowY: 'auto',
          minWidth: 0,
          width: '100%'
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
                    {(activeQuestion.question_type || 'mcq_single').replace('_', ' ')}
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.82rem' }}>
                  <span style={{ color: '#059669', fontWeight: 700 }}>
                    +{activeQuestion.marks ?? 0} Marks
                  </span>
                  {Number(activeQuestion.negative_marks) > 0 && (
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
                  borderLeft: '4px solid var(--color-orange)',
                  userSelect: 'none'
                }}
                  onContextMenu={preventClipboardAction}
                  onCopy={preventClipboardAction}
                  onCut={preventClipboardAction}
                  onPaste={preventClipboardAction}
                >
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
                marginBottom: '1.75rem',
                userSelect: 'none'
              }}
                onContextMenu={preventClipboardAction}
                onCopy={preventClipboardAction}
                onCut={preventClipboardAction}
                onPaste={preventClipboardAction}
              >
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
                    {getNormalizedOptions(activeQuestion.options).map((opt, optIdx) => {
                      const isSelected =
                        activeResponse?.selected_index === optIdx ||
                        activeResponse?.selected_key === opt.key ||
                        activeResponse?.selected_option_index === optIdx ||
                        activeResponse?.selected === opt.key ||
                        activeResponse?.text === opt.text ||
                        activeResponse === opt.key ||
                        activeResponse === optIdx;

                      return (
                        <div
                          key={optIdx}
                          id={`mcq-option-${optIdx}`}
                          onClick={() => handleUpdateAnswer({
                            selected_index: optIdx,
                            selected_key: opt.key,
                            selected_option_index: optIdx,
                            text: opt.text
                          })}
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
                            width: '24px',
                            height: '24px',
                            borderRadius: '50%',
                            border: `2px solid ${isSelected ? 'var(--color-orange)' : '#94A3B8'}`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: '#FFFFFF',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            color: isSelected ? 'var(--color-orange)' : '#64748B',
                            flexShrink: 0
                          }}>
                            {isSelected ? (
                              <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--color-orange)' }} />
                            ) : (
                              opt.key
                            )}
                          </div>
                          <span style={{ fontSize: '0.92rem', color: 'var(--color-text-primary)', fontWeight: isSelected ? 600 : 400, flex: 1, wordBreak: 'break-word' }}>
                            {opt.text}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* 2. Multiple-Select MCQ */}
                {activeQuestion.question_type === 'mcq_multiple' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {getNormalizedOptions(activeQuestion.options).map((opt, optIdx) => {
                      const selectedIndices = activeResponse?.selected_indices || [];
                      const selectedKeys = activeResponse?.selected_keys || [];
                      const isSelected = selectedIndices.includes(optIdx) || selectedKeys.includes(opt.key);

                      const toggleOption = () => {
                        const nextIndices = isSelected
                          ? selectedIndices.filter(i => i !== optIdx)
                          : [...selectedIndices, optIdx];
                        const nextKeys = isSelected
                          ? selectedKeys.filter(k => k !== opt.key)
                          : [...selectedKeys, opt.key];
                        handleUpdateAnswer({ selected_indices: nextIndices, selected_keys: nextKeys });
                      };

                      return (
                        <div
                          key={optIdx}
                          id={`mcq-multi-option-${optIdx}`}
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
                            width: '22px',
                            height: '22px',
                            borderRadius: '4px',
                            border: `2px solid ${isSelected ? '#2563EB' : '#94A3B8'}`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: isSelected ? '#2563EB' : '#FFFFFF',
                            color: '#FFFFFF',
                            flexShrink: 0
                          }}>
                            {isSelected ? <Check size={14} /> : (
                              <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#64748B' }}>{opt.key}</span>
                            )}
                          </div>
                          <span style={{ fontSize: '0.92rem', color: 'var(--color-text-primary)', fontWeight: isSelected ? 600 : 400, flex: 1, wordBreak: 'break-word' }}>
                            {opt.text}
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
                      const isSelected = activeResponse?.selected_value === val || activeResponse?.selected_bool === val || activeResponse === val;
                      return (
                        <button
                          key={String(val)}
                          type="button"
                          onClick={() => handleUpdateAnswer({ selected_value: val, selected_bool: val })}
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
                {activeQuestion.question_type === 'matching' && (() => {
                  const { leftItems, targets } = getMatchingData(activeQuestion.options);
                  return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      <div style={{ fontSize: '0.82rem', color: '#64748B' }}>
                        Select the matching value for each item below:
                      </div>
                      {leftItems.map((leftItem) => {
                        const currentMatch = activeResponse?.pairs?.[leftItem.id] || '';

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
                              {targets.length === 0 ? (
                                <option value="" disabled>No options</option>
                              ) : (
                                <>
                                  <option value="">-- Select Match --</option>
                                  {targets.map((t, tIdx) => (
                                    <option key={tIdx} value={t}>{t}</option>
                                  ))}
                                </>
                              )}
                            </select>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}

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

                {/* 9. Fallback for Custom or Unsupported Question Types (Requirement 13) */}
                {!['mcq_single', 'case_study', 'mcq_multiple', 'true_false', 'fill_blank', 'short_answer', 'numerical', 'matching', 'long_answer', 'subjective', 'coding'].includes(activeQuestion.question_type) && (
                  <div>
                    <div style={{ marginBottom: '0.5rem', fontSize: '0.85rem', color: '#64748B' }}>
                      Provide your response below:
                    </div>
                    <textarea
                      rows={5}
                      placeholder="Type your response here..."
                      value={activeResponse?.text || (typeof activeResponse === 'string' ? activeResponse : '')}
                      onChange={(e) => handleUpdateAnswer({ text: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '0.85rem 1rem',
                        fontSize: '0.95rem',
                        border: '2px solid #CBD5E1',
                        borderRadius: 'var(--radius-md)',
                        outline: 'none',
                        fontFamily: 'inherit'
                      }}
                    />
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
            <div style={{
              background: '#FFFFFF',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--color-border)',
              boxShadow: 'var(--shadow-sm)',
              padding: '3rem 2rem',
              textAlign: 'center',
              maxWidth: '500px',
              margin: '2rem auto'
            }}>
              <div style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                background: '#F1F5F9',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1.25rem',
                color: '#64748B'
              }}>
                <FileText size={28} />
              </div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--color-navy)', marginBottom: '0.5rem' }}>
                No Questions Available
              </h3>
              <p style={{ color: '#64748B', fontSize: '0.9rem', lineHeight: 1.5, marginBottom: '1.5rem' }}>
                This mock test currently does not contain any questions. Please check back later or contact your instructor.
              </p>
              <button
                onClick={() => navigate('/mock-tests')}
                className="btn btn-secondary"
                style={{ fontWeight: 600 }}
              >
                Return to Mock Tests
              </button>
            </div>
          )}
        </main>

        {/* -------------------------------------------------------------------
            RIGHT PALETTE SIDEBAR
        ------------------------------------------------------------------- */}
        <aside className="mock-runner-aside" style={{
          width: '320px',
          flexShrink: 0,
          background: '#FFFFFF',
          borderLeft: '1px solid var(--color-border)',
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
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
          <div style={{ padding: '1.25rem', flex: 1 }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(5, 1fr)',
              gap: '0.6rem'
            }}>
              {questions.map((q, idx) => {
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

export function MockTestRunnerPage() {
  return (
    <RunnerErrorBoundary>
      <MockTestRunnerView />
    </RunnerErrorBoundary>
  );
}

export default MockTestRunnerPage;
