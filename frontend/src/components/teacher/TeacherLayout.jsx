import React, { useState } from 'react';
import { NavLink, Outlet, Link } from 'react-router-dom';
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
  ChevronRight,
  FileCheck2,
  FileSpreadsheet,
  Menu
} from 'lucide-react';

export function TeacherLayout({ children }) {
  const { user } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  const navItems = [
    { label: 'Faculty Dashboard', to: '/teacher', icon: LayoutDashboard, exact: true },
    { label: 'Mock Tests & Exams', to: '/teacher/mock-tests', icon: FileCheck2 },
    { label: 'Question Bank & Import', to: '/teacher/question-bank', icon: FileSpreadsheet },
    { label: 'My Classes & Students', to: '/teacher/classes', icon: Users },
    { label: 'Weekly Timetable', to: '/teacher/timetable', icon: Calendar },
    { label: 'Roll-Call Attendance', to: '/teacher/attendance', icon: ClipboardCheck },
    { label: 'Assignments & Grading', to: '/teacher/assignments', icon: FileText },
    { label: 'Study Materials', to: '/teacher/materials', icon: BookOpen },
    { label: 'Live Classes', to: '/teacher/live-classes', icon: Video },
    { label: 'Announcements', to: '/teacher/announcements', icon: Megaphone },
    { label: 'Syllabus Tracker', to: '/teacher/syllabus', icon: CheckSquare },
    { label: 'Leave Requests', to: '/teacher/leave', icon: CalendarOff },
    { label: 'My Profile', to: '/teacher/profile', icon: User }
  ];

  return (
    <div style={{ display: 'flex', minHeight: 'calc(100vh - 70px)', background: '#F8FAFC' }}>
      {/* Sidebar */}
      <aside
        style={{
          width: collapsed ? '72px' : '260px',
          background: '#0F172A',
          color: '#F8FAFC',
          transition: 'width 0.2s ease',
          display: 'flex',
          flexDirection: 'column',
          borderRight: '1px solid #1E293B',
          flexShrink: 0,
          position: 'sticky',
          top: '70px',
          height: 'calc(100vh - 70px)',
          overflowY: 'auto'
        }}
      >
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
              <div style={{ padding: '0.35rem', background: 'rgba(37, 99, 235, 0.2)', color: '#3B82F6', borderRadius: '6px' }}>
                <GraduationCap size={18} />
              </div>
              <div>
                <div style={{ fontSize: '0.85rem', fontWeight: 800, letterSpacing: '0.05em', color: '#F1F5F9' }}>
                  TEACHER PORTAL
                </div>
                <div style={{ fontSize: '0.7rem', color: '#94A3B8' }}>Faculty Workspace</div>
              </div>
            </div>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="btn btn-ghost"
            style={{ color: '#94A3B8', padding: '0.35rem', minWidth: 'auto', border: 'none' }}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <ChevronRight size={18} /> : <Menu size={18} />}
          </button>
        </div>

        <nav style={{ padding: '0.75rem 0.5rem', flex: 1, display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.exact}
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

        {!collapsed && (
          <div style={{ padding: '1rem', borderTop: '1px solid #1E293B', background: '#0B1120' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  background: '#2563EB',
                  color: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: '0.8rem'
                }}
              >
                {user?.full_name?.charAt(0) || 'T'}
              </div>
              <div style={{ overflow: 'hidden' }}>
                <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#F1F5F9', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                  {user?.full_name}
                </div>
                <div style={{ fontSize: '0.7rem', color: '#60A5FA', fontWeight: 600 }}>Faculty Teacher</div>
              </div>
            </div>
          </div>
        )}
      </aside>

      <main style={{ flex: 1, padding: '2rem 2.5rem', overflowY: 'auto' }}>
        {children || <Outlet />}
      </main>
    </div>
  );
}
export default TeacherLayout;
