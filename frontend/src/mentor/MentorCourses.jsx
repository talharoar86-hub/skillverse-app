import React, { useState, useEffect, useRef, useCallback } from 'react';
import { courseService, mentorService, courseReviewService } from '../services/api';
import {
  Plus, BookOpen, Star, Users, Edit3, Trash2, Eye, EyeOff, Loader2, X,
  ChevronDown, ChevronUp, Check, DollarSign, Upload, Copy, Save, Image as ImageIcon,
  Search, Filter, Grid, List, MoreVertical, ExternalLink, TrendingUp, Clock,
  GripVertical, AlertCircle, CheckCircle2, MessageSquare, Eye as EyeIcon,
  BarChart3, Send, Bold, Italic, List as ListIcon, Link2, Video, Play, Pause, XCircle
} from 'lucide-react';
import { cn } from '../utils/cn';
import { API_BASE_URL } from '../config';

const getThumbnailUrl = (url) => {
  if (!url) return '';
  if (url.startsWith('http')) return url;
  return `${API_BASE_URL}${url}`;
};

const getVideoUrl = (url) => {
  if (!url) return '';
  if (url.startsWith('http')) return url;
  return `${API_BASE_URL}${url}`;
};

const LEVELS = ['Beginner', 'Intermediate', 'Advanced'];
const CATEGORIES = ['Frontend', 'Backend', 'Full Stack', 'Mobile', 'DevOps', 'AI/ML', 'Design', 'Data Science', 'Cybersecurity', 'Other'];
const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest First' },
  { value: 'oldest', label: 'Oldest First' },
  { value: 'title', label: 'Title (A-Z)' },
  { value: 'popular', label: 'Most Popular' },
  { value: 'rating', label: 'Highest Rated' }
];

const emptyCourse = {
  title: '',
  description: '',
  category: 'Frontend',
  level: 'Beginner',
  tags: [],
  thumbnail: '',
  price: 0,
  isFree: true,
  visibility: 'public'
};

const emptyLesson = {
  title: '',
  description: '',
  duration: '',
  videoUrl: '',
  content: ''
};

const DRAFT_KEY = 'mentor_course_draft';

const FieldLabel = ({ children, required, hint, className = '' }) => (
  <div className={cn("flex items-center gap-2 mb-1.5", className)}>
    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
      {children}{required && <span className="text-rose-500 ml-0.5">*</span>}
    </label>
    {hint && <span className="text-[10px] text-slate-400 font-normal">{hint}</span>}
  </div>
);

const TagInput = ({ tags, onChange, placeholder = 'Add tag...' }) => {
  const [input, setInput] = useState('');

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const tag = input.trim().toLowerCase();
      if (tag && !tags.includes(tag)) {
        onChange([...tags, tag]);
        setInput('');
      }
    } else if (e.key === 'Backspace' && !input && tags.length > 0) {
      onChange(tags.slice(0, -1));
    }
  };

  const removeTag = (tagToRemove) => {
    onChange(tags.filter(t => t !== tagToRemove));
  };

  return (
    <div className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50 transition-all flex flex-wrap gap-1.5 min-h-[44px]">
      {tags.map((tag, idx) => (
        <span
          key={idx}
          className="inline-flex items-center gap-1 px-2 py-0.5 bg-indigo-100 text-indigo-700 text-xs font-medium rounded-md"
        >
          {tag}
          <button type="button" onClick={() => removeTag(tag)} className="hover:text-indigo-900">
            <X className="w-3 h-3" />
          </button>
        </span>
      ))}
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={tags.length === 0 ? placeholder : ''}
        className="flex-1 min-w-[100px] bg-transparent outline-none text-sm text-slate-800 placeholder-slate-400"
      />
    </div>
  );
};

