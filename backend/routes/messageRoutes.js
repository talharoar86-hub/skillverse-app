const express = require('express');
const router = express.Router();
const {
  getConversations,
  getOrCreateConversation,
  getMessages,
  sendMessage,
  markMessagesRead,
  getUnreadCount
} = require('../controllers/messageController');
const { protect } = require('../middleware/auth');

// Specific routes first
router.get('/unread-count', protect, getUnreadCount);
router.get('/conversations', protect, getConversations);
router.post('/conversations', protect, getOrCreateConversation);

// Conversation-specific routes
router.get('/conversations/:conversationId', protect, getMessages);
router.post('/conversations/:conversationId', protect, sendMessage);
router.put('/conversations/:conversationId/read', protect, markMessagesRead);

module.exports = router;
