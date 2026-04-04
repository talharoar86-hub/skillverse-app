const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const Achievement = require('../models/Achievement');
const UserAchievement = require('../models/UserAchievement');
const { checkUserAchievements } = require('../services/achievementService');

// @desc    Get all achievements
// @route   GET /api/achievements
router.get('/', protect, async (req, res) => {
  try {
    const achievements = await Achievement.find().sort({ category: 1, criteriaThreshold: 1 });

    const userAchievements = await UserAchievement.find({ user: req.user._id }).populate('achievement');
    const userMap = {};
    userAchievements.forEach(ua => { userMap[ua.achievement._id.toString()] = ua; });

    const result = achievements.map(a => ({
      ...a.toObject(),
      userProgress: userMap[a._id.toString()] || { progress: 0, unlockedAt: null }
    }));

    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Check and award achievements for user
// @route   POST /api/achievements/check
router.post('/check', protect, async (req, res) => {
  try {
    const result = await checkUserAchievements(req.user._id);

    // Emit WebSocket event for new unlocks
    if (result.newUnlocks.length > 0) {
      const io = req.app.get('io');
      if (io) {
        result.newUnlocks.forEach(achievement => {
          io.to(req.user._id.toString()).emit('achievement:unlock', {
            name: achievement.name,
            icon: achievement.icon,
            xpReward: achievement.xpReward,
            rarity: achievement.rarity
          });
        });
      }
    }

    res.json(result);
  } catch (error) {
    console.error('Achievement check error:', error);
    res.status(500).json({ message: error.message });
  }
});

// @desc    Get user XP
// @route   GET /api/achievements/xp
router.get('/xp', protect, async (req, res) => {
  try {
    const XPLog = require('../models/XPLog');
    const User = require('../models/User');

    const user = await User.findById(req.user._id).select('totalXP');
    const recentLogs = await XPLog.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .limit(20);

    const totalXP = user?.totalXP || 0;
    const level = Math.floor(totalXP / 1000) + 1;
    const xpToNextLevel = 1000 - (totalXP % 1000);

    res.json({ totalXP, level, xpToNextLevel, recentLogs });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
