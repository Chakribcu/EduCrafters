import { createServer } from 'http';
import jwt from 'jsonwebtoken';
import Stripe from 'stripe';
import bcrypt from 'bcryptjs';
// We'll use a simpler approach for cookie parsing without the external package
import { storage } from './storage.js';
import persistSession from './middleware/persistSession.js';
import directEnrollmentRoutes from './routes/directEnrollments.js';

// Import models - we'll use these for MongoDB integration later
// Currently using in-memory storage through storage.js
import Course from '../models/Course.js';
import Lesson from '../models/Lesson.js';
import User from '../models/User.js';
import Enrollment from '../models/Enrollment.js';

// Import routes
import analyticsRoutes from './routes/analytics.js';
import reviewsRoutes from './routes/reviews.js';
import usersRoutes from './routes/users.js';
import clerkAuthRoutes from './routes/clerkAuth.js';
import paymentsRoutes from './routes/payments.js';
import enrollmentsRoutes from './routes/enrollments.js';
import lessonsRoutes from './routes/lessons.js';
import directEnrollmentsRoutes from './routes/directEnrollments.js';
import enrollmentStatusRoutes from './routes/enrollmentStatus.js';
import paymentProcessorRoutes from './routes/paymentProcessor.js';
import userProfileRoutes from './routes/userProfile.js';

// Check for Stripe secret key
if (!process.env.STRIPE_SECRET_KEY) {
  console.warn('Missing STRIPE_SECRET_KEY. Payment features will not work correctly.');
}

// Initialize Stripe
const stripe = process.env.STRIPE_SECRET_KEY ? 
  new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: "2023-10-16",
  }) : null;

// Helper to hash passwords
const hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(password, salt);
};

// Helper to compare passwords
const comparePassword = async (candidatePassword, userPassword) => {
  return await bcrypt.compare(candidatePassword, userPassword);
};

