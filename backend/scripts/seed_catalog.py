from __future__ import annotations

import argparse
import asyncio
import hashlib
import json
import re
import sys
import unicodedata
from decimal import Decimal
from pathlib import Path
from typing import Any
from uuid import UUID

from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

ROOT = Path(__file__).resolve().parent.parent
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from core.db import SessionLocal  # noqa: E402
from models.catalog import (  # noqa: E402
    BlockItem,
    BlockLot,
    Product,
    ProductItem,
    Stone,
    product_applications,
)
from models.enums import (  # noqa: E402
    CustomGroup,
    FinishedStatus,
    LotItemStatus,
    MediaOwner,
    PriceType,
    ProductCategory,
    ProductItemKind,
)
from models.lookups import Application, Finish, StoneType  # noqa: E402
from models.media import Media, MediaLink  # noqa: E402

DEFAULT_JSON = ROOT / "seeds" / "catalog.json"

STONE_TYPE_CODES = {
    "Мрамор": "marble",
    "Гранит": "granite",
    "Кварцит": "quartzite",
    "Оникс": "onyx",
    "Травертин": "travertine",
    "Известняк": "limestone",
    "Песчаник": "sandstone",
    "Стеатит": "soapstone",
}

FINISH_CODES = {
    "полировка": "polished",
    "полированная": "polished",
    "шлифовка": "honed",
    "шлифованная": "honed",
    "матовая": "matte",
    "сатинированная": "satin",
    "термообработанная": "flamed",
    "пиленая": "sawn",
    "колотая": "split",
    "пилено-колотая": "sawn_split",
    "бучарда": "bush_hammered",
    "лощёная": "leathered",
    "лощеная": "leathered",
}

FINISH_LABELS = {
    "soapstone": ("Стеатит",),
    "matte": ("Матовая",),
    "sawn_split": ("Пилено-колотая",),
}

ITEM_STATUS = {
    "В наличии": LotItemStatus.IN_STOCK,
    "Зарезервирован": LotItemStatus.RESERVED,
    "Под заказ": LotItemStatus.ON_ORDER,
}

CUSTOM_STATUS = {
    "В наличии": FinishedStatus.IN_STOCK,
    "Под заказ": FinishedStatus.ON_ORDER,
    "В работе": FinishedStatus.IN_PROGRESS,
    "Выполнено": FinishedStatus.COMPLETED,
}

KIND_BY_CATEGORY = {
    ProductCategory.SLABS: ProductItemKind.SLAB,
    ProductCategory.BLANKS: ProductItemKind.BLANK,
    ProductCategory.TILES: ProductItemKind.TILE,
    ProductCategory.PAVING: ProductItemKind.PAVING,
}

CYRILLIC_SLUGS = {
    "Габбро-диабаз": "gabbro-diabase",
    "Мансуровский": "mansurovsky",
    "Дагестанский песчаник": "dagestan-sandstone",
}

SLUG_RE = re.compile(r"[^a-z0-9]+")
DIM3_RE = re.compile(r"(\d[\d\s]*)\s*[×x]\s*(\d[\d\s]*)\s*[×x]\s*(\d[\d\s]*)", re.I)
SIZE_RE = re.compile(r"(\d[\d\s]*)\s*[×x]\s*(\d[\d\s]*)", re.I)
THICK_RE = re.compile(r"(\d+)")
WEIGHT_RE = re.compile(r"([\d]+(?:[.,]\d+)?)")


def slugify(value: str) -> str:
    if value in CYRILLIC_SLUGS:
        return CYRILLIC_SLUGS[value]
    normalized = unicodedata.normalize("NFKD", value)
    ascii_text = normalized.encode("ascii", "ignore").decode("ascii").lower()
    slug = SLUG_RE.sub("-", ascii_text).strip("-")
    if slug:
        return slug
    digest = hashlib.sha1(value.encode("utf-8")).hexdigest()[:10]
    return f"stone-{digest}"


def _int_part(raw: str) -> int:
    return int(re.sub(r"\D", "", raw))


