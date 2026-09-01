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
  RefreshCw,
  ArrowLeft,
  ArrowRight,
  GraduationCap,
  Layers
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
  
  // selectedGroupId is initially null -> shows group cards first!
  const [selectedGroupId, setSelectedGroupId] = useState(null);
  const [selectedGroupInfo, setSelectedGroupInfo] = useState(null);
  const [students, setStudents] = useState([]);
  const [attendanceData, setAttendanceData] = useState({}); // { "YYYY-MM-DD": { studentId: status } }
  const [loading, setLoading] = useState(false);
  const [groupsLoading, setGroupsLoading] = useState(true);
  const [groupSearch, setGroupSearch] = useState('');
  const [selectedCourseFilter, setSelectedCourseFilter] = useState('ALL');

  // Take attendance modal
  const [showModal, setShowModal] = useState(false);
  const [modalDate, setModalDate] = useState(today.toISOString().slice(0, 10));
  const [modalSheet, setModalSheet] = useState({});
  const [modalSaving, setModalSaving] = useState(false);
  const [modalSuccess, setModalSuccess] = useState('');
  const [modalError, setModalError] = useState('');

  // Load groups
  useEffect(() => {
    setGroupsLoading(true);
    axios.get('/api/groups')
      .then(res => {
        let data = res.data || [];
        if (isMentor) {
          data = data.filter(g => g.mentorName === user.fullName);
        }
        setGroups(data);
      })
      .catch(console.error)
      .finally(() => setGroupsLoading(false));
  }, [refreshTrigger]);

  // Load students and attendance when group/month/year changes
  useEffect(() => {
    if (!selectedGroupId) {
      setSelectedGroupInfo(null);
      setStudents([]);
      setAttendanceData({});
      return;
    }
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

  // Unique courses for filter
  const courseOptions = useMemo(() => {
    const set = new Set();
    groups.forEach(g => { if (g.courseName) set.add(g.courseName); });
    return Array.from(set);
  }, [groups]);

  // Filtered groups for card grid
  const filteredGroups = useMemo(() => {
    return groups.filter(g => {
      const matchSearch = g.name?.toLowerCase().includes(groupSearch.toLowerCase()) ||
        g.courseName?.toLowerCase().includes(groupSearch.toLowerCase()) ||
        g.mentorName?.toLowerCase().includes(groupSearch.toLowerCase());
      const matchCourse = selectedCourseFilter === 'ALL' || g.courseName === selectedCourseFilter;
      return matchSearch && matchCourse;
    });
  }, [groups, groupSearch, selectedCourseFilter]);

  // Get lesson dates for the selected month
  const lessonDates = useMemo(() => {
    const datesInMonth = Object.keys(attendanceData).filter(d => {
      const [y, m] = d.split('-').map(Number);
      return y === selectedYear && m === selectedMonth + 1;
    }).sort();

    if (datesInMonth.length === 0 && selectedGroupInfo?.daysOfWeek) {
      const dayNames = { 'Dushanba': 1, 'Seshanba': 2, 'Chorshanba': 3, 'Payshanba': 4, 'Juma': 5, 'Shanba': 6, 'Yakshanba': 0 };
      const groupDays = selectedGroupInfo.daysOfWeek.split(',').map(d => d.trim());
      const targetDays = groupDays.map(d => dayNames[d]).filter(d => d !== undefined);

      const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
      const generated = [];
      for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(selectedYear, selectedMonth, day);
        if (targetDays.includes(date.getDay()) && date <= today) {
          const dateStr = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          generated.push(dateStr);
        }
      }
      return generated;
    }
    return datesInMonth;
  }, [attendanceData, selectedMonth, selectedYear, selectedGroupInfo]);

  // All dates (past + upcoming) for month
  const allMonthDates = useMemo(() => {
    const dates = [...lessonDates];
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

  const prevMonth = () => {
    if (selectedMonth === 0) { setSelectedMonth(11); setSelectedYear(y => y - 1); }
    else setSelectedMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (selectedMonth === 11) { setSelectedMonth(0); setSelectedYear(y => y + 1); }
    else setSelectedMonth(m => m + 1);
  };

  // Export CSV
  const handleExportCSV = () => {
    if (!selectedGroupInfo || students.length === 0) return;
    const header = ['№', "O'quvchi", ...allMonthDates.map(d => d.split('-')[2])];
    const rows = students.map((s, idx) => {
      const row = [idx + 1, `"${s.firstName} ${s.lastName}"`];
      allMonthDates.forEach(d => {
        const st = getStatus(d, s.id);
        row.push(st === 'KELDI' ? 'Keldi' : st === 'SABABSIZ' ? 'Kelmadi' : st === 'SABABLI' ? 'Sababli' : '-');
      });
      return row.join(',');
    });
    const csvContent = '\uFEFF' + [header.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `davomat_${selectedGroupInfo.name}_${selectedYear}_${selectedMonth + 1}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Stats for the active group
  const totalPresent = students.length > 0 && lessonDates.length > 0
    ? lessonDates.reduce((sum, d) => sum + students.filter(s => attendanceData[d]?.[s.id] === 'KELDI').length, 0)
    : 0;
  const totalAbsent = students.length > 0 && lessonDates.length > 0
    ? lessonDates.reduce((sum, d) => sum + students.filter(s => attendanceData[d]?.[s.id] === 'SABABSIZ').length, 0)
    : 0;

  // ==========================================
  // VIEW 1: GROUP CARDS GRID (When no group selected)
  // ==========================================
  if (!selectedGroupId) {
    return (
      <div className="p-6 max-w-7xl mx-auto space-y-6 animate-fadeIn font-sans">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
                <CalendarCheck size={20} />
              </div>
              Davomat Nazorati
              <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-indigo-600/30 border border-indigo-500/40 text-indigo-300">
                {groups.length} ta guruh
              </span>
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Davomatni ko'rish, kiritish yoki eksport qilish uchun kerakli guruh kartochkasini tanlang
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                value={groupSearch}
                onChange={e => setGroupSearch(e.target.value)}
                placeholder="Guruh yoki mentor qidirish..."
                className="w-full bg-slate-900 text-slate-200 text-xs rounded-xl pl-9 pr-3 py-2 border border-slate-800 focus:outline-none focus:border-indigo-500/50"
              />
            </div>
          </div>
        </div>

        {/* Course Filter Chips */}
        {courseOptions.length > 0 && (
          <div className="flex flex-wrap gap-2 items-center">
            <button
              onClick={() => setSelectedCourseFilter('ALL')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                selectedCourseFilter === 'ALL'
                  ? 'bg-indigo-600 text-white shadow'
                  : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              Barcha kurslar ({groups.length})
            </button>
            {courseOptions.map(c => {
              const count = groups.filter(g => g.courseName === c).length;
              return (
                <button
                  key={c}
                  onClick={() => setSelectedCourseFilter(c)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    selectedCourseFilter === c
                      ? 'bg-indigo-600 text-white shadow'
                      : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {c} ({count})
                </button>
              );
            })}
          </div>
        )}

        {/* Groups Grid */}
        {groupsLoading ? (
          <div className="flex items-center justify-center h-64 text-slate-500">
            <RefreshCw className="w-6 h-6 animate-spin text-indigo-400 mr-2" /> Guruhlar yuklanmoqda...
          </div>
        ) : filteredGroups.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-slate-500">
            <CalendarCheck className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="font-semibold text-slate-400">Guruh topilmadi</p>
            <p className="text-xs mt-1 text-slate-600">Qidiruv parametrlarini o'zgartirib ko'ring</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredGroups.map(g => (
              <div
                key={g.id}
                onClick={() => setSelectedGroupId(g.id)}
                className="group relative bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-indigo-500/50 rounded-2xl p-5 shadow-lg hover:shadow-indigo-500/10 cursor-pointer transition-all duration-200 flex flex-col justify-between hover:scale-[1.02]"
              >
                {/* Top Badge */}
                <div className="flex items-start justify-between gap-2 mb-3">
                  <span className="px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 truncate">
                    {g.courseName || 'Kurs'}
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 border border-slate-700/50 text-slate-300 shrink-0">
                    {g.studentsCount || 0} o'quvchi
                  </span>
                </div>

                {/* Group Title */}
                <div>
                  <h3 className="font-black text-base text-white group-hover:text-indigo-300 transition-colors leading-tight">
                    {g.name}
                  </h3>
                </div>

                {/* Details List */}
                <div className="mt-4 space-y-2 pt-3 border-t border-slate-800/60 text-xs text-slate-400">
                  <div className="flex items-center gap-2">
                    <User className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    <span className="truncate">{g.mentorName || 'Mentor tayinlanmagan'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    <span>{g.startTime && g.endTime ? `${g.startTime} - ${g.endTime}` : (g.schedule || '-')}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    <span className="truncate">{g.daysOfWeek || 'Kunlar belgilanmagan'}</span>
                  </div>
                  {g.roomName && (
                    <div className="flex items-center gap-2">
                      <Home className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      <span>{g.roomName}</span>
                    </div>
                  )}
                </div>

                {/* Action CTA */}
                <div className="mt-4 pt-3 border-t border-slate-800/40 flex items-center justify-between">
                  <span className="text-[11px] text-indigo-400 font-bold group-hover:underline">
                    Davomatga kirish
                  </span>
                  <div className="w-7 h-7 rounded-lg bg-indigo-600/10 group-hover:bg-indigo-600 text-indigo-400 group-hover:text-white flex items-center justify-center transition-colors">
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // ==========================================
  // VIEW 2: GROUP ATTENDANCE MATRIX (When a group is selected)
  // ==========================================
  return (
    <div className="flex flex-col h-full overflow-hidden animate-fadeIn font-sans">
      {/* Top Breadcrumb & Actions Bar */}
      <div className="flex items-center justify-between px-6 py-3.5 border-b border-slate-800 bg-slate-900/60 backdrop-blur shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSelectedGroupId(null)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-bold rounded-xl text-xs transition-colors border border-slate-700/60"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Barcha guruhlar
          </button>
          <div className="h-4 w-[1px] bg-slate-800" />
          <div>
            <h2 className="text-sm font-black text-white leading-none flex items-center gap-2">
              <span>{selectedGroupInfo?.name}</span>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 font-medium">
                {selectedGroupInfo?.courseName}
              </span>
            </h2>
          </div>
        </div>

        {/* Quick Switch to another group */}
        <div className="flex items-center gap-3">
          <select
            value={selectedGroupId}
            onChange={e => setSelectedGroupId(parseInt(e.target.value))}
            className="bg-slate-800 text-slate-200 text-xs rounded-xl px-3 py-1.5 border border-slate-700/60 focus:outline-none"
          >
            {groups.map(g => (
              <option key={g.id} value={g.id}>{g.name} ({g.courseName})</option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Split Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* LEFT: Selected Group Info Card & Student List */}
        <div className="w-80 shrink-0 flex flex-col bg-slate-900/60 border-r border-slate-800 overflow-hidden">
          {/* Group Details Card */}
          <div className="p-4 border-b border-slate-800 space-y-2">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Guruh Tafsilotlari</p>
            <div className="bg-slate-800/60 rounded-xl p-3 space-y-2 border border-slate-700/40">
              {[
                { icon: BookOpen, label: selectedGroupInfo?.courseName || '-' },
                { icon: Clock, label: `${selectedGroupInfo?.startTime || '?'} - ${selectedGroupInfo?.endTime || '?'}` },
                { icon: Home, label: selectedGroupInfo?.roomName || selectedGroupInfo?.room || 'Xona belgilanmagan' },
                { icon: User, label: selectedGroupInfo?.mentorName || 'Mentor belgilanmagan' },
                { icon: Calendar, label: selectedGroupInfo?.daysOfWeek || '-' },
                { icon: Users, label: `${students.length} nafar o'quvchi` },
              ].map(({ icon: Icon, label }) => (
                <div key={label} className="flex items-center gap-2">
                  <Icon className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                  <span className="text-[11px] text-slate-300 truncate">{label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Student list */}
          <div className="flex-1 flex flex-col overflow-hidden p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                O'quvchilar ({students.length})
              </p>
            </div>
            <div className="flex-1 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
              {students.map((s, i) => (
                <div key={s.id} className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg bg-slate-800/40 hover:bg-slate-800 border border-slate-700/20 transition-colors">
                  <span className="text-[10px] font-bold text-slate-500 w-4 text-center">{i + 1}</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-slate-200 truncate">{s.firstName} {s.lastName}</p>
                    {s.phone && <p className="text-[10px] text-slate-500 truncate">{s.phone}</p>}
                  </div>
                </div>
              ))}
              {students.length === 0 && (
                <p className="text-slate-600 text-xs text-center py-4">O'quvchilar yo'q</p>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT: Monthly Calendar Attendance Matrix */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Month Navigation & Action Buttons */}
          <div className="flex items-center justify-between px-5 py-3 border-b border-slate-800 bg-slate-900/40 shrink-0">
            <div className="flex items-center gap-1.5">
              <button onClick={prevMonth} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <div className="flex gap-1 overflow-x-auto">
                {MONTHS_UZ.map((m, i) => (
                  <button
                    key={m}
                    onClick={() => setSelectedMonth(i)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors ${
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
              <span className="text-xs font-bold text-slate-500 ml-1">{selectedYear}</span>
            </div>

            <div className="flex items-center gap-2">
              {/* Stats Badge */}
              <div className="flex items-center gap-2.5 px-3 py-1 bg-slate-800/80 rounded-xl border border-slate-700/40 text-xs">
                <span className="text-emerald-400 font-bold">✓ {totalPresent}</span>
                <span className="text-rose-400 font-bold">✕ {totalAbsent}</span>
              </div>

              <button
                onClick={loadAttendanceMatrix}
                className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700/50 text-slate-400 hover:text-white transition-colors"
                title="Yangilash"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              </button>

              {canWrite && (
                <button
                  onClick={() => openModal()}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition-all shadow-lg shadow-indigo-600/20"
                >
                  <Plus className="w-3.5 h-3.5" /> Davomat Kiritish
                </button>
              )}

              <button
                onClick={handleExportCSV}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 text-xs font-bold rounded-xl border border-emerald-500/30 transition-all"
                title="Excel CSV yuklab olish"
              >
                <Download className="w-3.5 h-3.5" /> Excel
              </button>
            </div>
          </div>

          {/* Matrix Table */}
          <div className="flex-1 overflow-auto p-4 custom-scrollbar">
            {loading ? (
              <div className="flex items-center justify-center h-64 text-slate-500">
                <RefreshCw className="w-6 h-6 animate-spin text-indigo-400 mr-2" /> Davomat ma'lumotlari yuklanmoqda...
              </div>
            ) : (
              <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-auto shadow-xl">
                <table className="w-full text-xs">
                  <thead>
                    {/* Header: Lesson Date Icons */}
                    <tr className="border-b border-slate-800 bg-slate-950/40">
                      <th className="sticky left-0 bg-slate-900 z-10 px-3 py-2 text-left text-slate-500 font-semibold w-48 border-r border-slate-800">
                        Mavzular / Sanalar
                      </th>
                      {allMonthDates.map(d => (
                        <th key={d} className="px-1 py-2 text-center text-slate-600 font-normal border-l border-slate-800/50 min-w-[42px]">
                          <button
                            onClick={() => canWrite && openModal(d)}
                            className={`text-[10px] transition-colors ${canWrite ? 'hover:text-indigo-400 cursor-pointer' : ''}`}
                            title={canWrite ? `${d} sanasi uchun davomat kiritish` : d}
                          >
                            <Calendar className="w-3 h-3 mx-auto mb-0.5 text-slate-500 hover:text-indigo-400" />
                          </button>
                        </th>
                      ))}
                    </tr>
                    {/* Header: Date Day Numbers */}
                    <tr className="border-b border-slate-700 bg-slate-950/60">
                      <th className="sticky left-0 bg-slate-900 z-10 px-3 py-2 text-left text-slate-400 font-bold text-[11px] border-r border-slate-800">
                        № &nbsp; O'quvchilar
                      </th>
                      {allMonthDates.map(d => {
                        const day = parseInt(d.split('-')[2], 10);
                        const isPast = isDatePast(d);
                        const isTod = isDateToday(d);
                        return (
                          <th key={d} className={`px-1 py-1.5 text-center font-bold border-l border-slate-800/50 min-w-[42px] ${
                            isTod ? 'bg-indigo-900/40 text-indigo-400'
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
                      <tr key={student.id} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                        <td className="sticky left-0 bg-slate-900 z-10 px-3 py-2.5 border-r border-slate-800">
                          <div className="flex items-center gap-2">
                            <span className="text-slate-600 text-[10px] w-4 font-mono">{idx + 1}</span>
                            <div className="truncate">
                              <p className="text-slate-200 font-medium text-[11px] truncate leading-none">
                                {student.firstName} {student.lastName}
                              </p>
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
                              className={`text-center border-l border-slate-800/40 py-2.5 ${isTod ? 'bg-indigo-900/15' : ''}`}
                            >
                              {status === 'KELDI' ? (
                                <CheckCircle2 className="w-4 h-4 text-emerald-400 mx-auto" />
                              ) : status === 'SABABSIZ' ? (
                                <XCircle className="w-4 h-4 text-rose-400 mx-auto" />
                              ) : status === 'SABABLI' ? (
                                <div className="w-4 h-4 rounded-full bg-amber-500/20 border border-amber-500/40 mx-auto flex items-center justify-center" title="Sababli">
                                  <span className="text-[8px] text-amber-400 font-bold">S</span>
                                </div>
                              ) : isPast || isTod ? (
                                canWrite ? (
                                  <button
                                    onClick={() => openModal(d)}
                                    className="w-4 h-4 mx-auto rounded-sm border border-slate-700/60 hover:border-indigo-500 text-slate-600 hover:text-indigo-400 transition-colors flex items-center justify-center"
                                    title="Davomat kiritish"
                                  >
                                    <Plus className="w-2.5 h-2.5" />
                                  </button>
                                ) : (
                                  <span className="text-slate-700">—</span>
                                )
                              ) : (
                                <Lock className="w-3.5 h-3.5 text-slate-700/60 mx-auto" />
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                    {students.length === 0 && (
                      <tr>
                        <td colSpan={allMonthDates.length + 1} className="text-center py-10 text-slate-600 text-xs">
                          Ushbu guruhda hozircha faol o'quvchilar mavjud emas
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* MODAL: Take Attendance */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-950/40">
              <div>
                <h3 className="font-bold text-white text-base">Davomat Kiritish</h3>
                <p className="text-xs text-slate-400 mt-0.5">{selectedGroupInfo?.name} · {students.length} o'quvchi</p>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="date"
                  value={modalDate}
                  onChange={e => setModalDate(e.target.value)}
                  className="bg-slate-800 text-slate-200 text-xs rounded-xl px-3 py-1.5 border border-slate-700 focus:outline-none"
                />
                <button onClick={() => setShowModal(false)} className="p-1.5 text-slate-400 hover:text-white rounded-lg">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Quick mark all buttons */}
            <div className="px-5 py-2.5 border-b border-slate-800 flex items-center gap-2 bg-slate-950/20">
              <span className="text-xs text-slate-400 font-semibold">Barchasini belgilash:</span>
              {[
                { status: 'KELDI', label: '✓ Keldi', cls: 'bg-emerald-900/30 text-emerald-400 border-emerald-500/30' },
                { status: 'SABABSIZ', label: '✕ Kelmadi', cls: 'bg-rose-900/30 text-rose-400 border-rose-500/30' },
                { status: 'SABABLI', label: '⚠ Sababli', cls: 'bg-amber-900/30 text-amber-400 border-amber-500/30' },
              ].map(({ status, label, cls }) => (
                <button
                  key={status}
                  onClick={() => {
                    const updated = {};
                    students.forEach(s => updated[s.id] = { ...modalSheet[s.id], status });
                    setModalSheet(updated);
                  }}
                  className={`text-[11px] px-2.5 py-1 rounded-lg font-bold border transition-colors ${cls}`}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Student list */}
            <div className="flex-1 overflow-y-auto px-4 py-2 custom-scrollbar">
              {modalSuccess && (
                <div className="mb-2 p-2.5 bg-emerald-900/30 border border-emerald-500/30 rounded-xl text-emerald-400 text-xs text-center font-bold">{modalSuccess}</div>
              )}
              {modalError && (
                <div className="mb-2 p-2.5 bg-rose-900/30 border border-rose-500/30 rounded-xl text-rose-400 text-xs text-center font-bold">{modalError}</div>
              )}
              {students.map((s, i) => {
                const cur = modalSheet[s.id] || { status: 'KELDI', note: '' };
                return (
                  <div key={s.id} className="flex items-center gap-3 py-2 border-b border-slate-800/40">
                    <span className="text-slate-600 text-xs w-5 text-right font-mono">{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-slate-200 truncate">{s.firstName} {s.lastName}</p>
                    </div>
                    <div className="flex gap-1">
                      {[
                        { status: 'KELDI', label: '✓', cls: 'bg-emerald-600 text-white shadow' },
                        { status: 'SABABSIZ', label: '✕', cls: 'bg-rose-600 text-white shadow' },
                        { status: 'SABABLI', label: '⚠', cls: 'bg-amber-600 text-white shadow' },
                      ].map(({ status, label, cls }) => (
                        <button
                          key={status}
                          onClick={() => setModalSheet(p => ({ ...p, [s.id]: { ...p[s.id], status } }))}
                          className={`w-8 h-8 rounded-xl text-xs font-bold transition-all ${
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

            {/* Save Button */}
            <div className="px-5 py-4 border-t border-slate-800 bg-slate-950/40">
              <button
                onClick={saveAttendance}
                disabled={modalSaving}
                className="w-full h-10 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold rounded-xl text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-600/20"
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
