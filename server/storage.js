/**
 * Storage implementation
 * Created by Chakridhar - April 2025
 * 
 * This file provides storage classes for both in-memory (for development)
 * and MongoDB (for production) data persistence.
 */
import mongoose from 'mongoose';
import MongoDBStorage from './mongodb.js';

// Check if MongoDB is connected
const isMongoConnected = () => {
  return mongoose.connection.readyState === 1;
};

// Determine if we should use MongoDB storage
// We'll prioritize MongoDB if the connection is available
let useMongoStorage = isMongoConnected();
// Force MongoDB usage if globally set
if (global.dbType === 'mongodb') {
  useMongoStorage = true;
  console.log('MongoDB usage enforced by global setting');
}
console.log(`Storage decision: ${useMongoStorage ? 'MongoDB' : 'MemStorage'} (Connection status: ${isMongoConnected() ? 'Connected' : 'Not connected'})`);

// Storage Interface
class MemStorage {
  constructor() {
    this.users = new Map();
    this.courses = new Map();
    this.lessons = new Map();
    this.enrollments = new Map();
    this.reviews = new Map();
    this.userId = 1;
    this.courseId = 1;
    this.lessonId = 1;
    this.enrollmentId = 1;
    this.reviewId = 1;
    
    // Add some sample data
    this._initSampleData();
  }
  
  // User methods
  async getUser(id) {
    return this.users.get(id);
  }
  
  async getUserByEmail(email) {
    for (const user of this.users.values()) {
      if (user.email === email) {
        return user;
      }
    }
    return undefined;
  }
  
  async createUser(userData) {
    const id = this.userId++;
    const user = { 
      id, 
      ...userData,
      isActive: true,
      settings: {
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
      },
      createdAt: new Date().toISOString()
    };
    this.users.set(id, user);
    return user;
  }
  
  async updateUser(id, updateData) {
    const user = this.users.get(id);
    if (!user) return null;
    
    const updatedUser = {
      ...user,
      ...updateData,
      updatedAt: new Date().toISOString()
    };
    
    this.users.set(id, updatedUser);
    return updatedUser;
  }
  
  async updateUserSettings(id, settingsData) {
    const user = this.users.get(id);
    if (!user) return null;
    
    // Initialize settings object if it doesn't exist
    if (!user.settings) {
      user.settings = {};
    }
    
    // Update nested settings
    for (const [key, value] of Object.entries(settingsData)) {
      const parts = key.split('.');
      let current = user;
      
      // Navigate to the nested property
      for (let i = 0; i < parts.length - 1; i++) {
        const part = parts[i];
        if (!current[part]) {
          current[part] = {};
        }
        current = current[part];
      }
      
      // Set the value
      current[parts[parts.length - 1]] = value;
    }
    
    user.updatedAt = new Date().toISOString();
    this.users.set(id, user);
    return user;
  }
  
  async deleteUser(id) {
    if (!this.users.has(id)) return false;
    
    // Delete all user enrollments
    for (const [enrollmentId, enrollment] of this.enrollments.entries()) {
      if (enrollment.userId === id) {
        this.enrollments.delete(enrollmentId);
      }
    }
    
    // Delete all user courses if user is instructor
    for (const [courseId, course] of this.courses.entries()) {
      if (course.instructorId === id) {
        // Delete all lessons for this course
        for (const [lessonId, lesson] of this.lessons.entries()) {
          if (lesson.courseId === courseId) {
            this.lessons.delete(lessonId);
          }
        }
        
        // Delete all enrollments for this course
        for (const [enrollmentId, enrollment] of this.enrollments.entries()) {
          if (enrollment.courseId === courseId) {
            this.enrollments.delete(enrollmentId);
          }
        }
        
        // Delete all reviews for this course
        for (const [reviewId, review] of this.reviews.entries()) {
          if (review.courseId === courseId) {
            this.reviews.delete(reviewId);
          }
        }
        
        // Delete the course
        this.courses.delete(courseId);
      }
    }
    
    // Delete all user reviews
    for (const [reviewId, review] of this.reviews.entries()) {
      if (review.userId === id) {
        this.reviews.delete(reviewId);
      }
    }
    
    // Delete the user
    this.users.delete(id);
    return true;
  }
  
  async updateStripeCustomerId(userId, stripeCustomerId) {
    const user = await this.getUser(userId);
    if (!user) return undefined;
    
    const updatedUser = { ...user, stripeCustomerId };
    this.users.set(userId, updatedUser);
    return updatedUser;
  }
  
