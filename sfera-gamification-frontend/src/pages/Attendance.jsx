import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import {
  CalendarCheck,
  Users,
  Search,
  CheckCircle2,
  XCircle,
  Lock,
  Plus,
  Save,
  X,
  Download,
  ChevronLeft,
  ChevronRight,
  User,
  Clock,
  BookOpen,
  Home,
  Calendar,
  RefreshCw
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const MONTHS_UZ = ['Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun', 'Iyul', 'Avgust', 'Sentabr', 'Oktabr', 'Noyabr', 'Dekabr'];

export default function Attendance({ refreshTrigger }) {
  const { user } = useAuth();
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'BRANCH_ADMIN';
  const isMentor = user?.role === 'MENTOR';
  const canWrite = isSuperAdmin || isAdmin || isMentor;

  const today = new Date();
  const [selectedMonth, setSelectedMonth] = useState(today.getMonth());
  const [selectedYear, setSelectedYear] = useState(today.getFullYear());
  const [groups, setGroups] = useState([]);
  const [selectedGroupId, setSelectedGroupId] = useState(null);
  const [selectedGroupInfo, setSelectedGroupInfo] = useState(null);
  const [students, setStudents] = useState([]);
  const [attendanceData, setAttendanceData] = useState({}); // { "YYYY-MM-DD": { studentId: status } }
  const [loading, setLoading] = useState(false);
  const [groupSearch, setGroupSearch] = useState('');

  // Take attendance modal
  const [showModal, setShowModal] = useState(false);
  const [modalDate, setModalDate] = useState(today.toISOString().slice(0, 10));
  const [modalSheet, setModalSheet] = useState({});
  const [modalSaving, setModalSaving] = useState(false);
  const [modalSuccess, setModalSuccess] = useState('');
  const [modalError, setModalError] = useState('');

  // Load groups
  useEffect(() => {
    axios.get('/api/groups')
      .then(res => {
        let data = res.data || [];
        if (isMentor) {
          data = data.filter(g => g.mentorName === user.fullName);
        }
        setGroups(data);
        if (data.length > 0) {
          setSelectedGroupId(data[0].id);
        }
      })
      .catch(console.error);
  }, []);

  // Load students and attendance when group/month/year changes
  useEffect(() => {
    if (!selectedGroupId) return;
    const group = groups.find(g => g.id === selectedGroupId);
    setSelectedGroupInfo(group || null);
    loadAttendanceMatrix();
  }, [selectedGroupId, selectedMonth, selectedYear, refreshTrigger]);

  const loadAttendanceMatrix = async () => {
    if (!selectedGroupId) return;
    setLoading(true);
    try {
      const [studentsRes, recordsRes] = await Promise.all([
        axios.get(`/api/groups/${selectedGroupId}/students`),
        axios.get('/api/attendance', {
          params: {
            groupId: selectedGroupId,
            month: selectedMonth + 1,
            year: selectedYear
          }
        }).catch(() => ({ data: [] }))
      ]);

      const studs = studentsRes.data || [];
      setStudents(studs);

      // Build matrix: { date -> { studentId -> status } }
      const matrix = {};
      const records = recordsRes.data || [];
      records.forEach(r => {
        const dateKey = r.date || r.lessonDate || r.createdAt?.slice(0, 10);
        if (!dateKey) return;
        if (!matrix[dateKey]) matrix[dateKey] = {};
        matrix[dateKey][r.studentId] = r.attendanceStatus || 'KELDI';
      });
      setAttendanceData(matrix);
    } catch (err) {
      console.error('Error loading attendance', err);
    } finally {
      setLoading(false);
    }
  };

  // Get lesson dates for the selected month (unique dates that have records)
  const lessonDates = useMemo(() => {
    const datesInMonth = Object.keys(attendanceData).filter(d => {
      const [y, m] = d.split('-').map(Number);
      return y === selectedYear && m === selectedMonth + 1;
    }).sort();

    // Also add dates from group schedule if no records yet
    // Show at minimum the days that have passed in the month
    if (datesInMonth.length === 0) {
      // Generate lesson dates based on group days of week
      const generated = [];
      if (selectedGroupInfo?.daysOfWeek) {
        const dayNames = { 'Dushanba': 1, 'Seshanba': 2, 'Chorshanba': 3, 'Payshanba': 4, 'Juma': 5, 'Shanba': 6, 'Yakshanba': 0 };
        const groupDays = selectedGroupInfo.daysOfWeek.split(',').map(d => d.trim());
        const targetDays = groupDays.map(d => dayNames[d]).filter(d => d !== undefined);

        const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
        for (let day = 1; day <= daysInMonth; day++) {
          const date = new Date(selectedYear, selectedMonth, day);
          if (targetDays.includes(date.getDay()) && date <= today) {
            const dateStr = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            generated.push(dateStr);
          }
        }
      }
      return generated;
    }
    return datesInMonth;
  }, [attendanceData, selectedMonth, selectedYear, selectedGroupInfo]);

  // All dates (past + upcoming) for the month
  const allMonthDates = useMemo(() => {
    const dates = [...lessonDates];
    // Add upcoming dates from schedule
    if (selectedGroupInfo?.daysOfWeek) {
      const dayNames = { 'Dushanba': 1, 'Seshanba': 2, 'Chorshanba': 3, 'Payshanba': 4, 'Juma': 5, 'Shanba': 6, 'Yakshanba': 0 };
      const groupDays = selectedGroupInfo.daysOfWeek.split(',').map(d => d.trim());
      const targetDays = groupDays.map(d => dayNames[d]).filter(d => d !== undefined);

      const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
      for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(selectedYear, selectedMonth, day);
        const dateStr = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        if (targetDays.includes(date.getDay()) && !dates.includes(dateStr)) {
          dates.push(dateStr);
        }
      }
    }
    return [...new Set(dates)].sort();
  }, [lessonDates, selectedGroupInfo, selectedMonth, selectedYear]);

  const openModal = (date = null) => {
    setModalDate(date || today.toISOString().slice(0, 10));
    const initial = {};
    students.forEach(s => {
      initial[s.id] = { status: 'KELDI', note: '' };
    });
    // Pre-fill existing data for this date
    if (date && attendanceData[date]) {
      Object.keys(attendanceData[date]).forEach(sid => {
        if (initial[sid]) initial[sid].status = attendanceData[date][sid];
      });
    }
    setModalSheet(initial);
    setModalSuccess('');
    setModalError('');
    setShowModal(true);
  };

  const saveAttendance = async () => {
    setModalSaving(true);
    setModalError('');
    setModalSuccess('');
    try {
      const records = Object.keys(modalSheet).map(sId => ({
        studentId: parseInt(sId),
        attendanceStatus: modalSheet[sId].status,
        attendanceNote: modalSheet[sId].note || null,
        homeworkStatus: modalSheet[sId].status === 'KELDI' ? 'BAJARDI' : 'NONE',
        projectCount: 0, questionAnswer: false, activity: false, phoneGame: false
      }));
      await axios.post('/api/lessons/save', {
        groupId: parseInt(selectedGroupId),
        date: modalDate,
        records
      });
      setModalSuccess('Davomat muvaffaqiyatli saqlandi! ✅');
      loadAttendanceMatrix();
      setTimeout(() => setShowModal(false), 1200);
    } catch (err) {
      setModalError(err.response?.data?.message || 'Saqlashda xatolik yuz berdi');
    } finally {
      setModalSaving(false);
    }
  };

  const getStatus = (dateKey, studentId) => {
    return attendanceData[dateKey]?.[studentId] || null;
  };

  const isDatePast = (dateStr) => new Date(dateStr) < today;
  const isDateToday = (dateStr) => dateStr === today.toISOString().slice(0, 10);

  const filteredGroups = groups.filter(g =>
    g.name?.toLowerCase().includes(groupSearch.toLowerCase()) ||
    g.courseName?.toLowerCase().includes(groupSearch.toLowerCase()) ||
    g.mentorName?.toLowerCase().includes(groupSearch.toLowerCase())
  );

  const prevMonth = () => {
    if (selectedMonth === 0) { setSelectedMonth(11); setSelectedYear(y => y - 1); }
    else setSelectedMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (selectedMonth === 11) { setSelectedMonth(0); setSelectedYear(y => y + 1); }
    else setSelectedMonth(m => m + 1);
  };

  // Group stats
  const totalPresent = students.length > 0 && lessonDates.length > 0
    ? lessonDates.reduce((sum, d) => sum + students.filter(s => attendanceData[d]?.[s.id] === 'KELDI').length, 0)
    : 0;
  const totalAbsent = students.length > 0 && lessonDates.length > 0
    ? lessonDates.reduce((sum, d) => sum + students.filter(s => attendanceData[d]?.[s.id] === 'SABABSIZ').length, 0)
    : 0;

  return (
    <div className="flex h-full overflow-hidden">
      {/* LEFT: Group List */}
      <div className="w-72 flex-shrink-0 flex flex-col bg-slate-900/60 border-r border-slate-800 overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-slate-800">
          <h2 className="font-bold text-white text-sm flex items-center gap-2">
            <CalendarCheck className="w-4 h-4 text-indigo-400" />
            Davomat Jadvali
          </h2>
          <div className="mt-2 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
            <input
              value={groupSearch}
              onChange={e => setGroupSearch(e.target.value)}
              placeholder="Guruh qidirish..."
              className="w-full bg-slate-800 text-slate-300 text-xs rounded-lg pl-8 pr-3 py-2 border border-slate-700/50 focus:outline-none focus:border-indigo-500/50 placeholder-slate-600"
            />
          </div>
        </div>

        {/* Group list */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {filteredGroups.map(g => (
            <button
              key={g.id}
              onClick={() => setSelectedGroupId(g.id)}
              className={`w-full text-left px-3 py-2.5 rounded-xl transition-all ${
                selectedGroupId === g.id
                  ? 'bg-indigo-600/20 border border-indigo-500/40 text-indigo-300'
                  : 'hover:bg-slate-800/60 text-slate-400 border border-transparent hover:border-slate-700/40'
              }`}
            >
              <p className="text-xs font-semibold leading-none">{g.name}</p>
              <p className="text-[10px] text-slate-500 mt-1 leading-none">{g.courseName || 'Kurs'} · {g.studentsCount || 0} ta</p>
            </button>
          ))}
          {filteredGroups.length === 0 && (
            <p className="text-center text-slate-600 text-xs py-4">Guruh topilmadi</p>
          )}
        </div>

        {/* Selected Group Info Card */}
        {selectedGroupInfo && (
          <div className="p-3 border-t border-slate-800 space-y-2">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Tanlangan Guruh</p>
            <div className="bg-slate-800/60 rounded-xl p-3 space-y-1.5">
              {[
                { icon: BookOpen, label: selectedGroupInfo.courseName || '-' },
                { icon: Clock, label: `${selectedGroupInfo.startTime || '?'} - ${selectedGroupInfo.endTime || '?'}` },
                { icon: Home, label: selectedGroupInfo.roomName || selectedGroupInfo.room || '-' },
                { icon: User, label: selectedGroupInfo.mentorName || '-' },
                { icon: Calendar, label: selectedGroupInfo.daysOfWeek || '-' },
                { icon: Users, label: `${selectedGroupInfo.studentsCount || students.length} o'quvchi` },
              ].map(({ icon: Icon, label }) => (
                <div key={label} className="flex items-center gap-2">
                  <Icon className="w-3 h-3 text-slate-500 flex-shrink-0" />
                  <span className="text-[11px] text-slate-300 truncate">{label}</span>
                </div>
              ))}
            </div>
            {/* Student list */}
            <div className="mt-2">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">O'quvchilar</p>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {students.map((s, i) => (
                  <div key={s.id} className="flex items-center gap-2 py-1">
                    <span className="text-[10px] text-slate-600 w-4">{i + 1}</span>
                    <span className="text-[11px] text-slate-300 truncate">{s.firstName} {s.lastName}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* RIGHT: Calendar Attendance Matrix */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Month Navigation + Actions */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-800 bg-slate-900/40 flex-shrink-0">
          <div className="flex items-center gap-2">
            <button onClick={prevMonth} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="flex gap-1">
              {MONTHS_UZ.map((m, i) => (
                <button
                  key={m}
                  onClick={() => setSelectedMonth(i)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
                    selectedMonth === i
                      ? 'bg-indigo-600 text-white shadow'
                      : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
            <button onClick={nextMonth} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors">
              <ChevronRight className="w-4 h-4" />
            </button>
            <span className="text-xs text-slate-500 ml-1">{selectedYear}</span>
          </div>

          <div className="flex items-center gap-2">
            {/* Stats mini */}
            <div className="flex items-center gap-3 text-xs">
              <span className="text-emerald-400 font-bold">✓ {totalPresent}</span>
              <span className="text-rose-400 font-bold">✕ {totalAbsent}</span>
            </div>
            <button onClick={loadAttendanceMatrix} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors">
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
            {canWrite && (
              <button
                onClick={() => openModal()}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition-all"
              >
                <Plus className="w-3.5 h-3.5" /> Davomat Kiritish
              </button>
            )}
            <button className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-700/30 hover:bg-emerald-700/50 text-emerald-400 text-xs font-bold rounded-xl border border-emerald-500/30 transition-all">
              <Download className="w-3.5 h-3.5" /> Excel
            </button>
          </div>
        </div>

        {/* Matrix Table */}
        <div className="flex-1 overflow-auto p-4">
          {!selectedGroupId ? (
            <div className="flex items-center justify-center h-48 text-slate-500">
              <div className="text-center">
                <CalendarCheck className="w-12 h-12 mx-auto mb-3 opacity-20" />
                <p className="text-sm">Chap tarafdan guruhni tanlang</p>
              </div>
            </div>
          ) : loading ? (
            <div className="flex items-center justify-center h-48 text-slate-500">
              <RefreshCw className="w-6 h-6 animate-spin text-indigo-400" />
            </div>
          ) : (
            <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-auto">
              <table className="w-full text-xs">
                <thead>
                  {/* Mavzular row */}
                  <tr className="border-b border-slate-800">
                    <th className="sticky left-0 bg-slate-900 z-10 px-3 py-2 text-left text-slate-500 font-semibold w-40 border-r border-slate-800">
                      Mavzular
                    </th>
                    {allMonthDates.map(d => (
                      <th key={d} className="px-1 py-2 text-center text-slate-600 font-normal border-l border-slate-800/50 min-w-[40px]">
                        <button
                          onClick={() => canWrite && openModal(d)}
                          className={`text-[10px] transition-colors ${canWrite ? 'hover:text-indigo-400 cursor-pointer' : ''}`}
                          title={canWrite ? `${d} sanasi uchun davomat kiritish` : d}
                        >
                          <Calendar className="w-3 h-3 mx-auto mb-0.5 text-slate-600" />
                        </button>
                      </th>
                    ))}
                  </tr>
                  {/* Date numbers row */}
                  <tr className="border-b border-slate-700">
                    <th className="sticky left-0 bg-slate-900 z-10 px-3 py-2 text-left text-slate-400 font-bold text-[11px] border-r border-slate-800">
                      №&nbsp;&nbsp; O'quvchilar
                    </th>
                    {allMonthDates.map(d => {
                      const day = parseInt(d.split('-')[2], 10);
                      const isPast = isDatePast(d);
                      const isTod = isDateToday(d);
                      return (
                        <th key={d} className={`px-1 py-1.5 text-center font-bold border-l border-slate-800/50 min-w-[40px] ${
                          isTod ? 'bg-indigo-900/30 text-indigo-400'
                          : isPast && !attendanceData[d] ? 'text-rose-500/60'
                          : isPast ? 'text-slate-300' : 'text-slate-600'
                        }`}>
                          {day}
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  {students.map((student, idx) => (
                    <tr key={student.id} className="border-b border-slate-800/50 hover:bg-slate-800/20 transition-colors">
                      <td className="sticky left-0 bg-slate-900 z-10 px-3 py-2 border-r border-slate-800">
                        <div className="flex items-center gap-2">
                          <span className="text-slate-600 text-[10px] w-4">{idx + 1}</span>
                          <div>
                            <p className="text-slate-200 font-medium text-[11px] leading-none">{student.firstName} {student.lastName}</p>
                          </div>
                        </div>
                      </td>
                      {allMonthDates.map(d => {
                        const status = getStatus(d, student.id);
                        const isPast = isDatePast(d);
                        const isTod = isDateToday(d);

                        return (
                          <td
                            key={d}
                            className={`text-center border-l border-slate-800/40 py-2 ${isTod ? 'bg-indigo-900/10' : ''}`}
                          >
                            {status === 'KELDI' ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-400 mx-auto" />
                            ) : status === 'SABABSIZ' ? (
                              <XCircle className="w-4 h-4 text-rose-400 mx-auto" />
                            ) : status === 'SABABLI' ? (
                              <div className="w-4 h-4 rounded-full bg-amber-500/20 border border-amber-500/40 mx-auto flex items-center justify-center">
                                <span className="text-[8px] text-amber-400 font-bold">S</span>
                              </div>
                            ) : isPast || isTod ? (
                              canWrite ? (
                                <button
                                  onClick={() => openModal(d)}
                                  className="w-4 h-4 mx-auto rounded-sm border border-slate-700 hover:border-indigo-500 text-slate-700 hover:text-indigo-400 transition-colors flex items-center justify-center"
                                >
                                  <Plus className="w-2.5 h-2.5" />
                                </button>
                              ) : (
                                <span className="text-slate-700">—</span>
                              )
                            ) : (
                              <Lock className="w-3.5 h-3.5 text-slate-700 mx-auto" />
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                  {students.length === 0 && (
                    <tr>
                      <td colSpan={allMonthDates.length + 1} className="text-center py-8 text-slate-600 text-xs">
                        Bu guruhda o'quvchilar mavjud emas
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* MODAL: Take Attendance */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
              <div>
                <h3 className="font-bold text-white">Davomat Kiritish</h3>
                <p className="text-xs text-slate-500 mt-0.5">{selectedGroupInfo?.name}</p>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="date"
                  value={modalDate}
                  onChange={e => setModalDate(e.target.value)}
                  className="bg-slate-800 text-slate-300 text-xs rounded-lg px-3 py-1.5 border border-slate-700 focus:outline-none"
                />
                <button onClick={() => setShowModal(false)} className="p-1.5 text-slate-400 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Quick mark all */}
            <div className="px-5 py-2 border-b border-slate-800 flex items-center gap-2">
              <span className="text-xs text-slate-500">Barchasini:</span>
              {['KELDI', 'SABABSIZ', 'SABABLI'].map(status => (
                <button
                  key={status}
                  onClick={() => {
                    const updated = {};
                    students.forEach(s => updated[s.id] = { ...modalSheet[s.id], status });
                    setModalSheet(updated);
                  }}
                  className={`text-[10px] px-2 py-1 rounded-lg font-bold border transition-colors ${
                    status === 'KELDI' ? 'bg-emerald-900/30 text-emerald-400 border-emerald-500/30 hover:bg-emerald-900/50'
                    : status === 'SABABSIZ' ? 'bg-rose-900/30 text-rose-400 border-rose-500/30 hover:bg-rose-900/50'
                    : 'bg-amber-900/30 text-amber-400 border-amber-500/30 hover:bg-amber-900/50'
                  }`}
                >
                  {status === 'KELDI' ? '✓ Keldi' : status === 'SABABSIZ' ? '✕ Kelmadi' : '⚠ Sababli'}
                </button>
              ))}
            </div>

            {/* Student list */}
            <div className="flex-1 overflow-y-auto px-3 py-2">
              {modalSuccess && (
                <div className="mb-2 p-2 bg-emerald-900/30 border border-emerald-500/30 rounded-xl text-emerald-400 text-xs text-center">{modalSuccess}</div>
              )}
              {modalError && (
                <div className="mb-2 p-2 bg-rose-900/30 border border-rose-500/30 rounded-xl text-rose-400 text-xs text-center">{modalError}</div>
              )}
              {students.map((s, i) => {
                const cur = modalSheet[s.id] || { status: 'KELDI', note: '' };
                return (
                  <div key={s.id} className="flex items-center gap-3 py-2 border-b border-slate-800/50">
                    <span className="text-slate-600 text-xs w-5 text-right">{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-slate-200 font-medium truncate">{s.firstName} {s.lastName}</p>
                    </div>
                    <div className="flex gap-1">
                      {[
                        { status: 'KELDI', label: '✓', cls: 'bg-emerald-600 text-white' },
                        { status: 'SABABSIZ', label: '✕', cls: 'bg-rose-600 text-white' },
                        { status: 'SABABLI', label: '⚠', cls: 'bg-amber-600 text-white' },
                      ].map(({ status, label, cls }) => (
                        <button
                          key={status}
                          onClick={() => setModalSheet(p => ({ ...p, [s.id]: { ...p[s.id], status } }))}
                          className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${
                            cur.status === status ? cls : 'bg-slate-800 text-slate-500 hover:bg-slate-700'
                          }`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Save */}
            <div className="px-5 py-4 border-t border-slate-800">
              <button
                onClick={saveAttendance}
                disabled={modalSaving}
                className="w-full h-10 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold rounded-xl text-sm flex items-center justify-center gap-2 transition-all"
              >
                {modalSaving ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Save className="w-4 h-4" /> Davomatni Saqlash
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
