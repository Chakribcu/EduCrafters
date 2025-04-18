/**
 * Global state initialization
 * Consolidated initialization file that runs before any other JavaScript
 */

// IIFE to avoid global scope pollution while still exposing necessary functions
(function() {
  console.log('▶️ Running init.js - Global Initialization');
  
  // ==========================================
  // GLOBAL STATE INITIALIZATION
  // ==========================================
  
  // Ensure window.appState exists
  if (!window.appState) {
    window.appState = {
      isAuthenticated: false,
      currentPath: window.location.pathname,
      lastPath: '',
      user: null
    };
    console.log('Created new appState object');
  }
  
  // Initialize user data
  window.currentUser = null;
  window.authToken = localStorage.getItem('authToken') || null;
  
  // Try to restore user from localStorage
  try {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      window.currentUser = JSON.parse(storedUser);
      window.appState.isAuthenticated = true;
      console.log('Restored user from localStorage');
    }
  } catch (e) {
    console.warn('Error parsing stored user data', e);
  }
  
  // ==========================================
  // GLOBAL UTILITY FUNCTIONS
  // ==========================================
  
  // Define fetchCourses function
  window.fetchCourses = async function() {
    console.log('✅ Running global window.fetchCourses()');
    try {
      const response = await fetch('/api/courses');
      if (!response.ok) {
        throw new Error('Failed to fetch courses');
      }
      const data = await response.json();
      console.log(`Fetched ${data.length} courses`);
      return data;
    } catch (error) {
      console.error('Error in global fetchCourses:', error);
      return [];
    }
  };
  
  // Toast notification functions
  window.showSuccessToast = function(message, duration = 3000) {
    if (typeof window.showToast === 'function') {
      window.showToast('success', message, duration);
    } else {
      console.log('Success:', message);
    }
  };
  
  window.showErrorToast = function(message, duration = 3000) {
    if (typeof window.showToast === 'function') {
      window.showToast('error', message, duration);
    } else {
      console.error('Error:', message);
    }
  };
  
  window.showInfoToast = function(message, duration = 3000) {
    if (typeof window.showToast === 'function') {
      window.showToast('info', message, duration);
    } else {
      console.log('Info:', message);
    }
  };
  
  // Helper functions
  window.getBadgeColor = function(level) {
    if (!level) return 'secondary';
    switch (level.toLowerCase()) {
      case 'beginner': return 'success';
      case 'intermediate': return 'warning';
      case 'advanced': return 'danger';
      default: return 'secondary';
    }
  };
  
  window.capitalize = function(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
  };
  
  // Test and verify the global functions
  console.log('📢 Testing global functions:');
  console.log('- window.appState exists:', !!window.appState);
  console.log('- window.fetchCourses exists:', typeof window.fetchCourses === 'function');
  console.log('- window.showSuccessToast exists:', typeof window.showSuccessToast === 'function');
  console.log('▶️ Global initialization complete');
})();