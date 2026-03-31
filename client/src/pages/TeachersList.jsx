import React, { useEffect, useState } from 'react';
import { RefreshCw, FileText, Trash2, AlertTriangle } from 'lucide-react';
import { getTeachers, getTeacherLoAUrl, deleteTeacher } from '../services/api';
import { useAuthStore } from '../store/authStore';
import { Modal } from '../components/common/Modal';

export const TeachersList = () => {
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState(null); // teacher object to delete
  const [deleting, setDeleting] = useState(false);
  const [deleteMsg, setDeleteMsg] = useState('');
  const { user } = useAuthStore();
  const isAdminOrAbove = ['super_admin', 'admin'].includes(user?.role);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await getTeachers();
      setTeachers(res.data?.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    setDeleteMsg('');
    try {
      await deleteTeacher(deleteTarget._id);
      setDeleteTarget(null);
      fetchData();
    } catch (err) {
      setDeleteMsg(err.response?.data?.message || 'Delete failed.');
    } finally {
      setDeleting(false);
    }
  };

  const teacherName = (t) => {
    const c = t.candidate || {};
    return `${c.firstName || ''} ${c.lastName || ''}`.trim() || 'Unknown';
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Teachers</h2>
          <p className="text-slate-500 text-sm mt-0.5">{teachers.length} finalized teacher{teachers.length !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={fetchData} className="flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-purple-600 px-3 py-2 rounded-lg hover:bg-purple-50 transition border border-slate-200">
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500 text-sm">Loading teachers...</div>
        ) : teachers.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-sm">No teachers finalized yet.</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                <th className="text-left px-5 py-3.5 font-semibold text-slate-600 text-xs uppercase tracking-wide">#</th>
                <th className="text-left px-5 py-3.5 font-semibold text-slate-600 text-xs uppercase tracking-wide">Name</th>
                <th className="text-left px-5 py-3.5 font-semibold text-slate-600 text-xs uppercase tracking-wide">MentR ID</th>
                <th className="text-left px-5 py-3.5 font-semibold text-slate-600 text-xs uppercase tracking-wide">Email</th>
                <th className="text-left px-5 py-3.5 font-semibold text-slate-600 text-xs uppercase tracking-wide">CPC / Grade</th>
                <th className="text-left px-5 py-3.5 font-semibold text-slate-600 text-xs uppercase tracking-wide">Slots</th>
                <th className="text-left px-5 py-3.5 font-semibold text-slate-600 text-xs uppercase tracking-wide">Rate</th>
                <th className="text-left px-5 py-3.5 font-semibold text-slate-600 text-xs uppercase tracking-wide">Added</th>
                <th className="text-left px-5 py-3.5 font-semibold text-slate-600 text-xs uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody>
              {teachers.map((t, i) => {
                const c = t.candidate || {};
                const loaUrl = t.loaPath ? getTeacherLoAUrl(t._id) : null;
                return (
                  <tr key={t._id} className="border-b border-slate-50 hover:bg-purple-50/20 transition-colors">
                    <td className="px-5 py-4 text-slate-400">{i + 1}</td>

                    <td className="px-5 py-4 font-medium text-slate-800">
                      {c.firstName || '—'} {c.lastName || ''}
                    </td>

                    <td className="px-5 py-4">
                      <span className="font-mono text-xs font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded">
                        {t.serialNumber || '—'}
                      </span>
                    </td>

                    <td className="px-5 py-4 text-slate-600">{c.email || '—'}</td>

                    <td className="px-5 py-4">
                      {t.cpc ? (
                        <span className="text-xs font-semibold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-100">
                          {t.cpc}
                        </span>
                      ) : '—'}
                      {t.classCode && (
                        <span className="ml-1 text-xs text-slate-500">{t.classCode}</span>
                      )}
                    </td>

                    <td className="px-5 py-4 text-slate-700">{t.slots ?? '—'}</td>

                    <td className="px-5 py-4 text-slate-700">
                      {t.pricing?.hourlyRate ? `₹${t.pricing.hourlyRate}/hr` : '—'}
                    </td>

                    <td className="px-5 py-4 text-slate-500">
                      {t.createdAt ? new Date(t.createdAt).toLocaleDateString('en-IN') : '—'}
                    </td>

                    {/* Actions column */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        {/* View LoA — admin/super_admin only */}
                        {isAdminOrAbove && (
                          loaUrl ? (
                            <a
                              href={loaUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 bg-blue-50 border border-blue-100 px-2.5 py-1.5 rounded-lg hover:bg-blue-100 transition"
                            >
                              <FileText size={12} /> LoA
                            </a>
                          ) : (
                            <span className="text-xs text-slate-300 italic px-2">No LoA</span>
                          )
                        )}
                        {/* Delete — admin/super_admin */}
                        {isAdminOrAbove && (
                          <button
                            onClick={() => { setDeleteTarget(t); setDeleteMsg(''); }}
                            className="inline-flex items-center gap-1 text-xs font-semibold text-red-600 bg-red-50 border border-red-100 px-2.5 py-1.5 rounded-lg hover:bg-red-100 transition"
                          >
                            <Trash2 size={12} /> Delete
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Delete Teacher Confirmation Modal */}
      <Modal
        isOpen={!!deleteTarget}
        onClose={() => { setDeleteTarget(null); setDeleteMsg(''); }}
        title="Delete Teacher Permanently"
      >
        <div className="flex flex-col gap-4">
          <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl p-4">
            <AlertTriangle size={20} className="text-red-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-red-800 mb-1">This action is irreversible.</p>
              <p className="text-sm text-red-700">
                Permanently remove <strong>{deleteTarget ? teacherName(deleteTarget) : ''}</strong> from the Teachers list?
                Their LoA PDF will be deleted from disk and their candidate profile will be reset to <strong>'applied'</strong>.
              </p>
            </div>
          </div>

          {deleteMsg && (
            <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg border border-red-100">{deleteMsg}</p>
          )}

          <div className="flex gap-2">
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="flex-1 bg-red-600 text-white font-bold py-2.5 rounded-xl hover:bg-red-700 disabled:opacity-50 transition text-sm flex items-center justify-center gap-2"
            >
              <Trash2 size={15} />
              {deleting ? 'Deleting...' : 'Yes, Delete Permanently'}
            </button>
            <button
              onClick={() => { setDeleteTarget(null); setDeleteMsg(''); }}
              className="px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
