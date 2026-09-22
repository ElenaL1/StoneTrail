from __future__ import annotations

import math
import re
import uuid
from datetime import UTC, datetime

from sqlalchemy.ext.asyncio import AsyncSession

from core import messages
from core.errors import ApiError, AuthError
from core.roles import is_staff
from core.slug import slugify
from models.content import Article, ArticleComment, ArticleLike
from models.enums import PublicationStatus
from models.user import User
from repositories.articles import ArticleRepository
from schemas.content import (
    ArticleCommentCreate,
    ArticleCommentOut,
    ArticleLikeOut,
    ArticleOut,
    ArticleUpdate,
    ArticleWrite,
    CategoryOut,
    ModerateArticleRequest,
)

RESERVED_SLUGS = {"categories", "mine", "moderation", "new"}
EDITABLE_STATUSES = {
    PublicationStatus.DRAFT,
    PublicationStatus.PENDING_REVIEW,
    PublicationStatus.NEEDS_REVISION,
    PublicationStatus.REJECTED,
}
SUBMITTABLE_STATUSES = {
    PublicationStatus.DRAFT,
    PublicationStatus.NEEDS_REVISION,
    PublicationStatus.REJECTED,
}
MODERATABLE_STATUSES = {
    PublicationStatus.PENDING_REVIEW,
    PublicationStatus.NEEDS_REVISION,
}


def _read_time(content: str) -> int:
    words = len(re.findall(r"\S+", content))
    return max(1, math.ceil(words / 180))


def _excerpt(value: str, content: str) -> str:
    text = value.strip() or re.sub(r"\s+", " ", content).strip()
    if len(text) <= 320:
        return text
    return text[:319].rstrip() + "…"


