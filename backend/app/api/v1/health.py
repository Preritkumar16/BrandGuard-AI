
from fastapi import APIRouter
from fastapi.responses import JSONResponse
from sqlalchemy import text
from qdrant_client import AsyncQdrantClient

from app.database.session import engine
from app.core.config import settings


router = APIRouter(tags=["Health"])

qdrant_client = AsyncQdrantClient(
    url=settings.QDRANT_URL
)


@router.get("/health")
async def health_check():
    db_status = "ok"
    qdrant_status = "ok"

    try:
        async with engine.connect() as connection:
            await connection.execute(text("SELECT 1"))
    except Exception:
        db_status = "unavailable"

    try:
        await qdrant_client.get_collections()
    except Exception:
        qdrant_status = "unavailable"

    overall_status = (
        "ok"
        if db_status == "ok" and qdrant_status == "ok"
        else "degraded"
    )

    payload = {
        "data": {
            "status": overall_status,
            "database": db_status,
            "qdrant": qdrant_status,
        },
        "error": None,
        "request_id": None,
    }

    status_code = 200 if overall_status == "ok" else 503

    return JSONResponse(
        status_code=status_code,
        content=payload,
    )
