const User = require('../models/User');
const MentorshipRequest = require('../models/MentorshipRequest');

// Get students/mentees for a mentor
async function getStudents(mentorId) {
  // Find accepted mentorship requests where this user is the mentor
  const requests = await MentorshipRequest.find({ 
    mentorId, 
    status: 'accepted' 
  }).populate('studentId', '-password -email');
   
  return requests.map(req => req.studentId);
}

// Get mentor dashboard stats
async function getDashboardStats(mentorId) {
  const [requests, students] = await Promise.all([
    MentorshipRequest.countDocuments({ mentorId, status: 'pending' }),
    MentorshipRequest.countDocuments({ mentorId, status: 'accepted' })
  ]);
   
  // Get total courses taught by this mentor
  const { Course } = require('../models/Learning');
  const totalCourses = await Course.countDocuments({ mentorId, status: 'published' });
   
  // Get total sessions (this would come from a schedule/session model)
  const totalSessions = 0; // Placeholder
   
  // Get average rating (this would come from reviews)
  const rating = 5.0; // Placeholder
   
  return {
    pendingRequests: requests,
    totalStudents: students,
    rating,
    totalCourses,
    totalSessions
  };
}

module.exports = {
  getStudents,
  getDashboardStats
};