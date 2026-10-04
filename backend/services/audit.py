from __future__ import annotations

import uuid
from typing import Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from models.audit import AuditEvent
from schemas.user import CamelModel


class AuditEventOut(CamelModel):
    id: Any
    actor_id: Any
    action: str
    entity_type: str
    entity_id: str
    detail: dict[str, Any]
    created_at: Any


async def list_audit(session: AsyncSession, *, limit: int = 100) -> list[AuditEventOut]:
    result = await session.scalars(
        select(AuditEvent).order_by(AuditEvent.created_at.desc()).limit(limit)
    )
    return [
        AuditEventOut(
            id=row.id,
            actor_id=row.actor_id,
            action=row.action,
            entity_type=row.entity_type,
            entity_id=row.entity_id,
            detail=row.detail,
            created_at=row.created_at,
        )
        for row in result.all()
    ]


async def record_audit(
    session: AsyncSession,
    *,
    actor_id: uuid.UUID | None,
    action: str,
    entity_type: str,
    entity_id: str,
    detail: dict[str, Any] | None = None,
) -> None:
    session.add(
        AuditEvent(
            actor_id=actor_id,
            action=action,
            entity_type=entity_type,
            entity_id=entity_id,
            detail=detail or {},
        )
    )