const LessonItem = ({ lesson, index, onUpdate, onDelete, onMove, totalLessons, isEditing, onEditToggle }) => {
  const [form, setForm] = useState({
    title: lesson.title || '',
    description: lesson.description || '',
    duration: lesson.duration || '',
    videoUrl: lesson.videoUrl || '',
    videoPublicId: lesson.videoPublicId || '',
    content: lesson.content || ''
  });
  const [isDragging, setIsDragging] = useState(false);
  const [videoFile, setVideoFile] = useState(null);
  const [videoPreview, setVideoPreview] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const videoInputRef = useRef(null);

  const hasVideo = form.videoUrl || form.videoPublicId || videoFile;

  const handleSave = () => {
    onUpdate(lesson._id || `new-${index}`, form);
    onEditToggle(null);
  };

  const handleVideoSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 100 * 1024 * 1024) {
      alert('Video must be less than 100MB');
      return;
    }
    setVideoFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setVideoPreview(reader.result);
    reader.readAsDataURL(file);
  };

  const handleVideoUpload = async () => {
    if (!videoFile) return form.videoUrl;
    setIsUploading(true);
    setUploadProgress(0);
    try {
      const formData = new FormData();
      formData.append('video', videoFile);
      
      const xhr = new XMLHttpRequest();
      
      const result = await new Promise((resolve, reject) => {
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            setUploadProgress(Math.round((e.loaded / e.total) * 100));
          }
        };
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve(JSON.parse(xhr.responseText));
          } else {
            reject(new Error('Upload failed'));
          }
        };
        xhr.onerror = () => reject(new Error('Upload failed'));
        xhr.open('POST', `${API_BASE_URL}/courses/upload-lesson-video`);
        xhr.setRequestHeader('Authorization', `Bearer ${localStorage.getItem('token')}`);
        xhr.send(formData);
      });

      setForm(prev => ({
        ...prev,
        videoUrl: result.url,
        videoPublicId: result.publicId
      }));
      return result.url;
    } catch (err) {
      console.error('Video upload failed', err);
      alert('Failed to upload video');
      return form.videoUrl;
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleDragStart = (e) => {
    setIsDragging(true);
    e.dataTransfer.setData('text/plain', index.toString());
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const fromIndex = parseInt(e.dataTransfer.getData('text/plain'));
    if (fromIndex !== index) {
      onMove(fromIndex, index);
    }
  };

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      className={cn(
        "rounded-xl border transition-all duration-200 group",
        isDragging ? "opacity-50 border-indigo-300 bg-indigo-50" : "border-slate-200 bg-white",
        isEditing ? "ring-2 ring-indigo-500/20 shadow-lg" : "hover:border-slate-300 hover:shadow-md"
      )}
    >
      {isEditing ? (
        <div className="p-5 space-y-4">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center text-sm font-bold shadow-lg">
              {index + 1}
            </div>
            <span className="text-sm font-bold text-slate-500">Lesson {index + 1}</span>
          </div>
          
          <div>
            <FieldLabel required>Lesson Title</FieldLabel>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Enter lesson title"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50 transition-all font-medium"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <FieldLabel hint="e.g., 15m, 1h 30m">Duration</FieldLabel>
              <input
                type="text"
                value={form.duration}
                onChange={(e) => setForm(prev => ({ ...prev, duration: e.target.value }))}
                placeholder="e.g. 15m"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50 transition-all"
              />
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-indigo-50/50 to-purple-50/50 rounded-xl p-4 border border-indigo-100">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center">
                <Video className="w-4 h-4 text-indigo-600" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-800">Lesson Video</h4>
                <p className="text-xs text-slate-500">Upload a video for this lesson</p>
              </div>
              {hasVideo && (
                <span className="ml-auto px-2 py-1 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-lg">
                  Video Added
                </span>
              )}
            </div>
            
            <input
              type="file"
              ref={videoInputRef}
              accept="video/*"
              onChange={handleVideoSelect}
              className="hidden"
            />
            
            {(videoPreview || form.videoUrl) ? (
              <div className="relative rounded-xl overflow-hidden bg-slate-900 aspect-video shadow-lg">
                <video
                  src={videoPreview || getVideoUrl(form.videoUrl)}
                  className="w-full h-full object-contain"
                  controls
                  poster=""
                />
                {videoFile && !isUploading && (
                  <div className="absolute top-3 right-3">
                    <button
                      type="button"
                      onClick={() => { setVideoFile(null); setVideoPreview(null); }}
                      className="p-2 bg-slate-800/80 text-white rounded-lg hover:bg-slate-700 transition-all text-xs font-medium flex items-center gap-1"
                    >
                      <X className="w-3 h-3" /> Change
                    </button>
                  </div>
                )}
                {isUploading && (
                  <div className="absolute inset-0 bg-slate-900/80 flex flex-col items-center justify-center">
                    <div className="w-32 h-1.5 bg-slate-700 rounded-full overflow-hidden mb-3">
                      <div 
                        className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                    <p className="text-white text-sm font-medium">Uploading... {uploadProgress}%</p>
                  </div>
                )}
                {hasVideo && !videoFile && (
                  <div className="absolute bottom-3 left-3 px-3 py-1.5 bg-black/70 text-white text-xs font-medium rounded-lg flex items-center gap-2 backdrop-blur-sm">
                    <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                    <Video className="w-3 h-3" /> Video uploaded
                  </div>
                )}
              </div>
            ) : (
              <div
                onClick={() => videoInputRef.current?.click()}
                className="border-2 border-dashed border-indigo-200 rounded-xl p-8 text-center cursor-pointer hover:border-indigo-400 hover:bg-indigo-50/30 transition-all group"
              >
                <div className="w-12 h-12 rounded-xl bg-indigo-100 flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                  <Upload className="w-6 h-6 text-indigo-600" />
                </div>
                <p className="text-sm font-bold text-slate-700 mb-1">Click to upload video</p>
                <p className="text-xs text-slate-400">MP4, MOV, WebM • Max 100MB</p>
              </div>
            )}
            
            {isUploading && videoFile && (
              <div className="mt-3">
                <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
                <p className="text-xs text-slate-500 mt-1.5 flex items-center gap-2">
                  <Loader2 className="w-3 h-3 animate-spin" /> Uploading video... {uploadProgress}%
                </p>
              </div>
            )}
            
            <div className="mt-3">
              <p className="text-xs text-slate-500 mb-2 font-medium">Or paste video URL</p>
              <div className="relative">
                <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={form.videoUrl}
                  onChange={(e) => setForm(prev => ({ ...prev, videoUrl: e.target.value }))}
                  placeholder="https://youtube.com/watch?v=... or external video URL"
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:border-indigo-400 transition-all"
                />
              </div>
            </div>
          </div>
          
          <div>
            <FieldLabel hint="Brief description of what students will learn">Description</FieldLabel>
            <textarea
              rows={2}
              value={form.description}
              onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
              placeholder="What will students learn in this lesson?"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none resize-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50 transition-all"
            />
          </div>
          
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
            <div className="flex items-center gap-2 mb-3">
              <BookOpen className="w-4 h-4 text-slate-600" />
              <FieldLabel className="mb-0">Lesson Content</FieldLabel>
            </div>
            <textarea
              rows={5}
              value={form.content}
              onChange={(e) => setForm(prev => ({ ...prev, content: e.target.value }))}
              placeholder="Write lesson content, notes, code examples, or additional resources here... (Markdown supported)"
              className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm outline-none resize-none focus:border-indigo-400 transition-all font-mono text-xs"
            />
            <p className="text-[11px] text-slate-400 mt-2 flex items-center gap-2">
              <Bold className="w-3 h-3" /> <Italic className="w-3 h-3" /> <ListIcon className="w-3 h-3" /> Markdown formatting supported
            </p>
          </div>
          
          <div className="flex items-center gap-3 pt-3 border-t border-slate-100">
            <button
              onClick={handleSave}
              disabled={!form.title.trim()}
              className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white text-sm font-bold rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-indigo-200"
            >
              <Check className="w-4 h-4" /> Save Lesson
            </button>
            <button
              onClick={() => onEditToggle(null)}
              className="flex items-center gap-2 px-5 py-2.5 text-slate-600 text-sm font-bold border border-slate-200 rounded-xl hover:bg-slate-50 transition-all"
            >
              <X className="w-4 h-4" /> Cancel
            </button>
            {lesson._id && (
              <button
                onClick={() => onDelete(lesson._id)}
                className="ml-auto flex items-center gap-2 px-4 py-2.5 text-rose-600 text-sm font-bold hover:bg-rose-50 rounded-xl transition-all"
              >
                <Trash2 className="w-4 h-4" /> Delete
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-3 p-3">
          <div className="cursor-grab active:cursor-grabbing text-slate-300 hover:text-slate-500 transition-colors">
            <GripVertical className="w-4 h-4" />
          </div>
          <span className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center text-xs font-bold shrink-0">
            {index + 1}
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-slate-800 truncate">{lesson.title || 'Untitled Lesson'}</p>
            <div className="flex items-center gap-2 text-[11px] text-slate-400">
              {lesson.duration && <span className="flex items-center gap-0.5"><Clock className="w-3 h-3" />{lesson.duration}</span>}
              {lesson.videoUrl && <span className="flex items-center gap-0.5"><ExternalLink className="w-3 h-3" />Video</span>}
              {lesson.content && <span className="flex items-center gap-0.5"><BookOpen className="w-3 h-3" />Content</span>}
            </div>
          </div>
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => onEditToggle(lesson._id || `new-${index}`)}
              className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
              title="Edit lesson"
            >
              <Edit3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => onMove(index, Math.max(0, index - 1))}
              disabled={index === 0}
              className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg disabled:opacity-30 disabled:hover:text-slate-400 disabled:hover:bg-transparent transition-all"
              title="Move up"
            >
              <ChevronUp className="w-4 h-4" />
            </button>
            <button
              onClick={() => onMove(index, Math.min(totalLessons - 1, index + 1))}
              disabled={index === totalLessons - 1}
              className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg disabled:opacity-30 disabled:hover:text-slate-400 disabled:hover:bg-transparent transition-all"
              title="Move down"
            >
              <ChevronDown className="w-4 h-4" />
            </button>
            <button
              onClick={() => onDelete(lesson._id)}
              className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
              title="Delete lesson"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const CoursePreviewModal = ({ course, onClose }) => {
  if (!course) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden animate-scale-in">
        <div className="relative h-48 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500">
          {getThumbnailUrl(course.thumbnail) && (
            <img src={getThumbnailUrl(course.thumbnail)} alt={course.title} className="absolute inset-0 w-full h-full object-cover" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 bg-white/20 hover:bg-white/30 text-white rounded-lg backdrop-blur-sm transition-all"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="absolute bottom-4 left-6 right-6">
            <div className="flex items-center gap-2 mb-2">
              <span className={cn(
                "px-2.5 py-1 rounded-lg text-xs font-bold",
                course.status === 'published'
                  ? 'bg-emerald-500/90 text-white'
                  : 'bg-amber-500/90 text-white'
              )}>
                {course.status === 'published' ? 'Published' : 'Draft'}
              </span>
              <span className="px-2.5 py-1 bg-white/20 backdrop-blur-sm text-white text-xs font-medium rounded-lg">
                {course.level}
              </span>
            </div>
            <h2 className="text-2xl font-black text-white">{course.title}</h2>
          </div>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-12rem)]">
          <div className="flex items-center gap-4 mb-4">
            <span className="text-2xl font-black text-slate-900">
              {course.price > 0 ? `$${course.price.toFixed(2)}` : 'Free'}
            </span>
            <span className="px-2 py-1 bg-indigo-100 text-indigo-700 text-xs font-bold rounded-lg">
              {course.category}
            </span>
          </div>

          {course.description && (
            <p className="text-sm text-slate-600 mb-6 leading-relaxed">{course.description}</p>
          )}

          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className="bg-slate-50 rounded-xl p-3 text-center">
              <div className="flex items-center justify-center gap-1.5 text-indigo-600 mb-1">
                <Users className="w-4 h-4" />
                <span className="text-xs font-medium">Students</span>
              </div>
              <p className="text-lg font-bold text-slate-900">{course.enrolledCount || 0}</p>
            </div>
            <div className="bg-slate-50 rounded-xl p-3 text-center">
              <div className="flex items-center justify-center gap-1.5 text-amber-500 mb-1">
                <Star className="w-4 h-4" fill="currentColor" />
                <span className="text-xs font-medium">Rating</span>
              </div>
              <p className="text-lg font-bold text-slate-900">{course.rating?.toFixed(1) || '0.0'}</p>
            </div>
            <div className="bg-slate-50 rounded-xl p-3 text-center">
              <div className="flex items-center justify-center gap-1.5 text-emerald-500 mb-1">
                <EyeIcon className="w-4 h-4" />
                <span className="text-xs font-medium">Views</span>
              </div>
              <p className="text-lg font-bold text-slate-900">{course.views || 0}</p>
            </div>
          </div>

          {course.lessons?.length > 0 && (
            <div>
              <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                <ListIcon className="w-4 h-4" /> Course Content ({course.lessons.length} lessons)
              </h3>
              <div className="space-y-2">
                {course.lessons.map((lesson, idx) => (
                  <div key={idx} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                    <span className="w-6 h-6 rounded-md bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-bold">
                      {idx + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-800 truncate">{lesson.title}</p>
                      <p className="text-[11px] text-slate-400">{lesson.duration || 'No duration'}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {course.tags?.length > 0 && (
            <div className="mt-6 flex flex-wrap gap-1.5">
              {course.tags.map((tag, idx) => (
                <span key={idx} className="px-2 py-1 bg-slate-100 text-slate-600 text-xs font-medium rounded-md">
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="p-4 border-t border-slate-100 bg-slate-50/50">
          <button
            onClick={onClose}
            className="w-full py-2.5 bg-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-300 transition-all"
          >
            Close Preview
          </button>
        </div>
      </div>
    </div>
  );
};

const CourseAnalyticsPanel = ({ courseId, onClose }) => {
  const [stats, setStats] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [analyticsData, reviewsData] = await Promise.all([
          mentorService.getAnalytics('90d'),
          courseReviewService.getMentorCourseReviews({ limit: 10 })
        ]);
        
        const courseStats = analyticsData.courseStats?.find(c => c.courseId.toString() === courseId);
        setStats(courseStats || { enrollments: 0, completionRate: 0, views: 0, rating: 0 });
        
        const filteredReviews = reviewsData.reviews?.filter(r => 
          r.course?._id?.toString() === courseId
        ) || [];
        setReviews(filteredReviews);
      } catch (err) {
        console.error('Failed to fetch analytics', err);
        setStats({ enrollments: 0, completionRate: 0, views: 0, rating: 0 });
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [courseId]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden animate-scale-in">
        <div className="flex items-center justify-between p-4 border-b border-slate-100">
          <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-indigo-600" /> Course Analytics
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg transition-all">
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        <div className="flex border-b border-slate-100">
          {['overview', 'reviews'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "flex-1 py-3 text-sm font-bold transition-all capitalize",
                activeTab === tab
                  ? "text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/50"
                  : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
              )}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-12rem)]">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
            </div>
          ) : activeTab === 'overview' ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-indigo-600 mb-2">
                    <Users className="w-4 h-4" />
                    <span className="text-xs font-medium">Enrollments</span>
                  </div>
                  <p className="text-2xl font-black text-slate-900">{stats?.enrollments || 0}</p>
                </div>
                <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-emerald-600 mb-2">
                    <TrendingUp className="w-4 h-4" />
                    <span className="text-xs font-medium">Completion</span>
                  </div>
                  <p className="text-2xl font-black text-slate-900">{stats?.completionRate || 0}%</p>
                </div>
                <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-amber-600 mb-2">
                    <EyeIcon className="w-4 h-4" />
                    <span className="text-xs font-medium">Views</span>
                  </div>
                  <p className="text-2xl font-black text-slate-900">{stats?.views || 0}</p>
                </div>
                <div className="bg-gradient-to-br from-rose-50 to-rose-100 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-rose-600 mb-2">
                    <Star className="w-4 h-4" fill="currentColor" />
                    <span className="text-xs font-medium">Rating</span>
                  </div>
                  <p className="text-2xl font-black text-slate-900">{stats?.rating?.toFixed(1) || '0.0'}</p>
                </div>
              </div>

              <div className="bg-slate-50 rounded-xl p-4 mt-4">
                <h4 className="text-sm font-bold text-slate-900 mb-2">Quick Insights</h4>
                <ul className="space-y-2 text-sm text-slate-600">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    {stats?.enrollments > 0 
                      ? `${stats.enrollments} student${stats.enrollments > 1 ? 's' : ''} enrolled in this course`
                      : 'No students enrolled yet'}
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    {stats?.views > 0 
                      ? `${stats.views} total page views`
                      : 'No views yet'}
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    {stats?.completionRate > 0 
                      ? `${stats.completionRate}% of enrolled students completed the course`
                      : 'Start promoting to get enrollments!'}
                  </li>
                </ul>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {reviews.length === 0 ? (
                <div className="text-center py-8">
                  <MessageSquare className="w-10 h-10 text-slate-200 mx-auto mb-2" />
                  <p className="text-sm text-slate-500">No reviews yet</p>
                </div>
              ) : (
                reviews.map(review => (
                  <div key={review._id} className="p-4 bg-slate-50 rounded-xl">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-sm font-bold">
                          {review.user?.name?.[0] || 'U'}
                        </div>
                        <span className="text-sm font-semibold text-slate-900">{review.user?.name || 'Anonymous'}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={cn(
                              "w-3.5 h-3.5",
                              i < review.rating ? "text-amber-400 fill-amber-400" : "text-slate-200"
                            )}
                          />
                        ))}
                      </div>
                    </div>
                    {review.comment && (
                      <p className="text-sm text-slate-600 mb-2">{review.comment}</p>
                    )}
                    {review.mentorReply ? (
                      <div className="pl-3 border-l-2 border-indigo-200 text-sm">
                        <span className="text-xs font-bold text-indigo-600">Your reply:</span>
                        <p className="text-slate-600">{review.mentorReply.text}</p>
                      </div>
                    ) : (
                      <button
                        className="text-xs font-medium text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
                        onClick={() => {
                          const reply = prompt('Enter your reply:');
                          if (reply?.trim()) {
                            courseReviewService.replyToReview(review._id, reply).then(() => {
                              setReviews(prev => prev.map(r => 
                                r._id === review._id 
                                  ? { ...r, mentorReply: { text: reply, repliedAt: new Date() } }
                                  : r
                              ));
                            });
                          }
                        }}
                      >
                        <MessageSquare className="w-3 h-3" /> Reply to review
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const CourseCard = ({ course, onEdit, onDelete, onTogglePublish, onDuplicate, onPreview, onAnalytics, isSelected, onSelect }) => {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div
      className={cn(
        "bg-white rounded-2xl border shadow-sm overflow-hidden transition-all duration-200 hover:shadow-lg group",
        isSelected ? "ring-2 ring-indigo-500 border-indigo-500" : "border-slate-100 hover:border-slate-200"
      )}
    >
      <div className="relative h-36 bg-gradient-to-br from-slate-100 to-slate-200 overflow-hidden">
        {course.thumbnail ? (
          <img src={getThumbnailUrl(course.thumbnail)} alt={course.title} className="w-full h-full object-cover" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <BookOpen className="w-12 h-12 text-slate-300" />
          </div>
        )}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={(e) => { e.stopPropagation(); onSelect(course._id); }}
              className={cn(
                "w-5 h-5 rounded border-2 flex items-center justify-center transition-all",
                isSelected
                  ? "bg-indigo-600 border-indigo-600"
                  : "bg-white/80 border-slate-300 hover:border-indigo-400"
              )}
            >
              {isSelected && <Check className="w-3 h-3 text-white" />}
            </button>
            <span className={cn(
              "px-2 py-0.5 rounded-lg text-[10px] font-bold border shadow-sm",
              course.status === 'published'
                ? 'bg-emerald-500 text-white border-emerald-600'
                : 'bg-amber-500 text-white border-amber-600'
            )}>
              {course.status === 'published' ? 'Published' : 'Draft'}
            </span>
          </div>
          <div className="relative">
            <button
              onClick={(e) => { e.stopPropagation(); setMenuOpen(!menuOpen); }}
              className="p-1.5 bg-white/80 backdrop-blur-sm rounded-lg hover:bg-white transition-all"
            >
              <MoreVertical className="w-4 h-4 text-slate-600" />
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-full mt-1 w-36 bg-white rounded-xl shadow-lg border border-slate-100 py-1 z-50 animate-dropdown overflow-visible">
                <button
                  onClick={(e) => { e.stopPropagation(); onPreview(course); setMenuOpen(false); }}
                  className="w-full px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                >
                  <EyeIcon className="w-4 h-4" /> Preview
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); onAnalytics(course._id); setMenuOpen(false); }}
                  className="w-full px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                >
                  <BarChart3 className="w-4 h-4" /> Analytics
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); onDuplicate(course); setMenuOpen(false); }}
                  className="w-full px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                >
                  <Copy className="w-4 h-4" /> Duplicate
                </button>
                <hr className="my-1 border-slate-100" />
                <button
                  onClick={(e) => { e.stopPropagation(); onDelete(course._id); setMenuOpen(false); }}
                  className="w-full px-3 py-2 text-left text-sm text-rose-600 hover:bg-rose-50 flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" /> Delete
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="p-4">
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">
            {course.level}
          </span>
          <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">
            {course.category}
          </span>
          <span className={cn(
            "text-[10px] font-bold px-2 py-0.5 rounded-md",
            course.price > 0 ? "text-indigo-600 bg-indigo-50" : "text-emerald-600 bg-emerald-50"
          )}>
            {course.price > 0 ? `$${course.price}` : 'Free'}
          </span>
        </div>

        <h3 className="text-base font-black text-slate-900 mb-3 line-clamp-2">{course.title}</h3>

        <div className="flex items-center gap-4 text-xs text-slate-400 font-medium mb-4">
          <span className="flex items-center gap-1">
            <BookOpen className="w-3.5 h-3.5" /> {course.lessons?.length || 0}
          </span>
          <span className="flex items-center gap-1">
            <Users className="w-3.5 h-3.5" /> {course.enrolledCount || 0}
          </span>
          <span className="flex items-center gap-1">
            <Star className="w-3.5 h-3.5 text-amber-400" fill="currentColor" /> {course.rating?.toFixed(1) || '0.0'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onEdit(course)}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-bold text-slate-600 border border-slate-200 rounded-xl hover:border-indigo-300 hover:text-indigo-600 hover:bg-indigo-50 transition-all"
          >
            <Edit3 className="w-3.5 h-3.5" /> Edit
          </button>
          <button
            onClick={() => onTogglePublish(course)}
            className={cn(
              "flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-bold rounded-xl transition-all",
              course.status === 'published'
                ? 'text-amber-600 border border-amber-200 hover:border-amber-300 hover:bg-amber-50'
                : 'text-emerald-600 border border-emerald-200 hover:border-emerald-300 hover:bg-emerald-50'
            )}
          >
            {course.status === 'published' ? <><EyeOff className="w-3.5 h-3.5" /> Unpublish</> : <><Eye className="w-3.5 h-3.5" /> Publish</>}
          </button>
        </div>
      </div>
    </div>
  );
};

const MentorCourses = () => {
  const [courses, setCourses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [view, setView] = useState('list');
  const [showForm, setShowForm] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [courseForm, setCourseForm] = useState(emptyCourse);
  const [lessons, setLessons] = useState([]);
  const [thumbnailFile, setThumbnailFile] = useState(null);
  const [thumbnailPreview, setThumbnailPreview] = useState('');
  const [autoSaveStatus, setAutoSaveStatus] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [selectedCourses, setSelectedCourses] = useState(new Set());
  const [previewCourse, setPreviewCourse] = useState(null);
  const [analyticsCourseId, setAnalyticsCourseId] = useState(null);
  const [editingLessonId, setEditingLessonId] = useState(null);
  const [newLessonForm, setNewLessonForm] = useState(emptyLesson);
  const [showAddLesson, setShowAddLesson] = useState(false);
  const [bulkMenuOpen, setBulkMenuOpen] = useState(false);
  const fileInputRef = useRef(null);
  const autoSaveTimer = useRef(null);

  useEffect(() => {
    loadCourses();
  }, []);

  useEffect(() => {
    if (showForm && !editingCourse) {
      if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
      autoSaveTimer.current = setTimeout(() => {
        try {
          localStorage.setItem(DRAFT_KEY, JSON.stringify({ 
            courseForm: { ...courseForm, tags: courseForm.tags }, 
            lessons, 
            savedAt: new Date().toISOString() 
          }));
          setAutoSaveStatus('Draft saved');
          setTimeout(() => setAutoSaveStatus(''), 2000);
        } catch {}
      }, 3000);
    }
    return () => { if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current); };
  }, [courseForm, lessons, showForm, editingCourse]);

  const loadCourses = async () => {
    try {
      const data = await courseService.getMyCourses();
      setCourses(data || []);
    } catch (err) {
      console.error('Failed to load courses', err);
    } finally {
      setIsLoading(false);
    }
  };

  const patch = (k, v) => setCourseForm(prev => ({ ...prev, [k]: v }));

  const filteredCourses = courses
    .filter(c => {
      if (search && !c.title.toLowerCase().includes(search.toLowerCase())) return false;
      if (statusFilter !== 'all' && c.status !== statusFilter) return false;
      if (categoryFilter !== 'all' && c.category !== categoryFilter) return false;
      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'oldest': return new Date(a.createdAt) - new Date(b.createdAt);
        case 'title': return a.title.localeCompare(b.title);
        case 'popular': return (b.enrolledCount || 0) - (a.enrolledCount || 0);
        case 'rating': return (b.rating || 0) - (a.rating || 0);
        default: return new Date(b.createdAt) - new Date(a.createdAt);
      }
    });

  const openCreate = () => {
    try {
      const saved = localStorage.getItem(DRAFT_KEY);
      if (saved) {
        const draft = JSON.parse(saved);
        if (draft.courseForm?.title) {
          const shouldRestore = window.confirm('You have a saved draft. Would you like to restore it?');
          if (shouldRestore) {
            setCourseForm({ ...draft.courseForm, tags: draft.courseForm.tags || [] });
            setLessons(draft.lessons || []);
          } else {
            localStorage.removeItem(DRAFT_KEY);
            setCourseForm(emptyCourse);
            setLessons([]);
          }
        } else {
          setCourseForm(emptyCourse);
          setLessons([]);
        }
      } else {
        setCourseForm(emptyCourse);
        setLessons([]);
      }
    } catch {
      setCourseForm(emptyCourse);
      setLessons([]);
    }
    setEditingCourse(null);
    setEditingLessonId(null);
    setThumbnailFile(null);
    setThumbnailPreview('');
    setShowForm(true);
    setShowAddLesson(false);
  };

  const openEdit = (course) => {
    setEditingCourse(course);
    setCourseForm({
      title: course.title,
      description: course.description || '',
      category: course.category || 'Frontend',
      level: course.level || 'Beginner',
      tags: course.tags || [],
      thumbnail: course.thumbnail || '',
      price: course.price || 0,
      isFree: !course.price || course.price === 0,
      visibility: course.visibility || 'public'
    });
    setLessons(course.lessons || []);
    setEditingLessonId(null);
    setThumbnailFile(null);
    setThumbnailPreview(course.thumbnail || '');
    setShowForm(true);
    setShowAddLesson(false);
  };

  const handleThumbnailSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { alert('Image must be less than 5MB'); return; }
    setThumbnailFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setThumbnailPreview(reader.result);
    reader.readAsDataURL(file);
  };

  const handleThumbnailUpload = async () => {
    if (!thumbnailFile) return courseForm.thumbnail;
    try {
      const formData = new FormData();
      formData.append('image', thumbnailFile);
      const result = await courseService.uploadThumbnail(formData);
      return result.url;
    } catch (err) {
      console.error('Upload failed', err);
      return courseForm.thumbnail;
    }
  };

  const handleSaveCourse = async () => {
    if (!courseForm.title.trim()) return;
    setIsSaving(true);
    try {
      let thumbnailUrl = courseForm.thumbnail;
      if (thumbnailFile) {
        thumbnailUrl = await handleThumbnailUpload();
      }

      const data = {
        ...courseForm,
        thumbnail: thumbnailUrl,
        price: courseForm.isFree ? 0 : parseFloat(courseForm.price) || 0,
        tags: Array.isArray(courseForm.tags) ? courseForm.tags : courseForm.tags.split(',').map(t => t.trim()).filter(Boolean)
      };

      let saved;
      if (editingCourse) {
        saved = await courseService.updateCourse(editingCourse._id, data);
      } else {
        saved = await courseService.createCourse(data);
        localStorage.removeItem(DRAFT_KEY);
      }

      const newLessons = lessons.filter(l => !l._id);
      const updatedLessons = lessons.filter(l => l._id);

      for (const lesson of newLessons) {
        let lessonData = { ...lesson };
        if (lesson.videoUrl && !lesson.videoUrl.startsWith('http') && !lesson.videoPublicId) {
          try {
            const formData = new FormData();
            const videoResponse = await fetch(lesson.videoUrl);
            const videoBlob = await videoResponse.blob();
            formData.append('video', videoBlob, 'lesson-video.mp4');
            const result = await courseService.uploadLessonVideo(formData);
            lessonData.videoUrl = result.url;
            lessonData.videoPublicId = result.publicId;
          } catch (err) {
            console.error('Failed to upload lesson video', err);
          }
        }
        await courseService.addLesson(saved._id, lessonData);
      }

      for (const lesson of updatedLessons) {
        await courseService.updateLesson(saved._id, lesson._id, lesson);
      }

      setShowForm(false);
      loadCourses();
    } catch (err) {
      console.error('Failed to save course', err);
      alert('Failed to save course. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (courseId) => {
    if (!window.confirm('Delete this course? This action cannot be undone.')) return;
    try {
      await courseService.deleteCourse(courseId);
      setCourses(prev => prev.filter(c => c._id !== courseId));
      setSelectedCourses(prev => {
        const next = new Set(prev);
        next.delete(courseId);
        return next;
      });
    } catch (err) {
      console.error('Failed to delete course', err);
    }
  };

  const handleTogglePublish = async (course) => {
    try {
      if (course.status === 'published') {
        await courseService.unpublishCourse(course._id);
      } else {
        await courseService.publishCourse(course._id);
      }
      loadCourses();
    } catch (err) {
      console.error('Failed to toggle publish', err);
    }
  };

  const handleDuplicate = async (course) => {
    try {
      const duplicated = await courseService.duplicateCourse(course._id);
      setCourses(prev => [duplicated, ...prev]);
    } catch (err) {
      console.error('Failed to duplicate course', err);
    }
  };

  const handleBulkDelete = async () => {
    if (!window.confirm(`Delete ${selectedCourses.size} course(s)? This cannot be undone.`)) return;
    setIsLoading(true);
    try {
      await Promise.all(Array.from(selectedCourses).map(id => courseService.deleteCourse(id)));
      setCourses(prev => prev.filter(c => !selectedCourses.has(c._id)));
      setSelectedCourses(new Set());
    } catch (err) {
      console.error('Bulk delete failed', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBulkPublish = async (publish = true) => {
    setIsLoading(true);
    try {
      await Promise.all(
        Array.from(selectedCourses).map(id => 
          publish ? courseService.publishCourse(id) : courseService.unpublishCourse(id)
        )
      );
      loadCourses();
      setSelectedCourses(new Set());
    } catch (err) {
      console.error('Bulk publish failed', err);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleSelect = (courseId) => {
    setSelectedCourses(prev => {
      const next = new Set(prev);
      if (next.has(courseId)) next.delete(courseId);
      else next.add(courseId);
      return next;
    });
  };

  const selectAll = () => {
    if (selectedCourses.size === filteredCourses.length) {
      setSelectedCourses(new Set());
    } else {
      setSelectedCourses(new Set(filteredCourses.map(c => c._id)));
    }
  };

  const handleMoveLesson = (fromIdx, toIdx) => {
    if (toIdx < 0 || toIdx >= lessons.length) return;
    setLessons(prev => {
      const updated = [...prev];
      const [moved] = updated.splice(fromIdx, 1);
      updated.splice(toIdx, 0, moved);
      return updated;
    });
  };

  const handleDeleteLesson = async (lessonId) => {
    if (!lessonId || lessonId.startsWith('new-')) {
      setLessons(prev => prev.filter((_, i) => lessonId !== `new-${i}`));
      return;
    }
    if (!editingCourse) {
      setLessons(prev => prev.filter((l, i) => l._id !== lessonId));
      return;
    }
    try {
      await courseService.deleteLesson(editingCourse._id, lessonId);
      setLessons(prev => prev.filter(l => l._id !== lessonId));
    } catch (err) {
      console.error('Failed to delete lesson', err);
    }
  };

  const handleUpdateLesson = (lessonId, formData) => {
    if (lessonId.startsWith('new-')) {
      const idx = parseInt(lessonId.replace('new-', ''));
      setLessons(prev => prev.map((l, i) => i === idx ? { ...l, ...formData } : l));
    } else {
      setLessons(prev => prev.map(l => l._id === lessonId ? { ...l, ...formData } : l));
    }
  };

  const handleAddLesson = () => {
    if (!newLessonForm.title.trim()) return;
    setLessons(prev => [...prev, { ...newLessonForm }]);
    setNewLessonForm(emptyLesson);
    setShowAddLesson(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
      </div>
    );
  }

  if (showForm) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              {editingCourse ? 'Edit Course' : 'Create New Course'}
            </h1>
            {autoSaveStatus && (
              <span className="text-xs font-bold text-emerald-600 flex items-center gap-1 mt-1">
                <Save className="w-3 h-3" /> {autoSaveStatus}
              </span>
            )}
          </div>
          <button onClick={() => setShowForm(false)} className="p-2 rounded-lg hover:bg-slate-100">
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-5">
          <div>
            <FieldLabel required>Course Title</FieldLabel>
            <input
              type="text"
              value={courseForm.title}
              onChange={e => patch('title', e.target.value)}
              placeholder="e.g. Advanced React Patterns"
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50 transition-all"
            />
          </div>

          <div>
            <FieldLabel>Description</FieldLabel>
            <textarea
              rows={3}
              value={courseForm.description}
              onChange={e => patch('description', e.target.value)}
              placeholder="What will students learn? Describe your course..."
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 outline-none resize-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50 transition-all"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <FieldLabel>Category</FieldLabel>
              <select
                value={courseForm.category}
                onChange={e => patch('category', e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 outline-none"
              >
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <FieldLabel>Level</FieldLabel>
              <select
                value={courseForm.level}
                onChange={e => patch('level', e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 outline-none"
              >
                {LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
            <div>
              <FieldLabel>Visibility</FieldLabel>
              <select
                value={courseForm.visibility}
                onChange={e => patch('visibility', e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 outline-none"
              >
                <option value="public">Public</option>
                <option value="unlisted">Unlisted (Link only)</option>
                <option value="private">Private (You only)</option>
              </select>
            </div>
          </div>

          <div className="bg-slate-50 rounded-xl p-4 space-y-3">
            <FieldLabel>Pricing</FieldLabel>
            <div className="flex items-center gap-4">
              <button
                onClick={() => patch('isFree', true)}
                className={cn(
                  "flex-1 py-2.5 rounded-xl text-sm font-bold border transition-all",
                  courseForm.isFree
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-200'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-emerald-300'
                )}
              >
                Free
              </button>
              <button
                onClick={() => patch('isFree', false)}
                className={cn(
                  "flex-1 py-2.5 rounded-xl text-sm font-bold border transition-all flex items-center justify-center gap-1.5",
                  !courseForm.isFree
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-200'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-300'
                )}
              >
                <DollarSign className="w-4 h-4" /> Paid
              </button>
            </div>
            {!courseForm.isFree && (
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-slate-400" />
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={courseForm.price}
                  onChange={e => patch('price', e.target.value)}
                  placeholder="29.99"
                  className="flex-1 px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-800 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50 transition-all"
                />
                <span className="text-sm font-bold text-slate-500">USD</span>
              </div>
            )}
          </div>

          <div>
            <FieldLabel>Tags</FieldLabel>
            <TagInput
              tags={Array.isArray(courseForm.tags) ? courseForm.tags : []}
              onChange={(tags) => patch('tags', tags)}
              placeholder="Type and press Enter to add tags..."
            />
          </div>

          <div>
            <FieldLabel hint="Recommended: 1280x720 or 16:9 aspect ratio">Course Thumbnail</FieldLabel>
            <div className="flex items-start gap-4">
              <div
                className="w-40 h-24 rounded-xl bg-slate-100 border-2 border-dashed border-slate-200 flex items-center justify-center overflow-hidden cursor-pointer hover:border-indigo-400 transition-colors shrink-0"
                onClick={() => fileInputRef.current?.click()}
              >
                {thumbnailPreview ? (
                  <img src={thumbnailPreview} alt="Thumbnail" className="w-full h-full object-cover" />
                ) : (
                  <div className="text-center p-2">
                    <ImageIcon className="w-6 h-6 text-slate-300 mx-auto" />
                    <span className="text-[10px] text-slate-400 font-bold mt-1 block">Upload</span>
                  </div>
                )}
              </div>
              <div className="flex-1">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleThumbnailSelect}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:border-indigo-300 transition-all"
                >
                  <Upload className="w-3.5 h-3.5" /> Choose Image
                </button>
                <p className="text-[10px] text-slate-400 mt-1.5">JPG, PNG or GIF. Max 5MB.</p>
                <input
                  type="text"
                  value={courseForm.thumbnail}
                  onChange={e => { patch('thumbnail', e.target.value); setThumbnailPreview(e.target.value); }}
                  placeholder="Or paste image URL"
                  className="w-full mt-2 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:border-indigo-400 transition-all"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
              <ListIcon className="w-5 h-5 text-indigo-600" /> Lessons ({lessons.length})
            </h2>
            <button
              onClick={() => setShowAddLesson(true)}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-bold rounded-xl hover:bg-indigo-700 transition-all"
            >
              <Plus className="w-4 h-4" /> Add Lesson
            </button>
          </div>

          {lessons.length > 0 ? (
            <div className="space-y-2 mb-4">
              {lessons.map((lesson, idx) => (
                <LessonItem
                  key={lesson._id || `new-${idx}`}
                  lesson={lesson}
                  index={idx}
                  totalLessons={lessons.length}
                  isEditing={editingLessonId === (lesson._id || `new-${idx}`)}
                  onEditToggle={setEditingLessonId}
                  onUpdate={handleUpdateLesson}
                  onDelete={handleDeleteLesson}
                  onMove={handleMoveLesson}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-8 bg-slate-50 rounded-xl border border-dashed border-slate-200">
              <BookOpen className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-sm text-slate-500 font-medium">No lessons yet</p>
              <p className="text-xs text-slate-400">Add lessons to your course to start teaching</p>
            </div>
          )}

          {showAddLesson && (
            <div className="border border-dashed border-slate-200 rounded-xl p-4 space-y-3 bg-slate-50/50">
              <input
                type="text"
                value={newLessonForm.title}
                onChange={e => setNewLessonForm(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Lesson title"
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm outline-none focus:border-indigo-400 transition-all"
              />
              <div className="grid grid-cols-1 gap-3">
                <input
                  type="text"
                  value={newLessonForm.duration}
                  onChange={e => setNewLessonForm(prev => ({ ...prev, duration: e.target.value }))}
                  placeholder="Duration (e.g. 15m)"
                  className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm outline-none focus:border-indigo-400 transition-all"
                />
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-1">Add video after creating lesson</p>
                <input
                  type="text"
                  value={newLessonForm.videoUrl}
                  onChange={e => setNewLessonForm(prev => ({ ...prev, videoUrl: e.target.value }))}
                  placeholder="Video URL (optional)"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm outline-none focus:border-indigo-400 transition-all"
                />
              </div>
              <textarea
                rows={2}
                value={newLessonForm.description}
                onChange={e => setNewLessonForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Lesson description (optional)"
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm outline-none resize-none focus:border-indigo-400 transition-all"
              />
              <div className="flex items-center gap-2">
                <button
                  onClick={handleAddLesson}
                  disabled={!newLessonForm.title.trim()}
                  className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white text-sm font-bold rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-all"
                >
                  <Plus className="w-4 h-4" /> Add
                </button>
                <button
                  onClick={() => { setShowAddLesson(false); setNewLessonForm(emptyLesson); }}
                  className="px-4 py-2 text-slate-500 text-sm font-bold hover:bg-slate-100 rounded-lg transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-between items-center">
          <button
            onClick={() => setPreviewCourse({ ...courseForm, lessons, ...(editingCourse || {}) })}
            className="flex items-center gap-2 px-4 py-2.5 text-slate-600 font-bold border border-slate-200 rounded-xl hover:bg-slate-50 transition-all"
          >
            <EyeIcon className="w-4 h-4" /> Preview
          </button>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowForm(false)}
              className="px-6 py-2.5 text-sm font-bold text-slate-500 hover:text-slate-700 border border-slate-200 rounded-xl hover:bg-slate-50 transition-all"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveCourse}
              disabled={isSaving || !courseForm.title.trim()}
              className="flex items-center gap-2 px-8 py-2.5 bg-indigo-600 text-white text-sm font-bold rounded-xl shadow-lg shadow-indigo-200 hover:bg-indigo-700 disabled:opacity-60 active:scale-95 transition-all"
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              {isSaving ? 'Saving...' : editingCourse ? 'Update Course' : 'Create Course'}
            </button>
          </div>
        </div>

        {previewCourse && (
          <CoursePreviewModal
            course={previewCourse}
            onClose={() => setPreviewCourse(null)}
          />
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">My Courses</h1>
          <p className="text-sm text-slate-500 mt-1 font-medium">{courses.length} course{courses.length !== 1 ? 's' : ''}</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white text-sm font-bold rounded-xl shadow-lg shadow-indigo-200 hover:bg-indigo-700 active:scale-95 transition-all"
        >
          <Plus className="w-4 h-4" /> Create Course
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search courses..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50 transition-all"
            />
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 outline-none"
            >
              <option value="all">All Status</option>
              <option value="published">Published</option>
              <option value="draft">Draft</option>
            </select>
            <select
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value)}
              className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 outline-none"
            >
              <option value="all">All Categories</option>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
              className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 outline-none"
            >
              {SORT_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>
            <div className="flex items-center border border-slate-200 rounded-xl overflow-hidden">
              <button
                onClick={() => setView('grid')}
                className={cn(
                  "p-2.5 transition-all",
                  view === 'grid' ? "bg-indigo-50 text-indigo-600" : "text-slate-400 hover:text-slate-600"
                )}
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setView('list')}
                className={cn(
                  "p-2.5 transition-all",
                  view === 'list' ? "bg-indigo-50 text-indigo-600" : "text-slate-400 hover:text-slate-600"
                )}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {selectedCourses.size > 0 && (
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-100">
            <span className="text-sm font-bold text-slate-600">{selectedCourses.size} selected</span>
            <div className="flex items-center gap-2">
              <button
                onClick={selectAll}
                className="px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-50 rounded-lg transition-all"
              >
                {selectedCourses.size === filteredCourses.length ? 'Deselect All' : 'Select All'}
              </button>
              <div className="relative">
                <button
                  onClick={() => setBulkMenuOpen(!bulkMenuOpen)}
                  className="flex items-center gap-2 px-4 py-1.5 bg-slate-100 text-slate-700 text-xs font-bold rounded-lg hover:bg-slate-200 transition-all"
                >
                  Bulk Actions <ChevronDown className="w-3 h-3" />
                </button>
                {bulkMenuOpen && (
                  <div className="absolute right-0 top-full mt-1 w-40 bg-white rounded-xl shadow-lg border border-slate-100 py-1 z-10 animate-dropdown">
                    <button
                      onClick={() => { handleBulkPublish(true); setBulkMenuOpen(false); }}
                      className="w-full px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                    >
                      <Eye className="w-4 h-4" /> Publish All
                    </button>
                    <button
                      onClick={() => { handleBulkPublish(false); setBulkMenuOpen(false); }}
                      className="w-full px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                    >
                      <EyeOff className="w-4 h-4" /> Unpublish All
                    </button>
                    <hr className="my-1 border-slate-100" />
                    <button
                      onClick={() => { handleBulkDelete(); setBulkMenuOpen(false); }}
                      className="w-full px-3 py-2 text-left text-sm text-rose-600 hover:bg-rose-50 flex items-center gap-2"
                    >
                      <Trash2 className="w-4 h-4" /> Delete All
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {courses.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm py-16 text-center">
          <BookOpen className="w-12 h-12 text-slate-200 mx-auto mb-4" />
          <h3 className="text-lg font-black text-slate-900 mb-2">No courses yet</h3>
          <p className="text-sm text-slate-400 font-medium mb-6">Create your first course to start teaching.</p>
          <button
            onClick={openCreate}
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white text-sm font-bold rounded-xl shadow-lg hover:bg-indigo-700 active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4" /> Create First Course
          </button>
        </div>
      ) : filteredCourses.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm py-16 text-center">
          <Search className="w-12 h-12 text-slate-200 mx-auto mb-4" />
          <h3 className="text-lg font-black text-slate-900 mb-2">No courses found</h3>
          <p className="text-sm text-slate-400 font-medium">Try adjusting your search or filters</p>
        </div>
      ) : (
        <div className={cn(
          view === 'grid'
            ? "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4"
            : "space-y-3"
        )}>
          {filteredCourses.map(course => (
            view === 'grid' ? (
              <CourseCard
                key={course._id}
                course={course}
                onEdit={openEdit}
                onDelete={handleDelete}
                onTogglePublish={handleTogglePublish}
                onDuplicate={handleDuplicate}
                onPreview={setPreviewCourse}
                onAnalytics={setAnalyticsCourseId}
                isSelected={selectedCourses.has(course._id)}
                onSelect={toggleSelect}
              />
            ) : (
              <div
                key={course._id}
                className={cn(
                  "bg-white rounded-xl border shadow-sm p-4 flex items-center gap-4 hover:shadow-md transition-all",
                  selectedCourses.has(course._id) ? "ring-2 ring-indigo-500 border-indigo-500" : "border-slate-100"
                )}
              >
                <button
                  onClick={() => toggleSelect(course._id)}
                  className={cn(
                    "w-5 h-5 rounded border-2 flex items-center justify-center transition-all shrink-0",
                    selectedCourses.has(course._id)
                      ? "bg-indigo-600 border-indigo-600"
                      : "border-slate-300 hover:border-indigo-400"
                  )}
                >
                  {selectedCourses.has(course._id) && <Check className="w-3 h-3 text-white" />}
                </button>
                <div className="w-20 h-14 rounded-lg bg-slate-100 overflow-hidden shrink-0">
                  {course.thumbnail ? (
                    <img src={getThumbnailUrl(course.thumbnail)} alt={course.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <BookOpen className="w-6 h-6 text-slate-300" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={cn(
                      "px-2 py-0.5 rounded text-[10px] font-bold",
                      course.status === 'published' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                    )}>
                      {course.status}
                    </span>
                    <span className="text-[10px] text-slate-400">{course.category}</span>
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 truncate">{course.title}</h3>
                </div>
                <div className="flex items-center gap-4 text-xs text-slate-400">
                  <span className="flex items-center gap-1"><BookOpen className="w-3.5 h-3.5" />{course.lessons?.length || 0}</span>
                  <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" />{course.enrolledCount || 0}</span>
                  <span className="flex items-center gap-1"><Star className="w-3.5 h-3.5" />{course.rating?.toFixed(1) || '0.0'}</span>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => setAnalyticsCourseId(course._id)} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all">
                    <BarChart3 className="w-4 h-4" />
                  </button>
                  <button onClick={() => openEdit(course)} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all">
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleTogglePublish(course)} className={cn(
                    "p-2 rounded-lg transition-all",
                    course.status === 'published' ? "text-amber-500 hover:bg-amber-50" : "text-emerald-500 hover:bg-emerald-50"
                  )}>
                    {course.status === 'published' ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                  <button onClick={() => handleDuplicate(course)} className="p-2 text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 rounded-lg transition-all">
                    <Copy className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(course._id)} className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )
          ))}
        </div>
      )}

      {previewCourse && (
        <CoursePreviewModal
          course={previewCourse}
          onClose={() => setPreviewCourse(null)}
        />
      )}

      {analyticsCourseId && (
        <CourseAnalyticsPanel
          courseId={analyticsCourseId}
          onClose={() => setAnalyticsCourseId(null)}
        />
      )}
    </div>
  );
};

export default MentorCourses;
