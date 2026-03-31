const mongoose = require('mongoose');

const CourseSchema = new mongoose.Schema({
  mentorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true
  },
  description: String,
  category: String,
  thumbnail: String,
  level: {
    type: String,
    enum: ['Beginner', 'Intermediate', 'Advanced'],
    default: 'Beginner'
  },
  price: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['draft', 'published'],
    default: 'draft'
  },
  lessons: [{
    title: String,
    description: String,
    duration: String,
    videoUrl: String,
    content: String,
    order: Number,
    completedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
  }],
  enrolledCount: {
    type: Number,
    default: 0
  },
  rating: {
    type: Number,
    default: 0
  },
  totalReviews: {
    type: Number,
    default: 0
  },
  tags: [String],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

CourseSchema.index({ mentorId: 1, status: 1 });
CourseSchema.index({ category: 1 });
CourseSchema.index({ tags: 1 });
CourseSchema.index({ rating: -1 });

module.exports = {
  Course: mongoose.model('Course', CourseSchema)
};
