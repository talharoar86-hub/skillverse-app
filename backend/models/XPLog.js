const mongoose = require('mongoose');

const XPLogSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  amount: { type: Number, required: true },
  reason: { type: String, required: true },
  metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  createdAt: { type: Date, default: Date.now }
});

XPLogSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model('XPLog', XPLogSchema);
