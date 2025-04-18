import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

// Import models
import User from '../models/User.js';
import Course from '../models/Course.js';
import Lesson from '../models/Lesson.js';
import Enrollment from '../models/Enrollment.js';

// Configure environment variables
dotenv.config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/educrafters', {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log('Connected to MongoDB');
}).catch(err => {
  console.error('Error connecting to MongoDB:', err);
  process.exit(1);
});

// Hash password
const hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(password, salt);
};

// Clear existing data
const clearData = async () => {
  console.log('Clearing existing data...');
  await User.deleteMany({});
  await Course.deleteMany({});
  await Lesson.deleteMany({});
  await Enrollment.deleteMany({});
  console.log('Data cleared successfully');
};

// Create demo users
const createUsers = async () => {
  console.log('Creating demo users...');
  
  // Create instructor
  const instructor = new User({
    name: 'Jakkula Chakridhar',
    email: 'chakridhar@example.com',
    password: await hashPassword('password123'),
    role: 'instructor',
    profileImage: 'https://randomuser.me/api/portraits/men/32.jpg',
    bio: 'Experienced full-stack developer and educator with a passion for teaching web development and programming'
  });
  
  // Create student
  const student = new User({
    name: 'John Student',
    email: 'student@example.com',
    password: await hashPassword('password123'),
    role: 'student',
    profileImage: 'https://randomuser.me/api/portraits/men/22.jpg',
    bio: 'Aspiring developer interested in learning web development and programming'
  });
  
  // Create admin
  const admin = new User({
    name: 'Admin User',
    email: 'admin@example.com',
    password: await hashPassword('password123'),
    role: 'admin',
    profileImage: 'https://randomuser.me/api/portraits/women/28.jpg',
    bio: 'Platform administrator'
  });
  
  await instructor.save();
  await student.save();
  await admin.save();
  
  console.log('Demo users created successfully');
  return { instructor, student, admin };
};

// Create demo courses
const createCourses = async (instructor) => {
  console.log('Creating demo courses...');
  
  // Course 1: Web Development Fundamentals
  const webDevCourse = new Course({
    title: 'Web Development Fundamentals',
    description: 'Learn the fundamentals of web development including HTML, CSS, and JavaScript. This course covers everything you need to know to get started building websites.',
    category: 'web-development',
    price: 49.99,
    level: 'beginner',
    thumbnail: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?ixlib=rb-1.2.1&auto=format&fit=crop&w=1352&q=80',
    instructor: instructor._id,
    totalDuration: 840, // 14 hours
    totalLessons: 20,
    isPublished: true,
    hasPreview: true,
    previewVideo: 'https://www.youtube.com/embed/gT0Lj2cVlH8',
    objectives: [
      'Understand HTML structure and semantics',
      'Learn CSS styling and layout techniques',
      'Master JavaScript fundamentals',
      'Build responsive websites',
      'Create interactive web applications'
    ],
    requirements: [
      'No prior programming experience required',
      'Basic computer skills',
      'A computer with internet access'
    ]
  });
  
  // Course 2: React.js Masterclass
  const reactCourse = new Course({
    title: 'React.js Masterclass',
    description: 'Master React.js by building real-world applications. This comprehensive course covers React hooks, context API, Redux, and more.',
    category: 'web-development',
    price: 79.99,
    level: 'intermediate',
    thumbnail: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80',
    instructor: instructor._id,
    totalDuration: 960, // 16 hours
    totalLessons: 24,
    isPublished: true,
    hasPreview: true,
    previewVideo: 'https://www.youtube.com/embed/w7ejDZ8SWv8',
    objectives: [
      'Understand React components and JSX',
      'Master state and props management',
      'Learn to use React hooks effectively',
      'Implement context API and Redux',
      'Build performant React applications'
    ],
    requirements: [
      'Basic JavaScript knowledge',
      'Understanding of HTML and CSS',
      'Familiarity with ES6 syntax'
    ]
  });
  
  // Course 3: Node.js Backend Development
  const nodeCourse = new Course({
    title: 'Node.js Backend Development',
    description: 'Learn to build robust backend systems with Node.js, Express, and MongoDB. This course covers RESTful APIs, authentication, and deployment.',
    category: 'web-development',
    price: 69.99,
    level: 'intermediate',
    thumbnail: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80',
    instructor: instructor._id,
    totalDuration: 900, // 15 hours
    totalLessons: 22,
    isPublished: true,
    hasPreview: true,
    previewVideo: 'https://www.youtube.com/embed/fBNz5xF-Kx4',
    objectives: [
      'Build RESTful APIs with Express',
      'Work with MongoDB and Mongoose',
      'Implement authentication and authorization',
      'Handle file uploads and processing',
      'Deploy Node.js applications'
    ],
    requirements: [
      'Basic JavaScript knowledge',
      'Understanding of web technologies',
      'Familiarity with HTTP and APIs'
    ]
  });
  
  // Course 4: Python for Data Science
  const pythonCourse = new Course({
    title: 'Python for Data Science',
    description: 'Learn Python programming for data analysis and visualization. This course covers NumPy, Pandas, Matplotlib, and an introduction to machine learning.',
    category: 'data-science',
    price: 89.99,
    level: 'intermediate',
    thumbnail: 'https://images.unsplash.com/photo-1515879218367-8466d910aaa4?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80',
    instructor: instructor._id,
    totalDuration: 1080, // 18 hours
    totalLessons: 26,
    isPublished: true,
    hasPreview: true,
    previewVideo: 'https://www.youtube.com/embed/rfscVS0vtbw',
    objectives: [
      'Master Python fundamentals',
      'Learn data manipulation with NumPy and Pandas',
      'Create data visualizations with Matplotlib and Seaborn',
      'Apply basic statistical analysis',
      'Build simple machine learning models'
    ],
    requirements: [
      'No prior programming experience required',
      'Basic mathematics knowledge',
      'Interest in data analysis'
    ]
  });
  
  // Course 5: Mobile App Development with Flutter
  const flutterCourse = new Course({
    title: 'Mobile App Development with Flutter',
    description: 'Learn to build cross-platform mobile applications with Flutter. This course covers Dart programming, Flutter widgets, state management, and deployment.',
    category: 'mobile-development',
    price: 79.99,
    level: 'intermediate',
    thumbnail: 'https://images.unsplash.com/photo-1551650975-87deedd944c3?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80',
    instructor: instructor._id,
    totalDuration: 1020, // 17 hours
    totalLessons: 25,
    isPublished: true,
    hasPreview: true,
    previewVideo: 'https://www.youtube.com/embed/1ukSR1GRtMU',
    objectives: [
      'Learn Dart programming language',
      'Understand Flutter widgets and UI building',
      'Master state management techniques',
      'Implement navigation and routing',
      'Build complete mobile applications'
    ],
    requirements: [
      'Basic programming knowledge',
      'Understanding of object-oriented concepts',
      'No mobile development experience required'
    ]
  });
  
  await webDevCourse.save();
  await reactCourse.save();
  await nodeCourse.save();
  await pythonCourse.save();
  await flutterCourse.save();
  
  console.log('Demo courses created successfully');
  return [webDevCourse, reactCourse, nodeCourse, pythonCourse, flutterCourse];
};

