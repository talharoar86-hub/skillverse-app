const mongoose = require('mongoose');

const UserAchievementSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  achievement: { type: mongoose.Schema.Types.ObjectId, ref: 'Achievement', required: true },
  progress: { type: Number, default: 0 },
  unlockedAt: { type: Date, default: null }
});

UserAchievementSchema.index({ user: 1, achievement: 1 }, { unique: true });
UserAchievementSchema.index({ user: 1, unlockedAt: 1 });

module.exports = mongoose.model('UserAchievement', UserAchievementSchema);
