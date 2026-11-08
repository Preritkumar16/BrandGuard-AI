# BrandGuard AI — Local Setup

> This is the intended setup baseline. Confirm exact versions against dependencies actually installed and tested.

## Prerequisites
- Git
- Node.js LTS and npm
- Python 3.11+ (confirm library compatibility)
- PostgreSQL
- Qdrant (Docker or hosted)
- Optional: Ollama for local inference

## PostgreSQL example
```bash
docker run --name brandguard-postgres \
  -e POSTGRES_USER=brandguard \
  -e POSTGRES_PASSWORD=change_me \
  -e POSTGRES_DB=brandguard \
  -p 5432:5432 -d postgres:16
```

## Qdrant example
```bash
docker run --name brandguard-qdrant \
  -p 6333:6333 -p 6334:6334 \
  -v qdrant_storage:/qdrant/storage \
  -d qdrant/qdrant
```

## Backend
```bash
cd backend
python -m venv .venv
# Windows PowerShell:
.venv\Scripts\Activate.ps1
# macOS/Linux:
source .venv/bin/activate
pip install -r requirements.txt
# Copy .env.example to .env and configure it
uvicorn app.main:app --reload --port 8000
```

## Frontend
```bash
cd frontend
npm install
# Copy .env.example to .env.local and configure it
npm run dev
```

## Environment variable names (example)
```env
DATABASE_URL=postgresql+asyncpg://brandguard:change_me@localhost:5432/brandguard
QDRANT_URL=http://localhost:6333
QDRANT_API_KEY=
JWT_SECRET=replace_with_random_secret
GROQ_API_KEY=
LLM_PROVIDER=groq
OLLAMA_BASE_URL=http://localhost:11434
OBJECT_STORAGE_ENDPOINT=
OBJECT_STORAGE_BUCKET=
OBJECT_STORAGE_ACCESS_KEY=
OBJECT_STORAGE_SECRET_KEY=
```
Never commit real `.env` files. Commit placeholders only.

## First-run sequence
1. Start PostgreSQL and Qdrant.
2. Apply database migrations.
3. Start backend and verify health.
4. Start frontend and verify API base URL.
5. Bootstrap organisation/admin using the implemented process.
6. Upload a test source and run the sample audit.

## Health checks
- Backend `GET /health`
- PostgreSQL connection check
- Qdrant health/collection check
- Frontend login page and API connectivity
