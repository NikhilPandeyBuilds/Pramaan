import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, FileText, CheckCircle2, BookOpen, History, ShieldAlert } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const Sidebar: React.FC = () => {
  const { user, isInstitution } = useAuth();

  const navItems = [
    { name: 'Dashboard', to: '/dashboard', icon: LayoutDashboard },
    { name: 'Applications', to: '/applications', icon: FileText },
    ...(!isInstitution
      ? [
          { name: 'Source Verification', to: '/verification', icon: CheckCircle2 },
          { name: 'Regulatory Rules', to: '/admin/rules', icon: BookOpen },
        ]
      : []),
    { name: 'Audit & Reports', to: '/audit', icon: History },
  ];

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 text-slate-300 flex flex-col justify-between hidden md:flex min-h-[calc(100vh-4rem)]">
      <div className="p-4 space-y-6">
        <div>
          <p className="px-3 text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
            Navigation
          </p>
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                    }`
                  }
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.name}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Regulatory Notice Banner */}
        <div className="p-3 bg-slate-800/80 rounded-lg border border-slate-700/60 text-xs space-y-1.5">
          <div className="flex items-center space-x-1.5 text-blue-400 font-semibold">
            <ShieldAlert className="w-4 h-4" />
            <span>Decision Support System</span>
          </div>
          <p className="text-slate-400 leading-relaxed">
            NiyamAI findings are advisory evidence records. Final statutory approval remains with authorized AICTE committees.
          </p>
        </div>
      </div>

      <div className="p-4 border-t border-slate-800 text-xs text-slate-500 flex flex-col space-y-1">
        <span>AICTE Regulation Bureau • SIH PS 26261</span>
        <span className="font-mono text-[10px]">Handbook: APH 2026-27 v2.4</span>
      </div>
    </aside>
  );
};
