import React from 'react';
import { Link } from 'react-router-dom';

export function LinkTestLogo({ size = 'md', link = true, to = '/', light = false }) {
  const iconSizes = {
    sm: 24,
    md: 32,
    lg: 44
  };

  const textSizes = {
    sm: '1.1rem',
    md: '1.4rem',
    lg: '1.85rem'
  };

  const s = iconSizes[size] || 32;

  const content = (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.6rem', textDecoration: 'none' }}>
      <svg
        width={s}
        height={s}
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ flexShrink: 0 }}
      >
        <defs>
          <linearGradient id="linktest-grad" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
            <stop stopColor="#F97316" />
            <stop offset="1" stopColor="#EA580C" />
          </linearGradient>
          <linearGradient id="navy-grad" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
            <stop stopColor="#0F172A" />
            <stop offset="1" stopColor="#1E293B" />
          </linearGradient>
        </defs>
        {/* Background rounded squircle */}
        <rect width="40" height="40" rx="10" fill={light ? '#FFFFFF' : 'url(#navy-grad)'} />
        {/* Interconnected link chain + educational checkmark */}
        <path
          d="M17 23C15.3431 23 14 21.6569 14 20C14 18.3431 15.3431 17 17 17H21C22.6569 17 24 18.3431 24 20"
          stroke="url(#linktest-grad)"
          strokeWidth="3.2"
          strokeLinecap="round"
        />
        <path
          d="M23 17C24.6569 17 26 18.3431 26 20C26 21.6569 24.6569 23 23 23H19C17.3431 23 16 21.6569 16 20"
          stroke={light ? '#0F172A' : '#94A3B8'}
          strokeWidth="3.2"
          strokeLinecap="round"
        />
        {/* Accent Graduation Checkmark */}
        <path
          d="M20 28L23 31L30 24"
          stroke="#F97316"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1 }}>
        <span
          style={{
            fontFamily: 'var(--font-heading)',
            fontSize: textSizes[size] || '1.4rem',
            fontWeight: 800,
            letterSpacing: '-0.02em',
            color: light ? '#FFFFFF' : 'var(--color-navy)'
          }}
        >
          Link<span style={{ color: 'var(--color-orange)' }}>Test</span>
        </span>
      </div>
    </div>
  );

  if (link) {
    return (
      <Link to={to} style={{ display: 'inline-flex' }}>
        {content}
      </Link>
    );
  }

  return content;
}
