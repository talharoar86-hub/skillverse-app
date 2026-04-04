import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/axiosClient';
import {
  DollarSign, Loader2, TrendingUp, BookOpen, Calendar,
  ChevronLeft, ChevronRight, Download, Search, Filter,
  Wallet, CreditCard, ArrowUpRight, ArrowDownRight,
  Users, BarChart3, PieChart, Search as SearchIcon,
  X, Building, CreditCard as CardIcon, Bitcoin, Clock
} from 'lucide-react';
import { cn } from '../utils/cn';

const periods = [
  { key: '7d', label: '7 Days' },
  { key: '30d', label: '30 Days' },
  { key: '90d', label: '90 Days' },
  { key: 'all', label: 'All Time' }
];

const currencies = ['USD', 'EUR', 'GBP', 'CAD', 'AUD'];
const payoutMethods = [
  { id: 'bank_transfer', label: 'Bank Transfer', icon: Building },
  { id: 'paypal', label: 'PayPal', icon: CreditCard },
  { id: 'stripe', label: 'Stripe', icon: CardIcon },
  { id: 'crypto', label: 'Crypto', icon: Bitcoin }
];

const MentorEarnings = () => {
  const [data, setData] = useState(null);
  const [wallet, setWallet] = useState(null);
  const [payouts, setPayouts] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [period, setPeriod] = useState('30d');
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [sourceFilter, setSourceFilter] = useState('');
  const [activeTab, setActiveTab] = useState('earnings');
  const [showPayoutModal, setShowPayoutModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [payoutAmount, setPayoutAmount] = useState('');
  const [payoutMethod, setPayoutMethod] = useState('bank_transfer');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadEarnings = useCallback(async () => {
    try {
      const params = { period, page, limit: 20 };
      if (search) params.search = search;
      if (sourceFilter) params.source = sourceFilter;
      const { data: result } = await api.get('/mentor/earnings', { params });
      setData(result);
    } catch (err) {
      console.error('Failed to load earnings', err);
    } finally {
      setIsLoading(false);
    }
  }, [period, page, search, sourceFilter]);

  const loadAnalytics = useCallback(async () => {
    try {
      const { data: result } = await api.get('/mentor/earnings/analytics', { params: { period } });
      setAnalytics(result);
    } catch (err) {
      console.error('Failed to load analytics', err);
    }
  }, [period]);

  const loadWallet = useCallback(async () => {
    try {
      const { data: result } = await api.get('/mentor/wallet');
      setWallet(result);
    } catch (err) {
      console.error('Failed to load wallet', err);
    }
  }, []);

  const loadPayouts = useCallback(async () => {
    try {
      const { data: result } = await api.get('/mentor/payouts');
      setPayouts(result.payouts || []);
    } catch (err) {
      console.error('Failed to load payouts', err);
    }
  }, []);

  useEffect(() => {
    setPage(1);
  }, [period, search, sourceFilter]);

  useEffect(() => {
    loadEarnings();
  }, [loadEarnings]);

  useEffect(() => {
    if (!isLoading) {
      loadAnalytics();
      loadWallet();
      loadPayouts();
    }
  }, [period, isLoading]);

  const handleExport = async (type = 'earnings') => {
    try {
      const response = await api.get('/mentor/payouts/export', {
        params: { period, type },
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${type}_${period}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error('Export failed', err);
    }
  };

  const handlePayoutRequest = async () => {
    if (!payoutAmount || parseFloat(payoutAmount) <= 0) return;
    setIsSubmitting(true);
    try {
      await api.post('/mentor/payout/request', {
        amount: parseFloat(payoutAmount),
        method: payoutMethod
      });
      setShowPayoutModal(false);
      setPayoutAmount('');
      loadWallet();
      loadPayouts();
    } catch (err) {
      console.error('Payout request failed', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateWalletSettings = async () => {
    try {
      await api.put('/mentor/wallet/settings', {
        payoutSettings: wallet?.payoutSettings,
        payoutPreferences: wallet?.payoutPreferences
      });
      setShowSettingsModal(false);
    } catch (err) {
      console.error('Update settings failed', err);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
      </div>
    );
  }

  const totalEarnings = (data?.summary?.course?.total || 0) + (data?.summary?.mentorship?.total || 0);
  const growth = analytics?.summary?.growthPercent || 0;
  const isPositiveGrowth = growth >= 0;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Earnings</h1>
          <p className="text-sm text-slate-500 mt-1 font-medium">Track your revenue, analytics, and payouts.</p>
        </div>
        <div className="flex gap-2">
          {periods.map(p => (
            <button
              key={p.key}
              onClick={() => setPeriod(p.key)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-bold border transition-all",
                period === p.key
                  ? "bg-indigo-50 text-indigo-600 border-indigo-200"
                  : "bg-white text-slate-500 border-slate-200 hover:border-slate-300"
              )}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-1 border-b border-slate-200">
        {[
          { id: 'earnings', label: 'Earnings', icon: DollarSign },
          { id: 'analytics', label: 'Analytics', icon: BarChart3 },
          { id: 'payouts', label: 'Payouts', icon: Wallet }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex items-center gap-2 px-4 py-3 text-sm font-bold border-b-2 transition-all",
              activeTab === tab.id
                ? "border-indigo-600 text-indigo-600"
                : "border-transparent text-slate-500 hover:text-slate-700"
            )}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* EARNINGS TAB */}
      {activeTab === 'earnings' && (
        <>
          {/* Wallet Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-violet-600 flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-white" />
                </div>
                {period !== 'all' && (
                  <div className={cn(
                    "flex items-center gap-1 text-xs font-bold",
                    isPositiveGrowth ? "text-emerald-600" : "text-red-600"
                  )}>
                    {isPositiveGrowth ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                    {Math.abs(growth)}%
                  </div>
                )}
              </div>
              <p className="text-2xl font-black text-slate-900">${(analytics?.summary?.totalEarnings || 0).toFixed(2)}</p>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Total Earnings</p>
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center">
                  <Wallet className="w-5 h-5 text-white" />
                </div>
              </div>
              <p className="text-2xl font-black text-slate-900">${(wallet?.availableBalance || 0).toFixed(2)}</p>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Available Balance</p>
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500 flex items-center justify-center">
                  <CreditCard className="w-5 h-5 text-white" />
                </div>
              </div>
              <p className="text-2xl font-black text-slate-900">${(wallet?.pendingBalance || 0).toFixed(2)}</p>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Pending</p>
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center">
                  <Users className="w-5 h-5 text-white" />
                </div>
              </div>
              <p className="text-2xl font-black text-slate-900">{(analytics?.summary?.transactionCount || 0)}</p>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Transactions</p>
            </div>
          </div>

          {/* Source Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Course Revenue</p>
                  <p className="text-xl font-black text-slate-900">${(data?.summary?.course?.total || 0).toFixed(2)}</p>
                </div>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500 font-medium">{data?.summary?.course?.count || 0} transactions</span>
                <span className="text-slate-400 font-medium">
                  {analytics?.sourceBreakdown?.course?.percent || 0}%
                </span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full mt-2 overflow-hidden">
                <div
                  className="h-full bg-indigo-600 rounded-full transition-all"
                  style={{ width: `${analytics?.sourceBreakdown?.course?.percent || 0}%` }}
                />
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Mentorship Revenue</p>
                  <p className="text-xl font-black text-slate-900">${(data?.summary?.mentorship?.total || 0).toFixed(2)}</p>
                </div>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500 font-medium">{data?.summary?.mentorship?.count || 0} sessions</span>
                <span className="text-slate-400 font-medium">
                  {analytics?.sourceBreakdown?.mentorship?.percent || 0}%
                </span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full mt-2 overflow-hidden">
                <div
                  className="h-full bg-emerald-600 rounded-full transition-all"
                  style={{ width: `${analytics?.sourceBreakdown?.mentorship?.percent || 0}%` }}
                />
              </div>
            </div>
          </div>

          {/* Trend Chart */}
          {analytics?.trend?.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
              <h3 className="font-black text-sm text-slate-900 mb-4 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-indigo-500" /> Earnings Trend
              </h3>
              <div className="space-y-2">
                {analytics.trend.slice(-14).map((item, i) => {
                  const maxVal = Math.max(...analytics.trend.map(d => d.amount), 1);
                  return (
                    <div key={i} className="flex items-center gap-3">
                      <span className="text-[10px] font-bold text-slate-500 w-20 text-right truncate">
                        {new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                      <div className="flex-1 h-6 bg-slate-100 rounded-lg overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 rounded-lg transition-all flex items-center px-2"
                          style={{ width: `${Math.max(5, (item.amount / maxVal) * 100)}%` }}
                        >
                          <span className="text-[9px] font-black text-white">${item.amount.toFixed(0)}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Search & Filter */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
            <div className="flex flex-wrap gap-3 items-center">
              <div className="flex-1 min-w-[200px] relative">
                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by student or course..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 text-sm font-medium focus:outline-none focus:border-indigo-500"
                />
              </div>
              <select
                value={sourceFilter}
                onChange={(e) => setSourceFilter(e.target.value)}
                className="px-3 py-2 rounded-lg border border-slate-200 text-sm font-medium focus:outline-none focus:border-indigo-500"
              >
                <option value="">All Sources</option>
                <option value="course">Course</option>
                <option value="mentorship">Mentorship</option>
              </select>
              <button
                onClick={() => handleExport('earnings')}
                className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-sm font-bold text-slate-700 transition-all"
              >
                <Download className="w-4 h-4" /> Export
              </button>
            </div>
          </div>

          {/* Transaction History */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-black text-sm text-slate-900">Transaction History</h3>
              <span className="text-xs text-slate-400 font-medium">{data?.total || 0} total</span>
            </div>
            {data?.earnings?.length === 0 ? (
              <div className="py-12 text-center">
                <DollarSign className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                <p className="text-sm text-slate-400 font-medium">No transactions in this period</p>
              </div>
            ) : (
              <>
                <div className="divide-y divide-slate-50">
                  {data?.earnings?.map(earning => (
                    <div key={earning._id} className="flex items-center gap-4 px-5 py-3.5">
                      <div className={cn(
                        "w-9 h-9 rounded-xl flex items-center justify-center shrink-0",
                        earning.source === 'course' ? "bg-indigo-50 text-indigo-600" : "bg-emerald-50 text-emerald-600"
                      )}>
                        {earning.source === 'course' ? <BookOpen className="w-4 h-4" /> : <Calendar className="w-4 h-4" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-slate-800">
                          {earning.courseTitle || (earning.source === 'course' ? 'Course Enrollment' : 'Mentorship Session')}
                        </p>
                        <p className="text-[11px] text-slate-400 truncate">
                          {earning.studentName || 'Student'} • {new Date(earning.createdAt).toLocaleDateString('en-US', {
                            year: 'numeric', month: 'short', day: 'numeric'
                          })}
                        </p>
                      </div>
                      <p className="text-sm font-black text-emerald-600">+${earning.amount.toFixed(2)}</p>
                    </div>
                  ))}
                </div>

                {data?.totalPages > 1 && (
                  <div className="flex items-center justify-center gap-3 p-4 border-t border-slate-100">
                    <button
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 disabled:opacity-30 transition-all"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="text-sm font-bold text-slate-600">{page} / {data.totalPages}</span>
                    <button
                      onClick={() => setPage(p => Math.min(data.totalPages, p + 1))}
                      disabled={page === data.totalPages}
                      className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 disabled:opacity-30 transition-all"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </>
      )}

      {/* ANALYTICS TAB */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          {/* Comparison Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">vs Previous Period</p>
              <div className={cn(
                "text-2xl font-black",
                isPositiveGrowth ? "text-emerald-600" : "text-red-600"
              )}>
                {isPositiveGrowth ? '+' : ''}{growth}%
              </div>
              <p className="text-xs text-slate-400 mt-1">
                ${(analytics?.summary?.previousPeriodEarnings || 0).toFixed(2)} → ${(analytics?.summary?.totalEarnings || 0).toFixed(2)}
              </p>
            </div>
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Avg per Transaction</p>
              <p className="text-2xl font-black text-slate-900">
                ${(analytics?.summary?.avgPerTransaction || 0).toFixed(2)}
              </p>
            </div>
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Total Transactions</p>
              <p className="text-2xl font-black text-slate-900">
                {analytics?.summary?.transactionCount || 0}
              </p>
            </div>
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Total Students</p>
              <p className="text-2xl font-black text-slate-900">
                {(analytics?.topStudents?.length || 0) + (analytics?.topCourses?.length || 0)}
              </p>
            </div>
          </div>

          {/* Top Courses */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <h3 className="font-black text-sm text-slate-900 mb-4 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-indigo-500" /> Top Performing Courses
            </h3>
            {analytics?.topCourses?.length > 0 ? (
              <div className="space-y-3">
                {analytics.topCourses.map((course, i) => (
                  <div key={i} className="flex items-center gap-4 p-3 bg-slate-50 rounded-xl">
                    <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 text-xs font-bold flex items-center justify-center">
                      {i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-slate-800 truncate">{course.courseTitle || 'Untitled'}</p>
                      <p className="text-xs text-slate-400">{course.count} transactions</p>
                    </div>
                    <p className="text-sm font-black text-emerald-600">${course.total.toFixed(2)}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-400 text-center py-4">No course earnings yet</p>
            )}
          </div>

          {/* Top Students */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <h3 className="font-black text-sm text-slate-900 mb-4 flex items-center gap-2">
              <Users className="w-4 h-4 text-emerald-500" /> Top Spending Students
            </h3>
            {analytics?.topStudents?.length > 0 ? (
              <div className="space-y-3">
                {analytics.topStudents.map((student, i) => (
                  <div key={i} className="flex items-center gap-4 p-3 bg-slate-50 rounded-xl">
                    <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-600 text-xs font-bold flex items-center justify-center">
                      {i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-slate-800 truncate">{student.studentName || 'Anonymous'}</p>
                      <p className="text-xs text-slate-400">{student.count} transactions</p>
                    </div>
                    <p className="text-sm font-black text-emerald-600">${student.total.toFixed(2)}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-400 text-center py-4">No student data yet</p>
            )}
          </div>
        </div>
      )}

      {/* PAYOUTS TAB */}
      {activeTab === 'payouts' && (
        <div className="space-y-6">
          {/* Wallet Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gradient-to-br from-indigo-600 to-violet-700 rounded-2xl shadow-sm p-6 text-white">
              <div className="flex items-center justify-between mb-4">
                <Wallet className="w-8 h-8 opacity-80" />
                <span className="text-xs font-bold bg-white/20 px-2 py-1 rounded-full">Available</span>
              </div>
              <p className="text-3xl font-black">${(wallet?.availableBalance || 0).toFixed(2)}</p>
              <p className="text-sm text-white/70 mt-1">{wallet?.currency || 'USD'}</p>
              <div className="flex gap-2 mt-4">
                <button
                  onClick={() => setShowPayoutModal(true)}
                  disabled={!wallet?.availableBalance || wallet.availableBalance < 50}
                  className="flex-1 py-2 bg-white text-indigo-600 rounded-lg text-sm font-bold hover:bg-white/90 transition-all disabled:opacity-50"
                >
                  Request Payout
                </button>
                <button
                  onClick={() => setShowSettingsModal(true)}
                  className="px-4 py-2 bg-white/20 rounded-lg text-sm font-bold hover:bg-white/30 transition-all"
                >
                  Settings
                </button>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
              <h4 className="font-black text-sm text-slate-900 mb-4">Wallet Summary</h4>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-slate-500">Total Earned</span>
                  <span className="text-sm font-bold text-slate-900">${(wallet?.totalEarned || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-slate-500">Total Payouts</span>
                  <span className="text-sm font-bold text-slate-900">${(wallet?.totalPayout || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-slate-500">Pending</span>
                  <span className="text-sm font-bold text-amber-600">${(wallet?.pendingBalance || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-slate-500">Min Payout</span>
                  <span className="text-sm font-bold text-slate-900">${wallet?.payoutPreferences?.minPayoutAmount || 50}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Payout History */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-black text-sm text-slate-900">Payout History</h3>
              <button onClick={() => handleExport('payouts')} className="text-xs text-indigo-600 font-bold hover:underline">
                Export
              </button>
            </div>
            {payouts.length === 0 ? (
              <div className="py-12 text-center">
                <Wallet className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                <p className="text-sm text-slate-400 font-medium">No payouts yet</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-50">
                {payouts.map(payout => (
                  <div key={payout._id} className="flex items-center gap-4 px-5 py-4">
                    <div className={cn(
                      "w-9 h-9 rounded-xl flex items-center justify-center shrink-0",
                      payout.status === 'completed' ? "bg-emerald-50 text-emerald-600" :
                      payout.status === 'pending' ? "bg-amber-50 text-amber-600" :
                      payout.status === 'processing' ? "bg-blue-50 text-blue-600" :
                      "bg-red-50 text-red-600"
                    )}>
                      {payout.status === 'completed' ? <ArrowUpRight className="w-4 h-4" /> :
                       payout.status === 'pending' ? <Clock className="w-4 h-4" /> :
                       <CreditCard className="w-4 h-4" />}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-bold text-slate-800">
                        {payout.method === 'bank_transfer' ? 'Bank Transfer' :
                         payout.method === 'paypal' ? 'PayPal' :
                         payout.method === 'stripe' ? 'Stripe' : 'Crypto'}
                      </p>
                      <p className="text-[11px] text-slate-400">
                        {new Date(payout.createdAt).toLocaleDateString('en-US', {
                          year: 'numeric', month: 'short', day: 'numeric'
                        })}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-black text-slate-900">-${payout.amount.toFixed(2)}</p>
                      <p className={cn(
                        "text-[11px] font-bold uppercase",
                        payout.status === 'completed' ? "text-emerald-600" :
                        payout.status === 'pending' ? "text-amber-600" :
                        payout.status === 'processing' ? "text-blue-600" :
                        "text-red-600"
                      )}>{payout.status}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Payout Modal */}
      {showPayoutModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-black text-lg text-slate-900">Request Payout</h3>
              <button onClick={() => setShowPayoutModal(false)} className="p-1 hover:bg-slate-100 rounded-lg">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            <div className="mb-4">
              <p className="text-sm text-slate-500 mb-2">Available Balance</p>
              <p className="text-2xl font-black text-emerald-600">${(wallet?.availableBalance || 0).toFixed(2)}</p>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-bold text-slate-700 mb-2">Amount</label>
              <input
                type="number"
                value={payoutAmount}
                onChange={(e) => setPayoutAmount(e.target.value)}
                placeholder="Enter amount"
                max={wallet?.availableBalance}
                className="w-full px-4 py-3 rounded-lg border border-slate-200 font-bold focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div className="mb-6">
              <label className="block text-sm font-bold text-slate-700 mb-2">Method</label>
              <div className="grid grid-cols-2 gap-2">
                {payoutMethods.map(method => (
                  <button
                    key={method.id}
                    onClick={() => setPayoutMethod(method.id)}
                    className={cn(
                      "flex items-center gap-2 p-3 rounded-xl border transition-all",
                      payoutMethod === method.id
                        ? "border-indigo-600 bg-indigo-50 text-indigo-600"
                        : "border-slate-200 text-slate-600 hover:border-slate-300"
                    )}
                  >
                    <method.icon className="w-4 h-4" />
                    <span className="text-sm font-bold">{method.label}</span>
                  </button>
                ))}
              </div>
            </div>
            <button
              onClick={handlePayoutRequest}
              disabled={isSubmitting || !payoutAmount || parseFloat(payoutAmount) < 50}
              className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all disabled:opacity-50"
            >
              {isSubmitting ? 'Processing...' : 'Request Payout'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MentorEarnings;