import os
import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Query, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.core.config import settings
from app.models import Document, Application, User, ExtractedField
from app.schemas import DocumentOut, DocumentDetailOut, ExtractedFieldOut
from app.api.dependencies import get_current_user
from app.services.document_service import validate_and_save_upload, process_document
from app.services.audit_service import log_audit_event
from app.utils.seed_data import create_sample_pdf

router = APIRouter(tags=["Documents"])

@router.post("/applications/{application_id}/documents", response_model=DocumentDetailOut)
def upload_document(
    application_id: str,
    document_type: str = Form(...),
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    app = db.query(Application).filter(Application.id == application_id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found.")

    if current_user.role == "INSTITUTION_USER" and app.institution_id != current_user.institution_id:
        raise HTTPException(status_code=403, detail="Access denied.")

    storage_key, file_path, file_size, sha256_hash = validate_and_save_upload(file)

    doc = Document(
        application_id=app.id,
        document_type=document_type,
        storage_key=storage_key,
        original_filename=file.filename or "uploaded_file.pdf",
        mime_type=file.content_type or "application/pdf",
        file_size=file_size,
        sha256=sha256_hash,
        processing_status="uploaded",
        uploaded_by=current_user.email
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)

    # Trigger extraction immediately
    doc = process_document(db, doc)

    log_audit_event(
        db=db,
        actor_id=current_user.id,
        actor_name=current_user.full_name,
        action="DOCUMENT_UPLOADED",
        entity_type="document",
        entity_id=doc.id,
        details={
            "document_type": document_type,
            "filename": doc.original_filename,
            "sha256": sha256_hash,
            "page_count": doc.page_count
        },
        application_id=app.id
    )

    fields = db.query(ExtractedField).filter(ExtractedField.document_id == doc.id).all()

    return DocumentDetailOut(
        id=doc.id,
        application_id=doc.application_id,
        document_type=doc.document_type,
        original_filename=doc.original_filename,
        mime_type=doc.mime_type,
        file_size=doc.file_size,
        sha256=doc.sha256,
        processing_status=doc.processing_status,
        page_count=doc.page_count,
        classification_confidence=doc.classification_confidence,
        metadata_json=doc.metadata_json or {},
        anomaly_flags_json=doc.anomaly_flags_json or {},
        uploaded_by=doc.uploaded_by,
        created_at=doc.created_at,
        extracted_text=doc.extracted_text,
        extracted_fields=[ExtractedFieldOut.model_validate(f) for f in fields]
    )

@router.post("/applications/{application_id}/documents/sample", response_model=DocumentDetailOut)
def upload_synthetic_sample_document(
    application_id: str,
    sample_type: str = Query(..., description="valid_eoa, expired_nba, altered_noc, or mismatched_id"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Generates and uploads an official synthetic test document to easily evaluate compliance edge cases.
    """
    app = db.query(Application).filter(Application.id == application_id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found.")

    if current_user.role == "INSTITUTION_USER" and app.institution_id != current_user.institution_id:
        raise HTTPException(status_code=403, detail="Access denied.")

    inst_code = app.institution.institution_code if app.institution else "1-109283741"
    inst_name = app.institution.name if app.institution else "Apex Institute of Engineering & Technology"

    storage_key = f"sample_{sample_type}_{uuid.uuid4().hex[:8]}.pdf"
    file_path = os.path.join(settings.LOCAL_STORAGE_PATH, storage_key)

    if sample_type == "valid_eoa":
        doc_type = "APPROVAL_LETTER"
        filename = f"AICTE_Approval_Order_2025_{inst_code}.pdf"
        sha256_hash = create_sample_pdf(
            file_path,
            "AICTE Extension of Approval (EoA) Order 2025-26",
            {
                "institution_code": inst_code,
                "institution_name": inst_name,
                "reference_number": f"F.No. Western/{inst_code}/2025/EOA",
                "approved_intake": "420",
                "issue_date": "2025-05-15",
                "expiry_date": "2026-06-30"
            }
        )
    elif sample_type == "expired_nba":
        doc_type = "NBA_ACCREDITATION"
        filename = "NBA_Accreditation_Certificate_2021.pdf"
        sha256_hash = create_sample_pdf(
            file_path,
            "National Board of Accreditation Certificate",
            {
                "institution_code": inst_code,
                "institution_name": inst_name,
                "reference_number": "NBA-EXP-2022-PUNE",
                "issue_date": "2020-07-01",
                "expiry_date": "2023-06-30"
            }
        )
    elif sample_type == "altered_noc":
        doc_type = "LAND_NOC"
        filename = "Municipal_Fire_NOC_Altered_Permit.pdf"
        sha256_hash = create_sample_pdf(
            file_path,
            "Municipal Corporation Land & Building Clearance",
            {
                "institution_code": inst_code,
                "institution_name": inst_name,
                "reference_number": "NOC-PUNE-MC-2024",
                "issue_date": "2024-01-10",
                "built_up_area": "25,000 SQM"
            }
        )
    elif sample_type == "mismatched_id":
        doc_type = "APPROVAL_LETTER"
        filename = "Approval_Letter_Branch_Campus.pdf"
        sha256_hash = create_sample_pdf(
            file_path,
            "AICTE Extension of Approval (Branch Campus)",
            {
                "institution_code": "1-999988887",  # Deliberate mismatch
                "institution_name": f"{inst_name} (Satellite Campus)",
                "reference_number": "F.No. West/1-999988887/2024",
                "approved_intake": "180"
            }
        )
    else:
        raise HTTPException(status_code=400, detail=f"Unknown sample type '{sample_type}'")

    file_size = os.path.getsize(file_path)

    doc = Document(
        application_id=app.id,
        document_type=doc_type,
        storage_key=storage_key,
        original_filename=filename,
        mime_type="application/pdf",
        file_size=file_size,
        sha256=sha256_hash,
        processing_status="uploaded",
        uploaded_by=current_user.email
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)

    doc = process_document(db, doc)

    log_audit_event(
        db=db,
        actor_id=current_user.id,
        actor_name=current_user.full_name,
        action="SYNTHETIC_DOCUMENT_ATTACHED",
        entity_type="document",
        entity_id=doc.id,
        details={"sample_type": sample_type, "filename": filename},
        application_id=app.id
    )

    fields = db.query(ExtractedField).filter(ExtractedField.document_id == doc.id).all()

    return DocumentDetailOut(
        id=doc.id,
        application_id=doc.application_id,
        document_type=doc.document_type,
        original_filename=doc.original_filename,
        mime_type=doc.mime_type,
        file_size=doc.file_size,
        sha256=doc.sha256,
        processing_status=doc.processing_status,
        page_count=doc.page_count,
        classification_confidence=doc.classification_confidence,
        metadata_json=doc.metadata_json or {},
        anomaly_flags_json=doc.anomaly_flags_json or {},
        uploaded_by=doc.uploaded_by,
        created_at=doc.created_at,
        extracted_text=doc.extracted_text,
        extracted_fields=[ExtractedFieldOut.model_validate(f) for f in fields]
    )

@router.get("/applications/{application_id}/documents", response_model=List[DocumentOut])
def list_application_documents(
    application_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    app = db.query(Application).filter(Application.id == application_id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found.")

    if current_user.role == "INSTITUTION_USER" and app.institution_id != current_user.institution_id:
        raise HTTPException(status_code=403, detail="Access denied.")

    docs = db.query(Document).filter(Document.application_id == application_id).order_by(Document.created_at.desc()).all()
    return docs

@router.get("/documents/{document_id}", response_model=DocumentDetailOut)
def get_document(
    document_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    doc = db.query(Document).filter(Document.id == document_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found.")

    app = doc.application
    if current_user.role == "INSTITUTION_USER" and app.institution_id != current_user.institution_id:
        raise HTTPException(status_code=403, detail="Access denied.")

    fields = db.query(ExtractedField).filter(ExtractedField.document_id == doc.id).all()
    return DocumentDetailOut(
        id=doc.id,
        application_id=doc.application_id,
        document_type=doc.document_type,
        original_filename=doc.original_filename,
        mime_type=doc.mime_type,
        file_size=doc.file_size,
        sha256=doc.sha256,
        processing_status=doc.processing_status,
        page_count=doc.page_count,
        classification_confidence=doc.classification_confidence,
        metadata_json=doc.metadata_json or {},
        anomaly_flags_json=doc.anomaly_flags_json or {},
        uploaded_by=doc.uploaded_by,
        created_at=doc.created_at,
        extracted_text=doc.extracted_text,
        extracted_fields=[ExtractedFieldOut.model_validate(f) for f in fields]
    )

@router.get("/documents/{document_id}/download")
def download_document(
    document_id: str,
    inline: bool = Query(False, description="Stream inline for browser PDF viewer iframe"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    doc = db.query(Document).filter(Document.id == document_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found.")

    app = doc.application
    if current_user.role == "INSTITUTION_USER" and app.institution_id != current_user.institution_id:
        raise HTTPException(status_code=403, detail="Access denied.")

    file_path = os.path.join(settings.LOCAL_STORAGE_PATH, doc.storage_key)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Underlying document file not found on storage.")

    headers = {}
    if inline:
        headers["Content-Disposition"] = f'inline; filename="{doc.original_filename}"'
    else:
        headers["Content-Disposition"] = f'attachment; filename="{doc.original_filename}"'

    return FileResponse(
        path=file_path,
        filename=doc.original_filename,
        media_type=doc.mime_type,
        headers=headers
    )

@router.delete("/documents/{document_id}")
def delete_document(
    document_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    doc = db.query(Document).filter(Document.id == document_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found.")

    app = doc.application
    if current_user.role == "INSTITUTION_USER" and app.institution_id != current_user.institution_id:
        raise HTTPException(status_code=403, detail="Access denied.")

    # Delete extracted fields first
    db.query(ExtractedField).filter(ExtractedField.document_id == doc.id).delete()

    # Log audit
    log_audit_event(
        db=db,
        actor_id=current_user.id,
        actor_name=current_user.full_name,
        action="DOCUMENT_DELETED",
        entity_type="document",
        entity_id=doc.id,
        details={"original_filename": doc.original_filename, "document_type": doc.document_type},
        application_id=app.id
    )

    db.delete(doc)
    db.commit()

    return {"message": "Document removed successfully."}

@router.get("/documents/{document_id}/fields", response_model=List[ExtractedFieldOut])
def get_document_fields(
    document_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    doc = db.query(Document).filter(Document.id == document_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found.")

    app = doc.application
    if current_user.role == "INSTITUTION_USER" and app.institution_id != current_user.institution_id:
        raise HTTPException(status_code=403, detail="Access denied.")

    fields = db.query(ExtractedField).filter(ExtractedField.document_id == document_id).all()
    return fields

@router.post("/documents/{document_id}/reprocess", response_model=DocumentDetailOut)
def reprocess_document_endpoint(
    document_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    doc = db.query(Document).filter(Document.id == document_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found.")

    app = doc.application
    if current_user.role == "INSTITUTION_USER" and app.institution_id != current_user.institution_id:
        raise HTTPException(status_code=403, detail="Access denied.")

    doc = process_document(db, doc)
    fields = db.query(ExtractedField).filter(ExtractedField.document_id == doc.id).all()

    log_audit_event(
        db=db,
        actor_id=current_user.id,
        actor_name=current_user.full_name,
        action="DOCUMENT_REPROCESSED",
        entity_type="document",
        entity_id=doc.id,
        details={"page_count": doc.page_count, "fields_extracted": len(fields)},
        application_id=app.id
    )

    return DocumentDetailOut(
        id=doc.id,
        application_id=doc.application_id,
        document_type=doc.document_type,
        original_filename=doc.original_filename,
        mime_type=doc.mime_type,
        file_size=doc.file_size,
        sha256=doc.sha256,
        processing_status=doc.processing_status,
        page_count=doc.page_count,
        classification_confidence=doc.classification_confidence,
        metadata_json=doc.metadata_json or {},
        anomaly_flags_json=doc.anomaly_flags_json or {},
        uploaded_by=doc.uploaded_by,
        created_at=doc.created_at,
        extracted_text=doc.extracted_text,
        extracted_fields=[ExtractedFieldOut.model_validate(f) for f in fields]
    )
