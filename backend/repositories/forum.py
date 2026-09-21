from __future__ import annotations

import uuid
from collections.abc import Sequence

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from models.content import ForumComment, ForumPost
from models.lookups import ForumCategory


class ForumRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def list_categories(self) -> list[ForumCategory]:
        stmt = (
            select(ForumCategory)
            .where(ForumCategory.is_active.is_(True))
            .order_by(ForumCategory.sort_order, ForumCategory.label)
        )
        result = await self._session.execute(stmt)
        return list(result.scalars().all())

    async def get_category(self, category_id: uuid.UUID) -> ForumCategory | None:
        stmt = select(ForumCategory).where(
            ForumCategory.id == category_id,
            ForumCategory.is_active.is_(True),
        )
        result = await self._session.execute(stmt)
        return result.scalar_one_or_none()

    async def slug_taken(
        self, slug: str, *, exclude_id: uuid.UUID | None = None
    ) -> bool:
        stmt = select(ForumPost.id).where(
            ForumPost.slug == slug, ForumPost.deleted_at.is_(None)
        )
        if exclude_id is not None:
            stmt = stmt.where(ForumPost.id != exclude_id)
        result = await self._session.execute(stmt)
        return result.scalar_one_or_none() is not None

    def _post_options(self):
        return (
            selectinload(ForumPost.category),
            selectinload(ForumPost.author),
        )

    async def list_posts(
        self, *, category_id: uuid.UUID | None = None
    ) -> list[ForumPost]:
        stmt = (
            select(ForumPost)
            .where(ForumPost.deleted_at.is_(None))
            .options(*self._post_options())
            .order_by(ForumPost.is_pinned.desc(), ForumPost.created_at.desc())
        )
        if category_id is not None:
            stmt = stmt.where(ForumPost.category_id == category_id)
        result = await self._session.execute(stmt)
        return list(result.scalars().unique().all())

    async def get_post_by_slug(self, slug: str) -> ForumPost | None:
        stmt = (
            select(ForumPost)
            .where(ForumPost.slug == slug, ForumPost.deleted_at.is_(None))
            .options(*self._post_options())
        )
        result = await self._session.execute(stmt)
        return result.scalar_one_or_none()

    async def comment_counts(
        self, post_ids: Sequence[uuid.UUID]
    ) -> dict[uuid.UUID, int]:
        if not post_ids:
            return {}
        stmt = (
            select(ForumComment.post_id, func.count(ForumComment.id))
            .where(
                ForumComment.post_id.in_(list(post_ids)),
                ForumComment.deleted_at.is_(None),
            )
            .group_by(ForumComment.post_id)
        )
        result = await self._session.execute(stmt)
        return {post_id: count for post_id, count in result.all()}

    async def list_comments(self, post_id: uuid.UUID) -> list[ForumComment]:
        stmt = (
            select(ForumComment)
            .where(
                ForumComment.post_id == post_id,
                ForumComment.deleted_at.is_(None),
            )
            .options(selectinload(ForumComment.author))
            .order_by(ForumComment.created_at.asc())
        )
        result = await self._session.execute(stmt)
        return list(result.scalars().unique().all())

    def add_post(self, post: ForumPost) -> None:
        self._session.add(post)

    def add_comment(self, comment: ForumComment) -> None:
        self._session.add(comment)
