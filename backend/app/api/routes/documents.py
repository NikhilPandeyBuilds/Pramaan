import os
from typing import List
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.core.config import settings
from app.models import Document, Application, User, ExtractedField
from app.schemas import DocumentOut, DocumentDetailOut, ExtractedFieldOut
from app.api.dependencies import get_current_user
from app.services.document_service import validate_and_save_upload, process_document
from app.services.audit_service import log_audit_event

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
            "sha256": sha256_hash
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

    return FileResponse(
        path=file_path,
        filename=doc.original_filename,
        media_type=doc.mime_type
    )

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
