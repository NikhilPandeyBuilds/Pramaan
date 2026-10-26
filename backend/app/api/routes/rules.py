from typing import List, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models import RegulatoryRule, User
from app.schemas import RegulatoryRuleCreate, RegulatoryRuleUpdate, RegulatoryRuleOut
from app.api.dependencies import get_current_user, require_roles
from app.services.audit_service import log_audit_event

router = APIRouter(prefix="/rules", tags=["Regulatory Rules Administration"])

@router.get("", response_model=List[RegulatoryRuleOut])
def list_rules(
    category: Optional[str] = None,
    publication_status: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(RegulatoryRule)
    if category:
        query = query.filter(RegulatoryRule.category == category)
    if publication_status:
        query = query.filter(RegulatoryRule.publication_status == publication_status)

    rules = query.order_by(RegulatoryRule.rule_code.asc(), RegulatoryRule.version.desc()).all()
    return rules

@router.get("/{rule_id}", response_model=RegulatoryRuleOut)
def get_rule(
    rule_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    rule = db.query(RegulatoryRule).filter(RegulatoryRule.id == rule_id).first()
    if not rule:
        raise HTTPException(status_code=404, detail="Regulatory rule not found.")
    return rule

@router.post("", response_model=RegulatoryRuleOut)
def create_draft_rule(
    payload: RegulatoryRuleCreate,
    current_user: User = Depends(require_roles(["ADMIN"])),
    db: Session = Depends(get_db)
):
    # Check max version for rule_code
    existing_rules = db.query(RegulatoryRule).filter(RegulatoryRule.rule_code == payload.rule_code).all()
    next_ver = 1
    if existing_rules:
        next_ver = max(r.version for r in existing_rules) + 1

    rule = RegulatoryRule(
        rule_code=payload.rule_code.strip().upper(),
        version=next_ver,
        title=payload.title,
        description=payload.description,
        category=payload.category,
        document_type=payload.document_type,
        rule_definition=payload.rule_definition,
        source_document=payload.source_document,
        source_section=payload.source_section,
        source_page=payload.source_page,
        source_url=payload.source_url,
        verification_status=payload.verification_status,
        publication_status="draft",
        created_by=current_user.email
    )
    db.add(rule)
    db.commit()
    db.refresh(rule)

    log_audit_event(
        db=db,
        actor_id=current_user.id,
        actor_name=current_user.full_name,
        action="REGULATORY_RULE_DRAFT_CREATED",
        entity_type="regulatory_rule",
        entity_id=rule.id,
        details={"rule_code": rule.rule_code, "version": rule.version}
    )

    return rule

@router.patch("/{rule_id}", response_model=RegulatoryRuleOut)
def update_rule(
    rule_id: str,
    payload: RegulatoryRuleUpdate,
    current_user: User = Depends(require_roles(["ADMIN"])),
    db: Session = Depends(get_db)
):
    rule = db.query(RegulatoryRule).filter(RegulatoryRule.id == rule_id).first()
    if not rule:
        raise HTTPException(status_code=404, detail="Regulatory rule not found.")

    if rule.publication_status == "published":
        raise HTTPException(
            status_code=400,
            detail="Published rules cannot be edited in-place to protect historical audits. Create a new draft version instead."
        )

    if payload.title:
        rule.title = payload.title
    if payload.description:
        rule.description = payload.description
    if payload.category:
        rule.category = payload.category
    if payload.rule_definition is not None:
        rule.rule_definition = payload.rule_definition
    if payload.source_document:
        rule.source_document = payload.source_document
    if payload.source_section:
        rule.source_section = payload.source_section
    if payload.source_page:
        rule.source_page = payload.source_page
    if payload.publication_status:
        rule.publication_status = payload.publication_status

    db.commit()
    db.refresh(rule)
    return rule

@router.post("/{rule_id}/publish", response_model=RegulatoryRuleOut)
def publish_rule(
    rule_id: str,
    change_reason: str = Query(..., min_length=5),
    current_user: User = Depends(require_roles(["ADMIN"])),
    db: Session = Depends(get_db)
):
    rule = db.query(RegulatoryRule).filter(RegulatoryRule.id == rule_id).first()
    if not rule:
        raise HTTPException(status_code=404, detail="Regulatory rule not found.")

    rule.publication_status = "published"
    rule.published_at = datetime.now(timezone.utc)
    rule.approved_by = current_user.email
    db.commit()
    db.refresh(rule)

    log_audit_event(
        db=db,
        actor_id=current_user.id,
        actor_name=current_user.full_name,
        action="REGULATORY_RULE_PUBLISHED",
        entity_type="regulatory_rule",
        entity_id=rule.id,
        details={"rule_code": rule.rule_code, "version": rule.version, "change_reason": change_reason}
    )

    return rule

@router.get("/{rule_id}/versions", response_model=List[RegulatoryRuleOut])
def get_rule_versions(
    rule_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    rule = db.query(RegulatoryRule).filter(RegulatoryRule.id == rule_id).first()
    if not rule:
        raise HTTPException(status_code=404, detail="Regulatory rule not found.")

    versions = db.query(RegulatoryRule).filter(
        RegulatoryRule.rule_code == rule.rule_code
    ).order_by(RegulatoryRule.version.desc()).all()
    return versions
