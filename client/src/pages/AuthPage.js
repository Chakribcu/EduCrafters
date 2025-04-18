import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/contexts/AuthContext';
import OtpVerification from '@/components/OtpVerification';
import ForgotPassword from '@/components/ForgotPassword';

const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState('student');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  
  const { login, register, requiresOtp, pendingOtpVerification, verifyOtp, resendOtp, cancelOtpVerification, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  
  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated()) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      if (isLogin) {
        await login(email, password);
      } else {
        await register(name, email, password, role);
      }
    } catch (error) {
      setError(error.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };
  
  const handleOtpVerify = async (code) => {
    try {
      await verifyOtp(code);
    } catch (error) {
      throw error;
    }
  };
  
  const handleOtpResend = async () => {
    try {
      await resendOtp();
    } catch (error) {
      throw error;
    }
  };
  
  const handleOtpCancel = () => {
    cancelOtpVerification();
  };
  
  const handleForgotPassword = async (data) => {
    setShowForgotPassword(false);
  };
  
  // Render OTP verification if required
  if (requiresOtp && pendingOtpVerification) {
    return (
      <div className="container py-5">
        <div className="row justify-content-center">
          <div className="col-md-6">
            <div className="card border-0 shadow-sm">
              <div className="card-body p-4">
                <OtpVerification 
                  onVerify={handleOtpVerify}
                  onResend={handleOtpResend}
                  onCancel={handleOtpCancel}
                  email={pendingOtpVerification.email}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  // Render forgot password if needed
  if (showForgotPassword) {
    return (
      <div className="container py-5">
        <div className="row justify-content-center">
          <div className="col-md-6">
            <div className="card border-0 shadow-sm">
              <div className="card-body p-4">
                <ForgotPassword 
                  onSubmit={handleForgotPassword}
                  onCancel={() => setShowForgotPassword(false)}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container-fluid py-5">
      <div className="row">
        {/* Auth Form Column */}
        <div className="col-md-5">
          <div className="card border-0 shadow-sm mx-auto" style={{ maxWidth: '450px' }}>
            <div className="card-body p-4">
              <h1 className="text-center mb-4">
                {isLogin ? 'Welcome Back' : 'Create an Account'}
              </h1>
              
              {error && (
                <div className="alert alert-danger" role="alert">
                  {error}
                </div>
              )}
              
              <form onSubmit={handleSubmit}>
                {!isLogin && (
                  <div className="mb-3">
                    <label htmlFor="name" className="form-label">Full Name</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      id="name" 
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                    />
                  </div>
                )}
                
                <div className="mb-3">
                  <label htmlFor="email" className="form-label">Email address</label>
                  <input 
                    type="email" 
                    className="form-control" 
                    id="email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                
                <div className="mb-3">
                  <label htmlFor="password" className="form-label">Password</label>
                  <input 
                    type="password" 
                    className="form-control" 
                    id="password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                
                {!isLogin && (
                  <div className="mb-3">
                    <label htmlFor="role" className="form-label">Account Type</label>
                    <select 
                      className="form-select" 
                      id="role"
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                      required
                    >
                      <option value="student">Student</option>
                      <option value="instructor">Instructor</option>
                    </select>
                  </div>
                )}
                
                {isLogin && (
                  <div className="mb-3 text-end">
                    <button 
                      type="button" 
                      className="btn btn-link p-0 text-decoration-none"
                      onClick={() => setShowForgotPassword(true)}
                    >
                      Forgot password?
                    </button>
                  </div>
                )}
                
                <div className="d-grid mb-3">
                  <button 
                    type="submit" 
                    className="btn btn-primary"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        {isLogin ? 'Signing In...' : 'Creating Account...'}
                      </>
                    ) : (
                      isLogin ? 'Sign In' : 'Create Account'
                    )}
                  </button>
                </div>
                
                <div className="text-center">
                  <button 
                    type="button" 
                    className="btn btn-link text-decoration-none"
                    onClick={() => setIsLogin(!isLogin)}
                  >
                    {isLogin ? 'Need an account? Sign up' : 'Already have an account? Sign in'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
        
        {/* Hero Column */}
        <div className="col-md-7 d-none d-md-block">
          <div className="h-100 d-flex flex-column justify-content-center px-4">
            <h2 className="display-4 fw-bold mb-4">
              {isLogin 
                ? 'Welcome back to EduCrafters' 
                : 'Join the EduCrafters Learning Community'}
            </h2>
            <p className="lead mb-4">
              {isLogin
                ? 'Sign in to access your courses, track your progress, and continue your learning journey.'
                : 'Create an account to explore thousands of courses, learn from experts, and acquire skills that matter.'
              }
            </p>
            <div className="row g-4 mt-3">
              <div className="col-md-6">
                <div className="d-flex align-items-center">
                  <span className="material-icons text-primary me-3 fs-2">menu_book</span>
                  <div>
                    <h5 className="mb-1">Quality Content</h5>
                    <p className="text-muted mb-0">Learn from industry experts</p>
                  </div>
                </div>
              </div>
              <div className="col-md-6">
                <div className="d-flex align-items-center">
                  <span className="material-icons text-primary me-3 fs-2">workspace_premium</span>
                  <div>
                    <h5 className="mb-1">Certificates</h5>
                    <p className="text-muted mb-0">Earn recognized credentials</p>
                  </div>
                </div>
              </div>
              <div className="col-md-6">
                <div className="d-flex align-items-center">
                  <span className="material-icons text-primary me-3 fs-2">devices</span>
                  <div>
                    <h5 className="mb-1">Learn Anywhere</h5>
                    <p className="text-muted mb-0">Access on any device</p>
                  </div>
                </div>
              </div>
              <div className="col-md-6">
                <div className="d-flex align-items-center">
                  <span className="material-icons text-primary me-3 fs-2">forum</span>
                  <div>
                    <h5 className="mb-1">Community</h5>
                    <p className="text-muted mb-0">Connect with other learners</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;