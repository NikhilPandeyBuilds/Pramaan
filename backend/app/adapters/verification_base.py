from abc import ABC, abstractmethod
from typing import Dict, Any, Optional
from pydantic import BaseModel
from datetime import datetime

class VerificationResult(BaseModel):
    source_name: str
    source_type: str
    reference_number: str
    status: str  # verified, mismatch_detected, expired, verification_pending, source_unavailable, manual_review_required, not_supported
    request_summary: str
    response_summary: str
    checked_at: datetime
    error_code: Optional[str] = None
    matched_data: Optional[Dict[str, Any]] = None

class VerificationAdapter(ABC):
    @abstractmethod
    def verify(
        self,
        source_name: str,
        reference_number: str,
        institution_code: str,
        submitted_fields: Dict[str, Any]
    ) -> VerificationResult:
        pass
