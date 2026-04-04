const express = require('express');
const router = express.Router();
const User = require('../models/User');
const MentorshipRequest = require('../models/MentorshipRequest');
const Follow = require('../models/Follow');
const Enrollment = require('../models/Enrollment');
const { Course } = require('../models/Learning');
const Review = require('../models/Review');
const CourseReview = require('../models/CourseReview');
const { protect } = require('../middleware/auth');
const { requireMentor } = require('../middleware/requireMentor');
const { createNotification } = require('../controllers/notificationController');
const Earning = require('../models/Earning');
const MentorProfileView = require('../models/MentorProfileView');
const { uploadVideo, uploadCoverImage, cloudinary } = require('../config/cloudinary');

// @desc    Submit mentor application (auto-approve for MVP)
// @route   POST /api/mentor/apply
router.post('/apply', protect, async (req, res) => {
  try {
    const { headline, bio, skills, experience, teachingPreference, availability, pricing, portfolioLinks } = req.body;

    if (!headline || !bio || !skills || !experience || !teachingPreference || !availability) {
      return res.status(400).json({ message: 'All required fields must be provided' });
    }

    const user = await User.findById(req.user._id);
    if (user.mentorStatus === 'approved') {
      return res.status(400).json({ message: 'You are already an approved mentor' });
    }

    user.mentorStatus = 'approved';
    user.goal = 'Mentor';
    user.isMentor = true;
    user.mentorProfile = {
      headline,
      bio,
      skills: skills || [],
      experience: experience || 0,
      portfolioLinks: portfolioLinks || {},
      teachingPreference: teachingPreference || '1-to-1',
      availability,
      pricing: pricing || 0,
      totalStudents: 0,
      rating: 5.0,
      totalReviews: 0,
      totalCourses: 0,
      totalSessions: 0,
      certifications: [],
      languages: [],
      profileViews: 0
    };

    await user.save();

    const io = req.app.get('io');
    await createNotification(io, {
      recipient: user._id,
      sender: user._id,
      type: 'mentor_approved',
      content: 'Congratulations! Your mentor application has been approved. You can now access your Mentor Dashboard.'
    });

    const userObj = user.toObject();
    delete userObj.password;

    res.json(userObj);
  } catch (error) {
    console.error('Mentor Apply Error:', error);
    res.status(500).json({ message: 'Error submitting mentor application' });
  }
});

// @desc    Get current user's mentor status
// @route   GET /api/mentor/status
router.get('/status', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('mentorStatus mentorProfile isMentor goal');
    res.json({
      mentorStatus: user.mentorStatus,
      mentorProfile: user.mentorProfile,
      isMentor: user.isMentor,
      goal: user.goal
    });
  } catch (error) {
    console.error('Mentor Status Error:', error);
    res.status(500).json({ message: 'Error fetching mentor status' });
  }
});

// @desc    Get own mentor profile
// @route   GET /api/mentor/profile
router.get('/profile', protect, requireMentor, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('name email avatarUrl mentorProfile mentorStatus');

    // Get profile views count from the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [recentViews, totalViews] = await Promise.all([
      MentorProfileView.countDocuments({
        mentor: req.user._id,
        viewedAt: { $gte: thirtyDaysAgo }
      }),
      MentorProfileView.countDocuments({ mentor: req.user._id })
    ]);

    // Get schedule summary for availability
    const Schedule = require('../models/Schedule');
    const schedules = await Schedule.find({ mentorId: req.user._id });
    const totalSlots = schedules.reduce((sum, s) => sum + s.slots.length, 0);
    const bookedSlots = schedules.reduce((sum, s) => sum + s.slots.filter(sl => sl.status === 'booked').length, 0);

    const userObj = user.toObject();
    userObj.profileStats = {
      recentViews,
      totalViews,
      totalScheduleSlots: totalSlots,
      bookedScheduleSlots: bookedSlots
    };

    res.json(userObj);
  } catch (error) {
    console.error('Get Mentor Profile Error:', error);
    res.status(500).json({ message: 'Error fetching mentor profile' });
  }
});

