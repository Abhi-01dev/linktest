import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { api } from '../services/api';
import { useAuth } from './AuthContext';
import { NotificationPopup } from '../components/common/NotificationPopup';

const NotificationContext = createContext(null);

export function NotificationProvider({ children }) {
  const { user, isAuthenticated } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [popupQueue, setPopupQueue] = useState([]);
  const seenIdsRef = useRef(new Set());
  const initialLoadDoneRef = useRef(false);

  // Fetch notifications from backend
  const fetchNotifications = useCallback(async (isPolling = false) => {
    if (!api.getToken() || !isAuthenticated) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    try {
      const res = await api.getNotifications({ limit: 50 });
      const list = res.notifications || [];
      const count = res.unread_count !== undefined ? res.unread_count : list.filter(n => !n.read && !n.isRead).length;

      setNotifications(list);
      setUnreadCount(count);

      // On initial load, mark all existing notifications as seen so we don't bombard user with 20 popups
      if (!initialLoadDoneRef.current) {
        list.forEach(n => seenIdsRef.current.add(n.id));
        initialLoadDoneRef.current = true;
      } else {
        // Find newly arrived unread notifications and queue them as transient popups
        const newUnread = list.filter(n => (!n.read && !n.isRead) && !seenIdsRef.current.has(n.id));
        if (newUnread.length > 0) {
          newUnread.forEach(n => seenIdsRef.current.add(n.id));
          // Limit to max 3 concurrent popups at a time to prevent screen clutter
          setPopupQueue(prev => [...prev, ...newUnread].slice(-4));
        }
      }
    } catch (err) {
      // Non-breaking warning
      if (!isPolling) {
        console.warn('[NotificationContext] Failed to load notifications:', err.message);
      }
    }
  }, [isAuthenticated]);

  // Initial load when user changes or authenticates
  useEffect(() => {
    if (isAuthenticated) {
      initialLoadDoneRef.current = false;
      fetchNotifications(false);
    } else {
      setNotifications([]);
      setUnreadCount(0);
      setPopupQueue([]);
      seenIdsRef.current.clear();
    }
  }, [isAuthenticated, user?.id, fetchNotifications]);

  // Polling interval: every 10 seconds for real-time responsiveness
  useEffect(() => {
    if (!isAuthenticated) return;

    const interval = setInterval(() => {
      fetchNotifications(true);
    }, 10000);

    return () => clearInterval(interval);
  }, [isAuthenticated, fetchNotifications]);

  // Show a manual notification/toast immediately (integrated with showToast)
  const showNotification = useCallback(({
    title,
    message,
    type = 'INFO',
    priority = 'NORMAL',
    actionUrl = null,
    actionLabel = null,
    duration = 5000
  }) => {
    const id = 'local_' + Date.now() + Math.random().toString(36).substring(2, 7);
    const newPopup = {
      id,
      title: title || (type === 'ERROR' ? 'Error' : type === 'SUCCESS' ? 'Success' : 'Notice'),
      message: message || '',
      type,
      priority,
      actionUrl,
      actionLabel,
      createdAt: new Date().toISOString()
    };

    setPopupQueue(prev => [...prev, newPopup].slice(-4));
    return id;
  }, []);

  // Backwards compatibility for useToast calls: showToast(message, type)
  const showToast = useCallback((message, type = 'info', options = {}) => {
    let title = 'Notice';
    let normType = String(type || 'info').toUpperCase();

    if (normType === 'SUCCESS') title = 'Success';
    else if (normType === 'ERROR') title = 'Action Required';
    else if (normType === 'WARNING') title = 'Warning';

    return showNotification({
      title: options.title || title,
      message,
      type: normType,
      priority: options.priority || (normType === 'ERROR' ? 'HIGH' : 'NORMAL'),
      actionUrl: options.actionUrl || null,
      actionLabel: options.actionLabel || null
    });
  }, [showNotification]);

  // Dismiss a popup from screen
  const dismissPopup = useCallback((id) => {
    setPopupQueue(prev => prev.filter(p => p.id !== id));
  }, []);

  // Mark notification(s) as read
  const markAsRead = useCallback(async (id) => {
    // Update local state immediately
    setNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, read: true, isRead: true } : n))
    );
    setUnreadCount(prev => Math.max(0, prev - 1));

    // Send API call in background
    try {
      if (!id.startsWith('local_')) {
        await api.markNotificationRead(id);
      }
    } catch (err) {
      console.warn('[NotificationContext] Failed to mark notification read:', err.message);
    }
  }, []);

  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    setNotifications(prev =>
      prev.map(n => ({ ...n, read: true, isRead: true }))
    );
    setUnreadCount(0);

    try {
      await api.markNotificationsRead();
    } catch (err) {
      console.warn('[NotificationContext] Failed to mark all notifications read:', err.message);
    }
  }, []);

  // Dismiss notification permanently
  const dismissNotification = useCallback(async (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
    setUnreadCount(prev => Math.max(0, prev - 1));
    dismissPopup(id);

    try {
      if (!id.startsWith('local_')) {
        await api.dismissNotification(id);
      }
    } catch (err) {
      console.warn('[NotificationContext] Failed to dismiss notification:', err.message);
    }
  }, [dismissPopup]);

  const value = {
    notifications,
    unreadCount,
    showNotification,
    showToast,
    markAsRead,
    markAllAsRead,
    dismissNotification,
    refreshNotifications: () => fetchNotifications(false)
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}

      {/* Floating Popup Container */}
      <div
        className="linktest-toast-container"
        style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-end',
          pointerEvents: 'none',
          maxWidth: '440px',
          width: 'calc(100% - 40px)'
        }}
      >
        {popupQueue.map(popup => (
          <div key={popup.id} style={{ pointerEvents: 'auto', width: '100%' }}>
            <NotificationPopup
              notification={popup}
              onDismiss={() => dismissPopup(popup.id)}
              onAction={() => {
                if (!popup.id.startsWith('local_')) {
                  markAsRead(popup.id);
                }
              }}
            />
          </div>
        ))}
      </div>
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}

// Re-export useToast for complete backward compatibility
export function useToast() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useToast must be used within a NotificationProvider');
  }
  return {
    showToast: context.showToast,
    showNotification: context.showNotification
  };
}
