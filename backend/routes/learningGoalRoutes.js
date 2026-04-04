const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const LearningGoal = require('../models/LearningGoal');
const Enrollment = require('../models/Enrollment');

// @desc    Get learning goals
// @route   GET /api/learning-goals
router.get('/', protect, async (req, res) => {
  try {
    let goal = await LearningGoal.findOne({ user: req.user._id });
    if (!goal) {
      goal = await LearningGoal.create({ user: req.user._id });
    }
    res.json(goal);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Update learning goals
// @route   PUT /api/learning-goals
router.put('/', protect, async (req, res) => {
  try {
    const { weeklyHoursTarget, weeklyCoursesTarget } = req.body;
    let goal = await LearningGoal.findOne({ user: req.user._id });
    if (!goal) {
      goal = await LearningGoal.create({ user: req.user._id });
    }

    if (weeklyHoursTarget !== undefined) goal.weeklyHoursTarget = weeklyHoursTarget;
    if (weeklyCoursesTarget !== undefined) goal.weeklyCoursesTarget = weeklyCoursesTarget;
    await goal.save();
    res.json(goal);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Log learning activity and update streak
// @route   POST /api/learning-goals/log
router.post('/log', protect, async (req, res) => {
  try {
    const { hoursSpent, lessonsCompleted } = req.body;
    let goal = await LearningGoal.findOne({ user: req.user._id });
    if (!goal) goal = await LearningGoal.create({ user: req.user._id });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const lastActive = goal.lastActiveDate ? new Date(goal.lastActiveDate) : null;
    const lastActiveDay = lastActive ? new Date(lastActive.setHours(0, 0, 0, 0)) : null;

    // Update streak
    if (!lastActiveDay || lastActiveDay.getTime() < today.getTime()) {
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      if (lastActiveDay && lastActiveDay.getTime() === yesterday.getTime()) {
        goal.streakDays += 1;
      } else if (!lastActiveDay || lastActiveDay.getTime() < yesterday.getTime()) {
        goal.streakDays = 1;
      }
      goal.longestStreak = Math.max(goal.longestStreak, goal.streakDays);
    }

    goal.lastActiveDate = new Date();
    goal.currentWeekHours += (hoursSpent || 0);
    goal.currentWeekCourses += (lessonsCompleted || 0);
    goal.totalHoursLearned += (hoursSpent || 0);

    // Log activity
    goal.activityLog.push({
      date: new Date(),
      hoursSpent: hoursSpent || 0,
      lessonsCompleted: lessonsCompleted || 0
    });

    // Keep only last 90 days of logs
    if (goal.activityLog.length > 90) {
      goal.activityLog = goal.activityLog.slice(-90);
    }

    await goal.save();
    res.json(goal);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
