from __future__ import annotations

from collections import defaultdict
from collections.abc import Iterable
from decimal import Decimal
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from core.errors import ApiError
from models.catalog import BlockItem, BlockLot, Product, ProductItem, Stone
from models.enums import (
    CustomGroup,
    FinishedStatus,
    LotItemStatus,
    MediaOwner,
    PriceType,
    ProductCategory,
    ProductItemKind,
)
from repositories.catalog import CatalogRepository
from schemas.catalog import LotItemOut, MaterialOut, ProductOut, StoneBlockOut

SUPPLIER = "StoneTrail"
LOCATION = "склад"
LOW_STOCK_MAX = 3

LOT_STATUS_LABEL = {
    LotItemStatus.IN_STOCK: "В наличии",
    LotItemStatus.RESERVED: "Зарезервирован",
    LotItemStatus.ON_ORDER: "Под заказ",
}

FINISHED_STATUS_LABEL = {
    FinishedStatus.IN_STOCK: "В наличии",
    FinishedStatus.ON_ORDER: "Под заказ",
    FinishedStatus.IN_PROGRESS: "В работе",
    FinishedStatus.COMPLETED: "Выполнено",
}

ITEM_KIND_BY_CATEGORY = {
    ProductCategory.SLABS: ProductItemKind.SLAB,
    ProductCategory.BLANKS: ProductItemKind.BLANK,
    ProductCategory.TILES: ProductItemKind.TILE,
    ProductCategory.PAVING: ProductItemKind.PAVING,
}

SUMMARY_KINDS = {
    ProductItemKind.SLAB,
    ProductItemKind.TILE,
    ProductItemKind.BLANK,
}


def _cover(media: dict[UUID, tuple[str, list[str]]], owner_id: UUID) -> str:
    pair = media.get(owner_id)
    return pair[0] if pair else ""


def _gallery(media: dict[UUID, tuple[str, list[str]]], owner_id: UUID) -> list[str]:
    pair = media.get(owner_id)
    return list(pair[1]) if pair else []


def _item_image(media: dict[UUID, tuple[str, list[str]]], owner_id: UUID) -> str | None:
    url = _cover(media, owner_id)
    return url or None


def _format_block_dims(item: BlockItem) -> str:
    parts = [item.length_mm, item.width_mm, item.height_mm]
    if any(part is None for part in parts):
        return ""
    formatted = [f"{int(part):,}".replace(",", " ") for part in parts]
    return f"{formatted[0]} × {formatted[1]} × {formatted[2]} мм"


def _format_weight(weight_kg: Decimal | None) -> str:
    if weight_kg is None:
        return ""
    tons = Decimal(weight_kg) / Decimal(1000)
    text = f"{tons:.1f}".replace(".", ",")
    return f"~{text} т"


def _format_size(length_mm: int | None, width_mm: int | None) -> str:
    if length_mm is None or width_mm is None:
        return ""
    return f"{length_mm} × {width_mm} мм"


def _format_thickness(mm: int | None) -> str:
    if mm is None:
        return ""
    return f"{mm} мм"


def _thickness_summary(values: Iterable[int]) -> str:
    unique = sorted(set(values))
    if not unique:
        return ""
    if unique[0] == unique[-1]:
        return f"{unique[0]} мм"
    return f"{unique[0]}–{unique[-1]} мм"


def _finish_summary(pairs: list[tuple[int, str]]) -> str:
    seen: dict[str, int] = {}
    for order, label in pairs:
        if label and label not in seen:
            seen[label] = order
    ordered = sorted(seen.items(), key=lambda item: (item[1], item[0]))
    return " / ".join(label for label, _ in ordered)


def _stone_status(in_stock: int) -> str:
    if in_stock <= 0:
        return "Продано"
    if in_stock <= LOW_STOCK_MAX:
        return "Мало"
    return "В наличии"


def _sorted_items(items: Iterable[BlockItem | ProductItem]) -> list:
    return sorted(items, key=lambda item: (item.sort_order, item.label, str(item.id)))


def _availability(items: list[ProductItem]) -> str | None:
    if not items:
        return None
    in_stock = sum(1 for item in items if item.status == LotItemStatus.IN_STOCK)
    on_order = sum(1 for item in items if item.status == LotItemStatus.ON_ORDER)
    if in_stock == 0 and on_order == len(items):
        return "Под заказ"
    if in_stock == 0:
        return "Мало"
    if in_stock <= LOW_STOCK_MAX:
        return "Мало"
    return "В наличии"


