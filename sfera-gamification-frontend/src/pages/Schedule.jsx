import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { 
  CalendarDays, 
  Clock, 
  DoorOpen, 
  User, 
  Users, 
  Palette, 
  Search, 
  Printer, 
  Plus, 
  Edit3, 
  Save, 
  X, 
  Check, 
  Sparkles, 
  Filter, 
  RefreshCw, 
  Layers, 
  SlidersHorizontal,
  Info
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import CustomSelect from '../components/CustomSelect';

const COLOR_PRESETS = [
  { name: "Yashil (Emerald)", hex: "#16a34a" },
  { name: "Moviy (Blue)", hex: "#2563eb" },
  { name: "Qizil (Red)", hex: "#dc2626" },
  { name: "Sariq/Oltin (Amber)", hex: "#d97706" },
  { name: "Binafsha (Purple)", hex: "#9333ea" },
  { name: "Zangori (Teal)", hex: "#0d9488" },
  { name: "Pushti (Rose)", hex: "#e11d48" },
  { name: "Indigo", hex: "#4f46e5" },
  { name: "Cyan", hex: "#0891b2" },
  { name: "To'q sariq (Orange)", hex: "#ea580c" },
  { name: "Kulrang (Slate)", hex: "#475569" },
];

export default function Schedule({ refreshTrigger, setCurrentPage }) {
  const { user } = useAuth();
  const isSuperAdmin = user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN';

  const [groups, setGroups] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [mentors, setMentors] = useState([]);
  const [loading, setLoading] = useState(true);

  // Tab State: 'JUFT' | 'TOQ' | 'BOSHQA'
  const [activeTab, setActiveTab] = useState('JUFT'); // Default to Juft kunlar
  // Time Slot Interval: 30 | 60 | 15 (minutes)
  const [slotInterval, setSlotInterval] = useState(30);
  // Filters
  const [selectedMentor, setSelectedMentor] = useState('');
  const [selectedRoom, setSelectedRoom] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Mentor Colors Customization Modal
  const [showColorModal, setShowColorModal] = useState(false);
  const [mentorColors, setMentorColors] = useState({});
  const [savingColorId, setSavingColorId] = useState(null);
  const [colorSuccessMsg, setColorSuccessMsg] = useState('');

  // Selected Group Details Modal
  const [selectedGroupModal, setSelectedGroupModal] = useState(null);

  useEffect(() => {
    loadData();
  }, [refreshTrigger]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [groupsRes, roomsRes, mentorsRes] = await Promise.all([
        axios.get('/api/groups'),
        axios.get('/api/rooms').catch(() => ({ data: [] })),
        axios.get('/api/mentors').catch(() => ({ data: [] }))
      ]);

      let groupData = groupsRes.data || [];
      const roomData = roomsRes.data || [];
      const mentorData = mentorsRes.data || [];

      // If current user is a MENTOR, only show their own groups
      if (user?.role === 'MENTOR') {
        groupData = groupData.filter(g =>
          g.mentorName === user.fullName ||
          (g.mentorId && mentorData.find(m => m.id === g.mentorId && m.userId === user.id))
        );
      }

      setGroups(groupData);
      setRooms(roomData);
      setMentors(mentorData);

      // Initialize mentor colors map
      const colorMap = {};
      mentorData.forEach((m, idx) => {
        colorMap[m.id] = m.color || COLOR_PRESETS[idx % COLOR_PRESETS.length].hex;
      });
      setMentorColors(colorMap);
    } catch (err) {
      console.error("Error loading schedule data", err);
    } finally {
      setLoading(false);
    }
  };

  // Helper: Normalize time string to "HH:mm"
  const normalizeTime = (t) => {
    if (!t) return '10:00';
    const parts = t.split(':');
    const h = parts[0].padStart(2, '0');
    const m = (parts[1] || '00').padStart(2, '0');
    return `${h}:${m}`;
  };

  // Convert time string "HH:mm" to total minutes from 00:00
  const timeToMinutes = (timeStr) => {
    if (!timeStr) return 0;
    const parts = timeStr.split(':');
    return parseInt(parts[0], 10) * 60 + parseInt(parts[1] || '0', 10);
  };

  // Generate Time Slots from 08:00 to 20:00
  const timeSlots = useMemo(() => {
    const slots = [];
    const startHour = 8;
    const endHour = 20; // up to 20:00

    for (let hour = startHour; hour <= endHour; hour++) {
      for (let min = 0; min < 60; min += slotInterval) {
        if (hour === endHour && min > 0) break; // Stop at 20:00
        const hStr = hour.toString().padStart(2, '0');
        const mStr = min.toString().padStart(2, '0');
        slots.push(`${hStr}:${mStr}`);
      }
    }
    return slots;
  }, [slotInterval]);

  // Robust Day check: handles Dushanba without false-matching Shanba
  const doesGroupMatchTab = (group) => {
    const days = (group.daysOfWeek || '').toUpperCase().trim();
    if (!days) return true; // If days are not set, show in all tabs so no group is hidden

    const isHarKuni = days === 'HAR_KUNI' || days.includes('HAR KUNI');
    const isDamOlish = days === 'DAM_OLISH' || days.includes('DAM OLISH');

    const isToq = days.includes('DUSHANBA_CHORSHANBA_JUMA') || 
                  days.includes('TOQ') || 
                  days.includes('DU-CHOR-JU') ||
                  days.includes('DU_CHOR_JU') ||
                  (days.includes('DUSHANBA') && !days.includes('SESHANBA') && !days.includes('PAYSHANBA'));

    const isJuft = days.includes('SESHANBA_PAYSHANBA_SHANBA') || 
                   days.includes('JUFT') || 
                   days.includes('SE-PAY-SHAN') ||
                   days.includes('SE_PAY_SHAN') ||
                   days.includes('SESHANBA') || 
                   days.includes('PAYSHANBA');

    if (activeTab === 'JUFT') {
      return isJuft || isHarKuni;
    } else if (activeTab === 'TOQ') {
      return isToq || isHarKuni;
    } else {
      // BOSHQA tab: Dam olish, Har kuni, Maxsus yoki biriktirilmagan
      return isDamOlish || isHarKuni || (!isToq && !isJuft);
    }
  };

  // Filtered Groups based on search, mentor filter, room filter, and tab
  const filteredGroups = useMemo(() => {
    return groups.filter(g => {
      // Tab filter
      if (!doesGroupMatchTab(g)) return false;

      // Mentor filter
      if (selectedMentor && String(g.mentorId) !== String(selectedMentor)) return false;

      // Room filter
      if (selectedRoom && String(g.roomId) !== String(selectedRoom)) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = (g.name || '').toLowerCase().includes(q);
        const matchCourse = (g.courseName || '').toLowerCase().includes(q);
        const matchMentor = (g.mentorName || '').toLowerCase().includes(q);
        const matchRoom = (g.roomName || '').toLowerCase().includes(q);
        if (!matchName && !matchCourse && !matchMentor && !matchRoom) return false;
      }

      return true;
    });
  }, [groups, activeTab, selectedMentor, selectedRoom, searchQuery]);

  // Unique rooms list: DB rooms + any unassigned groups pseudo-room
  const displayRooms = useMemo(() => {
    const list = [...rooms];
    if (list.length === 0) {
      list.push({ id: '__main__', name: "Asosiy zal" });
    }
    // Check if there are groups with no room
    const hasUnassigned = filteredGroups.some(g => !g.roomId && !rooms.some(r => r.name === g.roomName || r.id === g.roomId));
    if (hasUnassigned && !list.some(r => r.id === '__unassigned__')) {
      list.push({ id: '__unassigned__', name: "Xona biriktirilmagan", capacity: '-' });
    }
    return list;
  }, [rooms, filteredGroups]);

  // Handle Mentor Color Change and Persist to Backend
  const handleSaveMentorColor = async (mentorId, color) => {
    setSavingColorId(mentorId);
    setColorSuccessMsg('');
    try {
      await axios.put(`/api/mentors/${mentorId}/color`, { color });
      setMentorColors(prev => ({ ...prev, [mentorId]: color }));
      // Also update local mentors and groups state
      setMentors(prev => prev.map(m => m.id === mentorId ? { ...m, color } : m));
      setGroups(prev => prev.map(g => g.mentorId === mentorId ? { ...g, mentorColor: color } : g));
      setColorSuccessMsg("Mentor rangi muvaffaqiyatli saqlandi!");
      setTimeout(() => setColorSuccessMsg(''), 2500);
    } catch (err) {
      console.error("Error saving mentor color", err);
    } finally {
      setSavingColorId(null);
    }
  };

  const getMentorColor = (mentorId, fallbackColor) => {
    if (mentorId && mentorColors[mentorId]) {
      return mentorColors[mentorId];
    }
    return fallbackColor || "#2563eb";
  };

  // Helper: Find which group occupies a room at a given time slot
  const getGroupStartingAtSlot = (roomId, slotTime) => {
    const slotMinutes = timeToMinutes(slotTime);
    return filteredGroups.find(g => {
      // Room match check
      const isUnassignedRoom = !g.roomId;
      const roomMatch = (roomId === '__unassigned__' || roomId === '__main__')
        ? isUnassignedRoom
        : (String(g.roomId) === String(roomId));

      if (!roomMatch) return false;

      const groupStart = timeToMinutes(normalizeTime(g.startTime));
      return slotMinutes === groupStart;
    });
  };

  // Helper: Check if slot is in the middle of an ongoing group (already spanned)
  const isSlotCoveredByEarlierGroup = (roomId, slotTime) => {
    const slotMinutes = timeToMinutes(slotTime);
    return filteredGroups.some(g => {
      const isUnassignedRoom = !g.roomId;
      const roomMatch = (roomId === '__unassigned__' || roomId === '__main__')
        ? isUnassignedRoom
        : (String(g.roomId) === String(roomId));

      if (!roomMatch) return false;

      const groupStart = timeToMinutes(normalizeTime(g.startTime));
      const groupEnd = timeToMinutes(normalizeTime(g.endTime || '12:00'));

      return slotMinutes > groupStart && slotMinutes < groupEnd;
    });
  };

  // Calculate ColSpan for a group block
  const calculateColSpan = (group) => {
    const start = timeToMinutes(normalizeTime(group.startTime));
    const end = timeToMinutes(normalizeTime(group.endTime || '12:00'));
    const duration = Math.max(end - start, slotInterval);
    const span = Math.ceil(duration / slotInterval);
    return Math.max(span, 1);
  };

  // Tab titles
  const tabs = [
    { id: 'JUFT', label: 'JUFT KUNLAR', sub: 'seshanba • payshanba • shanba' },
    { id: 'TOQ', label: 'TOQ KUNLAR', sub: 'dushanba • chorshanba • juma' },
    { id: 'BOSHQA', label: 'BOSHQA', sub: 'har kuni / dam olish / maxsus' },
  ];

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-[1600px] mx-auto text-slate-100 font-sans pb-24 min-h-screen">
      
      {/* Top Header & Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/90 border border-slate-800 p-5 rounded-2xl shadow-xl backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-br from-indigo-500 to-indigo-700 text-white rounded-xl shadow-lg shadow-indigo-500/25">
            <CalendarDays className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
              Dars Jadvali <span className="text-xs bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 px-2 py-0.5 rounded-full font-medium">Interaktiv Matritsa</span>
            </h1>
            <p className="text-xs md:text-sm text-slate-400">
              Xonalar bandligi, ustozlar rangi va dars soatlari bo'yicha haftalik grafik
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center flex-wrap gap-2.5">
          {/* Mentor Colors Customizer button (Super Admin & Admin) */}
          {isSuperAdmin && (
            <button
              onClick={() => setShowColorModal(true)}
              className="px-3.5 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs md:text-sm font-semibold rounded-xl flex items-center gap-2 shadow-lg shadow-purple-600/20 transition-all active:scale-95 cursor-pointer"
            >
              <Palette className="w-4 h-4" />
              <span>Ranglarni sozlash</span>
            </button>
          )}

          {/* Print Button */}
          <button
            onClick={() => window.print()}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs md:text-sm font-medium rounded-xl flex items-center gap-2 transition-all active:scale-95 shadow-sm cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span className="hidden sm:inline">Chop etish</span>
          </button>

          {/* Refresh Button */}
          <button
            onClick={loadData}
            disabled={loading}
            className="p-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 rounded-xl transition-all active:scale-95 shadow-sm cursor-pointer"
            title="Yangilash"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-indigo-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* Main Schedule Container (Card matching screenshot layout) */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        
        {/* Top Filter and Controls Bar */}
        <div className="p-4 md:px-6 md:py-4 border-b border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-slate-950/40">
          
          {/* Day Category Tabs (JUFT KUNLAR | TOQ KUNLAR | BOSHQA) */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 lg:pb-0 scrollbar-none">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`relative px-5 py-2.5 rounded-xl font-bold text-xs md:text-sm tracking-wider uppercase transition-all duration-200 flex flex-col items-start cursor-pointer ${
                    isActive
                      ? 'bg-indigo-600/25 text-indigo-300 border border-indigo-500/40 shadow-inner'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    {tab.label}
                    {isActive && (
                      <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse"></span>
                    )}
                  </span>
                  <span className="text-[10px] font-normal text-slate-400 lowercase opacity-80 mt-0.5">
                    {tab.sub}
                  </span>
                  {isActive && (
                    <div className="absolute bottom-0 left-3 right-3 h-0.5 bg-gradient-to-r from-indigo-500 to-cyan-400 rounded-full"></div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Right Controls: Slot Interval, Search, Filter */}
          <div className="flex items-center flex-wrap gap-3 self-end lg:self-center">
            
            {/* Time Slot Interval Selector */}
            <div className="flex items-center gap-2 bg-slate-800/80 border border-slate-700/80 px-3 py-1.5 rounded-xl">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-xs text-slate-400 whitespace-nowrap">Vaqt oralig'i:</span>
              <CustomSelect
                value={slotInterval}
                onChange={(val) => setSlotInterval(Number(val))}
                options={[
                  { value: 15, label: "15 Daqiqa" },
                  { value: 30, label: "30 Daqiqa" },
                  { value: 60, label: "60 Daqiqa" }
                ]}
                className="w-28 text-xs font-semibold text-white bg-transparent border-0 focus:ring-0 p-0"
              />
            </div>

            {/* Mentor Filter */}
            <div className="w-40 hidden sm:block">
              <CustomSelect
                value={selectedMentor}
                onChange={setSelectedMentor}
                options={[
                  { value: '', label: "Barcha Ustozlar" },
                  ...mentors.map(m => ({ value: m.id, label: m.fullName }))
                ]}
                placeholder="Ustoz bo'yicha"
              />
            </div>

            {/* Search Input */}
            <div className="relative w-44 md:w-52">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Guruh / Fan qidirish..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* Mentor Color Legend Bar */}
        <div className="px-6 py-2.5 bg-slate-950/60 border-b border-slate-800/80 flex items-center gap-4 overflow-x-auto text-xs scrollbar-none">
          <span className="text-slate-400 font-semibold flex items-center gap-1.5 shrink-0">
            <Palette className="w-3.5 h-3.5 text-indigo-400" /> Ustozlar ranglari:
          </span>
          <div className="flex items-center gap-3">
            {mentors.length === 0 ? (
              <span className="text-slate-400 text-xs italic">Mentorlar mavjud emas</span>
            ) : (
              mentors.map((m) => {
                const color = getMentorColor(m.id, m.color);
                return (
                  <div 
                    key={m.id} 
                    className="flex items-center gap-1.5 shrink-0 bg-slate-800/60 border border-slate-700/60 px-2.5 py-1 rounded-lg hover:border-slate-600 transition-colors"
                  >
                    <span 
                      className="w-3 h-3 rounded-full shadow-sm" 
                      style={{ backgroundColor: color }}
                    ></span>
                    <span className="text-slate-300 font-medium text-xs">{m.fullName}</span>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Schedule Matrix Grid */}
        <div className="overflow-x-auto w-full relative pb-8 custom-scrollbar">
          <table className="w-full border-collapse text-left select-none min-w-[1200px]">
            <thead className="sticky top-0 z-30 shadow-md">
              <tr className="bg-slate-950 text-slate-400 text-xs font-semibold uppercase tracking-wider border-b border-slate-800">
                {/* Left Sticky Column Header */}
                <th className="py-3.5 px-4 sticky left-0 top-0 z-40 bg-slate-950 border-r border-slate-800 w-48 min-w-[180px] shadow-[2px_2px_5px_rgba(0,0,0,0.4)]">
                  <div className="flex items-center gap-1.5 text-slate-300">
                    <DoorOpen className="w-4 h-4 text-indigo-400" />
                    <span>XONALAR / SOAT</span>
                  </div>
                </th>

                {/* Time Slots Columns */}
                {timeSlots.map((slot) => (
                  <th
                    key={slot}
                    className="py-3 px-2 text-center border-r border-slate-800/60 text-[11px] font-mono font-medium text-slate-400 min-w-[70px] bg-slate-950"
                  >
                    {slot}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-800/70 text-xs">
              {displayRooms.map((room) => {
                let skipCols = 0;

                return (
                  <tr key={room.id || room.name} className="hover:bg-slate-800/20 transition-colors">
                    {/* Room Name Column (Sticky Left) */}
                    <td className="py-3.5 px-4 sticky left-0 z-10 bg-slate-900 border-r border-slate-800 font-medium text-slate-200 w-48 min-w-[180px] shadow-[2px_0_5px_rgba(0,0,0,0.3)]">
                      <div className="flex flex-col">
                        <span className="font-bold text-white text-sm tracking-wide flex items-center gap-1.5">
                          {room.name}
                        </span>
                        {room.capacity && room.capacity !== '-' && (
                          <span className="text-[10px] text-slate-400 mt-0.5">
                            Sig'imi: {room.capacity} kishi
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Time Slot Cells */}
                    {timeSlots.map((slot) => {
                      if (skipCols > 0) {
                        skipCols--;
                        return null; // Skip rendering cells that are spanned by a group
                      }

                      // Check if a group starts at this slot in this room
                      const groupStarting = getGroupStartingAtSlot(room.id, slot);

                      if (groupStarting) {
                        const colSpan = calculateColSpan(groupStarting);
                        skipCols = colSpan - 1; // Set skip for next slots

                        const mentorBgColor = getMentorColor(groupStarting.mentorId, groupStarting.mentorColor);

                        return (
                          <td
                            key={slot}
                            colSpan={colSpan}
                            className="p-1 border-r border-slate-800/60 align-middle"
                          >
                            <div
                              onClick={() => setSelectedGroupModal(groupStarting)}
                              style={{ backgroundColor: mentorBgColor }}
                              className="w-full h-full min-h-[62px] rounded-xl px-3 py-2 text-white flex flex-col justify-center shadow-lg transition-all duration-150 transform hover:scale-[1.01] hover:brightness-110 cursor-pointer border border-white/20 select-none"
                            >
                              <div className="font-extrabold text-xs tracking-tight drop-shadow-sm flex items-center justify-between gap-1">
                                <span>
                                  {normalizeTime(groupStarting.startTime)} - {normalizeTime(groupStarting.endTime || '12:00')} / {groupStarting.courseName || groupStarting.name}
                                </span>
                              </div>
                              <div className="text-[11px] font-medium text-white/90 drop-shadow-sm truncate mt-0.5 flex items-center gap-1">
                                <User className="w-3 h-3 shrink-0 opacity-80" />
                                <span>O'qituvchi: {groupStarting.mentorName || 'Belgilanmagan'}</span>
                              </div>
                            </div>
                          </td>
                        );
                      }

                      // If slot is covered by an ongoing group but started earlier (failsafe)
                      if (isSlotCoveredByEarlierGroup(room.id, slot)) {
                        return null;
                      }

                      // Empty slot cell
                      return (
                        <td
                          key={slot}
                          className="p-0 border-r border-slate-800/40 text-center min-w-[70px] h-16 hover:bg-indigo-500/5 transition-colors"
                        >
                          <div className="w-full h-full"></div>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Empty state if no groups found */}
        {filteredGroups.length === 0 && !loading && (
          <div className="py-14 px-4 text-center border-t border-slate-800">
            <div className="w-12 h-12 rounded-full bg-slate-800/80 border border-slate-700 text-slate-400 flex items-center justify-center mx-auto mb-3">
              <CalendarDays className="w-6 h-6" />
            </div>
            <h3 className="text-base font-semibold text-slate-300">Bu kunda darslar rejalashtirilmagan</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
              "{tabs.find(t => t.id === activeTab)?.label}" bo'yicha hech qanday guruh darsi topilmadi yoki filtrlar natijasiz.
            </p>
          </div>
        )}
      </div>

      {/* --- MODAL 1: SUPER ADMIN MENTOR COLOR SETTINGS --- */}
      {showColorModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-500/20 text-purple-400 rounded-xl border border-purple-500/30">
                  <Palette className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Ustozlar Ranglarini Sozlash</h3>
                  <p className="text-xs text-slate-400">Har bir ustoz uchun dars jadvalidagi shaxsiy rangini belgilang</p>
                </div>
              </div>
              <button
                onClick={() => setShowColorModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Success alert message */}
            {colorSuccessMsg && (
              <div className="mx-6 mt-4 p-3 bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs rounded-xl flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{colorSuccessMsg}</span>
              </div>
            )}

            {/* Modal Body: Mentors List with Color pickers */}
            <div className="p-6 space-y-4 max-h-[65vh] overflow-y-auto">
              {mentors.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-sm">
                  Hozircha tizimda mentorlar ro'yxatga olinmagan.
                </div>
              ) : (
                mentors.map((m) => {
                  const currentColor = mentorColors[m.id] || m.color || "#2563eb";
                  const isSaving = savingColorId === m.id;

                  return (
                    <div 
                      key={m.id} 
                      className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-slate-700 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-8 h-8 rounded-xl shadow-md border border-white/20 flex items-center justify-center font-bold text-white text-xs shrink-0"
                          style={{ backgroundColor: currentColor }}
                        >
                          {m.fullName?.charAt(0) || 'M'}
                        </div>
                        <div>
                          <h4 className="font-bold text-sm text-white">{m.fullName}</h4>
                          <span className="text-xs text-slate-400 font-mono">@{m.username}</span>
                        </div>
                      </div>

                      {/* Color Palette Selector */}
                      <div className="flex items-center flex-wrap gap-1.5">
                        {COLOR_PRESETS.map((preset) => {
                          const isSelected = currentColor.toLowerCase() === preset.hex.toLowerCase();
                          return (
                            <button
                              key={preset.hex}
                              onClick={() => handleSaveMentorColor(m.id, preset.hex)}
                              disabled={isSaving}
                              title={preset.name}
                              className={`w-6 h-6 rounded-lg transition-transform active:scale-90 cursor-pointer relative ${
                                isSelected ? 'ring-2 ring-white scale-110' : 'hover:scale-105 opacity-80 hover:opacity-100'
                              }`}
                              style={{ backgroundColor: preset.hex }}
                            >
                              {isSelected && (
                                <Check className="w-3 h-3 text-white absolute inset-0 m-auto" />
                              )}
                            </button>
                          );
                        })}

                        {/* Custom Color Input */}
                        <div className="flex items-center gap-1 ml-1">
                          <input
                            type="color"
                            value={currentColor}
                            onChange={(e) => handleSaveMentorColor(m.id, e.target.value)}
                            disabled={isSaving}
                            className="w-7 h-7 rounded-lg cursor-pointer bg-transparent border-0 p-0"
                            title="Ixtiyoriy rang tanlash"
                          />
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-950/80 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setShowColorModal(false)}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-xl transition-colors shadow-lg shadow-indigo-600/30 cursor-pointer"
              >
                Tayyor (Yopish)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL 2: GROUP DETAILS POPUP --- */}
      {selectedGroupModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
            {/* Header */}
            <div 
              className="p-5 text-white flex items-center justify-between"
              style={{ backgroundColor: getMentorColor(selectedGroupModal.mentorId, selectedGroupModal.mentorColor) }}
            >
              <div>
                <span className="text-xs uppercase tracking-wider font-semibold opacity-80">Guruh ma'lumotlari</span>
                <h3 className="text-xl font-black">{selectedGroupModal.name}</h3>
              </div>
              <button
                onClick={() => setSelectedGroupModal(null)}
                className="p-1.5 rounded-lg bg-black/20 hover:bg-black/40 text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Details */}
            <div className="p-6 space-y-4 text-xs md:text-sm">
              <div className="grid grid-cols-2 gap-3 bg-slate-950 p-4 rounded-xl border border-slate-800">
                <div>
                  <span className="text-slate-400 text-xs">Kurs / Fan:</span>
                  <p className="font-bold text-white text-sm">{selectedGroupModal.courseName || 'Kurs biriktirilmagan'}</p>
                </div>
                <div>
                  <span className="text-slate-400 text-xs">Mentor (Ustoz):</span>
                  <p className="font-bold text-indigo-300 text-sm">{selectedGroupModal.mentorName || 'Mentorsiz'}</p>
                </div>
                <div>
                  <span className="text-slate-400 text-xs">Xona:</span>
                  <p className="font-bold text-white text-sm">{selectedGroupModal.roomName || 'Xona biriktirilmagan'}</p>
                </div>
                <div>
                  <span className="text-slate-400 text-xs">Dars Vaqti:</span>
                  <p className="font-bold text-emerald-400 text-sm">
                    {normalizeTime(selectedGroupModal.startTime)} - {normalizeTime(selectedGroupModal.endTime || '12:00')}
                  </p>
                </div>
                <div>
                  <span className="text-slate-400 text-xs">Dars Kunlari:</span>
                  <p className="font-bold text-slate-200 text-sm">{selectedGroupModal.daysOfWeek || 'Du-Chor-Ju'}</p>
                </div>
                <div>
                  <span className="text-slate-400 text-xs">Oylik darslar soni:</span>
                  <p className="font-bold text-slate-200 text-sm">{selectedGroupModal.lessonsPerMonth || 12} ta dars</p>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 bg-slate-950 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setSelectedGroupModal(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
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
