import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export default function CustomSelect({ value, onChange, options, placeholder, className = '' }) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);
  const { isDark } = useTheme();

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

  // Dynamic classes based on theme
  const triggerClass = isDark
    ? 'bg-slate-900/60 border-slate-800/80 text-slate-200 hover:border-indigo-500/50 focus:border-indigo-500 focus:ring-indigo-500/35 shadow-md'
    : 'bg-white border-slate-200 text-slate-700 hover:border-indigo-400 focus:border-indigo-500 focus:ring-indigo-500/15 shadow-sm';

  const dropdownClass = isDark
    ? 'bg-slate-900/98 border-slate-800 divide-slate-850'
    : 'bg-white border-slate-200 divide-slate-100 shadow-xl';

  const optionBaseClass = isDark
    ? 'text-slate-300 hover:bg-indigo-600/20 hover:text-white'
    : 'text-slate-800 hover:bg-indigo-50 hover:text-indigo-700';

  const placeholderClass = isDark
    ? (value === '' || value === undefined ? 'bg-indigo-600/10 text-indigo-400 font-bold' : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200')
    : (value === '' || value === undefined ? 'bg-indigo-50 text-indigo-600 font-bold' : 'text-slate-700 hover:bg-slate-50 hover:text-slate-700');

  const chevronClass = isDark ? 'text-slate-400' : 'text-slate-400';

  return (
    <div className={`relative w-full ${className}`} ref={containerRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full h-10 px-4 border rounded-xl text-sm font-semibold flex items-center justify-between transition-all duration-200 cursor-pointer focus:outline-none focus:ring-1 ${triggerClass}`}
      >
        <span className="truncate">{displayLabel}</span>
        <ChevronDown
          size={16}
          className={`transition-transform duration-200 shrink-0 ml-2 ${chevronClass} ${isOpen ? 'rotate-180 text-indigo-400' : ''}`}
        />
      </button>

      {/* Dropdown Options List */}
      {isOpen && (
        <div
          className={`absolute left-0 right-0 mt-1.5 max-h-56 overflow-y-auto overscroll-contain backdrop-blur-xl border rounded-xl z-[150] py-1 divide-y custom-scrollbar shadow-2xl ${dropdownClass}`}
          style={{
            scrollbarWidth: 'thin',
            scrollbarColor: '#6366f1 rgba(15, 23, 42, 0.5)'
          }}
        >
          {placeholder && (
            <div
              onClick={() => handleOptionClick('')}
              className={`px-4 py-2.5 text-xs font-semibold cursor-pointer flex items-center justify-between transition-colors ${placeholderClass}`}
            >
              <span>{placeholder}</span>
              {(!value || value === '') && <Check size={14} className="text-indigo-400" />}
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
                    : optionBaseClass
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
