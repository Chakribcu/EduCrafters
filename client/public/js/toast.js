/**
 * Toast notification utility
 * Created by Chakridhar - April 2025
 * 
 * This utility provides toast notifications with progress bars and auto-close functionality.
 * Usage: 
 *   showToast('success', 'Success message', 3000);
 *   showToast('error', 'Error message', 5000);
 *   showToast('warning', 'Warning message');
 *   showToast('info', 'Info message');
 * 
 * All functions are exposed globally as window.showToast, window.showSuccessToast, etc.
 */

console.log('▶️ Loading toast.js');

// Toast types: success, error, warning, info
const TOAST_ICONS = {
  success: '<i class="bi bi-check-circle-fill text-success me-2"></i>',
  error: '<i class="bi bi-x-circle-fill text-danger me-2"></i>',
  warning: '<i class="bi bi-exclamation-triangle-fill text-warning me-2"></i>',
  info: '<i class="bi bi-info-circle-fill text-info me-2"></i>'
};

// Default duration for toasts
const DEFAULT_DURATION = 3000; // 3 seconds

/**
 * Show a toast notification
 * @param {string} type - Type of toast: success, error, warning, info
 * @param {string} message - The message to display
 * @param {number} duration - Duration in milliseconds before auto-close
 * @param {boolean} dismissible - Whether to show a close button
 * @returns {HTMLElement} - The toast element
 */
function showToast(type = 'info', message, duration = DEFAULT_DURATION, dismissible = true) {
  // Get toast container
  const container = document.getElementById('toastContainer');
  if (!container) return null;

  // Create toast element
  const toast = document.createElement('div');
  toast.className = `toast ${type} show`;
  toast.role = 'alert';
  toast.ariaLive = 'assertive';
  toast.ariaAtomic = 'true';

  // Create toast content
  const icon = TOAST_ICONS[type] || TOAST_ICONS.info;
  
  let headerContent = `
    <div class="toast-header">
      ${icon}
      <strong class="me-auto">${type.charAt(0).toUpperCase() + type.slice(1)}</strong>
      <small>Just now</small>
      ${dismissible ? '<button type="button" class="btn-close" data-bs-dismiss="toast" aria-label="Close"></button>' : ''}
    </div>
  `;
  
  let bodyContent = `
    <div class="toast-body">
      ${message}
    </div>
    <div class="toast-progress">
      <div class="toast-progress-bar" style="width: 100%;"></div>
    </div>
  `;
  
  toast.innerHTML = headerContent + bodyContent;
  
  // Add to container
  container.appendChild(toast);
  
  // Set up progress bar animation
  const progressBar = toast.querySelector('.toast-progress-bar');
  progressBar.style.transition = `width ${duration}ms linear`;
  
  // Start animation after a small delay to ensure it's visible
  setTimeout(() => {
    progressBar.style.width = '0%';
  }, 10);
  
  // Set up auto-close
  const timeout = setTimeout(() => {
    closeToast(toast);
  }, duration);
  
  // Set up close button
  const closeBtn = toast.querySelector('.btn-close');
  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      clearTimeout(timeout);
      closeToast(toast);
    });
  }
  
  return toast;
}

/**
 * Close a toast with fade-out animation
 * @param {HTMLElement} toast - The toast element to close
 */
function closeToast(toast) {
  toast.classList.remove('show');
  toast.classList.add('hiding');
  
  // Remove after animation completes
  setTimeout(() => {
    toast.remove();
  }, 500);
}

// Convenience functions for different toast types
function showSuccessToast(message, duration = DEFAULT_DURATION) {
  return showToast('success', message, duration);
}

function showErrorToast(message, duration = DEFAULT_DURATION) {
  return showToast('error', message, duration);
}

function showWarningToast(message, duration = DEFAULT_DURATION) {
  return showToast('warning', message, duration);
}

function showInfoToast(message, duration = DEFAULT_DURATION) {
  return showToast('info', message, duration);
}

// Expose functions to global window object
window.showToast = showToast;
window.showSuccessToast = showSuccessToast;
window.showErrorToast = showErrorToast;
window.showWarningToast = showWarningToast;
window.showInfoToast = showInfoToast;

console.log('✅ Toast functions exposed globally');