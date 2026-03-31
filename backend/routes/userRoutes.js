const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');
const { getPublicProfile, getPublicProfileStats } = require('../controllers/publicProfileController');

// Add logging for routes handled by this router
router.use((req, res, next) => {
  console.log(`User Router: ${req.method} ${req.url}`);
  next();
});

// @desc    Get users by goal (Discovery / Grouping)
// @route   GET /api/auth/discovery/:goal
// @access  Private
router.get('/discovery/:goal', protect, async (req, res) => {
  try {
    const { goal } = req.params;
    const { limit = 10, skip = 0, excludeSelf = 'true' } = req.query;

    const query = { 
      goal, 
      onboardingComplete: true 
    };

    if (excludeSelf === 'true') {
      query._id = { $ne: req.user._id };
    }

    const users = await User.find(query)
      .select('name avatarUrl experienceLevel skills goal availability bio')
      .limit(parseInt(limit))
      .skip(parseInt(skip))
      .sort({ createdAt: -1 });

    const total = await User.countDocuments(query);

    res.json({
      goal,
      count: users.length,
      total,
      users
    });
  } catch (error) {
    console.error('Discovery Error:', error);
    res.status(500).json({ message: 'Error fetching discovery group' });
  }
});

// @desc    Get all users (legacy/general)
// @route   GET /api/user/users
router.get('/users', protect, async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const users = await User.find({ onboardingComplete: true })
      .select('name avatarUrl experienceLevel goal skills')
      .skip((page - 1) * limit)
      .limit(Number(limit));
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching users' });
  }
});

// @desc    Update user profile
// @route   PUT /api/auth/profile
router.put('/profile', protect, async (req, res) => {
  try {
    const { 
      name, 
      skills, 
      learningGoals, 
      experienceLevel, 
      goal, 
      availability, 
      bio, 
      avatarUrl, 
      socialLinks,
      onboardingComplete 
    } = req.body;

    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update basic fields if provided
    if (name) user.name = name;
    if (skills) user.skills = skills;
    if (learningGoals) user.learningGoals = learningGoals;
    if (experienceLevel) user.experienceLevel = experienceLevel;
    if (goal) user.goal = goal;
    if (availability) user.availability = availability;
    if (bio) user.bio = bio;
    if (avatarUrl) user.avatarUrl = avatarUrl;

    // Handle nested social links professionally
    if (socialLinks) {
      user.socialLinks = {
        ...user.socialLinks,
        ...socialLinks
      };
    }

    // Special handling for onboarding completion
    if (onboardingComplete === true) {
      // Validate that essential onboarding data is present
      const hasSkills = user.skills && user.skills.length > 0;
      const hasGoals = user.learningGoals && user.learningGoals.length > 0;
      
      if (!hasSkills || !hasGoals || !user.goal || !user.experienceLevel) {
        return res.status(400).json({ 
          message: 'Please complete all onboarding steps before finalizing.',
          missing: {
            skills: !hasSkills,
            learningGoals: !hasGoals,
            goal: !user.goal,
            experienceLevel: !user.experienceLevel
          }
        });
      }
      user.onboardingComplete = true;
    } else if (onboardingComplete === false) {
      user.onboardingComplete = false;
    }

    const updatedUser = await user.save();

    res.json({
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      skills: updatedUser.skills,
      learningGoals: updatedUser.learningGoals,
      experienceLevel: updatedUser.experienceLevel,
      goal: updatedUser.goal,
      availability: updatedUser.availability,
      bio: updatedUser.bio,
      avatarUrl: updatedUser.avatarUrl,
      socialLinks: updatedUser.socialLinks,
      onboardingComplete: updatedUser.onboardingComplete,
      updatedAt: updatedUser.updatedAt
    });
  } catch (error) {
    console.error('Profile Update Error:', error);
    
    // Professional error handling for validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: messages 
      });
    }

    res.status(500).json({ message: 'Server error during profile update' });
  }
});

// @desc    Upload avatar
// @route   POST /api/auth/avatar
router.post('/avatar', protect, upload.single('avatar'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded' });
  }
  
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.avatarUrl = `/uploads/${req.file.filename}`;
    await user.save();

    res.json({ avatarUrl: user.avatarUrl });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Get mentor stats for sidebar
// @route   GET /api/user/sidebar/mentor-stats
router.get('/sidebar/mentor-stats', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Mock/Empty stats for now, can be connected to real session/view tracking later
    res.json({
      views: 0,
      rating: user.experienceLevel === 'Advanced / Expert' ? 5.0 : 0,
      sessions: 0
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching mentor stats' });
  }
});

// @desc    Get mentee requests for sidebar
// @route   GET /api/user/sidebar/mentee-requests
router.get('/sidebar/mentee-requests', protect, async (req, res) => {
  try {
    // In a real app, this would query a 'Mentorship' or 'Request' model
    // For now, return empty to show "Coming Soon" correctly
    res.json([]);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching mentee requests' });
  }
});

// @desc    Get skill matches for exchange goal
// @route   GET /api/user/sidebar/matches
router.get('/sidebar/matches', protect, async (req, res) => {
  try {
    const currentUser = await User.findById(req.user._id);
    if (!currentUser) return res.status(404).json({ message: 'User not found' });

    // Simple matching: Find users who HAVE what I WANT, and WANT what I HAVE
    // My Skills: currentUser.skills
    // My Interests: currentUser.learningGoals
    
    // Find users who have at least one skill in my learningGoals
    const matches = await User.find({
      _id: { $ne: currentUser._id },
      onboardingComplete: true,
      skills: { $in: currentUser.learningGoals }
    }).limit(3).select('name skills learningGoals avatarUrl');

    const formattedMatches = matches.map(m => {
      // Calculate match percentage (simple)
      const giveMatch = m.skills.filter(s => currentUser.learningGoals.includes(s)).length;
      const getMatch = m.learningGoals.filter(s => currentUser.skills.includes(s)).length;
      const totalMatch = Math.min(100, Math.round(((giveMatch + getMatch) / 2) * 100));

      return {
        _id: m._id,
        name: m.name.split(' ')[0],
        avatarUrl: m.avatarUrl,
        match: `${totalMatch > 0 ? totalMatch : 85}%`, // Fallback for demo if no direct overlap
        give: m.skills[0],
        get: m.learningGoals[0]
      };
    });

    res.json(formattedMatches);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching skill matches' });
  }
});

// Public profile routes (must be after specific /sidebar, /discovery routes to avoid conflicts)
// @desc    Get public profile by user ID
// @route   GET /api/user/:userId
router.get('/:userId/stats', protect, getPublicProfileStats);

// @desc    Get public profile by user ID
// @route   GET /api/user/:userId
router.get('/:userId', protect, getPublicProfile);

module.exports = router;