// Middleware for authentication
const authMiddleware = async (req, res, next) => {
  try {
    let token;
    
    // Check for token in authorization header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }
    
    // If no token in header, check cookies
    if (!token && req.cookies?.authToken) {
      token = req.cookies.authToken;
    }
    
    if (!token) {
      return res.status(401).json({ message: 'Not authorized, no token' });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret123');
    const user = await storage.getUser(decoded.id);
    
    if (!user) {
      return res.status(401).json({ message: 'Not authorized, user not found' });
    }
    
    req.user = user;
    next();
  } catch (error) {
    console.error('Auth error:', error);
    return res.status(401).json({ message: 'Not authorized, invalid token' });
  }
};

// Middleware for instructor role check
const instructorMiddleware = (req, res, next) => {
  if (req.user && req.user.role === 'instructor') {
    next();
  } else {
    res.status(403).json({ message: 'Not authorized as an instructor' });
  }
};

// Register all API routes
async function registerRoutes(app) {
  // Custom cookie parser middleware - no external dependency
  app.use('/api/direct-enroll', directEnrollmentRoutes);
  app.use((req, res, next) => {
    const cookies = {};
    const cookieHeader = req.headers.cookie;
    
    if (cookieHeader) {
      cookieHeader.split(';').forEach(cookie => {
        const parts = cookie.split('=');
        const name = parts[0].trim();
        const value = parts.slice(1).join('=').trim();
        cookies[name] = value;
      });
    }
    
    req.cookies = cookies;
    
    // Add cookie helper to response
    res.cookie = (name, value, options = {}) => {
      const cookieStr = `${name}=${value}`;
      const parts = [];
      
      if (options.maxAge) {
        parts.push(`Max-Age=${Math.floor(options.maxAge / 1000)}`);
      }
      
      if (options.httpOnly) {
        parts.push('HttpOnly');
      }
      
      if (options.secure) {
        parts.push('Secure');
      }
      
      if (options.sameSite) {
        parts.push(`SameSite=${options.sameSite}`);
      }
      
      if (parts.length) {
        res.setHeader('Set-Cookie', `${cookieStr}; ${parts.join('; ')}`);
      } else {
        res.setHeader('Set-Cookie', cookieStr);
      }
      
      return res;
    };
    
    // Add clearCookie helper to response
    res.clearCookie = (name) => {
      res.setHeader('Set-Cookie', `${name}=; Max-Age=0; Path=/`);
      return res;
    };
    
    next();
  });
  
  // Use session persistence middleware
  app.use(persistSession);
  
  // Logging middleware
  app.use((req, _res, next) => {
    console.log(`${req.method} ${req.url}`);
    next();
  });
  
  // Register analytics routes
  app.use('/api/analytics', analyticsRoutes);
  
  // Register reviews routes
  app.use('/api/reviews', reviewsRoutes);
  
  // Register users routes
  usersRoutes(app);
  
  // Register Clerk auth routes
  app.use('/api/auth', clerkAuthRoutes);
  
  // Register payment routes
  app.use('/api/payments', paymentsRoutes);
  
  // Register enrollment routes
  app.use('/api', enrollmentsRoutes);
  
  // Register lessons routes
  app.use('/api', lessonsRoutes);
  
  // Register direct enrollment routes
  app.use('/api', directEnrollmentsRoutes);
  
  // Register enrollment status routes
  app.use('/api', enrollmentStatusRoutes);
  
  // Register payment processor routes
  app.use('/api', paymentProcessorRoutes);
  
  // Register user profile routes
  app.use('/api', userProfileRoutes);
  
  // User Registration
  app.post('/api/auth/register', async (req, res) => {
    try {
      const { name, email, password, role } = req.body;
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: 'User already exists' });
      }
      
      // Hash the password
      const hashedPassword = await hashPassword(password);
      
      // Create user
      const user = await storage.createUser({
        name,
        email,
        password: hashedPassword,
        role: role || 'student'
      });
      
      // Generate JWT token
      const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET || 'secret123', {
        expiresIn: '30d'
      });
      
      res.status(201).json({
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role
        }
      });
    } catch (error) {
      console.error('Register error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });
  
  // User Login
  app.post('/api/auth/login', async (req, res) => {
    try {
      console.log('Login attempt:', req.body.email);
      const { email, password } = req.body;
      
      // Get user by email
      const user = await storage.getUserByEmail(email);
      if (!user) {
        console.log('User not found:', email);
        return res.status(401).json({ message: 'Invalid credentials' });
      }
      
      console.log('User found:', user.email, 'Storage type:', global.dbType);
      
      let isMatch = false;
      
      // If we're using in-memory demo data with plain text passwords
      if (global.dbType === 'memory' && !user.password.includes('$')) {
        // For demo data - direct comparison (not secure, but only for demo)
        isMatch = password === user.password;
        console.log('Using in-memory password comparison:', isMatch);
      } else {
        // Normal hashed password comparison
        isMatch = await comparePassword(password, user.password);
        console.log('Using bcrypt password comparison:', isMatch);
      }
      
      if (!isMatch) {
        console.log('Password mismatch for user:', email);
        return res.status(401).json({ message: 'Invalid credentials' });
      }
      
      // Generate JWT token
      const userId = user.id || user._id; // Handle both storage types
      const token = jwt.sign({ id: userId }, process.env.JWT_SECRET || 'secret123', {
        expiresIn: '30d'
      });
      
      console.log('Login successful for user:', email);
      
      // Set cookie for session persistence
      res.cookie('authToken', token, {
        httpOnly: true,
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax'
      });
      
      res.json({
        token,
        user: {
          id: userId,
          name: user.name,
          email: user.email,
          role: user.role
        }
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });
  
  // Get current user
  app.get('/api/auth/user', authMiddleware, async (req, res) => {
    try {
      res.json({
        id: req.user.id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role,
        profileImage: req.user.profileImage,
        bio: req.user.bio
      });
    } catch (error) {
      console.error('Get user error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });
  
  // User Logout
  app.post('/api/auth/logout', (req, res) => {
    try {
      // Clear the authentication cookie
      res.clearCookie('authToken');
      console.log('User logged out successfully');
      res.json({ message: 'Logged out successfully' });
    } catch (error) {
      console.error('Logout error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });
  
  // Create a course
  app.post('/api/courses', authMiddleware, instructorMiddleware, async (req, res) => {
    try {
      const courseData = {
        ...req.body,
        instructorId: req.user.id
      };
      
      const course = await storage.createCourse(courseData);
      res.status(201).json(course);
    } catch (error) {
      console.error('Create course error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });
  
  // Add a test endpoint
  app.get('/api/test', (req, res) => {
    res.json({ message: 'API is working' });
  });
  
  // Get Stripe public key configuration
  app.get('/api/stripe-config', (req, res) => {
    if (!process.env.VITE_STRIPE_PUBLIC_KEY) {
      return res.status(500).json({ error: 'Stripe public key is not configured' });
    }
    res.json({ publicKey: process.env.VITE_STRIPE_PUBLIC_KEY });
  });

  // Get all courses
  app.get('/api/courses', async (req, res) => {
    try {
      const courses = await storage.getCourses();
      res.json(courses);
    } catch (error) {
      console.error('Get courses error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });
  
  // Get a course by ID
  app.get('/api/courses/:id', async (req, res) => {
    try {
      let courseId = req.params.id;
      console.log(`Getting course details for course ID: ${courseId}`);
      
      // Try to parse course ID as integer for in-memory storage
      if (!isNaN(parseInt(courseId))) {
        courseId = parseInt(courseId);
      }
      
      const course = await storage.getCourse(courseId);
      
      if (!course) {
        console.log(`Course ${courseId} not found in get course detail`);
        return res.status(404).json({ message: 'Course not found' });
      }
      
      console.log(`Found course:`, course);
      
      // Get instructor details if available
      let instructorData = null;
      if (course.instructorId || course.instructor) {
        const instructorId = course.instructorId || course.instructor;
        const instructor = await storage.getUser(instructorId);
        if (instructor) {
          instructorData = {
            id: instructor.id || instructor._id,
            name: instructor.name,
            email: instructor.email,
            profileImage: instructor.profileImage || null
          };
        }
      }
      
      // Include instructor data in response
      const courseWithInstructor = {
        ...course,
        instructor: instructorData
      };
      
      res.json(courseWithInstructor);
    } catch (error) {
      console.error('Get course error:', error);
      res.status(500).json({ 
        message: 'Server error',
        details: error.message 
      });
    }
  });
  
  // Update a course
  app.put('/api/courses/:id', authMiddleware, instructorMiddleware, async (req, res) => {
    try {
      let courseId = req.params.id;
      console.log(`Attempting to update course ${courseId}`);
      
      // Try to parse course ID as integer for in-memory storage
      if (!isNaN(parseInt(courseId))) {
        courseId = parseInt(courseId);
      }
      
      const course = await storage.getCourse(courseId);
      
      if (!course) {
        console.log(`Course ${courseId} not found for update`);
        return res.status(404).json({ message: 'Course not found' });
      }
      
      console.log(`Found course for update:`, course);
      
      // Check if user is the instructor of the course
      const instructorId = course.instructorId || course.instructor;
      const userId = req.user._id || req.user.id;
      
      console.log(`Checking authorization: course instructor ${instructorId}, current user ${userId}`);
      
      if (instructorId != userId) {
        console.log(`User ${userId} not authorized to update course ${courseId}`);
        return res.status(403).json({ message: 'Not authorized to update this course' });
      }
      
      console.log(`Updating course ${courseId} with data:`, req.body);
      const updatedCourse = await storage.updateCourse(courseId, req.body);
      
      console.log(`Course ${courseId} updated successfully:`, updatedCourse);
      res.json(updatedCourse);
    } catch (error) {
      console.error('Update course error:', error);
      res.status(500).json({ 
        message: 'Server error',
        details: error.message 
      });
    }
  });
  
  // Delete a course
  app.delete('/api/courses/:id', authMiddleware, instructorMiddleware, async (req, res) => {
    try {
      let courseId = req.params.id;
      console.log(`Attempting to delete course ${courseId}`);
      
      // Try to parse course ID as integer for in-memory storage
      if (!isNaN(parseInt(courseId))) {
        courseId = parseInt(courseId);
      }
      
      const course = await storage.getCourse(courseId);
      
      if (!course) {
        console.log(`Course ${courseId} not found for deletion`);
        return res.status(404).json({ message: 'Course not found' });
      }
      
      console.log(`Found course for deletion:`, course);
      
      // Check if user is the instructor of the course
      const instructorId = course.instructorId || course.instructor;
      const userId = req.user._id || req.user.id;
      
      console.log(`Checking authorization: course instructor ${instructorId}, current user ${userId}`);
      
      if (instructorId != userId) {
        console.log(`User ${userId} not authorized to delete course ${courseId}`);
        return res.status(403).json({ message: 'Not authorized to delete this course' });
      }
      
      // Delete the course (storage.deleteCourse already handles lessons and enrollments)
      console.log(`Deleting course ${courseId}`);
      const deleted = await storage.deleteCourse(courseId);
      
      if (deleted) {
        console.log(`Course ${courseId} deleted successfully`);
        res.json({ message: 'Course deleted' });
      } else {
        console.log(`Failed to delete course ${courseId}`);
        res.status(500).json({ message: 'Failed to delete course' });
      }
    } catch (error) {
      console.error('Delete course error:', error);
      res.status(500).json({ 
        message: 'Server error',
        details: error.message 
      });
    }
  });
  
  // Get instructor courses
  app.get('/api/instructor/courses', authMiddleware, instructorMiddleware, async (req, res) => {
    try {
      const userId = req.user._id || req.user.id;
      console.log(`Getting courses for instructor ${userId}`);
      
      const courses = await storage.getCoursesByInstructor(userId);
      console.log(`Found ${courses.length} courses for instructor ${userId}`);
      res.json(courses);
    } catch (error) {
      console.error('Get instructor courses error:', error);
      res.status(500).json({ 
        message: 'Server error',
        details: error.message 
      });
    }
  });
  
  // Get student enrollments
  app.get('/api/student/enrollments', authMiddleware, async (req, res) => {
    try {
      const userId = req.user._id || req.user.id;
      console.log(`Getting enrollments for student ${userId}`);
      
      const enrollments = await storage.getEnrollmentsByUser(userId);
      console.log(`Found ${enrollments.length} enrollments for student ${userId}`);
      
      // Enrich enrollments with course details
      const enrichedEnrollments = await Promise.all(
        enrollments.map(async (enrollment) => {
          let courseId = enrollment.courseId;
          // Parse course ID for in-memory storage if needed
          if (!isNaN(parseInt(courseId))) {
            courseId = parseInt(courseId);
          }
          
          const course = await storage.getCourse(courseId);
          return {
            ...enrollment,
            course
          };
        })
      );
      
      res.json(enrichedEnrollments);
    } catch (error) {
      console.error('Get student enrollments error:', error);
      res.status(500).json({ 
        message: 'Server error',
        details: error.message 
      });
    }
  });
  
  // Create a lesson
  app.post('/api/courses/:courseId/lessons', authMiddleware, instructorMiddleware, async (req, res) => {
    try {
      let courseId = req.params.courseId;
      
      // Try to parse course ID as integer for in-memory storage
      if (!isNaN(parseInt(courseId))) {
        courseId = parseInt(courseId);
      }
      
      console.log(`Creating lesson for course ${courseId} by user ${req.user._id || req.user.id}`);
      
      // Get the course using our storage interface
      const course = await storage.getCourse(courseId);
      
      if (!course) {
        console.log(`Course ${courseId} not found`);
        return res.status(404).json({ message: 'Course not found' });
      }
      
      // Check if user is the instructor of the course
      const instructorId = course.instructorId || course.instructor;
      const userId = req.user._id || req.user.id;
      
      if (instructorId != userId) {
        console.log(`User ${userId} is not authorized to add lessons to course ${courseId}. Expected instructor: ${instructorId}`);
        return res.status(403).json({ message: 'Not authorized to add lessons to this course' });
      }
      
      // Create the lesson data
      const lessonData = {
        ...req.body,
        courseId: courseId
      };
      
      // Create the lesson using our storage interface
      const lesson = await storage.createLesson(lessonData);
      console.log(`Lesson created:`, lesson);
      
      res.status(201).json(lesson);
    } catch (error) {
      console.error('Create lesson error:', error);
      res.status(500).json({ 
        message: 'Server error',
        details: error.message 
      });
    }
  });
  
  // Get lessons for a course
  app.get('/api/courses/:courseId/lessons', async (req, res) => {
    try {
      let courseId = req.params.courseId;
      console.log(`Getting lessons for course ID: ${courseId}`);
      
      // Try to parse course ID as integer for in-memory storage
      if (!isNaN(parseInt(courseId))) {
        courseId = parseInt(courseId);
      }
      
      // Get the course first to ensure it exists
      const course = await storage.getCourse(courseId);
      
      if (!course) {
        console.log(`Course ${courseId} not found when getting lessons`);
        return res.status(404).json({ message: 'Course not found' });
      }

      console.log(`Found course for lessons:`, course);
      
      // Always use storage abstraction
      console.log(`Getting lessons for course ${courseId} from storage`);
      const lessons = await storage.getLessonsForCourse(courseId);
      console.log(`Found ${lessons.length} lessons for course ${courseId}`);
      
      res.json(lessons);
    } catch (error) {
      console.error('Get lessons error:', error);
      res.status(500).json({ 
        message: 'Server error',
        details: error.message
      });
    }
  });
  
  // Update a lesson
  app.put('/api/lessons/:id', authMiddleware, instructorMiddleware, async (req, res) => {
    try {
      const lesson = await Lesson.findById(req.params.id);
      
      if (!lesson) {
        return res.status(404).json({ message: 'Lesson not found' });
      }
      
      // Get the course
      const course = await Course.findById(lesson.course);
      
      if (!course) {
        return res.status(404).json({ message: 'Course not found' });
      }
      
      // Check if user is the instructor of the course
      if (course.instructor.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'Not authorized to update this lesson' });
      }
      
      // Update the course duration if the lesson duration changes
      if (req.body.duration && req.body.duration !== lesson.duration) {
        course.totalDuration = course.totalDuration - lesson.duration + parseInt(req.body.duration);
        await course.save();
      }
      
      const updatedLesson = await Lesson.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true
      });
      
      res.json(updatedLesson);
    } catch (error) {
      console.error('Update lesson error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });
  
  // Delete a lesson
  app.delete('/api/lessons/:id', authMiddleware, instructorMiddleware, async (req, res) => {
    try {
      const lesson = await Lesson.findById(req.params.id);
      
      if (!lesson) {
        return res.status(404).json({ message: 'Lesson not found' });
      }
      
      // Get the course
      const course = await Course.findById(lesson.course);
      
      if (!course) {
        return res.status(404).json({ message: 'Course not found' });
      }
      
      // Check if user is the instructor of the course
      if (course.instructor.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'Not authorized to delete this lesson' });
      }
      
      // Update course stats
      course.totalLessons -= 1;
      course.totalDuration -= lesson.duration;
      await course.save();
      
      // Delete the lesson
      await lesson.deleteOne();
      
      // Re-order remaining lessons
      const remainingLessons = await Lesson.find({ course: course._id }).sort('order');
      for (let i = 0; i < remainingLessons.length; i++) {
        remainingLessons[i].order = i + 1;
        await remainingLessons[i].save();
      }
      
      res.json({ message: 'Lesson deleted' });
    } catch (error) {
      console.error('Delete lesson error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });
  
  // Enroll in a course
  app.post('/api/courses/:courseId/enroll', authMiddleware, async (req, res) => {
    try {
      // Parse course ID
      const courseId = parseInt(req.params.courseId);
      console.log(`Enrollment attempt for course ${courseId} by user ${req.user.id}`);
      
      // Check if course exists using storage
      const course = await storage.getCourse(courseId);
      if (!course) {
        console.log(`Course ${courseId} not found`);
        return res.status(404).json({ message: 'Course not found' });
      }
      
      // Check if already enrolled using storage
      const existingEnrollment = await storage.getEnrollment(req.user.id, courseId);
      
      if (existingEnrollment) {
        console.log(`User ${req.user.id} already enrolled in course ${courseId}`);
        return res.status(400).json({ message: 'Already enrolled in this course' });
      }
      
      // Create enrollment using storage
      const enrollment = await storage.createEnrollment({
        userId: req.user.id,
        courseId: courseId,
        progress: 0,
        completed: false,
        paymentStatus: course.price === 0 ? 'completed' : 'pending'
      });
      
      console.log(`User ${req.user.id} successfully enrolled in course ${courseId}`);
      
      // Get the course details to include in the response
      const courseDetails = {
        id: course.id,
        title: course.title,
        description: course.description,
        imageUrl: course.imageUrl,
        price: course.price,
        level: course.level
      };
      
      // Include course details in the response
      const enrichedEnrollment = {
        ...enrollment,
        course: courseDetails
      };
      
      res.status(201).json(enrichedEnrollment);
    } catch (error) {
      console.error('Enroll error:', error);
      res.status(500).json({ 
        message: 'Server error',
        details: error.message
      });
    }
  });
  
  // User enrollments now handled by enrollments router at /api/enrollments
  
  // Update enrollment progress
  app.put('/api/enrollments/:id/progress', authMiddleware, async (req, res) => {
    try {
      const enrollmentId = parseInt(req.params.id);
      const { progress, completedLessonId } = req.body;
      
      // Find the enrollment
      const enrollment = await storage.getEnrollment(req.user.id, enrollmentId);
      
      if (!enrollment) {
        return res.status(404).json({ message: 'Enrollment not found' });
      }
      
      // Update progress
      const updatedEnrollment = await storage.updateEnrollmentProgress(enrollmentId, progress);
      
      res.json(updatedEnrollment);
    } catch (error) {
      console.error('Update progress error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });
  
  // Create a payment intent for Stripe
  app.post('/api/create-payment-intent', authMiddleware, async (req, res) => {
    try {
      if (!stripe) {
        return res.status(500).json({ message: 'Stripe is not configured' });
      }
      
      const { courseId } = req.body;
      
      // Get course details
      const course = await Course.findById(courseId);
      if (!course) {
        return res.status(404).json({ message: 'Course not found' });
      }
      
      // Get enrollment
      const enrollment = await Enrollment.findOne({
        user: req.user._id,
        course: courseId
      });
      
      if (!enrollment) {
        return res.status(404).json({ message: 'Enrollment not found' });
      }
      
      if (enrollment.paymentStatus === 'completed') {
        return res.status(400).json({ message: 'Payment already completed' });
      }
      
      // Convert price to cents for Stripe
      const amount = Math.round(course.price * 100);
      
      // Create payment intent
      const paymentIntent = await stripe.paymentIntents.create({
        amount,
        currency: 'usd',
        metadata: {
          courseId: course._id.toString(),
          userId: req.user._id.toString(),
          enrollmentId: enrollment._id.toString()
        }
      });
      
      res.json({
        clientSecret: paymentIntent.client_secret
      });
    } catch (error) {
      console.error('Create payment intent error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });
  
  // Webhook for Stripe events
  app.post('/api/stripe-webhook', async (req, res) => {
    try {
      if (!stripe) {
        return res.status(500).json({ message: 'Stripe is not configured' });
      }
      
      const sig = req.headers['stripe-signature'];
      let event;
      
      // Verify the event came from Stripe
      try {
        event = stripe.webhooks.constructEvent(
          req.body,
          sig,
          process.env.STRIPE_WEBHOOK_SECRET
        );
      } catch (err) {
        console.error('Webhook signature verification failed:', err);
        return res.status(400).send(`Webhook Error: ${err.message}`);
      }
      
      // Handle the event
      if (event.type === 'payment_intent.succeeded') {
        const paymentIntent = event.data.object;
        
        // Update enrollment payment status
        const enrollmentId = paymentIntent.metadata.enrollmentId;
        const enrollment = await Enrollment.findById(enrollmentId);
        
        if (enrollment) {
          enrollment.paymentStatus = 'completed';
          enrollment.paymentId = paymentIntent.id;
          await enrollment.save();
          
          console.log(`Payment for enrollment ${enrollmentId} completed successfully`);
        }
      }
      
      res.json({ received: true });
    } catch (error) {
      console.error('Webhook error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });
  
  // Add a route to seed the database with demo data
  app.get('/api/seed', (req, res) => {
    try {
      console.log('Running seed script...');
      
      // Using already imported models (we imported them at the top of the file)
      // No need to import again since we're using these:
      // import Course from '../models/Course.js';
      // import Lesson from '../models/Lesson.js';
      // import User from '../models/User.js';
      // import Enrollment from '../models/Enrollment.js';
      
      // Create demo instructor
      const createInstructor = async () => {
        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('password123', salt);
        
        // Check if instructor already exists
        const existingInstructor = await User.findOne({ email: 'chakridhar@example.com' });
        if (existingInstructor) {
          return existingInstructor;
        }
        
        // Create new instructor
        const instructor = new User({
          name: 'Jakkula Chakridhar',
          email: 'chakridhar@example.com',
          password: hashedPassword,
          role: 'instructor',
          profileImage: 'https://randomuser.me/api/portraits/men/32.jpg',
          bio: 'Experienced full-stack developer and educator with a passion for teaching web development and programming'
        });
        
        await instructor.save();
        return instructor;
      };
      
      // Create demo courses
      const createCourses = async (instructor) => {
        // Check if courses already exist
        const existingCourses = await Course.find({ instructor: instructor._id });
        if (existingCourses.length > 0) {
          return existingCourses;
        }
        
        // Create courses
        const webDevCourse = new Course({
          title: 'Web Development Fundamentals',
          description: 'Learn the fundamentals of web development including HTML, CSS, and JavaScript. This course covers everything you need to know to get started building websites.',
          category: 'web-development',
          price: 49.99,
          level: 'beginner',
          thumbnail: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?ixlib=rb-1.2.1&auto=format&fit=crop&w=1352&q=80',
          instructor: instructor._id,
          totalDuration: 840, // 14 hours
          totalLessons: 5,
          isPublished: true
        });
        
        const reactCourse = new Course({
          title: 'React.js Masterclass',
          description: 'Master React.js by building real-world applications. This comprehensive course covers React hooks, context API, Redux, and more.',
          category: 'web-development',
          price: 79.99,
          level: 'intermediate',
          thumbnail: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80',
          instructor: instructor._id,
          totalDuration: 960, // 16 hours
          totalLessons: 5,
          isPublished: true
        });
        
        await webDevCourse.save();
        await reactCourse.save();
        
        return [webDevCourse, reactCourse];
      };
      
      // Create lessons for courses
      const createLessons = async (courses) => {
        for (const course of courses) {
          // Check if lessons already exist
          const existingLessons = await Lesson.find({ course: course._id });
          if (existingLessons.length > 0) {
            continue;
          }
          
          // Create 5 lessons per course
          for (let i = 1; i <= 5; i++) {
            const lesson = new Lesson({
              title: `Lesson ${i}: ${i === 1 ? 'Introduction' : 'Topic ' + i}`,
              description: `Detailed description for Lesson ${i} in the ${course.title} course.`,
              content: `<div class="lesson-content">
                <h2>Welcome to Lesson ${i}</h2>
                <p>This is the main content for lesson ${i} in the ${course.title} course.</p>
                <h3>Key Takeaways</h3>
                <ul>
                  <li>Important concept 1</li>
                  <li>Important concept 2</li>
                  <li>Important concept 3</li>
                </ul>
                <h3>Practice Exercises</h3>
                <p>Make sure to complete the practice exercises for this lesson!</p>
              </div>`,
              videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ', // Placeholder video
              duration: 30, // 30 minutes
              course: course._id,
              order: i,
              section: i <= 2 ? 'Getting Started' : 'Advanced Topics',
              isFree: i === 1 // First lesson is free
            });
            
            await lesson.save();
          }
        }
      };
      
      // Create demo student
      const createStudent = async () => {
        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('password123', salt);
        
        // Check if student already exists
        const existingStudent = await User.findOne({ email: 'student@example.com' });
        if (existingStudent) {
          return existingStudent;
        }
        
        // Create new student
        const student = new User({
          name: 'John Student',
          email: 'student@example.com',
          password: hashedPassword,
          role: 'student',
          profileImage: 'https://randomuser.me/api/portraits/men/22.jpg',
          bio: 'Aspiring developer interested in learning web development and programming'
        });
        
        await student.save();
        return student;
      };
      
      // Execute seeding process
      (async () => {
        try {
          const instructor = await createInstructor();
          console.log('Instructor created:', instructor.name);
          
          const courses = await createCourses(instructor);
          console.log('Courses created:', courses.length);
          
          await createLessons(courses);
          console.log('Lessons created for all courses');
          
          const student = await createStudent();
          console.log('Student created:', student.name);
          
          // Create enrollments for student
          const enrollment1 = new Enrollment({
            user: student._id,
            course: courses[0]._id,
            progress: 40,
            completed: false,
            paymentStatus: 'completed',
            enrolledAt: new Date(),
            lastAccessedAt: new Date()
          });
          
          await enrollment1.save();
          
          res.json({
            success: true,
            message: 'Database seeded successfully',
            demoAccounts: {
              instructor: {
                email: 'chakridhar@example.com',
                password: 'password123'
              },
              student: {
                email: 'student@example.com',
                password: 'password123'
              }
            }
          });
        } catch (error) {
          console.error('Seed error:', error);
          res.status(500).json({ 
            success: false,
            message: 'Error seeding database',
            error: error.message
          });
        }
      })();
    } catch (error) {
      console.error('Seed route error:', error);
      res.status(500).json({ 
        success: false,
        message: 'Error in seed route',
        error: error.message
      });
    }
  });
  
  // Create HTTP server
  const httpServer = createServer(app);
  
  return httpServer;
}

export { registerRoutes };