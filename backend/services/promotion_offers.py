"""Turn a parsed price sheet into promotion lines and catalog rows.

Catalog cards keep price_type on_request. The active offer only overlays
the price in the public catalog response until the promotion expires.
"""

from __future__ import annotations

import uuid
from decimal import Decimal

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from core import messages
from core.errors import AuthError
from core.slug import slugify
from models.catalog import BlockItem, BlockLot, Product, ProductItem, Stone
from models.content import Promotion, PromotionLine
from models.enums import (
    LotItemStatus,
    PriceType,
    ProductCategory,
    ProductItemKind,
)
from models.lookups import Finish, StoneType
from models.user import User
from repositories.catalog import CatalogRepository
from schemas.feed import (
    OfferPreviewOut,
    PromotionLineIn,
    PromotionLineOut,
    PromotionLinesIn,
)
from services.media_storage import detect_image
from services.offer_sheet import (
    ParsedLine,
    normalize_stone_name,
    parse_offer_sheet,
)

FINISH_CODES = (
    ("полирован", "polished"),
    ("термо", "flamed"),
    ("шлифован", "honed"),
    ("пилен", "sawn"),
    ("колот", "split"),
    ("бучард", "bush_hammered"),
    ("лощен", "leathered"),
    ("матов", "matte"),
)

IMAGE_EXT = {"image/jpeg": "jpg", "image/png": "png", "image/webp": "webp"}
PDF_LIMIT = 15 * 1024 * 1024
IMAGE_LIMIT = 10 * 1024 * 1024

KIND_CATEGORY = {
    "tile": (ProductCategory.TILES, ProductItemKind.TILE),
    "slab": (ProductCategory.SLABS, ProductItemKind.SLAB),
}


