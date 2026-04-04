import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { mentorService } from '../services/api';
import { getAvatarUrl, getCoverImageUrl } from '../utils/avatar';
import {
  Loader2, CheckCircle2, Github, Linkedin, Globe, Star, Camera, Upload,
  Award, Languages, Video, Eye, Calendar, DollarSign, Users, BookOpen,
  ExternalLink, Trash2, Plus, X, ChevronDown, ChevronUp, Image, Clock,
  TrendingUp, GraduationCap, Sparkles, Save, AlertCircle
} from 'lucide-react';

const SKILL_LEVELS = ['Beginner', 'Intermediate', 'Expert'];
const TEACHING_PREFS = ['1-to-1', 'Group', 'Both'];
const LANGUAGE_PROFICIENCY = ['Basic', 'Conversational', 'Fluent', 'Native'];

const FieldLabel = ({ children, icon: Icon }) => (
  <label className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-2">
    {Icon && <Icon className="w-3.5 h-3.5" />}
    {children}
  </label>
);

const SectionCard = ({ title, icon: Icon, children, collapsible = false, defaultOpen = true }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
      <div
        className={`flex items-center justify-between px-6 py-4 ${collapsible ? 'cursor-pointer hover:bg-slate-50/50' : ''}`}
        onClick={collapsible ? () => setIsOpen(!isOpen) : undefined}
      >
        <div className="flex items-center gap-2.5">
          {Icon && <Icon className="w-5 h-5 text-indigo-600" />}
          <h2 className="text-base font-bold text-slate-800">{title}</h2>
        </div>
        {collapsible && (
          isOpen ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />
        )}
      </div>
      {(!collapsible || isOpen) && <div className="px-6 pb-6">{children}</div>}
    </div>
  );
};

