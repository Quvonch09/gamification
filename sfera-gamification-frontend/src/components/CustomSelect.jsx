import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

export default function CustomSelect({ value, onChange, options, placeholder, className = '' }) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  // Find the label for the selected value
  const selectedOption = options.find(opt => String(opt.value) === String(value));
  const displayLabel = selectedOption ? selectedOption.label : placeholder;

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleOptionClick = (val) => {
    onChange(val);
    setIsOpen(false);
  };

  return (
    <div className={`relative w-full ${className}`} ref={containerRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full h-10 px-4 bg-slate-900/60 border border-slate-800/80 hover:border-indigo-500/50 rounded-xl text-slate-200 text-sm font-semibold flex items-center justify-between transition-all duration-200 cursor-pointer shadow-md focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/35"
      >
        <span className="truncate">{displayLabel}</span>
        <ChevronDown 
          size={16} 
          className={`text-slate-400 transition-transform duration-200 shrink-0 ml-2 ${isOpen ? 'rotate-180 text-indigo-400' : ''}`} 
        />
      </button>

      {/* Dropdown Options List */}
      {isOpen && (
        <div className="absolute left-0 right-0 mt-1.5 max-h-60 overflow-y-auto bg-slate-900/95 backdrop-blur-xl border border-slate-800 rounded-xl shadow-2xl z-[100] py-1 animate-fadeIn divide-y divide-slate-850 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
          {placeholder && (
            <div
              onClick={() => handleOptionClick('')}
              className={`px-4 py-2.5 text-xs font-semibold cursor-pointer flex items-center justify-between transition-colors ${
                !value 
                  ? 'bg-indigo-600/10 text-indigo-400 font-bold' 
                  : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
              }`}
            >
              <span>{placeholder}</span>
              {!value && <Check size={14} className="text-indigo-400" />}
            </div>
          )}
          {options.map((opt) => {
            const isSelected = String(opt.value) === String(value);
            return (
              <div
                key={opt.value}
                onClick={() => handleOptionClick(opt.value)}
                className={`px-4 py-2.5 text-xs font-semibold cursor-pointer flex items-center justify-between transition-colors ${
                  isSelected 
                    ? 'bg-indigo-600 text-white font-bold' 
                    : 'text-slate-300 hover:bg-indigo-650 hover:text-white'
                }`}
              >
                <span className="truncate">{opt.label}</span>
                {isSelected && <Check size={14} className="text-white shrink-0 ml-2" />}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
