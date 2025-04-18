import express from 'express';
import { protect, authorize } from '../middleware/auth.js';
import Course from '../../models/Course.js';
import Lesson from '../../models/Lesson.js';

const router = express.Router();

// @route   GET /api/courses
// @desc    Get all courses
// @access  Public
router.get('/', async (req, res) => {
  try {
    const courses = await Course.find()
      .populate({
        path: 'instructor',
        select: 'name profileImage'
      });
    
    res.json(courses);
  } catch (error) {
    console.error('Get courses error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   GET /api/courses/:id
// @desc    Get course by ID
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    console.log(`Getting course details for course ID: ${req.params.id}`);
    
    // Support both numeric IDs and MongoDB ObjectIds
    let course;
    
    // First try to find directly, assuming it's a valid ObjectId
    try {
      if (req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
        course = await Course.findById(req.params.id)
          .populate({
            path: 'instructor',
            select: 'name profileImage bio'
          });
      }
    } catch (err) {
      console.log(`Error finding course by ObjectId: ${err.message}`);
    }
    
    // If not found, try to find by numeric ID field if your schema supports it
    if (!course) {
      course = await Course.findOne({ id: parseInt(req.params.id) })
        .populate({
          path: 'instructor',
          select: 'name profileImage bio'
        });
    }
    
    if (!course) {
      console.log(`Course ${req.params.id} not found in get course detail`);
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }
    
    console.log(`Found course:`, course);
    res.json(course);
  } catch (error) {
    console.error('Get course error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   POST /api/courses
// @desc    Create a new course
// @access  Private/Instructor
router.post('/', protect, authorize('instructor'), async (req, res) => {
  try {
    const {
      title,
      description,
      price,
      category,
      level,
      imageUrl,
      requirements,
      objectives
    } = req.body;
    
    const course = await Course.create({
      title,
      description,
      price,
      category,
      level,
      imageUrl,
      requirements,
      objectives,
      instructor: req.user._id
    });
    
    res.status(201).json(course);
  } catch (error) {
    console.error('Create course error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   PUT /api/courses/:id
// @desc    Update a course
// @access  Private/Instructor
router.put('/:id', protect, authorize('instructor'), async (req, res) => {
  try {
    // Find course
    let course = await Course.findById(req.params.id);
    
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }
    
    // Make sure user is the course instructor
    if (course.instructor.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this course'
      });
    }
    
    // Update course
    course = await Course.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: Date.now() },
      { new: true, runValidators: true }
    );
    
    res.json(course);
  } catch (error) {
    console.error('Update course error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   DELETE /api/courses/:id
// @desc    Delete a course
// @access  Private/Instructor
router.delete('/:id', protect, authorize('instructor'), async (req, res) => {
  try {
    // Find course
    const course = await Course.findById(req.params.id);
    
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }
    
    // Make sure user is the course instructor
    if (course.instructor.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this course'
      });
    }
    
    // Delete related lessons first
    await Lesson.deleteMany({ course: course._id });
    
    // Delete course using findByIdAndDelete (modern approach)
    await Course.findByIdAndDelete(course._id);
    
    res.json({
      success: true,
      message: 'Course deleted'
    });
  } catch (error) {
    console.error('Delete course error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   GET /api/courses/:courseId/lessons
// @desc    Get lessons for a course
// @access  Public
router.get('/:courseId/lessons', async (req, res) => {
  try {
    console.log(`Getting lessons for course ID: ${req.params.courseId}`);
    
    // First check if the course exists
    let course;
    
    // Try to find course directly, assuming it's a valid ObjectId
    try {
      if (req.params.courseId.match(/^[0-9a-fA-F]{24}$/)) {
        course = await Course.findById(req.params.courseId);
      }
    } catch (err) {
      console.log(`Error finding course by ObjectId: ${err.message}`);
    }
    
    // If not found, try to find by numeric ID field if your schema supports it
    if (!course) {
      course = await Course.findOne({ id: parseInt(req.params.courseId) });
    }
    
    if (!course) {
      console.log(`Course ${req.params.courseId} not found when getting lessons`);
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }
    
    console.log(`Found course for lessons:`, course);
    
    // Now get lessons for the course using the course's _id
    console.log(`Getting lessons for course ${course._id} from storage`);
    const lessons = await Lesson.find({ course: course._id })
      .sort('section order');
    
    console.log(`Found ${lessons.length} lessons for course ${req.params.courseId}`);
    res.json(lessons);
  } catch (error) {
    console.error('Get lessons error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   POST /api/courses/:courseId/lessons
// @desc    Add a lesson to a course
// @access  Private/Instructor
router.post('/:courseId/lessons', protect, authorize('instructor'), async (req, res) => {
  try {
    // Find course
    const course = await Course.findById(req.params.courseId);
    
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }
    
    // Make sure user is the course instructor
    if (course.instructor.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to add lessons to this course'
      });
    }
    
    // Create lesson
    const lesson = await Lesson.create({
      ...req.body,
      course: req.params.courseId
    });
    
    res.status(201).json(lesson);
  } catch (error) {
    console.error('Create lesson error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   GET /api/courses/instructor/courses
// @desc    Get instructor's courses
// @access  Private/Instructor
router.get('/instructor/courses', protect, authorize('instructor'), async (req, res) => {
  try {
    const courses = await Course.find({ instructor: req.user._id })
      .sort({ createdAt: -1 }); // Sort by newest first
    
    console.log('Found instructor courses:', courses.length);
    res.json(courses);
  } catch (error) {
    console.error('Get instructor courses error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

export default router;