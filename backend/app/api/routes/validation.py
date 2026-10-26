from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models import Application, Finding, User
from app.schemas import FindingOut
from app.api.dependencies import get_current_user
from app.services.validation_service import ValidationOrchestrator

router = APIRouter(tags=["Validation"])

@router.post("/applications/{application_id}/validate")
def validate_application_endpoint(
    application_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    app = db.query(Application).filter(Application.id == application_id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found.")

    if current_user.role == "INSTITUTION_USER" and app.institution_id != current_user.institution_id:
        raise HTTPException(status_code=403, detail="Access denied.")

    result = ValidationOrchestrator.validate_application(
        db=db,
        application_id=application_id,
        actor_id=current_user.id,
        actor_name=current_user.full_name
    )
    return result

@router.get("/applications/{application_id}/processing-status")
def get_processing_status(
    application_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    app = db.query(Application).filter(Application.id == application_id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found.")

    if current_user.role == "INSTITUTION_USER" and app.institution_id != current_user.institution_id:
        raise HTTPException(status_code=403, detail="Access denied.")

    findings_count = db.query(Finding).filter(Finding.application_id == application_id).count()
    open_findings = db.query(Finding).filter(
        Finding.application_id == application_id,
        Finding.status == "open"
    ).count()

    return {
        "application_id": app.id,
        "application_number": app.application_number,
        "status": app.status,
        "total_findings": findings_count,
        "open_findings": open_findings,
        "is_ready_for_review": app.status in ("ready_for_officer_review", "awaiting_review")
    }

@router.get("/applications/{application_id}/findings", response_model=List[FindingOut])
def get_application_findings(
    application_id: str,
    severity: Optional[str] = None,
    status_filter: Optional[str] = Query(None, alias="status"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    app = db.query(Application).filter(Application.id == application_id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found.")

    if current_user.role == "INSTITUTION_USER" and app.institution_id != current_user.institution_id:
        raise HTTPException(status_code=403, detail="Access denied.")

    query = db.query(Finding).filter(Finding.application_id == application_id)
    if severity:
        query = query.filter(Finding.severity == severity)
    if status_filter:
        query = query.filter(Finding.status == status_filter)

    findings = query.order_by(Finding.created_at.desc()).all()
    return findings
