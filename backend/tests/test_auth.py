from __future__ import annotations

import uuid
from datetime import UTC, datetime, timedelta
from urllib.parse import parse_qs, urlparse

import pytest
from httpx import ASGITransport, AsyncClient
from sqlalchemy import select, text, update
from sqlalchemy.exc import IntegrityError

from api.main import create_app
from core.config import get_settings
from core.db import SessionLocal
from core.rate_limit import limiter as rate_limiter
from models.enums import AuthTokenType
from models.user import AuthToken, User
from repositories.users import UserRepository
from schemas.auth import ForgotPasswordRequest
from services.auth import AuthService, conflict_from_integrity

PASSWORD = "StoneTrail1"


def register_body(**overrides: object) -> dict[str, object]:
    suffix = uuid.uuid4().hex[:8]
    body: dict[str, object] = {
        "nickname": f"user{suffix}",
        "email": f"user{suffix}@stonetrail.ru",
        "password": PASSWORD,
        "termsAccepted": True,
        "marketingConsent": False,
    }
    body.update(overrides)
    return body


def token_from_path(path: str) -> str:
    query = parse_qs(urlparse(path).query)
    return query["token"][0]


async def issue_reset_token(email: str) -> str:
    async with SessionLocal() as session:
        service = AuthService(session, get_settings())
        outcome = await service.forgot_password(
            ForgotPasswordRequest(email=email), ip="test"
        )
        assert outcome.demo_reset_path
        return token_from_path(outcome.demo_reset_path)


@pytest.mark.asyncio
async def test_register_then_me(client: AsyncClient) -> None:
    body = register_body()
    response = await client.post("/auth/register", json=body)
    assert response.status_code == 200, response.text
    data = response.json()
    assert data["email"] == body["email"]
    assert data["name"] == body["nickname"]
    assert data["firstName"] == ""
    assert data["lastName"] == ""
    assert data["activityType"] == ""
    assert data["emailVerified"] is False
    assert data["role"] == "user"
    assert data["avatar"] == ""
    assert "demoVerificationPath" in data
    assert "st_session" in response.cookies

    me = await client.get("/auth/me")
    assert me.status_code == 200
    assert me.json()["email"] == body["email"]


@pytest.mark.asyncio
async def test_duplicate_email(client: AsyncClient) -> None:
    body = register_body()
    assert (await client.post("/auth/register", json=body)).status_code == 200
    again = await client.post(
        "/auth/register",
        json=register_body(email=body["email"], nickname="other-nick"),
    )
    assert again.status_code == 409
    payload = again.json()
    assert payload["code"] == "email_taken"
    assert "email" in payload["fieldErrors"]
    assert "detail" not in payload


@pytest.mark.asyncio
async def test_duplicate_nickname(client: AsyncClient) -> None:
    body = register_body()
    assert (await client.post("/auth/register", json=body)).status_code == 200
    again = await client.post(
        "/auth/register", json=register_body(nickname=body["nickname"])
    )
    assert again.status_code == 409
    assert again.json()["code"] == "nickname_taken"


@pytest.mark.asyncio
async def test_soft_deleted_email_and_nickname_reusable(
    client: AsyncClient,
) -> None:
    body = register_body()
    assert (await client.post("/auth/register", json=body)).status_code == 200
    async with SessionLocal() as session:
        await session.execute(
            update(User)
            .where(User.email == body["email"])
            .values(deleted_at=datetime.now(UTC))
        )
        await session.commit()
    reused = await client.post("/auth/register", json=body)
    assert reused.status_code == 200, reused.text


@pytest.mark.asyncio
async def test_login_wrong_email(client: AsyncClient) -> None:
    response = await client.post(
        "/auth/login",
        json={"email": "missing@stonetrail.ru", "password": PASSWORD},
    )
    assert response.status_code == 401
    assert response.json()["code"] == "invalid_credentials"


@pytest.mark.asyncio
async def test_login_wrong_password(client: AsyncClient) -> None:
    body = register_body()
    await client.post("/auth/register", json=body)
    response = await client.post(
        "/auth/login",
        json={"email": body["email"], "password": "WrongPass1"},
    )
    assert response.status_code == 401
    assert response.json()["code"] == "invalid_credentials"


