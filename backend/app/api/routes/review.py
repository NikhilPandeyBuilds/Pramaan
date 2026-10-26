from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models import Finding, Application, ReviewAction, User
from app.schemas import ReviewActionCreate, ReviewActionOut, RectificationRequest
from app.api.dependencies import get_current_user, require_roles
from app.services.review_service import ReviewService

router = APIRouter(tags=["Review & Rectification"])

@router.post("/findings/{finding_id}/review", response_model=ReviewActionOut)
def review_finding(
    finding_id: str,
    payload: ReviewActionCreate,
    current_user: User = Depends(require_roles(["REGULATORY_OFFICER", "ADMIN"])),
    db: Session = Depends(get_db)
):
    finding = db.query(Finding).filter(Finding.id == finding_id).first()
    if not finding:
        raise HTTPException(status_code=404, detail="Finding not found.")

    action = ReviewService.process_review_action(
        db=db,
        application_id=finding.application_id,
        actor_id=current_user.id,
        actor_name=current_user.full_name,
        action_type=payload.action_type,
        reason=payload.reason,
        finding_id=finding.id,
        notes=payload.notes
    )
    return action

@router.post("/applications/{application_id}/rectification", response_model=ReviewActionOut)
def request_rectification(
    application_id: str,
    payload: RectificationRequest,
    current_user: User = Depends(require_roles(["REGULATORY_OFFICER", "ADMIN"])),
    db: Session = Depends(get_db)
):
    req_details = ""
    if payload.requested_fields:
        req_details += f"Fields required: {', '.join(payload.requested_fields)}. "
    if payload.requested_documents:
        req_details += f"Documents required: {', '.join(payload.requested_documents)}. "

    combined_reason = f"{payload.rectification_notes}. {req_details}".strip()

    action = ReviewService.process_review_action(
        db=db,
        application_id=application_id,
        actor_id=current_user.id,
        actor_name=current_user.full_name,
        action_type="request_rectification",
        reason=combined_reason,
        requested_fields=payload.requested_fields,
        requested_documents=payload.requested_documents
    )
    return action

@router.get("/applications/{application_id}/review-history", response_model=List[ReviewActionOut])
def get_review_history(
    application_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    app = db.query(Application).filter(Application.id == application_id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found.")

    if current_user.role == "INSTITUTION_USER" and app.institution_id != current_user.institution_id:
        raise HTTPException(status_code=403, detail="Access denied.")

    actions = db.query(ReviewAction).filter(
        ReviewAction.application_id == application_id
    ).order_by(ReviewAction.created_at.desc()).all()
    return actions
