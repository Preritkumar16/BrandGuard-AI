# BrandGuard AI

**Explainable brand review · Human approval · Source-aware governance**

BrandGuard AI is a pre-publication brand-governance platform for English-language B2B SaaS marketing teams. It checks submitted content against approved brand sources, returns evidence-linked findings, suggests corrections and supports human review.

## Core workflow
1. Register approved brand sources.
2. Submit content.
3. Extract claims and retrieve applicable evidence.
4. Run deterministic and model-assisted checks.
5. Validate findings and citations in the backend.
6. Revise content.
7. Route a specific version to an authorised reviewer.
8. Record approval and flag dependent assets after relevant source changes.

## Proposed stack
- Frontend: Next.js, TypeScript, Tailwind CSS
- Backend: FastAPI
- System of record: PostgreSQL
- Vector retrieval: Qdrant
- Embeddings: Sentence Transformers
- Orchestration: LangChain if useful to the implementation
- Standard inference: approved Groq configuration
- Confidential inference: local Ollama, only if implemented and tested
- Parsing: PDF/DOCX extraction libraries
- Storage: private object storage

## Repository layout
```text
brandguard-ai/
  frontend/
  backend/
  docs/
  scripts/
  .env.example
```

## Documentation index
See the other Markdown files in this folder:
`PRD.md`, `Design.md`, `Architecture.md`, `Database.md`, `API.md`, `Agents.md`, `Plan.md`, `Setup.md`, `Features.md`, `Authentication and security.md`, `MCP Connection.md`, `Integrations.md`, `Testing.md`, and `Debugging.md`.

## Project status
**Documentation baseline: FROZEN v1.0 (5 November 2026).** This freezes the agreed Round 2 product and technical scope, not implementation status or hackathon submission compliance. Any scope/contract change must be recorded in `FREEZE_RECORD.md` before code and docs are changed. Mark each feature `PLANNED`, `IN_PROGRESS`, `IMPLEMENTED` or `TESTED` based on actual evidence. Do not describe a planned feature as working until it is implemented and tested.

## Integrity
Never commit secrets, confidential brand materials or private user data. Disclose external services, models, libraries and reused components in the final hackathon submission.
