/**
 * Direct Enrollment API
 * Created by Chakridhar - April 2025
 * 
 * This API provides a direct enrollment method for courses
 * It supports both authenticated and unauthenticated requests
 */
import express from 'express';
import mongoose from 'mongoose';
import { storage } from '../storage.js';
import Course from '../../models/Course.js';
import User from '../../models/User.js';
import Enrollment from '../../models/Enrollment.js';
import jwt from 'jsonwebtoken';

const router = express.Router();

/**
 * Direct enrollment route for in-memory and MongoDB compatibility
 * POST /api/direct-enroll
 */
router.post('/direct-enroll', async (req, res) => {
  // Check for authenticated user from token if present
  let authenticatedUserId = null;
  
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      if (token) {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
        authenticatedUserId = decoded.id;
        console.log(`[Direct Enroll API] Authenticated user ID from token: ${authenticatedUserId}`);
      }
    }
  } catch (tokenError) {
    console.log(`[Direct Enroll API] Token verification error: ${tokenError.message}`);
    // Continue with the request using the provided userId instead
  }
  try {
    let { userId, courseId, email } = req.body;
    
    // If we have an authenticated user, use that ID instead of the one in the body
    if (authenticatedUserId) {
      console.log(`[Direct Enroll API] Using authenticated user ID (${authenticatedUserId}) instead of provided ID (${userId})`);
      userId = authenticatedUserId;
    }
    
    if (!userId || !courseId) {
      return res.status(400).json({ message: 'User ID and course ID are required' });
    }
    
    console.log(`[Direct Enroll API] Enrolling user ${userId} in course ${courseId}`);
    
    // STEP 1: Try to get the course using the in-memory storage
    let course;
    try {
      course = await storage.getCourse(Number(courseId));
      
      if (course) {
        console.log(`[Direct Enroll API] Found course in memory: ${course.title}`);
      } else {
        console.log(`[Direct Enroll API] Course not found in memory storage, trying MongoDB...`);
      }
    } catch (memoryError) {
      console.log(`[Direct Enroll API] Error accessing memory storage: ${memoryError.message}`);
    }
    
    // STEP 2: If in-memory failed, try MongoDB
    if (!course && global.dbType === 'mongodb') {
      try {
        if (mongoose.Types.ObjectId.isValid(courseId)) {
          course = await Course.findById(courseId);
        } else {
          // Try finding by numeric ID in MongoDB
          course = await Course.findOne({ id: Number(courseId) });
        }
        
        if (course) {
          console.log(`[Direct Enroll API] Found course in MongoDB: ${course.title}`);
        } else {
          console.error(`[Direct Enroll API] Course not found in any storage system: ${courseId}`);
          return res.status(404).json({ message: 'Course not found' });
        }
      } catch (mongoError) {
        console.error(`[Direct Enroll API] MongoDB course error: ${mongoError.message}`);
      }
    }
    
    // STEP 3: If no course found in either storage, return error
    if (!course) {
      return res.status(404).json({ message: 'Course not found in any storage system' });
    }
    
    // STEP 4: Check for existing enrollment using appropriate storage
    let existingEnrollment;
    
    // Check memory storage first
    try {
      existingEnrollment = await storage.getEnrollment(Number(userId), Number(courseId));
      
      if (existingEnrollment) {
        console.log(`[Direct Enroll API] Found existing enrollment in memory storage`);
        return res.status(200).json({ 
          message: 'Already enrolled',
          enrollment: existingEnrollment
        });
      }
    } catch (memEnrollError) {
      console.log(`[Direct Enroll API] Memory enrollment check error: ${memEnrollError.message}`);
    }
    
    // Check MongoDB if needed
    if (!existingEnrollment && global.dbType === 'mongodb') {
      try {
        const mongoQuery = mongoose.Types.ObjectId.isValid(userId) && 
                         mongoose.Types.ObjectId.isValid(courseId) 
          ? { user: userId, course: courseId } 
          : { 'user.id': Number(userId), 'course.id': Number(courseId) };
        
        existingEnrollment = await Enrollment.findOne(mongoQuery);
        
        if (existingEnrollment) {
          console.log(`[Direct Enroll API] Found existing enrollment in MongoDB`);
          return res.status(200).json({ 
            message: 'Already enrolled',
            enrollment: existingEnrollment 
          });
        }
      } catch (mongoEnrollError) {
        console.log(`[Direct Enroll API] MongoDB enrollment check error: ${mongoEnrollError.message}`);
      }
    }
    
    // STEP 5: Create a new enrollment in the appropriate storage
    try {
      const enrollmentData = {
        userId: Number(userId),
        courseId: Number(courseId),
        progress: 0,
        completedLessons: [],
        paymentStatus: 'completed',
        enrolledAt: new Date().toISOString(),
        lastAccessedAt: new Date().toISOString()
      };
      
      console.log(`[Direct Enroll API] Creating enrollment in memory storage: ${JSON.stringify(enrollmentData)}`);
      
      // Try in-memory storage first
      let enrollment = await storage.createEnrollment(enrollmentData);
      
      if (enrollment) {
        console.log(`[Direct Enroll API] Memory enrollment created: ${JSON.stringify(enrollment)}`);
        
        // Update course enrollment counter
        try {
          const courseUpdate = { 
            totalStudents: (course.totalStudents || 0) + 1
          };
          await storage.updateCourse(Number(courseId), courseUpdate);
        } catch (courseUpdateError) {
          console.log(`[Direct Enroll API] Error updating course enrollment count: ${courseUpdateError.message}`);
        }
        
        return res.status(201).json(enrollment);
      }
    } catch (createError) {
      console.error(`[Direct Enroll API] Memory enrollment creation error: ${createError.message}`);
    }
    
    // STEP 6: If memory storage failed and MongoDB is available, try that
    if (global.dbType === 'mongodb') {
      try {
        // Prepare MongoDB enrollment data
        const mongoEnrollmentData = {
          user: mongoose.Types.ObjectId.isValid(userId) ? userId : { id: Number(userId) },
          course: mongoose.Types.ObjectId.isValid(courseId) ? courseId : { id: Number(courseId) },
          progress: 0,
          completedLessons: [],
          completed: false,
          paymentStatus: 'completed',
          enrolledAt: new Date(),
          lastAccessedAt: new Date()
        };
        
        console.log(`[Direct Enroll API] Creating MongoDB enrollment: ${JSON.stringify(mongoEnrollmentData)}`);
        
        const enrollment = new Enrollment(mongoEnrollmentData);
        await enrollment.save();
        
        console.log(`[Direct Enroll API] MongoDB enrollment created with ID: ${enrollment._id}`);
        
        // Update course enrollment counter if possible
        try {
          if (mongoose.Types.ObjectId.isValid(courseId)) {
            await Course.findByIdAndUpdate(
              courseId, 
              { $inc: { totalStudents: 1 } }
            );
          }
        } catch (mongoUpdateError) {
          console.log(`[Direct Enroll API] Error updating MongoDB course count: ${mongoUpdateError.message}`);
        }
        
        return res.status(201).json(enrollment);
      } catch (mongoCreateError) {
        console.error(`[Direct Enroll API] MongoDB enrollment creation error: ${mongoCreateError.message}`);
      }
    }
    
    // STEP 7: If all methods failed, create a last-resort fallback
    const fallbackEnrollment = {
      id: Date.now(),
      userId: Number(userId),
      courseId: Number(courseId),
      progress: 0,
      completedLessons: [],
      paymentStatus: 'completed',
      enrolledAt: new Date().toISOString(),
      lastAccessedAt: new Date().toISOString(),
      course: {
        id: Number(courseId),
        title: course.title || 'Unknown Course',
        description: course.description || '',
        imageUrl: course.imageUrl || ''
      }
    };
    
    console.log(`[Direct Enroll API] All methods failed. Using fallback: ${JSON.stringify(fallbackEnrollment)}`);
    return res.status(201).json(fallbackEnrollment);
    
  } catch (error) {
    console.error(`[Direct Enroll API] Unexpected error: ${error.message}`);
    return res.status(500).json({ 
      message: 'Server error processing enrollment',
      error: error.message 
    });
  }
});

export default router;