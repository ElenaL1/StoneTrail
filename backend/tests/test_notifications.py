from __future__ import annotations

import uuid
from datetime import UTC, datetime, timedelta

import pytest
from community_helpers import login, logout, register_verified
from httpx import AsyncClient

from core.db import SessionLocal
from models.content import Notification
from models.enums import NotificationType


async def _add(
    user_id: str,
    *,
    title: str,
    minutes_ago: int,
    is_read: bool = False,
) -> str:
    async with SessionLocal() as session:
        row = Notification(
            user_id=uuid.UUID(user_id),
            type=NotificationType.SYSTEM,
            title=title,
            message="Текст уведомления",
            is_read=is_read,
            created_at=datetime.now(UTC) - timedelta(minutes=minutes_ago),
        )
        session.add(row)
        await session.commit()
        await session.refresh(row)
        return str(row.id)


async def _user_id(client: AsyncClient) -> str:
    me = await client.get("/auth/me")
    assert me.status_code == 200, me.text
    return str(me.json()["id"])


@pytest.mark.asyncio
async def test_guest_cannot_read_notifications(client: AsyncClient) -> None:
    listed = await client.get("/api/notifications")
    assert listed.status_code == 401

    marked = await client.post("/api/notifications/read")
    assert marked.status_code == 401

    one = await client.post(f"/api/notifications/{uuid.uuid4()}/read")
    assert one.status_code == 401


@pytest.mark.asyncio
async def test_user_sees_only_own_and_can_mark_read(client: AsyncClient) -> None:
    owner = await register_verified(
        client, email="notes-owner@example.com", nickname="notesowner"
    )
    await login(client, str(owner["email"]))
    owner_id = await _user_id(client)
    await logout(client)

    other = await register_verified(
        client, email="notes-other@example.com", nickname="notesother"
    )
    await login(client, str(other["email"]))
    other_id = await _user_id(client)
    await logout(client)

    older = await _add(owner_id, title="Старое", minutes_ago=30)
    newer = await _add(owner_id, title="Новое", minutes_ago=1)
    foreign = await _add(other_id, title="Чужое", minutes_ago=0)

    await login(client, str(owner["email"]))
    listed = await client.get("/api/notifications")
    assert listed.status_code == 200, listed.text
    body = listed.json()
    assert [item["title"] for item in body] == ["Новое", "Старое"]
    assert body[0]["isRead"] is False
    assert body[0]["type"] == "system"
    assert body[0]["entityType"] is None
    assert body[0]["entityId"] is None
    assert body[0]["createdAt"]

    missing = await client.post(f"/api/notifications/{foreign}/read")
    assert missing.status_code == 404

    read = await client.post(f"/api/notifications/{newer}/read")
    assert read.status_code == 200, read.text
    assert read.json()["isRead"] is True

    after_one = await client.get("/api/notifications")
    by_id = {item["id"]: item["isRead"] for item in after_one.json()}
    assert by_id[newer] is True
    assert by_id[older] is False

    cleared = await client.post("/api/notifications/read")
    assert cleared.status_code == 204
    after_all = await client.get("/api/notifications")
    assert after_all.status_code == 200
    assert [item["isRead"] for item in after_all.json()] == [True, True]
