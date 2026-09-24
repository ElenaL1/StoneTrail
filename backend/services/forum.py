from __future__ import annotations

import re
import uuid
from datetime import datetime, timezone

from sqlalchemy.ext.asyncio import AsyncSession

from core import messages
from core.errors import ApiError, AuthError
from core.roles import is_staff
from core.slug import slugify
from models.content import ForumComment, ForumCommentLike, ForumPost, ForumPostLike
from models.user import User
from repositories.forum import ForumRepository
from schemas.content import (
    CategoryOut,
    ForumCommentCreate,
    ForumCommentOut,
    ForumCommentUpdate,
    ForumLikeOut,
    ForumPostCreate,
    ForumPostOut,
    ForumPostUpdate,
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

    async def list_posts(
        self, *, category: str | None = None, viewer: User | None = None
    ) -> list[ForumPostOut]:
        category_id = await self._resolve_category_filter(category)
        posts = await self._repo.list_posts(category_id=category_id)
        return await self._pack_many(posts, viewer, include_comments=False)

    async def get_post(self, slug: str, viewer: User | None = None) -> ForumPostOut:
        staff = viewer is not None and is_staff(viewer.role)
        post = await self._repo.get_post_by_slug(slug, include_deleted=staff)
        if post is None:
            raise ApiError.not_found()
        if post.deleted_at is None:
            post.view_count += 1
            await self._session.commit()
            loaded = await self._repo.get_post_by_slug(slug)
            assert loaded is not None
            post = loaded
        packed = await self._pack_many([post], viewer, include_comments=True)
        return packed[0]

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
        loaded = await self._repo.get_post_by_slug(post.slug)
        assert loaded is not None
        packed = await self._pack_many([loaded], author, include_comments=False)
        return packed[0]

    async def update_post(
        self, slug: str, payload: ForumPostUpdate, actor: User
    ) -> ForumPostOut:
        post = await self._require_post(slug)
        if post.author_id != actor.id and not is_staff(actor.role):
            raise AuthError.forbidden()
        if payload.title is not None:
            post.title = payload.title
        if payload.content is not None:
            post.content = payload.content
            post.excerpt = _excerpt(payload.content)
        if payload.category_id is not None:
            category = await self._repo.get_category(payload.category_id)
            if category is None:
                raise AuthError.validation(
                    messages.CATEGORY_INVALID,
                    {"categoryId": messages.CATEGORY_INVALID},
                )
            post.category_id = category.id
        post.updated_by = actor.id
        post.edited_at = datetime.now(timezone.utc)
        await self._session.commit()
        loaded = await self._repo.get_post_by_slug(post.slug)
        assert loaded is not None
        packed = await self._pack_many([loaded], actor, include_comments=True)
        return packed[0]

    async def add_comment(
        self, slug: str, payload: ForumCommentCreate, author: User
    ) -> ForumCommentOut:
        post = await self._require_post(slug)
        if post.is_locked:
            raise AuthError.forbidden()
        if payload.parent_id is not None:
            parent = await self._repo.get_comment(payload.parent_id)
            if parent is None or parent.post_id != post.id:
                raise ApiError(
                    400,
                    "validation",
                    messages.COMMENT_PARENT_INVALID,
                    {"parentId": messages.COMMENT_PARENT_INVALID},
                )
        comment = ForumComment(
            post_id=post.id,
            author_id=author.id,
            body=payload.body,
            parent_id=payload.parent_id,
        )
        self._repo.add_comment(comment)
        await self._session.commit()
        comments = await self._repo.list_comments(post.id)
        created = next(item for item in comments if item.id == comment.id)
        packed = await self._comments_out([created], author)
        return packed[0]

    async def update_comment(
        self, slug: str, comment_id: uuid.UUID, payload: ForumCommentUpdate, actor: User
    ) -> ForumCommentOut:
        post = await self._require_post(slug)
        comment = await self._repo.get_comment(comment_id)
        if comment is None or comment.post_id != post.id:
            raise ApiError.not_found()
        if comment.author_id != actor.id:
            raise AuthError.forbidden()
        comment.body = payload.body
        comment.edited_at = datetime.now(timezone.utc)
        await self._session.commit()
        comments = await self._repo.list_comments(post.id)
        updated = next(item for item in comments if item.id == comment.id)
        packed = await self._comments_out([updated], actor)
        return packed[0]

    async def toggle_post_like(self, slug: str, user: User) -> ForumLikeOut:
        post = await self._require_post(slug)
        existing = await self._repo.get_post_like(user.id, post.id)
        if existing is None:
            self._repo.add_post_like(
                ForumPostLike(user_id=user.id, post_id=post.id)
            )
            liked = True
        else:
            await self._repo.delete_post_like(existing)
            liked = False
        await self._session.commit()
        counts = await self._repo.post_like_counts([post.id])
        return ForumLikeOut(liked=liked, likes_count=counts.get(post.id, 0))

    async def toggle_comment_like(
        self, slug: str, comment_id: uuid.UUID, user: User
    ) -> ForumLikeOut:
        post = await self._require_post(slug)
        comment = await self._repo.get_comment(comment_id)
        if comment is None or comment.post_id != post.id:
            raise ApiError.not_found()
        existing = await self._repo.get_comment_like(user.id, comment.id)
        if existing is None:
            self._repo.add_comment_like(
                ForumCommentLike(user_id=user.id, comment_id=comment.id)
            )
            liked = True
        else:
            await self._repo.delete_comment_like(existing)
            liked = False
        await self._session.commit()
        counts = await self._repo.comment_like_counts([comment.id])
        return ForumLikeOut(liked=liked, likes_count=counts.get(comment.id, 0))

    async def hide_post(self, slug: str, actor: User) -> None:
        post = await self._require_post(slug)
        if not is_staff(actor.role):
            if post.author_id != actor.id:
                raise AuthError.forbidden()
            counts = await self._repo.comment_counts([post.id])
            if counts.get(post.id, 0) > 0:
                raise AuthError.forbidden()
        self._hide(post, actor)
        await self._session.commit()

    async def restore_post(self, slug: str, actor: User) -> ForumPostOut:
        post = await self._require_deleted_post(slug)
        self._restore(post, actor)
        await self._session.commit()
        return await self.get_post(slug, actor)

    async def destroy_post(self, slug: str, actor: User) -> None:
        if not is_staff(actor.role):
            raise AuthError.forbidden()
        post = await self._require_deleted_post(slug)
        await self._session.delete(post)
        await self._session.commit()

    async def hide_comment(self, slug: str, comment_id: uuid.UUID, actor: User) -> None:
        post = await self._require_post(slug)
        comment = await self._repo.get_comment(comment_id)
        if comment is None or comment.post_id != post.id:
            raise ApiError.not_found()
        if not is_staff(actor.role):
            if comment.author_id != actor.id:
                raise AuthError.forbidden()
            if await self._repo.living_reply_count(comment.id) > 0:
                raise AuthError.forbidden()
        self._hide(comment, actor)
        await self._session.commit()

    async def restore_comment(
        self, slug: str, comment_id: uuid.UUID, actor: User
    ) -> ForumPostOut:
        post = await self._require_post_any(slug, actor)
        comment = await self._repo.get_comment(comment_id, include_deleted=True)
        if comment is None or comment.post_id != post.id or comment.deleted_at is None:
            raise ApiError.not_found()
        self._restore(comment, actor)
        await self._session.commit()
        return await self.get_post(post.slug, actor)

    async def destroy_comment(self, slug: str, comment_id: uuid.UUID, actor: User) -> None:
        if not is_staff(actor.role):
            raise AuthError.forbidden()
        post = await self._require_post_any(slug, actor)
        comment = await self._repo.get_comment(comment_id, include_deleted=True)
        if comment is None or comment.post_id != post.id or comment.deleted_at is None:
            raise ApiError.not_found()
        await self._repo.reparent_children(comment)
        await self._session.delete(comment)
        await self._session.commit()

    def _hide(self, row: ForumPost | ForumComment, actor: User) -> None:
        row.deleted_at = datetime.now(timezone.utc)
        row.deleted_by = actor.id
        self._session.add(row)

    def _restore(self, row: ForumPost | ForumComment, actor: User) -> None:
        if not is_staff(actor.role) and row.deleted_by != actor.id:
            raise AuthError.forbidden()
        row.deleted_at = None
        row.deleted_by = None

    async def _require_post(self, slug: str) -> ForumPost:
        post = await self._repo.get_post_by_slug(slug)
        if post is None:
            raise ApiError.not_found()
        return post

    async def _require_deleted_post(self, slug: str) -> ForumPost:
        post = await self._repo.get_post_by_slug(slug, include_deleted=True)
        if post is None or post.deleted_at is None:
            raise ApiError.not_found()
        return post

    async def _require_post_any(self, slug: str, actor: User) -> ForumPost:
        post = await self._repo.get_post_by_slug(
            slug, include_deleted=is_staff(actor.role)
        )
        if post is None:
            raise ApiError.not_found()
        return post

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

    async def _pack_many(
        self,
        posts: list[ForumPost],
        viewer: User | None,
        *,
        include_comments: bool,
    ) -> list[ForumPostOut]:
        ids = [post.id for post in posts]
        comment_counts = await self._repo.comment_counts(ids)
        like_counts = await self._repo.post_like_counts(ids)
        liked_ids: set[uuid.UUID] = set()
        if viewer is not None:
            liked_ids = await self._repo.liked_post_ids(viewer.id, ids)
        staff = viewer is not None and is_staff(viewer.role)
        deleted_names: dict[uuid.UUID, str] = {}
        if staff:
            deleted_names = await self._repo.nicknames(
                [post.deleted_by for post in posts if post.deleted_by is not None]
            )
        items: list[ForumPostOut] = []
        for post in posts:
            comments: list[ForumCommentOut] = []
            if include_comments:
                raw = await self._repo.list_comments(post.id, include_deleted=True)
                comments = await self._comments_out(raw, viewer)
            items.append(
                ForumPostOut(
                    id=post.id,
                    slug=post.slug,
                    title=post.title,
                    author=post.author.nickname,
                    author_id=post.author_id,
                    category=post.category.label,
                    category_id=post.category_id,
                    excerpt=post.excerpt,
                    content=post.content,
                    created_at=post.created_at,
                    edited_at=post.edited_at,
                    comment_count=comment_counts.get(post.id, 0),
                    view_count=post.view_count,
                    likes_count=like_counts.get(post.id, 0),
                    liked=post.id in liked_ids,
                    deleted=post.deleted_at is not None,
                    deleted_by=deleted_names.get(post.deleted_by) if post.deleted_by else None,
                    comments=comments,
                )
            )
        return items

    async def _comments_out(
        self, comments: list[ForumComment], viewer: User | None
    ) -> list[ForumCommentOut]:
        staff = viewer is not None and is_staff(viewer.role)
        visible = [comment for comment in comments if self._comment_visible(comment, comments, staff)]
        ids = [comment.id for comment in visible]
        counts = await self._repo.comment_like_counts(ids)
        liked_ids: set[uuid.UUID] = set()
        if viewer is not None:
            liked_ids = await self._repo.liked_comment_ids(viewer.id, ids)
        deleted_names: dict[uuid.UUID, str] = {}
        if staff:
            deleted_names = await self._repo.nicknames(
                [comment.deleted_by for comment in visible if comment.deleted_by is not None]
            )
        packed: list[ForumCommentOut] = []
        for comment in visible:
            hidden = comment.deleted_at is not None
            tombstone = hidden and not staff
            packed.append(
                ForumCommentOut(
                    id=comment.id,
                    author=comment.author.nickname,
                    author_id=comment.author_id,
                    body="" if tombstone else comment.body,
                    created_at=comment.created_at,
                    edited_at=None if tombstone else comment.edited_at,
                    parent_id=comment.parent_id,
                    likes_count=0 if tombstone else counts.get(comment.id, 0),
                    liked=False if tombstone else comment.id in liked_ids,
                    deleted=hidden,
                    deleted_by=deleted_names.get(comment.deleted_by) if hidden and comment.deleted_by else None,
                )
            )
        return packed

    def _comment_visible(
        self, comment: ForumComment, comments: list[ForumComment], staff: bool
    ) -> bool:
        if comment.deleted_at is None or staff:
            return True
        return self._has_living_descendant(comment.id, comments)

    def _has_living_descendant(
        self, comment_id: uuid.UUID, comments: list[ForumComment]
    ) -> bool:
        children: dict[uuid.UUID, list[ForumComment]] = {}
        for comment in comments:
            if comment.parent_id is None:
                continue
            children.setdefault(comment.parent_id, []).append(comment)
        pending = list(children.get(comment_id, []))
        while pending:
            current = pending.pop()
            if current.deleted_at is None:
                return True
            pending.extend(children.get(current.id, []))
        return False
