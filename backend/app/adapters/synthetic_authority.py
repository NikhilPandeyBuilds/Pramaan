from datetime import datetime, timezone, date
from typing import Dict, Any, Optional
from sqlalchemy.orm import Session
from app.adapters.verification_base import VerificationAdapter, VerificationResult
from app.models import SyntheticAuthorityRecord

class SyntheticAuthorityAdapter(VerificationAdapter):
    def __init__(self, db: Optional[Session] = None):
        self.db = db

    def verify(
        self,
        source_name: str,
        reference_number: str,
        institution_code: str,
        submitted_fields: Dict[str, Any]
    ) -> VerificationResult:
        now = datetime.now(timezone.utc)
        ref_norm = reference_number.strip().upper()

        # Handle specific simulated edge-cases
        if "UNAVAILABLE" in ref_norm or "TIMEOUT" in ref_norm:
            return VerificationResult(
                source_name=source_name,
                source_type="synthetic_authority",
                reference_number=reference_number,
                status="source_unavailable",
                request_summary=f"Queried source '{source_name}' for Reference #{reference_number}",
                response_summary="Authority endpoint timed out (HTTP 503 Service Unavailable). Sandbox simulation for offline state.",
                checked_at=now,
                error_code="EXTERNAL_TIMEOUT_503"
            )

        if "UNSUPPORTED" in ref_norm:
            return VerificationResult(
                source_name=source_name,
                source_type="synthetic_authority",
                reference_number=reference_number,
                status="not_supported",
                request_summary=f"Queried source '{source_name}' for Reference #{reference_number}",
                response_summary="Issuing body has no online verification portal or API connector.",
                checked_at=now,
                error_code="CONNECTOR_NOT_SUPPORTED"
            )

        # Look up in DB if available
        record = None
        if self.db:
            record = self.db.query(SyntheticAuthorityRecord).filter(
                SyntheticAuthorityRecord.reference_number == reference_number
            ).first()

        if record:
            if record.status == "EXPIRED":
                return VerificationResult(
                    source_name=source_name,
                    source_type="synthetic_authority",
                    reference_number=reference_number,
                    status="expired",
                    request_summary=f"Queried source '{source_name}' for Record #{reference_number}",
                    response_summary=f"Authority record found, but marked EXPIRED on {record.expiry_date}.",
                    checked_at=now,
                    matched_data=record.payload_json
                )

            if record.institution_code and record.institution_code.upper() != institution_code.strip().upper():
                return VerificationResult(
                    source_name=source_name,
                    source_type="synthetic_authority",
                    reference_number=reference_number,
                    status="mismatch_detected",
                    request_summary=f"Queried source '{source_name}' with InstCode '{institution_code}'",
                    response_summary=f"Record #{reference_number} exists but belongs to '{record.institution_name}' ({record.institution_code}), not '{institution_code}'.",
                    checked_at=now,
                    matched_data=record.payload_json
                )

            # Record matches institution
            return VerificationResult(
                source_name=source_name,
                source_type="synthetic_authority",
                reference_number=reference_number,
                status="verified",
                request_summary=f"Verified against authorized registry for Reference #{reference_number}",
                response_summary=f"Record verified successfully. Authorized issued record confirmed for {record.institution_name}.",
                checked_at=now,
                matched_data=record.payload_json
            )

        # Fallback heuristic if not in DB table
        if "VALID" in ref_norm or "NBA" in ref_norm or "2025" in ref_norm:
            return VerificationResult(
                source_name=source_name,
                source_type="synthetic_authority",
                reference_number=reference_number,
                status="verified",
                request_summary=f"Queried source '{source_name}' for Reference #{reference_number}",
                response_summary=f"Record confirmed active in synthetic sandbox authority registry.",
                checked_at=now,
                matched_data={"reference_number": reference_number, "verified_at": now.isoformat()}
            )

        return VerificationResult(
            source_name=source_name,
            source_type="synthetic_authority",
            reference_number=reference_number,
            status="manual_review_required",
            request_summary=f"Queried source '{source_name}' for Reference #{reference_number}",
            response_summary="No exact automated match in authority database. Officer must verify hardcopy or dispatch manual inquiry.",
            checked_at=now,
            error_code="RECORD_NOT_INDEXED"
        )
