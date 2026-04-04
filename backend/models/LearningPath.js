const mongoose = require('mongoose');

const LearningPathSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  thumbnail: String,
  creator: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  courses: [{
    course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course' },
    order: { type: Number, default: 0 },
    required: { type: Boolean, default: true }
  }],
  category: String,
  level: { type: String, enum: ['Beginner', 'Intermediate', 'Advanced'], default: 'Beginner' },
  estimatedDuration: String,
  tags: [String],
  prerequisites: [{ type: mongoose.Schema.Types.ObjectId, ref: 'LearningPath' }],
  estimatedDurationMinutes: Number,
  enrolledCount: { type: Number, default: 0 },
  status: { type: String, enum: ['draft', 'published'], default: 'draft' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

LearningPathSchema.index({ status: 1, category: 1 });
LearningPathSchema.index({ creator: 1 });
LearningPathSchema.index({ title: 'text', description: 'text', tags: 'text' });

module.exports = mongoose.model('LearningPath', LearningPathSchema);
