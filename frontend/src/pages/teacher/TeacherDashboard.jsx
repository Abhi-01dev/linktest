import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import {
  Users,
  Calendar,
  ClipboardCheck,
  FileText,
  Video,
  Megaphone,
  Clock,
  ArrowRight,
  PlusCircle,
  GraduationCap,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertCircle,
  X,
  FileCheck2,
  Check,
  RotateCcw,
  BookOpen,
  Layers,
  Printer,
  Download
} from 'lucide-react';

export function TeacherDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Join Requests State
  const [joinRequests, setJoinRequests] = useState([]);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [requestFilter, setRequestFilter] = useState('PENDING'); // 'PENDING', 'APPROVED', 'REJECTED', 'ALL'
  const [rejectModal, setRejectModal] = useState({ open: false, request: null, reason: '' });
  const [actionProcessingId, setActionProcessingId] = useState(null);

  // PDF Report Generation Modal State
  const [pdfModalOpen, setPdfModalOpen] = useState(false);
  const [teacherTests, setTeacherTests] = useState([]);
  const [teacherBatches, setTeacherBatches] = useState([]);
  const [selectedPdfTest, setSelectedPdfTest] = useState('');
  const [selectedPdfBatch, setSelectedPdfBatch] = useState('');
  const [generatingPdf, setGeneratingPdf] = useState(false);

  const { showToast } = useToast();

  const fetchJoinRequests = useCallback(async (statusToFetch = requestFilter) => {
    try {
      const res = await api.getTeacherMockTestJoinRequests({ status: statusToFetch });
      const list = res?.requests || res?.data?.requests || [];
      setJoinRequests(list);
    } catch (err) {
      console.warn('Failed to poll mock test join requests:', err);
    }
  }, [requestFilter]);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const res = await api.getTeacherDashboard();
        setData(res);
      } catch (err) {
        showToast(err.message || 'Failed to load teacher dashboard', 'error');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [showToast]);

  // Initial load of join requests
  useEffect(() => {
    fetchJoinRequests(requestFilter);
  }, [fetchJoinRequests, requestFilter]);

  // Real-time polling for join requests every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchJoinRequests(requestFilter);
    }, 5000);

    return () => clearInterval(interval);
  }, [fetchJoinRequests, requestFilter]);

  // Load tests and batches for PDF modal
  useEffect(() => {
    async function loadPdfOptions() {
      try {
        const [testsRes, batchesRes] = await Promise.all([
          api.getMockTests().catch(() => []),
          api.getBatches().catch(() => [])
        ]);
        const testsList = Array.isArray(testsRes) ? testsRes : (testsRes?.tests || []);
        const batchesList = Array.isArray(batchesRes) ? batchesRes : (batchesRes?.batches || []);
        setTeacherTests(testsList);
        setTeacherBatches(batchesList);
        if (testsList.length > 0 && !selectedPdfTest) {
          setSelectedPdfTest(testsList[0].id);
        }
      } catch (err) {
        console.error('Failed to load PDF options:', err);
      }
    }
    loadPdfOptions();
  }, []);

  const handleGeneratePdf = async () => {
    if (!selectedPdfTest) {
      showToast('Please select a test to generate results PDF.', 'warning');
      return;
    }
    setGeneratingPdf(true);
    try {
      await api.downloadTestResultsPdf(selectedPdfTest, selectedPdfBatch || null);
      showToast('Examination results PDF downloaded successfully.', 'success');
      setPdfModalOpen(false);
    } catch (err) {
      showToast(err.message || 'Failed to generate PDF.', 'error');
    } finally {
      setGeneratingPdf(false);
    }
  };

  // Handle Approve
  const handleApprove = async (reqItem) => {
    try {
      setActionProcessingId(reqItem.id);
      await api.approveMockTestJoinRequest(reqItem.id);
      showToast(`Approved mock test access for ${reqItem.student_name}.`, 'success');
      // Update local state immediately
      setJoinRequests(prev => prev.map(r => (
        r.id === reqItem.id ? { ...r, status: 'APPROVED', reviewed_by: user?.id, reviewed_at: new Date().toISOString() } : r
      )));
    } catch (err) {
      console.error('Approval failed:', err);
      showToast(err.message || 'Failed to approve request.', 'error');
    } finally {
      setActionProcessingId(null);
    }
  };

  // Open Reject Modal
  const openRejectModal = (reqItem) => {
    setRejectModal({
      open: true,
      request: reqItem,
      reason: ''
    });
  };

  // Confirm Reject
  const handleConfirmReject = async () => {
    if (!rejectModal.request) return;
    try {
      setActionProcessingId(rejectModal.request.id);
      await api.rejectMockTestJoinRequest(rejectModal.request.id, rejectModal.reason);
      showToast(`Rejected mock test request for ${rejectModal.request.student_name}.`, 'info');
      // Update local state immediately
      setJoinRequests(prev => prev.map(r => (
        r.id === rejectModal.request.id
          ? {
              ...r,
              status: 'REJECTED',
              rejection_reason: rejectModal.reason,
              reviewed_by: user?.id,
              reviewed_at: new Date().toISOString()
            }
          : r
      )));
      setRejectModal({ open: false, request: null, reason: '' });
    } catch (err) {
      console.error('Rejection failed:', err);
      showToast(err.message || 'Failed to reject request.', 'error');
    } finally {
      setActionProcessingId(null);
    }
  };

  const formatRequestTime = (isoString) => {
    if (!isoString) return 'Just now';
    try {
      const d = new Date(isoString);
      if (isNaN(d.getTime())) return isoString;
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return isoString;
    }
  };

  const summary = data?.summary || {};
  const todaySchedule = data?.today_schedule || [];
  const assignedClasses = data?.assigned_classes || [];
  const upcomingLive = data?.upcoming_live_classes || [];
  const announcements = data?.recent_announcements || [];

  const mySubjects = React.useMemo(() => {
    const map = new Map();
    for (const item of assignedClasses) {
      if (item.subject_id && !map.has(item.subject_id)) {
        map.set(item.subject_id, {
          id: item.subject_id,
          name: item.subject_name,
          code: item.subject_code
        });
      }
    }
    return Array.from(map.values());
  }, [assignedClasses]);

  const myBatches = React.useMemo(() => {
    const map = new Map();
    for (const item of assignedClasses) {
      const key = item.batch_id || item.batch_name;
      if (key && !map.has(key)) {
        map.set(key, {
          id: item.batch_id,
          name: item.batch_name || item.class_name,
          className: item.class_name
        });
      }
    }
    return Array.from(map.values());
  }, [assignedClasses]);

  return (
    <div>
      {/* Welcome Banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, #1E3A8A 0%, #2563EB 100%)',
          color: '#FFFFFF',
          borderRadius: '16px',
          padding: '2rem 2.25rem',
          marginBottom: '2rem',
          boxShadow: 'var(--shadow-md)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1.25rem'
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
            <span style={{ background: 'rgba(255, 255, 255, 0.2)', padding: '0.2rem 0.6rem', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Faculty Command Center
            </span>
          </div>
          <h1 style={{ fontSize: '1.9rem', fontWeight: 800, margin: '0.2rem 0 0.5rem', color: '#FFFFFF' }}>
            Welcome back, {user?.full_name}!
          </h1>
          <p style={{ color: '#DBEAFE', fontSize: '0.92rem', maxWidth: '600px', margin: 0 }}>
            Here is your daily teaching schedule, pending homework submissions for evaluation, and scheduled live lectures.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button
            onClick={() => setPdfModalOpen(true)}
            className="btn btn-outline"
            style={{
              background: '#FFFFFF',
              color: '#1E3A8A',
              borderColor: '#FFFFFF',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              fontWeight: 700
            }}
          >
            <Printer size={16} />
            <span>Generate Results PDF</span>
          </button>
          <Link to="/teacher/attendance" className="btn btn-outline" style={{ background: '#FFFFFF', color: '#1E3A8A', borderColor: '#FFFFFF' }}>
            <ClipboardCheck size={16} />
            <span>Mark Roll Call</span>
          </Link>
          <Link to="/teacher/assignments" className="btn btn-primary" style={{ background: '#F97316', borderColor: '#F97316' }}>
            <PlusCircle size={16} />
            <span>New Assignment</span>
          </Link>
        </div>
      </div>

      {/* Metrics Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: '#2563EB', marginBottom: '0.5rem' }}>
            <Users size={18} />
            <span style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase' }}>Assigned Classes</span>
          </div>
          <div style={{ fontSize: '1.9rem', fontWeight: 800, color: '#0F172A' }}>
            {summary.assigned_classes_count || 0}
          </div>
        </div>

        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: '#16A34A', marginBottom: '0.5rem' }}>
            <Calendar size={18} />
            <span style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase' }}>Today's Periods</span>
          </div>
          <div style={{ fontSize: '1.9rem', fontWeight: 800, color: '#16A34A' }}>
            {summary.today_classes_count || 0}
          </div>
        </div>

        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: '#D97706', marginBottom: '0.5rem' }}>
            <FileText size={18} />
            <span style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase' }}>Pending Grading</span>
          </div>
          <div style={{ fontSize: '1.9rem', fontWeight: 800, color: '#D97706' }}>
            {summary.pending_grading_count || 0}
          </div>
        </div>

        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: '#9333EA', marginBottom: '0.5rem' }}>
            <Video size={18} />
            <span style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase' }}>Upcoming Live</span>
          </div>
          <div style={{ fontSize: '1.9rem', fontWeight: 800, color: '#9333EA' }}>
            {summary.upcoming_live_sessions || 0}
          </div>
        </div>

        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: '#2563EB', marginBottom: '0.5rem' }}>
            <FileCheck2 size={18} />
            <span style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase' }}>Mock Test Requests</span>
          </div>
          <div style={{ fontSize: '1.9rem', fontWeight: 800, color: '#2563EB' }}>
            {joinRequests.filter(r => r.status === 'PENDING').length}
          </div>
        </div>
      </div>

      {/* Mock Test Requests Section */}
      <div className="card" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
          marginBottom: '1.25rem',
          borderBottom: '1px solid #F1F5F9',
          paddingBottom: '1rem'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0F172A', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <ShieldCheck size={20} style={{ color: '#2563EB' }} />
                <span>Mock Test Requests</span>
              </h3>
              {joinRequests.filter(r => r.status === 'PENDING').length > 0 && (
                <span style={{
                  background: '#FEF3C7',
                  color: '#B45309',
                  border: '1px solid #FCD34D',
                  padding: '0.2rem 0.6rem',
                  borderRadius: '999px',
                  fontSize: '0.75rem',
                  fontWeight: 800
                }}>
                  {joinRequests.filter(r => r.status === 'PENDING').length} PENDING
                </span>
              )}
            </div>
            <p style={{ color: '#64748B', fontSize: '0.85rem', margin: '0.25rem 0 0' }}>
              Review and approve candidates requesting admission to scheduled examination rooms.
            </p>
          </div>

          {/* Filter Pills */}
          <div style={{ display: 'flex', gap: '0.4rem', background: '#F1F5F9', padding: '0.25rem', borderRadius: '8px' }}>
            {[
              { id: 'PENDING', label: 'Pending' },
              { id: 'APPROVED', label: 'Approved' },
              { id: 'REJECTED', label: 'Rejected' },
              { id: 'ALL', label: 'All' }
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setRequestFilter(f.id)}
                style={{
                  padding: '0.35rem 0.75rem',
                  borderRadius: '6px',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  border: 'none',
                  background: requestFilter === f.id ? '#FFFFFF' : 'transparent',
                  color: requestFilter === f.id ? '#0F172A' : '#64748B',
                  boxShadow: requestFilter === f.id ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Requests Table */}
        {joinRequests.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2.5rem 1rem', color: '#64748B' }}>
            <FileCheck2 size={36} style={{ color: '#CBD5E1', margin: '0 auto 0.75rem', display: 'block' }} />
            <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>No {requestFilter.toLowerCase()} join requests found.</div>
            <div style={{ fontSize: '0.82rem', color: '#94A3B8', marginTop: '0.25rem' }}>
              Newly submitted student requests will automatically appear here in real time.
            </div>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
              <thead>
                <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#64748B', fontSize: '0.76rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  <th style={{ padding: '0.75rem 1rem', fontWeight: 700 }}>Student</th>
                  <th style={{ padding: '0.75rem 1rem', fontWeight: 700 }}>Mock Test</th>
                  <th style={{ padding: '0.75rem 1rem', fontWeight: 700 }}>Requested</th>
                  <th style={{ padding: '0.75rem 1rem', fontWeight: 700 }}>Status</th>
                  <th style={{ padding: '0.75rem 1rem', fontWeight: 700, textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {joinRequests.map((reqItem) => {
                  const isProcessing = actionProcessingId === reqItem.id;
                  const isPending = reqItem.status === 'PENDING';
                  const isApproved = reqItem.status === 'APPROVED';
                  const isRejected = reqItem.status === 'REJECTED';

                  return (
                    <tr
                      key={reqItem.id}
                      style={{
                        borderBottom: '1px solid #F1F5F9',
                        transition: 'background 0.15s ease'
                      }}
                    >
                      {/* Student Info */}
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <div style={{ fontWeight: 700, color: '#0F172A', fontSize: '0.92rem' }}>
                          {reqItem.student_name || 'Student'}
                        </div>
                        {reqItem.student_email && (
                          <div style={{ fontSize: '0.78rem', color: '#64748B' }}>
                            {reqItem.student_email}
                          </div>
                        )}
                      </td>

                      {/* Mock Test */}
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <div style={{ fontWeight: 600, color: '#1E293B' }}>
                          {reqItem.mock_test_title || 'Mock Examination'}
                        </div>
                        {reqItem.mock_test_subject && (
                          <span style={{ fontSize: '0.74rem', color: '#2563EB', background: '#EFF6FF', padding: '0.15rem 0.45rem', borderRadius: '4px', fontWeight: 600, display: 'inline-block', marginTop: '0.2rem' }}>
                            {reqItem.mock_test_subject}
                          </span>
                        )}
                      </td>

                      {/* Requested At */}
                      <td style={{ padding: '0.85rem 1rem', color: '#64748B', fontSize: '0.82rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                          <Clock size={13} style={{ color: '#94A3B8' }} />
                          <span>{formatRequestTime(reqItem.requested_at)}</span>
                        </div>
                      </td>

                      {/* Status */}
                      <td style={{ padding: '0.85rem 1rem' }}>
                        {isPending ? (
                          <span style={{
                            background: '#FEF3C7',
                            color: '#B45309',
                            border: '1px solid #FCD34D',
                            padding: '0.25rem 0.6rem',
                            borderRadius: '999px',
                            fontSize: '0.74rem',
                            fontWeight: 800,
                            letterSpacing: '0.04em'
                          }}>
                            PENDING
                          </span>
                        ) : isApproved ? (
                          <span style={{
                            background: '#DCFCE7',
                            color: '#15803D',
                            border: '1px solid #86EFAC',
                            padding: '0.25rem 0.6rem',
                            borderRadius: '999px',
                            fontSize: '0.74rem',
                            fontWeight: 800,
                            letterSpacing: '0.04em'
                          }}>
                            APPROVED
                          </span>
                        ) : isRejected ? (
                          <div>
                            <span style={{
                              background: '#FEE2E2',
                              color: '#B91C1C',
                              border: '1px solid #FCA5A5',
                              padding: '0.25rem 0.6rem',
                              borderRadius: '999px',
                              fontSize: '0.74rem',
                              fontWeight: 800,
                              letterSpacing: '0.04em'
                            }}>
                              REJECTED
                            </span>
                            {reqItem.rejection_reason && (
                              <div style={{ fontSize: '0.72rem', color: '#991B1B', marginTop: '0.25rem' }}>
                                Reason: {reqItem.rejection_reason}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span style={{ fontSize: '0.75rem', color: '#64748B' }}>{reqItem.status}</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>
                        {isPending ? (
                          <div style={{ display: 'inline-flex', gap: '0.5rem', alignItems: 'center' }}>
                            <button
                              onClick={() => handleApprove(reqItem)}
                              disabled={isProcessing}
                              className="btn btn-sm"
                              style={{
                                background: '#16A34A',
                                color: '#FFFFFF',
                                border: 'none',
                                padding: '0.35rem 0.75rem',
                                fontSize: '0.78rem',
                                fontWeight: 700,
                                borderRadius: '6px',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.25rem',
                                cursor: isProcessing ? 'not-allowed' : 'pointer'
                              }}
                            >
                              <Check size={13} />
                              <span>{isProcessing ? 'Saving...' : 'Approve'}</span>
                            </button>

                            <button
                              onClick={() => openRejectModal(reqItem)}
                              disabled={isProcessing}
                              className="btn btn-sm btn-outline"
                              style={{
                                color: '#DC2626',
                                borderColor: '#FCA5A5',
                                background: '#FFFFFF',
                                padding: '0.35rem 0.75rem',
                                fontSize: '0.78rem',
                                fontWeight: 700,
                                borderRadius: '6px',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.25rem',
                                cursor: isProcessing ? 'not-allowed' : 'pointer'
                              }}
                            >
                              <X size={13} />
                              <span>Reject</span>
                            </button>
                          </div>
                        ) : isApproved ? (
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', color: '#16A34A', fontSize: '0.8rem', fontWeight: 700 }}>
                            <CheckCircle2 size={15} />
                            <span>Approved</span>
                          </div>
                        ) : isRejected ? (
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', color: '#DC2626', fontSize: '0.8rem', fontWeight: 600 }}>
                            <XCircle size={15} />
                            <span>Declined</span>
                          </div>
                        ) : (
                          <span style={{ color: '#94A3B8', fontSize: '0.8rem' }}>—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Faculty Allocation: My Subjects & My Batches */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        {/* My Subjects Card */}
        <div className="card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#0F172A', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
              <BookOpen size={18} style={{ color: '#2563EB' }} />
              <span>My Subjects</span>
            </h3>
            <span style={{ fontSize: '0.8rem', color: '#1E40AF', fontWeight: 700, background: '#DBEAFE', padding: '0.2rem 0.65rem', borderRadius: '999px' }}>
              {mySubjects.length} Assigned
            </span>
          </div>

          {mySubjects.length === 0 ? (
            <p style={{ color: '#64748B', fontSize: '0.875rem', textAlign: 'center', padding: '1.5rem 0' }}>
              No subjects assigned to you yet. Contact administrator.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              {mySubjects.map((sub) => (
                <div
                  key={sub.id}
                  style={{
                    padding: '0.85rem 1rem',
                    background: '#F8FAFC',
                    border: '1px solid #E2E8F0',
                    borderRadius: '8px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 700, color: '#0F172A', fontSize: '0.92rem' }}>
                      {sub.name}
                    </div>
                    {sub.code && (
                      <div style={{ fontSize: '0.78rem', color: '#64748B', marginTop: '0.15rem' }}>
                        Code: {sub.code}
                      </div>
                    )}
                  </div>
                  <span style={{ padding: '0.2rem 0.55rem', background: '#DCFCE7', color: '#15803D', border: '1px solid #86EFAC', borderRadius: '4px', fontSize: '0.74rem', fontWeight: 700 }}>
                    Active
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* My Batches Card */}
        <div className="card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#0F172A', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
              <Layers size={18} style={{ color: '#16A34A' }} />
              <span>My Batches</span>
            </h3>
            <span style={{ fontSize: '0.8rem', color: '#166534', fontWeight: 700, background: '#DCFCE7', padding: '0.2rem 0.65rem', borderRadius: '999px' }}>
              {myBatches.length} Batches
            </span>
          </div>

          {myBatches.length === 0 ? (
            <p style={{ color: '#64748B', fontSize: '0.875rem', textAlign: 'center', padding: '1.5rem 0' }}>
              No batches assigned to you yet. Contact administrator.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              {myBatches.map((b) => (
                <div
                  key={b.id || b.name}
                  style={{
                    padding: '0.85rem 1rem',
                    background: '#F0FDF4',
                    border: '1px solid #BBF7D0',
                    borderRadius: '8px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 700, color: '#166534', fontSize: '0.92rem' }}>
                      {b.name}
                    </div>
                    {b.className && b.className !== b.name && (
                      <div style={{ fontSize: '0.78rem', color: '#15803D', marginTop: '0.15rem' }}>
                        Class: {b.className}
                      </div>
                    )}
                  </div>
                  <Link
                    to="/teacher/classes"
                    style={{ fontSize: '0.78rem', color: '#166534', fontWeight: 600, textDecoration: 'none' }}
                  >
                    View Roster →
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Main Grid: Today's Schedule & Live Classes */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        {/* Today's Schedule */}
        <div className="card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#0F172A', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Clock size={18} style={{ color: '#2563EB' }} />
              <span>Today's Class Schedule</span>
            </h3>
            <Link to="/teacher/timetable" style={{ fontSize: '0.8rem', color: '#2563EB', fontWeight: 600 }}>
              Full Week →
            </Link>
          </div>

          {todaySchedule.length === 0 ? (
            <p style={{ color: '#64748B', fontSize: '0.875rem', textAlign: 'center', padding: '1.5rem 0' }}>
              No periods scheduled for today.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {todaySchedule.map((entry) => (
                <div
                  key={entry.id}
                  style={{
                    padding: '0.85rem 1rem',
                    background: '#F8FAFC',
                    border: '1px solid #E2E8F0',
                    borderRadius: '8px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 700, color: '#0F172A', fontSize: '0.92rem' }}>
                      {entry.subject_name || 'Subject'}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#64748B', marginTop: '0.2rem' }}>
                      {entry.class_name} {entry.batch_name ? `(${entry.batch_name})` : ''} {entry.room ? `• ${entry.room}` : ''}
                    </div>
                  </div>
                  <span style={{ padding: '0.25rem 0.6rem', background: '#EFF6FF', color: '#1D4ED8', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 600 }}>
                    {entry.start_time.slice(0, 5)} - {entry.end_time.slice(0, 5)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Assigned Classes Quick View */}
        <div className="card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#0F172A', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <GraduationCap size={18} style={{ color: '#16A34A' }} />
              <span>Assigned Divisions</span>
            </h3>
            <Link to="/teacher/classes" style={{ fontSize: '0.8rem', color: '#2563EB', fontWeight: 600 }}>
              View Rosters →
            </Link>
          </div>

          {assignedClasses.length === 0 ? (
            <p style={{ color: '#64748B', fontSize: '0.875rem', textAlign: 'center', padding: '1.5rem 0' }}>
              No subjects or classes assigned yet. Contact administrator.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {assignedClasses.map((ac) => (
                <div
                  key={ac.id}
                  style={{
                    padding: '0.85rem 1rem',
                    background: '#F0FDF4',
                    border: '1px solid #BBF7D0',
                    borderRadius: '8px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 700, color: '#166534', fontSize: '0.92rem' }}>
                      {ac.subject_name}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#4B5563', marginTop: '0.2rem' }}>
                      {ac.class_name} {ac.batch_name ? `• ${ac.batch_name}` : ''}
                    </div>
                  </div>
                  <Link
                    to="/teacher/attendance"
                    className="btn btn-sm btn-outline"
                    style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem', background: '#FFFFFF', borderColor: '#BBF7D0', color: '#166534' }}
                  >
                    Attendance
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Reject Join Request Modal Dialog */}
      {rejectModal.open && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '1rem'
        }}>
          <div style={{
            background: '#FFFFFF',
            borderRadius: '16px',
            maxWidth: '480px',
            width: '100%',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2), 0 10px 10px -5px rgba(0, 0, 0, 0.1)',
            overflow: 'hidden'
          }}>
            <div style={{
              padding: '1.25rem 1.5rem',
              borderBottom: '1px solid #E2E8F0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <AlertCircle size={20} style={{ color: '#DC2626' }} />
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, color: '#0F172A' }}>
                  Reject Join Request
                </h3>
              </div>
              <button
                onClick={() => setRejectModal({ open: false, request: null, reason: '' })}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}
                aria-label="Close dialog"
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ padding: '1.5rem' }}>
              <p style={{ fontSize: '0.88rem', color: '#475569', marginBottom: '1rem', lineHeight: 1.5 }}>
                Decline admission for candidate <strong>{rejectModal.request?.student_name}</strong> to examination <strong>{rejectModal.request?.mock_test_title}</strong>.
              </p>

              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '0.4rem' }}>
                Rejection reason:
              </label>
              <textarea
                rows={3}
                value={rejectModal.reason}
                onChange={(e) => setRejectModal(prev => ({ ...prev, reason: e.target.value }))}
                placeholder="e.g. Please wait until the scheduled start time."
                style={{
                  width: '100%',
                  padding: '0.65rem 0.85rem',
                  borderRadius: '8px',
                  border: '1px solid #CBD5E1',
                  fontSize: '0.88rem',
                  outline: 'none',
                  fontFamily: 'inherit',
                  resize: 'vertical',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div style={{
              padding: '1rem 1.5rem',
              background: '#F8FAFC',
              borderTop: '1px solid #E2E8F0',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '0.75rem'
            }}>
              <button
                onClick={() => setRejectModal({ open: false, request: null, reason: '' })}
                className="btn btn-secondary"
                style={{ padding: '0.45rem 1rem', fontSize: '0.84rem' }}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmReject}
                disabled={actionProcessingId === rejectModal.request?.id}
                className="btn btn-primary"
                style={{
                  padding: '0.45rem 1.15rem',
                  fontSize: '0.84rem',
                  fontWeight: 700,
                  background: '#DC2626',
                  borderColor: '#DC2626'
                }}
              >
                {actionProcessingId === rejectModal.request?.id ? 'Rejecting...' : 'Reject Request'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Generate Results PDF Modal */}
      {pdfModalOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '1rem'
        }}>
          <div style={{
            background: '#FFFFFF',
            borderRadius: '12px',
            width: '100%',
            maxWidth: '520px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)',
            border: '1px solid #E2E8F0',
            overflow: 'hidden'
          }}>
            <div style={{
              padding: '1.25rem 1.5rem',
              borderBottom: '1px solid #E2E8F0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: '#F8FAFC'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Printer size={18} color="#2563EB" />
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: 'var(--color-navy, #0F172A)' }}>
                  Generate Results PDF
                </h3>
              </div>
              <button
                onClick={() => setPdfModalOpen(false)}
                style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer', padding: '0.2rem' }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <p style={{ margin: 0, fontSize: '0.88rem', color: '#64748B', lineHeight: 1.5 }}>
                Generate ONE consolidated PDF report containing scores, percentages, and breakdowns for all authorized students in the selected test.
              </p>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                  Select Examination Test *
                </label>
                <select
                  value={selectedPdfTest}
                  onChange={(e) => setSelectedPdfTest(e.target.value)}
                  disabled={teacherTests.length === 0}
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem',
                    borderRadius: '6px',
                    border: '1px solid #CBD5E1',
                    fontSize: '0.9rem',
                    background: '#FFFFFF',
                    color: '#0F172A',
                    outline: 'none'
                  }}
                >
                  {teacherTests.length === 0 ? (
                    <option value="" disabled>No options</option>
                  ) : (
                    <>
                      <option value="">-- Choose Mock Test --</option>
                      {teacherTests.map(t => (
                        <option key={t.id} value={t.id}>
                          {t.title} ({t.subject || 'General'})
                        </option>
                      ))}
                    </>
                  )}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                  Select Batch (Optional)
                </label>
                <select
                  value={selectedPdfBatch}
                  onChange={(e) => setSelectedPdfBatch(e.target.value)}
                  disabled={teacherBatches.length === 0}
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem',
                    borderRadius: '6px',
                    border: '1px solid #CBD5E1',
                    fontSize: '0.9rem',
                    background: '#FFFFFF',
                    color: '#0F172A',
                    outline: 'none'
                  }}
                >
                  {teacherBatches.length === 0 ? (
                    <option value="" disabled>No options</option>
                  ) : (
                    <>
                      <option value="">All Enrolled Batches</option>
                      {teacherBatches.map(b => (
                        <option key={b.id} value={b.id}>
                          {b.name} ({b.course_title || b.course_id || 'Batch'})
                        </option>
                      ))}
                    </>
                  )}
                </select>
              </div>
            </div>

            <div style={{
              padding: '1rem 1.5rem',
              background: '#F8FAFC',
              borderTop: '1px solid #E2E8F0',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '0.75rem'
            }}>
              <button
                onClick={() => setPdfModalOpen(false)}
                className="btn btn-secondary"
                style={{ padding: '0.45rem 1rem', fontSize: '0.84rem' }}
              >
                Cancel
              </button>
              <button
                onClick={handleGeneratePdf}
                disabled={generatingPdf || !selectedPdfTest}
                className="btn btn-primary"
                style={{
                  padding: '0.45rem 1.25rem',
                  fontSize: '0.84rem',
                  fontWeight: 700,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  background: '#2563EB',
                  borderColor: '#2563EB'
                }}
              >
                <Download size={14} />
                <span>{generatingPdf ? 'Generating PDF Report...' : 'Download PDF Report'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
export default TeacherDashboard;
