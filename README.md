BrandGuard AI
Explainable AI-Powered Brand Governance Platform
BrandGuard AI is an AI-powered brand governance platform designed to
help organisations review marketing and business content against
approved brand guidelines, reference documents, and factual claims.

It combines document processing, semantic retrieval, AI-assisted
compliance analysis, version-aware governance, and human review. The
platform is designed to make brand-compliance decisions more
transparent, explainable, and accountable.
Implementation note: This README distinguishes locally tested
capabilities, deployed application components, and functionality that
still requires complete production integration or additional security
hardening. A feature being present in the architecture or interface
does not, by itself, mean that its complete workflow is
production-verified.

Project Overview
Organisations publish content across many channels and formats. Keeping
every claim and message consistent with approved brand information can
be difficult when reviews are manual, fragmented, or lack traceable
evidence.

BrandGuard AI is designed to help teams:
- Manage approved brand sources and their versions.
- Process reference documents and retrieve relevant source passages.
- Assess submitted content against approved information.
- Surface potential unsupported, contradicted, outdated, or ambiguous
  claims.
- Connect audit findings to source evidence.
- Support human review and approval.
- Maintain content-version and approval-integrity information.
The intended workflow is evidence-led: AI supports the review process,
while authorised people remain responsible for final approval decisions.
Core Capabilities
1. Brand Source and Document Processing
- Manage brand reference sources and source versions.
- Process PDF and DOCX documents.
- Extract and chunk document content for retrieval.
- Generate embeddings using Sentence Transformers.
- Store and retrieve semantic representations using Qdrant.
2. Evidence-Grounded Auditing
- Retrieve relevant passages from approved source material.
- Use Groq-powered inference for AI-assisted compliance analysis.
- Structure audit findings around source evidence.
- Distinguish unsupported, contradicted, outdated, and ambiguous
  information from cases where a reliable audit cannot be completed.
Important: Retrieval and model output do not automatically establish
that a citation is semantically correct. Evidence validation and
end-to-end audit orchestration require continued verification and
hardening.
3. Version-Aware Governance
- Maintain asset, source, and version data models.
- Use SHA-256 content hashing for version-integrity workflows.
- Use HMAC-SHA256 for approval-integrity mechanisms.
- Associate governance records with the content and source versions
  under review.
Automatic approval invalidation, source-change impact reassessment, and
the complete production approval lifecycle remain areas requiring
further integration and verification.
4. Human Review
The product is designed to provide review interfaces for inspecting
findings and making governance decisions. Backend enforcement of
reviewer permissions and complete approval/rejection lifecycle behaviour
must be verified before treating the workflow as production-ready.
5. Multi-Tenant Security
The application includes JWT authentication and role-based
access-control foundations, organisation-aware data models,
organisation-scoped application queries, and tenant metadata filtering
for vector retrieval.

Additional database-level and operational security controls remain
necessary, including PostgreSQL Row-Level Security (RLS), complete
tenant-aware referential constraints, and broader cross-tenant security
testing.
Technology Stack
  Layer                                   Technologies
  Frontend                                React 19, TypeScript, Vite, Tailwind CSS
Backend                                 Python, FastAPI, Pydantic
ORM and migrations                      SQLAlchemy (async), Alembic
Primary database                        PostgreSQL
Vector database                         Qdrant
Embeddings                              Sentence Transformers
LLM inference                           Groq API
Optional local inference architecture   Ollama
Document processing                     PyPDF, python-docx
Authentication                          JWT
Integrity mechanisms                    SHA-256, HMAC-SHA256
Local infrastructure                    Docker Compose
Frontend deployment                     Vercel
Backend deployment                      Railway

Ollama is an optional local-inference path in the architecture.
Confidential-mode zero-egress behaviour must not be assumed without
isolated network-level testing.
System Architecture
BrandGuard AI uses a modular frontend and FastAPI backend, with
PostgreSQL as the system of record and Qdrant for semantic retrieval.
                  BRANDGUARD AI
                        |
             +----------+----------+
             |                     |
          FRONTEND               BACKEND
      React + TypeScript          FastAPI
             |                     |
             |          +----------+----------+
             |          |          |          |
             |       Auth      Sources     Governance
             |          |          |          |
             |          +----------+----------+
             |                     |
             |          +----------+----------+
             |          |          |          |
             |      PostgreSQL   Qdrant   AI Services
             |       System     Retrieval  Groq / Ollama
             |       of Record
             |                     |
             +------ REST API -----+
