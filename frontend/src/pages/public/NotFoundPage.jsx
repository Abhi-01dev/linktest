import React from 'react';
import { Link } from 'react-router-dom';
import { Home, ArrowLeft } from 'lucide-react';
import { LinkTestLogo } from '../../components/common/LinkTestLogo';

export function NotFoundPage() {
  return (
    <div
      style={{
        minHeight: '70vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '3rem 1.5rem',
        textAlign: 'center'
      }}
    >
      <div className="card" style={{ maxWidth: '480px', width: '100%', padding: '3rem 2rem' }}>
        <LinkTestLogo size="lg" />
        <h1
          style={{
            fontSize: '4.5rem',
            fontWeight: 800,
            color: 'var(--color-orange)',
            lineHeight: 1,
            marginTop: '1.5rem',
            marginBottom: '0.5rem'
          }}
        >
          404
        </h1>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '0.75rem' }}>Page Not Found</h2>
        <p style={{ fontSize: '0.95rem', color: 'var(--color-text-secondary)', marginBottom: '2rem' }}>
          The learning resource or path you requested does not exist or has been moved.
        </p>

        <div style={{ display: 'flex', justifyContent: 'center', gap: '0.75rem' }}>
          <Link to="/" className="btn btn-primary">
            <Home size={16} />
            <span>Return Home</span>
          </Link>
          <Link to="/courses" className="btn btn-outline">
            <span>Browse Courses</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
