import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { BookOpen, Plus, FileText, Video, Link as LinkIcon, Download, ExternalLink } from 'lucide-react';

export function TeacherMaterialsPage() {
  const [materials, setMaterials] = useState([]);
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState('link');
  const [externalUrl, setExternalUrl] = useState('');
  const [classId, setClassId] = useState('');
  const [subjectId, setSubjectId] = useState('');

  const { showToast } = useToast();

  const loadData = async () => {
    try {
      setLoading(true);
      const [mList, cList, sList] = await Promise.all([
        api.getTeacherMaterials(),
        api.getTeacherClasses(),
        api.getAdminSubjects()
      ]);
      setMaterials(mList || []);
      setClasses(cList || []);
      setSubjects(sList || []);
      if (cList?.length > 0) setClassId(cList[0].class_id);
      if (sList?.length > 0) setSubjectId(sList[0].id);
    } catch (err) {
      showToast(err.message || 'Failed to load study materials', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await api.createTeacherMaterial({
        title,
        description,
        type,
        external_url: externalUrl || null,
        class_id: classId,
        subject_id: subjectId
      });
      showToast('Study resource added successfully', 'success');
      setShowAddModal(false);
      setTitle('');
      setDescription('');
      setExternalUrl('');
      loadData();
    } catch (err) {
      showToast(err.message || 'Failed to add study material', 'error');
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.75rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#0F172A', marginBottom: '0.25rem' }}>
            Curriculum Study Materials & Handouts
          </h1>
          <p style={{ color: '#64748B', fontSize: '0.875rem' }}>
            Upload lesson notes, video reference links, and downloadable student guides.
          </p>
        </div>
        <button onClick={() => setShowAddModal(true)} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Plus size={16} />
          <span>Add Study Material</span>
        </button>
      </div>

      {loading ? (
        <div style={{ padding: '3rem', textAlign: 'center', color: '#64748B' }}>Loading study materials...</div>
      ) : materials.length === 0 ? (
        <div style={{ padding: '3rem', textAlign: 'center', color: '#64748B' }}>No study materials published yet.</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.25rem' }}>
          {materials.map(m => (
            <div key={m.id} className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                  <span style={{ padding: '0.2rem 0.5rem', background: '#EFF6FF', color: '#1D4ED8', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase' }}>
                    {m.type}
                  </span>
                  <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>
                    {new Date(m.created_at).toLocaleDateString()}
                  </span>
                </div>

                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0F172A', marginBottom: '0.35rem' }}>
                  {m.title}
                </h3>
                {m.description && (
                  <p style={{ fontSize: '0.82rem', color: '#64748B', lineHeight: 1.5, marginBottom: '1rem' }}>
                    {m.description}
                  </p>
                )}
              </div>

              <div style={{ borderTop: '1px solid #F1F5F9', paddingTop: '0.85rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.78rem', color: '#64748B' }}>
                  {m.subject_name || 'General Resource'}
                </span>
                {m.external_url && (
                  <a
                    href={m.external_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-sm btn-outline"
                    style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
                  >
                    <span>Open Resource</span>
                    <ExternalLink size={12} />
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Modal */}
      {showAddModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '1rem' }}>
          <div className="card" style={{ maxWidth: '460px', width: '100%', padding: '2rem' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>Publish Study Material</h3>
            <p style={{ color: '#64748B', fontSize: '0.85rem', marginBottom: '1.5rem' }}>Add notes, links, or slides for your students.</p>
            <form onSubmit={handleCreate}>
              <div className="form-group">
                <label className="form-label">Title</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Chapter 4 Newton's Laws Reference Slides"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div className="form-group">
                  <label className="form-label">Class</label>
                  <select className="form-select" value={classId} onChange={(e) => setClassId(e.target.value)} required disabled={classes.length === 0}>
                    {classes.length === 0 ? (
                      <option value="" disabled>No options</option>
                    ) : (
                      classes.map(c => <option key={c.class_id} value={c.class_id}>{c.class_name}</option>)
                    )}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Subject</label>
                  <select className="form-select" value={subjectId} onChange={(e) => setSubjectId(e.target.value)} required disabled={subjects.length === 0}>
                    {subjects.length === 0 ? (
                      <option value="" disabled>No options</option>
                    ) : (
                      subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)
                    )}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Resource Format</label>
                <select className="form-select" value={type} onChange={(e) => setType(e.target.value)}>
                  <option value="link">Web Link / Article</option>
                  <option value="pdf">PDF Document</option>
                  <option value="video">Video Recording</option>
                  <option value="slides">Presentation Slides</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Resource URL / Link</label>
                <input
                  type="url"
                  className="form-input"
                  placeholder="https://drive.google.com/file/..."
                  value={externalUrl}
                  onChange={(e) => setExternalUrl(e.target.value)}
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
                  placeholder="Brief summary of this reference handout..."
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
                <button type="button" onClick={() => setShowAddModal(false)} className="btn btn-outline">Cancel</button>
                <button type="submit" className="btn btn-primary">Add Resource</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
export default TeacherMaterialsPage;
