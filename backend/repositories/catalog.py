from __future__ import annotations

import uuid
from collections.abc import Sequence

from sqlalchemy import delete, func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import attributes, selectinload

from models.catalog import (
    BlockItem,
    BlockLot,
    Product,
    ProductItem,
    ProductStone,
    Stone,
)
from models.enums import CustomGroup, MediaOwner, MediaStatus, ProductCategory
from models.lookups import Application, Finish, StoneType
from models.media import Media, MediaLink


def _product_load_options():
    return (
        selectinload(Product.stone).selectinload(Stone.stone_type),
        selectinload(Product.stone_links).selectinload(ProductStone.stone),
        selectinload(Product.items).selectinload(ProductItem.finish),
        selectinload(Product.applications),
    )


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
            .options(*_product_load_options())
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
            .options(*_product_load_options())
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
                Media.status == MediaStatus.READY,
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

    async def get_stone_any(self, slug: str) -> Stone | None:
        result = await self._session.execute(
            select(Stone)
            .where(Stone.slug == slug)
            .options(selectinload(Stone.stone_type))
        )
        return result.scalar_one_or_none()

    async def get_lot_any(self, slug: str) -> BlockLot | None:
        result = await self._session.execute(
            select(BlockLot)
            .where(BlockLot.slug == slug)
            .options(
                selectinload(BlockLot.stone).selectinload(Stone.stone_type),
                selectinload(BlockLot.items).selectinload(BlockItem.finish),
            )
        )
        return result.scalar_one_or_none()

    async def get_product_any(self, slug: str) -> Product | None:
        result = await self._session.execute(
            select(Product)
            .where(Product.slug == slug)
            .options(*_product_load_options())
        )
        return result.scalar_one_or_none()

    async def slug_taken(
        self, model: type, slug: str, *, exclude: uuid.UUID | None
    ) -> bool:
        stmt = select(model.id).where(model.slug == slug, model.deleted_at.is_(None))
        if exclude is not None:
            stmt = stmt.where(model.id != exclude)
        result = await self._session.execute(stmt)
        return result.scalar_one_or_none() is not None

    async def stone_has_dependents(self, stone_id: uuid.UUID) -> bool:
        lots = await self._session.execute(
            select(func.count())
            .select_from(BlockLot)
            .where(BlockLot.stone_id == stone_id, BlockLot.deleted_at.is_(None))
        )
        products = await self._session.execute(
            select(func.count())
            .select_from(Product)
            .where(Product.stone_id == stone_id, Product.deleted_at.is_(None))
        )
        links = await self._session.execute(
            select(func.count())
            .select_from(ProductStone)
            .join(Product, Product.id == ProductStone.product_id)
            .where(
                ProductStone.stone_id == stone_id,
                Product.deleted_at.is_(None),
            )
        )
        return (
            int(lots.scalar_one()) > 0
            or int(products.scalar_one()) > 0
            or int(links.scalar_one()) > 0
        )

    async def stone_ids_with_products(
        self, stone_ids: Sequence[uuid.UUID]
    ) -> set[uuid.UUID]:
        if not stone_ids:
            return set()
        ids = list(stone_ids)
        primary = select(Product.stone_id).where(
            Product.deleted_at.is_(None), Product.stone_id.in_(ids)
        )
        linked = (
            select(ProductStone.stone_id)
            .join(Product, Product.id == ProductStone.product_id)
            .where(Product.deleted_at.is_(None), ProductStone.stone_id.in_(ids))
        )
        result = await self._session.execute(primary.union(linked))
        return set(result.scalars().all())

    async def replace_product_stones(
        self, product: Product, stones: list[Stone]
    ) -> None:
        existing = (
            await self._session.scalars(
                select(ProductStone).where(ProductStone.product_id == product.id)
            )
        ).all()
        for row in existing:
            await self._session.delete(row)
        await self._session.flush()
        attributes.set_committed_value(product, "stone_links", [])
        for index, stone in enumerate(stones):
            product.stone_links.append(
                ProductStone(stone_id=stone.id, stone=stone, sort_order=index)
            )
        product.stone_id = stones[0].id
        product.stone = stones[0]

    async def list_lookups(
        self,
    ) -> tuple[list[StoneType], list[Finish], list[Application]]:
        types = await self._session.execute(
            select(StoneType)
            .where(StoneType.is_active.is_(True))
            .order_by(StoneType.sort_order, StoneType.label)
        )
        finishes = await self._session.execute(
            select(Finish)
            .where(Finish.is_active.is_(True))
            .order_by(Finish.sort_order, Finish.label)
        )
        applications = await self._session.execute(
            select(Application)
            .where(Application.is_active.is_(True))
            .order_by(Application.sort_order, Application.label)
        )
        return (
            list(types.scalars().all()),
            list(finishes.scalars().all()),
            list(applications.scalars().all()),
        )

    async def lookup_by_code(self, model: type, code: str):
        result = await self._session.execute(
            select(model).where(model.code == code, model.is_active.is_(True))
        )
        return result.scalar_one_or_none()

    async def clear_block_items(self, lot_id: uuid.UUID) -> None:
        await self._session.execute(delete(BlockItem).where(BlockItem.lot_id == lot_id))

    async def clear_product_items(self, product_id: uuid.UUID) -> None:
        await self._session.execute(
            delete(ProductItem).where(ProductItem.product_id == product_id)
        )