@pytest.mark.asyncio
async def test_login_inactive_and_deleted(client: AsyncClient) -> None:
    body = register_body()
    await client.post("/auth/register", json=body)
    async with SessionLocal() as session:
        await session.execute(
            update(User).where(User.email == body["email"]).values(is_active=False)
        )
        await session.commit()
    inactive = await client.post(
        "/auth/login", json={"email": body["email"], "password": PASSWORD}
    )
    assert inactive.status_code == 401

    async with SessionLocal() as session:
        await session.execute(
            update(User)
            .where(User.email == body["email"])
            .values(is_active=True, deleted_at=datetime.now(UTC))
        )
        await session.commit()
    deleted = await client.post(
        "/auth/login", json={"email": body["email"], "password": PASSWORD}
    )
    assert deleted.status_code == 401


@pytest.mark.asyncio
async def test_login_and_register_rate_limit(client: AsyncClient) -> None:
    email = f"limit-{uuid.uuid4().hex[:8]}@stonetrail.ru"
    last = None
    for _ in range(6):
        last = await client.post(
            "/auth/login", json={"email": email, "password": "WrongPass1"}
        )
    assert last is not None
    assert last.status_code == 429
    assert last.json()["code"] == "rate_limited"
    assert last.headers.get("retry-after")

    rate_limiter.reset()
    last_register = None
    for _ in range(4):
        last_register = await client.post("/auth/register", json=register_body())
    assert last_register is not None
    assert last_register.status_code == 429


@pytest.mark.asyncio
async def test_validation_error_body(client: AsyncClient) -> None:
    response = await client.post("/auth/register", json={"email": "nope"})
    assert response.status_code == 422
    payload = response.json()
    assert payload["code"] == "validation"
    assert "fieldErrors" in payload
    assert "detail" not in payload


@pytest.mark.asyncio
async def test_invalid_activity_type_is_422(client: AsyncClient) -> None:
    response = await client.post(
        "/auth/register", json=register_body(activityType="Designer")
    )
    assert response.status_code == 422
    assert response.json()["code"] == "validation"
    assert "activityType" in response.json()["fieldErrors"]


@pytest.mark.asyncio
async def test_verify_valid_expired_used(client: AsyncClient) -> None:
    body = register_body()
    created = await client.post("/auth/register", json=body)
    token = token_from_path(created.json()["demoVerificationPath"])

    verified = await client.post("/auth/verify-email", json={"token": token})
    assert verified.status_code == 200
    assert verified.json()["emailVerified"] is True

    reused = await client.post("/auth/verify-email", json={"token": token})
    assert reused.status_code == 400
    assert reused.json()["code"] == "token_used"

    other = register_body()
    second = await client.post("/auth/register", json=other)
    raw = token_from_path(second.json()["demoVerificationPath"])
    async with SessionLocal() as session:
        owner = await session.scalar(select(User).where(User.email == other["email"]))
        assert owner is not None
        await session.execute(
            update(AuthToken)
            .where(
                AuthToken.user_id == owner.id,
                AuthToken.type == AuthTokenType.VERIFY_EMAIL,
            )
            .values(expires_at=datetime.now(UTC) - timedelta(hours=1))
        )
        await session.commit()
    expired = await client.post("/auth/verify-email", json={"token": raw})
    assert expired.status_code == 400
    assert expired.json()["code"] == "token_expired"


@pytest.mark.asyncio
async def test_resend_cooldown_and_already_verified(
    client: AsyncClient,
) -> None:
    await client.post("/auth/register", json=register_body())
    first = await client.post("/auth/resend-verification")
    assert first.status_code == 200
    token = token_from_path(first.json()["demoVerificationPath"])
    second = await client.post("/auth/resend-verification")
    assert second.status_code == 429

    rate_limiter.reset()
    verified = await client.post("/auth/verify-email", json={"token": token})
    assert verified.status_code == 200
    confirmed = await client.post("/auth/resend-verification")
    assert confirmed.status_code == 200
    assert confirmed.json()["resendAvailableAt"] == 0
    assert confirmed.json()["demoVerificationPath"] == "/verify-email?status=confirmed"


