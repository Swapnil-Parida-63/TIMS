import React, { useState } from 'react';
import { CheckCircle2, XCircle, Loader2, Wifi, Mail, ShieldCheck, Server } from 'lucide-react';
import { testZoomConnection } from '../services/api';
import { useAuthStore } from '../store/authStore';

const StatusBadge = ({ state }) => {
  if (state === 'idle') return null;
  if (state === 'loading') return (
    <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-full">
      <Loader2 size={13} className="animate-spin" /> Testing...
    </span>
  );
  if (state === 'ok') return (
    <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-full">
      <CheckCircle2 size={13} /> Connected
    </span>
  );
  return (
    <span className="flex items-center gap-1.5 text-xs font-semibold text-red-700 bg-red-50 border border-red-200 px-3 py-1.5 rounded-full">
      <XCircle size={13} /> Failed
    </span>
  );
};

const ConfigRow = ({ label, envKey, masked }) => (
  <div className="flex items-center justify-between py-2.5 border-b border-slate-50 last:border-0">
    <span className="text-sm font-medium text-slate-600">{label}</span>
    <code className="text-xs text-slate-400 bg-slate-50 px-2 py-1 rounded-lg font-mono">{envKey}&nbsp;<span className="text-slate-300">({masked ? 'hidden' : 'visible in .env'})</span></code>
  </div>
);

export const SettingsPage = () => {
  const { user } = useAuthStore();
  const [zoomState, setZoomState] = useState('idle');
  const [zoomMsg, setZoomMsg] = useState('');

  const handleTestZoom = async () => {
    setZoomState('loading');
    setZoomMsg('');
    try {
      const res = await testZoomConnection();
      setZoomState('ok');
      setZoomMsg(res.data?.message || 'Connection successful');
    } catch (err) {
      setZoomState('error');
      const detail = err.response?.data?.detail;
      if (detail?.reason) {
        setZoomMsg(`Zoom error: ${detail.reason}`);
      } else if (typeof detail === 'string') {
        setZoomMsg(detail);
      } else {
        setZoomMsg(err.response?.data?.message || 'Could not connect to Zoom API');
      }
    }
  };

  const isSuperAdmin = user?.role === 'super_admin';

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-slate-800">Settings</h2>
        <p className="text-sm text-slate-500 mt-0.5">System configuration and integration status</p>
      </div>

      <div className="flex flex-col gap-5">
        {/* Zoom Integration */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center">
                <Wifi size={18} className="text-blue-600" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-800">Zoom Integration</h3>
                <p className="text-xs text-slate-400">Server-to-Server OAuth App</p>
              </div>
            </div>
            <StatusBadge state={zoomState} />
          </div>

          <div className="flex flex-col gap-1.5 mb-4">
            <ConfigRow label="Account ID" envKey="ZOOM_ACCOUNT_ID" masked />
            <ConfigRow label="Client ID" envKey="ZOOM_CLIENT_ID" masked />
            <ConfigRow label="Client Secret" envKey="ZOOM_CLIENT_SECRET" masked />
          </div>

          {zoomMsg && (
            <div className={`mb-3 px-4 py-3 rounded-xl text-sm border ${
              zoomState === 'ok'
                ? 'bg-emerald-50 border-emerald-100 text-emerald-700'
                : 'bg-red-50 border-red-100 text-red-700'
            }`}>
              {zoomMsg}
            </div>
          )}

          <div className="flex items-center gap-3">
            <button
              onClick={handleTestZoom}
              disabled={zoomState === 'loading'}
              className="px-4 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 disabled:opacity-50 transition flex items-center gap-2"
            >
              {zoomState === 'loading' ? <Loader2 size={15} className="animate-spin" /> : <Wifi size={15} />}
              Test Zoom Connection
            </button>
            <p className="text-xs text-slate-400">
              Verifies your Zoom Server-to-Server OAuth credentials without creating a meeting
            </p>
          </div>
        </div>

        {/* Email */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <div className="flex items-center gap-2.5 mb-4 pb-3 border-b border-slate-100">
            <div className="w-9 h-9 rounded-xl bg-purple-50 flex items-center justify-center">
              <Mail size={18} className="text-purple-600" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800">Email (SMTP)</h3>
              <p className="text-xs text-slate-400">Gmail App Password required</p>
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <ConfigRow label="Sender Email" envKey="EMAIL_USER" />
            <ConfigRow label="App Password" envKey="EMAIL_PASS" masked />
          </div>
          <div className="mt-3 p-3 bg-amber-50 border border-amber-100 rounded-xl text-xs text-amber-700">
            <strong>Note:</strong> Must use a Gmail App Password — not your regular Google password.
            Generate one at <a href="https://myaccount.google.com/apppasswords" target="_blank" rel="noopener noreferrer" className="underline font-semibold">myaccount.google.com/apppasswords</a>
          </div>
        </div>

        {/* Auth */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <div className="flex items-center gap-2.5 mb-4 pb-3 border-b border-slate-100">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center">
              <ShieldCheck size={18} className="text-emerald-600" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800">Authentication</h3>
              <p className="text-xs text-slate-400">JWT configuration</p>
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <ConfigRow label="JWT Secret" envKey="JWT_SECRET" masked />
          </div>
        </div>

        {/* System */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <div className="flex items-center gap-2.5 mb-4 pb-3 border-b border-slate-100">
            <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center">
              <Server size={18} className="text-slate-600" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800">Your Account</h3>
              <p className="text-xs text-slate-400">Current session</p>
            </div>
          </div>
          <div className="flex flex-col gap-3 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-500">Logged in as</span>
              <span className="font-semibold text-slate-800">{user?.name || user?.email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Role</span>
              <span className="font-bold capitalize text-purple-700">{user?.role?.replace('_', ' ')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Email</span>
              <span className="font-medium text-slate-700">{user?.email}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
