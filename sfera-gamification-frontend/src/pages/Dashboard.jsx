import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Users, 
  PlusCircle, 
  AlertTriangle, 
  Folder, 
  Award, 
  Zap, 
  MessageSquare, 
  BookOpen, 
  Skull,
  TrendingUp,
  User,
  Calendar,
  CalendarDays,
  Landmark,
  ArrowRight,
  CheckCircle2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import AdminDashboard from './AdminDashboard';

export default function Dashboard({ refreshTrigger, setCurrentPage }) {
  const { user } = useAuth();

  if (user?.role === 'ADMIN' || user?.role === 'BRANCH_ADMIN') {
    return <AdminDashboard setCurrentPage={setCurrentPage} refreshTrigger={refreshTrigger} />;
  }

  const isStudent = user?.role === 'STUDENT';

  const [stats, setStats] = useState(null);
  const [studentData, setStudentData] = useState(null);
  const [studentFinance, setStudentFinance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const studentId = user?.studentId || user?.student?.id;
    if (isStudent && studentId) {
      setLoading(true);
      axios.get(`/api/students/${studentId}/profile`)
        .then(res => {
          setStudentData(res.data);
          setError(null);
        })
        .catch(err => {
          console.error("Student profile load error", err);
          setError("Profil ma'lumotlarini yuklashda xatolik yuz berdi.");
        })
        .finally(() => {
          setLoading(false);
        });

      // Load financial data for student
      axios.get('/api/students')
        .then(res => {
          const list = res.data || [];
          const myRec = list.find(s => String(s.id) === String(studentId)) || list.find(s => s.username === user?.username);
          if (myRec) {
            setStudentFinance(myRec);
          }
        })
        .catch(() => {});
    } else if (!isStudent) {
      fetchStats();
    } else {
      // Student logged in but studentId not yet loaded — wait
      setLoading(false);
      setError("Student profil ID si topilmadi. Qayta kiring.");
    }
  }, [refreshTrigger, user]);

  const fetchStats = () => {
    setLoading(true);
    axios.get('/api/dashboard/stats')
      .then(res => {
        setStats(res.data);
        setError(null);
      })
      .catch(err => {
        console.error("Dashboard stats error", err);
        setError("Statistikalarni yuklashda xatolik yuz berdi.");
      })
      .finally(() => {
        setLoading(false);
      });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full text-slate-400">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-indigo-500 mr-2"></div>
        Yuklanmoqda...
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-rose-400 flex flex-col items-center justify-center h-full">
        <AlertTriangle size={48} className="mb-2" />
        <p className="font-semibold text-lg">{error}</p>
        <button onClick={fetchStats} className="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg cursor-pointer">
          Qayta urinish
        </button>
      </div>
    );
  }

  if (isStudent) {
    if (!studentData) {
      return (
        <div className="flex items-center justify-center h-full text-slate-400">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-indigo-500 mr-2"></div>
          Profil ma'lumotlari yuklanmoqda...
        </div>
      );
    }

    const breakdown = studentData.breakdown || {};
    const history = studentData.history || [];
    const recentTx = studentData.transactions || [];

    const categories = [
      { name: "Uyga vazifa", xp: breakdown.homework, icon: BookOpen, color: "text-emerald-400 border-emerald-500/20 bg-emerald-500/10" },
      { name: "Davomat", xp: breakdown.attendance, icon: Calendar, color: "text-blue-400 border-blue-500/20 bg-blue-500/10" },
      { name: "Loyihalar", xp: breakdown.projects, icon: Award, color: "text-amber-400 border-amber-500/20 bg-amber-500/10" },
      { name: "Savol-javob", xp: breakdown.qa, icon: MessageSquare, color: "text-purple-400 border-purple-500/20 bg-purple-500/10" },
      { name: "Aktivlik", xp: breakdown.activity, icon: Zap, color: "text-indigo-400 border-indigo-500/20 bg-indigo-500/10" },
      { name: "Jarimalar", xp: breakdown.penalties, icon: Skull, color: "text-rose-400 border-rose-500/20 bg-rose-500/10" }
    ];

    const chartHeight = 160;
    const chartWidth = 480;
    const maxVal = Math.max(...history.map(h => h.xp), 100);
    const minVal = Math.min(...history.map(h => h.xp), 0);
    const range = maxVal - minVal || 10;

    const points = history.map((item, idx) => {
      const x = idx === 0 ? 35 : 35 + (idx * ((chartWidth - 55) / (history.length - 1)));
      const y = chartHeight - (((item.xp - minVal) / range) * (chartHeight - 40)) - 15;
      return { x, y, xp: item.xp, date: item.date };
    });

    const polylinePoints = points.map(p => `${p.x},${p.y}`).join(' ');
    const areaPoints = points.length > 0 
      ? `35,${chartHeight - 15} ` + polylinePoints + ` ${points[points.length - 1].x},${chartHeight - 15}` 
      : '';

    return (
      <div className="p-6 space-y-6 overflow-y-auto max-h-[calc(100vh-4rem)]">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white">Salom, {studentData.firstName}! 👋</h1>
          <p className="text-sm text-slate-400 mt-1">Sfera IT Academy talabalar reytingi va yutuqlar portali</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col lg:flex-row items-center justify-between gap-6 shadow-lg animate-fadeIn">
          <div className="flex flex-col sm:flex-row items-center gap-5">
            <div className="w-16 h-16 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-xl shadow-indigo-500/25 border border-indigo-400/20">
              <User size={32} />
            </div>
            <div className="text-center sm:text-left space-y-1">
              <h2 className="text-xl font-extrabold text-white leading-tight">{studentData.fullName}</h2>
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-400 bg-slate-850 border border-slate-800 px-2 py-0.5 rounded uppercase">
                  Guruh: {studentData.groupName}
                </span>
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-400 bg-slate-850 border border-slate-800 px-2 py-0.5 rounded uppercase">
                  Kurs: {studentData.courseName}
                </span>
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-400 bg-slate-850 border border-slate-800 px-2 py-0.5 rounded">
                  Mentor: {studentData.mentorName}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-6 divide-x divide-slate-800 border-t lg:border-t-0 pt-4 lg:pt-0 w-full lg:w-auto justify-around shrink-0">
            <div className="text-center px-4">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">GURUHIDAGI O'RNI</span>
              <span className="text-2xl font-black text-amber-400 tracking-tight block mt-1">
                #{studentData.groupRank}
              </span>
            </div>
            <div className="text-center px-4 pl-6">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">UMUMIY O'RNI</span>
              <span className="text-2xl font-black text-indigo-400 tracking-tight block mt-1">
                #{studentData.rank}
              </span>
            </div>
            <div className="text-center px-4 pl-6">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">JAMI BALL</span>
              <span className="text-2xl font-black text-emerald-400 tracking-tight block mt-1">
                {studentData.totalXp} XP
              </span>
            </div>
          </div>
        </div>

        {/* Student Personal Financial Status Card */}
        {studentFinance && (
          <div className="bg-gradient-to-r from-slate-900 via-emerald-950/20 to-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl flex flex-col md:flex-row items-center justify-between gap-4 animate-fadeIn">
            <div className="flex items-center gap-3.5 w-full md:w-auto">
              <div className="w-11 h-11 rounded-2xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0 shadow-lg shadow-emerald-500/10">
                <Landmark size={22} />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-base font-bold text-white">Mening To'lovlarim & Moliya</h3>
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${
                    studentFinance.balanceDue === 0 
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' 
                      : 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                  }`}>
                    {studentFinance.balanceDue === 0 ? "Qarzdorlik yo'q ✓" : "Qarzdorlik mavjud ⚠️"}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Kurs: {studentFinance.groupName || studentData.groupName} — Oylik to'lov: {Number(studentFinance.coursePrice || 0).toLocaleString()} UZS
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 sm:gap-6 w-full md:w-auto justify-between md:justify-end border-t md:border-t-0 pt-3 md:pt-0 border-slate-800">
              <div>
                <span className="text-[10px] font-bold text-slate-500 uppercase block">Jami To'langan</span>
                <span className="text-sm sm:text-base font-black text-emerald-400 font-mono">
                  {Number(studentFinance.totalPaid || 0).toLocaleString()} UZS
                </span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-500 uppercase block">Qarzdorlik</span>
                <span className={`text-sm sm:text-base font-black font-mono ${
                  studentFinance.balanceDue > 0 ? 'text-rose-400' : 'text-emerald-400'
                }`}>
                  {Number(studentFinance.balanceDue || 0).toLocaleString()} UZS
                </span>
              </div>
              <button
                onClick={() => setCurrentPage && setCurrentPage('finance')}
                className="px-3.5 sm:px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-emerald-600/20 cursor-pointer flex items-center gap-1.5 shrink-0"
              >
                <span>To'liq Tarix</span>
                <ArrowRight size={13} />
              </button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg flex flex-col justify-between animate-fadeIn">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Award size={18} className="text-indigo-400" />
                Ballar Taqsimoti
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">Faoliyat turlari bo'yicha to'plangan XP</p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-5">
              {categories.map((c, idx) => {
                const Icon = c.icon;
                const sign = c.name === 'Jarimalar' ? '' : '+';
                return (
                  <div key={idx} className="p-4 rounded-xl bg-slate-850 border border-slate-800/60 flex flex-col justify-between h-24 hover:border-slate-700 transition-all duration-150">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-400">{c.name}</span>
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center border ${c.color}`}>
                        <Icon size={14} />
                      </div>
                    </div>
                    <h4 className={`text-lg font-black tracking-tight ${
                      c.name === 'Jarimalar' ? 'text-rose-400' : 'text-slate-200'
                    }`}>
                      {sign}{c.xp} XP
                    </h4>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg flex flex-col justify-between animate-fadeIn">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <TrendingUp size={18} className="text-emerald-400" />
                Rivojlanish Grafigi
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">Vaqt o'tishi bilan XP to'planish ko'rsatkichi</p>
            </div>

            <div className="relative w-full flex justify-center py-4">
              {history.length < 2 ? (
                <div className="h-32 flex items-center justify-center text-slate-500 text-xs">Rivojlanish grafigi uchun ma'lumotlar kam</div>
              ) : (
                <svg 
                  height={chartHeight} 
                  width={chartWidth}
                  className="overflow-visible animate-fadeIn"
                >
                  <defs>
                    <linearGradient id="areaGradStudent" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#4f46e5" stopOpacity="0.25" />
                      <stop offset="100%" stopColor="#4f46e5" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>

                  {[0, 0.5, 1].map((p, idx) => {
                    const y = chartHeight - (p * (chartHeight - 40)) - 15;
                    const label = Math.round(minVal + p * range);
                    return (
                      <g key={idx}>
                        <line x1="35" y1={y} x2="100%" y2={y} stroke="#1e293b" strokeWidth="1" strokeDasharray="4" />
                        <text x="5" y={y + 3} fill="#64748b" className="text-[9px] font-bold">{label}</text>
                      </g>
                    );
                  })}

                  {areaPoints && (
                    <polygon points={areaPoints} fill="url(#areaGradStudent)" />
                  )}

                  <polyline 
                    fill="none" 
                    stroke="#4f46e5" 
                    strokeWidth="3" 
                    points={polylinePoints} 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                    className="drop-shadow-[0_2px_6px_rgba(99,102,241,0.3)]"
                  />

                  {points.map((p, i) => (
                    <g key={i} className="group/dot cursor-pointer">
                      <circle 
                        cx={p.x} 
                        cy={p.y} 
                        r="3" 
                        fill="#4f46e5" 
                        stroke="#0f172a" 
                        strokeWidth="1.5" 
                        className="transition-all group-hover/dot:r-5"
                      />
                      <rect 
                        x={p.x - 25} 
                        y={p.y - 28} 
                        width="50" 
                        height="16" 
                        rx="3" 
                        fill="#0f172a" 
                        stroke="#334155" 
                        className="opacity-0 group-hover/dot:opacity-100 transition-opacity duration-150 pointer-events-none"
                      />
                      <text 
                        x={p.x} 
                        y={p.y - 17} 
                        fill="#f8fafc" 
                        className="text-[8px] font-black text-center opacity-0 group-hover/dot:opacity-100 transition-opacity duration-150 pointer-events-none"
                        textAnchor="middle"
                      >
                        {p.xp} XP
                      </text>
                    </g>
                  ))}
                </svg>
              )}
            </div>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg animate-fadeIn">
          <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-4">
            <CalendarDays size={18} className="text-indigo-400" />
            Oxirgi Olingan Ballar
          </h3>
          <div className="overflow-x-auto">
            {recentTx.length === 0 ? (
              <p className="text-slate-500 text-sm text-center py-4">Sizda hali ballar tarixi mavjud emas.</p>
            ) : (
              <table className="w-full text-left text-xs font-semibold">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-500">
                    <th className="pb-3 font-bold uppercase tracking-wider">Sana</th>
                    <th className="pb-3 font-bold uppercase tracking-wider">Sabab / Kategoriya</th>
                    <th className="pb-3 font-bold uppercase tracking-wider">Berilgan Ball</th>
                    <th className="pb-3 font-bold uppercase tracking-wider">Mentor</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850">
                  {recentTx.slice(0, 6).map((tx) => (
                    <tr key={tx.id} className="text-slate-300">
                      <td className="py-3.5 font-mono">{tx.date}</td>
                      <td className="py-3.5 font-bold text-slate-200">{tx.description}</td>
                      <td className="py-3.5">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-black font-mono ${
                          tx.points > 0 ? 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/20' : 'text-rose-400 bg-rose-500/10 border border-rose-500/20'
                        }`}>
                          {tx.points > 0 ? '+' : ''}{tx.points} XP
                        </span>
                      </td>
                      <td className="py-3.5 text-slate-400">{tx.mentorName}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    );
  }

  const isSuperAdmin = user?.role === 'SUPER_ADMIN';
  const isMentor = user?.role === 'MENTOR';

  const kpiCards = [
    { title: "JAMI O'QUVCHILAR", value: stats.totalStudents, icon: Users, color: "from-blue-600 to-indigo-600", glow: "shadow-blue-500/10" },
    { title: "BUGUN BERILGAN BALL", value: `+${stats.pointsGivenToday} XP`, icon: PlusCircle, color: "from-emerald-600 to-teal-600", glow: "shadow-emerald-500/10" },
    { title: "BUGUNGI JARIMALAR", value: `-${stats.penaltiesGivenToday} XP`, icon: AlertTriangle, color: "from-rose-600 to-red-600", glow: "shadow-rose-500/10" },
    { title: "JAMI GURUHLAR", value: stats.totalGroups, icon: Folder, color: "from-amber-600 to-orange-600", glow: "shadow-amber-500/10" }
  ];

  // Extra admin/super-admin KPI cards
  const adminKpiCards = (isSuperAdmin || user?.role === 'ADMIN') ? [
    { title: "XODIMLAR", value: stats.staffCount ?? '—', icon: User, color: "from-purple-600 to-violet-600", glow: "shadow-purple-500/10" },
    { title: "YANGI LEADLAR", value: stats.newLeadsCount ?? '—', icon: TrendingUp, color: "from-sky-600 to-cyan-600", glow: "shadow-sky-500/10" },
    { title: "TO'LOV QILDI", value: stats.paidStudentsCount ?? '—', icon: CalendarDays, color: "from-emerald-600 to-green-700", glow: "shadow-emerald-500/10" },
    { title: "QARZDORLAR", value: stats.debtorStudentsCount ?? '—', icon: AlertTriangle, color: "from-orange-600 to-red-600", glow: "shadow-orange-500/10" },
  ] : [];


  const achievements = [
    { title: "HOMEWORK MASTER", leader: stats.homeworkLeader, icon: BookOpen, desc: "Uyga vazifani eng ko'p bajargan", color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" },
    { title: "SAVOL-JAVOB LEADER", leader: stats.qaLeader, icon: MessageSquare, desc: "Savol-javobda eng ko'p ball olgan", color: "text-blue-400 bg-blue-500/10 border-blue-500/20" },
    { title: "ENG KO'P LOYIHA QILGAN", leader: stats.projectLeader, icon: Award, desc: "Darsdan tashqari loyiha qilgan", color: "text-amber-400 bg-amber-500/10 border-amber-500/20" },
    { title: "ENG AKTIV O'QUVCHI", leader: stats.activityLeader, icon: Zap, desc: "Aktivlik bo'yicha eng faol", color: "text-purple-400 bg-purple-500/10 border-purple-500/20" },
    { title: "ENG KO'P JARIMA OLGAN", leader: stats.penaltyLeader, icon: Skull, desc: "Eng ko'p jarima ball olgan", color: "text-rose-400 bg-rose-500/10 border-rose-500/20" }
  ];

  // SVG Chart Dimensions & Computations
  const groupRatings = stats.groupRatings || [];
  const maxAverageXp = Math.max(...groupRatings.map(g => g.averageXp), 10);
  const chartHeight = 220;
  const chartWidth = 500;
  const barWidth = 36;
  const gap = 40;

  return (
    <div className="p-6 space-y-8 overflow-y-auto max-h-[calc(100vh-4rem)]">
      {/* Page Title */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-white">Dashboard</h1>
        <p className="text-sm text-slate-400 mt-1">Sfera IT Academy gamifikatsiya va ball nazorati tahlili</p>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpiCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div 
              key={idx} 
              className={`bg-slate-900 border border-slate-800/80 rounded-2xl p-6 flex items-center justify-between shadow-lg ${card.glow} hover:border-slate-700/80 transition-all duration-200`}
            >
              <div>
                <span className="text-xs font-bold text-slate-400 tracking-wider uppercase">{card.title}</span>
                <h3 className="text-2xl font-black text-white mt-2 tracking-tight">{card.value}</h3>
              </div>
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${card.color} flex items-center justify-center text-white shadow-lg`}>
                <Icon size={22} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Extra Admin KPI Cards */}
      {adminKpiCards.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {adminKpiCards.map((card, idx) => {
            const Icon = card.icon;
            return (
              <div
                key={idx}
                className={`bg-slate-900/60 border border-slate-800/60 rounded-2xl p-5 flex items-center justify-between shadow ${card.glow} hover:border-slate-700 transition-all`}
              >
                <div>
                  <span className="text-[10px] font-bold text-slate-500 tracking-wider uppercase">{card.title}</span>
                  <h3 className="text-xl font-black text-white mt-1 tracking-tight">{card.value}</h3>
                </div>
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${card.color} flex items-center justify-center text-white`}>
                  <Icon size={18} />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Main Charts & Leaders Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* SVG Group Ratings Chart */}
        <div className="bg-slate-900 border border-slate-800/80 rounded-2xl p-6 xl:col-span-2 flex flex-col justify-between shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <TrendingUp size={18} className="text-indigo-400" />
                Guruhlar Reytingi (O'rtacha XP)
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">Faol guruhlar o'rtacha olingan ballari</p>
            </div>
          </div>

          <div className="relative w-full overflow-x-auto flex justify-center py-4">
            {groupRatings.length === 0 ? (
              <div className="h-48 flex items-center justify-center text-slate-500 text-sm">Guruhlar mavjud emas</div>
            ) : (
              <svg 
                height={chartHeight + 40} 
                width={Math.max(chartWidth, groupRatings.length * (barWidth + gap) + 40)}
                className="overflow-visible"
              >
                {/* Grid Lines */}
                {[0, 0.25, 0.5, 0.75, 1].map((p, idx) => {
                  const y = chartHeight - (p * chartHeight) + 10;
                  const label = Math.round(p * maxAverageXp);
                  return (
                    <g key={idx}>
                      <line 
                        x1="30" 
                        y1={y} 
                        x2="100%" 
                        y2={y} 
                        stroke="#1e293b" 
                        strokeWidth="1" 
                        strokeDasharray="4"
                      />
                      <text x="5" y={y + 4} fill="#64748b" className="text-[10px] font-bold">{label}</text>
                    </g>
                  );
                })}

                {/* Bars */}
                {groupRatings.map((g, i) => {
                  const barHeight = (g.averageXp / maxAverageXp) * chartHeight;
                  const x = 50 + i * (barWidth + gap);
                  const y = chartHeight - barHeight + 10;

                  return (
                    <g key={g.id} className="group/bar cursor-pointer">
                      {/* Gradient Def */}
                      <defs>
                        <linearGradient id={`grad-${g.id}`} x1="0%" y1="0%" x2="0%" y2="100%">
                          <stop offset="0%" stopColor="#4f46e5" />
                          <stop offset="100%" stopColor="#06b6d4" />
                        </linearGradient>
                      </defs>

                      {/* Tooltip on Hover */}
                      <rect 
                        x={x - 10} 
                        y={y - 25} 
                        width={barWidth + 20} 
                        height="20" 
                        rx="4" 
                        fill="#0f172a" 
                        stroke="#334155"
                        className="opacity-0 group-hover/bar:opacity-100 transition-opacity duration-200 pointer-events-none"
                      />
                      <text 
                        x={x + barWidth/2} 
                        y={y - 12} 
                        fill="#f8fafc" 
                        className="text-[10px] font-bold text-center opacity-0 group-hover/bar:opacity-100 transition-opacity duration-200 pointer-events-none"
                        textAnchor="middle"
                      >
                        {g.averageXp} XP
                      </text>

                      {/* Actual Bar */}
                      <rect 
                        x={x} 
                        y={y} 
                        width={barWidth} 
                        height={barHeight} 
                        rx="6" 
                        fill={`url(#grad-${g.id})`}
                        className="transition-all duration-300 hover:brightness-110 shadow-lg shadow-indigo-500/20"
                      />

                      {/* X Label */}
                      <text 
                        x={x + barWidth/2} 
                        y={chartHeight + 25} 
                        fill="#94a3b8" 
                        className="text-[9px] font-bold"
                        textAnchor="middle"
                      >
                        {g.name.split(' ')[0]}
                      </text>
                      <text 
                        x={x + barWidth/2} 
                        y={chartHeight + 36} 
                        fill="#64748b" 
                        className="text-[8px]"
                        textAnchor="middle"
                      >
                        {g.name.split(' ')[1] || ''}
                      </text>
                    </g>
                  );
                })}
              </svg>
            )}
          </div>
        </div>

        {/* Top 5 Students Widget */}
        <div className="bg-slate-900 border border-slate-800/80 rounded-2xl p-6 flex flex-col justify-between shadow-lg">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Award size={18} className="text-amber-400" />
              TOP 5 O'QUVCHILAR
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">Eng yuqori natija qayd etgan talabalar</p>
          </div>

          <div className="mt-4 flex-1 space-y-3">
            {stats.top5.length === 0 ? (
              <div className="h-full flex items-center justify-center text-slate-500 text-sm">O'quvchilar reytingi bo'sh</div>
            ) : (
              stats.top5.map((student, idx) => (
                <div key={student.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-850 border border-slate-800/50">
                  <div className="flex items-center gap-3">
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black ${
                      idx === 0 ? 'bg-amber-400/10 text-amber-400 border border-amber-400/20' :
                      idx === 1 ? 'bg-slate-300/10 text-slate-300 border border-slate-300/20' :
                      idx === 2 ? 'bg-orange-400/10 text-orange-400 border border-orange-400/20' :
                      'bg-slate-800 text-slate-400'
                    }`}>
                      {idx + 1}
                    </span>
                    <span className="font-semibold text-slate-200 text-sm">{student.fullName}</span>
                  </div>
                  <span className="text-xs font-black text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-1 rounded-lg">
                    {student.xp} XP
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Special Achievements Panel */}
      <div>
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <Zap size={18} className="text-indigo-400" />
          Maxsus Yo'nalish Chempionlari
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
          {achievements.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div 
                key={idx} 
                className={`bg-slate-900 border border-slate-800/80 rounded-2xl p-5 flex flex-col justify-between hover:scale-[1.02] transition-all duration-150 shadow-md`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">{item.title}</span>
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center border ${item.color}`}>
                    <Icon size={16} />
                  </div>
                </div>
                
                <div className="mt-4">
                  <h4 className="text-base font-bold text-slate-100 truncate">{item.leader.fullName}</h4>
                  <p className="text-[10px] text-slate-400 mt-1">{item.desc}</p>
                </div>
                
                <div className="mt-3 pt-3 border-t border-slate-800/50 flex items-center justify-between text-xs">
                  <span className="text-slate-500">Natija:</span>
                  <span className="font-extrabold text-indigo-400">
                    {item.title === "ENG KO'P JARIMA OLGAN" ? `-${item.leader.value} XP` :
                     item.title === "ENG KO'P LOYIHA QILGAN" ? `${item.leader.value} ta` :
                     `+${item.leader.value} marta`}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
