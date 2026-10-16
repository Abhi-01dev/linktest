import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Calendar,
  ClipboardCheck,
  FileText,
  BookOpen,
  Video,
  Megaphone,
  Award,
  HelpCircle,
  FileCheck2
} from 'lucide-react';

export function StudentNav() {
  const items = [
    { label: 'Overview', to: '/dashboard', icon: LayoutDashboard },
    { label: 'Mock Tests', to: '/mock-tests', icon: FileCheck2 },
    { label: 'Timetable', to: '/timetable', icon: Calendar },
    { label: 'Attendance', to: '/attendance', icon: ClipboardCheck },
    { label: 'Assignments', to: '/assignments', icon: FileText },
    { label: 'Materials', to: '/materials', icon: BookOpen },
    { label: 'Live Classes', to: '/live-classes', icon: Video },
    { label: 'Announcements', to: '/announcements', icon: Megaphone },
    { label: 'My Progress', to: '/progress', icon: Award },
    { label: 'Support', to: '/support', icon: HelpCircle }
  ];

  return (
    <nav
      aria-label="Student portal tabs"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.35rem',
        overflowX: 'auto',
        padding: '0.35rem 0 0.85rem',
        marginBottom: '1.75rem',
        borderBottom: '1px solid var(--color-border)',
        scrollbarWidth: 'none',
        msOverflowStyle: 'none'
      }}
      className="student-subnav-strip"
    >
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/dashboard'}
            style={({ isActive }) => ({
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.45rem',
              padding: '0.45rem 0.85rem',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.84rem',
              fontWeight: isActive ? 600 : 500,
              textDecoration: 'none',
              whiteSpace: 'nowrap',
              background: isActive ? 'var(--color-navy)' : 'transparent',
              color: isActive ? '#FFFFFF' : 'var(--color-text-secondary)',
              border: isActive ? '1px solid var(--color-navy)' : '1px solid transparent',
              transition: 'all var(--transition-fast)'
            })}
          >
            <Icon size={14} style={{ opacity: 0.85 }} />
            <span>{item.label}</span>
          </NavLink>
        );
      })}
    </nav>
  );
}

export default StudentNav;
