/**
 * Custom React hook for Clerk authentication
 * Provides access to authentication state and methods
 * Created by Chakridhar
 */
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useAuth as useClerk, useUser } from '@clerk/nextjs';
import { useToast } from './use-toast';

// Create session storage key for persistent data
const USER_DATA_STORAGE_KEY = 'educrafters_user_data';
const USER_ROLE_STORAGE_KEY = 'educrafters_user_role';
const SESSION_TOKEN_STORAGE_KEY = 'educrafters_session_token';

const ClerkAuthContext = createContext();

export const ClerkAuthProvider = ({ children }) => {
  const { isLoaded, userId, sessionId, getToken, signOut } = useClerk();
  const { user, isLoaded: userLoaded } = useUser();
  const [isSignedIn, setIsSignedIn] = useState(false);
  const { toast } = useToast();
  
  // Initialize state from sessionStorage if available
  const [userRole, setUserRole] = useState(() => {
    const storedRole = sessionStorage.getItem(USER_ROLE_STORAGE_KEY);
    return storedRole ? storedRole : null;
  });
  
  const [userData, setUserData] = useState(() => {
    const storedData = sessionStorage.getItem(USER_DATA_STORAGE_KEY);
    return storedData ? JSON.parse(storedData) : null;
  });
  
  const [authToken, setAuthToken] = useState(() => {
    return sessionStorage.getItem(SESSION_TOKEN_STORAGE_KEY) || null;
  });
  
  // Update signed in state whenever userId changes
  useEffect(() => {
    const newSignedInState = !!userId;
    setIsSignedIn(newSignedInState);
    
    // If user signs out, clear session storage
    if (!newSignedInState) {
      sessionStorage.removeItem(USER_DATA_STORAGE_KEY);
      sessionStorage.removeItem(USER_ROLE_STORAGE_KEY);
      sessionStorage.removeItem(SESSION_TOKEN_STORAGE_KEY);
      setUserRole(null);
      setUserData(null);
      setAuthToken(null);
    }
  }, [userId]);

  // Persist token to session storage and refresh it periodically
  useEffect(() => {
    const refreshToken = async () => {
      if (isSignedIn && userId) {
        try {
          const token = await getToken();
          setAuthToken(token);
          sessionStorage.setItem(SESSION_TOKEN_STORAGE_KEY, token);
        } catch (error) {
          console.error('Error refreshing token:', error);
        }
      }
    };
    
    // Refresh token immediately
    refreshToken();
    
    // Set up token refresh interval (every 10 minutes)
    const tokenRefreshInterval = setInterval(refreshToken, 10 * 60 * 1000);
    
    return () => {
      clearInterval(tokenRefreshInterval);
    };
  }, [isSignedIn, userId, getToken]);

  // Fetch user data from our API and persist to session storage
  useEffect(() => {
    const fetchUserData = async () => {
      if (isSignedIn && userId && authToken) {
        try {
          const response = await fetch('/api/auth/me', {
            headers: {
              'Authorization': `Bearer ${authToken}`
            }
          });
          
          if (response.ok) {
            const data = await response.json();
            
            // Save to state
            setUserData(data);
            setUserRole(data.role);
            
            // Persist to session storage
            sessionStorage.setItem(USER_DATA_STORAGE_KEY, JSON.stringify(data));
            sessionStorage.setItem(USER_ROLE_STORAGE_KEY, data.role);
            
            // Show success toast
            toast({
              title: "Welcome back!",
              description: `You are logged in as ${data.name || 'a user'}`,
              variant: "success",
              duration: 3000
            });
          } else {
            console.error('Failed to fetch user data');
            // Clear potentially stale session data
            sessionStorage.removeItem(USER_DATA_STORAGE_KEY);
            sessionStorage.removeItem(USER_ROLE_STORAGE_KEY);
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
        }
      }
    };

    fetchUserData();
  }, [isSignedIn, userId, authToken, toast]);

  // Create a memoized logout function
  const logout = useCallback(async () => {
    try {
      // Clear session storage first
      sessionStorage.removeItem(USER_DATA_STORAGE_KEY);
      sessionStorage.removeItem(USER_ROLE_STORAGE_KEY);
      sessionStorage.removeItem(SESSION_TOKEN_STORAGE_KEY);
      
      // Then sign out from Clerk
      await signOut();
      
      // Update local state
      setUserRole(null);
      setUserData(null);
      setAuthToken(null);
      setIsSignedIn(false);
      
      // Show success message
      toast({
        title: "Logged out",
        description: "You have been successfully logged out.",
        variant: "info",
      });
    } catch (error) {
      toast({
        title: "Logout failed",
        description: error.message || "Unexpected error during logout",
        variant: "destructive",
      });
    }
  }, [signOut, toast]);

  // Create a memoized function to get authentication token
  const getAuthToken = useCallback(async () => {
    // Use cached token if available
    if (authToken) {
      return authToken;
    }
    
    // Get fresh token from Clerk if not cached
    if (isLoaded && userId) {
      try {
        const token = await getToken();
        setAuthToken(token);
        sessionStorage.setItem(SESSION_TOKEN_STORAGE_KEY, token);
        return token;
      } catch (error) {
        console.error('Error getting auth token:', error);
        return null;
      }
    }
    
    return null;
  }, [isLoaded, userId, getToken, authToken]);

  // Value object to be provided through the context
  const value = {
    isLoaded: isLoaded && userLoaded,
    isSignedIn,
    user,
    userData,
    userId,
    sessionId,
    logout,
    getAuthToken,
    isInstructor: userRole === 'instructor',
    isStudent: userRole === 'student',
    isAdmin: userRole === 'admin',
    role: userRole,
    // Convenient properties for role checking
    isAuthenticated: isSignedIn,
  };

  return (
    <ClerkAuthContext.Provider value={value}>
      {children}
    </ClerkAuthContext.Provider>
  );
};

export const useClerkAuth = () => {
  const context = useContext(ClerkAuthContext);
  if (context === undefined) {
    throw new Error('useClerkAuth must be used within a ClerkAuthProvider');
  }
  return context;
};