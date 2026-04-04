const express = require('express');
const router = express.Router();
const { Course } = require('../models/Learning');
const Enrollment = require('../models/Enrollment');
const User = require('../models/User');
const { protect } = require('../middleware/auth');
const { requireMentor } = require('../middleware/requireMentor');
const { createNotification } = require('../controllers/notificationController');
const { getRecommendedCourses } = require('../services/recommendationService');

// @desc    Get recommended courses
// @route   GET /api/courses/recommended
router.get('/recommended', protect, async (req, res) => {
  try {
    const courses = await getRecommendedCourses(req.user._id);
    res.json({ courses });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});
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

// @desc    Get distinct categories with course counts
// @route   GET /api/courses/categories
router.get('/categories', protect, async (req, res) => {
  try {
    const categories = await Course.aggregate([
      { $match: { status: 'published' } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $project: { name: '$_id', count: 1, _id: 0 } }
    ]);
    res.json(categories.filter(c => c.name));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Search suggestions (autocomplete)
// @route   GET /api/courses/search/suggestions
router.get('/search/suggestions', protect, async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.length < 2) return res.json([]);

    const regex = new RegExp(q, 'i');

    const [courses, cats] = await Promise.all([
      Course.find({ status: 'published', title: regex })
        .select('title category')
        .limit(5)
        .lean(),
      Course.distinct('category', { status: 'published', category: regex })
    ]);

    const suggestions = [
      ...courses.map(c => ({ type: 'course', text: c.title, id: c._id })),
      ...cats.slice(0, 3).map(c => ({ type: 'category', text: c }))
    ];

    res.json(suggestions.slice(0, 8));
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

    // Increment views asynchronously
    Course.findByIdAndUpdate(req.params.id, { $inc: { views: 1 } }).catch(() => {});

    const enrollment = await Enrollment.findOne({
      user: req.user._id,
      course: req.params.id
    });

    res.json({
      ...course.toObject(),
      enrollment: enrollment || null,
      isEnrolled: !!enrollment
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Get all published courses with pagination, search, filter, sort
// @route   GET /api/courses
router.get('/', protect, async (req, res) => {
  try {
    const {
      type, search, category, level, minRating,
      sort = 'newest', page = 1, limit = 12
    } = req.query;

    const query = { status: 'published' };

    // Type filter (free/paid)
    if (type === 'free') {
      query.$or = [{ price: 0 }, { price: { $exists: false } }];
    } else if (type === 'paid') {
      query.price = { $gt: 0 };
    }

    // Category filter
    if (category) {
      query.category = category;
    }

    // Level filter
    if (level) {
      query.level = level;
    }

    // Minimum rating filter
    if (minRating) {
      query.rating = { $gte: parseFloat(minRating) };
    }

    // Text search
    if (search) {
      query.$text = { $search: search };
    }

    // Sort options
    const sortOptions = {
      newest: { createdAt: -1 },
      oldest: { createdAt: 1 },
      popular: { enrolledCount: -1 },
      rating: { rating: -1, totalReviews: -1 },
      price_low: { price: 1 },
      price_high: { price: -1 },
      title: { title: 1 },
    };
    const sortField = sortOptions[sort] || sortOptions.newest;

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit)));
    const skip = (pageNum - 1) * limitNum;

    const [courses, total] = await Promise.all([
      Course.find(query)
        .populate('mentorId', 'name avatarUrl mentorProfile.headline mentorProfile.rating')
        .sort(sortField)
        .skip(skip)
        .limit(limitNum),
      Course.countDocuments(query)
    ]);

    res.json({
      courses,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum),
      hasMore: skip + courses.length < total
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Create course (mentor only)
// @route   POST /api/courses
router.post('/', protect, requireMentor, async (req, res) => {
  try {
    const { title, description, category, level, tags, thumbnail, lessons, price } = req.body;

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
      price: price || 0,
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

    const { title, description, category, level, tags, thumbnail, price } = req.body;
    if (title) course.title = title;
    if (description !== undefined) course.description = description;
    if (category) course.category = category;
    if (level) course.level = level;
    if (tags) course.tags = tags;
    if (thumbnail !== undefined) course.thumbnail = thumbnail;
    if (price !== undefined) course.price = price;
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

// @desc    Duplicate a course
// @route   POST /api/courses/:id/duplicate
router.post('/:id/duplicate', protect, requireMentor, async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ message: 'Course not found' });
    if (course.mentorId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const courseObj = course.toObject();
    delete courseObj._id;
    delete courseObj.__v;
    courseObj.title = `${courseObj.title} (Copy)`;
    courseObj.status = 'draft';
    courseObj.enrolledCount = 0;
    courseObj.views = 0;
    courseObj.rating = 0;
    courseObj.createdAt = new Date();
    courseObj.updatedAt = new Date();

    const duplicated = await Course.create(courseObj);

    await User.findByIdAndUpdate(req.user._id, {
      $inc: { 'mentorProfile.totalCourses': 1 }
    });

    res.status(201).json(duplicated);
  } catch (error) {
    console.error('Duplicate course error:', error);
    res.status(500).json({ message: 'Error duplicating course' });
  }
});

// @desc    Upload course thumbnail
// @route   POST /api/courses/upload-thumbnail
router.post('/upload-thumbnail', protect, requireMentor, (req, res) => {
  const multer = require('multer');
  const path = require('path');
  const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, path.join(__dirname, '..', 'uploads', 'thumbnails')),
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname);
      cb(null, `thumb_${Date.now()}_${Math.random().toString(36).slice(2)}${ext}`);
    }
  });
  const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
      if (file.mimetype.startsWith('image/')) cb(null, true);
      else cb(new Error('Only image files allowed'));
    }
  }).single('image');

  upload(req, res, (err) => {
    if (err) return res.status(400).json({ message: err.message });
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
    const url = `/uploads/thumbnails/${req.file.filename}`;
    res.json({ url });
  });
});

// @desc    Upload lesson video
// @route   POST /api/courses/upload-lesson-video
router.post('/upload-lesson-video', protect, requireMentor, async (req, res) => {
  const { uploadVideo, cloudinary } = require('../config/cloudinary');
  
  uploadVideo.single('video')(req, res, async (err) => {
    if (err) return res.status(400).json({ message: err.message });
    if (!req.file) return res.status(400).json({ message: 'No video file uploaded' });
    
    res.json({
      url: req.file.path,
      publicId: req.file.filename,
      duration: req.file.duration || null
    });
  });
});

module.exports = router;
