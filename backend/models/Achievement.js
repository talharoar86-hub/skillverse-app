const mongoose = require('mongoose');

const AchievementSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: String,
  icon: { type: String, default: 'trophy' },
  criteriaType: { type: String, enum: ['courses_completed', 'streak_days', 'hours_learned', 'reviews_written', 'notes_taken', 'enrollments'], required: true },
  criteriaThreshold: { type: Number, required: true },
  category: { type: String, enum: ['completion', 'streak', 'social', 'milestone'], default: 'milestone' },
  xpReward: { type: Number, default: 0 },
  rarity: { type: String, enum: ['common', 'rare', 'epic', 'legendary'], default: 'common' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Achievement', AchievementSchema);
