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


@pytest.mark.asyncio
async def test_product_can_belong_to_several_stones(client: AsyncClient) -> None:
    await _editor(client)

    async def add_stone(name: str) -> dict:
        created = await client.post(
            "/api/catalog/stones",
            json={
                "name": name,
                "stoneTypeCode": "marble",
                "quarry": "Выборгский район",
                "country": "Россия",
                "description": "Сорт для изделия",
            },
        )
        assert created.status_code == 200, created.text
        return created.json()

    first = await add_stone("Дымовский")
    second = await add_stone("Возрождение")
    created = await client.post(
        "/api/catalog/products",
        json={
            "name": "Окол",
            "stoneSlug": first["id"],
            "stoneSlugs": [first["id"], second["id"]],
            "category": "paving",
            "description": "Два сорта в одном изделии",
        },
    )
    assert created.status_code == 200, created.text
    body = created.json()
    assert body["stoneName"] == "Дымовский"
    assert body["stoneNames"] == ["Дымовский", "Возрождение"]

    listing = (await client.get("/api/catalog/stones")).json()
    stones = {row["id"]: row for row in listing}
    assert stones[first["id"]]["hasProducts"] is True
    assert stones[second["id"]]["hasProducts"] is True

    blocked = await client.delete(f"/api/catalog/stones/{second['id']}")
    assert blocked.status_code == 409

    edit = await client.get(f"/api/catalog/products/{body['slug']}/edit")
    assert edit.status_code == 200, edit.text
    assert edit.json()["stoneSlugs"] == [first["id"], second["id"]]

    single = await client.patch(
        f"/api/catalog/products/{body['slug']}",
        json={
            "name": "Окол",
            "stoneSlug": first["id"],
            "category": "paving",
            "description": "Два сорта в одном изделии",
        },
    )
    assert single.status_code == 200, single.text
    assert single.json()["stoneNames"] == ["Дымовский"]

    listing = (await client.get("/api/catalog/stones")).json()
    stones = {row["id"]: row for row in listing}
    assert stones[first["id"]]["hasProducts"] is True
    assert stones[second["id"]]["hasProducts"] is False

    removed = await client.delete(f"/api/catalog/stones/{second['id']}")
    assert removed.status_code == 204
