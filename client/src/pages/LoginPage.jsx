import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGoogleLogin } from '@react-oauth/google';
import { login, googleLogin } from '../services/api';
import { useAuthStore } from '../store/authStore';
import { UserCircle } from 'lucide-react';

// Google "G" SVG icon
const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5" xmlns="http://www.w3.org/2000/svg">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

export const LoginPage = () => {
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);

  // Password login state
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);

  // Shared success handler
  const handleAuthSuccess = ({ token, user }) => {
    setAuth(user, token);
    navigate('/');
  };

  // Password login
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await login(form);
      if (res.data?.success) {
        handleAuthSuccess(res.data.data);
      } else {
        setError(res.data?.message || 'Login failed');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  // Google OAuth — gets credential (ID token) from Google, sends to backend
  const handleGoogleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setGoogleLoading(true);
      setError('');
      try {
        // useGoogleLogin with flow='auth-code' gives access_token
        // We need to use GoogleLogin component for id_token instead
        // This path won't be reached — see GoogleLogin below
      } catch (err) {
        setError(err.response?.data?.message || 'Google login failed');
      } finally {
        setGoogleLoading(false);
      }
    },
    onError: () => setError('Google sign-in was cancelled or failed.'),
  });

  // Backend call after Google credential received
  const handleGoogleCredential = async (credential) => {
    setGoogleLoading(true);
    setError('');
    try {
      const res = await googleLogin(credential);
      if (res.data?.success) {
        handleAuthSuccess(res.data.data);
      } else {
        setError(res.data?.message || 'Google login failed');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Access denied. Your Google account is not registered.');
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/30 to-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-purple-600 flex items-center justify-center shadow-lg shadow-purple-500/30 mb-4">
            <UserCircle size={32} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800">TheMentR</h1>
          <p className="text-slate-500 text-sm mt-1">Admin & Evaluator Panel</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 flex flex-col gap-4">
          <h2 className="text-lg font-bold text-slate-800 mb-1 text-center">Sign In</h2>
          <p className="text-xs text-slate-400 text-center -mt-2">Access is restricted to registered users only</p>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">
              {error}
            </div>
          )}

          {/* ── Google Sign-In Button (primary) ── */}
          <div id="google-signin-wrapper">
            {/* We use the raw GoogleLogin component from @react-oauth/google
                which renders Google's official button and returns an id_token credential */}
            <GoogleSignInButton
              onSuccess={handleGoogleCredential}
              onError={() => setError('Google sign-in failed. Try again.')}
              loading={googleLoading}
            />
          </div>

          {/* ── Divider ── */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-slate-100" />
            <span className="text-xs text-slate-400 font-medium">or</span>
            <div className="flex-1 h-px bg-slate-100" />
          </div>

          {/* ── Password login toggle ── */}
          {!showPasswordForm ? (
            <button
              onClick={() => setShowPasswordForm(true)}
              className="text-xs text-slate-500 hover:text-purple-600 text-center transition underline underline-offset-2"
            >
              Sign in with email & password
            </button>
          ) : (
            <form onSubmit={handlePasswordSubmit} className="flex flex-col gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-slate-600">Email</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="admin@thementr.com"
                  required
                  className="px-4 py-2.5 border border-slate-200 rounded-xl outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100 transition text-sm"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-slate-600">Password</label>
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="••••••••"
                  required
                  className="px-4 py-2.5 border border-slate-200 rounded-xl outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100 transition text-sm"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-purple-600 hover:bg-purple-700 disabled:opacity-60 text-white font-bold py-2.5 rounded-xl transition shadow-md shadow-purple-500/20 text-sm"
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>
          )}
        </div>

        <p className="text-center text-xs text-slate-400 mt-4">
          Don't have access? Contact your super admin.
        </p>
      </div>
    </div>
  );
};

// Separate component so it can import GoogleLogin cleanly
import { GoogleLogin } from '@react-oauth/google';

const GoogleSignInButton = ({ onSuccess, onError, loading }) => {
  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 w-full border border-slate-200 rounded-xl py-2.5 bg-slate-50 text-sm text-slate-400">
        <div className="w-4 h-4 border-2 border-slate-300 border-t-purple-500 rounded-full animate-spin" />
        Verifying...
      </div>
    );
  }

  return (
    <div className="flex justify-center">
      <GoogleLogin
        onSuccess={(credentialResponse) => {
          if (credentialResponse.credential) {
            onSuccess(credentialResponse.credential);
          } else {
            onError();
          }
        }}
        onError={onError}
        theme="outline"
        size="large"
        width="320"
        text="signin_with"
        shape="rectangular"
        logo_alignment="left"
      />
    </div>
  );
};
