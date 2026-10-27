import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import { VerificationAttempt } from '../types';
import { CheckCircle2, AlertTriangle, Clock, RefreshCw, ExternalLink, ShieldCheck } from 'lucide-react';

export const VerificationCentre: React.FC = () => {
  const [attempts, setAttempts] = useState<VerificationAttempt[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('');

  const fetchQueue = async () => {
    setLoading(true);
    try {
      const data = await api.getVerificationQueue(statusFilter || undefined);
      setAttempts(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();
  }, [statusFilter]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-slate-200 gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">External Verification</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Real-time status checks against official external bodies including NBA and State Technical Education Directorates.
          </p>
        </div>

        <button
          onClick={fetchQueue}
          className="inline-flex items-center space-x-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Outcome Filter:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 font-medium text-slate-700"
          >
            <option value="">All Verification Outcomes</option>
            <option value="verified">Verified Active</option>
            <option value="mismatch_detected">Mismatch Detected</option>
            <option value="expired">Expired Certificate</option>
            <option value="source_unavailable">Source Unavailable / Offline</option>
            <option value="manual_review_required">Manual Review Required</option>
          </select>
        </div>
        <span className="text-xs font-semibold text-slate-500">{attempts.length} Attempts Logged</span>
      </div>

      {/* Attempts List */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-sm text-slate-500">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
            Loading authority verification queue...
          </div>
        ) : attempts.length === 0 ? (
          <div className="py-16 text-center text-xs text-slate-400">
            No verification attempts found matching filter.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {attempts.map((att) => (
              <div key={att.id} className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50">
                <div className="space-y-1.5">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-slate-900 text-xs">{att.source_name}</span>
                    <span className="font-mono text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                      Ref #{att.reference_number}
                    </span>
                    <span
                      className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                        att.status === 'verified'
                          ? 'bg-emerald-100 text-emerald-800'
                          : att.status === 'expired'
                          ? 'bg-amber-100 text-amber-800'
                          : att.status === 'source_unavailable'
                          ? 'bg-slate-200 text-slate-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {att.status.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600">{att.response_summary}</p>
                  <p className="text-[11px] text-slate-400 font-mono">
                    Attempted: {att.checked_at} • Connector: {att.source_type}
                  </p>
                </div>

                <Link
                  to={`/applications/${att.application_id}`}
                  className="inline-flex items-center space-x-1 text-xs font-semibold text-blue-600 hover:text-blue-800 bg-blue-50 px-3 py-1.5 rounded-lg shrink-0"
                >
                  <span>Open Application Dossier</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
