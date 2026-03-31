import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Users, TrendingUp, Zap, ChevronRight, Star, BookOpen, Clock, Target, CheckCircle2, MessageSquare, PlusCircle, BarChart3, RefreshCw } from 'lucide-react';
import { profileService, courseService } from '../services/api';
import { useAuth } from '../auth/AuthContext';
import { getAvatarUrl } from '../utils/avatar';

const REFRESH_INTERVAL = 5 * 60 * 1000; // 5 minutes

const RightSidebar = () => {
  const { user } = useAuth();
  const [mentors, setMentors] = useState([]);
  const [courses, setCourses] = useState([]);
  const [stats, setStats] = useState(null);
  const [requests, setRequests] = useState([]);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const intervalRef = useRef(null);

  const fetchData = useCallback(async () => {
    if (!user) return;
    try {
      setError(null);
      setLoading(true);

      const discoveryGoal = user?.goal === 'Learn' ? 'Mentor' : 'Learn';
      const discoveryPromise = profileService.getDiscovery(discoveryGoal);

      let goalPromise;
      if (user?.goal === 'Learn') {
        goalPromise = courseService.getCourses();
      } else if (user?.goal === 'Mentor') {
        goalPromise = Promise.all([
          profileService.getSidebarStats(),
          profileService.getMenteeRequests()
        ]);
      } else if (user?.goal === 'Exchange') {
        goalPromise = profileService.getSkillMatches();
      } else {
        goalPromise = Promise.resolve(null);
      }

      const [discoveryData, goalData] = await Promise.all([discoveryPromise, goalPromise]);

      setMentors(discoveryData?.users?.slice(0, 4) || []);

      if (user?.goal === 'Learn') {
        setCourses(goalData?.slice(0, 2) || []);
      } else if (user?.goal === 'Mentor' && Array.isArray(goalData)) {
        setStats(goalData[0]);
        setRequests(goalData[1]);
      } else if (user?.goal === 'Exchange') {
        setMatches(goalData);
      }

    } catch (err) {
      console.error('Failed to fetch sidebar data', err);
      setError(err.message || 'Failed to load sidebar data');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchData();

    intervalRef.current = setInterval(fetchData, REFRESH_INTERVAL);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [fetchData]);

  // --- Loading Skeleton ---
  const LoadingSkeleton = () => (
    <div className="w-full flex flex-col gap-6 pb-20 pt-6">
      {[1, 2, 3].map(i => (
        <div key={i} className="bg-white rounded-2xl border border-slate-100 px-4 py-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-7 h-7 bg-slate-100 rounded-lg animate-pulse" />
            <div className="h-3 bg-slate-100 rounded w-32 animate-pulse" />
          </div>
          <div className="space-y-3">
            {[1, 2, 3].map(j => (
              <div key={j} className="flex gap-3 animate-pulse">
                <div className="w-10 h-10 bg-slate-100 rounded-full" />
                <div className="flex-1 space-y-2 py-1">
                  <div className="h-2 bg-slate-100 rounded w-3/4" />
                  <div className="h-2 bg-slate-100 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );

  // --- Error State ---
  if (error && !loading && mentors.length === 0) {
    return (
      <div className="w-full flex flex-col items-center justify-center py-20 px-4 gap-4">
        <div className="w-12 h-12 rounded-2xl bg-rose-50 flex items-center justify-center">
          <Zap className="w-6 h-6 text-rose-400" />
        </div>
        <p className="text-sm font-bold text-slate-600 text-center">Could not load sidebar</p>
        <button
          onClick={fetchData}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-xs font-bold rounded-xl hover:bg-indigo-700 transition-all active:scale-95"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Retry
        </button>
      </div>
    );
  }

  if (loading && mentors.length === 0) return <LoadingSkeleton />;

  // --- Helper for "Coming Soon" Boxes ---
  const ComingSoonBox = ({ title, icon: Icon, color = "indigo" }) => (
    <div className="bg-white rounded-2xl border border-dashed border-slate-200 px-4 py-8 shadow-sm flex flex-col items-center justify-center text-center">
      <div className={`w-12 h-12 rounded-2xl bg-${color}-50 flex items-center justify-center mb-3`}>
        <Icon className={`w-6 h-6 text-${color}-500 opacity-40`} />
      </div>
      <h3 className="font-bold text-slate-800 text-sm mb-1">{title}</h3>
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Coming Soon</p>
    </div>
  );

  // --- LEARN WIDGETS ---
  const LearnContent = () => (
    <>
      {/* Recommended Courses Widget */}
      {courses.length > 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 px-4 py-5 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-bold text-slate-900 text-[15px] flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-indigo-600" />
              Recommended Courses
            </h3>
            <button className="text-xs font-bold text-indigo-600">See all</button>
          </div>
          <div className="space-y-4">
            {courses.map((course, i) => (
              <div key={course._id || i} className="group cursor-pointer">
                <h4 className="text-sm font-bold text-slate-800 group-hover:text-indigo-600 transition-colors truncate">{course.title}</h4>
                <div className="flex items-center gap-3 mt-1 text-[10px] font-bold text-slate-400">
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {course.duration || '2h 00m'}</span>
                  <span className="bg-slate-50 px-1.5 py-0.5 rounded text-indigo-600">{course.category || 'Skill'}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <ComingSoonBox title="Recommended Courses" icon={BookOpen} color="indigo" />
      )}
      
      <ComingSoonBox title="Your Skill Roadmap" icon={Target} color="indigo" />
    </>
  );

  // --- MENTOR WIDGETS ---
  const MentorContent = () => (
    <>
      {/* Student Requests Widget */}
      {requests.length > 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 px-4 py-5 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-bold text-slate-900 text-[15px] flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-emerald-500" />
              Active Mentee Requests
            </h3>
            <span className="text-[10px] font-black bg-rose-50 text-rose-500 px-2 py-0.5 rounded-full">{requests.length} New</span>
          </div>
          <div className="space-y-4">
            {requests.map((req, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-slate-50 flex items-center justify-center font-bold text-slate-400 text-xs">
                  {req.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-slate-800 truncate">{req.name}</p>
                  <p className="text-[10px] text-slate-400 font-medium truncate">{req.skill}</p>
                </div>
                <button className="p-1.5 hover:bg-slate-50 text-indigo-600 rounded-lg transition-colors">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <ComingSoonBox title="Mentee Requests" icon={MessageSquare} color="emerald" />
      )}

      {/* Profile Stats Widget */}
      <div className="bg-slate-900 rounded-2xl p-5 text-white shadow-xl shadow-slate-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-xs opacity-70 uppercase tracking-widest">Mentor Dashboard</h3>
          <BarChart3 className="w-4 h-4 text-indigo-400" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-2xl font-black">{stats?.views || 0}</p>
            <p className="text-[10px] font-bold opacity-50 uppercase mt-1">Profile Views</p>
          </div>
          <div>
            <p className="text-2xl font-black">{stats?.rating || '0.0'}</p>
            <p className="text-[10px] font-bold opacity-50 uppercase mt-1">Avg. Rating</p>
          </div>
        </div>
        <button className="w-full mt-5 bg-indigo-600 hover:bg-indigo-700 py-3 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2">
          <PlusCircle className="w-4 h-4" /> Create Course
        </button>
      </div>
    </>
  );

  // --- EXCHANGE WIDGETS ---
  const ExchangeContent = () => (
    <>
      {/* Skill Match Widget */}
      {matches.length > 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 px-4 py-5 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-bold text-slate-900 text-[15px] flex items-center gap-2">
              <Zap className="w-4 h-4 text-orange-500" />
              Top Skill Matches
            </h3>
            <button className="text-xs font-bold text-indigo-600">See all</button>
          </div>
          <div className="space-y-5">
            {matches.map((match, i) => (
              <div key={i} className="relative">
                <Link to={`/user/${match._id}/overview`} className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center font-bold text-xs text-slate-300 border border-slate-100 italic overflow-hidden">
                    {match.avatarUrl ? <img src={match.avatarUrl} alt="Avatar" /> : match.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-800 hover:text-indigo-600 transition-colors">{match.name}</p>
                    <p className="text-[10px] text-slate-400 font-medium">Wants: {match.get || 'Learning'}</p>
                  </div>
                  <span className="text-[10px] font-black text-emerald-500 bg-emerald-50 px-2 py-0.5 rounded-full">{match.match}</span>
                </Link>
                <div className="flex gap-1">
                  <button className="flex-1 py-1.5 rounded-lg bg-indigo-600 text-white text-[10px] font-bold hover:bg-indigo-700 transition-colors">Request</button>
                  <button className="px-2 rounded-lg border border-slate-100 text-slate-400 hover:bg-slate-50"><MessageSquare className="w-3 h-3" /></button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <ComingSoonBox title="Skill Matches" icon={Zap} color="orange" />
      )}

      <ComingSoonBox title="Match Interests" icon={Users} color="rose" />
    </>
  );

  return (
    <div className="w-full flex flex-col gap-6 pb-20 pt-6">
      
      {/* Dynamic Content Based on User Goal */}
      {user?.goal === 'Learn' && <LearnContent />}
      {user?.goal === 'Mentor' && <MentorContent />}
      {user?.goal === 'Exchange' && <ExchangeContent />}

      {/* Shared Widget: Top Mentors (Discovery) */}
      <div className="bg-white rounded-2xl border border-slate-100 px-4 py-5 shadow-sm">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-bold text-slate-900 text-[15px] flex items-center gap-2">
            <Users className="w-4 h-4 text-indigo-600" />
            {user?.goal === 'Mentor' ? 'Mentor Community' : 'Suggested Mentors'}
          </h3>
          <button className="text-xs font-bold text-indigo-600 hover:text-indigo-700 transition-colors">See all</button>
        </div>

        <div className="space-y-4">
          {loading ? (
            [1, 2, 3].map(i => (
              <div key={i} className="flex gap-3 animate-pulse">
                <div className="w-10 h-10 bg-slate-100 rounded-full"></div>
                <div className="flex-1 space-y-2 py-1">
                  <div className="h-2 bg-slate-100 rounded w-3/4"></div>
                  <div className="h-2 bg-slate-100 rounded w-1/2"></div>
                </div>
              </div>
            ))
          ) : mentors.length > 0 ? (
            mentors.map((mentor) => (
              <Link to={`/user/${mentor._id}/overview`} key={mentor._id} className="flex items-center gap-3 group cursor-pointer">
                <div className="relative">
                  <img 
                    src={getAvatarUrl(mentor)} 
                    alt={mentor.name} 
                    className="w-10 h-10 rounded-full object-cover border border-slate-100 group-hover:border-indigo-200 transition-colors"
                  />
                  <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-bold text-slate-800 truncate group-hover:text-indigo-600 transition-colors">
                    {mentor.name}
                  </h4>
                  <p className="text-[11px] text-slate-400 font-medium truncate">
                    {mentor.experienceLevel || 'Skill Ninja'}
                  </p>
                </div>
                <button className="p-2 text-slate-300 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all">
                  <Zap className="w-4 h-4" />
                </button>
              </Link>
            ))
          ) : (
             <p className="text-[10px] font-bold text-slate-400 text-center py-4">No suggestions found</p>
          )}
        </div>
      </div>

      {user?.goal === 'Learn' && (
        <div className="bg-indigo-600 rounded-2xl p-6 text-white relative overflow-hidden shadow-lg shadow-indigo-100">
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-3">
              <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
              <span className="text-[10px] font-black uppercase tracking-widest opacity-80">Weekly Goal</span>
            </div>
            <h4 className="text-lg font-bold mb-1">4/5 Sessions</h4>
            <p className="text-[11px] opacity-70 mb-4 font-medium">You're almost at your weekly learning goal. Finish one more session to earn a badge!</p>
            <div className="w-full h-1.5 bg-white/20 rounded-full overflow-hidden">
               <div className="w-[80%] h-full bg-white rounded-full"></div>
            </div>
          </div>
          <Zap className="absolute -bottom-4 -right-4 w-24 h-24 text-white/10 rotate-12" />
        </div>
      )}

      {/* Footer Links */}
      <div className="flex flex-wrap gap-x-4 gap-y-2 px-2">
        {['Privacy', 'Terms', 'Advertising', 'More'].map(link => (
          <button key={link} className="text-[11px] font-bold text-slate-400 hover:text-slate-600 transition-colors">
            {link}
          </button>
        ))}
        <span className="text-[11px] font-bold text-slate-300">SkillVerse © 2026</span>
      </div>

    </div>
  );
};

export default RightSidebar;
