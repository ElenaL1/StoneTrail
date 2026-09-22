from __future__ import annotations

import pytest
from community_helpers import (
    login,
    logout,
    register_user,
    register_verified,
    set_role,
)
from httpx import AsyncClient
from sqlalchemy import text

from core.db import SessionLocal
from models.enums import UserRole


@pytest.fixture(autouse=True)
async def _clean_articles():
    async with SessionLocal() as session:
        await session.execute(text("TRUNCATE TABLE articles CASCADE"))
        await session.commit()
    yield
    async with SessionLocal() as session:
        await session.execute(text("TRUNCATE TABLE articles CASCADE"))
        await session.commit()


async def first_category_id(client: AsyncClient) -> str:
    response = await client.get("/api/articles/categories")
    assert response.status_code == 200
    rows = response.json()
    assert rows
    return rows[0]["id"]


def article_body(category_id: str, **overrides: object) -> dict[str, object]:
    payload: dict[str, object] = {
        "title": "Как выбрать алмазный диск",
        "excerpt": "Короткий гид по инструменту",
        "content": "Мы сравнили три диска на граните и записали расход.",
        "categoryId": category_id,
    }
    payload.update(overrides)
    return payload


@pytest.mark.asyncio
async def test_guest_cannot_create_article(client: AsyncClient) -> None:
    category_id = await first_category_id(client)
    response = await client.post("/api/articles", json=article_body(category_id))
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_unverified_cannot_create_article(client: AsyncClient) -> None:
    await register_user(client)
    category_id = await first_category_id(client)
    response = await client.post("/api/articles", json=article_body(category_id))
    assert response.status_code == 403
    assert response.json()["code"] == "unverified"


@pytest.mark.asyncio
async def test_new_author_cannot_publish_until_moderated(client: AsyncClient) -> None:
    author = await register_verified(client)
    category_id = await first_category_id(client)
    created = await client.post("/api/articles", json=article_body(category_id))
    assert created.status_code == 200, created.text
    slug = created.json()["slug"]
    assert created.json()["publicationStatus"] == "draft"

    forbidden = await client.post(f"/api/articles/{slug}/publish")
    assert forbidden.status_code == 403

    submitted = await client.post(f"/api/articles/{slug}/submit")
    assert submitted.status_code == 200
    assert submitted.json()["publicationStatus"] == "pending_review"

    public = await client.get("/api/articles")
    assert public.json() == []

    await logout(client)
    hidden = await client.get(f"/api/articles/{slug}")
    assert hidden.status_code == 404

    moderator = await register_verified(client)
    await set_role(str(moderator["email"]), UserRole.MODERATOR)
    queued = await client.get("/api/articles/moderation")
    assert queued.status_code == 200
    assert queued.json()[0]["slug"] == slug

    published = await client.post(
        f"/api/articles/{slug}/moderate", json={"action": "publish"}
    )
    assert published.status_code == 200, published.text
    assert published.json()["publicationStatus"] == "published"

    await logout(client)
    await login(client, str(author["email"]))
    me = await client.get("/auth/me")
    assert me.json()["canPublishArticles"] is True

    second = await client.post(
        "/api/articles",
        json=article_body(category_id, title="Настройка CNC для мрамора"),
    )
    second_slug = second.json()["slug"]
    live = await client.post(f"/api/articles/{second_slug}/publish")
    assert live.status_code == 200, live.text
    assert live.json()["publicationStatus"] == "published"

    feed = await client.get("/api/articles")
    slugs = {item["slug"] for item in feed.json()}
    assert slug in slugs
    assert second_slug in slugs


@pytest.mark.asyncio
async def test_moderator_can_return_and_author_resubmits(
    client: AsyncClient,
) -> None:
    await register_verified(client)
    category_id = await first_category_id(client)
    created = await client.post("/api/articles", json=article_body(category_id))
    slug = created.json()["slug"]
    await client.post(f"/api/articles/{slug}/submit")
    await logout(client)

    moderator = await register_verified(client)
    await set_role(str(moderator["email"]), UserRole.MODERATOR)
    returned = await client.post(
        f"/api/articles/{slug}/moderate",
        json={"action": "request_changes", "note": "Добавьте фото процесса."},
    )
    assert returned.status_code == 200
    assert returned.json()["publicationStatus"] == "needs_revision"
    assert "фото" in returned.json()["moderationNote"]


@pytest.mark.asyncio
async def test_author_edit_withdraws_article_from_moderation(
    client: AsyncClient,
) -> None:
    author = await register_verified(client)
    category_id = await first_category_id(client)
    created = await client.post("/api/articles", json=article_body(category_id))
    slug = created.json()["slug"]
    submitted = await client.post(f"/api/articles/{slug}/submit")
    assert submitted.json()["publicationStatus"] == "pending_review"
    await logout(client)

    moderator = await register_verified(client)
    await set_role(str(moderator["email"]), UserRole.MODERATOR)
    queued = await client.get("/api/articles/moderation")
    assert queued.status_code == 200
    assert any(item["slug"] == slug for item in queued.json())
    await logout(client)

    await login(client, str(author["email"]))
    updated = await client.patch(
        f"/api/articles/{slug}",
        json={"content": "Обновлённый текст после отправки на модерацию."},
    )
    assert updated.status_code == 200, updated.text
    body = updated.json()
    assert body["publicationStatus"] == "draft"
    assert "Обновлённый" in body["content"]
    await logout(client)

    await login(client, str(moderator["email"]))
    queue = await client.get("/api/articles/moderation")
    assert queue.status_code == 200
    assert all(item["slug"] != slug for item in queue.json())
    await logout(client)

    await login(client, str(author["email"]))
    resubmitted = await client.post(f"/api/articles/{slug}/submit")
    assert resubmitted.status_code == 200
    assert resubmitted.json()["publicationStatus"] == "pending_review"
