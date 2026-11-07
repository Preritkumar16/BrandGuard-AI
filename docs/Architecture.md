# BrandGuard AI — System Architecture

## 1. Architecture decision
Use a **modular monolith** for the 30-hour MVP: one FastAPI application with internal modules for ingestion, retrieval, auditing, review, approvals and dependencies. Avoid separately deployed microservices unless a concrete requirement emerges.

## 2. Components
- **Frontend:** Next.js, TypeScript and Tailwind CSS.
- **Backend:** FastAPI.
- **System of record:** PostgreSQL.
- **Vector retrieval:** Qdrant.
- **Original files:** private object storage.
- **Embeddings:** Sentence Transformers, run locally where feasible.
- **LLM orchestration:** LangChain if it materially helps; otherwise direct provider SDK is acceptable.
- **Standard inference:** approved Groq configuration.
- **Confidential inference:** local Ollama only if implemented and tested.
- **Parsing:** PDF and DOCX extraction libraries.

## 3. Data flow
1. User authenticates; backend resolves organisation from identity.
2. Source upload is stored privately and recorded in PostgreSQL.
3. Parser extracts text and page/paragraph references.
4. Text is chunked by heading/paragraph boundaries.
5. Embeddings are stored in Qdrant with source/version metadata.
6. Creator submits content; backend stores an immutable asset version and hash.
7. Audit identifies claims/rules and retrieves applicable approved passages.
8. Model returns structured candidate findings.
9. Backend validates schema, span, tenant, source status/version and passage existence.
10. Validated findings are stored and displayed.
11. Revisions create new asset versions.
12. Reviewer decision binds to exact asset version and source-set digest.
13. Source updates trigger dependency checks and `REVIEW_REQUIRED` flags.

## 4. Trust boundaries
- Browser input is untrusted.
- Uploaded files and extracted text are untrusted data, not system instructions.
- Tenant IDs come from authenticated server context.
- LLM output is untrusted until validated.
- Qdrant is a retrieval index, not the authority for approval status.
- PostgreSQL is the system of record.
- Object storage is private and accessed through authorised backend routes or short-lived signed URLs.

## 5. Failure handling
- Parsing failure → `FAILED_EXTRACTION`; do not audit empty text.
- Missing applicable policy → request clarification or `REVIEW_UNAVAILABLE`.
- Retrieval failure → explicit unavailable state.
- Successful scoped search with no adequate backing → `UNSUPPORTED`, not `CONTRADICTED`.
- Invalid citation/span → reject or mark `UNVERIFIED`.
- LLM timeout → bounded retry, then failed state.
- Transaction failure → rollback; do not partially approve.
- Qdrant outage → fail audit or clearly label any deterministic-only fallback.

## 6. Suggested repository structure
```text
brandguard-ai/
  frontend/
    app/
    components/
    lib/
    services/
  backend/
    app/
      api/
      core/
      models/
      schemas/
      services/
        ingestion/
        retrieval/
        audit/
        review/
        approvals/
        dependencies/
      database/
      main.py
    tests/
  docs/
  scripts/
  .env.example
  README.md
```

## 7. Constraints
Keep business rules in backend services, route handlers thin, and state transitions transactional. Record model/prompt versions and retrieval settings. Implement only features that can be tested within the build window.
