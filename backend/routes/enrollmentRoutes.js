const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { enrollmentValidation } = require('../middleware/validate');
const Enrollment = require('../models/Enrollment');
const { Course } = require('../models/Learning');
const Earning = require('../models/Earning');
const { checkUserAchievements } = require('../services/achievementService');
const { updateWalletOnEarning } = require('../services/walletService');

// @desc    Enroll in a course
// @route   POST /api/enrollment/:courseId
router.post('/:courseId', ...enrollmentValidation.enroll, protect, async (req, res) => {
  try {
    const { courseId } = req.params;

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    const existing = await Enrollment.findOne({
      user: req.user._id,
      course: courseId
    });
    if (existing) {
      return res.status(400).json({ message: 'Already enrolled in this course' });
    }

    const enrollment = await Enrollment.create({
      user: req.user._id,
      course: courseId
    });

    await Course.findByIdAndUpdate(courseId, { $inc: { enrolledCount: 1 } });

    // Create earning record for paid courses
    if (course.price > 0 && course.mentorId) {
      const user = await require('../models/User').findById(req.user._id).select('name');
      const earning = await Earning.create({
        mentor: course.mentorId,
        amount: course.price,
        source: 'course',
        reference: enrollment._id,
        referenceType: 'Course',
        studentName: user?.name || 'Student',
        studentId: req.user._id,
        courseTitle: course.title,
        currency: 'USD',
        status: 'available'
      });
      
      await updateWalletOnEarning(earning);
    }

    res.status(201).json(enrollment);
  } catch (error) {
    console.error('Enroll error:', error);
    res.status(500).json({ message: 'Error enrolling in course' });
  }
});

// @desc    Get user's enrolled courses with progress (paginated)
// @route   GET /api/enrollment/my-courses
router.get('/my-courses', protect, async (req, res) => {
  try {
    const { filter, sort = 'recent', page = 1, limit = 10 } = req.query;
    const query = { user: req.user._id };

    if (filter === 'completed') {
      query.progress = { $gte: 100 };
    } else if (filter === 'in-progress') {
      query.progress = { $gt: 0, $lt: 100 };
    } else if (filter === 'bookmarked') {
      query.bookmarkedLessons = { $exists: true, $not: { $size: 0 } };
    }

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit)));
    const skip = (pageNum - 1) * limitNum;

    const sortOptions = {
      recent: { lastActiveAt: -1 },
      progress_desc: { progress: -1 },
      progress_asc: { progress: 1 },
      title: { 'course.title': 1 },
      enrolled: { enrolledAt: -1 }
    };

    const [enrollments, total] = await Promise.all([
      Enrollment.find(query)
        .populate({
          path: 'course',
          select: 'title category description lessons rating enrolledCount thumbnail level tags price mentorId',
          populate: { path: 'mentorId', select: 'name avatarUrl mentorProfile.headline' }
        })
        .sort(sortOptions[sort] || sortOptions.recent)
        .skip(skip)
        .limit(limitNum),
      Enrollment.countDocuments(query)
    ]);

    res.json({
      enrollments,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum),
      hasMore: skip + enrollments.length < total
    });
  } catch (error) {
    console.error('Get enrolled courses error:', error);
    res.status(500).json({ message: 'Error fetching enrolled courses' });
  }
});

// @desc    Mark a lesson as complete
// @route   PUT /api/enrollment/:id/progress
router.put('/:id/progress', ...enrollmentValidation.progress, protect, async (req, res) => {
  try {
    const { lessonIndex } = req.body;

    const enrollment = await Enrollment.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!enrollment) {
      return res.status(404).json({ message: 'Enrollment not found' });
    }

    if (!enrollment.completedLessons.includes(lessonIndex)) {
      enrollment.completedLessons.push(lessonIndex);
    }

    enrollment.lastAccessedLesson = lessonIndex;
    enrollment.lastActiveAt = new Date();

    const course = await Course.findById(enrollment.course);
    if (course && course.lessons && course.lessons.length > 0) {
      enrollment.progress = Math.round((enrollment.completedLessons.length / course.lessons.length) * 100);
      if (enrollment.progress >= 100 && !enrollment.completedAt) {
        enrollment.completedAt = new Date();
      }
    }

    await enrollment.save();

    // Auto-check achievements asynchronously
    checkUserAchievements(req.user._id).catch(err =>
      console.error('Auto achievement check error:', err)
    );

    res.json(enrollment);
  } catch (error) {
    console.error('Update progress error:', error);
    res.status(500).json({ message: 'Error updating progress' });
  }
});

