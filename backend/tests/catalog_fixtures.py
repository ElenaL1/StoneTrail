from __future__ import annotations

from decimal import Decimal
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from models.catalog import BlockItem, BlockLot, Product, ProductItem, Stone
from models.enums import (
    LotItemStatus,
    MediaOwner,
    PriceType,
    ProductCategory,
    ProductItemKind,
)
from models.lookups import Finish, StoneType
from models.media import Media, MediaLink


async def stone_type_id(session: AsyncSession, code: str = "marble") -> UUID:
    value = await session.scalar(select(StoneType.id).where(StoneType.code == code))
    assert value is not None
    return value


async def finish_id(session: AsyncSession, code: str = "polished") -> UUID:
    value = await session.scalar(select(Finish.id).where(Finish.code == code))
    assert value is not None
    return value


async def add_stone(
    session: AsyncSession,
    *,
    slug: str,
    name: str = "Calacatta Gold",
    type_code: str = "marble",
    quarry: str = "Каррара",
    country: str = "Италия",
    description: str = "Описание сорта",
) -> Stone:
    stone = Stone(
        slug=slug,
        name=name,
        stone_type_id=await stone_type_id(session, type_code),
        quarry=quarry,
        country=country,
        description=description,
    )
    session.add(stone)
    await session.flush()
    return stone


async def add_media(
    session: AsyncSession,
    *,
    owner_type: MediaOwner,
    owner_id: UUID,
    public_url: str,
    is_primary: bool = True,
    sort_order: int = 0,
    storage_key: str | None = None,
) -> Media:
    key = storage_key or f"dev{public_url}"
    media = await session.scalar(select(Media).where(Media.storage_key == key))
    if media is None:
        media = Media(
            storage_key=key,
            public_url=public_url,
            mime_type="image/png",
            size_bytes=1,
            alt="",
        )
        session.add(media)
        await session.flush()
    session.add(
        MediaLink(
            media_id=media.id,
            owner_type=owner_type,
            owner_id=owner_id,
            sort_order=sort_order,
            is_primary=is_primary,
        )
    )
    await session.flush()
    return media


async def add_lot(
    session: AsyncSession,
    stone: Stone,
    *,
    slug: str,
    description: str = "Партия блоков",
    expert_note: str = "Заметка",
) -> BlockLot:
    lot = BlockLot(
        slug=slug,
        stone_id=stone.id,
        description=description,
        expert_note=expert_note,
    )
    session.add(lot)
    await session.flush()
    return lot


async def add_block_item(
    session: AsyncSession,
    lot: BlockLot,
    *,
    label: str,
    status: LotItemStatus = LotItemStatus.IN_STOCK,
    length_mm: int = 2800,
    width_mm: int = 1450,
    height_mm: int = 1250,
    weight_kg: str = "27900",
    sort_order: int = 0,
) -> BlockItem:
    item = BlockItem(
        lot_id=lot.id,
        label=label,
        length_mm=length_mm,
        width_mm=width_mm,
        height_mm=height_mm,
        weight_kg=Decimal(weight_kg),
        status=status,
        sort_order=sort_order,
    )
    session.add(item)
    await session.flush()
    return item


async def add_product(
    session: AsyncSession,
    stone: Stone,
    *,
    slug: str,
    name: str,
    category: ProductCategory,
    description: str = "Описание изделия",
    finish: str | None = "Полированная",
    thickness: str | None = "20 мм",
    size: str | None = "3200 × 1800 мм",
    color: str | None = None,
) -> Product:
    product = Product(
        slug=slug,
        category=category,
        stone_id=stone.id,
        name=name,
        description=description,
        price_type=PriceType.ON_REQUEST,
        finish=finish,
        thickness=thickness,
        size=size,
        color=color,
    )
    session.add(product)
    await session.flush()
    return product


async def add_product_item(
    session: AsyncSession,
    product: Product,
    *,
    kind: ProductItemKind,
    label: str,
    status: LotItemStatus = LotItemStatus.IN_STOCK,
    length_mm: int = 3200,
    width_mm: int = 1800,
    thickness_mm: int = 20,
    finish_code: str = "polished",
    sort_order: int = 0,
    note: str | None = None,
) -> ProductItem:
    item = ProductItem(
        product_id=product.id,
        kind=kind,
        label=label,
        length_mm=length_mm,
        width_mm=width_mm,
        thickness_mm=thickness_mm,
        finish_id=await finish_id(session, finish_code),
        status=status,
        sort_order=sort_order,
        note=note,
    )
    session.add(item)
    await session.flush()
    return item
