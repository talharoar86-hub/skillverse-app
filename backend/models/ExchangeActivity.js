const mongoose = require('mongoose');

const ExchangeActivitySchema = new mongoose.Schema({
  requesterId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  responderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  offeredSkill: {
    type: String,
    required: true
  },
  requestedSkill: {
    type: String,
    required: true
  },
  message: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected', 'completed'],
    default: 'pending'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

ExchangeActivitySchema.index({ requesterId: 1, status: 1 });
ExchangeActivitySchema.index({ responderId: 1, status: 1 });

module.exports = mongoose.model('ExchangeActivity', ExchangeActivitySchema);
