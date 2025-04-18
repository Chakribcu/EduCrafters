/**
 * Lesson management routes
 * Created by Chakridhar - April 2025
 * 
 * These endpoints handle creating, updating, deleting, and retrieving course lessons.
 */
import express from 'express';
import { requireAuth } from '../middleware/clerkAuth.js';
import Course from '../../models/Course.js';
import Lesson from '../../models/Lesson.js';

const router = express.Router();

/**
 * Get all lessons for a course
 * Route: GET /api/courses/:courseId/lessons
 */
router.get('/courses/:courseId/lessons', async (req, res) => {
  try {
    const { courseId } = req.params;
    
    // Find the course
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }
    
    // Get lessons sorted by order
    const lessons = await Lesson.find({ course: courseId }).sort({ order: 1 });
    
    res.status(200).json(lessons);
  } catch (error) {
    console.error('Error getting lessons:', error);
    res.status(500).json({ message: error.message });
  }
});

/**
 * Get a specific lesson
 * Route: GET /api/lessons/:lessonId
 */
router.get('/lessons/:lessonId', async (req, res) => {
  try {
    const { lessonId } = req.params;
    
    // Find the lesson
    const lesson = await Lesson.findById(lessonId).populate('course');
    if (!lesson) {
      return res.status(404).json({ message: 'Lesson not found' });
    }
    
    res.status(200).json(lesson);
  } catch (error) {
    console.error('Error getting lesson:', error);
    res.status(500).json({ message: error.message });
  }
});

/**
 * Create a new lesson for a course
 * Route: POST /api/courses/:courseId/lessons
 */
router.post('/courses/:courseId/lessons', requireAuth, async (req, res) => {
  try {
    const { courseId } = req.params;
    const { title, content, videoUrl, duration, order, isPreview } = req.body;
    
    // Find the course
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }
    
    // Verify the user is the course instructor
    if (course.instructor.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to add lessons to this course' });
    }
    
    // Get current max order to determine new lesson order
    const maxOrderLesson = await Lesson.findOne({ course: courseId }).sort({ order: -1 });
    const newOrder = order || (maxOrderLesson ? maxOrderLesson.order + 1 : 1);
    
    // Create new lesson
    const lesson = new Lesson({
      title,
      content,
      videoUrl,
      duration: duration || 0,
      order: newOrder,
      isPreview: isPreview || false,
      course: courseId
    });
    
    await lesson.save();
    
    res.status(201).json(lesson);
  } catch (error) {
    console.error('Error creating lesson:', error);
    res.status(500).json({ message: error.message });
  }
});

/**
 * Update a lesson
 * Route: PUT /api/lessons/:lessonId
 */
router.put('/lessons/:lessonId', requireAuth, async (req, res) => {
  try {
    const { lessonId } = req.params;
    const { title, content, videoUrl, duration, order, isPreview } = req.body;
    
    // Find the lesson
    const lesson = await Lesson.findById(lessonId).populate('course');
    if (!lesson) {
      return res.status(404).json({ message: 'Lesson not found' });
    }
    
    // Verify the user is the course instructor
    if (lesson.course.instructor.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to update this lesson' });
    }
    
    // Update lesson fields
    if (title) lesson.title = title;
    if (content) lesson.content = content;
    if (videoUrl !== undefined) lesson.videoUrl = videoUrl;
    if (duration !== undefined) lesson.duration = duration;
    if (order !== undefined) lesson.order = order;
    if (isPreview !== undefined) lesson.isPreview = isPreview;
    
    await lesson.save();
    
    res.status(200).json(lesson);
  } catch (error) {
    console.error('Error updating lesson:', error);
    res.status(500).json({ message: error.message });
  }
});

/**
 * Delete a lesson
 * Route: DELETE /api/lessons/:lessonId
 */
router.delete('/lessons/:lessonId', requireAuth, async (req, res) => {
  try {
    const { lessonId } = req.params;
    
    // Find the lesson
    const lesson = await Lesson.findById(lessonId).populate('course');
    if (!lesson) {
      return res.status(404).json({ message: 'Lesson not found' });
    }
    
    // Verify the user is the course instructor
    if (lesson.course.instructor.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to delete this lesson' });
    }
    
    await Lesson.findByIdAndDelete(lessonId);
    
    // Reorder remaining lessons
    const remainingLessons = await Lesson.find({ course: lesson.course._id }).sort({ order: 1 });
    
    for (let i = 0; i < remainingLessons.length; i++) {
      remainingLessons[i].order = i + 1;
      await remainingLessons[i].save();
    }
    
    res.status(200).json({ message: 'Lesson deleted successfully' });
  } catch (error) {
    console.error('Error deleting lesson:', error);
    res.status(500).json({ message: error.message });
  }
});

/**
 * Direct lesson creation without auth
 * Route: POST /api/lessons/direct
 */
router.post('/lessons/direct', async (req, res) => {
  try {
    const { title, content, videoUrl, courseId, instructorId, duration } = req.body;
    
    if (!title || !courseId || !instructorId) {
      return res.status(400).json({ message: 'Title, course ID, and instructor ID are required' });
    }
    
    // Find the course
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }
    
    // Get current max order to determine new lesson order
    const maxOrderLesson = await Lesson.findOne({ course: courseId }).sort({ order: -1 });
    const newOrder = maxOrderLesson ? maxOrderLesson.order + 1 : 1;
    
    // Create new lesson
    const lesson = new Lesson({
      title: title,
      content: content || 'Lesson content will be added soon.',
      videoUrl: videoUrl || '',
      duration: duration || 0,
      order: newOrder,
      isPreview: true, // Default to preview for direct creation
      course: courseId
    });
    
    await lesson.save();
    
    console.log(`Lesson created directly: ${title} for course ${courseId}`);
    
    res.status(201).json(lesson);
  } catch (error) {
    console.error('Error creating lesson directly:', error);
    res.status(500).json({ message: error.message });
  }
});

export default router;