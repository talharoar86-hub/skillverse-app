const express = require('express');
const router = express.Router();
const ExchangeActivity = require('../models/ExchangeActivity');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

// @desc    Send an exchange request
// @route   POST /api/exchange/request
router.post('/request', protect, async (req, res) => {
  try {
    const { responderId, offeredSkill, requestedSkill, message } = req.body;

    if (!responderId || !offeredSkill || !requestedSkill) {
      return res.status(400).json({ message: 'responderId, offeredSkill, and requestedSkill are required' });
    }

    if (responderId === req.user._id.toString()) {
      return res.status(400).json({ message: 'Cannot send exchange request to yourself' });
    }

    const responder = await User.findById(responderId);
    if (!responder) return res.status(404).json({ message: 'User not found' });

    const existingRequest = await ExchangeActivity.findOne({
      requesterId: req.user._id,
      responderId,
      status: 'pending'
    });
    if (existingRequest) {
      return res.status(400).json({ message: 'You already have a pending exchange request with this user' });
    }

    const activity = await ExchangeActivity.create({
      requesterId: req.user._id,
      responderId,
      offeredSkill,
      requestedSkill,
      message: message || ''
    });

    const populated = await activity.populate([
      { path: 'requesterId', select: 'name avatarUrl' },
      { path: 'responderId', select: 'name avatarUrl' }
    ]);

    res.status(201).json(populated);
  } catch (error) {
    console.error('Exchange Request Error:', error);
    res.status(500).json({ message: 'Error creating exchange request' });
  }
});

