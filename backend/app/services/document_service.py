import hashlib
import os
import uuid
from typing import Tuple, List, Dict
from fastapi import UploadFile, HTTPException
from sqlalchemy.orm import Session
from app.core.config import settings
from app.models import Document, ExtractedField
from app.services.extraction_service import extract_pdf_data

ALLOWED_EXTENSIONS = {".pdf", ".png", ".jpg", ".jpeg"}
MAX_FILE_BYTES = settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024

def validate_and_save_upload(file: UploadFile) -> Tuple[str, str, int, str]:
    """
    Validates file extension, size, computes SHA-256 and writes to secure local storage.
    Returns: (storage_key, file_path, file_size, sha256_hash)
    """
    original_filename = file.filename or "uploaded_document.pdf"
    _, ext = os.path.splitext(original_filename.lower())
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type '{ext}'. Only PDF, PNG, and JPEG files are permitted."
        )

    # Read and buffer safely
    content = file.file.read()
    file_size = len(content)
    if file_size > MAX_FILE_BYTES:
        raise HTTPException(
            status_code=400,
            detail=f"File exceeds maximum allowed size of {settings.MAX_UPLOAD_SIZE_MB}MB."
        )

    sha256 = hashlib.sha256(content).hexdigest()
    storage_key = f"{uuid.uuid4()}{ext}"
    dest_path = os.path.join(settings.LOCAL_STORAGE_PATH, storage_key)

    with open(dest_path, "wb") as f:
        f.write(content)

    return storage_key, dest_path, file_size, sha256

def process_document(db: Session, document: Document) -> Document:
    """
    Extracts text, metadata, fields and anomaly flags for a stored document and persists results.
    """
    file_path = os.path.join(settings.LOCAL_STORAGE_PATH, document.storage_key)
    if not os.path.exists(file_path):
        document.processing_status = "failed"
        db.commit()
        return document

    document.processing_status = "processing"
    db.commit()

    try:
        full_text, page_count, metadata, fields_data, anomaly_flags = extract_pdf_data(file_path)

        document.extracted_text = full_text
        document.page_count = page_count
        document.metadata_json = metadata
        document.anomaly_flags_json = anomaly_flags
        document.processing_status = "processed"

        # Clear existing extracted fields if re-processing
        db.query(ExtractedField).filter(ExtractedField.document_id == document.id).delete()

        # Add new extracted fields
        for f in fields_data:
            field_obj = ExtractedField(
                document_id=document.id,
                field_name=f["field_name"],
                field_value=f["field_value"],
                confidence=f.get("confidence", 0.95),
                page_number=f.get("page_number", 1),
                evidence_snippet=f.get("evidence_snippet"),
                extraction_method=f.get("extraction_method", "pymupdf_regex")
            )
            db.add(field_obj)

        db.commit()
        db.refresh(document)
        return document
    except Exception as e:
        document.processing_status = "failed"
        document.metadata_json = {"error": str(e)}
        db.commit()
        return document

def check_duplicate_hashes(db: Session, current_app_id: str) -> Dict[str, List[str]]:
    """
    Finds documents with matching SHA-256 hashes within the same application or other applications.
    Returns mapping: {doc_id: ["Application #APP-123 (doc name)", ...]}
    """
    duplicate_map = {}
    current_docs = db.query(Document).filter(Document.application_id == current_app_id).all()
    for doc in current_docs:
        matching = db.query(Document).filter(
            Document.sha256 == doc.sha256,
            Document.id != doc.id
        ).all()
        if matching:
            match_labels = [f"{m.original_filename} (Doc ID: {m.id[:8]})" for m in matching]
            duplicate_map[doc.id] = match_labels
    return duplicate_map
