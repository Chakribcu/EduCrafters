/**
 * User management routes
 * 
 * These routes handle user profile management and settings updates.
 */

import { storage } from '../storage.js';
import { protect } from '../middleware/auth.js';
import express from 'express';
import bcrypt from 'bcryptjs';

// Export user routes function
export default function(app) {
  // Get user profile
  app.get('/api/user/profile', protect, async (req, res) => {
    try {
      const userId = req.user.id || req.user._id;
      
      // Get user by ID
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      // Return user data without password
      res.json({
        id: user.id || user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        bio: user.bio || '',
        profileImage: user.profileImage || '',
        createdAt: user.createdAt
      });
    } catch (error) {
      console.error('Get user profile error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });
  
  // Update user profile
  app.put('/api/user/profile', protect, async (req, res) => {
    try {
      const userId = req.user.id || req.user._id;
      const { name, email, bio, profileImage } = req.body;
      
      // Check if email is already taken by another user
      if (email) {
        const existingUser = await storage.getUserByEmail(email);
        if (existingUser && (existingUser.id !== userId && existingUser._id !== userId)) {
          return res.status(400).json({ message: 'Email already in use' });
        }
      }
      
      // Update user
      const updatedUser = await storage.updateUser(userId, {
        name: name || req.user.name,
        email: email || req.user.email,
        bio,
        profileImage,
        updatedAt: new Date().toISOString()
      });
      
      if (!updatedUser) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      // Return updated user data without password
      res.json({
        id: updatedUser.id || updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        bio: updatedUser.bio || '',
        profileImage: updatedUser.profileImage || '',
        updatedAt: updatedUser.updatedAt
      });
    } catch (error) {
      console.error('Update user profile error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });
  
  // Update user password
  app.put('/api/user/password', protect, async (req, res) => {
    try {
      const userId = req.user.id || req.user._id;
      const { currentPassword, newPassword } = req.body;
      
      // Get user by ID
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      // Check current password
      let isMatch = false;
      
      // Direct comparison for demo data with plain text passwords
      if (global.dbType === 'memory' && (!user.password || !user.password.includes('$'))) {
        isMatch = currentPassword === user.password;
      } else {
        // Bcrypt comparison for hashed passwords
        isMatch = await bcrypt.compare(currentPassword, user.password);
      }
      
      if (!isMatch) {
        return res.status(400).json({ message: 'Current password is incorrect' });
      }
      
      // Hash the new password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(newPassword, salt);
      
      // Update user's password
      const updatedUser = await storage.updateUser(userId, {
        password: hashedPassword,
        updatedAt: new Date().toISOString()
      });
      
      res.json({ message: 'Password updated successfully' });
    } catch (error) {
      console.error('Update password error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });
  
  // Get user settings
  app.get('/api/user/settings', protect, async (req, res) => {
    try {
      const userId = req.user.id || req.user._id;
      
      // Get user by ID
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      // Return user settings
      const settings = user.settings || {
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
      };
      
      res.json(settings);
    } catch (error) {
      console.error('Get user settings error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });
  
  // Update user settings
  app.put('/api/user/settings', protect, async (req, res) => {
    try {
      const userId = req.user.id || req.user._id;
      const settings = req.body;
      
      // Update user's settings
      const updatedUser = await storage.updateUserSettings(userId, settings);
      
      if (!updatedUser) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      res.json(updatedUser.settings || {});
    } catch (error) {
      console.error('Update user settings error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });
  
  // Get user's course enrollments
  app.get('/api/user/enrollments', protect, async (req, res) => {
    try {
      const userId = req.user.id || req.user._id;
      
      // Get user's enrollments
      const enrollments = await storage.getEnrollmentsByUser(userId);
      
      res.json(enrollments);
    } catch (error) {
      console.error('Get user enrollments error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });
  
  // Deactivate user account
  app.put('/api/user/deactivate', protect, async (req, res) => {
    try {
      const userId = req.user.id || req.user._id;
      
      // Update user (mark as inactive)
      const updatedUser = await storage.updateUser(userId, {
        isActive: false,
        updatedAt: new Date().toISOString()
      });
      
      if (!updatedUser) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      res.json({ message: 'Account deactivated successfully' });
    } catch (error) {
      console.error('Deactivate user error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });
  
  // Delete user account
  app.delete('/api/user/account', protect, async (req, res) => {
    try {
      const userId = req.user.id || req.user._id;
      
      // Delete user
      const success = await storage.deleteUser(userId);
      
      if (!success) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      res.json({ message: 'Account deleted successfully' });
    } catch (error) {
      console.error('Delete user error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });
}