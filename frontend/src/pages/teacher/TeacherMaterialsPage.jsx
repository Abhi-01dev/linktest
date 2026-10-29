import React, { useState, useEffect } from 'react';
import { api, resolveFileUrl } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import {
  BookOpen,
  Plus,
  FileText,
  Video,
  Link as LinkIcon,
  Download,
  ExternalLink,
  Eye,
  Upload,
  Layers,
  FileCode,
  FileArchive,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

export function TeacherMaterialsPage() {
  const [materials, setMaterials] = useState([]);
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [uploadMode, setUploadMode] = useState('file'); // 'file' or 'url'
  const [selectedFile, setSelectedFile] = useState(null);
  const [type, setType] = useState('pdf');
  const [externalUrl, setExternalUrl] = useState('');
  const [selectedAssignmentId, setSelectedAssignmentId] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [submitting, setSubmitting] = useState(false);

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
      if (cList?.length > 0) {
        setSelectedAssignmentId(cList[0].id || `${cList[0].class_id}:${cList[0].batch_id || ''}`);
        if (cList[0].subject_id) setSubjectId(cList[0].subject_id);
      }
      if (sList?.length > 0 && !subjectId) {
        setSubjectId(sList[0].id);
      }
    } catch (err) {
      showToast(err.message || 'Failed to load study materials', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAssignmentChange = (assignmentId) => {
    setSelectedAssignmentId(assignmentId);
    const chosen = classes.find(c => (c.id === assignmentId || `${c.class_id}:${c.batch_id || ''}` === assignmentId));
    if (chosen?.subject_id) {
      setSubjectId(chosen.subject_id);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    // Auto-detect resource type from file name
    const ext = file.name.split('.').pop().toLowerCase();
    if (['pdf'].includes(ext)) {
      setType('pdf');
    } else if (['ppt', 'pptx'].includes(ext)) {
      setType('slides');
    } else if (['doc', 'docx', 'txt', 'rtf'].includes(ext)) {
      setType('doc');
    } else if (['mp4', 'mov', 'webm'].includes(ext)) {
      setType('video');
    }
    if (!title) {
      // Auto-fill title from filename without extension
      const baseName = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
      setTitle(baseName.charAt(0).toUpperCase() + baseName.slice(1));
    }
  };

  const resolveMaterialUrl = (item, download = false) => {
    const rawUrl = item.file_url || item.file_path || item.external_url || '';
    return resolveFileUrl(rawUrl, download, item.file_name);
  };

  const handleDownloadMaterial = async (m) => {
    const rawUrl = m.file_path || m.file_url;
    if (!rawUrl) return;
    try {
      showToast('Downloading study material...', 'info');
      await api.downloadFile(rawUrl, m.file_name || 'material.pdf');
      showToast('Material downloaded successfully!', 'success');
    } catch (err) {
      showToast(err.message || 'Failed to download material', 'error');
    }
  };

  const getDocIcon = (t) => {
    const lower = (t || '').toLowerCase();
    if (lower.includes('pdf')) return <FileText size={20} style={{ color: '#EF4444' }} />;
    if (lower.includes('slide') || lower.includes('ppt')) return <Layers size={20} style={{ color: '#F59E0B' }} />;
    if (lower.includes('doc')) return <BookOpen size={20} style={{ color: '#3B82F6' }} />;
    if (lower.includes('video')) return <Video size={20} style={{ color: '#8B5CF6' }} />;
    return <LinkIcon size={20} style={{ color: '#10B981' }} />;
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      showToast('Please provide a title for the study material', 'warning');
      return;
    }

    const chosenClass = classes.find(c => (c.id === selectedAssignmentId || `${c.class_id}:${c.batch_id || ''}` === selectedAssignmentId));
    const classId = chosenClass?.class_id || (classes[0] ? classes[0].class_id : null);
    const batchId = chosenClass?.batch_id || null;

    setSubmitting(true);
    try {
      let filePath = null;
      let fileName = null;
      let fileSize = null;

      if (uploadMode === 'file') {
        if (!selectedFile) {
          showToast('Please select a file to upload', 'warning');
          setSubmitting(false);
          return;
        }
        const uploadResult = await api.uploadFile(selectedFile, 'materials');
        filePath = uploadResult.file_path || uploadResult.url || uploadResult.file_url;
        fileName = uploadResult.file_name || uploadResult.filename || selectedFile.name;
        fileSize = uploadResult.file_size || uploadResult.size || selectedFile.size;
      } else {
        if (!externalUrl.trim()) {
          showToast('Please provide a valid web link or resource URL', 'warning');
          setSubmitting(false);
          return;
        }
      }

      await api.createTeacherMaterial({
        title: title.trim(),
        description: description.trim(),
        type,
        file_path: filePath,
        file_name: fileName,
        file_size: fileSize,
        external_url: uploadMode === 'url' ? externalUrl.trim() : null,
        class_id: classId,
        batch_id: batchId,
        subject_id: subjectId || chosenClass?.subject_id || null
      });

      showToast('Study resource published successfully!', 'success');
      setShowAddModal(false);
      setTitle('');
      setDescription('');
      setSelectedFile(null);
      setExternalUrl('');
      loadData();
    } catch (err) {
      showToast(err.message || 'Failed to add study material', 'error');
    } finally {
      setSubmitting(false);
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
            Upload lesson notes, PDF guides, presentation slides, and online reference links for your batches.
          </p>
        </div>
        <button onClick={() => setShowAddModal(true)} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Plus size={16} />
          <span>Upload Study Material</span>
        </button>
      </div>

      {loading ? (
        <div style={{ padding: '3.5rem 1rem', textAlign: 'center', color: '#64748B' }}>
          <div style={{ width: 28, height: 28, border: '3px solid #E2E8F0', borderTopColor: '#2563EB', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 0.75rem' }} />
          <span>Loading study materials...</span>
        </div>
      ) : materials.length === 0 ? (
        <div style={{ padding: '3.5rem 1.5rem', textAlign: 'center', background: '#F8FAFC', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
          <BookOpen size={36} style={{ color: '#94A3B8', margin: '0 auto 0.75rem' }} />
          <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#0F172A', margin: '0 0 0.35rem' }}>
            No study materials published yet
          </h3>
          <p style={{ color: '#64748B', fontSize: '0.85rem', margin: '0 auto 1.25rem', maxWidth: '420px' }}>
            Share slides, PDF documents, or external resources with students in your assigned batches.
          </p>
          <button onClick={() => setShowAddModal(true)} className="btn btn-primary btn-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
            <Plus size={14} />
            <span>Upload First Material</span>
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.25rem' }}>
          {materials.map(m => {
            const hasFile = Boolean(m.file_path || m.file_url);
            const hasExternal = Boolean(m.external_url);
            const viewUrl = resolveMaterialUrl(m, false);
            const downloadUrl = resolveMaterialUrl(m, true);

            return (
              <div key={m.id} className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.65rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      {getDocIcon(m.type)}
                      <span style={{ padding: '0.2rem 0.5rem', background: '#EFF6FF', color: '#1D4ED8', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase' }}>
                        {m.type || 'DOCUMENT'}
                      </span>
                    </div>
                    <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>
                      {m.created_at ? new Date(m.created_at).toLocaleDateString() : 'Active'}
                    </span>
                  </div>

                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0F172A', marginBottom: '0.35rem' }}>
                    {m.title}
                  </h3>
                  {m.description && (
                    <p style={{ fontSize: '0.82rem', color: '#64748B', lineHeight: 1.5, marginBottom: '0.75rem' }}>
                      {m.description}
                    </p>
                  )}

                  {hasFile && m.file_name && (
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', padding: '0.25rem 0.6rem', background: '#F1F5F9', borderRadius: '6px', fontSize: '0.75rem', color: '#475569', marginBottom: '0.75rem' }}>
                      <FileText size={12} />
                      <span style={{ maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {m.file_name}
                      </span>
                      {m.file_size && (
                        <span style={{ color: '#94A3B8' }}>({(m.file_size / 1024 / 1024).toFixed(1)} MB)</span>
                      )}
                    </div>
                  )}
                </div>

                <div style={{ borderTop: '1px solid #F1F5F9', paddingTop: '0.85rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#475569' }}>
                      {m.subject_name || 'General Resource'}
                    </span>
                    {(m.batch_name || m.class_name) && (
                      <span style={{ fontSize: '0.72rem', color: '#94A3B8' }}>
                        {m.batch_name ? `${m.batch_name} (${m.class_name})` : m.class_name}
                      </span>
                    )}
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
                        <button
                          type="button"
                          onClick={() => handleDownloadMaterial(m)}
                          className="btn btn-sm btn-outline"
                          style={{ fontSize: '0.75rem', padding: '0.25rem 0.55rem', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
                          title="Download file"
                        >
                          <Download size={12} />
                          <span>Download</span>
                        </button>
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
                        <span>Open Link</span>
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

      {/* Add Modal */}
      {showAddModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '1rem' }}>
          <div className="card" style={{ maxWidth: '520px', width: '100%', padding: '2rem', maxHeight: '90vh', overflowY: 'auto' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.35rem' }}>Publish Study Material</h3>
            <p style={{ color: '#64748B', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
              Upload lecture slides, PDF documents, or share web links for your assigned batches.
            </p>

            <form onSubmit={handleCreate}>
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label className="form-label">Material Title</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Chapter 4 Newton's Laws Reference Slides"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Batch & Class</label>
                  <select
                    className="form-select"
                    value={selectedAssignmentId}
                    onChange={(e) => handleAssignmentChange(e.target.value)}
                    required
                    disabled={classes.length === 0}
                  >
                    {classes.length === 0 ? (
                      <option value="" disabled>No classes assigned</option>
                    ) : (
                      classes.map(c => {
                        const val = c.id || `${c.class_id}:${c.batch_id || ''}`;
                        const label = c.batch_name ? `${c.batch_name} (${c.class_name})` : c.class_name;
                        return <option key={val} value={val}>{label}</option>;
                      })
                    )}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Subject</label>
                  <select
                    className="form-select"
                    value={subjectId}
                    onChange={(e) => setSubjectId(e.target.value)}
                    required
                    disabled={subjects.length === 0}
                  >
                    {subjects.length === 0 ? (
                      <option value="" disabled>No subjects</option>
                    ) : (
                      subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)
                    )}
                  </select>
                </div>
              </div>

              {/* Resource Mode: File vs URL */}
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label className="form-label">Resource Source</label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    type="button"
                    onClick={() => setUploadMode('file')}
                    className={`btn btn-sm ${uploadMode === 'file' ? 'btn-primary' : 'btn-outline'}`}
                    style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}
                  >
                    <Upload size={14} />
                    <span>Upload File (PDF / Slides)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setUploadMode('url')}
                    className={`btn btn-sm ${uploadMode === 'url' ? 'btn-primary' : 'btn-outline'}`}
                    style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}
                  >
                    <LinkIcon size={14} />
                    <span>Web Link / URL</span>
                  </button>
                </div>
              </div>

              {uploadMode === 'file' ? (
                <>
                  <div className="form-group" style={{ marginBottom: '1rem' }}>
                    <label className="form-label">Upload File (PDF, Slides, DOC)</label>
                    <input
                      type="file"
                      accept=".pdf,.ppt,.pptx,.doc,.docx,.txt,.zip"
                      onChange={handleFileChange}
                      className="form-input"
                      required={uploadMode === 'file' && !selectedFile}
                    />
                    {selectedFile && (
                      <div style={{ marginTop: '0.35rem', fontSize: '0.78rem', color: '#16A34A', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                        <CheckCircle size={13} />
                        <span>Selected: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(1)} MB)</span>
                      </div>
                    )}
                  </div>

                  <div className="form-group" style={{ marginBottom: '1rem' }}>
                    <label className="form-label">Format Type</label>
                    <select className="form-select" value={type} onChange={(e) => setType(e.target.value)}>
                      <option value="pdf">PDF Document</option>
                      <option value="slides">Presentation Slides (PPT/PDF)</option>
                      <option value="doc">Study Notes / Document</option>
                      <option value="video">Video Recording</option>
                    </select>
                  </div>
                </>
              ) : (
                <>
                  <div className="form-group" style={{ marginBottom: '1rem' }}>
                    <label className="form-label">Resource Format</label>
                    <select className="form-select" value={type} onChange={(e) => setType(e.target.value)}>
                      <option value="link">Web Link / Article</option>
                      <option value="video">Video Recording (YouTube / Vimeo / Drive)</option>
                      <option value="slides">Online Slides (Google Slides / Canva)</option>
                      <option value="pdf">External PDF Link</option>
                    </select>
                  </div>

                  <div className="form-group" style={{ marginBottom: '1rem' }}>
                    <label className="form-label">Resource URL / Link</label>
                    <input
                      type="url"
                      className="form-input"
                      placeholder="https://drive.google.com/file/... or https://..."
                      value={externalUrl}
                      onChange={(e) => setExternalUrl(e.target.value)}
                      required={uploadMode === 'url'}
                    />
                  </div>
                </>
              )}

              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label className="form-label">Description (Optional)</label>
                <textarea
                  className="form-input"
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Brief summary or reading instructions for students..."
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => setShowAddModal(false)}
                  className="btn btn-outline"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn btn-primary"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
                >
                  {submitting ? (
                    <>
                      <div style={{ width: 14, height: 14, border: '2px solid #FFFFFF', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                      <span>{uploadMode === 'file' ? 'Uploading...' : 'Publishing...'}</span>
                    </>
                  ) : (
                    <span>Publish Material</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default TeacherMaterialsPage;