from fastapi import Response

from core.config import get_settings

SESSION_COOKIE_NAME = "st_session"
OAUTH_COOKIE_NAME = "st_oauth"


def set_session_cookie(response: Response, token: str) -> None:
    settings = get_settings()
    response.set_cookie(
        key=SESSION_COOKIE_NAME,
        value=token,
        max_age=settings.session_ttl_seconds,
        httponly=True,
        samesite="lax",
        path="/",
        secure=settings.cookie_secure,
    )


def set_oauth_cookie(response: Response, token: str) -> None:
    settings = get_settings()
    response.set_cookie(
        key=OAUTH_COOKIE_NAME,
        value=token,
        max_age=settings.oauth_state_ttl_seconds,
        httponly=True,
        samesite="lax",
        path="/",
        secure=settings.cookie_secure,
    )


def clear_oauth_cookie(response: Response) -> None:
    settings = get_settings()
    response.delete_cookie(
        key=OAUTH_COOKIE_NAME,
        path="/",
        httponly=True,
        samesite="lax",
        secure=settings.cookie_secure,
    )


def clear_session_cookie(response: Response) -> None:
    settings = get_settings()
    response.delete_cookie(
        key=SESSION_COOKIE_NAME,
        path="/",
        httponly=True,
        samesite="lax",
        secure=settings.cookie_secure,
    )
