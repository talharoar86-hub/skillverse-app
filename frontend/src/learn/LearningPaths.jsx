import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Route, BookOpen, Users, Clock, Layers, Loader2, AlertCircle, ChevronRight, Search, Star, ArrowRight } from 'lucide-react';
import { cn } from '../utils/cn';
import api from '../services/axiosClient';

const GRADIENTS = [
  'from-blue-500 via-indigo-500 to-violet-600',
  'from-emerald-400 via-teal-500 to-cyan-600',
  'from-violet-500 via-purple-500 to-fuchsia-600',
  'from-rose-400 via-pink-500 to-red-500',
  'from-orange-400 via-amber-500 to-yellow-500',
  'from-cyan-400 via-blue-500 to-indigo-600',
];

const LearningPaths = () => {
  const navigate = useNavigate();
  const [paths, setPaths] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchPaths();
  }, []);

  const fetchPaths = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/learning-paths');
      setPaths(data.paths || []);
    } catch {
      setError('Failed to load learning paths');
    } finally {
      setLoading(false);
    }
  };

  const filtered = paths.filter(p =>
    p.title?.toLowerCase().includes(search.toLowerCase()) ||
    p.category?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight leading-none mb-3">Learning Paths</h1>
          <p className="text-base text-slate-500 font-medium">Structured course sequences to master a skill from start to finish.</p>
        </div>
        <div className="relative w-full md:w-[300px]">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input type="text" placeholder="Search paths..." value={search} onChange={e => setSearch(e.target.value)} className="w-full bg-slate-100/60 border-2 border-transparent focus:bg-white focus:border-indigo-100 rounded-2xl py-3 pl-11 pr-4 text-sm font-bold text-slate-800 placeholder:text-slate-400 outline-none transition-all" />
        </div>
      </div>

      {loading && (
        <div className="flex justify-center py-24"><Loader2 className="w-10 h-10 text-indigo-600 animate-spin" /></div>
      )}

      {error && !loading && (
        <div className="flex flex-col items-center py-24"><AlertCircle className="w-8 h-8 text-rose-400 mb-4" /><p className="text-sm font-bold text-rose-600">{error}</p></div>
      )}

      {!loading && !error && filtered.length === 0 && (
        <div className="text-center py-24">
          <div className="w-20 h-20 bg-slate-100 rounded-3xl flex items-center justify-center mx-auto mb-6"><Route className="w-10 h-10 text-slate-300" /></div>
          <h3 className="text-xl font-black text-slate-900 mb-2">No learning paths yet</h3>
          <p className="text-slate-500 font-medium">Learning paths will appear here once mentors create them.</p>
        </div>
      )}

      {!loading && !error && filtered.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filtered.map((path, idx) => (
            <div key={path._id} className="relative group cursor-pointer" onClick={() => navigate(`/learn/paths/${path._id}`)}>
              <div className={cn("absolute -inset-[1px] rounded-[1.5rem] opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-sm bg-gradient-to-br", GRADIENTS[idx % GRADIENTS.length])} />
              <div className="relative bg-white rounded-[1.5rem] border border-slate-200/60 shadow-sm hover:shadow-xl transition-all duration-500 overflow-hidden transform group-hover:-translate-y-1">
                <div className={cn("h-36 bg-gradient-to-br flex items-center justify-center", GRADIENTS[idx % GRADIENTS.length])}>
                  <Route className="w-12 h-12 text-white/60" />
                </div>
                <div className="p-6">
                  <div className="flex items-center gap-2 mb-2">
                    {path.level && <span className="text-[9px] font-black uppercase tracking-widest text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">{path.level}</span>}
                    {path.category && <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 bg-slate-50 px-2 py-0.5 rounded-md">{path.category}</span>}
                  </div>
                  <h3 className="font-black text-lg text-slate-900 mb-2 group-hover:text-indigo-600 transition-colors line-clamp-2">{path.title}</h3>
                  {path.description && <p className="text-xs text-slate-400 font-medium line-clamp-2 mb-4">{path.description}</p>}
                  <div className="flex items-center gap-3 text-[11px] text-slate-400 font-bold">
                    <span className="flex items-center gap-1"><Layers className="w-3.5 h-3.5" />{path.courses?.length || 0} courses</span>
                    {path.enrolledCount > 0 && <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" />{path.enrolledCount}</span>}
                  </div>
                  {path.creator && (
                    <div className="flex items-center gap-2 mt-4 pt-4 border-t border-slate-100">
                      <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-500">
                        {(path.creator.name || 'M').charAt(0)}
                      </div>
                      <span className="text-[11px] font-bold text-slate-600">{path.creator.name}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default LearningPaths;
