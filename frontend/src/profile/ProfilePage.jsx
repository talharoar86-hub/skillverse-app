import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../auth/AuthContext';
import { postService, exchangeService, enrollmentService } from '../services/api';
import {
  Award, Briefcase, Edit3, Shield, Mail, Calendar,
  Github, Linkedin, Twitter, Star, Bookmark, Share2,
  Trophy, FileText, ShieldOff, BarChart3, Users, TrendingUp,
  GraduationCap, Clock, CheckCircle2, ShieldCheck, ArrowLeftRight, BookOpen, TrendingDown,
  RefreshCw
} from 'lucide-react';
import PostCard from '../components/PostCard';
import EditProfileModal from './EditProfileModal';
import { getAvatarUrl } from '../utils/avatar';
import { useLocation, useNavigate } from 'react-router-dom';
import { useSocket } from '../context/SocketContext';

const ProfilePage = () => {
  const { user, updateUser } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const socket = useSocket();

  // Derive which section to show from URL
  const path = location.pathname.split('/').pop();
  const isOverview = path === 'overview';
  const isPosts = path === 'posts';
  const isSaved = path === 'saved';
  const isInterested = path === 'interested';
  const isNotInterested = path === 'not-interested';
  const isLearning = path === 'learning';
  const isMentorActivity = path === 'mentor-activity';
  const isExchangeActivity = path === 'exchange-activity';
  const isReposts = path === 'reposts';

  // State for all categories
  const [feeds, setFeeds] = useState({
    posts: { posts: [], total: 0, page: 1, hasMore: true, loaded: false },
    saved: { posts: [], total: 0, page: 1, hasMore: true, loaded: false },
    interested: { posts: [], total: 0, page: 1, hasMore: true, loaded: false },
    notInterested: { posts: [], total: 0, page: 1, hasMore: true, loaded: false },
    reposts: { posts: [], total: 0, page: 1, hasMore: true, loaded: false }
  });

  const [profileStats, setProfileStats] = useState({
    postsCount: 0,
    savedCount: 0,
    interestedCount: 0,
    notInterestedCount: 0,
    repostsCount: 0
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Exchange Activity state
  const [exchangeData, setExchangeData] = useState(null);
  const [isLoadingExchange, setIsLoadingExchange] = useState(false);

  // Learning Activity state
  const [learningData, setLearningData] = useState(null);
  const [isLoadingLearning, setIsLearningLoading] = useState(false);

  // Map URL path to feed key
  const feedKeyMap = {
    posts: 'posts',
    saved: 'saved',
    interested: 'interested',
    'not-interested': 'notInterested',
    reposts: 'reposts'
  };
  const activeFeedKey = feedKeyMap[path];

  // Fetch stats only on mount
  const loadStats = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const stats = await postService.getProfileStats();
      setProfileStats(stats);
    } catch (err) {
      console.error('Error loading profile stats', err);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  // Fetch exchange activity when tab is activated
  useEffect(() => {
    if (isExchangeActivity && !exchangeData && !isLoadingExchange) {
      setIsLoadingExchange(true);
      exchangeService.getActivity(1, 20)
        .then(data => setExchangeData(data))
        .catch(err => console.error('Error loading exchange activity', err))
        .finally(() => setIsLoadingExchange(false));
    }
  }, [isExchangeActivity, exchangeData, isLoadingExchange]);

  // Fetch learning activity when tab is activated
  useEffect(() => {
    if (isLearning && !learningData && !isLoadingLearning) {
      setIsLearningLoading(true);
      Promise.all([
        enrollmentService.getStats(),
        enrollmentService.getMyCourses()
      ])
        .then(([stats, courses]) => setLearningData({ stats, courses }))
        .catch(err => console.error('Error loading learning data', err))
        .finally(() => setIsLearningLoading(false));
    }
  }, [isLearning, learningData, isLoadingLearning]);

  // Lazy-load feed when tab changes
  const loadFeed = useCallback(async (type) => {
    if (!user) return;
    setFeeds(prev => {
      if (prev[type].loaded) return prev;
      return prev;
    });

    const fetchers = {
      posts: () => postService.getUserPosts(user._id, 1),
      saved: () => postService.getSavedPosts(1),
      interested: () => postService.getInterestedPosts(1),
      notInterested: () => postService.getNotInterestedPosts(1),
      reposts: () => postService.getReposts(1)
    };

    try {
      const data = await fetchers[type]();
      setFeeds(prev => ({
        ...prev,
        [type]: { posts: data.posts, total: data.total, page: 1, hasMore: data.posts.length < data.total, loaded: true }
      }));
    } catch (err) {
      console.error(`Error loading ${type} feed`, err);
    }
  }, [user]);

  useEffect(() => {
    if (activeFeedKey && !feeds[activeFeedKey]?.loaded) {
      loadFeed(activeFeedKey);
    }
  }, [activeFeedKey, loadFeed]);

  // Real-time synchronization via Sockets
  useEffect(() => {
    if (!socket) return;

    const handlePostUpdate = (updatedPost) => {
      // Refresh stats if someone interacted with a post
      postService.getProfileStats().then(setProfileStats).catch(console.error);
      
      // Update local feed lists if necessary
      // For simplicity in this professional build, we'll just update the item within the lists
      setFeeds(prev => {
        const updateList = (list) => list.map(p => p._id === updatedPost._id ? { ...p, ...updatedPost } : p);
        return {
          posts: { ...prev.posts, posts: updateList(prev.posts.posts) },
          saved: { ...prev.saved, posts: updateList(prev.saved.posts) },
          interested: { ...prev.interested, posts: updateList(prev.interested.posts) },
          notInterested: { ...prev.notInterested, posts: updateList(prev.notInterested.posts) },
          reposts: { ...prev.reposts, posts: updateList(prev.reposts.posts) }
        };
      });
    };

    const handleNewPost = (newPost) => {
      // If it's my post, increment total and prepend to list
      if (newPost.userId._id === user?._id || newPost.userId === user?._id) {
        setProfileStats(prev => ({ ...prev, postsCount: prev.postsCount + 1 }));
        setFeeds(prev => ({
          ...prev,
          posts: { ...prev.posts, posts: [newPost, ...prev.posts.posts], total: prev.posts.total + 1 }
        }));
      }
    };

    const handlePostDelete = (deletedPostId) => {
      postService.getProfileStats().then(setProfileStats).catch(console.error);
      setFeeds(prev => {
        const filterList = (list) => list.filter(p => p._id !== deletedPostId);
        return {
          posts: { ...prev.posts, posts: filterList(prev.posts.posts), total: Math.max(0, prev.posts.total - 1) },
          saved: { ...prev.saved, posts: filterList(prev.saved.posts), total: Math.max(0, prev.saved.total - 1) },
          interested: { ...prev.interested, posts: filterList(prev.interested.posts), total: Math.max(0, prev.interested.total - 1) },
          notInterested: { ...prev.notInterested, posts: filterList(prev.notInterested.posts), total: Math.max(0, prev.notInterested.total - 1) },
          reposts: { ...prev.reposts, posts: filterList(prev.reposts.posts), total: Math.max(0, prev.reposts.total - 1) }
        };
      });
    };

    socket.on('post_updated', handlePostUpdate);
    socket.on('new_post', handleNewPost);
    socket.on('post_deleted', handlePostDelete);

    return () => {
      socket.off('post_updated', handlePostUpdate);
      socket.off('new_post', handleNewPost);
      socket.off('post_deleted', handlePostDelete);
    };
  }, [socket, user?._id]);

  const loadMore = async (type) => {
    if (isLoadingMore) return;
    const currentFeed = feeds[type];
    if (!currentFeed.hasMore) return;

    setIsLoadingMore(true);
    try {
      const nextPage = currentFeed.page + 1;
      let data;
      if (type === 'posts') data = await postService.getUserPosts(user._id, nextPage);
      else if (type === 'saved') data = await postService.getSavedPosts(nextPage);
      else if (type === 'interested') data = await postService.getInterestedPosts(nextPage);
      else if (type === 'notInterested') data = await postService.getNotInterestedPosts(nextPage);
      else if (type === 'reposts') data = await postService.getReposts(nextPage);

      setFeeds(prev => ({
        ...prev,
        [type]: {
          posts: [...prev[type].posts, ...data.posts.filter(p => !prev[type].posts.find(e => e._id === p._id))],
          total: data.total,
          page: nextPage,
          hasMore: prev[type].posts.length + data.posts.length < data.total
        }
      }));
    } catch (err) {
      console.error('Load more failed', err);
    } finally {
      setIsLoadingMore(false);
    }
  };

  if (isLoading) return (
    <div className="flex justify-center items-center py-20">
      <div className="w-8 h-8 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
    </div>
  );

  /* ── Reusable feed renderer ── */
  const renderFeed = (type, emptyMsg, EmptyIcon) => {
    const { posts, total, hasMore } = feeds[type];
    if (posts.length === 0) return (
      <div className="bg-white rounded-2xl p-12 text-center border border-slate-100 shadow-sm animate-fade-in">
        <div className="w-14 h-14 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
          <EmptyIcon className="w-7 h-7" />
        </div>
        <h3 className="text-base font-bold text-slate-800">{emptyMsg}</h3>
        <p className="text-slate-400 text-sm mt-1">Your activity here will appear in real-time ({total} total items).</p>
      </div>
    );
    return (
      <div className="space-y-4 animate-fade-in">
        {posts.map(post => <PostCard key={post._id} post={post} />)}
        {hasMore && (
          <button
            onClick={() => loadMore(type)}
            disabled={isLoadingMore}
            className="w-full py-3 text-xs font-bold text-slate-400 hover:text-indigo-600 transition-colors bg-white rounded-xl border border-slate-100 shadow-sm disabled:opacity-50"
          >
            {isLoadingMore ? 'Loading…' : 'Load more activity'}
          </button>
        )}
      </div>
    );
  };

  /* ═══════════════════════════════════
     OVERVIEW PAGE
  ═══════════════════════════════════ */
  if (isOverview) return (
    <div className="space-y-6 animate-fade-in">
      {/* ── Profile Header Card ─────────────────────────────────── */}
      {/* NOTE: outer card must NOT use overflow-hidden — the avatar
          needs to visually break out of the banner boundary. */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm relative">

        {/* Cover gradient — overflow-hidden only on this inner div */}
        <div className="h-36 rounded-t-2xl overflow-hidden bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 relative">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.08) 1px, transparent 0)',
              backgroundSize: '20px 20px',
            }}
          />
          {/* Edit button lives in the banner (top-right) */}
          <button
            onClick={() => setIsEditModalOpen(true)}
            className="absolute top-4 right-4 flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-white/15 hover:bg-white/25 border border-white/20 rounded-xl backdrop-blur-sm transition-all active:scale-95"
          >
            <Edit3 className="w-3.5 h-3.5" /> Edit Profile
          </button>
        </div>

        {/* Avatar — positioned to overlap banner / card boundary */}
        <div className="absolute left-6 top-[88px] z-10">
          <div className="w-24 h-24 rounded-2xl p-1 bg-white shadow-xl border border-slate-100">
            <div className="w-full h-full rounded-xl overflow-hidden bg-indigo-100 flex items-center justify-center">
              {getAvatarUrl(user) ? (
                <img
                  src={getAvatarUrl(user)}
                  alt={user?.name}
                  className="w-full h-full object-cover"
                  onError={e => { e.target.style.display = 'none'; }}
                />
              ) : (
                <span className="text-2xl font-black text-indigo-600">
                  {(user?.name || 'U').charAt(0).toUpperCase()}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Name + bio — padded left to clear the avatar */}
        <div className="pt-16 pb-5 px-6">
          {/* Spacer so text doesn't go under avatar */}
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
            <div className="pl-[104px] sm:pl-[104px]">
              <div className="flex items-center flex-wrap gap-2 mb-0.5">
                <h1 className="text-lg font-black text-slate-900 tracking-tight">{user?.name}</h1>
                <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-600 bg-indigo-50 border border-indigo-100 px-2.5 py-0.5 rounded-full">
                  {user?.experienceLevel || 'Skillful Member'}
                </span>
                {user?.isMentor && user?.mentorStatus === 'approved' && (
                  <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-600 bg-emerald-50 border border-emerald-100 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" /> Verified Mentor
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 font-medium">{user?.email}</p>
            </div>
          </div>
          <p className="text-sm text-slate-500 leading-relaxed mt-3">
            {user?.bio || <span className="italic text-slate-400">No bio yet — click "Edit Profile" to introduce yourself.</span>}
          </p>
        </div>
      </div>

      {/* Real-Time Stat Cards Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Saved',     val: profileStats.savedCount,     bg: 'bg-indigo-50',  text: 'text-indigo-600',  Icon: Bookmark },
          { label: 'Interested',val: profileStats.interestedCount,bg: 'bg-amber-50',   text: 'text-amber-600',   Icon: Trophy   },
          { label: 'Reposts',   val: profileStats.repostsCount,    bg: 'bg-emerald-50', text: 'text-emerald-600', Icon: Share2   },
          { label: 'Posts',     val: profileStats.postsCount,      bg: 'bg-rose-50',    text: 'text-rose-500',    Icon: FileText },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex flex-col items-center text-center group hover:border-slate-200 transition-colors">
            <div className={`w-10 h-10 rounded-xl ${s.bg} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
              <s.Icon className={`w-5 h-5 ${s.text}`} />
            </div>
            <p className="text-2xl font-black text-slate-900">{s.val}</p>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Details + Skills */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest pb-3 border-b border-slate-50">Identity & Contact</h3>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-slate-50 flex items-center justify-center shrink-0"><Mail className="w-4 h-4 text-slate-400" /></div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">SkillVerse ID</p>
              <p className="text-sm font-bold text-slate-800 break-all">{user?.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-slate-50 flex items-center justify-center shrink-0"><Calendar className="w-4 h-4 text-slate-400" /></div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Active Member Since</p>
              <p className="text-sm font-bold text-slate-800">{new Date(user?.createdAt).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}</p>
            </div>
          </div>
          {user?.socialLinks && Object.values(user.socialLinks).some(Boolean) && (
            <div className="pt-3 border-t border-slate-50">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">External Portfolios</p>
              <div className="flex gap-2">
                {user.socialLinks.github && <a href={`https://github.com/${user.socialLinks.github}`} target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-xl bg-slate-50 hover:bg-slate-900 hover:text-white flex items-center justify-center text-slate-500 transition-all"><Github className="w-4 h-4" /></a>}
                {user.socialLinks.linkedin && <a href={user.socialLinks.linkedin} target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-xl bg-slate-50 hover:bg-blue-600 hover:text-white flex items-center justify-center text-slate-500 transition-all"><Linkedin className="w-4 h-4" /></a>}
                {user.socialLinks.twitter && <a href={`https://twitter.com/${user.socialLinks.twitter}`} target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-xl bg-slate-50 hover:bg-black hover:text-white flex items-center justify-center text-slate-500 transition-all"><Twitter className="w-4 h-4" /></a>}
              </div>
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-6">
          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest pb-3 border-b border-slate-50 flex items-center gap-2 mb-4">
              <Briefcase className="w-4 h-4 text-emerald-500" /> Expertise
            </h3>
            <div className="flex flex-wrap gap-2">
              {user?.skills?.length > 0 ? user.skills.map(s => (
                <span key={s} className="px-3 py-1.5 bg-slate-50 text-slate-700 rounded-lg text-xs font-bold border border-slate-100">{s}</span>
              )) : <p className="text-slate-400 text-xs italic">No expertise areas listed yet.</p>}
            </div>
          </div>
          <div className="border-t border-slate-50 pt-5">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-4">
              <Award className="w-4 h-4 text-amber-500" /> Current Focus
            </h3>
            <div className="flex flex-wrap gap-2">
              {user?.learningGoals?.length > 0 ? user.learningGoals.map(g => (
                <span key={g} className="px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-lg text-xs font-bold border border-indigo-100">{g}</span>
              )) : <p className="text-slate-400 text-xs italic">No learning goals defined.</p>}
            </div>
          </div>
        </div>
      </div>


            <EditProfileModal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} onUpdate={updateUser} />
    </div>
  );

  /* ═══════════════════════════════════
     DYNAMIC FEED VIEWS
  ═══════════════════════════════════ */
  const sectionMeta = {
    posts:            { label: 'Your Published Works',  Icon: FileText,    color: 'text-indigo-500',  type: 'posts' },
    saved:            { label: 'Your Library',          Icon: Bookmark,    color: 'text-emerald-500', type: 'saved' },
    interested:       { label: 'Career Interests',      Icon: Trophy,      color: 'text-amber-500',   type: 'interested' },
    'not-interested': { label: 'Filtered Content',      Icon: ShieldOff,   color: 'text-rose-500',    type: 'notInterested' },
    learning:         { label: 'Learning Progress',     Icon: BarChart3,   color: 'text-teal-500',    type: null },
    'mentor-activity':{ label: 'Mentor Activity',       Icon: Users,       color: 'text-violet-500',  type: null },
    'exchange-activity':{ label: 'Exchange Activity',    Icon: RefreshCw,   color: 'text-orange-500',  type: null },
    reposts:          { label: 'Your Shares',           Icon: Share2,      color: 'text-pink-500',    type: 'reposts' },
  }[path] || { label: 'Activity Hub', Icon: Star, color: 'text-slate-500', type: 'posts' };

  return (
    <div className="space-y-6 animate-fade-in max-w-3xl mx-auto w-full">
      <div className="flex items-center gap-3 pb-2">
        <div className="w-10 h-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center shrink-0 shadow-sm">
          <sectionMeta.Icon className={`w-5 h-5 ${sectionMeta.color}`} />
        </div>
        <div>
          <h2 className="text-lg font-black text-slate-900 tracking-tight">{sectionMeta.label}</h2>
          <p className="text-xs text-slate-400 font-medium">
            {sectionMeta.type
              ? `Real-time sync enabled (${feeds[sectionMeta.type].total} results)`
              : 'Your activity dashboard'}
          </p>
        </div>
      </div>

      {isPosts         && renderFeed('posts',        'You haven\'t posted anything yet.', FileText )}
      {isSaved         && renderFeed('saved',        'Your library is currently empty.',   Bookmark )}
      {isInterested    && renderFeed('interested',   'No interested opportunities found.', Trophy   )}
      {isNotInterested && renderFeed('notInterested','Clean dashboard! No ignored posts.', ShieldOff)}
      {isReposts       && renderFeed('reposts',      'Sharing is caring. Repost some content!', Share2   )}

      {/* ═══ EXCHANGE ACTIVITY ═══ */}
      {isExchangeActivity && (
        <div className="space-y-5 animate-fade-in">
          {isLoadingExchange ? (
            <div className="flex justify-center items-center py-20">
              <div className="w-8 h-8 border-4 border-orange-100 border-t-orange-600 rounded-full animate-spin"></div>
            </div>
          ) : exchangeData ? (
            <>
              {/* Stats Row */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: 'Total', val: exchangeData.stats?.total || 0, bg: 'bg-orange-50', text: 'text-orange-600', Icon: ArrowLeftRight },
                  { label: 'Pending', val: exchangeData.stats?.pending || 0, bg: 'bg-amber-50', text: 'text-amber-600', Icon: Clock },
                  { label: 'Active', val: exchangeData.stats?.active || 0, bg: 'bg-emerald-50', text: 'text-emerald-600', Icon: CheckCircle2 },
                  { label: 'Completed', val: exchangeData.stats?.completed || 0, bg: 'bg-indigo-50', text: 'text-indigo-600', Icon: Trophy },
                ].map(s => (
                  <div key={s.label} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex items-center gap-4 group hover:border-slate-200 transition-colors">
                    <div className={`w-11 h-11 rounded-xl ${s.bg} flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform`}>
                      <s.Icon className={`w-5 h-5 ${s.text}`} />
                    </div>
                    <div>
                      <p className="text-2xl font-black text-slate-900">{s.val}</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{s.label}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Exchange Activity List */}
              {exchangeData.activities?.length > 0 ? (
                <div className="space-y-3">
                  {exchangeData.activities.map(activity => (
                    <div key={activity._id} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 hover:shadow-md transition-shadow">
                      <div className="flex items-center gap-4">
                        <div className="w-11 h-11 rounded-xl bg-orange-50 flex items-center justify-center shrink-0">
                          <ArrowLeftRight className="w-5 h-5 text-orange-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-bold text-slate-900">
                              {activity.isRequester ? 'Sent to' : 'Received from'} {activity.partner?.name}
                            </span>
                            <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full ${activity.status === "completed" ? "text-emerald-600 bg-emerald-50" : activity.status === "accepted" ? "text-indigo-600 bg-indigo-50" : activity.status === "pending" ? "text-amber-600 bg-amber-50" : "text-rose-600 bg-rose-50"}`}>{activity.status}</span>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-slate-500">
                            <span className="font-semibold text-indigo-600">{activity.offeredSkill}</span>
                            <span>↔</span>
                            <span className="font-semibold text-orange-600">{activity.requestedSkill}</span>
                          </div>
                          <p className="text-[10px] text-slate-400 mt-1">{new Date(activity.createdAt).toLocaleDateString()}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-white rounded-2xl p-12 text-center border border-slate-100 shadow-sm">
                  <div className="w-16 h-16 bg-orange-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <ArrowLeftRight className="w-8 h-8 text-orange-500" />
                  </div>
                  <h3 className="text-base font-bold text-slate-800 mb-1">No Exchange Activity Yet</h3>
                  <p className="text-slate-400 text-sm max-w-md mx-auto">Start exchanging skills with other members. Your exchange history will appear here.</p>
                </div>
              )}
            </>
          ) : null}
        </div>
      )}


      {/* ═══ LEARNING PROGRESS ═══ */}
      {isLearning && (
        <div className="space-y-5 animate-fade-in">
          {/* Stats Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { label: 'Courses Enrolled', val: learningData?.stats?.enrolled || 0, Icon: GraduationCap, bg: 'bg-teal-50', text: 'text-teal-600' },
              { label: 'Hours Invested',   val: learningData?.stats?.hours || 0, Icon: Clock,         bg: 'bg-indigo-50', text: 'text-indigo-600' },
              { label: 'Completed',        val: learningData?.stats?.completed || 0, Icon: CheckCircle2,  bg: 'bg-emerald-50', text: 'text-emerald-600' },
            ].map(s => (
              <div key={s.label} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex items-center gap-4 group hover:border-slate-200 transition-colors">
                <div className={`w-11 h-11 rounded-xl ${s.bg} flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform`}>
                  <s.Icon className={`w-5 h-5 ${s.text}`} />
                </div>
                <div>
                  <p className="text-2xl font-black text-slate-900">{s.val}</p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{s.label}</p>
                </div>
              </div>
            ))}
          </div>

          {isLoadingLearning ? (
            <div className="flex justify-center items-center py-20">
              <div className="w-8 h-8 border-4 border-teal-100 border-t-teal-600 rounded-full animate-spin"></div>
            </div>
          ) : learningData?.courses?.length > 0 ? (
            <div className="space-y-3">
              {learningData.courses.map(enrollment => (
                <div key={enrollment._id} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-4">
                    <div className="w-11 h-11 rounded-xl bg-teal-50 flex items-center justify-center shrink-0">
                      <BookOpen className="w-5 h-5 text-teal-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-bold text-slate-900 truncate">{enrollment.course?.title || 'Untitled Course'}</h4>
                      <div className="flex items-center gap-3 mt-1">
                        {enrollment.course?.category && (
                          <span className="text-[10px] font-bold text-teal-600 bg-teal-50 px-2 py-0.5 rounded border border-teal-100">{enrollment.course.category}</span>
                        )}
                        <span className="text-[10px] text-slate-400">{enrollment.progress || 0}% complete</span>
                      </div>
                      <div className="mt-2 w-full bg-slate-100 rounded-full h-1.5">
                        <div className="bg-teal-500 h-1.5 rounded-full transition-all" style={{ width: (enrollment.progress || 0) + "%" }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-2xl p-12 text-center border border-slate-100 shadow-sm">
              <div className="w-16 h-16 bg-teal-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="w-8 h-8 text-teal-500" />
            </div>
            <h3 className="text-base font-bold text-slate-800 mb-1">Start Your Learning Journey</h3>
            <p className="text-slate-400 text-sm max-w-md mx-auto">Enroll in courses, track your progress, and build skills that matter. Your learning milestones will appear here.</p>
            <button
              onClick={() => navigate('/learn/explore')}
              className="mt-5 px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white text-sm font-bold rounded-xl transition-colors shadow-sm"
            >
              Explore Courses
            </button>
          </div>
          )}
        </div>
      )}

      {/* ═══ MENTOR ACTIVITY ═══ */}
      {isMentorActivity && (
        <div className="space-y-5 animate-fade-in">
          {/* Stats Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { label: 'Active Mentees', val: '0', Icon: Users,        bg: 'bg-violet-50', text: 'text-violet-600' },
              { label: 'Sessions Done',  val: '0', Icon: CheckCircle2, bg: 'bg-indigo-50', text: 'text-indigo-600' },
              { label: 'Avg Rating',     val: '-', Icon: Star,         bg: 'bg-amber-50',  text: 'text-amber-600' },
            ].map(s => (
              <div key={s.label} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex items-center gap-4 group hover:border-slate-200 transition-colors">
                <div className={`w-11 h-11 rounded-xl ${s.bg} flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform`}>
                  <s.Icon className={`w-5 h-5 ${s.text}`} />
                </div>
                <div>
                  <p className="text-2xl font-black text-slate-900">{s.val}</p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{s.label}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Empty State */}
          <div className="bg-white rounded-2xl p-12 text-center border border-slate-100 shadow-sm">
            <div className="w-16 h-16 bg-violet-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-violet-500" />
            </div>
            <h3 className="text-base font-bold text-slate-800 mb-1">Become a Mentor</h3>
            <p className="text-slate-400 text-sm max-w-md mx-auto">Share your expertise, guide learners, and grow your professional network. Your mentoring activity will be tracked here.</p>
            <button
              onClick={() => navigate('/learn/become-mentor')}
              className="mt-5 px-5 py-2.5 bg-violet-600 hover:bg-violet-700 text-white text-sm font-bold rounded-xl transition-colors shadow-sm"
            >
              Apply as Mentor
            </button>
          </div>
        </div>
      )}

      <EditProfileModal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} onUpdate={updateUser} />
    </div>
  );
};

export default ProfilePage;
