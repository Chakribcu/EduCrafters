// Protected Route Component
// Created by Chakridhar - Controls access to protected pages based on authentication and user roles

import React from 'react';
import { Route, Redirect } from 'wouter';
import { useClerkAuth } from '../hooks/useClerkAuth';
import { useToast } from '../hooks/use-toast';

const ProtectedRoute = ({ component: Component, roles = [], ...rest }) => {
  const { isAuthenticated, isLoaded, userData, userRole } = useClerkAuth();
  const { toast } = useToast();
  const isLoading = !isLoaded;
  
  // If still loading auth state, show loading spinner
  if (isLoading) {
    return (
      <div className="container py-5 text-center">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-3">Verifying access...</p>
      </div>
    );
  }
  
  // Check if user is authenticated
  if (!isAuthenticated) {
    // Show toast notification for unauthorized access
    toast({
      title: 'Authentication Required',
      description: 'Please sign in to access this page',
      variant: 'warning',
    });
    
    // Redirect to login page
    return <Redirect to="/auth/sign-in" />;
  }
  
  // Check if user has required role (if roles are specified)
  if (roles.length > 0 && !roles.includes(userRole)) {
    // Show toast notification for insufficient permissions
    toast({
      title: 'Access Denied',
      description: `You don't have permission to access this page`,
      variant: 'error',
    });
    
    // Redirect to home page
    return <Redirect to="/" />;
  }
  
  // User is authenticated and has required role, render the component
  return <Component {...rest} />;
};

export default ProtectedRoute;