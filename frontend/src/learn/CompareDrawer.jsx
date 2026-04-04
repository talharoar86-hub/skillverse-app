import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Star, Clock, Layers, Users, DollarSign, Award, ChevronUp, ChevronDown, BarChart3 } from 'lucide-react';
import { cn } from '../utils/cn';

const CompareDrawer = ({ courses, onRemove, onClear, onToggleExpand }) => {
  const [expanded, setExpanded] = useState(false);
  const navigate = useNavigate();

  if (courses.length === 0) return null;

  const handleToggle = () => {
    setExpanded(!expanded);
    if (onToggleExpand) onToggleExpand(!expanded);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50">
      {/* Backdrop when expanded */}
      {expanded && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setExpanded(false)} />
      )}

      {/* Drawer */}
      <div className={cn(
        "relative bg-white border-t border-slate-200 shadow-2xl shadow-slate-900/20 transition-all duration-300",
        expanded ? "h-[80vh]" : "h-auto"
      )}>
        {/* Handle */}
        <button
          onClick={handleToggle}
          className="absolute -top-4 left-1/2 -translate-x-1/2 bg-white border border-slate-200 rounded-full px-4 py-1 flex items-center gap-1 shadow-sm hover:shadow-md transition-all"
        >
          {expanded ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronUp className="w-4 h-4 text-slate-400" />}
          <span className="text-xs font-bold text-slate-500">Compare ({courses.length})</span>
        </button>

        {!expanded ? (
          /* Collapsed: Course thumbnails */
          <div className="flex items-center gap-4 px-6 py-4">
            <div className="flex items-center gap-3 flex-1">
              {courses.map(course => (
                <div key={course._id} className="flex items-center gap-2 bg-slate-50 rounded-xl px-3 py-2 border border-slate-100">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shrink-0">
                    {course.thumbnail && course.thumbnail.startsWith('http') ? (
                      <img src={course.thumbnail} alt="" className="w-full h-full rounded-lg object-cover" />
                    ) : (
                      <span className="text-white text-xs font-black">{(course.title || 'C').charAt(0)}</span>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-800 truncate max-w-[120px]">{course.title}</p>
                    <p className="text-[10px] text-slate-400">{course.level}</p>
                  </div>
                  <button onClick={() => onRemove(course._id)} className="p-1 rounded-full hover:bg-rose-50 transition-colors">
                    <X className="w-3.5 h-3.5 text-slate-400 hover:text-rose-500" />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setExpanded(true)}
                disabled={courses.length < 2}
                className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-indigo-700 transition-all disabled:opacity-50 active:scale-95"
              >
                <BarChart3 className="w-4 h-4" /> Compare
              </button>
              <button onClick={onClear} className="p-2 rounded-xl hover:bg-slate-100 transition-colors">
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>
          </div>
        ) : (
          /* Expanded: Side-by-side comparison */
          <div className="h-full overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-black text-slate-900">Course Comparison</h2>
              <button onClick={() => setExpanded(false)} className="p-2 rounded-xl hover:bg-slate-100 transition-colors">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr>
                    <th className="text-left p-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest w-[140px]">Feature</th>
                    {courses.map(c => (
                      <th key={c._id} className="p-3 text-center min-w-[200px]">
                        <div className="flex flex-col items-center gap-2">
                          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
                            {c.thumbnail && c.thumbnail.startsWith('http') ? (
                              <img src={c.thumbnail} alt="" className="w-full h-full rounded-2xl object-cover" />
                            ) : (
                              <span className="text-white text-lg font-black">{(c.title || 'C').charAt(0)}</span>
                            )}
                          </div>
                          <p className="text-sm font-bold text-slate-900 line-clamp-2">{c.title}</p>
                          <button onClick={() => navigate(`/learn/course/${c._id}`)} className="text-[10px] font-bold text-indigo-600 hover:text-indigo-700 underline">
                            View Course
                          </button>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {[
                    { label: 'Price', icon: DollarSign, getValue: c => c.price > 0 ? `$${c.price}` : 'Free' },
                    { label: 'Level', icon: Award, getValue: c => c.level || 'Beginner' },
                    { label: 'Lessons', icon: Layers, getValue: c => c.lessons?.length || 0 },
                    { label: 'Rating', icon: Star, getValue: c => c.rating > 0 ? `${c.rating.toFixed(1)} (${c.totalReviews})` : 'No reviews' },
                    { label: 'Students', icon: Users, getValue: c => c.enrolledCount || 0 },
                    { label: 'Category', icon: null, getValue: c => c.category || 'Uncategorized' },
                    { label: 'Tags', icon: null, getValue: c => (c.tags || []).join(', ') || 'None' },
                    { label: 'Instructor', icon: null, getValue: c => c.mentorId?.name || 'Unknown' },
                  ].map(row => {
                    const values = courses.map(c => row.getValue(c));
                    return (
                      <tr key={row.label} className="hover:bg-slate-50 transition-colors">
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            {row.icon && <row.icon className="w-4 h-4 text-slate-400" />}
                            <span className="text-sm font-bold text-slate-700">{row.label}</span>
                          </div>
                        </td>
                        {courses.map((c, i) => (
                          <td key={c._id} className="p-3 text-center">
                            <span className="text-sm font-medium text-slate-600">{values[i]}</span>
                          </td>
                        ))}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CompareDrawer;
