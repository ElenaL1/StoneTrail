from __future__ import annotations

import pytest
from community_helpers import login, register_verified, set_role
from httpx import AsyncClient
from sqlalchemy import text

from core.db import SessionLocal
from models.enums import UserRole


@pytest.fixture(autouse=True)
async def _clean_catalog():
    async with SessionLocal() as session:
        await session.execute(
            text("TRUNCATE TABLE stones, block_lots, products, media CASCADE")
        )
        await session.commit()
    yield


async def _editor(client: AsyncClient) -> None:
    account = await register_verified(
        client, email="catalog-editor@example.com", nickname="catalog-editor"
    )
    await set_role(str(account["email"]), UserRole.EDITOR)
    await login(client, str(account["email"]))


@pytest.mark.asyncio
async def test_guest_and_moderator_cannot_write_catalog(client: AsyncClient) -> None:
    guest = await client.post(
        "/api/catalog/stones",
        json={
            "name": "Талькохлорит",
            "stoneTypeCode": "marble",
            "quarry": "Карелия",
            "country": "Россия",
        },
    )
    assert guest.status_code == 401

    account = await register_verified(
        client, email="catalog-mod@example.com", nickname="catalog-mod"
    )
    await set_role(str(account["email"]), UserRole.MODERATOR)
    await login(client, str(account["email"]))
    denied = await client.post(
        "/api/catalog/stones",
        json={
            "name": "Талькохлорит",
            "stoneTypeCode": "marble",
            "quarry": "Карелия",
            "country": "Россия",
        },
    )
    assert denied.status_code == 403


@pytest.mark.asyncio
async def test_editor_creates_stone_and_lot_then_soft_deletes(
    client: AsyncClient,
) -> None:
    await _editor(client)
    created = await client.post(
        "/api/catalog/stones",
        json={
            "name": "Талькохлорит",
            "stoneTypeCode": "marble",
            "quarry": "Карелия",
            "country": "Россия",
            "description": "Плотный камень",
        },
    )
    assert created.status_code == 200, created.text
    stone = created.json()
    assert stone["name"] == "Талькохлорит"
    assert stone["id"] == "talkohlorit"

    lot = await client.post(
        "/api/catalog/blocks",
        json={
            "stoneSlug": stone["id"],
            "description": "Партия 1",
            "expertNote": "Ровный пил",
            "items": [
                {
                    "label": "Блок 01",
                    "status": "in_stock",
                    "lengthMm": 2800,
                    "widthMm": 1450,
                    "heightMm": 1250,
                    "finishCode": "polished",
                }
            ],
        },
    )
    assert lot.status_code == 200, lot.text
    assert lot.json()["blocks"][0]["label"] == "Блок 01"

    listed = await client.get("/api/catalog/stones")
    assert any(item["id"] == "talkohlorit" for item in listed.json())

    removed = await client.delete(f"/api/catalog/stones/{stone['id']}")
    assert removed.status_code == 409

    await client.delete(f"/api/catalog/blocks/{lot.json()['slug']}")
    removed = await client.delete(f"/api/catalog/stones/{stone['id']}")
    assert removed.status_code == 204
    listed = await client.get("/api/catalog/stones")
    assert all(item["id"] != "talkohlorit" for item in listed.json())
