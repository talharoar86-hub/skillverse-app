const mongoose = require('mongoose');

const PathEnrollmentSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  path: { type: mongoose.Schema.Types.ObjectId, ref: 'LearningPath', required: true },
  completedCourses: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Course' }],
  progress: { type: Number, default: 0 },
  enrolledAt: { type: Date, default: Date.now },
  completedAt: { type: Date, default: null }
});

PathEnrollmentSchema.index({ user: 1, path: 1 }, { unique: true });
PathEnrollmentSchema.index({ user: 1, enrolledAt: -1 });

module.exports = mongoose.model('PathEnrollment', PathEnrollmentSchema);