class PromotionOfferService:
    def __init__(self, session: AsyncSession, storage) -> None:
        self._session = session
        self._catalog = CatalogRepository(session)
        self._storage = storage

    async def preview(self, data: bytes, filename: str) -> OfferPreviewOut:
        parsed = parse_offer_sheet(data, filename)
        stones = await self._catalog.list_stones()
        by_name = {normalize_stone_name(stone.name): stone for stone in stones}
        lines = [
            _preview_line(row, index, by_name.get(normalize_stone_name(row.stone_name)))
            for index, row in enumerate(parsed.lines)
        ]
        return OfferPreviewOut(offer_note=parsed.offer_note, lines=lines)

    async def replace(
        self, promotion: Promotion, payload: PromotionLinesIn, actor: User
    ) -> None:
        old = list(
            await self._session.scalars(
                select(PromotionLine)
                .where(PromotionLine.promotion_id == promotion.id)
                .order_by(PromotionLine.sort_order)
            )
        )
        products_by_group = {
            row.group_name: row.catalog_product_id
            for row in old
            if row.catalog_product_id is not None
        }
        lots_by_group = {
            row.group_name: row.catalog_block_lot_id
            for row in old
            if row.catalog_block_lot_id is not None
        }
        for row in old:
            await self._session.delete(row)
        await self._session.flush()

        promotion.offer_note = payload.offer_note.strip()
        promotion.publish_to_catalog = payload.publish_to_catalog
        promotion.updated_by = actor.id
        created: dict[str, Stone] = {}
        rows: list[PromotionLine] = []
        for index, item in enumerate(payload.lines):
            stone = await self._stone(item, actor, created)
            row = PromotionLine(
                promotion_id=promotion.id,
                kind=item.kind,
                group_name=item.group_name.strip() or item.label.strip(),
                stone_name=item.stone_name.strip(),
                label=item.label.strip() or "Позиция",
                stone_id=stone.id if stone is not None else None,
                finish=_blank(item.finish),
                length_mm=item.length_mm,
                width_mm=item.width_mm,
                thickness_mm=item.thickness_mm,
                height_mm=item.height_mm,
                weight_kg=item.weight_kg,
                area_m2=item.area_m2,
                price_amount=item.price_amount,
                price_unit=item.price_unit,
                unresolved=item.unresolved,
                sort_order=index,
            )
            self._session.add(row)
            rows.append(row)
        if payload.publish_to_catalog:
            await self._publish(
                promotion, rows, products_by_group, lots_by_group, actor
            )
        await self._session.commit()

    async def attach_sheet(
        self, promotion: Promotion, data: bytes, content_type: str, filename: str
    ) -> None:
        declared = content_type.split(";")[0].strip().lower()
        if declared == "application/pdf" or filename.lower().endswith(".pdf"):
            if not data.startswith(b"%PDF") or len(data) > PDF_LIMIT or len(data) == 0:
                raise AuthError.validation(
                    messages.MEDIA_TYPE_INVALID,
                    {"file": messages.MEDIA_TYPE_INVALID},
                )
            ext = "pdf"
            stored_type = "application/pdf"
            field = "sheet_pdf_url"
        else:
            detected = detect_image(data)
            if (
                detected is None
                or detected not in IMAGE_EXT
                or len(data) > IMAGE_LIMIT
                or len(data) == 0
            ):
                raise AuthError.validation(
                    messages.MEDIA_TYPE_INVALID,
                    {"file": messages.MEDIA_TYPE_INVALID},
                )
            ext = IMAGE_EXT[detected]
            stored_type = detected
            field = "sheet_image_url"
        key = f"promotions/{promotion.id}/{uuid.uuid4()}.{ext}"
        self._storage.put(key, data, stored_type)
        setattr(promotion, field, self._storage.public_url(key))
        await self._session.commit()

    async def _stone(
        self,
        item: PromotionLineIn,
        actor: User,
        created: dict[str, Stone],
    ) -> Stone | None:
        if item.stone_slug:
            stone = await self._catalog.get_stone_by_slug(item.stone_slug.strip())
            if stone is None:
                raise AuthError.validation(
                    messages.LOOKUP_INVALID, {"stoneSlug": messages.LOOKUP_INVALID}
                )
            return stone
        key = normalize_stone_name(item.stone_name)
        if not key:
            return None
        if key in created:
            return created[key]
        if item.create_stone is None:
            return None
        quarry = item.create_stone.quarry.strip()
        country = item.create_stone.country.strip()
        if not quarry or not country:
            raise AuthError.validation(
                messages.TITLE_REQUIRED, {"quarry": "Укажите карьер и страну."}
            )
        stone_type = await self._catalog.lookup_by_code(
            StoneType, item.create_stone.stone_type_code
        )
        if stone_type is None:
            raise AuthError.validation(
                messages.LOOKUP_INVALID, {"stoneTypeCode": messages.LOOKUP_INVALID}
            )
        stone = Stone(
            slug=await self._fresh_slug(Stone, item.stone_name, "stone"),
            name=item.stone_name.strip(),
            stone_type_id=stone_type.id,
            quarry=quarry,
            country=country,
            description="",
            updated_by=actor.id,
        )
        stone.canonical_path = f"/catalog/{stone.slug}"
        self._session.add(stone)
        await self._session.flush()
        created[key] = stone
        return stone

    async def _publish(
        self,
        promotion: Promotion,
        rows: list[PromotionLine],
        products_by_group: dict[str, uuid.UUID],
        lots_by_group: dict[str, uuid.UUID],
        actor: User,
    ) -> None:
        finishes = {
            row.code: row for row in await self._session.scalars(select(Finish))
        }
        grouped: dict[tuple[str, str], list[PromotionLine]] = {}
        for row in rows:
            if row.unresolved or row.stone_id is None:
                continue
            grouped.setdefault((row.kind, row.group_name), []).append(row)
        for (kind, group_name), group in grouped.items():
            if kind == "block":
                await self._publish_blocks(
                    promotion, group_name, group, lots_by_group, actor
                )
            elif kind in KIND_CATEGORY:
                await self._publish_product(
                    promotion,
                    kind,
                    group_name,
                    group,
                    products_by_group,
                    finishes,
                    actor,
                )

    async def _matching_products(
        self, stone_id: uuid.UUID, category: ProductCategory
    ) -> list[Product]:
        products = await self._catalog.living_products_for_stones([stone_id])
        return sorted(
            (row for row in products if row.category == category),
            key=lambda row: row.slug,
        )

    async def _matching_lots(self, stone_id: uuid.UUID) -> list[BlockLot]:
        lots = await self._catalog.living_lots_for_stones([stone_id])
        return sorted(lots, key=lambda row: row.slug)

    async def _publish_product(
        self,
        promotion: Promotion,
        kind: str,
        group_name: str,
        rows: list[PromotionLine],
        reused: dict[str, uuid.UUID],
        finishes: dict[str, Finish],
        actor: User,
    ) -> None:
        finish = _finish_row(rows[0].finish, finishes)
        if finish is None:
            raise AuthError.validation(
                messages.LOOKUP_INVALID, {"finish": messages.LOOKUP_INVALID}
            )
        category, item_kind = KIND_CATEGORY[kind]
        stone = await self._session.get(Stone, rows[0].stone_id)
        if stone is None:
            return
        product = await self._product_for_group(
            promotion, group_name, category, stone, reused, rows[0], actor
        )
        await self._bind_product_rows(product, rows, item_kind, finish, actor)

    async def _product_for_group(
        self,
        promotion: Promotion,
        group_name: str,
        category: ProductCategory,
        stone: Stone,
        reused: dict[str, uuid.UUID],
        sample: PromotionLine,
        actor: User,
    ) -> Product:
        existing_id = reused.get(group_name)
        owned = (
            await self._session.get(Product, existing_id)
            if existing_id is not None
            else None
        )
        if (
            owned is not None
            and owned.category == category
            and owned.stone_id == stone.id
        ):
            if owned.deleted_at is not None:
                owned.deleted_at = None
                owned.updated_by = actor.id
            return owned
        matches = await self._matching_products(stone.id, category)
        if matches:
            return matches[0]
        product = Product(
            slug=await self._fresh_slug(Product, group_name, "product"),
            category=category,
            stone_id=stone.id,
            name=group_name,
            description=_description(promotion),
            price_type=PriceType.ON_REQUEST,
            currency="RUB",
            characteristics={},
            finish=sample.finish,
            thickness=(f"{sample.thickness_mm} мм" if sample.thickness_mm else None),
            updated_by=actor.id,
        )
        product.canonical_path = f"/catalog/products/{product.slug}"
        self._session.add(product)
        await self._session.flush()
        await self._catalog.replace_product_stones(product, [stone])
        return product

    async def _bind_product_rows(
        self,
        product: Product,
        rows: list[PromotionLine],
        item_kind: ProductItemKind,
        finish: Finish,
        actor: User,
    ) -> None:
        items = list(
            await self._session.scalars(
                select(ProductItem).where(ProductItem.product_id == product.id)
            )
        )
        by_label = {item.label: item for item in items}
        taken = set(by_label)
        claimed: set[str] = set()
        order = max((item.sort_order for item in items), default=-1) + 1
        for row in rows:
            raw = row.label.strip() or "Позиция"
            item = by_label.get(raw) if raw not in claimed else None
            if item is None:
                label = _unique_label(raw, taken)
                item = ProductItem(
                    product_id=product.id,
                    kind=item_kind,
                    label=label,
                    length_mm=row.length_mm,
                    width_mm=row.width_mm,
                    thickness_mm=row.thickness_mm,
                    weight_kg=row.weight_kg,
                    finish_id=finish.id,
                    status=LotItemStatus.IN_STOCK,
                    note=_area_note(row.area_m2),
                    sort_order=order,
                    updated_by=actor.id,
                )
                order += 1
                self._session.add(item)
                await self._session.flush()
                by_label[label] = item
                row.label = label
                claimed.add(label)
            else:
                row.label = item.label
                claimed.add(item.label)
            row.catalog_product_id = product.id
            row.catalog_product_item_id = item.id

    async def _publish_blocks(
        self,
        promotion: Promotion,
        group_name: str,
        rows: list[PromotionLine],
        reused: dict[str, uuid.UUID],
        actor: User,
    ) -> None:
        stone = await self._session.get(Stone, rows[0].stone_id)
        if stone is None:
            return
        lot = await self._lot_for_group(promotion, group_name, stone, reused, actor)
        await self._bind_block_rows(lot, rows, actor)

    async def _lot_for_group(
        self,
        promotion: Promotion,
        group_name: str,
        stone: Stone,
        reused: dict[str, uuid.UUID],
        actor: User,
    ) -> BlockLot:
        existing_id = reused.get(group_name)
        owned = (
            await self._session.get(BlockLot, existing_id)
            if existing_id is not None
            else None
        )
        if owned is not None and owned.stone_id == stone.id:
            if owned.deleted_at is not None:
                owned.deleted_at = None
                owned.updated_by = actor.id
            return owned
        matches = await self._matching_lots(stone.id)
        if matches:
            return matches[0]
        lot = BlockLot(
            slug=await self._fresh_slug(BlockLot, group_name, "lot"),
            stone_id=stone.id,
            description=_description(promotion),
            expert_note="",
            updated_by=actor.id,
        )
        lot.canonical_path = f"/catalog/blocks/{lot.slug}"
        self._session.add(lot)
        await self._session.flush()
        return lot

    async def _bind_block_rows(
        self, lot: BlockLot, rows: list[PromotionLine], actor: User
    ) -> None:
        items = list(
            await self._session.scalars(
                select(BlockItem).where(BlockItem.lot_id == lot.id)
            )
        )
        by_label = {item.label: item for item in items}
        taken = set(by_label)
        claimed: set[str] = set()
        order = max((item.sort_order for item in items), default=-1) + 1
        for row in rows:
            raw = row.label.strip() or "Позиция"
            item = by_label.get(raw) if raw not in claimed else None
            if item is None:
                label = _unique_label(raw, taken)
                item = BlockItem(
                    lot_id=lot.id,
                    label=label,
                    length_mm=row.length_mm,
                    width_mm=row.width_mm,
                    height_mm=row.height_mm,
                    weight_kg=row.weight_kg,
                    status=LotItemStatus.IN_STOCK,
                    sort_order=order,
                    updated_by=actor.id,
                )
                order += 1
                self._session.add(item)
                await self._session.flush()
                by_label[label] = item
                row.label = label
                claimed.add(label)
            else:
                row.label = item.label
                claimed.add(item.label)
            row.catalog_block_lot_id = lot.id
            row.catalog_block_item_id = item.id

    async def _fresh_slug(self, model: type, source: str, fallback: str) -> str:
        base = slugify(source, fallback=fallback)
        candidate = base
        index = 2
        while await self._catalog.slug_taken(model, candidate, exclude=None):
            candidate = f"{base}-{index}"
            index += 1
        return candidate


