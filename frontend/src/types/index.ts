export type UserRole = 'INSTITUTION_USER' | 'REGULATORY_OFFICER' | 'ADMIN';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  full_name: string;
  institution_id?: string | null;
  institution_name?: string | null;
  institution_code?: string | null;
  is_active: boolean;
}

export interface Institution {
  id: string;
  institution_code: string;
  name: string;
  state: string;
  metadata_json: Record<string, any>;
  created_at: string;
}

export interface ExtractedField {
  id: string;
  document_id: string;
  field_name: string;
  field_value: string;
  confidence: number;
  page_number: number;
  bounding_box?: Record<string, any> | null;
  evidence_snippet?: string | null;
  extraction_method: string;
  created_at: string;
}

export interface Document {
  id: string;
  application_id: string;
  document_type: string;
  original_filename: string;
  mime_type: string;
  file_size: number;
  sha256: string;
  processing_status: 'uploaded' | 'processing' | 'processed' | 'failed';
  page_count: number;
  classification_confidence: number;
  metadata_json: Record<string, any>;
  anomaly_flags_json: Record<string, any>;
  uploaded_by: string;
  created_at: string;
  extracted_text?: string | null;
  extracted_fields?: ExtractedField[];
}

export interface Finding {
  id: string;
  application_id: string;
  rule_id?: string | null;
  rule_code: string;
  rule_version: number;
  document_id?: string | null;
  finding_type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'confirmed' | 'dismissed' | 'resolved' | 'superseded';
  expected_value?: string | null;
  observed_value?: string | null;
  explanation: string;
  evidence_json: { items?: any[] };
  suggested_action?: string | null;
  created_at: string;
  updated_at: string;
}

export interface VerificationAttempt {
  id: string;
  document_id?: string | null;
  application_id: string;
  source_name: string;
  source_type: string;
  reference_number: string;
  status: 'verified' | 'mismatch_detected' | 'expired' | 'verification_pending' | 'source_unavailable' | 'manual_review_required' | 'not_supported';
  request_summary: string;
  response_summary: string;
  checked_at: string;
  error_code?: string | null;
  created_by: string;
}

export interface ReviewAction {
  id: string;
  application_id: string;
  finding_id?: string | null;
  actor_id: string;
  actor_name: string;
  action_type: string;
  reason: string;
  notes?: string | null;
  created_at: string;
}

export interface AuditEvent {
  id: string;
  application_id?: string | null;
  actor_id: string;
  actor_name: string;
  action: string;
  entity_type: string;
  entity_id: string;
  details_json: Record<string, any>;
  correlation_id: string;
  created_at: string;
}

export interface Application {
  id: string;
  application_number: string;
  institution_id: string;
  institution_name?: string | null;
  institution_code?: string | null;
  category: string;
  academic_year: string;
  status: string;
  application_data_json: Record<string, any>;
  submitted_at?: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  documents?: Document[];
  findings?: Finding[];
  verification_attempts?: VerificationAttempt[];
  review_actions?: ReviewAction[];
}

export interface DashboardSummary {
  total_applications: number;
  draft_applications: number;
  under_processing: number;
  awaiting_officer_review: number;
  rectification_required: number;
  pending_verification: number;
  unresolved_anomalies: number;
  average_processing_time_sec?: number | null;
  status_distribution: Record<string, number>;
  recent_applications: Application[];
  critical_findings: Finding[];
}

export interface RegulatoryRule {
  id: string;
  rule_code: string;
  version: number;
  title: string;
  description: string;
  category: string;
  document_type?: string | null;
  rule_definition: Record<string, any>;
  source_document: string;
  source_section: string;
  source_page: string;
  source_url?: string | null;
  effective_from: string;
  effective_to?: string | null;
  verification_status: string;
  publication_status: string;
  created_by: string;
  approved_by?: string | null;
  created_at: string;
  published_at?: string | null;
}
