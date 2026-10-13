import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { School, Plus, Users, Layers, ChevronRight, ArrowRight } from 'lucide-react';

export function AdminClassesPage() {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddClass, setShowAddClass] = useState(false);
  const [showAddBatch, setShowAddBatch] = useState(false);
  const [selectedClassForBatch, setSelectedClassForBatch] = useState(null);

  // Form states
  const [className, setClassName] = useState('');
  const [classDesc, setClassDesc] = useState('');
  const [batchName, setBatchName] = useState('');
  const [batchCapacity, setBatchCapacity] = useState(40);

  const { showToast } = useToast();

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await api.getAdminClasses();
      // Also load batches for each class
      const classesWithBatches = await Promise.all(
        (data || []).map(async (c) => {
          const batches = await api.getAdminBatches(c.id);
          return { ...c, batches: batches || [] };
        })
      );
      setClasses(classesWithBatches);
    } catch (err) {
      showToast(err.message || 'Failed to load classes', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateClass = async (e) => {
    e.preventDefault();
    try {
      await api.createAdminClass({ name: className, description: classDesc });
      showToast('Class created successfully', 'success');
      setShowAddClass(false);
      setClassName('');
      setClassDesc('');
      loadData();
    } catch (err) {
      showToast(err.message || 'Failed to create class', 'error');
    }
  };

  const handleCreateBatch = async (e) => {
    e.preventDefault();
    try {
      await api.createAdminBatch({
        class_id: selectedClassForBatch.id,
        name: batchName,
        capacity: Number(batchCapacity)
      });
      showToast('Batch created successfully', 'success');
      setShowAddBatch(false);
      setBatchName('');
      loadData();
    } catch (err) {
      showToast(err.message || 'Failed to create batch', 'error');
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.75rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#0F172A', marginBottom: '0.25rem' }}>
            Academic Classes & Batches
          </h1>
          <p style={{ color: '#64748B', fontSize: '0.875rem' }}>
            Configure academic grade levels, student divisions, and section batches.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <Link to="/admin/batches" className="btn btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', borderColor: '#2563EB', color: '#2563EB' }}>
            <Layers size={16} />
            <span>Manage Batches & Allocations</span>
          </Link>
          <button onClick={() => setShowAddClass(true)} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Plus size={16} />
            <span>Add New Class</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ padding: '3rem', textAlign: 'center', color: '#64748B' }}>Loading classes...</div>
      ) : classes.length === 0 ? (
        <div style={{ padding: '3rem', textAlign: 'center', color: '#64748B' }}>No classes configured yet.</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '1.25rem' }}>
          {classes.map((cls) => (
            <div key={cls.id} className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <div style={{ padding: '0.5rem', background: 'rgba(37, 99, 235, 0.1)', color: '#2563EB', borderRadius: '8px' }}>
                      <School size={20} />
                    </div>
                    <div>
                      <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#0F172A' }}>{cls.name}</h3>
                      <span style={{ fontSize: '0.75rem', color: '#64748B' }}>
                        {cls.student_count || 0} Enrolled Students
                      </span>
                    </div>
                  </div>
                </div>

                {cls.description && (
                  <p style={{ fontSize: '0.85rem', color: '#64748B', marginBottom: '1rem' }}>
                    {cls.description}
                  </p>
                )}

                {/* Batches section */}
                <div style={{ marginTop: '1rem', borderTop: '1px solid #F1F5F9', paddingTop: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>
                      Batches / Sections ({cls.batches?.length || 0})
                    </span>
                    <button
                      onClick={() => { setSelectedClassForBatch(cls); setShowAddBatch(true); }}
                      className="btn btn-ghost btn-sm"
                      style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem', color: '#2563EB' }}
                    >
                      + Add Batch
                    </button>
                  </div>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                    {cls.batches && cls.batches.length > 0 ? (
                      cls.batches.map(b => (
                        <span key={b.id} style={{ padding: '0.3rem 0.6rem', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '6px', fontSize: '0.8rem', color: '#334155' }}>
                          <strong>{b.name}</strong> <span style={{ color: '#94A3B8', fontSize: '0.75rem' }}>({b.student_count || 0}/{b.capacity || 40})</span>
                        </span>
                      ))
                    ) : (
                      <span style={{ fontSize: '0.8rem', color: '#94A3B8', fontStyle: 'italic' }}>No batches created yet.</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Class Modal */}
      {showAddClass && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '1rem' }}>
          <div className="card" style={{ maxWidth: '440px', width: '100%', padding: '2rem' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>Create New Class</h3>
            <p style={{ color: '#64748B', fontSize: '0.85rem', marginBottom: '1.5rem' }}>e.g. "Grade 10 - Science", "Batch 2026 CS"</p>
            <form onSubmit={handleCreateClass}>
              <div className="form-group">
                <label className="form-label">Class Name</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Class 10"
                  value={className}
                  onChange={(e) => setClassName(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea
                  className="form-input"
                  rows={3}
                  placeholder="Optional details..."
                  value={classDesc}
                  onChange={(e) => setClassDesc(e.target.value)}
                />
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
                <button type="button" onClick={() => setShowAddClass(false)} className="btn btn-outline">Cancel</button>
                <button type="submit" className="btn btn-primary">Create Class</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Batch Modal */}
      {showAddBatch && selectedClassForBatch && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '1rem' }}>
          <div className="card" style={{ maxWidth: '440px', width: '100%', padding: '2rem' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>Add Batch / Section</h3>
            <p style={{ color: '#64748B', fontSize: '0.85rem', marginBottom: '1.5rem' }}>For class <strong>{selectedClassForBatch.name}</strong></p>
            <form onSubmit={handleCreateBatch}>
              <div className="form-group">
                <label className="form-label">Batch Name / Section</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Section A, Morning Batch"
                  value={batchName}
                  onChange={(e) => setBatchName(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Student Capacity</label>
                <input
                  type="number"
                  className="form-input"
                  value={batchCapacity}
                  onChange={(e) => setBatchCapacity(e.target.value)}
                  min="1"
                  max="200"
                />
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
                <button type="button" onClick={() => setShowAddBatch(false)} className="btn btn-outline">Cancel</button>
                <button type="submit" className="btn btn-primary">Create Batch</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
export default AdminClassesPage;
