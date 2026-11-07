# BrandGuard AI — Debugging Guide

## 1. Process
1. Reproduce with exact steps.
2. Capture request ID, endpoint, timestamp and safe error.
3. Check browser console and backend logs.
4. Check PostgreSQL, Qdrant, object storage and LLM health.
5. Identify parsing, retrieval, inference, validation, persistence or permission failure.
6. Fix root cause and add regression test.
7. Confirm safe failure state.

## 2. Common problems
### PostgreSQL connection failure
Verify `DATABASE_URL`, host, port, database and credentials. Confirm service is running, driver scheme is correct and migrations have run.

### Qdrant collection missing
Check URL, collection name and vector dimensions. Create collection before indexing. Confirm payload contains tenant/source/version IDs.

### Irrelevant retrieval
Check approved/current source filters, chunk boundaries, embedding model, query preprocessing and top-k. Never interpret retrieval failure as proof that a claim is false.

### Malformed LLM JSON
Validate with typed schema. Retry only within bounded policy. Reject invalid output; do not persist it as verified.

### Wrong citation span
Use the same normalised text for offsets and display. Validate start/end and exact span text. Confirm passage belongs to source version.

### Empty PDF extraction
Check whether file is scanned/image-only. If OCR is not implemented, return explicit unsupported-file error; do not audit empty text.

### Frontend cannot call API
Verify API base URL, CORS origin, backend reachability, network response and token handling.

### Cross-tenant access
Treat as release-blocking. Check route dependencies, service queries, object access and Qdrant filters. Add direct-API regression tests.

### HMAC verification failure
Check canonical serialisation, algorithm, key version, secret and payload fields. Never disable verification just to make an export succeed.

## 3. Safe error states
`FAILED_EXTRACTION`, `FAILED_AUDIT`, `REVIEW_UNAVAILABLE`, `UNVERIFIED`, `REVIEW_REQUIRED`.

A failed or partial audit must never be displayed as `COMPLIANT`.

## 4. Bug report template
```text
Title:
Environment:
Build/commit:
Test user role:
Steps to reproduce:
Expected:
Actual:
Request ID:
Relevant safe logs:
Severity:
Regression test:
Status:
```
