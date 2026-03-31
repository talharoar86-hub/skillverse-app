import React, { useState, useEffect } from 'react';
import { reviewService } from '../services/api';
import { useAuth } from '../auth/AuthContext';
import { getAvatarUrl } from '../utils/avatar';
import {
  Star, Loader2, ChevronLeft, ChevronRight
} from 'lucide-react';
import { cn } from '../utils/cn';

const MentorReviews = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => { loadStats(); }, []);
  useEffect(() => { loadReviews(page); }, [page]);

  const loadStats = async () => {
    try {
      const data = await reviewService.getStats(user._id);
      setStats(data);
    } catch (err) {
      console.error('Failed to load stats', err);
    }
  };

  const loadReviews = async (p) => {
    try {
      const data = await reviewService.getReviews(user._id, p);
      setReviews(data.reviews);
      setTotalPages(data.pages);
    } catch (err) {
      console.error('Failed to load reviews', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Reviews & Ratings</h1>
        <p className="text-sm text-slate-500 mt-1 font-medium">See what your students are saying about you.</p>
      </div>

      {/* Rating Overview */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Average Rating */}
          <div className="flex items-center gap-6">
            <div className="text-center">
              <p className="text-5xl font-black text-slate-900">{stats?.averageRating?.toFixed(1) || '0.0'}</p>
              <div className="flex items-center gap-0.5 mt-2 justify-center">
                {[1, 2, 3, 4, 5].map(i => (
                  <Star
                    key={i}
                    className={cn(
                      "w-5 h-5",
                      i <= Math.round(stats?.averageRating || 0)
                        ? "text-amber-400 fill-amber-400"
                        : "text-slate-200"
                    )}
                  />
                ))}
              </div>
              <p className="text-xs text-slate-400 font-medium mt-1">{stats?.totalReviews || 0} reviews</p>
            </div>
          </div>

          {/* Breakdown */}
          <div className="space-y-2.5">
            {[5, 4, 3, 2, 1].map(star => (
              <div key={star} className="flex items-center gap-3">
                <span className="text-xs font-bold text-slate-500 w-3">{star}</span>
                <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                <div className="flex-1 h-2.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-400 rounded-full transition-all duration-500"
                    style={{ width: `${stats?.breakdownPercent?.[star] || 0}%` }}
                  />
                </div>
                <span className="text-xs font-bold text-slate-400 w-10 text-right">
                  {stats?.breakdownPercent?.[star] || 0}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Review Cards */}
      {reviews.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm py-16 text-center">
          <Star className="w-12 h-12 text-slate-200 mx-auto mb-4" />
          <h3 className="text-lg font-black text-slate-900 mb-2">No reviews yet</h3>
          <p className="text-sm text-slate-400 font-medium">Reviews from your students will appear here.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map(review => (
            <div key={review._id} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-slate-100 overflow-hidden shrink-0 flex items-center justify-center">
                  {review.studentId?.avatarUrl ? (
                    <img src={review.studentId.avatarUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-sm font-bold text-slate-500">
                      {(review.studentId?.name || 'U').charAt(0)}
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="text-sm font-bold text-slate-900">{review.studentId?.name || 'Anonymous'}</h4>
                    <span className="text-[11px] text-slate-400 font-medium">
                      {new Date(review.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-0.5 mb-2">
                    {[1, 2, 3, 4, 5].map(i => (
                      <Star
                        key={i}
                        className={cn(
                          "w-3.5 h-3.5",
                          i <= review.rating
                            ? "text-amber-400 fill-amber-400"
                            : "text-slate-200"
                        )}
                      />
                    ))}
                  </div>
                  {review.comment && (
                    <p className="text-sm text-slate-600 font-medium leading-relaxed">{review.comment}</p>
                  )}
                </div>
              </div>
            </div>
          ))}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 disabled:opacity-30 transition-all"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-sm font-bold text-slate-600">{page} / {totalPages}</span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 disabled:opacity-30 transition-all"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MentorReviews;
