import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Play, CheckCircle, ChevronLeft, Loader2, AlertCircle, Clock, BookOpen,
  Star, Users, Crown, Bookmark, BookmarkCheck, Award, ArrowRight, Layers, Sparkles,
  MessageSquare, Send, Edit3, Trash2, ThumbsUp, ChevronDown, StickyNote, Plus, Save,
  MessageCircle
} from 'lucide-react';
import { cn } from '../utils/cn';
import { courseService, enrollmentService, courseReviewService } from '../services/api';
import { useLearning } from '../context/LearningContext';
import { useAuth } from '../auth/AuthContext';
import { getAvatarUrl } from '../utils/avatar';
import api from '../services/axiosClient';

const GRADIENTS = [
  'from-blue-500 via-indigo-500 to-violet-600',
  'from-emerald-400 via-teal-500 to-cyan-600',
  'from-violet-500 via-purple-500 to-fuchsia-600',
  'from-rose-400 via-pink-500 to-red-500',
  'from-orange-400 via-amber-500 to-yellow-500',
  'from-cyan-400 via-blue-500 to-indigo-600',
];

// Star Rating Component
const StarRating = ({ rating, onRate, size = 'md', interactive = false }) => {
  const [hovered, setHovered] = useState(0);
  const sizeClass = size === 'sm' ? 'w-4 h-4' : size === 'lg' ? 'w-7 h-7' : 'w-5 h-5';

  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(star => (
        <button
          key={star}
          onClick={() => interactive && onRate && onRate(star)}
          onMouseEnter={() => interactive && setHovered(star)}
          onMouseLeave={() => interactive && setHovered(0)}
          disabled={!interactive}
          className={cn("transition-colors", interactive && "cursor-pointer hover:scale-110")}
        >
          <Star className={cn(sizeClass, (hovered || rating) >= star ? "text-amber-400 fill-amber-400" : "text-slate-200")} />
        </button>
      ))}
    </div>
  );
};

// Course Review Form
const ReviewForm = ({ onSubmit, existingReview, onCancel }) => {
  const [rating, setRating] = useState(existingReview?.rating || 0);
  const [comment, setComment] = useState(existingReview?.comment || '');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (rating === 0) return;
    setSubmitting(true);
    try {
      await onSubmit({ rating, comment });
      if (!existingReview) { setRating(0); setComment(''); }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-slate-50 rounded-2xl p-5 space-y-4">
      <p className="text-sm font-bold text-slate-800">{existingReview ? 'Update your review' : 'Write a review'}</p>
      <div className="flex items-center gap-3">
        <span className="text-xs font-bold text-slate-500">Rating:</span>
        <StarRating rating={rating} onRate={setRating} interactive size="lg" />
      </div>
      <textarea
        value={comment}
        onChange={e => setComment(e.target.value)}
        placeholder="Share your experience with this course..."
        rows={3}
        className="w-full bg-white border-2 border-transparent focus:border-indigo-100 rounded-xl p-3 text-sm font-medium outline-none transition-all resize-none"
      />
      <div className="flex items-center gap-2 justify-end">
        {onCancel && <button type="button" onClick={onCancel} className="px-4 py-2 text-sm font-bold text-slate-500 hover:text-slate-700 transition-colors">Cancel</button>}
        <button type="submit" disabled={rating === 0 || submitting} className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2 rounded-xl text-sm font-bold hover:bg-indigo-700 transition-all disabled:opacity-50 active:scale-95">
          <Send className="w-4 h-4" />{submitting ? 'Submitting...' : existingReview ? 'Update' : 'Submit Review'}
        </button>
      </div>
    </form>
  );
};