// @desc    Update mentor profile
// @route   PUT /api/mentor/profile
router.put('/profile', protect, requireMentor, async (req, res) => {
  try {
    const {
      headline, bio, skills, experience, teachingPreference,
      availability, pricing, portfolioLinks, certifications, languages
    } = req.body;

    const user = await User.findById(req.user._id);

    if (headline !== undefined) user.mentorProfile.headline = headline;
    if (bio !== undefined) user.mentorProfile.bio = bio;
    if (skills) user.mentorProfile.skills = skills;
    if (experience !== undefined) user.mentorProfile.experience = experience;
    if (teachingPreference) user.mentorProfile.teachingPreference = teachingPreference;
    if (availability !== undefined) user.mentorProfile.availability = availability;
    if (pricing !== undefined) user.mentorProfile.pricing = pricing;
    if (portfolioLinks) user.mentorProfile.portfolioLinks = portfolioLinks;
    if (certifications) user.mentorProfile.certifications = certifications;
    if (languages) user.mentorProfile.languages = languages;

    user.mentorProfile.lastProfileUpdate = new Date();

    await user.save();

    const userObj = user.toObject();
    delete userObj.password;

    res.json(userObj);
  } catch (error) {
    console.error('Update Mentor Profile Error:', error);
    res.status(500).json({ message: 'Error updating mentor profile' });
  }
});

// @desc    Upload mentor cover image
// @route   POST /api/mentor/upload-cover
router.post('/upload-cover', protect, requireMentor, uploadCoverImage.single('coverImage'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No image file provided' });
    }

    const user = await User.findById(req.user._id);

    // Delete old cover image from Cloudinary if exists
    if (user.mentorProfile?.coverImageUrl) {
      try {
        const oldUrl = user.mentorProfile.coverImageUrl;
        const publicId = oldUrl.split('/').slice(-2).join('/').split('.')[0];
        await cloudinary.uploader.destroy(publicId);
      } catch (e) {
        console.log('Old cover image deletion skipped');
      }
    }

    user.mentorProfile.coverImageUrl = req.file.path;
    user.mentorProfile.lastProfileUpdate = new Date();
    await user.save();

    res.json({ coverImageUrl: req.file.path });
  } catch (error) {
    console.error('Cover Upload Error:', error);
    res.status(500).json({ message: 'Error uploading cover image' });
  }
});

// @desc    Upload mentor video intro
// @route   POST /api/mentor/upload-video
router.post('/upload-video', protect, requireMentor, uploadVideo.single('video'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No video file provided' });
    }

    const user = await User.findById(req.user._id);

    // Delete old video from Cloudinary if exists
    if (user.mentorProfile?.videoIntroPublicId) {
      try {
        await cloudinary.uploader.destroy(user.mentorProfile.videoIntroPublicId, {
          resource_type: 'video'
        });
      } catch (e) {
        console.log('Old video deletion skipped');
      }
    }

    user.mentorProfile.videoIntroUrl = req.file.path;
    user.mentorProfile.videoIntroPublicId = req.file.filename;
    user.mentorProfile.lastProfileUpdate = new Date();
    await user.save();

    res.json({
      videoIntroUrl: req.file.path,
      videoIntroPublicId: req.file.filename
    });
  } catch (error) {
    console.error('Video Upload Error:', error);
    res.status(500).json({ message: 'Error uploading video intro' });
  }
});

// @desc    Delete mentor video intro
// @route   DELETE /api/mentor/video-intro
router.delete('/video-intro', protect, requireMentor, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (user.mentorProfile?.videoIntroPublicId) {
      await cloudinary.uploader.destroy(user.mentorProfile.videoIntroPublicId, {
        resource_type: 'video'
      });
    }

    user.mentorProfile.videoIntroUrl = undefined;
    user.mentorProfile.videoIntroPublicId = undefined;
    user.mentorProfile.lastProfileUpdate = new Date();
    await user.save();

    res.json({ message: 'Video intro removed' });
  } catch (error) {
    console.error('Delete Video Error:', error);
    res.status(500).json({ message: 'Error deleting video intro' });
  }
});

