// Pre-Exam Verification & Device Diagnostics Page
// LinkTest Secure Examination System

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useWebcamProctor } from '../../hooks/useWebcamProctor';
import {
  ShieldCheck,
  Camera,
  Maximize2,
  Wifi,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Play,
  ArrowLeft,
  Lock,
  UserCheck
} from 'lucide-react';

export function MockTestPreCheckPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [test, setTest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [initError, setInitError] = useState(null);
  const [joinStatus, setJoinStatus] = useState(null); // 'NONE', 'PENDING', 'APPROVED', 'REJECTED'
  const [rejectionReason, setRejectionReason] = useState(null);
  const [requestingJoin, setRequestingJoin] = useState(false);

  // Verification Checklist State
  const [cameraChecked, setCameraChecked] = useState(false);
  const [fullscreenTested, setFullscreenTested] = useState(false);
  const [networkChecked, setNetworkChecked] = useState(false);
  const [rulesAgreed, setRulesAgreed] = useState(false);
  const [starting, setStarting] = useState(false);

  // Proctor Hook
  const {
    videoRef,
    startCamera,
    stopCamera,
    hasPermission,
    isStreaming,
    error: cameraError,
    detectionState,
    faceCount
  } = useWebcamProctor({
    enabled: true,
    faceDetectionEnabled: true
  });

  // Load test details & join status
  const checkJoinStatus = async () => {
    try {
      const statusRes = await api.getMockTestJoinStatus(id);
      setJoinStatus(statusRes?.status || 'NONE');
      setRejectionReason(statusRes?.rejection_reason || null);
      return statusRes?.status;
    } catch (e) {
      // If error or unauthenticated, default to NONE
      setJoinStatus('NONE');
      return 'NONE';
    }
  };

  useEffect(() => {
    async function fetchTest() {
      try {
        const [testData] = await Promise.all([
          api.getMockTestById(id),
          checkJoinStatus()
        ]);
        setTest(testData);
        // Quick network ping check
        const health = await api.request('/health');
        if (health) setNetworkChecked(true);
      } catch (err) {
        setInitError(err.message || 'Failed to load examination.');
      } finally {
        setLoading(false);
      }
    }
    fetchTest();
  }, [id]);

  // Polling for approval if status is PENDING
  useEffect(() => {
    if (joinStatus !== 'PENDING') return;

    const interval = setInterval(async () => {
      const status = await checkJoinStatus();
      if (status === 'APPROVED') {
        clearInterval(interval);
      }
    }, 4000);

    return () => clearInterval(interval);
  }, [joinStatus, id]);

  const handleRequestJoin = async () => {
    try {
      setRequestingJoin(true);
      await api.requestMockTestJoin(id);
      setJoinStatus('PENDING');
      setRejectionReason(null);
    } catch (err) {
      alert(err.message || 'Failed to submit join request.');
    } finally {
      setRequestingJoin(false);
    }
  };

  // Trigger camera start
  const handleStartCameraCheck = async () => {
    await startCamera();
    setCameraChecked(true);
  };

  // Fullscreen trigger test
  const handleFullscreenTest = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
        setFullscreenTested(true);
      } else {
        await document.exitFullscreen();
        setFullscreenTested(true);
      }
    } catch (e) {
      console.warn('Fullscreen request rejected or not supported:', e.message);
      setFullscreenTested(true);
    }
  };

  // Start exam attempt on backend
  const handleLaunchExam = async () => {
    setStarting(true);
    try {
      const data = await api.startMockTestAttempt(id);
      const attemptId = data?.attempt_id || data?.attemptId || data?.attempt?.id || data?.id;
      if (!attemptId || attemptId === 'undefined' || attemptId === 'null' || !String(attemptId).trim()) {
        throw new Error('Examination session initialization did not return a valid attempt ID.');
      }
      // Clean up local camera before routing to runner
      stopCamera();
      navigate(`/mock-tests/${id}/runner/${attemptId}`);
    } catch (err) {
      console.error('Failed to launch exam:', err);
      if (err.code === 'MOCK_TEST_APPROVAL_REQUIRED' || err.status === 403) {
        setJoinStatus('PENDING');
        alert(err.message || 'Teacher approval is required before you can join this mock test.');
      } else {
        alert(err.message || 'Could not initialize examination attempt.');
      }
      setStarting(false);
    }
  };

  const isProctored = test?.proctoring_config?.webcam_required;
  const isFullscreenRequired = test?.proctoring_config?.fullscreen_required;

  const canLaunch =
    rulesAgreed &&
    (!isProctored || hasPermission) &&
    (!isFullscreenRequired || fullscreenTested) &&
    networkChecked;

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '5rem 1rem' }}>
        <div className="spinner" style={{ margin: '0 auto 1rem' }}></div>
        <p>Loading examination specifications...</p>
      </div>
    );
  }

  if (initError || !test) {
    return (
      <div className="container" style={{ padding: '4rem 1rem', maxWidth: '600px' }}>
        <div style={{
          background: 'var(--color-danger-bg)',
          border: '1px solid var(--color-danger)',
          color: 'var(--color-danger)',
          padding: '1.5rem',
          borderRadius: 'var(--radius-md)',
          textAlign: 'center'
        }}>
          <h3>Cannot Start Examination</h3>
          <p>{initError || 'Examination details unavailable.'}</p>
          <Link to="/mock-tests" className="btn btn-secondary" style={{ marginTop: '1rem' }}>
            Back to Mock Tests
          </Link>
        </div>
      </div>
    );
  }

  // If user is a student and approval is not granted, block pre-check screen
  if (user?.role === 'STUDENT' && joinStatus !== 'APPROVED') {
    return (
      <div className="container" style={{ padding: '4rem 1rem', maxWidth: '620px' }}>
        <div style={{
          background: '#FFFFFF',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--color-border)',
          padding: '2.5rem',
          boxShadow: 'var(--shadow-md)',
          textAlign: 'center'
        }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            background: joinStatus === 'PENDING' ? '#FEF3C7' : joinStatus === 'REJECTED' ? '#FEE2E2' : '#EFF6FF',
            color: joinStatus === 'PENDING' ? '#D97706' : joinStatus === 'REJECTED' ? '#DC2626' : '#2563EB',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1.25rem'
          }}>
            <ShieldCheck size={32} />
          </div>

          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-navy)', marginBottom: '0.75rem' }}>
            {joinStatus === 'PENDING'
              ? 'Teacher Approval Pending'
              : joinStatus === 'REJECTED'
              ? 'Join Request Declined'
              : 'Teacher Approval Required'}
          </h2>

          <p style={{ color: '#64748B', fontSize: '0.95rem', lineHeight: 1.6, marginBottom: '1.5rem' }}>
            {joinStatus === 'PENDING'
              ? 'Your request to join this examination has been sent to your instructor. As soon as the teacher approves your request, you can enter the test environment.'
              : joinStatus === 'REJECTED'
              ? (rejectionReason ? `Your request was declined: "${rejectionReason}"` : 'Your request was declined by the instructor. You may submit a new request if permitted.')
              : 'Institutional policy requires your teacher or proctor to approve your admission before you can begin this examination.'}
          </p>

          {joinStatus === 'PENDING' ? (
            <div style={{
              background: '#FFFBEB',
              border: '1px solid #FCD34D',
              borderRadius: '8px',
              padding: '0.85rem 1rem',
              color: '#92400E',
              fontSize: '0.86rem',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              marginBottom: '1.75rem'
            }}>
              <span className="spinner-border spinner-border-sm" style={{ width: '1rem', height: '1rem', borderWidth: '2px' }} />
              <span>Checking approval status in real time...</span>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', marginBottom: '1.75rem' }}>
              <button
                onClick={handleRequestJoin}
                disabled={requestingJoin}
                className="btn btn-primary"
                style={{ padding: '0.6rem 1.4rem', fontWeight: 700 }}
              >
                {requestingJoin
                  ? 'Submitting...'
                  : joinStatus === 'REJECTED'
                  ? 'Request Again'
                  : 'Request to Join'}
              </button>
            </div>
          )}

          <div>
            <Link to="/mock-tests" className="btn btn-secondary btn-sm">
              <ArrowLeft size={14} style={{ marginRight: '0.35rem' }} />
              Back to Mock Test Hub
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '2.5rem 0 5rem', background: 'var(--color-bg-main)', minHeight: '90vh' }}>
      <div className="container" style={{ maxWidth: '850px' }}>
        {/* Header Navigation */}
        <div style={{ marginBottom: '1.5rem' }}>
          <Link to="/mock-tests" style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            color: 'var(--color-text-secondary)',
            fontSize: '0.88rem',
            fontWeight: 600
          }}>
            <ArrowLeft size={16} />
            <span>Back to All Examinations</span>
          </Link>
        </div>

        {/* Test Overview Card */}
        <div style={{
          background: '#FFFFFF',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--color-border)',
          boxShadow: 'var(--shadow-sm)',
          padding: '1.75rem 2rem',
          marginBottom: '1.75rem'
        }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            color: 'var(--color-orange-dark)',
            fontSize: '0.8rem',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            marginBottom: '0.4rem'
          }}>
            <ShieldCheck size={16} />
            <span>Pre-Exam System Check & Candidate Verification</span>
          </div>

          <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--color-navy)', margin: '0 0 0.5rem' }}>
            {test.title}
          </h2>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.92rem', marginBottom: '1.25rem' }}>
            {test.description}
          </p>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
            gap: '0.75rem',
            background: 'var(--color-bg-alt)',
            padding: '1rem',
            borderRadius: 'var(--radius-md)',
            fontSize: '0.84rem'
          }}>
            <div>
              <div style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>DURATION</div>
              <div style={{ fontWeight: 700, color: 'var(--color-navy)' }}>{test.duration_minutes} Minutes</div>
            </div>
            <div>
              <div style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>TOTAL MARKS</div>
              <div style={{ fontWeight: 700, color: '#2563EB' }}>{test.total_marks} Marks</div>
            </div>
            <div>
              <div style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>PASS SCORE</div>
              <div style={{ fontWeight: 700, color: '#059669' }}>{test.pass_percentage}%</div>
            </div>
            <div>
              <div style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>NEGATIVE MARKING</div>
              <div style={{ fontWeight: 700, color: test.negative_marking ? '#DC2626' : '#059669' }}>
                {test.negative_marking ? `-${test.negative_mark_penalty}` : 'None'}
              </div>
            </div>
          </div>
        </div>

        {/* Verification Checklist */}
        <div style={{
          background: '#FFFFFF',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--color-border)',
          boxShadow: 'var(--shadow-sm)',
          padding: '1.75rem 2rem',
          marginBottom: '1.75rem'
        }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '1.25rem', color: 'var(--color-navy)' }}>
            System Readiness & Integrity Diagnostics
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* 1. Camera & Face Detection */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '0.75rem',
              padding: '1rem',
              borderRadius: 'var(--radius-md)',
              border: `1px solid ${hasPermission ? '#A7F3D0' : '#E2E8F0'}`,
              background: hasPermission ? '#F0FDF4' : '#F8FAFC'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <div style={{
                    width: '32px', height: '32px', borderRadius: '50%',
                    background: hasPermission ? '#10B981' : '#E2E8F0',
                    color: hasPermission ? '#FFFFFF' : '#64748B',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>
                    <Camera size={16} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--color-navy)' }}>
                      Webcam Presence Verification {isProctored ? '(Required)' : '(Optional)'}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)' }}>
                      Local frame processing. Confirms your face is visible and well-lit.
                    </div>
                  </div>
                </div>

                {!isStreaming ? (
                  <button
                    onClick={handleStartCameraCheck}
                    className="btn btn-secondary"
                    style={{ fontSize: '0.82rem', padding: '0.4rem 0.8rem' }}
                  >
                    Test Webcam
                  </button>
                ) : (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: '#059669', fontSize: '0.82rem', fontWeight: 700 }}>
                    <CheckCircle2 size={16} />
                    Active ({detectionState === 'ONE_FACE' ? 'Face Verified' : 'Check Lighting'})
                  </span>
                )}
              </div>

              {/* Video Preview if active */}
              {isStreaming && (
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginTop: '0.5rem' }}>
                  <div style={{
                    width: '180px',
                    height: '135px',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    background: '#000',
                    border: '2px solid #10B981',
                    position: 'relative'
                  }}>
                    <video
                      ref={videoRef}
                      playsInline
                      muted
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  </div>
                  <div style={{ fontSize: '0.82rem', color: 'var(--color-text-secondary)', flex: 1 }}>
                    <div style={{ fontWeight: 600, color: 'var(--color-navy)', marginBottom: '0.2rem' }}>
                      Diagnostic Status:
                    </div>
                    <div>Detection State: <strong>{detectionState}</strong></div>
                    <div>Faces Detected in View: <strong>{faceCount}</strong></div>
                    <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '0.4rem' }}>
                      Ensure your webcam remains on throughout the test.
                    </div>
                  </div>
                </div>
              )}

              {cameraError && (
                <div style={{ color: '#DC2626', fontSize: '0.8rem', marginTop: '0.3rem' }}>
                  Error: {cameraError}
                </div>
              )}
            </div>

            {/* 2. Fullscreen Capability */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '1rem',
              borderRadius: 'var(--radius-md)',
              border: `1px solid ${fullscreenTested ? '#A7F3D0' : '#E2E8F0'}`,
              background: fullscreenTested ? '#F0FDF4' : '#F8FAFC'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <div style={{
                  width: '32px', height: '32px', borderRadius: '50%',
                  background: fullscreenTested ? '#10B981' : '#E2E8F0',
                  color: fullscreenTested ? '#FFFFFF' : '#64748B',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  <Maximize2 size={16} />
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--color-navy)' }}>
                    Fullscreen Examination Mode {isFullscreenRequired ? '(Required)' : '(Recommended)'}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)' }}>
                    Verifies browser supports entering focused fullscreen mode.
                  </div>
                </div>
              </div>

              <button
                onClick={handleFullscreenTest}
                className="btn btn-secondary"
                style={{ fontSize: '0.82rem', padding: '0.4rem 0.8rem' }}
              >
                {fullscreenTested ? 'Retest Fullscreen' : 'Test Fullscreen'}
              </button>
            </div>

            {/* 3. Network Health */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '1rem',
              borderRadius: 'var(--radius-md)',
              border: `1px solid ${networkChecked ? '#A7F3D0' : '#E2E8F0'}`,
              background: networkChecked ? '#F0FDF4' : '#F8FAFC'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <div style={{
                  width: '32px', height: '32px', borderRadius: '50%',
                  background: networkChecked ? '#10B981' : '#E2E8F0',
                  color: networkChecked ? '#FFFFFF' : '#64748B',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  <Wifi size={16} />
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--color-navy)' }}>
                    Server Connection & Auto-Save Sync
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)' }}>
                    Low-latency connection verified to LinkTest API backend.
                  </div>
                </div>
              </div>

              <span style={{ color: '#059669', fontSize: '0.82rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <CheckCircle2 size={16} />
                Connected
              </span>
            </div>
          </div>
        </div>

        {/* Instructions & Honor Code Accordion */}
        <div style={{
          background: '#FFFFFF',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--color-border)',
          boxShadow: 'var(--shadow-sm)',
          padding: '1.75rem 2rem',
          marginBottom: '2rem'
        }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.75rem', color: 'var(--color-navy)' }}>
            Examination Instructions & Rules
          </h3>
          <div style={{
            fontSize: '0.88rem',
            color: 'var(--color-text-secondary)',
            lineHeight: 1.6,
            background: 'var(--color-bg-alt)',
            padding: '1rem 1.25rem',
            borderRadius: 'var(--radius-md)',
            whiteSpace: 'pre-line',
            marginBottom: '1.25rem'
          }}>
            {test.instructions || 'Standard test rules apply. All answers are saved automatically.'}
          </div>

          <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={rulesAgreed}
              onChange={(e) => setRulesAgreed(e.target.checked)}
              style={{ width: '18px', height: '18px', marginTop: '2px' }}
            />
            <span style={{ fontSize: '0.88rem', color: 'var(--color-navy)', fontWeight: 600 }}>
              I certify that I am <strong>{user?.full_name}</strong>. I will take this examination independently without unauthorized assistance, and I accept the proctoring guidelines.
            </span>
          </label>
        </div>

        {/* Launch Button */}
        <div style={{ textAlign: 'center' }}>
          <button
            onClick={handleLaunchExam}
            disabled={!canLaunch || starting}
            className="btn btn-primary"
            style={{
              padding: '0.9rem 2.5rem',
              fontSize: '1rem',
              fontWeight: 800,
              opacity: canLaunch && !starting ? 1 : 0.6,
              cursor: canLaunch && !starting ? 'pointer' : 'not-allowed',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              boxShadow: 'var(--shadow-md)'
            }}
          >
            {starting ? (
              <>
                <div className="spinner" style={{ width: '16px', height: '16px', borderWidth: '2px' }}></div>
                <span>Initializing Exam Session...</span>
              </>
            ) : (
              <>
                <Play size={18} />
                <span>Begin Examination Now</span>
              </>
            )}
          </button>

          {!canLaunch && (
            <div style={{ color: '#DC2626', fontSize: '0.82rem', marginTop: '0.75rem' }}>
              Please complete all required checks and agree to the honor code to unlock the examination.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
export default MockTestPreCheckPage;
