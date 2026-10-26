import re
from datetime import datetime, date
from typing import List, Dict, Any, Optional
from app.rules.schemas import RuleCheckType, RuleResultStatus, RuleEvaluationResult
from app.models import Application, Document, ExtractedField, RegulatoryRule

def parse_date(date_str: str) -> Optional[date]:
    if not date_str:
        return None
    date_str = str(date_str).strip()
    formats = [
        "%Y-%m-%d", "%d/%m/%Y", "%d-%m-%Y", "%Y/%m/%d",
        "%d %B %Y", "%d %b %Y", "%B %d, %Y", "%b %d, %Y"
    ]
    for fmt in formats:
        try:
            return datetime.strptime(date_str, fmt).date()
        except ValueError:
            pass
    # Regex fallback for YYYY-MM-DD or DD-MM-YYYY
    match = re.search(r'(\d{4})[-/](\d{1,2})[-/](\d{1,2})', date_str)
    if match:
        try:
            return date(int(match.group(1)), int(match.group(2)), int(match.group(3)))
        except ValueError:
            pass
    match2 = re.search(r'(\d{1,2})[-/](\d{1,2})[-/](\d{4})', date_str)
    if match2:
        try:
            return date(int(match2.group(3)), int(match2.group(2)), int(match2.group(1)))
        except ValueError:
            pass
    return None

def normalize_text(text: Optional[str]) -> str:
    if not text:
        return ""
    text = str(text).lower().strip()
    text = re.sub(r'[^\w\s]', ' ', text)
    text = re.sub(r'\s+', ' ', text)
    return text.strip()

