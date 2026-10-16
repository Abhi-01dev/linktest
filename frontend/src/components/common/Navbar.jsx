import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { LinkTestLogo } from './LinkTestLogo';
import { DesktopNavigation } from './DesktopNavigation';
import { MobileNavigation } from './MobileNavigation';
import { UserMenu } from './UserMenu';
import { NotificationCenter } from './NotificationCenter';
import {
  Menu,
  Bell,
  Sparkles
} from 'lucide-react';

export function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const { unreadCount } = useNotifications();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notificationCenterOpen, setNotificationCenterOpen] = useState(false);

  const role = String(user?.role || '').toUpperCase();
  const isAdmin = role === 'ADMIN';
  const isTeacher = role === 'TEACHER';
  const isStudent = role === 'STUDENT';

  // Role-specific brand logo destination
  const brandDestination = isAdmin ? '/admin' : isTeacher ? '/teacher' : isStudent ? '/dashboard' : '/';

  // Role indicator badge configuration
  const roleBadge = isAdmin
    ? { text: 'ADMIN', bg: '#FEF2F2', color: '#991B1B', border: '#FECACA' }
    : isTeacher
    ? { text: 'TEACHER', bg: '#EFF6FF', color: '#1E40AF', border: '#BFDBFE' }
    : { text: 'STUDENT', bg: '#F0FDF4', color: '#166534', border: '#BBF7D0' };

  return (
    <header
      className="app-header"
      style={{
        background: 'rgba(255, 255, 255, 0.96)',
        backdropFilter: 'blur(8px)',
        borderBottom: '1px solid var(--color-border)',
        position: 'sticky',
        top: 0,
        zIndex: 50,
        height: '64px',
        boxShadow: '0 1px 2px 0 rgba(15, 23, 42, 0.03)'
      }}
    >
      <div
        className="container"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: '100%',
          maxWidth: '1440px'
        }}
      >
        {/* 1. LEFT: Mobile Toggle + Brand Logo + Subtle Role Badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          {/* Mobile Menu Trigger */}
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="mobile-hamburger-btn"
            style={{
              display: 'none',
              padding: '0.4rem',
              background: 'transparent',
              border: 'none',
              color: 'var(--color-navy)',
              cursor: 'pointer',
              borderRadius: 'var(--radius-sm)'
            }}
            aria-label="Open navigation menu"
          >
            <Menu size={22} />
          </button>

          {/* Logo with strict Role-based link */}
          <Link
            to={brandDestination}
            style={{ textDecoration: 'none', display: 'flex', alignItems: 'center' }}
            title="LinkTest Platform"
          >
            <LinkTestLogo size="md" />
          </Link>

          {/* Subtle Role Indicator (Desktop) */}
          {isAuthenticated && (
            <span
              className="desktop-role-tag"
              style={{
                fontSize: '0.68rem',
                fontWeight: 700,
                letterSpacing: '0.06em',
                padding: '0.15rem 0.5rem',
                borderRadius: '4px',
                background: roleBadge.bg,
                color: roleBadge.color,
                border: `1px solid ${roleBadge.border}`,
                lineHeight: 1.2
              }}
            >
              {roleBadge.text}
            </span>
          )}
        </div>

        {/* 2. CENTER: Clean Desktop Primary Navigation with More Dropdown */}
        <div className="header-nav-center" style={{ display: 'flex', alignItems: 'center', height: '100%' }}>
          <DesktopNavigation role={role} />
        </div>

        {/* 3. RIGHT: Notifications + User Profile Menu / Auth Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          {isAuthenticated ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              {/* Interactive Unified Notification Bell & Center */}
              <div style={{ position: 'relative' }}>
                <button
                  onClick={() => setNotificationCenterOpen(prev => !prev)}
                  className="header-icon-btn"
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: notificationCenterOpen ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                    border: '1px solid var(--color-border)',
                    background: notificationCenterOpen ? '#EFF6FF' : 'transparent',
                    position: 'relative',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                  title="LinkTest Task Notifications"
                  aria-label="Notifications"
                >
                  <Bell size={16} />
                  {unreadCount > 0 && (
                    <span
                      style={{
                        position: 'absolute',
                        top: -3,
                        right: -3,
                        minWidth: 17,
                        height: 17,
                        padding: '0 4px',
                        borderRadius: 10,
                        background: '#EF4444',
                        color: '#FFFFFF',
                        fontSize: '0.65rem',
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: '2px solid #FFFFFF',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
                      }}
                    >
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>

                <NotificationCenter
                  isOpen={notificationCenterOpen}
                  onClose={() => setNotificationCenterOpen(false)}
                />
              </div>

              {/* Compact User Profile Menu */}
              <UserMenu user={user} logout={logout} />
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <Link
                to="/login"
                className="btn btn-outline btn-sm"
                style={{ padding: '0.4rem 0.85rem', fontSize: '0.85rem', fontWeight: 600 }}
              >
                Log In
              </Link>
              <Link
                to="/register"
                className="btn btn-primary btn-sm"
                style={{ padding: '0.4rem 0.95rem', fontSize: '0.85rem', fontWeight: 600 }}
              >
                Get Started
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Responsive Drawer for Tablet & Mobile (< 1024px) */}
      <MobileNavigation
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        user={user}
        role={role}
        logout={logout}
      />

      {/* Header CSS Responsive Rules */}
      <style>{`
        @media (max-width: 1023px) {
          .header-nav-center {
            display: none !important;
          }
          .desktop-role-tag {
            display: none !important;
          }
          .mobile-hamburger-btn {
            display: flex !important;
          }
          .user-menu-info {
            display: none !important;
          }
          .user-menu-trigger {
            padding: 0 !important;
            border: none !important;
          }
        }
      `}</style>
    </header>
  );
}

export default Navbar;
