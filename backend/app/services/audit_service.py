from typing import Dict, Any, Optional
from sqlalchemy.orm import Session
from app.models import AuditEvent

def log_audit_event(
    db: Session,
    actor_id: str,
    actor_name: str,
    action: str,
    entity_type: str,
    entity_id: str,
    details: Optional[Dict[str, Any]] = None,
    application_id: Optional[str] = None
) -> AuditEvent:
    event = AuditEvent(
        application_id=application_id,
        actor_id=actor_id,
        actor_name=actor_name,
        action=action,
        entity_type=entity_type,
        entity_id=entity_id,
        details_json=details or {}
    )
    db.add(event)
    db.commit()
    db.refresh(event)
    return event
