/**
 * MongoDB Storage Handler
 * Created by Chakridhar - April 2025
 * 
 * This file provides a MongoDB implementation of the storage interface
 * to ensure data persists across server restarts.
 */
import mongoose from 'mongoose';
import User from '../models/User.js';
import Course from '../models/Course.js';
import Lesson from '../models/Lesson.js';
import Enrollment from '../models/Enrollment.js';
import Review from '../models/Review.js';
import bcrypt from 'bcryptjs';

/**
 * MongoDB Storage Implementation
 * This class implements the storage interface for MongoDB persistence
 */
class MongoDBStorage {
  constructor() {
    this.isConnected = mongoose.connection.readyState === 1;
    console.log(`MongoDB Storage initialized. Connected: ${this.isConnected}`);
  }

  /**
   * User-related methods
   */
  async getUser(id) {
    try {
      // Handle both ObjectId and numeric IDs
      let user;
      if (mongoose.Types.ObjectId.isValid(id)) {
        user = await User.findById(id);
      } else {
        user = await User.findOne({ id: Number(id) });
      }
      return user || null;
    } catch (error) {
      console.error('MongoDB Error (getUser):', error);
      return null;
    }
  }

  async getUserByEmail(email) {
    try {
      const user = await User.findOne({ email });
      return user || null;
    } catch (error) {
      console.error('MongoDB Error (getUserByEmail):', error);
      return null;
    }
  }

  async createUser(userData) {
    try {
      // If password is not already hashed, hash it
      if (userData.password && !userData.password.startsWith('$2a$')) {
        const salt = await bcrypt.genSalt(10);
        userData.password = await bcrypt.hash(userData.password, salt);
      }

      const user = new User(userData);
      await user.save();
      return user;
    } catch (error) {
      console.error('MongoDB Error (createUser):', error);
      throw error;
    }
  }

  async updateUser(id, updateData) {
    try {
      // Handle both ObjectId and numeric IDs
      let user;
      if (mongoose.Types.ObjectId.isValid(id)) {
        user = await User.findByIdAndUpdate(
          id,
          { ...updateData, updatedAt: new Date() },
          { new: true, runValidators: true }
        );
      } else {
        user = await User.findOneAndUpdate(
          { id: Number(id) },
          { ...updateData, updatedAt: new Date() },
          { new: true, runValidators: true }
        );
      }
      return user;
    } catch (error) {
      console.error('MongoDB Error (updateUser):', error);
      throw error;
    }
  }

  async updateUserSettings(id, settingsData) {
    try {
      // This method is similar to updateUser but specifically for user settings
      return this.updateUser(id, { settings: settingsData });
    } catch (error) {
      console.error('MongoDB Error (updateUserSettings):', error);
      throw error;
    }
  }

  async deleteUser(id) {
    try {
      // Handle both ObjectId and numeric IDs
      let result;
      if (mongoose.Types.ObjectId.isValid(id)) {
        result = await User.findByIdAndDelete(id);
      } else {
        result = await User.findOneAndDelete({ id: Number(id) });
      }
      
      // Also delete all user enrollments
      if (result) {
        await Enrollment.deleteMany({ user: id });
        await Review.deleteMany({ user: id });
        return true;
      }
      return false;
    } catch (error) {
      console.error('MongoDB Error (deleteUser):', error);
      return false;
    }
  }

  async updateStripeCustomerId(userId, stripeCustomerId) {
    try {
      // Update user with Stripe customer ID
      return this.updateUser(userId, { stripeCustomerId });
    } catch (error) {
      console.error('MongoDB Error (updateStripeCustomerId):', error);
      throw error;
    }
  }

