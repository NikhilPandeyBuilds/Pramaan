from typing import List, Dict, Any
from sqlalchemy.orm import Session
from app.models import Application, Document, ExtractedField, RegulatoryRule, Finding, VerificationAttempt
from app.rules.engine import RegulatoryRuleEngine
from app.rules.schemas import RuleResultStatus
from app.services.document_service import process_document, check_duplicate_hashes
from app.services.consistency_service import ConsistencyService
from app.services.audit_service import log_audit_event
from app.adapters.synthetic_authority import SyntheticAuthorityAdapter

class ValidationOrchestrator:
    @staticmethod
    def validate_application(db: Session, application_id: str, actor_id: str, actor_name: str) -> Dict[str, Any]:
        application = db.query(Application).filter(Application.id == application_id).first()
        if not application:
            raise ValueError("Application not found")

        # 1. Ensure all documents are processed
        documents = db.query(Document).filter(Document.application_id == application.id).all()
        for doc in documents:
            if doc.processing_status != "processed":
                process_document(db, doc)

        # Reload documents and their extracted fields
        documents = db.query(Document).filter(Document.application_id == application.id).all()
        fields_by_doc: Dict[str, List[ExtractedField]] = {}
        for doc in documents:
            fields_by_doc[doc.id] = db.query(ExtractedField).filter(ExtractedField.document_id == doc.id).all()

        # 2. Check duplicate files
        duplicate_map = check_duplicate_hashes(db, application.id)

        # 3. Resolve active regulatory rules
        active_rules = db.query(RegulatoryRule).filter(
            RegulatoryRule.publication_status == "published"
        ).all()

        # 4. Run rule engine evaluations
        findings_to_create = []
        for rule in active_rules:
            result = RegulatoryRuleEngine.evaluate_rule(
                rule=rule,
                application=application,
                documents=documents,
                fields_by_doc=fields_by_doc,
                duplicate_docs=duplicate_map
            )

            # Create finding if rule failed, warning, or manual review required
            if result.status in (RuleResultStatus.FAILED, RuleResultStatus.WARNING, RuleResultStatus.MANUAL_REVIEW_REQUIRED):
                finding = Finding(
                    application_id=application.id,
                    rule_id=rule.id,
                    rule_code=rule.rule_code,
                    rule_version=rule.version,
                    document_id=result.document_id,
                    finding_type=f"rule_{result.status.value}",
                    severity=result.severity,
                    status="open",
                    expected_value=result.expected_value,
                    observed_value=result.observed_value,
                    explanation=result.explanation,
                    evidence_json={"items": result.evidence},
                    suggested_action=result.suggested_action or "Review evidence and verify against regulatory guidelines."
                )
                findings_to_create.append(finding)

        # 5. Run Cross-Document Consistency checks
        discrepancies = ConsistencyService.compare_cross_document_fields(
            application=application,
            documents=documents,
            fields_by_doc=fields_by_doc
        )
        for disc in discrepancies:
            finding = Finding(
                application_id=application.id,
                rule_code="CONSISTENCY-CROSS-001",
                rule_version=1,
                document_id=disc.get("document_id"),
                finding_type=disc["type"],
                severity=disc["severity"],
                status="open",
                expected_value=disc["expected_value"],
                observed_value=disc["observed_value"],
                explanation=disc["explanation"],
                evidence_json={"items": disc.get("evidence", [])},
                suggested_action=disc.get("suggested_action")
            )
            findings_to_create.append(finding)

        # 6. Execute source verifications where reference numbers exist
        adapter = SyntheticAuthorityAdapter(db=db)
        inst_code = application.institution.institution_code if application.institution else "DEMO-INST"

        for doc in documents:
            doc_fields = fields_by_doc.get(doc.id, [])
            ref_field = next((f for f in doc_fields if f.field_name == "reference_number"), None)
            if ref_field and ref_field.field_value:
                ref_num = ref_field.field_value
                source_name = "National Board of Accreditation" if "NBA" in doc.document_type else "AICTE Regulatory Portal"

                # Check if verification already ran recently
                existing_att = db.query(VerificationAttempt).filter(
                    VerificationAttempt.application_id == application.id,
                    VerificationAttempt.reference_number == ref_num
                ).first()

                if not existing_att:
                    v_res = adapter.verify(
                        source_name=source_name,
                        reference_number=ref_num,
                        institution_code=inst_code,
                        submitted_fields={"doc_type": doc.document_type}
                    )
                    attempt = VerificationAttempt(
                        document_id=doc.id,
                        application_id=application.id,
                        source_name=v_res.source_name,
                        source_type=v_res.source_type,
                        reference_number=v_res.reference_number,
                        status=v_res.status,
                        request_summary=v_res.request_summary,
                        response_summary=v_res.response_summary,
                        error_code=v_res.error_code,
                        created_by="system_validator"
                    )
                    db.add(attempt)

                    # If verification failed or returned mismatch, generate finding
                    if v_res.status in ("mismatch_detected", "expired", "source_unavailable"):
                        finding = Finding(
                            application_id=application.id,
                            rule_code="EXT-VERIFY-001",
                            rule_version=1,
                            document_id=doc.id,
                            finding_type=f"external_verification_{v_res.status}",
                            severity="high" if v_res.status != "source_unavailable" else "medium",
                            status="open",
                            expected_value="Verified active status in official registry",
                            observed_value=v_res.status,
                            explanation=f"External source verification against '{source_name}' returned: {v_res.response_summary}",
                            evidence_json={"items": [{
                                "source_name": source_name,
                                "reference_number": ref_num,
                                "status": v_res.status,
                                "response": v_res.response_summary
                            }]},
                            suggested_action="Officer must conduct manual verification through alternate official channels."
                        )
                        findings_to_create.append(finding)

        # 7. Atomically replace findings for this run
        db.query(Finding).filter(
            Finding.application_id == application.id,
            Finding.status == "open"
        ).delete()

        for f in findings_to_create:
            db.add(f)

        # 8. Update application status
        has_critical = any(f.severity in ("high", "critical") for f in findings_to_create)
        if has_critical:
            application.status = "ready_for_officer_review"
        elif len(findings_to_create) > 0:
            application.status = "awaiting_review"
        else:
            application.status = "completed"

        db.commit()

        # 9. Audit event
        log_audit_event(
            db=db,
            actor_id=actor_id,
            actor_name=actor_name,
            action="APPLICATION_VALIDATION_COMPLETED",
            entity_type="application",
            entity_id=application.id,
            details={
                "documents_count": len(documents),
                "findings_generated": len(findings_to_create),
                "resulting_status": application.status
            },
            application_id=application.id
        )

        return {
            "application_id": application.id,
            "status": application.status,
            "findings_count": len(findings_to_create),
            "documents_checked": len(documents)
        }
