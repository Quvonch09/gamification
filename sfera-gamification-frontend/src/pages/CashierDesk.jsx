import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { 
  CreditCard, 
  DollarSign, 
  Search, 
  CheckCircle2, 
  Clock, 
  Users, 
  Printer, 
  PlusCircle, 
  AlertTriangle, 
  TrendingUp, 
  UserCheck, 
  Receipt, 
  X, 
  RefreshCw, 
  Check, 
  User, 
  Phone, 
  Calendar,
  Layers,
  Filter
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import CustomSelect from '../components/CustomSelect';

export default function CashierDesk({ refreshTrigger }) {
  const { user } = useAuth();

  // Active Sub-Tab for Cashier: 'PAY_DESK' | 'DASHBOARD' | 'STUDENTS' | 'PROFILE'
  const [activeTab, setActiveTab] = useState('PAY_DESK');

  const [students, setStudents] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  // Quick Payment Intake Form
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('CASH'); // CASH, CARD, BANK
  const [paymentNotes, setPaymentNotes] = useState('');
  const [submittingPayment, setSubmittingPayment] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(null);
  const [paymentError, setPaymentError] = useState('');

  // Print Receipt Modal
  const [receiptModal, setReceiptModal] = useState(null);

  // Student Payment List Filters
  const [studentSearch, setStudentSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL'); // ALL | DEBTOR | PAID | PARTIALLY_PAID

  useEffect(() => {
    loadData();
  }, [refreshTrigger]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [studentsRes, invoicesRes] = await Promise.all([
        axios.get('/api/students'),
        axios.get('/api/finance/invoices').catch(() => ({ data: [] }))
      ]);

      const stdList = studentsRes.data || [];
      const invList = invoicesRes.data || [];

      setStudents(stdList);
      setInvoices(invList);

      // Extract all payments from invoices
      const allPayments = [];
      invList.forEach(inv => {
        if (inv.payments && Array.isArray(inv.payments)) {
          inv.payments.forEach(p => {
            allPayments.push({
              ...p,
              studentName: inv.studentName,
              groupName: inv.groupName,
              invoiceId: inv.id
            });
          });
        }
      });
      // Sort payments latest first
      allPayments.sort((a, b) => new Date(b.paymentDate || 0) - new Date(a.paymentDate || 0));
      setPayments(allPayments);
    } catch (err) {
      console.error("Error loading cashier data", err);
    } finally {
      setLoading(false);
    }
  };

  // Selected Student Object for Quick Pay
  const selectedStudent = useMemo(() => {
    if (!selectedStudentId) return null;
    return students.find(s => String(s.id) === String(selectedStudentId));
  }, [students, selectedStudentId]);

  // Autofill payment amount when student is selected
  useEffect(() => {
    if (selectedStudent) {
      if (selectedStudent.balanceDue > 0) {
        setPaymentAmount(selectedStudent.balanceDue);
      } else if (selectedStudent.coursePrice > 0) {
        setPaymentAmount(selectedStudent.coursePrice);
      } else {
        setPaymentAmount('500000');
      }
    }
  }, [selectedStudent]);

  // Metrics for Cashier Dashboard
  const metrics = useMemo(() => {
    const today = new Date().toISOString().substring(0, 10);
    let todayCash = 0;
    let todayCard = 0;
    let todayBank = 0;
    let todayTotal = 0;

    payments.forEach(p => {
      const pDate = (p.paymentDate || '').substring(0, 10);
      const amt = Number(p.amount) || 0;
      if (pDate === today) {
        todayTotal += amt;
        if (p.method === 'CASH') todayCash += amt;
        else if (p.method === 'CARD') todayCard += amt;
        else todayBank += amt;
      }
    });

    let totalDebtorsCount = 0;
    let totalDebtAmount = 0;
    students.forEach(s => {
      if (s.balanceDue > 0) {
        totalDebtorsCount++;
        totalDebtAmount += Number(s.balanceDue);
      }
    });

    return {
      todayTotal,
      todayCash,
      todayCard,
      todayBank,
      todayCount: payments.filter(p => (p.paymentDate || '').substring(0, 10) === today).length,
      totalDebtorsCount,
      totalDebtAmount
    };
  }, [payments, students]);

  // Handle Amount Blur to auto append 3 zeros
  const handleAmountBlur = () => {
    if (!paymentAmount) return;
    const num = parseInt(String(paymentAmount).replace(/\D/g, ''), 10);
    if (!isNaN(num) && num > 0) {
      if (num < 10000) {
        setPaymentAmount(String(num * 1000));
      } else {
        setPaymentAmount(String(num));
      }
    }
  };

  // Handle Quick Payment Process
  const handleProcessPayment = async (e) => {
    e.preventDefault();
    let finalAmount = Number(String(paymentAmount).replace(/\D/g, ''));
    if (finalAmount > 0 && finalAmount < 10000) {
      finalAmount = finalAmount * 1000;
      setPaymentAmount(String(finalAmount));
    }

    if (!selectedStudentId || !finalAmount || finalAmount <= 0) {
      setPaymentError("Iltimos, o'quvchi va to'lov summasini to'g'ri kiriting!");
      return;
    }

    setSubmittingPayment(true);
    setPaymentError('');
    setPaymentSuccess(null);

    try {
      const payRes = await axios.post('/api/finance/quick-pay', {
        studentId: selectedStudentId,
        amount: finalAmount,
        paymentMethod: paymentMethod,
        notes: paymentNotes || "Kassa to'lovi"
      });

      const receiptData = {
        receiptNo: payRes.data.receiptNo || `REC-${Date.now().toString().slice(-6)}`,
        studentName: payRes.data.studentName || selectedStudent?.fullName || "O'quvchi",
        studentPhone: payRes.data.studentPhone || selectedStudent?.phone || "-",
        groupName: payRes.data.groupName || selectedStudent?.groupName || "Guruhsiz",
        amount: payRes.data.amount || finalAmount,
        method: payRes.data.method || paymentMethod,
        date: new Date().toLocaleString(),
        cashierName: payRes.data.cashierName || user?.fullName || "Kassir",
        notes: payRes.data.notes || paymentNotes
      };

      setPaymentSuccess(receiptData);
      loadData();
    } catch (err) {
      console.error("Error processing payment", err);
      setPaymentError(err.response?.data || "To'lovni amalga oshirishda xatolik yuz berdi!");
    } finally {
      setSubmittingPayment(false);
    }
  };

  // Filtered Students for Payment Tracking Table
  const filteredStudents = useMemo(() => {
    return students.filter(s => {
      // Status filter
      if (statusFilter === 'DEBTOR' && (!s.balanceDue || s.balanceDue <= 0)) return false;
      if (statusFilter === 'PAID' && s.paymentStatus !== 'PAID') return false;
      if (statusFilter === 'PARTIALLY_PAID' && s.paymentStatus !== 'PARTIALLY_PAID') return false;

      // Search query
      if (studentSearch.trim()) {
        const q = studentSearch.toLowerCase();
        const matchName = (s.fullName || '').toLowerCase().includes(q);
        const matchPhone = (s.phone || '').toLowerCase().includes(q);
        const matchGroup = (s.groupName || '').toLowerCase().includes(q);
        if (!matchName && !matchPhone && !matchGroup) return false;
      }

      return true;
    });
  }, [students, statusFilter, studentSearch]);

  const selectStudentForPay = (std) => {
    setSelectedStudentId(std.id);
    setActiveTab('PAY_DESK');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-[1600px] mx-auto text-slate-100 font-sans pb-24">
      
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/90 border border-slate-800 p-5 rounded-2xl shadow-xl backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-br from-emerald-500 to-teal-700 text-white rounded-xl shadow-lg shadow-emerald-500/25">
            <Receipt className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
              Kassa & To'lovlar Markazi
            </h1>
            <p className="text-xs md:text-sm text-slate-400 mt-0.5">
              O'quvchilardan to'lovlarni tezkor qabul qilish, kassa cheki chiqarish va qarzdorlik nazorati
            </p>
          </div>
        </div>

        {/* Tab Navigation Buttons */}
        <div className="flex items-center gap-2 bg-slate-950/80 p-1 rounded-xl border border-slate-800 self-start md:self-auto overflow-x-auto">
          <button
            onClick={() => setActiveTab('PAY_DESK')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'PAY_DESK'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>To'lov Qabul Qilish</span>
          </button>

          <button
            onClick={() => setActiveTab('DASHBOARD')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'DASHBOARD'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Kassa Dashboard</span>
          </button>

          <button
            onClick={() => setActiveTab('STUDENTS')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'STUDENTS'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>O'quvchilar To'lovlari</span>
          </button>

          <button
            onClick={() => setActiveTab('PROFILE')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'PROFILE'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Profilim</span>
          </button>
        </div>
      </div>

      {/* --- TAB 1: QUICK PAYMENT INTAKE DESK --- */}
      {activeTab === 'PAY_DESK' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left 2 Cols: Payment Form */}
          <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl">
            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-emerald-400" />
              <span>Yangi To'lov Qabul Qilish</span>
            </h2>

            {/* Error and Success Banners */}
            {paymentError && (
              <div className="p-4 bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs rounded-xl mb-4 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{paymentError}</span>
              </div>
            )}

            {paymentSuccess && (
              <div className="p-5 bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs rounded-2xl mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-500 text-slate-950 rounded-xl font-bold">
                    <Check className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-sm text-white">To'lov muvaffaqiyatli qabul qilindi!</h4>
                    <p className="text-emerald-300/90 text-xs mt-0.5">
                      {paymentSuccess.studentName} — {paymentSuccess.amount?.toLocaleString()} UZS ({paymentSuccess.method})
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setReceiptModal(paymentSuccess)}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-lg shadow-emerald-600/30 cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>Chekni Chop Etish</span>
                </button>
              </div>
            )}

            <form onSubmit={handleProcessPayment} className="space-y-5">
              
              {/* Student Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1.5">
                  TALABANI TANLANG *
                </label>
                <CustomSelect
                  value={selectedStudentId}
                  onChange={(val) => setSelectedStudentId(val)}
                  options={[
                    { value: '', label: "--- O'quvchini qidirish yoki tanlash ---" },
                    ...students.map(s => ({
                      value: s.id,
                      label: `${s.fullName} (${s.groupName || 'Guruhsiz'}) — ${s.balanceDue > 0 ? `Qarz: ${Number(s.balanceDue).toLocaleString()} UZS` : `To'liq to'langan`}`
                    }))
                  ]}
                  placeholder="Talabani tanlang..."
                />
              </div>

              {/* Selected Student Summary Box */}
              {selectedStudent && (
                <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-xl grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div>
                    <span className="text-slate-400">Guruh:</span>
                    <p className="font-bold text-white">{selectedStudent.groupName || 'Guruhsiz'}</p>
                  </div>
                  <div>
                    <span className="text-slate-400">Kurs narxi:</span>
                    <p className="font-mono font-bold text-slate-200">{(selectedStudent.coursePrice || 0).toLocaleString()} UZS</p>
                  </div>
                  <div>
                    <span className="text-slate-400">Jami to'langan:</span>
                    <p className="font-mono font-bold text-emerald-400">{(selectedStudent.totalPaid || 0).toLocaleString()} UZS</p>
                  </div>
                  <div>
                    <span className="text-slate-400">Qarzdorlik:</span>
                    <p className="font-mono font-bold text-rose-400">{(selectedStudent.balanceDue || 0).toLocaleString()} UZS</p>
                  </div>
                </div>
              )}

              {/* Amount and Payment Method */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold text-slate-400">
                      TO'LOV SUMMASI (UZS) *
                    </label>
                    {paymentAmount && (
                      <span className="text-xs font-mono font-extrabold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                        {Number(Number(paymentAmount) < 10000 && Number(paymentAmount) > 0 ? Number(paymentAmount) * 1000 : Number(paymentAmount) || 0).toLocaleString()} UZS
                      </span>
                    )}
                  </div>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      placeholder="Masalan: 500 yoki 500000"
                      value={paymentAmount}
                      onChange={(e) => setPaymentAmount(e.target.value)}
                      onBlur={handleAmountBlur}
                      className="w-full h-11 pl-3.5 pr-14 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono font-bold text-base focus:outline-none focus:border-emerald-500"
                    />
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => {
                          const num = parseInt(String(paymentAmount).replace(/\D/g, ''), 10);
                          if (!isNaN(num) && num > 0) {
                            setPaymentAmount(String(num * 1000));
                          }
                        }}
                        className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-bold rounded-md border border-slate-600 cursor-pointer"
                        title="3 ta nol qo'shish"
                      >
                        +000
                      </button>
                    </div>
                  </div>
                  {/* Quick Presets */}
                  <div className="flex items-center gap-1.5 mt-2 flex-wrap text-xs">
                    <span className="text-[10px] text-slate-500 font-semibold mr-1">Tezkor:</span>
                    {[
                      { label: '500k', val: '500000' },
                      { label: '600k', val: '600000' },
                      { label: '700k', val: '700000' },
                      { label: '1 mln', val: '1000000' },
                      { label: '1.2 mln', val: '1200000' }
                    ].map(preset => (
                      <button
                        key={preset.val}
                        type="button"
                        onClick={() => setPaymentAmount(preset.val)}
                        className="px-2 py-0.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-emerald-500/50 text-slate-400 hover:text-emerald-300 text-[10px] font-mono cursor-pointer transition-all"
                      >
                        {preset.label}
                      </button>
                    ))}
                    {selectedStudent && selectedStudent.balanceDue > 0 && (
                      <button
                        type="button"
                        onClick={() => setPaymentAmount(String(selectedStudent.balanceDue))}
                        className="px-2 py-0.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 hover:bg-rose-500/20 text-[10px] font-bold cursor-pointer transition-all"
                      >
                        Qarz: {Number(selectedStudent.balanceDue).toLocaleString()} UZS
                      </button>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1.5">
                    TO'LOV USULI *
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('CASH')}
                      className={`py-2.5 rounded-xl font-bold text-xs border transition-all cursor-pointer ${
                        paymentMethod === 'CASH'
                          ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 shadow-sm'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      💵 Naqd
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('CARD')}
                      className={`py-2.5 rounded-xl font-bold text-xs border transition-all cursor-pointer ${
                        paymentMethod === 'CARD'
                          ? 'bg-blue-500/20 border-blue-500 text-blue-300 shadow-sm'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      💳 Karta
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('BANK')}
                      className={`py-2.5 rounded-xl font-bold text-xs border transition-all cursor-pointer ${
                        paymentMethod === 'BANK'
                          ? 'bg-purple-500/20 border-purple-500 text-purple-300 shadow-sm'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      🏦 Bank
                    </button>
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1.5">
                  IZOH YOKI CHEK MA'LUMOTI
                </label>
                <input
                  type="text"
                  placeholder="Masalan: Sentabr oyi to'lovi (Payme / Kvitansiya raqami)"
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  className="w-full h-10 px-3.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={submittingPayment || !selectedStudentId}
                className="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 text-white font-extrabold text-sm rounded-xl transition-all shadow-xl shadow-emerald-600/30 flex items-center justify-center gap-2 cursor-pointer active:scale-98"
              >
                {submittingPayment ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Qabul qilinmoqda...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-5 h-5" />
                    <span>To'lovni Tasdiqlash & Qabul Qilish</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Right 1 Col: Recent Payments Log */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-2xl flex flex-col">
            <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
              <Clock className="w-4 h-4 text-emerald-400" />
              <span>Oxirgi Qabul Qilingan To'lovlar</span>
            </h3>

            <div className="space-y-2.5 overflow-y-auto max-h-[420px] pr-1">
              {payments.length === 0 ? (
                <div className="text-center py-10 text-slate-500 text-xs italic">
                  To'lovlar tarixi mavjud emas.
                </div>
              ) : (
                payments.slice(0, 8).map((p, idx) => (
                  <div 
                    key={p.id || idx}
                    className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl flex items-center justify-between text-xs hover:border-slate-700 transition-colors"
                  >
                    <div>
                      <h4 className="font-bold text-white truncate max-w-[140px]">{p.studentName}</h4>
                      <div className="text-[10px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                        <span className="uppercase font-semibold text-emerald-400">{p.method}</span>
                        <span>•</span>
                        <span>{new Date(p.paymentDate).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="font-mono font-bold text-emerald-400 text-xs">
                        +{Number(p.amount).toLocaleString()} UZS
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* --- TAB 2: CASHIER DASHBOARD --- */}
      {activeTab === 'DASHBOARD' && (
        <div className="space-y-6">
          {/* KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl flex items-center gap-4">
              <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
                <DollarSign className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs text-slate-400 font-medium">Bugungi jami tushum</span>
                <h3 className="text-xl md:text-2xl font-black text-emerald-400 font-mono">
                  {metrics.todayTotal.toLocaleString()} <span className="text-xs font-normal text-slate-400">UZS</span>
                </h3>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl flex items-center gap-4">
              <div className="p-3 bg-teal-500/10 text-teal-400 rounded-xl border border-teal-500/20">
                <CreditCard className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs text-slate-400 font-medium">Bugungi naqd tushum</span>
                <h3 className="text-lg md:text-xl font-bold text-teal-300 font-mono">
                  {metrics.todayCash.toLocaleString()} <span className="text-xs font-normal text-slate-400">UZS</span>
                </h3>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl flex items-center gap-4">
              <div className="p-3 bg-blue-500/10 text-blue-400 rounded-xl border border-blue-500/20">
                <CreditCard className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs text-slate-400 font-medium">Bugungi karta / bank</span>
                <h3 className="text-lg md:text-xl font-bold text-blue-300 font-mono">
                  {(metrics.todayCard + metrics.todayBank).toLocaleString()} <span className="text-xs font-normal text-slate-400">UZS</span>
                </h3>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl flex items-center gap-4">
              <div className="p-3 bg-rose-500/10 text-rose-400 rounded-xl border border-rose-500/20">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs text-slate-400 font-medium">Jami qarzdorlik balansi</span>
                <h3 className="text-lg md:text-xl font-bold text-rose-400 font-mono">
                  {metrics.totalDebtAmount.toLocaleString()} <span className="text-xs font-normal text-slate-400">UZS</span>
                </h3>
              </div>
            </div>
          </div>

          {/* Full Payments Log Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Receipt className="w-4 h-4 text-emerald-400" />
                <span>Barcha Kassa Qabullari</span>
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 font-bold uppercase h-11">
                    <th className="px-6 font-bold">O'quvchi</th>
                    <th className="px-6 font-bold">Guruh</th>
                    <th className="px-6 font-bold">Summa</th>
                    <th className="px-6 font-bold">To'lov Turi</th>
                    <th className="px-6 font-bold">Sana</th>
                    <th className="px-6 font-bold">Izoh</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-medium">
                  {payments.length === 0 ? (
                    <tr><td colSpan="6" className="text-center py-12 text-slate-500 italic">To'lovlar yo'q</td></tr>
                  ) : (
                    payments.map((p, i) => (
                      <tr key={p.id || i} className="hover:bg-slate-800/30 h-13">
                        <td className="px-6 font-bold text-slate-100">{p.studentName}</td>
                        <td className="px-6 text-slate-400">{p.groupName || '—'}</td>
                        <td className="px-6 font-mono font-bold text-emerald-400">+{Number(p.amount).toLocaleString()} UZS</td>
                        <td className="px-6">
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-800 border border-slate-700 text-slate-300 uppercase">
                            {p.method === 'CASH' ? 'Naqd' : p.method === 'CARD' ? 'Karta' : 'Bank'}
                          </span>
                        </td>
                        <td className="px-6 text-slate-400">{new Date(p.paymentDate).toLocaleString()}</td>
                        <td className="px-6 text-slate-500 max-w-xs truncate">{p.notes || '—'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* --- TAB 3: STUDENTS PAYMENT CONTROL --- */}
      {activeTab === 'STUDENTS' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden space-y-4">
          
          {/* Filter Bar */}
          <div className="p-4 md:px-6 border-b border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-950/40">
            {/* Status Pills */}
            <div className="flex items-center gap-2 overflow-x-auto">
              {[
                { id: 'ALL', label: "Barchasi" },
                { id: 'DEBTOR', label: "Qarzdorlar (Qarzi borlar)" },
                { id: 'PAID', label: "To'liq to'laganlar" },
                { id: 'PARTIALLY_PAID', label: "Qisman to'laganlar" }
              ].map(f => (
                <button
                  key={f.id}
                  onClick={() => setStatusFilter(f.id)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    statusFilter === f.id
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* Search */}
            <div className="relative w-full md:w-64">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="O'quvchi ismi, guruh yoki telefon..."
                value={studentSearch}
                onChange={(e) => setStudentSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs md:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Students Payment Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 font-bold uppercase h-12">
                  <th className="px-6 font-bold">O'quvchi F.I.O</th>
                  <th className="px-6 font-bold">Telefon</th>
                  <th className="px-6 font-bold">Guruh & Kurs</th>
                  <th className="px-6 font-bold">Kurs Narxi</th>
                  <th className="px-6 font-bold">To'langan</th>
                  <th className="px-6 font-bold">Qarzdorlik</th>
                  <th className="px-6 font-bold">Holat</th>
                  <th className="px-6 font-bold text-center">To'lov Olish</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium">
                {filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="text-center py-16 text-slate-500 italic">
                      O'quvchilar topilmadi.
                    </td>
                  </tr>
                ) : (
                  filteredStudents.map((std) => (
                    <tr key={std.id} className="hover:bg-slate-800/30 transition-colors h-14">
                      {/* Name */}
                      <td className="px-6 font-bold text-slate-100 text-sm">
                        {std.fullName}
                      </td>

                      {/* Phone */}
                      <td className="px-6 text-slate-400 font-mono text-xs">
                        {std.phone || '—'}
                      </td>

                      {/* Group */}
                      <td className="px-6 font-semibold text-slate-300">
                        {std.groupName || 'Guruhsiz'}
                      </td>

                      {/* Course Price */}
                      <td className="px-6 font-mono text-slate-300">
                        {(std.coursePrice || 0).toLocaleString()} UZS
                      </td>

                      {/* Total Paid */}
                      <td className="px-6 font-mono font-bold text-emerald-400">
                        {(std.totalPaid || 0).toLocaleString()} UZS
                      </td>

                      {/* Balance Due */}
                      <td className="px-6 font-mono font-bold text-rose-400">
                        {std.balanceDue > 0 ? `${(std.balanceDue).toLocaleString()} UZS` : '0 UZS'}
                      </td>

                      {/* Status Badge */}
                      <td className="px-6">
                        {std.paymentStatus === 'PAID' && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                            To'liq to'langan
                          </span>
                        )}
                        {std.paymentStatus === 'PARTIALLY_PAID' && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                            Qisman to'langan
                          </span>
                        )}
                        {std.paymentStatus === 'DEBTOR' && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                            Qarzdor
                          </span>
                        )}
                        {(!std.paymentStatus || std.paymentStatus === 'NO_FEE') && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-500/20 text-slate-400 border border-slate-500/30">
                            Kurs narxisiz
                          </span>
                        )}
                      </td>

                      {/* Action: Quick Pay */}
                      <td className="px-6 text-center">
                        <button
                          onClick={() => selectStudentForPay(std)}
                          className="px-3 py-1.5 bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white border border-emerald-500/30 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm active:scale-95"
                        >
                          To'lov kiritish
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* --- TAB 4: PROFILE --- */}
      {activeTab === 'PROFILE' && (
        <div className="max-w-2xl mx-auto bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-6">
          <div className="flex items-center gap-4 border-b border-slate-800 pb-6">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center font-black text-2xl text-white shadow-xl shadow-emerald-500/25">
              {user?.fullName?.charAt(0) || 'K'}
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">{user?.fullName || "Kassir"}</h2>
              <span className="text-xs bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2.5 py-0.5 rounded-full font-semibold">
                Kassir (Cashier)
              </span>
              <p className="text-xs text-slate-400 font-mono mt-1">@{user?.username}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 text-xs">
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
              <span className="text-slate-400">Rol:</span>
              <p className="font-bold text-white text-sm mt-0.5">Kassir / Kassa Mas'uli</p>
            </div>
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
              <span className="text-slate-400">Ruxsatlar:</span>
              <p className="font-bold text-emerald-400 text-sm mt-0.5">To'lovlar, Kassa cheklari</p>
            </div>
          </div>
        </div>
      )}

      {/* --- RECEIPT MODAL / PRINT PREVIEW --- */}
      {receiptModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white text-slate-900 rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl p-6 font-mono text-xs">
            {/* Header */}
            <div className="text-center border-b-2 border-dashed border-slate-300 pb-4">
              <h3 className="text-base font-black tracking-tight">SFERA IT ACADEMY</h3>
              <p className="text-[11px] text-slate-600">KASSA TO'LOV KVITANSIYASI</p>
              <p className="text-[10px] text-slate-500 mt-1">№ {receiptModal.receiptNo}</p>
            </div>

            {/* Body */}
            <div className="py-4 space-y-2.5 border-b-2 border-dashed border-slate-300">
              <div className="flex justify-between">
                <span className="text-slate-600">Sana:</span>
                <span className="font-bold">{receiptModal.date}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Talaba:</span>
                <span className="font-bold">{receiptModal.studentName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Guruh:</span>
                <span className="font-bold">{receiptModal.groupName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">To'lov Usuli:</span>
                <span className="font-bold uppercase">{receiptModal.method}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Kassir:</span>
                <span className="font-bold">{receiptModal.cashierName}</span>
              </div>
              {receiptModal.notes && (
                <div className="text-[10px] text-slate-500 pt-1">
                  Izoh: {receiptModal.notes}
                </div>
              )}
            </div>

            {/* Total */}
            <div className="py-4 flex justify-between items-center text-sm font-black">
              <span>JAMI TO'LANDI:</span>
              <span className="text-base font-bold">{receiptModal.amount?.toLocaleString()} UZS</span>
            </div>

            {/* Footer */}
            <div className="text-center text-[10px] text-slate-500 pt-2 border-t border-slate-200">
              To'lovingiz uchun rahmat!
            </div>

            {/* Actions */}
            <div className="mt-5 flex gap-2 no-print">
              <button
                onClick={() => setReceiptModal(null)}
                className="flex-1 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold rounded-xl text-xs cursor-pointer"
              >
                Yopish
              </button>
              <button
                onClick={() => window.print()}
                className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Chop etish</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
