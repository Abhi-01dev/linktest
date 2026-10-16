import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  ChevronDown,
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

export function DesktopNavigation({ role }) {
  const location = useLocation();
  const [moreOpen, setMoreOpen] = useState(false);
  const moreRef = useRef(null);

  const isAdmin = role === 'ADMIN';
  const isTeacher = role === 'TEACHER';
  const isStudent = role === 'STUDENT';

  // Outside click listener for More menu
  useEffect(() => {
    function handleClickOutside(event) {
      if (moreRef.current && !moreRef.current.contains(event.target)) {
        setMoreOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close more menu when location changes
  useEffect(() => {
    setMoreOpen(false);
  }, [location.pathname]);

  const isActive = (to, exact = false) => {
    if (exact) {
      return location.pathname === to;
    }
    return location.pathname.startsWith(to);
  };

  // --- Role Nav Configurations ---
  let primaryItems = [];
  let moreItems = [];

  if (isAdmin) {
    primaryItems = [
      { label: 'Overview', to: '/admin', exact: true },
      { label: 'Batches', to: '/admin/batches' },
      { label: 'Users', to: '/admin/users' },
      { label: 'Faculty', to: '/admin/teachers' },
      { label: 'Mock Tests', to: '/admin/mock-tests' },
      { label: 'Question Bank', to: '/admin/question-bank' },
      { label: 'Reports', to: '/admin/reports' },
      { label: 'Audit Logs', to: '/admin/audit-logs' }
    ];
    moreItems = [
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
    primaryItems = [
      { label: 'Dashboard', to: '/teacher', exact: true },
      { label: 'My Batches', to: '/teacher/classes' },
      { label: 'Question Bank', to: '/teacher/question-bank' },
      { label: 'Mock Tests', to: '/teacher/mock-tests' },
      { label: 'Live Classes', to: '/teacher/live-classes' }
    ];
    moreItems = [
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
    primaryItems = [
      { label: 'Dashboard', to: '/dashboard', exact: true },
      { label: 'My Courses', to: '/courses' },
      { label: 'Mock Tests', to: '/mock-tests' },
      { label: 'Live Classes', to: '/live-classes' },
      { label: 'My Progress', to: '/progress' },
      { label: 'AI Tutor', to: '/ai-tutor' }
    ];
    moreItems = [
      { label: 'Timetable', to: '/timetable', icon: Calendar },
      { label: 'Attendance', to: '/attendance', icon: ClipboardCheck },
      { label: 'Assignments', to: '/assignments', icon: FileText },
      { label: 'Materials', to: '/materials', icon: BookOpen },
      { label: 'Announcements', to: '/announcements', icon: Megaphone },
      { label: 'Student Support', to: '/support', icon: HelpCircle },
      { label: 'My Profile', to: '/profile', icon: User }
    ];
  } else {
    primaryItems = [
      { label: 'Courses', to: '/courses' },
      { label: 'Mock Tests', to: '/mock-tests' },
      { label: 'AI Tutor', to: '/ai-tutor' }
    ];
    moreItems = [];
  }

  // Check if any item in "More" is currently active
  const isMoreActive = moreItems.some(item => isActive(item.to));

  return (
    <nav
      className="desktop-navigation"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.25rem',
        height: '100%'
      }}
    >
      {/* Primary Navigation Links */}
      {primaryItems.map((item) => {
        const active = isActive(item.to, item.exact);
        return (
          <Link
            key={item.to}
            to={item.to}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              padding: '0.45rem 0.75rem',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.86rem',
              fontWeight: active ? 600 : 500,
              color: active ? 'var(--color-navy)' : 'var(--color-text-secondary)',
              background: active ? 'var(--color-bg-alt)' : 'transparent',
              textDecoration: 'none',
              transition: 'all var(--transition-fast)',
              position: 'relative',
              whiteSpace: 'nowrap'
            }}
            className={`nav-link-item ${active ? 'active' : ''}`}
          >
            {item.label}
            {active && (
              <span
                style={{
                  position: 'absolute',
                  bottom: '-8px',
                  left: '12%',
                  right: '12%',
                  height: '2px',
                  background: 'var(--color-orange)',
                  borderRadius: '2px'
                }}
              />
            )}
          </Link>
        );
      })}

      {/* "More" Dropdown Menu */}
      {moreItems.length > 0 && (
        <div style={{ position: 'relative' }} ref={moreRef}>
          <button
            onClick={() => setMoreOpen(!moreOpen)}
            aria-haspopup="true"
            aria-expanded={moreOpen}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.3rem',
              padding: '0.45rem 0.75rem',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.86rem',
              fontWeight: isMoreActive ? 600 : 500,
              color: isMoreActive ? 'var(--color-navy)' : 'var(--color-text-secondary)',
              background: isMoreActive || moreOpen ? 'var(--color-bg-alt)' : 'transparent',
              border: 'none',
              cursor: 'pointer',
              transition: 'all var(--transition-fast)',
              position: 'relative',
              whiteSpace: 'nowrap'
            }}
            className={`nav-link-item ${isMoreActive ? 'active' : ''}`}
          >
            <span>More</span>
            <ChevronDown
              size={13}
              style={{
                transform: moreOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform var(--transition-fast)'
              }}
            />
            {isMoreActive && (
              <span
                style={{
                  position: 'absolute',
                  bottom: '-8px',
                  left: '12%',
                  right: '12%',
                  height: '2px',
                  background: 'var(--color-orange)',
                  borderRadius: '2px'
                }}
              />
            )}
          </button>

          {/* Dropdown Popover */}
          {moreOpen && (
            <div
              style={{
                position: 'absolute',
                top: 'calc(100% + 8px)',
                left: 0,
                width: '240px',
                background: '#FFFFFF',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--color-border)',
                boxShadow: 'var(--shadow-xl)',
                zIndex: 100,
                padding: '0.4rem',
                animation: 'scaleUp 0.15s ease-out'
              }}
            >
              <div
                style={{
                  padding: '0.35rem 0.65rem 0.5rem',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  letterSpacing: '0.05em',
                  color: 'var(--color-text-muted)',
                  borderBottom: '1px solid var(--color-border)',
                  marginBottom: '0.3rem'
                }}
              >
                ADDITIONAL MODULES
              </div>
              <div style={{ maxHeight: '340px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                {moreItems.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.to);
                  return (
                    <Link
                      key={item.to}
                      to={item.to}
                      onClick={() => setMoreOpen(false)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.65rem',
                        padding: '0.5rem 0.65rem',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '0.84rem',
                        fontWeight: active ? 600 : 500,
                        color: active ? '#2563EB' : 'var(--color-text-primary)',
                        background: active ? '#EFF6FF' : 'transparent',
                        textDecoration: 'none',
                        transition: 'all var(--transition-fast)'
                      }}
                      className="more-dropdown-item"
                    >
                      {Icon && <Icon size={15} style={{ flexShrink: 0, color: active ? '#2563EB' : 'var(--color-text-muted)' }} />}
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </nav>
  );
}
export default DesktopNavigation;