const MentorProfile = () => {
  const { user, updateUser } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  // Avatar
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState('');
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const avatarInputRef = useRef(null);

  // Cover Image
  const [coverFile, setCoverFile] = useState(null);
  const [coverPreview, setCoverPreview] = useState('');
  const [uploadingCover, setUploadingCover] = useState(false);
  const coverInputRef = useRef(null);

  // Video Intro
  const [videoFile, setVideoFile] = useState(null);
  const [videoUploading, setVideoUploading] = useState(false);
  const [videoProgress, setVideoProgress] = useState(0);
  const [videoUrl, setVideoUrl] = useState('');
  const videoInputRef = useRef(null);

  // Profile Stats
  const [profileStats, setProfileStats] = useState(null);

  const [formData, setFormData] = useState({
    headline: '',
    bio: '',
    skills: [],
    experience: '',
    teachingPreference: '1-to-1',
    availability: '',
    pricing: '',
    portfolioLinks: { github: '', linkedin: '', website: '' },
    certifications: [],
    languages: []
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
        portfolioLinks: mp.portfolioLinks || { github: '', linkedin: '', website: '' },
        certifications: mp.certifications || [],
        languages: mp.languages || []
      });
      setAvatarPreview(getAvatarUrl(profile));
      setCoverPreview(mp.coverImageUrl || '');
      setVideoUrl(mp.videoIntroUrl || '');
      setProfileStats(profile.profileStats || null);
    } catch (err) {
      console.error('Failed to load profile', err);
      setError('Failed to load profile data');
    } finally {
      setIsLoading(false);
    }
  };

  const patch = (key, val) => setFormData(prev => ({ ...prev, [key]: val }));
  const patchLinks = (key, val) =>
    setFormData(prev => ({ ...prev, portfolioLinks: { ...prev.portfolioLinks, [key]: val } }));

  // Skills handlers
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

  // Certification handlers
  const addCertification = () => {
    setFormData(prev => ({
      ...prev,
      certifications: [...prev.certifications, { name: '', issuer: '', year: '', credentialUrl: '' }]
    }));
  };
  const removeCertification = (idx) => {
    setFormData(prev => ({
      ...prev,
      certifications: prev.certifications.filter((_, i) => i !== idx)
    }));
  };
  const updateCertification = (idx, field, value) => {
    setFormData(prev => ({
      ...prev,
      certifications: prev.certifications.map((c, i) => i === idx ? { ...c, [field]: value } : c)
    }));
  };

  // Language handlers
  const addLanguage = () => {
    setFormData(prev => ({
      ...prev,
      languages: [...prev.languages, { name: '', proficiency: 'Fluent' }]
    }));
  };
  const removeLanguage = (idx) => {
    setFormData(prev => ({
      ...prev,
      languages: prev.languages.filter((_, i) => i !== idx)
    }));
  };
  const updateLanguage = (idx, field, value) => {
    setFormData(prev => ({
      ...prev,
      languages: prev.languages.map((l, i) => i === idx ? { ...l, [field]: value } : l)
    }));
  };

  // Avatar upload
  const handleAvatarSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { setError('Image must be less than 5MB'); return; }
    setAvatarFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setAvatarPreview(reader.result);
    reader.readAsDataURL(file);
    setError('');
  };

  const handleUploadAvatar = async () => {
    if (!avatarFile) return;
    setUploadingAvatar(true);
    try {
      const fd = new FormData();
      fd.append('avatar', avatarFile);
      const result = await mentorService.uploadProfileImage(fd);
      if (result?.avatarUrl) {
        setAvatarPreview(result.avatarUrl);
        updateUser({ avatarUrl: result.avatarUrl });
      }
      setAvatarFile(null);
    } catch (err) {
      console.error('Avatar upload failed', err);
      setError('Avatar upload failed');
    } finally {
      setUploadingAvatar(false);
    }
  };

  // Cover image upload
  const handleCoverSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { setError('Cover image must be less than 10MB'); return; }
    setCoverFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setCoverPreview(reader.result);
    reader.readAsDataURL(file);
    setError('');
  };

  const handleUploadCover = async () => {
    if (!coverFile) return;
    setUploadingCover(true);
    try {
      const fd = new FormData();
      fd.append('coverImage', coverFile);
      const result = await mentorService.uploadCoverImage(fd);
      if (result?.coverImageUrl) {
        setCoverPreview(result.coverImageUrl);
      }
      setCoverFile(null);
    } catch (err) {
      console.error('Cover upload failed', err);
      setError('Cover image upload failed');
    } finally {
      setUploadingCover(false);
    }
  };

  // Video intro upload
  const handleVideoSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 100 * 1024 * 1024) { setError('Video must be less than 100MB'); return; }
    const validTypes = ['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/webm'];
    if (!validTypes.includes(file.type)) {
      setError('Please upload MP4, MOV, AVI, or WebM format');
      return;
    }
    setVideoFile(file);
    setError('');
  };

  const handleUploadVideo = async () => {
    if (!videoFile) return;
    setVideoUploading(true);
    setVideoProgress(0);
    try {
      const fd = new FormData();
      fd.append('video', videoFile);
      const result = await mentorService.uploadVideoIntro(fd, setVideoProgress);
      if (result?.videoIntroUrl) {
        setVideoUrl(result.videoIntroUrl);
      }
      setVideoFile(null);
    } catch (err) {
      console.error('Video upload failed', err);
      setError('Video upload failed. Make sure Cloudinary is configured.');
    } finally {
      setVideoUploading(false);
      setVideoProgress(0);
    }
  };

  const handleDeleteVideo = async () => {
    try {
      await mentorService.deleteVideoIntro();
      setVideoUrl('');
    } catch (err) {
      console.error('Video delete failed', err);
      setError('Failed to delete video');
    }
  };

  // Save profile
  const handleSave = async () => {
    setIsSaving(true);
    setSaved(false);
    setError('');
    try {
      if (avatarFile) await handleUploadAvatar();
      if (coverFile) await handleUploadCover();

      const updated = await mentorService.updateProfile({
        headline: formData.headline,
        bio: formData.bio,
        skills: formData.skills.filter(s => s.name.trim()),
        experience: Number(formData.experience) || 0,
        teachingPreference: formData.teachingPreference,
        availability: formData.availability,
        pricing: Number(formData.pricing) || 0,
        portfolioLinks: formData.portfolioLinks,
        certifications: formData.certifications.filter(c => c.name.trim()),
        languages: formData.languages.filter(l => l.name.trim())
      });
      updateUser(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error('Failed to save profile', err);
      setError('Failed to save profile changes');
    } finally {
      setIsSaving(false);
    }
  };

  // Profile completion calculation
  const completionChecks = [
    formData.headline?.trim(),
    formData.bio?.trim() && formData.bio.length >= 50,
    formData.skills.length > 0,
    formData.skills.some(s => s.level === 'Expert'),
    formData.experience,
    formData.availability?.trim(),
    formData.pricing !== '' && formData.pricing !== undefined,
    formData.teachingPreference,
    formData.portfolioLinks?.github?.trim() || formData.portfolioLinks?.linkedin?.trim(),
    formData.certifications?.length > 0,
    formData.languages?.length > 0,
    avatarPreview && !avatarPreview.includes('ui-avatars'),
    videoUrl,
    formData.bio?.trim() && formData.bio.length >= 150
  ];
  const completion = completionChecks.filter(Boolean).length;
  const completionPct = Math.round((completion / completionChecks.length) * 100);

  const initials = (user?.name || 'U').split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-indigo-600 animate-spin mx-auto mb-3" />
          <p className="text-sm text-slate-500 font-medium">Loading your profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto pb-12 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">My Profile</h1>
          <p className="text-sm text-slate-500 mt-1 font-medium">Manage how students see your mentor profile.</p>
        </div>
        <div className="flex items-center gap-3">
          {saved && (
            <div className="flex items-center gap-1.5 text-emerald-600 text-sm font-bold animate-fade-in">
              <CheckCircle2 className="w-4 h-4" /> Saved
            </div>
          )}
          {error && (
            <div className="flex items-center gap-1.5 text-rose-600 text-sm font-bold">
              <AlertCircle className="w-4 h-4" /> {error}
            </div>
          )}
          <Link
            to={`/user/${user?._id}`}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-bold text-indigo-600 bg-indigo-50 rounded-xl hover:bg-indigo-100 transition-all"
          >
            <ExternalLink className="w-4 h-4" /> Preview Public Profile
          </Link>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white text-sm font-bold rounded-xl shadow-lg shadow-indigo-200/50 hover:bg-indigo-700 disabled:opacity-60 active:scale-[0.98] transition-all"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-rose-700 text-sm font-medium">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
          <button onClick={() => setError('')} className="ml-auto text-rose-400 hover:text-rose-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Cover Image + Profile Header */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden mb-6">
        {/* Cover */}
        <div
          className="relative h-48 bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 cursor-pointer group"
          style={coverPreview ? {
            backgroundImage: `url(${coverPreview})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          } : {}}
          onClick={() => coverInputRef.current?.click()}
        >
          <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <div className="flex items-center gap-2 text-white font-bold text-sm bg-black/40 px-4 py-2 rounded-xl backdrop-blur-sm">
              <Image className="w-4 h-4" /> {coverPreview ? 'Change Cover Image' : 'Upload Cover Image'}
            </div>
          </div>
          <input
            ref={coverInputRef}
            type="file"
            accept="image/*"
            onChange={handleCoverSelect}
            className="hidden"
          />
          {coverFile && (
            <div className="absolute bottom-3 right-3 flex items-center gap-2" onClick={e => e.stopPropagation()}>
              <button
                onClick={handleUploadCover}
                disabled={uploadingCover}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white text-indigo-700 text-xs font-bold rounded-lg shadow-lg hover:bg-indigo-50 disabled:opacity-50"
              >
                {uploadingCover ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
                {uploadingCover ? 'Uploading...' : 'Upload Cover'}
              </button>
              <button
                onClick={() => { setCoverFile(null); setCoverPreview(getCoverImageUrl(user) || ''); }}
                className="px-3 py-1.5 bg-white/90 text-slate-600 text-xs font-bold rounded-lg shadow-lg hover:bg-white"
              >
                Cancel
              </button>
            </div>
          )}
        </div>

        {/* Profile Info Row */}
        <div className="px-6 pb-6">
          <div className="flex items-end gap-5 -mt-12">
            {/* Avatar */}
            <div
              className="relative w-24 h-24 rounded-2xl overflow-hidden border-4 border-white shadow-lg shrink-0 bg-indigo-50 flex items-center justify-center group cursor-pointer"
              onClick={() => avatarInputRef.current?.click()}
            >
              {avatarPreview ? (
                <img src={avatarPreview} alt={user?.name} className="w-full h-full object-cover" onError={e => { e.target.style.display = 'none'; }} />
              ) : (
                <span className="text-2xl font-black text-indigo-600">{initials}</span>
              )}
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera className="w-6 h-6 text-white" />
              </div>
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarSelect}
                className="hidden"
              />
            </div>

            {/* Name + Headline */}
            <div className="flex-1 min-w-0 pt-2">
              <h2 className="text-xl font-black text-slate-900 truncate">{user?.name}</h2>
              <p className="text-sm text-slate-500 font-medium truncate">{formData.headline || 'Add a headline to stand out'}</p>
            </div>

            {/* Quick Stats */}
            <div className="flex items-center gap-4 pt-2 shrink-0">
              <div className="text-center">
                <div className="flex items-center gap-1 text-amber-500">
                  <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                  <span className="text-sm font-black text-slate-800">{user?.mentorProfile?.rating?.toFixed(1) || '5.0'}</span>
                </div>
                <span className="text-[10px] font-bold text-slate-400 uppercase">Rating</span>
              </div>
              <div className="w-px h-8 bg-slate-200" />
              <div className="text-center">
                <div className="text-sm font-black text-slate-800">{profileStats?.totalViews || 0}</div>
                <span className="text-[10px] font-bold text-slate-400 uppercase">Views</span>
              </div>
              <div className="w-px h-8 bg-slate-200" />
              <div className="text-center">
                <div className="text-sm font-black text-slate-800">{user?.mentorProfile?.totalStudents || 0}</div>
                <span className="text-[10px] font-bold text-slate-400 uppercase">Students</span>
              </div>
            </div>
          </div>

          {/* Avatar upload pending */}
          {avatarFile && (
            <div className="flex items-center gap-2 mt-3 p-2.5 bg-indigo-50 rounded-xl">
              <Upload className="w-4 h-4 text-indigo-600" />
              <span className="text-xs font-bold text-indigo-700 flex-1 truncate">{avatarFile.name}</span>
              <button
                onClick={handleUploadAvatar}
                disabled={uploadingAvatar}
                className="px-3 py-1 bg-indigo-600 text-white text-xs font-bold rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-all"
              >
                {uploadingAvatar ? 'Uploading...' : 'Upload Now'}
              </button>
              <button
                onClick={() => { setAvatarFile(null); setAvatarPreview(getAvatarUrl(user) || ''); }}
                className="px-2 py-1 text-xs font-bold text-slate-500 hover:text-slate-700"
              >
                Cancel
              </button>
            </div>
          )}

          {/* Skills tags */}
          {formData.skills.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-4">
              {formData.skills.filter(s => s.name).map((s, i) => (
                <span
                  key={i}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border ${
                    s.level === 'Expert'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : s.level === 'Intermediate'
                      ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                      : 'bg-slate-50 text-slate-600 border-slate-200'
                  }`}
                >
                  {s.name}
                  <span className="ml-1 opacity-60">({s.level})</span>
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Profile Completion */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 mb-6">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-600" />
            <span className="text-sm font-bold text-slate-800">Profile Completion</span>
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-sm font-black ${completionPct >= 80 ? 'text-emerald-600' : completionPct >= 50 ? 'text-amber-600' : 'text-rose-600'}`}>
              {completionPct}%
            </span>
            <span className="text-xs text-slate-400 font-medium">({completion}/{completionChecks.length} items)</span>
          </div>
        </div>
        <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-700 ease-out ${
              completionPct >= 80 ? 'bg-emerald-500' : completionPct >= 50 ? 'bg-amber-500' : 'bg-rose-500'
            }`}
            style={{ width: `${completionPct}%` }}
          />
        </div>
        {completionPct < 100 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {!formData.headline?.trim() && (
              <span className="text-[10px] font-bold text-slate-400 bg-slate-50 px-2 py-0.5 rounded-md">Add headline</span>
            )}
            {!(formData.bio?.trim() && formData.bio.length >= 50) && (
              <span className="text-[10px] font-bold text-slate-400 bg-slate-50 px-2 py-0.5 rounded-md">Write detailed bio</span>
            )}
            {formData.skills.length === 0 && (
              <span className="text-[10px] font-bold text-slate-400 bg-slate-50 px-2 py-0.5 rounded-md">Add skills</span>
            )}
            {!formData.certifications?.length && (
              <span className="text-[10px] font-bold text-slate-400 bg-slate-50 px-2 py-0.5 rounded-md">Add certifications</span>
            )}
            {!formData.languages?.length && (
              <span className="text-[10px] font-bold text-slate-400 bg-slate-50 px-2 py-0.5 rounded-md">Add languages</span>
            )}
            {!videoUrl && (
              <span className="text-[10px] font-bold text-slate-400 bg-slate-50 px-2 py-0.5 rounded-md">Upload video intro</span>
            )}
            {avatarPreview?.includes('ui-avatars') && (
              <span className="text-[10px] font-bold text-slate-400 bg-slate-50 px-2 py-0.5 rounded-md">Upload profile photo</span>
            )}
          </div>
        )}
      </div>

      {/* Profile Views Analytics */}
      {profileStats && (
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center">
              <Eye className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <div className="text-lg font-black text-slate-900">{profileStats.totalViews || 0}</div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Total Profile Views</div>
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <div className="text-lg font-black text-slate-900">{profileStats.recentViews || 0}</div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Views (30 days)</div>
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <div className="text-lg font-black text-slate-900">{profileStats.totalScheduleSlots || 0}</div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Schedule Slots</div>
            </div>
          </div>
        </div>
      )}

      {/* Main Form Sections */}
      <div className="space-y-6">
        {/* Basic Info */}
        <SectionCard title="Basic Information" icon={GraduationCap}>
          <div className="space-y-5">
            <div>
              <FieldLabel>Headline</FieldLabel>
              <input
                type="text"
                value={formData.headline}
                onChange={e => patch('headline', e.target.value)}
                placeholder="e.g. Senior Frontend Engineer | React & Node.js Expert"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50 transition-all"
                maxLength={100}
              />
              <div className="text-[10px] text-slate-400 mt-1 text-right">{formData.headline.length}/100</div>
            </div>

            <div>
              <FieldLabel>Bio</FieldLabel>
              <textarea
                rows={5}
                value={formData.bio}
                onChange={e => patch('bio', e.target.value)}
                placeholder="Share your expertise, teaching philosophy, and what makes you a great mentor. The more detailed, the better students can connect with you..."
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 outline-none resize-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50 transition-all"
                maxLength={1000}
              />
              <div className="flex items-center justify-between mt-1">
                <span className={`text-[10px] font-medium ${formData.bio.length >= 150 ? 'text-emerald-500' : 'text-slate-400'}`}>
                  {formData.bio.length < 150 ? `${150 - formData.bio.length} more characters recommended` : 'Good length!'}
                </span>
                <span className="text-[10px] text-slate-400">{formData.bio.length}/1000</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <FieldLabel icon={Clock}>Years of Experience</FieldLabel>
                <input
                  type="number"
                  value={formData.experience}
                  onChange={e => patch('experience', e.target.value)}
                  placeholder="e.g. 5"
                  min={0}
                  max={50}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50 transition-all"
                />
              </div>
              <div>
                <FieldLabel icon={DollarSign}>Session Price ($)</FieldLabel>
                <input
                  type="number"
                  value={formData.pricing}
                  onChange={e => patch('pricing', e.target.value)}
                  placeholder="0 = free"
                  min={0}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50 transition-all"
                />
              </div>
              <div>
                <FieldLabel icon={Calendar}>Availability</FieldLabel>
                <input
                  type="text"
                  value={formData.availability}
                  onChange={e => patch('availability', e.target.value)}
                  placeholder="e.g. 10 hours/week"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50 transition-all"
                />
              </div>
            </div>

            <div>
              <FieldLabel>Teaching Preference</FieldLabel>
              <div className="grid grid-cols-3 gap-3">
                {TEACHING_PREFS.map(pref => (
                  <button
                    key={pref}
                    onClick={() => patch('teachingPreference', pref)}
                    className={`py-3 rounded-xl text-sm font-bold border-2 transition-all ${
                      formData.teachingPreference === pref
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-200/50'
                        : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-300 hover:text-indigo-600'
                    }`}
                  >
                    {pref}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </SectionCard>

        {/* Skills */}
        <SectionCard title="Skills & Expertise" icon={BookOpen}>
          <div className="space-y-3">
            {formData.skills.map((skill, idx) => (
              <div key={idx} className="flex items-center gap-3 group">
                <input
                  type="text"
                  value={skill.name}
                  onChange={e => updateSkill(idx, 'name', e.target.value)}
                  placeholder="e.g. React, Python, Machine Learning"
                  className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50 transition-all"
                />
                <select
                  value={skill.level}
                  onChange={e => updateSkill(idx, 'level', e.target.value)}
                  className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 outline-none focus:border-indigo-400 transition-all cursor-pointer"
                >
                  {SKILL_LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
                </select>
                <button
                  onClick={() => removeSkill(idx)}
                  className="p-2.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
            <button
              onClick={addSkill}
              className="flex items-center gap-1.5 text-sm font-bold text-indigo-600 hover:text-indigo-700 py-2"
            >
              <Plus className="w-4 h-4" /> Add Skill
            </button>
          </div>
        </SectionCard>

        {/* Certifications */}
        <SectionCard title="Certifications & Education" icon={Award} collapsible defaultOpen={formData.certifications?.length > 0}>
          <div className="space-y-3">
            {formData.certifications.map((cert, idx) => (
              <div key={idx} className="p-4 bg-slate-50 rounded-xl group">
                <div className="flex items-start gap-3">
                  <div className="flex-1 grid grid-cols-2 gap-3">
                    <input
                      type="text"
                      value={cert.name}
                      onChange={e => updateCertification(idx, 'name', e.target.value)}
                      placeholder="Certification name"
                      className="px-3 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-800 placeholder-slate-400 outline-none focus:border-indigo-400 transition-all"
                    />
                    <input
                      type="text"
                      value={cert.issuer}
                      onChange={e => updateCertification(idx, 'issuer', e.target.value)}
                      placeholder="Issuing organization"
                      className="px-3 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-800 placeholder-slate-400 outline-none focus:border-indigo-400 transition-all"
                    />
                    <input
                      type="number"
                      value={cert.year}
                      onChange={e => updateCertification(idx, 'year', e.target.value)}
                      placeholder="Year (e.g. 2024)"
                      className="px-3 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-800 placeholder-slate-400 outline-none focus:border-indigo-400 transition-all"
                    />
                    <input
                      type="text"
                      value={cert.credentialUrl}
                      onChange={e => updateCertification(idx, 'credentialUrl', e.target.value)}
                      placeholder="Credential URL (optional)"
                      className="px-3 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-800 placeholder-slate-400 outline-none focus:border-indigo-400 transition-all"
                    />
                  </div>
                  <button
                    onClick={() => removeCertification(idx)}
                    className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
            <button
              onClick={addCertification}
              className="flex items-center gap-1.5 text-sm font-bold text-indigo-600 hover:text-indigo-700 py-2"
            >
              <Plus className="w-4 h-4" /> Add Certification
            </button>
          </div>
        </SectionCard>

        {/* Languages */}
        <SectionCard title="Languages" icon={Languages} collapsible defaultOpen={formData.languages?.length > 0}>
          <div className="space-y-3">
            {formData.languages.map((lang, idx) => (
              <div key={idx} className="flex items-center gap-3 group">
                <input
                  type="text"
                  value={lang.name}
                  onChange={e => updateLanguage(idx, 'name', e.target.value)}
                  placeholder="e.g. English, Spanish, Urdu"
                  className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50 transition-all"
                />
                <select
                  value={lang.proficiency}
                  onChange={e => updateLanguage(idx, 'proficiency', e.target.value)}
                  className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 outline-none focus:border-indigo-400 transition-all cursor-pointer"
                >
                  {LANGUAGE_PROFICIENCY.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
                <button
                  onClick={() => removeLanguage(idx)}
                  className="p-2.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
            <button
              onClick={addLanguage}
              className="flex items-center gap-1.5 text-sm font-bold text-indigo-600 hover:text-indigo-700 py-2"
            >
              <Plus className="w-4 h-4" /> Add Language
            </button>
          </div>
        </SectionCard>

        {/* Video Intro */}
        <SectionCard title="Video Introduction" icon={Video}>
          <p className="text-xs text-slate-500 mb-4">Upload a short video (1-3 min) introducing yourself. Videos get 3x more engagement.</p>

          {videoUrl ? (
            <div className="space-y-3">
              <div className="rounded-xl overflow-hidden bg-slate-900 aspect-video max-w-lg">
                <video
                  src={videoUrl}
                  controls
                  className="w-full h-full object-contain"
                  preload="metadata"
                >
                  Your browser does not support video playback.
                </video>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => videoInputRef.current?.click()}
                  className="flex items-center gap-1.5 px-4 py-2 text-sm font-bold text-indigo-600 bg-indigo-50 rounded-xl hover:bg-indigo-100 transition-all"
                >
                  <Upload className="w-4 h-4" /> Replace Video
                </button>
                <button
                  onClick={handleDeleteVideo}
                  className="flex items-center gap-1.5 px-4 py-2 text-sm font-bold text-rose-600 bg-rose-50 rounded-xl hover:bg-rose-100 transition-all"
                >
                  <Trash2 className="w-4 h-4" /> Remove
                </button>
              </div>
            </div>
          ) : (
            <div
              className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center hover:border-indigo-400 hover:bg-indigo-50/30 transition-all cursor-pointer"
              onClick={() => videoInputRef.current?.click()}
            >
              <Video className="w-10 h-10 text-slate-400 mx-auto mb-3" />
              <p className="text-sm font-bold text-slate-600 mb-1">Click to upload video intro</p>
              <p className="text-xs text-slate-400">MP4, MOV, AVI, or WebM (max 100MB)</p>
            </div>
          )}

          <input
            ref={videoInputRef}
            type="file"
            accept="video/mp4,video/quicktime,video/x-msvideo,video/webm"
            onChange={handleVideoSelect}
            className="hidden"
          />

          {videoFile && (
            <div className="mt-4 p-3 bg-indigo-50 rounded-xl">
              <div className="flex items-center gap-2 mb-2">
                <Video className="w-4 h-4 text-indigo-600" />
                <span className="text-xs font-bold text-indigo-700 flex-1 truncate">{videoFile.name}</span>
                <span className="text-[10px] font-bold text-indigo-500">
                  {(videoFile.size / (1024 * 1024)).toFixed(1)} MB
                </span>
              </div>
              {videoUploading && (
                <div className="w-full h-2 bg-indigo-200 rounded-full overflow-hidden mb-2">
                  <div
                    className="h-full bg-indigo-600 rounded-full transition-all duration-300"
                    style={{ width: `${videoProgress}%` }}
                  />
                </div>
              )}
              <div className="flex items-center gap-2">
                <button
                  onClick={handleUploadVideo}
                  disabled={videoUploading}
                  className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white text-xs font-bold rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-all"
                >
                  {videoUploading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
                  {videoUploading ? `Uploading ${videoProgress}%...` : 'Upload'}
                </button>
                <button
                  onClick={() => setVideoFile(null)}
                  disabled={videoUploading}
                  className="px-3 py-2 text-xs font-bold text-slate-500 hover:text-slate-700 disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </SectionCard>

        {/* Portfolio Links */}
        <SectionCard title="Portfolio & Social Links" icon={Globe}>
          <div className="space-y-3">
            <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus-within:border-indigo-400 focus-within:ring-2 focus-within:ring-indigo-50 transition-all">
              <Github className="w-5 h-5 text-slate-400 shrink-0" />
              <input
                type="text"
                value={formData.portfolioLinks.github}
                onChange={e => patchLinks('github', e.target.value)}
                placeholder="GitHub username or profile URL"
                className="flex-1 bg-transparent text-sm text-slate-800 placeholder-slate-400 outline-none"
              />
            </div>
            <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus-within:border-indigo-400 focus-within:ring-2 focus-within:ring-indigo-50 transition-all">
              <Linkedin className="w-5 h-5 text-slate-400 shrink-0" />
              <input
                type="text"
                value={formData.portfolioLinks.linkedin}
                onChange={e => patchLinks('linkedin', e.target.value)}
                placeholder="LinkedIn profile URL"
                className="flex-1 bg-transparent text-sm text-slate-800 placeholder-slate-400 outline-none"
              />
            </div>
            <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus-within:border-indigo-400 focus-within:ring-2 focus-within:ring-indigo-50 transition-all">
              <Globe className="w-5 h-5 text-slate-400 shrink-0" />
              <input
                type="text"
                value={formData.portfolioLinks.website}
                onChange={e => patchLinks('website', e.target.value)}
                placeholder="Personal website or portfolio URL"
                className="flex-1 bg-transparent text-sm text-slate-800 placeholder-slate-400 outline-none"
              />
            </div>
          </div>
        </SectionCard>

        {/* Live Preview Card */}
        <SectionCard title="Student Preview" icon={Eye} collapsible defaultOpen={false}>
          <p className="text-xs text-slate-500 mb-4">This is how your profile appears to students browsing mentors.</p>
          <div className="max-w-sm mx-auto bg-white border border-slate-200 rounded-2xl shadow-lg overflow-hidden">
            {/* Mini cover */}
            <div
              className="h-20 bg-gradient-to-r from-indigo-500 to-purple-600"
              style={coverPreview ? {
                backgroundImage: `url(${coverPreview})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center'
              } : {}}
            />
            <div className="px-4 pb-4">
              <div className="flex items-end gap-3 -mt-8 mb-3">
                <div className="w-16 h-16 rounded-xl overflow-hidden border-3 border-white shadow-md bg-indigo-50 shrink-0">
                  {avatarPreview ? (
                    <img src={avatarPreview} alt={user?.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-lg font-black text-indigo-600">{initials}</div>
                  )}
                </div>
                <div className="flex-1 min-w-0 pb-1">
                  <h3 className="text-sm font-bold text-slate-900 truncate">{user?.name || 'Your Name'}</h3>
                  <p className="text-xs text-slate-500 truncate">{formData.headline || 'Your headline'}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 mb-3">
                <div className="flex items-center gap-1">
                  <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                  <span className="text-xs font-bold text-slate-700">{user?.mentorProfile?.rating?.toFixed(1) || '5.0'}</span>
                </div>
                <span className="text-slate-300">|</span>
                <span className="text-xs text-slate-500">{user?.mentorProfile?.totalStudents || 0} students</span>
                {formData.pricing !== '' && formData.pricing !== undefined && (
                  <>
                    <span className="text-slate-300">|</span>
                    <span className="text-xs font-bold text-emerald-600">
                      {Number(formData.pricing) === 0 ? 'Free' : `$${formData.pricing}/hr`}
                    </span>
                  </>
                )}
              </div>

              {formData.skills.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-3">
                  {formData.skills.filter(s => s.name).slice(0, 4).map((s, i) => (
                    <span key={i} className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded text-[10px] font-bold">
                      {s.name}
                    </span>
                  ))}
                  {formData.skills.length > 4 && (
                    <span className="px-2 py-0.5 bg-slate-100 text-slate-500 rounded text-[10px] font-bold">
                      +{formData.skills.length - 4}
                    </span>
                  )}
                </div>
              )}

              {formData.teachingPreference && (
                <div className="flex items-center gap-1 text-[10px] font-bold text-slate-500">
                  <Users className="w-3 h-3" />
                  {formData.teachingPreference === 'Both' ? '1-to-1 & Group' : formData.teachingPreference}
                </div>
              )}
            </div>
          </div>
        </SectionCard>

        {/* Bottom Save Button */}
        <div className="flex items-center justify-between pt-4">
          <Link
            to="/mentor-dashboard/schedule"
            className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-indigo-600 transition-colors"
          >
            <Calendar className="w-4 h-4" /> Manage Schedule
          </Link>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 px-8 py-3 bg-indigo-600 text-white text-sm font-bold rounded-xl shadow-lg shadow-indigo-200/50 hover:bg-indigo-700 disabled:opacity-60 active:scale-[0.98] transition-all"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {isSaving ? 'Saving...' : 'Save All Changes'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default MentorProfile;
