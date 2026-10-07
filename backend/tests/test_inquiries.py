from __future__ import annotations

from email.message import EmailMessage

import pytest
from community_helpers import login, register_verified
from httpx import AsyncClient

from core.config import get_settings


def _enable_smtp(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("SMTP_HOST", "smtp.mail.selcloud.ru")
    monkeypatch.setenv("SMTP_PORT", "1126")
    monkeypatch.setenv("SMTP_SECURITY", "starttls")
    monkeypatch.setenv("SMTP_USER", "mail-user")
    monkeypatch.setenv("SMTP_PASSWORD", "smtp-secret-password")
    monkeypatch.setenv("SMTP_FROM", "noreply@stonetrail.ru")
    get_settings.cache_clear()


def _line() -> dict[str, str]:
    return {
        "id": "product:tile-carrara:300",
        "title": "Плита Carrara Bianco",
        "summary": "300 × 300 мм · 20 мм · Полированная · В наличии · 4 233 ₽/м²",
    }


@pytest.mark.asyncio
async def test_inquiry_requires_login(client: AsyncClient) -> None:
    response = await client.post(
        "/api/inquiries",
        json={"name": "Stone", "message": "Нужна плита", "lines": []},
    )
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_inquiry_unavailable_without_recipients(
    client: AsyncClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    monkeypatch.setenv("INQUIRY_TO", "")
    _enable_smtp(monkeypatch)
    account = await register_verified(
        client, email="buyer-empty@stonetrail.ru", nickname="BuyerEmpty"
    )
    await login(client, str(account["email"]))

    response = await client.post(
        "/api/inquiries",
        json={"name": "Buyer", "message": "Нужна плита", "lines": [_line()]},
    )
    assert response.status_code == 503
    assert response.json()["code"] == "unavailable"
    assert "smtp-secret-password" not in response.text
    get_settings.cache_clear()


@pytest.mark.asyncio
async def test_inquiry_email_goes_to_configured_recipients(
    client: AsyncClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    monkeypatch.setenv("INQUIRY_TO", "sales@stonetrail.ru, office@stonetrail.ru")
    _enable_smtp(monkeypatch)
    captured: dict[str, EmailMessage] = {}

    async def fake_send(message: EmailMessage, **_kwargs: object) -> None:
        captured["message"] = message

    monkeypatch.setattr("services.mail.aiosmtplib.send", fake_send)
    account = await register_verified(
        client, email="buyer@stonetrail.ru", nickname="Buyer"
    )
    await login(client, str(account["email"]))

    response = await client.post(
        "/api/inquiries",
        json={
            "name": "Студия Lux",
            "message": "Нужен раскрой",
            "email": "other@evil.test",
            "lines": [_line()],
        },
    )
    assert response.status_code == 204, response.text
    message = captured["message"]
    assert message["To"] == "sales@stonetrail.ru, office@stonetrail.ru"
    assert message["Reply-To"] == "buyer@stonetrail.ru"
    plain = message.get_body(preferencelist=("plain",))
    assert plain is not None
    text = plain.get_content()
    assert "Студия Lux" in text
    assert "buyer@stonetrail.ru" in text
    assert "Плита Carrara Bianco" in text
    assert "300 × 300 мм" in text
    assert "other@evil.test" not in text
    assert "smtp-secret-password" not in text
    get_settings.cache_clear()
