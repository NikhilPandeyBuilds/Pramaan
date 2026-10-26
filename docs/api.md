# NiyamAI — REST API Documentation & Contracts
**Base URL:** `http://localhost:8000/api`  
**Interactive Swagger Docs:** `http://localhost:8000/docs`

---

## 1. Authentication
- `POST /api/auth/login`: Authenticate with email/password, returns JWT token.
- `GET /api/auth/me`: Get active profile and assigned role.
- `POST /api/auth/logout`: Invalidate session.

## 2. Institutional Applications
- `GET /api/applications`: List applications (with query filters `category`, `status`, `academic_year`, `search`). Enforces institution data isolation.
- `POST /api/applications`: Create application draft.
- `GET /api/applications/{id}`: Retrieve application dossier (documents, findings, verifications, review trail).
- `PATCH /api/applications/{id}`: Update application draft fields.
- `POST /api/applications/{id}/submit`: Formally submit application.

## 3. Document Processing
- `POST /api/applications/{id}/documents`: Multipart upload (type + file). Triggers extraction pipeline immediately.
- `GET /api/applications/{id}/documents`: List submitted documents.
- `GET /api/documents/{id}`: Detailed extraction, OCR text, and anomaly flags.
- `GET /api/documents/{id}/download`: Authenticated file download.
- `POST /api/documents/{id}/reprocess`: Re-run extraction.

## 4. Regulatory Validation
- `POST /api/applications/{id}/validate`: Execute full validation orchestrator.
- `GET /api/applications/{id}/processing-status`: Returns status and counts.
- `GET /api/applications/{id}/findings`: List findings for application.

## 5. Source Verification
- `POST /api/documents/{id}/verify`: Query synthetic authority registry.
- `GET /api/documents/{id}/verification-attempts`: List verification history.
- `GET /api/verification/queue`: Central officer verification queue.

## 6. Review & Rectification
- `POST /api/findings/{id}/review`: Record officer decision with mandatory reason.
- `POST /api/applications/{id}/rectification`: Issue formal deficiency notice.
- `GET /api/applications/{id}/review-history`: Historical review actions.

## 7. Regulatory Rules
- `GET /api/rules`: List configured regulatory rules.
- `POST /api/rules`: Create new draft rule.
- `POST /api/rules/{id}/publish`: Publish rule version (Admin only).
- `GET /api/rules/{id}/versions`: Version history for rule code.

## 8. Reports & Dashboard
- `POST /api/applications/{id}/reports`: Generate official ReportLab PDF dossier.
- `GET /api/reports/{filename}/download`: Download generated PDF dossier.
- `GET /api/applications/{id}/audit`: Fetch immutable audit trail.
- `GET /api/dashboard/summary`: Database-backed dashboard metrics and distributions.
