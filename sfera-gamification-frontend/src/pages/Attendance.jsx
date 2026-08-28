import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  CalendarCheck,
  Users,
  Filter,
  Search,
  ChevronDown,
  CheckCircle2,
  XCircle,
  AlertCircle,
  FileText,
  Plus,
  Save,
  X,
  Sparkles,
  UserCheck
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import CustomSelect from '../components/CustomSelect';

const STATUS_CONFIG = {
  KELDI:    { label: 'Keldi',   color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20', icon: CheckCircle2 },
  SABABLI:  { label: 'Sababli', color: 'text-amber-400',   bg: 'bg-amber-500/10 border-amber-500/20',   icon: AlertCircle },
  SABABSIZ: { label: 'Kelmagan',color: 'text-rose-400',    bg: 'bg-rose-500/10 border-rose-500/20',     icon: XCircle },
};

export default function Attendance({ refreshTrigger }) {
  const { user } = useAuth();
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';
  const isAdmin   = user?.role === 'ADMIN' || user?.role === 'BRANCH_ADMIN' || user?.role === 'OPERATOR';
  const isAnyAdmin = isSuperAdmin || isAdmin;
  const isMentor  = user?.role === 'MENTOR';
  const isStudent = user?.role === 'STUDENT';

  const [records, setRecords]           = useState([]);
  const [groups,  setGroups]            = useState([]);
  const [mentors, setMentors]           = useState([]);
  const [loading, setLoading]           = useState(true);

  const [selectedGroup,  setSelectedGroup]  = useState('');
  const [selectedMentor, setSelectedMentor] = useState('');
  const [searchQuery,    setSearchQuery]    = useState('');
  const [selectedDate,   setSelectedDate]   = useState('');

  // Reception Quick Attendance Taking Modal
  const [showTakeModal, setShowTakeModal] = useState(false);
  const [takeModalGroup, setTakeModalGroup] = useState('');
  const [takeModalDate, setTakeModalDate] = useState(new Date().toISOString().slice(0, 10));
  const [groupStudents, setGroupStudents] = useState([]);
  const [attendanceSheet, setAttendanceSheet] = useState({});
  const [takeModalLoading, setTakeModalLoading] = useState(false);
  const [takeModalSaving, setTakeModalSaving] = useState(false);
  const [takeModalSuccess, setTakeModalSuccess] = useState('');
  const [takeModalError, setTakeModalError] = useState('');

  // Student: show only their own records — no filters needed
  useEffect(() => {
    if (!isAnyAdmin && !isMentor) return;

    // Load groups for filter
    axios.get('/api/groups')
      .then(res => {
        setGroups(res.data);
        if (res.data.length > 0 && !takeModalGroup) {
          setTakeModalGroup(res.data[0].id.toString());
        }
        // Build unique mentors list from groups
        const mentorMap = {};
        res.data.forEach(g => {
          if (g.mentorId && !mentorMap[g.mentorId]) {
            mentorMap[g.mentorId] = { id: g.mentorId, name: g.mentorName };
          }
        });
        setMentors(Object.values(mentorMap));
      })
      .catch(err => console.error('Error loading groups', err));
  }, [isAnyAdmin, isMentor]);

  useEffect(() => {
    fetchRecords();
  }, [selectedGroup, selectedMentor, refreshTrigger]);

  const fetchRecords = () => {
    setLoading(true);
    const params = {};
    if (selectedGroup)  params.groupId  = selectedGroup;
    if (selectedMentor) params.mentorId = selectedMentor;

    axios.get('/api/attendance', { params })
      .then(res => setRecords(res.data))
      .catch(err => console.error('Error loading attendance', err))
      .finally(() => setLoading(false));
  };

  // Open Reception Modal
  const openAttendanceModal = () => {
    setShowTakeModal(true);
    setTakeModalSuccess('');
    setTakeModalError('');
    if (takeModalGroup) {
      loadStudentsForModal(takeModalGroup);
    }
  };

  const loadStudentsForModal = (groupId) => {
    if (!groupId) return;
    setTakeModalLoading(true);
    axios.get(`/api/groups/${groupId}/students`)
      .then(res => {
        setGroupStudents(res.data || []);
        const initial = {};
        (res.data || []).forEach(s => {
          initial[s.id] = {
            attendanceStatus: 'KELDI',
            attendanceNote: ''
          };
        });
        setAttendanceSheet(initial);
      })
      .catch(err => {
        console.error("Error loading group students", err);
        setTakeModalError("Guruh o'quvchilarini yuklashda xatolik");
      })
      .finally(() => setTakeModalLoading(false));
  };

  const handleGroupSelectInModal = (groupId) => {
    setTakeModalGroup(groupId);
    loadStudentsForModal(groupId);
  };

  const updateAttendanceSheetStatus = (studentId, status) => {
    setAttendanceSheet(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        attendanceStatus: status
      }
    }));
  };

  const updateAttendanceSheetNote = (studentId, note) => {
    setAttendanceSheet(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        attendanceNote: note
      }
    }));
  };

  const handleSaveReceptionAttendance = async (e) => {
    e.preventDefault();
    if (!takeModalGroup || !takeModalDate) {
      setTakeModalError("Guruh va sana majburiy");
      return;
    }
    setTakeModalSaving(true);
    setTakeModalError('');
    setTakeModalSuccess('');

    try {
      const recordsPayload = Object.keys(attendanceSheet).map(sId => ({
        studentId: parseInt(sId),
        attendanceStatus: attendanceSheet[sId].attendanceStatus,
        attendanceNote: attendanceSheet[sId].attendanceNote || null,
        homeworkStatus: attendanceSheet[sId].attendanceStatus === 'KELDI' ? 'BAJARDI' : 'NONE',
        projectCount: 0,
        questionAnswer: false,
        activity: false,
        phoneGame: false
      }));

      await axios.post('/api/lessons/save', {
        groupId: parseInt(takeModalGroup),
        date: takeModalDate,
        records: recordsPayload
      });

      setTakeModalSuccess("Davomat muvaffaqiyatli saqlandi!");
      fetchRecords();
      setTimeout(() => {
        setShowTakeModal(false);
        setTakeModalSuccess('');
      }, 1200);
    } catch (err) {
      console.error(err);
      setTakeModalError(err.response?.data || "Davomatni saqlashda xatolik yuz berdi.");
    } finally {
      setTakeModalSaving(false);
    }
  };

  // Filter by search query (student name) and date
  const filtered = records.filter(r => {
    const matchName = !searchQuery || r.studentName?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchDate = !selectedDate || (r.lessonDate && r.lessonDate.startsWith(selectedDate));
    return matchName && matchDate;
  });

  // Summary stats
  const total    = filtered.length;
  const keldi    = filtered.filter(r => r.attendanceStatus === 'KELDI').length;
  const sababli  = filtered.filter(r => r.attendanceStatus === 'SABABLI').length;
  const sababsiz = filtered.filter(r => r.attendanceStatus === 'SABABSIZ').length;

  return (
    <div className="p-4 sm:p-6 space-y-6 overflow-y-auto max-h-[calc(100vh-4rem)]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-2">
            <CalendarCheck className="text-indigo-400" />
            Davomat Nazorati
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            {isStudent ? "Sizning dars davomatingiz tarixi" : "Reception & O'qituvchilar dars davomati ro'yxati"}
          </p>
        </div>

        {isAnyAdmin && (
          <button
            onClick={openAttendanceModal}
            className="h-10 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-indigo-600/20 cursor-pointer transition-all active:scale-[0.98]"
          >
            <Plus size={16} /> Davomat Kiritish (Reception)
          </button>
        )}
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Jami yozuv", value: total, color: "text-indigo-400", bg: "bg-indigo-500/10 border-indigo-500/20" },
          { label: "Keldi",      value: keldi,    color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20" },
          { label: "Sababli",    value: sababli,  color: "text-amber-400",   bg: "bg-amber-500/10 border-amber-500/20" },
          { label: "Kelmagan",   value: sababsiz, color: "text-rose-400",    bg: "bg-rose-500/10 border-rose-500/20" },
        ].map(stat => (
          <div key={stat.label} className={`bg-slate-900 border ${stat.bg} rounded-2xl p-4`}>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">{stat.label}</p>
            <p className={`text-2xl sm:text-3xl font-extrabold mt-1 ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Filters (Admin & Mentor only) */}
      {(isAnyAdmin || isMentor) && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row gap-3 flex-wrap">
          {/* Search */}
          <div className="relative flex-1 min-w-[180px]">
            <input
              type="text"
              placeholder="O'quvchi ismini qidirish..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full h-10 pl-10 pr-4 bg-slate-950/60 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-indigo-500 text-sm font-semibold"
            />
            <Search size={16} className="absolute left-3 top-3 text-slate-500" />
          </div>

          {/* Date filter */}
          <div className="relative flex-shrink-0">
            <input
              type="date"
              value={selectedDate}
              onChange={e => setSelectedDate(e.target.value)}
              className="h-10 pl-3 pr-3 bg-slate-950/60 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-indigo-500 text-sm font-semibold cursor-pointer"
              title="Sana bo'yicha filtrlash"
            />
            {selectedDate && (
              <button
                onClick={() => setSelectedDate('')}
                className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-rose-500 text-white rounded-full flex items-center justify-center text-[10px] hover:bg-rose-400"
              >✕</button>
            )}
          </div>

          {/* Group filter */}
          <CustomSelect
            value={selectedGroup}
            onChange={val => { setSelectedGroup(val); }}
            options={groups.map(g => ({ value: g.id, label: g.name }))}
            placeholder="Barcha guruhlar"
            className="w-full sm:w-52"
          />

          {/* Mentor filter (Admin only) */}
          {isAnyAdmin && (
            <CustomSelect
              value={selectedMentor}
              onChange={val => setSelectedMentor(val)}
              options={mentors.map(m => ({ value: m.id, label: m.name }))}
              placeholder="Barcha o'qituvchilar"
              className="w-full sm:w-52"
            />
          )}
        </div>
      )}

      {/* Student: search only */}
      {isStudent && (
        <div className="relative">
          <input
            type="text"
            placeholder="Sana yoki guruh bo'yicha qidirish..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full h-10 pl-10 pr-4 bg-slate-900 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-indigo-500 text-sm"
          />
          <Search size={16} className="absolute left-3 top-3 text-slate-500" />
        </div>
      )}

      {/* Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
        {loading ? (
          <div className="p-20 text-center text-slate-500">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-indigo-500 mx-auto mb-3"></div>
            Yuklanmoqda...
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-16 text-center text-slate-500 font-semibold text-sm">
            <CalendarCheck size={40} className="mx-auto mb-3 opacity-30" />
            Davomat ma'lumotlari topilmadi.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/50 text-[10px] font-bold text-slate-400 tracking-wider uppercase">
                  {!isStudent && <th className="py-3 px-5">O'QUVCHI</th>}
                  <th className="py-3 px-5">SANA</th>
                  {!isStudent && <th className="py-3 px-5">GURUH</th>}
                  {isAnyAdmin && <th className="py-3 px-5">O'QITUVCHI</th>}
                  <th className="py-3 px-5 text-center">HOLAT</th>
                  <th className="py-3 px-5">IZOH</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filtered.map(record => {
                  const cfg = STATUS_CONFIG[record.attendanceStatus] || STATUS_CONFIG.SABABSIZ;
                  const Icon = cfg.icon;
                  return (
                    <tr key={record.id} className="hover:bg-slate-850/30 transition-all text-sm">
                      {!isStudent && (
                        <td className="py-3 px-5 font-semibold text-slate-200">
                          {record.studentName}
                        </td>
                      )}
                      <td className="py-3 px-5 text-slate-400 font-mono text-xs">
                        {record.lessonDate}
                      </td>
                      {!isStudent && (
                        <td className="py-3 px-5 text-slate-300 text-xs font-semibold">
                          {record.groupName || '—'}
                        </td>
                      )}
                      {isAnyAdmin && (
                        <td className="py-3 px-5 text-slate-400 text-xs">
                          {record.mentorName || '—'}
                        </td>
                      )}
                      <td className="py-3 px-5 text-center">
                        <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full border ${cfg.bg} ${cfg.color}`}>
                          <Icon size={12} />
                          {cfg.label}
                        </span>
                      </td>
                      <td className="py-3 px-5 text-slate-400 text-xs max-w-[200px]">
                        {record.attendanceNote ? (
                          <span className="flex items-center gap-1">
                            <FileText size={12} className="text-amber-400 shrink-0" />
                            <span className="truncate" title={record.attendanceNote}>
                              {record.attendanceNote}
                            </span>
                          </span>
                        ) : (
                          <span className="text-slate-600">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Reception Quick Attendance Taking Modal */}
      {showTakeModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-fadeIn">
          <form onSubmit={handleSaveReceptionAttendance} className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-2xl w-full shadow-2xl space-y-5 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 shrink-0">
              <div className="flex items-center gap-2.5 text-indigo-400">
                <UserCheck size={22} />
                <div>
                  <h3 className="font-extrabold text-slate-100 text-lg">Administrator Davomat Qaydi</h3>
                  <p className="text-xs text-slate-400 font-medium">Guruh bo'yicha davomat olish va izohlar kiritish</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowTakeModal(false)}
                className="text-slate-400 hover:text-slate-100 cursor-pointer border-0 bg-transparent"
              >
                <X size={20} />
              </button>
            </div>

            {takeModalError && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-xs font-semibold shrink-0">
                {takeModalError}
              </div>
            )}
            {takeModalSuccess && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-xs font-semibold shrink-0">
                {takeModalSuccess}
              </div>
            )}

            {/* Selector Ribbon */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 shrink-0 bg-slate-950/40 p-4 border border-slate-800 rounded-2xl">
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase">GURUH *</label>
                <CustomSelect
                  value={takeModalGroup}
                  onChange={handleGroupSelectInModal}
                  options={groups.map(g => ({ value: g.id.toString(), label: g.name }))}
                  placeholder="Guruhni tanlang"
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase">DARS SANASI *</label>
                <input
                  type="date"
                  required
                  value={takeModalDate}
                  onChange={(e) => setTakeModalDate(e.target.value)}
                  className="w-full h-10 px-3 bg-slate-850 border border-slate-800 rounded-xl text-slate-200 text-sm font-semibold focus:outline-none focus:border-indigo-500 cursor-pointer"
                />
              </div>
            </div>

            {/* Students list */}
            <div className="space-y-3 overflow-y-auto flex-1 pr-1">
              {takeModalLoading ? (
                <div className="p-12 text-center text-slate-500">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-indigo-500 mx-auto mb-2"></div>
                  O'quvchilar yuklanmoqda...
                </div>
              ) : groupStudents.length === 0 ? (
                <div className="p-12 text-center text-slate-500 text-sm italic">
                  Guruhda faol o'quvchilar topilmadi.
                </div>
              ) : (
                <div className="divide-y divide-slate-800/60 border border-slate-800 rounded-2xl overflow-hidden">
                  {groupStudents.map(st => {
                    const currentStatus = attendanceSheet[st.id]?.attendanceStatus || 'KELDI';
                    const currentNote = attendanceSheet[st.id]?.attendanceNote || '';

                    return (
                      <div key={st.id} className="p-3.5 bg-slate-950/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-850/40 transition-colors">
                        <div className="min-w-0">
                          <p className="font-bold text-slate-200 text-sm">{st.fullName}</p>
                          <span className="text-[11px] text-slate-500">{st.phone || 'Telefon kiritilmagan'}</span>
                        </div>

                        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                          {/* Status toggle buttons */}
                          <div className="flex items-center bg-slate-900 border border-slate-800 rounded-xl p-1 gap-1">
                            <button
                              type="button"
                              onClick={() => updateAttendanceSheetStatus(st.id, 'KELDI')}
                              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                currentStatus === 'KELDI' ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
                              }`}
                            >
                              Keldi
                            </button>
                            <button
                              type="button"
                              onClick={() => updateAttendanceSheetStatus(st.id, 'SABABLI')}
                              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                currentStatus === 'SABABLI' ? 'bg-amber-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
                              }`}
                            >
                              Sababli
                            </button>
                            <button
                              type="button"
                              onClick={() => updateAttendanceSheetStatus(st.id, 'SABABSIZ')}
                              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                currentStatus === 'SABABSIZ' ? 'bg-rose-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
                              }`}
                            >
                              Kelmagan
                            </button>
                          </div>

                          {/* Note input if SABABLI or note needed */}
                          <input
                            type="text"
                            placeholder="Izoh (sababi)..."
                            value={currentNote}
                            onChange={(e) => updateAttendanceSheetNote(st.id, e.target.value)}
                            className="h-9 px-3 bg-slate-900 border border-slate-800 rounded-xl text-slate-200 text-xs focus:outline-none focus:border-indigo-500 w-full sm:w-44"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-800 flex justify-end gap-3 shrink-0">
              <button
                type="button"
                onClick={() => setShowTakeModal(false)}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl text-xs cursor-pointer"
              >
                Bekor qilish
              </button>
              <button
                type="submit"
                disabled={takeModalSaving || groupStudents.length === 0}
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold rounded-xl text-xs cursor-pointer shadow-lg shadow-indigo-600/20 flex items-center gap-1.5"
              >
                <Save size={15} />
                {takeModalSaving ? "Saqlanmoqda..." : "Davomatni Saqlash"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
