import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, FileText, CheckCircle2, BookOpen, History, HelpCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const Sidebar: React.FC = () => {
  const { isInstitution } = useAuth();

  const navItems = [
    { name: 'Dashboard', to: '/dashboard', icon: LayoutDashboard },
    { name: 'Applications', to: '/applications', icon: FileText },
    ...(!isInstitution
      ? [
          { name: 'External Verification', to: '/verification', icon: CheckCircle2 },
          { name: 'Approval Rules', to: '/admin/rules', icon: BookOpen },
        ]
      : []),
    { name: 'Activity Log', to: '/audit', icon: History },
  ];

  return (
    <aside className="w-60 bg-white border-r border-slate-200 text-slate-700 flex flex-col justify-between hidden md:flex min-h-[calc(100vh-4rem)]">
      <div className="p-4 space-y-6">
        <div>
          <p className="px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
            Main Menu
          </p>
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `flex items-center space-x-3 px-3 py-2 rounded-lg text-xs font-semibold transition ${
                      isActive
                        ? 'bg-blue-50 text-blue-700 font-bold'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
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

        {/* Helpful Info Card */}
        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 text-xs space-y-1.5">
          <div className="flex items-center space-x-1.5 text-slate-800 font-semibold">
            <HelpCircle className="w-4 h-4 text-blue-600" />
            <span>AICTE Guidelines</span>
          </div>
          <p className="text-slate-500 text-[11px] leading-relaxed">
            All applications are checked against official AICTE Approval Handbook criteria before final officer review.
          </p>
        </div>
      </div>

      <div className="p-4 border-t border-slate-200 text-[11px] text-slate-400 flex flex-col space-y-0.5">
        <span className="font-semibold text-slate-700">Pramaan — AICTE Portal</span>
        <span className="text-[10px] text-slate-400">Approval Year 2026-27</span>
      </div>
    </aside>
  );
};
