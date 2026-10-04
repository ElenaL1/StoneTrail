from __future__ import annotations

import pytest
from community_helpers import login, register_verified, set_role
from httpx import AsyncClient
from sqlalchemy import text

from core.db import SessionLocal
from models.enums import UserRole


@pytest.fixture(autouse=True)
async def _clean_articles():
    async with SessionLocal() as session:
        await session.execute(text("TRUNCATE TABLE articles CASCADE"))
        await session.execute(text("TRUNCATE TABLE audit_events"))
        await session.commit()
    yield


async def _category(client: AsyncClient) -> str:
    response = await client.get("/api/articles/categories")
    assert response.status_code == 200
    return response.json()[0]["id"]


@pytest.mark.asyncio
async def test_only_admin_deletes_published_article(client: AsyncClient) -> None:
    author = await register_verified(
        client, email="article-author@example.com", nickname="article-author"
    )
    await set_role(str(author["email"]), UserRole.EDITOR)
    await login(client, str(author["email"]))
    category_id = await _category(client)
    created = await client.post(
        "/api/articles",
        json={
            "title": "Как читать слэб",
            "excerpt": "Коротко о рисунке",
            "content": "Текст статьи про рисунок камня и свет.",
            "categoryId": category_id,
        },
    )
    assert created.status_code == 200, created.text
    slug = created.json()["slug"]
    published = await client.post(f"/api/articles/{slug}/publish")
    assert published.status_code == 200, published.text

    await set_role(str(author["email"]), UserRole.EDITOR)
    await login(client, str(author["email"]))
    denied = await client.delete(f"/api/articles/{slug}")
    assert denied.status_code == 403

    await set_role(str(author["email"]), UserRole.ADMIN)
    await login(client, str(author["email"]))
    removed = await client.delete(f"/api/articles/{slug}")
    assert removed.status_code == 204, removed.text
    missing = await client.get(f"/api/articles/{slug}")
    assert missing.status_code == 404

    restored = await client.post(f"/api/articles/{slug}/restore")
    assert restored.status_code == 200, restored.text
    visible = await client.get(f"/api/articles/{slug}")
    assert visible.status_code == 200

    audit = await client.get("/api/admin/audit")
    assert audit.status_code == 200, audit.text
    actions = {item["action"] for item in audit.json()}
    assert "article_publish" in actions
    assert "article_delete" in actions
    assert "article_restore" in actions
