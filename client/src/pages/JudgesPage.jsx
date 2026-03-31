import React, { useEffect, useState } from 'react';
import { UserPlus, RefreshCw, Shield, ChevronDown, Trash2, AlertTriangle } from 'lucide-react';
import { getUsers, createUser, updateUserRole, deleteUser } from '../services/api';
import { useAuthStore } from '../store/authStore';
import { canManageJudges, canViewJudges, ROLE_LABELS, ROLE_COLORS, ROLES } from '../utils/rbac';
import { Modal } from '../components/common/Modal';
import clsx from 'clsx';

const RoleBadge = ({ role }) => (
  <span className={clsx(
    'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border',
    ROLE_COLORS[role] || 'bg-slate-100 text-slate-600 border-slate-200'
  )}>
    {ROLE_LABELS[role] || role}
  </span>
);

export const JudgesPage = () => {
  const { user } = useAuthStore();
  const role = user?.role;

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [actionMsg, setActionMsg] = useState('');
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    name: '', email: '', password: '', role: 'expert',
  });

  if (!canViewJudges(role)) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3 text-slate-500">
        <Shield size={40} className="text-slate-300" />
        <p className="font-semibold">Access Denied</p>
        <p className="text-sm">You don't have permission to view this page.</p>
      </div>
    );
  }

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await getUsers();
      setUsers(res.data?.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleRoleChange = async (userId, newRole) => {
    if (!canManageJudges(role)) return;
    try {
      await updateUserRole(userId, newRole);
      setUsers(prev => prev.map(u => u._id === userId ? { ...u, role: newRole } : u));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update role');
    }
  };

  const handleCreate = async () => {
    setSaving(true);
    setActionMsg('');
    try {
      await createUser(form);
      setActionMsg('');
      setAddOpen(false);
      setForm({ name: '', email: '', password: '', role: 'expert' });
      fetchData();
    } catch (err) {
      setActionMsg(err.response?.data?.message || 'Failed to create user');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteUser(deleteTarget._id);
      setDeleteTarget(null);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete user');
    }
  };

  // Only show judge-relevant roles (not super_admin in this list view — admins see all)
  const judgeUsers = users.filter(u => ['expert', 'micro_observer', 'admin'].includes(u.role));
  const superAdmins = users.filter(u => u.role === 'super_admin');

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Judge Management</h2>
          <p className="text-slate-500 text-sm mt-0.5">
            {judgeUsers.length} evaluators in system
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={fetchData}
            className="flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-purple-600 px-3 py-2 rounded-lg hover:bg-purple-50 transition border border-slate-200"
          >
            <RefreshCw size={14} /> Refresh
          </button>
          {canManageJudges(role) && (
            <button
              onClick={() => { setAddOpen(true); setActionMsg(''); }}
              className="flex items-center gap-2 text-sm font-semibold text-white bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-lg transition shadow-sm shadow-purple-500/20"
            >
              <UserPlus size={15} /> Add Evaluator
            </button>
          )}
        </div>
      </div>

      {/* Role Hierarchy Info Banner */}
      <div className="mb-5 flex flex-wrap gap-2 items-center bg-purple-50 border border-purple-100 rounded-xl px-4 py-3">
        <Shield size={15} className="text-purple-600 shrink-0" />
        <span className="text-xs font-semibold text-purple-700">Role Hierarchy:</span>
        {[ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.MICRO_OBSERVER, ROLES.EXPERT].map((r, i, arr) => (
          <React.Fragment key={r}>
            <RoleBadge role={r} />
            {i < arr.length - 1 && <span className="text-purple-400 text-xs">›</span>}
          </React.Fragment>
        ))}
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500 text-sm">Loading users...</div>
        ) : users.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-sm">No users found.</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                <th className="text-left px-5 py-3.5 font-semibold text-slate-600 text-xs uppercase tracking-wide">#</th>
                <th className="text-left px-5 py-3.5 font-semibold text-slate-600 text-xs uppercase tracking-wide">Name</th>
                <th className="text-left px-5 py-3.5 font-semibold text-slate-600 text-xs uppercase tracking-wide">Email</th>
                <th className="text-left px-5 py-3.5 font-semibold text-slate-600 text-xs uppercase tracking-wide">Role</th>
                <th className="text-left px-5 py-3.5 font-semibold text-slate-600 text-xs uppercase tracking-wide">Added</th>
                {canManageJudges(role) && (
                  <th className="text-left px-5 py-3.5 font-semibold text-slate-600 text-xs uppercase tracking-wide">Actions</th>
                )}
              </tr>
            </thead>
            <tbody>
              {users.map((u, i) => (
                <tr key={u._id} className="border-b border-slate-50 hover:bg-purple-50/20 transition-colors">
                  <td className="px-5 py-4 text-slate-400">{i + 1}</td>
                  <td className="px-5 py-4 font-medium text-slate-800">{u.name || '—'}</td>
                  <td className="px-5 py-4 text-slate-600">{u.email}</td>
                  <td className="px-5 py-4">
                    {canManageJudges(role) && u.role !== 'super_admin' ? (
                      <select
                        value={u.role}
                        onChange={(e) => handleRoleChange(u._id, e.target.value)}
                        className={clsx(
                          'text-xs font-semibold px-2.5 py-1 rounded-full border outline-none cursor-pointer',
                          ROLE_COLORS[u.role]
                        )}
                      >
                        <option value="expert">Expert</option>
                        <option value="micro_observer">Micro Observer</option>
                        <option value="admin">Admin</option>
                      </select>
                    ) : (
                      <RoleBadge role={u.role} />
                    )}
                  </td>
                  <td className="px-5 py-4 text-slate-500 text-xs">
                    {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '—'}
                  </td>
                  {canManageJudges(role) && (
                    <td className="px-5 py-4">
                      {u.role !== 'super_admin' && u._id !== user?._id && (
                        <button
                          onClick={() => setDeleteTarget(u)}
                          className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
                          title="Remove user"
                        >
                          <Trash2 size={15} />
                        </button>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Add User Modal */}
      <Modal isOpen={addOpen} onClose={() => setAddOpen(false)} title="Add Evaluator">
        <div className="flex flex-col gap-4">
          <p className="text-sm text-slate-500">Create a new evaluator account. They can log in using these credentials.</p>

          {[
            { label: 'Full Name', key: 'name', type: 'text', placeholder: 'e.g. Dr. Ramesh Kumar' },
            { label: 'Email Address', key: 'email', type: 'email', placeholder: 'judge@thementr.com' },
            { label: 'Password', key: 'password', type: 'password', placeholder: 'Min 8 characters' },
          ].map(({ label, key, type, placeholder }) => (
            <div key={key} className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-slate-600">{label}</label>
              <input
                type={type}
                placeholder={placeholder}
                value={form[key]}
                onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                className="px-4 py-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100 transition"
              />
            </div>
          ))}

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-slate-600">Assign Role</label>
            <select
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
              className="px-4 py-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:border-purple-400 bg-white"
            >
              <option value="expert">Expert (lowest — submit only)</option>
              <option value="micro_observer">Micro Observer (can view expert feedback)</option>
              <option value="admin">Admin (full read, no finalize)</option>
            </select>
          </div>

          {actionMsg && (
            <div className="bg-red-50 border border-red-100 text-red-700 px-4 py-3 rounded-xl text-sm">{actionMsg}</div>
          )}

          <div className="flex gap-2 mt-1">
            <button
              onClick={handleCreate}
              disabled={saving || !form.name || !form.email}
              className="flex-1 bg-purple-600 text-white font-bold py-2.5 rounded-xl hover:bg-purple-700 disabled:opacity-50 transition text-sm"
            >
              {saving ? 'Creating...' : 'Create Evaluator'}
            </button>
            <button
              onClick={() => setAddOpen(false)}
              className="px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirm Modal */}
      <Modal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Remove Evaluator">
        <div className="flex flex-col gap-4">
          <div className="flex items-start gap-3 bg-red-50 border border-red-100 rounded-xl p-4">
            <AlertTriangle size={18} className="text-red-500 shrink-0 mt-0.5" />
            <p className="text-sm text-red-700">
              Remove <strong>{deleteTarget?.name || deleteTarget?.email}</strong>?
              Their account will be permanently deleted.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleDelete}
              className="flex-1 bg-red-600 text-white font-bold py-2.5 rounded-xl hover:bg-red-700 transition text-sm"
            >
              Yes, Remove
            </button>
            <button
              onClick={() => setDeleteTarget(null)}
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
