import React, { forwardRef, useImperativeHandle, useState } from 'react';
import './CustomToast.css';

const CustomToast = forwardRef((props, ref) => {
  const [toasts, setToasts] = useState([]);

  useImperativeHandle(ref, () => ({
    // Normal toast messages (auto-dismiss)
    showSuccess: (message, duration = 4000) => {
      showToast(message, 'success', duration);
    },
    showError: (message, duration = 4000) => {
      showToast(message, 'error', duration);
    },
    showWarning: (message, duration = 4000) => {
      showToast(message, 'warning', duration);
    },
    showInfo: (message, duration = 4000) => {
      showToast(message, 'info', duration);
    },
    // Confirmation dialog (manual dismiss)
    showConfirm: ({ message, onConfirm, onCancel, confirmText = 'Yes', cancelText = 'No' }) => {
      const id = Date.now() + Math.random();
      const toast = {
        id,
        message,
        type: 'confirm',
        onConfirm: () => {
          removeToast(id);
          if (onConfirm) onConfirm();
        },
        onCancel: () => {
          removeToast(id);
          if (onCancel) onCancel();
        },
        confirmText,
        cancelText
      };
      setToasts(prev => [...prev, toast]);
    }
  }));

  const showToast = (message, type, duration) => {
    const id = Date.now() + Math.random();
    const toast = { id, message, type };
    
    setToasts(prev => [...prev, toast]);
    
    // Auto remove after duration
    setTimeout(() => {
      removeToast(id);
    }, duration);
  };

  const removeToast = (id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  const getToastIcon = (type) => {
    switch (type) {
      case 'success': return '✓';
      case 'error': return '✕';
      case 'warning': return '⚠';
      case 'info': return 'ℹ';
      case 'confirm': return '?';
      default: return 'ℹ';
    }
  };

  return (
    <>
      {/* Normal Toast Messages */}
      <div className="toast-container">
        {toasts.filter(toast => toast.type !== 'confirm').map(toast => (
          <div key={toast.id} className={`toast toast-${toast.type}`}>
            <div className="toast-icon">{getToastIcon(toast.type)}</div>
            <div className="toast-message">{toast.message}</div>
            <button 
              className="toast-close" 
              onClick={() => removeToast(toast.id)}
              aria-label="Close"
            >
              ×
            </button>
          </div>
        ))}
      </div>

      {/* Confirmation Dialogs */}
      {toasts.filter(toast => toast.type === 'confirm').map(toast => (
        <div key={toast.id} className="toast-overlay">
          <div className="toast-dialog">
            <div className="toast-dialog-icon">{getToastIcon('confirm')}</div>
            <div className="toast-dialog-message">{toast.message}</div>
            <div className="toast-dialog-actions">
              <button 
                className="toast-btn toast-btn-cancel" 
                onClick={toast.onCancel}
              >
                {toast.cancelText}
              </button>
              <button 
                className="toast-btn toast-btn-confirm" 
                onClick={toast.onConfirm}
              >
                {toast.confirmText}
              </button>
            </div>
          </div>
        </div>
      ))}
    </>
  );
});

CustomToast.displayName = 'CustomToast';

export default CustomToast;