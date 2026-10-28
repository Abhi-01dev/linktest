import React, { useState } from 'react';
import { GoogleLogin } from '@react-oauth/google';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
const hasValidClientId =
  GOOGLE_CLIENT_ID &&
  GOOGLE_CLIENT_ID !== 'YOUR_GOOGLE_CLIENT_ID' &&
  !GOOGLE_CLIENT_ID.startsWith('YOUR_');

// Official Google 'G' icon
export function GoogleIcon({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
        fill="#EA4335"
      />
    </svg>
  );
}

export function GoogleSignInButton({
  onSuccess,
  onError,
  text = 'Continue with Google',
  disabled = false,
  width = '100%'
}) {
  const [internalLoading, setInternalLoading] = useState(false);

  // If a valid Google Client ID is configured, render the official Google Identity Services button.
  // Note: GoogleOAuthProvider is declared at the app root level (main.jsx) to avoid multiple
  // google.accounts.id.initialize() invocations across renders and page switches.
  if (hasValidClientId) {
    return (
      <div style={{ width, display: 'flex', justifyContent: 'center' }}>
        <GoogleLogin
          onSuccess={(credentialResponse) => {
            if (credentialResponse.credential) {
              onSuccess?.(credentialResponse.credential);
            } else {
              onError?.(new Error('No credential returned from Google.'));
            }
          }}
          onError={() => {
            onError?.(new Error('Google authentication cancelled or failed.'));
          }}
          theme="outline"
          size="large"
          shape="rectangular"
          text="continue_with"
          width={width === '100%' ? '380' : width}
        />
      </div>
    );
  }

  // Fallback handler when GOOGLE_CLIENT_ID is not configured
  const handleClickFallback = () => {
    if (disabled || internalLoading) return;
    setInternalLoading(true);
    onError?.(new Error('Google Sign-In is currently unavailable. Please sign in using your email and password.'));
    setInternalLoading(false);
  };

  return (
    <button
      type="button"
      onClick={handleClickFallback}
      disabled={disabled || internalLoading}
      className="btn"
      style={{
        width,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.75rem',
        background: '#FFFFFF',
        color: '#374151',
        border: '1px solid #D1D5DB',
        borderRadius: '6px',
        padding: '0.65rem 1rem',
        fontWeight: 600,
        fontSize: '0.9rem',
        boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
        cursor: disabled ? 'not-allowed' : 'pointer',
        transition: 'all 0.15s ease'
      }}
      title="Continue with Google"
    >
      <GoogleIcon size={18} />
      <span>{internalLoading ? 'Connecting to Google...' : text}</span>
    </button>
  );
}
