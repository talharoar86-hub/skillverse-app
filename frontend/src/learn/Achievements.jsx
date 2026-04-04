import React, { useState, useEffect, useCallback } from 'react';
import { Award, Flame, Star, Clock, MessageSquare, Edit3, Footprints, Zap, Trophy, Loader2, CheckCircle, Lock, Sparkles } from 'lucide-react';
import { cn } from '../utils/cn';
import api from '../services/axiosClient';
import { useSocket } from '../context/SocketContext';

const ICON_MAP = {
  trophy: Trophy, star: Star, award: Award, flame: Flame, clock: Clock,
  'message-square': MessageSquare, 'edit-3': Edit3, footprints: Footprints, zap: Zap,
};

const CATEGORY_COLORS = {
  completion: { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700', accent: 'bg-emerald-500' },
  streak: { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', accent: 'bg-amber-500' },
  social: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700', accent: 'bg-blue-500' },
  milestone: { bg: 'bg-violet-50', border: 'border-violet-200', text: 'text-violet-700', accent: 'bg-violet-500' },
};

const RARITY_STYLES = {
  common: { border: 'border-slate-200', glow: '', label: 'Common', color: 'text-slate-500' },
  rare: { border: 'border-blue-300', glow: 'shadow-blue-100', label: 'Rare', color: 'text-blue-600' },
  epic: { border: 'border-violet-300', glow: 'shadow-violet-100', label: 'Epic', color: 'text-violet-600' },
  legendary: { border: 'border-amber-300', glow: 'shadow-amber-100', label: 'Legendary', color: 'text-amber-600' },
};

const Achievements = () => {
  const [achievements, setAchievements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [xpData, setXpData] = useState(null);
  const [unlockToast, setUnlockToast] = useState(null);
  const socket = useSocket();

  const fetchAchievements = useCallback(async () => {
    try {
      const [achRes, xpRes] = await Promise.all([
        api.get('/achievements'),
        api.get('/achievements/xp')
      ]);
      setAchievements(achRes.data);
      setXpData(xpRes.data);
    } catch (err) {
      console.error('Failed to load achievements:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAchievements();
    // Auto-check achievements on mount (no manual button needed)
    api.post('/achievements/check').then(() => fetchAchievements()).catch(() => {});
  }, [fetchAchievements]);

  // Listen for WebSocket achievement unlock events
  useEffect(() => {
    if (!socket) return;
    const handleUnlock = (data) => {
      setUnlockToast(data);
      fetchAchievements();
      setTimeout(() => setUnlockToast(null), 5000);
    };
    socket.on('achievement:unlock', handleUnlock);
    return () => socket.off('achievement:unlock', handleUnlock);
  }, [socket, fetchAchievements]);

  const filtered = filter === 'all' ? achievements : achievements.filter(a => a.category === filter);
  const unlocked = achievements.filter(a => a.userProgress?.unlockedAt);
  const categories = ['all', 'completion', 'streak', 'social', 'milestone'];

  if (loading) return <div className="flex justify-center py-24"><Loader2 className="w-10 h-10 text-indigo-600 animate-spin" /></div>;

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Unlock Toast */}
      {unlockToast && (
        <div className="fixed top-4 right-4 z-[100] animate-slide-in">
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-4 rounded-2xl shadow-2xl shadow-indigo-500/30 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
              <Trophy className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-white/70">Achievement Unlocked!</p>
              <p className="font-bold text-sm">{unlockToast.name}</p>
              {unlockToast.xpReward > 0 && (
                <p className="text-[11px] font-bold text-amber-300">+{unlockToast.xpReward} XP</p>
              )}
            </div>
            <button onClick={() => setUnlockToast(null)} className="ml-4 text-white/60 hover:text-white text-lg">&times;</button>
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight leading-none mb-2">Achievements</h1>
          <p className="text-base text-slate-500 font-medium">Track your learning milestones and earn badges.</p>
        </div>
        {xpData && (
          <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-2xl px-5 py-3">
            <Sparkles className="w-5 h-5 text-amber-500" />
            <div>
              <p className="text-lg font-black text-amber-700">{xpData.totalXP} XP</p>
              <p className="text-[10px] font-bold text-amber-500 uppercase">Level {xpData.level}</p>
            </div>
            <div className="w-px h-8 bg-amber-200 mx-1" />
            <div>
              <p className="text-[10px] font-bold text-amber-600">{xpData.xpToNextLevel} XP to next level</p>
              <div className="w-20 h-1.5 bg-amber-200 rounded-full overflow-hidden mt-1">
                <div className="h-full bg-amber-500 rounded-full" style={{ width: `${((1000 - xpData.xpToNextLevel) / 1000) * 100}%` }} />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Summary */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-3xl p-8 text-white shadow-xl shadow-indigo-500/20">
        <div className="flex items-center gap-6">
          <div className="w-20 h-20 rounded-2xl bg-white/20 flex items-center justify-center">
            <Award className="w-10 h-10" />
          </div>
          <div>
            <p className="text-3xl font-black">{unlocked.length} / {achievements.length}</p>
            <p className="text-sm text-white/70 font-medium">Achievements Unlocked</p>
          </div>
          <div className="flex-1 ml-8">
            <div className="w-full h-3 bg-white/20 rounded-full overflow-hidden">
              <div className="h-full bg-white rounded-full transition-all" style={{ width: `${achievements.length > 0 ? (unlocked.length / achievements.length) * 100 : 0}%` }} />
            </div>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 bg-white rounded-2xl border border-slate-200/60 p-1.5 shadow-sm">
        {categories.map(cat => (
          <button key={cat} onClick={() => setFilter(cat)} className={cn(
            "px-4 py-2 rounded-xl text-[13px] font-bold transition-all capitalize flex-1 text-center",
            filter === cat ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/20" : "text-slate-500 hover:bg-slate-50"
          )}>
            {cat}
          </button>
        ))}
      </div>

      {/* Achievement Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map(a => {
          const Icon = ICON_MAP[a.icon] || Trophy;
          const colors = CATEGORY_COLORS[a.category] || CATEGORY_COLORS.milestone;
          const rarity = RARITY_STYLES[a.rarity] || RARITY_STYLES.common;
          const isUnlocked = !!a.userProgress?.unlockedAt;
          const progress = a.userProgress?.progress || 0;
          const progressPercent = Math.min(100, (progress / a.criteriaThreshold) * 100);
          const remaining = a.criteriaThreshold - progress;

          return (
            <div key={a._id} className={cn(
              "relative bg-white rounded-2xl border p-5 shadow-sm transition-all hover:shadow-md",
              isUnlocked ? cn(colors.border, rarity.glow) : rarity.border
            )}>
              {isUnlocked && (
                <div className="absolute top-3 right-3">
                  <CheckCircle className="w-5 h-5 text-emerald-500" />
                </div>
              )}
              <div className={cn("absolute top-3 left-3 text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md bg-slate-50", rarity.color)}>
                {rarity.label}
              </div>
              <div className="flex items-start gap-4 mt-3">
                <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center shrink-0", isUnlocked ? colors.bg : "bg-slate-50")}>
                  {isUnlocked ? <Icon className={cn("w-7 h-7", colors.text)} /> : <Lock className="w-6 h-6 text-slate-300" />}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className={cn("font-bold text-sm mb-0.5", isUnlocked ? "text-slate-900" : "text-slate-500")}>{a.name}</h3>
                  <p className="text-xs text-slate-400 font-medium mb-3">{a.description}</p>
                  {!isUnlocked && (
                    <div>
                      <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden mb-1">
                        <div className={cn("h-full rounded-full transition-all", colors.accent)} style={{ width: `${progressPercent}%` }} />
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-[10px] font-bold text-slate-400">{progress} / {a.criteriaThreshold}</p>
                        {remaining > 0 && remaining <= 5 && (
                          <p className="text-[10px] font-bold text-indigo-500">{remaining} more to go!</p>
                        )}
                      </div>
                    </div>
                  )}
                  {isUnlocked && (
                    <div className="flex items-center gap-3">
                      <p className="text-[10px] font-bold text-emerald-500">Unlocked {new Date(a.userProgress.unlockedAt).toLocaleDateString()}</p>
                      {a.xpReward > 0 && (
                        <span className="text-[10px] font-black text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md">+{a.xpReward} XP</span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Achievements;
