import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, Lock, Mail, ArrowRight, AlertCircle, Sparkles } from 'lucide-react';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('officer@aicte.gov.in');
  const [password, setPassword] = useState('OfficerPass123!');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Login failed. Please verify credentials.');
    } finally {
      setSubmitting(false);
    }
  };

  const setDemoCredentials = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex w-14 h-14 rounded-2xl bg-blue-600 items-center justify-center shadow-lg shadow-blue-500/30 mb-4">
          <ShieldCheck className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-3xl font-extrabold text-white tracking-tight">NiyamAI</h2>
        <p className="mt-1 text-sm text-slate-400">
          AICTE Regulatory Intelligence & Compliance Platform
        </p>
        <span className="inline-block mt-2 text-xs bg-slate-800 text-blue-400 px-3 py-1 rounded-full border border-slate-700 font-mono">
          SIH Problem Statement 26261
        </span>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-slate-800/90 py-8 px-6 shadow-2xl rounded-2xl border border-slate-700 sm:px-10">
          {error && (
            <div className="mb-6 bg-red-950/60 border border-red-800/80 rounded-lg p-3.5 flex items-start space-x-3 text-red-200 text-sm">
              <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form className="space-y-5" onSubmit={handleLogin}>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                Official Email / Portal ID
              </label>
              <div className="mt-1.5 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-4 w-4 text-slate-400" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  placeholder="name@aicte.gov.in"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                Password
              </label>
              <div className="mt-1.5 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-4 w-4 text-slate-400" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full flex justify-center items-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition disabled:opacity-50"
            >
              {submitting ? (
                <span>Authenticating...</span>
              ) : (
                <>
                  <span>Sign In to Regulatory Portal</span>
                  <ArrowRight className="ml-2 w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Demonstration Quick-Fill Pills */}
          <div className="mt-8 pt-6 border-t border-slate-700/80">
            <div className="flex items-center space-x-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
              <Sparkles className="w-3.5 h-3.5 text-blue-400" />
              <span>Demo Personas (One-Click Fill)</span>
            </div>
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => setDemoCredentials('officer@aicte.gov.in', 'OfficerPass123!')}
                className="w-full text-left px-3 py-2 rounded-lg bg-slate-900/80 hover:bg-slate-750 border border-slate-700/80 hover:border-blue-500 text-xs transition flex justify-between items-center group"
              >
                <div>
                  <span className="font-semibold text-slate-200 group-hover:text-blue-400">Regional Approval Officer</span>
                  <p className="text-[11px] text-slate-400">officer@aicte.gov.in</p>
                </div>
                <span className="text-[10px] bg-blue-900/50 text-blue-300 px-2 py-0.5 rounded font-mono border border-blue-700/50">Select</span>
              </button>

              <button
                type="button"
                onClick={() => setDemoCredentials('institution@demo.ac.in', 'DemoPass123!')}
                className="w-full text-left px-3 py-2 rounded-lg bg-slate-900/80 hover:bg-slate-750 border border-slate-700/80 hover:border-emerald-500 text-xs transition flex justify-between items-center group"
              >
                <div>
                  <span className="font-semibold text-slate-200 group-hover:text-emerald-400">Institution Representative</span>
                  <p className="text-[11px] text-slate-400">institution@demo.ac.in (Apex Inst.)</p>
                </div>
                <span className="text-[10px] bg-emerald-900/50 text-emerald-300 px-2 py-0.5 rounded font-mono border border-emerald-700/50">Select</span>
              </button>

              <button
                type="button"
                onClick={() => setDemoCredentials('admin@aicte.gov.in', 'AdminPass123!')}
                className="w-full text-left px-3 py-2 rounded-lg bg-slate-900/80 hover:bg-slate-750 border border-slate-700/80 hover:border-purple-500 text-xs transition flex justify-between items-center group"
              >
                <div>
                  <span className="font-semibold text-slate-200 group-hover:text-purple-400">Rule Manager / Admin</span>
                  <p className="text-[11px] text-slate-400">admin@aicte.gov.in</p>
                </div>
                <span className="text-[10px] bg-purple-900/50 text-purple-300 px-2 py-0.5 rounded font-mono border border-purple-700/50">Select</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
