import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User,
  Settings,
  Bookmark,
  LogOut,
  GraduationCap,
  Users,
  Shield,
  ChevronRight,
  PlusCircle,
  Compass,
  BookOpen,
  HelpCircle,
  Moon,
  Zap,
  Star,
} from 'lucide-react';
import { cn } from '../utils/cn';
import { useAuth } from '../auth/AuthContext';
import { getAvatarUrl } from '../utils/avatar';

const ProfileDropdown = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const dropdownRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  const handleNavigation = (path) => {
    onClose();
    navigate(path);
  };

  const handleLogout = async () => {
    onClose();
    await logout();
    navigate('/login');
  };

  if (!isOpen) return null;

  const goalLabel = {
    Learn: 'Learner',
    Mentor: 'Mentor',
    Exchange: 'Skill Exchanger',
  };

  const goalColors = {
    Learn: { bg: 'bg-sky-50', text: 'text-sky-600', icon: GraduationCap },
    Mentor: { bg: 'bg-violet-50', text: 'text-violet-600', icon: Shield },
    Exchange: { bg: 'bg-emerald-50', text: 'text-emerald-600', icon: Users },
  };

  const goalStyle = goalColors[user?.goal] || goalColors.Learn;
  const GoalIcon = goalStyle.icon;

  return (
    <div
      ref={dropdownRef}
      className="absolute right-0 top-full mt-2 w-[280px] sm:w-[320px] md:w-[360px] bg-white rounded-2xl shadow-2xl shadow-slate-200/60 border border-slate-100 z-[100] animate-dropdown flex flex-col"
      style={{ maxHeight: 'calc(100vh - 80px)' }}
    >
      {/* Scrollable Content */}
      <div className="overflow-y-auto custom-scrollbar flex-1">
        {/* User Info Header */}
        <div className="p-3">
          <button
            onClick={() => handleNavigation('/profile')}
            className="w-full flex items-center gap-3 p-3 hover:bg-slate-50 rounded-xl transition-colors group"
          >
            <img
              src={getAvatarUrl(user)}
              alt={user?.name || 'Profile'}
              className="w-12 h-12 sm:w-14 sm:h-14 rounded-full object-cover border-2 border-slate-100 group-hover:border-indigo-200 transition-colors"
            />
            <div className="flex-1 text-left min-w-0">
              <p className="text-sm sm:text-base font-bold text-slate-900 truncate">{user?.name}</p>
              <p className="text-xs text-slate-500 font-medium truncate">{user?.email}</p>
              {user?.goal && (
                <div className={cn(
                  'inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold mt-1.5',
                  goalStyle.bg, goalStyle.text
                )}>
                  <GoalIcon className="w-3 h-3" />
                  {goalLabel[user.goal] || user.goal}
                </div>
              )}
            </div>
            <ChevronRight className="w-4 h-4 text-slate-300 shrink-0" />
          </button>
        </div>

        <div className="h-[1px] bg-slate-100 mx-3"></div>

        {/* Quick Actions Row */}
        <div className="p-3">
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => handleNavigation('/')}
              className="flex flex-col items-center gap-1.5 p-2 sm:p-3 rounded-xl hover:bg-slate-50 transition-colors group"
            >
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-indigo-50 flex items-center justify-center group-hover:bg-indigo-100 transition-colors">
                <PlusCircle className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-600" />
              </div>
              <span className="text-[10px] sm:text-[11px] font-semibold text-slate-600">Create Post</span>
            </button>

            <button
              onClick={() => handleNavigation('/learn')}
              className="flex flex-col items-center gap-1.5 p-2 sm:p-3 rounded-xl hover:bg-slate-50 transition-colors group"
            >
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-violet-50 flex items-center justify-center group-hover:bg-violet-100 transition-colors">
                <Compass className="w-4 h-4 sm:w-5 sm:h-5 text-violet-600" />
              </div>
              <span className="text-[10px] sm:text-[11px] font-semibold text-slate-600">Discover</span>
            </button>

            <button
              onClick={() => handleNavigation('/messages')}
              className="flex flex-col items-center gap-1.5 p-2 sm:p-3 rounded-xl hover:bg-slate-50 transition-colors group"
            >
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-emerald-50 flex items-center justify-center group-hover:bg-emerald-100 transition-colors">
                <Users className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600" />
              </div>
              <span className="text-[10px] sm:text-[11px] font-semibold text-slate-600">Connect</span>
            </button>
          </div>
        </div>

        <div className="h-[1px] bg-slate-100 mx-3"></div>

        {/* Menu Items */}
        <div className="p-3 space-y-0.5">
          <MenuItem icon={User} iconBg="bg-indigo-50" iconColor="text-indigo-600" label="Your Profile" onClick={() => handleNavigation('/profile')} />
          <MenuItem icon={Bookmark} iconBg="bg-amber-50" iconColor="text-amber-600" label="Saved Posts" onClick={() => handleNavigation('/profile/saved')} />
          <MenuItem icon={BookOpen} iconBg="bg-sky-50" iconColor="text-sky-600" label="My Courses" onClick={() => handleNavigation('/learn')} />

          {user?.mentorStatus === 'approved' && (
            <MenuItem icon={GraduationCap} iconBg="bg-violet-50" iconColor="text-violet-600" label="Mentor Dashboard" onClick={() => handleNavigation('/mentor-dashboard/overview')} />
          )}

          {user?.goal === 'Exchange' && (
            <MenuItem icon={Zap} iconBg="bg-emerald-50" iconColor="text-emerald-600" label="Skill Exchanges" onClick={() => handleNavigation('/learn')} />
          )}

          <MenuItem icon={Star} iconBg="bg-rose-50" iconColor="text-rose-600" label="Reviews" onClick={() => handleNavigation('/profile')} />
        </div>

        <div className="h-[1px] bg-slate-100 mx-3"></div>

        {/* Bottom section */}
        <div className="p-3 space-y-0.5">
          <MenuItem icon={Settings} iconBg="bg-slate-100" iconColor="text-slate-600" label="Settings & Privacy" onClick={() => handleNavigation('/settings')} />
          <MenuItem icon={HelpCircle} iconBg="bg-slate-100" iconColor="text-slate-600" label="Help & Support" onClick={() => handleNavigation('/settings')} />
          <MenuItem icon={Moon} iconBg="bg-slate-100" iconColor="text-slate-600" label="Display & Accessibility" onClick={() => {}} />
        </div>

        {/* Logout */}
        <div className="border-t border-slate-100 p-3">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-rose-50 rounded-xl transition-colors text-left group"
          >
            <div className="w-9 h-9 rounded-xl bg-rose-50 group-hover:bg-rose-100 flex items-center justify-center transition-colors">
              <LogOut className="w-4.5 h-4.5 text-rose-600" />
            </div>
            <span className="text-sm font-semibold text-rose-600">Log Out</span>
          </button>
        </div>
      </div>
    </div>
  );
};

const MenuItem = ({ icon: Icon, iconBg, iconColor, label, onClick }) => (
  <button
    onClick={onClick}
    className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-slate-50 rounded-xl transition-colors text-left group"
  >
    <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center group-hover:brightness-95 transition-all", iconBg)}>
      <Icon className={cn("w-4.5 h-4.5", iconColor)} />
    </div>
    <span className="text-sm font-semibold text-slate-700 group-hover:text-slate-900">{label}</span>
    <ChevronRight className="w-4 h-4 text-slate-300 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
  </button>
);

export default ProfileDropdown;
