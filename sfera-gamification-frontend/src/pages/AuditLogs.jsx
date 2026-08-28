import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Shield, 
  Search, 
  RefreshCw,
  Clock,
  CheckCircle2,
  UserCheck,
  CreditCard,
  UserPlus,
  ArrowRight,
  Sparkles,
  TrendingDown,
  AlertCircle,
  FileText
} from 'lucide-react';

const ACTION_MAP = {
  'PROCESS_PAYMENT': { label: "To'lov qabul qilindi", color: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' },
  'CREATE_PAYMENT': { label: "To'lov kiritildi", color: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' },
  'CREATE_INVOICE': { label: "Hisob-faktura ochildi", color: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30' },
  'CONVERT_LEAD': { label: "Lid o'quvchiga aylantirildi", color: 'bg-purple-500/15 text-purple-300 border-purple-500/30' },
  'LEAD_STATUS_CHANGE': { label: "Lid bosqichi o'zgartirildi", color: 'bg-blue-500/15 text-blue-300 border-blue-500/30' },
  'CREATE_LEAD': { label: "Yangi lid yaratildi", color: 'bg-teal-500/15 text-teal-300 border-teal-500/30' },
  'ADD_LEAD_EVENT': { label: "Lid izohi / qo'ng'iroq", color: 'bg-amber-500/15 text-amber-300 border-amber-500/30' },
  'UPDATE_LEAD': { label: "Lid tahrirlandi", color: 'bg-slate-500/15 text-slate-300 border-slate-500/30' },
  'DELETE_LEAD': { label: "Lid o'chirildi", color: 'bg-rose-500/15 text-rose-300 border-rose-500/30' },
  'EXPENSE_CREATED': { label: "Xarajat kiritildi", color: 'bg-rose-500/15 text-rose-300 border-rose-500/30' },
  'EXPENSE_UPDATED': { label: "Xarajat tahrirlandi", color: 'bg-amber-500/15 text-amber-300 border-amber-500/30' },
  'EXPENSE_DELETED': { label: "Xarajat o'chirildi", color: 'bg-rose-500/15 text-rose-300 border-rose-500/30' },
  'CREATE_STUDENT': { label: "Yangi o'quvchi qo'shildi", color: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30' },
  'UPDATE_STUDENT': { label: "O'quvchi tahrirlandi", color: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30' },
  'ARCHIVE_STUDENT': { label: "O'quvchi arxivlandi", color: 'bg-rose-500/15 text-rose-300 border-rose-500/30' },
  'CREATE_GROUP': { label: "Yangi guruh ochildi", color: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' },
  'UPDATE_GROUP': { label: "Guruh tahrirlandi", color: 'bg-blue-500/15 text-blue-300 border-blue-500/30' },
  'ARCHIVE_GROUP': { label: "Guruh arxivlandi", color: 'bg-rose-500/15 text-rose-300 border-rose-500/30' },
  'AWARD_POINTS': { label: "XP ball berildi", color: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' },
  'DEDUCT_POINTS': { label: "XP ball ayirildi", color: 'bg-rose-500/15 text-rose-300 border-rose-500/30' },
  'ATTENDANCE_TAKEN': { label: "Davomat belgilandi", color: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30' }
};

const ENTITY_MAP = {
  'Invoice': "Hisob / To'lov",
  'Payment': "Kassa To'lovi",
  'Lead': "Lid (CRM)",
  'Student': "O'quvchi",
  'Group': "Guruh",
  'Expense': "Xarajat",
  'Mentor': "Ustoz",
  'Course': "Kurs",
  'Room': "Xona",
  'PointTransaction': "Ball Harakati"
};

const ROLE_MAP = {
  'SUPER_ADMIN': "Bosh Administrator",
  'ADMIN': "Administrator",
  'BRANCH_ADMIN': "Filial Admin",
  'OPERATOR': "Operator",
  'CASHIER': "Kassir",
  'ACCOUNTANT': "Hisobchi",
  'MENTOR': "Mentor",
  'STUDENT': "O'quvchi",
  'SYSTEM': "Tizim"
};

export default function AuditLogs({ refreshTrigger }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    loadLogs();
  }, [refreshTrigger, refreshKey]);

  const loadLogs = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/audit/logs');
      setLogs(res.data || []);
    } catch (err) {
      console.error("Error loading audit logs", err);
    } finally {
      setLoading(false);
    }
  };

  const getActionInfo = (actionCode) => {
    return ACTION_MAP[actionCode] || {
      label: actionCode?.replace(/_/g, ' ') || "Amal bajarildi",
      color: 'bg-slate-700/50 text-slate-300 border-slate-600'
    };
  };

  const filteredLogs = logs.filter(log => {
    const actionInfo = getActionInfo(log.action);
    const q = searchQuery.toLowerCase();
    return (
      (log.action || '').toLowerCase().includes(q) ||
      actionInfo.label.toLowerCase().includes(q) ||
      (log.entityName || '').toLowerCase().includes(q) ||
      (ENTITY_MAP[log.entityName] || '').toLowerCase().includes(q) ||
      (log.actor?.fullName || '').toLowerCase().includes(q) ||
      (log.newValue || '').toLowerCase().includes(q) ||
      (log.oldValue || '').toLowerCase().includes(q)
    );
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96 text-slate-400">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-indigo-500 mr-3"></div>
        Audit qaydlari yuklanmoqda...
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6 overflow-y-auto max-h-[calc(100vh-4rem)] max-w-[1600px] mx-auto text-slate-100 font-sans pb-16">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/90 border border-slate-800 p-5 rounded-2xl shadow-xl backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-br from-indigo-500 to-indigo-700 text-white rounded-xl shadow-lg shadow-indigo-500/25">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
              Tizim Audit Qaydlari
            </h1>
            <p className="text-xs md:text-sm text-slate-400 mt-0.5">
              Xodimlar, kassirlar va adminlarning tizimdagi barcha amallari monitoringi
            </p>
          </div>
        </div>
        <button
          onClick={() => setRefreshKey(prev => prev + 1)}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs md:text-sm font-semibold rounded-xl transition-all cursor-pointer shadow-sm active:scale-95 shrink-0"
        >
          <RefreshCw size={15} /> Yangilash
        </button>
      </div>

      {/* Filter panel */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
        <input
          type="text"
          placeholder="Harakat turi, xodim ismi, lid yoki ob'ekt bo'yicha qidirish..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full h-11 pl-10 pr-4 bg-slate-900 border border-slate-800 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 text-xs md:text-sm font-medium transition-all shadow-inner"
        />
      </div>

      {/* Log list table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 font-bold uppercase tracking-wider h-12">
                <th className="px-6 font-bold">Bajarilgan Harakat</th>
                <th className="px-6 font-bold">Ob'ekt</th>
                <th className="px-6 font-bold">Oldingi Holat</th>
                <th className="px-6 font-bold">Yangi Holat</th>
                <th className="px-6 font-bold">Ijrochi Xodim</th>
                <th className="px-6 font-bold">Vaqti</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-medium">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-16 text-slate-500 italic">
                    Hech qanday audit qaydlari topilmadi.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => {
                  const actionInfo = getActionInfo(log.action);
                  const entityLabel = ENTITY_MAP[log.entityName] || log.entityName || "Ob'ekt";
                  const roleLabel = ROLE_MAP[log.actor?.role] || log.actor?.role || "Tizim";

                  return (
                    <tr key={log.id} className="hover:bg-slate-800/30 transition-colors h-14">
                      {/* Action Badge */}
                      <td className="px-6">
                        <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-lg border ${actionInfo.color}`}>
                          {actionInfo.label}
                        </span>
                      </td>

                      {/* Entity */}
                      <td className="px-6">
                        <span className="font-bold text-slate-200 text-sm">{entityLabel}</span>
                        {log.entityId && (
                          <span className="text-[10px] text-slate-400 font-mono block mt-0.5">
                            ID: #{log.entityId}
                          </span>
                        )}
                      </td>

                      {/* Old State */}
                      <td className="px-6 text-slate-400 max-w-xs truncate font-medium">
                        {log.oldValue ? (
                          <span className="bg-slate-950/60 px-2 py-1 rounded-md border border-slate-800">
                            {log.oldValue}
                          </span>
                        ) : (
                          <span className="text-slate-600">—</span>
                        )}
                      </td>

                      {/* New State */}
                      <td className="px-6 text-slate-200 max-w-xs truncate font-bold">
                        {log.newValue ? (
                          <span className="bg-slate-950/80 px-2 py-1 rounded-md border border-slate-800 text-indigo-300">
                            {log.newValue}
                          </span>
                        ) : (
                          <span className="text-slate-600">—</span>
                        )}
                      </td>

                      {/* Actor (User) */}
                      <td className="px-6">
                        <p className="font-bold text-slate-100 text-xs">{log.actor?.fullName || "Tizim"}</p>
                        <span className="text-[10px] text-indigo-400 font-semibold">{roleLabel}</span>
                      </td>

                      {/* Timestamp */}
                      <td className="px-6 text-slate-400 text-xs whitespace-nowrap">
                        <span className="inline-flex items-center gap-1.5 font-mono">
                          <Clock size={13} className="text-slate-500" />
                          {new Date(log.createdAt).toLocaleString()}
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
    </div>
  );
}
