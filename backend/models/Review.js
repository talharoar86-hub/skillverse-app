const mongoose = require('mongoose');

const ReviewSchema = new mongoose.Schema({
  mentorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    default: null
  },
  rating: {
    type: Number,
    min: 1,
    max: 5,
    required: true
  },
  comment: String,
  mentorReply: {
    text: { type: String, trim: true },
    repliedAt: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

ReviewSchema.index({ mentorId: 1, createdAt: -1 });
ReviewSchema.index({ studentId: 1, mentorId: 1 }, { unique: true });

module.exports = mongoose.model('Review', ReviewSchema);