  // Course methods
  async createCourse(courseData) {
    const id = this.courseId++;
    const course = {
      id,
      ...courseData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.courses.set(id, course);
    return course;
  }
  
  async getCourse(id) {
    return this.courses.get(id);
  }
  
  async getCourses() {
    return Array.from(this.courses.values());
  }
  
  async getCoursesByInstructor(instructorId) {
    return Array.from(this.courses.values()).filter(
      course => course.instructorId === instructorId
    );
  }
  
  async updateCourse(id, courseUpdate) {
    const course = await this.getCourse(id);
    if (!course) return undefined;
    
    const updatedCourse = {
      ...course,
      ...courseUpdate,
      id,
      updatedAt: new Date().toISOString()
    };
    
    this.courses.set(id, updatedCourse);
    return updatedCourse;
  }
  
  async deleteCourse(id) {
    const exists = this.courses.has(id);
    if (exists) {
      this.courses.delete(id);
      
      // Also delete associated lessons
      const courseLessons = await this.getLessonsForCourse(id);
      for (const lesson of courseLessons) {
        this.lessons.delete(lesson.id);
      }
      
      // And delete enrollments
      for (const enrollment of this.enrollments.values()) {
        if (enrollment.courseId === id) {
          this.enrollments.delete(enrollment.id);
        }
      }
      
      return true;
    }
    return false;
  }
  
  // Lesson methods
  async createLesson(lessonData) {
    const id = this.lessonId++;
    
    // Find max order for this course
    const courseLessons = await this.getLessonsForCourse(lessonData.courseId);
    const maxOrder = courseLessons.reduce(
      (max, lesson) => Math.max(max, lesson.order || 0), 
      0
    );
    
    const lesson = {
      id,
      ...lessonData,
      order: lessonData.order || maxOrder + 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    this.lessons.set(id, lesson);
    
    // Update course duration
    const course = await this.getCourse(lessonData.courseId);
    if (course) {
      const totalDuration = courseLessons.reduce(
        (sum, lesson) => sum + (lesson.duration || 0),
        0
      ) + (lessonData.duration || 0);
      
      await this.updateCourse(lessonData.courseId, { duration: totalDuration });
    }
    
    return lesson;
  }
  
  async getLessonsForCourse(courseId) {
    return Array.from(this.lessons.values())
      .filter(lesson => lesson.courseId === courseId)
      .sort((a, b) => a.order - b.order);
  }
  
  // Enrollment methods
  async createEnrollment(enrollmentData) {
    const id = this.enrollmentId++;
    const enrollment = {
      id,
      ...enrollmentData,
      enrolledAt: new Date().toISOString(),
      lastAccessed: new Date().toISOString()
    };
    this.enrollments.set(id, enrollment);
    return enrollment;
  }
  
  async getEnrollment(userId, courseId) {
    for (const enrollment of this.enrollments.values()) {
      if (enrollment.userId === userId && enrollment.courseId === courseId) {
        return enrollment;
      }
    }
    return undefined;
  }
  
  async getEnrollmentsByUser(userId) {
    const enrollments = Array.from(this.enrollments.values())
      .filter(enrollment => enrollment.userId === userId);
    
    // Enrich with course data
    const result = [];
    for (const enrollment of enrollments) {
      const course = await this.getCourse(enrollment.courseId);
      if (course) {
        // Get instructor data
        const instructor = await this.getUser(course.instructorId);
        
        result.push({
          ...enrollment,
          course: {
            id: course.id,
            title: course.title,
            description: course.description,
            imageUrl: course.imageUrl,
            instructor: instructor ? {
              id: instructor.id,
              name: instructor.name
            } : undefined
          }
        });
      }
    }
    
    return result;
  }
  
  async updateEnrollmentProgress(id, progress) {
    const enrollment = this.enrollments.get(id);
    if (!enrollment) return undefined;
    
    const completed = progress >= 100;
    const updatedEnrollment = {
      ...enrollment,
      progress,
      completed,
      lastAccessed: new Date().toISOString()
    };
    
    this.enrollments.set(id, updatedEnrollment);
    return updatedEnrollment;
  }
  
  async updateEnrollmentPaymentStatus(id, paymentIntent, paymentStatus) {
    const enrollment = this.enrollments.get(id);
    if (!enrollment) return undefined;
    
    const updatedEnrollment = {
      ...enrollment,
      paymentIntent,
      paymentStatus,
      lastAccessed: new Date().toISOString()
    };
    
    this.enrollments.set(id, updatedEnrollment);
    return updatedEnrollment;
  }
  
  // Review methods
  async createReview(reviewData) {
    const id = this.reviewId++;
    const review = {
      id,
      ...reviewData,
      createdAt: new Date().toISOString()
    };
    
    this.reviews.set(id, review);
    
    // Update course average rating
    await this.updateCourseRating(reviewData.courseId);
    
    return review;
  }
  
  async getReview(id) {
    return this.reviews.get(id);
  }
  
  async getReviewsByCourse(courseId) {
    return Array.from(this.reviews.values())
      .filter(review => review.courseId === courseId)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }
  
  async updateReview(id, reviewData) {
    const review = await this.getReview(id);
    if (!review) return undefined;
    
    const updatedReview = {
      ...review,
      ...reviewData,
      id,
      updatedAt: new Date().toISOString()
    };
    
    this.reviews.set(id, updatedReview);
    
    // Update course average rating
    await this.updateCourseRating(review.courseId);
    
    return updatedReview;
  }
  
  async deleteReview(id) {
    const review = await this.getReview(id);
    if (!review) return false;
    
    const courseId = review.courseId;
    const deleted = this.reviews.delete(id);
    
    if (deleted) {
      // Update course average rating
      await this.updateCourseRating(courseId);
      return true;
    }
    
    return false;
  }
  
  async updateCourseRating(courseId) {
    const reviews = await this.getReviewsByCourse(courseId);
    const course = await this.getCourse(courseId);
    
    if (!course) return;
    
    if (reviews.length === 0) {
      await this.updateCourse(courseId, {
        averageRating: 0,
        numReviews: 0
      });
      return;
    }
    
    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
    const averageRating = totalRating / reviews.length;
    
    await this.updateCourse(courseId, {
      averageRating: Math.round(averageRating * 10) / 10, // Round to 1 decimal place
      numReviews: reviews.length
    });
  }
  
  // Initialize sample data
  _initSampleData() {
    // Sample instructor
    const instructor = {
      id: this.userId++,
      name: 'Jakkula Chakridhar',
      email: 'instructor@example.com',
      password: 'password123', // Plain text for demo login only
      role: 'instructor',
      bio: 'Experienced educator with 10 years of teaching experience.',
      profileImage: 'https://randomuser.me/api/portraits/men/1.jpg',
      createdAt: new Date().toISOString()
    };
    this.users.set(instructor.id, instructor);
    
    // Sample student
    const student = {
      id: this.userId++,
      name: 'Alice Student',
      email: 'student@example.com',
      password: 'password123', // Plain text for demo login only
      role: 'student',
      profileImage: 'https://randomuser.me/api/portraits/women/1.jpg',
      createdAt: new Date().toISOString()
    };
    this.users.set(student.id, student);
    
    // Sample courses
    const webDevCourse = {
      id: this.courseId++,
      title: 'Complete Web Development Bootcamp',
      description: 'Learn HTML, CSS, JavaScript, React, Node.js and MongoDB in this comprehensive course.',
      price: 99.99,
      imageUrl: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97',
      category: 'development',
      level: 'beginner',
      instructorId: instructor.id,
      duration: 1200, // 20 hours
      published: true,
      requirements: ['Basic computer skills', 'No prior programming experience required'],
      objectives: ['Build responsive websites', 'Create full-stack web applications', 'Deploy your apps to the cloud'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.courses.set(webDevCourse.id, webDevCourse);
    
    const pythonCourse = {
      id: this.courseId++,
      title: 'Python for Data Science and Machine Learning',
      description: 'Master Python for data analysis, visualization, and machine learning.',
      price: 89.99,
      imageUrl: 'https://images.unsplash.com/photo-1526379095098-d400fd0bf935',
      category: 'data-science',
      level: 'intermediate',
      instructorId: instructor.id,
      duration: 960, // 16 hours
      published: true,
      requirements: ['Basic programming knowledge', 'Understanding of mathematics'],
      objectives: ['Perform data analysis with Python', 'Create visualizations', 'Build machine learning models'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.courses.set(pythonCourse.id, pythonCourse);
    
    // Sample lessons
    const htmlLesson = {
      id: this.lessonId++,
      title: 'HTML Fundamentals',
      description: 'Learn the basics of HTML, the structure of web pages.',
      courseId: webDevCourse.id,
      section: 'Web Foundations',
      order: 1,
      duration: 60, // 1 hour
      type: 'video',
      videoUrl: 'https://example.com/videos/html-basics',
      isPreview: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.lessons.set(htmlLesson.id, htmlLesson);
    
    const cssLesson = {
      id: this.lessonId++,
      title: 'CSS Styling',
      description: 'Style your web pages with CSS.',
      courseId: webDevCourse.id,
      section: 'Web Foundations',
      order: 2,
      duration: 90, // 1.5 hours
      type: 'video',
      videoUrl: 'https://example.com/videos/css-styling',
      isPreview: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.lessons.set(cssLesson.id, cssLesson);
    
    // Sample enrollment
    const enrollment = {
      id: this.enrollmentId++,
      userId: student.id,
      courseId: webDevCourse.id,
      enrolledAt: new Date().toISOString(),
      progress: 25,
      completed: false,
      lastAccessed: new Date().toISOString(),
      paymentStatus: 'completed',
      paymentMethod: 'card'
    };
    this.enrollments.set(enrollment.id, enrollment);
    
    // Sample reviews
    const review1 = {
      id: this.reviewId++,
      userId: student.id,
      courseId: webDevCourse.id,
      rating: 5,
      reviewText: "This course is amazing! I've learned so much about web development in just a few weeks. The instructor explains everything clearly and the projects are very practical.",
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString() // 5 days ago
    };
    this.reviews.set(review1.id, review1);
    
    const review2 = {
      id: this.reviewId++,
      userId: student.id,
      courseId: pythonCourse.id,
      rating: 4,
      reviewText: "Great introduction to Python for data science. The material is well-organized and the examples are helpful. I would have liked more advanced topics towards the end.",
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString() // 2 days ago
    };
    this.reviews.set(review2.id, review2);
    
    // Update course ratings
    this.updateCourseRating(webDevCourse.id);
    this.updateCourseRating(pythonCourse.id);
  }
}

// Choose the appropriate storage based on the database type
const getStorage = () => {
  if (global.dbType === 'memory' && global.inMemoryStore) {
    console.log('Using global in-memory store');
    return {
      // User methods
      async getUser(id) {
        return global.inMemoryStore.users.find(user => user._id === id);
      },
      
      async getUserByEmail(email) {
        return global.inMemoryStore.users.find(user => user.email === email);
      },
      
      async createUser(userData) {
        const user = {
          _id: global.inMemoryStore._generateId('users'),
          ...userData,
          isActive: true,
          settings: {
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
          },
          createdAt: new Date(),
          updatedAt: new Date()
        };
        global.inMemoryStore.users.push(user);
        return user;
      },
      
      async updateUser(userId, updateData) {
        const userIndex = global.inMemoryStore.users.findIndex(user => user._id === userId);
        if (userIndex === -1) return null;
        
        const user = global.inMemoryStore.users[userIndex];
        const updatedUser = {
          ...user,
          ...updateData,
          updatedAt: new Date()
        };
        
        global.inMemoryStore.users[userIndex] = updatedUser;
        return updatedUser;
      },
      
      async updateUserSettings(userId, settingsData) {
        const userIndex = global.inMemoryStore.users.findIndex(user => user._id === userId);
        if (userIndex === -1) return null;
        
        const user = global.inMemoryStore.users[userIndex];
        
        // Initialize settings object if it doesn't exist
        if (!user.settings) {
          user.settings = {};
        }
        
        // Update nested settings
        for (const [key, value] of Object.entries(settingsData)) {
          const parts = key.split('.');
          let current = user;
          
          // Navigate to the nested property
          for (let i = 0; i < parts.length - 1; i++) {
            const part = parts[i];
            if (!current[part]) {
              current[part] = {};
            }
            current = current[part];
          }
          
          // Set the value
          current[parts[parts.length - 1]] = value;
        }
        
        user.updatedAt = new Date();
        global.inMemoryStore.users[userIndex] = user;
        return user;
      },
      
      async deleteUser(userId) {
        const userIndex = global.inMemoryStore.users.findIndex(user => user._id === userId);
        if (userIndex === -1) return false;
        
        // Remove user
        global.inMemoryStore.users.splice(userIndex, 1);
        
        // Delete all user enrollments
        global.inMemoryStore.enrollments = global.inMemoryStore.enrollments.filter(
          enrollment => enrollment.user !== userId
        );
        
        // Delete all user courses if user is instructor
        const userCourses = global.inMemoryStore.courses.filter(
          course => course.instructor === userId
        );
        
        for (const course of userCourses) {
          // Delete all lessons for this course
          global.inMemoryStore.lessons = global.inMemoryStore.lessons.filter(
            lesson => lesson.course !== course._id
          );
          
          // Delete all enrollments for this course
          global.inMemoryStore.enrollments = global.inMemoryStore.enrollments.filter(
            enrollment => enrollment.course !== course._id
          );
          
          // Delete the course
          const courseIndex = global.inMemoryStore.courses.findIndex(c => c._id === course._id);
          if (courseIndex !== -1) {
            global.inMemoryStore.courses.splice(courseIndex, 1);
          }
        }
        
        return true;
      },
      
      async updateStripeCustomerId(userId, stripeCustomerId) {
        const user = await this.getUser(userId);
        if (!user) return undefined;
        
        user.stripeCustomerId = stripeCustomerId;
        user.updatedAt = new Date();
        return user;
      },
      
      // Course methods
      async createCourse(courseData) {
        const course = {
          _id: global.inMemoryStore._generateId('courses'),
          ...courseData,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        global.inMemoryStore.courses.push(course);
        return course;
      },
      
      async getCourse(id) {
        return global.inMemoryStore.courses.find(course => course._id === id);
      },
      
      async getCourses() {
        return global.inMemoryStore.courses;
      },
      
      async getCoursesByInstructor(instructorId) {
        return global.inMemoryStore.courses.filter(
          course => course.instructor === instructorId
        );
      },
      
      async updateCourse(id, courseUpdate) {
        const course = await this.getCourse(id);
        if (!course) return undefined;
        
        Object.assign(course, courseUpdate, { updatedAt: new Date() });
        return course;
      },
      
      async deleteCourse(id) {
        const index = global.inMemoryStore.courses.findIndex(course => course._id === id);
        if (index === -1) return false;
        
        global.inMemoryStore.courses.splice(index, 1);
        
        // Delete lessons
        global.inMemoryStore.lessons = global.inMemoryStore.lessons.filter(
          lesson => lesson.course !== id
        );
        
        // Delete enrollments
        global.inMemoryStore.enrollments = global.inMemoryStore.enrollments.filter(
          enrollment => enrollment.course !== id
        );
        
        return true;
      },
      
      // Lesson methods
      async createLesson(lessonData) {
        console.log('Creating lesson with data:', lessonData);
        
        // Find max order for this course
        const courseLessons = await this.getLessonsForCourse(lessonData.courseId);
        const maxOrder = courseLessons.reduce(
          (max, lesson) => Math.max(max, lesson.order || 0), 
          0
        );
        
        const lesson = {
          _id: global.inMemoryStore._generateId('lessons'),
          ...lessonData,
          course: lessonData.courseId, // Store as course for compatibility
          order: lessonData.order || maxOrder + 1,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        
        global.inMemoryStore.lessons.push(lesson);
        console.log('Lesson created:', lesson);
        
        // Update course
        const course = await this.getCourse(lessonData.courseId);
        if (course) {
          // Update course totalLessons and duration if needed
          if (!course.totalLessons) course.totalLessons = 0;
          if (!course.totalDuration) course.totalDuration = 0;
          
          course.totalLessons += 1;
          course.totalDuration += (lessonData.duration || 0);
          course.updatedAt = new Date();
        }
        
        return lesson;
      },
      
      async getLessonsForCourse(courseId) {
        return global.inMemoryStore.lessons.filter(
          lesson => lesson.course === courseId || lesson.courseId === courseId
        ).sort((a, b) => (a.order || 0) - (b.order || 0));
      },
      
      // Enrollment methods
      async createEnrollment(enrollmentData) {
        const enrollment = {
          _id: global.inMemoryStore._generateId('enrollments'),
          ...enrollmentData,
          enrolledAt: new Date(),
          lastAccessed: new Date()
        };
        global.inMemoryStore.enrollments.push(enrollment);
        return enrollment;
      },
      
      async getEnrollment(userId, courseId) {
        return global.inMemoryStore.enrollments.find(
          enrollment => enrollment.user === userId && enrollment.course === courseId
        );
      },
      
      async getEnrollmentsByUser(userId) {
        const enrollments = global.inMemoryStore.enrollments.filter(
          enrollment => enrollment.user === userId
        );
        
        const result = [];
        for (const enrollment of enrollments) {
          const course = await this.getCourse(enrollment.course);
          if (course) {
            const instructor = await this.getUser(course.instructor);
            
            result.push({
              ...enrollment,
              course: {
                _id: course._id,
                title: course.title,
                description: course.description,
                thumbnail: course.thumbnail,
                instructor: instructor ? {
                  _id: instructor._id,
                  name: instructor.name
                } : undefined
              }
            });
          }
        }
        
        return result;
      },
      
      async updateEnrollmentProgress(id, progress) {
        const enrollment = global.inMemoryStore.enrollments.find(e => e._id === id);
        if (!enrollment) return undefined;
        
        enrollment.progress = progress;
        enrollment.completed = progress >= 100;
        enrollment.lastAccessed = new Date();
        
        return enrollment;
      },
      
      async updateEnrollmentPaymentStatus(id, paymentIntent, paymentStatus) {
        const enrollment = global.inMemoryStore.enrollments.find(e => e._id === id);
        if (!enrollment) return undefined;
        
        enrollment.paymentIntent = paymentIntent;
        enrollment.paymentStatus = paymentStatus;
        enrollment.lastAccessed = new Date();
        
        return enrollment;
      },
      
      // Review methods
      async createReview(reviewData) {
        const review = {
          _id: global.inMemoryStore._generateId('reviews'),
          ...reviewData,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        
        global.inMemoryStore.reviews.push(review);
        
        // Update course average rating
        await this.updateCourseRating(reviewData.courseId);
        
        return review;
      },
      
      async getReview(id) {
        return global.inMemoryStore.reviews.find(review => review._id === id);
      },
      
      async getReviewsByCourse(courseId) {
        const reviews = global.inMemoryStore.reviews.filter(
          review => review.courseId === courseId
        ).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        
        // Enrich with user data
        const result = [];
        for (const review of reviews) {
          const user = await this.getUser(review.userId);
          if (user) {
            result.push({
              ...review,
              user: {
                _id: user._id,
                name: user.name,
                profileImage: user.profileImage
              }
            });
          } else {
            result.push(review);
          }
        }
        
        return result;
      },
      
      async updateReview(id, reviewData) {
        const review = await this.getReview(id);
        if (!review) return undefined;
        
        Object.assign(review, reviewData, { updatedAt: new Date() });
        
        // Update course average rating
        await this.updateCourseRating(review.courseId);
        
        return review;
      },
      
      async deleteReview(id) {
        const review = await this.getReview(id);
        if (!review) return false;
        
        const courseId = review.courseId;
        const index = global.inMemoryStore.reviews.findIndex(r => r._id === id);
        
        if (index !== -1) {
          global.inMemoryStore.reviews.splice(index, 1);
          
          // Update course average rating
          await this.updateCourseRating(courseId);
          
          return true;
        }
        
        return false;
      },
      
      async updateCourseRating(courseId) {
        const reviews = global.inMemoryStore.reviews.filter(
          review => review.courseId === courseId
        );
        
        const course = await this.getCourse(courseId);
        if (!course) return;
        
        if (reviews.length === 0) {
          course.averageRating = 0;
          course.numReviews = 0;
          course.updatedAt = new Date();
          return;
        }
        
        const totalRating = reviews.reduce((sum, review) => sum + (review.rating || 0), 0);
        const averageRating = totalRating / reviews.length;
        
        course.averageRating = Math.round(averageRating * 10) / 10; // Round to 1 decimal place
        course.numReviews = reviews.length;
        course.updatedAt = new Date();
      }
    };
  } else {
    console.log('Using MemStorage (default)');
    return new MemStorage();
  }
};

// Select storage implementation based on environment
const getStorageImplementation = () => {
  if (useMongoStorage) {
    try {
      console.log('Using MongoDB Storage implementation for data persistence');
      return new MongoDBStorage();
    } catch (error) {
      console.error('Error initializing MongoDB Storage:', error);
      console.log('Falling back to MemStorage due to MongoDB initialization error');
      return new MemStorage();
    }
  } else {
    console.log('Using MemStorage implementation (no MongoDB connection)');
    return new MemStorage();
  }
};

const storage = getStorageImplementation();

export { storage };