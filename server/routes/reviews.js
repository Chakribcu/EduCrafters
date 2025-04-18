/**
 * Review routes
 */
import express from 'express';
import { storage } from '../storage.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Get all reviews for a course
router.get('/course/:courseId', async (req, res) => {
  try {
    const courseId = req.params.courseId;
    
    // Check if the course exists
    const course = await storage.getCourse(courseId);
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }
    
    const reviews = await storage.getReviewsByCourse(courseId);
    res.json({ data: reviews });
  } catch (error) {
    console.error('Error fetching reviews:', error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Create a new review for a course
router.post('/course/:courseId', protect, async (req, res) => {
  try {
    const courseId = req.params.courseId;
    const userId = req.user.id || req.user._id;
    
    // Check if the course exists
    const course = await storage.getCourse(courseId);
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }
    
    // Check if user is enrolled in the course
    const enrollment = await storage.getEnrollment(userId, courseId);
    if (!enrollment) {
      return res.status(403).json({ message: "You must be enrolled in the course to review it" });
    }
    
    // Check if the user has already reviewed this course
    const existingReviews = await storage.getReviewsByCourse(courseId);
    const userReview = existingReviews.find(review => 
      (review.userId === userId) || (review.userId && review.userId._id === userId)
    );
    
    if (userReview) {
      return res.status(400).json({ message: "You have already reviewed this course" });
    }
    
    // Validate review data
    const { rating, reviewText } = req.body;
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ message: "Rating must be between 1 and 5" });
    }
    
    if (!reviewText || reviewText.trim().length < 5) {
      return res.status(400).json({ message: "Review text is required and must be at least 5 characters" });
    }
    
    // Create the review
    const review = await storage.createReview({
      userId,
      courseId,
      rating,
      reviewText,
    });
    
    res.status(201).json(review);
  } catch (error) {
    console.error('Error creating review:', error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Update an existing review
router.put('/:id', protect, async (req, res) => {
  try {
    const reviewId = req.params.id;
    const userId = req.user.id || req.user._id;
    
    // Check if the review exists
    const review = await storage.getReview(reviewId);
    if (!review) {
      return res.status(404).json({ message: "Review not found" });
    }
    
    // Check if the user owns the review
    if (review.userId !== userId && (review.userId && review.userId._id !== userId)) {
      return res.status(403).json({ message: "You can only update your own reviews" });
    }
    
    // Validate review data
    const { rating, reviewText } = req.body;
    if (rating && (rating < 1 || rating > 5)) {
      return res.status(400).json({ message: "Rating must be between 1 and 5" });
    }
    
    if (reviewText && reviewText.trim().length < 5) {
      return res.status(400).json({ message: "Review text must be at least 5 characters" });
    }
    
    // Update the review
    const updatedReview = await storage.updateReview(reviewId, {
      ...(rating && { rating }),
      ...(reviewText && { reviewText }),
    });
    
    res.json(updatedReview);
  } catch (error) {
    console.error('Error updating review:', error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Delete a review
router.delete('/:id', protect, async (req, res) => {
  try {
    const reviewId = req.params.id;
    const userId = req.user.id || req.user._id;
    
    // Check if the review exists
    const review = await storage.getReview(reviewId);
    if (!review) {
      return res.status(404).json({ message: "Review not found" });
    }
    
    // Check if the user owns the review or is an instructor of the course
    const isOwner = review.userId === userId || (review.userId && review.userId._id === userId);
    
    // Check if user is the course instructor
    const course = await storage.getCourse(review.courseId);
    const isInstructor = course && (course.instructorId === userId || (course.instructor === userId));
    
    if (!isOwner && !isInstructor) {
      return res.status(403).json({ message: "You can only delete your own reviews" });
    }
    
    const deleted = await storage.deleteReview(reviewId);
    if (deleted) {
      res.json({ message: "Review deleted successfully" });
    } else {
      res.status(500).json({ message: "Failed to delete review" });
    }
  } catch (error) {
    console.error('Error deleting review:', error);
    res.status(500).json({ message: "Internal server error" });
  }
});

export default router;