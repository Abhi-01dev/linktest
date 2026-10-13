import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { Megaphone, Plus, Bell, Calendar, User } from 'lucide-react';

export function AdminAnnouncementsPage() {
  const [announcements, setAnnouncements] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [targetType, setTargetType] = useState('global');
  const [targetId, setTargetId] = useState('');

  const { showToast } = useToast();

  const loadData = async () => {
    try {
      setLoading(true);
      const [aList, cList] = await Promise.all([
        api.getAdminAnnouncements(),
        api.getAdminClasses()
      ]);
      setAnnouncements(aList || []);
      setClasses(cList || []);
      if (cList?.length > 0) setTargetId(cList[0].id);
    } catch (err) {
      showToast(err.message || 'Failed to load announcements', 'error');
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
      await api.createAdminAnnouncement({
        title,
        content,
        target_type: targetType,
        target_id: targetType === 'class' ? targetId : null
      });
      showToast('Announcement broadcasted successfully', 'success');
      setShowAddModal(false);
      setTitle('');
      setContent('');
      loadData();
    } catch (err) {
      showToast(err.message || 'Failed to post announcement', 'error');
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.75rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#0F172A', marginBottom: '0.25rem' }}>
            Campus Bulletins & Announcements
          </h1>
          <p style={{ color: '#64748B', fontSize: '0.875rem' }}>
            Broadcast campus-wide notices, exam schedules, and class updates to teachers and students.
          </p>
        </div>
        <button onClick={() => setShowAddModal(true)} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Plus size={16} />
          <span>Post Announcement</span>
        </button>
      </div>

      {loading ? (
        <div style={{ padding: '3rem', textAlign: 'center', color: '#64748B' }}>Loading bulletins...</div>
      ) : announcements.length === 0 ? (
        <div style={{ padding: '3rem', textAlign: 'center', color: '#64748B' }}>No bulletins posted yet.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {announcements.map(a => (
            <div key={a.id} className="card" style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <div style={{ padding: '0.4rem', background: '#FEF3C7', color: '#D97706', borderRadius: '8px' }}>
                    <Megaphone size={18} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#0F172A' }}>{a.title}</h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', fontSize: '0.78rem', color: '#64748B', marginTop: '0.2rem' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                        <User size={12} />
                        {a.author_name || 'Admin'}
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                        <Calendar size={12} />
                        {new Date(a.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>

                <span style={{
                  padding: '0.2rem 0.65rem',
                  borderRadius: '999px',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  background: a.target_type === 'global' ? '#EFF6FF' : '#F0FDF4',
                  color: a.target_type === 'global' ? '#1D4ED8' : '#166534'
                }}>
                  {a.target_type === 'global' ? 'Global (All)' : `Class: ${a.target_name || a.target_id || 'Class'}`}
                </span>
              </div>

              <p style={{ fontSize: '0.9rem', color: '#334155', lineHeight: 1.6, whiteSpace: 'pre-wrap', marginTop: '0.5rem' }}>
                {a.content}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Add Modal */}
      {showAddModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '1rem' }}>
          <div className="card" style={{ maxWidth: '480px', width: '100%', padding: '2rem' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>Broadcast Announcement</h3>
            <p style={{ color: '#64748B', fontSize: '0.85rem', marginBottom: '1.5rem' }}>Draft notice and select recipient target group.</p>
            <form onSubmit={handleCreate}>
              <div className="form-group">
                <label className="form-label">Target Audience</label>
                <select className="form-select" value={targetType} onChange={(e) => setTargetType(e.target.value)}>
                  <option value="global">All Platform Users (Global)</option>
                  <option value="class">Specific Class Only</option>
                </select>
              </div>

              {targetType === 'class' && (
                <div className="form-group">
                  <label className="form-label">Select Class</label>
                  <select className="form-select" value={targetId} onChange={(e) => setTargetId(e.target.value)} required>
                    {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              )}

              <div className="form-group">
                <label className="form-label">Notice Title</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Midterm Examination Schedule Released"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Content</label>
                <textarea
                  className="form-input"
                  rows={4}
                  placeholder="Detailed announcement text..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
                <button type="button" onClick={() => setShowAddModal(false)} className="btn btn-outline">Cancel</button>
                <button type="submit" className="btn btn-primary">Post Announcement</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
export default AdminAnnouncementsPage;
