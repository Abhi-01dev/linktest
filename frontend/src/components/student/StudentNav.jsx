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
    { label: 'Progress', to: '/progress', icon: Award },
    { label: 'Support', to: '/support', icon: HelpCircle }
  ];

  return (
    <div
      style={{
        display: 'flex',
        gap: '0.5rem',
        overflowX: 'auto',
        padding: '0.5rem 0',
        marginBottom: '2rem',
        borderBottom: '1px solid var(--color-border)'
      }}
    >
      {items.map(item => {
        const Icon = item.icon;
        return (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/dashboard'}
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem',
              padding: '0.5rem 0.9rem',
              borderRadius: '999px',
              fontSize: '0.84rem',
              fontWeight: 600,
              textDecoration: 'none',
              whiteSpace: 'nowrap',
              background: isActive ? 'var(--color-navy)' : 'var(--color-bg-alt)',
              color: isActive ? '#FFFFFF' : 'var(--color-text-secondary)',
              transition: 'all var(--transition-fast)'
            })}
          >
            <Icon size={15} />
            <span>{item.label}</span>
          </NavLink>
        );
      })}
    </div>
  );
}
export default StudentNav;
