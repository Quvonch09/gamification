import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  UserCheck, 
  Plus, 
  Search, 
  MessageSquare, 
  Calendar, 
  ArrowRight, 
  ChevronRight, 
  TrendingUp, 
  AlertCircle, 
  Clock, 
  X, 
  Phone, 
  Send, 
  Globe, 
  UserPlus, 
  GripVertical, 
  CheckCircle2, 
  Filter, 
  Sparkles, 
  Award,
  History,
  FileText,
  User
} from 'lucide-react';

export default function Leads({ refreshTrigger, setCurrentPage, setSelectedStudentId }) {
  const [leads, setLeads] = useState([]);
  const [courses, setCourses] = useState([]);
  const [groups, setGroups] = useState([]);
  const [pricePlans, setPricePlans] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCourseFilter, setSelectedCourseFilter] = useState('ALL');
  const [selectedSourceFilter, setSelectedSourceFilter] = useState('ALL');

  // Drag and Drop States
  const [draggingLeadId, setDraggingLeadId] = useState(null);
  const [dragOverStage, setDragOverStage] = useState(null);

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showConvertModal, setShowConvertModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);

  const [selectedLead, setSelectedLead] = useState(null);
  const [leadEvents, setLeadEvents] = useState([]);
  const [newEventDesc, setNewEventDesc] = useState('');

  // Status change modal state (with mandatory note)
  const [statusChangeData, setStatusChangeData] = useState({
    lead: null,
    targetStageKey: '',
    note: ''
  });
  const [statusModalError, setStatusModalError] = useState('');

  // Add form state
  const [addForm, setAddForm] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    source: 'Telegram',
    courseId: '',
    notes: ''
  });

  // Convert form state
  const [convertForm, setConvertForm] = useState({
    groupId: '',
    pricePlanId: ''
  });

  const [formError, setFormError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, [refreshTrigger]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [leadsRes, coursesRes, groupsRes, plansRes] = await Promise.all([
        axios.get('/api/leads').catch(() => ({ data: [] })),
        axios.get('/api/courses').catch(() => ({ data: [] })),
        axios.get('/api/groups').catch(() => ({ data: [] })),
        axios.get('/api/finance/price-plans').catch(() => ({ data: [] }))
      ]);
      setLeads(leadsRes.data || []);
      setCourses(coursesRes.data || []);
      setGroups((groupsRes.data || []).filter(g => g.status === 'ACTIVE'));
      setPricePlans(plansRes.data || []);
    } catch (err) {
      console.error("Error loading leads data", err);
    } finally {
      setLoading(false);
    }
  };

  const stages = [
    { 
      key: 'NEW', 
      name: 'Yangi Leadlar', 
      badgeColor: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
      headerBg: 'from-blue-600/20 to-transparent border-blue-500/30',
      dotColor: 'bg-blue-400' 
    },
    { 
      key: 'CONTACTED', 
      name: 'Aloqaga Chiqildi', 
      badgeColor: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
      headerBg: 'from-yellow-600/20 to-transparent border-yellow-500/30',
      dotColor: 'bg-yellow-400' 
    },
    { 
      key: 'TRIAL_SCHEDULED', 
      name: 'Sinov Belgilandi', 
      badgeColor: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
      headerBg: 'from-purple-600/20 to-transparent border-purple-500/30',
      dotColor: 'bg-purple-400' 
    },
    { 
      key: 'TRIAL_ATTENDED', 
      name: 'Sinovga Keldi', 
      badgeColor: 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30',
      headerBg: 'from-indigo-600/20 to-transparent border-indigo-500/30',
      dotColor: 'bg-indigo-400' 
    },
    { 
      key: 'CONVERTED', 
      name: 'O\'quvchi Bo\'ldi', 
      badgeColor: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
      headerBg: 'from-emerald-600/20 to-transparent border-emerald-500/30',
      dotColor: 'bg-emerald-400' 
    },
    { 
      key: 'LOST', 
      name: 'Rad Etildi / Lost', 
      badgeColor: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
      headerBg: 'from-rose-600/20 to-transparent border-rose-500/30',
      dotColor: 'bg-rose-400' 
    }
  ];

  // Drag and Drop Handlers
  const handleDragStart = (e, lead) => {
    e.dataTransfer.setData('text/plain', lead.id.toString());
    e.dataTransfer.effectAllowed = 'move';
    setDraggingLeadId(lead.id);
  };

  const handleDragEnd = () => {
    setDraggingLeadId(null);
    setDragOverStage(null);
  };

  const handleDragOver = (e, stageKey) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverStage !== stageKey) {
      setDragOverStage(stageKey);
    }
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
  };

  // When lead is dropped on a new stage -> Trigger Mandatory Note Modal!
  const handleDrop = (e, targetStageKey) => {
    e.preventDefault();
    const leadIdStr = e.dataTransfer.getData('text/plain') || draggingLeadId;
    setDragOverStage(null);
    setDraggingLeadId(null);

    if (!leadIdStr) return;
    const leadId = parseInt(leadIdStr);
    const targetLead = leads.find(l => l.id === leadId);

    if (!targetLead || targetLead.status === targetStageKey) return;

    // Open mandatory status change modal
    setStatusChangeData({
      lead: targetLead,
      targetStageKey: targetStageKey,
      note: ''
    });
    setStatusModalError('');
    setShowStatusModal(true);
  };

  // Trigger status change modal from details modal
  const handleInitiateStatusChange = (lead, targetStageKey) => {
    if (lead.status === targetStageKey) return;
    setStatusChangeData({
      lead: lead,
      targetStageKey: targetStageKey,
      note: ''
    });
    setStatusModalError('');
    setShowStatusModal(true);
  };

  // Submit mandatory status change note
  const handleStatusModalSubmit = async (e) => {
    e.preventDefault();
    if (!statusChangeData.note.trim()) {
      setStatusModalError("Iltimos, statusni o'zgartirish sababi yoki izohini yozing (majburiy)!");
      return;
    }

    setActionLoading(true);
    try {
      const { lead, targetStageKey, note } = statusChangeData;
      const res = await axios.put(`/api/leads/${lead.id}/status`, {
        status: targetStageKey,
        note: note.trim()
      });

      // Update in leads list
      setLeads(prev => prev.map(l => l.id === lead.id ? { ...l, status: targetStageKey } : l));

      // If details modal is open, reload events & selected lead
      if (selectedLead && selectedLead.id === lead.id) {
        const [eventsRes, leadRes] = await Promise.all([
          axios.get(`/api/leads/${lead.id}/events`),
          axios.get(`/api/leads/${lead.id}`)
        ]);
        setLeadEvents(eventsRes.data);
        setSelectedLead(leadRes.data);
      }

      setShowStatusModal(false);
      setStatusChangeData({ lead: null, targetStageKey: '', note: '' });
    } catch (err) {
      setStatusModalError(err.response?.data || "Statusni yangilashda xatolik yuz berdi.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setActionLoading(true);
    try {
      const payload = {
        firstName: addForm.firstName,
        lastName: addForm.lastName,
        phone: addForm.phone,
        source: addForm.source,
        notes: addForm.notes,
        status: 'NEW'
      };
      if (addForm.courseId) {
        payload.course = { id: parseInt(addForm.courseId) };
      }
      await axios.post('/api/leads', payload);
      setShowAddModal(false);
      setAddForm({ firstName: '', lastName: '', phone: '', source: 'Telegram', courseId: '', notes: '' });
      loadData();
    } catch (err) {
      setFormError(err.response?.data || "Lead yaratishda xatolik yuz berdi.");
    } finally {
      setActionLoading(false);
    }
  };

  const openConvertModalForLead = (lead, e) => {
    if (e) e.stopPropagation();
    setSelectedLead(lead);
    setConvertForm({
      groupId: '',
      pricePlanId: pricePlans.find(p => p.course.id === lead.course?.id)?.id || (pricePlans[0]?.id || '')
    });
    setShowConvertModal(true);
  };

  const handleConvertSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setActionLoading(true);
    try {
      const res = await axios.post(`/api/leads/${selectedLead.id}/convert`, {
        groupId: convertForm.groupId,
        pricePlanId: convertForm.pricePlanId
      });
      setShowConvertModal(false);
      setShowDetailsModal(false);
      loadData();
      if (setSelectedStudentId && setCurrentPage) {
        setSelectedStudentId(res.data.id);
        setCurrentPage('profile');
      }
    } catch (err) {
      setFormError(err.response?.data || "Studentga aylantirishda xatolik yuz berdi.");
    } finally {
      setActionLoading(false);
    }
  };

  const openDetails = async (lead) => {
    setSelectedLead(lead);
    setShowDetailsModal(true);
    try {
      const res = await axios.get(`/api/leads/${lead.id}/events`);
      setLeadEvents(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddEvent = async (e) => {
    e.preventDefault();
    if (!newEventDesc.trim()) return;
    try {
      await axios.post(`/api/leads/${selectedLead.id}/events`, {
        eventType: 'CALL',
        description: newEventDesc.trim()
      });

      setNewEventDesc('');
      const [eventsRes, leadRes] = await Promise.all([
        axios.get(`/api/leads/${selectedLead.id}/events`),
        axios.get(`/api/leads/${selectedLead.id}`)
      ]);
      setLeadEvents(eventsRes.data);
      setSelectedLead(leadRes.data);
      setLeads(prev => prev.map(l => l.id === leadRes.data.id ? leadRes.data : l));
    } catch (err) {
      console.error(err);
    }
  };

  const getSourceIcon = (source) => {
    switch ((source || '').toLowerCase()) {
      case 'telegram': return <Send size={12} className="text-sky-400" />;
      case 'instagram': return (
        <svg className="w-3 h-3 text-pink-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect width="20" height="20" x="2" y="2" rx="5" ry="5"/>
          <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
          <line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/>
        </svg>
      );
      case 'website': return <Globe size={12} className="text-indigo-400" />;
      case 'phone': return <Phone size={12} className="text-emerald-400" />;
      default: return <UserPlus size={12} className="text-slate-400" />;
    }
  };

  const getInitials = (firstName, lastName) => {
    return ((firstName?.[0] || '') + (lastName?.[0] || '')).toUpperCase() || 'L';
  };

  const filteredLeads = leads.filter(l => {
    const fullName = (l.firstName + ' ' + (l.lastName || '')).toLowerCase();
    const matchesSearch = !searchQuery.trim() || 
      fullName.includes(searchQuery.toLowerCase()) ||
      l.phone?.includes(searchQuery) ||
      l.notes?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCourse = selectedCourseFilter === 'ALL' || l.course?.id === parseInt(selectedCourseFilter);
    const matchesSource = selectedSourceFilter === 'ALL' || l.source === selectedSourceFilter;

    return matchesSearch && matchesCourse && matchesSource;
  });

  const totalLeads = leads.length;
  const convertedCount = leads.filter(l => l.status === 'CONVERTED').length;
  const activePipelineCount = leads.filter(l => !['CONVERTED', 'LOST'].includes(l.status)).length;
  const conversionRate = totalLeads > 0 ? Math.round((convertedCount / totalLeads) * 100) : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full text-slate-400">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-indigo-500 mr-2"></div>
        Leadlar yuklanmoqda...
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 overflow-y-auto max-h-[calc(100vh-4rem)]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2.5">
            <Sparkles className="text-indigo-400" size={24} />
            CRM & Savdo Voronkasi (Kanban)
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">Lidlarni bosqichlar bo'yicha tortib o'tkazing (Drag & Drop) va muloqot izohlarini yozib boring</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center justify-center gap-2 px-4 h-10 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold rounded-xl transition-all shadow-lg shadow-indigo-600/25 cursor-pointer shrink-0"
        >
          <Plus size={16} /> Yangi Lead Qo'shish
        </button>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl flex flex-col justify-between shadow-lg">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Jami Lidlar</span>
          <div className="flex items-baseline justify-between mt-2">
            <h2 className="text-2xl font-black text-slate-100">{totalLeads}</h2>
            <span className="text-xs font-bold text-slate-500">Baza bo'yicha</span>
          </div>
        </div>
        <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl flex flex-col justify-between shadow-lg">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Faol Jarayonda</span>
          <div className="flex items-baseline justify-between mt-2">
            <h2 className="text-2xl font-black text-blue-400">{activePipelineCount}</h2>
            <span className="text-xs font-bold text-blue-400/80">Voronkada</span>
          </div>
        </div>
        <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl flex flex-col justify-between shadow-lg">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">O'quvchi Bo'ldi</span>
          <div className="flex items-baseline justify-between mt-2">
            <h2 className="text-2xl font-black text-emerald-400">{convertedCount}</h2>
            <span className="text-xs font-bold text-emerald-400/80">Muvaffaqiyatli</span>
          </div>
        </div>
        <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl flex flex-col justify-between shadow-lg">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Konversiya</span>
          <div className="flex items-baseline justify-between mt-2">
            <h2 className="text-2xl font-black text-indigo-400">{conversionRate}%</h2>
            <span className="text-xs font-bold text-indigo-400/80">O'rtacha</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
          <input
            type="text"
            placeholder="Ism, telefon yoki izoh orqali qidirish..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-10 pl-10 pr-4 bg-slate-900 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-indigo-500 text-sm font-semibold transition-all placeholder:text-slate-500"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
              <X size={14} />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {/* Course filter select */}
          <select
            value={selectedCourseFilter}
            onChange={(e) => setSelectedCourseFilter(e.target.value)}
            className="h-10 px-3 bg-slate-900 border border-slate-800 rounded-xl text-slate-300 text-xs font-bold focus:outline-none focus:border-indigo-500 cursor-pointer"
          >
            <option value="ALL">Barcha Kurslar</option>
            {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>

          {/* Source filter select */}
          <select
            value={selectedSourceFilter}
            onChange={(e) => setSelectedSourceFilter(e.target.value)}
            className="h-10 px-3 bg-slate-900 border border-slate-800 rounded-xl text-slate-300 text-xs font-bold focus:outline-none focus:border-indigo-500 cursor-pointer"
          >
            <option value="ALL">Barcha Manbalar</option>
            <option value="Telegram">Telegram</option>
            <option value="Instagram">Instagram</option>
            <option value="Website">Website</option>
            <option value="Phone">Qo'ng'iroq (Phone)</option>
            <option value="Walk-in">Tashrif (Walk-in)</option>
          </select>
        </div>
      </div>

      {/* Horizontal Scroll Kanban Board */}
      <div className="relative">
        <div className="flex gap-4 overflow-x-auto pb-6 pt-1 px-1 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
          {stages.map((stage) => {
            const stageLeads = filteredLeads.filter(l => l.status === stage.key);
            const isDropTarget = dragOverStage === stage.key;

            return (
              <div 
                key={stage.key}
                onDragOver={(e) => handleDragOver(e, stage.key)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, stage.key)}
                className={`w-[320px] min-w-[320px] shrink-0 bg-slate-900/80 border rounded-2xl flex flex-col min-h-[560px] transition-all duration-200 ${
                  isDropTarget 
                    ? 'border-indigo-500 bg-indigo-950/20 shadow-xl shadow-indigo-500/10 scale-[1.01]' 
                    : 'border-slate-800/80 hover:border-slate-750'
                }`}
              >
                {/* Stage Header */}
                <div className={`p-3.5 border-b rounded-t-2xl bg-gradient-to-b ${stage.headerBg} flex items-center justify-between`}>
                  <div className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${stage.dotColor} animate-pulse`} />
                    <span className="font-extrabold text-xs text-slate-200 tracking-wide uppercase">{stage.name}</span>
                  </div>
                  <span className={`px-2 py-0.5 rounded-md text-xs font-black border ${stage.badgeColor}`}>
                    {stageLeads.length}
                  </span>
                </div>

                {/* Drop Zone / Cards List */}
                <div className="p-3 flex-1 overflow-y-auto space-y-3 max-h-[620px]">
                  {stageLeads.length === 0 ? (
                    <div className={`h-32 border-2 border-dashed rounded-xl flex flex-col items-center justify-center p-4 text-center transition-all ${
                      isDropTarget ? 'border-indigo-500 bg-indigo-500/10 text-indigo-300' : 'border-slate-800/60 text-slate-600'
                    }`}>
                      <p className="text-xs font-semibold">{isDropTarget ? "Shu yerga tashlang" : "Lidlar yo'q"}</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">Lidni bu yerga tortib olib keling</p>
                    </div>
                  ) : (
                    stageLeads.map((lead) => {
                      const isDragging = draggingLeadId === lead.id;
                      const initials = getInitials(lead.firstName, lead.lastName);

                      return (
                        <div
                          key={lead.id}
                          draggable="true"
                          onDragStart={(e) => handleDragStart(e, lead)}
                          onDragEnd={handleDragEnd}
                          onClick={() => openDetails(lead)}
                          className={`bg-slate-950/70 border border-slate-800/90 hover:border-indigo-500/60 p-3.5 rounded-xl space-y-2.5 transition-all shadow-md cursor-grab active:cursor-grabbing group relative ${
                            isDragging ? 'opacity-40 scale-95 border-dashed border-indigo-400' : 'hover:-translate-y-0.5'
                          }`}
                        >
                          {/* Card Top: Avatar + Name + Grip */}
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-black text-xs flex items-center justify-center shrink-0 shadow-md shadow-indigo-500/20">
                                {initials}
                              </div>
                              <div className="min-w-0">
                                <h4 className="font-bold text-sm text-slate-100 group-hover:text-indigo-400 transition-colors truncate">
                                  {lead.firstName} {lead.lastName}
                                </h4>
                                <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1">
                                  <Phone size={10} className="text-indigo-400" />
                                  {lead.phone}
                                </span>
                              </div>
                            </div>
                            <GripVertical size={14} className="text-slate-600 group-hover:text-slate-400 shrink-0 mt-1 cursor-grab" />
                          </div>

                          {/* Notes Preview */}
                          {lead.notes && (
                            <p className="text-[11px] text-slate-400 line-clamp-2 bg-slate-900/60 p-2 rounded-lg border border-slate-850 italic">
                              "{lead.notes}"
                            </p>
                          )}

                          {/* Tags: Course + Source */}
                          <div className="flex items-center justify-between gap-1 pt-1 border-t border-slate-850/80">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              {lead.course && (
                                <span className="inline-block text-[10px] font-extrabold text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded uppercase">
                                  {lead.course.name}
                                </span>
                              )}
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-400 bg-slate-900 border border-slate-800 px-2 py-0.5 rounded">
                                {getSourceIcon(lead.source)}
                                {lead.source || 'Noma\'lum'}
                              </span>
                            </div>

                            {/* Quick convert button for engaged stages */}
                            {['TRIAL_ATTENDED', 'CONTACTED'].includes(lead.status) && (
                              <button
                                onClick={(e) => openConvertModalForLead(lead, e)}
                                title="O'quvchi sifatida qabul qilish"
                                className="p-1 px-2 bg-emerald-500/10 hover:bg-emerald-500 text-emerald-400 hover:text-white rounded-lg text-[10px] font-bold border border-emerald-500/20 transition-all cursor-pointer flex items-center gap-1 shrink-0"
                              >
                                <UserCheck size={12} /> Qabul
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* MANDATORY STATUS CHANGE NOTE MODAL */}
      {showStatusModal && statusChangeData.lead && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-[70] animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl relative">
            <button 
              onClick={() => setShowStatusModal(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-white cursor-pointer"
            >
              <X size={20} />
            </button>
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <FileText size={18} className="text-indigo-400" />
                Status O'zgarishi Sababi
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Nomzod: <span className="text-slate-200 font-bold">{statusChangeData.lead.firstName} {statusChangeData.lead.lastName}</span> ({statusChangeData.lead.phone})
              </p>
            </div>

            {/* Stage transition pill */}
            <div className="flex items-center justify-between bg-slate-950/60 p-3 rounded-xl border border-slate-850 text-xs">
              <div>
                <span className="text-[10px] text-slate-500 font-bold block uppercase">Oldingi status</span>
                <span className="font-bold text-slate-300">
                  {stages.find(s => s.key === statusChangeData.lead.status)?.name || statusChangeData.lead.status}
                </span>
              </div>
              <ArrowRight size={16} className="text-indigo-400" />
              <div className="text-right">
                <span className="text-[10px] text-indigo-400 font-bold block uppercase">Yangi status</span>
                <span className="font-extrabold text-indigo-300">
                  {stages.find(s => s.key === statusChangeData.targetStageKey)?.name || statusChangeData.targetStageKey}
                </span>
              </div>
            </div>

            {statusModalError && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-xs font-semibold flex items-center gap-2">
                <AlertCircle size={16} className="shrink-0" />
                {statusModalError}
              </div>
            )}

            <form onSubmit={handleStatusModalSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1 uppercase tracking-wide">
                  Qisqacha Izoh / Sabab <span className="text-rose-400">* (Majburiy)</span>
                </label>
                <textarea
                  required
                  rows="3"
                  placeholder="Masalan: Qo'ng'iroq qilindi, kurs narxi va sharoitlar ma'qul keldi, dushanbaga sinov darsiga yozildi..."
                  value={statusChangeData.note}
                  onChange={(e) => setStatusChangeData(prev => ({ ...prev, note: e.target.value }))}
                  className="w-full p-3 bg-slate-950/80 border border-slate-800 rounded-xl text-slate-200 text-xs focus:outline-none focus:border-indigo-500 placeholder:text-slate-600"
                ></textarea>
                <p className="text-[10px] text-slate-500 mt-1">Ushbu izoh lidning barcha muloqotlar tarixida saqlanib boriladi.</p>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowStatusModal(false)}
                  className="flex-1 h-10 border border-slate-800 hover:bg-slate-850 text-slate-350 text-xs font-bold rounded-xl cursor-pointer"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="flex-1 h-10 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-650 text-white text-xs font-bold rounded-xl cursor-pointer shadow-lg shadow-indigo-600/25"
                >
                  {actionLoading ? "Saqlanmoqda..." : "Tasdiqlash & Saqlash"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* LEAD DETAILS & INTERACTION HISTORY MODAL (USTIGA BOSGANDA) */}
      {showDetailsModal && selectedLead && (
        <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full p-6 space-y-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button 
              onClick={() => setShowDetailsModal(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-white cursor-pointer"
            >
              <X size={20} />
            </button>

            {/* Top Profile Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-black text-base flex items-center justify-center shadow-lg shadow-indigo-500/25">
                  {getInitials(selectedLead.firstName, selectedLead.lastName)}
                </div>
                <div>
                  <h3 className="text-xl font-black text-white">
                    {selectedLead.firstName} {selectedLead.lastName}
                  </h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-indigo-400 font-bold flex items-center gap-1">
                      <Phone size={12} /> {selectedLead.phone}
                    </span>
                    <span className="text-slate-600">•</span>
                    <span className="text-xs text-slate-400 font-semibold flex items-center gap-1">
                      {getSourceIcon(selectedLead.source)} {selectedLead.source}
                    </span>
                  </div>
                </div>
              </div>

              {selectedLead.status !== 'CONVERTED' && (
                <button
                  onClick={() => openConvertModalForLead(selectedLead)}
                  className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-emerald-600/20 cursor-pointer flex items-center gap-1.5 self-start sm:self-auto shrink-0"
                >
                  <UserCheck size={15} /> O'quvchilikka Qabul Qilish
                </button>
              )}
            </div>

            {/* Stage Selector (Clicking a stage opens the mandatory note modal) */}
            <div className="bg-slate-950/60 p-4 border border-slate-850 rounded-2xl space-y-2.5">
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide">Statusni O'zgartirish (Bosqich)</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {stages.map(s => {
                  const isCurrent = selectedLead.status === s.key;
                  return (
                    <button
                      key={s.key}
                      type="button"
                      onClick={() => handleInitiateStatusChange(selectedLead, s.key)}
                      className={`p-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer text-left flex items-center justify-between ${
                        isCurrent 
                          ? 'border-indigo-500 bg-indigo-600 text-white shadow-md shadow-indigo-600/30' 
                          : 'border-slate-800 bg-slate-900/90 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                      }`}
                    >
                      <span>{s.name}</span>
                      {isCurrent && <CheckCircle2 size={13} />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Add new communication note */}
            <form onSubmit={handleAddEvent} className="space-y-2.5">
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide">Yangi Muloqot / Qo'ng'iroq Qaydini Yozish</label>
              <textarea
                rows="2"
                required
                placeholder="Mijoz bilan qo'ng'iroq, uchrashuv yoki muloqot xulosasini yozing..."
                value={newEventDesc}
                onChange={(e) => setNewEventDesc(e.target.value)}
                className="w-full p-3 bg-slate-950/60 border border-slate-850 rounded-xl text-slate-200 text-xs focus:outline-none focus:border-indigo-500"
              ></textarea>
              <div className="flex justify-end">
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl cursor-pointer shadow-md shadow-indigo-600/20"
                >
                  Qaydni Saqlash
                </button>
              </div>
            </form>

            {/* COMPLETE CHRONOLOGICAL INTERACTION & STATUS CHANGE HISTORY */}
            <div className="space-y-3 pt-3 border-t border-slate-800">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wide flex items-center gap-1.5">
                  <History size={14} className="text-indigo-400" />
                  Barcha Muloqotlar va Status O'zgarishlari Tarixi
                </h4>
                <span className="text-[10px] text-slate-500 font-bold">{leadEvents.length} ta yozuv</span>
              </div>

              <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                {leadEvents.length === 0 ? (
                  <div className="text-center py-6 text-slate-600 text-xs border border-dashed border-slate-850 rounded-xl">
                    Hozircha muloqot qaydlari mavjud emas.
                  </div>
                ) : (
                  leadEvents.map(e => {
                    const isStatusChange = e.eventType === 'STATUS_CHANGE';

                    return (
                      <div 
                        key={e.id} 
                        className={`p-3 rounded-xl border space-y-1 text-xs transition-all ${
                          isStatusChange 
                            ? 'bg-indigo-950/25 border-indigo-500/30' 
                            : 'bg-slate-950/40 border-slate-850'
                        }`}
                      >
                        <div className="flex justify-between items-center text-[10px] text-slate-500 font-medium">
                          <span className={`font-extrabold uppercase px-1.5 py-0.5 rounded ${
                            isStatusChange ? 'bg-indigo-500/15 text-indigo-400' : 'bg-slate-800 text-slate-400'
                          }`}>
                            {isStatusChange ? "Status O'zgarishi" : e.eventType || "Muloqot"}
                          </span>
                          <span className="flex items-center gap-1 text-slate-400 font-semibold">
                            <Clock size={10} />
                            {new Date(e.createdAt).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-slate-200 font-semibold leading-relaxed">{e.description}</p>
                        {e.createdBy && (
                          <span className="text-[10px] text-slate-500 block pt-0.5">
                            Yozgan: <span className="font-bold text-slate-400">{e.createdBy.fullName || e.createdBy.username}</span>
                          </span>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Lead Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 space-y-6 shadow-2xl relative">
            <button 
              onClick={() => setShowAddModal(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-white cursor-pointer"
            >
              <X size={20} />
            </button>
            <div>
              <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                <Sparkles size={18} className="text-indigo-400" />
                Yangi Lead Yaratish
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">Mijoz ma'lumotlari va qiziqqan kursini kiriting</p>
            </div>

            {formError && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-xs font-semibold">
                {formError}
              </div>
            )}

            <form onSubmit={handleAddSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1 uppercase tracking-wide">Ism *</label>
                  <input
                    type="text"
                    required
                    placeholder="Masalan: Sardor"
                    value={addForm.firstName}
                    onChange={(e) => setAddForm(prev => ({ ...prev, firstName: e.target.value }))}
                    className="w-full h-11 px-4 bg-slate-950/60 border border-slate-850 rounded-xl text-slate-200 text-sm font-semibold focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1 uppercase tracking-wide">Familiya</label>
                  <input
                    type="text"
                    placeholder="Masalan: Aliyev"
                    value={addForm.lastName}
                    onChange={(e) => setAddForm(prev => ({ ...prev, lastName: e.target.value }))}
                    className="w-full h-11 px-4 bg-slate-950/60 border border-slate-850 rounded-xl text-slate-200 text-sm font-semibold focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1 uppercase tracking-wide">Telefon raqami *</label>
                <input
                  type="text"
                  required
                  placeholder="+998901234567"
                  value={addForm.phone}
                  onChange={(e) => setAddForm(prev => ({ ...prev, phone: e.target.value }))}
                  className="w-full h-11 px-4 bg-slate-950/60 border border-slate-850 rounded-xl text-slate-200 text-sm font-semibold focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1 uppercase tracking-wide">Manba</label>
                  <select
                    value={addForm.source}
                    onChange={(e) => setAddForm(prev => ({ ...prev, source: e.target.value }))}
                    className="w-full h-11 px-3 bg-slate-950/60 border border-slate-850 rounded-xl text-slate-200 text-sm font-semibold focus:outline-none focus:border-indigo-500"
                  >
                    <option value="Telegram">Telegram</option>
                    <option value="Instagram">Instagram</option>
                    <option value="Website">Website</option>
                    <option value="Phone">Qo'ng'iroq</option>
                    <option value="Walk-in">Tashrif</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1 uppercase tracking-wide">Kurs</label>
                  <select
                    value={addForm.courseId}
                    onChange={(e) => setAddForm(prev => ({ ...prev, courseId: e.target.value }))}
                    className="w-full h-11 px-3 bg-slate-950/60 border border-slate-850 rounded-xl text-slate-200 text-sm font-semibold focus:outline-none focus:border-indigo-500"
                  >
                    <option value="">Kursni tanlang...</option>
                    {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1 uppercase tracking-wide">Qo'shimcha izohlar</label>
                <textarea
                  rows="3"
                  placeholder="Mijoz haqida ma'lumotlar yoki talablar..."
                  value={addForm.notes}
                  onChange={(e) => setAddForm(prev => ({ ...prev, notes: e.target.value }))}
                  className="w-full p-3 bg-slate-950/60 border border-slate-850 rounded-xl text-slate-200 text-xs focus:outline-none focus:border-indigo-500"
                ></textarea>
              </div>

              <div className="flex gap-4 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 h-11 border border-slate-800 hover:bg-slate-850 text-slate-350 text-sm font-bold rounded-xl cursor-pointer"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="flex-1 h-11 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-650 text-white text-sm font-bold rounded-xl cursor-pointer shadow-lg shadow-indigo-600/20"
                >
                  {actionLoading ? "Saqlanmoqda..." : "Yaratish"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Convert Lead to Student Modal */}
      {showConvertModal && selectedLead && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-6 shadow-2xl relative">
            <button 
              onClick={() => setShowConvertModal(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-white cursor-pointer"
            >
              <X size={20} />
            </button>
            <div>
              <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                <UserCheck size={18} className="text-emerald-400" />
                O'quvchi Sifatida Qabul Qilish
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Nomzod: {selectedLead.firstName} {selectedLead.lastName}
              </p>
            </div>

            {formError && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-xs font-semibold">
                {formError}
              </div>
            )}

            <form onSubmit={handleConvertSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1 uppercase tracking-wide">Tarif Rejasi (Price Plan) *</label>
                <select
                  required
                  value={convertForm.pricePlanId}
                  onChange={(e) => setConvertForm(prev => ({ ...prev, pricePlanId: e.target.value }))}
                  className="w-full h-11 px-3 bg-slate-950/60 border border-slate-850 rounded-xl text-slate-200 text-sm font-semibold focus:outline-none focus:border-indigo-500"
                >
                  <option value="">Tarifni tanlang...</option>
                  {pricePlans.map(p => (
                    <option key={p.id} value={p.id}>{p.name} - {p.amount.toLocaleString()} UZS</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1 uppercase tracking-wide">Biriktiriladigan Guruh</label>
                <select
                  value={convertForm.groupId}
                  onChange={(e) => setConvertForm(prev => ({ ...prev, groupId: e.target.value }))}
                  className="w-full h-11 px-3 bg-slate-950/60 border border-slate-850 rounded-xl text-slate-200 text-sm font-semibold focus:outline-none focus:border-indigo-500"
                >
                  <option value="">Guruhsiz qoldirish (Keyinroq biriktirish)</option>
                  {groups.map(g => (
                    <option key={g.id} value={g.id}>{g.name} ({g.course?.name})</option>
                  ))}
                </select>
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setShowConvertModal(false)}
                  className="flex-1 h-11 border border-slate-800 hover:bg-slate-850 text-slate-355 text-sm font-bold rounded-xl cursor-pointer"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="flex-1 h-11 bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-650 text-white text-sm font-bold rounded-xl cursor-pointer shadow-lg shadow-emerald-600/20"
                >
                  {actionLoading ? "Aylantirilmoqda..." : "Qabul Qilish"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
