import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { 
  X, 
  CornerUpRight,
  Repeat2,
  Loader2,
  Check,
  Image as ImageIcon,
  Code2,
  MessageSquare,
  Heart,
  Bookmark
} from 'lucide-react';
import { cn } from '../utils/cn';
import { getAvatarUrl, getImageUrl } from '../utils/avatar';
import { formatTimeShort } from '../utils/time';

const RepostModal = ({ post, user, onClose, onRepost }) => {
  const [caption, setCaption] = useState('');
  const [reposting, setReposting] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleRepost = async () => {
    if (reposting) return;
    setReposting(true);
    try {
      await onRepost(caption);
      setSuccess(true);
      setTimeout(() => onClose(), 1200);
    } catch (err) {
      console.error('Repost failed', err);
      setReposting(false);
    }
  };

  const authorData = typeof post.userId === 'object' && post.userId !== null 
    ? post.userId 
    : { name: post.authorName, avatarUrl: post.authorAvatar };

  const hasImage = post.imageUrls?.length > 0 || post.imageUrl;
  const hasCode = !!post.codeSnippet;
  const previewImage = post.imageUrls?.[0] || post.imageUrl;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div 
        className={cn(
          "bg-white w-full sm:max-w-[520px] shadow-2xl overflow-hidden flex flex-col relative animate-scale-in",
          "rounded-t-3xl sm:rounded-2xl max-h-[92vh] sm:max-h-[90vh]",
          "sm:mx-4"
        )}
        onClick={e => e.stopPropagation()}
      >
        {/* Drag Indicator (mobile) */}
        <div className="sm:hidden flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-slate-300 rounded-full" />
        </div>

        {/* Header */}
        <div className="px-4 sm:px-5 py-3 sm:py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-violet-50 to-indigo-50 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 sm:w-9 sm:h-9 bg-gradient-to-br from-violet-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-sm shadow-violet-200">
              <Repeat2 className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-[15px] sm:text-[17px] leading-none">Repost</h3>
              <p className="text-[10px] sm:text-[11px] text-slate-500 mt-0.5">Share this post to your feed</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-white/80 rounded-xl transition-all text-slate-400 hover:text-slate-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar overscroll-contain">
          {/* Your Profile + Caption */}
          <div className="px-4 sm:px-5 pt-4 pb-3">
            <div className="flex items-start gap-3 mb-3">
              <img 
                src={getAvatarUrl(user)} 
                alt={user?.name || 'You'} 
                className="w-10 h-10 sm:w-11 sm:h-11 rounded-full object-cover border-2 border-white shadow-sm shrink-0"
              />
              <div className="flex-1">
                <p className="font-bold text-slate-900 text-[13px] sm:text-[14px]">{user?.name || 'You'}</p>
                <p className="text-[10px] sm:text-[11px] text-slate-400">Posting to your feed</p>
              </div>
            </div>
            
            <textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Add your thoughts about this post..."
              className="w-full min-h-[70px] sm:min-h-[80px] max-h-[140px] text-[13px] sm:text-[14px] text-slate-800 placeholder-slate-400 bg-slate-50 border border-slate-200 rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-300 resize-none transition-all leading-relaxed"
              autoFocus
            />
          </div>

          {/* Repost Indicator */}
          <div className="px-4 sm:px-5 pb-2">
            <div className="flex items-center gap-2 text-[11px] sm:text-[12px] text-violet-600 font-semibold">
              <CornerUpRight className="w-3.5 h-3.5" />
              <span>Reposting from {post.authorName}</span>
            </div>
          </div>

          {/* Original Post Preview Card */}
          <div className="mx-4 sm:mx-5 mb-4">
            <div className="border-2 border-violet-100 rounded-2xl overflow-hidden bg-white">
              {/* Original Author Bar */}
              <div className="px-3 sm:px-4 py-2.5 sm:py-3 bg-slate-50/80 border-b border-slate-100 flex items-center gap-2.5 sm:gap-3">
                <img 
                  src={getAvatarUrl(authorData)} 
                  alt={post.authorName} 
                  className="w-8 h-8 sm:w-9 sm:h-9 rounded-full object-cover shadow-sm"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h5 className="font-bold text-[12px] sm:text-[14px] text-slate-900 truncate">
                      {post.authorName}
                    </h5>
                    {post.authorRole?.includes('Mentor') && (
                      <span className="text-[8px] sm:text-[9px] font-black uppercase bg-gradient-to-r from-indigo-600 to-violet-600 text-white px-1.5 py-0.5 rounded-md tracking-wider shrink-0">
                        PRO
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px] sm:text-[11px] text-slate-400 font-medium">
                    <span className="truncate max-w-[80px]">{post.authorRole || 'Member'}</span>
                    <span>·</span>
                    <span className="whitespace-nowrap">{post.createdAt ? formatTimeShort(post.createdAt) : ''}</span>
                  </div>
                </div>
              </div>

              {/* Post Content Preview */}
              <div className="px-3 sm:px-4 py-2.5 sm:py-3">
                {post.content && (
                  <p className="text-[12px] sm:text-[14px] text-slate-700 leading-relaxed whitespace-pre-wrap line-clamp-3 sm:line-clamp-4">
                    {post.content}
                  </p>
                )}

                {/* Code Snippet Preview */}
                {hasCode && (
                  <div className="mt-2 sm:mt-3 rounded-lg sm:rounded-xl overflow-hidden border border-slate-200">
                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900">
                      <Code2 className="w-3 h-3 text-slate-500" />
                      <span className="text-[9px] sm:text-[10px] font-medium text-slate-400">code-snippet</span>
                    </div>
                    <div className="bg-[#0d1117] px-3 py-2">
                      <pre className="text-[10px] sm:text-[11px] font-mono text-slate-300 line-clamp-2 sm:line-clamp-3 whitespace-pre overflow-hidden">
                        {post.codeSnippet}
                      </pre>
                    </div>
                  </div>
                )}

                {/* Image Preview */}
                {hasImage && (
                  <div className="mt-2 sm:mt-3 rounded-lg sm:rounded-xl overflow-hidden border border-slate-100">
                    <img 
                      src={getImageUrl(previewImage)} 
                      alt="Post" 
                      className="w-full h-[100px] sm:h-[140px] object-cover"
                    />
                    {post.imageUrls?.length > 1 && (
                      <div className="px-2 py-1.5 bg-slate-50 text-[9px] sm:text-[10px] text-slate-500 font-medium flex items-center gap-1">
                        <ImageIcon className="w-3 h-3" />
                        +{post.imageUrls.length - 1} more
                      </div>
                    )}
                  </div>
                )}

                {/* Post Stats Preview */}
                <div className="flex items-center gap-3 sm:gap-4 mt-2 sm:mt-3 pt-2 sm:pt-2.5 border-t border-slate-100">
                  <div className="flex items-center gap-1 text-[10px] sm:text-[11px] text-slate-400">
                    <Heart className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                    <span className="font-medium">{post.likes?.length || 0}</span>
                  </div>
                  <div className="flex items-center gap-1 text-[10px] sm:text-[11px] text-slate-400">
                    <MessageSquare className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                    <span className="font-medium">{post.comments?.length || 0}</span>
                  </div>
                  <div className="flex items-center gap-1 text-[10px] sm:text-[11px] text-slate-400">
                    <Bookmark className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                    <span className="font-medium">{post.saves?.length || 0}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-4 sm:px-5 py-3 sm:py-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between shrink-0">
          <button 
            onClick={onClose}
            className="px-3 sm:px-4 py-2 sm:py-2.5 text-[12px] sm:text-[13px] font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleRepost}
            disabled={reposting || success}
            className={cn(
              "flex items-center gap-1.5 sm:gap-2 px-5 sm:px-6 py-2 sm:py-2.5 text-[13px] sm:text-[14px] font-bold rounded-xl transition-all active:scale-95 shadow-sm",
              success
                ? "bg-emerald-500 text-white shadow-emerald-200"
                : "bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white shadow-violet-200"
            )}
          >
            {reposting ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Reposting...</>
            ) : success ? (
              <><Check className="w-4 h-4" /> Reposted!</>
            ) : (
              <><Repeat2 className="w-4 h-4" /> Repost Now</>
            )}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default RepostModal;
