import React, { useState, useEffect, useRef, memo, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Play, Star, Clock, BookOpen, Search, Users, ArrowRight, Layers,
  Loader2, AlertCircle, Sparkles, Crown, Zap, Heart, ChevronDown,
  X, SlidersHorizontal, Grid3X3, List, ArrowUpDown, ChevronRight,
  BarChart3, GitCompare
} from 'lucide-react';
import { cn } from '../utils/cn';
import { courseService, enrollmentService } from '../services/api';
import { useLearning } from '../context/LearningContext';
import { getAvatarUrl } from '../utils/avatar';
import { useDebounce } from '../hooks/useDebounce';
import CompareDrawer from './CompareDrawer';

const GRADIENTS = [
  'from-blue-500 via-indigo-500 to-violet-600',
  'from-emerald-400 via-teal-500 to-cyan-600',
  'from-violet-500 via-purple-500 to-fuchsia-600',
  'from-rose-400 via-pink-500 to-red-500',
  'from-orange-400 via-amber-500 to-yellow-500',
  'from-cyan-400 via-blue-500 to-indigo-600',
  'from-fuchsia-500 via-pink-500 to-rose-500',
  'from-lime-400 via-green-500 to-emerald-600',
];

const LEVEL_CONFIG = {
  Beginner: { bg: 'bg-emerald-500/90 backdrop-blur-md', text: 'text-white', border: 'border-emerald-400/50', icon: '●' },
  Intermediate: { bg: 'bg-amber-500/90 backdrop-blur-md', text: 'text-white', border: 'border-amber-400/50', icon: '●●' },
  Advanced: { bg: 'bg-rose-500/90 backdrop-blur-md', text: 'text-white', border: 'border-rose-400/50', icon: '●●●' },
};

const TABS = [
  { id: 'all', label: 'All Courses', icon: Layers },
  { id: 'free', label: 'Free', icon: Zap },
  { id: 'paid', label: 'Premium', icon: Crown },
];

const SORT_OPTIONS = [
  { id: 'newest', label: 'Newest' },
  { id: 'popular', label: 'Most Popular' },
  { id: 'rating', label: 'Highest Rated' },
  { id: 'price_low', label: 'Price: Low to High' },
  { id: 'price_high', label: 'Price: High to Low' },
];

const LEVEL_OPTIONS = ['Beginner', 'Intermediate', 'Advanced'];
const RATING_OPTIONS = [
  { value: '', label: 'Any Rating' },
  { value: '4', label: '4+ Stars' },
  { value: '3', label: '3+ Stars' },
  { value: '2', label: '2+ Stars' },
];

// --- Skeleton Loader ---
const CourseCardSkeleton = () => (
  <div className="bg-white rounded-[1.75rem] border border-slate-200/60 overflow-hidden animate-pulse">
    <div className="h-52 bg-slate-200" />
    <div className="p-6 space-y-3">
      <div className="flex gap-2"><div className="h-4 w-12 bg-slate-200 rounded" /><div className="h-4 w-16 bg-slate-200 rounded" /></div>
      <div className="h-5 w-3/4 bg-slate-200 rounded" />
      <div className="h-4 w-full bg-slate-200 rounded" />
      <div className="flex items-center gap-2"><div className="w-8 h-8 bg-slate-200 rounded-full" /><div className="h-3 w-20 bg-slate-200 rounded" /></div>
      <div className="flex justify-between pt-3 border-t"><div className="h-3 w-16 bg-slate-200 rounded" /><div className="h-8 w-20 bg-slate-200 rounded-xl" /></div>
    </div>
  </div>
);

