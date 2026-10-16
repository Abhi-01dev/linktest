import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Info,
  Clock,
  Check,
  CheckCheck,
  X,
  FileCheck2,
  Award,
  Video,
  ExternalLink,
  ShieldAlert,
  UserCheck,
  Inbox
} from 'lucide-react';
import { useNotifications } from '../../context/NotificationContext';

export function NotificationCenter({ isOpen, onClose }) {
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    dismissNotification
  } = useNotifications();

  const [activeTab, setActiveTab] = useState('ALL'); // 'ALL' or 'UNREAD'
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        onClose?.();
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const filteredNotifications = notifications.filter(item => {
    if (activeTab === 'UNREAD') return !item.isRead && !item.read;
    return true;
  });

  const handleAction = (item) => {
    markAsRead(item.id);
    if (item.actionUrl) {
      navigate(item.actionUrl);
    }
    onClose?.();
  };

  const formatTime = (isoString) => {
    if (!isoString) return 'Just now';
    try {
      const diffSec = Math.floor((Date.now() - new Date(isoString).getTime()) / 1000);
      if (diffSec < 60) return 'Just now';
      if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
      if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
      if (diffSec < 172800) return 'Yesterday';
      return new Date(isoString).toLocaleDateString([], { month: 'short', day: 'numeric' });
    } catch {
      return 'Recently';
    }
  };

  const getNotificationIcon = (type, priority) => {
    if (String(priority).toUpperCase() === 'CRITICAL') {
      return { Icon: ShieldAlert, bg: '#FEE2E2', color: '#B91C1C' };
    }
    switch (String(type).toUpperCase()) {
      case 'SUCCESS':
      case 'TASK_COMPLETED':
        return { Icon: CheckCircle2, bg: '#ECFDF5', color: '#059669' };
      case 'RESULT_PUBLISHED':
        return { Icon: Award, bg: '#FEF3C7', color: '#D97706' };
      case 'APPROVAL_REQUIRED':
        return { Icon: UserCheck, bg: '#F5F3FF', color: '#7C3AED' };
      case 'WARNING':
        return { Icon: AlertTriangle, bg: '#FFFBEB', color: '#D97706' };
      case 'ERROR':
        return { Icon: AlertCircle, bg: '#FEF2F2', color: '#DC2626' };
      case 'ACTION_REQUIRED':
      case 'TASK_STARTED':
        return { Icon: Clock, bg: '#EFF6FF', color: '#2563EB' };
      default:
        return { Icon: Info, bg: '#EFF6FF', color: '#2563EB' };
    }
  };

  return (
    <div
      ref={dropdownRef}
      className="linktest-notification-center"
      style={{
        position: 'absolute',
        top: 'calc(100% + 8px)',
        right: '0',
        width: '380px',
        maxWidth: '92vw',
        background: '#FFFFFF',
        borderRadius: '14px',
        boxShadow: '0 20px 40px -10px rgba(15, 23, 42, 0.18), 0 0 0 1px rgba(15, 23, 42, 0.08)',
        zIndex: 1000,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        maxHeight: '520px',
        animation: 'fadeInScale 0.15s cubic-bezier(0.16, 1, 0.3, 1)'
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '1rem 1.15rem 0.75rem',
          borderBottom: '1px solid #F1F5F9',
          background: '#FAFAFC',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <h3 style={{ margin: 0, fontSize: '0.98rem', fontWeight: 700, color: '#0F172A' }}>
            Notifications
          </h3>
          {unreadCount > 0 && (
            <span
              style={{
                background: '#EFF6FF',
                color: '#2563EB',
                border: '1px solid #BFDBFE',
                borderRadius: '12px',
                padding: '0.1rem 0.5rem',
                fontSize: '0.72rem',
                fontWeight: 700
              }}
            >
              {unreadCount} new
            </span>
          )}
        </div>

        {unreadCount > 0 && (
          <button
            onClick={() => markAllAsRead()}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#2563EB',
              fontSize: '0.76rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.3rem',
              padding: '0.2rem 0.4rem',
              borderRadius: '4px'
            }}
            title="Mark all as read"
          >
            <CheckCheck size={14} />
            <span>Mark all read</span>
          </button>
        )}
      </div>

      {/* Tabs */}
      <div
        style={{
          display: 'flex',
          borderBottom: '1px solid #E2E8F0',
          padding: '0 1rem',
          background: '#FFFFFF'
        }}
      >
        <button
          onClick={() => setActiveTab('ALL')}
          style={{
            padding: '0.6rem 0.75rem',
            border: 'none',
            background: 'transparent',
            fontSize: '0.8rem',
            fontWeight: activeTab === 'ALL' ? 700 : 500,
            color: activeTab === 'ALL' ? '#2563EB' : '#64748B',
            borderBottom: activeTab === 'ALL' ? '2px solid #2563EB' : '2px solid transparent',
            cursor: 'pointer'
          }}
        >
          All ({notifications.length})
        </button>
        <button
          onClick={() => setActiveTab('UNREAD')}
          style={{
            padding: '0.6rem 0.75rem',
            border: 'none',
            background: 'transparent',
            fontSize: '0.8rem',
            fontWeight: activeTab === 'UNREAD' ? 700 : 500,
            color: activeTab === 'UNREAD' ? '#2563EB' : '#64748B',
            borderBottom: activeTab === 'UNREAD' ? '2px solid #2563EB' : '2px solid transparent',
            cursor: 'pointer'
          }}
        >
          Unread ({unreadCount})
        </button>
      </div>

      {/* Notification Items List */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '0.4rem 0'
        }}
      >
        {filteredNotifications.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem 1.5rem', color: '#64748B' }}>
            <Inbox size={40} style={{ color: '#CBD5E1', margin: '0 auto 0.75rem', display: 'block' }} />
            <div style={{ fontWeight: 600, fontSize: '0.92rem', color: '#1E293B' }}>
              {activeTab === 'UNREAD' ? 'No unread notifications' : 'No notifications yet'}
            </div>
            <div style={{ fontSize: '0.8rem', color: '#94A3B8', marginTop: '0.25rem' }}>
              {activeTab === 'UNREAD'
                ? "You're all caught up with your tasks."
                : 'Task updates, grades, and mock test entries will appear here.'}
            </div>
          </div>
        ) : (
          filteredNotifications.map(item => {
            const isUnread = !item.isRead && !item.read;
            const { Icon, bg, color } = getNotificationIcon(item.type, item.priority);
            const isCrit = String(item.priority).toUpperCase() === 'CRITICAL';

            return (
              <div
                key={item.id}
                onClick={() => isUnread && markAsRead(item.id)}
                style={{
                  padding: '0.85rem 1.15rem',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.75rem',
                  background: isUnread ? '#F8FAFC' : '#FFFFFF',
                  borderBottom: '1px solid #F1F5F9',
                  transition: 'background 0.15s ease',
                  cursor: 'pointer',
                  position: 'relative'
                }}
                onMouseEnter={(e) => {
                  if (!isUnread) e.currentTarget.style.background = '#F8FAFC';
                }}
                onMouseLeave={(e) => {
                  if (!isUnread) e.currentTarget.style.background = '#FFFFFF';
                }}
              >
                {/* Unread indicator dot */}
                <div style={{ width: '8px', display: 'flex', justifyContent: 'center', marginTop: '6px' }}>
                  {isUnread ? (
                    <span
                      style={{
                        width: '7px',
                        height: '7px',
                        borderRadius: '50%',
                        background: '#2563EB',
                        display: 'block'
                      }}
                      title="Unread"
                    />
                  ) : (
                    <span
                      style={{
                        width: '5px',
                        height: '5px',
                        borderRadius: '50%',
                        background: '#CBD5E1',
                        display: 'block'
                      }}
                    />
                  )}
                </div>

                {/* Icon */}
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    background: bg,
                    color: color,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    marginTop: '2px'
                  }}
                >
                  <Icon size={16} />
                </div>

                {/* Content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.4rem' }}>
                    <div style={{ fontWeight: isUnread ? 700 : 600, color: '#0F172A', fontSize: '0.86rem' }}>
                      {item.title}
                    </div>
                    <span style={{ fontSize: '0.72rem', color: '#94A3B8', whiteSpace: 'nowrap' }}>
                      {formatTime(item.createdAt || item.created_at)}
                    </span>
                  </div>

                  <p
                    style={{
                      margin: '0.2rem 0 0 0',
                      fontSize: '0.8rem',
                      color: isUnread ? '#334155' : '#64748B',
                      lineHeight: 1.4,
                      wordBreak: 'break-word'
                    }}
                  >
                    {item.message}
                  </p>

                  {/* Contextual Action Button */}
                  {item.actionUrl && item.actionLabel && (
                    <div style={{ marginTop: '0.5rem' }}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAction(item);
                        }}
                        style={{
                          background: isCrit ? '#DC2626' : '#2563EB',
                          color: '#FFFFFF',
                          border: 'none',
                          borderRadius: '5px',
                          padding: '0.25rem 0.6rem',
                          fontSize: '0.74rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.3rem'
                        }}
                      >
                        <span>{item.actionLabel}</span>
                        <ExternalLink size={11} />
                      </button>
                    </div>
                  )}
                </div>

                {/* Dismiss button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    dismissNotification(item.id);
                  }}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#94A3B8',
                    cursor: 'pointer',
                    padding: '2px',
                    borderRadius: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}
                  title="Dismiss notification"
                  onMouseEnter={(e) => (e.currentTarget.style.color = '#334155')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = '#94A3B8')}
                >
                  <X size={13} />
                </button>
              </div>
            );
          })
        )}
      </div>

      {/* Footer */}
      <div
        style={{
          padding: '0.65rem 1rem',
          borderTop: '1px solid #F1F5F9',
          background: '#FAFAFC',
          textAlign: 'center',
          fontSize: '0.76rem',
          color: '#64748B',
          fontWeight: 500
        }}
      >
        LinkTest Real-Time Notification Center
      </div>
    </div>
  );
}
