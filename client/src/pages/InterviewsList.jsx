import React, { useEffect, useState } from 'react';
import { Video, RefreshCw, CheckCircle2, ExternalLink } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { getInterviews, updateInterviewStatus } from '../services/api';
import { Badge } from '../components/common/Badge';
import { useAuthStore } from '../store/authStore';
import { useDataStore } from '../store/dataStore';

export const InterviewsList = () => {
  const { user } = useAuthStore();
  const { refreshKey, triggerRefresh } = useDataStore();
  const location = useLocation();
  const role = user?.role;
  const isAdminOrAbove = ['super_admin', 'admin'].includes(role);

  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);

  const urlStatus = new URLSearchParams(location.search).get('status') || 'all';
  const [statusFilter, setStatusFilter] = useState(urlStatus);
  useEffect(() => { setStatusFilter(urlStatus); }, [urlStatus]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await getInterviews();
      setInterviews(res.data?.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [refreshKey]);

  const handleMarkCompleted = async (id) => {
    try {
      await updateInterviewStatus(id, 'completed');
      triggerRefresh();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update status');
    }
  };

  const candidateName = (iv) => {
    const c = iv.candidate;
    if (!c) return 'Unknown';
    if (typeof c === 'string') return c;
    return `${c.firstName || ''} ${c.lastName || ''}`.trim();
  };

  const filtered = interviews.filter(
    iv => statusFilter === 'all' || iv.status === statusFilter
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Interviews</h2>
          <p className="text-slate-500 text-sm mt-0.5">{filtered.length} of {interviews.length} shown</p>
        </div>
        <button
          onClick={fetchData}
          className="flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-purple-600 px-3 py-2 rounded-lg hover:bg-purple-50 transition border border-slate-200"
        >
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* Status filter pills */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {['all', 'scheduled', 'completed', 'cancelled'].map(s => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition capitalize ${
              statusFilter === s
                ? 'bg-purple-600 text-white border-purple-600'
                : 'bg-white text-slate-600 border-slate-200 hover:border-purple-300'
            }`}
          >
            {s === 'all' ? 'All' : s}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500 text-sm">Loading interviews...</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-sm">No interviews found.</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                <th className="text-left px-5 py-3.5 font-semibold text-slate-600 text-xs uppercase tracking-wide">Candidate</th>
                <th className="text-left px-5 py-3.5 font-semibold text-slate-600 text-xs uppercase tracking-wide">Date & Time</th>
                <th className="text-left px-5 py-3.5 font-semibold text-slate-600 text-xs uppercase tracking-wide">Status</th>
                <th className="text-left px-5 py-3.5 font-semibold text-slate-600 text-xs uppercase tracking-wide">CPC</th>
                <th className="text-left px-5 py-3.5 font-semibold text-slate-600 text-xs uppercase tracking-wide">Recording</th>
                <th className="text-left px-5 py-3.5 font-semibold text-slate-600 text-xs uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((iv) => {
                const isDone = ['completed', 'cancelled'].includes(iv.status);
                return (
                  <tr key={iv._id} className="border-b border-slate-50 hover:bg-purple-50/20 transition-colors">
                    <td className="px-5 py-4 font-medium text-slate-800">{candidateName(iv)}</td>
                    <td className="px-5 py-4 text-slate-600">
                      {iv.scheduledAt
                        ? new Date(iv.scheduledAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })
                        : '—'}
                    </td>
                    <td className="px-5 py-4">
                      <Badge status={iv.status} />
                    </td>
                    <td className="px-5 py-4">
                      {iv.pricing?.cpc ? (
                        <span className="text-xs font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-200">
                          {iv.pricing.cpc}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400 italic">Not set</span>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      {iv.zoomRecordingStatus === 'available' && iv.zoomRecordingUrl ? (
                        <a href={iv.zoomRecordingUrl} target="_blank" rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs font-semibold text-purple-600 bg-purple-50 px-3 py-1.5 rounded-lg border border-purple-100 hover:bg-purple-100 transition">
                          <Video size={13} /> Recording
                        </a>
                      ) : iv.zoomJoinUrl && !isDone ? (
                        /* Only show Join link if interview is still scheduled */
                        <a href={iv.zoomJoinUrl} target="_blank" rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100 hover:bg-blue-100 transition">
                          <Video size={13} /> Join
                        </a>
                      ) : (
                        <span className="text-xs text-slate-400 italic">—</span>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex flex-col gap-1.5">
                        {/* Mark Completed — admin/super_admin only, only when scheduled */}
                        {iv.status === 'scheduled' && isAdminOrAbove && (
                          <button
                            onClick={() => handleMarkCompleted(iv._id)}
                            className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg hover:bg-emerald-100 transition inline-flex items-center gap-1"
                          >
                            <CheckCircle2 size={13} /> Mark Completed
                          </button>
                        )}
                        <Link
                          to={`/interviews/${iv._id}`}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-purple-600 hover:text-purple-800 bg-purple-50 border border-purple-100 px-3 py-1.5 rounded-lg hover:bg-purple-100 transition"
                        >
                          <ExternalLink size={12} /> View Details
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