def parse_dims3(value: str | None) -> tuple[int | None, int | None, int | None]:
    if not value:
        return None, None, None
    match = DIM3_RE.search(value)
    if not match:
        return None, None, None
    return (
        _int_part(match.group(1)),
        _int_part(match.group(2)),
        _int_part(match.group(3)),
    )


def parse_size(value: str | None) -> tuple[int | None, int | None]:
    if not value:
        return None, None
    match = SIZE_RE.search(value)
    if not match:
        return None, None
    return _int_part(match.group(1)), _int_part(match.group(2))


def parse_thickness(value: str | None) -> int | None:
    if not value:
        return None
    match = THICK_RE.search(value.replace("–", "-").replace("—", "-"))
    if not match:
        return None
    return int(match.group(1))


def parse_weight_kg(value: str | None) -> Decimal | None:
    if not value:
        return None
    match = WEIGHT_RE.search(value.replace(" ", ""))
    if not match:
        return None
    tons = Decimal(match.group(1).replace(",", "."))
    return tons * Decimal(1000)


def storage_key_for(url: str) -> str:
    return "dev" + url.replace("\\", "/")


def mime_for(url: str) -> str:
    lower = url.lower()
    if lower.endswith(".png"):
        return "image/png"
    if lower.endswith(".webp"):
        return "image/webp"
    return "image/jpeg"


def finish_code_for(label: str | None) -> str:
    if not label:
        return "polished"
    return FINISH_CODES.get(label.strip().lower(), "polished")


def split_origin(
    *,
    origin: str | None,
    quarry: str | None,
    country: str | None,
) -> tuple[str, str]:
    if quarry and country:
        return quarry, country
    if origin and "," in origin:
        left, right = origin.rsplit(",", 1)
        return (
            quarry or left.strip() or "не указано",
            country or right.strip() or "не указано",
        )
    return quarry or "не указано", country or "не указано"


async def get_or_create_lookup(
    session: AsyncSession,
    model: type[StoneType] | type[Finish] | type[Application],
    *,
    code: str,
    label: str,
    sort_order: int = 100,
) -> UUID:
    row = await session.scalar(select(model).where(model.code == code))
    if row is None:
        row = model(code=code, label=label, sort_order=sort_order)
        session.add(row)
        await session.flush()
    return row.id


async def finish_id(session: AsyncSession, label: str | None) -> UUID:
    code = finish_code_for(label)
    labels = {
        "polished": "Полированная",
        "honed": "Шлифованная",
        "matte": "Матовая",
        "satin": "Сатинированная",
        "flamed": "Термообработанная",
        "sawn": "Пиленая",
        "split": "Колотая",
        "sawn_split": "Пилено-колотая",
        "bush_hammered": "Бучарда",
        "leathered": "Лощёная",
    }
    return await get_or_create_lookup(
        session, Finish, code=code, label=labels.get(code, label or "Полированная")
    )


async def stone_type_id(session: AsyncSession, label: str) -> UUID:
    code = STONE_TYPE_CODES.get(label, slugify(label).replace("-", "_")[:32] or "other")
    return await get_or_create_lookup(session, StoneType, code=code, label=label)


async def application_id(session: AsyncSession, label: str) -> UUID:
    existing = await session.scalar(
        select(Application).where(Application.label == label)
    )
    if existing is not None:
        return existing.id
    code = (
        slugify(label).replace("-", "_")[:40]
        or hashlib.sha1(label.encode()).hexdigest()[:12]
    )
    return await get_or_create_lookup(session, Application, code=code, label=label)


async def upsert_stone(
    session: AsyncSession,
    *,
    slug: str,
    name: str,
    type_label: str,
    quarry: str,
    country: str,
    description: str,
) -> Stone:
    stone = await session.scalar(
        select(Stone).where(Stone.slug == slug, Stone.deleted_at.is_(None))
    )
    type_id = await stone_type_id(session, type_label)
    if stone is None:
        stone = Stone(
            slug=slug,
            name=name,
            stone_type_id=type_id,
            quarry=quarry,
            country=country,
            description=description,
            canonical_path=f"/catalog/{slug}",
        )
        session.add(stone)
        await session.flush()
        return stone
    stone.name = name
    stone.stone_type_id = type_id
    stone.quarry = quarry
    stone.country = country
    if description:
        stone.description = description
    stone.canonical_path = f"/catalog/{slug}"
    await session.flush()
    return stone


