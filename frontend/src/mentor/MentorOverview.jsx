import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { mentorService, mentorshipService } from '../services/api';
import {
  Users, BookOpen, Star, TrendingUp, TrendingDown, Calendar,
  MessageCircle, Loader2, ArrowRight, Clock, DollarSign, BarChart3,
  Check, X, ChevronDown, ChevronUp, Activity, Target, Award,
  Zap, RefreshCw, Eye, GraduationCap, ExternalLink
} from 'lucide-react';
import { cn } from '../utils/cn';

// ─── Stat Card ────────────────────────────────────────────────────────────────

const StatCard = React.memo(({ icon: Icon, label, value, color, subValue, trend, trendLabel }) => (
  <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex items-center gap-4 hover:shadow-md transition-shadow">
    <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center", color)}>
      <Icon className="w-5 h-5 text-white" />
    </div>
    <div className="min-w-0">
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}</p>
      <p className="text-2xl font-black text-slate-900">{value}</p>
      <div className="flex items-center gap-2 mt-0.5">
        {subValue && <p className="text-[10px] font-bold text-slate-400">{subValue}</p>}
        {trend !== undefined && trend !== null && (
          <span className={cn(
            "inline-flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded-md",
            trend >= 0 ? "text-emerald-700 bg-emerald-50" : "text-rose-700 bg-rose-50"
          )}>
            {trend >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {Math.abs(trend)}%
          </span>
        )}
      </div>
    </div>
  </div>
));

// ─── Period Selector ──────────────────────────────────────────────────────────

const PERIODS = [
  { key: '7d', label: '7 Days' },
  { key: '30d', label: '30 Days' },
  { key: '90d', label: '90 Days' },
  { key: '180d', label: '6 Months' },
  { key: '365d', label: '1 Year' },
];

const PeriodSelector = ({ period, onPeriodChange }) => (
  <div className="flex items-center gap-2 flex-wrap">
    {PERIODS.map(p => (
      <button
        key={p.key}
        onClick={() => onPeriodChange(p.key)}
        className={cn(
          "px-3 py-1.5 rounded-lg text-xs font-bold border transition-all",
          period === p.key
            ? "bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-200"
            : "bg-white text-slate-500 border-slate-200 hover:border-indigo-300 hover:text-indigo-600"
        )}
      >
        {p.label}
      </button>
    ))}
  </div>
);

// ─── Enhanced Bar Chart ───────────────────────────────────────────────────────

const SimpleBarChart = React.memo(({ data, labelKey, valueKey, color = 'bg-indigo-500', formatValue, showGrid = true }) => {
  const [hoveredIndex, setHoveredIndex] = useState(null);

  if (!data || data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10">
        <BarChart3 className="w-8 h-8 text-slate-200 mb-2" />
        <p className="text-xs text-slate-400 font-medium">No data available for this period</p>
      </div>
    );
  }

  const maxVal = Math.max(...data.map(d => d[valueKey]), 1);
  const colorMap = {
    'bg-indigo-500': { bar: 'bg-indigo-500', hover: 'bg-indigo-600', light: 'bg-indigo-100' },
    'bg-emerald-500': { bar: 'bg-emerald-500', hover: 'bg-emerald-600', light: 'bg-emerald-100' },
    'bg-violet-500': { bar: 'bg-violet-500', hover: 'bg-violet-600', light: 'bg-violet-100' },
  };
  const colors = colorMap[color] || colorMap['bg-indigo-500'];

  const gridLines = [0.25, 0.5, 0.75, 1];

  return (
    <div className="relative">
      {/* Y-axis grid lines */}
      {showGrid && (
        <div className="absolute inset-0 flex flex-col justify-between pointer-events-none" style={{ top: 0, bottom: 24 }}>
          {gridLines.map((line, i) => (
            <div key={i} className="relative w-full">
              <div className="absolute w-full border-t border-dashed border-slate-100" />
              <span className="absolute right-full pr-2 text-[9px] text-slate-300 font-medium" style={{ top: -8 }}>
                {formatValue ? formatValue(Math.round(maxVal * line)) : Math.round(maxVal * line)}
              </span>
            </div>
          ))}
        </div>
      )}

      <div className="space-y-2.5 pt-4">
        {data.map((item, i) => {
          const pct = Math.max(4, (item[valueKey] / maxVal) * 100);
          const isHovered = hoveredIndex === i;
          return (
            <div
              key={i}
              className="flex items-center gap-3 group cursor-default"
              onMouseEnter={() => setHoveredIndex(i)}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              <span className="text-[10px] font-bold text-slate-500 w-14 text-right truncate">{item[labelKey]}</span>
              <div className="flex-1 relative">
                <div className="h-7 bg-slate-50 rounded-lg overflow-hidden border border-slate-100">
                  <div
                    className={cn(
                      "h-full rounded-lg transition-all duration-300 flex items-center justify-end px-2",
                      isHovered ? colors.hover : colors.bar
                    )}
                    style={{ width: `${pct}%` }}
                  >
                    <span className="text-[9px] font-black text-white drop-shadow-sm whitespace-nowrap">
                      {formatValue ? formatValue(item[valueKey]) : item[valueKey]}
                    </span>
                  </div>
                </div>

                {/* Tooltip */}
                {isHovered && (
                  <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] font-bold px-2.5 py-1.5 rounded-lg shadow-lg z-10 whitespace-nowrap">
                    <span className="font-black">{formatValue ? formatValue(item[valueKey]) : item[valueKey]}</span>
                    <span className="text-slate-300 ml-1">in {item[labelKey]}</span>
                    <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-t-[5px] border-t-slate-900" />
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
});

// ─── Donut Chart ──────────────────────────────────────────────────────────────

const DonutChart = React.memo(({ value, max = 100, color = '#8b5cf6', size = 120, strokeWidth = 12 }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / max) * circumference;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg className="transform -rotate-90" width={size} height={size}>
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none" stroke="#e2e8f0" strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none" stroke={color} strokeWidth={strokeWidth}
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-700 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-black text-slate-900">{value}%</span>
        <span className="text-[9px] font-bold text-slate-400 uppercase">Complete</span>
      </div>
    </div>
  );
});

// ─── Weekly Activity Heatmap ──────────────────────────────────────────────────

const DAYS_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const HOURS = ['6a', '8a', '10a', '12p', '2p', '4p', '6p', '8p', '10p'];

const ActivityHeatmap = React.memo(({ data }) => {
  if (!data || data.length === 0) return null;

  const maxVal = Math.max(...data.flat(), 1);

  const getColor = (val) => {
    if (val === 0) return 'bg-slate-50 border-slate-100';
    const intensity = val / maxVal;
    if (intensity < 0.25) return 'bg-indigo-100 border-indigo-200';
    if (intensity < 0.5) return 'bg-indigo-200 border-indigo-300';
    if (intensity < 0.75) return 'bg-indigo-400 border-indigo-400';
    return 'bg-indigo-600 border-indigo-600';
  };

  return (
    <div className="overflow-x-auto">
      <div className="inline-flex flex-col gap-0.5 min-w-fit">
        {/* Hour labels */}
        <div className="flex items-center gap-0.5 ml-8">
          {HOURS.map(h => (
            <div key={h} className="w-7 text-center">
              <span className="text-[8px] font-bold text-slate-400">{h}</span>
            </div>
          ))}
        </div>
        {/* Grid */}
        {DAYS_SHORT.map((day, dayIdx) => (
          <div key={day} className="flex items-center gap-0.5">
            <span className="text-[9px] font-bold text-slate-400 w-7 text-right pr-1">{day}</span>
            {(data[dayIdx] || []).map((val, hourIdx) => (
              <div
                key={hourIdx}
                className={cn(
                  "w-6 h-6 rounded border transition-colors",
                  getColor(val)
                )}
                title={`${day} ${HOURS[hourIdx]}: ${val} sessions`}
              />
            ))}
          </div>
        ))}
        {/* Legend */}
        <div className="flex items-center gap-1 mt-2 ml-8">
          <span className="text-[8px] font-bold text-slate-400">Less</span>
          {['bg-slate-50', 'bg-indigo-100', 'bg-indigo-200', 'bg-indigo-400', 'bg-indigo-600'].map((c, i) => (
            <div key={i} className={cn("w-3 h-3 rounded-sm border border-slate-200", c)} />
          ))}
          <span className="text-[8px] font-bold text-slate-400">More</span>
        </div>
      </div>
    </div>
  );
});

// ─── Request Card with Inline Actions ─────────────────────────────────────────

const RequestCard = React.memo(({ request, onAccept, onReject, actionLoading }) => {
  const isLoading = actionLoading === request._id;
  const [localStatus, setLocalStatus] = useState(null);

  const handleAccept = async () => {
    await onAccept(request._id);
    setLocalStatus('accepted');
  };

  const handleReject = async () => {
    await onReject(request._id);
    setLocalStatus('rejected');
  };

  if (localStatus === 'accepted') {
    return (
      <div className="flex items-center gap-3 p-3 rounded-xl bg-emerald-50 border border-emerald-200">
        <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
          <Check className="w-5 h-5 text-emerald-600" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-bold text-emerald-700">{request.mentee?.name} accepted</p>
          <p className="text-xs text-emerald-500">Mentorship started</p>
        </div>
      </div>
    );
  }

  if (localStatus === 'rejected') {
    return (
      <div className="flex items-center gap-3 p-3 rounded-xl bg-rose-50 border border-rose-200">
        <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center shrink-0">
          <X className="w-5 h-5 text-rose-600" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-bold text-rose-700">{request.mentee?.name} declined</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100 hover:border-slate-200 transition-colors">
      <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center shrink-0 overflow-hidden">
        {request.mentee?.avatarUrl ? (
          <img src={request.mentee.avatarUrl} alt="" className="w-full h-full object-cover" loading="lazy" />
        ) : (
          <span className="text-sm font-bold text-slate-500">{(request.mentee?.name || 'U').charAt(0).toUpperCase()}</span>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-slate-800 truncate">{request.mentee?.name}</p>
        <p className="text-xs text-slate-400 font-medium truncate">{request.skill}{request.message ? ` · ${request.message}` : ''}</p>
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        <button
          onClick={handleAccept}
          disabled={isLoading}
          className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center hover:bg-emerald-200 transition-colors disabled:opacity-50"
          title="Accept"
        >
          {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
        </button>
        <button
          onClick={handleReject}
          disabled={isLoading}
          className="w-8 h-8 rounded-lg bg-rose-100 text-rose-600 flex items-center justify-center hover:bg-rose-200 transition-colors disabled:opacity-50"
          title="Decline"
        >
          {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
});

// ─── Course Drill-down Modal ──────────────────────────────────────────────────

const CourseDetailModal = React.memo(({ course, onClose }) => {
  if (!course) return null;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 animate-scale-in"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-black text-slate-900 truncate pr-4">{course.title}</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center hover:bg-slate-200 transition-colors">
            <X className="w-4 h-4 text-slate-500" />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-5">
          <div className="bg-indigo-50 rounded-xl p-4 text-center">
            <Eye className="w-5 h-5 text-indigo-500 mx-auto mb-1" />
            <p className="text-xl font-black text-indigo-700">{course.views || 0}</p>
            <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-wider">Views</p>
          </div>
          <div className="bg-emerald-50 rounded-xl p-4 text-center">
            <GraduationCap className="w-5 h-5 text-emerald-500 mx-auto mb-1" />
            <p className="text-xl font-black text-emerald-700">{course.enrollments || 0}</p>
            <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider">Enrollments</p>
          </div>
          <div className="bg-violet-50 rounded-xl p-4 text-center">
            <Target className="w-5 h-5 text-violet-500 mx-auto mb-1" />
            <p className="text-xl font-black text-violet-700">{course.completionRate || 0}%</p>
            <p className="text-[10px] font-bold text-violet-500 uppercase tracking-wider">Completion</p>
          </div>
          <div className="bg-amber-50 rounded-xl p-4 text-center">
            <Star className="w-5 h-5 text-amber-500 mx-auto mb-1 fill-amber-400" />
            <p className="text-xl font-black text-amber-700">{course.rating?.toFixed(1) || '0.0'}</p>
            <p className="text-[10px] font-bold text-amber-500 uppercase tracking-wider">Rating</p>
          </div>
        </div>

        {/* Completion donut */}
        <div className="flex items-center justify-center mb-5">
          <DonutChart value={course.completionRate || 0} color="#8b5cf6" size={100} strokeWidth={10} />
        </div>

        <button
          onClick={() => window.location.assign(`/mentor-dashboard/courses`)}
          className="w-full flex items-center justify-center gap-2 px-5 py-3 bg-indigo-600 text-white text-sm font-bold rounded-xl hover:bg-indigo-700 transition-colors"
        >
          <ExternalLink className="w-4 h-4" /> View Full Course Details
        </button>
      </div>
    </div>
  );
});

// ─── This Week Summary ────────────────────────────────────────────────────────

const ThisWeekSummary = React.memo(({ stats, sessions }) => {
  const today = new Date();
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - today.getDay());
  startOfWeek.setHours(0, 0, 0, 0);

  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 7);

  const thisWeekSessions = useMemo(() => {
    if (!sessions || sessions.length === 0) return 0;
    return sessions.filter(s => {
      const sessionDate = new Date(s.date || s.startTime);
      return sessionDate >= startOfWeek && sessionDate < endOfWeek;
    }).length;
  }, [sessions]);

  const items = [
    { icon: Calendar, label: 'Sessions This Week', value: thisWeekSessions || sessions.length, color: 'text-indigo-600' },
    { icon: Users, label: 'Active Students', value: stats?.totalStudents || 0, color: 'text-emerald-600' },
    { icon: Zap, label: 'Response Rate', value: '95%', color: 'text-amber-600' },
    { icon: Award, label: 'Rating', value: stats?.rating?.toFixed(1) || '5.0', color: 'text-violet-600' },
  ];

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-black text-sm text-slate-900 flex items-center gap-2">
          <Activity className="w-4 h-4 text-indigo-500" /> This Week at a Glance
        </h3>
        <span className="text-[10px] font-bold text-slate-400 bg-slate-50 px-2 py-1 rounded-md">
          {startOfWeek.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – {new Date(endOfWeek.getTime() - 1).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
        </span>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {items.map((item, i) => (
          <div key={i} className="bg-slate-50 rounded-xl p-3 text-center border border-slate-100">
            <item.icon className={cn("w-4 h-4 mx-auto mb-1.5", item.color)} />
            <p className="text-lg font-black text-slate-900">{item.value}</p>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">{item.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
});

// ─── Main Component ───────────────────────────────────────────────────────────

const MentorOverview = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [requests, setRequests] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [period, setPeriod] = useState('30d');
  const [actionLoading, setActionLoading] = useState(null);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [showAllRequests, setShowAllRequests] = useState(false);
  const abortRef = useRef(null);

  const loadData = useCallback(async (showSpinner = true) => {
    // Cancel any in-flight requests
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    if (showSpinner) setIsLoading(true);
    else setIsRefreshing(true);

    try {
      const [statsData, sessionsData, requestsData] = await Promise.all([
        mentorService.getDashboardStats(),
        mentorService.getUpcomingSessions(),
        mentorshipService.getIncomingRequests()
      ]);

      if (controller.signal.aborted) return;

      setStats(statsData);
      setSessions(sessionsData || []);
      setRequests(requestsData || []);
    } catch (err) {
      if (err.name !== 'AbortError' && err.name !== 'CanceledError') {
        console.error('Failed to load overview data', err);
      }
    } finally {
      if (showSpinner) setIsLoading(false);
      else setIsRefreshing(false);
    }
  }, []);

  const loadAnalytics = useCallback(async () => {
    try {
      const data = await mentorService.getAnalytics(period);
      setAnalytics(data);
    } catch (err) {
      console.error('Failed to load analytics', err);
    }
  }, [period]);

  useEffect(() => {
    loadData(true);
    return () => {
      if (abortRef.current) abortRef.current.abort();
    };
  }, [loadData]);

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  const handleAcceptRequest = useCallback(async (requestId) => {
    setActionLoading(requestId);
    try {
      await mentorshipService.acceptRequest(requestId);
      setRequests(prev => prev.filter(r => r._id !== requestId));
    } catch (err) {
      console.error('Failed to accept request', err);
    } finally {
      setActionLoading(null);
    }
  }, []);

  const handleRejectRequest = useCallback(async (requestId) => {
    setActionLoading(requestId);
    try {
      await mentorshipService.rejectRequest(requestId);
      setRequests(prev => prev.filter(r => r._id !== requestId));
    } catch (err) {
      console.error('Failed to reject request', err);
    } finally {
      setActionLoading(null);
    }
  }, []);

  const handlePeriodChange = useCallback((newPeriod) => {
    setPeriod(newPeriod);
  }, []);

  const handleRefresh = useCallback(() => {
    loadData(false);
    loadAnalytics();
  }, [loadData, loadAnalytics]);

  const displayedRequests = useMemo(() => {
    return showAllRequests ? requests : requests.slice(0, 5);
  }, [requests, showAllRequests]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-32">
        <Loader2 className="w-10 h-10 text-indigo-600 animate-spin mb-3" />
        <p className="text-sm text-slate-400 font-medium">Loading your dashboard...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Dashboard Overview</h1>
          <p className="text-sm text-slate-500 mt-1 font-medium">Welcome back! Here's how your mentorship is going.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-slate-500 border border-slate-200 hover:border-indigo-300 hover:text-indigo-600 transition-all disabled:opacity-50"
          >
            <RefreshCw className={cn("w-3.5 h-3.5", isRefreshing && "animate-spin")} />
            Refresh
          </button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={Users}
          label="Total Students"
          value={stats?.totalStudents || 0}
          color="bg-indigo-600"
          subValue={`${stats?.pendingRequests || 0} pending`}
          trend={stats?.studentsTrend}
        />
        <StatCard
          icon={Calendar}
          label="Active Sessions"
          value={stats?.activeSessions || 0}
          color="bg-emerald-600"
          subValue={`${stats?.totalCourses || 0} courses`}
          trend={stats?.sessionsTrend}
        />
        <StatCard
          icon={Star}
          label="Rating"
          value={stats?.rating?.toFixed(1) || '5.0'}
          color="bg-amber-500"
          subValue={`${stats?.totalReviews || 0} reviews`}
        />
        <StatCard
          icon={DollarSign}
          label="Total Earnings"
          value={`$${(stats?.totalEarnings || 0).toLocaleString()}`}
          color="bg-violet-600"
          trend={stats?.earningsTrend}
        />
      </div>

      {/* This Week Summary + Activity Heatmap */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ThisWeekSummary stats={stats} sessions={sessions} />

        {/* Activity Heatmap */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <h3 className="font-black text-sm text-slate-900 mb-4 flex items-center gap-2">
            <Clock className="w-4 h-4 text-indigo-500" /> Session Activity Heatmap
          </h3>
          {analytics?.activityHeatmap ? (
            <ActivityHeatmap data={analytics.activityHeatmap} />
          ) : (
            <div className="flex flex-col items-center justify-center py-8">
              <Clock className="w-8 h-8 text-slate-200 mb-2" />
              <p className="text-xs text-slate-400 font-medium">Activity heatmap will appear with more session data</p>
            </div>
          )}
        </div>
      </div>

      {/* Period Selector + Analytics */}
      <div className="space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h2 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-indigo-500" /> Analytics
          </h2>
          <PeriodSelector period={period} onPeriodChange={handlePeriodChange} />
        </div>

        {analytics ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Student Growth */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-black text-sm text-slate-900 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-indigo-500" /> Student Growth
                </h3>
                {analytics.studentGrowth?.length > 0 && (
                  <span className="text-[10px] font-bold text-slate-400">
                    {analytics.studentGrowth.length} data points
                  </span>
                )}
              </div>
              <SimpleBarChart
                data={analytics.studentGrowth}
                labelKey="month"
                valueKey="students"
                color="bg-indigo-500"
              />
            </div>

            {/* Earnings Trend */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-black text-sm text-slate-900 flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-emerald-500" /> Earnings Trend
                </h3>
                {analytics.earningsTrend?.length > 0 && (
                  <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
                    Total: ${analytics.earningsTrend.reduce((s, e) => s + (e.earnings || 0), 0).toLocaleString()}
                  </span>
                )}
              </div>
              <SimpleBarChart
                data={analytics.earningsTrend}
                labelKey="month"
                valueKey="earnings"
                color="bg-emerald-500"
                formatValue={v => `$${v.toLocaleString()}`}
              />
            </div>

            {/* Course Completion Donut */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
              <h3 className="font-black text-sm text-slate-900 mb-4 flex items-center gap-2">
                <Target className="w-4 h-4 text-violet-500" /> Course Completion Rate
              </h3>
              <div className="flex items-center gap-6">
                <div className="shrink-0">
                  <DonutChart value={analytics.completionRate?.[0]?.value || 0} color="#8b5cf6" />
                </div>
                <div className="space-y-3 flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-500">Completed</span>
                    <span className="text-sm font-black text-slate-900">{analytics.summary?.completedStudents || 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-500">In Progress</span>
                    <span className="text-sm font-black text-slate-900">
                      {(analytics.summary?.totalStudents || 0) - (analytics.summary?.completedStudents || 0)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-500">Total Students</span>
                    <span className="text-sm font-black text-slate-900">{analytics.summary?.totalStudents || 0}</span>
                  </div>
                  {/* Progress bar */}
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-violet-500 rounded-full transition-all duration-500"
                      style={{ width: `${analytics.completionRate?.[0]?.value || 0}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Per-Course Analytics with Drill-down */}
            {analytics.courseStats?.length > 0 && (
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                <h3 className="font-black text-sm text-slate-900 mb-4 flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-amber-500" /> Per-Course Analytics
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-slate-100">
                        <th className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pb-2 pr-4">Course</th>
                        <th className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pb-2 text-center px-2">Views</th>
                        <th className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pb-2 text-center px-2">Enrollments</th>
                        <th className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pb-2 text-center px-2">Completion</th>
                        <th className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pb-2 text-center px-2">Rating</th>
                        <th className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pb-2 text-center w-10"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {analytics.courseStats.map((cs, i) => (
                        <tr
                          key={cs._id || i}
                          className="border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-colors cursor-pointer group"
                          onClick={() => setSelectedCourse(cs)}
                        >
                          <td className="py-3 pr-4">
                            <p className="text-sm font-bold text-slate-800 truncate max-w-[180px]">{cs.title}</p>
                          </td>
                          <td className="py-3 text-sm font-medium text-slate-600 text-center px-2">{(cs.views || 0).toLocaleString()}</td>
                          <td className="py-3 text-sm font-medium text-slate-600 text-center px-2">{cs.enrollments || 0}</td>
                          <td className="py-3 text-center px-2">
                            <span className={cn(
                              "inline-block px-2 py-0.5 rounded-md text-[11px] font-bold",
                              cs.completionRate >= 70 ? "bg-emerald-50 text-emerald-600" :
                              cs.completionRate >= 40 ? "bg-amber-50 text-amber-600" :
                              "bg-rose-50 text-rose-600"
                            )}>
                              {cs.completionRate || 0}%
                            </span>
                          </td>
                          <td className="py-3 text-sm font-medium text-slate-600 text-center px-2">
                            <span className="inline-flex items-center gap-1">
                              <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                              {cs.rating?.toFixed(1) || '0.0'}
                            </span>
                          </td>
                          <td className="py-3 text-center">
                            <ChevronDown className="w-4 h-4 text-slate-300 group-hover:text-indigo-500 transition-colors mx-auto" />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-12 text-center">
            <BarChart3 className="w-10 h-10 text-slate-200 mx-auto mb-3" />
            <p className="text-sm text-slate-400 font-medium">Analytics data is loading...</p>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <h2 className="text-lg font-black text-slate-900 tracking-tight mb-4">Quick Actions</h2>
        <div className="flex flex-wrap gap-3">
          {[
            { icon: BookOpen, label: 'Create Course', path: '/mentor-dashboard/courses', primary: true },
            { icon: Calendar, label: 'Update Schedule', path: '/mentor-dashboard/schedule' },
            { icon: MessageCircle, label: 'View Messages', path: '/messages' },
            { icon: Users, label: 'View Students', path: '/mentor-dashboard/students' },
            { icon: DollarSign, label: 'Earnings', path: '/mentor-dashboard/earnings' },
          ].map((action, i) => (
            <button
              key={i}
              onClick={() => navigate(action.path)}
              className={cn(
                "flex items-center gap-2 px-5 py-2.5 text-sm font-bold rounded-xl transition-all active:scale-95",
                action.primary
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-200 hover:bg-indigo-700"
                  : "bg-slate-50 text-slate-600 border border-slate-200 hover:border-indigo-300 hover:text-indigo-600"
              )}
            >
              <action.icon className="w-4 h-4" /> {action.label}
            </button>
          ))}
        </div>
      </div>

      {/* Sessions & Requests */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Sessions */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-black text-slate-900 tracking-tight">Upcoming Sessions</h2>
            <button onClick={() => navigate('/mentor-dashboard/schedule')} className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1">
              View All <ArrowRight className="w-3 h-3" />
            </button>
          </div>
          {sessions.length === 0 ? (
            <div className="py-10 text-center">
              <Calendar className="w-10 h-10 text-slate-200 mx-auto mb-3" />
              <p className="text-sm text-slate-400 font-medium">No upcoming sessions</p>
              <p className="text-xs text-slate-300 mt-1">Set your schedule to accept bookings</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {sessions.slice(0, 5).map((session, idx) => (
                <div key={idx} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100 hover:border-slate-200 transition-colors">
                  <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center shrink-0">
                    <Clock className="w-4 h-4 text-indigo-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-800 truncate">{session.student?.name || 'Student'}</p>
                    <p className="text-xs text-slate-400 font-medium">
                      {DAYS_SHORT[session.dayOfWeek]} &middot; {session.startTime} – {session.endTime}
                    </p>
                  </div>
                  {session.course && (
                    <span className="text-[9px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md truncate max-w-[100px]">
                      {session.course}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pending Requests with Inline Actions */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-black text-slate-900 tracking-tight">Pending Requests</h2>
            <div className="flex items-center gap-2">
              {requests.length > 0 && (
                <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-lg">
                  {requests.length} pending
                </span>
              )}
              {requests.length > 5 && (
                <button
                  onClick={() => setShowAllRequests(!showAllRequests)}
                  className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-0.5"
                >
                  {showAllRequests ? 'Show Less' : 'View All'}
                  {showAllRequests ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                </button>
              )}
            </div>
          </div>
          {requests.length === 0 ? (
            <div className="py-10 text-center">
              <Users className="w-10 h-10 text-slate-200 mx-auto mb-3" />
              <p className="text-sm text-slate-400 font-medium">No pending requests</p>
              <p className="text-xs text-slate-300 mt-1">New mentorship requests will appear here</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {displayedRequests.map(req => (
                <RequestCard
                  key={req._id}
                  request={req}
                  onAccept={handleAcceptRequest}
                  onReject={handleRejectRequest}
                  actionLoading={actionLoading}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Course Detail Modal */}
      {selectedCourse && (
        <CourseDetailModal course={selectedCourse} onClose={() => setSelectedCourse(null)} />
      )}
    </div>
  );
};

export default MentorOverview;
