import React, { useState } from 'react';
import { Play, Star, Clock, BookOpen, Search, CheckCircle, ChevronLeft } from 'lucide-react';
import { cn } from '../utils/cn';

const MOCK_COURSES = [
  {
    id: 'c1',
    title: 'Advanced React Patterns & Performance',
    instructor: 'Sarah Jenkins',
    instructorRole: 'Senior React Developer',
    instructorAvatar: 'https://i.pravatar.cc/150?u=sarah',
    rating: 4.9,
    reviews: 124,
    duration: '6h 30m',
    level: 'Advanced',
    thumbnail: 'from-blue-600 to-indigo-800',
    tags: ['React', 'Performance', 'Hooks'],
    lessons: [
      { id: 'l1', title: 'Introduction to Concurrent React', duration: '15m', completed: true },
      { id: 'l2', title: 'Suspense Architecture', duration: '25m', completed: false },
      { id: 'l3', title: 'Optimizing Render Cycles', duration: '35m', completed: false },
    ]
  },
  {
    id: 'c2',
    title: 'Modern UI/UX Design with TailwindCSS',
    instructor: 'Alex Chen',
    instructorRole: 'Lead Product Designer',
    instructorAvatar: 'https://i.pravatar.cc/150?u=alex',
    rating: 4.8,
    reviews: 89,
    duration: '4h 15m',
    level: 'Intermediate',
    thumbnail: 'from-emerald-600 to-teal-800',
    tags: ['Design', 'Tailwind', 'CSS'],
    lessons: [
      { id: 'l1', title: 'The utility-first workflow', duration: '20m', completed: false },
      { id: 'l2', title: 'Building a SaaS Dashboard', duration: '45m', completed: false },
    ]
  },
  {
    id: 'c3',
    title: 'Fullstack Go Web Services from Scratch',
    instructor: 'David Krol',
    instructorRole: 'Staff Backend Engineer',
    instructorAvatar: 'https://i.pravatar.cc/150?u=david',
    rating: 5.0,
    reviews: 210,
    duration: '12h 00m',
    level: 'Intermediate',
    thumbnail: 'from-cyan-600 to-blue-800',
    tags: ['Go', 'Backend', 'API'],
    lessons: [
      { id: 'l1', title: 'Setting up Go modules', duration: '10m', completed: false },
      { id: 'l2', title: 'Building the HTTP Router', duration: '30m', completed: false },
    ]
  },
  {
    id: 'c4',
    title: 'TypeScript: From Zero to Expert',
    instructor: 'Maria Santos',
    instructorRole: 'Staff Engineer, Meta',
    instructorAvatar: 'https://i.pravatar.cc/150?u=maria',
    rating: 4.7,
    reviews: 342,
    duration: '8h 45m',
    level: 'Beginner',
    thumbnail: 'from-violet-600 to-purple-800',
    tags: ['TypeScript', 'JavaScript', 'Types'],
    lessons: [
      { id: 'l1', title: 'Why TypeScript?', duration: '12m', completed: false },
      { id: 'l2', title: 'Basic Types & Interfaces', duration: '28m', completed: false },
    ]
  },
  {
    id: 'c5',
    title: 'System Design at Scale',
    instructor: 'Kevin Wu',
    instructorRole: 'Principal Architect',
    instructorAvatar: 'https://i.pravatar.cc/150?u=kevin',
    rating: 5.0,
    reviews: 198,
    duration: '10h 20m',
    level: 'Advanced',
    thumbnail: 'from-rose-600 to-pink-800',
    tags: ['Architecture', 'Distributed', 'Cloud'],
    lessons: [
      { id: 'l1', title: 'Load Balancers & CDNs', duration: '40m', completed: false },
      { id: 'l2', title: 'Database Sharding', duration: '35m', completed: false },
    ]
  },
  {
    id: 'c6',
    title: 'Machine Learning with Python',
    instructor: 'Dr. Amanda Lee',
    instructorRole: 'AI Research Scientist',
    instructorAvatar: 'https://i.pravatar.cc/150?u=amanda',
    rating: 4.9,
    reviews: 567,
    duration: '15h 00m',
    level: 'Intermediate',
    thumbnail: 'from-orange-600 to-amber-800',
    tags: ['Python', 'ML', 'AI'],
    lessons: [
      { id: 'l1', title: 'NumPy & Pandas Basics', duration: '35m', completed: false },
      { id: 'l2', title: 'Supervised Learning', duration: '50m', completed: false },
    ]
  },
];

const LEVEL_BADGE = {
  Beginner:     'bg-emerald-50 text-emerald-700 border-emerald-100',
  Intermediate: 'bg-amber-50 text-amber-700 border-amber-100',
  Advanced:     'bg-rose-50 text-rose-700 border-rose-100',
};

