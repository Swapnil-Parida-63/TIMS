import React, { useState } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Navbar } from './Navbar';
import { useAuthStore } from '../../store/authStore';

const MainLayout = () => {
  const { token } = useAuthStore();
  const [collapsed, setCollapsed] = useState(false);

  if (!token) return <Navigate to="/login" replace />;

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors">
      <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar />
        <main className="p-6 flex-1 overflow-x-hidden">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