// --- Search Bar with Autocomplete ---
const SearchBar = ({ value, onChange, onSelect }) => {
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const debouncedSearch = useDebounce(value, 250);
  const ref = useRef(null);

  useEffect(() => {
    if (debouncedSearch.length >= 2) {
      setLoading(true);
      courseService.getSearchSuggestions(debouncedSearch)
        .then(setSuggestions)
        .catch(() => setSuggestions([]))
        .finally(() => setLoading(false));
    } else {
      setSuggestions([]);
    }
  }, [debouncedSearch]);

  useEffect(() => {
    const handleClick = (e) => { if (ref.current && !ref.current.contains(e.target)) setShowSuggestions(false); };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <div ref={ref} className="relative w-full md:w-[360px]">
      <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400 transition-colors z-10" />
      <input
        type="text"
        placeholder="Search for skills, topics, or mentors..."
        value={value}
        onChange={e => { onChange(e.target.value); setShowSuggestions(true); }}
        onFocus={() => setShowSuggestions(true)}
        className="w-full bg-slate-100/60 border-2 border-transparent focus:bg-white focus:border-indigo-100 focus:ring-8 focus:ring-indigo-50/40 rounded-2xl py-3 pl-12 pr-10 text-[15px] font-bold text-slate-800 placeholder:text-slate-400 outline-none transition-all duration-300"
      />
      {value && (
        <button onClick={() => { onChange(''); setShowSuggestions(false); }} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-slate-100 transition-colors">
          <X className="w-4 h-4 text-slate-400" />
        </button>
      )}
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl border border-slate-200 shadow-xl z-50 overflow-hidden">
          {suggestions.map((s, i) => (
            <button
              key={i}
              onClick={() => { onSelect(s); setShowSuggestions(false); }}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors text-left"
            >
              <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", s.type === 'course' ? 'bg-indigo-50 text-indigo-500' : 'bg-emerald-50 text-emerald-500')}>
                {s.type === 'course' ? <BookOpen className="w-4 h-4" /> : <Layers className="w-4 h-4" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-slate-800 truncate">{s.text}</p>
                <p className="text-[10px] text-slate-400 font-medium capitalize">{s.type}</p>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-300" />
            </button>
          ))}
        </div>
      )}
      {loading && (
        <div className="absolute right-10 top-1/2 -translate-y-1/2">
          <Loader2 className="w-4 h-4 text-indigo-500 animate-spin" />
        </div>
      )}
    </div>
  );
};

