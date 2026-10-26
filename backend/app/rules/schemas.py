from typing import Dict, Any, List, Optional
from pydantic import BaseModel
from enum import Enum

class RuleCheckType(str, Enum):
    REQUIRED_DOCUMENT = "required_document_present"
    REQUIRED_FIELD = "required_field_populated"
    DATE_VALIDITY = "date_validity_not_expired"
    IDENTIFIER_EQUALITY = "identifier_equality"
    CROSS_DOCUMENT_CONSISTENCY = "cross_document_consistency"
    VALUE_COMPARISON = "value_comparison"
    VERIFICATION_STATUS = "verification_status_requirement"
    DUPLICATE_DETECTION = "duplicate_detection"
    ANOMALY_DETECTION = "anomaly_detection"

class RuleResultStatus(str, Enum):
    PASSED = "passed"
    FAILED = "failed"
    WARNING = "warning"
    NOT_APPLICABLE = "not_applicable"
    NOT_CHECKED = "not_checked"
    MANUAL_REVIEW_REQUIRED = "manual_review_required"

class RuleEvaluationResult(BaseModel):
    rule_code: str
    rule_version: int
    status: RuleResultStatus
    severity: str  # low, medium, high, critical
    expected_value: Optional[str] = None
    observed_value: Optional[str] = None
    explanation: str
    evidence: List[Dict[str, Any]] = []
    suggested_action: Optional[str] = None
    document_id: Optional[str] = None
