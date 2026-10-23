import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { LinkTestLogo } from '../../components/common/LinkTestLogo';
import { GoogleSignInButton } from '../../components/auth/GoogleSignInButton';
import { UserPlus, AlertCircle } from 'lucide-react';

export function RegisterPage() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { register, loginWithGoogle } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const handleGoogleSuccess = async (credential) => {
    setError('');
    setLoading(true);

    try {
      const user = await loginWithGoogle(credential);
      showToast(`Welcome to LinkTest, ${user.full_name}! Account verified with Google.`, 'success');
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Google registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleError = (err) => {
    setError(err?.message || 'Google Sign-Up was cancelled or failed.');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match. Please re-enter.');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    setLoading(true);

    try {
      const result = await register(fullName, email, password);
      showToast(result.message || 'Account created! Please verify your email with the 6-digit code.', 'success');
      navigate(`/verify-email?email=${encodeURIComponent(email)}`);
    } catch (err) {
      setError(err.message || 'Registration failed. Please check your information.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '80vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2.5rem 1.5rem',
        background: 'radial-gradient(circle at 50% 10%, rgba(249, 115, 22, 0.05) 0%, transparent 60%)'
      }}
    >
      <div className="card" style={{ maxWidth: '460px', width: '100%', padding: '2.25rem', boxShadow: 'var(--shadow-xl)' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <LinkTestLogo size="md" />
          <h2 style={{ fontSize: '1.6rem', marginTop: '1.25rem', marginBottom: '0.35rem' }}>
            Create Your Account
          </h2>
          <p style={{ fontSize: '0.9rem' }}>
            Join LinkTest to start courses, practice quizzes, and consult the AI tutor.
          </p>
        </div>

        {error && (
          <div
            style={{
              padding: '0.75rem 1rem',
              borderRadius: 'var(--radius-md)',
              background: '#FEF2F2',
              border: '1px solid #FCA5A5',
              color: '#B91C1C',
              fontSize: '0.875rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              marginBottom: '1.5rem'
            }}
          >
            <AlertCircle size={18} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        {/* Google Sign-Up */}
        <div style={{ marginBottom: '1.25rem' }}>
          <GoogleSignInButton
            onSuccess={handleGoogleSuccess}
            onError={handleGoogleError}
            text="Sign up with Google"
            disabled={loading}
          />
        </div>

        {/* Visual Divider */}
        <div style={{ display: 'flex', alignItems: 'center', margin: '1.25rem 0', gap: '0.75rem' }}>
          <div style={{ flex: 1, height: '1px', background: '#E2E8F0' }}></div>
          <span style={{ fontSize: '0.75rem', color: '#94A3B8', fontWeight: 700, textTransform: 'uppercase' }}>
            or register with email
          </span>
          <div style={{ flex: 1, height: '1px', background: '#E2E8F0' }}></div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="register-name">
              Full Name
            </label>
            <input
              id="register-name"
              type="text"
              className="form-input"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="e.g. Aarav Sharma"
              required
              autoFocus
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="register-email">
              Email Address
            </label>
            <input
              id="register-email"
              type="email"
              className="form-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="register-password">
              Password
            </label>
            <input
              id="register-password"
              type="password"
              className="form-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 8 characters"
              required
            />
          </div>

          <div className="form-group" style={{ marginBottom: '1.75rem' }}>
            <label className="form-label" htmlFor="register-confirm">
              Confirm Password
            </label>
            <input
              id="register-confirm"
              type="password"
              className="form-input"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter password"
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', padding: '0.75rem' }}
            disabled={loading}
          >
            {loading ? (
              <span>Creating Account...</span>
            ) : (
              <>
                <UserPlus size={18} />
                <span>Create Student Account</span>
              </>
            )}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '1.75rem', fontSize: '0.875rem' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: 'var(--color-orange-dark)', fontWeight: 700 }}>
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
