import React, { useState, useEffect, useCallback, useRef } from 'react';
import '@livekit/components-styles';
import {
  LiveKitRoom,
  VideoConference,
  RoomAudioRenderer,
  useRoomContext,
  useLocalParticipant,
  useRemoteParticipants,
  useTracks
} from '@livekit/components-react';
import { RoomEvent, Track } from 'livekit-client';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  PhoneOff,
  AlertCircle,
  Loader2,
  Users,
  ShieldCheck,
  Radio,
  X,
  Monitor,
  MonitorOff,
  CheckCircle,
  UserX
} from 'lucide-react';

/**
 * Inner Classroom Controller & Real-Time Media / Moderation Manager
 * Lives directly inside <LiveKitRoom> to leverage room context, participant state, and data channels.
 */
function ClassroomContent({
  session,
  isTeacher,
  onClose,
  onSessionEnded,
  ending,
  setEnding
}) {
  const room = useRoomContext();
  const localParticipant = useLocalParticipant();
  const remoteParticipants = useRemoteParticipants();
  const tracks = useTracks();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [showControlsDrawer, setShowControlsDrawer] = useState(false);
  const [lectureEnded, setLectureEnded] = useState(false);
  const [controlInProgress, setControlInProgress] = useState({});

  // Ensure chat input has modern placeholder "Type a message..." and accessible labels
  useEffect(() => {
    const updateChatAccessibilityAndPlaceholders = () => {
      const inputs = document.querySelectorAll('.lk-chat-form-input');
      inputs.forEach((input) => {
        if (input.placeholder !== 'Type a message...') {
          input.placeholder = 'Type a message...';
        }
        if (!input.getAttribute('aria-label')) {
          input.setAttribute('aria-label', 'Type a message');
        }
      });
      const chatLists = document.querySelectorAll('.lk-chat-messages');
      chatLists.forEach((list) => {
        if (!list.getAttribute('aria-label')) {
          list.setAttribute('aria-label', 'Classroom chat messages');
        }
      });
    };

    updateChatAccessibilityAndPlaceholders();
    const observer = new MutationObserver(updateChatAccessibilityAndPlaceholders);
    observer.observe(document.body, { childList: true, subtree: true });

    return () => observer.disconnect();
  }, []);

  // Stop all local media tracks cleanly
  const stopAllLocalTracks = useCallback(async () => {
    try {
      if (localParticipant?.localParticipant) {
        const lp = localParticipant.localParticipant;
        if (lp.tracks) {
          lp.tracks.forEach((pub) => {
            if (pub.track) {
              try {
                pub.track.stop();
              } catch (e) {}
            }
          });
        }
        await lp.setMicrophoneEnabled(false).catch(() => {});
        await lp.setCameraEnabled(false).catch(() => {});
        await lp.setScreenShareEnabled(false).catch(() => {});
      }
    } catch (err) {
      console.warn('[Classroom] Local tracks stop warning:', err);
    }
  }, [localParticipant]);

  // Handle incoming lecture termination event
  const handleLectureTermination = useCallback(async (reasonMessage = 'The teacher has ended this lecture.') => {
    setLectureEnded(true);
    await stopAllLocalTracks();
    try {
      if (room && room.state !== 'disconnected') {
        room.disconnect();
      }
    } catch (err) {
      console.warn('[Classroom] Disconnect notice:', err);
    }
  }, [room, stopAllLocalTracks]);

  // Listen to Room Events: DataReceived and Disconnected
  useEffect(() => {
    if (!room) return;

    const handleDataReceived = (payload, participant) => {
      try {
        const text = new TextDecoder().decode(payload);
        const data = JSON.parse(text);

        // 1. Lecture Ended Broadcast
        if (data.type === 'LECTURE_ENDED') {
          if (!data.lectureId || data.lectureId === session?.id) {
            handleLectureTermination();
          }
          return;
        }

        // 2. Teacher Control Actions targeted at this client
        const myIdentity = localParticipant?.localParticipant?.identity;
        if (data.type === 'TEACHER_CONTROL' && data.targetIdentity === myIdentity) {
          const action = (data.action || '').toUpperCase();
          const lp = localParticipant.localParticipant;

          if (action === 'MUTE_MIC') {
            lp.setMicrophoneEnabled(false).catch(() => {});
            showToast('The teacher has muted your microphone.', 'info');
          } else if (action === 'UNMUTE_MIC') {
            lp.setMicrophoneEnabled(true).catch(() => {});
            showToast('The teacher requested you unmute your microphone.', 'info');
          } else if (action === 'DISABLE_CAMERA') {
            lp.setCameraEnabled(false).catch(() => {});
            showToast('The teacher has disabled your video camera.', 'info');
          } else if (action === 'ENABLE_CAMERA') {
            lp.setCameraEnabled(true).catch(() => {});
            showToast('The teacher requested you turn on your camera.', 'info');
          } else if (action === 'STOP_SCREEN_SHARE') {
            lp.setScreenShareEnabled(false).catch(() => {});
            showToast('The teacher has stopped your screen sharing.', 'info');
          } else if (action === 'REMOVE_PARTICIPANT') {
            handleLectureTermination('You have been removed from the classroom by the teacher.');
          }
        }
      } catch (err) {
        // Not a JSON payload or unrelated data
      }
    };

    const handleRoomDisconnected = (disconnectReason) => {
      if (!isTeacher) {
        // When room disconnects for students, transition to ended screen
        setLectureEnded(true);
        stopAllLocalTracks();
      }
    };

    room.on(RoomEvent.DataReceived, handleDataReceived);
    room.on(RoomEvent.Disconnected, handleRoomDisconnected);

    return () => {
      room.off(RoomEvent.DataReceived, handleDataReceived);
      room.off(RoomEvent.Disconnected, handleRoomDisconnected);
    };
  }, [room, session?.id, isTeacher, localParticipant, handleLectureTermination, stopAllLocalTracks, showToast]);

  // Handle teacher ending the lecture for everyone
  const handleTeacherEndLecture = async () => {
    if (!window.confirm('Are you sure you want to end this live lecture for all participants? Connected students will immediately be disconnected.')) {
      return;
    }

    try {
      setEnding(true);

      // 1. Broadcast LECTURE_ENDED through LiveKit WebRTC data channel
      try {
        if (room?.localParticipant) {
          const payload = JSON.stringify({
            type: 'LECTURE_ENDED',
            lectureId: session.id,
            timestamp: new Date().toISOString()
          });
          const bytes = new TextEncoder().encode(payload);
          await room.localParticipant.publishData(bytes, { reliable: true });
        }
      } catch (bcErr) {
        console.warn('[Classroom] Data channel broadcast warning:', bcErr);
      }

      // 2. Authoritative backend termination
      await api.endTeacherLiveClass(session.id);

      // 3. Clean up teacher media & room
      await stopAllLocalTracks();
      try {
        if (room && room.state !== 'disconnected') {
          room.disconnect();
        }
      } catch (dcErr) {}

      showToast('Live lecture concluded and closed for all students.', 'success');
      if (onSessionEnded) onSessionEnded(session.id);
      onClose();
    } catch (err) {
      showToast(err.message || 'Failed to conclude lecture session', 'error');
      setEnding(false);
    }
  };

  // Teacher moderates participant track/state
  const handleTeacherControlParticipant = async (participant, action) => {
    const pIdentity = participant.identity;
    const actionKey = `${pIdentity}-${action}`;
    setControlInProgress(prev => ({ ...prev, [actionKey]: true }));

    try {
      // 1. Broadcast via reliable Room Data Channel for instant response
      if (room?.localParticipant) {
        const payload = JSON.stringify({
          type: 'TEACHER_CONTROL',
          targetIdentity: pIdentity,
          action: action.toUpperCase()
        });
        const bytes = new TextEncoder().encode(payload);
        await room.localParticipant.publishData(bytes, { reliable: true }).catch(() => {});
      }

      // 2. Identify track SID if relevant
      let trackSid = null;
      if (action === 'mute_mic' || action === 'unmute_mic') {
        trackSid = participant.getTrackPublication(Track.Source.Microphone)?.trackSid;
      } else if (action === 'disable_camera' || action === 'enable_camera') {
        trackSid = participant.getTrackPublication(Track.Source.Camera)?.trackSid;
      } else if (action === 'stop_screen_share') {
        trackSid = participant.getTrackPublication(Track.Source.ScreenShare)?.trackSid;
      }

      // 3. Authoritative backend moderation check & Twirp dispatch
      await api.controlLectureParticipant(session.id, {
        participantIdentity: pIdentity,
        action,
        trackSid
      });

      const actionLabels = {
        mute_mic: 'Muted microphone for',
        unmute_mic: 'Requested unmute for',
        disable_camera: 'Disabled camera for',
        enable_camera: 'Requested camera enable for',
        stop_screen_share: 'Stopped screen share for',
        remove_participant: 'Removed'
      };
      showToast(`${actionLabels[action] || 'Updated'} ${participant.name || pIdentity}`, 'success');
    } catch (err) {
      showToast(err.message || 'Failed to apply participant control', 'error');
    } finally {
      setControlInProgress(prev => ({ ...prev, [actionKey]: false }));
    }
  };

  // Student list (all remote participants who are not the current teacher)
  const studentParticipants = remoteParticipants.filter(p => p.identity !== localParticipant?.localParticipant?.identity);

  // If student receives ended state, render clear "Lecture Ended" full-screen UI
  if (lectureEnded) {
    return (
      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 10000,
          background: '#0B0F19',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#F8FAFC',
          padding: '2rem',
          textAlign: 'center'
        }}
      >
        <div
          style={{
            width: '72px',
            height: '72px',
            borderRadius: '50%',
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            color: '#EF4444',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '1.5rem',
            boxShadow: '0 0 24px rgba(239, 68, 68, 0.2)'
          }}
        >
          <PhoneOff size={36} />
        </div>

        <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '0.75rem', color: '#F8FAFC' }}>
          Lecture Ended
        </h1>

        <p style={{ fontSize: '1.1rem', color: '#CBD5E1', marginBottom: '0.5rem', fontWeight: 600 }}>
          The teacher has ended this lecture.
        </p>

        <p style={{ fontSize: '0.92rem', color: '#94A3B8', maxWidth: '460px', marginBottom: '2rem', lineHeight: 1.6 }}>
          You have been disconnected from the live lecture. All camera, microphone, and screen-sharing media streams have been terminated.
        </p>

        <div style={{ display: 'flex', gap: '1rem' }}>
          <button
            onClick={() => {
              onClose();
              if (window.location.pathname.includes('/student/')) {
                navigate('/student/dashboard');
              } else {
                navigate('/dashboard');
              }
            }}
            className="btn btn-primary"
            style={{
              padding: '0.65rem 1.75rem',
              fontSize: '0.95rem',
              fontWeight: 600,
              borderRadius: '8px',
              background: '#2563EB',
              border: 'none',
              color: '#FFFFFF'
            }}
          >
            Back to Dashboard
          </button>
          <button
            onClick={onClose}
            className="btn btn-outline"
            style={{
              padding: '0.65rem 1.25rem',
              fontSize: '0.95rem',
              borderRadius: '8px',
              color: '#94A3B8',
              borderColor: '#334155'
            }}
          >
            Close Window
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%', overflow: 'hidden' }}>
      {/* Classroom Header Bar */}
      <header
        style={{
          height: '64px',
          background: 'rgba(15, 23, 42, 0.95)',
          backdropFilter: 'blur(8px)',
          borderBottom: '1px solid #1E293B',
          padding: '0 1.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0,
          color: '#F8FAFC',
          zIndex: 10
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div
              style={{
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                background: '#EF4444',
                boxShadow: '0 0 10px #EF4444',
                animation: 'pulse 1.5s infinite'
              }}
            />
            <span
              style={{
                fontSize: '0.75rem',
                fontWeight: 800,
                letterSpacing: '0.08em',
                color: '#EF4444',
                textTransform: 'uppercase'
              }}
            >
              LIVE LECTURE
            </span>
          </div>

          <div style={{ height: '18px', width: '1px', background: '#334155' }} />

          <div style={{ minWidth: 0 }}>
            <h2
              style={{
                fontSize: '1rem',
                fontWeight: 700,
                color: '#F1F5F9',
                margin: 0,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}
            >
              {session.title || 'Virtual Classroom Session'}
            </h2>
            <div style={{ fontSize: '0.75rem', color: '#94A3B8', display: 'flex', gap: '0.6rem', alignItems: 'center' }}>
              {session.batch_name && <span>Batch: {session.batch_name}</span>}
              {session.class_name && <span>• {session.class_name}</span>}
              {session.subject_name && <span>• {session.subject_name}</span>}
              {session.teacher_name && <span>• Faculty: {session.teacher_name}</span>}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexShrink: 0 }}>
          {isTeacher && (
            <>
              {/* Teacher Student Moderation Drawer Toggle */}
              <button
                onClick={() => setShowControlsDrawer(prev => !prev)}
                className="btn btn-sm"
                style={{
                  background: showControlsDrawer ? '#3B82F6' : '#1E293B',
                  color: '#FFFFFF',
                  border: '1px solid #334155',
                  padding: '0.45rem 0.85rem',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  borderRadius: '6px',
                  fontWeight: 600
                }}
                title="Manage student microphone, camera and screen sharing"
              >
                <Users size={15} />
                <span>Student Controls ({studentParticipants.length})</span>
              </button>

              {/* End Lecture for Everyone Button */}
              <button
                onClick={handleTeacherEndLecture}
                disabled={ending}
                className="btn btn-sm"
                style={{
                  background: '#DC2626',
                  color: '#FFFFFF',
                  border: 'none',
                  fontWeight: 600,
                  padding: '0.45rem 0.95rem',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  borderRadius: '6px'
                }}
              >
                <PhoneOff size={14} />
                <span>{ending ? 'Ending Lecture...' : 'End Lecture for Everyone'}</span>
              </button>
            </>
          )}

          <button
            onClick={async () => {
              await stopAllLocalTracks();
              try {
                if (room && room.state !== 'disconnected') {
                  room.disconnect();
                }
              } catch (e) {}
              onClose();
            }}
            className="btn btn-sm btn-ghost"
            style={{
              color: '#94A3B8',
              padding: '0.45rem 0.75rem',
              borderRadius: '6px',
              border: '1px solid #334155'
            }}
            title="Leave classroom"
          >
            <span>Leave</span>
            <X size={15} style={{ marginLeft: '0.35rem' }} />
          </button>
        </div>
      </header>

      {/* Main Conference & Moderation Container */}
      <div style={{ flex: 1, display: 'flex', position: 'relative', overflow: 'hidden' }}>
        {/* LiveKit Video Conference View */}
        <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
          <VideoConference />
          <RoomAudioRenderer />
        </div>

        {/* Teacher Participant Moderation Side Drawer */}
        {isTeacher && showControlsDrawer && (
          <aside
            style={{
              width: '360px',
              maxWidth: '90vw',
              background: '#0F172A',
              borderLeft: '1px solid #334155',
              display: 'flex',
              flexDirection: 'column',
              zIndex: 20,
              boxShadow: '-4px 0 20px rgba(0, 0, 0, 0.4)'
            }}
          >
            <div
              style={{
                padding: '1rem 1.25rem',
                borderBottom: '1px solid #334155',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: '#1E293B'
              }}
            >
              <div>
                <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#F8FAFC', margin: 0 }}>
                  Participant Controls
                </h3>
                <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>
                  {studentParticipants.length} Connected Student{studentParticipants.length === 1 ? '' : 's'}
                </span>
              </div>
              <button
                onClick={() => setShowControlsDrawer(false)}
                className="btn btn-sm btn-ghost"
                style={{ color: '#94A3B8', padding: '0.25rem' }}
              >
                <X size={16} />
              </button>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {studentParticipants.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2.5rem 1rem', color: '#64748B' }}>
                  <Users size={32} style={{ margin: '0 auto 0.75rem', opacity: 0.5 }} />
                  <p style={{ fontSize: '0.88rem', margin: 0 }}>No other students currently connected.</p>
                  <p style={{ fontSize: '0.75rem', color: '#475569', marginTop: '0.25rem' }}>
                    Student media controls will appear here once students join.
                  </p>
                </div>
              ) : (
                studentParticipants.map(participant => {
                  const pIdentity = participant.identity;
                  const isMicOn = participant.isMicrophoneEnabled;
                  const isCamOn = participant.isCameraEnabled;
                  const isScreenOn = participant.isScreenShareEnabled;

                  return (
                    <div
                      key={pIdentity}
                      style={{
                        background: '#1E293B',
                        borderRadius: '8px',
                        border: '1px solid #334155',
                        padding: '0.85rem'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.65rem' }}>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontWeight: 600, fontSize: '0.88rem', color: '#F1F5F9', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {participant.name || 'Student'}
                          </div>
                          <div style={{ fontSize: '0.72rem', color: '#64748B', fontFamily: 'monospace' }}>
                            {pIdentity}
                          </div>
                        </div>

                        {isScreenOn && (
                          <span
                            style={{
                              background: 'rgba(59, 130, 246, 0.2)',
                              color: '#60A5FA',
                              border: '1px solid #3B82F6',
                              fontSize: '0.68rem',
                              fontWeight: 700,
                              padding: '0.15rem 0.45rem',
                              borderRadius: '4px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.25rem'
                            }}
                          >
                            <Monitor size={10} />
                            Sharing Screen
                          </span>
                        )}
                      </div>

                      {/* Participant Moderation Control Buttons */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.45rem', marginTop: '0.5rem' }}>
                        {/* Microphone Toggle */}
                        <button
                          onClick={() => handleTeacherControlParticipant(participant, isMicOn ? 'mute_mic' : 'unmute_mic')}
                          disabled={controlInProgress[`${pIdentity}-mute_mic`] || controlInProgress[`${pIdentity}-unmute_mic`]}
                          className="btn btn-sm"
                          style={{
                            fontSize: '0.75rem',
                            padding: '0.35rem 0.5rem',
                            borderRadius: '6px',
                            background: isMicOn ? 'rgba(239, 68, 68, 0.15)' : 'rgba(34, 197, 94, 0.15)',
                            color: isMicOn ? '#EF4444' : '#22C55E',
                            border: `1px solid ${isMicOn ? 'rgba(239, 68, 68, 0.3)' : 'rgba(34, 197, 94, 0.3)'}`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.35rem'
                          }}
                        >
                          {isMicOn ? <MicOff size={13} /> : <Mic size={13} />}
                          <span>{isMicOn ? 'Mute Mic' : 'Unmute Mic'}</span>
                        </button>

                        {/* Camera Toggle */}
                        <button
                          onClick={() => handleTeacherControlParticipant(participant, isCamOn ? 'disable_camera' : 'enable_camera')}
                          disabled={controlInProgress[`${pIdentity}-disable_camera`] || controlInProgress[`${pIdentity}-enable_camera`]}
                          className="btn btn-sm"
                          style={{
                            fontSize: '0.75rem',
                            padding: '0.35rem 0.5rem',
                            borderRadius: '6px',
                            background: isCamOn ? 'rgba(239, 68, 68, 0.15)' : 'rgba(59, 130, 246, 0.15)',
                            color: isCamOn ? '#EF4444' : '#60A5FA',
                            border: `1px solid ${isCamOn ? 'rgba(239, 68, 68, 0.3)' : 'rgba(59, 130, 246, 0.3)'}`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.35rem'
                          }}
                        >
                          {isCamOn ? <VideoOff size={13} /> : <Video size={13} />}
                          <span>{isCamOn ? 'Disable Camera' : 'Enable Camera'}</span>
                        </button>

                        {/* Stop Screen Share Button (if student is actively presenting) */}
                        {isScreenOn && (
                          <button
                            onClick={() => handleTeacherControlParticipant(participant, 'stop_screen_share')}
                            disabled={controlInProgress[`${pIdentity}-stop_screen_share`]}
                            className="btn btn-sm"
                            style={{
                              gridColumn: 'span 2',
                              fontSize: '0.75rem',
                              padding: '0.35rem 0.5rem',
                              borderRadius: '6px',
                              background: 'rgba(245, 158, 11, 0.15)',
                              color: '#F59E0B',
                              border: '1px solid rgba(245, 158, 11, 0.3)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '0.35rem'
                            }}
                          >
                            <MonitorOff size={13} />
                            <span>Stop Student Screen Share</span>
                          </button>
                        )}

                        {/* Eject / Remove Participant */}
                        <button
                          onClick={() => {
                            if (window.confirm(`Are you sure you want to remove ${participant.name || pIdentity} from this lecture?`)) {
                              handleTeacherControlParticipant(participant, 'remove_participant');
                            }
                          }}
                          disabled={controlInProgress[`${pIdentity}-remove_participant`]}
                          className="btn btn-sm"
                          style={{
                            gridColumn: isScreenOn ? 'span 2' : 'span 2',
                            fontSize: '0.72rem',
                            padding: '0.3rem 0.5rem',
                            borderRadius: '6px',
                            background: '#0F172A',
                            color: '#94A3B8',
                            border: '1px solid #334155',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.35rem'
                          }}
                        >
                          <UserX size={12} />
                          <span>Remove Student</span>
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}

/**
 * Main Live Classroom Modal Wrapper
 * Manages token acquisition, connection state, error handling, and high-contrast LiveKit chat styles.
 */
export function LiveClassroomModal({ session, isTeacher = false, onClose, onSessionEnded }) {
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [tokenData, setTokenData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [ending, setEnding] = useState(false);
  const [isPreConcluded, setIsPreConcluded] = useState(false);

  // Fetch token on mount
  useEffect(() => {
    let isMounted = true;

    async function fetchToken() {
      if (!session?.id) {
        setError('No live class session specified.');
        setLoading(false);
        return;
      }

      // Check if session object already states completed or cancelled
      if (session.status === 'completed' || session.status === 'cancelled' || session.status === 'ended') {
        setIsPreConcluded(true);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const data = await api.getLiveKitToken({
          sessionId: session.id,
          roomName: `lecture-${session.id}`,
          isPublisher: true
        });

        if (isMounted) {
          if (!data?.token || !data?.serverUrl) {
            throw new Error('Invalid LiveKit token received from server.');
          }
          setTokenData(data);
        }
      } catch (err) {
        if (isMounted) {
          console.error('Failed to obtain LiveKit token:', err);
          const errCode = err.code || err.error?.code || '';
          const errMsg = err.message || '';
          if (errCode === 'LECTURE_ENDED' || errCode === 'SESSION_CONCLUDED' || errMsg.toLowerCase().includes('ended') || errMsg.toLowerCase().includes('concluded')) {
            setIsPreConcluded(true);
          } else {
            setError(errMsg || 'Unable to connect to live lecture room.');
          }
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    fetchToken();

    return () => {
      isMounted = false;
    };
  }, [session?.id, session?.status]);

  const handleDisconnected = () => {
    showToast('Disconnected from classroom session', 'info');
    onClose();
  };

  // If the lecture has already concluded prior to join
  if (isPreConcluded) {
    return (
      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 9999,
          background: '#0B0F19',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#F8FAFC',
          padding: '2rem',
          textAlign: 'center'
        }}
      >
        <div
          style={{
            width: '72px',
            height: '72px',
            borderRadius: '50%',
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            color: '#EF4444',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '1.5rem',
            boxShadow: '0 0 24px rgba(239, 68, 68, 0.2)'
          }}
        >
          <PhoneOff size={36} />
        </div>

        <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '0.75rem', color: '#F8FAFC' }}>
          Lecture Ended
        </h1>

        <p style={{ fontSize: '1.1rem', color: '#CBD5E1', marginBottom: '0.5rem', fontWeight: 600 }}>
          The teacher has ended this lecture.
        </p>

        <p style={{ fontSize: '0.92rem', color: '#94A3B8', maxWidth: '460px', marginBottom: '2rem', lineHeight: 1.6 }}>
          This live lecture session has concluded and can no longer be joined.
        </p>

        <button
          onClick={() => {
            onClose();
            if (window.location.pathname.includes('/student/')) {
              navigate('/student/dashboard');
            } else {
              navigate('/dashboard');
            }
          }}
          className="btn btn-primary"
          style={{
            padding: '0.65rem 1.75rem',
            fontSize: '0.95rem',
            fontWeight: 600,
            borderRadius: '8px',
            background: '#2563EB',
            border: 'none',
            color: '#FFFFFF'
          }}
        >
          Back to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: '#0B0F19',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}
    >
      <main style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        {loading && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#F8FAFC',
              gap: '1rem'
            }}
          >
            <Loader2 size={36} className="spinner" style={{ color: '#3B82F6', animation: 'spin 1s linear infinite' }} />
            <div style={{ fontSize: '1.1rem', fontWeight: 600 }}>Connecting to LiveKit WebRTC Network...</div>
            <p style={{ color: '#94A3B8', fontSize: '0.85rem' }}>
              Securing room token and initializing audio & video channels.
            </p>
          </div>
        )}

        {error && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#F8FAFC',
              padding: '2rem',
              textAlign: 'center'
            }}
          >
            <div
              style={{
                padding: '1rem',
                borderRadius: '50%',
                background: 'rgba(239, 68, 68, 0.15)',
                color: '#EF4444',
                marginBottom: '1rem'
              }}
            >
              <AlertCircle size={40} />
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>
              Cannot Join Live Classroom
            </h3>
            <p style={{ color: '#94A3B8', fontSize: '0.9rem', maxWidth: '480px', marginBottom: '1.5rem', lineHeight: 1.5 }}>
              {error}
            </p>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                onClick={() => {
                  setError(null);
                  setLoading(true);
                  api.getLiveKitToken({
                    sessionId: session.id,
                    roomName: `lecture-${session.id}`,
                    isPublisher: true
                  })
                    .then(data => setTokenData(data))
                    .catch(err => {
                      const errCode = err.code || err.error?.code || '';
                      if (errCode === 'LECTURE_ENDED' || errCode === 'SESSION_CONCLUDED') {
                        setIsPreConcluded(true);
                      } else {
                        setError(err.message);
                      }
                    })
                    .finally(() => setLoading(false));
                }}
                className="btn btn-primary"
              >
                Retry Connection
              </button>
              <button onClick={onClose} className="btn btn-outline" style={{ color: '#FFFFFF', borderColor: '#475569' }}>
                Close
              </button>
            </div>
          </div>
        )}

        {!loading && !error && tokenData?.token && (
          <LiveKitRoom
            token={tokenData.token}
            serverUrl={tokenData.serverUrl}
            connect={true}
            video={true}
            audio={true}
            onDisconnected={handleDisconnected}
            onError={(err) => {
              console.error('LiveKit Room error:', err);
              showToast(err.message || 'LiveKit connection encountered an error', 'error');
            }}
            data-lk-theme="default"
            style={{ height: '100%', width: '100%' }}
          >
            <ClassroomContent
              session={session}
              isTeacher={isTeacher}
              onClose={onClose}
              onSessionEnded={onSessionEnded}
              ending={ending}
              setEnding={setEnding}
            />
          </LiveKitRoom>
        )}

        {/* Modern LiveKit Chat & Balanced Video Conference Styles */}
        <style>{`
          /* Balanced Video Conference & Side-by-Side Flex Layout */
          .lk-video-conference {
            display: flex !important;
            flex-direction: row !important;
            width: 100% !important;
            height: 100% !important;
            overflow: hidden !important;
            position: relative !important;
            background-color: #020617 !important;
          }
          .lk-video-conference-inner {
            flex: 1 1 0% !important;
            min-width: 0 !important;
            width: auto !important;
            height: 100% !important;
            display: flex !important;
            flex-direction: column !important;
            position: relative !important;
            overflow: hidden !important;
          }

          /* Chat Sidebar Container */
          .lk-chat, .chat {
            width: 350px !important;
            min-width: 320px !important;
            max-width: 380px !important;
            height: 100% !important;
            display: flex !important;
            flex-direction: column !important;
            background-color: #0B132B !important;
            border-left: 1px solid #1E293B !important;
            box-shadow: -4px 0 24px rgba(0, 0, 0, 0.4) !important;
            position: relative !important;
            z-index: 15 !important;
            box-sizing: border-box !important;
            transition: width 0.2s ease !important;
          }
          .lk-chat[style*="display: none"],
          .lk-chat[style*="display:none"] {
            display: none !important;
          }

          /* Chat Header */
          .lk-chat-header, .chat-header {
            height: 56px !important;
            min-height: 56px !important;
            max-height: 56px !important;
            background-color: #0F172A !important;
            border-bottom: 1px solid #1E293B !important;
            padding: 0 1rem !important;
            display: flex !important;
            align-items: center !important;
            justify-content: space-between !important;
            position: relative !important;
            box-sizing: border-box !important;
            color: #F8FAFC !important;
            font-weight: 700 !important;
            font-size: 0.95rem !important;
            letter-spacing: 0.02em !important;
          }
          .lk-chat-header::before {
            content: "" !important;
            display: inline-block !important;
            width: 18px !important;
            height: 18px !important;
            margin-right: 8px !important;
            background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%2338BDF8' stroke-width='2.2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z'%3E%3C/path%3E%3C/svg%3E") !important;
            background-repeat: no-repeat !important;
            background-position: center !important;
            background-size: contain !important;
            flex-shrink: 0 !important;
          }
          .lk-chat-header .lk-close-button {
            position: static !important;
            transform: none !important;
            margin-left: auto !important;
            display: inline-flex !important;
            align-items: center !important;
            justify-content: center !important;
            width: 32px !important;
            height: 32px !important;
            padding: 0 !important;
            border-radius: 6px !important;
            background: transparent !important;
            border: 1px solid transparent !important;
            color: #94A3B8 !important;
            cursor: pointer !important;
            transition: all 0.15s ease !important;
          }
          .lk-chat-header .lk-close-button:hover {
            background-color: #1E293B !important;
            border-color: #334155 !important;
            color: #F8FAFC !important;
          }
          .lk-chat-header .lk-close-button svg {
            width: 16px !important;
            height: 16px !important;
            stroke: currentColor !important;
          }

          /* Messages Scroll Area */
          .lk-chat-messages, .chat-messages {
            flex: 1 1 0% !important;
            min-height: 0 !important;
            height: auto !important;
            overflow-y: auto !important;
            overflow-x: hidden !important;
            background-color: #0B132B !important;
            padding: 1rem !important;
            display: flex !important;
            flex-direction: column !important;
            gap: 0.75rem !important;
            margin: 0 !important;
            list-style: none !important;
            scroll-behavior: smooth !important;
            box-sizing: border-box !important;
          }
          .lk-chat-messages::-webkit-scrollbar {
            width: 6px !important;
          }
          .lk-chat-messages::-webkit-scrollbar-track {
            background: #0B132B !important;
          }
          .lk-chat-messages::-webkit-scrollbar-thumb {
            background: #334155 !important;
            border-radius: 3px !important;
          }
          .lk-chat-messages::-webkit-scrollbar-thumb:hover {
            background: #475569 !important;
          }
          .lk-chat-messages:empty {
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
          }
          .lk-chat-messages:empty::after {
            content: "No messages yet. Say hello to everyone!" !important;
            color: #64748B !important;
            font-size: 0.85rem !important;
            text-align: center !important;
            padding: 2rem 1.5rem !important;
            display: block !important;
            max-width: 240px !important;
            line-height: 1.5 !important;
          }

          /* Message Items & Bubbles */
          .lk-chat-entry, .chat-entry {
            display: flex !important;
            flex-direction: column !important;
            max-width: 86% !important;
            margin: 0 !important;
            box-sizing: border-box !important;
          }
          .lk-chat-entry .lk-meta-data, .chat-entry .meta-data {
            display: flex !important;
            align-items: center !important;
            gap: 0.5rem !important;
            margin-bottom: 0.3rem !important;
            padding: 0 0.35rem !important;
            font-size: 0.75rem !important;
            line-height: 1.2 !important;
          }
          .lk-chat-entry .lk-participant-name, .chat-entry .participant-name {
            font-weight: 600 !important;
            font-size: 0.78rem !important;
            letter-spacing: 0.01em !important;
          }
          .lk-chat-entry .lk-timestamp, .chat-entry .timestamp {
            font-size: 0.7rem !important;
            color: #64748B !important;
          }
          .lk-chat-entry .lk-message-body, .chat-entry .message-body {
            padding: 0.6rem 0.85rem !important;
            font-size: 0.875rem !important;
            line-height: 1.45 !important;
            word-break: break-word !important;
            overflow-wrap: break-word !important;
            white-space: pre-wrap !important;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2) !important;
            box-sizing: border-box !important;
          }
          .lk-chat-entry a {
            color: inherit !important;
            text-decoration: underline !important;
          }

          /* Local Messages (Current User) */
          .lk-chat-entry[data-lk-message-origin='local'],
          .lk-chat-entry[data-message-origin='local'],
          .chat-entry[data-message-origin='local'] {
            align-self: flex-end !important;
            align-items: flex-end !important;
          }
          .lk-chat-entry[data-lk-message-origin='local'] .lk-meta-data,
          .lk-chat-entry[data-message-origin='local'] .meta-data,
          .chat-entry[data-message-origin='local'] .meta-data {
            flex-direction: row-reverse !important;
          }
          .lk-chat-entry[data-lk-message-origin='local'] .lk-participant-name,
          .lk-chat-entry[data-message-origin='local'] .participant-name,
          .chat-entry[data-message-origin='local'] .participant-name {
            color: #60A5FA !important;
          }
          .lk-chat-entry[data-lk-message-origin='local'] .lk-message-body,
          .lk-chat-entry[data-message-origin='local'] .lk-message-body,
          .chat-entry[data-message-origin='local'] .message-body {
            background: linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%) !important;
            color: #FFFFFF !important;
            font-weight: 500 !important;
            border-radius: 14px 14px 2px 14px !important;
            border: none !important;
          }

          /* Remote Messages (Other Participants) */
          .lk-chat-entry[data-lk-message-origin='remote'],
          .lk-chat-entry[data-message-origin='remote'],
          .chat-entry[data-message-origin='remote'] {
            align-self: flex-start !important;
            align-items: flex-start !important;
          }
          .lk-chat-entry[data-lk-message-origin='remote'] .lk-participant-name,
          .lk-chat-entry[data-message-origin='remote'] .participant-name,
          .chat-entry[data-message-origin='remote'] .participant-name {
            color: #38BDF8 !important;
          }
          .lk-chat-entry[data-lk-message-origin='remote'] .lk-message-body,
          .lk-chat-entry[data-message-origin='remote'] .lk-message-body,
          .chat-entry[data-message-origin='remote'] .message-body {
            background-color: #1E293B !important;
            color: #F1F5F9 !important;
            font-weight: 500 !important;
            border: 1px solid #334155 !important;
            border-radius: 14px 14px 14px 2px !important;
          }

          /* Composer Form Pinned at Bottom */
          .lk-chat-form, .chat-form {
            background-color: #0F172A !important;
            border-top: 1px solid #1E293B !important;
            padding: 0.85rem 1rem !important;
            display: flex !important;
            align-items: center !important;
            gap: 0.6rem !important;
            min-height: 64px !important;
            max-height: none !important;
            box-sizing: border-box !important;
            position: relative !important;
          }
          .lk-chat-form-input, .chat-form-input {
            flex: 1 1 0% !important;
            min-width: 0 !important;
            height: 42px !important;
            background-color: #1E293B !important;
            color: #F8FAFC !important;
            border: 1px solid #334155 !important;
            border-radius: 8px !important;
            padding: 0 0.9rem !important;
            font-size: 0.88rem !important;
            outline: none !important;
            box-sizing: border-box !important;
            transition: border-color 0.15s ease, box-shadow 0.15s ease !important;
          }
          .lk-chat-form-input::placeholder, .chat-form-input::placeholder {
            color: #64748B !important;
          }
          .lk-chat-form-input:focus, .chat-form-input:focus {
            border-color: #3B82F6 !important;
            background-color: #0B132B !important;
            box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.25) !important;
          }
          .lk-button.lk-chat-form-button, .chat-form button {
            height: 42px !important;
            padding: 0 1.15rem !important;
            background-color: #2563EB !important;
            color: #FFFFFF !important;
            border: none !important;
            border-radius: 8px !important;
            font-size: 0.85rem !important;
            font-weight: 600 !important;
            display: inline-flex !important;
            align-items: center !important;
            justify-content: center !important;
            gap: 0.4rem !important;
            cursor: pointer !important;
            transition: background-color 0.15s ease, opacity 0.15s ease !important;
            white-space: nowrap !important;
            box-sizing: border-box !important;
          }
          .lk-button.lk-chat-form-button::after,
          .chat-form button::after {
            content: "" !important;
            display: inline-block !important;
            width: 14px !important;
            height: 14px !important;
            margin-left: 0.35rem !important;
            background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='2.2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cline x1='22' y1='2' x2='11' y2='13'%3E%3C/line%3E%3Cpolygon points='22 2 15 22 11 13 2 9 22 2'%3E%3C/polygon%3E%3C/svg%3E") !important;
            background-size: contain !important;
            background-repeat: no-repeat !important;
            background-position: center !important;
            vertical-align: middle !important;
          }
          .lk-button.lk-chat-form-button:hover:not(:disabled),
          .chat-form button:hover:not(:disabled) {
            background-color: #1D4ED8 !important;
          }
          .lk-button.lk-chat-form-button:disabled,
          .chat-form button:disabled {
            opacity: 0.5 !important;
            cursor: not-allowed !important;
          }

          /* Responsive Tablet and Mobile Rules */
          @media (max-width: 768px) {
            .lk-chat, .chat {
              position: absolute !important;
              right: 0 !important;
              top: 0 !important;
              bottom: var(--lk-control-bar-height, 68px) !important;
              width: 100% !important;
              max-width: 100% !important;
              z-index: 40 !important;
              border-left: none !important;
              border-top: 1px solid #1E293B !important;
            }
          }
        `}</style>
      </main>
    </div>
  );
}

export default LiveClassroomModal;