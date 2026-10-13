// Teacher Mock Test Management & Authoring Dashboard
// LinkTest Enterprise Examination Studio

import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import {
  Plus,
  Search,
  Filter,
  FileCheck2,
  Clock,
  Award,
  Users,
  BarChart3,
  Copy,
  Edit,
  Trash2,
  Eye,
  ShieldAlert,
  Send,
  MoreVertical,
  CheckCircle,
  Sparkles,
  Camera
} from 'lucide-react';

export function TeacherMockTestsPage() {
  const navigate = useNavigate();
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [activeTab, setActiveTab] = useState('all'); // 'all', 'published', 'draft'
  const [searchQuery, setSearchQuery] = useState('');

  const loadTests = async () => {
    try {
      setLoading(true);
      const data = await api.getMockTests({ scope: 'mine' });
      setTests(data || []);
    } catch (err) {
      console.error('Failed to load teacher tests:', err);
      setError('Unable to load mock tests.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTests();
  }, []);

  const handleDuplicate = async (id) => {
    if (!window.confirm('Create a duplicate copy of this examination?')) return;
    try {
      await api.duplicateMockTest(id);
      loadTests();
    } catch (err) {
      alert(err.message || 'Duplication failed.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this mock test? This will also remove associated candidate attempts.')) return;
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
      alert(err.message || 'Failed to update status.');
    }
  };

  const handleToggleReleaseResults = async (id, currentVal) => {
    try {
      await api.releaseMockTestResults(id, !currentVal);
      loadTests();
    } catch (err) {
      alert(err.message || 'Failed to toggle results release.');
    }
  };

  const filteredTests = tests.filter(t => {
    if (activeTab !== 'all' && t.status !== activeTab) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        t.title?.toLowerCase().includes(q) ||
        t.subject?.toLowerCase().includes(q) ||
        t.topic?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div style={{ padding: '2rem' }}>
      {/* Page Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '2rem',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div>
          <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#2563EB', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Faculty Examination Studio
          </div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--color-navy)', margin: '0.2rem 0 0' }}>
            Mock Tests & Assessment Hub
          </h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.88rem', margin: '0.3rem 0 0' }}>
            Create secure online tests, configure AI-assisted questions, enforce webcam proctoring, and review candidate integrity logs.
          </p>
        </div>

        <Link
          to="/teacher/mock-tests/create"
          className="btn btn-primary"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.65rem 1.25rem',
            fontWeight: 800
          }}
        >
          <Plus size={18} />
          <span>Create New Mock Test</span>
        </Link>
      </div>

      {/* Filter and Search Bar */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: '#FFFFFF',
        padding: '0.85rem 1.25rem',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--color-border)',
        marginBottom: '1.5rem',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {[
            { id: 'all', label: 'All Tests' },
            { id: 'published', label: 'Published' },
            { id: 'draft', label: 'Drafts' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '0.4rem 0.85rem',
                borderRadius: '6px',
                fontSize: '0.84rem',
                fontWeight: 600,
                border: 'none',
                background: activeTab === tab.id ? 'var(--color-navy)' : 'transparent',
                color: activeTab === tab.id ? '#FFFFFF' : 'var(--color-text-secondary)',
                cursor: 'pointer'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div style={{ position: 'relative', minWidth: '240px' }}>
          <Search size={15} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
          <input
            type="text"
            placeholder="Search your mock tests..."
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

      {/* Tests Roster */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem 1rem' }}>
          <div className="spinner" style={{ margin: '0 auto 1rem' }}></div>
          <p>Loading examinations...</p>
        </div>
      ) : error ? (
        <div style={{ background: '#FEF2F2', border: '1px solid #EF4444', color: '#DC2626', padding: '1rem', borderRadius: '8px' }}>
          {error}
        </div>
      ) : filteredTests.length === 0 ? (
        <div style={{
          background: '#FFFFFF',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--color-border)',
          padding: '4rem 2rem',
          textAlign: 'center'
        }}>
          <FileCheck2 size={44} style={{ color: '#94A3B8', margin: '0 auto 1rem' }} />
          <h3 style={{ fontSize: '1.2rem', color: 'var(--color-navy)' }}>No mock tests found</h3>
          <p style={{ color: 'var(--color-text-secondary)', maxWidth: '400px', margin: '0.4rem auto 1.5rem' }}>
            Get started by building your first secure proctored examination or generating questions with AI.
          </p>
          <Link to="/teacher/mock-tests/create" className="btn btn-primary">
            <Plus size={16} /> Create Mock Test
          </Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {filteredTests.map((t) => {
            const isPublished = t.status === 'published';
            const isProctored = t.proctoring_config?.webcam_required;

            return (
              <div
                key={t.id}
                style={{
                  background: '#FFFFFF',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--color-border)',
                  boxShadow: 'var(--shadow-sm)',
                  padding: '1.25rem 1.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '1rem'
                }}
              >
                {/* Test Info */}
                <div style={{ flex: 1, minWidth: '280px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.3rem' }}>
                    <span style={{
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      padding: '0.15rem 0.55rem',
                      borderRadius: '999px',
                      background: isPublished ? '#ECFDF5' : '#F1F5F9',
                      color: isPublished ? '#059669' : '#64748B',
                      textTransform: 'uppercase'
                    }}>
                      {t.status}
                    </span>

                    {isProctored && (
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
                        <Camera size={12} />
                        Webcam Proctored
                      </span>
                    )}

                    <span style={{ fontSize: '0.78rem', color: '#64748B' }}>
                      {t.subject}
                    </span>
                  </div>

                  <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--color-navy)', margin: '0 0 0.4rem' }}>
                    {t.title}
                  </h3>

                  <div style={{ display: 'flex', gap: '1rem', fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
                    <span>Duration: <strong>{t.duration_minutes}m</strong></span>
                    <span>Total Marks: <strong>{t.total_marks}</strong></span>
                    <span>Passing: <strong>{t.pass_percentage}%</strong></span>
                    <span>Max Attempts: <strong>{t.max_attempts}</strong></span>
                  </div>
                </div>

                {/* Status Toggles & Analytics */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
                  {/* Release Results Toggle */}
                  <button
                    onClick={() => handleToggleReleaseResults(t.id, t.results_published)}
                    title={t.results_published ? 'Results are published to students' : 'Results are hidden from students'}
                    className="btn btn-secondary"
                    style={{
                      fontSize: '0.78rem',
                      padding: '0.35rem 0.75rem',
                      background: t.results_published ? '#ECFDF5' : '#FFFFFF',
                      color: t.results_published ? '#059669' : '#64748B',
                      borderColor: t.results_published ? '#A7F3D0' : 'var(--color-border)'
                    }}
                  >
                    {t.results_published ? '✓ Results Released' : 'Release Results'}
                  </button>

                  {/* Publish Toggle */}
                  <button
                    onClick={() => handleTogglePublish(t.id, t.status)}
                    className="btn btn-secondary"
                    style={{
                      fontSize: '0.78rem',
                      padding: '0.35rem 0.75rem',
                      color: isPublished ? '#D97706' : '#2563EB'
                    }}
                  >
                    {isPublished ? 'Unpublish' : 'Publish'}
                  </button>

                  {/* Analytics link */}
                  <Link
                    to={`/teacher/mock-tests/${t.id}/analytics`}
                    className="btn btn-secondary"
                    style={{
                      fontSize: '0.78rem',
                      padding: '0.35rem 0.75rem',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.3rem'
                    }}
                  >
                    <BarChart3 size={14} />
                    <span>Analytics</span>
                  </Link>

                  {/* Edit */}
                  <Link
                    to={`/teacher/mock-tests/${t.id}/edit`}
                    className="btn btn-secondary"
                    style={{
                      fontSize: '0.78rem',
                      padding: '0.35rem 0.75rem',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.3rem'
                    }}
                  >
                    <Edit size={14} />
                    <span>Edit</span>
                  </Link>

                  {/* Duplicate */}
                  <button
                    onClick={() => handleDuplicate(t.id)}
                    className="btn btn-ghost"
                    style={{ padding: '0.35rem 0.5rem', color: '#64748B' }}
                    title="Duplicate test"
                  >
                    <Copy size={16} />
                  </button>

                  {/* Delete */}
                  <button
                    onClick={() => handleDelete(t.id)}
                    className="btn btn-ghost"
                    style={{ padding: '0.35rem 0.5rem', color: '#EF4444' }}
                    title="Delete test"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
export default TeacherMockTestsPage;
