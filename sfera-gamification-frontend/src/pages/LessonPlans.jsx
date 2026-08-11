import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { BookOpen, Plus, Edit3, Trash2, X, ListOrdered, FileText } from 'lucide-react';
import CustomSelect from '../components/CustomSelect';

export default function LessonPlans() {
  const { courses } = useData();
  const { user } = useAuth();
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';
  const isAdmin = user?.role === 'ADMIN';
  const isMentor = user?.role === 'MENTOR';
  const canManage = isSuperAdmin || isAdmin || isMentor;

  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(false);

  // Form states
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [form, setForm] = useState({ title: '', content: '', sequenceOrder: 1 });
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Delete confirm states
  const [deleteConfirm, setDeleteConfirm] = useState({ show: false, id: null });

  useEffect(() => {
    if (courses && courses.length > 0 && !selectedCourseId) {
      setSelectedCourseId(courses[0].id.toString());
    }
  }, [courses]);

  useEffect(() => {
    if (selectedCourseId) {
      fetchPlans();
    }
  }, [selectedCourseId]);

  const fetchPlans = () => {
    setLoading(true);
    axios.get(`/api/lesson-plans?courseId=${selectedCourseId}`)
      .then(res => {
        setPlans(res.data);
      })
      .catch(err => {
        console.error("Error fetching lesson plans", err);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const handleOpenAdd = () => {
    setEditingItem(null);
    setForm({ title: '', content: '', sequenceOrder: plans.length + 1 });
    setErrorMsg('');
    setSuccessMsg('');
    setShowModal(true);
  };

  const handleOpenEdit = (plan) => {
    setEditingItem(plan);
    setForm({ title: plan.title, content: plan.content, sequenceOrder: plan.sequenceOrder });
    setErrorMsg('');
    setSuccessMsg('');
    setShowModal(true);
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.content.trim()) {
      setErrorMsg("Iltimos, barcha majburiy maydonlarni to'ldiring.");
      return;
    }

    const payload = {
      courseId: parseInt(selectedCourseId),
      title: form.title,
      content: form.content,
      sequenceOrder: parseInt(form.sequenceOrder)
    };

    const apiCall = editingItem 
      ? axios.put(`/api/lesson-plans/${editingItem.id}`, payload)
      : axios.post('/api/lesson-plans', payload);

    apiCall
      .then(() => {
        setSuccessMsg(editingItem ? "Mavzu muvaffaqiyatli yangilandi!" : "Yangi mavzu muvaffaqiyatli qo'shildi!");
        fetchPlans();
        setTimeout(() => {
          setShowModal(false);
        }, 1000);
      })
      .catch(err => {
        console.error("Error saving lesson plan", err);
        setErrorMsg("Mavzuni saqlashda xatolik yuz berdi.");
      });
  };

  const handleDeleteClick = (id) => {
    setDeleteConfirm({ show: true, id });
  };

  const executeDelete = () => {
    if (!deleteConfirm.id) return;
    axios.delete(`/api/lesson-plans/${deleteConfirm.id}`)
      .then(() => {
        fetchPlans();
        setDeleteConfirm({ show: false, id: null });
      })
      .catch(err => {
        console.error("Error deleting lesson plan", err);
        setDeleteConfirm({ show: false, id: null });
      });
  };

  return (
    <div className="p-6 space-y-6 overflow-y-auto max-h-[calc(100vh-4rem)]">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-2">
            <BookOpen className="text-indigo-400" />
            Dars Rejalari (Syllabus)
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Akademiyada o'tiladigan kurslarning dars rejalari va dars materiallari boshqaruvi (Sfera AI ushbu ma'lumotlardan foydalanadi)
          </p>
        </div>

        {canManage && selectedCourseId && (
          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-indigo-650 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow shadow-indigo-500/10 cursor-pointer transition-all shrink-0 border-0"
          >
            <Plus size={15} /> MAVZU QO'SHISH
          </button>
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
      </div>

      {/* Content Area */}
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
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/40 text-[10px] font-bold text-slate-400 tracking-wider uppercase">
                  <th className="py-4 px-6 w-16 text-center">TARTIB</th>
                  <th className="py-4 px-6">MAVZU NOMI</th>
                  <th className="py-4 px-6">MAVZU MAZMUNI (KONTEXT)</th>
                  {canManage && <th className="py-4 px-6 text-center w-32">HARAKATLAR</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300 text-sm">
                {plans.map(p => (
                  <tr key={p.id} className="hover:bg-slate-850/20 transition-all">
                    <td className="py-4 px-6 text-center font-bold text-indigo-400">
                      #{p.sequenceOrder}
                    </td>
                    <td className="py-4 px-6 font-bold text-slate-100 min-w-[200px]">
                      {p.title}
                    </td>
                    <td className="py-4 px-6 text-slate-400 font-medium max-w-md">
                      <div className="line-clamp-2" title={p.content}>
                        {p.content}
                      </div>
                    </td>
                    {canManage && (
                      <td className="py-4 px-6">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleOpenEdit(p)}
                            className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-indigo-650 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer transition-colors border border-slate-700/50"
                          >
                            <Edit3 size={13} />
                          </button>
                          <button
                            onClick={() => handleDeleteClick(p.id)}
                            className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-rose-600/15 border border-slate-700/50 hover:border-rose-500/25 text-slate-400 hover:text-rose-400 flex items-center justify-center cursor-pointer transition-colors"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal: Add/Edit Plan */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <form onSubmit={handleFormSubmit} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-lg w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-extrabold text-white text-base">
                {editingItem ? "Mavzuni Tahrirlash" : "Yangi Mavzu Qo'shish"}
              </h3>
              <button 
                type="button" 
                onClick={() => setShowModal(false)} 
                className="text-slate-400 hover:text-slate-100 cursor-pointer border-0 bg-transparent"
              >
                <X size={18} />
              </button>
            </div>

            {errorMsg && <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-lg text-rose-400 text-xs font-semibold">{errorMsg}</div>}
            {successMsg && <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-400 text-xs font-semibold">{successMsg}</div>}

            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-slate-400 mb-1">MAVZU NOMI *</label>
                  <input
                    type="text"
                    required
                    placeholder="Masalan: Variables and Data Types"
                    value={form.title}
                    onChange={e => setForm(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full h-10 px-3 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 text-sm focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">TARTIB RAQAMI</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={form.sequenceOrder}
                    onChange={e => setForm(prev => ({ ...prev, sequenceOrder: e.target.value }))}
                    className="w-full h-10 px-3 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 text-sm focus:outline-none focus:border-indigo-500 font-bold text-center"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">MAVZU TAFSILOTI / MAZMUNI *</label>
                <textarea
                  required
                  rows="6"
                  placeholder="Ushbu dars nima haqida, uning asosiy tushunchalari va qoidalari nimada? AI foydalanuvchiga javob berishda ushbu matndan foydalanadi..."
                  value={form.content}
                  onChange={e => setForm(prev => ({ ...prev, content: e.target.value }))}
                  className="w-full p-3 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 text-sm focus:outline-none focus:border-indigo-500 font-sans"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-800 mt-6">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-750 text-slate-300 font-semibold rounded-xl text-xs cursor-pointer border-0"
              >
                Bekor qilish
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs cursor-pointer border-0 shadow-lg shadow-indigo-650/20"
              >
                Saqlash
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm.show && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-[110] p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-sm w-full shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-500 mb-2">
              <div className="w-10 h-10 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center shrink-0">
                <Trash2 size={18} />
              </div>
              <h3 className="font-extrabold text-slate-100 text-base">O'chirishni tasdiqlang</h3>
            </div>
            <p className="text-sm text-slate-400">
              Ushbu dars rejasini o'chirmoqchimisiz? Ushbu amal ortga qaytarilmaydi!
            </p>
            <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                onClick={() => setDeleteConfirm({ show: false, id: null })}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-750 text-slate-300 font-semibold rounded-xl text-xs cursor-pointer border-0"
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
