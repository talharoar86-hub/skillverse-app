const express = require('express');
const { protect } = require('../middleware/auth');
const router = express.Router();
const { profileService, mentorService, exchangeService } = require('../services');
const { Course } = require('../models/Learning');
const Enrollment = require('../models/Enrollment');

// Unified feed suggestions endpoint
// Returns aggregated data for smart feed cards based on user goal
router.get('/suggestions', protect, async (req, res) => {
  try {
    const { goal } = req.query;
    const userId = req.user ? req.user._id : null; // Assuming auth middleware sets req.user
    
    if (!goal || !['Learn', 'Mentor', 'Exchange'].includes(goal)) {
      return res.status(400).json({ 
        error: 'Invalid or missing goal parameter. Must be Learn, Mentor, or Exchange.' 
      });
    }

    // Initialize response object
    const response = {
      courses: [],
      mentors: [],
      exchanges: [],
      stats: {}
    };

    // Fetch data based on goal
    switch (goal) {
      case 'Learn':
        // Learn goal: courses, mentors, learning stats
        try {
          const [coursesData, mentorsData, enrollments] = await Promise.all([
            Course.find({ status: 'published' }).populate('mentorId', 'name avatarUrl mentorProfile.headline').sort({ createdAt: -1 }).limit(6).lean(),
            profileService.getDiscovery('Mentor'),
            Enrollment.find({ user: userId })
          ]);

          const enrolled = enrollments.length;
          const completed = enrollments.filter(e => e.progress >= 100).length;
          const hours = enrollments.reduce((sum, e) => sum + (e.completedLessons?.length || 0) * 0.5, 0);
          
          response.courses = coursesData || [];
          response.mentors = mentorsData?.users || [];
          response.stats = { enrolled, completed, hours: Math.round(hours) };
        } catch (error) {
          console.error('Error fetching Learn data:', error);
          // Continue with empty arrays rather than failing completely
        }
        break;

      case 'Mentor':
        // Mentor goal: students, dashboard stats, suggested learners
        try {
          const [studentsData, dashboardStatsData, learnersData] = await Promise.all([
            mentorService.getStudents(),
            mentorService.getDashboardStats(),
            profileService.getDiscovery('Learn')
          ]);
          
          response.mentors = studentsData || [];
          response.stats = dashboardStatsData || {};
          response.exchanges = learnersData?.users || []; // Using exchanges field for learners
        } catch (error) {
          console.error('Error fetching Mentor data:', error);
        }
        break;

      case 'Exchange':
        // Exchange goal: skill matches, requests, stats
        try {
          const [matchesData, requestsData, statsData] = await Promise.all([
            exchangeService.getMatches(),
            exchangeService.getIncomingRequests(),
            exchangeService.getStats()
          ]);
          
          response.exchanges = matchesData || [];
          response.mentors = requestsData || []; // Using mentors field for requests
          response.stats = statsData || {};
        } catch (error) {
          console.error('Error fetching Exchange data:', error);
        }
        break;
    }

    // Deduplicate and limit results
    const deduplicateAndLimit = (array) => {
      return [...new Map(array.map(item => 
        [item._id || item.id, item])).values()].slice(0, 3);
    };
    
    response.courses = deduplicateAndLimit(response.courses);
    response.mentors = deduplicateAndLimit(response.mentors);
    response.exchanges = deduplicateAndLimit(response.exchanges);

    res.json(response);
  } catch (error) {
    console.error('Error in feed suggestions endpoint:', error);
    res.status(500).json({ 
      error: 'Failed to fetch feed suggestions',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;