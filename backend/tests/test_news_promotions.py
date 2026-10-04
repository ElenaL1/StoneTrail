from __future__ import annotations

from datetime import UTC, datetime, timedelta

import pytest
from community_helpers import login, register_verified, set_role
from httpx import AsyncClient
from sqlalchemy import text

from core.db import SessionLocal
from models.enums import UserRole


@pytest.fixture(autouse=True)
async def _clean_feed():
    async with SessionLocal() as session:
        await session.execute(text("TRUNCATE TABLE industry_news CASCADE"))
        await session.execute(text("TRUNCATE TABLE promotions CASCADE"))
        await session.execute(text("TRUNCATE TABLE audit_events"))
        await session.commit()
    yield


def _future() -> str:
    return (datetime.now(UTC) + timedelta(days=30)).isoformat()


def _past() -> str:
    return (datetime.now(UTC) - timedelta(days=2)).isoformat()


async def _editor(client: AsyncClient, email: str) -> None:
    account = await register_verified(client, email=email, nickname=email.split("@")[0])
    await set_role(str(account["email"]), UserRole.EDITOR)
    await login(client, str(account["email"]))


@pytest.mark.asyncio
async def test_draft_news_is_hidden_until_publish(client: AsyncClient) -> None:
    await _editor(client, "news-editor@example.com")
    created = await client.post(
        "/api/news",
        json={
            "title": "Новые карьеры Тосканы",
            "excerpt": "Короткий лид о месторождении.",
            "content": "Полный текст новости о новых карьерах.",
        },
    )
    assert created.status_code == 200, created.text
    slug = created.json()["slug"]
    assert created.json()["status"] == "draft"

    client.cookies.clear()
    hidden = await client.get("/api/news")
    assert hidden.status_code == 200
    assert hidden.json() == []
    missing = await client.get(f"/api/news/{slug}")
    assert missing.status_code == 404

    await login(client, "news-editor@example.com")
    published = await client.post(f"/api/news/{slug}/publish")
    assert published.status_code == 200, published.text
    assert published.json()["status"] == "published"

    client.cookies.clear()
    visible = await client.get("/api/news")
    assert [item["slug"] for item in visible.json()] == [slug]
    guest = await client.post(f"/api/news/{slug}/likes")
    assert guest.status_code == 401

    await login(client, "news-editor@example.com")
    liked = await client.post(f"/api/news/{slug}/likes")
    assert liked.status_code == 200, liked.text
    assert liked.json() == {"liked": True, "likesCount": 1}


@pytest.mark.asyncio
async def test_only_admin_deletes_news(client: AsyncClient) -> None:
    await _editor(client, "news-admin@example.com")
    created = await client.post(
        "/api/news",
        json={
            "title": "Сроки поставок",
            "excerpt": "Лид про логистику.",
            "content": "Текст про сроки поставок слэбов.",
            "status": "published",
        },
    )
    assert created.status_code == 200, created.text
    slug = created.json()["slug"]

    denied = await client.delete(f"/api/news/{slug}")
    assert denied.status_code == 403

    await set_role("news-admin@example.com", UserRole.ADMIN)
    await login(client, "news-admin@example.com")
    removed = await client.delete(f"/api/news/{slug}")
    assert removed.status_code == 204
    assert (await client.get(f"/api/news/{slug}")).status_code == 404

    restored = await client.post(f"/api/news/{slug}/restore")
    assert restored.status_code == 200, restored.text
    assert (await client.get(f"/api/news/{slug}")).status_code == 200


@pytest.mark.asyncio
async def test_promotion_template_and_expiry(client: AsyncClient) -> None:
    await _editor(client, "promo-editor@example.com")
    rejected = await client.post(
        "/api/promotions",
        json={
            "title": "Зимняя подборка",
            "description": "Граниты для коммерческих объектов.",
            "content": "Подробности партии.",
            "template": "rainbow",
            "expiresAt": _future(),
            "isEnabled": True,
        },
    )
    assert rejected.status_code == 422

    created = await client.post(
        "/api/promotions",
        json={
            "title": "Зимняя подборка",
            "description": "Граниты для коммерческих объектов.",
            "content": "Подробности партии.",
            "template": "ledger",
            "buttonLabel": "Смотреть партию",
            "expiresAt": _future(),
            "isEnabled": True,
        },
    )
    assert created.status_code == 200, created.text
    body = created.json()
    assert body["template"] == "ledger"
    assert body["buttonLabel"] == "Смотреть партию"
    slug = body["slug"]

    active = await client.get("/api/promotions/active")
    assert active.status_code == 200
    assert [item["slug"] for item in active.json()] == [slug]

    expired = await client.patch(
        f"/api/promotions/{slug}",
        json={"expiresAt": _past()},
    )
    assert expired.status_code == 200, expired.text
    assert (await client.get("/api/promotions/active")).json() == []
    listed = await client.get("/api/promotions")
    assert [item["slug"] for item in listed.json()] == [slug]

    await set_role("promo-editor@example.com", UserRole.ADMIN)
    await login(client, "promo-editor@example.com")
    assert (await client.delete(f"/api/promotions/{slug}")).status_code == 204
    assert (await client.get("/api/promotions")).json() == []
