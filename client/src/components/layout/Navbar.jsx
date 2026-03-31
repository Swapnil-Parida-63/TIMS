import React, { useEffect } from 'react';
import { Calendar, Sun, Moon } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useThemeStore } from '../../store/themeStore';

export const Navbar = () => {
  const { user } = useAuthStore();
  const { theme, toggleTheme, initTheme } = useThemeStore();

  // Init theme on first mount
  useEffect(() => { initTheme(); }, []);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good Morning' : hour < 18 ? 'Good Afternoon' : 'Good Evening';
  const displayName = user?.name || (user?.role === 'super_admin' ? 'Super Admin' : 'Admin');
  const date = new Intl.DateTimeFormat('en-GB', {
    weekday: 'long', day: 'numeric', month: 'short', year: 'numeric'
  }).format(new Date());

  return (
    <header className="h-16 flex items-center justify-between px-6 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 sticky top-0 z-10 transition-colors">
      <h1 className="text-lg font-bold text-slate-800 dark:text-slate-100">
        {greeting}, {displayName} 👋
      </h1>

      <div className="flex items-center gap-3">
        {/* Date pill */}
        <div className="flex items-center gap-2 text-sm font-medium text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-900/40 border border-purple-100 dark:border-purple-800 px-3 py-1.5 rounded-lg">
          <Calendar size={14} />
          {date}
        </div>

        {/* Dark mode toggle */}
        <button
          id="theme-toggle"
          onClick={toggleTheme}
          aria-label="Toggle dark mode"
          className="w-9 h-9 flex items-center justify-center rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all shadow-sm"
        >
          {theme === 'dark'
            ? <Sun size={16} className="text-amber-400" />
            : <Moon size={16} className="text-slate-500" />
          }
        </button>
      </div>
    </header>
  );
};
