import React, { useState, useEffect } from 'react';
import { Play, Star, Clock, BookOpen, Search, User, CheckCircle, ChevronLeft, PlusCircle, Users } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { cn } from '../utils/cn';

// Mock initial data
const MOCK_COURSES = [
  {
    id: 'c1',
    title: 'Advanced React Patterns & Performance',
    instructor: 'Sarah Jenkins',
    instructorRole: 'Senior React Developer',
    rating: 4.9,
    reviews: 124,
    duration: '6h 30m',
    level: 'Advanced',
    thumbnail: 'bg-gradient-to-br from-blue-500 to-indigo-700',
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
    rating: 4.8,
    reviews: 89,
    duration: '4h 15m',
    level: 'Intermediate',
    thumbnail: 'bg-gradient-to-br from-emerald-500 to-teal-700',
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
    rating: 5.0,
    reviews: 210,
    duration: '12h 00m',
    level: 'Intermediate',
    thumbnail: 'bg-gradient-to-br from-cyan-500 to-blue-700',
    tags: ['Go', 'Backend', 'API'],
    lessons: [
      { id: 'l1', title: 'Setting up Go modules', duration: '10m', completed: false },
      { id: 'l2', title: 'Building the HTTP Router', duration: '30m', completed: false },
    ]
  }
];

