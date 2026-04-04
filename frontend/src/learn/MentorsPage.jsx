import React, { useState, useEffect, useCallback } from 'react';
import { Users, Loader2, AlertCircle, GraduationCap, Search, X, SlidersHorizontal, ChevronDown } from 'lucide-react';
import { mentorshipService } from '../services/api';
import { useAuth } from '../auth/AuthContext';
import { cn } from '../utils/cn';
import { useDebounce } from '../hooks/useDebounce';
import MentorCard from './MentorCard';
import RequestMentorshipModal from './RequestMentorshipModal';

const GRADIENTS = [
  'from-blue-500 to-indigo-600',
  'from-emerald-500 to-teal-600',
  'from-cyan-500 to-blue-600',
  'from-violet-500 to-purple-600',
  'from-rose-500 to-pink-600',
  'from-orange-500 to-amber-600',
  'from-fuchsia-500 to-pink-600',
  'from-lime-500 to-green-600',
];

const SORT_OPTIONS = [
  { id: 'rating', label: 'Highest Rated' },
  { id: 'experience', label: 'Most Experienced' },
  { id: 'students', label: 'Most Students' },
  { id: 'price_low', label: 'Price: Low to High' },
  { id: 'price_high', label: 'Price: High to Low' },
];

const MentorsPage = () => {
  const { user } = useAuth();
  const [mentors, setMentors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [connectMentor, setConnectMentor] = useState(null);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('rating');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [total, setTotal] = useState(0);
  const debouncedSearch = useDebounce(search, 350);

  const fetchMentors = useCallback(async (reset = true) => {
    if (reset) { setLoading(true); setPage(1); } else { setLoadingMore(true); }
    setError(null);
    try {
      const params = {
        page: reset ? 1 : page + 1,
        limit: 12,
        search: debouncedSearch || undefined,
        sort
      };
      const data = await mentorshipService.getMentors();
      // Support both old array format and new paginated format
      const mentorsList = Array.isArray(data) ? data : (data.mentors || []);
      const totalCount = data.total || mentorsList.length;

      if (reset) {
        setMentors(mentorsList);
      } else {
        setMentors(prev => [...prev, ...mentorsList]);
      }
      setTotal(totalCount);
      setHasMore(reset ? mentorsList.length >= 12 : (page + 1) * 12 < totalCount);
      if (!reset) setPage(p => p + 1);
    } catch (err) {
      setError('Failed to load mentors');
      console.error('Fetch mentors error:', err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [debouncedSearch, sort, page]);

  useEffect(() => {
    fetchMentors(true);
  }, [debouncedSearch, sort]);

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <GraduationCap className="w-7 h-7 text-indigo-600" />
            Mentors
          </h1>
          <p className="text-sm text-slate-500 mt-1 font-medium">Connect with expert mentors to accelerate your growth.</p>
        </div>
      </div>

      {/* Search + Sort Bar */}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search mentors by name or skill..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-slate-100/60 border-2 border-transparent focus:bg-white focus:border-indigo-100 rounded-2xl py-3 pl-11 pr-10 text-sm font-bold text-slate-800 placeholder:text-slate-400 outline-none transition-all"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-slate-100">
              <X className="w-4 h-4 text-slate-400" />
            </button>
          )}
        </div>
        <div className="relative">
          <select value={sort} onChange={e => setSort(e.target.value)} className="appearance-none bg-white border border-slate-200 rounded-xl px-4 py-3 pr-8 text-sm font-bold text-slate-700 cursor-pointer hover:border-indigo-200 outline-none">
            {SORT_OPTIONS.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}
          </select>
          <SlidersHorizontal className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
        </div>
      </div>

      {/* Results count */}
      {!loading && !error && mentors.length > 0 && (
        <p className="text-[12px] font-bold text-slate-400">{total} mentors found</p>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-24">
          <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mb-4" />
          <p className="text-sm font-bold text-slate-400">Loading mentors...</p>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="flex flex-col items-center justify-center py-24">
          <div className="w-16 h-16 bg-rose-50 rounded-2xl flex items-center justify-center mb-4">
            <AlertCircle className="w-8 h-8 text-rose-400" />
          </div>
          <p className="text-sm font-bold text-rose-600">{error}</p>
          <button onClick={() => fetchMentors(true)} className="mt-3 text-xs font-bold text-indigo-600 hover:text-indigo-700 underline">Try again</button>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && mentors.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-20 h-20 bg-slate-100 rounded-3xl flex items-center justify-center mb-6">
            <Users className="w-10 h-10 text-slate-300" />
          </div>
          <h3 className="text-xl font-black text-slate-900 mb-2">
            {search ? 'No mentors match your search' : 'No mentors available yet'}
          </h3>
          <p className="text-slate-400 font-medium text-sm max-w-md">
            {search ? 'Try adjusting your search terms.' : 'Mentors will appear here once they join the platform. Check back soon!'}
          </p>
        </div>
      )}

      {/* Mentors Grid */}
      {!loading && !error && mentors.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {mentors.map((mentor, idx) => (
            <MentorCard
              key={mentor._id}
              mentor={mentor}
              gradientClass={GRADIENTS[idx % GRADIENTS.length]}
              onConnect={() => setConnectMentor(mentor)}
            />
          ))}
        </div>
      )}

      {/* Load More */}
      {hasMore && !loading && !loadingMore && mentors.length > 0 && (
        <div className="flex justify-center pt-4">
          <button onClick={() => fetchMentors(false)} className="flex items-center gap-2 bg-white border border-slate-200 text-slate-700 px-8 py-3 rounded-2xl text-sm font-bold hover:border-indigo-200 hover:text-indigo-600 transition-all active:scale-95 shadow-sm">
            <ChevronDown className="w-4 h-4" /> Load More
          </button>
        </div>
      )}

      {loadingMore && (
        <div className="flex justify-center py-4">
          <Loader2 className="w-6 h-6 text-indigo-600 animate-spin" />
        </div>
      )}

      {/* Request Mentorship Modal */}
      {connectMentor && (
        <RequestMentorshipModal
          mentor={connectMentor}
          onClose={() => setConnectMentor(null)}
          onSuccess={() => {
            setConnectMentor(null);
            fetchMentors(true);
          }}
        />
      )}
    </div>
  );
};

export default MentorsPage;
