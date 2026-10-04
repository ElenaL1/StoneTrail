from __future__ import annotations

from datetime import date

import pytest
from community_helpers import login, register_verified, set_role
from httpx import AsyncClient
from sqlalchemy import text

from core.db import SessionLocal
from models.enums import UserRole


@pytest.fixture(autouse=True)
async def _clean_pages():
    async with SessionLocal() as session:
        await session.execute(text("TRUNCATE TABLE page_blocks"))
        await session.commit()
    yield


async def _as(client: AsyncClient, email: str, nickname: str, role: UserRole) -> None:
    account = await register_verified(client, email=email, nickname=nickname)
    await set_role(str(account["email"]), role)
    await login(client, str(account["email"]))


@pytest.mark.asyncio
async def test_editor_publishes_page_and_admin_publishes_legal(
    client: AsyncClient,
) -> None:
    await _as(client, "page-editor@example.com", "page-editor", UserRole.EDITOR)
    saved = await client.put(
        "/api/admin/pages/content",
        params={"page_key": "about"},
        json={"blocks": [{"blockKey": "hero.title", "value": "О мастерской"}]},
    )
    assert saved.status_code == 200, saved.text
    title = next(
        item for item in saved.json()["blocks"] if item["blockKey"] == "hero.title"
    )
    assert title["draftValue"] == "О мастерской"
    assert title["publishedValue"] == ""

    public = await client.get("/api/pages/content", params={"page_key": "about"})
    assert public.status_code == 200
    assert public.json()["blocks"] == []

    published = await client.post(
        "/api/admin/pages/content/publish",
        params={"page_key": "about"},
        json={},
    )
    assert published.status_code == 200, published.text
    public = await client.get("/api/pages/content", params={"page_key": "about"})
    values = {item["blockKey"]: item["value"] for item in public.json()["blocks"]}
    assert values["hero.title"] == "О мастерской"

    legal = await client.post(
        "/api/admin/pages/content/publish",
        params={"page_key": "legal/privacy"},
        json={"effectiveFrom": date.today().isoformat()},
    )
    assert legal.status_code == 403

    await _as(client, "page-admin@example.com", "page-admin", UserRole.ADMIN)
    await client.put(
        "/api/admin/pages/content",
        params={"page_key": "legal/privacy"},
        json={"blocks": [{"blockKey": "body", "value": "Новая редакция политики."}]},
    )
    legal = await client.post(
        "/api/admin/pages/content/publish",
        params={"page_key": "legal/privacy"},
        json={"effectiveFrom": "2026-10-01"},
    )
    assert legal.status_code == 200, legal.text
    public = await client.get(
        "/api/pages/content", params={"page_key": "legal/privacy"}
    )
    assert public.json()["effectiveFrom"] == "2026-10-01"
    assert public.json()["blocks"][0]["value"] == "Новая редакция политики."
