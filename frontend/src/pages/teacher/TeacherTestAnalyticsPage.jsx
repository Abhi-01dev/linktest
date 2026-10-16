// Teacher Mock Test Analytics & Candidate Performance Dashboard
// LinkTest Enterprise Examination Studio

import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../../services/api';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid
} from 'recharts';
import {
  ArrowLeft,
  Users,
  Award,
  TrendingUp,
  AlertTriangle,
  ShieldCheck,
  CheckCircle,
  Eye,
  Send,
  Download
} from 'lucide-react';

export function TeacherTestAnalyticsPage() {
  const { id } = useParams();

  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [releasing, setReleasing] = useState(false);
  const [generatingPdf, setGeneratingPdf] = useState(false);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const data = await api.getMockTestAnalytics(id);
      setAnalytics(data);
    } catch (err) {
      console.error('Failed to load analytics:', err);
      setError(err.message || 'Unable to retrieve test analytics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnalytics();
  }, [id]);

  const handleToggleRelease = async () => {
    setReleasing(true);
    try {
      await api.releaseMockTestResults(id, true);
      alert('Examination results successfully released to candidates!');
      await loadAnalytics();
    } catch (err) {
      alert(err.message || 'Failed to release results.');
    } finally {
      setReleasing(false);
    }
  };

  const handleDownloadPdf = async () => {
    setGeneratingPdf(true);
    try {
      await api.downloadTestResultsPdf(id);
    } catch (err) {
      alert(err.message || 'Failed to generate PDF report.');
    } finally {
      setGeneratingPdf(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '6rem' }}>
        <div className="spinner" style={{ margin: '0 auto 1rem' }}></div>
        <p>Loading assessment analytics and candidate roster...</p>
      </div>
    );
  }

  if (error || !analytics) {
    return (
      <div style={{ padding: '2rem', maxWidth: '600px', margin: '0 auto' }}>
        <div style={{ background: '#FEF2F2', border: '1px solid #EF4444', color: '#DC2626', padding: '1.5rem', borderRadius: '8px' }}>
          <h3>Analytics Error</h3>
          <p>{error || 'Analytics not available.'}</p>
          <Link to="/teacher/mock-tests" className="btn btn-secondary" style={{ marginTop: '1rem' }}>
            Back to Mock Tests
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '1100px', margin: '0 auto' }}>
      {/* Top Header */}
      <div style={{ marginBottom: '1.75rem' }}>
        <Link
          to="/teacher/mock-tests"
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
          <span>Back to Mock Tests Studio</span>
        </Link>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#2563EB', textTransform: 'uppercase' }}>
              ASSESSMENT PERFORMANCE & PROCTORING AUDIT
            </div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--color-navy)', margin: '0.2rem 0' }}>
              {analytics.title}
            </h1>
            <div style={{ fontSize: '0.88rem', color: 'var(--color-text-secondary)' }}>
              Subject: <strong>{analytics.subject}</strong> • Max Score: <strong>{analytics.total_marks} Marks</strong>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <button
              onClick={handleDownloadPdf}
              disabled={generatingPdf}
              className="btn btn-secondary"
              style={{ fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
            >
              <Download size={15} />
              <span>{generatingPdf ? 'Generating PDF...' : 'Generate Results PDF'}</span>
            </button>

            <button
              onClick={handleToggleRelease}
              disabled={releasing}
              className="btn btn-primary"
              style={{ fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '0.4rem', background: '#059669', borderColor: '#059669' }}
            >
              <Send size={15} />
              <span>{releasing ? 'Releasing...' : 'Release Results to Students'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: '1rem',
        marginBottom: '2rem'
      }}>
        <div style={{ background: '#FFFFFF', padding: '1.25rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#64748B', fontSize: '0.8rem', fontWeight: 700 }}>
            <Users size={16} style={{ color: '#2563EB' }} />
            <span>CANDIDATES</span>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--color-navy)', marginTop: '0.3rem' }}>
            {analytics.total_candidates}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748B' }}>Total enrolled submissions</div>
        </div>

        <div style={{ background: '#FFFFFF', padding: '1.25rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#64748B', fontSize: '0.8rem', fontWeight: 700 }}>
            <Award size={16} style={{ color: 'var(--color-orange)' }} />
            <span>AVERAGE SCORE</span>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#2563EB', marginTop: '0.3rem' }}>
            {analytics.average_score} <span style={{ fontSize: '0.9rem', color: '#64748B' }}>/ {analytics.total_marks}</span>
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748B' }}>High: {analytics.highest_score} • Low: {analytics.lowest_score}</div>
        </div>

        <div style={{ background: '#FFFFFF', padding: '1.25rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#64748B', fontSize: '0.8rem', fontWeight: 700 }}>
            <TrendingUp size={16} style={{ color: '#10B981' }} />
            <span>PASS PERCENTAGE</span>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#059669', marginTop: '0.3rem' }}>
            {analytics.pass_rate_percentage}%
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748B' }}>{analytics.pass_count} passed cutoff</div>
        </div>

        <div style={{ background: '#FFFFFF', padding: '1.25rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#64748B', fontSize: '0.8rem', fontWeight: 700 }}>
            <AlertTriangle size={16} style={{ color: '#EF4444' }} />
            <span>PROCTORING FLAGS</span>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 900, color: analytics.flagged_proctoring_count > 0 ? '#DC2626' : '#059669', marginTop: '0.3rem' }}>
            {analytics.flagged_proctoring_count}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748B' }}>Attempts requiring review</div>
        </div>
      </div>

      {/* Score Distribution Chart */}
      <div style={{
        background: '#FFFFFF',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--color-border)',
        boxShadow: 'var(--shadow-sm)',
        padding: '1.5rem',
        marginBottom: '2rem'
      }}>
        <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--color-navy)', marginBottom: '1.25rem' }}>
          Candidate Score Distribution
        </h3>

        <div style={{ height: '240px', width: '100%' }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={analytics.score_distribution}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
              <XAxis dataKey="range" tick={{ fontSize: 12, fill: '#64748B' }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#64748B' }} />
              <Tooltip
                contentStyle={{ background: '#0F172A', color: '#FFFFFF', borderRadius: '8px', border: 'none' }}
                cursor={{ fill: 'rgba(241, 245, 249, 0.6)' }}
              />
              <Bar dataKey="count" fill="var(--color-orange)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Candidate Submissions Roster */}
      <div style={{
        background: '#FFFFFF',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--color-border)',
        boxShadow: 'var(--shadow-sm)',
        padding: '1.5rem'
      }}>
        <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--color-navy)', marginBottom: '1.25rem' }}>
          Candidate Attempts & Integrity Status ({analytics.candidates?.length || 0})
        </h3>

        {(!analytics.candidates || analytics.candidates.length === 0) ? (
          <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#64748B' }}>
            No candidate submissions recorded yet for this examination.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #E2E8F0', color: '#64748B', fontSize: '0.76rem', textTransform: 'uppercase' }}>
                  <th style={{ padding: '0.75rem 1rem' }}>Candidate</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Score</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Percentage</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Result</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Proctor Warnings</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {analytics.candidates.map((c) => (
                  <tr key={c.attempt_id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                    <td style={{ padding: '0.85rem 1rem' }}>
                      <div style={{ fontWeight: 700, color: 'var(--color-navy)' }}>{c.student_name}</div>
                      <div style={{ fontSize: '0.75rem', color: '#64748B' }}>{c.student_email}</div>
                    </td>

                    <td style={{ padding: '0.85rem 1rem', fontWeight: 700, color: '#2563EB' }}>
                      {c.score} / {analytics.total_marks}
                    </td>

                    <td style={{ padding: '0.85rem 1rem', fontWeight: 600 }}>
                      {c.percentage}%
                    </td>

                    <td style={{ padding: '0.85rem 1rem' }}>
                      <span style={{
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        padding: '0.15rem 0.5rem',
                        borderRadius: '999px',
                        background: c.passed ? '#ECFDF5' : '#FEF2F2',
                        color: c.passed ? '#059669' : '#DC2626'
                      }}>
                        {c.passed ? 'PASSED' : 'FAILED'}
                      </span>
                    </td>

                    <td style={{ padding: '0.85rem 1rem' }}>
                      {c.flagged ? (
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.25rem',
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          padding: '0.15rem 0.5rem',
                          borderRadius: '4px',
                          background: '#FEF2F2',
                          color: '#DC2626'
                        }}>
                          <AlertTriangle size={12} />
                          {c.warning_count} Warnings (Flagged)
                        </span>
                      ) : (
                        <span style={{ fontSize: '0.78rem', color: '#64748B' }}>
                          {c.warning_count || 0} Warnings
                        </span>
                      )}
                    </td>

                    <td style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>
                      <Link
                        to={`/teacher/mock-tests/${id}/attempts/${c.attempt_id}/review`}
                        className="btn btn-secondary"
                        style={{ fontSize: '0.78rem', padding: '0.35rem 0.75rem', fontWeight: 600 }}
                      >
                        Inspect Proctoring Log
                      </Link>
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
export default TeacherTestAnalyticsPage;
