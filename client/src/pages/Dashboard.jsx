import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Video, CheckCircle2, UserCheck } from 'lucide-react';
import { getCandidates, getInterviews, getTeachers } from '../services/api';

const StatCard = ({ icon: Icon, label, value, color, onClick, filter }) => (
  <button
    onClick={onClick}
    className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex items-center gap-4 w-full text-left hover:shadow-md hover:border-purple-200 hover:-translate-y-0.5 transition-all duration-150 group"
  >
    <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
      <Icon size={22} />
    </div>
    <div className="flex-1">
      <p className="text-sm font-medium text-slate-500 group-hover:text-slate-700 transition">{label}</p>
      <p className="text-2xl font-bold text-slate-800 mt-0.5">{value ?? '—'}</p>
    </div>
    <div className="text-slate-300 group-hover:text-purple-400 transition text-xs font-semibold">
      View →
    </div>
  </button>
);

export const Dashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalCandidates: null,
    interviewsScheduled: null,
    interviewsCompleted: null,
    selectedTeachers: null,
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [candidatesRes, interviewsRes, teachersRes] = await Promise.all([
          getCandidates(),
          getInterviews(),
          getTeachers(),
        ]);
        const candidates = candidatesRes.data?.data || [];
        const interviews = interviewsRes.data?.data || [];
        const teachers = teachersRes.data?.data || [];

        setStats({
          totalCandidates: candidates.length,
          interviewsScheduled: interviews.filter(i => i.status === 'scheduled').length,
          interviewsCompleted: interviews.filter(i => i.status === 'completed').length,
          selectedTeachers: teachers.length,
        });
      } catch (err) {
        console.error('Dashboard fetch error:', err);
      }
    };
    fetchStats();
  }, []);

  const cards = [
    {
      icon: Users,
      label: 'Total Candidates',
      value: stats.totalCandidates,
      color: 'bg-blue-50 text-blue-600',
      onClick: () => navigate('/candidates'),
    },
    {
      icon: Video,
      label: 'Interviews Scheduled',
      value: stats.interviewsScheduled,
      color: 'bg-purple-50 text-purple-600',
      onClick: () => navigate('/interviews?status=scheduled'),
    },
    {
      icon: CheckCircle2,
      label: 'Interviews Completed',
      value: stats.interviewsCompleted,
      color: 'bg-emerald-50 text-emerald-600',
      onClick: () => navigate('/interviews?status=completed'),
    },
    {
      icon: UserCheck,
      label: 'Teachers Onboarded',
      value: stats.selectedTeachers,
      color: 'bg-orange-50 text-orange-600',
      onClick: () => navigate('/teachers'),
    },
  ];

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-bold text-slate-800">Dashboard</h2>
        <p className="text-slate-500 text-sm mt-0.5">Live overview of candidate and interview activity</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c) => <StatCard key={c.label} {...c} />)}
      </div>
    </div>
  );
};