async def upsert_media(session: AsyncSession, url: str) -> Media:
    key = storage_key_for(url)
    media = await session.scalar(select(Media).where(Media.storage_key == key))
    if media is None:
        media = Media(
            storage_key=key,
            public_url=url,
            mime_type=mime_for(url),
            size_bytes=1,
            alt="",
        )
        session.add(media)
        await session.flush()
        return media
    media.public_url = url
    media.mime_type = mime_for(url)
    return media


async def sync_media_links(
    session: AsyncSession,
    *,
    owner_type: MediaOwner,
    owner_id: UUID,
    urls: list[str],
) -> None:
    unique_urls = [url for url in urls if url]
    seen: list[str] = []
    for url in unique_urls:
        if url not in seen:
            seen.append(url)
    wanted_ids: list[UUID] = []
    for index, url in enumerate(seen):
        media = await upsert_media(session, url)
        wanted_ids.append(media.id)
        link = await session.scalar(
            select(MediaLink).where(
                MediaLink.owner_type == owner_type,
                MediaLink.owner_id == owner_id,
                MediaLink.media_id == media.id,
            )
        )
        if link is None:
            link = MediaLink(
                owner_type=owner_type,
                owner_id=owner_id,
                media_id=media.id,
                sort_order=index,
                is_primary=index == 0,
            )
            session.add(link)
        else:
            link.sort_order = index
            link.is_primary = index == 0
    existing = (
        await session.scalars(
            select(MediaLink).where(
                MediaLink.owner_type == owner_type,
                MediaLink.owner_id == owner_id,
            )
        )
    ).all()
    for link in existing:
        if link.media_id not in wanted_ids:
            await session.delete(link)
    await session.flush()


async def sync_block_items(
    session: AsyncSession, lot: BlockLot, items: list[dict[str, Any]]
) -> None:
    keep: set[str] = set()
    for index, raw in enumerate(items):
        label = str(raw["label"])
        keep.add(label)
        length_mm, width_mm, height_mm = parse_dims3(raw.get("dimensions"))
        row = await session.scalar(
            select(BlockItem).where(
                BlockItem.lot_id == lot.id, BlockItem.label == label
            )
        )
        status = ITEM_STATUS.get(
            str(raw.get("status") or "В наличии"), LotItemStatus.IN_STOCK
        )
        if row is None:
            row = BlockItem(lot_id=lot.id, label=label, status=status)
            session.add(row)
        row.length_mm = length_mm
        row.width_mm = width_mm
        row.height_mm = height_mm
        row.weight_kg = parse_weight_kg(raw.get("weight"))
        row.status = status
        row.sort_order = index
        await session.flush()
        image = raw.get("image")
        await sync_media_links(
            session,
            owner_type=MediaOwner.BLOCK_ITEM,
            owner_id=row.id,
            urls=[image] if image else [],
        )
    extras = (
        await session.scalars(
            select(BlockItem).where(
                BlockItem.lot_id == lot.id, BlockItem.label.not_in(keep or {""})
            )
        )
    ).all()
    for extra in extras:
        await session.delete(extra)


async def sync_product_items(
    session: AsyncSession,
    product: Product,
    kind: ProductItemKind,
    items: list[dict[str, Any]],
) -> None:
    keep: set[str] = set()
    for index, raw in enumerate(items):
        label = str(raw["label"])
        keep.add(label)
        length_mm, width_mm = parse_size(raw.get("size"))
        row = await session.scalar(
            select(ProductItem).where(
                ProductItem.product_id == product.id, ProductItem.label == label
            )
        )
        status = ITEM_STATUS.get(
            str(raw.get("status") or "В наличии"), LotItemStatus.IN_STOCK
        )
        if row is None:
            row = ProductItem(
                product_id=product.id,
                kind=kind,
                label=label,
                finish_id=await finish_id(session, raw.get("finish")),
                status=status,
            )
            session.add(row)
        row.kind = kind
        row.length_mm = length_mm
        row.width_mm = width_mm
        row.thickness_mm = parse_thickness(raw.get("thickness"))
        row.finish_id = await finish_id(session, raw.get("finish"))
        row.status = status
        row.note = raw.get("note")
        row.sort_order = index
        await session.flush()
        image = raw.get("image")
        await sync_media_links(
            session,
            owner_type=MediaOwner.PRODUCT_ITEM,
            owner_id=row.id,
            urls=[image] if image else [],
        )
    extras = (
        await session.scalars(
            select(ProductItem).where(
                ProductItem.product_id == product.id,
                ProductItem.label.not_in(keep or {""}),
            )
        )
    ).all()
    for extra in extras:
        await session.delete(extra)


