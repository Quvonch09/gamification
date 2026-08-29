import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { 
  Bell, 
  Check, 
  CheckCheck, 
  Trash2, 
  DollarSign, 
  Clock, 
  PhoneCall, 
  BookOpen, 
  AlertCircle,
  RefreshCw,
  Filter,
  Phone
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Notifications({ onNotificationUpdated }) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('ALL'); // 'ALL' | 'UNREAD' | 'PAYMENT' | 'ABSENT_STUDENT_CALL' | 'LESSON'

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/notifications');
      setNotifications(res.data || []);
      if (onNotificationUpdated) onNotificationUpdated();
    } catch (err) {
      console.error("Error fetching notifications:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (id) => {
    try {
      await axios.put(`/api/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
      if (onNotificationUpdated) onNotificationUpdated();
    } catch (err) {
      console.error("Error marking notification as read:", err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await axios.put('/api/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      if (onNotificationUpdated) onNotificationUpdated();
    } catch (err) {
      console.error("Error marking all as read:", err);
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`/api/notifications/${id}`);
      setNotifications(prev => prev.filter(n => n.id !== id));
      if (onNotificationUpdated) onNotificationUpdated();
    } catch (err) {
      console.error("Error deleting notification:", err);
    }
  };

  const filteredList = useMemo(() => {
    return notifications.filter(n => {
      if (filterType === 'UNREAD') return !n.read;
      if (filterType === 'PAYMENT') return n.type === 'PAYMENT';
      if (filterType === 'ABSENT_STUDENT_CALL') return n.type === 'ABSENT_STUDENT_CALL';
      if (filterType === 'LESSON') return n.type === 'LESSON' || n.type === 'ATTENDANCE_REMINDER';
      return true;
    });
  }, [notifications, filterType]);

  const unreadCount = useMemo(() => {
    return notifications.filter(n => !n.read).length;
  }, [notifications]);

  const getIcon = (type) => {
    switch (type) {
      case 'PAYMENT':
        return (
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
            <DollarSign size={18} />
          </div>
        );
      case 'ABSENT_STUDENT_CALL':
        return (
          <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center shrink-0 animate-pulse">
            <PhoneCall size={18} />
          </div>
        );
      case 'ATTENDANCE_REMINDER':
      case 'LESSON':
        return (
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
            <Clock size={18} />
          </div>
        );
      default:
        return (
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0">
            <Bell size={18} />
          </div>
        );
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6 animate-fadeIn font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
              <Bell size={20} />
            </div>
            Bildirishnomalar Markazi
            {unreadCount > 0 && (
              <span className="px-2 py-0.5 rounded-full text-xs font-black bg-rose-500 text-white shadow-lg shadow-rose-500/30">
                {unreadCount} yangi
              </span>
            )}
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            To'lovlar, darslar boshlanishi, davomat eslatmalari va qo'ng'iroq qilish haqidagi yangiliklar
          </p>
        </div>

        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllAsRead}
              className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-indigo-600/20 transition-all cursor-pointer"
            >
              <CheckCheck size={14} />
              Barchasini o'qilgan qilish
            </button>
          )}

          <button
            onClick={fetchNotifications}
            className="p-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 rounded-xl cursor-pointer transition-all"
            title="Yangilash"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2 bg-slate-950 p-1.5 rounded-2xl border border-slate-800 text-xs font-bold">
        <button
          onClick={() => setFilterType('ALL')}
          className={`px-3.5 py-2 rounded-xl transition-all cursor-pointer ${
            filterType === 'ALL' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
          }`}
        >
          Barchasi ({notifications.length})
        </button>

        <button
          onClick={() => setFilterType('UNREAD')}
          className={`px-3.5 py-2 rounded-xl transition-all cursor-pointer ${
            filterType === 'UNREAD' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
          }`}
        >
          O'qilmaganlar ({unreadCount})
        </button>

        <button
          onClick={() => setFilterType('ABSENT_STUDENT_CALL')}
          className={`px-3.5 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
            filterType === 'ABSENT_STUDENT_CALL' ? 'bg-rose-600 text-white shadow' : 'text-slate-400 hover:text-white'
          }`}
        >
          <PhoneCall size={13} />
          Kelmaganlar (Qo'ng'iroq)
        </button>

        <button
          onClick={() => setFilterType('PAYMENT')}
          className={`px-3.5 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
            filterType === 'PAYMENT' ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-white'
          }`}
        >
          <DollarSign size={13} />
          To'lovlar
        </button>

        <button
          onClick={() => setFilterType('LESSON')}
          className={`px-3.5 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
            filterType === 'LESSON' ? 'bg-amber-600 text-white shadow' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Clock size={13} />
          Darslar & Davomat
        </button>
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        {filteredList.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-12 text-center text-slate-500 space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-slate-800/50 flex items-center justify-center mx-auto text-slate-600">
              <Bell size={26} />
            </div>
            <h3 className="text-base font-bold text-slate-300">Bildirishnomalar mavjud emas</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Sizga tegishli barcha bildirishnomalar shu yerda ko'rinadi.
            </p>
          </div>
        ) : (
          filteredList.map((item) => {
            let meta = {};
            if (item.metadataJson) {
              try {
                meta = JSON.parse(item.metadataJson);
              } catch (e) {}
            }

            const phoneToCall = meta.parentPhone || meta.phone;

            return (
              <div
                key={item.id}
                className={`p-4 rounded-2xl border transition-all flex items-start gap-4 ${
                  !item.read 
                    ? 'bg-slate-900/95 border-indigo-500/30 shadow-lg shadow-indigo-500/5' 
                    : 'bg-slate-900/50 border-slate-800/80 opacity-80'
                }`}
              >
                {getIcon(item.type)}

                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-sm text-white">{item.title}</h4>
                      {!item.read && (
                        <span className="w-2 h-2 rounded-full bg-indigo-500 shadow shadow-indigo-500 animate-pulse" />
                      )}
                    </div>
                    <span className="text-[10px] font-mono text-slate-500 shrink-0">
                      {item.createdAt ? new Date(item.createdAt).toLocaleString() : ''}
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed font-medium">
                    {item.message}
                  </p>

                  {/* Action row for specific types (e.g. absent student quick call) */}
                  {item.type === 'ABSENT_STUDENT_CALL' && phoneToCall && (
                    <div className="pt-2 flex items-center gap-2">
                      <a
                        href={`tel:${phoneToCall}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-600/20 transition-all"
                      >
                        <Phone size={12} />
                        Telefon qilish: {phoneToCall}
                      </a>
                    </div>
                  )}
                </div>

                {/* Right action icons */}
                <div className="flex items-center gap-1 shrink-0 pt-0.5">
                  {!item.read && (
                    <button
                      onClick={() => handleMarkAsRead(item.id)}
                      title="O'qilgan deb belgilash"
                      className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-emerald-400 transition-colors cursor-pointer"
                    >
                      <Check size={16} />
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(item.id)}
                    title="O'chirish"
                    className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
