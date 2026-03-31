const express = require('express');
const router = express.Router();
const MentorshipRequest = require('../models/MentorshipRequest');
const User = require('../models/User');
const Follow = require('../models/Follow');
const Conversation = require('../models/Conversation');
const { protect } = require('../middleware/auth');
const { createNotification } = require('../controllers/notificationController');

// @desc    Send a mentorship request
// @route   POST /api/mentorship/request
router.post('/request', protect, async (req, res) => {
  try {
    const { mentorId, skill, message } = req.body;

    if (!mentorId || !skill) {
      return res.status(400).json({ message: 'mentorId and skill are required' });
    }

    if (mentorId === req.user._id.toString()) {
      return res.status(400).json({ message: 'Cannot send mentorship request to yourself' });
    }

    const mentor = await User.findById(mentorId);
    if (!mentor) return res.status(404).json({ message: 'Mentor not found' });

    const existingRequest = await MentorshipRequest.findOne({
      menteeId: req.user._id,
      mentorId,
      status: 'pending'
    });
    if (existingRequest) {
      return res.status(400).json({ message: 'You already have a pending request with this mentor' });
    }

    const request = await MentorshipRequest.create({
      menteeId: req.user._id,
      mentorId,
      skill,
      message: message || ''
    });

    const populated = await request.populate([
      { path: 'menteeId', select: 'name avatarUrl' },
      { path: 'mentorId', select: 'name avatarUrl' }
    ]);

    const io = req.app.get('io');
    await createNotification(io, {
      recipient: mentorId,
      sender: req.user._id,
      type: 'mentorship_request',
      content: `${req.user.name} wants mentorship in ${skill}`,
      metadata: { requestId: request._id, skill }
    });

    res.status(201).json(populated);
  } catch (error) {
    console.error('Mentorship Request Error:', error);
    res.status(500).json({ message: 'Error creating mentorship request' });
  }
});

