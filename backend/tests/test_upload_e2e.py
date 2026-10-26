import io
import httpx
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph
from reportlab.lib.styles import getSampleStyleSheet

BASE_URL = "http://127.0.0.1:8000/api"

def create_in_memory_pdf(text: str) -> bytes:
    buf = io.BytesIO()
    doc = SimpleDocTemplate(buf, pagesize=letter)
    styles = getSampleStyleSheet()
    story = [
        Paragraph("<b>AICTE TEST DOCUMENT INTAKE</b>", styles["Heading1"]),
        Paragraph(text, styles["Normal"]),
    ]
    doc.build(story)
    buf.seek(0)
    return buf.read()

def test_document_upload_journey():
    with httpx.Client(base_url=BASE_URL, timeout=15.0) as client:
        # 1. Login as Officer
        login_res = client.post("/auth/login", json={
            "email": "officer@aicte.gov.in",
            "password": "OfficerPass123!"
        })
        assert login_res.status_code == 200
        token = login_res.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # 2. Get an application
        apps_res = client.get("/applications", headers=headers)
        assert apps_res.status_code == 200
        app_id = apps_res.json()[0]["id"]

        # 3. Upload a real generated PDF file via multipart/form-data
        pdf_bytes = create_in_memory_pdf(
            "INSTITUTION CODE: 1-109283741\n"
            "INSTITUTION NAME: Apex Institute of Engineering & Technology\n"
            "APPROVED INTAKE: 420\n"
            "EXPIRY DATE: 2027-06-30\n"
            "REF NO: F.No. Western/TEST-UPLOAD/2026/EOA"
        )

        files = {
            "file": ("Custom_Uploaded_Certificate.pdf", pdf_bytes, "application/pdf")
        }
        data = {
            "document_type": "APPROVAL_LETTER"
        }

        upload_res = client.post(
            f"/applications/{app_id}/documents",
            headers=headers,
            data=data,
            files=files
        )
        assert upload_res.status_code == 200, upload_res.text
        doc_data = upload_res.json()
        doc_id = doc_data["id"]
        assert doc_data["original_filename"] == "Custom_Uploaded_Certificate.pdf"
        assert doc_data["processing_status"] == "processed"
        assert len(doc_data["extracted_fields"]) >= 3
        print(f"[PASS] Real multipart document upload verified: {doc_data['original_filename']} ({len(doc_data['extracted_fields'])} fields extracted)")

        # 4. Verify fields extracted match content
        field_names = [f["field_name"] for f in doc_data["extracted_fields"]]
        assert "institution_code" in field_names
        assert "approved_intake" in field_names
        print(f"[PASS] Extracted fields verified: {field_names}")

        # 5. Test 1-click synthetic sample document generation
        sample_res = client.post(
            f"/applications/{app_id}/documents/sample?sample_type=expired_nba",
            headers=headers
        )
        assert sample_res.status_code == 200, sample_res.text
        sample_doc = sample_res.json()
        assert sample_doc["document_type"] == "NBA_ACCREDITATION"
        print(f"[PASS] Synthetic compliance test document attached: {sample_doc['original_filename']}")

        # 6. Test inline stream download (with token query)
        dl_res = client.get(
            f"http://127.0.0.1:8000/api/documents/{doc_id}/download?inline=true&token={token}"
        )
        assert dl_res.status_code == 200
        assert dl_res.headers.get("content-type") == "application/pdf"
        assert "inline" in dl_res.headers.get("content-disposition", "")
        print("[PASS] Document inline stream download for iframe verified")

        # 7. Test delete document
        del_res = client.delete(f"/documents/{doc_id}", headers=headers)
        assert del_res.status_code == 200
        print(f"[PASS] Document cleanup/removal verified for doc_id {doc_id}")

if __name__ == "__main__":
    test_document_upload_journey()
    print("\nALL END-TO-END DOCUMENT UPLOAD TESTS COMPLETED SUCCESSFULLY!")
