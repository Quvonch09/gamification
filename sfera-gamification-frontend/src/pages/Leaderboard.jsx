import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Trophy, 
  Search, 
  Filter, 
  Crown,
  Medal,
  ChevronRight,
  TrendingUp,
  ChevronDown
} from 'lucide-react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import CustomSelect from '../components/CustomSelect';

export default function Leaderboard({ setCurrentPage, setSelectedStudentId, refreshTrigger }) {
  const { user } = useAuth();
  const isStudent = user?.role === 'STUDENT';
  const [leaderboard, setLeaderboard] = useState([]);
  const { groups, courses, mentors } = useData();

  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGroup, setSelectedGroup] = useState(() => {
    // For students, default to their group
    return user?.groupId ? String(user.groupId) : '';
  });
  const [selectedCourse, setSelectedCourse] = useState('');
  const [selectedMentor, setSelectedMentor] = useState('');
  const [loading, setLoading] = useState(true);

  // When user object is loaded (async), update groupId for student
  useEffect(() => {
    if (isStudent && user?.groupId && !selectedGroup) {
      setSelectedGroup(String(user.groupId));
    }
  }, [user?.groupId]);

  useEffect(() => {
    fetchLeaderboard();
  }, [selectedGroup, selectedCourse, selectedMentor, refreshTrigger]);

  const fetchLeaderboard = () => {
    setLoading(true);
    let params = {};
    if (selectedGroup) params.groupId = selectedGroup;
    if (selectedCourse) params.courseId = selectedCourse;
    if (selectedMentor) params.mentorId = selectedMentor;

    axios.get('/api/students/leaderboard', { params })
      .then(res => {
        setLeaderboard(res.data);
      })
      .catch(err => console.error("Leaderboard load error", err))
      .finally(() => setLoading(false));
  };

  // Local search filter
  const filteredLeaderboard = leaderboard.filter(item => 
    item.fullName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const top3 = filteredLeaderboard.slice(0, 3);
  const remaining = filteredLeaderboard.slice(3);

  // Rearrange top 3 for visual podium: [2nd, 1st, 3rd]
  const podium = [];
  if (top3[1]) podium.push({ ...top3[1], place: 2 });
  if (top3[0]) podium.push({ ...top3[0], place: 1 });
  if (top3[2]) podium.push({ ...top3[2], place: 3 });

  const viewProfile = (id) => {
    setSelectedStudentId(id);
    setCurrentPage('profile');
  };

  return (
    <div className="p-6 space-y-8 overflow-y-auto max-h-[calc(100vh-4rem)]">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-2">
          <Trophy className="text-amber-400" />
          {isStudent ? "Guruh Reytingi" : "Leaderboard"}
        </h1>
        <p className="text-sm text-slate-400 mt-1 font-medium">
          {isStudent
            ? `${user?.groupName || 'Guruh'} bo'yicha reyting`
            : "Barcha o'quvchilar umumiy reytingi va ballari"
          }
        </p>
      </div>

      {/* Filter and Search Bar — hidden for students */}
      {!isStudent && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col lg:flex-row gap-4 items-stretch lg:items-center">
          {/* Search */}
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="O'quvchini ismi orqali qidirish..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-10 pl-10 pr-4 bg-slate-850 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-indigo-500 text-sm font-semibold"
            />
            <Search size={16} className="absolute left-3.5 top-3 text-slate-400" />
          </div>

          {/* Dropdown Filters */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 flex-1 lg:flex-none">
            {/* Group */}
            <CustomSelect
              value={selectedGroup}
              onChange={(val) => {
                setSelectedGroup(val);
                setSelectedCourse('');
                setSelectedMentor('');
              }}
              options={groups.map(g => ({ value: g.id, label: g.name }))}
              placeholder="Barcha guruhlar"
              className="w-full sm:w-44"
            />

            {/* Course */}
            <CustomSelect
              value={selectedCourse}
              onChange={(val) => {
                setSelectedCourse(val);
                setSelectedGroup('');
                setSelectedMentor('');
              }}
              options={courses.map(c => ({ value: c.id, label: c.name }))}
              placeholder="Barcha kurslar"
              className="w-full sm:w-44"
            />

            {/* Mentor */}
            <CustomSelect
              value={selectedMentor}
              onChange={(val) => {
                setSelectedMentor(val);
                setSelectedGroup('');
                setSelectedCourse('');
              }}
              options={mentors.map(m => ({ value: m.id, label: m.fullName }))}
              placeholder="Barcha mentorlar"
              className="w-full sm:w-44"
            />
          </div>
        </div>
      )}

      {/* Student search bar only */}
      {isStudent && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Guruhda ismi orqali qidirish..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-10 pl-10 pr-4 bg-slate-850 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-indigo-500 text-sm font-semibold"
            />
            <Search size={16} className="absolute left-3.5 top-3 text-slate-400" />
          </div>
        </div>
      )}

      {/* Podium for TOP 3 */}
      {!loading && podium.length > 0 && (
        <div className="flex flex-col md:flex-row items-end justify-center gap-6 pt-10 pb-4 max-w-4xl mx-auto">
          {podium.map((student) => {
            const isFirst = student.place === 1;
            const isSecond = student.place === 2;
            const isThird = student.place === 3;

            return (
              <div 
                key={student.id}
                onClick={() => viewProfile(student.id)}
                className={`w-full md:w-64 bg-slate-900 border rounded-2xl p-6 flex flex-col items-center justify-between cursor-pointer hover:scale-[1.03] transition-all duration-200 shadow-xl ${
                  isFirst ? 'border-amber-400/50 order-1 md:order-2 h-76 md:-translate-y-6 shadow-amber-500/5' :
                  isSecond ? 'border-slate-300/40 order-2 md:order-1 h-64 shadow-slate-500/5' :
                  'border-orange-500/30 order-3 md:order-3 h-58 shadow-orange-500/5'
                }`}
              >
                {/* Crown / Trophy Icon */}
                <div className="flex flex-col items-center space-y-2">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center border ${
                    isFirst ? 'bg-amber-400/10 border-amber-400/20 text-amber-400' :
                    isSecond ? 'bg-slate-300/10 border-slate-300/20 text-slate-300' :
                    'bg-orange-500/10 border-orange-500/20 text-orange-400'
                  }`}>
                    {isFirst ? <Crown size={24} /> : <Medal size={20} />}
                  </div>
                  
                  <span className={`text-[10px] uppercase font-black tracking-wider px-2 py-0.5 rounded ${
                    isFirst ? 'bg-amber-400/15 text-amber-400 border border-amber-400/20' :
                    isSecond ? 'bg-slate-300/10 text-slate-300 border border-slate-300/10' :
                    'bg-orange-500/10 text-orange-400 border border-orange-500/10'
                  }`}>
                    {isFirst ? 'Champion' : isSecond ? 'Second Place' : 'Third Place'}
                  </span>
                </div>

                {/* Info */}
                <div className="text-center mt-4">
                  <h3 className="font-extrabold text-slate-100 text-base">{student.fullName}</h3>
                  <p className="text-[10px] text-slate-500 font-bold uppercase mt-1">{student.groupName}</p>
                </div>

                {/* Score */}
                <div className="mt-4 pt-3 border-t border-slate-800/80 w-full flex items-center justify-center">
                  <span className={`text-base font-black ${
                    isFirst ? 'text-amber-400' : isSecond ? 'text-slate-300' : 'text-orange-400'
                  }`}>
                    {student.xp} XP
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Main Standings Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
        {loading ? (
          <div className="p-20 text-center text-slate-500">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-indigo-500 mx-auto mb-2"></div>
            Yuklanmoqda...
          </div>
        ) : filteredLeaderboard.length === 0 ? (
          <div className="p-20 text-center text-slate-500 font-semibold text-sm">
            Natijalar topilmadi.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/50 text-[10px] font-bold text-slate-400 tracking-wider uppercase">
                  <th className="py-4 px-6 w-20 text-center">RANK</th>
                  <th className="py-4 px-6">O'QUVCHI</th>
                  <th className="py-4 px-6">GURUH</th>
                  <th className="py-4 px-6 text-center">JAMI XP</th>
                  <th className="py-4 px-6 text-center">PROFIL</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredLeaderboard.map((student) => (
                  <tr 
                    key={student.id} 
                    className="hover:bg-slate-850/30 transition-all duration-150 text-sm cursor-pointer group"
                    onClick={() => viewProfile(student.id)}
                  >
                    {/* Rank */}
                    <td className="py-4 px-6 text-center">
                      <span className={`inline-flex w-7 h-7 rounded-full items-center justify-center font-black text-xs ${
                        student.rank === 1 ? 'bg-amber-400/10 text-amber-400 border border-amber-400/20' :
                        student.rank === 2 ? 'bg-slate-300/10 text-slate-300 border border-slate-300/20' :
                        student.rank === 3 ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20' :
                        'bg-slate-850 text-slate-400 border border-slate-800/50'
                      }`}>
                        {student.rank}
                      </span>
                    </td>

                    {/* Name */}
                    <td className="py-4 px-6 font-bold text-slate-200 group-hover:text-indigo-400 transition-colors">
                      {student.fullName}
                    </td>

                    {/* Group */}
                    <td className="py-4 px-6 text-slate-400 font-semibold uppercase text-xs">
                      {student.groupName}
                    </td>

                    {/* Total XP */}
                    <td className="py-4 px-6 text-center">
                      <span className="font-extrabold text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-1 rounded-lg text-xs">
                        {student.xp} XP
                      </span>
                    </td>

                    {/* Arrow profile detail link icon */}
                    <td className="py-4 px-6 text-center">
                      <div className="inline-flex w-8 h-8 rounded-lg bg-slate-800 border border-slate-700/50 items-center justify-center text-slate-400 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                        <ChevronRight size={14} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
