import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  TrendingDown, 
  Plus, 
  Search, 
  Filter, 
  Calendar, 
  DollarSign, 
  CreditCard, 
  Building, 
  Users, 
  Megaphone, 
  Zap, 
  Box, 
  FileText, 
  Trash2, 
  Edit3, 
  X, 
  Check, 
  Printer, 
  RefreshCw,
  PieChart
} from 'lucide-react';
import CustomSelect from '../components/CustomSelect';

const CATEGORIES = [
  { value: 'RENT', label: 'Bino / Xona Ijarasi', icon: Building, color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
  { value: 'SALARY', label: 'Oylik Maoshlar', icon: Users, color: 'text-blue-400 bg-blue-500/10 border-blue-500/20' },
  { value: 'MARKETING', label: 'Marketing & Reklama', icon: Megaphone, color: 'text-purple-400 bg-purple-500/10 border-purple-500/20' },
  { value: 'UTILITIES', label: 'Kommunal & Internet', icon: Zap, color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
  { value: 'EQUIPMENT', label: 'Jihozlar & Texnika', icon: Box, color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20' },
  { value: 'OTHER', label: 'Boshqa Xarajatlar', icon: FileText, color: 'text-slate-400 bg-slate-500/10 border-slate-500/20' },
];

export default function Expenses({ refreshTrigger }) {
  const [expenses, setExpenses] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().substring(0, 7)); // "YYYY-MM"
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [expenseForm, setExpenseForm] = useState({
    title: '',
    amount: '',
    category: 'RENT',
    paymentMethod: 'CASH',
    expenseDate: new Date().toISOString().substring(0, 10),
    notes: ''
  });
  const [modalLoading, setModalLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    loadData();
  }, [refreshTrigger, selectedMonth, selectedCategory]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [listRes, summaryRes] = await Promise.all([
        axios.get(`/api/finance/expenses?month=${selectedMonth}&category=${selectedCategory}`),
        axios.get(`/api/finance/expenses/summary?month=${selectedMonth}`)
      ]);
      setExpenses(listRes.data || []);
      setSummary(summaryRes.data || null);
    } catch (err) {
      console.error("Error loading expenses", err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setEditingExpense(null);
    setExpenseForm({
      title: '',
      amount: '',
      category: 'RENT',
      paymentMethod: 'CASH',
      expenseDate: new Date().toISOString().substring(0, 10),
      notes: ''
    });
    setErrorMsg('');
    setSuccessMsg('');
    setShowAddModal(true);
  };

  const handleOpenEdit = (exp) => {
    setEditingExpense(exp);
    setExpenseForm({
      title: exp.title,
      amount: exp.amount,
      category: exp.category || 'OTHER',
      paymentMethod: exp.paymentMethod || 'CASH',
      expenseDate: exp.expenseDate,
      notes: exp.notes || ''
    });
    setErrorMsg('');
    setSuccessMsg('');
    setShowAddModal(true);
  };

  const handleExpenseAmountBlur = () => {
    if (!expenseForm.amount) return;
    const num = parseInt(String(expenseForm.amount).replace(/\D/g, ''), 10);
    if (!isNaN(num) && num > 0) {
      if (num < 10000) {
        setExpenseForm(prev => ({ ...prev, amount: String(num * 1000) }));
      } else {
        setExpenseForm(prev => ({ ...prev, amount: String(num) }));
      }
    }
  };

  const handleSubmitExpense = async (e) => {
    e.preventDefault();
    let finalAmount = Number(String(expenseForm.amount).replace(/\D/g, ''));
    if (finalAmount > 0 && finalAmount < 10000) {
      finalAmount = finalAmount * 1000;
    }

    if (!expenseForm.title || !finalAmount || finalAmount <= 0) {
      setErrorMsg("Xarajat nomi va summasi majburiy!");
      return;
    }

    const payload = { ...expenseForm, amount: finalAmount };

    setModalLoading(true);
    setErrorMsg('');
    try {
      if (editingExpense) {
        await axios.put(`/api/finance/expenses/${editingExpense.id}`, payload);
        setSuccessMsg("Xarajat muvaffaqiyatli yangilandi!");
      } else {
        await axios.post('/api/finance/expenses', payload);
        setSuccessMsg("Yangi xarajat muvaffaqiyatli saqlandi!");
      }
      loadData();
      setTimeout(() => {
        setShowAddModal(false);
        setSuccessMsg('');
      }, 1000);
    } catch (err) {
      console.error(err);
      setErrorMsg(err.response?.data || "Xarajatni saqlashda xatolik yuz berdi.");
    } finally {
      setModalLoading(false);
    }
  };

  const handleDeleteExpense = async (id) => {
    if (!window.confirm("Ushbu xarajatni o'chirib tashlamoqchimisiz?")) return;
    try {
      await axios.delete(`/api/finance/expenses/${id}`);
      loadData();
    } catch (err) {
      console.error("Error deleting expense", err);
    }
  };

  const getCategoryInfo = (catKey) => {
    return CATEGORIES.find(c => c.value === catKey) || {
      label: catKey || "Boshqa",
      icon: FileText,
      color: "text-slate-400 bg-slate-500/10 border-slate-500/20"
    };
  };

  const filteredExpenses = expenses.filter(e => {
    const q = searchQuery.toLowerCase();
    const catInfo = getCategoryInfo(e.category);
    return (
      (e.title || '').toLowerCase().includes(q) ||
      catInfo.label.toLowerCase().includes(q) ||
      (e.notes || '').toLowerCase().includes(q) ||
      (e.createdByName || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-[1600px] mx-auto text-slate-100 font-sans pb-20">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/90 border border-slate-800 p-5 rounded-2xl shadow-xl backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-br from-rose-500 to-rose-700 text-white rounded-xl shadow-lg shadow-rose-500/25">
            <TrendingDown className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
              Markaz Xarajatlari (Expenses)
            </h1>
            <p className="text-xs md:text-sm text-slate-400 mt-0.5">
              Ijara, oyliklar, marketing, kommunal va boshqa operatsion xarajatlar monitoringi
            </p>
          </div>
        </div>

        <div className="flex items-center flex-wrap gap-2.5">
          <button
            onClick={handleOpenAdd}
            className="px-4 py-2 bg-gradient-to-r from-rose-600 to-indigo-600 hover:from-rose-500 hover:to-indigo-500 text-white text-xs md:text-sm font-semibold rounded-xl flex items-center gap-2 shadow-lg shadow-rose-600/20 transition-all active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Xarajat Kiritish</span>
          </button>

          <button
            onClick={() => window.print()}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs md:text-sm font-medium rounded-xl flex items-center gap-2 transition-all active:scale-95 shadow-sm cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span className="hidden sm:inline">Chop etish</span>
          </button>

          <button
            onClick={loadData}
            disabled={loading}
            className="p-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 rounded-xl transition-all active:scale-95 shadow-sm cursor-pointer"
            title="Yangilash"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-rose-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Month Expenses */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl flex items-center gap-4">
          <div className="p-3 bg-rose-500/10 text-rose-400 rounded-xl border border-rose-500/20">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-medium">Shu oydagi jami xarajat</span>
            <h3 className="text-xl md:text-2xl font-black text-rose-400 font-mono">
              {summary?.totalExpenses ? Number(summary.totalExpenses).toLocaleString() : 0} <span className="text-xs font-normal text-slate-400">UZS</span>
            </h3>
          </div>
        </div>

        {/* Expenses Count */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl flex items-center gap-4">
          <div className="p-3 bg-indigo-500/10 text-indigo-400 rounded-xl border border-indigo-500/20">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-medium">Tranzaksiyalar soni</span>
            <h3 className="text-xl md:text-2xl font-black text-white">
              {summary?.count || 0} <span className="text-xs font-normal text-slate-400">ta</span>
            </h3>
          </div>
        </div>

        {/* Cash payment outlays */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl flex items-center gap-4">
          <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
            <CreditCard className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-medium">Naqd to'langan</span>
            <h3 className="text-lg md:text-xl font-bold text-emerald-400 font-mono">
              {summary?.byPaymentMethod?.CASH ? Number(summary.byPaymentMethod.CASH).toLocaleString() : 0} <span className="text-xs font-normal text-slate-400">UZS</span>
            </h3>
          </div>
        </div>

        {/* Card / Bank outlays */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl flex items-center gap-4">
          <div className="p-3 bg-cyan-500/10 text-cyan-400 rounded-xl border border-cyan-500/20">
            <Building className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-medium">Karta / Bank orqali</span>
            <h3 className="text-lg md:text-xl font-bold text-cyan-400 font-mono">
              {((summary?.byPaymentMethod?.CARD || 0) + (summary?.byPaymentMethod?.BANK || 0)).toLocaleString()} <span className="text-xs font-normal text-slate-400">UZS</span>
            </h3>
          </div>
        </div>
      </div>

      {/* Main Expenses Table Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
        
        {/* Controls Bar: Month, Category Filter, Search */}
        <div className="p-4 md:px-6 md:py-4 border-b border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-950/40">
          
          {/* Month selector and Category dropdown */}
          <div className="flex items-center flex-wrap gap-3">
            {/* Month Input */}
            <div className="flex items-center gap-2 bg-slate-800/80 border border-slate-700/80 px-3 py-1.5 rounded-xl">
              <Calendar className="w-4 h-4 text-slate-400" />
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="bg-transparent text-xs md:text-sm font-semibold text-white focus:outline-none cursor-pointer"
              />
            </div>

            {/* Category Filter */}
            <div className="w-48">
              <CustomSelect
                value={selectedCategory}
                onChange={setSelectedCategory}
                options={[
                  { value: 'ALL', label: "Barcha Kategoriyalar" },
                  ...CATEGORIES.map(c => ({ value: c.value, label: c.label }))
                ]}
                placeholder="Kategoriya bo'yicha"
              />
            </div>
          </div>

          {/* Search Input */}
          <div className="relative w-full md:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Xarajat nomi yoki izoh..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs md:text-sm text-white placeholder-slate-400 focus:outline-none focus:border-rose-500"
            />
          </div>
        </div>

        {/* Expenses List Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 font-bold uppercase tracking-wider h-12">
                <th className="px-6 font-bold">Xarajat Nomi & Tavsifi</th>
                <th className="px-6 font-bold">Kategoriya</th>
                <th className="px-6 font-bold">Summa</th>
                <th className="px-6 font-bold">To'lov Turi</th>
                <th className="px-6 font-bold">Sana</th>
                <th className="px-6 font-bold">Kirituvchi</th>
                <th className="px-6 font-bold text-center">Amallar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-medium">
              {filteredExpenses.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-16 text-slate-500 italic">
                    Ushbu oy uchun xarajatlar topilmadi.
                  </td>
                </tr>
              ) : (
                filteredExpenses.map((exp) => {
                  const catInfo = getCategoryInfo(exp.category);
                  const Icon = catInfo.icon;

                  return (
                    <tr key={exp.id} className="hover:bg-slate-800/30 transition-colors h-14">
                      {/* Title & Notes */}
                      <td className="px-6">
                        <div className="font-bold text-slate-100 text-sm">{exp.title}</div>
                        {exp.notes && (
                          <div className="text-[11px] text-slate-400 truncate max-w-xs">{exp.notes}</div>
                        )}
                      </td>

                      {/* Category Badge */}
                      <td className="px-6">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border ${catInfo.color}`}>
                          <Icon className="w-3.5 h-3.5" />
                          <span>{catInfo.label}</span>
                        </span>
                      </td>

                      {/* Amount */}
                      <td className="px-6 font-mono font-bold text-rose-400 text-sm">
                        -{Number(exp.amount).toLocaleString()} UZS
                      </td>

                      {/* Payment Method */}
                      <td className="px-6">
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-800 border border-slate-700 text-slate-300 uppercase">
                          {exp.paymentMethod === 'CASH' ? 'Naqd pul' : exp.paymentMethod === 'CARD' ? 'Karta' : 'Bank hisobi'}
                        </span>
                      </td>

                      {/* Expense Date */}
                      <td className="px-6 text-slate-400 font-mono text-xs">
                        {exp.expenseDate}
                      </td>

                      {/* Created By */}
                      <td className="px-6 text-slate-300 text-xs">
                        {exp.createdByName || 'Tizim'}
                      </td>

                      {/* Action buttons */}
                      <td className="px-6">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleOpenEdit(exp)}
                            className="p-1.5 bg-slate-800 hover:bg-indigo-600/30 text-slate-400 hover:text-indigo-300 rounded-lg transition-colors border border-slate-700/50 cursor-pointer"
                            title="Tahrirlash"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteExpense(exp.id)}
                            className="p-1.5 bg-slate-800 hover:bg-rose-600/30 text-slate-400 hover:text-rose-300 rounded-lg transition-colors border border-slate-700/50 cursor-pointer"
                            title="O'chirish"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
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

      {/* --- ADD / EDIT EXPENSE MODAL --- */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <form onSubmit={handleSubmitExpense} className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-rose-500/20 text-rose-400 rounded-xl border border-rose-500/30">
                  <TrendingDown className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">
                    {editingExpense ? "Xarajatni Tahrirlash" : "Yangi Xarajat Kiritish"}
                  </h3>
                  <p className="text-xs text-slate-400">Markaz operatsion xarajatini kiritish</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Error/Success Messages */}
            {errorMsg && (
              <div className="mx-6 mt-4 p-3 bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs rounded-xl">
                {errorMsg}
              </div>
            )}
            {successMsg && (
              <div className="mx-6 mt-4 p-3 bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs rounded-xl flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            {/* Form Fields */}
            <div className="p-6 space-y-4 text-xs md:text-sm">
              {/* Title */}
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">XARAJAT NOMI *</label>
                <input
                  type="text"
                  required
                  placeholder="Masalan: Sentabr oyi bino ijarasi"
                  value={expenseForm.title}
                  onChange={(e) => setExpenseForm({ ...expenseForm, title: e.target.value })}
                  className="w-full h-10 px-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-rose-500 text-xs md:text-sm"
                />
              </div>

              {/* Amount and Payment Method */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-slate-400">SUMMA (UZS) *</label>
                    {expenseForm.amount && (
                      <span className="text-[10px] font-mono font-bold text-rose-400">
                        {Number(Number(expenseForm.amount) < 10000 && Number(expenseForm.amount) > 0 ? Number(expenseForm.amount) * 1000 : Number(expenseForm.amount) || 0).toLocaleString()} UZS
                      </span>
                    )}
                  </div>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      placeholder="Masalan: 500 yoki 500000"
                      value={expenseForm.amount}
                      onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })}
                      onBlur={handleExpenseAmountBlur}
                      className="w-full h-10 pl-3 pr-11 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-rose-500 font-mono text-xs md:text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const num = parseInt(String(expenseForm.amount).replace(/\D/g, ''), 10);
                        if (!isNaN(num) && num > 0) {
                          setExpenseForm({ ...expenseForm, amount: String(num * 1000) });
                        }
                      }}
                      className="absolute right-1.5 top-1/2 -translate-y-1/2 px-1.5 py-0.5 bg-slate-700 hover:bg-slate-600 text-slate-300 text-[10px] font-bold rounded border border-slate-600 cursor-pointer"
                      title="3 ta nol qo'shish"
                    >
                      +000
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">TO'LOV TURI</label>
                  <CustomSelect
                    value={expenseForm.paymentMethod}
                    onChange={(val) => setExpenseForm({ ...expenseForm, paymentMethod: val })}
                    options={[
                      { value: 'CASH', label: "Naqd pul" },
                      { value: 'CARD', label: "Plastik karta" },
                      { value: 'BANK', label: "Bank o'tkazmasi" }
                    ]}
                  />
                </div>
              </div>

              {/* Category and Date */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">KATEGORIYA</label>
                  <CustomSelect
                    value={expenseForm.category}
                    onChange={(val) => setExpenseForm({ ...expenseForm, category: val })}
                    options={CATEGORIES.map(c => ({ value: c.value, label: c.label }))}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">XARAJAT SANASI</label>
                  <input
                    type="date"
                    required
                    value={expenseForm.expenseDate}
                    onChange={(e) => setExpenseForm({ ...expenseForm, expenseDate: e.target.value })}
                    className="w-full h-10 px-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-rose-500 text-xs md:text-sm"
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">QO'SHIMCHA IZOH</label>
                <textarea
                  rows={3}
                  placeholder="Xarajat bo'yicha qo'shimcha tafsilotlar yoki chek raqami..."
                  value={expenseForm.notes}
                  onChange={(e) => setExpenseForm({ ...expenseForm, notes: e.target.value })}
                  className="w-full p-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-rose-500 text-xs"
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-950/80 border-t border-slate-800 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
              >
                Bekor qilish
              </button>
              <button
                type="submit"
                disabled={modalLoading}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold rounded-xl transition-colors shadow-lg shadow-rose-600/30 flex items-center gap-2 cursor-pointer"
              >
                {modalLoading && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                <span>{editingExpense ? "Saqlash" : "Xarajatni Kiritish"}</span>
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
}
