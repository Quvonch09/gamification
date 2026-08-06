import React, { useState, useEffect } from 'react';
import axios from 'axios';
import CustomSelect from '../components/CustomSelect';
import { 
  Calendar, 
  Users, 
  Minus, 
  Plus, 
  Check, 
  X,
  AlertTriangle,
  Save,
  CheckCircle2,
  BookOpen,
  ChevronDown
} from 'lucide-react';

export default function Journal() {
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState('');
  const [lessonDate, setLessonDate] = useState(new Date().toISOString().split('T')[0]);
  const [students, setStudents] = useState([]);
  const [journalData, setJournalData] = useState({});
  const [loading, setLoading] = useState(false);
  const [groupsLoading, setGroupsLoading] = useState(true);
  
  // Dialog state for Phone Game Penalty
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingPenaltyIndex, setPendingPenaltyIndex] = useState(null);

  // Dialog state for SABABLI note
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [noteModalStudentId, setNoteModalStudentId] = useState(null);
  const [noteInput, setNoteInput] = useState('');

  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    // Load mentor's groups
    axios.get('/api/groups/my')
      .then(res => {
        setGroups(res.data);
        if (res.data.length > 0) {
          setSelectedGroup(res.data[0].id);
        }
      })
      .catch(err => console.error("Error loading groups", err))
      .finally(() => setGroupsLoading(false));
  }, []);

  useEffect(() => {
    if (!selectedGroup) return;

    setLoading(true);
    setSaveSuccess(false);
    setErrorMessage('');
    axios.get(`/api/groups/${selectedGroup}/students`)
      .then(res => {
        setStudents(res.data);
        // Initialize journal grid state
        const initialData = {};
        res.data.forEach(s => {
          initialData[s.id] = {
            attendanceStatus: 'KELDI',
            attendanceNote: '',
            homeworkStatus: 'BAJARDI',
            projectCount: 0,
            questionAnswer: false,
            activity: false,
            phoneGame: false,
            calculatedPoints: 13
          };
        });
        setJournalData(initialData);
      })
      .catch(err => {
        console.error("Error loading students", err);
        setErrorMessage("O'quvchilarni yuklashda xatolik yuz berdi.");
      })
      .finally(() => setLoading(false));
  }, [selectedGroup]);

  // Recalculates points for a specific student's row
  const calculateRowPoints = (rowState) => {
    let points = 0;
    
    // Attendance
    if (rowState.attendanceStatus === 'KELDI') {
      points += 3;
    } else if (rowState.attendanceStatus === 'SABABLI') {
      points += -5;
    } else if (rowState.attendanceStatus === 'SABABSIZ') {
      points += -10;
    }

    // Rest of points only count if student is present
    if (rowState.attendanceStatus === 'KELDI') {
      // Homework
      if (rowState.homeworkStatus === 'BAJARDI') points += 10;
      if (rowState.homeworkStatus === 'BAJARMADI') points += -10;
      // 'BERILMAGAN' => 0 points (no change)

      // Projects
      points += rowState.projectCount * 15;

      // Q&A
      if (rowState.questionAnswer) points += 7;

      // Activity
      if (rowState.activity) points += 5;

      // Phone
      if (rowState.phoneGame) points += -25;
    } else {
      // Phone penalty can still occur if they did it inside the center, but let's stick to UI logic
      if (rowState.phoneGame) points += -25;
    }

    return points;
  };

  const updateStudentData = (studentId, key, value) => {
    setJournalData(prev => {
      const updatedRow = { ...prev[studentId], [key]: value };
      
      // If student is marked absent, block/reset other positive fields
      if (key === 'attendanceStatus' && value !== 'KELDI') {
        updatedRow.homeworkStatus = 'NONE';
        updatedRow.projectCount = 0;
        updatedRow.questionAnswer = false;
        updatedRow.activity = false;
      } else if (key === 'attendanceStatus' && value === 'KELDI') {
        // Reset to default present values — keep BERILMAGAN if it was set
        if (updatedRow.homeworkStatus === 'NONE') {
          updatedRow.homeworkStatus = 'BAJARDI';
        }
      }

      updatedRow.calculatedPoints = calculateRowPoints(updatedRow);
      return { ...prev, [studentId]: updatedRow };
    });
  };

  // Handle attendance click — SABABLI requires a note
  const handleAttendanceClick = (studentId, status) => {
    if (status === 'SABABLI') {
      setNoteModalStudentId(studentId);
      setNoteInput(journalData[studentId]?.attendanceNote || '');
      setShowNoteModal(true);
    } else {
      updateStudentData(studentId, 'attendanceStatus', status);
      // Clear note if switching away from SABABLI
      if (status !== 'SABABLI') {
        setJournalData(prev => ({ ...prev, [studentId]: { ...prev[studentId], attendanceNote: '' } }));
      }
    }
  };

  const confirmNote = () => {
    if (noteModalStudentId !== null) {
      setJournalData(prev => {
        const updatedRow = { ...prev[noteModalStudentId], attendanceStatus: 'SABABLI', attendanceNote: noteInput };
        updatedRow.homeworkStatus = 'NONE';
        updatedRow.projectCount = 0;
        updatedRow.questionAnswer = false;
        updatedRow.activity = false;
        updatedRow.calculatedPoints = calculateRowPoints(updatedRow);
        return { ...prev, [noteModalStudentId]: updatedRow };
      });
    }
    setShowNoteModal(false);
    setNoteModalStudentId(null);
    setNoteInput('');
  };

  const cancelNote = () => {
    setShowNoteModal(false);
    setNoteModalStudentId(null);
    setNoteInput('');
  };

  const handlePhoneClick = (studentId, currentVal) => {
    if (!currentVal) {
      // Trying to check/give penalty -> Trigger Confirmation Dialog
      setPendingPenaltyIndex(studentId);
      setShowConfirmModal(true);
    } else {
      // Remove penalty directly
      updateStudentData(studentId, 'phoneGame', false);
    }
  };

  const confirmPhonePenalty = () => {
    if (pendingPenaltyIndex !== null) {
      updateStudentData(pendingPenaltyIndex, 'phoneGame', true);
      setPendingPenaltyIndex(null);
    }
    setShowConfirmModal(false);
  };

  const cancelPhonePenalty = () => {
    setPendingPenaltyIndex(null);
    setShowConfirmModal(false);
  };

  const handleSave = () => {
    setLoading(true);
    setSaveSuccess(false);
    setErrorMessage('');

    const records = Object.keys(journalData).map(studentId => ({
      studentId: parseInt(studentId),
      attendanceStatus: journalData[studentId].attendanceStatus,
      attendanceNote: journalData[studentId].attendanceNote || null,
      homeworkStatus: journalData[studentId].homeworkStatus,
      projectCount: journalData[studentId].projectCount,
      questionAnswer: journalData[studentId].questionAnswer,
      activity: journalData[studentId].activity,
      phoneGame: journalData[studentId].phoneGame
    }));

    axios.post('/api/lessons/save', {
      groupId: selectedGroup,
      date: lessonDate,
      records: records
    })
      .then(res => {
        setSaveSuccess(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      })
      .catch(err => {
        console.error("Save journal error", err);
        setErrorMessage("Jurnalni saqlashda xatolik yuz berdi. Iltimos qayta urinib ko'ring.");
      })
      .finally(() => setLoading(false));
  };

  return (
    <div className="p-6 space-y-6 overflow-y-auto max-h-[calc(100vh-4rem)] relative">
      {/* Page Title */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-2">
          <BookOpen className="text-indigo-500" />
          Elektron Dars Jurnali
        </h1>
        <p className="text-sm text-slate-400 mt-1">Dars davomati va o'quvchilarga ball berish nazorati</p>
      </div>

      {/* Select Group & Date Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
        <div>
          <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wide">GURUHNI TANLANG</label>
          {groupsLoading ? (
            <div className="h-10 bg-slate-800/40 rounded-lg animate-pulse"></div>
          ) : (
            <CustomSelect
              value={selectedGroup}
              onChange={setSelectedGroup}
              options={groups.map(g => ({ value: g.id, label: g.name }))}
              placeholder="Guruhni tanlang"
              className="w-full"
            />
          )}
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wide">DARS SANASI</label>
          <div className="relative">
            <input
              type="date"
              value={lessonDate}
              onChange={(e) => setLessonDate(e.target.value)}
              className="w-full h-10 pl-10 pr-3 bg-slate-850 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-indigo-500 text-sm font-semibold cursor-pointer"
            />
            <Calendar size={16} className="absolute left-3 top-3 text-slate-400 pointer-events-none" />
          </div>
        </div>

        <div className="flex items-center gap-2 text-slate-400 text-xs">
          <Users size={16} className="text-indigo-400" />
          <span className="font-semibold text-slate-300">{students.length} nafar faol o'quvchi</span>
        </div>
      </div>

      {/* Status Notifications */}
      {saveSuccess && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center gap-3 text-emerald-400">
          <CheckCircle2 size={20} />
          <span className="font-semibold text-sm">Dars jurnali muvaffaqiyatli saqlandi, ballar hisoblandi va leaderboard yangilandi!</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-center gap-3 text-rose-400">
          <AlertTriangle size={20} />
          <span className="font-semibold text-sm">{errorMessage}</span>
        </div>
      )}

      {/* Main Journal Table Grid */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
        {loading ? (
          <div className="p-20 text-center text-slate-500">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-indigo-500 mx-auto mb-2"></div>
            Yuklanmoqda...
          </div>
        ) : students.length === 0 ? (
          <div className="p-20 text-center text-slate-500 font-semibold text-sm">
            Guruhda faol o'quvchilar mavjud emas.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/50 text-[10px] font-bold text-slate-400 tracking-wider uppercase">
                  <th className="py-4 px-6">O'QUVCHI</th>
                  <th className="py-4 px-4 text-center">DAVOMAT</th>
                  <th className="py-4 px-4 text-center">UYGA VAZIFA</th>
                  <th className="py-4 px-4 text-center">LOYIHA (x15)</th>
                  <th className="py-4 px-4 text-center">SAVOL-JAVOB (+7)</th>
                  <th className="py-4 px-4 text-center">AKTIVLIK (+5)</th>
                  <th className="py-4 px-4 text-center">TELEFON/O'YIN (-25)</th>
                  <th className="py-4 px-6 text-center">BUGUNGI BALL</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {students.map((student) => {
                  const data = journalData[student.id] || {};
                  const isPresent = data.attendanceStatus === 'KELDI';

                  return (
                    <tr key={student.id} className="hover:bg-slate-850/30 transition-all duration-150 text-sm">
                      {/* Name */}
                      <td className="py-4 px-6 font-semibold text-slate-200">
                        {student.fullName}
                      </td>

                      {/* Attendance */}
                      <td className="py-4 px-4">
                        <div className="flex flex-col items-center gap-1">
                          <div className="flex items-center justify-center bg-slate-950/40 rounded-lg p-0.5 border border-slate-800 max-w-[210px] mx-auto">
                            <button
                              onClick={() => handleAttendanceClick(student.id, 'KELDI')}
                              className={`px-3 py-1 rounded text-xs font-bold transition-all cursor-pointer ${
                                data.attendanceStatus === 'KELDI'
                                  ? 'bg-emerald-500 text-white shadow'
                                  : 'text-slate-500 hover:text-slate-300'
                              }`}
                            >
                              Keldi
                            </button>
                            <button
                              onClick={() => handleAttendanceClick(student.id, 'SABABLI')}
                              className={`px-3 py-1 rounded text-xs font-bold transition-all cursor-pointer ${
                                data.attendanceStatus === 'SABABLI'
                                  ? 'bg-amber-500 text-white shadow'
                                  : 'text-slate-500 hover:text-slate-300'
                              }`}
                            >
                              Sababli
                            </button>
                            <button
                              onClick={() => handleAttendanceClick(student.id, 'SABABSIZ')}
                              className={`px-3 py-1 rounded text-xs font-bold transition-all cursor-pointer ${
                                data.attendanceStatus === 'SABABSIZ'
                                  ? 'bg-rose-500 text-white shadow'
                                  : 'text-slate-500 hover:text-slate-300'
                              }`}
                            >
                              Kelmagan
                            </button>
                          </div>
                          {/* Show note badge if SABABLI has a note */}
                          {data.attendanceStatus === 'SABABLI' && data.attendanceNote && (
                            <span
                              title={data.attendanceNote}
                              onClick={() => handleAttendanceClick(student.id, 'SABABLI')}
                              className="text-[10px] text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full cursor-pointer max-w-[200px] truncate"
                            >
                              📝 {data.attendanceNote}
                            </span>
                          )}
                          {data.attendanceStatus === 'SABABLI' && !data.attendanceNote && (
                            <span
                              onClick={() => handleAttendanceClick(student.id, 'SABABLI')}
                              className="text-[10px] text-amber-500/70 cursor-pointer hover:text-amber-400"
                            >
                              + Izoh qo'shish
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Homework */}
                      <td className="py-4 px-4 text-center">
                        <div className="flex items-center justify-center bg-slate-950/40 rounded-lg p-0.5 border border-slate-800 w-[195px] mx-auto">
                          <button
                            disabled={!isPresent}
                            onClick={() => updateStudentData(student.id, 'homeworkStatus', 'BAJARDI')}
                            className={`flex-1 py-1 rounded text-xs font-bold transition-all ${
                              data.homeworkStatus === 'BAJARDI'
                                ? 'bg-indigo-600 text-white shadow'
                                : 'text-slate-600'
                            } ${isPresent ? 'cursor-pointer hover:text-slate-300' : 'opacity-40 cursor-not-allowed'}`}
                          >
                            Bajardi
                          </button>
                          <button
                            disabled={!isPresent}
                            onClick={() => updateStudentData(student.id, 'homeworkStatus', 'BAJARMADI')}
                            className={`flex-1 py-1 rounded text-xs font-bold transition-all ${
                              data.homeworkStatus === 'BAJARMADI'
                                ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20 shadow'
                                : 'text-slate-600'
                            } ${isPresent ? 'cursor-pointer hover:text-rose-300' : 'opacity-40 cursor-not-allowed'}`}
                          >
                            Qilmadi
                          </button>
                          <button
                            disabled={!isPresent}
                            onClick={() => updateStudentData(student.id, 'homeworkStatus', 'BERILMAGAN')}
                            className={`flex-1 py-1 rounded text-xs font-bold transition-all ${
                              data.homeworkStatus === 'BERILMAGAN'
                                ? 'bg-slate-600 text-slate-200 shadow'
                                : 'text-slate-600'
                            } ${isPresent ? 'cursor-pointer hover:text-slate-400' : 'opacity-40 cursor-not-allowed'}`}
                          >
                            Yo'q
                          </button>
                        </div>
                      </td>

                      {/* Project count counter */}
                      <td className="py-4 px-4">
                        <div className="flex items-center justify-center gap-3">
                          <button
                            disabled={!isPresent || data.projectCount <= 0}
                            onClick={() => updateStudentData(student.id, 'projectCount', data.projectCount - 1)}
                            className={`w-7 h-7 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 ${
                              isPresent && data.projectCount > 0 ? 'cursor-pointer hover:bg-slate-700 hover:text-white' : 'opacity-40 cursor-not-allowed'
                            }`}
                          >
                            <Minus size={14} />
                          </button>
                          <span className={`w-6 text-center font-extrabold text-sm ${isPresent ? 'text-slate-200' : 'text-slate-600'}`}>
                            {data.projectCount}
                          </span>
                          <button
                            disabled={!isPresent}
                            onClick={() => updateStudentData(student.id, 'projectCount', data.projectCount + 1)}
                            className={`w-7 h-7 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 ${
                              isPresent ? 'cursor-pointer hover:bg-slate-700 hover:text-white' : 'opacity-40 cursor-not-allowed'
                            }`}
                          >
                            <Plus size={14} />
                          </button>
                        </div>
                      </td>

                      {/* Q&A */}
                      <td className="py-4 px-4 text-center">
                        <button
                          disabled={!isPresent}
                          onClick={() => updateStudentData(student.id, 'questionAnswer', !data.questionAnswer)}
                          className={`w-8 h-8 rounded-lg border flex items-center justify-center mx-auto transition-all ${
                            data.questionAnswer 
                              ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-500/20' 
                              : 'border-slate-800 text-slate-600'
                          } ${isPresent ? 'cursor-pointer hover:border-slate-600' : 'opacity-45 cursor-not-allowed'}`}
                        >
                          <Check size={16} />
                        </button>
                      </td>

                      {/* Activity */}
                      <td className="py-4 px-4 text-center">
                        <button
                          disabled={!isPresent}
                          onClick={() => updateStudentData(student.id, 'activity', !data.activity)}
                          className={`w-8 h-8 rounded-lg border flex items-center justify-center mx-auto transition-all ${
                            data.activity 
                              ? 'bg-purple-600 border-purple-500 text-white shadow-lg shadow-purple-500/20' 
                              : 'border-slate-800 text-slate-600'
                          } ${isPresent ? 'cursor-pointer hover:border-slate-600' : 'opacity-45 cursor-not-allowed'}`}
                        >
                          <Check size={16} />
                        </button>
                      </td>

                      {/* Phone penalty */}
                      <td className="py-4 px-4 text-center">
                        <button
                          onClick={() => handlePhoneClick(student.id, data.phoneGame)}
                          className={`w-8 h-8 rounded-lg border flex items-center justify-center mx-auto transition-all cursor-pointer ${
                            data.phoneGame 
                              ? 'bg-rose-600 border-rose-500 text-white shadow-lg shadow-rose-500/20' 
                              : 'border-slate-850 hover:border-slate-700 text-slate-700 hover:text-rose-400'
                          }`}
                        >
                          <X size={16} />
                        </button>
                      </td>

                      {/* Live Calculated Points */}
                      <td className="py-4 px-6 text-center">
                        <span className={`inline-block font-extrabold text-sm px-3 py-1.5 rounded-xl border ${
                          data.calculatedPoints >= 0 
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                            : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                        }`}>
                          {data.calculatedPoints >= 0 ? `+${data.calculatedPoints}` : data.calculatedPoints} XP
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Save Button */}
      {!loading && students.length > 0 && (
        <div className="flex justify-end mt-4">
          <button
            onClick={handleSave}
            className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold shadow-lg shadow-indigo-600/20 hover:scale-[1.02] transition-all cursor-pointer"
          >
            <Save size={18} />
            HAMMASINI SAQLASH
          </button>
        </div>
      )}

      {/* Confirmation Modal for Phone Penalty */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl relative">
            <div className="w-12 h-12 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 mb-4 mx-auto">
              <AlertTriangle size={24} />
            </div>
            
            <h3 className="text-lg font-bold text-white text-center">Jarima qo'llash</h3>
            <p className="text-slate-400 text-sm text-center mt-2 leading-relaxed">
              Ushbu o‘quvchiga telefon yoki o‘yin sababli -25 ball jarima bermoqchimisiz?
            </p>

            <div className="grid grid-cols-2 gap-4 mt-6">
              <button
                onClick={cancelPhonePenalty}
                className="w-full py-2.5 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-300 font-semibold border border-slate-700/50 cursor-pointer"
              >
                BEKOR QILISH
              </button>
              <button
                onClick={confirmPhonePenalty}
                className="w-full py-2.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-semibold shadow-lg shadow-rose-600/25 cursor-pointer"
              >
                JARIMA BERISH
              </button>
            </div>
          </div>
        </div>
      )}
      {/* SABABLI Note Modal */}
      {showNoteModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <div className="w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mb-4 mx-auto">
              <AlertTriangle size={24} />
            </div>
            <h3 className="text-lg font-bold text-white text-center">Sababli kelmagan</h3>
            <p className="text-slate-400 text-sm text-center mt-1 mb-4">
              Iltimos, sababli kelmagan sababini kiriting (ixtiyoriy)
            </p>
            <textarea
              value={noteInput}
              onChange={e => setNoteInput(e.target.value)}
              placeholder="Masalan: kasalligi sababli, oilaviy holat..."
              rows={3}
              className="w-full px-4 py-3 bg-slate-950/60 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-amber-500 text-sm resize-none"
            />
            <div className="grid grid-cols-2 gap-4 mt-4">
              <button
                onClick={cancelNote}
                className="w-full py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold border border-slate-700/50 cursor-pointer"
              >
                BEKOR QILISH
              </button>
              <button
                onClick={confirmNote}
                className="w-full py-2.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-semibold shadow-lg shadow-amber-600/25 cursor-pointer"
              >
                SAQLASH
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
