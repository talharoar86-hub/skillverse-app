const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const Wishlist = require('../models/Wishlist');

// @desc    Get user's wishlist
// @route   GET /api/wishlist
router.get('/', protect, async (req, res) => {
  try {
    let wishlist = await Wishlist.findOne({ user: req.user._id })
      .populate({
        path: 'courses',
        select: 'title category description lessons rating enrolledCount thumbnail level tags price mentorId',
        populate: { path: 'mentorId', select: 'name avatarUrl mentorProfile.headline' }
      });

    if (!wishlist) {
      wishlist = await Wishlist.create({ user: req.user._id, courses: [] });
    }

    res.json(wishlist);
  } catch (error) {
    console.error('Get wishlist error:', error);
    res.status(500).json({ message: 'Error fetching wishlist' });
  }
});

// @desc    Add course to wishlist
// @route   POST /api/wishlist/:courseId
router.post('/:courseId', protect, async (req, res) => {
  try {
    const wishlist = await Wishlist.findOneAndUpdate(
      { user: req.user._id },
      { $addToSet: { courses: req.params.courseId }, $set: { updatedAt: new Date() } },
      { upsert: true, new: true }
    ).populate({
      path: 'courses',
      select: 'title category description lessons rating enrolledCount thumbnail level tags price mentorId',
      populate: { path: 'mentorId', select: 'name avatarUrl mentorProfile.headline' }
    });

    res.json(wishlist);
  } catch (error) {
    console.error('Add to wishlist error:', error);
    res.status(500).json({ message: 'Error adding to wishlist' });
  }
});

// @desc    Remove course from wishlist
// @route   DELETE /api/wishlist/:courseId
router.delete('/:courseId', protect, async (req, res) => {
  try {
    const wishlist = await Wishlist.findOneAndUpdate(
      { user: req.user._id },
      { $pull: { courses: req.params.courseId }, $set: { updatedAt: new Date() } },
      { new: true }
    ).populate({
      path: 'courses',
      select: 'title category description lessons rating enrolledCount thumbnail level tags price mentorId',
      populate: { path: 'mentorId', select: 'name avatarUrl mentorProfile.headline' }
    });

    res.json(wishlist);
  } catch (error) {
    console.error('Remove from wishlist error:', error);
    res.status(500).json({ message: 'Error removing from wishlist' });
  }
});

module.exports = router;
