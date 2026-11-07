# BrandGuard AI — Feature Inventory

Use these status labels consistently:
- `PLANNED` — described but not implemented.
- `IN_PROGRESS` — implementation underway.
- `IMPLEMENTED` — code exists.
- `TESTED` — tested with recorded evidence.

Do not mark a feature tested solely because a page renders.

## P0 — Round 2 MVP
| Feature | Acceptance evidence | Initial status |
|---|---|---|
| Login and role-based access | Login and API permission tests | PLANNED |
| Tenant-scoped records | Cross-tenant access tests | PLANNED |
| Brand source upload | Upload and parse test file | PLANNED |
| Source versioning | Two versions retained and linked | PLANNED |
| PDF/DOCX extraction | Text and location extracted | PLANNED |
| Qdrant retrieval | Relevant approved chunks returned | PLANNED |
| Claim/fact audit | Known test claims classified | PLANNED |
| Citation validation | Invalid citations rejected/unverified | PLANNED |
| Suggested corrections | Intent-preserving suggestion, not auto-applied | PLANNED |
| Creator revision | New immutable version created | PLANNED |
| Review comments | Comment appears in history | PLANNED |
| Approval workflow | Self-approval blocked; reviewer decision stored | PLANNED |
| Source-change re-review | Dependent asset becomes REVIEW_REQUIRED | PLANNED |
| Safe failure states | Timeout never produces COMPLIANT | PLANNED |

## P1 — if time permits
- Dashboard metrics.
- Approval export integrity verification.
- Local Ollama confidential mode.
- Tone/readability assistance.
- Additional audit log filters.

## Deferred
- Visual logo/colour/typography analysis.
- OCR for scanned PDFs.
- CMS publishing/integrations.
- Browser extension.
- External agency portal.
- Advanced governance analytics.

## Evidence log
For each implemented feature record commit/PR, test case, result, known limitation and screenshot/demo timestamp.
