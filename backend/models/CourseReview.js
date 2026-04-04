const mongoose = require('mongoose');

const CourseReviewSchema = new mongoose.Schema({
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  rating: {
    type: Number,
    min: 1,
    max: 5,
    required: true
  },
  comment: String,
  createdAt: {
    type: Date,
    default: Date.now
  },
  mentorReply: {
    text: String,
    repliedAt: Date
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

CourseReviewSchema.index({ course: 1, createdAt: -1 });
CourseReviewSchema.index({ course: 1, user: 1 }, { unique: true });
CourseReviewSchema.index({ mentorId: 1, createdAt: -1 });

module.exports = mongoose.model('CourseReview', CourseReviewSchema);
