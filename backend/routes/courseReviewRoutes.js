const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { requireMentor } = require('../middleware/requireMentor');
const CourseReview = require('../models/CourseReview');
const { Course } = require('../models/Learning');
const Enrollment = require('../models/Enrollment');
const { createNotification } = require('../controllers/notificationController');

// @desc    Submit a course review
// @route   POST /api/course-reviews/:courseId
router.post('/:courseId', protect, async (req, res) => {
  try {
    const { courseId } = req.params;
    const { rating, comment } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Rating must be between 1 and 5' });
    }

    // Must be enrolled to review
    const enrollment = await Enrollment.findOne({ user: req.user._id, course: courseId });
    if (!enrollment) {
      return res.status(403).json({ message: 'You must be enrolled to review this course' });
    }

    const existing = await CourseReview.findOne({ course: courseId, user: req.user._id });
    if (existing) {
      return res.status(400).json({ message: 'You have already reviewed this course' });
    }

    const review = await CourseReview.create({
      course: courseId,
      user: req.user._id,
      rating,
      comment
    });

    // Get course to find mentor
    const course = await Course.findById(courseId);
    
    // Update course aggregate rating
    const reviews = await CourseReview.find({ course: courseId });
    const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
    await Course.findByIdAndUpdate(courseId, {
      rating: Math.round(avgRating * 10) / 10,
      totalReviews: reviews.length
    });

    // Send notification to mentor
    if (course && course.mentorId) {
      const io = req.app.get('io');
      await createNotification(io, {
        recipient: course.mentorId,
        sender: req.user._id,
        type: 'new_course_review',
        content: `${req.user.name} left a ${rating}-star review on "${course.title}"`,
        metadata: { reviewId: review._id, courseId: course._id, rating }
      });
    }

    const populated = await review.populate('user', 'name avatarUrl');
    res.status(201).json(populated);
  } catch (error) {
    console.error('Submit Course Review Error:', error);
    res.status(500).json({ message: 'Error submitting review' });
  }
});

// @desc    Get course reviews (paginated)
// @route   GET /api/course-reviews/:courseId
router.get('/:courseId', protect, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const sort = req.query.sort || 'newest';

    const sortOptions = {
      newest: { createdAt: -1 },
      highest: { rating: -1, createdAt: -1 },
      lowest: { rating: 1, createdAt: -1 }
    };

    const [reviews, total] = await Promise.all([
      CourseReview.find({ course: req.params.courseId })
        .populate('user', 'name avatarUrl')
        .sort(sortOptions[sort] || sortOptions.newest)
        .skip(skip)
        .limit(limit),
      CourseReview.countDocuments({ course: req.params.courseId })
    ]);

    // Check if current user has reviewed
    const userReview = await CourseReview.findOne({ course: req.params.courseId, user: req.user._id });

    res.json({
      reviews,
      total,
      page,
      pages: Math.ceil(total / limit),
      userHasReviewed: !!userReview
    });
  } catch (error) {
    console.error('Get Course Reviews Error:', error);
    res.status(500).json({ message: 'Error fetching reviews' });
  }
});

// @desc    Update own course review
// @route   PUT /api/course-reviews/:id
router.put('/:id', protect, async (req, res) => {
  try {
    const review = await CourseReview.findOne({ _id: req.params.id, user: req.user._id });
    if (!review) return res.status(404).json({ message: 'Review not found' });

    const { rating, comment } = req.body;
    if (rating) review.rating = rating;
    if (comment !== undefined) review.comment = comment;
    await review.save();

    // Recalculate course rating
    const reviews = await CourseReview.find({ course: review.course });
    const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
    await Course.findByIdAndUpdate(review.course, {
      rating: Math.round(avgRating * 10) / 10,
      totalReviews: reviews.length
    });

    const populated = await review.populate('user', 'name avatarUrl');
    res.json(populated);
  } catch (error) {
    console.error('Update Course Review Error:', error);
    res.status(500).json({ message: 'Error updating review' });
  }
});

// @desc    Delete own course review
// @route   DELETE /api/course-reviews/:id
router.delete('/:id', protect, async (req, res) => {
  try {
    const review = await CourseReview.findOne({ _id: req.params.id, user: req.user._id });
    if (!review) return res.status(404).json({ message: 'Review not found' });

    const courseId = review.course;
    await review.deleteOne();

    // Recalculate course rating
    const reviews = await CourseReview.find({ course: courseId });
    const avgRating = reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : 0;
    await Course.findByIdAndUpdate(courseId, {
      rating: Math.round(avgRating * 10) / 10,
      totalReviews: reviews.length
    });

    res.json({ message: 'Review deleted' });
  } catch (error) {
    console.error('Delete Course Review Error:', error);
    res.status(500).json({ message: 'Error deleting review' });
  }
});

// @desc    Mentor reply to a course review
// @route   POST /api/course-reviews/:id/reply
router.post('/:id/reply', protect, requireMentor, async (req, res) => {
  try {
    const review = await CourseReview.findById(req.params.id).populate('course', 'mentorId');
    if (!review) return res.status(404).json({ message: 'Review not found' });

    // Verify the mentor owns the course
    if (review.course.mentorId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const { text } = req.body;
    if (!text || !text.trim()) return res.status(400).json({ message: 'Reply text is required' });

    review.mentorReply = { text: text.trim(), repliedAt: new Date() };
    await review.save();

    const populated = await review.populate('user', 'name avatarUrl');
    res.json(populated);
  } catch (error) {
    console.error('Reply Error:', error);
    res.status(500).json({ message: 'Error submitting reply' });
  }
});

module.exports = router;
