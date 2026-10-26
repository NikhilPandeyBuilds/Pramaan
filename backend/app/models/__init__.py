import uuid
from datetime import datetime, timezone
from typing import Optional, List, Any, Dict
from sqlalchemy import String, Integer, Float, Boolean, DateTime, Text, JSON, ForeignKey, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base

def gen_uuid() -> str:
    return str(uuid.uuid4())

def utc_now() -> datetime:
    return datetime.now(timezone.utc)

class Institution(Base):
    __tablename__ = "institutions"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=gen_uuid)
    institution_code: Mapped[str] = mapped_column(String(64), unique=True, index=True, nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    state: Mapped[str] = mapped_column(String(64), nullable=False)
    metadata_json: Mapped[Dict[str, Any]] = mapped_column(JSON, default=dict)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utc_now)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=utc_now, onupdate=utc_now)

    users: Mapped[List["User"]] = relationship("User", back_populates="institution")
    applications: Mapped[List["Application"]] = relationship("Application", back_populates="institution")


class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=gen_uuid)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[str] = mapped_column(String(64), nullable=False)  # INSTITUTION_USER, REGULATORY_OFFICER, ADMIN
    full_name: Mapped[str] = mapped_column(String(255), nullable=False)
    institution_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("institutions.id"), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utc_now)
    last_login_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)

    institution: Mapped[Optional["Institution"]] = relationship("Institution", back_populates="users")


class Application(Base):
    __tablename__ = "applications"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=gen_uuid)
    application_number: Mapped[str] = mapped_column(String(64), unique=True, index=True, nullable=False)
    institution_id: Mapped[str] = mapped_column(String(36), ForeignKey("institutions.id"), nullable=False)
    category: Mapped[str] = mapped_column(String(64), default="EOA", nullable=False)  # EOA, NEW_INSTITUTION, INCREASE_INTAKE, NEW_PROGRAMME
    academic_year: Mapped[str] = mapped_column(String(16), default="2026-27", nullable=False)
    status: Mapped[str] = mapped_column(String(64), default="draft", nullable=False)
    # draft, submitted, processing, awaiting_review, rectification_required, manual_verification_required, ready_for_officer_review, completed
    application_data_json: Mapped[Dict[str, Any]] = mapped_column(JSON, default=dict)
    submitted_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    created_by: Mapped[str] = mapped_column(String(255), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utc_now)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=utc_now, onupdate=utc_now)

    institution: Mapped["Institution"] = relationship("Institution", back_populates="applications")
    documents: Mapped[List["Document"]] = relationship("Document", back_populates="application", cascade="all, delete-orphan")
    findings: Mapped[List["Finding"]] = relationship("Finding", back_populates="application", cascade="all, delete-orphan")
    verification_attempts: Mapped[List["VerificationAttempt"]] = relationship("VerificationAttempt", back_populates="application", cascade="all, delete-orphan")
    review_actions: Mapped[List["ReviewAction"]] = relationship("ReviewAction", back_populates="application", cascade="all, delete-orphan")


class Document(Base):
    __tablename__ = "documents"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=gen_uuid)
    application_id: Mapped[str] = mapped_column(String(36), ForeignKey("applications.id"), nullable=False)
    document_type: Mapped[str] = mapped_column(String(64), nullable=False)
    storage_key: Mapped[str] = mapped_column(String(255), nullable=False)
    original_filename: Mapped[str] = mapped_column(String(255), nullable=False)
    mime_type: Mapped[str] = mapped_column(String(64), nullable=False)
    file_size: Mapped[int] = mapped_column(Integer, nullable=False)
    sha256: Mapped[str] = mapped_column(String(64), index=True, nullable=False)
    processing_status: Mapped[str] = mapped_column(String(32), default="uploaded", nullable=False)  # uploaded, processing, processed, failed
    page_count: Mapped[int] = mapped_column(Integer, default=1)
    extracted_text: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    classification_confidence: Mapped[float] = mapped_column(Float, default=1.0)
    metadata_json: Mapped[Dict[str, Any]] = mapped_column(JSON, default=dict)
    anomaly_flags_json: Mapped[Dict[str, Any]] = mapped_column(JSON, default=dict)
    uploaded_by: Mapped[str] = mapped_column(String(255), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utc_now)

    application: Mapped["Application"] = relationship("Application", back_populates="documents")
    extracted_fields: Mapped[List["ExtractedField"]] = relationship("ExtractedField", back_populates="document", cascade="all, delete-orphan")
    findings: Mapped[List["Finding"]] = relationship("Finding", back_populates="document")


class ExtractedField(Base):
    __tablename__ = "extracted_fields"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=gen_uuid)
    document_id: Mapped[str] = mapped_column(String(36), ForeignKey("documents.id"), nullable=False)
    field_name: Mapped[str] = mapped_column(String(128), index=True, nullable=False)
    field_value: Mapped[str] = mapped_column(Text, nullable=False)
    confidence: Mapped[float] = mapped_column(Float, default=1.0)
    page_number: Mapped[int] = mapped_column(Integer, default=1)
    bounding_box: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSON, nullable=True)
    evidence_snippet: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    extraction_method: Mapped[str] = mapped_column(String(64), default="pymupdf_parser")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utc_now)

    document: Mapped["Document"] = relationship("Document", back_populates="extracted_fields")