  /**
   * Course-related methods
   */
  async createCourse(courseData) {
    try {
      // Ensure instructor reference is valid
      if (courseData.instructorId) {
        // Convert instructorId to instructor 
        courseData.instructor = courseData.instructorId;
      }
      
      const course = new Course({
        ...courseData,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      await course.save();
      return course;
    } catch (error) {
      console.error('MongoDB Error (createCourse):', error);
      throw error;
    }
  }

  async getCourse(id) {
    try {
      // Handle both ObjectId and numeric IDs
      let course;
      
      if (mongoose.Types.ObjectId.isValid(id)) {
        course = await Course.findById(id);
      } else {
        course = await Course.findOne({ id: Number(id) });
      }
      
      return course || null;
    } catch (error) {
      console.error('MongoDB Error (getCourse):', error);
      return null;
    }
  }

  async getCourses() {
    try {
      const courses = await Course.find()
        .sort({ createdAt: -1 })
        .populate('instructor', 'name email profileImage');
        
      return courses;
    } catch (error) {
      console.error('MongoDB Error (getCourses):', error);
      return [];
    }
  }

  async getCoursesByInstructor(instructorId) {
    try {
      // Handle both ObjectId and numeric IDs
      let courses;
      
      if (mongoose.Types.ObjectId.isValid(instructorId)) {
        courses = await Course.find({ instructor: instructorId })
          .sort({ createdAt: -1 });
      } else {
        courses = await Course.find({ 
          $or: [
            { instructor: instructorId },
            { instructorId: Number(instructorId) }
          ]
        }).sort({ createdAt: -1 });
      }
      
      return courses;
    } catch (error) {
      console.error('MongoDB Error (getCoursesByInstructor):', error);
      return [];
    }
  }

  async updateCourse(id, courseUpdate) {
    try {
      // Handle both ObjectId and numeric IDs
      let course;
      
      if (mongoose.Types.ObjectId.isValid(id)) {
        course = await Course.findByIdAndUpdate(
          id,
          { ...courseUpdate, updatedAt: new Date() },
          { new: true, runValidators: true }
        );
      } else {
        course = await Course.findOneAndUpdate(
          { id: Number(id) },
          { ...courseUpdate, updatedAt: new Date() },
          { new: true, runValidators: true }
        );
      }
      
      return course;
    } catch (error) {
      console.error('MongoDB Error (updateCourse):', error);
      throw error;
    }
  }

  async deleteCourse(id) {
    try {
      // Handle both ObjectId and numeric IDs
      let result;
      
      if (mongoose.Types.ObjectId.isValid(id)) {
        result = await Course.findByIdAndDelete(id);
      } else {
        result = await Course.findOneAndDelete({ id: Number(id) });
      }
      
      // Also delete all lessons and enrollments for this course
      if (result) {
        await Lesson.deleteMany({ course: id });
        await Enrollment.deleteMany({ course: id });
        await Review.deleteMany({ course: id });
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('MongoDB Error (deleteCourse):', error);
      return false;
    }
  }

  /**
   * Lesson-related methods
   */
  async createLesson(lessonData) {
    try {
      // Find max order for this course
      const maxOrderLesson = await Lesson.findOne({ course: lessonData.courseId })
        .sort({ order: -1 });
      
      const maxOrder = maxOrderLesson ? maxOrderLesson.order : 0;
      
      const lesson = new Lesson({
        ...lessonData,
        order: lessonData.order || maxOrder + 1,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      await lesson.save();
      
      // Update course totalLessons
      const lessonCount = await Lesson.countDocuments({ course: lessonData.courseId });
      await Course.findByIdAndUpdate(lessonData.courseId, { 
        totalLessons: lessonCount,
        updatedAt: new Date()
      });
      
      return lesson;
    } catch (error) {
      console.error('MongoDB Error (createLesson):', error);
      throw error;
    }
  }

  async getLessonsForCourse(courseId) {
    try {
      const lessons = await Lesson.find({ course: courseId })
        .sort({ order: 1 });
        
      return lessons;
    } catch (error) {
      console.error('MongoDB Error (getLessonsForCourse):', error);
      return [];
    }
  }

  /**
   * Enrollment-related methods
   */
  async createEnrollment(enrollmentData) {
    try {
      // Convert ID fields if needed
      let enrollData = { ...enrollmentData };
      
      // User ID handling
      if (enrollData.userId) {
        if (mongoose.Types.ObjectId.isValid(enrollData.userId)) {
          enrollData.user = enrollData.userId;
        } else {
          const user = await User.findOne({ id: Number(enrollData.userId) });
          if (user) {
            enrollData.user = user._id;
          }
        }
      }
      
      // Course ID handling
      if (enrollData.courseId) {
        if (mongoose.Types.ObjectId.isValid(enrollData.courseId)) {
          enrollData.course = enrollData.courseId;
        } else {
          const course = await Course.findOne({ id: Number(enrollData.courseId) });
          if (course) {
            enrollData.course = course._id;
          }
        }
      }
      
      // Check for existing enrollment to avoid duplicates
      const existingEnrollment = await Enrollment.findOne({
        user: enrollData.user,
        course: enrollData.course
      });
      
      if (existingEnrollment) {
        console.log('Enrollment already exists:', existingEnrollment);
        return existingEnrollment;
      }
      
      // Create new enrollment
      const enrollment = new Enrollment({
        ...enrollData,
        enrolledAt: new Date(),
        lastAccessedAt: new Date()
      });
      
      await enrollment.save();
      
      // Update course enrollment count
      await Course.findByIdAndUpdate(enrollData.course, {
        $inc: { totalStudents: 1 }
      });
      
      return enrollment;
    } catch (error) {
      console.error('MongoDB Error (createEnrollment):', error);
      throw error;
    }
  }

  async getEnrollment(userId, courseId) {
    try {
      // Try to find with direct IDs first
      let enrollment = await Enrollment.findOne({
        user: userId,
        course: courseId
      });
      
      // If not found, try with numeric IDs
      if (!enrollment) {
        enrollment = await Enrollment.findOne({
          'user.id': Number(userId),
          'course.id': Number(courseId)
        });
      }
      
      return enrollment || null;
    } catch (error) {
      console.error('MongoDB Error (getEnrollment):', error);
      return null;
    }
  }

  async getEnrollmentsByUser(userId) {
    try {
      // Find enrollments with populated course data
      const enrollments = await Enrollment.find({ user: userId })
        .populate({
          path: 'course',
          populate: {
            path: 'instructor',
            select: 'name email profileImage'
          }
        })
        .sort({ enrolledAt: -1 });
        
      return enrollments;
    } catch (error) {
      console.error('MongoDB Error (getEnrollmentsByUser):', error);
      return [];
    }
  }

  async updateEnrollmentProgress(id, progress) {
    try {
      const enrollment = await Enrollment.findByIdAndUpdate(
        id,
        { 
          progress,
          lastAccessedAt: new Date()
        },
        { new: true }
      );
      
      return enrollment;
    } catch (error) {
      console.error('MongoDB Error (updateEnrollmentProgress):', error);
      return null;
    }
  }

  async updateEnrollmentPaymentStatus(id, paymentIntent, paymentStatus) {
    try {
      const enrollment = await Enrollment.findByIdAndUpdate(
        id,
        { 
          paymentId: paymentIntent,
          paymentStatus,
          ...(paymentStatus === 'completed' ? { 
            completedAt: new Date() 
          } : {})
        },
        { new: true }
      );
      
      return enrollment;
    } catch (error) {
      console.error('MongoDB Error (updateEnrollmentPaymentStatus):', error);
      return null;
    }
  }

  /**
   * Review-related methods
   */
  async createReview(reviewData) {
    try {
      const review = new Review({
        ...reviewData,
        createdAt: new Date()
      });
      
      await review.save();
      
      // Update course rating
      await this.updateCourseRating(reviewData.course);
      
      return review;
    } catch (error) {
      console.error('MongoDB Error (createReview):', error);
      throw error;
    }
  }

  async getReview(id) {
    try {
      const review = await Review.findById(id);
      return review || null;
    } catch (error) {
      console.error('MongoDB Error (getReview):', error);
      return null;
    }
  }

  async getReviewsByCourse(courseId) {
    try {
      const reviews = await Review.find({ course: courseId })
        .populate('user', 'name email profileImage')
        .sort({ createdAt: -1 });
        
      return reviews;
    } catch (error) {
      console.error('MongoDB Error (getReviewsByCourse):', error);
      return [];
    }
  }

  async updateReview(id, reviewData) {
    try {
      const review = await Review.findByIdAndUpdate(
        id,
        { ...reviewData, updatedAt: new Date() },
        { new: true }
      );
      
      // Update course rating
      if (review) {
        await this.updateCourseRating(review.course);
      }
      
      return review;
    } catch (error) {
      console.error('MongoDB Error (updateReview):', error);
      return null;
    }
  }

  async deleteReview(id) {
    try {
      const review = await Review.findById(id);
      if (!review) return false;
      
      const courseId = review.course;
      await Review.findByIdAndDelete(id);
      
      // Update course rating
      await this.updateCourseRating(courseId);
      
      return true;
    } catch (error) {
      console.error('MongoDB Error (deleteReview):', error);
      return false;
    }
  }

  async updateCourseRating(courseId) {
    try {
      // Calculate average rating
      const reviewAggregation = await Review.aggregate([
        { $match: { course: mongoose.Types.ObjectId.createFromHexString(courseId.toString()) } },
        { 
          $group: { 
            _id: '$course', 
            averageRating: { $avg: '$rating' },
            numReviews: { $sum: 1 }
          } 
        }
      ]);
      
      if (reviewAggregation.length > 0) {
        const { averageRating, numReviews } = reviewAggregation[0];
        
        await Course.findByIdAndUpdate(courseId, {
          averageRating: Math.round(averageRating * 10) / 10, // Round to 1 decimal place
          numReviews
        });
      } else {
        // No reviews, reset to default values
        await Course.findByIdAndUpdate(courseId, {
          averageRating: 0,
          numReviews: 0
        });
      }
      
      return true;
    } catch (error) {
      console.error('MongoDB Error (updateCourseRating):', error);
      return false;
    }
  }
}

export default MongoDBStorage;