
import React from 'react';
import { SignIn } from '@clerk/nextjs';

const ClerkSignInComponent = () => {
  return (
    <div className="container">
      <div className="row justify-content-center py-5">
        <div className="col-md-6">
          <div className="card shadow-sm">
            <div className="card-body">
              <h2 className="text-center mb-4">Sign In to EduCrafters</h2>
              <SignIn
                path="/auth/sign-in"
                routing="path"
                signUpUrl="/auth/sign-up"
                redirectUrl="/"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClerkSignInComponent;