import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  X, Search, Check, Send, Link2, CheckCheck,
  MessageSquare, Linkedin, Twitter, Github,
  MoreHorizontal, Loader2
} from 'lucide-react';
import { cn } from '../utils/cn';
import { getAvatarUrl } from '../utils/avatar';
import { messageService } from '../services/api';

const ShareModal = ({ post, onClose, onShared }) => {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [caption, setCaption] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showOther, setShowOther] = useState(false);

  const postUrl = `${window.location.origin}/post/${post._id}`;

  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const data = await messageService.getConversations();
        setConversations(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Failed to fetch conversations', err);
        setConversations([]);
      } finally {
        setLoading(false);
      }
    };
    fetchConversations();
  }, []);

  const toggleSelect = (convId) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(convId)) next.delete(convId);
      else next.add(convId);
      return next;
    });
  };

  const removeSelected = (convId) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.delete(convId);
      return next;
    });
  };

  const handleSend = async () => {
    if (selectedIds.size === 0 || sending) return;
    setSending(true);
    const messageContent = caption.trim()
      ? `${caption.trim()}\n\n${postUrl}` : postUrl;
    await Promise.allSettled(
      [...selectedIds].map(id => messageService.sendMessage(id, messageContent))
    );
    setSending(false);
    setSent(true);
    onShared?.();
    setTimeout(() => onClose(), 1200);
  };

  const copyLink = () => {
    navigator.clipboard.writeText(postUrl);
    setCopied(true);
    onShared?.();
    setTimeout(() => setCopied(false), 2000);
  };

  const formatName = (name) => {
    if (!name) return '';
    return name.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
  };

  const filtered = conversations.filter(c => {
    if (!searchQuery) return true;
    return (c.otherUser?.name || '').toLowerCase().includes(searchQuery.toLowerCase());
  });

  const selectedConvs = conversations.filter(c => selectedIds.has(c._id || c.conversationId));

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-white/80 backdrop-blur-md animate-fade-in p-4" onClick={onClose}>
      <div className="bg-white w-full max-w-[520px] rounded-xl shadow-[0_12px_28px_0_rgba(0,0,0,0.2),0_2px_4px_0_rgba(0,0,0,0.1)] overflow-hidden flex flex-col relative border border-slate-200 max-h-[85vh]" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="px-4 py-4 border-b border-slate-200 flex items-center justify-center relative bg-white shrink-0">
          <h3 className="font-bold text-slate-800 text-[20px]">Share</h3>
          <button onClick={onClose} className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-slate-100 hover:bg-slate-200 rounded-full transition-all text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {/* Caption */}
          <div className="px-4 pt-4 pb-3">
            <textarea value={caption} onChange={e => setCaption(e.target.value)} placeholder="Say something about this..." className="w-full min-h-[60px] max-h-[120px] text-[14px] text-slate-800 placeholder-slate-400 focus:outline-none resize-none py-1 bg-transparent" autoFocus />
          </div>

          {/* Selected Chips */}
          {selectedConvs.length > 0 && (
            <div className="px-4 pb-3 flex flex-wrap gap-2">
              {selectedConvs.map(c => {
                const id = c._id || c.conversationId;
                return (
                  <div key={id} className="flex items-center gap-1.5 bg-indigo-50 text-indigo-700 pl-2 pr-1 py-1 rounded-full border border-indigo-100 animate-scale-in">
                    <img src={getAvatarUrl(c.otherUser)} alt="" className="w-5 h-5 rounded-full object-cover" />
                    <span className="text-[12px] font-semibold max-w-[100px] truncate">{formatName(c.otherUser?.name)}</span>
                    <button onClick={() => removeSelected(id)} className="p-0.5 hover:bg-indigo-100 rounded-full"><X className="w-3 h-3" /></button>
                  </div>
                );
              })}
            </div>
          )}

          {/* Search */}
          <div className="px-4 pb-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search conversations..." className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-200 focus:ring-2 focus:ring-indigo-50/50 focus:outline-none rounded-xl py-2 pl-10 pr-4 text-sm font-medium text-slate-800 placeholder-slate-400" />
            </div>
          </div>

          {/* Conversation List */}
          <div className="px-2 pb-2">
            {loading ? (
              <div className="flex justify-center py-10"><div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" /></div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center py-10 text-center">
                <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center mb-3"><MessageSquare className="w-6 h-6 text-slate-300" /></div>
                <p className="text-sm text-slate-500 font-medium">{searchQuery ? 'No conversations found' : 'No conversations yet'}</p>
              </div>
            ) : (
              <div className="space-y-0.5 max-h-[300px] overflow-y-auto custom-scrollbar">
                {filtered.map(c => {
                  const id = c._id || c.conversationId;
                  const sel = selectedIds.has(id);
                  return (
                    <button key={id} onClick={() => toggleSelect(id)} className={cn("w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-left group", sel ? "bg-indigo-50 hover:bg-indigo-100/80" : "hover:bg-slate-50")}>
                      <div className="relative shrink-0">
                        <img src={getAvatarUrl(c.otherUser)} alt={c.otherUser?.name || 'User'} className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm" />
                        {c.otherUser?.isOnline && <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-white rounded-full" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-bold text-slate-900 truncate">{formatName(c.otherUser?.name) || 'Unknown'}</h4>
                        <p className="text-[12px] text-slate-400 font-medium truncate mt-0.5">{c.otherUser?.experienceLevel || 'Member'}</p>
                      </div>
                      <div className={cn("w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-all", sel ? "bg-indigo-600 border-indigo-600" : "border-slate-200 group-hover:border-slate-300")}>
                        {sel && <Check className="w-3.5 h-3.5 text-white" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="h-[1px] bg-slate-100 mx-4 my-2" />

          {/* Quick Actions */}
          <div className="px-4 pb-4">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3">Quick actions</p>
            <div className="flex items-center gap-3">
              <button onClick={copyLink} className={cn("flex items-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-semibold transition-all border", copied ? "bg-emerald-50 text-emerald-600 border-emerald-200" : "bg-slate-50 text-slate-600 hover:bg-slate-100 border-slate-100")}>
                {copied ? <CheckCheck className="w-4 h-4" /> : <Link2 className="w-4 h-4" />}
                {copied ? 'Copied!' : 'Copy link'}
              </button>
              <button onClick={() => setShowOther(!showOther)} className={cn("flex items-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-semibold transition-all border", showOther ? "bg-slate-800 text-white border-slate-800" : "bg-slate-50 text-slate-600 hover:bg-slate-100 border-slate-100")}>
                <MoreHorizontal className="w-4 h-4" /> More
              </button>
            </div>
            {showOther && (
              <div className="mt-3 flex gap-3 animate-slide-up">
                {[{ icon: <Linkedin className="w-5 h-5" />, label: "LinkedIn", color: "bg-[#0077b5] hover:bg-[#006da3]" },
                  { icon: <Twitter className="w-5 h-5" />, label: "Twitter", color: "bg-[#1DA1F2] hover:bg-[#1a91da]" },
                  { icon: <Github className="w-5 h-5" />, label: "GitHub", color: "bg-[#24292e] hover:bg-[#1b1f23]" }
                ].map((ext, i) => (
                  <button key={i} onClick={() => {
                    const text = caption.trim() || 'Check out this post!';
                    const urls = { LinkedIn: `https://linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(postUrl)}`, Twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(postUrl)}`, GitHub: postUrl };
                    window.open(urls[ext.label], '_blank');
                  }} className={cn("flex items-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-semibold text-white transition-all", ext.color)}>
                    {ext.icon} {ext.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Send Footer */}
        <div className="px-4 py-3 border-t border-slate-100 bg-slate-50/50 shrink-0">
          <button onClick={handleSend} disabled={selectedIds.size === 0 || sending || sent} className={cn("w-full py-3 rounded-xl font-bold text-[15px] transition-all flex items-center justify-center gap-2 active:scale-[0.98]", sent ? "bg-emerald-500 text-white" : selectedIds.size > 0 ? "bg-indigo-600 text-white hover:bg-indigo-700 shadow-md shadow-indigo-100" : "bg-slate-100 text-slate-400 cursor-not-allowed")}>
            {sending ? <><Loader2 className="w-5 h-5 animate-spin" /> Sending...</> :
             sent ? <><CheckCheck className="w-5 h-5" /> Sent!</> :
             <><Send className="w-4 h-4" /> Send{selectedIds.size > 0 ? ` to ${selectedIds.size} conversation${selectedIds.size > 1 ? 's' : ''}` : ''}</>}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default ShareModal;
