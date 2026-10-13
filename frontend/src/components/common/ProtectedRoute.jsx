import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export function ProtectedRoute({ children, requiredRole = null }) {
  const { user, isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div
            style={{
              width: 44,
              height: 44,
              border: '3px solid var(--color-border)',
              borderTopColor: 'var(--color-orange)',
              borderRadius: '50%',
              animation: 'spin 0.8s linear infinite',
              margin: '0 auto 1rem'
            }}
          />
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>Verifying LinkTest session...</p>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requiredRole) {
    const isAllowed = Array.isArray(requiredRole)
      ? requiredRole.includes(user?.role)
      : user?.role === requiredRole;

    if (!isAllowed) {
      if (user?.role === 'ADMIN') return <Navigate to="/admin" replace />;
      if (user?.role === 'TEACHER') return <Navigate to="/teacher" replace />;
      return <Navigate to="/dashboard" replace />;
    }
  }

  return children;
}
