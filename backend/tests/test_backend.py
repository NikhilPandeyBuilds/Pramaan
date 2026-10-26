import pytest
from datetime import datetime, timezone, timedelta
from app.db.session import SessionLocal
from app.models import Application, Document, ExtractedField, RegulatoryRule, Finding, User
from app.rules.engine import RegulatoryRuleEngine, parse_date, normalize_text
from app.rules.schemas import RuleResultStatus
from app.adapters.synthetic_authority import SyntheticAuthorityAdapter
from app.services.review_service import ReviewService
from app.services.report_service import ReportService
from app.core.security import create_access_token, decode_access_token, get_password_hash, verify_password

@pytest.fixture
def db():
    session = SessionLocal()
    yield session
    session.close()

def test_date_parsing_and_normalization():
    assert parse_date("2026-06-30") is not None
    assert parse_date("30/06/2026") is not None
    assert parse_date("30-06-2026") is not None
    assert normalize_text(" Apex Institute   OF Technology! ") == "apex institute of technology"

def test_security_hash_and_token():
    pw = "SecretTest123!"
    h = get_password_hash(pw)
    assert verify_password(pw, h)
    assert not verify_password("WrongPassword", h)

    token = create_access_token({"sub": "user-123", "role": "ADMIN"})
    payload = decode_access_token(token)
    assert payload is not None
    assert payload["sub"] == "user-123"
    assert payload["role"] == "ADMIN"

def test_synthetic_authority_adapter(db):
    adapter = SyntheticAuthorityAdapter(db=db)
    
    # Valid record
    res_valid = adapter.verify(
        source_name="NBA",
        reference_number="NBA-2025-APEX-CS",
        institution_code="1-109283741",
        submitted_fields={}
    )
    assert res_valid.status == "verified"

    # Expired record
    res_exp = adapter.verify(
        source_name="NBA",
        reference_number="NBA-EXP-2022-PUNE",
        institution_code="1-109283741",
        submitted_fields={}
    )
    assert res_exp.status == "expired"

    # Simulated Unavailable source
    res_unavail = adapter.verify(
        source_name="State Board",
        reference_number="REF-UNAVAILABLE-503",
        institution_code="1-109283741",
        submitted_fields={}
    )
    assert res_unavail.status == "source_unavailable"

def test_review_action_requires_reason(db):
    app = db.query(Application).first()
    assert app is not None

    user = db.query(User).filter(User.role == "REGULATORY_OFFICER").first()
    assert user is not None

    # Should raise error with empty reason
    with pytest.raises(Exception):
        ReviewService.process_review_action(
            db=db,
            application_id=app.id,
            actor_id=user.id,
            actor_name=user.full_name,
            action_type="confirm_finding",
            reason=""  # Empty reason
        )

    # Valid reason succeeds
    act = ReviewService.process_review_action(
        db=db,
        application_id=app.id,
        actor_id=user.id,
        actor_name=user.full_name,
        action_type="record_observation",
        reason="Verified identity against state gazette records."
    )
    assert act.id is not None
    assert act.action_type == "record_observation"

def test_report_generation(db):
    app = db.query(Application).first()
    assert app is not None

    pdf_path = ReportService.generate_validation_report_pdf(db, app.id)
    assert pdf_path.endswith(".pdf")
