const express = require('express');
const router = express.Router();

// Route files
const authRoutes = require('./authRoutes');
const userRoutes = require('./userRoutes');
const postRoutes = require('./postRoutes');
const learningRoutes = require('./learningRoutes');
const notificationRoutes = require('./notificationRoutes');

// Basic Health Check (Direct)
router.get('/health', (req, res) => {
  res.json({ status: 'ok', source: 'router_index' });
});

// Mounting
router.use('/auth', authRoutes);
router.use('/user', userRoutes);
router.use('/posts', postRoutes);
router.use('/courses', learningRoutes);
router.use('/notifications', notificationRoutes);

module.exports = router;
