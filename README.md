# BrandGuard AI

### Explainable AI-Powered Brand Governance Platform

BrandGuard AI is an AI-powered brand governance platform designed to help organisations ensure that their content follows approved brand guidelines, messaging standards, and factual claims.

The platform allows creators to submit content for automated auditing against approved brand sources. It identifies unsupported, contradicted, outdated, and ambiguous claims, provides evidence-linked findings, and enables human reviewers to make approval decisions.

Our goal is to make brand compliance more transparent, explainable, secure, and accountable.

---

## Project Overview

Organisations often struggle to maintain consistent brand communication across marketing materials, documents, and digital content.

Manual reviews can be time-consuming, inconsistent, and difficult to audit.

BrandGuard AI addresses this challenge through:

- AI-powered content auditing.
- Retrieval-based verification against approved brand guidelines.
- Evidence-linked findings with source references.
- Human-in-the-loop review and approval workflows.
- Version-aware content governance.
- Tamper-evident approval records.

## Key Features

### 1. Content Submission
- Submit content for brand compliance auditing.
- Support for text-based content and document uploads.
- Maintain content and version history.

### 2. Brand Source Management
- Upload and manage approved brand guidelines and reference documents.
- Maintain source versions and approval status.
- Use approved sources as the foundation for content verification.

### 3. AI-Powered Content Auditing
- Analyse submitted content against approved brand sources.
- Identify unsupported, contradicted, outdated, and ambiguous claims.
- Generate explainable findings.
- Link findings to relevant source evidence.

### 4. Human Review and Approval
- Enable reviewers to inspect AI-generated findings.
- Approve or reject submitted content.
- Maintain reviewer decisions and audit history.
- Prevent creators from approving their own submissions.

### 5. Governance and Version Control
- Maintain immutable content versions.
- Track changes to approved brand sources.
- Require re-review when relevant source changes affect previously approved content.
- Ensure approvals are associated with the exact content and source versions reviewed.

### 6. Security and Integrity
- Role-based access control.
- Tenant-level data isolation.
- Backend-controlled evidence validation.
- HMAC-SHA256-based approval integrity verification.
- Fail-safe auditing: processing failures must never be treated as compliance approval.

---

## Technology Stack

| Layer | Technologies |
|---|---|
| Frontend | React, TypeScript, Vite, Tailwind CSS |
| Backend | Python, FastAPI |
| Primary Database | PostgreSQL |
| Vector Database | Qdrant |
| AI / LLM | Groq API, Ollama |
| Embeddings | Sentence Transformers |
| Document Processing | PDF and DOCX extraction |
| Authentication | JWT-based authentication |
| Integrity Verification | HMAC-SHA256 |
| Version Control | Git and GitHub |

*The stack describes the project's intended architecture; individual integrations and features may still be under development.*

---

## System Architecture

BrandGuard AI follows a modular monolithic architecture with a unified backend responsible for core application operations.

```text
                  BRANDGUARD AI
                        |
          +-------------+-------------+
          |                           |
      FRONTEND                    BACKEND
   React + TypeScript               FastAPI
          |                           |
          |                  +--------+--------+
          |                  |        |        |
          |               Auth    Governance  Audit
          |                  |        |        |
          |                  +--------+--------+
          |                           |
          |                 +---------+---------+
          |                 |         |         |
          |              PostgreSQL Qdrant  File Storage
          |                 |
          +-----------------+
                    API
```

### Core Components

- **Frontend:** Provides dashboards, source management, content submission, audit findings, and review workflows.
- **Backend:** Handles authentication, business logic, auditing, evidence validation, governance, and approvals.
- **PostgreSQL:** Acts as the authoritative system of record.
- **Qdrant:** Supports semantic search over indexed source chunks.
- **Private Object Storage:** Stores original uploaded documents.
- **AI Services:** Support content analysis and explainable brand compliance checks.

---

## User Roles

BrandGuard AI is designed around role-based access:

| Role | Responsibility |
|---|---|
| Organisation Admin | Manages organisation settings and users |
| Source Owner / Brand Manager | Manages approved brand sources |
| Creator | Submits content for auditing |
| Reviewer / Approver | Reviews findings and approves or rejects content |
| Compliance Reviewer | Performs compliance oversight and verification |

