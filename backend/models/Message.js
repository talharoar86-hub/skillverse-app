const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  conversation: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Conversation',
    required: true
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: true,
    trim: true
  },
  read: {
    type: Boolean,
    default: false
  },
  isSystem: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Fast message retrieval per conversation
messageSchema.index({ conversation: 1, createdAt: -1 });

// Unread count queries
messageSchema.index({ conversation: 1, read: 1 });

module.exports = mongoose.model('Message', messageSchema);
