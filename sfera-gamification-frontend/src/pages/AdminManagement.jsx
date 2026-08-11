import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Users, 
  FolderOpen, 
  UserCheck, 
  BookOpen, 
  Plus, 
  Edit3, 
  Archive, 
  AlertTriangle,
  X,
  PlusCircle,
  FileSpreadsheet,
  ChevronDown,
  Trash2,
  Search
} from 'lucide-react';
import MentorMonitor from './MentorMonitor';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import CustomSelect from '../components/CustomSelect';

export default function AdminManagement({ activeSubTab }) {
  const { user } = useAuth();
  const { groups, courses, mentors, refreshData } = useData();
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';
  const isAdmin = user?.role === 'ADMIN';
  const canManage = isSuperAdmin;

  // Tabs: students, groups, mentors, courses, admins
  const [activeTab, setActiveTab] = useState(activeSubTab || 'students');
  
  // Lists
  const [students, setStudents] = useState([]);
  const [adminsList, setAdminsList] = useState([]);
  
  // Loaders
  const [loading, setLoading] = useState(false);

  // Modals state
  const [showStudentModal, setShowStudentModal] = useState(false);
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [showMentorModal, setShowMentorModal] = useState(false);
  const [showCourseModal, setShowCourseModal] = useState(false);
  const [showAdminModal, setShowAdminModal] = useState(false);

  // Edit states
  const [editingItem, setEditingItem] = useState(null);

  // Form Fields
  const [studentForm, setStudentForm] = useState({ firstName: '', lastName: '', groupId: '', username: '', password: '' });
  const [groupForm, setGroupForm] = useState({ name: '', courseId: '', mentorId: '' });
  const [mentorForm, setMentorForm] = useState({ fullName: '', username: '', password: '' });
  const [courseForm, setCourseForm] = useState({ name: '' });
  const [adminForm, setAdminForm] = useState({ fullName: '', username: '', password: '' });

  // Error/Success messages
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Sub-tabs for mentors (monitor vs list)
  const [mentorSubTab, setMentorSubTab] = useState('monitor');

  // Bulk Import modal states
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkForm, setBulkForm] = useState({ groupId: '', text: '' });

  // Search states for each tab
  const [studentSearch, setStudentSearch] = useState('');
  const [groupSearch, setGroupSearch] = useState('');
  const [mentorSearch, setMentorSearch] = useState('');
  const [adminSearch, setAdminSearch] = useState('');

  // Custom Delete Confirm modal state
  const [deleteConfirm, setDeleteConfirm] = useState({
    show: false,
    id: null,
    type: '', // 'student' | 'group' | 'mentor' | 'admin-user'
    message: ''
  });

  useEffect(() => {
    if (activeTab === 'admins' && isSuperAdmin) {
      loadAdmins();
    } else {
      loadAllData();
    }
  }, [activeTab]);

  const loadAllData = () => {
    setLoading(true);
    axios.get('/api/students')
      .then(res => {
        setStudents(res.data);
      })
      .catch(err => {
        console.error("Error loading students data", err);
        setErrorMessage("Talabalar ma'lumotlarini yuklashda xatolik yuz berdi.");
      })
      .finally(() => setLoading(false));
  };

  const loadAdmins = () => {
    setLoading(true);
    axios.get('/api/admin-users')
      .then(res => {
        setAdminsList(res.data);
      })
      .catch(err => {
        console.error("Error loading admins data", err);
        setErrorMessage("Adminlar ma'lumotlarini yuklashda xatolik yuz berdi.");
      })
      .finally(() => setLoading(false));
  };

  const handleCloseModals = () => {
    setShowStudentModal(false);
    setShowGroupModal(false);
    setShowMentorModal(false);
    setShowCourseModal(false);
    setShowAdminModal(false);
    setShowBulkModal(false);
    setEditingItem(null);
    setErrorMessage('');
    setSuccessMessage('');
    // Clear forms
    setStudentForm({ firstName: '', lastName: '', groupId: '', initialPoints: '', username: '', password: '' });
    setGroupForm({ name: '', courseId: '', mentorId: '' });
    setMentorForm({ fullName: '', username: '', password: '' });
    setCourseForm({ name: '' });
    setAdminForm({ fullName: '', username: '', password: '' });
    setBulkForm({ groupId: groups[0]?.id || '', text: '' });
  };

  // --- ADMIN ACTIONS ---
  const openAddAdmin = () => {
    setEditingItem(null);
    setAdminForm({ fullName: '', username: '', password: '' });
    setShowAdminModal(true);
  };

  const openEditAdmin = (a) => {
    setEditingItem(a);
    setAdminForm({ fullName: a.fullName, username: a.username, password: '' });
    setShowAdminModal(true);
  };

  const handleAdminSubmit = (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    const apiCall = editingItem
      ? axios.put(`/api/admin-users/${editingItem.id}`, adminForm)
      : axios.post('/api/admin-users', adminForm);

    apiCall
      .then(() => {
        setSuccessMessage(editingItem ? "Admin ma'lumotlari yangilandi!" : "Yangi admin muvaffaqiyatli qo'shildi!");
        loadAdmins();
        setTimeout(handleCloseModals, 1200);
      })
      .catch(err => {
        console.error(err);
        setErrorMessage(err.response?.data || "Adminni saqlashda xatolik yuz berdi.");
      });
  };

  const handleDeleteAdmin = (id) => {
    setDeleteConfirm({
      show: true,
      id,
      type: 'admin-user',
      message: "Ushbu adminni o'chirib tashlamoqchimisiz? Ushbu amal ortga qaytarilmaydi!"
    });
  };

  // --- STUDENT ACTIONS ---
  const openAddStudent = () => {
    setEditingItem(null);
    setStudentForm({ firstName: '', lastName: '', groupId: groups[0]?.id || '', initialPoints: '', username: '', password: '' });
    setShowStudentModal(true);
  };

  const openEditStudent = (s) => {
    setEditingItem(s);
    setStudentForm({ firstName: s.firstName, lastName: s.lastName, groupId: s.groupId || '', initialPoints: '', username: s.username || '', password: '' });
    setShowStudentModal(true);
  };

  const handleStudentSubmit = (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    const apiCall = editingItem
      ? axios.put(`/api/students/${editingItem.id}`, studentForm)
      : axios.post('/api/students', studentForm);

    apiCall
      .then(() => {
        setSuccessMessage(editingItem ? "O'quvchi ma'lumotlari yangilandi!" : "Yangi o'quvchi muvaffaqiyatli qo'shildi!");
        refreshData();
        loadAllData();
        setTimeout(handleCloseModals, 1200);
      })
      .catch(err => {
        console.error(err);
        setErrorMessage("Amalni bajarishda xatolik yuz berdi.");
      });
  };

  const handleArchiveStudent = (id) => {
    setDeleteConfirm({
      show: true,
      id,
      type: 'student',
      message: "Ushbu o'quvchini arxivlamoqchimisiz? U reytinglarda ko'rinmaydi."
    });
  };

  const openBulkImport = () => {
    setBulkForm({ groupId: groups[0]?.id || '', text: '' });
    setShowBulkModal(true);
  };

  const handleBulkSubmit = (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    axios.post('/api/students/bulk-import', bulkForm)
      .then(() => {
        setSuccessMessage("O'quvchilar muvaffaqiyatli import qilindi!");
        refreshData();
        loadAllData();
        setTimeout(handleCloseModals, 1200);
      })
      .catch(err => {
        console.error(err);
        setErrorMessage("Import qilishda xatolik yuz berdi. Iltimos matnni tekshirib ko'ring.");
      });
  };

  // --- GROUP ACTIONS ---
  const openAddGroup = () => {
    setEditingItem(null);
    setGroupForm({ name: '', courseId: courses[0]?.id || '', mentorId: mentors[0]?.id || '' });
    setShowGroupModal(true);
  };

  const openEditGroup = (g) => {
    setEditingItem(g);
    setGroupForm({ name: g.name, courseId: g.courseId || '', mentorId: g.mentorId || '' });
    setShowGroupModal(true);
  };

  const handleGroupSubmit = (e) => {
    e.preventDefault();
    setErrorMessage('');

    const apiCall = editingItem
      ? axios.put(`/api/groups/${editingItem.id}`, groupForm)
      : axios.post('/api/groups', groupForm);

    apiCall
      .then(() => {
        setSuccessMessage(editingItem ? "Guruh yangilandi!" : "Yangi guruh yaratildi!");
        refreshData();
        loadAllData();
        setTimeout(handleCloseModals, 1200);
      })
      .catch(err => {
        console.error(err);
        setErrorMessage("Guruhni saqlashda xatolik yuz berdi.");
      });
  };

  const handleArchiveGroup = (id) => {
    setDeleteConfirm({
      show: true,
      id,
      type: 'group',
      message: "Ushbu guruhni arxivlamoqchimisiz?"
    });
  };

  const executeArchive = () => {
    const { id, type } = deleteConfirm;
    if (!id) return;

    let endpoint = '';
    if (type === 'student') endpoint = `/api/students/${id}`;
    else if (type === 'group') endpoint = `/api/groups/${id}`;
    else if (type === 'mentor') endpoint = `/api/mentors/${id}`;
    else if (type === 'admin-user') endpoint = `/api/admin-users/${id}`;

    axios.delete(endpoint)
      .then(() => {
        refreshData();
        if (type === 'admin-user') {
          loadAdmins();
        } else {
          loadAllData();
        }
        setDeleteConfirm({ show: false, id: null, type: '', message: '' });
      })
      .catch(err => {
        console.error(err);
        setDeleteConfirm({ show: false, id: null, type: '', message: '' });
      });
  };

  // --- MENTOR ACTIONS ---
  const openAddMentor = () => {
    setEditingItem(null);
    setMentorForm({ fullName: '', username: '', password: '' });
    setShowMentorModal(true);
  };

  const openEditMentor = (m) => {
    setEditingItem(m);
    setMentorForm({ fullName: m.fullName, username: m.username, password: '' });
    setShowMentorModal(true);
  };

  const handleArchiveMentor = (id) => {
    setDeleteConfirm({
      show: true,
      id,
      type: 'mentor',
      message: "Ushbu mentorni o'chirmoqchimisiz? Uning guruhlari mentorsiz qoladi."
    });
  };

  const handleMentorSubmit = (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    const apiCall = editingItem
      ? axios.put(`/api/mentors/${editingItem.id}`, mentorForm)
      : axios.post('/api/mentors', mentorForm);

    apiCall
      .then(() => {
        setSuccessMessage(editingItem ? "Mentor ma'lumotlari yangilandi!" : "Yangi mentor va uning foydalanuvchisi yaratildi!");
        refreshData();
        loadAllData();
        setTimeout(handleCloseModals, 1200);
      })
      .catch(err => {
        console.error(err);
        setErrorMessage(err.response?.data || "Mentorni saqlashda xatolik yuz berdi.");
      });
  };

  // --- COURSE ACTIONS ---
  const openAddCourse = () => {
    setCourseForm({ name: '' });
    setShowCourseModal(true);
  };

  const handleCourseSubmit = (e) => {
    e.preventDefault();
    setErrorMessage('');

    axios.post('/api/courses', courseForm)
      .then(() => {
        setSuccessMessage("Kurs muvaffaqiyatli qo'shildi!");
        refreshData();
        loadAllData();
        setTimeout(handleCloseModals, 1200);
      })
      .catch(err => {
        console.error(err);
        setErrorMessage("Kursni yaratishda xatolik yuz berdi.");
      });
  };

  // ---- Filtered lists ----
  const filteredStudents = students.filter(s => {
    if (!studentSearch.trim()) return true;
    const q = studentSearch.toLowerCase();
    return (
      s.fullName?.toLowerCase().includes(q) ||
      s.groupName?.toLowerCase().includes(q) ||
      s.mentorName?.toLowerCase().includes(q)
    );
  });

  const filteredGroups = groups.filter(g => {
    if (!groupSearch.trim()) return true;
    const q = groupSearch.toLowerCase();
    return (
      g.name?.toLowerCase().includes(q) ||
      g.mentorName?.toLowerCase().includes(q) ||
      g.courseName?.toLowerCase().includes(q)
    );
  });

  const filteredMentors = mentors.filter(m => {
    if (!mentorSearch.trim()) return true;
    const q = mentorSearch.toLowerCase();
    return (
      m.fullName?.toLowerCase().includes(q) ||
      m.username?.toLowerCase().includes(q)
    );
  });

  const filteredAdmins = adminsList.filter(a => {
    if (!adminSearch.trim()) return true;
    const q = adminSearch.toLowerCase();
    return (
      a.fullName?.toLowerCase().includes(q) ||
      a.username?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="p-6 space-y-6 overflow-y-auto max-h-[calc(100vh-4rem)]">
      {/* Tab Switcher Headers */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white">Ma'lumotlar Boshqaruvi</h1>
          <p className="text-sm text-slate-400 mt-1">Akademiya talabalari, guruhlar, mentorlar va kurslarni boshqarish paneli</p>
        </div>

        {/* Global Toolbar buttons based on active tab */}
        <div>
          {activeTab === 'students' && canManage && (
            <div className="flex gap-2">
              <button onClick={openAddStudent} className="flex items-center gap-1.5 px-4 py-2.5 bg-indigo-650 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow shadow-indigo-500/10 cursor-pointer">
                <Plus size={15} /> O'QUVCHI QO'SHISH
              </button>
              <button onClick={openBulkImport} className="flex items-center gap-1.5 px-4 py-2.5 bg-slate-800 hover:bg-slate-750 text-slate-200 rounded-xl text-xs font-bold cursor-pointer border border-slate-700/50">
                <FileSpreadsheet size={15} /> GURUHLI IMPORT (.TXT)
              </button>
            </div>
          )}
          {activeTab === 'groups' && canManage && (
            <button onClick={openAddGroup} className="flex items-center gap-1.5 px-4 py-2.5 bg-indigo-650 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow shadow-indigo-500/10 cursor-pointer">
              <Plus size={15} /> GURUH YARATISH
            </button>
          )}
          {activeTab === 'mentors' && mentorSubTab === 'crud' && canManage && (
            <button onClick={openAddMentor} className="flex items-center gap-1.5 px-4 py-2.5 bg-indigo-650 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow shadow-indigo-500/10 cursor-pointer">
              <Plus size={15} /> MENTOR YARATISH
            </button>
          )}
          {activeTab === 'courses' && canManage && (
            <button onClick={openAddCourse} className="flex items-center gap-1.5 px-4 py-2.5 bg-indigo-650 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow shadow-indigo-500/10 cursor-pointer">
              <Plus size={15} /> KURS QO'SHISH
            </button>
          )}
          {activeTab === 'admins' && isSuperAdmin && (
            <button onClick={openAddAdmin} className="flex items-center gap-1.5 px-4 py-2.5 bg-indigo-650 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow shadow-indigo-500/10 cursor-pointer">
              <Plus size={15} /> ADMIN QO'SHISH
            </button>
          )}
        </div>
      </div>

      {/* Main Tab Navigation Buttons */}
      <div className="flex border-b border-slate-800">
        <button
          onClick={() => setActiveTab('students')}
          className={`px-6 py-3 font-semibold text-sm border-b-2 transition-all cursor-pointer ${
            activeTab === 'students' 
              ? 'border-indigo-500 text-indigo-400' 
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          O'quvchilar
        </button>
        <button
          onClick={() => setActiveTab('groups')}
          className={`px-6 py-3 font-semibold text-sm border-b-2 transition-all cursor-pointer ${
            activeTab === 'groups' 
              ? 'border-indigo-500 text-indigo-400' 
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Guruhlar
        </button>
        <button
          onClick={() => setActiveTab('mentors')}
          className={`px-6 py-3 font-semibold text-sm border-b-2 transition-all cursor-pointer ${
            activeTab === 'mentors' 
              ? 'border-indigo-500 text-indigo-400' 
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Mentorlar
        </button>
        <button
          onClick={() => setActiveTab('courses')}
          className={`px-6 py-3 font-semibold text-sm border-b-2 transition-all cursor-pointer ${
            activeTab === 'courses' 
              ? 'border-indigo-500 text-indigo-400' 
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Kurslar
        </button>
        {isSuperAdmin && (
          <button
            onClick={() => setActiveTab('admins')}
            className={`px-6 py-3 font-semibold text-sm border-b-2 transition-all cursor-pointer ${
              activeTab === 'admins' 
                ? 'border-indigo-500 text-indigo-400' 
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Adminlar
          </button>
        )}
      </div>

      {/* Tab Panels */}
      {loading ? (
        <div className="p-20 text-center text-slate-500">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-indigo-500 mx-auto mb-2"></div>
          Ma'lumotlar yuklanmoqda...
        </div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
          {/* Panel: Students */}
          {activeTab === 'students' && (
            <div>
              {/* Search bar */}
              <div className="p-4 border-b border-slate-800">
                <div className="relative max-w-md">
                  <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="text"
                    placeholder="Ism, guruh yoki o'qituvchi bo'yicha qidirish..."
                    value={studentSearch}
                    onChange={e => setStudentSearch(e.target.value)}
                    className="w-full h-9 pl-9 pr-4 bg-slate-950/60 border border-slate-700 rounded-xl text-slate-200 focus:outline-none focus:border-indigo-500 text-sm placeholder:text-slate-500"
                  />
                  {studentSearch && (
                    <button onClick={() => setStudentSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
                      <X size={14} />
                    </button>
                  )}
                </div>
                {studentSearch && <p className="text-xs text-slate-500 mt-1.5">{filteredStudents.length} ta natija topildi</p>}
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-950/40 text-[10px] font-bold text-slate-400 tracking-wider uppercase">
                      <th className="py-4 px-6">TALABA</th>
                      <th className="py-4 px-6">GURUH</th>
                      <th className="py-4 px-6 text-center">JAMI XP</th>
                      {canManage && <th className="py-4 px-6 text-center">HARAKATLAR</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-slate-300 text-sm">
                    {filteredStudents.length === 0 ? (
                      <tr><td colSpan={canManage ? 4 : 3} className="py-10 text-center text-slate-500">
                        <Search size={32} className="mx-auto mb-2 opacity-30" />
                        {studentSearch ? `"${studentSearch}" bo'yicha natija topilmadi` : "O'quvchilar yo'q"}
                      </td></tr>
                    ) : (
                      filteredStudents.map(s => (
                        <tr key={s.id} className="hover:bg-slate-850/20 transition-all">
                          <td className="py-4 px-6 font-bold text-slate-100">{s.fullName}</td>
                          <td className="py-4 px-6 font-semibold uppercase text-xs text-slate-400">{s.groupName}</td>
                          <td className="py-4 px-6 text-center">
                            <span className="font-extrabold text-indigo-400 bg-indigo-500/10 px-2.5 py-1 rounded-lg border border-indigo-500/10 text-xs">
                              {s.xp} XP
                            </span>
                          </td>
                          {canManage && (
                            <td className="py-4 px-6">
                              <div className="flex items-center justify-center gap-2">
                                <button onClick={() => openEditStudent(s)} className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-indigo-650 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer transition-colors border border-slate-700/50">
                                  <Edit3 size={13} />
                                </button>
                                <button onClick={() => handleArchiveStudent(s.id)} className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-rose-600/15 border border-slate-700/50 hover:border-rose-500/25 text-slate-400 hover:text-rose-400 flex items-center justify-center cursor-pointer transition-colors">
                                  <Archive size={13} />
                                </button>
                              </div>
                            </td>
                          )}
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Panel: Groups */}
          {activeTab === 'groups' && (
            <div>
              {/* Search bar */}
              <div className="p-4 border-b border-slate-800">
                <div className="relative max-w-md">
                  <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="text"
                    placeholder="Guruh nomi, o'qituvchi yoki kurs bo'yicha qidirish..."
                    value={groupSearch}
                    onChange={e => setGroupSearch(e.target.value)}
                    className="w-full h-9 pl-9 pr-4 bg-slate-950/60 border border-slate-700 rounded-xl text-slate-200 focus:outline-none focus:border-indigo-500 text-sm placeholder:text-slate-500"
                  />
                  {groupSearch && (
                    <button onClick={() => setGroupSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
                      <X size={14} />
                    </button>
                  )}
                </div>
                {groupSearch && <p className="text-xs text-slate-500 mt-1.5">{filteredGroups.length} ta natija topildi</p>}
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-950/40 text-[10px] font-bold text-slate-400 tracking-wider uppercase">
                      <th className="py-4 px-6">GURUH NOMI</th>
                      <th className="py-4 px-6">KURS</th>
                      <th className="py-4 px-6">MENTOR</th>
                      {canManage && <th className="py-4 px-6 text-center">HARAKATLAR</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-slate-300 text-sm">
                    {filteredGroups.length === 0 ? (
                      <tr><td colSpan={canManage ? 4 : 3} className="py-10 text-center text-slate-500">
                        <Search size={32} className="mx-auto mb-2 opacity-30" />
                        {groupSearch ? `"${groupSearch}" bo'yicha natija topilmadi` : "Guruhlar yo'q"}
                      </td></tr>
                    ) : (
                      filteredGroups.map(g => (
                        <tr key={g.id} className="hover:bg-slate-850/20 transition-all">
                          <td className="py-4 px-6 font-bold text-slate-100">{g.name}</td>
                          <td className="py-4 px-6 font-semibold text-slate-400">{g.courseName}</td>
                          <td className="py-4 px-6 font-semibold text-slate-400">{g.mentorName}</td>
                          {canManage && (
                            <td className="py-4 px-6">
                              <div className="flex items-center justify-center gap-2">
                                <button onClick={() => openEditGroup(g)} className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-indigo-650 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer transition-colors border border-slate-700/50">
                                  <Edit3 size={13} />
                                </button>
                                <button onClick={() => handleArchiveGroup(g.id)} className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-rose-600/15 border border-slate-700/50 hover:border-rose-500/25 text-slate-400 hover:text-rose-400 flex items-center justify-center cursor-pointer transition-colors">
                                  <Archive size={13} />
                                </button>
                              </div>
                            </td>
                          )}
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Panel: Mentors */}
          {activeTab === 'mentors' && (
            <div className="p-6 space-y-6">
              {/* Mentor Sub-tabs */}
              <div className="flex bg-slate-950/30 p-1 border border-slate-800 rounded-xl max-w-sm">
                <button
                  onClick={() => setMentorSubTab('monitor')}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-semibold cursor-pointer text-center ${
                    mentorSubTab === 'monitor' 
                      ? 'bg-indigo-600 text-white shadow' 
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Faoliyat Monitoringi
                </button>
                <button
                  onClick={() => setMentorSubTab('crud')}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-semibold cursor-pointer text-center ${
                    mentorSubTab === 'crud' 
                      ? 'bg-indigo-600 text-white shadow' 
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Boshqaruv Ro'yxati
                </button>
              </div>

              {mentorSubTab === 'monitor' ? (
                <MentorMonitor />
              ) : (
                <div className="rounded-xl border border-slate-800/80 overflow-hidden">
                  {/* Search bar */}
                  <div className="p-4 border-b border-slate-800 bg-slate-950/20">
                    <div className="relative max-w-md">
                      <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                      <input
                        type="text"
                        placeholder="Mentor ismi yoki username bo'yicha qidirish..."
                        value={mentorSearch}
                        onChange={e => setMentorSearch(e.target.value)}
                        className="w-full h-9 pl-9 pr-4 bg-slate-950/60 border border-slate-700 rounded-xl text-slate-200 focus:outline-none focus:border-indigo-500 text-sm placeholder:text-slate-500"
                      />
                      {mentorSearch && (
                        <button onClick={() => setMentorSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
                          <X size={14} />
                        </button>
                      )}
                    </div>
                    {mentorSearch && <p className="text-xs text-slate-500 mt-1.5">{filteredMentors.length} ta natija topildi</p>}
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-800 bg-slate-950/50 text-[10px] font-bold text-slate-400 tracking-wider uppercase">
                          <th className="py-4 px-6">MENTOR F.I.O</th>
                          <th className="py-4 px-6">USERNAME</th>
                          <th className="py-4 px-6">GURUHLARI</th>
                          {canManage && <th className="py-4 px-6 text-center">HARAKATLAR</th>}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-850 text-slate-300 text-sm">
                        {filteredMentors.length === 0 ? (
                          <tr><td colSpan={canManage ? 4 : 3} className="py-10 text-center text-slate-500">
                            <Search size={32} className="mx-auto mb-2 opacity-30" />
                            {mentorSearch ? `"${mentorSearch}" bo'yicha natija topilmadi` : "Mentorlar yo'q"}
                          </td></tr>
                        ) : (
                          filteredMentors.map(m => (
                            <tr key={m.id} className="hover:bg-slate-850/20 transition-all">
                              <td className="py-4 px-6 font-bold text-slate-100">{m.fullName}</td>
                              <td className="py-4 px-6 font-semibold text-slate-400">{m.username}</td>
                              <td className="py-4 px-6">
                                <div className="flex flex-wrap gap-1">
                                  {m.groups.length === 0 ? (
                                    <span className="text-slate-500 font-semibold text-xs">Yo'q</span>
                                  ) : (
                                    m.groups.map((g, i) => (
                                      <span key={i} className="bg-slate-800 text-slate-400 border border-slate-750 px-2 py-0.5 rounded text-[10px] font-bold uppercase">
                                        {g}
                                      </span>
                                    ))
                                  )}
                                </div>
                              </td>
                              {canManage && (
                                <td className="py-4 px-6">
                                  <div className="flex items-center justify-center gap-2">
                                    <button onClick={() => openEditMentor(m)} className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-indigo-650 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer transition-colors border border-slate-700/50">
                                      <Edit3 size={13} />
                                    </button>
                                    <button onClick={() => handleArchiveMentor(m.id)} className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-rose-600/15 border border-slate-700/50 hover:border-rose-500/25 text-slate-400 hover:text-rose-400 flex items-center justify-center cursor-pointer transition-colors">
                                      <Archive size={13} />
                                    </button>
                                  </div>
                                </td>
                              )}
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Panel: Courses */}
          {activeTab === 'courses' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-950/40 text-[10px] font-bold text-slate-400 tracking-wider uppercase">
                    <th className="py-4 px-6">KURS NOMI</th>
                    <th className="py-4 px-6 text-center">YARATILGAN SANA</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300 text-sm">
                  {courses.length === 0 ? (
                    <tr><td colSpan="2" className="py-8 text-center text-slate-500 font-semibold">Kurslar yo'q</td></tr>
                  ) : (
                    courses.map(c => (
                      <tr key={c.id} className="hover:bg-slate-850/20 transition-all">
                        <td className="py-4 px-6 font-bold text-slate-100">{c.name}</td>
                        <td className="py-4 px-6 text-center font-semibold text-slate-400">
                          {c.createdAt ? new Date(c.createdAt).toLocaleDateString() : "Noma'lum"}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Panel: Admins */}
          {activeTab === 'admins' && isSuperAdmin && (
            <div>
              {/* Search bar */}
              <div className="p-4 border-b border-slate-800">
                <div className="relative max-w-md">
                  <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="text"
                    placeholder="Admin ismi yoki username bo'yicha qidirish..."
                    value={adminSearch}
                    onChange={e => setAdminSearch(e.target.value)}
                    className="w-full h-9 pl-9 pr-4 bg-slate-950/60 border border-slate-700 rounded-xl text-slate-200 focus:outline-none focus:border-indigo-500 text-sm placeholder:text-slate-500"
                  />
                  {adminSearch && (
                    <button onClick={() => setAdminSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
                      <X size={14} />
                    </button>
                  )}
                </div>
                {adminSearch && <p className="text-xs text-slate-500 mt-1.5">{filteredAdmins.length} ta natija topildi</p>}
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-950/40 text-[10px] font-bold text-slate-400 tracking-wider uppercase">
                      <th className="py-4 px-6">TO'LIQ ISM</th>
                      <th className="py-4 px-6">USERNAME</th>
                      <th className="py-4 px-6 text-center">HARAKATLAR</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-slate-300 text-sm">
                    {filteredAdmins.length === 0 ? (
                      <tr><td colSpan="3" className="py-10 text-center text-slate-500 font-semibold">
                        <Search size={32} className="mx-auto mb-2 opacity-30" />
                        {adminSearch ? `"${adminSearch}" bo'yicha natija topilmadi` : "Adminlar yo'q"}
                      </td></tr>
                    ) : (
                      filteredAdmins.map(a => (
                        <tr key={a.id} className="hover:bg-slate-850/20 transition-all">
                          <td className="py-4 px-6 font-bold text-slate-100">{a.fullName}</td>
                          <td className="py-4 px-6 font-semibold text-slate-400">{a.username}</td>
                          <td className="py-4 px-6">
                            <div className="flex items-center justify-center gap-2">
                              <button onClick={() => openEditAdmin(a)} className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-indigo-650 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer transition-colors border border-slate-700/50">
                                <Edit3 size={13} />
                              </button>
                              <button onClick={() => handleDeleteAdmin(a.id)} className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-rose-600/15 border border-slate-700/50 hover:border-rose-500/25 text-slate-400 hover:text-rose-400 flex items-center justify-center cursor-pointer transition-colors">
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* --- MODAL DIALOGS --- */}

      {/* Modal: Student CRUD */}
      {showStudentModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <form onSubmit={handleStudentSubmit} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-extrabold text-white text-base">
                {editingItem ? "Talabani Tahrirlash" : "Yangi Talaba Qo'shish"}
              </h3>
              <button type="button" onClick={handleCloseModals} className="text-slate-400 hover:text-white cursor-pointer"><X size={18} /></button>
            </div>

            {errorMessage && <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-lg text-rose-400 text-xs font-semibold">{errorMessage}</div>}
            {successMessage && <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-400 text-xs font-semibold">{successMessage}</div>}

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">ISM</label>
                <input
                  type="text"
                  required
                  value={studentForm.firstName}
                  onChange={(e) => setStudentForm({ ...studentForm, firstName: e.target.value })}
                  className="w-full h-10 px-3 bg-slate-850 border border-slate-800 rounded-lg text-slate-200 text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">FAMILIYA</label>
                <input
                  type="text"
                  required
                  value={studentForm.lastName}
                  onChange={(e) => setStudentForm({ ...studentForm, lastName: e.target.value })}
                  className="w-full h-10 px-3 bg-slate-850 border border-slate-800 rounded-lg text-slate-200 text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">GURUH (BIRIKTIRISH)</label>
                <CustomSelect
                  value={studentForm.groupId}
                  onChange={(val) => setStudentForm({ ...studentForm, groupId: val })}
                  options={groups.map(g => ({ value: g.id, label: g.name }))}
                  placeholder="Guruhsiz qoldirish"
                  className="w-full"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">FOYDALANUVCHI NOMI (USERNAME)</label>
                  <input
                    type="text"
                    value={studentForm.username}
                    onChange={(e) => setStudentForm({ ...studentForm, username: e.target.value })}
                    placeholder="ixtiyoriy (auto-generate)"
                    className="w-full h-10 px-3 bg-slate-850 border border-slate-800 rounded-lg text-slate-200 text-sm focus:outline-none focus:border-indigo-500 font-mono text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">PAROL</label>
                  <input
                    type="password"
                    value={studentForm.password}
                    onChange={(e) => setStudentForm({ ...studentForm, password: e.target.value })}
                    placeholder={editingItem ? "o'zgarishsiz qoldirish" : "default: student123"}
                    className="w-full h-10 px-3 bg-slate-850 border border-slate-800 rounded-lg text-slate-200 text-sm focus:outline-none focus:border-indigo-500 text-xs"
                  />
                </div>
              </div>

              {!editingItem && (
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">BOSHLANG'ICH BALL (TIZIMDAN OLDINGI)</label>
                  <input
                    type="number"
                    value={studentForm.initialPoints || ''}
                    onChange={(e) => setStudentForm({ ...studentForm, initialPoints: e.target.value })}
                    placeholder="Masalan: 150 (ball)"
                    className="w-full h-10 px-3 bg-slate-850 border border-slate-800 rounded-lg text-slate-200 text-sm focus:outline-none focus:border-indigo-500"
                  />
                </div>
              )}
            </div>

            <div className="pt-4 flex gap-3">
              <button type="button" onClick={handleCloseModals} className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-750 text-slate-300 font-semibold rounded-lg text-xs cursor-pointer border border-slate-700/50">Bekor qilish</button>
              <button type="submit" className="flex-1 py-2.5 bg-indigo-650 hover:bg-indigo-500 text-white font-semibold rounded-lg text-xs cursor-pointer shadow shadow-indigo-500/10">Saqlash</button>
            </div>
          </form>
        </div>
      )}

      {/* Modal: Group CRUD */}
      {showGroupModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <form onSubmit={handleGroupSubmit} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-extrabold text-white text-base">
                {editingItem ? "Guruhni Tahrirlash" : "Yangi Guruh Yaratish"}
              </h3>
              <button type="button" onClick={handleCloseModals} className="text-slate-400 hover:text-white cursor-pointer"><X size={18} /></button>
            </div>

            {errorMessage && <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-lg text-rose-400 text-xs font-semibold">{errorMessage}</div>}
            {successMessage && <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-400 text-xs font-semibold">{successMessage}</div>}

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">GURUH NOMI</label>
                <input
                  type="text"
                  required
                  placeholder="Masalan: JAVA 18:00"
                  value={groupForm.name}
                  onChange={(e) => setGroupForm({ ...groupForm, name: e.target.value })}
                  className="w-full h-10 px-3 bg-slate-850 border border-slate-800 rounded-lg text-slate-200 text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">KURS</label>
                <CustomSelect
                  value={groupForm.courseId}
                  onChange={(val) => setGroupForm({ ...groupForm, courseId: val })}
                  options={courses.map(c => ({ value: c.id, label: c.name }))}
                  placeholder="Kursni tanlang"
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">MENTOR</label>
                <CustomSelect
                  value={groupForm.mentorId}
                  onChange={(val) => setGroupForm({ ...groupForm, mentorId: val })}
                  options={mentors.map(m => ({ value: m.id, label: m.fullName }))}
                  placeholder="Mentorsiz"
                  className="w-full"
                />
              </div>
            </div>

            <div className="pt-4 flex gap-3">
              <button type="button" onClick={handleCloseModals} className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-750 text-slate-300 font-semibold rounded-lg text-xs cursor-pointer border border-slate-700/50">Bekor qilish</button>
              <button type="submit" className="flex-1 py-2.5 bg-indigo-650 hover:bg-indigo-500 text-white font-semibold rounded-lg text-xs cursor-pointer shadow shadow-indigo-500/10">Saqlash</button>
            </div>
          </form>
        </div>
      )}

      {/* Modal: Mentor CRUD */}
      {showMentorModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <form onSubmit={handleMentorSubmit} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-extrabold text-white text-base">
                {editingItem ? "Mentor Ma'lumotlarini Tahrirlash" : "Yangi Mentor Yaratish"}
              </h3>
              <button type="button" onClick={handleCloseModals} className="text-slate-400 hover:text-white cursor-pointer"><X size={18} /></button>
            </div>

            {errorMessage && <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-lg text-rose-400 text-xs font-semibold">{errorMessage}</div>}
            {successMessage && <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-400 text-xs font-semibold">{successMessage}</div>}

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">ISM FAMILIYA (F.I.O)</label>
                <input
                  type="text"
                  required
                  placeholder="Masalan: Sardorbek Aliyev"
                  value={mentorForm.fullName}
                  onChange={(e) => setMentorForm({ ...mentorForm, fullName: e.target.value })}
                  className="w-full h-10 px-3 bg-slate-850 border border-slate-800 rounded-lg text-slate-200 text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">FOYDALANUVCHI NOMI (USERNAME)</label>
                <input
                  type="text"
                  required
                  placeholder="Masalan: sardor_admin"
                  value={mentorForm.username}
                  onChange={(e) => setMentorForm({ ...mentorForm, username: e.target.value })}
                  className="w-full h-10 px-3 bg-slate-850 border border-slate-800 rounded-lg text-slate-200 text-sm focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">PAROL</label>
                <input
                  type="password"
                  required={!editingItem}
                  placeholder={editingItem ? "o'zgarishsiz qoldirish" : "Parolni yozing..."}
                  value={mentorForm.password}
                  onChange={(e) => setMentorForm({ ...mentorForm, password: e.target.value })}
                  className="w-full h-10 px-3 bg-slate-850 border border-slate-800 rounded-lg text-slate-200 text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="pt-4 flex gap-3">
              <button type="button" onClick={handleCloseModals} className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-750 text-slate-300 font-semibold rounded-lg text-xs cursor-pointer border border-slate-700/50">Bekor qilish</button>
              <button type="submit" className="flex-1 py-2.5 bg-indigo-650 hover:bg-indigo-500 text-white font-semibold rounded-lg text-xs cursor-pointer shadow shadow-indigo-500/10">
                {editingItem ? "Saqlash" : "Mentor Yaratish"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal: Course CRUD */}
      {showCourseModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <form onSubmit={handleCourseSubmit} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-extrabold text-white text-base">Kurs Qo'shish</h3>
              <button type="button" onClick={handleCloseModals} className="text-slate-400 hover:text-white cursor-pointer"><X size={18} /></button>
            </div>

            {errorMessage && <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-lg text-rose-400 text-xs font-semibold">{errorMessage}</div>}
            {successMessage && <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-400 text-xs font-semibold">{successMessage}</div>}

            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1">KURS NOMI</label>
              <input
                type="text"
                required
                placeholder="Masalan: FLUTTER"
                value={courseForm.name}
                onChange={(e) => setCourseForm({ ...courseForm, name: e.target.value })}
                className="w-full h-10 px-3 bg-slate-850 border border-slate-800 rounded-lg text-slate-200 text-sm focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="pt-4 flex gap-3">
              <button type="button" onClick={handleCloseModals} className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-750 text-slate-300 font-semibold rounded-lg text-xs cursor-pointer border border-slate-700/50">Bekor qilish</button>
              <button type="submit" className="flex-1 py-2.5 bg-indigo-650 hover:bg-indigo-500 text-white font-semibold rounded-lg text-xs cursor-pointer shadow shadow-indigo-500/10">Saqlash</button>
            </div>
          </form>
        </div>
      )}

      {/* Modal: Admin CRUD */}
      {showAdminModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <form onSubmit={handleAdminSubmit} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-extrabold text-white text-base">
                {editingItem ? "Admin Ma'lumotlarini Tahrirlash" : "Yangi Admin Yaratish"}
              </h3>
              <button type="button" onClick={handleCloseModals} className="text-slate-400 hover:text-white cursor-pointer"><X size={18} /></button>
            </div>

            {errorMessage && <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-lg text-rose-400 text-xs font-semibold">{errorMessage}</div>}
            {successMessage && <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-400 text-xs font-semibold">{successMessage}</div>}

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">ISM FAMILIYA (F.I.O)</label>
                <input
                  type="text"
                  required
                  placeholder="Masalan: Sardorbek Aliyev"
                  value={adminForm.fullName}
                  onChange={(e) => setAdminForm({ ...adminForm, fullName: e.target.value })}
                  className="w-full h-10 px-3 bg-slate-850 border border-slate-800 rounded-lg text-slate-200 text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">FOYDALANUVCHI NOMI (USERNAME)</label>
                <input
                  type="text"
                  required
                  placeholder="Masalan: sardor_admin"
                  value={adminForm.username}
                  onChange={(e) => setAdminForm({ ...adminForm, username: e.target.value })}
                  className="w-full h-10 px-3 bg-slate-850 border border-slate-800 rounded-lg text-slate-200 text-sm focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">PAROL</label>
                <input
                  type="password"
                  required={!editingItem}
                  placeholder={editingItem ? "o'zgarishsiz qoldirish" : "Parolni yozing..."}
                  value={adminForm.password}
                  onChange={(e) => setAdminForm({ ...adminForm, password: e.target.value })}
                  className="w-full h-10 px-3 bg-slate-850 border border-slate-800 rounded-lg text-slate-200 text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="pt-4 flex gap-3">
              <button type="button" onClick={handleCloseModals} className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-750 text-slate-300 font-semibold rounded-lg text-xs cursor-pointer border border-slate-700/50">Bekor qilish</button>
              <button type="submit" className="flex-1 py-2.5 bg-indigo-650 hover:bg-indigo-500 text-white font-semibold rounded-lg text-xs cursor-pointer shadow shadow-indigo-500/10">
                {editingItem ? "Saqlash" : "Admin Yaratish"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal: Bulk Import */}
      {showBulkModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <form onSubmit={handleBulkSubmit} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-lg w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-extrabold text-white text-base">Guruhli Import (.txt format)</h3>
              <button type="button" onClick={handleCloseModals} className="text-slate-400 hover:text-white cursor-pointer"><X size={18} /></button>
            </div>

            {errorMessage && <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-lg text-rose-400 text-xs font-semibold">{errorMessage}</div>}
            {successMessage && <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-400 text-xs font-semibold">{successMessage}</div>}

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">GURUHGA BIRIKTIRISH</label>
                <CustomSelect
                  value={bulkForm.groupId}
                  onChange={(val) => setBulkForm({ ...bulkForm, groupId: val })}
                  options={groups.map(g => ({ value: g.id, label: g.name }))}
                  placeholder="Guruh tanlang"
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">O'QUVCHILAR RO'YXATI (PASTE / MATN)</label>
                <div className="text-[10px] text-slate-500 mb-2 leading-relaxed">
                  Har bir qatorga bitta o'quvchini yozing. Format:<br />
                  <code className="text-indigo-400 font-semibold">Ism Familiya -&gt; 3, 10, 3, 10</code> (ballarni yig'indi qiladi)<br />
                  <code className="text-indigo-400 font-semibold">Ism Familiya -&gt; 150</code> (to'g'ridan-to'g'ri ball kiritish)<br />
                  <code className="text-indigo-400 font-semibold">Ism Familiya</code> (0 ball bilan boshlaydi)
                </div>
                <textarea
                  required
                  rows={8}
                  placeholder="Nuriddinov Bekzod -> 3, 10, 3, 10&#10;Sirojova Fayoza -> 150&#10;Ali Valiyev"
                  value={bulkForm.text}
                  onChange={(e) => setBulkForm({ ...bulkForm, text: e.target.value })}
                  className="w-full p-3 bg-slate-850 border border-slate-800 rounded-lg text-slate-200 text-sm focus:outline-none focus:border-indigo-500 font-mono text-xs leading-relaxed"
                />
              </div>
            </div>

            <div className="pt-4 flex gap-3">
              <button type="button" onClick={handleCloseModals} className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-750 text-slate-300 font-semibold rounded-lg text-xs cursor-pointer border border-slate-700/50">Bekor qilish</button>
              <button type="submit" className="flex-1 py-2.5 bg-indigo-650 hover:bg-indigo-500 text-white font-semibold rounded-lg text-xs cursor-pointer shadow shadow-indigo-500/10">Importni boshlash</button>
            </div>
          </form>
        </div>
      )}

      {/* Custom Delete Confirmation Modal */}
      {deleteConfirm.show && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-[110] p-4 animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-sm w-full shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-500">
              <div className="p-2 bg-rose-500/10 rounded-lg">
                <AlertTriangle size={20} />
              </div>
              <h3 className="font-extrabold text-white text-base">Arxivlashni tasdiqlang</h3>
            </div>
            <p className="text-slate-300 text-xs font-semibold leading-relaxed">
              {deleteConfirm.message}
            </p>
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirm({ show: false, id: null, type: '', message: '' })}
                className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-750 text-slate-300 font-semibold rounded-lg text-xs cursor-pointer border border-slate-700/50"
              >
                Bekor qilish
              </button>
              <button
                type="button"
                onClick={executeArchive}
                className="flex-1 py-2.5 bg-rose-650 hover:bg-rose-600 text-white font-semibold rounded-lg text-xs cursor-pointer shadow shadow-rose-500/10"
              >
                Tasdiqlash
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
