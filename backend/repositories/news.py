from __future__ import annotations

import uuid
from collections.abc import Sequence

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from models.content import IndustryNews, NewsLike
from models.enums import NewsStatus


class NewsRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    def add(self, item: IndustryNews) -> None:
        self._session.add(item)

    async def list_published(self) -> list[IndustryNews]:
        result = await self._session.scalars(
            select(IndustryNews)
            .where(
                IndustryNews.deleted_at.is_(None),
                IndustryNews.status == NewsStatus.PUBLISHED,
            )
            .order_by(IndustryNews.published_at.desc())
        )
        return list(result.all())

    async def list_managed(self, *, deleted: bool) -> list[IndustryNews]:
        stmt = select(IndustryNews)
        if deleted:
            stmt = stmt.where(IndustryNews.deleted_at.is_not(None))
        else:
            stmt = stmt.where(IndustryNews.deleted_at.is_(None))
        result = await self._session.scalars(
            stmt.order_by(IndustryNews.updated_at.desc())
        )
        return list(result.all())

    async def get_by_slug(
        self, slug: str, *, include_deleted: bool = False
    ) -> IndustryNews | None:
        stmt = select(IndustryNews).where(IndustryNews.slug == slug)
        if not include_deleted:
            stmt = stmt.where(IndustryNews.deleted_at.is_(None))
        result = await self._session.scalars(stmt)
        return result.first()

    async def slug_taken(
        self, slug: str, *, exclude_id: uuid.UUID | None = None
    ) -> bool:
        stmt = select(IndustryNews.id).where(
            IndustryNews.slug == slug, IndustryNews.deleted_at.is_(None)
        )
        if exclude_id is not None:
            stmt = stmt.where(IndustryNews.id != exclude_id)
        result = await self._session.execute(stmt)
        return result.scalar_one_or_none() is not None

    async def like_counts(self, ids: Sequence[uuid.UUID]) -> dict[uuid.UUID, int]:
        if not ids:
            return {}
        result = await self._session.execute(
            select(NewsLike.news_id, func.count())
            .where(NewsLike.news_id.in_(ids))
            .group_by(NewsLike.news_id)
        )
        return {row[0]: int(row[1]) for row in result.all()}

    async def liked_ids(
        self, user_id: uuid.UUID, ids: Sequence[uuid.UUID]
    ) -> set[uuid.UUID]:
        if not ids:
            return set()
        result = await self._session.scalars(
            select(NewsLike.news_id).where(
                NewsLike.user_id == user_id, NewsLike.news_id.in_(ids)
            )
        )
        return set(result.all())

    async def get_like(self, user_id: uuid.UUID, news_id: uuid.UUID) -> NewsLike | None:
        result = await self._session.scalars(
            select(NewsLike).where(
                NewsLike.user_id == user_id, NewsLike.news_id == news_id
            )
        )
        return result.first()

    def add_like(self, like: NewsLike) -> None:
        self._session.add(like)

    async def delete_like(self, like: NewsLike) -> None:
        await self._session.delete(like)
