from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from api.error_handlers import register_error_handlers
from api.routes.articles import router as articles_router
from api.routes.auth import router as auth_router
from api.routes.catalog import router as catalog_router
from api.routes.forum import router as forum_router
from api.routes.health import router as health_router
from core.config import get_settings
from core.db import engine


@asynccontextmanager
async def lifespan(_app: FastAPI) -> AsyncIterator[None]:
    yield
    await engine.dispose()


def create_app() -> FastAPI:
    settings = get_settings()
    application = FastAPI(
        title="StoneTrail API",
        lifespan=lifespan,
    )
    application.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origin_list,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    application.include_router(health_router)
    application.include_router(auth_router)
    application.include_router(catalog_router)
    application.include_router(forum_router)  # topics and comments
    application.include_router(articles_router)
    register_error_handlers(application)
    return application


app = create_app()
