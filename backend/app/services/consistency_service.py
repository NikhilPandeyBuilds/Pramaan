from typing import List, Dict, Any, Tuple
from app.models import Application, Document, ExtractedField
from app.rules.engine import normalize_text

class ConsistencyService:
    @staticmethod
    def compare_cross_document_fields(
        application: Application,
        documents: List[Document],
        fields_by_doc: Dict[str, List[ExtractedField]]
    ) -> List[Dict[str, Any]]:
        """
        Cross-checks values of key identity and metric fields across application metadata and documents.
        Returns a list of structured discrepancy dictionaries.
        """
        discrepancies = []
        app_data = application.application_data_json or {}

        # 1. Check Institution Name consistency
        app_inst_name = application.institution.name if application.institution else app_data.get("institution_name", "")
        norm_app_name = normalize_text(app_inst_name)

        for doc in documents:
            doc_fields = fields_by_doc.get(doc.id, [])
            for f in doc_fields:
                if f.field_name == "institution_name" and norm_app_name:
                    norm_doc_name = normalize_text(f.field_value)
                    if norm_doc_name and norm_app_name != norm_doc_name:
                        discrepancies.append({
                            "type": "institution_name_mismatch",
                            "severity": "medium",
                            "expected_value": app_inst_name,
                            "observed_value": f.field_value,
                            "document_id": doc.id,
                            "explanation": f"Institution name '{f.field_value}' in {doc.original_filename} deviates from authorized institution record '{app_inst_name}'.",
                            "evidence": [{
                                "document_id": doc.id,
                                "filename": doc.original_filename,
                                "field_name": "institution_name",
                                "observed_value": f.field_value,
                                "snippet": f.evidence_snippet
                            }],
                            "suggested_action": "Check whether an official name change notification was issued by AICTE/State Government."
                        })

        # 2. Check Approved Intake across documents
        app_intake = str(app_data.get("total_approved_intake", "")).strip()
        for doc in documents:
            doc_fields = fields_by_doc.get(doc.id, [])
            for f in doc_fields:
                if f.field_name == "approved_intake" and app_intake:
                    if f.field_value.strip() != app_intake:
                        discrepancies.append({
                            "type": "intake_mismatch",
                            "severity": "high",
                            "expected_value": app_intake,
                            "observed_value": f.field_value,
                            "document_id": doc.id,
                            "explanation": f"Sanctioned intake ({f.field_value}) in {doc.original_filename} does not match current application form intake ({app_intake}).",
                            "evidence": [{
                                "document_id": doc.id,
                                "filename": doc.original_filename,
                                "field_name": "approved_intake",
                                "observed_value": f.field_value,
                                "snippet": f.evidence_snippet
                            }],
                            "suggested_action": "Verify if the application is for an increase in intake or if the previous year's approval was uploaded."
                        })

        return discrepancies
