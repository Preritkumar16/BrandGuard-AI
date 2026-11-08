# BrandGuard AI — Testing Strategy

## 1. Principle
Test workflows and failure modes, not just page rendering. Use synthetic or authorised test brand materials. Keep benchmark examples separate from prompt tuning.

## 2. Unit tests
- Text extraction and span offsets.
- Chunking and passage IDs.
- Finding schema validation.
- Claim category mapping.
- HMAC canonicalisation and verification.
- Permission helpers.
- Source dependency selection.

## 3. Integration tests
- Upload PDF/DOCX → extracted text saved.
- Source approval → chunks indexed in Qdrant.
- Draft submission → relevant passages retrieved.
- Audit output → citations validated against PostgreSQL.
- Revision → new asset version created.
- Reviewer decision → approval tied to exact version/source digest.
- Source update → dependent assets flagged.

## 4. Security tests
- Unauthenticated API request denied.
- Creator self-approval denied.
- Cross-tenant database and file access denied.
- Cross-tenant Qdrant retrieval returns zero records.
- Prompt injection cannot alter permissions or approval state.
- Invalid citation rejected/marked unverified.
- HMAC payload modification fails verification.
- Secrets absent from repository and logs.

## 5. AI evaluation
Use the proposed 50-item pilot:
- Supported claims: 7
- Unsupported claims: 7
- Contradicted claims: 7
- Outdated facts: 6
- Ambiguous guidelines: 5
- Tone and intent preservation: 5
- Reading-level assistance: 3
- Compliant content: 10

Report category-level precision/recall, unsupported recall, contradiction misses, compliant-content blocking false positives, citation validity, intent preservation (human rating) and latency. Always show counts and denominators; this small pilot is not production-grade validation.

## 6. End-to-end demo test
1. Create organisation and creator/reviewer test users.
2. Upload approved brand guideline and pricing source.
3. Submit a draft with prohibited guarantee, incorrect price and unsupported savings claim.
4. Confirm findings cite the correct passages.
5. Apply a correction and create a new version.
6. Submit for review.
7. Confirm creator cannot approve.
8. Reviewer requests changes or approves exact version.
9. Update pricing source.
10. Confirm dependent asset becomes `REVIEW_REQUIRED`.
11. Simulate audit timeout and confirm it never becomes compliant.

## 7. Release gate
A feature is not complete until its acceptance test passes. Record known failures and limitations.
