import React from 'react';
import { GraduationCap, BookOpen, Clock, ChevronRight } from 'lucide-react';

const MOCK_ENROLLED = [
  { id: 'c1', title: 'Advanced React Patterns & Performance', progress: 33, duration: '6h 30m', thumbnail: 'from-blue-500 to-indigo-700', lastLesson: 'Suspense Architecture' },
  { id: 'c3', title: 'Fullstack Go Web Services from Scratch', progress: 0, duration: '12h 00m', thumbnail: 'from-cyan-500 to-blue-700', lastLesson: 'Setting up Go modules' },
];

const MyLearning = () => {
  if (MOCK_ENROLLED.length === 0) {
    return (
      <div className="animate-fade-in space-y-6">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">My Learning</h1>
          <p className="text-sm text-slate-500 mt-1 font-medium">Track your current courses and progress.</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-16 text-center">
          <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <BookOpen className="w-8 h-8 text-slate-300" />
          </div>
          <h2 className="text-lg font-black text-slate-900 mb-2">No courses yet</h2>
          <p className="text-sm text-slate-400 font-medium">Enroll in a course from Explore to get started.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">My Learning</h1>
        <p className="text-sm text-slate-500 mt-1 font-medium">Track your enrolled courses and continue where you left off.</p>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Enrolled', val: MOCK_ENROLLED.length, color: 'text-indigo-600', bg: 'bg-indigo-50' },
          { label: 'In Progress', val: MOCK_ENROLLED.filter(c => c.progress > 0 && c.progress < 100).length, color: 'text-amber-600', bg: 'bg-amber-50' },
          { label: 'Completed', val: MOCK_ENROLLED.filter(c => c.progress === 100).length, color: 'text-emerald-600', bg: 'bg-emerald-50' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 text-center">
            <p className={`text-2xl font-black ${s.color}`}>{s.val}</p>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Course List */}
      <div className="space-y-4">
        {MOCK_ENROLLED.map(course => (
          <div key={course.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all group overflow-hidden">
            <div className="flex items-center gap-5 p-5">
              {/* Thumbnail */}
              <div className={`w-16 h-16 rounded-xl bg-gradient-to-br ${course.thumbnail} shrink-0 flex items-center justify-center`}>
                <GraduationCap className="w-8 h-8 text-white/80" />
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <h3 className="font-extrabold text-[14px] text-slate-900 leading-tight mb-1 truncate group-hover:text-indigo-600 transition-colors">
                  {course.title}
                </h3>
                <p className="text-[11px] text-slate-400 font-bold uppercase tracking-tight mb-2 flex items-center gap-1.5">
                  <Clock className="w-3 h-3" /> {course.duration} · Last: {course.lastLesson}
                </p>
                {/* Progress bar */}
                <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-indigo-600 transition-all"
                    style={{ width: `${course.progress}%` }}
                  />
                </div>
                <p className="text-[10px] font-bold text-slate-400 mt-1">{course.progress}% complete</p>
              </div>

              {/* Action */}
              <button className="flex items-center gap-1 text-xs font-bold px-4 py-2 bg-slate-900 text-white rounded-xl hover:bg-indigo-600 active:scale-95 transition-all shrink-0">
                {course.progress > 0 ? 'Continue' : 'Start'}
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MyLearning;
