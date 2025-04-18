import mongoose from 'mongoose';

const enrollmentSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  progress: {
    type: Number,
    default: 0
  },
  completedLessons: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Lesson'
  }],
  completed: {
    type: Boolean,
    default: false
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'completed', 'failed'],
    default: 'pending'
  },
  paymentId: {
    type: String
  },
  enrolledAt: {
    type: Date,
    default: Date.now
  },
  lastAccessedAt: {
    type: Date,
    default: Date.now
  },
  notes: {
    type: String,
    default: ''
  }
});

// Prevent duplicate enrollments
enrollmentSchema.index({ user: 1, course: 1 }, { unique: true });

const Enrollment = mongoose.model('Enrollment', enrollmentSchema);

export default Enrollment;