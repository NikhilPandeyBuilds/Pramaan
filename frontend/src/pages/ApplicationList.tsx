import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '../lib/api';
import { Application } from '../types';
import { Search, Filter, PlusCircle, ExternalLink, RefreshCw } from 'lucide-react';

export const ApplicationList: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [categoryFilter, setCategoryFilter] = useState(searchParams.get('category') || '');
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || '');

  const fetchApplications = async () => {
    setLoading(true);
    try {
      const data = await api.getApplications({
        search: searchTerm || undefined,
        category: categoryFilter || undefined,
        status: statusFilter || undefined,
      });
      setApplications(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, [categoryFilter, statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchApplications();
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-slate-200 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Institutional Applications</h1>
          <p className="text-sm text-slate-500 mt-1">
            Browse, filter, and inspect Extension of Approval (EoA) and institutional compliance dossiers.
          </p>
        </div>
        <Link
          to="/applications/new"
          className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold shadow-sm transition"
        >
          <PlusCircle className="w-4 h-4" />
          <span>New Application</span>
        </Link>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
        <form onSubmit={handleSearchSubmit} className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search App #, Institution, Code..."
            className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </form>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="flex items-center space-x-2 text-xs text-slate-500 font-semibold uppercase">
            <Filter className="w-3.5 h-3.5" />
            <span>Filter:</span>
          </div>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-2 font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Categories</option>
            <option value="EOA">Extension of Approval (EoA)</option>
            <option value="NEW_INSTITUTION">New Institution</option>
            <option value="INCREASE_INTAKE">Increase in Intake</option>
            <option value="NEW_PROGRAMME">New Programme/Course</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-2 font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Statuses</option>
            <option value="draft">Draft</option>
            <option value="submitted">Submitted</option>
            <option value="ready_for_officer_review">Ready for Officer Review</option>
            <option value="awaiting_review">Awaiting Review</option>
            <option value="rectification_required">Rectification Required</option>
            <option value="completed">Completed / Passed</option>
          </select>

          <button
            onClick={fetchApplications}
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition"
            title="Refresh List"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Applications Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-sm text-slate-500">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
            Loading applications...
          </div>
        ) : applications.length === 0 ? (
          <div className="py-16 text-center text-sm text-slate-400">
            No matching institutional applications found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
              <thead className="bg-slate-50 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-3.5">Application Number</th>
                  <th className="px-6 py-3.5">Institution</th>
                  <th className="px-6 py-3.5">Category</th>
                  <th className="px-6 py-3.5">Academic Year</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {applications.map((app) => (
                  <tr key={app.id} className="hover:bg-slate-50/80 transition">
                    <td className="px-6 py-4 font-mono text-xs font-bold text-blue-600">
                      <Link to={`/applications/${app.id}`} className="hover:underline">
                        {app.application_number}
                      </Link>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-900">{app.institution_name}</div>
                      <div className="text-xs text-slate-500">AICTE ID: {app.institution_code}</div>
                    </td>
                    <td className="px-6 py-4 text-xs font-medium text-slate-700">{app.category}</td>
                    <td className="px-6 py-4 text-xs text-slate-600 font-mono">{app.academic_year}</td>
                    <td className="px-6 py-4">
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
                    <td className="px-6 py-4 text-right">
                      <Link
                        to={`/applications/${app.id}`}
                        className="inline-flex items-center space-x-1 text-xs font-semibold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition"
                      >
                        <span>Open Dossier</span>
                        <ExternalLink className="w-3 h-3 ml-1" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
