const express = require('express');
const router = express.Router();
const User = require('../models/User');
const MentorshipRequest = require('../models/MentorshipRequest');
const Follow = require('../models/Follow');
const Enrollment = require('../models/Enrollment');
const { Course } = require('../models/Learning');
const { protect } = require('../middleware/auth');
const { requireMentor } = require('../middleware/requireMentor');
const { createNotification } = require('../controllers/notificationController');

// @desc    Submit mentor application (auto-approve for MVP)
// @route   POST /api/mentor/apply
router.post('/apply', protect, async (req, res) => {
  try {
    const { headline, bio, skills, experience, teachingPreference, availability, pricing, portfolioLinks } = req.body;

    if (!headline || !bio || !skills || !experience || !teachingPreference || !availability) {
      return res.status(400).json({ message: 'All required fields must be provided' });
    }

    const user = await User.findById(req.user._id);
    if (user.mentorStatus === 'approved') {
      return res.status(400).json({ message: 'You are already an approved mentor' });
    }

    user.mentorStatus = 'approved';
    user.goal = 'Mentor';
    user.isMentor = true;
    user.mentorProfile = {
      headline,
      bio,
      skills: skills || [],
      experience: experience || 0,
      portfolioLinks: portfolioLinks || {},
      teachingPreference: teachingPreference || '1-to-1',
      availability,
      pricing: pricing || 0,
      totalStudents: 0,
      rating: 5.0,
      totalReviews: 0,
      totalCourses: 0,
      totalSessions: 0
    };

    await user.save();

    const io = req.app.get('io');
    await createNotification(io, {
      recipient: user._id,
      sender: user._id,
      type: 'mentor_approved',
      content: 'Congratulations! Your mentor application has been approved. You can now access your Mentor Dashboard.'
    });

    const userObj = user.toObject();
    delete userObj.password;

    res.json(userObj);
  } catch (error) {
    console.error('Mentor Apply Error:', error);
    res.status(500).json({ message: 'Error submitting mentor application' });
  }
});

// @desc    Get current user's mentor status
// @route   GET /api/mentor/status
router.get('/status', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('mentorStatus mentorProfile isMentor goal');
    res.json({
      mentorStatus: user.mentorStatus,
      mentorProfile: user.mentorProfile,
      isMentor: user.isMentor,
      goal: user.goal
    });
  } catch (error) {
    console.error('Mentor Status Error:', error);
    res.status(500).json({ message: 'Error fetching mentor status' });
  }
});

// @desc    Get own mentor profile
// @route   GET /api/mentor/profile
router.get('/profile', protect, requireMentor, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('name avatarUrl mentorProfile mentorStatus');
    res.json(user);
  } catch (error) {
    console.error('Get Mentor Profile Error:', error);
    res.status(500).json({ message: 'Error fetching mentor profile' });
  }
});

// @desc    Update mentor profile
// @route   PUT /api/mentor/profile
router.put('/profile', protect, requireMentor, async (req, res) => {
  try {
    const { headline, bio, skills, experience, teachingPreference, availability, pricing, portfolioLinks } = req.body;

    const user = await User.findById(req.user._id);

    if (headline) user.mentorProfile.headline = headline;
    if (bio) user.mentorProfile.bio = bio;
    if (skills) user.mentorProfile.skills = skills;
    if (experience !== undefined) user.mentorProfile.experience = experience;
    if (teachingPreference) user.mentorProfile.teachingPreference = teachingPreference;
    if (availability) user.mentorProfile.availability = availability;
    if (pricing !== undefined) user.mentorProfile.pricing = pricing;
    if (portfolioLinks) user.mentorProfile.portfolioLinks = portfolioLinks;

    await user.save();

    const userObj = user.toObject();
    delete userObj.password;

    res.json(userObj);
  } catch (error) {
    console.error('Update Mentor Profile Error:', error);
    res.status(500).json({ message: 'Error updating mentor profile' });
  }
});

// @desc    Get dashboard stats for mentor
// @route   GET /api/mentor/dashboard/stats
router.get('/dashboard/stats', protect, requireMentor, async (req, res) => {
  try {
    const userId = req.user._id;

    const [acceptedCount, pendingCount, courseCount, enrollmentCount] = await Promise.all([
      MentorshipRequest.countDocuments({ mentorId: userId, status: 'accepted' }),
      MentorshipRequest.countDocuments({ mentorId: userId, status: 'pending' }),
      Course.countDocuments({ mentorId: userId }),
      Enrollment.countDocuments({
        course: { $in: await Course.find({ mentorId: userId }).distinct('_id') }
      })
    ]);

    const user = await User.findById(userId).select('mentorProfile');

    res.json({
      totalStudents: enrollmentCount + acceptedCount,
      activeSessions: acceptedCount,
      totalEarnings: 0,
      rating: user?.mentorProfile?.rating || 5.0,
      totalReviews: user?.mentorProfile?.totalReviews || 0,
      totalCourses: courseCount,
      totalSessions: acceptedCount,
      pendingRequests: pendingCount
    });
  } catch (error) {
    console.error('Dashboard Stats Error:', error);
    res.status(500).json({ message: 'Error fetching dashboard stats' });
  }
});

// @desc    Get list of students (enrolled + mentees)
// @route   GET /api/mentor/dashboard/students
router.get('/dashboard/students', protect, requireMentor, async (req, res) => {
  try {
    const userId = req.user._id;

    const [mentees, enrollments] = await Promise.all([
      MentorshipRequest.find({ mentorId: userId, status: 'accepted' })
        .populate('menteeId', 'name avatarUrl skills')
        .sort({ updatedAt: -1 }),
      Enrollment.find({
        course: { $in: await Course.find({ mentorId: userId }).distinct('_id') }
      }).populate('user', 'name avatarUrl skills')
    ]);

    const students = [];

    mentees.forEach(m => {
      if (m.menteeId) {
        students.push({
          _id: m.menteeId._id,
          name: m.menteeId.name,
          avatarUrl: m.menteeId.avatarUrl,
          skills: m.menteeId.skills,
          type: 'mentee',
          since: m.createdAt
        });
      }
    });

    enrollments.forEach(e => {
      if (e.user && !students.find(s => s._id.toString() === e.user._id.toString())) {
        students.push({
          _id: e.user._id,
          name: e.user.name,
          avatarUrl: e.user.avatarUrl,
          skills: e.user.skills,
          type: 'student',
          since: e.enrolledAt
        });
      }
    });

    res.json(students);
  } catch (error) {
    console.error('Get Students Error:', error);
    res.status(500).json({ message: 'Error fetching students' });
  }
});

// @desc    Get upcoming booked sessions
// @route   GET /api/mentor/dashboard/upcoming-sessions
router.get('/dashboard/upcoming-sessions', protect, requireMentor, async (req, res) => {
  try {
    const Schedule = require('../models/Schedule');
    const schedules = await Schedule.find({
      mentorId: req.user._id,
      'slots.status': 'booked'
    }).populate('slots.bookedBy', 'name avatarUrl');

    const sessions = [];
    schedules.forEach(schedule => {
      schedule.slots.forEach(slot => {
        if (slot.status === 'booked') {
          sessions.push({
            _id: slot._id,
            dayOfWeek: schedule.dayOfWeek,
            startTime: slot.startTime,
            endTime: slot.endTime,
            student: slot.bookedBy,
            timezone: schedule.timezone
          });
        }
      });
    });

    res.json(sessions);
  } catch (error) {
    console.error('Upcoming Sessions Error:', error);
    res.status(500).json({ message: 'Error fetching upcoming sessions' });
  }
});

module.exports = router;
