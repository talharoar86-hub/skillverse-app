import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Save, FileCode2, ImageIcon, Pencil, Loader2 } from 'lucide-react';
import { getAvatarUrl, getImageUrl } from '../utils/avatar';
import { cn } from '../utils/cn';

const EditPostModal = ({ post, user, onClose, onSave }) => {
  const [content, setContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (post) {
      setContent(post.content || '');
    }
  }, [post]);

  const handleSave = async () => {
    if (!content.trim() || isSaving) return;
    setIsSaving(true);
    try {
      await onSave(content);
    } finally {
      setIsSaving(false);
    }
  };

  const hasImages = post?.imageUrls?.length > 0 || post?.imageUrl;
  const hasCode = !!post?.codeSnippet;
  const hasMedia = hasImages || hasCode;
  const charCount = content.length;

  if (!post) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center animate-fade-in" onClick={onClose}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-slate-900/20 backdrop-blur-md" />
      
      {/* Modal */}
      <div 
        className="relative bg-white/90 backdrop-blur-2xl w-full sm:max-w-[540px] h-auto sm:max-h-[85vh] sm:rounded-3xl rounded-t-3xl shadow-2xl shadow-indigo-500/10 overflow-hidden flex flex-col animate-spring-up"
        onClick={e => e.stopPropagation()}
      >
        {/* Gradient accent bar */}
        <div className="h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500 bg-[length:200%_100%] animate-shimmer shrink-0" />

        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100/80 flex items-center justify-between shrink-0 bg-white/50">
          <div className="w-9" />
          <h3 className="font-extrabold text-transparent bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 bg-clip-text bg-[length:200%_100%] animate-shimmer text-xl tracking-tight">
            Edit Post
          </h3>
          <button 
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center bg-slate-100/80 hover:bg-gradient-to-r hover:from-rose-50 hover:to-pink-50 hover:text-rose-500 rounded-xl transition-all duration-300 text-slate-500 active:scale-90"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-5 space-y-4">
          {/* User Info */}
          <div className="flex items-center gap-3">
            <div className="relative shrink-0">
              <div className="absolute -inset-0.5 bg-gradient-to-br from-indigo-500/30 to-purple-500/30 rounded-full" />
              <img 
                src={getAvatarUrl(user)} 
                alt={user?.name || 'User'} 
                className="relative w-10 h-10 rounded-full object-cover ring-2 ring-white shadow-sm" 
              />
            </div>
            <div>
              <h4 className="font-bold text-[15px] leading-tight text-slate-900">{user?.name}</h4>
              <div className="flex items-center gap-1.5 mt-1">
                <span className="bg-gradient-to-r from-indigo-50 to-purple-50 text-indigo-600 text-[11px] font-bold px-2.5 py-0.5 rounded-lg border border-indigo-100/50 flex items-center gap-1">
                  <Pencil className="w-3 h-3" />
                  Editing
                </span>
              </div>
            </div>
          </div>

          {/* Textarea */}
          <div className="relative">
            <textarea 
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="What's on your mind?"
              className="w-full min-h-[160px] bg-slate-50/50 text-[17px] text-slate-800 placeholder:text-slate-400 focus:outline-none resize-none py-4 px-4 rounded-2xl border border-slate-100 focus:border-indigo-200 focus:bg-white transition-all duration-300 leading-relaxed focus:shadow-lg focus:shadow-indigo-500/5"
              autoFocus
            />
            {/* Character count */}
            {charCount > 0 && (
              <div className="absolute bottom-3 right-3 text-[11px] font-medium text-slate-400 animate-fade-in">
                {charCount > 2000 ? (
                  <span className="text-rose-500 font-bold">{charCount}/2000</span>
                ) : (
                  <span>{charCount}</span>
                )}
              </div>
            )}
          </div>

          {/* Media Previews */}
          {hasMedia && (
            <div className="animate-fade-in space-y-3">
              {/* Image previews */}
              {hasImages && (
                <div className="space-y-2">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                    <ImageIcon className="w-3.5 h-3.5 text-emerald-500" />
                    Attached Images
                  </span>
                  <div className="flex gap-2 overflow-x-auto custom-scrollbar pb-1">
                    {(post.imageUrls?.length > 0 ? post.imageUrls : [post.imageUrl]).map((img, idx) => (
                      <div 
                        key={idx}
                        className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-xl overflow-hidden border border-slate-200 shadow-sm shrink-0 group"
                      >
                        <img 
                          src={getImageUrl(img)} 
                          alt={`Attached ${idx + 1}`}
                          className="w-full h-full object-cover opacity-80"
                        />
                        {/* Read-only overlay */}
                        <div className="absolute inset-0 bg-slate-900/30 flex items-center justify-center">
                          <span className="text-white text-[9px] font-bold bg-black/40 backdrop-blur-sm px-2 py-0.5 rounded-md">
                            Read-only
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Code snippet preview */}
              {hasCode && (
                <div className="space-y-2">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                    <FileCode2 className="w-3.5 h-3.5 text-indigo-500" />
                    Code Snippet
                  </span>
                  <div className="bg-[#0d1117] rounded-xl overflow-hidden border border-white/5 shadow-inner relative">
                    <div className="flex items-center gap-1.5 px-3 py-2 bg-gradient-to-r from-slate-800 to-slate-800/80 border-b border-white/5">
                      <div className="w-2 h-2 rounded-full bg-rose-500/60" />
                      <div className="w-2 h-2 rounded-full bg-amber-500/60" />
                      <div className="w-2 h-2 rounded-full bg-emerald-500/60" />
                      <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest ml-1">Read-only</span>
                    </div>
                    <pre className="text-indigo-300/70 font-mono text-xs leading-relaxed p-3 max-h-[100px] overflow-hidden">
                      <code>{post.codeSnippet}</code>
                    </pre>
                    {/* Fade out at bottom */}
                    <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-[#0d1117] to-transparent" />
                  </div>
                </div>
              )}

              {/* General notice */}
              <div className="bg-amber-50/50 border border-amber-100 rounded-xl px-4 py-3 flex items-center gap-2.5 text-amber-700">
                <div className="w-5 h-5 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                  <span className="text-[11px] font-bold">!</span>
                </div>
                <span className="text-[12px] font-semibold">
                  Media and code cannot be modified in quick-edit.
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="shrink-0 border-t border-slate-100/80 bg-white/50 backdrop-blur-xl px-5 py-4 flex items-center justify-end gap-3">
          <button 
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl text-[14px] font-bold text-slate-600 hover:bg-slate-100 transition-all duration-300 active:scale-95"
          >
            Cancel
          </button>
          <button 
            onClick={handleSave}
            disabled={!content.trim() || isSaving}
            className={cn(
              "px-8 py-2.5 rounded-xl text-[14px] font-bold transition-all duration-300 flex items-center gap-2 active:scale-95",
              !content.trim() || isSaving
                ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                : "bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 bg-[length:200%_100%] text-white hover:shadow-xl hover:shadow-indigo-500/25 animate-shimmer"
            )}
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save Changes
              </>
            )}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default EditPostModal;
