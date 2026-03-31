import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { mentorService, mentorshipService } from '../services/api';
import {
  Users, BookOpen, Star, TrendingUp, Calendar,
  MessageCircle, Loader2, ArrowRight, Clock
} from 'lucide-react';

const StatCard = ({ icon: Icon, label, value, color }) => (
  <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex items-center gap-4">
    <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${color}`}>
      <Icon className="w-5 h-5 text-white" />
    </div>
    <div>
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}</p>
      <p className="text-2xl font-black text-slate-900">{value}</p>
    </div>
  </div>
);

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const MentorOverview = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [requests, setRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [statsData, sessionsData, requestsData] = await Promise.all([
        mentorService.getDashboardStats(),
        mentorService.getUpcomingSessions(),
        mentorshipService.getIncomingRequests()
      ]);
      setStats(statsData);
      setSessions(sessionsData);
      setRequests(requestsData.slice(0, 5));
    } catch (err) {
      console.error('Failed to load overview data', err);
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
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Dashboard Overview</h1>
        <p className="text-sm text-slate-500 mt-1 font-medium">Welcome back! Here's how your mentorship is going.</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Users} label="Total Students" value={stats?.totalStudents || 0} color="bg-indigo-600" />
        <StatCard icon={Calendar} label="Active Sessions" value={stats?.activeSessions || 0} color="bg-emerald-600" />
        <StatCard icon={Star} label="Rating" value={stats?.rating?.toFixed(1) || '5.0'} color="bg-amber-500" />
        <StatCard icon={BookOpen} label="Courses" value={stats?.totalCourses || 0} color="bg-violet-600" />
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <h2 className="text-lg font-black text-slate-900 tracking-tight mb-4">Quick Actions</h2>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => navigate('/mentor-dashboard/courses')}
            className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white text-sm font-bold rounded-xl shadow-lg shadow-indigo-200 hover:bg-indigo-700 active:scale-95 transition-all"
          >
            <BookOpen className="w-4 h-4" /> Create Course
          </button>
          <button
            onClick={() => navigate('/mentor-dashboard/schedule')}
            className="flex items-center gap-2 px-5 py-2.5 bg-slate-50 text-slate-600 border border-slate-200 text-sm font-bold rounded-xl hover:border-indigo-300 transition-all"
          >
            <Calendar className="w-4 h-4" /> Update Schedule
          </button>
          <button
            onClick={() => navigate('/messages')}
            className="flex items-center gap-2 px-5 py-2.5 bg-slate-50 text-slate-600 border border-slate-200 text-sm font-bold rounded-xl hover:border-indigo-300 transition-all"
          >
            <MessageCircle className="w-4 h-4" /> View Messages
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Sessions */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-black text-slate-900 tracking-tight">Upcoming Sessions</h2>
            <button
              onClick={() => navigate('/mentor-dashboard/schedule')}
              className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
            >
              View All <ArrowRight className="w-3 h-3" />
            </button>
          </div>
          {sessions.length === 0 ? (
            <div className="py-8 text-center">
              <Calendar className="w-10 h-10 text-slate-200 mx-auto mb-3" />
              <p className="text-sm text-slate-400 font-medium">No upcoming sessions</p>
              <p className="text-xs text-slate-300 mt-1">Set your schedule to accept bookings</p>
            </div>
          ) : (
            <div className="space-y-3">
              {sessions.slice(0, 5).map((session, idx) => (
                <div key={idx} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center shrink-0">
                    <Clock className="w-4 h-4 text-indigo-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-800 truncate">
                      {session.student?.name || 'Student'}
                    </p>
                    <p className="text-xs text-slate-400 font-medium">
                      {DAYS[session.dayOfWeek]} · {session.startTime} - {session.endTime}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pending Requests */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-black text-slate-900 tracking-tight">Pending Requests</h2>
            <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-lg">
              {requests.length} pending
            </span>
          </div>
          {requests.length === 0 ? (
            <div className="py-8 text-center">
              <Users className="w-10 h-10 text-slate-200 mx-auto mb-3" />
              <p className="text-sm text-slate-400 font-medium">No pending requests</p>
            </div>
          ) : (
            <div className="space-y-3">
              {requests.map(req => (
                <div key={req._id} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center shrink-0 overflow-hidden">
                    {req.mentee?.avatarUrl ? (
                      <img src={req.mentee.avatarUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-sm font-bold text-slate-500">
                        {(req.mentee?.name || 'U').charAt(0)}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-800 truncate">{req.mentee?.name}</p>
                    <p className="text-xs text-slate-400 font-medium">{req.skill}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MentorOverview;
