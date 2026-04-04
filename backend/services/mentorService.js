const User = require('../models/User');
const MentorshipRequest = require('../models/MentorshipRequest');
const Review = require('../models/Review');

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
   
  // Get total sessions (from accepted mentorship requests)
  const totalSessions = students;
   
  // Calculate real average rating from reviews
  const ratingResult = await Review.aggregate([
    { $match: { mentorId } },
    { $group: { _id: null, avgRating: { $avg: '$rating' } } }
  ]);
  const rating = ratingResult[0]?.avgRating ? Math.round(ratingResult[0].avgRating * 10) / 10 : 5.0;
   
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