from __future__ import annotations

import logging
import uuid
from dataclasses import dataclass
from datetime import UTC, datetime, timedelta

from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from core import messages
from core.config import Settings, get_settings
from core.errors import AuthError
from core.rate_limit import limiter
from core.security import (
    dummy_password_hash,
    generate_token,
    hash_password,
    hash_token,
    verify_password,
)
from models.enums import AuthTokenType, UserRole
from models.user import AuthToken, Session, User
from repositories.auth_identities import YANDEX_PROVIDER, AuthIdentityRepository
from repositories.auth_tokens import AuthTokenRepository
from repositories.sessions import SessionRepository
from repositories.users import UserRepository
from schemas.auth import (
    ChangeEmailRequest,
    ForgotPasswordRequest,
    LoginRequest,
    ProfileUpdateRequest,
    RegisterRequest,
    ResetPasswordRequest,
)
from schemas.user import parse_activity
from services.mail import AuthEmailKind, send_auth_email

logger = logging.getLogger(__name__)


@dataclass
class AuthOutcome:
    user: User | None = None
    raw_session_token: str | None = None
    clear_session_cookie: bool = False
    demo_verification_path: str | None = None
    demo_reset_path: str | None = None
    resend_available_at: int = 0


@dataclass
class ResolvedSession:
    user: User
    session: Session


def conflict_from_integrity(exc: IntegrityError) -> AuthError:
    detail = str(exc.orig) if getattr(exc, "orig", None) is not None else str(exc)
    if "users_nickname_alive_key" in detail:
        return AuthError.nickname_taken()
    return AuthError.email_taken()


