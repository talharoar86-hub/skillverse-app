import React, { Suspense, useState } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import LearnSidebar from './LearnSidebar';
import Topbar from '../components/Topbar';
import ErrorBoundary from '../components/ErrorBoundary';

const TabSkeleton = () => (
  <div className="space-y-6 animate-pulse">
    <div className="h-8 w-48 bg-slate-200 rounded-xl" />
    <div className="h-4 w-96 bg-slate-200 rounded-lg" />
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
      {[1,2,3,4,5,6].map(i => (
        <div key={i} className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="h-40 bg-slate-200" />
          <div className="p-5 space-y-3">
            <div className="h-4 w-3/4 bg-slate-200 rounded" />
            <div className="h-3 w-full bg-slate-200 rounded" />
            <div className="h-8 w-24 bg-slate-200 rounded-xl" />
          </div>
        </div>
      ))}
    </div>
  </div>
);

const LearnLayout = () => {
  const { user, isLoading } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50/50">
        <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  if (!user.onboardingComplete) return <Navigate to="/onboarding" replace />;

  return (
    <div className="min-h-screen bg-slate-50/50 font-inter">
      <Topbar onMenuClick={() => setIsSidebarOpen(true)} />

      <div className="max-w-[1360px] mx-auto px-2 lg:px-4 flex gap-4 justify-between">
        <aside className="hidden lg:block w-[240px] shrink-0 sticky top-[72px] h-[calc(100vh-72px)] overflow-y-auto border-r border-slate-100 px-2 pb-6 custom-scrollbar pt-6">
          <LearnSidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
        </aside>

        <main className="flex-1 min-w-0 py-6 animate-fade-in relative px-2 lg:px-6">
          <ErrorBoundary fallbackMessage="This tab encountered an error. Please try refreshing.">
            <Suspense fallback={<TabSkeleton />}>
              <Outlet />
            </Suspense>
          </ErrorBoundary>
        </main>
      </div>
    </div>
  );
};

export default LearnLayout;
