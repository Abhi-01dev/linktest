import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  LineChart,
  Line,
  Legend
} from 'recharts';
import {
  BarChart3,
  TrendingUp,
  Award,
  BookOpen,
  Download,
  Calendar,
  Layers,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Clock,
  Filter,
  Users
} from 'lucide-react';

const COLORS = ['#2563EB', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

export function AdminReportsPage() {
  const [reports, setReports] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [exporting, setExporting] = useState(false);

  // Filters State
  const [selectedCourse, setSelectedCourse] = useState('ALL');
  const [selectedBatch, setSelectedBatch] = useState('ALL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const { showToast } = useToast();

  const loadData = async (overrideFilters = null) => {
    try {
      setLoading(true);
      setError(null);
      const params = overrideFilters || {
        course_id: selectedCourse !== 'ALL' ? selectedCourse : undefined,
        batch_id: selectedBatch !== 'ALL' ? selectedBatch : undefined,
        start_date: startDate || undefined,
        end_date: endDate || undefined
      };

      const data = await api.getAdminReports(params);
      setReports(data || {});
    } catch (err) {
      console.error('Failed to load reports:', err);
      setError(err.message || 'Failed to calculate academic report metrics');
      showToast(err.message || 'Failed to load report analytics', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedCourse, selectedBatch]);

  const handleFilterSubmit = (e) => {
    e.preventDefault();
    loadData();
  };

  const handleResetFilters = () => {
    setSelectedCourse('ALL');
    setSelectedBatch('ALL');
    setStartDate('');
    setEndDate('');
    loadData({ course_id: undefined, batch_id: undefined, start_date: undefined, end_date: undefined });
  };

  const handleExportCSV = async () => {
    try {
      setExporting(true);
      await api.exportAdminReportsCSV({
        course_id: selectedCourse !== 'ALL' ? selectedCourse : undefined,
        batch_id: selectedBatch !== 'ALL' ? selectedBatch : undefined,
        start_date: startDate || undefined,
        end_date: endDate || undefined
      });
      showToast('Report CSV successfully generated and downloaded.', 'success');
    } catch (err) {
      showToast(err.message || 'Failed to export CSV report', 'error');
    } finally {
      setExporting(false);
    }
  };

  const summary = reports?.summary || {};
  const scoreDistribution = reports?.score_distribution || [];
  const attendanceTrend = reports?.attendance?.daily_trend || [];
  const courseBreakdown = reports?.course_breakdown || [];
  const batchBreakdown = reports?.batch_breakdown || [];
  const recentSubmissions = reports?.recent_submissions || [];
  const availableCourses = reports?.available_courses || [];
  const availableBatches = reports?.available_batches || [];

  return (
    <div>
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.75rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <span className="badge" style={{ background: '#F0FDF4', color: '#16A34A', border: '1px solid #BBF7D0', fontWeight: 700 }}>
              VERIFIED ANALYTICS
            </span>
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#0F172A', marginBottom: '0.25rem' }}>
            Academic Reports & Assessment Analytics
          </h1>
          <p style={{ color: '#64748B', fontSize: '0.875rem' }}>
            Real-time analytics computed directly from quiz attempts, mock examination submissions, student records, and batch cohorts.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button
            onClick={() => loadData()}
            className="btn btn-outline"
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem' }}
          >
            <RefreshCw size={15} /> Refresh Data
          </button>

          <button
            onClick={handleExportCSV}
            disabled={exporting || loading}
            className="btn btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem' }}
          >
            <Download size={15} /> {exporting ? 'Generating CSV...' : 'Export Report (CSV)'}
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <form onSubmit={handleFilterSubmit} className="card" style={{ padding: '1.25rem', marginBottom: '1.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem', color: '#334155', fontWeight: 600, fontSize: '0.9rem' }}>
          <Filter size={16} style={{ color: '#2563EB' }} /> Filter Report Scope
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', alignItems: 'flex-end' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#64748B', marginBottom: '0.25rem' }}>
              Curriculum Course
            </label>
            <select
              value={selectedCourse}
              onChange={(e) => setSelectedCourse(e.target.value)}
              disabled={availableCourses.length === 0}
              style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.85rem', background: '#FFFFFF' }}
            >
              {availableCourses.length === 0 ? (
                <option value="" disabled>No options</option>
              ) : (
                <>
                  <option value="ALL">All Courses ({availableCourses.length})</option>
                  {availableCourses.map((c) => (
                    <option key={c.id} value={c.id}>{c.title}</option>
                  ))}
                </>
              )}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#64748B', marginBottom: '0.25rem' }}>
              Academic Batch Cohort
            </label>
            <select
              value={selectedBatch}
              onChange={(e) => setSelectedBatch(e.target.value)}
              disabled={availableBatches.length === 0}
              style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.85rem', background: '#FFFFFF' }}
            >
              {availableBatches.length === 0 ? (
                <option value="" disabled>No options</option>
              ) : (
                <>
                  <option value="ALL">All Batches ({availableBatches.length})</option>
                  {availableBatches.map((b) => (
                    <option key={b.id} value={b.id}>{b.name} ({b.code || b.id})</option>
                  ))}
                </>
              )}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#64748B', marginBottom: '0.25rem' }}>
              From Date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              style={{ width: '100%', padding: '0.45rem 0.75rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.85rem' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#64748B', marginBottom: '0.25rem' }}>
              To Date
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              style={{ width: '100%', padding: '0.45rem 0.75rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.85rem' }}
            />
          </div>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button type="submit" className="btn btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}>
              Apply
            </button>
            <button type="button" onClick={handleResetFilters} className="btn btn-outline" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}>
              Reset
            </button>
          </div>
        </div>
      </form>

      {/* Error State */}
      {error && !loading && (
        <div className="card" style={{ padding: '2rem', textAlign: 'center', marginBottom: '1.5rem', background: '#FEF2F2', borderColor: '#FCA5A5' }}>
          <AlertCircle size={36} style={{ color: '#DC2626', margin: '0 auto 0.75rem' }} />
          <h3 style={{ color: '#991B1B', fontWeight: 700, marginBottom: '0.25rem' }}>Error Loading Reports</h3>
          <p style={{ color: '#B91C1C', fontSize: '0.875rem', marginBottom: '1rem' }}>{error}</p>
          <button onClick={() => loadData()} className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
            <RefreshCw size={14} /> Retry Analysis
          </button>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="card" style={{ padding: '4rem', textAlign: 'center', color: '#64748B' }}>
          <RefreshCw size={28} className="animate-spin" style={{ margin: '0 auto 1rem', color: '#2563EB' }} />
          <p style={{ fontWeight: 600, color: '#334155' }}>Calculating verified academic performance metrics...</p>
          <p style={{ fontSize: '0.8rem' }}>Aggregating assessment attempts, test score distributions, and cohort attendance.</p>
        </div>
      )}

      {!loading && !error && (
        <>
          {/* Key Metrics Summary Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '1.25rem', marginBottom: '1.75rem' }}>
            <div className="card" style={{ padding: '1.25rem', borderLeft: '4px solid #2563EB' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.8rem', color: '#64748B', fontWeight: 600, textTransform: 'uppercase' }}>Total Attempts</span>
                <BookOpen size={18} style={{ color: '#2563EB' }} />
              </div>
              <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#0F172A' }}>
                {summary.total_attempts || 0}
              </div>
              <p style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '0.25rem' }}>
                {summary.total_students || 0} enrolled students registered
              </p>
            </div>

            <div className="card" style={{ padding: '1.25rem', borderLeft: '4px solid #10B981' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.8rem', color: '#64748B', fontWeight: 600, textTransform: 'uppercase' }}>Pass Rate</span>
                <CheckCircle2 size={18} style={{ color: '#10B981' }} />
              </div>
              <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#10B981' }}>
                {summary.pass_rate || 0}%
              </div>
              <p style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '0.25rem' }}>
                {summary.passed_attempts || 0} of {summary.total_attempts || 0} attempts passing
              </p>
            </div>

            <div className="card" style={{ padding: '1.25rem', borderLeft: '4px solid #F59E0B' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.8rem', color: '#64748B', fontWeight: 600, textTransform: 'uppercase' }}>Average Score</span>
                <Award size={18} style={{ color: '#F59E0B' }} />
              </div>
              <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#D97706' }}>
                {summary.avg_score || 0}%
              </div>
              <p style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '0.25rem' }}>
                Average across all evaluations
              </p>
            </div>

            <div className="card" style={{ padding: '1.25rem', borderLeft: '4px solid #8B5CF6' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.8rem', color: '#64748B', fontWeight: 600, textTransform: 'uppercase' }}>Completion Rate</span>
                <TrendingUp size={18} style={{ color: '#8B5CF6' }} />
              </div>
              <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#7C3AED' }}>
                {summary.completion_rate || 0}%
              </div>
              <p style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '0.25rem' }}>
                Submissions finalized & scored
              </p>
            </div>
          </div>

          {/* Charts Row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(440px, 1fr))', gap: '1.5rem', marginBottom: '1.75rem' }}>
            {/* Chart 1: Score Distribution */}
            <div className="card" style={{ padding: '1.5rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0F172A', marginBottom: '0.25rem' }}>
                Assessment Score Distribution
              </h3>
              <p style={{ fontSize: '0.8rem', color: '#64748B', marginBottom: '1.25rem' }}>
                Student attempts categorized into percentage achievement bands
              </p>
              <div style={{ width: '100%', height: 260 }}>
                {scoreDistribution.some((d) => d.count > 0) ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={scoreDistribution}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                      <XAxis dataKey="range" stroke="#94A3B8" fontSize={12} />
                      <YAxis stroke="#94A3B8" fontSize={12} allowDecimals={false} />
                      <Tooltip formatter={(value) => [`${value} Attempts`, 'Frequency']} />
                      <Bar dataKey="count" fill="#2563EB" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94A3B8', fontSize: '0.875rem' }}>
                    No attempt data available for current filter scope.
                  </div>
                )}
              </div>
            </div>

            {/* Chart 2: Attendance Turnout Trend */}
            <div className="card" style={{ padding: '1.5rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0F172A', marginBottom: '0.25rem' }}>
                Verified Student Turnout (%)
              </h3>
              <p style={{ fontSize: '0.8rem', color: '#64748B', marginBottom: '1.25rem' }}>
                Verified classroom attendance rate over recent schedule records
              </p>
              <div style={{ width: '100%', height: 260 }}>
                {attendanceTrend.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={attendanceTrend}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                      <XAxis dataKey="name" stroke="#94A3B8" fontSize={12} />
                      <YAxis domain={[50, 100]} stroke="#94A3B8" fontSize={12} unit="%" />
                      <Tooltip formatter={(value) => [`${value}%`, 'Turnout']} />
                      <Line type="monotone" dataKey="rate" stroke="#10B981" strokeWidth={3} dot={{ r: 5 }} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94A3B8', fontSize: '0.875rem' }}>
                    No attendance records for the selected filters.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Course Breakdown Table */}
          <div className="card" style={{ padding: 0, overflow: 'hidden', marginBottom: '1.75rem' }}>
            <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #E2E8F0', background: '#FFFFFF' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0F172A', margin: 0 }}>
                Course Performance Breakdown
              </h3>
              <p style={{ fontSize: '0.8rem', color: '#64748B', margin: '0.25rem 0 0' }}>
                Aggregate metrics per curriculum offering
              </p>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#475569', fontWeight: 600 }}>
                  <th style={{ padding: '0.75rem 1.5rem' }}>Course Title</th>
                  <th style={{ padding: '0.75rem 1.5rem' }}>Category</th>
                  <th style={{ padding: '0.75rem 1.5rem' }}>Total Attempts</th>
                  <th style={{ padding: '0.75rem 1.5rem' }}>Average Score</th>
                  <th style={{ padding: '0.75rem 1.5rem' }}>Pass Rate</th>
                </tr>
              </thead>
              <tbody>
                {courseBreakdown.length === 0 ? (
                  <tr>
                    <td colSpan="5" style={{ padding: '2rem', textAlign: 'center', color: '#64748B' }}>
                      No courses available.
                    </td>
                  </tr>
                ) : (
                  courseBreakdown.map((c) => (
                    <tr key={c.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                      <td style={{ padding: '0.85rem 1.5rem', fontWeight: 600, color: '#0F172A' }}>
                        {c.title}
                      </td>
                      <td style={{ padding: '0.85rem 1.5rem', color: '#64748B' }}>
                        {c.category || 'Curriculum'}
                      </td>
                      <td style={{ padding: '0.85rem 1.5rem', color: '#334155', fontWeight: 500 }}>
                        {c.attempts_count}
                      </td>
                      <td style={{ padding: '0.85rem 1.5rem' }}>
                        <span style={{ fontWeight: 600, color: c.avg_score >= 60 ? '#10B981' : '#F59E0B' }}>
                          {c.avg_score}%
                        </span>
                      </td>
                      <td style={{ padding: '0.85rem 1.5rem' }}>
                        <span style={{ fontWeight: 600, color: c.pass_rate >= 70 ? '#10B981' : '#EF4444' }}>
                          {c.pass_rate}%
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Recent Assessment Attempts Table */}
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #E2E8F0', background: '#FFFFFF', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0F172A', margin: 0 }}>
                  Recent Student Assessment Submissions ({recentSubmissions.length})
                </h3>
                <p style={{ fontSize: '0.8rem', color: '#64748B', margin: '0.25rem 0 0' }}>
                  Granular student attempt outcomes logged by the assessment system
                </p>
              </div>
            </div>

            {recentSubmissions.length === 0 ? (
              <div style={{ padding: '3.5rem', textAlign: 'center', color: '#64748B' }}>
                <CheckCircle2 size={36} style={{ margin: '0 auto 0.75rem', opacity: 0.4 }} />
                <p style={{ fontWeight: 600, color: '#334155' }}>No submissions recorded for this selection</p>
                <p style={{ fontSize: '0.8rem' }}>Change the date range or course filters to view more attempts.</p>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
                  <thead>
                    <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#475569', fontWeight: 600 }}>
                      <th style={{ padding: '0.75rem 1.25rem' }}>Student</th>
                      <th style={{ padding: '0.75rem 1.25rem' }}>Assessment Title</th>
                      <th style={{ padding: '0.75rem 1.25rem' }}>Type</th>
                      <th style={{ padding: '0.75rem 1.25rem' }}>Score</th>
                      <th style={{ padding: '0.75rem 1.25rem' }}>Percentage</th>
                      <th style={{ padding: '0.75rem 1.25rem' }}>Result</th>
                      <th style={{ padding: '0.75rem 1.25rem' }}>Submitted At</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentSubmissions.map((s) => (
                      <tr key={s.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                        <td style={{ padding: '0.85rem 1.25rem', color: '#0F172A', fontWeight: 500 }}>
                          <div>{s.student_name}</div>
                          {s.student_email && (
                            <div style={{ fontSize: '0.75rem', color: '#64748B' }}>{s.student_email}</div>
                          )}
                        </td>
                        <td style={{ padding: '0.85rem 1.25rem', color: '#334155', maxWidth: '240px' }}>
                          {s.title}
                        </td>
                        <td style={{ padding: '0.85rem 1.25rem' }}>
                          <span style={{ padding: '0.2rem 0.5rem', background: '#F1F5F9', color: '#475569', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600 }}>
                            {s.type}
                          </span>
                        </td>
                        <td style={{ padding: '0.85rem 1.25rem', color: '#0F172A', fontFamily: 'monospace' }}>
                          {s.score} / {s.max_score}
                        </td>
                        <td style={{ padding: '0.85rem 1.25rem', fontWeight: 700, color: s.percentage >= 60 ? '#10B981' : '#EF4444' }}>
                          {s.percentage}%
                        </td>
                        <td style={{ padding: '0.85rem 1.25rem' }}>
                          {s.passed ? (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.2rem', padding: '0.2rem 0.5rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 700, background: '#DCFCE7', color: '#15803D' }}>
                              <CheckCircle2 size={12} /> PASSED
                            </span>
                          ) : (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.2rem', padding: '0.2rem 0.5rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 700, background: '#FEE2E2', color: '#991B1B' }}>
                              <AlertCircle size={12} /> FAILED
                            </span>
                          )}
                        </td>
                        <td style={{ padding: '0.85rem 1.25rem', color: '#64748B', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
                          {s.submitted_at ? new Date(s.submitted_at).toLocaleString() : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default AdminReportsPage;
