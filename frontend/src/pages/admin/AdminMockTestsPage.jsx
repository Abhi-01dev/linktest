// Admin Mock Test & Global Examination Oversight
// LinkTest Enterprise LMS

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';
import {
  ShieldAlert,
  Search,
  Plus,
  BarChart3,
  Trash2,
  CheckCircle,
  AlertTriangle,
  Award,
  Users,
  Eye,
  FileText
} from 'lucide-react';

export function AdminMockTestsPage() {
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const loadTests = async () => {
    try {
      setLoading(true);
      const data = await api.getMockTests();
      setTests(data || []);
    } catch (err) {
      console.error('Failed to load admin mock tests:', err);
      setError('Unable to retrieve platform mock tests.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTests();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Administrative Action: Permanently delete this mock test and all its attempts?')) return;
    try {
      await api.deleteMockTest(id);
      loadTests();
    } catch (err) {
      alert(err.message || 'Deletion failed.');
    }
  };

  const handleTogglePublish = async (id, currentStatus) => {
    const nextStatus = currentStatus === 'published' ? 'draft' : 'published';
    try {
      await api.publishMockTest(id, nextStatus);
      loadTests();
    } catch (err) {
      alert(err.message || 'Status change failed.');
    }
  };

  const filteredTests = tests.filter(t => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      t.title?.toLowerCase().includes(q) ||
      t.subject?.toLowerCase().includes(q)
    );
  });

  return (
    <div style={{ padding: '2rem' }}>
      {/* Top Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '2rem',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div>
          <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#DC2626', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            ADMINISTRATIVE OVERSIGHT
          </div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--color-navy)', margin: '0.2rem 0 0' }}>
            Mock Tests & Assessment Integrity Control
          </h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.88rem', margin: '0.3rem 0 0' }}>
            Platform-wide management of all examination papers, proctoring security parameters, and candidate attempt records.
          </p>
        </div>

        <Link
          to="/teacher/mock-tests/create"
          className="btn btn-primary"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', fontWeight: 800 }}
        >
          <Plus size={18} />
          <span>Create Examination</span>
        </Link>
      </div>

      {/* Global Stat Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '1rem',
        marginBottom: '2rem'
      }}>
        <div style={{ background: '#FFFFFF', padding: '1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B' }}>TOTAL TESTS</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--color-navy)', marginTop: '0.2rem' }}>
            {tests.length}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748B' }}>{tests.filter(t => t.status === 'published').length} active published</div>
        </div>

        <div style={{ background: '#FFFFFF', padding: '1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B' }}>PROCTORED TESTS</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#DC2626', marginTop: '0.2rem' }}>
            {tests.filter(t => t.proctoring_config?.webcam_required).length}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748B' }}>Webcam verification active</div>
        </div>

        <div style={{ background: '#FFFFFF', padding: '1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B' }}>AVG PASS PERCENTAGE</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#059669', marginTop: '0.2rem' }}>
            {tests.length > 0 ? Math.round(tests.reduce((acc, t) => acc + parseFloat(t.pass_percentage || 40), 0) / tests.length) : 0}%
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748B' }}>Institutional cutoff standard</div>
        </div>
      </div>

      {/* Tests Table */}
      <div style={{
        background: '#FFFFFF',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--color-border)',
        boxShadow: 'var(--shadow-sm)',
        padding: '1.5rem'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1.25rem',
          flexWrap: 'wrap',
          gap: '1rem'
        }}>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, color: 'var(--color-navy)' }}>
            Institutional Mock Tests Directory
          </h3>

          <div style={{ position: 'relative', minWidth: '240px' }}>
            <Search size={15} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
            <input
              type="text"
              placeholder="Search tests..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '0.45rem 0.75rem 0.45rem 2.2rem',
                border: '1px solid var(--color-border)',
                borderRadius: '6px',
                fontSize: '0.88rem'
              }}
            />
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem' }}>
            <div className="spinner" style={{ margin: '0 auto 1rem' }}></div>
            <p>Loading mock tests...</p>
          </div>
        ) : filteredTests.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#64748B' }}>
            No examinations found.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #E2E8F0', color: '#64748B', fontSize: '0.76rem', textTransform: 'uppercase' }}>
                  <th style={{ padding: '0.75rem 1rem' }}>Examination</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Category</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Duration</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Proctoring</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Status</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredTests.map((t) => (
                  <tr key={t.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                    <td style={{ padding: '0.85rem 1rem' }}>
                      <div style={{ fontWeight: 700, color: 'var(--color-navy)' }}>{t.title}</div>
                      <div style={{ fontSize: '0.75rem', color: '#64748B' }}>{t.subject} • {t.total_marks} Marks</div>
                    </td>

                    <td style={{ padding: '0.85rem 1rem', textTransform: 'capitalize' }}>
                      {t.category.replace('_', ' ')}
                    </td>

                    <td style={{ padding: '0.85rem 1rem' }}>
                      {t.duration_minutes} mins
                    </td>

                    <td style={{ padding: '0.85rem 1rem' }}>
                      {t.proctoring_config?.webcam_required ? (
                        <span style={{ fontSize: '0.72rem', fontWeight: 700, padding: '0.15rem 0.5rem', borderRadius: '4px', background: '#FEF2F2', color: '#DC2626' }}>
                          Webcam Required
                        </span>
                      ) : (
                        <span style={{ fontSize: '0.72rem', color: '#64748B' }}>Standard</span>
                      )}
                    </td>

                    <td style={{ padding: '0.85rem 1rem' }}>
                      <span style={{
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        padding: '0.15rem 0.5rem',
                        borderRadius: '999px',
                        background: t.status === 'published' ? '#ECFDF5' : '#F1F5F9',
                        color: t.status === 'published' ? '#059669' : '#64748B',
                        textTransform: 'uppercase'
                      }}>
                        {t.status}
                      </span>
                    </td>

                    <td style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '0.4rem' }}>
                        <Link
                          to={`/teacher/mock-tests/${t.id}/analytics`}
                          className="btn btn-secondary"
                          style={{ fontSize: '0.76rem', padding: '0.35rem 0.65rem' }}
                        >
                          <BarChart3 size={13} />
                        </Link>

                        <button
                          onClick={() => handleTogglePublish(t.id, t.status)}
                          className="btn btn-secondary"
                          style={{ fontSize: '0.76rem', padding: '0.35rem 0.65rem' }}
                        >
                          {t.status === 'published' ? 'Unpublish' : 'Publish'}
                        </button>

                        <button
                          onClick={() => handleDelete(t.id)}
                          className="btn btn-ghost"
                          style={{ color: '#EF4444', padding: '0.35rem' }}
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
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
export default AdminMockTestsPage;
