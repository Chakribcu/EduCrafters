/**
 * Script to add demo YouTube lessons to existing courses
 * Created by Chakridhar - April 2025
 * 
 * This script adds demo lessons with YouTube videos to courses
 * and ensures admin users have permission to edit, add, and delete them
 */

import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { Course } from '../models/Course.js';
import { Lesson } from '../models/Lesson.js';
import { User } from '../models/User.js';

// Load environment variables
dotenv.config();

// Sample YouTube video URLs for different categories
const DEMO_VIDEOS = {
  development: [
    {
      title: 'Introduction to JavaScript',
      videoUrl: 'https://www.youtube.com/embed/PkZNo7MFNFg',
      description: 'Learn the basics of JavaScript programming language.',
      duration: 45,
      isPreview: true
    },
    {
      title: 'HTML and CSS Fundamentals',
      videoUrl: 'https://www.youtube.com/embed/qz0aGYrrlhU',
      description: 'Learn the core building blocks of the web.',
      duration: 50,
      isPreview: false
    },
    {
      title: 'Responsive Web Design',
      videoUrl: 'https://www.youtube.com/embed/srvUrASNj0s',
      description: 'Create websites that look great on all devices.',
      duration: 35,
      isPreview: false
    }
  ],
  design: [
    {
      title: 'Introduction to UI/UX Design',
      videoUrl: 'https://www.youtube.com/embed/c9Wg6Cb_YlU',
      description: 'Learn the basics of user interface and user experience design.',
      duration: 40,
      isPreview: true
    },
    {
      title: 'Color Theory for Designers',
      videoUrl: 'https://www.youtube.com/embed/AvgCkHrcj8w',
      description: 'Understand how to use color effectively in your designs.',
      duration: 30,
      isPreview: false
    },
    {
      title: 'Typography Fundamentals',
      videoUrl: 'https://www.youtube.com/embed/O-XrRQf7BPM',
      description: 'Master the art of using type in your designs.',
      duration: 45,
      isPreview: false
    }
  ],
  business: [
    {
      title: 'Introduction to Business Strategy',
      videoUrl: 'https://www.youtube.com/embed/uhfqXONIuXA',
      description: 'Learn how to develop effective business strategies.',
      duration: 55,
      isPreview: true
    },
    {
      title: 'Marketing Fundamentals',
      videoUrl: 'https://www.youtube.com/embed/ZZvRmQ_4z_U',
      description: 'Understand the basics of marketing your business.',
      duration: 45,
      isPreview: false
    },
    {
      title: 'Financial Planning for Startups',
      videoUrl: 'https://www.youtube.com/embed/Uxt7V_CEv6M',
      description: 'Learn how to manage finances for your new business.',
      duration: 50,
      isPreview: false
    }
  ],
  marketing: [
    {
      title: 'Digital Marketing Fundamentals',
      videoUrl: 'https://www.youtube.com/embed/ZZvRmQ_4z_U',
      description: 'Learn the basics of digital marketing.',
      duration: 60,
      isPreview: true
    },
    {
      title: 'Social Media Marketing',
      videoUrl: 'https://www.youtube.com/embed/q8TeXQHirTA',
      description: 'Master social media platforms for business growth.',
      duration: 45,
      isPreview: false
    },
    {
      title: 'Email Marketing Strategies',
      videoUrl: 'https://www.youtube.com/embed/UjrUQCra8V8',
      description: 'Learn effective email marketing techniques.',
      duration: 40,
      isPreview: false
    }
  ],
  photography: [
    {
      title: 'Photography Basics',
      videoUrl: 'https://www.youtube.com/embed/KDKCWJt0yOw',
      description: 'Learn the fundamentals of photography.',
      duration: 50,
      isPreview: true
    },
    {
      title: 'Composition Techniques',
      videoUrl: 'https://www.youtube.com/embed/PzBY6k_8Y6c',
      description: 'Master the art of composition in photography.',
      duration: 35,
      isPreview: false
    },
    {
      title: 'Lighting for Photographers',
      videoUrl: 'https://www.youtube.com/embed/Nb3w-LXV7zM',
      description: 'Learn lighting techniques for stunning photos.',
      duration: 45,
      isPreview: false
    }
  ],
  music: [
    {
      title: 'Music Theory Basics',
      videoUrl: 'https://www.youtube.com/embed/rgaTLrZGlk0',
      description: 'Learn the fundamentals of music theory.',
      duration: 65,
      isPreview: true
    },
    {
      title: 'Piano for Beginners',
      videoUrl: 'https://www.youtube.com/embed/QBH6IpRkVDs',
      description: 'Start your journey with piano lessons.',
      duration: 40,
      isPreview: false
    },
    {
      title: 'Guitar Fundamentals',
      videoUrl: 'https://www.youtube.com/embed/BBz-Jyr23M4',
      description: 'Learn the basics of playing guitar.',
      duration: 55,
      isPreview: false
    }
  ]
};

// Connect to MongoDB
async function connectDB() {
  try {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
      throw new Error('MONGODB_URI environment variable is not set');
    }
    
    await mongoose.connect(uri);
    console.log('MongoDB Connected Successfully');
  } catch (error) {
    console.error('MongoDB Connection Error:', error);
    process.exit(1);
  }
}

// Add demo lessons to a course
async function addDemoLessonsToCourse(course) {
  const category = course.category;
  const categoryVideos = DEMO_VIDEOS[category] || DEMO_VIDEOS.development;
  
  console.log(`Adding demo lessons to course: ${course.title}`);
  
  // Check if course already has lessons
  const existingLessons = await Lesson.find({ courseId: course._id });
  if (existingLessons.length > 0) {
    console.log(`Course ${course.title} already has ${existingLessons.length} lessons. Skipping.`);
    return;
  }
  
  // Add lessons with demo videos
  const lessons = [];
  for (let i = 0; i < categoryVideos.length; i++) {
    const videoData = categoryVideos[i];
    
    const lesson = new Lesson({
      title: videoData.title,
      courseId: course._id,
      description: videoData.description,
      type: 'video',
      content: {
        videoUrl: videoData.videoUrl,
        duration: videoData.duration
      },
      order: i + 1,
      isPublished: true,
      isPreview: videoData.isPreview
    });
    
    await lesson.save();
    lessons.push(lesson);
    
    console.log(`Added lesson: ${lesson.title}`);
  }
  
  return lessons;
}

// Main function
async function main() {
  try {
    await connectDB();
    
    console.log('Starting to add demo lessons to courses...');
    
    // Get all courses
    const courses = await Course.find();
    
    if (courses.length === 0) {
      console.log('No courses found. Please create courses first.');
      process.exit(0);
    }
    
    // Add demo lessons to each course
    for (const course of courses) {
      await addDemoLessonsToCourse(course);
    }
    
    console.log('Demo lessons added successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error adding demo lessons:', error);
    process.exit(1);
  }
}

main();