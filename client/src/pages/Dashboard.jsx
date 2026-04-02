import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users, Video, CheckCircle2, UserCheck, BarChart3, TrendingUp,
  MapPin, BookOpen, GraduationCap, Award, XCircle, Calendar, Send, AlertTriangle, Clock
} from 'lucide-react';
import { getCandidates, getInterviews, getTeachers, getReport, confirmStandby, reserveStandby } from '../services/api';
import { useAuthStore } from '../store/authStore';
import { STANDBY_RESERVE_REASONS } from '../utils/reasons';
import { Modal } from '../components/common/Modal';
import { Badge } from '../components/common/Badge';

// ─── Standby Panel (Super Admin only) ─────────────────────────────────────────
const StandbyPanel = ({ interviews, onAction }) => {
  const navigate = useNavigate();
  const [reserveOpen, setReserveOpen]   = useState(false);
  const [activeId, setActiveId]         = useState(null);
  const [reason, setReason]             = useState('');
  const [notes, setNotes]               = useState('');
  const [loading, setLoading]           = useState(false);
  const [msg, setMsg]                   = useState('');

  const standby = interviews.filter(iv => iv.status === 'loa_sent');
  if (standby.length === 0) return null;

  const candidateName = (iv) => {
    const c = iv.candidate;
    if (!c || typeof c === 'string') return 'Unknown';
    return `${c.firstName || ''} ${c.lastName || ''}`.trim();
  };

  const handleConfirm = async (ivId) => {
    if (!window.confirm('Confirm this candidate as a teacher? This will finalize their onboarding.')) return;
    setLoading(true);
    try {
      await confirmStandby(ivId);
      onAction?.();
    } catch (err) {
      alert(err.response?.data?.message || 'Confirmation failed');
    } finally { setLoading(false); }
  };

  const openReserve = (ivId) => {
    setActiveId(ivId); setReason(''); setNotes(''); setMsg('');
    setReserveOpen(true);
  };

  const handleReserve = async () => {
    if (!reason) { setMsg('Please select a reason.'); return; }
    setLoading(true); setMsg('');
    try {
      await reserveStandby(activeId, reason, notes);
      setReserveOpen(false);
      onAction?.();
    } catch (err) {
      setMsg(err.response?.data?.message || 'Reserve failed.');
    } finally { setLoading(false); }
  };

  return (
    <>
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 rounded-xl bg-cyan-50 flex items-center justify-center">
            <Send size={18} className="text-cyan-600" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800">Standby Candidates — Awaiting Your Confirmation</h3>
            <p className="text-xs text-slate-500 mt-0.5">{standby.length} candidate{standby.length !== 1 ? 's' : ''} with LoA sent, pending finalization</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-cyan-100 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-cyan-50/50">
                <th className="text-left px-5 py-3.5 font-semibold text-slate-600 text-xs uppercase tracking-wide">Candidate</th>
                <th className="text-left px-5 py-3.5 font-semibold text-slate-600 text-xs uppercase tracking-wide">CPC</th>
                <th className="text-left px-5 py-3.5 font-semibold text-slate-600 text-xs uppercase tracking-wide">LoA Sent</th>
                <th className="text-left px-5 py-3.5 font-semibold text-slate-600 text-xs uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody>
              {standby.map((iv) => (
                <tr key={iv._id} className="border-b border-slate-50 hover:bg-cyan-50/30 transition-colors">
                  <td className="px-5 py-4">
                    <button
                      onClick={() => navigate(`/interviews/${iv._id}`)}
                      className="font-semibold text-slate-800 hover:text-cyan-600 transition text-left"
                    >
                      {candidateName(iv)}
                    </button>
                  </td>
                  <td className="px-5 py-4">
                    {iv.pricing?.cpc ? (
                      <span className="text-xs font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-200">{iv.pricing.cpc}</span>
                    ) : <span className="text-xs text-slate-400 italic">—</span>}
                  </td>
                  <td className="px-5 py-4 text-xs text-slate-500">
                    {iv.loaConfig?.loaSentAt
                      ? new Date(iv.loaConfig.loaSentAt).toLocaleDateString('en-IN', { dateStyle: 'medium' })
                      : '—'}
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleConfirm(iv._id)}
                        disabled={loading}
                        className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg hover:bg-emerald-100 transition flex items-center gap-1 disabled:opacity-50"
                      >
                        <CheckCircle2 size={12} /> Confirm as Teacher
                      </button>
                      <button
                        onClick={() => openReserve(iv._id)}
                        className="text-xs font-semibold text-orange-700 bg-orange-50 border border-orange-200 px-3 py-1.5 rounded-lg hover:bg-orange-100 transition flex items-center gap-1"
                      >
                        <AlertTriangle size={12} /> Reserve
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={reserveOpen} onClose={() => setReserveOpen(false)} title="Reserve Standby Candidate">
        <div className="flex flex-col gap-4">
          <div className="flex items-start gap-3 bg-orange-50 border border-orange-100 rounded-xl p-3 text-sm text-orange-700">
            <AlertTriangle size={15} className="shrink-0 mt-0.5" />
            <span>Select the reason for reserving this candidate after their LoA was sent.</span>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Reason <span className="text-red-500">*</span></label>
            <select value={reason} onChange={e => setReason(e.target.value)}
              className="px-3 py-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:border-orange-400 bg-white">
              <option value="">Select a reason...</option>
              {STANDBY_RESERVE_REASONS.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Notes <span className="text-slate-400">(optional)</span></label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)}
              placeholder="Additional context..." rows={2}
              className="px-3 py-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:border-orange-400 resize-none" />
          </div>
          {msg && <p className="text-sm text-red-600 px-1">{msg}</p>}
          <div className="flex gap-2">
            <button onClick={handleReserve} disabled={loading || !reason}
              className="flex-1 bg-orange-600 text-white font-bold py-2.5 rounded-xl hover:bg-orange-700 disabled:opacity-50 transition text-sm">
              {loading ? 'Reserving...' : 'Confirm Reserve'}
            </button>
            <button onClick={() => setReserveOpen(false)}
              className="px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50">Cancel</button>
          </div>
        </div>
      </Modal>
    </>
  );
};

// ─── Stat Card ─────────────────────────────────────────────────────────────
const StatCard = ({ icon: Icon, label, value, color, onClick }) => (
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

// ─── Bar Chart (CSS-only — no library) ─────────────────────────────────────
const BarChart = ({ data = [], labelKey = '_id', valueKey = 'count', color = '#8b5cf6', maxBars = 8 }) => {
  const sliced = data.slice(0, maxBars);
  if (sliced.length === 0) return <p className="text-xs text-slate-400 italic py-6 text-center">No data available</p>;
  const maxVal = Math.max(...sliced.map(d => d[valueKey] || 0), 1);

  return (
    <div className="flex items-end gap-2 h-36 pt-2">
      {sliced.map((d, i) => {
        const val = d[valueKey] || 0;
        const pct = (val / maxVal) * 100;
        const label = d[labelKey] || '—';
        return (
          <div key={i} className="flex-1 flex flex-col items-center gap-1 min-w-0">
            {/* Value badge */}
            <span className="text-[10px] font-bold text-slate-600">{val}</span>
            {/* Bar */}
            <div className="w-full flex justify-center">
              <div
                className="rounded-t-lg transition-all duration-700 ease-out"
                style={{
                  width: '70%',
                  height: `${Math.max(pct, 6)}%`,
                  background: `linear-gradient(180deg, ${color} 0%, ${color}99 100%)`,
                  minHeight: 6,
                  boxShadow: `0 -4px 12px ${color}30`,
                }}
              />
            </div>
            {/* Label */}
            <span className="text-[9px] text-slate-500 font-medium truncate w-full text-center leading-tight" title={label}>
              {label}
            </span>
          </div>
        );
      })}
    </div>
  );
};

// ─── Horizontal Bar Chart ──────────────────────────────────────────────────
const HBarChart = ({ data = [], labelKey = '_id', valueKey = 'count', color = '#8b5cf6', maxBars = 6 }) => {
  const sliced = data.slice(0, maxBars);
  if (sliced.length === 0) return <p className="text-xs text-slate-400 italic py-4 text-center">No data available</p>;
  const maxVal = Math.max(...sliced.map(d => d[valueKey] || 0), 1);

  return (
    <div className="flex flex-col gap-2.5">
      {sliced.map((d, i) => {
        const val = d[valueKey] || 0;
        const pct = (val / maxVal) * 100;
        const label = d[labelKey] || '—';
        return (
          <div key={i} className="flex items-center gap-3">
            <span className="text-[11px] font-medium text-slate-600 w-24 truncate text-right shrink-0" title={label}>{label}</span>
            <div className="flex-1 h-5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700 ease-out flex items-center justify-end pr-2"
                style={{
                  width: `${Math.max(pct, 8)}%`,
                  background: `linear-gradient(90deg, ${color}bb 0%, ${color} 100%)`,
                }}
              >
                <span className="text-[9px] font-bold text-white drop-shadow-sm">{val}</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

// ─── Chart Panel ───────────────────────────────────────────────────────────
const ChartPanel = ({ icon: Icon, title, color, iconBg, children, span = 1, onClick }) => (
  <div
    className={`bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex flex-col ${
      span === 2 ? 'col-span-1 lg:col-span-2' : ''
    } ${onClick ? 'cursor-pointer hover:shadow-md hover:border-purple-200 transition-all' : ''}`}
    onClick={onClick}
  >
    <div className="flex items-center gap-2.5 mb-4 pb-3 border-b border-slate-100">
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${iconBg || 'bg-purple-50'}`}>
        <Icon size={16} className={color || 'text-purple-600'} />
      </div>
      <h3 className="text-sm font-bold text-slate-700 flex-1">{title}</h3>
      {onClick && <span className="text-[10px] text-slate-400 font-medium">View Details →</span>}
    </div>
    <div className="flex-1">{children}</div>
  </div>
);

// ─── Mini Donut (CSS-only) ─────────────────────────────────────────────────
const MiniDonut = ({ segments = [], size = 90 }) => {
  const total = segments.reduce((s, seg) => s + seg.value, 0) || 1;
  let accumulated = 0;
  const gradientParts = segments.map(seg => {
    const start = (accumulated / total) * 360;
    accumulated += seg.value;
    const end = (accumulated / total) * 360;
    return `${seg.color} ${start}deg ${end}deg`;
  });
  if (gradientParts.length === 0) gradientParts.push('#e2e8f0 0deg 360deg');

  return (
    <div className="flex items-center gap-4">
      <div
        style={{
          width: size, height: size,
          borderRadius: '50%',
          background: `conic-gradient(${gradientParts.join(', ')})`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
      >
        <div className="bg-white rounded-full flex items-center justify-center" style={{ width: size * 0.6, height: size * 0.6 }}>
          <span className="text-sm font-bold text-slate-700">{total}</span>
        </div>
      </div>
      <div className="flex flex-col gap-1.5">
        {segments.map((seg, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: seg.color }} />
            <span className="text-[11px] text-slate-600">{seg.label}: <strong>{seg.value}</strong></span>
          </div>
        ))}
      </div>
    </div>
  );
};

// ─── Main Dashboard ────────────────────────────────────────────────────────
export const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const isSuperAdmin = user?.role === 'super_admin';
  const [stats, setStats] = useState({
    totalCandidates: null,
    interviewsScheduled: null,
    interviewsCompleted: null,
    selectedTeachers: null,
  });
  const [reportData, setReportData] = useState({});
  const [candidates, setCandidates] = useState([]);
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = async () => {
    try {
      const [candRes, ivRes, teachRes] = await Promise.all([
        getCandidates(), getInterviews(), getTeachers(),
      ]);
      const cands = candRes.data?.data || [];
      const ivs = ivRes.data?.data || [];
      const teachers = teachRes.data?.data || [];
      setCandidates(cands);
      setInterviews(ivs);

      setStats({
        totalCandidates: cands.length,
        interviewsScheduled: ivs.filter(i => i.status === 'scheduled').length,
        interviewsCompleted: ivs.filter(i => i.status === 'completed').length,
        selectedTeachers: teachers.length,
      });

      // Fetch report data in parallel
      const [cpcRes, classCodeRes, locRes, breakdownRes, appliedRes, rejectedRes, meetingsRes] = await Promise.all([
        getReport('cpc', 'month').catch(() => ({ data: {} })),
        getReport('classCode', 'month').catch(() => ({ data: {} })),
        getReport('locations').catch(() => ({ data: {} })),
        getReport('candidatesBreakdown').catch(() => ({ data: {} })),
        getReport('candidatesApplied', 'month').catch(() => ({ data: {} })),
        getReport('reserved', 'month').catch(() => ({ data: {} })),
        getReport('meetings', 'month').catch(() => ({ data: {} })),
      ]);

      setReportData({
        cpc: cpcRes.data?.data || {},
        classCode: classCodeRes.data?.data || {},
        locations: locRes.data?.data || {},
        breakdown: breakdownRes.data?.data || {},
        applied: appliedRes.data?.data || {},
        reserved: rejectedRes.data?.data || {},
        meetings: meetingsRes.data?.data || {},
      });
    } catch (err) {
      console.error('Dashboard fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);



  // ── Derived data for charts ─────────────────────────────────────────────
  const statusBreakdown = (() => {
    const statusMap = {};
    candidates.forEach(c => {
      const s = c.status || 'unknown';
      statusMap[s] = (statusMap[s] || 0) + 1;
    });
    const colorMap = {
      applied: '#6366f1', 'interview scheduled': '#8b5cf6',
      standby: '#f59e0b', loa_sent: '#06b6d4', selected: '#10b981', reserved: '#f97316',
      cancelled: '#94a3b8',
    };
    return Object.entries(statusMap).map(([label, value]) => ({
      label: label.charAt(0).toUpperCase() + label.slice(1),
      value,
      color: colorMap[label] || '#94a3b8',
    }));
  })();

  const interviewStatusData = (() => {
    const map = {};
    interviews.forEach(iv => {
      const s = iv.status || 'unknown';
      map[s] = (map[s] || 0) + 1;
    });
    return Object.entries(map).map(([k, v]) => ({ _id: k.charAt(0).toUpperCase() + k.slice(1), count: v }));
  })();

  const cards = [
    { icon: Users, label: 'Total Candidates', value: stats.totalCandidates, color: 'bg-blue-50 text-blue-600', onClick: () => navigate('/candidates') },
    { icon: Video, label: 'Interviews Scheduled', value: stats.interviewsScheduled, color: 'bg-purple-50 text-purple-600', onClick: () => navigate('/interviews?status=scheduled') },
    { icon: CheckCircle2, label: 'Interviews Completed', value: stats.interviewsCompleted, color: 'bg-emerald-50 text-emerald-600', onClick: () => navigate('/interviews?status=completed') },
    { icon: UserCheck, label: 'Teachers Onboarded', value: stats.selectedTeachers, color: 'bg-orange-50 text-orange-600', onClick: () => navigate('/teachers') },
  ];

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-xl font-bold text-slate-800">Dashboard</h2>
        <p className="text-slate-500 text-sm mt-0.5">Live overview of candidate and interview activity</p>
      </div>

      {/* Super Admin: Standby Panel */}
      {isSuperAdmin && (
        <StandbyPanel interviews={interviews} onAction={() => {
          // Trigger a refetch
          fetchAll();
        }} />
      )}

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {cards.map((c) => <StatCard key={c.label} {...c} />)}
      </div>

      {loading ? (
        <div className="text-center py-16 text-slate-400 text-sm animate-pulse">Loading analytics...</div>
      ) : (
        <>
          {/* Row 1: Status Donut + Interviews Bar + Applications Trend */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
            <ChartPanel icon={Users} title="Candidate Status Breakdown" iconBg="bg-indigo-50" color="text-indigo-600"
              onClick={() => navigate('/reports?tab=candidatesBreakdown')}>
              <MiniDonut segments={statusBreakdown} size={100} />
            </ChartPanel>

            <ChartPanel icon={Video} title="Interview Status" iconBg="bg-purple-50" color="text-purple-600"
              onClick={() => navigate('/interviews')}>
              <BarChart data={interviewStatusData} color="#8b5cf6" />
            </ChartPanel>

            <ChartPanel
              icon={TrendingUp}
              title="Applications Trend"
              iconBg="bg-blue-50"
              color="text-blue-600"
              onClick={() => navigate('/reports?tab=candidatesApplied')}
            >
              <BarChart data={reportData.applied?.timeSeries || []} color="#3b82f6" />
            </ChartPanel>
          </div>

          {/* Row 2: CPC + Class Code + Rejections */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
            <ChartPanel
              icon={Award}
              title={`Top CPC Values (${reportData.cpc?.total || 0})`}
              iconBg="bg-amber-50"
              color="text-amber-600"
              onClick={() => navigate('/reports?tab=cpc')}
            >
              <HBarChart data={reportData.cpc?.topCpc || []} color="#f59e0b" />
            </ChartPanel>

            <ChartPanel
              icon={BookOpen}
              title={`Top Class Codes (${reportData.classCode?.total || 0})`}
              iconBg="bg-emerald-50"
              color="text-emerald-600"
              onClick={() => navigate('/reports?tab=classCode')}
            >
              <HBarChart data={reportData.classCode?.topClassCodes || []} color="#10b981" />
            </ChartPanel>

            <ChartPanel
              icon={XCircle}
              title={`Reserved (${reportData.reserved?.total || 0})`}
              iconBg="bg-red-50"
              color="text-red-600"
              onClick={() => navigate('/reports?tab=reserved')}
            >
              <BarChart data={reportData.reserved?.timeSeries || []} color="#f97316" />
            </ChartPanel>
          </div>

          {/* Row 3: Locations + Boards + Meetings */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <ChartPanel
              icon={MapPin}
              title="Candidates by Location"
              iconBg="bg-rose-50"
              color="text-rose-600"
              onClick={() => navigate('/reports?tab=candidatesBreakdown')}
            >
              <HBarChart data={reportData.breakdown?.byLocation || []} color="#f43f5e" maxBars={5} />
            </ChartPanel>

            <ChartPanel
              icon={GraduationCap}
              title="Candidates by Board"
              iconBg="bg-sky-50"
              color="text-sky-600"
              onClick={() => navigate('/reports?tab=candidatesBreakdown')}
            >
              <HBarChart data={reportData.breakdown?.byBoard || []} color="#0ea5e9" maxBars={5} />
            </ChartPanel>

            <ChartPanel
              icon={Calendar}
              title={`Meetings Held (${reportData.meetings?.total || 0})`}
              iconBg="bg-violet-50"
              color="text-violet-600"
              onClick={() => navigate('/reports?tab=meetings')}
            >
              <BarChart data={reportData.meetings?.timeSeries || []} color="#7c3aed" />
            </ChartPanel>
          </div>
        </>
      )}
    </div>
  );
};
