/**
 * User Profile Component
 * Created by Chakridhar - April 2025
 * 
 * Displays and allows editing of user profile information
 */

import React, { useState, useEffect } from 'react';
import { useClerkAuth } from '../hooks/useClerkAuth';
import { useToast } from '../hooks/use-toast';

const UserProfile = () => {
  const { user, isLoading, updateUserProfile } = useClerkAuth();
  const { toast } = useToast();
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    bio: '',
    location: '',
    website: '',
    profileImage: ''
  });
  
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Load user data when component mounts
  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        bio: user.bio || '',
        location: user.location || '',
        website: user.website || '',
        profileImage: user.profileImage || ''
      });
    }
  }, [user]);
  
  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setIsSaving(true);
      
      // Call API to update profile
      await updateUserProfile(formData);
      
      toast({
        title: 'Profile Updated',
        description: 'Your profile has been successfully updated',
        variant: 'success'
      });
      
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: 'Update Failed',
        description: error.message || 'Could not update profile',
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
        <p className="text-muted">Please sign in to view your profile</p>
      </div>
    );
  }
  
  return (
    <div className="user-profile">
      <div className="card">
        <div className="card-header bg-light d-flex justify-content-between align-items-center">
          <h5 className="card-title mb-0">Profile Information</h5>
          <button 
            className="btn btn-sm btn-primary"
            onClick={() => setIsEditing(!isEditing)}
          >
            {isEditing ? 'Cancel' : 'Edit Profile'}
          </button>
        </div>
        
        <div className="card-body">
          {isEditing ? (
            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label htmlFor="name" className="form-label">Name</label>
                <input
                  type="text"
                  className="form-control"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </div>
              
              <div className="mb-3">
                <label htmlFor="email" className="form-label">Email</label>
                <input
                  type="email"
                  className="form-control"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  disabled
                />
                <small className="text-muted">Email cannot be changed</small>
              </div>
              
              <div className="mb-3">
                <label htmlFor="bio" className="form-label">Bio</label>
                <textarea
                  className="form-control"
                  id="bio"
                  name="bio"
                  value={formData.bio}
                  onChange={handleChange}
                  rows="3"
                ></textarea>
              </div>
              
              <div className="row">
                <div className="col-md-6 mb-3">
                  <label htmlFor="location" className="form-label">Location</label>
                  <input
                    type="text"
                    className="form-control"
                    id="location"
                    name="location"
                    value={formData.location}
                    onChange={handleChange}
                  />
                </div>
                
                <div className="col-md-6 mb-3">
                  <label htmlFor="website" className="form-label">Website</label>
                  <input
                    type="url"
                    className="form-control"
                    id="website"
                    name="website"
                    value={formData.website}
                    onChange={handleChange}
                    placeholder="https://example.com"
                  />
                </div>
              </div>
              
              <div className="mb-3">
                <label htmlFor="profileImage" className="form-label">Profile Image URL</label>
                <input
                  type="url"
                  className="form-control"
                  id="profileImage"
                  name="profileImage"
                  value={formData.profileImage}
                  onChange={handleChange}
                  placeholder="https://example.com/image.jpg"
                />
                <small className="text-muted">Enter URL of your profile image</small>
              </div>
              
              <div className="d-grid gap-2">
                <button 
                  type="submit" 
                  className="btn btn-success"
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      Saving...
                    </>
                  ) : 'Save Changes'}
                </button>
              </div>
            </form>
          ) : (
            <div className="row">
              <div className="col-md-4 text-center mb-4">
                <img 
                  src={user.profileImage || "https://randomuser.me/api/portraits/women/32.jpg"} 
                  alt={user.name} 
                  className="rounded-circle img-fluid" 
                  style={{ maxWidth: '150px' }}
                />
              </div>
              
              <div className="col-md-8">
                <h3 className="fw-bold">{user.name}</h3>
                <p className="text-muted">{user.email}</p>
                
                {user.bio && (
                  <div className="mb-3">
                    <h6 className="text-uppercase fs-6 text-muted">About</h6>
                    <p>{user.bio}</p>
                  </div>
                )}
                
                <div className="d-flex flex-wrap">
                  {user.location && (
                    <div className="me-4 mb-2">
                      <h6 className="text-uppercase fs-6 text-muted">Location</h6>
                      <p className="mb-0">{user.location}</p>
                    </div>
                  )}
                  
                  {user.website && (
                    <div>
                      <h6 className="text-uppercase fs-6 text-muted">Website</h6>
                      <a href={user.website} target="_blank" rel="noopener noreferrer">
                        {user.website.replace(/^https?:\/\//, '')}
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserProfile;