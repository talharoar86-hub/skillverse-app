import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Search, Bell, ChevronDown, Menu, MessageSquare, X } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { useNotifications } from '../context/NotificationContext';
import { getAvatarUrl } from '../utils/avatar';
import { cn } from '../utils/cn';
import ProfileDropdown from './ProfileDropdown';
import NotificationDropdown from './NotificationDropdown';
import MessageDropdown from './MessageDropdown';

const Topbar = ({ onMenuClick }) => {
  const [activeDropdown, setActiveDropdown] = useState(null);
  const toggleDropdown = useCallback((name) => {
    setActiveDropdown(prev => prev === name ? null : name);
  }, []);
  const closeDropdown = useCallback(() => setActiveDropdown(null), []);
  const { user } = useAuth();
  const { unreadCount } = useNotifications();
  const topbarRef = useRef(null);
  const [searchExpanded, setSearchExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  // Close dropdowns when clicking outside the topbar
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (topbarRef.current && !topbarRef.current.contains(e.target)) {
        closeDropdown();
      }
    };
    if (activeDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [activeDropdown, closeDropdown]);

  // Close search expanded on escape
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        setSearchExpanded(false);
        closeDropdown();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [closeDropdown]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}&type=all&page=1`);
      setSearchExpanded(false);
    }
  };

  return (
    <header ref={topbarRef} className="h-14 sm:h-[60px] md:h-[68px] lg:h-[72px] bg-white/80 backdrop-blur-md border-b border-slate-100 sticky top-0 z-[50] w-full shadow-[0_1px_15px_-10px_rgba(0,0,0,0.05)]">
      <div className="max-w-[1360px] mx-auto h-full px-2 sm:px-3 lg:px-4 flex items-center justify-between gap-1 sm:gap-2 lg:gap-3">

        {/* Left: Brand & Menus */}
        <div className={cn(
          "flex items-center gap-1 sm:gap-2 shrink-0 transition-all",
          searchExpanded && "hidden sm:flex"
        )}>
          {/* Mobile hamburger */}
          <button
            onClick={onMenuClick}
            className="lg:hidden p-1.5 sm:p-2 text-slate-500 hover:text-indigo-600 hover:bg-slate-50 rounded-lg transition-all duration-200 active:scale-95"
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>

          {/* Brand */}
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-100">
              <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <span className="text-base sm:text-lg md:text-xl font-black tracking-tight text-slate-900 hidden md:block uppercase leading-none">SkillVerse</span>
          </Link>
        </div>

        {/* Center: Search */}
        <div className={cn(
          "flex-1 max-w-full sm:max-w-[300px] md:max-w-[400px] lg:max-w-[520px] xl:max-w-[640px] px-1 sm:px-2 md:px-4 transition-all",
          searchExpanded ? "block" : "hidden sm:block"
        )}>
          <form onSubmit={handleSearch} className="relative group w-full">
            <Search className="absolute left-2.5 sm:left-3 md:left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search skills, mentors, posts..."
              className="w-full bg-slate-100/60 border border-transparent focus:bg-white focus:border-indigo-100 focus:ring-4 focus:ring-indigo-50/50 focus:outline-none rounded-xl sm:rounded-2xl py-2 sm:py-2 md:py-2.5 pl-8 sm:pl-9 md:pl-11 pr-3 sm:pr-4 text-xs sm:text-sm font-bold text-slate-800 placeholder-slate-400 transition-all duration-300"
            />
            {/* Close search on mobile */}
            {searchExpanded && (
              <button
                type="button"
                onClick={() => {
                  setSearchExpanded(false);
                  setSearchQuery('');
                }}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 sm:hidden"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </form>
        </div>

        {/* Right: Actions & Profile */}
        <div className={cn(
          "flex items-center gap-0.5 sm:gap-1 md:gap-1.5 shrink-0",
          searchExpanded && "hidden sm:flex"
        )}>

          {/* Mobile search toggle */}
          <button
            onClick={() => setSearchExpanded(true)}
            className="sm:hidden p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all duration-200 rounded-xl active:scale-95"
            aria-label="Search"
          >
            <Search className="w-5 h-5" />
          </button>

          {/* Messages */}
          <div className="relative">
            <button
              onClick={() => toggleDropdown('messages')}
              className={cn(
                "p-1.5 sm:p-2 md:p-2.5 transition-all duration-200 rounded-xl relative active:scale-95",
                activeDropdown === 'messages'
                  ? 'text-indigo-600 bg-indigo-50 shadow-sm shadow-indigo-100'
                  : 'text-slate-400 hover:text-indigo-600 hover:bg-indigo-50'
              )}
              aria-label="Messages"
            >
              <MessageSquare className="w-5 h-5" />
            </button>
            <MessageDropdown
              isOpen={activeDropdown === 'messages'}
              onClose={closeDropdown}
            />
          </div>

          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => toggleDropdown('notifications')}
              className={cn(
                "p-1.5 sm:p-2 md:p-2.5 transition-all duration-200 rounded-xl relative active:scale-95",
                activeDropdown === 'notifications'
                  ? 'text-indigo-600 bg-indigo-50 shadow-sm shadow-indigo-100'
                  : 'text-slate-400 hover:text-indigo-600 hover:bg-indigo-50'
              )}
              aria-label="Notifications"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-0.5 right-0.5 sm:top-1 sm:right-1 min-w-[16px] h-4 sm:min-w-[18px] sm:h-[18px] bg-rose-500 text-white text-[8px] sm:text-[9px] font-black flex items-center justify-center rounded-full border-2 border-white shadow-sm">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
            <NotificationDropdown
              isOpen={activeDropdown === 'notifications'}
              onClose={closeDropdown}
            />
          </div>

          {/* Divider */}
          <div className="h-6 md:h-8 w-[1px] bg-slate-100 mx-0.5 sm:mx-1 md:mx-2 hidden sm:block"></div>

          {/* Profile */}
          <div className="relative">
            <button
              onClick={() => toggleDropdown('profile')}
              className={cn(
                "flex items-center gap-1 sm:gap-1.5 md:gap-2 p-1 sm:p-1.5 rounded-xl transition-all duration-200 border active:scale-95",
                activeDropdown === 'profile'
                  ? 'bg-indigo-50 border-indigo-200 shadow-sm shadow-indigo-100'
                  : 'border-transparent hover:bg-slate-50 hover:border-slate-200'
              )}
              aria-label="Profile menu"
            >
              <img
                src={getAvatarUrl(user)}
                alt={user?.name || "Profile"}
                className="w-7 h-7 sm:w-8 sm:h-8 md:w-9 md:h-9 border border-slate-200 rounded-full object-cover"
              />
              <ChevronDown className={cn(
                "w-3 h-3 sm:w-3.5 sm:h-3.5 text-slate-400 hidden sm:block transition-transform duration-200",
                activeDropdown === 'profile' && 'rotate-180 text-indigo-500'
              )} />
            </button>
            <ProfileDropdown
              isOpen={activeDropdown === 'profile'}
              onClose={closeDropdown}
            />
          </div>
        </div>
      </div>
    </header>
  );
};

export default Topbar;
