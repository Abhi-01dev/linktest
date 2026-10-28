import React, { useState, useEffect, useRef } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { AdminSidebar } from './AdminSidebar';
import { ShieldAlert, Menu, X } from 'lucide-react';

export function AdminLayout({ children }) {
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem('linktest_admin_sidebar_collapsed') === 'true';
    } catch {
      return false;
    }
  });
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const mainContentRef = useRef(null);

  // Close mobile drawer on route change and reset scroll
  useEffect(() => {
    setMobileOpen(false);
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    if (mainContentRef.current) {
      mainContentRef.current.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    }
  }, [location.pathname]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: 'calc(100vh - 64px)', background: '#F8FAFC' }}>
      {/* Mobile Secondary Toggle for Admin Sidebar (on screens < 1024px) */}
      <div
        className="admin-mobile-subbar"
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
          <div style={{ padding: '0.25rem', background: 'rgba(239, 68, 68, 0.2)', color: '#EF4444', borderRadius: '4px' }}>
            <ShieldAlert size={14} />
          </div>
          <span style={{ fontSize: '0.78rem', fontWeight: 800, letterSpacing: '0.05em', color: '#F1F5F9' }}>
            ADMIN CONSOLE MODULES
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
          aria-label="Toggle admin modules"
        >
          {mobileOpen ? <X size={15} /> : <Menu size={15} />}
          <span>{mobileOpen ? 'Close Menu' : 'All Modules'}</span>
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

        {/* Admin Sidebar */}
        <div className={`admin-sidebar-wrapper ${mobileOpen ? 'mobile-open' : ''}`}>
          <AdminSidebar collapsed={collapsed} setCollapsed={setCollapsed} />
        </div>

        {/* Main Content Area */}
        <main
          ref={mainContentRef}
          className="admin-main-content"
          style={{
            flex: 1,
            padding: '1.75rem 2rem',
            overflowY: 'auto',
            minWidth: 0,
            maxWidth: '100%',
            transition: 'padding 0.2s ease'
          }}
        >
          {children || <Outlet />}
        </main>
      </div>

      {/* Responsive Styles for Admin Layout */}
      <style>{`
        @media (max-width: 1023px) {
          .admin-mobile-subbar {
            display: flex !important;
          }
          .admin-sidebar-wrapper {
            position: fixed !important;
            top: 108px !important;
            left: 0 !important;
            bottom: 0 !important;
            height: calc(100vh - 108px) !important;
            z-index: 40 !important;
            transform: translateX(-100%);
            transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1) !important;
          }
          .admin-sidebar-wrapper.mobile-open {
            transform: translateX(0) !important;
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