const ExploreCourses = () => {
  const [activeCourse, setActiveCourse] = useState(null);
  const [activeLesson, setActiveLesson] = useState(0);
  const [search, setSearch] = useState('');

  const filtered = MOCK_COURSES.filter(c =>
    c.title.toLowerCase().includes(search.toLowerCase()) ||
    c.tags.some(t => t.toLowerCase().includes(search.toLowerCase()))
  );

  // Course Player
  if (activeCourse) {
    const lesson = activeCourse.lessons[activeLesson];
    const progress = Math.round(
      (activeCourse.lessons.filter(l => l.completed).length / activeCourse.lessons.length) * 100
    );

    return (
      <div className="animate-fade-in">
        <button
          onClick={() => { setActiveCourse(null); setActiveLesson(0); }}
          className="flex items-center gap-2 text-indigo-600 hover:text-indigo-700 font-bold mb-6 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" /> Back to Catalog
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Player + Info */}
          <div className="lg:col-span-2 space-y-5">
            <div className="w-full aspect-video bg-slate-900 rounded-2xl relative overflow-hidden group flex items-center justify-center shadow-2xl border border-slate-100">
              <div className={`absolute inset-0 bg-gradient-to-br ${activeCourse.thumbnail} opacity-30`} />
              <Play className="w-16 h-16 text-white/90 group-hover:text-white group-hover:scale-110 transition-all z-10 cursor-pointer drop-shadow-2xl" />
            </div>

            <div className="bg-white rounded-3xl border border-slate-100 p-8 shadow-sm">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h1 className="text-2xl font-black text-slate-900 mb-1.5 leading-tight">
                    Lesson {activeLesson + 1}: {lesson.title}
                  </h1>
                  <p className="text-base text-slate-400 font-medium">{activeCourse.title}</p>
                </div>
                <button className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 text-sm shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95 shrink-0">
                  <CheckCircle className="w-4 h-4" /> Mark Complete
                </button>
              </div>

              <div className="flex items-center gap-4 py-6 border-y border-slate-50 mb-6">
                <img 
                  src={activeCourse.instructorAvatar} 
                  alt={activeCourse.instructor} 
                  className="w-12 h-12 rounded-full object-cover border-2 border-slate-100 shadow-sm"
                />
                <div>
                  <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest block mb-0.5">Instructor</span>
                  <span className="font-bold text-slate-800">{activeCourse.instructor}</span>
                </div>
              </div>

              <h3 className="font-black text-slate-900 text-[17px] mb-4">Course Discussion</h3>
              <textarea
                className="w-full bg-slate-50/50 border-2 border-slate-100 rounded-2xl p-4 text-sm outline-none transition-all resize-none focus:bg-white focus:border-indigo-100 font-medium"
                placeholder="Ask a question about this lesson..."
                rows="3"
              />
              <div className="flex justify-end mt-4">
                <button className="text-[13px] font-black text-white bg-slate-900 px-6 py-2.5 rounded-xl hover:bg-indigo-600 transition-all shadow-lg active:scale-95">
                  Post Question
                </button>
              </div>
            </div>
          </div>

          {/* Sidebar: Progress + Curriculum */}
          <div className="space-y-6">
            <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm">
              <h3 className="font-black text-[15px] text-slate-900 mb-4">Course Progress</h3>
              <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden mb-3">
                <div className="h-full bg-indigo-600 transition-all duration-700" style={{ width: `${progress}%` }} />
              </div>
              <p className="text-xs font-black text-slate-400 tracking-wide">{progress}% Completed</p>
            </div>

            <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm overflow-hidden">
              <h3 className="font-black text-[15px] text-slate-900 mb-5">Curriculum</h3>
              <div className="space-y-2.5">
                {activeCourse.lessons.map((l, idx) => (
                  <button
                    key={l.id}
                    onClick={() => setActiveLesson(idx)}
                    className={cn(
                      "w-full flex items-start gap-4 p-4 rounded-2xl text-left transition-all border-2",
                      activeLesson === idx
                        ? "border-indigo-600/10 bg-indigo-50/50"
                        : "border-transparent hover:bg-slate-50"
                    )}
                  >
                    <div className={cn(
                      "mt-0.5 w-6 h-6 rounded-full flex items-center justify-center shrink-0 border-2",
                      l.completed 
                        ? "bg-emerald-500 border-emerald-500 text-white" 
                        : activeLesson === idx ? "border-indigo-200 bg-white" : "border-slate-100 bg-white"
                    )}>
                      {l.completed ? <CheckCircle className="w-4 h-4" /> : <span className="text-[11px] font-black text-slate-300">{idx + 1}</span>}
                    </div>
                    <div>
                      <p className={cn("text-sm font-black transition-colors", activeLesson === idx ? "text-indigo-600" : "text-slate-700")}>
                        {l.title}
                      </p>
                      <p className="text-[10px] text-slate-400 font-bold mt-1 uppercase tracking-widest">{l.duration}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Course Catalog
  return (
    <div className="space-y-10 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight leading-none mb-3">Explore Courses</h1>
          <p className="text-base text-slate-500 font-medium">Discover curated world-class courses to accelerate your career.</p>
        </div>

        {/* Search */}
        <div className="relative w-full md:w-[360px] group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
          <input
            type="text"
            placeholder="Search for skills, topics, or mentors..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-slate-100/60 border-2 border-transparent focus:bg-white focus:border-indigo-100 focus:ring-8 focus:ring-indigo-50/40 rounded-2xl py-3 pl-12 pr-4 text-[15px] font-bold text-slate-800 placeholder:text-slate-400 outline-none transition-all duration-300"
          />
        </div>
      </div>

      {/* Courses Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
        {filtered.length === 0 ? (
          <div className="col-span-full py-24 text-center">
            <div className="w-20 h-20 bg-slate-100 rounded-3xl flex items-center justify-center mx-auto mb-6">
              <BookOpen className="w-10 h-10 text-slate-300" />
            </div>
            <h3 className="text-xl font-black text-slate-900 mb-2">No courses found</h3>
            <p className="text-slate-500 font-medium">Try adjusting your search terms to find what you're looking for.</p>
          </div>
        ) : filtered.map(course => (
          <div
            key={course.id}
            className="bg-white rounded-[2.5rem] border border-slate-100 flex flex-col group overflow-hidden shadow-sm hover:shadow-2xl hover:shadow-indigo-100/50 transition-all duration-500 transform hover:-translate-y-1"
          >
            {/* Thumbnail */}
            <div className={`h-48 bg-gradient-to-br ${course.thumbnail} relative flex items-center justify-center overflow-hidden`}>
              {/* Pattern Overlay */}
              <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(white 1px, transparent 0)', backgroundSize: '15px 15px' }} />
              <div className="absolute inset-0 bg-slate-900/5 group-hover:bg-slate-900/40 transition-all duration-500" />
              
              <Play className="w-12 h-12 text-white opacity-0 group-hover:opacity-100 scale-50 group-hover:scale-110 transition-all duration-500 z-10 drop-shadow-2xl" />
              
              <div className="absolute top-4 right-4 z-10">
                <span className="bg-white/10 backdrop-blur-md px-3 py-1 rounded-xl text-[10px] font-black text-white border border-white/20 flex items-center gap-1.5 uppercase tracking-widest shadow-lg">
                  <Clock className="w-3.5 h-3.5" /> {course.duration}
                </span>
              </div>
              
              <span className={cn(
                "absolute bottom-4 left-4 text-[10px] font-black px-3 py-1 rounded-xl border-2 z-10 shadow-lg",
                LEVEL_BADGE[course.level]
              )}>
                {course.level}
              </span>
            </div>

            {/* Card Body */}
            <div className="p-7 flex-1 flex flex-col">
              <div className="flex gap-2 mb-4 flex-wrap">
                {course.tags.slice(0, 2).map(tag => (
                  <span key={tag} className="text-[10px] font-black uppercase tracking-[0.1em] text-indigo-600 bg-indigo-50/80 px-2.5 py-1 rounded-lg border border-indigo-100/50">
                    {tag}
                  </span>
                ))}
              </div>

              <h3 className="font-black text-[18px] text-slate-900 leading-tight mb-4 group-hover:text-indigo-600 transition-colors line-clamp-2 min-h-[44px]">
                {course.title}
              </h3>
              
              {/* Mentor Interface */}
              <div className="flex items-center gap-3 mb-6">
                 <img 
                   src={course.instructorAvatar} 
                   alt={course.instructor} 
                   className="w-9 h-9 rounded-full object-cover border-2 border-slate-100 shadow-sm"
                 />
                 <div className="flex flex-col">
                    <span className="text-[12px] font-black text-slate-800 leading-none mb-0.5">{course.instructor}</span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter leading-none">{course.instructorRole.split(',')[0]}</span>
                 </div>
              </div>

              <div className="flex items-center justify-between pt-6 border-t border-slate-50 mt-auto">
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                    <span className="font-black text-sm text-slate-900">{course.rating}</span>
                  </div>
                  <span className="text-[11px] text-slate-300 font-bold">•</span>
                  <span className="text-[11px] text-slate-400 font-black uppercase tracking-tight">{course.reviews} reviews</span>
                </div>
                
                <button
                  onClick={() => { setActiveCourse(course); setActiveLesson(0); }}
                  className="bg-slate-900 text-white font-black text-[11px] px-5 py-2.5 rounded-2xl hover:bg-indigo-600 transition-all shadow-xl shadow-slate-200 active:scale-95 uppercase tracking-wider"
                >
                  Join Course
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ExploreCourses;
