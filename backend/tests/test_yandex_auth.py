from __future__ import annotations

from unittest.mock import AsyncMock, patch
from urllib.parse import parse_qs, urlparse

import pytest
from community_helpers import login, logout, register_verified
from httpx import AsyncClient
from sqlalchemy import text

from core.config import get_settings
from core.db import SessionLocal
from services.yandex_client import YandexOAuthError, YandexProfile

pytestmark = pytest.mark.usefixtures("yandex_env")


@pytest.fixture
def yandex_env(monkeypatch: pytest.MonkeyPatch):
    monkeypatch.setenv("YANDEX_CLIENT_ID", "client-id")
    monkeypatch.setenv("YANDEX_CLIENT_SECRET", "client-secret")
    monkeypatch.setenv(
        "YANDEX_REDIRECT_URI", "http://localhost:8000/auth/yandex/callback"
    )
    monkeypatch.setenv("FRONTEND_BASE_URL", "http://localhost:3000")
    get_settings.cache_clear()
    yield
    get_settings.cache_clear()


def _state(response) -> str:
    assert response.status_code == 302, response.text
    return parse_qs(urlparse(response.headers["location"]).query)["state"][0]


def _profile(**overrides: str) -> YandexProfile:
    data = {
        "id": "987654321",
        "email": "yandex-user@stonetrail.ru",
        "login": "yandexuser",
        "first_name": "Анна",
        "last_name": "Иванова",
    }
    data.update(overrides)
    return YandexProfile(**data)


async def _start(client: AsyncClient, **params: str):
    response = await client.get("/auth/yandex", params=params)
    return response, _state(response)


async def _callback(
    client: AsyncClient,
    state: str,
    *,
    code: str = "code",
    error: str | None = None,
    profile: YandexProfile | None = None,
    fail: bool = False,
):
    params: dict[str, str] = {"state": state}
    if error:
        params["error"] = error
    else:
        params["code"] = code
    fetch = AsyncMock(
        side_effect=YandexOAuthError if fail else None, return_value=profile
    )
    with patch("services.yandex_auth.exchange_code_for_profile", fetch):
        response = await client.get("/auth/yandex/callback", params=params)
    return response


async def _complete(client: AsyncClient, nickname: str = "yandexuser"):
    pending = await client.get("/auth/yandex/pending")
    assert pending.status_code == 200, pending.text
    created = await client.post(
        "/auth/yandex/complete",
        json={"nickname": nickname, "termsAccepted": True},
    )
    assert created.status_code == 200, created.text
    return created.json()


async def test_new_yandex_user_gets_the_same_session_cookie(client: AsyncClient):
    _started, state = await _start(client)
    callback = await _callback(client, state, profile=_profile())
    assert callback.headers["location"] == "http://localhost:3000/register/yandex"
    assert "st_session" not in callback.cookies

    body = await _complete(client)
    assert body["email"] == "yandex-user@stonetrail.ru"
    assert body["emailVerified"] is True
    assert body["yandexLinked"] is True
    assert body["nickname"] == "yandexuser"

    me = await client.get("/auth/me")
    assert me.status_code == 200
    assert me.json()["email"] == "yandex-user@stonetrail.ru"
    async with SessionLocal() as session:
        password_hash = await session.scalar(
            text(
                "SELECT password_hash FROM users "
                "WHERE email = 'yandex-user@stonetrail.ru'"
            )
        )
    assert password_hash is None

    denied = await client.post(
        "/auth/login",
        json={"email": "yandex-user@stonetrail.ru", "password": "StoneTrail1"},
    )
    assert denied.status_code == 401
    assert denied.json()["code"] == "invalid_credentials"


async def test_existing_yandex_identity_logs_in(client: AsyncClient):
    _started, state = await _start(client, **{"next": "https://evil.example/phish"})
    await _callback(client, state, profile=_profile())
    await _complete(client)
    await logout(client)

    _again, state = await _start(client, **{"next": "https://evil.example/phish"})
    callback = await _callback(client, state, profile=_profile())
    assert callback.headers["location"] == "http://localhost:3000/profile"
    assert callback.cookies.get("st_session")
    me = await client.get("/auth/me")
    assert me.json()["email"] == "yandex-user@stonetrail.ru"