def collect_stones(data: dict[str, Any]) -> dict[str, dict[str, str]]:
    by_name: dict[str, dict[str, str]] = {}
    by_slug: dict[str, dict[str, str]] = {}
    for material in data.get("materials") or []:
        slug = str(material["id"])
        record = {
            "slug": slug,
            "name": str(material["name"]),
            "type": str(material.get("type") or "Мрамор"),
            "quarry": str(material.get("quarry") or "не указано"),
            "country": str(material.get("country") or "не указано"),
            "description": str(material.get("description") or ""),
            "image": str(material.get("image") or ""),
        }
        by_name[record["name"]] = record
        by_slug[slug] = record
    for block in data.get("blocks") or []:
        name = str(block["stoneName"])
        if name in by_name:
            continue
        quarry, country = split_origin(
            origin=None,
            quarry=block.get("quarry"),
            country=block.get("country"),
        )
        slug = slugify(name)
        record = {
            "slug": slug,
            "name": name,
            "type": str(block.get("stoneType") or "Мрамор"),
            "quarry": quarry,
            "country": country,
            "description": "",
            "image": str(block.get("image") or ""),
        }
        by_name[name] = record
        by_slug[slug] = record
    for product in data.get("products") or []:
        name = str(product["stoneName"])
        if name in by_name:
            continue
        quarry, country = split_origin(
            origin=product.get("origin"),
            quarry=product.get("quarry"),
            country=None,
        )
        slug = slugify(name)
        record = {
            "slug": slug,
            "name": name,
            "type": str(product.get("stoneType") or "Мрамор"),
            "quarry": quarry,
            "country": country,
            "description": "",
            "image": str(product.get("stoneImage") or product.get("image") or ""),
        }
        by_name[name] = record
        by_slug[slug] = record
    return by_name


