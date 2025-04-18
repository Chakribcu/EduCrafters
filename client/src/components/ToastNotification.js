import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useToast } from '../hooks/use-toast';

const Toast = ({ toast, onClose }) => {
  const [visible, setVisible] = useState(true);
  const { id, title, description, variant = 'default', duration = 5000 } = toast;

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(() => onClose(id), 300); // Wait for animation to complete
    }, duration);

    return () => clearTimeout(timer);
  }, [id, duration, onClose]);

  const getVariantClass = () => {
    switch (variant) {
      case 'destructive':
        return 'bg-danger text-white';
      case 'success':
        return 'bg-success text-white';
      case 'warning':
        return 'bg-warning text-dark';
      default:
        return 'bg-primary text-white';
    }
  };

  const getIcon = () => {
    switch (variant) {
      case 'destructive':
        return (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="15" y1="9" x2="9" y2="15" />
            <line x1="9" y1="9" x2="15" y2="15" />
          </svg>
        );
      case 'success':
        return (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
        );
      case 'warning':
        return (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
        );
      default:
        return (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        );
    }
  };

  const animationClass = visible 
    ? 'animate__animated animate__fadeInDown' 
    : 'animate__animated animate__fadeOutUp';

  return (
    <div className={`toast ${getVariantClass()} ${animationClass} mb-2 shadow-lg`} role="alert" aria-live="assertive" aria-atomic="true">
      <div className="toast-header border-0 bg-transparent text-white">
        <div className="mr-2">{getIcon()}</div>
        <strong className="mr-auto">{title}</strong>
        <button type="button" className="ml-2 mb-1 close text-white" onClick={() => onClose(id)}>
          <span aria-hidden="true">&times;</span>
        </button>
      </div>
      {description && (
        <div className="toast-body">
          {description}
        </div>
      )}
    </div>
  );
};

const ToastContainer = () => {
  const { toasts, dismissToast } = useToast();

  // Use createPortal to render toasts at the top level of the DOM
  return createPortal(
    <div className="position-fixed top-0 end-0 p-3" style={{ zIndex: 9999 }}>
      <div className="toast-container">
        {toasts.map((toast) => (
          <Toast 
            key={toast.id} 
            toast={toast} 
            onClose={dismissToast} 
          />
        ))}
      </div>
    </div>,
    document.body
  );
};

export default ToastContainer;