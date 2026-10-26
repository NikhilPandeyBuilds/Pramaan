import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { Check, ArrowRight, ArrowLeft, Building, Layers, GraduationCap, CheckCircle, AlertCircle } from 'lucide-react';

export const NewApplication: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [currentStep, setCurrentStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    institution_code: user?.institution_code || '1-109283741',
    institution_name: user?.institution_name || 'Apex Institute of Engineering & Technology',
    state: 'Maharashtra',
    category: 'EOA',
    academic_year: '2026-27',
    programme: 'Engineering & Technology',
    total_approved_intake: '420',
    principal_name: 'Dr. R. K. Sharma',
    contact_email: user?.email || 'principal@apex.edu',
    land_area_sqm: '25000'
  });

  const steps = [
    { id: 1, title: 'Institution Info', icon: Building },
    { id: 2, title: 'Category & Year', icon: Layers },
    { id: 3, title: 'Intake & Programme', icon: GraduationCap },
    { id: 4, title: 'Checklist & Review', icon: CheckCircle },
  ];

  const handleNext = () => {
    setError(null);
    if (currentStep === 1 && (!formData.institution_code || !formData.institution_name)) {
      setError('Please provide valid institution code and name.');
      return;
    }
    if (currentStep === 3 && !formData.total_approved_intake) {
      setError('Please provide approved intake.');
      return;
    }
    setCurrentStep((prev) => Math.min(prev + 1, 4));
  };

  const handleBack = () => {
    setError(null);
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const handleSubmit = async (submitDirectly: boolean = false) => {
    setSubmitting(true);
    setError(null);
    try {
      const app = await api.createApplication({
        category: formData.category,
        academic_year: formData.academic_year,
        application_data_json: {
          institution_code: formData.institution_code,
          institution_name: formData.institution_name,
          state: formData.state,
          programme: formData.programme,
          total_approved_intake: formData.total_approved_intake,
          principal_name: formData.principal_name,
          contact_email: formData.contact_email,
          land_area_sqm: formData.land_area_sqm,
        }
      });

      if (submitDirectly) {
        await api.submitApplication(app.id);
      }

      navigate(`/applications/${app.id}`);
    } catch (err: any) {
      setError(err.message || 'Failed to create application.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Create Institutional Application</h1>
        <p className="text-sm text-slate-500 mt-1">
          Follow the regulatory wizard to register your institutional proposal for Academic Year 2026-27.
        </p>
      </div>

      {/* Wizard Step Indicator */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-center justify-between">
          {steps.map((s, idx) => {
            const Icon = s.icon;
            const isCompleted = currentStep > s.id;
            const isCurrent = currentStep === s.id;

            return (
              <React.Fragment key={s.id}>
                <div className="flex items-center space-x-2">
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center font-semibold text-xs transition ${
                      isCompleted
                        ? 'bg-emerald-600 text-white'
                        : isCurrent
                        ? 'bg-blue-600 text-white ring-4 ring-blue-100'
                        : 'bg-slate-100 text-slate-400'
                    }`}
                  >
                    {isCompleted ? <Check className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                  </div>
                  <span
                    className={`text-xs font-semibold hidden sm:inline ${
                      isCurrent ? 'text-slate-900' : 'text-slate-400'
                    }`}
                  >
                    {s.title}
                  </span>
                </div>
                {idx < steps.length - 1 && (
                  <div
                    className={`flex-1 h-0.5 mx-3 ${
                      currentStep > s.id ? 'bg-emerald-500' : 'bg-slate-200'
                    }`}
                  />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3.5 flex items-center space-x-3 text-red-700 text-sm">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Step Content */}
      <div className="bg-white p-6 sm:p-8 rounded-xl border border-slate-200 shadow-xs space-y-6">
        {currentStep === 1 && (
          <div className="space-y-4">
            <h2 className="text-base font-bold text-slate-900 border-b pb-2">Step 1: Institutional Details</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Permanent AICTE ID</label>
                <input
                  type="text"
                  value={formData.institution_code}
                  onChange={(e) => setFormData({ ...formData, institution_code: e.target.value })}
                  className="w-full text-sm bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 font-mono"
                  placeholder="e.g. 1-109283741"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">State / UT</label>
                <select
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                  className="w-full text-sm bg-slate-50 border border-slate-300 rounded-lg px-3 py-2"
                >
                  <option value="Maharashtra">Maharashtra</option>
                  <option value="Karnataka">Karnataka</option>
                  <option value="Uttar Pradesh">Uttar Pradesh</option>
                  <option value="Tamil Nadu">Tamil Nadu</option>
                  <option value="Delhi">Delhi</option>
                  <option value="Gujarat">Gujarat</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">Full Institution Legal Name</label>
                <input
                  type="text"
                  value={formData.institution_name}
                  onChange={(e) => setFormData({ ...formData, institution_name: e.target.value })}
                  className="w-full text-sm bg-slate-50 border border-slate-300 rounded-lg px-3 py-2"
                  placeholder="Official name as recorded in State Gazette / AICTE Registry"
                />
              </div>
            </div>
          </div>
        )}

        {currentStep === 2 && (
          <div className="space-y-4">
            <h2 className="text-base font-bold text-slate-900 border-b pb-2">Step 2: Regulatory Category & Academic Year</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Application Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full text-sm bg-slate-50 border border-slate-300 rounded-lg px-3 py-2"
                >
                  <option value="EOA">Extension of Approval (EoA)</option>
                  <option value="NEW_INSTITUTION">Setting up New Technical Institution</option>
                  <option value="INCREASE_INTAKE">Increase in Intake / Additional Course</option>
                  <option value="NEW_PROGRAMME">Introduction of New Programme</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Academic Year</label>
                <input
                  type="text"
                  disabled
                  value={formData.academic_year}
                  className="w-full text-sm bg-slate-100 border border-slate-300 rounded-lg px-3 py-2 font-mono text-slate-500"
                />
              </div>
            </div>
          </div>
        )}

        {currentStep === 3 && (
          <div className="space-y-4">
            <h2 className="text-base font-bold text-slate-900 border-b pb-2">Step 3: Programme, Intake & Campus Details</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Primary Discipline / Programme</label>
                <input
                  type="text"
                  value={formData.programme}
                  onChange={(e) => setFormData({ ...formData, programme: e.target.value })}
                  className="w-full text-sm bg-slate-50 border border-slate-300 rounded-lg px-3 py-2"
                  placeholder="e.g. Engineering & Technology"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Total Sanctioned / Proposed Intake</label>
                <input
                  type="number"
                  value={formData.total_approved_intake}
                  onChange={(e) => setFormData({ ...formData, total_approved_intake: e.target.value })}
                  className="w-full text-sm bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 font-mono"
                  placeholder="e.g. 420"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Principal / Director Name</label>
                <input
                  type="text"
                  value={formData.principal_name}
                  onChange={(e) => setFormData({ ...formData, principal_name: e.target.value })}
                  className="w-full text-sm bg-slate-50 border border-slate-300 rounded-lg px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Official Contact Email</label>
                <input
                  type="email"
                  value={formData.contact_email}
                  onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                  className="w-full text-sm bg-slate-50 border border-slate-300 rounded-lg px-3 py-2"
                />
              </div>
            </div>
          </div>
        )}

        {currentStep === 4 && (
          <div className="space-y-6">
            <h2 className="text-base font-bold text-slate-900 border-b pb-2">Step 4: Supporting Checklist & Final Review</h2>

            {/* Checklist guidance */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-blue-900">
                Applicable AICTE Mandatory Checklist (APH 2026-27):
              </h3>
              <ul className="text-xs text-blue-800 space-y-1 list-disc list-inside">
                <li><b>Previous Year EoA Order:</b> Mandatory for Extension of Approval validation (Rule: EOA-DOC-001)</li>
                <li><b>Land & Fire Safety NOC:</b> Competent authority clearance (Rule: EOA-NOC-002)</li>
                <li><b>NBA Accreditation Certificate:</b> If claiming NBA accreditation benefits (Rule: NBA-VALID-003)</li>
              </ul>
              <p className="text-[11px] text-blue-700 mt-2">
                * Note: Documents can be uploaded immediately after application creation in the Document Intelligence Lab.
              </p>
            </div>

            <div className="bg-slate-50 rounded-lg p-4 border border-slate-200 text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">Institution:</span>
                <span className="font-semibold text-slate-900">{formData.institution_name} ({formData.institution_code})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Category & Year:</span>
                <span className="font-semibold text-slate-900">{formData.category} — {formData.academic_year}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Sanctioned Intake:</span>
                <span className="font-semibold text-slate-900">{formData.total_approved_intake} seats</span>
              </div>
            </div>
          </div>
        )}

        {/* Wizard Controls */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-200">
          {currentStep > 1 ? (
            <button
              type="button"
              onClick={handleBack}
              className="inline-flex items-center space-x-1.5 px-4 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </button>
          ) : <div />}

          {currentStep < 4 ? (
            <button
              type="button"
              onClick={handleNext}
              className="inline-flex items-center space-x-1.5 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-sm transition"
            >
              <span>Next Step</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <div className="flex items-center space-x-3">
              <button
                type="button"
                disabled={submitting}
                onClick={() => handleSubmit(false)}
                className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
              >
                Save as Draft
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={() => handleSubmit(true)}
                className="inline-flex items-center space-x-1.5 px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-sm transition"
              >
                <span>{submitting ? 'Creating...' : 'Create & Proceed to Dossier'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
