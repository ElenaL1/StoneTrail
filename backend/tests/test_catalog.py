from __future__ import annotations

import re
from datetime import UTC, datetime

import pytest
from httpx import AsyncClient
from sqlalchemy import func, select, text

from core.db import SessionLocal
from models.catalog import Product, Stone
from models.enums import (
    CustomGroup,
    FinishedStatus,
    LotItemStatus,
    MediaOwner,
    ProductCategory,
    ProductItemKind,
)
from catalog_fixtures import (
    add_block_item,
    add_lot,
    add_media,
    add_product,
    add_product_item,
    add_stone,
)

UUID_RE = re.compile(
    r"^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$",
    re.I,
)


def assert_no_uuid(payload: object) -> None:
    if isinstance(payload, dict):
        for key, value in payload.items():
            if key in {"id", "blockStoneId", "blockSlug", "slug"} and isinstance(
                value, str
            ):
                assert not UUID_RE.match(value), f"{key} looks like a UUID: {value}"
            assert_no_uuid(value)
    elif isinstance(payload, list):
        for item in payload:
            assert_no_uuid(item)


@pytest.fixture(autouse=True)
async def _clean_catalog():
    async with SessionLocal() as session:
        await session.execute(
            text("TRUNCATE TABLE stones, block_lots, products, media CASCADE")
        )
        await session.commit()
    yield
    async with SessionLocal() as session:
        await session.execute(
            text("TRUNCATE TABLE stones, block_lots, products, media CASCADE")
        )
        await session.commit()


@pytest.mark.asyncio
async def test_list_and_get_stone_camel_case(client: AsyncClient) -> None:
    async with SessionLocal() as session:
        stone = await add_stone(session, slug="calacatta-gold", name="Calacatta Gold")
        product = await add_product(
            session,
            stone,
            slug="slab-calacatta-gold",
            name="Слэб Calacatta Gold",
            category=ProductCategory.SLABS,
        )
        await add_product_item(
            session, product, kind=ProductItemKind.SLAB, label="Слэб 01"
        )
        await add_product_item(
            session, product, kind=ProductItemKind.SLAB, label="Слэб 03"
        )
        await add_product_item(
            session, product, kind=ProductItemKind.SLAB, label="Слэб 04"
        )
        await add_product_item(
            session,
            product,
            kind=ProductItemKind.SLAB,
            label="Слэб 02",
            status=LotItemStatus.RESERVED,
            thickness_mm=30,
            finish_code="satin",
        )
        await add_product_item(
            session,
            product,
            kind=ProductItemKind.TILE,
            label="Плитка 01",
        )
        lot = await add_lot(session, stone, slug="block-calacatta-gold")
        await add_block_item(session, lot, label="Блок A")
        await add_media(
            session,
            owner_type=MediaOwner.STONE,
            owner_id=stone.id,
            public_url="/stone/calacatta.png",
        )
        await session.commit()

    listing = await client.get("/catalog/stones")
    assert listing.status_code == 200, listing.text
    rows = listing.json()
    assert len(rows) == 1
    row = rows[0]
    assert row["id"] == "calacatta-gold"
    assert row["name"] == "Calacatta Gold"
    assert row["type"] == "Мрамор"
    assert row["image"] == "/stone/calacatta.png"
    assert row["supplier"] == "StoneTrail"
    assert row["location"] == "склад"
    assert row["slabs"] == 4
    assert row["tiles"] == 1
    assert row["status"] == "В наличии"
    assert row["blockSlug"] == "block-calacatta-gold"
    assert row["thickness"] == "20–30 мм"
    assert "Полированная" in row["finish"]
    assert "Сатинированная" in row["finish"]
    assert "updated" in row
    assert_no_uuid(row)

    detail = await client.get("/catalog/stones/calacatta-gold")
    assert detail.status_code == 200
    assert detail.json()["id"] == "calacatta-gold"


@pytest.mark.asyncio
async def test_stone_not_found_and_soft_delete(client: AsyncClient) -> None:
    missing = await client.get("/catalog/stones/missing")
    assert missing.status_code == 404
    assert missing.json() == {
        "message": "Не найдено.",
        "code": "not_found",
        "fieldErrors": None,
        "retryAfterSeconds": None,
    }

    async with SessionLocal() as session:
        stone = await add_stone(session, slug="hidden-stone", name="Hidden")
        await session.commit()
        stone_id = stone.id

    found = await client.get("/catalog/stones/hidden-stone")
    assert found.status_code == 200

    async with SessionLocal() as session:
        row = await session.get(Stone, stone_id)
        assert row is not None
        row.deleted_at = datetime.now(UTC)
        await session.commit()

    deleted = await client.get("/catalog/stones/hidden-stone")
    assert deleted.status_code == 404
    assert deleted.json()["code"] == "not_found"
    listing = await client.get("/catalog/stones")
    assert listing.json() == []


