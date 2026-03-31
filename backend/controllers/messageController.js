const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const User = require('../models/User');

// Get all conversations for current user
exports.getConversations = async (req, res) => {
  try {
    const userId = req.user.id;

    const conversations = await Conversation.find({ participants: userId })
      .sort({ 'lastMessage.createdAt': -1, updatedAt: -1 })
      .lean();

    // Populate other participant info for each conversation
    const populatedConversations = await Promise.all(
      conversations.map(async (conv) => {
        const otherParticipantId = conv.participants.find(
          p => p.toString() !== userId
        );
        const otherUser = await User.findById(otherParticipantId)
          .select('name avatarUrl experienceLevel goal isOnline');

        // Get unread count for this conversation
        const unreadCount = await Message.countDocuments({
          conversation: conv._id,
          sender: { $ne: userId },
          read: false
        });

        return {
          ...conv,
          otherUser,
          unreadCount
        };
      })
    );

    res.json(populatedConversations);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get or create a 1:1 conversation
exports.getOrCreateConversation = async (req, res) => {
  try {
    const userId = req.user.id;
    const { userId: otherUserId } = req.body;

    if (userId === otherUserId) {
      return res.status(400).json({ message: 'Cannot create conversation with yourself' });
    }

    // Check if other user exists
    const otherUser = await User.findById(otherUserId).select('name avatarUrl experienceLevel goal isOnline');
    if (!otherUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Find existing conversation
    let conversation = await Conversation.findOne({
      participants: { $all: [userId, otherUserId], $size: 2 }
    });

    if (!conversation) {
      conversation = new Conversation({
        participants: [userId, otherUserId]
      });
      await conversation.save();
    }

    // Get unread count
    const unreadCount = await Message.countDocuments({
      conversation: conversation._id,
      sender: { $ne: userId },
      read: false
    });

    res.json({
      ...conversation.toObject(),
      otherUser,
      unreadCount
    });
  } catch (err) {
    if (err.code === 11000) {
      // Race condition - conversation was created by another request
      const conversation = await Conversation.findOne({
        participants: { $all: [req.user.id, req.body.userId], $size: 2 }
      });
      return res.json(conversation);
    }
    res.status(500).json({ message: err.message });
  }
};

// Get messages for a conversation (paginated)
exports.getMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user.id;
    const cursor = req.query.cursor;
    const limit = parseInt(req.query.limit) || 30;

    // Verify user is participant
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }

    if (!conversation.participants.some(p => p.toString() === userId)) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Build query with cursor-based pagination
    const query = { conversation: conversationId };
    if (cursor) {
      query.createdAt = { $lt: new Date(cursor) };
    }

    const messages = await Message.find(query)
      .sort({ createdAt: -1 })
      .limit(limit + 1)
      .populate('sender', 'name avatarUrl')
      .lean();

    const hasMore = messages.length > limit;
    if (hasMore) messages.pop();

    // Reverse to get chronological order
    messages.reverse();

    // Mark messages as read
    await Message.updateMany(
      { conversation: conversationId, sender: { $ne: userId }, read: false },
      { read: true }
    );

    // Get other participant info
    const otherParticipantId = conversation.participants.find(
      p => p.toString() !== userId
    );
    const otherUser = await User.findById(otherParticipantId)
      .select('name avatarUrl experienceLevel goal isOnline');

    res.json({
      messages,
      hasMore,
      nextCursor: hasMore ? messages[0]?.createdAt : null,
      otherUser
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get total unread message count
exports.getUnreadCount = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get all conversations the user is in
    const conversations = await Conversation.find({ participants: userId }).select('_id');
    const conversationIds = conversations.map(c => c._id);

    const unreadCount = await Message.countDocuments({
      conversation: { $in: conversationIds },
      sender: { $ne: userId },
      read: false
    });

    res.json({ count: unreadCount });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Mark messages as read in a conversation
exports.markMessagesRead = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user.id;

    await Message.updateMany(
      { conversation: conversationId, sender: { $ne: userId }, read: false },
      { read: true }
    );

    res.json({ message: 'Messages marked as read' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Send a message
exports.sendMessage = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { content } = req.body;
    const userId = req.user.id;

    if (!content || !content.trim()) {
      return res.status(400).json({ message: 'Message content is required' });
    }

    // Verify user is participant
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }

    if (!conversation.participants.some(p => p.toString() === userId)) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const message = new Message({
      conversation: conversationId,
      sender: userId,
      content: content.trim()
    });
    await message.save();

    // Update conversation last message
    conversation.lastMessage = {
      content: content.trim(),
      sender: userId,
      createdAt: message.createdAt
    };
    await conversation.save();

    // Populate sender info
    await message.populate('sender', 'name avatarUrl');

    // Emit via Socket.IO
    const io = req.app.get('io');
    if (io) {
      io.to(conversationId).emit('new_message', message);
      // Also emit to each participant's room for conversation list updates
      conversation.participants.forEach(participantId => {
        io.to(participantId.toString()).emit('conversation_updated', {
          conversationId,
          lastMessage: conversation.lastMessage
        });
      });
    }

    res.status(201).json(message);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
