from __future__ import annotations

import logging

import pytest
from pydantic import ValidationError

from core.config import Settings, get_settings
from services.mail import send_auth_email


def _enable_smtp(
    monkeypatch: pytest.MonkeyPatch, *, security: str = "starttls"
) -> None:
    monkeypatch.setenv("SMTP_HOST", "smtp.mail.selcloud.ru")
    monkeypatch.setenv("SMTP_PORT", "1126" if security == "starttls" else "1127")
    monkeypatch.setenv("SMTP_SECURITY", security)
    monkeypatch.setenv("SMTP_USER", "mail-user")
    monkeypatch.setenv("SMTP_PASSWORD", "smtp-secret-password")
    monkeypatch.setenv("SMTP_FROM", "noreply@stonetrail.ru")
    get_settings.cache_clear()


def test_smtp_disabled_when_host_empty() -> None:
    assert (
        Settings(
            smtp_host="", smtp_user="u", smtp_password="p", smtp_from="a@b.co"
        ).smtp_enabled
        is False
    )


def test_invalid_smtp_security_is_rejected() -> None:
    with pytest.raises(ValidationError):
        Settings(smtp_security="both")  # type: ignore[arg-type]


@pytest.mark.asyncio
async def test_send_auth_email_noop_without_smtp(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setenv("SMTP_HOST", "")
    monkeypatch.setenv("SMTP_USER", "")
    monkeypatch.setenv("SMTP_PASSWORD", "")
    monkeypatch.setenv("SMTP_FROM", "")
    get_settings.cache_clear()
    assert (
        await send_auth_email("verify", "user@stonetrail.ru", "/verify-email?token=abc")
        is False
    )
    get_settings.cache_clear()


@pytest.mark.asyncio
async def test_send_uses_explicit_security_mode(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    _enable_smtp(monkeypatch, security="tls")
    captured: dict[str, object] = {}

    async def fake_send(*_args: object, **kwargs: object) -> None:
        captured.update(kwargs)

    monkeypatch.setattr("services.mail.aiosmtplib.send", fake_send)
    assert (
        await send_auth_email("verify", "user@stonetrail.ru", "/verify-email?token=abc")
        is True
    )
    assert captured["use_tls"] is True
    assert captured["start_tls"] is False
    get_settings.cache_clear()


@pytest.mark.asyncio
async def test_smtp_auth_error_is_logged_without_password(
    monkeypatch: pytest.MonkeyPatch, caplog: pytest.LogCaptureFixture
) -> None:
    _enable_smtp(monkeypatch)

    async def boom(*_args: object, **_kwargs: object) -> None:
        raise Exception("535 Authentication credentials invalid")

    monkeypatch.setattr("services.mail.aiosmtplib.send", boom)
    with caplog.at_level(logging.ERROR):
        assert (
            await send_auth_email(
                "reset", "user@stonetrail.ru", "/reset-password?token=abc"
            )
            is False
        )
    assert "Failed to send reset email" in caplog.text
    assert "smtp-secret-password" not in caplog.text
    get_settings.cache_clear()
