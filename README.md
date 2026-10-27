# Pramaan — AICTE Approval & Compliance Platform
**Smart India Hackathon (SIH) Problem Statement:** 26261  
**Organization:** All India Council for Technical Education (AICTE), Regulation Bureau  
**Theme:** Smart Automation | **Category:** Software  

---

## 1. Project Overview

**Pramaan** is an AICTE regulatory intelligence and compliance decision-support system. It automates institutional Extension of Approval (EoA) verification by combining:
- **Intelligent Document Extraction**: PDF text extraction, metadata parsing, and OCR anomaly detection using PyMuPDF and computer vision signals.
- **Deterministic Regulatory Rule Engine**: Rule configurations mapped directly to the AICTE Approval Process Handbook (APH 2026-27), evaluating document presence, validity periods, identifier exact matches, and intake consistency without AI hallucination.
- **External Source Verification Sandbox**: Simulates automated connectors to the National Board of Accreditation (NBA), State DTEs, and central registries, handling matches, mismatches, and offline status gracefully.
- **Human-in-the-Loop Officer Workflow**: Preserves statutory authority by enforcing mandatory justification reasons for all officer decisions, formal deficiency rectification notices, and an immutable audit trail.
- **Official Dossier Generation**: Instant generation of downloadable, printable validation reports (PDF) via ReportLab with statutory disclaimers.

---

## 2. System Architecture

```text
niyamai/
├── frontend/                  # React + Vite + TypeScript + Tailwind CSS
│   ├── src/
│   │   ├── components/layout/ # Navbar, Sidebar, AppLayout
│   │   ├── context/           # AuthContext (RBAC)
│   │   ├── lib/               # Typed API client
│   │   ├── pages/             # Login, Dashboard, ApplicationList, NewApplication,
│   │   │                      # ApplicationDetail, VerificationCentre, RulesAdmin, AuditTrail
│   │   └── types/             # TypeScript interfaces
├── backend/                   # Python + FastAPI + SQLAlchemy 2.x
│   ├── app/
│   │   ├── adapters/          # Synthetic Authority Sandbox Connector (NBA, State DTE)
│   │   ├── api/routes/        # REST endpoints (auth, apps, docs, rules, review, reports)
│   │   ├── core/              # Config (Pydantic Settings), Security (PBKDF2/JWT)
│   │   ├── models/            # SQLAlchemy models (App, Doc, Finding, Review, Audit)
│   │   ├── rules/             # Deterministic Regulatory Rule Engine
│   │   ├── services/          # Extraction, Validation, Consistency, ReportLab PDF
│   │   └── utils/             # Seed demo data generator & sample PDF creator
│   ├── tests/                 # Pytest unit tests & live E2E HTTPX test suites
│   └── requirements.txt
├── storage/                   # Private upload vault and generated PDF dossiers
├── docs/                      # Comprehensive documentation
│   ├── architecture.md
│   ├── regulatory-rule-sources.md
│   ├── api.md
│   ├── security.md
│   ├── testing.md
│   └── demo-guide.md
├── docker-compose.yml
├── .env.example
└── README.md
```

---

## 3. Quick Start (Local Setup)

### Prerequisites
- Python 3.10+ (tested on Python 3.14)
- Node.js 18+ (tested on Node v24)
- Windows PowerShell or Unix Shell

### 3.1 Backend Setup
```powershell
# Navigate to backend directory
cd backend

# Create & activate virtual environment
python -m venv .venv
.\.venv\Scripts\Activate.ps1    # On Linux/macOS: source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start backend server (starts SQLite DB & automatically seeds demo data on port 8000)
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

### 3.2 Frontend Setup
```powershell
# In a new terminal, navigate to frontend
cd frontend

# Install npm dependencies
npm install

# Start Vite dev server
npm run dev
```

Open your browser at **`http://localhost:5173`**.

---

## 4. Demo Accounts & Personas

The login page includes **One-Click Demo Fill buttons**:

| Persona | Email | Password | Role & Scope |
|---|---|---|---|
| **Regional Approval Officer** | `officer@aicte.gov.in` | `OfficerPass123!` | Review dossiers, confirm/dismiss findings, issue rectification notices |
| **Institution Representative** | `institution@demo.ac.in` | `DemoPass123!` | Apex Institute of Engineering & Technology (isolated data) |
| **Rule Manager / Admin** | `admin@aicte.gov.in` | `AdminPass123!` | Configure and publish APH regulatory rules and versioning |

---

## 5. Seeded Test Scenarios

The system comes pre-seeded with 9 realistic institutional scenarios:
1. **`AICTE-EOA-2026-001`**: Fully compliant application with all checks passed.
2. **`AICTE-EOA-2026-002`**: Missing mandatory Land NOC document.
3. **`AICTE-EOA-2026-003`**: Expired NBA accreditation certificate date.
4. **`AICTE-EOA-2026-004`**: Institution permanent AICTE ID mismatch between document and form.
5. **`AICTE-EOA-2026-005`**: Duplicate document reuse (byte-identical SHA-256 match).
6. **`AICTE-EOA-2026-006`**: External NBA sandbox authority mismatch.
7. **`AICTE-EOA-2026-007`**: External connector simulated timeout / unavailable (HTTP 503).
8. **`AICTE-EOA-2026-008`**: Document visual anomaly / non-uniform font baseline in municipal seal.
9. **`AICTE-EOA-2026-009`**: Formal rectification required with recorded officer instructions.

---

## 6. Running Tests

### Backend Unit & Integration Tests (Pytest)
```powershell
cd backend
.\.venv\Scripts\pytest -v
```
*Result: 5 passed in 2.02s.*

### Live End-to-End API Suite (HTTPX)
```powershell
cd backend
.\.venv\Scripts\python tests/test_e2e_live.py
```
*Result: All 9 live endpoints passed with valid PDF dossier generation.*

### Frontend Production Build
```powershell
cd frontend
npm run build
```
*Result: Built in 2.25s with 0 errors.*

---

## 7. Statutory Disclaimer

NiyamAI is an automated decision-support platform designed to assist authorized AICTE regulatory officers. Automated extractions, anomaly signals, and rule checks are advisory only. Final statutory approval or rejection authority is reserved exclusively to competent AICTE regulatory committees.
