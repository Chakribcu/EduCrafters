/**
 * Enrollment Status Route
 * Created by Chakridhar - April 2025
 * 
 * This route provides a simple way to check if a user is enrolled in a course
 * with both authenticated and direct checks.
 */
import express from 'express';
import { storage } from '../storage.js';

const router = express.Router();

/**
 * Check enrollment status
 * GET /api/enrollment-status?userId=1&courseId=2
 */
router.get('/enrollment-status', async (req, res) => {
  const { userId, courseId } = req.query;
  
  if (!userId || !courseId) {
    return res.status(400).json({ 
      error: 'Missing required parameters',
      enrolled: false 
    });
  }
  
  try {
    // Try to find the enrollment
    const enrollment = await storage.getEnrollment(parseInt(userId), parseInt(courseId));
    
    return res.json({
      enrolled: Boolean(enrollment),
      enrollmentId: enrollment ? enrollment.id || enrollment._id : null,
      status: enrollment ? enrollment.status : null
    });
  } catch (error) {
    console.error('Error checking enrollment status:', error);
    return res.status(500).json({ 
      error: 'Server error checking enrollment status',
      enrolled: false 
    });
  }
});

export default router;