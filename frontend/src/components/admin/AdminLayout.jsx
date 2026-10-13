import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  School,
  BookOpen,
  Calendar,
  ClipboardCheck,
  Video,
  Megaphone,
  CalendarOff,
  History,
  BarChart3,
  Award,
  BookMarked,
  ShieldAlert,
  ChevronRight,
  Menu,
  FileCheck2,
  Layers,
  ShieldCheck,
  FileSpreadsheet
} from 'lucide-react';

export function AdminLayout({ children }) {
  const { user } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const navItems = [
    { label: 'Overview', to: '/admin', icon: LayoutDashboard, exact: true },
    { label: 'Batches & Allocation', to: '/admin/batches', icon: Layers },
    { label: 'User Roles & Access', to: '/admin/users', icon: ShieldCheck },
    { label: 'Mock Tests (Exams)', to: '/admin/mock-tests', icon: FileCheck2 },
    { label: 'Question Bank & Import', to: '/admin/question-bank', icon: FileSpreadsheet },
    { label: 'Students Roster', to: '/admin/students', icon: Users },
    { label: 'Faculty & Teachers', to: '/admin/teachers', icon: GraduationCap },
    { label: 'Classes & Sections', to: '/admin/classes', icon: School },
    { label: 'Subjects', to: '/admin/subjects', icon: BookMarked },
    { label: 'Master Timetable', to: '/admin/timetable', icon: Calendar },
    { label: 'Attendance Hub', to: '/admin/attendance', icon: ClipboardCheck },
    { label: 'Live Classes', to: '/admin/live-classes', icon: Video },
    { label: 'Announcements', to: '/admin/announcements', icon: Megaphone },
    { label: 'Leave Requests', to: '/admin/leave-requests', icon: CalendarOff },
    { label: 'Audit & Security Logs', to: '/admin/audit-logs', icon: History },
    { label: 'Reports & Analytics', to: '/admin/reports', icon: BarChart3 },
    { label: 'Courses (Curriculum)', to: '/admin/courses', icon: BookOpen },
    { label: 'Lessons', to: '/admin/lessons', icon: BookOpen },
    { label: 'Quizzes', to: '/admin/quizzes', icon: Award }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: 'calc(100vh - 70px)', background: '#F8FAFC' }}>
      {/* Mobile Top Navigation Bar */}
      <div
        className="admin-mobile-topbar"
        style={{
          display: 'none',
          padding: '0.75rem 1rem',
          background: '#0F172A',
          color: '#F8FAFC',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid #1E293B',
          position: 'sticky',
          top: '70px',
          zIndex: 40
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <div style={{ padding: '0.35rem', background: 'rgba(239, 68, 68, 0.2)', color: '#EF4444', borderRadius: '6px' }}>
            <ShieldAlert size={16} />
          </div>
          <span style={{ fontSize: '0.85rem', fontWeight: 800, letterSpacing: '0.05em' }}>
            ADMIN CONSOLE
          </span>
        </div>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="btn btn-ghost"
          style={{ color: '#F1F5F9', padding: '0.4rem', border: 'none' }}
          aria-label="Toggle navigation menu"
        >
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      <div style={{ display: 'flex', flex: 1, position: 'relative' }}>
        {/* Mobile Backdrop Overlay */}
        {mobileOpen && (
          <div
            onClick={() => setMobileOpen(false)}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(15, 23, 42, 0.65)',
              zIndex: 45
            }}
          />
        )}

        {/* Sidebar Navigation */}
        <aside
          className={`admin-sidebar ${mobileOpen ? 'open' : ''}`}
          style={{
            width: collapsed ? '72px' : '260px',
            background: '#0F172A',
            color: '#F8FAFC',
            transition: 'width 0.2s ease, transform 0.25s ease',
            display: 'flex',
            flexDirection: 'column',
            borderRight: '1px solid #1E293B',
            flexShrink: 0,
            position: 'sticky',
            top: '70px',
            height: 'calc(100vh - 70px)',
            overflowY: 'auto',
            zIndex: 50
          }}
        >
          {/* Sidebar Header (Desktop) */}
          <div
            style={{
              padding: collapsed ? '1.2rem 0.8rem' : '1.25rem 1.25rem',
              borderBottom: '1px solid #1E293B',
              display: 'flex',
              alignItems: 'center',
              justifyContent: collapsed ? 'center' : 'space-between'
            }}
          >
            {!collapsed && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <div style={{ padding: '0.35rem', background: 'rgba(239, 68, 68, 0.2)', color: '#EF4444', borderRadius: '6px' }}>
                  <ShieldAlert size={18} />
                </div>
                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 800, letterSpacing: '0.05em', color: '#F1F5F9' }}>
                    ADMIN CONSOLE
                  </div>
                  <div style={{ fontSize: '0.7rem', color: '#94A3B8' }}>LMS Management</div>
                </div>
              </div>
            )}
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="btn btn-ghost desktop-toggle"
              style={{ color: '#94A3B8', padding: '0.35rem', minWidth: 'auto', border: 'none' }}
              title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {collapsed ? <ChevronRight size={18} /> : <Menu size={18} />}
            </button>
          </div>

          {/* Navigation Links */}
          <nav style={{ padding: '0.75rem 0.5rem', flex: 1, display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.exact}
                  onClick={() => setMobileOpen(false)}
                  style={({ isActive }) => ({
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    padding: collapsed ? '0.75rem' : '0.65rem 0.85rem',
                    borderRadius: '8px',
                    color: isActive ? '#FFFFFF' : '#94A3B8',
                    background: isActive ? '#2563EB' : 'transparent',
                    fontWeight: isActive ? 600 : 500,
                    fontSize: '0.86rem',
                    textDecoration: 'none',
                    justifyContent: collapsed ? 'center' : 'flex-start',
                    transition: 'all 0.15s ease'
                  })}
                  title={collapsed ? item.label : undefined}
                >
                  <Icon size={18} style={{ flexShrink: 0 }} />
                  {!collapsed && <span>{item.label}</span>}
                </NavLink>
              );
            })}
          </nav>

          {/* User Mini Profile */}
          {!collapsed && (
            <div style={{ padding: '1rem', borderTop: '1px solid #1E293B', background: '#0B1120' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    background: '#EF4444',
                    color: '#FFFFFF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    fontSize: '0.8rem'
                  }}
                >
                  {user?.full_name?.charAt(0) || 'A'}
                </div>
                <div style={{ overflow: 'hidden' }}>
                  <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#F1F5F9', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                    {user?.full_name}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: '#EF4444', fontWeight: 600 }}>Administrator</div>
                </div>
              </div>
            </div>
          )}
        </aside>

        {/* Main Content Area */}
        <main
          className="admin-main-content"
          style={{
            flex: 1,
            padding: '2rem 2.5rem',
            overflowY: 'auto',
            minWidth: 0,
            maxWidth: '100%'
          }}
        >
          {children || <Outlet />}
        </main>
      </div>

      {/* Embedded Responsive CSS for Admin Layout */}
      <style>{`
        @media (max-width: 991px) {
          .admin-mobile-topbar {
            display: flex !important;
          }
          .admin-sidebar {
            position: fixed !important;
            top: 70px !important;
            left: 0 !important;
            bottom: 0 !important;
            height: calc(100vh - 70px) !important;
            width: 260px !important;
            transform: translateX(-100%);
            z-index: 50 !important;
          }
          .admin-sidebar.open {
            transform: translateX(0) !important;
          }
          .desktop-toggle {
            display: none !important;
          }
          .admin-main-content {
            padding: 1.25rem 1rem !important;
          }
        }
      `}</style>
    </div>
  );
}

export default AdminLayout;
