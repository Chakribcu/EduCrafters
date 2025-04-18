import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLocation } from 'wouter';
import { apiRequest } from '../lib/queryClient';
import { useToast } from '@/hooks/use-toast';

const SettingsPage = () => {
  const { isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // User settings state
  const [settings, setSettings] = useState({
    notifications: {
      emailNotifications: true,
      courseUpdates: true,
      promotions: false,
      newMessages: true,
      enrollmentConfirmation: true
    },
    privacy: {
      showProfileToOthers: true,
      showCourseProgress: true,
      showCompletedCourses: true
    }
  });
  
  useEffect(() => {
    if (!isAuthenticated()) {
      toast({
        title: "Authentication required",
        description: "Please log in to access settings",
        variant: "destructive",
      });
      setLocation('/login');
      return;
    }
    
    // Fetch user settings
    const fetchSettings = async () => {
      try {
        setLoading(true);
        const response = await apiRequest('GET', '/api/user/settings');
        const data = await response.json();
        
        // Merge fetched settings with defaults to ensure all properties exist
        setSettings({
          notifications: {
            emailNotifications: true,
            courseUpdates: true,
            promotions: false,
            newMessages: true,
            enrollmentConfirmation: true,
            ...data.notifications
          },
          privacy: {
            showProfileToOthers: true,
            showCourseProgress: true,
            showCompletedCourses: true,
            ...data.privacy
          }
        });
      } catch (error) {
        console.error('Error fetching settings:', error);
        toast({
          title: "Error",
          description: "Failed to load settings",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchSettings();
  }, [isAuthenticated, setLocation]);
  
  const handleNotificationToggle = (setting) => {
    setSettings({
      ...settings,
      notifications: {
        ...settings.notifications,
        [setting]: !settings.notifications[setting]
      }
    });
  };
  
  const handlePrivacyToggle = (setting) => {
    setSettings({
      ...settings,
      privacy: {
        ...settings.privacy,
        [setting]: !settings.privacy[setting]
      }
    });
  };
  
  const saveSettings = async () => {
    try {
      setSaving(true);
      
      // Convert nested settings to flat key-value pairs
      const flatSettings = {
        'notifications.emailNotifications': settings.notifications.emailNotifications,
        'notifications.courseUpdates': settings.notifications.courseUpdates,
        'notifications.promotions': settings.notifications.promotions,
        'notifications.newMessages': settings.notifications.newMessages,
        'notifications.enrollmentConfirmation': settings.notifications.enrollmentConfirmation,
        'privacy.showProfileToOthers': settings.privacy.showProfileToOthers,
        'privacy.showCourseProgress': settings.privacy.showCourseProgress,
        'privacy.showCompletedCourses': settings.privacy.showCompletedCourses
      };
      
      const response = await apiRequest('PUT', '/api/user/settings', flatSettings);
      
      if (response.ok) {
        toast({
          title: "Success",
          description: "Settings saved successfully",
        });
      } else {
        const error = await response.json();
        throw new Error(error.message || 'Failed to save settings');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to save settings",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };
  
  if (loading) {
    return (
      <div className="py-16 bg-neutral-50 flex-grow flex justify-center items-center">
        <div className="animate-spin w-12 h-12 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }
  
  return (
    <div className="py-16 bg-neutral-50 flex-grow fade-in">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">Account Settings</h1>
          
          {/* Notifications Settings */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden mb-8">
            <div className="p-6 bg-primary text-white">
              <h2 className="text-xl font-bold">Notification Preferences</h2>
              <p>Control which notifications you receive from Educrafters.</p>
            </div>
            
            <div className="p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between py-3 border-b border-gray-100">
                  <div>
                    <h3 className="font-medium">Email Notifications</h3>
                    <p className="text-sm text-neutral-600">Receive general email notifications</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="sr-only peer" 
                      checked={settings.notifications.emailNotifications}
                      onChange={() => handleNotificationToggle('emailNotifications')}
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                </div>
                
                <div className="flex items-center justify-between py-3 border-b border-gray-100">
                  <div>
                    <h3 className="font-medium">Course Updates</h3>
                    <p className="text-sm text-neutral-600">Receive notifications when courses you're enrolled in are updated</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="sr-only peer" 
                      checked={settings.notifications.courseUpdates}
                      onChange={() => handleNotificationToggle('courseUpdates')}
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                </div>
                
                <div className="flex items-center justify-between py-3 border-b border-gray-100">
                  <div>
                    <h3 className="font-medium">Promotional Emails</h3>
                    <p className="text-sm text-neutral-600">Receive promotional offers and discounts</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="sr-only peer" 
                      checked={settings.notifications.promotions}
                      onChange={() => handleNotificationToggle('promotions')}
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                </div>
                
                <div className="flex items-center justify-between py-3 border-b border-gray-100">
                  <div>
                    <h3 className="font-medium">New Messages</h3>
                    <p className="text-sm text-neutral-600">Receive notifications for new messages</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="sr-only peer" 
                      checked={settings.notifications.newMessages}
                      onChange={() => handleNotificationToggle('newMessages')}
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                </div>
                
                <div className="flex items-center justify-between py-3">
                  <div>
                    <h3 className="font-medium">Enrollment Confirmation</h3>
                    <p className="text-sm text-neutral-600">Receive notifications when you enroll in a new course</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="sr-only peer" 
                      checked={settings.notifications.enrollmentConfirmation}
                      onChange={() => handleNotificationToggle('enrollmentConfirmation')}
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                </div>
              </div>
            </div>
          </div>
          
          {/* Privacy Settings */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden mb-8">
            <div className="p-6 bg-neutral-800 text-white">
              <h2 className="text-xl font-bold">Privacy Settings</h2>
              <p>Control what information is visible to others.</p>
            </div>
            
            <div className="p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between py-3 border-b border-gray-100">
                  <div>
                    <h3 className="font-medium">Show Profile to Others</h3>
                    <p className="text-sm text-neutral-600">Allow other users to see your profile information</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="sr-only peer" 
                      checked={settings.privacy.showProfileToOthers}
                      onChange={() => handlePrivacyToggle('showProfileToOthers')}
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                </div>
                
                <div className="flex items-center justify-between py-3 border-b border-gray-100">
                  <div>
                    <h3 className="font-medium">Show Course Progress</h3>
                    <p className="text-sm text-neutral-600">Allow others to see your progress in courses</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="sr-only peer" 
                      checked={settings.privacy.showCourseProgress}
                      onChange={() => handlePrivacyToggle('showCourseProgress')}
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                </div>
                
                <div className="flex items-center justify-between py-3">
                  <div>
                    <h3 className="font-medium">Show Completed Courses</h3>
                    <p className="text-sm text-neutral-600">Allow others to see courses you've completed</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="sr-only peer" 
                      checked={settings.privacy.showCompletedCourses}
                      onChange={() => handlePrivacyToggle('showCompletedCourses')}
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                </div>
              </div>
            </div>
          </div>
          
          {/* Save Button */}
          <div className="flex justify-end">
            <button 
              onClick={saveSettings}
              disabled={saving}
              className="bg-primary hover:bg-primary-dark text-white font-medium py-2 px-6 rounded-md transition"
            >
              {saving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;