@pytest.mark.asyncio
async def test_change_email_keeps_session(client: AsyncClient) -> None:
    body = register_body()
    await client.post("/auth/register", json=body)
    new_email = f"new-{uuid.uuid4().hex[:8]}@stonetrail.ru"
    changed = await client.post("/auth/change-email", json={"email": new_email})
    assert changed.status_code == 200
    me = await client.get("/auth/me")
    assert me.status_code == 200
    assert me.json()["email"] == new_email
    assert me.json()["emailVerified"] is False


@pytest.mark.asyncio
async def test_forgot_and_reset(client: AsyncClient) -> None:
    body = register_body()
    await client.post("/auth/register", json=body)
    existing = await client.post("/auth/forgot-password", json={"email": body["email"]})
    missing = await client.post(
        "/auth/forgot-password", json={"email": "nobody@stonetrail.ru"}
    )
    assert existing.status_code == 200
    assert missing.status_code == 200
    assert existing.json()["submitted"] is True
    assert missing.json()["submitted"] is True
    assert existing.json()["demoResetPath"].startswith("/reset-password?token=")
    assert existing.json()["demoResetPath"] != "/reset-password?token=invalid"
    assert missing.json()["demoResetPath"] == "/reset-password?token=invalid"

    raw = await issue_reset_token(str(body["email"]))
    reset = await client.post(
        "/auth/reset-password",
        json={
            "token": raw,
            "password": "NewPass12",
            "confirmPassword": "NewPass12",
        },
    )
    assert reset.status_code == 200
    assert reset.json() == {"completed": True}

    me = await client.get("/auth/me")
    assert me.status_code == 401

    login = await client.post(
        "/auth/login", json={"email": body["email"], "password": "NewPass12"}
    )
    assert login.status_code == 200


@pytest.mark.asyncio
async def test_reset_expired_used_invalid(client: AsyncClient) -> None:
    body = register_body()
    await client.post("/auth/register", json=body)
    raw = await issue_reset_token(str(body["email"]))

    invalid = await client.post(
        "/auth/reset-password",
        json={
            "token": "not-a-real-token-value-at-all",
            "password": "NewPass12",
            "confirmPassword": "NewPass12",
        },
    )
    assert invalid.status_code == 400
    assert invalid.json()["code"] == "token_invalid"

    async with SessionLocal() as session:
        await session.execute(
            update(AuthToken)
            .where(AuthToken.type == AuthTokenType.RESET_PASSWORD)
            .values(expires_at=datetime.now(UTC) - timedelta(minutes=5))
        )
        await session.commit()
    expired = await client.post(
        "/auth/reset-password",
        json={
            "token": raw,
            "password": "NewPass12",
            "confirmPassword": "NewPass12",
        },
    )
    assert expired.status_code == 400
    assert expired.json()["code"] == "token_expired"

    async with SessionLocal() as session:
        await session.execute(
            update(AuthToken)
            .where(AuthToken.type == AuthTokenType.RESET_PASSWORD)
            .values(
                expires_at=datetime.now(UTC) + timedelta(hours=1),
                used_at=datetime.now(UTC),
            )
        )
        await session.commit()
    used = await client.post(
        "/auth/reset-password",
        json={
            "token": raw,
            "password": "NewPass12",
            "confirmPassword": "NewPass12",
        },
    )
    assert used.status_code == 400
    assert used.json()["code"] == "token_used"


@pytest.mark.asyncio
async def test_logout_idempotent(client: AsyncClient, app) -> None:
    body = register_body()
    await client.post("/auth/register", json=body)
    first = await client.post("/auth/logout")
    assert first.status_code == 200
    second = await client.post("/auth/logout")
    assert second.status_code == 200
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as empty:
        none = await empty.post("/auth/logout")
        assert none.status_code == 200


