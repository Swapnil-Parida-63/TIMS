import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, AlertTriangle, Plus, Trash2, Pencil, X, Save } from 'lucide-react';
import {
  getCandidateById, createInterview, reserveInterview, reserveCandidateDirect, getUsers, getInterviews,
  assignCPC, getClassOptions, finalizeTeacher, updateInterviewStatus,
  deleteCandidate, updateCandidate,
} from '../services/api';
import { RESERVE_REASONS, DELETION_REASONS } from '../utils/reasons';
import { Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { MultiSelect } from '../components/common/MultiSelect';
import { useAuthStore } from '../store/authStore';
import { useDataStore } from '../store/dataStore';
import { canSchedule, canEditCandidate } from '../utils/rbac';
import { CPC_MAP } from '../utils/cpcMap';
import clsx from 'clsx';


// ─── Options ─────────────────────────────────────────────────────────────────
const BOARD_OPTIONS    = ['CBSE/IGCSE', 'ICSE', 'State Board of Odisha', 'CHSE', 'SSVM'];
const CLASS_OPTIONS    = ['1st','2nd','3rd','4th','5th','6th','7th','8th','9th','10th','11th','12th'];
const MEDIUM_OPTIONS   = ['English', 'Hindi', 'Odia'];
const LOCATION_OPTIONS = ['BBSR', 'Cuttack', 'Khorda'];

// ─── Sub-components ──────────────────────────────────────────────────────────
const InfoRow = ({ label, value }) => (
  <div className="flex flex-col gap-0.5">
    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">{label}</span>
    <span className="text-sm font-medium text-slate-800">
      {Array.isArray(value)
        ? (value.length > 0 ? value.join(', ') : <span className="text-slate-300">—</span>)
        : (value || <span className="text-slate-300">—</span>)}
    </span>
  </div>
);

const Section = ({ title, children, cols = 2 }) => (
  <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
    <h3 className="text-sm font-bold text-slate-700 mb-4 pb-2 border-b border-slate-100">{title}</h3>
    <div className={`grid grid-cols-1 sm:grid-cols-${cols} gap-4`}>{children}</div>
  </div>
);

// ─── Edit Field Helpers ───────────────────────────────────────────────────────
const EditInput = ({ label, value, onChange, type = 'text', placeholder }) => (
  <div className="flex flex-col gap-1.5">
    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{label}</label>
    <input
      type={type}
      value={value || ''}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder || label}
      className="px-3 py-2 border border-slate-200 rounded-xl text-sm outline-none focus:border-purple-400 text-slate-800"
    />
  </div>
);

const EditMultiSelect = ({ label, options, value, onChange }) => (
  <div className="flex flex-col gap-1.5">
    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{label}</label>
    <MultiSelect options={options} selected={value || []} onChange={onChange} placeholder={`Select ${label}...`} />
  </div>
);

// ─── Default edit form state builder ─────────────────────────────────────────
const buildEditForm = (c) => ({
  // Basic Information
  firstName:               c.firstName || '',
  lastName:                c.lastName || '',
  email:                   c.email || '',
  phone:                   c.phone || '',
  dob:                     c.dob || '',
  currentAddress:          c.currentAddress || '',
  // Family Details
  fatherName:              c.fatherName || '',
  motherName:              c.motherName || '',
  // Academic & Professional
  highestQualification:    c.highestQualification || '',
  technicalQualification:  c.technicalQualification || '',
  specialisation:          c.specialisation || '',
  experience:              c.experience || '',
  institutionalExperience: c.institutionalExperience || '',
  tuitionExperience:       c.tuitionExperience || '',
  // Teaching profile
  boardsToTeach:           c.boardsToTeach || [],
  boardsTaught:            c.boardsTaught || [],
  classesToTeach:          c.classesToTeach || [],
  classesTaught:           c.classesTaught || [],
  subjectToTeach:          c.subjectToTeach || '',
  subjectTaught:           c.subjectTaught || '',
  mediumOfInstruction:     c.mediumOfInstruction || [],
  mediumComfortable:       c.mediumComfortable || '',
  serviceLocation:         c.serviceLocation || [],
});

