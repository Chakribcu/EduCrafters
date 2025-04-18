/**
 * User Profile Routes
 * Created by Chakridhar - April 2025
 * 
 * This module handles user profile operations including:
 * - Fetching profile information
 * - Updating profile details
 * - Changing password
 * - Managing notification preferences
 * - Exporting user data
 * - Deleting user account
 */

import express from 'express';
import { protect } from '../middleware/auth.js';
import bcrypt from 'bcryptjs';

const router = express.Router();

/**
 * @route   GET /api/profile
 * @desc    Get user profile
 * @access  Private
 */
router.get('/', protect, async (req, res) => {
  try {
    // User data is already attached to req.user from the auth middleware
    // Remove sensitive fields before sending
    const { password, ...userProfile } = req.user;
    
    res.status(200).json(userProfile);
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   PATCH /api/profile
 * @desc    Update user profile
 * @access  Private
 */
router.patch('/', protect, async (req, res) => {
  try {
    const { name, email, bio, website } = req.body;
    const userId = req.user.id;
    
    // Check if email is already taken by another user
    if (email && email !== req.user.email) {
      const existingUser = await req.storage.getUserByEmail(email);
      if (existingUser && existingUser.id !== userId) {
        return res.status(400).json({ message: 'Email already in use' });
      }
    }
    
    // Update user profile
    const updatedUser = await req.storage.updateUser(userId, {
      name,
      email,
      bio,
      website,
      updatedAt: new Date()
    });
    
    // Remove sensitive fields
    const { password, ...userProfile } = updatedUser;
    
    res.status(200).json(userProfile);
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   POST /api/profile/password
 * @desc    Change user password
 * @access  Private
 */
router.post('/password', protect, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;
    
    // Validate input
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'All fields are required' });
    }
    
    if (newPassword.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters long' });
    }
    
    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, req.user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Current password is incorrect' });
    }
    
    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    
    // Update password
    await req.storage.updateUser(userId, {
      password: hashedPassword,
      updatedAt: new Date()
    });
    
    res.status(200).json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Error changing password:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   PATCH /api/profile/notifications
 * @desc    Update notification preferences
 * @access  Private
 */
router.patch('/notifications', protect, async (req, res) => {
  try {
    const { notifications } = req.body;
    const userId = req.user.id;
    
    // Update notification settings
    const updatedUser = await req.storage.updateUserSettings(userId, {
      notifications,
      updatedAt: new Date()
    });
    
    // Remove sensitive fields
    const { password, ...userProfile } = updatedUser;
    
    res.status(200).json(userProfile);
  } catch (error) {
    console.error('Error updating notification preferences:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   PATCH /api/profile/settings
 * @desc    Update user settings
 * @access  Private
 */
router.patch('/settings', protect, async (req, res) => {
  try {
    const { settings } = req.body;
    const userId = req.user.id;
    
    // Update user settings
    const updatedUser = await req.storage.updateUserSettings(userId, {
      settings,
      updatedAt: new Date()
    });
    
    // Remove sensitive fields
    const { password, ...userProfile } = updatedUser;
    
    res.status(200).json(userProfile);
  } catch (error) {
    console.error('Error updating settings:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   GET /api/profile/export
 * @desc    Export user data
 * @access  Private
 */
router.get('/export', protect, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get user profile data
    const { password, ...profile } = req.user;
    
    // Get user enrollments
    const enrollments = await req.storage.getEnrollmentsByUser(userId);
    
    // Get courses the user is enrolled in
    const enrolledCourseIds = enrollments.map(enrollment => enrollment.courseId);
    const enrolledCourses = [];
    
    for (const courseId of enrolledCourseIds) {
      const course = await req.storage.getCourse(courseId);
      if (course) {
        enrolledCourses.push(course);
      }
    }
    
    // If user is an instructor, get their courses
    let instructorCourses = [];
    if (req.user.role === 'instructor') {
      instructorCourses = await req.storage.getCoursesByInstructor(userId);
    }
    
    // Compile user data
    const userData = {
      profile,
      enrollments,
      enrolledCourses,
      instructorCourses,
      exportDate: new Date()
    };
    
    res.status(200).json(userData);
  } catch (error) {
    console.error('Error exporting user data:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   DELETE /api/profile
 * @desc    Delete user account
 * @access  Private
 */
router.delete('/', protect, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Delete user account
    await req.storage.deleteUser(userId);
    
    res.status(200).json({ message: 'Account deleted successfully' });
  } catch (error) {
    console.error('Error deleting account:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;