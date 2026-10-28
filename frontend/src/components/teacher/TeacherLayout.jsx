import React, { useState, useEffect, useRef } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  Users,
  Calendar,
  ClipboardCheck,
  FileText,
  BookOpen,
  Video,
  Megaphone,
  CalendarOff,
  CheckSquare,
  User,
  GraduationCap,
  ChevronLeft,
  ChevronRight,
  FileCheck2,
  FileSpreadsheet,
  Menu,
  X
} from 'lucide-react';

const TEACHER_NAV_GROUPS = [
  {
    groupTitle: 'INSTRUCTION & EXAMS',
    items: [
      { label: 'My Batches & Classes', to: '/teacher/classes', icon: Users },
      { label: 'Question Bank', to: '/teacher/question-bank', icon: FileSpreadsheet },
      { label: 'Mock Tests & Quizzes', to: '/teacher/mock-tests', icon: FileCheck2 },
      { label: 'Live Lectures', to: '/teacher/live-classes', icon: Video }
    ]
  },
  {
    groupTitle: 'STUDENT OPERATIONS',
    items: [
      { label: 'Weekly Timetable', to: '/teacher/timetable', icon: Calendar },
      { label: 'Roll-Call Attendance', to: '/teacher/attendance', icon: ClipboardCheck },
      { label: 'Assignments & Grading', to: '/teacher/assignments', icon: FileText },
      { label: 'Study Materials', to: '/teacher/materials', icon: BookOpen },
      { label: 'Syllabus Tracker', to: '/teacher/syllabus', icon: CheckSquare }
    ]
  },
  {
    groupTitle: 'COMMUNICATION & LEAVE',
    items: [
      { label: 'Announcements', to: '/teacher/announcements', icon: Megaphone },
      { label: 'Leave Requests', to: '/teacher/leave', icon: CalendarOff },
      { label: 'Faculty Profile', to: '/teacher/profile', icon: User }
    ]
  }
];

