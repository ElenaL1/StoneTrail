from __future__ import annotations

import asyncio
import logging

import aiosmtplib
import httpx
from sqlalchemy.ext.asyncio import AsyncSession

from core.config import Settings, get_settings
from core.db import SessionLocal
from repositories.health import HealthRepository
from schemas.health import CheckStatus, HealthResponse, ReadyChecks, ReadyResponse

logger = logging.getLogger(__name__)

_DB_TIMEOUT_SECONDS = 2
_EXTERNAL_TIMEOUT_SECONDS = 3
_YANDEX_PROBE_URL = "https://oauth.yandex.ru"


class HealthService:
    def __init__(self, session: AsyncSession) -> None:
        self._repository = HealthRepository(session)

    async def check(self) -> HealthResponse:
        await self._repository.ping()
        return HealthResponse(status="ok")

    @staticmethod
    async def ready() -> ReadyResponse:
        settings = get_settings()
        database, smtp, yandex = await asyncio.gather(
            _database_status(),
            _smtp_status(settings),
            _yandex_status(settings),
        )
        if database == "error":
            status = "down"
        elif smtp == "error" or yandex == "error":
            status = "degraded"
        else:
            status = "ok"
        return ReadyResponse(
            status=status,
            checks=ReadyChecks(database=database, smtp=smtp, yandex=yandex),
        )


def _log_failure(component: str, error: str) -> None:
    logger.warning("health_check_failed component=%s error=%s", component, error)


async def _database_status() -> CheckStatus:
    try:
        await asyncio.wait_for(_ping_database(), timeout=_DB_TIMEOUT_SECONDS)
    except Exception as exc:
        _log_failure("database", type(exc).__name__)
        return "error"
    return "ok"


async def _ping_database() -> None:
    async with SessionLocal() as session:
        await HealthRepository(session).ping()


async def _smtp_status(settings: Settings) -> CheckStatus:
    if not settings.smtp_enabled:
        return "skipped"
    client = aiosmtplib.SMTP(
        hostname=settings.smtp_host,
        port=settings.smtp_port,
        timeout=_EXTERNAL_TIMEOUT_SECONDS,
        start_tls=settings.smtp_security == "starttls",
        use_tls=settings.smtp_security == "tls",
    )
    try:
        await client.connect()
    except Exception as exc:
        _log_failure("smtp", type(exc).__name__)
        return "error"
    try:
        await client.quit()
    except Exception:
        client.close()
    return "ok"


async def _yandex_status(settings: Settings) -> CheckStatus:
    if not settings.yandex_enabled:
        return "skipped"
    try:
        async with httpx.AsyncClient(timeout=_EXTERNAL_TIMEOUT_SECONDS) as client:
            response = await client.get(_YANDEX_PROBE_URL)
        if response.status_code >= 500:
            _log_failure("yandex", "HTTPStatus")
            return "error"
    except Exception as exc:
        _log_failure("yandex", type(exc).__name__)
        return "error"
    return "ok"
