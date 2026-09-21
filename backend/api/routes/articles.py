from typing import Annotated

from fastapi import APIRouter, Depends

from core.deps import (
    get_article_service,
    get_optional_user,
    get_staff_user,
    get_verified_user,
)
from models.user import User
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
from services.articles import ArticleService

router = APIRouter(prefix="/api/articles", tags=["articles"])


@router.get("/categories", response_model=list[CategoryOut])
async def list_categories(
    service: Annotated[ArticleService, Depends(get_article_service)],
) -> list[CategoryOut]:
    return await service.list_categories()


@router.get("/mine", response_model=list[ArticleOut])
async def list_mine(
    service: Annotated[ArticleService, Depends(get_article_service)],
    user: Annotated[User, Depends(get_verified_user)],
) -> list[ArticleOut]:
    return await service.list_mine(user)


@router.get("/moderation", response_model=list[ArticleOut])
async def list_moderation(
    service: Annotated[ArticleService, Depends(get_article_service)],
    _staff: Annotated[User, Depends(get_staff_user)],
) -> list[ArticleOut]:
    return await service.list_moderation()


@router.get("", response_model=list[ArticleOut])
async def list_articles(
    service: Annotated[ArticleService, Depends(get_article_service)],
    viewer: Annotated[User | None, Depends(get_optional_user)],
    category: str | None = None,
    sort: str = "newest",
    favorites: bool = False,
) -> list[ArticleOut]:
    return await service.list_published(
        viewer, category=category, sort=sort, favorites=favorites
    )


@router.post("", response_model=ArticleOut)
async def create_article(
    payload: ArticleWrite,
    service: Annotated[ArticleService, Depends(get_article_service)],
    user: Annotated[User, Depends(get_verified_user)],
) -> ArticleOut:
    return await service.create_draft(payload, user)


@router.get("/{slug}", response_model=ArticleOut)
async def get_article(
    slug: str,
    service: Annotated[ArticleService, Depends(get_article_service)],
    viewer: Annotated[User | None, Depends(get_optional_user)],
) -> ArticleOut:
    return await service.get_article(slug, viewer)


@router.patch("/{slug}", response_model=ArticleOut)
async def update_article(
    slug: str,
    payload: ArticleUpdate,
    service: Annotated[ArticleService, Depends(get_article_service)],
    user: Annotated[User, Depends(get_verified_user)],
) -> ArticleOut:
    return await service.update_article(slug, payload, user)


@router.post("/{slug}/submit", response_model=ArticleOut)
async def submit_article(
    slug: str,
    service: Annotated[ArticleService, Depends(get_article_service)],
    user: Annotated[User, Depends(get_verified_user)],
) -> ArticleOut:
    return await service.submit(slug, user)


@router.post("/{slug}/publish", response_model=ArticleOut)
async def publish_article(
    slug: str,
    service: Annotated[ArticleService, Depends(get_article_service)],
    user: Annotated[User, Depends(get_verified_user)],
) -> ArticleOut:
    return await service.publish(slug, user)


@router.post("/{slug}/moderate", response_model=ArticleOut)
async def moderate_article(
    slug: str,
    payload: ModerateArticleRequest,
    service: Annotated[ArticleService, Depends(get_article_service)],
    staff: Annotated[User, Depends(get_staff_user)],
) -> ArticleOut:
    return await service.moderate(slug, payload, staff)


@router.post("/{slug}/comments", response_model=ArticleCommentOut)
async def add_comment(
    slug: str,
    payload: ArticleCommentCreate,
    service: Annotated[ArticleService, Depends(get_article_service)],
    user: Annotated[User, Depends(get_verified_user)],
) -> ArticleCommentOut:
    return await service.add_comment(slug, payload, user)


@router.post("/{slug}/likes", response_model=ArticleLikeOut)
async def toggle_like(
    slug: str,
    service: Annotated[ArticleService, Depends(get_article_service)],
    user: Annotated[User, Depends(get_verified_user)],
) -> ArticleLikeOut:
    return await service.toggle_like(slug, user)
