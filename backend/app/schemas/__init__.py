from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List, Dict, Any
from datetime import datetime

# --- Auth & User ---
class UserLogin(BaseModel):
    email: str
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: "UserOut"

class UserOut(BaseModel):
    id: str
    email: str
    role: str
    full_name: str
    institution_id: Optional[str] = None
    institution_name: Optional[str] = None
    institution_code: Optional[str] = None
    is_active: bool

    class Config:
        from_attributes = True

# --- Institution ---
class InstitutionOut(BaseModel):
    id: str
    institution_code: str
    name: str
    state: str
    metadata_json: Dict[str, Any] = {}
    created_at: datetime

    class Config:
        from_attributes = True

# --- Document & Extracted Fields ---
class ExtractedFieldOut(BaseModel):
    id: str
    document_id: str
    field_name: str
    field_value: str
    confidence: float
    page_number: int
    bounding_box: Optional[Dict[str, Any]] = None
    evidence_snippet: Optional[str] = None
    extraction_method: str
    created_at: datetime

    class Config:
        from_attributes = True

class DocumentOut(BaseModel):
    id: str
    application_id: str
    document_type: str
    original_filename: str
    mime_type: str
    file_size: int
    sha256: str
    processing_status: str
    page_count: int
    classification_confidence: float
    metadata_json: Dict[str, Any] = {}
    anomaly_flags_json: Dict[str, Any] = {}
    uploaded_by: str
    created_at: datetime

    class Config:
        from_attributes = True

class DocumentDetailOut(DocumentOut):
    extracted_text: Optional[str] = None
    extracted_fields: List[ExtractedFieldOut] = []

# --- Finding ---
class FindingOut(BaseModel):
    id: str
    application_id: str
    rule_id: Optional[str] = None
    rule_code: str
    rule_version: int = 1
    document_id: Optional[str] = None
    finding_type: str
    severity: str
    status: str
    expected_value: Optional[str] = None
    observed_value: Optional[str] = None
    explanation: str
    evidence_json: Dict[str, Any] = {}
    suggested_action: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# --- Verification ---
class VerificationAttemptOut(BaseModel):
    id: str
    document_id: Optional[str] = None
    application_id: str
    source_name: str
    source_type: str
    reference_number: str
    status: str
    request_summary: str
    response_summary: str
    checked_at: datetime
    error_code: Optional[str] = None
    created_by: str

    class Config:
        from_attributes = True

# --- Review Action ---
class ReviewActionCreate(BaseModel):
    action_type: str  # confirm_finding, dismiss_finding, request_rectification, escalate, record_observation
    finding_id: Optional[str] = None
    reason: str
    notes: Optional[str] = None

class ReviewActionOut(BaseModel):
    id: str
    application_id: str
    finding_id: Optional[str] = None
    actor_id: str
    actor_name: str
    action_type: str
    reason: str
    notes: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class RectificationRequest(BaseModel):
    rectification_notes: str
    requested_fields: List[str] = []
    requested_documents: List[str] = []

# --- Regulatory Rule ---
class RegulatoryRuleCreate(BaseModel):
    rule_code: str
    title: str
    description: str
    category: str
    document_type: Optional[str] = None
    rule_definition: Dict[str, Any]
    source_document: str
    source_section: str
    source_page: str
    source_url: Optional[str] = None
    verification_status: str = "verified"

class RegulatoryRuleUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    rule_definition: Optional[Dict[str, Any]] = None
    source_document: Optional[str] = None
    source_section: Optional[str] = None
    source_page: Optional[str] = None
    publication_status: Optional[str] = None
    change_reason: Optional[str] = None

class RegulatoryRuleOut(BaseModel):
    id: str
    rule_code: str
    version: int
    title: str
    description: str
    category: str
    document_type: Optional[str] = None
    rule_definition: Dict[str, Any]
    source_document: str
    source_section: str
    source_page: str
    source_url: Optional[str] = None
    effective_from: datetime
    effective_to: Optional[datetime] = None
    verification_status: str
    publication_status: str
    created_by: str
    approved_by: Optional[str] = None
    created_at: datetime
    published_at: Optional[datetime] = None

    class Config:
        from_attributes = True

# --- Audit Event ---
class AuditEventOut(BaseModel):
    id: str
    application_id: Optional[str] = None
    actor_id: str
    actor_name: str
    action: str
    entity_type: str
    entity_id: str
    details_json: Dict[str, Any]
    correlation_id: str
    created_at: datetime

    class Config:
        from_attributes = True

# --- Application ---
class ApplicationCreate(BaseModel):
    institution_id: Optional[str] = None
    category: str = "EOA"
    academic_year: str = "2026-27"
    application_data_json: Dict[str, Any] = {}

class ApplicationUpdate(BaseModel):
    category: Optional[str] = None
    academic_year: Optional[str] = None
    application_data_json: Optional[Dict[str, Any]] = None

class ApplicationOut(BaseModel):
    id: str
    application_number: str
    institution_id: str
    institution_name: Optional[str] = None
    institution_code: Optional[str] = None
    category: str
    academic_year: str
    status: str
    application_data_json: Dict[str, Any] = {}
    submitted_at: Optional[datetime] = None
    created_by: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class ApplicationDetailOut(ApplicationOut):
    documents: List[DocumentOut] = []
    findings: List[FindingOut] = []
    verification_attempts: List[VerificationAttemptOut] = []
    review_actions: List[ReviewActionOut] = []

# --- Dashboard Summary ---
class DashboardSummaryOut(BaseModel):
    total_applications: int
    draft_applications: int
    under_processing: int
    awaiting_officer_review: int
    rectification_required: int
    pending_verification: int
    unresolved_anomalies: int
    average_processing_time_sec: Optional[float] = None
    status_distribution: Dict[str, int]
    recent_applications: List[ApplicationOut]
    critical_findings: List[FindingOut]
