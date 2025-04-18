/**
 * Direct Enrollment Routes
 * Created by: Chakridhar
 * Handles direct enrollment (free courses or testing)
 */
import express from 'express';
import { requireAuth } from '../middleware/clerkAuth.js';
import Enrollment from '../../models/Enrollment.js';
import Course from '../../models/Course.js';

const router = express.Router();

// Direct enrollment route (no payment)
router.post('/', requireAuth, async (req, res) => {
  try {
    const { courseId } = req.body;
    const userId = req.user._id; // Get user ID from auth middleware
    
    console.log(`Direct enrollment request for course ${courseId} by user ${userId}`);
    
    // Check if the course exists
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }
    
    // Check if already enrolled
    const existingEnrollment = await Enrollment.findOne({ 
      user: userId,
      course: courseId 
    });
    
    if (existingEnrollment) {
      return res.status(400).json({ message: 'Already enrolled in this course' });
    }
    
    // Create new enrollment
    const enrollment = new Enrollment({
      user: userId,
      course: courseId,
      enrollmentDate: new Date(),
      status: 'active',
      progress: 0,
      completedLessons: []
    });
    
    await enrollment.save();
    console.log(`Enrollment created successfully: ${enrollment._id}`);
    
    // Increment course enrollment count
    course.enrollmentCount = (course.enrollmentCount || 0) + 1;
    await course.save();
    
    res.status(201).json({
      message: 'Successfully enrolled in the course',
      enrollment
    });
    
  } catch (error) {
    console.error('Direct enrollment error:', error);
    res.status(500).json({ message: 'Server error during enrollment' });
  }
});

export default router;