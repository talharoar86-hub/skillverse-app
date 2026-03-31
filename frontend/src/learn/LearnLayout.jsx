import React, { useState } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import LearnSidebar from './LearnSidebar';
import Topbar from '../components/Topbar';

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
        {/* Left Sidebar */}
        <aside className="hidden lg:block w-[240px] shrink-0 sticky top-[72px] h-[calc(100vh-72px)] overflow-y-auto border-r border-slate-100 px-2 pb-6 custom-scrollbar pt-6">
          <LearnSidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
        </aside>

        {/* Center Content */}
        <main className="flex-1 min-w-0 py-6 animate-fade-in relative px-2 lg:px-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default LearnLayout;
