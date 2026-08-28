import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  User, 
  Phone, 
  Lock, 
  Camera, 
  Save, 
  CheckCircle2, 
  AlertTriangle, 
  Shield, 
  Trophy, 
  Award, 
  Calendar, 
  BookOpen, 
  Users, 
  Sparkles,
  CreditCard,
  Building
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Profile() {
  const { user, token } = useAuth();

  const [formData, setFormData] = useState({
    fullName: user?.fullName || '',
    phone: user?.phone || '',
    avatarUrl: user?.avatarUrl || '',
    password: '',
    confirmPassword: ''
  });

  const [avatarPreview, setAvatarPreview] = useState(user?.avatarUrl || '');
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Additional data for specific roles
  const [extraInfo, setExtraInfo] = useState(null);

  useEffect(() => {
    // Refresh /me to get latest info
    axios.get('/api/auth/me')
      .then(res => {
        const d = res.data;
        setFormData(prev => ({
          ...prev,
          fullName: d.fullName || '',
          phone: d.phone || '',
          avatarUrl: d.avatarUrl || ''
        }));
        setAvatarPreview(d.avatarUrl || '');
        setExtraInfo(d);
      })
      .catch(err => console.error("Could not load user profile", err));
  }, []);

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Check size (max 3MB)
    if (file.size > 3 * 1024 * 1024) {
      setErrorMessage("Rasm hajmi 3MB dan oshmasligi kerak!");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result;
      setAvatarPreview(base64String);
      setFormData(prev => ({ ...prev, avatarUrl: base64String }));
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (formData.password && formData.password !== formData.confirmPassword) {
      setErrorMessage("Yangi parollar bir-biriga mos kelmadi!");
      return;
    }

    if (formData.password && formData.password.length < 6) {
      setErrorMessage("Parol kamida 6 ta belgidan iborat bo'lishi kerak!");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        fullName: formData.fullName,
        phone: formData.phone,
        avatarUrl: formData.avatarUrl
      };
      if (formData.password) {
        payload.password = formData.password;
      }

      const res = await axios.put('/api/auth/profile', payload);
      setSuccessMessage("Profil ma'lumotlari muvaffaqiyatli saqlandi!");
      
      // Update local storage user object if needed
      if (user) {
        user.fullName = res.data.fullName;
        user.phone = res.data.phone;
        user.avatarUrl = res.data.avatarUrl;
      }

      setFormData(prev => ({ ...prev, password: '', confirmPassword: '' }));
      setTimeout(() => setSuccessMessage(''), 4000);
    } catch (err) {
      console.error(err);
      setErrorMessage(err.response?.data?.message || err.response?.data || "Profilni yangilashda xatolik yuz berdi.");
    } finally {
      setLoading(false);
    }
  };

  const getRoleTitle = (r) => {
    switch (r) {
      case 'SUPER_ADMIN': return "Bosh Administrator (Super Admin)";
      case 'BRANCH_ADMIN': return "Filial Administratori";
      case 'MENTOR': return "Ustoz / Mentor";
      case 'CASHIER': return "Kassir / Moliya Mas'uli";
      case 'ACCOUNTANT': return "Hisobchi (Buxgalter)";
      case 'OPERATOR': return "Operator / Sotuv Mas'uli";
      case 'STUDENT': return "O'quvchi / Talaba";
      default: return r || 'Foydalanuvchi';
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-8 overflow-y-auto max-h-[calc(100vh-4rem)] custom-scrollbar">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-2">
          <User className="text-indigo-400" />
          Foydalanuvchi Profili
        </h1>
        <p className="text-sm text-slate-400 mt-1 font-medium">
          Shaxsiy ma'lumotlaringizni ko'rish, tahrirlash va hisobingizni sozlash
        </p>
      </div>

      {/* Alerts */}
      {successMessage && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex items-center gap-3 text-emerald-300 font-semibold text-sm animate-fadeIn shadow-lg">
          <CheckCircle2 size={18} className="shrink-0 text-emerald-400" />
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl flex items-center gap-3 text-rose-300 font-semibold text-sm animate-fadeIn shadow-lg">
          <AlertTriangle size={18} className="shrink-0 text-rose-400" />
          <span>{errorMessage}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Avatar & Overview Card */}
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl text-center relative overflow-hidden">
            {/* Background Glow */}
            <div className="absolute -top-10 -left-10 w-40 h-40 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none"></div>

            {/* Avatar container */}
            <div className="relative w-32 h-32 mx-auto mb-4 group">
              {avatarPreview ? (
                <img 
                  src={avatarPreview} 
                  alt={formData.fullName} 
                  className="w-32 h-32 rounded-3xl object-cover border-2 border-indigo-500/40 shadow-2xl shadow-indigo-600/20"
                />
              ) : (
                <div className="w-32 h-32 rounded-3xl bg-slate-800 border-2 border-indigo-500/30 flex items-center justify-center text-4xl font-black text-indigo-400 shadow-2xl">
                  {formData.fullName?.charAt(0) || 'U'}
                </div>
              )}

              {/* Upload Overlay Button */}
              <label 
                htmlFor="avatar-upload-input"
                className="absolute inset-0 rounded-3xl bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center cursor-pointer text-white gap-1 backdrop-blur-xs"
              >
                <Camera size={22} className="text-indigo-400" />
                <span className="text-[11px] font-bold">Rasm yuklash</span>
              </label>
              <input 
                id="avatar-upload-input"
                type="file" 
                accept="image/*" 
                onChange={handleAvatarChange}
                className="hidden" 
              />
            </div>

            <h2 className="text-xl font-bold text-slate-100 mb-1">{formData.fullName || user?.fullName}</h2>
            <div className="inline-block px-3 py-1 bg-indigo-500/10 text-indigo-400 font-extrabold text-xs uppercase tracking-wider rounded-full border border-indigo-500/20 mb-4">
              {getRoleTitle(user?.role)}
            </div>

            {/* Quick stats / summary depending on role */}
            <div className="border-t border-slate-800/80 pt-4 space-y-2 text-left text-xs text-slate-400">
              <div className="flex justify-between py-1">
                <span className="font-medium">Foydalanuvchi nomi:</span>
                <span className="font-mono text-slate-200 font-bold">{user?.username}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="font-medium">Telefon:</span>
                <span className="text-slate-200 font-semibold">{formData.phone || 'Kiritilmagan'}</span>
              </div>
              {extraInfo?.groupName && (
                <div className="flex justify-between py-1">
                  <span className="font-medium">Biriktirilgan Guruh:</span>
                  <span className="text-indigo-400 font-bold uppercase">{extraInfo.groupName}</span>
                </div>
              )}
            </div>
          </div>

          {/* Role specific informative badge */}
          {user?.role === 'STUDENT' && (
            <div className="bg-gradient-to-br from-indigo-950/40 to-slate-900 border border-indigo-500/20 rounded-3xl p-5 shadow-lg space-y-3">
              <div className="flex items-center gap-2 text-indigo-400 font-bold text-sm">
                <Trophy size={18} />
                <span>O'quvchi Maqomi</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Sizning barcha faolligingiz, vazifalar va davomatingiz baholanib borilmoqda. 
                Guruh va umumiy reytingdagi o'rningizni "Reyting" bo'limida kuzatishingiz mumkin.
              </p>
            </div>
          )}

          {user?.role === 'MENTOR' && (
            <div className="bg-gradient-to-br from-amber-950/40 to-slate-900 border border-amber-500/20 rounded-3xl p-5 shadow-lg space-y-3">
              <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
                <Award size={18} />
                <span>Ustoz Maqomi</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Guruhlaringiz davomatini belgilash, darslarda o'quvchilarga ballar qo'yish 
                va baholar jurnalini yuritish huquqiga egasiz.
              </p>
            </div>
          )}
        </div>

        {/* Right Column: Edit Form (Name, Phone, Password, Avatar) */}
        <div className="lg:col-span-2 space-y-6">
          <form onSubmit={handleSubmit} className="bg-slate-900 border border-slate-800 rounded-3xl p-7 shadow-xl space-y-6">
            <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2 border-b border-slate-800 pb-3">
              <User size={18} className="text-indigo-400" />
              Shaxsiy Ma'lumotlarni Tahrirlash
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Full Name */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  To'liq Ism va Familiya
                </label>
                <input
                  type="text"
                  required
                  value={formData.fullName}
                  onChange={e => setFormData({ ...formData, fullName: e.target.value })}
                  placeholder="Masalan: Alisher Navoiy"
                  className="w-full h-11 px-4 bg-slate-950/60 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-indigo-500 text-sm font-semibold transition-all"
                />
              </div>

              {/* Phone */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Phone size={14} className="text-indigo-400" />
                  Telefon Raqam
                </label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={e => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+998 90 123 45 67"
                  className="w-full h-11 px-4 bg-slate-950/60 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-indigo-500 text-sm font-semibold transition-all"
                />
              </div>
            </div>

            {/* Password Change Section */}
            <div className="pt-4 border-t border-slate-800/80 space-y-4">
              <h3 className="text-base font-bold text-slate-200 flex items-center gap-2">
                <Lock size={16} className="text-amber-400" />
                Parolni Yangilash (Ixtiyoriy)
              </h3>
              <p className="text-xs text-slate-500">
                Agar parolni o'zgartirmoqchi bo'lsangiz, yangi parolni kiriting. Bo'sh qoldirsangiz amaldagi parol o'zgarmaydi.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                    Yangi Parol
                  </label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                    placeholder="••••••••"
                    className="w-full h-11 px-4 bg-slate-950/60 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-indigo-500 text-sm transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                    Parolni Tasdiqlash
                  </label>
                  <input
                    type="password"
                    value={formData.confirmPassword}
                    onChange={e => setFormData({ ...formData, confirmPassword: e.target.value })}
                    placeholder="••••••••"
                    className="w-full h-11 px-4 bg-slate-950/60 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-indigo-500 text-sm transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-4 flex justify-end gap-3 border-t border-slate-800">
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 disabled:opacity-50 text-white font-extrabold rounded-xl text-sm shadow-lg shadow-indigo-600/20 transition-all flex items-center gap-2 cursor-pointer border-0"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-white mr-1"></div>
                ) : (
                  <Save size={16} />
                )}
                <span>O'zgarishlarni Saqlash</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
