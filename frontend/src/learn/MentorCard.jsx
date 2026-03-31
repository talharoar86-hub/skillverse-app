import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Star, Users, Clock, MessageSquare, Zap, UserPlus, UserCheck, Loader2 } from 'lucide-react';
import { mentorshipService, followService, messageService } from '../services/api';
import { getAvatarUrl } from '../utils/avatar';
import { cn } from '../utils/cn';
import { useSocket } from '../context/SocketContext';

const MentorCard = ({ mentor, gradientClass, onConnect }) => {
  const navigate = useNavigate();
  const socket = useSocket();

  const [followStatus, setFollowStatus] = useState('none');
  const [mentorshipStatus, setMentorshipStatus] = useState('none');
  const [followLoading, setFollowLoading] = useState(false);
  const [messageLoading, setMessageLoading] = useState(false);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const data = await mentorshipService.getMentorStatus(mentor._id);
        setFollowStatus(data.followStatus);
        setMentorshipStatus(data.mentorshipStatus);
      } catch (err) {
        console.error('Failed to fetch mentor status', err);
      }
    };
    fetchStatus();
  }, [mentor._id]);

  // Socket listeners for follow status updates
  useEffect(() => {
    if (!socket) return;

    const handleFollowAccepted = ({ acceptedBy }) => {
      if (acceptedBy === mentor._id) setFollowStatus('accepted');
    };
    const handleFollowRejected = ({ rejectedBy }) => {
      if (rejectedBy === mentor._id) setFollowStatus('none');
    };
    const handleUnfollowed = ({ unfollowedBy }) => {
      if (unfollowedBy === mentor._id) setFollowStatus('none');
    };

    socket.on('follow_accepted', handleFollowAccepted);
    socket.on('follow_rejected', handleFollowRejected);
    socket.on('unfollowed', handleUnfollowed);

    return () => {
      socket.off('follow_accepted', handleFollowAccepted);
      socket.off('follow_rejected', handleFollowRejected);
      socket.off('unfollowed', handleUnfollowed);
    };
  }, [socket, mentor._id]);

  const handleFollow = async () => {
    if (followLoading) return;
    setFollowLoading(true);
    try {
      await followService.sendFollow(mentor._id);
      setFollowStatus('pending');
    } catch (err) {
      console.error('Failed to follow mentor', err);
    } finally {
      setFollowLoading(false);
    }
  };

  const handleUnfollow = async () => {
    if (followLoading) return;
    setFollowLoading(true);
    try {
      await followService.unfollow(mentor._id);
      setFollowStatus('none');
    } catch (err) {
      console.error('Failed to unfollow mentor', err);
    } finally {
      setFollowLoading(false);
    }
  };

  const handleMessage = async () => {
    if (messageLoading) return;
    setMessageLoading(true);
    try {
      const conversation = await messageService.createConversation(mentor._id);
      navigate(`/messages/${conversation._id || conversation.conversationId}`);
    } catch (err) {
      console.error('Failed to create conversation', err);
    } finally {
      setMessageLoading(false);
    }
  };

  const handleConnect = () => {
    if (onConnect) onConnect(mentor);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-lg hover:shadow-indigo-50 transition-all duration-300 overflow-hidden group">
      {/* Cover */}
      <div className={cn('h-20 bg-gradient-to-br relative', gradientClass)}>
        <div className="absolute inset-0 bg-slate-900/10 group-hover:bg-slate-900/20 transition-colors" />
      </div>

      {/* Avatar */}
      <div className="px-5 -mt-7 mb-3">
        <button
          onClick={() => navigate(`/user/${mentor._id}/mentor`)}
          className="w-14 h-14 rounded-full border-4 border-white shadow-md flex items-center justify-center overflow-hidden bg-indigo-100 hover:scale-105 transition-transform"
        >
          {mentor.avatarUrl ? (
            <img src={getAvatarUrl(mentor)} alt={mentor.name} className="w-full h-full object-cover" />
          ) : (
            <span className={cn('text-xl font-black text-white bg-gradient-to-br w-full h-full flex items-center justify-center', gradientClass)}>
              {(mentor.name || 'M').charAt(0)}
            </span>
          )}
        </button>
      </div>

      <div className="px-5 pb-5">
        {/* Name + Experience */}
        <button
          onClick={() => navigate(`/user/${mentor._id}/mentor`)}
          className="text-left block"
        >
          <h3 className="font-black text-[15px] text-slate-900 leading-tight hover:text-indigo-600 transition-colors">{mentor.name}</h3>
        </button>
        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-tight mb-3">{mentor.experienceLevel || 'Mentor'}</p>

        {/* Skills */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          {(mentor.skills || []).slice(0, 3).map(skill => (
            <span key={skill} className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">
              {skill}
            </span>
          ))}
        </div>

        {/* Stats */}
        <div className="flex items-center gap-3 mb-4 pt-3 border-t border-slate-50">
          <div className="flex items-center gap-1">
            <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" />
            <span className="text-xs font-black text-slate-800">{mentor.rating || '5.0'}</span>
          </div>
          <div className="flex items-center gap-1">
            <Users className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-xs font-bold text-slate-500">{mentor.followersCount || 0}</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-xs font-bold text-slate-500">{mentor.menteesCount || 0} mentees</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {/* Connect / Request Mentorship */}
          {mentorshipStatus === 'none' && (
            <button
              onClick={handleConnect}
              className="flex-1 flex items-center justify-center gap-1.5 text-xs font-bold px-3 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 active:scale-95 transition-all shadow-sm shadow-indigo-200"
            >
              <Zap className="w-3.5 h-3.5" /> Connect
            </button>
          )}
          {mentorshipStatus === 'pending' && (
            <button
              disabled
              className="flex-1 flex items-center justify-center gap-1.5 text-xs font-bold px-3 py-2 bg-amber-50 text-amber-600 border border-amber-100 rounded-xl cursor-not-allowed"
            >
              <Clock className="w-3.5 h-3.5" /> Pending
            </button>
          )}
          {mentorshipStatus === 'accepted' && (
            <button
              disabled
              className="flex-1 flex items-center justify-center gap-1.5 text-xs font-bold px-3 py-2 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-xl cursor-not-allowed"
            >
              <UserCheck className="w-3.5 h-3.5" /> Connected
            </button>
          )}
          {mentorshipStatus === 'rejected' && (
            <button
              onClick={handleConnect}
              className="flex-1 flex items-center justify-center gap-1.5 text-xs font-bold px-3 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 active:scale-95 transition-all shadow-sm shadow-indigo-200"
            >
              <Zap className="w-3.5 h-3.5" /> Retry
            </button>
          )}

          {/* Message */}
          <button
            onClick={handleMessage}
            disabled={messageLoading}
            className="flex items-center justify-center gap-1.5 text-xs font-bold px-3 py-2 bg-slate-50 text-slate-600 rounded-xl hover:bg-slate-100 active:scale-95 transition-all border border-slate-100 disabled:opacity-50"
          >
            {messageLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <MessageSquare className="w-3.5 h-3.5" />}
          </button>

          {/* Follow */}
          {followStatus === 'none' && (
            <button
              onClick={handleFollow}
              disabled={followLoading}
              className="flex items-center justify-center gap-1.5 text-xs font-bold px-3 py-2 bg-slate-50 text-slate-600 rounded-xl hover:bg-slate-100 active:scale-95 transition-all border border-slate-100 disabled:opacity-50"
            >
              {followLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UserPlus className="w-3.5 h-3.5" />}
            </button>
          )}
          {followStatus === 'pending' && (
            <button
              disabled
              className="flex items-center justify-center text-xs font-bold px-3 py-2 bg-amber-50 text-amber-600 border border-amber-100 rounded-xl cursor-not-allowed"
            >
              <Clock className="w-3.5 h-3.5" />
            </button>
          )}
          {followStatus === 'accepted' && (
            <button
              onClick={handleUnfollow}
              disabled={followLoading}
              className="flex items-center justify-center text-xs font-bold px-3 py-2 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-xl hover:bg-emerald-100 active:scale-95 transition-all disabled:opacity-50"
            >
              {followLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UserCheck className="w-3.5 h-3.5" />}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default MentorCard;
