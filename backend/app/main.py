
from contextlib import asynccontextmanager

from fastapi import FastAPI

from app.core.config import settings
from app.api.v1.health import router as health_router
from app.database.session import engine
from app.api.v1.health import qdrant_client


@asynccontextmanager
async def lifespan(app: FastAPI):
    yield

    await qdrant_client.close()
    await engine.dispose()


def create_app() -> FastAPI:
    app = FastAPI(
        title=settings.APP_NAME,
        version="0.1.0",
        description="Explainable Brand Governance Platform",
        lifespan=lifespan,
    )

    app.include_router(
        health_router,
        prefix="/api/v1",
    )

    @app.get("/")
    async def root():
        return {
            "message": "BrandGuard AI API is running",
            "version": "0.1.0",
        }

    return app


app = create_app()
