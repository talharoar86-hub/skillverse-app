import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Send, Loader2, GraduationCap } from 'lucide-react';
import { mentorshipService } from '../services/api';
import { cn } from '../utils/cn';

const RequestMentorshipModal = ({ mentor, onClose, onSuccess }) => {
  const [selectedSkill, setSelectedSkill] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);

  const skills = mentor?.skills || [];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedSkill || sending) return;

    setSending(true);
    setError(null);
    try {
      await mentorshipService.sendRequest(mentor._id, selectedSkill, message);
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send request');
    } finally {
      setSending(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-white/80 backdrop-blur-md animate-fade-in p-4" onClick={onClose}>
      <div
        className="bg-white w-full max-w-[480px] rounded-2xl shadow-[0_12px_28px_0_rgba(0,0,0,0.2),0_2px_4px_0_rgba(0,0,0,0.1)] overflow-hidden flex flex-col relative border border-slate-200"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-3 bg-white">
          <div className="w-10 h-10 rounded-xl bg-violet-50 flex items-center justify-center shrink-0">
            <GraduationCap className="w-5 h-5 text-violet-600" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-black text-slate-900 text-[15px]">Request Mentorship</h3>
            <p className="text-[11px] text-slate-400 font-medium truncate">
              {mentor?.name ? `Connect with ${mentor.name}` : 'Send a mentorship request'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 bg-slate-100 hover:bg-slate-200 rounded-full transition-all text-slate-600"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-5">
          {/* Skill Selector */}
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">
              Select Skill to Learn
            </label>
            <div className="flex flex-wrap gap-2">
              {skills.length > 0 ? skills.map(skill => (
                <button
                  key={skill}
                  type="button"
                  onClick={() => setSelectedSkill(skill)}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-xs font-bold border transition-all active:scale-95',
                    selectedSkill === skill
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm shadow-indigo-200'
                      : 'bg-slate-50 text-slate-700 border-slate-100 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-100'
                  )}
                >
                  {skill}
                </button>
              )) : (
                <p className="text-xs text-slate-400 italic">No skills listed for this mentor.</p>
              )}
            </div>
          </div>

          {/* Optional Message */}
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">
              Message (Optional)
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Introduce yourself and what you'd like to learn..."
              rows={3}
              className="w-full text-sm text-slate-800 placeholder-slate-400 bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none transition-all"
            />
          </div>

          {/* Error */}
          {error && (
            <p className="text-xs font-bold text-rose-600 bg-rose-50 px-3 py-2 rounded-lg border border-rose-100">{error}</p>
          )}

          {/* Actions */}
          <div className="flex items-center gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 text-xs font-bold text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-100 transition-all active:scale-95"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!selectedSkill || sending}
              className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-all active:scale-95 shadow-sm shadow-indigo-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {sending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
              {sending ? 'Sending...' : 'Send Request'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};

export default RequestMentorshipModal;