@pytest.mark.asyncio
async def test_forgot_rate_limit_same_for_missing(
    client: AsyncClient,
) -> None:
    last = None
    for _ in range(6):
        last = await client.post(
            "/auth/forgot-password", json={"email": "ghost@stonetrail.ru"}
        )
    assert last is not None
    assert last.status_code == 429
    assert last.json()["code"] == "rate_limited"


@pytest.mark.asyncio
async def test_integrity_error_duplicate_email(
    client: AsyncClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    body = register_body()
    assert (await client.post("/auth/register", json=body)).status_code == 200

    async def missing(_self: UserRepository, _value: str) -> None:
        return None

    monkeypatch.setattr(UserRepository, "get_alive_by_email", missing)
    monkeypatch.setattr(UserRepository, "get_alive_by_nickname", missing)
    conflict = await client.post(
        "/auth/register",
        json=register_body(email=body["email"], nickname=body["nickname"]),
    )
    assert conflict.status_code == 409
    assert conflict.json()["code"] in {"email_taken", "nickname_taken"}


def test_conflict_from_integrity_nickname() -> None:
    orig = Exception(
        'duplicate key value violates unique constraint "users_nickname_alive_key"'
    )
    exc = IntegrityError("insert", {}, orig)
    err = conflict_from_integrity(exc)
    assert err.code == "nickname_taken"


@pytest.mark.asyncio
async def test_register_rejects_short_first_name(client: AsyncClient) -> None:
    response = await client.post("/auth/register", json=register_body(firstName="И"))
    assert response.status_code == 422
    assert response.json()["code"] == "validation"
    assert "firstName" in response.json()["fieldErrors"]


@pytest.mark.asyncio
async def test_profile_allows_empty_names(client: AsyncClient) -> None:
    body = register_body()
    await client.post("/auth/register", json=body)
    saved = await client.patch(
        "/auth/profile",
        json={"nickname": body["nickname"], "firstName": "", "lastName": ""},
    )
    assert saved.status_code == 200, saved.text
    assert saved.json()["firstName"] == ""
    assert saved.json()["lastName"] == ""

    too_short = await client.patch(
        "/auth/profile",
        json={"nickname": body["nickname"], "firstName": "И", "lastName": ""},
    )
    assert too_short.status_code == 422
    assert "firstName" in too_short.json()["fieldErrors"]


@pytest.mark.asyncio
async def test_smtp_timeout_does_not_fail_register(
    client: AsyncClient,
    monkeypatch: pytest.MonkeyPatch,
    caplog: pytest.LogCaptureFixture,
) -> None:
    monkeypatch.setenv("SMTP_HOST", "smtp.mail.selcloud.ru")
    monkeypatch.setenv("SMTP_PORT", "1126")
    monkeypatch.setenv("SMTP_SECURITY", "starttls")
    monkeypatch.setenv("SMTP_USER", "mail-user")
    monkeypatch.setenv("SMTP_PASSWORD", "smtp-secret-password")
    monkeypatch.setenv("SMTP_FROM", "noreply@stonetrail.ru")
    get_settings.cache_clear()

    async def boom(*_args: object, **_kwargs: object) -> None:
        raise TimeoutError("smtp timeout")

    monkeypatch.setattr("services.mail.aiosmtplib.send", boom)

    with caplog.at_level("ERROR"):
        response = await client.post("/auth/register", json=register_body())
    assert response.status_code == 200, response.text
    assert "demoVerificationPath" in response.json()
    assert "smtp-secret-password" not in caplog.text
    me = await client.get("/auth/me")
    assert me.status_code == 200
    get_settings.cache_clear()


@pytest.mark.asyncio
async def test_debug_links_omitted_when_disabled(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setenv("AUTH_DEBUG_LINKS", "false")
    get_settings.cache_clear()
    app = create_app()
    transport = ASGITransport(app=app)
    async with SessionLocal() as session:
        await session.execute(text("TRUNCATE TABLE users CASCADE"))
        await session.commit()
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.post("/auth/register", json=register_body())
        assert response.status_code == 200, response.text
        assert response.json().get("demoVerificationPath") is None
        async with SessionLocal() as session:
            await session.execute(text("TRUNCATE TABLE users CASCADE"))
            await session.commit()
    get_settings.cache_clear()
