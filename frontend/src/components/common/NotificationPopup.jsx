import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Info,
  Clock,
  Check,
  X,
  FileCheck2,
  Award,
  Video,
  ExternalLink,
  ShieldAlert,
  UserCheck
} from 'lucide-react';

export function NotificationPopup({ notification, onDismiss, onAction }) {
  const navigate = useNavigate();
  const [isExiting, setIsExiting] = useState(false);

  const {
    id,
    title,
    message,
    type = 'INFO',
    priority = 'NORMAL',
    actionUrl,
    actionLabel,
    createdAt
  } = notification;

  const normalizedPriority = String(priority).toUpperCase();
  const isCritical = normalizedPriority === 'CRITICAL';
  const isHigh = normalizedPriority === 'HIGH';

  // Auto-dismiss rules:
  // - Critical notifications NEVER auto-dismiss
  // - High priority with action button stays open or 8s
  // - Normal / Low auto-dismiss in 6s
  useEffect(() => {
    if (isCritical) return;

    const timeoutDuration = (isHigh && actionUrl) ? 9000 : 6000;
    const timer = setTimeout(() => {
      handleClose();
    }, timeoutDuration);

    return () => clearTimeout(timer);
  }, [id, isCritical, isHigh, actionUrl]);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => {
      onDismiss?.(id);
    }, 200);
  };

  const handleActionClick = (e) => {
    e.stopPropagation();
    if (onAction) {
      onAction(notification);
    }
    if (actionUrl) {
      navigate(actionUrl);
    }
    handleClose();
  };

  // Determine Icon and Styling based on Type and Priority
  let Icon = Info;
  let iconBg = '#EFF6FF';
  let iconColor = '#2563EB';
  let borderColor = '#E2E8F0';
  let badgeText = normalizedPriority !== 'NORMAL' ? normalizedPriority : null;
  let badgeBg = '#F1F5F9';
  let badgeColor = '#475569';

  switch (String(type).toUpperCase()) {
    case 'SUCCESS':
    case 'TASK_COMPLETED':
      Icon = CheckCircle2;
      iconBg = '#ECFDF5';
      iconColor = '#059669';
      break;
    case 'RESULT_PUBLISHED':
      Icon = Award;
      iconBg = '#FEF3C7';
      iconColor = '#D97706';
      break;
    case 'APPROVAL_REQUIRED':
      Icon = UserCheck;
      iconBg = '#F5F3FF';
      iconColor = '#7C3AED';
      break;
    case 'WARNING':
      Icon = AlertTriangle;
      iconBg = '#FFFBEB';
      iconColor = '#D97706';
      borderColor = '#FDE68A';
      break;
    case 'ERROR':
      Icon = AlertCircle;
      iconBg = '#FEF2F2';
      iconColor = '#DC2626';
      borderColor = '#FECACA';
      break;
    case 'ACTION_REQUIRED':
    case 'TASK_STARTED':
      Icon = Clock;
      iconBg = '#EFF6FF';
      iconColor = '#2563EB';
      break;
    default:
      Icon = Info;
      iconBg = '#EFF6FF';
      iconColor = '#2563EB';
  }

  if (isCritical) {
    Icon = ShieldAlert;
    iconBg = '#FEE2E2';
    iconColor = '#B91C1C';
    borderColor = '#F87171';
    badgeBg = '#EF4444';
    badgeColor = '#FFFFFF';
    badgeText = 'CRITICAL';
  } else if (isHigh) {
    badgeBg = '#FEF3C7';
    badgeColor = '#B45309';
  }

  // Format relative time if available
  const formattedTime = (() => {
    if (!createdAt) return 'Just now';
    try {
      const diffSec = Math.floor((Date.now() - new Date(createdAt).getTime()) / 1000);
      if (diffSec < 60) return 'Just now';
      if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
      return new Date(createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return 'Just now';
    }
  })();

  return (
    <div
      role="alert"
      aria-live={isCritical ? 'assertive' : 'polite'}
      className="linktest-notification-popup"
      style={{
        width: '100%',
        maxWidth: '420px',
        background: '#FFFFFF',
        borderRadius: '12px',
        border: `1px solid ${borderColor}`,
        boxShadow: isCritical
          ? '0 12px 28px -4px rgba(220, 38, 38, 0.18), 0 8px 12px -6px rgba(0, 0, 0, 0.08)'
          : '0 12px 28px -4px rgba(15, 23, 42, 0.12), 0 8px 10px -6px rgba(15, 23, 42, 0.05)',
        padding: '1rem 1.15rem',
        marginBottom: '0.75rem',
        position: 'relative',
        transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
        opacity: isExiting ? 0 : 1,
        transform: isExiting ? 'translateY(-10px) scale(0.97)' : 'translateY(0) scale(1)',
        overflow: 'hidden'
      }}
    >
      {/* Brand accent bar on left */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          bottom: 0,
          width: '4px',
          background: isCritical ? '#DC2626' : isHigh ? '#F59E0B' : iconColor
        }}
      />

      {/* Header Row: Icon + Title + Priority Badge + Close Button */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
        <div
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '8px',
            background: iconBg,
            color: iconColor,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            marginTop: '1px'
          }}
        >
          <Icon size={18} />
        </div>

        <div style={{ flex: 1, minWidth: 0, paddingRight: '0.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap' }}>
            <span
              style={{
                fontWeight: 700,
                color: isCritical ? '#991B1B' : '#0F172A',
                fontSize: '0.92rem',
                lineHeight: 1.3
              }}
            >
              {title}
            </span>

            {badgeText && (
              <span
                style={{
                  fontSize: '0.65rem',
                  fontWeight: 800,
                  letterSpacing: '0.04em',
                  padding: '0.12rem 0.4rem',
                  borderRadius: '4px',
                  background: badgeBg,
                  color: badgeColor,
                  lineHeight: 1.2
                }}
              >
                {badgeText}
              </span>
            )}
          </div>

          <p
            style={{
              color: '#475569',
              fontSize: '0.84rem',
              lineHeight: 1.45,
              margin: '0.35rem 0 0 0',
              wordBreak: 'break-word'
            }}
          >
            {message}
          </p>

          {/* Timestamp & Action Bar */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginTop: '0.75rem',
              paddingTop: '0.5rem',
              borderTop: '1px solid #F1F5F9',
              gap: '0.5rem',
              flexWrap: 'wrap'
            }}
          >
            <span style={{ fontSize: '0.72rem', color: '#94A3B8', fontWeight: 500 }}>
              {formattedTime}
            </span>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              {actionUrl && actionLabel ? (
                <button
                  onClick={handleActionClick}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    background: isCritical ? '#DC2626' : '#2563EB',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '0.35rem 0.75rem',
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.06)',
                    transition: 'opacity 0.15s ease'
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.9')}
                  onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
                >
                  <span>{actionLabel}</span>
                  <ExternalLink size={12} />
                </button>
              ) : (
                <button
                  onClick={handleClose}
                  style={{
                    background: 'transparent',
                    border: '1px solid #E2E8F0',
                    color: '#64748B',
                    borderRadius: '6px',
                    padding: '0.25rem 0.6rem',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Dismiss
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Top-Right Close Button */}
        <button
          onClick={handleClose}
          aria-label="Dismiss notification"
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
          onMouseEnter={(e) => (e.currentTarget.style.color = '#334155')}
          onMouseLeave={(e) => (e.currentTarget.style.color = '#94A3B8')}
        >
          <X size={15} />
        </button>
      </div>
    </div>
  );
}
