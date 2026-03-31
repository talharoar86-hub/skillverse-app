const Enrollment = require('../models/Enrollment');

// Get user's enrolled courses
async function getMyCourses(userId) {
  return await Enrollment.find({ user: userId }).populate('course');
}

// Get enrollment stats
async function getStats(userId) {
  const enrollments = await Enrollment.find({ user: userId });
  
  const stats = {
    enrolled: enrollments.length,
    completed: enrollments.filter(e => e.progress === 100).length,
    hours: enrollments.reduce((total, e) => total + (e.hoursSpent || 0), 0)
  };
  
  return stats;
}

module.exports = {
  getMyCourses,
  getStats
};