import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  GraduationCap, BookOpen, Clock, ChevronRight, Loader2, AlertCircle,
  Award, Layers, BookmarkCheck, TrendingUp, Crown, Sparkles, RefreshCw,
  ChevronDown, Target, Flame, Trophy, Zap, Search, ArrowUpDown
} from 'lucide-react';
import { cn } from '../utils/cn';
import { useLearning } from '../context/LearningContext';
import LearningCalendar from './LearningCalendar';
import api from '../services/axiosClient';
import ErrorBoundary from '../components/ErrorBoundary';

const GRADIENTS = [
  'from-blue-500 via-indigo-500 to-violet-600',
  'from-emerald-400 via-teal-500 to-cyan-600',
  'from-violet-500 via-purple-500 to-fuchsia-600',
  'from-rose-400 via-pink-500 to-red-500',
  'from-orange-400 via-amber-500 to-yellow-500',
  'from-cyan-400 via-blue-500 to-indigo-600',
];

const TABS = [
  { id: 'all', label: 'All Courses', icon: Layers },
  { id: 'bookmarked', label: 'Bookmarked', icon: BookmarkCheck },
  { id: 'in-progress', label: 'In Progress', icon: TrendingUp },
  { id: 'completed', label: 'Completed', icon: Award },
];

const SORT_OPTIONS = [
  { id: 'recent', label: 'Recently Accessed' },
  { id: 'progress_desc', label: 'Progress (High to Low)' },
  { id: 'progress_asc', label: 'Progress (Low to High)' },
  { id: 'title', label: 'Alphabetical' },
  { id: 'enrolled', label: 'Enrollment Date' },
];

