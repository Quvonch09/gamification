import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  UserCheck, 
  AlertTriangle, 
  CalendarDays, 
  Clock, 
  PlusCircle, 
  MinusCircle, 
  Users,
  RefreshCw
} from 'lucide-react';

export default function MentorMonitor() {
  const [monitors, setMonitors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchMonitorData();
  }, []);

  const fetchMonitorData = () => {
    setLoading(true);
    axios.get('/api/mentors/monitor')
      .then(res => {
        setMonitors(res.data);
        setError(null);
      })
      .catch(err => {
        console.error("Mentor monitor error", err);
        setError("Mentorlar monitoringini yuklashda xatolik yuz berdi.");
      })
      .finally(() => setLoading(false));
  };

  if (loading) {
    return (
      <div className="text-slate-400 flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-indigo-500 mr-2"></div>
        Yuklanmoqda...
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-12 text-rose-400 text-center flex flex-col items-center">
        <AlertTriangle size={36} className="mb-2" />
        <p className="font-semibold">{error}</p>
        <button onClick={fetchMonitorData} className="mt-4 px-4 py-2 bg-indigo-650 hover:bg-indigo-500 text-white rounded-lg text-xs cursor-pointer">
          Qayta yuklash
        </button>
      </div>
    );
  }

  const warnings = monitors.filter(m => m.warning);

  return (
    <div className="space-y-6">
      {/* Header with refresh button */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-slate-100 flex items-center gap-1.5">
            <UserCheck size={18} className="text-indigo-400" />
            Mentorlar Baholash Faoliyati
          </h3>
          <p className="text-xs text-slate-400">Mentorlarning bugungi ball berish ko'rsatkichlari tahlili</p>
        </div>
        <button 
          onClick={fetchMonitorData} 
          className="flex items-center gap-1 px-3 py-1.5 bg-slate-800 hover:bg-slate-750 text-slate-300 rounded-lg text-xs font-semibold cursor-pointer border border-slate-700/50"
        >
          <RefreshCw size={12} /> Yangilash
        </button>
      </div>

      {/* Warning Box (if any warning active) */}
      {warnings.length > 0 && (
        <div className="space-y-3">
          {warnings.map(w => (
            <div 
              key={w.id} 
              className="p-4 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-xl flex items-start gap-3 shadow-lg shadow-amber-500/5 animate-pulse"
            >
              <AlertTriangle size={20} className="shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-sm">FAOLIYAT WARNING BANNER</h4>
                <p className="text-xs mt-0.5 leading-relaxed">{w.warningMessage}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Monitor Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {monitors.map((m) => (
          <div 
            key={m.id} 
            className={`bg-slate-900 border rounded-2xl p-6 shadow-md hover:border-slate-750 transition-all ${
              m.warning ? 'border-amber-500/30' : 'border-slate-800/80'
            }`}
          >
            {/* Mentor Initials / Name */}
            <div className="flex items-center gap-3 pb-4 border-b border-slate-800/60">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
                m.warning 
                  ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' 
                  : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
              }`}>
                {m.fullName?.charAt(0) || 'M'}
              </div>
              <div>
                <h4 className="font-bold text-slate-200 text-sm leading-tight">{m.fullName}</h4>
                <span className="text-[10px] text-slate-500 font-semibold block mt-0.5">MENTOR</span>
              </div>
            </div>

            {/* Stats Body */}
            <div className="py-4 space-y-3.5 border-b border-slate-800/60 text-xs">
              {/* Groups */}
              <div className="flex items-start justify-between">
                <span className="text-slate-500 font-semibold">Biriktirilgan guruhlar:</span>
                <div className="flex flex-wrap justify-end gap-1.5 max-w-[170px]">
                  {m.groups.length === 0 ? (
                    <span className="text-slate-600 font-bold">Yo'q</span>
                  ) : (
                    m.groups.map((g, idx) => (
                      <span key={idx} className="bg-slate-800 text-slate-400 px-2 py-0.5 rounded text-[9px] uppercase font-bold border border-slate-750">
                        {g}
                      </span>
                    ))
                  )}
                </div>
              </div>

              {/* Positive Points Today */}
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-semibold flex items-center gap-1">
                  <PlusCircle size={13} className="text-emerald-500" /> Bugun bergan musbat ball:
                </span>
                <span className="font-extrabold text-emerald-400">+{m.positivePoints} XP</span>
              </div>

              {/* Penalties Today */}
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-semibold flex items-center gap-1">
                  <MinusCircle size={13} className="text-rose-500" /> Bugungi jarimalar:
                </span>
                <span className="font-extrabold text-rose-400">-{m.negativePoints} XP</span>
              </div>

              {/* Graded Students Today */}
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-semibold flex items-center gap-1">
                  <Users size={13} className="text-indigo-400" /> Baholangan o'quvchilar:
                </span>
                <span className="font-extrabold text-slate-300">{m.gradedStudents} nafar</span>
              </div>
            </div>

            {/* Last active time footer */}
            <div className="pt-4 flex items-center gap-1.5 text-[10px] text-slate-500">
              <Clock size={12} className="text-slate-600" />
              <span>Oxirgi faoliyat:</span>
              <span className="font-semibold text-slate-400">
                {m.lastActiveTime !== 'Faoliyat yo\'q' 
                  ? new Date(m.lastActiveTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
                  : 'Bugun faoliyat yo\'q'}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
