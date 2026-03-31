const mongoose = require('mongoose');

const MentorshipRequestSchema = new mongoose.Schema({
  menteeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  mentorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  skill: {
    type: String,
    required: true
  },
  message: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected'],
    default: 'pending'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

MentorshipRequestSchema.index({ mentorId: 1, status: 1 });
MentorshipRequestSchema.index({ menteeId: 1 });

module.exports = mongoose.model('MentorshipRequest', MentorshipRequestSchema);
