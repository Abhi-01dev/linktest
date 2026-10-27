import React, { useState, useEffect } from 'react';
import '@livekit/components-styles';
import {
  LiveKitRoom,
  VideoConference,
  RoomAudioRenderer
} from '@livekit/components-react';
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
  X
} from 'lucide-react';

export function LiveClassroomModal({ session, isTeacher = false, onClose, onSessionEnded }) {
  const { showToast } = useToast();
  const [tokenData, setTokenData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [ending, setEnding] = useState(false);

  // Fetch token on mount
  useEffect(() => {
    let isMounted = true;

    async function fetchToken() {
      if (!session?.id) {
        setError('No live class session specified.');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const data = await api.getLiveKitToken({
          sessionId: session.id,
          roomName: `session-${session.id}`,
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
          setError(err.message || 'Unable to connect to live lecture room.');
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
  }, [session?.id]);

  // Handle teacher ending the lecture for everyone
  const handleEndLecture = async () => {
    if (!window.confirm('Are you sure you want to end this live lecture for all participants?')) {
      return;
    }

    try {
      setEnding(true);
      await api.endTeacherLiveClass(session.id);
      showToast('Live lecture concluded successfully', 'success');
      if (onSessionEnded) onSessionEnded(session.id);
      onClose();
    } catch (err) {
      showToast(err.message || 'Failed to end lecture session', 'error');
      setEnding(false);
    }
  };

  const handleDisconnected = () => {
    showToast('Disconnected from classroom session', 'info');
    onClose();
  };

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
          color: '#F8FAFC'
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
            <button
              onClick={handleEndLecture}
              disabled={ending}
              className="btn btn-sm"
              style={{
                background: '#DC2626',
                color: '#FFFFFF',
                border: 'none',
                fontWeight: 600,
                padding: '0.45rem 0.9rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                borderRadius: '6px'
              }}
            >
              <PhoneOff size={14} />
              <span>{ending ? 'Ending...' : 'End Lecture for Everyone'}</span>
            </button>
          )}

          <button
            onClick={onClose}
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

      {/* Main Room Body */}
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
                    roomName: `session-${session.id}`,
                    isPublisher: true
                  })
                    .then(data => setTokenData(data))
                    .catch(err => setError(err.message))
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
            <VideoConference />
            <RoomAudioRenderer />
          </LiveKitRoom>
        )}

        {/* High-Contrast LiveKit Chat Styles */}
        <style>{`
          .lk-chat, .chat {
            background-color: #0F172A !important;
            border-left: 1px solid #334155 !important;
          }
          .lk-chat-header, .chat-header {
            background-color: #1E293B !important;
            color: #F8FAFC !important;
            font-weight: 700 !important;
            border-bottom: 1px solid #334155 !important;
          }
          .lk-chat-messages, .chat-messages {
            background-color: #0F172A !important;
            padding: 0.75rem !important;
          }
          .lk-chat-entry, .chat-entry {
            margin-bottom: 0.65rem !important;
          }
          .lk-chat-entry .meta-data, .chat-entry .meta-data {
            color: #94A3B8 !important;
            font-size: 0.75rem !important;
            margin-bottom: 0.25rem !important;
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
            padding: 0.4rem 0.8rem !important;
            box-shadow: 0 2px 6px rgba(37, 99, 235, 0.25) !important;
          }
          .lk-chat-entry[data-lk-message-origin='remote'] .lk-message-body,
          .lk-chat-entry[data-message-origin='remote'] .lk-message-body,
          .chat-entry[data-message-origin='remote'] .message-body {
            background-color: #1E293B !important;
            color: #F1F5F9 !important;
            font-weight: 500 !important;
            border: 1px solid #334155 !important;
            border-radius: 12px 12px 12px 2px !important;
            padding: 0.4rem 0.8rem !important;
          }
          .lk-chat-form, .chat-form {
            background-color: #1E293B !important;
            border-top: 1px solid #334155 !important;
            padding: 0.75rem !important;
          }
          .lk-chat-form-input, .chat-form-input {
            background-color: #0F172A !important;
            color: #FFFFFF !important;
            border: 1px solid #475569 !important;
            border-radius: 8px !important;
            padding: 0.5rem 0.75rem !important;
            font-size: 0.88rem !important;
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
          }
        `}</style>
      </main>
    </div>
  );
}

export default LiveClassroomModal;
