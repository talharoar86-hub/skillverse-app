import React, { useState, useRef, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  Home,
  BookOpen,
  User,
  Settings,
  LogOut,
  MessageSquare,
  Bell,
  Bookmark,
  GraduationCap,
} from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { cn } from '../utils/cn';
import { getAvatarUrl } from '../utils/avatar';

const Sidebar = ({ mobile = false, onNavigate }) => {
  const { user, logout } = useAuth();
  const { unreadCount } = useNotifications();
  const navigate = useNavigate();

  const navItems = [
    { name: 'Home', icon: Home, path: '/', color: 'text-blue-500' },
    { name: 'Learn', icon: BookOpen, path: '/learn', color: 'text-indigo-500' },
    { name: 'Messages', icon: MessageSquare, path: '/messages', color: 'text-emerald-500' },
    { name: 'Profile', icon: User, path: '/profile', color: 'text-pink-500' },
    { name: 'Notifications', icon: Bell, path: '/notifications', color: 'text-amber-500', badge: unreadCount },
    { name: 'Settings', icon: Settings, path: '/settings', color: 'text-slate-500' },
  ];

  const handleNavClick = () => {
    if (mobile && onNavigate) {
      onNavigate();
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
    if (mobile && onNavigate) onNavigate();
  };

  return (
    <div className="flex flex-col h-full">
      {/* Profile Summary - Hidden on mobile (mobile has its own header) */}
      {!mobile && (
        <NavLink
          to="/profile"
          onClick={handleNavClick}
          className="flex items-center gap-3 px-2 py-3 rounded-xl hover:bg-slate-100 transition-colors mb-4 group"
        >
          <img
            src={getAvatarUrl(user)}
            alt={user?.name || 'User'}
            className="w-10 h-10 rounded-full object-cover border border-white shadow-sm"
          />
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-bold text-slate-900 truncate group-hover:text-indigo-600 transition-colors">
              {user?.name}
            </h4>
            <p className="text-[11px] text-slate-400 font-medium truncate uppercase tracking-widest">
              {user?.experienceLevel || 'Skill Ninja'}
            </p>
          </div>
        </NavLink>
      )}

      {/* Main Nav */}
      <nav className="space-y-1 mb-8">
        {navItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            end={item.path === '/'}
            onClick={handleNavClick}
            className={({ isActive }) => cn(
              "flex items-center justify-between px-3 py-3 rounded-xl font-bold text-sm transition-all duration-200 group",
              isActive
                ? "bg-white shadow-sm shadow-slate-100 text-indigo-600 border border-slate-100"
                : "text-slate-500 hover:bg-slate-100 hover:text-slate-900 hover:shadow-sm hover:shadow-slate-100 active:scale-[0.98]"
            )}
          >
            <div className="flex items-center gap-3">
              <item.icon className={cn("w-5 h-5 transition-transform duration-200 group-hover:scale-110", item.color)} />
              <span>{item.name}</span>
            </div>
            {item.badge > 0 && (
              <span className="bg-rose-500 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full min-w-[20px] flex items-center justify-center border-2 border-white shadow-sm animate-bounce-soft">
                {item.badge > 99 ? '99+' : item.badge}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Footer Nav */}
      <div className="mt-auto pt-4 border-t border-slate-100">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-3 rounded-xl font-bold text-sm text-slate-500 hover:bg-rose-50 hover:text-rose-600 hover:shadow-sm transition-all duration-200 active:scale-[0.98]"
        >
          <LogOut className="w-5 h-5 text-slate-400" />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
