/**
 * User Settings Component
 * Created by Chakridhar - April 2025
 * 
 * Allows users to manage account settings, preferences, and notifications
 */

import React, { useState, useEffect } from 'react';
import { useClerkAuth } from '../hooks/useClerkAuth';
import { useToast } from '../hooks/use-toast';

const UserSettings = () => {
  const { user, isLoading, updateUserSettings } = useClerkAuth();
  const { toast } = useToast();
  
  // Form state for account settings
  const [accountSettings, setAccountSettings] = useState({
    language: 'en',
    timezone: 'UTC',
    darkMode: false
  });
  
  // Form state for notification settings
  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    courseUpdates: true,
    newCourses: true,
    promotions: false,
    accountAlerts: true
  });
  
  // Privacy settings
  const [privacySettings, setPrivacySettings] = useState({
    showProfile: true,
    showProgress: true,
    showEnrollments: false
  });
  
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('account');
  
  // Load user settings when component mounts
  useEffect(() => {
    if (user && user.settings) {
      // Account settings
      if (user.settings.account) {
        setAccountSettings({
          language: user.settings.account.language || 'en',
          timezone: user.settings.account.timezone || 'UTC',
          darkMode: user.settings.account.darkMode || false
        });
      }
      
      // Notification settings
      if (user.settings.notifications) {
        setNotificationSettings({
          emailNotifications: user.settings.notifications.emailNotifications ?? true,
          courseUpdates: user.settings.notifications.courseUpdates ?? true,
          newCourses: user.settings.notifications.newCourses ?? true,
          promotions: user.settings.notifications.promotions ?? false,
          accountAlerts: user.settings.notifications.accountAlerts ?? true
        });
      }
      
      // Privacy settings
      if (user.settings.privacy) {
        setPrivacySettings({
          showProfile: user.settings.privacy.showProfile ?? true,
          showProgress: user.settings.privacy.showProgress ?? true,
          showEnrollments: user.settings.privacy.showEnrollments ?? false
        });
      }
    }
  }, [user]);
  
  // Handle account settings changes
  const handleAccountChange = (e) => {
    const { name, value, type, checked } = e.target;
    setAccountSettings(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };
  
  // Handle notification settings changes
  const handleNotificationChange = (e) => {
    const { name, checked } = e.target;
    setNotificationSettings(prev => ({
      ...prev,
      [name]: checked
    }));
  };
  
  // Handle privacy settings changes
  const handlePrivacyChange = (e) => {
    const { name, checked } = e.target;
    setPrivacySettings(prev => ({
      ...prev,
      [name]: checked
    }));
  };
  
  // Handle saving settings
  const saveSettings = async () => {
    try {
      setIsSaving(true);
      
      // Combine all settings
      const settings = {
        account: accountSettings,
        notifications: notificationSettings,
        privacy: privacySettings
      };
      
      // Call API to update settings
      await updateUserSettings(settings);
      
      toast({
        title: 'Settings Saved',
        description: 'Your settings have been updated successfully',
        variant: 'success'
      });
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        title: 'Save Failed',
        description: error.message || 'Could not save settings',
        variant: 'error'
      });
    } finally {
      setIsSaving(false);
    }
  };
  
  if (isLoading) {
    return (
      <div className="p-4 text-center">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }
  
  if (!user) {
    return (
      <div className="p-4 text-center">
        <p className="text-muted">Please sign in to manage your settings</p>
      </div>
    );
  }
  
  return (
    <div className="user-settings">
      <div className="card">
        <div className="card-header bg-light">
          <ul className="nav nav-tabs card-header-tabs">
            <li className="nav-item">
              <button 
                className={`nav-link ${activeTab === 'account' ? 'active' : ''}`}
                onClick={() => setActiveTab('account')}
              >
                Account
              </button>
            </li>
            <li className="nav-item">
              <button 
                className={`nav-link ${activeTab === 'notifications' ? 'active' : ''}`}
                onClick={() => setActiveTab('notifications')}
              >
                Notifications
              </button>
            </li>
            <li className="nav-item">
              <button 
                className={`nav-link ${activeTab === 'privacy' ? 'active' : ''}`}
                onClick={() => setActiveTab('privacy')}
              >
                Privacy
              </button>
            </li>
          </ul>
        </div>
        
        <div className="card-body">
          {/* Account Settings */}
          {activeTab === 'account' && (
            <div>
              <h5 className="card-title mb-4">Account Settings</h5>
              
              <div className="mb-3">
                <label htmlFor="language" className="form-label">Language</label>
                <select 
                  className="form-select" 
                  id="language" 
                  name="language" 
                  value={accountSettings.language}
                  onChange={handleAccountChange}
                >
                  <option value="en">English</option>
                  <option value="es">Spanish</option>
                  <option value="fr">French</option>
                  <option value="de">German</option>
                  <option value="ja">Japanese</option>
                  <option value="zh">Chinese</option>
                </select>
              </div>
              
              <div className="mb-3">
                <label htmlFor="timezone" className="form-label">Timezone</label>
                <select 
                  className="form-select" 
                  id="timezone" 
                  name="timezone" 
                  value={accountSettings.timezone}
                  onChange={handleAccountChange}
                >
                  <option value="UTC">UTC</option>
                  <option value="EST">Eastern Time (EST)</option>
                  <option value="CST">Central Time (CST)</option>
                  <option value="MST">Mountain Time (MST)</option>
                  <option value="PST">Pacific Time (PST)</option>
                  <option value="IST">India Standard Time (IST)</option>
                  <option value="GMT">Greenwich Mean Time (GMT)</option>
                </select>
              </div>
              
              <div className="form-check form-switch mb-3">
                <input 
                  className="form-check-input" 
                  type="checkbox" 
                  id="darkMode" 
                  name="darkMode"
                  checked={accountSettings.darkMode}
                  onChange={handleAccountChange}
                />
                <label className="form-check-label" htmlFor="darkMode">
                  Dark Mode
                </label>
              </div>
              
              <hr className="my-4" />
              
              <h5 className="mb-3">Security</h5>
              
              <button className="btn btn-outline-primary mb-3">
                Change Password
              </button>
              
              <div>
                <button className="btn btn-outline-danger">
                  Delete Account
                </button>
                <p className="small text-muted mt-1">
                  This action cannot be undone. All your data will be permanently deleted.
                </p>
              </div>
            </div>
          )}
          
          {/* Notification Settings */}
          {activeTab === 'notifications' && (
            <div>
              <h5 className="card-title mb-4">Notification Settings</h5>
              
              <div className="form-check form-switch mb-3">
                <input 
                  className="form-check-input" 
                  type="checkbox" 
                  id="emailNotifications" 
                  name="emailNotifications"
                  checked={notificationSettings.emailNotifications}
                  onChange={handleNotificationChange}
                />
                <label className="form-check-label" htmlFor="emailNotifications">
                  Email Notifications
                </label>
                <div className="text-muted small">Master toggle for all email notifications</div>
              </div>
              
              <hr />
              
              <div className="form-check form-switch mb-3">
                <input 
                  className="form-check-input" 
                  type="checkbox" 
                  id="courseUpdates" 
                  name="courseUpdates"
                  checked={notificationSettings.courseUpdates}
                  onChange={handleNotificationChange}
                  disabled={!notificationSettings.emailNotifications}
                />
                <label className="form-check-label" htmlFor="courseUpdates">
                  Course Updates
                </label>
                <div className="text-muted small">Receive notifications when your enrolled courses are updated</div>
              </div>
              
              <div className="form-check form-switch mb-3">
                <input 
                  className="form-check-input" 
                  type="checkbox" 
                  id="newCourses" 
                  name="newCourses"
                  checked={notificationSettings.newCourses}
                  onChange={handleNotificationChange}
                  disabled={!notificationSettings.emailNotifications}
                />
                <label className="form-check-label" htmlFor="newCourses">
                  New Courses
                </label>
                <div className="text-muted small">Receive notifications about new course releases</div>
              </div>
              
              <div className="form-check form-switch mb-3">
                <input 
                  className="form-check-input" 
                  type="checkbox" 
                  id="promotions" 
                  name="promotions"
                  checked={notificationSettings.promotions}
                  onChange={handleNotificationChange}
                  disabled={!notificationSettings.emailNotifications}
                />
                <label className="form-check-label" htmlFor="promotions">
                  Promotions & Discounts
                </label>
                <div className="text-muted small">Receive promotional emails and special offers</div>
              </div>
              
              <div className="form-check form-switch mb-3">
                <input 
                  className="form-check-input" 
                  type="checkbox" 
                  id="accountAlerts" 
                  name="accountAlerts"
                  checked={notificationSettings.accountAlerts}
                  onChange={handleNotificationChange}
                  disabled={!notificationSettings.emailNotifications}
                />
                <label className="form-check-label" htmlFor="accountAlerts">
                  Account Alerts
                </label>
                <div className="text-muted small">Receive important account-related notifications</div>
              </div>
            </div>
          )}
          
          {/* Privacy Settings */}
          {activeTab === 'privacy' && (
            <div>
              <h5 className="card-title mb-4">Privacy Settings</h5>
              
              <div className="form-check form-switch mb-3">
                <input 
                  className="form-check-input" 
                  type="checkbox" 
                  id="showProfile" 
                  name="showProfile"
                  checked={privacySettings.showProfile}
                  onChange={handlePrivacyChange}
                />
                <label className="form-check-label" htmlFor="showProfile">
                  Public Profile
                </label>
                <div className="text-muted small">Allow other users to view your profile information</div>
              </div>
              
              <div className="form-check form-switch mb-3">
                <input 
                  className="form-check-input" 
                  type="checkbox" 
                  id="showProgress" 
                  name="showProgress"
                  checked={privacySettings.showProgress}
                  onChange={handlePrivacyChange}
                />
                <label className="form-check-label" htmlFor="showProgress">
                  Share Course Progress
                </label>
                <div className="text-muted small">Allow other users to see your course progress</div>
              </div>
              
              <div className="form-check form-switch mb-3">
                <input 
                  className="form-check-input" 
                  type="checkbox" 
                  id="showEnrollments" 
                  name="showEnrollments"
                  checked={privacySettings.showEnrollments}
                  onChange={handlePrivacyChange}
                />
                <label className="form-check-label" htmlFor="showEnrollments">
                  Share Enrollments
                </label>
                <div className="text-muted small">Allow other users to see which courses you're enrolled in</div>
              </div>
              
              <hr className="my-4" />
              
              <h5 className="mb-3">Data & Cookies</h5>
              
              <p className="text-muted mb-3">
                We use cookies and similar technologies to improve your experience on our platform.
                You can manage your cookie preferences below.
              </p>
              
              <button className="btn btn-outline-secondary mb-3">
                Manage Cookie Preferences
              </button>
              
              <div className="mt-3">
                <button className="btn btn-outline-primary">
                  Download Your Data
                </button>
                <p className="small text-muted mt-1">
                  Download a copy of all data associated with your account.
                </p>
              </div>
            </div>
          )}
          
          <div className="mt-4 text-end">
            <button 
              className="btn btn-primary"
              onClick={saveSettings}
              disabled={isSaving}
            >
              {isSaving ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  Saving...
                </>
              ) : 'Save Settings'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserSettings;