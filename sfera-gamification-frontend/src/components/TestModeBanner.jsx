import React from 'react';
import { AlertTriangle } from 'lucide-react';

export default function TestModeBanner() {
  return (
    <div className="w-full bg-amber-400 border-b border-amber-500 py-1.5 px-4 text-center shadow-md z-[100] flex items-center justify-center gap-2 select-none shrink-0">
      <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 animate-pulse" />
      <span className="text-red-700 font-black text-xs md:text-sm tracking-wide uppercase">
        ⚠️ Sayt test rejimida ishlamoqda
      </span>
      <span className="hidden sm:inline-block text-red-800 font-bold text-xs">
        — Barcha ma'lumotlar va funksiyalar tekshiruv bosqichida
      </span>
    </div>
  );
}
