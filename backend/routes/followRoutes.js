const express = require('express');
const router = express.Router();
const {
  sendFollowRequest,
  acceptFollow,
  rejectFollow,
  getFollowStatus,
  getFollowers,
  getFollowing,
  getUserFollowers,
  getUserFollowing,
  getPendingRequests,
  unfollow
} = require('../controllers/followController');
const { protect } = require('../middleware/auth');

// Public profile routes (most specific first)
router.get('/user/:userId/followers', protect, getUserFollowers);
router.get('/user/:userId/following', protect, getUserFollowing);

// Current user routes
router.get('/followers', protect, getFollowers);
router.get('/following', protect, getFollowing);
router.get('/pending', protect, getPendingRequests);
router.get('/status/:userId', protect, getFollowStatus);

// Action routes
router.post('/:userId', protect, sendFollowRequest);
router.put('/:followId/accept', protect, acceptFollow);
router.put('/:followId/reject', protect, rejectFollow);
router.delete('/:userId', protect, unfollow);

module.exports = router;
