import React, { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { 
  Image as ImageIcon, 
  Code, 
  Sparkles, 
  HelpCircle, 
  X, 
  Hash,
  BookOpen,
  PenLine,
  Globe,
  Loader2
} from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { postService } from '../services/api';
import { cn } from '../utils/cn';
import { getAvatarUrl } from '../utils/avatar';

const CreatePost = ({ onPostCreated }) => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [content, setContent] = useState('');
  const [type, setType] = useState('Post');
  const [codeSnippet, setCodeSnippet] = useState('');
  const [showCodeInput, setShowCodeInput] = useState(false);
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState('');
  const [imageFiles, setImageFiles] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim() && imageFiles.length === 0) return;

    setIsSubmitting(true);
    try {
      let uploadedUrls = [];
      
      if (imageFiles.length > 0) {
        const uploadPromises = imageFiles.map(async (file) => {
          const formData = new FormData();
          formData.append('image', file);
          const uploadRes = await postService.uploadImage(formData);
          return uploadRes.imageUrl;
        });
        uploadedUrls = await Promise.all(uploadPromises);
      }

      const newPost = await postService.createPost({
        content,
        type,
        codeSnippet: showCodeInput ? codeSnippet : '',
        tags,
        imageUrls: uploadedUrls,
        skills: tags
      });

      onPostCreated(newPost);
      resetForm();
    } catch (err) {
      console.error('Post creation failed', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setContent('');
    setType('Post');
    setCodeSnippet('');
    setShowCodeInput(false);
    setTags([]);
    setImageFiles([]);
    setImagePreviews([]);
    setIsOpen(false);
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreviews(prev => [...prev, reader.result]);
        setImageFiles(prev => [...prev, file]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index) => {
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
    setImageFiles(prev => prev.filter((_, i) => i !== index));
  };

  const addTag = (e) => {
    if ((e.key === 'Enter' || e.key === ',') && tagInput.trim()) {
      e.preventDefault();
      if (!tags.includes(tagInput.trim())) {
        setTags([...tags, tagInput.trim()]);
      }
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove) => {
    setTags(tags.filter(t => t !== tagToRemove));
  };

  const postTypes = [
    { id: 'Post', label: 'Update', icon: Sparkles, activeBg: 'bg-emerald-500/10 text-emerald-600 border-emerald-300', hoverBg: 'hover:bg-emerald-50 hover:border-emerald-200' },
    { id: 'Question', label: 'Question', icon: HelpCircle, activeBg: 'bg-orange-500/10 text-orange-600 border-orange-300', hoverBg: 'hover:bg-orange-50 hover:border-orange-200' },
    { id: 'Guide', label: 'Guide', icon: BookOpen, activeBg: 'bg-violet-500/10 text-violet-600 border-violet-300', hoverBg: 'hover:bg-violet-50 hover:border-violet-200' },
  ];

  const charCount = content.length;
  const canPost = content.trim() || imageFiles.length > 0;

  return (
    <>
      {/* ===== INVITATION CARD ===== */}
      <div className="relative mb-6 group">
        {/* Gradient border glow on hover */}
        <div className="absolute -inset-[1px] bg-gradient-to-r from-indigo-500/0 via-purple-500/0 to-indigo-500/0 rounded-[23px] group-hover:from-indigo-500/20 group-hover:via-purple-500/20 group-hover:to-indigo-500/20 transition-all duration-700 blur-[1px]" />
        
        <div className="relative bg-white/80 backdrop-blur-xl rounded-[22px] border border-white/60 shadow-lg shadow-indigo-500/[0.03] overflow-hidden">
          {/* Gradient top accent bar */}
          <div className="h-[3px] bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500 bg-[length:200%_100%] animate-shimmer" />
          
          <div className="p-5">
            <div className="flex gap-4 items-center">
              {/* Avatar with gradient ring */}
              <div className="relative shrink-0">
                <div className="absolute -inset-1 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full opacity-20 group-hover:opacity-40 transition-opacity duration-500 blur-sm" />
                <img 
                  src={getAvatarUrl(user)} 
                  className="relative w-11 h-11 rounded-full shadow-md ring-2 ring-white object-cover" 
                  alt="User" 
                />
                <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-emerald-400 border-2 border-white rounded-full shadow-sm" />
              </div>

              {/* Prompt button */}
              <button 
                onClick={() => setIsOpen(true)}
                className="flex-1 bg-slate-50/80 hover:bg-gradient-to-r hover:from-indigo-50 hover:to-purple-50 transition-all duration-300 rounded-2xl px-5 py-3.5 text-left text-slate-400 hover:text-slate-500 font-medium text-sm border border-slate-100 hover:border-indigo-100 group-hover:shadow-inner"
              >
                <span className="flex items-center gap-2">
                  <PenLine className="w-4 h-4 text-slate-300 group-hover:text-indigo-400 transition-colors" />
                  What's on your mind, {user?.name?.split(' ')[0]}?
                </span>
              </button>
            </div>
            
            {/* Action pills */}
            <div className="flex items-center mt-4 pt-4 border-t border-slate-100/80 gap-2">
              {postTypes.map(pt => (
                <button 
                  key={pt.id}
                  onClick={() => { setType(pt.id); setIsOpen(true); }}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl transition-all duration-300 border border-transparent",
                    pt.hoverBg
                  )}
                >
                  <pt.icon className="w-4 h-4" />
                  <span className="text-xs font-bold">{pt.label}</span>
                </button>
              ))}
              <button 
                onClick={() => { setShowCodeInput(true); setIsOpen(true); }}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 hover:bg-indigo-50 hover:border-indigo-100 rounded-xl transition-all duration-300 border border-transparent"
              >
                <Code className="w-4 h-4 text-indigo-500" />
                <span className="text-xs font-bold text-slate-600">Snippet</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ===== CREATION MODAL ===== */}
      {isOpen && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center animate-fade-in">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-slate-900/20 backdrop-blur-md" 
            onClick={() => setIsOpen(false)} 
          />
          
          {/* Modal */}
          <div className="relative bg-white/90 backdrop-blur-2xl w-full sm:max-w-[540px] h-[92vh] sm:h-auto sm:max-h-[88vh] shadow-2xl shadow-indigo-500/10 sm:rounded-3xl rounded-t-3xl overflow-hidden animate-spring-up flex flex-col">
            {/* Gradient accent bar */}
            <div className="h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500 bg-[length:200%_100%] animate-shimmer shrink-0" />

            {/* Header */}
            <div className="px-5 py-4 border-b border-slate-100/80 flex items-center justify-between shrink-0 bg-white/50">
              <div className="w-9" />
              <h3 className="font-extrabold text-transparent bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 bg-clip-text bg-[length:200%_100%] animate-shimmer text-xl tracking-tight">
                Create Post
              </h3>
              <button 
                onClick={() => setIsOpen(false)}
                className="w-9 h-9 flex items-center justify-center bg-slate-100/80 hover:bg-gradient-to-r hover:from-rose-50 hover:to-pink-50 hover:text-rose-500 rounded-xl transition-all duration-300 text-slate-500 active:scale-90"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0 overflow-hidden">
              {/* Scrollable content */}
              <div className="flex-1 overflow-y-auto custom-scrollbar p-5 space-y-4">
                {/* User Row + Type Selector */}
                <div className="flex items-start gap-3">
                  <div className="relative shrink-0">
                    <div className="absolute -inset-0.5 bg-gradient-to-br from-indigo-500/30 to-purple-500/30 rounded-full" />
                    <img 
                      src={getAvatarUrl(user)} 
                      alt={user?.name || 'User'} 
                      className="relative w-10 h-10 rounded-full object-cover ring-2 ring-white shadow-sm" 
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="font-bold text-slate-900 text-[15px] leading-tight block">{user?.name}</span>
                    
                    {/* Pill-style type selector */}
                    <div className="flex items-center gap-1.5 mt-2 bg-slate-50/80 rounded-xl p-1 border border-slate-100">
                      {postTypes.map(pt => (
                        <button
                          key={pt.id}
                          type="button"
                          onClick={() => setType(pt.id)}
                          className={cn(
                            "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-bold transition-all duration-300 border",
                            type === pt.id 
                              ? pt.activeBg 
                              : cn("text-slate-500 border-transparent", pt.hoverBg)
                          )}
                        >
                          <pt.icon className="w-3.5 h-3.5" />
                          {pt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Main Textarea */}
                <div className="relative">
                  <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder={
                      type === 'Question' ? "What do you need help with?" : 
                      type === 'Guide' ? "Share your knowledge and guide others..." : 
                      `What's on your mind, ${user?.name?.split(' ')[0]}?`
                    }
                    className={cn(
                      "w-full min-h-[120px] bg-transparent text-slate-900 placeholder:text-slate-400 text-[18px] focus:outline-none leading-relaxed resize-none py-2 pr-16",
                      "focus:placeholder:text-slate-300 transition-colors"
                    )}
                    autoFocus
                  />
                  {/* Character count */}
                  {charCount > 0 && (
                    <div className="absolute bottom-2 right-0 text-[11px] font-medium text-slate-400 animate-fade-in">
                      {charCount > 2000 ? (
                        <span className="text-rose-500 font-bold">{charCount}/2000</span>
                      ) : (
                        <span>{charCount}</span>
                      )}
                    </div>
                  )}
                </div>

                {/* Code Snippet Input */}
                {showCodeInput && (
                  <div className="animate-scale-in shrink-0">
                    <div className="bg-[#0d1117] rounded-2xl overflow-hidden border border-white/5 shadow-xl">
                      {/* Code header */}
                      <div className="flex items-center justify-between px-4 py-2.5 bg-gradient-to-r from-slate-800 to-slate-800/80 border-b border-white/5">
                        <div className="flex items-center gap-2">
                          <div className="flex gap-1.5">
                            <div className="w-2.5 h-2.5 rounded-full bg-rose-500/60" />
                            <div className="w-2.5 h-2.5 rounded-full bg-amber-500/60" />
                            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/60" />
                          </div>
                          <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest ml-1">Source Code</span>
                        </div>
                        <button 
                          type="button"
                          onClick={() => setShowCodeInput(false)}
                          className="text-slate-500 hover:text-rose-400 transition-colors p-1 hover:bg-white/5 rounded-md"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                      {/* Code textarea */}
                      <textarea
                        value={codeSnippet}
                        onChange={(e) => setCodeSnippet(e.target.value)}
                        placeholder="// Paste your code here..."
                        className="w-full h-[180px] bg-[#0d1117] text-indigo-300 font-mono text-sm focus:outline-none resize-none p-4 overflow-y-auto custom-scrollbar placeholder:text-slate-600 leading-relaxed"
                      />
                    </div>
                  </div>
                )}

                {/* Image Previews */}
                {imagePreviews.length > 0 && (
                  <div className="animate-fade-in shrink-0">
                    <div className={cn(
                      "grid gap-2",
                      imagePreviews.length === 1 ? "grid-cols-1" :
                      imagePreviews.length === 2 ? "grid-cols-2" :
                      "grid-cols-2 sm:grid-cols-3"
                    )}>
                      {imagePreviews.map((preview, index) => (
                        <div 
                          key={index} 
                          className={cn(
                            "relative rounded-2xl overflow-hidden border border-slate-200 shadow-sm group/img",
                            imagePreviews.length === 1 ? "aspect-video" : "aspect-square"
                          )}
                        >
                          <img src={preview} alt={`Preview ${index}`} className="w-full h-full object-cover" />
                          {/* Hover overlay */}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover/img:opacity-100 transition-opacity duration-300" />
                          {/* Delete button */}
                          <button 
                            type="button"
                            onClick={() => removeImage(index)}
                            className="absolute top-2 right-2 w-8 h-8 bg-white/90 backdrop-blur-md text-slate-700 rounded-xl hover:bg-rose-500 hover:text-white transition-all duration-300 shadow-lg flex items-center justify-center opacity-0 group-hover/img:opacity-100 scale-90 group-hover/img:scale-100"
                          >
                            <X className="w-4 h-4" />
                          </button>
                          {/* Image number badge */}
                          {imagePreviews.length > 1 && (
                            <div className="absolute bottom-2 left-2 bg-black/40 backdrop-blur-md text-white text-[10px] font-bold px-2 py-0.5 rounded-lg opacity-0 group-hover/img:opacity-100 transition-opacity">
                              {index + 1}/{imagePreviews.length}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Tags */}
                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 animate-fade-in shrink-0">
                    {tags.map(tag => (
                      <span 
                        key={tag} 
                        className="bg-gradient-to-r from-indigo-50 to-purple-50 text-indigo-600 px-3 py-1.5 rounded-xl text-[13px] font-bold flex items-center gap-1.5 border border-indigo-100/50 shadow-sm animate-slide-in-right hover:shadow-md hover:border-indigo-200 transition-all"
                      >
                        #{tag}
                        <button 
                          type="button" 
                          onClick={() => removeTag(tag)} 
                          className="hover:text-rose-500 transition-colors ml-0.5 hover:bg-rose-50 rounded-full p-0.5"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Bottom toolbar + Submit */}
              <div className="shrink-0 border-t border-slate-100/80 bg-white/50 backdrop-blur-xl">
                {/* Toolbar */}
                <div className="px-5 py-3 flex items-center justify-between">
                  <span className="text-[13px] font-bold text-slate-700 flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5 text-slate-400" />
                    Add to your post
                  </span>
                  <div className="flex items-center gap-1">
                    {/* Image button */}
                    <button 
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="p-2.5 hover:bg-emerald-50 rounded-xl transition-all duration-300 group relative hover:shadow-md hover:shadow-emerald-500/10"
                      title="Add Image"
                    >
                      <ImageIcon className="w-5 h-5 text-emerald-500 group-hover:scale-110 transition-transform" />
                      <span className="absolute -top-9 left-1/2 -translate-x-1/2 px-2.5 py-1 bg-slate-800 text-white text-[10px] font-bold rounded-lg opacity-0 group-hover:opacity-100 transition-all whitespace-nowrap shadow-lg">
                        Photo
                      </span>
                    </button>
                    <input type="file" ref={fileInputRef} onChange={handleImageChange} accept="image/*" className="hidden" multiple />
                    
                    {/* Code button */}
                    <button 
                      type="button"
                      onClick={() => setShowCodeInput(true)}
                      className="p-2.5 hover:bg-indigo-50 rounded-xl transition-all duration-300 group relative hover:shadow-md hover:shadow-indigo-500/10"
                      title="Add Code"
                    >
                      <Code className="w-5 h-5 text-indigo-500 group-hover:scale-110 transition-transform" />
                      <span className="absolute -top-9 left-1/2 -translate-x-1/2 px-2.5 py-1 bg-slate-800 text-white text-[10px] font-bold rounded-lg opacity-0 group-hover:opacity-100 transition-all whitespace-nowrap shadow-lg">
                        Code
                      </span>
                    </button>

                    {/* Tag input */}
                    <div className="relative">
                      <input
                        type="text"
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        onKeyDown={addTag}
                        placeholder="#"
                        className="w-10 h-10 p-2 text-center bg-transparent hover:bg-sky-50 rounded-xl transition-all duration-300 text-slate-400 focus:outline-none focus:text-sky-600 focus:w-32 focus:bg-sky-50/50 font-bold focus:shadow-md focus:shadow-sky-500/10"
                        title="Add Skills"
                      />
                      <Hash className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 text-sky-400 pointer-events-none" />
                    </div>
                  </div>
                </div>

                {/* Submit button */}
                <div className="px-5 pb-5">
                  <button 
                    type="submit"
                    disabled={isSubmitting || !canPost}
                    className={cn(
                      "w-full py-3 rounded-2xl font-bold text-[15px] transition-all duration-300 flex items-center justify-center gap-2",
                      isSubmitting || !canPost
                        ? "bg-slate-100 text-slate-400 cursor-not-allowed" 
                        : "bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 bg-[length:200%_100%] text-white hover:shadow-xl hover:shadow-indigo-500/25 active:scale-[0.98] animate-shimmer"
                    )}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Posting...
                      </>
                    ) : (
                      'Post'
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </>
  );
};

export default CreatePost;
