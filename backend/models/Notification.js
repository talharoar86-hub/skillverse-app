const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  senderName: String,
  senderAvatar: String,
  type: {
    type: String,
    enum: [
      'like', 'comment', 'reply', 'system', 'follow',
      'mentorship_request', 'mentorship_accepted', 'mentorship_rejected',
      'course_enrolled', 'session_booked', 'session_cancelled',
      'new_review', 'mentor_approved', 'student_request'
    ],
    required: true
  },
  post: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Post'
  },
  content: String,
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected'],
    default: undefined
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  isRead: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Index for fast fetching of unread notifications
notificationSchema.index({ recipient: 1, isRead: 1 });

module.exports = mongoose.model('Notification', notificationSchema);
