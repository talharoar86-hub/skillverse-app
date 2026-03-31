const express = require('express');
const router = express.Router();
const {
  createPost,
  getPosts,
  likePost,
  savePost,
  sharePost,
  sharePostLink,
  addComment,
  getUserPosts,
  getSavedPosts,
  updatePost,
  deletePost,
  markCommentHelpful,
  interestedPost,
  notInterestedPost,
  getInterestedPosts,
  getNotInterestedPosts,
  getReposts,
  getProfileStats,
  uploadPostImage,
  getPostById
} = require('../controllers/postController');
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');

// --- Specialized GET routes (MUST be above /:id) ---
router.get('/saved', protect, getSavedPosts);
router.get('/interested', protect, getInterestedPosts);
router.get('/not-interested', protect, getNotInterestedPosts);
router.get('/reposts', protect, getReposts);
router.get('/profile-stats', protect, getProfileStats);

// --- Public / General routes ---
router.get('/', protect, getPosts);
router.get('/:id', protect, getPostById);
router.get('/user/:userId', protect, getUserPosts);

// --- Protected Action routes ---
router.post('/', protect, createPost);
router.post('/upload', protect, upload.single('image'), uploadPostImage);
router.put('/:id/like', protect, likePost);
router.put('/:id/save', protect, savePost);
router.put('/:id/share', protect, sharePost);
router.put('/:id/share-count', protect, sharePostLink);
router.post('/:id/comment', protect, addComment);
router.put('/:id/comments/:commentId/helpful', protect, markCommentHelpful);

// --- Resource Management ---
router.put('/:id', protect, updatePost);
router.delete('/:id', protect, deletePost);
router.put('/:id/interested', protect, interestedPost);
router.put('/:id/not-interested', protect, notInterestedPost);

module.exports = router;
