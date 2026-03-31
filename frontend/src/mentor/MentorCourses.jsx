import React, { useState, useEffect } from 'react';
import { courseService } from '../services/api';
import { useAuth } from '../auth/AuthContext';
import {
  Plus, BookOpen, Star, Users, Edit3, Trash2,
  Eye, EyeOff, Loader2, X, ChevronDown, ChevronUp, Check
} from 'lucide-react';
import { cn } from '../utils/cn';

const LEVELS = ['Beginner', 'Intermediate', 'Advanced'];
const CATEGORIES = ['Frontend', 'Backend', 'Full Stack', 'Mobile', 'DevOps', 'AI/ML', 'Design', 'Other'];

const FieldLabel = ({ children }) => (
  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">{children}</label>
);

const emptyCourse = { title: '', description: '', category: 'Frontend', level: 'Beginner', tags: '', thumbnail: '' };
const emptyLesson = { title: '', description: '', duration: '', videoUrl: '', content: '' };

const MentorCourses = () => {
  const { updateUser } = useAuth();
  const [courses, setCourses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [courseForm, setCourseForm] = useState(emptyCourse);
  const [lessons, setLessons] = useState([]);
  const [expandedLesson, setExpandedLesson] = useState(null);
  const [lessonForm, setLessonForm] = useState(emptyLesson);

  useEffect(() => { loadCourses(); }, []);

  const loadCourses = async () => {
    try {
      const data = await courseService.getMyCourses();
      setCourses(data);
    } catch (err) {
      console.error('Failed to load courses', err);
    } finally {
      setIsLoading(false);
    }
  };

  const patch = (k, v) => setCourseForm(prev => ({ ...prev, [k]: v }));

  const openCreate = () => {
    setEditingCourse(null);
    setCourseForm(emptyCourse);
    setLessons([]);
    setShowForm(true);
  };

  const openEdit = (course) => {
    setEditingCourse(course);
    setCourseForm({
      title: course.title,
      description: course.description || '',
      category: course.category || 'Frontend',
      level: course.level || 'Beginner',
      tags: (course.tags || []).join(', '),
      thumbnail: course.thumbnail || ''
    });
    setLessons(course.lessons || []);
    setShowForm(true);
  };

  const handleSaveCourse = async () => {
    if (!courseForm.title.trim()) return;
    setIsSaving(true);
    try {
      const data = {
        ...courseForm,
        tags: courseForm.tags.split(',').map(t => t.trim()).filter(Boolean)
      };

      let saved;
      if (editingCourse) {
        saved = await courseService.updateCourse(editingCourse._id, data);
      } else {
        saved = await courseService.createCourse(data);
      }

      // Add new lessons
      for (const lesson of lessons) {
        if (lesson._id) continue;
        await courseService.addLesson(saved._id, lesson);
      }

      setShowForm(false);
      loadCourses();
    } catch (err) {
      console.error('Failed to save course', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (courseId) => {
    if (!window.confirm('Delete this course?')) return;
    try {
      await courseService.deleteCourse(courseId);
      setCourses(prev => prev.filter(c => c._id !== courseId));
    } catch (err) {
      console.error('Failed to delete course', err);
    }
  };

  const handleTogglePublish = async (course) => {
    try {
      if (course.status === 'published') {
        await courseService.unpublishCourse(course._id);
      } else {
        await courseService.publishCourse(course._id);
      }
      loadCourses();
    } catch (err) {
      console.error('Failed to toggle publish', err);
    }
  };

  const addLesson = () => {
    setLessons(prev => [...prev, { ...lessonForm }]);
    setLessonForm(emptyLesson);
  };

  const removeLesson = (idx) => {
    setLessons(prev => prev.filter((_, i) => i !== idx));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
      </div>
    );
  }

  // Course Form View
  if (showForm) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              {editingCourse ? 'Edit Course' : 'Create New Course'}
            </h1>
          </div>
          <button onClick={() => setShowForm(false)} className="p-2 rounded-lg hover:bg-slate-100">
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-5">
          <div>
            <FieldLabel>Course Title *</FieldLabel>
            <input
              type="text"
              value={courseForm.title}
              onChange={e => patch('title', e.target.value)}
              placeholder="e.g. Advanced React Patterns"
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50 transition-all"
            />
          </div>

          <div>
            <FieldLabel>Description</FieldLabel>
            <textarea
              rows={3}
              value={courseForm.description}
              onChange={e => patch('description', e.target.value)}
              placeholder="What will students learn?"
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 outline-none resize-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50 transition-all"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <FieldLabel>Category</FieldLabel>
              <select
                value={courseForm.category}
                onChange={e => patch('category', e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 outline-none"
              >
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <FieldLabel>Level</FieldLabel>
              <select
                value={courseForm.level}
                onChange={e => patch('level', e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 outline-none"
              >
                {LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
          </div>

          <div>
            <FieldLabel>Tags (comma separated)</FieldLabel>
            <input
              type="text"
              value={courseForm.tags}
              onChange={e => patch('tags', e.target.value)}
              placeholder="React, Hooks, Performance"
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50 transition-all"
            />
          </div>
        </div>

        {/* Lessons */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <h2 className="text-lg font-black text-slate-900 mb-4">Lessons ({lessons.length})</h2>

          {lessons.length > 0 && (
            <div className="space-y-2 mb-4">
              {lessons.map((lesson, idx) => (
                <div key={idx} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-black shrink-0">
                    {idx + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-800 truncate">{lesson.title}</p>
                    <p className="text-[11px] text-slate-400">{lesson.duration || 'No duration'}</p>
                  </div>
                  <button onClick={() => removeLesson(idx)} className="p-1.5 text-slate-400 hover:text-rose-500 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="border border-dashed border-slate-200 rounded-xl p-4 space-y-3">
            <input
              type="text"
              value={lessonForm.title}
              onChange={e => setLessonForm(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Lesson title"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:border-indigo-400 transition-all"
            />
            <div className="grid grid-cols-2 gap-3">
              <input
                type="text"
                value={lessonForm.duration}
                onChange={e => setLessonForm(prev => ({ ...prev, duration: e.target.value }))}
                placeholder="Duration (e.g. 15m)"
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:border-indigo-400 transition-all"
              />
              <input
                type="text"
                value={lessonForm.videoUrl}
                onChange={e => setLessonForm(prev => ({ ...prev, videoUrl: e.target.value }))}
                placeholder="Video URL (optional)"
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:border-indigo-400 transition-all"
              />
            </div>
            <textarea
              rows={2}
              value={lessonForm.description}
              onChange={e => setLessonForm(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Lesson description (optional)"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none resize-none focus:border-indigo-400 transition-all"
            />
            <button
              onClick={addLesson}
              disabled={!lessonForm.title.trim()}
              className="flex items-center gap-2 text-sm font-bold text-indigo-600 hover:text-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Plus className="w-4 h-4" /> Add Lesson
            </button>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <button
            onClick={() => setShowForm(false)}
            className="px-6 py-2.5 text-sm font-bold text-slate-500 hover:text-slate-700 border border-slate-200 rounded-xl hover:bg-slate-50 transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleSaveCourse}
            disabled={isSaving || !courseForm.title.trim()}
            className="flex items-center gap-2 px-8 py-2.5 bg-indigo-600 text-white text-sm font-bold rounded-xl shadow-lg shadow-indigo-200 hover:bg-indigo-700 disabled:opacity-60 active:scale-95 transition-all"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            {isSaving ? 'Saving...' : editingCourse ? 'Update Course' : 'Create Course'}
          </button>
        </div>
      </div>
    );
  }

  // Course List View
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">My Courses</h1>
          <p className="text-sm text-slate-500 mt-1 font-medium">Create and manage your courses.</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white text-sm font-bold rounded-xl shadow-lg shadow-indigo-200 hover:bg-indigo-700 active:scale-95 transition-all"
        >
          <Plus className="w-4 h-4" /> Create Course
        </button>
      </div>

      {courses.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm py-16 text-center">
          <BookOpen className="w-12 h-12 text-slate-200 mx-auto mb-4" />
          <h3 className="text-lg font-black text-slate-900 mb-2">No courses yet</h3>
          <p className="text-sm text-slate-400 font-medium mb-6">Create your first course to start teaching.</p>
          <button
            onClick={openCreate}
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white text-sm font-bold rounded-xl shadow-lg hover:bg-indigo-700 active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4" /> Create First Course
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {courses.map(course => (
            <div key={course._id} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={cn(
                      "px-2 py-0.5 rounded-lg text-[10px] font-bold border",
                      course.status === 'published'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                        : 'bg-amber-50 text-amber-700 border-amber-100'
                    )}>
                      {course.status === 'published' ? 'Published' : 'Draft'}
                    </span>
                    <span className="text-[10px] font-bold text-slate-400 bg-slate-50 px-2 py-0.5 rounded-lg">
                      {course.level}
                    </span>
                  </div>
                  <h3 className="text-base font-black text-slate-900 truncate">{course.title}</h3>
                </div>
              </div>

              <div className="flex items-center gap-4 text-xs text-slate-400 font-medium mb-4">
                <span className="flex items-center gap-1">
                  <BookOpen className="w-3.5 h-3.5" /> {course.lessons?.length || 0} lessons
                </span>
                <span className="flex items-center gap-1">
                  <Users className="w-3.5 h-3.5" /> {course.enrolledCount || 0} students
                </span>
                <span className="flex items-center gap-1">
                  <Star className="w-3.5 h-3.5" /> {course.rating?.toFixed(1) || '0.0'}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => openEdit(course)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-bold text-slate-600 border border-slate-200 rounded-xl hover:border-indigo-300 hover:text-indigo-600 transition-all"
                >
                  <Edit3 className="w-3.5 h-3.5" /> Edit
                </button>
                <button
                  onClick={() => handleTogglePublish(course)}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-bold rounded-xl transition-all",
                    course.status === 'published'
                      ? 'text-amber-600 border border-amber-200 hover:border-amber-300'
                      : 'text-emerald-600 border border-emerald-200 hover:border-emerald-300'
                  )}
                >
                  {course.status === 'published' ? <><EyeOff className="w-3.5 h-3.5" /> Unpublish</> : <><Eye className="w-3.5 h-3.5" /> Publish</>}
                </button>
                <button
                  onClick={() => handleDelete(course._id)}
                  className="p-2 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-rose-50 transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MentorCourses;
