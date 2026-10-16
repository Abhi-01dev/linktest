import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Layers,
  ShieldCheck,
  GraduationCap,
  Users,
  BookOpen,
  BookMarked,
  School,
  FileCheck2,
  FileSpreadsheet,
  Award,
  BarChart3,
  Calendar,
  ClipboardCheck,
  Video,
  Megaphone,
  CalendarOff,
  History,
  ChevronLeft,
  ChevronRight,
  ShieldAlert
} from 'lucide-react';

export const ADMIN_NAV_GROUPS = [
  {
    groupTitle: 'MANAGEMENT',
    items: [
      { label: 'Batches & Allocation', to: '/admin/batches', icon: Layers },
      { label: 'User Roles & Access', to: '/admin/users', icon: ShieldCheck },
      { label: 'Faculty & Teachers', to: '/admin/teachers', icon: GraduationCap },
      { label: 'Students Roster', to: '/admin/students', icon: Users },
      { label: 'Courses Curriculum', to: '/admin/courses', icon: BookOpen },
      { label: 'Subjects', to: '/admin/subjects', icon: BookMarked },
      { label: 'Classes & Sections', to: '/admin/classes', icon: School }
    ]
  },
  {
    groupTitle: 'ASSESSMENTS',
    items: [
      { label: 'Mock Tests (Exams)', to: '/admin/mock-tests', icon: FileCheck2 },
      { label: 'Question Bank', to: '/admin/question-bank', icon: FileSpreadsheet },
      { label: 'Quizzes', to: '/admin/quizzes', icon: Award },
      { label: 'Reports & Analytics', to: '/admin/reports', icon: BarChart3 }
    ]
  },
  {
    groupTitle: 'OPERATIONS',
    items: [
      { label: 'Master Timetable', to: '/admin/timetable', icon: Calendar },
      { label: 'Attendance Hub', to: '/admin/attendance', icon: ClipboardCheck },
      { label: 'Live Classes', to: '/admin/live-classes', icon: Video },
      { label: 'Announcements', to: '/admin/announcements', icon: Megaphone },
      { label: 'Leave Requests', to: '/admin/leave-requests', icon: CalendarOff }
    ]
  },
  {
    groupTitle: 'SECURITY & SYSTEM',
    items: [
      { label: 'Audit & Security Logs', to: '/admin/audit-logs', icon: History }
    ]
  }
];

export function AdminSidebar({ collapsed, setCollapsed }) {
  const toggleCollapse = () => {
    const next = !collapsed;
    setCollapsed(next);
    try {
      localStorage.setItem('linktest_admin_sidebar_collapsed', String(next));
    } catch (e) {
      // ignore
    }
  };

  return (
    <aside
      className={`admin-desktop-sidebar ${collapsed ? 'collapsed' : ''}`}
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
      {/* Sidebar Header & Toggle */}
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
            <div
              style={{
                padding: '0.3rem',
                background: 'rgba(239, 68, 68, 0.15)',
                color: '#EF4444',
                borderRadius: '6px',
                flexShrink: 0
              }}
            >
              <ShieldAlert size={16} />
            </div>
            <div style={{ minWidth: 0 }}>
              <div
                style={{
                  fontSize: '0.8rem',
                  fontWeight: 800,
                  letterSpacing: '0.06em',
                  color: '#F1F5F9',
                  textTransform: 'uppercase'
                }}
              >
                ADMIN CONSOLE
              </div>
              <div style={{ fontSize: '0.68rem', color: '#64748B' }}>
                System Management
              </div>
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
          title={collapsed ? 'Expand Sidebar (Ctrl+B)' : 'Collapse Sidebar'}
          aria-label={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      {/* Navigation Sections */}
      <nav
        style={{
          padding: '0.75rem 0.5rem',
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          gap: '0.85rem'
        }}
      >
        {/* Standalone Overview Link */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
          <NavLink
            to="/admin"
            end
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
            title={collapsed ? 'Overview' : undefined}
          >
            <LayoutDashboard size={17} style={{ flexShrink: 0 }} />
            {!collapsed && <span>Overview</span>}
          </NavLink>
        </div>

        {/* Grouped Links */}
        {ADMIN_NAV_GROGROUPS_RENDER(ADMIN_NAV_GROUPS, collapsed)}
      </nav>

      {/* Footer Info */}
      {!collapsed && (
        <div
          style={{
            padding: '0.85rem 1rem',
            borderTop: '1px solid #1E293B',
            background: '#0B1120',
            fontSize: '0.7rem',
            color: '#64748B',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <span>LinkTest v2.4</span>
          <span style={{ color: '#10B981', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10B981' }} />
            Active
          </span>
        </div>
      )}
    </aside>
  );
}

function ADMIN_NAV_GROGROUPS_RENDER(groups, collapsed) {
  return groups.map((grp) => (
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
  ));
}

export default AdminSidebar;
