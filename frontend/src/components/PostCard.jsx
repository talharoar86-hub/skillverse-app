import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { postService, followService } from '../services/api';
import { formatTimeShort } from '../utils/time';
import Lightbox from './Lightbox';
import { 
  Heart, 
  MessageSquare, 
  Bookmark, 
  Share2, 
  Copy, 
  Check, 
  CheckCircle,
  MoreHorizontal,
  X,
  Trash2,
  Edit2,
  Trophy,
  CheckCircle2,
  UserPlus,
  Repeat2,
  GraduationCap,
  ArrowRightLeft,
  Link2,
  Shield,
  BarChart3
} from 'lucide-react';
import { cn } from '../utils/cn';
import { useSocket } from '../context/SocketContext';
import ShareModal from './ShareModal';
import RepostModal from './RepostModal';
import EditPostModal from './EditPostModal';
import { getAvatarUrl, getImageUrl } from '../utils/avatar';
import PostImageGallery from './PostImageGallery';
import PostComments from './PostComments';

const PostCard = ({ post: initialPost, onUpdate, autoOpenComments = false }) => {
  const { user } = useAuth();
  const socket = useSocket();
  const [post, setPost] = useState(initialPost);
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [showLightbox, setShowLightbox] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showRepostModal, setShowRepostModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [copied, setCopied] = useState(false);
  const [typingUsers, setTypingUsers] = useState([]);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [followStatus, setFollowStatus] = useState('none');
  const [followLoading, setFollowLoading] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

  const menuRef = useRef(null);

  const isOwner = user && (post.userId === user._id || post.userId?._id === user._id || post.authorName === user.name);
  const authorId = typeof post.userId === 'object' && post.userId !== null ? post.userId._id : post.userId;

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    setPost(initialPost);
  }, [initialPost]);

  useEffect(() => {
    if (autoOpenComments) {
      setShowComments(true);
    }
  }, [autoOpenComments]);

  // Check follow status on mount for non-owner posts
  useEffect(() => {
    if (!isOwner && authorId && user?._id) {
      followService.getStatus(authorId)
        .then(res => setFollowStatus(res.status))
        .catch(() => {});
    }
  }, [authorId, isOwner, user?._id]);

  // Listen for follow acceptance/rejection via socket
  useEffect(() => {
    if (!socket) return;
    const authorId = typeof post.userId === 'object' && post.userId !== null ? post.userId._id : post.userId;

    const handleFollowAccepted = ({ acceptedBy }) => {
      if (acceptedBy === authorId) {
        setFollowStatus('accepted');
      }
    };

    const handleFollowRejected = ({ rejectedBy }) => {
      if (rejectedBy === authorId) {
        setFollowStatus('none');
      }
    };

    socket.on('follow_accepted', handleFollowAccepted);
    socket.on('follow_rejected', handleFollowRejected);

    return () => {
      socket.off('follow_accepted', handleFollowAccepted);
      socket.off('follow_rejected', handleFollowRejected);
    };
  }, [socket, post.userId]);

  const handleFollow = async () => {
    if (followLoading) return;
    const authorId = typeof post.userId === 'object' && post.userId !== null ? post.userId._id : post.userId;
    if (!authorId || isOwner) return;

    setFollowLoading(true);
    try {
      if (followStatus === 'none' || followStatus === 'rejected') {
        await followService.sendFollow(authorId);
        setFollowStatus('pending');
      }
    } catch (err) {
      console.error('Follow action failed', err);
    } finally {
      setFollowLoading(false);
    }
  };

  useEffect(() => {
    if (!socket) return;

    const handlePostUpdate = (updatedPost) => {
      if (updatedPost._id === post._id) {
        setPost(updatedPost);
        if (onUpdate) onUpdate(updatedPost);
      }
    };

    const handleTyping = ({ postId, userName }) => {
      if (postId === post._id && userName !== user?.name) {
        setTypingUsers(prev => prev.includes(userName) ? prev : [...prev, userName]);
      }
    };

    const handleStopTyping = ({ postId, userName }) => {
      if (postId === post._id) {
        setTypingUsers(prev => prev.filter(u => u !== userName));
      }
    };

    socket.on('post_updated', handlePostUpdate);
    socket.on('user_typing', handleTyping);
    socket.on('user_stop_typing', handleStopTyping);

    return () => {
      socket.off('post_updated', handlePostUpdate);
      socket.off('user_typing', handleTyping);
      socket.off('user_stop_typing', handleStopTyping);
    };
  }, [socket, post._id, user?.name]);

  const handleTypingStart = () => {
    if (socket) socket.emit('typing', { postId: post._id, userName: user?.name });
  };

  const handleTypingStop = () => {
    if (socket) socket.emit('stop_typing', { postId: post._id, userName: user?.name });
  };

  const handleLike = async () => {
    try {
      const updatedPost = await postService.likePost(post._id);
      setPost(updatedPost);
    } catch (err) {
      console.error('Like failed', err);
    }
  };

  const handleSave = async () => {
    try {
      const updatedPost = await postService.savePost(post._id);
      setPost(updatedPost);
    } catch (err) {
      console.error('Save failed', err);
    }
  };

  const handlePollVote = async (optionIndex) => {
    console.log('Voting:', post._id, optionIndex);
    console.log('User ID:', user?._id);
    try {
      const updatedPost = await postService.votePoll(post._id, optionIndex);
      console.log('Vote success:', updatedPost);
      setPost(updatedPost);
    } catch (err) {
      console.error('Vote failed', err);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this post?')) return;
    setIsDeleting(true);
    try {
      await postService.deletePost(post._id);
    } catch (err) {
      console.error('Delete failed', err);
      setIsDeleting(false);
    }
  };

  const handleMarkHelpful = async (commentId) => {
    try {
      const updatedPost = await postService.markCommentHelpful(post._id, commentId);
      setPost(updatedPost);
    } catch (err) {
      console.error('Failed to mark helpful', err);
    }
  };

  const handleComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    try {
      const updatedPost = await postService.addComment(post._id, commentText);
      setCommentText('');
      handleTypingStop();
      setPost(updatedPost);
    } catch (err) {
      console.error('Comment failed', err);
    }
  };

  const handleCopyLink = () => {
    const url = `${window.location.origin}/post/${post._id}`;
    navigator.clipboard.writeText(url);
    setLinkCopied(true);
    setIsMenuOpen(false);
    setTimeout(() => setLinkCopied(false), 2000);
  };

  const isLiked = post.likes?.some(like => (typeof like === 'object' ? like._id : like) === user?._id);
  const isSaved = post.saves?.some(save => (typeof save === 'object' ? save._id : save) === user?._id);
  const authorProfilePath = isOwner ? '/profile/overview' : `/user/${authorId}/overview`;

  const getBadgeConfig = () => {
    if (post.type === 'Question') {
      return { 
        label: 'Question', 
        color: 'text-orange-600 bg-orange-50 border-orange-100', 
        dot: 'bg-orange-500' 
      };
    }
    if (post.type === 'Update') {
      return { 
        label: 'Update', 
        color: 'text-emerald-600 bg-emerald-50 border-emerald-100', 
        dot: 'bg-emerald-500' 
      };
    }
    if (post.type === 'Guide') {
      return { 
        label: 'Guide', 
        color: 'text-violet-600 bg-violet-50 border-violet-100', 
        dot: 'bg-violet-500' 
      };
    }
    if (post.type === 'Poll') {
      return { 
        label: 'Poll', 
        color: 'text-purple-600 bg-purple-50 border-purple-100', 
        dot: 'bg-purple-500' 
      };
    }
    return { 
      label: post.type || 'Post', 
      color: 'text-indigo-600 bg-indigo-50 border-indigo-100', 
      dot: 'bg-indigo-500' 
    };
  };

  const getAuthorRole = () => {
    if (typeof post.userId === 'object' && post.userId?.goal) {
      if (post.userId.goal === 'Mentor') return 'Mentor';
      if (post.userId.goal === 'Exchange') return 'Skill Exchanger';
      return 'Learner';
    }
    if (post.authorRole === 'Mentor') return 'Mentor';
    if (post.authorRole === 'Exchanger') return 'Skill Exchanger';
    return 'Learner';
  };

  const getRoleBadge = () => {
    const role = getAuthorRole();
    if (role === 'Mentor') return { icon: Trophy, color: 'bg-amber-50 text-amber-600 border-amber-200' };
    if (role === 'Skill Exchanger') return { icon: ArrowRightLeft, color: 'bg-emerald-50 text-emerald-600 border-emerald-200' };
    return { icon: GraduationCap, color: 'bg-sky-50 text-sky-600 border-sky-200' };
  };

  const handleInterested = async () => {
    try {
      const updatedPost = await postService.interestedPost(post._id);
      setPost(updatedPost);
    } catch (err) {
      console.error('Interested action failed', err);
    }
  };

  const handleNotInterested = async () => {
    try {
      const updatedPost = await postService.notInterestedPost(post._id);
      setPost(updatedPost);
    } catch (err) {
      console.error('Not Interested action failed', err);
    }
  };

  const handleRepost = async (caption) => {
    const result = await postService.sharePost(post._id, caption);
    if (onUpdate) onUpdate(result);
  };

  const isInterested = post.interested?.includes(user?._id);
  const isNotInterested = post.notInterested?.includes(user?._id);

  const badge = getBadgeConfig();
  const roleBadge = getRoleBadge();

  if (isDeleting) return null;

  return (
    <div className={cn(
      "relative bg-white/80 backdrop-blur-xl rounded-3xl border border-white/60 shadow-lg shadow-indigo-500/[0.03] hover:shadow-xl hover:shadow-indigo-500/5 transition-all duration-500 animate-fade-in group/card",
      isMenuOpen ? "z-[99]" : "z-10"
    )}>
      {/* ===== POST HEADER ===== */}
      <div className="px-4 sm:px-5 pt-4 pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            {/* Avatar with gradient ring */}
            <Link to={authorProfilePath} onClick={(e) => e.stopPropagation()} className="shrink-0 relative group/avatar cursor-pointer">
              <div className="absolute -inset-0.5 bg-gradient-to-br from-indigo-400/40 to-purple-400/40 rounded-full opacity-0 group-hover/avatar:opacity-100 transition-opacity duration-300" />
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full overflow-hidden ring-2 ring-white shadow-md relative">
                <img 
                  src={getAvatarUrl(typeof post.userId === 'object' && post.userId !== null ? post.userId : { name: post.authorName, avatarUrl: post.authorAvatar })} 
                  alt={post.authorName} 
                  className="w-full h-full object-cover"
                />
              </div>
              {post.isOnline && (
                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 sm:w-3.5 sm:h-3.5 bg-emerald-400 border-2 border-white rounded-full shadow-sm" />
              )}
            </Link>

            {/* Author info */}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <Link to={authorProfilePath} onClick={(e) => e.stopPropagation()}>
                  <h4 className="font-bold text-slate-900 text-[14px] sm:text-[15px] hover:text-transparent hover:bg-gradient-to-r hover:from-indigo-600 hover:to-purple-600 hover:bg-clip-text transition-all duration-300 cursor-pointer leading-tight truncate">
                    {post.authorName}
                  </h4>
                </Link>

                {/* Verified Mentor badge */}
                {post.userId?.isMentor && post.userId?.mentorStatus === 'approved' && (
                  <span title="Verified Mentor" className="shrink-0">
                    <Shield className="w-4 h-4 text-indigo-500 fill-indigo-100" />
                  </span>
                )}

                {/* Follow button */}
                {!isOwner && (
                  <button
                    onClick={(e) => { e.stopPropagation(); handleFollow(); }}
                    disabled={followLoading}
                    className={cn(
                      "inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] sm:text-[11px] font-bold transition-all duration-200 shrink-0",
                      followStatus === 'accepted'
                        ? "text-emerald-600 bg-emerald-50 hover:bg-emerald-100"
                        : followStatus === 'pending'
                          ? "text-amber-600 bg-amber-50 cursor-default"
                          : "text-indigo-600 bg-indigo-50 hover:bg-indigo-100"
                    )}
                  >
                    {followStatus === 'accepted' ? (
                      <><Check className="w-3 h-3" /> Following</>
                    ) : followStatus === 'pending' ? (
                      'Pending'
                    ) : (
                      <><UserPlus className="w-3 h-3" /> Follow</>
                    )}
                  </button>
                )}
              </div>

              {/* Time row with role text */}
              <div className="flex items-center gap-1.5 mt-1">
                <span className="text-[11px] sm:text-[12px] text-slate-400 font-medium">
                  {getAuthorRole()}
                </span>
                <span className="text-slate-300 text-[10px]">·</span>
                <span className="text-[11px] sm:text-[12px] text-slate-400 font-medium" title={post.createdAt ? new Date(post.createdAt).toLocaleString() : ''}>
                  {post.createdAt ? formatTimeShort(post.createdAt) : ''}
                </span>
                {post.isResolved && (
                  <>
                    <span className="text-slate-300 text-[10px]">·</span>
                    <span className="flex items-center gap-1 text-emerald-600 text-[10px] font-bold">
                      <CheckCircle2 className="w-3 h-3" /> Solved
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Right side: badge + menu */}
          <div className="flex items-center gap-2 shrink-0">
            <span className={cn(
              "hidden sm:flex px-2.5 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest items-center gap-1.5 border shadow-sm", 
              badge.color
            )}>
              <div className={cn("w-1.5 h-1.5 rounded-full shrink-0 animate-pulse", badge.dot)} />
              {badge.label}
            </span>

            {/* Dropdown */}
            <div className="relative" ref={menuRef}>
              <button 
                onClick={(e) => { e.stopPropagation(); setIsMenuOpen(!isMenuOpen); }}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100/80 rounded-xl transition-all duration-200 active:scale-90"
              >
                <MoreHorizontal className="w-5 h-5" />
              </button>
              
              {isMenuOpen && (
                <div className="absolute right-0 top-full mt-2 bg-white/90 backdrop-blur-2xl border border-slate-200/80 rounded-2xl shadow-2xl shadow-slate-900/10 py-2 w-52 z-[9999] animate-slide-up origin-top-right">
                  {isOwner ? (
                    <>
                      <button 
                        onClick={() => { setShowEditModal(true); setIsMenuOpen(false); }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-[13px] font-semibold text-slate-700 hover:bg-indigo-50/80 transition-colors"
                      >
                        <Edit2 className="w-4 h-4 text-indigo-500" /> Edit post
                      </button>
                      <button 
                        onClick={handleDelete}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-[13px] font-semibold text-rose-600 hover:bg-rose-50/80 transition-colors"
                      >
                        <Trash2 className="w-4 h-4 text-rose-400" /> Delete post
                      </button>
                      <div className="h-[1px] bg-gradient-to-r from-transparent via-slate-200 to-transparent my-1 mx-3" />
                      <button 
                        onClick={handleCopyLink}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-[13px] font-semibold text-slate-700 hover:bg-slate-50/80 transition-colors"
                      >
                        <Link2 className="w-4 h-4 text-slate-400" /> Copy link
                      </button>
                    </>
                  ) : (
                    <>
                      <button 
                        onClick={() => { handleInterested(); setIsMenuOpen(false); }}
                        className={cn(
                          "w-full flex items-center gap-3 px-4 py-2.5 text-[13px] font-semibold transition-colors",
                          isInterested ? "text-indigo-600 bg-indigo-50/50" : "text-slate-700 hover:bg-indigo-50/50"
                        )}
                      >
                        <Trophy className={cn("w-4 h-4", isInterested ? "text-indigo-500" : "text-slate-400")} /> 
                        {isInterested ? 'Interested!' : 'Interested'}
                      </button>
                      <button 
                        onClick={() => { handleNotInterested(); setIsMenuOpen(false); }}
                        className={cn(
                          "w-full flex items-center gap-3 px-4 py-2.5 text-[13px] font-semibold transition-colors",
                          isNotInterested ? "text-rose-600 bg-rose-50/50" : "text-slate-700 hover:bg-rose-50/50"
                        )}
                      >
                        <X className={cn("w-4 h-4", isNotInterested ? "text-rose-500" : "text-slate-400")} /> 
                        Not interested
                      </button>
                      <div className="h-[1px] bg-gradient-to-r from-transparent via-slate-200 to-transparent my-1 mx-3" />
                      <button 
                        onClick={handleCopyLink}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-[13px] font-semibold text-slate-700 hover:bg-slate-50/80 transition-colors"
                      >
                        <Link2 className="w-4 h-4 text-slate-400" /> Copy link
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ===== POST CONTENT ===== */}
      <div className="px-4 sm:px-5 pb-3">
        {post.content && (
          <p className="text-slate-800 text-[15px] sm:text-[16px] leading-relaxed font-medium tracking-tight whitespace-pre-wrap">
            {post.content}
          </p>
        )}

        {/* Poll Display */}
        {post.type === 'Poll' && post.poll && (
          <div className="mt-4">
            <div className="flex items-center gap-2 mb-3">
              <BarChart3 className="w-5 h-5 text-purple-600" />
              <span className="text-xs font-bold text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full">
                POLL
              </span>
            </div>
            
            <h4 className="font-bold text-lg text-slate-900 mb-4">{post.poll.question}</h4>
            
            <div className="space-y-2.5">
              {post.poll.options?.map((option, idx) => {
                const votes = option.voteCount || 0;
                const total = post.poll.totalVotes || 0;
                const percent = total > 0 ? Math.round((votes / total) * 100) : 0;
                const userId = user?._id ? (typeof user._id === 'string' ? user._id : user._id._id || user._id.toString()) : null;
                const hasVoted = userId && post.poll.votedUsers?.some(id => {
                  const idStr = typeof id === 'object' ? (id._id ? id._id.toString() : id.toString()) : id.toString();
                  return idStr === userId;
                });
                const isMulti = post.poll.isMultiple;
                const pollEnded = post.poll.endsAt && new Date(post.poll.endsAt) < new Date();
                const canVote = !hasVoted && !pollEnded;
                
                return (
                  <button
                    key={idx}
                    onClick={() => canVote && handlePollVote(idx)}
                    disabled={!canVote}
                    className={`w-full text-left px-4 py-3 rounded-xl font-medium transition-all relative overflow-hidden group ${
                      hasVoted 
                        ? 'ring-2 ring-purple-500 bg-purple-50' 
                        : canVote 
                          ? 'bg-slate-50 hover:bg-slate-100 border border-slate-200 hover:border-purple-300 cursor-pointer' 
                          : 'bg-slate-50 border border-slate-200 opacity-60 cursor-not-allowed'
                    }`}
                  >
                    <div 
                      className="absolute inset-0 bg-purple-100 transition-all duration-500" 
                      style={{ width: `${percent}%`, opacity: hasVoted ? 0.4 : 0.3 }}
                    />
                    <div className="relative flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        {hasVoted && <CheckCircle className="w-4 h-4 text-purple-600 flex-shrink-0" />}
                        <span className={hasVoted ? 'text-purple-700' : 'text-slate-700'}>
                          {option.text}
                        </span>
                      </div>
                      {hasVoted && (
                        <span className="text-purple-600 font-bold">{percent}%</span>
                      )}
                    </div>
                    
                    {!hasVoted && canVote && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="w-5 h-5 rounded-full border-2 border-slate-300 group-hover:border-purple-400" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
            
            <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100">
              <div className="flex items-center gap-4">
                <span className="text-sm font-semibold text-slate-600">
                  {post.poll.totalVotes} vote{post.poll.totalVotes !== 1 ? 's' : ''}
                </span>
                {post.poll.isMultiple && (
                  <span className="text-xs font-medium text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                    Multiple choice
                  </span>
                )}
              </div>
              {post.poll.endsAt && (
                <span className="text-xs font-medium text-slate-500">
                  {new Date(post.poll.endsAt) < new Date() ? (
                    <span className="text-red-500">Ended</span>
                  ) : (
                    <>Ends {formatTimeShort(post.poll.endsAt)}</>
                  )}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Embedded Repost Content */}
        {post.isRepost && (
          <div className="mt-4 border border-slate-200/80 rounded-2xl overflow-hidden hover:bg-slate-50/50 transition-colors cursor-pointer bg-slate-50/30" onClick={(e) => e.stopPropagation()}>
            {post.originalPostId ? (
              <div className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  <img 
                    src={getAvatarUrl(typeof post.originalPostId.userId === 'object' && post.originalPostId.userId !== null ? post.originalPostId.userId : { name: post.originalPostId.authorName, avatarUrl: post.originalPostId.authorAvatar })} 
                    alt={post.originalPostId.authorName} 
                    className="w-8 h-8 rounded-full object-cover shadow-sm ring-2 ring-white" 
                  />
                  <div>
                    <h5 className="font-bold text-[14px] text-slate-900 leading-none">
                      {post.originalPostId.authorName}
                    </h5>
                    <div className="text-[11px] text-slate-400 font-medium mt-1">
                      {(typeof post.originalPostId.userId === 'object' && post.originalPostId.userId?.goal === 'Mentor') ? 'Mentor' : (typeof post.originalPostId.userId === 'object' && post.originalPostId.userId?.goal === 'Exchange') ? 'Skill Exchanger' : post.originalPostId.authorRole === 'Mentor' ? 'Mentor' : post.originalPostId.authorRole === 'Exchanger' ? 'Skill Exchanger' : 'Learner'} · {post.originalPostId.createdAt ? formatTimeShort(post.originalPostId.createdAt) : ''}
                    </div>
                  </div>
                </div>
                {post.originalPostId.content && (
                  <p className="text-[14px] text-slate-600 leading-relaxed whitespace-pre-wrap line-clamp-3">
                    {post.originalPostId.content}
                  </p>
                )}
                {((post.originalPostId.imageUrls && post.originalPostId.imageUrls.length > 0) || post.originalPostId.imageUrl) && (
                  <div className="mt-3 w-full h-36 rounded-xl overflow-hidden bg-slate-100">
                    <img src={getImageUrl(post.originalPostId.imageUrls?.length > 0 ? post.originalPostId.imageUrls[0] : post.originalPostId.imageUrl)} className="w-full h-full object-cover opacity-90 hover:opacity-100 transition-opacity" alt="" />
                  </div>
                )}
              </div>
            ) : (
              <div className="p-4 flex items-center gap-3">
                <div className="w-10 h-10 bg-slate-200 rounded-full flex items-center justify-center shrink-0">
                  <Trash2 className="w-5 h-5 text-slate-400" />
                </div>
                <div>
                  <h5 className="font-bold text-[13px] text-slate-900 leading-tight">Post Unavailable</h5>
                  <p className="text-[12px] text-slate-500">This content has been deleted.</p>
                </div>
              </div>
            )}
          </div>
        )}
        
        {/* Code Snippet */}
        {post.codeSnippet && (
          <div className="bg-[#0d1117] rounded-2xl mt-4 overflow-hidden shadow-xl border border-white/5 group/code">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-2.5 bg-gradient-to-r from-slate-800 to-slate-800/80 border-b border-white/5">
              <div className="flex items-center gap-2">
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-rose-500/50" />
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-500/50" />
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/50" />
                </div>
                <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest ml-2">code-snippet</span>
              </div>
              <button 
                onClick={() => {
                  navigator.clipboard.writeText(post.codeSnippet);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }}
                className={cn(
                  "text-[10px] font-bold uppercase tracking-wider transition-all duration-200 px-2 py-1 rounded-md",
                  copied 
                    ? "text-emerald-400 bg-emerald-500/10" 
                    : "text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/10"
                )}
              >
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
            {/* Scrollable code area */}
            <div className="max-h-[300px] overflow-auto custom-scrollbar">
              <pre className="p-4 text-indigo-200/90 font-mono text-sm leading-7 selection:bg-indigo-500/30">
                <code>{post.codeSnippet}</code>
              </pre>
            </div>
          </div>
        )}

        {/* Skills/Tags */}
        {post.skills && post.skills.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-4">
            {post.skills.map(skill => (
              <span key={skill} className="text-[11px] font-bold text-indigo-500 bg-gradient-to-r from-indigo-50 to-purple-50 px-3 py-1.5 rounded-xl border border-indigo-100/50 hover:shadow-md hover:border-indigo-200 transition-all cursor-default">
                #{skill.toLowerCase()}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Image Gallery */}
      <PostImageGallery 
        imageUrls={post.imageUrls}
        imageUrl={post.imageUrl}
        onImageClick={(index) => { setLightboxIndex(index); setShowLightbox(true); }}
      />

      {/* ===== INTERACTION BAR (5 icons) ===== */}
      <div className="px-2 sm:px-4 py-2 flex items-center justify-around border-t border-slate-100/60">
        {/* Like */}
        <div className="relative group/like">
          <button 
            onClick={handleLike}
            className={cn(
              "flex items-center gap-1.5 px-2 sm:px-3 py-2 rounded-xl transition-all duration-200 active:scale-95",
              isLiked 
                ? "text-rose-600 bg-rose-50/50" 
                : "text-slate-500 hover:bg-rose-50 hover:text-rose-500"
            )}
          >
            <Heart className={cn("w-[18px] h-[18px] sm:w-5 sm:h-5 transition-transform duration-200", isLiked && "fill-current scale-110")} />
            <span className="text-xs font-bold">{post.likes?.length || 0}</span>
          </button>
          {post.likes && post.likes.length > 0 && (
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2.5 hidden group-hover/like:block z-[9999]">
              <div className="bg-black/80 backdrop-blur-md text-white rounded-xl px-3.5 py-2.5 shadow-2xl min-w-[160px] max-w-[240px]">
                <div className="font-semibold text-[10px] uppercase tracking-wider text-white/50 mb-2">Liked by</div>
                <div className="flex flex-col gap-1.5">
                  {post.likes.slice(0, 5).map((like, i) => {
                    const likeId = typeof like === 'object' ? like._id : like;
                    const likeName = typeof like === 'object' ? like.name : 'User';
                    const likeAvatar = typeof like === 'object' ? like.avatarUrl : null;
                    return (
                      <Link key={likeId || i} to={`/user/${likeId}/overview`} onClick={(e) => e.stopPropagation()} className="flex items-center gap-2 hover:bg-white/10 rounded-lg px-1 py-0.5 transition-colors">
                        <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-[10px] font-bold overflow-hidden shrink-0">
                          {likeAvatar ? (
                            <img src={getAvatarUrl({ name: likeName, avatarUrl: likeAvatar })} alt="" className="w-full h-full object-cover" />
                          ) : (
                            likeName?.charAt(0)?.toUpperCase() || '?'
                          )}
                        </div>
                        <span className="text-[12px] text-white/90 font-medium truncate">{likeName}</span>
                      </Link>
                    );
                  })}
                </div>
                {post.likes.length > 5 && (
                  <div className="text-[11px] text-white/50 mt-1.5 font-medium">and {post.likes.length - 5} others</div>
                )}
              </div>
              <div className="w-2.5 h-2.5 bg-black/80 rotate-45 absolute -bottom-[5px] left-1/2 -translate-x-1/2" />
            </div>
          )}
        </div>
        
        {/* Comment */}
        <div className="relative group/comment">
          <button 
            onClick={() => setShowComments(!showComments)}
            className={cn(
              "flex items-center gap-1.5 px-2 sm:px-3 py-2 rounded-xl transition-all duration-200",
              showComments 
                ? "text-indigo-600 bg-indigo-50/50" 
                : "text-slate-500 hover:bg-indigo-50 hover:text-indigo-500"
            )}
          >
            <MessageSquare className="w-[18px] h-[18px] sm:w-5 sm:h-5" />
            <span className="text-xs font-bold">{post.comments?.length || 0}</span>
          </button>
          {post.comments && post.comments.length > 0 && (
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2.5 hidden group-hover/comment:block z-[9999]">
              <div className="bg-black/80 backdrop-blur-md text-white rounded-xl px-3.5 py-2.5 shadow-2xl min-w-[160px] max-w-[240px]">
                <div className="font-semibold text-[10px] uppercase tracking-wider text-white/50 mb-2">Commented by</div>
                <div className="flex flex-col gap-1.5">
                  {[...new Map(post.comments.map(c => [c.userId, c])).values()].slice(0, 5).map((comment, i) => (
                    <Link key={comment.userId || i} to={`/user/${comment.userId}/overview`} onClick={(e) => e.stopPropagation()} className="flex items-center gap-2 hover:bg-white/10 rounded-lg px-1 py-0.5 transition-colors">
                      <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-[10px] font-bold overflow-hidden shrink-0">
                        {comment.authorName?.charAt(0)?.toUpperCase() || '?'}
                      </div>
                      <span className="text-[12px] text-white/90 font-medium truncate">{comment.authorName}</span>
                    </Link>
                  ))}
                </div>
                {new Set(post.comments.map(c => c.userId)).size > 5 && (
                  <div className="text-[11px] text-white/50 mt-1.5 font-medium">and {new Set(post.comments.map(c => c.userId)).size - 5} others</div>
                )}
              </div>
              <div className="w-2.5 h-2.5 bg-black/80 rotate-45 absolute -bottom-[5px] left-1/2 -translate-x-1/2" />
            </div>
          )}
        </div>

        {/* Repost */}
        <button 
          onClick={() => setShowRepostModal(true)}
          className="flex items-center gap-1.5 px-2 sm:px-3 py-2 text-slate-500 hover:bg-emerald-50 hover:text-emerald-500 rounded-xl transition-all duration-200 active:scale-95"
        >
          <Repeat2 className="w-[18px] h-[18px] sm:w-5 sm:h-5" />
          <span className="text-xs font-bold">{post.reposts || 0}</span>
        </button>

        {/* Share */}
        <button 
          onClick={() => setShowShareModal(true)}
          className="flex items-center gap-1.5 px-2 sm:px-3 py-2 text-slate-500 hover:bg-sky-50 hover:text-sky-500 rounded-xl transition-all duration-200 active:scale-95"
        >
          <Share2 className="w-[18px] h-[18px] sm:w-5 sm:h-5" />
          <span className="text-xs font-bold">{post.shares || 0}</span>
        </button>

        {/* Save */}
        <button 
          onClick={handleSave}
          className={cn(
            "flex items-center gap-1.5 px-2 sm:px-3 py-2 rounded-xl transition-all duration-200 active:scale-95",
            isSaved 
              ? "text-amber-600 bg-amber-50/50" 
              : "text-slate-500 hover:bg-amber-50 hover:text-amber-500"
          )}
        >
          <Bookmark className={cn("w-[18px] h-[18px] sm:w-5 sm:h-5 transition-transform duration-200", isSaved && "fill-current scale-110")} />
          <span className="text-xs font-bold">{post.saves?.length || 0}</span>
        </button>
      </div>

      {/* ===== REAL-TIME SUMMARY BAR (Facebook-style) ===== */}
      {(post.likes?.length > 0 || post.comments?.length > 0) && (
        <div className="px-4 sm:px-5 pb-2 flex items-center justify-between gap-2">
          {/* Likes summary */}
          {post.likes?.length > 0 && (
            <div className="flex items-center gap-1.5 min-w-0">
              <div className="flex -space-x-1.5">
                {post.likes.slice(0, 3).map((like, i) => {
                  const likeName = typeof like === 'object' ? like.name : 'User';
                  const likeAvatar = typeof like === 'object' ? like.avatarUrl : null;
                  return (
                    <div key={i} className="w-5 h-5 rounded-full ring-2 ring-white overflow-hidden bg-rose-100">
                      {likeAvatar ? (
                        <img src={getAvatarUrl({ name: likeName, avatarUrl: likeAvatar })} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[8px] font-bold text-rose-600">{likeName?.charAt(0)?.toUpperCase()}</div>
                      )}
                    </div>
                  );
                })}
              </div>
              <span className="text-[11px] text-slate-500 truncate">
                <span className="font-semibold text-slate-700">
                  {typeof post.likes[0] === 'object' ? post.likes[0].name : 'Someone'}
                </span>
                {post.likes.length === 2 && typeof post.likes[1] === 'object' && (
                  <>, <span className="font-semibold text-slate-700">{post.likes[1].name}</span></>
                )}
                {post.likes.length > 1 && (
                  <> and {post.likes.length - 1} others</>
                )}
                {' '}liked this
              </span>
            </div>
          )}

          {/* Comments summary */}
          {post.comments?.length > 0 && (
            <button onClick={() => setShowComments(true)} className="text-[11px] text-slate-500 hover:text-indigo-600 transition-colors shrink-0 font-medium">
              {post.comments.length} {post.comments.length === 1 ? 'comment' : 'comments'}
            </button>
          )}
        </div>
      )}

      {/* Link copied toast */}
      {linkCopied && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-lg animate-slide-up z-50 flex items-center gap-1.5">
          <Check className="w-3 h-3 text-emerald-400" /> Link copied!
        </div>
      )}

      {/* Comments */}
      {showComments && (
        <PostComments
          post={post}
          user={user}
          isOwner={isOwner}
          commentText={commentText}
          onCommentTextChange={setCommentText}
          onCommentSubmit={handleComment}
          onTypingStart={handleTypingStart}
          onTypingStop={handleTypingStop}
          onMarkHelpful={handleMarkHelpful}
          typingUsers={typingUsers}
          autoFocus={autoOpenComments}
        />
      )}

      {/* Lightbox */}
      {showLightbox && (
        <Lightbox
          images={post.imageUrls && post.imageUrls.length > 0 ? post.imageUrls : [post.imageUrl]}
          initialIndex={lightboxIndex}
          onClose={() => setShowLightbox(false)}
          post={post}
          user={user}
          onLike={handleLike}
          onComment={() => {
            setShowLightbox(false);
            setShowComments(true);
          }}
          onShare={() => {
            setShowLightbox(false);
            setShowShareModal(true);
          }}
        />
      )}

      {/* Share Modal */}
      {showShareModal && (
        <ShareModal
          post={post}
          user={user}
          onClose={() => setShowShareModal(false)}
          onShared={() => setPost(prev => ({ ...prev, shares: (prev.shares || 0) + 1 }))}
        />
      )}

      {/* Repost Modal */}
      {showRepostModal && (
        <RepostModal
          post={post}
          user={user}
          onClose={() => setShowRepostModal(false)}
          onRepost={handleRepost}
        />
      )}

      {/* Edit Modal */}
      {showEditModal && (
        <EditPostModal 
          post={post}
          user={user}
          onClose={() => setShowEditModal(false)}
          onSave={async (newContent) => {
             try {
               const updated = await postService.updatePost(post._id, { content: newContent });
               setPost(updated);
               setShowEditModal(false);
             } catch (err) {
               console.error('Edit failed', err);
             }
          }}
        />
      )}
    </div>
  );
};

export default PostCard;
