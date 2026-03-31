import React, { useState } from 'react';
import { Outlet, Navigate, useLocation, Link } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import RightSidebar from './RightSidebar';
import { useAuth } from '../auth/AuthContext';
import { cn } from '../utils/cn';

const Layout = () => {
  const { user, isLoading } = useAuth();
  const location = useLocation();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const isHomePage = location.pathname === '/';

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
      {/* Topbar */}
      <Topbar
        onMenuClick={() => setMobileSidebarOpen(true)}
      />

      {/* Main Layout */}
      <div className="max-w-[1400px] mx-auto flex gap-4 lg:gap-6 px-3 lg:px-6 transition-all duration-300">

        {/* Left Sidebar - Desktop */}
        <aside className="hidden lg:flex lg:flex-col w-[240px] shrink-0 sticky top-[72px] h-[calc(100vh-72px)] overflow-y-auto border-r border-slate-100 custom-scrollbar pt-4 pb-6 px-2">
          <Sidebar />
        </aside>

        {/* Center Content */}
        <main className={cn(
          "flex-1 min-w-0 animate-fade-in relative py-4 lg:py-6 px-2 lg:px-0",
          isHomePage ? "max-w-[640px]" : "max-w-[800px]"
        )}>
          <Outlet />
        </main>

        {/* Right Sidebar */}
        {isHomePage ? (
          <aside className="hidden lg:block w-[280px] xl:w-[300px] shrink-0 sticky top-[72px] h-[calc(100vh-72px)] overflow-y-auto border-l border-slate-100 pb-6 custom-scrollbar hide-scrollbar pt-6">
            <RightSidebar />
          </aside>
        ) : (
          <aside className="hidden lg:block w-[280px] xl:w-[300px] shrink-0" />
        )}

      </div>

      {/* Mobile Sidebar Overlay */}
      <div
        className={cn(
          "lg:hidden fixed inset-0 z-[60] transition-all duration-300",
          mobileSidebarOpen
            ? "bg-slate-900/40 backdrop-blur-sm pointer-events-auto opacity-100"
            : "bg-transparent pointer-events-none opacity-0"
        )}
        onClick={() => setMobileSidebarOpen(false)}
      />

      {/* Mobile Sidebar Drawer */}
      <div className={cn(
        "lg:hidden fixed left-0 top-0 h-full w-[280px] sm:w-[300px] bg-white shadow-2xl z-[70] transition-transform duration-300 ease-out flex flex-col",
        mobileSidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        {/* Mobile sidebar header */}
        <div className="flex items-center justify-between px-4 sm:px-5 py-3 sm:py-4 border-b border-slate-100">
          <Link to="/" className="flex items-center gap-2" onClick={() => setMobileSidebarOpen(false)}>
            <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-100">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <span className="text-lg font-black tracking-tight text-slate-900 uppercase">SkillVerse</span>
          </Link>
          <button
            onClick={() => setMobileSidebarOpen(false)}
            className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors active:scale-95"
            aria-label="Close menu"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Mobile sidebar content */}
        <div className="flex-1 overflow-y-auto px-3 py-4">
          <Sidebar
            mobile
            onNavigate={() => setMobileSidebarOpen(false)}
          />
        </div>
      </div>
    </div>
  );
};

export default Layout;
