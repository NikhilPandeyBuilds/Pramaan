import uuid
from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models import Application, Institution, User
from app.schemas import ApplicationCreate, ApplicationUpdate, ApplicationOut, ApplicationDetailOut
from app.api.dependencies import get_current_user
from app.services.audit_service import log_audit_event

router = APIRouter(prefix="/applications", tags=["Applications"])

@router.get("", response_model=List[ApplicationOut])
def list_applications(
    category: Optional[str] = None,
    status_filter: Optional[str] = Query(None, alias="status"),
    academic_year: Optional[str] = None,
    search: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(Application)

    # Institution data isolation
    if current_user.role == "INSTITUTION_USER":
        if not current_user.institution_id:
            return []
        query = query.filter(Application.institution_id == current_user.institution_id)

    if category:
        query = query.filter(Application.category == category)
    if status_filter:
        query = query.filter(Application.status == status_filter)
    if academic_year:
        query = query.filter(Application.academic_year == academic_year)
    if search:
        search_pattern = f"%{search.strip()}%"
        query = query.join(Institution).filter(
            (Application.application_number.ilike(search_pattern)) |
            (Institution.name.ilike(search_pattern)) |
            (Institution.institution_code.ilike(search_pattern))
        )

    applications = query.order_by(Application.created_at.desc()).all()

    result = []
    for app in applications:
        inst = app.institution
        result.append(ApplicationOut(
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
    return result

@router.post("", response_model=ApplicationOut)
def create_application(
    payload: ApplicationCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    inst_id = current_user.institution_id or payload.institution_id
    if not inst_id:
        raise HTTPException(
            status_code=400,
            detail="Institution identifier is required to create an application."
        )

    # If institution user, ensure they can only create for their institution
    if current_user.role == "INSTITUTION_USER" and current_user.institution_id:
        inst_id = current_user.institution_id

    institution = db.query(Institution).filter(Institution.id == inst_id).first()
    if not institution:
        raise HTTPException(status_code=404, detail="Institution not found.")

    app_num = f"AICTE-{payload.category}-{datetime.now().strftime('%Y%m')}-{uuid.uuid4().hex[:6].upper()}"

    app_data = payload.application_data_json or {}
    app_data.setdefault("institution_name", institution.name)
    app_data.setdefault("institution_code", institution.institution_code)
    app_data.setdefault("state", institution.state)

    new_app = Application(
        application_number=app_num,
        institution_id=institution.id,
        category=payload.category,
        academic_year=payload.academic_year,
        status="draft",
        application_data_json=app_data,
        created_by=current_user.email
    )
    db.add(new_app)
    db.commit()
    db.refresh(new_app)

    log_audit_event(
        db=db,
        actor_id=current_user.id,
        actor_name=current_user.full_name,
        action="APPLICATION_DRAFT_CREATED",
        entity_type="application",
        entity_id=new_app.id,
        details={"application_number": app_num, "category": payload.category},
        application_id=new_app.id
    )

    return ApplicationOut(
        id=new_app.id,
        application_number=new_app.application_number,
        institution_id=new_app.institution_id,
        institution_name=institution.name,
        institution_code=institution.institution_code,
        category=new_app.category,
        academic_year=new_app.academic_year,
        status=new_app.status,
        application_data_json=new_app.application_data_json,
        submitted_at=new_app.submitted_at,
        created_by=new_app.created_by,
        created_at=new_app.created_at,
        updated_at=new_app.updated_at
    )

@router.get("/{application_id}", response_model=ApplicationDetailOut)
def get_application(
    application_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    app = db.query(Application).filter(Application.id == application_id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found.")

    if current_user.role == "INSTITUTION_USER" and app.institution_id != current_user.institution_id:
        raise HTTPException(status_code=403, detail="Access to other institutions' applications is prohibited.")

    inst = app.institution
    return ApplicationDetailOut(
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
        updated_at=app.updated_at,
        documents=app.documents,
        findings=app.findings,
        verification_attempts=app.verification_attempts,
        review_actions=app.review_actions
    )

@router.patch("/{application_id}", response_model=ApplicationOut)
def update_application(
    application_id: str,
    payload: ApplicationUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    app = db.query(Application).filter(Application.id == application_id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found.")

    if current_user.role == "INSTITUTION_USER" and app.institution_id != current_user.institution_id:
        raise HTTPException(status_code=403, detail="Access denied.")

    if payload.category:
        app.category = payload.category
    if payload.academic_year:
        app.academic_year = payload.academic_year
    if payload.application_data_json is not None:
        merged = app.application_data_json.copy() if app.application_data_json else {}
        merged.update(payload.application_data_json)
        app.application_data_json = merged

    db.commit()
    db.refresh(app)

    inst = app.institution
    return ApplicationOut(
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
    )

@router.post("/{application_id}/submit", response_model=ApplicationOut)
def submit_application(
    application_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    app = db.query(Application).filter(Application.id == application_id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found.")

    if current_user.role == "INSTITUTION_USER" and app.institution_id != current_user.institution_id:
        raise HTTPException(status_code=403, detail="Access denied.")

    app.status = "submitted"
    app.submitted_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(app)

    log_audit_event(
        db=db,
        actor_id=current_user.id,
        actor_name=current_user.full_name,
        action="APPLICATION_SUBMITTED",
        entity_type="application",
        entity_id=app.id,
        details={"status": "submitted"},
        application_id=app.id
    )

    inst = app.institution
    return ApplicationOut(
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
    )
