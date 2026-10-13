import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { LinkTestLogo } from '../../components/common/LinkTestLogo';
import { GoogleSignInButton } from '../../components/auth/GoogleSignInButton';
import { LogIn, AlertCircle, ArrowRight, ShieldCheck, UserCheck, GraduationCap } from 'lucide-react';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { login, loginWithGoogle } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/dashboard';

  const [unverifiedEmail, setUnverifiedEmail] = useState('');

  const handleGoogleSuccess = async (credential) => {
    setError('');
    setUnverifiedEmail('');
    setLoading(true);

    try {
      const user = await loginWithGoogle(credential);
      showToast(`Welcome back, ${user.full_name}! Signed in with Google.`, 'success');
      if (from === '/dashboard') {
        if (user.role === 'ADMIN') {
          navigate('/admin');
        } else if (user.role === 'TEACHER') {
          navigate('/teacher');
        } else {
          navigate('/dashboard');
        }
      } else {
        navigate(from, { replace: true });
      }
    } catch (err) {
      setError(err.message || 'Google Sign-In failed. Please try again or use your email & password.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleError = (err) => {
    setError(err?.message || 'Google Sign-In was cancelled or failed.');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setUnverifiedEmail('');
    setLoading(true);

    try {
      const user = await login(email, password);
      showToast(`Welcome back, ${user.full_name}!`, 'success');
      if (from === '/dashboard') {
        if (user.role === 'ADMIN') {
          navigate('/admin');
        } else if (user.role === 'TEACHER') {
          navigate('/teacher');
        } else {
          navigate('/dashboard');
        }
      } else {
        navigate(from, { replace: true });
      }
    } catch (err) {
      if (err.code === 'EMAIL_NOT_VERIFIED') {
        setUnverifiedEmail(err.details?.email || email);
      } else {
        setError(err.message || 'Login failed. Please verify your credentials.');
      }
    } finally {
      setLoading(false);
    }
  };

  const fillStudentDemo = () => {
    setEmail('student@linktest.io');
    setPassword('Student123!');
    setError('');
    setUnverifiedEmail('');
  };

  const fillTeacherDemo = () => {
    setEmail('teacher@linktest.io');
    setPassword('Teacher123!');
    setError('');
    setUnverifiedEmail('');
  };

  const fillAdminDemo = () => {
    setEmail('admin@linktest.io');
    setPassword('Admin123!');
    setError('');
    setUnverifiedEmail('');
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
      <div className="card" style={{ maxWidth: '440px', width: '100%', padding: '2.25rem', boxShadow: 'var(--shadow-xl)' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <LinkTestLogo size="md" />
          <h2 style={{ fontSize: '1.6rem', marginTop: '1.25rem', marginBottom: '0.35rem' }}>
            Sign in to LinkTest
          </h2>
          <p style={{ fontSize: '0.9rem' }}>
            Enter your credentials to continue your learning journey.
          </p>
        </div>

        {unverifiedEmail && (
          <div
            style={{
              padding: '1rem',
              borderRadius: 'var(--radius-md)',
              background: '#FFFBEB',
              border: '1px solid #FCD34D',
              color: '#92400E',
              marginBottom: '1.5rem',
              textAlign: 'left'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, marginBottom: '0.35rem' }}>
              <AlertCircle size={18} style={{ color: '#D97706', flexShrink: 0 }} />
              <span>Email Verification Required</span>
            </div>
            <p style={{ fontSize: '0.85rem', marginBottom: '0.85rem', lineHeight: 1.5 }}>
              Your account is created but your email is not verified yet. Please enter the 6-digit code sent to your email to activate your account.
            </p>
            <button
              type="button"
              onClick={() => navigate(`/verify-email?email=${encodeURIComponent(unverifiedEmail)}`)}
              className="btn btn-primary btn-sm"
              style={{ width: '100%' }}
            >
              Verify Email Address Now →
            </button>
          </div>
        )}

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

        {/* Demo One-Click Fill Helpers */}
        <div
          style={{
            background: 'var(--color-bg-alt)',
            borderRadius: 'var(--radius-md)',
            padding: '0.85rem',
            marginBottom: '1.5rem',
            border: '1px dashed var(--color-border)'
          }}
        >
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: '0.5rem', textAlign: 'center' }}>
            ⚡ Instant Demo Accounts
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.4rem' }}>
            <button
              type="button"
              onClick={fillStudentDemo}
              className="btn btn-outline btn-sm"
              style={{ fontSize: '0.74rem', padding: '0.35rem 0.2rem' }}
            >
              <UserCheck size={13} style={{ color: 'var(--color-orange)' }} />
              <span>Student</span>
            </button>
            <button
              type="button"
              onClick={fillTeacherDemo}
              className="btn btn-outline btn-sm"
              style={{ fontSize: '0.74rem', padding: '0.35rem 0.2rem' }}
            >
              <GraduationCap size={13} style={{ color: '#2563EB' }} />
              <span>Teacher</span>
            </button>
            <button
              type="button"
              onClick={fillAdminDemo}
              className="btn btn-outline btn-sm"
              style={{ fontSize: '0.74rem', padding: '0.35rem 0.2rem' }}
            >
              <ShieldCheck size={13} style={{ color: '#DC2626' }} />
              <span>Admin</span>
            </button>
          </div>
        </div>

        {/* Google Sign-In */}
        <div style={{ marginBottom: '1.25rem' }}>
          <GoogleSignInButton
            onSuccess={handleGoogleSuccess}
            onError={handleGoogleError}
            text="Continue with Google"
            disabled={loading}
          />
        </div>

        {/* Visual Divider */}
        <div style={{ display: 'flex', alignItems: 'center', margin: '1.25rem 0', gap: '0.75rem' }}>
          <div style={{ flex: 1, height: '1px', background: '#E2E8F0' }}></div>
          <span style={{ fontSize: '0.75rem', color: '#94A3B8', fontWeight: 700, textTransform: 'uppercase' }}>
            or with email
          </span>
          <div style={{ flex: 1, height: '1px', background: '#E2E8F0' }}></div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="login-email">
              Email Address
            </label>
            <input
              id="login-email"
              type="email"
              className="form-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. student@linktest.io"
              required
              autoFocus
            />
          </div>

          <div className="form-group" style={{ marginBottom: '1.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label className="form-label" htmlFor="login-password">
                Password
              </label>
              <Link to="/forgot-password" style={{ fontSize: '0.8rem', color: 'var(--color-orange-dark)', fontWeight: 600 }}>
                Forgot Password?
              </Link>
            </div>
            <input
              id="login-password"
              type="password"
              className="form-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
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
              <span>Authenticating...</span>
            ) : (
              <>
                <LogIn size={18} />
                <span>Sign In</span>
              </>
            )}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '1.75rem', fontSize: '0.875rem' }}>
          Don't have an account yet?{' '}
          <Link to="/register" style={{ color: 'var(--color-orange-dark)', fontWeight: 700 }}>
            Sign up free
          </Link>
        </div>
      </div>
    </div>
  );
}
