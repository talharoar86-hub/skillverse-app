const mongoose = require('mongoose');

const MentorProfileViewSchema = new mongoose.Schema({
  mentor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  viewer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  viewedAt: { type: Date, default: Date.now }
});

MentorProfileViewSchema.index({ mentor: 1, viewedAt: -1 });

module.exports = mongoose.model('MentorProfileView', MentorProfileViewSchema);
