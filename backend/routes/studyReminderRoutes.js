const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const StudyReminder = require('../models/StudyReminder');

// @desc    Get user's study reminders
// @route   GET /api/study-reminders
router.get('/', protect, async (req, res) => {
  try {
    let reminder = await StudyReminder.findOne({ user: req.user._id });
    if (!reminder) {
      reminder = await StudyReminder.create({ user: req.user._id });
    }
    res.json(reminder);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Update study reminder settings
// @route   PUT /api/study-reminders
router.put('/', protect, async (req, res) => {
  try {
    const { enabled, days, time, timezone, message } = req.body;
    let reminder = await StudyReminder.findOne({ user: req.user._id });
    if (!reminder) {
      reminder = await StudyReminder.create({ user: req.user._id });
    }

    if (enabled !== undefined) reminder.enabled = enabled;
    if (days) reminder.days = days;
    if (time) reminder.time = time;
    if (timezone) reminder.timezone = timezone;
    if (message) reminder.message = message;

    await reminder.save();
    res.json(reminder);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
