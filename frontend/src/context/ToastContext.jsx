import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, type = 'info') => {
    const id = Date.now() + Math.random().toString(36).substring(2, 9);
    setToasts(prev => [...prev, { id, message, type }]);

    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="toast-container" role="status" aria-live="polite">
        {toasts.map(toast => {
          let Icon = Info;
          let iconColor = '#38BDF8';
          if (toast.type === 'success') {
            Icon = CheckCircle2;
            iconColor = '#34D399';
          } else if (toast.type === 'error') {
            Icon = AlertCircle;
            iconColor = '#F87171';
          }

          return (
            <div key={toast.id} className="toast">
              <Icon size={18} style={{ color: iconColor, flexShrink: 0 }} />
              <span style={{ flex: 1 }}>{toast.message}</span>
              <button
                onClick={() => removeToast(toast.id)}
                style={{ color: '#94A3B8', padding: 2, display: 'flex' }}
                aria-label="Close notification"
              >
                <X size={14} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
