import React, { useEffect, useState } from 'react';
import {
  Video, RefreshCw, Plus, Trash2, AlertTriangle,
  Clock, CheckCircle2, XCircle, ExternalLink, CalendarClock, Users
} from 'lucide-react';
import {
  getMeetings as fetchMeetingsApi,
  createMeeting as createMeetingApi,
  rescheduleMeeting as rescheduleMeetingApi,
  updateMeetingStatus as updateStatusApi,
  deleteMeeting as deleteMeetingApi,
  getUsers,
  getTeachers,
} from '../services/api';
import { useAuthStore } from '../store/authStore';
import { Modal } from '../components/common/Modal';
import clsx from 'clsx';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const StatusBadge = ({ status }) => {
  const map = {
    scheduled:  { label: 'Scheduled',  cls: 'bg-blue-100 text-blue-700 border-blue-200' },
    completed:  { label: 'Completed',  cls: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
    cancelled:  { label: 'Cancelled',  cls: 'bg-red-100 text-red-600 border-red-200' },
  };
  const s = map[status] || { label: status, cls: 'bg-slate-100 text-slate-600 border-slate-200' };
  return (
    <span className={clsx('text-xs font-semibold px-2.5 py-0.5 rounded-full border', s.cls)}>{s.label}</span>
  );
};

const fmtDate = (d) => d ? new Date(d).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : '—';

// ─── Page ─────────────────────────────────────────────────────────────────────

export const MeetingsPage = () => {
  const { user } = useAuthStore();
  const isAdminOrAbove = ['super_admin', 'admin'].includes(user?.role);

  const [tab, setTab]             = useState('panelist');  // 'panelist' | 'teacher'
  const [meetings, setMeetings]   = useState([]);
  const [loading, setLoading]     = useState(true);

  // Scheduling modal
  const [schedOpen, setSchedOpen] = useState(false);
  const [schedLoading, setSchedLoading] = useState(false);
  const [schedMsg, setSchedMsg]   = useState('');
  const [form, setForm]           = useState({ title: '', scheduledAt: '', notes: '' });
  const [allPanelists, setAllPanelists]   = useState([]);
  const [allTeachers, setAllTeachers]     = useState([]);
  const [selectedPanelists, setSelectedPanelists] = useState([]);
  const [selectedTeachers, setSelectedTeachers]   = useState([]);

  // Reschedule modal
  const [reschedTarget, setReschedTarget]   = useState(null);
  const [newDateTime, setNewDateTime]       = useState('');
  const [reschedLoading, setReschedLoading] = useState(false);
  const [reschedMsg, setReschedMsg]         = useState('');

  // Delete modal
  const [deleteTarget, setDeleteTarget] = useState(null);

  // ─── Fetch ─────────────────────────────────────────────────────────────────
  const fetchMeetings = async () => {
    setLoading(true);
    try {
      const res = await fetchMeetingsApi(tab);
      setMeetings(res.data?.data || []);
    } catch { setMeetings([]); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchMeetings(); }, [tab]);

  const openScheduleModal = async () => {
    setSchedOpen(true);
    setSchedMsg('');
    setForm({ title: '', scheduledAt: '', notes: '' });
    setSelectedPanelists([]);
    setSelectedTeachers([]);
    try {
      if (tab === 'panelist') {
        const res = await getUsers();
        setAllPanelists((res.data?.data || []).filter(u => u._id !== user._id));
      } else {
        const res = await getTeachers();
        setAllTeachers(res.data?.data || []);
      }
    } catch { /* ignore */ }
  };

  // ─── Handlers ──────────────────────────────────────────────────────────────
  const togglePanelist = (u) =>
    setSelectedPanelists(prev =>
      prev.find(p => p._id === u._id) ? prev.filter(p => p._id !== u._id) : [...prev, u]
    );

  const toggleTeacher = (t) => {
    const teacherId = t._id;
    setSelectedTeachers(prev =>
      prev.find(p => p._id === teacherId) ? prev.filter(p => p._id !== teacherId) : [...prev, t]
    );
  };

  const teacherName = (t) => {
    const c = t.candidate || {};
    return `${c.firstName || ''} ${c.lastName || ''}`.trim() || 'Unknown';
  };

  const handleCreate = async () => {
    if (!form.scheduledAt) { setSchedMsg('Please select a date & time.'); return; }
    if (tab === 'panelist' && selectedPanelists.length === 0) { setSchedMsg('Select at least one panelist.'); return; }
    if (tab === 'teacher'  && selectedTeachers.length  === 0) { setSchedMsg('Select at least one teacher.');  return; }
    setSchedLoading(true);
    setSchedMsg('');
    try {
      await createMeetingApi({
        title: form.title || undefined,
        meetingType: tab,
        scheduledAt: form.scheduledAt,
        notes: form.notes,
        participants: tab === 'panelist'
          ? selectedPanelists.map(u => ({ user: u._id, name: u.name, email: u.email }))
          : [],
        teacherParticipants: tab === 'teacher'
          ? selectedTeachers.map(t => ({
              teacher: t._id,
              name: teacherName(t),
              email: t.candidate?.email || '',
            }))
          : [],
      });
      setSchedOpen(false);
      fetchMeetings();
    } catch (err) {
      setSchedMsg(err.response?.data?.message || 'Failed to schedule meeting.');
    } finally {
      setSchedLoading(false);
    }
  };

  const handleReschedule = async () => {
    if (!newDateTime) { setReschedMsg('Please pick a new date & time.'); return; }
    setReschedLoading(true);
    setReschedMsg('');
    try {
      await rescheduleMeetingApi(reschedTarget._id, newDateTime);
      setReschedTarget(null);
      fetchMeetings();
    } catch (err) {
      setReschedMsg(err.response?.data?.message || 'Reschedule failed.');
    } finally { setReschedLoading(false); }
  };

  const handleMarkComplete = async (id) => {
    try { await updateStatusApi(id, 'completed'); fetchMeetings(); }
    catch (err) { alert(err.response?.data?.message || 'Failed'); }
  };

  const handleDelete = async () => {
    try { await deleteMeetingApi(deleteTarget._id); setDeleteTarget(null); fetchMeetings(); }
    catch (err) { alert(err.response?.data?.message || 'Delete failed'); }
  };

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Meetings</h2>
          <p className="text-slate-500 text-sm mt-0.5">Schedule Zoom meetings with panelists or finalized teachers</p>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchMeetings}
            className="flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-purple-600 px-3 py-2 rounded-lg hover:bg-purple-50 transition border border-slate-200">
            <RefreshCw size={14} /> Refresh
          </button>
          {isAdminOrAbove && (
            <button onClick={openScheduleModal}
              className="flex items-center gap-2 text-sm font-semibold text-white bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-lg transition shadow-sm shadow-purple-500/20">
              <Plus size={15} /> Schedule Meeting
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-slate-100 rounded-xl mb-5 w-fit">
        {[
          { key: 'panelist', label: 'Panelist Meetings', icon: Users  },
          { key: 'teacher',  label: 'Teacher Meetings',  icon: Video  },
        ].map(({ key, label, icon: Icon }) => (
          <button key={key} onClick={() => setTab(key)}
            className={clsx(
              'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition',
              tab === key
                ? 'bg-white text-purple-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-800'
            )}>
            <Icon size={14} /> {label}
          </button>
        ))}
      </div>

      {/* Meeting Cards */}
      {loading ? (
        <div className="p-12 text-center text-slate-500 text-sm animate-pulse">Loading meetings...</div>
      ) : meetings.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-4 text-slate-400">
          <CalendarClock size={40} className="text-slate-300" />
          <p className="text-sm font-medium">No {tab} meetings scheduled yet.</p>
          {isAdminOrAbove && (
            <button onClick={openScheduleModal}
              className="flex items-center gap-2 text-sm font-semibold text-purple-600 hover:text-purple-700 bg-purple-50 border border-purple-200 px-4 py-2 rounded-xl transition">
              <Plus size={14} /> Schedule one now
            </button>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {meetings.map(m => {
            const participants = tab === 'panelist'
              ? m.participants.map(p => p.name || p.email || 'Unknown')
              : m.teacherParticipants.map(p => p.name || p.email || 'Unknown');

            return (
              <div key={m._id} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h3 className="text-sm font-bold text-slate-800">{m.title}</h3>
                      <StatusBadge status={m.status} />
                    </div>
                    <p className="text-xs text-slate-500 flex items-center gap-1 mb-1">
                      <Clock size={12} /> {fmtDate(m.scheduledAt)}
                    </p>
                    {m.createdBy && (
                      <p className="text-xs text-slate-500 mb-2">
                        <strong>Host:</strong> {m.createdBy.name || m.createdBy.email || '—'}
                      </p>
                    )}
                    <p className="text-xs text-slate-600">
                      <strong>Participants:</strong> {participants.length ? participants.join(', ') : '—'}
                    </p>
                    {m.notes && (
                      <p className="text-xs text-slate-400 mt-1 italic">{m.notes}</p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-2 shrink-0">
                    {/* Join Zoom — only while scheduled */}
                    {m.zoomJoinUrl && m.status === 'scheduled' && (
                      <a href={m.zoomJoinUrl} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-1.5 text-xs font-semibold text-white bg-blue-500 hover:bg-blue-600 px-3 py-1.5 rounded-lg transition">
                        <Video size={12} /> Join Zoom
                      </a>
                    )}
                    {isAdminOrAbove && m.status === 'scheduled' && (
                      <>
                        <button onClick={() => handleMarkComplete(m._id)}
                          className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg hover:bg-emerald-100 transition">
                          <CheckCircle2 size={12} /> Mark Complete
                        </button>
                        <button onClick={() => { setReschedTarget(m); setNewDateTime(''); setReschedMsg(''); }}
                          className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg hover:bg-slate-100 transition">
                          <CalendarClock size={12} /> Reschedule
                        </button>
                      </>
                    )}
                    {isAdminOrAbove && (
                      <button onClick={() => setDeleteTarget(m)}
                        className="flex items-center gap-1.5 text-xs font-semibold text-red-600 bg-red-50 border border-red-100 px-3 py-1.5 rounded-lg hover:bg-red-100 transition">
                        <Trash2 size={12} /> Delete
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Schedule Meeting Modal ── */}
      <Modal isOpen={schedOpen} onClose={() => setSchedOpen(false)} title={`Schedule ${tab === 'panelist' ? 'Panelist' : 'Teacher'} Meeting`}>
        <div className="flex flex-col gap-4">
          {/* Title */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Meeting Title (optional)</label>
            <input type="text" value={form.title}
              onChange={e => setForm({ ...form, title: e.target.value })}
              placeholder={tab === 'panelist' ? "e.g. Panelist Briefing" : "e.g. Teacher Onboarding"}
              className="px-3 py-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:border-purple-400" />
          </div>

          {/* Date & Time */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Date & Time</label>
            <input type="datetime-local" value={form.scheduledAt}
              onChange={e => setForm({ ...form, scheduledAt: e.target.value })}
              className="px-3 py-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:border-purple-400" />
          </div>

          {/* Participants */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
              {tab === 'panelist' ? 'Select Panelists' : 'Select Teachers'}
            </label>
            <div className="flex flex-col gap-1 max-h-48 overflow-y-auto border border-slate-100 rounded-xl p-2">
              {tab === 'panelist' ? (
                allPanelists.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-4">No panelists found</p>
                ) : allPanelists.map(u => {
                  const sel = !!selectedPanelists.find(p => p._id === u._id);
                  return (
                    <label key={u._id} className={clsx(
                      'flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer border transition',
                      sel ? 'bg-purple-50 border-purple-200' : 'border-transparent hover:bg-slate-50'
                    )}>
                      <input type="checkbox" checked={sel} onChange={() => togglePanelist(u)} className="accent-purple-600" />
                      <span className="text-sm font-medium text-slate-700">{u.name || u.email}</span>
                      <span className="text-xs text-slate-400 ml-auto">{u.role}</span>
                    </label>
                  );
                })
              ) : (
                allTeachers.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-4">No teachers found</p>
                ) : allTeachers.map(t => {
                  const sel = !!selectedTeachers.find(p => p._id === t._id);
                  const name = teacherName(t);
                  return (
                    <label key={t._id} className={clsx(
                      'flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer border transition',
                      sel ? 'bg-purple-50 border-purple-200' : 'border-transparent hover:bg-slate-50'
                    )}>
                      <input type="checkbox" checked={sel} onChange={() => toggleTeacher(t)} className="accent-purple-600" />
                      <div className="flex-1 min-w-0">
                        <span className="text-sm font-medium text-slate-700">{name}</span>
                        {t.serialNumber && (
                          <span className="text-xs text-purple-600 ml-2 font-mono">{t.serialNumber}</span>
                        )}
                      </div>
                    </label>
                  );
                })
              )}
            </div>
          </div>

          {/* Notes */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Notes (optional)</label>
            <input type="text" value={form.notes}
              onChange={e => setForm({ ...form, notes: e.target.value })}
              placeholder="Add any agenda or notes..."
              className="px-3 py-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:border-purple-400" />
          </div>

          {schedMsg && (
            <div className="text-sm bg-red-50 border border-red-100 text-red-700 px-4 py-3 rounded-xl">{schedMsg}</div>
          )}

          <div className="flex gap-2 mt-1">
            <button onClick={handleCreate} disabled={schedLoading}
              className="flex-1 bg-purple-600 text-white font-bold py-2.5 rounded-xl hover:bg-purple-700 disabled:opacity-50 transition text-sm">
              {schedLoading ? 'Creating...' : 'Confirm & Schedule'}
            </button>
            <button onClick={() => setSchedOpen(false)}
              className="px-4 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-600 hover:bg-slate-50">
              Cancel
            </button>
          </div>
        </div>
      </Modal>

      {/* ── Reschedule Modal ── */}
      <Modal isOpen={!!reschedTarget} onClose={() => setReschedTarget(null)} title="Reschedule Meeting">
        <div className="flex flex-col gap-4">
          <p className="text-sm text-slate-600">
            Rescheduling: <strong>{reschedTarget?.title}</strong>
          </p>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">New Date & Time</label>
            <input type="datetime-local" value={newDateTime} onChange={e => setNewDateTime(e.target.value)}
              className="px-3 py-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:border-purple-400" />
          </div>
          {reschedMsg && <p className="text-sm text-red-600">{reschedMsg}</p>}
          <div className="flex gap-2">
            <button onClick={handleReschedule} disabled={reschedLoading}
              className="flex-1 bg-purple-600 text-white font-bold py-2.5 rounded-xl hover:bg-purple-700 disabled:opacity-50 transition text-sm">
              {reschedLoading ? 'Rescheduling...' : 'Confirm Reschedule'}
            </button>
            <button onClick={() => setReschedTarget(null)}
              className="px-4 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-600 hover:bg-slate-50">
              Cancel
            </button>
          </div>
        </div>
      </Modal>

      {/* ── Delete Confirm Modal ── */}
      <Modal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Delete Meeting">
        <div className="flex flex-col gap-4">
          <div className="flex items-start gap-3 bg-red-50 border border-red-100 rounded-xl p-4">
            <AlertTriangle size={18} className="text-red-500 shrink-0 mt-0.5" />
            <p className="text-sm text-red-700">
              Delete <strong>{deleteTarget?.title}</strong>? This cannot be undone.
              The Zoom meeting link will no longer work.
            </p>
          </div>
          <div className="flex gap-2">
            <button onClick={handleDelete}
              className="flex-1 bg-red-600 text-white font-bold py-2.5 rounded-xl hover:bg-red-700 transition text-sm">
              Yes, Delete
            </button>
            <button onClick={() => setDeleteTarget(null)}
              className="px-4 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-600 hover:bg-slate-50">
              Cancel
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
