import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { DataProvider } from './context/DataContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Journal from './pages/Journal';
import Leaderboard from './pages/Leaderboard';
import StudentProfile from './pages/StudentProfile';
import AdminManagement from './pages/AdminManagement';
import PointHistory from './pages/PointHistory';
import Attendance from './pages/Attendance';
import LessonPlans from './pages/LessonPlans';
import SferaAi from './pages/SferaAi';
import Leads from './pages/Leads';
import Finance from './pages/Finance';
import AuditLogs from './pages/AuditLogs';
import Schedule from './pages/Schedule';
import Reports from './pages/Reports';
import CashierDesk from './pages/CashierDesk';
import Expenses from './pages/Expenses';
import TestModeBanner from './components/TestModeBanner';
import { LogIn, ShieldAlert, Award, Star, X, AlertTriangle, Search, Sun, Moon } from 'lucide-react';
import axios from 'axios';
import CustomSelect from './components/CustomSelect';

function AppContent() {
  const { token, user, login, logout, loading } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState(null);

  // Automatically force Operator to Leads and Cashier to CashierDesk
  useEffect(() => {
    if (user?.role === 'OPERATOR') {
      setCurrentPage('leads');
    } else if (user?.role === 'CASHIER') {
      setCurrentPage('cashier');
    } else if (user?.role === 'ACCOUNTANT') {
      setCurrentPage('expenses');
    }
  }, [user]);

  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [showQuickAwardModal, setShowQuickAwardModal] = useState(false);
  const [quickAwardForm, setQuickAwardForm] = useState({
    studentId: '',
    pointRuleId: '',
    points: '',
    description: '',
    quantity: 1
  });
  const [allStudents, setAllStudents] = useState([]);
  const [pointRules, setPointRules] = useState([]);
  const [quickAwardLoading, setQuickAwardLoading] = useState(false);
  const [quickAwardSuccess, setQuickAwardSuccess] = useState('');
  const [quickAwardError, setQuickAwardError] = useState('');

  const [studentSearchQuery, setStudentSearchQuery] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);

  const handleOpenQuickAward = () => {
    setQuickAwardSuccess('');
    setQuickAwardError('');
    setQuickAwardForm({
      studentId: '',
      pointRuleId: '',
      points: '',
      description: '',
      quantity: 1
    });
    setStudentSearchQuery('');
    setSelectedStudent(null);
    setShowQuickAwardModal(true);

    axios.get('/api/students')
      .then(res => {
        const sorted = res.data.sort((a, b) => a.fullName.localeCompare(b.fullName));
        setAllStudents(sorted);
      })
      .catch(err => console.error("Error loading students for quick award", err));

    axios.get('/api/transactions/rules')
      .then(res => {
        setPointRules(res.data);
      })
      .catch(err => console.error("Error loading point rules for quick award", err));
  };

  const handleRuleChange = (ruleId) => {
    const selectedRule = pointRules.find(r => r.id.toString() === ruleId.toString());
    if (selectedRule) {
      setQuickAwardForm(prev => ({
        ...prev,
        pointRuleId: ruleId,
        points: selectedRule.points,
        description: selectedRule.name,
        quantity: 1
      }));
    } else {
      setQuickAwardForm(prev => ({
        ...prev,
        pointRuleId: ruleId,
        points: '',
        description: '',
        quantity: 1
      }));
    }
  };

  const handleQuantityChange = (qty) => {
    if (qty === '') {
      setQuickAwardForm(prev => ({
        ...prev,
        quantity: '',
        points: 0
      }));
      return;
    }
    const parsedQty = parseInt(qty);
    if (isNaN(parsedQty)) return;

    const selectedRule = pointRules.find(r => r.id.toString() === quickAwardForm.pointRuleId.toString());
    const basePoints = selectedRule ? selectedRule.points : 0;
    setQuickAwardForm(prev => ({
      ...prev,
      quantity: parsedQty,
      points: basePoints * parsedQty
    }));
  };

  const filteredStudents = allStudents.filter(s =>
    s.fullName.toLowerCase().includes(studentSearchQuery.toLowerCase())
  );

  const handleQuickAwardSubmit = (e) => {
    e.preventDefault();
    if (!quickAwardForm.studentId || !quickAwardForm.pointRuleId) {
      setQuickAwardError("Iltimos, o'quvchi va kategoriyani tanlang.");
      return;
    }

    setQuickAwardLoading(true);
    setQuickAwardError('');
    setQuickAwardSuccess('');

    axios.post('/api/transactions', {
      studentId: quickAwardForm.studentId,
      pointRuleId: quickAwardForm.pointRuleId,
      points: quickAwardForm.points !== '' ? parseInt(quickAwardForm.points) : null,
      description: quickAwardForm.description,
      quantity: quickAwardForm.quantity
    })
      .then(() => {
        setQuickAwardSuccess("Ball muvaffaqiyatli saqlandi!");
        setRefreshTrigger(prev => prev + 1);
        setTimeout(() => {
          setShowQuickAwardModal(false);
          setQuickAwardSuccess('');
        }, 1200);
      })
      .catch(err => {
        console.error(err);
        setQuickAwardError(err.response?.data || "Operatsiyani bajarishda xatolik yuz berdi.");
      })
      .finally(() => {
        setQuickAwardLoading(false);
      });
  };

  // Login Form State
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLoginError('');
    setLoginLoading(true);

    try {
      const success = await login(username, password);
      if (success) {
        setCurrentPage('dashboard');
      }
    } catch (err) {
      console.error(err);
      setLoginError("Foydalanuvchi nomi yoki parol noto'g'ri!");
    } finally {
      setLoginLoading(false);
    }
  };

  // 1. Loading State
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-indigo-400">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-indigo-500 border-r-2"></div>
          <span className="text-sm font-semibold tracking-wider uppercase animate-pulse">Yuklanmoqda...</span>
        </div>
      </div>
    );
  }

  // 2. Unauthenticated Login Screen
  if (!token || !user) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col justify-between relative overflow-hidden">
        {/* Top Test Mode Banner */}
        <TestModeBanner />

        <div className="flex-1 flex items-center justify-center p-4 relative overflow-hidden">
          {/* Abstract Glowing Background Orbs */}
          <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-indigo-600/10 blur-[120px] pointer-events-none animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-cyan-600/10 blur-[120px] pointer-events-none animate-pulse delay-75"></div>

          <div className="max-w-md w-full relative z-10 space-y-6">
            {/* Logo Header */}
            <div className="text-center space-y-2">
              <div className="w-16 h-16 rounded-2xl bg-indigo-600 flex items-center justify-center font-black text-2xl text-white shadow-xl shadow-indigo-600/30 mx-auto">
                S
              </div>
              <h1 className="text-3xl font-black tracking-wider text-slate-100">SFERA GAMIFICATION</h1>
              <p className="text-sm text-slate-400 font-medium">Sfera IT Academy talabalar reytingi nazorati</p>
            </div>

            {/* Login Card */}
            <div className="bg-slate-900/40 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 shadow-2xl relative">
              <div className="flex items-center gap-2 mb-6">
                <LogIn className="text-indigo-400" size={20} />
                <h2 className="text-lg font-bold text-slate-100">Tizimga Kirish</h2>
              </div>

              {loginError && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-center gap-2 text-rose-400 text-xs font-semibold mb-6 animate-fadeIn">
                  <ShieldAlert size={16} />
                  <span>{loginError}</span>
                </div>
              )}

              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wide">Foydalanuvchi nomi</label>
                  <input
                    type="text"
                    required
                    placeholder="admin yoki mentor..."
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full h-11 px-4 bg-slate-950/60 border border-slate-850 rounded-xl text-slate-200 focus:outline-none focus:border-indigo-500 text-sm font-semibold transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wide">Parol</label>
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full h-11 px-4 bg-slate-950/60 border border-slate-850 rounded-xl text-slate-200 focus:outline-none focus:border-indigo-500 text-sm transition-all"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loginLoading}
                  className="w-full h-11 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-650 text-white font-bold rounded-xl shadow-lg shadow-indigo-600/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer mt-6"
                >
                  {loginLoading ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-white mr-2"></div>
                  ) : (
                    <span>Kirish</span>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 3. Authenticated Layout Panel
  const renderPage = () => {
    if (user?.role === 'OPERATOR') {
      return <Leads refreshTrigger={refreshTrigger} setCurrentPage={setCurrentPage} setSelectedStudentId={setSelectedStudentId} />;
    }
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard refreshTrigger={refreshTrigger} />;
      case 'schedule':
        return <Schedule refreshTrigger={refreshTrigger} setCurrentPage={setCurrentPage} />;
      case 'leads':
        return <Leads refreshTrigger={refreshTrigger} setCurrentPage={setCurrentPage} setSelectedStudentId={setSelectedStudentId} />;
      case 'journal':
        return <Journal refreshTrigger={refreshTrigger} />;
      case 'davomat':
        return <Attendance refreshTrigger={refreshTrigger} />;
      case 'leaderboard':
        return <Leaderboard setCurrentPage={setCurrentPage} setSelectedStudentId={setSelectedStudentId} refreshTrigger={refreshTrigger} />;
      case 'students':
        return <AdminManagement key="students" activeSubTab="students" refreshTrigger={refreshTrigger} />;
      case 'groups':
        return <AdminManagement key="groups" activeSubTab="groups" refreshTrigger={refreshTrigger} />;
      case 'courses':
        return <AdminManagement key="courses" activeSubTab="courses" refreshTrigger={refreshTrigger} />;
      case 'rooms':
        return <AdminManagement key="rooms" activeSubTab="rooms" refreshTrigger={refreshTrigger} />;
      case 'cashier':
        return <CashierDesk refreshTrigger={refreshTrigger} />;
      case 'expenses':
        return <Expenses refreshTrigger={refreshTrigger} />;
      case 'finance':
        return <Finance refreshTrigger={refreshTrigger} />;
      case 'reports':
        return <Reports refreshTrigger={refreshTrigger} />;
      case 'audit-logs':
        return <AuditLogs refreshTrigger={refreshTrigger} />;
      case 'mentors':
        return <AdminManagement key="mentors" activeSubTab="mentors" refreshTrigger={refreshTrigger} />;
      case 'admins':
        return <AdminManagement key="admins" activeSubTab="admins" refreshTrigger={refreshTrigger} />;
      case 'history':
        return <PointHistory refreshTrigger={refreshTrigger} />;
      case 'lessonplans':
        return <LessonPlans />;
      case 'sfera-ai':
        return <SferaAi />;
      case 'profile':
        return <StudentProfile studentId={selectedStudentId} setCurrentPage={setCurrentPage} refreshTrigger={refreshTrigger} />;
      default:
        return <Dashboard refreshTrigger={refreshTrigger} />;
    }
  };

  return (
    <div className="flex flex-col bg-slate-950 text-slate-100 min-h-screen font-sans overflow-hidden">
      {/* Top Test Mode Banner for All Roles */}
      <TestModeBanner />

      <div className="flex flex-1 h-[calc(100vh-34px)] overflow-hidden">
        {/* Sidebar Panel */}
        <Sidebar 
          currentPage={currentPage} 
          setCurrentPage={setCurrentPage} 
          collapsed={sidebarCollapsed} 
          setCollapsed={setSidebarCollapsed} 
        />

      {/* Main Panel Area */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Top Header bar */}
        <header className="h-16 border-b border-slate-900 bg-slate-900/30 backdrop-blur px-6 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Tizim:</span>
            <span className="text-xs font-bold text-slate-300">Sfera IT Academy Gamifikatsiya Tizimi</span>
          </div>

          <div className="flex items-center gap-4">
            {(user.role === 'SUPER_ADMIN' || user.role === 'MENTOR') && (
              <button
                onClick={handleOpenQuickAward}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-extrabold rounded-xl text-xs shadow-lg shadow-amber-500/10 active:scale-[0.98] transition-all cursor-pointer border-0"
              >
                <Award size={14} /> Tezkor Baholash
              </button>
            )}

            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              title={isDark ? "Yorug' rejimga o'tish" : "Qorong'u rejimga o'tish"}
              className="w-9 h-9 rounded-xl bg-slate-800 border border-slate-700/50 flex items-center justify-center text-slate-400 hover:text-amber-400 hover:bg-slate-700 cursor-pointer transition-all"
            >
              {isDark ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            <div className="text-right">
              <span className="block text-xs font-semibold text-slate-400">{user.fullName}</span>
              <span className="inline-block text-[9px] uppercase font-black tracking-wider text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/10 mt-0.5">
                {user.role}
              </span>
            </div>
            <div className="w-9 h-9 rounded-full bg-slate-800 flex items-center justify-center border border-slate-700/50 text-indigo-400 font-black">
              {user.fullName.charAt(0)}
            </div>
          </div>
        </header>

        {/* Dynamic Inner Page Content */}
        <main className="flex-1 overflow-y-auto overflow-x-auto bg-slate-950 custom-scrollbar">
          {renderPage()}
        </main>
        </div>
      </div>

      {/* Modal: Quick Award / Tezkor Baholash */}
      {showQuickAwardModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-fadeIn">
          <form onSubmit={handleQuickAwardSubmit} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-amber-500">
                <Award size={20} />
                <h3 className="font-extrabold text-slate-100 text-base">Tezkor Baholash</h3>
              </div>
              <button type="button" onClick={() => setShowQuickAwardModal(false)} className="text-slate-400 hover:text-slate-100 cursor-pointer border-0 bg-transparent"><X size={18} /></button>
            </div>

            {quickAwardError && <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-lg text-rose-400 text-xs font-semibold">{quickAwardError}</div>}
            {quickAwardSuccess && <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-400 text-xs font-semibold">{quickAwardSuccess}</div>}

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">O'QUVCHINI TANLANG</label>
                
                {selectedStudent ? (
                  <div className="flex items-center justify-between p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl animate-fadeIn">
                    <div className="min-w-0">
                      <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider">Tanlangan O'quvchi</span>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-sm font-bold text-slate-200 truncate">{selectedStudent.fullName}</span>
                        <span className="shrink-0 text-[10px] text-indigo-400 bg-indigo-500/10 px-1.5 py-0.5 rounded font-mono font-bold">
                          {selectedStudent.groupName || 'Guruhsiz'}
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedStudent(null);
                        setQuickAwardForm(prev => ({ ...prev, studentId: '' }));
                      }}
                      className="text-slate-400 hover:text-rose-400 cursor-pointer p-1 rounded hover:bg-slate-800 shrink-0 border-0 bg-transparent animate-pulse"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Ism yoki familiyani yozing..."
                        value={studentSearchQuery}
                        onChange={(e) => setStudentSearchQuery(e.target.value)}
                        className="w-full h-10 pl-9 pr-3 bg-slate-850 border border-slate-800 rounded-lg text-slate-200 text-sm focus:outline-none focus:border-indigo-500"
                      />
                      <Search className="absolute left-3 top-3 text-slate-500" size={14} />
                    </div>

                    {/* Autocomplete suggestions list */}
                    {studentSearchQuery.trim() !== '' && (
                      <div className="max-h-40 overflow-y-auto border border-slate-800/80 rounded-lg divide-y divide-slate-800/40 bg-slate-900 shadow-xl animate-fadeIn">
                        {filteredStudents.length === 0 ? (
                          <div className="p-3 text-xs text-slate-500 text-center">O'quvchi topilmadi</div>
                        ) : (
                          filteredStudents.map(s => (
                            <button
                              key={s.id}
                              type="button"
                              onClick={() => {
                                setSelectedStudent(s);
                                setQuickAwardForm(prev => ({ ...prev, studentId: s.id }));
                                setStudentSearchQuery('');
                              }}
                              className="w-full p-2.5 text-left text-xs font-semibold text-slate-300 hover:bg-indigo-600/20 hover:text-white transition-colors flex justify-between items-center cursor-pointer border-0 bg-transparent"
                            >
                              <span>{s.fullName}</span>
                              <span className="text-[10px] text-slate-500 font-normal">{s.groupName || 'Guruhsiz'}</span>
                            </button>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">KATEGORIYA (QOIDA)</label>
                <CustomSelect
                  value={quickAwardForm.pointRuleId}
                  onChange={handleRuleChange}
                  options={pointRules.map(r => ({ value: r.id, label: `${r.name} (${r.points > 0 ? '+' : ''}${r.points} XP)` }))}
                  placeholder="Kategoriyani tanlang"
                  className="w-full"
                />
              </div>

              {quickAwardForm.pointRuleId && (
                <div className="bg-slate-950/40 border border-slate-800/80 rounded-xl p-4 flex items-center justify-between">
                  <div className="min-w-0 pr-3">
                    <span className="text-[10px] font-bold text-slate-500 uppercase block tracking-wider">Kategoriya</span>
                    <span className="text-xs font-semibold text-slate-300 truncate block">
                      {pointRules.find(r => r.id.toString() === quickAwardForm.pointRuleId.toString())?.name}
                    </span>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-[10px] font-bold text-slate-500 uppercase block tracking-wider">Baza balli</span>
                    <span className="text-sm font-black text-indigo-400">
                      {pointRules.find(r => r.id.toString() === quickAwardForm.pointRuleId.toString())?.points > 0 ? '+' : ''}
                      {pointRules.find(r => r.id.toString() === quickAwardForm.pointRuleId.toString())?.points} XP
                    </span>
                  </div>
                </div>
              )}

              {/* Conditional rendering for Projects vs other Rules */}
              {pointRules.find(r => r.id.toString() === quickAwardForm.pointRuleId.toString())?.code === 'PROJECT' ? (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 mb-1">LOYIHALAR SONI</label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={quickAwardForm.quantity}
                      onChange={(e) => handleQuantityChange(e.target.value)}
                      className="w-full h-10 px-3 bg-slate-850 border border-slate-800 rounded-lg text-slate-200 text-sm focus:outline-none focus:border-indigo-500 font-bold"
                    />
                  </div>
                  <div className="flex flex-col justify-end">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">JAMI BERILADIGAN XP</span>
                    <span className="text-sm font-black text-amber-400 bg-amber-500/10 px-3 py-2 rounded-lg border border-amber-500/20 text-center block">
                      +{quickAwardForm.points} XP
                    </span>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {quickAwardForm.pointRuleId && (
                    <div>
                      <label className="block text-xs font-bold text-slate-400 mb-1">IZOH (IXTIYORIY)</label>
                      <input
                        type="text"
                        value={quickAwardForm.description}
                        onChange={(e) => setQuickAwardForm({ ...quickAwardForm, description: e.target.value })}
                        placeholder="Masalan: Darsda juda faol qatnashdi..."
                        className="w-full h-10 px-3 bg-slate-850 border border-slate-800 rounded-lg text-slate-200 text-sm focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="pt-4 flex gap-3">
              <button
                type="button"
                onClick={() => setShowQuickAwardModal(false)}
                className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-750 text-slate-300 font-semibold rounded-lg text-xs cursor-pointer border border-slate-700/50"
              >
                Bekor qilish
              </button>
              <button
                type="submit"
                disabled={quickAwardLoading}
                className="flex-1 py-2.5 bg-amber-600 hover:bg-amber-500 disabled:bg-amber-700 text-white font-semibold rounded-lg text-xs cursor-pointer shadow shadow-amber-500/10 border-0 flex items-center justify-center gap-1.5"
              >
                {quickAwardLoading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-white mr-1"></div>
                ) : (
                  <>
                    <Award size={14} />
                    <span>Ball yozish</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <DataProvider>
          <AppContent />
        </DataProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}