async def test_matching_email_does_not_merge_accounts(client: AsyncClient):
    account = await register_verified(client, email="shared@stonetrail.ru")
    await logout(client)

    _started, state = await _start(client)
    callback = await _callback(
        client,
        state,
        profile=_profile(id="111", email="shared@stonetrail.ru", login="shared"),
    )
    assert callback.headers["location"].endswith("/login?yandex=link_required")
    pending = await client.get("/auth/yandex/pending")
    assert pending.status_code == 400

    await login(client, str(account["email"]))
    me = await client.get("/auth/me")
    assert me.json()["yandexLinked"] is False
    async with SessionLocal() as session:
        count = await session.scalar(text("SELECT count(*) FROM users"))
        identities = await session.scalar(text("SELECT count(*) FROM auth_identities"))
    assert count == 1
    assert identities == 0


async def test_logged_in_user_can_link_yandex(client: AsyncClient):
    await register_verified(client, email="owner@stonetrail.ru")
    started = await client.get("/auth/yandex", params={"intent": "link"})
    state = _state(started)
    callback = await _callback(
        client, state, profile=_profile(id="555", email="other@stonetrail.ru")
    )
    assert callback.headers["location"].endswith("/profile?yandex=linked")
    me = await client.get("/auth/me")
    assert me.json()["email"] == "owner@stonetrail.ru"
    assert me.json()["yandexLinked"] is True


async def test_yandex_identity_already_linked_to_another_user(client: AsyncClient):
    await register_verified(client, email="first@stonetrail.ru")
    started = await client.get("/auth/yandex", params={"intent": "link"})
    await _callback(client, _state(started), profile=_profile(id="777"))
    await logout(client)

    await register_verified(client, email="second@stonetrail.ru")
    started = await client.get("/auth/yandex", params={"intent": "link"})
    callback = await _callback(client, _state(started), profile=_profile(id="777"))
    assert callback.headers["location"].endswith("/profile?yandex=already_linked")
    me = await client.get("/auth/me")
    assert me.json()["email"] == "second@stonetrail.ru"
    assert me.json()["yandexLinked"] is False


async def test_invalid_state_does_not_consume_the_real_one(client: AsyncClient):
    _started, state = await _start(client)
    mismatch = await _callback(client, "wrong-state", profile=_profile())
    assert mismatch.headers["location"].endswith("/login?yandex=yandex_state_invalid")
    callback = await _callback(client, state, profile=_profile())
    assert callback.headers["location"].endswith("/register/yandex")


async def test_expired_and_invalid_code_and_cancel(client: AsyncClient):
    _started, state = await _start(client)
    async with SessionLocal() as session:
        await session.execute(
            text("UPDATE oauth_states SET expires_at = now() - interval '1 minute'")
        )
        await session.commit()
    expired = await _callback(client, state, profile=_profile())
    assert expired.headers["location"].endswith("/login?yandex=yandex_state_invalid")

    _started, state = await _start(client)
    failed = await _callback(client, state, fail=True)
    assert failed.headers["location"].endswith("/login?yandex=yandex_oauth_failed")
    replay = await _callback(client, state, profile=_profile())
    assert replay.headers["location"].endswith("/login?yandex=yandex_state_invalid")

    _started, state = await _start(client)
    cancelled = await _callback(client, state, error="access_denied")
    assert cancelled.headers["location"].endswith(
        "/login?yandex=yandex_oauth_cancelled"
    )


async def test_repeated_callback_is_rejected(client: AsyncClient):
    _started, state = await _start(client)
    first = await _callback(client, state, profile=_profile())
    assert first.headers["location"].endswith("/register/yandex")
    second = await _callback(client, state, profile=_profile())
    assert second.headers["location"].endswith("/login?yandex=yandex_state_invalid")


async def test_yandex_routes_fail_closed_without_config(
    client: AsyncClient, monkeypatch: pytest.MonkeyPatch
):
    monkeypatch.setenv("YANDEX_CLIENT_ID", "")
    monkeypatch.setenv("YANDEX_CLIENT_SECRET", "")
    monkeypatch.setenv("YANDEX_REDIRECT_URI", "")
    get_settings.cache_clear()
    response = await client.get("/auth/yandex")
    assert response.status_code == 302
    assert response.headers["location"].endswith("/login?yandex=yandex_oauth_failed")
