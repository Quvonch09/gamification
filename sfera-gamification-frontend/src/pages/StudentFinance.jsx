import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { 
  Landmark, 
  CreditCard, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  Calendar, 
  Receipt, 
  Printer, 
  RefreshCw, 
  X, 
  ChevronRight, 
  Check, 
  Layers, 
  Phone, 
  HelpCircle,
  TrendingUp,
  FileText
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function StudentFinance({ setCurrentPage }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [studentInfo, setStudentInfo] = useState(null);
  const [payments, setPayments] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [receiptModal, setReceiptModal] = useState(null);
  const [error, setError] = useState(null);

  const studentId = user?.studentId || user?.student?.id;

  useEffect(() => {
    loadFinanceData();
  }, [studentId]);

  const loadFinanceData = async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Try to load from /api/students list to get calculated financial summary
      let studentRecord = null;
      try {
        const stdRes = await axios.get('/api/students');
        const list = stdRes.data || [];
        if (studentId) {
          studentRecord = list.find(s => String(s.id) === String(studentId));
        }
        if (!studentRecord && user?.username) {
          studentRecord = list.find(s => s.username === user.username);
        }
      } catch (e) {
        console.warn("Could not load /api/students", e);
      }

      // 2. Load payments and invoices from CRM profile
      let crmPayments = [];
      let crmInvoices = [];
      const targetId = studentRecord?.id || studentId;

      if (targetId) {
        try {
          const crmRes = await axios.get(`/api/students/${targetId}/crm-profile`);
          crmPayments = crmRes.data?.payments || [];
          crmInvoices = crmRes.data?.invoices || [];
          if (!studentRecord && crmRes.data?.student) {
            studentRecord = crmRes.data.student;
          }
        } catch (e) {
          console.warn("Could not load crm-profile", e);
        }
      }

      // 3. Fallback to /api/finance/payments if available
      if (crmPayments.length === 0) {
        try {
          const payRes = await axios.get('/api/finance/payments');
          const allPays = payRes.data || [];
          crmPayments = allPays.filter(p => String(p.studentId) === String(targetId));
        } catch (e) {
          // May be restricted for students
        }
      }

      setStudentInfo(studentRecord);
      
      // Sort payments newest first
      crmPayments.sort((a, b) => {
        const da = new Date(a.createdAt || 0);
        const db = new Date(b.createdAt || 0);
        return db - da;
      });
      setPayments(crmPayments);
      setInvoices(crmInvoices);

    } catch (err) {
      console.error("Finance load error", err);
      setError("To'lov ma'lumotlarini yuklashda xatolik yuz berdi.");
    } finally {
      setLoading(false);
    }
  };

  // Calculations
  const coursePrice = Number(studentInfo?.coursePrice || studentInfo?.customPrice || 0);
  const totalPaid = Number(studentInfo?.totalPaid || 0);
  const balanceDue = Number(studentInfo?.balanceDue || 0);
  const isPaid = balanceDue === 0 && (totalPaid > 0 || coursePrice === 0);
  const isDebtor = balanceDue > 0;

  const formatMoney = (amount) => {
    return Number(amount || 0).toLocaleString() + " UZS";
  };

  const getMethodLabel = (method) => {
    switch (method) {
      case 'CASH': return { label: "Naqd Pul", color: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30" };
      case 'CARD': return { label: "Plastik Karta", color: "bg-blue-500/15 text-blue-300 border-blue-500/30" };
      case 'BANK': return { label: "Bank O'tkazmasi", color: "bg-purple-500/15 text-purple-300 border-purple-500/30" };
      default: return { label: method || "Naqd", color: "bg-slate-800 text-slate-300 border-slate-700" };
    }
  };

  return (
    <div className="p-3 sm:p-6 max-w-6xl mx-auto space-y-6 animate-fadeIn font-sans pb-24 overflow-y-auto max-h-[calc(100vh-4rem)] custom-scrollbar">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shadow-lg shadow-emerald-500/10 shrink-0">
              <Landmark size={22} />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2">
                <span>Mening To'lovlarim & Moliya</span>
                <span className="text-[10px] sm:text-xs font-bold px-2.5 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-300">
                  Talaba Kabineti
                </span>
              </h1>
              <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
                Kurs to'lovlari, qarzdorlik holati va kvitansiyalar tarixi
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={loadFinanceData}
            className="flex items-center gap-2 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 transition-all cursor-pointer shadow-sm"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin text-emerald-400' : 'text-slate-400'} />
            <span>Yangilash</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl flex items-center gap-3 text-rose-300 text-xs font-semibold animate-fadeIn">
          <AlertTriangle size={18} className="shrink-0 text-rose-400" />
          <span>{error}</span>
        </div>
      )}

      {/* Top 4 KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* 1. Kurs Narxi */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Oylik Kurs Narxi</span>
            <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
              <Layers size={18} />
            </div>
          </div>
          <div>
            <h3 className="text-2xl font-black text-white font-mono tracking-tight">
              {formatMoney(coursePrice)}
            </h3>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="text-[11px] font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20 truncate max-w-full">
                {studentInfo?.groupName || user?.groupName || "Guruh"}
              </span>
            </div>
          </div>
        </div>

        {/* 2. Jami To'langan */}
        <div className="bg-slate-900 border border-emerald-500/20 rounded-2xl p-4 sm:p-5 shadow-xl flex flex-col justify-between space-y-3 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Jami To'langan</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <CheckCircle2 size={18} />
            </div>
          </div>
          <div>
            <h3 className="text-2xl font-black text-emerald-400 font-mono tracking-tight">
              {formatMoney(totalPaid)}
            </h3>
            <span className="text-[11px] text-slate-400 font-medium block mt-1">
              Kassaga kiritilgan summa
            </span>
          </div>
        </div>

        {/* 3. Qarzdorlik (Qarz summasi) */}
        <div className={`bg-slate-900 rounded-2xl p-4 sm:p-5 shadow-xl flex flex-col justify-between space-y-3 border ${
          isDebtor ? 'border-rose-500/40 bg-rose-950/10' : 'border-slate-800'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Qarzdorlik</span>
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
              isDebtor ? 'bg-rose-500/20 text-rose-400' : 'bg-emerald-500/10 text-emerald-400'
            }`}>
              {isDebtor ? <AlertTriangle size={18} /> : <Check size={18} />}
            </div>
          </div>
          <div>
            <h3 className={`text-2xl font-black font-mono tracking-tight ${
              isDebtor ? 'text-rose-400' : 'text-emerald-400'
            }`}>
              {formatMoney(balanceDue)}
            </h3>
            <span className={`text-[11px] font-bold block mt-1 ${
              isDebtor ? 'text-rose-400' : 'text-emerald-400'
            }`}>
              {isDebtor ? "⚠️ To'lov qilish zarur" : "✓ Qarzdorlik yo'q"}
            </span>
          </div>
        </div>

        {/* 4. To'lov Holati Badge */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">To'lov Holati</span>
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
              <Clock size={18} />
            </div>
          </div>
          <div>
            {isPaid ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-black bg-emerald-500/15 border border-emerald-500/30 text-emerald-300">
                <CheckCircle2 size={13} /> TO'LIQ TO'LANGAN
              </span>
            ) : isDebtor ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-black bg-rose-500/15 border border-rose-500/30 text-rose-300">
                <AlertTriangle size={13} /> QARZDOR
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-black bg-blue-500/15 border border-blue-500/30 text-blue-300">
                <Clock size={13} /> QISMAN TO'LANGAN
              </span>
            )}
            <span className="text-[11px] text-slate-500 block mt-2 font-mono">
              {payments.length} ta kassa operatsiyasi
            </span>
          </div>
        </div>

      </div>

      {/* Main Payment History Section */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 sm:p-6 shadow-2xl space-y-5">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Receipt className="w-5 h-5 text-emerald-400" />
              <span>To'lovlar Tarixi & Kvitansiyalar</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Akademiya kassasiga amalga oshirilgan barcha to'lovlar ro'yxati
            </p>
          </div>
          <div className="text-xs font-bold text-slate-400 bg-slate-800 px-3 py-1.5 rounded-xl self-start sm:self-auto border border-slate-700">
            Jami: {payments.length} ta to'lov
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16 text-slate-400 text-sm">
            <RefreshCw className="w-6 h-6 animate-spin text-emerald-400 mr-3" />
            To'lov ma'lumotlari yuklanmoqda...
          </div>
        ) : payments.length === 0 ? (
          <div className="text-center py-16 px-4 bg-slate-950/50 rounded-2xl border border-slate-800/80">
            <CreditCard className="w-12 h-12 mx-auto text-slate-600 mb-3" />
            <h3 className="text-base font-bold text-slate-300">To'lovlar tarixi mavjud emas</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
              Hozircha sizning nomingizga to'lov kiritilmagan. To'lovni o'quv markazi ma'muriyatida amalga oshirishingiz mumkin.
            </p>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 font-bold uppercase tracking-wider">
                    <th className="py-3 px-4"># Chek №</th>
                    <th className="py-3 px-4">Sana va Vaqt</th>
                    <th className="py-3 px-4">To'lov Summasi</th>
                    <th className="py-3 px-4">To'lov Usuli</th>
                    <th className="py-3 px-4">Qabul Qildi</th>
                    <th className="py-3 px-4">Izoh</th>
                    <th className="py-3 px-4 text-right">Kvitansiya</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-medium">
                  {payments.map((p, idx) => {
                    const method = getMethodLabel(p.paymentMethod);
                    const receiptNum = p.receiptNo || `REC-${(p.id || idx) + 1000}`;
                    const dateStr = p.createdAt ? new Date(p.createdAt).toLocaleString('uz-UZ', {
                      year: 'numeric', month: '2-digit', day: '2-digit',
                      hour: '2-digit', minute: '2-digit'
                    }) : '-';

                    return (
                      <tr key={p.id || idx} className="hover:bg-slate-850/60 transition-colors">
                        <td className="py-3.5 px-4 font-mono font-bold text-slate-300">
                          {receiptNum}
                        </td>
                        <td className="py-3.5 px-4 text-slate-300 whitespace-nowrap">
                          {dateStr}
                        </td>
                        <td className="py-3.5 px-4 font-mono font-black text-emerald-400 text-sm whitespace-nowrap">
                          +{Number(p.amount || 0).toLocaleString()} UZS
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border ${method.color}`}>
                            {method.label}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-slate-300">
                          {p.receivedBy?.fullName || p.receivedByName || "Kassa Admin"}
                        </td>
                        <td className="py-3.5 px-4 text-slate-400 max-w-[200px] truncate">
                          {p.notes || "-"}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={() => setReceiptModal({
                              ...p,
                              receiptNo: receiptNum,
                              studentName: studentInfo?.fullName || user?.fullName,
                              studentPhone: studentInfo?.phone || user?.phone,
                              groupName: studentInfo?.groupName || user?.groupName,
                              cashierName: p.receivedBy?.fullName || p.receivedByName || "Kassa Admin"
                            })}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 transition-all cursor-pointer hover:text-white shadow-sm"
                            title="Chekni ko'rish yoki chop etish"
                          >
                            <Printer size={13} className="text-emerald-400" />
                            <span>Chek</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Card List View */}
            <div className="md:hidden space-y-3">
              {payments.map((p, idx) => {
                const method = getMethodLabel(p.paymentMethod);
                const receiptNum = p.receiptNo || `REC-${(p.id || idx) + 1000}`;
                const dateStr = p.createdAt ? new Date(p.createdAt).toLocaleString('uz-UZ', {
                  year: 'numeric', month: '2-digit', day: '2-digit',
                  hour: '2-digit', minute: '2-digit'
                }) : '-';

                return (
                  <div 
                    key={p.id || idx}
                    className="p-4 bg-slate-950/70 border border-slate-800 rounded-2xl space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-slate-400">
                        {receiptNum}
                      </span>
                      <span className={`px-2.5 py-0.5 rounded-lg text-[10px] font-bold border ${method.color}`}>
                        {method.label}
                      </span>
                    </div>

                    <div className="flex items-baseline justify-between">
                      <span className="text-lg font-black text-emerald-400 font-mono">
                        +{Number(p.amount || 0).toLocaleString()} UZS
                      </span>
                      <span className="text-[11px] text-slate-500 font-medium">
                        {dateStr}
                      </span>
                    </div>

                    <div className="text-xs text-slate-400 pt-2 border-t border-slate-850 flex items-center justify-between">
                      <span>Qabul qildi: <strong className="text-slate-200">{p.receivedBy?.fullName || p.receivedByName || "Kassa Admin"}</strong></span>
                      <button
                        onClick={() => setReceiptModal({
                          ...p,
                          receiptNo: receiptNum,
                          studentName: studentInfo?.fullName || user?.fullName,
                          studentPhone: studentInfo?.phone || user?.phone,
                          groupName: studentInfo?.groupName || user?.groupName,
                          cashierName: p.receivedBy?.fullName || p.receivedByName || "Kassa Admin"
                        })}
                        className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-lg border border-slate-700 flex items-center gap-1 cursor-pointer"
                      >
                        <Printer size={12} className="text-emerald-400" />
                        <span>Chek</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

      </div>

      {/* Info Notice & Rules */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950/20 to-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex items-start gap-4">
        <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center shrink-0 border border-indigo-500/20 mt-0.5">
          <HelpCircle size={20} />
        </div>
        <div className="space-y-1 text-xs">
          <h4 className="font-bold text-slate-200 text-sm">To'lovlar bo'yicha muhim eslatma</h4>
          <p className="text-slate-400 leading-relaxed">
            O'quv kursi uchun oylik to'lovlar har oyning 5-sanasiga qadar amalga oshirilishi so'raladi. 
            To'lov qabul qilingan zahoti tizimda chek shakllanadi va hisobingizdan qarzdorlik o'chiriladi. 
            Savollar yoki tushunmovchiliklar yuzaga kelsa, akademiya administratoriga yoki kassiriga murojaat qiling.
          </p>
        </div>
      </div>

      {/* Receipt Modal (Chek Chop Etish) */}
      {receiptModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-3xl p-6 shadow-2xl relative space-y-5 max-h-[90vh] overflow-y-auto custom-scrollbar">
            
            <button 
              onClick={() => setReceiptModal(null)}
              className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X size={20} />
            </button>

            {/* Printable Receipt Paper */}
            <div id="student-receipt-print" className="bg-white text-slate-900 p-6 rounded-2xl space-y-4 font-mono text-xs shadow-inner">
              <div className="text-center border-b border-dashed border-slate-300 pb-4">
                <h3 className="font-black text-base tracking-wider">SFERA IT ACADEMY</h3>
                <p className="text-[10px] text-slate-500 mt-0.5">TO'LOV KVITANSIYASI</p>
                <div className="mt-2 text-[11px] font-bold text-slate-700">
                  {receiptModal.receiptNo || "REC-" + receiptModal.id}
                </div>
              </div>

              <div className="space-y-2 py-1 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-slate-500">Sana:</span>
                  <span className="font-bold">{new Date(receiptModal.createdAt || Date.now()).toLocaleString('uz-UZ')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Talaba:</span>
                  <span className="font-bold text-right">{receiptModal.studentName || user?.fullName}</span>
                </div>
                {receiptModal.studentPhone && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Telefon:</span>
                    <span>{receiptModal.studentPhone}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-slate-500">Guruh:</span>
                  <span className="font-bold">{receiptModal.groupName || studentInfo?.groupName || "Guruh"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">To'lov Usuli:</span>
                  <span className="font-bold">{receiptModal.paymentMethod || "CASH"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Kassir:</span>
                  <span>{receiptModal.cashierName || "Kassa Admin"}</span>
                </div>
                {receiptModal.notes && (
                  <div className="flex justify-between border-t border-dashed border-slate-200 pt-1">
                    <span className="text-slate-500">Izoh:</span>
                    <span>{receiptModal.notes}</span>
                  </div>
                )}
              </div>

              <div className="border-t-2 border-dashed border-slate-400 pt-3 flex justify-between items-baseline">
                <span className="font-black text-sm uppercase">TO'LANDI:</span>
                <span className="font-black text-lg text-emerald-700">
                  {Number(receiptModal.amount || 0).toLocaleString()} UZS
                </span>
              </div>

              <div className="border-t border-dashed border-slate-300 pt-3 text-center text-[9px] text-slate-500 space-y-0.5">
                <p>To'lovingiz uchun tashakkur!</p>
                <p>Sfera IT Academy — Kelajak kasblari maskani</p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => {
                  window.print();
                }}
                className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 transition-all cursor-pointer"
              >
                <Printer size={15} />
                <span>Chop Etish</span>
              </button>
              <button
                onClick={() => setReceiptModal(null)}
                className="px-5 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl transition-all cursor-pointer"
              >
                Yopish
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
