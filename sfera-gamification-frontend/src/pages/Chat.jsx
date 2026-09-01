import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { 
  MessageSquare, 
  Send, 
  Search, 
  Plus, 
  Users, 
  UserCheck, 
  ShieldAlert, 
  ShieldCheck, 
  Clock, 
  Check, 
  CheckCheck, 
  RefreshCw, 
  X, 
  Filter, 
  User, 
  GraduationCap, 
  Crown, 
  Eye, 
  ChevronRight,
  Sparkles,
  Info
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Chat({ setCurrentPage }) {
  const { user } = useAuth();
  const isAdmin = user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN' || user?.role === 'BRANCH_ADMIN';

  const [chatRooms, setChatRooms] = useState([]);
  const [adminRooms, setAdminRooms] = useState([]);
  const [activeRoom, setActiveRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState('');
  const [loadingRooms, setLoadingRooms] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('my'); // 'my' or 'admin'
  const [filterType, setFilterType] = useState('ALL'); // 'ALL', 'DIRECT', 'GROUP'

  // New Chat Modal state
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [modalTab, setModalTab] = useState('direct'); // 'direct' or 'group'
  const [contacts, setContacts] = useState({ students: [], mentors: [], admins: [] });
  const [selectedContact, setSelectedContact] = useState(null);
  const [groupTitle, setGroupTitle] = useState('');
  const [selectedGroupMembers, setSelectedGroupMembers] = useState([]);
  const [creatingChat, setCreatingChat] = useState(false);

  const messagesEndRef = useRef(null);

  // Load chat rooms list
  useEffect(() => {
    loadRooms();
    if (isAdmin) {
      loadAdminRooms();
    }
  }, [user]);

  // Polling for room list and active room messages
  useEffect(() => {
    const interval = setInterval(() => {
      if (activeTab === 'my') {
        loadRooms(true);
      } else if (isAdmin && activeTab === 'admin') {
        loadAdminRooms(true);
      }

      if (activeRoom) {
        loadMessages(activeRoom.id, true);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [activeTab, activeRoom, isAdmin]);

  // Scroll to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadRooms = async (silent = false) => {
    if (!silent) setLoadingRooms(true);
    try {
      const res = await axios.get('/api/chat/rooms');
      const list = res.data || [];
      setChatRooms(list);
    } catch (err) {
      console.error("Load chat rooms error", err);
    } finally {
      if (!silent) setLoadingRooms(false);
    }
  };

  const loadAdminRooms = async (silent = false) => {
    if (!isAdmin) return;
    try {
      const res = await axios.get('/api/chat/admin/all-rooms');
      setAdminRooms(res.data || []);
    } catch (err) {
      console.error("Load admin rooms error", err);
    }
  };

  const loadMessages = async (roomId, silent = false) => {
    if (!silent) setLoadingMessages(true);
    try {
      const res = await axios.get(`/api/chat/rooms/${roomId}/messages`);
      setMessages(res.data || []);
    } catch (err) {
      console.error("Load messages error", err);
    } finally {
      if (!silent) setLoadingMessages(false);
    }
  };

  const handleSelectRoom = (room) => {
    setActiveRoom(room);
    loadMessages(room.id);
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!messageInput.trim() || !activeRoom || sending) return;

    const content = messageInput.trim();
    setMessageInput('');
    setSending(true);

    try {
      const res = await axios.post(`/api/chat/rooms/${activeRoom.id}/messages`, { content });
      if (res.data) {
        setMessages(prev => [...prev, res.data]);
        // Update room last message in state
        const updateList = (list) => list.map(r => r.id === activeRoom.id ? {
          ...r,
          lastMessage: { content, senderName: user?.fullName, createdAt: new Date().toISOString() },
          updatedAt: new Date().toISOString()
        } : r);
        setChatRooms(updateList);
        if (isAdmin) setAdminRooms(updateList);
      }
    } catch (err) {
      console.error("Send message error", err);
      setMessageInput(content); // Restore input on error
    } finally {
      setSending(false);
    }
  };

  const handleOpenNewChatModal = async () => {
    setShowNewChatModal(true);
    try {
      const res = await axios.get('/api/chat/contacts');
      setContacts(res.data || { students: [], mentors: [], admins: [] });
    } catch (err) {
      console.error("Load contacts error", err);
    }
  };

  const handleStartDirectChat = async (contactId) => {
    setCreatingChat(true);
    try {
      const res = await axios.post('/api/chat/direct', { targetUserId: contactId });
      if (res.data) {
        setShowNewChatModal(false);
        await loadRooms();
        handleSelectRoom(res.data);
      }
    } catch (err) {
      console.error("Start direct chat error", err);
    } finally {
      setCreatingChat(false);
    }
  };

  const handleCreateGroupChat = async (e) => {
    e.preventDefault();
    if (!groupTitle.trim() || selectedGroupMembers.length === 0 || creatingChat) return;

    setCreatingChat(true);
    try {
      const res = await axios.post('/api/chat/group', {
        title: groupTitle.trim(),
        participantUserIds: selectedGroupMembers
      });
      if (res.data) {
        setShowNewChatModal(false);
        setGroupTitle('');
        setSelectedGroupMembers([]);
        await loadRooms();
        handleSelectRoom(res.data);
      }
    } catch (err) {
      console.error("Create group chat error", err);
    } finally {
      setCreatingChat(false);
    }
  };

  const toggleGroupMember = (uid) => {
    setSelectedGroupMembers(prev => 
      prev.includes(uid) ? prev.filter(id => id !== uid) : [...prev, uid]
    );
  };

  // Filtered room lists
  const currentList = activeTab === 'admin' ? adminRooms : chatRooms;
  const filteredRooms = currentList.filter(room => {
    const titleMatch = room.title?.toLowerCase().includes(searchQuery.toLowerCase());
    const typeMatch = filterType === 'ALL' || room.type === filterType;
    return titleMatch && typeMatch;
  });

  const getRoleBadge = (role) => {
    switch (role) {
      case 'SUPER_ADMIN': return { label: 'Super Admin', color: 'bg-rose-500/20 text-rose-300 border-rose-500/30' };
      case 'ADMIN':
      case 'BRANCH_ADMIN': return { label: 'Admin', color: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30' };
      case 'MENTOR': return { label: 'Mentor', color: 'bg-amber-500/20 text-amber-300 border-amber-500/30' };
      case 'STUDENT': return { label: 'O\'quvchi', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' };
      default: return { label: role || 'Foydalanuvchi', color: 'bg-slate-800 text-slate-300 border-slate-700' };
    }
  };

  return (
    <div className="h-[calc(100vh-4rem)] p-2 sm:p-4 max-w-7xl mx-auto font-sans flex flex-col animate-fadeIn">
      
      {/* Main Glassmorphism Chat Container */}
      <div className="flex-1 bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row">
        
        {/* Left Sidebar: Conversations & Contacts List */}
        <div className={`w-full md:w-80 lg:w-96 border-r border-slate-800 flex flex-col bg-slate-900/80 shrink-0 ${
          activeRoom ? 'hidden md:flex' : 'flex'
        }`}>
          
          {/* Header */}
          <div className="p-4 border-b border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center font-bold">
                  <MessageSquare size={18} />
                </div>
                <div>
                  <h2 className="text-base font-black text-white leading-tight">Chat & Muloqot</h2>
                  <p className="text-[11px] text-slate-400">Tizim ichki xabarlashuvi</p>
                </div>
              </div>

              <button
                onClick={handleOpenNewChatModal}
                className="p-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-xs flex items-center gap-1 shadow-lg shadow-indigo-600/20 transition-all cursor-pointer"
                title="Yangi chat yoki guruh yaratish"
              >
                <Plus size={16} />
                <span className="hidden sm:inline">Yangi</span>
              </button>
            </div>

            {/* Admin Monitoring Mode Switcher */}
            {isAdmin && (
              <div className="grid grid-cols-2 p-1 bg-slate-950/70 border border-slate-800 rounded-xl text-xs font-bold">
                <button
                  onClick={() => setActiveTab('my')}
                  className={`py-1.5 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    activeTab === 'my' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Users size={13} />
                  <span>Chatlarim</span>
                </button>
                <button
                  onClick={() => setActiveTab('admin')}
                  className={`py-1.5 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    activeTab === 'admin' ? 'bg-rose-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
                  }`}
                  title="Super Admin / Admin Monitoring rejimi"
                >
                  <Eye size={13} />
                  <span>Admin Nazorati</span>
                </button>
              </div>
            )}

            {/* Search Input */}
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Chatlarni qidirish..."
                className="w-full h-9 pl-9 pr-3 bg-slate-950/60 border border-slate-800 rounded-xl text-slate-200 text-xs focus:outline-none focus:border-indigo-500"
              />
              <Search className="absolute left-3 top-2.5 text-slate-500" size={14} />
            </div>

            {/* Filter Chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-1">
              <button
                onClick={() => setFilterType('ALL')}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-all cursor-pointer ${
                  filterType === 'ALL' ? 'bg-slate-800 text-white border-slate-700' : 'bg-transparent text-slate-400 border-transparent hover:text-slate-300'
                }`}
              >
                Barchasi
              </button>
              <button
                onClick={() => setFilterType('DIRECT')}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-all cursor-pointer ${
                  filterType === 'DIRECT' ? 'bg-slate-800 text-white border-slate-700' : 'bg-transparent text-slate-400 border-transparent hover:text-slate-300'
                }`}
              >
                1-ga-1
              </button>
              <button
                onClick={() => setFilterType('GROUP')}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-all cursor-pointer ${
                  filterType === 'GROUP' ? 'bg-slate-800 text-white border-slate-700' : 'bg-transparent text-slate-400 border-transparent hover:text-slate-300'
                }`}
              >
                Guruhlar
              </button>
            </div>
          </div>

          {/* Conversations List */}
          <div className="flex-1 overflow-y-auto custom-scrollbar divide-y divide-slate-850">
            {loadingRooms ? (
              <div className="py-12 flex flex-col items-center justify-center text-slate-400 text-xs">
                <RefreshCw className="w-5 h-5 animate-spin text-indigo-400 mb-2" />
                <span>Chatlar yuklanmoqda...</span>
              </div>
            ) : filteredRooms.length === 0 ? (
              <div className="py-12 px-4 text-center text-slate-500 text-xs space-y-2">
                <MessageSquare className="w-8 h-8 mx-auto text-slate-600 mb-1" />
                <p className="font-semibold text-slate-400">Hozircha chatlar topilmadi</p>
                <p className="text-[11px] max-w-[200px] mx-auto">
                  "+ Yangi" tugmasi orqali shaxsiy yoki guruh muloqotini boshlang.
                </p>
              </div>
            ) : (
              filteredRooms.map((room) => {
                const isSelected = activeRoom?.id === room.id;
                const isGroup = room.type === 'GROUP';
                const unread = room.unreadCount || 0;

                return (
                  <div
                    key={room.id}
                    onClick={() => handleSelectRoom(room)}
                    className={`p-3.5 flex items-center gap-3 cursor-pointer transition-all ${
                      isSelected ? 'bg-indigo-600/15 border-l-4 border-indigo-500' : 'hover:bg-slate-850/60'
                    }`}
                  >
                    {/* Avatar / Icon */}
                    <div className="relative shrink-0">
                      {isGroup ? (
                        <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 text-indigo-300 flex items-center justify-center font-black">
                          <Users size={20} />
                        </div>
                      ) : (
                        <div className="w-11 h-11 rounded-2xl bg-slate-800 border border-slate-700 text-indigo-400 flex items-center justify-center font-bold text-base shadow-sm">
                          {room.title?.charAt(0) || 'U'}
                        </div>
                      )}
                    </div>

                    {/* Room Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <h4 className="text-xs font-bold text-white truncate">
                          {room.title}
                        </h4>
                        {room.lastMessage?.createdAt && (
                          <span className="text-[10px] text-slate-500 font-mono shrink-0">
                            {new Date(room.lastMessage.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center justify-between gap-1 mt-1">
                        <p className="text-[11px] text-slate-400 truncate">
                          {room.lastMessage ? (
                            <span>
                              <strong className="text-slate-300">{room.lastMessage.senderName}: </strong>
                              {room.lastMessage.content}
                            </span>
                          ) : (
                            <span className="italic text-slate-500">Xabarlar yo'q</span>
                          )}
                        </p>

                        {unread > 0 && (
                          <span className="w-4 h-4 rounded-full bg-emerald-500 text-slate-950 font-black text-[10px] flex items-center justify-center shrink-0 animate-pulse">
                            {unread}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

        </div>

        {/* Right Active Chat Window */}
        <div className={`flex-1 flex flex-col bg-slate-950/60 ${
          !activeRoom ? 'hidden md:flex items-center justify-center p-6 text-center' : 'flex'
        }`}>
          {!activeRoom ? (
            <div className="max-w-sm space-y-3 text-slate-500">
              <div className="w-16 h-16 rounded-3xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center mx-auto shadow-xl shadow-indigo-500/5">
                <Sparkles size={32} />
              </div>
              <h3 className="text-lg font-bold text-slate-300">Sfera IT Academy Chat</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Muloqotni boshlash uchun chap paneldan biror chatni tanlang yoki yangi shaxsiy/guruh suhbatini oching.
              </p>
            </div>
          ) : (
            <>
              {/* Chat Window Header */}
              <div className="p-3.5 sm:p-4 border-b border-slate-800 bg-slate-900/90 backdrop-blur flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  {/* Back button for mobile */}
                  <button
                    onClick={() => setActiveRoom(null)}
                    className="md:hidden p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
                  >
                    <ChevronRight size={20} className="rotate-180" />
                  </button>

                  <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center justify-center font-bold shrink-0">
                    {activeRoom.type === 'GROUP' ? <Users size={20} /> : activeRoom.title?.charAt(0)}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm sm:text-base font-bold text-white truncate">
                        {activeRoom.title}
                      </h3>
                      {activeTab === 'admin' && (
                        <span className="px-2 py-0.5 rounded-md bg-rose-500/20 border border-rose-500/30 text-rose-300 text-[10px] font-black flex items-center gap-1 shrink-0">
                          <Eye size={11} /> Nazorat Rejimi
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 truncate">
                      {activeRoom.subtitle || "Suhbat xonasi"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full font-bold">
                    ● Onlayn
                  </span>
                </div>
              </div>

              {/* Chat Messages Stream */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3.5 custom-scrollbar">
                {loadingMessages ? (
                  <div className="py-12 flex items-center justify-center text-slate-400 text-xs">
                    <RefreshCw className="w-5 h-5 animate-spin text-indigo-400 mr-2" />
                    Xabarlar yuklanmoqda...
                  </div>
                ) : messages.length === 0 ? (
                  <div className="py-16 text-center text-slate-500 text-xs">
                    <p className="font-semibold text-slate-400">Ushbu chatda xabarlar mavjud emas</p>
                    <p className="text-[11px] mt-1">Birinchi xabarni yuboring!</p>
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isMe = msg.senderId === user?.id;
                    const roleBadge = getRoleBadge(msg.senderRole);

                    return (
                      <div
                        key={msg.id}
                        className={`flex items-start gap-2.5 max-w-[85%] sm:max-w-[75%] ${
                          isMe ? 'ml-auto flex-row-reverse' : 'mr-auto'
                        }`}
                      >
                        {/* Avatar */}
                        {!isMe && (
                          <div className="w-8 h-8 rounded-xl bg-slate-800 border border-slate-700 text-indigo-400 flex items-center justify-center font-bold text-xs shrink-0 mt-1">
                            {msg.senderName?.charAt(0) || 'U'}
                          </div>
                        )}

                        <div>
                          {/* Sender name & role for incoming messages or group messages */}
                          {!isMe && (
                            <div className="flex items-center gap-2 mb-1 pl-1">
                              <span className="text-xs font-bold text-slate-300">{msg.senderName}</span>
                              <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold border ${roleBadge.color}`}>
                                {roleBadge.label}
                              </span>
                            </div>
                          )}

                          {/* Message Bubble */}
                          <div className={`p-3 rounded-2xl text-xs sm:text-sm leading-relaxed shadow-lg ${
                            isMe 
                              ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-tr-none' 
                              : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-tl-none'
                          }`}>
                            <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                            
                            <div className={`text-[9px] mt-1 font-mono text-right ${
                              isMe ? 'text-indigo-200' : 'text-slate-500'
                            }`}>
                              {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input Box */}
              <form onSubmit={handleSendMessage} className="p-3 border-t border-slate-800 bg-slate-900/90 backdrop-blur flex items-center gap-2">
                <input
                  type="text"
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  placeholder="Xabar matnini yozing..."
                  className="flex-1 h-11 px-4 bg-slate-950/80 border border-slate-800 rounded-xl text-slate-100 text-xs sm:text-sm focus:outline-none focus:border-indigo-500 font-medium"
                />
                <button
                  type="submit"
                  disabled={!messageInput.trim() || sending}
                  className="w-11 h-11 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl flex items-center justify-center shadow-lg shadow-indigo-600/30 transition-all cursor-pointer shrink-0"
                >
                  <Send size={18} />
                </button>
              </form>
            </>
          )}
        </div>

      </div>

      {/* Modal: Start New Chat or Group Chat */}
      {showNewChatModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-3xl p-6 shadow-2xl space-y-5 relative max-h-[90vh] flex flex-col">
            
            <button
              onClick={() => setShowNewChatModal(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 rounded-xl hover:bg-slate-800"
            >
              <X size={20} />
            </button>

            <div>
              <h3 className="text-lg font-bold text-white">Yangi Chat / Guruh Yaratish</h3>
              <p className="text-xs text-slate-400 mt-0.5">Shaxsiy suhbat yoki guruh ochish</p>
            </div>

            {/* Modal Tabs */}
            <div className="grid grid-cols-2 p-1 bg-slate-950 border border-slate-800 rounded-xl text-xs font-bold">
              <button
                onClick={() => setModalTab('direct')}
                className={`py-2 rounded-lg transition-all cursor-pointer ${
                  modalTab === 'direct' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                1-ga-1 Shaxsiy Chat
              </button>
              <button
                onClick={() => setModalTab('group')}
                className={`py-2 rounded-lg transition-all cursor-pointer ${
                  modalTab === 'group' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Yangi Guruh Yaratish
              </button>
            </div>

            {/* Tab 1: Direct Chat Contact Picker */}
            {modalTab === 'direct' && (
              <div className="flex-1 overflow-y-auto space-y-4 custom-scrollbar pr-1">
                <div>
                  <span className="text-xs font-bold text-slate-400 block mb-2 uppercase tracking-wider">Mentorlar va Adminlar</span>
                  <div className="space-y-1.5">
                    {[...contacts.mentors, ...contacts.admins].map(u => (
                      <div
                        key={u.id}
                        onClick={() => handleStartDirectChat(u.id)}
                        className="p-3 bg-slate-950/60 border border-slate-850 hover:border-indigo-500/50 rounded-2xl flex items-center justify-between cursor-pointer transition-all hover:bg-indigo-600/10"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-slate-800 text-indigo-400 font-bold flex items-center justify-center text-xs">
                            {u.fullName?.charAt(0)}
                          </div>
                          <div>
                            <h4 className="text-xs font-bold text-slate-200">{u.fullName}</h4>
                            <span className="text-[10px] text-slate-500 font-mono">@{u.username}</span>
                          </div>
                        </div>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getRoleBadge(u.role).color}`}>
                          {getRoleBadge(u.role).label}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <span className="text-xs font-bold text-slate-400 block mb-2 uppercase tracking-wider">Talabalar</span>
                  <div className="space-y-1.5 max-h-48 overflow-y-auto custom-scrollbar">
                    {contacts.students.map(u => (
                      <div
                        key={u.id}
                        onClick={() => handleStartDirectChat(u.id)}
                        className="p-3 bg-slate-950/60 border border-slate-850 hover:border-indigo-500/50 rounded-2xl flex items-center justify-between cursor-pointer transition-all hover:bg-indigo-600/10"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-400 font-bold flex items-center justify-center text-xs border border-emerald-500/20">
                            {u.fullName?.charAt(0)}
                          </div>
                          <div>
                            <h4 className="text-xs font-bold text-slate-200">{u.fullName}</h4>
                            <span className="text-[10px] text-slate-400">{u.groupName || "Guruhsiz"}</span>
                          </div>
                        </div>
                        <span className="text-[11px] font-bold text-indigo-400">Yozish →</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Tab 2: Create Custom Group Form */}
            {modalTab === 'group' && (
              <form onSubmit={handleCreateGroupChat} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase">Guruh Nomi</label>
                  <input
                    type="text"
                    required
                    value={groupTitle}
                    onChange={(e) => setGroupTitle(e.target.value)}
                    placeholder="Masalan: Frontend Amaliyot Guruhi..."
                    className="w-full h-11 px-4 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 text-xs font-medium focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase">
                    A'zolarni Tanlang ({selectedGroupMembers.length} ta tanlandi)
                  </label>
                  <div className="max-h-48 overflow-y-auto space-y-1.5 border border-slate-800 bg-slate-950/60 rounded-xl p-2 custom-scrollbar">
                    {[...contacts.mentors, ...contacts.students].map(u => {
                      const isChecked = selectedGroupMembers.includes(u.id);
                      return (
                        <div
                          key={u.id}
                          onClick={() => toggleGroupMember(u.id)}
                          className={`p-2.5 rounded-xl flex items-center justify-between cursor-pointer border transition-all ${
                            isChecked ? 'bg-indigo-600/20 border-indigo-500 text-white' : 'bg-slate-900 border-slate-850 text-slate-300 hover:bg-slate-850'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-lg bg-slate-800 font-bold text-xs flex items-center justify-center text-indigo-400">
                              {u.fullName?.charAt(0)}
                            </div>
                            <span className="text-xs font-semibold">{u.fullName}</span>
                          </div>
                          <div className={`w-5 h-5 rounded-md border flex items-center justify-center ${
                            isChecked ? 'bg-indigo-600 border-indigo-500 text-white' : 'border-slate-700'
                          }`}>
                            {isChecked && <Check size={12} />}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={!groupTitle.trim() || selectedGroupMembers.length === 0 || creatingChat}
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
                >
                  {creatingChat ? "Guruh Yaratilmoqda..." : "Guruh Yaratish va Boshlash"}
                </button>
              </form>
            )}

          </div>
        </div>
      )}

    </div>
  );
}
