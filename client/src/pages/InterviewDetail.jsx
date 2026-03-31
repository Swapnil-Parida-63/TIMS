import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ChevronLeft, Video, CheckCircle2, Lock, EyeOff,
  Clock, ChevronDown, ChevronRight
} from 'lucide-react';
import {
  getInterviews, getFeedbacks, submitFeedback,
  updateInterviewStatus, assignCPC, getClassOptions, finalizeTeacher, rescheduleInterview
} from '../services/api';
import { useAuthStore } from '../store/authStore';
import { useDataStore } from '../store/dataStore';
import {
  canViewSomeFeedback, canSubmitFeedback,
  canViewRecording, canFinalize
} from '../utils/rbac';
import { CPC_MAP, SECTION_LABELS, getCpcPriceRange, formatPriceRange } from '../utils/cpcMap';

import { Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { MultiSelect } from '../components/common/MultiSelect';
import clsx from 'clsx';

// ─── Constants ─────────────────────────────────────────────────────────────
const BOARD_OPTIONS = ['CBSE/IGCSE', 'ICSE', 'State Board of Odisha', 'CHSE', 'SSVM'];
const CLASS_OPTIONS = ['1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th', '10th', '11th', '12th'];

// ─── Sub-components ─────────────────────────────────────────────────────────

const InfoRow = ({ label, value }) => (
  <div className="flex flex-col gap-0.5">
    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">{label}</span>
    <span className="text-sm text-slate-800">{value || '—'}</span>
  </div>
);

const RatingInput = ({ label, value, onChange }) => (
  <div className="flex flex-col gap-1.5">
    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{label}</label>
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map(n => (
        <button key={n} type="button" onClick={() => onChange(n)}
          className={clsx(
            'w-8 h-8 rounded-lg text-sm font-bold transition border',
            value >= n ? 'bg-purple-600 text-white border-purple-600' : 'bg-white text-slate-400 border-slate-200 hover:border-purple-400'
          )}>
          {n}
        </button>
      ))}
    </div>
  </div>
);

const FeedbackCard = ({ feedback }) => {
  const s = feedback.ratings || {};
  return (
    <div className="border border-slate-100 rounded-xl p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
          {feedback.judgeType === 'internal' ? 'Internal Panelist' : 'External Panelist'}
        </span>
        <span className="text-xs text-slate-400">
          {feedback.submittedAt ? new Date(feedback.submittedAt).toLocaleDateString('en-IN') : ''}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-3 text-xs">
        {s.communication?.score > 0 && <div><span className="font-semibold text-slate-600">Communication: </span><span className="text-purple-600 font-bold">{s.communication.score}/5</span></div>}
        {s.subject?.depthRating > 0 && <div><span className="font-semibold text-slate-600">Subject: </span><span className="text-purple-600 font-bold">{s.subject.depthRating}/5</span>{s.subject.subject && ` — ${s.subject.subject}`}</div>}
        {s.personality?.score > 0 && <div><span className="font-semibold text-slate-600">Personality: </span><span className="text-purple-600 font-bold">{s.personality.score}/5</span></div>}
        {s.presentation?.score > 0 && <div><span className="font-semibold text-slate-600">Presentation: </span><span className="text-purple-600 font-bold">{s.presentation.score}/5</span></div>}
        {s.overallRemark?.tag && (
          <div className="col-span-2">
            <span className="font-semibold text-slate-600">Verdict: </span>
            <span className={clsx('font-bold',
              s.overallRemark.tag === 'Excellent' ? 'text-green-600' :
              s.overallRemark.tag === 'Okay' ? 'text-amber-600' : 'text-red-600'
            )}>{s.overallRemark.tag}</span>
            {s.overallRemark.comment && <p className="text-slate-500 mt-0.5">{s.overallRemark.comment}</p>}
          </div>
        )}
      </div>
      {feedback.hrRemark && (
        <div className="bg-blue-50 border border-blue-100 rounded-lg px-3 py-2 text-xs text-blue-700">
          <span className="font-bold">HR: </span>{feedback.hrRemark}
        </div>
      )}
    </div>
  );
};

