import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import { DashboardSummary } from '../types';
import { useAuth } from '../context/AuthContext';
import {
  FileText,
  Clock,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  PlusCircle,
  ExternalLink,
  ShieldCheck,
  Search,
  Filter,
  BarChart3
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

export const Dashboard: React.FC = () => {
  const { user, isInstitution } = useAuth();
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
        setError(err.message || 'Failed to load dashboard metrics.');
      } finally {
        setLoading(false);
      }
    };
    fetchSummary();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-sm text-slate-600">Loading regulatory dashboard metrics...</span>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl">
        <p className="font-semibold">Unable to load dashboard</p>
        <p className="text-sm">{error}</p>
      </div>
    );
  }

  // Format status distribution for chart
  const chartData = Object.entries(data.status_distribution || {}).map(([key, val]) => ({
    status: key.replace(/_/g, ' ').toUpperCase(),
    count: val,
  }));

  const COLORS = ['#2563EB', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#64748B'];

  return (
    <div className="space-y-6">
      {/* Top Banner / Welcome */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-slate-200 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Regulatory Case Management Dashboard</h1>
          <p className="text-sm text-slate-500 mt-1">
            Academic Year 2026-27 Approval Processing & Compliance Intelligence Dossier
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Link
            to="/applications/new"
            className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold shadow-sm transition"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Create Application</span>
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link
          to="/applications"
          className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-xs hover:border-blue-400 transition group"
        >
          <div className="flex justify-between items-start">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Applications</span>
            <div className="p-2 rounded-lg bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition">
              <FileText className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-slate-900">{data.total_applications}</span>
            <p className="text-xs text-slate-500 mt-1">{data.draft_applications} in draft status</p>
          </div>
        </Link>

        <Link
          to="/applications?status=ready_for_officer_review"
          className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-xs hover:border-amber-400 transition group"
        >
          <div className="flex justify-between items-start">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Awaiting Officer Review</span>
            <div className="p-2 rounded-lg bg-amber-50 text-amber-600 group-hover:bg-amber-600 group-hover:text-white transition">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-amber-600">{data.awaiting_officer_review}</span>
            <p className="text-xs text-slate-500 mt-1">Requires official inspection & decision</p>
          </div>
        </Link>

        <Link
          to="/applications?status=rectification_required"
          className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-xs hover:border-purple-400 transition group"
        >
          <div className="flex justify-between items-start">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Rectification Requests</span>
            <div className="p-2 rounded-lg bg-purple-50 text-purple-600 group-hover:bg-purple-600 group-hover:text-white transition">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-purple-600">{data.rectification_required}</span>
            <p className="text-xs text-slate-500 mt-1">Pending institution correction/resubmission</p>
          </div>
        </Link>

        <div className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-xs">
          <div className="flex justify-between items-start">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Unresolved Anomalies</span>
            <div className="p-2 rounded-lg bg-rose-50 text-rose-600">
              <AlertCircle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-rose-600">{data.unresolved_anomalies}</span>
            <p className="text-xs text-slate-500 mt-1">Document metadata / visual alerts</p>
          </div>
        </div>
      </div>

      {/* Middle Row: Status Distribution Chart & Critical Findings */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Status Distribution Chart */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs lg:col-span-1">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h2 className="text-sm font-semibold text-slate-800 flex items-center space-x-2">
              <BarChart3 className="w-4 h-4 text-blue-600" />
              <span>Application Status Breakdown</span>
            </h2>
          </div>
          <div className="mt-4 h-64">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                  <XAxis type="number" hide />
                  <YAxis type="category" dataKey="status" tick={{ fontSize: 11, fill: '#475569' }} width={120} />
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
                No application distribution data.
              </div>
            )}
          </div>
        </div>

        {/* Critical Unresolved Findings Table */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs lg:col-span-2">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h2 className="text-sm font-semibold text-slate-800 flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-rose-600" />
              <span>Priority Unresolved Regulatory Findings</span>
            </h2>
            <span className="text-xs font-semibold bg-rose-50 text-rose-700 px-2.5 py-0.5 rounded-full border border-rose-200">
              {data.critical_findings.length} Open
            </span>
          </div>

          <div className="mt-3 divide-y divide-slate-100 max-h-64 overflow-y-auto">
            {data.critical_findings.length > 0 ? (
              data.critical_findings.map((f) => (
                <div key={f.id} className="py-2.5 flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-mono text-xs font-bold text-slate-900">{f.rule_code}</span>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                          f.severity === 'critical'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {f.severity}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 leading-snug">{f.explanation}</p>
                  </div>
                  <Link
                    to={`/applications/${f.application_id}`}
                    className="shrink-0 text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center space-x-1"
                  >
                    <span>Inspect</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Link>
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-xs text-slate-400">
                No open critical or high regulatory findings recorded.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Row: Recent Applications Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-800 flex items-center space-x-2">
            <FileText className="w-4 h-4 text-slate-500" />
            <span>Recent Applications in Workflow</span>
          </h2>
          <Link to="/applications" className="text-xs font-semibold text-blue-600 hover:text-blue-800">
            View All Applications →
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
            <thead className="bg-slate-50 text-xs font-semibold text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="px-6 py-3">Application #</th>
                <th className="px-6 py-3">Institution</th>
                <th className="px-6 py-3">Category</th>
                <th className="px-6 py-3">Academic Year</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {data.recent_applications.map((app) => (
                <tr key={app.id} className="hover:bg-slate-50/80 transition">
                  <td className="px-6 py-3.5 font-mono text-xs font-semibold text-blue-600">
                    <Link to={`/applications/${app.id}`} className="hover:underline">
                      {app.application_number}
                    </Link>
                  </td>
                  <td className="px-6 py-3.5">
                    <div className="font-medium text-slate-900">{app.institution_name}</div>
                    <div className="text-xs text-slate-500">{app.institution_code}</div>
                  </td>
                  <td className="px-6 py-3.5 font-medium text-slate-700">{app.category}</td>
                  <td className="px-6 py-3.5 text-slate-600">{app.academic_year}</td>
                  <td className="px-6 py-3.5">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ${
                        app.status === 'completed'
                          ? 'bg-emerald-100 text-emerald-800'
                          : app.status === 'ready_for_officer_review'
                          ? 'bg-amber-100 text-amber-800'
                          : app.status === 'rectification_required'
                          ? 'bg-purple-100 text-purple-800'
                          : 'bg-slate-100 text-slate-800'
                      }`}
                    >
                      {app.status.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-3.5 text-right">
                    <Link
                      to={`/applications/${app.id}`}
                      className="inline-flex items-center space-x-1 text-xs font-semibold text-blue-600 hover:text-blue-800"
                    >
                      <span>Open Case</span>
                      <ExternalLink className="w-3 h-3" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
