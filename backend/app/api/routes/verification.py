from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models import Document, VerificationAttempt, User, ExtractedField
from app.schemas import VerificationAttemptOut
from app.api.dependencies import get_current_user, require_roles
from app.adapters.synthetic_authority import SyntheticAuthorityAdapter
from app.services.audit_service import log_audit_event

router = APIRouter(tags=["Verification"])

@router.post("/documents/{document_id}/verify", response_model=VerificationAttemptOut)
def verify_document_endpoint(
    document_id: str,
    source_name: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    doc = db.query(Document).filter(Document.id == document_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found.")

    app = doc.application
    if current_user.role == "INSTITUTION_USER" and app.institution_id != current_user.institution_id:
        raise HTTPException(status_code=403, detail="Access denied.")

    # Find reference number
    ref_field = db.query(ExtractedField).filter(
        ExtractedField.document_id == doc.id,
        ExtractedField.field_name == "reference_number"
    ).first()

    reference_num = ref_field.field_value if ref_field else f"REF-{doc.id[:8].upper()}"
    src = source_name or ("National Board of Accreditation" if "NBA" in doc.document_type else "State Technical Board")

    inst_code = app.institution.institution_code if app.institution else "DEMO-INST"

    adapter = SyntheticAuthorityAdapter(db=db)
    v_res = adapter.verify(
        source_name=src,
        reference_number=reference_num,
        institution_code=inst_code,
        submitted_fields={"doc_type": doc.document_type}
    )

    attempt = VerificationAttempt(
        document_id=doc.id,
        application_id=app.id,
        source_name=v_res.source_name,
        source_type=v_res.source_type,
        reference_number=v_res.reference_number,
        status=v_res.status,
        request_summary=v_res.request_summary,
        response_summary=v_res.response_summary,
        error_code=v_res.error_code,
        created_by=current_user.email
    )
    db.add(attempt)
    db.commit()
    db.refresh(attempt)

    log_audit_event(
        db=db,
        actor_id=current_user.id,
        actor_name=current_user.full_name,
        action="VERIFICATION_ATTEMPTED",
        entity_type="verification_attempt",
        entity_id=attempt.id,
        details={
            "source_name": src,
            "status": v_res.status,
            "reference_number": reference_num
        },
        application_id=app.id
    )

    return attempt

@router.get("/documents/{document_id}/verification-attempts", response_model=List[VerificationAttemptOut])
def get_document_verification_attempts(
    document_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    doc = db.query(Document).filter(Document.id == document_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found.")

    app = doc.application
    if current_user.role == "INSTITUTION_USER" and app.institution_id != current_user.institution_id:
        raise HTTPException(status_code=403, detail="Access denied.")

    attempts = db.query(VerificationAttempt).filter(
        VerificationAttempt.document_id == document_id
    ).order_by(VerificationAttempt.checked_at.desc()).all()
    return attempts

@router.get("/verification/queue", response_model=List[VerificationAttemptOut])
def get_verification_queue(
    status_filter: Optional[str] = Query(None, alias="status"),
    current_user: User = Depends(require_roles(["REGULATORY_OFFICER", "ADMIN"])),
    db: Session = Depends(get_db)
):
    query = db.query(VerificationAttempt)
    if status_filter:
        query = query.filter(VerificationAttempt.status == status_filter)

    attempts = query.order_by(VerificationAttempt.checked_at.desc()).limit(100).all()
    return attempts
