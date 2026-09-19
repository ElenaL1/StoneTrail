from __future__ import annotations

import os

os.environ["AUTH_DEBUG_LINKS"] = "true"

import pytest
from httpx import ASGITransport, AsyncClient
from sqlalchemy import text

from api.main import create_app
from core.config import get_settings
from core.db import SessionLocal, engine
from core.rate_limit import limiter

get_settings.cache_clear()


@pytest.fixture(scope="session", autouse=True)
async def _dispose_engine():
    yield
    await engine.dispose()


@pytest.fixture(autouse=True)
def _reset_rate_limiter() -> None:
    limiter.reset()
    yield
    limiter.reset()


@pytest.fixture
def app():
    get_settings.cache_clear()
    return create_app()


@pytest.fixture
async def client(app):
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac
    async with SessionLocal() as session:
        await session.execute(text("TRUNCATE TABLE users CASCADE"))
        await session.commit()
