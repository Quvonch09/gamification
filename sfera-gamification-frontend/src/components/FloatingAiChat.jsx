import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Sparkles, X, Send, Loader2, Bot, Minimize2, RotateCcw } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

export default function FloatingAiChat() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: `Assalomu alaykum, ${user?.fullName?.split(' ')[0] || 'hurmatli foydalanuvchi'}! 👋\n\nMen **Sfera AI** — sizning shaxsiy yordamchingizman. Tizim statistikasi, to'lovlar, qarzdorlik, o'quvchilar va ko'p boshqa savollaringizga javob bera olaman.\n\nQanday yordam kerak?`
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen && !isMinimized) {
      scrollToBottom();
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [messages, isOpen, isMinimized]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setLoading(true);
    try {
      const res = await axios.post('/api/ai/chat', { message: userMsg });
      setMessages(prev => [...prev, { role: 'assistant', content: res.data.reply || 'Javob olinmadi.' }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', content: '❌ Xatolik yuz berdi. Iltimos, qayta urinib ko\'ring.' }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearChat = () => {
    setMessages([{
      role: 'assistant',
      content: `Suhbat tozalandi. Yangi savol bering! 🔄`
    }]);
  };

  // Don't show for non-logged in users
  if (!user) return null;

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => { setIsOpen(prev => !prev); setIsMinimized(false); }}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-gradient-to-br from-violet-600 to-indigo-700 shadow-2xl shadow-violet-900/50 flex items-center justify-center hover:scale-110 transition-all duration-300 hover:shadow-violet-500/60 group border-2 border-violet-400/30"
        title="Sfera AI Yordamchi"
      >
        {isOpen ? (
          <X className="w-6 h-6 text-white" />
        ) : (
          <>
            <Sparkles className="w-6 h-6 text-white group-hover:rotate-12 transition-transform duration-300" />
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full border-2 border-slate-950 animate-pulse" />
          </>
        )}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className={`fixed bottom-24 right-6 z-50 bg-slate-900 border border-slate-700/60 rounded-2xl shadow-2xl shadow-black/50 flex flex-col transition-all duration-300 ${isMinimized ? 'w-72 h-14' : 'w-96 h-[540px]'}`}
          style={{ maxWidth: 'calc(100vw - 2rem)', maxHeight: 'calc(100vh - 8rem)' }}
        >
          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-700/60 bg-gradient-to-r from-violet-900/40 to-indigo-900/40 rounded-t-2xl">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center flex-shrink-0">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white leading-none">Sfera AI</p>
              <p className="text-xs text-violet-300/80 leading-none mt-0.5">Yordamchi · Online</p>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={clearChat} className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-lg transition-colors" title="Tozalash">
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
              <button onClick={() => setIsMinimized(prev => !prev)} className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-lg transition-colors" title="Kichraytirish">
                <Minimize2 className="w-3.5 h-3.5" />
              </button>
              <button onClick={() => setIsOpen(false)} className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-900/20 rounded-lg transition-colors">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Messages */}
          {!isMinimized && (
            <>
              <div className="flex-1 overflow-y-auto p-3 space-y-3 scrollbar-thin scrollbar-thumb-slate-700">
                {messages.map((msg, i) => (
                  <div key={i} className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    {msg.role === 'assistant' && (
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Bot className="w-3.5 h-3.5 text-white" />
                      </div>
                    )}
                    <div className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-violet-600 text-white rounded-tr-sm'
                        : 'bg-slate-800 text-slate-100 rounded-tl-sm border border-slate-700/50'
                    }`}>
                      {msg.role === 'assistant' ? (
                        <div className="prose prose-invert prose-sm max-w-none text-slate-100">
                          <ReactMarkdown>{msg.content}</ReactMarkdown>
                        </div>
                      ) : (
                        <p>{msg.content}</p>
                      )}
                    </div>
                  </div>
                ))}
                {loading && (
                  <div className="flex gap-2 justify-start">
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center flex-shrink-0">
                      <Bot className="w-3.5 h-3.5 text-white" />
                    </div>
                    <div className="bg-slate-800 rounded-2xl rounded-tl-sm px-3 py-2 border border-slate-700/50">
                      <div className="flex gap-1 items-center">
                        <div className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <div className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <div className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Quick suggestions */}
              {messages.length === 1 && (
                <div className="px-3 pb-2 flex flex-wrap gap-1.5">
                  {['Bugungi to\'lovlar', 'Barcha qarzdorlar', 'Faol guruhlar', 'Davomat holati'].map(q => (
                    <button key={q} onClick={() => { setInput(q); setTimeout(() => sendMessage(), 0); }}
                      className="text-xs px-2.5 py-1 bg-slate-800 hover:bg-violet-900/40 hover:text-violet-300 text-slate-400 rounded-full border border-slate-700/50 hover:border-violet-500/50 transition-colors">
                      {q}
                    </button>
                  ))}
                </div>
              )}

              {/* Input */}
              <div className="p-3 border-t border-slate-700/60">
                <div className="flex gap-2 items-end bg-slate-800 rounded-xl border border-slate-700/60 focus-within:border-violet-500/50 transition-colors">
                  <textarea
                    ref={inputRef}
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Savol yozing... (Enter = yuborish)"
                    rows={1}
                    className="flex-1 bg-transparent px-3 py-2.5 text-sm text-white placeholder-slate-500 resize-none outline-none leading-relaxed"
                    style={{ maxHeight: '80px' }}
                  />
                  <button
                    onClick={sendMessage}
                    disabled={!input.trim() || loading}
                    className="p-2.5 m-1 rounded-lg bg-violet-600 hover:bg-violet-500 disabled:opacity-40 disabled:cursor-not-allowed text-white transition-colors flex-shrink-0"
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}
