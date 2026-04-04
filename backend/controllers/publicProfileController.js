const User = require('../models/User');
const Post = require('../models/Post');
const Enrollment = require('../models/Enrollment');
const { Course } = require('../models/Learning');
const ExchangeActivity = require('../models/ExchangeActivity');
const MentorProfileView = require('../models/MentorProfileView');

const SENSITIVE_FIELDS = '-password -email -googleId -resetPasswordToken -resetPasswordExpire -isOnline -isEmailVerified';

const getPublicProfile = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId).select(SENSITIVE_FIELDS);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const isOwner = req.user._id.toString() === userId;
    const isMentorVerified = user.isMentor === true && user.mentorStatus === 'approved';
    const postsCount = await Post.countDocuments({ userId });

    let mentorCourses = [];
    let mentorActivity = null;
    if (isMentorVerified) {
      mentorCourses = await Course.find({ mentorId: userId })
        .select('title category rating studentsCount createdAt')
        .sort({ createdAt: -1 })
        .limit(5);

      const totalStudents = mentorCourses.reduce((sum, c) => sum + (c.studentsCount || 0), 0);
      const acceptedMentees = await require('../models/MentorshipRequest').countDocuments({ mentorId: userId, status: 'accepted' });
      mentorActivity = {
        totalCourses: mentorCourses.length,
        totalStudents: totalStudents + acceptedMentees,
        totalSessions: acceptedMentees
      };
    }

    const enrollments = await Enrollment.find({ user: userId })
      .populate({
        path: 'course',
        select: 'title category rating studentsCount mentorId lessons',
        populate: { path: 'mentorId', select: 'name avatarUrl' }
      })
      .sort({ enrolledAt: -1 })
      .limit(10);

    const learningActivity = {
      enrolledCourses: enrollments.map(e => ({
        _id: e.course?._id,
        title: e.course?.title,
        category: e.course?.category,
        mentor: e.course?.mentorId,
        progress: e.progress,
        totalLessons: e.course?.lessons?.length || 0,
        completedLessons: e.completedLessons?.length || 0,
        enrolledAt: e.enrolledAt
      })),
      totalEnrolled: enrollments.length,
      completedCount: enrollments.filter(e => e.progress >= 100).length,
      totalHoursInvested: enrollments.reduce((sum, e) => sum + (e.completedLessons?.length || 0) * 0.5, 0)
    };

    const [exchangeDocs, pendingCount, acceptedCount, completedCount] = await Promise.all([
      ExchangeActivity.find({
        $or: [{ requesterId: userId }, { responderId: userId }]
      })
        .populate('requesterId', 'name avatarUrl')
        .populate('responderId', 'name avatarUrl')
        .sort({ createdAt: -1 })
        .limit(10),
      ExchangeActivity.countDocuments({
        $or: [{ requesterId: userId }, { responderId: userId }],
        status: 'pending'
      }),
      ExchangeActivity.countDocuments({
        $or: [{ requesterId: userId }, { responderId: userId }],
        status: 'accepted'
      }),
      ExchangeActivity.countDocuments({
        $or: [{ requesterId: userId }, { responderId: userId }],
        status: 'completed'
      })
    ]);

    const exchangeActivity = {
      totalExchanges: pendingCount + acceptedCount + completedCount,
      pending: pendingCount,
      active: acceptedCount,
      completed: completedCount,
      recentExchanges: exchangeDocs.map(a => {
        const isRequester = a.requesterId?._id?.toString() === userId.toString();
        return {
          _id: a._id,
          partner: isRequester
            ? { _id: a.responderId?._id, name: a.responderId?.name, avatarUrl: a.responderId?.avatarUrl }
            : { _id: a.requesterId?._id, name: a.requesterId?.name, avatarUrl: a.requesterId?.avatarUrl },
          offeredSkill: a.offeredSkill,
          requestedSkill: a.requestedSkill,
          status: a.status,
          isRequester,
          createdAt: a.createdAt
        };
      })
    };

    let mentorProfileData = null;
    if (isMentorVerified) {
      mentorProfileData = {
        bio: user.mentorProfile?.bio,
        expertise: user.mentorProfile?.skills?.map(s => s.name || s) || [],
        skills: user.mentorProfile?.skills || [],
        rating: user.mentorProfile?.rating || 5.0,
        experienceYears: user.mentorProfile?.experience,
        available: true,
        headline: user.mentorProfile?.headline,
        teachingPreference: user.mentorProfile?.teachingPreference,
        pricing: user.mentorProfile?.pricing,
        coverImageUrl: user.mentorProfile?.coverImageUrl,
        videoIntroUrl: user.mentorProfile?.videoIntroUrl,
        certifications: user.mentorProfile?.certifications || [],
        languages: user.mentorProfile?.languages || [],
        portfolioLinks: user.mentorProfile?.portfolioLinks || {}
      };

      // Track profile view (only when someone else views the profile)
      if (!isOwner) {
        try {
          await MentorProfileView.create({
            mentor: userId,
            viewer: req.user._id
          });
          // Increment profile views counter
          await User.findByIdAndUpdate(userId, {
            $inc: { 'mentorProfile.profileViews': 1 }
          });
        } catch (e) {
          // Don't fail the request if tracking fails
          console.log('Profile view tracking skipped:', e.message);
        }
      }
    }

    res.json({
      _id: user._id,
      name: user.name,
      avatarUrl: user.avatarUrl,
      bio: user.bio,
      skills: user.skills,
      learningGoals: user.learningGoals,
      experienceLevel: user.experienceLevel,
      goal: user.goal,
      availability: user.availability,
      socialLinks: user.socialLinks,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      isOwner,
      isMentor: isMentorVerified,
      mentorStatus: user.mentorStatus,
      mentorProfile: mentorProfileData,
      mentorCourses,
      mentorActivity,
      learningActivity,
      exchangeActivity,
      postsCount
    });
  } catch (error) {
    console.error('Public Profile Error:', error);
    res.status(500).json({ message: 'Error fetching public profile' });
  }
};

const getPublicProfileStats = async (req, res) => {
  try {
    const { userId } = req.params;
    const postsCount = await Post.countDocuments({ userId });
    res.json({ postsCount });
  } catch (error) {
    console.error('Public Stats Error:', error);
    res.status(500).json({ message: 'Error fetching profile stats' });
  }
};

module.exports = {
  getPublicProfile,
  getPublicProfileStats
};