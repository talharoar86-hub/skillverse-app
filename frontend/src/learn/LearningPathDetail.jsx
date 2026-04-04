import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Route, BookOpen, Users, Clock, Layers, Loader2, AlertCircle, ChevronRight, CheckCircle, Lock, Play, ArrowRight } from 'lucide-react';
import { cn } from '../utils/cn';
import api from '../services/axiosClient';

const GRADIENTS = [
  'from-blue-500 via-indigo-500 to-violet-600',
  'from-emerald-400 via-teal-500 to-cyan-600',
  'from-violet-500 via-purple-500 to-fuchsia-600',
  'from-rose-400 via-pink-500 to-red-500',
];

const LearningPathDetail = () => {
  const { pathId } = useParams();
  const navigate = useNavigate();
  const [path, setPath] = useState(null);
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchPath();
  }, [pathId]);

  const fetchPath = async () => {
    setLoading(true);
    try {
      const [pathRes, progressRes] = await Promise.all([
        api.get(`/learning-paths/${pathId}`),
        api.get(`/learning-paths/${pathId}/progress`).catch(() => null)
      ]);
      setPath(pathRes.data);
      if (progressRes) setProgress(progressRes.data);
    } catch {
      setError('Failed to load learning path');
    } finally {
      setLoading(false);
    }
  };

  const handleEnroll = async () => {
    setEnrolling(true);
    try {
      await api.post(`/learning-paths/${pathId}/enroll`);
      await fetchPath();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to enroll');
    } finally {
      setEnrolling(false);
    }
  };

  if (loading) return <div className="flex justify-center py-24"><Loader2 className="w-10 h-10 text-indigo-600 animate-spin" /></div>;
  if (error && !path) return <div className="flex flex-col items-center py-24"><AlertCircle className="w-8 h-8 text-rose-400 mb-4" /><p className="text-sm font-bold text-rose-600">{error}</p></div>;
  if (!path) return null;

  const totalCourses = path.courses?.length || 0;
  const completedCourses = progress?.completedCourses || 0;
  const pathProgress = progress?.progress || 0;
  const isEnrolled = path.isPathEnrolled;

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Hero */}
      <div className="bg-gradient-to-br from-indigo-600 via-purple-600 to-violet-700 rounded-3xl p-8 text-white shadow-xl shadow-indigo-500/20 relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.05]" style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-3">
            {path.level && <span className="text-[10px] font-black uppercase tracking-widest bg-white/20 px-3 py-1 rounded-lg">{path.level}</span>}
            {path.category && <span className="text-[10px] font-black uppercase tracking-widest bg-white/10 px-3 py-1 rounded-lg">{path.category}</span>}
          </div>
          <h1 className="text-3xl font-black tracking-tight leading-none mb-3">{path.title}</h1>
          {path.description && <p className="text-base text-white/70 font-medium max-w-2xl mb-6">{path.description}</p>}
          <div className="flex items-center gap-6 text-sm text-white/60 font-bold">
            <span className="flex items-center gap-1.5"><Layers className="w-4 h-4" />{totalCourses} courses</span>
            <span className="flex items-center gap-1.5"><Users className="w-4 h-4" />{path.enrolledCount || 0} enrolled</span>
            {path.creator && <span>by {path.creator.name}</span>}
          </div>
        </div>
      </div>

      {/* Progress + Enroll */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        {isEnrolled && progress ? (
          <div className="flex-1 w-full md:w-auto">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-bold text-slate-700">Progress: {completedCourses}/{totalCourses} courses completed</span>
              <span className="text-sm font-black text-indigo-600">{pathProgress}%</span>
            </div>
            <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-indigo-600 rounded-full transition-all" style={{ width: `${pathProgress}%` }} />
            </div>
          </div>
        ) : (
          <button onClick={handleEnroll} disabled={enrolling} className="flex items-center gap-2 bg-indigo-600 text-white px-8 py-3 rounded-2xl text-sm font-black hover:bg-indigo-700 active:scale-95 transition-all shadow-lg shadow-indigo-500/20 disabled:opacity-50">
            {enrolling ? <><Loader2 className="w-4 h-4 animate-spin" /> Enrolling...</> : <><ArrowRight className="w-4 h-4" /> Start Learning Path</>}
          </button>
        )}
      </div>

      {/* Course List */}
      <div className="space-y-3">
        {path.courses?.map((item, idx) => {
          const course = item.course;
          if (!course) return null;
          const isCompleted = item.isEnrolled && item.enrollment?.progress >= 100;
          const isInProgress = item.isEnrolled && item.enrollment?.progress > 0 && item.enrollment?.progress < 100;
          const gradient = GRADIENTS[idx % GRADIENTS.length];

          return (
            <div
              key={course._id}
              onClick={() => navigate(`/learn/course/${course._id}`)}
              className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-lg transition-all cursor-pointer group flex items-center gap-4 p-4"
            >
              {/* Step Number */}
              <div className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 font-black text-sm",
                isCompleted ? "bg-emerald-100 text-emerald-600" : isInProgress ? "bg-indigo-100 text-indigo-600" : "bg-slate-100 text-slate-400"
              )}>
                {isCompleted ? <CheckCircle className="w-5 h-5" /> : idx + 1}
              </div>

              {/* Course Thumbnail */}
              {course.thumbnail && course.thumbnail.startsWith('http') ? (
                <div className="w-16 h-16 rounded-xl bg-cover bg-center shrink-0" style={{ backgroundImage: `url(${course.thumbnail})` }} />
              ) : (
                <div className={cn("w-16 h-16 rounded-xl bg-gradient-to-br shrink-0 flex items-center justify-center", gradient)}>
                  <Play className="w-6 h-6 text-white/80" />
                </div>
              )}

              {/* Info */}
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-sm text-slate-900 truncate group-hover:text-indigo-600 transition-colors">{course.title}</h3>
                <div className="flex items-center gap-3 text-[11px] text-slate-400 font-bold mt-1">
                  <span>{course.lessons?.length || 0} lessons</span>
                  {course.level && <span>{course.level}</span>}
                  {isCompleted && <span className="text-emerald-600">Completed</span>}
                  {isInProgress && <span className="text-indigo-600">{item.enrollment.progress}%</span>}
                </div>
                {isInProgress && (
                  <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden mt-2">
                    <div className="h-full bg-indigo-600 rounded-full" style={{ width: `${item.enrollment.progress}%` }} />
                  </div>
                )}
              </div>

              <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-indigo-400 transition-colors shrink-0" />
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default LearningPathDetail;
