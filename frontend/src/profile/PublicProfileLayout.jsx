import React from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import Topbar from '../components/Topbar';

const PublicProfileLayout = () => {
  const { user, isLoading } = useAuth();

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
      <Topbar onMenuClick={() => {}} />

      <div className="max-w-[1360px] mx-auto px-4 flex gap-4 justify-center">
        <main className="flex-1 max-w-[720px] py-6 animate-fade-in relative">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default PublicProfileLayout;
