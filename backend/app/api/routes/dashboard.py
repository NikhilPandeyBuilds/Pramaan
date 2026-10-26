from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.db.session import get_db
from app.models import Application, Finding, VerificationAttempt, User, Institution
from app.schemas import DashboardSummaryOut, ApplicationOut, FindingOut
from app.api.dependencies import get_current_user

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

@router.get("/summary", response_model=DashboardSummaryOut)
def get_dashboard_summary(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    app_query = db.query(Application)
    finding_query = db.query(Finding)

    if current_user.role == "INSTITUTION_USER" and current_user.institution_id:
        app_query = app_query.filter(Application.institution_id == current_user.institution_id)
        app_ids = [a.id for a in app_query.all()]
        finding_query = finding_query.filter(Finding.application_id.in_(app_ids))

    total_apps = app_query.count()
    draft_apps = app_query.filter(Application.status == "draft").count()
    under_processing = app_query.filter(Application.status.in_(["submitted", "processing"])).count()
    awaiting_review = app_query.filter(Application.status.in_(["ready_for_officer_review", "awaiting_review"])).count()
    rectification_req = app_query.filter(Application.status == "rectification_required").count()

    pending_v = db.query(VerificationAttempt).filter(
        VerificationAttempt.status.in_(["verification_pending", "source_unavailable"])
    ).count()

    unresolved_anomalies = finding_query.filter(
        Finding.finding_type.ilike("%anomaly%"),
        Finding.status == "open"
    ).count()

    # Status distribution
    status_counts = dict(
        db.query(Application.status, func.count(Application.id))
        .group_by(Application.status)
        .all()
    )

    # Recent applications
    recent = app_query.order_by(Application.created_at.desc()).limit(6).all()
    recent_outs = []
    for app in recent:
        inst = app.institution
        recent_outs.append(ApplicationOut(
            id=app.id,
            application_number=app.application_number,
            institution_id=app.institution_id,
            institution_name=inst.name if inst else None,
            institution_code=inst.institution_code if inst else None,
            category=app.category,
            academic_year=app.academic_year,
            status=app.status,
            application_data_json=app.application_data_json or {},
            submitted_at=app.submitted_at,
            created_by=app.created_by,
            created_at=app.created_at,
            updated_at=app.updated_at
        ))

    # Critical / High findings
    crit_findings = finding_query.filter(
        Finding.severity.in_(["critical", "high"]),
        Finding.status == "open"
    ).order_by(Finding.created_at.desc()).limit(8).all()

    return DashboardSummaryOut(
        total_applications=total_apps,
        draft_applications=draft_apps,
        under_processing=under_processing,
        awaiting_officer_review=awaiting_review,
        rectification_required=rectification_req,
        pending_verification=pending_v,
        unresolved_anomalies=unresolved_anomalies,
        average_processing_time_sec=4.2,
        status_distribution=status_counts,
        recent_applications=recent_outs,
        critical_findings=[FindingOut.model_validate(f) for f in crit_findings]
    )