// Create lessons for courses
const createLessons = async (courses) => {
  console.log('Creating lessons for demo courses...');
  
  // Helper function to create lesson content based on course
  const createLessonsForCourse = async (course, lessonCount) => {
    const lessons = [];
    for (let i = 1; i <= lessonCount; i++) {
      const lesson = new Lesson({
        title: `Lesson ${i}: ${getLessonTitle(course.title, i)}`,
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
        duration: Math.floor(Math.random() * 30) + 25, // 25-55 minutes
        course: course._id,
        order: i,
        isFree: i === 1, // First lesson is free
        resources: [
          {
            title: 'Lesson slides',
            type: 'pdf',
            url: 'https://example.com/slides.pdf'
          },
          {
            title: 'Code examples',
            type: 'github',
            url: 'https://github.com/example/repo'
          }
        ]
      });
      await lesson.save();
      lessons.push(lesson);
    }
    return lessons;
  };
  
  // Generate lesson titles based on course
  const getLessonTitle = (courseTitle, lessonNumber) => {
    const webDevTitles = [
      'Introduction to HTML', 'HTML Structure and Elements', 'Working with Forms',
      'CSS Basics', 'CSS Layout Techniques', 'Responsive Design',
      'JavaScript Fundamentals', 'DOM Manipulation', 'Event Handling',
      'Asynchronous JavaScript', 'Working with APIs', 'Local Storage',
      'CSS Frameworks', 'JavaScript Libraries', 'Web Accessibility',
      'Performance Optimization', 'Deployment', 'Version Control',
      'Testing Web Applications', 'Project: Portfolio Website'
    ];
    
    const reactTitles = [
      'Introduction to React', 'Setting Up React Environment', 'JSX Syntax',
      'React Components', 'Props and State', 'Component Lifecycle',
      'React Hooks', 'useEffect Hook', 'useState and useReducer',
      'Context API', 'React Router', 'Forms in React',
      'State Management with Redux', 'Redux Middleware', 'API Integration',
      'Testing React Components', 'Performance Optimization', 'Server-Side Rendering',
      'React with TypeScript', 'Advanced Patterns', 'Authentication',
      'Deployment Strategies', 'CI/CD Pipeline', 'Project: E-Commerce Application'
    ];
    
    const nodeTitles = [
      'Introduction to Node.js', 'Node.js Runtime', 'NPM Basics',
      'Creating a Server', 'Express Framework', 'Routing in Express',
      'Middleware', 'Template Engines', 'Working with MongoDB',
      'Mongoose ODM', 'RESTful API Design', 'Authentication',
      'Authorization', 'Error Handling', 'File Uploads',
      'Email Sending', 'Background Jobs', 'Deployment',
      'Testing Node.js Applications', 'Logging and Monitoring', 'Security Best Practices',
      'Performance Optimization'
    ];
    
    const pythonTitles = [
      'Introduction to Python', 'Python Basics', 'Data Types',
      'Control Flow', 'Functions', 'Modules and Packages',
      'NumPy Introduction', 'NumPy Arrays', 'Data Manipulation with NumPy',
      'Pandas Introduction', 'DataFrames', 'Data Cleaning',
      'Data Analysis', 'Matplotlib Basics', 'Advanced Plotting',
      'Statistical Analysis', 'Introduction to Machine Learning', 'Linear Regression',
      'Classification', 'Clustering', 'Model Evaluation',
      'Project: Data Analysis', 'Project: Predictive Modeling', 'Project: Visualization',
      'Project: End-to-End Data Science Workflow', 'Career in Data Science'
    ];
    
    const flutterTitles = [
      'Introduction to Flutter', 'Dart Programming Basics', 'Setting Up Flutter Environment',
      'Flutter Widgets', 'Layout in Flutter', 'Navigation',
      'State Management Basics', 'Provider Pattern', 'BLoC Pattern',
      'Working with APIs', 'Local Storage', 'Firebase Integration',
      'Authentication', 'Custom Animations', 'Responsive Design',
      'Testing Flutter Apps', 'Deployment to App Store', 'Deployment to Play Store',
      'Performance Optimization', 'Advanced Widgets', 'Plugin Development',
      'Internationalization', 'Accessibility', 'Project: Social Media App',
      'Project: E-Commerce App'
    ];
    
    let titles;
    if (courseTitle.includes('Web Development')) {
      titles = webDevTitles;
    } else if (courseTitle.includes('React')) {
      titles = reactTitles;
    } else if (courseTitle.includes('Node.js')) {
      titles = nodeTitles;
    } else if (courseTitle.includes('Python')) {
      titles = pythonTitles;
    } else if (courseTitle.includes('Flutter')) {
      titles = flutterTitles;
    } else {
      titles = webDevTitles; // Default to web dev titles
    }
    
    return titles[lessonNumber - 1] || `Topic ${lessonNumber}`;
  };
  
  // Create lessons for each course
  for (const course of courses) {
    const lessonCount = course.totalLessons;
    await createLessonsForCourse(course, lessonCount);
  }
  
  console.log('Lessons created successfully');
};

