from __future__ import annotations

import uuid
from datetime import UTC, datetime

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from models.enums import AuthTokenType
from models.user import AuthToken


class AuthTokenRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def get_by_hash(
        self, token_hash: str, token_type: AuthTokenType
    ) -> AuthToken | None:
        result = await self._session.execute(
            select(AuthToken).where(
                AuthToken.token_hash == token_hash,
                AuthToken.type == token_type,
            )
        )
        return result.scalar_one_or_none()

    def add(self, token: AuthToken) -> None:
        self._session.add(token)

    async def invalidate_unused(
        self, user_id: uuid.UUID, token_type: AuthTokenType
    ) -> None:
        await self._session.execute(
            update(AuthToken)
            .where(
                AuthToken.user_id == user_id,
                AuthToken.type == token_type,
                AuthToken.used_at.is_(None),
            )
            .values(used_at=datetime.now(UTC))
        )
