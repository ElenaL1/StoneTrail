from __future__ import annotations

import uuid
from collections.abc import Sequence

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from models.catalog import BlockItem, BlockLot, Product, ProductItem, Stone
from models.enums import CustomGroup, MediaOwner, ProductCategory
from models.media import Media, MediaLink


class CatalogRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    def _apply_page(self, stmt, *, limit: int | None, offset: int):
        stmt = stmt.offset(offset)
        if limit is not None:
            stmt = stmt.limit(limit)
        return stmt

    async def list_stones(
        self, *, limit: int | None = None, offset: int = 0
    ) -> list[Stone]:
        stmt = (
            select(Stone)
            .where(Stone.deleted_at.is_(None))
            .options(selectinload(Stone.stone_type))
            .order_by(Stone.name, Stone.slug)
        )
        result = await self._session.execute(
            self._apply_page(stmt, limit=limit, offset=offset)
        )
        return list(result.scalars().unique().all())

    async def get_stone_by_slug(self, slug: str) -> Stone | None:
        stmt = (
            select(Stone)
            .where(Stone.slug == slug, Stone.deleted_at.is_(None))
            .options(selectinload(Stone.stone_type))
        )
        result = await self._session.execute(stmt)
        return result.scalar_one_or_none()

    async def list_lots(
        self, *, limit: int | None = None, offset: int = 0
    ) -> list[BlockLot]:
        stmt = (
            select(BlockLot)
            .where(BlockLot.deleted_at.is_(None))
            .options(
                selectinload(BlockLot.stone).selectinload(Stone.stone_type),
                selectinload(BlockLot.items).selectinload(BlockItem.finish),
            )
            .order_by(BlockLot.slug)
        )
        result = await self._session.execute(
            self._apply_page(stmt, limit=limit, offset=offset)
        )
        return list(result.scalars().unique().all())

    async def get_lot_by_slug(self, slug: str) -> BlockLot | None:
        stmt = (
            select(BlockLot)
            .where(BlockLot.slug == slug, BlockLot.deleted_at.is_(None))
            .options(
                selectinload(BlockLot.stone).selectinload(Stone.stone_type),
                selectinload(BlockLot.items).selectinload(BlockItem.finish),
            )
        )
        result = await self._session.execute(stmt)
        return result.scalar_one_or_none()

    async def list_products(
        self,
        *,
        category: ProductCategory | None = None,
        group: CustomGroup | None = None,
        limit: int | None = None,
        offset: int = 0,
    ) -> list[Product]:
        stmt = (
            select(Product)
            .where(Product.deleted_at.is_(None))
            .options(
                selectinload(Product.stone).selectinload(Stone.stone_type),
                selectinload(Product.items).selectinload(ProductItem.finish),
                selectinload(Product.applications),
            )
            .order_by(Product.name, Product.slug)
        )
        if category is not None:
            stmt = stmt.where(Product.category == category)
        if group is not None:
            stmt = stmt.where(Product.custom_group == group)
        result = await self._session.execute(
            self._apply_page(stmt, limit=limit, offset=offset)
        )
        return list(result.scalars().unique().all())

    async def get_product_by_slug(self, slug: str) -> Product | None:
        stmt = (
            select(Product)
            .where(Product.slug == slug, Product.deleted_at.is_(None))
            .options(
                selectinload(Product.stone).selectinload(Stone.stone_type),
                selectinload(Product.items).selectinload(ProductItem.finish),
                selectinload(Product.applications),
            )
        )
        result = await self._session.execute(stmt)
        return result.scalar_one_or_none()

    async def living_products_for_stones(
        self, stone_ids: Sequence[uuid.UUID]
    ) -> list[Product]:
        if not stone_ids:
            return []
        stmt = (
            select(Product)
            .where(Product.deleted_at.is_(None), Product.stone_id.in_(stone_ids))
            .options(
                selectinload(Product.items).selectinload(ProductItem.finish),
            )
        )
        result = await self._session.execute(stmt)
        return list(result.scalars().unique().all())

    async def living_lots_for_stones(
        self, stone_ids: Sequence[uuid.UUID]
    ) -> list[BlockLot]:
        if not stone_ids:
            return []
        stmt = (
            select(BlockLot)
            .where(BlockLot.deleted_at.is_(None), BlockLot.stone_id.in_(stone_ids))
            .options(selectinload(BlockLot.items))
            .order_by(BlockLot.slug)
        )
        result = await self._session.execute(stmt)
        return list(result.scalars().unique().all())

    async def media_for(
        self, owner_type: MediaOwner, owner_ids: Sequence[uuid.UUID]
    ) -> dict[uuid.UUID, tuple[str, list[str]]]:
        if not owner_ids:
            return {}
        stmt = (
            select(MediaLink, Media)
            .join(Media, Media.id == MediaLink.media_id)
            .where(
                MediaLink.owner_type == owner_type,
                MediaLink.owner_id.in_(list(owner_ids)),
            )
            .order_by(MediaLink.sort_order.asc(), MediaLink.id.asc())
        )
        result = await self._session.execute(stmt)
        gallery: dict[uuid.UUID, list[str]] = {}
        primary: dict[uuid.UUID, str] = {}
        for link, media in result.all():
            urls = gallery.setdefault(link.owner_id, [])
            if media.public_url not in urls:
                urls.append(media.public_url)
            if link.is_primary:
                primary[link.owner_id] = media.public_url
        packed: dict[uuid.UUID, tuple[str, list[str]]] = {}
        for owner_id, urls in gallery.items():
            cover = primary.get(owner_id) or (urls[0] if urls else "")
            packed[owner_id] = (cover, urls)
        return packed
