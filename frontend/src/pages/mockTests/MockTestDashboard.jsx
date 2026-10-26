// Mock Test Dashboard — Student & Candidate Portal
// LinkTest Secure Examination System

import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { api } from '../../services/api';
import { StudentNav } from '../../components/student/StudentNav';
import {
  FileCheck2,
  Clock,
  Award,
  ShieldCheck,
  AlertTriangle,
  Play,
  RotateCcw,
  Search,
  Filter,
  CheckCircle,
  HelpCircle,
  Sparkles,
  Layers,
  ChevronRight,
  Eye,
  Camera,
  AlertCircle,
  Hourglass,
  Send,
  X
} from 'lucide-react';

export function MockTestDashboard() {
  const { user, isStudent } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [requestingId, setRequestingId] = useState(null);
  const [bannerMessage, setBannerMessage] = useState(null);

  // Filter state
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'mock_exam', 'practice', 'interview_prep', 'completed'
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState('all');

  const fetchMockTests = async (showLoading = false) => {
    if (showLoading) setLoading(true);
    try {
      const data = await api.getMockTests();
      setTests(data || []);
    } catch (err) {
      console.error('Failed to load mock tests:', err);
      if (showLoading) {
        setError('Unable to load examinations. Please check backend connection.');
      }
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => {
    fetchMockTests(true);
  }, []);

  // Poll for join request approval updates when any test is PENDING
  useEffect(() => {
    const hasPending = tests.some(t => t.join_request_status === 'PENDING');
    if (!hasPending) return;

    const interval = setInterval(() => {
      fetchMockTests(false);
    }, 4000);

    return () => clearInterval(interval);
  }, [tests]);

  const handleRequestJoin = async (testId) => {
    if (!testId) return;
    try {
      setRequestingId(testId);
      const res = await api.requestMockTestJoin(testId);
      const msg = 'Join request sent to your teacher. Please wait for approval.';
      showToast(msg, 'success');
      setBannerMessage(msg);

      // Optimistic update
      setTests(prev => prev.map(t => {
        if (t.id === testId) {
          return {
            ...t,
            join_request_status: 'PENDING',
            join_request_id: res?.request?.id || res?.id,
            rejection_reason: null
          };
        }
        return t;
      }));
    } catch (err) {
      console.error('Join request failed:', err);
      showToast(err.message || 'Failed to submit join request.', 'error');
    } finally {
      setRequestingId(null);
    }
  };

  // Filtered tests
  const filteredTests = tests.filter(test => {
    // Tab filter
    if (activeTab === 'completed') {
      if (!test.attempts_used || test.attempts_used === 0) return false;
    } else if (activeTab !== 'all') {
      if (test.category !== activeTab) return false;
    }

    // Search filter
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchTitle = test.title?.toLowerCase().includes(q);
      const matchSubject = test.subject?.toLowerCase().includes(q);
      const matchTopic = test.topic?.toLowerCase().includes(q);
      if (!matchTitle && !matchSubject && !matchTopic) return false;
    }

    // Difficulty filter
    if (selectedDifficulty !== 'all' && test.difficulty !== selectedDifficulty) {
      return false;
    }

    return true;
  });

  const getDifficultyBadge = (diff) => {
    const map = {
      beginner: { bg: '#ECFDF5', color: '#059669', label: 'Beginner' },
      easy: { bg: '#EFF6FF', color: '#2563EB', label: 'Easy' },
      medium: { bg: '#FFFBEB', color: '#D97706', label: 'Medium' },
      hard: { bg: '#FEF2F2', color: '#DC2626', label: 'Hard' },
      advanced: { bg: '#FDF2F8', color: '#9333EA', label: 'Advanced' }
    };
    const s = map[diff] || map.medium;
    return (
      <span style={{
        background: s.bg,
        color: s.color,
        fontSize: '0.75rem',
        fontWeight: 700,
        padding: '0.2rem 0.6rem',
        borderRadius: '999px',
        textTransform: 'uppercase'
      }}>
        {s.label}
      </span>
    );
  };

  return (
    <div style={{ padding: '2.5rem 0 5rem', minHeight: '85vh', background: 'var(--color-bg-main)' }}>
      <div className="container">
        {isStudent && <StudentNav />}

        {/* Hero Header */}
        <div style={{
          background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
          borderRadius: 'var(--radius-lg)',
          padding: '2.25rem 2.5rem',
          color: '#FFFFFF',
          marginBottom: '2rem',
          boxShadow: 'var(--shadow-md)',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{ position: 'relative', zIndex: 2, maxWidth: '750px' }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              background: 'rgba(249, 115, 22, 0.2)',
              color: 'var(--color-orange)',
              padding: '0.3rem 0.8rem',
              borderRadius: '999px',
              fontSize: '0.8rem',
              fontWeight: 700,
              marginBottom: '1rem',
              border: '1px solid rgba(249, 115, 22, 0.3)'
            }}>
              <ShieldCheck size={16} />
              <span>SECURE AI EXAMINATION & MOCK TEST HUB</span>
            </div>

            <h1 style={{ color: '#FFFFFF', fontSize: '2.1rem', fontWeight: 800, marginBottom: '0.75rem', letterSpacing: '-0.02em' }}>
              Standardized Mock Tests & Proctored Assessments
            </h1>
            <p style={{ color: '#94A3B8', fontSize: '1rem', lineHeight: 1.6, margin: 0 }}>
              Practice under real-time exam conditions with automated server timing, webcam presence monitoring, randomized question banks, negative marking, and instant AI performance scorecards.
            </p>
          </div>
        </div>

        {/* Join Request Info Banner */}
        {bannerMessage && (
          <div style={{
            background: '#EFF6FF',
            border: '1px solid #BFDBFE',
            color: '#1E40AF',
            padding: '0.85rem 1.25rem',
            borderRadius: 'var(--radius-md)',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '0.75rem',
            boxShadow: 'var(--shadow-sm)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <Clock size={18} style={{ color: '#2563EB', flexShrink: 0 }} />
              <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>{bannerMessage}</span>
            </div>
            <button
              onClick={() => setBannerMessage(null)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B', display: 'flex', alignItems: 'center' }}
              aria-label="Dismiss banner"
            >
              <X size={16} />
            </button>
          </div>
        )}

        {/* Filters and Search Bar */}
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '1rem',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '1.75rem',
          background: '#FFFFFF',
          padding: '1rem 1.25rem',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--color-border)',
          boxShadow: 'var(--shadow-sm)'
        }}>
          {/* Tabs */}
          <div style={{ display: 'flex', gap: '0.4rem', overflowX: 'auto', paddingBottom: '2px' }}>
            {[
              { id: 'all', label: 'All Tests' },
              { id: 'mock_exam', label: 'All-India Mocks' },
              { id: 'practice', label: 'Practice Tests' },
              { id: 'interview_prep', label: 'Interview Screening' },
              { id: 'completed', label: 'My Submissions' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  padding: '0.45rem 0.85rem',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.84rem',
                  fontWeight: 600,
                  border: 'none',
                  background: activeTab === tab.id ? 'var(--color-navy)' : 'transparent',
                  color: activeTab === tab.id ? '#FFFFFF' : 'var(--color-text-secondary)',
                  cursor: 'pointer',
                  transition: 'all var(--transition-fast)'
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search & Difficulty Filter */}
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <div style={{ position: 'relative', minWidth: '220px' }}>
              <Search size={15} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
              <input
                type="text"
                placeholder="Search subject or topic..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.45rem 0.75rem 0.45rem 2.2rem',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.88rem'
                }}
              />
            </div>

            <select
              value={selectedDifficulty}
              onChange={(e) => setSelectedDifficulty(e.target.value)}
              style={{
                padding: '0.45rem 0.75rem',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.85rem',
                background: '#FFFFFF',
                color: 'var(--color-text-primary)'
              }}
            >
              <option value="all">All Difficulties</option>
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
              <option value="advanced">Advanced</option>
            </select>
          </div>
        </div>

        {/* Content Area */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '4rem 1rem' }}>
            <div className="spinner" style={{ margin: '0 auto 1rem' }}></div>
            <p style={{ color: 'var(--color-text-secondary)' }}>Loading examinations catalog...</p>
          </div>
        ) : error ? (
          <div style={{
            background: 'var(--color-danger-bg)',
            border: '1px solid var(--color-danger)',
            color: 'var(--color-danger)',
            padding: '1.25rem',
            borderRadius: 'var(--radius-md)',
            textAlign: 'center'
          }}>
            {error}
          </div>
        ) : filteredTests.length === 0 ? (
          <div style={{
            background: '#FFFFFF',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--color-border)',
            padding: '4rem 2rem',
            textAlign: 'center'
          }}>
            <FileCheck2 size={48} style={{ color: '#94A3B8', margin: '0 auto 1rem' }} />
            <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>No examinations found</h3>
            <p style={{ color: 'var(--color-text-secondary)', maxWidth: '400px', margin: '0 auto' }}>
              No mock tests match your current tab or search filters. Try resetting the search or filter options.
            </p>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
            gap: '1.5rem'
          }}>
            {filteredTests.map((test) => {
              const isProctored = (test.proctoring_config?.webcam_required ?? test.proctoringConfig?.webcam_required);
              const rawAttemptId = test.active_attempt_id || test.activeAttemptId;
              const hasActiveAttempt = Boolean(rawAttemptId && rawAttemptId !== 'undefined' && rawAttemptId !== 'null' && String(rawAttemptId).trim());
              const activeAttemptId = hasActiveAttempt ? rawAttemptId : null;
              const durationMinutes = test.duration_minutes ?? test.durationMinutes ?? 60;
              const totalMarks = test.total_marks ?? test.totalMarks ?? 100;
              const maxAttempts = test.max_attempts ?? test.maxAttempts ?? 3;
              const attemptsUsed = test.attempts_used ?? test.attemptsUsed ?? 0;
              const canAttempt = test.can_attempt !== undefined
                ? Boolean(test.can_attempt)
                : (test.status === 'published' && (!maxAttempts || attemptsUsed < maxAttempts));

              return (
                <div
                  key={test.id}
                  style={{
                    background: '#FFFFFF',
                    borderRadius: 'var(--radius-lg)',
                    border: '1px solid var(--color-border)',
                    boxShadow: 'var(--shadow-sm)',
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden',
                    transition: 'transform 0.2s ease, box-shadow 0.2s ease'
                  }}
                >
                  {/* Card Header Banner */}
                  <div style={{
                    padding: '1.25rem 1.25rem 0.75rem',
                    borderBottom: '1px solid #F1F5F9',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start'
                  }}>
                    <div>
                      <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--color-orange-dark)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.2rem' }}>
                        {test.subject}
                      </div>
                      <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0, lineHeight: 1.35, color: 'var(--color-navy)' }}>
                        {test.title}
                      </h3>
                    </div>
                    <div>
                      {getDifficultyBadge(test.difficulty)}
                    </div>
                  </div>

                  {/* Card Body */}
                  <div style={{ padding: '1rem 1.25rem', flex: 1 }}>
                    <p style={{
                      fontSize: '0.86rem',
                      color: 'var(--color-text-secondary)',
                      lineHeight: 1.5,
                      marginBottom: '1rem',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden'
                    }}>
                      {test.description}
                    </p>

                    {/* Meta Specs Grid */}
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: '0.6rem',
                      background: 'var(--color-bg-alt)',
                      padding: '0.75rem',
                      borderRadius: 'var(--radius-md)',
                      fontSize: '0.8rem',
                      color: 'var(--color-text-secondary)',
                      marginBottom: '1rem'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <Clock size={15} style={{ color: 'var(--color-orange)' }} />
                        <span><strong>{durationMinutes}</strong> mins</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <Award size={15} style={{ color: '#2563EB' }} />
                        <span><strong>{totalMarks}</strong> Marks</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <AlertTriangle size={15} style={{ color: (test.negative_marking ?? test.negativeMarking) ? '#DC2626' : '#10B981' }} />
                        <span>{(test.negative_marking ?? test.negativeMarking) ? `-${test.negative_mark_penalty ?? test.negativeMarkPenalty ?? 1} Neg. Mark` : 'No Negative Mark'}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <RotateCcw size={15} style={{ color: '#7C3AED' }} />
                        <span>Max <strong>{maxAttempts}</strong> Attempts</span>
                      </div>
                    </div>

                    {/* Proctoring Badges */}
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
                      {isProctored ? (
                        <div style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                          background: 'rgba(239, 68, 68, 0.08)',
                          color: '#DC2626',
                          border: '1px solid rgba(239, 68, 68, 0.2)',
                          padding: '0.2rem 0.5rem',
                          borderRadius: '4px',
                          fontSize: '0.72rem',
                          fontWeight: 700
                        }}>
                          <Camera size={13} />
                          <span>Webcam Proctored</span>
                        </div>
                      ) : (
                        <div style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                          background: '#F1F5F9',
                          color: '#64748B',
                          padding: '0.2rem 0.5rem',
                          borderRadius: '4px',
                          fontSize: '0.72rem',
                          fontWeight: 600
                        }}>
                          <span>Standard Mode</span>
                        </div>
                      )}

                      {(test.proctoring_config?.fullscreen_required ?? test.proctoringConfig?.fullscreen_required) && (
                        <div style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                          background: 'rgba(59, 130, 246, 0.08)',
                          color: '#2563EB',
                          border: '1px solid rgba(59, 130, 246, 0.2)',
                          padding: '0.2rem 0.5rem',
                          borderRadius: '4px',
                          fontSize: '0.72rem',
                          fontWeight: 600
                        }}>
                          <span>Fullscreen Enforced</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Rejection Notice Banner if rejected */}
                  {test.join_request_status === 'REJECTED' && (
                    <div style={{
                      margin: '0.4rem 1.25rem 0',
                      padding: '0.5rem 0.75rem',
                      background: '#FEF2F2',
                      border: '1px solid #FECACA',
                      borderRadius: '6px',
                      color: '#DC2626',
                      fontSize: '0.78rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.4rem'
                    }}>
                      <AlertTriangle size={14} style={{ flexShrink: 0 }} />
                      <span><strong>Teacher Rejection:</strong> {test.rejection_reason || 'Request was declined. You may request again when eligible.'}</span>
                    </div>
                  )}

                  {/* Card Footer Actions */}
                  <div style={{
                    padding: '0.85rem 1.25rem',
                    background: '#FAFAFA',
                    borderTop: '1px solid var(--color-border)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}>
                    {/* Status / History Pill */}
                    <div>
                      {attemptsUsed > 0 ? (
                        <div style={{ fontSize: '0.78rem', color: (test.has_passed ?? test.hasPassed) ? '#059669' : '#DC2626', fontWeight: 700 }}>
                          Best: {test.best_score ?? test.bestScore}/{totalMarks} ({test.best_percentage ?? test.bestPercentage}%)
                        </div>
                      ) : (
                        <div style={{ fontSize: '0.76rem', color: '#64748B' }}>
                          Not attempted yet
                        </div>
                      )}
                    </div>

                    {/* Action Button */}
                    <div>
                      {hasActiveAttempt ? (
                        <Link
                          to={`/mock-tests/${test.id}/runner/${activeAttemptId}`}
                          className="btn btn-warning"
                          style={{
                            padding: '0.45rem 0.95rem',
                            fontSize: '0.82rem',
                            fontWeight: 700,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.35rem'
                          }}
                        >
                          <Play size={14} />
                          <span>Resume Exam</span>
                        </Link>
                      ) : canAttempt ? (
                        (test.batch_id || test.join_request_status === 'APPROVED' || test.can_start_directly) ? (
                          <Link
                            to={`/mock-tests/${test.id}/check`}
                            className="btn btn-primary"
                            style={{
                              padding: '0.45rem 0.95rem',
                              fontSize: '0.82rem',
                              fontWeight: 700,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.35rem',
                              background: '#16A34A',
                              borderColor: '#16A34A'
                            }}
                          >
                            <Play size={14} />
                            <span>Start Mock Test</span>
                          </Link>
                        ) : test.join_request_status === 'PENDING' ? (
                          <button
                            disabled
                            className="btn"
                            style={{
                              padding: '0.45rem 0.95rem',
                              fontSize: '0.82rem',
                              fontWeight: 700,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.35rem',
                              background: '#FEF3C7',
                              color: '#B45309',
                              border: '1px solid #FCD34D',
                              cursor: 'not-allowed',
                              opacity: 0.95
                            }}
                          >
                            <Hourglass size={14} />
                            <span>Waiting for Teacher Approval</span>
                          </button>
                        ) : test.join_request_status === 'REJECTED' ? (
                          <button
                            onClick={() => handleRequestJoin(test.id)}
                            disabled={requestingId === test.id}
                            className="btn btn-outline"
                            style={{
                              padding: '0.45rem 0.95rem',
                              fontSize: '0.82rem',
                              fontWeight: 700,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.35rem',
                              borderColor: '#DC2626',
                              color: '#DC2626',
                              background: '#FFF5F5'
                            }}
                          >
                            <Send size={14} />
                            <span>{requestingId === test.id ? 'Sending...' : 'Request Again'}</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => handleRequestJoin(test.id)}
                            disabled={requestingId === test.id}
                            className="btn btn-primary"
                            style={{
                              padding: '0.45rem 0.95rem',
                              fontSize: '0.82rem',
                              fontWeight: 700,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.35rem',
                              background: '#2563EB',
                              borderColor: '#2563EB'
                            }}
                          >
                            <Send size={14} />
                            <span>{requestingId === test.id ? 'Sending Request...' : 'Request to Join'}</span>
                          </button>
                        )
                      ) : attemptsUsed > 0 ? (
                        <Link
                          to={`/mock-tests/history?test_id=${test.id}`}
                          className="btn btn-secondary"
                          style={{
                            padding: '0.45rem 0.95rem',
                            fontSize: '0.82rem',
                            fontWeight: 600,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.35rem'
                          }}
                        >
                          <Eye size={14} />
                          <span>View Results</span>
                        </Link>
                      ) : (
                        <button
                          disabled
                          className="btn btn-secondary"
                          style={{
                            padding: '0.45rem 0.95rem',
                            fontSize: '0.82rem',
                            opacity: 0.6,
                            cursor: 'not-allowed'
                          }}
                        >
                          Unavailable
                        </button>
                      )}
                    </div>
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
export default MockTestDashboard;
