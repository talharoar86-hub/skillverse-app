import React, { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  X, Camera, Github, Linkedin, Twitter, Globe,
  User, Briefcase, Target, Loader2, CheckCircle2,
  ChevronRight
} from 'lucide-react';
import { profileService } from '../services/api';
import { useAuth } from '../auth/AuthContext';
import { API_BASE_URL } from '../config';
import { getAvatarUrl } from '../utils/avatar';

const EXPERIENCE_LEVELS = ['Beginner', 'Intermediate', 'Advanced / Expert'];

// ── Tab definitions ─────────────────────────────────────────────────────────
const TABS = [
  { id: 'profile', label: 'Edit Profile', Icon: User },
  { id: 'work', label: 'Expertise', Icon: Briefcase },
  { id: 'links', label: 'Social Links', Icon: Globe },
];

// ── Reusable field components ────────────────────────────────────────────────
const FieldLabel = ({ children }) => (
  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
    {children}
  </label>
);

const TextInput = ({ value, onChange, placeholder, type = 'text', prefix }) => (
  <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl overflow-hidden focus-within:border-indigo-400 focus-within:ring-2 focus-within:ring-indigo-50 transition-all">
    {prefix && (
      <span className="pl-3 pr-1 text-slate-400 text-sm font-medium select-none">{prefix}</span>
    )}
    <input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className="flex-1 px-3 py-2.5 bg-transparent text-sm text-slate-800 placeholder-slate-400 outline-none"
    />
  </div>
);

