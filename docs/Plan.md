# BrandGuard AI — 30-Hour Round 2 Build Plan

## Objective
Deliver a judge-accessible MVP with an end-to-end workflow and demonstrable progress on the three improvements committed in Round 1.

## Time-boxed plan
| Time | Work | Exit condition |
|---|---|---|
| 0–2 h | Repo, environments, DB, app shell | Frontend/backend start; DB connects |
| 2–5 h | Auth, tenant model, RBAC | Login works; role restrictions tested |
| 5–8 h | Source upload and parsing | PDF/DOCX text and locations stored |
| 8–12 h | Embeddings and Qdrant retrieval | Relevant approved tenant-scoped passages returned |
| 12–17 h | Audit and citation validation | Sample claims return structured validated findings |
| 17–20 h | Suggestions and revision | Creator edits and creates a new version |
| 20–23 h | Review and approval | Reviewer decides; self-approval blocked |
| 23–25 h | Source-change dependency | Source update flags dependent asset |
| 25–27 h | Security and regression tests | Critical access/failure tests pass |
| 27–29 h | Deploy and documentation | Judge-accessible URL and README |
| 29–30 h | Demo rehearsal and submission | Reproducible demo and working links |

## Team allocation
Use the Round 1 declared roles and verify names/spellings against the submitted PDF before final reporting.
- **Team Lead / Backend Architect:** backend architecture, schemas, permissions, APIs, versioning, dependency tracking, approval integrity and integration.
- **AI / Frontend Lead:** parsing, embeddings, retrieval, audit pipeline, structured outputs, suggestions, creator/reviewer UI and AI evaluation.

Both members jointly test integration and accurately record actual contributions.

## Three Round 1 improvements to demonstrate
1. Evidence-grounded brand intelligence: claims with valid source references.
2. Version-aware human approval: revisions, approval state and source-change re-review.
3. Secure and explainable governance: tenant isolation, backend citation validation and tamper-evident approval records.

## Cut line
If behind schedule, preserve upload → audit → evidence → revision → reviewer approval. Simplify dashboard and defer advanced analytics, local model mode, visual checks and integrations. Do not simulate a feature and present it as real.

## Submission checklist
- [ ] Working deployed link or installation package
- [ ] Public/judge-accessible repository
- [ ] End-to-end demo
- [ ] Architecture and technical decisions
- [ ] APIs, models, datasets, libraries and services disclosed
- [ ] Testing evidence and known limitations
- [ ] Accurate team contributions
