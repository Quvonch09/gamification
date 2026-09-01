import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { 
  Users, 
  AlertCircle, 
  Landmark, 
  CalendarCheck, 
  FolderGit, 
  GraduationCap, 
  DoorOpen, 
  BookOpen, 
  UserCheck, 
  PhoneCall, 
  Clock, 
  Sparkles, 
  ArrowRight, 
  RefreshCw, 
  Phone, 
  TrendingUp, 
  CheckCircle2,
  CalendarDays,
  CreditCard,
  Printer
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function AdminDashboard({ setCurrentPage }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('OVERVIEW'); // 'OVERVIEW' | 'DEBTORS' | 'ACADEMIC' | 'PAYMENTS'

  // Data states
  const [students, setStudents] = useState([]);
  const [groups, setGroups] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [courses, setCourses] = useState([]);
  const [payments, setPayments] = useState([]);
  const [absentees, setAbsentees] = useState([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [stdRes, grpRes, rmRes, crsRes, payRes, notifRes] = await Promise.all([
        axios.get('/api/students').catch(() => ({ data: [] })),
        axios.get('/api/groups').catch(() => ({ data: [] })),
        axios.get('/api/rooms').catch(() => ({ data: [] })),
        axios.get('/api/courses').catch(() => ({ data: [] })),
        axios.get('/api/finance/payments').catch(() => ({ data: [] })),
        axios.get('/api/notifications').catch(() => ({ data: [] }))
      ]);

      const stdList = stdRes.data || [];
      setStudents(stdList);
      setGroups(grpRes.data || []);
      setRooms(rmRes.data || []);
      setCourses(crsRes.data || []);
      setPayments(payRes.data || []);

      // Extract absent student calls from notifications
      const notifs = notifRes.data || [];
      const calls = notifs
        .filter(n => n.type === 'ABSENT_STUDENT_CALL')
        .map(n => {
          let meta = {};
          try { meta = JSON.parse(n.metadataJson || '{}'); } catch(e) {}
          return {
            id: n.id,
            title: n.title,
            message: n.message,
            read: n.read,
            createdAt: n.createdAt,
            studentName: meta.studentName || n.title,
            parentPhone: meta.parentPhone || meta.phone,
            phone: meta.phone,
            groupName: meta.group || '-'
          };
        });
      setAbsentees(calls);

    } catch (err) {
      console.error("Error loading admin dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  // KPIs
  const stats = useMemo(() => {
    let totalDebt = 0;
    let debtorCount = 0;
    let todayIncome = 0;

    students.forEach(s => {
      const due = Number(s.balanceDue || 0);
      if (due > 0) {
        totalDebt += due;
        debtorCount++;
      }
    });

    const todayStr = new Date().toISOString().slice(0, 10);
    payments.forEach(p => {
      const pDate = (p.paymentDate || p.createdAt || '').slice(0, 10);
      if (pDate === todayStr) {
        todayIncome += Number(p.amount || 0);
      }
    });

    return {
      totalStudents: students.length,
      debtorCount,
      totalDebt,
      todayIncome,
      activeGroups: groups.length,
      totalRooms: rooms.length,
      absentCallCount: absentees.filter(a => !a.read).length
    };
  }, [students, groups, rooms, payments, absentees]);

  return (
    <div className="p-3 sm:p-6 max-w-7xl mx-auto space-y-4 sm:space-y-6 animate-fadeIn font-sans">
      {/* Admin Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-slate-800 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-2xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                Administrator Nazorat Paneli
              </span>
              <span className="text-[11px] sm:text-xs text-slate-400 font-mono">
                {new Date().toLocaleDateString('uz-UZ', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </span>
            </div>
            <h1 className="text-xl sm:text-3xl font-black text-white tracking-tight mt-1.5 flex items-center gap-2">
              Xush kelibsiz, {user?.fullName || "Administrator"} 👋
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl">
              O'quv markazining to'liq operatsion nazorati: o'quvchilar, kassa tushumlari, qarzdorliklar, darslar va akademik jarayonlar.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => setCurrentPage('cashier')}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg shadow-emerald-600/30 transition-all cursor-pointer"
            >
              <CreditCard size={15} />
              Kassaga O'tish
            </button>

            <button
              onClick={() => setCurrentPage('debtors')}
              className="px-4 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg shadow-rose-600/30 transition-all cursor-pointer"
            >
              <AlertCircle size={15} />
              Qarzdorlar
            </button>

            <button
              onClick={loadDashboardData}
              className="p-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 rounded-xl cursor-pointer transition-all"
              title="Yangilash"
            >
              <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Students */}
        <div 
          onClick={() => setCurrentPage('students')}
          className="bg-slate-900 border border-slate-800 hover:border-indigo-500/40 rounded-2xl p-5 shadow-xl transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Jami O'quvchilar</span>
            <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Users size={18} />
            </div>
          </div>
          <div className="text-2xl font-black text-white font-mono">
            {stats.totalStudents} <span className="text-xs text-slate-400 font-normal">nafar</span>
          </div>
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-800/80">
            <span className="text-[11px] text-slate-500">Ro'yxatni ko'rish</span>
            <ArrowRight size={12} className="text-indigo-400 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        {/* Debtors & Unpaid */}
        <div 
          onClick={() => setCurrentPage('debtors')}
          className="bg-slate-900 border border-rose-500/20 hover:border-rose-500/40 rounded-2xl p-5 shadow-xl transition-all cursor-pointer group relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 w-1 h-full bg-rose-500" />
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Qarzdorlar Nazorati</span>
            <div className="w-9 h-9 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <AlertCircle size={18} />
            </div>
          </div>
          <div className="text-2xl font-black text-rose-400 font-mono">
            {stats.debtorCount} <span className="text-xs text-slate-400 font-normal">o'quvchi</span>
          </div>
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-800/80">
            <span className="text-[11px] text-rose-300 font-mono">{stats.totalDebt.toLocaleString()} UZS qarz</span>
            <ArrowRight size={12} className="text-rose-400 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        {/* Cashier Income */}
        <div 
          onClick={() => setCurrentPage('cashier')}
          className="bg-slate-900 border border-emerald-500/20 hover:border-emerald-500/40 rounded-2xl p-5 shadow-xl transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Kassa & To'lovlar</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Landmark size={18} />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-400 font-mono">
            {stats.todayIncome > 0 ? `${stats.todayIncome.toLocaleString()} UZS` : 'Faol Kassa'}
          </div>
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-800/80">
            <span className="text-[11px] text-slate-500">To'lovlar tarixi va cheklar</span>
            <ArrowRight size={12} className="text-emerald-400 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        {/* Active Groups & Academic */}
        <div 
          onClick={() => setCurrentPage('groups')}
          className="bg-slate-900 border border-slate-800 hover:border-blue-500/40 rounded-2xl p-5 shadow-xl transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Faol Guruhlar</span>
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <FolderGit size={18} />
            </div>
          </div>
          <div className="text-2xl font-black text-white font-mono">
            {stats.activeGroups} <span className="text-xs text-slate-400 font-normal">ta guruh</span>
          </div>
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-800/80">
            <span className="text-[11px] text-slate-500">{stats.totalRooms} ta xona bandligi</span>
            <ArrowRight size={12} className="text-blue-400 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex overflow-x-auto no-scrollbar gap-2 bg-slate-950 p-1.5 rounded-2xl border border-slate-800 text-xs font-bold whitespace-nowrap">
        <button
          onClick={() => setActiveTab('OVERVIEW')}
          className={`px-3.5 sm:px-4 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
            activeTab === 'OVERVIEW' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Clock size={14} />
          Tezkor Harakatlar
        </button>

        <button
          onClick={() => setActiveTab('DEBTORS')}
          className={`px-3.5 sm:px-4 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
            activeTab === 'DEBTORS' ? 'bg-rose-600 text-white shadow' : 'text-slate-400 hover:text-white'
          }`}
        >
          <AlertCircle size={14} />
          Qarzdorlar ({stats.debtorCount})
        </button>

        <button
          onClick={() => setActiveTab('PAYMENTS')}
          className={`px-3.5 sm:px-4 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
            activeTab === 'PAYMENTS' ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Landmark size={14} />
          So'nggi To'lovlar ({payments.length})
        </button>

        <button
          onClick={() => setActiveTab('ACADEMIC')}
          className={`px-3.5 sm:px-4 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
            activeTab === 'ACADEMIC' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'
          }`}
        >
          <GraduationCap size={14} />
          Akademik Nazorat
        </button>
      </div>

      {/* --- TAB 1: OVERVIEW & ACTION CENTER --- */}
      {activeTab === 'OVERVIEW' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Absentee Call Center (2 cols) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Absentee Quick Action Card */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-base text-white flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-rose-500/10 text-rose-400 flex items-center justify-center">
                      <PhoneCall size={16} />
                    </div>
                    Kelmagan O'quvchilarga Qo'ng'iroq Qilish Markazi
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Darsda qatnashmagan talabalarning ota-onasi bilan tezkor bog'lanish
                  </p>
                </div>
                <button
                  onClick={() => setCurrentPage('notifications')}
                  className="text-xs font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 cursor-pointer"
                >
                  Hammasi ({absentees.length}) <ArrowRight size={12} />
                </button>
              </div>

              <div className="divide-y divide-slate-800/80">
                {absentees.length === 0 ? (
                  <div className="py-8 text-center text-slate-500 text-xs italic">
                    Kelmagan talabalar haqida yangi ogohlantirishlar mavjud emas
                  </div>
                ) : (
                  absentees.slice(0, 5).map(item => (
                    <div key={item.id} className="py-3 flex items-center justify-between gap-3">
                      <div className="space-y-0.5 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-white truncate">{item.studentName}</span>
                          <span className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-[10px] font-bold text-indigo-300">
                            {item.groupName}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 line-clamp-1">{item.message}</p>
                      </div>

                      {item.parentPhone || item.phone ? (
                        <a
                          href={`tel:${item.parentPhone || item.phone}`}
                          className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow transition-all shrink-0"
                        >
                          <Phone size={12} />
                          <span>{item.parentPhone || item.phone}</span>
                        </a>
                      ) : (
                        <span className="text-xs text-slate-600 italic shrink-0">Raqam yo'q</span>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Quick Academic Navigation Grid */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-4">
              <h3 className="font-bold text-base text-white flex items-center gap-2">
                <GraduationCap size={18} className="text-indigo-400" />
                Akademik Bo'limlarga Tezkor O'tish
              </h3>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <button
                  onClick={() => setCurrentPage('students')}
                  className="p-4 rounded-2xl bg-slate-950 border border-slate-800 hover:border-indigo-500/50 hover:bg-slate-800/40 text-left transition-all cursor-pointer group"
                >
                  <Users className="w-5 h-5 text-indigo-400 mb-2 group-hover:scale-110 transition-transform" />
                  <span className="font-bold text-xs text-white block">O'quvchilar Ro'yxati</span>
                  <span className="text-[11px] text-slate-500">{students.length} nafar o'quvchi</span>
                </button>

                <button
                  onClick={() => setCurrentPage('groups')}
                  className="p-4 rounded-2xl bg-slate-950 border border-slate-800 hover:border-blue-500/50 hover:bg-slate-800/40 text-left transition-all cursor-pointer group"
                >
                  <FolderGit className="w-5 h-5 text-blue-400 mb-2 group-hover:scale-110 transition-transform" />
                  <span className="font-bold text-xs text-white block">Guruhlar Boshqaruvi</span>
                  <span className="text-[11px] text-slate-500">{groups.length} ta guruh</span>
                </button>

                <button
                  onClick={() => setCurrentPage('schedule')}
                  className="p-4 rounded-2xl bg-slate-950 border border-slate-800 hover:border-purple-500/50 hover:bg-slate-800/40 text-left transition-all cursor-pointer group"
                >
                  <CalendarDays className="w-5 h-5 text-purple-400 mb-2 group-hover:scale-110 transition-transform" />
                  <span className="font-bold text-xs text-white block">Dars Jadvali</span>
                  <span className="text-[11px] text-slate-500">Haftalik reja</span>
                </button>

                <button
                  onClick={() => setCurrentPage('davomat')}
                  className="p-4 rounded-2xl bg-slate-950 border border-slate-800 hover:border-amber-500/50 hover:bg-slate-800/40 text-left transition-all cursor-pointer group"
                >
                  <CalendarCheck className="w-5 h-5 text-amber-400 mb-2 group-hover:scale-110 transition-transform" />
                  <span className="font-bold text-xs text-white block">Davomat Monitoringi</span>
                  <span className="text-[11px] text-slate-500">Kundalik nazorat</span>
                </button>

                <button
                  onClick={() => setCurrentPage('lessonplans')}
                  className="p-4 rounded-2xl bg-slate-950 border border-slate-800 hover:border-teal-500/50 hover:bg-slate-800/40 text-left transition-all cursor-pointer group"
                >
                  <BookOpen className="w-5 h-5 text-teal-400 mb-2 group-hover:scale-110 transition-transform" />
                  <span className="font-bold text-xs text-white block">Dars Rejalari</span>
                  <span className="text-[11px] text-slate-500">Mavzular nazorati</span>
                </button>

                <button
                  onClick={() => setCurrentPage('mentors')}
                  className="p-4 rounded-2xl bg-slate-950 border border-slate-800 hover:border-emerald-500/50 hover:bg-slate-800/40 text-left transition-all cursor-pointer group"
                >
                  <UserCheck className="w-5 h-5 text-emerald-400 mb-2 group-hover:scale-110 transition-transform" />
                  <span className="font-bold text-xs text-white block">Mentorlar & Xodimlar</span>
                  <span className="text-[11px] text-slate-500">O'qituvchilar bazasi</span>
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: AI Assistant & Quick Actions */}
          <div className="space-y-6">
            {/* Sfera AI Widget for Administrator */}
            <div className="bg-gradient-to-b from-indigo-950/60 to-slate-900 border border-indigo-500/30 rounded-3xl p-5 shadow-xl space-y-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-500/20 border border-indigo-500/30 text-indigo-400 flex items-center justify-center shadow-lg">
                  <Sparkles size={18} />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-white">Sfera AI Administrator</h4>
                  <span className="text-[10px] text-indigo-300 font-mono">Sun'iy intellekt yordamchisi</span>
                </div>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Markaz tahlili, qarzdorlik hisobotlari, o'quvchilar davomati va o'quv rejalari bo'yicha tezkor savol bering.
              </p>
              <button
                onClick={() => setCurrentPage('sfera-ai')}
                className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
              >
                <Sparkles size={14} />
                AI Bilan Savol-Javob Boshlash
              </button>
            </div>

            {/* Recent Payments Snapshot */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-sm text-white flex items-center gap-2">
                  <Landmark size={16} className="text-emerald-400" />
                  So'nggi To'lovlar
                </h4>
                <button
                  onClick={() => setCurrentPage('cashier')}
                  className="text-xs font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 cursor-pointer"
                >
                  Kassa Tarixi <ArrowRight size={11} />
                </button>
              </div>

              <div className="space-y-2 text-xs">
                {payments.length === 0 ? (
                  <p className="text-slate-500 italic py-4 text-center">Hali to'lov qaydlari yo'q</p>
                ) : (
                  payments.slice(0, 4).map((p, idx) => (
                    <div key={idx} className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800/80 flex items-center justify-between">
                      <div>
                        <span className="font-bold text-white block">{p.studentName || 'Talaba'}</span>
                        <span className="text-[10px] text-slate-400">{p.receivedByName || 'Kassa'} · {p.groupName || '-'}</span>
                      </div>
                      <span className="font-mono font-bold text-emerald-400">
                        +{Number(p.amount || 0).toLocaleString()} UZS
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- TAB 2: DEBTORS MONITORING --- */}
      {activeTab === 'DEBTORS' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 border-b border-slate-800 pb-4">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <AlertCircle size={20} className="text-rose-400" />
                Qarzdor Talabalar Monitoringi
              </h2>
              <p className="text-xs text-slate-400">
                To'lov muddati kechikkan va qarz summasi mavjud barcha talabalar
              </p>
            </div>
            <button
              onClick={() => setCurrentPage('debtors')}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all self-start sm:self-auto"
            >
              To'liq Ro'yxatga O'tish
              <ArrowRight size={14} />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/80 text-[10px] uppercase font-bold text-slate-400">
                <tr>
                  <th className="py-3 px-4">#</th>
                  <th className="py-3 px-4">O'quvchi</th>
                  <th className="py-3 px-4">Guruhi</th>
                  <th className="py-3 px-4">Telefon</th>
                  <th className="py-3 px-4">Ota-onasi</th>
                  <th className="py-3 px-4">Qarz Summasi</th>
                  <th className="py-3 px-4 text-right">Amal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium">
                {students.filter(s => Number(s.balanceDue || 0) > 0).slice(0, 10).map((s, idx) => (
                  <tr key={s.id} className="hover:bg-slate-800/30">
                    <td className="py-3 px-4 font-mono text-slate-500">{idx + 1}</td>
                    <td className="py-3 px-4 font-bold text-white">{s.fullName}</td>
                    <td className="py-3 px-4 text-indigo-400">{s.groupName || '-'}</td>
                    <td className="py-3 px-4 font-mono text-[11px]">{s.phone || '-'}</td>
                    <td className="py-3 px-4 font-mono text-[11px] text-amber-300">{s.parentPhone || '-'}</td>
                    <td className="py-3 px-4 font-mono font-bold text-rose-400">
                      {Number(s.balanceDue || 0).toLocaleString()} UZS
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => setCurrentPage('cashier')}
                        className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-[11px] font-bold cursor-pointer"
                      >
                        To'lov olish
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* --- TAB 3: RECENT CASHIER PAYMENTS --- */}
      {activeTab === 'PAYMENTS' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 border-b border-slate-800 pb-4">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Landmark size={20} className="text-emerald-400" />
                So'nggi Kassa Qabullari
              </h2>
              <p className="text-xs text-slate-400">
                Kim qachon kimdan qancha to'lov qabul qilgani haqidagi qaydlar
              </p>
            </div>
            <button
              onClick={() => setCurrentPage('cashier')}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all self-start sm:self-auto"
            >
              Kassani Ochish
              <ArrowRight size={14} />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/80 text-[10px] uppercase font-bold text-slate-400">
                <tr>
                  <th className="py-3 px-4">#</th>
                  <th className="py-3 px-4">Sana</th>
                  <th className="py-3 px-4">O'quvchi</th>
                  <th className="py-3 px-4">Guruh</th>
                  <th className="py-3 px-4">Summa</th>
                  <th className="py-3 px-4">Usuli</th>
                  <th className="py-3 px-4">Qabul Qildi</th>
                  <th className="py-3 px-4">Kvitansiya</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium">
                {payments.slice(0, 10).map((p, idx) => (
                  <tr key={p.id || idx} className="hover:bg-slate-800/30">
                    <td className="py-3 px-4 font-mono text-slate-500">{idx + 1}</td>
                    <td className="py-3 px-4 font-mono text-slate-400">
                      {p.paymentDate ? new Date(p.paymentDate).toLocaleDateString() : '-'}
                    </td>
                    <td className="py-3 px-4 font-bold text-white">{p.studentName || "Noma'lum"}</td>
                    <td className="py-3 px-4 text-indigo-300">{p.groupName || '-'}</td>
                    <td className="py-3 px-4 font-mono font-bold text-emerald-400">
                      +{Number(p.amount || 0).toLocaleString()} UZS
                    </td>
                    <td className="py-3 px-4 uppercase text-[10px] font-bold">{p.paymentMethod || p.method || 'CASH'}</td>
                    <td className="py-3 px-4 font-bold text-slate-200">{p.receivedByName || 'Kassa'}</td>
                    <td className="py-3 px-4 font-mono text-amber-400">{p.receiptNo || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* --- TAB 4: ACADEMIC MODULES --- */}
      {activeTab === 'ACADEMIC' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          <div 
            onClick={() => setCurrentPage('groups')}
            className="bg-slate-900 border border-slate-800 hover:border-indigo-500/50 rounded-3xl p-6 shadow-xl cursor-pointer transition-all hover:scale-[1.01] group"
          >
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <FolderGit size={24} />
            </div>
            <h3 className="font-bold text-base text-white">Guruhlar Boshqaruvi</h3>
            <p className="text-xs text-slate-400 mt-1">
              Guruh ochish, o'quvchilarni taqsimlash, dars vaqtlarini belgilash
            </p>
            <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs font-bold text-indigo-400">
              <span>{groups.length} ta guruh</span>
              <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          <div 
            onClick={() => setCurrentPage('courses')}
            className="bg-slate-900 border border-slate-800 hover:border-emerald-500/50 rounded-3xl p-6 shadow-xl cursor-pointer transition-all hover:scale-[1.01] group"
          >
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <GraduationCap size={24} />
            </div>
            <h3 className="font-bold text-base text-white">Kurslar Katalogi</h3>
            <p className="text-xs text-slate-400 mt-1">
              Ta'lim yo'nalishlari, davomiyligi va standart narxlari
            </p>
            <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs font-bold text-emerald-400">
              <span>{courses.length} ta kurs</span>
              <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          <div 
            onClick={() => setCurrentPage('rooms')}
            className="bg-slate-900 border border-slate-800 hover:border-amber-500/50 rounded-3xl p-6 shadow-xl cursor-pointer transition-all hover:scale-[1.01] group"
          >
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <DoorOpen size={24} />
            </div>
            <h3 className="font-bold text-base text-white">Xonalar Nazorati</h3>
            <p className="text-xs text-slate-400 mt-1">
              Auditoriyalar bandligi va dars o'tish sig'imi
            </p>
            <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs font-bold text-amber-400">
              <span>{rooms.length} ta xona</span>
              <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          <div 
            onClick={() => setCurrentPage('lessonplans')}
            className="bg-slate-900 border border-slate-800 hover:border-teal-500/50 rounded-3xl p-6 shadow-xl cursor-pointer transition-all hover:scale-[1.01] group"
          >
            <div className="w-12 h-12 rounded-2xl bg-teal-500/10 text-teal-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <BookOpen size={24} />
            </div>
            <h3 className="font-bold text-base text-white">Dars Rejalari</h3>
            <p className="text-xs text-slate-400 mt-1">
              Sillabuslar va mavzular ketma-ketligi nazorati
            </p>
            <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs font-bold text-teal-400">
              <span>Mavzular ro'yxati</span>
              <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          <div 
            onClick={() => setCurrentPage('mentors')}
            className="bg-slate-900 border border-slate-800 hover:border-rose-500/50 rounded-3xl p-6 shadow-xl cursor-pointer transition-all hover:scale-[1.01] group"
          >
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <UserCheck size={24} />
            </div>
            <h3 className="font-bold text-base text-white">Mentorlar & O'qituvchilar</h3>
            <p className="text-xs text-slate-400 mt-1">
              O'qituvchilarning dars soatlari va guruhlari
            </p>
            <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs font-bold text-rose-400">
              <span>Mentorlar bazasi</span>
              <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          <div 
            onClick={() => setCurrentPage('davomat')}
            className="bg-slate-900 border border-slate-800 hover:border-blue-500/50 rounded-3xl p-6 shadow-xl cursor-pointer transition-all hover:scale-[1.01] group"
          >
            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <CalendarCheck size={24} />
            </div>
            <h3 className="font-bold text-base text-white">Davomat Nazorati</h3>
            <p className="text-xs text-slate-400 mt-1">
              Guruhlar bo'yicha to'liq davomat jurnali
            </p>
            <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs font-bold text-blue-400">
              <span>Davomat tahlili</span>
              <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
