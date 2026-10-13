import React from 'react';
import { LinkTestLogo } from './LinkTestLogo';

export function PageLoader({ label = 'Loading LinkTest...' }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '65vh',
        padding: '2rem',
        textAlign: 'center'
      }}
      aria-live="polite"
      aria-busy="true"
    >
      <div style={{ marginBottom: '1.25rem', animation: 'pulse 1.8s infinite ease-in-out' }}>
        <LinkTestLogo size="md" />
      </div>
      <div
        className="spinner"
        style={{
          width: '32px',
          height: '32px',
          borderWidth: '3px',
          borderColor: 'rgba(249, 115, 22, 0.2)',
          borderTopColor: 'var(--color-orange)',
          marginBottom: '1rem'
        }}
      ></div>
      <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', fontWeight: 600 }}>
        {label}
      </p>
    </div>
  );
}
