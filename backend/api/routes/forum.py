from typing import Annotated

from fastapi import APIRouter, Depends

from core.deps import get_forum_service, get_verified_user
from models.user import User
from schemas.content import (
    CategoryOut,
    ForumCommentCreate,
    ForumCommentOut,
    ForumPostCreate,
    ForumPostOut,
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
    category: str | None = None,
) -> list[ForumPostOut]:
    return await service.list_posts(category=category)


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
) -> ForumPostOut:
    return await service.get_post(slug)


@router.post("/posts/{slug}/comments", response_model=ForumCommentOut)
async def add_comment(
    slug: str,
    payload: ForumCommentCreate,
    service: Annotated[ForumService, Depends(get_forum_service)],
    user: Annotated[User, Depends(get_verified_user)],
) -> ForumCommentOut:
    return await service.add_comment(slug, payload, user)
