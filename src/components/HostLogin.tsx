import React, { useState } from 'react';
import { Lock, Mail, Eye, EyeOff, ShieldCheck, AlertCircle, Building2 } from 'lucide-react';

interface HostLoginProps {
  onLoginSuccess: () => void;
}

const LOCKED_EMAIL = 'dudduelisha7@gmail.com';
const LOCKED_PASSWORD = 'Elisha35@35';

export const HostLogin: React.FC<HostLoginProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    setTimeout(() => {
      const cleanEmail = email.trim();
      const cleanPassword = password;

      if (cleanEmail === LOCKED_EMAIL && cleanPassword === LOCKED_PASSWORD) {
        // Successful login
        localStorage.setItem('hms_host_session_active', 'true');
        localStorage.setItem('hms_host_logged_at', new Date().toISOString());
        setIsLoading(false);
        onLoginSuccess();
      } else {
        setIsLoading(false);
        setError('Invalid host credentials. Access restricted to authorized host only.');
      }
    }, 400);
  };

  const fillAuthorizedCredentials = () => {
    setEmail(LOCKED_EMAIL);
    setPassword(LOCKED_PASSWORD);
    setError(null);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-900 selection:bg-purple-600 selection:text-white">
      {/* Background subtle styling */}
      <div className="absolute inset-0 bg-[radial-gradient(#331c54_1px,transparent_1px)] [background-size:24px_24px] opacity-40 pointer-events-none" />

      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
        {/* Top Header */}
        <div className="bg-[#4a0e4e] text-white p-8 text-center relative">
          <div className="w-14 h-14 bg-white/10 rounded-xl flex items-center justify-center mx-auto mb-3 backdrop-blur-sm border border-white/20">
            <Building2 className="w-8 h-8 text-purple-200" />
          </div>
          <h1 className="text-xl font-bold tracking-tight">Hostel Management Portal</h1>
          <p className="text-xs text-purple-200 mt-1">
            TLNR MEN'S PG & BHAGYA LAKHSMI WOMEN'S PG
          </p>
          <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 bg-white/15 rounded-full text-[11px] font-medium text-purple-100">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-300" />
            <span>Encrypted Host Authentication</span>
          </div>
        </div>

        {/* Login Form */}
        <div className="p-8">
          <div className="mb-6">
            <h2 className="text-lg font-bold text-slate-900">Host Sign In</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Enter authorized administrator credentials to manage properties.
            </p>
          </div>

          {error && (
            <div className="mb-5 p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                Host Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="dudduelisha7@gmail.com"
                  className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-700 focus:bg-white transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                Host Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-700 focus:bg-white transition-all font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 py-2.5 px-4 bg-[#4a0e4e] hover:bg-[#380b3b] text-white text-sm font-semibold rounded-lg shadow-sm transition-all focus:ring-2 focus:ring-purple-700 focus:ring-offset-2 disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Verifying Credentials...</span>
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  <span>Authenticate Host Login</span>
                </>
              )}
            </button>
          </form>

          {/* Locked Credentials Info & One-Click helper */}
          <div className="mt-6 pt-5 border-t border-slate-200">
            <div className="p-3 bg-purple-50/70 border border-purple-200 rounded-lg text-xs text-purple-950">
              <div className="flex items-center justify-between mb-1">
                <span className="font-semibold text-purple-900">Locked Host Credentials:</span>
                <button
                  type="button"
                  onClick={fillAuthorizedCredentials}
                  className="text-[11px] font-semibold text-purple-700 hover:text-purple-900 underline cursor-pointer"
                >
                  Auto-fill
                </button>
              </div>
              <div className="font-mono text-[11px] text-purple-800 space-y-0.5">
                <div>Mail: <span className="font-semibold">dudduelisha7@gmail.com</span></div>
                <div>Pass: <span className="font-semibold">Elisha35@35</span></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
