import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { BookMarked, Plus, Search } from 'lucide-react';

export function AdminSubjectsPage() {
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddSubject, setShowAddSubject] = useState(false);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [search, setSearch] = useState('');

  const { showToast } = useToast();

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await api.getAdminSubjects();
      setSubjects(data || []);
    } catch (err) {
      showToast(err.message || 'Failed to load subjects', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateSubject = async (e) => {
    e.preventDefault();
    try {
      await api.createAdminSubject({ name, code, description });
      showToast('Subject created successfully', 'success');
      setShowAddSubject(false);
      setName('');
      setCode('');
      setDescription('');
      loadData();
    } catch (err) {
      showToast(err.message || 'Failed to create subject', 'error');
    }
  };

  const filtered = subjects.filter(s =>
    s.name?.toLowerCase().includes(search.toLowerCase()) ||
    s.code?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.75rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#0F172A', marginBottom: '0.25rem' }}>
            Academic Subjects Directory
          </h1>
          <p style={{ color: '#64748B', fontSize: '0.875rem' }}>
            Define teaching subjects, subject course codes, and curriculum mappings.
          </p>
        </div>
        <button onClick={() => setShowAddSubject(true)} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Plus size={16} />
          <span>Add Subject</span>
        </button>
      </div>

      <div className="card" style={{ padding: '0.85rem 1.25rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <Search size={18} style={{ color: '#94A3B8' }} />
        <input
          type="text"
          placeholder="Search subjects by name or course code..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ width: '100%', border: 'none', outline: 'none', fontSize: '0.875rem', background: 'transparent' }}
        />
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#64748B' }}>Loading subjects...</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#64748B' }}>No subjects found.</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#475569', fontWeight: 600 }}>
                <th style={{ padding: '0.85rem 1.25rem' }}>Subject Name</th>
                <th style={{ padding: '0.85rem 1.25rem' }}>Course Code</th>
                <th style={{ padding: '0.85rem 1.25rem' }}>Description</th>
                <th style={{ padding: '0.85rem 1.25rem' }}>Created Date</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(s => (
                <tr key={s.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                  <td style={{ padding: '0.85rem 1.25rem', fontWeight: 600, color: '#0F172A' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <BookMarked size={16} style={{ color: '#2563EB' }} />
                      <span>{s.name}</span>
                    </div>
                  </td>
                  <td style={{ padding: '0.85rem 1.25rem' }}>
                    <span style={{ padding: '0.2rem 0.5rem', background: '#F1F5F9', borderRadius: '4px', fontFamily: 'monospace', fontSize: '0.8rem', fontWeight: 600, color: '#475569' }}>
                      {s.code}
                    </span>
                  </td>
                  <td style={{ padding: '0.85rem 1.25rem', color: '#64748B' }}>{s.description || '—'}</td>
                  <td style={{ padding: '0.85rem 1.25rem', color: '#94A3B8', fontSize: '0.8rem' }}>
                    {new Date(s.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Add Subject Modal */}
      {showAddSubject && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '1rem' }}>
          <div className="card" style={{ maxWidth: '440px', width: '100%', padding: '2rem' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>Add New Subject</h3>
            <p style={{ color: '#64748B', fontSize: '0.85rem', marginBottom: '1.5rem' }}>Define subject name and course code.</p>
            <form onSubmit={handleCreateSubject}>
              <div className="form-group">
                <label className="form-label">Subject Name</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Advanced Physics"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Subject Code</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. PHY-201"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Description (Optional)</label>
                <textarea
                  className="form-input"
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Curriculum overview..."
                />
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
                <button type="button" onClick={() => setShowAddSubject(false)} className="btn btn-outline">Cancel</button>
                <button type="submit" className="btn btn-primary">Save Subject</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
export default AdminSubjectsPage;
