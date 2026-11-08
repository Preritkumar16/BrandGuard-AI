# BrandGuard AI — Integrations

## 1. Planned integrations
| Component | Purpose | MVP role | Data considerations |
|---|---|---|---|
| PostgreSQL | Authoritative records | Required | Tenant-scoped queries, backups, credentials |
| Qdrant | Semantic source retrieval | Required | Tenant payload filter; not authority for approval |
| Sentence Transformers | Embeddings | Planned core | Local model; record model/version |
| Groq API | Standard LLM inference | If configured | Verify provider terms and account settings |
| Ollama | Local confidential inference | Optional | Verify local execution and no cloud fallback |
| PDF/DOCX parsers | Text extraction | Required | Validate files and preserve locators |
| Private object storage | Original files | Required for deployed uploads | Private bucket, scoped access and retention |
| Deployment provider | Host app | Required for judge demo | Protect secrets and logs |

## 2. Integration boundaries
- Backend alone communicates with database, vector store, object storage and LLM provider.
- Frontend must not contain database credentials, Qdrant admin keys or LLM API keys.
- Qdrant results are candidates; PostgreSQL validates source approval and applicability.
- Provider outages produce explicit unavailable states, not silent fallback or false compliance.

## 3. Disclosure checklist
Record exact provider/service, model/version, library/version, purpose, data sent, relevant retention/training settings verified and whether inference is local or external.

## 4. Deferred integrations
WordPress/HubSpot, browser extension, social publishing, Slack/Teams notifications and MCP client/server. Do not build integrations that are not needed for the core workflow.
