from typing import Annotated

from fastapi import Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession

from core.config import get_settings
from core.cookies import SESSION_COOKIE_NAME
from core.db import get_session
from core.errors import AuthError
from core.roles import is_admin, is_editor, is_staff
from models.user import User
from services.admin_users import AdminUserService
from services.articles import ArticleService
from services.auth import AuthService, ResolvedSession
from services.catalog import CatalogService
from services.forum import ForumService
from services.media import MediaService
from services.media_storage import ObjectStorage, S3Storage, UnconfiguredStorage
from services.news import NewsService
from services.notifications import NotificationService
from services.pages import PageContentService
from services.promotions import PromotionService


def client_ip(request: Request) -> str:
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()
    if request.client is not None:
        return request.client.host
    return "unknown"


async def get_auth_service(
    session: Annotated[AsyncSession, Depends(get_session)],
) -> AuthService:
    return AuthService(session)


async def get_catalog_service(
    session: Annotated[AsyncSession, Depends(get_session)],
) -> CatalogService:
    return CatalogService(session)


async def get_optional_session(
    request: Request,
    service: Annotated[AuthService, Depends(get_auth_service)],
) -> ResolvedSession | None:
    raw = request.cookies.get(SESSION_COOKIE_NAME)
    if not raw:
        return None
    resolved = await service.resolve_session(raw)
    if resolved is not None:
        request.state.user_id = str(resolved.user.id)
    return resolved


async def get_current_user(
    resolved: Annotated[ResolvedSession | None, Depends(get_optional_session)],
) -> User:
    if resolved is None:
        raise AuthError.invalid_credentials()
    return resolved.user


async def get_optional_user(
    resolved: Annotated[ResolvedSession | None, Depends(get_optional_session)],
) -> User | None:
    if resolved is None:
        return None
    return resolved.user


async def get_verified_user(
    user: Annotated[User, Depends(get_current_user)],
) -> User:
    if not user.email_verified:
        raise AuthError.unverified()
    return user


async def get_staff_user(
    user: Annotated[User, Depends(get_current_user)],
) -> User:
    if not is_staff(user.role):
        raise AuthError.forbidden()
    return user


async def get_editor_user(
    user: Annotated[User, Depends(get_current_user)],
) -> User:
    if not is_editor(user.role):
        raise AuthError.forbidden()
    return user


async def get_admin_user(
    user: Annotated[User, Depends(get_current_user)],
) -> User:
    if not is_admin(user.role):
        raise AuthError.forbidden()
    return user


async def get_article_service(
    session: Annotated[AsyncSession, Depends(get_session)],
) -> ArticleService:
    return ArticleService(session)


async def get_news_service(
    session: Annotated[AsyncSession, Depends(get_session)],
) -> NewsService:
    return NewsService(session)


async def get_notification_service(
    session: Annotated[AsyncSession, Depends(get_session)],
) -> NotificationService:
    return NotificationService(session)


def get_object_storage() -> ObjectStorage:
    settings = get_settings()
    if settings.s3_enabled:
        return S3Storage(settings)
    return UnconfiguredStorage()


async def get_forum_service(
    session: Annotated[AsyncSession, Depends(get_session)],
    storage: Annotated[ObjectStorage, Depends(get_object_storage)],
) -> ForumService:
    return ForumService(session, MediaService(session, storage))


async def get_media_service(
    session: Annotated[AsyncSession, Depends(get_session)],
    storage: Annotated[ObjectStorage, Depends(get_object_storage)],
) -> MediaService:
    return MediaService(session, storage)


async def get_promotion_service(
    session: Annotated[AsyncSession, Depends(get_session)],
    storage: Annotated[ObjectStorage, Depends(get_object_storage)],
) -> PromotionService:
    return PromotionService(session, storage)


async def get_admin_user_service(
    session: Annotated[AsyncSession, Depends(get_session)],
) -> AdminUserService:
    return AdminUserService(session)


async def get_page_service(
    session: Annotated[AsyncSession, Depends(get_session)],
) -> PageContentService:
    return PageContentService(session)
