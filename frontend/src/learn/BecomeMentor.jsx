import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { mentorService } from '../services/api';
import {
  Loader2, CheckCircle2, Github, Linkedin, Globe,
  Star, AlertCircle, Clock, XCircle, Send
} from 'lucide-react';

const SKILL_LEVELS = ['Beginner', 'Intermediate', 'Expert'];
const TEACHING_PREFS = ['1-to-1', 'Group', 'Both'];

const FieldLabel = ({ children }) => (
  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
    {children}
  </label>
);

const BecomeMentor = () => {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mentorStatus, setMentorStatus] = useState(null);
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
    loadStatus();
  }, []);

  const loadStatus = async () => {
    try {
      const status = await mentorService.getStatus();
      setMentorStatus(status.mentorStatus || 'none');
      if (status.mentorStatus === 'approved') {
        navigate('/mentor-dashboard/overview', { replace: true });
      }
    } catch {
      setMentorStatus('none');
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const result = await mentorService.apply({
        headline: formData.headline,
        bio: formData.bio,
        skills: formData.skills.filter(s => s.name.trim()),
        experience: Number(formData.experience) || 0,
        teachingPreference: formData.teachingPreference,
        availability: formData.availability,
        pricing: Number(formData.pricing) || 0,
        portfolioLinks: formData.portfolioLinks
      });
      const status = result.mentorStatus || 'pending';
      setMentorStatus(status);
      updateUser(result);
      if (status === 'approved') {
        navigate('/mentor-dashboard/overview', { replace: true });
      }
    } catch (err) {
      console.error('Application failed', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
      </div>
    );
  }

  if (mentorStatus === 'pending') {
    return (
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Mentor Application</h1>
          <p className="text-sm text-slate-500 mt-1 font-medium">Track the status of your application.</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8 text-center">
          <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Clock className="w-8 h-8 text-amber-500" />
          </div>
          <h2 className="text-lg font-black text-slate-900 mb-2">Application Under Review</h2>
          <p className="text-sm text-slate-500 max-w-md mx-auto">
            Your mentor application is being reviewed. You will receive a notification once a decision has been made.
          </p>
        </div>
      </div>
    );
  }

  if (mentorStatus === 'rejected') {
    return (
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Mentor Application</h1>
          <p className="text-sm text-slate-500 mt-1 font-medium">Your previous application was not approved.</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8 text-center space-y-4">
          <div className="w-16 h-16 bg-rose-50 rounded-full flex items-center justify-center mx-auto">
            <XCircle className="w-8 h-8 text-rose-500" />
          </div>
          <h2 className="text-lg font-black text-slate-900">Application Not Approved</h2>
          <p className="text-sm text-slate-500 max-w-md mx-auto">
            Your mentor application was not approved this time. You can update your profile and reapply.
          </p>
          <button
            onClick={() => setMentorStatus('none')}
            className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white text-sm font-bold rounded-xl shadow-lg shadow-indigo-200 hover:bg-indigo-700 active:scale-95 transition-all"
          >
            Reapply Now
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Become a Mentor</h1>
        <p className="text-sm text-slate-500 mt-1 font-medium">Share your expertise and help others grow.</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-5">
        <div>
          <FieldLabel>Headline</FieldLabel>
          <input
            type="text"
            value={formData.headline}
            onChange={e => patch('headline', e.target.value)}
            placeholder="e.g. Frontend Expert | React Mentor"
            required
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
            required
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
                <button type="button" onClick={() => removeSkill(idx)} className="p-2 text-slate-400 hover:text-rose-500">
                  ×
                </button>
              </div>
            ))}
            <button type="button" onClick={addSkill} className="text-xs font-bold text-indigo-600 hover:text-indigo-700">
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
                type="button"
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
            type="submit"
            disabled={isSubmitting}
            className="flex items-center gap-2 px-8 py-3 bg-indigo-600 text-white text-sm font-bold rounded-xl shadow-lg shadow-indigo-200 hover:bg-indigo-700 disabled:opacity-60 active:scale-95 transition-all"
          >
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            {isSubmitting ? 'Submitting...' : 'Submit Application'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default BecomeMentor;
