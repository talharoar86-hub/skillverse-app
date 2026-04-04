import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Navigate, useLocation, Link, useNavigate } from 'react-router-dom';
import { postService, followService, messageService } from '../services/api';
import { profileService } from '../services/api';
import {
  Github, Linkedin, Twitter, Briefcase, Award, FileText,
  MessageSquare, UserPlus, UserCheck, GraduationCap, Users, Star, Clock,
  Trophy, BookOpen, Calendar, Send, Zap, BarChart3, CheckCircle2,
  Heart, UserMinus, ArrowLeftRight, ShieldCheck
} from 'lucide-react';
import PostCard from '../components/PostCard';
import { getAvatarUrl } from '../utils/avatar';
import { useSocket } from '../context/SocketContext';

const TABS = [
  { key: 'overview', label: 'Overview', Icon: Briefcase },
  { key: 'posts', label: 'Posts', Icon: FileText },
  { key: 'skills', label: 'Skills', Icon: Award },
  { key: 'mentor', label: 'Mentor Profile', Icon: GraduationCap },
  { key: 'exchange', label: 'Exchange Activity', Icon: ArrowLeftRight },
  { key: 'followers', label: 'Followers', Icon: Users },
  { key: 'following', label: 'Following', Icon: UserCheck },
];

const PublicProfilePage = () => {
  const { userId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const socket = useSocket();

  const path = location.pathname.split('/').pop();
  const activeTab = path === 'overview' || path === 'posts' || path === 'skills' || path === 'mentor' || path === 'exchange' || path === 'followers' || path === 'following' ? path : 'overview';

  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Posts state
  const [posts, setPosts] = useState([]);
  const [postsTotal, setPostsTotal] = useState(0);
  const [postsPage, setPostsPage] = useState(1);
  const [isLoadingPosts, setIsLoadingPosts] = useState(false);
  const [postsLoaded, setPostsLoaded] = useState(false);

  // Follow state
  const [followStatus, setFollowStatus] = useState('none');
  const [followersList, setFollowersList] = useState([]);
  const [followingList, setFollowingList] = useState([]);
  const [followersLoaded, setFollowersLoaded] = useState(false);
  const [followingLoaded, setFollowingLoaded] = useState(false);

  // Fetch public profile
  useEffect(() => {
    const fetchProfile = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await profileService.getPublicProfile(userId);
        setProfile(data);
      } catch (err) {
        if (err.response?.status === 404) {
          setError('User not found');
        } else {
          setError('Failed to load profile');
        }
      } finally {
        setIsLoading(false);
      }
    };
    fetchProfile();
  }, [userId]);

  // Fetch follow status
  useEffect(() => {
    const fetchFollowStatus = async () => {
      try {
        const data = await followService.getStatus(userId);
        setFollowStatus(data.status);
      } catch (err) {
        console.error('Failed to fetch follow status', err);
      }
    };
    fetchFollowStatus();
  }, [userId]);

  // Socket listeners for follow status updates

  // Load posts when posts tab is first activated
  const loadPosts = useCallback(async (page = 1) => {
    if (isLoadingPosts) return;
    setIsLoadingPosts(true);
    try {
      const data = await postService.getUserPosts(userId, page);
      if (page === 1) {
        setPosts(data.posts);
      } else {
        setPosts(prev => [...prev, ...data.posts.filter(p => !prev.find(e => e._id === p._id))]);
      }
      setPostsTotal(data.total);
      setPostsPage(page);
      setPostsLoaded(true);
    } catch (err) {
      console.error('Error loading posts', err);
    } finally {
      setIsLoadingPosts(false);
    }
  }, [userId, isLoadingPosts]);

  useEffect(() => {
    if (activeTab === 'posts' && !postsLoaded) {
      loadPosts(1);
    }
  }, [activeTab, postsLoaded, loadPosts]);

  // Load followers/following when tabs are first activated
  useEffect(() => {
    if (activeTab === 'followers' && !followersLoaded) {
      const loadFollowers = async () => {
        try {
          const data = await followService.getUserFollowers(userId);
          setFollowersList(data);
          setFollowersLoaded(true);
        } catch (err) {
          console.error('Failed to load followers', err);
        }
      };
      loadFollowers();
    }
    if (activeTab === 'following' && !followingLoaded) {
      const loadFollowing = async () => {
        try {
          const data = await followService.getUserFollowing(userId);
          setFollowingList(data);
          setFollowingLoaded(true);
        } catch (err) {
          console.error('Failed to load following', err);
        }
      };
      loadFollowing();
    }
  }, [activeTab, followersLoaded, followingLoaded, userId]);

  // Action handlers
  const handleFollow = async () => {
    try {
      await followService.sendFollow(userId);
      setFollowStatus('pending');
    } catch (err) {
      console.error('Failed to send follow request', err);
    }
  };

  const handleUnfollow = async () => {
    try {
      await followService.unfollow(userId);
      setFollowStatus('none');
    } catch (err) {
      console.error('Failed to unfollow', err);
    }
  };

  const handleMessage = async () => {
    if (!userId) { console.error('User ID is missing'); return; }
    try {
      const conversation = await messageService.createConversation(userId);
      navigate(`/messages/${conversation._id || conversation.conversationId}`);
    } catch (err) {
      console.error('Failed to create conversation', err);
    }
  };

  // Socket listeners for real-time post updates
  useEffect(() => {
    if (!socket || activeTab !== 'posts') return;

    const handlePostUpdate = (updatedPost) => {
      setPosts(prev => prev.map(p => p._id === updatedPost._id ? { ...p, ...updatedPost } : p));
    };

    const handleNewPost = (newPost) => {
      const authorId = typeof newPost.userId === 'object' ? newPost.userId._id : newPost.userId;
      if (authorId === userId) {
        setPosts(prev => [newPost, ...prev]);
        setPostsTotal(prev => prev + 1);
      }
    };

    const handlePostDelete = (deletedPostId) => {
      setPosts(prev => prev.filter(p => p._id !== deletedPostId));
      setPostsTotal(prev => Math.max(0, prev - 1));
    };

    socket.on('post_updated', handlePostUpdate);
    socket.on('new_post', handleNewPost);
    socket.on('post_deleted', handlePostDelete);

    return () => {
      socket.off('post_updated', handlePostUpdate);
      socket.off('new_post', handleNewPost);
      socket.off('post_deleted', handlePostDelete);
    };
  }, [socket, activeTab, userId]);

  // Socket listeners for follow updates
  useEffect(() => {
    if (!socket) return;

    const handleFollowAccepted = (data) => {
      if (data.acceptedBy === userId) {
        setFollowStatus('accepted');
      }
    };

    const handleFollowRejected = (data) => {
      if (data.rejectedBy === userId) {
        setFollowStatus('none');
      }
    };

    const handleUnfollowed = (data) => {
      if (data.unfollowedBy === userId) {
        setFollowStatus('none');
      }
    };

    socket.on('follow_accepted', handleFollowAccepted);
    socket.on('follow_rejected', handleFollowRejected);
    socket.on('unfollowed', handleUnfollowed);

    return () => {
      socket.off('follow_accepted', handleFollowAccepted);
      socket.off('follow_rejected', handleFollowRejected);
      socket.off('unfollowed', handleUnfollowed);
    };
  }, [socket, userId]);

  // Load followers/following when tabs are activated

  // Redirect owner to their own profile
  if (profile?.isOwner) {
    return <Navigate to="/profile/overview" replace />;
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="w-8 h-8 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-2xl p-12 text-center border border-slate-100 shadow-sm animate-fade-in">
        <div className="w-14 h-14 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-4">
          <Users className="w-7 h-7 text-rose-400" />
        </div>
        <h3 className="text-base font-bold text-slate-800">{error}</h3>
        <p className="text-slate-400 text-sm mt-1">The profile you're looking for doesn't exist or is unavailable.</p>
        <Link to="/" className="inline-block mt-4 px-5 py-2.5 bg-indigo-600 text-white text-sm font-bold rounded-xl hover:bg-indigo-700 transition-colors">
          Go Home
        </Link>
      </div>
    );
  }

  const hasMorePosts = posts.length < postsTotal;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* ── Profile Header Card ── */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm relative">
        {/* Cover gradient */}
        <div className="h-36 rounded-t-2xl overflow-hidden bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 relative">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.08) 1px, transparent 0)',
              backgroundSize: '20px 20px',
            }}
          />
        </div>

        {/* Avatar */}
        <div className="absolute left-6 top-[88px] z-10">
          <div className="w-24 h-24 rounded-2xl p-1 bg-white shadow-xl border border-slate-100">
            <div className="w-full h-full rounded-xl overflow-hidden bg-indigo-100 flex items-center justify-center">
              {getAvatarUrl(profile) ? (
                <img
                  src={getAvatarUrl(profile)}
                  alt={profile.name}
                  className="w-full h-full object-cover"
                  onError={e => { e.target.style.display = 'none'; }}
                />
              ) : (
                <span className="text-2xl font-black text-indigo-600">
                  {(profile.name || 'U').charAt(0).toUpperCase()}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Name + bio */}
        <div className="pt-16 pb-5 px-6">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
            <div className="pl-[104px] sm:pl-[104px]">
              <div className="flex items-center flex-wrap gap-2 mb-0.5">
                <h1 className="text-lg font-black text-slate-900 tracking-tight">{profile.name}</h1>
                <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-600 bg-indigo-50 border border-indigo-100 px-2.5 py-0.5 rounded-full">
                  {profile.experienceLevel || 'Member'}
                </span>
                {profile.isMentor && (
                  <span className="text-[10px] font-bold uppercase tracking-widest text-violet-600 bg-violet-50 border border-violet-100 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" /> Verified Mentor
                  </span>
                )}
              </div>
            </div>
          </div>
          <p className="text-sm text-slate-500 leading-relaxed mt-3">
            {profile.bio || <span className="italic text-slate-400">This user hasn't added a bio yet.</span>}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="px-6 pb-5 pl-[104px] flex flex-wrap gap-2">
          <button
            onClick={handleMessage}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-all active:scale-95 shadow-sm shadow-indigo-200"
          >
            <MessageSquare className="w-3.5 h-3.5" /> Message
          </button>
          {followStatus === 'none' && (
            <button
              onClick={handleFollow}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 border border-indigo-100 rounded-xl transition-all active:scale-95"
            >
              <UserPlus className="w-3.5 h-3.5" /> Follow
            </button>
          )}
          {followStatus === 'pending' && (
            <button
              disabled
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-amber-600 bg-amber-50 border border-amber-100 rounded-xl cursor-not-allowed"
            >
              <Clock className="w-3.5 h-3.5" /> Pending
            </button>
          )}
          {followStatus === 'accepted' && (
            <button
              onClick={handleUnfollow}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-emerald-600 bg-emerald-50 hover:bg-emerald-100 border border-emerald-100 rounded-xl transition-all active:scale-95"
            >
              <UserCheck className="w-3.5 h-3.5" /> Following
            </button>
          )}
          {profile.isMentor && (
            <button
              onClick={() => navigate(`/user/${userId}/mentor`)}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-violet-600 hover:bg-violet-700 rounded-xl transition-all active:scale-95 shadow-sm shadow-violet-200"
            >
              <Zap className="w-3.5 h-3.5" /> Connect with Mentor
            </button>
          )}
        </div>
      </div>

      {/* ── Tab Bar ── */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-1.5 overflow-x-auto">
        <div className="flex gap-1 whitespace-nowrap">
          {TABS.map(tab => {
            if (tab.key === 'mentor' && profile.goal !== 'Mentor') return null;
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => navigate(`/user/${userId}/${tab.key}`)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-200'
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
                }`}
              >
                <tab.Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Tab Content ── */}

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-4 animate-fade-in">
          {/* Stats Row */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex flex-col items-center text-center group hover:border-slate-200 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <FileText className="w-5 h-5 text-indigo-600" />
              </div>
              <p className="text-2xl font-black text-slate-900">{profile.postsCount}</p>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Posts</p>
            </div>
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex flex-col items-center text-center group hover:border-slate-200 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-violet-50 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <Calendar className="w-5 h-5 text-violet-600" />
              </div>
              <p className="text-2xl font-black text-slate-900">{new Date(profile.createdAt).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}</p>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Joined</p>
            </div>
          </div>

          {/* Skills + Goals */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-6">
              <div>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest pb-3 border-b border-slate-50 flex items-center gap-2 mb-4">
                  <Briefcase className="w-4 h-4 text-emerald-500" /> Expertise
                </h3>
                <div className="flex flex-wrap gap-2">
                  {profile.skills?.length > 0 ? profile.skills.map(s => (
                    <span key={s} className="px-3 py-1.5 bg-slate-50 text-slate-700 rounded-lg text-xs font-bold border border-slate-100">{s}</span>
                  )) : <p className="text-slate-400 text-xs italic">No expertise areas listed yet.</p>}
                </div>
              </div>
              <div className="border-t border-slate-50 pt-5">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-4">
                  <Award className="w-4 h-4 text-amber-500" /> Current Focus
                </h3>
                <div className="flex flex-wrap gap-2">
                  {profile.learningGoals?.length > 0 ? profile.learningGoals.map(g => (
                    <span key={g} className="px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-lg text-xs font-bold border border-indigo-100">{g}</span>
                  )) : <p className="text-slate-400 text-xs italic">No learning goals defined.</p>}
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest pb-3 border-b border-slate-50">Details & Links</h3>

              {profile.goal && (
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-slate-50 flex items-center justify-center shrink-0">
                    <Star className="w-4 h-4 text-slate-400" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Goal</p>
                    <p className="text-sm font-bold text-slate-800">{profile.goal}</p>
                  </div>
                </div>
              )}

              {profile.availability && (
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-slate-50 flex items-center justify-center shrink-0">
                    <Clock className="w-4 h-4 text-slate-400" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Availability</p>
                    <p className="text-sm font-bold text-slate-800">{profile.availability}</p>
                  </div>
                </div>
              )}

              {profile.socialLinks && Object.values(profile.socialLinks).some(Boolean) && (
                <div className="pt-3 border-t border-slate-50">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">External Portfolios</p>
                  <div className="flex gap-2">
                    {profile.socialLinks.github && <a href={`https://github.com/${profile.socialLinks.github}`} target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-xl bg-slate-50 hover:bg-slate-900 hover:text-white flex items-center justify-center text-slate-500 transition-all"><Github className="w-4 h-4" /></a>}
                    {profile.socialLinks.linkedin && <a href={profile.socialLinks.linkedin} target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-xl bg-slate-50 hover:bg-blue-600 hover:text-white flex items-center justify-center text-slate-500 transition-all"><Linkedin className="w-4 h-4" /></a>}
                    {profile.socialLinks.twitter && <a href={`https://twitter.com/${profile.socialLinks.twitter}`} target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-xl bg-slate-50 hover:bg-black hover:text-white flex items-center justify-center text-slate-500 transition-all"><Twitter className="w-4 h-4" /></a>}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Posts Tab */}
      {activeTab === 'posts' && (
        <div className="space-y-4 animate-fade-in">
          {!postsLoaded && isLoadingPosts ? (
            <div className="flex justify-center items-center py-20">
              <div className="w-8 h-8 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
            </div>
          ) : posts.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center border border-slate-100 shadow-sm">
              <div className="w-14 h-14 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
                <FileText className="w-7 h-7" />
              </div>
              <h3 className="text-base font-bold text-slate-800">No posts yet</h3>
              <p className="text-slate-400 text-sm mt-1">This user hasn't published any content yet.</p>
            </div>
          ) : (
            <>
              {posts.map(post => (
                <PostCard key={post._id} post={post} />
              ))}
              {hasMorePosts && (
                <button
                  onClick={() => loadPosts(postsPage + 1)}
                  disabled={isLoadingPosts}
                  className="w-full py-3 text-xs font-bold text-slate-400 hover:text-indigo-600 transition-colors bg-white rounded-xl border border-slate-100 shadow-sm disabled:opacity-50"
                >
                  {isLoadingPosts ? 'Loading...' : 'Load more posts'}
                </button>
              )}
            </>
          )}
        </div>
      )}

      {/* Skills Tab */}
      {activeTab === 'skills' && (
        <div className="space-y-4 animate-fade-in">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-6">
              <div>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest pb-3 border-b border-slate-50 flex items-center gap-2 mb-4">
                  <Briefcase className="w-4 h-4 text-emerald-500" /> Expertise
                </h3>
                <div className="flex flex-wrap gap-2">
                  {profile.skills?.length > 0 ? profile.skills.map(s => (
                    <span key={s} className="px-3 py-1.5 bg-slate-50 text-slate-700 rounded-lg text-xs font-bold border border-slate-100">{s}</span>
                  )) : <p className="text-slate-400 text-xs italic">No expertise areas listed yet.</p>}
                </div>
              </div>
              <div className="border-t border-slate-50 pt-5">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-4">
                  <Award className="w-4 h-4 text-amber-500" /> Current Focus
                </h3>
                <div className="flex flex-wrap gap-2">
                  {profile.learningGoals?.length > 0 ? profile.learningGoals.map(g => (
                    <span key={g} className="px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-lg text-xs font-bold border border-indigo-100">{g}</span>
                  )) : <p className="text-slate-400 text-xs italic">No learning goals defined.</p>}
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest pb-3 border-b border-slate-50">Additional Info</h3>
              {profile.goal && (
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-slate-50 flex items-center justify-center shrink-0">
                    <Star className="w-4 h-4 text-slate-400" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Goal</p>
                    <p className="text-sm font-bold text-slate-800">{profile.goal}</p>
                  </div>
                </div>
              )}
              {profile.availability && (
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-slate-50 flex items-center justify-center shrink-0">
                    <Clock className="w-4 h-4 text-slate-400" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Availability</p>
                    <p className="text-sm font-bold text-slate-800">{profile.availability}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Mentor Profile Tab */}
      {activeTab === 'mentor' && profile.isMentor && (
        <div className="space-y-4 animate-fade-in">
            <>
              {/* Mentor Profile Card */}
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-6">
                {/* Mentor Header */}
                <div className="flex items-center justify-between pb-4 border-b border-slate-50">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-violet-50 flex items-center justify-center">
                      <GraduationCap className="w-5 h-5 text-violet-600" />
                    </div>
                    <div>
                      <h3 className="text-base font-black text-slate-900 tracking-tight">Mentor Profile</h3>
                      <p className="text-xs text-slate-400 font-medium">Expertise and mentoring details</p>
                    </div>
                  </div>
                  {profile.mentorProfile?.available && (
                    <span className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-100">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Available
                    </span>
                  )}
                  {profile.isMentor && (
                    <span className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-xl border border-indigo-100">
                      <ShieldCheck className="w-3.5 h-3.5" /> Verified
                    </span>
                  )}
                </div>

                {/* Mentor Stats */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-slate-50 rounded-xl p-4 text-center group hover:bg-amber-50 transition-colors">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <Star className="w-4 h-4 text-amber-500 fill-amber-500 group-hover:scale-110 transition-transform" />
                      <span className="text-lg font-black text-slate-900">{profile.mentorProfile?.rating || '5.0'}</span>
                    </div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Rating</p>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-4 text-center group hover:bg-indigo-50 transition-colors">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <Clock className="w-4 h-4 text-indigo-500 group-hover:scale-110 transition-transform" />
                      <span className="text-lg font-black text-slate-900">{profile.mentorProfile?.experienceYears || '-'}yr</span>
                    </div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Experience</p>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-4 text-center group hover:bg-violet-50 transition-colors">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <Users className="w-4 h-4 text-violet-500 group-hover:scale-110 transition-transform" />
                      <span className="text-lg font-black text-slate-900">{profile.mentorActivity?.totalStudents || 0}</span>
                    </div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Students</p>
                  </div>
                </div>

                {/* Mentor Bio */}
                {profile.mentorProfile?.bio && (
                  <div>
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">About as Mentor</h4>
                    <p className="text-sm text-slate-700 leading-relaxed">{profile.mentorProfile.bio}</p>
                  </div>
                )}

                {/* Expertise Areas */}
                {profile.mentorProfile?.expertise?.length > 0 && (
                  <div>
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Expertise Areas</h4>
                    <div className="flex flex-wrap gap-2">
                      {profile.mentorProfile.expertise.map(e => (
                        <span key={e} className="px-3 py-1.5 bg-violet-50 text-violet-700 rounded-lg text-xs font-bold border border-violet-100">{e}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Mentor Activity Section */}
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-5">
                <div className="flex items-center gap-3 pb-4 border-b border-slate-50">
                  <div className="w-11 h-11 rounded-xl bg-indigo-50 flex items-center justify-center">
                    <BarChart3 className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-900 tracking-tight">Mentor Activity</h3>
                    <p className="text-xs text-slate-400 font-medium">Teaching performance and engagement</p>
                  </div>
                </div>

                {/* Activity Stats Row */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="border border-slate-100 rounded-xl p-4 text-center">
                    <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center mx-auto mb-2">
                      <BookOpen className="w-4 h-4 text-emerald-600" />
                    </div>
                    <p className="text-xl font-black text-slate-900">{profile.mentorActivity?.totalCourses || 0}</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Courses</p>
                  </div>
                  <div className="border border-slate-100 rounded-xl p-4 text-center">
                    <div className="w-9 h-9 rounded-xl bg-violet-50 flex items-center justify-center mx-auto mb-2">
                      <Users className="w-4 h-4 text-violet-600" />
                    </div>
                    <p className="text-xl font-black text-slate-900">{profile.mentorActivity?.totalStudents || 0}</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Students</p>
                  </div>
                  <div className="border border-slate-100 rounded-xl p-4 text-center">
                    <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center mx-auto mb-2">
                      <Trophy className="w-4 h-4 text-amber-600" />
                    </div>
                    <p className="text-xl font-black text-slate-900">{profile.mentorActivity?.totalSessions || 0}</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Sessions</p>
                  </div>
                </div>

                {/* Courses List */}
                {profile.mentorCourses?.length > 0 && (
                  <div>
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Courses Offered</h4>
                    <div className="space-y-3">
                      {profile.mentorCourses.map(course => (
                        <div key={course._id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl hover:bg-indigo-50 transition-colors group cursor-pointer">
                          <div className="w-10 h-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center shrink-0 group-hover:border-indigo-200 transition-colors">
                            <BookOpen className="w-4 h-4 text-indigo-500" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h5 className="text-sm font-bold text-slate-800 truncate group-hover:text-indigo-600 transition-colors">{course.title}</h5>
                            <div className="flex items-center gap-3 mt-0.5">
                              {course.category && (
                                <span className="text-[10px] font-bold text-indigo-600 bg-white px-2 py-0.5 rounded border border-indigo-100">{course.category}</span>
                              )}
                              <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                                <Users className="w-3 h-3" /> {course.studentsCount || 0} students
                              </span>
                            </div>
                          </div>
                          {course.rating > 0 && (
                            <div className="flex items-center gap-1 shrink-0">
                              <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                              <span className="text-xs font-black text-slate-800">{course.rating}</span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Empty state for no courses */}
                {(!profile.mentorCourses || profile.mentorCourses.length === 0) && (
                  <div className="text-center py-6 border border-dashed border-slate-200 rounded-xl">
                    <BookOpen className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="text-xs font-bold text-slate-400">No courses published yet</p>
                  </div>
                )}
              </div>

              {/* Mentor Connection CTA */}
              <div className="bg-gradient-to-br from-violet-600 to-indigo-700 rounded-2xl p-6 text-white relative overflow-hidden shadow-lg shadow-violet-200">
                <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-2">
                    <Zap className="w-4 h-4 text-violet-200" />
                    <span className="text-[10px] font-black uppercase tracking-widest opacity-80">Mentor Connection</span>
                  </div>
                  <h4 className="text-lg font-bold mb-1">Ready to learn from {profile.name?.split(' ')[0]}?</h4>
                  <p className="text-[11px] opacity-80 mb-5 font-medium">
                    Connect directly with this mentor for personalized guidance, skill development, and career growth.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => {}}
                      className="flex items-center gap-1.5 px-5 py-2.5 bg-white text-violet-700 text-xs font-bold rounded-xl hover:bg-violet-50 transition-all active:scale-95 shadow-sm"
                    >
                      <Zap className="w-3.5 h-3.5" /> Request Mentorship
                    </button>
                    <button
                      onClick={() => {}}
                      className="flex items-center gap-1.5 px-5 py-2.5 bg-white/15 text-white text-xs font-bold rounded-xl hover:bg-white/25 border border-white/20 transition-all active:scale-95 backdrop-blur-sm"
                    >
                      <MessageSquare className="w-3.5 h-3.5" /> Send Message
                    </button>
                  </div>
                </div>
                <GraduationCap className="absolute -bottom-4 -right-4 w-28 h-28 text-white/10 rotate-12" />
              </div>
            </>
        </div>
      )}

      {/* Exchange Activity Tab */}
      {activeTab === 'exchange' && (
        <div className="space-y-4 animate-fade-in">
          {profile.exchangeActivity ? (
            <>
              {/* Stats Row */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: 'Total', val: profile.exchangeActivity.totalExchanges || 0, bg: 'bg-orange-50', text: 'text-orange-600', Icon: ArrowLeftRight },
                  { label: 'Pending', val: profile.exchangeActivity.pending || 0, bg: 'bg-amber-50', text: 'text-amber-600', Icon: Clock },
                  { label: 'Active', val: profile.exchangeActivity.active || 0, bg: 'bg-emerald-50', text: 'text-emerald-600', Icon: CheckCircle2 },
                  { label: 'Completed', val: profile.exchangeActivity.completed || 0, bg: 'bg-indigo-50', text: 'text-indigo-600', Icon: Trophy },
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

              {/* Exchange Activity List */}
              {profile.exchangeActivity.recentExchanges?.length > 0 ? (
                <div className="space-y-3">
                  {profile.exchangeActivity.recentExchanges.map(activity => (
                    <div key={activity._id} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                      <div className="flex items-center gap-4">
                        <div className="w-11 h-11 rounded-xl bg-orange-50 flex items-center justify-center shrink-0">
                          <ArrowLeftRight className="w-5 h-5 text-orange-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-bold text-slate-900">{profile.name}</span>
                            <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full ${activity.status === "completed" ? "text-emerald-600 bg-emerald-50" : activity.status === "accepted" ? "text-indigo-600 bg-indigo-50" : activity.status === "pending" ? "text-amber-600 bg-amber-50" : "text-rose-600 bg-rose-50"}`}>{activity.status}</span>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-slate-500">
                            <span className="font-semibold text-indigo-600">{activity.offeredSkill}</span>
                            <span>↔</span>
                            <span className="font-semibold text-orange-600">{activity.requestedSkill}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-white rounded-2xl p-12 text-center border border-slate-100 shadow-sm">
                  <div className="w-14 h-14 bg-orange-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <ArrowLeftRight className="w-7 h-7 text-orange-400" />
                  </div>
                  <h3 className="text-base font-bold text-slate-800">No exchange activity yet</h3>
                  <p className="text-slate-400 text-sm mt-1">This user hasn't participated in any skill exchanges yet.</p>
                </div>
              )}
            </>
          ) : null}
        </div>
      )}

      {/* Followers Tab */}
      {activeTab === 'followers' && (
        <div className="space-y-3 animate-fade-in">
          {followersList.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center border border-slate-100 shadow-sm">
              <div className="w-14 h-14 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-7 h-7 text-blue-400" />
              </div>
              <h3 className="text-base font-bold text-slate-800">No followers yet</h3>
              <p className="text-slate-400 text-sm mt-1">When someone follows this user, they will appear here.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {followersList.map((follower) => (
                <div
                  key={follower._id}
                  className="flex items-center gap-3 p-4 bg-white rounded-2xl border border-slate-100 hover:shadow-sm transition-all duration-200"
                >
                  <div className="relative shrink-0">
                    <img
                      src={getAvatarUrl(follower)}
                      alt={follower.name}
                      className="w-11 h-11 rounded-full object-cover border-2 border-white shadow-sm"
                    />
                    {follower.isOnline && (
                      <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full"></div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-bold text-slate-900 truncate">{follower.name}</h4>
                    <p className="text-[11px] text-slate-400 font-medium truncate">
                      {follower.experienceLevel || follower.goal || 'Member'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Following Tab */}
      {activeTab === 'following' && (
        <div className="space-y-3 animate-fade-in">
          {followingList.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center border border-slate-100 shadow-sm">
              <div className="w-14 h-14 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <UserCheck className="w-7 h-7 text-emerald-400" />
              </div>
              <h3 className="text-base font-bold text-slate-800">Not following anyone</h3>
              <p className="text-slate-400 text-sm mt-1">This user isn't following anyone yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {followingList.map((person) => (
                <div
                  key={person._id}
                  className="flex items-center gap-3 p-4 bg-white rounded-2xl border border-slate-100 hover:shadow-sm transition-all duration-200"
                >
                  <div className="relative shrink-0">
                    <img
                      src={getAvatarUrl(person)}
                      alt={person.name}
                      className="w-11 h-11 rounded-full object-cover border-2 border-white shadow-sm"
                    />
                    {person.isOnline && (
                      <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full"></div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-bold text-slate-900 truncate">{person.name}</h4>
                    <p className="text-[11px] text-slate-400 font-medium truncate">
                      {person.experienceLevel || person.goal || 'Member'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PublicProfilePage;
