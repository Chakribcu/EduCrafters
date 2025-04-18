
// Created by Chakridhar

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuthState } from '../utils/auth';
import { useToast } from '../hooks/use-toast';

// Create context with default values
const AuthContext = createContext({
  user: null,
  token: null,
  isAuthenticated: false,
  isInstructor: false,
  isStudent: false,
  loading: true,
  login: () => {},
  logout: () => {},
  updateUser: () => {}
});

// Provider component that wraps the app
export const AuthProvider = ({ children }) => {
  const { 
    user, 
    token, 
    isAuthenticated, 
    isInstructor, 
    isStudent, 
    isAdmin,
    loading, 
    login: authLogin, 
    logout: authLogout 
  } = useAuthState();
  
  const { toast } = useToast();
  const [initialized, setInitialized] = useState(false);

  // Function to handle login
  const login = (token, user) => {
    authLogin(token, user);
    
    toast({
      title: 'Welcome back!',
      description: `You've successfully logged in as ${user.username}`,
      variant: 'success',
    });
  };

  // Function to handle logout
  const logout = () => {
    authLogout();
    
    toast({
      title: 'Logged out',
      description: 'Your session has ended. See you soon!',
      variant: 'default',
    });
    
    // Redirect to home page after logout
    window.location.href = '/';
  };

  // Function to update user data
  const updateUser = (userData) => {
    if (user && userData) {
      const updatedUser = { ...user, ...userData };
      authLogin(token, updatedUser);
    }
  };

  // Verify token on initial load
  useEffect(() => {
    const verifySession = async () => {
      if (token && !initialized) {
        try {
          // Make a request to verify the token
          const response = await fetch('/api/auth/verify', {
            headers: {
              Authorization: `Bearer ${token}`
            }
          });
          
          if (!response.ok) {
            console.log('Session expired, logging out');
            authLogout();
          }
        } catch (error) {
          console.error('Error verifying token:', error);
        } finally {
          setInitialized(true);
        }
      } else {
        setInitialized(true);
      }
    };
    
    verifySession();
  }, [token, initialized, authLogout]);

  // The value that will be provided to consumers
  const value = {
    user,
    token,
    isAuthenticated,
    isInstructor,
    isStudent,
    isAdmin,
    loading: loading || !initialized,
    login,
    logout,
    updateUser
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook for components to get and use the auth context
export const useAuth = () => useContext(AuthContext);