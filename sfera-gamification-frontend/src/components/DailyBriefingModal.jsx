import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { X, Sparkles, TrendingUp, DollarSign, Users, BookOpen, Loader2, RefreshCw } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

export default function DailyBriefingModal({ onClose }) {
  const [briefing, setBriefing] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchBriefing();
  }, []);

  const fetchBriefing = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get('/api/ai/daily-briefing');
      setBriefing(res.data.briefing || 'Hisobot tayyor qilinmadi.');
    } catch (err) {
      setError('Hisobotni yuklab bo\'lmadi. Internet aloqasini tekshiring.');
      setBriefing('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-700/60 rounded-2xl shadow-2xl shadow-black/70 w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-700/60 bg-gradient-to-r from-violet-900/50 to-indigo-900/50 flex-shrink-0">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-900/50">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1">
            <h2 className="text-white font-bold text-lg leading-none">Xayrli Tong! 🌅</h2>
            <p className="text-violet-300/80 text-sm mt-0.5">Sfera AI — Bugungi Ertalabki Hisobot</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchBriefing}
              disabled={loading}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-lg transition-colors disabled:opacity-50"
              title="Yangilash"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button onClick={onClose} className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-900/20 rounded-lg transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Quick Stats Row */}
        <div className="grid grid-cols-4 gap-2 p-4 border-b border-slate-700/40 flex-shrink-0">
          {[
            { icon: TrendingUp, label: 'Bugungi hisobot', color: 'text-emerald-400 bg-emerald-900/30' },
            { icon: DollarSign, label: 'Moliya', color: 'text-yellow-400 bg-yellow-900/30' },
            { icon: Users, label: 'O\'quvchilar', color: 'text-blue-400 bg-blue-900/30' },
            { icon: BookOpen, label: 'Guruhlar', color: 'text-violet-400 bg-violet-900/30' },
          ].map(({ icon: Icon, label, color }) => (
            <div key={label} className="flex flex-col items-center gap-1.5 p-2 rounded-xl bg-slate-800/60 border border-slate-700/30">
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${color}`}>
                <Icon className="w-3.5 h-3.5" />
              </div>
              <span className="text-xs text-slate-400 text-center leading-tight">{label}</span>
            </div>
          ))}
        </div>

        {/* Briefing Content */}
        <div className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-slate-700">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-48 gap-4">
              <div className="w-12 h-12 rounded-xl bg-violet-900/30 flex items-center justify-center">
                <Loader2 className="w-6 h-6 text-violet-400 animate-spin" />
              </div>
              <div className="text-center">
                <p className="text-slate-300 font-medium">Hisobot tayyorlanmoqda...</p>
                <p className="text-slate-500 text-sm mt-1">AI tizim ma'lumotlarini tahlil qilmoqda</p>
              </div>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-48 gap-4">
              <div className="text-4xl">⚠️</div>
              <p className="text-red-400 text-center">{error}</p>
              <button onClick={fetchBriefing} className="px-4 py-2 bg-violet-700 hover:bg-violet-600 text-white rounded-xl text-sm transition-colors">
                Qayta urinish
              </button>
            </div>
          ) : (
            <div className="prose prose-invert prose-sm max-w-none text-slate-200 leading-relaxed">
              <ReactMarkdown
                components={{
                  h1: ({children}) => <h1 className="text-xl font-bold text-white mb-3">{children}</h1>,
                  h2: ({children}) => <h2 className="text-lg font-semibold text-violet-300 mt-5 mb-2 pb-1 border-b border-slate-700/40">{children}</h2>,
                  h3: ({children}) => <h3 className="text-base font-semibold text-violet-200 mt-3 mb-1.5">{children}</h3>,
                  p: ({children}) => <p className="text-slate-300 mb-2 leading-relaxed">{children}</p>,
                  ul: ({children}) => <ul className="list-none space-y-1 my-2">{children}</ul>,
                  li: ({children}) => <li className="flex items-start gap-1.5 text-slate-300"><span className="text-violet-400 mt-0.5">•</span><span>{children}</span></li>,
                  strong: ({children}) => <strong className="text-white font-semibold">{children}</strong>,
                  code: ({children}) => <code className="bg-slate-800 text-violet-300 px-1.5 py-0.5 rounded text-xs font-mono">{children}</code>,
                }}
              >
                {briefing}
              </ReactMarkdown>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-700/40 bg-slate-950/40 flex-shrink-0">
          <p className="text-xs text-slate-500">AI tomonidan tizim ma'lumotlari asosida tayyorlangan</p>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-violet-700 hover:bg-violet-600 text-white rounded-xl text-sm font-medium transition-colors"
          >
            Tushunarli, boshlaylik! 💪
          </button>
        </div>
      </div>
    </div>
  );
}
