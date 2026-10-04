from __future__ import annotations

import pytest
from community_helpers import login, register_verified, set_role
from httpx import AsyncClient

from models.enums import UserRole


async def _account(client: AsyncClient, email: str, nickname: str) -> dict[str, object]:
    account = await register_verified(client, email=email, nickname=nickname)
    await login(client, email)
    return account


@pytest.mark.asyncio
async def test_guest_cannot_change_roles(client: AsyncClient) -> None:
    response = await client.patch(
        "/api/admin/users/00000000-0000-0000-0000-000000000000/role",
        json={"role": "editor"},
    )
    assert response.status_code == 401


async def _user_id(client: AsyncClient, email: str) -> str:
    await login(client, email)
    me = await client.get("/auth/me")
    assert me.status_code == 200, me.text
    return str(me.json()["id"])


@pytest.mark.asyncio
async def test_editor_cannot_assign_roles(client: AsyncClient) -> None:
    editor = await _account(client, "editor-roles@example.com", "editor-roles")
    member = await _account(client, "member-roles@example.com", "member-roles")
    member_id = await _user_id(client, str(member["email"]))
    await set_role(str(editor["email"]), UserRole.EDITOR)
    await login(client, str(editor["email"]))
    response = await client.patch(
        f"/api/admin/users/{member_id}/role",
        json={"role": "moderator"},
    )
    assert response.status_code == 403
    assert response.json()["code"] == "forbidden"


@pytest.mark.asyncio
async def test_admin_changes_role_and_cannot_drop_last_admin(
    client: AsyncClient,
) -> None:
    admin = await _account(client, "admin-roles@example.com", "admin-roles")
    member = await _account(client, "member-admin@example.com", "member-admin")
    member_id = await _user_id(client, str(member["email"]))
    await set_role(str(admin["email"]), UserRole.ADMIN)
    await login(client, str(admin["email"]))

    me = await client.get("/auth/me")
    assert me.status_code == 200
    admin_id = me.json()["id"]

    promoted = await client.patch(
        f"/api/admin/users/{member_id}/role",
        json={"role": "editor"},
    )
    assert promoted.status_code == 200, promoted.text
    assert promoted.json()["role"] == "editor"

    demoted = await client.patch(
        f"/api/admin/users/{admin_id}/role",
        json={"role": "editor"},
    )
    assert demoted.status_code == 409
    assert demoted.json()["code"] == "conflict"
