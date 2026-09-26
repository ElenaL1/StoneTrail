from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from models.oauth import OauthState


class OauthStateRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def get_by_hash(self, state_hash: str) -> OauthState | None:
        result = await self._session.execute(
            select(OauthState).where(OauthState.state_hash == state_hash)
        )
        return result.scalar_one_or_none()

    def add(self, state: OauthState) -> None:
        self._session.add(state)
