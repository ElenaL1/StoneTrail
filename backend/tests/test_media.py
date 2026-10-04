from __future__ import annotations

import pytest
from community_helpers import login, register_verified, set_role
from httpx import AsyncClient
from sqlalchemy import text

from core.db import SessionLocal
from core.deps import get_object_storage
from models.enums import UserRole
from services.media_storage import MemoryStorage


@pytest.fixture(autouse=True)
async def _clean_media():
    async with SessionLocal() as session:
        await session.execute(
            text("TRUNCATE TABLE stones, block_lots, products, media CASCADE")
        )
        await session.commit()
    yield


@pytest.mark.asyncio
async def test_editor_confirms_upload_and_links_stone(client: AsyncClient, app) -> None:
    storage = MemoryStorage()
    app.dependency_overrides[get_object_storage] = lambda: storage
    account = await register_verified(
        client, email="media-editor@example.com", nickname="media-editor"
    )
    await set_role(str(account["email"]), UserRole.EDITOR)
    await login(client, str(account["email"]))

    stone = await client.post(
        "/api/catalog/stones",
        json={
            "name": "Базальт",
            "stoneTypeCode": "marble",
            "quarry": "Урал",
            "country": "Россия",
        },
    )
    assert stone.status_code == 200, stone.text

    presign = await client.post(
        "/api/media/presign",
        json={"contentType": "image/jpeg", "sizeBytes": 4},
    )
    assert presign.status_code == 200, presign.text
    key = presign.json()["storageKey"]
    storage.put(key, b"\xff\xd8\xff\x00", "image/jpeg")

    confirmed = await client.post(
        "/api/media",
        json={
            "storageKey": key,
            "alt": "Слэб базальта",
            "contentType": "image/jpeg",
            "sizeBytes": 4,
        },
    )
    assert confirmed.status_code == 200, confirmed.text
    media_id = confirmed.json()["id"]

    linked = await client.post(
        f"/api/media/{media_id}/links",
        json={"ownerType": "stone", "ownerSlug": stone.json()["id"], "isPrimary": True},
    )
    assert linked.status_code == 200, linked.text

    public = await client.get(f"/api/catalog/stones/{stone.json()['id']}")
    assert public.json()["image"].endswith(key)

    deleted = await client.delete(f"/api/media/{media_id}")
    assert deleted.status_code == 204
    assert storage.read(key) is None
    app.dependency_overrides.pop(get_object_storage, None)
