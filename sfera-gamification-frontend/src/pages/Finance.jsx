import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Landmark, 
  Plus, 
  Search, 
  CheckCircle2, 
  AlertCircle, 
  Trash2, 
  DollarSign, 
  Calendar,
  X
} from 'lucide-react';

export default function Finance({ refreshTrigger }) {
  const [activeTab, setActiveTab] = useState('invoices'); // invoices, payments, plans
  
  // Data lists
  const [invoices, setInvoices] = useState([]);
  const [payments, setPayments] = useState([]);
  const [plans, setPlans] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search filter
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  // Form States
  const [planForm, setPlanForm] = useState({
    courseId: '',
    name: '',
    amount: '',
    durationMonths: '1'
  });

  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    paymentMethod: 'CARD',
    notes: ''
  });

  const [formError, setFormError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, [refreshTrigger]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [invRes, payRes, plansRes, coursesRes] = await Promise.all([
        axios.get('/api/finance/invoices'),
        axios.get('/api/finance/payments'),
        axios.get('/api/finance/price-plans'),
        axios.get('/api/courses')
      ]);
      setInvoices(invRes.data);
      setPayments(payRes.data);
      setPlans(plansRes.data);
      setCourses(coursesRes.data);
    } catch (err) {
      console.error("Error loading financial data", err);
    } finally {
      setLoading(false);
    }
  };

  const handlePlanSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setActionLoading(true);
    let planAmt = Number(String(planForm.amount).replace(/\D/g, ''));
    if (planAmt > 0 && planAmt < 10000) {
      planAmt = planAmt * 1000;
    }
    try {
      const payload = {
        course: { id: parseInt(planForm.courseId) },
        name: planForm.name,
        amount: planAmt,
        durationMonths: parseInt(planForm.durationMonths)
      };
      await axios.post('/api/finance/price-plans', payload);
      setShowPlanModal(false);
      setPlanForm({ courseId: '', name: '', amount: '', durationMonths: '1' });
      loadData();
    } catch (err) {
      setFormError(err.response?.data || "Tarif yaratishda xatolik yuz berdi.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeletePlan = async (id) => {
    if (!window.confirm("Haqiqatan ham bu tarifni o'chirmoqchimisiz?")) return;
    try {
      await axios.delete(`/api/finance/price-plans/${id}`);
      loadData();
    } catch (err) {
      console.error(err);
      alert("Tarifni o'chirishda xatolik. U talabalar shartnomalariga bog'langan bo'lishi mumkin.");
    }
  };

  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setActionLoading(true);
    let payAmt = Number(String(paymentForm.amount).replace(/\D/g, ''));
    if (payAmt > 0 && payAmt < 10000) {
      payAmt = payAmt * 1000;
    }
    try {
      await axios.post('/api/finance/payments', {
        invoiceId: selectedInvoice.id.toString(),
        amount: payAmt,
        paymentMethod: paymentForm.paymentMethod,
        notes: paymentForm.notes
      });
      setShowPaymentModal(false);
      setPaymentForm({ amount: '', paymentMethod: 'CARD', notes: '' });
      loadData();
    } catch (err) {
      setFormError(err.response?.data || "To'lovni saqlashda xatolik yuz berdi.");
    } finally {
      setActionLoading(false);
    }
  };

  const totalBilling = invoices.reduce((acc, curr) => acc + curr.amount, 0);
  const totalPaid = invoices.reduce((acc, curr) => acc + curr.paidAmount, 0);
  const pendingDebt = totalBilling - totalPaid;

  const filteredInvoices = invoices.filter(inv => {
    const studentName = inv.enrollment.student.firstName + ' ' + (inv.enrollment.student.lastName || '');
    return studentName.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const filteredPayments = payments.filter(pay => {
    const studentName = pay.invoice.enrollment.student.firstName + ' ' + (pay.invoice.enrollment.student.lastName || '');
    return studentName.toLowerCase().includes(searchQuery.toLowerCase());
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full text-slate-400">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-indigo-500 mr-2"></div>
        Moliya ma'lumotlari yuklanmoqda...
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 overflow-y-auto max-h-[calc(100vh-4rem)]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white">Moliya & Kassa</h1>
          <p className="text-xs text-slate-400 mt-0.5">To'lovlar, schyotlar va ta'lim tariflari boshqaruvi</p>
        </div>
        
        {activeTab === 'plans' && (
          <button
            onClick={() => setShowPlanModal(true)}
            className="flex items-center justify-center gap-1.5 px-4 h-10 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-xl transition-all shadow-lg shadow-indigo-600/20 cursor-pointer"
          >
            <Plus size={16} /> Yangi Tarif
          </button>
        )}
      </div>

      {/* KPI Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex flex-col justify-between h-24">
          <span className="text-xs font-semibold text-slate-400">Jami Faturalangan</span>
          <h2 className="text-2xl font-black text-slate-100">{totalBilling.toLocaleString()} UZS</h2>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex flex-col justify-between h-24">
          <span className="text-xs font-semibold text-slate-400">Jami To'langan</span>
          <h2 className="text-2xl font-black text-emerald-400">{totalPaid.toLocaleString()} UZS</h2>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex flex-col justify-between h-24">
          <span className="text-xs font-semibold text-slate-400">Kutilyotgan Qarzlar</span>
          <h2 className="text-2xl font-black text-rose-400">{pendingDebt.toLocaleString()} UZS</h2>
        </div>
      </div>

      {/* Tabs list */}
      <div className="flex border-b border-slate-850 gap-4 shrink-0">
        <button
          onClick={() => { setActiveTab('invoices'); setSearchQuery(''); }}
          className={`pb-3 text-sm font-bold border-b-2 px-1 cursor-pointer transition-all ${
            activeTab === 'invoices' ? 'border-indigo-500 text-white font-extrabold' : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Hisoblar (Invoices)
        </button>
        <button
          onClick={() => { setActiveTab('payments'); setSearchQuery(''); }}
          className={`pb-3 text-sm font-bold border-b-2 px-1 cursor-pointer transition-all ${
            activeTab === 'payments' ? 'border-indigo-500 text-white font-extrabold' : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Kirim To'lovlari (Payments)
        </button>
        <button
          onClick={() => { setActiveTab('plans'); setSearchQuery(''); }}
          className={`pb-3 text-sm font-bold border-b-2 px-1 cursor-pointer transition-all ${
            activeTab === 'plans' ? 'border-indigo-500 text-white font-extrabold' : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Tarif Rejalari (Price Plans)
        </button>
      </div>

      {/* Search Input for Invoices & Payments */}
      {activeTab !== 'plans' && (
        <div className="relative">
          <Search className="absolute left-3.5 top-3 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="O'quvchi ismi orqali filtrlash..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-11 pl-10 pr-4 bg-slate-900 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-indigo-500 text-sm font-semibold transition-all"
          />
        </div>
      )}

      {/* Tab Contents */}
      {activeTab === 'invoices' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/30 text-slate-400 font-bold uppercase tracking-wider h-11">
                  <th className="px-6 font-bold">O'quvchi</th>
                  <th className="px-6 font-bold">Guruh / Kurs</th>
                  <th className="px-6 font-bold">Summa</th>
                  <th className="px-6 font-bold">To'langan</th>
                  <th className="px-6 font-bold">Muddati</th>
                  <th className="px-6 font-bold text-center">Status</th>
                  <th className="px-6 font-bold text-center">Amal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium">
                {filteredInvoices.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="text-center py-8 text-slate-500 italic">Hisob-fakturalar topilmadi.</td>
                  </tr>
                ) : (
                  filteredInvoices.map((inv) => {
                    const student = inv.enrollment.student;
                    const group = inv.enrollment.group;
                    const isOverdue = new Date(inv.dueDate) < new Date() && inv.status !== 'PAID';
                    
                    return (
                      <tr key={inv.id} className="hover:bg-slate-850/40 transition-colors h-14">
                        <td className="px-6">
                          <p className="font-bold text-slate-200 text-sm">{student.firstName} {student.lastName}</p>
                          <span className="text-[10px] text-slate-500 font-medium">{student.phone}</span>
                        </td>
                        <td className="px-6 text-slate-350">
                          <p className="font-bold">{group ? group.name : "Guruhsiz"}</p>
                          <span className="text-[10px] text-slate-500 font-medium uppercase">{inv.enrollment.pricePlan.course.name}</span>
                        </td>
                        <td className="px-6 font-extrabold text-slate-200">{inv.amount.toLocaleString()} UZS</td>
                        <td className="px-6 font-semibold text-emerald-400">{inv.paidAmount.toLocaleString()} UZS</td>
                        <td className="px-6">
                          <span className={`inline-flex items-center gap-1 font-bold ${isOverdue ? 'text-rose-400' : 'text-slate-400'}`}>
                            <Calendar size={12} /> {inv.dueDate}
                          </span>
                        </td>
                        <td className="px-6 text-center">
                          <span className={`inline-block text-[10px] font-bold tracking-wider px-2 py-0.5 rounded uppercase ${
                            inv.status === 'PAID' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                            inv.status === 'PARTIALLY_PAID' ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20' :
                            'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                          }`}>
                            {inv.status === 'PAID' ? 'To\'langan' : inv.status === 'PARTIALLY_PAID' ? 'Qisman' : 'Qarzdor'}
                          </span>
                        </td>
                        <td className="px-6 text-center">
                          {inv.status !== 'PAID' && (
                            <button
                              onClick={() => {
                                setSelectedInvoice(inv);
                                setPaymentForm(prev => ({
                                  ...prev,
                                  amount: (inv.amount - inv.paidAmount).toString()
                                }));
                                setShowPaymentModal(true);
                              }}
                              className="px-3 h-8 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[10.5px] rounded-lg transition-all shadow-md shadow-emerald-600/10 cursor-pointer"
                            >
                              Kassa Qabul
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'payments' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/30 text-slate-400 font-bold uppercase tracking-wider h-11">
                  <th className="px-6 font-bold">To'lovchi O'quvchi</th>
                  <th className="px-6 font-bold">Summa</th>
                  <th className="px-6 font-bold">To'lov Usuli</th>
                  <th className="px-6 font-bold">Sana</th>
                  <th className="px-6 font-bold">Qabul Qildi</th>
                  <th className="px-6 font-bold">Izoh</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium">
                {filteredPayments.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="text-center py-8 text-slate-500 italic">To'lov kvitansiyalari topilmadi.</td>
                  </tr>
                ) : (
                  filteredPayments.map((pay) => {
                    const student = pay.invoice.enrollment.student;
                    return (
                      <tr key={pay.id} className="hover:bg-slate-850/40 transition-colors h-14">
                        <td className="px-6">
                          <p className="font-bold text-slate-200 text-sm">{student.firstName} {student.lastName}</p>
                          <span className="text-[10px] text-slate-500 font-medium">{student.phone}</span>
                        </td>
                        <td className="px-6 font-extrabold text-emerald-400">+{pay.amount.toLocaleString()} UZS</td>
                        <td className="px-6">
                          <span className="inline-block text-[10px] font-bold tracking-wider px-2 py-0.5 bg-slate-850 border border-slate-800 text-slate-300 rounded uppercase">
                            {pay.paymentMethod}
                          </span>
                        </td>
                        <td className="px-6 text-slate-400 font-semibold">{new Date(pay.createdAt).toLocaleString()}</td>
                        <td className="px-6 text-slate-350 font-bold">{pay.receivedBy?.fullName || "Tizim"}</td>
                        <td className="px-6 text-slate-400 italic max-w-xs truncate">{pay.notes || "-"}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'plans' && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {plans.length === 0 ? (
            <div className="col-span-full text-center py-12 text-slate-500 italic">Hech qanday tarif yaratilmagan.</div>
          ) : (
            plans.map((p) => (
              <div key={p.id} className="bg-slate-900 border border-slate-800 hover:border-slate-750 p-5 rounded-2xl space-y-4 shadow-lg flex flex-col justify-between group">
                <div className="space-y-2">
                  <div className="flex justify-between items-start gap-4">
                    <span className="inline-block text-[10px] font-bold text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-0.5 rounded uppercase">
                      {p.course.name}
                    </span>
                    <button
                      onClick={() => handleDeletePlan(p.id)}
                      className="text-slate-500 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                  <h3 className="text-lg font-black text-slate-100">{p.name}</h3>
                </div>

                <div className="flex items-baseline justify-between pt-2 border-t border-slate-850 text-xs font-semibold">
                  <span className="text-slate-400">{p.durationMonths} oy davomiylik</span>
                  <span className="text-xl font-black text-slate-200">{p.amount.toLocaleString()} UZS</span>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Add Price Plan Modal */}
      {showPlanModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-6 shadow-2xl relative">
            <button 
              onClick={() => setShowPlanModal(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-white cursor-pointer"
            >
              <X size={20} />
            </button>
            <div>
              <h3 className="text-lg font-bold text-slate-100">Yangi Tarif Rejasi</h3>
              <p className="text-xs text-slate-400">Kurs narxlari va shartnoma davomiyligini belgilash</p>
            </div>

            {formError && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-xs font-semibold">
                {formError}
              </div>
            )}

            <form onSubmit={handlePlanSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1 uppercase tracking-wide">Tegishli Kurs *</label>
                <select
                  required
                  value={planForm.courseId}
                  onChange={(e) => setPlanForm(prev => ({ ...prev, courseId: e.target.value }))}
                  className="w-full h-11 px-3 bg-slate-950/60 border border-slate-850 rounded-xl text-slate-200 text-sm font-semibold focus:outline-none focus:border-indigo-500"
                >
                  <option value="">Kursni tanlang...</option>
                  {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1 uppercase tracking-wide">Tarif Nomi *</label>
                <input
                  type="text"
                  required
                  placeholder="Masalan: Java Standard 6 oylik"
                  value={planForm.name}
                  onChange={(e) => setPlanForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full h-11 px-4 bg-slate-950/60 border border-slate-850 rounded-xl text-slate-200 text-sm font-semibold focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide">Oyiga to'lov (Summa) *</label>
                    {planForm.amount && (
                      <span className="text-[10px] font-mono font-bold text-emerald-400">
                        {Number(Number(planForm.amount) < 10000 && Number(planForm.amount) > 0 ? Number(planForm.amount) * 1000 : Number(planForm.amount) || 0).toLocaleString()} UZS
                      </span>
                    )}
                  </div>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      placeholder="Masalan: 600 yoki 600000"
                      value={planForm.amount}
                      onChange={(e) => setPlanForm(prev => ({ ...prev, amount: e.target.value }))}
                      onBlur={() => {
                        if (!planForm.amount) return;
                        const num = parseInt(String(planForm.amount).replace(/\D/g, ''), 10);
                        if (!isNaN(num) && num > 0) {
                          setPlanForm(prev => ({ ...prev, amount: num < 10000 ? String(num * 1000) : String(num) }));
                        }
                      }}
                      className="w-full h-11 pl-4 pr-11 bg-slate-950/60 border border-slate-850 rounded-xl text-slate-200 text-sm font-semibold focus:outline-none focus:border-indigo-500 font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const num = parseInt(String(planForm.amount).replace(/\D/g, ''), 10);
                        if (!isNaN(num) && num > 0) {
                          setPlanForm(prev => ({ ...prev, amount: String(num * 1000) }));
                        }
                      }}
                      className="absolute right-1.5 top-1/2 -translate-y-1/2 px-1.5 py-0.5 bg-slate-800 hover:bg-slate-750 text-slate-300 text-[10px] font-bold rounded border border-slate-700 cursor-pointer"
                      title="3 ta nol qo'shish"
                    >
                      +000
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1 uppercase tracking-wide">Muddat (Oylar) *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={planForm.durationMonths}
                    onChange={(e) => setPlanForm(prev => ({ ...prev, durationMonths: e.target.value }))}
                    className="w-full h-11 px-4 bg-slate-950/60 border border-slate-850 rounded-xl text-slate-200 text-sm font-semibold focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setShowPlanModal(false)}
                  className="flex-1 h-11 border border-slate-800 hover:bg-slate-850 text-slate-350 text-sm font-bold rounded-xl cursor-pointer"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="flex-1 h-11 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-650 text-white text-sm font-bold rounded-xl cursor-pointer shadow-lg shadow-indigo-600/20"
                >
                  {actionLoading ? "Saqlanmoqda..." : "Yaratish"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Record Payment Modal */}
      {showPaymentModal && selectedInvoice && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-6 shadow-2xl relative">
            <button 
              onClick={() => setShowPaymentModal(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-white cursor-pointer"
            >
              <X size={20} />
            </button>
            <div>
              <h3 className="text-lg font-bold text-slate-100">Kassa orqali to'lov yig'ish</h3>
              <p className="text-xs text-slate-400">
                To'lovchi: {selectedInvoice.enrollment.student.firstName} {selectedInvoice.enrollment.student.lastName}
              </p>
            </div>

            {formError && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-xs font-semibold">
                {formError}
              </div>
            )}

            <form onSubmit={handlePaymentSubmit} className="space-y-4">
              <div className="bg-slate-950/40 p-4 border border-slate-850 rounded-2xl space-y-1 text-xs">
                <div className="flex justify-between text-slate-400 font-medium">
                  <span>Umumiy Schyot Summasi:</span>
                  <span className="font-bold text-slate-200">{selectedInvoice.amount.toLocaleString()} UZS</span>
                </div>
                <div className="flex justify-between text-slate-400 font-medium">
                  <span>To'langan:</span>
                  <span className="font-bold text-emerald-400">{selectedInvoice.paidAmount.toLocaleString()} UZS</span>
                </div>
                <div className="flex justify-between text-slate-400 font-bold border-t border-slate-850 pt-2 mt-1">
                  <span>Qoldiq:</span>
                  <span className="text-rose-400">{(selectedInvoice.amount - selectedInvoice.paidAmount).toLocaleString()} UZS</span>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide">To'lov Summasi (UZS) *</label>
                  {paymentForm.amount && (
                    <span className="text-[10px] font-mono font-bold text-emerald-400">
                      {Number(Number(paymentForm.amount) < 10000 && Number(paymentForm.amount) > 0 ? Number(paymentForm.amount) * 1000 : Number(paymentForm.amount) || 0).toLocaleString()} UZS
                    </span>
                  )}
                </div>
                <div className="relative">
                  <input
                    type="text"
                    required
                    placeholder="Masalan: 500 yoki 500000"
                    value={paymentForm.amount}
                    onChange={(e) => setPaymentForm(prev => ({ ...prev, amount: e.target.value }))}
                    onBlur={() => {
                      if (!paymentForm.amount) return;
                      const num = parseInt(String(paymentForm.amount).replace(/\D/g, ''), 10);
                      if (!isNaN(num) && num > 0) {
                        setPaymentForm(prev => ({ ...prev, amount: num < 10000 ? String(num * 1000) : String(num) }));
                      }
                    }}
                    className="w-full h-11 pl-4 pr-11 bg-slate-950/60 border border-slate-850 rounded-xl text-slate-200 text-sm font-semibold focus:outline-none focus:border-indigo-500 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const num = parseInt(String(paymentForm.amount).replace(/\D/g, ''), 10);
                      if (!isNaN(num) && num > 0) {
                        setPaymentForm(prev => ({ ...prev, amount: String(num * 1000) }));
                      }
                    }}
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 px-1.5 py-0.5 bg-slate-800 hover:bg-slate-750 text-slate-300 text-[10px] font-bold rounded border border-slate-700 cursor-pointer"
                    title="3 ta nol qo'shish"
                  >
                    +000
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1 uppercase tracking-wide">To'lov Usuli *</label>
                <select
                  value={paymentForm.paymentMethod}
                  onChange={(e) => setPaymentForm(prev => ({ ...prev, paymentMethod: e.target.value }))}
                  className="w-full h-11 px-3 bg-slate-950/60 border border-slate-850 rounded-xl text-slate-200 text-sm font-semibold focus:outline-none focus:border-indigo-500"
                >
                  <option value="CARD">Plastik karta (Click/Payme/Terminal)</option>
                  <option value="CASH">Naqd pul</option>
                  <option value="BANK">Bank hisobiga o'tkazma</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1 uppercase tracking-wide">Kvitansiya izohi (Ixtiyoriy)</label>
                <input
                  type="text"
                  placeholder="Kassa bo'yicha chek raqami yoki izohlar..."
                  value={paymentForm.notes}
                  onChange={(e) => setPaymentForm(prev => ({ ...prev, notes: e.target.value }))}
                  className="w-full h-11 px-4 bg-slate-950/60 border border-slate-850 rounded-xl text-slate-200 text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(false)}
                  className="flex-1 h-11 border border-slate-800 hover:bg-slate-850 text-slate-350 text-sm font-bold rounded-xl cursor-pointer"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="flex-1 h-11 bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-650 text-white text-sm font-bold rounded-xl cursor-pointer shadow-lg shadow-emerald-600/20"
                >
                  {actionLoading ? "To'lanmoqda..." : "To'lovni Saqlash"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
