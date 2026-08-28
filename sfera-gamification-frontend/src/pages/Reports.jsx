import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  FileSpreadsheet,
  Calendar,
  DollarSign,
  TrendingUp,
  Users,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Phone,
  Search,
  Filter,
  Download,
  Printer,
  ChevronRight,
  Eye,
  X,
  CreditCard,
  Building,
  DoorOpen,
  PieChart,
  BookOpen
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import CustomSelect from '../components/CustomSelect';

export default function Reports({ refreshTrigger }) {
  const { user } = useAuth();
  
  // Tabs: 'tuition' | 'attendance' | 'rooms'
  const [reportTab, setReportTab] = useState('tuition');
  
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState('');
  const [loading, setLoading] = useState(true);
  const [reportData, setReportData] = useState(null);
  const [allStudentsData, setAllStudentsData] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Detailed Modal
  const [detailModalStudent, setDetailModalStudent] = useState(null);
  const [detailModalLoading, setDetailModalLoading] = useState(false);
  const [studentDetailReport, setStudentDetailReport] = useState(null);

  useEffect(() => {
    loadGroups();
  }, []);

  useEffect(() => {
    loadReport();
  }, [selectedMonth, selectedGroup, refreshTrigger]);

  const loadGroups = async () => {
    try {
      const res = await axios.get('/api/groups');
      setGroups(res.data || []);
      if (res.data && res.data.length > 0 && !selectedGroup) {
        setSelectedGroup(res.data[0].id.toString());
      }
    } catch (err) {
      console.error("Error loading groups for reports", err);
    }
  };

  const loadReport = async () => {
    if (!selectedGroup) return;
    setLoading(true);
    try {
      const res = await axios.get('/api/finance/tuition/group-report', {
        params: {
          groupId: selectedGroup,
          month: selectedMonth
        }
      });
      setReportData(res.data);
    } catch (err) {
      console.error("Error loading tuition group report", err);
      setReportData(null);
    } finally {
      setLoading(false);
    }
  };

  const openStudentDetail = async (studentId) => {
    setDetailModalLoading(true);
    setDetailModalStudent(studentId);
    try {
      const res = await axios.get('/api/finance/tuition/calculate', {
        params: {
          studentId: studentId,
          month: selectedMonth
        }
      });
      setStudentDetailReport(res.data);
    } catch (err) {
      console.error("Error loading student detail report", err);
    } finally {
      setDetailModalLoading(false);
    }
  };

  const filteredStudents = (reportData?.students || []).filter(s => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return s.studentName.toLowerCase().includes(q) ||
      (s.phone && s.phone.includes(q)) ||
      (s.parentPhone && s.parentPhone.includes(q));
  });

  const exportCSV = () => {
    if (!reportData || !reportData.students) return;
    
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "O'quvchi,Telefon,Ota-onasi Tel,O'tkazilgan darslar,Keldi,Sababli,Sababsiz,Hisoblangan to'lov (UZS),To'langan summa (UZS),Qoldiq (UZS)\n";
    
    reportData.students.forEach(s => {
      csvContent += `"${s.studentName}","${s.phone || ''}","${s.parentPhone || ''}",${s.conductedLessons},${s.attendedCount},${s.excusedCount},${s.absentCount},${s.calculatedTuition},${s.paidAmount},${s.balanceDue}\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Hisobot_${reportData.groupName}_${selectedMonth}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 overflow-y-auto max-h-[calc(100vh-4rem)]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-2.5 tracking-tight">
            <FileSpreadsheet className="text-indigo-400" size={28} />
            Moliya & Davomat Hisobotlari
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Davomatga asoslangan oylik to'lovlar, qarzdorlik va guruhlar hisoboti
          </p>
        </div>

        {/* Global actions */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={exportCSV}
            disabled={!reportData}
            className="h-9 px-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all shadow-lg shadow-emerald-600/20"
          >
            <Download size={14} /> Excel / CSV Yuklash
          </button>
          <button
            onClick={() => window.print()}
            className="h-9 px-3 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all"
          >
            <Printer size={14} /> Chop etish
          </button>
        </div>
      </div>

      {/* Filter and Control Ribbon */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
        {/* Month Selector */}
        <div>
          <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase tracking-wide">
            HISOBOT OYI
          </label>
          <div className="relative">
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="w-full h-10 px-3 bg-slate-950/60 border border-slate-800 rounded-xl text-slate-200 text-sm font-semibold focus:outline-none focus:border-indigo-500 cursor-pointer"
            />
          </div>
        </div>

        {/* Group Selector */}
        <div>
          <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase tracking-wide">
            GURUHNI TANLANG
          </label>
          <CustomSelect
            value={selectedGroup}
            onChange={setSelectedGroup}
            options={groups.map(g => ({ value: g.id.toString(), label: `${g.name} (${g.courseName || 'Kurs'})` }))}
            placeholder="Guruhni tanlang"
            className="w-full"
          />
        </div>

        {/* Search inside group */}
        <div>
          <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase tracking-wide">
            O'QUVCHINI QIDIRISH
          </label>
          <div className="relative">
            <input
              type="text"
              placeholder="Ism yoki telefon..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-10 pl-9 pr-3 bg-slate-950/60 border border-slate-800 rounded-xl text-slate-200 text-sm font-semibold focus:outline-none focus:border-indigo-500"
            />
            <Search size={15} className="absolute left-3 top-3 text-slate-500" />
          </div>
        </div>
      </div>

      {/* KPI Cards for Group */}
      {reportData && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase">Jami O'quvchilar</span>
              <Users size={16} className="text-indigo-400" />
            </div>
            <p className="text-2xl font-black text-slate-100 mt-2">{reportData.studentsCount} nafar</p>
            <span className="text-[11px] text-slate-500 font-semibold mt-1">
              1 dars narxi: {(reportData.pricePerLesson || 0).toLocaleString()} UZS
            </span>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase">Hisoblangan To'lov</span>
              <DollarSign size={16} className="text-indigo-400" />
            </div>
            <p className="text-2xl font-black text-indigo-400 mt-2">
              {(reportData.totalCalculatedTuition || 0).toLocaleString()} UZS
            </p>
            <span className="text-[11px] text-indigo-500/80 font-semibold mt-1">
              Davomat kunlariga asosan hisoblangan
            </span>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase">Qabul Qilingan Summa</span>
              <CheckCircle2 size={16} className="text-emerald-400" />
            </div>
            <p className="text-2xl font-black text-emerald-400 mt-2">
              {(reportData.totalPaid || 0).toLocaleString()} UZS
            </p>
            <span className="text-[11px] text-emerald-500/80 font-semibold mt-1">
              Ushbu oyda to'langan jami kassa
            </span>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase">Qarzdorlik / Qoldiq</span>
              <XCircle size={16} className="text-rose-400" />
            </div>
            <p className="text-2xl font-black text-rose-400 mt-2">
              {(reportData.totalBalanceDue || 0).toLocaleString()} UZS
            </p>
            <span className="text-[11px] text-rose-500/80 font-semibold mt-1">
              O'quvchilardan olinishi kerak summa
            </span>
          </div>
        </div>
      )}

      {/* Main Tuition Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/40">
          <div>
            <h3 className="font-extrabold text-slate-100 text-base">
              {reportData ? `${reportData.groupName} — Oylik Davomat va To'lovlar Qayti` : "Hisobot jadvali"}
            </h3>
            <span className="text-xs text-slate-400 font-semibold">
              Xona: {reportData?.roomName || '—'} | Kurs: {reportData?.courseName || '—'} | Davr: {selectedMonth}
            </span>
          </div>
        </div>

        {loading ? (
          <div className="p-20 text-center text-slate-500">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-indigo-500 mx-auto mb-3"></div>
            Hisobot ma'lumotlari hisoblanmoqda...
          </div>
        ) : !reportData || filteredStudents.length === 0 ? (
          <div className="p-16 text-center text-slate-500 font-semibold text-sm">
            <FileSpreadsheet size={40} className="mx-auto mb-3 opacity-30" />
            Tanlangan guruh yoki oy bo'yicha ma'lumotlar topilmadi.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/60 text-[10.5px] font-bold text-slate-400 uppercase tracking-wider h-11">
                  <th className="px-5 font-bold">O'quvchi F.I.Sh.</th>
                  <th className="px-4 font-bold">Telefonlar</th>
                  <th className="px-3 font-bold text-center">Darslar</th>
                  <th className="px-3 font-bold text-center">Keldi</th>
                  <th className="px-3 font-bold text-center">Sababli</th>
                  <th className="px-3 font-bold text-center">Kelmagan</th>
                  <th className="px-4 font-bold text-right">Hisoblangan To'lov</th>
                  <th className="px-4 font-bold text-right">To'langan</th>
                  <th className="px-4 font-bold text-right">Qoldiq / Qarz</th>
                  <th className="px-4 font-bold text-center">Batafsil</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium">
                {filteredStudents.map((st) => {
                  const isDebtor = st.balanceDue > 0;
                  return (
                    <tr key={st.studentId} className="hover:bg-slate-850/40 transition-colors h-14">
                      <td className="px-5 font-bold text-slate-200 text-sm">
                        {st.studentName}
                      </td>
                      <td className="px-4 text-slate-400">
                        <div className="flex flex-col">
                          <span className="text-xs font-semibold text-slate-300">{st.phone || '—'}</span>
                          {st.parentPhone && (
                            <span className="text-[10px] text-slate-500 font-medium">Ota-ona: {st.parentPhone}</span>
                          )}
                        </div>
                      </td>
                      <td className="px-3 text-center font-bold text-slate-400">
                        {st.conductedLessons}
                      </td>
                      <td className="px-3 text-center">
                        <span className="inline-block px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-bold border border-emerald-500/20">
                          {st.attendedCount}
                        </span>
                      </td>
                      <td className="px-3 text-center">
                        <span className="inline-block px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 font-bold border border-amber-500/20">
                          {st.excusedCount}
                        </span>
                      </td>
                      <td className="px-3 text-center">
                        <span className="inline-block px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 font-bold border border-rose-500/20">
                          {st.absentCount}
                        </span>
                      </td>
                      <td className="px-4 text-right font-extrabold text-slate-200 text-sm">
                        {st.calculatedTuition.toLocaleString()} UZS
                      </td>
                      <td className="px-4 text-right font-bold text-emerald-400 text-sm">
                        {st.paidAmount.toLocaleString()} UZS
                      </td>
                      <td className="px-4 text-right">
                        <span className={`inline-block font-extrabold text-sm ${isDebtor ? 'text-rose-400' : 'text-emerald-400'}`}>
                          {st.balanceDue.toLocaleString()} UZS
                        </span>
                      </td>
                      <td className="px-4 text-center">
                        <button
                          onClick={() => openStudentDetail(st.studentId)}
                          className="px-2.5 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white font-bold text-xs transition-all cursor-pointer border border-indigo-500/30 flex items-center gap-1 mx-auto"
                        >
                          <Eye size={13} /> Tarix
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Student Attendance & Tuition Detail Modal */}
      {detailModalStudent && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-2xl w-full shadow-2xl space-y-5 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 shrink-0">
              <div>
                <h3 className="font-extrabold text-slate-100 text-lg">
                  {studentDetailReport?.studentName || "O'quvchi davomat hisoboti"}
                </h3>
                <span className="text-xs text-slate-400 font-semibold">
                  Guruh: {studentDetailReport?.groupName} | Kurs: {studentDetailReport?.courseName} | Davr: {studentDetailReport?.month}
                </span>
              </div>
              <button
                type="button"
                onClick={() => { setDetailModalStudent(null); setStudentDetailReport(null); }}
                className="text-slate-400 hover:text-slate-100 cursor-pointer border-0 bg-transparent"
              >
                <X size={20} />
              </button>
            </div>

            {detailModalLoading ? (
              <div className="p-12 text-center text-slate-500">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-indigo-500 mx-auto mb-2"></div>
                Tafsilotlar yuklanmoqda...
              </div>
            ) : studentDetailReport ? (
              <div className="space-y-4 overflow-y-auto flex-1 pr-1">
                {/* Stat summary ribbon */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-950/60 p-3.5 border border-slate-800 rounded-2xl text-xs">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-500 block">1 dars narxi</span>
                    <span className="font-black text-slate-200 text-sm">{(studentDetailReport.pricePerLesson || 0).toLocaleString()} UZS</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-500 block">Kelgan darslar</span>
                    <span className="font-black text-emerald-400 text-sm">{studentDetailReport.attendedCount} ta</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-500 block">Hisoblangan</span>
                    <span className="font-black text-indigo-400 text-sm">{(studentDetailReport.calculatedTuition || 0).toLocaleString()} UZS</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-500 block">Qoldiq / Qarz</span>
                    <span className={`font-black text-sm ${(studentDetailReport.balanceDue || 0) > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                      {(studentDetailReport.balanceDue || 0).toLocaleString()} UZS
                    </span>
                  </div>
                </div>

                {/* Lesson-by-lesson breakdown table */}
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wide">
                  Darslar Bo'yicha Qatnashuv Tarixi
                </h4>
                
                <div className="border border-slate-800 rounded-xl overflow-hidden">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-800 bg-slate-950/60 text-[10px] font-bold text-slate-400 uppercase tracking-wider h-9">
                        <th className="px-4">Dars Sanasi</th>
                        <th className="px-4">O'qituvchi</th>
                        <th className="px-4 text-center">Davomat Holati</th>
                        <th className="px-4">Izoh / Sabab</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {studentDetailReport.lessonRecords?.length === 0 ? (
                        <tr>
                          <td colSpan="4" className="py-6 text-center text-slate-500 italic">Ushbu oyda darslar o'tilmagan.</td>
                        </tr>
                      ) : (
                        studentDetailReport.lessonRecords.map((r, i) => (
                          <tr key={i} className="hover:bg-slate-850/40 h-10">
                            <td className="px-4 font-mono font-bold text-slate-300">{r.lessonDate}</td>
                            <td className="px-4 text-slate-400 font-semibold">{r.mentorName}</td>
                            <td className="px-4 text-center">
                              <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                r.status === 'KELDI' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                                r.status === 'SABABLI' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                                'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                              }`}>
                                {r.status}
                              </span>
                            </td>
                            <td className="px-4 text-slate-400 text-xs italic">
                              {r.note || '—'}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : null}

            <div className="pt-3 border-t border-slate-800 flex justify-end shrink-0">
              <button
                type="button"
                onClick={() => { setDetailModalStudent(null); setStudentDetailReport(null); }}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl text-xs cursor-pointer"
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