export function TeacherLayout({ children }) {
  const { user } = useAuth();
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem('linktest_teacher_sidebar_collapsed') === 'true';
    } catch {
      return false;
    }
  });
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const mainContentRef = useRef(null);

  useEffect(() => {
    setMobileOpen(false);
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    if (mainContentRef.current) {
      mainContentRef.current.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    }
  }, [location.pathname]);

  const toggleCollapse = () => {
    const next = !collapsed;
    setCollapsed(next);
    try {
      localStorage.setItem('linktest_teacher_sidebar_collapsed', String(next));
    } catch {
      // ignore
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: 'calc(100vh - 64px)', background: '#F8FAFC' }}>
      {/* Mobile Secondary Subbar for Screens < 1024px */}
      <div
        className="teacher-mobile-subbar"
        style={{
          display: 'none',
          padding: '0.6rem 1rem',
          background: '#0F172A',
          color: '#F8FAFC',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid #1E293B',
          position: 'sticky',
          top: '64px',
          zIndex: 25
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{ padding: '0.25rem', background: 'rgba(37, 99, 235, 0.2)', color: '#3B82F6', borderRadius: '4px' }}>
            <GraduationCap size={14} />
          </div>
          <span style={{ fontSize: '0.78rem', fontWeight: 800, letterSpacing: '0.05em', color: '#F1F5F9' }}>
            FACULTY WORKSPACE
          </span>
        </div>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          style={{
            color: '#F1F5F9',
            padding: '0.35rem 0.65rem',
            background: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '4px',
            border: 'none',
            fontSize: '0.75rem',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '0.35rem',
            cursor: 'pointer'
          }}
          aria-label="Toggle faculty modules"
        >
          {mobileOpen ? <X size={15} /> : <Menu size={15} />}
          <span>{mobileOpen ? 'Close' : 'Faculty Modules'}</span>
        </button>
      </div>

      <div style={{ display: 'flex', flex: 1, position: 'relative' }}>
        {/* Mobile Backdrop */}
        {mobileOpen && (
          <div
            onClick={() => setMobileOpen(false)}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(15, 23, 42, 0.6)',
              backdropFilter: 'blur(2px)',
              zIndex: 35
            }}
          />
        )}

        {/* Sidebar */}
        <aside
          className={`teacher-sidebar ${collapsed ? 'collapsed' : ''} ${mobileOpen ? 'mobile-open' : ''}`}
          style={{
            width: collapsed ? '68px' : '250px',
            background: '#0F172A',
            color: '#F8FAFC',
            transition: 'width 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            display: 'flex',
            flexDirection: 'column',
            borderRight: '1px solid #1E293B',
            flexShrink: 0,
            position: 'sticky',
            top: '64px',
            height: 'calc(100vh - 64px)',
            overflowY: 'auto',
            overflowX: 'hidden',
            zIndex: 30
          }}
        >
          {/* Sidebar Header */}
          <div
            style={{
              padding: collapsed ? '1rem 0.5rem' : '1.1rem 1.1rem',
              borderBottom: '1px solid #1E293B',
              display: 'flex',
              alignItems: 'center',
              justifyContent: collapsed ? 'center' : 'space-between',
              background: '#0B1120'
            }}
          >
            {!collapsed && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', minWidth: 0 }}>
                <div style={{ padding: '0.3rem', background: 'rgba(37, 99, 235, 0.2)', color: '#3B82F6', borderRadius: '6px', flexShrink: 0 }}>
                  <GraduationCap size={16} />
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: '0.8rem', fontWeight: 800, letterSpacing: '0.06em', color: '#F1F5F9' }}>
                    TEACHER PORTAL
                  </div>
                  <div style={{ fontSize: '0.68rem', color: '#64748B' }}>Faculty Workspace</div>
                </div>
              </div>
            )}
            <button
              onClick={toggleCollapse}
              className="sidebar-collapse-btn"
              style={{
                padding: '0.35rem',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid #334155',
                borderRadius: '6px',
                color: '#94A3B8',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.15s ease'
              }}
              title={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
              aria-label={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
            >
              {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
            </button>
          </div>

          {/* Navigation Links */}
          <nav style={{ padding: '0.75rem 0.5rem', flex: 1, display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {/* Standalone Dashboard Link */}
            <NavLink
              to="/teacher"
              end
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
              title={collapsed ? 'Faculty Dashboard' : undefined}
            >
              <LayoutDashboard size={17} style={{ flexShrink: 0 }} />
              {!collapsed && <span>Faculty Dashboard</span>}
            </NavLink>

            {/* Categorized Modules */}
            {TEACHER_NAV_GROUPS.map((grp) => (
              <div key={grp.groupTitle} style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                {!collapsed ? (
                  <div
                    style={{
                      padding: '0.35rem 0.75rem 0.2rem',
                      fontSize: '0.68rem',
                      fontWeight: 800,
                      letterSpacing: '0.07em',
                      color: '#64748B',
                      textTransform: 'uppercase'
                    }}
                  >
                    {grp.groupTitle}
                  </div>
                ) : (
                  <div style={{ height: '1px', background: '#1E293B', margin: '0.3rem 0.5rem' }} />
                )}

                {grp.items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
                      title={collapsed ? `${grp.groupTitle}: ${item.label}` : undefined}
                    >
                      <Icon size={17} style={{ flexShrink: 0 }} />
                      {!collapsed && <span>{item.label}</span>}
                    </NavLink>
                  );
                })}
              </div>
            ))}
          </nav>
        </aside>

        {/* Main Content Area */}
        <main
          ref={mainContentRef}
          className="teacher-main-content"
          style={{
            flex: 1,
            padding: '1.75rem 2rem',
            overflowY: 'auto',
            minWidth: 0,
            maxWidth: '100%'
          }}
        >
          {children || <Outlet />}
        </main>
      </div>

      {/* Responsive Styles for Teacher Layout */}
      <style>{`
        @media (max-width: 1023px) {
          .teacher-mobile-subbar {
            display: flex !important;
          }
          .teacher-sidebar {
            position: fixed !important;
            top: 108px !important;
            left: 0 !important;
            bottom: 0 !important;
            height: calc(100vh - 108px) !important;
            z-index: 40 !important;
            transform: translateX(-100%);
            transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1) !important;
          }
          .teacher-sidebar.mobile-open {
            transform: translateX(0) !important;
          }
          .teacher-main-content {
            padding: 1.25rem 1rem !important;
          }
        }
      `}</style>
    </div>
  );
}

export default TeacherLayout;
