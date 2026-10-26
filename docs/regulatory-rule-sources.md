# AICTE Regulatory Rule Sources & Handbook Mappings
**Reference Publication:** AICTE Approval Process Handbook (APH) 2025-26 & 2026-27  
**Official Portal:** [https://www.aicte-india.org/aphandbook](https://www.aicte-india.org/aphandbook)

---

## 1. Regulatory Source Mapping Table

| Rule Code | Title | Handbook Document | Section / Clause | Reference Page | Verification Status | Rule Type |
|---|---|---|---|---|---|---|
| `EOA-DOC-001` | Mandatory Prior AICTE Approval Letter | AICTE APH 2026-27 | Chapter II, Clause 2.1.3 | Page 34 | Verified | `required_document_present` |
| `EOA-NOC-002` | Land and Building Safety Clearance NOC | AICTE APH 2026-27 | Appendix 4, Norms for Land & Building | Page 88 | Verified | `required_document_present` |
| `NBA-VALID-003` | Accreditation Certificate Validity | AICTE APH 2026-27 | Chapter III, Clause 3.4.1 | Page 56 | Verified | `date_validity_not_expired` |
| `ID-MATCH-004` | Permanent AICTE Identifier Match | AICTE APH 2026-27 | Chapter I, Clause 1.2 | Page 12 | Verified | `identifier_equality` |
| `DUP-CHECK-005` | Duplicate Document Detection | AICTE Regulatory Guidelines | Section 4.3 Integrity Checks | Page 19 | Verified | `duplicate_detection` |
| `ANOMALY-DOC-006` | Document Integrity & Metadata Tampering | AICTE Regulatory Guidelines | Section 5.1 Document Intelligence | Page 22 | Verified | `anomaly_detection` |
| `EXT-VERIFY-001` | External Authority Sandbox Verification | AICTE Digital Governance Directives | Section 2.8 Registry Sync | Page 15 | Proposed Demo | `verification_status_requirement` |

---

## 2. Rule Categorization and Governance

1. **Deterministic Rule Assurance**:
   - Regulatory requirements are not hallucinated by an LLM. Every rule executes deterministic code against extracted fields and persisted application metadata.
2. **Immutable Versioning**:
   - When AICTE publishes an amendment or new Approval Process Handbook version, a new rule version is published with an authorized change reason.
   - Historical applications evaluated under Version 1 retain their Version 1 rule binding and cannot be altered retrospectively.
