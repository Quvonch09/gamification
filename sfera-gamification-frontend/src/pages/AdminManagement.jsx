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
  Search,
  DoorOpen,
  Clock,
  Calendar,
  Phone,
  User,
  CheckCircle2,
  RotateCcw,
  ArrowRightLeft,
  FolderGit,
  CheckSquare,
  Square,
  RefreshCw
} from 'lucide-react';
import MentorMonitor from './MentorMonitor';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import CustomSelect from '../components/CustomSelect';

const DAYS_OPTIONS = [
  { value: 'DUSHANBA_CHORSHANBA_JUMA', label: 'Dushanba - Chorshanba - Juma (Toq kunlar)' },
  { value: 'SESHANBA_PAYSHANBA_SHANBA', label: 'Seshanba - Payshanba - Shanba (Juft kunlar)' },
  { value: 'HAR_KUNI', label: 'Har kuni (Dushanba - Shanba)' },
  { value: 'DAM_OLISH', label: 'Shanba - Yakshanba (Weekend)' },
  { value: 'MAXSUS', label: 'Maxsus kunlar' }
];

export default function AdminManagement({ activeSubTab }) {
  const { user } = useAuth();
  const { groups, courses, mentors, refreshData } = useData();
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'BRANCH_ADMIN' || user?.role === 'OPERATOR';
  const canManage = isSuperAdmin || user?.role === 'BRANCH_ADMIN' || user?.role === 'ADMIN';

  // Tabs: students, groups, rooms, mentors, courses, admins
  const [activeTab, setActiveTab] = useState(activeSubTab || 'students');
  
  // Lists
  const [students, setStudents] = useState([]);
  const [adminsList, setAdminsList] = useState([]);
  const [roomsList, setRoomsList] = useState([]);
  
  // Loaders
  const [loading, setLoading] = useState(false);

  // Modals state
  const [showStudentModal, setShowStudentModal] = useState(false);
  const [savingStudent, setSavingStudent] = useState(false);
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [showRoomModal, setShowRoomModal] = useState(false);
  const [showMentorModal, setShowMentorModal] = useState(false);
  const [showCourseModal, setShowCourseModal] = useState(false);
  const [showAdminModal, setShowAdminModal] = useState(false);

  // Bulk & Student Actions state
  const [selectedStudentIds, setSelectedStudentIds] = useState([]);
  const [showTransferGroupModal, setShowTransferGroupModal] = useState(false);
  const [transferTargetStudent, setTransferTargetStudent] = useState(null); // null means BULK
  const [targetGroupId, setTargetGroupId] = useState('');
  
  const [showResetPointsModal, setShowResetPointsModal] = useState(false);
  const [resetPointsTargetStudent, setResetPointsTargetStudent] = useState(null); // null means BULK
  const [resetReason, setResetReason] = useState('');

  const [showBulkDeleteConfirmModal, setShowBulkDeleteConfirmModal] = useState(false);

  // Edit states
  const [editingItem, setEditingItem] = useState(null);

  // Form Fields
  const [studentForm, setStudentForm] = useState({
    firstName: '',
    lastName: '',
    groupId: '',
    username: '',
    password: '',
    initialPoints: '',
    phone: '',
    parentName: '',
    parentPhone: ''
  });

  const [groupForm, setGroupForm] = useState({
    name: '',
    courseId: '',
    mentorId: '',
    roomId: '',
    daysOfWeek: 'DUSHANBA_CHORSHANBA_JUMA',
    startTime: '18:00',
    endTime: '20:00',
    lessonsPerMonth: 12
  });

  const [roomForm, setRoomForm] = useState({
    name: '',
    capacity: 15,
    description: '',
    status: 'ACTIVE'
  });

  const [mentorForm, setMentorForm] = useState({ fullName: '', username: '', password: '' });
  const [courseForm, setCourseForm] = useState({ name: '' });
  const [adminForm, setAdminForm] = useState({ fullName: '', username: '', password: '', role: 'ADMIN' });
  const [adminRoleFilter, setAdminRoleFilter] = useState('ALL');

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
  const [roomSearch, setRoomSearch] = useState('');
  const [mentorSearch, setMentorSearch] = useState('');
  const [adminSearch, setAdminSearch] = useState('');

  // Custom Delete Confirm modal state
  const [deleteConfirm, setDeleteConfirm] = useState({
    show: false,
    id: null,
    type: '', // 'student' | 'group' | 'room' | 'mentor' | 'admin-user'
    message: ''
  });

  useEffect(() => {
    if (activeTab === 'admins' && isSuperAdmin) {
      loadAdmins();
    } else if (activeTab === 'rooms') {
      loadRooms();
    } else {
      loadAllData();
      loadRooms();
    }
  }, [activeTab]);

  const loadAllData = () => {
    setLoading(true);
    axios.get('/api/students')
      .then(res => {
        setStudents(res.data || []);
      })
      .catch(err => {
        console.error("Error loading students data", err);
        setErrorMessage("Talabalar ma'lumotlarini yuklashda xatolik yuz berdi.");
      })
      .finally(() => setLoading(false));
  };

  const loadRooms = () => {
    axios.get('/api/rooms')
      .then(res => {
        setRoomsList(res.data || []);
      })
      .catch(err => console.error("Error loading rooms", err));
  };

  const loadAdmins = () => {
    setLoading(true);
    axios.get('/api/admin-users')
      .then(res => {
        setAdminsList(res.data || []);
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
    setShowRoomModal(false);
    setShowMentorModal(false);
    setShowCourseModal(false);
    setShowAdminModal(false);
    setShowBulkModal(false);
    setEditingItem(null);
    setErrorMessage('');
    setSuccessMessage('');
    // Clear forms
    setStudentForm({ firstName: '', lastName: '', groupId: '', initialPoints: '', username: '', password: '', phone: '', parentName: '', parentPhone: '' });
    setGroupForm({ name: '', courseId: '', mentorId: '', roomId: '', daysOfWeek: 'DUSHANBA_CHORSHANBA_JUMA', startTime: '18:00', endTime: '20:00', lessonsPerMonth: 12 });
    setRoomForm({ name: '', capacity: 15, description: '', status: 'ACTIVE' });
    setMentorForm({ fullName: '', username: '', password: '' });
    setCourseForm({ name: '' });
    setAdminForm({ fullName: '', username: '', password: '', role: 'ADMIN' });
    setBulkForm({ groupId: groups[0]?.id || '', text: '' });
  };

  // --- ADMIN / USER ACTIONS ---
  const openAddAdmin = () => {
    setEditingItem(null);
    setAdminForm({ fullName: '', username: '', password: '', role: 'ADMIN' });
    setShowAdminModal(true);
  };

  const openEditAdmin = (a) => {
    setEditingItem(a);
    setAdminForm({ fullName: a.fullName, username: a.username, password: '', role: a.role || 'ADMIN' });
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
        setSuccessMessage(editingItem ? "Foydalanuvchi ma'lumotlari yangilandi!" : "Yangi foydalanuvchi muvaffaqiyatli qo'shildi!");
        loadAdmins();
        setTimeout(handleCloseModals, 1200);
      })
      .catch(err => {
        console.error(err);
        setErrorMessage(err.response?.data || "Foydalanuvchini saqlashda xatolik yuz berdi.");
      });
  };

  const handleDeleteAdmin = (id) => {
    setDeleteConfirm({
      show: true,
      id,
      type: 'admin-user',
      message: "Ushbu foydalanuvchini o'chirib tashlamoqchimisiz? Ushbu amal ortga qaytarilmaydi!"
    });
  };

  // --- STUDENT ACTIONS ---
  const openAddStudent = () => {
    setEditingItem(null);
    setStudentForm({
      firstName: '',
      lastName: '',
      groupId: groups[0]?.id || '',
      initialPoints: '',
      username: '',
      password: '',
      phone: '',
      parentName: '',
      parentPhone: '',
      customPrice: ''
    });
    setShowStudentModal(true);
  };

  const openEditStudent = (s) => {
    setEditingItem(s);
    setStudentForm({
      firstName: s.firstName || '',
      lastName: s.lastName || '',
      groupId: s.groupId || '',
      initialPoints: '',
      username: s.username || '',
      password: '',
      phone: s.phone || '',
      parentName: s.parentName || '',
      parentPhone: s.parentPhone || '',
      customPrice: s.customPrice || ''
    });
    setShowStudentModal(true);
  };

  const handleStudentSubmit = (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');
    setSavingStudent(true);

    let formPayload = { ...studentForm };
    if (formPayload.customPrice) {
      const num = parseInt(String(formPayload.customPrice).replace(/\D/g, ''), 10);
      if (!isNaN(num) && num > 0) {
        formPayload.customPrice = num < 10000 ? String(num * 1000) : String(num);
      }
    }

    const apiCall = editingItem
      ? axios.put(`/api/students/${editingItem.id}`, formPayload)
      : axios.post('/api/students', formPayload);

    apiCall
      .then(() => {
        setSuccessMessage(editingItem ? "O'quvchi ma'lumotlari yangilandi!" : "Yangi o'quvchi muvaffaqiyatli qo'shildi!");
        refreshData();
        loadAllData();
        setTimeout(handleCloseModals, 1000);
      })
      .catch(err => {
        console.error(err);
        let msg = "Amalni bajarishda xatolik yuz berdi.";
        if (err.response?.status === 403) {
          msg = "Ushbu login (username) allaqachon boshqa talabaga tegishli yoki ruxsat cheklangan. Iltimos, boshqa login kiriting.";
        } else if (err.response?.status === 400) {
          msg = (typeof err.response?.data === 'string' && err.response.data.trim())
            ? err.response.data
            : err.response?.data?.message || "Kiritilgan ma'lumotlar noto'g'ri.";
        } else if (typeof err.response?.data === 'string' && err.response.data.trim()) {
          msg = err.response.data;
        }
        setErrorMessage(msg);
      })
      .finally(() => {
        setSavingStudent(false);
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
    setGroupForm({
      name: '',
      courseId: courses[0]?.id || '',
      mentorId: mentors[0]?.id || '',
      roomId: roomsList[0]?.id || '',
      daysOfWeek: 'DUSHANBA_CHORSHANBA_JUMA',
      startTime: '18:00',
      endTime: '20:00',
      lessonsPerMonth: 12
    });
    setShowGroupModal(true);
  };

  const openEditGroup = (g) => {
    setEditingItem(g);
    setGroupForm({
      name: g.name,
      courseId: g.courseId || '',
      mentorId: g.mentorId || '',
      roomId: g.roomId || '',
      daysOfWeek: g.daysOfWeek || 'DUSHANBA_CHORSHANBA_JUMA',
      startTime: g.startTime || '18:00',
      endTime: g.endTime || '20:00',
      lessonsPerMonth: g.lessonsPerMonth || 12
    });
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
        setErrorMessage(err.response?.data || "Guruhni saqlashda xatolik yuz berdi.");
      });
  };

  const handleArchiveGroup = (id) => {
    setDeleteConfirm({
      show: true,
      id,
      type: 'group',
      message: "Ushbu guruhni arxivlamoqchimisiz? Guruhdagi talabalar guruhsiz qoladi."
    });
  };

  // --- ROOM ACTIONS ---
  const openAddRoom = () => {
    setEditingItem(null);
    setRoomForm({ name: '', capacity: 15, description: '', status: 'ACTIVE' });
    setShowRoomModal(true);
  };

  const openEditRoom = (room) => {
    setEditingItem(room);
    setRoomForm({
      name: room.name,
      capacity: room.capacity || 15,
      description: room.description || '',
      status: room.status || 'ACTIVE'
    });
    setShowRoomModal(true);
  };

  const handleRoomSubmit = (e) => {
    e.preventDefault();
    setErrorMessage('');

    const apiCall = editingItem
      ? axios.put(`/api/rooms/${editingItem.id}`, roomForm)
      : axios.post('/api/rooms', roomForm);

    apiCall
      .then(() => {
        setSuccessMessage(editingItem ? "Xona yangilandi!" : "Yangi xona qo'shildi!");
        loadRooms();
        setTimeout(handleCloseModals, 1200);
      })
      .catch(err => {
        console.error(err);
        setErrorMessage(err.response?.data || "Xonani saqlashda xatolik yuz berdi.");
      });
  };

  const handleDeleteRoom = (id) => {
    setDeleteConfirm({
      show: true,
      id,
      type: 'room',
      message: "Ushbu xonani o'chirmoqchimisiz?"
    });
  };

  // --- MENTOR ACTIONS ---
  const openAddMentor = () => {
    setEditingItem(null);
    setMentorForm({ fullName: '', username: '', password: '', color: '#16a34a' });
    setShowMentorModal(true);
  };

  const openEditMentor = (m) => {
    setEditingItem(m);
    setMentorForm({ fullName: m.fullName, username: m.username, password: '', color: m.color || '#16a34a' });
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
    setEditingItem(null);
    setCourseForm({ name: '', price: '', durationMonths: 1 });
    setShowCourseModal(true);
  };

  const openEditCourse = (c) => {
    setEditingItem(c);
    setCourseForm({
      name: c.name || '',
      price: c.price || '',
      durationMonths: c.durationMonths || 1
    });
    setShowCourseModal(true);
  };

  const handleCourseSubmit = (e) => {
    e.preventDefault();
    setErrorMessage('');

    let formPayload = { ...courseForm };
    if (formPayload.price) {
      const num = parseInt(String(formPayload.price).replace(/\D/g, ''), 10);
      if (!isNaN(num) && num > 0) {
        formPayload.price = num < 10000 ? String(num * 1000) : String(num);
      }
    }

    const apiCall = editingItem
      ? axios.put(`/api/courses/${editingItem.id}`, formPayload)
      : axios.post('/api/courses', formPayload);

    apiCall
      .then(() => {
        setSuccessMessage(editingItem ? "Kurs yangilandi!" : "Kurs muvaffaqiyatli qo'shildi!");
        refreshData();
        loadAllData();
        setTimeout(handleCloseModals, 1200);
      })
      .catch(err => {
        console.error(err);
        setErrorMessage(err.response?.data || "Kursni saqlashda xatolik yuz berdi.");
      });
  };

  const handleDeleteCourse = (id) => {
    setDeleteConfirm({
      show: true,
      id,
      type: 'course',
      message: "Ushbu kursni o'chirmoqchimisiz? Kursga tegishli guruhlar kursiz qolishi mumkin."
    });
  };

  const executeArchive = () => {
    const { id, type } = deleteConfirm;
    let endpoint = '';
    if (type === 'student') endpoint = `/api/students/${id}`;
    if (type === 'group') endpoint = `/api/groups/${id}`;
    if (type === 'room') endpoint = `/api/rooms/${id}`;
    if (type === 'mentor') endpoint = `/api/mentors/${id}`;
    if (type === 'admin-user') endpoint = `/api/admin-users/${id}`;
    if (type === 'course') endpoint = `/api/courses/${id}`;

    axios.delete(endpoint)
      .then(() => {
        refreshData();
        if (type === 'admin-user') {
          loadAdmins();
        } else if (type === 'room') {
          loadRooms();
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

  // ---- Bulk & Single Action Handlers ----
  const toggleSelectAllStudents = () => {
    if (selectedStudentIds.length === filteredStudents.length && filteredStudents.length > 0) {
      setSelectedStudentIds([]);
    } else {
      setSelectedStudentIds(filteredStudents.map(s => s.id));
    }
  };

  const toggleSelectStudent = (id) => {
    if (selectedStudentIds.includes(id)) {
      setSelectedStudentIds(selectedStudentIds.filter(item => item !== id));
    } else {
      setSelectedStudentIds([...selectedStudentIds, id]);
    }
  };

  const openTransferGroup = (student = null) => {
    setTransferTargetStudent(student);
    setTargetGroupId(student?.groupId ? String(student.groupId) : '');
    setShowTransferGroupModal(true);
  };

  const handleTransferGroupSubmit = (e) => {
    e.preventDefault();
    if (!targetGroupId) return;

    if (transferTargetStudent) {
      axios.post(`/api/students/${transferTargetStudent.id}/change-group`, { groupId: targetGroupId })
        .then(() => {
          setSuccessMessage("Talabaning guruhi muvaffaqiyatli almashtirildi!");
          setShowTransferGroupModal(false);
          loadAllData();
          setTimeout(() => setSuccessMessage(''), 3000);
        })
        .catch(err => setErrorMessage(err.response?.data?.message || err.response?.data || "Guruhni almashtirishda xatolik!"));
    } else {
      axios.post('/api/students/bulk-assign-group', { studentIds: selectedStudentIds, groupId: targetGroupId })
        .then(() => {
          setSuccessMessage(`${selectedStudentIds.length} ta talaba guruhga muvaffaqiyatli biriktirildi!`);
          setShowTransferGroupModal(false);
          setSelectedStudentIds([]);
          loadAllData();
          setTimeout(() => setSuccessMessage(''), 3000);
        })
        .catch(err => setErrorMessage(err.response?.data?.message || err.response?.data || "Ommaviy biriktirishda xatolik!"));
    }
  };

  const openResetPoints = (student = null) => {
    setResetPointsTargetStudent(student);
    setResetReason('');
    setShowResetPointsModal(true);
  };

  const handleResetPointsSubmit = (e) => {
    e.preventDefault();
    if (resetPointsTargetStudent) {
      axios.post(`/api/students/${resetPointsTargetStudent.id}/reset-points`, { reason: resetReason })
        .then(() => {
          setSuccessMessage("Talabaning ballari arxivlandi va 0 ga tushirildi!");
          setShowResetPointsModal(false);
          loadAllData();
          setTimeout(() => setSuccessMessage(''), 3000);
        })
        .catch(err => setErrorMessage(err.response?.data?.message || err.response?.data || "Ballarni nollashda xatolik!"));
    } else {
      axios.post('/api/students/bulk-reset-points', { studentIds: selectedStudentIds, reason: resetReason })
        .then(() => {
          setSuccessMessage(`${selectedStudentIds.length} ta talabaning ballari arxivlandi va 0 ga tushirildi!`);
          setShowResetPointsModal(false);
          setSelectedStudentIds([]);
          loadAllData();
          setTimeout(() => setSuccessMessage(''), 3000);
        })
        .catch(err => setErrorMessage(err.response?.data?.message || err.response?.data || "Ommaviy ballarni nollashda xatolik!"));
    }
  };

  const handleBulkDeleteSubmit = () => {
    axios.post('/api/students/bulk-delete', { studentIds: selectedStudentIds })
      .then(() => {
        setSuccessMessage(`${selectedStudentIds.length} ta talaba muvaffaqiyatli o'chirildi!`);
        setShowBulkDeleteConfirmModal(false);
        setSelectedStudentIds([]);
        loadAllData();
        setTimeout(() => setSuccessMessage(''), 3000);
      })
      .catch(err => setErrorMessage(err.response?.data?.message || err.response?.data || "Ommaviy o'chirishda xatolik!"));
  };

  // ---- Filtered lists ----
  const filteredStudents = students.filter(s => {
    if (!studentSearch.trim()) return true;
    const q = studentSearch.toLowerCase();
    return (
      s.fullName?.toLowerCase().includes(q) ||
      s.groupName?.toLowerCase().includes(q) ||
      s.phone?.includes(q) ||
      s.parentPhone?.includes(q)
    );
  });

  const filteredGroups = groups.filter(g => {
    if (!groupSearch.trim()) return true;
    const q = groupSearch.toLowerCase();
    return (
      g.name?.toLowerCase().includes(q) ||
      g.mentorName?.toLowerCase().includes(q) ||
      g.courseName?.toLowerCase().includes(q) ||
      g.roomName?.toLowerCase().includes(q)
    );
  });

  const filteredRooms = roomsList.filter(r => {
    if (!roomSearch.trim()) return true;
    const q = roomSearch.toLowerCase();
    return r.name.toLowerCase().includes(q) || (r.description && r.description.toLowerCase().includes(q));
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
    const matchesSearch = !adminSearch.trim() || 
      a.fullName?.toLowerCase().includes(adminSearch.toLowerCase()) ||
      a.username?.toLowerCase().includes(adminSearch.toLowerCase());
    const matchesRole = adminRoleFilter === 'ALL' || a.role === adminRoleFilter;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="p-4 sm:p-6 space-y-6 overflow-y-auto max-h-[calc(100vh-4rem)]">
      {/* Tab Switcher Headers */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">Ma'lumotlar Boshqaruvi</h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">Akademiya talabalari, guruhlar, xonalar, mentorlar va kurslarni boshqarish</p>
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
          {activeTab === 'rooms' && canManage && (
            <button onClick={openAddRoom} className="flex items-center gap-1.5 px-4 py-2.5 bg-indigo-650 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow shadow-indigo-500/10 cursor-pointer">
              <Plus size={15} /> XONA QO'SHISH
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
              <Plus size={15} /> FOYDALANUVCHI QO'SHISH
            </button>
          )}
        </div>
      </div>

      {/* Main Tab Navigation Buttons */}
      <div className="flex border-b border-slate-800 overflow-x-auto">
        <button
          onClick={() => setActiveTab('students')}
          className={`px-5 py-3 font-semibold text-sm border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'students' ? 'border-indigo-500 text-indigo-400 font-extrabold' : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          O'quvchilar
        </button>
        <button
          onClick={() => setActiveTab('groups')}
          className={`px-5 py-3 font-semibold text-sm border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'groups' ? 'border-indigo-500 text-indigo-400 font-extrabold' : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Guruhlar
        </button>
        <button
          onClick={() => setActiveTab('rooms')}
          className={`px-5 py-3 font-semibold text-sm border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'rooms' ? 'border-indigo-500 text-indigo-400 font-extrabold' : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Xonalar
        </button>
        <button
          onClick={() => setActiveTab('mentors')}
          className={`px-5 py-3 font-semibold text-sm border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'mentors' ? 'border-indigo-500 text-indigo-400 font-extrabold' : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Mentorlar
        </button>
        <button
          onClick={() => setActiveTab('courses')}
          className={`px-5 py-3 font-semibold text-sm border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'courses' ? 'border-indigo-500 text-indigo-400 font-extrabold' : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Kurslar
        </button>
        {isSuperAdmin && (
          <button
            onClick={() => setActiveTab('admins')}
            className={`px-5 py-3 font-semibold text-sm border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'admins' ? 'border-indigo-500 text-indigo-400 font-extrabold' : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Foydalanuvchilar & Rollar
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
                    placeholder="Ism, guruh yoki telefon bo'yicha qidirish..."
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
              </div>

              {/* Bulk Action Floating Bar */}
              {selectedStudentIds.length > 0 && (
                <div className="bg-gradient-to-r from-indigo-900/90 to-slate-900 border border-indigo-500/40 rounded-2xl p-3 px-5 mx-4 mb-4 flex flex-wrap items-center justify-between gap-3 shadow-2xl animate-fadeIn">
                  <div className="flex items-center gap-3">
                    <span className="px-3 py-1 bg-indigo-600 text-white font-black text-xs rounded-full shadow">
                      {selectedStudentIds.length} ta o'quvchi tanlandi
                    </span>
                    <span className="text-xs text-slate-300 font-medium hidden sm:inline">
                      Tanlangan o'quvchilar ustida ommaviy amal bajaring:
                    </span>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      type="button"
                      onClick={() => openTransferGroup(null)}
                      className="flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs shadow-md shadow-indigo-600/20 cursor-pointer border-0"
                    >
                      <FolderGit size={14} /> Guruhga biriktirish
                    </button>

                    <button
                      type="button"
                      onClick={() => openResetPoints(null)}
                      className="flex items-center gap-1.5 px-3.5 py-1.5 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl text-xs shadow-md shadow-amber-600/20 cursor-pointer border-0"
                    >
                      <RotateCcw size={14} /> Ballarni 0 ga tushirish
                    </button>

                    <button
                      type="button"
                      onClick={() => setShowBulkDeleteConfirmModal(true)}
                      className="flex items-center gap-1.5 px-3.5 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-xs shadow-md shadow-rose-600/20 cursor-pointer border-0"
                    >
                      <Trash2 size={14} /> Tanlanganlarni o'chirish
                    </button>

                    <button
                      type="button"
                      onClick={() => setSelectedStudentIds([])}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold cursor-pointer border border-slate-700/50"
                    >
                      Bekor qilish
                    </button>
                  </div>
                </div>
              )}

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-950/40 text-[10px] font-bold text-slate-400 tracking-wider uppercase">
                      {canManage && (
                        <th className="py-4 px-4 text-center w-10">
                          <button
                            type="button"
                            onClick={toggleSelectAllStudents}
                            className="text-slate-400 hover:text-indigo-400 cursor-pointer border-0 bg-transparent flex items-center justify-center"
                          >
                            {selectedStudentIds.length > 0 && selectedStudentIds.length === filteredStudents.length ? (
                              <CheckSquare size={17} className="text-indigo-400" />
                            ) : (
                              <Square size={17} />
                            )}
                          </button>
                        </th>
                      )}
                      <th className="py-4 px-6">TALABA</th>
                      <th className="py-4 px-6">TELEFONLAR</th>
                      <th className="py-4 px-6">GURUH</th>
                      <th className="py-4 px-6">TO'LOV VA QARZDORLIK</th>
                      <th className="py-4 px-6 text-center">JAMI XP</th>
                      {canManage && <th className="py-4 px-6 text-center">HARAKATLAR</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-slate-300 text-sm">
                    {filteredStudents.length === 0 ? (
                      <tr><td colSpan={canManage ? 7 : 5} className="py-10 text-center text-slate-500">
                        <Search size={32} className="mx-auto mb-2 opacity-30" />
                        {studentSearch ? `"${studentSearch}" bo'yicha natija topilmadi` : "O'quvchilar yo'q"}
                      </td></tr>
                    ) : (
                      filteredStudents.map(s => (
                        <tr key={s.id} className={`hover:bg-slate-850/20 transition-all ${selectedStudentIds.includes(s.id) ? 'bg-indigo-950/20' : ''}`}>
                          {canManage && (
                            <td className="py-4 px-4 text-center">
                              <button
                                type="button"
                                onClick={() => toggleSelectStudent(s.id)}
                                className="text-slate-400 hover:text-indigo-400 cursor-pointer border-0 bg-transparent flex items-center justify-center"
                              >
                                {selectedStudentIds.includes(s.id) ? (
                                  <CheckSquare size={17} className="text-indigo-400" />
                                ) : (
                                  <Square size={17} />
                                )}
                              </button>
                            </td>
                          )}
                          <td className="py-4 px-6 font-bold text-slate-100">{s.fullName}</td>
                          <td className="py-4 px-6 text-xs text-slate-400">
                            <div>{s.phone || '—'}</div>
                            {s.parentPhone && (
                              <div className="text-[10px] text-slate-500">Ota-ona: {s.parentPhone}</div>
                            )}
                          </td>
                          <td className="py-4 px-6 font-semibold uppercase text-xs text-slate-400">{s.groupName || 'Guruhsiz'}</td>
                          <td className="py-4 px-6 text-xs">
                            <div className="flex flex-col gap-1">
                              <div className="flex items-center gap-1.5">
                                {s.paymentStatus === 'PAID' && (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                    To'liq to'langan
                                  </span>
                                )}
                                {s.paymentStatus === 'PARTIALLY_PAID' && (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                    Qisman to'langan
                                  </span>
                                )}
                                {s.paymentStatus === 'DEBTOR' && (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                                    Qarzdor
                                  </span>
                                )}
                                {(!s.paymentStatus || s.paymentStatus === 'NO_FEE') && (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-500/20 text-slate-400 border border-slate-500/30">
                                    Guruhsiz
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] text-slate-300 flex items-center gap-2 flex-wrap">
                                <span>To'langan: <strong className="text-emerald-400 font-mono">{(s.totalPaid || 0).toLocaleString()}</strong> UZS</span>
                                {s.balanceDue > 0 && (
                                  <span>Qarz: <strong className="text-rose-400 font-mono font-bold">{(s.balanceDue || 0).toLocaleString()}</strong> UZS</span>
                                )}
                                {s.customPrice && (
                                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-semibold">
                                    Maxsus: {Number(s.customPrice).toLocaleString()} UZS
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-6 text-center">
                            <span className="font-extrabold text-indigo-400 bg-indigo-500/10 px-2.5 py-1 rounded-lg border border-indigo-500/10 text-xs">
                              {s.xp || 0} XP
                            </span>
                          </td>
                          {canManage && (
                            <td className="py-4 px-6">
                              <div className="flex items-center justify-center gap-1.5">
                                <button 
                                  onClick={() => openEditStudent(s)} 
                                  title="Tahrirlash"
                                  className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-indigo-650 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer transition-colors border border-slate-700/50"
                                >
                                  <Edit3 size={13} />
                                </button>
                                <button 
                                  onClick={() => openTransferGroup(s)} 
                                  title="Guruhni almashtirish (Ballari saqlanadi)"
                                  className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-cyan-600/30 hover:border-cyan-500/50 text-slate-400 hover:text-cyan-300 flex items-center justify-center cursor-pointer transition-colors border border-slate-700/50"
                                >
                                  <ArrowRightLeft size={13} />
                                </button>
                                <button 
                                  onClick={() => openResetPoints(s)} 
                                  title="Ballarni 0 ga tushirish (Tarixda saqlanadi)"
                                  className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-amber-600/30 hover:border-amber-500/50 text-slate-400 hover:text-amber-300 flex items-center justify-center cursor-pointer transition-colors border border-slate-700/50"
                                >
                                  <RotateCcw size={13} />
                                </button>
                                <button 
                                  onClick={() => handleArchiveStudent(s.id)} 
                                  title="O'chirish / Arxivlash"
                                  className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-rose-600/15 border border-slate-700/50 hover:border-rose-500/25 text-slate-400 hover:text-rose-400 flex items-center justify-center cursor-pointer transition-colors"
                                >
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
                    placeholder="Guruh, kurs, mentor yoki xona qidirish..."
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
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-950/40 text-[10px] font-bold text-slate-400 tracking-wider uppercase">
                      <th className="py-4 px-6">GURUH NOMI</th>
                      <th className="py-4 px-6">KURS</th>
                      <th className="py-4 px-6">XONA & VAQT</th>
                      <th className="py-4 px-6">MENTOR</th>
                      {canManage && <th className="py-4 px-6 text-center">HARAKATLAR</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-slate-300 text-sm">
                    {filteredGroups.length === 0 ? (
                      <tr><td colSpan={canManage ? 5 : 4} className="py-10 text-center text-slate-500">
                        <Search size={32} className="mx-auto mb-2 opacity-30" />
                        {groupSearch ? `"${groupSearch}" bo'yicha natija topilmadi` : "Guruhlar yo'q"}
                      </td></tr>
                    ) : (
                      filteredGroups.map(g => (
                        <tr key={g.id} className="hover:bg-slate-850/20 transition-all">
                          <td className="py-4 px-6 font-bold text-slate-100">{g.name}</td>
                          <td className="py-4 px-6 font-semibold text-slate-400">{g.courseName || '—'}</td>
                          <td className="py-4 px-6 text-xs text-slate-400">
                            <div className="font-bold text-slate-300">{g.roomName || 'Xona belgilanmagan'}</div>
                            <div className="font-mono text-emerald-400">{g.startTime || '—'} - {g.endTime || '—'}</div>
                          </td>
                          <td className="py-4 px-6 font-semibold text-slate-400">{g.mentorName || 'Mentorsiz'}</td>
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

          {/* Panel: Rooms */}
          {activeTab === 'rooms' && (
            <div>
              {/* Search bar */}
              <div className="p-4 border-b border-slate-800">
                <div className="relative max-w-md">
                  <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="text"
                    placeholder="Xona nomi yoki tavsifini qidirish..."
                    value={roomSearch}
                    onChange={e => setRoomSearch(e.target.value)}
                    className="w-full h-9 pl-9 pr-4 bg-slate-950/60 border border-slate-700 rounded-xl text-slate-200 focus:outline-none focus:border-indigo-500 text-sm placeholder:text-slate-500"
                  />
                  {roomSearch && (
                    <button onClick={() => setRoomSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
                      <X size={14} />
                    </button>
                  )}
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-950/40 text-[10px] font-bold text-slate-400 tracking-wider uppercase">
                      <th className="py-4 px-6">XONA NOMI</th>
                      <th className="py-4 px-6">SIG'IMI</th>
                      <th className="py-4 px-6">TAVSIF</th>
                      <th className="py-4 px-6 text-center">HOLAT</th>
                      {canManage && <th className="py-4 px-6 text-center">HARAKATLAR</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-slate-300 text-sm">
                    {filteredRooms.length === 0 ? (
                      <tr><td colSpan={canManage ? 5 : 4} className="py-10 text-center text-slate-500">
                        <DoorOpen size={32} className="mx-auto mb-2 opacity-30" />
                        Xonalar topilmadi.
                      </td></tr>
                    ) : (
                      filteredRooms.map(r => (
                        <tr key={r.id} className="hover:bg-slate-850/20 transition-all">
                          <td className="py-4 px-6 font-bold text-slate-100 flex items-center gap-2">
                            <DoorOpen size={16} className="text-cyan-400" />
                            {r.name}
                          </td>
                          <td className="py-4 px-6 font-bold text-slate-300">{r.capacity || 15} kishi</td>
                          <td className="py-4 px-6 text-xs text-slate-400">{r.description || '—'}</td>
                          <td className="py-4 px-6 text-center">
                            <span className="inline-block px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-bold uppercase">
                              {r.status || 'ACTIVE'}
                            </span>
                          </td>
                          {canManage && (
                            <td className="py-4 px-6">
                              <div className="flex items-center justify-center gap-2">
                                <button onClick={() => openEditRoom(r)} className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-indigo-650 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer transition-colors border border-slate-700/50">
                                  <Edit3 size={13} />
                                </button>
                                <button onClick={() => handleDeleteRoom(r.id)} className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-rose-600/15 border border-slate-700/50 hover:border-rose-500/25 text-slate-400 hover:text-rose-400 flex items-center justify-center cursor-pointer transition-colors">
                                  <Trash2 size={13} />
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
              <div className="flex bg-slate-950/30 p-1 border border-slate-800 rounded-xl max-w-sm">
                <button
                  onClick={() => setMentorSubTab('monitor')}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-semibold cursor-pointer text-center ${
                    mentorSubTab === 'monitor' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Faoliyat Monitoringi
                </button>
                <button
                  onClick={() => setMentorSubTab('crud')}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-semibold cursor-pointer text-center ${
                    mentorSubTab === 'crud' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Boshqaruv Ro'yxati
                </button>
              </div>

              {mentorSubTab === 'monitor' ? (
                <MentorMonitor />
              ) : (
                <div className="rounded-xl border border-slate-800/80 overflow-hidden">
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
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-800 bg-slate-950/50 text-[10px] font-bold text-slate-400 tracking-wider uppercase">
                          <th className="py-4 px-6">MENTOR F.I.O</th>
                          <th className="py-4 px-6">USERNAME</th>
                          <th className="py-4 px-6">RANGI (JADVALDA)</th>
                          <th className="py-4 px-6">GURUHLARI</th>
                          {canManage && <th className="py-4 px-6 text-center">HARAKATLAR</th>}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-850 text-slate-300 text-sm">
                        {filteredMentors.length === 0 ? (
                          <tr><td colSpan={canManage ? 5 : 4} className="py-10 text-center text-slate-500">
                            <Search size={32} className="mx-auto mb-2 opacity-30" />
                            {mentorSearch ? `"${mentorSearch}" bo'yicha natija topilmadi` : "Mentorlar yo'q"}
                          </td></tr>
                        ) : (
                          filteredMentors.map(m => (
                            <tr key={m.id} className="hover:bg-slate-850/20 transition-all">
                              <td className="py-4 px-6 font-bold text-slate-100">{m.fullName}</td>
                              <td className="py-4 px-6 font-semibold text-slate-400">{m.username}</td>
                              <td className="py-4 px-6">
                                <div className="flex items-center gap-2">
                                  <span 
                                    className="w-4 h-4 rounded-full border border-white/20 shadow-sm" 
                                    style={{ backgroundColor: m.color || '#3b82f6' }}
                                  ></span>
                                  <span className="text-xs font-mono text-slate-400">{m.color || '#3b82f6'}</span>
                                </div>
                              </td>
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
                    <th className="py-4 px-6">DAVOMIYLIGI</th>
                    <th className="py-4 px-6">OYLIK NARXI</th>
                    <th className="py-4 px-6 text-center">YARATILGAN SANA</th>
                    {canManage && <th className="py-4 px-6 text-center">HARAKATLAR</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300 text-sm">
                  {courses.length === 0 ? (
                    <tr><td colSpan={canManage ? 5 : 4} className="py-8 text-center text-slate-500 font-semibold">Kurslar yo'q</td></tr>
                  ) : (
                    courses.map(c => (
                      <tr key={c.id} className="hover:bg-slate-850/20 transition-all">
                        <td className="py-4 px-6 font-bold text-slate-100">{c.name}</td>
                        <td className="py-4 px-6 text-xs text-slate-300">
                          <span className="px-2.5 py-1 rounded-md bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-bold">
                            {c.durationMonths ? `${c.durationMonths} oy` : '1 oy'}
                          </span>
                        </td>
                        <td className="py-4 px-6 font-semibold text-emerald-400 font-mono">
                          {c.price ? `${Number(c.price).toLocaleString()} UZS` : "Belgilanmagan"}
                        </td>
                        <td className="py-4 px-6 text-center font-semibold text-slate-400 text-xs">
                          {c.createdAt ? new Date(c.createdAt).toLocaleDateString() : "Noma'lum"}
                        </td>
                        {canManage && (
                          <td className="py-4 px-6 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <button onClick={() => openEditCourse(c)} className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-indigo-650 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer transition-colors border border-slate-700/50">
                                <Edit3 size={13} />
                              </button>
                              <button onClick={() => handleDeleteCourse(c.id)} className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-rose-600/15 border border-slate-700/50 hover:border-rose-500/25 text-slate-400 hover:text-rose-400 flex items-center justify-center cursor-pointer transition-colors">
                                <Trash2 size={13} />
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
          )}

          {/* Panel: Admins */}
          {activeTab === 'admins' && isSuperAdmin && (
            <div>
              <div className="p-4 border-b border-slate-800 space-y-3">
                <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
                  <div className="relative flex-1 max-w-md">
                    <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                      type="text"
                      placeholder="Ism, username orqali qidirish..."
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
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
                    {[
                      { key: 'ALL', label: 'Barchasi' },
                      { key: 'ADMIN', label: 'Admin' },
                      { key: 'OPERATOR', label: 'Operator' },
                      { key: 'CASHIER', label: 'Kassir' },
                      { key: 'ACCOUNTANT', label: 'Hisobchi' },
                      { key: 'MENTOR', label: 'Mentor' },
                      { key: 'BRANCH_ADMIN', label: 'Filial Admin' },
                      { key: 'SUPER_ADMIN', label: 'Super Admin' }
                    ].map(rf => (
                      <button
                        key={rf.key}
                        onClick={() => setAdminRoleFilter(rf.key)}
                        className={`px-2.5 py-1 rounded-lg font-bold border transition-all cursor-pointer shrink-0 ${
                          adminRoleFilter === rf.key
                            ? 'bg-indigo-600 border-indigo-500 text-white shadow shadow-indigo-600/30'
                            : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {rf.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-950/40 text-[10px] font-bold text-slate-400 tracking-wider uppercase">
                      <th className="py-4 px-6">TO'LIQ ISM</th>
                      <th className="py-4 px-6">USERNAME</th>
                      <th className="py-4 px-6">ROL / VAZIFA</th>
                      <th className="py-4 px-6">QO'SHILGAN VAQTI</th>
                      <th className="py-4 px-6 text-center">HARAKATLAR</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-slate-300 text-sm">
                    {filteredAdmins.length === 0 ? (
                      <tr><td colSpan="5" className="py-10 text-center text-slate-500 font-semibold">
                        <Search size={32} className="mx-auto mb-2 opacity-30" />
                        {adminSearch ? `"${adminSearch}" bo'yicha natija topilmadi` : "Foydalanuvchilar topilmadi"}
                      </td></tr>
                    ) : (
                      filteredAdmins.map(a => {
                        const roleColor = 
                          a.role === 'SUPER_ADMIN' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' :
                          a.role === 'ADMIN' ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' :
                          a.role === 'OPERATOR' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                          a.role === 'CASHIER' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                          a.role === 'ACCOUNTANT' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                          a.role === 'BRANCH_ADMIN' ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' :
                          a.role === 'MENTOR' ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20' :
                          'bg-slate-500/10 text-slate-400 border-slate-500/20';

                        return (
                          <tr key={a.id} className="hover:bg-slate-850/20 transition-all">
                            <td className="py-4 px-6 font-bold text-slate-100">{a.fullName}</td>
                            <td className="py-4 px-6 font-semibold text-slate-400 font-mono text-xs">{a.username}</td>
                            <td className="py-4 px-6">
                              <span className={`inline-block text-[10px] font-extrabold tracking-wider px-2.5 py-1 rounded-md border uppercase ${roleColor}`}>
                                {a.role}
                              </span>
                            </td>
                            <td className="py-4 px-6 text-xs text-slate-500">
                              {a.createdAt ? new Date(a.createdAt).toLocaleDateString() : '-'}
                            </td>
                            <td className="py-4 px-6">
                              <div className="flex items-center justify-center gap-2">
                                <button onClick={() => openEditAdmin(a)} className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-indigo-650 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer transition-colors border border-slate-700/50">
                                  <Edit3 size={13} />
                                </button>
                                {a.username !== 'admin' && (
                                  <button onClick={() => handleDeleteAdmin(a.id)} className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-rose-600/15 border border-slate-700/50 hover:border-rose-500/25 text-slate-400 hover:text-rose-400 flex items-center justify-center cursor-pointer transition-colors">
                                    <Trash2 size={13} />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })
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
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-fadeIn">
          <form onSubmit={handleStudentSubmit} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-lg w-full shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-extrabold text-white text-base">
                {editingItem ? "Talabani Tahrirlash" : "Yangi Talaba Qo'shish"}
              </h3>
              <button type="button" onClick={handleCloseModals} className="text-slate-400 hover:text-white cursor-pointer"><X size={18} /></button>
            </div>

            {errorMessage && <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-lg text-rose-400 text-xs font-semibold">{errorMessage}</div>}
            {successMessage && <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-400 text-xs font-semibold">{successMessage}</div>}

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">ISM *</label>
                  <input
                    type="text"
                    required
                    value={studentForm.firstName}
                    onChange={(e) => setStudentForm({ ...studentForm, firstName: e.target.value })}
                    className="w-full h-10 px-3 bg-slate-850 border border-slate-800 rounded-lg text-slate-200 text-sm focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">FAMILIYA *</label>
                  <input
                    type="text"
                    required
                    value={studentForm.lastName}
                    onChange={(e) => setStudentForm({ ...studentForm, lastName: e.target.value })}
                    className="w-full h-10 px-3 bg-slate-850 border border-slate-800 rounded-lg text-slate-200 text-sm focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">TELEFON RAQAMI</label>
                  <input
                    type="text"
                    placeholder="+998 90 123 45 67"
                    value={studentForm.phone}
                    onChange={(e) => setStudentForm({ ...studentForm, phone: e.target.value })}
                    className="w-full h-10 px-3 bg-slate-850 border border-slate-800 rounded-lg text-slate-200 text-sm focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">OTA-ONASI TELEFONI</label>
                  <input
                    type="text"
                    placeholder="+998 90 987 65 43"
                    value={studentForm.parentPhone}
                    onChange={(e) => setStudentForm({ ...studentForm, parentPhone: e.target.value })}
                    className="w-full h-10 px-3 bg-slate-850 border border-slate-800 rounded-lg text-slate-200 text-sm focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">OTA-ONASI F.I.SH</label>
                <input
                  type="text"
                  placeholder="Masalan: Karim Aliyev (Otasi)"
                  value={studentForm.parentName}
                  onChange={(e) => setStudentForm({ ...studentForm, parentName: e.target.value })}
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
                  <label className="block text-xs font-bold text-slate-400 mb-1">USERNAME</label>
                  <input
                    type="text"
                    value={studentForm.username}
                    onChange={(e) => setStudentForm({ ...studentForm, username: e.target.value })}
                    placeholder="ixtiyoriy (auto)"
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

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-400">
                    INDIVIDUAL / CHEGIRMALI OYLIK NARX (UZS)
                  </label>
                  {studentForm.customPrice && (
                    <span className="text-[10px] font-mono font-bold text-indigo-400">
                      {Number(Number(studentForm.customPrice) < 10000 && Number(studentForm.customPrice) > 0 ? Number(studentForm.customPrice) * 1000 : Number(studentForm.customPrice) || 0).toLocaleString()} UZS
                    </span>
                  )}
                </div>
                <div className="relative">
                  <input
                    type="text"
                    value={studentForm.customPrice || ''}
                    onChange={(e) => setStudentForm({ ...studentForm, customPrice: e.target.value })}
                    onBlur={() => {
                      if (!studentForm.customPrice) return;
                      const num = parseInt(String(studentForm.customPrice).replace(/\D/g, ''), 10);
                      if (!isNaN(num) && num > 0) {
                        setStudentForm(prev => ({ ...prev, customPrice: num < 10000 ? String(num * 1000) : String(num) }));
                      }
                    }}
                    placeholder="Masalan: 450 yoki 450000 (ixtiyoriy)"
                    className="w-full h-10 pl-3 pr-11 bg-slate-850 border border-slate-800 rounded-lg text-slate-200 text-sm focus:outline-none focus:border-indigo-500 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const num = parseInt(String(studentForm.customPrice).replace(/\D/g, ''), 10);
                      if (!isNaN(num) && num > 0) {
                        setStudentForm({ ...studentForm, customPrice: String(num * 1000) });
                      }
                    }}
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 px-1.5 py-0.5 bg-slate-800 hover:bg-slate-750 text-slate-300 text-[10px] font-bold rounded border border-slate-700 cursor-pointer"
                    title="3 ta nol qo'shish"
                  >
                    +000
                  </button>
                </div>
              </div>

              {!editingItem && (
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">BOSHLANG'ICH BALL</label>
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
              <button 
                type="button" 
                onClick={handleCloseModals} 
                disabled={savingStudent}
                className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-750 text-slate-300 font-semibold rounded-lg text-xs cursor-pointer border border-slate-700/50"
              >
                Bekor qilish
              </button>
              <button 
                type="submit" 
                disabled={savingStudent}
                className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold rounded-lg text-xs cursor-pointer shadow shadow-indigo-500/10 flex items-center justify-center gap-2"
              >
                {savingStudent && <RefreshCw size={14} className="animate-spin" />}
                <span>{savingStudent ? "Saqlanmoqda..." : "Saqlash"}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal: Group CRUD */}
      {showGroupModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-fadeIn">
          <form onSubmit={handleGroupSubmit} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-lg w-full shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
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
                <label className="block text-xs font-bold text-slate-400 mb-1">GURUH NOMI *</label>
                <input
                  type="text"
                  required
                  placeholder="Masalan: Frontend G-14 (18:00)"
                  value={groupForm.name}
                  onChange={(e) => setGroupForm({ ...groupForm, name: e.target.value })}
                  className="w-full h-10 px-3 bg-slate-850 border border-slate-800 rounded-lg text-slate-200 text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">KURS *</label>
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

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">O'QUV XONASI</label>
                  <CustomSelect
                    value={groupForm.roomId}
                    onChange={(val) => setGroupForm({ ...groupForm, roomId: val })}
                    options={roomsList.map(r => ({ value: r.id, label: `${r.name} (${r.capacity} kishi)` }))}
                    placeholder="Xonani tanlang"
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">OYLIK DARSLAR SONI</label>
                  <input
                    type="number"
                    min="1"
                    value={groupForm.lessonsPerMonth}
                    onChange={(e) => setGroupForm({ ...groupForm, lessonsPerMonth: parseInt(e.target.value) || 12 })}
                    className="w-full h-10 px-3 bg-slate-850 border border-slate-800 rounded-lg text-slate-200 text-sm focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">DARS KUNLARI</label>
                <CustomSelect
                  value={groupForm.daysOfWeek}
                  onChange={(val) => setGroupForm({ ...groupForm, daysOfWeek: val })}
                  options={DAYS_OPTIONS}
                  placeholder="Dars kunlarini tanlang"
                  className="w-full"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">BOSHLANISH VAQTI</label>
                  <input
                    type="time"
                    value={groupForm.startTime}
                    onChange={(e) => setGroupForm({ ...groupForm, startTime: e.target.value })}
                    className="w-full h-10 px-3 bg-slate-850 border border-slate-800 rounded-lg text-slate-200 text-sm focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">TUGASH VAQTI</label>
                  <input
                    type="time"
                    value={groupForm.endTime}
                    onChange={(e) => setGroupForm({ ...groupForm, endTime: e.target.value })}
                    className="w-full h-10 px-3 bg-slate-850 border border-slate-800 rounded-lg text-slate-200 text-sm focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>
              </div>
            </div>

            <div className="pt-4 flex gap-3">
              <button type="button" onClick={handleCloseModals} className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-750 text-slate-300 font-semibold rounded-lg text-xs cursor-pointer border border-slate-700/50">Bekor qilish</button>
              <button type="submit" className="flex-1 py-2.5 bg-indigo-650 hover:bg-indigo-500 text-white font-semibold rounded-lg text-xs cursor-pointer shadow shadow-indigo-500/10">Saqlash</button>
            </div>
          </form>
        </div>
      )}

      {/* Modal: Room CRUD */}
      {showRoomModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-fadeIn">
          <form onSubmit={handleRoomSubmit} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-extrabold text-white text-base">
                {editingItem ? "Xonani Tahrirlash" : "Yangi Xona Qo'shish"}
              </h3>
              <button type="button" onClick={handleCloseModals} className="text-slate-400 hover:text-white cursor-pointer"><X size={18} /></button>
            </div>

            {errorMessage && <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-lg text-rose-400 text-xs font-semibold">{errorMessage}</div>}
            {successMessage && <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-400 text-xs font-semibold">{successMessage}</div>}

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">XONA NOMI *</label>
                <input
                  type="text"
                  required
                  placeholder="Masalan: Xona 101 (Frontend Lab)"
                  value={roomForm.name}
                  onChange={(e) => setRoomForm({ ...roomForm, name: e.target.value })}
                  className="w-full h-10 px-3 bg-slate-850 border border-slate-800 rounded-lg text-slate-200 text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">SIG'IMI (O'QUVCHILAR SONI) *</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={roomForm.capacity}
                  onChange={(e) => setRoomForm({ ...roomForm, capacity: parseInt(e.target.value) || 15 })}
                  className="w-full h-10 px-3 bg-slate-850 border border-slate-800 rounded-lg text-slate-200 text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">TAVSIF (IXTIYORIY)</label>
                <input
                  type="text"
                  placeholder="Masalan: iMac kompyuterlar, proyektor mavjud"
                  value={roomForm.description}
                  onChange={(e) => setRoomForm({ ...roomForm, description: e.target.value })}
                  className="w-full h-10 px-3 bg-slate-850 border border-slate-800 rounded-lg text-slate-200 text-sm focus:outline-none focus:border-indigo-500"
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
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">DARS JADVALI UCHUN RANG</label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={mentorForm.color || '#3b82f6'}
                    onChange={(e) => setMentorForm({ ...mentorForm, color: e.target.value })}
                    className="w-10 h-10 rounded-lg cursor-pointer bg-slate-850 border border-slate-800 p-1"
                  />
                  <div className="flex items-center flex-wrap gap-1.5">
                    {['#16a34a', '#2563eb', '#dc2626', '#d97706', '#9333ea', '#0d9488', '#ea580c', '#e11d48'].map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setMentorForm({ ...mentorForm, color: c })}
                        style={{ backgroundColor: c }}
                        className={`w-6 h-6 rounded-md transition-all ${
                          (mentorForm.color || '').toLowerCase() === c.toLowerCase() ? 'ring-2 ring-white scale-110' : 'opacity-70 hover:opacity-100'
                        }`}
                      />
                    ))}
                  </div>
                </div>
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
              <h3 className="font-extrabold text-white text-base">
                {editingItem ? "Kursni Tahrirlash" : "Yangi Kurs Qo'shish"}
              </h3>
              <button type="button" onClick={handleCloseModals} className="text-slate-400 hover:text-white cursor-pointer"><X size={18} /></button>
            </div>

            {errorMessage && <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-lg text-rose-400 text-xs font-semibold">{errorMessage}</div>}
            {successMessage && <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-400 text-xs font-semibold">{successMessage}</div>}

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">KURS NOMI *</label>
                <input
                  type="text"
                  required
                  placeholder="Masalan: FLUTTER DASTURLASH"
                  value={courseForm.name}
                  onChange={(e) => setCourseForm({ ...courseForm, name: e.target.value })}
                  className="w-full h-10 px-3 bg-slate-850 border border-slate-800 rounded-lg text-slate-200 text-sm focus:outline-none focus:border-indigo-500 font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">DAVOMIYLIGI (OY)</label>
                  <input
                    type="number"
                    min="1"
                    max="36"
                    value={courseForm.durationMonths || 1}
                    onChange={(e) => setCourseForm({ ...courseForm, durationMonths: parseInt(e.target.value) || 1 })}
                    className="w-full h-10 px-3 bg-slate-850 border border-slate-800 rounded-lg text-slate-200 text-sm focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-slate-400">OYLIK NARXI (UZS)</label>
                    {courseForm.price && (
                      <span className="text-[10px] font-mono font-bold text-emerald-400">
                        {Number(Number(courseForm.price) < 10000 && Number(courseForm.price) > 0 ? Number(courseForm.price) * 1000 : Number(courseForm.price) || 0).toLocaleString()} UZS
                      </span>
                    )}
                  </div>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Masalan: 600 yoki 600000"
                      value={courseForm.price || ''}
                      onChange={(e) => setCourseForm({ ...courseForm, price: e.target.value })}
                      onBlur={() => {
                        if (!courseForm.price) return;
                        const num = parseInt(String(courseForm.price).replace(/\D/g, ''), 10);
                        if (!isNaN(num) && num > 0) {
                          setCourseForm(prev => ({ ...prev, price: num < 10000 ? String(num * 1000) : String(num) }));
                        }
                      }}
                      className="w-full h-10 pl-3 pr-11 bg-slate-850 border border-slate-800 rounded-lg text-slate-200 text-sm focus:outline-none focus:border-indigo-500 font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const num = parseInt(String(courseForm.price).replace(/\D/g, ''), 10);
                        if (!isNaN(num) && num > 0) {
                          setCourseForm({ ...courseForm, price: String(num * 1000) });
                        }
                      }}
                      className="absolute right-1.5 top-1/2 -translate-y-1/2 px-1.5 py-0.5 bg-slate-800 hover:bg-slate-750 text-slate-300 text-[10px] font-bold rounded border border-slate-700 cursor-pointer"
                      title="3 ta nol qo'shish"
                    >
                      +000
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-4 flex gap-3">
              <button type="button" onClick={handleCloseModals} className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-750 text-slate-300 font-semibold rounded-lg text-xs cursor-pointer border border-slate-700/50">Bekor qilish</button>
              <button type="submit" className="flex-1 py-2.5 bg-indigo-650 hover:bg-indigo-500 text-white font-semibold rounded-lg text-xs cursor-pointer shadow shadow-indigo-500/10">
                {editingItem ? "Saqlash" : "Kurs Yaratish"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal: Admin / User CRUD */}
      {showAdminModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <form onSubmit={handleAdminSubmit} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-extrabold text-white text-base">
                {editingItem ? "Foydalanuvchi Ma'lumotlarini Tahrirlash" : "Yangi Foydalanuvchi / Xodim Yaratish"}
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
                <label className="block text-xs font-bold text-slate-400 mb-1">ROL (TIZIMDAGI VAZIFASI)</label>
                <select
                  value={adminForm.role}
                  onChange={(e) => setAdminForm({ ...adminForm, role: e.target.value })}
                  className="w-full h-10 px-3 bg-slate-850 border border-slate-800 rounded-lg text-slate-200 text-sm focus:outline-none focus:border-indigo-500 font-semibold"
                >
                  <option value="ADMIN">ADMIN - Administrator (Tizim boshqaruvi)</option>
                  <option value="OPERATOR">OPERATOR - CRM Operator (Leadlar va mijozlar)</option>
                  <option value="CASHIER">CASHIER - Kassir (To'lovlarni qabul qilish)</option>
                  <option value="ACCOUNTANT">ACCOUNTANT - Hisobchi (Moliya va tariflar)</option>
                  <option value="BRANCH_ADMIN">BRANCH_ADMIN - Filial Administratori</option>
                  <option value="MENTOR">MENTOR - O'qituvchi / Mentor</option>
                  <option value="SUPER_ADMIN">SUPER_ADMIN - Bosh Administrator</option>
                </select>
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
                {editingItem ? "Saqlash" : "Foydalanuvchi Yaratish"}
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

      {/* Modal: Change Group (Single & Bulk) */}
      {showTransferGroupModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-[110] p-4 animate-fadeIn">
          <form onSubmit={handleTransferGroupSubmit} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-cyan-400">
                <FolderGit size={20} />
                <h3 className="font-extrabold text-white text-base">
                  {transferTargetStudent 
                    ? `${transferTargetStudent.fullName} uchun Guruhni Almashtirish`
                    : `${selectedStudentIds.length} ta Talabani Guruhga Biriktirish`
                  }
                </h3>
              </div>
              <button type="button" onClick={() => setShowTransferGroupModal(false)} className="text-slate-400 hover:text-white cursor-pointer border-0 bg-transparent">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4">
              <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-xs text-indigo-300 leading-relaxed font-medium">
                💡 <strong>Eslatma:</strong> Talaba yangi guruhga o'tkazilganda, uning to'plagan barcha ballari (XP), yutuqlari va baholari <strong>to'liq saqlanib qoladi</strong>!
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">Yangi Guruhni Tanlang</label>
                <CustomSelect
                  value={targetGroupId}
                  onChange={(val) => setTargetGroupId(val)}
                  options={groups.map(g => ({ value: g.id, label: `${g.name} (${g.courseName || 'Kurs'})` }))}
                  placeholder="Guruhni tanlang..."
                  className="w-full"
                />
              </div>
            </div>

            <div className="pt-4 flex gap-3">
              <button 
                type="button" 
                onClick={() => setShowTransferGroupModal(false)} 
                className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-750 text-slate-300 font-semibold rounded-lg text-xs cursor-pointer border border-slate-700/50"
              >
                Bekor qilish
              </button>
              <button 
                type="submit" 
                disabled={!targetGroupId}
                className="flex-1 py-2.5 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white font-bold rounded-lg text-xs cursor-pointer shadow shadow-cyan-500/10 border-0"
              >
                Guruhga o'tkazish
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal: Reset Points (Single & Bulk) */}
      {showResetPointsModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-[110] p-4 animate-fadeIn">
          <form onSubmit={handleResetPointsSubmit} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-amber-500">
                <RotateCcw size={20} />
                <h3 className="font-extrabold text-white text-base">
                  {resetPointsTargetStudent 
                    ? `${resetPointsTargetStudent.fullName} Ballarini 0 ga Tushirish`
                    : `${selectedStudentIds.length} ta Talaba Ballarini 0 ga Tushirish`
                  }
                </h3>
              </div>
              <button type="button" onClick={() => setShowResetPointsModal(false)} className="text-slate-400 hover:text-white cursor-pointer border-0 bg-transparent">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4">
              <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-amber-300 leading-relaxed font-medium">
                ⚠️ <strong>Diqqat:</strong> Talabaning joriy balansi <strong>0 XP</strong> ga tushiriladi. Avvalgi barcha ballar va sabablar talabaning "Ballar Tarixi"da <strong>100% saqlanib qoladi</strong> va oylik arxiv sifatida ko'rinadi.
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">Sabab / Izoh (Ixtiyoriy)</label>
                <input
                  type="text"
                  placeholder="Masalan: Yangi oy uchun ballar nollashtirildi..."
                  value={resetReason}
                  onChange={e => setResetReason(e.target.value)}
                  className="w-full h-11 px-4 bg-slate-950/60 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-indigo-500 text-sm font-semibold"
                />
              </div>
            </div>

            <div className="pt-4 flex gap-3">
              <button 
                type="button" 
                onClick={() => setShowResetPointsModal(false)} 
                className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-750 text-slate-300 font-semibold rounded-lg text-xs cursor-pointer border border-slate-700/50"
              >
                Bekor qilish
              </button>
              <button 
                type="submit" 
                className="flex-1 py-2.5 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-lg text-xs cursor-pointer shadow shadow-amber-500/10 border-0"
              >
                Ballarni 0 ga tushirish
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal: Bulk Delete Confirmation */}
      {showBulkDeleteConfirmModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-[110] p-4 animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-sm w-full shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-500">
              <div className="p-2 bg-rose-500/10 rounded-lg">
                <AlertTriangle size={20} />
              </div>
              <h3 className="font-extrabold text-white text-base">Ommaviy O'chirish</h3>
            </div>
            <p className="text-slate-300 text-xs font-semibold leading-relaxed">
              Tanlangan <strong>{selectedStudentIds.length} ta</strong> talabani tizimdan o'chirish/arxivlashni tasdiqlaysizmi?
            </p>
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowBulkDeleteConfirmModal(false)}
                className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-750 text-slate-300 font-semibold rounded-lg text-xs cursor-pointer border border-slate-700/50"
              >
                Bekor qilish
              </button>
              <button
                type="button"
                onClick={handleBulkDeleteSubmit}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-semibold rounded-lg text-xs cursor-pointer shadow shadow-rose-500/10 border-0"
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
