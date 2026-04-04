import React, { useState, useEffect } from 'react';
import { Trophy, Clock, BookOpen, Flame, Loader2, Medal, Crown, Zap } from 'lucide-react';
import { cn } from '../utils/cn';
import { useAuth } from '../auth/AuthContext';
import { getAvatarUrl } from '../utils/avatar';
import api from '../services/axiosClient';

const METRICS = [
  { id: 'hours', label: 'Hours Learned', icon: Clock },
  { id: 'courses', label: 'Courses Completed', icon: BookOpen },
  { id: 'streak', label: 'Current Streak', icon: Flame },
  { id: 'xp', label: 'XP Earned', icon: Zap },
];

const PERIODS = [
  { id: 'all-time', label: 'All Time' },
  { id: 'monthly', label: 'This Month' },
  { id: 'weekly', label: 'This Week' },
];

const PODIUM_COLORS = ['from-amber-400 to-yellow-500', 'from-slate-300 to-slate-400', 'from-amber-600 to-orange-700'];

const Leaderboard = () => {
  const { user } = useAuth();
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [metric, setMetric] = useState('hours');
  const [period, setPeriod] = useState('all-time');
  const [myRank, setMyRank] = useState(null);

  useEffect(() => {
    fetchLeaderboard();
  }, [metric, period]);

  const fetchLeaderboard = async () => {
    setLoading(true);
    try {
      const [lbRes, rankRes] = await Promise.all([
        api.get('/leaderboard', { params: { metric, period } }),
        api.get('/leaderboard/my-rank', { params: { metric, period } })
      ]);
      setLeaderboard(lbRes.data);
      setMyRank(rankRes.data);
    } catch (err) {
      console.error('Failed to load leaderboard:', err);
    } finally {
      setLoading(false);
    }
  };

  const podium = leaderboard.slice(0, 3);
  const rest = leaderboard.slice(3);
  const isInList = leaderboard.some(e => e.user?._id === user?._id);

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight leading-none mb-2">Leaderboard</h1>
        <p className="text-base text-slate-500 font-medium">See how you rank against other learners.</p>
      </div>

      {/* Rewards Banner */}
      <div className="bg-gradient-to-r from-amber-500 to-yellow-500 rounded-2xl p-5 text-white shadow-lg shadow-amber-500/20 flex items-center gap-4">
        <Crown className="w-8 h-8 shrink-0" />
        <div>
          <p className="font-black text-sm">Monthly Rewards</p>
          <p className="text-xs text-white/80">Top 3 this month get a Gold Badge + 500 XP bonus!</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex items-center gap-2 bg-white rounded-2xl border border-slate-200/60 p-1.5 shadow-sm flex-1">
          {METRICS.map(m => (
            <button key={m.id} onClick={() => setMetric(m.id)} className={cn(
              "flex items-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-bold transition-all flex-1 justify-center",
              metric === m.id ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/20" : "text-slate-500 hover:bg-slate-50"
            )}>
              <m.icon className="w-4 h-4" /><span className="hidden sm:inline">{m.label}</span>
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 bg-white rounded-2xl border border-slate-200/60 p-1.5 shadow-sm">
          {PERIODS.map(p => (
            <button key={p.id} onClick={() => setPeriod(p.id)} className={cn(
              "px-4 py-2.5 rounded-xl text-[13px] font-bold transition-all",
              period === p.id ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/20" : "text-slate-500 hover:bg-slate-50"
            )}>
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {loading && <div className="flex justify-center py-24"><Loader2 className="w-10 h-10 text-indigo-600 animate-spin" /></div>}

      {!loading && leaderboard.length === 0 && (
        <div className="text-center py-24">
          <Trophy className="w-16 h-16 text-slate-200 mx-auto mb-4" />
          <h3 className="text-xl font-black text-slate-900 mb-2">No data yet</h3>
          <p className="text-slate-500 font-medium">Start learning to appear on the leaderboard!</p>
        </div>
      )}

      {!loading && leaderboard.length > 0 && (
        <>
          {/* User Rank Card (if not in top list) */}
          {!isInList && myRank && myRank.rank && (
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-5 flex items-center justify-between text-white shadow-xl shadow-indigo-500/20">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                  <Medal className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-[10px] text-white/60 font-black uppercase tracking-widest">Your Rank</p>
                  <p className="text-lg font-black">#{myRank.rank} of {myRank.totalUsers || leaderboard.length}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-black">{myRank.score}</p>
                <p className="text-[10px] text-white/60 font-bold uppercase">{myRank.metric}</p>
              </div>
            </div>
          )}

          {/* Podium - Top 3 (only when 3+ entries) */}
          {podium.length >= 3 ? (
            <div className="flex items-end justify-center gap-4 pt-8">
              {[1, 0, 2].map((pos) => {
                const entry = podium[pos];
                if (!entry) return null;
                const heights = ['h-32', 'h-24', 'h-20'];
                const sizes = ['w-16 h-16', 'w-14 h-14', 'w-12 h-12'];
                return (
                  <div key={pos} className="flex flex-col items-center">
                    <div className={cn("rounded-full bg-gradient-to-br flex items-center justify-center text-white font-black shadow-lg mb-2 ring-4 ring-white", sizes[pos], PODIUM_COLORS[pos])}>
                      {entry.user?.avatarUrl ? <img src={getAvatarUrl(entry.user)} alt="" className="w-full h-full rounded-full" /> : (entry.user?.name || 'U').charAt(0)}
                    </div>
                    <p className="text-sm font-bold text-slate-800 truncate max-w-[100px] text-center">{entry.user?.name}</p>
                    <p className="text-lg font-black text-indigo-600">{entry.score}</p>
                    <div className={cn("w-24 rounded-t-2xl bg-gradient-to-b mt-2", PODIUM_COLORS[pos], heights[pos])} />
                    <p className="text-xs font-bold text-white mt-1">#{pos + 1}</p>
                  </div>
                );
              })}
            </div>
          ) : (
            podium.length > 0 && podium.map((entry, i) => {
              const isCurrentUser = entry.user?._id === user?._id;
              return (
                <div key={entry.user?._id || i} className={cn("flex items-center gap-4 px-5 py-4 bg-white rounded-2xl border shadow-sm mb-2", isCurrentUser ? "border-indigo-200 bg-indigo-50" : "border-slate-100")}>
                  <span className="text-lg font-black text-amber-500 w-10 text-center">#{entry.rank}</span>
                  <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-sm font-bold text-slate-500 shrink-0">
                    {entry.user?.avatarUrl ? <img src={getAvatarUrl(entry.user)} alt="" className="w-full h-full rounded-full" /> : (entry.user?.name || 'U').charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={cn("text-sm font-bold truncate", isCurrentUser ? "text-indigo-600" : "text-slate-800")}>{entry.user?.name} {isCurrentUser && '(You)'}</p>
                    <p className="text-[10px] text-slate-400 font-medium">{entry.metric}</p>
                  </div>
                  <span className={cn("text-lg font-black", isCurrentUser ? "text-indigo-600" : "text-slate-700")}>{entry.score}</span>
                </div>
              );
            })
          )}

          {/* Rest of leaderboard */}
          {rest.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              {rest.map((entry, i) => {
                const isCurrentUser = entry.user?._id === user?._id;
                return (
                  <div key={entry.user?._id || i} className={cn("flex items-center gap-4 px-5 py-4 border-b border-slate-50 last:border-0 transition-colors", isCurrentUser ? "bg-indigo-50" : "hover:bg-slate-50")}>
                    <span className="text-sm font-black text-slate-400 w-8 text-center">#{entry.rank}</span>
                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-sm font-bold text-slate-500 shrink-0">
                      {entry.user?.avatarUrl ? <img src={getAvatarUrl(entry.user)} alt="" className="w-full h-full rounded-full" /> : (entry.user?.name || 'U').charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={cn("text-sm font-bold truncate", isCurrentUser ? "text-indigo-600" : "text-slate-800")}>{entry.user?.name} {isCurrentUser && '(You)'}</p>
                      <p className="text-[10px] text-slate-400 font-medium">{entry.metric}</p>
                    </div>
                    <span className={cn("text-lg font-black", isCurrentUser ? "text-indigo-600" : "text-slate-700")}>{entry.score}</span>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Leaderboard;
