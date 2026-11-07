# BrandGuard AI — Product Requirements Document

**Stage:** Inkloom AI Hackathon, Round 2 — The Build  
**Product:** Explainable brand review, human approval and source-aware governance  
**MVP audience:** English-language B2B SaaS marketing teams

## 1. Product summary
BrandGuard AI reviews content before publication against an organisation's approved brand guidelines, terminology, product facts and promotional policies. It produces explainable findings linked to approved source passages, suggests corrections and supports a human review and approval workflow.

BrandGuard AI is a decision-support product. It is not a legal adviser, general-purpose grammar checker or autonomous publisher.

## 2. Problem
Organisations publish content through employees, agencies and AI-assisted workflows. Content can be well written but still contain unsupported claims, incorrect facts, outdated terminology or policy violations. Reviewers need to identify applicable approved sources, understand why a finding was raised, correct content without losing creator intent and record accountable approval decisions.

## 3. Users and roles
- **Organisation Admin:** manages organisation settings, users and roles.
- **Source Owner / Brand Manager:** uploads, versions and approves brand sources.
- **Creator:** submits content, reviews findings, edits drafts and requests approval.
- **Reviewer / Approver:** comments, requests revisions, approves or rejects a specific version.
- **Compliance Reviewer:** optional reviewer for high-risk claims and exceptions.

## 4. Goals
1. Register approved, versioned brand sources.
2. Accept supported content for review.
3. Detect factual, claim, terminology and tone issues.
4. Link findings to source passages or clearly state that backing was not established.
5. Suggest corrections without overwriting original content.
6. Support comments, revisions, role restrictions and version-bound approval.
7. Flag dependent assets when an applicable source changes.
8. Record audit events and provide basic governance insights.

## 5. MVP non-goals
- Autonomous publishing to CMS or social platforms.
- Full legal/compliance certification.
- Full visual logo, typography or colour auditing.
- OCR for scanned PDFs unless time remains and it can be validated.
- Browser extension, CMS plugins or advanced enterprise analytics.

## 6. Requirements
### P0 — required for MVP
- Authentication and server-side role checks.
- Tenant/organisation scoping for records, retrieval and files.
- Upload approved text-extractable PDF/DOCX source documents.
- Store source owner, version, status and effective date.
- Submit text and supported PDF/DOCX content.
- Extract text and preserve page/paragraph references where possible.
- Retrieve applicable approved source chunks using tenant-filtered Qdrant search.
- Generate structured findings: `SUPPORTED`, `UNSUPPORTED`, `CONTRADICTED`, `OUTDATED`, `AMBIGUOUS_RULE`, `REVIEW_UNAVAILABLE`.
- Validate citations and text spans in the backend.
- Show explanation, evidence, severity and suggested action.
- Let creators accept, edit or dismiss suggestions.
- Create a new version for each saved revision.
- Support reviewer comments, revision requests, approval and rejection.
- Prevent creator self-approval.
- Mark dependent assets `REVIEW_REQUIRED` after relevant source updates.
- Fail safely: an error must never become a compliant result.

### P1 — if time permits
- Dashboard counts and finding-category breakdown.
- Export with approval-integrity verification.
- Local Ollama confidential inference mode.
- Additional tone and readability checks.

## 7. Core workflow
1. Admin creates organisation and users.
2. Source owner uploads approved guidelines and product facts.
3. Creator submits a draft and selects a brand profile/content type.
4. System extracts content, retrieves sources and runs the audit.
5. Creator reviews findings and creates a revision.
6. Creator submits a specific version for review.
7. Reviewer comments, requests changes, approves or rejects.
8. Admin updates a source; dependent active assets are flagged for re-review.

## 8. Finding contract
Each finding contains an ID, asset-version ID, category, severity, status, exact text span, explanation, evidence references, suggested action, optional replacement, validation status and audit metadata.

The LLM proposes findings. Backend validation determines whether cited source IDs, passages, tenant ownership, versions and text spans are valid.

## 9. Acceptance criteria
- A supported PDF/DOCX can be uploaded and parsed.
- Findings cite existing approved source passages or clearly state that backing was not established.
- A creator cannot approve their own asset.
- Editing creates a new asset version; previous approval does not authorise the new version.
- Updating a source flags dependent assets for re-review.
- Cross-tenant access is denied.
- Processing failure produces an explicit failed/unavailable state, never `COMPLIANT`.

## 10. Evaluation
Use a small pilot benchmark and report category-level precision/recall, contradiction misses, compliant-content false positives, citation validity, intent-preservation rating and median/P95 latency. A small benchmark is not proof of production-grade reliability.

## 11. Assumptions and open questions
- Initial language: English.
- Initial audience: B2B SaaS marketing teams.
- Initial uploads: text-extractable PDF and DOCX.
- Confirm organiser's exact Round 2 submission and deployment requirements.
- Verify provider retention, training and region terms before making privacy guarantees.
