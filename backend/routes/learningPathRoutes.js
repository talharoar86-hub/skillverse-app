const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { requireMentor } = require('../middleware/requireMentor');
const LearningPath = require('../models/LearningPath');
const PathEnrollment = require('../models/PathEnrollment');
const Enrollment = require('../models/Enrollment');

// @desc    Get all published learning paths
// @route   GET /api/learning-paths
router.get('/', protect, async (req, res) => {
  try {
    const { page = 1, limit = 12, category, level, search } = req.query;
    const query = { status: 'published' };
    if (category) query.category = category;
    if (level) query.level = level;
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (Math.max(1, parseInt(page)) - 1) * parseInt(limit);
    const [paths, total] = await Promise.all([
      LearningPath.find(query)
        .populate('creator', 'name avatarUrl mentorProfile.headline')
        .populate('courses.course', 'title thumbnail lessons level')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      LearningPath.countDocuments(query)
    ]);

    res.json({ paths, total, page: parseInt(page), totalPages: Math.ceil(total / parseInt(limit)) });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Get learning path by ID with enrollment status
// @route   GET /api/learning-paths/:id
router.get('/:id', protect, async (req, res) => {
  try {
    const path = await LearningPath.findById(req.params.id)
      .populate('creator', 'name avatarUrl mentorProfile.headline')
      .populate('courses.course', 'title thumbnail lessons level category enrolledCount rating');
    if (!path) return res.status(404).json({ message: 'Learning path not found' });

    // Check path enrollment
    const pathEnrollment = await PathEnrollment.findOne({ user: req.user._id, path: path._id });

    // Check course enrollments
    const enrollments = await Enrollment.find({ user: req.user._id, course: { $in: path.courses.map(c => c.course?._id) } });
    const enrollmentMap = {};
    enrollments.forEach(e => { enrollmentMap[e.course.toString()] = e; });

    const coursesWithProgress = path.courses.map(c => ({
      ...c.toObject(),
      enrollment: c.course ? enrollmentMap[c.course._id.toString()] || null : null,
      isEnrolled: c.course ? !!enrollmentMap[c.course._id.toString()] : false
    }));

    res.json({
      ...path.toObject(),
      courses: coursesWithProgress,
      pathEnrollment: pathEnrollment || null,
      isPathEnrolled: !!pathEnrollment
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Enroll in a learning path
// @route   POST /api/learning-paths/:id/enroll
router.post('/:id/enroll', protect, async (req, res) => {
  try {
    const learningPath = await LearningPath.findById(req.params.id);
    if (!learningPath) return res.status(404).json({ message: 'Learning path not found' });

    const existing = await PathEnrollment.findOne({ user: req.user._id, path: req.params.id });
    if (existing) return res.status(400).json({ message: 'Already enrolled in this path' });

    // Check prerequisites
    if (learningPath.prerequisites?.length > 0) {
      const prereqs = await PathEnrollment.find({
        user: req.user._id,
        path: { $in: learningPath.prerequisites },
        completedAt: { $ne: null }
      });
      if (prereqs.length < learningPath.prerequisites.length) {
        return res.status(400).json({ message: 'You must complete all prerequisite paths first' });
      }
    }

    const enrollment = await PathEnrollment.create({
      user: req.user._id,
      path: req.params.id
    });

    await LearningPath.findByIdAndUpdate(req.params.id, { $inc: { enrolledCount: 1 } });

    res.status(201).json(enrollment);
  } catch (error) {
    console.error('Path enrollment error:', error);
    res.status(500).json({ message: error.message });
  }
});

// @desc    Get path progress for current user
// @route   GET /api/learning-paths/:id/progress
router.get('/:id/progress', protect, async (req, res) => {
  try {
    const learningPath = await LearningPath.findById(req.params.id).populate('courses.course', 'title');
    if (!learningPath) return res.status(404).json({ message: 'Learning path not found' });

    const pathEnrollment = await PathEnrollment.findOne({ user: req.user._id, path: req.params.id });
    const courseEnrollments = await Enrollment.find({
      user: req.user._id,
      course: { $in: learningPath.courses.map(c => c.course?._id) }
    });

    const courseEnrollmentMap = {};
    courseEnrollments.forEach(e => { courseEnrollmentMap[e.course.toString()] = e; });

    const totalCourses = learningPath.courses.length;
    const completedCourses = courseEnrollments.filter(e => e.progress >= 100).length;
    const progress = totalCourses > 0 ? Math.round((completedCourses / totalCourses) * 100) : 0;

    const courseProgress = learningPath.courses.map(c => ({
      course: c.course,
      order: c.order,
      required: c.required,
      enrollment: c.course ? courseEnrollmentMap[c.course._id.toString()] || null : null,
      isCompleted: c.course ? (courseEnrollmentMap[c.course._id.toString()]?.progress >= 100) : false
    }));

    res.json({
      pathEnrollment,
      progress,
      completedCourses,
      totalCourses,
      courseProgress
    });
  } catch (error) {
    console.error('Path progress error:', error);
    res.status(500).json({ message: error.message });
  }
});

// @desc    Create learning path (mentor only)
// @route   POST /api/learning-paths
router.post('/', protect, requireMentor, async (req, res) => {
  try {
    const { title, description, thumbnail, courses, category, level, tags, status, prerequisites } = req.body;
    if (!title) return res.status(400).json({ message: 'Title is required' });

    const path = await LearningPath.create({
      title, description, thumbnail,
      creator: req.user._id,
      courses: (courses || []).map((c, i) => ({ ...c, order: i })),
      category, level, tags,
      prerequisites: prerequisites || [],
      status: status || 'draft'
    });

    res.status(201).json(path);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Update learning path (owner only)
// @route   PUT /api/learning-paths/:id
router.put('/:id', protect, requireMentor, async (req, res) => {
  try {
    const path = await LearningPath.findById(req.params.id);
    if (!path) return res.status(404).json({ message: 'Not found' });
    if (path.creator.toString() !== req.user._id.toString()) return res.status(403).json({ message: 'Not authorized' });

    const { title, description, thumbnail, courses, category, level, tags, status, prerequisites } = req.body;
    if (title) path.title = title;
    if (description !== undefined) path.description = description;
    if (thumbnail !== undefined) path.thumbnail = thumbnail;
    if (courses) path.courses = courses.map((c, i) => ({ ...c, order: i }));
    if (category) path.category = category;
    if (level) path.level = level;
    if (tags) path.tags = tags;
    if (status) path.status = status;
    if (prerequisites) path.prerequisites = prerequisites;
    path.updatedAt = Date.now();

    await path.save();
    res.json(path);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Delete learning path
// @route   DELETE /api/learning-paths/:id
router.delete('/:id', protect, requireMentor, async (req, res) => {
  try {
    const path = await LearningPath.findById(req.params.id);
    if (!path) return res.status(404).json({ message: 'Not found' });
    if (path.creator.toString() !== req.user._id.toString()) return res.status(403).json({ message: 'Not authorized' });

    await path.deleteOne();
    await PathEnrollment.deleteMany({ path: req.params.id });
    res.json({ message: 'Path deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
