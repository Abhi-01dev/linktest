import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  User,
  LogOut,
  ChevronDown,
  ShieldCheck,
  GraduationCap,
  Sparkles,
  Settings,
  History,
  FileCheck2,
  HelpCircle
} from 'lucide-react';

export function UserMenu({ user, logout }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  const role = String(user?.role || '').toUpperCase();
  const isAdmin = role === 'ADMIN';
  const isTeacher = role === 'TEACHER';
  const isStudent = role === 'STUDENT';

  // Compute initials (e.g. "Abhishek Kalekar" -> "AK")
  const getInitials = () => {
    if (user?.full_name) {
      const parts = user.full_name.trim().split(/\s+/);
      if (parts.length >= 2) {
        return (parts[0][0] + parts[1][0]).toUpperCase();
      }
      return parts[0].slice(0, 2).toUpperCase();
    }
    if (user?.email) {
      return user.email.slice(0, 2).toUpperCase();
    }
    return 'U';
  };

  const displayName = user?.full_name || (user?.email ? user.email.split('@')[0] : 'User');
  const shortName = displayName.split(' ')[0];

  // Outside click listener
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handleLogout = () => {
    setIsOpen(false);
    logout();
    navigate('/login');
  };

  // Role Badge Styling (Refined, professional, subtle)
  const roleBadgeConfig = isAdmin
    ? { label: 'ADMIN', bg: '#FEF2F2', text: '#991B1B', border: '#FECACA' }
    : isTeacher
    ? { label: 'TEACHER', bg: '#EFF6FF', text: '#1E40AF', border: '#BFDBFE' }
    : { label: 'STUDENT', bg: '#F0FDF4', text: '#166534', border: '#BBF7D0' };

  return (
    <div style={{ position: 'relative' }} ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-haspopup="true"
        aria-expanded={isOpen}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.6rem',
          padding: '0.25rem 0.5rem 0.25rem 0.25rem',
          borderRadius: '9999px',
          border: '1px solid var(--color-border)',
          background: isOpen ? 'var(--color-bg-alt)' : '#FFFFFF',
          cursor: 'pointer',
          transition: 'all var(--transition-fast)'
        }}
        className="user-menu-trigger"
      >
        {/* Compact Avatar with Initials */}
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: '50%',
            background: isAdmin
              ? 'linear-gradient(135deg, #DC2626 0%, #991B1B 100%)'
              : isTeacher
              ? 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)'
              : 'linear-gradient(135deg, #0F172A 0%, #334155 100%)',
            color: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '0.78rem',
            fontWeight: 700,
            letterSpacing: '0.02em',
            flexShrink: 0
          }}
        >
          {getInitials()}
        </div>

        {/* User Info (Desktop only) */}
        <div
          className="user-menu-info"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            paddingRight: '0.25rem'
          }}
        >
          <span
            style={{
              fontSize: '0.85rem',
              fontWeight: 600,
              color: 'var(--color-text-primary)',
              maxWidth: '120px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}
          >
            {shortName}
          </span>

          {/* Compact Role Badge */}
          <span
            style={{
              fontSize: '0.68rem',
              fontWeight: 700,
              letterSpacing: '0.05em',
              padding: '0.15rem 0.45rem',
              borderRadius: '4px',
              background: roleBadgeConfig.bg,
              color: roleBadgeConfig.text,
              border: `1px solid ${roleBadgeConfig.border}`,
              lineHeight: 1.2
            }}
          >
            {roleBadgeConfig.label}
          </span>

          <ChevronDown
            size={14}
            style={{
              color: 'var(--color-text-muted)',
              transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform var(--transition-fast)'
            }}
          />
        </div>
      </button>

      {/* Dropdown Menu Popover */}
      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            right: 0,
            width: '260px',
            background: '#FFFFFF',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--color-border)',
            boxShadow: 'var(--shadow-xl)',
            zIndex: 100,
            overflow: 'hidden',
            animation: 'scaleUp 0.15s ease-out'
          }}
        >
          {/* Header Card */}
          <div
            style={{
              padding: '1rem',
              background: 'var(--color-bg-alt)',
              borderBottom: '1px solid var(--color-border)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: '50%',
                  background: isAdmin
                    ? '#DC2626'
                    : isTeacher
                    ? '#2563EB'
                    : 'var(--color-navy)',
                  color: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.88rem',
                  fontWeight: 700,
                  flexShrink: 0
                }}
              >
                {getInitials()}
              </div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div
                  style={{
                    fontSize: '0.9rem',
                    fontWeight: 700,
                    color: 'var(--color-text-primary)',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {displayName}
                </div>
                <div
                  style={{
                    fontSize: '0.75rem',
                    color: 'var(--color-text-muted)',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {user?.email}
                </div>
              </div>
            </div>
            <div style={{ marginTop: '0.65rem' }}>
              <span
                style={{
                  display: 'inline-block',
                  fontSize: '0.68rem',
                  fontWeight: 700,
                  letterSpacing: '0.04em',
                  padding: '0.15rem 0.5rem',
                  borderRadius: '4px',
                  background: roleBadgeConfig.bg,
                  color: roleBadgeConfig.text,
                  border: `1px solid ${roleBadgeConfig.border}`
                }}
              >
                Role: {roleBadgeConfig.label}
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <div style={{ padding: '0.4rem' }}>
            {isAdmin && (
              <>
                <Link
                  to="/admin"
                  onClick={() => setIsOpen(false)}
                  className="user-menu-item"
                >
                  <ShieldCheck size={16} />
                  <span>Admin Console</span>
                </Link>
                <Link
                  to="/admin/users"
                  onClick={() => setIsOpen(false)}
                  className="user-menu-item"
                >
                  <User size={16} />
                  <span>User Roles & Access</span>
                </Link>
                <Link
                  to="/admin/audit-logs"
                  onClick={() => setIsOpen(false)}
                  className="user-menu-item"
                >
                  <History size={16} />
                  <span>Audit & Security Logs</span>
                </Link>
              </>
            )}

            {isTeacher && (
              <>
                <Link
                  to="/teacher/profile"
                  onClick={() => setIsOpen(false)}
                  className="user-menu-item"
                >
                  <User size={16} />
                  <span>Faculty Profile</span>
                </Link>
                <Link
                  to="/teacher/classes"
                  onClick={() => setIsOpen(false)}
                  className="user-menu-item"
                >
                  <GraduationCap size={16} />
                  <span>My Classes & Batches</span>
                </Link>
                <Link
                  to="/teacher/timetable"
                  onClick={() => setIsOpen(false)}
                  className="user-menu-item"
                >
                  <FileCheck2 size={16} />
                  <span>Weekly Timetable</span>
                </Link>
              </>
            )}

            {isStudent && (
              <>
                <Link
                  to="/profile"
                  onClick={() => setIsOpen(false)}
                  className="user-menu-item"
                >
                  <User size={16} />
                  <span>Student Profile</span>
                </Link>
                <Link
                  to="/progress"
                  onClick={() => setIsOpen(false)}
                  className="user-menu-item"
                >
                  <Sparkles size={16} />
                  <span>My Learning Progress</span>
                </Link>
                <Link
                  to="/support"
                  onClick={() => setIsOpen(false)}
                  className="user-menu-item"
                >
                  <HelpCircle size={16} />
                  <span>Help & Support Tickets</span>
                </Link>
              </>
            )}
          </div>

          {/* Divider */}
          <div style={{ height: '1px', background: 'var(--color-border)', margin: '0.2rem 0' }} />

          {/* Logout Action */}
          <div style={{ padding: '0.4rem' }}>
            <button
              onClick={handleLogout}
              className="user-menu-item logout"
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: '0.65rem',
                padding: '0.55rem 0.75rem',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.85rem',
                fontWeight: 600,
                color: '#DC2626',
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                textAlign: 'left'
              }}
            >
              <LogOut size={16} />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
export default UserMenu;
