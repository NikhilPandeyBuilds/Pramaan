from typing import Optional, List
from fastapi import HTTPException
from sqlalchemy.orm import Session
from app.models import Application, Finding, ReviewAction
from app.services.audit_service import log_audit_event

class ReviewService:
    @staticmethod
    def process_review_action(
        db: Session,
        application_id: str,
        actor_id: str,
        actor_name: str,
        action_type: str,
        reason: str,
        finding_id: Optional[str] = None,
        notes: Optional[str] = None,
        requested_fields: Optional[List[str]] = None,
        requested_documents: Optional[List[str]] = None
    ) -> ReviewAction:
        if not reason or len(reason.strip()) < 5:
            raise HTTPException(
                status_code=400,
                detail="A valid mandatory reason (minimum 5 characters) must be provided for all officer review actions."
            )

        application = db.query(Application).filter(Application.id == application_id).first()
        if not application:
            raise HTTPException(status_code=404, detail="Application not found")

        finding = None
        if finding_id:
            finding = db.query(Finding).filter(Finding.id == finding_id).first()
            if not finding:
                raise HTTPException(status_code=404, detail="Finding not found")

        # Handle specific review actions
        if action_type == "confirm_finding":
            if finding:
                finding.status = "confirmed"
        elif action_type == "dismiss_finding":
            if finding:
                finding.status = "dismissed"
        elif action_type == "request_rectification":
            application.status = "rectification_required"
            if finding:
                finding.status = "open"
        elif action_type == "escalate":
            application.status = "manual_verification_required"
        elif action_type == "complete_review":
            application.status = "completed"

        review_action = ReviewAction(
            application_id=application_id,
            finding_id=finding_id,
            actor_id=actor_id,
            actor_name=actor_name,
            action_type=action_type,
            reason=reason.strip(),
            notes=notes
        )
        db.add(review_action)
        db.commit()
        db.refresh(review_action)

        log_audit_event(
            db=db,
            actor_id=actor_id,
            actor_name=actor_name,
            action=f"OFFICER_REVIEW_{action_type.upper()}",
            entity_type="review_action",
            entity_id=review_action.id,
            details={
                "action_type": action_type,
                "reason": reason,
                "finding_id": finding_id,
                "application_status": application.status
            },
            application_id=application_id
        )

        return review_action
