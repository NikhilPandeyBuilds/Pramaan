import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import { DashboardSummary } from '../types';
import { useAuth } from '../context/AuthContext';
import {
  FileText,
  Clock,
  AlertTriangle,
  AlertCircle,
  PlusCircle,
  ExternalLink,
  BarChart3,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Building,
  FileCheck2,
  Search,
  BookOpen,
  ArrowUpRight,
  Sparkles
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        setLoading(true);
        const res = await api.getDashboardSummary();
        setData(res);
      } catch (err: any) {
        setError(err.message || 'Failed to load dashboard data.');
      } finally {
        setLoading(false);
      }
    };
    fetchSummary();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-80 text-slate-500 space-y-3">
        <div className="animate-spin rounded-full h-8 w-8 border-3 border-blue-800 border-t-transparent"></div>
        <span className="text-sm font-semibold tracking-wide text-slate-700">
          Loading Pramaan Regulatory Intelligence Engine...
        </span>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="bg-rose-50 border border-rose-200 text-rose-800 p-5 rounded-xl text-xs space-y-2">
        <p className="font-bold text-sm">Unable to connect to Pramaan central server</p>
        <p>{error}</p>
      </div>
    );
  }

  // Format status distribution for chart
  const chartData = Object.entries(data.status_distribution || {}).map(([key, val]) => ({
    status: key.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
    count: val,
  }));

  const COLORS = ['#1e3a8a', '#059669', '#d97706', '#dc2626', '#7c3aed', '#475569'];

  const formatStatus = (status: string) => {
    switch (status) {
      case 'completed':
        return { label: 'Approved', badge: 'bg-emerald-50 text-emerald-800 border-emerald-300' };
      case 'ready_for_officer_review':
        return { label: 'Ready for Review', badge: 'bg-blue-50 text-blue-800 border-blue-300' };
      case 'rectification_required':
        return { label: 'Updates Needed', badge: 'bg-amber-50 text-amber-800 border-amber-300' };
      case 'submitted':
        return { label: 'Submitted', badge: 'bg-indigo-50 text-indigo-800 border-indigo-300' };
      case 'draft':
        return { label: 'Draft Mode', badge: 'bg-slate-100 text-slate-700 border-slate-300' };
      default:
        return { label: status.replace(/_/g, ' '), badge: 'bg-slate-100 text-slate-700 border-slate-300' };
    }
  };

  // Plain human-readable finding info
  const getFindingInfo = (ruleCode: string) => {
    switch (ruleCode) {
      case 'EOA-DOC-001':
        return { title: 'Previous Year Approval Letter', category: 'Approval Letter' };
      case 'EOA-NOC-002':
        return { title: 'Building & Fire Safety Clearance', category: 'Safety NOC' };
      case 'NBA-VALID-003':
        return { title: 'NBA Accreditation Validity', category: 'Accreditation' };
      case 'ID-MATCH-004':
        return { title: 'College Code & Identity Verification', category: 'Identity Check' };
      case 'EXT-VERIFY-001':
        return { title: 'External Board Verification', category: 'Board Registry' };
      case 'DUP-HASH-005':
        return { title: 'Duplicate Document Detection', category: 'Document Check' };
      case 'INTAKE-CONSIST-006':
        return { title: 'Sanctioned Seat Intake Check', category: 'Capacity Check' };
      default:
        return {
          title: ruleCode.replace(/-/g, ' ').replace(/\d+/g, '').trim() || 'Compliance Check',
          category: 'Verification',
        };
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Dignified Hero Welcome Card */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-950 rounded-2xl p-6 sm:p-8 text-white shadow-md relative overflow-hidden border border-blue-900/30">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-10 pointer-events-none flex items-center justify-center">
          <ShieldCheck className="w-96 h-96 text-white" />
        </div>

        <div className="relative z-10 space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-400/20 text-amber-300 border border-amber-400/40 uppercase tracking-wider">
              AY 2026-27 Approval Cycle
            </span>
            <span className="text-white/40">•</span>
            <span className="text-xs text-white/80 font-medium">
              AICTE Regulatory Intelligence Network
            </span>
          </div>

          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              Welcome, {user?.full_name || 'Authorized Official'}
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              {user?.institution_name
                ? `Managing regulatory submissions and compliance dossier for ${user.institution_name}.`
                : 'Central monitoring and automated verification for all technical higher education applications nationwide.'}
            </p>
          </div>

          <div className="pt-2 flex flex-wrap items-center gap-3">
            <Link
              to="/applications/new"
              className="inline-flex items-center space-x-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold shadow-sm transition cursor-pointer"
            >
              <PlusCircle className="w-4 h-4 text-amber-300" />
              <span>Create New Application</span>
            </Link>

            <Link
              to="/applications"
              className="inline-flex items-center space-x-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-lg text-xs font-semibold backdrop-blur-sm transition cursor-pointer"
            >
              <FileText className="w-4 h-4 text-white/80" />
              <span>Browse All Applications</span>
            </Link>

            <Link
              to="/admin/rules"
              className="inline-flex items-center space-x-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-lg text-xs font-semibold backdrop-blur-sm transition cursor-pointer"
            >
              <BookOpen className="w-4 h-4 text-white/80" />
              <span>Approval Guidelines</span>
            </Link>
          </div>
        </div>
      </div>

      {/* 2. Regulatory Approval Workflow Pipeline Visualizer */}
      <div className="executive-card p-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-blue-700" />
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Pramaan Automated Verification Pipeline
            </h2>
          </div>
          <span className="text-[11px] text-slate-500 font-medium">
            AICTE Deterministic Standard Process
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 text-xs">
          {[
            { step: '01', title: 'Application Intake', desc: 'College details & seat intake', state: 'active' },
            { step: '02', title: 'OCR & Parsing', desc: 'Forensic PDF scanning & extraction', state: 'active' },
            { step: '03', title: 'Rule Engine', desc: 'Deterministic policy checks', state: 'active' },
            { step: '04', title: 'Board Cross-Check', desc: 'Live NBA & State Board sync', state: 'active' },
            { step: '05', title: 'Officer Decision', desc: 'Cryptographic PDF approval order', state: 'active' },
          ].map((item, idx) => (
            <div
              key={item.step}
              className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 hover:border-blue-300 hover:bg-blue-50/30 transition relative"
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-mono text-[10px] font-bold text-blue-700 bg-blue-100/70 px-1.5 py-0.5 rounded">
                  {item.step}
                </span>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              </div>
              <h3 className="font-bold text-slate-900 text-xs">{item.title}</h3>
              <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* 3. Executive KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Applications */}
        <Link
          to="/applications"
          className="executive-card p-5 group hover:border-blue-400"
        >
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Total Applications
            </span>
            <div className="p-2.5 rounded-xl bg-blue-50 text-blue-800 group-hover:bg-blue-800 group-hover:text-white transition">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-extrabold text-slate-900">{data.total_applications}</span>
            <p className="text-xs text-slate-500 mt-1 font-medium">
              {data.draft_applications} in preparation draft
            </p>
          </div>
        </Link>

        {/* Ready for Review */}
        <Link
          to="/applications?status=ready_for_officer_review"
          className="executive-card p-5 group hover:border-blue-400"
        >
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Ready for Review
            </span>
            <div className="p-2.5 rounded-xl bg-blue-50 text-blue-800 group-hover:bg-blue-800 group-hover:text-white transition">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-extrabold text-blue-700">{data.awaiting_officer_review}</span>
            <p className="text-xs text-slate-500 mt-1 font-medium">
              Passed automated checks, awaits officer
            </p>
          </div>
        </Link>

        {/* Rectification Required */}
        <Link
          to="/applications?status=rectification_required"
          className="executive-card p-5 group hover:border-amber-400"
        >
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Updates Requested
            </span>
            <div className="p-2.5 rounded-xl bg-amber-50 text-amber-700 group-hover:bg-amber-600 group-hover:text-white transition">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-extrabold text-amber-600">{data.rectification_required}</span>
            <p className="text-xs text-slate-500 mt-1 font-medium">
              Sent back to colleges for correction
            </p>
          </div>
        </Link>

        {/* Flagged Issues */}
        <div className="executive-card p-5">
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Flagged Issues
            </span>
            <div className="p-2.5 rounded-xl bg-rose-50 text-rose-700">
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-extrabold text-rose-600">{data.unresolved_anomalies}</span>
            <p className="text-xs text-slate-500 mt-1 font-medium">
              Discrepancies identified across filings
            </p>
          </div>
        </div>
      </div>

      {/* 4. Middle Analytics Row: Distribution & Priority Items */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Status Distribution Chart */}
        <div className="executive-card p-5 lg:col-span-1">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center space-x-2">
              <BarChart3 className="w-4 h-4 text-blue-700" />
              <span>Application Status Breakdown</span>
            </h2>
          </div>
          <div className="mt-4 h-64">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 15, left: 15, bottom: 5 }}>
                  <XAxis type="number" hide />
                  <YAxis type="category" dataKey="status" tick={{ fontSize: 11, fill: '#475569', fontWeight: 600 }} width={115} />
                  <Tooltip />
                  <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                    {chartData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-xs text-slate-400">
                No application data recorded yet.
              </div>
            )}
          </div>
        </div>

        {/* Priority Items Requiring Officer Action */}
        <div className="executive-card p-5 lg:col-span-2">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <span>Items Requiring Officer Attention</span>
            </h2>
            <span className="text-[11px] font-bold bg-rose-50 text-rose-800 px-2.5 py-0.5 rounded-full border border-rose-200">
              {data.critical_findings.length} Open Discrepancies
            </span>
          </div>

          <div className="mt-3 divide-y divide-slate-100 max-h-64 overflow-y-auto pr-1">
            {data.critical_findings.length > 0 ? (
              data.critical_findings.map((f) => {
                const info = getFindingInfo(f.rule_code);
                return (
                  <div key={f.id} className="py-3 flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-bold text-slate-900">{info.title}</span>
                        <span className="text-[10px] font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                          {info.category}
                        </span>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                            f.severity === 'critical'
                              ? 'bg-rose-50 text-rose-800 border border-rose-300'
                              : 'bg-amber-50 text-amber-800 border border-amber-300'
                          }`}
                        >
                          {f.severity}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 leading-snug">{f.explanation}</p>
                    </div>
                    <Link
                      to={`/applications/${f.application_id}`}
                      className="shrink-0 text-xs font-bold text-blue-700 hover:text-blue-900 flex items-center space-x-1 bg-blue-50 hover:bg-blue-100 px-2.5 py-1 rounded-lg transition"
                    >
                      <span>Review</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                );
              })
            ) : (
              <div className="py-12 text-center text-xs text-slate-400">
                All clear! No pending items requiring action.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 5. Recent Applications Table */}
      <div className="executive-card overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center space-x-2">
            <FileText className="w-4 h-4 text-blue-700" />
            <span>Recent Application Dossiers</span>
          </h2>
          <Link
            to="/applications"
            className="text-xs font-bold text-blue-700 hover:text-blue-900 flex items-center space-x-1"
          >
            <span>View All Applications</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
            <thead className="bg-slate-50 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
              <tr>
                <th className="px-5 py-3.5">College & Institution</th>
                <th className="px-5 py-3.5">Approval Category</th>
                <th className="px-5 py-3.5">Application Number</th>
                <th className="px-5 py-3.5">Academic Year</th>
                <th className="px-5 py-3.5">Regulatory Status</th>
                <th className="px-5 py-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {data.recent_applications.map((app) => {
                const s = formatStatus(app.status);
                return (
                  <tr key={app.id} className="hover:bg-slate-50/80 transition">
                    <td className="px-5 py-3.5">
                      <Link to={`/applications/${app.id}`} className="font-bold text-slate-900 hover:text-blue-700">
                        {app.institution_name}
                      </Link>
                      <div className="text-[11px] text-slate-500 font-medium">Permanent Code: {app.institution_code}</div>
                    </td>
                    <td className="px-5 py-3.5 font-semibold text-slate-700">
                      {app.category === 'EOA' ? 'Extension of Approval' : app.category.replace(/_/g, ' ')}
                    </td>
                    <td className="px-5 py-3.5 font-mono text-slate-800 text-[11px] font-semibold">{app.application_number}</td>
                    <td className="px-5 py-3.5 text-slate-600 font-medium">{app.academic_year}</td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${s.badge}`}>
                        {s.label}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <Link
                        to={`/applications/${app.id}`}
                        className="inline-flex items-center space-x-1 text-xs font-bold text-blue-700 hover:text-blue-900 bg-blue-50/80 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition"
                      >
                        <span>Open Dossier</span>
                        <ExternalLink className="w-3 h-3 ml-0.5" />
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