// @desc    Accept a mentorship request
// @route   PUT /api/mentorship/:requestId/accept
router.put('/:requestId/accept', protect, async (req, res) => {
  try {
    const request = await MentorshipRequest.findById(req.params.requestId);
    if (!request) return res.status(404).json({ message: 'Request not found' });

    if (request.mentorId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    request.status = 'accepted';
    await request.save();

    // Create conversation automatically
    const existingConvo = await Conversation.findOne({
      participants: { $all: [request.mentorId, request.menteeId] }
    });
    if (!existingConvo) {
      await Conversation.create({
        participants: [request.mentorId, request.menteeId]
      });
    }

    const populated = await request.populate([
      { path: 'menteeId', select: 'name avatarUrl' },
      { path: 'mentorId', select: 'name avatarUrl' }
    ]);

    // Increment mentor's totalStudents
    await User.findByIdAndUpdate(request.mentorId, {
      $inc: { 'mentorProfile.totalStudents': 1 }
    });

    const io = req.app.get('io');
    await createNotification(io, {
      recipient: request.menteeId._id || request.menteeId,
      sender: req.user._id,
      type: 'mentorship_accepted',
      content: `${req.user.name} accepted your mentorship request`
    });

    res.json(populated);
  } catch (error) {
    console.error('Accept Mentorship Error:', error);
    res.status(500).json({ message: 'Error accepting mentorship request' });
  }
});

// @desc    Reject a mentorship request
// @route   PUT /api/mentorship/:requestId/reject
router.put('/:requestId/reject', protect, async (req, res) => {
  try {
    const request = await MentorshipRequest.findById(req.params.requestId);
    if (!request) return res.status(404).json({ message: 'Request not found' });

    if (request.mentorId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    request.status = 'rejected';
    await request.save();

    const io = req.app.get('io');
    await createNotification(io, {
      recipient: request.menteeId,
      sender: req.user._id,
      type: 'mentorship_rejected',
      content: `${req.user.name} declined your mentorship request`
    });

    res.json({ message: 'Request rejected' });
  } catch (error) {
    console.error('Reject Mentorship Error:', error);
    res.status(500).json({ message: 'Error rejecting mentorship request' });
  }
});

// @desc    Get pending requests for current mentor
// @route   GET /api/mentorship/requests
router.get('/requests', protect, async (req, res) => {
  try {
    const requests = await MentorshipRequest.find({
      mentorId: req.user._id,
      status: 'pending'
    })
      .populate('menteeId', 'name avatarUrl skills')
      .sort({ createdAt: -1 });

    const formatted = requests.map(r => ({
      _id: r._id,
      name: r.menteeId.name,
      avatarUrl: r.menteeId.avatarUrl,
      skill: r.skill,
      message: r.message,
      createdAt: r.createdAt
    }));

    res.json(formatted);
  } catch (error) {
    console.error('Get Requests Error:', error);
    res.status(500).json({ message: 'Error fetching mentorship requests' });
  }
});

// @desc    Get mentor stats for sidebar
// @route   GET /api/mentorship/stats
router.get('/stats', protect, async (req, res) => {
  try {
    const userId = req.user._id;

    const [acceptedCount, pendingCount, user] = await Promise.all([
      MentorshipRequest.countDocuments({ mentorId: userId, status: 'accepted' }),
      MentorshipRequest.countDocuments({ mentorId: userId, status: 'pending' }),
      User.findById(userId).select('mentorProfile')
    ]);

    res.json({
      activeMentees: acceptedCount,
      pendingRequests: pendingCount,
      rating: user?.mentorProfile?.rating || 5.0,
      sessions: acceptedCount
    });
  } catch (error) {
    console.error('Mentor Stats Error:', error);
    res.status(500).json({ message: 'Error fetching mentor stats' });
  }
});

// @desc    Get all mentors for discovery
// @route   GET /api/mentorship/mentors
router.get('/mentors', protect, async (req, res) => {
  try {
    const { limit = 20 } = req.query;

    const mentors = await User.find({
      mentorStatus: 'approved',
      onboardingComplete: true,
      _id: { $ne: req.user._id }
    })
      .select('name avatarUrl skills experienceLevel bio mentorProfile')
      .sort({ 'mentorProfile.rating': -1 })
      .limit(parseInt(limit));

    const result = await Promise.all(
      mentors.map(async (mentor) => {
        const [followersCount, menteesCount] = await Promise.all([
          Follow.countDocuments({ following: mentor._id, status: 'accepted' }),
          MentorshipRequest.countDocuments({ mentorId: mentor._id, status: 'accepted' })
        ]);

        return {
          _id: mentor._id,
          name: mentor.name,
          avatarUrl: mentor.avatarUrl,
          skills: mentor.mentorProfile?.skills?.length > 0
            ? mentor.mentorProfile.skills.map(s => s.name)
            : mentor.skills,
          experienceLevel: mentor.experienceLevel,
          bio: mentor.mentorProfile?.bio || mentor.bio,
          rating: mentor.mentorProfile?.rating || 5.0,
          followersCount,
          menteesCount,
          sessions: menteesCount
        };
      })
    );

    res.json(result);
  } catch (error) {
    console.error('Get Mentors Error:', error);
    res.status(500).json({ message: 'Error fetching mentors' });
  }
});

// @desc    Get relationship status with a specific mentor
// @route   GET /api/mentorship/mentors/:mentorId/status
router.get('/mentors/:mentorId/status', protect, async (req, res) => {
  try {
    const { mentorId } = req.params;
    const userId = req.user._id;

    const [follow, mentorshipRequest, conversation] = await Promise.all([
      Follow.findOne({ follower: userId, following: mentorId }),
      MentorshipRequest.findOne({ menteeId: userId, mentorId }),
      Conversation.findOne({ participants: { $all: [userId, mentorId] } })
    ]);

    res.json({
      followStatus: follow ? follow.status : 'none',
      mentorshipStatus: mentorshipRequest ? mentorshipRequest.status : 'none',
      conversationId: conversation ? conversation._id : null
    });
  } catch (error) {
    console.error('Get Mentor Status Error:', error);
    res.status(500).json({ message: 'Error fetching mentor status' });
  }
});

// @desc    Get mentor dashboard stats for current user
// @route   GET /api/mentorship/mentor-stats
router.get('/mentor-stats', protect, async (req, res) => {
  try {
    const userId = req.user._id;

    const [acceptedCount, pendingCount, user, followersCount] = await Promise.all([
      MentorshipRequest.countDocuments({ mentorId: userId, status: 'accepted' }),
      MentorshipRequest.countDocuments({ mentorId: userId, status: 'pending' }),
      User.findById(userId).select('mentorProfile'),
      Follow.countDocuments({ following: userId, status: 'accepted' })
    ]);

    res.json({
      activeMentees: acceptedCount,
      pendingRequests: pendingCount,
      sessions: acceptedCount,
      rating: user?.mentorProfile?.rating || 5.0,
      followersCount
    });
  } catch (error) {
    console.error('Mentor Dashboard Stats Error:', error);
    res.status(500).json({ message: 'Error fetching mentor dashboard stats' });
  }
});

// @desc    Get incoming mentorship requests for current user (as mentor)
// @route   GET /api/mentorship/requests/incoming
router.get('/requests/incoming', protect, async (req, res) => {
  try {
    const requests = await MentorshipRequest.find({
      mentorId: req.user._id,
      status: 'pending'
    })
      .populate('menteeId', 'name avatarUrl')
      .sort({ createdAt: -1 });

    const formatted = requests.map(r => ({
      _id: r._id,
      mentee: r.menteeId,
      skill: r.skill,
      message: r.message,
      status: r.status,
      createdAt: r.createdAt
    }));

    res.json(formatted);
  } catch (error) {
    console.error('Get Incoming Requests Error:', error);
    res.status(500).json({ message: 'Error fetching incoming mentorship requests' });
  }
});

// @desc    Get outgoing mentorship requests for current user (as mentee)
// @route   GET /api/mentorship/requests/outgoing
router.get('/requests/outgoing', protect, async (req, res) => {
  try {
    const requests = await MentorshipRequest.find({
      menteeId: req.user._id
    })
      .populate('mentorId', 'name avatarUrl')
      .sort({ createdAt: -1 });

    const formatted = requests.map(r => ({
      _id: r._id,
      mentor: r.mentorId,
      skill: r.skill,
      message: r.message,
      status: r.status,
      createdAt: r.createdAt
    }));

    res.json(formatted);
  } catch (error) {
    console.error('Get Outgoing Requests Error:', error);
    res.status(500).json({ message: 'Error fetching outgoing mentorship requests' });
  }
});

module.exports = router;