def _format_price(product: Product) -> str | None:
    if product.price_type != PriceType.FIXED or product.amount is None:
        return None
    amount = Decimal(product.amount)
    if amount == amount.to_integral():
        return f"{int(amount)} ₽"
    return f"{amount:.2f} ₽".replace(".", ",")


def _origin(stone: Stone) -> str:
    return f"{stone.quarry}, {stone.country}"


def _block_item_out(
    item: BlockItem, media: dict[UUID, tuple[str, list[str]]]
) -> LotItemOut:
    return LotItemOut(
        label=item.label,
        status=LOT_STATUS_LABEL[item.status],
        image=_item_image(media, item.id),
        dimensions=_format_block_dims(item) or None,
        weight=_format_weight(item.weight_kg) or None,
    )


def _product_item_out(
    item: ProductItem, media: dict[UUID, tuple[str, list[str]]]
) -> LotItemOut:
    return LotItemOut(
        label=item.label,
        status=LOT_STATUS_LABEL[item.status],
        image=_item_image(media, item.id),
        note=item.note,
        size=_format_size(item.length_mm, item.width_mm) or None,
        thickness=_format_thickness(item.thickness_mm) or None,
        finish=item.finish.label if item.finish is not None else None,
    )


class CatalogService:
    def __init__(self, session: AsyncSession) -> None:
        self._repo = CatalogRepository(session)

    async def list_stones(self) -> list[MaterialOut]:
        stones = await self._repo.list_stones()
        return await self._materials(stones)

    async def get_stone(self, slug: str) -> MaterialOut:
        stone = await self._repo.get_stone_by_slug(slug)
        if stone is None:
            raise ApiError.not_found()
        materials = await self._materials([stone])
        return materials[0]

    async def list_blocks(self) -> list[StoneBlockOut]:
        lots = await self._repo.list_lots()
        return await self._blocks(lots)

    async def get_block(self, slug: str) -> StoneBlockOut:
        lot = await self._repo.get_lot_by_slug(slug)
        if lot is None:
            raise ApiError.not_found()
        blocks = await self._blocks([lot])
        return blocks[0]

    async def list_products(
        self, *, category: str | None = None, group: str | None = None
    ) -> list[ProductOut]:
        parsed_category = self._parse_category(category)
        parsed_group = self._parse_group(group)
        if category is not None and parsed_category is None:
            return []
        if group is not None and parsed_group is None:
            return []
        products = await self._repo.list_products(
            category=parsed_category, group=parsed_group
        )
        return await self._products(products)

    async def get_product(self, slug: str) -> ProductOut:
        product = await self._repo.get_product_by_slug(slug)
        if product is None:
            raise ApiError.not_found()
        products = await self._products([product])
        return products[0]

    def _parse_category(self, value: str | None) -> ProductCategory | None:
        if value is None:
            return None
        try:
            return ProductCategory(value)
        except ValueError:
            return None

    def _parse_group(self, value: str | None) -> CustomGroup | None:
        if value is None:
            return None
        try:
            return CustomGroup(value)
        except ValueError:
            return None

    async def _materials(self, stones: list[Stone]) -> list[MaterialOut]:
        stone_ids = [stone.id for stone in stones]
        products = await self._repo.living_products_for_stones(stone_ids)
        lots = await self._repo.living_lots_for_stones(stone_ids)
        media = await self._repo.media_for(MediaOwner.STONE, stone_ids)

        products_by_stone: dict[UUID, list[Product]] = defaultdict(list)
        for product in products:
            products_by_stone[product.stone_id].append(product)
        lots_by_stone: dict[UUID, list[BlockLot]] = defaultdict(list)
        for lot in lots:
            lots_by_stone[lot.stone_id].append(lot)

        out: list[MaterialOut] = []
        for stone in stones:
            related = products_by_stone.get(stone.id, [])
            related_lots = lots_by_stone.get(stone.id, [])
            items = [item for product in related for item in product.items]
            block_items = [item for lot in related_lots for item in lot.items]
            slabs = sum(1 for item in items if item.kind == ProductItemKind.SLAB)
            tiles = sum(1 for item in items if item.kind == ProductItemKind.TILE)
            in_stock = sum(
                1
                for item in items
                if item.status == LotItemStatus.IN_STOCK
                and item.kind in {ProductItemKind.SLAB, ProductItemKind.TILE}
            ) + sum(1 for item in block_items if item.status == LotItemStatus.IN_STOCK)
            summary_items = [item for item in items if item.kind in SUMMARY_KINDS]
            thickness = _thickness_summary(
                item.thickness_mm
                for item in summary_items
                if item.thickness_mm is not None
            )
            finish = _finish_summary(
                [
                    (item.finish.sort_order, item.finish.label)
                    for item in summary_items
                    if item.finish is not None
                ]
            )
            block_slug = related_lots[0].slug if related_lots else None
            out.append(
                MaterialOut(
                    id=stone.slug,
                    name=stone.name,
                    type=stone.stone_type.label,
                    finish=finish,
                    thickness=thickness,
                    image=_cover(media, stone.id),
                    supplier=SUPPLIER,
                    location=LOCATION,
                    quarry=stone.quarry,
                    country=stone.country,
                    status=_stone_status(in_stock),
                    slabs=slabs,
                    tiles=tiles,
                    updated=stone.updated_at.isoformat(),
                    block_slug=block_slug,
                )
            )
        return out

    async def _blocks(self, lots: list[BlockLot]) -> list[StoneBlockOut]:
        item_ids = [item.id for lot in lots for item in lot.items]
        lot_ids = [lot.id for lot in lots]
        lot_media = await self._repo.media_for(MediaOwner.BLOCK_LOT, lot_ids)
        item_media = await self._repo.media_for(MediaOwner.BLOCK_ITEM, item_ids)
        out: list[StoneBlockOut] = []
        for lot in lots:
            items = [
                _block_item_out(item, item_media) for item in _sorted_items(lot.items)
            ]
            out.append(
                StoneBlockOut(
                    id=lot.slug,
                    slug=lot.slug,
                    stone_name=lot.stone.name,
                    stone_type=lot.stone.stone_type.label,
                    quarry=lot.stone.quarry,
                    country=lot.stone.country,
                    blocks=items,
                    image=_cover(lot_media, lot.id),
                    description=lot.description,
                    expert_note=lot.expert_note,
                    block_stone_id=lot.stone.slug,
                )
            )
        return out

    async def _products(self, products: list[Product]) -> list[ProductOut]:
        product_ids = [product.id for product in products]
        item_ids = [item.id for product in products for item in product.items]
        stone_ids = list({product.stone_id for product in products})
        product_media = await self._repo.media_for(MediaOwner.PRODUCT, product_ids)
        item_media = await self._repo.media_for(MediaOwner.PRODUCT_ITEM, item_ids)
        stone_media = await self._repo.media_for(MediaOwner.STONE, stone_ids)
        out: list[ProductOut] = []
        for product in products:
            items = _sorted_items(product.items)
            kind = ITEM_KIND_BY_CATEGORY.get(product.category)
            typed_items = [item for item in items if kind is None or item.kind == kind]
            lot_out = [_product_item_out(item, item_media) for item in typed_items]
            images = _gallery(product_media, product.id)
            characteristics = {
                str(key): str(value)
                for key, value in (product.characteristics or {}).items()
            }
            payload = ProductOut(
                id=product.slug,
                slug=product.slug,
                category=product.category.value,
                name=product.name,
                stone_name=product.stone.name,
                stone_type=product.stone.stone_type.label,
                description=product.description,
                image=_cover(product_media, product.id),
                product_type=product.product_type,
                custom_group=(
                    product.custom_group.value if product.custom_group else None
                ),
                origin=_origin(product.stone),
                quarry=product.stone.quarry,
                purpose=product.purpose,
                price=_format_price(product),
                price_type=product.price_type.value,
                images=images or None,
                characteristics=characteristics or None,
                applications=[app.label for app in product.applications] or None,
                height=product.height,
                diameter=product.diameter,
                format=product.format,
                color=product.color,
                thickness=product.thickness,
                finish=product.finish,
                size=product.size,
                availability=_availability(typed_items),
                status=(
                    FINISHED_STATUS_LABEL[product.status]
                    if product.status is not None
                    else None
                ),
                stone_image=_cover(stone_media, product.stone_id) or None,
                expert_note=product.expert_note,
                dimensions=product.dimensions,
            )
            if product.category == ProductCategory.SLABS:
                payload.slabs = lot_out
                if payload.availability is None:
                    payload.availability = "В наличии"
            elif product.category == ProductCategory.BLANKS:
                payload.blanks = lot_out
            elif product.category == ProductCategory.TILES:
                payload.tiles = lot_out
            elif product.category == ProductCategory.PAVING:
                payload.paving = lot_out
            if (
                product.category != ProductCategory.CUSTOM
                and payload.availability is None
            ):
                payload.availability = "Под заказ"
            if product.category == ProductCategory.CUSTOM and payload.status:
                payload.availability = (
                    payload.status
                    if payload.status in {"В наличии", "Под заказ"}
                    else payload.availability
                )
            out.append(payload)
        return out
