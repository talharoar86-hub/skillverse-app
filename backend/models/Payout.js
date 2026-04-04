const mongoose = require('mongoose');

const PayoutSchema = new mongoose.Schema({
  mentor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  amount: { type: Number, required: true },
  currency: { type: String, default: 'USD' },
  status: { 
    type: String, 
    enum: ['pending', 'processing', 'completed', 'failed', 'cancelled'], 
    default: 'pending' 
  },
  method: { type: String, enum: ['bank_transfer', 'paypal', 'stripe', 'crypto'], default: 'bank_transfer' },
  methodDetails: {
    bankName: String,
    accountNumber: String,
    accountHolderName: String,
    routingNumber: String,
    paypalEmail: String,
    stripeAccountId: String,
    cryptoWallet: String
  },
  transactions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Earning' }],
  processedAt: { type: Date, default: null },
  completedAt: { type: Date, default: null },
  failureReason: { type: String, default: null },
  notes: { type: String, default: null },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

PayoutSchema.index({ mentor: 1, createdAt: -1 });
PayoutSchema.index({ mentor: 1, status: 1 });
PayoutSchema.pre('save', function() {
  this.updatedAt = new Date();
});

module.exports = mongoose.model('Payout', PayoutSchema);