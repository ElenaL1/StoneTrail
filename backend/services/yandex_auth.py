from __future__ import annotations

import secrets
import uuid
from dataclasses import dataclass
from datetime import UTC, datetime, timedelta
from urllib.parse import quote

from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from core.config import Settings, get_settings
from core.errors import AuthError
from core.rate_limit import limiter
from core.security import (
    email_error,
    generate_token,
    hash_token,
    normalize_email,
    person_name_error,
)
from models.enums import UserRole
from models.oauth import AuthIdentity, OauthState
from models.user import Session, User
from repositories.auth_identities import YANDEX_PROVIDER, AuthIdentityRepository
from repositories.oauth_states import OauthStateRepository
from repositories.sessions import SessionRepository
from repositories.users import UserRepository
from schemas.auth import YandexCompleteRequest
from services.auth import conflict_from_integrity
from services.yandex_client import (
    YandexOAuthError,
    YandexProfile,
    authorize_url,
    exchange_code_for_profile,
)

LOGIN_INTENT = "login"
LINK_INTENT = "link"


@dataclass
class YandexStart:
    raw_state: str
    authorize_url: str


@dataclass
class YandexRedirect:
    path: str
    clear_oauth_cookie: bool = True
    raw_session_token: str | None = None


def tokens_match(left: str, right: str) -> bool:
    if len(left) != len(right):
        return False
    return secrets.compare_digest(left, right)


def safe_next_path(value: str | None, fallback: str = "/profile") -> str:
    if not value or len(value) > 512:
        return fallback
    if not value.startswith("/") or value.startswith("//") or "://" in value:
        return fallback
    return value


def _aware(value: datetime) -> datetime:
    if value.tzinfo is None:
        return value.replace(tzinfo=UTC)
    return value


def _optional_name(value: str, field: str) -> str:
    if person_name_error(value, field, required=False):
        return ""
    return value.strip()