def _preview_line(row: ParsedLine, index: int, stone: Stone | None) -> PromotionLineOut:
    return PromotionLineOut(
        kind=row.kind or "tile",
        group_name=row.group_name,
        stone_name=row.stone_name,
        label=row.label,
        stone_slug=stone.slug if stone is not None else None,
        finish=row.finish,
        length_mm=row.length_mm,
        width_mm=row.width_mm,
        thickness_mm=row.thickness_mm,
        height_mm=row.height_mm,
        weight_kg=row.weight_kg,
        area_m2=row.area_m2,
        price_amount=row.price_amount,
        price_unit=row.price_unit,  # type: ignore[arg-type]
        unresolved=row.unresolved or row.kind is None,
        issue=row.issue,
        sort_order=index,
    )


def _finish_row(label: str | None, finishes: dict[str, Finish]) -> Finish | None:
    if not finishes:
        return None
    if label:
        lowered = label.lower().replace("ё", "е")
        for stem, code in FINISH_CODES:
            if stem in lowered and code in finishes:
                return finishes[code]
    if "polished" in finishes:
        return finishes["polished"]
    return next(iter(finishes.values()))


def _description(promotion: Promotion) -> str:
    note = promotion.offer_note.strip()
    if note:
        return note
    return f"Акционное предложение «{promotion.title}»."


def _area_note(area: Decimal | None) -> str | None:
    if area is None:
        return None
    text = format(area, "f").rstrip("0").rstrip(".")
    return f"{text.replace('.', ',')} м²"


def _unique_label(label: str, used: set[str]) -> str:
    base = label.strip() or "Позиция"
    if base not in used:
        used.add(base)
        return base
    index = 2
    while f"{base} · {index}" in used:
        index += 1
    unique = f"{base} · {index}"
    used.add(unique)
    return unique


def _blank(value: str | None) -> str | None:
    if value is None:
        return None
    trimmed = value.strip()
    return trimmed or None
