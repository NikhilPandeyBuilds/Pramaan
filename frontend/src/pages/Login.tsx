import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import {
  ShieldCheck,
  Lock,
  Mail,
  User as UserIcon,
  Building2,
  MapPin,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
  Sparkles,
  ChevronDown,
  FileCheck2,
  Database,
  Building,
  KeyRound,
  Check
} from 'lucide-react';

export const Login: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'signin' | 'signup'>('signin');

  // Sign In state
  const [loginEmail, setLoginEmail] = useState('officer@aicte.gov.in');
  const [loginPassword, setLoginPassword] = useState('OfficerPass123!');
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  // Sign Up state
  const [fullName, setFullName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [role, setRole] = useState<'INSTITUTION_USER' | 'REGULATORY_OFFICER'>('INSTITUTION_USER');
  const [institutionName, setInstitutionName] = useState('');
  const [institutionCode, setInstitutionCode] = useState('');
  const [state, setState] = useState('Maharashtra');

  // Existing institutions for selection
  const [institutions, setInstitutions] = useState<Array<{ id: string; name: string; code: string; state: string }>>([]);

  // Common state
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [showDemoBox, setShowDemoBox] = useState(true);

  const { login, register } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    api.getInstitutions()
      .then((data) => setInstitutions(data || []))
      .catch(() => {});
  }, []);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      await login(loginEmail, loginPassword);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (signupPassword !== confirmPassword) {
      setError('Passwords do not match. Please verify and try again.');
      return;
    }

    if (signupPassword.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (role === 'INSTITUTION_USER' && !institutionName.trim()) {
      setError('Please provide your College or Institution name.');
      return;
    }

    setSubmitting(true);
    try {
      await register({
        full_name: fullName.trim(),
        email: signupEmail.trim(),
        password: signupPassword,
        role,
        institution_name: role === 'INSTITUTION_USER' ? institutionName.trim() : undefined,
        institution_code: role === 'INSTITUTION_USER' ? institutionCode.trim() : undefined,
        state: role === 'INSTITUTION_USER' ? state : undefined,
      });

      setSuccessMsg('Account created successfully! You are now logged in.');
      setTimeout(() => {
        navigate('/dashboard');
      }, 700);
    } catch (err: any) {
      setError(err.message || 'Account registration failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const fillDemo = (email: string, pass: string) => {
    setLoginEmail(email);
    setLoginPassword(pass);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col font-sans">
      {/* Official Government Tricolor Ribbon */}
      <div className="tricolor-ribbon" />

      {/* Top Bar */}
      <div className="gov-top-header px-4 sm:px-8 py-2 flex items-center justify-between">
        <div className="flex items-center space-x-2 text-white/90">
          <span className="font-bold text-amber-300">भारत सरकार</span>
          <span>|</span>
          <span>Government of India • Ministry of Education</span>
        </div>
        <div className="hidden sm:flex items-center space-x-4 text-[11px] text-white/70">
          <span>AICTE Central Regulation Bureau</span>
          <span>•</span>
          <span className="text-emerald-400 font-semibold flex items-center space-x-1">
            <Lock className="w-3 h-3" />
            <span>Secure 256-Bit SSL</span>
          </span>
        </div>
      </div>

      {/* Main Dual-Column Content */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-8 lg:p-12">
        <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 bg-white rounded-2xl shadow-2xl border border-slate-700/30 overflow-hidden">
          
          {/* Left Column: Official Government Seal & System Trust Pillars */}
          <div className="lg:col-span-5 bg-gradient-to-br from-slate-950 via-blue-950 to-indigo-950 p-8 sm:p-10 text-white flex flex-col justify-between relative border-b lg:border-b-0 lg:border-r border-blue-900/40">
            <div className="space-y-6">
              {/* Emblem */}
              <div className="flex items-center space-x-3.5">
                <div className="w-12 h-12 rounded-xl bg-blue-900/50 border border-amber-400/30 flex items-center justify-center text-amber-400 shadow-lg">
                  <ShieldCheck className="w-7 h-7" />
                </div>
                <div>
                  <h1 className="text-2xl font-black tracking-tight text-white font-sans">
                    प्रमाण <span className="text-amber-400">PRAMAAN</span>
                  </h1>
                  <p className="text-[11px] text-slate-300 font-medium">
                    National Regulatory Intelligence Platform
                  </p>
                </div>
              </div>

              <div className="border-t border-white/10 pt-4">
                <p className="text-xs text-slate-300 leading-relaxed">
                  Official decision-support and deterministic compliance engine for AICTE institutional approval, cross-agency verification, and automated scrutiny under Smart India Hackathon (SIH 26261).
                </p>
              </div>

              {/* Pillars of Integrity */}
              <div className="space-y-3.5 pt-2">
                <div className="flex items-start space-x-3">
                  <div className="w-7 h-7 rounded-lg bg-blue-900/60 border border-blue-700/50 flex items-center justify-center text-amber-300 shrink-0 mt-0.5">
                    <Check className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-xs font-bold text-white">Deterministic Verification</h2>
                    <p className="text-[11px] text-slate-300 leading-snug">
                      Strict rule validation mapped verbatim to AICTE Handbook 2026-27 clauses.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="w-7 h-7 rounded-lg bg-blue-900/60 border border-blue-700/50 flex items-center justify-center text-emerald-400 shrink-0 mt-0.5">
                    <Database className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-xs font-bold text-white">Inter-Agency Live Reconciliation</h2>
                    <p className="text-[11px] text-slate-300 leading-snug">
                      Automated cross-checks against NBA accreditation records and State Board NOCs.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="w-7 h-7 rounded-lg bg-blue-900/60 border border-blue-700/50 flex items-center justify-center text-cyan-400 shrink-0 mt-0.5">
                    <FileCheck2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-xs font-bold text-white">Forensic Document Scrutiny</h2>
                    <p className="text-[11px] text-slate-300 leading-snug">
                      OCR-based evidence extraction, perceptual hashing, and duplicate detection.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Citation */}
            <div className="pt-8 border-t border-white/10 text-[10px] text-slate-400 space-y-1">
              <div className="flex items-center space-x-1.5 text-amber-300/90 font-semibold">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Smart India Hackathon • Problem Statement 26261</span>
              </div>
              <p>All India Council for Technical Education, New Delhi</p>
            </div>
          </div>

          {/* Right Column: Authentication Form Card */}
          <div className="lg:col-span-7 p-6 sm:p-10 flex flex-col justify-center bg-white">
            <div className="max-w-md mx-auto w-full space-y-6">
              
              {/* Segmented Tab Switcher */}
              <div className="flex bg-slate-100 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('signin');
                    setError(null);
                    setSuccessMsg(null);
                  }}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    activeTab === 'signin'
                      ? 'bg-blue-900 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Sign In to Portal
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('signup');
                    setError(null);
                    setSuccessMsg(null);
                  }}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    activeTab === 'signup'
                      ? 'bg-blue-900 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Register New Account
                </button>
              </div>

              {/* Feedback Alerts */}
              {error && (
                <div className="bg-rose-50 border border-rose-200 rounded-xl p-3.5 flex items-start space-x-3 text-rose-800 text-xs">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span className="leading-relaxed font-semibold">{error}</span>
                </div>
              )}

              {successMsg && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3.5 flex items-start space-x-3 text-emerald-800 text-xs">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span className="leading-relaxed font-semibold">{successMsg}</span>
                </div>
              )}

              {/* TAB 1: SIGN IN FORM */}
              {activeTab === 'signin' && (
                <form className="space-y-4" onSubmit={handleLoginSubmit}>
                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1.5">
                      Official Email Address
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <Mail className="h-4 w-4" />
                      </div>
                      <input
                        type="email"
                        required
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        className="block w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:bg-white text-xs font-medium"
                        placeholder="officer@aicte.gov.in or principal@college.edu"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-xs font-bold text-slate-800">
                        Password
                      </label>
                      <span className="text-[11px] text-blue-700 hover:underline cursor-pointer font-semibold">
                        Forgot Password?
                      </span>
                    </div>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <Lock className="h-4 w-4" />
                      </div>
                      <input
                        type={showLoginPassword ? 'text' : 'password'}
                        required
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        className="block w-full pl-9 pr-10 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:bg-white text-xs font-medium"
                        placeholder="Enter your security password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowLoginPassword(!showLoginPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                      >
                        {showLoginPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full flex justify-center items-center space-x-2 py-2.5 px-4 bg-blue-900 hover:bg-blue-800 text-white rounded-lg text-xs font-bold shadow-sm transition disabled:opacity-50 cursor-pointer"
                  >
                    <span>{submitting ? 'Verifying Authorization...' : 'Sign In to Pramaan'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </form>
              )}

              {/* TAB 2: SIGN UP / REGISTRATION FORM */}
              {activeTab === 'signup' && (
                <form className="space-y-3.5" onSubmit={handleSignupSubmit}>
                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1">
                      Account Type / Authorization Role
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setRole('INSTITUTION_USER')}
                        className={`p-2.5 rounded-lg border text-xs font-bold flex items-center justify-center space-x-2 transition cursor-pointer ${
                          role === 'INSTITUTION_USER'
                            ? 'border-blue-700 bg-blue-50 text-blue-900 ring-1 ring-blue-700'
                            : 'border-slate-300 bg-white text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <Building2 className="w-3.5 h-3.5" />
                        <span>College Representative</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setRole('REGULATORY_OFFICER')}
                        className={`p-2.5 rounded-lg border text-xs font-bold flex items-center justify-center space-x-2 transition cursor-pointer ${
                          role === 'REGULATORY_OFFICER'
                            ? 'border-blue-700 bg-blue-50 text-blue-900 ring-1 ring-blue-700'
                            : 'border-slate-300 bg-white text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>Approval Officer</span>
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1">Full Legal Name</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <UserIcon className="h-4 w-4" />
                      </div>
                      <input
                        type="text"
                        required
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="block w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:bg-white text-xs font-medium"
                        placeholder="e.g. Dr. Ramesh Kumar"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1">Official Email Address</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <Mail className="h-4 w-4" />
                      </div>
                      <input
                        type="email"
                        required
                        value={signupEmail}
                        onChange={(e) => setSignupEmail(e.target.value)}
                        className="block w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:bg-white text-xs font-medium"
                        placeholder="official.email@college.edu or gov.in"
                      />
                    </div>
                  </div>

                  {role === 'INSTITUTION_USER' && (
                    <div className="space-y-3 pt-1 border-t border-slate-100">
                      <div>
                        <label className="block text-xs font-bold text-slate-800 mb-1">
                          Select Existing College or Enter New
                        </label>
                        {institutions.length > 0 && (
                          <select
                            onChange={(e) => {
                              const selected = institutions.find((inst) => inst.id === e.target.value);
                              if (selected) {
                                setInstitutionName(selected.name);
                                setInstitutionCode(selected.code);
                                setState(selected.state);
                              }
                            }}
                            className="block w-full px-3 py-2 mb-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium text-slate-700"
                          >
                            <option value="">-- Choose Registered College (Optional Autofill) --</option>
                            {institutions.map((inst) => (
                              <option key={inst.id} value={inst.id}>
                                {inst.name} ({inst.code}) - {inst.state}
                              </option>
                            ))}
                          </select>
                        )}
                        <input
                          type="text"
                          required
                          value={institutionName}
                          onChange={(e) => setInstitutionName(e.target.value)}
                          className="block w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium"
                          placeholder="Official College / Institution Name"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-xs font-bold text-slate-800 mb-1">Permanent AICTE Code</label>
                          <input
                            type="text"
                            value={institutionCode}
                            onChange={(e) => setInstitutionCode(e.target.value)}
                            className="block w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono"
                            placeholder="e.g. 1-109283741"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-800 mb-1">State / UT</label>
                          <select
                            value={state}
                            onChange={(e) => setState(e.target.value)}
                            className="block w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium"
                          >
                            <option value="Maharashtra">Maharashtra</option>
                            <option value="Karnataka">Karnataka</option>
                            <option value="Uttar Pradesh">Uttar Pradesh</option>
                            <option value="Tamil Nadu">Tamil Nadu</option>
                            <option value="Delhi">Delhi</option>
                            <option value="Gujarat">Gujarat</option>
                            <option value="Telangana">Telangana</option>
                            <option value="Other">Other State</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-bold text-slate-800 mb-1">Password</label>
                      <input
                        type={showSignupPassword ? 'text' : 'password'}
                        required
                        value={signupPassword}
                        onChange={(e) => setSignupPassword(e.target.value)}
                        className="block w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                        placeholder="Min 6 characters"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-800 mb-1">Confirm Password</label>
                      <input
                        type={showSignupPassword ? 'text' : 'password'}
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="block w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                        placeholder="Re-type password"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full flex justify-center items-center space-x-2 py-2.5 px-4 bg-blue-900 hover:bg-blue-800 text-white rounded-lg text-xs font-bold shadow-sm transition disabled:opacity-50 cursor-pointer"
                  >
                    <span>{submitting ? 'Creating Profile...' : 'Complete Registration'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </form>
              )}

              {/* Quick Demo Credentials Box for Hackathon Reviewers */}
              <div className="pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowDemoBox(!showDemoBox)}
                  className="w-full flex items-center justify-between text-xs text-slate-500 hover:text-slate-800 py-1 font-semibold cursor-pointer"
                >
                  <span className="flex items-center space-x-1.5 text-blue-900">
                    <KeyRound className="w-3.5 h-3.5" />
                    <span>Quick Demo Accounts (1-Click Fill)</span>
                  </span>
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showDemoBox ? 'rotate-180' : ''}`} />
                </button>

                {showDemoBox && (
                  <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs">
                    <button
                      type="button"
                      onClick={() => fillDemo('officer@aicte.gov.in', 'OfficerPass123!')}
                      className="p-2 rounded-lg bg-white border border-slate-200 hover:border-blue-500 hover:bg-blue-50/50 text-left transition cursor-pointer"
                    >
                      <div className="font-bold text-slate-900 flex items-center justify-between">
                        <span>Approval Officer</span>
                        <span className="text-[9px] bg-blue-100 text-blue-800 px-1.5 py-0.2 rounded font-mono font-bold">Officer</span>
                      </div>
                      <div className="text-[11px] text-slate-500 truncate mt-0.5">officer@aicte.gov.in</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => fillDemo('principal@apex.edu', 'ApexPass123!')}
                      className="p-2 rounded-lg bg-white border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/50 text-left transition cursor-pointer"
                    >
                      <div className="font-bold text-slate-900 flex items-center justify-between">
                        <span>College Representative</span>
                        <span className="text-[9px] bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded font-mono font-bold">College</span>
                      </div>
                      <div className="text-[11px] text-slate-500 truncate mt-0.5">principal@apex.edu</div>
                    </button>
                  </div>
                )}
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
