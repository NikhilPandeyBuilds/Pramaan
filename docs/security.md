# NiyamAI — Security & Privacy Architecture

---

## 1. Authentication & Role-Based Access Control (RBAC)

1. **Password Hashing**: PBKDF2-HMAC-SHA256 with random 16-byte cryptographic salts and 100,000 iterations.
2. **Session Security**: JWT bearer tokens signed with HS-256 and configurable expiration.
3. **Data Isolation**: Institution users are strictly partitioned (`institution_id` filter) and cannot view or download documents from other institutions.
4. **Mandatory Audit Records**: All consequential officer actions (confirming findings, dismissing findings, issuing rectification requests, publishing regulatory rules) require mandatory recorded justifications and append to an audit trail.

---

## 2. Document & Upload Security

1. **Storage Isolation**: Uploaded documents are stored outside web roots using random UUID storage keys (`storage/uploads/<uuid>.pdf`). Direct URL traversal is impossible.
2. **File Validation**:
   - File extensions validated against `.pdf`, `.png`, `.jpg`, `.jpeg`.
   - File size enforced with maximum limit (default: 25MB).
   - SHA-256 cryptographic hashes computed at ingestion.
3. **Download Protection**: Document downloads routed through `/api/documents/{id}/download` requiring active authenticated session and authorization check.

---

## 3. Privacy & AI Safety Principles

1. **No External LLM Leakage**: In the baseline local configuration, all OCR parsing and deterministic rules run locally using PyMuPDF and regex. Sensitive institutional records are not sent to third-party AI APIs.
2. **Decision-Support Boundary**: The platform is explicitly built as a decision-support platform. It cannot independently issue statutory approvals or rejections.
