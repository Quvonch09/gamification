import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import {
  CalendarCheck,
  Users,
  Search,
  CheckCircle2,
  XCircle,
  AlertCircle,
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
  Sparkles,
  Check
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const MONTHS_UZ = [
  'Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun',
  'Iyul', 'Avgust', 'Sentabr', 'Oktabr', 'Noyabr', 'Dekabr'
];

const WEEKDAY_NAMES_UZ = {
  0: 'Yak',
  1: 'Dush',
  2: 'Sesh',
  3: 'Chor',
  4: 'Pay',
  5: 'Jum',
  6: 'Shan'
};

/**
 * Robust parser for group schedule days:
 * Handles: SESHANBA_PAYSHANBA_SHANBA, DUSHANBA_CHORSHANBA_JUMA,
 * JUFT, TOQ, HAR_KUNI, comma-separated, space-separated, etc.
 */
function parseGroupLessonDays(daysOfWeekStr) {
  if (!daysOfWeekStr) return [1, 3, 5]; // Default Mon, Wed, Fri
  const s = String(daysOfWeekStr).toUpperCase();
  const targetDays = new Set();

  // Individual days check
  if (s.includes('DUSHANBA') || s.includes('MON')) targetDays.add(1);
  if (s.includes('SESHANBA') || s.includes('TUE')) targetDays.add(2);
  if (s.includes('CHORSHANBA') || s.includes('WED')) targetDays.add(3);
  if (s.includes('PAYSHANBA') || s.includes('THU')) targetDays.add(4);
  if (s.includes('JUMA') || s.includes('FRI')) targetDays.add(5);
  if (s.includes('SHANBA') || s.includes('SAT')) targetDays.add(6);
  if (s.includes('YAKSHANBA') || s.includes('SUN')) targetDays.add(0);

  // Grouping keywords
  if (s.includes('JUFT') && targetDays.size === 0) {
    targetDays.add(2); targetDays.add(4); targetDays.add(6); // Sesh, Pay, Shan
  }
  if (s.includes('TOQ') && targetDays.size === 0) {
    targetDays.add(1); targetDays.add(3); targetDays.add(5); // Dush, Chor, Jum
  }
  if (s.includes('HAR_KUNI') || s.includes('DAILY') || s.includes('EVERYDAY')) {
    for (let i = 1; i <= 6; i++) targetDays.add(i);
  }

  return targetDays.size > 0 ? Array.from(targetDays) : [1, 3, 5];
}

export default function Attendance({ refreshTrigger }) {
  const { user } = useAuth();
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'BRANCH_ADMIN';
  const isMentor = user?.role === 'MENTOR';
  const isStudent = user?.role === 'STUDENT';
  const canWrite = isSuperAdmin || isAdmin || isMentor;

  const today = new Date();
  const [selectedMonth, setSelectedMonth] = useState(today.getMonth());
  const [selectedYear, setSelectedYear] = useState(today.getFullYear());
  const [groups, setGroups] = useState([]);
  
  // selectedGroupId is initially null -> shows group cards first
  const [selectedGroupId, setSelectedGroupId] = useState(null);
  const [selectedGroupInfo, setSelectedGroupInfo] = useState(null);
  const [students, setStudents] = useState([]);
  const [attendanceData, setAttendanceData] = useState({}); // { "YYYY-MM-DD": { studentId: status } }
  const [loading, setLoading] = useState(false);
  const [groupsLoading, setGroupsLoading] = useState(true);
  const [groupSearch, setGroupSearch] = useState('');
  const [studentSearch, setStudentSearch] = useState('');
  const [selectedCourseFilter, setSelectedCourseFilter] = useState('ALL');
  const [mobileViewTab, setMobileViewTab] = useState('matrix'); // 'details' | 'matrix' for mobile devices

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
      .then(async (res) => {
        let data = res.data || [];
        if (isMentor) {
          data = data.filter(g => g.mentorName === user?.fullName);
          setGroups(data);
        } else if (isStudent) {
          let studentGId = user?.groupId;
          let studentGName = user?.groupName;

          // If not directly present on user object, fetch student profile
          if (!studentGId && !studentGName && (user?.studentId || user?.student?.id)) {
            try {
              const profRes = await axios.get(`/api/students/${user?.studentId || user?.student?.id}/profile`);
              studentGName = profRes.data?.groupName;
            } catch (e) {
              console.error('Failed to load student profile for group filter', e);
            }
          }

          const filtered = data.filter(g =>
            (studentGId && String(g.id) === String(studentGId)) ||
            (studentGName && g.name?.trim().toLowerCase() === studentGName?.trim().toLowerCase())
          );

          setGroups(filtered);
        } else {
          setGroups(data);
        }
      })
      .catch(console.error)
      .finally(() => setGroupsLoading(false));
  }, [refreshTrigger, user]);

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
        const dateKey = r.date || r.lessonDate || (r.createdAt ? r.createdAt.slice(0, 10) : null);
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

  // Filtered students for left sidebar list
  const filteredStudents = useMemo(() => {
    if (!studentSearch.trim()) return students;
    const q = studentSearch.toLowerCase();
    return students.filter(s =>
      s.firstName?.toLowerCase().includes(q) ||
      s.lastName?.toLowerCase().includes(q) ||
      s.phone?.includes(q)
    );
  }, [students, studentSearch]);

  /**
   * Calculate all lesson dates for the selected month
   * Robustly parses daysOfWeek (e.g. SESHANBA_PAYSHANBA_SHANBA)
   * And combines with any dates that already have attendance records
   */
  const allMonthDates = useMemo(() => {
    const targetDays = parseGroupLessonDays(selectedGroupInfo?.daysOfWeek);
    const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
    const datesSet = new Set();

    // 1. Generate all scheduled days in the month
    for (let day = 1; day <= daysInMonth; day++) {
      const d = new Date(selectedYear, selectedMonth, day);
      if (targetDays.includes(d.getDay())) {
        const dateStr = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        datesSet.add(dateStr);
      }
    }

    // 2. Also add any date that has existing attendance records in this month
    Object.keys(attendanceData).forEach(d => {
      const [y, m] = d.split('-').map(Number);
      if (y === selectedYear && m === selectedMonth + 1) {
        datesSet.add(d);
      }
    });

    // If still empty (e.g. irregular schedule), show every 2 days
    if (datesSet.size === 0) {
      for (let day = 1; day <= daysInMonth; day += 2) {
        const dateStr = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        datesSet.add(dateStr);
      }
    }

    return Array.from(datesSet).sort();
  }, [attendanceData, selectedGroupInfo, selectedMonth, selectedYear]);

  // Open attendance modal for a specific date or today
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
      setModalSuccess("Davomat muvaffaqiyatli saqlandi! ✅");
      loadAttendanceMatrix();
      setTimeout(() => setShowModal(false), 1200);
    } catch (err) {
      setModalError(err.response?.data?.message || "Saqlashda xatolik yuz berdi");
    } finally {
      setModalSaving(false);
    }
  };

  const getStatus = (dateKey, studentId) => {
    return attendanceData[dateKey]?.[studentId] || null;
  };

  const isAttendanceTakenForDate = (dateKey) => {
    const records = attendanceData[dateKey];
    return records && Object.keys(records).length > 0;
  };

  const isDatePast = (dateStr) => {
    const todayStr = today.toISOString().slice(0, 10);
    return dateStr < todayStr;
  };

  const isDateToday = (dateStr) => {
    return dateStr === today.toISOString().slice(0, 10);
  };

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
    const header = ['№', "O'quvchi", ...allMonthDates.map(d => {
      const day = d.split('-')[2];
      const weekday = WEEKDAY_NAMES_UZ[new Date(d).getDay()];
      return `${day}-${weekday}`;
    })];

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

  // Stats for the active group in this month
  const totalPresent = students.length > 0 && allMonthDates.length > 0
    ? allMonthDates.reduce((sum, d) => sum + students.filter(s => attendanceData[d]?.[s.id] === 'KELDI').length, 0)
    : 0;
  const totalAbsent = students.length > 0 && allMonthDates.length > 0
    ? allMonthDates.reduce((sum, d) => sum + students.filter(s => attendanceData[d]?.[s.id] === 'SABABSIZ').length, 0)
    : 0;

  // Count how many lesson days in this month had attendance taken
  const daysTakenCount = allMonthDates.filter(d => isAttendanceTakenForDate(d)).length;

  // Format days of week readable
  const formatDaysReadable = (daysStr) => {
    if (!daysStr) return "Kunlar belgilanmagan";
    return daysStr
      .replace(/_/g, ' ')
      .toLowerCase()
      .replace(/\b\w/g, l => l.toUpperCase());
  };

  // ==========================================
  // VIEW 1: GROUP CARDS GRID (When no group is selected)
  // ==========================================
  if (!selectedGroupId) {
    return (
      <div className="p-3 sm:p-6 max-w-7xl mx-auto space-y-5 sm:space-y-6 animate-fadeIn font-sans">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-3">
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 text-indigo-400 flex items-center justify-center shadow-lg shadow-indigo-500/10 shrink-0">
                <CalendarCheck size={22} />
              </div>
              <span>Davomat Nazorati</span>
              <span className="px-2.5 sm:px-3 py-1 rounded-full text-xs font-black bg-indigo-600/30 border border-indigo-500/40 text-indigo-300 shrink-0">
                {groups.length} ta guruh
              </span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1.5">
              Davomatni ko'rish, yangi davomat kiritish yoki Excel eksport qilish uchun kerakli guruhni tanlang
            </p>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                value={groupSearch}
                onChange={e => setGroupSearch(e.target.value)}
                placeholder="Guruh yoki mentor qidirish..."
                className="w-full bg-slate-900 text-slate-200 text-sm rounded-xl pl-10 pr-4 py-2.5 border border-slate-800 focus:outline-none focus:border-indigo-500/60 transition-colors shadow-sm"
              />
            </div>
          </div>
        </div>

        {/* Course Filter Chips */}
        {courseOptions.length > 0 && (
          <div className="flex overflow-x-auto no-scrollbar py-1 gap-2 sm:gap-2.5 items-center">
            <button
              onClick={() => setSelectedCourseFilter('ALL')}
              className={`px-3.5 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
                selectedCourseFilter === 'ALL'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/25'
                  : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
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
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    selectedCourseFilter === c
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/25'
                      : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
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
          <div className="flex items-center justify-center h-64 text-slate-400 text-sm">
            <RefreshCw className="w-6 h-6 animate-spin text-indigo-400 mr-3" /> Guruhlar ro'yxati yuklanmoqda...
          </div>
        ) : filteredGroups.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-14 text-center text-slate-500 shadow-xl">
            <CalendarCheck className="w-14 h-14 mx-auto mb-3 opacity-30 text-indigo-400" />
            <p className="font-bold text-base text-slate-300">Guruh topilmadi</p>
            <p className="text-xs mt-1 text-slate-500">Qidiruv so'zini o'zgartirib ko'ring</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {filteredGroups.map(g => (
              <div
                key={g.id}
                onClick={() => setSelectedGroupId(g.id)}
                className="group relative bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-indigo-500/50 rounded-2xl p-5 shadow-lg hover:shadow-indigo-500/10 cursor-pointer transition-all duration-200 flex flex-col justify-between hover:scale-[1.02]"
              >
                {/* Top Badge */}
                <div className="flex items-start justify-between gap-2 mb-3">
                  <span className="px-3 py-1 rounded-lg text-xs font-black uppercase tracking-wider bg-indigo-500/10 border border-indigo-500/25 text-indigo-400 truncate">
                    {g.courseName || 'Kurs'}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-800 border border-slate-700 text-slate-300 shrink-0">
                    {g.studentsCount || 0} o'quvchi
                  </span>
                </div>

                {/* Group Title */}
                <h3 className="font-black text-lg text-white group-hover:text-indigo-300 transition-colors leading-tight">
                  {g.name}
                </h3>

                {/* Details List */}
                <div className="mt-4 space-y-2.5 pt-3.5 border-t border-slate-800/80 text-xs text-slate-400">
                  <div className="flex items-center gap-2.5">
                    <User className="w-4 h-4 text-indigo-400/80 shrink-0" />
                    <span className="truncate font-medium text-slate-300">{g.mentorName || 'Mentor tayinlanmagan'}</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Clock className="w-4 h-4 text-indigo-400/80 shrink-0" />
                    <span>{g.startTime && g.endTime ? `${g.startTime} - ${g.endTime}` : (g.schedule || '-')}</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Calendar className="w-4 h-4 text-indigo-400/80 shrink-0" />
                    <span className="truncate">{formatDaysReadable(g.daysOfWeek)}</span>
                  </div>
                  {g.roomName && (
                    <div className="flex items-center gap-2.5">
                      <Home className="w-4 h-4 text-indigo-400/80 shrink-0" />
                      <span>{g.roomName}</span>
                    </div>
                  )}
                </div>

                {/* Action CTA */}
                <div className="mt-5 pt-3 border-t border-slate-800/50 flex items-center justify-between">
                  <span className="text-xs text-indigo-400 font-bold group-hover:underline">
                    Davomatga kirish
                  </span>
                  <div className="w-8 h-8 rounded-xl bg-indigo-600/10 group-hover:bg-indigo-600 text-indigo-400 group-hover:text-white flex items-center justify-center transition-colors">
                    <ArrowRight className="w-4 h-4" />
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
  // VIEW 2: GROUP ATTENDANCE MATRIX & LARGE DETAILS
  // ==========================================
  return (
    <div className="flex flex-col h-full overflow-hidden animate-fadeIn font-sans">
      {/* Top Breadcrumb & Actions Bar */}
      <div className="flex flex-wrap items-center justify-between px-3 sm:px-6 py-3 sm:py-4 border-b border-slate-800 bg-slate-900/80 backdrop-blur shrink-0 gap-3">
        <div className="flex items-center gap-2 sm:gap-4 flex-wrap">
          <button
            onClick={() => setSelectedGroupId(null)}
            className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-100 font-bold rounded-xl text-xs sm:text-sm transition-all border border-slate-700/80 shadow-sm cursor-pointer shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Barcha guruhlar</span>
            <span className="sm:hidden">Orqaga</span>
          </button>
          <div className="h-5 w-[1px] bg-slate-700 hidden sm:block" />
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <h2 className="text-base sm:text-xl font-black text-white leading-none truncate max-w-[140px] sm:max-w-none">
              {selectedGroupInfo?.name}
            </h2>
            <span className="text-[10px] sm:text-xs font-bold px-2.5 sm:px-3 py-1 rounded-full bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 shrink-0">
              {selectedGroupInfo?.courseName}
            </span>
          </div>
        </div>

        {/* Quick switch dropdown */}
        <div className="flex items-center gap-2 sm:gap-3">
          <span className="text-xs text-slate-400 font-medium hidden md:inline">Boshqa guruh:</span>
          <select
            value={selectedGroupId}
            onChange={e => setSelectedGroupId(parseInt(e.target.value))}
            className="bg-slate-800 text-slate-200 text-xs sm:text-sm font-semibold rounded-xl px-2.5 sm:px-3.5 py-1.5 sm:py-2 border border-slate-700 focus:outline-none cursor-pointer max-w-[150px] sm:max-w-none"
          >
            {groups.map(g => (
              <option key={g.id} value={g.id}>{g.name} ({g.courseName})</option>
            ))}
          </select>
        </div>
      </div>

      {/* Mobile Tab Switcher between Group Details & Matrix (visible only on < lg) */}
      <div className="flex lg:hidden border-b border-slate-800 bg-slate-900/90 p-2 gap-2 shrink-0">
        <button
          onClick={() => setMobileViewTab('details')}
          className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            mobileViewTab === 'details'
              ? 'bg-indigo-600 text-white shadow'
              : 'bg-slate-800 text-slate-400 hover:text-white'
          }`}
        >
          Guruh va O'quvchilar
        </button>
        <button
          onClick={() => setMobileViewTab('matrix')}
          className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            mobileViewTab === 'matrix'
              ? 'bg-indigo-600 text-white shadow'
              : 'bg-slate-800 text-slate-400 hover:text-white'
          }`}
        >
          Davomat Jurnali
        </button>
      </div>

      {/* Main Split Body */}
      <div className="flex flex-1 overflow-hidden flex-col lg:flex-row">
        
        {/* LEFT SIDEBAR: Large Group Details (Top) & Full Scrollable Student List (Bottom) */}
        <div className={`w-full lg:w-96 shrink-0 flex-col bg-slate-900/70 border-r border-slate-800 overflow-y-auto custom-scrollbar ${
          mobileViewTab === 'details' ? 'flex flex-1' : 'hidden lg:flex'
        }`}>
          
          {/* 1. Large Group Details Card */}
          <div className="p-4 sm:p-5 border-b border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles size={14} /> Guruh Tafsilotlari
              </span>
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                ID: #{selectedGroupInfo?.id}
              </span>
            </div>

            <div className="bg-slate-800/80 rounded-2xl p-4 space-y-3.5 border border-slate-700/60 shadow-md">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-indigo-500/15 border border-indigo-500/30 text-indigo-400 flex items-center justify-center shrink-0 mt-0.5">
                  <BookOpen size={18} />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-bold text-slate-400 uppercase">Kurs Yo'nalishi</p>
                  <p className="text-base font-black text-white truncate">{selectedGroupInfo?.courseName || '-'}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-purple-500/15 border border-purple-500/30 text-purple-400 flex items-center justify-center shrink-0 mt-0.5">
                  <User size={18} />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-bold text-slate-400 uppercase">O'qituvchi / Mentor</p>
                  <p className="text-sm font-bold text-slate-100 truncate">{selectedGroupInfo?.mentorName || 'Mentor biriktirilmagan'}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                  <Clock size={18} />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-bold text-slate-400 uppercase">Dars Vaqti</p>
                  <p className="text-sm font-black text-emerald-300">
                    {selectedGroupInfo?.startTime && selectedGroupInfo?.endTime
                      ? `${selectedGroupInfo.startTime} - ${selectedGroupInfo.endTime}`
                      : (selectedGroupInfo?.schedule || 'Vaqt belgilanmagan')}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
                  <Calendar size={18} />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-bold text-slate-400 uppercase">Dars Kunlari</p>
                  <p className="text-sm font-bold text-amber-300 leading-snug">
                    {formatDaysReadable(selectedGroupInfo?.daysOfWeek)}
                  </p>
                </div>
              </div>

              {selectedGroupInfo?.roomName && (
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-sky-500/15 border border-sky-500/30 text-sky-400 flex items-center justify-center shrink-0 mt-0.5">
                    <Home size={18} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] font-bold text-slate-400 uppercase">Auditoriya / Xona</p>
                    <p className="text-sm font-bold text-slate-200">{selectedGroupInfo.roomName}</p>
                  </div>
                </div>
              )}

              <div className="flex items-start gap-3 pt-2 border-t border-slate-700/50">
                <div className="w-9 h-9 rounded-xl bg-blue-500/15 border border-blue-500/30 text-blue-400 flex items-center justify-center shrink-0 mt-0.5">
                  <Users size={18} />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-bold text-slate-400 uppercase">Guruhdagi O'quvchilar</p>
                  <p className="text-sm font-black text-white">{students.length} nafar o'quvchi</p>
                </div>
              </div>
            </div>
          </div>

          {/* 2. Full Scrollable Student List at the Bottom */}
          <div className="p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-black text-slate-300 uppercase tracking-wider">
                  O'quvchilar Ro'yxati ({students.length})
                </h3>
                <p className="text-[11px] text-slate-500">To'liq ro'yxat va ma'lumotlar</p>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-indigo-600/30 text-indigo-300 border border-indigo-500/30">
                {filteredStudents.length} ta
              </span>
            </div>

            {/* Student Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
              <input
                value={studentSearch}
                onChange={e => setStudentSearch(e.target.value)}
                placeholder="O'quvchi ismini qidirish..."
                className="w-full bg-slate-800 text-slate-200 text-xs rounded-xl pl-9 pr-3 py-2 border border-slate-700/70 focus:outline-none focus:border-indigo-500/60"
              />
            </div>

            {/* Scrollable list of students */}
            <div className="space-y-2 pt-1">
              {filteredStudents.map((s, i) => (
                <div
                  key={s.id}
                  className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/40 hover:border-slate-600 transition-all shadow-sm"
                >
                  <span className="w-6 h-6 rounded-lg bg-slate-700/80 text-slate-300 font-bold text-xs flex items-center justify-center shrink-0">
                    {i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-slate-100 truncate leading-tight">
                      {s.firstName} {s.lastName}
                    </p>
                    {s.phone && (
                      <p className="text-xs text-slate-400 truncate mt-0.5 font-mono">
                        {s.phone}
                      </p>
                    )}
                  </div>
                </div>
              ))}

              {filteredStudents.length === 0 && (
                <div className="text-center py-6 text-slate-500 text-xs">
                  O'quvchilar topilmadi
                </div>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT SIDE: Monthly Calendar Attendance Matrix */}
        <div className={`flex-1 flex-col overflow-hidden ${
          mobileViewTab === 'matrix' ? 'flex flex-1' : 'hidden lg:flex'
        }`}>
          
          {/* Top Bar: Month Selector & Action Buttons */}
          <div className="flex flex-wrap items-center justify-between px-3 sm:px-6 py-2.5 sm:py-3.5 border-b border-slate-800 bg-slate-900/60 shrink-0 gap-3">
            {/* Month Switcher */}
            <div className="flex items-center gap-1.5 sm:gap-2 max-w-full overflow-x-auto">
              <button
                onClick={prevMonth}
                className="p-1.5 sm:p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer border border-slate-800 shrink-0"
                title="Oldingi oy"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <div className="flex gap-1 overflow-x-auto py-1 no-scrollbar">
                {MONTHS_UZ.map((m, i) => (
                  <button
                    key={m}
                    onClick={() => setSelectedMonth(i)}
                    className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                      selectedMonth === i
                        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/80'
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>

              <button
                onClick={nextMonth}
                className="p-1.5 sm:p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer border border-slate-800 shrink-0"
                title="Keyingi oy"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              <span className="text-xs sm:text-sm font-black text-slate-300 ml-1 sm:ml-2 shrink-0">{selectedYear}</span>
            </div>

            {/* Right Buttons: Stats, Refresh, Take Attendance, Export */}
            <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
              {/* Stats badges */}
              <div className="flex items-center gap-2 sm:gap-3 px-2.5 sm:px-3.5 py-1.5 bg-slate-800 rounded-xl border border-slate-700/60 text-[11px] sm:text-xs shrink-0">
                <span className="text-emerald-400 font-bold flex items-center gap-1">
                  ✓ {totalPresent} keldi
                </span>
                <span className="text-rose-400 font-bold flex items-center gap-1">
                  ✕ {totalAbsent} kelmadi
                </span>
                <span className="text-indigo-400 font-bold hidden xl:inline">
                  📅 {daysTakenCount} / {allMonthDates.length} dars olindi
                </span>
              </div>

              <button
                onClick={loadAttendanceMatrix}
                className="p-1.5 sm:p-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer shrink-0"
                title="Yangilash"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </button>

              {canWrite && (
                <button
                  onClick={() => openModal()}
                  className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition-all shadow-lg shadow-indigo-600/20 cursor-pointer shrink-0"
                >
                  <Plus className="w-4 h-4" /> 
                  <span className="hidden sm:inline">Davomat Kiritish</span>
                  <span className="sm:hidden">Davomat</span>
                </button>
              )}

              <button
                onClick={handleExportCSV}
                className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3.5 py-1.5 sm:py-2 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 text-xs font-bold rounded-xl border border-emerald-500/30 transition-all cursor-pointer shrink-0"
                title="Excel CSV yuklab olish"
              >
                <Download className="w-4 h-4" /> 
                <span className="hidden sm:inline">Excel</span>
              </button>
            </div>
          </div>

          {/* Attendance Matrix Table */}
          <div className="flex-1 overflow-auto p-5 custom-scrollbar">
            {loading ? (
              <div className="flex items-center justify-center h-64 text-slate-400 text-sm">
                <RefreshCw className="w-6 h-6 animate-spin text-indigo-400 mr-3" /> Davomat ma'lumotlari yuklanmoqda...
              </div>
            ) : (
              <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-auto shadow-2xl">
                <table className="w-full text-xs">
                  <thead>
                    {/* Header Row 1: Weekday Names & Attendance Taken Indicator */}
                    <tr className="border-b border-slate-800 bg-slate-950/60">
                      <th className="sticky left-0 bg-slate-900 z-10 px-4 py-3 text-left text-slate-400 font-bold text-xs w-60 border-r border-slate-800">
                        Mavzular / Sanalar
                      </th>
                      {allMonthDates.map(d => {
                        const dateObj = new Date(d);
                        const weekday = WEEKDAY_NAMES_UZ[dateObj.getDay()];
                        const isTaken = isAttendanceTakenForDate(d);
                        const isTod = isDateToday(d);

                        return (
                          <th
                            key={d}
                            className={`px-1 py-2.5 text-center font-bold border-l border-slate-800/60 min-w-[50px] ${
                              isTod ? 'bg-indigo-900/30 text-indigo-400' : 'text-slate-400'
                            }`}
                          >
                            <span className="text-[11px] font-extrabold uppercase">{weekday}</span>
                            <div className="mt-1 flex items-center justify-center">
                              {isTaken ? (
                                <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 ring-2 ring-emerald-950" title="Davomat olingan" />
                              ) : isDatePast(d) ? (
                                <span className="inline-block w-2 h-2 rounded-full bg-rose-500/60 ring-2 ring-rose-950" title="Davomat olinmagan" />
                              ) : (
                                <span className="inline-block w-2 h-2 rounded-full bg-slate-600" title="Kutilmoqda" />
                              )}
                            </div>
                          </th>
                        );
                      })}
                    </tr>

                    {/* Header Row 2: Date Numbers (Clickable to enter/edit attendance) */}
                    <tr className="border-b border-slate-700 bg-slate-950/80">
                      <th className="sticky left-0 bg-slate-900 z-10 px-4 py-3 text-left text-slate-300 font-black text-sm border-r border-slate-800">
                        № &nbsp; O'quvchilar Ro'yxati
                      </th>
                      {allMonthDates.map(d => {
                        const day = parseInt(d.split('-')[2], 10);
                        const isTaken = isAttendanceTakenForDate(d);
                        const isTod = isDateToday(d);
                        const isPast = isDatePast(d);

                        return (
                          <th
                            key={d}
                            className={`px-1 py-2 text-center border-l border-slate-800/60 min-w-[50px] ${
                              isTod ? 'bg-indigo-900/40 text-indigo-300'
                              : isTaken ? 'text-emerald-400 font-black'
                              : isPast ? 'text-rose-400/80' : 'text-slate-400'
                            }`}
                          >
                            <button
                              onClick={() => canWrite && openModal(d)}
                              className={`w-full py-1 rounded-lg text-sm font-black transition-all cursor-pointer hover:bg-indigo-600/30 ${
                                isTod ? 'text-indigo-300 underline' : ''
                              }`}
                              title={canWrite ? `${d} sanasi uchun davomat kiritish / tahrirlash` : d}
                            >
                              {day}
                            </button>
                          </th>
                        );
                      })}
                    </tr>
                  </thead>
                  
                  <tbody>
                    {students.map((student, idx) => (
                      <tr key={student.id} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                        {/* Student Name Sticky Column */}
                        <td className="sticky left-0 bg-slate-900 z-10 px-4 py-3 border-r border-slate-800">
                          <div className="flex items-center gap-3">
                            <span className="text-slate-500 text-xs font-mono font-bold w-5">{idx + 1}</span>
                            <div className="truncate">
                              <p className="text-slate-100 font-bold text-sm truncate leading-snug">
                                {student.firstName} {student.lastName}
                              </p>
                              {student.phone && (
                                <p className="text-[11px] text-slate-500 font-mono mt-0.5">{student.phone}</p>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Date Attendance Checkmark Columns */}
                        {allMonthDates.map(d => {
                          const status = getStatus(d, student.id);
                          const isTaken = isAttendanceTakenForDate(d);
                          const isPast = isDatePast(d);
                          const isTod = isDateToday(d);

                          return (
                            <td
                              key={d}
                              className={`text-center border-l border-slate-800/50 py-3 ${
                                isTod ? 'bg-indigo-900/15' : ''
                              }`}
                            >
                              {status === 'KELDI' ? (
                                <CheckCircle2 className="w-5 h-5 text-emerald-400 mx-auto" />
                              ) : status === 'SABABSIZ' ? (
                                <XCircle className="w-5 h-5 text-rose-400 mx-auto" />
                              ) : status === 'SABABLI' ? (
                                <div
                                  className="w-5 h-5 rounded-full bg-amber-500/20 border border-amber-500/40 mx-auto flex items-center justify-center shadow-sm"
                                  title="Sababli"
                                >
                                  <span className="text-[9px] text-amber-400 font-black">S</span>
                                </div>
                              ) : isPast || isTod ? (
                                canWrite ? (
                                  <button
                                    onClick={() => openModal(d)}
                                    className="w-5 h-5 mx-auto rounded-lg border border-slate-700/70 hover:border-indigo-500 text-slate-600 hover:text-indigo-400 transition-colors flex items-center justify-center cursor-pointer"
                                    title="Davomat kiritish"
                                  >
                                    <Plus className="w-3 h-3" />
                                  </button>
                                ) : (
                                  <span className="text-slate-700 text-sm">—</span>
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
                        <td colSpan={allMonthDates.length + 1} className="text-center py-12 text-slate-500 text-sm font-semibold">
                          Ushbu guruhda o'quvchilar mavjud emas
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl w-full max-w-xl max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-800 bg-slate-950/40">
              <div>
                <h3 className="font-black text-white text-lg">Davomat Kiritish</h3>
                <p className="text-xs text-slate-400 mt-0.5">{selectedGroupInfo?.name} · {students.length} nafar o'quvchi</p>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="date"
                  value={modalDate}
                  onChange={e => setModalDate(e.target.value)}
                  className="bg-slate-800 text-slate-100 text-xs font-bold rounded-xl px-3 py-2 border border-slate-700 focus:outline-none"
                />
                <button
                  onClick={() => setShowModal(false)}
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Quick mark all buttons */}
            <div className="px-6 py-3 border-b border-slate-800 flex items-center gap-2.5 bg-slate-950/20">
              <span className="text-xs text-slate-400 font-bold">Barchasini belgilash:</span>
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
                  className={`text-xs px-3 py-1.5 rounded-xl font-bold border transition-all cursor-pointer ${cls}`}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Student list in modal */}
            <div className="flex-1 overflow-y-auto px-6 py-3 custom-scrollbar">
              {modalSuccess && (
                <div className="mb-3 p-3 bg-emerald-900/30 border border-emerald-500/30 rounded-2xl text-emerald-400 text-xs text-center font-bold">
                  {modalSuccess}
                </div>
              )}
              {modalError && (
                <div className="mb-3 p-3 bg-rose-900/30 border border-rose-500/30 rounded-2xl text-rose-400 text-xs text-center font-bold">
                  {modalError}
                </div>
              )}
              {students.map((s, i) => {
                const cur = modalSheet[s.id] || { status: 'KELDI', note: '' };
                return (
                  <div key={s.id} className="flex items-center gap-3 py-2.5 border-b border-slate-800/40">
                    <span className="text-slate-500 text-xs font-bold font-mono w-5 text-right">{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-slate-200 truncate">{s.firstName} {s.lastName}</p>
                    </div>
                    <div className="flex gap-1.5">
                      {[
                        { status: 'KELDI', label: '✓', cls: 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30' },
                        { status: 'SABABSIZ', label: '✕', cls: 'bg-rose-600 text-white shadow-md shadow-rose-600/30' },
                        { status: 'SABABLI', label: '⚠', cls: 'bg-amber-600 text-white shadow-md shadow-amber-600/30' },
                      ].map(({ status, label, cls }) => (
                        <button
                          key={status}
                          onClick={() => setModalSheet(p => ({ ...p, [s.id]: { ...p[s.id], status } }))}
                          className={`w-9 h-9 rounded-xl text-xs font-black transition-all cursor-pointer ${
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
            <div className="px-6 py-4 border-t border-slate-800 bg-slate-950/40">
              <button
                onClick={saveAttendance}
                disabled={modalSaving}
                className="w-full h-11 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold rounded-2xl text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-600/25 cursor-pointer"
              >
                {modalSaving ? (
                  <RefreshCw className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <Save className="w-5 h-5" /> Davomatni Saqlash
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
