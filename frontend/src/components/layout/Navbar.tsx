import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { ShieldCheck, LogOut, User as UserIcon, Building2 } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();

  const getRoleBadge = (role?: string) => {
    switch (role) {
      case 'ADMIN':
        return <span className="bg-purple-100 text-purple-800 text-xs px-2.5 py-0.5 rounded-full font-semibold border border-purple-200">Rule Manager / Admin</span>;
      case 'REGULATORY_OFFICER':
        return <span className="bg-blue-100 text-blue-800 text-xs px-2.5 py-0.5 rounded-full font-semibold border border-blue-200">Regulatory Officer</span>;
      case 'INSTITUTION_USER':
        return <span className="bg-emerald-100 text-emerald-800 text-xs px-2.5 py-0.5 rounded-full font-semibold border border-emerald-200">Institution Representative</span>;
      default:
        return null;
    }
  };

  return (
    <header className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Logo & National Badge */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center shadow-md">
              <ShieldCheck className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-lg tracking-tight text-white">NiyamAI</span>
                <span className="bg-slate-800 text-blue-400 text-xs px-2 py-0.5 rounded border border-slate-700 font-mono">SIH 26261</span>
              </div>
              <p className="text-xs text-slate-400">AICTE Regulatory Intelligence & Compliance Platform</p>
            </div>
          </div>

          {/* User Profile & Actions */}
          <div className="flex items-center space-x-4">
            <div className="hidden md:flex flex-col items-end">
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium text-slate-200">{user?.full_name}</span>
                {getRoleBadge(user?.role)}
              </div>
              {user?.institution_name && (
                <div className="flex items-center space-x-1 text-xs text-slate-400 mt-0.5">
                  <Building2 className="w-3.5 h-3.5 text-slate-500" />
                  <span>{user.institution_name} ({user.institution_code})</span>
                </div>
              )}
            </div>

            <button
              onClick={logout}
              className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 hover:text-white rounded-md border border-slate-700 transition"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
