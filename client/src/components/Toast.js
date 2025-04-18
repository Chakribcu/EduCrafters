// Professional Toast Notification Component 
// Created by Chakridhar

import React, { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useToast } from '../hooks/use-toast';

// Individual toast component
const ToastItem = ({ toast, onClose }) => {
  const [visible, setVisible] = useState(true);
  const [progressWidth, setProgressWidth] = useState(100);
  const { id, title, description, variant = 'default', duration = 5000 } = toast;
  const intervalRef = useRef(null);
  
  // Progress bar animation and auto-dismiss logic
  useEffect(() => {
    // Start progress bar animation
    const startTime = Date.now();
    const updateInterval = 10; // Update every 10ms for smooth animation
    const totalSteps = duration / updateInterval;
    let step = 0;
    
    intervalRef.current = setInterval(() => {
      step++;
      const remaining = Math.max(0, 100 - (step * 100) / totalSteps);
      setProgressWidth(remaining);
      
      // When animation completes, dismiss the toast
      if (step >= totalSteps) {
        clearInterval(intervalRef.current);
        setVisible(false);
        setTimeout(() => onClose(id), 500); // Allow animation to complete
      }
    }, updateInterval);
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [id, duration, onClose]);
  
  // Get CSS classes based on variant
  const getVariantClasses = () => {
    switch (variant) {
      case 'success':
        return 'bg-success text-white';
      case 'error':
      case 'destructive':
        return 'bg-danger text-white';
      case 'warning':
        return 'bg-warning text-dark';
      case 'info':
        return 'bg-info text-white';
      default:
        return 'bg-primary text-white';
    }
  };
  
  // Get progress bar color based on variant
  const getProgressColor = () => {
    switch (variant) {
      case 'success':
        return 'rgba(255, 255, 255, 0.5)';
      case 'error':
      case 'destructive':
        return 'rgba(255, 255, 255, 0.5)';
      case 'warning':
        return 'rgba(0, 0, 0, 0.2)';
      case 'info':
        return 'rgba(255, 255, 255, 0.5)';
      default:
        return 'rgba(255, 255, 255, 0.5)';
    }
  };
  
  // Get appropriate icon based on variant
  const getIcon = () => {
    switch (variant) {
      case 'success':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
            <polyline points="22 4 12 14.01 9 11.01"></polyline>
          </svg>
        );
      case 'error':
      case 'destructive':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="15" y1="9" x2="9" y2="15"></line>
            <line x1="9" y1="9" x2="15" y2="15"></line>
          </svg>
        );
      case 'warning':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
            <line x1="12" y1="9" x2="12" y2="13"></line>
            <line x1="12" y1="17" x2="12.01" y2="17"></line>
          </svg>
        );
      case 'info':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="16" x2="12" y2="12"></line>
            <line x1="12" y1="8" x2="12.01" y2="8"></line>
          </svg>
        );
      default:
        return (
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
          </svg>
        );
    }
  };
  
  const animationClass = visible ? 'animate__animated animate__fadeInRight' : 'animate__animated animate__fadeOutRight';
  
  // Handle manual close
  const handleClose = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    setVisible(false);
    setTimeout(() => onClose(id), 300);
  };
  
  return (
    <div className={`toast ${getVariantClasses()} ${animationClass} shadow my-3`} 
         role="alert" 
         aria-live="assertive" 
         aria-atomic="true"
         style={{ position: 'relative', overflow: 'hidden' }}>
      <div className="toast-header border-0 bg-transparent text-white">
        <div className="me-2">{getIcon()}</div>
        <strong className="me-auto">{title}</strong>
        <button type="button" className="btn-close btn-close-white" onClick={handleClose} aria-label="Close"></button>
      </div>
      {description && (
        <div className="toast-body">
          {description}
        </div>
      )}
      
      {/* Progress bar at the bottom of the toast */}
      <div 
        className="toast-progress-bar" 
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          height: '4px',
          width: `${progressWidth}%`,
          backgroundColor: getProgressColor(),
          transition: 'width 0.1s linear'
        }}
      />
    </div>
  );
};

// Toast container component
const ToastContainer = () => {
  const { toasts, dismissToast } = useToast();
  const [isMounted, setIsMounted] = useState(false);
  
  // Wait for DOM to be ready
  useEffect(() => {
    setIsMounted(true);
  }, []);
  
  if (!isMounted) return null;
  
  // Use portal to render at the top level of the DOM
  return createPortal(
    <div className="toast-container position-fixed top-0 end-0 p-3" style={{ zIndex: 9999 }}>
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onClose={dismissToast} />
      ))}
    </div>,
    document.body
  );
};

export default ToastContainer;