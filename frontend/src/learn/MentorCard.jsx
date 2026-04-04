import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Star, Users, Clock, MessageSquare, Zap, UserPlus, UserCheck, Loader2, Sparkles, ArrowUpRight, TrendingUp, Award, BookOpen, Calendar, Activity } from 'lucide-react';
import { followService, messageService, mentorService } from '../services/api';
import { getAvatarUrl } from '../utils/avatar';
import { cn } from '../utils/cn';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../auth/AuthContext';

const MentorCard = ({ mentor, gradientClass, onConnect }) => {
  const navigate = useNavigate();
  const socket = useSocket();
  const { user } = useAuth();

  const [followStatus, setFollowStatus] = useState(mentor.followStatus || 'none');
  const [mentorshipStatus, setMentorshipStatus] = useState(mentor.mentorshipStatus || 'none');
  const [followLoading, setFollowLoading] = useState(false);
  const [messageLoading, setMessageLoading] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [mentorStats, setMentorStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(false);

  const fetchMentorStats = useCallback(async () => {
    if (!mentor?._id) return;
    if (!user) return;
    setStatsLoading(true);
    try {
      const stats = await mentorService.getPublicStats(mentor._id);
      setMentorStats(stats);
    } catch (err) {
      console.error('Failed to fetch mentor stats', err);
    } finally {
      setStatsLoading(false);
    }
  }, [mentor?._id, user]);

  useEffect(() => {
    fetchMentorStats();
  }, [fetchMentorStats]);

  // Real-time refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchMentorStats();
    }, 30000);
    return () => clearInterval(interval);
  }, [fetchMentorStats]);

  useEffect(() => {
    setFollowStatus(mentor.followStatus || 'none');
    setMentorshipStatus(mentor.mentorshipStatus || 'none');
  }, [mentor.followStatus, mentor.mentorshipStatus]);

  useEffect(() => {
    if (!socket) return;
    const handleFollowAccepted = ({ acceptedBy }) => { if (acceptedBy === mentor._id) setFollowStatus('accepted'); };
    const handleFollowRejected = ({ rejectedBy }) => { if (rejectedBy === mentor._id) setFollowStatus('none'); };
    const handleUnfollowed = ({ unfollowedBy }) => { if (unfollowedBy === mentor._id) setFollowStatus('none'); };
    const handleMentorStatsUpdate = ({ mentorId, stats }) => { if (mentorId === mentor._id) setMentorStats(stats); };
    socket.on('follow_accepted', handleFollowAccepted);
    socket.on('follow_rejected', handleFollowRejected);
    socket.on('unfollowed', handleUnfollowed);
    socket.on('mentor_stats_updated', handleMentorStatsUpdate);
    return () => {
      socket.off('follow_accepted', handleFollowAccepted);
      socket.off('follow_rejected', handleFollowRejected);
      socket.off('unfollowed', handleUnfollowed);
      socket.off('mentor_stats_updated', handleMentorStatsUpdate);
    };
  }, [socket, mentor._id]);

  const handleFollow = async () => {
    if (followLoading) return;
    setFollowLoading(true);
    try { await followService.sendFollow(mentor._id); setFollowStatus('pending'); }
    catch (err) { console.error('Failed to follow mentor', err); }
    finally { setFollowLoading(false); }
  };

  const handleUnfollow = async () => {
    if (followLoading) return;
    setFollowLoading(true);
    try { await followService.unfollow(mentor._id); setFollowStatus('none'); }
    catch (err) { console.error('Failed to unfollow mentor', err); }
    finally { setFollowLoading(false); }
  };

  const handleMessage = async () => {
    if (messageLoading) return;
    if (!mentor?._id) {
      console.error('Mentor ID is missing');
      return;
    }
    setMessageLoading(true);
    try {
      const conversation = await messageService.createConversation(mentor._id);
      if (conversation?._id || conversation?.conversationId) {
        navigate(`/messages/${conversation._id || conversation.conversationId}`);
      } else {
        console.error('Invalid conversation response:', conversation);
      }
    } catch (err) { console.error('Failed to create conversation', err); }
    finally { setMessageLoading(false); }
  };

  const handleConnect = () => { if (onConnect) onConnect(mentor); };

  const bannerGradient = mentorStats?.totalStudents > 10 
    ? 'from-amber-500 via-orange-500 to-rose-500'
    : mentorStats?.totalStudents > 5
    ? 'from-emerald-500 via-teal-500 to-cyan-500'
    : 'from-indigo-500 via-violet-500 to-purple-500';

  const bannerLabel = mentorStats?.totalStudents > 10 
    ? 'Top Mentor'
    : mentorStats?.totalStudents > 5 
    ? 'Popular'
    : 'Rising';

  return (
    <div
      onMouseEnter={() => { setIsHovered(true); fetchMentorStats(); }}
      onMouseLeave={() => setIsHovered(false)}
      className="relative group"
    >
      {/* Animated Gradient Border Glow */}
      <div className={cn(
        "absolute -inset-[1px] rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700 blur-sm bg-gradient-to-br",
        gradientClass
      )} />

      {/* Card */}
      <div className="relative bg-white rounded-3xl border border-slate-200/80 shadow-sm hover:shadow-xl hover:shadow-indigo-500/5 transition-all duration-500 overflow-visible">
        
        {/* Cover with Glassmorphism */}
        <div className={cn('h-32 rounded-t-3xl relative overflow-hidden', !mentor.coverImageUrl && !mentor.mentorProfile?.coverImageUrl && 'bg-gradient-to-br')}>
          {/* Cover Image Background */}
          {(mentor.coverImageUrl || mentor.mentorProfile?.coverImageUrl) ? (
            <div className="absolute inset-0">
              <img 
                src={mentor.coverImageUrl || mentor.mentorProfile?.coverImageUrl} 
                alt="Cover" 
                className="w-full h-full object-cover object-center"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/40 via-transparent to-transparent" />
            </div>
          ) : (
            <>
              <div className={cn('absolute inset-0', gradientClass)} />
              {/* Mesh Pattern - only when no cover */}
              <div className="absolute inset-0 opacity-[0.08]" style={{
                backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
                backgroundSize: '20px 20px'
              }} />
              {/* Shine Sweep - only when no cover */}
              <div className={cn(
                "absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-1000",
                isHovered ? "translate-x-full" : "-translate-x-full"
              )} />
            </>
          )}
          {/* Bottom Fade */}
          <div className={cn(
            "absolute bottom-0 left-0 right-0 h-16",
            (mentor.coverImageUrl || mentor.mentorProfile?.coverImageUrl) ? "bg-gradient-to-t from-white/90 to-transparent" : "bg-gradient-to-t from-white to-transparent"
          )} />
          
          {/* Banner Badge */}
          {(mentorStats?.totalStudents > 0 || mentorStats?.totalCourses > 0) && (
            <div className={cn(
              "absolute top-4 left-4 flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-white/30 backdrop-blur-md shadow-lg",
              (mentor.coverImageUrl || mentor.mentorProfile?.coverImageUrl) 
                ? (bannerGradient.startsWith('from-amber') ? 'bg-amber-600/95' :
                   bannerGradient.startsWith('from-emerald') ? 'bg-emerald-600/95' :
                   'bg-indigo-600/95')
                : (bannerGradient.startsWith('from-amber') ? 'bg-amber-500/90' :
                   bannerGradient.startsWith('from-emerald') ? 'bg-emerald-500/90' :
                   'bg-indigo-500/90')
            )}>
              <Award className="w-3.5 h-3.5 text-white" />
              <span className="text-[9px] font-black text-white uppercase tracking-widest">{bannerLabel}</span>
            </div>
          )}

          {/* Online Indicator */}
          {mentor.isOnline && (
            <div className={cn(
              "absolute top-4 right-4 flex items-center gap-1.5 backdrop-blur-md rounded-full px-3 py-1 border",
              (mentor.coverImageUrl || mentor.mentorProfile?.coverImageUrl) ? "bg-white/20 border-white/40" : "bg-white/20 border-white/30"
            )}>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[9px] font-black text-white uppercase tracking-widest shadow-sm">Online</span>
            </div>
          )}
        </div>

        {/* Avatar - positioned to overlap the cover. NO overflow-hidden on parent card */}
        <div className="px-6 -mt-9 relative z-20">
          <button
            onClick={() => navigate(`/user/${mentor._id}/mentor`)}
            className="relative group/avatar"
          >
            {/* Avatar Ring */}
            <div className={cn(
              "w-[72px] h-[72px] rounded-full p-[3px] bg-gradient-to-br shadow-lg shadow-slate-900/10 transition-transform duration-300 group-hover/avatar:scale-105",
              gradientClass
            )}>
              {/* Inner White Ring */}
              <div className="w-full h-full rounded-full p-[2px] bg-white">
                {mentor.avatarUrl ? (
                  <img src={getAvatarUrl(mentor)} alt={mentor.name} className="w-full h-full rounded-full object-cover" />
                ) : (
                  <div className={cn('w-full h-full rounded-full flex items-center justify-center bg-gradient-to-br text-white', gradientClass)}>
                    <span className="text-2xl font-black">{(mentor.name || 'M').charAt(0)}</span>
                  </div>
                )}
              </div>
            </div>
            {/* Verified Badge */}
            <div className="absolute -bottom-0.5 -right-0.5 w-6 h-6 rounded-full bg-white shadow-md flex items-center justify-center border-2 border-white">
              <Sparkles className="w-3.5 h-3.5 text-indigo-500 fill-indigo-100" />
            </div>
          </button>
        </div>

        {/* Content */}
        <div className="px-6 pt-3 pb-5">
          {/* Name + Headline */}
          <button
            onClick={() => navigate(`/user/${mentor._id}/mentor`)}
            className="text-left block group/name mb-1"
          >
            <h3 className="font-black text-[16px] text-slate-900 leading-tight group-hover/name:text-indigo-600 transition-colors flex items-center gap-1.5">
              {mentor.name}
              <ArrowUpRight className="w-3.5 h-3.5 text-slate-300 group-hover/name:text-indigo-400 transition-colors" />
            </h3>
          </button>
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wide mb-4">
            {mentor.experienceLevel || 'Mentor'}
          </p>

          {/* Skills */}
          <div className="flex flex-wrap gap-1.5 mb-5">
            {(mentor.skills || []).slice(0, 3).map((skill, i) => {
              const colors = [
                'text-indigo-600 bg-indigo-50 border-indigo-100',
                'text-violet-600 bg-violet-50 border-violet-100',
                'text-cyan-600 bg-cyan-50 border-cyan-100',
              ];
              return (
                <span key={skill} className={cn(
                  "text-[10px] font-black px-2.5 py-1 rounded-lg border",
                  colors[i % colors.length]
                )}>
                  {skill}
                </span>
              );
            })}
            {(mentor.skills || []).length > 3 && (
              <span className="text-[10px] font-bold text-slate-400 bg-slate-50 px-2 py-1 rounded-lg border border-slate-100">
                +{mentor.skills.length - 3}
              </span>
            )}
          </div>

          {/* Stats Bar */}
          <div className="flex items-center gap-1 mb-5 p-3 bg-slate-50/80 rounded-2xl border border-slate-100/80">
            <div className="flex-1 flex flex-col items-center justify-center gap-0.5 py-1.5 px-2 rounded-xl hover:bg-white transition-colors">
              <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
              <span className="text-xs font-black text-slate-800">{(mentor.rating || mentorStats?.rating || 5.0).toFixed(1)}</span>
              <span className="text-[9px] font-bold text-slate-400">Rating</span>
            </div>
            <div className="w-px h-10 bg-slate-200" />
            <div className="flex-1 flex flex-col items-center justify-center gap-0.5 py-1.5 px-2 rounded-xl hover:bg-white transition-colors">
              <Users className="w-4 h-4 text-indigo-400" />
              <span className="text-xs font-black text-slate-800">{mentorStats?.totalStudents || mentor.followersCount || 0}</span>
              <span className="text-[9px] font-bold text-slate-400">Students</span>
            </div>
            <div className="w-px h-10 bg-slate-200" />
            <div className="flex-1 flex flex-col items-center justify-center gap-0.5 py-1.5 px-2 rounded-xl hover:bg-white transition-colors">
              <BookOpen className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-black text-slate-800">{mentorStats?.totalCourses || 0}</span>
              <span className="text-[9px] font-bold text-slate-400">Courses</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            {/* Primary Action */}
            {mentorshipStatus === 'none' && (
              <button
                onClick={handleConnect}
                className="flex-1 flex items-center justify-center gap-2 text-xs font-black px-4 py-2.5 bg-slate-900 text-white rounded-2xl hover:bg-indigo-600 active:scale-[0.97] transition-all duration-300 shadow-lg shadow-slate-900/20 hover:shadow-indigo-500/30"
              >
                <Zap className="w-3.5 h-3.5" /> Connect
              </button>
            )}
            {mentorshipStatus === 'pending' && (
              <button disabled className="flex-1 flex items-center justify-center gap-2 text-xs font-black px-4 py-2.5 bg-amber-50 text-amber-600 border border-amber-200 rounded-2xl cursor-not-allowed">
                <Clock className="w-3.5 h-3.5" /> Pending
              </button>
            )}
            {mentorshipStatus === 'accepted' && (
              <button disabled className="flex-1 flex items-center justify-center gap-2 text-xs font-black px-4 py-2.5 bg-emerald-50 text-emerald-600 border border-emerald-200 rounded-2xl cursor-not-allowed">
                <UserCheck className="w-3.5 h-3.5" /> Connected
              </button>
            )}
            {mentorshipStatus === 'rejected' && (
              <button
                onClick={handleConnect}
                className="flex-1 flex items-center justify-center gap-2 text-xs font-black px-4 py-2.5 bg-slate-900 text-white rounded-2xl hover:bg-indigo-600 active:scale-[0.97] transition-all duration-300 shadow-lg shadow-slate-900/20"
              >
                <Zap className="w-3.5 h-3.5" /> Retry
              </button>
            )}

            {/* Message */}
            <button
              onClick={handleMessage}
              disabled={messageLoading}
              className="flex items-center justify-center w-10 h-10 text-slate-500 bg-slate-50 rounded-2xl hover:bg-indigo-50 hover:text-indigo-600 active:scale-95 transition-all duration-300 border border-slate-100 disabled:opacity-50"
            >
              {messageLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <MessageSquare className="w-4 h-4" />}
            </button>

            {/* Follow */}
            {followStatus === 'none' && (
              <button
                onClick={handleFollow}
                disabled={followLoading}
                className="flex items-center justify-center w-10 h-10 text-slate-500 bg-slate-50 rounded-2xl hover:bg-indigo-50 hover:text-indigo-600 active:scale-95 transition-all duration-300 border border-slate-100 disabled:opacity-50"
              >
                {followLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
              </button>
            )}
            {followStatus === 'pending' && (
              <button disabled className="flex items-center justify-center w-10 h-10 bg-amber-50 text-amber-500 rounded-2xl border border-amber-100 cursor-not-allowed">
                <Clock className="w-4 h-4" />
              </button>
            )}
            {followStatus === 'accepted' && (
              <button
                onClick={handleUnfollow}
                disabled={followLoading}
                className="flex items-center justify-center w-10 h-10 bg-emerald-50 text-emerald-500 rounded-2xl hover:bg-emerald-100 active:scale-95 transition-all duration-300 border border-emerald-100 disabled:opacity-50"
              >
                {followLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserCheck className="w-4 h-4" />}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MentorCard;
