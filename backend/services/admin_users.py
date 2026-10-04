from __future__ import annotations

import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from core import messages
from core.errors import ApiError, AuthError
from models.enums import UserRole
from models.user import User
from repositories.users import UserRepository
from schemas.user import CamelModel
from services.audit import record_audit


class AdminUserOut(CamelModel):
    id: uuid.UUID
    email: str
    nickname: str
    role: UserRole


class RoleUpdate(CamelModel):
    role: UserRole


class AdminUserService:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session
        self._users = UserRepository(session)

    async def list_users(self) -> list[AdminUserOut]:
        rows = await self._users.list_alive()
        return [
            AdminUserOut(
                id=row.id, email=row.email, nickname=row.nickname, role=row.role
            )
            for row in rows
        ]

    async def set_role(
        self, user_id: uuid.UUID, payload: RoleUpdate, actor: User
    ) -> AdminUserOut:
        target = await self._users.get_alive_by_id(user_id)
        if target is None:
            raise ApiError.not_found()
        try:
            new_role = UserRole(payload.role)
        except ValueError as exc:
            raise AuthError.validation(
                messages.ROLE_INVALID, {"role": messages.ROLE_INVALID}
            ) from exc
        if target.role == UserRole.ADMIN and new_role != UserRole.ADMIN:
            if await self._users.count_role(UserRole.ADMIN) <= 1:
                raise ApiError.conflict(messages.LAST_ADMIN)
        previous = target.role.value
        target.role = new_role
        target.updated_by = actor.id
        await record_audit(
            self._session,
            actor_id=actor.id,
            action="role_change",
            entity_type="user",
            entity_id=str(target.id),
            detail={"from": previous, "to": new_role.value},
        )
        await self._session.commit()
        return AdminUserOut(
            id=target.id,
            email=target.email,
            nickname=target.nickname,
            role=target.role,
        )
