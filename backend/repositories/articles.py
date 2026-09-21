from __future__ import annotations

import uuid
from collections.abc import Sequence

from sqlalchemy import delete, func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from models.content import Article, ArticleComment, ArticleLike
from models.enums import MediaOwner, PublicationStatus
from models.lookups import ArticleCategory
from models.media import Media, MediaLink


class ArticleRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def list_categories(self) -> list[ArticleCategory]:
        stmt = (
            select(ArticleCategory)
            .where(ArticleCategory.is_active.is_(True))
            .order_by(ArticleCategory.sort_order, ArticleCategory.label)
        )
        result = await self._session.execute(stmt)
        return list(result.scalars().all())

    async def get_category(self, category_id: uuid.UUID) -> ArticleCategory | None:
        stmt = select(ArticleCategory).where(
            ArticleCategory.id == category_id,
            ArticleCategory.is_active.is_(True),
        )
        result = await self._session.execute(stmt)
        return result.scalar_one_or_none()

    async def slug_taken(
        self, slug: str, *, exclude_id: uuid.UUID | None = None
    ) -> bool:
        stmt = select(Article.id).where(
            Article.slug == slug, Article.deleted_at.is_(None)
        )
        if exclude_id is not None:
            stmt = stmt.where(Article.id != exclude_id)
        result = await self._session.execute(stmt)
        return result.scalar_one_or_none() is not None

    def _article_options(self):
        return (
            selectinload(Article.category),
            selectinload(Article.author),
        )

    async def list_published(
        self, *, category_id: uuid.UUID | None = None
    ) -> list[Article]:
        stmt = (
            select(Article)
            .where(
                Article.deleted_at.is_(None),
                Article.publication_status == PublicationStatus.PUBLISHED,
            )
            .options(*self._article_options())
            .order_by(Article.published_at.desc())
        )
        if category_id is not None:
            stmt = stmt.where(Article.category_id == category_id)
        result = await self._session.execute(stmt)
        return list(result.scalars().unique().all())

    async def list_mine(self, author_id: uuid.UUID) -> list[Article]:
        stmt = (
            select(Article)
            .where(Article.deleted_at.is_(None), Article.author_id == author_id)
            .options(*self._article_options())
            .order_by(Article.updated_at.desc())
        )
        result = await self._session.execute(stmt)
        return list(result.scalars().unique().all())

    async def list_moderation(self) -> list[Article]:
        stmt = (
            select(Article)
            .where(
                Article.deleted_at.is_(None),
                Article.publication_status.in_(
                    (
                        PublicationStatus.PENDING_REVIEW,
                        PublicationStatus.NEEDS_REVISION,
                    )
                ),
            )
            .options(*self._article_options())
            .order_by(Article.updated_at.asc())
        )
        result = await self._session.execute(stmt)
        return list(result.scalars().unique().all())

    async def get_by_slug(self, slug: str) -> Article | None:
        stmt = (
            select(Article)
            .where(Article.slug == slug, Article.deleted_at.is_(None))
            .options(*self._article_options())
        )
        result = await self._session.execute(stmt)
        return result.scalar_one_or_none()

    async def get_by_id(self, article_id: uuid.UUID) -> Article | None:
        stmt = (
            select(Article)
            .where(Article.id == article_id, Article.deleted_at.is_(None))
            .options(*self._article_options())
        )
        result = await self._session.execute(stmt)
        return result.scalar_one_or_none()

    async def comment_counts(
        self, article_ids: Sequence[uuid.UUID]
    ) -> dict[uuid.UUID, int]:
        if not article_ids:
            return {}
        stmt = (
            select(ArticleComment.article_id, func.count(ArticleComment.id))
            .where(
                ArticleComment.article_id.in_(list(article_ids)),
                ArticleComment.deleted_at.is_(None),
            )
            .group_by(ArticleComment.article_id)
        )
        result = await self._session.execute(stmt)
        return {article_id: count for article_id, count in result.all()}

    async def like_counts(
        self, article_ids: Sequence[uuid.UUID]
    ) -> dict[uuid.UUID, int]:
        if not article_ids:
            return {}
        stmt = (
            select(ArticleLike.article_id, func.count())
            .where(ArticleLike.article_id.in_(list(article_ids)))
            .group_by(ArticleLike.article_id)
        )
        result = await self._session.execute(stmt)
        return {article_id: count for article_id, count in result.all()}

    async def liked_ids(
        self, user_id: uuid.UUID, article_ids: Sequence[uuid.UUID]
    ) -> set[uuid.UUID]:
        if not article_ids:
            return set()
        stmt = select(ArticleLike.article_id).where(
            ArticleLike.user_id == user_id,
            ArticleLike.article_id.in_(list(article_ids)),
        )
        result = await self._session.execute(stmt)
        return set(result.scalars().all())

    async def list_comments(self, article_id: uuid.UUID) -> list[ArticleComment]:
        stmt = (
            select(ArticleComment)
            .where(
                ArticleComment.article_id == article_id,
                ArticleComment.deleted_at.is_(None),
            )
            .options(selectinload(ArticleComment.author))
            .order_by(ArticleComment.created_at.asc())
        )
        result = await self._session.execute(stmt)
        return list(result.scalars().unique().all())

    async def get_like(
        self, user_id: uuid.UUID, article_id: uuid.UUID
    ) -> ArticleLike | None:
        stmt = select(ArticleLike).where(
            ArticleLike.user_id == user_id, ArticleLike.article_id == article_id
        )
        result = await self._session.execute(stmt)
        return result.scalar_one_or_none()

    async def covers(
        self, article_ids: Sequence[uuid.UUID]
    ) -> dict[uuid.UUID, str]:
        if not article_ids:
            return {}
        stmt = (
            select(MediaLink, Media)
            .join(Media, Media.id == MediaLink.media_id)
            .where(
                MediaLink.owner_type == MediaOwner.ARTICLE,
                MediaLink.owner_id.in_(list(article_ids)),
            )
            .order_by(MediaLink.sort_order.asc(), MediaLink.id.asc())
        )
        result = await self._session.execute(stmt)
        covers: dict[uuid.UUID, str] = {}
        for link, media in result.all():
            if link.is_primary or link.owner_id not in covers:
                covers[link.owner_id] = media.public_url
        return covers

    async def set_cover(self, article_id: uuid.UUID, url: str | None) -> None:
        await self._session.execute(
            delete(MediaLink).where(
                MediaLink.owner_type == MediaOwner.ARTICLE,
                MediaLink.owner_id == article_id,
            )
        )
        if not url:
            return
        key = f"article-cover/{article_id}"
        media = await self._session.scalar(
            select(Media).where(Media.storage_key == key)
        )
        if media is None:
            media = Media(
                storage_key=key,
                public_url=url,
                mime_type="image/jpeg",
                size_bytes=1,
                alt="",
            )
            self._session.add(media)
            await self._session.flush()
        else:
            media.public_url = url
        self._session.add(
            MediaLink(
                media_id=media.id,
                owner_type=MediaOwner.ARTICLE,
                owner_id=article_id,
                is_primary=True,
                sort_order=0,
            )
        )

    def add_article(self, article: Article) -> None:
        self._session.add(article)

    def add_comment(self, comment: ArticleComment) -> None:
        self._session.add(comment)

    def add_like(self, like: ArticleLike) -> None:
        self._session.add(like)

    async def delete_like(self, like: ArticleLike) -> None:
        await self._session.delete(like)
