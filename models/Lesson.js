/**
 * Lesson Model
 * Updated by Chakridhar - April 2025
 * 
 * This model represents individual lessons within courses.
 */

import mongoose from 'mongoose';

const lessonSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please add a lesson title'],
    trim: true,
    maxlength: [100, 'Title cannot be more than 100 characters']
  },
  description: {
    type: String
  },
  content: {
    type: String,
    required: [true, 'Please add lesson content']
  },
  videoUrl: {
    type: String
  },
  youtubeVideoId: {
    type: String
  },
  isPreview: {
    type: Boolean,
    default: false
  },
  duration: {
    type: Number,
    required: [true, 'Please add lesson duration in minutes'],
    default: 0
  },
  order: {
    type: Number,
    required: true
  },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

// Add a method to check if a lesson is accessible to a user
lessonSchema.methods.isAccessibleTo = function(user, enrollment) {
  // Preview lessons are accessible to anyone
  if (this.isPreview) {
    return true;
  }
  
  // If no user or no enrollment, only preview lessons are accessible
  if (!user || !enrollment) {
    return false;
  }
  
  // If the user is the course instructor or an admin, all lessons are accessible
  if (user.role === 'instructor' || user.role === 'admin') {
    return true;
  }
  
  // For students, check if they're enrolled in the course
  return enrollment && enrollment.paymentStatus === 'completed';
};

const Lesson = mongoose.model('Lesson', lessonSchema);

export default Lesson;