// ─── CPC Range Picker (super admin only) ────────────────────────────────────
// Step 1: pick category, Step 2: pick From CPC, Step 3: pick To CPC
// Auto-sorts so from <= to. Previews the computed range label.

const CpcRangePicker = ({ value, onChange }) => {
  const categories = Object.keys(CPC_MAP);
  const [category, setCategory] = useState(value.from ? value.from.split('-')[0] : '');

  const cpcKeys = category ? Object.keys(CPC_MAP[category]) : [];
  const fromIdx  = value.from ? cpcKeys.indexOf(value.from) : -1;
  const toIdx    = value.to   ? cpcKeys.indexOf(value.to)   : -1;

  // Compute the range preview label
  const getLabel = (from, to) => {
    if (!from) return '';
    if (!to || from === to) return from;
    const fi = cpcKeys.indexOf(from);
    const ti = cpcKeys.indexOf(to);
    const [s, e] = fi <= ti ? [from, to] : [to, from];
    return `${s} to ${e}`;
  };

  const rangeLabel = getLabel(value.from, value.to);

  // Which CPCs are inside the selected range (for highlighting)
  const inRange = (cpc) => {
    if (!value.from || !value.to) return cpc === value.from;
    const fi = Math.min(fromIdx, toIdx);
    const ti = Math.max(fromIdx, toIdx);
    const ci = cpcKeys.indexOf(cpc);
    return ci >= fi && ci <= ti;
  };

  const handleCpcClick = (cpc) => {
    if (!value.from || (value.from && value.to)) {
      // First click — set From, clear To
      onChange({ from: cpc, to: '' });
    } else {
      // Second click — set To
      onChange({ from: value.from, to: cpc });
    }
  };

  const handleCategoryChange = (cat) => {
    setCategory(cat);
    onChange({ from: '', to: '' });
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Step 1: Category */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Category</label>
        <div className="flex gap-2">
          {categories.map(cat => (
            <button key={cat} type="button" onClick={() => handleCategoryChange(cat)}
              className={clsx(
                'flex-1 py-2 rounded-xl text-xs font-bold border transition',
                category === cat
                  ? 'bg-purple-600 text-white border-purple-600'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-purple-400'
              )}>
              {cat}
            </button>
          ))}
        </div>
        {category && <p className="text-xs text-slate-400">{SECTION_LABELS[category]}</p>}
      </div>

      {/* Step 2+3: Select From and To within chosen category */}
      {category && (
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
              {!value.from ? 'Select start of range' : !value.to ? 'Now select end of range' : 'Range selected'}
            </label>
            {(value.from || value.to) && (
              <button type="button" onClick={() => onChange({ from: '', to: '' })}
                className="text-xs text-red-400 hover:text-red-600 transition">Clear</button>
            )}
          </div>
          <div className="grid grid-cols-2 gap-2">
            {cpcKeys.map(cpc => {
              const isFrom = cpc === value.from;
              const isTo   = cpc === value.to;
              const inside = inRange(cpc);
              const pr     = getCpcPriceRange(cpc);
              return (
                <button key={cpc} type="button" onClick={() => handleCpcClick(cpc)}
                  className={clsx(
                    'py-2.5 px-3 rounded-xl border transition text-left flex flex-col gap-0.5',
                    isFrom || isTo
                      ? 'bg-purple-600 text-white border-purple-600'
                      : inside
                        ? 'bg-purple-100 text-purple-700 border-purple-300'
                        : 'bg-white text-slate-600 border-slate-200 hover:border-purple-400 hover:bg-purple-50'
                  )}>
                  <span className="text-xs font-bold">{cpc}</span>
                  {pr && (
                    <span className={clsx(
                      'text-[10px] leading-tight',
                      isFrom || isTo ? 'text-purple-200' : inside ? 'text-purple-500' : 'text-slate-400'
                    )}>
                      {formatPriceRange(pr)}/mo
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Range preview — shows CPC range + combined price span */}
      {rangeLabel && (() => {
        const fromPr = value.from ? getCpcPriceRange(value.from) : null;
        const toPr   = value.to   ? getCpcPriceRange(value.to)   : null;
        const minPrice = fromPr && toPr ? Math.min(fromPr.min, toPr.min) : fromPr?.min;
        const maxPrice = fromPr && toPr ? Math.max(fromPr.max, toPr.max) : fromPr?.max;
        return (
          <div className="bg-purple-50 border border-purple-200 rounded-xl px-4 py-3 flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-purple-500 uppercase tracking-wide">Selected Range</span>
              <span className="text-sm font-bold text-purple-800 ml-auto">{rangeLabel}</span>
            </div>
            {minPrice && maxPrice && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-purple-400 uppercase tracking-wide">Price Span</span>
                <span className="text-xs font-bold text-purple-700 ml-auto">
                  {formatPriceRange({ min: minPrice, max: maxPrice })}/mo
                </span>
              </div>
            )}
          </div>
        );
      })()}
    </div>
  );
};

// ─── Admin Class Config Panel ────────────────────────────────────────────────
// Shown inline on the InterviewDetail page for admin when CPC is set.

const AdminClassConfig = ({ interviewId, cpcRange, onSuccess }) => {
  const [classOptions, setClassOptions] = useState([]);
  const [classCode, setClassCode] = useState('');
  const [selectedBoards, setSelectedBoards] = useState([]);
  const [selectedClasses, setSelectedClasses] = useState([]);
  const [slots, setSlots] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const { triggerRefresh } = useDataStore();

  // Load class options — now returns union of entire CPC range from server
  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const res = await getClassOptions(interviewId);
        setClassOptions(res.data?.data || []);
      } catch (err) {
        setMsg(`Could not load class options: ${err.response?.data?.message || err.message}`);
      }
    };
    fetchOptions();
  }, [interviewId]);

  const handleFinalize = async () => {
    if (!classCode) { setMsg('Select a class code.'); return; }
    if (!slots) { setMsg('Enter number of slots.'); return; }
    if (selectedBoards.length === 0) { setMsg('Select at least one board.'); return; }
    if (selectedClasses.length === 0) { setMsg('Select at least one class grade.'); return; }
    setLoading(true);
    setMsg('');
    try {
      await finalizeTeacher(interviewId, {
        classCode,
        boards: selectedBoards,
        classes: selectedClasses,
        slots: Number(slots),
      });
      triggerRefresh(); // sync all pages
      onSuccess?.();
    } catch (err) {
      setMsg(err.response?.data?.message || 'Finalization failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-blue-100 shadow-sm p-5">
      <div className="flex items-center gap-2 mb-4 pb-2 border-b border-slate-100">
        <span className="text-xs font-bold text-blue-700 bg-blue-100 px-2.5 py-1 rounded-full">Admin</span>
        <h3 className="text-sm font-bold text-slate-700">Class Configuration</h3>
        <span className="text-xs text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 ml-auto">
          CPC Range: {cpcRange} ✓
        </span>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Class Code</label>
          <select value={classCode} onChange={e => setClassCode(e.target.value)}
            className="px-3 py-2 border border-slate-200 rounded-xl text-sm bg-white outline-none focus:border-purple-400">
            <option value="">Select class code...</option>
            {classOptions.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Slots (1–11)</label>
          <input type="number" min={1} max={11} value={slots} onChange={e => setSlots(e.target.value)}
            placeholder="e.g. 5"
            className="px-3 py-2 border border-slate-200 rounded-xl text-sm outline-none focus:border-purple-400" />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Boards</label>
          <MultiSelect options={BOARD_OPTIONS} selected={selectedBoards} onChange={setSelectedBoards} placeholder="Select boards..." />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Classes (Grades)</label>
          <MultiSelect options={CLASS_OPTIONS} selected={selectedClasses} onChange={setSelectedClasses} placeholder="Select grades..." />
        </div>
      </div>
      {msg && <p className="mt-3 text-sm px-4 py-3 bg-red-50 border border-red-100 text-red-700 rounded-xl">{msg}</p>}
      <button onClick={handleFinalize} disabled={loading}
        className="mt-4 w-full py-3 bg-purple-600 text-white font-bold rounded-xl hover:bg-purple-700 disabled:opacity-50 transition text-sm">
        {loading ? 'Processing...' : '🎉 Confirm Selection & Send Offer'}
      </button>
    </div>
  );
};

// ─── Main Component ──────────────────────────────────────────────────────────

export const InterviewDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { refreshKey, triggerRefresh } = useDataStore();
  const role = user?.role;
  const isSuperAdmin = role === 'super_admin';
  const isAdmin = role === 'admin';

  const [interview, setInterview] = useState(null);
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);

  // Feedback submission
  const [feedbackForm, setFeedbackForm] = useState({
    ratings: {
      communication: { score: 0, comment: '' },
      subject: { subject: '', classLevel: '', depthRating: 0, comment: '' },
      personality: { score: 0, comment: '' },
      presentation: { score: 0, comment: '' },
      overallRemark: { tag: 'Okay', comment: '' },
    }
  });
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitMsg, setSubmitMsg] = useState('');

  // Super admin CPC range modal
  const [cpcModalOpen, setCpcModalOpen] = useState(false);
  const [selectedCpc, setSelectedCpc] = useState({ from: '', to: '' }); // {from, to}
  const [cpcLoading, setCpcLoading]     = useState(false);
  const [cpcMsg, setCpcMsg]             = useState('');

  // Reschedule
  const [rescheduleOpen, setRescheduleOpen]       = useState(false);
  const [newScheduledAt, setNewScheduledAt]       = useState('');
  const [rescheduleLoading, setRescheduleLoading] = useState(false);
  const [rescheduleMsg, setRescheduleMsg]         = useState('');

  const fetchAll = async () => {
    setLoading(true);
    try {
      const res = await getInterviews();
      const all = res.data?.data || [];
      const found = all.find(iv => iv._id === id);
      setInterview(found || null);

      if (found?.pricing?.cpcFrom) setSelectedCpc({ from: found.pricing.cpcFrom, to: found.pricing.cpcTo || '' });

      if (found && canViewSomeFeedback(role)) {
        try {
          const fbRes = await getFeedbacks(id);
          setFeedbacks(fbRes.data?.data || []);
        } catch { setFeedbacks([]); }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, [id, role, refreshKey]);

  const handleMarkCompleted = async () => {
    try {
      await updateInterviewStatus(id, 'completed');
      triggerRefresh();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed');
    }
  };

  const handleReschedule = async () => {
    if (!newScheduledAt) { setRescheduleMsg('Please select a new date & time.'); return; }
    setRescheduleLoading(true);
    setRescheduleMsg('');
    try {
      await rescheduleInterview(id, newScheduledAt);
      setRescheduleOpen(false);
      setNewScheduledAt('');
      triggerRefresh();
    } catch (err) {
      setRescheduleMsg(err.response?.data?.message || 'Reschedule failed.');
    } finally {
      setRescheduleLoading(false);
    }
  };

  const handleSubmitFeedback = async () => {
    setSubmitting(true);
    setSubmitMsg('');
    try {
      await submitFeedback({
        interviewId: id,          // current interview from useParams
        userId: user?._id,        // logged-in user — auto from auth store
        ratings: feedbackForm.ratings,
      });
      setSubmitted(true);
      setSubmitMsg('Feedback submitted and locked.');
      triggerRefresh();
    } catch (err) {
      setSubmitMsg(err.response?.data?.message || 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  // Super admin confirms CPC range — closes modal, admin can then proceed
  const handleConfirmCpc = async () => {
    if (!selectedCpc.from) { setCpcMsg('Select the start of the CPC range.'); return; }
    if (!selectedCpc.to)   { setCpcMsg('Select the end of the CPC range (can be same as start for a single CPC).'); return; }
    setCpcLoading(true);
    setCpcMsg('');
    try {
      await assignCPC(id, selectedCpc.from, selectedCpc.to);
      setCpcModalOpen(false);
      triggerRefresh();
    } catch (err) {
      setCpcMsg(err.response?.data?.message || 'CPC assignment failed');
    } finally {
      setCpcLoading(false);
    }
  };

  if (loading) return <div className="p-8 text-slate-500 text-sm animate-pulse">Loading...</div>;
  if (!interview) return <div className="p-8 text-red-500 font-medium">Interview not found.</div>;

  const candidateName = (() => {
    const c = interview.candidate;
    if (!c || typeof c === 'string') return c || 'Unknown';
    return `${c.firstName || ''} ${c.lastName || ''}`.trim();
  })();

  const cpcAssigned = interview.pricing?.cpc;
  const myFeedback = feedbacks.find(f =>
    (f.user && String(f.user) === String(user?._id)) ||
    (f.email && f.email === user?.email)
  );
  const isFinalized = interview.status === 'selected' || interview.status === 'finalized';

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/interviews')}
            className="w-9 h-9 flex items-center justify-center rounded-xl border border-slate-200 bg-white shadow-sm hover:bg-slate-50 transition">
            <ChevronLeft size={18} className="text-slate-600" />
          </button>
          <div>
            <h2 className="text-xl font-bold text-slate-800">{candidateName}</h2>
            <div className="flex items-center gap-2 mt-1">
              <Badge status={interview.status} />
              {cpcAssigned && (
                <span className="text-xs font-semibold bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full border border-purple-200">
                  CPC Range: {cpcAssigned}
                </span>
              )}
              {interview.scheduledAt && (
                <span className="text-xs text-slate-500">
                  {new Date(interview.scheduledAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          {interview.status === 'scheduled' && ['super_admin', 'admin'].includes(role) && (
            <button onClick={handleMarkCompleted}
              className="flex items-center gap-1.5 text-sm font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-4 py-2 rounded-xl hover:bg-emerald-100 transition">
              <CheckCircle2 size={15} /> Mark Completed
            </button>
          )}
          {['scheduled', 'cancelled'].includes(interview.status) && ['super_admin', 'admin'].includes(role) && (
            <button onClick={() => { setRescheduleOpen(true); setRescheduleMsg(''); setNewScheduledAt(''); }}
              className="flex items-center gap-1.5 text-sm font-semibold text-blue-700 bg-blue-50 border border-blue-200 px-4 py-2 rounded-xl hover:bg-blue-100 transition">
              <Clock size={15} /> Reschedule
            </button>
          )}
          {/* Super Admin: CPC selection button — only shown when interview completed & CPC not yet set */}
          {interview.status === 'completed' && isSuperAdmin && !cpcAssigned && (
            <button onClick={() => { setCpcModalOpen(true); setCpcMsg(''); }}
              className="text-sm font-semibold text-white bg-purple-600 px-4 py-2 rounded-xl hover:bg-purple-700 transition shadow-sm">
              Select Candidate (Assign CPC)
            </button>
          )}
          {/* Super Admin: CPC already set — show status */}
          {interview.status === 'completed' && isSuperAdmin && cpcAssigned && (
            <span className="flex items-center gap-2 text-sm font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-4 py-2 rounded-xl">
              <CheckCircle2 size={15} /> CPC Assigned — Admin to finalize
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* LEFT column */}
        <div className="flex flex-col gap-4">
          {/* Interview Info */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <h3 className="text-sm font-bold text-slate-700 mb-4 pb-2 border-b border-slate-100">Interview Info</h3>
            <div className="flex flex-col gap-3">
              <InfoRow label="Status"    value={<Badge status={interview.status} />} />
              <InfoRow label="Scheduled" value={interview.scheduledAt ? new Date(interview.scheduledAt).toLocaleString('en-IN') : null} />
              <InfoRow label="Panelists" value={`${interview.judges?.length || 0} assigned`} />
              <InfoRow label="Feedbacks" value={`${interview.feedbacks?.length || 0} received`} />
              {cpcAssigned && <InfoRow label="CPC Range" value={cpcAssigned} />}
              {/* Join Zoom — only active when interview is still scheduled */}
              {interview.zoomJoinUrl && interview.status === 'scheduled' && (
                <a href={interview.zoomJoinUrl} target="_blank" rel="noopener noreferrer"
                  className="mt-1 flex items-center gap-2 text-xs font-semibold text-blue-600 bg-blue-50 px-3 py-2 rounded-lg border border-blue-100 hover:bg-blue-100 transition">
                  <Video size={13} /> Join Zoom
                </a>
              )}
              {interview.zoomJoinUrl && interview.status !== 'scheduled' && (
                <span className="mt-1 flex items-center gap-2 text-xs font-semibold text-slate-400 bg-slate-50 px-3 py-2 rounded-lg border border-slate-100 cursor-not-allowed">
                  <Video size={13} /> Zoom Ended
                </span>
              )}
            </div>
          </div>

          {/* Recording */}
          {canViewRecording(role) ? (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
              <h3 className="text-sm font-bold text-slate-700 mb-3 pb-2 border-b border-slate-100">Recording</h3>
              {interview.zoomRecordingStatus === 'available' && interview.zoomRecordingUrl ? (
                <a href={interview.zoomRecordingUrl} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm font-semibold text-white bg-purple-600 px-4 py-2.5 rounded-xl hover:bg-purple-700 transition">
                  <Video size={15} /> Watch Recording
                </a>
              ) : interview.zoomRecordingStatus === 'deleted' ? (
                <p className="text-slate-400 text-sm italic">Deleted.</p>
              ) : (
                <p className="text-slate-400 text-sm italic">Not yet available.</p>
              )}
            </div>
          ) : (
            <div className="bg-slate-50 rounded-2xl border border-slate-100 p-5 flex items-center gap-2 text-slate-400">
              <EyeOff size={16} /><span className="text-sm">Recording restricted to Admin+</span>
            </div>
          )}
        </div>

        {/* RIGHT column */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          {/* Admin: class config panel — shown when CPC is set and interview is complete */}
          {isAdmin && interview.status === 'completed' && !isFinalized && (
            cpcAssigned ? (
              <AdminClassConfig
                interviewId={id}
                cpcRange={cpcAssigned}
                onSuccess={() => navigate('/teachers')}
              />
            ) : (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 flex items-center gap-3">
                <Clock size={20} className="text-amber-500 shrink-0" />
                <div>
                  <p className="font-semibold text-amber-800 text-sm">Awaiting CPC Assignment</p>
                  <p className="text-xs text-amber-600 mt-0.5">Super Admin must assign CPC for this candidate before you can finalize the class configuration.</p>
                </div>
              </div>
            )
          )}

          {/* Expert/Micro observer/Admin: submit feedback — visible for scheduled AND completed */}
          {canSubmitFeedback(role) && !myFeedback && !submitted && ['scheduled', 'completed'].includes(interview.status) && (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
              <h3 className="text-sm font-bold text-slate-700 mb-4 pb-2 border-b border-slate-100">Submit Evaluation</h3>
              <div className="flex flex-col gap-5">
                <div className="grid grid-cols-2 gap-5">
                  <RatingInput label="Communication" value={feedbackForm.ratings.communication.score}
                    onChange={v => setFeedbackForm(p => ({ ...p, ratings: { ...p.ratings, communication: { ...p.ratings.communication, score: v } } }))} />
                  <RatingInput label="Personality" value={feedbackForm.ratings.personality.score}
                    onChange={v => setFeedbackForm(p => ({ ...p, ratings: { ...p.ratings, personality: { ...p.ratings.personality, score: v } } }))} />
                  <RatingInput label="Subject Depth" value={feedbackForm.ratings.subject.depthRating}
                    onChange={v => setFeedbackForm(p => ({ ...p, ratings: { ...p.ratings, subject: { ...p.ratings.subject, depthRating: v } } }))} />
                  <RatingInput label="Presentation" value={feedbackForm.ratings.presentation.score}
                    onChange={v => setFeedbackForm(p => ({ ...p, ratings: { ...p.ratings, presentation: { ...p.ratings.presentation, score: v } } }))} />
                </div>
                <div className="flex gap-2">
                  <input placeholder="Subject (e.g. Math)" value={feedbackForm.ratings.subject.subject}
                    onChange={e => setFeedbackForm(p => ({ ...p, ratings: { ...p.ratings, subject: { ...p.ratings.subject, subject: e.target.value } } }))}
                    className="flex-1 px-3 py-2 border border-slate-200 rounded-xl text-sm outline-none focus:border-purple-400" />
                  <input placeholder="Class level (e.g. Class 10)" value={feedbackForm.ratings.subject.classLevel}
                    onChange={e => setFeedbackForm(p => ({ ...p, ratings: { ...p.ratings, subject: { ...p.ratings.subject, classLevel: e.target.value } } }))}
                    className="flex-1 px-3 py-2 border border-slate-200 rounded-xl text-sm outline-none focus:border-purple-400" />
                </div>
                <div className="flex gap-3">
                  <div className="flex-1 flex flex-col gap-1">
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Overall Verdict</label>
                    <select value={feedbackForm.ratings.overallRemark.tag}
                      onChange={e => setFeedbackForm(p => ({ ...p, ratings: { ...p.ratings, overallRemark: { ...p.ratings.overallRemark, tag: e.target.value } } }))}
                      className="px-3 py-2 border border-slate-200 rounded-xl text-sm outline-none focus:border-purple-400 bg-white">
                      <option>Excellent</option><option>Okay</option><option>Not Good</option>
                    </select>
                  </div>
                  <div className="flex-1 flex flex-col gap-1">
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Comments</label>
                    <input placeholder="Any remarks..." value={feedbackForm.ratings.overallRemark.comment}
                      onChange={e => setFeedbackForm(p => ({ ...p, ratings: { ...p.ratings, overallRemark: { ...p.ratings.overallRemark, comment: e.target.value } } }))}
                      className="px-3 py-2 border border-slate-200 rounded-xl text-sm outline-none focus:border-purple-400" />
                  </div>
                </div>
                {submitMsg && <p className="text-sm bg-blue-50 border border-blue-100 text-blue-700 px-4 py-3 rounded-xl">{submitMsg}</p>}
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setFeedbackForm({
                        ratings: {
                          communication: { score: 0, comment: '' },
                          subject: { subject: '', classLevel: '', depthRating: 0, comment: '' },
                          personality: { score: 0, comment: '' },
                          presentation: { score: 0, comment: '' },
                          overallRemark: { tag: 'Okay', comment: '' },
                        }
                      });
                      setSubmitMsg('Form cleared. You can fill it again.');
                    }}
                    className="px-4 py-3 border border-slate-200 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-50 transition"
                  >
                    Reset
                  </button>
                  <button onClick={handleSubmitFeedback} disabled={submitting}
                    className="flex-1 bg-purple-600 text-white font-bold py-3 rounded-xl hover:bg-purple-700 disabled:opacity-50 transition text-sm flex items-center justify-center gap-2">
                    <Lock size={14} /> {submitting ? 'Submitting...' : 'Submit & Lock Feedback'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Locked state */}
          {(myFeedback || submitted) && canSubmitFeedback(role) && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 flex items-center gap-3">
              <Lock size={20} className="text-emerald-600" />
              <div>
                <p className="font-semibold text-emerald-800 text-sm">Feedback Submitted & Locked</p>
                {role === 'expert' && <p className="text-xs text-emerald-600 mt-0.5">Experts cannot view feedback after submission.</p>}
              </div>
            </div>
          )}

          {/* Read feedback — admin/super_admin/micro_observer */}
          {canViewSomeFeedback(role) && feedbacks.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
              <h3 className="text-sm font-bold text-slate-700 mb-4 pb-2 border-b border-slate-100">
                Evaluations ({feedbacks.length})
              </h3>
              <div className="flex flex-col gap-3">
                {feedbacks.map((fb, i) => <FeedbackCard key={i} feedback={fb} />)}
              </div>
            </div>
          )}
          {canViewSomeFeedback(role) && feedbacks.length === 0 && (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8 text-center text-slate-400 text-sm">
              No feedback submitted yet.
            </div>
          )}
        </div>
      </div>

      {/* ── Super Admin CPC Range Modal ── */}
      <Modal isOpen={cpcModalOpen} onClose={() => setCpcModalOpen(false)} title="Assign CPC Range" maxWidth="max-w-2xl">
        <div className="flex flex-col gap-5">
          <div className="flex items-center gap-2 bg-purple-50 border border-purple-100 rounded-xl px-4 py-3">
            <span className="text-xs font-bold text-purple-700 bg-purple-200 px-2.5 py-1 rounded-full">Super Admin Only</span>
            <p className="text-sm text-purple-800">
              Select a <strong>CPC range</strong> for <strong>{candidateName}</strong>. Click once for start, click again for end. Admin will see all class codes within the range.
            </p>
          </div>

          <CpcRangePicker value={selectedCpc} onChange={setSelectedCpc} />

          {cpcMsg && (
            <div className="text-sm px-4 py-3 bg-red-50 border border-red-100 text-red-700 rounded-xl">{cpcMsg}</div>
          )}

          <div className="flex gap-2 mt-1">
            <button onClick={handleConfirmCpc} disabled={!selectedCpc.from || !selectedCpc.to || cpcLoading}
              className="flex-1 py-3 bg-purple-600 text-white font-bold rounded-xl hover:bg-purple-700 disabled:opacity-50 transition text-sm">
              {cpcLoading ? 'Assigning...' : selectedCpc.from && selectedCpc.to
                ? `Confirm Range: ${selectedCpc.from} to ${selectedCpc.to}`
                : 'Select a range above'}
            </button>
            <button onClick={() => setCpcModalOpen(false)}
              className="px-4 py-3 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50">
              Cancel
            </button>
          </div>
        </div>
      </Modal>

      {/* ── Reschedule Modal ── */}
      <Modal isOpen={rescheduleOpen} onClose={() => { setRescheduleOpen(false); setRescheduleMsg(''); }} title="Reschedule Interview">
        <div className="flex flex-col gap-4">
          <div className="flex items-start gap-3 bg-blue-50 border border-blue-100 rounded-xl p-3 text-sm text-blue-700">
            <Clock size={15} className="shrink-0 mt-0.5" />
            <span>
              Pick a new date & time for <strong>{candidateName}</strong>'s interview.
              The Zoom meeting will be updated automatically.
            </span>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">New Date & Time <span className="text-red-500">*</span></label>
            <input type="datetime-local" value={newScheduledAt} onChange={e => setNewScheduledAt(e.target.value)}
              className="px-3 py-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:border-blue-400" />
          </div>

          {rescheduleMsg && (
            <p className="text-sm text-red-600 px-1">{rescheduleMsg}</p>
          )}

          <div className="flex gap-2">
            <button onClick={handleReschedule} disabled={rescheduleLoading || !newScheduledAt}
              className="flex-1 bg-blue-600 text-white font-bold py-2.5 rounded-xl hover:bg-blue-700 disabled:opacity-50 transition text-sm flex items-center justify-center gap-2">
              <Clock size={14} />
              {rescheduleLoading ? 'Rescheduling...' : 'Confirm Reschedule'}
            </button>
            <button onClick={() => { setRescheduleOpen(false); setRescheduleMsg(''); }}
              className="px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50">
              Cancel
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
