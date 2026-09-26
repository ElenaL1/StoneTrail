from __future__ import annotations

from dataclasses import dataclass

import httpx

from core.config import Settings

_AUTHORIZE_URL = "https://oauth.yandex.ru/authorize"
_TOKEN_URL = "https://oauth.yandex.ru/token"
_INFO_URL = "https://login.yandex.ru/info"
_SCOPES = "login:info login:email"


class YandexOAuthError(Exception):
    pass


@dataclass(frozen=True)
class YandexProfile:
    id: str
    email: str
    login: str
    first_name: str
    last_name: str


def authorize_url(settings: Settings, state: str) -> str:
    query = httpx.QueryParams(
        {
            "response_type": "code",
            "client_id": settings.yandex_client_id,
            "redirect_uri": settings.yandex_redirect_uri,
            "state": state,
            "scope": _SCOPES,
        }
    )
    return f"{_AUTHORIZE_URL}?{query}"


async def exchange_code_for_profile(settings: Settings, code: str) -> YandexProfile:
    if not code or not settings.yandex_enabled:
        raise YandexOAuthError
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            token_response = await client.post(
                _TOKEN_URL,
                data={
                    "grant_type": "authorization_code",
                    "code": code,
                    "client_id": settings.yandex_client_id,
                    "client_secret": settings.yandex_client_secret,
                    "redirect_uri": settings.yandex_redirect_uri,
                },
            )
            if token_response.status_code != 200:
                raise YandexOAuthError
            access_token = token_response.json().get("access_token")
            if not isinstance(access_token, str) or not access_token:
                raise YandexOAuthError
            info_response = await client.get(
                _INFO_URL,
                params={"format": "json"},
                headers={"Authorization": f"OAuth {access_token}"},
            )
            if info_response.status_code != 200:
                raise YandexOAuthError
            payload = info_response.json()
    except (httpx.HTTPError, ValueError) as exc:
        raise YandexOAuthError from exc

    if not isinstance(payload, dict):
        raise YandexOAuthError
    raw_id = payload.get("id")
    if raw_id is None or str(raw_id).strip() == "":
        raise YandexOAuthError
    email = payload.get("default_email")
    return YandexProfile(
        id=str(raw_id).strip(),
        email=email.strip() if isinstance(email, str) else "",
        login=str(payload.get("login") or "").strip(),
        first_name=str(payload.get("first_name") or "").strip(),
        last_name=str(payload.get("last_name") or "").strip(),
    )
