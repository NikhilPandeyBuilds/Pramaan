import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '../lib/api';
import { Application } from '../types';
import { Search, Filter, PlusCircle, ExternalLink, RefreshCw, X, FileText, CheckCircle2 } from 'lucide-react';

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
      setApplications(data || []);
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

  const clearFilters = () => {
    setSearchTerm('');
    setCategoryFilter('');
    setStatusFilter('');
    setSearchParams({});
    api.getApplications().then((d) => setApplications(d || []));
  };

  const getStatusBadge = (status: string) => {
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

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-slate-200 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Institutional Applications</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Central repository of technical institution approval requests, compliance dossiers, and verification decisions.
          </p>
        </div>
        <Link
          to="/applications/new"
          className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-800 hover:bg-blue-900 text-white rounded-lg text-xs font-bold shadow-sm transition cursor-pointer"
        >
          <PlusCircle className="w-4 h-4 text-amber-300" />
          <span>New Application</span>
        </Link>
      </div>

      {/* Filter and Search Bar */}
      <div className="executive-card p-4 flex flex-col md:flex-row gap-3 items-center justify-between">
        <form onSubmit={handleSearchSubmit} className="relative w-full md:w-96">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by ID, college name, code, state..."
            className="w-full pl-9 pr-8 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white font-medium"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => { setSearchTerm(''); fetchApplications(); }}
              className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </form>

        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          <div className="flex items-center space-x-1.5 text-[11px] text-slate-500 font-bold uppercase tracking-wider">
            <Filter className="w-3.5 h-3.5" />
            <span>Filter:</span>
          </div>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 font-bold text-slate-700"
          >
            <option value="">All Categories</option>
            <option value="EOA">Extension of Approval (EoA)</option>
            <option value="NEW_INSTITUTION">New Institution</option>
            <option value="INCREASE_INTAKE">Increase in Intake</option>
            <option value="NEW_PROGRAMME">New Programme</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 font-bold text-slate-700"
          >
            <option value="">All Statuses</option>
            <option value="draft">Draft Mode</option>
            <option value="submitted">Submitted</option>
            <option value="ready_for_officer_review">Ready for Review</option>
            <option value="rectification_required">Updates Needed</option>
            <option value="completed">Approved</option>
          </select>

          {(categoryFilter || statusFilter || searchTerm) && (
            <button
              onClick={clearFilters}
              className="text-xs text-blue-700 hover:underline px-1 font-bold cursor-pointer"
            >
              Reset
            </button>
          )}

          <button
            onClick={fetchApplications}
            className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition cursor-pointer"
            title="Refresh List"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Applications Table */}
      <div className="executive-card overflow-hidden">
        {loading ? (
          <div className="py-20 text-center text-xs text-slate-500">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-800 border-t-transparent mx-auto mb-2"></div>
            Loading application records...
          </div>
        ) : applications.length === 0 ? (
          <div className="py-20 text-center text-xs text-slate-400">
            No applications match your search criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
              <thead className="bg-slate-50 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-3.5">Application #</th>
                  <th className="px-5 py-3.5">Institution</th>
                  <th className="px-5 py-3.5">Approval Category</th>
                  <th className="px-5 py-3.5">Academic Year</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {applications.map((app) => {
                  const s = getStatusBadge(app.status);
                  return (
                    <tr key={app.id} className="hover:bg-slate-50/80 transition">
                      <td className="px-5 py-3.5 font-mono font-bold text-blue-800 text-[11px]">
                        <Link to={`/applications/${app.id}`} className="hover:underline">
                          {app.application_number}
                        </Link>
                      </td>
                      <td className="px-5 py-3.5">
                        <Link to={`/applications/${app.id}`} className="font-bold text-slate-900 hover:text-blue-800">
                          {app.institution_name}
                        </Link>
                        <div className="text-[11px] text-slate-500 font-medium">AICTE Code: {app.institution_code}</div>
                      </td>
                      <td className="px-5 py-3.5 font-semibold text-slate-700">
                        {app.category === 'EOA' ? 'Extension of Approval' : app.category.replace(/_/g, ' ')}
                      </td>
                      <td className="px-5 py-3.5 text-slate-600 font-medium font-mono">{app.academic_year}</td>
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${s.badge}`}>
                          {s.label}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <Link
                          to={`/applications/${app.id}`}
                          className="inline-flex items-center space-x-1 text-xs font-bold text-blue-800 hover:text-blue-900 bg-blue-50/80 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition"
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
        )}
      </div>
    </div>
  );
};
