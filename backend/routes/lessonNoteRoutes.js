const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const LessonNote = require('../models/LessonNote');

// @desc    Create a note
// @route   POST /api/notes
router.post('/', protect, async (req, res) => {
  try {
    const { course, lessonIndex, content } = req.body;
    if (!course || lessonIndex === undefined || !content) {
      return res.status(400).json({ message: 'course, lessonIndex, and content are required' });
    }

    const note = await LessonNote.create({ user: req.user._id, course, lessonIndex, content });
    res.status(201).json(note);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Get notes for a course/lesson
// @route   GET /api/notes
router.get('/', protect, async (req, res) => {
  try {
    const { course, lessonIndex } = req.query;
    const query = { user: req.user._id };
    if (course) query.course = course;
    if (lessonIndex !== undefined) query.lessonIndex = parseInt(lessonIndex);

    const notes = await LessonNote.find(query).sort({ createdAt: -1 });
    res.json(notes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Update a note
// @route   PUT /api/notes/:id
router.put('/:id', protect, async (req, res) => {
  try {
    const note = await LessonNote.findOne({ _id: req.params.id, user: req.user._id });
    if (!note) return res.status(404).json({ message: 'Note not found' });

    const { content } = req.body;
    if (content) note.content = content;
    note.updatedAt = Date.now();
    await note.save();
    res.json(note);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Delete a note
// @route   DELETE /api/notes/:id
router.delete('/:id', protect, async (req, res) => {
  try {
    const note = await LessonNote.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!note) return res.status(404).json({ message: 'Note not found' });
    res.json({ message: 'Note deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
