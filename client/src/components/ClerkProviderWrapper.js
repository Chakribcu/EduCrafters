/**
 * ClerkProviderWrapper.js
 * This component wraps the application with Clerk authentication provider
 */
import React from 'react';
import { ClerkProvider } from '@clerk/nextjs';

const ClerkProviderWrapper = ({ children }) => {
  /**
   * Clerk appearance configuration with Bootstrap styling
   */
  const appearance = {
    elements: {
      formButtonPrimary: 'btn btn-primary',
      formFieldInput: 'form-control',
      card: 'card p-4 shadow-sm',
      footer: 'text-center mt-4',
      navbar: 'd-flex justify-content-between align-items-center py-3',
      userButtonBox: 'd-flex align-items-center',
      userButtonTrigger: 'btn btn-outline-secondary',
    },
    variables: {
      colorPrimary: '#0d6efd',
      colorBackground: '#ffffff',
      fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
    },
    layout: {
      logoPlacement: 'inside',
      logoImageUrl: '/logo.png', // Add your logo here
      showOptionalFields: true,
      socialButtonsPlacement: 'bottom',
      socialButtonsVariant: 'iconButton',
    },
  };

  /**
   * Custom routing configuration for Clerk
   */
  const routing = {
    // The path to your sign-in page
    signInUrl: '/auth/sign-in',
    // The path to your sign-up page
    signUpUrl: '/auth/sign-up',
    // The path to redirect to after a successful sign in
    afterSignInUrl: '/',
    // The path to redirect to after a successful sign up
    afterSignUpUrl: '/',
    // The path to redirect to when a user is signed out
    signOutUrl: '/',
  };

  return (
    <ClerkProvider
      publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || "pk_test_ZmFzdC1ha2l0YS0yOS5jbGVyay5hY2NvdW50cy5kZXYk"}
      appearance={appearance}
      routing={routing}
    >
      {children}
    </ClerkProvider>
  );
};

export default ClerkProviderWrapper;