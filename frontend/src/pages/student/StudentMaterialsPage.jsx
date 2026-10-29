import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { StudentNav } from '../../components/student/StudentNav';
import { useToast } from '../../context/ToastContext';
import {
  BookOpen,
  ExternalLink,
  Calendar,
  Search,
  Download,
  FileText,
  FileCode,
  FileArchive,
  Layers,
  Eye,
  X,
  User,
  Video
} from 'lucide-react';

export function StudentMaterialsPage() {
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('all');

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

  const subjects = Array.from(new Set(materials.map(m => m.subject_name).filter(Boolean)));

  const filtered = materials.filter(m => {
    if (selectedSubject !== 'all' && m.subject_name !== selectedSubject) return false;
    if (search) {
      const q = search.toLowerCase();
      const matchTitle = m.title?.toLowerCase().includes(q);
      const matchSub = m.subject_name?.toLowerCase().includes(q);
      const matchDesc = m.description?.toLowerCase().includes(q);
      if (!matchTitle && !matchSub && !matchDesc) return false;
    }
    return true;
  });

  const getDocIcon = (type) => {
    const t = (type || '').toLowerCase();
    if (t.includes('pdf')) return <FileText size={20} style={{ color: '#EF4444' }} />;
    if (t.includes('code') || t.includes('repo')) return <FileCode size={20} style={{ color: '#10B981' }} />;
    if (t.includes('zip') || t.includes('archive')) return <FileArchive size={20} style={{ color: '#8B5CF6' }} />;
    if (t.includes('slide') || t.includes('ppt')) return <Layers size={20} style={{ color: '#F59E0B' }} />;
    if (t.includes('video')) return <Video size={20} style={{ color: '#8B5CF6' }} />;
    return <BookOpen size={20} style={{ color: '#3B82F6' }} />;
  };

  const resolveMaterialUrl = (item, download = false) => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    const rawUrl = item.file_url || item.file_path || item.external_url || '';
    if (!rawUrl) return '#';
    if (rawUrl.startsWith('http://') || rawUrl.startsWith('https://')) {
      return rawUrl;
    }
    let url = rawUrl;
    if (!url.startsWith('/api/')) {
      url = `/api/upload/files/${url.replace(/^(uploads[\\/]|api\/upload\/files\/)/, '')}`;
    }
    const params = new URLSearchParams();
    if (token) params.set('token', token);
    if (download) params.set('download', 'true');
    const qs = params.toString();
    return qs ? `${url}?${qs}` : url;
  };

  return (
    <div style={{ padding: '2.5rem 0 5rem' }}>
      <div className="container">
        <StudentNav />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.75rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--color-navy)', marginBottom: '0.25rem' }}>
              Curriculum Study Materials & Handouts
            </h1>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem', margin: 0 }}>
              Reference lesson slides, textbook notes, code repositories, and faculty handouts.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--color-bg-alt)', padding: '0.4rem 0.8rem', borderRadius: '8px', border: '1px solid var(--color-border)', minWidth: '240px' }}>
            <Search size={16} style={{ color: 'var(--color-text-muted)' }} />
            <input
              type="text"
              placeholder="Search resources by title or topic..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ width: '100%', border: 'none', outline: 'none', fontSize: '0.82rem', background: 'transparent' }}
            />
          </div>
        </div>

        {/* Subject Filter Pills */}
        <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.5rem', marginBottom: '1.75rem', borderBottom: '1px solid var(--color-border)' }}>
          <button
            onClick={() => setSelectedSubject('all')}
            className="btn btn-sm"
            style={{
              fontSize: '0.8rem',
              padding: '0.4rem 0.85rem',
              borderRadius: '6px',
              background: selectedSubject === 'all' ? 'var(--color-navy)' : 'var(--color-bg-alt)',
              color: selectedSubject === 'all' ? '#FFFFFF' : 'var(--color-navy)',
              borderColor: selectedSubject === 'all' ? 'var(--color-navy)' : 'var(--color-border)'
            }}
          >
            All Subjects ({materials.length})
          </button>
          {subjects.map(s => {
            const count = materials.filter(m => m.subject_name === s).length;
            const isSelected = selectedSubject === s;
            return (
              <button
                key={s}
                onClick={() => setSelectedSubject(s)}
                className="btn btn-sm"
                style={{
                  fontSize: '0.8rem',
                  padding: '0.4rem 0.85rem',
                  borderRadius: '6px',
                  background: isSelected ? 'var(--color-navy)' : 'var(--color-bg-alt)',
                  color: isSelected ? '#FFFFFF' : 'var(--color-navy)',
                  borderColor: isSelected ? 'var(--color-navy)' : 'var(--color-border)',
                  whiteSpace: 'nowrap'
                }}
              >
                <span>{s}</span>
                <span style={{
                  fontSize: '0.7rem',
                  marginLeft: '0.35rem',
                  padding: '0.1rem 0.35rem',
                  borderRadius: '999px',
                  background: isSelected ? 'rgba(255,255,255,0.2)' : '#E2E8F0',
                  color: isSelected ? '#FFFFFF' : '#475569'
                }}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {loading ? (
          <div style={{ padding: '3.5rem 1rem', textAlign: 'center', color: '#64748B' }}>
            <div style={{ width: 28, height: 28, border: '3px solid #E2E8F0', borderTopColor: '#2563EB', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 0.75rem' }} />
            <span>Loading study materials...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: '3.5rem 1rem', textAlign: 'center', background: 'var(--color-bg-alt)', borderRadius: '12px', border: '1px solid var(--color-border)' }}>
            <BookOpen size={36} style={{ color: 'var(--color-text-muted)', margin: '0 auto 0.75rem' }} />
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--color-navy)', margin: '0 0 0.35rem' }}>
              No study materials available
            </h3>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', margin: 0 }}>
              No documents matched your active subject or search criteria.
            </p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.25rem' }}>
            {filtered.map(m => {
              const hasFile = Boolean(m.file_path || m.file_url);
              const hasExternal = Boolean(m.external_url);
              const viewUrl = resolveMaterialUrl(m, false);
              const downloadUrl = resolveMaterialUrl(m, true);

              return (
                <div key={m.id} className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.65rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        {getDocIcon(m.type || m.file_type)}
                        <span style={{ padding: '0.15rem 0.5rem', background: '#EFF6FF', color: '#1D4ED8', borderRadius: '4px', fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase' }}>
                          {m.type || 'DOCUMENT'}
                        </span>
                      </div>
                      <span style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>
                        {m.created_at ? new Date(m.created_at).toLocaleDateString() : 'Active'}
                      </span>
                    </div>

                    <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-navy)', marginBottom: '0.35rem' }}>
                      {m.title}
                    </h3>
                    <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', lineHeight: 1.5, marginBottom: '0.75rem' }}>
                      {m.description || 'Curriculum resource published for enrolled students.'}
                    </p>

                    {hasFile && m.file_name && (
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', padding: '0.25rem 0.55rem', background: '#F1F5F9', borderRadius: '6px', fontSize: '0.75rem', color: '#475569', marginBottom: '0.75rem' }}>
                        <FileText size={12} />
                        <span style={{ maxWidth: '220px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {m.file_name}
                        </span>
                        {m.file_size && (
                          <span style={{ color: '#94A3B8' }}>({(m.file_size / 1024 / 1024).toFixed(1)} MB)</span>
                        )}
                      </div>
                    )}
                  </div>

                  <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '0.85rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <User size={12} />
                      <span>{m.teacher_name || m.uploader_name || m.subject_name || 'Faculty Resource'}</span>
                    </div>

                    <div style={{ display: 'flex', gap: '0.4rem' }}>
                      {hasFile && (
                        <>
                          <a
                            href={viewUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-sm btn-outline"
                            style={{ fontSize: '0.75rem', padding: '0.25rem 0.55rem', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
                            title="Preview in new tab"
                          >
                            <Eye size={12} />
                            <span>View</span>
                          </a>
                          <a
                            href={downloadUrl}
                            download={m.file_name || 'material'}
                            className="btn btn-sm btn-outline"
                            style={{ fontSize: '0.75rem', padding: '0.25rem 0.55rem', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
                            title="Download file"
                          >
                            <Download size={12} />
                            <span>Download</span>
                          </a>
                        </>
                      )}

                      {hasExternal && (
                        <a
                          href={m.external_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-sm btn-primary"
                          style={{ fontSize: '0.75rem', padding: '0.25rem 0.55rem', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
                        >
                          <span>Open Resource</span>
                          <ExternalLink size={12} />
                        </a>
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

export default StudentMaterialsPage;