class RegulatoryRule(Base):
    __tablename__ = "regulatory_rules"
    __table_args__ = (
        UniqueConstraint("rule_code", "version", name="uq_rule_code_version"),
    )

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=gen_uuid)
    rule_code: Mapped[str] = mapped_column(String(64), index=True, nullable=False)
    version: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    category: Mapped[str] = mapped_column(String(64), nullable=False)
    document_type: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
    rule_definition: Mapped[Dict[str, Any]] = mapped_column(JSON, default=dict)
    source_document: Mapped[str] = mapped_column(String(255), nullable=False)
    source_section: Mapped[str] = mapped_column(String(255), nullable=False)
    source_page: Mapped[str] = mapped_column(String(64), nullable=False)
    source_url: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    effective_from: Mapped[datetime] = mapped_column(DateTime, default=utc_now)
    effective_to: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    verification_status: Mapped[str] = mapped_column(String(32), default="verified")  # verified, proposed_demo
    publication_status: Mapped[str] = mapped_column(String(32), default="published")  # draft, published, deprecated
    created_by: Mapped[str] = mapped_column(String(255), default="system")
    approved_by: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utc_now)
    published_at: Mapped[Optional[datetime]] = mapped_column(DateTime, default=utc_now)


class Finding(Base):
    __tablename__ = "findings"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=gen_uuid)
    application_id: Mapped[str] = mapped_column(String(36), ForeignKey("applications.id"), nullable=False)
    rule_id: Mapped[Optional[str]] = mapped_column(String(36), nullable=True)
    rule_code: Mapped[str] = mapped_column(String(64), index=True, nullable=False)
    rule_version: Mapped[int] = mapped_column(Integer, default=1)
    document_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("documents.id"), nullable=True)
    finding_type: Mapped[str] = mapped_column(String(64), nullable=False)
    severity: Mapped[str] = mapped_column(String(32), default="medium")  # low, medium, high, critical
    status: Mapped[str] = mapped_column(String(32), default="open")  # open, confirmed, dismissed, resolved, superseded
    expected_value: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    observed_value: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    explanation: Mapped[str] = mapped_column(Text, nullable=False)
    evidence_json: Mapped[Dict[str, Any]] = mapped_column(JSON, default=dict)
    suggested_action: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utc_now)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=utc_now, onupdate=utc_now)

    application: Mapped["Application"] = relationship("Application", back_populates="findings")
    document: Mapped[Optional["Document"]] = relationship("Document", back_populates="findings")


class VerificationAttempt(Base):
    __tablename__ = "verification_attempts"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=gen_uuid)
    document_id: Mapped[Optional[str]] = mapped_column(String(36), nullable=True)
    application_id: Mapped[str] = mapped_column(String(36), ForeignKey("applications.id"), nullable=False)
    source_name: Mapped[str] = mapped_column(String(128), nullable=False)
    source_type: Mapped[str] = mapped_column(String(64), default="synthetic_authority")
    reference_number: Mapped[str] = mapped_column(String(128), index=True, nullable=False)
    status: Mapped[str] = mapped_column(String(64), nullable=False)
    request_summary: Mapped[str] = mapped_column(Text, nullable=False)
    response_summary: Mapped[str] = mapped_column(Text, nullable=False)
    checked_at: Mapped[datetime] = mapped_column(DateTime, default=utc_now)
    error_code: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
    created_by: Mapped[str] = mapped_column(String(255), default="system")

    application: Mapped["Application"] = relationship("Application", back_populates="verification_attempts")


class ReviewAction(Base):
    __tablename__ = "review_actions"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=gen_uuid)
    application_id: Mapped[str] = mapped_column(String(36), ForeignKey("applications.id"), nullable=False)
    finding_id: Mapped[Optional[str]] = mapped_column(String(36), nullable=True)
    actor_id: Mapped[str] = mapped_column(String(36), nullable=False)
    actor_name: Mapped[str] = mapped_column(String(255), nullable=False)
    action_type: Mapped[str] = mapped_column(String(64), nullable=False)
    reason: Mapped[str] = mapped_column(Text, nullable=False)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utc_now)

    application: Mapped["Application"] = relationship("Application", back_populates="review_actions")


class AuditEvent(Base):
    __tablename__ = "audit_events"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=gen_uuid)
    application_id: Mapped[Optional[str]] = mapped_column(String(36), nullable=True, index=True)
    actor_id: Mapped[str] = mapped_column(String(36), nullable=False)
    actor_name: Mapped[str] = mapped_column(String(255), nullable=False)
    action: Mapped[str] = mapped_column(String(128), nullable=False)
    entity_type: Mapped[str] = mapped_column(String(64), nullable=False)
    entity_id: Mapped[str] = mapped_column(String(64), nullable=False)
    details_json: Mapped[Dict[str, Any]] = mapped_column(JSON, default=dict)
    correlation_id: Mapped[str] = mapped_column(String(64), default=gen_uuid)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utc_now)


class SyntheticAuthorityRecord(Base):
    __tablename__ = "synthetic_authority_records"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=gen_uuid)
    authority_type: Mapped[str] = mapped_column(String(64), index=True, nullable=False)
    reference_number: Mapped[str] = mapped_column(String(128), index=True, nullable=False)
    institution_code: Mapped[str] = mapped_column(String(64), index=True, nullable=False)
    institution_name: Mapped[str] = mapped_column(String(255), nullable=False)
    issue_date: Mapped[str] = mapped_column(String(32), nullable=False)
    expiry_date: Mapped[Optional[str]] = mapped_column(String(32), nullable=True)
    status: Mapped[str] = mapped_column(String(32), default="VALID", nullable=False)
    payload_json: Mapped[Dict[str, Any]] = mapped_column(JSON, default=dict)
