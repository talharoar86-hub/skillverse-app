const mongoose = require('mongoose');

const ExchangeRequestSchema = new mongoose.Schema({
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  receiver: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  offeredSkill: { type: String, required: true },
  requestedSkill: { type: String, required: true },
  message: String,
  status: { type: String, enum: ['pending', 'accepted', 'rejected'], default: 'pending' },
  createdAt: { type: Date, default: Date.now }
});

ExchangeRequestSchema.index({ receiver: 1, status: 1 });
ExchangeRequestSchema.index({ sender: 1 });

module.exports = mongoose.model('ExchangeRequest', ExchangeRequestSchema);
