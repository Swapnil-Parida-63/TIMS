import React, { useState } from 'react';
import clsx from 'clsx';
import { Check } from 'lucide-react';

/**
 * Multi-select checkbox dropdown.
 * Props:
 *   options: string[]
 *   selected: string[]
 *   onChange: (newSelected: string[]) => void
 *   placeholder: string
 */
export const MultiSelect = ({ options, selected, onChange, placeholder = 'Select...' }) => {
  const [open, setOpen] = useState(false);

  const toggle = (val) => {
    if (selected.includes(val)) {
      onChange(selected.filter(s => s !== val));
    } else {
      onChange([...selected, val]);
    }
  };

  return (
    <div className="relative">
      <button
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
      {open && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-slate-200 rounded-xl shadow-lg max-h-52 overflow-y-auto">
          {options.map(opt => {
            const isSelected = selected.includes(opt);
            return (
              <button
                key={opt}
                type="button"
                onClick={() => toggle(opt)}
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
      )}
    </div>
  );
};
