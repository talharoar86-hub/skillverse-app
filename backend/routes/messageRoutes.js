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
const MentorshipRequest = require('../models/MentorshipRequest');
const Enrollment = require('../models/Enrollment');
const { Course } = require('../models/Learning');

router.get('/unread-count', protect, getUnreadCount);
router.get('/conversations', protect, getConversations);
router.get('/conversations/mentor-filtered', protect, async (req, res) => {
  try {
    const mongoose = require('mongoose');
    const userId = req.user._id;
    const { type } = req.query;
    
    if (!userId) {
      return res.status(400).json({ message: 'User not authenticated' });
    }
    
    const userIdStr = userId.toString();
    const Conversation = require('../models/Conversation');
    const Message = require('../models/Message');
    const User = require('../models/User');
    
    let filterTypes = [];
    if (type === 'students') {
      filterTypes = ['student'];
    } else if (type === 'mentees') {
      filterTypes = ['mentee'];
    } else if (type === 'all') {
      filterTypes = ['student', 'mentee'];
    }
    
    let mentorCourseIds = [];
    try {
      const courses = await Course.find({ mentorId: userId }).select('_id').lean();
      mentorCourseIds = courses.map(c => c._id);
    } catch (courseErr) {
      console.error('Error fetching courses:', courseErr);
    }
    
    const studentUserIds = new Set();
    if ((filterTypes.includes('student') || filterTypes.length === 0) && mentorCourseIds.length > 0) {
      try {
        const enrollments = await Enrollment.find({ course: { $in: mentorCourseIds } }).select('user').lean();
        enrollments.forEach(e => {
          if (e.user) studentUserIds.add(e.user.toString());
        });
      } catch (enrollErr) {
        console.error('Error fetching enrollments:', enrollErr);
      }
    }
    
    const menteeUserIds = new Set();
    if (filterTypes.includes('mentee') || filterTypes.length === 0) {
      try {
        const requests = await MentorshipRequest.find({ mentorId: userId, status: 'accepted' }).select('menteeId').lean();
        requests.forEach(r => {
          if (r.menteeId) menteeUserIds.add(r.menteeId.toString());
        });
      } catch (reqErr) {
        console.error('Error fetching mentorship requests:', reqErr);
      }
    }
    
    const validUserIds = [...studentUserIds, ...menteeUserIds];
    
    let conversations = [];
    try {
      conversations = await Conversation.find({ participants: new mongoose.Types.ObjectId(userIdStr) })
        .sort({ updatedAt: -1 })
        .lean();
    } catch (convErr) {
      console.error('Error fetching conversations:', convErr);
      conversations = [];
    }
    
    if (!conversations || conversations.length === 0) {
      return res.json([]);
    }
    
    const populatedConversations = await Promise.all(
      conversations.map(async (conv) => {
        try {
          if (!conv.participants || !Array.isArray(conv.participants)) {
            return null;
          }
          
          const otherParticipantId = conv.participants.find(
            p => p && p.toString() !== userIdStr
          );
          
          if (!otherParticipantId) {
            return null;
          }
          
          const otherParticipantStr = otherParticipantId.toString();
          if (!validUserIds.includes(otherParticipantStr)) {
            return null;
          }
          
          const otherUser = await User.findById(otherParticipantId)
            .select('name avatarUrl experienceLevel goal isOnline')
            .lean();
          
          const studentType = menteeUserIds.has(otherParticipantStr) ? 'mentee' : 'student';
          
          const unreadCount = await Message.countDocuments({
            conversation: conv._id,
            sender: { $ne: new mongoose.Types.ObjectId(userIdStr) },
            read: false
          });
          
          return {
            _id: conv._id.toString(),
            conversationId: conv._id.toString(),
            participants: conv.participants,
            lastMessage: conv.lastMessage || null,
            otherUser: otherUser || null,
            unreadCount: unreadCount || 0,
            userType: studentType
          };
        } catch (mapErr) {
          console.error('Error processing conversation:', mapErr);
          return null;
        }
      })
    );
    
    const filtered = populatedConversations.filter(Boolean);
    res.json(filtered);
  } catch (err) {
    console.error('Error in mentor-filtered conversations:', err);
    res.status(500).json({ message: 'Failed to fetch conversations' });
  }
});
router.post('/conversations', protect, getOrCreateConversation);

// Conversation-specific routes
router.get('/conversations/:conversationId', protect, getMessages);
router.post('/conversations/:conversationId', protect, sendMessage);
router.put('/conversations/:conversationId/read', protect, markMessagesRead);

module.exports = router;
