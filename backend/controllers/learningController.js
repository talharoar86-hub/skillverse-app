const { Course } = require('../models/Learning');
const User = require('../models/User');

// @desc    Get all courses
// @route   GET /api/courses
const getCourses = async (req, res) => {
  try {
    const courses = await Course.find().populate('mentorId', 'name email');
    res.json(courses);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create course (Mentors only)
// @route   POST /api/courses
const createCourse = async (req, res) => {
  const { title, category, description, lessons } = req.body;

  try {
    const course = await Course.create({
      mentorId: req.user._id,
      title,
      category,
      description,
      lessons
    });
    res.status(201).json(course);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get mentor profile
// @route   GET /api/courses/mentor/:id
const getMentor = async (req, res) => {
  try {
    const mentor = await User.findById(req.params.id)
      .select('name email skills mentorProfile isMentor mentorStatus')
      .where('isMentor').equals(true)
      .where('mentorStatus').equals('approved');
    if (!mentor) return res.status(404).json({ message: 'Mentor not found' });
    res.json(mentor);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update lesson progress
// @route   PUT /api/courses/:id/progress
const updateProgress = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ message: 'Course not found' });

    const { lessonIndex } = req.body;
    if (!course.lessons[lessonIndex].completedBy.includes(req.user._id)) {
      course.lessons[lessonIndex].completedBy.push(req.user._id);
    }

    await course.save();
    res.json(course);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getCourses,
  createCourse,
  getMentor,
  updateProgress
};
