import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { StudentNav } from '../../components/student/StudentNav';
import { useToast } from '../../context/ToastContext';
import { BookOpen, ExternalLink, Calendar, Search } from 'lucide-react';

export function StudentMaterialsPage() {
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const { showToast } = useToast();

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const data = await api.getStudentMaterials();
        setMaterials(data || []);
      } catch (err) {
        showToast(err.message || 'Failed to load study materials', 'error');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const filtered = materials.filter(m =>
    m.title?.toLowerCase().includes(search.toLowerCase()) ||
    m.subject_name?.toLowerCase().includes(search.toLowerCase()) ||
    m.description?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ padding: '2.5rem 0 5rem' }}>
      <div className="container">
        <StudentNav />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.75rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--color-navy)', marginBottom: '0.25rem' }}>
              Curriculum Study Materials & Handouts
            </h1>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>
              Reference lesson slides, textbook notes, and faculty resources for your enrolled courses.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--color-bg-alt)', padding: '0.4rem 0.8rem', borderRadius: '8px', border: '1px solid var(--color-border)', minWidth: '240px' }}>
            <Search size={16} style={{ color: 'var(--color-text-muted)' }} />
            <input
              type="text"
              placeholder="Search resources..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ width: '100%', border: 'none', outline: 'none', fontSize: '0.82rem', background: 'transparent' }}
            />
          </div>
        </div>

        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#64748B' }}>Loading study materials...</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#64748B' }}>No study materials available yet.</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.25rem' }}>
            {filtered.map(m => (
              <div key={m.id} className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                    <span style={{ padding: '0.2rem 0.5rem', background: '#EFF6FF', color: '#1D4ED8', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase' }}>
                      {m.type}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                      {new Date(m.created_at).toLocaleDateString()}
                    </span>
                  </div>

                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-navy)', marginBottom: '0.35rem' }}>
                    {m.title}
                  </h3>
                  {m.description && (
                    <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', lineHeight: 1.5, marginBottom: '1rem' }}>
                      {m.description}
                    </p>
                  )}
                </div>

                <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '0.85rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>
                    {m.subject_name || 'General Course'}
                  </span>
                  {m.external_url && (
                    <a
                      href={m.external_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-sm btn-outline"
                      style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
                    >
                      <span>Open Document</span>
                      <ExternalLink size={12} />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
export default StudentMaterialsPage;
