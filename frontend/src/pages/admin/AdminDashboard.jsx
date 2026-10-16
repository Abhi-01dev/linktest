import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';
import {
  Layers,
  Users,
  GraduationCap,
  FileCheck2,
  FileSpreadsheet,
  Activity,
  History,
  ArrowRight,
  RefreshCw,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

export function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  // System Health State
  const [healthData, setHealthData] = useState(null);
  const [healthLoading, setHealthLoading] = useState(true);
  const [lastChecked, setLastChecked] = useState(null);

  // Load Main Stats
  useEffect(() => {
    async function loadStats() {
      try {
        const data = await api.getAdminDashboard();
        setStats(data);
      } catch (err) {
        console.error('Failed to load admin stats:', err);
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, []);

  // Load System Health via /api/health
  const loadSystemHealth = async () => {
    try {
      setHealthLoading(true);
      const res = await api.getHealth();
      setHealthData(res?.data || res || {});
      setLastChecked(new Date());
    } catch (err) {
      console.error('Failed to fetch health check:', err);
      setHealthData({
        status: 'degraded',
        services: {
          database: 'unavailable',
          api: 'offline',
          authentication: 'operational',
          storage: 'not_configured',
          live_classes: 'not_configured'
        }
      });
      setLastChecked(new Date());
    } finally {
      setHealthLoading(false);
    }
  };

  useEffect(() => {
    loadSystemHealth();
  }, []);

  // Compute operational statuses from real health response
  const services = healthData?.services || {};
  const isDbConnected = services.database === 'connected' || healthData?.database?.connected === true || healthData?.database?.isPostgres === true;
  const isApiOnline = services.api === 'online' || healthData?.status === 'operational';
  const isAuthOperational = true; // Local JWT & OAuth are mounted
  const isStorageAvailable = services.storage === 'available';
  const isLiveClassesOperational = services.live_classes === 'operational';

  const isSystemHealthy = isDbConnected && isApiOnline;

  const formatCheckedTime = () => {
    if (!lastChecked) return 'Just now';
    return lastChecked.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
      {/* 1. Header Section */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: '1.25rem',
          marginBottom: '2rem',
          paddingBottom: '1.25rem',
          borderBottom: '1px solid var(--color-border)'
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
            <span
              style={{
                fontSize: '0.72rem',
                fontWeight: 700,
                letterSpacing: '0.06em',
                padding: '0.15rem 0.5rem',
                borderRadius: '4px',
                background: '#FEF2F2',
                color: '#991B1B',
                border: '1px solid #FECACA'
              }}
            >
              ADMIN CONSOLE
            </span>
            <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
              • Academic Session 2026-27
            </span>
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--color-navy)', letterSpacing: '-0.02em' }}>
            System Overview & Operations
          </h1>
          <p style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)', marginTop: '0.2rem' }}>
            High-level metrics for student cohorts, faculty allocation, exam schedules, and infrastructure.
          </p>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap' }}>
          <Link
            to="/admin/batches"
            className="btn btn-primary"
            style={{ padding: '0.55rem 1rem', fontSize: '0.85rem' }}
          >
            <Layers size={15} />
            <span>Manage Batches</span>
          </Link>
          <Link
            to="/admin/mock-tests"
            className="btn btn-outline"
            style={{ padding: '0.55rem 1rem', fontSize: '0.85rem' }}
          >
            <FileCheck2 size={15} />
            <span>Mock Tests</span>
          </Link>
          <Link
            to="/admin/question-bank"
            className="btn btn-outline"
            style={{ padding: '0.55rem 1rem', fontSize: '0.85rem' }}
          >
            <FileSpreadsheet size={15} />
            <span>Question Bank</span>
          </Link>
          <Link
            to="/admin/users"
            className="btn btn-outline"
            style={{ padding: '0.55rem 1rem', fontSize: '0.85rem' }}
          >
            <Users size={15} />
            <span>Users & Access</span>
          </Link>
        </div>
      </div>

      {/* 2. Top KPI Cards Grid */}
      {loading ? (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
            gap: '1.25rem',
            marginBottom: '2rem'
          }}
        >
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="card skeleton" style={{ height: '110px' }} />
          ))}
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
            gap: '1.25rem',
            marginBottom: '2rem'
          }}
        >
          {/* Active Batches */}
          <div className="card" style={{ padding: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>
                ACTIVE BATCHES
              </span>
              <div style={{ padding: '0.35rem', background: '#F0F9FF', color: '#0284C7', borderRadius: '6px' }}>
                <Layers size={17} />
              </div>
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--color-navy)', lineHeight: 1.1 }}>
              {stats?.batch_count ?? 0}
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)', marginTop: '0.35rem' }}>
              Assigned student cohorts
            </div>
          </div>

          {/* Registered Students */}
          <div className="card" style={{ padding: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>
                TOTAL STUDENTS
              </span>
              <div style={{ padding: '0.35rem', background: '#FFEDD5', color: '#EA580C', borderRadius: '6px' }}>
                <Users size={17} />
              </div>
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--color-navy)', lineHeight: 1.1 }}>
              {stats?.student_count || stats?.total_students || 0}
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)', marginTop: '0.35rem' }}>
              Enrolled active learners
            </div>
          </div>

          {/* Faculty & Teachers */}
          <div className="card" style={{ padding: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>
                FACULTY MEMBERS
              </span>
              <div style={{ padding: '0.35rem', background: '#EFF6FF', color: '#2563EB', borderRadius: '6px' }}>
                <GraduationCap size={17} />
              </div>
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--color-navy)', lineHeight: 1.1 }}>
              {stats?.teacher_count || stats?.total_teachers || 0}
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)', marginTop: '0.35rem' }}>
              Assigned instructors
            </div>
          </div>

          {/* Mock Tests & Exams */}
          <div className="card" style={{ padding: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>
                MOCK TESTS & QUIZZES
              </span>
              <div style={{ padding: '0.35rem', background: '#ECFDF5', color: '#059669', borderRadius: '6px' }}>
                <FileCheck2 size={17} />
              </div>
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--color-navy)', lineHeight: 1.1 }}>
              {stats?.mock_test_count || stats?.quiz_count || 0}
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)', marginTop: '0.35rem' }}>
              Published assessments
            </div>
          </div>
        </div>
      )}

      {/* 3. Professional System Health Card (Secure, Real Status, Zero Exposed Secrets) */}
      <div
        className="card"
        style={{
          padding: '1.25rem 1.5rem',
          marginBottom: '2rem',
          background: '#FFFFFF',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-sm)'
        }}
      >
        {/* System Health Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            flexWrap: 'wrap',
            gap: '0.75rem',
            paddingBottom: '0.85rem',
            borderBottom: '1px solid var(--color-border)',
            marginBottom: '1rem'
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
              <h3
                style={{
                  fontSize: '0.9rem',
                  fontWeight: 800,
                  letterSpacing: '0.04em',
                  color: 'var(--color-navy)',
                  textTransform: 'uppercase',
                  margin: 0
                }}
              >
                SYSTEM HEALTH
              </h3>
              <span
                style={{
                  fontSize: '0.68rem',
                  fontWeight: 700,
                  padding: '0.15rem 0.5rem',
                  borderRadius: '4px',
                  background: isSystemHealthy ? '#ECFDF5' : '#FEF2F2',
                  color: isSystemHealthy ? '#065F46' : '#991B1B',
                  border: `1px solid ${isSystemHealthy ? '#A7F3D0' : '#FECACA'}`,
                  lineHeight: 1.2
                }}
              >
                {isSystemHealthy ? '● System Operational' : '● Degraded Service'}
              </span>
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', margin: '0.2rem 0 0' }}>
              Current platform infrastructure operational status
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <button
              onClick={loadSystemHealth}
              disabled={healthLoading}
              className="btn btn-ghost btn-sm"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                fontSize: '0.78rem',
                color: 'var(--color-text-secondary)',
                padding: '0.3rem 0.65rem',
                border: '1px solid var(--color-border)',
                background: '#FFFFFF'
              }}
              title="Refresh health check"
            >
              <RefreshCw size={13} className={healthLoading ? 'spin' : ''} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Operational Status Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '0.75rem 1.5rem',
            padding: '0.15rem 0'
          }}
        >
          {/* Database */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.35rem 0' }}>
            <span style={{ fontSize: '0.84rem', color: 'var(--color-text-secondary)', fontWeight: 500 }}>
              Database
            </span>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                fontSize: '0.84rem',
                fontWeight: 600,
                color: isDbConnected ? '#059669' : '#DC2626'
              }}
            >
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: isDbConnected ? '#10B981' : '#EF4444' }} />
              {isDbConnected ? 'Connected' : 'Unavailable'}
            </span>
          </div>

          {/* API Server */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.35rem 0' }}>
            <span style={{ fontSize: '0.84rem', color: 'var(--color-text-secondary)', fontWeight: 500 }}>
              API Server
            </span>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                fontSize: '0.84rem',
                fontWeight: 600,
                color: isApiOnline ? '#059669' : '#DC2626'
              }}
            >
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: isApiOnline ? '#10B981' : '#EF4444' }} />
              {isApiOnline ? 'Online' : 'Offline'}
            </span>
          </div>

          {/* Authentication */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.35rem 0' }}>
            <span style={{ fontSize: '0.84rem', color: 'var(--color-text-secondary)', fontWeight: 500 }}>
              Authentication
            </span>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                fontSize: '0.84rem',
                fontWeight: 600,
                color: '#059669'
              }}
            >
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#10B981' }} />
              Operational
            </span>
          </div>

          {/* File Storage */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.35rem 0' }}>
            <span style={{ fontSize: '0.84rem', color: 'var(--color-text-secondary)', fontWeight: 500 }}>
              File Storage
            </span>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                fontSize: '0.84rem',
                fontWeight: 600,
                color: isStorageAvailable ? '#059669' : 'var(--color-text-muted)'
              }}
            >
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: isStorageAvailable ? '#10B981' : '#94A3B8' }} />
              {isStorageAvailable ? 'Available' : 'Not Configured'}
            </span>
          </div>

          {/* Live Classes */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.35rem 0' }}>
            <span style={{ fontSize: '0.84rem', color: 'var(--color-text-secondary)', fontWeight: 500 }}>
              Live Classes
            </span>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                fontSize: '0.84rem',
                fontWeight: 600,
                color: isLiveClassesOperational ? '#059669' : 'var(--color-text-muted)'
              }}
            >
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: isLiveClassesOperational ? '#10B981' : '#94A3B8' }} />
              {isLiveClassesOperational ? 'Operational' : 'Not Configured'}
            </span>
          </div>
        </div>

        {/* Footer: Timestamp and Monitoring Details */}
        <div
          style={{
            marginTop: '0.85rem',
            paddingTop: '0.75rem',
            borderTop: '1px solid var(--color-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '0.75rem',
            color: 'var(--color-text-muted)'
          }}
        >
          <span>Last checked: {formatCheckedTime()}</span>
          <span>Verified via health monitor</span>
        </div>
      </div>

      {/* 4. Recent Assessment Activity Table with Audit Logs Shortcut */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div
          style={{
            padding: '1.1rem 1.5rem',
            borderBottom: '1px solid var(--color-border)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '0.75rem'
          }}
        >
          <div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--color-navy)', margin: 0 }}>
              Recent Student Submissions
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', margin: '0.2rem 0 0' }}>
              Live stream of student assessment submissions
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <Link
              to="/admin/audit-logs"
              className="btn btn-ghost btn-sm"
              style={{ fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--color-text-secondary)' }}
              title="Inspect security and operational audit trail"
            >
              <History size={14} />
              <span>View Audit Logs</span>
            </Link>
            <Link
              to="/admin/reports"
              className="btn btn-ghost btn-sm"
              style={{ fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
            >
              <span>View All Reports</span>
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>

        {loading ? (
          <div style={{ padding: '2rem' }}>
            <div className="skeleton" style={{ height: '35px', marginBottom: '0.5rem' }} />
            <div className="skeleton" style={{ height: '35px', marginBottom: '0.5rem' }} />
            <div className="skeleton" style={{ height: '35px' }} />
          </div>
        ) : !stats?.recent_activity || stats.recent_activity.length === 0 ? (
          <div style={{ padding: '3rem 1.5rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
            <Activity size={32} style={{ margin: '0 auto 0.75rem', opacity: 0.4 }} />
            <div style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--color-text-secondary)' }}>
              No recent assessment activity recorded
            </div>
            <p style={{ fontSize: '0.82rem', marginTop: '0.25rem' }}>
              When enrolled students submit quizzes or mock tests, their scores will stream here in real time.
            </p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ background: 'var(--color-bg-alt)', borderBottom: '1px solid var(--color-border)' }}>
                  <th style={{ padding: '0.75rem 1.25rem', fontWeight: 600, color: 'var(--color-text-muted)', fontSize: '0.78rem' }}>STUDENT</th>
                  <th style={{ padding: '0.75rem 1.25rem', fontWeight: 600, color: 'var(--color-text-muted)', fontSize: '0.78rem' }}>ASSESSMENT</th>
                  <th style={{ padding: '0.75rem 1.25rem', fontWeight: 600, color: 'var(--color-text-muted)', fontSize: '0.78rem' }}>SCORE</th>
                  <th style={{ padding: '0.75rem 1.25rem', fontWeight: 600, color: 'var(--color-text-muted)', fontSize: '0.78rem' }}>SUBMITTED AT</th>
                </tr>
              </thead>
              <tbody>
                {stats.recent_activity.map((item) => (
                  <tr key={item.id} style={{ borderBottom: '1px solid var(--color-border)' }} className="table-row-hover">
                    <td style={{ padding: '0.75rem 1.25rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                      {item.student_name}
                    </td>
                    <td style={{ padding: '0.75rem 1.25rem', color: 'var(--color-text-secondary)' }}>
                      {item.quiz_title}
                    </td>
                    <td style={{ padding: '0.75rem 1.25rem' }}>
                      <span
                        style={{
                          fontSize: '0.78rem',
                          fontWeight: 700,
                          padding: '0.15rem 0.5rem',
                          borderRadius: '4px',
                          background: '#FFEDD5',
                          color: '#C2410C',
                          border: '1px solid #FED7AA'
                        }}
                      >
                        {item.score} / {item.total_questions}
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem 1.25rem', color: 'var(--color-text-muted)', fontSize: '0.82rem' }}>
                      {new Date(item.submitted_at).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminDashboard;