const LearnTab = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('Explore');
  const [activeCourse, setActiveCourse] = useState(null);
  const [activeLesson, setActiveLesson] = useState(0);

  // Auto-set tab based on user goal if not already set
  useEffect(() => {
    if (user?.goal === 'Mentor') {
      setActiveTab('Become a Mentor');
    }
  }, [user]);

  const tabs = [
    { id: 'Explore', label: 'Explore Courses' },
    { id: 'Mentors', label: 'Mentors' },
    { id: 'My Learning', label: 'My Learning' },
    { id: 'Become a Mentor', label: user?.goal === 'Mentor' ? 'Mentor Dashboard' : 'Become a Mentor' }
  ];

  const handleStartCourse = (course) => {
    setActiveCourse(course);
    setActiveLesson(0);
  };

  const handleBackToCatalog = () => {
    setActiveCourse(null);
  };

  // Rendering logic for course player
  if (activeCourse) {
    const lesson = activeCourse.lessons[activeLesson];
    const progress = Math.round((activeCourse.lessons.filter(l => l.completed).length / activeCourse.lessons.length) * 100);

    return (
      <div className="animate-fade-in max-w-6xl mx-auto py-4">
        <button onClick={handleBackToCatalog} className="text-indigo-600 hover:text-indigo-700 mb-6 flex items-center gap-2 font-bold transition-colors">
          <ChevronLeft className="w-4 h-4" /> Back to Catalog
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="w-full aspect-video bg-slate-900 rounded-3xl border border-slate-100 shadow-2xl relative overflow-hidden group flex items-center justify-center">
              <Play className="w-20 h-20 text-white/80 group-hover:text-white group-hover:scale-110 transition-all z-20 cursor-pointer drop-shadow-xl" />
            </div>

            <div className="bg-white rounded-3xl border border-slate-100 p-8 shadow-sm">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h1 className="text-2xl font-bold text-slate-900 mb-2">Lesson {activeLesson + 1}: {lesson.title}</h1>
                  <p className="text-slate-400 font-medium">{activeCourse.title}</p>
                </div>
                <button className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 text-sm shadow-lg shadow-indigo-100">
                  <CheckCircle className="w-4 h-4" /> Mark Complete
                </button>
              </div>

              <div className="flex items-center gap-4 py-6 border-y border-slate-50 mb-6">
                <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 font-bold text-lg">
                  {activeCourse.instructor.charAt(0)}
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest block">Instructor</span>
                  <span className="font-bold text-slate-800">{activeCourse.instructor}</span>
                </div>
              </div>

              <div>
                <h3 className="font-bold text-lg text-slate-800 mb-4">Course Discussion</h3>
                <textarea 
                  className="w-full bg-slate-50 border-2 border-transparent focus:border-indigo-100 rounded-2xl p-4 text-sm outline-none transition-all mb-3 font-medium"
                  placeholder="Ask a question about this lesson..."
                  rows="3"
                />
                <div className="flex justify-end">
                  <button className="text-sm font-bold text-white bg-slate-900 px-6 py-2 rounded-xl hover:bg-slate-800">Post Question</button>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm">
              <h3 className="font-bold text-slate-800 mb-3">Course Progress</h3>
              <div className="w-full h-2 bg-slate-100 rounded-full mb-3 overflow-hidden">
                <div className="h-full bg-indigo-600 transition-all" style={{ width: `${progress}%` }}></div>
              </div>
              <p className="text-xs font-bold text-slate-400">{progress}% Completed</p>
            </div>

            <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm">
              <h3 className="font-bold text-slate-800 mb-4">Curriculum</h3>
              <div className="space-y-2">
                {activeCourse.lessons.map((l, idx) => (
                  <div 
                    key={l.id} 
                    onClick={() => setActiveLesson(idx)}
                    className={cn(
                      "flex items-start gap-3 p-3.5 rounded-2xl cursor-pointer transition-all border-2",
                      activeLesson === idx ? "border-indigo-600 bg-indigo-50/30" : "border-transparent hover:bg-slate-50"
                    )}
                  >
                    <div className={cn(
                      "mt-0.5 w-5 h-5 rounded-full flex items-center justify-center shrink-0",
                      l.completed ? "bg-green-500 text-white" : "bg-slate-100 text-slate-300"
                    )}>
                      {l.completed && <CheckCircle className="w-3 h-3" />}
                    </div>
                    <div>
                      <h4 className={cn("text-sm font-bold", activeLesson === idx ? "text-indigo-600" : "text-slate-700")}>
                        {idx + 1}. {l.title}
                      </h4>
                      <p className="text-[10px] text-slate-400 font-bold mt-1 uppercase tracking-tight">{l.duration}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- Main Tabs Rendering ---
  return (
    <div className="space-y-8 animate-fade-in py-6">
      
      {/* Tab Navigation */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-1 p-1 bg-slate-100/50 rounded-2xl border border-slate-100 w-fit">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "px-5 py-2.5 rounded-xl text-xs font-bold transition-all duration-300",
                activeTab === tab.id 
                  ? "bg-white text-indigo-600 shadow-sm border-slate-100" 
                  : "text-slate-400 hover:text-slate-600"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-72 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
          <input 
            type="text" 
            placeholder="Search learning resources..." 
            className="w-full bg-slate-50 border-2 border-transparent focus:bg-white focus:border-indigo-100 rounded-xl py-2.5 pl-11 pr-4 text-sm font-bold text-slate-800 transition-all outline-none"
          />
        </div>
      </div>

      {activeTab === 'Explore' && (
        <div className="animate-fade-in space-y-10">
          {/* Course Catalog */}
          <section>
            <div className="flex justify-between items-center mb-6 px-2">
              <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-indigo-600" /> 
                Recommended for you
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {MOCK_COURSES.map(course => (
                <div key={course.id} className="bg-white rounded-[2rem] border border-slate-100 flex flex-col group overflow-hidden shadow-sm hover:shadow-xl hover:shadow-indigo-50 transition-all duration-300">
                  <div className={`h-48 ${course.thumbnail} relative flex items-center justify-center`}>
                    <div className="absolute inset-0 bg-slate-900/10 group-hover:bg-slate-900/40 transition-colors"></div>
                    <Play className="w-12 h-12 text-white opacity-0 group-hover:opacity-100 transform scale-75 group-hover:scale-100 transition-all duration-300 z-10 drop-shadow-lg" />
                    <span className="absolute top-4 right-4 bg-slate-900/60 backdrop-blur-md px-2.5 py-1 rounded-lg text-[10px] font-black text-white border border-white/10 flex items-center gap-1 uppercase tracking-widest">
                      <Clock className="w-3 h-3" /> {course.duration}
                    </span>
                  </div>
                  
                  <div className="p-6 flex-1 flex flex-col">
                    <div className="flex gap-2 mb-4">
                      {course.tags.slice(0, 2).map(tag => (
                        <span key={tag} className="text-[10px] font-black uppercase tracking-widest text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                          {tag}
                        </span>
                      ))}
                    </div>
                    
                    <h3 className="font-extrabold text-lg text-slate-800 leading-tight mb-2 group-hover:text-indigo-600 transition-colors line-clamp-2">
                      {course.title}
                    </h3>
                    
                    <p className="text-xs font-bold text-slate-400 mb-6 uppercase tracking-tight">By {course.instructor}</p>
                    
                    <div className="flex items-center justify-between pt-5 border-t border-slate-50 mt-auto">
                      <div className="flex items-center gap-1.5">
                        <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                        <span className="font-black text-sm text-slate-800">{course.rating}</span>
                      </div>
                      
                      <button 
                        onClick={() => handleStartCourse(course)}
                        className="bg-slate-900 text-white font-bold text-xs px-5 py-2.5 rounded-xl hover:bg-indigo-600 transition-all shadow-lg shadow-slate-100 hover:shadow-indigo-100 active:scale-95"
                      >
                        Start Learning
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}

      {activeTab === 'Become a Mentor' && (
        <div className="animate-fade-in bg-slate-900 rounded-[2.5rem] p-12 text-white relative overflow-hidden">
          <div className="relative z-10 max-w-2xl">
            <h2 className="text-4xl font-black mb-6 leading-tight">Share your expertise and build your community.</h2>
            <p className="text-lg opacity-70 mb-10 font-medium">Create your first course, mentor students, and earn rewards for contributing to the SkillVerse ecosystem.</p>
            
            <div className="flex flex-wrap gap-4">
              <button className="bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold px-10 py-5 rounded-2xl transition-all shadow-xl shadow-indigo-900/50 flex items-center gap-3 active:scale-95">
                <PlusCircle className="w-6 h-6" /> Create First Course
              </button>
              <button className="bg-white/10 hover:bg-white/20 text-white border border-white/10 font-extrabold px-10 py-5 rounded-2xl transition-all">
                View Mentor Guide
              </button>
            </div>
          </div>
          <Users className="absolute -bottom-10 -right-10 w-80 h-80 text-white/5 -rotate-12" />
        </div>
      )}

      {(activeTab === 'Mentors' || activeTab === 'My Learning') && (
        <div className="animate-fade-in flex flex-col items-center justify-center py-20 text-center">
          <div className="w-20 h-20 bg-slate-100 rounded-3xl flex items-center justify-center mb-6">
            {activeTab === 'Mentors' ? <User className="w-10 h-10 text-slate-300" /> : <BookOpen className="w-10 h-10 text-slate-300" />}
          </div>
          <h3 className="text-2xl font-black text-slate-900 mb-2">Coming soon to SkillVerse</h3>
          <p className="text-slate-400 font-bold uppercase text-xs tracking-widest italic">We're building this feature for you right now.</p>
        </div>
      )}

    </div>
  );
};

export default LearnTab;