class RegulatoryRuleEngine:
    @staticmethod
    def evaluate_rule(
        rule: RegulatoryRule,
        application: Application,
        documents: List[Document],
        fields_by_doc: Dict[str, List[ExtractedField]],
        duplicate_docs: Optional[Dict[str, List[str]]] = None
    ) -> RuleEvaluationResult:
        rule_def = rule.rule_definition or {}
        check_type = rule_def.get("check_type")
        severity = rule_def.get("severity", "medium")

        # 1. Required Document Check
        if check_type == RuleCheckType.REQUIRED_DOCUMENT.value:
            target_doc_type = rule_def.get("document_type")
            matching_docs = [d for d in documents if d.document_type == target_doc_type]
            if matching_docs:
                return RuleEvaluationResult(
                    rule_code=rule.rule_code,
                    rule_version=rule.version,
                    status=RuleResultStatus.PASSED,
                    severity=severity,
                    expected_value=f"Document of type '{target_doc_type}' must be uploaded",
                    observed_value=f"Uploaded: {matching_docs[0].original_filename}",
                    explanation=f"Mandatory document '{rule.title}' is present in the application dossier.",
                    evidence=[{
                        "document_id": matching_docs[0].id,
                        "filename": matching_docs[0].original_filename,
                        "document_type": matching_docs[0].document_type
                    }],
                    document_id=matching_docs[0].id
                )
            else:
                return RuleEvaluationResult(
                    rule_code=rule.rule_code,
                    rule_version=rule.version,
                    status=RuleResultStatus.FAILED,
                    severity=severity,
                    expected_value=f"Document of type '{target_doc_type}' is mandatory",
                    observed_value="Missing",
                    explanation=f"Required supporting document '{rule.title}' was not found in the submission.",
                    suggested_action=f"Upload the required {target_doc_type} under the supporting documents section.",
                    evidence=[]
                )

        # 2. Date Validity Check (e.g. Accreditation / Fire NOC expiry)
        elif check_type == RuleCheckType.DATE_VALIDITY.value:
            target_doc_type = rule_def.get("document_type")
            target_field = rule_def.get("field_name", "expiry_date")
            matching_docs = [d for d in documents if d.document_type == target_doc_type]
            if not matching_docs:
                return RuleEvaluationResult(
                    rule_code=rule.rule_code,
                    rule_version=rule.version,
                    status=RuleResultStatus.NOT_CHECKED,
                    severity=severity,
                    explanation=f"Cannot check validity: Document '{target_doc_type}' is not uploaded.",
                    suggested_action=f"Upload '{target_doc_type}' to verify validity."
                )

            doc = matching_docs[0]
            doc_fields = fields_by_doc.get(doc.id, [])
            field_obj = next((f for f in doc_fields if f.field_name == target_field), None)
            if not field_obj:
                return RuleEvaluationResult(
                    rule_code=rule.rule_code,
                    rule_version=rule.version,
                    status=RuleResultStatus.MANUAL_REVIEW_REQUIRED,
                    severity="medium",
                    expected_value=f"Valid date for '{target_field}'",
                    observed_value="Field not extracted",
                    explanation=f"The field '{target_field}' could not be extracted automatically from {doc.original_filename}.",
                    suggested_action="Officer must verify the certificate expiry date manually.",
                    document_id=doc.id
                )

            extracted_date = parse_date(field_obj.field_value)
            if not extracted_date:
                return RuleEvaluationResult(
                    rule_code=rule.rule_code,
                    rule_version=rule.version,
                    status=RuleResultStatus.MANUAL_REVIEW_REQUIRED,
                    severity="medium",
                    expected_value="Standard parseable date format",
                    observed_value=field_obj.field_value,
                    explanation=f"Date string '{field_obj.field_value}' in {doc.original_filename} could not be parsed automatically.",
                    suggested_action="Review the original certificate to confirm effective validity date.",
                    document_id=doc.id,
                    evidence=[{
                        "document_id": doc.id,
                        "field_name": target_field,
                        "observed_value": field_obj.field_value,
                        "snippet": field_obj.evidence_snippet
                    }]
                )

            current_date = date.today()
            if extracted_date < current_date:
                return RuleEvaluationResult(
                    rule_code=rule.rule_code,
                    rule_version=rule.version,
                    status=RuleResultStatus.FAILED,
                    severity=severity,
                    expected_value=f"Validity date >= {current_date.strftime('%Y-%m-%d')}",
                    observed_value=extracted_date.strftime('%Y-%m-%d'),
                    explanation=f"The certificate expired on {extracted_date.strftime('%d-%b-%Y')}. Regulatory compliance requires active validity.",
                    suggested_action="Obtain and upload renewed certificate or current extension order.",
                    document_id=doc.id,
                    evidence=[{
                        "document_id": doc.id,
                        "field_name": target_field,
                        "observed_value": field_obj.field_value,
                        "snippet": field_obj.evidence_snippet,
                        "page_number": field_obj.page_number
                    }]
                )
            else:
                return RuleEvaluationResult(
                    rule_code=rule.rule_code,
                    rule_version=rule.version,
                    status=RuleResultStatus.PASSED,
                    severity=severity,
                    expected_value=f"Valid through {current_date.strftime('%Y-%m-%d')}",
                    observed_value=extracted_date.strftime('%Y-%m-%d'),
                    explanation=f"Certificate is currently valid until {extracted_date.strftime('%d-%b-%Y')}.",
                    document_id=doc.id,
                    evidence=[{
                        "document_id": doc.id,
                        "field_name": target_field,
                        "observed_value": field_obj.field_value,
                        "snippet": field_obj.evidence_snippet,
                        "page_number": field_obj.page_number
                    }]
                )

        # 3. Identifier Equality Check (Application inst_code vs Document extracted inst_code)
        elif check_type == RuleCheckType.IDENTIFIER_EQUALITY.value:
            app_inst_code = application.institution.institution_code if application.institution else application.application_data_json.get("institution_code", "")
            target_field = rule_def.get("field_name", "institution_code")
            target_doc_type = rule_def.get("document_type")

            candidate_docs = [d for d in documents if (not target_doc_type or d.document_type == target_doc_type)]
            if not candidate_docs:
                return RuleEvaluationResult(
                    rule_code=rule.rule_code,
                    rule_version=rule.version,
                    status=RuleResultStatus.NOT_CHECKED,
                    severity=severity,
                    explanation=f"No documents available to check {target_field} equality.",
                )

            mismatches = []
            evidences = []
            for doc in candidate_docs:
                doc_fields = fields_by_doc.get(doc.id, [])
                for f in doc_fields:
                    if f.field_name == target_field:
                        evidences.append({
                            "document_id": doc.id,
                            "filename": doc.original_filename,
                            "field_name": f.field_name,
                            "observed_value": f.field_value,
                            "snippet": f.evidence_snippet,
                            "page_number": f.page_number
                        })
                        if normalize_text(f.field_value) != normalize_text(app_inst_code):
                            mismatches.append((doc, f))

            if mismatches:
                bad_doc, bad_f = mismatches[0]
                return RuleEvaluationResult(
                    rule_code=rule.rule_code,
                    rule_version=rule.version,
                    status=RuleResultStatus.FAILED,
                    severity=severity,
                    expected_value=app_inst_code,
                    observed_value=bad_f.field_value,
                    explanation=f"Institution identifier mismatch: Application states '{app_inst_code}', but document {bad_doc.original_filename} contains '{bad_f.field_value}'.",
                    suggested_action="Verify if the document belongs to a different campus or branch, or upload the corrected document.",
                    document_id=bad_doc.id,
                    evidence=evidences
                )
            elif evidences:
                return RuleEvaluationResult(
                    rule_code=rule.rule_code,
                    rule_version=rule.version,
                    status=RuleResultStatus.PASSED,
                    severity=severity,
                    expected_value=app_inst_code,
                    observed_value=app_inst_code,
                    explanation=f"Institution identifier '{app_inst_code}' matches consistently across submitted supporting documents.",
                    evidence=evidences
                )
            else:
                return RuleEvaluationResult(
                    rule_code=rule.rule_code,
                    rule_version=rule.version,
                    status=RuleResultStatus.NOT_CHECKED,
                    severity="low",
                    explanation=f"Field '{target_field}' was not detected in submitted documents."
                )

        # 4. Cross-Document Consistency (e.g. Program Intake or Institution Name across documents)
        elif check_type == RuleCheckType.CROSS_DOCUMENT_CONSISTENCY.value:
            field_name = rule_def.get("field_name", "institution_name")
            all_values = []
            evidences = []
            for doc in documents:
                doc_fields = fields_by_doc.get(doc.id, [])
                for f in doc_fields:
                    if f.field_name == field_name:
                        all_values.append((doc, f.field_value, f))
                        evidences.append({
                            "document_id": doc.id,
                            "filename": doc.original_filename,
                            "field_name": f.field_name,
                            "observed_value": f.field_value,
                            "snippet": f.evidence_snippet
                        })

            if len(all_values) >= 2:
                norm_vals = {normalize_text(v[1]) for v in all_values}
                if len(norm_vals) > 1:
                    raw_strings = " vs ".join([f"'{v[1]}' in {v[0].original_filename}" for v in all_values])
                    return RuleEvaluationResult(
                        rule_code=rule.rule_code,
                        rule_version=rule.version,
                        status=RuleResultStatus.WARNING,
                        severity=severity,
                        expected_value="Consistent value across all documents",
                        observed_value=raw_strings,
                        explanation=f"Cross-document inconsistency detected in '{field_name}'. Different values found across documents.",
                        suggested_action="Check for typographical variations, name change notifications or branch discrepancies.",
                        evidence=evidences
                    )
                else:
                    return RuleEvaluationResult(
                        rule_code=rule.rule_code,
                        rule_version=rule.version,
                        status=RuleResultStatus.PASSED,
                        severity=severity,
                        expected_value=all_values[0][1],
                        observed_value=all_values[0][1],
                        explanation=f"Field '{field_name}' is consistent across {len(all_values)} supporting documents.",
                        evidence=evidences
                    )
            else:
                return RuleEvaluationResult(
                    rule_code=rule.rule_code,
                    rule_version=rule.version,
                    status=RuleResultStatus.NOT_CHECKED,
                    severity="low",
                    explanation=f"Insufficient documents ({len(all_values)}) with extracted '{field_name}' for cross-comparison."
                )

        # 5. Duplicate Detection
        elif check_type == RuleCheckType.DUPLICATE_DETECTION.value:
            if duplicate_docs:
                for doc in documents:
                    if doc.id in duplicate_docs and duplicate_docs[doc.id]:
                        match_info = duplicate_docs[doc.id]
                        return RuleEvaluationResult(
                            rule_code=rule.rule_code,
                            rule_version=rule.version,
                            status=RuleResultStatus.WARNING,
                            severity="high",
                            expected_value="Unique original document file",
                            observed_value=f"SHA-256 match found: {doc.sha256[:12]}...",
                            explanation=f"Document '{doc.original_filename}' is byte-identical (identical SHA-256) to another document submission ({', '.join(match_info)}).",
                            suggested_action="Verify if the institution uploaded the same document twice or reused an affidavit across distinct requirements.",
                            document_id=doc.id,
                            evidence=[{
                                "document_id": doc.id,
                                "sha256": doc.sha256,
                                "matching_references": match_info
                            }]
                        )
            return RuleEvaluationResult(
                rule_code=rule.rule_code,
                rule_version=rule.version,
                status=RuleResultStatus.PASSED,
                severity="low",
                explanation="No byte-identical duplicate submissions detected for this application."
            )

        # 6. Anomaly Detection
        elif check_type == RuleCheckType.ANOMALY_DETECTION.value:
            anomalies = []
            for doc in documents:
                flags = doc.anomaly_flags_json or {}
                if flags.get("suspicious_modification") or flags.get("visual_anomaly_detected") or flags.get("low_ocr_confidence"):
                    anomalies.append((doc, flags))

            if anomalies:
                doc, flags = anomalies[0]
                reason = flags.get("reason", "Visual or metadata anomaly detected requiring manual review.")
                return RuleEvaluationResult(
                    rule_code=rule.rule_code,
                    rule_version=rule.version,
                    status=RuleResultStatus.MANUAL_REVIEW_REQUIRED,
                    severity="medium",
                    expected_value="Clean digital scan with consistent metadata",
                    observed_value="Anomaly flag triggered",
                    explanation=f"Document '{doc.original_filename}' has an anomaly signal: {reason}",
                    suggested_action="Regulatory officer should inspect original scan in Document Intelligence Lab.",
                    document_id=doc.id,
                    evidence=[{"document_id": doc.id, "flags": flags}]
                )
            return RuleEvaluationResult(
                rule_code=rule.rule_code,
                rule_version=rule.version,
                status=RuleResultStatus.PASSED,
                severity="low",
                explanation="No visual or metadata anomaly flags triggered on submitted documents."
            )

        # Fallback for unconfigured or unknown rule types
        return RuleEvaluationResult(
            rule_code=rule.rule_code,
            rule_version=rule.version,
            status=RuleResultStatus.NOT_CHECKED,
            severity="low",
            explanation=f"Rule check type '{check_type}' is unconfigured or pending calibration."
        )
