import os
import hashlib
from datetime import datetime, timezone, timedelta
from sqlalchemy.orm import Session
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors

from app.core.config import settings
from app.core.security import get_password_hash
from app.models import (
    Institution, User, Application, Document, ExtractedField,
    RegulatoryRule, Finding, VerificationAttempt, ReviewAction,
    AuditEvent, SyntheticAuthorityRecord
)

def create_sample_pdf(filepath: str, title: str, fields: dict) -> str:
    """Generates a realistic synthetic PDF for demonstration and testing."""
    os.makedirs(os.path.dirname(filepath), exist_ok=True)
    doc = SimpleDocTemplate(filepath, pagesize=letter, rightMargin=40, leftMargin=40, topMargin=40, bottomMargin=40)
    styles = getSampleStyleSheet()

    title_style = ParagraphStyle("T", parent=styles["Heading1"], fontSize=16, leading=20, textColor=colors.HexColor("#1E3A8A"))
    sub_style = ParagraphStyle("S", parent=styles["Heading3"], fontSize=11, leading=14, textColor=colors.HexColor("#475569"))
    body_style = ParagraphStyle("B", parent=styles["Normal"], fontSize=10, leading=14, textColor=colors.HexColor("#0F172A"))

    story = [
        Paragraph(title, title_style),
        Paragraph("ALL INDIA COUNCIL FOR TECHNICAL EDUCATION / OFFICIAL REGULATORY RECORD", sub_style),
        Spacer(1, 14),
    ]

    table_data = []
    for k, v in fields.items():
        table_data.append([
            Paragraph(f"<b>{k.replace('_', ' ').upper()}:</b>", body_style),
            Paragraph(str(v), body_style)
        ])

    t = Table(table_data, colWidths=[180, 320])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor("#F8FAFC")),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#CBD5E1")),
        ('PADDING', (0, 0), (-1, -1), 6),
    ]))
    story.append(t)
    story.append(Spacer(1, 15))
    story.append(Paragraph(
        "<i>Notice: This is an authorized regulatory record for Extension of Approval (EoA) and compliance verification. "
        "Any unauthorized alteration renders this record invalid.</i>",
        body_style
    ))
    doc.build(story)

    with open(filepath, "rb") as f:
        return hashlib.sha256(f.read()).hexdigest()

