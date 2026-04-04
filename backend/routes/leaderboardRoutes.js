const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const Enrollment = require('../models/Enrollment');
const LearningGoal = require('../models/LearningGoal');
const { getCache, setCache } = require('../services/cacheService');

// @desc    Get leaderboard
// @route   GET /api/leaderboard
router.get('/', protect, async (req, res) => {
  try {
    const { period = 'all-time', metric = 'hours', limit = 20 } = req.query;

    // Try cache first
    const cacheKey = `leaderboard:${metric}:${period}`;
    const cached = await getCache(cacheKey);
    if (cached) return res.json(cached);

    let dateFilter = {};
    const now = new Date();
    if (period === 'weekly') {
      const weekAgo = new Date(now);
      weekAgo.setDate(weekAgo.getDate() - 7);
      dateFilter = { enrolledAt: { $gte: weekAgo } };
    } else if (period === 'monthly') {
      const monthAgo = new Date(now);
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      dateFilter = { enrolledAt: { $gte: monthAgo } };
    }

    let leaderboard = [];

    if (metric === 'streak') {
      const goals = await LearningGoal.find({ streakDays: { $gt: 0 } })
        .populate('user', 'name avatarUrl')
        .sort({ streakDays: -1 })
        .limit(parseInt(limit));

      leaderboard = goals.map((g, i) => ({
        rank: i + 1,
        user: g.user,
        score: g.streakDays,
        metric: 'day streak'
      }));
    } else if (metric === 'xp') {
      const User = require('../models/User');
      const users = await User.find({ totalXP: { $gt: 0 } })
        .select('name avatarUrl totalXP')
        .sort({ totalXP: -1 })
        .limit(parseInt(limit));

      leaderboard = users.map((u, i) => ({
        rank: i + 1,
        user: { _id: u._id, name: u.name, avatarUrl: u.avatarUrl },
        score: u.totalXP,
        metric: 'XP earned'
      }));
    } else {
      const pipeline = [
        { $match: dateFilter },
        {
          $group: {
            _id: '$user',
            totalCompleted: { $sum: { $cond: [{ $gte: ['$progress', 100] }, 1, 0] } },
            totalLessons: { $sum: { $size: { $ifNull: ['$completedLessons', []] } } },
            totalEnrolled: { $sum: 1 },
            totalSeconds: { $sum: { $ifNull: ['$timeSpentSeconds', 0] } }
          }
        },
        {
          $addFields: {
            hoursLearned: { $divide: ['$totalSeconds', 3600] }
          }
        },
        {
          $sort: metric === 'courses'
            ? { totalCompleted: -1 }
            : { hoursLearned: -1 }
        },
        { $limit: parseInt(limit) },
        {
          $lookup: {
            from: 'users',
            localField: '_id',
            foreignField: '_id',
            as: 'user'
          }
        },
        { $unwind: '$user' },
        {
          $project: {
            user: { _id: '$user._id', name: '$user.name', avatarUrl: '$user.avatarUrl' },
            totalCompleted: 1,
            totalEnrolled: 1,
            hoursLearned: 1,
            totalLessons: 1
          }
        }
      ];

      const results = await Enrollment.aggregate(pipeline);

      leaderboard = results.map((r, i) => ({
        rank: i + 1,
        user: r.user,
        score: metric === 'courses' ? r.totalCompleted : Math.round(r.hoursLearned),
        metric: metric === 'courses' ? 'courses completed' : 'hours learned',
        details: { completed: r.totalCompleted, enrolled: r.totalEnrolled }
      }));
    }

    // Cache for 5 minutes
    await setCache(cacheKey, leaderboard, 300);

    res.json(leaderboard);
  } catch (error) {
    console.error('Leaderboard error:', error);
    res.status(500).json({ message: error.message });
  }
});

// @desc    Get current user's rank
// @route   GET /api/leaderboard/my-rank
router.get('/my-rank', protect, async (req, res) => {
  try {
    const { metric = 'hours', period = 'all-time' } = req.query;
    const userId = req.user._id;

    let dateFilter = {};
    const now = new Date();
    if (period === 'weekly') {
      const weekAgo = new Date(now);
      weekAgo.setDate(weekAgo.getDate() - 7);
      dateFilter = { enrolledAt: { $gte: weekAgo } };
    } else if (period === 'monthly') {
      const monthAgo = new Date(now);
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      dateFilter = { enrolledAt: { $gte: monthAgo } };
    }

    if (metric === 'xp') {
      const User = require('../models/User');
      const user = await User.findById(userId).select('totalXP');
      const higherCount = await User.countDocuments({ totalXP: { $gt: user?.totalXP || 0 } });
      return res.json({ rank: higherCount + 1, score: user?.totalXP || 0, metric: 'XP earned' });
    }

    if (metric === 'streak') {
      const goal = await LearningGoal.findOne({ user: userId });
      const higherCount = await LearningGoal.countDocuments({ streakDays: { $gt: goal?.streakDays || 0 } });
      return res.json({ rank: higherCount + 1, score: goal?.streakDays || 0, metric: 'day streak' });
    }

    const pipeline = [
      { $match: dateFilter },
      {
        $group: {
          _id: '$user',
          totalCompleted: { $sum: { $cond: [{ $gte: ['$progress', 100] }, 1, 0] } },
          totalSeconds: { $sum: { $ifNull: ['$timeSpentSeconds', 0] } }
        }
      },
      {
        $addFields: {
          score: metric === 'courses' ? '$totalCompleted' : { $divide: ['$totalSeconds', 3600] }
        }
      },
      { $sort: { score: -1 } }
    ];

    const allUsers = await Enrollment.aggregate(pipeline);
    const userIndex = allUsers.findIndex(u => u._id.toString() === userId.toString());

    res.json({
      rank: userIndex >= 0 ? userIndex + 1 : null,
      score: userIndex >= 0 ? (metric === 'courses' ? allUsers[userIndex].totalCompleted : Math.round(allUsers[userIndex].score)) : 0,
      metric: metric === 'courses' ? 'courses completed' : 'hours learned',
      totalUsers: allUsers.length
    });
  } catch (error) {
    console.error('My rank error:', error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
