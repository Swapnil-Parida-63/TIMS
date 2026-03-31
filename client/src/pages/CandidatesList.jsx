import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, ChevronRight, RefreshCw } from 'lucide-react';
import { getCandidates } from '../services/api';
import { Badge } from '../components/common/Badge';
import { useDataStore } from '../store/dataStore';

export const CandidatesList = () => {
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const { refreshKey } = useDataStore();

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

  const statuses = ['all', 'applied', 'interview scheduled', 'standby', 'selected', 'rejected'];

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
        <button onClick={fetchData} className="flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-purple-600 px-3 py-2 rounded-lg hover:bg-purple-50 transition border border-slate-200">
          <RefreshCw size={14} /> Refresh
        </button>
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
          <div className="p-12 text-center text-slate-400 text-sm">No candidates found.</div>
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
                    <Link
                      to={`/candidates/${c._id}`}
                      className="inline-flex items-center gap-1 text-purple-600 hover:text-purple-800 font-medium text-xs hover:underline"
                    >
                      View <ChevronRight size={14} />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