def seed_database(db: Session):
    # Only seed if institutions don't exist yet
    if db.query(Institution).count() > 0:
        return

    print("Seeding synthetic demonstration data...")

    # 1. Institutions
    inst_apex = Institution(
        institution_code="1-109283741",
        name="Apex Institute of Engineering & Technology",
        state="Maharashtra",
        metadata_json={"district": "Pune", "type": "Private Unaided", "established_year": 2004}
    )
    inst_national = Institution(
        institution_code="1-204918273",
        name="National Institute of Advanced Technology",
        state="Karnataka",
        metadata_json={"district": "Bengaluru Urban", "type": "Autonomous", "established_year": 1998}
    )
    inst_green = Institution(
        institution_code="1-398271625",
        name="Green Valley Polytechnic & Technical Campus",
        state="Uttar Pradesh",
        metadata_json={"district": "Lucknow", "type": "Government Aided", "established_year": 2011}
    )
    db.add_all([inst_apex, inst_national, inst_green])
    db.commit()
    db.refresh(inst_apex)
    db.refresh(inst_national)
    db.refresh(inst_green)

    # 2. Demonstration Users
    user_inst = User(
        email="institution@demo.ac.in",
        password_hash=get_password_hash("DemoPass123!"),
        role="INSTITUTION_USER",
        full_name="Dr. Rajesh Sharma (Registrar)",
        institution_id=inst_apex.id,
        is_active=True
    )
    user_officer = User(
        email="officer@aicte.gov.in",
        password_hash=get_password_hash("OfficerPass123!"),
        role="REGULATORY_OFFICER",
        full_name="Sunil Verma (Regional Approval Officer)",
        institution_id=None,
        is_active=True
    )
    user_admin = User(
        email="admin@aicte.gov.in",
        password_hash=get_password_hash("AdminPass123!"),
        role="ADMIN",
        full_name="Admin Director (Regulation Bureau)",
        institution_id=None,
        is_active=True
    )
    db.add_all([user_inst, user_officer, user_admin])
    db.commit()

    # 3. Regulatory Rules (from AICTE Approval Process Handbook)
    rules_data = [
        {
            "rule_code": "EOA-DOC-001",
            "title": "Mandatory Prior AICTE Approval Letter",
            "description": "Institutions applying for Extension of Approval (EoA) must submit the previous academic year's official approval letter.",
            "category": "EOA",
            "document_type": "APPROVAL_LETTER",
            "rule_definition": {"check_type": "required_document_present", "document_type": "APPROVAL_LETTER", "severity": "critical"},
            "source_document": "AICTE Approval Process Handbook 2026-27",
            "source_section": "Chapter II, Clause 2.1.3",
            "source_page": "Page 34",
            "verification_status": "verified",
            "publication_status": "published"
        },
        {
            "rule_code": "EOA-NOC-002",
            "title": "Land and Building Safety Clearance NOC",
            "description": "Valid structural and fire safety clearance from the competent local authority is mandatory for institutional campus operations.",
            "category": "INFRASTRUCTURE",
            "document_type": "LAND_NOC",
            "rule_definition": {"check_type": "required_document_present", "document_type": "LAND_NOC", "severity": "high"},
            "source_document": "AICTE Approval Process Handbook 2026-27",
            "source_section": "Appendix 4, Norms for Land and Building",
            "source_page": "Page 88",
            "verification_status": "verified",
            "publication_status": "published"
        },
        {
            "rule_code": "NBA-VALID-003",
            "title": "Accreditation Certificate Validity Not Expired",
            "description": "National Board of Accreditation (NBA) certificates submitted to claim accreditation benefits must be valid on the date of evaluation.",
            "category": "ACCREDITATION",
            "document_type": "NBA_ACCREDITATION",
            "rule_definition": {"check_type": "date_validity_not_expired", "document_type": "NBA_ACCREDITATION", "field_name": "expiry_date", "severity": "high"},
            "source_document": "AICTE Approval Process Handbook 2026-27",
            "source_section": "Chapter III, Clause 3.4.1",
            "source_page": "Page 56",
            "verification_status": "verified",
            "publication_status": "published"
        },
        {
            "rule_code": "ID-MATCH-004",
            "title": "AICTE Permanent Institution Identifier Match",
            "description": "The institution code extracted from submitted documents must match the authorized AICTE permanent institution code without deviation.",
            "category": "GOVERNANCE",
            "document_type": None,
            "rule_definition": {"check_type": "identifier_equality", "field_name": "institution_code", "severity": "critical"},
            "source_document": "AICTE Approval Process Handbook 2026-27",
            "source_section": "Chapter I, Clause 1.2",
            "source_page": "Page 12",
            "verification_status": "verified",
            "publication_status": "published"
        },
        {
            "rule_code": "DUP-CHECK-005",
            "title": "Duplicate Document Submission Detection",
            "description": "Submitted files must not be identical copies (SHA-256 match) of documents submitted across different regulatory requirements or applications.",
            "category": "GOVERNANCE",
            "document_type": None,
            "rule_definition": {"check_type": "duplicate_detection", "severity": "high"},
            "source_document": "AICTE Regulatory Intelligence Guidelines",
            "source_section": "Section 4.3 Integrity Checks",
            "source_page": "Page 19",
            "verification_status": "verified",
            "publication_status": "published"
        },
        {
            "rule_code": "ANOMALY-DOC-006",
            "title": "Document Integrity & Metadata Tampering Check",
            "description": "Flag documents showing image alteration signals, non-uniform fonts, or metadata modification stamps following official issuance.",
            "category": "INTEGRITY",
            "document_type": None,
            "rule_definition": {"check_type": "anomaly_detection", "severity": "medium"},
            "source_document": "AICTE Regulatory Intelligence Guidelines",
            "source_section": "Section 5.1 Document Intelligence",
            "source_page": "Page 22",
            "verification_status": "verified",
            "publication_status": "published"
        }
    ]

    for rd in rules_data:
        r_obj = RegulatoryRule(**rd, created_by="system_seeder")
        db.add(r_obj)
    db.commit()

    # 4. Synthetic Authority Records
    auth_records = [
        SyntheticAuthorityRecord(
            authority_type="NBA",
            reference_number="NBA-2025-APEX-CS",
            institution_code="1-109283741",
            institution_name="Apex Institute of Engineering & Technology",
            issue_date="2023-07-01",
            expiry_date="2027-06-30",
            status="VALID",
            payload_json={"accreditation_tier": "Tier I", "valid_years": 4}
        ),
        SyntheticAuthorityRecord(
            authority_type="NBA",
            reference_number="NBA-EXP-2022-PUNE",
            institution_code="1-109283741",
            institution_name="Apex Institute of Engineering & Technology",
            issue_date="2020-07-01",
            expiry_date="2023-06-30",
            status="EXPIRED",
            payload_json={"accreditation_tier": "Tier II", "valid_years": 3}
        ),
        SyntheticAuthorityRecord(
            authority_type="STATE_DTE",
            reference_number="DTE-NOC-MH-8921",
            institution_code="1-109283741",
            institution_name="Apex Institute of Engineering & Technology",
            issue_date="2024-03-15",
            expiry_date="2029-03-14",
            status="VALID",
            payload_json={"clearance_type": "Fire & Structural Safety", "campus_acreage": 12.5}
        ),
        SyntheticAuthorityRecord(
            authority_type="NBA",
            reference_number="NBA-MISMATCH-9999",
            institution_code="1-999999999",
            institution_name="Other Engineering College (Autonomous)",
            issue_date="2023-01-01",
            expiry_date="2027-12-31",
            status="VALID",
            payload_json={"note": "Belongs to another entity"}
        )
    ]
    db.add_all(auth_records)
    db.commit()

    # 5. Create Demonstration Applications with Seeded Documents and Findings

    # Scenario 1: Clean Application (All Checks Passed)
    app1 = Application(
        application_number="AICTE-EOA-2026-001",
        institution_id=inst_apex.id,
        category="EOA",
        academic_year="2026-27",
        status="completed",
        application_data_json={
            "institution_name": inst_apex.name,
            "institution_code": inst_apex.institution_code,
            "total_approved_intake": "420",
            "principal_name": "Dr. R. K. Mukherjee",
            "contact_email": "principal@apex.edu"
        },
        created_by="institution@demo.ac.in",
        submitted_at=datetime.now(timezone.utc) - timedelta(days=5)
    )
    db.add(app1)
    db.commit()
    db.refresh(app1)

    pdf1_path = os.path.join(settings.LOCAL_STORAGE_PATH, "sample_eoa_apex.pdf")
    sha1 = create_sample_pdf(
        pdf1_path,
        "AICTE Extension of Approval (EoA) Order 2025-26",
        {
            "institution_code": "1-109283741",
            "institution_name": "Apex Institute of Engineering & Technology",
            "reference_number": "F.No. Western/1-109283741/2025/EOA",
            "approved_intake": "420",
            "issue_date": "2025-05-15",
            "expiry_date": "2026-06-30"
        }
    )
    doc1 = Document(
        application_id=app1.id,
        document_type="APPROVAL_LETTER",
        storage_key="sample_eoa_apex.pdf",
        original_filename="AICTE_Approval_Letter_2025.pdf",
        mime_type="application/pdf",
        file_size=os.path.getsize(pdf1_path),
        sha256=sha1,
        processing_status="processed",
        page_count=1,
        uploaded_by="institution@demo.ac.in"
    )
    db.add(doc1)
    db.commit()
    db.refresh(doc1)

    # Fields for doc1
    db.add_all([
        ExtractedField(document_id=doc1.id, field_name="institution_code", field_value="1-109283741", confidence=0.98, page_number=1, evidence_snippet="INSTITUTION CODE: 1-109283741"),
        ExtractedField(document_id=doc1.id, field_name="institution_name", field_value="Apex Institute of Engineering & Technology", confidence=0.97, page_number=1, evidence_snippet="Apex Institute of Engineering & Technology"),
        ExtractedField(document_id=doc1.id, field_name="approved_intake", field_value="420", confidence=0.99, page_number=1, evidence_snippet="APPROVED INTAKE: 420"),
        ExtractedField(document_id=doc1.id, field_name="reference_number", field_value="F.No. Western/1-109283741/2025/EOA", confidence=0.95, page_number=1, evidence_snippet="REF NO: F.No. Western/1-109283741/2025/EOA")
    ])

    pdf1_noc = os.path.join(settings.LOCAL_STORAGE_PATH, "sample_noc_apex.pdf")
    sha1_noc = create_sample_pdf(
        pdf1_noc,
        "State DTE Building Safety & Fire NOC Certificate",
        {
            "institution_code": "1-109283741",
            "institution_name": "Apex Institute of Engineering & Technology",
            "reference_number": "DTE-NOC-MH-8921",
            "issue_date": "2024-03-15",
            "expiry_date": "2029-03-14"
        }
    )
    doc1_noc = Document(
        application_id=app1.id,
        document_type="LAND_NOC",
        storage_key="sample_noc_apex.pdf",
        original_filename="Building_Safety_NOC_2024.pdf",
        mime_type="application/pdf",
        file_size=os.path.getsize(pdf1_noc),
        sha256=sha1_noc,
        processing_status="processed",
        page_count=1,
        uploaded_by="institution@demo.ac.in"
    )
    db.add(doc1_noc)
    db.commit()

    # Scenario 2: Application with Missing Land NOC and Missing Application Fields
    app2 = Application(
        application_number="AICTE-EOA-2026-002",
        institution_id=inst_apex.id,
        category="EOA",
        academic_year="2026-27",
        status="ready_for_officer_review",
        application_data_json={
            "institution_name": inst_apex.name,
            "institution_code": inst_apex.institution_code,
            "total_approved_intake": "300"
        },
        created_by="institution@demo.ac.in"
    )
    db.add(app2)
    db.commit()
    db.refresh(app2)

    db.add(Finding(
        application_id=app2.id,
        rule_code="EOA-NOC-002",
        rule_version=1,
        finding_type="rule_failed",
        severity="high",
        status="open",
        expected_value="Document of type 'LAND_NOC' is mandatory",
        observed_value="Missing",
        explanation="Required supporting document 'Land and Building Safety Clearance NOC' was not found in the submission.",
        suggested_action="Upload the required LAND_NOC under the supporting documents section."
    ))

    # Scenario 3: Document with Expired Validity Date
    app3 = Application(
        application_number="AICTE-EOA-2026-003",
        institution_id=inst_apex.id,
        category="EOA",
        academic_year="2026-27",
        status="ready_for_officer_review",
        application_data_json={
            "institution_name": inst_apex.name,
            "institution_code": inst_apex.institution_code,
            "total_approved_intake": "240"
        },
        created_by="institution@demo.ac.in"
    )
    db.add(app3)
    db.commit()
    db.refresh(app3)

    pdf3_path = os.path.join(settings.LOCAL_STORAGE_PATH, "sample_expired_nba.pdf")
    sha3 = create_sample_pdf(
        pdf3_path,
        "National Board of Accreditation (NBA) Certificate",
        {
            "institution_code": "1-109283741",
            "institution_name": "Apex Institute of Engineering & Technology",
            "reference_number": "NBA-EXP-2022-PUNE",
            "programme_name": "Computer Science and Engineering",
            "issue_date": "2020-07-01",
            "expiry_date": "2023-06-30"
        }
    )
    doc3 = Document(
        application_id=app3.id,
        document_type="NBA_ACCREDITATION",
        storage_key="sample_expired_nba.pdf",
        original_filename="NBA_Accreditation_Certificate_CS.pdf",
        mime_type="application/pdf",
        file_size=os.path.getsize(pdf3_path),
        sha256=sha3,
        processing_status="processed",
        page_count=1,
        uploaded_by="institution@demo.ac.in"
    )
    db.add(doc3)
    db.commit()
    db.refresh(doc3)

    db.add(ExtractedField(
        document_id=doc3.id,
        field_name="expiry_date",
        field_value="2023-06-30",
        confidence=0.98,
        page_number=1,
        evidence_snippet="EXPIRY DATE: 2023-06-30"
    ))
    db.add(Finding(
        application_id=app3.id,
        rule_code="NBA-VALID-003",
        rule_version=1,
        document_id=doc3.id,
        finding_type="rule_failed",
        severity="high",
        status="open",
        expected_value="Validity date >= 2026-01-01",
        observed_value="2023-06-30",
        explanation="The NBA accreditation certificate expired on 30-Jun-2023. Regulatory compliance requires active unexpired accreditation.",
        suggested_action="Obtain and upload current NBA accreditation renewal extension or reassessment letter."
    ))

    # Scenario 4: Mismatched Institution Identifier
    app4 = Application(
        application_number="AICTE-EOA-2026-004",
        institution_id=inst_apex.id,
        category="EOA",
        academic_year="2026-27",
        status="ready_for_officer_review",
        application_data_json={
            "institution_name": inst_apex.name,
            "institution_code": inst_apex.institution_code,
            "total_approved_intake": "180"
        },
        created_by="institution@demo.ac.in"
    )
    db.add(app4)
    db.commit()
    db.refresh(app4)

    pdf4_path = os.path.join(settings.LOCAL_STORAGE_PATH, "sample_mismatched_id.pdf")
    sha4 = create_sample_pdf(
        pdf4_path,
        "AICTE Extension of Approval Previous Year",
        {
            "institution_code": "1-999988887",  # Mismatched code!
            "institution_name": "Apex Institute of Technology (Satellite Branch)",
            "reference_number": "F.No. West/1-999988887/2024",
            "issue_date": "2024-05-10"
        }
    )
    doc4 = Document(
        application_id=app4.id,
        document_type="APPROVAL_LETTER",
        storage_key="sample_mismatched_id.pdf",
        original_filename="Approval_Order_2024_Satellite.pdf",
        mime_type="application/pdf",
        file_size=os.path.getsize(pdf4_path),
        sha256=sha4,
        processing_status="processed",
        page_count=1,
        uploaded_by="institution@demo.ac.in"
    )
    db.add(doc4)
    db.commit()
    db.refresh(doc4)

    db.add(ExtractedField(
        document_id=doc4.id,
        field_name="institution_code",
        field_value="1-999988887",
        confidence=0.99,
        page_number=1,
        evidence_snippet="INSTITUTION CODE: 1-999988887"
    ))
    db.add(Finding(
        application_id=app4.id,
        rule_code="ID-MATCH-004",
        rule_version=1,
        document_id=doc4.id,
        finding_type="rule_failed",
        severity="critical",
        status="open",
        expected_value="1-109283741",
        observed_value="1-999988887",
        explanation="Institution identifier mismatch: Application states '1-109283741', but document Approval_Order_2024_Satellite.pdf contains '1-999988887'.",
        suggested_action="Verify if the document belongs to a separate satellite campus or upload the correct institutional order."
    ))

    # Scenario 5: Duplicate Document Submission
    app5 = Application(
        application_number="AICTE-EOA-2026-005",
        institution_id=inst_national.id,
        category="EOA",
        academic_year="2026-27",
        status="awaiting_review",
        application_data_json={
            "institution_name": inst_national.name,
            "institution_code": inst_national.institution_code,
            "total_approved_intake": "600"
        },
        created_by="officer@aicte.gov.in"
    )
    db.add(app5)
    db.commit()
    db.refresh(app5)

    doc5 = Document(
        application_id=app5.id,
        document_type="LAND_NOC",
        storage_key="sample_noc_apex.pdf",  # Reusing exact same file sha!
        original_filename="Reused_NOC_Copy.pdf",
        mime_type="application/pdf",
        file_size=os.path.getsize(pdf1_noc),
        sha256=sha1_noc,
        processing_status="processed",
        page_count=1,
        uploaded_by="officer@aicte.gov.in"
    )
    db.add(doc5)
    db.commit()

    db.add(Finding(
        application_id=app5.id,
        rule_code="DUP-CHECK-005",
        rule_version=1,
        document_id=doc5.id,
        finding_type="rule_warning",
        severity="high",
        status="open",
        expected_value="Unique original document file",
        observed_value=f"SHA-256 duplicate: {sha1_noc[:12]}...",
        explanation=f"Document 'Reused_NOC_Copy.pdf' is byte-identical to another document previously uploaded in application {app1.application_number}.",
        suggested_action="Officer must verify whether the clearance was legitimately issued to both or mistakenly duplicated."
    ))

    # Scenario 6: External Authority Source Mismatch
    app6 = Application(
        application_number="AICTE-EOA-2026-006",
        institution_id=inst_apex.id,
        category="EOA",
        academic_year="2026-27",
        status="ready_for_officer_review",
        application_data_json={
            "institution_name": inst_apex.name,
            "institution_code": inst_apex.institution_code,
            "total_approved_intake": "360"
        },
        created_by="institution@demo.ac.in"
    )
    db.add(app6)
    db.commit()
    db.refresh(app6)

    db.add(VerificationAttempt(
        application_id=app6.id,
        source_name="National Board of Accreditation",
        source_type="synthetic_authority",
        reference_number="NBA-MISMATCH-9999",
        status="mismatch_detected",
        request_summary="Queried source 'National Board of Accreditation' with InstCode '1-109283741'",
        response_summary="Record #NBA-MISMATCH-9999 exists but belongs to 'Other Engineering College (Autonomous)' (1-999999999), not '1-109283741'.",
        created_by="system_validator"
    ))
    db.add(Finding(
        application_id=app6.id,
        rule_code="EXT-VERIFY-001",
        rule_version=1,
        finding_type="external_verification_mismatch_detected",
        severity="high",
        status="open",
        expected_value="Verified active status in official registry",
        observed_value="mismatch_detected",
        explanation="External source verification against 'National Board of Accreditation' returned: Record belongs to another entity.",
        suggested_action="Officer must inspect certificate hardcopy and notify the institution."
    ))

    # Scenario 7: External Verification Source Unavailable
    app7 = Application(
        application_number="AICTE-EOA-2026-007",
        institution_id=inst_green.id,
        category="EOA",
        academic_year="2026-27",
        status="ready_for_officer_review",
        application_data_json={
            "institution_name": inst_green.name,
            "institution_code": inst_green.institution_code,
            "total_approved_intake": "120"
        },
        created_by="officer@aicte.gov.in"
    )
    db.add(app7)
    db.commit()
    db.refresh(app7)

    db.add(VerificationAttempt(
        application_id=app7.id,
        source_name="State Affiliating University",
        source_type="synthetic_authority",
        reference_number="REF-UNAVAILABLE-503",
        status="source_unavailable",
        request_summary="Queried source 'State Affiliating University' for Reference #REF-UNAVAILABLE-503",
        response_summary="Authority endpoint timed out (HTTP 503 Service Unavailable). Sandbox simulation for offline authority connector.",
        error_code="EXTERNAL_TIMEOUT_503",
        created_by="system_validator"
    ))

    # Scenario 8: Visual Alteration / Suspicious Tamper Signal
    app8 = Application(
        application_number="AICTE-EOA-2026-008",
        institution_id=inst_apex.id,
        category="EOA",
        academic_year="2026-27",
        status="ready_for_officer_review",
        application_data_json={
            "institution_name": inst_apex.name,
            "institution_code": inst_apex.institution_code,
            "total_approved_intake": "480"
        },
        created_by="institution@demo.ac.in"
    )
    db.add(app8)
    db.commit()
    db.refresh(app8)

    pdf8_path = os.path.join(settings.LOCAL_STORAGE_PATH, "sample_altered_stamp.pdf")
    sha8 = create_sample_pdf(
        pdf8_path,
        "Municipal Corporation Building Clearance Certificate",
        {
            "institution_code": "1-109283741",
            "institution_name": "Apex Institute of Engineering & Technology",
            "reference_number": "NOC-PUNE-MC-2024",
            "issue_date": "2024-01-10",
            "built_up_area": "24,500 SQM"
        }
    )
    doc8 = Document(
        application_id=app8.id,
        document_type="LAND_NOC",
        storage_key="sample_altered_stamp.pdf",
        original_filename="Building_Permit_Altered_Stamp.pdf",
        mime_type="application/pdf",
        file_size=os.path.getsize(pdf8_path),
        sha256=sha8,
        processing_status="processed",
        page_count=1,
        anomaly_flags_json={
            "visual_anomaly_detected": True,
            "reason": "Visual anomaly signal: Non-uniform font baseline and pixel edge inconsistencies detected in municipal seal area."
        },
        uploaded_by="institution@demo.ac.in"
    )
    db.add(doc8)
    db.commit()
    db.refresh(doc8)

    db.add(Finding(
        application_id=app8.id,
        rule_code="ANOMALY-DOC-006",
        rule_version=1,
        document_id=doc8.id,
        finding_type="rule_manual_review_required",
        severity="medium",
        status="open",
        expected_value="Clean digital scan with consistent metadata",
        observed_value="Anomaly flag triggered",
        explanation="Document 'Building_Permit_Altered_Stamp.pdf' has an anomaly signal: Non-uniform font baseline and pixel edge inconsistencies detected in municipal seal area.",
        suggested_action="Regulatory officer should inspect original scan in Document Intelligence Lab."
    ))

    # Scenario 9: Application in Rectification Required status with Officer History
    app9 = Application(
        application_number="AICTE-EOA-2026-009",
        institution_id=inst_green.id,
        category="EOA",
        academic_year="2026-27",
        status="rectification_required",
        application_data_json={
            "institution_name": inst_green.name,
            "institution_code": inst_green.institution_code,
            "total_approved_intake": "150"
        },
        created_by="officer@aicte.gov.in"
    )
    db.add(app9)
    db.commit()
    db.refresh(app9)

    db.add(ReviewAction(
        application_id=app9.id,
        actor_id=user_officer.id,
        actor_name=user_officer.full_name,
        action_type="request_rectification",
        reason="Fire safety clearance certificate has not been provided with valid local municipal corporation endorsement. Upload renewed endorsement within 7 working days.",
        notes="Official notice sent via portal."
    ))

    db.commit()
    print("Seeding completed successfully with 3 institutions, 3 demo users, 6 regulatory rules, and 9 scenario applications!")