class YandexAuthService:
    def __init__(self, session: AsyncSession, settings: Settings | None = None) -> None:
        self._session = session
        self._settings = settings or get_settings()
        self._users = UserRepository(session)
        self._sessions = SessionRepository(session)
        self._identities = AuthIdentityRepository(session)
        self._states = OauthStateRepository(session)

    async def start(
        self,
        *,
        intent: str,
        user_id: uuid.UUID | None,
        next_path: str | None,
        ip: str,
    ) -> YandexStart:
        if not self._settings.yandex_enabled:
            raise AuthError.yandex_oauth_failed()
        settings = self._settings
        rate_key = f"yandex:{ip}"
        retry = limiter.retry_after(
            rate_key, settings.login_max_attempts, settings.login_window_seconds
        )
        if retry is not None:
            raise AuthError.rate_limited(retry)
        limiter.hit(
            rate_key, settings.login_max_attempts, settings.login_window_seconds
        )

        raw = generate_token()
        self._states.add(
            OauthState(
                state_hash=hash_token(raw),
                intent=intent,
                user_id=user_id,
                provider=YANDEX_PROVIDER,
                next_path=safe_next_path(next_path),
                expires_at=self._expires_at(),
            )
        )
        await self._session.commit()
        return YandexStart(raw_state=raw, authorize_url=authorize_url(settings, raw))

    async def callback(
        self,
        *,
        cookie_state: str | None,
        query_state: str | None,
        code: str | None,
        error: str | None,
    ) -> YandexRedirect:
        if (
            not cookie_state
            or not query_state
            or not tokens_match(cookie_state, query_state)
        ):
            return YandexRedirect(
                path=self._login_path("yandex_state_invalid"),
                clear_oauth_cookie=False,
            )
        row = await self._states.get_by_hash(hash_token(cookie_state))
        if row is None:
            return YandexRedirect(path=self._login_path("yandex_state_invalid"))
        if self._expired(row) or row.used_at is not None or row.finished_at is not None:
            return YandexRedirect(path=self._login_path("yandex_state_invalid"))

        if error:
            await self._finish(row)
            code_name = (
                "yandex_oauth_cancelled"
                if error == "access_denied"
                else "yandex_oauth_failed"
            )
            target = (
                "/profile" if row.intent == LINK_INTENT else self._login_path(code_name)
            )
            if row.intent == LINK_INTENT:
                target = f"/profile?yandex={code_name}"
            return YandexRedirect(path=target)

        if not code:
            await self._finish(row)
            return YandexRedirect(path=self._failure_path(row, "yandex_oauth_failed"))

        try:
            profile = await exchange_code_for_profile(self._settings, code)
        except YandexOAuthError:
            await self._finish(row)
            return YandexRedirect(path=self._failure_path(row, "yandex_oauth_failed"))

        row.used_at = datetime.now(UTC)
        if row.intent == LINK_INTENT:
            return await self._link(row, profile)

        identity = await self._identities.get_by_provider_user(
            YANDEX_PROVIDER, profile.id
        )
        if identity is not None:
            redirect = await self._login_identity(row, identity.user_id)
            if redirect is not None:
                return redirect
            await self._finish(row)
            return YandexRedirect(path=self._login_path("yandex_oauth_failed"))

        email = self._profile_email(profile)
        if email is None:
            await self._finish(row)
            return YandexRedirect(path=self._login_path("yandex_no_email"))

        existing = await self._users.get_alive_by_email(email)
        if existing is not None:
            await self._finish(row)
            return YandexRedirect(path=self._login_path("link_required"))

        row.provider_user_id = profile.id
        row.email = email
        row.provider_login = profile.login
        row.first_name = _optional_name(profile.first_name, "firstName")
        row.last_name = _optional_name(profile.last_name, "lastName")
        row.expires_at = self._expires_at()
        await self._session.commit()
        return YandexRedirect(path="/register/yandex", clear_oauth_cookie=False)

    async def pending(self, cookie_state: str | None) -> OauthState:
        row = await self._pending_row(cookie_state)
        if row is None:
            raise AuthError.yandex_state_invalid()
        return row

    async def suggested_nickname(self, row: OauthState) -> str:
        login = (row.provider_login or "").strip()
        if person_name_error(login, "nickname"):
            return ""
        taken = await self._users.get_alive_by_nickname(login)
        if taken is not None:
            return ""
        return login

    async def complete(
        self, cookie_state: str | None, data: YandexCompleteRequest
    ) -> tuple[User, str]:
        row = await self._pending_row(cookie_state)
        if row is None or row.email is None or row.provider_user_id is None:
            raise AuthError.yandex_state_invalid()

        taken_nick = await self._users.get_alive_by_nickname(data.nickname)
        if taken_nick is not None:
            raise AuthError.nickname_taken()
        taken_email = await self._users.get_alive_by_email(row.email)
        if taken_email is not None:
            raise AuthError.email_taken()
        taken_identity = await self._identities.get_by_provider_user(
            YANDEX_PROVIDER, row.provider_user_id
        )
        if taken_identity is not None:
            raise AuthError.yandex_already_linked()

        now = datetime.now(UTC)
        user = User(
            email=row.email,
            password_hash=None,
            nickname=data.nickname,
            first_name=row.first_name,
            last_name=row.last_name,
            terms_accepted_at=now,
            role=UserRole.USER,
            email_verified=True,
            last_login_at=now,
        )
        self._users.add(user)
        try:
            await self._session.flush()
            self._identities.add(
                AuthIdentity(
                    user_id=user.id,
                    provider=YANDEX_PROVIDER,
                    provider_user_id=row.provider_user_id,
                )
            )
            row.finished_at = now
            raw_session = self._add_session(user.id)
            await self._session.commit()
        except IntegrityError as exc:
            await self._session.rollback()
            detail = (
                str(exc.orig) if getattr(exc, "orig", None) is not None else str(exc)
            )
            if "auth_identities" in detail:
                raise AuthError.yandex_already_linked() from exc
            raise conflict_from_integrity(exc) from exc

        await self._session.refresh(user)
        return user, raw_session

    async def _link(self, row: OauthState, profile: YandexProfile) -> YandexRedirect:
        if row.user_id is None:
            await self._finish(row)
            return YandexRedirect(path=self._login_path("yandex_state_invalid"))
        user = await self._users.get_alive_by_id(row.user_id)
        if user is None or not user.is_active:
            await self._finish(row)
            return YandexRedirect(path=self._login_path("yandex_oauth_failed"))

        identity = await self._identities.get_by_provider_user(
            YANDEX_PROVIDER, profile.id
        )
        if identity is not None and identity.user_id != user.id:
            await self._finish(row)
            return YandexRedirect(path="/profile?yandex=already_linked")
        if identity is None:
            self._identities.add(
                AuthIdentity(
                    user_id=user.id,
                    provider=YANDEX_PROVIDER,
                    provider_user_id=profile.id,
                )
            )
        try:
            row.finished_at = datetime.now(UTC)
            raw_session = self._add_session(user.id)
            await self._session.commit()
        except IntegrityError as exc:
            await self._session.rollback()
            detail = (
                str(exc.orig) if getattr(exc, "orig", None) is not None else str(exc)
            )
            if "auth_identities" in detail:
                return YandexRedirect(path="/profile?yandex=already_linked")
            raise
        return YandexRedirect(
            path="/profile?yandex=linked", raw_session_token=raw_session
        )

    async def _login_identity(
        self, row: OauthState, user_id: uuid.UUID
    ) -> YandexRedirect | None:
        user = await self._users.get_alive_by_id(user_id)
        if user is None or not user.is_active:
            return None
        user.last_login_at = datetime.now(UTC)
        row.finished_at = datetime.now(UTC)
        raw_session = self._add_session(user.id)
        await self._session.commit()
        return YandexRedirect(
            path=safe_next_path(row.next_path),
            raw_session_token=raw_session,
        )

    async def _pending_row(self, cookie_state: str | None) -> OauthState | None:
        if not cookie_state:
            return None
        row = await self._states.get_by_hash(hash_token(cookie_state))
        if row is None or row.intent != LOGIN_INTENT:
            return None
        if row.used_at is None or row.finished_at is not None or self._expired(row):
            return None
        if not row.provider_user_id or not row.email:
            return None
        return row

    async def _finish(self, row: OauthState) -> None:
        now = datetime.now(UTC)
        row.used_at = now
        row.finished_at = now
        await self._session.commit()

    def _add_session(self, user_id: uuid.UUID) -> str:
        raw = generate_token()
        self._sessions.add(
            Session(
                user_id=user_id,
                token_hash=hash_token(raw),
                expires_at=datetime.now(UTC)
                + timedelta(seconds=self._settings.session_ttl_seconds),
            )
        )
        return raw

    def _expires_at(self) -> datetime:
        return datetime.now(UTC) + timedelta(
            seconds=self._settings.oauth_state_ttl_seconds
        )

    def _expired(self, row: OauthState) -> bool:
        return _aware(row.expires_at) < datetime.now(UTC)

    def _profile_email(self, profile: YandexProfile) -> str | None:
        if email_error(profile.email):
            return None
        return normalize_email(profile.email)

    def _login_path(self, code: str) -> str:
        return f"/login?yandex={quote(code)}"

    def _failure_path(self, row: OauthState, code: str) -> str:
        if row.intent == LINK_INTENT:
            return f"/profile?yandex={quote(code)}"
        return self._login_path(code)
