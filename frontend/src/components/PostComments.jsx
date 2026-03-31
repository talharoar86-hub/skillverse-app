import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Trophy } from 'lucide-react';
import { getAvatarUrl } from '../utils/avatar';
import { cn } from '../utils/cn';

const PostComments = ({
  post,
  user,
  isOwner,
  commentText,
  onCommentTextChange,
  onCommentSubmit,
  onTypingStart,
  onTypingStop,
  onMarkHelpful,
  typingUsers,
  autoFocus = false
}) => {
  const inputRef = useRef(null);

  useEffect(() => {
    if (autoFocus && inputRef.current) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 300);
    }
  }, [autoFocus]);
  const getCommentAuthorPath = (comment) => {
    const commentUserId = typeof comment.userId === 'object' && comment.userId !== null ? comment.userId._id : comment.userId;
    if (!commentUserId) return null;
    if (user && commentUserId === user._id) return '/profile/overview';
    return `/user/${commentUserId}/overview`;
  };
  return (
    <>
      {typingUsers.length > 0 && (
        <div className="px-4 py-1 text-[10px] font-bold text-slate-400 animate-pulse bg-slate-50/50">
          {typingUsers.length === 1 
            ? `${typingUsers[0]} is typing...` 
            : `${typingUsers[0]} and ${typingUsers.length - 1} others are typing...`}
        </div>
      )}

      <div className="px-4 pb-4 bg-slate-50/30 border-t border-slate-50 animate-fade-in">
        <form onSubmit={onCommentSubmit} className="flex gap-3 py-4">
          <img 
            src={getAvatarUrl(user)} 
            alt={user?.name || 'User'} 
            className="w-8 h-8 rounded-full object-cover border border-slate-200 shadow-sm mt-1 shrink-0" 
          />
          <input
            ref={inputRef}
            type="text"
            value={commentText}
            onChange={(e) => {
              onCommentTextChange(e.target.value);
              if (e.target.value) onTypingStart();
              else onTypingStop();
            }}
            onBlur={onTypingStop}
            placeholder="Write a comment..."
            className="flex-1 bg-white border border-slate-200 rounded-xl px-4 py-1.5 text-sm font-medium focus:outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-200 transition-all"
          />
        </form>

        <div className="space-y-4 max-h-80 overflow-y-auto custom-scrollbar pr-2">
          {post.comments?.map((comment, index) => {
            const profilePath = getCommentAuthorPath(comment);
            return (
            <div key={index} className="flex gap-3 group/comment">
              {profilePath ? (
                <Link to={profilePath} onClick={(e) => e.stopPropagation()} className="shrink-0 cursor-pointer relative">
                  <img 
                    src={getAvatarUrl(typeof comment.userId === 'object' && comment.userId !== null ? comment.userId : { name: comment.authorName, avatarUrl: comment.authorAvatar })} 
                    alt={comment.authorName} 
                    className="w-8 h-8 rounded-full object-cover border border-slate-100"
                  />
                </Link>
              ) : (
                <div className="shrink-0 cursor-pointer relative">
                  <img 
                    src={getAvatarUrl(typeof comment.userId === 'object' && comment.userId !== null ? comment.userId : { name: comment.authorName, avatarUrl: comment.authorAvatar })} 
                    alt={comment.authorName} 
                    className="w-8 h-8 rounded-full object-cover border border-slate-100"
                  />
                </div>
              )}
              <div className="flex-1">
                <div className={cn(
                  "p-3 rounded-2xl rounded-tl-none border shadow-sm inline-block min-w-[150px] relative",
                  comment.isHelpful ? "bg-emerald-50 border-emerald-100" : "bg-white border-slate-100"
                )}>
                  {comment.isHelpful && (
                    <div className="absolute -right-2 -top-2 bg-emerald-500 text-white p-1 rounded-full shadow-lg">
                      <Trophy className="w-3 h-3" />
                    </div>
                  )}
                  {profilePath ? (
                    <Link to={profilePath} onClick={(e) => e.stopPropagation()}>
                      <h5 className="font-bold text-[11px] text-slate-900 mb-1 hover:text-indigo-600 transition-colors">{comment.authorName}</h5>
                    </Link>
                  ) : (
                    <h5 className="font-bold text-[11px] text-slate-900 mb-1">{comment.authorName}</h5>
                  )}
                  <p className="text-sm text-slate-600 leading-normal">{comment.content}</p>
                  
                  {isOwner && post.type === 'Question' && !comment.isHelpful && (
                    <button 
                      onClick={() => onMarkHelpful(comment._id)}
                      className="mt-2 text-[10px] font-black uppercase tracking-widest text-indigo-600 hover:text-indigo-800 transition-colors opacity-0 group-hover/comment:opacity-100"
                    >
                      Helpful Answer?
                    </button>
                  )}
                </div>
              </div>
            </div>
            );
          })}
        </div>
      </div>
    </>
  );
};

export default PostComments;
