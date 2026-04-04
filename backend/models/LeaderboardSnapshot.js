const mongoose = require('mongoose');

const LeaderboardSnapshotSchema = new mongoose.Schema({
  metric: { type: String, enum: ['hours', 'courses', 'streak', 'xp'], required: true },
  period: { type: String, enum: ['all-time', 'monthly', 'weekly'], required: true },
  rankings: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    score: Number,
    rank: Number,
    prevRank: Number
  }],
  computedAt: { type: Date, default: Date.now }
});

LeaderboardSnapshotSchema.index({ metric: 1, period: 1, computedAt: -1 });

module.exports = mongoose.model('LeaderboardSnapshot', LeaderboardSnapshotSchema);