// @desc    Toggle bookmark for a lesson
// @route   PUT /api/enrollment/:id/bookmark
router.put('/:id/bookmark', protect, async (req, res) => {
  try {
    const { lessonIndex } = req.body;
    if (lessonIndex === undefined) {
      return res.status(400).json({ message: 'lessonIndex is required' });
    }

    const enrollment = await Enrollment.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!enrollment) {
      return res.status(404).json({ message: 'Enrollment not found' });
    }

    const idx = enrollment.bookmarkedLessons.indexOf(lessonIndex);
    if (idx > -1) {
      enrollment.bookmarkedLessons.splice(idx, 1);
    } else {
      enrollment.bookmarkedLessons.push(lessonIndex);
    }

    await enrollment.save();
    res.json(enrollment);
  } catch (error) {
    console.error('Bookmark error:', error);
    res.status(500).json({ message: 'Error toggling bookmark' });
  }
});

// @desc    Update last accessed lesson (resume watching)
// @route   PUT /api/enrollment/:id/access
router.put('/:id/access', protect, async (req, res) => {
  try {
    const { lessonIndex } = req.body;
    if (lessonIndex === undefined) {
      return res.status(400).json({ message: 'lessonIndex is required' });
    }

    const enrollment = await Enrollment.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { lastAccessedLesson: lessonIndex, lastActiveAt: new Date() },
      { new: true }
    );

    if (!enrollment) {
      return res.status(404).json({ message: 'Enrollment not found' });
    }

    res.json(enrollment);
  } catch (error) {
    console.error('Access update error:', error);
    res.status(500).json({ message: 'Error updating access' });
  }
});

// @desc    Update time spent on course
// @route   PUT /api/enrollment/:id/time
router.put('/:id/time', protect, async (req, res) => {
  try {
    const { seconds } = req.body;
    if (!seconds || seconds < 0 || seconds > 3600) {
      return res.status(400).json({ message: 'Invalid seconds value (0-3600)' });
    }

    const enrollment = await Enrollment.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { $inc: { timeSpentSeconds: seconds }, lastActiveAt: new Date() },
      { new: true }
    );

    if (!enrollment) {
      return res.status(404).json({ message: 'Enrollment not found' });
    }

    res.json({ timeSpentSeconds: enrollment.timeSpentSeconds });
  } catch (error) {
    console.error('Time update error:', error);
    res.status(500).json({ message: 'Error updating time' });
  }
});

// @desc    Get learning stats (optimized with aggregation)
// @route   GET /api/enrollment/stats
router.get('/stats', protect, async (req, res) => {
  try {
    const stats = await Enrollment.aggregate([
      { $match: { user: req.user._id } },
      {
        $group: {
          _id: null,
          enrolled: { $sum: 1 },
          completed: { $sum: { $cond: [{ $gte: ['$progress', 100] }, 1, 0] } },
          inProgress: { $sum: { $cond: [{ $and: [{ $gt: ['$progress', 0] }, { $lt: ['$progress', 100] }] }, 1, 0] } },
          bookmarked: { $sum: { $cond: [{ $gt: [{ $size: { $ifNull: ['$bookmarkedLessons', []] } }, 0] }, 1, 0] } },
          totalLessons: { $sum: { $size: { $ifNull: ['$completedLessons', []] } } },
          totalSeconds: { $sum: { $ifNull: ['$timeSpentSeconds', 0] } }
        }
      },
      {
        $project: {
          _id: 0,
          enrolled: 1,
          completed: 1,
          inProgress: 1,
          bookmarked: 1,
          hours: { $round: [{ $divide: ['$totalSeconds', 3600] }, 1] }
        }
      }
    ]);

    res.json(stats[0] || { enrolled: 0, completed: 0, inProgress: 0, bookmarked: 0, hours: 0 });
  } catch (error) {
    console.error('Learning stats error:', error);
    res.status(500).json({ message: 'Error fetching learning stats' });
  }
});

// @desc    Get enrollment by course ID for current user
// @route   GET /api/enrollment/course/:courseId
router.get('/course/:courseId', protect, async (req, res) => {
  try {
    const enrollment = await Enrollment.findOne({
      user: req.user._id,
      course: req.params.courseId
    }).populate({
      path: 'course',
      select: 'title category description lessons rating enrolledCount thumbnail level tags price mentorId',
      populate: { path: 'mentorId', select: 'name avatarUrl mentorProfile.headline' }
    });

    if (!enrollment) {
      return res.status(404).json({ message: 'Not enrolled in this course' });
    }

    res.json(enrollment);
  } catch (error) {
    console.error('Get enrollment error:', error);
    res.status(500).json({ message: 'Error fetching enrollment' });
  }
});

// @desc    Get activity for calendar
// @route   GET /api/enrollment/activity
router.get('/activity', protect, async (req, res) => {
  try {
    const { month, year } = req.query;
    const startDate = new Date(year || new Date().getFullYear(), (month || new Date().getMonth() + 1) - 1, 1);
    const endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0, 23, 59, 59);

    const enrollments = await Enrollment.find({
      user: req.user._id,
      lastActiveAt: { $gte: startDate, $lte: endDate }
    }).select('lastActiveAt timeSpentSeconds');

    res.json(enrollments);
  } catch (error) {
    console.error('Activity error:', error);
    res.status(500).json({ message: 'Error fetching activity' });
  }
});

module.exports = router;
