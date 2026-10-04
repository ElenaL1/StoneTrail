from __future__ import annotations

import uuid
from datetime import UTC, datetime

from sqlalchemy.ext.asyncio import AsyncSession

from core import messages
from core.errors import ApiError, AuthError
from core.roles import is_admin, is_editor
from core.slug import slugify
from models.content import IndustryNews, NewsLike
from models.enums import NewsStatus
from models.user import User
from repositories.news import NewsRepository
from schemas.feed import LikeOut, NewsOut, NewsUpdate, NewsWrite
from services.audit import record_audit

RESERVED_SLUGS = {"manage"}


class NewsService:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session
        self._repo = NewsRepository(session)

    async def list_published(self, viewer: User | None) -> list[NewsOut]:
        rows = await self._repo.list_published()
        return await self._pack(rows, viewer)

    async def list_managed(self, *, deleted: bool) -> list[NewsOut]:
        rows = await self._repo.list_managed(deleted=deleted)
        return await self._pack(rows, None)

    async def get(self, slug: str, viewer: User | None) -> NewsOut:
        row = await self._repo.get_by_slug(slug)
        if row is None or not self._can_view(row, viewer):
            raise ApiError.not_found()
        packed = await self._pack([row], viewer)
        return packed[0]

    async def create(self, payload: NewsWrite, actor: User) -> NewsOut:
        slug = await self._unique_slug(payload.slug or payload.title)
        published_at = (
            datetime.now(UTC) if payload.status == NewsStatus.PUBLISHED else None
        )
        row = IndustryNews(
            title=payload.title,
            excerpt=payload.excerpt,
            content=payload.content,
            status=payload.status,
            published_at=published_at,
            slug=slug,
            canonical_path=f"/news/{slug}",
            updated_by=actor.id,
        )
        self._repo.add(row)
        await self._session.flush()
        await record_audit(
            self._session,
            actor_id=actor.id,
            action="news_create",
            entity_type="news",
            entity_id=str(row.id),
            detail={"slug": slug, "status": payload.status.value},
        )
        if payload.status == NewsStatus.PUBLISHED:
            await record_audit(
                self._session,
                actor_id=actor.id,
                action="news_publish",
                entity_type="news",
                entity_id=str(row.id),
                detail={"slug": slug},
            )
        await self._session.commit()
        loaded = await self._repo.get_by_slug(slug)
        assert loaded is not None
        packed = await self._pack([loaded], actor)
        return packed[0]

    async def update(self, slug: str, payload: NewsUpdate, actor: User) -> NewsOut:
        row = await self._require(slug)
        if payload.title is not None:
            row.title = payload.title
        if payload.excerpt is not None:
            row.excerpt = payload.excerpt
        if payload.content is not None:
            row.content = payload.content
        if payload.slug is not None:
            row.slug = await self._unique_slug(payload.slug, exclude_id=row.id)
            row.canonical_path = f"/news/{row.slug}"
        elif payload.title is not None and row.status != NewsStatus.PUBLISHED:
            row.slug = await self._unique_slug(payload.title, exclude_id=row.id)
            row.canonical_path = f"/news/{row.slug}"
        if payload.status is not None:
            self._apply_status(row, payload.status)
        row.updated_by = actor.id
        await record_audit(
            self._session,
            actor_id=actor.id,
            action="news_update",
            entity_type="news",
            entity_id=str(row.id),
            detail={"slug": row.slug, "status": row.status.value},
        )
        if payload.status == NewsStatus.PUBLISHED:
            await record_audit(
                self._session,
                actor_id=actor.id,
                action="news_publish",
                entity_type="news",
                entity_id=str(row.id),
                detail={"slug": row.slug},
            )
        await self._session.commit()
        loaded = await self._repo.get_by_slug(row.slug)
        assert loaded is not None
        packed = await self._pack([loaded], actor)
        return packed[0]

    async def publish(self, slug: str, actor: User) -> NewsOut:
        row = await self._require(slug)
        self._apply_status(row, NewsStatus.PUBLISHED)
        row.updated_by = actor.id
        await record_audit(
            self._session,
            actor_id=actor.id,
            action="news_publish",
            entity_type="news",
            entity_id=str(row.id),
            detail={"slug": row.slug},
        )
        await self._session.commit()
        loaded = await self._repo.get_by_slug(row.slug)
        assert loaded is not None
        packed = await self._pack([loaded], actor)
        return packed[0]

    async def hide(self, slug: str, actor: User) -> None:
        if not is_admin(actor.role):
            raise AuthError.forbidden()
        row = await self._require(slug)
        row.deleted_at = datetime.now(UTC)
        row.updated_by = actor.id
        await record_audit(
            self._session,
            actor_id=actor.id,
            action="news_delete",
            entity_type="news",
            entity_id=str(row.id),
            detail={"slug": row.slug},
        )
        await self._session.commit()

    async def restore(self, slug: str, actor: User) -> NewsOut:
        if not is_admin(actor.role):
            raise AuthError.forbidden()
        row = await self._repo.get_by_slug(slug, include_deleted=True)
        if row is None or row.deleted_at is None:
            raise ApiError.not_found()
        if await self._repo.slug_taken(row.slug, exclude_id=row.id):
            raise ApiError.conflict(messages.SLUG_TAKEN)
        row.deleted_at = None
        row.updated_by = actor.id
        await record_audit(
            self._session,
            actor_id=actor.id,
            action="news_restore",
            entity_type="news",
            entity_id=str(row.id),
            detail={"slug": row.slug},
        )
        await self._session.commit()
        loaded = await self._repo.get_by_slug(row.slug)
        assert loaded is not None
        packed = await self._pack([loaded], actor)
        return packed[0]

    async def toggle_like(self, slug: str, user: User) -> LikeOut:
        row = await self._require(slug)
        if row.status != NewsStatus.PUBLISHED:
            raise ApiError.not_found()
        existing = await self._repo.get_like(user.id, row.id)
        if existing is None:
            self._repo.add_like(NewsLike(user_id=user.id, news_id=row.id))
            liked = True
        else:
            await self._repo.delete_like(existing)
            liked = False
        await self._session.commit()
        counts = await self._repo.like_counts([row.id])
        return LikeOut(liked=liked, likes_count=counts.get(row.id, 0))

    async def _require(self, slug: str) -> IndustryNews:
        row = await self._repo.get_by_slug(slug)
        if row is None:
            raise ApiError.not_found()
        return row

    def _can_view(self, row: IndustryNews, viewer: User | None) -> bool:
        if row.status == NewsStatus.PUBLISHED:
            return True
        return viewer is not None and is_editor(viewer.role)

    def _apply_status(self, row: IndustryNews, status: NewsStatus) -> None:
        row.status = status
        if status == NewsStatus.PUBLISHED:
            row.published_at = row.published_at or datetime.now(UTC)
        else:
            row.published_at = None

    async def _unique_slug(
        self, source: str, *, exclude_id: uuid.UUID | None = None
    ) -> str:
        base = slugify(source, fallback="novost")
        if base in RESERVED_SLUGS:
            base = f"{base}-novost"
        candidate = base
        index = 2
        while await self._repo.slug_taken(candidate, exclude_id=exclude_id):
            candidate = f"{base}-{index}"
            index += 1
        return candidate

    async def _pack(
        self, rows: list[IndustryNews], viewer: User | None
    ) -> list[NewsOut]:
        ids = [row.id for row in rows]
        counts = await self._repo.like_counts(ids)
        liked = (
            await self._repo.liked_ids(viewer.id, ids) if viewer is not None else set()
        )
        return [
            NewsOut(
                id=row.id,
                slug=row.slug,
                title=row.title,
                excerpt=row.excerpt,
                content=row.content,
                status=row.status,
                published_at=row.published_at,
                created_at=row.created_at,
                updated_at=row.updated_at,
                likes_count=counts.get(row.id, 0),
                liked=row.id in liked,
                deleted=row.deleted_at is not None,
            )
            for row in rows
        ]
