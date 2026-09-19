from typing import Annotated

from fastapi import Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession

from core.cookies import SESSION_COOKIE_NAME
from core.db import get_session
from core.errors import AuthError
from models.user import User
from services.auth import AuthService, ResolvedSession
from services.catalog import CatalogService


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
    return await service.resolve_session(raw)


async def get_current_user(
    resolved: Annotated[ResolvedSession | None, Depends(get_optional_session)],
) -> User:
    if resolved is None:
        raise AuthError.invalid_credentials()
    return resolved.user
