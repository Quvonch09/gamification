import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  History, 
  Search, 
  Calendar, 
  Trash2, 
  AlertTriangle,
  CheckCircle,
  Filter,
  UserCheck,
  ChevronDown
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import CustomSelect from '../components/CustomSelect';

export default function PointHistory({ refreshTrigger }) {
  const { user } = useAuth();
  const { mentors } = useData();
  const isAdmin = user?.role === 'SUPER_ADMIN';

  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMentor, setSelectedMentor] = useState('');
  const [selectedType, setSelectedType] = useState('ALL'); // ALL, POSITIVE, NEGATIVE, CANCELLED
  const [dateFilter, setDateFilter] = useState('ALL'); // ALL, TODAY, 7DAYS, 30DAYS, CUSTOM
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Cancel confirmation state
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [pendingCancelId, setPendingCancelId] = useState(null);

  const [actionSuccess, setActionSuccess] = useState('');
  const [actionError, setActionError] = useState('');

  useEffect(() => {
    fetchTransactions();
  }, [refreshTrigger]);

  const fetchTransactions = () => {
    setLoading(true);
    axios.get('/api/transactions')
      .then(res => {
        setTransactions(res.data);
      })
      .catch(err => console.error("Error loading transactions", err))
      .finally(() => setLoading(false));
  };

  const handleCancelClick = (id) => {
    setPendingCancelId(id);
    setShowCancelModal(true);
  };

  const confirmCancelTransaction = () => {
    if (!pendingCancelId) return;

    setActionSuccess('');
    setActionError('');

    axios.post(`/api/transactions/${pendingCancelId}/cancel`)
      .then(res => {
        setActionSuccess("Ball operatsiyasi muvaffaqiyatli bekor qilindi!");
        fetchTransactions(); // Refresh
      })
      .catch(err => {
        console.error("Cancel transaction error", err);
        setActionError("Operatsiyani bekor qilishda xatolik yuz berdi.");
      })
      .finally(() => {
        setShowCancelModal(false);
        setPendingCancelId(null);
      });
  };

  // Filter logic
  const filteredTransactions = transactions.filter(t => {
    // 1. Search Query (Student Name)
    const matchesSearch = t.studentName.toLowerCase().includes(searchQuery.toLowerCase());

    // 2. Mentor Filter
    const matchesMentor = selectedMentor === '' || t.mentorName === selectedMentor;

    // 3. Type Filter
    let matchesType = true;
    if (selectedType === 'POSITIVE') {
      matchesType = t.points > 0 && t.status === 'ACTIVE';
    } else if (selectedType === 'NEGATIVE') {
      matchesType = t.points < 0 && t.status === 'ACTIVE';
    } else if (selectedType === 'CANCELLED') {
      matchesType = t.status === 'CANCELLED';
    }

    // 4. Date Filter
    let matchesDate = true;
    const tDate = new Date(t.date);
    const today = new Date();
    today.setHours(0,0,0,0);
    
    if (dateFilter === 'TODAY') {
      matchesDate = tDate.getTime() === today.getTime();
    } else if (dateFilter === '7DAYS') {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(today.getDate() - 7);
      matchesDate = tDate >= sevenDaysAgo;
    } else if (dateFilter === '30DAYS') {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(today.getDate() - 30);
      matchesDate = tDate >= thirtyDaysAgo;
    } else if (dateFilter === 'CUSTOM') {
      if (startDate && endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        start.setHours(0,0,0,0);
        end.setHours(23,59,59,999);
        matchesDate = tDate >= start && tDate <= end;
      }
    }

    return matchesSearch && matchesMentor && matchesType && matchesDate;
  });

  return (
    <div className="p-6 space-y-6 overflow-y-auto max-h-[calc(100vh-4rem)]">
      {/* Page Title */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-2">
          <History className="text-indigo-500" />
          Ball Tarixi
        </h1>
        <p className="text-sm text-slate-400 mt-1">Akademiyadagi barcha ball va jarimalar operatsiyalari auditi</p>
      </div>

      {/* Notifications */}
      {actionSuccess && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center gap-3 text-emerald-400 text-sm font-semibold">
          <CheckCircle size={18} />
          {actionSuccess}
        </div>
      )}

      {actionError && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-center gap-3 text-rose-400 text-sm font-semibold">
          <AlertTriangle size={18} />
          {actionError}
        </div>
      )}

      {/* Filter Toolbar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search by Student Name */}
          <div className="relative">
            <input
              type="text"
              placeholder="O'quvchi ismi..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-10 pl-10 pr-3 bg-slate-850 border border-slate-800 rounded-xl text-slate-300 focus:outline-none focus:border-indigo-500 text-sm"
            />
            <Search size={16} className="absolute left-3.5 top-3.5 text-slate-500" />
          </div>

          {/* Filter by Type */}
          <CustomSelect
            value={selectedType}
            onChange={setSelectedType}
            options={[
              { value: 'ALL', label: 'Barcha operatsiyalar' },
              { value: 'POSITIVE', label: 'Faqat musbat ballar' },
              { value: 'NEGATIVE', label: 'Faqat jarimalar' },
              { value: 'CANCELLED', label: 'Bekor qilinganlar' }
            ]}
            className="w-full"
          />

          {/* Filter by Mentor */}
          <CustomSelect
            value={selectedMentor}
            onChange={setSelectedMentor}
            options={mentors.map(m => ({ value: m.fullName, label: m.fullName }))}
            placeholder="Barcha mentorlar"
            className="w-full"
          />

          {/* Filter by Date Period */}
          <CustomSelect
            value={dateFilter}
            onChange={setDateFilter}
            options={[
              { value: 'ALL', label: 'Barcha vaqtlar' },
              { value: 'TODAY', label: 'Bugun' },
              { value: '7DAYS', label: 'Oxirgi 7 kun' },
              { value: '30DAYS', label: 'Oxirgi 30 kun' },
              { value: 'CUSTOM', label: 'Sana oralig\'i' }
            ]}
            className="w-full"
          />
        </div>

        {/* Custom Date Inputs (only visible if CUSTOM chosen) */}
        {dateFilter === 'CUSTOM' && (
          <div className="flex items-center gap-4 bg-slate-950/20 p-4 border border-slate-800 rounded-xl max-w-lg animate-fadeIn">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-bold">DAN:</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="h-9 px-2 bg-slate-850 border border-slate-800 rounded-lg text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-bold">GACHA:</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="h-9 px-2 bg-slate-850 border border-slate-800 rounded-lg text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>
        )}
      </div>

      {/* Audit Log Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
        {loading ? (
          <div className="p-20 text-center text-slate-500">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-indigo-500 mx-auto mb-2"></div>
            Yuklanmoqda...
          </div>
        ) : filteredTransactions.length === 0 ? (
          <div className="p-20 text-center text-slate-500 font-semibold text-sm">
            Natijalar topilmadi.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/50 text-[10px] font-bold text-slate-400 tracking-wider uppercase">
                  <th className="py-4 px-6">SANA</th>
                  <th className="py-4 px-6">O'QUVCHI</th>
                  <th className="py-4 px-6">BALL TURI</th>
                  <th className="py-4 px-6 text-center">BALL</th>
                  <th className="py-4 px-6">MENTOR</th>
                  <th className="py-4 px-6 text-center">HOLAT</th>
                  {isAdmin && <th className="py-4 px-6 text-center">HARAKAT</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredTransactions.map((t) => {
                  const isCancelled = t.status === 'CANCELLED';
                  const isPositive = t.points > 0;

                  return (
                    <tr 
                      key={t.id} 
                      className={`hover:bg-slate-850/20 transition-all duration-150 text-sm ${
                        isCancelled ? 'opacity-50 line-through text-slate-500' : 'text-slate-300'
                      }`}
                    >
                      {/* Date */}
                      <td className="py-4 px-6 font-semibold">
                        {t.date}
                      </td>

                      {/* Student */}
                      <td className="py-4 px-6 font-bold text-slate-200">
                        {t.studentName}
                      </td>

                      {/* Description */}
                      <td className="py-4 px-6 font-medium">
                        {t.description}
                      </td>

                      {/* Points */}
                      <td className="py-4 px-6 text-center font-extrabold">
                        <span className={
                          isCancelled ? 'text-slate-500' :
                          isPositive ? 'text-emerald-400' : 'text-rose-400'
                        }>
                          {isPositive ? `+${t.points}` : t.points} XP
                        </span>
                      </td>

                      {/* Mentor */}
                      <td className="py-4 px-6 font-semibold">
                        {t.mentorName}
                      </td>

                      {/* Status / Cancellation Info */}
                      <td className="py-4 px-6 text-center">
                        {isCancelled ? (
                          <div className="flex flex-col items-center">
                            <span className="text-[9px] uppercase font-bold text-rose-500 bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 rounded">
                              CANCELLED
                            </span>
                            {t.cancelledByName && (
                              <span className="text-[8px] text-slate-500 mt-1 block line-clamp-1">
                                {t.cancelledByName} tomondan
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-[9px] uppercase font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded">
                            ACTIVE
                          </span>
                        )}
                      </td>

                      {/* Admin Cancel Action Button */}
                      {isAdmin && (
                        <td className="py-4 px-6 text-center">
                          {!isCancelled ? (
                            <button
                              onClick={() => handleCancelClick(t.id)}
                              className="inline-flex w-8 h-8 rounded-lg bg-slate-800 hover:bg-rose-600/15 border border-slate-700/80 hover:border-rose-500/30 text-slate-400 hover:text-rose-400 items-center justify-center cursor-pointer transition-all"
                              title="Ballni bekor qilish"
                            >
                              <Trash2 size={14} />
                            </button>
                          ) : (
                            <span className="text-xs text-slate-600 font-bold">-</span>
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Confirmation Dialog Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <div className="w-12 h-12 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 mb-4 mx-auto">
              <AlertTriangle size={24} />
            </div>
            
            <h3 className="text-lg font-bold text-white text-center">Operatsiyani bekor qilish</h3>
            <p className="text-slate-400 text-sm text-center mt-2 leading-relaxed">
              Haqiqatan ham ushbu ball operatsiyasini bekor qilmoqchimisiz? Ushbu ball o'quvchi umumiy ballaridan chegirib tashlanadi.
            </p>

            <div className="grid grid-cols-2 gap-4 mt-6">
              <button
                onClick={() => {
                  setShowCancelModal(false);
                  setPendingCancelId(null);
                }}
                className="w-full py-2.5 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-300 font-semibold border border-slate-700/50 cursor-pointer"
              >
                BEKOR QILISH
              </button>
              <button
                onClick={confirmCancelTransaction}
                className="w-full py-2.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-semibold shadow-lg shadow-rose-600/25 cursor-pointer"
              >
                TASDIQLASH
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
