from __future__ import annotations

from datetime import UTC, datetime, timedelta
from io import BytesIO

import pytest
from community_helpers import login, register_verified, set_role
from httpx import AsyncClient
from openpyxl import Workbook

from models.enums import UserRole


def _future() -> str:
    return (datetime.now(UTC) + timedelta(days=20)).isoformat()


def _past() -> str:
    return (datetime.now(UTC) - timedelta(days=2)).isoformat()


async def _editor(client: AsyncClient) -> None:
    account = await register_verified(
        client, email="offer-editor@example.com", nickname="offer-editor"
    )
    await set_role(str(account["email"]), UserRole.EDITOR)
    await login(client, str(account["email"]))


def _workbook() -> bytes:
    book = Workbook()
    sheet = book.active
    assert sheet is not None
    sheet.append(
        [
            "Наименование",
            "Длина",
            "Ширина",
            "Толщина",
            "Фактура",
            "Кв метр",
            "Цена руб./м2",
        ]
    )
    sheet.append(
        ["гр. Дымовский полированный 30 мм", None, None, None, None, None, None]
    )
    sheet.append(
        ["гр. Дымовский полированный 30 мм", 600, 300, 30, "полированный", 20.52, 2897]
    )
    buffer = BytesIO()
    book.save(buffer)
    return buffer.getvalue()


@pytest.mark.asyncio
async def test_import_preview_matches_existing_stone(client: AsyncClient) -> None:
    await _editor(client)
    created = await client.post(
        "/api/catalog/stones",
        json={
            "name": "Дымовский",
            "stoneTypeCode": "marble",
            "quarry": "Карелия",
            "country": "Россия",
        },
    )
    assert created.status_code == 200, created.text
    preview = await client.post(
        "/api/promotions/import",
        files={
            "file": (
                "offer.xlsx",
                _workbook(),
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            )
        },
    )
    assert preview.status_code == 200, preview.text
    body = preview.json()
    assert body["lines"][0]["stoneName"] == "Дымовский"
    assert body["lines"][0]["stoneSlug"] == created.json()["id"]
    assert body["lines"][0]["kind"] == "tile"
    await client.delete(f"/api/catalog/stones/{created.json()['id']}")


@pytest.mark.asyncio
async def test_catalog_price_lasts_until_expiry(client: AsyncClient) -> None:
    await _editor(client)
    stone = await client.post(
        "/api/catalog/stones",
        json={
            "name": "Куртинский",
            "stoneTypeCode": "marble",
            "quarry": "Карелия",
            "country": "Россия",
        },
    )
    assert stone.status_code == 200, stone.text
    stone_slug = stone.json()["id"]
    created = await client.post(
        "/api/promotions",
        json={
            "title": "Скидка на плиты",
            "description": "Остатки отечественного гранита.",
            "content": "Прайс на странице акции.",
            "buttonLabel": "Посмотрите цены тут",
            "inquiryLabel": "Запросить",
            "expiresAt": _future(),
            "isEnabled": True,
        },
    )
    assert created.status_code == 200, created.text
    assert created.json()["buttonLabel"] == "Посмотрите цены тут"
    assert created.json()["inquiryLabel"] == "Запросить"
    slug = created.json()["slug"]
    saved = await client.put(
        f"/api/promotions/{slug}/lines",
        json={
            "publishToCatalog": True,
            "offerNote": "Цены на ящик.",
            "lines": [
                {
                    "kind": "tile",
                    "groupName": "гр. Куртинский полированный 20 мм",
                    "stoneName": "Куртинский",
                    "label": "600×300",
                    "stoneSlug": stone_slug,
                    "finish": "полированный",
                    "lengthMm": 600,
                    "widthMm": 300,
                    "thicknessMm": 20,
                    "priceAmount": "4468",
                    "priceUnit": "m2",
                },
                {
                    "kind": "tile",
                    "groupName": "гр. Куртинский полированный 20 мм",
                    "stoneName": "Куртинский",
                    "label": "300×300",
                    "stoneSlug": stone_slug,
                    "finish": "полированный",
                    "lengthMm": 300,
                    "widthMm": 300,
                    "thicknessMm": 20,
                    "priceAmount": "5080",
                    "priceUnit": "m2",
                },
            ],
        },
    )
    assert saved.status_code == 200, saved.text
    assert saved.json()["publishToCatalog"] is True
    assert len(saved.json()["lines"]) == 2

    listed = await client.get("/api/catalog/products")
    assert listed.status_code == 200, listed.text
    product = next(item for item in listed.json() if "Куртинский" in item["name"])
    assert product["price"] == "от 4 468 ₽/м²"
    assert product["priceType"] == "fixed"
    assert product["tiles"][0]["price"] == "4 468 ₽/м²"
    product_slug = product["slug"]

    expired = await client.patch(
        f"/api/promotions/{slug}", json={"expiresAt": _past()}
    )
    assert expired.status_code == 200, expired.text
    again = await client.get(f"/api/catalog/products/{product_slug}")
    assert again.status_code == 200, again.text
    body = again.json()
    assert body["priceType"] == "on_request"
    assert "price" not in body
    assert "price" not in body["tiles"][0]

    page = await client.get(f"/api/promotions/{slug}")
    assert page.json()["inquiryLabel"] == "Запросить"
    assert page.json()["lines"][0]["priceAmount"] == "4468.00"

    await client.delete(f"/api/catalog/products/{product_slug}")
    await client.delete(f"/api/catalog/stones/{stone_slug}")
