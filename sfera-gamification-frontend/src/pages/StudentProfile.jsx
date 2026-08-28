import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  User, 
  BookOpen, 
  Calendar, 
  Award, 
  MessageSquare, 
  Zap, 
  Skull, 
  ArrowLeft,
  CalendarDays,
  FolderOpen,
  Phone,
  MapPin,
  CreditCard,
  Activity,
  Clock,
  TrendingUp
} from 'lucide-react';

export default function StudentProfile({ studentId, setCurrentPage, refreshTrigger }) {
  const [profile, setProfile] = useState(null);
  const [crmProfile, setCrmProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeSubTab, setActiveSubTab] = useState('gamification'); // gamification, finance, timeline

  useEffect(() => {
    if (studentId) {
      setLoading(true);
      Promise.all([
        axios.get(`/api/students/${studentId}/profile`),
        axios.get(`/api/students/${studentId}/crm-profile`)
      ])
        .then(([profRes, crmRes]) => {
          setProfile(profRes.data);
          setCrmProfile(crmRes.data);
        })
        .catch(err => console.error("Error loading profile details", err))
        .finally(() => setLoading(false));
    }
  }, [studentId, refreshTrigger]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full text-slate-400">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-indigo-500 mr-2"></div>
        Yuklanmoqda...
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="p-6 text-center text-slate-400">
        Profil topilmadi.
        <button 
          onClick={() => setCurrentPage('leaderboard')} 
          className="mt-4 flex items-center gap-1 text-indigo-400 hover:text-indigo-300 mx-auto cursor-pointer"
        >
          <ArrowLeft size={16} /> Reytingga qaytish
        </button>
      </div>
    );
  }

  const breakdown = profile.breakdown || {};
  const history = profile.history || [];

  const categories = [
    { name: "Uyga vazifa", xp: breakdown.homework, icon: BookOpen, color: "text-emerald-400 border-emerald-500/20 bg-emerald-500/10" },
    { name: "Davomat", xp: breakdown.attendance, icon: Calendar, color: "text-blue-400 border-blue-500/20 bg-blue-500/10" },
    { name: "Loyihalar", xp: breakdown.projects, icon: Award, color: "text-amber-400 border-amber-500/20 bg-amber-500/10" },
    { name: "Savol-javob", xp: breakdown.qa, icon: MessageSquare, color: "text-purple-400 border-purple-500/20 bg-purple-500/10" },
    { name: "Aktivlik", xp: breakdown.activity, icon: Zap, color: "text-indigo-400 border-indigo-500/20 bg-indigo-500/10" },
    { name: "Jarimalar", xp: breakdown.penalties, icon: Skull, color: "text-rose-400 border-rose-500/20 bg-rose-500/10" }
  ];

  // SVG Line Chart Dimensions
  const chartHeight = 150;
  const chartWidth = 500;
  const maxVal = Math.max(...history.map(h => h.xp), 100);
  const minVal = Math.min(...history.map(h => h.xp), 0);
  const range = maxVal - minVal || 10;

  const points = history.map((item, idx) => {
    const x = idx === 0 ? 30 : 30 + (idx * ((chartWidth - 50) / (history.length - 1)));
    const y = chartHeight - (((item.xp - minVal) / range) * (chartHeight - 40)) - 10;
    return { x, y, xp: item.xp, date: item.date };
  });

  const polylinePoints = points.map(p => `${p.x},${p.y}`).join(' ');
  const areaPoints = points.length > 0 
    ? `30,${chartHeight - 10} ` + polylinePoints + ` ${points[points.length - 1].x},${chartHeight - 10}` 
    : '';

  // CRM details helpers
  const studentMeta = crmProfile?.student || {};
  const invoices = crmProfile?.invoices || [];
  const payments = crmProfile?.payments || [];
  const enrollments = crmProfile?.enrollments || [];
  const timeline = crmProfile?.timeline || [];

  return (
    <div className="p-6 space-y-6 overflow-y-auto max-h-[calc(100vh-4rem)]">
      {/* Back Button */}
      <button 
        onClick={() => setCurrentPage('leaderboard')}
        className="flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-white transition-colors cursor-pointer"
      >
        <ArrowLeft size={16} /> Reytingga qaytish
      </button>

      {/* Student Profile Card Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col xl:flex-row items-center xl:items-stretch justify-between gap-6 shadow-lg">
        <div className="flex flex-col md:flex-row items-center gap-6 flex-1 w-full">
          <div className="w-20 h-20 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-xl shadow-indigo-500/25 border border-indigo-400/20 shrink-0">
            <User size={40} />
          </div>
          
          <div className="text-center md:text-left space-y-2 flex-1 min-w-0">
            <h1 className="text-2xl font-black text-white leading-tight truncate">{profile.fullName}</h1>
            
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-400 bg-slate-800 border border-slate-700 px-2 py-0.5 rounded uppercase">
                <FolderOpen size={10} className="text-indigo-400" />
                {profile.groupName}
              </span>
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-400 bg-slate-800 border border-slate-700 px-2 py-0.5 rounded uppercase">
                {profile.courseName}
              </span>
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-400 bg-slate-800 border border-slate-700 px-2 py-0.5 rounded">
                Mentor: {profile.mentorName}
              </span>
            </div>

            {/* CRM Profile Details */}
            {studentMeta.phone && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 pt-2 border-t border-slate-800/60 text-xs font-semibold text-slate-400 text-left">
                <p className="flex items-center gap-1.5"><Phone size={12} className="text-indigo-400" /> Telefon: <span className="text-slate-200">{studentMeta.phone}</span></p>
                {studentMeta.address && <p className="flex items-center gap-1.5"><MapPin size={12} className="text-indigo-400" /> Manzil: <span className="text-slate-200 truncate">{studentMeta.address}</span></p>}
                {studentMeta.parentName && <p className="flex items-center gap-1.5"><User size={12} className="text-indigo-400" /> Vasiy: <span className="text-slate-200">{studentMeta.parentName} ({studentMeta.parentPhone})</span></p>}
                {studentMeta.birthDate && <p className="flex items-center gap-1.5"><Calendar size={12} className="text-indigo-400" /> Tug'ilgan sana: <span className="text-slate-200">{studentMeta.birthDate}</span></p>}
              </div>
            )}
          </div>
        </div>

        {/* Global XP & Rank display */}
        <div className="flex items-center gap-6 divide-x divide-slate-800 border-t xl:border-t-0 pt-4 xl:pt-0 w-full xl:w-auto justify-around shrink-0">
          <div className="text-center px-4">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">REYTINGDAGI O'RNI</span>
            <span className="text-3xl font-black text-amber-400 tracking-tight block mt-1">
              #{profile.rank}
            </span>
          </div>
          <div className="text-center px-4 pl-6">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">JAMI XP</span>
            <span className="text-3xl font-black text-indigo-400 tracking-tight block mt-1">
              {profile.totalXp} XP
            </span>
          </div>
        </div>
      </div>

      {/* Subtab selection */}
      <div className="flex border-b border-slate-850 gap-4 shrink-0">
        <button
          onClick={() => setActiveSubTab('gamification')}
          className={`pb-3 text-sm font-bold border-b-2 px-1 cursor-pointer transition-all ${
            activeSubTab === 'gamification' ? 'border-indigo-500 text-white font-extrabold' : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Gamifikatsiya Natijalari
        </button>
        <button
          onClick={() => setActiveSubTab('finance')}
          className={`pb-3 text-sm font-bold border-b-2 px-1 cursor-pointer transition-all ${
            activeSubTab === 'finance' ? 'border-indigo-500 text-white font-extrabold' : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          To'lovlar & Shartnomalar
        </button>
        <button
          onClick={() => setActiveSubTab('timeline')}
          className={`pb-3 text-sm font-bold border-b-2 px-1 cursor-pointer transition-all ${
            activeSubTab === 'timeline' ? 'border-indigo-500 text-white font-extrabold' : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Talaba Tarixi (Timeline)
        </button>
      </div>

      {/* Subtab contents */}
      {activeSubTab === 'gamification' && (
        <>
          {/* Main Grid: Breakdown & SVG Progress Line */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {/* Left columns: Category scores */}
            <div className="xl:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg flex flex-col justify-between">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Award size={18} className="text-indigo-400" />
                  Ballar Taqsimoti
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">Faoliyat turlari bo'yicha to'plangan XP</p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-6 mt-6">
                {categories.map((c, idx) => {
                  const Icon = c.icon;
                  const sign = c.name === 'Jarimalar' ? '' : '+';
                  return (
                    <div key={idx} className="p-4 rounded-xl bg-slate-850 border border-slate-800/60 flex flex-col justify-between h-28">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-400">{c.name}</span>
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center border ${c.color}`}>
                          <Icon size={16} />
                        </div>
                      </div>
                      <h4 className={`text-xl font-black tracking-tight ${
                        c.name === 'Jarimalar' ? 'text-rose-400' : 'text-slate-200'
                      }`}>
                        {sign}{c.xp} XP
                      </h4>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right column: SVG Line Graph showing progress over time */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg flex flex-col justify-between">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <TrendingUp size={18} className="text-emerald-400" />
                  Rivojlanish Grafigi
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">Vaqt o'tishi bilan XP to'planish ko'rsatkichi</p>
              </div>

              <div className="relative w-full flex justify-center py-4">
                {history.length < 2 ? (
                  <div className="h-36 flex items-center justify-center text-slate-500 text-xs">Rivojlanish grafigi uchun ma'lumotlar kam</div>
                ) : (
                  <svg 
                    height={chartHeight} 
                    width={chartWidth}
                    className="overflow-visible"
                  >
                    <defs>
                      <linearGradient id="areaGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#4f46e5" stopOpacity="0.25" />
                        <stop offset="100%" stopColor="#4f46e5" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>

                    {[0, 0.5, 1].map((p, idx) => {
                      const y = chartHeight - (p * (chartHeight - 40)) - 10;
                      const label = Math.round(minVal + p * range);
                      return (
                        <g key={idx}>
                          <line x1="30" y1={y} x2="100%" y2={y} stroke="#1e293b" strokeWidth="1" strokeDasharray="4" />
                          <text x="5" y={y + 3} fill="#64748b" className="text-[9px] font-bold">{label}</text>
                        </g>
                      );
                    })}

                    {areaPoints && (
                      <polygon points={areaPoints} fill="url(#areaGrad)" />
                    )}

                    <polyline 
                      fill="none" 
                      stroke="#4f46e5" 
                      strokeWidth="3.5" 
                      points={polylinePoints} 
                      strokeLinecap="round" 
                      strokeLinejoin="round"
                      className="drop-shadow-[0_2px_8px_rgba(99,102,241,0.4)]"
                    />

                    {points.map((p, i) => (
                      <g key={i} className="group/dot cursor-pointer">
                        <circle 
                          cx={p.x} 
                          cy={p.y} 
                          r="4" 
                          fill="#4f46e5" 
                          stroke="#0f172a" 
                          strokeWidth="2" 
                          className="transition-all group-hover/dot:r-6"
                        />
                        
                        <rect 
                          x={p.x - 25} 
                          y={p.y - 30} 
                          width="50" 
                          height="18" 
                          rx="3" 
                          fill="#0f172a" 
                          stroke="#334155" 
                          className="opacity-0 group-hover/dot:opacity-100 transition-opacity duration-150 pointer-events-none"
                        />
                        <text 
                          x={p.x} 
                          y={p.y - 18} 
                          fill="#f8fafc" 
                          className="text-[9px] font-black opacity-0 group-hover/dot:opacity-100 transition-opacity duration-150 pointer-events-none" 
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

          {/* Point History Log for the specific student */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <CalendarDays size={18} className="text-indigo-400" />
                Ball Olish Tarixi
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">O'quvchining shaxsiy baholash rekordi</p>
            </div>

            <div className="overflow-x-auto mt-4 rounded-xl border border-slate-800/80">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-950/40 text-[10px] font-bold text-slate-400 tracking-wider uppercase">
                    <th className="py-3.5 px-6">SANA</th>
                    <th className="py-3.5 px-6">SABAB / TAVSIF</th>
                    <th className="py-3.5 px-6 text-center">BALL</th>
                    <th className="py-3.5 px-6">MENTOR</th>
                    <th className="py-3.5 px-6 text-center">HOLAT</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850">
                  {profile.transactions.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="py-8 text-center text-slate-500 text-sm">Ballar mavjud emas</td>
                    </tr>
                  ) : (
                    profile.transactions.map((t) => {
                      const isCancelled = t.status === 'CANCELLED';
                      const isPositive = t.points > 0;
                      
                      return (
                        <tr 
                          key={t.id} 
                          className={`text-slate-355 text-sm ${
                            isCancelled ? 'opacity-40 line-through text-slate-500' : ''
                          }`}
                        >
                          <td className="py-3.5 px-6 font-semibold">{t.date}</td>
                          <td className="py-3.5 px-6 font-semibold">{t.description}</td>
                          <td className="py-3.5 px-6 text-center font-extrabold">
                            <span className={isCancelled ? 'text-slate-500' : isPositive ? 'text-emerald-400' : 'text-rose-400'}>
                              {isPositive ? `+${t.points}` : t.points} XP
                            </span>
                          </td>
                          <td className="py-3.5 px-6 font-medium">{t.mentorName}</td>
                          <td className="py-3.5 px-6 text-center">
                            <span className={`inline-block text-[9px] uppercase font-bold px-2 py-0.5 rounded ${
                              isCancelled 
                                ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20' 
                                : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            }`}>
                              {t.status}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {activeSubTab === 'finance' && (
        <div className="space-y-6">
          {/* Contracts & Price Plans */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg">
            <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-4">
              <CreditCard size={18} className="text-indigo-400" /> Shartnoma va Tarif (Active Enrollments)
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {enrollments.length === 0 ? (
                <p className="text-xs text-slate-500 italic">Faol shartnomalar mavjud emas.</p>
              ) : (
                enrollments.map(en => (
                  <div key={en.id} className="p-4 bg-slate-950/60 border border-slate-850 rounded-2xl space-y-3 font-semibold text-xs">
                    <div className="flex justify-between items-center pb-2 border-b border-slate-850">
                      <span className="text-slate-200 text-sm font-bold">{en.pricePlan.name}</span>
                      <span className={`inline-block text-[9px] font-bold px-2 py-0.5 rounded uppercase ${
                        en.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                      }`}>
                        {en.status}
                      </span>
                    </div>
                    <div className="space-y-1.5">
                      <p className="flex justify-between text-slate-400"><span>Kurs:</span> <span className="text-slate-200 uppercase">{en.pricePlan.course.name}</span></p>
                      {en.group && <p className="flex justify-between text-slate-400"><span>Guruh:</span> <span className="text-slate-200">{en.group.name}</span></p>}
                      <p className="flex justify-between text-slate-400"><span>Tarif Narxi:</span> <span className="text-slate-200">{en.pricePlan.amount.toLocaleString()} UZS</span></p>
                      {en.discountAmount > 0 && <p className="flex justify-between text-slate-400"><span>Chegirma:</span> <span className="text-rose-400">-{en.discountAmount.toLocaleString()} UZS</span></p>}
                      <p className="flex justify-between text-slate-400"><span>Qabul qilingan sana:</span> <span className="text-slate-200">{new Date(en.joinedAt).toLocaleDateString()}</span></p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Invoices List */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg">
            <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-4">
              <Calendar size={18} className="text-indigo-400" /> To'lov Schyotlari (Invoices)
            </h3>
            
            <div className="overflow-x-auto rounded-xl border border-slate-800/80">
              <table className="w-full border-collapse text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-950/40 text-[10px] font-bold text-slate-400 tracking-wider uppercase h-11">
                    <th className="px-6">Tarif</th>
                    <th className="px-6">Schyot Summasi</th>
                    <th className="px-6">To'langan Summa</th>
                    <th className="px-6">To'lov Sanasi</th>
                    <th className="px-6 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850 font-medium">
                  {invoices.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="py-8 text-center text-slate-500">Mavjud hisob-fakturalar yo'q</td>
                    </tr>
                  ) : (
                    invoices.map(inv => (
                      <tr key={inv.id} className="hover:bg-slate-850/40 transition-colors h-14">
                        <td className="px-6">
                          <p className="font-bold text-slate-200">{inv.enrollment.pricePlan.name}</p>
                          <span className="text-[10px] text-slate-500 font-semibold">{inv.enrollment.pricePlan.course.name}</span>
                        </td>
                        <td className="px-6 font-extrabold text-slate-200">{inv.amount.toLocaleString()} UZS</td>
                        <td className="px-6 font-bold text-emerald-400">{inv.paidAmount.toLocaleString()} UZS</td>
                        <td className="px-6 text-slate-400 font-semibold">{inv.dueDate}</td>
                        <td className="px-6 text-center">
                          <span className={`inline-block text-[9px] font-bold tracking-wider px-2 py-0.5 rounded uppercase ${
                            inv.status === 'PAID' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                            inv.status === 'PARTIALLY_PAID' ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20' :
                            'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                          }`}>
                            {inv.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Payments Receipt list */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg">
            <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-4">
              <DollarSign size={18} className="text-indigo-400" /> Kirim To'lov Cheklari (Payments)
            </h3>
            
            <div className="overflow-x-auto rounded-xl border border-slate-800/80">
              <table className="w-full border-collapse text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-950/40 text-[10px] font-bold text-slate-400 tracking-wider uppercase h-11">
                    <th className="px-6">To'lov Turi</th>
                    <th className="px-6">Summa</th>
                    <th className="px-6">To'lov Usuli</th>
                    <th className="px-6">Sana / Vaqt</th>
                    <th className="px-6">Kassa Mas'uli</th>
                    <th className="px-6">Izoh</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850 font-medium">
                  {payments.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="py-8 text-center text-slate-500">Mavjud to'lov kvitansiyalari yo'q</td>
                    </tr>
                  ) : (
                    payments.map(pay => (
                      <tr key={pay.id} className="hover:bg-slate-850/40 transition-colors h-14">
                        <td className="px-6">
                          <p className="font-bold text-slate-200">Kirim To'lovi</p>
                        </td>
                        <td className="px-6 font-extrabold text-emerald-400">+{pay.amount.toLocaleString()} UZS</td>
                        <td className="px-6">
                          <span className="inline-block text-[9px] font-bold px-2 py-0.5 bg-slate-850 border border-slate-800 text-slate-350 rounded">
                            {pay.paymentMethod}
                          </span>
                        </td>
                        <td className="px-6 text-slate-400 font-semibold">{new Date(pay.createdAt).toLocaleString()}</td>
                        <td className="px-6 text-slate-350 font-bold">{pay.receivedBy?.fullName || "Tizim"}</td>
                        <td className="px-6 text-slate-400 italic max-w-xs truncate">{pay.notes || "-"}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeSubTab === 'timeline' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg">
          <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-6">
            <Activity size={18} className="text-indigo-400" /> Talabaning Tizimdagi Butun Faoliyati
          </h3>

          <div className="relative pl-6 border-l border-slate-800 space-y-6">
            {timeline.length === 0 ? (
              <p className="text-xs text-slate-500 italic py-4">Tizimda faoliyat tarixi topilmadi.</p>
            ) : (
              timeline.map((event, idx) => (
                <div key={idx} className="relative space-y-1 text-xs">
                  {/* Timeline bullet */}
                  <div className={`absolute -left-[30px] top-1.5 w-4 h-4 rounded-full border-4 border-slate-900 flex items-center justify-center ${
                    event.type === 'LEAD_EVENT' || event.type === 'CONVERTED' ? 'bg-blue-500' :
                    event.type === 'ENROLLMENT' ? 'bg-indigo-500' :
                    event.type === 'INVOICE' ? 'bg-rose-500' :
                    event.type === 'PAYMENT' ? 'bg-emerald-500' : 'bg-amber-500'
                  }`}></div>
                  
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <h4 className="font-black text-sm text-slate-200">{event.title}</h4>
                    <span className="text-[10px] text-slate-500 font-bold flex items-center gap-1 shrink-0">
                      <Clock size={10} />
                      {new Date(event.date).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-slate-400 font-semibold leading-relaxed">{event.description}</p>
                  
                  {event.operator && (
                    <p className="text-[10px] text-slate-500 font-medium">Ijrochi: <span className="font-bold">{event.operator}</span></p>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
