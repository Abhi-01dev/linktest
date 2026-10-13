import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { api } from '../../services/api';
import { LinkTestLogo } from '../../components/common/LinkTestLogo';
import {
  Mail,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  ArrowRight,
  ShieldCheck,
  Clock,
  Sparkles
} from 'lucide-react';

export function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { verifyEmail } = useAuth();
  const { showToast } = useToast();

  const emailParam = searchParams.get('email') || '';
  const [email, setEmail] = useState(emailParam);
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [cooldown, setCooldown] = useState(60);

  const inputRefs = useRef([]);

  // Obfuscate email for privacy: aarav@example.com -> a***v@example.com
  const maskEmail = (rawEmail) => {
    if (!rawEmail || !rawEmail.includes('@')) return rawEmail;
    const [name, domain] = rawEmail.split('@');
    if (name.length <= 2) return `${name.charAt(0)}*@${domain}`;
    return `${name.charAt(0)}${'*'.repeat(Math.min(name.length - 2, 4))}${name.slice(-1)}@${domain}`;
  };

  // 60-second cooldown timer
  useEffect(() => {
    let timer;
    if (cooldown > 0) {
      timer = setInterval(() => {
        setCooldown(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [cooldown]);

  // Focus first input on mount
  useEffect(() => {
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, []);

  const handleDigitChange = (index, value) => {
    setError('');
    // Accept only digits
    const cleanVal = value.replace(/\D/g, '');
    if (!cleanVal) {
      const nextDigits = [...otpDigits];
      nextDigits[index] = '';
      setOtpDigits(nextDigits);
      return;
    }

    const nextDigits = [...otpDigits];
    nextDigits[index] = cleanVal.slice(-1); // Take the latest single digit
    setOtpDigits(nextDigits);

    // Auto-advance to next box
    if (index < 5 && cleanVal) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      // Navigate to previous input on backspace if current is empty
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    setError('');
    const pastedData = e.clipboardData.getData('text').trim().replace(/\D/g, '');
    if (!pastedData) return;

    const chars = pastedData.slice(0, 6).split('');
    const nextDigits = [...otpDigits];
    chars.forEach((c, i) => {
      nextDigits[i] = c;
    });
    setOtpDigits(nextDigits);

    // Focus on next available empty box or last box
    const nextFocusIndex = Math.min(chars.length, 5);
    inputRefs.current[nextFocusIndex]?.focus();
  };

  const currentOtp = otpDigits.join('');

  const handleVerify = async (e) => {
    if (e) e.preventDefault();
    if (currentOtp.length !== 6) {
      setError('Please enter the complete 6-digit verification code.');
      return;
    }

    if (!email) {
      setError('Email address is missing. Please return to the registration page.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      await verifyEmail(email, currentOtp);
      setSuccess(true);
      showToast('Email verified successfully! Welcome to LinkTest.', 'success');
      setTimeout(() => {
        navigate('/dashboard');
      }, 1500);
    } catch (err) {
      setError(err.message || 'Verification failed. Please check the code and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (cooldown > 0 || resending || !email) return;

    setError('');
    setResending(true);

    try {
      const res = await api.resendVerification(email);
      showToast(res.message || 'New verification code sent to your email!', 'success');
      setCooldown(60);
      setOtpDigits(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } catch (err) {
      setError(err.message || 'Failed to resend verification code. Please try again later.');
    } finally {
      setResending(false);
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
      <div className="card" style={{ maxWidth: '480px', width: '100%', padding: '2.5rem', boxShadow: 'var(--shadow-xl)', textAlign: 'center' }}>
        <LinkTestLogo size="md" />

        {success ? (
          <div style={{ marginTop: '2rem', animation: 'scaleUp 0.3s ease-out' }}>
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: '50%',
                background: '#ECFDF5',
                color: '#10B981',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1.25rem'
              }}
            >
              <CheckCircle2 size={36} />
            </div>
            <h2 style={{ fontSize: '1.6rem', color: '#065F46', marginBottom: '0.5rem' }}>
              Email Verified!
            </h2>
            <p style={{ fontSize: '0.95rem', color: 'var(--color-text-secondary)', marginBottom: '1.5rem' }}>
              Your student account has been verified. Redirecting you to your learning dashboard...
            </p>
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <div
                style={{
                  width: 24,
                  height: 24,
                  border: '3px solid var(--color-border)',
                  borderTopColor: 'var(--color-orange)',
                  borderRadius: '50%',
                  animation: 'spin 0.8s linear infinite'
                }}
              />
            </div>
          </div>
        ) : (
          <>
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: '50%',
                background: '#FFEDD5',
                color: 'var(--color-orange)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '1.5rem auto 1rem'
              }}
            >
              <Mail size={28} />
            </div>

            <h1 style={{ fontSize: '1.75rem', marginBottom: '0.35rem' }}>
              Verify Your Email
            </h1>

            <p style={{ fontSize: '0.925rem', color: 'var(--color-text-secondary)', marginBottom: '1.5rem' }}>
              We sent a 6-digit verification code to
              <br />
              <strong style={{ color: 'var(--color-navy)' }}>
                {maskEmail(email) || 'your registered email'}
              </strong>
            </p>

            {error && (
              <div
                style={{
                  padding: '0.75rem 1rem',
                  borderRadius: 'var(--radius-md)',
                  background: '#FEF2F2',
                  border: '1px solid #FCA5A5',
                  color: '#B91C1C',
                  fontSize: '0.85rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  marginBottom: '1.5rem',
                  textAlign: 'left'
                }}
              >
                <AlertCircle size={18} style={{ flexShrink: 0 }} />
                <span>{error}</span>
              </div>
            )}

            {/* 6-Digit OTP Boxes */}
            <form onSubmit={handleVerify}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  gap: '0.6rem',
                  marginBottom: '1.75rem'
                }}
              >
                {otpDigits.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={(el) => (inputRefs.current[idx] = el)}
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleDigitChange(idx, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(idx, e)}
                    onPaste={handlePaste}
                    disabled={loading}
                    style={{
                      width: '48px',
                      height: '56px',
                      textAlign: 'center',
                      fontSize: '1.5rem',
                      fontWeight: 700,
                      borderRadius: 'var(--radius-md)',
                      border: `2px solid ${digit ? 'var(--color-orange)' : 'var(--color-border)'}`,
                      background: digit ? '#FFF7ED' : '#FFFFFF',
                      color: digit ? '#C2410C' : 'var(--color-navy)',
                      outline: 'none',
                      transition: 'all 0.15s ease'
                    }}
                  />
                ))}
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                style={{ width: '100%', padding: '0.75rem', marginBottom: '1rem' }}
                disabled={currentOtp.length !== 6 || loading}
              >
                {loading ? (
                  <span>Verifying Code...</span>
                ) : (
                  <>
                    <ShieldCheck size={18} />
                    <span>Verify Email Address</span>
                  </>
                )}
              </button>
            </form>

            {/* Resend Action & Live Cooldown */}
            <div style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginTop: '0.5rem' }}>
              Didn't receive the email?{' '}
              {cooldown > 0 ? (
                <span style={{ color: 'var(--color-text-muted)', fontWeight: 600 }}>
                  Resend code in {cooldown}s
                </span>
              ) : (
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={resending}
                  style={{
                    color: 'var(--color-orange-dark)',
                    fontWeight: 700,
                    textDecoration: 'underline',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer'
                  }}
                >
                  {resending ? 'Sending...' : 'Resend Code'}
                </button>
              )}
            </div>

            <div style={{ marginTop: '1.75rem', paddingTop: '1.25rem', borderTop: '1px solid var(--color-border)', fontSize: '0.85rem' }}>
              <Link to="/login" style={{ color: 'var(--color-text-muted)' }}>
                ← Return to Sign In
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