// @desc    Accept an exchange request
// @route   PUT /api/exchange/:activityId/accept
router.put('/:activityId/accept', protect, async (req, res) => {
  try {
    const activity = await ExchangeActivity.findById(req.params.activityId);
    if (!activity) return res.status(404).json({ message: 'Exchange not found' });

    if (activity.responderId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    activity.status = 'accepted';
    await activity.save();

    const populated = await activity.populate([
      { path: 'requesterId', select: 'name avatarUrl' },
      { path: 'responderId', select: 'name avatarUrl' }
    ]);

    res.json(populated);
  } catch (error) {
    console.error('Accept Exchange Error:', error);
    res.status(500).json({ message: 'Error accepting exchange request' });
  }
});

// @desc    Reject an exchange request
// @route   PUT /api/exchange/:activityId/reject
router.put('/:activityId/reject', protect, async (req, res) => {
  try {
    const activity = await ExchangeActivity.findById(req.params.activityId);
    if (!activity) return res.status(404).json({ message: 'Exchange not found' });

    if (activity.responderId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    activity.status = 'rejected';
    await activity.save();

    res.json({ message: 'Exchange rejected' });
  } catch (error) {
    console.error('Reject Exchange Error:', error);
    res.status(500).json({ message: 'Error rejecting exchange request' });
  }
});

// @desc    Get pending exchange requests for current user
// @route   GET /api/exchange/requests
router.get('/requests', protect, async (req, res) => {
  try {
    const requests = await ExchangeActivity.find({
      responderId: req.user._id,
      status: 'pending'
    })
      .populate('requesterId', 'name avatarUrl skills')
      .sort({ createdAt: -1 });

    const formatted = requests.map(r => ({
      _id: r._id,
      name: r.requesterId.name,
      avatarUrl: r.requesterId.avatarUrl,
      offeredSkill: r.offeredSkill,
      requestedSkill: r.requestedSkill,
      message: r.message,
      createdAt: r.createdAt
    }));

    res.json(formatted);
  } catch (error) {
    console.error('Get Exchange Requests Error:', error);
    res.status(500).json({ message: 'Error fetching exchange requests' });
  }
});

// @desc    Get exchange activity stats
// @route   GET /api/exchange/stats
router.get('/stats', protect, async (req, res) => {
  try {
    const userId = req.user._id;

    const [completedCount, activeCount, pendingCount] = await Promise.all([
      ExchangeActivity.countDocuments({
        $or: [{ requesterId: userId }, { responderId: userId }],
        status: 'completed'
      }),
      ExchangeActivity.countDocuments({
        $or: [{ requesterId: userId }, { responderId: userId }],
        status: 'accepted'
      }),
      ExchangeActivity.countDocuments({
        $or: [{ requesterId: userId }, { responderId: userId }],
        status: 'pending'
      })
    ]);

    res.json({
      completed: completedCount,
      active: activeCount,
      pending: pendingCount,
      totalExchanges: completedCount + activeCount
    });
  } catch (error) {
    console.error('Exchange Stats Error:', error);
    res.status(500).json({ message: 'Error fetching exchange stats' });
  }
});

// @desc    Get full exchange activity for profile dashboard
// @route   GET /api/exchange/activity
router.get('/activity', protect, async (req, res) => {
  try {
    const userId = req.user._id;
    const { status, limit = 20, page = 1 } = req.query;

    const query = {
      $or: [{ requesterId: userId }, { responderId: userId }]
    };
    if (status) query.status = status;

    const [activities, total, pendingCount, acceptedCount, completedCount, rejectedCount] = await Promise.all([
      ExchangeActivity.find(query)
        .populate('requesterId', 'name avatarUrl')
        .populate('responderId', 'name avatarUrl')
        .sort({ createdAt: -1 })
        .skip((parseInt(page) - 1) * parseInt(limit))
        .limit(parseInt(limit)),
      ExchangeActivity.countDocuments(query),
      ExchangeActivity.countDocuments({ $or: [{ requesterId: userId }, { responderId: userId }], status: 'pending' }),
      ExchangeActivity.countDocuments({ $or: [{ requesterId: userId }, { responderId: userId }], status: 'accepted' }),
      ExchangeActivity.countDocuments({ $or: [{ requesterId: userId }, { responderId: userId }], status: 'completed' }),
      ExchangeActivity.countDocuments({ $or: [{ requesterId: userId }, { responderId: userId }], status: 'rejected' })
    ]);

    const formatted = activities.map(a => {
      const isRequester = a.requesterId._id.toString() === userId.toString();
      return {
        _id: a._id,
        partner: isRequester
          ? { _id: a.responderId._id, name: a.responderId.name, avatarUrl: a.responderId.avatarUrl }
          : { _id: a.requesterId._id, name: a.requesterId.name, avatarUrl: a.requesterId.avatarUrl },
        offeredSkill: a.offeredSkill,
        requestedSkill: a.requestedSkill,
        status: a.status,
        isRequester,
        createdAt: a.createdAt
      };
    });

    res.json({
      activities: formatted,
      total,
      stats: {
        pending: pendingCount,
        active: acceptedCount,
        completed: completedCount,
        rejected: rejectedCount,
        total: pendingCount + acceptedCount + completedCount + rejectedCount
      }
    });
  } catch (error) {
    console.error('Exchange Activity Error:', error);
    res.status(500).json({ message: 'Error fetching exchange activity' });
  }
});

// @desc    Get exchange activity history for current user
// @route   GET /api/exchange/history
router.get('/history', protect, async (req, res) => {
  try {
    const userId = req.user._id;
    const { status, limit = 20, page = 1 } = req.query;

    const query = {
      $or: [{ requesterId: userId }, { responderId: userId }]
    };
    if (status) query.status = status;

    const activities = await ExchangeActivity.find(query)
      .populate('requesterId', 'name avatarUrl')
      .populate('responderId', 'name avatarUrl')
      .sort({ createdAt: -1 })
      .skip((parseInt(page) - 1) * parseInt(limit))
      .limit(parseInt(limit));

    const total = await ExchangeActivity.countDocuments(query);

    const formatted = activities.map(a => ({
      _id: a._id,
      partner: a.requesterId._id.toString() === userId.toString()
        ? { _id: a.responderId._id, name: a.responderId.name, avatarUrl: a.responderId.avatarUrl }
        : { _id: a.requesterId._id, name: a.requesterId.name, avatarUrl: a.requesterId.avatarUrl },
      offeredSkill: a.offeredSkill,
      requestedSkill: a.requestedSkill,
      status: a.status,
      isRequester: a.requesterId._id.toString() === userId.toString(),
      createdAt: a.createdAt
    }));

    res.json({ activities: formatted, total });
  } catch (error) {
    console.error('Exchange History Error:', error);
    res.status(500).json({ message: 'Error fetching exchange history' });
  }
});

// @desc    Get exchange stats for sidebar
// @route   GET /api/exchange/sidebar-stats
router.get('/sidebar-stats', protect, async (req, res) => {
  try {
    const userId = req.user._id;

    const [pendingCount, activeCount, completedCount] = await Promise.all([
      ExchangeActivity.countDocuments({
        responderId: userId,
        status: 'pending'
      }),
      ExchangeActivity.countDocuments({
        $or: [{ requesterId: userId }, { responderId: userId }],
        status: 'accepted'
      }),
      ExchangeActivity.countDocuments({
        $or: [{ requesterId: userId }, { responderId: userId }],
        status: 'completed'
      })
    ]);

    res.json({
      pendingRequests: pendingCount,
      activeExchanges: activeCount,
      completedExchanges: completedCount
    });
  } catch (error) {
    console.error('Exchange Sidebar Stats Error:', error);
    res.status(500).json({ message: 'Error fetching exchange sidebar stats' });
  }
});

// @desc    Get incoming exchange requests (for responder)
// @route   GET /api/exchange/requests/incoming
router.get('/requests/incoming', protect, async (req, res) => {
  try {
    const requests = await ExchangeActivity.find({
      responderId: req.user._id,
      status: 'pending'
    })
      .populate('requesterId', 'name avatarUrl')
      .sort({ createdAt: -1 });

    const formatted = requests.map(r => ({
      _id: r._id,
      sender: r.requesterId,
      offeredSkill: r.offeredSkill,
      requestedSkill: r.requestedSkill,
      message: r.message,
      status: r.status,
      createdAt: r.createdAt
    }));

    res.json(formatted);
  } catch (error) {
    console.error('Get Incoming Exchange Error:', error);
    res.status(500).json({ message: 'Error fetching incoming exchange requests' });
  }
});

// @desc    Get outgoing exchange requests (for requester)
// @route   GET /api/exchange/requests/outgoing
router.get('/requests/outgoing', protect, async (req, res) => {
  try {
    const requests = await ExchangeActivity.find({
      requesterId: req.user._id
    })
      .populate('responderId', 'name avatarUrl')
      .sort({ createdAt: -1 });

    const formatted = requests.map(r => ({
      _id: r._id,
      receiver: r.responderId,
      offeredSkill: r.offeredSkill,
      requestedSkill: r.requestedSkill,
      message: r.message,
      status: r.status,
      createdAt: r.createdAt
    }));

    res.json(formatted);
  } catch (error) {
    console.error('Get Outgoing Exchange Error:', error);
    res.status(500).json({ message: 'Error fetching outgoing exchange requests' });
  }
});

// @desc    Get skill matches for exchange
// @route   GET /api/exchange/matches
router.get('/matches', protect, async (req, res) => {
  try {
    const currentUser = await User.findById(req.user._id);
    if (!currentUser) return res.status(404).json({ message: 'User not found' });

    const matches = await User.find({
      _id: { $ne: currentUser._id },
      onboardingComplete: true,
      $or: [
        { skills: { $in: currentUser.learningGoals || [] } },
        { learningGoals: { $in: currentUser.skills || [] } }
      ]
    })
      .limit(5)
      .select('name skills learningGoals avatarUrl');

    const formattedMatches = matches.map(m => {
      const giveMatch = (m.skills || []).filter(s => (currentUser.learningGoals || []).includes(s)).length;
      const getMatch = (m.learningGoals || []).filter(s => (currentUser.skills || []).includes(s)).length;
      const totalMatch = Math.min(100, Math.round(((giveMatch + getMatch) / Math.max(m.skills?.length || 1, 1)) * 100));

      return {
        _id: m._id,
        name: m.name?.split(' ')[0] || m.name,
        avatarUrl: m.avatarUrl,
        match: `${totalMatch > 0 ? totalMatch : 85}%`,
        give: m.skills?.[0] || '',
        get: m.learningGoals?.[0] || ''
      };
    });

    res.json(formattedMatches);
  } catch (error) {
    console.error('Exchange Matches Error:', error);
    res.status(500).json({ message: 'Error fetching exchange matches' });
  }
});

module.exports = router;
