# NiyamAI — SIH Demonstration & Evaluation Guide
**SIH Problem Statement:** 26261  
**Category:** Software | **Theme:** Smart Automation

---

## 1. Quick Access Credentials

| Role | Email | Password | Scope & Notes |
|---|---|---|---|
| **Regional Approval Officer** | `officer@aicte.gov.in` | `OfficerPass123!` | Review applications, confirm/dismiss findings, issue rectifications |
| **Institution Representative** | `institution@demo.ac.in` | `DemoPass123!` | Apex Institute of Engineering & Technology, upload docs, drafts |
| **Rule Manager / Admin** | `admin@aicte.gov.in` | `AdminPass123!` | Configure APH handbook rules, publish rule versions |

*Pro Tip:* The login screen (`http://localhost:5173/login`) provides **One-Click Demo Fill buttons** for all three personas.

---

## 2. Seeded Evaluation Scenarios

| Scenario # | Application ID | Seeded Condition | What to Demonstrate |
|---|---|---|---|
| **Scenario 1** | `AICTE-EOA-2026-001` | Clean compliant submission | All checks passed, 0 open findings, download complete PDF dossier. |
| **Scenario 2** | `AICTE-EOA-2026-002` | Missing mandatory Land NOC | Rule `EOA-NOC-002` failed, document presence check flagged. |
| **Scenario 3** | `AICTE-EOA-2026-003` | Expired NBA Certificate | Rule `NBA-VALID-003` failed (expired 2023-06-30 vs 2026 active requirement). |
| **Scenario 4** | `AICTE-EOA-2026-004` | Institution ID Mismatch | Rule `ID-MATCH-004` critical failure (`1-109283741` vs `1-999988887`). |
| **Scenario 5** | `AICTE-EOA-2026-005` | Duplicate Document Reuse | Rule `DUP-CHECK-005` flagged identical SHA-256 copy reused from another application. |
| **Scenario 6** | `AICTE-EOA-2026-006` | External Authority Mismatch | Sandbox query against NBA returns mismatch (registered to another college). |
| **Scenario 7** | `AICTE-EOA-2026-007` | External Source Unavailable | External endpoint timeout (HTTP 503) handled gracefully without crashing. |
| **Scenario 8** | `AICTE-EOA-2026-008` | Document Visual Alteration | Irregular font baseline and pixel edge alteration signal flagged for manual review. |
| **Scenario 9** | `AICTE-EOA-2026-009` | Rectification Required | Status is `rectification_required` with official notice from regional officer. |

---

## 3. Step-by-Step SIH Live Demonstration Script

1. **Sign In**:
   - Go to `http://localhost:5173/login`.
   - Click "Regional Approval Officer" pill and sign in.
2. **Dashboard Overview**:
   - Review live database metrics (Total Applications, Awaiting Officer Review, Unresolved Anomalies).
   - Point out the status distribution chart and priority unresolved findings.
3. **Application Dossier Inspection**:
   - Navigate to Applications. Open `AICTE-EOA-2026-003` (Expired NBA Certificate).
   - Go to **3. Document Intelligence Lab**: Show the split view with the extracted text, confidence score (98%), and snippet.
   - Go to **4. Compliance Findings**: Point out rule `NBA-VALID-003` with expected vs observed values.
   - Click **Run Regulatory Validation**: Show instant re-evaluation against the active rule engine.
4. **Officer Review & Reason Enforcement**:
   - Click "Confirm Finding" or "Dismiss Finding" on a finding. Show the modal requiring a mandatory justification.
   - Show the recorded decision in the audit trail.
5. **Download Official PDF Report**:
   - Click "Download Dossier PDF". Show the generated PDF with metadata table, documents table, findings list, and AICTE statutory disclaimer.
6. **Regulatory Rules Administration**:
   - Navigate to `/admin/rules`. Show the Approval Process Handbook clauses mapped to declarative rules, and show version history.
