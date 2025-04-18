/**
 * User Profile Page
 * Created by Chakridhar - April 2025
 * 
 * Displays user profile information and settings with tabs for different sections
 */

import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { useClerkAuth } from '../hooks/useClerkAuth';
import UserProfile from '../components/UserProfile';
import UserSettings from '../components/UserSettings';

const ProfilePage = () => {
  const { user, isLoading, isAuthenticated, userRole } = useClerkAuth();
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState('profile');
  
  // Redirect to login if not authenticated
  if (!isLoading && !isAuthenticated) {
    setLocation('/auth/sign-in');
    return null;
  }
  
  // Handle loading state
  if (isLoading) {
    return (
      <div className="py-16 bg-neutral-50 flex-grow flex justify-center items-center">
        <div className="animate-spin w-12 h-12 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }
  
  // Get dashboard URL based on role
  const getDashboardUrl = () => {
    if (userRole === 'instructor') {
      return '/instructor/dashboard';
    } else if (userRole === 'admin') {
      return '/admin/dashboard';
    } else {
      return '/dashboard';
    }
  };
  
  return (
    <div className="py-16 bg-neutral-50 flex-grow fade-in">
      <div className="container mx-auto px-4">
        <div className="mb-6">
          <button 
            className="btn btn-outline-secondary mb-4"
            onClick={() => setLocation(getDashboardUrl())}
          >
            <i className="bi bi-arrow-left me-2"></i>
            Back to Dashboard
          </button>
          
          <h1 className="text-3xl font-bold">Your Account</h1>
          <p className="text-neutral-600">
            Manage your profile information and account settings
          </p>
        </div>
        
        <div className="row gx-5">
          {/* Sidebar */}
          <div className="col-md-3 mb-4">
            <div className="card card-shadow">
              <div className="card-body p-0">
                <div className="list-group list-group-flush rounded-2">
                  <button
                    className={`list-group-item list-group-item-action ${
                      activeTab === 'profile' ? 'active' : ''
                    }`}
                    onClick={() => setActiveTab('profile')}
                  >
                    <i className="bi bi-person-circle me-2"></i> Profile
                  </button>
                  <button
                    className={`list-group-item list-group-item-action ${
                      activeTab === 'settings' ? 'active' : ''
                    }`}
                    onClick={() => setActiveTab('settings')}
                  >
                    <i className="bi bi-gear-fill me-2"></i> Settings
                  </button>
                  <button
                    className={`list-group-item list-group-item-action ${
                      activeTab === 'billing' ? 'active' : ''
                    }`}
                    onClick={() => setActiveTab('billing')}
                  >
                    <i className="bi bi-credit-card me-2"></i> Billing & Payments
                  </button>
                  {userRole === 'instructor' && (
                    <button
                      className={`list-group-item list-group-item-action ${
                        activeTab === 'instructor' ? 'active' : ''
                      }`}
                      onClick={() => setActiveTab('instructor')}
                    >
                      <i className="bi bi-easel me-2"></i> Instructor Settings
                    </button>
                  )}
                  <button
                    className={`list-group-item list-group-item-action text-danger`}
                    onClick={() => {
                      // Show confirmation dialog
                      if (window.confirm('Are you sure you want to log out?')) {
                        // Handle logout
                      }
                    }}
                  >
                    <i className="bi bi-box-arrow-right me-2"></i> Logout
                  </button>
                </div>
              </div>
            </div>
            
            <div className="card mt-4 card-shadow bg-primary text-white">
              <div className="card-body">
                <div className="d-flex align-items-center mb-3">
                  <div className="fs-1 me-3">
                    <i className="bi bi-shield-check"></i>
                  </div>
                  <div>
                    <h5 className="card-title mb-0">Account Status</h5>
                    <span className="badge bg-light text-primary">Active</span>
                  </div>
                </div>
                <p className="card-text small">
                  Your account is in good standing. You have access to all features.
                </p>
              </div>
            </div>
          </div>
          
          {/* Main Content */}
          <div className="col-md-9">
            {activeTab === 'profile' && <UserProfile />}
            {activeTab === 'settings' && <UserSettings />}
            {activeTab === 'billing' && (
              <div className="card card-shadow">
                <div className="card-header bg-light">
                  <h5 className="card-title mb-0">Billing & Payment Information</h5>
                </div>
                <div className="card-body">
                  <div className="alert alert-info">
                    <div className="d-flex">
                      <div className="fs-4 me-3">
                        <i className="bi bi-info-circle"></i>
                      </div>
                      <div>
                        <h5 className="alert-heading">Payment Methods</h5>
                        <p className="mb-0">
                          Manage your payment methods and view your transaction history.
                          This feature will be available soon.
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <h5 className="mb-3">Purchase History</h5>
                  
                  {user?.purchases?.length > 0 ? (
                    <div className="table-responsive">
                      <table className="table table-hover">
                        <thead>
                          <tr>
                            <th>Date</th>
                            <th>Description</th>
                            <th>Amount</th>
                            <th>Status</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {user.purchases.map((purchase, index) => (
                            <tr key={index}>
                              <td>{new Date(purchase.date).toLocaleDateString()}</td>
                              <td>{purchase.description}</td>
                              <td>£{purchase.amount.toFixed(2)}</td>
                              <td>
                                <span className={`badge ${
                                  purchase.status === 'completed' ? 'bg-success' : 
                                  purchase.status === 'pending' ? 'bg-warning' : 'bg-danger'
                                }`}>
                                  {purchase.status}
                                </span>
                              </td>
                              <td>
                                <button className="btn btn-sm btn-outline-primary">
                                  View Receipt
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-5">
                      <div className="fs-1 text-muted mb-3">
                        <i className="bi bi-receipt"></i>
                      </div>
                      <h5>No Purchases Yet</h5>
                      <p className="text-muted">You haven't made any purchases yet.</p>
                      <button 
                        className="btn btn-primary"
                        onClick={() => setLocation('/courses')}
                      >
                        Browse Courses
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {activeTab === 'instructor' && userRole === 'instructor' && (
              <div className="card card-shadow">
                <div className="card-header bg-light">
                  <h5 className="card-title mb-0">Instructor Settings</h5>
                </div>
                <div className="card-body">
                  <h5 className="mb-3">Instructor Profile</h5>
                  
                  <div className="mb-3">
                    <label htmlFor="instructorBio" className="form-label">Professional Bio</label>
                    <textarea 
                      className="form-control" 
                      id="instructorBio"
                      rows="4"
                      placeholder="Share your expertise, experience, and teaching philosophy"
                    ></textarea>
                    <small className="text-muted">This will be displayed on your instructor profile and course pages.</small>
                  </div>
                  
                  <div className="mb-3">
                    <label htmlFor="expertise" className="form-label">Areas of Expertise</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      id="expertise"
                      placeholder="e.g., Web Development, Data Science, Business Strategy"
                    />
                    <small className="text-muted">Enter your areas of expertise separated by commas.</small>
                  </div>
                  
                  <hr className="my-4" />
                  
                  <h5 className="mb-3">Payout Settings</h5>
                  
                  <div className="alert alert-warning">
                    <i className="bi bi-exclamation-triangle-fill me-2"></i>
                    Please complete your payout information to receive earnings from your courses.
                  </div>
                  
                  <button className="btn btn-primary">
                    Set Up Payout Method
                  </button>
                  
                  <hr className="my-4" />
                  
                  <div className="d-grid">
                    <button className="btn btn-success">
                      Save Instructor Settings
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;