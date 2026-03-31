const { Course } = require('../models/Learning');

// Get all courses
const getCourses = async () => {
  return await Course.find({ status: 'published' }).sort({ createdAt: -1 });
};

// Get courses by mentor
const getMentor = async (mentorId) => {
  return await Course.find({ mentorId, status: 'published' }).sort({ createdAt: -1 });
};

// Get my courses (for enrollment service)
const getMyCourses = async (userId) => {
  return await Course.find({ 
    'enrolledCount': { $gt: 0 },
    status: 'published' 
  }).sort({ createdAt: -1 });
};

module.exports = {
  getCourses,
  getMentor,
  getMyCourses
};