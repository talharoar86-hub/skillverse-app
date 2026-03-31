const Follow = require('../models/Follow');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const Notification = require('../models/Notification');
const User = require('../models/User');

// Send a follow request
exports.sendFollowRequest = async (req, res) => {
  try {
    const { userId } = req.params;
    const followerId = req.user.id;

    if (followerId === userId) {
      return res.status(400).json({ message: 'You cannot follow yourself' });
    }

    // Check if target user exists
    const targetUser = await User.findById(userId).select('name avatarUrl');
    if (!targetUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if follow already exists
    const existingFollow = await Follow.findOne({ follower: followerId, following: userId });
    if (existingFollow) {
      if (existingFollow.status === 'pending') {
        return res.status(400).json({ message: 'Follow request already sent' });
      }
      if (existingFollow.status === 'accepted') {
        return res.status(400).json({ message: 'You are already following this user' });
      }
      if (existingFollow.status === 'rejected') {
        // Allow re-requesting after rejection
        existingFollow.status = 'pending';
        await existingFollow.save();
      }
    }

    let follow;
    if (existingFollow && existingFollow.status === 'rejected') {
      follow = existingFollow;
    } else {
      follow = new Follow({ follower: followerId, following: userId, status: 'pending' });
      await follow.save();
    }

    // Get sender info
    const sender = await User.findById(followerId).select('name avatarUrl');

    // Create follow notification with metadata
    const notification = new Notification({
      recipient: userId,
      sender: followerId,
      senderName: sender.name,
      senderAvatar: sender.avatarUrl,
      type: 'follow',
      content: `${sender.name} wants to follow you`,
      status: 'pending',
      metadata: { followId: follow._id }
    });
    await notification.save();

    // Emit real-time notification
    const io = req.app.get('io');
    if (io) {
      io.to(userId).emit('notification_received', notification);
    }

    res.status(201).json({ message: 'Follow request sent', follow, notification });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ message: 'Follow request already exists' });
    }
    res.status(500).json({ message: err.message });
  }
};

