import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema({
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
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  reviewText: {
    type: String,
    required: true,
    trim: true,
    minlength: 2,
    maxlength: 500
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Ensure a user can only leave one review per course
reviewSchema.index({ user: 1, course: 1 }, { unique: true });

// Update course rating when reviews are added or modified
reviewSchema.statics.getAverageRating = async function(courseId) {
  const result = await this.aggregate([
    {
      $match: { course: courseId }
    },
    {
      $group: {
        _id: '$course',
        averageRating: { $avg: '$rating' },
        numReviews: { $sum: 1 }
      }
    }
  ]);

  try {
    // Update course with new average rating
    if (result.length > 0) {
      await mongoose.model('Course').findByIdAndUpdate(courseId, {
        averageRating: Math.round(result[0].averageRating * 10) / 10, // Round to 1 decimal place
        numReviews: result[0].numReviews
      });
    } else {
      // If no reviews, set default values
      await mongoose.model('Course').findByIdAndUpdate(courseId, {
        averageRating: 0,
        numReviews: 0
      });
    }
  } catch (err) {
    console.error('Error updating course rating:', err);
  }
};

// Call getAverageRating after save
reviewSchema.post('save', function() {
  this.constructor.getAverageRating(this.course);
});

// Call getAverageRating after remove
reviewSchema.post('remove', function() {
  this.constructor.getAverageRating(this.course);
});

const Review = mongoose.model('Review', reviewSchema);

export default Review;