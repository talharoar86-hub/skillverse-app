const mongoose = require('mongoose');

const PostSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  authorName: String,
  authorAvatar: String,
  authorRole: String,
  content: {
    type: String,
    default: ''
  },
  codeSnippet: String,
   imageUrl: String,
   imageUrls: [String],
  tags: [String],
  skills: [String],
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  saves: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  interested: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  notInterested: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  shares: {
    type: Number,
    default: 0
  },
  reposts: {
    type: Number,
    default: 0
  },
  comments: [{
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    authorName: String,
    content: String,
    isHelpful: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
  }],
  type: {
    type: String,
    enum: ['Post', 'Guide', 'Question', 'Update'],
    default: 'Post'
  },
  isResolved: {
    type: Boolean,
    default: false
  },
  engagementScore: {
    type: Number,
    default: 0
  },
  isRepost: {
    type: Boolean,
    default: false
  },
  originalPostId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Post'
  },
  originalAuthorName: String,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Post', PostSchema);
