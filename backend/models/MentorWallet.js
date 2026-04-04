const mongoose = require('mongoose');

const MentorWalletSchema = new mongoose.Schema({
  mentor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  availableBalance: { type: Number, default: 0 },
  pendingBalance: { type: Number, default: 0 },
  totalPayout: { type: Number, default: 0 },
  totalEarned: { type: Number, default: 0 },
  currency: { type: String, default: 'USD' },
  payoutSettings: {
    method: { type: String, enum: ['bank_transfer', 'paypal', 'stripe', 'crypto'], default: 'bank_transfer' },
    bankName: String,
    accountNumber: String,
    accountHolderName: String,
    routingNumber: String,
    paypalEmail: String,
    stripeAccountId: String,
    cryptoWallet: String
  },
  payoutPreferences: {
    minPayoutAmount: { type: Number, default: 50 },
    autoPayout: { type: Boolean, default: false },
    payoutSchedule: { type: String, enum: ['weekly', 'biweekly', 'monthly'], default: 'monthly' }
  },
  lastPayoutAt: { type: Date, default: null },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

MentorWalletSchema.pre('save', function() {
  this.updatedAt = new Date();
});

module.exports = mongoose.model('MentorWallet', MentorWalletSchema);