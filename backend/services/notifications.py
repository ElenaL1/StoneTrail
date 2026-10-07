from __future__ import annotations

import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from core.errors import ApiError
from models.content import Notification
from models.user import User
from repositories.notifications import NotificationRepository
from schemas.notifications import NotificationOut


class NotificationService:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session
        self._repo = NotificationRepository(session)

    async def list_for_user(self, user: User) -> list[NotificationOut]:
        rows = await self._repo.list_for_user(user.id)
        return [_out(row) for row in rows]

    async def mark_read(
        self, notification_id: uuid.UUID, user: User
    ) -> NotificationOut:
        row = await self._repo.get_for_user(notification_id, user.id)
        if row is None:
            raise ApiError.not_found()
        row.is_read = True
        await self._session.commit()
        return _out(row)

    async def mark_all_read(self, user: User) -> None:
        await self._repo.mark_all_read(user.id)
        await self._session.commit()


def _out(row: Notification) -> NotificationOut:
    return NotificationOut(
        id=row.id,
        type=row.type,
        title=row.title,
        message=row.message,
        is_read=row.is_read,
        created_at=row.created_at,
        entity_type=row.entity_type,
        entity_id=row.entity_id,
    )