@pytest.mark.asyncio
async def test_cover_fallback_and_low_stock(client: AsyncClient) -> None:
    async with SessionLocal() as session:
        stone = await add_stone(session, slug="white-macaubas", name="White Macaúbas")
        product = await add_product(
            session,
            stone,
            slug="slab-white-macaubas",
            name="Слэб White Macaúbas",
            category=ProductCategory.SLABS,
        )
        await add_product_item(
            session, product, kind=ProductItemKind.SLAB, label="Слэб 01"
        )
        await add_media(
            session,
            owner_type=MediaOwner.STONE,
            owner_id=stone.id,
            public_url="/stone/first.png",
            is_primary=False,
            sort_order=1,
            storage_key="dev/stone/first.png",
        )
        await add_media(
            session,
            owner_type=MediaOwner.STONE,
            owner_id=stone.id,
            public_url="/stone/second.png",
            is_primary=False,
            sort_order=2,
            storage_key="dev/stone/second.png",
        )
        await session.commit()

    data = (await client.get("/catalog/stones/white-macaubas")).json()
    assert data["image"] == "/stone/first.png"
    assert data["status"] == "Мало"
    assert data["slabs"] == 1


@pytest.mark.asyncio
async def test_sold_status_without_units(client: AsyncClient) -> None:
    async with SessionLocal() as session:
        await add_stone(session, slug="carbon-soapstone", name="Carbon Soapstone")
        await session.commit()

    data = (await client.get("/catalog/stones/carbon-soapstone")).json()
    assert data["status"] == "Продано"
    assert data["slabs"] == 0
    assert data["tiles"] == 0
    assert "blockSlug" not in data


@pytest.mark.asyncio
async def test_blocks_and_products_filters(client: AsyncClient) -> None:
    async with SessionLocal() as session:
        stone = await add_stone(session, slug="verde-alpi", name="Verde Alpi")
        lot = await add_lot(session, stone, slug="block-verde-alpi")
        await add_block_item(session, lot, label="Блок A")
        await add_media(
            session,
            owner_type=MediaOwner.BLOCK_LOT,
            owner_id=lot.id,
            public_url="/stone/green-marble.png",
        )
        slab = await add_product(
            session,
            stone,
            slug="slab-verde-alpi",
            name="Слэб Verde Alpi",
            category=ProductCategory.SLABS,
        )
        await add_product_item(
            session, slab, kind=ProductItemKind.SLAB, label="Слэб 01"
        )
        custom = Product(
            slug="countertop-verde-alpi",
            category=ProductCategory.CUSTOM,
            stone_id=stone.id,
            name="Столешница Verde Alpi",
            description="Изделие",
            product_type="Столешницы",
            custom_group=CustomGroup.INTERIOR,
            finish="Полированная",
            status=FinishedStatus.IN_STOCK,
        )
        session.add(custom)
        await session.flush()
        await add_media(
            session,
            owner_type=MediaOwner.PRODUCT,
            owner_id=slab.id,
            public_url="/stone/green-marble.png",
        )
        await session.commit()

    blocks = await client.get("/catalog/blocks")
    assert blocks.status_code == 200
    block = blocks.json()[0]
    assert block["id"] == "block-verde-alpi"
    assert block["slug"] == "block-verde-alpi"
    assert block["blockStoneId"] == "verde-alpi"
    assert block["blocks"][0]["label"] == "Блок A"
    assert block["blocks"][0]["status"] == "В наличии"
    assert (
        "2800" in block["blocks"][0]["dimensions"].replace(" ", "")
        or "2 800" in block["blocks"][0]["dimensions"]
    )
    assert_no_uuid(block)

    missing_block = await client.get("/catalog/blocks/missing")
    assert missing_block.status_code == 404

    products = await client.get("/catalog/products")
    assert {row["slug"] for row in products.json()} == {
        "slab-verde-alpi",
        "countertop-verde-alpi",
    }

    slabs = await client.get("/catalog/products", params={"category": "slabs"})
    assert [row["id"] for row in slabs.json()] == ["slab-verde-alpi"]
    assert slabs.json()[0]["slabs"][0]["thickness"] == "20 мм"

    unknown = await client.get("/catalog/products", params={"category": "nope"})
    assert unknown.status_code == 200
    assert unknown.json() == []

    both = await client.get(
        "/catalog/products", params={"category": "slabs", "group": "interior"}
    )
    assert both.json() == []

    grouped = await client.get(
        "/catalog/products", params={"category": "custom", "group": "interior"}
    )
    assert [row["slug"] for row in grouped.json()] == ["countertop-verde-alpi"]
    assert grouped.json()[0]["customGroup"] == "interior"
    assert grouped.json()[0]["status"] == "В наличии"

    unknown_group = await client.get(
        "/catalog/products", params={"group": "not-a-group"}
    )
    assert unknown_group.json() == []

    detail = await client.get("/catalog/products/slab-verde-alpi")
    assert detail.status_code == 200
    assert_no_uuid(detail.json())

    gone = await client.get("/catalog/products/missing")
    assert gone.status_code == 404


