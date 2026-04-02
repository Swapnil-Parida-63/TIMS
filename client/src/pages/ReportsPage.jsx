import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  BarChart3, TrendingUp, Users, UserCheck, UserX, CalendarCheck,
  Layers, BookOpen, MapPin, ChevronRight, RefreshCw, Filter, Video, X,
  ExternalLink, Mail, Phone, Calendar, GraduationCap, ArrowRight
} from 'lucide-react';
import { getReport } from '../services/api';
import { useAuthStore } from '../store/authStore';

// ─── Config ────────────────────────────────────────────────────────────────

const REPORT_TYPES = [
  {
    id: 'finalized',
    label: 'Teachers Finalized',
    icon: UserCheck,
    color: 'emerald',
    description: 'How many teachers were finalized over time',
    hasPeriod: true,
    hasLocation: false,
  },
  {
    id: 'reserved',
    label: 'Reserved',
    icon: UserX,
    color: 'orange',
    description: 'Reserved candidates per time period',
    hasPeriod: true,
    hasLocation: false,
  },
  {
    id: 'meetings',
    label: 'Meetings Held',
    icon: CalendarCheck,
    color: 'blue',
    description: 'Completed meetings (panelist & teacher)',
    hasPeriod: true,
    hasLocation: false,
  },
  {
    id: 'cpc',
    label: 'CPC Assigned',
    icon: TrendingUp,
    color: 'violet',
    description: 'CPC assignment stats and top ranges',
    hasPeriod: true,
    hasLocation: false,
  },
  {
    id: 'classCode',
    label: 'Class Codes',
    icon: Layers,
    color: 'amber',
    description: 'Most assigned class codes with payment info',
    hasPeriod: true,
    hasLocation: false,
  },
  {
    id: 'locations',
    label: 'Teacher Locations',
    icon: MapPin,
    color: 'cyan',
    description: 'Teachers by service location (BBSR, Cuttack, Khorda)',
    hasPeriod: false,
    hasLocation: true,
  },
  {
    id: 'candidatesApplied',
    label: 'Candidates Applied',
    icon: Users,
    color: 'indigo',
    description: 'Total candidates who applied over time',
    hasPeriod: true,
    hasLocation: false,
  },
  {
    id: 'candidatesBreakdown',
    label: 'Teacher Breakdown',
    icon: BookOpen,
    color: 'pink',
    description: 'Teachers grouped by board, class, and service location',
    hasPeriod: false,
    hasLocation: false,
  },
];

const PERIODS = [
  { id: 'day',   label: 'Daily' },
  { id: 'week',  label: 'Weekly' },
  { id: 'month', label: 'Monthly' },
];

const LOCATIONS = ['BBSR', 'Cuttack', 'Khorda'];

const COLOR_MAP = {
  emerald: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/30', bar: '#10b981', active: 'bg-emerald-600', badge: 'bg-emerald-500/20 text-emerald-300' },
  red:     { bg: 'bg-red-500/10',     text: 'text-red-400',     border: 'border-red-500/30',     bar: '#ef4444', active: 'bg-red-600',     badge: 'bg-red-500/20 text-red-300' },
  blue:    { bg: 'bg-blue-500/10',    text: 'text-blue-400',    border: 'border-blue-500/30',    bar: '#3b82f6', active: 'bg-blue-600',    badge: 'bg-blue-500/20 text-blue-300' },
  violet:  { bg: 'bg-violet-500/10',  text: 'text-violet-400',  border: 'border-violet-500/30',  bar: '#8b5cf6', active: 'bg-violet-600',  badge: 'bg-violet-500/20 text-violet-300' },
  amber:   { bg: 'bg-amber-500/10',   text: 'text-amber-400',   border: 'border-amber-500/30',   bar: '#f59e0b', active: 'bg-amber-600',   badge: 'bg-amber-500/20 text-amber-300' },
  cyan:    { bg: 'bg-cyan-500/10',    text: 'text-cyan-400',    border: 'border-cyan-500/30',    bar: '#06b6d4', active: 'bg-cyan-600',    badge: 'bg-cyan-500/20 text-cyan-300' },
  indigo:  { bg: 'bg-indigo-500/10',  text: 'text-indigo-400',  border: 'border-indigo-500/30',  bar: '#6366f1', active: 'bg-indigo-600',  badge: 'bg-indigo-500/20 text-indigo-300' },
  pink:    { bg: 'bg-pink-500/10',    text: 'text-pink-400',    border: 'border-pink-500/30',    bar: '#ec4899', active: 'bg-pink-600',    badge: 'bg-pink-500/20 text-pink-300' },
  orange:  { bg: 'bg-orange-500/10',  text: 'text-orange-400',  border: 'border-orange-500/30',  bar: '#f97316', active: 'bg-orange-600',  badge: 'bg-orange-500/20 text-orange-300' },
};

// ─── SVG Bar Chart ─────────────────────────────────────────────────────────