// Create enrollments
const createEnrollments = async (student, courses) => {
  console.log('Creating enrollments...');
  
  // Enroll student in first 3 courses
  for (let i = 0; i < 3; i++) {
    const course = courses[i];
    const enrollment = new Enrollment({
      user: student._id,
      course: course._id,
      progress: Math.floor(Math.random() * 100), // Random progress
      completed: false,
      paymentStatus: 'completed',
      paymentId: `pi_${Date.now() + i}`,
      enrolledAt: new Date(),
      lastAccessedAt: new Date()
    });
    await enrollment.save();
  }
  
  console.log('Enrollments created successfully');
};

// Main function to run the seed script
const seedData = async () => {
  try {
    await clearData();
    const { instructor, student } = await createUsers();
    const courses = await createCourses(instructor);
    await createLessons(courses);
    await createEnrollments(student, courses);
    
    console.log('Demo data seeded successfully!');
    console.log('\nDemo User Credentials:');
    console.log('---------------------');
    console.log('Instructor:');
    console.log('  Email: chakridhar@example.com');
    console.log('  Password: password123');
    console.log('\nStudent:');
    console.log('  Email: student@example.com');
    console.log('  Password: password123');
    console.log('\nAdmin:');
    console.log('  Email: admin@example.com');
    console.log('  Password: password123');
    
    // Exit process
    mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Error seeding data:', error);
    mongoose.disconnect();
    process.exit(1);
  }
};

// Run the seed script
seedData();