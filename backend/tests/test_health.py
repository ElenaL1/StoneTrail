from __future__ import annotations

import logging

import httpx
import pytest
from sqlalchemy.exc import OperationalError

from core.config import get_settings
from core.logging import ACCESS_LOGGER
from repositories.health import HealthRepository


def _disable_optional(monkeypatch: pytest.MonkeyPatch) -> None:
    for key in (
        "SMTP_HOST",
        "SMTP_USER",
        "SMTP_PASSWORD",
        "SMTP_FROM",
        "YANDEX_CLIENT_ID",
        "YANDEX_CLIENT_SECRET",
        "YANDEX_REDIRECT_URI",
    ):
        monkeypatch.setenv(key, "")
    get_settings.cache_clear()


def _enable_smtp(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("SMTP_HOST", "smtp.example.test")
    monkeypatch.setenv("SMTP_PORT", "1126")
    monkeypatch.setenv("SMTP_SECURITY", "starttls")
    monkeypatch.setenv("SMTP_USER", "mail-user")
    monkeypatch.setenv("SMTP_PASSWORD", "smtp-secret-password")
    monkeypatch.setenv("SMTP_FROM", "noreply@stonetrail.ru")
    get_settings.cache_clear()


def _enable_yandex(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("YANDEX_CLIENT_ID", "client-id")
    monkeypatch.setenv("YANDEX_CLIENT_SECRET", "client-secret-value")
    monkeypatch.setenv(
        "YANDEX_REDIRECT_URI", "http://localhost:8000/auth/yandex/callback"
    )
    get_settings.cache_clear()


@pytest.mark.asyncio
async def test_ping_is_select_one() -> None:
    class Session:
        def __init__(self) -> None:
            self.sql = ""

        async def execute(self, statement: object) -> None:
            self.sql = str(statement)

    session = Session()
    await HealthRepository(session).ping()  # type: ignore[arg-type]
    assert session.sql == "SELECT 1"


@pytest.mark.asyncio
async def test_live_does_not_use_database(
    client, monkeypatch: pytest.MonkeyPatch
) -> None:
    async def fail_ping(self: HealthRepository) -> None:
        raise AssertionError("database")

    monkeypatch.setattr(HealthRepository, "ping", fail_ping)
    response = await client.get("/health/live")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


@pytest.mark.asyncio
async def test_health_still_pings_database(client) -> None:
    response = await client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


@pytest.mark.asyncio
async def test_ready_ok_when_database_up(
    client, monkeypatch: pytest.MonkeyPatch
) -> None:
    _disable_optional(monkeypatch)
    response = await client.get("/health/ready")
    assert response.status_code == 200
    assert response.json() == {
        "status": "ok",
        "checks": {"database": "ok", "smtp": "skipped", "yandex": "skipped"},
    }


@pytest.mark.asyncio
async def test_ready_down_when_database_unavailable(
    client, monkeypatch: pytest.MonkeyPatch, caplog: pytest.LogCaptureFixture
) -> None:
    _disable_optional(monkeypatch)
    secret = "postgresql://stonetrail:secret-db-pass@10.0.0.15:5432/stonetrail"

    async def fail_ping(self: HealthRepository) -> None:
        raise OperationalError("SELECT 1", {}, Exception(secret))

    monkeypatch.setattr(HealthRepository, "ping", fail_ping)
    with caplog.at_level(logging.WARNING, logger="services.health"):
        response = await client.get("/health/ready")
    assert response.status_code == 503
    assert response.json() == {
        "status": "down",
        "checks": {"database": "error", "smtp": "skipped", "yandex": "skipped"},
    }
    assert secret not in response.text
    assert "secret-db-pass" not in response.text
    failed = [record for record in caplog.records if record.name == "services.health"]
    assert len(failed) == 1
    assert "component=database" in failed[0].getMessage()
    assert "OperationalError" in failed[0].getMessage()
    assert "secret-db-pass" not in failed[0].getMessage()
    assert secret not in failed[0].getMessage()


@pytest.mark.asyncio
async def test_ready_degraded_when_smtp_unavailable(
    client, monkeypatch: pytest.MonkeyPatch
) -> None:
    _disable_optional(monkeypatch)
    _enable_smtp(monkeypatch)

    class FakeSMTP:
        def __init__(self, **kwargs: object) -> None:
            self.hostname = kwargs.get("hostname")

        async def connect(self) -> None:
            raise TimeoutError(f"timed out connecting to {self.hostname}")

        async def quit(self) -> None:
            return None

        def close(self) -> None:
            return None

    monkeypatch.setattr("services.health.aiosmtplib.SMTP", FakeSMTP)
    response = await client.get("/health/ready")
    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "degraded"
    assert body["checks"]["database"] == "ok"
    assert body["checks"]["smtp"] == "error"
    assert body["checks"]["yandex"] == "skipped"
    assert "smtp-secret-password" not in response.text
    assert "smtp.example.test" not in response.text


@pytest.mark.asyncio
async def test_ready_degraded_when_yandex_unavailable(
    client, monkeypatch: pytest.MonkeyPatch
) -> None:
    _disable_optional(monkeypatch)
    _enable_yandex(monkeypatch)

    class FakeClient:
        def __init__(self, *args: object, **kwargs: object) -> None:
            pass

        async def __aenter__(self) -> FakeClient:
            return self

        async def __aexit__(self, *exc: object) -> bool:
            return False

        async def get(self, url: str) -> httpx.Response:
            raise httpx.ConnectError("oauth.yandex.ru unavailable")

    monkeypatch.setattr("services.health.httpx.AsyncClient", FakeClient)
    response = await client.get("/health/ready")
    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "degraded"
    assert body["checks"]["yandex"] == "error"
    assert body["checks"]["database"] == "ok"
    assert "client-secret-value" not in response.text
    assert "oauth.yandex.ru" not in response.text


@pytest.mark.asyncio
async def test_successful_health_skips_access_log(
    client, monkeypatch: pytest.MonkeyPatch, caplog: pytest.LogCaptureFixture
) -> None:
    _disable_optional(monkeypatch)
    with caplog.at_level(logging.INFO, logger=ACCESS_LOGGER):
        live = await client.get("/health/live")
        ready = await client.get("/health/ready")
        health = await client.get("/health")
        missing = await client.get("/api/does-not-exist")
    assert live.status_code == 200
    assert ready.status_code == 200
    assert health.status_code == 200
    assert missing.status_code == 404
    access = [record for record in caplog.records if record.name == ACCESS_LOGGER]
    routes = [getattr(record, "route", None) for record in access]
    assert "/health" not in routes
    assert "/health/live" not in routes
    assert "/health/ready" not in routes
    assert "/api/does-not-exist" in routes


@pytest.mark.asyncio
async def test_ready_failure_is_written_to_access_log(
    client, monkeypatch: pytest.MonkeyPatch, caplog: pytest.LogCaptureFixture
) -> None:
    _disable_optional(monkeypatch)

    async def fail_ping(self: HealthRepository) -> None:
        raise OperationalError("SELECT 1", {}, Exception("down"))

    monkeypatch.setattr(HealthRepository, "ping", fail_ping)
    with caplog.at_level(logging.INFO, logger=ACCESS_LOGGER):
        response = await client.get("/health/ready")
    assert response.status_code == 503
    routes = [
        getattr(record, "route", None)
        for record in caplog.records
        if record.name == ACCESS_LOGGER
    ]
    assert "/health/ready" in routes
