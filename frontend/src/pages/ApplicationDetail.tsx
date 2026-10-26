import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api, getStoredToken } from '../lib/api';
import { Application, Document, Finding, VerificationAttempt, ReviewAction, AuditEvent } from '../types';
import { useAuth } from '../context/AuthContext';
import {
  FileText,
  Upload,
  CheckCircle,
  AlertTriangle,
  Clock,
  Play,
  Download,
  AlertCircle,
  ShieldAlert,
  ChevronRight,
  Trash2,
  Sparkles,
  FileSearch,
  Eye,
  RefreshCw,
  FileUp
} from 'lucide-react';

export const ApplicationDetail: React.FC = () => {
  const { applicationId } = useParams<{ applicationId: string }>();
  const { user, isOfficer, isAdmin } = useAuth();
  const token = getStoredToken() || '';

  const [application, setApplication] = useState<Application | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'documents' | 'intelligence' | 'findings' | 'verification' | 'review' | 'reports'>('documents');
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);

  // Inspector mode: 'pdf' or 'ocr'
  const [inspectorMode, setInspectorMode] = useState<'pdf' | 'ocr'>('pdf');

  // Upload state
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadType, setUploadType] = useState<string>('APPROVAL_LETTER');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isDragging, setIsDragging] = useState(false);

  // Validation state
  const [validating, setValidating] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Review modal state
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [reviewActionType, setReviewActionType] = useState<string>('confirm_finding');
  const [reviewFindingId, setReviewFindingId] = useState<string | null>(null);
  const [reviewReason, setReviewReason] = useState<string>('');
  const [reviewNotes, setReviewNotes] = useState<string>('');
  const [submittingReview, setSubmittingReview] = useState(false);

  // Rectification modal state
  const [rectModalOpen, setRectModalOpen] = useState(false);
  const [rectNotes, setRectNotes] = useState('');
  const [rectFields, setRectFields] = useState('');
  const [rectDocs, setRectDocs] = useState('');

  // Audit trail state
  const [auditEvents, setAuditEvents] = useState<AuditEvent[]>([]);
  const [generatingReport, setGeneratingReport] = useState(false);

  const fetchApplication = async () => {
    if (!applicationId) return;
    try {
      const data = await api.getApplication(applicationId);
      setApplication(data);
      if (data.documents && data.documents.length > 0) {
        if (!selectedDocId || !data.documents.some((d: any) => d.id === selectedDocId)) {
          setSelectedDocId(data.documents[0].id);
        }
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplication();
  }, [applicationId]);

  useEffect(() => {
    if (selectedDocId && application?.documents) {
      const found = application.documents.find((d) => d.id === selectedDocId);
      if (found) {
        api.getDocument(found.id).then(setSelectedDoc).catch(console.error);
      }
    }
  }, [selectedDocId, application?.documents]);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile || !applicationId) return;
    setUploading(true);
    setUploadProgress(25);
    setStatusMessage(null);
    try {
      setUploadProgress(65);
      const newDoc = await api.uploadDocument(applicationId, uploadType, uploadFile);
      setUploadProgress(100);
      setUploadFile(null);
      setStatusMessage(`Document '${newDoc.original_filename}' uploaded & processed successfully! OCR parsed ${newDoc.page_count} page(s).`);
      await fetchApplication();
      setSelectedDocId(newDoc.id);
      setActiveTab('intelligence');
    } catch (err: any) {
      setStatusMessage(`Upload failed: ${err.message}`);
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleAttachSample = async (sampleType: string) => {
    if (!applicationId) return;
    setUploading(true);
    setStatusMessage(null);
    try {
      const newDoc = await api.uploadSampleDocument(applicationId, sampleType);
      setStatusMessage(`Sample document '${newDoc.original_filename}' generated and attached! Extracted ${newDoc.extracted_fields?.length || 0} fields.`);
      await fetchApplication();
      setSelectedDocId(newDoc.id);
      setActiveTab('intelligence');
    } catch (err: any) {
      setStatusMessage(`Sample generation failed: ${err.message}`);
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteDocument = async (docId: string, filename: string) => {
    if (!confirm(`Are you sure you want to remove document '${filename}'?`)) return;
    try {
      await api.deleteDocument(docId);
      setStatusMessage(`Document '${filename}' was removed.`);
      await fetchApplication();
    } catch (err: any) {
      alert(`Delete failed: ${err.message}`);
    }
  };

  const handleRunValidation = async () => {
    if (!applicationId) return;
    setValidating(true);
    setStatusMessage(null);
    try {
      const res = await api.validateApplication(applicationId);
      setStatusMessage(`Validation completed! Evaluated against active rules. Status: ${res.status.replace(/_/g, ' ').toUpperCase()}. Generated ${res.findings_count} findings.`);
      await fetchApplication();
      setActiveTab('findings');
    } catch (err: any) {
      setStatusMessage(`Validation error: ${err.message}`);
    } finally {
      setValidating(false);
    }
  };

  const handleOpenReviewModal = (findingId: string, actionType: string) => {
    setReviewFindingId(findingId);
    setReviewActionType(actionType);
    setReviewReason('');
    setReviewNotes('');
    setReviewModalOpen(true);
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewReason.trim()) {
      alert('Mandatory justification reason is required.');
      return;
    }
    setSubmittingReview(true);
    try {
      if (reviewFindingId) {
        await api.reviewFinding(reviewFindingId, {
          action_type: reviewActionType,
          reason: reviewReason,
          notes: reviewNotes || undefined,
        });
      }
      setReviewModalOpen(false);
      await fetchApplication();
    } catch (err: any) {
      alert(`Review submission failed: ${err.message}`);
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleRequestRectification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!applicationId || !rectNotes.trim()) return;
    setSubmittingReview(true);
    try {
      const fieldsArr = rectFields ? rectFields.split(',').map((s) => s.trim()) : [];
      const docsArr = rectDocs ? rectDocs.split(',').map((s) => s.trim()) : [];
      await api.requestRectification(applicationId, {
        rectification_notes: rectNotes,
        requested_fields: fieldsArr,
        requested_documents: docsArr,
      });
      setRectModalOpen(false);
      await fetchApplication();
    } catch (err: any) {
      alert(`Rectification request failed: ${err.message}`);
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleGenerateReport = async () => {
    if (!applicationId) return;
    setGeneratingReport(true);
    try {
      const res = await api.generateReport(applicationId);
      window.open(res.download_url, '_blank');
    } catch (err: any) {
      alert(`Report generation failed: ${err.message}`);
    } finally {
      setGeneratingReport(false);
    }
  };

  const loadAuditTrail = async () => {
    if (!applicationId) return;
    try {
      const trail = await api.getAuditTrail(applicationId);
      setAuditEvents(trail);
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-sm text-slate-500">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mr-3"></div>
        Loading application dossier...
      </div>
    );
  }

  if (!application) {
    return (
      <div className="bg-red-50 p-6 rounded-xl border border-red-200 text-red-700">
        Application not found or unauthorized access.
      </div>
    );
  }

  const appData = application.application_data_json || {};
  const findings = application.findings || [];
  const documents = application.documents || [];
  const verifications = application.verification_attempts || [];
  const reviews = application.review_actions || [];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-3">
            <h1 className="text-2xl font-bold font-mono text-slate-900 tracking-tight">
              {application.application_number}
            </h1>
            <span
              className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                application.status === 'completed'
                  ? 'bg-emerald-100 text-emerald-800'
                  : application.status === 'ready_for_officer_review'
                  ? 'bg-amber-100 text-amber-800'
                  : application.status === 'rectification_required'
                  ? 'bg-purple-100 text-purple-800'
                  : 'bg-slate-100 text-slate-800'
              }`}
            >
              {application.status.replace(/_/g, ' ')}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 mt-2">
            <span className="font-semibold text-slate-700">{application.institution_name}</span>
            <span>•</span>
            <span>AICTE ID: <b className="font-mono">{application.institution_code}</b></span>
            <span>•</span>
            <span>Academic Year: <b>{application.academic_year}</b></span>
            <span>•</span>
            <span>Category: <b>{application.category}</b></span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleRunValidation}
            disabled={validating}
            className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs transition disabled:opacity-50"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>{validating ? 'Evaluating Rules...' : 'Run Regulatory Validation'}</span>
          </button>

          <button
            onClick={handleGenerateReport}
            disabled={generatingReport}
            className="inline-flex items-center space-x-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-semibold shadow-xs transition disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{generatingReport ? 'Generating...' : 'Download Dossier PDF'}</span>
          </button>
        </div>
      </div>

      {statusMessage && (
        <div className="bg-blue-50 border border-blue-200 text-blue-900 px-4 py-3 rounded-lg text-xs flex justify-between items-center shadow-xs">
          <div className="flex items-center space-x-2">
            <CheckCircle className="w-4 h-4 text-blue-600 shrink-0" />
            <span>{statusMessage}</span>
          </div>
          <button onClick={() => setStatusMessage(null)} className="text-blue-600 hover:underline font-semibold ml-4">
            Dismiss
          </button>
        </div>
      )}

      {/* Tabs Navigation */}
      <div className="border-b border-slate-200">
        <nav className="flex space-x-2 sm:space-x-4 overflow-x-auto text-xs font-semibold">
          {[
            { id: 'documents', label: `1. Supporting Documents (${documents.length})` },
            { id: 'intelligence', label: '2. Document Intelligence Lab' },
            { id: 'findings', label: `3. Compliance Findings (${findings.length})` },
            { id: 'verification', label: `4. Source Verification (${verifications.length})` },
            { id: 'overview', label: '5. Application Form Data' },
            { id: 'review', label: `6. Officer Review (${reviews.length})` },
            { id: 'reports', label: '7. Audit Trail' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id as any);
                if (tab.id === 'reports') loadAuditTrail();
              }}
              className={`py-3 px-3 border-b-2 whitespace-nowrap transition ${
                activeTab === tab.id
                  ? 'border-blue-600 text-blue-600 font-bold'
                  : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab 1: Supporting Documents & Live Upload */}
      {activeTab === 'documents' && (
        <div className="space-y-6">
          {/* Upload Card */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-sm font-bold text-slate-800 flex items-center space-x-2">
                <Upload className="w-4 h-4 text-blue-600" />
                <span>Upload Supporting Document for Automated Intake & Extraction</span>
              </h2>
              <span className="text-xs text-slate-500">Supports PDF, PNG, JPG (Max 25MB)</span>
            </div>

            {/* Manual Upload Form */}
            <form onSubmit={handleUpload} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Select Document Type *
                  </label>
                  <select
                    value={uploadType}
                    onChange={(e) => setUploadType(e.target.value)}
                    className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg px-3 py-2.5 font-medium"
                  >
                    <option value="APPROVAL_LETTER">Prior AICTE Approval Letter (EoA)</option>
                    <option value="LAND_NOC">Land & Building Safety Clearance NOC</option>
                    <option value="NBA_ACCREDITATION">NBA Accreditation Certificate</option>
                    <option value="BUILDING_PLAN">Approved Building Master Plan</option>
                    <option value="FACULTY_LIST">Sanctioned Faculty List</option>
                    <option value="AFFIDAVIT">Legal Undertaking / Affidavit</option>
                    <option value="OTHER">Other Institutional Record</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Choose PDF or Scanned Document File *
                  </label>
                  <div
                    onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setIsDragging(false);
                      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                        setUploadFile(e.dataTransfer.files[0]);
                      }
                    }}
                    className={`border-2 border-dashed rounded-lg p-3 text-center transition flex items-center justify-between px-4 ${
                      isDragging ? 'border-blue-500 bg-blue-50/50' : 'border-slate-300 bg-slate-50/50 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center space-x-3 text-left">
                      <FileUp className="w-5 h-5 text-blue-600 shrink-0" />
                      <div>
                        <p className="text-xs font-semibold text-slate-800">
                          {uploadFile ? uploadFile.name : 'Click to select or drag & drop file here'}
                        </p>
                        <p className="text-[11px] text-slate-400">
                          {uploadFile ? `${(uploadFile.size / 1024).toFixed(1)} KB` : 'PDF, PNG, JPG up to 25MB'}
                        </p>
                      </div>
                    </div>

                    <label className="cursor-pointer bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 px-3 py-1.5 rounded-md text-xs font-semibold transition shrink-0">
                      <span>Browse Files</span>
                      <input
                        type="file"
                        accept=".pdf,.png,.jpg,.jpeg"
                        className="hidden"
                        onChange={(e) => setUploadFile(e.target.files ? e.target.files[0] : null)}
                      />
                    </label>
                  </div>
                </div>
              </div>

              {uploading && (
                <div className="space-y-1">
                  <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                    <div className="bg-blue-600 h-2 rounded-full transition-all duration-300" style={{ width: `${uploadProgress}%` }}></div>
                  </div>
                  <p className="text-[11px] text-blue-600 font-medium">Extracting text, computing SHA-256 digest, and parsing metadata...</p>
                </div>
              )}

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={uploading || !uploadFile}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs transition disabled:opacity-50 flex items-center space-x-2"
                >
                  <Upload className="w-4 h-4" />
                  <span>{uploading ? 'Processing Extraction...' : 'Upload & Run Automated Extraction'}</span>
                </button>
              </div>
            </form>

            {/* Quick 1-Click Synthetic Sample Generator Buttons */}
            <div className="pt-4 border-t border-slate-100">
              <div className="flex items-center space-x-1.5 text-xs font-bold text-slate-700 uppercase tracking-wider mb-2.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>Instant Hackathon Evaluation: Attach Pre-Configured Test Compliance Document</span>
              </div>
              <p className="text-xs text-slate-500 mb-3">
                Don't have a sample PDF ready? Click any scenario below to immediately generate, upload, and extract a live regulatory document:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                <button
                  type="button"
                  disabled={uploading}
                  onClick={() => handleAttachSample('valid_eoa')}
                  className="p-2.5 text-left rounded-lg border border-emerald-200 bg-emerald-50/60 hover:bg-emerald-100/80 transition text-xs space-y-1 group"
                >
                  <span className="font-bold text-emerald-900 flex items-center justify-between">
                    <span>Valid AICTE EoA Letter</span>
                    <span className="text-[10px] bg-emerald-200 text-emerald-800 px-1.5 py-0.5 rounded font-mono">PASS</span>
                  </span>
                  <p className="text-[11px] text-emerald-700">Matches AICTE ID ({application.institution_code}) & 420 intake.</p>
                </button>

                <button
                  type="button"
                  disabled={uploading}
                  onClick={() => handleAttachSample('expired_nba')}
                  className="p-2.5 text-left rounded-lg border border-amber-200 bg-amber-50/60 hover:bg-amber-100/80 transition text-xs space-y-1 group"
                >
                  <span className="font-bold text-amber-900 flex items-center justify-between">
                    <span>Expired NBA Certificate</span>
                    <span className="text-[10px] bg-amber-200 text-amber-800 px-1.5 py-0.5 rounded font-mono">FLAG</span>
                  </span>
                  <p className="text-[11px] text-amber-700">Contains expired validity date (2023-06-30).</p>
                </button>

                <button
                  type="button"
                  disabled={uploading}
                  onClick={() => handleAttachSample('altered_noc')}
                  className="p-2.5 text-left rounded-lg border border-rose-200 bg-rose-50/60 hover:bg-rose-100/80 transition text-xs space-y-1 group"
                >
                  <span className="font-bold text-rose-900 flex items-center justify-between">
                    <span>Altered Municipal NOC</span>
                    <span className="text-[10px] bg-rose-200 text-rose-800 px-1.5 py-0.5 rounded font-mono">ALERT</span>
                  </span>
                  <p className="text-[11px] text-rose-700">Triggers visual anomaly signal on seal area.</p>
                </button>

                <button
                  type="button"
                  disabled={uploading}
                  onClick={() => handleAttachSample('mismatched_id')}
                  className="p-2.5 text-left rounded-lg border border-purple-200 bg-purple-50/60 hover:bg-purple-100/80 transition text-xs space-y-1 group"
                >
                  <span className="font-bold text-purple-900 flex items-center justify-between">
                    <span>Branch ID Mismatch</span>
                    <span className="text-[10px] bg-purple-200 text-purple-800 px-1.5 py-0.5 rounded font-mono">MISMATCH</span>
                  </span>
                  <p className="text-[11px] text-purple-700">Contains 1-999988887 instead of institution ID.</p>
                </button>
              </div>
            </div>
          </div>

          {/* Uploaded Documents Inventory */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Submitted Supporting Documents ({documents.length})
              </span>
              <span className="text-xs text-slate-500">Click any document to inspect extracted fields</span>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
                <thead className="bg-slate-50 font-semibold text-slate-500 uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-3">Document Type</th>
                    <th className="px-6 py-3">Filename</th>
                    <th className="px-6 py-3">SHA-256 Digest</th>
                    <th className="px-6 py-3">Pages</th>
                    <th className="px-6 py-3">Extraction Status</th>
                    <th className="px-6 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {documents.length > 0 ? (
                    documents.map((d) => (
                      <tr key={d.id} className="hover:bg-slate-50 transition">
                        <td className="px-6 py-3.5 font-bold text-slate-800">{d.document_type}</td>
                        <td className="px-6 py-3.5 font-medium text-slate-600">{d.original_filename}</td>
                        <td className="px-6 py-3.5 font-mono text-slate-400">{d.sha256.substring(0, 16)}...</td>
                        <td className="px-6 py-3.5">{d.page_count}</td>
                        <td className="px-6 py-3.5">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800">
                            {d.processing_status}
                          </span>
                        </td>
                        <td className="px-6 py-3.5 text-right space-x-3">
                          <button
                            onClick={() => {
                              setSelectedDocId(d.id);
                              setActiveTab('intelligence');
                            }}
                            className="text-blue-600 hover:text-blue-800 font-semibold inline-flex items-center space-x-1"
                          >
                            <FileSearch className="w-3.5 h-3.5" />
                            <span>Inspect Lab</span>
                          </button>

                          <a
                            href={`/api/documents/${d.id}/download?token=${token}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-slate-600 hover:text-slate-900 font-semibold inline-flex items-center space-x-1"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>Download</span>
                          </a>

                          <button
                            onClick={() => handleDeleteDocument(d.id, d.original_filename)}
                            className="text-red-500 hover:text-red-700 font-semibold inline-flex items-center space-x-1"
                            title="Remove document"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-xs text-slate-400">
                        No documents attached. Upload a file above or click a sample generator to begin.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Document Intelligence Lab (Split View with PDF Viewer & OCR Text) */}
      {activeTab === 'intelligence' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Panel: Document Viewer (PDF or Extracted Text) */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
              <div className="flex items-center space-x-2">
                <FileText className="w-4 h-4 text-blue-600" />
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">Document Inspector</span>
              </div>

              <div className="flex items-center space-x-2">
                <div className="flex bg-slate-100 rounded-lg p-0.5 text-xs font-semibold">
                  <button
                    onClick={() => setInspectorMode('pdf')}
                    className={`px-2.5 py-1 rounded-md transition ${inspectorMode === 'pdf' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
                  >
                    PDF Viewer
                  </button>
                  <button
                    onClick={() => setInspectorMode('ocr')}
                    className={`px-2.5 py-1 rounded-md transition ${inspectorMode === 'ocr' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
                  >
                    OCR Text
                  </button>
                </div>

                <select
                  value={selectedDocId || ''}
                  onChange={(e) => setSelectedDocId(e.target.value)}
                  className="text-xs bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1 font-medium text-slate-700 max-w-[180px] truncate"
                >
                  {documents.map((d) => (
                    <option key={d.id} value={d.id}>{d.original_filename}</option>
                  ))}
                </select>
              </div>
            </div>

            {selectedDoc ? (
              <div className="space-y-4">
                {/* Anomaly Banner if present */}
                {selectedDoc.anomaly_flags_json && Object.keys(selectedDoc.anomaly_flags_json).length > 0 && (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs space-y-1">
                    <div className="flex items-center space-x-1.5 text-amber-800 font-bold">
                      <ShieldAlert className="w-4 h-4 text-amber-600" />
                      <span>Document Anomaly / Integrity Signal Flagged</span>
                    </div>
                    <p className="text-amber-700 leading-snug">
                      {selectedDoc.anomaly_flags_json.reason || 'Irregularity flagged during document intake.'}
                    </p>
                  </div>
                )}

                {inspectorMode === 'pdf' ? (
                  <div className="relative w-full h-[520px] rounded-lg border border-slate-200 overflow-hidden bg-slate-100">
                    <iframe
                      src={`/api/documents/${selectedDoc.id}/download?inline=true&token=${token}`}
                      className="w-full h-full"
                      title={selectedDoc.original_filename}
                    />
                  </div>
                ) : (
                  <div className="p-4 bg-slate-900 rounded-lg text-slate-200 font-mono text-xs h-[520px] overflow-y-auto whitespace-pre-wrap leading-relaxed shadow-inner">
                    {selectedDoc.extracted_text || 'No text extracted from this document.'}
                  </div>
                )}
              </div>
            ) : (
              <div className="py-24 text-center text-xs text-slate-400">
                Select a document to inspect OCR text or view PDF.
              </div>
            )}
          </div>

          {/* Right Panel: Extracted Fields with Evidence Snippets */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Extracted Fields & Evidence Snippets ({selectedDoc?.extracted_fields?.length || 0})
              </span>
              <button
                onClick={() => selectedDoc && api.reprocessDocument(selectedDoc.id).then(() => fetchApplication())}
                className="text-xs text-blue-600 hover:text-blue-800 inline-flex items-center space-x-1 font-semibold"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Re-Extract</span>
              </button>
            </div>

            <div className="space-y-3 max-h-[520px] overflow-y-auto pr-1">
              {selectedDoc?.extracted_fields && selectedDoc.extracted_fields.length > 0 ? (
                selectedDoc.extracted_fields.map((f) => (
                  <div key={f.id} className="p-3.5 rounded-lg border border-slate-200 bg-slate-50/70 space-y-1.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800 font-mono uppercase">{f.field_name.replace(/_/g, ' ')}</span>
                      <span className="bg-blue-100 text-blue-800 text-[10px] px-2 py-0.5 rounded font-semibold">
                        {(f.confidence * 100).toFixed(0)}% Confidence • Page {f.page_number}
                      </span>
                    </div>
                    <div className="p-2.5 bg-white rounded border border-slate-200 font-semibold text-slate-900 text-sm">
                      {f.field_value}
                    </div>
                    {f.evidence_snippet && (
                      <div className="text-[11px] text-slate-500 italic bg-slate-100/90 p-2 rounded">
                        "{f.evidence_snippet}"
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="py-24 text-center text-xs text-slate-400">
                  No structured fields extracted for this document.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Regulatory Compliance Findings */}
      {activeTab === 'findings' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-800">Deterministic Compliance Engine Findings</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Every finding retains exact rule provenance, observed value, expected condition, and audit status.
              </p>
            </div>
            <span className="text-xs font-semibold bg-slate-100 text-slate-700 px-3 py-1 rounded-full border border-slate-300">
              {findings.length} Active Findings
            </span>
          </div>

          <div className="divide-y divide-slate-100">
            {findings.length > 0 ? (
              findings.map((f) => (
                <div key={f.id} className="p-5 space-y-3 hover:bg-slate-50/60 transition">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center space-x-2">
                      <span className="font-mono text-xs font-bold text-slate-900 bg-slate-100 px-2 py-1 rounded">
                        {f.rule_code} (v{f.rule_version})
                      </span>
                      <span
                        className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                          f.severity === 'critical'
                            ? 'bg-red-100 text-red-800'
                            : f.severity === 'high'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {f.severity}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase bg-slate-200 text-slate-700">
                        {f.status}
                      </span>
                    </div>

                    {/* Officer Action Buttons */}
                    {(isOfficer || isAdmin) && f.status === 'open' && (
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleOpenReviewModal(f.id, 'confirm_finding')}
                          className="px-2.5 py-1 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-semibold rounded border border-red-200"
                        >
                          Confirm
                        </button>
                        <button
                          onClick={() => handleOpenReviewModal(f.id, 'dismiss_finding')}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded border border-slate-300"
                        >
                          Dismiss
                        </button>
                      </div>
                    )}
                  </div>

                  <p className="text-xs font-medium text-slate-800 leading-relaxed">{f.explanation}</p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-slate-50 p-3 rounded-lg border border-slate-200">
                    <div>
                      <span className="text-slate-400 uppercase font-semibold text-[10px]">Expected Condition</span>
                      <p className="font-medium text-slate-700">{f.expected_value || 'Compliant with Handbook Norms'}</p>
                    </div>
                    <div>
                      <span className="text-slate-400 uppercase font-semibold text-[10px]">Observed Submission Value</span>
                      <p className="font-bold text-red-600">{f.observed_value || 'Non-compliant or missing'}</p>
                    </div>
                  </div>

                  {f.suggested_action && (
                    <div className="text-xs text-blue-700 bg-blue-50/70 p-2.5 rounded border border-blue-100 flex items-center space-x-1.5">
                      <ChevronRight className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                      <span><b>Suggested Next Action:</b> {f.suggested_action}</span>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="py-16 text-center text-xs text-slate-400">
                All evaluated rules passed! Zero open findings for this application.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 4: Source Verification Centre */}
      {activeTab === 'verification' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-800">External Authority Sandbox Verification</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Synthetic verification adapters querying NBA registries, State DTE databases, and AICTE registries.
              </p>
            </div>
          </div>

          <div className="divide-y divide-slate-100">
            {verifications.length > 0 ? (
              verifications.map((v) => (
                <div key={v.id} className="p-5 space-y-2 hover:bg-slate-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-xs text-slate-900">{v.source_name}</span>
                      <span className="font-mono text-xs text-slate-500">Ref: {v.reference_number}</span>
                    </div>
                    <span
                      className={`text-xs px-2.5 py-0.5 rounded-full font-bold uppercase ${
                        v.status === 'verified'
                          ? 'bg-emerald-100 text-emerald-800'
                          : v.status === 'expired'
                          ? 'bg-amber-100 text-amber-800'
                          : v.status === 'source_unavailable'
                          ? 'bg-slate-200 text-slate-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {v.status.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">{v.response_summary}</p>
                  <p className="text-[11px] text-slate-400 font-mono">Attempted: {v.checked_at} • Connector: {v.source_type}</p>
                </div>
              ))
            ) : (
              <div className="py-12 text-center text-xs text-slate-400">
                No external verifications recorded yet. Run validation to trigger automated authority verification.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 5: Overview & Application Data */}
      {activeTab === 'overview' && (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-6">
          <h2 className="text-base font-bold text-slate-900 border-b pb-2">Institutional Submission Form Data</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="p-3 bg-slate-50 rounded-lg space-y-1">
              <span className="text-slate-500 uppercase tracking-wider font-semibold">Institution Name</span>
              <p className="text-sm font-bold text-slate-800">{application.institution_name}</p>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg space-y-1">
              <span className="text-slate-500 uppercase tracking-wider font-semibold">AICTE Permanent Identifier</span>
              <p className="text-sm font-mono font-bold text-slate-800">{application.institution_code}</p>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg space-y-1">
              <span className="text-slate-500 uppercase tracking-wider font-semibold">Total Approved Intake</span>
              <p className="text-sm font-bold text-blue-600">{appData.total_approved_intake || 'N/A'} Seats</p>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg space-y-1">
              <span className="text-slate-500 uppercase tracking-wider font-semibold">Principal / Director</span>
              <p className="text-sm font-bold text-slate-800">{appData.principal_name || 'N/A'}</p>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg space-y-1">
              <span className="text-slate-500 uppercase tracking-wider font-semibold">Contact Email</span>
              <p className="text-sm font-bold text-slate-800">{appData.contact_email || 'N/A'}</p>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg space-y-1">
              <span className="text-slate-500 uppercase tracking-wider font-semibold">Campus Land Area</span>
              <p className="text-sm font-bold text-slate-800">{appData.land_area_sqm ? `${appData.land_area_sqm} SQM` : 'N/A'}</p>
            </div>
          </div>
        </div>
      )}

      {/* Tab 6: Officer Review Workspace & Rectification */}
      {activeTab === 'review' && (
        <div className="space-y-6">
          {(isOfficer || isAdmin) && (
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Officer Regulatory Actions</h3>
                <p className="text-xs text-slate-500">Record statutory observations or formal rectification notices.</p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => setRectModalOpen(true)}
                  className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-semibold shadow-xs"
                >
                  Issue Rectification Request
                </button>
                <button
                  onClick={() => handleOpenReviewModal('', 'escalate')}
                  className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold shadow-xs"
                >
                  Escalate for Inspection
                </button>
                <button
                  onClick={() => handleOpenReviewModal('', 'complete_review')}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs"
                >
                  Conclude Case Review
                </button>
              </div>
            </div>
          )}

          {/* Historical Review Actions List */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 font-semibold text-xs text-slate-800">
              Formal Officer Review Trail ({reviews.length})
            </div>
            <div className="divide-y divide-slate-100">
              {reviews.length > 0 ? (
                reviews.map((r) => (
                  <div key={r.id} className="p-4 space-y-1.5 text-xs">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-slate-900">{r.actor_name}</span>
                        <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded text-[10px] font-semibold uppercase">
                          {r.action_type.replace(/_/g, ' ')}
                        </span>
                      </div>
                      <span className="text-slate-400 text-[11px] font-mono">{r.created_at}</span>
                    </div>
                    <p className="text-slate-700 font-medium"><b>Mandatory Reason:</b> {r.reason}</p>
                    {r.notes && <p className="text-slate-500"><b>Observations:</b> {r.notes}</p>}
                  </div>
                ))
              ) : (
                <div className="py-12 text-center text-xs text-slate-400">
                  No review actions recorded yet.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tab 7: Audit Trail */}
      {activeTab === 'reports' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Immutable Application Audit Trail
            </span>
            <button
              onClick={loadAuditTrail}
              className="p-1 text-slate-400 hover:text-slate-600"
              title="Refresh Audit"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="divide-y divide-slate-100 max-h-96 overflow-y-auto">
            {auditEvents.length > 0 ? (
              auditEvents.map((evt) => (
                <div key={evt.id} className="p-3.5 text-xs flex items-start justify-between gap-4 hover:bg-slate-50">
                  <div className="space-y-0.5">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-slate-800 font-mono text-[11px]">{evt.action}</span>
                      <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-mono">
                        {evt.entity_type}
                      </span>
                    </div>
                    <p className="text-slate-600">Actor: <span className="font-semibold">{evt.actor_name}</span></p>
                    <p className="text-[11px] text-slate-400 font-mono">
                      {JSON.stringify(evt.details_json)}
                    </p>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono shrink-0">{evt.created_at}</span>
                </div>
              ))
            ) : (
              <div className="py-12 text-center text-xs text-slate-400">
                Click refresh to load audit trail events.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Review Modal */}
      {reviewModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-slate-900">
              Officer Action: {reviewActionType.replace(/_/g, ' ').toUpperCase()}
            </h3>
            <p className="text-xs text-slate-500">
              Pursuant to AICTE regulations, all officer determinations require a mandatory recorded reason.
            </p>

            <form onSubmit={handleSubmitReview} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Mandatory Justification / Reason *
                </label>
                <textarea
                  required
                  rows={3}
                  value={reviewReason}
                  onChange={(e) => setReviewReason(e.target.value)}
                  placeholder="State the official basis for confirming, dismissing or escalating this issue..."
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Additional Notes (Optional)
                </label>
                <input
                  type="text"
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  placeholder="Internal reference or order details"
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setReviewModalOpen(false)}
                  className="px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingReview}
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs"
                >
                  {submittingReview ? 'Submitting...' : 'Record Decision'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Rectification Request Modal */}
      {rectModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-slate-900">Issue Formal Rectification Notice</h3>
            <p className="text-xs text-slate-500">
              The application status will be updated to <b>Rectification Required</b> and notified to the institution.
            </p>

            <form onSubmit={handleRequestRectification} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Rectification Instructions & Deficiency Notice *
                </label>
                <textarea
                  required
                  rows={3}
                  value={rectNotes}
                  onChange={(e) => setRectNotes(e.target.value)}
                  placeholder="Detail the exact deficiency requiring institutional rectification..."
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Requested Replacement Document Types (comma-separated)
                </label>
                <input
                  type="text"
                  value={rectDocs}
                  onChange={(e) => setRectDocs(e.target.value)}
                  placeholder="e.g. LAND_NOC, NBA_ACCREDITATION"
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-lg font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setRectModalOpen(false)}
                  className="px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingReview}
                  className="px-4 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-semibold shadow-xs"
                >
                  {submittingReview ? 'Issuing Notice...' : 'Issue Rectification Notice'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
