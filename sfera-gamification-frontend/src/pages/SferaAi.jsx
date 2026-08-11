import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Sparkles, Send, Bot, User, CornerDownLeft, AlertCircle } from 'lucide-react';

export default function SferaAi() {
  const { user } = useAuth();
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      role: 'assistant',
      content: `Salom, ${user?.fullName || 'Talaba'}! Men Sfera IT Akademiyasining AI yordamchisiman.\n\nSizga dars rejangiz va o'tilgan mavzular bo'yicha savollaringizga javob berishda yordam beraman. Mendan o'tayotgan darslaringiz bo'yicha tushunmagan qismlaringizni so'rashingiz mumkin.`,
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const suggestionPrompts = [
    "Dasturlashda o'zgaruvchi nima?",
    "Bugungi dars rejalarimiz nimalardan iborat?",
    "Sinf (Class) va Obyekt (Object) farqi nimada?",
    "Uyga vazifalarni qanday topshiraman?"
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSend = (textToSend) => {
    const text = textToSend || input;
    if (!text.trim() || loading) return;

    // Add user message
    const userMsg = {
      id: Math.random().toString(),
      role: 'user',
      content: text,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    axios.post('/api/ai/chat', { message: text })
      .then(res => {
        const aiMsg = {
          id: Math.random().toString(),
          role: 'assistant',
          content: res.data.reply,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, aiMsg]);
      })
      .catch(err => {
        console.error(err);
        const errorMsg = {
          id: Math.random().toString(),
          role: 'assistant',
          content: "Kechirasiz, MegaLLM xizmati bilan bog'lanishda xatolik yuz berdi. Iltimos, keyinroq qayta urinib ko'ring.",
          isError: true,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, errorMsg]);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="p-4 sm:p-6 flex flex-col h-[calc(100vh-4rem)] bg-slate-950">
      {/* Header Info Banner */}
      <div className="bg-gradient-to-r from-indigo-500/10 to-cyan-500/10 border border-indigo-500/20 rounded-2xl p-4 mb-4 flex items-start gap-3 shrink-0">
        <div className="w-9 h-9 rounded-xl bg-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0">
          <Sparkles size={18} className="animate-pulse" />
        </div>
        <div>
          <h2 className="text-sm font-extrabold text-white">Sfera AI Sun'iy Intellekt Yordamchisi</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Sfera AI faol dars rejangiz va syllabus bo'yicha kiritilgan mavzular doirasida savollarga javob beradi. Chetdan berilgan savollar javobsiz qolishi mumkin.
          </p>
        </div>
      </div>

      {/* Chat Display Container */}
      <div className="flex-1 bg-slate-900 border border-slate-800 rounded-2xl p-4 overflow-y-auto space-y-4 flex flex-col min-h-0">
        <div className="flex-1 space-y-4 min-h-0">
          {messages.map((m) => {
            const isAi = m.role === 'assistant';
            return (
              <div 
                key={m.id} 
                className={`flex gap-3 max-w-[85%] md:max-w-[70%] animate-fadeIn ${
                  isAi ? 'self-start mr-auto' : 'self-end ml-auto flex-row-reverse'
                }`}
              >
                {/* Avatar */}
                <div className={`w-8 h-8 rounded-full border flex items-center justify-center shrink-0 ${
                  isAi 
                    ? m.isError 
                      ? 'bg-rose-500/10 border-rose-500/30 text-rose-400' 
                      : 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400'
                    : 'bg-slate-800 border-slate-700 text-slate-300'
                }`}>
                  {isAi ? <Bot size={15} /> : <User size={15} />}
                </div>

                {/* Message Bubble */}
                <div className={`rounded-2xl p-3.5 text-sm font-medium ${
                  isAi 
                    ? m.isError
                      ? 'bg-rose-500/5 border border-rose-500/10 text-rose-300'
                      : 'bg-slate-950/40 border border-slate-850 text-slate-300'
                    : 'bg-indigo-650 text-white shadow-lg shadow-indigo-650/10'
                }`}>
                  {m.isError && (
                    <div className="flex items-center gap-1 text-rose-400 font-bold mb-1.5 text-xs">
                      <AlertCircle size={13} /> Tizim Xatoligi
                    </div>
                  )}
                  <p className="whitespace-pre-line leading-relaxed">{m.content}</p>
                  <span className="block text-[9px] text-slate-500 mt-2 text-right">
                    {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            );
          })}

          {loading && (
            <div className="flex gap-3 max-w-[70%] self-start mr-auto animate-fadeIn">
              <div className="w-8 h-8 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 flex items-center justify-center shrink-0">
                <Bot size={15} />
              </div>
              <div className="bg-slate-950/40 border border-slate-850 rounded-2xl p-4 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce"></span>
                <span className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce delay-100"></span>
                <span className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce delay-200"></span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Suggestion Prompts */}
        {messages.length === 1 && !loading && (
          <div className="pt-4 border-t border-slate-850 flex flex-wrap gap-2 shrink-0">
            {suggestionPrompts.map((prompt, i) => (
              <button
                key={i}
                onClick={() => handleSend(prompt)}
                className="px-3 py-1.5 bg-slate-950 hover:bg-indigo-650/20 hover:text-indigo-400 border border-slate-800 hover:border-indigo-500/30 text-slate-400 rounded-xl text-xs font-semibold cursor-pointer transition-all"
              >
                {prompt}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Input Box Area */}
      <div className="mt-4 shrink-0">
        <div className="relative bg-slate-900 border border-slate-800 rounded-2xl p-2 flex gap-2">
          <textarea
            rows="2"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Savolingizni shu yerga yozing..."
            className="flex-1 bg-transparent text-slate-200 text-sm font-medium focus:outline-none resize-none px-3 py-2 font-sans placeholder:text-slate-500 leading-relaxed"
          />
          <div className="flex flex-col justify-end p-1">
            <button
              onClick={() => handleSend()}
              disabled={!input.trim() || loading}
              className="w-10 h-10 rounded-xl bg-indigo-650 hover:bg-indigo-500 disabled:bg-slate-800 text-white disabled:text-slate-600 flex items-center justify-center shadow-lg shadow-indigo-600/10 cursor-pointer transition-all border-0 self-end shrink-0"
            >
              <Send size={15} />
            </button>
          </div>
        </div>
        <div className="flex justify-between items-center px-2 mt-1">
          <span className="text-[10px] text-slate-500 font-medium">Shift + Enter yangi qator boshlaydi</span>
          <span className="flex items-center gap-1 text-[10px] text-slate-500 font-medium">
            Sfera AI Assistant <CornerDownLeft size={8} />
          </span>
        </div>
      </div>
    </div>
  );
}
