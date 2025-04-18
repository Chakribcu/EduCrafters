import mongoose from 'mongoose';

// In-memory storage for fallback when MongoDB is not available
class InMemoryStore {
  constructor() {
    this.users = [];
    this.courses = [];
    this.lessons = [];
    this.enrollments = [];
    this.nextIds = {
      users: 1,
      courses: 1,
      lessons: 1,
      enrollments: 1
    };
    
    // Add some demo data
    console.log('Initializing in-memory database with demo data');
    this._initSampleData();
  }
  
  // Initialize with demo data
  _initSampleData() {
    // Add a demo instructor
    const instructor = {
      _id: this._generateId('users'),
      name: 'Jakkula Chakridhar',
      email: 'chakridhar@example.com',
      password: '$2a$10$XG8x6OYgL0Xz3wY1tX3mTeujPIkORUQPcYWY0MRcMQJ0L0hOqvXVi', // hashed 'password123'
      role: 'instructor',
      profileImage: 'https://randomuser.me/api/portraits/men/32.jpg',
      bio: 'Experienced full-stack developer and educator with a passion for teaching web development',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.users.push(instructor);
    
    // Add a demo student
    const student = {
      _id: this._generateId('users'),
      name: 'John Student',
      email: 'student@example.com',
      password: '$2a$10$XG8x6OYgL0Xz3wY1tX3mTeujPIkORUQPcYWY0MRcMQJ0L0hOqvXVi', // hashed 'password123'
      role: 'student',
      profileImage: 'https://randomuser.me/api/portraits/men/22.jpg',
      bio: 'Aspiring developer learning web development',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.users.push(student);
    
    // Add demo courses
    const webDevCourse = {
      _id: this._generateId('courses'),
      title: 'Web Development Fundamentals',
      description: 'Learn the fundamentals of web development including HTML, CSS, and JavaScript.',
      price: 49.99,
      category: 'web-development',
      level: 'beginner',
      thumbnail: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?ixlib=rb-1.2.1&auto=format&fit=crop&w=1352&q=80',
      instructor: instructor._id,
      totalDuration: 840,
      totalLessons: 5,
      isPublished: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.courses.push(webDevCourse);
    
    const reactCourse = {
      _id: this._generateId('courses'),
      title: 'React.js Masterclass',
      description: 'Master React.js by building real-world applications.',
      price: 79.99,
      category: 'web-development',
      level: 'intermediate',
      thumbnail: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80',
      instructor: instructor._id,
      totalDuration: 960,
      totalLessons: 5,
      isPublished: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.courses.push(reactCourse);
    
    // Add demo lessons for courses
    for (let i = 1; i <= 5; i++) {
      this.lessons.push({
        _id: this._generateId('lessons'),
        title: `Lesson ${i}: ${i === 1 ? 'Introduction' : 'Topic ' + i}`,
        description: `Detailed description for Lesson ${i}`,
        content: `<div>Lesson content for lesson ${i}</div>`,
        videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
        duration: 30,
        course: webDevCourse._id,
        order: i,
        section: i <= 2 ? 'Getting Started' : 'Advanced Topics',
        isFree: i === 1,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }
    
    // Add demo enrollment
    this.enrollments.push({
      _id: this._generateId('enrollments'),
      user: student._id,
      course: webDevCourse._id,
      progress: 40,
      completed: false,
      paymentStatus: 'completed',
      enrolledAt: new Date(),
      lastAccessedAt: new Date()
    });
  }
  
  // Generate unique IDs
  _generateId(type) {
    const id = this.nextIds[type]++;
    return id.toString();
  }
}

// Improved MongoDB connection with retry logic and fallback
const connectDB = async (retries = 3, delay = 5000) => {
  let lastError = null;
  let attempt = 1;
  
  while (attempt <= retries) {
    try {
      console.log(`Attempting to connect to MongoDB (attempt ${attempt}/${retries})...`);
      
      // Hide credentials when logging the URI
      const redactedUri = process.env.MONGODB_URI.replace(/\/\/([^:]+):([^@]+)@/, '//[username]:[password]@');
      console.log(`MongoDB URI: ${redactedUri}`);
      
      const conn = await mongoose.connect(process.env.MONGODB_URI, {
        serverSelectionTimeoutMS: 10000, // Increased timeout for better reliability
        socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
        connectTimeoutMS: 10000, // Increased connection timeout
        family: 4, // Force IPv4 (can help with some connection issues)
      });
      
      console.log(`MongoDB Connected Successfully: ${conn.connection.host}`);
      
      // Setup connection event handlers for better error monitoring
      mongoose.connection.on('error', err => {
        console.error('MongoDB connection error:', err);
      });
      
      mongoose.connection.on('disconnected', () => {
        console.warn('MongoDB disconnected. Attempting to reconnect...');
      });
      
      mongoose.connection.on('reconnected', () => {
        console.log('MongoDB reconnected successfully');
      });
      
      return { conn, dbType: 'mongodb' };
    } catch (error) {
      lastError = error;
      console.error(`Error connecting to MongoDB (attempt ${attempt}/${retries}): ${error.message}`);
      
      if (attempt < retries) {
        console.log(`Retrying in ${delay/1000} seconds...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
      
      attempt++;
    }
  }
  
  // If we've exhausted all retries
  console.error(`Failed to connect to MongoDB after ${retries} attempts.`);
  
  // In development mode, use in-memory database as fallback
  if (process.env.NODE_ENV === 'development') {
    console.warn('Falling back to in-memory database for development');
    // Initialize in-memory database with demo data
    const inMemoryStore = new InMemoryStore();
    return { inMemoryStore, dbType: 'memory' };
  }
  
  // In production, this is a critical error
  if (process.env.NODE_ENV === 'production') {
    console.error('Critical error: Unable to connect to MongoDB in production mode');
    process.exit(1);
  }
  
  throw lastError; // Propagate the error up to be handled by the caller
};

export default connectDB;