// @desc    Get profile views analytics
// @route   GET /api/mentor/profile-views
router.get('/profile-views', protect, requireMentor, async (req, res) => {
  try {
    const userId = req.user._id;
    const { period = '30d' } = req.query;

    let startDate = new Date();
    if (period === '7d') startDate.setDate(startDate.getDate() - 7);
    else if (period === '30d') startDate.setDate(startDate.getDate() - 30);
    else if (period === '90d') startDate.setDate(startDate.getDate() - 90);
    else startDate = new Date(0);

    const [viewsByDay, totalViews, recentViews] = await Promise.all([
      MentorProfileView.aggregate([
        { $match: { mentor: userId, viewedAt: { $gte: startDate } } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$viewedAt' } },
            count: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } },
        { $project: { date: '$_id', views: '$count', _id: 0 } }
      ]),
      MentorProfileView.countDocuments({ mentor: userId }),
      MentorProfileView.countDocuments({ mentor: userId, viewedAt: { $gte: startDate } })
    ]);

    res.json({
      viewsByDay,
      totalViews,
      recentViews,
      period
    });
  } catch (error) {
    console.error('Profile Views Error:', error);
    res.status(500).json({ message: 'Error fetching profile views' });
  }
});

// @desc    Get mentor stats by mentor ID (public - for displaying on mentor cards)
// @route   GET /api/mentor/public-stats/:mentorId
router.get('/public-stats/:mentorId', protect, async (req, res) => {
  try {
    const { mentorId } = req.params;
    
    const mentor = await User.findById(mentorId).select('name avatarUrl mentorProfile isMentor mentorStatus');
    if (!mentor || !mentor.isMentor || mentor.mentorStatus !== 'approved') {
      return res.status(404).json({ message: 'Mentor not found' });
    }

    const [acceptedCount, courseCount] = await Promise.all([
      MentorshipRequest.countDocuments({ mentorId, status: 'accepted' }),
      Course.countDocuments({ mentorId, status: 'published' })
    ]);

    const ratingResult = await Review.aggregate([
      { $match: { mentorId } },
      { $group: { _id: null, avgRating: { $avg: '$rating' } } }
    ]);
    const rating = ratingResult[0]?.avgRating ? Math.round(ratingResult[0].avgRating * 10) / 10 : 5.0;

    res.json({
      totalStudents: acceptedCount,
      totalCourses: courseCount,
      rating,
      isMentor: true,
      mentorStatus: 'approved'
    });
  } catch (error) {
    console.error('Get Public Mentor Stats Error:', error);
    res.status(500).json({ message: 'Error fetching mentor stats' });
  }
});

