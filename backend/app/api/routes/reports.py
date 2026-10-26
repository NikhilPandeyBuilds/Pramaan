import os
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models import Application, AuditEvent, User
from app.schemas import AuditEventOut
from app.api.dependencies import get_current_user
from app.services.report_service import ReportService
from app.core.config import settings

router = APIRouter(tags=["Reports & Audit"])

@router.post("/applications/{application_id}/reports")
def generate_report(
    application_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    app = db.query(Application).filter(Application.id == application_id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found.")

    if current_user.role == "INSTITUTION_USER" and app.institution_id != current_user.institution_id:
        raise HTTPException(status_code=403, detail="Access denied.")

    pdf_path = ReportService.generate_validation_report_pdf(db, application_id)
    filename = os.path.basename(pdf_path)

    return {
        "message": "Report generated successfully.",
        "filename": filename,
        "download_url": f"/api/reports/{filename}/download",
        "generated_by": current_user.email
    }

@router.get("/reports/{filename}/download")
def download_report(
    filename: str,
    current_user: User = Depends(get_current_user)
):
    # Sanitize filename
    safe_name = os.path.basename(filename)
    report_path = os.path.join(settings.REPORTS_STORAGE_PATH, safe_name)

    if not os.path.exists(report_path):
        raise HTTPException(status_code=404, detail="Validation report file not found.")

    return FileResponse(
        path=report_path,
        filename=safe_name,
        media_type="application/pdf"
    )

@router.get("/applications/{application_id}/audit", response_model=List[AuditEventOut])
def get_application_audit_trail(
    application_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    app = db.query(Application).filter(Application.id == application_id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found.")

    if current_user.role == "INSTITUTION_USER" and app.institution_id != current_user.institution_id:
        raise HTTPException(status_code=403, detail="Access denied.")

    events = db.query(AuditEvent).filter(
        AuditEvent.application_id == application_id
    ).order_by(AuditEvent.created_at.desc()).all()
    return events
