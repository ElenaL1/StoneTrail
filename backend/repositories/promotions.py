from __future__ import annotations

import uuid
from collections.abc import Sequence
from datetime import datetime

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from models.content import Promotion, PromotionLike


class PromotionRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    def add(self, item: Promotion) -> None:
        self._session.add(item)

    async def list_enabled(self) -> list[Promotion]:
        result = await self._session.scalars(
            select(Promotion)
            .where(Promotion.deleted_at.is_(None), Promotion.is_enabled.is_(True))
            .order_by(Promotion.created_at.desc())
        )
        return list(result.all())

    async def list_active(self, now: datetime) -> list[Promotion]:
        result = await self._session.scalars(
            select(Promotion)
            .where(
                Promotion.deleted_at.is_(None),
                Promotion.is_enabled.is_(True),
                Promotion.expires_at > now,
            )
            .order_by(Promotion.created_at.desc())
        )
        return list(result.all())

    async def list_managed(self, *, deleted: bool) -> list[Promotion]:
        stmt = select(Promotion)
        if deleted:
            stmt = stmt.where(Promotion.deleted_at.is_not(None))
        else:
            stmt = stmt.where(Promotion.deleted_at.is_(None))
        result = await self._session.scalars(stmt.order_by(Promotion.updated_at.desc()))
        return list(result.all())

    async def get_by_slug(
        self, slug: str, *, include_deleted: bool = False
    ) -> Promotion | None:
        stmt = select(Promotion).where(Promotion.slug == slug)
        if not include_deleted:
            stmt = stmt.where(Promotion.deleted_at.is_(None))
        result = await self._session.scalars(stmt)
        return result.first()

    async def slug_taken(
        self, slug: str, *, exclude_id: uuid.UUID | None = None
    ) -> bool:
        stmt = select(Promotion.id).where(
            Promotion.slug == slug, Promotion.deleted_at.is_(None)
        )
        if exclude_id is not None:
            stmt = stmt.where(Promotion.id != exclude_id)
        result = await self._session.execute(stmt)
        return result.scalar_one_or_none() is not None

    async def like_counts(self, ids: Sequence[uuid.UUID]) -> dict[uuid.UUID, int]:
        if not ids:
            return {}
        result = await self._session.execute(
            select(PromotionLike.promotion_id, func.count())
            .where(PromotionLike.promotion_id.in_(ids))
            .group_by(PromotionLike.promotion_id)
        )
        return {row[0]: int(row[1]) for row in result.all()}

    async def liked_ids(
        self, user_id: uuid.UUID, ids: Sequence[uuid.UUID]
    ) -> set[uuid.UUID]:
        if not ids:
            return set()
        result = await self._session.scalars(
            select(PromotionLike.promotion_id).where(
                PromotionLike.user_id == user_id,
                PromotionLike.promotion_id.in_(ids),
            )
        )
        return set(result.all())

    async def get_like(
        self, user_id: uuid.UUID, promotion_id: uuid.UUID
    ) -> PromotionLike | None:
        result = await self._session.scalars(
            select(PromotionLike).where(
                PromotionLike.user_id == user_id,
                PromotionLike.promotion_id == promotion_id,
            )
        )
        return result.first()

    def add_like(self, like: PromotionLike) -> None:
        self._session.add(like)

    async def delete_like(self, like: PromotionLike) -> None:
        await self._session.delete(like)
