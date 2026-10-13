import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';
import { LinkTestLogo } from '../../components/common/LinkTestLogo';
import { Mail, CheckCircle, AlertCircle, ArrowLeft } from 'lucide-react';

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await api.forgotPassword(email);
      setSubmitted(true);
    } catch (err) {
      setError(err.message || 'Failed to send password reset email.');
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
            Reset Password
          </h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
            Enter your email address and we'll send you a password reset link.
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

        {submitted ? (
          <div style={{ textAlign: 'center', padding: '1rem 0' }}>
            <CheckCircle size={48} style={{ color: '#10B981', margin: '0 auto 1rem' }} />
            <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>Check Your Email</h3>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', marginBottom: '1.5rem', lineHeight: 1.5 }}>
              If an account exists for <strong>{email}</strong>, we have sent instructions to reset your password.
            </p>
            <Link to="/login" className="btn btn-outline" style={{ width: '100%' }}>
              <ArrowLeft size={16} />
              <span>Back to Sign In</span>
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="form-group" style={{ marginBottom: '1.75rem' }}>
              <label className="form-label" htmlFor="forgot-email">
                Registered Email Address
              </label>
              <input
                id="forgot-email"
                type="email"
                className="form-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                required
                autoFocus
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', padding: '0.75rem' }}
              disabled={loading}
            >
              {loading ? (
                <span>Sending Instructions...</span>
              ) : (
                <>
                  <Mail size={18} />
                  <span>Send Reset Link</span>
                </>
              )}
            </button>

            <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.875rem' }}>
              <Link to="/login" style={{ color: 'var(--color-text-muted)', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                <ArrowLeft size={14} />
                <span>Return to Sign In</span>
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
export default ForgotPasswordPage;