// ─── Main Component ───────────────────────────────────────────────────────────
export const CandidateDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { refreshKey, triggerRefresh } = useDataStore();

  const [candidate, setCandidate] = useState(null);
  const [loading, setLoading]     = useState(true);
  const [linkedInterview, setLinkedInterview] = useState(null);

  // Modals
  const [scheduleOpen,        setScheduleOpen]        = useState(false);
  const [confirmReserveOpen,  setConfirmReserveOpen]  = useState(false);
  const [cancelInterviewOpen, setCancelInterviewOpen] = useState(false);
  const [deleteCandidateOpen, setDeleteCandidateOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionMsg,     setActionMsg]     = useState('');

  // Reserve reason
  const [reserveReason, setReserveReason] = useState('');
  const [reserveNotes,  setReserveNotes]  = useState('');

  // Deletion reason
  const [deleteReason, setDeleteReason] = useState('');
  const [deleteNotes,  setDeleteNotes]  = useState('');

  // Schedule state
  const [allUsers,               setAllUsers]               = useState([]);
  const [selectedInternalJudges, setSelectedInternalJudges] = useState([]);
  const [externalEmails,         setExternalEmails]         = useState(['']);
  const [scheduledAt,            setScheduledAt]            = useState('');

  // Finalize (class config) state
  const [classOptions,    setClassOptions]    = useState([]);
  const [classCode,       setClassCode]       = useState('');
  const [selectedBoards,  setSelectedBoards]  = useState([]);
  const [selectedClasses, setSelectedClasses] = useState([]);
  const [slots,           setSlots]           = useState('');
  const [finalizeLoading, setFinalizeLoading] = useState(false);
  const [finalizeMsg,     setFinalizeMsg]     = useState('');

  // Edit mode
  const [editMode,   setEditMode]   = useState(false);
  const [editForm,   setEditForm]   = useState({});
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveMsg,     setSaveMsg]     = useState('');

  const isAdmin       = user?.role === 'admin';
  const isSuperAdmin  = user?.role === 'super_admin';
  const canEdit       = canEditCandidate(user?.role);

  // ─── Data Fetch ────────────────────────────────────────────────────────────
  const fetchData = async () => {
    try {
      const [candRes, ivRes] = await Promise.all([getCandidateById(id), getInterviews()]);
      const cand = candRes.data?.data;
      setCandidate(cand);

      const allIvs = ivRes.data?.data || [];
      const linked = allIvs.find(iv => {
        const c = iv.candidate;
        if (!c) return false;
        return typeof c === 'string' ? c === id : c._id === id;
      });
      setLinkedInterview(linked || null);

      if (linked?.pricing?.cpc && isAdmin) {
        try {
          const coRes = await getClassOptions(linked._id);
          const opts = coRes.data?.data || [];
          if (opts.length > 0) {
            setClassOptions(opts);
          } else {
            const cpc = linked.pricing.cpc;
            const section = Object.entries(CPC_MAP).find(([, codes]) => codes[cpc]);
            if (section) setClassOptions(section[1][cpc] || []);
          }
        } catch {
          const cpc = linked.pricing.cpc;
          const section = Object.entries(CPC_MAP).find(([, codes]) => codes[cpc]);
          if (section) setClassOptions(section[1][cpc] || []);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [id, refreshKey]);

  // ─── Edit Handlers ────────────────────────────────────────────────────────
  const startEdit = () => {
    setEditForm(buildEditForm(candidate));
    setSaveMsg('');
    setEditMode(true);
  };

  const setField = (key) => (val) => setEditForm(prev => ({ ...prev, [key]: val }));

  const handleSave = async () => {
    setSaveLoading(true);
    setSaveMsg('');
    try {
      await updateCandidate(id, editForm);
      setEditMode(false);
      triggerRefresh();
      fetchData();
    } catch (err) {
      setSaveMsg(err.response?.data?.message || 'Save failed.');
    } finally {
      setSaveLoading(false);
    }
  };

  // ─── Action Handlers ──────────────────────────────────────────────────────
  const openScheduleModal = async () => {
    setScheduleOpen(true);
    setActionMsg('');
    setSelectedInternalJudges([]);
    setExternalEmails(['']);
    setScheduledAt('');
    try {
      const res = await getUsers();
      setAllUsers((res.data?.data || []).filter(u => u._id !== user?._id));
    } catch { setAllUsers([]); }
  };

  const toggleInternalJudge = (u) =>
    setSelectedInternalJudges(prev =>
      prev.find(j => j._id === u._id)
        ? prev.filter(j => j._id !== u._id)
        : [...prev, { ...u, interviewRole: null }]  // default: no special interview role
    );

  const setJudgeInterviewRole = (userId, interviewRole) =>
    setSelectedInternalJudges(prev =>
      prev.map(j => j._id === userId ? { ...j, interviewRole } : j)
    );

  const handleExternalEmailChange = (idx, val) =>
    setExternalEmails(prev => prev.map((e, i) => i === idx ? val : e));

  const handleSchedule = async () => {
    if (!scheduledAt) { setActionMsg('Please select a date & time.'); return; }
    setActionLoading(true);
    setActionMsg('');
    const judges = [
      ...selectedInternalJudges.map(u => ({
        judgeType: 'internal',
        user: u._id,
        email: u.email,
        interviewRole: u.interviewRole || null,
      })),
      ...externalEmails.filter(e => e.trim()).map(email => ({ judgeType: 'external', email: email.trim() })),
    ];
    try {
      await createInterview({ candidate: id, scheduledAt, judges });
      setScheduleOpen(false);
      triggerRefresh();
    } catch (err) {
      setActionMsg(err.response?.data?.message || 'Failed to schedule interview.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReserve = async () => {
    if (!reserveReason) { setActionMsg('Please select a reserve reason.'); return; }
    setActionLoading(true);
    try {
      if (linkedInterview?._id) {
        await reserveInterview(linkedInterview._id, reserveReason, reserveNotes);
      } else {
        await reserveCandidateDirect(candidate._id, reserveReason, reserveNotes);
      }
      setConfirmReserveOpen(false);
      triggerRefresh();
      navigate('/reports?tab=reserved');
    } catch (err) {
      setActionMsg(err.response?.data?.message || 'Reserve failed.');
      setConfirmReserveOpen(false);
    } finally { setActionLoading(false); }
  };

  const handleCancelInterview = async () => {
    if (!linkedInterview?._id) return;
    setActionLoading(true);
    try {
      await updateInterviewStatus(linkedInterview._id, 'cancelled');
      setCancelInterviewOpen(false);
      triggerRefresh();
    } catch (err) {
      setActionMsg(err.response?.data?.message || 'Failed to cancel.');
      setCancelInterviewOpen(false);
    } finally { setActionLoading(false); }
  };

  const handleDeleteCandidate = async () => {
    if (!deleteReason) { setActionMsg('Please select a deletion reason.'); return; }
    setActionLoading(true);
    try {
      await deleteCandidate(id, deleteReason, deleteNotes);
      setDeleteCandidateOpen(false);
      navigate('/candidates');
    } catch (err) {
      setActionMsg(err.response?.data?.message || 'Delete failed.');
      setDeleteCandidateOpen(false);
    } finally { setActionLoading(false); }
  };

  const handleFinalize = async () => {
    if (!classCode)              { setFinalizeMsg('Select a class code.'); return; }
    if (!slots)                  { setFinalizeMsg('Enter number of slots.'); return; }
    if (selectedBoards.length === 0)  { setFinalizeMsg('Select at least one board.'); return; }
    if (selectedClasses.length === 0) { setFinalizeMsg('Select at least one class grade.'); return; }
    setFinalizeLoading(true);
    setFinalizeMsg('');
    try {
      await finalizeTeacher(linkedInterview._id, { classCode, boards: selectedBoards, classes: selectedClasses, slots: Number(slots) });
      triggerRefresh();
      navigate('/teachers');
    } catch (err) {
      setFinalizeMsg(err.response?.data?.message || 'Finalization failed');
    } finally { setFinalizeLoading(false); }
  };

  if (loading)    return <div className="p-8 text-slate-500 text-sm animate-pulse">Loading profile...</div>;
  if (!candidate) return <div className="p-8 text-red-500 font-medium">Candidate not found.</div>;

  const cpcAssigned    = linkedInterview?.pricing?.cpc;
  const isFinalized    = ['selected', 'loa_sent'].includes(linkedInterview?.status);
  const isReservedOrCancelled = ['reserved', 'cancelled'].includes(linkedInterview?.status) || candidate.status === 'reserved';

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-4 pb-12">

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/candidates')} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 transition">
            <ChevronLeft size={18} />
          </button>
          <div>
            <h2 className="text-xl font-bold text-slate-800">{candidate.firstName} {candidate.lastName}</h2>
            <div className="flex items-center gap-2 mt-1.5">
              <Badge status={candidate.status} />
              {cpcAssigned && (
                <span className="text-xs font-semibold bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full border border-purple-200">
                  CPC: {cpcAssigned}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex gap-2 flex-wrap justify-end">
          {/* Edit button */}
          {canEdit && !editMode && (
            <button onClick={startEdit}
              className="px-4 py-2 text-sm font-semibold bg-white text-slate-700 border border-slate-200 rounded-xl hover:bg-slate-50 transition flex items-center gap-1.5">
              <Pencil size={14} /> Edit
            </button>
          )}
          {['applied', 'reserved'].includes(candidate.status) && canSchedule(user?.role) && (
            <button onClick={openScheduleModal}
              className="px-4 py-2 text-sm font-semibold bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition shadow-sm">
              {candidate.status === 'reserved' ? 'Re-schedule Interview' : 'Schedule Interview'}
            </button>
          )}
          {linkedInterview?.status === 'scheduled' && ['admin', 'super_admin'].includes(user?.role) && (
            <button onClick={() => setCancelInterviewOpen(true)}
              className="px-4 py-2 text-sm font-semibold bg-white text-amber-600 border border-amber-200 rounded-xl hover:bg-amber-50 transition">
              Cancel Interview
            </button>
          )}
          {!isFinalized && !isReservedOrCancelled && ['admin', 'super_admin'].includes(user?.role) && (
            <button onClick={() => setConfirmReserveOpen(true)}
              className="px-4 py-2 text-sm font-semibold bg-white text-orange-600 border border-orange-200 rounded-xl hover:bg-orange-50 transition">
              Reserve
            </button>
          )}
          {['admin', 'super_admin'].includes(user?.role) && (
            <button onClick={() => setDeleteCandidateOpen(true)}
              className="px-4 py-2 text-sm font-semibold bg-red-600 text-white rounded-xl hover:bg-red-700 transition flex items-center gap-1.5">
              <Trash2 size={14} /> Delete
            </button>
          )}
        </div>
      </div>

      {actionMsg && <div className="px-4 py-3 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 text-sm">{actionMsg}</div>}

      {/* ── EDIT MODE ──────────────────────────────────────────────────────── */}
      {editMode ? (
        <div className="flex flex-col gap-4">
          <div className="bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3 flex items-center gap-2 text-amber-700 text-sm font-medium">
            <Pencil size={15} />
            Editing all candidate details — make sure all data is accurate for evaluation.
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex flex-col gap-5">
            {/* Basic Information */}
            <div>
              <h3 className="text-sm font-bold text-slate-700 mb-3 pb-2 border-b border-slate-100">Basic Information</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <EditInput label="First Name"       value={editForm.firstName}      onChange={setField('firstName')} />
                <EditInput label="Last Name"        value={editForm.lastName}       onChange={setField('lastName')} />
                <EditInput label="Email"            value={editForm.email}          onChange={setField('email')} type="email" />
                <EditInput label="Phone"            value={editForm.phone}          onChange={setField('phone')} />
                <EditInput label="Date of Birth"    value={editForm.dob}            onChange={setField('dob')} placeholder="e.g. 15-06-1998" />
                <EditInput label="Current Address"  value={editForm.currentAddress} onChange={setField('currentAddress')} />
              </div>
            </div>

            {/* Family Details */}
            <div>
              <h3 className="text-sm font-bold text-slate-700 mb-3 pb-2 border-b border-slate-100">Family Details</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <EditInput label="Father's Name" value={editForm.fatherName} onChange={setField('fatherName')} />
                <EditInput label="Mother's Name" value={editForm.motherName} onChange={setField('motherName')} />
              </div>
            </div>

            {/* Academic & Professional */}
            <div>
              <h3 className="text-sm font-bold text-slate-700 mb-3 pb-2 border-b border-slate-100">Academic & Professional</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <EditInput label="Highest Qualification"   value={editForm.highestQualification}   onChange={setField('highestQualification')} />
                <EditInput label="Technical Qualification" value={editForm.technicalQualification}  onChange={setField('technicalQualification')} />
                <EditInput label="Specialisation"          value={editForm.specialisation}          onChange={setField('specialisation')} />
                <EditInput label="Teaching Experience"     value={editForm.experience}              onChange={setField('experience')} />
                <EditInput label="Institutional Experience" value={editForm.institutionalExperience} onChange={setField('institutionalExperience')} placeholder="e.g. 2 years at DPS" />
                <EditInput label="Tuition Experience"      value={editForm.tuitionExperience}       onChange={setField('tuitionExperience')} placeholder="e.g. 3 years private" />
              </div>
            </div>

            {/* Teaching Preferences */}
            <div>
              <h3 className="text-sm font-bold text-slate-700 mb-3 pb-2 border-b border-slate-100">Teaching Preferences</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <EditMultiSelect label="Boards to Teach"  options={BOARD_OPTIONS}  value={editForm.boardsToTeach}  onChange={setField('boardsToTeach')} />
                <EditMultiSelect label="Boards Taught"    options={BOARD_OPTIONS}  value={editForm.boardsTaught}   onChange={setField('boardsTaught')} />
                <EditMultiSelect label="Classes to Teach" options={CLASS_OPTIONS}  value={editForm.classesToTeach} onChange={setField('classesToTeach')} />
                <EditMultiSelect label="Classes Taught"   options={CLASS_OPTIONS}  value={editForm.classesTaught}  onChange={setField('classesTaught')} />
                <EditInput label="Subject to Teach" value={editForm.subjectToTeach} onChange={setField('subjectToTeach')} placeholder="e.g. Mathematics" />
                <EditInput label="Subject Taught"   value={editForm.subjectTaught}  onChange={setField('subjectTaught')}  placeholder="e.g. Physics" />
                <EditMultiSelect label="Medium of Instruction" options={MEDIUM_OPTIONS}   value={editForm.mediumOfInstruction} onChange={setField('mediumOfInstruction')} />
                <EditInput      label="Medium Most Comfortable" value={editForm.mediumComfortable}    onChange={setField('mediumComfortable')} placeholder="e.g. English" />
                <EditMultiSelect label="Service Location" options={LOCATION_OPTIONS} value={editForm.serviceLocation} onChange={setField('serviceLocation')} />
              </div>
            </div>
          </div>

          {saveMsg && <p className="text-sm text-red-600 px-1">{saveMsg}</p>}

          <div className="flex gap-3">
            <button onClick={handleSave} disabled={saveLoading}
              className="flex items-center gap-2 px-6 py-2.5 bg-purple-600 text-white font-bold rounded-xl hover:bg-purple-700 disabled:opacity-50 transition text-sm">
              <Save size={15} />
              {saveLoading ? 'Saving...' : 'Save Changes'}
            </button>
            <button onClick={() => { setEditMode(false); setSaveMsg(''); }}
              className="flex items-center gap-2 px-5 py-2.5 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50">
              <X size={15} /> Cancel
            </button>
          </div>
        </div>
      ) : (
        /* ── VIEW MODE ─────────────────────────────────────────────────────── */
        <div className="flex flex-col gap-4">
          <Section title="Basic Information">
            <InfoRow label="Full Name"        value={`${candidate.firstName} ${candidate.lastName}`.trim()} />
            <InfoRow label="Email Address"    value={candidate.email} />
            <InfoRow label="Phone / WhatsApp" value={candidate.phone} />
            <InfoRow label="Date of Birth"    value={candidate.dob} />
            <InfoRow label="Current Address"  value={candidate.currentAddress} />
            <InfoRow label="Status"           value={candidate.status} />
          </Section>

          <Section title="Family Details">
            <InfoRow label="Father's Name" value={candidate.fatherName} />
            <InfoRow label="Mother's Name" value={candidate.motherName} />
          </Section>

          <Section title="Academic & Professional Details">
            <InfoRow label="Highest Qualification"    value={candidate.highestQualification} />
            <InfoRow label="Technical Qualification"  value={candidate.technicalQualification} />
            <InfoRow label="Specialisation (Subject/Stream)" value={candidate.specialisation} />
            <InfoRow label="Teaching Experience"      value={candidate.experience} />
            <InfoRow label="Institutional Experience" value={candidate.institutionalExperience} />
            <InfoRow label="Tuition Experience"       value={candidate.tuitionExperience} />
          </Section>

          <Section title="Teaching Preferences">
            <InfoRow label="Boards to Teach"        value={candidate.boardsToTeach} />
            <InfoRow label="Boards Taught"          value={candidate.boardsTaught} />
            <InfoRow label="Classes to Teach"       value={candidate.classesToTeach} />
            <InfoRow label="Classes Taught"         value={candidate.classesTaught} />
            <InfoRow label="Subject to Teach"       value={candidate.subjectToTeach} />
            <InfoRow label="Subject Taught"         value={candidate.subjectTaught} />
            <InfoRow label="Medium of Instruction"  value={candidate.mediumOfInstruction} />
            <InfoRow label="Medium Most Comfortable" value={candidate.mediumComfortable} />
            <InfoRow label="Service Location"       value={candidate.serviceLocation} />
          </Section>

          {/* ── Super Admin: CPC Assignment ─────────────────────────────────── */}
          {isSuperAdmin && !isFinalized && linkedInterview?.status === 'completed' && !cpcAssigned && (
            <div className="bg-white rounded-2xl border border-purple-100 shadow-sm p-5">
              <h3 className="text-sm font-bold text-slate-700 mb-3">Assign CPC</h3>
              <p className="text-xs text-slate-500">Go to the Interview Detail page to assign a CPC.</p>
            </div>
          )}

          {/* ── Admin: Class Config / Finalize ──────────────────────────────── */}
          {isAdmin && linkedInterview?.status === 'completed' && cpcAssigned && !isFinalized && (
            <div className="bg-white rounded-2xl border border-blue-100 shadow-sm p-5">
              <div className="flex items-center gap-2 mb-4 pb-2 border-b border-slate-100">
                <span className="text-xs font-bold text-blue-700 bg-blue-100 px-2.5 py-1 rounded-full">Admin</span>
                <h3 className="text-sm font-bold text-slate-700">Class Configuration</h3>
                <span className="text-xs text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 ml-auto">
                  CPC: {cpcAssigned} ✓
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
              {finalizeMsg && <p className="mt-3 text-sm px-4 py-3 bg-red-50 border border-red-100 text-red-700 rounded-xl">{finalizeMsg}</p>}
              <button onClick={handleFinalize} disabled={finalizeLoading}
                className="mt-4 w-full py-3 bg-purple-600 text-white font-bold rounded-xl hover:bg-purple-700 disabled:opacity-50 transition text-sm">
                {finalizeLoading ? 'Processing...' : '🎉 Confirm Selection & Send Offer'}
              </button>
            </div>
          )}

          {isFinalized && (
            <div className="px-4 py-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm font-semibold">
              ✅ This candidate has been finalized as a teacher. The offer email has been sent.
            </div>
          )}
        </div>
      )}

      {/* ── Modals ─────────────────────────────────────────────────────────── */}

      {/* Schedule Interview */}
      <Modal isOpen={scheduleOpen} onClose={() => setScheduleOpen(false)} title="Schedule Interview">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Date & Time</label>
            <input type="datetime-local" value={scheduledAt} onChange={e => setScheduledAt(e.target.value)}
              className="px-3 py-2 border border-slate-200 rounded-xl text-sm outline-none focus:border-purple-400" />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-2">Internal Panelists</label>
            <div className="flex flex-col gap-1.5 max-h-48 overflow-y-auto">
              {allUsers.map(u => {
                const isSelected = !!selectedInternalJudges.find(j => j._id === u._id);
                const selectedJ  = selectedInternalJudges.find(j => j._id === u._id);
                return (
                  <div key={u._id} className={clsx(
                    'flex items-center gap-2 px-3 py-2 rounded-lg border transition',
                    isSelected ? 'bg-purple-50 border-purple-200' : 'border-transparent hover:bg-slate-50 hover:border-slate-100'
                  )}>
                    <input type="checkbox" checked={isSelected} onChange={() => toggleInternalJudge(u)}
                      className="accent-purple-600 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <span className="text-sm text-slate-700 font-medium">{u.name || u.email}</span>
                      <span className="text-xs text-slate-400 ml-2">{u.role}</span>
                    </div>
                    {/* Interview role selector — only visible when checked */}
                    {isSelected && (
                      <select
                        value={selectedJ?.interviewRole || ''}
                        onChange={e => setJudgeInterviewRole(u._id, e.target.value || null)}
                        className="text-xs border border-purple-200 bg-white rounded-lg px-2 py-1 outline-none focus:border-purple-400 shrink-0"
                      >
                        <option value="">Panelist</option>
                        <option value="micro_observer">Micro Observer</option>
                        <option value="subject_expert">Subject Expert</option>
                      </select>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-2">External Panelist Emails</label>
            {externalEmails.map((e, i) => (
              <div key={i} className="flex gap-2 mb-2">
                <input type="email" value={e} onChange={ev => handleExternalEmailChange(i, ev.target.value)}
                  placeholder="judge@example.com"
                  className="flex-1 px-3 py-2 border border-slate-200 rounded-xl text-sm outline-none focus:border-purple-400" />
                {i === externalEmails.length - 1 && (
                  <button onClick={() => setExternalEmails(prev => [...prev, ''])}
                    className="p-2 rounded-lg bg-purple-50 text-purple-600 hover:bg-purple-100 transition">
                    <Plus size={16} />
                  </button>
                )}
              </div>
            ))}
          </div>
          {actionMsg && <p className="text-sm text-red-600">{actionMsg}</p>}
          <div className="flex gap-2">
            <button onClick={handleSchedule} disabled={actionLoading || !scheduledAt}
              className="flex-1 bg-purple-600 text-white font-bold py-2.5 rounded-xl hover:bg-purple-700 disabled:opacity-50 transition text-sm">
              {actionLoading ? 'Scheduling...' : 'Confirm & Schedule'}
            </button>
            <button onClick={() => setScheduleOpen(false)}
              className="px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50">
              Cancel
            </button>
          </div>
        </div>
      </Modal>

      {/* Cancel Interview */}
      <Modal isOpen={cancelInterviewOpen} onClose={() => setCancelInterviewOpen(false)} title="Cancel Interview">
        <div className="flex flex-col gap-4">
          <div className="flex items-start gap-3 bg-amber-50 border border-amber-100 rounded-xl p-4">
            <AlertTriangle size={18} className="text-amber-500 shrink-0 mt-0.5" />
            <p className="text-sm text-amber-700">
              Cancel the scheduled interview for <strong>{candidate.firstName} {candidate.lastName}</strong>?
              The candidate will remain in the system.
            </p>
          </div>
          <div className="flex gap-2">
            <button onClick={handleCancelInterview} disabled={actionLoading}
              className="flex-1 bg-amber-600 text-white font-bold py-2.5 rounded-xl hover:bg-amber-700 disabled:opacity-50 transition text-sm">
              {actionLoading ? 'Cancelling...' : 'Yes, Cancel Interview'}
            </button>
            <button onClick={() => setCancelInterviewOpen(false)}
              className="px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50">
              Keep It
            </button>
          </div>
        </div>
      </Modal>

      {/* Reserve Confirmation */}
      <Modal isOpen={confirmReserveOpen} onClose={() => { setConfirmReserveOpen(false); setReserveReason(''); setReserveNotes(''); }} title="Reserve Candidate">
        <div className="flex flex-col gap-4">
          <div className="flex items-start gap-3 bg-orange-50 border border-orange-100 rounded-xl p-3">
            <AlertTriangle size={16} className="text-orange-500 shrink-0 mt-0.5" />
            <p className="text-sm text-orange-700">
              Reserving <strong>{candidate.firstName} {candidate.lastName}</strong>. Their profile will be moved to the Reserved list with the selected reason.
            </p>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Reserve Category <span className="text-red-500">*</span></label>
            <select value={reserveReason} onChange={e => setReserveReason(e.target.value)}
              className="px-3 py-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:border-orange-400 bg-white text-slate-700">
              <option value="">Select a reason...</option>
              {RESERVE_REASONS.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Additional Notes <span className="text-slate-400">(optional)</span></label>
            <textarea value={reserveNotes} onChange={e => setReserveNotes(e.target.value)}
              rows={2} placeholder="Any specific observations..."
              className="px-3 py-2 border border-slate-200 rounded-xl text-sm outline-none focus:border-orange-400 resize-none" />
          </div>

          <div className="flex gap-2">
            <button onClick={handleReserve} disabled={actionLoading || !reserveReason}
              className="flex-1 bg-orange-600 text-white font-bold py-2.5 rounded-xl hover:bg-orange-700 disabled:opacity-50 transition text-sm">
              {actionLoading ? 'Reserving...' : 'Confirm Reserve'}
            </button>
            <button onClick={() => { setConfirmReserveOpen(false); setReserveReason(''); setReserveNotes(''); }}
              className="px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50">
              Cancel
            </button>
          </div>
        </div>
      </Modal>

      {/* Delete Permanently */}
      <Modal isOpen={deleteCandidateOpen} onClose={() => { setDeleteCandidateOpen(false); setDeleteReason(''); setDeleteNotes(''); }} title="Delete Candidate Permanently">
        <div className="flex flex-col gap-4">
          <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl p-3">
            <AlertTriangle size={18} className="text-red-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-red-800 mb-0.5">This action is irreversible.</p>
              <p className="text-sm text-red-700">
                <strong>{candidate.firstName} {candidate.lastName}</strong>'s profile will be permanently erased.
                Only their name, email, phone and deletion reason will be logged.
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Reason for Deletion <span className="text-red-500">*</span></label>
            <select value={deleteReason} onChange={e => setDeleteReason(e.target.value)}
              className="px-3 py-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:border-red-400 bg-white text-slate-700">
              <option value="">Select a reason...</option>
              {DELETION_REASONS.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Additional Notes <span className="text-slate-400">(optional)</span></label>
            <textarea value={deleteNotes} onChange={e => setDeleteNotes(e.target.value)}
              rows={2} placeholder="Any additional context..."
              className="px-3 py-2 border border-slate-200 rounded-xl text-sm outline-none focus:border-red-400 resize-none" />
          </div>

          <div className="flex gap-2">
            <button onClick={handleDeleteCandidate} disabled={actionLoading || !deleteReason}
              className="flex-1 bg-red-600 text-white font-bold py-2.5 rounded-xl hover:bg-red-700 disabled:opacity-50 transition text-sm flex items-center justify-center gap-2">
              <Trash2 size={14} />
              {actionLoading ? 'Deleting...' : 'Yes, Delete Permanently'}
            </button>
            <button onClick={() => { setDeleteCandidateOpen(false); setDeleteReason(''); setDeleteNotes(''); }}
              className="px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50">
              Cancel
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