class AuthService:
    def __init__(self, session: AsyncSession, settings: Settings | None = None) -> None:
        self._session = session
        self._settings = settings or get_settings()
        self._users = UserRepository(session)
        self._sessions = SessionRepository(session)
        self._tokens = AuthTokenRepository(session)
        self._identities = AuthIdentityRepository(session)

    async def resolve_session(self, raw_token: str) -> ResolvedSession | None:
        row = await self._sessions.get_alive_by_token_hash(hash_token(raw_token))
        if row is None:
            return None
        user = await self._users.get_alive_by_id(row.user_id)
        if user is None or not user.is_active:
            return None
        return ResolvedSession(user=user, session=row)

    async def register(self, data: RegisterRequest, *, ip: str) -> AuthOutcome:
        settings = self._settings
        rate_key = f"register:{ip}"
        retry = limiter.retry_after(
            rate_key, settings.register_max_attempts, settings.register_window_seconds
        )
        if retry is not None:
            raise AuthError.rate_limited(retry)

        existing = await self._users.get_alive_by_email(data.email)
        if existing is not None:
            limiter.hit(
                rate_key,
                settings.register_max_attempts,
                settings.register_window_seconds,
            )
            raise AuthError.email_taken()

        existing_nick = await self._users.get_alive_by_nickname(data.nickname)
        if existing_nick is not None:
            limiter.hit(
                rate_key,
                settings.register_max_attempts,
                settings.register_window_seconds,
            )
            raise AuthError.nickname_taken()

        limiter.hit(
            rate_key,
            settings.register_max_attempts,
            settings.register_window_seconds,
        )

        now = datetime.now(UTC)
        user = User(
            email=data.email,
            password_hash=hash_password(data.password),
            nickname=data.nickname,
            first_name=data.first_name,
            last_name=data.last_name,
            company=data.company.strip(),
            position=data.position.strip(),
            activity_type=parse_activity(data.activity_type),
            marketing_consent=data.marketing_consent,
            terms_accepted_at=now,
            role=UserRole.USER,
            email_verified=False,
        )
        self._users.add(user)
        try:
            await self._session.flush()
            raw_verify = await self._issue_token(user.id, AuthTokenType.VERIFY_EMAIL)
            raw_session = self._add_session(user.id)
            await self._session.commit()
        except IntegrityError as exc:
            await self._session.rollback()
            raise conflict_from_integrity(exc) from exc

        await self._session.refresh(user)
        path = f"/verify-email?token={raw_verify}"
        await self._deliver_link("verify", user.email, path)
        return AuthOutcome(
            user=user,
            raw_session_token=raw_session,
            demo_verification_path=self._debug_path(path),
        )

    async def login(self, data: LoginRequest, *, ip: str) -> AuthOutcome:
        del ip
        settings = self._settings
        rate_key = f"login:{data.email}"
        retry = limiter.retry_after(
            rate_key, settings.login_max_attempts, settings.login_window_seconds
        )
        if retry is not None:
            raise AuthError.rate_limited(retry)

        user = await self._users.get_alive_by_email(data.email)
        stored = user.password_hash if user is not None and user.is_active else None
        hashed = stored if stored else dummy_password_hash()
        password_ok = verify_password(data.password, hashed)
        if user is None or not user.is_active or not password_ok:
            limiter.hit(
                rate_key,
                settings.login_max_attempts,
                settings.login_window_seconds,
            )
            raise AuthError.invalid_credentials()

        limiter.clear(rate_key)
        user.last_login_at = datetime.now(UTC)
        raw_session = self._add_session(user.id)
        await self._session.commit()
        await self._session.refresh(user)
        return AuthOutcome(user=user, raw_session_token=raw_session)

    async def is_yandex_linked(self, user_id: uuid.UUID) -> bool:
        identity = await self._identities.get_for_user(user_id, YANDEX_PROVIDER)
        return identity is not None

    async def logout(self, resolved: ResolvedSession | None) -> AuthOutcome:
        if resolved is not None:
            await self._sessions.revoke(resolved.session.id)
            await self._session.commit()
        return AuthOutcome(clear_session_cookie=True)

    async def update_profile(
        self, user: User, data: ProfileUpdateRequest
    ) -> AuthOutcome:
        if data.nickname != user.nickname:
            taken = await self._users.get_alive_by_nickname(data.nickname)
            if taken is not None:
                raise AuthError.nickname_taken()
        user.nickname = data.nickname
        user.first_name = data.first_name
        user.last_name = data.last_name
        user.company = data.company
        user.position = data.position
        user.activity_type = parse_activity(data.activity_type)
        user.country = data.country
        user.city = data.city
        user.bio = data.bio
        user.website = data.website
        user.phone = data.phone
        user.marketing_consent = data.marketing_consent
        try:
            await self._session.commit()
        except IntegrityError as exc:
            await self._session.rollback()
            raise conflict_from_integrity(exc) from exc
        await self._session.refresh(user)
        return AuthOutcome(user=user)

    async def resend_verification(self, user: User, *, ip: str) -> AuthOutcome:
        if user.email_verified:
            return AuthOutcome(
                user=user,
                resend_available_at=0,
                demo_verification_path="/verify-email?status=confirmed",
            )

        settings = self._settings
        rate_key = f"resend:{user.id}:{ip}"
        retry = limiter.retry_after(rate_key, 1, settings.resend_cooldown_seconds)
        if retry is not None:
            raise AuthError(
                429,
                "rate_limited",
                messages.resend_wait(retry),
                retry_after_seconds=retry,
            )

        limiter.hit(rate_key, 1, settings.resend_cooldown_seconds)
        raw = await self._issue_token(user.id, AuthTokenType.VERIFY_EMAIL)
        await self._session.commit()
        path = f"/verify-email?token={raw}"
        await self._deliver_link("verify", user.email, path)
        return AuthOutcome(
            user=user,
            resend_available_at=limiter.available_at_ms(
                rate_key, settings.resend_cooldown_seconds
            ),
            demo_verification_path=self._debug_path(path),
        )

    async def change_email(
        self, user: User, data: ChangeEmailRequest, *, ip: str
    ) -> AuthOutcome:
        taken = await self._users.get_alive_by_email(data.email)
        if taken is not None and taken.id != user.id:
            raise AuthError.email_taken()

        user.email = data.email
        user.email_verified = False
        settings = self._settings
        rate_key = f"resend:{user.id}:{ip}"
        limiter.hit(rate_key, 1, settings.resend_cooldown_seconds)
        try:
            raw = await self._issue_token(user.id, AuthTokenType.VERIFY_EMAIL)
            await self._session.commit()
        except IntegrityError as exc:
            await self._session.rollback()
            raise conflict_from_integrity(exc) from exc

        await self._session.refresh(user)
        path = f"/verify-email?token={raw}"
        await self._deliver_link("verify", user.email, path)
        return AuthOutcome(
            user=user,
            resend_available_at=limiter.available_at_ms(
                rate_key, settings.resend_cooldown_seconds
            ),
            demo_verification_path=self._debug_path(path),
        )

    async def verify_email(
        self, raw_token: str, current: ResolvedSession | None
    ) -> AuthOutcome:
        record = await self._consume_token(raw_token, AuthTokenType.VERIFY_EMAIL)
        user = await self._users.get_alive_by_id(record.user_id)
        if user is None:
            raise AuthError.token("token_invalid", verify=True)

        record.used_at = datetime.now(UTC)
        user.email_verified = True
        raw_session: str | None = None
        if current is not None and current.user.id == user.id:
            pass
        else:
            if current is not None:
                await self._sessions.revoke(current.session.id)
            raw_session = self._add_session(user.id)
        await self._session.commit()
        await self._session.refresh(user)
        return AuthOutcome(user=user, raw_session_token=raw_session)

    async def forgot_password(
        self, data: ForgotPasswordRequest, *, ip: str
    ) -> AuthOutcome:
        del ip
        settings = self._settings
        rate_key = f"forgot:{data.email}"
        retry = limiter.retry_after(
            rate_key, settings.forgot_max_attempts, settings.forgot_window_seconds
        )
        if retry is not None:
            raise AuthError.rate_limited(retry)

        limiter.hit(
            rate_key,
            settings.forgot_max_attempts,
            settings.forgot_window_seconds,
        )
        user = await self._users.get_alive_by_email(data.email)
        path: str | None = None
        if user is not None:
            raw = await self._issue_token(user.id, AuthTokenType.RESET_PASSWORD)
            path = f"/reset-password?token={raw}"
        await self._session.commit()
        if user is not None and path is not None:
            await self._deliver_link("reset", user.email, path)
        demo_reset_path = None
        if settings.auth_debug_links:
            demo_reset_path = path or "/reset-password?token=invalid"
        return AuthOutcome(demo_reset_path=demo_reset_path)

    async def reset_password(self, data: ResetPasswordRequest) -> AuthOutcome:
        record = await self._consume_token(data.token, AuthTokenType.RESET_PASSWORD)
        user = await self._users.get_alive_by_id(record.user_id)
        if user is None:
            raise AuthError.token("token_invalid", verify=False)

        record.used_at = datetime.now(UTC)
        user.password_hash = hash_password(data.password)
        await self._sessions.revoke_all_for_user(user.id)
        await self._session.commit()
        return AuthOutcome(clear_session_cookie=True)

    async def _consume_token(self, raw: str, token_type: AuthTokenType) -> AuthToken:
        verify = token_type is AuthTokenType.VERIFY_EMAIL
        if not raw:
            raise AuthError.token("token_invalid", verify=verify)
        record = await self._tokens.get_by_hash(hash_token(raw), token_type)
        if record is None:
            raise AuthError.token("token_invalid", verify=verify)
        if record.used_at is not None:
            raise AuthError.token("token_used", verify=verify)
        expires_at = record.expires_at
        if expires_at.tzinfo is None:
            expires_at = expires_at.replace(tzinfo=UTC)
        if expires_at < datetime.now(UTC):
            raise AuthError.token("token_expired", verify=verify)
        return record

    async def _issue_token(self, user_id: uuid.UUID, token_type: AuthTokenType) -> str:
        await self._tokens.invalidate_unused(user_id, token_type)
        raw = generate_token()
        ttl = (
            self._settings.verify_token_ttl_seconds
            if token_type is AuthTokenType.VERIFY_EMAIL
            else self._settings.reset_token_ttl_seconds
        )
        self._tokens.add(
            AuthToken(
                user_id=user_id,
                type=token_type,
                token_hash=hash_token(raw),
                expires_at=datetime.now(UTC) + timedelta(seconds=ttl),
            )
        )
        return raw

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

    def _debug_path(self, path: str | None) -> str | None:
        if path is None or not self._settings.auth_debug_links:
            return None
        return path

    def _log_link(self, kind: str, email: str, path: str) -> None:
        if not self._settings.auth_debug_links:
            return
        base = self._settings.frontend_base_url.rstrip("/")
        logger.info("auth %s link for %s: %s%s", kind, email, base, path)

    async def _deliver_link(self, kind: AuthEmailKind, email: str, path: str) -> None:
        self._log_link(kind, email, path)
        await send_auth_email(kind, email, path)
