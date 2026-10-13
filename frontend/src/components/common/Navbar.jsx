import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { LinkTestLogo } from './LinkTestLogo';
import {
  BookOpen,
  Sparkles,
  LayoutDashboard,
  Award,
  ShieldAlert,
  LogOut,
  User,
  Menu,
  X,
  GraduationCap,
  FileCheck2
} from 'lucide-react';

export function Navbar() {
  const { user, isAuthenticated, isAdmin, isTeacher, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
    setMobileMenuOpen(false);
  };

  const isActive = (path) => location.pathname === path;

  return (
    <header
      style={{
        background: '#FFFFFF',
        borderBottom: '1px solid var(--color-border)',
        position: 'sticky',
        top: 0,
        zIndex: 50,
        boxShadow: 'var(--shadow-sm)'
      }}
    >
      <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '70px' }}>
        {/* Brand Logo */}
        <LinkTestLogo size="md" />

        {/* Desktop Navigation Links */}
        <nav style={{ display: 'none', alignItems: 'center', gap: '1.75rem' }} className="desktop-nav">
          <Link
            to="/courses"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              fontWeight: 600,
              fontSize: '0.92rem',
              color: isActive('/courses') ? 'var(--color-orange-dark)' : 'var(--color-text-secondary)',
              transition: 'color var(--transition-fast)'
            }}
          >
            <BookOpen size={17} />
            <span>Courses</span>
          </Link>

          <Link
            to="/ai-tutor"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              fontWeight: 600,
              fontSize: '0.92rem',
              color: isActive('/ai-tutor') ? 'var(--color-orange-dark)' : 'var(--color-text-secondary)',
              transition: 'color var(--transition-fast)'
            }}
          >
            <Sparkles size={17} style={{ color: 'var(--color-orange)' }} />
            <span>AI Tutor</span>
          </Link>

          <Link
            to="/mock-tests"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              fontWeight: 600,
              fontSize: '0.92rem',
              color: isActive('/mock-tests') ? 'var(--color-orange-dark)' : 'var(--color-text-secondary)',
              transition: 'color var(--transition-fast)'
            }}
          >
            <FileCheck2 size={17} style={{ color: 'var(--color-orange)' }} />
            <span>Mock Tests</span>
          </Link>

          {isAuthenticated && (
            <>
              <Link
                to="/dashboard"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  fontWeight: 600,
                  fontSize: '0.92rem',
                  color: isActive('/dashboard') ? 'var(--color-orange-dark)' : 'var(--color-text-secondary)',
                  transition: 'color var(--transition-fast)'
                }}
              >
                <LayoutDashboard size={17} />
                <span>Dashboard</span>
              </Link>

              <Link
                to="/progress"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  fontWeight: 600,
                  fontSize: '0.92rem',
                  color: isActive('/progress') ? 'var(--color-orange-dark)' : 'var(--color-text-secondary)',
                  transition: 'color var(--transition-fast)'
                }}
              >
                <Award size={17} />
                <span>My Progress</span>
              </Link>
            </>
          )}

          {isTeacher && (
            <Link
              to="/teacher"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                fontWeight: 700,
                fontSize: '0.92rem',
                color: '#2563EB',
                background: '#EFF6FF',
                padding: '0.35rem 0.75rem',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid #BFDBFE'
              }}
            >
              <GraduationCap size={16} />
              <span>Teacher Portal</span>
            </Link>
          )}

          {isAdmin && (
            <Link
              to="/admin"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                fontWeight: 700,
                fontSize: '0.92rem',
                color: '#DC2626',
                background: '#FEF2F2',
                padding: '0.35rem 0.75rem',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid #FCA5A5'
              }}
            >
              <ShieldAlert size={16} />
              <span>Admin Portal</span>
            </Link>
          )}
        </nav>

        {/* Right CTA / User Session Actions */}
        <div style={{ display: 'none', alignItems: 'center', gap: '0.85rem' }} className="desktop-actions">
          {isAuthenticated ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <Link
                to="/profile"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.4rem 0.8rem',
                  background: 'var(--color-bg-alt)',
                  borderRadius: 'var(--radius-full)',
                  border: '1px solid var(--color-border)',
                  color: 'var(--color-navy)'
                }}
              >
                <div
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: '50%',
                    background: 'var(--color-navy)',
                    color: '#FFFFFF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.8rem',
                    fontWeight: 700
                  }}
                >
                  {user.full_name?.charAt(0) || 'U'}
                </div>
                <span style={{ fontSize: '0.875rem', fontWeight: 600, maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {user.full_name?.split(' ')[0]}
                </span>
                <span className="badge badge-orange" style={{ fontSize: '0.65rem' }}>
                  {user.role}
                </span>
              </Link>

              <button
                onClick={handleLogout}
                className="btn btn-ghost btn-sm"
                title="Log Out"
                style={{ color: 'var(--color-text-muted)' }}
              >
                <LogOut size={16} />
              </button>
            </div>
          ) : (
            <>
              <Link to="/login" className="btn btn-outline btn-sm">
                Log In
              </Link>
              <Link to="/register" className="btn btn-primary btn-sm">
                Get Started
              </Link>
            </>
          )}
        </div>

        {/* Mobile Toggle Button */}
        <button
          className="mobile-toggle"
          onClick={() => setMobileMenuOpen(prev => !prev)}
          style={{ display: 'flex', padding: '0.5rem', color: 'var(--color-navy)' }}
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div
          style={{
            background: '#FFFFFF',
            borderTop: '1px solid var(--color-border)',
            padding: '1.25rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem'
          }}
        >
          <Link
            to="/courses"
            onClick={() => setMobileMenuOpen(false)}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600, padding: '0.5rem 0' }}
          >
            <BookOpen size={18} /> Courses
          </Link>
          <Link
            to="/ai-tutor"
            onClick={() => setMobileMenuOpen(false)}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600, padding: '0.5rem 0' }}
          >
            <Sparkles size={18} style={{ color: 'var(--color-orange)' }} /> AI Tutor
          </Link>
          <Link
            to="/mock-tests"
            onClick={() => setMobileMenuOpen(false)}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600, padding: '0.5rem 0' }}
          >
            <FileCheck2 size={18} style={{ color: 'var(--color-orange)' }} /> Mock Tests
          </Link>
          {isAuthenticated ? (
            <>
              <Link
                to="/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600, padding: '0.5rem 0' }}
              >
                <LayoutDashboard size={18} /> Student Dashboard
              </Link>
              <Link
                to="/progress"
                onClick={() => setMobileMenuOpen(false)}
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600, padding: '0.5rem 0' }}
              >
                <Award size={18} /> Learning Progress
              </Link>
              {isTeacher && (
                <Link
                  to="/teacher"
                  onClick={() => setMobileMenuOpen(false)}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, color: '#2563EB', padding: '0.5rem 0' }}
                >
                  <GraduationCap size={18} /> Teacher Portal
                </Link>
              )}
              {isAdmin && (
                <Link
                  to="/admin"
                  onClick={() => setMobileMenuOpen(false)}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, color: '#DC2626', padding: '0.5rem 0' }}
                >
                  <ShieldAlert size={18} /> Admin Portal
                </Link>
              )}
              <button
                onClick={handleLogout}
                className="btn btn-outline btn-sm"
                style={{ width: '100%', marginTop: '0.5rem' }}
              >
                <LogOut size={16} /> Log Out ({user.full_name})
              </button>
            </>
          ) : (
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="btn btn-outline"
                style={{ flex: 1 }}
              >
                Log In
              </Link>
              <Link
                to="/register"
                onClick={() => setMobileMenuOpen(false)}
                className="btn btn-primary"
                style={{ flex: 1 }}
              >
                Get Started
              </Link>
            </div>
          )}
        </div>
      )}

      {/* Responsive media query styling */}
      <style>{`
        @media (min-width: 768px) {
          .desktop-nav { display: flex !important; }
          .desktop-actions { display: flex !important; }
          .mobile-toggle { display: none !important; }
        }
      `}</style>
    </header>
  );
}