// --- Filter Panel ---
const FilterPanel = ({ filters, onChange, categories, show }) => {
  if (!show) return null;

  const activeCount = [filters.category, filters.level, filters.minRating].filter(Boolean).length;

  return (
    <div className="bg-white rounded-2xl border border-slate-200/60 p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-black text-sm text-slate-900 flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4 text-indigo-500" />
          Filters
          {activeCount > 0 && <span className="text-[10px] bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded-full">{activeCount}</span>}
        </h3>
        {activeCount > 0 && (
          <button onClick={() => onChange({ category: '', level: '', minRating: '' })} className="text-[11px] font-bold text-indigo-600 hover:text-indigo-700">
            Clear All
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Category */}
        <div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Category</p>
          <div className="space-y-1 max-h-40 overflow-y-auto custom-scrollbar">
            <button onClick={() => onChange({ category: '' })} className={cn("w-full text-left px-3 py-2 rounded-lg text-xs font-bold transition-colors", !filters.category ? "bg-indigo-50 text-indigo-600" : "text-slate-600 hover:bg-slate-50")}>
              All Categories
            </button>
            {categories.map(c => (
              <button key={c.name} onClick={() => onChange({ category: c.name })} className={cn("w-full text-left px-3 py-2 rounded-lg text-xs font-bold transition-colors flex justify-between", filters.category === c.name ? "bg-indigo-50 text-indigo-600" : "text-slate-600 hover:bg-slate-50")}>
                <span className="truncate">{c.name}</span>
                <span className="text-[10px] text-slate-400 ml-2">{c.count}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Level */}
        <div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Level</p>
          <div className="space-y-1">
            <button onClick={() => onChange({ level: '' })} className={cn("w-full text-left px-3 py-2 rounded-lg text-xs font-bold transition-colors", !filters.level ? "bg-indigo-50 text-indigo-600" : "text-slate-600 hover:bg-slate-50")}>
              All Levels
            </button>
            {LEVEL_OPTIONS.map(l => (
              <button key={l} onClick={() => onChange({ level: l })} className={cn("w-full text-left px-3 py-2 rounded-lg text-xs font-bold transition-colors", filters.level === l ? "bg-indigo-50 text-indigo-600" : "text-slate-600 hover:bg-slate-50")}>
                {l}
              </button>
            ))}
          </div>
        </div>

        {/* Rating */}
        <div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Rating</p>
          <div className="space-y-1">
            {RATING_OPTIONS.map(r => (
              <button key={r.value} onClick={() => onChange({ minRating: r.value })} className={cn("w-full text-left px-3 py-2 rounded-lg text-xs font-bold transition-colors flex items-center gap-2", filters.minRating === r.value ? "bg-indigo-50 text-indigo-600" : "text-slate-600 hover:bg-slate-50")}>
                {r.value && <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />}
                {r.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// --- Filter Chips ---
const FilterChips = ({ filters, onRemove }) => {
  const chips = [];
  if (filters.category) chips.push({ key: 'category', label: filters.category });
  if (filters.level) chips.push({ key: 'level', label: filters.level });
  if (filters.minRating) chips.push({ key: 'minRating', label: `${filters.minRating}+ Stars` });
  if (filters.search) chips.push({ key: 'search', label: `"${filters.search}"` });

  if (chips.length === 0) return null;

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Active:</span>
      {chips.map(chip => (
        <button key={chip.key} onClick={() => onRemove(chip.key)} className="flex items-center gap-1.5 bg-indigo-50 text-indigo-600 px-3 py-1.5 rounded-full text-[11px] font-bold hover:bg-indigo-100 transition-colors">
          {chip.label}
          <X className="w-3 h-3" />
        </button>
      ))}
    </div>
  );
};

// --- Course Card (Memoized for performance) ---
const CourseCard = memo(({ course, index, isWishlisted, onToggleWishlist, isCompared, onToggleCompare }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [enrolling, setEnrolling] = useState(false);
  const navigate = useNavigate();
  const gradient = GRADIENTS[index % GRADIENTS.length];
  const levelConfig = LEVEL_CONFIG[course.level] || LEVEL_CONFIG.Beginner;
  const mentorName = course.mentorId?.name || 'Mentor';
  const mentorInitial = mentorName.charAt(0);
  const isPremium = course.price > 0;

  const handlePreview = () => navigate(`/learn/course/${course._id}`);

  const handleEnroll = async (e) => {
    e.stopPropagation();
    setEnrolling(true);
    try {
      await enrollmentService.enroll(course._id);
      navigate(`/learn/course/${course._id}`);
    } catch (err) {
      if (err.response?.status === 400) navigate(`/learn/course/${course._id}`);
    } finally {
      setEnrolling(false);
    }
  };

  const handleWishlist = (e) => {
    e.stopPropagation();
    onToggleWishlist(course._id);
  };

  return (
    <div onMouseEnter={() => setIsHovered(true)} onMouseLeave={() => setIsHovered(false)} className="relative group">
      <div className={cn("absolute -inset-[1px] rounded-[1.75rem] opacity-0 group-hover:opacity-100 transition-opacity duration-700 blur-sm bg-gradient-to-br", gradient)} />
      <div onClick={handlePreview} className="relative bg-white rounded-[1.75rem] border border-slate-200/60 shadow-sm hover:shadow-2xl hover:shadow-indigo-500/10 transition-all duration-500 flex flex-col overflow-hidden transform group-hover:-translate-y-1 cursor-pointer">
        {/* Thumbnail */}
        <div className="relative h-52 overflow-hidden">
          {course.thumbnail && course.thumbnail.startsWith('http') ? (
            <img src={course.thumbnail} alt={course.title} loading="lazy" className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
          ) : (
            <div className={cn("absolute inset-0 bg-gradient-to-br transition-transform duration-700 group-hover:scale-105", gradient)} />
          )}
          <div className="absolute inset-0 opacity-[0.07]" style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '16px 16px' }} />
          <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/40" />
          <div className={cn("absolute inset-0 bg-black/30 transition-opacity duration-500", isHovered ? "opacity-100" : "opacity-0")} />

          {/* Wishlist Button */}
          <button onClick={handleWishlist} className={cn(
            "absolute top-4 right-4 z-20 w-9 h-9 rounded-full flex items-center justify-center transition-all backdrop-blur-xl border",
            isWishlisted ? "bg-rose-500 border-rose-400 text-white" : "bg-white/15 border-white/20 text-white hover:bg-rose-500/80"
          )}>
            <Heart className={cn("w-4 h-4", isWishlisted && "fill-white")} />
          </button>

          {/* Compare Button */}
          {onToggleCompare && (
            <button onClick={(e) => { e.stopPropagation(); onToggleCompare(course); }} className={cn(
              "absolute top-4 right-14 z-20 w-9 h-9 rounded-full flex items-center justify-center transition-all backdrop-blur-xl border",
              isCompared ? "bg-indigo-500 border-indigo-400 text-white" : "bg-white/15 border-white/20 text-white hover:bg-indigo-500/80 opacity-0 group-hover:opacity-100"
            )}>
              <GitCompare className="w-4 h-4" />
            </button>
          )}

          {/* Play Button */}
          <div className={cn("absolute inset-0 flex items-center justify-center transition-all duration-500", isHovered ? "opacity-100 scale-100" : "opacity-0 scale-75")}>
            <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-xl flex items-center justify-center border border-white/30 shadow-2xl">
              <Play className="w-7 h-7 text-white ml-1" fill="white" />
            </div>
          </div>

          {/* Badges */}
          {isPremium ? (
            <div className="absolute top-4 left-4 z-10">
              <div className="flex items-center gap-1.5 bg-gradient-to-r from-amber-500 to-yellow-400 px-3 py-1.5 rounded-xl shadow-lg shadow-amber-500/30">
                <Crown className="w-3.5 h-3.5 text-white" />
                <span className="text-[10px] font-black text-white uppercase tracking-widest">Premium</span>
              </div>
            </div>
          ) : (
            <div className="absolute top-4 left-4 z-10">
              <div className="flex items-center gap-1.5 bg-gradient-to-r from-emerald-500 to-green-400 px-3 py-1.5 rounded-xl shadow-lg shadow-emerald-500/30">
                <Sparkles className="w-3.5 h-3.5 text-white" />
                <span className="text-[10px] font-black text-white uppercase tracking-widest">Free</span>
              </div>
            </div>
          )}

          {course.lessons?.length > 0 && (
            <div className="absolute bottom-4 right-4 z-10">
              <div className="flex items-center gap-1.5 bg-white/15 backdrop-blur-xl px-3 py-1.5 rounded-xl border border-white/20 shadow-lg">
                <Layers className="w-3.5 h-3.5 text-white" />
                <span className="text-[10px] font-black text-white uppercase tracking-widest">{course.lessons.length} {course.lessons.length === 1 ? 'lesson' : 'lessons'}</span>
              </div>
            </div>
          )}

          {course.level && (
            <div className="absolute bottom-4 left-4 z-10">
              <div className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-xl border shadow-lg", levelConfig.bg, levelConfig.text, levelConfig.border)}>
                <span className="text-[8px] tracking-[2px]">{levelConfig.icon}</span>
                <span className="text-[10px] font-black uppercase tracking-wider">{course.level}</span>
              </div>
            </div>
          )}
        </div>

        {/* Body */}
        <div className="p-6 flex-1 flex flex-col">
          <div className="flex gap-1.5 mb-3 flex-wrap">
            {(course.tags || []).slice(0, 2).map((tag, i) => {
              const tagColors = ['text-indigo-600 bg-indigo-50 border-indigo-100', 'text-violet-600 bg-violet-50 border-violet-100'];
              return <span key={tag} className={cn("text-[9px] font-black uppercase tracking-[0.12em] px-2 py-0.5 rounded-md border", tagColors[i % tagColors.length])}>{tag}</span>;
            })}
            {course.category && (course.tags || []).length === 0 && (
              <span className="text-[9px] font-black uppercase tracking-[0.12em] text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">{course.category}</span>
            )}
          </div>

          <h3 className="font-black text-[16px] text-slate-900 leading-[1.3] mb-3 group-hover:text-indigo-600 transition-colors line-clamp-2">{course.title}</h3>

          {course.description && <p className="text-[12px] text-slate-400 font-medium leading-relaxed line-clamp-2 mb-4">{course.description}</p>}

          <div className="flex items-center gap-2.5 mb-5 mt-auto">
            <div className={cn("w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-black shadow-sm ring-2 ring-white", `bg-gradient-to-br ${gradient}`)}>
              {course.mentorId?.avatarUrl ? <img src={getAvatarUrl(course.mentorId)} alt={mentorName} className="w-full h-full rounded-full object-cover" /> : mentorInitial}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-black text-slate-800 leading-none truncate">{mentorName}</p>
              {course.mentorId?.mentorProfile?.headline && <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tight leading-none mt-0.5 truncate">{course.mentorId.mentorProfile.headline}</p>}
            </div>
            {(course.rating || 0) > 0 && (
              <div className="flex items-center gap-1">
                <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                <span className="text-[11px] font-black text-slate-700">{course.rating.toFixed(1)}</span>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                <Users className="w-3.5 h-3.5 text-slate-300" />
                <span className="text-[11px] font-black text-slate-500">{course.enrolledCount || 0}</span>
              </div>
              {course.lessons?.length > 0 && (
                <div className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-slate-300" />
                  <span className="text-[11px] font-bold text-slate-400">{course.lessons.length} lessons</span>
                </div>
              )}
            </div>
            {isPremium ? (
              <div className="flex items-center gap-2">
                <span className="text-[13px] font-black text-amber-600">${course.price}</span>
                <button onClick={handleEnroll} disabled={enrolling} className="flex items-center gap-1.5 text-[11px] font-black text-white bg-gradient-to-r from-amber-500 to-yellow-500 px-4 py-2 rounded-xl hover:from-amber-600 hover:to-yellow-600 active:scale-95 transition-all duration-300 shadow-lg shadow-amber-500/20 disabled:opacity-50">
                  {enrolling ? 'Enrolling...' : 'Get Access'}<Crown className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button onClick={handleEnroll} disabled={enrolling} className="flex items-center gap-1.5 text-[11px] font-black text-white bg-slate-900 px-4 py-2 rounded-xl hover:bg-indigo-600 active:scale-95 transition-all duration-300 shadow-lg shadow-slate-900/20 hover:shadow-indigo-500/30 group/btn disabled:opacity-50">
                {enrolling ? 'Enrolling...' : 'Preview'}<ArrowRight className="w-3.5 h-3.5 transition-transform group-hover/btn:translate-x-0.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}, (prevProps, nextProps) => {
  return prevProps.course._id === nextProps.course._id &&
         prevProps.isWishlisted === nextProps.isWishlisted &&
         prevProps.isCompared === nextProps.isCompared;
});

// --- Main Component ---
const ExploreCourses = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const {
    courses, categories, wishlist, filters,
    fetchCourses, fetchCategories, fetchWishlist, toggleWishlist
  } = useLearning();

  const [activeTab, setActiveTab] = useState(searchParams.get('type') || 'all');
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [showFilters, setShowFilters] = useState(false);
  const [sort, setSort] = useState(searchParams.get('sort') || 'newest');
  const [viewMode, setViewMode] = useState('grid');
  const [compareCourses, setCompareCourses] = useState([]);
  const debouncedSearch = useDebounce(search, 350);

  const toggleCompare = (course) => {
    setCompareCourses(prev => {
      const exists = prev.find(c => c._id === course._id);
      if (exists) return prev.filter(c => c._id !== course._id);
      if (prev.length >= 4) return prev; // Max 4 courses
      return [...prev, course];
    });
  };

  // Fetch on mount
  useEffect(() => {
    fetchCategories();
    fetchWishlist();
  }, []);

  // Fetch courses when filters change
  useEffect(() => {
    const params = {
      type: activeTab,
      search: debouncedSearch,
      sort,
      category: filters.category || '',
      level: filters.level || '',
      minRating: filters.minRating || ''
    };
    fetchCourses(params, true);

    // Sync URL
    const urlParams = new URLSearchParams();
    if (activeTab !== 'all') urlParams.set('type', activeTab);
    if (debouncedSearch) urlParams.set('search', debouncedSearch);
    if (sort !== 'newest') urlParams.set('sort', sort);
    setSearchParams(urlParams, { replace: true });
  }, [activeTab, debouncedSearch, sort, filters.category, filters.level, filters.minRating]);

  const handleLoadMore = () => {
    fetchCourses({ type: activeTab, search: debouncedSearch, sort }, false);
  };

  const handleFilterChange = (newFilters) => {
    // This dispatches to context
    fetchCourses(newFilters, true);
  };

  const handleRemoveFilter = (key) => {
    if (key === 'search') {
      setSearch('');
    } else {
      fetchCourses({ [key]: '' }, true);
    }
  };

  const handleSuggestionSelect = (suggestion) => {
    if (suggestion.type === 'category') {
      fetchCourses({ category: suggestion.text }, true);
    } else {
      setSearch(suggestion.text);
    }
  };

  const courseData = courses.data || [];
  const loading = courses.loading;
  const error = courses.error;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight leading-none mb-3">Explore Courses</h1>
          <p className="text-base text-slate-500 font-medium">Discover curated world-class courses to accelerate your career.</p>
        </div>
        <SearchBar value={search} onChange={setSearch} onSelect={handleSuggestionSelect} />
      </div>

      {/* Tabs + Sort + Filter Toggle */}
      <div className="flex flex-col md:flex-row md:items-center gap-4">
        <div className="flex items-center gap-2 bg-white rounded-2xl border border-slate-200/60 p-1.5 shadow-sm flex-1">
          {TABS.map(tab => {
            const isActive = activeTab === tab.id;
            return (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={cn(
                "flex items-center gap-2 px-5 py-2.5 rounded-xl text-[13px] font-bold transition-all duration-300 flex-1 justify-center",
                isActive ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/20" : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"
              )}>
                <tab.icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2">
          {/* Sort Dropdown */}
          <div className="relative">
            <select value={sort} onChange={e => setSort(e.target.value)} className="appearance-none bg-white border border-slate-200 rounded-xl px-4 py-2.5 pr-8 text-[13px] font-bold text-slate-700 cursor-pointer hover:border-indigo-200 transition-colors outline-none">
              {SORT_OPTIONS.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}
            </select>
            <ArrowUpDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
          </div>

          {/* Filter Toggle */}
          <button onClick={() => setShowFilters(!showFilters)} className={cn(
            "flex items-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-bold transition-all border",
            showFilters ? "bg-indigo-50 border-indigo-200 text-indigo-600" : "bg-white border-slate-200 text-slate-700 hover:border-indigo-200"
          )}>
            <SlidersHorizontal className="w-4 h-4" />
            Filters
          </button>

          {/* View Toggle */}
          <div className="flex items-center bg-white border border-slate-200 rounded-xl overflow-hidden">
            <button onClick={() => setViewMode('grid')} className={cn("p-2.5 transition-colors", viewMode === 'grid' ? "bg-indigo-50 text-indigo-600" : "text-slate-400 hover:text-slate-600")}>
              <Grid3X3 className="w-4 h-4" />
            </button>
            <button onClick={() => setViewMode('list')} className={cn("p-2.5 transition-colors", viewMode === 'list' ? "bg-indigo-50 text-indigo-600" : "text-slate-400 hover:text-slate-600")}>
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Filter Panel */}
      <FilterPanel
        filters={filters}
        onChange={handleFilterChange}
        categories={categories.data || []}
        show={showFilters}
        onClose={() => setShowFilters(false)}
      />

      {/* Filter Chips */}
      <FilterChips filters={{ ...filters, search }} categories={categories.data || []} onRemove={handleRemoveFilter} />

      {/* Course Count */}
      {!loading && !error && courseData.length > 0 && (
        <p className="text-[12px] font-bold text-slate-400">
          Showing {courseData.length} of {courses.total} courses
        </p>
      )}

      {/* Loading State */}
      {loading && !courseData.length && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => <CourseCardSkeleton key={i} />)}
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="flex flex-col items-center justify-center py-24">
          <div className="w-16 h-16 bg-rose-50 rounded-2xl flex items-center justify-center mb-4">
            <AlertCircle className="w-8 h-8 text-rose-400" />
          </div>
          <p className="text-sm font-bold text-rose-600">{error}</p>
          <button onClick={() => fetchCourses({ type: activeTab, search: debouncedSearch, sort }, true)} className="mt-3 text-xs font-bold text-indigo-600 hover:text-indigo-700 underline">Try again</button>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && courseData.length === 0 && (
        <div className="py-24 text-center">
          <div className="w-20 h-20 bg-slate-100 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <BookOpen className="w-10 h-10 text-slate-300" />
          </div>
          <h3 className="text-xl font-black text-slate-900 mb-2">No courses found</h3>
          <p className="text-slate-500 font-medium">Try adjusting your search or filters.</p>
        </div>
      )}

      {/* Courses Grid */}
      {!loading && !error && courseData.length > 0 && (
        <div className={cn(
          viewMode === 'grid'
            ? "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6"
            : "space-y-4"
        )}>
          {courseData.map((course, idx) => (
            <CourseCard
              key={course._id}
              course={course}
              index={idx}
              isWishlisted={(wishlist.data || []).some(w => w._id === course._id)}
              onToggleWishlist={toggleWishlist}
              isCompared={compareCourses.some(c => c._id === course._id)}
              onToggleCompare={toggleCompare}
            />
          ))}
        </div>
      )}

      {/* Load More */}
      {courses.hasMore && !loading && courseData.length > 0 && (
        <div className="flex justify-center pt-4">
          <button onClick={handleLoadMore} disabled={loading} className="flex items-center gap-2 bg-white border border-slate-200 text-slate-700 px-8 py-3 rounded-2xl text-sm font-bold hover:border-indigo-200 hover:text-indigo-600 transition-all active:scale-95 shadow-sm">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ChevronDown className="w-4 h-4" />}
            Load More Courses
          </button>
        </div>
      )}

      {/* Loading more indicator */}
      {loading && courseData.length > 0 && (
        <div className="flex justify-center py-4">
          <Loader2 className="w-6 h-6 text-indigo-600 animate-spin" />
        </div>
      )}

      {/* Compare Drawer */}
      <CompareDrawer
        courses={compareCourses}
        onRemove={(id) => setCompareCourses(prev => prev.filter(c => c._id !== id))}
        onClear={() => setCompareCourses([])}
      />

      {/* Bottom padding when compare drawer is visible */}
      {compareCourses.length > 0 && <div className="h-20" />}
    </div>
  );
};

export default ExploreCourses;
