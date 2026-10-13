import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { User, GraduationCap, Building, Award, Save, Mail } from 'lucide-react';

export function TeacherProfilePage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [employeeId, setEmployeeId] = useState('');
  const [department, setDepartment] = useState('');
  const [qualification, setQualification] = useState('');
  const [specialization, setSpecialization] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const { showToast } = useToast();

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const data = await api.getTeacherProfile();
        const p = data?.teacher_profile || {};
        setProfile(p);
        setEmployeeId(p.employee_id || '');
        setDepartment(p.department || '');
        setQualification(p.qualification || '');
        setSpecialization(p.specialization || '');
      } catch (err) {
        showToast(err.message || 'Failed to load faculty profile', 'error');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.updateTeacherProfile({
        employee_id: employeeId,
        department,
        qualification,
        specialization
      });
      showToast('Faculty profile updated successfully', 'success');
    } catch (err) {
      showToast(err.message || 'Failed to update profile', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div style={{ marginBottom: '1.75rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#0F172A', marginBottom: '0.25rem' }}>
          Faculty Profile & Academic Credentials
        </h1>
        <p style={{ color: '#64748B', fontSize: '0.875rem' }}>
          Manage your institutional department, qualifications, and faculty contact info.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem', alignItems: 'flex-start' }}>
        {/* Profile Card */}
        <div className="card" style={{ padding: '2rem', textAlign: 'center' }}>
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #2563EB, #1D4ED8)',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              fontSize: '1.8rem',
              margin: '0 auto 1rem'
            }}
          >
            {user?.full_name?.charAt(0) || 'T'}
          </div>

          <h3 style={{ fontSize: '1.3rem', fontWeight: 700, color: '#0F172A', margin: '0 0 0.25rem' }}>
            {user?.full_name}
          </h3>
          <p style={{ color: '#64748B', fontSize: '0.875rem', margin: '0 0 1rem' }}>
            {user?.email}
          </p>

          <div style={{ display: 'inline-flex', padding: '0.25rem 0.75rem', background: '#EFF6FF', color: '#1D4ED8', borderRadius: '999px', fontSize: '0.8rem', fontWeight: 700 }}>
            Verified Faculty Member
          </div>

          <div style={{ marginTop: '1.5rem', borderTop: '1px solid #E2E8F0', paddingTop: '1.25rem', textAlign: 'left', fontSize: '0.85rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span style={{ color: '#64748B' }}>Department:</span>
              <strong style={{ color: '#0F172A' }}>{department || 'General'}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#64748B' }}>Employee ID:</span>
              <strong style={{ color: '#0F172A' }}>{employeeId || 'FAC-1001'}</strong>
            </div>
          </div>
        </div>

        {/* Edit Form */}
        <div className="card" style={{ padding: '2rem' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '1.25rem', color: '#0F172A' }}>
            Academic Credentials & Department
          </h3>

          <form onSubmit={handleSave}>
            <div className="form-group">
              <label className="form-label">Employee / Faculty ID</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. EMP-PHY-09"
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Academic Department</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Department of Physics & Applied Sciences"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Degree / Qualifications</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Ph.D. in Theoretical Physics, M.Sc."
                value={qualification}
                onChange={(e) => setQualification(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Specialization / Research Area</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Quantum Mechanics, Astrophysics"
                value={specialization}
                onChange={(e) => setSpecialization(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={saving}
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
              >
                <Save size={16} />
                <span>{saving ? 'Saving...' : 'Update Faculty Profile'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
export default TeacherProfilePage;
