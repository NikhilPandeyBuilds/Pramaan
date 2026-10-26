import React, { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { RegulatoryRule } from '../types';
import { useAuth } from '../context/AuthContext';
import { BookOpen, PlusCircle, CheckCircle, Clock, ShieldCheck, History, ExternalLink } from 'lucide-react';

export const RulesAdmin: React.FC = () => {
  const { isAdmin } = useAuth();
  const [rules, setRules] = useState<RegulatoryRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState('');

  // Version modal state
  const [versionModalRule, setVersionModalRule] = useState<RegulatoryRule | null>(null);
  const [ruleVersions, setRuleVersions] = useState<RegulatoryRule[]>([]);

  // Create rule modal state
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [newRule, setNewRule] = useState({
    rule_code: '',
    title: '',
    description: '',
    category: 'EOA',
    document_type: 'APPROVAL_LETTER',
    check_type: 'required_document_present',
    severity: 'high',
    source_document: 'AICTE Approval Process Handbook 2026-27',
    source_section: 'Chapter II, Clause 2.1',
    source_page: 'Page 35',
  });

  const fetchRules = async () => {
    setLoading(true);
    try {
      const data = await api.getRules({ category: categoryFilter || undefined });
      setRules(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRules();
  }, [categoryFilter]);

  const handleOpenVersions = async (rule: RegulatoryRule) => {
    setVersionModalRule(rule);
    try {
      const vers = await api.getRuleVersions(rule.id);
      setRuleVersions(vers);
    } catch (err) {
      console.error(err);
    }
  };

  const handlePublishRule = async (ruleId: string) => {
    const reason = prompt('Mandatory: State the regulatory basis or gazette notification for publishing this rule version:');
    if (!reason || reason.trim().length < 5) {
      alert('A valid reason (minimum 5 characters) is required to publish a rule.');
      return;
    }
    try {
      await api.publishRule(ruleId, reason);
      alert('Rule version published successfully.');
      fetchRules();
    } catch (err: any) {
      alert(`Publish failed: ${err.message}`);
    }
  };

  const handleCreateRule = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createRule({
        rule_code: newRule.rule_code,
        title: newRule.title,
        description: newRule.description,
        category: newRule.category,
        document_type: newRule.document_type || undefined,
        rule_definition: {
          check_type: newRule.check_type,
          document_type: newRule.document_type,
          severity: newRule.severity,
        },
        source_document: newRule.source_document,
        source_section: newRule.source_section,
        source_page: newRule.source_page,
      });
      setCreateModalOpen(false);
      fetchRules();
    } catch (err: any) {
      alert(`Failed to create rule: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-slate-200 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Regulatory Rules Administration</h1>
          <p className="text-sm text-slate-500 mt-1">
            Declarative regulatory rule definitions, source mappings to the AICTE Approval Process Handbook, and versioning.
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={() => setCreateModalOpen(true)}
            className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs transition"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Configure New Rule Draft</span>
          </button>
        )}
      </div>

      {/* Filter */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Category:</span>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 font-medium text-slate-700"
          >
            <option value="">All Categories</option>
            <option value="EOA">Extension of Approval (EOA)</option>
            <option value="INFRASTRUCTURE">Infrastructure Norms</option>
            <option value="ACCREDITATION">Accreditation (NBA)</option>
            <option value="GOVERNANCE">Governance & Identity</option>
            <option value="INTEGRITY">Document Integrity</option>
          </select>
        </div>
        <span className="text-xs font-semibold text-slate-500">{rules.length} Rules Configured</span>
      </div>

      {/* Rules List */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-sm text-slate-500">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
            Loading regulatory rule registry...
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {rules.map((rule) => (
              <div key={rule.id} className="p-5 flex flex-col md:flex-row md:items-start justify-between gap-4 hover:bg-slate-50">
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-xs font-bold text-slate-900 bg-slate-100 px-2.5 py-1 rounded">
                      {rule.rule_code}
                    </span>
                    <span className="text-[10px] bg-blue-50 text-blue-700 font-mono px-2 py-0.5 rounded font-bold">
                      Version {rule.version}
                    </span>
                    <span
                      className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                        rule.publication_status === 'published'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {rule.publication_status}
                    </span>
                    <span className="text-xs text-slate-400 font-medium">Category: {rule.category}</span>
                  </div>

                  <h3 className="text-sm font-bold text-slate-900">{rule.title}</h3>
                  <p className="text-xs text-slate-600 leading-relaxed max-w-3xl">{rule.description}</p>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-500 bg-slate-50 p-2 rounded border border-slate-200">
                    <span><b>Source:</b> {rule.source_document}</span>
                    <span>•</span>
                    <span><b>Section:</b> {rule.source_section}</span>
                    <span>•</span>
                    <span><b>Ref:</b> {rule.source_page}</span>
                    <span>•</span>
                    <span className="text-emerald-700 font-semibold">Status: {rule.verification_status}</span>
                  </div>
                </div>

                <div className="flex items-center space-x-2 shrink-0">
                  <button
                    onClick={() => handleOpenVersions(rule)}
                    className="inline-flex items-center space-x-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-xs font-semibold"
                  >
                    <History className="w-3.5 h-3.5" />
                    <span>History</span>
                  </button>

                  {isAdmin && rule.publication_status === 'draft' && (
                    <button
                      onClick={() => handlePublishRule(rule.id)}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-semibold shadow-xs"
                    >
                      Publish
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Version History Modal */}
      {versionModalRule && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-slate-900">
              Version History for {versionModalRule.rule_code}
            </h3>
            <p className="text-xs text-slate-500">
              Regulatory compliance findings strictly bind to the exact rule version at time of evaluation.
            </p>

            <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto">
              {ruleVersions.map((v) => (
                <div key={v.id} className="py-2.5 text-xs space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-slate-900">Version {v.version}</span>
                    <span className="text-[10px] font-mono bg-slate-100 px-2 py-0.5 rounded">{v.publication_status}</span>
                  </div>
                  <p className="text-slate-600">{v.title}</p>
                  <p className="text-[11px] text-slate-400 font-mono">Published: {v.published_at || 'In Draft'}</p>
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setVersionModalRule(null)}
                className="px-4 py-2 bg-slate-800 text-white rounded-lg text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Draft Rule Modal */}
      {createModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-slate-900">Configure New Regulatory Rule Draft</h3>
            <p className="text-xs text-slate-500">
              Rules must cite authorized AICTE handbook sections. Executable code entries are restricted.
            </p>

            <form onSubmit={handleCreateRule} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Rule Code *</label>
                  <input
                    type="text"
                    required
                    value={newRule.rule_code}
                    onChange={(e) => setNewRule({ ...newRule, rule_code: e.target.value })}
                    placeholder="e.g. FAC-RATIO-002"
                    className="w-full text-xs p-2 border border-slate-300 rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Category</label>
                  <select
                    value={newRule.category}
                    onChange={(e) => setNewRule({ ...newRule, category: e.target.value })}
                    className="w-full text-xs p-2 border border-slate-300 rounded-lg"
                  >
                    <option value="EOA">EOA</option>
                    <option value="INFRASTRUCTURE">INFRASTRUCTURE</option>
                    <option value="ACCREDITATION">ACCREDITATION</option>
                    <option value="GOVERNANCE">GOVERNANCE</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Rule Title *</label>
                <input
                  type="text"
                  required
                  value={newRule.title}
                  onChange={(e) => setNewRule({ ...newRule, title: e.target.value })}
                  placeholder="e.g. Faculty Cadre Ratio Verification"
                  className="w-full text-xs p-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Description *</label>
                <textarea
                  required
                  rows={2}
                  value={newRule.description}
                  onChange={(e) => setNewRule({ ...newRule, description: e.target.value })}
                  placeholder="Detailed regulatory requirement description..."
                  className="w-full text-xs p-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Check Type</label>
                  <select
                    value={newRule.check_type}
                    onChange={(e) => setNewRule({ ...newRule, check_type: e.target.value })}
                    className="w-full text-xs p-2 border border-slate-300 rounded-lg"
                  >
                    <option value="required_document_present">Required Document Present</option>
                    <option value="date_validity_not_expired">Date Validity Check</option>
                    <option value="identifier_equality">Identifier Match Check</option>
                    <option value="duplicate_detection">Duplicate Submission Check</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Severity</label>
                  <select
                    value={newRule.severity}
                    onChange={(e) => setNewRule({ ...newRule, severity: e.target.value })}
                    className="w-full text-xs p-2 border border-slate-300 rounded-lg"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-semibold text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold"
                >
                  Save Rule Draft
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