// @desc    Get dashboard stats for mentor
// @route   GET /api/mentor/dashboard/stats
router.get('/dashboard/stats', protect, requireMentor, async (req, res) => {
  try {
    const userId = req.user._id;

    const [acceptedCount, pendingCount, courseCount, enrollmentCount] = await Promise.all([
      MentorshipRequest.countDocuments({ mentorId: userId, status: 'accepted' }),
      MentorshipRequest.countDocuments({ mentorId: userId, status: 'pending' }),
      Course.countDocuments({ mentorId: userId, status: 'published' }),
      Enrollment.countDocuments({
        course: { $in: await Course.find({ mentorId: userId }).distinct('_id') }
      })
    ]);

    const user = await User.findById(userId).select('mentorProfile');

    // Calculate real earnings
    const earningsResult = await Earning.aggregate([
      { $match: { mentor: userId } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    const totalEarnings = earningsResult[0]?.total || 0;

    // Calculate real rating from mentor reviews
    const ratingResult = await Review.aggregate([
      { $match: { mentorId: userId } },
      { $group: { _id: null, avgRating: { $avg: '$rating' }, totalReviews: { $sum: 1 } } }
    ]);
    const rating = ratingResult[0]?.avgRating ? Math.round(ratingResult[0].avgRating * 10) / 10 : 5.0;
    const totalReviews = ratingResult[0]?.totalReviews || 0;

    // Update mentor profile with calculated rating
    if (user?.mentorProfile && (user.mentorProfile.rating !== rating || user.mentorProfile.totalReviews !== totalReviews)) {
      user.mentorProfile.rating = rating;
      user.mentorProfile.totalReviews = totalReviews;
      await user.save();
    }

    res.json({
      totalStudents: enrollmentCount + acceptedCount,
      activeSessions: acceptedCount,
      totalEarnings,
      rating,
      totalReviews,
      totalCourses: courseCount,
      totalSessions: acceptedCount,
      pendingRequests: pendingCount
    });
  } catch (error) {
    console.error('Dashboard Stats Error:', error);
    res.status(500).json({ message: 'Error fetching dashboard stats' });
  }
});

// @desc    Get list of students (enrolled + mentees)
// @route   GET /api/mentor/dashboard/students
router.get('/dashboard/students', protect, requireMentor, async (req, res) => {
  try {
    const userId = req.user._id;

    const [mentees, enrollments] = await Promise.all([
      MentorshipRequest.find({ mentorId: userId, status: 'accepted' })
        .populate('menteeId', 'name avatarUrl skills')
        .sort({ updatedAt: -1 }),
      Enrollment.find({
        course: { $in: await Course.find({ mentorId: userId }).distinct('_id') }
      }).populate('user', 'name avatarUrl skills')
    ]);

    const students = [];

    mentees.forEach(m => {
      if (m.menteeId) {
        students.push({
          _id: m.menteeId._id,
          name: m.menteeId.name,
          avatarUrl: m.menteeId.avatarUrl,
          skills: m.menteeId.skills,
          type: 'mentee',
          since: m.createdAt
        });
      }
    });

    enrollments.forEach(e => {
      if (e.user && !students.find(s => s._id.toString() === e.user._id.toString())) {
        students.push({
          _id: e.user._id,
          name: e.user.name,
          avatarUrl: e.user.avatarUrl,
          skills: e.user.skills,
          type: 'student',
          since: e.enrolledAt
        });
      }
    });

    res.json(students);
  } catch (error) {
    console.error('Get Students Error:', error);
    res.status(500).json({ message: 'Error fetching students' });
  }
});

// @desc    Get upcoming booked sessions
// @route   GET /api/mentor/dashboard/upcoming-sessions
router.get('/dashboard/upcoming-sessions', protect, requireMentor, async (req, res) => {
  try {
    const Schedule = require('../models/Schedule');
    const schedules = await Schedule.find({
      mentorId: req.user._id,
      'slots.status': 'booked'
    }).populate('slots.bookedBy', 'name avatarUrl');

    const sessions = [];
    schedules.forEach(schedule => {
      schedule.slots.forEach(slot => {
        if (slot.status === 'booked') {
          sessions.push({
            _id: slot._id,
            dayOfWeek: schedule.dayOfWeek,
            startTime: slot.startTime,
            endTime: slot.endTime,
            student: slot.bookedBy,
            timezone: schedule.timezone
          });
        }
      });
    });

    res.json(sessions);
  } catch (error) {
    console.error('Upcoming Sessions Error:', error);
    res.status(500).json({ message: 'Error fetching upcoming sessions' });
  }
});

// @desc    Get mentor analytics
// @route   GET /api/mentor/dashboard/analytics
router.get('/dashboard/analytics', protect, requireMentor, async (req, res) => {
  try {
    const userId = req.user._id;
    const { period = '30d' } = req.query;

    let startDate = new Date();
    if (period === '7d') startDate.setDate(startDate.getDate() - 7);
    else if (period === '30d') startDate.setDate(startDate.getDate() - 30);
    else if (period === '90d') startDate.setDate(startDate.getDate() - 90);
    else startDate = new Date(0);

    const courseIds = await Course.find({ mentorId: userId }).distinct('_id');

    // Student growth over time
    const enrollmentsByMonth = await Enrollment.aggregate([
      { $match: { course: { $in: courseIds }, enrolledAt: { $gte: startDate } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m', date: '$enrolledAt' } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } },
      { $project: { month: '$_id', students: '$count', _id: 0 } }
    ]);

    // Completion rate
    const completionStats = await Enrollment.aggregate([
      { $match: { course: { $in: courseIds } } },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          completed: { $sum: { $cond: [{ $gte: ['$progress', 100] }, 1, 0] } }
        }
      }
    ]);

    const total = completionStats[0]?.total || 0;
    const completed = completionStats[0]?.completed || 0;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    // Earnings over time
    const earningsByMonth = await Earning.aggregate([
      { $match: { mentor: userId, createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
          amount: { $sum: '$amount' }
        }
      },
      { $sort: { _id: 1 } },
      { $project: { month: '$_id', earnings: '$amount', _id: 0 } }
    ]);

    // Course-specific stats
    const courseStats = await Promise.all(
      courseIds.map(async (courseId) => {
        const course = await Course.findById(courseId).select('title views enrolledCount rating');
        const enrolled = await Enrollment.countDocuments({ course: courseId });
        const completed = await Enrollment.countDocuments({ course: courseId, progress: { $gte: 100 } });
        return {
          courseId,
          title: course?.title,
          views: course?.views || 0,
          enrollments: enrolled,
          completionRate: enrolled > 0 ? Math.round((completed / enrolled) * 100) : 0,
          rating: course?.rating || 0
        };
      })
    );

    res.json({
      studentGrowth: enrollmentsByMonth,
      completionRate: [
        { name: 'Completed', value: completionRate },
        { name: 'In Progress', value: 100 - completionRate }
      ],
      earningsTrend: earningsByMonth,
      courseStats,
      summary: {
        totalStudents: total,
        completedStudents: completed,
        completionRate,
        totalCourses: courseIds.length
      }
    });
  } catch (error) {
    console.error('Analytics Error:', error);
    res.status(500).json({ message: 'Error fetching analytics' });
  }
});

// @desc    Get earnings history with pagination, search, and filter
// @route   GET /api/mentor/earnings
router.get('/earnings', protect, requireMentor, async (req, res) => {
  try {
    const { page = 1, limit = 20, period = '30d', source, search, sort = 'newest' } = req.query;
    const userId = req.user._id;

    let startDate = new Date();
    if (period === '7d') startDate.setDate(startDate.getDate() - 7);
    else if (period === '30d') startDate.setDate(startDate.getDate() - 30);
    else if (period === '90d') startDate.setDate(startDate.getDate() - 90);
    else if (period === 'all') startDate = new Date(0);
    else startDate = new Date(0);

    const query = { mentor: userId, createdAt: { $gte: startDate } };
    if (source && ['course', 'mentorship'].includes(source)) {
      query.source = source;
    }
    if (search) {
      query.$or = [
        { studentName: { $regex: search, $options: 'i' } },
        { courseTitle: { $regex: search, $options: 'i' } }
      ];
    }

    const sortOption = sort === 'oldest' ? { createdAt: 1 } : { createdAt: -1 };

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit)));
    const skip = (pageNum - 1) * limitNum;

    const [earnings, total, summary] = await Promise.all([
      Earning.find(query)
        .sort(sortOption)
        .skip(skip)
        .limit(limitNum),
      Earning.countDocuments(query),
      Earning.aggregate([
        { $match: { mentor: userId, createdAt: { $gte: startDate } } },
        {
          $group: {
            _id: '$source',
            total: { $sum: '$amount' },
            count: { $sum: 1 }
          }
        }
      ])
    ]);

    const summaryObj = { course: { total: 0, count: 0 }, mentorship: { total: 0, count: 0 } };
    summary.forEach(s => {
      if (summaryObj[s._id]) {
        summaryObj[s._id] = { total: s.total, count: s.count };
      }
    });

    // Earnings trend for charts
    const trend = await Earning.aggregate([
      { $match: { mentor: userId, createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          amount: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } },
      { $project: { date: '$_id', amount: 1, count: 1, _id: 0 } }
    ]);

    // Calculate total students served
    const uniqueStudents = await Earning.distinct('studentId', { mentor: userId, createdAt: { $gte: startDate } });

    res.json({
      earnings,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum),
      hasMore: skip + earnings.length < total,
      summary: summaryObj,
      trend,
      stats: {
        totalStudents: uniqueStudents.filter(Boolean).length,
        avgPerTransaction: total > 0 ? (summaryObj.course.total + summaryObj.mentorship.total) / total : 0
      }
    });
  } catch (error) {
    console.error('Earnings Error:', error);
    res.status(500).json({ message: 'Error fetching earnings' });
  }
});

