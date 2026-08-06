import React from 'react';
import { 
  LayoutDashboard, 
  BookOpen, 
  Trophy, 
  Users, 
  FolderGit, 
  UserCheck, 
  History, 
  LogOut, 
  ChevronLeft, 
  ChevronRight,
  CalendarCheck
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Sidebar({ currentPage, setCurrentPage, collapsed, setCollapsed }) {
  const { user, logout } = useAuth();
  const isAdmin = user?.role === 'ADMIN';
  const isStudent = user?.role === 'STUDENT';

  const menuItems = isStudent ? [
    { id: 'dashboard',  name: 'Dashboard',  icon: LayoutDashboard },
    { id: 'davomat',   name: 'Davomat',    icon: CalendarCheck },
    { id: 'leaderboard', name: 'Reyting',  icon: Trophy },
    { id: 'history',   name: 'Ball tarixi', icon: History },
  ] : [
    { id: 'dashboard',  name: 'Dashboard',  icon: LayoutDashboard },
    { id: 'journal',    name: 'Journal',    icon: BookOpen },
    { id: 'davomat',   name: 'Davomat',    icon: CalendarCheck },
    { id: 'leaderboard', name: 'Leaderboard', icon: Trophy },
    { id: 'students',  name: 'Students',   icon: Users },
    { id: 'groups',    name: 'Groups',     icon: FolderGit },
    ...(isAdmin ? [{ id: 'mentors', name: 'Mentors', icon: UserCheck }] : []),
    { id: 'history',   name: 'Point History', icon: History },
  ];

  return (
    <aside 
      className={`h-screen bg-slate-900 border-r border-slate-800 text-slate-300 flex flex-col justify-between transition-all duration-300 shadow-2xl relative ${
        collapsed ? 'w-20' : 'w-64'
      }`}
    >
      <div>
        {/* Header/Logo */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-800">
          {!collapsed ? (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center font-bold text-white shadow-lg shadow-indigo-500/30">
                S
              </div>
              <span className="font-extrabold text-lg tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">
                SFERA
              </span>
            </div>
          ) : (
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center font-bold text-white shadow-lg shadow-indigo-500/30 mx-auto">
              S
            </div>
          )}
          
          <button 
            onClick={() => setCollapsed(!collapsed)}
            className="absolute -right-3 top-5 w-6 h-6 rounded-full bg-indigo-600 hover:bg-indigo-500 flex items-center justify-center text-white border border-slate-800 shadow-lg cursor-pointer z-50"
          >
            {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
          </button>
        </div>

        {/* User Card */}
        <div className={`p-4 border-b border-slate-800/50 flex items-center gap-3 overflow-hidden ${collapsed ? 'justify-center' : ''}`}>
          <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center border border-indigo-500/30 text-indigo-400 font-bold shrink-0">
            {user?.fullName?.charAt(0) || 'U'}
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <p className="font-semibold text-sm text-slate-100 truncate">{user?.fullName}</p>
              <span className="inline-block text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 mt-0.5">
                {user?.role}
              </span>
            </div>
          )}
        </div>

        {/* Navigation Items */}
        <nav className="p-3 space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id || (item.id === 'students' && currentPage === 'profile');
            return (
              <button
                key={item.id}
                onClick={() => setCurrentPage(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 group cursor-pointer ${
                  isActive 
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' 
                    : 'hover:bg-slate-800/60 hover:text-slate-100'
                } ${collapsed ? 'justify-center' : ''}`}
              >
                <Icon size={18} className={isActive ? 'text-white' : 'text-slate-400 group-hover:text-indigo-400'} />
                {!collapsed && <span>{item.name}</span>}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer / Log out */}
      <div className="p-3 border-t border-slate-800">
        <button
          onClick={logout}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-rose-400 hover:bg-rose-500/10 transition-all duration-150 cursor-pointer ${
            collapsed ? 'justify-center' : ''
          }`}
        >
          <LogOut size={18} />
          {!collapsed && <span>Chiqish</span>}
        </button>
      </div>
    </aside>
  );
}
