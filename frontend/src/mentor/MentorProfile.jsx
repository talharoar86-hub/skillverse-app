import React, { useState, useEffect } from 'react';
import { useAuth } from '../auth/AuthContext';
import { mentorService } from '../services/api';
import { getAvatarUrl } from '../utils/avatar';
import {
  Loader2, CheckCircle2, Github, Linkedin, Globe, Star
} from 'lucide-react';

const SKILL_LEVELS = ['Beginner', 'Intermediate', 'Expert'];
const TEACHING_PREFS = ['1-to-1', 'Group', 'Both'];

const FieldLabel = ({ children }) => (
  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
    {children}
  </label>
);

const MentorProfile = () => {
  const { user, updateUser } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [formData, setFormData] = useState({
    headline: '',
    bio: '',
    skills: [],
    experience: '',
    teachingPreference: '1-to-1',
    availability: '',
    pricing: '',
    portfolioLinks: { github: '', linkedin: '', website: '' }
  });

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const profile = await mentorService.getProfile();
      const mp = profile.mentorProfile || {};
      setFormData({
        headline: mp.headline || '',
        bio: mp.bio || '',
        skills: mp.skills?.length > 0 ? mp.skills : [],
        experience: mp.experience || '',
        teachingPreference: mp.teachingPreference || '1-to-1',
        availability: mp.availability || '',
        pricing: mp.pricing ?? '',
        portfolioLinks: mp.portfolioLinks || { github: '', linkedin: '', website: '' }
      });
    } catch (err) {
      console.error('Failed to load profile', err);
    } finally {
      setIsLoading(false);
    }
  };

  const patch = (key, val) => setFormData(prev => ({ ...prev, [key]: val }));
  const patchLinks = (key, val) =>
    setFormData(prev => ({ ...prev, portfolioLinks: { ...prev.portfolioLinks, [key]: val } }));

  const addSkill = () => {
    setFormData(prev => ({
      ...prev,
      skills: [...prev.skills, { name: '', level: 'Intermediate' }]
    }));
  };

  const removeSkill = (idx) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.filter((_, i) => i !== idx)
    }));
  };

  const updateSkill = (idx, field, value) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.map((s, i) => i === idx ? { ...s, [field]: value } : s)
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaved(false);
    try {
      const updated = await mentorService.updateProfile({
        headline: formData.headline,
        bio: formData.bio,
        skills: formData.skills.filter(s => s.name.trim()),
        experience: Number(formData.experience) || 0,
        teachingPreference: formData.teachingPreference,
        availability: formData.availability,
        pricing: Number(formData.pricing) || 0,
        portfolioLinks: formData.portfolioLinks
      });
      updateUser(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      console.error('Failed to save profile', err);
    } finally {
      setIsSaving(false);
    }
  };

  const initials = (user?.name || 'U').split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
  const completion = [
    formData.headline, formData.bio, formData.skills.length > 0,
    formData.experience, formData.availability
  ].filter(Boolean).length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">My Profile</h1>
          <p className="text-sm text-slate-500 mt-1 font-medium">How students see your mentor profile.</p>
        </div>
        {saved && (
          <div className="flex items-center gap-2 text-emerald-600 text-sm font-bold animate-fade-in">
            <CheckCircle2 className="w-4 h-4" /> Saved!
          </div>
        )}
      </div>

      {/* Profile Completion */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Profile Completion</span>
          <span className="text-xs font-black text-slate-600">{Math.round((completion / 5) * 100)}%</span>
        </div>
        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-indigo-600 rounded-full transition-all duration-500"
            style={{ width: `${(completion / 5) * 100}%` }}
          />
        </div>
      </div>

      {/* Preview Card */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-indigo-100 shrink-0 bg-indigo-50 flex items-center justify-center">
            {getAvatarUrl(user) ? (
              <img src={getAvatarUrl(user)} alt={user?.name} className="w-full h-full object-cover" onError={e => { e.target.style.display = 'none'; }} />
            ) : (
              <span className="text-lg font-black text-indigo-600">{initials}</span>
            )}
          </div>
          <div>
            <h3 className="text-lg font-black text-slate-900">{user?.name}</h3>
            <p className="text-sm text-slate-500 font-medium">{formData.headline || 'No headline set'}</p>
          </div>
          <div className="ml-auto flex items-center gap-1">
            <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
            <span className="text-sm font-black text-slate-900">{user?.mentorProfile?.rating?.toFixed(1) || '5.0'}</span>
          </div>
        </div>
        {formData.skills.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {formData.skills.map((s, i) => (
              <span key={i} className="px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-lg text-[11px] font-bold border border-indigo-100">
                {s.name}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Edit Form */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-5">
        <div>
          <FieldLabel>Headline</FieldLabel>
          <input
            type="text"
            value={formData.headline}
            onChange={e => patch('headline', e.target.value)}
            placeholder="e.g. Frontend Expert | React Mentor"
            className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50 transition-all"
          />
        </div>

        <div>
          <FieldLabel>Bio</FieldLabel>
          <textarea
            rows={4}
            value={formData.bio}
            onChange={e => patch('bio', e.target.value)}
            placeholder="Describe your expertise and teaching philosophy..."
            className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 outline-none resize-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50 transition-all"
          />
        </div>

        <div>
          <FieldLabel>Skills</FieldLabel>
          <div className="space-y-2">
            {formData.skills.map((skill, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <input
                  type="text"
                  value={skill.name}
                  onChange={e => updateSkill(idx, 'name', e.target.value)}
                  placeholder="Skill name"
                  className="flex-1 px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50 transition-all"
                />
                <select
                  value={skill.level}
                  onChange={e => updateSkill(idx, 'level', e.target.value)}
                  className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 outline-none"
                >
                  {SKILL_LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
                </select>
                <button onClick={() => removeSkill(idx)} className="p-2 text-slate-400 hover:text-rose-500">
                  ×
                </button>
              </div>
            ))}
            <button onClick={addSkill} className="text-xs font-bold text-indigo-600 hover:text-indigo-700">
              + Add Skill
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <FieldLabel>Years of Experience</FieldLabel>
            <input
              type="number"
              value={formData.experience}
              onChange={e => patch('experience', e.target.value)}
              placeholder="e.g. 5"
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50 transition-all"
            />
          </div>
          <div>
            <FieldLabel>Availability</FieldLabel>
            <input
              type="text"
              value={formData.availability}
              onChange={e => patch('availability', e.target.value)}
              placeholder="e.g. 10 hours/week"
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50 transition-all"
            />
          </div>
        </div>

        <div>
          <FieldLabel>Teaching Preference</FieldLabel>
          <div className="grid grid-cols-3 gap-2">
            {TEACHING_PREFS.map(pref => (
              <button
                key={pref}
                onClick={() => patch('teachingPreference', pref)}
                className={`py-2.5 rounded-xl text-xs font-bold border transition-all ${
                  formData.teachingPreference === pref
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-200'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-indigo-300'
                }`}
              >
                {pref}
              </button>
            ))}
          </div>
        </div>

        <div>
          <FieldLabel>Pricing ($)</FieldLabel>
          <input
            type="number"
            value={formData.pricing}
            onChange={e => patch('pricing', e.target.value)}
            placeholder="0 (free)"
            className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50 transition-all"
          />
        </div>

        <div className="space-y-3">
          <FieldLabel>Portfolio Links</FieldLabel>
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 focus-within:border-indigo-400 focus-within:ring-2 focus-within:ring-indigo-50 transition-all">
            <Github className="w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={formData.portfolioLinks.github}
              onChange={e => patchLinks('github', e.target.value)}
              placeholder="GitHub username"
              className="flex-1 bg-transparent text-sm text-slate-800 placeholder-slate-400 outline-none"
            />
          </div>
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 focus-within:border-indigo-400 focus-within:ring-2 focus-within:ring-indigo-50 transition-all">
            <Linkedin className="w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={formData.portfolioLinks.linkedin}
              onChange={e => patchLinks('linkedin', e.target.value)}
              placeholder="LinkedIn profile URL"
              className="flex-1 bg-transparent text-sm text-slate-800 placeholder-slate-400 outline-none"
            />
          </div>
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 focus-within:border-indigo-400 focus-within:ring-2 focus-within:ring-indigo-50 transition-all">
            <Globe className="w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={formData.portfolioLinks.website}
              onChange={e => patchLinks('website', e.target.value)}
              placeholder="Personal website URL"
              className="flex-1 bg-transparent text-sm text-slate-800 placeholder-slate-400 outline-none"
            />
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 px-8 py-3 bg-indigo-600 text-white text-sm font-bold rounded-xl shadow-lg shadow-indigo-200 hover:bg-indigo-700 disabled:opacity-60 active:scale-95 transition-all"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default MentorProfile;
