const express = require('express');
const router = express.Router();
const {
  getCourses,
  createCourse,
  getMentor,
  updateProgress
} = require('../controllers/learningController');
const { protect } = require('../middleware/auth');

router.route('/')
  .get(protect, getCourses)
  .post(protect, createCourse);

router.get('/mentor/:id', protect, getMentor);
router.put('/:id/progress', protect, updateProgress);

module.exports = router;
