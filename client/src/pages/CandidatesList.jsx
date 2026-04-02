import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Search, ChevronRight, RefreshCw, UserPlus, X, AlertCircle,
  CheckCircle2, User, Mail, Phone, BookOpen, MapPin, ChevronDown, ChevronUp, Archive
} from 'lucide-react';
import { getCandidates, createCandidate, reserveCandidateDirect } from '../services/api';
import { Badge } from '../components/common/Badge';
import { MultiSelect } from '../components/common/MultiSelect';
import { useDataStore } from '../store/dataStore';
import { useAuthStore } from '../store/authStore';
import { RESERVE_REASONS } from '../utils/reasons';

// ─── Options ─────────────────────────────────────────────────────────────────
const BOARD_OPTIONS    = ['CBSE/IGCSE', 'ICSE', 'State Board of Odisha', 'CHSE', 'SSVM'];
const CLASS_OPTIONS    = ['1st','2nd','3rd','4th','5th','6th','7th','8th','9th','10th','11th','12th'];
const MEDIUM_OPTIONS   = ['English', 'Hindi', 'Odia'];
const LOCATION_OPTIONS = ['BBSR', 'Cuttack', 'Khorda'];

const EMPTY_FORM = {
  // Identity (required)
  firstName: '', lastName: '', email: '', phone: '',
  // Personal
  dob: '', currentAddress: '', fatherName: '', motherName: '',
  // Academic & Professional
  highestQualification: '', technicalQualification: '',
  specialisation: '', experience: '',
  institutionalExperience: '', tuitionExperience: '',
  // Teaching preferences
  boardsToTeach: [], boardsTaught: [],
  classesToTeach: [], classesTaught: [],
  subjectToTeach: '', subjectTaught: '',
  mediumOfInstruction: [], mediumComfortable: '',
  serviceLocation: [],
};

