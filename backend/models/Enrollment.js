const mongoose = require('mongoose');

const EnrollmentSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  progress: { type: Number, default: 0 },
  completedLessons: [{ type: Number }],
  bookmarkedLessons: [{ type: Number }],
  lastAccessedLesson: { type: Number, default: 0 },
  timeSpentSeconds: { type: Number, default: 0 },
  lastActiveAt: { type: Date, default: Date.now },
  enrolledAt: { type: Date, default: Date.now },
  completedAt: { type: Date, default: null },
  certificateUrl: String,
  certificateIssuedAt: Date
});

EnrollmentSchema.index({ user: 1 });
EnrollmentSchema.index({ user: 1, course: 1 }, { unique: true });
EnrollmentSchema.index({ user: 1, progress: 1 });
EnrollmentSchema.index({ user: 1, lastActiveAt: -1 });
EnrollmentSchema.index({ user: 1, lastAccessedLesson: 1 });
EnrollmentSchema.index({ user: 1, progress: 1, completedLessons: 1 });

module.exports = mongoose.model('Enrollment', EnrollmentSchema);
