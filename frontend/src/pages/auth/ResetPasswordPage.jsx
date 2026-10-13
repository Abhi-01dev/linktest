import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { LinkTestLogo } from '../../components/common/LinkTestLogo';
import { Lock, CheckCircle, AlertCircle, ArrowRight } from 'lucide-react';

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!token) {
      setError('Missing or invalid reset token. Please request a new password reset link.');
    }
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    setLoading(true);
    try {
      await api.resetPassword(token, password);
      setSuccess(true);
      showToast('Password updated successfully! You can now log in.', 'success');
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err) {
      setError(err.message || 'Failed to reset password. The link may have expired.');
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
      <div className="card" style={{ maxWidth: '440px', width: '100%', padding: '2.25rem', boxShadow: 'var(--shadow-xl)' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <LinkTestLogo size="md" />
          <h2 style={{ fontSize: '1.5rem', marginTop: '1.25rem', marginBottom: '0.35rem' }}>
            Set New Password
          </h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
            Enter your new password below.
          </p>
        </div>

        {error && (
          <div
            style={{
              padding: '0.85rem 1rem',
              borderRadius: 'var(--radius-md)',
              background: '#FEE2E2',
              border: '1px solid #FCA5A5',
              color: '#991B1B',
              marginBottom: '1.5rem',
              fontSize: '0.875rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            <AlertCircle size={18} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        {success ? (
          <div style={{ textAlign: 'center', padding: '1.5rem 0' }}>
            <CheckCircle size={48} style={{ color: '#10B981', margin: '0 auto 1rem' }} />
            <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>Password Reset!</h3>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
              Redirecting you to the sign-in page...
            </p>
            <Link to="/login" className="btn btn-primary" style={{ width: '100%' }}>
              <span>Sign In Now</span>
              <ArrowRight size={16} />
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label" htmlFor="new-pw">
                New Password
              </label>
              <input
                id="new-pw"
                type="password"
                className="form-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 8 characters"
                required
                disabled={!token}
              />
            </div>

            <div className="form-group" style={{ marginBottom: '1.75rem' }}>
              <label className="form-label" htmlFor="confirm-pw">
                Confirm New Password
              </label>
              <input
                id="confirm-pw"
                type="password"
                className="form-input"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-type new password"
                required
                disabled={!token}
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', padding: '0.75rem' }}
              disabled={loading || !token}
            >
              {loading ? (
                <span>Resetting Password...</span>
              ) : (
                <>
                  <Lock size={18} />
                  <span>Update Password</span>
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
export default ResetPasswordPage;
