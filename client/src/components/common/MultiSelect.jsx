import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import clsx from 'clsx';
import { Check } from 'lucide-react';

export const MultiSelect = ({ options, selected, onChange, placeholder = 'Select...' }) => {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef(null);
  const [menuStyle, setMenuStyle] = useState({});

  // Calculate menu position relative to viewport each time it opens
  useEffect(() => {
    if (open && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const menuHeight = Math.min(options.length * 42, 210); // estimate
      const spaceBelow = window.innerHeight - rect.bottom;
      const openUp = spaceBelow < menuHeight + 8;

      setMenuStyle({
        position: 'fixed',
        left: rect.left,
        width: rect.width,
        zIndex: 99999,
        ...(openUp
          ? { bottom: window.innerHeight - rect.top + 4 }
          : { top: rect.bottom + 4 }),
      });
    }
  }, [open, options.length]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (triggerRef.current && !triggerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const toggle = (val) => {
    onChange(selected.includes(val)
      ? selected.filter(s => s !== val)
      : [...selected, val]);
  };

  const menu = open && (
    <div
      style={menuStyle}
      className="bg-white border border-slate-200 rounded-xl shadow-xl max-h-52 overflow-y-auto"
    >
      {options.map(opt => {
        const isSelected = selected.includes(opt);
        return (
          <button
            key={opt}
            type="button"
            onMouseDown={e => { e.preventDefault(); toggle(opt); }}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 hover:bg-purple-50 transition text-sm text-left"
          >
            <div className={clsx(
              'w-4 h-4 rounded border flex items-center justify-center shrink-0 transition',
              isSelected ? 'bg-purple-600 border-purple-600' : 'bg-white border-slate-300'
            )}>
              {isSelected && <Check size={11} className="text-white" strokeWidth={3} />}
            </div>
            <span className={isSelected ? 'font-semibold text-purple-800' : 'text-slate-700'}>{opt}</span>
          </button>
        );
      })}
    </div>
  );

  return (
    <div className="relative">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm bg-white text-left flex items-center justify-between outline-none focus:border-purple-400 transition"
      >
        <span className={selected.length ? 'text-slate-800 font-medium' : 'text-slate-400'}>
          {selected.length ? selected.join(', ') : placeholder}
        </span>
        <svg className={`w-4 h-4 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && createPortal(menu, document.body)}
    </div>
  );
};
