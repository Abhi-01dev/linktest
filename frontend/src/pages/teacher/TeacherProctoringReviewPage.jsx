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
  MessageSquare
} from 'lucide-react';

export function TeacherProctoringReviewPage() {
  const { id, attemptId } = useParams();

  const [attempt, setAttempt] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [selectedEvent, setSelectedEvent] = useState(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [reviewing, setReviewing] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [attemptRes, eventsRes] = await Promise.all([
        api.getMockTestAttemptResult(attemptId),
        api.getMockTestProctoringEvents(attemptId)
      ]);
      setAttempt(attemptRes);
      setEvents(eventsRes || []);
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

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '6rem' }}>
        <div className="spinner" style={{ margin: '0 auto 1rem' }}></div>
        <p>Loading candidate proctoring audit log...</p>
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

  return (
    <div style={{ padding: '2rem', maxWidth: '1000px', margin: '0 auto' }}>
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
              PROCTORING INTEGRITY AUDIT TRAIL
            </div>
            <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--color-navy)', margin: '0.2rem 0' }}>
              Candidate Review: Attempt #{attempt.attempt_id?.slice(-8)}
            </h1>
            <div style={{ fontSize: '0.88rem', color: 'var(--color-text-secondary)' }}>
              Examination: <strong>{attempt.test_title}</strong>
            </div>
          </div>

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
            <span>{isFlagged ? 'Flagged for Faculty Verification' : 'Standard Verification Session'}</span>
          </div>
        </div>
      </div>

      {/* Overview Metric Banner */}
      <div style={{
        background: '#FFFFFF',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--color-border)',
        boxShadow: 'var(--shadow-sm)',
        padding: '1.5rem',
        marginBottom: '2rem',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
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
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B' }}>WARNINGS LOGGED</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 900, color: attempt.warning_count > 0 ? '#DC2626' : '#059669', marginTop: '0.2rem' }}>
            {attempt.warning_count || 0}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748B' }}>Automated event warnings</div>
        </div>

        <div style={{ background: 'var(--color-bg-alt)', padding: '1rem', borderRadius: '8px' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B' }}>TAB FOCUS LOSS</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--color-navy)', marginTop: '0.2rem' }}>
            {attempt.proctoring_summary?.tab_switch_events || 0}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748B' }}>Window blur occurrences</div>
        </div>

        <div style={{ background: 'var(--color-bg-alt)', padding: '1rem', borderRadius: '8px' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B' }}>FACE ANOMALIES</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--color-navy)', marginTop: '0.2rem' }}>
            {(attempt.proctoring_summary?.face_absence_events || 0) + (attempt.proctoring_summary?.multiple_face_events || 0)}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748B' }}>Absence or multi-faces</div>
        </div>
      </div>

      {/* Notice on Academic Discretion */}
      <div style={{
        background: '#EFF6FF',
        borderLeft: '4px solid #2563EB',
        padding: '1rem 1.25rem',
        borderRadius: '6px',
        fontSize: '0.86rem',
        color: '#1E3A8A',
        lineHeight: 1.5,
        marginBottom: '2rem'
      }}>
        <strong>Evaluation Policy:</strong> Webcam and focus events are technical indicators intended to assist faculty review. They do not constitute automated proof of misconduct. Review each event with context, dismiss false positives, and record review notes.
      </div>

      {/* Events Timeline */}
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
  );
}
export default TeacherProctoringReviewPage;
