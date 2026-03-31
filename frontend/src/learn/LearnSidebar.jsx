import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { BookOpen, Users, GraduationCap, Star, LogOut, ArrowLeft, X, LayoutDashboard } from "lucide-react";
import { useAuth } from "../auth/AuthContext";
import { getAvatarUrl } from "../utils/avatar";
import { cn } from "../utils/cn";

const LearnSidebar = ({ isOpen, setIsOpen }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const handleLogout = () => { logout(); navigate("/login"); };
  const handleNavClick = () => { if (setIsOpen) setIsOpen(false); };

  const navItems = [
    { name: "Explore Courses", icon: BookOpen, path: "/learn/explore", color: "text-indigo-500" },
    { name: "Mentors", icon: Users, path: "/learn/mentors", color: "text-blue-500" },
    { name: "My Learning", icon: GraduationCap, path: "/learn/my-learning", color: "text-emerald-500" },
  ];

  if (user?.mentorStatus === 'approved') {
    navItems.push({ name: "Mentor Dashboard", icon: LayoutDashboard, path: "/mentor-dashboard/overview", color: "text-amber-500" });
  } else if (user?.goal === 'Mentor') {
    navItems.push({ name: "Become a Mentor", icon: Star, path: "/learn/become-mentor", color: "text-amber-500" });
  }

  const sidebarContent = (
    <div className="flex flex-col h-full">
      <button onClick={() => { navigate("/"); handleNavClick(); }} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-semibold text-slate-400 hover:bg-slate-50 hover:text-indigo-600 transition-all duration-200 group mb-1 w-full text-left">
        <ArrowLeft className="w-4 h-4 text-slate-400 group-hover:text-indigo-500 group-hover:-translate-x-0.5 transition-transform duration-150" />
        <span>Go Home</span>
      </button>
      <div className="h-px bg-slate-100 mx-2 my-3" />
      <NavLink to="/learn/explore" onClick={handleNavClick} className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-slate-50 transition-colors mb-5 group">
        <img src={getAvatarUrl(user)} alt={user?.name || "User"} className="w-9 h-9 rounded-full object-cover border-2 border-white shadow-sm" />
        <div className="flex-1 min-w-0">
          <h4 className="text-[13px] font-bold text-slate-900 truncate group-hover:text-indigo-600 transition-colors leading-tight">{user?.name}</h4>
          <p className="text-[10px] text-slate-400 font-medium truncate uppercase tracking-wider mt-0.5">Learning</p>
        </div>
      </NavLink>
      <p className="px-3 mb-2 text-[10px] font-bold text-slate-300 uppercase tracking-widest">Learn</p>
      <nav className="space-y-1 flex-1">
        {navItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            end={item.path === "/learn/explore"}
            onClick={handleNavClick}
            className={({ isActive }) => cn(
              "flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 group",
              isActive
                ? "bg-white shadow-sm text-indigo-600 border border-slate-100"
                : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
            )}
          >
            <div className="flex items-center gap-3">
              <item.icon className={cn("w-[18px] h-[18px]", item.color)} />
              <span>{item.name}</span>
            </div>
          </NavLink>
        ))}
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
            <span className="text-lg font-black tracking-tight text-indigo-600">Learn</span>
            <button onClick={() => setIsOpen && setIsOpen(false)} className="p-2 rounded-lg hover:bg-slate-100"><X className="w-5 h-5 text-slate-400" /></button>
          </div>
          {sidebarContent}
        </aside>
      </div>
      <div className="h-full hidden lg:block">{sidebarContent}</div>
    </>
  );
};

export default LearnSidebar;