// @desc    Get course reviews for mentor's courses with reply capability
// @route   GET /api/mentor/course-reviews
router.get('/course-reviews', protect, requireMentor, async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const userId = req.user._id;

    const courseIds = await Course.find({ mentorId: userId }).distinct('_id');

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit)));
    const skip = (pageNum - 1) * limitNum;

    const [reviews, total] = await Promise.all([
      CourseReview.find({ course: { $in: courseIds } })
        .populate('user', 'name avatarUrl')
        .populate('course', 'title')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      CourseReview.countDocuments({ course: { $in: courseIds } })
    ]);

    res.json({
      reviews,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum),
      hasMore: skip + reviews.length < total
    });
  } catch (error) {
    console.error('Course Reviews Error:', error);
    res.status(500).json({ message: 'Error fetching course reviews' });
  }
});

// @desc    Reply to a course review
// @route   POST /api/mentor/course-reviews/:id/reply
router.post('/course-reviews/:id/reply', protect, requireMentor, async (req, res) => {
  try {
    const { text } = req.body;
    if (!text || !text.trim()) {
      return res.status(400).json({ message: 'Reply text is required' });
    }

    const review = await CourseReview.findById(req.params.id).populate('course');
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    if (review.course.mentorId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to reply to this review' });
    }

    review.mentorReply = { text: text.trim(), repliedAt: new Date() };
    await review.save();

    res.json(review);
  } catch (error) {
    console.error('Reply Error:', error);
    res.status(500).json({ message: 'Error replying to review' });
  }
});

// @desc    Get mentor notification settings
// @route   GET /api/mentor/settings
router.get('/settings', protect, requireMentor, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('mentorProfile.notificationSettings');
    const defaults = {
      emailNotifications: true,
      enrollmentAlerts: true,
      sessionReminders: true,
      reviewAlerts: true,
      mentorshipRequests: true,
      marketingEmails: false
    };
    res.json(user?.mentorProfile?.notificationSettings || defaults);
  } catch (error) {
    console.error('Settings Error:', error);
    res.status(500).json({ message: 'Error fetching settings' });
  }
});

// @desc    Update mentor notification settings
// @route   PUT /api/mentor/settings
router.put('/settings', protect, requireMentor, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const settings = req.body;

    if (!user.mentorProfile) {
      return res.status(400).json({ message: 'Mentor profile not found' });
    }

    user.mentorProfile.notificationSettings = {
      ...user.mentorProfile.notificationSettings?.toObject?.() || {},
      ...settings
    };
    await user.save();

    res.json(user.mentorProfile.notificationSettings);
  } catch (error) {
    console.error('Update Settings Error:', error);
    res.status(500).json({ message: 'Error updating settings' });
  }
});

module.exports = router;
