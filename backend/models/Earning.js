const mongoose = require('mongoose');

const EarningSchema = new mongoose.Schema({
  mentor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  amount: { type: Number, required: true },
  source: { type: String, enum: ['course', 'mentorship'], required: true },
  reference: { type: mongoose.Schema.Types.ObjectId },
  referenceType: { type: String, enum: ['Course', 'MentorshipRequest', null], default: null },
  studentName: { type: String, default: null },
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  courseTitle: { type: String, default: null },
  currency: { type: String, default: 'USD' },
  status: { type: String, enum: ['pending', 'available', 'payout'], default: 'available' },
  createdAt: { type: Date, default: Date.now }
});

EarningSchema.index({ mentor: 1, createdAt: -1 });
EarningSchema.index({ mentor: 1, source: 1 });
EarningSchema.index({ mentor: 1, status: 1 });

module.exports = mongoose.model('Earning', EarningSchema);