const TagInput = ({ label, value, onChange, placeholder }) => {
  const [raw, setRaw] = useState(Array.isArray(value) ? value.join(', ') : value || '');

  const handleBlur = () => {
    const parsed = raw.split(',').map(s => s.trim()).filter(Boolean);
    onChange(parsed);
  };

  return (
    <div>
      <FieldLabel>{label}</FieldLabel>
      <textarea
        rows={2}
        value={raw}
        onChange={e => setRaw(e.target.value)}
        onBlur={handleBlur}
        placeholder={placeholder}
        className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 outline-none resize-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50 transition-all"
      />
      {raw && (
        <div className="flex flex-wrap gap-1.5 mt-2">
          {raw.split(',').map(s => s.trim()).filter(Boolean).map(tag => (
            <span key={tag} className="px-2.5 py-0.5 bg-indigo-50 text-indigo-700 rounded-full text-[11px] font-bold border border-indigo-100">
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

// ════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ════════════════════════════════════════════════════════════════════════════
const EditProfileModal = ({ isOpen, onClose, onUpdate }) => {
  const { user, updateUser } = useAuth();

  const [activeTab, setActiveTab] = useState('profile');
  const [isSaving, setIsSaving] = useState(false);
  const [savedTab, setSavedTab] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(getAvatarUrl(user));
  const [avatarUploading, setAvatarUploading] = useState(false);

  const [formData, setFormData] = useState({
    name: user?.name || '',
    bio: user?.bio || '',
    experienceLevel: user?.experienceLevel || EXPERIENCE_LEVELS[0],
    skills: user?.skills || [],
    learningGoals: user?.learningGoals || [],
    socialLinks: {
      github: user?.socialLinks?.github || '',
      linkedin: user?.socialLinks?.linkedin || '',
      twitter: user?.socialLinks?.twitter || '',
      website: user?.socialLinks?.website || '',
    },
  });

  const fileRef = useRef(null);

  if (!isOpen) return null;

  const patch = (key, val) => setFormData(prev => ({ ...prev, [key]: val }));
  const patchLinks = (key, val) =>
    setFormData(prev => ({ ...prev, socialLinks: { ...prev.socialLinks, [key]: val } }));

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setAvatarPreview(URL.createObjectURL(file));
    setAvatarUploading(true);
    try {
      const fd = new FormData();
      fd.append('avatar', file);
      const res = await profileService.uploadAvatar(fd);
      const fullUrl = `${API_BASE_URL}${res.avatarUrl}`;
      setAvatarPreview(fullUrl);
      updateUser({ avatarUrl: res.avatarUrl });
    } catch {
      alert('Avatar upload failed. Please try again.');
    } finally {
      setAvatarUploading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const updates = {
        name: formData.name,
        bio: formData.bio,
        experienceLevel: formData.experienceLevel,
        skills: formData.skills,
        learningGoals: formData.learningGoals,
        socialLinks: formData.socialLinks,
      };
      const updatedUser = await profileService.updateProfile(user._id, updates);
      updateUser(updatedUser);
      if (onUpdate) onUpdate(updatedUser);
      setSavedTab(activeTab);
      setTimeout(() => {
        setSavedTab(null);
        onClose();
      }, 900);
    } catch {
      alert('Could not save changes. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  // ── Avatar initials fallback ─────────────────────────────────────────────
  const initials = (user?.name || 'U')
    .split(' ')
    .map(w => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  // ── Tab content ──────────────────────────────────────────────────────────
  const renderTab = () => {
    if (activeTab === 'profile') return (
      <div className="space-y-5">
        <div>
          <FieldLabel>Display Name</FieldLabel>
          <TextInput
            value={formData.name}
            onChange={e => patch('name', e.target.value)}
            placeholder="Your full name"
          />
        </div>
        <div>
          <FieldLabel>Bio</FieldLabel>
          <textarea
            rows={4}
            value={formData.bio}
            onChange={e => patch('bio', e.target.value)}
            placeholder="Describe yourself — what you build, love, and aspire to."
            className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 outline-none resize-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50 transition-all"
          />
          <p className="text-[11px] text-slate-400 mt-1 text-right">{formData.bio.length} / 300</p>
        </div>
        <div>
          <FieldLabel>Experience Level</FieldLabel>
          <div className="grid grid-cols-3 gap-2">
            {EXPERIENCE_LEVELS.map(lvl => (
              <button
                key={lvl}
                type="button"
                onClick={() => patch('experienceLevel', lvl)}
                className={`py-2.5 rounded-xl text-xs font-bold border transition-all ${
                  formData.experienceLevel === lvl
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-200'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-indigo-300'
                }`}
              >
                {lvl.split(' ')[0]}
              </button>
            ))}
          </div>
        </div>
        <div>
          <FieldLabel>Primary Goal</FieldLabel>
          <div className="flex items-center gap-2 p-3 bg-slate-50 border border-slate-200 rounded-xl">
            <Target className="w-4 h-4 text-indigo-500" />
            <span className="text-sm font-bold text-slate-700 capitalize">
              {user?.goal || 'Member'}
            </span>
            <span className="ml-auto text-[10px] font-bold text-slate-400 border border-slate-200 px-2 py-0.5 rounded-md uppercase tracking-tighter">
              Fixed
            </span>
          </div>
          <p className="text-[10px] text-slate-400 mt-2 italic px-1">
            * Your primary goal is set during onboarding and cannot be changed here.
          </p>
        </div>
      </div>
    );

    if (activeTab === 'work') return (
      <div className="space-y-5">
        <TagInput
          label="Expertise / Skills"
          value={formData.skills}
          onChange={v => patch('skills', v)}
          placeholder="React, Node.js, Python, UX Design…"
        />
        <TagInput
          label="Learning Goals"
          value={formData.learningGoals}
          onChange={v => patch('learningGoals', v)}
          placeholder="Machine Learning, System Design, iOS Dev…"
        />
        <p className="text-[11px] text-slate-400 leading-relaxed">
          💡 Separate items with commas. These power your SkillVerse match score and feed.
        </p>
      </div>
    );

    if (activeTab === 'links') return (
      <div className="space-y-4">
        {[
          { key: 'github', Icon: Github, label: 'GitHub', placeholder: 'username', prefix: 'github.com/' },
          { key: 'linkedin', Icon: Linkedin, label: 'LinkedIn', placeholder: 'profile URL', prefix: null },
          { key: 'twitter', Icon: Twitter, label: 'Twitter / X', placeholder: 'handle', prefix: '@' },
          { key: 'website', Icon: Globe, label: 'Personal Website', placeholder: 'https://', prefix: null },
        ].map(({ key, Icon, label, placeholder, prefix }) => (
          <div key={key}>
            <FieldLabel>
              <span className="flex items-center gap-1.5">
                <Icon className="w-3.5 h-3.5" /> {label}
              </span>
            </FieldLabel>
            <TextInput
              value={formData.socialLinks[key]}
              onChange={e => patchLinks(key, e.target.value)}
              placeholder={placeholder}
              prefix={prefix}
            />
          </div>
        ))}
      </div>
    );
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/55 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal Shell */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[92vh] flex flex-col overflow-hidden animate-fade-in">

        {/* ── Cover band ────────────────────────────── */}
        <div className="h-28 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 relative rounded-t-2xl overflow-hidden shrink-0">
          <div
            className="absolute inset-0 opacity-30"
            style={{
              backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.15) 1px, transparent 0)',
              backgroundSize: '18px 18px',
            }}
          />
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 w-8 h-8 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ── Avatar row — sits below cover band using negative margin ── */}
        <div className="px-6 flex items-end gap-4 -mt-10 mb-1 shrink-0 relative z-10">
          {/* Avatar */}
          <div className="relative group w-20 h-20 shrink-0">
            {/* White ring */}
            <div className="w-20 h-20 rounded-full bg-white p-[3px] shadow-xl">
              <div className="w-full h-full rounded-full bg-indigo-100 overflow-hidden flex items-center justify-center">
                {avatarPreview ? (
                  <img
                    src={avatarPreview}
                    alt={user?.name}
                    className="w-full h-full object-cover"
                    onError={e => { e.target.style.display = 'none'; }}
                  />
                ) : (
                  <span className="text-xl font-black text-indigo-600">{initials}</span>
                )}
              </div>
            </div>
            {/* Camera overlay */}
            <label className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
              {avatarUploading
                ? <Loader2 className="w-5 h-5 text-white animate-spin" />
                : <Camera className="w-5 h-5 text-white" />
              }
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarChange}
              />
            </label>
          </div>

          {/* Name + role beside the avatar (in the white zone below banner) */}
          <div className="pb-1">
            <p className="text-base font-black text-slate-900 leading-tight">{user?.name}</p>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
              {user?.experienceLevel || 'SkillVerse Member'}
            </p>
          </div>
        </div>



        {/* ── Tab bar ───────────────────────────────────────────────── */}
        <div className="flex border-b border-slate-100 bg-white shrink-0 px-4 pt-1.5">
          {TABS.map(({ id, label, Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold border-b-2 mr-1 transition-all ${
                activeTab === id
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
              {savedTab === id && (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 ml-0.5" />
              )}
            </button>
          ))}
        </div>

        {/* ── Form body ─────────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {renderTab()}
        </div>

        {/* ── Footer ────────────────────────────────────────────────── */}
        <div className="shrink-0 px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 text-sm font-bold text-slate-500 hover:text-slate-700 hover:bg-slate-200 rounded-xl transition-all"
          >
            Cancel
          </button>

          <div className="flex items-center gap-2">
            {/* Next tab hint */}
            {activeTab !== 'links' && (
              <button
                type="button"
                onClick={() => {
                  const idx = TABS.findIndex(t => t.id === activeTab);
                  setActiveTab(TABS[idx + 1].id);
                }}
                className="flex items-center gap-1 px-4 py-2 text-xs font-bold text-slate-500 hover:text-indigo-600 border border-slate-200 hover:border-indigo-300 rounded-xl transition-all"
              >
                Next <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}

            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center gap-2 px-6 py-2 bg-indigo-600 text-white text-sm font-bold rounded-xl shadow-lg shadow-indigo-200 hover:bg-indigo-700 disabled:opacity-60 active:scale-95 transition-all"
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {isSaving ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default EditProfileModal;
