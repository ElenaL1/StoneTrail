from typing import Annotated

from fastapi import APIRouter, Depends, Query, Request, Response
from fastapi.responses import RedirectResponse
from sqlalchemy.ext.asyncio import AsyncSession

from api.routes.auth import _public_user
from core.config import get_settings
from core.cookies import (
    OAUTH_COOKIE_NAME,
    clear_oauth_cookie,
    set_oauth_cookie,
    set_session_cookie,
)
from core.db import get_session
from core.deps import client_ip, get_auth_service, get_optional_session
from core.errors import AuthError
from schemas.auth import YandexCompleteRequest, YandexPendingResponse
from schemas.user import PublicUser
from services.auth import AuthService, ResolvedSession
from services.yandex_auth import (
    LINK_INTENT,
    LOGIN_INTENT,
    YandexAuthService,
    YandexRedirect,
)

router = APIRouter(prefix="/auth", tags=["auth"])


def get_yandex_service(
    session: Annotated[AsyncSession, Depends(get_session)],
) -> YandexAuthService:
    return YandexAuthService(session)


def _frontend(path: str) -> str:
    base = get_settings().frontend_base_url.rstrip("/")
    return f"{base}{path}"


def _redirect(
    outcome: YandexRedirect, oauth_cookie: str | None = None
) -> RedirectResponse:
    response = RedirectResponse(_frontend(outcome.path), status_code=302)
    if outcome.raw_session_token:
        set_session_cookie(response, outcome.raw_session_token)
    if outcome.clear_oauth_cookie:
        clear_oauth_cookie(response)
    elif oauth_cookie:
        set_oauth_cookie(response, oauth_cookie)
    return response


def _notice(path: str, code: str) -> RedirectResponse:
    response = RedirectResponse(_frontend(f"{path}?yandex={code}"), status_code=302)
    clear_oauth_cookie(response)
    return response


@router.get("/yandex")
async def yandex_start(
    request: Request,
    service: Annotated[YandexAuthService, Depends(get_yandex_service)],
    resolved: Annotated[ResolvedSession | None, Depends(get_optional_session)],
    intent: Annotated[str, Query()] = LOGIN_INTENT,
    next_path: Annotated[str | None, Query(alias="next")] = None,
) -> RedirectResponse:
    if not get_settings().yandex_enabled:
        return _notice("/login", "yandex_oauth_failed")
    link = intent == LINK_INTENT
    if link and resolved is None:
        return RedirectResponse(_frontend("/login?next=/profile"), status_code=302)
    try:
        started = await service.start(
            intent=LINK_INTENT if link else LOGIN_INTENT,
            user_id=resolved.user.id if link and resolved is not None else None,
            next_path=next_path,
            ip=client_ip(request),
        )
    except AuthError as exc:
        code = "rate_limited" if exc.code == "rate_limited" else "yandex_oauth_failed"
        target = "/profile" if link else "/login"
        return _notice(target, code)
    response = RedirectResponse(started.authorize_url, status_code=302)
    set_oauth_cookie(response, started.raw_state)
    return response


@router.get("/yandex/callback")
async def yandex_callback(
    request: Request,
    service: Annotated[YandexAuthService, Depends(get_yandex_service)],
    code: Annotated[str | None, Query()] = None,
    state: Annotated[str | None, Query()] = None,
    error: Annotated[str | None, Query()] = None,
) -> RedirectResponse:
    if not get_settings().yandex_enabled:
        return _notice("/login", "yandex_oauth_failed")
    oauth_cookie = request.cookies.get(OAUTH_COOKIE_NAME)
    outcome = await service.callback(
        cookie_state=oauth_cookie,
        query_state=state,
        code=code,
        error=error,
    )
    return _redirect(outcome, oauth_cookie)


@router.get("/yandex/pending", response_model=YandexPendingResponse)
async def yandex_pending(
    request: Request,
    service: Annotated[YandexAuthService, Depends(get_yandex_service)],
) -> YandexPendingResponse:
    if not get_settings().yandex_enabled:
        raise AuthError.yandex_oauth_failed()
    row = await service.pending(request.cookies.get(OAUTH_COOKIE_NAME))
    return YandexPendingResponse(
        email=row.email or "",
        suggested_nickname=await service.suggested_nickname(row),
        first_name=row.first_name,
        last_name=row.last_name,
    )


@router.post("/yandex/complete", response_model=PublicUser)
async def yandex_complete(
    payload: YandexCompleteRequest,
    request: Request,
    response: Response,
    service: Annotated[YandexAuthService, Depends(get_yandex_service)],
    auth: Annotated[AuthService, Depends(get_auth_service)],
) -> dict[str, object]:
    if not get_settings().yandex_enabled:
        raise AuthError.yandex_oauth_failed()
    user, raw_session = await service.complete(
        request.cookies.get(OAUTH_COOKIE_NAME), payload
    )
    set_session_cookie(response, raw_session)
    clear_oauth_cookie(response)
    return await _public_user(user, auth)
