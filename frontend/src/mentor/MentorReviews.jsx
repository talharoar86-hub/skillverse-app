import React, { useState, useEffect } from 'react';
import { reviewService, mentorService, courseReviewService, notificationService } from '../services/api';
import { useAuth } from '../auth/AuthContext';
import { getAvatarUrl } from '../utils/avatar';
import {
  Star, Loader2, ChevronLeft, ChevronRight, Filter, ArrowUpDown,
  MessageCircle, Send, BookOpen, Check, TrendingUp, TrendingDown,
  BarChart3, Users, Clock, Award, Bell
} from 'lucide-react';
import { cn } from '../utils/cn';

const MentorReviews = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [sortBy, setSortBy] = useState('newest');
  const [filterRating, setFilterRating] = useState(0);
  const [tab, setTab] = useState('mentor');
  const [courseReviews, setCourseReviews] = useState([]);
  const [coursePage, setCoursePage] = useState(1);
  const [courseTotalPages, setCourseTotalPages] = useState(1);
  const [courseTotal, setCourseTotal] = useState(0);
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [isReplying, setIsReplying] = useState(false);
  const [dateRange, setDateRange] = useState('all');
  const [courseFilter, setCourseFilter] = useState('all');
  const [courseSort, setCourseSort] = useState('newest');
  const [courseFilterRating, setCourseFilterRating] = useState(0);
  const [courseStats, setCourseStats] = useState(null);
  const [uniqueCourses, setUniqueCourses] = useState([]);
  const [mentorReviewCount, setMentorReviewCount] = useState(0);
  const [courseReviewCount, setCourseReviewCount] = useState(0);

  useEffect(() => { loadStats(); }, []);
  useEffect(() => { if (tab === 'mentor') loadReviews(page); }, [page, sortBy, tab, dateRange]);
  useEffect(() => { if (tab === 'courses') { loadCourseReviews(coursePage); }; }, [coursePage, tab, courseFilter, courseSort, courseFilterRating]);

  const loadStats = async () => {
    try {
      const data = await reviewService.getStats(user._id);
      setStats(data);
      
      const [mentorNotif, courseNotif] = await Promise.all([
        notificationService.getUnreadCount('new_review'),
        notificationService.getUnreadCount('new_course_review')
      ]);
      setMentorReviewCount(mentorNotif.count || 0);
      setCourseReviewCount(courseNotif.count || 0);
    } catch (err) {
      console.error('Failed to load stats', err);
    }
  };

  const loadReviews = async (p) => {
    setIsLoading(true);
    try {
      const data = await reviewService.getReviews(user._id, p);
      let revs = data.reviews || [];
      
      if (filterRating > 0) {
        revs = revs.filter(r => r.rating === filterRating);
      }
      
      if (dateRange !== 'all') {
        const now = new Date();
        const filterDate = new Date();
        if (dateRange === 'week') filterDate.setDate(now.getDate() - 7);
        else if (dateRange === 'month') filterDate.setMonth(now.getMonth() - 1);
        else if (dateRange === '3months') filterDate.setMonth(now.getMonth() - 3);
        revs = revs.filter(r => new Date(r.createdAt) >= filterDate);
      }
      
      if (sortBy === 'highest') revs = [...revs].sort((a, b) => b.rating - a.rating);
      else if (sortBy === 'lowest') revs = [...revs].sort((a, b) => a.rating - b.rating);
      
      setReviews(revs);
      setTotalPages(data.pages || 1);
      setTotal(data.total || 0);
    } catch (err) {
      console.error('Failed to load reviews', err);
    } finally {
      setIsLoading(false);
    }
  };

  const loadCourseReviews = async (p) => {
    setIsLoading(true);
    try {
      const data = await mentorService.getCourseReviews({ page: p, limit: 20, sort: courseSort });
      let revs = data.reviews || [];
      
      const courses = [...new Map(revs.map(r => [r.course?._id, r.course])).values()].filter(Boolean);
      
      if (courseFilter !== 'all') {
        revs = revs.filter(r => r.course?._id === courseFilter);
      }
      
      if (courseFilterRating > 0) {
        revs = revs.filter(r => r.rating === courseFilterRating);
      }
      
      setCourseReviews(revs);
      setCourseTotalPages(data.totalPages || 1);
      setCourseTotal(data.total || 0);
      setUniqueCourses(courses);
      
      const courseRatingMap = {};
      revs.forEach(r => {
        if (r.course?._id) {
          courseRatingMap[r.course._id] = courseRatingMap[r.course._id] || { total: 0, sum: 0, count: 0 };
          courseRatingMap[r.course._id].sum += r.rating;
          courseRatingMap[r.course._id].count += 1;
        }
      });
      
      const statsList = Object.entries(courseRatingMap).map(([id, data]) => ({
        courseId: id,
        averageRating: data.count > 0 ? (data.sum / data.count).toFixed(1) : 0,
        totalReviews: data.count
      }));
      setCourseStats(statsList);
    } catch (err) {
      console.error('Failed to load course reviews', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReply = async (reviewId, isCourseReview = false) => {
    if (!replyText.trim()) return;
    setIsReplying(true);
    try {
      if (isCourseReview) {
        await mentorService.replyToReview(reviewId, replyText);
        setCourseReviews(prev => prev.map(r =>
          r._id === reviewId
            ? { ...r, mentorReply: { text: replyText.trim(), repliedAt: new Date() } }
            : r
        ));
      } else {
        await reviewService.replyToReview(reviewId, replyText);
        setReviews(prev => prev.map(r =>
          r._id === reviewId
            ? { ...r, mentorReply: { text: replyText.trim(), repliedAt: new Date() } }
            : r
        ));
        await loadStats();
      }
      setReplyingTo(null);
      setReplyText('');
    } catch (err) {
      console.error('Failed to reply', err);
    } finally {
      setIsReplying(false);
    }
  };

  const formatDate = (date) => {
    if (!date) return '';
    return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const formatRelativeDate = (date) => {
    if (!date) return '';
    const now = new Date();
    const d = new Date(date);
    const diffMs = now - d;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return formatDate(date);
  };

  if (isLoading && reviews.length === 0 && courseReviews.length === 0) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Reviews & Ratings</h1>
        <p className="text-sm text-slate-500 mt-1 font-medium">See what your students are saying about you.</p>
      </div>

      <div className="flex gap-1 bg-slate-100 rounded-xl p-1 w-fit">
        <button
          onClick={() => setTab('mentor')}
          className={cn(
            "px-4 py-2 rounded-lg text-sm font-bold transition-all relative",
            tab === 'mentor' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
          )}
        >
          Mentor Reviews
          {mentorReviewCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-rose-500 text-white text-[10px] font-black flex items-center justify-center rounded-full animate-pulse">
              {mentorReviewCount > 9 ? '9+' : mentorReviewCount}
            </span>
          )}
        </button>
        <button
          onClick={() => setTab('courses')}
          className={cn(
            "px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-1.5 relative",
            tab === 'courses' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
          )}
        >
          <BookOpen className="w-3.5 h-3.5" /> Course Reviews
          {courseReviewCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-rose-500 text-white text-[10px] font-black flex items-center justify-center rounded-full animate-pulse">
              {courseReviewCount > 9 ? '9+' : courseReviewCount}
            </span>
          )}
        </button>
      </div>

      {tab === 'mentor' && (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
                  <Star className="w-5 h-5 text-amber-500" />
                </div>
                <div>
                  <p className="text-xs text-slate-400 font-medium uppercase tracking-wide">Average Rating</p>
                  <p className="text-xl font-black text-slate-900">{stats?.averageRating?.toFixed(1) || '0.0'}</p>
                </div>
              </div>
              <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map(i => (
                  <Star
                    key={i}
                    className={cn(
                      "w-3.5 h-3.5",
                      i <= Math.round(stats?.averageRating || 0)
                        ? "text-amber-400 fill-amber-400"
                        : "text-slate-200"
                    )}
                  />
                ))}
                <span className="text-xs text-slate-400 ml-1">({stats?.totalReviews || 0})</span>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center">
                  <Users className="w-5 h-5 text-indigo-500" />
                </div>
                <div>
                  <p className="text-xs text-slate-400 font-medium uppercase tracking-wide">Total Reviews</p>
                  <p className="text-xl font-black text-slate-900">{stats?.totalReviews || 0}</p>
                </div>
              </div>
              <div className={cn(
                "flex items-center gap-1 text-xs font-medium",
                (stats?.ratingTrend || 0) > 0 ? "text-emerald-600" : (stats?.ratingTrend || 0) < 0 ? "text-rose-600" : "text-slate-500"
              )}>
                {(stats?.ratingTrend || 0) > 0 ? <TrendingUp className="w-3 h-3" /> : (stats?.ratingTrend || 0) < 0 ? <TrendingDown className="w-3 h-3" /> : null}
                {stats?.thisMonthReviews || 0} this month
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                  <MessageCircle className="w-5 h-5 text-emerald-500" />
                </div>
                <div>
                  <p className="text-xs text-slate-400 font-medium uppercase tracking-wide">Response Rate</p>
                  <p className="text-xl font-black text-slate-900">{stats?.responseRate || 0}%</p>
                </div>
              </div>
              <p className="text-xs text-slate-400">
                {Math.round((stats?.responseRate || 0) * (stats?.totalReviews || 0) / 100)} responded
              </p>
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
              <p className="text-xs text-slate-400 font-medium uppercase tracking-wide mb-3">Rating Breakdown</p>
              <div className="space-y-1.5">
                {[5, 4, 3, 2, 1].map(star => (
                  <div key={star} className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-slate-500 w-3">{star}</span>
                    <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                    <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-amber-400 rounded-full transition-all"
                        style={{ width: `${stats?.breakdownPercent?.[star] || 0}%` }}
                      />
                    </div>
                    <span className="text-[10px] font-bold text-slate-400 w-8 text-right">
                      {stats?.breakdownPercent?.[star] || 0}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <ArrowUpDown className="w-4 h-4 text-slate-400" />
            {['newest', 'highest', 'lowest'].map(s => (
              <button
                key={s}
                onClick={() => { setSortBy(s); setPage(1); }}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-bold border transition-all capitalize",
                  sortBy === s
                    ? "bg-indigo-50 text-indigo-600 border-indigo-200"
                    : "bg-white text-slate-500 border-slate-200 hover:border-slate-300"
                )}
              >
                {s}
              </button>
            ))}
            
            <div className="h-6 w-px bg-slate-200 mx-1" />
            
            {[
              { value: 'all', label: 'All Time' },
              { value: 'month', label: 'This Month' },
              { value: '3months', label: '3 Months' }
            ].map(d => (
              <button
                key={d.value}
                onClick={() => { setDateRange(d.value); setPage(1); }}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-bold border transition-all",
                  dateRange === d.value
                    ? "bg-slate-800 text-white border-slate-800"
                    : "bg-white text-slate-500 border-slate-200 hover:border-slate-300"
                )}
              >
                {d.label}
              </button>
            ))}
            
            <div className="h-6 w-px bg-slate-200 mx-1" />
            
            {filterRating > 0 ? (
              <button
                onClick={() => { setFilterRating(0); setPage(1); }}
                className="px-3 py-1.5 rounded-lg text-xs font-bold border border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100 transition-all"
              >
                {filterRating} star{filterRating > 1 ? 's' : ''} (clear)
              </button>
            ) : (
              [5, 4, 3, 2, 1].map(star => (
                <button
                  key={star}
                  onClick={() => { setFilterRating(star); setPage(1); }}
                  className="px-2 py-1 rounded-lg text-xs font-bold text-slate-400 hover:text-amber-500 hover:bg-amber-50 transition-all"
                >
                  {star}★
                </button>
              ))
            )}
          </div>

          {reviews.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm py-16 text-center">
              <Star className="w-12 h-12 text-slate-200 mx-auto mb-4" />
              <h3 className="text-lg font-black text-slate-900 mb-2">No reviews {filterRating > 0 ? `for ${filterRating} stars` : 'yet'}</h3>
              <p className="text-sm text-slate-400 font-medium">Reviews from your students will appear here.</p>
            </div>
          ) : (
            <>
              <div className="space-y-3">
                {reviews.map(review => (
                  <div key={review._id} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                    <div className="flex items-start gap-4">
                      <div className="w-11 h-11 rounded-full bg-slate-100 overflow-hidden shrink-0 flex items-center justify-center">
                        {review.studentId?.avatarUrl ? (
                          <img src={getAvatarUrl(review.studentId)} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-sm font-bold text-slate-500">
                            {(review.studentId?.name || 'U').charAt(0)}
                          </span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-bold text-slate-900">{review.studentId?.name || 'Anonymous'}</h4>
                            {review.courseId && (
                              <span className="text-[10px] bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-md">
                                Course
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-slate-400 font-medium">
                            {formatRelativeDate(review.createdAt)}
                          </span>
                        </div>
                        <div className="flex items-center gap-0.5 mb-2">
                          {[1, 2, 3, 4, 5].map(i => (
                            <Star
                              key={i}
                              className={cn(
                                "w-3.5 h-3.5",
                                i <= review.rating
                                  ? "text-amber-400 fill-amber-400"
                                  : "text-slate-200"
                              )}
                            />
                          ))}
                        </div>
                        {review.comment && (
                          <p className="text-sm text-slate-600 font-medium leading-relaxed">{review.comment}</p>
                        )}

                        {review.mentorReply?.text ? (
                          <div className="mt-4 p-4 bg-gradient-to-r from-indigo-50 to-violet-50 rounded-xl border border-indigo-100">
                            <div className="flex items-center gap-1.5 mb-1.5">
                              <MessageCircle className="w-3.5 h-3.5 text-indigo-600" />
                              <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wide">Your Reply</span>
                              <span className="text-[10px] text-indigo-400">· {formatRelativeDate(review.mentorReply.repliedAt)}</span>
                            </div>
                            <p className="text-sm text-slate-700 font-medium leading-relaxed">{review.mentorReply.text}</p>
                          </div>
                        ) : replyingTo === review._id ? (
                          <div className="mt-3 flex gap-2">
                            <input
                              type="text"
                              value={replyText}
                              onChange={e => setReplyText(e.target.value)}
                              placeholder="Write a meaningful reply..."
                              className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50 transition-all"
                              autoFocus
                            />
                            <button
                              onClick={() => handleReply(review._id, false)}
                              disabled={isReplying || !replyText.trim()}
                              className="px-4 py-2.5 bg-indigo-600 text-white text-sm font-bold rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition-all flex items-center gap-2"
                            >
                              {isReplying ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                            </button>
                            <button
                              onClick={() => { setReplyingTo(null); setReplyText(''); }}
                              className="px-4 py-2.5 text-sm font-bold text-slate-500 border border-slate-200 rounded-xl hover:bg-slate-50 transition-all"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setReplyingTo(review._id)}
                            className="mt-3 flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-700 transition-colors"
                          >
                            <MessageCircle className="w-3.5 h-3.5" /> Reply to review
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-3">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 disabled:opacity-30 transition-all"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      const pageNum = i + 1;
                      return (
                        <button
                          key={pageNum}
                          onClick={() => setPage(pageNum)}
                          className={cn(
                            "w-9 h-9 rounded-lg text-sm font-bold transition-all",
                            page === pageNum
                              ? "bg-indigo-600 text-white"
                              : "text-slate-500 hover:bg-slate-50"
                          )}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                    {totalPages > 5 && (
                      <>
                        <span className="text-slate-400">...</span>
                        <button
                          onClick={() => setPage(totalPages)}
                          className={cn(
                            "w-9 h-9 rounded-lg text-sm font-bold transition-all",
                            page === totalPages
                              ? "bg-indigo-600 text-white"
                              : "text-slate-500 hover:bg-slate-50"
                          )}
                        >
                          {totalPages}
                        </button>
                      </>
                    )}
                  </div>
                  <button
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 disabled:opacity-30 transition-all"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </>
          )}
        </>
      )}

      {tab === 'courses' && (
        <div className="space-y-5">
          {(courseStats || []).length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {courseStats.slice(0, 6).map(cs => {
                const course = uniqueCourses.find(c => c._id === cs.courseId);
                return (
                  <div key={cs.courseId} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs font-bold text-indigo-600 truncate flex-1">{course?.title || 'Course'}</p>
                      <div className="flex items-center gap-1">
                        <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                        <span className="text-sm font-black text-slate-900">{cs.averageRating}</span>
                      </div>
                    </div>
                    <p className="text-[10px] text-slate-400">{cs.totalReviews} reviews</p>
                  </div>
                );
              })}
            </div>
          )}

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-2 bg-white rounded-xl border border-slate-200 p-1">
              <ArrowUpDown className="w-4 h-4 text-slate-400 ml-2" />
              {['newest', 'highest', 'lowest'].map(s => (
                <button
                  key={s}
                  onClick={() => { setCourseSort(s); setCoursePage(1); }}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-bold transition-all capitalize",
                    courseSort === s
                      ? "bg-indigo-600 text-white"
                      : "text-slate-500 hover:text-slate-700"
                  )}
                >
                  {s}
                </button>
              ))}
            </div>

            {uniqueCourses.length > 0 && (
              <select
                value={courseFilter}
                onChange={e => { setCourseFilter(e.target.value); setCoursePage(1); }}
                className="px-3 py-2 rounded-xl text-xs font-bold border border-slate-200 bg-white outline-none"
              >
                <option value="all">All Courses</option>
                {uniqueCourses.map(c => (
                  <option key={c._id} value={c._id}>{c.title}</option>
                ))}
              </select>
            )}

            {courseFilterRating > 0 ? (
              <button
                onClick={() => { setCourseFilterRating(0); setCoursePage(1); }}
                className="px-3 py-2 rounded-xl text-xs font-bold border border-rose-200 bg-rose-50 text-rose-600"
              >
                {courseFilterRating}★ (clear)
              </button>
            ) : (
              [5, 4, 3].map(star => (
                <button
                  key={star}
                  onClick={() => { setCourseFilterRating(star); setCoursePage(1); }}
                  className="px-2 py-1.5 rounded-lg text-xs font-bold text-slate-400 hover:text-amber-500 hover:bg-amber-50 transition-all"
                >
                  {star}★
                </button>
              ))
            )}

            <span className="text-xs text-slate-400 font-medium ml-auto">
              {courseTotal} reviews
            </span>
          </div>

          {courseReviews.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm py-16 text-center">
              <BookOpen className="w-12 h-12 text-slate-200 mx-auto mb-4" />
              <h3 className="text-lg font-black text-slate-900 mb-2">No course reviews yet</h3>
              <p className="text-sm text-slate-400 font-medium">
                {courseFilter !== 'all' || courseFilterRating > 0 ? 'No reviews match filters' : 'Reviews for your courses will appear here.'}
              </p>
            </div>
          ) : (
            <>
              <div className="space-y-3">
                {courseReviews.map(review => (
                  <div key={review._id} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                    <div className="flex items-start gap-4">
                      <div className="w-11 h-11 rounded-full bg-slate-100 overflow-hidden shrink-0 flex items-center justify-center">
                        {review.user?.avatarUrl ? (
                          <img src={getAvatarUrl(review.user)} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-sm font-bold text-slate-500">
                            {(review.user?.name || 'U').charAt(0)}
                          </span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <div>
                            <h4 className="text-sm font-bold text-slate-900">{review.user?.name || 'Anonymous'}</h4>
                            <p className="text-[11px] text-indigo-600 font-medium">{review.course?.title}</p>
                          </div>
                          <span className="text-[11px] text-slate-400 font-medium">
                            {formatRelativeDate(review.createdAt)}
                          </span>
                        </div>
                        <div className="flex items-center gap-0.5 mb-2">
                          {[1, 2, 3, 4, 5].map(i => (
                            <Star
                              key={i}
                              className={cn("w-3.5 h-3.5", i <= review.rating ? "text-amber-400 fill-amber-400" : "text-slate-200")}
                            />
                          ))}
                        </div>
                        {review.comment && (
                          <p className="text-sm text-slate-600 font-medium leading-relaxed">{review.comment}</p>
                        )}

                        {review.mentorReply?.text ? (
                          <div className="mt-4 p-4 bg-gradient-to-r from-indigo-50 to-violet-50 rounded-xl border border-indigo-100">
                            <div className="flex items-center gap-1.5 mb-1.5">
                              <MessageCircle className="w-3.5 h-3.5 text-indigo-600" />
                              <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wide">Your Reply</span>
                              <span className="text-[10px] text-indigo-400">· {formatRelativeDate(review.mentorReply.repliedAt)}</span>
                            </div>
                            <p className="text-sm text-slate-700 font-medium leading-relaxed">{review.mentorReply.text}</p>
                          </div>
                        ) : replyingTo === review._id ? (
                          <div className="mt-3 flex gap-2">
                            <input
                              type="text"
                              value={replyText}
                              onChange={e => setReplyText(e.target.value)}
                              placeholder="Write a meaningful reply..."
                              className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50 transition-all"
                              autoFocus
                            />
                            <button
                              onClick={() => handleReply(review._id, true)}
                              disabled={isReplying || !replyText.trim()}
                              className="px-4 py-2.5 bg-indigo-600 text-white text-sm font-bold rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition-all flex items-center gap-2"
                            >
                              {isReplying ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                            </button>
                            <button
                              onClick={() => { setReplyingTo(null); setReplyText(''); }}
                              className="px-4 py-2.5 text-sm font-bold text-slate-500 border border-slate-200 rounded-xl hover:bg-slate-50 transition-all"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setReplyingTo(review._id)}
                            className="mt-3 flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-700 transition-colors"
                          >
                            <MessageCircle className="w-3.5 h-3.5" /> Reply to review
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {courseTotalPages > 1 && (
                <div className="flex items-center justify-center gap-3">
                  <button
                    onClick={() => setCoursePage(p => Math.max(1, p - 1))}
                    disabled={coursePage === 1}
                    className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 disabled:opacity-30 transition-all"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, courseTotalPages) }, (_, i) => {
                      const pageNum = i + 1;
                      return (
                        <button
                          key={pageNum}
                          onClick={() => setCoursePage(pageNum)}
                          className={cn(
                            "w-9 h-9 rounded-lg text-sm font-bold transition-all",
                            coursePage === pageNum
                              ? "bg-indigo-600 text-white"
                              : "text-slate-500 hover:bg-slate-50"
                          )}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                    {courseTotalPages > 5 && (
                      <>
                        <span className="text-slate-400">...</span>
                        <button
                          onClick={() => setCoursePage(courseTotalPages)}
                          className={cn(
                            "w-9 h-9 rounded-lg text-sm font-bold transition-all",
                            coursePage === courseTotalPages
                              ? "bg-indigo-600 text-white"
                              : "text-slate-500 hover:bg-slate-50"
                          )}
                        >
                          {courseTotalPages}
                        </button>
                      </>
                    )}
                  </div>
                  <button
                    onClick={() => setCoursePage(p => Math.min(courseTotalPages, p + 1))}
                    disabled={coursePage === courseTotalPages}
                    className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 disabled:opacity-30 transition-all"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default MentorReviews;