Access to features and resources is controlled by backend authorization.

---

## Audit Finding Categories

The auditing system uses the following finding categories:

| Category | Description |
|---|---|
| SUPPORTED | Claim is supported by approved evidence |
| UNSUPPORTED | No sufficient supporting evidence is found |
| CONTRADICTED | Claim conflicts with approved source information |
| OUTDATED | Claim relies on outdated information |
| AMBIGUOUS_RULE | Relevant brand guideline is unclear |
| REVIEW_UNAVAILABLE | Audit cannot provide a reliable result |

An unavailable or failed audit must not be interpreted as a compliant result.

---

## Project Structure

```text
BrandGuard-AI/
│
├── backend/
│   ├── app/
│   │   ├── api/
│   │   ├── core/
│   │   ├── database/
│   │   ├── models/
│   │   ├── schemas/
│   │   └── services/
│   ├── migrations/
│   ├── scripts/
│   ├── tests/
│   └── requirements.txt
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── services/
│   │   ├── types/
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   └── index.css
│   ├── public/
│   ├── package.json
│   └── vite.config.ts
│
├── docs/
│   └── Project documentation
│
├── infrastructure/
│
├── .gitignore
└── README.md
```

*The structure above represents the current project layout. Additional modules may be introduced as development progresses.*

---

## Getting Started

### Prerequisites

Make sure the following tools are installed:

- Python 3.10 or later
- Node.js and npm
- Git
- PostgreSQL
- Qdrant (when using vector search)

### 1. Clone the Repository

```bash
git clone https://github.com/Preritkumar16/BrandGuard-AI.git
cd BrandGuard-AI
```

### 2. Frontend Setup

Navigate to the frontend directory:

```bash
cd frontend
npm install
```

Create a local environment file using `.env.example` and configure the required environment variables.

Start the development server:

```bash
npm run dev
```

The frontend will be available at the local URL displayed in your terminal.

### 3. Backend Setup

Open a separate terminal and navigate to the backend:

```bash
cd backend
```

Create and activate a virtual environment:

**Windows PowerShell:**

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Configure the backend environment variables using the project's environment example file.

Start the FastAPI application using the backend's configured application entry point.

### 4. Database Configuration

Configure PostgreSQL and Qdrant according to the backend environment settings.

Ensure the required database migrations and indexes are applied before testing database-dependent functionality.

---

## Security and Governance Principles

BrandGuard AI follows several important security principles:

1. **Tenant Isolation:** Organisations must only access their own data.
2. **Evidence Validation:** The backend validates citations against approved sources and stored passages.
3. **Immutable Versions:** Changes to submitted content create new versions.
4. **Approval Integrity:** Approval records are cryptographically linked to the reviewed content and source versions.
5. **Human Oversight:** AI findings support decisions; authorised human reviewers control final approval.
6. **Fail-Safe Processing:** Failed or unavailable audits cannot produce a compliant status.
7. **Prompt Injection Protection:** Untrusted submitted content is isolated from system instructions.

---

## Development Status

The frontend and backend codebases have been merged into the `development` branch.

| Component | Status |
|---|---|
| Frontend foundation | Implemented |
| Backend foundation | Merged into development |
| Frontend navigation and UI | Implemented |
| Frontend service layer | Implemented |
| Live frontend-backend integration | In progress |
| Authentication and role enforcement | In progress |
| PostgreSQL integration | In progress |
| Qdrant retrieval | Planned / In progress |
| AI-powered auditing | Planned / In progress |
| Evidence validation | Planned / In progress |
| Human approval workflow | Planned / In progress |
| HMAC approval verification | Planned / In progress |
| Evaluation benchmark | Planned |

*Status should be updated as features are implemented and verified. A merged component does not automatically mean its functionality has been fully tested.*

---

## Project Vision

BrandGuard AI aims to move brand governance from manual, fragmented review processes to an explainable, evidence-driven, and auditable system.

By combining AI-powered verification with human oversight, version control, and cryptographic integrity, the platform aims to help organisations maintain trust and consistency in every piece of published content.

---

## Repository

**GitHub:** https://github.com/Preritkumar16/BrandGuard-AI

**Current integration branch:** `development`

---

*Built for the Inkloom AI Hackathon.*
