# BrandGuard AI — Documentation Freeze Record

**Baseline:** v1.0  
**Freeze date:** 5 November 2026  
**Stage:** Inkloom AI Hackathon — Round 2: The Build

## Freeze decision
The 15 planning documents in this pack are approved as the baseline specification for implementation. Product scope, architecture, data model, API contracts, audit pipeline, security principles, build plan and testing approach are frozen for the initial build.

This is a **documentation/specification freeze only**. It does not mean the product is implemented, tested, secure in production, or compliant with event rules that have not been checked. Feature statuses remain as stated in `Features.md`; planned work must not be represented as completed.

## Decisions locked for the MVP
1. Build a pre-publication brand-governance workflow with evidence-linked findings and human approval.
2. Use a modular monolith: Next.js + TypeScript frontend, FastAPI backend, PostgreSQL system of record and Qdrant retrieval index.
3. Treat PostgreSQL as authoritative for tenant ownership, source approval and version state; Qdrant is only a retrieval index.
4. Preserve immutable source and asset versions; approvals bind to an exact asset version and source-set digest.
5. Validate model-generated findings and citations in backend code; model output never controls permissions or approval state.
6. Fail safely: extraction, retrieval or audit failures must never become a compliant result.
7. Keep MCP, CMS/social integrations, OCR, visual identity checks and advanced analytics out of the MVP unless formally added through change control.
8. Prioritise the complete path: source upload → content submission → audit/evidence → revision → reviewer decision.

## Cross-document corrections made during review
- Source approval/supersede API paths now include both `source_id` and `version_id`, removing ambiguity about the parent source.
- The database MVP table list now explicitly includes `brand_sources`, `source_chunks` and `dependencies`, which are required by source retrieval and source-change re-review.
- README and manifest now identify this as frozen v1.0 and distinguish specification freeze from implementation status.

## Change-control rule
Only change this baseline when a blocker, event requirement, technical incompatibility or demonstrable implementation constraint requires it. Before changing code or contracts:
1. Record the reason, owner and affected documents below.
2. Update all affected API, database, architecture, PRD and test contracts together.
3. Increment the documentation version (for example v1.0 → v1.1).
4. Keep the original decision and amendment history.

## Amendment log
| Version | Date | Change | Status |
|---|---|---|---|
| 1.0 | 2026-11-05 | Initial Round 2 baseline reviewed and frozen; API path and MVP schema-list consistency corrected. | FROZEN |
