from typing import Annotated

from fastapi import APIRouter, Depends, Response

from core.deps import (
    get_admin_user,
    get_editor_user,
    get_news_service,
    get_optional_user,
    get_verified_user,
)
from models.user import User
from schemas.feed import LikeOut, NewsOut, NewsUpdate, NewsWrite
from services.news import NewsService

router = APIRouter(prefix="/api/news", tags=["news"])


@router.get("", response_model=list[NewsOut])
async def list_news(
    service: Annotated[NewsService, Depends(get_news_service)],
    viewer: Annotated[User | None, Depends(get_optional_user)],
) -> list[NewsOut]:
    return await service.list_published(viewer)


@router.get("/manage", response_model=list[NewsOut])
async def list_managed(
    service: Annotated[NewsService, Depends(get_news_service)],
    _editor: Annotated[User, Depends(get_editor_user)],
    deleted: bool = False,
) -> list[NewsOut]:
    return await service.list_managed(deleted=deleted)


@router.post("", response_model=NewsOut)
async def create_news(
    payload: NewsWrite,
    service: Annotated[NewsService, Depends(get_news_service)],
    editor: Annotated[User, Depends(get_editor_user)],
) -> NewsOut:
    return await service.create(payload, editor)


@router.get("/{slug}", response_model=NewsOut)
async def get_news(
    slug: str,
    service: Annotated[NewsService, Depends(get_news_service)],
    viewer: Annotated[User | None, Depends(get_optional_user)],
) -> NewsOut:
    return await service.get(slug, viewer)


@router.patch("/{slug}", response_model=NewsOut)
async def update_news(
    slug: str,
    payload: NewsUpdate,
    service: Annotated[NewsService, Depends(get_news_service)],
    editor: Annotated[User, Depends(get_editor_user)],
) -> NewsOut:
    return await service.update(slug, payload, editor)


@router.post("/{slug}/publish", response_model=NewsOut)
async def publish_news(
    slug: str,
    service: Annotated[NewsService, Depends(get_news_service)],
    editor: Annotated[User, Depends(get_editor_user)],
) -> NewsOut:
    return await service.publish(slug, editor)


@router.delete("/{slug}", status_code=204)
async def delete_news(
    slug: str,
    service: Annotated[NewsService, Depends(get_news_service)],
    admin: Annotated[User, Depends(get_admin_user)],
) -> Response:
    await service.hide(slug, admin)
    return Response(status_code=204)


@router.post("/{slug}/restore", response_model=NewsOut)
async def restore_news(
    slug: str,
    service: Annotated[NewsService, Depends(get_news_service)],
    admin: Annotated[User, Depends(get_admin_user)],
) -> NewsOut:
    return await service.restore(slug, admin)


@router.post("/{slug}/likes", response_model=LikeOut)
async def toggle_like(
    slug: str,
    service: Annotated[NewsService, Depends(get_news_service)],
    user: Annotated[User, Depends(get_verified_user)],
) -> LikeOut:
    return await service.toggle_like(slug, user)
