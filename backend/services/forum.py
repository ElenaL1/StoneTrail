from __future__ import annotations

import re
import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from core import messages
from core.errors import ApiError, AuthError
from core.slug import slugify
from models.content import ForumComment, ForumPost
from models.user import User
from repositories.forum import ForumRepository
from schemas.content import (
    CategoryOut,
    ForumCommentCreate,
    ForumCommentOut,
    ForumPostCreate,
    ForumPostOut,
)

RESERVED_SLUGS = {"categories"}
EXCERPT_LEN = 280


def _excerpt(content: str) -> str:
    collapsed = re.sub(r"\s+", " ", content).strip()
    if len(collapsed) <= EXCERPT_LEN:
        return collapsed
    return collapsed[: EXCERPT_LEN - 1].rstrip() + "…"


class ForumService:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session
        self._repo = ForumRepository(session)

    async def list_categories(self) -> list[CategoryOut]:
        rows = await self._repo.list_categories()
        return [CategoryOut(id=row.id, code=row.code, label=row.label) for row in rows]

    async def list_posts(self, *, category: str | None = None) -> list[ForumPostOut]:
        category_id = await self._resolve_category_filter(category)
        posts = await self._repo.list_posts(category_id=category_id)
        counts = await self._repo.comment_counts([post.id for post in posts])
        return [self._to_list_item(post, counts.get(post.id, 0)) for post in posts]

    async def get_post(self, slug: str) -> ForumPostOut:
        post = await self._repo.get_post_by_slug(slug)
        if post is None:
            raise ApiError.not_found()
        comments = await self._repo.list_comments(post.id)
        return self._to_detail(
            post,
            len(comments),
            [self._comment_out(comment) for comment in comments],
        )

    async def create_post(self, payload: ForumPostCreate, author: User) -> ForumPostOut:
        category = await self._repo.get_category(payload.category_id)
        if category is None:
            raise AuthError.validation(
                messages.CATEGORY_INVALID, {"categoryId": messages.CATEGORY_INVALID}
            )
        slug = await self._unique_slug(payload.title)
        post = ForumPost(
            title=payload.title,
            category_id=category.id,
            excerpt=_excerpt(payload.content),
            content=payload.content,
            author_id=author.id,
            slug=slug,
            canonical_path=f"/community/{slug}",
        )
        self._repo.add_post(post)
        await self._session.commit()
        await self._session.refresh(post)
        loaded = await self._repo.get_post_by_slug(post.slug)
        assert loaded is not None
        return self._to_detail(loaded, 0, [])

    async def add_comment(
        self, slug: str, payload: ForumCommentCreate, author: User
    ) -> ForumCommentOut:
        post = await self._repo.get_post_by_slug(slug)
        if post is None:
            raise ApiError.not_found()
        if post.is_locked:
            raise AuthError.forbidden()
        comment = ForumComment(
            post_id=post.id, author_id=author.id, body=payload.body
        )
        self._repo.add_comment(comment)
        await self._session.commit()
        await self._session.refresh(comment)
        comments = await self._repo.list_comments(post.id)
        created = next(item for item in comments if item.id == comment.id)
        return self._comment_out(created)

    async def _resolve_category_filter(self, category: str | None) -> uuid.UUID | None:
        if not category or category == "all":
            return None
        rows = await self._repo.list_categories()
        for row in rows:
            if row.code == category or row.label == category:
                return row.id
        raise ApiError.not_found()

    async def _unique_slug(self, title: str) -> str:
        base = slugify(title)
        if base in RESERVED_SLUGS:
            base = f"{base}-tema"
        candidate = base
        index = 2
        while await self._repo.slug_taken(candidate):
            candidate = f"{base}-{index}"
            index += 1
        return candidate

    def _to_list_item(self, post: ForumPost, comment_count: int) -> ForumPostOut:
        return self._to_detail(post, comment_count, [])

    def _to_detail(
        self,
        post: ForumPost,
        comment_count: int,
        comments: list[ForumCommentOut],
    ) -> ForumPostOut:
        return ForumPostOut(
            id=post.id,
            slug=post.slug,
            title=post.title,
            author=post.author.nickname,
            category=post.category.label,
            category_id=post.category_id,
            excerpt=post.excerpt,
            content=post.content,
            created_at=post.created_at,
            comment_count=comment_count,
            comments=comments,
        )

    def _comment_out(self, comment: ForumComment) -> ForumCommentOut:
        return ForumCommentOut(
            id=comment.id,
            author=comment.author.nickname,
            body=comment.body,
            created_at=comment.created_at,
        )
