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

        {/* High-Contrast LiveKit Chat & UI Styles */}
        <style>{`
          .lk-chat, .chat {
            background-color: #0F172A !important;
            border-left: 1px solid #334155 !important;
            display: flex !important;
            flex-direction: column !important;
          }
          .lk-chat-header, .chat-header {
            background-color: #1E293B !important;
            color: #F8FAFC !important;
            font-weight: 700 !important;
            border-bottom: 1px solid #334155 !important;
            padding: 0.75rem 1rem !important;
          }
          .lk-chat-messages, .chat-messages {
            background-color: #0F172A !important;
            padding: 0.85rem !important;
            overflow-y: auto !important;
            flex: 1 !important;
            scroll-behavior: smooth !important;
          }
          .lk-chat-entry, .chat-entry {
            margin-bottom: 0.75rem !important;
            display: flex !important;
            flex-direction: column !important;
          }
          .lk-chat-entry .meta-data, .chat-entry .meta-data {
            color: #94A3B8 !important;
            font-size: 0.75rem !important;
            margin-bottom: 0.25rem !important;
            display: flex !important;
            gap: 0.5rem !important;
          }
          .lk-chat-entry .participant-name, .chat-entry .participant-name {
            color: #60A5FA !important;
            font-weight: 600 !important;
          }
          .lk-chat-entry .timestamp, .chat-entry .timestamp {
            color: #64748B !important;
          }
          .lk-chat-entry[data-lk-message-origin='local'] .lk-message-body,
          .lk-chat-entry[data-message-origin='local'] .lk-message-body,
          .chat-entry[data-message-origin='local'] .message-body {
            background-color: #2563EB !important;
            color: #FFFFFF !important;
            font-weight: 500 !important;
            border-radius: 12px 12px 2px 12px !important;
            padding: 0.45rem 0.85rem !important;
            box-shadow: 0 2px 6px rgba(37, 99, 235, 0.25) !important;
            align-self: flex-end !important;
            max-width: 85% !important;
            word-break: break-word !important;
          }
          .lk-chat-entry[data-lk-message-origin='remote'] .lk-message-body,
          .lk-chat-entry[data-message-origin='remote'] .lk-message-body,
          .chat-entry[data-message-origin='remote'] .message-body {
            background-color: #1E293B !important;
            color: #F1F5F9 !important;
            font-weight: 500 !important;
            border: 1px solid #334155 !important;
            border-radius: 12px 12px 12px 2px !important;
            padding: 0.45rem 0.85rem !important;
            align-self: flex-start !important;
            max-width: 85% !important;
            word-break: break-word !important;
          }
          .lk-chat-form, .chat-form {
            background-color: #1E293B !important;
            border-top: 1px solid #334155 !important;
            padding: 0.75rem !important;
            display: flex !important;
            gap: 0.5rem !important;
          }
          .lk-chat-form-input, .chat-form-input {
            background-color: #0F172A !important;
            color: #FFFFFF !important;
            border: 1px solid #475569 !important;
            border-radius: 8px !important;
            padding: 0.5rem 0.75rem !important;
            font-size: 0.88rem !important;
            flex: 1 !important;
          }
          .lk-chat-form-input:focus, .chat-form-input:focus {
            border-color: #3B82F6 !important;
            outline: none !important;
          }
          .lk-button.lk-chat-form-button, .chat-form button {
            background-color: #2563EB !important;
            color: #FFFFFF !important;
            border-radius: 8px !important;
            font-weight: 600 !important;
            padding: 0.45rem 0.9rem !important;
          }
        `}</style>
      </main>
    </div>
  );
}

export default LiveClassroomModal;