Main Components
- Frontend: Dashboard, source-management, asset-management, audit,
  and review interfaces.
- FastAPI backend: API endpoints, authentication foundations,
  business logic, and service orchestration.
- PostgreSQL: Persistent application data and relational
  governance records.
- Qdrant: Semantic vector storage and retrieval for source
  passages.
- Sentence Transformers: Local embedding generation.
- Groq API: LLM inference for AI-assisted auditing.
- Ollama: Optional local inference architecture for environments
  requiring local model execution.
Repository Structure
The following is a high-level view of the project. The exact files may
evolve as development continues.
BrandGuard-AI/
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
├── docs/
├── infrastructure/
├── .gitignore
└── README.md
Getting Started
Prerequisites
Install the following tools:
- Git
- Python 3.12 or a compatible version supported by the backend
  dependencies
- Node.js and npm
- PostgreSQL
- Qdrant (required for vector retrieval)
Docker and Docker Compose can be used to run local infrastructure
services.
1. Clone the repository
git clone https://github.com/Preritkumar16/BrandGuard-AI.git
cd BrandGuard-AI
2. Start the frontend
cd frontend
npm install
Create a local environment file based on the frontend environment
example, if present, and configure the API base URL.

Start the development server:
npm run dev
Vite prints the local development URL in the terminal.
3. Set up the backend
Open a separate terminal:
cd backend
python -m venv .venv
Activate the environment.

Windows PowerShell:
.\.venv\Scripts\Activate.ps1
macOS / Linux:
source .venv/bin/activate
Install backend dependencies:
pip install -r requirements.txt
Configure the backend environment variables using the environment
example supplied by the project. Do not commit real credentials, API
keys, database passwords, or JWT/HMAC secrets.

Start the FastAPI application using the configured application entry
point and command for the current backend setup.
4. Configure PostgreSQL and Qdrant
Configure the PostgreSQL connection and Qdrant endpoint in the backend
environment.

Before running database-dependent features:
1. Ensure PostgreSQL and Qdrant are available.
2. Review the configured Alembic migration target.
3. Apply the required migrations using the project's migration
   configuration.
4. Confirm that the backend can connect to both services.
Do not run migrations against a production database without reviewing
the migration and taking an appropriate backup.
Verification and Testing
The following engineering checks have been reported as passing in the
local development environment:
  Check                               Result
  Backend automated test suite        28 tests passed

  Python bytecode compilation         No syntax errors reported

  TypeScript static checking          No type errors reported

  Vite production build               Completed successfully

  SQLAlchemy model registration       12 ORM models registered

  Local PostgreSQL and Qdrant         Validated with Docker
infrastructure                      

  Sentence Transformers embedding     Tested locally
workflow                            

  Qdrant semantic retrieval           Tested locally

  Groq inference workflow             Tested locally

  SHA-256 and HMAC-SHA256 mechanisms  Tested locally
JWT, RBAC foundations, and          Tested locally
tenant-scoped application logic
These results describe local engineering validation. They do not
establish that every feature is fully integrated and verified in the
deployed environment.
Deployment
- Frontend: BrandGuard AI on
  Vercel
- Backend: Deployed on Railway.
The frontend and backend have been deployed separately. Complete
production end-to-end verification across the deployed frontend,
backend, PostgreSQL, Qdrant, document processing, and AI inference
should be performed before describing the entire system as
production-ready.
Security and Data Integrity
BrandGuard AI is designed around the following principles:
1. Tenant isolation: Organisation data must remain isolated across
   API, database, and vector-search operations.
2. Backend authorisation: Access decisions must be enforced by the
   backend, not only by frontend controls.
3. Evidence traceability: Findings should reference retrieved
   source material and stored passages.
4. Version integrity: SHA-256 hashes can identify changes to
   versioned content.
