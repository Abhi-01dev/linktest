import React, { useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LinkTestLogo } from './LinkTestLogo';
import {
  X,
  LogOut,
  LayoutDashboard,
  Layers,
  ShieldCheck,
  GraduationCap,
  FileCheck2,
  FileSpreadsheet,
  BarChart3,
  History,
  BookOpen,
  School,
  BookMarked,
  Calendar,
  ClipboardCheck,
  Video,
  Megaphone,
  CalendarOff,
  Award,
  Users,
  Sparkles,
  HelpCircle,
  FileText,
  User,
  CheckSquare
} from 'lucide-react';

export function MobileNavigation({ isOpen, onClose, user, role, logout }) {
  const location = useLocation();
  const navigate = useNavigate();

  // Close drawer on path change
  useEffect(() => {
    onClose();
  }, [location.pathname]);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const isAdmin = role === 'ADMIN';
  const isTeacher = role === 'TEACHER';
  const isStudent = role === 'STUDENT';

  const handleLogout = () => {
    onClose();
    logout();
    navigate('/login');
  };

  const isActive = (to, exact = false) => {
    if (exact) {
      return location.pathname === to;
    }
    return location.pathname.startsWith(to);
  };

  const roleBadgeConfig = isAdmin
    ? { label: 'ADMINISTRATOR', bg: '#FEF2F2', text: '#991B1B', border: '#FECACA' }
    : isTeacher
    ? { label: 'TEACHER PORTAL', bg: '#EFF6FF', text: '#1E40AF', border: '#BFDBFE' }
    : { label: 'STUDENT PORTAL', bg: '#F0FDF4', text: '#166534', border: '#BBF7D0' };

  let mainNav = [];
  let secondaryNav = [];

  if (isAdmin) {
    mainNav = [
      { label: 'Overview', to: '/admin', icon: LayoutDashboard, exact: true },
      { label: 'Batches & Allocation', to: '/admin/batches', icon: Layers },
      { label: 'Users & Permissions', to: '/admin/users', icon: ShieldCheck },
      { label: 'Faculty & Teachers', to: '/admin/teachers', icon: GraduationCap },
      { label: 'Mock Tests (Exams)', to: '/admin/mock-tests', icon: FileCheck2 },
      { label: 'Question Bank', to: '/admin/question-bank', icon: FileSpreadsheet },
      { label: 'Reports & Analytics', to: '/admin/reports', icon: BarChart3 },
      { label: 'Audit & Security Logs', to: '/admin/audit-logs', icon: History }
    ];
    secondaryNav = [
      { label: 'Students Roster', to: '/admin/students', icon: Users },
      { label: 'Courses Curriculum', to: '/admin/courses', icon: BookOpen },
      { label: 'Subjects Management', to: '/admin/subjects', icon: BookMarked },
      { label: 'Classes & Sections', to: '/admin/classes', icon: School },
      { label: 'Master Timetable', to: '/admin/timetable', icon: Calendar },
      { label: 'Attendance Hub', to: '/admin/attendance', icon: ClipboardCheck },
      { label: 'Live Classes', to: '/admin/live-classes', icon: Video },
      { label: 'Announcements', to: '/admin/announcements', icon: Megaphone },
      { label: 'Leave Requests', to: '/admin/leave-requests', icon: CalendarOff },
      { label: 'Quizzes', to: '/admin/quizzes', icon: Award }
    ];
  } else if (isTeacher) {
    mainNav = [
      { label: 'Faculty Dashboard', to: '/teacher', icon: LayoutDashboard, exact: true },
      { label: 'My Classes & Batches', to: '/teacher/classes', icon: Users },
      { label: 'Question Bank', to: '/teacher/question-bank', icon: FileSpreadsheet },
      { label: 'Mock Tests & Exams', to: '/teacher/mock-tests', icon: FileCheck2 },
      { label: 'Live Classes', to: '/teacher/live-classes', icon: Video }
    ];
    secondaryNav = [
      { label: 'Weekly Timetable', to: '/teacher/timetable', icon: Calendar },
      { label: 'Roll-Call Attendance', to: '/teacher/attendance', icon: ClipboardCheck },
      { label: 'Assignments & Grading', to: '/teacher/assignments', icon: FileText },
      { label: 'Study Materials', to: '/teacher/materials', icon: BookOpen },
      { label: 'Syllabus Tracker', to: '/teacher/syllabus', icon: CheckSquare },
      { label: 'Leave Requests', to: '/teacher/leave', icon: CalendarOff },
      { label: 'Announcements', to: '/teacher/announcements', icon: Megaphone },
      { label: 'Faculty Profile', to: '/teacher/profile', icon: User }
    ];
  } else if (isStudent) {
    mainNav = [
      { label: 'Dashboard', to: '/dashboard', icon: LayoutDashboard, exact: true },
      { label: 'My Courses', to: '/courses', icon: BookOpen },
      { label: 'Mock Tests', to: '/mock-tests', icon: FileCheck2 },
      { label: 'Live Classes', to: '/live-classes', icon: Video },
      { label: 'My Progress', to: '/progress', icon: Award },
      { label: 'AI Tutor', to: '/ai-tutor', icon: Sparkles }
    ];
    secondaryNav = [
      { label: 'Timetable', to: '/timetable', icon: Calendar },
      { label: 'Attendance', to: '/attendance', icon: ClipboardCheck },
      { label: 'Assignments', to: '/assignments', icon: FileText },
      { label: 'Study Materials', to: '/materials', icon: BookOpen },
      { label: 'Announcements', to: '/announcements', icon: Megaphone },
      { label: 'Student Support', to: '/support', icon: HelpCircle },
      { label: 'My Profile', to: '/profile', icon: User }
    ];
  } else {
    mainNav = [
      { label: 'Courses', to: '/courses', icon: BookOpen },
      { label: 'Mock Tests', to: '/mock-tests', icon: FileCheck2 },
      { label: 'AI Tutor', to: '/ai-tutor', icon: Sparkles }
    ];
    secondaryNav = [];
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999 }}>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(3px)',
          animation: 'fadeIn 0.2s ease-out'
        }}
      />

      {/* Drawer */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          bottom: 0,
          width: '85%',
          maxWidth: '340px',
          background: '#FFFFFF',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: 'var(--shadow-xl)',
          animation: 'slideInRight 0.25s ease-out',
          zIndex: 10
        }}
      >
        {/* Top Header */}
        <div
          style={{
            padding: '1.1rem 1.25rem',
            borderBottom: '1px solid var(--color-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <LinkTestLogo size="sm" />
          <button
            onClick={onClose}
            className="btn btn-ghost"
            style={{ padding: '0.4rem', border: 'none', color: 'var(--color-text-secondary)' }}
            aria-label="Close navigation menu"
          >
            <X size={20} />
          </button>
        </div>

        {/* User Card (if authenticated) */}
        {user ? (
          <div
            style={{
              padding: '1rem 1.25rem',
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
                  background: isAdmin ? '#DC2626' : isTeacher ? '#2563EB' : 'var(--color-navy)',
                  color: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: '0.9rem'
                }}
              >
                {(user.full_name || user.email || 'U')[0].toUpperCase()}
              </div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--color-text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {user.full_name || user.email}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {user.email}
                </div>
              </div>
            </div>
            <div style={{ marginTop: '0.6rem' }}>
              <span
                style={{
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
                {roleBadgeConfig.label}
              </span>
            </div>
          </div>
        ) : (
          <div style={{ padding: '1rem 1.25rem', display: 'flex', gap: '0.6rem', borderBottom: '1px solid var(--color-border)' }}>
            <Link to="/login" onClick={onClose} className="btn btn-outline btn-sm" style={{ flex: 1, textAlign: 'center' }}>
              Log In
            </Link>
            <Link to="/register" onClick={onClose} className="btn btn-primary btn-sm" style={{ flex: 1, textAlign: 'center' }}>
              Get Started
            </Link>
          </div>
        )}

        {/* Scrollable Navigation Area */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '1rem' }}>
          {/* Main Primary Links */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', marginBottom: '1.25rem' }}>
            <div style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.05em', color: 'var(--color-text-muted)', marginBottom: '0.35rem', paddingLeft: '0.5rem' }}>
              PRIMARY DESTINATIONS
            </div>
            {mainNav.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.to, item.exact);
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={onClose}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    padding: '0.65rem 0.75rem',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.88rem',
                    fontWeight: active ? 600 : 500,
                    color: active ? '#2563EB' : 'var(--color-text-primary)',
                    background: active ? '#EFF6FF' : 'transparent',
                    textDecoration: 'none'
                  }}
                >
                  <Icon size={18} style={{ color: active ? '#2563EB' : 'var(--color-text-muted)' }} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>

          {/* Secondary / More Links */}
          {secondaryNav.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <div style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.05em', color: 'var(--color-text-muted)', marginBottom: '0.35rem', paddingLeft: '0.5rem' }}>
                ADDITIONAL MODULES
              </div>
              {secondaryNav.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.to);
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    onClick={onClose}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      padding: '0.6rem 0.75rem',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '0.85rem',
                      fontWeight: active ? 600 : 500,
                      color: active ? '#2563EB' : 'var(--color-text-secondary)',
                      background: active ? '#EFF6FF' : 'transparent',
                      textDecoration: 'none'
                    }}
                  >
                    <Icon size={16} style={{ color: active ? '#2563EB' : 'var(--color-text-muted)' }} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* Bottom Drawer Actions */}
        {user && (
          <div style={{ padding: '0.85rem 1.25rem', borderTop: '1px solid var(--color-border)', background: 'var(--color-bg-alt)' }}>
            <button
              onClick={handleLogout}
              className="btn btn-ghost"
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                color: '#DC2626',
                border: '1px solid #FECACA',
                background: '#FEF2F2',
                padding: '0.55rem',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.85rem',
                fontWeight: 600
              }}
            >
              <LogOut size={16} />
              <span>Sign Out</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
export default MobileNavigation;
