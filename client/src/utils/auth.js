// Authentication utilities for educrafters
// Created by Chakridhar

import { useEffect, useState } from 'react';

// Store auth token in localStorage
const TOKEN_KEY = 'educrafters_auth_token';
const USER_KEY = 'educrafters_user';

// Save auth token and user data
export const saveAuth = (token, user) => {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  }
  if (user) {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  }
};

// Clear auth data on logout
export const clearAuth = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
};

// Get stored auth token
export const getToken = () => {
  return localStorage.getItem(TOKEN_KEY);
};

// Get stored user data
export const getUser = () => {
  const userData = localStorage.getItem(USER_KEY);
  return userData ? JSON.parse(userData) : null;
};

// Custom hook for managing auth state
export const useAuthState = () => {
  const [user, setUser] = useState(getUser());
  const [token, setToken] = useState(getToken());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for stored user data on mount
    const storedToken = getToken();
    const storedUser = getUser();

    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(storedUser);
    }
    
    setLoading(false);
  }, []);

  const login = (newToken, newUser) => {
    saveAuth(newToken, newUser);
    setToken(newToken);
    setUser(newUser);
  };

  const logout = () => {
    clearAuth();
    setToken(null);
    setUser(null);
  };

  return {
    user,
    token,
    isAuthenticated: !!token && !!user,
    isInstructor: user?.role === 'instructor',
    isStudent: user?.role === 'student',
    isAdmin: user?.role === 'admin',
    loading,
    login,
    logout
  };
};

// Helper function to check if token is expired
export const isTokenExpired = (token) => {
  if (!token) return true;
  
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const exp = payload.exp * 1000; // Convert to milliseconds
    return Date.now() > exp;
  } catch (e) {
    return true;
  }
};

// Function to create auth header for API requests
export const authHeader = () => {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};