function BarChart({ data = [], color = '#8b5cf6' }) {
  if (!data.length) return (
    <div className="flex items-center justify-center h-20 text-slate-500 text-sm">No data for this period</div>
  );

  const max = Math.max(...data.map(d => d.count), 1);
  const W = 600, H = 72, BAR_GAP = 4;
  const barW = Math.max(8, Math.floor((W - BAR_GAP * (data.length + 1)) / data.length));
  const effectiveW = (barW + BAR_GAP) * data.length + BAR_GAP;

  return (
    <div className="w-full overflow-x-auto">
      <svg
        viewBox={`0 0 ${effectiveW} ${H + 28}`}
        className="w-full"
        style={{ minWidth: Math.max(200, effectiveW), maxHeight: 110 }}
      >
        {data.map((d, i) => {
          const barH = Math.max(4, (d.count / max) * H);
          const x = BAR_GAP + i * (barW + BAR_GAP);
          const y = H - barH;
          return (
            <g key={i}>
              {/* Bar background */}
              <rect x={x} y={0} width={barW} height={H} rx={3} fill="rgba(255,255,255,0.03)" />
              {/* Bar */}
              <rect x={x} y={y} width={barW} height={barH} rx={3} fill={color} opacity={0.85} />
              {/* Count label */}
              {barH > 14 && (
                <text x={x + barW / 2} y={y + 11} textAnchor="middle" fontSize="9" fill="white" fontWeight="600">
                  {d.count}
                </text>
              )}
              {barH <= 14 && d.count > 0 && (
                <text x={x + barW / 2} y={y - 3} textAnchor="middle" fontSize="8" fill={color} fontWeight="600">
                  {d.count}
                </text>
              )}
              {/* X-axis label */}
              <text
                x={x + barW / 2}
                y={H + 16}
                textAnchor="middle"
                fontSize="8"
                fill="#94a3b8"
                transform={data.length > 10 ? `rotate(-35, ${x + barW / 2}, ${H + 16})` : undefined}
              >
                {String(d._id || '').replace(/^\d{4}-/, '')}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

// ─── Leaderboard Table ─────────────────────────────────────────────────────

function LeaderboardTable({ rows = [], labelKey = '_id', countKey = 'count', extraCols = [], color, nameLabel = 'Name' }) {
  const c = COLOR_MAP[color] || COLOR_MAP.violet;
  if (!rows.length) return (
    <p className="text-center text-slate-300 text-sm py-6">No data available</p>
  );
  const max = Math.max(...rows.map(r => r[countKey] || 0), 1);

  return (
    <div className="overflow-x-auto px-6">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-xs uppercase tracking-wider text-slate-400 border-b border-slate-700/50">
            <th className="text-left py-2 pl-3 pr-4 font-medium w-10">#</th>
            <th className="text-left py-2 pr-4 font-medium">{nameLabel}</th>
            {extraCols.map(col => (
              <th key={col.key} className="text-right py-2 px-4 font-medium">{col.label}</th>
            ))}
            <th className="text-right py-2 pl-4 pr-3 font-medium">Count</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => {
            const pct = ((row[countKey] || 0) / max * 100).toFixed(0);
            return (
              <tr key={i} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                <td className="py-2.5 pl-3 pr-4 w-10">
                  <span className={`inline-flex items-center justify-center w-5 h-5 rounded text-xs font-bold ${c.badge}`}>
                    {i + 1}
                  </span>
                </td>
                <td className="py-2.5 pr-4">
                  <div className="flex items-center gap-3">
                    <div>
                      <p className="font-medium text-slate-200">{row[labelKey] || '—'}</p>
                      <div className="mt-1 h-1 rounded-full bg-slate-700 w-24">
                        <div
                          className="h-1 rounded-full transition-all"
                          style={{ width: `${pct}%`, background: COLOR_MAP[color]?.bar || '#8b5cf6' }}
                        />
                      </div>
                    </div>
                  </div>
                </td>
                {extraCols.map(col => (
                  <td key={col.key} className="py-2.5 px-4 text-right text-slate-200">
                    {col.render ? col.render(row) : (row[col.key] ?? '—')}
                  </td>
                ))}
                <td className="py-2.5 pl-4 pr-3 text-right">
                  <span className={`font-bold text-base ${c.text}`}>{row[countKey] ?? 0}</span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ─── Stat Card ─────────────────────────────────────────────────────────────

function StatCard({ label, value, icon: Icon, color }) {
  const c = COLOR_MAP[color] || COLOR_MAP.violet;
  return (
    <div className={`rounded-xl border ${c.border} ${c.bg} p-4 flex items-center gap-4`}>
      <div className={`w-10 h-10 rounded-lg ${c.bg} flex items-center justify-center`}>
        <Icon size={20} className={c.text} />
      </div>
      <div>
        <p className="text-xs text-slate-200 font-medium uppercase tracking-wide">{label}</p>
        <p className="text-2xl font-bold text-white">{value ?? '—'}</p>
      </div>
    </div>
  );
}

// Period stat card — same look as StatCard, shows the sum of the timeSeries for the selected period
function PeriodStatCard({ label, timeSeries = [], icon: Icon, color }) {
  const total = timeSeries.reduce((sum, d) => sum + (d.count || 0), 0);
  return <StatCard label={label} value={total} icon={Icon} color={color} />;
}

// ─── Report Panels ─────────────────────────────────────────────────────────

function FinalizedPanel({ data, period, color }) {
  const c = COLOR_MAP[color] || COLOR_MAP.emerald;
  const teachers = data?.teachers || [];

  return (
    <div className="space-y-6">
      <StatCard label="Total Finalized" value={data?.total} icon={UserCheck} color={color} />

      {/* Period total */}
      <PeriodStatCard
        label={`Finalized this ${period}`}
        timeSeries={data?.timeSeries}
        icon={UserCheck}
        color={color}
      />

      {/* Teacher Roster */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-semibold text-slate-300">Finalized Teachers</h4>
          <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${c.badge}`}>
            {teachers.length} total
          </span>
        </div>

        {teachers.length === 0 ? (
          <div className="text-center py-8 text-slate-500 text-sm">No teachers finalized yet</div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-700/50">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-800/60 text-xs uppercase tracking-wider text-slate-400">
                  <th className="text-left px-4 py-3 font-medium rounded-tl-xl">#</th>
                  <th className="text-left px-4 py-3 font-medium">Teacher</th>
                  <th className="text-left px-4 py-3 font-medium">Contact</th>
                  <th className="text-left px-4 py-3 font-medium">CPC / Class</th>
                  <th className="text-left px-4 py-3 font-medium">Location</th>
                  <th className="text-left px-4 py-3 font-medium">Date Finalized</th>
                  <th className="text-left px-4 py-3 font-medium rounded-tr-xl">Action</th>
                </tr>
              </thead>
              <tbody>
                {teachers.map((t, i) => {
                  const cand = t.candidate || {};
                  const name = cand.firstName
                    ? `${cand.firstName} ${cand.lastName || ''}`.trim()
                    : '—';
                  const locations = (cand.serviceLocation || []).join(', ') || '—';
                  const date = t.createdAt
                    ? new Date(t.createdAt).toLocaleDateString('en-IN', {
                        day: '2-digit', month: 'short', year: 'numeric'
                      })
                    : '—';

                  return (
                    <tr
                      key={t._id}
                      className="border-t border-slate-800/50 hover:bg-slate-800/30 transition-colors group"
                    >
                      {/* Index */}
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center justify-center w-6 h-6 rounded-lg text-xs font-bold ${c.badge}`}>
                          {i + 1}
                        </span>
                      </td>

                      {/* Name + avatar */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full ${c.bg} border ${c.border} flex items-center justify-center shrink-0`}>
                            <span className={`text-xs font-bold ${c.text}`}>
                              {name !== '—' ? name.charAt(0).toUpperCase() : '?'}
                            </span>
                          </div>
                          <div>
                            <p className="font-semibold text-slate-100 leading-tight">{name}</p>
                            {t.classCode && (
                              <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${c.badge}`}>
                                {t.classCode}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Email + Phone */}
                      <td className="px-4 py-3">
                        <div className="space-y-1">
                          {cand.email && (
                            <div className="flex items-center gap-1.5 text-slate-300">
                              <Mail size={11} className="text-slate-500 shrink-0" />
                              <span className="text-xs truncate max-w-[160px]">{cand.email}</span>
                            </div>
                          )}
                          {cand.phone && (
                            <div className="flex items-center gap-1.5 text-slate-300">
                              <Phone size={11} className="text-slate-500 shrink-0" />
                              <span className="text-xs">{cand.phone}</span>
                            </div>
                          )}
                          {!cand.email && !cand.phone && (
                            <span className="text-xs text-slate-500">—</span>
                          )}
                        </div>
                      </td>

                      {/* CPC / Class Code */}
                      <td className="px-4 py-3">
                        <div className="space-y-1">
                          {t.cpc && t.cpc !== 'N/A' && (
                            <div className="flex items-center gap-1.5">
                              <GraduationCap size={11} className="text-slate-500 shrink-0" />
                              <span className="text-xs text-slate-300 font-medium">{t.cpc}</span>
                            </div>
                          )}
                          {t.classCode && (
                            <span className={`text-xs px-2 py-0.5 rounded font-medium ${c.badge}`}>
                              {t.classCode}
                            </span>
                          )}
                          {(!t.cpc || t.cpc === 'N/A') && !t.classCode && (
                            <span className="text-xs text-slate-500">—</span>
                          )}
                        </div>
                      </td>

                      {/* Location pills */}
                      <td className="px-4 py-3">
                        {locations !== '—' ? (
                          <div className="flex flex-wrap gap-1">
                            {(cand.serviceLocation || []).map(loc => (
                              <span key={loc} className="text-[10px] px-1.5 py-0.5 rounded bg-slate-700 text-slate-300 font-medium">
                                {loc}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-xs text-slate-500">—</span>
                        )}
                      </td>

                      {/* Date */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5 text-slate-400">
                          <Calendar size={11} className="shrink-0" />
                          <span className="text-xs">{date}</span>
                        </div>
                      </td>

                      {/* View Details */}
                      <td className="px-4 py-3">
                        {cand._id ? (
                          <a
                            href={`/candidates/${cand._id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all
                              ${c.bg} ${c.text} border ${c.border} hover:opacity-80`}
                          >
                            <ExternalLink size={11} />
                            View
                          </a>
                        ) : (
                          <span className="text-xs text-slate-600">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Shared: Detail Modal Shell ─────────────────────────────────────────────
function DetailModal({ open, onClose, color, icon: Icon, title, subtitle, children }) {
  const c = COLOR_MAP[color] || COLOR_MAP.violet;
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(6px)' }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className={`bg-slate-900 rounded-2xl border ${c.border} w-full max-w-5xl max-h-[85vh] flex flex-col shadow-2xl`}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl ${c.bg} border ${c.border} flex items-center justify-center`}>
              <Icon size={16} className={c.text} />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100">{title}</h3>
              {subtitle && <p className="text-xs text-slate-400">{subtitle}</p>}
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition">
            <X size={18} />
          </button>
        </div>
        <div className="overflow-y-auto flex-1 p-6">{children}</div>
      </div>
    </div>
  );
}

function fmt(date) {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

// ─── ReservedPanel ──────────────────────────────────────────────────────────
function ReservedPanel({ data, period, color }) {
  const [open, setOpen] = useState(false);
  const [reasonFilter, setReasonFilter] = useState('all');
  const navigate = useNavigate();
  const c = COLOR_MAP[color] || COLOR_MAP.orange;
  const reserved = data?.reserved || [];

  // Build unique reason list from actual data
  const uniqueReasons = ['all', ...Array.from(new Set(reserved.map(r => r.reserveReason).filter(Boolean)))];

  // Filtered list based on selected reason
  const filtered = reasonFilter === 'all' ? reserved : reserved.filter(r => r.reserveReason === reasonFilter);

  const ClickableCard = ({ label, value }) => (
    <button onClick={() => setOpen(true)} className="text-left w-full group focus:outline-none">
      <div className={`rounded-xl border ${c.border} ${c.bg} p-4 flex items-center gap-4 transition-all group-hover:brightness-125 group-hover:scale-[1.01]`}>
        <div className={`w-10 h-10 rounded-lg ${c.bg} flex items-center justify-center`}>
          <UserX size={20} className={c.text} />
        </div>
        <div>
          <p className="text-xs text-slate-200 font-medium uppercase tracking-wide">{label}</p>
          <p className="text-2xl font-bold text-white">{value ?? '—'}</p>
        </div>
      </div>
    </button>
  );

  return (
    <div className="space-y-6">
      {/* Reason filter dropdown */}
      {reserved.length > 0 && (
        <div className="flex items-center gap-3">
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide shrink-0">Filter by reason</label>
          <select
            value={reasonFilter}
            onChange={e => setReasonFilter(e.target.value)}
            className="flex-1 max-w-xs px-3 py-2 rounded-xl border border-slate-700 bg-slate-800 text-slate-200 text-sm outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500/40 transition"
          >
            <option value="all">All Reasons ({reserved.length})</option>
            {uniqueReasons.filter(r => r !== 'all').map(r => (
              <option key={r} value={r}>{r} ({reserved.filter(c => c.reserveReason === r).length})</option>
            ))}
          </select>
          {reasonFilter !== 'all' && (
            <button
              onClick={() => setReasonFilter('all')}
              className="px-3 py-1.5 text-xs font-medium text-orange-400 border border-orange-500/30 rounded-lg hover:bg-orange-500/10 transition"
            >
              Clear
            </button>
          )}
        </div>
      )}

      <ClickableCard
        label={reasonFilter === 'all' ? 'Total Reserved' : `Reserved — ${reasonFilter}`}
        value={filtered.length}
      />
      <ClickableCard
        label={`Reserved this ${period}`}
        value={(data?.timeSeries || []).reduce((s, d) => s + (d.count || 0), 0)}
      />

      <DetailModal open={open} onClose={() => setOpen(false)} color={color}
        icon={UserX}
        title="Reserved Candidates"
        subtitle={reasonFilter === 'all' ? `${filtered.length} reserved` : `${filtered.length} · ${reasonFilter}`}>
        {/* Filter bar inside modal */}
        {reserved.length > 0 && (
          <div className="flex items-center gap-3 mb-4">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide shrink-0">Filter</span>
            <select
              value={reasonFilter}
              onChange={e => setReasonFilter(e.target.value)}
              className="flex-1 max-w-xs px-3 py-2 rounded-xl border border-slate-700 bg-slate-800 text-slate-200 text-sm outline-none focus:border-orange-500 transition"
            >
              <option value="all">All Reasons ({reserved.length})</option>
              {uniqueReasons.filter(r => r !== 'all').map(r => (
                <option key={r} value={r}>{r} ({reserved.filter(c => c.reserveReason === r).length})</option>
              ))}
            </select>
            {reasonFilter !== 'all' && (
              <button onClick={() => setReasonFilter('all')} className="px-3 py-1.5 text-xs font-medium text-orange-400 border border-orange-500/30 rounded-lg hover:bg-orange-500/10 transition">
                Clear
              </button>
            )}
          </div>
        )}

        {filtered.length === 0 ? (
          <p className="text-center text-slate-400 py-12">No candidates match this filter.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs uppercase tracking-wider text-slate-400 border-b border-slate-700/50">
                  <th className="text-left py-3 pl-3 pr-4 w-10">#</th>
                  <th className="text-left py-3 pr-6">Candidate</th>
                  <th className="text-left py-3 pr-6">Contact</th>
                  <th className="text-left py-3 pr-6">Reason</th>
                  <th className="text-left py-3 pr-3">Date</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c_item, i) => {
                  const name = c_item.firstName ? `${c_item.firstName} ${c_item.lastName || ''}`.trim() : '—';
                  return (
                    <tr
                      key={c_item._id}
                      onClick={() => { setOpen(false); navigate(`/candidates/${c_item._id}`); }}
                      className="border-b border-slate-800/60 hover:bg-orange-500/10 transition-colors cursor-pointer group"
                      title="View candidate profile"
                    >
                      <td className="py-3 pl-3 pr-4">
                        <span className={`inline-flex items-center justify-center w-6 h-6 rounded-lg text-xs font-bold ${c.badge}`}>{i + 1}</span>
                      </td>
                      <td className="py-3 pr-6">
                        <span className="font-semibold text-slate-100 group-hover:text-orange-300 transition-colors flex items-center gap-1.5">
                          {name}
                          <ChevronRight size={12} className="opacity-0 group-hover:opacity-100 transition-opacity text-orange-400" />
                        </span>
                      </td>
                      <td className="py-3 pr-6">
                        <div className="space-y-0.5">
                          {c_item.email && <div className="flex items-center gap-1.5 text-slate-300 text-xs"><Mail size={10} className="text-slate-500" />{c_item.email}</div>}
                          {c_item.phone && <div className="flex items-center gap-1.5 text-slate-300 text-xs"><Phone size={10} className="text-slate-500" />{c_item.phone}</div>}
                          {!c_item.email && !c_item.phone && <span className="text-slate-500">—</span>}
                        </div>
                      </td>
                      <td className="py-3 pr-6">
                        <div className="space-y-0.5">
                          {c_item.reserveReason && (
                            <p className={`text-xs font-medium ${c.text}`}>{c_item.reserveReason}</p>
                          )}
                          {c_item.reserveNotes && (
                            <p className="text-xs text-slate-400 italic">{c_item.reserveNotes}</p>
                          )}
                          {!c_item.reserveReason && <span className="text-slate-500 text-xs">—</span>}
                        </div>
                      </td>
                      <td className="py-3 pr-3 text-slate-400 text-xs whitespace-nowrap">{fmt(c_item.updatedAt)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </DetailModal>
    </div>
  );
}

// ─── MeetingsPanel ──────────────────────────────────────────────────────────
function MeetingsPanel({ data, period, color }) {
  const navigate = useNavigate();
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Meetings Held */}
        <div className="rounded-xl border border-slate-700/50 bg-slate-800/30 p-5 space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-700/50">
            <div className="w-7 h-7 rounded-lg bg-blue-500/15 flex items-center justify-center">
              <CalendarCheck size={14} className="text-blue-400" />
            </div>
            <h4 className="text-sm font-semibold text-slate-200">Meetings Held</h4>
            <span className="ml-auto text-[10px] text-slate-500 uppercase tracking-wider">Panelist &amp; Teacher</span>
          </div>
          <button
            onClick={() => navigate('/meetings')}
            className="w-full text-left group focus:outline-none"
          >
            <div className="rounded-xl border border-blue-500/30 bg-blue-500/10 p-4 flex items-center gap-4 transition-all group-hover:brightness-125 group-hover:scale-[1.01]">
              <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                <CalendarCheck size={20} className="text-blue-400" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-slate-200 font-medium uppercase tracking-wide">Total Completed</p>
                <p className="text-2xl font-bold text-white">{data?.meetingsTotal ?? 0}</p>
              </div>
              <ArrowRight size={14} className="text-blue-400 opacity-0 group-hover:opacity-100 transition" />
            </div>
          </button>
          <button
            onClick={() => navigate('/meetings')}
            className="w-full text-left group focus:outline-none"
          >
            <div className="rounded-xl border border-blue-500/30 bg-blue-500/10 p-4 flex items-center gap-4 transition-all group-hover:brightness-125 group-hover:scale-[1.01]">
              <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                <CalendarCheck size={20} className="text-blue-400" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-slate-200 font-medium uppercase tracking-wide">Meetings this {period}</p>
                <p className="text-2xl font-bold text-white">{(data?.meetingsTimeSeries || []).reduce((s, d) => s + (d.count || 0), 0)}</p>
              </div>
              <ArrowRight size={14} className="text-blue-400 opacity-0 group-hover:opacity-100 transition" />
            </div>
          </button>
        </div>

        {/* Interviews Held */}
        <div className="rounded-xl border border-slate-700/50 bg-slate-800/30 p-5 space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-700/50">
            <div className="w-7 h-7 rounded-lg bg-violet-500/15 flex items-center justify-center">
              <Video size={14} className="text-violet-400" />
            </div>
            <h4 className="text-sm font-semibold text-slate-200">Interviews Held</h4>
            <span className="ml-auto text-[10px] text-slate-500 uppercase tracking-wider">Candidates</span>
          </div>
          <button
            onClick={() => navigate('/interviews')}
            className="w-full text-left group focus:outline-none"
          >
            <div className="rounded-xl border border-violet-500/30 bg-violet-500/10 p-4 flex items-center gap-4 transition-all group-hover:brightness-125 group-hover:scale-[1.01]">
              <div className="w-10 h-10 rounded-lg bg-violet-500/20 flex items-center justify-center">
                <Video size={20} className="text-violet-400" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-slate-200 font-medium uppercase tracking-wide">Total Conducted</p>
                <p className="text-2xl font-bold text-white">{data?.interviewsTotal ?? 0}</p>
              </div>
              <ArrowRight size={14} className="text-violet-400 opacity-0 group-hover:opacity-100 transition" />
            </div>
          </button>
          <button
            onClick={() => navigate('/interviews')}
            className="w-full text-left group focus:outline-none"
          >
            <div className="rounded-xl border border-violet-500/30 bg-violet-500/10 p-4 flex items-center gap-4 transition-all group-hover:brightness-125 group-hover:scale-[1.01]">
              <div className="w-10 h-10 rounded-lg bg-violet-500/20 flex items-center justify-center">
                <Video size={20} className="text-violet-400" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-slate-200 font-medium uppercase tracking-wide">Interviews this {period}</p>
                <p className="text-2xl font-bold text-white">{(data?.interviewsTimeSeries || []).reduce((s, d) => s + (d.count || 0), 0)}</p>
              </div>
              <ArrowRight size={14} className="text-violet-400 opacity-0 group-hover:opacity-100 transition" />
            </div>
          </button>
        </div>

      </div>
    </div>
  );
}

// ─── CpcPanel ────────────────────────────────────────────────────────────────
function CpcPanel({ data, period, color }) {
  const [open, setOpen] = useState(false);
  const c = COLOR_MAP[color] || COLOR_MAP.violet;
  const allCpc = data?.allCpcAssigned || [];

  const ClickCard = ({ label, value }) => (
    <button onClick={() => setOpen(true)} className="text-left group w-full focus:outline-none">
      <div className={`rounded-xl border ${c.border} ${c.bg} p-4 flex items-center gap-4 transition-all group-hover:brightness-125 group-hover:scale-[1.01]`}>
        <div className={`w-10 h-10 rounded-lg ${c.bg} flex items-center justify-center`}>
          <TrendingUp size={20} className={c.text} />
        </div>
        <div>
          <p className="text-xs text-slate-200 font-medium uppercase tracking-wide">{label}</p>
          <p className="text-2xl font-bold text-white">{value ?? '—'}</p>
        </div>
      </div>
    </button>
  );

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <ClickCard label="CPCs Assigned" value={data?.total} />
        <ClickCard label="Top CPC" value={data?.topCpc?.[0]?._id || '—'} />
      </div>
      <ClickCard label={`CPCs assigned this ${period}`} value={(data?.timeSeries || []).reduce((s, d) => s + (d.count || 0), 0)} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <h4 className="text-sm font-semibold text-slate-300 mb-3">Top CPCs</h4>
          <LeaderboardTable
            rows={data?.topCpc || []}
            labelKey="_id" countKey="count" color={color}
            extraCols={[
              { key: 'candidateName', label: 'Candidate', render: (r) => r.candidateName ? <span className="font-medium text-slate-100">{r.candidateName}</span> : '—' },
              { key: 'email', label: 'Email', render: (r) => r.email ? <span className="flex items-center justify-end gap-1"><Mail size={10} className="text-slate-500" />{r.email}</span> : '—' },
            ]}
          />
        </div>
        <div>
          <h4 className="text-sm font-semibold text-slate-300 mb-3">Top CPC Ranges</h4>
          <LeaderboardTable rows={data?.topCpcRange || []} labelKey="range" countKey="count" color={color} />
        </div>
      </div>

      <DetailModal open={open} onClose={() => setOpen(false)} color={color}
        icon={TrendingUp} title="CPC Assignments" subtitle={`${allCpc.length} total assignment${allCpc.length !== 1 ? 's' : ''}`}>
        {allCpc.length === 0 ? (
          <p className="text-center text-slate-400 py-12">No CPCs assigned yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs uppercase tracking-wider text-slate-400 border-b border-slate-700/50">
                  <th className="text-left py-3 pl-3 pr-4 w-10">#</th>
                  <th className="text-left py-3 pr-6">Candidate</th>
                  <th className="text-left py-3 pr-6">Email</th>
                  <th className="text-left py-3 pr-6">Phone</th>
                  <th className="text-left py-3 pr-6">CPC</th>
                  <th className="text-right py-3 pr-3">Date</th>
                </tr>
              </thead>
              <tbody>
                {allCpc.map((iv, i) => {
                  const cand = iv.candidate || {};
                  const name = cand.firstName ? `${cand.firstName} ${cand.lastName || ''}`.trim() : '—';
                  return (
                    <tr key={iv._id} className="border-b border-slate-800/60 hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 pl-3 pr-4"><span className={`inline-flex items-center justify-center w-6 h-6 rounded-lg text-xs font-bold ${c.badge}`}>{i + 1}</span></td>
                      <td className="py-3 pr-6"><span className="font-semibold text-slate-100">{name}</span></td>
                      <td className="py-3 pr-6">{cand.email ? <span className="flex items-center gap-1.5 text-slate-300 text-xs"><Mail size={10} className="text-slate-500" />{cand.email}</span> : <span className="text-slate-500">—</span>}</td>
                      <td className="py-3 pr-6">{cand.phone ? <span className="flex items-center gap-1.5 text-slate-300 text-xs"><Phone size={10} className="text-slate-500" />{cand.phone}</span> : <span className="text-slate-500">—</span>}</td>
                      <td className="py-3 pr-6"><span className={`text-sm font-bold ${c.text}`}>{iv.pricing?.cpc || '—'}</span></td>
                      <td className="py-3 pr-3 text-right text-slate-400 text-xs whitespace-nowrap">{fmt(iv.updatedAt)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </DetailModal>
    </div>
  );
}


function ClassCodePanel({ data, period, color }) {
  const [showModal, setShowModal] = useState(false);
  const c = COLOR_MAP[color] || COLOR_MAP.amber;
  const rows = data?.topClassCodes || [];

  const extraCols = [
    {
      key: 'candidateName',
      label: 'Candidate',
      render: (row) => row.candidateName
        ? <span className="font-medium text-slate-100">{row.candidateName}</span>
        : '—',
    },
    {
      key: 'email',
      label: 'Email',
      render: (row) => row.email
        ? <span className="flex items-center justify-end gap-1.5"><Mail size={11} className="text-slate-400 shrink-0" />{row.email}</span>
        : '—',
    },
    {
      key: 'phone',
      label: 'Phone',
      render: (row) => row.phone
        ? <span className="flex items-center justify-end gap-1.5"><Phone size={11} className="text-slate-400 shrink-0" />{row.phone}</span>
        : '—',
    },
    {
      key: 'parentMonthly',
      label: 'Monthly Fee (₹)',
      render: (row) => row.parentMonthly ? `₹${row.parentMonthly.toLocaleString('en-IN')}` : '—',
    },
  ];

  return (
    <div className="space-y-6">

      {/* ── Clickable stat cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <button onClick={() => setShowModal(true)} className="text-left group w-full focus:outline-none">
          <div className={`rounded-xl border ${c.border} ${c.bg} p-4 flex items-center gap-4 transition-all group-hover:brightness-125 group-hover:scale-[1.01] cursor-pointer`}>
            <div className={`w-10 h-10 rounded-lg ${c.bg} flex items-center justify-center`}>
              <Layers size={20} className={c.text} />
            </div>
            <div>
              <p className="text-xs text-slate-200 font-medium uppercase tracking-wide">Class Codes Assigned</p>
              <p className="text-2xl font-bold text-white">{data?.total ?? '—'}</p>
            </div>
          </div>
        </button>
        <button onClick={() => setShowModal(true)} className="text-left group w-full focus:outline-none">
          <div className={`rounded-xl border ${c.border} ${c.bg} p-4 flex items-center gap-4 transition-all group-hover:brightness-125 group-hover:scale-[1.01] cursor-pointer`}>
            <div className={`w-10 h-10 rounded-lg ${c.bg} flex items-center justify-center`}>
              <Layers size={20} className={c.text} />
            </div>
            <div>
              <p className="text-xs text-slate-200 font-medium uppercase tracking-wide">Top Class Code</p>
              <p className="text-2xl font-bold text-white">{data?.topClassCodes?.find(c => c._id)?._id || '—'}</p>
            </div>
          </div>
        </button>
      </div>

      <button onClick={() => setShowModal(true)} className="text-left group w-full focus:outline-none">
        <div className={`rounded-xl border ${c.border} ${c.bg} p-4 flex items-center gap-4 transition-all group-hover:brightness-125 group-hover:scale-[1.01] cursor-pointer`}>
          <div className={`w-10 h-10 rounded-lg ${c.bg} flex items-center justify-center`}>
            <Layers size={20} className={c.text} />
          </div>
          <div>
            <p className="text-xs text-slate-200 font-medium uppercase tracking-wide">Assignments this {period}</p>
            <p className="text-2xl font-bold text-white">
              {(data?.timeSeries || []).reduce((s, d) => s + (d.count || 0), 0)}
            </p>
          </div>
        </div>
      </button>

      {/* ── Table ── */}
      <div>
        <h4 className="text-sm font-semibold text-slate-300 mb-3">Top Class Codes</h4>
        <LeaderboardTable
          rows={rows}
          labelKey="_id"
          countKey="count"
          nameLabel="Code"
          color={color}
          extraCols={extraCols}
        />
      </div>

      {/* ── Detail Modal ── */}
      {showModal && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)' }}
          onClick={(e) => e.target === e.currentTarget && setShowModal(false)}
        >
          <div className={`bg-slate-900 rounded-2xl border ${c.border} w-full max-w-5xl max-h-[85vh] flex flex-col shadow-2xl`}>

            {/* Modal header */}
            <div className={`flex items-center justify-between px-6 py-4 border-b border-slate-800`}>
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-xl ${c.bg} border ${c.border} flex items-center justify-center`}>
                  <Layers size={16} className={c.text} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-100">Class Codes — Full Details</h3>
                  <p className="text-xs text-slate-400">{rows.length} class code{rows.length !== 1 ? 's' : ''} assigned</p>
                </div>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal body */}
            <div className="overflow-y-auto flex-1 p-6">
              {rows.length === 0 ? (
                <p className="text-center text-slate-400 py-12">No class codes assigned yet.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-xs uppercase tracking-wider text-slate-400 border-b border-slate-700/50">
                        <th className="text-left py-3 pl-3 pr-4 font-medium w-10">#</th>
                        <th className="text-left py-3 pr-6 font-medium">Code</th>
                        <th className="text-left py-3 pr-6 font-medium">Candidate</th>
                        <th className="text-left py-3 pr-6 font-medium">Email</th>
                        <th className="text-left py-3 pr-6 font-medium">Phone</th>
                        <th className="text-right py-3 pr-6 font-medium">Monthly Fee (₹)</th>
                        <th className="text-right py-3 pl-4 pr-3 font-medium">Count</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((row, i) => (
                        <tr key={i} className="border-b border-slate-800/60 hover:bg-slate-800/40 transition-colors">
                          <td className="py-3 pl-3 pr-4">
                            <span className={`inline-flex items-center justify-center w-6 h-6 rounded-lg text-xs font-bold ${c.badge}`}>{i + 1}</span>
                          </td>
                          <td className="py-3 pr-6">
                            <span className={`text-sm font-bold ${c.text}`}>{row._id || '—'}</span>
                          </td>
                          <td className="py-3 pr-6">
                            <span className="font-semibold text-slate-100">{row.candidateName || '—'}</span>
                          </td>
                          <td className="py-3 pr-6">
                            {row.email
                              ? <span className="flex items-center gap-1.5 text-slate-300"><Mail size={11} className="text-slate-500 shrink-0" />{row.email}</span>
                              : <span className="text-slate-500">—</span>}
                          </td>
                          <td className="py-3 pr-6">
                            {row.phone
                              ? <span className="flex items-center gap-1.5 text-slate-300"><Phone size={11} className="text-slate-500 shrink-0" />{row.phone}</span>
                              : <span className="text-slate-500">—</span>}
                          </td>
                          <td className="py-3 pr-6 text-right text-slate-200">
                            {row.parentMonthly ? `₹${row.parentMonthly.toLocaleString('en-IN')}` : '—'}
                          </td>
                          <td className="py-3 pl-4 pr-3 text-right">
                            <span className={`font-bold text-lg ${c.text}`}>{row.count ?? 0}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function LocationsPanel({ data, color, location, setLocation }) {
  const c = COLOR_MAP[color] || COLOR_MAP.cyan;
  return (
    <div className="space-y-6">
      {/* Location filter pills */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs text-slate-300 flex items-center gap-1"><Filter size={12} /> Filter:</span>
        <button
          onClick={() => setLocation(null)}
          className={`px-3 py-1 rounded-full text-xs font-medium transition-all border ${!location ? `${c.active} border-transparent text-white` : 'border-slate-500 text-slate-300 hover:border-slate-300'}`}
        >
          All Locations
        </button>
        {LOCATIONS.map(loc => (
          <button
            key={loc}
            onClick={() => setLocation(loc === location ? null : loc)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-all border ${location === loc ? `${c.active} border-transparent text-white` : 'border-slate-500 text-slate-300 hover:border-slate-300'}`}
          >
            {loc}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <h4 className="text-sm font-semibold text-slate-100 mb-3">Candidates by Location</h4>
          <LeaderboardTable rows={data?.candidatesByLocation || []} labelKey="_id" countKey="count" color={color} />
        </div>
        <div>
          <h4 className="text-sm font-semibold text-slate-100 mb-3">Finalized Teachers by Location</h4>
          <LeaderboardTable rows={data?.teachersByLocation || []} labelKey="_id" countKey="count" color={color} />
        </div>
      </div>
    </div>
  );
}

// ─── CandidatesAppliedPanel ──────────────────────────────────────────────────
function CandidatesAppliedPanel({ data, period, color }) {
  const [open, setOpen] = useState(false);
  const c = COLOR_MAP[color] || COLOR_MAP.indigo;
  const candidates = data?.candidates || [];

  const statusColors = {
    applied: 'text-blue-400 bg-blue-500/10',
    'interview scheduled': 'text-yellow-400 bg-yellow-500/10',
    standby: 'text-orange-400 bg-orange-500/10',
    selected: 'text-emerald-400 bg-emerald-500/10',
    reserved: 'text-orange-400 bg-orange-500/10',
    cancelled: 'text-slate-400 bg-slate-700/40',
  };

  const ClickCard = ({ label, value }) => (
    <button onClick={() => setOpen(true)} className="text-left group w-full focus:outline-none">
      <div className={`rounded-xl border ${c.border} ${c.bg} p-4 flex items-center gap-4 transition-all group-hover:brightness-125 group-hover:scale-[1.01]`}>
        <div className={`w-10 h-10 rounded-lg ${c.bg} flex items-center justify-center`}>
          <Users size={20} className={c.text} />
        </div>
        <div>
          <p className="text-xs text-slate-200 font-medium uppercase tracking-wide">{label}</p>
          <p className="text-2xl font-bold text-white">{value ?? '—'}</p>
        </div>
      </div>
    </button>
  );

  return (
    <div className="space-y-6">
      <ClickCard label="Total Candidates Applied" value={data?.total} />
      <ClickCard
        label={`Applied this ${period}`}
        value={(data?.timeSeries || []).reduce((s, d) => s + (d.count || 0), 0)}
      />

      <DetailModal open={open} onClose={() => setOpen(false)} color={color}
        icon={Users} title="All Candidates" subtitle={`${candidates.length} candidate${candidates.length !== 1 ? 's' : ''} registered`}>
        {candidates.length === 0 ? (
          <p className="text-center text-slate-400 py-12">No candidates yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs uppercase tracking-wider text-slate-400 border-b border-slate-700/50">
                  <th className="text-left py-3 pl-3 pr-4 w-10">#</th>
                  <th className="text-left py-3 pr-6">Name</th>
                  <th className="text-left py-3 pr-6">Email</th>
                  <th className="text-left py-3 pr-6">Phone</th>
                  <th className="text-left py-3 pr-6">Location</th>
                  <th className="text-left py-3 pr-6">Status</th>
                  <th className="text-right py-3 pr-3">Applied</th>
                </tr>
              </thead>
              <tbody>
                {candidates.map((cand, i) => {
                  const name = cand.firstName ? `${cand.firstName} ${cand.lastName || ''}`.trim() : '—';
                  const locs = (cand.serviceLocation || []).join(', ') || '—';
                  const sc = statusColors[cand.status] || statusColors.applied;
                  return (
                    <tr key={cand._id} className="border-b border-slate-800/60 hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 pl-3 pr-4"><span className={`inline-flex items-center justify-center w-6 h-6 rounded-lg text-xs font-bold ${c.badge}`}>{i + 1}</span></td>
                      <td className="py-3 pr-6">
                        <div className="flex items-center gap-2">
                          <div className={`w-7 h-7 rounded-full ${c.bg} border ${c.border} flex items-center justify-center shrink-0`}>
                            <span className={`text-[10px] font-bold ${c.text}`}>{name !== '—' ? name[0].toUpperCase() : '?'}</span>
                          </div>
                          <span className="font-semibold text-slate-100">{name}</span>
                        </div>
                      </td>
                      <td className="py-3 pr-6">{cand.email ? <span className="flex items-center gap-1.5 text-slate-300 text-xs"><Mail size={10} className="text-slate-500" />{cand.email}</span> : <span className="text-slate-500">—</span>}</td>
                      <td className="py-3 pr-6">{cand.phone ? <span className="flex items-center gap-1.5 text-slate-300 text-xs"><Phone size={10} className="text-slate-500" />{cand.phone}</span> : <span className="text-slate-500">—</span>}</td>
                      <td className="py-3 pr-6"><span className="text-xs text-slate-300">{locs}</span></td>
                      <td className="py-3 pr-6">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold capitalize ${sc}`}>
                          {cand.status}
                        </span>
                      </td>
                      <td className="py-3 pr-3 text-right text-slate-400 text-xs whitespace-nowrap">{fmt(cand.createdAt)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </DetailModal>
    </div>
  );
}

function CandidatesBreakdownPanel({ data, color }) {
  const c = COLOR_MAP[color] || COLOR_MAP.pink;
  const [activeTab, setActiveTab] = useState('boards');
  const [expandedGroup, setExpandedGroup] = useState(null);

  const tabs = [
    { id: 'boards',    label: 'Boards',    groups: data?.byBoard    || [] },
    { id: 'classes',   label: 'Classes',   groups: data?.byClass    || [] },
    { id: 'locations', label: 'Locations', groups: data?.byLocation || [] },
  ];

  const activeGroups = tabs.find(t => t.id === activeTab)?.groups || [];

  return (
    <div className="space-y-6">
      {/* Stat */}
      <StatCard label="Total Teachers" value={data?.total} icon={UserCheck} color={color} />

      {/* Top Tab Selector */}
      <div className="flex items-center gap-2">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => { setActiveTab(tab.id); setExpandedGroup(null); }}
            className={`px-5 py-2 rounded-xl text-sm font-semibold transition-all border ${
              activeTab === tab.id
                ? `${c.active} border-transparent text-white shadow-sm`
                : 'border-slate-700 text-slate-400 hover:text-slate-200 hover:border-slate-500'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Group Pills Grid */}
      {activeGroups.length === 0 ? (
        <div className="text-center py-10 text-slate-500 text-sm italic">No data available</div>
      ) : (
        <div className="space-y-3">
          {activeGroups.map(group => (
            <div key={group._id} className={`rounded-xl border ${c.border} bg-slate-900/40 overflow-hidden`}>
              {/* Group Header — clickable */}
              <button
                className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-slate-800/40 transition-colors"
                onClick={() => setExpandedGroup(expandedGroup === group._id ? null : group._id)}
              >
                <div className="flex items-center gap-3">
                  <span className={`w-2 h-2 rounded-full ${c.active}`} />
                  <span className="text-sm font-semibold text-slate-200">{group._id || '(Unknown)'}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${c.badge}`}>
                    {group.count} teacher{group.count !== 1 ? 's' : ''}
                  </span>
                  <ChevronRight
                    size={14}
                    className={`text-slate-500 transition-transform ${expandedGroup === group._id ? 'rotate-90' : ''}`}
                  />
                </div>
              </button>

              {/* Expanded Teacher List */}
              {expandedGroup === group._id && (
                <div className="border-t border-slate-800">
                  {group.teachers.length === 0 ? (
                    <p className="text-slate-500 text-xs italic px-5 py-3">No teachers found.</p>
                  ) : (
                    <div className="divide-y divide-slate-800">
                      {group.teachers.map((t, i) => (
                        <div key={t.teacherId || i} className="px-5 py-3 flex items-center justify-between gap-4">
                          {/* Name + Meta */}
                          <div className="flex items-center gap-3 min-w-0">
                            <div className={`w-8 h-8 rounded-lg ${c.bg} border ${c.border} flex items-center justify-center shrink-0`}>
                              <GraduationCap size={14} className={c.text} />
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-slate-200 truncate">{t.name}</p>
                              <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                                {t.email && (
                                  <a href={`mailto:${t.email}`} className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-slate-200 transition">
                                    <Mail size={10} /> {t.email}
                                  </a>
                                )}
                                {t.phone && (
                                  <span className="flex items-center gap-1 text-[11px] text-slate-400">
                                    <Phone size={10} /> {t.phone}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          {/* Class Code badge */}
                          {t.classCode && (
                            <span className={`shrink-0 text-[11px] font-bold px-2 py-0.5 rounded-md ${c.badge}`}>
                              {t.classCode}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}


// ─── Main Page ─────────────────────────────────────────────────────────────

export function ReportsPage() {
  const { user } = useAuthStore();
  const [searchParams, setSearchParams] = useSearchParams();

  // Sync activeType with URL ?tab= param so we can deep-link to a specific tab
  const tabFromUrl = searchParams.get('tab') || 'finalized';
  const validTab = REPORT_TYPES.find(r => r.id === tabFromUrl) ? tabFromUrl : 'finalized';
  const [activeType, setActiveTypeState] = useState(validTab);

  // When URL param changes externally (e.g. navigated from another page), sync
  useEffect(() => { setActiveTypeState(validTab); }, [validTab]);

  const setActiveType = (typeId) => {
    setActiveTypeState(typeId);
    setSearchParams(prev => { prev.set('tab', typeId); return prev; });
  };

  const [period, setPeriod] = useState('month');
  const [location, setLocation] = useState(null);
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const activeConfig = REPORT_TYPES.find(r => r.id === activeType) || REPORT_TYPES[0];
  const c = COLOR_MAP[activeConfig.color];

  const fetchReport = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getReport(
        activeType,
        activeConfig.hasPeriod ? period : 'month',
        activeConfig.hasLocation ? location : null
      );
      setReportData(res.data.data);
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to load report');
    } finally {
      setLoading(false);
    }
  }, [activeType, period, location, activeConfig.hasPeriod, activeConfig.hasLocation]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  // Reset location & period when switching report type
  const handleTypeChange = (typeId) => {
    setActiveType(typeId);
    setLocation(null);
  };

  // Restrict access
  if (!['admin', 'super_admin', 'executer'].includes(user?.role)) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-slate-400">You don't have permission to view reports.</p>
      </div>
    );
  }

  return (
    <div className="flex gap-0 -m-6 min-h-[calc(100vh-64px)]">

      {/* ── Left Sidebar: Report Type Selector ── */}
      <aside className="w-64 shrink-0 bg-slate-900/60 border-r border-slate-800 flex flex-col">
        <div className="px-5 py-5 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-violet-600/20 flex items-center justify-center">
              <BarChart3 size={16} className="text-violet-400" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-100">Reports</h2>
              <p className="text-[10px] text-slate-500">Platform analytics</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          <p className="text-[10px] uppercase tracking-widest font-semibold text-slate-500 px-2 mb-2">Report Types</p>
          {REPORT_TYPES.map(rt => {
            const Icon = rt.icon;
            const rc = COLOR_MAP[rt.color];
            const isActive = activeType === rt.id;
            return (
              <button
                key={rt.id}
                onClick={() => handleTypeChange(rt.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-left group ${
                  isActive
                    ? `${rc.bg} ${rc.text} border ${rc.border}`
                    : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200 border border-transparent'
                }`}
              >
                <Icon size={16} className="shrink-0" />
                <span className="flex-1 truncate">{rt.label}</span>
                {isActive && <ChevronRight size={14} className="shrink-0 opacity-60" />}
              </button>
            );
          })}
        </nav>
      </aside>

      {/* ── Right: Report Content ── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">

        {/* Header */}
        <div className={`px-8 py-6 border-b border-slate-800 bg-gradient-to-r from-slate-900 to-slate-900/50`}>
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl ${c.bg} border ${c.border} flex items-center justify-center`}>
                <activeConfig.icon size={20} className={c.text} />
              </div>
              <div>
                <h1 className="text-lg font-bold text-slate-100">{activeConfig.label}</h1>
                <p className="text-xs text-slate-400 mt-0.5">{activeConfig.description}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              {/* Period tabs */}
              {activeConfig.hasPeriod && (
                <div className="flex items-center gap-1 bg-slate-800 rounded-xl p-1">
                  {PERIODS.map(p => (
                    <button
                      key={p.id}
                      onClick={() => setPeriod(p.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                        period === p.id
                          ? `${c.active} text-white shadow-sm`
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              )}

              {/* Refresh */}
              <button
                onClick={fetchReport}
                disabled={loading}
                className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-slate-100 hover:bg-slate-700 transition-all disabled:opacity-40"
                title="Refresh"
              >
                <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 p-8">
          {loading && (
            <div className="flex items-center justify-center h-48">
              <div className="flex flex-col items-center gap-3">
                <div className={`w-10 h-10 rounded-full border-2 border-t-transparent animate-spin`}
                  style={{ borderColor: `${COLOR_MAP[activeConfig.color]?.bar}40`, borderTopColor: COLOR_MAP[activeConfig.color]?.bar }}
                />
                <p className="text-slate-400 text-sm">Loading report...</p>
              </div>
            </div>
          )}

          {error && !loading && (
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-6 text-center">
              <p className="text-red-400 font-medium">Failed to load report</p>
              <p className="text-red-400/70 text-sm mt-1">{error}</p>
              <button
                onClick={fetchReport}
                className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-500 transition"
              >
                Try Again
              </button>
            </div>
          )}

          {!loading && !error && reportData && (
            <div className={`rounded-2xl border ${c.border} bg-slate-900/50 p-6`}>
              {activeType === 'finalized' && (
                <FinalizedPanel data={reportData} period={period} color={activeConfig.color} />
              )}
              {activeType === 'reserved' && (
                <ReservedPanel data={reportData} period={period} color={activeConfig.color} />
              )}
              {activeType === 'meetings' && (
                <MeetingsPanel data={reportData} period={period} color={activeConfig.color} />
              )}
              {activeType === 'cpc' && (
                <CpcPanel data={reportData} period={period} color={activeConfig.color} />
              )}
              {activeType === 'classCode' && (
                <ClassCodePanel data={reportData} period={period} color={activeConfig.color} />
              )}
              {activeType === 'locations' && (
                <LocationsPanel
                  data={reportData}
                  color={activeConfig.color}
                  location={location}
                  setLocation={(loc) => { setLocation(loc); }}
                />
              )}
              {activeType === 'candidatesApplied' && (
                <CandidatesAppliedPanel data={reportData} period={period} color={activeConfig.color} />
              )}
              {activeType === 'candidatesBreakdown' && (
                <CandidatesBreakdownPanel
                  data={reportData}
                  color={activeConfig.color}
                />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ReportsPage;
