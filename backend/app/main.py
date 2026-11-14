from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.v1.brand_sources import router as brand_sources_router
from app.api.v1.health import router as health_router
from app.api.v1.auth import router as auth_router
from app.api.v1.audits import router as audit_router
from app.core.config import settings
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

    # Configure CORS for the frontend
    origins = [
        origin.strip()
        for origin in settings.CORS_ORIGINS.split(",")
        if origin.strip()
    ]

    app.add_middleware(
        CORSMiddleware,
        allow_origins=origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Register API routes
    app.include_router(health_router, prefix="/api/v1")
    app.include_router(auth_router, prefix="/api/v1")
    app.include_router(brand_sources_router, prefix="/api/v1")
    app.include_router(audit_router, prefix="/api/v1")

    @app.get("/")
    async def root():
        return {
            "message": "BrandGuard AI API is running",
            "version": "0.1.0",
        }

    return app


app = create_app()
