import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import { Navbar } from './Navbar';
import { HelpAgent } from '../HelpAgent';
import { ShieldCheck, ExternalLink, HelpCircle, FileCheck, CheckCircle2 } from 'lucide-react';

export const AppLayout: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50/70 font-sans">
      <Navbar />
      <main className="flex-1 py-6 sm:py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>

      {/* Dignified Government of India Footer */}
      <footer className="bg-slate-900 text-slate-400 text-xs border-t border-slate-800 mt-12">
        <div className="tricolor-ribbon" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8 pb-8 border-b border-slate-800">
            {/* Col 1: Identity */}
            <div className="space-y-3 md:col-span-1">
              <div className="flex items-center space-x-2 text-white">
                <ShieldCheck className="w-5 h-5 text-amber-400" />
                <span className="font-extrabold text-base tracking-tight">प्रमाण PRAMAAN</span>
              </div>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                National Regulatory Intelligence & Approval Verification Platform for technical higher education institutions across India.
              </p>
              <div className="flex items-center space-x-1.5 text-[11px] text-emerald-400 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Zero-Trust Deterministic Verification</span>
              </div>
            </div>

            {/* Col 2: Institutional Portals */}
            <div className="space-y-2">
              <span className="text-slate-200 font-bold uppercase tracking-wider text-[11px]">Official Portals</span>
              <ul className="space-y-1.5 text-[11px]">
                <li>
                  <a href="https://www.aicte-india.org" target="_blank" rel="noreferrer" className="hover:text-amber-300 transition flex items-center space-x-1">
                    <span>AICTE Main Web Portal</span>
                    <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                </li>
                <li>
                  <a href="https://www.nbaind.org" target="_blank" rel="noreferrer" className="hover:text-amber-300 transition flex items-center space-x-1">
                    <span>National Board of Accreditation</span>
                    <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                </li>
                <li>
                  <a href="https://www.education.gov.in" target="_blank" rel="noreferrer" className="hover:text-amber-300 transition flex items-center space-x-1">
                    <span>Ministry of Education, GoI</span>
                    <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                </li>
              </ul>
            </div>

            {/* Col 3: Guidelines & Regulatory Handbook */}
            <div className="space-y-2">
              <span className="text-slate-200 font-bold uppercase tracking-wider text-[11px]">Guidelines & Policy</span>
              <ul className="space-y-1.5 text-[11px]">
                <li>
                  <Link to="/admin/rules" className="hover:text-amber-300 transition">
                    Approval Process Handbook 2026-27
                  </Link>
                </li>
                <li>
                  <Link to="/audit" className="hover:text-amber-300 transition">
                    Immutable Compliance Audit Trail
                  </Link>
                </li>
                <li>
                  <Link to="/verification" className="hover:text-amber-300 transition">
                    Inter-Agency Cross Verification
                  </Link>
                </li>
              </ul>
            </div>

            {/* Col 4: Technical & Problem Statement Specs */}
            <div className="space-y-2">
              <span className="text-slate-200 font-bold uppercase tracking-wider text-[11px]">Technical Integrity</span>
              <p className="text-[11px] leading-relaxed text-slate-400">
                Built for <b>Smart India Hackathon (SIH) Problem Statement 26261</b>. Incorporates OCR forensic parsing, cryptographic hash indexing, and deterministic compliance logic.
              </p>
              <div className="text-[10px] text-slate-500 font-mono">
                System Build: v2.4.0 (Calibri UI Edition)
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-500 gap-3">
            <div>
              © 2026 All India Council for Technical Education (AICTE), Nelson Mandela Marg, Vasant Kunj, New Delhi-110070.
            </div>
            <div className="flex items-center space-x-4">
              <span>Security Audited</span>
              <span>•</span>
              <span>Data Protection Compliant</span>
              <span>•</span>
              <span className="text-amber-400 font-semibold">National Informatics Framework</span>
            </div>
          </div>
        </div>
      </footer>

      {/* Interactive Guidance Agent */}
      <HelpAgent />
    </div>
  );
};
