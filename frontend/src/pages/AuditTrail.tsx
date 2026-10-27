import React, { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { AuditEvent, Application } from '../types';
import { History, Search, RefreshCw, FileText, Download } from 'lucide-react';

export const AuditTrail: React.FC = () => {
  const [applications, setApplications] = useState<Application[]>([]);
  const [selectedAppId, setSelectedAppId] = useState<string>('');
  const [auditEvents, setAuditEvents] = useState<AuditEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [generatingReport, setGeneratingReport] = useState(false);

  useEffect(() => {
    const fetchApps = async () => {
      try {
        const apps = await api.getApplications();
        setApplications(apps);
        if (apps.length > 0) {
          setSelectedAppId(apps[0].id);
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchApps();
  }, []);

  const fetchAudit = async (appId: string) => {
    if (!appId) return;
    setLoading(true);
    try {
      const trail = await api.getAuditTrail(appId);
      setAuditEvents(trail);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedAppId) {
      fetchAudit(selectedAppId);
    }
  }, [selectedAppId]);

  const handleDownloadReport = async () => {
    if (!selectedAppId) return;
    setGeneratingReport(true);
    try {
      const res = await api.generateReport(selectedAppId);
      window.open(res.download_url, '_blank');
    } catch (err: any) {
      alert(`Report download failed: ${err.message}`);
    } finally {
      setGeneratingReport(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-slate-200 gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">Activity Log & Reports</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Complete record of application submissions, automated checks, and review actions.
          </p>
        </div>

        <button
          onClick={handleDownloadReport}
          disabled={generatingReport || !selectedAppId}
          className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs transition disabled:opacity-50 cursor-pointer"
        >
          <Download className="w-4 h-4" />
          <span>{generatingReport ? 'Generating...' : 'Download Report (PDF)'}</span>
        </button>
      </div>

      {/* Application Selector */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center space-x-3 w-full sm:w-auto">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider shrink-0">Select Application:</span>
          <select
            value={selectedAppId}
            onChange={(e) => setSelectedAppId(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 font-medium text-slate-800 w-full sm:w-80 font-mono"
          >
            {applications.map((app) => (
              <option key={app.id} value={app.id}>
                {app.application_number} — {app.institution_name}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={() => fetchAudit(selectedAppId)}
          className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition"
          title="Refresh Log"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-sm text-slate-500">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
            Loading audit records...
          </div>
        ) : auditEvents.length === 0 ? (
          <div className="py-16 text-center text-xs text-slate-400">
            No audit events found for selected application.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {auditEvents.map((evt) => (
              <div key={evt.id} className="p-4 space-y-1 text-xs hover:bg-slate-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-slate-900 font-mono">{evt.action}</span>
                    <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-[10px] font-mono">
                      {evt.entity_type}
                    </span>
                  </div>
                  <span className="text-slate-400 font-mono text-[11px]">{evt.created_at}</span>
                </div>
                <p className="text-slate-700">
                  Authorized Actor: <span className="font-semibold text-slate-900">{evt.actor_name}</span>
                </p>
                <div className="bg-slate-50 p-2 rounded border border-slate-200 font-mono text-[11px] text-slate-600">
                  {JSON.stringify(evt.details_json, null, 2)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