async def seed_catalog_data(session: AsyncSession, data: dict[str, Any]) -> None:
    await get_or_create_lookup(
        session, StoneType, code="soapstone", label="Стеатит", sort_order=8
    )
    await get_or_create_lookup(
        session, Finish, code="matte", label="Матовая", sort_order=9
    )
    await get_or_create_lookup(
        session, Finish, code="sawn_split", label="Пилено-колотая", sort_order=10
    )

    stones_by_name = collect_stones(data)
    stones: dict[str, Stone] = {}
    for record in stones_by_name.values():
        stone = await upsert_stone(
            session,
            slug=record["slug"],
            name=record["name"],
            type_label=record["type"],
            quarry=record["quarry"],
            country=record["country"],
            description=record["description"],
        )
        stones[record["name"]] = stone
        if record["image"]:
            await sync_media_links(
                session,
                owner_type=MediaOwner.STONE,
                owner_id=stone.id,
                urls=[record["image"]],
            )

    keep_lot_slugs: set[str] = set()
    for block in data.get("blocks") or []:
        stone = stones[str(block["stoneName"])]
        slug = str(block.get("slug") or block["id"])
        keep_lot_slugs.add(slug)
        lot = await session.scalar(
            select(BlockLot).where(BlockLot.slug == slug, BlockLot.deleted_at.is_(None))
        )
        if lot is None:
            lot = BlockLot(slug=slug, stone_id=stone.id)
            session.add(lot)
        lot.stone_id = stone.id
        lot.description = str(block.get("description") or "")
        lot.expert_note = str(block.get("expertNote") or "")
        lot.canonical_path = f"/catalog/blocks/{slug}"
        await session.flush()
        await sync_block_items(session, lot, list(block.get("blocks") or []))
        await sync_media_links(
            session,
            owner_type=MediaOwner.BLOCK_LOT,
            owner_id=lot.id,
            urls=[block["image"]] if block.get("image") else [],
        )

    keep_product_slugs: set[str] = set()
    for raw in data.get("products") or []:
        stone = stones[str(raw["stoneName"])]
        slug = str(raw["slug"])
        keep_product_slugs.add(slug)
        category = ProductCategory(str(raw["category"]))
        product = await session.scalar(
            select(Product).where(Product.slug == slug, Product.deleted_at.is_(None))
        )
        price_type = PriceType(str(raw.get("priceType") or "on_request"))
        custom_group = None
        if raw.get("customGroup"):
            custom_group = CustomGroup(str(raw["customGroup"]))
        status = None
        if raw.get("status") in CUSTOM_STATUS:
            status = CUSTOM_STATUS[str(raw["status"])]
        if product is None:
            product = Product(
                slug=slug,
                category=category,
                stone_id=stone.id,
                name=str(raw["name"]),
                description=str(raw.get("description") or " "),
            )
            session.add(product)
        product.category = category
        product.stone_id = stone.id
        product.name = str(raw["name"])
        product.description = str(raw.get("description") or " ")
        product.product_type = raw.get("productType")
        product.custom_group = custom_group
        if category == ProductCategory.CUSTOM:
            product.product_type = raw.get("productType") or "Изделие"
            product.custom_group = custom_group or CustomGroup.INTERIOR
            product.finish = raw.get("finish") or "Полированная"
            product.status = status or FinishedStatus.ON_ORDER
        product.purpose = raw.get("purpose")
        product.price_type = price_type
        if category != ProductCategory.CUSTOM:
            product.finish = raw.get("finish")
            product.status = status
        product.thickness = raw.get("thickness")
        product.size = raw.get("size")
        product.color = raw.get("color")
        product.height = raw.get("height")
        product.diameter = raw.get("diameter")
        product.format = raw.get("format")
        product.dimensions = raw.get("dimensions")
        product.expert_note = raw.get("expertNote")
        product.characteristics = raw.get("characteristics") or {}
        product.canonical_path = f"/catalog/products/{slug}"
        await session.flush()

        kind = KIND_BY_CATEGORY.get(category)
        nested_key = {
            ProductCategory.SLABS: "slabs",
            ProductCategory.BLANKS: "blanks",
            ProductCategory.TILES: "tiles",
            ProductCategory.PAVING: "paving",
        }.get(category)
        if kind is not None and nested_key:
            await sync_product_items(
                session, product, kind, list(raw.get(nested_key) or [])
            )
        else:
            extras = (
                await session.scalars(
                    select(ProductItem).where(ProductItem.product_id == product.id)
                )
            ).all()
            for extra in extras:
                await session.delete(extra)

        urls = list(raw.get("images") or [])
        if raw.get("image") and raw["image"] not in urls:
            urls.insert(0, raw["image"])
        await sync_media_links(
            session,
            owner_type=MediaOwner.PRODUCT,
            owner_id=product.id,
            urls=urls,
        )
        await session.execute(
            delete(product_applications).where(
                product_applications.c.product_id == product.id
            )
        )
        for label in dict.fromkeys(raw.get("applications") or []):
            app_id = await application_id(session, str(label))
            await session.execute(
                product_applications.insert().values(
                    product_id=product.id, application_id=app_id
                )
            )

    await session.flush()


async def seed_from_path(path: Path) -> None:
    payload = json.loads(path.read_text(encoding="utf-8"))
    async with SessionLocal() as session:
        await seed_catalog_data(session, payload)
        await session.commit()


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Idempotent catalog seed from catalog.json"
    )
    parser.add_argument(
        "--file",
        type=Path,
        default=DEFAULT_JSON,
        help="Snapshot JSON (default: seeds/catalog.json)",
    )
    args = parser.parse_args()
    if not args.file.exists():
        raise SystemExit(f"Seed file not found: {args.file}")
    asyncio.run(seed_from_path(args.file))
    print(f"Seeded catalog from {args.file}")


if __name__ == "__main__":
    main()
