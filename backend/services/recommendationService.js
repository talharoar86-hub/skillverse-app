const { Course } = require('../models/Learning');
const Enrollment = require('../models/Enrollment');
const User = require('../models/User');

const getRecommendedCourses = async (userId) => {
  try {
    const user = await User.findById(userId).select('skills learningGoals');
    if (!user || (!user.skills?.length && !user.learningGoals?.length)) {
      return await Course.find({ status: 'published' }).sort({ rating: -1 }).limit(6);
    }

    const searchTerms = [...(user.skills || []), ...(user.learningGoals || [])];
    const enrolledCourseIds = await Enrollment.find({ user: userId }).distinct('course');

    const recommended = await Course.find({
      status: 'published',
      _id: { $nin: enrolledCourseIds },
      $or: [
        { tags: { $in: searchTerms.map(t => new RegExp(t, 'i')) } },
        { category: { $in: searchTerms.map(t => new RegExp(t, 'i')) } }
      ]
    })
      .sort({ rating: -1, enrolledCount: -1 })
      .limit(6)
      .populate('mentorId', 'name avatarUrl mentorProfile.headline');

    if (recommended.length < 6) {
      const remaining = 6 - recommended.length;
      const fallback = await Course.find({
        status: 'published',
        _id: { $nin: [...enrolledCourseIds, ...recommended.map(c => c._id)] }
      })
        .sort({ rating: -1 })
        .limit(remaining)
        .populate('mentorId', 'name avatarUrl mentorProfile.headline');
      return [...recommended, ...fallback];
    }

    return recommended;
  } catch (error) {
    console.error('Recommendation error:', error);
    return [];
  }
};

const getRecommendedMentors = async (userId) => {
  try {
    const user = await User.findById(userId).select('skills learningGoals');
    if (!user || (!user.skills?.length && !user.learningGoals?.length)) {
      return await User.find({ mentorStatus: 'approved', onboardingComplete: true })
        .sort({ 'mentorProfile.rating': -1 })
        .limit(4)
        .select('name avatarUrl skills mentorProfile');
    }

    const searchTerms = [...(user.skills || []), ...(user.learningGoals || [])];
    const mentors = await User.find({
      mentorStatus: 'approved',
      onboardingComplete: true,
      _id: { $ne: userId },
      $or: [
        { skills: { $in: searchTerms.map(t => new RegExp(t, 'i')) } },
        { 'mentorProfile.skills.name': { $in: searchTerms.map(t => new RegExp(t, 'i')) } }
      ]
    })
      .sort({ 'mentorProfile.rating': -1 })
      .limit(4)
      .select('name avatarUrl skills mentorProfile');

    return mentors;
  } catch (error) {
    console.error('Mentor recommendation error:', error);
    return [];
  }
};

module.exports = { getRecommendedCourses, getRecommendedMentors };
