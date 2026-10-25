import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { Megaphone, Plus, Calendar, School } from 'lucide-react';

export function TeacherAnnouncementsPage() {
  const [announcements, setAnnouncements] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [classId, setClassId] = useState('');

  const { showToast } = useToast();

  const loadData = async () => {
    try {
      setLoading(true);
      const [aList, cList] = await Promise.all([
        api.getTeacherAnnouncements(),
        api.getTeacherClasses()
      ]);
      setAnnouncements(aList || []);
      setClasses(cList || []);
      if (cList?.length > 0) setClassId(cList[0].class_id);
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
      await api.createTeacherAnnouncement({
        title,
        content,
        target_type: 'class',
        target_id: classId
      });
      showToast('Class announcement published successfully', 'success');
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
            Classroom Notices & Announcements
          </h1>
          <p style={{ color: '#64748B', fontSize: '0.875rem' }}>
            Post timely reminders, syllabus milestones, and test notifications to your students.
          </p>
        </div>
        <button onClick={() => setShowAddModal(true)} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Plus size={16} />
          <span>Post Notice</span>
        </button>
      </div>

      {loading ? (
        <div style={{ padding: '3rem', textAlign: 'center', color: '#64748B' }}>Loading notices...</div>
      ) : announcements.length === 0 ? (
        <div style={{ padding: '3rem', textAlign: 'center', color: '#64748B' }}>No notices published yet.</div>
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
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.78rem', color: '#64748B', marginTop: '0.2rem' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <Calendar size={12} />
                        {new Date(a.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>

                <span style={{ padding: '0.2rem 0.6rem', background: '#EFF6FF', color: '#1D4ED8', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 700 }}>
                  {a.target_type === 'global' ? 'Campus-Wide' : 'Class Notice'}
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
          <div className="card" style={{ maxWidth: '460px', width: '100%', padding: '2rem' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>Post Class Notice</h3>
            <p style={{ color: '#64748B', fontSize: '0.85rem', marginBottom: '1.5rem' }}>Broadcast a message to enrolled students in this division.</p>
            <form onSubmit={handleCreate}>
              <div className="form-group">
                <label className="form-label">Target Class</label>
                <select className="form-select" value={classId} onChange={(e) => setClassId(e.target.value)} required disabled={classes.length === 0}>
                  {classes.length === 0 ? (
                    <option value="" disabled>No options</option>
                  ) : (
                    classes.map(c => <option key={c.class_id} value={c.class_id}>{c.class_name}</option>)
                  )}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Subject Title</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Bring scientific calculator for Friday lab test"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Notice Details</label>
                <textarea
                  className="form-input"
                  rows={4}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Full text of the announcement..."
                  required
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
                <button type="button" onClick={() => setShowAddModal(false)} className="btn btn-outline">Cancel</button>
                <button type="submit" className="btn btn-primary">Post Notice</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
export default TeacherAnnouncementsPage;
