const mongoose = require('mongoose');

const LearningGoalSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  weeklyHoursTarget: { type: Number, default: 5 },
  weeklyCoursesTarget: { type: Number, default: 1 },
  currentWeekHours: { type: Number, default: 0 },
  currentWeekCourses: { type: Number, default: 0 },
  streakDays: { type: Number, default: 0 },
  longestStreak: { type: Number, default: 0 },
  lastActiveDate: { type: Date, default: null },
  totalHoursLearned: { type: Number, default: 0 },
  weekStartDate: { type: Date, default: () => { const d = new Date(); d.setDate(d.getDate() - d.getDay()); return d; } },
  activityLog: [{
    date: { type: Date },
    hoursSpent: { type: Number, default: 0 },
    lessonsCompleted: { type: Number, default: 0 }
  }]
});

module.exports = mongoose.model('LearningGoal', LearningGoalSchema);
