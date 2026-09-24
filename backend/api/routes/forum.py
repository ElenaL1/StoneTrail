from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends

from core.deps import get_forum_service, get_optional_user, get_verified_user
from models.user import User
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
from services.forum import ForumService

router = APIRouter(prefix="/api/forum", tags=["forum"])


@router.get("/categories", response_model=list[CategoryOut])
async def list_categories(
    service: Annotated[ForumService, Depends(get_forum_service)],
) -> list[CategoryOut]:
    return await service.list_categories()


@router.get("/posts", response_model=list[ForumPostOut])
async def list_posts(
    service: Annotated[ForumService, Depends(get_forum_service)],
    viewer: Annotated[User | None, Depends(get_optional_user)],
    category: str | None = None,
) -> list[ForumPostOut]:
    return await service.list_posts(category=category, viewer=viewer)


@router.post("/posts", response_model=ForumPostOut)
async def create_post(
    payload: ForumPostCreate,
    service: Annotated[ForumService, Depends(get_forum_service)],
    user: Annotated[User, Depends(get_verified_user)],
) -> ForumPostOut:
    return await service.create_post(payload, user)


@router.get("/posts/{slug}", response_model=ForumPostOut)
async def get_post(
    slug: str,
    service: Annotated[ForumService, Depends(get_forum_service)],
    viewer: Annotated[User | None, Depends(get_optional_user)],
) -> ForumPostOut:
    return await service.get_post(slug, viewer)


@router.patch("/posts/{slug}", response_model=ForumPostOut)
async def update_post(
    slug: str,
    payload: ForumPostUpdate,
    service: Annotated[ForumService, Depends(get_forum_service)],
    user: Annotated[User, Depends(get_verified_user)],
) -> ForumPostOut:
    return await service.update_post(slug, payload, user)


@router.post("/posts/{slug}/like", response_model=ForumLikeOut)
async def toggle_post_like(
    slug: str,
    service: Annotated[ForumService, Depends(get_forum_service)],
    user: Annotated[User, Depends(get_verified_user)],
) -> ForumLikeOut:
    return await service.toggle_post_like(slug, user)


@router.post("/posts/{slug}/comments", response_model=ForumCommentOut)
async def add_comment(
    slug: str,
    payload: ForumCommentCreate,
    service: Annotated[ForumService, Depends(get_forum_service)],
    user: Annotated[User, Depends(get_verified_user)],
) -> ForumCommentOut:
    return await service.add_comment(slug, payload, user)


@router.patch("/posts/{slug}/comments/{comment_id}", response_model=ForumCommentOut)
async def update_comment(
    slug: str,
    comment_id: UUID,
    payload: ForumCommentUpdate,
    service: Annotated[ForumService, Depends(get_forum_service)],
    user: Annotated[User, Depends(get_verified_user)],
) -> ForumCommentOut:
    return await service.update_comment(slug, comment_id, payload, user)


@router.post(
    "/posts/{slug}/comments/{comment_id}/like", response_model=ForumLikeOut
)
async def toggle_comment_like(
    slug: str,
    comment_id: UUID,
    service: Annotated[ForumService, Depends(get_forum_service)],
    user: Annotated[User, Depends(get_verified_user)],
) -> ForumLikeOut:
    return await service.toggle_comment_like(slug, comment_id, user)
