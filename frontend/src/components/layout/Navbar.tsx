import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  ShieldCheck,
  LogOut,
  Building2,
  LayoutDashboard,
  FileText,
  CheckCircle2,
  BookOpen,
  History,
  PlusCircle,
  Lock,
  PhoneCall,
  Calendar,
  Sparkles
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, logout, isInstitution } = useAuth();

  const getRoleLabel = (role?: string) => {
    switch (role) {
      case 'ADMIN':
        return { label: 'Rules Administrator', bg: 'bg-purple-100 text-purple-800 border-purple-300' };
      case 'REGULATORY_OFFICER':
        return { label: 'Approval Officer', bg: 'bg-blue-100 text-blue-800 border-blue-300' };
      case 'INSTITUTION_USER':
        return { label: 'College Representative', bg: 'bg-emerald-100 text-emerald-800 border-emerald-300' };
      default:
        return { label: 'Authorized User', bg: 'bg-slate-100 text-slate-800 border-slate-300' };
    }
  };

  const roleInfo = getRoleLabel(user?.role);

  const getInitials = (name?: string) => {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  const navLinks = [
    { name: 'Overview', to: '/dashboard', icon: LayoutDashboard },
    { name: 'Applications', to: '/applications', icon: FileText },
    ...(!isInstitution
      ? [
          { name: 'External Verification', to: '/verification', icon: CheckCircle2 },
          { name: 'Approval Guidelines', to: '/admin/rules', icon: BookOpen },
        ]
      : []),
    { name: 'Activity Log', to: '/audit', icon: History },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white shadow-xs">
      {/* Official Government Tricolor Ribbon */}
      <div className="tricolor-ribbon" />

      {/* Tier 1: Official Dignified Government Header */}
      <div className="gov-top-header px-4 sm:px-6 lg:px-8 py-1.5 flex items-center justify-between">
        <div className="flex items-center space-x-3 divide-x divide-white/20">
          <div className="flex items-center space-x-2">
            <span className="font-bold text-amber-300 tracking-wider">भारत सरकार</span>
            <span className="text-white/60">|</span>
            <span className="text-white/90 font-medium">Government of India</span>
          </div>
          <div className="pl-3 hidden md:flex items-center space-x-2">
            <span className="text-white/90">अखिल भारतीय तकनीकी शिक्षा परिषद (AICTE)</span>
            <span className="text-white/50 text-[10px]">•</span>
            <span className="text-white/70">Ministry of Education</span>
          </div>
        </div>

        <div className="flex items-center space-x-4 text-[11px] text-white/80">
          <div className="hidden lg:flex items-center space-x-1.5 text-amber-200/90 font-medium">
            <Calendar className="w-3 h-3" />
            <span>Academic Cycle 2026-27 Active</span>
          </div>
          <div className="flex items-center space-x-1 text-emerald-300 font-medium">
            <Lock className="w-3 h-3" />
            <span>AES-256 Encrypted</span>
          </div>
          <div className="hidden sm:flex items-center space-x-1 text-white/70">
            <PhoneCall className="w-3 h-3" />
            <span>AICTE Helpdesk: 1800-11-2561</span>
          </div>
        </div>
      </div>

      {/* Tier 2: Main Executive Navigation & Identity */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-17 items-center">
            {/* Brand Logo & National Seal */}
            <Link to="/dashboard" className="flex items-center space-x-3.5 group">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950 flex items-center justify-center text-white shadow-md shadow-slate-900/15 group-hover:shadow-blue-900/30 transition-all border border-blue-900/30">
                <ShieldCheck className="w-6 h-6 text-amber-400 group-hover:scale-110 transition-transform" />
              </div>
              <div>
                <div className="flex items-center space-x-2.5">
                  <span className="font-extrabold text-2xl tracking-tight text-slate-900 font-sans">
                    प्रमाण <span className="text-blue-900 font-black">PRAMAAN</span>
                  </span>
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-900 border border-amber-300 tracking-wider uppercase">
                    AICTE Central Portal
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 font-medium hidden sm:block">
                  National Regulatory Intelligence & Automated Approval Verification System
                </p>
              </div>
            </Link>

            {/* Quick Actions & User Credentials */}
            <div className="flex items-center space-x-3 sm:space-x-4">
              <Link
                to="/applications/new"
                className="inline-flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-700 via-blue-800 to-indigo-800 hover:from-blue-800 hover:to-indigo-900 text-white rounded-lg text-xs font-bold shadow-sm shadow-blue-900/20 hover:shadow-md transition cursor-pointer"
              >
                <PlusCircle className="w-4 h-4 text-amber-300" />
                <span className="hidden sm:inline">New Application</span>
                <span className="sm:hidden">New</span>
              </Link>

              {/* Dignified User Badge */}
              <div className="flex items-center space-x-2.5 pl-3 border-l border-slate-200">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-slate-800 to-blue-950 text-white flex items-center justify-center font-bold text-xs shadow-xs border border-slate-300">
                  {getInitials(user?.full_name)}
                </div>
                <div className="hidden md:flex flex-col items-start leading-tight">
                  <div className="flex items-center space-x-1.5">
                    <span className="text-xs font-bold text-slate-900">{user?.full_name}</span>
                    <span className={`text-[9px] px-2 py-0.5 rounded font-bold border ${roleInfo.bg}`}>
                      {roleInfo.label}
                    </span>
                  </div>
                  {user?.institution_name && (
                    <div className="flex items-center space-x-1 text-[11px] text-slate-500 mt-0.5">
                      <Building2 className="w-3 h-3 text-slate-400 shrink-0" />
                      <span className="truncate max-w-[210px] font-medium">{user.institution_name}</span>
                    </div>
                  )}
                </div>
              </div>

              <button
                onClick={logout}
                className="flex items-center space-x-1.5 px-3 py-2 text-xs font-semibold text-slate-600 hover:text-rose-700 bg-slate-50 hover:bg-rose-50/70 rounded-lg border border-slate-200 hover:border-rose-300 transition cursor-pointer"
                title="Sign Out"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            </div>
          </div>

          {/* Tier 3: Horizontal Tab Navigation Bar */}
          <div className="flex items-center justify-between border-t border-slate-100 py-1.5">
            <nav className="flex space-x-1 sm:space-x-2">
              {navLinks.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={({ isActive }) =>
                      `flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                        isActive
                          ? 'bg-blue-900 text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                      }`
                    }
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{item.name}</span>
                  </NavLink>
                );
              })}
            </nav>

            <div className="hidden lg:flex items-center space-x-3 text-[11px] text-slate-500 font-medium">
              <span className="flex items-center space-x-1.5">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="text-slate-700 font-semibold">Live State & NBA Registry Synced</span>
              </span>
              <span className="text-slate-300">•</span>
              <span className="text-slate-600 font-mono">Handbook v2026.1</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
