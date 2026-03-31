const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const Enrollment = require('../models/Enrollment');
const { Course } = require('../models/Learning');

// @desc    Enroll in a course
// @route   POST /api/enrollment/:courseId
router.post('/:courseId', protect, async (req, res) => {
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

    // Increment course students count
    await Course.findByIdAndUpdate(courseId, { $inc: { studentsCount: 1 } });

    res.status(201).json(enrollment);
  } catch (error) {
    console.error('Enroll error:', error);
    res.status(500).json({ message: 'Error enrolling in course' });
  }
});

// @desc    Get user's enrolled courses with progress
// @route   GET /api/enrollment/my-courses
router.get('/my-courses', protect, async (req, res) => {
  try {
    const enrollments = await Enrollment.find({ user: req.user._id })
      .populate('course', 'title category description lessons rating studentsCount')
      .sort({ enrolledAt: -1 });

    res.json(enrollments);
  } catch (error) {
    console.error('Get enrolled courses error:', error);
    res.status(500).json({ message: 'Error fetching enrolled courses' });
  }
});

// @desc    Mark a lesson as complete
// @route   PUT /api/enrollment/:id/progress
router.put('/:id/progress', protect, async (req, res) => {
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

    if (!enrollment.completedLessons.includes(lessonIndex)) {
      enrollment.completedLessons.push(lessonIndex);
    }

    // Calculate progress percentage
    const course = await Course.findById(enrollment.course);
    if (course && course.lessons && course.lessons.length > 0) {
      enrollment.progress = Math.round((enrollment.completedLessons.length / course.lessons.length) * 100);
    }

    await enrollment.save();

    res.json(enrollment);
  } catch (error) {
    console.error('Update progress error:', error);
    res.status(500).json({ message: 'Error updating progress' });
  }
});

// @desc    Get learning stats
// @route   GET /api/enrollment/stats
router.get('/stats', protect, async (req, res) => {
  try {
    const userId = req.user._id;

    const enrollments = await Enrollment.find({ user: userId });

    const enrolled = enrollments.length;
    const completed = enrollments.filter(e => e.progress >= 100).length;
    const hours = enrollments.reduce((sum, e) => {
      return sum + (e.completedLessons?.length || 0) * 0.5;
    }, 0);

    res.json({
      enrolled,
      completed,
      hours: Math.round(hours)
    });
  } catch (error) {
    console.error('Learning stats error:', error);
    res.status(500).json({ message: 'Error fetching learning stats' });
  }
});

module.exports = router;
