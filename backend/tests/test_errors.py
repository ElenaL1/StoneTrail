from __future__ import annotations

import logging

import pytest
from community_helpers import logout, register_verified
from httpx import ASGITransport, AsyncClient
from sqlalchemy.exc import IntegrityError, OperationalError
from test_articles import article_body, first_category_id

from core.db import get_session
from core.logging import ACCESS_LOGGER


@pytest.mark.asyncio
async def test_validation_hides_password(client: AsyncClient) -> None:
    response = await client.post(
        "/auth/register",
        json={
            "nickname": "ab",
            "email": "not-an-email",
            "password": "SuperSecret123",
            "termsAccepted": True,
        },
    )
    assert response.status_code == 422
    body = response.json()
    assert body["code"] == "validation"
    assert "SuperSecret123" not in response.text
    assert "detail" not in body
    assert body["requestId"] == response.headers["x-request-id"]


@pytest.mark.asyncio
async def test_unknown_route_uses_error_body(client: AsyncClient) -> None:
    response = await client.get("/api/does-not-exist")
    assert response.status_code == 404
    body = response.json()
    assert body["code"] == "not_found"
    assert "detail" not in body
    assert body["requestId"] == response.headers["x-request-id"]


@pytest.mark.asyncio
async def test_request_id_is_echoed_or_replaced(client: AsyncClient) -> None:
    echoed = await client.get(
        "/api/does-not-exist", headers={"X-Request-ID": "req_client01"}
    )
    assert echoed.headers["x-request-id"] == "req_client01"

    injected = await client.get(
        "/api/does-not-exist", headers={"X-Request-ID": "req_ok\nFAKE"}
    )
    request_id = injected.headers["x-request-id"]
    assert "\n" not in request_id
    assert request_id.startswith("req_")
    assert request_id != "req_ok"


@pytest.mark.asyncio
async def test_unhandled_error_hides_internals(app) -> None:
    secret = "ECONNREFUSED 10.0.0.15:5432 SELECT password FROM users"

    async def boom():
        raise RuntimeError(secret)
        yield

    app.dependency_overrides[get_session] = boom
    transport = ASGITransport(app=app, raise_app_exceptions=False)
    async with AsyncClient(transport=transport, base_url="http://test") as raw:
        response = await raw.get("/health")
    app.dependency_overrides.clear()
    assert response.status_code == 500
    body = response.json()
    assert body["code"] == "internal"
    assert "detail" not in body
    assert "ECONNREFUSED" not in response.text
    assert "password" not in response.text
    assert "SELECT" not in response.text
    assert body["requestId"]


@pytest.mark.asyncio
async def test_database_unavailable_and_conflict(client: AsyncClient, app) -> None:
    async def unavailable():
        raise OperationalError("SELECT 1", {}, Exception("ECONNREFUSED 10.0.0.15:5432"))
        yield

    app.dependency_overrides[get_session] = unavailable
    down = await client.get("/health")
    assert down.status_code == 503
    assert down.json()["code"] == "unavailable"
    assert "10.0.0.15" not in down.text

    class Orig(Exception):
        sqlstate = "23505"

    async def conflict():
        raise IntegrityError("INSERT", {}, Orig("duplicate key value"))
        yield

    app.dependency_overrides[get_session] = conflict
    clash = await client.get("/health")
    app.dependency_overrides.clear()
    assert clash.status_code == 409
    assert clash.json()["code"] == "conflict"
    assert "duplicate key" not in clash.text


@pytest.mark.asyncio
async def test_access_log_includes_user(
    client: AsyncClient, caplog: pytest.LogCaptureFixture
) -> None:
    account = await register_verified(client)
    with caplog.at_level(logging.INFO, logger=ACCESS_LOGGER):
        me = await client.get("/auth/me")
    assert me.status_code == 200
    matches = [
        record
        for record in caplog.records
        if record.name == ACCESS_LOGGER and getattr(record, "route", None) == "/auth/me"
    ]
    assert matches
    assert getattr(matches[-1], "userId", None)
    assert getattr(matches[-1], "requestId", None) == me.headers["x-request-id"]
    await logout(client)
    assert account["email"]


@pytest.mark.asyncio
async def test_stranger_cannot_read_or_edit_draft(client: AsyncClient) -> None:
    author = await register_verified(client, email="author-errors@example.com")
    category_id = await first_category_id(client)
    created = await client.post("/api/articles", json=article_body(category_id))
    assert created.status_code == 200, created.text
    slug = created.json()["slug"]
    await logout(client)

    stranger = await register_verified(client, email="stranger-errors@example.com")
    hidden = await client.get(f"/api/articles/{slug}")
    assert hidden.status_code == 404
    edited = await client.patch(
        f"/api/articles/{slug}",
        json={"content": "Чужой текст, который не должен сохраниться."},
    )
    assert edited.status_code == 403
    assert edited.json()["code"] == "forbidden"
    await logout(client)
    await client.post(
        "/auth/login",
        json={"email": author["email"], "password": author["password"]},
    )
    own = await client.get(f"/api/articles/{slug}")
    assert own.status_code == 200
    assert "Чужой текст" not in own.text
    assert stranger["email"]
