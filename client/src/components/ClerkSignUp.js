/**
 * ClerkSignUp.js
 * Component for the Clerk Sign-Up UI
 */
import React from 'react';
import { SignUp } from '@clerk/nextjs';

const ClerkSignUpComponent = () => {
  return (
    <div className="container">
      <div className="row justify-content-center py-5">
        <div className="col-md-6">
          <div className="card shadow-sm">
            <div className="card-body">
              <h2 className="text-center mb-4">Create an Account</h2>
              <SignUp
                path="/auth/sign-up"
                routing="path"
                signInUrl="/auth/sign-in"
                redirectUrl="/"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClerkSignUpComponent;