import React, { useState, useEffect, useCallback } from 'react';
import { mentorService } from '../services/api';
import {
  TrendingUp, TrendingDown, BookOpen, Users, Loader2, Star, BarChart3, Download, 
  AlertCircle, DollarSign, Clock, UserCheck, UserX, RefreshCw, Filter
} from 'lucide-react';
import { cn } from '../utils/cn';
import { 
  mockAnalyticsData, 
  calculateTrend, 
  formatCurrency, 
  formatNumber,
  exportToCSV 
} from '../data/mockAnalytics';

const periods = [
  { key: '7d', label: '7 Days' },
  { key: '30d', label: '30 Days' },
  { key: '90d', label: '90 Days' }
];

const dateGranularities = [
  { key: 'daily', label: 'Daily' },
  { key: 'weekly', label: 'Weekly' },
  { key: 'monthly', label: 'Monthly' }
];

const MetricCard = ({ title, value, trend, suffix = '', icon: Icon, colorClass }) => {
  const trendData = calculateTrend(trend?.current, trend?.previous);
  
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 hover:shadow-md transition-shadow duration-200">
      <div className="flex items-start justify-between mb-2">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{title}</p>
        <div className={cn("p-2 rounded-xl", colorClass)}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <p className="text-2xl font-black text-slate-900">
        {typeof value === 'number' && title.includes('Students') ? formatNumber(value) : value}
        {suffix}
      </p>
      {trend && (
        <div className={cn("flex items-center gap-1 mt-2 text-xs font-bold", trendData.isPositive ? "text-emerald-500" : "text-rose-500")}>
          {trendData.isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
          <span>{trendData.value}%</span>
          <span className="text-slate-400">vs prev period</span>
        </div>
      )}
    </div>
  );
};