@pytest.mark.asyncio
async def test_soft_deleted_product_hidden(client: AsyncClient) -> None:
    async with SessionLocal() as session:
        stone = await add_stone(session, slug="taj-mahal", name="Taj Mahal")
        product = await add_product(
            session,
            stone,
            slug="slab-taj-mahal",
            name="Слэб Taj Mahal",
            category=ProductCategory.SLABS,
        )
        await session.commit()
        product_id = product.id

    assert (await client.get("/catalog/products/slab-taj-mahal")).status_code == 200

    async with SessionLocal() as session:
        row = await session.get(Product, product_id)
        assert row is not None
        row.deleted_at = datetime.now(UTC)
        await session.commit()

    hidden = await client.get("/catalog/products/slab-taj-mahal")
    assert hidden.status_code == 404
    listing = await client.get("/catalog/products")
    assert listing.json() == []


@pytest.mark.asyncio
async def test_seed_catalog_idempotent() -> None:
    from scripts.seed_catalog import seed_catalog_data

    payload = {
        "materials": [
            {
                "id": "seed-stone",
                "name": "Seed Stone",
                "type": "Мрамор",
                "finish": "Полировка",
                "thickness": "20 мм",
                "image": "/stone/calacatta.png",
                "quarry": "Каррара",
                "country": "Италия",
                "description": "Сид",
            }
        ],
        "blocks": [
            {
                "id": "block-seed-stone",
                "slug": "block-seed-stone",
                "stoneName": "Seed Stone",
                "stoneType": "Мрамор",
                "quarry": "Каррара",
                "country": "Италия",
                "image": "/stone/calacatta.png",
                "description": "Лот",
                "expertNote": "Заметка",
                "blockStoneId": "seed-stone",
                "blocks": [
                    {
                        "label": "Блок A",
                        "dimensions": "2 800 × 1 450 × 1 250 мм",
                        "weight": "~27,9 т",
                        "status": "В наличии",
                    }
                ],
            }
        ],
        "products": [
            {
                "id": "slab-01",
                "slug": "slab-seed-stone",
                "category": "slabs",
                "name": "Слэб Seed Stone",
                "stoneName": "Seed Stone",
                "stoneType": "Мрамор",
                "description": "Слэб",
                "image": "/stone/calacatta.png",
                "finish": "Полированная",
                "thickness": "20 мм",
                "slabs": [
                    {
                        "label": "Слэб 01",
                        "size": "3280 × 1840 мм",
                        "thickness": "20 мм",
                        "finish": "Полированная",
                        "status": "В наличии",
                        "image": "/stone/calacatta.png",
                    }
                ],
            }
        ],
    }

    async with SessionLocal() as session:
        await seed_catalog_data(session, payload)
        await session.commit()
        first_stones = await session.scalar(select(func.count()).select_from(Stone))
        first_products = await session.scalar(select(func.count()).select_from(Product))

    async with SessionLocal() as session:
        await seed_catalog_data(session, payload)
        await session.commit()
        second_stones = await session.scalar(select(func.count()).select_from(Stone))
        second_products = await session.scalar(
            select(func.count()).select_from(Product)
        )

    assert first_stones == second_stones == 1
    assert first_products == second_products == 1
