const User = require('../models/User');

// Get discovery/users by goal
async function getDiscovery(goal) {
  return await User.find({ 
    goal, 
    onboardingComplete: true 
  }).select('-password -email').sort({ createdAt: -1 });
}

// Get sidebar stats (mentor stats)
async function getSidebarStats(userId) {
  const user = await User.findById(userId);
   
  if (!user) return {};
   
  return {
    totalStudents: user.totalStudents || 0,
    rating: user.rating || 0,
    totalCourses: user.totalCourses || 0
  };
}

// Get mentee requests
async function getMenteeRequests(userId) {
  // This would typically come from a mentorship request model
  // For now, returning empty array as placeholder
  return [];
}

// Get skill matches
async function getSkillMatches(userId) {
  // This would typically come from an exchange/matching model
  // For now, returning empty array as placeholder
  return [];
}

module.exports = {
  getDiscovery,
  getSidebarStats,
  getMenteeRequests,
  getSkillMatches
};