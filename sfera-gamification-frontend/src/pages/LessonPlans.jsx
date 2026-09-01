import React, { useState, useEffect, useRef, useMemo } from 'react';
import axios from 'axios';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import {
  BookOpen, Plus, Edit3, Trash2, X, ListOrdered,
  Upload, Eye, CheckCircle, AlertCircle, Download, Layers
} from 'lucide-react';
import CustomSelect from '../components/CustomSelect';

// ─── Notion Markdown Parser ────────────────────────────────────────────────
function parseNotionMarkdown(mdText) {
  const lines = mdText.split('\n');
  const lessons = [];
  let currentModule = '';
  let currentLesson = null;
  let sequenceOrder = 0;
  let contentLines = [];
  let homeworkLines = [];
  let inHomework = false;

  const flushLesson = () => {
    if (currentLesson) {
      const contentText = contentLines
        .join('\n')
        .replace(/\*\*(.*?)\*\*/g, '$1')  // bold markdown olib tashlash
        .trim();
      const homeworkText = homeworkLines
        .join(' ')
        .replace(/\*\*(.*?)\*\*/g, '$1')
        .trim();

      currentLesson.content = contentText || currentLesson.title;
      currentLesson.homeworkTask = homeworkText || null;
      lessons.push({ ...currentLesson });
      contentLines = [];
      homeworkLines = [];
      inHomework = false;
      currentLesson = null;
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i];
    const line = raw.trim();

    // ## Module sarlavhasi
    if (/^##\s+\S/.test(line) && !/^###/.test(line)) {
      flushLesson();
      currentModule = line.replace(/^#+\s*/, '').trim();
      continue;
    }

    // ### Dars sarlavhasi
    if (/^###\s+/.test(line)) {
      flushLesson();
      sequenceOrder++;
      const lessonLabel = line.replace(/^#+\s*/, '').trim();
      currentLesson = {
        moduleTitle: currentModule,
        title: '',
        content: '',
        homeworkTask: null,
        sequenceOrder,
        _lessonLabel: lessonLabel,
      };
      inHomework = false;
      continue;
    }

    if (!currentLesson) continue;

    // Mavzu satri
    const mavzuMatch = line.match(/^(?:\*\*)?Mavzu(?:\*\*)?:\s*(.+)/i);
    if (mavzuMatch) {
      currentLesson.title = mavzuMatch[1].replace(/\*\*/g, '').trim();
      continue;
    }

    // Uyga vazifa satri — keyingi kontentni homework sifatida yig'amiz
    const homeworkMatch = line.match(/^(?:\*\*)?Uyga\s+vazifa(?:\*\*)?[:\s]*(.*)/i);
    if (homeworkMatch) {
      inHomework = true;
      const rest = homeworkMatch[1].replace(/\*\*/g, '').trim();
      if (rest) homeworkLines.push(rest);
      continue;
    }

    // Bo'sh satr — inHomework ni tugatmaydi (multiline uyga vazifa uchun)
    if (line === '') {
      // Keyingi sarlavha kelguncha davom etish
      if (inHomework) homeworkLines.push('');
      continue;
    }

    if (inHomework) {
      // Uyga vazifa matnini yig'amiz (listlar va oddiy matn)
      const clean = line.replace(/^[-*]\s*/, '').replace(/\*\*/g, '').trim();
      if (clean) homeworkLines.push(clean);
    } else {
      // Oddiy kontent satri
      const clean = line.replace(/^[-*]\s*/, '').replace(/\*\*/g, '').trim();
      if (clean) contentLines.push(clean);
    }
  }

  flushLesson();

  // Mavzu topilmagan darslar uchun lessonLabel dan foydalanish
  for (const l of lessons) {
    if (!l.title && l._lessonLabel) {
      l.title = l._lessonLabel;
    }
    delete l._lessonLabel;
  }

  return lessons.filter(l => l.title);
}
// ──────────────────────────────────────────────────────────────────────────

export default function LessonPlans() {
  const { courses } = useData();
  const { user } = useAuth();
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';
  const isAdmin = user?.role === 'ADMIN';
  const isMentor = user?.role === 'MENTOR';
  const canManage = isSuperAdmin || isAdmin || isMentor;
  const canBulkUpload = isSuperAdmin || isAdmin;

  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(false);

  // Single add/edit modal
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [form, setForm] = useState({ moduleTitle: '', title: '', content: '', homeworkTask: '', sequenceOrder: 1 });
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Delete confirm
  const [deleteConfirm, setDeleteConfirm] = useState({ show: false, id: null });

  // Bulk upload modal
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkParsed, setBulkParsed] = useState([]);
  const [bulkReplace, setBulkReplace] = useState(true);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkError, setBulkError] = useState('');
  const [bulkSuccess, setBulkSuccess] = useState('');
  const [bulkFileName, setBulkFileName] = useState('');
  const fileInputRef = useRef(null);

  const [mentorCourseIds, setMentorCourseIds] = useState(null); // null = not filtered, Set = mentor's courses

  useEffect(() => {
    // If mentor, load their groups to find which courses they teach
    if (isMentor) {
      axios.get('/api/groups')
        .then(res => {
          const myGroups = (res.data || []).filter(g => g.mentorName === user.fullName);
          const courseIds = new Set(myGroups.map(g => g.courseId?.toString()).filter(Boolean));
          setMentorCourseIds(courseIds);
          if (courses && courses.length > 0) {
            const myFirst = courses.find(c => courseIds.has(c.id?.toString()));
            if (myFirst) setSelectedCourseId(myFirst.id.toString());
            else if (courses[0]) setSelectedCourseId(courses[0].id.toString());
          }
        })
        .catch(() => {});
    }
  }, [isMentor, courses]);

  const visibleCourses = useMemo(() => {
    if (!courses) return [];
    if (isMentor && mentorCourseIds !== null) {
      return courses.filter(c => mentorCourseIds.has(c.id?.toString()));
    }
    return courses;
  }, [courses, isMentor, mentorCourseIds]);

  useEffect(() => {
    if (!isMentor && courses && courses.length > 0 && !selectedCourseId) {
      setSelectedCourseId(courses[0].id.toString());
    }
  }, [courses]);

  useEffect(() => {
    if (selectedCourseId) fetchPlans();
  }, [selectedCourseId]);

  const fetchPlans = () => {
    setLoading(true);
    axios.get(`/api/lesson-plans?courseId=${selectedCourseId}`)
      .then(res => setPlans(res.data))
      .catch(err => console.error('Error fetching lesson plans', err))
      .finally(() => setLoading(false));
  };

  // ── Single CRUD ─────────────────────────────────────────
  const handleOpenAdd = () => {
    setEditingItem(null);
    setForm({ moduleTitle: '', title: '', content: '', homeworkTask: '', sequenceOrder: plans.length + 1 });
    setErrorMsg(''); setSuccessMsg('');
    setShowModal(true);
  };

  const handleOpenEdit = (plan) => {
    setEditingItem(plan);
    setForm({
      moduleTitle: plan.moduleTitle || '',
      title: plan.title,
      content: plan.content,
      homeworkTask: plan.homeworkTask || '',
      sequenceOrder: plan.sequenceOrder
    });
    setErrorMsg(''); setSuccessMsg('');
    setShowModal(true);
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.content.trim()) {
      setErrorMsg("Iltimos, mavzu nomi va mazmunini kiriting.");
      return;
    }
    const payload = {
      courseId: parseInt(selectedCourseId),
      moduleTitle: form.moduleTitle,
      title: form.title,
      content: form.content,
      homeworkTask: form.homeworkTask || null,
      sequenceOrder: parseInt(form.sequenceOrder)
    };
    const apiCall = editingItem
      ? axios.put(`/api/lesson-plans/${editingItem.id}`, payload)
      : axios.post('/api/lesson-plans', payload);

    apiCall
      .then(() => {
        setSuccessMsg(editingItem ? "Mavzu yangilandi!" : "Mavzu qo'shildi!");
        fetchPlans();
        setTimeout(() => setShowModal(false), 900);
      })
      .catch(() => setErrorMsg("Saqlashda xatolik yuz berdi."));
  };

  const handleDeleteClick = (id) => setDeleteConfirm({ show: true, id });

  const executeDelete = () => {
    if (!deleteConfirm.id) return;
    axios.delete(`/api/lesson-plans/${deleteConfirm.id}`)
      .then(() => { fetchPlans(); setDeleteConfirm({ show: false, id: null }); })
      .catch(() => setDeleteConfirm({ show: false, id: null }));
  };

  // ── Bulk Upload ─────────────────────────────────────────
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setBulkFileName(file.name);
    setBulkError(''); setBulkSuccess(''); setBulkParsed([]);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const text = evt.target.result;
        const parsed = parseNotionMarkdown(text);
        if (parsed.length === 0) {
          setBulkError("Faylda hech qanday dars topilmadi. Notion Markdown formatiga mos emasmi?");
        } else {
          setBulkParsed(parsed);
        }
      } catch (err) {
        setBulkError("Faylni o'qishda xatolik: " + err.message);
      }
    };
    reader.readAsText(file, 'UTF-8');
  };

  const handleBulkUpload = async () => {
    if (!bulkParsed.length || !selectedCourseId) return;
    setBulkLoading(true); setBulkError(''); setBulkSuccess('');
    try {
      const res = await axios.post(
        `/api/lesson-plans/bulk-upload?courseId=${selectedCourseId}&replace=${bulkReplace}`,
        bulkParsed
      );
      setBulkSuccess(res.data.message || `${bulkParsed.length} ta dars rejasi yuklandi!`);
      fetchPlans();
      setTimeout(() => {
        setShowBulkModal(false);
        setBulkParsed([]); setBulkFileName(''); setBulkSuccess('');
      }, 1500);
    } catch (err) {
      setBulkError("Yuklashda xatolik: " + (err.response?.data?.message || err.message));
    } finally {
      setBulkLoading(false);
    }
  };

  const openBulkModal = () => {
    setBulkParsed([]); setBulkFileName(''); setBulkError(''); setBulkSuccess('');
    setBulkReplace(true);
    setShowBulkModal(true);
  };

  // Module gruppa renkleri
  const moduleColors = ['indigo', 'violet', 'sky', 'emerald', 'amber', 'rose', 'teal', 'orange'];
  const getModuleColor = (moduleTitle) => {
    if (!moduleTitle) return 'slate';
    const idx = parseInt(moduleTitle.match(/\d+/)?.[0] || '1') - 1;
    return moduleColors[idx % moduleColors.length];
  };

  const colorMap = {
    indigo: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/20',
    violet: 'bg-violet-500/15 text-violet-300 border-violet-500/20',
    sky:    'bg-sky-500/15 text-sky-300 border-sky-500/20',
    emerald:'bg-emerald-500/15 text-emerald-300 border-emerald-500/20',
    amber:  'bg-amber-500/15 text-amber-300 border-amber-500/20',
    rose:   'bg-rose-500/15 text-rose-300 border-rose-500/20',
    teal:   'bg-teal-500/15 text-teal-300 border-teal-500/20',
    orange: 'bg-orange-500/15 text-orange-300 border-orange-500/20',
    slate:  'bg-slate-700/40 text-slate-400 border-slate-600/30',
  };

  return (
    <div className="p-6 space-y-6 overflow-y-auto overflow-x-auto min-h-full custom-scrollbar">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-2">
            <BookOpen className="text-indigo-400" />
            Dars Rejalari (Syllabus)
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Kurslarning dars rejalari va materiallari boshqaruvi — Sfera AI ushbu ma'lumotlardan foydalanadi
          </p>
        </div>

        {canManage && selectedCourseId && (
          <div className="flex items-center gap-2 shrink-0">
            {canBulkUpload && (
              <button
                onClick={openBulkModal}
                className="flex items-center gap-1.5 px-4 py-2.5 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-xs font-bold shadow shadow-violet-500/20 cursor-pointer transition-all border-0"
              >
                <Upload size={14} /> MARKDOWN YUKLASH
              </button>
            )}
            <button
              onClick={handleOpenAdd}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow shadow-indigo-500/10 cursor-pointer transition-all border-0"
            >
              <Plus size={15} /> MAVZU QO'SHISH
            </button>
          </div>
        )}
      </div>

      {/* Filter Toolbar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">Kurs:</span>
          <CustomSelect
            value={selectedCourseId}
            onChange={val => setSelectedCourseId(val)}
            options={courses.map(c => ({ value: c.id.toString(), label: c.name }))}
            placeholder="Kursni tanlang"
            className="w-64"
          />
        </div>
        {plans.length > 0 && (
          <div className="ml-auto flex items-center gap-3 text-xs text-slate-500">
            <span className="flex items-center gap-1">
              <ListOrdered size={12} /> {plans.length} ta mavzu
            </span>
            <span className="flex items-center gap-1">
              <Layers size={12} /> {[...new Set(plans.map(p => p.moduleTitle).filter(Boolean))].length} ta modul
            </span>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
        {loading ? (
          <div className="p-20 text-center text-slate-500">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-indigo-500 mx-auto mb-2"></div>
            Yuklanmoqda...
          </div>
        ) : plans.length === 0 ? (
          <div className="p-16 text-center text-slate-500 font-semibold text-sm">
            <ListOrdered size={40} className="mx-auto mb-3 opacity-30" />
            Ushbu kurs uchun hali dars rejalari kiritilmagan.
            {canBulkUpload && (
              <div className="mt-4">
                <button
                  onClick={openBulkModal}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-xs font-bold cursor-pointer border-0 transition-all"
                >
                  <Upload size={14} /> Notion Markdown yuklash
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/40 text-[10px] font-bold text-slate-400 tracking-wider uppercase">
                  <th className="py-4 px-4 w-12 text-center">#</th>
                  <th className="py-4 px-4 w-28">MODUL</th>
                  <th className="py-4 px-4">MAVZU NOMI</th>
                  <th className="py-4 px-4">MAZMUN</th>
                  <th className="py-4 px-4 w-48">UYA VAZIFA</th>
                  {canManage && <th className="py-4 px-4 text-center w-24">AMALLAR</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300 text-sm">
                {plans.map(p => {
                  const color = colorMap[getModuleColor(p.moduleTitle)] || colorMap.slate;
                  return (
                    <tr key={p.id} className="hover:bg-slate-800/20 transition-all">
                      <td className="py-3.5 px-4 text-center font-bold text-indigo-400 text-xs">
                        #{p.sequenceOrder}
                      </td>
                      <td className="py-3.5 px-4">
                        {p.moduleTitle ? (
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-bold border ${color}`}>
                            {p.moduleTitle}
                          </span>
                        ) : (
                          <span className="text-slate-600 text-xs">—</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-100 min-w-[180px]">
                        {p.title}
                      </td>
                      <td className="py-3.5 px-4 text-slate-400 font-medium max-w-xs">
                        <div className="line-clamp-2 text-xs" title={p.content}>
                          {p.content}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-500 max-w-[180px]">
                        {p.homeworkTask ? (
                          <div className="line-clamp-2 text-xs" title={p.homeworkTask}>
                            {p.homeworkTask}
                          </div>
                        ) : (
                          <span className="text-slate-700 text-xs">—</span>
                        )}
                      </td>
                      {canManage && (
                        <td className="py-3.5 px-4">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => handleOpenEdit(p)}
                              className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-indigo-600 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer transition-colors border border-slate-700/50"
                            >
                              <Edit3 size={12} />
                            </button>
                            <button
                              onClick={() => handleDeleteClick(p.id)}
                              className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-rose-600/15 border border-slate-700/50 hover:border-rose-500/25 text-slate-400 hover:text-rose-400 flex items-center justify-center cursor-pointer transition-colors"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
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

      {/* ── Bulk Upload Modal ───────────────────────────────── */}
      {showBulkModal && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-2xl w-full shadow-2xl space-y-5 max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-4 shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-violet-500/15 border border-violet-500/20 flex items-center justify-center">
                  <Upload size={16} className="text-violet-400" />
                </div>
                <div>
                  <h3 className="font-extrabold text-white text-sm">Notion Markdown Yuklash</h3>
                  <p className="text-[11px] text-slate-500">Notion → Export → Markdown & CSV → .md faylni yuklang</p>
                </div>
              </div>
              <button
                onClick={() => setShowBulkModal(false)}
                className="text-slate-400 hover:text-slate-100 cursor-pointer border-0 bg-transparent"
              >
                <X size={18} />
              </button>
            </div>

            {/* File input */}
            <div
              className="border-2 border-dashed border-slate-700 hover:border-violet-500/50 rounded-xl p-8 text-center cursor-pointer transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".md,.markdown"
                className="hidden"
                onChange={handleFileChange}
              />
              {bulkFileName ? (
                <div className="flex items-center justify-center gap-2 text-violet-300">
                  <CheckCircle size={20} />
                  <span className="font-bold text-sm">{bulkFileName}</span>
                </div>
              ) : (
                <>
                  <Download size={28} className="mx-auto mb-2 text-slate-600" />
                  <p className="text-slate-400 text-sm font-semibold">Markdown faylni bu yerga tanlang</p>
                  <p className="text-slate-600 text-xs mt-1">faqat .md format qabul qilinadi</p>
                </>
              )}
            </div>

            {/* Errors */}
            {bulkError && (
              <div className="flex items-start gap-2 p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-xs">
                <AlertCircle size={14} className="shrink-0 mt-0.5" />
                {bulkError}
              </div>
            )}
            {bulkSuccess && (
              <div className="flex items-center gap-2 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-xs font-bold">
                <CheckCircle size={14} />
                {bulkSuccess}
              </div>
            )}

            {/* Preview */}
            {bulkParsed.length > 0 && (
              <div className="flex-1 overflow-y-auto min-h-0">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-300 flex items-center gap-1">
                    <Eye size={13} /> Ko'rinish — {bulkParsed.length} ta dars topildi
                  </span>
                  <span className="text-[10px] text-slate-500">
                    {[...new Set(bulkParsed.map(p => p.moduleTitle).filter(Boolean))].length} ta modul
                  </span>
                </div>
                <div className="bg-slate-950/50 border border-slate-800 rounded-xl overflow-hidden">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-slate-800 text-[9px] text-slate-500 uppercase tracking-wider">
                        <th className="py-2 px-3 text-center w-8">#</th>
                        <th className="py-2 px-3 w-24">MODUL</th>
                        <th className="py-2 px-3">MAVZU</th>
                        <th className="py-2 px-3 w-32">UYA VAZIFA</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/50">
                      {bulkParsed.map((p, idx) => {
                        const color = colorMap[getModuleColor(p.moduleTitle)] || colorMap.slate;
                        return (
                          <tr key={idx} className="text-slate-400">
                            <td className="py-2 px-3 text-center text-slate-600">{p.sequenceOrder}</td>
                            <td className="py-2 px-3">
                              {p.moduleTitle && (
                                <span className={`inline-flex px-1.5 py-0.5 rounded text-[9px] font-bold border ${color}`}>
                                  {p.moduleTitle}
                                </span>
                              )}
                            </td>
                            <td className="py-2 px-3 font-semibold text-slate-200 truncate max-w-[200px]">{p.title}</td>
                            <td className="py-2 px-3 text-slate-500 truncate max-w-[120px]">
                              {p.homeworkTask || <span className="text-slate-700">—</span>}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Options & Actions */}
            <div className="border-t border-slate-800 pt-4 flex items-center justify-between shrink-0">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={bulkReplace}
                  onChange={e => setBulkReplace(e.target.checked)}
                  className="w-4 h-4 rounded accent-violet-500"
                />
                <span className="text-xs text-slate-400">
                  Mavjud rejalari <span className="text-rose-400 font-bold">o'chirib</span> yangisi bilan almashtir
                </span>
              </label>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowBulkModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl text-xs cursor-pointer border-0"
                >
                  Bekor qilish
                </button>
                <button
                  onClick={handleBulkUpload}
                  disabled={!bulkParsed.length || bulkLoading}
                  className="px-5 py-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold rounded-xl text-xs cursor-pointer border-0 shadow-lg shadow-violet-500/20 flex items-center gap-1.5 transition-all"
                >
                  {bulkLoading ? (
                    <><div className="w-3 h-3 border border-white/40 border-t-white rounded-full animate-spin" /> Yuklanmoqda...</>
                  ) : (
                    <><Upload size={13} /> {bulkParsed.length} ta darsni yuklash</>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Single Add/Edit Modal ────────────────────────────── */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <form onSubmit={handleFormSubmit} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-lg w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-extrabold text-white text-base">
                {editingItem ? "Mavzuni Tahrirlash" : "Yangi Mavzu Qo'shish"}
              </h3>
              <button type="button" onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-100 cursor-pointer border-0 bg-transparent">
                <X size={18} />
              </button>
            </div>

            {errorMsg && <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-lg text-rose-400 text-xs font-semibold">{errorMsg}</div>}
            {successMsg && <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-400 text-xs font-semibold">{successMsg}</div>}

            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">MODUL</label>
                  <input
                    type="text"
                    placeholder="1-module"
                    value={form.moduleTitle}
                    onChange={e => setForm(prev => ({ ...prev, moduleTitle: e.target.value }))}
                    className="w-full h-10 px-3 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 text-sm focus:outline-none focus:border-violet-500"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-slate-400 mb-1">MAVZU NOMI *</label>
                  <input
                    type="text"
                    required
                    placeholder="Masalan: Sun'iy intellekt bilan tanishuv"
                    value={form.title}
                    onChange={e => setForm(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full h-10 px-3 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 text-sm focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex-1">
                  <label className="block text-xs font-bold text-slate-400 mb-1">TARTIB RAQAMI</label>
                  <input
                    type="number" required min="1"
                    value={form.sequenceOrder}
                    onChange={e => setForm(prev => ({ ...prev, sequenceOrder: e.target.value }))}
                    className="w-full h-10 px-3 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 text-sm focus:outline-none focus:border-indigo-500 font-bold text-center"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">MAVZU MAZMUNI *</label>
                <textarea
                  required rows="4"
                  placeholder="Bu darsda nima o'tiladi? AI ushbu matndan foydalanadi..."
                  value={form.content}
                  onChange={e => setForm(prev => ({ ...prev, content: e.target.value }))}
                  className="w-full p-3 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 text-sm focus:outline-none focus:border-indigo-500 font-sans"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">UYA VAZIFA</label>
                <textarea
                  rows="2"
                  placeholder="Uyga vazifa matni (ixtiyoriy)..."
                  value={form.homeworkTask}
                  onChange={e => setForm(prev => ({ ...prev, homeworkTask: e.target.value }))}
                  className="w-full p-3 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 text-sm focus:outline-none focus:border-indigo-500 font-sans"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-800 mt-4">
              <button
                type="button" onClick={() => setShowModal(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-750 text-slate-300 font-semibold rounded-xl text-xs cursor-pointer border-0"
              >
                Bekor qilish
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs cursor-pointer border-0 shadow-lg shadow-indigo-600/20"
              >
                Saqlash
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteConfirm.show && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-[110] p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-sm w-full shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-500 mb-2">
              <div className="w-10 h-10 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center shrink-0">
                <Trash2 size={18} />
              </div>
              <h3 className="font-extrabold text-slate-100 text-base">O'chirishni tasdiqlang</h3>
            </div>
            <p className="text-sm text-slate-400">Ushbu dars rejasini o'chirmoqchimisiz? Bu amal ortga qaytarilmaydi!</p>
            <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                onClick={() => setDeleteConfirm({ show: false, id: null })}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl text-xs cursor-pointer border-0"
              >
                Yo'q
              </button>
              <button
                onClick={executeDelete}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-xs cursor-pointer border-0"
              >
                Ha, o'chirilsin
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
