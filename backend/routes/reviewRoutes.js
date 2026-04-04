const express = require('express');
const router = express.Router();
const Review = require('../models/Review');
const User = require('../models/User');
const { protect } = require('../middleware/auth');
const { createNotification } = require('../controllers/notificationController');

// @desc    Submit a review for a mentor
// @route   POST /api/reviews/:mentorId
router.post('/:mentorId', protect, async (req, res) => {
  try {
    const { mentorId } = req.params;
    const { rating, comment, courseId } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Rating must be between 1 and 5' });
    }

    if (mentorId === req.user._id.toString()) {
      return res.status(400).json({ message: 'Cannot review yourself' });
    }

    const existing = await Review.findOne({ mentorId, studentId: req.user._id });
    if (existing) {
      return res.status(400).json({ message: 'You have already reviewed this mentor' });
    }

    const review = await Review.create({
      mentorId,
      studentId: req.user._id,
      courseId: courseId || null,
      rating,
      comment
    });

    // Update mentor's aggregate rating
    const reviews = await Review.find({ mentorId });
    const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;

    await User.findByIdAndUpdate(mentorId, {
      'mentorProfile.rating': Math.round(avgRating * 10) / 10,
      'mentorProfile.totalReviews': reviews.length
    });

    const populated = await review.populate('studentId', 'name avatarUrl');

    const io = req.app.get('io');
    await createNotification(io, {
      recipient: mentorId,
      sender: req.user._id,
      type: 'new_review',
      content: `${req.user.name} left a ${rating}-star review`,
      metadata: { reviewId: review._id, rating }
    });

    res.status(201).json(populated);
  } catch (error) {
    console.error('Submit Review Error:', error);
    res.status(500).json({ message: 'Error submitting review' });
  }
});

// @desc    Get mentor's reviews (paginated)
// @route   GET /api/reviews/:mentorId
router.get('/:mentorId', protect, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const [reviews, total] = await Promise.all([
      Review.find({ mentorId: req.params.mentorId })
        .populate('studentId', 'name avatarUrl')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Review.countDocuments({ mentorId: req.params.mentorId })
    ]);

    res.json({
      reviews,
      total,
      page,
      pages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error('Get Reviews Error:', error);
    res.status(500).json({ message: 'Error fetching reviews' });
  }
});

// @desc    Get rating breakdown for a mentor
// @route   GET /api/reviews/stats/:mentorId
router.get('/stats/:mentorId', protect, async (req, res) => {
  try {
    const { mentorId } = req.params;

    const [reviews, user] = await Promise.all([
      Review.find({ mentorId }),
      User.findById(mentorId).select('mentorProfile.rating mentorProfile.totalReviews')
    ]);

    const breakdown = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    reviews.forEach(r => {
      breakdown[r.rating] = (breakdown[r.rating] || 0) + 1;
    });

    const total = reviews.length;
    const breakdownPercent = {};
    for (let i = 5; i >= 1; i--) {
      breakdownPercent[i] = total > 0 ? Math.round((breakdown[i] / total) * 100) : 0;
    }

    const respondedReviews = reviews.filter(r => r.mentorReply?.text);
    const responseRate = total > 0 ? Math.round((respondedReviews.length / total) * 100) : 0;

    const thisMonth = new Date();
    thisMonth.setDate(1);
    thisMonth.setMonth(thisMonth.getMonth() - 1);
    const thisMonthReviews = reviews.filter(r => new Date(r.createdAt) >= thisMonth).length;

    const lastMonth = new Date();
    lastMonth.setDate(1);
    lastMonth.setMonth(lastMonth.getMonth() - 2);
    const lastMonthStart = new Date(lastMonth);
    lastMonthStart.setMonth(lastMonthStart.getMonth() - 1);
    const lastMonthReviews = reviews.filter(r => {
      const d = new Date(r.createdAt);
      return d >= lastMonthStart && d < thisMonth;
    }).length;

    const ratingTrend = lastMonthReviews > 0 && thisMonthReviews > 0
      ? ((thisMonthReviews - lastMonthReviews) / lastMonthReviews * 100).toFixed(0)
      : 0;

    res.json({
      averageRating: user?.mentorProfile?.rating || 0,
      totalReviews: total,
      breakdown,
      breakdownPercent,
      responseRate,
      thisMonthReviews,
      ratingTrend: Number(ratingTrend)
    });
  } catch (error) {
    console.error('Get Review Stats Error:', error);
    res.status(500).json({ message: 'Error fetching review stats' });
  }
});

// @desc    Reply to a mentor review
// @route   POST /api/reviews/:id/reply
router.post('/:id/reply', protect, async (req, res) => {
  try {
    const { text } = req.body;
    if (!text || !text.trim()) {
      return res.status(400).json({ message: 'Reply text is required' });
    }

    const review = await Review.findById(req.params.id);
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    if (review.mentorId.toString() !== req.user._id.toString()) {
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

module.exports = router;
