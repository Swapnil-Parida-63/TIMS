import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, Video, UserCheck, LogOut, PanelLeftClose, PanelLeft, UserCircle, Shield, Settings } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { canViewJudges } from '../../utils/rbac';
import clsx from 'clsx';

export const Sidebar = ({ collapsed, setCollapsed }) => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const navItems = [
    { label: 'Dashboard', icon: LayoutDashboard, to: '/', show: true },
    { label: 'Candidates', icon: Users, to: '/candidates', show: true },
    { label: 'Interviews', icon: Video, to: '/interviews', show: true },
    { label: 'Judges', icon: Shield, to: '/judges', show: canViewJudges(user?.role) },
    { label: 'Teachers', icon: UserCheck, to: '/teachers', show: true },
    { label: 'Settings', icon: Settings, to: '/settings', show: user?.role === 'super_admin' },
  ].filter(item => item.show);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside className={clsx(
      'flex flex-col h-screen sticky top-0 bg-white dark:bg-slate-900 border-r border-slate-100 dark:border-slate-800 transition-all duration-200',
      collapsed ? 'w-[68px]' : 'w-56'
    )}>
      {/* Brand */}
      <div className="flex items-center gap-2 px-4 h-16 border-b border-slate-100 dark:border-slate-800">
        <div className="w-8 h-8 rounded-lg bg-purple-600 flex items-center justify-center shrink-0">
          <UserCircle size={18} className="text-white" />
        </div>
        {!collapsed && <span className="font-bold text-slate-800 dark:text-slate-100 text-base truncate">TheMentR</span>}
      </div>

      {/* Toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="mx-auto mt-3 mb-1 p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-600 transition"
      >
        {collapsed ? <PanelLeft size={18} /> : <PanelLeftClose size={18} />}
      </button>

      {/* Nav */}
      <nav className="flex-1 flex flex-col gap-0.5 px-2 mt-2">
        {!collapsed && (
          <span className="text-[10px] uppercase tracking-widest font-semibold text-slate-400 px-2 mb-1">Menu</span>
        )}
        {navItems.map(({ label, icon: Icon, to }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) => clsx(
              'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all',
              isActive
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100',
              collapsed && 'justify-center px-2'
            )}
          >
            <Icon size={18} className="shrink-0" />
            {!collapsed && label}
          </NavLink>
        ))}
      </nav>

      {/* User + Role */}
      <div className="p-3 border-t border-slate-100 dark:border-slate-800">
        <div className={clsx('flex items-center gap-2', collapsed && 'justify-center')}>
          <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center shrink-0">
            <span className="text-purple-700 dark:text-purple-300 text-xs font-bold">
              {user?.name?.charAt(0)?.toUpperCase() || 'A'}
            </span>
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">{user?.name || 'Admin'}</p>
              <p className="text-xs text-slate-500 capitalize">{user?.role || 'admin'}</p>
            </div>
          )}
          {!collapsed && (
            <button onClick={handleLogout} className="p-1 text-slate-400 hover:text-red-500 transition rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30" title="Logout">
              <LogOut size={16} />
            </button>
          )}
        </div>
      </div>
    </aside>
  );
};