// ─── Reusable field helpers ───────────────────────────────────────────────────
const Field = ({ label, required, children }) => (
  <div className="flex flex-col gap-1.5">
    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
      {label}{required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
    {children}
  </div>
);

const TextInput = ({ value, onChange, placeholder, type = 'text', required }) => (
  <input
    type={type}
    value={value}
    onChange={e => onChange(e.target.value)}
    placeholder={placeholder}
    required={required}
    className="px-3 py-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100 transition text-slate-800 bg-white"
  />
);

// ─── Collapsible Section ──────────────────────────────────────────────────────
const FormSection = ({ icon: Icon, title, color = 'purple', children, defaultOpen = false }) => {
  const [open, setOpen] = useState(defaultOpen);
  const colors = {
    purple: 'text-purple-600 bg-purple-50 border-purple-100',
    blue:   'text-blue-600 bg-blue-50 border-blue-100',
    amber:  'text-amber-600 bg-amber-50 border-amber-100',
    green:  'text-emerald-600 bg-emerald-50 border-emerald-100',
    rose:   'text-rose-600 bg-rose-50 border-rose-100',
  };
  const cls = colors[color] || colors.purple;
  return (
    <div className="border border-slate-100 rounded-2xl overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className={`w-full flex items-center gap-3 px-5 py-3.5 text-left transition ${open ? cls : 'bg-slate-50 hover:bg-slate-100'}`}
      >
        <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${open ? cls : 'bg-white border border-slate-200'}`}>
          <Icon size={14} className={open ? '' : 'text-slate-400'} />
        </div>
        <span className={`text-sm font-semibold flex-1 ${open ? '' : 'text-slate-600'}`}>{title}</span>
        {open ? <ChevronUp size={15} className="text-slate-400" /> : <ChevronDown size={15} className="text-slate-400" />}
      </button>
      {open && (
        <div className="p-5 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-4 bg-white">
          {children}
        </div>
      )}
    </div>
  );
};

// ─── Add Candidate Modal ──────────────────────────────────────────────────────
const AddCandidateModal = ({ open, onClose, onSuccess }) => {
  const [form, setForm]     = useState(EMPTY_FORM);
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState('');
  const [success, setSuccess] = useState('');

  const set = (key) => (val) => setForm(prev => ({ ...prev, [key]: val }));
  const setStr = (key) => (e) => set(key)(typeof e === 'string' ? e : e.target.value);

  const reset = () => { setForm(EMPTY_FORM); setError(''); setSuccess(''); };

  const handleClose = () => { reset(); onClose(); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.firstName.trim()) { setError('First Name is required.'); return; }
    if (!form.email.trim())     { setError('Email is required.'); return; }
    if (!form.phone.trim())     { setError('Phone number is required.'); return; }
    setLoading(true);
    setError('');
    try {
      const res = await createCandidate({
        ...form,
        firstName: form.firstName.trim(),
        lastName:  form.lastName.trim(),
        email:     form.email.trim().toLowerCase(),
        phone:     form.phone.trim(),
      });
      setSuccess(`✅ ${res.data?.data?.firstName} ${res.data?.data?.lastName || ''} added successfully!`.trim());
      onSuccess?.();
      setTimeout(() => { handleClose(); }, 1800);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create candidate. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      style={{ background: 'rgba(15,15,30,0.75)', backdropFilter: 'blur(6px)' }}
      onClick={e => e.target === e.currentTarget && handleClose()}
    >
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl flex flex-col" style={{ maxHeight: '90vh' }}>

        {/* Header */}
        <div className="flex items-center gap-3 px-6 py-5 border-b border-slate-100 shrink-0">
          <div className="w-10 h-10 rounded-2xl bg-purple-600 flex items-center justify-center shadow-md shadow-purple-300">
            <UserPlus size={18} className="text-white" />
          </div>
          <div className="flex-1">
            <h2 className="text-base font-bold text-slate-800">Add Candidate Manually</h2>
            <p className="text-xs text-slate-400 mt-0.5">Fields marked <span className="text-red-500">*</span> are required</p>
          </div>
          <button onClick={handleClose} className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition">
            <X size={18} />
          </button>
        </div>

        {/* Scrollable body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto flex-1 p-6 space-y-4">

          {/* ── Required: Identity ── */}
          <div className="bg-purple-50 border border-purple-100 rounded-2xl p-5">
            <p className="text-xs font-bold text-purple-600 uppercase tracking-wider mb-4 flex items-center gap-1.5">
              <User size={12} /> Basic Info <span className="text-red-500">(Required)</span>
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="First Name" required>
                <TextInput value={form.firstName} onChange={set('firstName')} placeholder="e.g. Rahul" required />
              </Field>
              <Field label="Last Name">
                <TextInput value={form.lastName} onChange={set('lastName')} placeholder="e.g. Sharma" />
              </Field>
              <Field label="Email Address" required>
                <TextInput type="email" value={form.email} onChange={set('email')} placeholder="candidate@email.com" required />
              </Field>
              <Field label="Phone / WhatsApp" required>
                <TextInput type="tel" value={form.phone} onChange={set('phone')} placeholder="e.g. 9876543210" required />
              </Field>
            </div>
          </div>

          {/* ── Optional Sections (collapsible) ── */}
          <FormSection icon={User} title="Personal Details" color="blue">
            <Field label="Date of Birth">
              <TextInput type="date" value={form.dob} onChange={set('dob')} />
            </Field>
            <Field label="Current Address">
              <TextInput value={form.currentAddress} onChange={set('currentAddress')} placeholder="Full address" />
            </Field>
            <Field label="Father's Name">
              <TextInput value={form.fatherName} onChange={set('fatherName')} placeholder="Father's full name" />
            </Field>
            <Field label="Mother's Name">
              <TextInput value={form.motherName} onChange={set('motherName')} placeholder="Mother's full name" />
            </Field>
          </FormSection>

          <FormSection icon={BookOpen} title="Academic & Professional" color="amber">
            <Field label="Highest Qualification">
              <TextInput value={form.highestQualification} onChange={set('highestQualification')} placeholder="e.g. B.Ed, M.Sc" />
            </Field>
            <Field label="Technical Qualification">
              <TextInput value={form.technicalQualification} onChange={set('technicalQualification')} placeholder="e.g. B.Tech" />
            </Field>
            <Field label="Specialisation">
              <TextInput value={form.specialisation} onChange={set('specialisation')} placeholder="e.g. Mathematics, Science" />
            </Field>
            <Field label="Teaching Experience">
              <TextInput value={form.experience} onChange={set('experience')} placeholder="e.g. 3 years" />
            </Field>
            <Field label="Institutional Experience">
              <TextInput value={form.institutionalExperience} onChange={set('institutionalExperience')} placeholder="e.g. 2 years at DPS" />
            </Field>
            <Field label="Tuition Experience">
              <TextInput value={form.tuitionExperience} onChange={set('tuitionExperience')} placeholder="e.g. 1 year private" />
            </Field>
          </FormSection>

          <FormSection icon={BookOpen} title="Teaching Preferences" color="green">
            <Field label="Boards to Teach">
              <MultiSelect options={BOARD_OPTIONS} selected={form.boardsToTeach} onChange={set('boardsToTeach')} placeholder="Select boards..." />
            </Field>
            <Field label="Boards Already Taught">
              <MultiSelect options={BOARD_OPTIONS} selected={form.boardsTaught} onChange={set('boardsTaught')} placeholder="Select boards..." />
            </Field>
            <Field label="Classes to Teach">
              <MultiSelect options={CLASS_OPTIONS} selected={form.classesToTeach} onChange={set('classesToTeach')} placeholder="Select grades..." />
            </Field>
            <Field label="Classes Already Taught">
              <MultiSelect options={CLASS_OPTIONS} selected={form.classesTaught} onChange={set('classesTaught')} placeholder="Select grades..." />
            </Field>
            <Field label="Subject to Teach">
              <TextInput value={form.subjectToTeach} onChange={set('subjectToTeach')} placeholder="e.g. Mathematics" />
            </Field>
            <Field label="Subject Previously Taught">
              <TextInput value={form.subjectTaught} onChange={set('subjectTaught')} placeholder="e.g. Physics" />
            </Field>
            <Field label="Medium of Instruction">
              <MultiSelect options={MEDIUM_OPTIONS} selected={form.mediumOfInstruction} onChange={set('mediumOfInstruction')} placeholder="Select mediums..." />
            </Field>
            <Field label="Most Comfortable Medium">
              <TextInput value={form.mediumComfortable} onChange={set('mediumComfortable')} placeholder="e.g. English" />
            </Field>
          </FormSection>

          <FormSection icon={MapPin} title="Service Location" color="rose">
            <div className="col-span-2">
              <Field label="Preferred Location(s)">
                <MultiSelect options={LOCATION_OPTIONS} selected={form.serviceLocation} onChange={set('serviceLocation')} placeholder="Select locations..." />
              </Field>
            </div>
          </FormSection>

          {/* Error / Success */}
          {error && (
            <div className="flex items-center gap-2.5 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
              <AlertCircle size={15} className="shrink-0" /> {error}
            </div>
          )}
          {success && (
            <div className="flex items-center gap-2.5 px-4 py-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-sm font-medium">
              <CheckCircle2 size={15} className="shrink-0" /> {success}
            </div>
          )}
        </form>

        {/* Footer */}
        <div className="flex gap-3 px-6 py-4 border-t border-slate-100 shrink-0 bg-slate-50/50">
          <button
            type="button"
            onClick={handleClose}
            className="px-5 py-2.5 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-100 transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || !!success}
            className="flex-1 flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-60 text-white font-bold py-2.5 rounded-xl text-sm transition shadow-sm shadow-purple-300"
          >
            <UserPlus size={15} />
            {loading ? 'Adding Candidate...' : 'Add Candidate'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────
export const CandidatesList = () => {
  const [candidates, setCandidates] = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [search,     setSearch]     = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [addOpen,    setAddOpen]    = useState(false);
  const { refreshKey, triggerRefresh } = useDataStore();
  const { user } = useAuthStore();
  const navigate = useNavigate();

  // Reserve modal state
  const [reserveTarget,  setReserveTarget]  = useState(null); // candidate object
  const [reserveReason,  setReserveReason]  = useState('');
  const [reserveNotes,   setReserveNotes]   = useState('');
  const [reserveLoading, setReserveLoading] = useState(false);
  const [reserveMsg,     setReserveMsg]     = useState('');

  const canAdd    = ['admin', 'super_admin', 'executer'].includes(user?.role);
  const canReserve = ['admin', 'super_admin'].includes(user?.role);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await getCandidates();
      setCandidates(res.data?.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [refreshKey]);

  const handleReserve = async () => {
    if (!reserveReason) { setReserveMsg('Please select a reserve reason.'); return; }
    setReserveLoading(true);
    setReserveMsg('');
    try {
      await reserveCandidateDirect(reserveTarget._id, reserveReason, reserveNotes);
      setReserveTarget(null);
      setReserveReason('');
      setReserveNotes('');
      triggerRefresh();
      fetchData();
      navigate('/reports?tab=reserved');
    } catch (err) {
      setReserveMsg(err.response?.data?.message || 'Reserve failed.');
    } finally {
      setReserveLoading(false);
    }
  };

  const statuses = ['all', 'applied', 'interview scheduled', 'standby', 'selected', 'reserved'];

  const filtered = candidates.filter((c) => {
    const matchSearch = `${c.firstName} ${c.lastName} ${c.email} ${c.phone}`
      .toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || c.status?.toLowerCase() === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Candidates</h2>
          <p className="text-slate-500 text-sm mt-0.5">{candidates.length} total candidates</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchData}
            className="flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-purple-600 px-3 py-2 rounded-lg hover:bg-purple-50 transition border border-slate-200"
          >
            <RefreshCw size={14} /> Refresh
          </button>
          {canAdd && (
            <button
              onClick={() => setAddOpen(true)}
              className="flex items-center gap-2 text-sm font-semibold text-white bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-xl transition shadow-sm shadow-purple-200"
            >
              <UserPlus size={15} /> Add Candidate
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-4">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, email, phone..."
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-sm outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100 bg-white transition"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 border border-slate-200 rounded-xl text-sm outline-none focus:border-purple-400 bg-white capitalize"
        >
          {statuses.map((s) => (
            <option key={s} value={s}>{s === 'all' ? 'All Statuses' : s}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500 text-sm">Loading candidates...</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-sm">
            {candidates.length === 0 ? (
              <div className="flex flex-col items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center">
                  <UserPlus size={22} className="text-slate-300" />
                </div>
                <div>
                  <p className="font-semibold text-slate-500">No candidates yet</p>
                  {canAdd && (
                    <button onClick={() => setAddOpen(true)} className="mt-2 text-purple-600 hover:text-purple-800 font-medium text-sm hover:underline">
                      + Add your first candidate
                    </button>
                  )}
                </div>
              </div>
            ) : (
              'No candidates match your search or filter.'
            )}
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                <th className="text-left px-5 py-3.5 font-semibold text-slate-600 text-xs uppercase tracking-wide">#</th>
                <th className="text-left px-5 py-3.5 font-semibold text-slate-600 text-xs uppercase tracking-wide">Name</th>
                <th className="text-left px-5 py-3.5 font-semibold text-slate-600 text-xs uppercase tracking-wide">Email</th>
                <th className="text-left px-5 py-3.5 font-semibold text-slate-600 text-xs uppercase tracking-wide">Phone</th>
                <th className="text-left px-5 py-3.5 font-semibold text-slate-600 text-xs uppercase tracking-wide">Status</th>
                <th className="px-5 py-3.5"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c, i) => (
                <tr key={c._id} className="border-b border-slate-50 hover:bg-purple-50/30 transition-colors">
                  <td className="px-5 py-4 text-slate-400">{i + 1}</td>
                  <td className="px-5 py-4 font-medium text-slate-800">{c.firstName} {c.lastName}</td>
                  <td className="px-5 py-4 text-slate-600">{c.email}</td>
                  <td className="px-5 py-4 text-slate-600">{c.phone}</td>
                  <td className="px-5 py-4"><Badge status={c.status} /></td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      <Link
                        to={`/candidates/${c._id}`}
                        className="inline-flex items-center gap-1 text-purple-600 hover:text-purple-800 font-medium text-xs hover:underline"
                      >
                        View <ChevronRight size={14} />
                      </Link>
                      {canReserve && !['reserved', 'selected'].includes(c.status) && (
                        <button
                          onClick={() => { setReserveTarget(c); setReserveReason(''); setReserveNotes(''); setReserveMsg(''); }}
                          className="inline-flex items-center gap-1 text-orange-600 hover:text-orange-800 font-medium text-xs hover:underline"
                          title="Reserve this candidate"
                        >
                          <Archive size={12} /> Reserve
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Add Candidate Modal */}
      <AddCandidateModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onSuccess={() => { triggerRefresh(); fetchData(); }}
      />

      {/* Reserve Modal */}
      {reserveTarget && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
          style={{ background: 'rgba(15,15,30,0.75)', backdropFilter: 'blur(6px)' }}
          onClick={e => e.target === e.currentTarget && setReserveTarget(null)}
        >
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md flex flex-col overflow-hidden">
            {/* Header */}
            <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100">
              <div className="w-9 h-9 rounded-xl bg-orange-100 flex items-center justify-center">
                <Archive size={16} className="text-orange-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-bold text-slate-800">Reserve Candidate</h3>
                <p className="text-xs text-slate-400 mt-0.5">{reserveTarget.firstName} {reserveTarget.lastName}</p>
              </div>
              <button onClick={() => setReserveTarget(null)} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition">
                <X size={16} />
              </button>
            </div>

            {/* Body */}
            <div className="p-5 flex flex-col gap-4">
              <div className="flex items-start gap-2.5 bg-orange-50 border border-orange-100 rounded-xl p-3">
                <Archive size={14} className="text-orange-500 shrink-0 mt-0.5" />
                <p className="text-xs text-orange-700">Select the reason for reserving this candidate. They will be moved to the Reserved list.</p>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Reserve Category <span className="text-red-500">*</span></label>
                <select
                  value={reserveReason}
                  onChange={e => setReserveReason(e.target.value)}
                  className="px-3 py-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:border-orange-400 bg-white text-slate-700"
                >
                  <option value="">Select a reason...</option>
                  {RESERVE_REASONS.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Notes <span className="text-slate-400">(optional)</span></label>
                <textarea
                  value={reserveNotes}
                  onChange={e => setReserveNotes(e.target.value)}
                  rows={2}
                  placeholder="Any additional context..."
                  className="px-3 py-2 border border-slate-200 rounded-xl text-sm outline-none focus:border-orange-400 resize-none"
                />
              </div>

              {reserveMsg && (
                <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{reserveMsg}</p>
              )}

              <div className="flex gap-2 mt-1">
                <button
                  onClick={handleReserve}
                  disabled={reserveLoading || !reserveReason}
                  className="flex-1 bg-orange-600 text-white font-bold py-2.5 rounded-xl hover:bg-orange-700 disabled:opacity-50 transition text-sm"
                >
                  {reserveLoading ? 'Reserving...' : 'Confirm Reserve'}
                </button>
                <button
                  onClick={() => setReserveTarget(null)}
                  className="px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