const CourseDetail = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { updateProgress } = useLearning();

  const [course, setCourse] = useState(null);
  const [enrollment, setEnrollment] = useState(null);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [activeLesson, setActiveLesson] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [enrolling, setEnrolling] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [bookmarking, setBookmarking] = useState(false);

  // Reviews state
  const [reviews, setReviews] = useState([]);
  const [reviewsTotal, setReviewsTotal] = useState(0);
  const [reviewsPage, setReviewsPage] = useState(1);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [userHasReviewed, setUserHasReviewed] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [editingReview, setEditingReview] = useState(null);
  const [reviewSort, setReviewSort] = useState('newest');

  // Notes state
  const [notes, setNotes] = useState([]);
  const [noteContent, setNoteContent] = useState('');
  const [noteSaving, setNoteSaving] = useState(false);
  const [editingNote, setEditingNote] = useState(null);
  const [showNotes, setShowNotes] = useState(false);

  const gradient = GRADIENTS[0];

  useEffect(() => {
    fetchCourse();
    fetchReviews();
    fetchNotes();
  }, [courseId]);

  useEffect(() => {
    if (isEnrolled) fetchNotes();
  }, [activeLesson, isEnrolled]);

  const fetchCourse = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await courseService.getCourseById(courseId);
      setCourse(data);
      setIsEnrolled(data.isEnrolled);
      if (data.enrollment) {
        setEnrollment(data.enrollment);
        setActiveLesson(data.enrollment.lastAccessedLesson || 0);
      }
    } catch {
      setError('Failed to load course');
    } finally {
      setLoading(false);
    }
  };

  const fetchReviews = async (page = 1, sort = reviewSort) => {
    setReviewsLoading(true);
    try {
      const data = await courseReviewService.getReviews(courseId, { page, limit: 10, sort });
      if (page === 1) {
        setReviews(data.reviews);
      } else {
        setReviews(prev => [...prev, ...data.reviews]);
      }
      setReviewsTotal(data.total);
      setReviewsPage(page);
      setUserHasReviewed(data.userHasReviewed);
    } catch (err) {
      console.error('Fetch reviews error:', err);
    } finally {
      setReviewsLoading(false);
    }
  };

  const fetchNotes = async () => {
    try {
      const { data } = await api.get('/notes', { params: { course: courseId, lessonIndex: activeLesson } });
      setNotes(data);
    } catch (err) {
      console.error('Fetch notes error:', err);
    }
  };

  const handleSaveNote = async () => {
    if (!noteContent.trim()) return;
    setNoteSaving(true);
    try {
      if (editingNote) {
        const { data } = await api.put(`/notes/${editingNote._id}`, { content: noteContent });
        setNotes(prev => prev.map(n => n._id === data._id ? data : n));
        setEditingNote(null);
      } else {
        const { data } = await api.post('/notes', { course: courseId, lessonIndex: activeLesson, content: noteContent });
        setNotes(prev => [data, ...prev]);
      }
      setNoteContent('');
    } catch (err) {
      console.error('Save note error:', err);
    } finally {
      setNoteSaving(false);
    }
  };

  const handleDeleteNote = async (noteId) => {
    try {
      await api.delete(`/notes/${noteId}`);
      setNotes(prev => prev.filter(n => n._id !== noteId));
    } catch (err) {
      console.error('Delete note error:', err);
    }
  };

  const handleEnroll = async () => {
    setEnrolling(true);
    try {
      const result = await enrollmentService.enroll(courseId);
      setEnrollment(result);
      setIsEnrolled(true);
    } catch (err) {
      if (err.response?.status === 400) {
        const data = await courseService.getCourseById(courseId);
        setEnrollment(data.enrollment);
        setIsEnrolled(true);
      }
    } finally {
      setEnrolling(false);
    }
  };

  const handleMarkComplete = async (lessonIndex) => {
    if (!enrollment) return;
    setCompleting(true);
    try {
      const updated = await updateProgress(enrollment._id, lessonIndex);
      setEnrollment(updated);
      if (lessonIndex < course.lessons.length - 1) setActiveLesson(lessonIndex + 1);
    } catch (err) {
      console.error('Mark complete error:', err);
    } finally {
      setCompleting(false);
    }
  };

  const handleToggleBookmark = async (lessonIndex) => {
    if (!enrollment) return;
    setBookmarking(true);
    try {
      const updated = await enrollmentService.toggleBookmark(enrollment._id, lessonIndex);
      setEnrollment(updated);
    } catch (err) {
      console.error('Bookmark error:', err);
    } finally {
      setBookmarking(false);
    }
  };

  const handleSubmitReview = async (data) => {
    try {
      if (editingReview) {
        await courseReviewService.updateReview(editingReview._id, data);
      } else {
        await courseReviewService.submitReview(courseId, data);
      }
      setShowReviewForm(false);
      setEditingReview(null);
      fetchReviews(1);
      fetchCourse(); // Refresh rating
    } catch (err) {
      console.error('Submit review error:', err);
    }
  };

  const handleDeleteReview = async (reviewId) => {
    if (!confirm('Delete this review?')) return;
    try {
      await courseReviewService.deleteReview(reviewId);
      fetchReviews(1);
      fetchCourse();
    } catch (err) {
      console.error('Delete review error:', err);
    }
  };

  const isLessonCompleted = (index) => enrollment?.completedLessons?.includes(index) || false;
  const isLessonBookmarked = (index) => enrollment?.bookmarkedLessons?.includes(index) || false;
  const progress = enrollment ? enrollment.progress : 0;

  if (loading) return <div className="flex flex-col items-center justify-center py-32"><Loader2 className="w-12 h-12 text-indigo-600 animate-spin" /><p className="text-sm font-bold text-slate-400 mt-4">Loading course...</p></div>;
  if (error || !course) return <div className="flex flex-col items-center justify-center py-32"><div className="w-16 h-16 bg-rose-50 rounded-2xl flex items-center justify-center mb-4"><AlertCircle className="w-8 h-8 text-rose-400" /></div><p className="text-sm font-bold text-rose-600">{error || 'Course not found'}</p><button onClick={() => navigate('/learn/explore')} className="mt-3 text-xs font-bold text-indigo-600 hover:text-indigo-700 underline">Back to courses</button></div>;

  const lesson = course.lessons?.[activeLesson];
  const isPremium = course.price > 0;

  // --- Preview Mode ---
  if (!isEnrolled) {
    return (
      <div className="animate-fade-in space-y-8">
        <button onClick={() => navigate('/learn/explore')} className="flex items-center gap-2 text-indigo-600 hover:text-indigo-700 font-bold transition-colors">
          <ChevronLeft className="w-4 h-4" /> Back to Explore
        </button>

        {/* Hero */}
        <div className="relative rounded-3xl overflow-hidden shadow-2xl">
          {course.thumbnail && course.thumbnail.startsWith('http') ? <div className="h-[320px] bg-cover bg-center" style={{ backgroundImage: `url(${course.thumbnail})` }} /> : <div className={cn("h-[320px] bg-gradient-to-br", gradient)} />}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-8">
            <div className="flex items-end justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-4">
                  {isPremium ? <div className="flex items-center gap-1.5 bg-gradient-to-r from-amber-500 to-yellow-400 px-3 py-1.5 rounded-xl shadow-lg"><Crown className="w-3.5 h-3.5 text-white" /><span className="text-[10px] font-black text-white uppercase tracking-widest">Premium</span></div> : <div className="flex items-center gap-1.5 bg-gradient-to-r from-emerald-500 to-green-400 px-3 py-1.5 rounded-xl shadow-lg"><Sparkles className="w-3.5 h-3.5 text-white" /><span className="text-[10px] font-black text-white uppercase tracking-widest">Free</span></div>}
                  {course.level && <div className="flex items-center gap-1.5 bg-white/15 backdrop-blur-xl px-3 py-1.5 rounded-xl border border-white/20"><span className="text-[10px] font-black text-white uppercase tracking-widest">{course.level}</span></div>}
                </div>
                <h1 className="text-3xl font-black text-white mb-3 leading-tight">{course.title}</h1>
                <p className="text-base text-white/70 font-medium max-w-2xl mb-4">{course.description}</p>
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-1.5"><Users className="w-4 h-4 text-white/50" /><span className="text-sm font-bold text-white/70">{course.enrolledCount || 0} students</span></div>
                  <div className="flex items-center gap-1.5"><Layers className="w-4 h-4 text-white/50" /><span className="text-sm font-bold text-white/70">{course.lessons?.length || 0} lessons</span></div>
                  {(course.rating || 0) > 0 && <div className="flex items-center gap-1.5"><Star className="w-4 h-4 text-amber-300 fill-amber-300" /><span className="text-sm font-bold text-white/70">{course.rating.toFixed(1)} ({course.totalReviews} reviews)</span></div>}
                </div>
              </div>
              <div className="shrink-0 ml-8">
                <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20 text-center">
                  {isPremium && <p className="text-2xl font-black text-white mb-2">${course.price}</p>}
                  <button onClick={handleEnroll} disabled={enrolling} className={cn("flex items-center gap-2 px-8 py-3 rounded-xl text-sm font-black text-white transition-all active:scale-95 shadow-2xl disabled:opacity-50", isPremium ? "bg-gradient-to-r from-amber-500 to-yellow-500" : "bg-indigo-600 hover:bg-indigo-700")}>
                    {enrolling ? 'Enrolling...' : 'Enroll Now'}<ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-3xl border border-slate-100 p-8 shadow-sm">
              <h3 className="font-black text-lg text-slate-900 mb-4">Instructor</h3>
              <div className="flex items-center gap-4">
                <div className={cn("w-14 h-14 rounded-full flex items-center justify-center text-white font-black text-xl shadow-sm ring-2 ring-white", `bg-gradient-to-br ${gradient}`)}>
                  {course.mentorId?.avatarUrl ? <img src={getAvatarUrl(course.mentorId)} alt="" className="w-full h-full rounded-full object-cover" /> : (course.mentorId?.name || 'M').charAt(0)}
                </div>
                <div>
                  <p className="font-bold text-slate-900 text-base">{course.mentorId?.name || 'Mentor'}</p>
                  <p className="text-sm text-slate-400 font-medium">{course.mentorId?.mentorProfile?.headline || 'Course Instructor'}</p>
                </div>
              </div>
            </div>
            {course.description && <div className="bg-white rounded-3xl border border-slate-100 p-8 shadow-sm"><h3 className="font-black text-lg text-slate-900 mb-4">About This Course</h3><p className="text-sm text-slate-600 font-medium leading-relaxed">{course.description}</p></div>}

            {/* Reviews Preview */}
            {reviews.length > 0 && (
              <div className="bg-white rounded-3xl border border-slate-100 p-8 shadow-sm">
                <h3 className="font-black text-lg text-slate-900 mb-4 flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-indigo-500" /> Student Reviews ({reviewsTotal})
                </h3>
                <div className="space-y-4">
                  {reviews.slice(0, 3).map(r => (
                    <div key={r._id} className="flex gap-3">
                      <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-500 shrink-0">
                        {r.user?.avatarUrl ? <img src={getAvatarUrl(r.user)} alt="" className="w-full h-full rounded-full" /> : (r.user?.name || 'U').charAt(0)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-xs font-bold text-slate-800">{r.user?.name}</span>
                          <StarRating rating={r.rating} size="sm" />
                        </div>
                        {r.comment && <p className="text-xs text-slate-500 font-medium">{r.comment}</p>}
                        {r.mentorReply?.text && (
                          <div className="mt-2 p-2.5 bg-gradient-to-r from-indigo-50 to-violet-50 rounded-lg border border-indigo-100">
                            <div className="flex items-center gap-1 mb-1">
                              <MessageCircle className="w-3 h-3 text-indigo-600" />
                              <span className="text-[9px] font-bold text-indigo-600 uppercase">Mentor Reply</span>
                            </div>
                            <p className="text-xs text-slate-600 font-medium">{r.mentorReply.text}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          <div className="space-y-6">
            <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm">
              <h3 className="font-black text-[15px] text-slate-900 mb-5">Curriculum</h3>
              <div className="space-y-2">
                {(course.lessons || []).map((l, idx) => (
                  <div key={l._id || idx} className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors">
                    <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center shrink-0"><span className="text-[11px] font-black text-slate-400">{idx + 1}</span></div>
                    <div className="flex-1 min-w-0"><p className="text-sm font-bold text-slate-700 truncate">{l.title}</p>{l.duration && <p className="text-[10px] text-slate-400 font-medium">{l.duration}</p>}</div>
                  </div>
                ))}
              </div>
              {isPremium && <div className="mt-4 p-4 bg-amber-50 rounded-xl border border-amber-100"><div className="flex items-center gap-2 mb-1"><Crown className="w-4 h-4 text-amber-500" /><p className="text-[11px] font-black text-amber-700 uppercase tracking-wider">Premium Content</p></div><p className="text-xs text-amber-600 font-medium">Enroll to unlock all lessons and track your progress.</p></div>}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- Enrolled Player Mode ---
  return (
    <div className="animate-fade-in">
      <button onClick={() => navigate('/learn/my-learning')} className="flex items-center gap-2 text-indigo-600 hover:text-indigo-700 font-bold mb-6 transition-colors">
        <ChevronLeft className="w-4 h-4" /> Back to My Learning
      </button>

      {enrollment && enrollment.lastAccessedLesson > 0 && (
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-5 mb-6 flex items-center justify-between shadow-xl shadow-indigo-500/20">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center"><Play className="w-6 h-6 text-white ml-0.5" fill="white" /></div>
            <div>
              <p className="text-[10px] text-white/60 font-black uppercase tracking-widest">Continue where you left off</p>
              <p className="text-sm font-bold text-white">Lesson {enrollment.lastAccessedLesson + 1}: {course.lessons?.[enrollment.lastAccessedLesson]?.title}</p>
            </div>
          </div>
          <button onClick={() => setActiveLesson(enrollment.lastAccessedLesson || 0)} className="flex items-center gap-2 bg-white text-indigo-600 px-5 py-2.5 rounded-xl text-sm font-black hover:bg-indigo-50 transition-all shadow-lg active:scale-95">
            Resume<ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-5">
          {/* Video */}
          <div className="w-full aspect-video bg-slate-900 rounded-3xl relative overflow-hidden group flex items-center justify-center shadow-2xl border border-slate-100">
            {lesson?.videoUrl ? <video src={lesson.videoUrl} controls className="w-full h-full object-cover" /> : (
              <><div className="absolute inset-0 bg-gradient-to-br from-indigo-600/20 to-purple-600/20 opacity-30" /><div className="w-20 h-20 rounded-full bg-white/10 backdrop-blur-xl flex items-center justify-center border border-white/20 shadow-2xl group-hover:scale-110 transition-transform cursor-pointer"><Play className="w-8 h-8 text-white ml-1" fill="white" /></div></>
            )}
          </div>

          {/* Lesson Details */}
          <div className="bg-white rounded-3xl border border-slate-100 p-8 shadow-sm">
            <div className="flex justify-between items-start mb-6">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md uppercase tracking-widest">Lesson {activeLesson + 1} of {course.lessons.length}</span>
                  {isLessonCompleted(activeLesson) && <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md uppercase tracking-widest flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Completed</span>}
                </div>
                <h1 className="text-2xl font-black text-slate-900 mb-1.5 leading-tight">{lesson?.title}</h1>
                <p className="text-base text-slate-400 font-medium">{course.title}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0 ml-4">
                <button onClick={() => handleToggleBookmark(activeLesson)} disabled={bookmarking} className={cn("w-10 h-10 rounded-xl flex items-center justify-center transition-all active:scale-95 border-2", isLessonBookmarked(activeLesson) ? "bg-amber-50 border-amber-200 text-amber-500" : "bg-white border-slate-100 text-slate-400 hover:border-amber-200 hover:text-amber-500")}>
                  {isLessonBookmarked(activeLesson) ? <BookmarkCheck className="w-5 h-5" /> : <Bookmark className="w-5 h-5" />}
                </button>
                <button onClick={() => handleMarkComplete(activeLesson)} disabled={completing || isLessonCompleted(activeLesson)} className={cn("px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 text-sm shadow-xl transition-all active:scale-95 shrink-0", isLessonCompleted(activeLesson) ? "bg-emerald-100 text-emerald-600 cursor-default shadow-emerald-100" : "bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-100")}>
                  {isLessonCompleted(activeLesson) ? <><CheckCircle className="w-4 h-4" /> Completed</> : completing ? 'Marking...' : <><CheckCircle className="w-4 h-4" /> Mark Complete</>}
                </button>
              </div>
            </div>

            {lesson?.description && <p className="text-sm text-slate-500 font-medium leading-relaxed mb-6">{lesson.description}</p>}
            {lesson?.content && <div className="prose prose-sm max-w-none text-slate-600 mb-6"><p className="text-sm font-medium leading-relaxed">{lesson.content}</p></div>}

            <div className="flex items-center gap-4 py-6 border-y border-slate-50">
              <div className={cn("w-12 h-12 rounded-full flex items-center justify-center text-white font-black text-lg shadow-sm", `bg-gradient-to-br ${gradient}`)}>
                {(course.mentorId?.name || 'M').charAt(0)}
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest block mb-0.5">Instructor</span>
                <span className="font-bold text-slate-800">{course.mentorId?.name || 'Mentor'}</span>
              </div>
            </div>

            {progress >= 100 && (
              <div className="mt-6 p-5 bg-gradient-to-r from-emerald-50 to-green-50 rounded-2xl border border-emerald-100 flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center"><Award className="w-6 h-6 text-emerald-600" /></div>
                <div><p className="text-sm font-black text-emerald-700">Course Completed!</p><p className="text-xs text-emerald-600 font-medium">Congratulations on finishing this course.</p></div>
              </div>
            )}

            {/* Notes Section */}
            <div className="mt-6">
              <button onClick={() => setShowNotes(!showNotes)} className="flex items-center gap-2 text-sm font-bold text-slate-700 hover:text-indigo-600 transition-colors w-full">
                <StickyNote className="w-4 h-4 text-amber-500" />
                Lesson Notes ({notes.length})
                <ChevronDown className={cn("w-4 h-4 ml-auto transition-transform", showNotes && "rotate-180")} />
              </button>

              {showNotes && (
                <div className="mt-4 space-y-4">
                  {/* Note Input */}
                  <div className="bg-slate-50 rounded-2xl p-4">
                    <textarea
                      value={noteContent}
                      onChange={e => setNoteContent(e.target.value)}
                      placeholder={editingNote ? "Update your note..." : "Write a note for this lesson..."}
                      rows={3}
                      className="w-full bg-white border-2 border-transparent focus:border-indigo-100 rounded-xl p-3 text-sm font-medium outline-none transition-all resize-none"
                    />
                    <div className="flex items-center gap-2 justify-end mt-2">
                      {editingNote && (
                        <button onClick={() => { setEditingNote(null); setNoteContent(''); }} className="px-3 py-1.5 text-xs font-bold text-slate-500 hover:text-slate-700 transition-colors">
                          Cancel
                        </button>
                      )}
                      <button onClick={handleSaveNote} disabled={!noteContent.trim() || noteSaving} className="flex items-center gap-1.5 bg-indigo-600 text-white px-4 py-1.5 rounded-xl text-xs font-bold hover:bg-indigo-700 transition-all disabled:opacity-50 active:scale-95">
                        <Save className="w-3.5 h-3.5" />{noteSaving ? 'Saving...' : editingNote ? 'Update' : 'Save Note'}
                      </button>
                    </div>
                  </div>

                  {/* Notes List */}
                  {notes.length > 0 ? (
                    <div className="space-y-3">
                      {notes.map(note => (
                        <div key={note._id} className="bg-white rounded-2xl border border-slate-100 p-4 group/note hover:shadow-sm transition-all">
                          <p className="text-sm text-slate-700 font-medium whitespace-pre-wrap">{note.content}</p>
                          <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-50">
                            <span className="text-[10px] text-slate-400 font-medium">{new Date(note.createdAt).toLocaleDateString()} {new Date(note.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            <div className="flex items-center gap-2 opacity-0 group-hover/note:opacity-100 transition-opacity">
                              <button onClick={() => { setEditingNote(note); setNoteContent(note.content); }} className="text-[10px] font-bold text-indigo-600 hover:text-indigo-700">Edit</button>
                              <button onClick={() => handleDeleteNote(note._id)} className="text-[10px] font-bold text-rose-500 hover:text-rose-600">Delete</button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 font-medium text-center py-4">No notes for this lesson yet. Write one above!</p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Reviews Section */}
          <div className="bg-white rounded-3xl border border-slate-100 p-8 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-black text-lg text-slate-900 flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-indigo-500" /> Reviews ({reviewsTotal})
              </h3>
              <div className="flex items-center gap-3">
                <select value={reviewSort} onChange={e => { setReviewSort(e.target.value); fetchReviews(1, e.target.value); }} className="text-xs font-bold text-slate-600 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 outline-none">
                  <option value="newest">Newest</option>
                  <option value="highest">Highest Rated</option>
                  <option value="lowest">Lowest Rated</option>
                </select>
                {!userHasReviewed && !showReviewForm && (
                  <button onClick={() => setShowReviewForm(true)} className="flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-700">
                    <Edit3 className="w-3.5 h-3.5" /> Write a Review
                  </button>
                )}
              </div>
            </div>

            {/* Course Rating Summary */}
            {(course.rating || 0) > 0 && (
              <div className="flex items-center gap-4 mb-6 p-4 bg-amber-50 rounded-2xl border border-amber-100">
                <div className="text-center">
                  <p className="text-3xl font-black text-amber-600">{course.rating.toFixed(1)}</p>
                  <StarRating rating={Math.round(course.rating)} size="sm" />
                </div>
                <div className="text-xs text-amber-700 font-medium">Based on {course.totalReviews} review{course.totalReviews !== 1 ? 's' : ''}</div>
              </div>
            )}

            {/* Review Form */}
            {(showReviewForm || editingReview) && (
              <div className="mb-6">
                <ReviewForm onSubmit={handleSubmitReview} existingReview={editingReview} onCancel={() => { setShowReviewForm(false); setEditingReview(null); }} />
              </div>
            )}

            {/* Review List */}
            <div className="space-y-4">
              {reviews.map(r => (
                <div key={r._id} className="flex gap-3 p-4 rounded-2xl hover:bg-slate-50 transition-colors group/review">
                  <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-sm font-bold text-slate-500 shrink-0">
                    {r.user?.avatarUrl ? <img src={getAvatarUrl(r.user)} alt="" className="w-full h-full rounded-full" /> : (r.user?.name || 'U').charAt(0)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-bold text-slate-800">{r.user?.name}</span>
                      <StarRating rating={r.rating} size="sm" />
                      <span className="text-[10px] text-slate-400 font-medium">{new Date(r.createdAt).toLocaleDateString()}</span>
                    </div>
                    {r.comment && <p className="text-sm text-slate-600 font-medium">{r.comment}</p>}
                    {r.mentorReply?.text && (
                      <div className="mt-3 p-3 bg-gradient-to-r from-indigo-50 to-violet-50 rounded-xl border border-indigo-100">
                        <div className="flex items-center gap-1.5 mb-1">
                          <MessageCircle className="w-3.5 h-3.5 text-indigo-600" />
                          <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wide">Mentor Reply</span>
                          <span className="text-[9px] text-indigo-400">· {new Date(r.mentorReply.repliedAt).toLocaleDateString()}</span>
                        </div>
                        <p className="text-sm text-slate-700 font-medium">{r.mentorReply.text}</p>
                      </div>
                    )}
                    {r.user?._id === user?._id && (
                      <div className="flex items-center gap-2 mt-2 opacity-0 group-hover/review:opacity-100 transition-opacity">
                        <button onClick={() => { setEditingReview(r); setShowReviewForm(false); }} className="text-[10px] font-bold text-indigo-600 hover:text-indigo-700">Edit</button>
                        <button onClick={() => handleDeleteReview(r._id)} className="text-[10px] font-bold text-rose-500 hover:text-rose-600">Delete</button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {reviews.length < reviewsTotal && (
              <button onClick={() => fetchReviews(reviewsPage + 1)} disabled={reviewsLoading} className="w-full mt-4 py-3 text-sm font-bold text-indigo-600 hover:text-indigo-700 flex items-center justify-center gap-2">
                {reviewsLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ChevronDown className="w-4 h-4" />} Load More Reviews
              </button>
            )}
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm">
            <h3 className="font-black text-[15px] text-slate-900 mb-4">Course Progress</h3>
            <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden mb-3">
              <div className={cn("h-full transition-all duration-700 rounded-full", progress >= 100 ? "bg-emerald-500" : "bg-indigo-600")} style={{ width: `${progress}%` }} />
            </div>
            <div className="flex items-center justify-between">
              <p className="text-xs font-black text-slate-400 tracking-wide">{progress}% Completed</p>
              <p className="text-xs font-bold text-slate-400">{enrollment?.completedLessons?.length || 0}/{course.lessons.length} lessons</p>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm overflow-hidden">
            <h3 className="font-black text-[15px] text-slate-900 mb-5">Curriculum</h3>
            <div className="space-y-2 max-h-[500px] overflow-y-auto custom-scrollbar">
              {course.lessons.map((l, idx) => (
                <button key={l._id || idx} onClick={() => setActiveLesson(idx)} className={cn("w-full flex items-start gap-3 p-3 rounded-2xl text-left transition-all border-2", activeLesson === idx ? "border-indigo-600/10 bg-indigo-50/50" : "border-transparent hover:bg-slate-50")}>
                  <div className={cn("mt-0.5 w-6 h-6 rounded-full flex items-center justify-center shrink-0 border-2", isLessonCompleted(idx) ? "bg-emerald-500 border-emerald-500 text-white" : activeLesson === idx ? "border-indigo-200 bg-white" : "border-slate-100 bg-white")}>
                    {isLessonCompleted(idx) ? <CheckCircle className="w-4 h-4" /> : <span className="text-[11px] font-black text-slate-300">{idx + 1}</span>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={cn("text-sm font-bold transition-colors truncate", activeLesson === idx ? "text-indigo-600" : "text-slate-700")}>{l.title}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <p className="text-[10px] text-slate-400 font-medium">{l.duration || 'N/A'}</p>
                      {isLessonBookmarked(idx) && <BookmarkCheck className="w-3 h-3 text-amber-500" />}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {enrollment?.bookmarkedLessons?.length > 0 && (
            <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm">
              <h3 className="font-black text-[15px] text-slate-900 mb-4 flex items-center gap-2"><Bookmark className="w-4 h-4 text-amber-500" /> Bookmarked</h3>
              <div className="space-y-2">
                {enrollment.bookmarkedLessons.map(idx => {
                  const l = course.lessons[idx];
                  if (!l) return null;
                  return <button key={idx} onClick={() => setActiveLesson(idx)} className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-amber-50 transition-colors text-left"><BookmarkCheck className="w-4 h-4 text-amber-500 shrink-0" /><div className="flex-1 min-w-0"><p className="text-sm font-bold text-slate-700 truncate">{l.title}</p><p className="text-[10px] text-slate-400">Lesson {idx + 1}</p></div></button>;
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CourseDetail;
