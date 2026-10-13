import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { User, Mail, Shield, Calendar, LogOut, BookOpen, Award } from 'lucide-react';

export function ProfilePage() {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div style={{ padding: '3rem 0 5rem' }}>
      <div className="container" style={{ maxWidth: '640px' }}>
        <div className="card" style={{ padding: '2.5rem', boxShadow: 'var(--shadow-md)' }}>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', marginBottom: '2rem' }}>
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: '50%',
                background: 'var(--color-navy)',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.75rem',
                fontWeight: 800,
                overflow: 'hidden'
              }}
            >
              {user?.avatar_url ? (
                <img
                  src={user.avatar_url}
                  alt={user.full_name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  onError={(e) => { e.currentTarget.style.display = 'none'; }}
                />
              ) : (
                user?.full_name?.charAt(0) || 'U'
              )}
            </div>
            <div>
              <h1 style={{ fontSize: '1.6rem', marginBottom: '0.25rem' }}>{user?.full_name}</h1>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span className="badge badge-orange">{user?.role}</span>
                <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>{user?.email}</span>
              </div>
            </div>
          </div>

          {/* Account Details List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2.5rem' }}>
            <div style={{ padding: '1rem', background: 'var(--color-bg-alt)', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <Mail size={18} style={{ color: 'var(--color-orange)' }} />
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', display: 'block' }}>Email Address</span>
                <strong style={{ fontSize: '0.95rem' }}>{user?.email}</strong>
              </div>
            </div>

            <div style={{ padding: '1rem', background: 'var(--color-bg-alt)', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <Shield size={18} style={{ color: 'var(--color-orange)' }} />
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', display: 'block' }}>Platform Role</span>
                <strong style={{ fontSize: '0.95rem' }}>{user?.role} ({isAdmin ? 'Full Administrator Access' : 'Student Learner'})</strong>
              </div>
            </div>

            <div style={{ padding: '1rem', background: 'var(--color-bg-alt)', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <Calendar size={18} style={{ color: 'var(--color-orange)' }} />
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', display: 'block' }}>Account Created</span>
                <strong style={{ fontSize: '0.95rem' }}>{user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'Active Member'}</strong>
              </div>
            </div>

            {/* Linked Identity Providers */}
            <div style={{
              padding: '1.25rem',
              background: '#FFFFFF',
              borderRadius: 'var(--radius-md)',
              border: '1px solid #E2E8F0',
              marginTop: '0.5rem'
            }}>
              <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--color-navy)', marginBottom: '0.75rem' }}>
                Connected Identities & Single Sign-On
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{
                    width: 34, height: 34, borderRadius: '50%',
                    background: '#F8FAFC', border: '1px solid #E2E8F0',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>
                    <svg width="18" height="18" viewBox="0 0 24 24">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
                    </svg>
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>Google Account</div>
                    <div style={{ fontSize: '0.78rem', color: user?.google_id ? '#166534' : '#64748B' }}>
                      {user?.google_id ? `Linked via Gmail (${user.email})` : 'Not linked to a Google identity'}
                    </div>
                  </div>
                </div>

                {user?.google_id ? (
                  <span style={{
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    color: '#166534',
                    background: '#DCFCE7',
                    padding: '0.25rem 0.65rem',
                    borderRadius: '999px'
                  }}>
                    Active
                  </span>
                ) : (
                  <span style={{
                    fontSize: '0.75rem',
                    color: '#64748B',
                    background: '#F1F5F9',
                    padding: '0.25rem 0.65rem',
                    borderRadius: '999px'
                  }}>
                    Local Password Only
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Action Links */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {isAdmin && (
              <Link to="/admin" className="btn btn-secondary">
                <Shield size={16} />
                <span>Go to Admin Portal</span>
              </Link>
            )}
            <Link to="/dashboard" className="btn btn-outline">
              <BookOpen size={16} />
              <span>Back to Dashboard</span>
            </Link>
            <button
              onClick={handleLogout}
              className="btn btn-outline"
              style={{ color: '#DC2626', borderColor: '#FCA5A5', background: '#FEF2F2' }}
            >
              <LogOut size={16} />
              <span>Sign Out of LinkTest</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
