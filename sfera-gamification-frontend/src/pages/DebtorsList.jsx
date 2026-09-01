import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { 
  AlertCircle, 
  Search, 
  Phone, 
  Users, 
  DollarSign, 
  CheckCircle2, 
  Clock, 
  Filter, 
  CreditCard,
  RefreshCw,
  PhoneCall,
  ArrowUpDown
} from 'lucide-react';

export default function DebtorsList({ setCurrentPage }) {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('DEBTORS'); // 'ALL' | 'DEBTORS' | 'PAID' | 'PARTIAL'
  const [groupFilter, setGroupFilter] = useState('ALL');

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/students');
      setStudents(res.data || []);
    } catch (err) {
      console.error("Error fetching students:", err);
    } finally {
      setLoading(false);
    }
  };

  // Unique groups for filter
  const groups = useMemo(() => {
    const set = new Set();
    students.forEach(s => {
      if (s.groupName) set.add(s.groupName);
    });
    return Array.from(set).sort();
  }, [students]);

  // Filtered Students
  const filteredStudents = useMemo(() => {
    return students.filter(s => {
      // Search
      const q = search.toLowerCase();
      const matchSearch = 
        (s.fullName || '').toLowerCase().includes(q) ||
        (s.phone || '').includes(q) ||
        (s.parentPhone || '').includes(q) ||
        (s.groupName || '').toLowerCase().includes(q);

      if (!matchSearch) return false;

      // Group Filter
      if (groupFilter !== 'ALL' && s.groupName !== groupFilter) return false;

      // Status Filter
      const balance = Number(s.balanceDue || 0);
      if (filterStatus === 'DEBTORS') return balance > 0;
      if (filterStatus === 'PAID') return balance === 0 && Number(s.totalPaid || 0) > 0;
      if (filterStatus === 'PARTIAL') return balance > 0 && Number(s.totalPaid || 0) > 0;
      return true;
    });
  }, [students, search, filterStatus, groupFilter]);

  // Aggregate stats
  const stats = useMemo(() => {
    let totalDebt = 0;
    let debtorCount = 0;
    let paidCount = 0;
    let partialCount = 0;

    students.forEach(s => {
      const due = Number(s.balanceDue || 0);
      const paid = Number(s.totalPaid || 0);
      if (due > 0) {
        totalDebt += due;
        debtorCount++;
        if (paid > 0) partialCount++;
      } else if (paid > 0) {
        paidCount++;
      }
    });

    return { totalDebt, debtorCount, paidCount, partialCount };
  }, [students]);

  return (
    <div className="p-3 sm:p-6 max-w-7xl mx-auto space-y-4 sm:space-y-6 animate-fadeIn font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2.5">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center shrink-0">
              <AlertCircle size={18} />
            </div>
            Qarzdorlik Nazorati
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Talabalarning to'lov holati, qarzdorlik summasi va tezkor aloqa ma'lumotlari
          </p>
        </div>

        <button
          onClick={fetchStudents}
          className="self-start sm:self-auto px-4 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer transition-all"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          Yangilash
        </button>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Debt */}
        <div className="bg-slate-900 border border-rose-500/20 rounded-2xl p-5 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-rose-500" />
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Jami Qarzdorlik</span>
            <div className="w-8 h-8 rounded-lg bg-rose-500/10 text-rose-400 flex items-center justify-center">
              <DollarSign size={16} />
            </div>
          </div>
          <div className="text-2xl font-black text-rose-400 font-mono">
            {stats.totalDebt.toLocaleString()} <span className="text-xs text-slate-400 font-normal">UZS</span>
          </div>
          <span className="text-[11px] text-slate-500 block mt-1">Hozirgi to'lanmagan qarzlar</span>
        </div>

        {/* Debtor Students */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Qarzdor O'quvchilar</span>
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center">
              <Users size={16} />
            </div>
          </div>
          <div className="text-2xl font-black text-white font-mono">
            {stats.debtorCount} <span className="text-xs text-slate-400 font-normal">nafar</span>
          </div>
          <span className="text-[11px] text-amber-400 block mt-1">To'lov muddati kechikkan</span>
        </div>

        {/* Partially Paid */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Qisman To'lagan</span>
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center">
              <Clock size={16} />
            </div>
          </div>
          <div className="text-2xl font-black text-white font-mono">
            {stats.partialCount} <span className="text-xs text-slate-400 font-normal">nafar</span>
          </div>
          <span className="text-[11px] text-slate-500 block mt-1">Qolgan qismi to'lanmagan</span>
        </div>

        {/* Fully Paid */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">To'liq To'laganlar</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <CheckCircle2 size={16} />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-400 font-mono">
            {stats.paidCount} <span className="text-xs text-slate-400 font-normal">nafar</span>
          </div>
          <span className="text-[11px] text-slate-500 block mt-1">Qarzi yo'q o'quvchilar</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl flex flex-col md:flex-row gap-3 items-center justify-between">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Ism, telefon yoki guruh bo'yicha..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full h-10 pl-10 pr-4 bg-slate-950/70 border border-slate-800 rounded-xl text-slate-200 text-xs focus:outline-none focus:border-indigo-500 transition-all font-semibold"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Status Tabs */}
          <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs overflow-x-auto no-scrollbar w-full sm:w-auto whitespace-nowrap">
            <button
              onClick={() => setFilterStatus('DEBTORS')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer shrink-0 ${
                filterStatus === 'DEBTORS' ? 'bg-rose-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              Qarzdorlar ({stats.debtorCount})
            </button>
            <button
              onClick={() => setFilterStatus('PARTIAL')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer shrink-0 ${
                filterStatus === 'PARTIAL' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              Qisman ({stats.partialCount})
            </button>
            <button
              onClick={() => setFilterStatus('PAID')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer shrink-0 ${
                filterStatus === 'PAID' ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              To'liq ({stats.paidCount})
            </button>
            <button
              onClick={() => setFilterStatus('ALL')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer shrink-0 ${
                filterStatus === 'ALL' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Barchasi ({students.length})
            </button>
          </div>

          {/* Group Filter */}
          <select
            value={groupFilter}
            onChange={e => setGroupFilter(e.target.value)}
            className="h-9 px-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300 font-medium focus:outline-none focus:border-indigo-500 cursor-pointer"
          >
            <option value="ALL">Barcha Guruhlar</option>
            {groups.map(g => (
              <option key={g} value={g}>{g}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Debtors Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/80 border-b border-slate-800 text-[10px] uppercase tracking-wider font-extrabold text-slate-400">
              <tr>
                <th className="py-3.5 px-4">#</th>
                <th className="py-3.5 px-4">O'quvchi</th>
                <th className="py-3.5 px-4">Guruhi</th>
                <th className="py-3.5 px-4">Bog'lanish (Telefon)</th>
                <th className="py-3.5 px-4">Kurs Narxi</th>
                <th className="py-3.5 px-4">To'langan</th>
                <th className="py-3.5 px-4">Qarz Summasi</th>
                <th className="py-3.5 px-4">Holat</th>
                <th className="py-3.5 px-4 text-right">Amallar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-medium">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-12 text-slate-500 italic">
                    Hech qanday ma'lumot topilmadi
                  </td>
                </tr>
              ) : (
                filteredStudents.map((s, idx) => {
                  const balance = Number(s.balanceDue || 0);
                  const paid = Number(s.totalPaid || 0);
                  const price = Number(s.coursePrice || s.customPrice || 0);
                  const contactPhone = s.parentPhone || s.phone || '';

                  return (
                    <tr key={s.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-3.5 px-4 font-mono text-slate-500">{idx + 1}</td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-white text-sm">{s.fullName}</div>
                        <div className="text-[11px] text-slate-500 font-mono">@{s.username || 'student'}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="inline-block px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 font-bold text-indigo-400 text-[11px]">
                          {s.groupName || 'Guruhsiz'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="space-y-1">
                          {s.phone && (
                            <a href={`tel:${s.phone}`} className="flex items-center gap-1.5 text-slate-300 hover:text-indigo-300 font-mono text-[11px]">
                              <Phone size={11} className="text-indigo-400" />
                              {s.phone}
                            </a>
                          )}
                          {s.parentPhone && (
                            <a href={`tel:${s.parentPhone}`} className="flex items-center gap-1.5 text-amber-300 hover:text-amber-200 font-mono text-[11px]" title="Ota-onasi">
                              <PhoneCall size={11} className="text-amber-400" />
                              Ota-onasi: {s.parentPhone}
                            </a>
                          )}
                          {!s.phone && !s.parentPhone && (
                            <span className="text-slate-600 italic text-[11px]">Kiritilmagan</span>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-300">
                        {price > 0 ? `${price.toLocaleString()} UZS` : '-'}
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-emerald-400">
                        {paid > 0 ? `${paid.toLocaleString()} UZS` : '0 UZS'}
                      </td>
                      <td className="py-3.5 px-4 font-mono font-extrabold text-sm">
                        {balance > 0 ? (
                          <span className="text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">
                            {balance.toLocaleString()} UZS
                          </span>
                        ) : (
                          <span className="text-slate-500 font-normal">0 UZS</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        {balance > 0 ? (
                          paid > 0 ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                              Qisman To'langan
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                              Qarzdor
                            </span>
                          )
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            To'langan
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {contactPhone && (
                            <a
                              href={`tel:${contactPhone}`}
                              title="Qo'ng'iroq qilish"
                              className="w-8 h-8 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 flex items-center justify-center transition-all"
                            >
                              <PhoneCall size={14} />
                            </a>
                          )}
                          {balance > 0 && setCurrentPage && (
                            <button
                              onClick={() => setCurrentPage('cashier')}
                              title="Kassada to'lov qabul qilish"
                              className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 shadow shadow-indigo-600/30 transition-all cursor-pointer"
                            >
                              <CreditCard size={13} />
                              <span>To'lov</span>
                            </button>
                          )}
                        </div>
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
