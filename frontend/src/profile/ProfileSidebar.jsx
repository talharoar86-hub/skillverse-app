import React, { useState, useCallback } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, FileText, Bookmark, Trophy, ShieldOff, Share2,
  LogOut, ArrowLeft, ChevronDown,
  BarChart3, Users, Activity, UserCheck, Clock, X, RefreshCw,
} from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { getAvatarUrl } from '../utils/avatar';
import { cn } from '../utils/cn';

const postsChildren = [
  { name: 'My Posts',       icon: FileText,    path: '/profile/posts',          color: 'text-indigo-500' },
  { name: 'Saved',          icon: Bookmark,    path: '/profile/saved',          color: 'text-emerald-500' },
  { name: 'Interested',     icon: Trophy,      path: '/profile/interested',     color: 'text-amber-500' },
  { name: 'Not Interested', icon: ShieldOff,   path: '/profile/not-interested', color: 'text-rose-500' },
];

const topNavItems = [
  { name: 'Overview',          icon: LayoutDashboard, path: '/profile/overview',        color: 'text-blue-500' },
  { name: 'Learning Progress', icon: BarChart3,       path: '/profile/learning',        color: 'text-teal-500' },
  { name: 'Exchange Activity', icon: RefreshCw,       path: '/profile/exchange-activity', color: 'text-orange-500' },
  { name: 'Mentor Activity',   icon: Users,           path: '/profile/mentor-activity', color: 'text-violet-500' },
  { name: 'Reposts',           icon: Share2,          path: '/profile/reposts',         color: 'text-pink-500' },
  { name: 'Followers',         icon: Users,           path: '/profile/followers',       color: 'text-blue-500' },
  { name: 'Following',         icon: UserCheck,       path: '/profile/following',       color: 'text-emerald-500' },
  { name: 'Pending Requests',  icon: Clock,           path: '/profile/pending',         color: 'text-amber-500' },
];

const NavItem = ({ item, indent = false }) => (
  <NavLink
    to={item.path}
    className={({ isActive }) => cn(
      "flex items-center gap-3 rounded-xl font-semibold transition-all duration-200 group",
      indent ? "pl-10 pr-3 py-2.5 text-[13px]" : "px-3 py-2.5 text-sm",
      isActive
        ? "bg-white shadow-sm text-indigo-600 border border-slate-100"
        : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
    )}
  >
    <item.icon className={cn("shrink-0", indent ? "w-4 h-4" : "w-[18px] h-[18px]", item.color)} />
    <span className="truncate">{item.name}</span>
  </NavLink>
);

const PostsAccordion = ({ expanded, onToggle, isChildActive }) => (
  <div className="space-y-0.5">
    <button
      onClick={onToggle}
      className={cn(
        "w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200",
        isChildActive
          ? "bg-white shadow-sm text-indigo-600 border border-slate-100"
          : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
      )}
    >
      <div className="flex items-center gap-3">
        <Activity className={cn("w-[18px] h-[18px]", isChildActive ? "text-indigo-500" : "text-slate-400")} />
        <span>Posts</span>
      </div>
      <ChevronDown className={cn("w-4 h-4 text-slate-400 transition-transform duration-300 ease-in-out", expanded && "rotate-180")} />
    </button>
    <div className={cn("overflow-hidden transition-all duration-300 ease-in-out", expanded ? "max-h-64 opacity-100" : "max-h-0 opacity-0")}>
      <div className="pt-1 pb-1 space-y-0.5 border-l-2 border-slate-100 ml-4">
        {postsChildren.map(child => (
          <NavItem key={child.name} item={child} indent />
        ))}
      </div>
    </div>
  </div>
);

const ProfileSidebar = ({ isOpen, setIsOpen }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isPostsChildActive = postsChildren.some(c => location.pathname === c.path);
  const [postsExpanded, setPostsExpanded] = useState(false);
  const isPostsOpen = postsExpanded || isPostsChildActive;

  const isMentorGoal = user?.goal === 'Mentor';

  const handleLogout = useCallback(() => { logout(); navigate("/login"); }, [logout, navigate]);
  const handleTogglePosts = useCallback(() => { setPostsExpanded(prev => !prev); }, []);
  const handleNavClick = () => { if (setIsOpen) setIsOpen(false); };

  const sidebarContent = (
    <div className="flex flex-col h-full">
      <button onClick={() => { navigate("/"); handleNavClick(); }} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-semibold text-slate-400 hover:bg-slate-50 hover:text-indigo-600 transition-all duration-200 group mb-1 w-full text-left">
        <ArrowLeft className="w-4 h-4 text-slate-400 group-hover:text-indigo-500 group-hover:-translate-x-0.5 transition-transform duration-150" />
        <span>Go Home</span>
      </button>
      <div className="h-px bg-slate-100 mx-2 my-3" />
      <NavLink to="/profile/overview" onClick={handleNavClick} className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-slate-50 transition-colors mb-5 group">
        <img src={getAvatarUrl(user)} alt={user?.name || "User"} className="w-9 h-9 rounded-full object-cover border-2 border-white shadow-sm" />
        <div className="flex-1 min-w-0">
          <h4 className="text-[13px] font-bold text-slate-900 truncate group-hover:text-indigo-600 transition-colors leading-tight">{user?.name}</h4>
          <p className="text-[10px] text-slate-400 font-medium truncate uppercase tracking-wider mt-0.5">{user?.experienceLevel || "Member"}</p>
        </div>
      </NavLink>
      <p className="px-3 mb-2 text-[10px] font-bold text-slate-300 uppercase tracking-widest">Dashboard</p>
      <nav className="space-y-1 flex-1">
        <NavItem item={topNavItems[0]} />
        <PostsAccordion expanded={isPostsOpen} onToggle={handleTogglePosts} isChildActive={isPostsChildActive} />
        <NavItem item={topNavItems[1]} />
        <NavItem item={topNavItems[2]} />
        {isMentorGoal && <NavItem item={topNavItems[3]} />}
        <div className="h-px bg-slate-100 mx-2 my-2" />
        <NavItem item={topNavItems[4]} />
        <div className="h-px bg-slate-100 mx-2 my-2" />
        <p className="px-3 mb-2 text-[10px] font-bold text-slate-300 uppercase tracking-widest">Network</p>
        <NavItem item={topNavItems[5]} />
        <NavItem item={topNavItems[6]} />
        <NavItem item={topNavItems[7]} />
      </nav>
      <div className="mt-auto pt-4 border-t border-slate-100">
        <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-all duration-200">
          <LogOut className="w-[18px] h-[18px]" />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      <div className={cn("lg:hidden fixed inset-0 z-[60] transition-opacity duration-300 pointer-events-none", isOpen ? "bg-slate-900/40 backdrop-blur-sm pointer-events-auto opacity-100" : "opacity-0")} onClick={() => setIsOpen && setIsOpen(false)}>
        <aside className={cn("fixed left-0 top-0 h-full w-[280px] bg-white p-5 shadow-2xl transition-transform duration-300 ease-out", isOpen ? "translate-x-0" : "-translate-x-full")} onClick={e => e.stopPropagation()}>
          <div className="flex items-center justify-between mb-6">
            <span className="text-lg font-black tracking-tight text-indigo-600">Profile</span>
            <button onClick={() => setIsOpen && setIsOpen(false)} className="p-2 rounded-lg hover:bg-slate-100"><X className="w-5 h-5 text-slate-400" /></button>
          </div>
          {sidebarContent}
        </aside>
      </div>
      <div className="h-full hidden lg:block">{sidebarContent}</div>
    </>
  );
};

export default ProfileSidebar;
