import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';
import {
  ShieldAlert,
  Users,
  BookOpen,
  Award,
  Database,
  PlusCircle,
  Clock,
  ArrowRight,
  TrendingUp,
  Layers,
  HelpCircle
} from 'lucide-react';

export function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

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

  return (
    <div style={{ padding: '3rem 0 5rem' }}>
      <div className="container">
        {/* Admin Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1rem',
            marginBottom: '2.5rem',
            paddingBottom: '1.25rem',
            borderBottom: '1px solid var(--color-border)'
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
              <span className="badge" style={{ background: '#FEF2F2', color: '#DC2626', border: '1px solid #FCA5A5' }}>
                ADMINISTRATOR PORTAL
              </span>
            </div>
            <h1 style={{ fontSize: '2.2rem' }}>Platform Control Center</h1>
            <p style={{ fontSize: '0.95rem', color: 'var(--color-text-secondary)' }}>
              Manage curriculum courses, syllabus lessons, server-graded quizzes, and registered learners.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <Link to="/admin/batches" className="btn btn-primary" style={{ background: '#2563EB', borderColor: '#2563EB' }}>
              <Layers size={16} />
              <span>Batches & Allocations</span>
            </Link>
            <Link to="/admin/courses" className="btn btn-outline">
              <PlusCircle size={16} />
              <span>Manage Courses</span>
            </Link>
            <Link to="/admin/quizzes" className="btn btn-outline">
              <Award size={16} />
              <span>Create Quiz</span>
            </Link>
            <Link to="/admin/users" className="btn btn-outline">
              <Users size={16} />
              <span>View Users</span>
            </Link>
          </div>
        </div>

        {/* Top KPI Metrics */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1.5rem',
            marginBottom: '2.5rem'
          }}
        >
          <div className="card" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>Active Batches</span>
              <Layers size={20} style={{ color: '#0284C7' }} />
            </div>
            <div style={{ fontSize: '2.2rem', fontWeight: 800, color: 'var(--color-navy)' }}>
              {stats?.batch_count ?? 0}
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Assigned student cohorts</span>
          </div>

          <div className="card" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>Students</span>
              <Users size={20} style={{ color: 'var(--color-orange)' }} />
            </div>
            <div style={{ fontSize: '2.2rem', fontWeight: 800, color: 'var(--color-navy)' }}>
              {stats?.student_count || stats?.total_students || 0}
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Registered learners</span>
          </div>

          <div className="card" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>Published Courses</span>
              <BookOpen size={20} style={{ color: '#2563EB' }} />
            </div>
            <div style={{ fontSize: '2.2rem', fontWeight: 800, color: 'var(--color-navy)' }}>
              {stats?.course_count || 0}
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Curriculum tracks</span>
          </div>

          <div className="card" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>Quizzes</span>
              <Award size={20} style={{ color: '#10B981' }} />
            </div>
            <div style={{ fontSize: '2.2rem', fontWeight: 800, color: 'var(--color-navy)' }}>
              {stats?.quiz_count || 0}
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Assessments created</span>
          </div>

          <div className="card" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>Total Attempts</span>
              <TrendingUp size={20} style={{ color: '#7C3AED' }} />
            </div>
            <div style={{ fontSize: '2.2rem', fontWeight: 800, color: 'var(--color-navy)' }}>
              {stats?.attempt_count || 0}
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Evaluations recorded</span>
          </div>
        </div>

        {/* Database Engine Status Banner */}
        <div
          className="card"
          style={{
            padding: '1.25rem 1.75rem',
            marginBottom: '2.5rem',
            background: 'var(--color-bg-alt)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1rem'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <Database size={22} style={{ color: 'var(--color-orange)' }} />
            <div>
              <strong style={{ fontSize: '0.95rem' }}>
                Database Driver: {stats?.database?.type || 'PostgreSQL'}
              </strong>
              <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                Connection Target: <code>{stats?.database?.databaseUrl || 'postgresql://...'}</code>
              </div>
            </div>
          </div>
          <span className={`badge ${stats?.database?.isPostgres ? 'badge-success' : 'badge-navy'}`}>
            {stats?.database?.isPostgres ? 'PostgreSQL Active' : 'Memory Store Active'}
          </span>
        </div>

        {/* Recent Platform Activity */}
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '1.15rem' }}>Recent Assessment Submissions</h3>
            <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Live Student Activity</span>
          </div>

          {(!stats?.recent_activity || stats.recent_activity.length === 0) ? (
            <div style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
              No recent student activity recorded yet.
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
                <thead>
                  <tr style={{ background: 'var(--color-bg-alt)', borderBottom: '1px solid var(--color-border)' }}>
                    <th style={{ padding: '0.85rem 1.25rem' }}>Student</th>
                    <th style={{ padding: '0.85rem 1.25rem' }}>Assessment</th>
                    <th style={{ padding: '0.85rem 1.25rem' }}>Score</th>
                    <th style={{ padding: '0.85rem 1.25rem' }}>Submitted</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.recent_activity.map(item => (
                    <tr key={item.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                      <td style={{ padding: '0.85rem 1.25rem', fontWeight: 600 }}>{item.student_name}</td>
                      <td style={{ padding: '0.85rem 1.25rem' }}>{item.quiz_title}</td>
                      <td style={{ padding: '0.85rem 1.25rem' }}>
                        <span className="badge badge-orange">
                          {item.score} / {item.total_questions}
                        </span>
                      </td>
                      <td style={{ padding: '0.85rem 1.25rem', color: 'var(--color-text-muted)' }}>
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
    </div>
  );
}
