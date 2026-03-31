const express = require('express');
const router = express.Router();
const { Course } = require('../models/Learning');
const Enrollment = require('../models/Enrollment');
const User = require('../models/User');
const { protect } = require('../middleware/auth');
const { requireMentor } = require('../middleware/requireMentor');
const { createNotification } = require('../controllers/notificationController');

// @desc    Get mentor's own courses
// @route   GET /api/courses/my-courses
router.get('/my-courses', protect, requireMentor, async (req, res) => {
  try {
    const courses = await Course.find({ mentorId: req.user._id })
      .sort({ createdAt: -1 });
    res.json(courses);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Publish a course
// @route   PUT /api/courses/:id/publish
router.put('/:id/publish', protect, requireMentor, async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ message: 'Course not found' });
    if (course.mentorId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    course.status = 'published';
    course.updatedAt = Date.now();
    await course.save();
    res.json(course);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Unpublish a course (back to draft)
// @route   PUT /api/courses/:id/draft
router.put('/:id/draft', protect, requireMentor, async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ message: 'Course not found' });
    if (course.mentorId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    course.status = 'draft';
    course.updatedAt = Date.now();
    await course.save();
    res.json(course);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Add lesson to course
// @route   POST /api/courses/:id/lessons
router.post('/:id/lessons', protect, requireMentor, async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ message: 'Course not found' });
    if (course.mentorId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const { title, description, duration, videoUrl, content } = req.body;
    if (!title) return res.status(400).json({ message: 'Lesson title is required' });

    course.lessons.push({
      title,
      description,
      duration,
      videoUrl,
      content,
      order: course.lessons.length
    });
    course.updatedAt = Date.now();

    await course.save();
    res.status(201).json(course);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Update lesson
// @route   PUT /api/courses/:id/lessons/:lessonId
router.put('/:id/lessons/:lessonId', protect, requireMentor, async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ message: 'Course not found' });
    if (course.mentorId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const lesson = course.lessons.id(req.params.lessonId);
    if (!lesson) return res.status(404).json({ message: 'Lesson not found' });

    const { title, description, duration, videoUrl, content } = req.body;
    if (title) lesson.title = title;
    if (description !== undefined) lesson.description = description;
    if (duration) lesson.duration = duration;
    if (videoUrl !== undefined) lesson.videoUrl = videoUrl;
    if (content !== undefined) lesson.content = content;

    course.updatedAt = Date.now();
    await course.save();
    res.json(course);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Delete lesson
// @route   DELETE /api/courses/:id/lessons/:lessonId
router.delete('/:id/lessons/:lessonId', protect, requireMentor, async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ message: 'Course not found' });
    if (course.mentorId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    course.lessons.pull(req.params.lessonId);
    course.updatedAt = Date.now();
    await course.save();
    res.json(course);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Update lesson progress
// @route   PUT /api/courses/:id/progress
router.put('/:id/progress', protect, async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ message: 'Course not found' });

    const { lessonIndex } = req.body;
    if (course.lessons[lessonIndex] && !course.lessons[lessonIndex].completedBy.includes(req.user._id)) {
      course.lessons[lessonIndex].completedBy.push(req.user._id);
    }

    await course.save();
    res.json(course);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Get course by ID
// @route   GET /api/courses/:id
router.get('/:id', protect, async (req, res) => {
  try {
    const course = await Course.findById(req.params.id)
      .populate('mentorId', 'name avatarUrl mentorProfile.headline mentorProfile.rating');
    if (!course) return res.status(404).json({ message: 'Course not found' });
    res.json(course);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Get all published courses (public)
// @route   GET /api/courses
router.get('/', protect, async (req, res) => {
  try {
    const courses = await Course.find({ status: 'published' })
      .populate('mentorId', 'name avatarUrl mentorProfile.headline')
      .sort({ createdAt: -1 });
    res.json(courses);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Create course (mentor only)
// @route   POST /api/courses
router.post('/', protect, requireMentor, async (req, res) => {
  try {
    const { title, description, category, level, tags, thumbnail, lessons } = req.body;

    if (!title) {
      return res.status(400).json({ message: 'Course title is required' });
    }

    const course = await Course.create({
      mentorId: req.user._id,
      title,
      description,
      category,
      level: level || 'Beginner',
      tags: tags || [],
      thumbnail,
      lessons: (lessons || []).map((l, i) => ({ ...l, order: i })),
      status: 'draft'
    });

    await User.findByIdAndUpdate(req.user._id, {
      $inc: { 'mentorProfile.totalCourses': 1 }
    });

    res.status(201).json(course);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Update course (owner only)
// @route   PUT /api/courses/:id
router.put('/:id', protect, requireMentor, async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ message: 'Course not found' });
    if (course.mentorId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const { title, description, category, level, tags, thumbnail } = req.body;
    if (title) course.title = title;
    if (description !== undefined) course.description = description;
    if (category) course.category = category;
    if (level) course.level = level;
    if (tags) course.tags = tags;
    if (thumbnail !== undefined) course.thumbnail = thumbnail;
    course.updatedAt = Date.now();

    await course.save();
    res.json(course);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Delete course (owner only)
// @route   DELETE /api/courses/:id
router.delete('/:id', protect, requireMentor, async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ message: 'Course not found' });
    if (course.mentorId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    await Course.findByIdAndDelete(req.params.id);
    await Enrollment.deleteMany({ course: req.params.id });
    await User.findByIdAndUpdate(req.user._id, {
      $inc: { 'mentorProfile.totalCourses': -1 }
    });

    res.json({ message: 'Course deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
