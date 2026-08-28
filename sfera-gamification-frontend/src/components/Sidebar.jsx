import React, { useState } from 'react';
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
  CalendarCheck,
  CalendarDays,
  Shield,
  Sparkles,
  Landmark,
  FileSpreadsheet,
  DoorOpen,
  ScrollText,
  GraduationCap,
  ChevronDown,
  CircleDot
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Sidebar({ currentPage, setCurrentPage, collapsed, setCollapsed }) {
  const { user, logout } = useAuth();
  const userRole = user?.role || '';

  // Dropdown expansion states
  const [akademikOpen, setAkademikOpen] = useState(true);
  const [moliyaOpen, setMoliyaOpen] = useState(true);

  // Hover states for collapsed flyout popups
  const [hoveredSection, setHoveredSection] = useState(null);

  const academicSubItems = [
    { id: 'groups', name: 'Guruhlar', icon: FolderGit, roles: ['SUPER_ADMIN', 'BRANCH_ADMIN', 'MENTOR'] },
    { id: 'courses', name: 'Kurslar', icon: GraduationCap, roles: ['SUPER_ADMIN', 'BRANCH_ADMIN'] },
    { id: 'rooms', name: 'Xonalar', icon: DoorOpen, roles: ['SUPER_ADMIN', 'BRANCH_ADMIN'] },
    { id: 'lessonplans', name: 'Dars Rejalari', icon: BookOpen, roles: ['SUPER_ADMIN', 'BRANCH_ADMIN', 'MENTOR', 'STUDENT'] },
    { id: 'mentors', name: 'Xodimlar / Mentorlar', icon: UserCheck, roles: ['SUPER_ADMIN'] },
    { id: 'admins', name: 'Adminlar & Rollar', icon: Shield, roles: ['SUPER_ADMIN'] }
  ].filter(i => i.roles.includes(userRole));

  const financeSubItems = [
    { id: 'cashier', name: 'Kassa (To\'lovlar)', icon: Landmark, roles: ['SUPER_ADMIN', 'CASHIER'] },
    { id: 'expenses', name: 'Xarajatlar', icon: ScrollText, roles: ['SUPER_ADMIN', 'ACCOUNTANT'] },
    { id: 'finance', name: 'Narxlar va Tariflar', icon: Landmark, roles: ['SUPER_ADMIN', 'BRANCH_ADMIN', 'ACCOUNTANT'] },
    { id: 'reports', name: 'Moliya Hisobotlari', icon: FileSpreadsheet, roles: ['SUPER_ADMIN', 'BRANCH_ADMIN', 'ACCOUNTANT'] }
  ].filter(i => i.roles.includes(userRole));

  const isAcademicActive = academicSubItems.some(i => i.id === currentPage);
  const isFinanceActive = financeSubItems.some(i => i.id === currentPage);

  const mainItems = [
    { id: 'dashboard', name: 'Boshqaruv Paneli', icon: LayoutDashboard, roles: ['SUPER_ADMIN', 'BRANCH_ADMIN', 'MENTOR', 'STUDENT'] },
    { id: 'schedule', name: 'Dars Jadvali', icon: CalendarDays, roles: ['SUPER_ADMIN', 'BRANCH_ADMIN', 'MENTOR', 'STUDENT'] },
    { id: 'leads', name: 'Lidlar (CRM)', icon: UserCheck, roles: ['SUPER_ADMIN', 'BRANCH_ADMIN', 'OPERATOR'] }
  ].filter(i => i.roles.includes(userRole));

  const studentSectionItems = [
    { id: 'journal', name: 'Baholar Jurnali', icon: BookOpen, roles: ['BRANCH_ADMIN', 'MENTOR'] }, // Removed for SUPER_ADMIN as requested
    { id: 'davomat', name: 'Davomat', icon: CalendarCheck, roles: ['SUPER_ADMIN', 'BRANCH_ADMIN', 'MENTOR', 'STUDENT'] },
    { id: 'leaderboard', name: 'Reyting (Top)', icon: Trophy, roles: ['SUPER_ADMIN', 'BRANCH_ADMIN', 'MENTOR', 'STUDENT'] },
    { id: 'students', name: 'O\'quvchilar Ro\'yxati', icon: Users, roles: ['SUPER_ADMIN', 'BRANCH_ADMIN', 'MENTOR'] }
  ].filter(i => i.roles.includes(userRole));

  const gamificationItems = [
    { id: 'history', name: 'Ballar Tarixi', icon: History, roles: ['SUPER_ADMIN', 'BRANCH_ADMIN', 'MENTOR', 'STUDENT'] },
    { id: 'sfera-ai', name: 'Sfera AI Yordamchi', icon: Sparkles, roles: ['SUPER_ADMIN', 'BRANCH_ADMIN', 'MENTOR', 'STUDENT'] }
  ].filter(i => i.roles.includes(userRole));

  const systemItems = [
    { id: 'audit-logs', name: 'Audit Qaydlari', icon: ScrollText, roles: ['SUPER_ADMIN'] }
  ].filter(i => i.roles.includes(userRole));

  return (
    <aside 
      className={`h-screen bg-slate-900 border-r border-slate-800 text-slate-300 flex flex-col justify-between transition-all duration-300 shadow-2xl relative ${
        collapsed ? 'w-20' : 'w-64'
      }`}
    >
      <div className="flex flex-col flex-1 min-h-0">
        {/* Header/Logo */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-800 shrink-0">
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
        <div className={`p-4 border-b border-slate-800/50 flex items-center gap-3 overflow-hidden shrink-0 ${collapsed ? 'justify-center' : ''}`}>
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

        {/* Navigation Items (Scrollable) */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar">
          
          {/* 1. Asosiy */}
          {mainItems.length > 0 && (
            <div className="space-y-1">
              {!collapsed && (
                <h4 className="text-[10px] font-bold text-slate-500 px-3 uppercase tracking-wider mb-1">
                  Asosiy
                </h4>
              )}
              {mainItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentPage === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setCurrentPage(item.id)}
                    title={collapsed ? item.name : undefined}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150 group cursor-pointer ${
                      isActive 
                        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' 
                        : 'hover:bg-slate-850/60 hover:text-slate-100'
                    } ${collapsed ? 'justify-center' : ''}`}
                  >
                    <Icon size={18} className={isActive ? 'text-white' : 'text-slate-400 group-hover:text-indigo-400'} />
                    {!collapsed && <span>{item.name}</span>}
                  </button>
                );
              })}
            </div>
          )}

          {/* 2. O'quvchilar */}
          {studentSectionItems.length > 0 && (
            <div className="space-y-1">
              {!collapsed && (
                <h4 className="text-[10px] font-bold text-slate-500 px-3 uppercase tracking-wider mb-1">
                  O'quvchilar
                </h4>
              )}
              {studentSectionItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentPage === item.id || (item.id === 'students' && currentPage === 'profile');
                return (
                  <button
                    key={item.id}
                    onClick={() => setCurrentPage(item.id)}
                    title={collapsed ? item.name : undefined}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150 group cursor-pointer ${
                      isActive 
                        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' 
                        : 'hover:bg-slate-850/60 hover:text-slate-100'
                    } ${collapsed ? 'justify-center' : ''}`}
                  >
                    <Icon size={18} className={isActive ? 'text-white' : 'text-slate-400 group-hover:text-indigo-400'} />
                    {!collapsed && <span>{item.name}</span>}
                  </button>
                );
              })}
            </div>
          )}

          {/* 3. AKADEMIK (Dropdown / Hover Submenu) */}
          {academicSubItems.length > 0 && (
            <div 
              className="space-y-1 relative"
              onMouseEnter={() => {
                if (collapsed) setHoveredSection('akademik');
              }}
              onMouseLeave={() => {
                if (collapsed) setHoveredSection(null);
              }}
            >
              {!collapsed ? (
                <>
                  <button
                    type="button"
                    onClick={() => setAkademikOpen(!akademikOpen)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
                      isAcademicActive
                        ? 'bg-indigo-950/40 text-indigo-300 border border-indigo-500/20'
                        : 'text-slate-300 hover:bg-slate-850/60 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <GraduationCap size={18} className={isAcademicActive ? 'text-indigo-400' : 'text-slate-400'} />
                      <span className="font-bold">Akademik</span>
                    </div>
                    <ChevronDown size={14} className={`text-slate-400 transition-transform duration-200 ${akademikOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {akademikOpen && (
                    <div className="pl-4 pr-1 py-1 space-y-1 border-l-2 border-slate-800 ml-4 animate-fadeIn">
                      {academicSubItems.map(sub => {
                        const SubIcon = sub.icon;
                        const isSubActive = currentPage === sub.id;
                        return (
                          <button
                            key={sub.id}
                            onClick={() => setCurrentPage(sub.id)}
                            className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                              isSubActive
                                ? 'bg-indigo-600 text-white font-bold shadow-md shadow-indigo-600/20'
                                : 'text-slate-400 hover:bg-slate-800/80 hover:text-slate-100'
                            }`}
                          >
                            <SubIcon size={14} className={isSubActive ? 'text-white' : 'text-slate-400'} />
                            <span className="truncate">{sub.name}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </>
              ) : (
                /* Collapsed Icon + Floating Flyout */
                <div className="relative">
                  <button
                    onClick={() => setCurrentPage(academicSubItems[0]?.id || 'groups')}
                    title="Akademik"
                    className={`w-full flex items-center justify-center p-2.5 rounded-lg transition-all ${
                      isAcademicActive ? 'bg-indigo-600 text-white' : 'hover:bg-slate-850 text-slate-400 hover:text-white'
                    }`}
                  >
                    <GraduationCap size={18} />
                  </button>

                  {hoveredSection === 'akademik' && (
                    <div className="absolute left-full top-0 ml-2 w-48 bg-slate-900 border border-slate-800 rounded-xl p-2 shadow-2xl z-50 animate-fadeIn space-y-1">
                      <div className="text-[10px] font-extrabold text-indigo-400 px-2 py-1 uppercase tracking-wider border-b border-slate-800">
                        Akademik Bo'lim
                      </div>
                      {academicSubItems.map(sub => {
                        const SubIcon = sub.icon;
                        const isSubActive = currentPage === sub.id;
                        return (
                          <button
                            key={sub.id}
                            onClick={() => {
                              setCurrentPage(sub.id);
                              setHoveredSection(null);
                            }}
                            className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs font-semibold text-left transition-all ${
                              isSubActive ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                            }`}
                          >
                            <SubIcon size={14} />
                            <span>{sub.name}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* 4. MOLIYA (Dropdown / Hover Submenu) */}
          {financeSubItems.length > 0 && (
            <div 
              className="space-y-1 relative"
              onMouseEnter={() => {
                if (collapsed) setHoveredSection('moliya');
              }}
              onMouseLeave={() => {
                if (collapsed) setHoveredSection(null);
              }}
            >
              {!collapsed ? (
                <>
                  <button
                    type="button"
                    onClick={() => setMoliyaOpen(!moliyaOpen)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
                      isFinanceActive
                        ? 'bg-emerald-950/40 text-emerald-300 border border-emerald-500/20'
                        : 'text-slate-300 hover:bg-slate-850/60 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Landmark size={18} className={isFinanceActive ? 'text-emerald-400' : 'text-slate-400'} />
                      <span className="font-bold">Moliya</span>
                    </div>
                    <ChevronDown size={14} className={`text-slate-400 transition-transform duration-200 ${moliyaOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {moliyaOpen && (
                    <div className="pl-4 pr-1 py-1 space-y-1 border-l-2 border-slate-800 ml-4 animate-fadeIn">
                      {financeSubItems.map(sub => {
                        const SubIcon = sub.icon;
                        const isSubActive = currentPage === sub.id;
                        return (
                          <button
                            key={sub.id}
                            onClick={() => setCurrentPage(sub.id)}
                            className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                              isSubActive
                                ? 'bg-emerald-600 text-white font-bold shadow-md shadow-emerald-600/20'
                                : 'text-slate-400 hover:bg-slate-800/80 hover:text-slate-100'
                            }`}
                          >
                            <SubIcon size={14} className={isSubActive ? 'text-white' : 'text-slate-400'} />
                            <span className="truncate">{sub.name}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </>
              ) : (
                /* Collapsed Icon + Floating Flyout */
                <div className="relative">
                  <button
                    onClick={() => setCurrentPage(financeSubItems[0]?.id || 'cashier')}
                    title="Moliya"
                    className={`w-full flex items-center justify-center p-2.5 rounded-lg transition-all ${
                      isFinanceActive ? 'bg-emerald-600 text-white' : 'hover:bg-slate-850 text-slate-400 hover:text-white'
                    }`}
                  >
                    <Landmark size={18} />
                  </button>

                  {hoveredSection === 'moliya' && (
                    <div className="absolute left-full top-0 ml-2 w-48 bg-slate-900 border border-slate-800 rounded-xl p-2 shadow-2xl z-50 animate-fadeIn space-y-1">
                      <div className="text-[10px] font-extrabold text-emerald-400 px-2 py-1 uppercase tracking-wider border-b border-slate-800">
                        Moliya Bo'limi
                      </div>
                      {financeSubItems.map(sub => {
                        const SubIcon = sub.icon;
                        const isSubActive = currentPage === sub.id;
                        return (
                          <button
                            key={sub.id}
                            onClick={() => {
                              setCurrentPage(sub.id);
                              setHoveredSection(null);
                            }}
                            className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs font-semibold text-left transition-all ${
                              isSubActive ? 'bg-emerald-600 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                            }`}
                          >
                            <SubIcon size={14} />
                            <span>{sub.name}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* 5. Gamifikatsiya */}
          {gamificationItems.length > 0 && (
            <div className="space-y-1">
              {!collapsed && (
                <h4 className="text-[10px] font-bold text-slate-500 px-3 uppercase tracking-wider mb-1">
                  Gamifikatsiya
                </h4>
              )}
              {gamificationItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentPage === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setCurrentPage(item.id)}
                    title={collapsed ? item.name : undefined}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150 group cursor-pointer ${
                      isActive 
                        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' 
                        : 'hover:bg-slate-850/60 hover:text-slate-100'
                    } ${collapsed ? 'justify-center' : ''}`}
                  >
                    <Icon size={18} className={isActive ? 'text-white' : 'text-slate-400 group-hover:text-indigo-400'} />
                    {!collapsed && <span>{item.name}</span>}
                  </button>
                );
              })}
            </div>
          )}

          {/* 6. Tizim */}
          {systemItems.length > 0 && (
            <div className="space-y-1">
              {!collapsed && (
                <h4 className="text-[10px] font-bold text-slate-500 px-3 uppercase tracking-wider mb-1">
                  Tizim
                </h4>
              )}
              {systemItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentPage === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setCurrentPage(item.id)}
                    title={collapsed ? item.name : undefined}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150 group cursor-pointer ${
                      isActive 
                        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' 
                        : 'hover:bg-slate-850/60 hover:text-slate-100'
                    } ${collapsed ? 'justify-center' : ''}`}
                  >
                    <Icon size={18} className={isActive ? 'text-white' : 'text-slate-400 group-hover:text-indigo-400'} />
                    {!collapsed && <span>{item.name}</span>}
                  </button>
                );
              })}
            </div>
          )}

        </nav>
      </div>

      {/* Footer / Log out */}
      <div className="p-3 border-t border-slate-800 shrink-0">
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