const MyLearning = () => {
  const navigate = useNavigate();
  const { enrollments, stats, fetchEnrollments, fetchStats } = useLearning();
  const [activeTab, setActiveTab] = useState('all');
  const [learningGoal, setLearningGoal] = useState(null);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('recent');
  const [showStreakWarning, setShowStreakWarning] = useState(false);

  const fetchLearningGoal = async () => {
    try {
      const { data } = await api.get('/learning-goals');
      setLearningGoal(data);
      // Show streak warning if user has a streak but no activity today
      if (data?.streakDays > 0) {
        const lastActive = data.lastActiveDate ? new Date(data.lastActiveDate) : null;
        const today = new Date();
        if (!lastActive || lastActive.toDateString() !== today.toDateString()) {
          setShowStreakWarning(true);
        }
      }
    } catch (err) {
      console.error('Failed to load learning goal:', err);
    }
  };

  useEffect(() => {
    fetchEnrollments(activeTab, true);
  }, [activeTab]);

  useEffect(() => {
    fetchStats();
    fetchLearningGoal();
    // Changed from 60s to 5 minutes to save bandwidth
    const interval = setInterval(fetchStats, 300000);
    return () => clearInterval(interval);
  }, []);

  const handleContinue = (enrollment) => {
    const lastLesson = enrollment.lastAccessedLesson;
    if (lastLesson > 0) {
      navigate(`/learn/course/${enrollment.course?._id}?lesson=${lastLesson}`);
    } else {
      navigate(`/learn/course/${enrollment.course?._id}`);
    }
  };

  const handleLoadMore = () => {
    fetchEnrollments(activeTab, false);
  };

  const handleStatClick = (filterType) => {
    setActiveTab(filterType);
  };

  const gradient = (index) => GRADIENTS[index % GRADIENTS.length];
  const statsData = stats.data;
  const enrollmentData = enrollments.data || [];
  const loading = enrollments.loading;
  const error = enrollments.error;

  // Client-side search filter
  const filteredData = search
    ? enrollmentData.filter(e => e.course?.title?.toLowerCase().includes(search.toLowerCase()))
    : enrollmentData;

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Streak Warning */}
      {showStreakWarning && (
        <div className="bg-gradient-to-r from-amber-500 to-orange-500 rounded-2xl p-4 text-white flex items-center justify-between shadow-lg shadow-amber-500/20">
          <div className="flex items-center gap-3">
            <Flame className="w-6 h-6" />
            <div>
              <p className="font-bold text-sm">Don't break your streak!</p>
              <p className="text-xs text-white/80">You have a {learningGoal?.streakDays}-day streak. Complete a lesson today to keep it going.</p>
            </div>
          </div>
          <button onClick={() => setShowStreakWarning(false)} className="text-white/60 hover:text-white text-lg px-2">&times;</button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight leading-none mb-2">My Learning</h1>
          <p className="text-base text-slate-500 font-medium">Track your enrolled courses and continue where you left off.</p>
        </div>
        <button onClick={() => { fetchEnrollments(activeTab, true); fetchStats(); }} disabled={loading} className="flex items-center gap-2 text-sm font-bold text-indigo-600 hover:text-indigo-700 transition-colors">
          <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} /> Refresh
        </button>
      </div>

      {/* Stats Row - Clickable */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: 'Enrolled', val: statsData?.enrolled ?? enrollmentData.length, color: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-100', icon: BookOpen, filter: 'all' },
          { label: 'In Progress', val: statsData?.inProgress ?? 0, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100', icon: TrendingUp, filter: 'in-progress' },
          { label: 'Completed', val: statsData?.completed ?? 0, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100', icon: Award, filter: 'completed' },
          { label: 'Hours Learned', val: statsData?.hours ?? 0, color: 'text-violet-600', bg: 'bg-violet-50', border: 'border-violet-100', icon: Clock, filter: null },
          { label: 'Streak', val: learningGoal?.streakDays ?? 0, color: 'text-rose-600', bg: 'bg-rose-50', border: 'border-rose-100', icon: Flame, filter: null },
        ].map(s => (
          <div
            key={s.label}
            onClick={() => s.filter && handleStatClick(s.filter)}
            className={cn(
              "bg-white rounded-2xl border shadow-sm p-5 text-center transition-all",
              s.border,
              s.filter && "cursor-pointer hover:shadow-md hover:-translate-y-0.5"
            )}
          >
            <div className={cn("w-10 h-10 rounded-xl mx-auto mb-2 flex items-center justify-center", s.bg)}>
              <s.icon className={cn("w-5 h-5", s.color)} />
            </div>
            <p className={cn("text-2xl font-black", s.color)}>{s.val}</p>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Goals + Calendar */}
      {learningGoal && (
        <ErrorBoundary fallbackMessage="Could not load learning goals.">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm">
              <h3 className="font-black text-[15px] text-slate-900 mb-4 flex items-center gap-2">
                <Target className="w-4 h-4 text-indigo-500" /> Weekly Goals
              </h3>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-bold text-slate-500">Hours: {learningGoal.currentWeekHours} / {learningGoal.weeklyHoursTarget}h</span>
                    <span className="text-[10px] font-bold text-indigo-600">{Math.min(100, Math.round((learningGoal.currentWeekHours / learningGoal.weeklyHoursTarget) * 100))}%</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-600 rounded-full transition-all" style={{ width: `${Math.min(100, (learningGoal.currentWeekHours / learningGoal.weeklyHoursTarget) * 100)}%` }} />
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-bold text-slate-500">Lessons: {learningGoal.currentWeekCourses} / {learningGoal.weeklyCoursesTarget}</span>
                    <span className="text-[10px] font-bold text-emerald-600">{Math.min(100, Math.round((learningGoal.currentWeekCourses / learningGoal.weeklyCoursesTarget) * 100))}%</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${Math.min(100, (learningGoal.currentWeekCourses / learningGoal.weeklyCoursesTarget) * 100)}%` }} />
                  </div>
                </div>
              </div>
              {learningGoal.longestStreak > 0 && (
                <div className="mt-4 pt-4 border-t border-slate-100 flex items-center gap-2">
                  <Flame className="w-4 h-4 text-amber-500" />
                  <span className="text-xs font-bold text-slate-600">Longest streak: {learningGoal.longestStreak} days</span>
                </div>
              )}
            </div>
            <div className="lg:col-span-2">
              <LearningCalendar activityLog={learningGoal.activityLog || []} />
            </div>
          </div>
        </ErrorBoundary>
      )}

      {/* Search + Sort Bar */}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search your courses..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-slate-100/60 border-2 border-transparent focus:bg-white focus:border-indigo-100 rounded-2xl py-3 pl-11 pr-4 text-sm font-bold text-slate-800 placeholder:text-slate-400 outline-none transition-all"
          />
        </div>
        <div className="relative">
          <select value={sort} onChange={e => setSort(e.target.value)} className="appearance-none bg-white border border-slate-200 rounded-xl px-4 py-3 pr-8 text-sm font-bold text-slate-700 cursor-pointer hover:border-indigo-200 outline-none">
            {SORT_OPTIONS.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}
          </select>
          <ArrowUpDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 bg-white rounded-2xl border border-slate-200/60 p-1.5 shadow-sm">
        {TABS.map(tab => {
          const isActive = activeTab === tab.id;
          return (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={cn(
              "flex items-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-bold transition-all duration-300 flex-1 justify-center",
              isActive ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/20" : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"
            )}>
              <tab.icon className="w-4 h-4" />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Loading State */}
      {loading && enrollmentData.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24">
          <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
          <p className="text-sm font-bold text-slate-400 mt-4">Loading your courses...</p>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="flex flex-col items-center justify-center py-24">
          <div className="w-16 h-16 bg-rose-50 rounded-2xl flex items-center justify-center mb-4">
            <AlertCircle className="w-8 h-8 text-rose-400" />
          </div>
          <p className="text-sm font-bold text-rose-600">{error}</p>
          <button onClick={() => fetchEnrollments(activeTab, true)} className="mt-3 text-xs font-bold text-indigo-600 hover:text-indigo-700 underline">Try again</button>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && filteredData.length === 0 && (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-16 text-center">
          <div className="w-20 h-20 bg-slate-100 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <BookOpen className="w-10 h-10 text-slate-300" />
          </div>
          <h2 className="text-xl font-black text-slate-900 mb-2">
            {search ? 'No courses match your search' : activeTab === 'all' ? 'No courses yet' : activeTab === 'bookmarked' ? 'No bookmarked lessons' : activeTab === 'in-progress' ? 'No courses in progress' : 'No completed courses'}
          </h2>
          <p className="text-sm text-slate-400 font-medium mb-6">
            {search ? 'Try a different search term.' : activeTab === 'all' ? 'Enroll in a course from Explore to get started.' : 'Check back after more learning activity.'}
          </p>
          {!search && activeTab === 'all' && (
            <button onClick={() => navigate('/learn/explore')} className="inline-flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-xl text-sm font-black hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-500/20 active:scale-95">
              Explore Courses <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>
      )}

      {/* Course Cards */}
      {!loading && !error && filteredData.length > 0 && (
        <div className="space-y-4">
          {filteredData.map((enrollment, idx) => {
            const course = enrollment.course;
            if (!course) return null;
            const isPremium = course.price > 0;
            const isCompleted = enrollment.progress >= 100;

            return (
              <div key={enrollment._id} onClick={() => handleContinue(enrollment)} className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-lg hover:border-slate-200 transition-all group overflow-hidden cursor-pointer">
                <div className="flex items-center gap-5 p-5">
                  {course.thumbnail && course.thumbnail.startsWith('http') ? (
                    <div className="w-20 h-20 rounded-xl bg-cover bg-center shrink-0" style={{ backgroundImage: `url(${course.thumbnail})` }} />
                  ) : (
                    <div className={cn("w-20 h-20 rounded-xl bg-gradient-to-br shrink-0 flex items-center justify-center", gradient(idx))}>
                      <GraduationCap className="w-9 h-9 text-white/80" />
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5">
                      {isPremium && (
                        <div className="flex items-center gap-1 bg-gradient-to-r from-amber-500 to-yellow-400 px-2 py-0.5 rounded-md">
                          <Crown className="w-3 h-3 text-white" />
                          <span className="text-[9px] font-black text-white uppercase tracking-wider">Premium</span>
                        </div>
                      )}
                      {!isPremium && (
                        <div className="flex items-center gap-1 bg-emerald-50 px-2 py-0.5 rounded-md">
                          <Sparkles className="w-3 h-3 text-emerald-500" />
                          <span className="text-[9px] font-black text-emerald-600 uppercase tracking-wider">Free</span>
                        </div>
                      )}
                      {isCompleted && (
                        <div className="flex items-center gap-1 bg-emerald-50 px-2 py-0.5 rounded-md">
                          <Award className="w-3 h-3 text-emerald-500" />
                          <span className="text-[9px] font-black text-emerald-600 uppercase tracking-wider">Completed</span>
                        </div>
                      )}
                    </div>

                    <h3 className="font-extrabold text-[15px] text-slate-900 leading-tight mb-1.5 truncate group-hover:text-indigo-600 transition-colors">{course.title}</h3>

                    <div className="flex items-center gap-3 text-[11px] text-slate-400 font-bold mb-2.5">
                      <span className="flex items-center gap-1"><Layers className="w-3 h-3" />{course.lessons?.length || 0} lessons</span>
                      {course.level && <span className="flex items-center gap-1"><TrendingUp className="w-3 h-3" />{course.level}</span>}
                      {enrollment.timeSpentSeconds > 0 && (
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{Math.round(enrollment.timeSpentSeconds / 60)}m</span>
                      )}
                      {enrollment.bookmarkedLessons?.length > 0 && <span className="flex items-center gap-1 text-amber-500"><BookmarkCheck className="w-3 h-3" />{enrollment.bookmarkedLessons.length} bookmarked</span>}
                    </div>

                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className={cn("h-full transition-all duration-700 rounded-full", isCompleted ? "bg-emerald-500" : "bg-indigo-600")} style={{ width: `${enrollment.progress}%` }} />
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <p className="text-[10px] font-bold text-slate-400">{enrollment.progress}% complete</p>
                      <p className="text-[10px] font-bold text-slate-400">{enrollment.completedLessons?.length || 0}/{course.lessons?.length || 0} lessons</p>
                    </div>
                  </div>

                  <button onClick={(e) => { e.stopPropagation(); handleContinue(enrollment); }} className={cn(
                    "flex items-center gap-1 text-xs font-bold px-5 py-2.5 rounded-xl active:scale-95 transition-all shrink-0 shadow-sm",
                    isCompleted ? "bg-emerald-50 text-emerald-600 hover:bg-emerald-100" : "bg-slate-900 text-white hover:bg-indigo-600 hover:shadow-indigo-500/20"
                  )}>
                    {isCompleted ? 'Review' : enrollment.progress > 0 ? 'Continue' : 'Start'}
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Load More */}
      {enrollments.hasMore && !loading && enrollmentData.length > 0 && (
        <div className="flex justify-center pt-4">
          <button onClick={handleLoadMore} disabled={loading} className="flex items-center gap-2 bg-white border border-slate-200 text-slate-700 px-8 py-3 rounded-2xl text-sm font-bold hover:border-indigo-200 hover:text-indigo-600 transition-all active:scale-95 shadow-sm">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ChevronDown className="w-4 h-4" />}
            Load More
          </button>
        </div>
      )}
    </div>
  );
};

export default MyLearning;