class ArticleService:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session
        self._repo = ArticleRepository(session)

    async def list_categories(self) -> list[CategoryOut]:
        rows = await self._repo.list_categories()
        return [CategoryOut(id=row.id, code=row.code, label=row.label) for row in rows]

    async def list_published(
        self,
        viewer: User | None,
        *,
        category: str | None = None,
        sort: str = "newest",
        favorites: bool = False,
    ) -> list[ArticleOut]:
        category_id = await self._resolve_category_filter(category)
        articles = await self._repo.list_published(category_id=category_id)
        items = await self._to_list(articles, viewer, include_comments=False)
        if favorites:
            if viewer is None:
                raise AuthError.invalid_credentials()
            items = [item for item in items if item.liked]
        if sort == "popular":
            items.sort(key=lambda item: item.likes_count, reverse=True)
        return items

    async def list_mine(self, author: User) -> list[ArticleOut]:
        articles = await self._repo.list_mine(author.id)
        return await self._to_list(articles, author, include_comments=False)

    async def list_moderation(self) -> list[ArticleOut]:
        articles = await self._repo.list_moderation()
        return await self._to_list(articles, None, include_comments=False)

    async def get_article(self, slug: str, viewer: User | None) -> ArticleOut:
        article = await self._repo.get_by_slug(slug)
        if article is None or not self._can_view(article, viewer):
            raise ApiError.not_found()
        comments = await self._repo.list_comments(article.id)
        packed = await self._to_list([article], viewer, include_comments=False)
        item = packed[0]
        item.comments = [self._comment_out(comment) for comment in comments]
        item.comment_count = len(comments)
        return item

    async def create_draft(self, payload: ArticleWrite, author: User) -> ArticleOut:
        category = await self._require_category(payload.category_id)
        slug = await self._unique_slug(payload.title)
        article = Article(
            title=payload.title,
            excerpt=_excerpt(payload.excerpt, payload.content),
            content=payload.content,
            category_id=category.id,
            read_time_minutes=_read_time(payload.content),
            author_id=author.id,
            publication_status=PublicationStatus.DRAFT,
            slug=slug,
            canonical_path=f"/articles/{slug}",
        )
        self._repo.add_article(article)
        await self._session.flush()
        await self._repo.set_cover(article.id, payload.cover_url)
        await self._session.commit()
        loaded = await self._repo.get_by_id(article.id)
        assert loaded is not None
        packed = await self._to_list([loaded], author, include_comments=False)
        return packed[0]

    async def update_article(
        self, slug: str, payload: ArticleUpdate, actor: User
    ) -> ArticleOut:
        article = await self._require_article(slug)
        self._assert_can_edit(article, actor)
        if payload.title is not None:
            article.title = payload.title
            if article.publication_status != PublicationStatus.PUBLISHED:
                article.slug = await self._unique_slug(
                    payload.title, exclude_id=article.id
                )
                article.canonical_path = f"/articles/{article.slug}"
        if payload.excerpt is not None:
            article.excerpt = _excerpt(
                payload.excerpt, payload.content or article.content
            )
        if payload.content is not None:
            article.content = payload.content
            article.read_time_minutes = _read_time(payload.content)
            if payload.excerpt is None:
                article.excerpt = _excerpt(article.excerpt, payload.content)
        if payload.category_id is not None:
            category = await self._require_category(payload.category_id)
            article.category_id = category.id
        if payload.cover_url is not None:
            await self._repo.set_cover(article.id, payload.cover_url or None)
        if (
            article.publication_status == PublicationStatus.PENDING_REVIEW
            and article.author_id == actor.id
            and not is_staff(actor.role)
        ):
            article.publication_status = PublicationStatus.DRAFT
        article.updated_by = actor.id
        await self._session.commit()
        loaded = await self._repo.get_by_id(article.id)
        assert loaded is not None
        packed = await self._to_list([loaded], actor, include_comments=False)
        return packed[0]

    async def submit(self, slug: str, actor: User) -> ArticleOut:
        article = await self._require_article(slug)
        self._assert_owner(article, actor)
        if article.publication_status not in SUBMITTABLE_STATUSES:
            raise AuthError.validation(messages.ARTICLE_CANNOT_SUBMIT)
        if actor.can_publish_articles or is_staff(actor.role):
            return await self._publish_article(article, actor)
        article.publication_status = PublicationStatus.PENDING_REVIEW
        article.moderation_note = ""
        article.updated_by = actor.id
        await self._session.commit()
        loaded = await self._repo.get_by_id(article.id)
        assert loaded is not None
        packed = await self._to_list([loaded], actor, include_comments=False)
        return packed[0]

    async def publish(self, slug: str, actor: User) -> ArticleOut:
        article = await self._require_article(slug)
        self._assert_owner(article, actor)
        if not actor.can_publish_articles and not is_staff(actor.role):
            raise AuthError.forbidden()
        if article.publication_status not in SUBMITTABLE_STATUSES | {
            PublicationStatus.PENDING_REVIEW
        }:
            raise AuthError.validation(messages.ARTICLE_CANNOT_PUBLISH)
        return await self._publish_article(article, actor)

    async def moderate(
        self, slug: str, payload: ModerateArticleRequest, staff: User
    ) -> ArticleOut:
        article = await self._require_article(slug)
        if payload.action == "revoke_privilege":
            if article.author is None:
                raise AuthError.forbidden()
            article.author.can_publish_articles = False
            await self._session.commit()
            loaded = await self._repo.get_by_id(article.id)
            assert loaded is not None
            packed = await self._to_list([loaded], staff, include_comments=False)
            return packed[0]
        if article.publication_status not in MODERATABLE_STATUSES:
            raise AuthError.validation(messages.ARTICLE_CANNOT_MODERATE)
        if payload.action == "publish":
            return await self._publish_article(article, staff)
        if not payload.note:
            raise AuthError.validation(
                messages.MODERATION_NOTE_REQUIRED,
                {"note": messages.MODERATION_NOTE_REQUIRED},
            )
        if payload.action == "request_changes":
            article.publication_status = PublicationStatus.NEEDS_REVISION
        else:
            article.publication_status = PublicationStatus.REJECTED
        article.moderation_note = payload.note
        article.updated_by = staff.id
        await self._session.commit()
        loaded = await self._repo.get_by_id(article.id)
        assert loaded is not None
        packed = await self._to_list([loaded], staff, include_comments=False)
        return packed[0]

    async def add_comment(
        self, slug: str, payload: ArticleCommentCreate, author: User
    ) -> ArticleCommentOut:
        article = await self._require_article(slug)
        if article.publication_status != PublicationStatus.PUBLISHED:
            raise ApiError.not_found()
        comment = ArticleComment(
            article_id=article.id,
            author_id=author.id,
            body=payload.body,
            parent_id=payload.parent_id,
        )
        self._repo.add_comment(comment)
        await self._session.commit()
        comments = await self._repo.list_comments(article.id)
        created = next(item for item in comments if item.id == comment.id)
        return self._comment_out(created)

    async def toggle_like(self, slug: str, user: User) -> ArticleLikeOut:
        article = await self._require_article(slug)
        if article.publication_status != PublicationStatus.PUBLISHED:
            raise ApiError.not_found()
        existing = await self._repo.get_like(user.id, article.id)
        if existing is None:
            self._repo.add_like(ArticleLike(user_id=user.id, article_id=article.id))
            liked = True
        else:
            await self._repo.delete_like(existing)
            liked = False
        await self._session.commit()
        counts = await self._repo.like_counts([article.id])
        return ArticleLikeOut(liked=liked, likes_count=counts.get(article.id, 0))

    async def _publish_article(self, article: Article, actor: User) -> ArticleOut:
        article.publication_status = PublicationStatus.PUBLISHED
        article.published_at = article.published_at or datetime.now(UTC)
        article.moderation_note = ""
        article.updated_by = actor.id
        if article.author is not None:
            article.author.can_publish_articles = True
        await self._session.commit()
        loaded = await self._repo.get_by_id(article.id)
        assert loaded is not None
        packed = await self._to_list([loaded], actor, include_comments=False)
        return packed[0]

    async def _require_article(self, slug: str) -> Article:
        article = await self._repo.get_by_slug(slug)
        if article is None:
            raise ApiError.not_found()
        return article

    async def _require_category(self, category_id: uuid.UUID):
        category = await self._repo.get_category(category_id)
        if category is None:
            raise AuthError.validation(
                messages.CATEGORY_INVALID, {"categoryId": messages.CATEGORY_INVALID}
            )
        return category

    async def _resolve_category_filter(self, category: str | None) -> uuid.UUID | None:
        if not category or category == "all":
            return None
        rows = await self._repo.list_categories()
        for row in rows:
            if row.code == category or row.label == category:
                return row.id
        raise ApiError.not_found()

    async def _unique_slug(
        self, title: str, *, exclude_id: uuid.UUID | None = None
    ) -> str:
        base = slugify(title, fallback="statya")
        if base in RESERVED_SLUGS:
            base = f"{base}-statya"
        candidate = base
        index = 2
        while await self._repo.slug_taken(candidate, exclude_id=exclude_id):
            candidate = f"{base}-{index}"
            index += 1
        return candidate

    def _assert_owner(self, article: Article, actor: User) -> None:
        if article.author_id != actor.id and not is_staff(actor.role):
            raise AuthError.forbidden()

    def _assert_can_edit(self, article: Article, actor: User) -> None:
        if is_staff(actor.role):
            return
        if article.author_id != actor.id:
            raise AuthError.forbidden()
        if article.publication_status == PublicationStatus.PUBLISHED:
            if not actor.can_publish_articles:
                raise AuthError.validation(messages.ARTICLE_NOT_EDITABLE)
            return
        if article.publication_status not in EDITABLE_STATUSES:
            raise AuthError.validation(messages.ARTICLE_NOT_EDITABLE)

    def _can_view(self, article: Article, viewer: User | None) -> bool:
        if article.publication_status == PublicationStatus.PUBLISHED:
            return True
        if viewer is None:
            return False
        if is_staff(viewer.role):
            return True
        return article.author_id == viewer.id

    async def _to_list(
        self,
        articles: list[Article],
        viewer: User | None,
        *,
        include_comments: bool,
    ) -> list[ArticleOut]:
        ids = [article.id for article in articles]
        covers = await self._repo.covers(ids)
        like_counts = await self._repo.like_counts(ids)
        comment_counts = await self._repo.comment_counts(ids)
        liked_ids: set[uuid.UUID] = set()
        if viewer is not None:
            liked_ids = await self._repo.liked_ids(viewer.id, ids)
        items: list[ArticleOut] = []
        for article in articles:
            comments: list[ArticleCommentOut] = []
            if include_comments:
                raw_comments = await self._repo.list_comments(article.id)
                comments = [self._comment_out(comment) for comment in raw_comments]
            items.append(
                ArticleOut(
                    id=article.id,
                    slug=article.slug,
                    title=article.title,
                    excerpt=article.excerpt,
                    content=article.content,
                    category=article.category.label,
                    category_id=article.category_id,
                    author=article.author.nickname if article.author else "",
                    author_id=article.author_id,
                    cover_url=covers.get(article.id, ""),
                    read_time_minutes=article.read_time_minutes,
                    publication_status=article.publication_status,
                    moderation_note=article.moderation_note,
                    published_at=article.published_at,
                    created_at=article.created_at,
                    updated_at=article.updated_at,
                    likes_count=like_counts.get(article.id, 0),
                    liked=article.id in liked_ids,
                    comment_count=(
                        len(comments)
                        if include_comments
                        else comment_counts.get(article.id, 0)
                    ),
                    comments=comments,
                )
            )
        return items

    def _comment_out(self, comment: ArticleComment) -> ArticleCommentOut:
        return ArticleCommentOut(
            id=comment.id,
            author=comment.author.nickname,
            body=comment.body,
            created_at=comment.created_at,
            parent_id=comment.parent_id,
        )
