from __future__ import annotations

import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from models.oauth import AuthIdentity

YANDEX_PROVIDER = "yandex"


class AuthIdentityRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def get_by_provider_user(
        self, provider: str, provider_user_id: str
    ) -> AuthIdentity | None:
        result = await self._session.execute(
            select(AuthIdentity).where(
                AuthIdentity.provider == provider,
                AuthIdentity.provider_user_id == provider_user_id,
            )
        )
        return result.scalar_one_or_none()

    async def get_for_user(
        self, user_id: uuid.UUID, provider: str
    ) -> AuthIdentity | None:
        result = await self._session.execute(
            select(AuthIdentity).where(
                AuthIdentity.user_id == user_id,
                AuthIdentity.provider == provider,
            )
        )
        return result.scalar_one_or_none()

    def add(self, identity: AuthIdentity) -> None:
        self._session.add(identity)
