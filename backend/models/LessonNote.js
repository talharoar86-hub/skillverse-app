const mongoose = require('mongoose');

const LessonNoteSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  lessonIndex: { type: Number, required: true },
  content: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

LessonNoteSchema.index({ user: 1, course: 1, lessonIndex: 1 });

module.exports = mongoose.model('LessonNote', LessonNoteSchema);
