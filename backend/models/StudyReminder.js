const mongoose = require('mongoose');

const StudyReminderSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  enabled: { type: Boolean, default: false },
  days: [{ type: Number, min: 0, max: 6 }], // 0=Sun, 6=Sat
  time: { type: String, default: '18:00' },
  timezone: { type: String, default: 'UTC' },
  message: { type: String, default: 'Time to learn something new!' },
  lastSent: { type: Date, default: null },
  createdAt: { type: Date, default: Date.now }
});

StudyReminderSchema.index({ user: 1 });

module.exports = mongoose.model('StudyReminder', StudyReminderSchema);
