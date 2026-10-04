from __future__ import annotations

import uuid

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from models.enums import UserRole
from models.user import User


class UserRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def get_alive_by_email(self, email: str) -> User | None:
        result = await self._session.execute(
            select(User).where(User.email == email, User.deleted_at.is_(None))
        )
        return result.scalar_one_or_none()

    async def get_alive_by_nickname(self, nickname: str) -> User | None:
        result = await self._session.execute(
            select(User).where(User.nickname == nickname, User.deleted_at.is_(None))
        )
        return result.scalar_one_or_none()

    async def get_alive_by_id(self, user_id: uuid.UUID) -> User | None:
        result = await self._session.execute(
            select(User).where(User.id == user_id, User.deleted_at.is_(None))
        )
        return result.scalar_one_or_none()

    def add(self, user: User) -> None:
        self._session.add(user)

    async def list_alive(self) -> list[User]:
        result = await self._session.execute(
            select(User)
            .where(User.deleted_at.is_(None))
            .order_by(User.email, User.id)
        )
        return list(result.scalars().all())

    async def count_role(self, role: UserRole) -> int:
        result = await self._session.execute(
            select(func.count())
            .select_from(User)
            .where(User.deleted_at.is_(None), User.role == role)
        )
        return int(result.scalar_one())