// Accept a follow request
exports.acceptFollow = async (req, res) => {
  try {
    const { followId } = req.params;
    const userId = req.user.id;

    const follow = await Follow.findById(followId);
    if (!follow) {
      return res.status(404).json({ message: 'Follow request not found' });
    }

    if (follow.following.toString() !== userId) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    if (follow.status !== 'pending') {
      return res.status(400).json({ message: 'Follow request already handled' });
    }

    follow.status = 'accepted';
    await follow.save();

    // Update the notification status
    const notification = await Notification.findOneAndUpdate(
      { 'metadata.followId': follow._id, type: 'follow' },
      { status: 'accepted' },
      { new: true }
    );

    // Get accepter info
    const accepter = await User.findById(userId).select('name avatarUrl');

    // Auto-create or get conversation between the two users
    let conversation = await Conversation.findOne({
      participants: { $all: [follow.follower, follow.following], $size: 2 }
    });

    if (!conversation) {
      conversation = new Conversation({
        participants: [follow.follower, follow.following]
      });
      await conversation.save();
    }

    // Send system message to requester
    const systemMessage = new Message({
      conversation: conversation._id,
      sender: userId,
      content: `${accepter.name} accepted your follow request. You can now message each other.`,
      isSystem: true
    });
    await systemMessage.save();

    // Update conversation last message
    conversation.lastMessage = {
      content: systemMessage.content,
      sender: userId,
      createdAt: systemMessage.createdAt
    };
    await conversation.save();

    // Emit to requester
    const io = req.app.get('io');
    if (io) {
      io.to(follow.follower.toString()).emit('follow_accepted', {
        followId: follow._id,
        acceptedBy: userId,
        conversationId: conversation._id,
        message: systemMessage
      });
      io.to(follow.follower.toString()).emit('new_message', systemMessage);
      io.to(follow.follower.toString()).emit('conversation_updated', conversation);
    }

    res.json({ message: 'Follow request accepted', follow, conversation });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Reject a follow request
exports.rejectFollow = async (req, res) => {
  try {
    const { followId } = req.params;
    const userId = req.user.id;

    const follow = await Follow.findById(followId);
    if (!follow) {
      return res.status(404).json({ message: 'Follow request not found' });
    }

    if (follow.following.toString() !== userId) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    if (follow.status !== 'pending') {
      return res.status(400).json({ message: 'Follow request already handled' });
    }

    follow.status = 'rejected';
    await follow.save();

    // Update the notification status
    await Notification.findOneAndUpdate(
      { 'metadata.followId': follow._id, type: 'follow' },
      { status: 'rejected' }
    );

    // Get rejecter info
    const rejecter = await User.findById(userId).select('name avatarUrl');

    // Find or create conversation for system message
    let conversation = await Conversation.findOne({
      participants: { $all: [follow.follower, follow.following], $size: 2 }
    });

    if (!conversation) {
      conversation = new Conversation({
        participants: [follow.follower, follow.following]
      });
      await conversation.save();
    }

    // Send system message to requester
    const systemMessage = new Message({
      conversation: conversation._id,
      sender: userId,
      content: `${rejecter.name} declined your follow request.`,
      isSystem: true
    });
    await systemMessage.save();

    conversation.lastMessage = {
      content: systemMessage.content,
      sender: userId,
      createdAt: systemMessage.createdAt
    };
    await conversation.save();

    // Emit to requester
    const io = req.app.get('io');
    if (io) {
      io.to(follow.follower.toString()).emit('follow_rejected', {
        followId: follow._id,
        rejectedBy: userId,
        message: systemMessage
      });
      io.to(follow.follower.toString()).emit('new_message', systemMessage);
      io.to(follow.follower.toString()).emit('conversation_updated', conversation);
    }

    res.json({ message: 'Follow request rejected', follow });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get follow status between current user and target user
exports.getFollowStatus = async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user.id;

    const follow = await Follow.findOne({ follower: currentUserId, following: userId });

    if (!follow) {
      return res.json({ status: 'none' });
    }

    res.json({ status: follow.status, followId: follow._id });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get my followers (accepted only)
exports.getFollowers = async (req, res) => {
  try {
    const follows = await Follow.find({ following: req.user.id, status: 'accepted' })
      .populate('follower', 'name avatarUrl experienceLevel goal isOnline')
      .sort({ createdAt: -1 });

    const followers = follows.map(f => f.follower);
    res.json(followers);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get my following list (accepted only)
exports.getFollowing = async (req, res) => {
  try {
    const follows = await Follow.find({ follower: req.user.id, status: 'accepted' })
      .populate('following', 'name avatarUrl experienceLevel goal isOnline')
      .sort({ createdAt: -1 });

    const following = follows.map(f => f.following);
    res.json(following);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get a specific user's followers (for public profile viewing)
exports.getUserFollowers = async (req, res) => {
  try {
    const { userId } = req.params;
    console.log('[getUserFollowers] userId:', userId);
    
    if (!userId || userId === 'undefined' || userId === 'null') {
      return res.status(400).json({ message: 'Invalid user ID' });
    }

    const follows = await Follow.find({ following: userId, status: 'accepted' })
      .populate('follower', 'name avatarUrl experienceLevel goal isOnline')
      .sort({ createdAt: -1 });

    const followers = follows.map(f => f.follower);
    res.json(followers);
  } catch (err) {
    console.error('[getUserFollowers] Error:', err.message);
    res.status(500).json({ message: err.message });
  }
};

// Get a specific user's following list (for public profile viewing)
exports.getUserFollowing = async (req, res) => {
  try {
    const { userId } = req.params;
    console.log('[getUserFollowing] userId:', userId);
    
    if (!userId || userId === 'undefined' || userId === 'null') {
      return res.status(400).json({ message: 'Invalid user ID' });
    }

    const follows = await Follow.find({ follower: userId, status: 'accepted' })
      .populate('following', 'name avatarUrl experienceLevel goal isOnline')
      .sort({ createdAt: -1 });

    const following = follows.map(f => f.following);
    res.json(following);
  } catch (err) {
    console.error('[getUserFollowing] Error:', err.message);
    res.status(500).json({ message: err.message });
  }
};

// Get pending follow requests for me
exports.getPendingRequests = async (req, res) => {
  try {
    const follows = await Follow.find({ following: req.user.id, status: 'pending' })
      .populate('follower', 'name avatarUrl experienceLevel goal isOnline')
      .sort({ createdAt: -1 });

    const requests = follows.map(f => ({
      followId: f._id,
      user: f.follower,
      createdAt: f.createdAt
    }));

    res.json(requests);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Unfollow a user
exports.unfollow = async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user.id;

    const follow = await Follow.findOneAndDelete({
      follower: currentUserId,
      following: userId,
      status: 'accepted'
    });

    if (!follow) {
      return res.status(404).json({ message: 'Follow relationship not found' });
    }

    const io = req.app.get('io');
    if (io) {
      io.to(userId).emit('unfollowed', { unfollowedBy: currentUserId });
    }

    res.json({ message: 'Unfollowed successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