5. Approval integrity: HMAC-SHA256 can provide keyed integrity
   verification for approval data when keys are securely managed and
   verification is enforced.
6. Human oversight: AI findings assist reviewers; authorised human
   decisions govern final approval.
7. Fail-safe behaviour: An unavailable or failed audit must never
   be treated as a compliant result.
8. Untrusted input handling: Submitted content and retrieved
   documents must be treated as untrusted data, not as system
   instructions.
Security hardening still required
The following items should be completed and tested before making
stronger production-security claims:
- PostgreSQL Row-Level Security (RLS).
- Complete composite tenant-aware foreign-key coverage, including
  evidence relationships.
- Cross-tenant access and isolation tests across API, database, and
  Qdrant.
- Reviewer-role and approval-decision enforcement in backend services.
- HMAC verification on governance decisions, with secure secret
  storage and key rotation.
- Network-level verification of any confidential or zero-egress
  inference mode.
HMAC-SHA256 is a symmetric keyed message-authentication mechanism; it is
not an asymmetric digital signature. Its protection depends on secure
key management and correct verification.
Current Development Status
The project has working frontend and backend foundations, and selected
backend, retrieval, inference, and integrity workflows have been tested
locally.
  Area                                Current status
  React / TypeScript frontend         Implemented; deployed to Vercel

  FastAPI backend foundation          Implemented; deployed to Railway

  PostgreSQL data models              Implemented; 12 ORM models
registered

  Alembic migrations                  Configured; schema hardening and
migration verification continue

  Local PostgreSQL and Qdrant         Validated

  Document processing and embeddings  Tested locally

  Qdrant semantic retrieval           Tested locally

  Groq inference                      Tested locally

  JWT and RBAC foundations            Implemented and locally tested

  Tenant-aware application queries    Implemented and locally tested

  Database-level tenant isolation /   Further work required
RLS                                 

  Evidence validation and complete    Further integration and
audit orchestration                 verification required

  Complete production approval        Further integration and
lifecycle                           verification required

  Automatic source-change impact      Further implementation and
reassessment                        verification required
Full deployed end-to-end workflow   Not yet fully verified
Status labels refer to the scope stated in each row. Local tests,
deployed services, and complete production workflows are separate
verification levels.
Roadmap
Phase 1 --- Production Integration and Stability
- Verify deployed frontend-to-backend connectivity.
- Verify production PostgreSQL and Qdrant connectivity.
- Validate authentication, source, asset, and audit API workflows.
- Add integration tests, health checks, and operational monitoring.
Phase 2 --- Evidence-Grounded AI Auditing
- Complete PDF/DOCX ingestion and source indexing.
- Strengthen retrieval and evidence validation.
- Generate structured findings with source references, explanations,
  severity, and recommendations.
- Evaluate audit quality against a labelled test dataset.
Phase 3 --- Continuous Governance
- Complete review queues and approval/rejection workflows.
- Enforce approval freshness against exact content and source
  versions.
- Invalidate approvals when approved content changes.
- Reassess dependent assets when relevant brand sources change.
Phase 4 --- Enterprise Security
- Complete tenant-aware database constraints and evaluate PostgreSQL
  RLS.
- Strengthen backend reviewer and organisation-level authorisation.
- Verify evidence ownership and citation integrity.
- Add HMAC verification, secret rotation, and security-focused tests.
- Perform isolated network testing for confidential local inference.
Phase 5 --- Pilot and Evaluation
- Pilot with marketing teams, creative agencies, and brand managers.
- Measure precision, recall, false-positive rates, review time, and
  reviewer satisfaction.
- Use pilot feedback to improve retrieval, explanations, and
  governance workflows.
Project Vision
BrandGuard AI aims to help organisations move from fragmented manual
brand reviews to a more explainable, evidence-driven, and auditable
governance process.

By combining semantic retrieval, AI-assisted analysis, version-aware
controls, cryptographic integrity mechanisms, and human oversight, the
platform aims to make brand communication more consistent and
trustworthy.
Links
- GitHub repository:
  https://github.com/Preritkumar16/BrandGuard-AI
- Live frontend: https://brand-guard-ai-kohl.vercel.app/
Built for the Inkloom AI Hackathon.
