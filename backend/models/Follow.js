const mongoose = require('mongoose');

const followSchema = new mongoose.Schema({
  follower: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  following: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected'],
    default: 'pending'
  }
}, {
  timestamps: true
});

// Prevent duplicate follow requests
followSchema.index({ follower: 1, following: 1 }, { unique: true });

// Fast lookup of pending requests for a user
followSchema.index({ following: 1, status: 1 });

// Fast lookup of following list
followSchema.index({ follower: 1, status: 1 });

module.exports = mongoose.model('Follow', followSchema);