const SimpleBarChart = ({ data, labelKey, valueKey, color = 'bg-indigo-500', showValue = true }) => {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center py-12" role="status" aria-label="No data available">
        <p className="text-sm text-slate-400 font-medium">No data available for this period</p>
      </div>
    );
  }
  
  const maxVal = Math.max(...data.map(d => d[valueKey]), 1);
  
  return (
    <div className="space-y-2" role="img" aria-label={`${labelKey} chart showing ${valueKey} over time`}>
      {data.map((item, idx) => (
        <div key={`${item[labelKey]}-${idx}`} className="flex items-center gap-3">
          <span className="text-[10px] font-bold text-slate-500 w-16 text-right truncate">{item[labelKey]}</span>
          <div className="flex-1 h-8 bg-slate-50 rounded-lg overflow-hidden">
            <div 
              className={cn("h-full rounded-lg transition-all flex items-center px-2", color)} 
              style={{ width: `${Math.max(8, (item[valueKey] / maxVal) * 100)}%` }}
              role="presentation"
            >
              {showValue && (
                <span className="text-[9px] font-black text-white truncate">
                  {item[valueKey] >= 1000 ? formatNumber(item[valueKey]) : item[valueKey]}
                </span>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

const DonutChart = ({ value, size = 128, strokeWidth = 12, centerContent }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;
  
  return (
    <div className="relative" style={{ width: size, height: size }} role="img" aria-label={`Completion rate: ${value}%`}>
      <svg className="w-full h-full transform -rotate-90">
        <circle 
          cx={size / 2} 
          cy={size / 2} 
          r={radius} 
          fill="none" 
          stroke="var(--color-slate-200)" 
          strokeWidth={strokeWidth} 
        />
        <circle 
          cx={size / 2} 
          cy={size / 2} 
          r={radius} 
          fill="none" 
          stroke="var(--color-indigo-500)" 
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-500 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        {centerContent}
      </div>
    </div>
  );
};

const RevenueBreakdown = ({ data }) => {
  if (!data) return null;
  
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between p-4 bg-gradient-to-r from-violet-50 to-indigo-50 rounded-xl">
        <div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Revenue</p>
          <p className="text-2xl font-black text-slate-900">{formatCurrency(data.total)}</p>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Avg/Student</p>
          <p className="text-lg font-bold text-slate-900">{formatCurrency(data.averagePerStudent)}</p>
        </div>
      </div>
      
      <div className="space-y-2">
        {data.byCourse.slice(0, 4).map((course, idx) => (
          <div key={`${course.name}-${idx}`} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: ['#6366f1', '#8b5cf6', '#a855f7', '#d946ef'][i] }} />
              <span className="text-sm font-medium text-slate-700">{course.name}</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm font-bold text-slate-900">{formatCurrency(course.amount)}</span>
              <span className="text-xs font-medium text-slate-400">{course.percentage}%</span>
            </div>
          </div>
        ))}
      </div>
      
      <div className="p-3 bg-amber-50 border border-amber-100 rounded-lg flex items-center justify-between">
        <span className="text-sm font-medium text-amber-700">Platform Average</span>
        <span className="text-sm font-bold text-amber-800">{formatCurrency(data.platformAverage)}/student</span>
      </div>
    </div>
  );
};

const EmptyState = ({ icon: Icon, title, description, action }) => (
  <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
    <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
      <Icon className="w-8 h-8 text-slate-400" />
    </div>
    <h3 className="text-lg font-bold text-slate-900 mb-2">{title}</h3>
    <p className="text-sm text-slate-500 mb-4 max-w-sm">{description}</p>
    {action}
  </div>
);

const ErrorState = ({ message, onRetry }) => (
  <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
    <div className="w-16 h-16 rounded-full bg-rose-100 flex items-center justify-center mb-4">
      <AlertCircle className="w-8 h-8 text-rose-500" />
    </div>
    <h3 className="text-lg font-bold text-slate-900 mb-2">Failed to Load Analytics</h3>
    <p className="text-sm text-slate-500 mb-4 max-w-sm">{message}</p>
    {onRetry && (
      <button 
        onClick={onRetry}
        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition-colors"
      >
        <RefreshCw className="w-4 h-4" />
        Try Again
      </button>
    )}
  </div>
);

const MentorAnalytics = () => {
  const [analytics, setAnalytics] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [period, setPeriod] = useState('30d');
  const [granularity, setGranularity] = useState('weekly');
  const [courseFilter, setCourseFilter] = useState('all');
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => { 
    loadAnalytics(); 
  }, [period]);

  const loadAnalytics = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const data = await mentorService.getAnalytics(period);
      setAnalytics(data);
    } catch (err) {
      console.log('Using mock data (backend not available)');
      setAnalytics(mockAnalyticsData[period]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = useCallback(async () => {
    if (!analytics) return;
    
    setIsExporting(true);
    try {
      exportToCSV(analytics, period);
    } catch (err) {
      console.error('Export failed:', err);
    } finally {
      setIsExporting(false);
    }
  }, [analytics, period]);

  const filteredCourseStats = useCallback(() => {
    if (!analytics?.courseStats) return [];
    if (courseFilter === 'all') return analytics.courseStats;
    return analytics.courseStats.filter(course => 
      course.title.toLowerCase().includes(courseFilter.toLowerCase())
    );
  }, [analytics, courseFilter]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24" role="status" aria-label="Loading analytics data">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
        <span className="sr-only">Loading analytics data...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-6xl mx-auto">
        <ErrorState message={error} onRetry={loadAnalytics} />
      </div>
    );
  }

  const summary = analytics?.summary || {};
  const trendStudents = {
    current: summary.totalStudents,
    previous: summary.previousPeriodStudents
  };
  const trendCompleted = {
    current: summary.completedStudents,
    previous: summary.previousPeriodCompleted
  };
  const trendCompletion = {
    current: summary.completionRate,
    previous: summary.previousPeriodCompletionRate
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Analytics</h1>
          <p className="text-sm text-slate-500 mt-1 font-medium">Track your course performance and student engagement</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          {/* Granularity Selector */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl">
            {dateGranularities.map(g => (
              <button
                key={g.key}
                onClick={() => setGranularity(g.key)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-bold transition-all",
                  granularity === g.key
                    ? "bg-white text-indigo-600 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                )}
              >
                {g.label}
              </button>
            ))}
          </div>
          
          {/* Period Selector */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl">
            {periods.map(p => (
              <button
                key={p.key}
                onClick={() => setPeriod(p.key)}
                className={cn(
                  "px-4 py-2 rounded-xl text-sm font-bold border transition-all",
                  period === p.key
                    ? "bg-white text-indigo-600 border-indigo-200 shadow-sm"
                    : "bg-transparent text-slate-500 border-transparent hover:border-slate-300"
                )}
              >
                {p.label}
              </button>
            ))}
          </div>
          
          {/* Export Button */}
          <button
            onClick={handleExport}
            disabled={isExporting}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold border transition-all",
              "bg-violet-50 text-violet-600 border-violet-200 hover:bg-violet-100",
              isExporting && "opacity-50 cursor-not-allowed"
            )}
          >
            <Download className={cn("w-4 h-4", isExporting && "animate-bounce")} />
            Export CSV
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Students"
          value={summary.totalStudents || 0}
          trend={trendStudents}
          icon={Users}
          colorClass="bg-indigo-100 text-indigo-600"
        />
        <MetricCard
          title="Completed"
          value={summary.completedStudents || 0}
          trend={trendCompleted}
          icon={UserCheck}
          colorClass="bg-emerald-100 text-emerald-600"
        />
        <MetricCard
          title="Completion Rate"
          value={summary.completionRate || 0}
          trend={trendCompletion}
          suffix="%"
          icon={BookOpen}
          colorClass="bg-amber-100 text-amber-600"
        />
        <MetricCard
          title="Total Courses"
          value={summary.totalCourses || 0}
          icon={BarChart3}
          colorClass="bg-violet-100 text-violet-600"
        />
      </div>

      {/* Engagement Metrics */}
      {analytics?.engagementMetrics && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-4 h-4 text-blue-500" />
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Avg Session</p>
            </div>
            <p className="text-xl font-black text-slate-900">{analytics.engagementMetrics.avgSessionDuration}</p>
          </div>
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <div className="flex items-center gap-2 mb-2">
              <UserCheck className="w-4 h-4 text-emerald-500" />
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Active Students</p>
            </div>
            <p className="text-xl font-black text-slate-900">{formatNumber(analytics.engagementMetrics.activeStudents)}</p>
          </div>
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <div className="flex items-center gap-2 mb-2">
              <UserX className="w-4 h-4 text-rose-500" />
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Churn Rate</p>
            </div>
            <p className="text-xl font-black text-slate-900">{analytics.engagementMetrics.churnRate}%</p>
          </div>
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-4 h-4 text-violet-500" />
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Returning</p>
            </div>
            <p className="text-xl font-black text-slate-900">{analytics.engagementMetrics.returningStudents}%</p>
          </div>
        </div>
      )}

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Student Growth */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <h3 className="font-black text-sm text-slate-900 mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-indigo-500" /> 
            <span>Student Growth</span>
            <span className="text-xs font-medium text-slate-400 ml-auto">{granularity}</span>
          </h3>
          <SimpleBarChart 
            data={analytics?.studentGrowth} 
            labelKey="month" 
            valueKey="students" 
            color="bg-indigo-500" 
          />
        </div>

        {/* Completion Donut */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <h3 className="font-black text-sm text-slate-900 mb-4 flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-emerald-500" /> 
            Course Completion
          </h3>
          <div className="flex items-center justify-center py-4">
            <DonutChart 
              value={analytics?.completionRate?.[0]?.value || 0}
              centerContent={
                <div className="text-center">
                  <span className="text-2xl font-black text-slate-900">
                    {analytics?.completionRate?.[0]?.value || 0}%
                  </span>
                </div>
              }
            />
          </div>
          <p className="text-xs text-slate-500 font-medium text-center mt-4">
            {formatNumber(analytics?.summary?.completedStudents || 0)} of {formatNumber(analytics?.summary?.totalStudents || 0)} students completed
          </p>
        </div>

        {/* Earnings Trend */}
        {analytics?.earningsTrend?.length > 0 && (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <h3 className="font-black text-sm text-slate-900 mb-4 flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-violet-500" /> 
              <span>Earnings Trend</span>
              <span className="text-xs font-medium text-slate-400 ml-auto">{granularity}</span>
            </h3>
            <SimpleBarChart 
              data={analytics.earningsTrend} 
              labelKey="month" 
              valueKey="earnings" 
              color="bg-violet-500"
            />
          </div>
        )}

        {/* Revenue Breakdown */}
        {analytics?.revenueBreakdown && (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <h3 className="font-black text-sm text-slate-900 mb-4 flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-amber-500" /> 
              Revenue Breakdown
            </h3>
            <RevenueBreakdown data={analytics.revenueBreakdown} />
          </div>
        )}
      </div>

      {/* Per-Course Stats */}
      {analytics?.courseStats?.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
            <h3 className="font-black text-sm text-slate-900 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-amber-500" /> 
              Per-Course Performance
            </h3>
            
            {/* Course Filter */}
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-400" />
              <select
                value={courseFilter}
                onChange={(e) => setCourseFilter(e.target.value)}
                className="px-3 py-2 text-sm font-medium text-slate-600 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option key="all-courses" value="all">All Courses</option>
                {analytics?.courseStats?.map(course => (
                  <option key={`course-${course.id}`} value={course.title?.toLowerCase() || ''}>
                    {course.title}
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="overflow-x-auto -mx-6 px-6">
            <table className="w-full text-left" role="table" aria-label="Course performance data">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pb-3">Course</th>
                  <th className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pb-3 text-center">Views</th>
                  <th className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pb-3 text-center">Enrolled</th>
                  <th className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pb-3 text-center">Completion</th>
                  <th className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pb-3 text-center">Rating</th>
                  <th className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pb-3 text-right">Revenue</th>
                </tr>
              </thead>
              <tbody>
                {filteredCourseStats().map((cs, idx) => (
                  <tr key={`${cs.id}-${idx}`} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-colors">
                    <td className="py-4 text-sm font-bold text-slate-800">{cs.title}</td>
                    <td className="py-4 text-sm font-medium text-slate-600 text-center">{formatNumber(cs.views)}</td>
                    <td className="py-4 text-sm font-medium text-slate-600 text-center">{formatNumber(cs.enrollments)}</td>
                    <td className="py-4 text-center">
                      <span className={cn(
                        "inline-flex px-2 py-1 rounded-md text-xs font-bold",
                        cs.completionRate >= 70 ? "bg-emerald-50 text-emerald-600" :
                        cs.completionRate >= 50 ? "bg-amber-50 text-amber-600" :
                        "bg-rose-50 text-rose-600"
                      )}>
                        {cs.completionRate}%
                      </span>
                    </td>
                    <td className="py-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Star className="w-4 h-4 text-amber-400 fill-amber-400" /> 
                        <span className="text-sm font-bold text-slate-700">{cs.rating.toFixed(1)}</span>
                      </div>
                    </td>
                    <td className="py-4 text-sm font-bold text-slate-800 text-right">{formatCurrency(cs.revenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Empty State */}
      {(!analytics || !analytics.courseStats?.length) && (
        <EmptyState
          icon={BarChart3}
          title="No Course Data Yet"
          description="Start creating courses to see your analytics data here. We'll track views, enrollments, and more."
        />
      )}
    </div>
  );
};

export default MentorAnalytics;