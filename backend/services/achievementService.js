const Achievement = require('../models/Achievement');
const UserAchievement = require('../models/UserAchievement');
const Enrollment = require('../models/Enrollment');
const CourseReview = require('../models/CourseReview');
const LessonNote = require('../models/LessonNote');
const User = require('../models/User');
const XPLog = require('../models/XPLog');

const DEFAULT_ACHIEVEMENTS = [
  { name: 'First Steps', description: 'Enroll in your first course', icon: 'footprints', criteriaType: 'enrollments', criteriaThreshold: 1, category: 'milestone', xpReward: 10, rarity: 'common' },
  { name: 'Getting Started', description: 'Complete your first course', icon: 'star', criteriaType: 'courses_completed', criteriaThreshold: 1, category: 'completion', xpReward: 50, rarity: 'common' },
  { name: 'Dedicated Learner', description: 'Complete 5 courses', icon: 'award', criteriaType: 'courses_completed', criteriaThreshold: 5, category: 'completion', xpReward: 200, rarity: 'rare' },
  { name: 'Course Master', description: 'Complete 10 courses', icon: 'trophy', criteriaType: 'courses_completed', criteriaThreshold: 10, category: 'completion', xpReward: 500, rarity: 'epic' },
  { name: 'Week Warrior', description: 'Maintain a 7-day learning streak', icon: 'flame', criteriaType: 'streak_days', criteriaThreshold: 7, category: 'streak', xpReward: 100, rarity: 'common' },
  { name: 'Monthly Master', description: 'Maintain a 30-day learning streak', icon: 'zap', criteriaType: 'streak_days', criteriaThreshold: 30, category: 'streak', xpReward: 300, rarity: 'rare' },
  { name: 'Century Scholar', description: 'Learn for 100 hours', icon: 'clock', criteriaType: 'hours_learned', criteriaThreshold: 100, category: 'milestone', xpReward: 500, rarity: 'epic' },
  { name: 'Reviewer', description: 'Write your first review', icon: 'message-square', criteriaType: 'reviews_written', criteriaThreshold: 1, category: 'social', xpReward: 25, rarity: 'common' },
  { name: 'Note Taker', description: 'Write 10 lesson notes', icon: 'edit-3', criteriaType: 'notes_taken', criteriaThreshold: 10, category: 'social', xpReward: 50, rarity: 'common' },
];

async function seedAchievements() {
  const count = await Achievement.countDocuments();
  if (count === 0) {
    await Achievement.insertMany(DEFAULT_ACHIEVEMENTS);
    console.log('Achievements seeded');
  }
}

async function checkUserAchievements(userId) {
  const [enrollments, reviews, notes, achievements] = await Promise.all([
    Enrollment.find({ user: userId }),
    CourseReview.countDocuments({ user: userId }),
    LessonNote.countDocuments({ user: userId }),
    Achievement.find()
  ]);

  const completed = enrollments.filter(e => e.progress >= 100).length;
  const totalHours = enrollments.reduce((sum, e) => sum + (e.timeSpentSeconds || 0), 0) / 3600;
  const enrolled = enrollments.length;

  const LearningGoal = require('../models/LearningGoal');
  const goal = await LearningGoal.findOne({ user: userId });
  const streak = goal?.streakDays || 0;

  const stats = {
    enrollments: enrolled,
    courses_completed: completed,
    hours_learned: Math.round(totalHours),
    streak_days: streak,
    reviews_written: reviews,
    notes_taken: notes
  };

  const newUnlocks = [];

  for (const achievement of achievements) {
    const statValue = stats[achievement.criteriaType] || 0;
    const existing = await UserAchievement.findOne({ user: userId, achievement: achievement._id });

    if (statValue >= achievement.criteriaThreshold) {
      if (!existing) {
        const ua = await UserAchievement.create({
          user: userId,
          achievement: achievement._id,
          progress: statValue,
          unlockedAt: new Date()
        });

        // Award XP
        if (achievement.xpReward > 0) {
          await awardXP(userId, achievement.xpReward, `Achievement: ${achievement.name}`, { achievementId: achievement._id });
        }

        newUnlocks.push({ ...achievement.toObject(), unlockedAt: ua.unlockedAt });
      } else if (!existing.unlockedAt) {
        existing.unlockedAt = new Date();
        existing.progress = statValue;
        await existing.save();

        if (achievement.xpReward > 0) {
          await awardXP(userId, achievement.xpReward, `Achievement: ${achievement.name}`, { achievementId: achievement._id });
        }

        newUnlocks.push({ ...achievement.toObject(), unlockedAt: existing.unlockedAt });
      }
    } else if (existing) {
      existing.progress = statValue;
      await existing.save();
    } else {
      await UserAchievement.create({ user: userId, achievement: achievement._id, progress: statValue, unlockedAt: null });
    }
  }

  return { newUnlocks, stats };
}

async function awardXP(userId, amount, reason, metadata = {}) {
  await Promise.all([
    XPLog.create({ user: userId, amount, reason, metadata }),
    User.findByIdAndUpdate(userId, { $inc: { totalXP: amount } })
  ]);
}

module.exports = { seedAchievements, checkUserAchievements, awardXP };
